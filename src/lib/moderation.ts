import { BAD_WORDS } from "@/constants/bad-words";
import {
    fetchMyReports,
    type Report,
    type ReportInput,
} from "@/lib/reports";
import AsyncStorage from "@react-native-async-storage/async-storage";

// spam and bad word checks. these only run in the app, the Firestore rules
// and Cloud Functions don't enforce them

// ---------- bad words ----------

// number and symbol swaps people use to get around filters. every swap is
// one character, so a match in the normalized text has the same position
// in the original
const LOOKALIKES: Record<string, string> = {
    "0": "o",
    "1": "i",
    "3": "e",
    "4": "a",
    "5": "s",
    "7": "t",
    "@": "a",
    $: "s",
};

const SUFFIX = "(?:s|es|ng|ing|in|er|ers|ed|y)?";

function escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\-]/g, "\\$&");
}

// "gago" -> g+[a*]+[g*]+[o*]+ so stretched letters and "g*go" still match.
// the first letter has to be a real letter or "****" would match everything
function wordPattern(word: string): string {
    return word
        .trim()
        .toLowerCase()
        .split(/\s+/)
        .map((part) =>
            [...part]
                .map((ch, i) =>
                    i === 0 ? `${escapeRegex(ch)}+` : `[${escapeRegex(ch)}*]+`,
                )
                .join(""),
        )
        .join("[^a-z]*");
}

function buildBadWordRegex(): RegExp | null {
    const words = BAD_WORDS.map((w) => w.trim()).filter(Boolean);
    if (words.length === 0) return null;
    // longest first so "putang ina" is caught whole instead of just "puta"
    const alternatives = [...new Set(words)]
        .sort((a, b) => b.length - a.length)
        .map(wordPattern)
        .join("|");
    // group 1 is the character before the word, group 2 is the word itself
    return new RegExp(
        `(^|[^a-z])((?:${alternatives})${SUFFIX})(?=[^a-z]|$)`,
        "g",
    );
}

const BAD_WORD_REGEX = buildBadWordRegex();

function normalize(text: string): string {
    let out = "";
    for (let i = 0; i < text.length; i++) {
        const lower = text[i].toLowerCase();
        const ch = lower.length === 1 ? lower : text[i];
        out += LOOKALIKES[ch] ?? ch;
    }
    return out;
}

// start and end of every bad word in the text
function badWordRanges(text: string): [number, number][] {
    if (!BAD_WORD_REGEX) return [];
    const ranges: [number, number][] = [];
    const normalized = normalize(text);
    BAD_WORD_REGEX.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = BAD_WORD_REGEX.exec(normalized)) !== null) {
        const start = match.index + match[1].length;
        ranges.push([start, start + match[2].length]);
    }
    return ranges;
}

// the bad words found in the text, as the user typed them
export function findBadWords(text: string): string[] {
    const found = badWordRanges(text).map(([start, end]) =>
        text.slice(start, end),
    );
    return [...new Set(found)];
}

// replaces every bad word with *, keeping the spaces in phrases
export function censorBadWords(text: string): string {
    let out = text;
    for (const [start, end] of badWordRanges(text)) {
        out =
            out.slice(0, start) +
            out.slice(start, end).replace(/\S/g, "*") +
            out.slice(end);
    }
    return out;
}

// ---------- posts, comments and messages per minute ----------

export const RATE_LIMITS = {
    post: { max: 3, windowMs: 60 * 1000 },
    comment: { max: 5, windowMs: 60 * 1000 },
    message: { max: 15, windowMs: 60 * 1000 },
} as const;

export type RateLimitedAction = keyof typeof RATE_LIMITS;

// when the user last did each action. saved on the phone so closing the
// app doesn't reset the limit
const actionTimes = new Map<string, number[]>();

async function loadTimes(key: string): Promise<number[]> {
    const cached = actionTimes.get(key);
    if (cached) return cached;
    let stored: number[] = [];
    try {
        const raw = await AsyncStorage.getItem(key);
        if (raw) stored = JSON.parse(raw);
    } catch (err) {
        console.warn("Load rate limit error:", err);
    }
    return Array.isArray(stored) ? stored : [];
}

// counts the action and returns 0 if it's allowed. otherwise returns how
// many seconds the user has to wait, and the action isn't counted
export async function takeRateLimit(
    action: RateLimitedAction,
    uid: string,
): Promise<number> {
    const { max, windowMs } = RATE_LIMITS[action];
    const key = `rateLimit:${action}:${uid}`;
    const now = Date.now();
    // "t <= now" drops times from the future if the phone's clock was changed
    const recent = (await loadTimes(key)).filter(
        (t) => t <= now && now - t < windowMs,
    );

    if (recent.length >= max) {
        actionTimes.set(key, recent);
        return Math.max(1, Math.ceil((recent[0] + windowMs - now) / 1000));
    }

    recent.push(now);
    actionTimes.set(key, recent);
    AsyncStorage.setItem(key, JSON.stringify(recent)).catch((err) =>
        console.warn("Save rate limit error:", err),
    );
    return 0;
}

// ---------- duplicate reports ----------

// the same report can't be sent again within this time
const DUPLICATE_REPORT_MS = 24 * 60 * 60 * 1000;

// so "Baha sa Purok 2!" and "baha sa purok 2" count as the same
function simplify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9ñ]+/g, " ")
        .trim();
}

function sameCategories(a: string[], b: string[]): boolean {
    return [...a].sort().join(",") === [...b].sort().join(",");
}

// a duplicate is a report with the same details, or the same title and
// types, as one this user sent in the last 24 hours. checked against the
// reports saved in Firestore, so it works on every phone the user logs into
export async function isDuplicateReport(
    uid: string,
    report: ReportInput,
): Promise<boolean> {
    let sent: Report[];
    try {
        sent = await fetchMyReports(uid);
    } catch (err) {
        // let the report through rather than block it on a failed check
        console.warn("Duplicate report check error:", err);
        return false;
    }
    const now = Date.now();
    const recent = sent.filter(
        (r) =>
            !r.createdAt || now - r.createdAt.toMillis() < DUPLICATE_REPORT_MS,
    );
    const subject = simplify(report.subject);
    const description = simplify(report.description);
    return recent.some(
        (r) =>
            simplify(r.description) === description ||
            (simplify(r.subject) === subject &&
                sameCategories(r.categories, report.categories)),
    );
}
