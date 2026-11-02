import { findBadWords } from "@/lib/moderation";
import {
    INTENTS,
    TOPICS,
    type Bilingual,
    type BotAction,
    type BotContext,
    type BotIntent,
    type BotTopic,
    type TopicId,
} from "@/lib/tribobot/knowledge";

// TriboBot runs fully on the phone: it scores what the user typed against
// the keywords in knowledge.ts and picks the best answer. nothing is sent
// to a server or saved

export interface Suggestion {
    label: Bilingual;
    intentId: string;
}

export interface BotReply {
    text: Bilingual;
    actions: BotAction[];
    // shown as a list inside the message, e.g. a topic's questions
    list: Suggestion[];
    // shown as chips under the newest message
    chips: Suggestion[];
    // show the topic grid, for the welcome and "menu" replies
    showTopics: boolean;
    urgent: boolean;
}

// ---------- text matching ----------

const ACCENTS: Record<string, string> = {
    á: "a",
    à: "a",
    â: "a",
    ä: "a",
    é: "e",
    è: "e",
    ê: "e",
    ë: "e",
    í: "i",
    ì: "i",
    î: "i",
    ï: "i",
    ó: "o",
    ò: "o",
    ô: "o",
    ö: "o",
    ú: "u",
    ù: "u",
    û: "u",
    ü: "u",
    ñ: "n",
};

// Tagalog verb prefixes, so "magreport" and "nireport" match "report"
const PREFIXES = [
    "mag",
    "nag",
    "pag",
    "maka",
    "naka",
    "ipa",
    "ma",
    "na",
    "ni",
    "pa",
    "i",
];

// lowercase, no accents, no hyphens ("mag-post" -> "magpost"), and any
// other punctuation becomes a space. "*" is kept for the "***" question
export function normalize(text: string): string {
    return text
        .toLowerCase()
        .replace(/[áàâäéèêëíìîïóòôöúùûüñ]/g, (ch) => ACCENTS[ch] ?? ch)
        .replace(/[-']/g, "")
        .replace(/[^a-z0-9*\s]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

// small typo check: "emergncy" still means "emergency"
function editDistance(a: string, b: string, max: number): number {
    if (Math.abs(a.length - b.length) > max) return max + 1;
    let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
        const curr = [i];
        let rowMin = i;
        for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            curr[j] = Math.min(
                prev[j] + 1,
                curr[j - 1] + 1,
                prev[j - 1] + cost,
            );
            rowMin = Math.min(rowMin, curr[j]);
        }
        if (rowMin > max) return max + 1;
        prev = curr;
    }
    return prev[b.length];
}

// how well one word the user typed matches one keyword
function wordScore(token: string, keyword: string): number {
    if (token === keyword) return 2;
    if (keyword.length >= 4) {
        // English endings: "verified", "reports"
        if (token.startsWith(keyword) && token.length - keyword.length <= 4)
            return 1.5;
        // Tagalog prefixes: "magreport", "iverify"
        if (PREFIXES.some((p) => token === p + keyword)) return 1.5;
    }
    if (keyword.length >= 5 && token.length >= 5) {
        const allowed = keyword.length >= 8 ? 2 : 1;
        if (editDistance(token, keyword, allowed) <= allowed) return 1;
    }
    return 0;
}

// phrases add up, but each word the user typed only counts once (its best
// keyword match), so an intent with many similar keywords doesn't win
// just by having more of them
function intentScore(
    intent: BotIntent,
    text: string,
    tokens: string[],
): number {
    const padded = ` ${text} `;
    const words: string[] = [];
    let score = 0;
    for (const raw of intent.keywords) {
        const keyword = normalize(raw);
        if (!keyword) continue;
        if (keyword.includes(" ")) {
            // phrases count more the longer they are
            if (padded.includes(` ${keyword} `))
                score += 1.5 * keyword.split(" ").length;
        } else {
            words.push(keyword);
        }
    }
    for (const token of tokens) {
        let best = 0;
        for (const keyword of words) {
            best = Math.max(best, wordScore(token, keyword));
            if (best === 2) break;
        }
        score += best;
    }
    return score;
}

function visibleIntents(ctx: BotContext): BotIntent[] {
    // the admin topic is only listed for admins, but its intents without
    // adminOnly (like making an announcement) can still be asked by anyone
    return INTENTS.filter((intent) => !intent.adminOnly || ctx.isAdmin);
}

// the best intents for the text, highest score first. ties keep the order
// of INTENTS, so specific intents placed higher win
function rankIntents(
    input: string,
    ctx: BotContext,
): { intent: BotIntent; score: number }[] {
    const text = normalize(input);
    const tokens = text.split(" ").filter(Boolean);
    if (tokens.length === 0) return [];
    return visibleIntents(ctx)
        .map((intent) => ({ intent, score: intentScore(intent, text, tokens) }))
        .filter((r) => r.score > 0)
        .sort((a, b) => b.score - a.score);
}

// ---------- building replies ----------

const MIN_CONFIDENT_SCORE = 1.5;

// a plain answer with no buttons or suggestions
export function textReply(text: Bilingual): BotReply {
    return {
        text,
        actions: [],
        list: [],
        chips: [],
        showTopics: false,
        urgent: false,
    };
}

function toSuggestion(intent: BotIntent): Suggestion {
    return { label: intent.question, intentId: intent.id };
}

function suggestionsFor(
    ids: string[] | undefined,
    ctx: BotContext,
): Suggestion[] {
    const visible = visibleIntents(ctx);
    return (ids ?? [])
        .map((id) => visible.find((intent) => intent.id === id))
        .filter((intent): intent is BotIntent => !!intent)
        .map(toSuggestion);
}

export function replyForIntent(intent: BotIntent, ctx: BotContext): BotReply {
    const text =
        typeof intent.answer === "function"
            ? intent.answer(ctx)
            : intent.answer;
    const actions =
        typeof intent.actions === "function"
            ? intent.actions(ctx)
            : (intent.actions ?? []);
    return {
        ...textReply(text),
        actions,
        chips: suggestionsFor(intent.followUps, ctx),
        urgent: intent.urgent === true,
    };
}

export function replyForIntentId(id: string, ctx: BotContext): BotReply | null {
    const intent = visibleIntents(ctx).find((i) => i.id === id);
    return intent ? replyForIntent(intent, ctx) : null;
}

export function topicsFor(ctx: BotContext): BotTopic[] {
    return TOPICS.filter((topic) => !topic.adminOnly || ctx.isAdmin);
}

export function replyForTopic(topicId: TopicId, ctx: BotContext): BotReply {
    const topic = TOPICS.find((t) => t.id === topicId);
    const questions = visibleIntents(ctx).filter((i) => i.topic === topicId);
    return {
        ...textReply({
            tl: `Narito ang mga madalas itanong tungkol sa **${topic?.label.tl ?? ""}**. Pumili ng isa, o i-type ang sarili mong tanong:`,
            en: `Here are common questions about **${topic?.label.en ?? ""}**. Pick one, or type your own question:`,
        }),
        list: questions.map(toSuggestion),
        urgent: topicId === "emergency",
    };
}

export function welcomeReply(ctx: BotContext): BotReply {
    return {
        ...textReply({
            tl: `Kumusta, ${ctx.name}! 👋 Ako si **Tribo**, ang iyong katulong sa TriboConnect.\n\nMagtanong lang, o pumili ng paksa sa ibaba:`,
            en: `Hi, ${ctx.name}! 👋 I'm **Tribo**, your TriboConnect helper.\n\nJust ask, or pick a topic below:`,
        }),
        showTopics: true,
        // things a new user most likely needs
        chips: suggestionsFor(
            ctx.isVerified || ctx.isAdmin
                ? ["report-how", "emergency-hotlines", "all-pages"]
                : ["verify", "emergency-hotlines", "all-pages"],
            ctx,
        ),
    };
}

export function menuReply(): BotReply {
    return {
        ...textReply({
            tl: "Sige! Pumili ng paksa:",
            en: "Sure! Pick a topic:",
        }),
        showTopics: true,
    };
}

// answer to anything the user typed
export function replyToText(input: string, ctx: BotContext): BotReply {
    if (findBadWords(input).length > 0) {
        return {
            ...textReply({
                tl: "🙏 Pakigamit po ang magalang na salita para matulungan kita nang maayos. Ano ang maitutulong ko?",
                en: "🙏 Please use respectful language so I can help you properly. What can I help you with?",
            }),
            chips: suggestionsFor(["all-pages", "report-how"], ctx),
        };
    }

    const ranked = rankIntents(input, ctx);
    const best = ranked[0];
    if (best && best.score >= MIN_CONFIDENT_SCORE) {
        return replyForIntent(best.intent, ctx);
    }

    // a weak match, probably a typo: ask what they meant
    if (ranked.length > 0) {
        return {
            ...textReply({
                tl: "Hmm, hindi ako sigurado. 🤔 Ito ba ang ibig mong sabihin?",
                en: "Hmm, I'm not sure. 🤔 Did you mean one of these?",
            }),
            list: ranked.slice(0, 3).map((r) => toSuggestion(r.intent)),
        };
    }

    return {
        ...textReply({
            tl: "Pasensya, hindi ko pa alam ang sagot diyan. 😅 Subukang itanong sa ibang paraan, pumili ng paksa sa ibaba, o tingnan ang Tulong at FAQ.",
            en: "Sorry, I don't know the answer to that yet. 😅 Try asking another way, pick a topic below, or check the Help and FAQ.",
        }),
        showTopics: true,
        actions: replyForIntentId("help-faq", ctx)?.actions ?? [],
    };
}

// how long Tribo "types" before answering. longer answers take longer,
// emergencies are answered almost right away
export function typingDelay(reply: BotReply): number {
    if (reply.urgent) return 450 + Math.random() * 150;
    const length = reply.text.en.length;
    const base = 650 + Math.min(length, 400) * 3.5;
    return Math.min(base, 2200) + Math.random() * 300;
}
