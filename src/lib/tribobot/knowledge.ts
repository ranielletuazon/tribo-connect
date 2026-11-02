import { BARANGAY, MUNICIPALITY, PROVINCE } from "@/constants/barangays";
import { NATIONAL_HOTLINES } from "@/constants/hotlines";
import { RATE_LIMITS } from "@/lib/moderation";
import { Ionicons } from "@expo/vector-icons";
import type { Href } from "expo-router";

// everything TriboBot knows. to teach it something new, add an intent below:
// - keywords: words or phrases a user might type, in Tagalog, English or
//   Taglish. lowercase, no accents. hyphens are ignored ("mag-post" is the
//   same as "magpost"). phrases count more than single words
// - question: the button text when the intent is suggested
// - answer: what Tribo replies. **text** is shown in bold
// - actions: buttons under the answer (open a page, call, email...)
// - followUps: ids of intents to suggest next
// when two intents match equally, the one higher in the list wins, so keep
// specific intents above general ones

export interface Bilingual {
    tl: string;
    en: string;
}

// what Tribo knows about the user, so answers can fit them
export interface BotContext {
    name: string;
    isVerified: boolean;
    isAdmin: boolean;
}

type IconName = keyof typeof Ionicons.glyphMap;

export type BotAction = { label: Bilingual; icon: IconName } & (
    | { kind: "route"; route: Href }
    | { kind: "call"; number: string }
    | { kind: "email" }
    | { kind: "phone-settings" }
    | { kind: "language"; lang: "tl" | "en" }
);

export interface BotIntent {
    id: string;
    topic?: TopicId;
    question: Bilingual;
    keywords: string[];
    answer: Bilingual | ((ctx: BotContext) => Bilingual);
    actions?: BotAction[] | ((ctx: BotContext) => BotAction[]);
    followUps?: string[];
    adminOnly?: boolean;
    // answered right away, no long typing delay
    urgent?: boolean;
}

export type TopicId =
    | "emergency"
    | "announcements"
    | "reports"
    | "community"
    | "account"
    | "app"
    | "admin";

export interface BotTopic {
    id: TopicId;
    label: Bilingual;
    description: Bilingual;
    icon: IconName;
    colors: [string, string];
    adminOnly?: boolean;
}

export const TOPICS: BotTopic[] = [
    {
        id: "emergency",
        label: { tl: "Emergency", en: "Emergency" },
        description: { tl: "Hotline at kaligtasan", en: "Hotlines and safety" },
        icon: "medkit",
        colors: ["#F0624D", "#B8321F"],
    },
    {
        id: "announcements",
        label: { tl: "Mga Anunsiyo", en: "Announcements" },
        description: { tl: "Balita at abiso", en: "News and alerts" },
        icon: "megaphone",
        colors: ["#F2BD4E", "#C9821F"],
    },
    {
        id: "reports",
        label: { tl: "Mag-report", en: "Reports" },
        description: { tl: "Mag-ulat ng insidente", en: "Report an incident" },
        icon: "document-text",
        colors: ["#E8894F", "#B4562A"],
    },
    {
        id: "community",
        label: { tl: "Feed at Chat", en: "Feed and Chat" },
        description: { tl: "Mag-post at makipag-usap", en: "Post and talk" },
        icon: "chatbubbles",
        colors: ["#56A06A", "#2F6540"],
    },
    {
        id: "account",
        label: { tl: "Account", en: "Account" },
        description: {
            tl: "Profile at beripikasyon",
            en: "Profile and verification",
        },
        icon: "person-circle",
        colors: ["#5BA3E8", "#2A5C99"],
    },
    {
        id: "app",
        label: { tl: "Tungkol sa App", en: "About the App" },
        description: { tl: "Privacy at tulong", en: "Privacy and help" },
        icon: "information-circle",
        colors: ["#B5AFA0", "#7A6D5C"],
    },
    {
        id: "admin",
        label: { tl: "Para sa Admin", en: "For Admins" },
        description: { tl: "Mga gawain ng admin", en: "Admin tasks" },
        icon: "shield-half",
        colors: ["#A98FE0", "#6B4F94"],
        adminOnly: true,
    },
];

// ---------- buttons used by many answers ----------

const go = (
    route: Href,
    tl: string,
    en: string,
    icon: IconName,
): BotAction => ({ kind: "route", route, label: { tl, en }, icon });

const OPEN = {
    home: go("/(tabs)", "Home", "Home", "home"),
    feed: go("/(tabs)/feed", "Buksan ang Feed", "Open the Feed", "albums"),
    createPost: go(
        "/(tabs)/feed/create-post",
        "Gumawa ng Post",
        "Create a Post",
        "create",
    ),
    chat: go(
        "/(tabs)/chat",
        "Buksan ang Mensahe",
        "Open Messages",
        "chatbubbles",
    ),
    announcements: go(
        "/(tabs)/community",
        "Buksan ang Mga Anunsiyo",
        "Open Announcements",
        "megaphone",
    ),
    createAnnouncement: go(
        "/(tabs)/community/create-emergency",
        "Gumawa ng Anunsyo",
        "Make an Announcement",
        "add-circle",
    ),
    emergency: go(
        "/(tabs)/emergency",
        "Buksan ang Emergency",
        "Open Emergency",
        "alert-circle",
    ),
    report: go(
        "/(tabs)/report",
        "Mag-report ng Insidente",
        "Report an Incident",
        "megaphone",
    ),
    myReports: go(
        "/(tabs)/profile/my-reports",
        "Aking mga Ulat",
        "My Reports",
        "document-text",
    ),
    profile: go(
        "/(tabs)/profile",
        "Buksan ang Profile",
        "Open Profile",
        "person",
    ),
    editProfile: go(
        "/(tabs)/profile/edit-profile",
        "I-edit ang Profile",
        "Edit Profile",
        "create",
    ),
    verify: go(
        "/(tabs)/profile/verify",
        "I-verify ang Account",
        "Verify Account",
        "shield-checkmark",
    ),
    settings: go(
        "/(tabs)/profile/settings",
        "Mga Setting",
        "Settings",
        "settings",
    ),
    help: go(
        "/(tabs)/profile/help",
        "Tulong at FAQ",
        "Help and FAQ",
        "help-circle",
    ),
    about: go(
        "/(tabs)/profile/about",
        "Tungkol sa TriboConnect",
        "About TriboConnect",
        "information-circle",
    ),
    privacy: go(
        "/(tabs)/profile/privacy",
        "Patakaran sa Privacy",
        "Privacy Policy",
        "lock-closed",
    ),
    verifyUsers: go(
        "/(tabs)/profile/verify-users",
        "I-verify ang mga User",
        "Verify Users",
        "person-add",
    ),
};

const EMAIL_US: BotAction = {
    kind: "email",
    label: { tl: "Mag-email sa Amin", en: "Email Us" },
    icon: "mail",
};

const [AMBULANCE, FIRE, POLICE] = NATIONAL_HOTLINES;

function callAction(
    hotline: (typeof NATIONAL_HOTLINES)[number],
    line: 1 | 2 = 1,
): BotAction {
    const number = line === 1 ? hotline.hotline1 : hotline.hotline2;
    const suffix = line === 2 ? " (2)" : "";
    return {
        kind: "call",
        number,
        label: {
            tl: `Tawagan ang ${hotline.agency}${suffix}`,
            en: `Call ${hotline.agencyEn}${suffix}`,
        },
        icon: "call",
    };
}

// unverified users get a reminder and a Verify button with these answers
function needsVerify(ctx: BotContext): Bilingual {
    return ctx.isVerified || ctx.isAdmin
        ? { tl: "", en: "" }
        : {
              tl: "\n\n⚠️ Paalala: kailangan munang **ma-verify** ang iyong account bago mo ito magawa.",
              en: "\n\n⚠️ Note: your account needs to be **verified** before you can do this.",
          };
}

function withVerify(ctx: BotContext, actions: BotAction[]): BotAction[] {
    return ctx.isVerified || ctx.isAdmin ? actions : [OPEN.verify, ...actions];
}

// ---------- intents ----------

export const INTENTS: BotIntent[] = [
    // ----- small talk -----
    {
        id: "greeting",
        question: { tl: "Kumusta!", en: "Hello!" },
        keywords: [
            "hi",
            "hello",
            "hey",
            "helo",
            "kumusta",
            "musta",
            "kamusta",
            "good morning",
            "good afternoon",
            "good evening",
            "magandang umaga",
            "magandang hapon",
            "magandang gabi",
            "magandang araw",
            "uy",
            "yo",
        ],
        answer: (ctx) => ({
            tl: `Kumusta, ${ctx.name}! 👋 Ano ang maitutulong ko sa iyo ngayon?`,
            en: `Hi, ${ctx.name}! 👋 What can I help you with today?`,
        }),
        followUps: ["emergency-hotlines", "report-how", "verify", "all-pages"],
    },
    {
        id: "how-are-you",
        question: { tl: "Kumusta ka?", en: "How are you?" },
        keywords: [
            "kumusta ka",
            "musta ka",
            "how are you",
            "hows it going",
            "okay ka lang",
        ],
        answer: {
            tl:
                "Mabuti naman ako, salamat sa pagtatanong! 😊 Laging handang tumulong sa mga taga-" +
                BARANGAY +
                ". Ikaw, ano ang kailangan mo?",
            en:
                "I'm doing great, thanks for asking! 😊 Always ready to help the people of " +
                BARANGAY +
                ". How about you, what do you need?",
        },
        followUps: ["all-pages", "announcements", "report-how"],
    },
    {
        id: "who-are-you",
        question: { tl: "Sino ka?", en: "Who are you?" },
        keywords: [
            "sino ka",
            "ano ka",
            "who are you",
            "what are you",
            "your name",
            "pangalan mo",
            "tribo",
            "tribobot",
            "triboai",
            "bot",
            "robot",
        ],
        answer: {
            tl: "Ako si **Tribo**, ang katulong mo sa TriboConnect! 🤖 Kaya kitang gabayan sa app, sagutin ang mga tanong, at dalhin ka sa tamang pahina. Tandaan na hindi ako tao, kaya para sa mga totoong emergency, tumawag agad sa hotline.",
            en: "I'm **Tribo**, your TriboConnect helper! 🤖 I can guide you around the app, answer questions, and take you to the right page. Remember I'm not a person, so for real emergencies, call a hotline right away.",
        },
        followUps: ["all-pages", "emergency-hotlines"],
    },
    {
        id: "thanks",
        question: { tl: "Salamat!", en: "Thank you!" },
        keywords: [
            "salamat",
            "thank you",
            "thanks",
            "thank",
            "ty",
            "tnx",
            "thx",
            "maraming salamat",
            "ok salamat",
        ],
        answer: {
            tl: "Walang anuman! 💚 Nandito lang ako kung may iba ka pang tanong.",
            en: "You're welcome! 💚 I'm right here if you have more questions.",
        },
        followUps: ["all-pages"],
    },
    {
        id: "bye",
        question: { tl: "Paalam!", en: "Goodbye!" },
        keywords: [
            "bye",
            "goodbye",
            "paalam",
            "sige na",
            "see you",
            "babay",
            "ingat",
        ],
        answer: {
            tl: "Paalam at mag-ingat! 👋 Balikan mo lang ako anumang oras.",
            en: "Goodbye and take care! 👋 Come back anytime.",
        },
    },

    // ----- emergency -----
    {
        id: "ambulance",
        topic: "emergency",
        question: { tl: "Numero ng ambulansya", en: "Ambulance number" },
        keywords: [
            "ambulansya",
            "ambulance",
            "mdrrmo",
            "nasugatan",
            "sugatan",
            "injured",
            "aksidente",
            "accident",
            "nahimatay",
            "fainted",
            "ospital",
            "hospital",
            "medical",
            "medikal",
            "dugo",
            "bleeding",
            "heart attack",
            "hindi makahinga",
            "cant breathe",
        ],
        answer: {
            tl: `🚑 Para sa medikal na emergency, tawagan agad ang **Ambulance (MDRRMO)**: ${AMBULANCE.hotline1} o ${AMBULANCE.hotline2}.\n\nHabang naghihintay, manatiling kalmado at huwag galawin ang taong malubha ang sugat.`,
            en: `🚑 For a medical emergency, call the **Ambulance (MDRRMO)** right away: ${AMBULANCE.hotline1} or ${AMBULANCE.hotline2}.\n\nWhile waiting, stay calm and don't move anyone who is badly hurt.`,
        },
        actions: [
            callAction(AMBULANCE),
            callAction(AMBULANCE, 2),
            OPEN.emergency,
        ],
        followUps: ["emergency-hotlines", "report-how"],
        urgent: true,
    },
    {
        id: "fire",
        topic: "emergency",
        question: { tl: "Numero ng bumbero", en: "Fire department number" },
        keywords: [
            "sunog",
            "nasusunog",
            "fire",
            "bumbero",
            "bfp",
            "usok",
            "smoke",
            "apoy",
            "burning",
        ],
        answer: {
            tl: `🔥 May sunog? Lumabas agad sa ligtas na lugar at tawagan ang **Bumbero (BFP)**: ${FIRE.hotline1} o ${FIRE.hotline2}.`,
            en: `🔥 Is there a fire? Get to a safe place right away and call the **Fire Department (BFP)**: ${FIRE.hotline1} or ${FIRE.hotline2}.`,
        },
        actions: [callAction(FIRE), callAction(FIRE, 2), OPEN.emergency],
        followUps: ["emergency-hotlines", "report-how"],
        urgent: true,
    },
    {
        id: "police",
        topic: "emergency",
        question: { tl: "Numero ng pulis", en: "Police number" },
        keywords: [
            "pulis",
            "police",
            "pnp",
            "krimen",
            "crime",
            "magnanakaw",
            "nakawan",
            "ninakaw",
            "theft",
            "robbery",
            "holdap",
            "gulo",
            "away",
            "aaway",
            "nagaaway",
            "fight",
            "violence",
            "karahasan",
            "kidnap",
        ],
        answer: {
            tl: `🚓 Para sa krimen o gulo, tawagan ang **Pulis (PNP)**: ${POLICE.hotline1} o ${POLICE.hotline2}. Unahin ang iyong kaligtasan.`,
            en: `🚓 For a crime or disturbance, call the **Police (PNP)**: ${POLICE.hotline1} or ${POLICE.hotline2}. Put your safety first.`,
        },
        actions: [callAction(POLICE), callAction(POLICE, 2), OPEN.emergency],
        followUps: ["emergency-hotlines", "report-how"],
        urgent: true,
    },
    {
        id: "emergency-hotlines",
        topic: "emergency",
        question: {
            tl: "Ano ang mga emergency hotline?",
            en: "What are the emergency hotlines?",
        },
        keywords: [
            "emergency",
            "emerhensya",
            "hotline",
            "hotlines",
            "saklolo",
            "help me",
            "tulungan",
            "urgent",
            "911",
            "tumawag",
            "tawagan",
            "call",
            "numero",
            "number",
            "contact number",
        ],
        answer: {
            tl: "🚨 Kung may emergency, tumawag agad! Pindutin ang numero sa ibaba para tumawagan, o buksan ang Emergency page para sa lahat ng hotline.",
            en: "🚨 If there's an emergency, call right away! Tap a number below to call, or open the Emergency page for every hotline.",
        },
        actions: [
            callAction(AMBULANCE),
            callAction(FIRE),
            callAction(POLICE),
            OPEN.emergency,
        ],
        followUps: ["disaster", "report-how"],
        urgent: true,
    },

    // ----- announcements -----
    {
        id: "create-announcement",
        topic: "admin",
        question: {
            tl: "Paano gumawa ng anunsyo?",
            en: "How do I make an announcement?",
        },
        keywords: [
            "gumawa ng anunsyo",
            "mag anunsyo",
            "maganunsyo",
            "mag-anunsyo",
            "create announcement",
            "post announcement",
            "make an announcement",
            "new announcement",
            "bagong anunsyo",
        ],
        answer: (ctx) =>
            ctx.isAdmin
                ? {
                      tl: "Bilang admin, buksan ang **Mga Anunsiyo** at pindutin ang **Mag-anunsyo**. Pumili ng uri, isulat ang detalye, at ipadala. Makakatanggap ng notification ang mga residente. 📣",
                      en: "As an admin, open **Announcements** and tap **Announce**. Pick the type, write the details, and send it. Residents get a notification. 📣",
                  }
                : {
                      tl: "Ang mga **admin ng barangay** lang ang makakagawa ng anunsyo. Kung may gusto kang ipaalam sa komunidad, puwede kang mag-post sa Feed o magpadala ng ulat sa barangay.",
                      en: "Only **barangay admins** can make announcements. If you want to tell the community something, you can post on the Feed or send a report to the barangay.",
                  },
        actions: (ctx) =>
            ctx.isAdmin
                ? [OPEN.createAnnouncement, OPEN.announcements]
                : [OPEN.createPost, OPEN.report],
    },
    {
        id: "notifications",
        topic: "announcements",
        question: {
            tl: "Bakit wala akong natatanggap na notification?",
            en: "Why am I not getting notifications?",
        },
        keywords: [
            "notification",
            "notifications",
            "notif",
            "notifs",
            "push",
            "alerto",
            "hindi nakakatanggap",
            "not receiving",
            "no notification",
            "walang notification",
        ],
        answer: {
            tl: "🔔 Para makatanggap ng mga anunsyo at babala, **payagan ang notifications** ng TriboConnect sa settings ng iyong telepono. Pindutin ang button sa ibaba para buksan ito.",
            en: "🔔 To get announcements and alerts, **allow notifications** for TriboConnect in your phone's settings. Tap the button below to open them.",
        },
        actions: [
            {
                kind: "phone-settings",
                label: {
                    tl: "Buksan ang Phone Settings",
                    en: "Open Phone Settings",
                },
                icon: "notifications",
            },
            OPEN.announcements,
        ],
        followUps: ["announcements"],
    },
    {
        id: "announcements",
        topic: "announcements",
        question: {
            tl: "Saan ko makikita ang mga anunsyo?",
            en: "Where can I see the announcements?",
        },
        keywords: [
            "anunsyo",
            "anunsiyo",
            "announcement",
            "announcements",
            "balita",
            "news",
            "abiso",
            "advisory",
            "paalala",
            "babala",
            "warning",
        ],
        answer: {
            tl: `📢 Lahat ng anunsyo ng Barangay ${BARANGAY} ay nasa **Mga Anunsiyo**. Makikita mo rin ito sa Home. Makakatanggap ka rin ng notification kapag may bago.`,
            en: `📢 All of Barangay ${BARANGAY}'s announcements are in **Announcements**. You can also reach it from Home. You'll get a notification when there's a new one.`,
        },
        actions: [OPEN.announcements],
        followUps: ["notifications", "create-announcement"],
    },

    // ----- reports -----
    {
        id: "report-where",
        topic: "reports",
        question: {
            tl: "Saan napupunta ang aking ulat?",
            en: "Where does my report go?",
        },
        keywords: [
            "saan napupunta",
            "where does my report go",
            "sino ang nakakabasa",
            "who reads",
            "who receives",
            "sino makakatanggap",
            "may sasagot ba",
            "will someone respond",
            "tugon",
            "response",
            "reply",
        ],
        answer: {
            tl: "📨 Direktang ipinapadala ang iyong ulat sa **email ng barangay**. Gagamitin nila ang email ng iyong account para makipag-ugnayan sa iyo tungkol dito.",
            en: "📨 Your report goes straight to the **barangay's email**. They'll use your account's email to contact you about it.",
        },
        actions: [OPEN.myReports],
        followUps: ["report-how", "my-reports"],
    },
    {
        id: "my-reports",
        topic: "reports",
        question: {
            tl: "Saan ko makikita ang aking mga ulat?",
            en: "Where can I see my reports?",
        },
        keywords: [
            "aking mga ulat",
            "aking ulat",
            "my reports",
            "my report",
            "report history",
            "naipadala kong ulat",
            "sent reports",
            "mga ulat ko",
            "ulat ko",
            "report ko",
            "makita ang report",
            "see my reports",
        ],
        answer: {
            tl: "📄 Makikita ang lahat ng naipadala mong ulat sa **Profile > Aking mga Ulat**, kasama ang petsa at buong detalye.",
            en: "📄 All the reports you sent are in **Profile > My Reports**, with the date and full details.",
        },
        actions: [OPEN.myReports],
        followUps: ["report-where", "report-how"],
    },
    {
        id: "report-duplicate",
        topic: "reports",
        question: {
            tl: 'Bakit "Naipadala Na" ang lumalabas?',
            en: 'Why does it say "Already Sent"?',
        },
        keywords: [
            "naipadala na",
            "already sent",
            "duplicate",
            "parehong ulat",
            "same report",
            "ulit ang ulat",
            "report again",
            "hindi maipadala ulit",
        ],
        answer: {
            tl: "Lumalabas ang **Naipadala Na** kapag naipadala mo na ang parehong ulat sa nakaraang **24 oras**. Natanggap na ito ng barangay, kaya hindi na kailangang ipadala ulit. Kung may bagong detalye, gumawa ng bagong ulat na may ibang detalye.",
            en: "**Already Sent** shows when you sent the same report in the last **24 hours**. The barangay already has it, so there's no need to send it again. If there are new details, send a new report with those details.",
        },
        actions: [OPEN.myReports],
        followUps: ["report-where"],
    },
    {
        id: "report-how",
        topic: "reports",
        question: {
            tl: "Paano mag-report ng insidente?",
            en: "How do I report an incident?",
        },
        keywords: [
            "report",
            "ireport",
            "magreport",
            "nagreport",
            "ulat",
            "mag ulat",
            "magulat",
            "insidente",
            "incident",
            "sumbong",
            "isumbong",
            "reklamo",
            "complaint",
            "issue",
        ],
        answer: (ctx) => {
            const note = needsVerify(ctx);
            return {
                tl:
                    "📝 Madali lang mag-report:\n1. Pumili ng **uri ng ulat** (Sakuna, Kaligtasan, Kalusugan, Paligid, Sarili o Iba Pa).\n2. Maglagay ng maikling **pamagat**.\n3. Ilarawan ang **detalye**: ano, saan, at kailan nangyari.\n4. Pindutin ang **Isumite ang Ulat**." +
                    note.tl,
                en:
                    "📝 Reporting is easy:\n1. Pick the **report type** (Disaster, Safety, Health, Surroundings, Personal or Others).\n2. Add a short **title**.\n3. Describe the **details**: what, where, and when it happened.\n4. Tap **Submit Report**." +
                    note.en,
            };
        },
        actions: (ctx) => withVerify(ctx, [OPEN.report]),
        followUps: ["report-where", "my-reports", "emergency-hotlines"],
    },
    {
        id: "disaster",
        topic: "emergency",
        question: {
            tl: "Ano ang gagawin kapag may bagyo o baha?",
            en: "What do I do in a typhoon or flood?",
        },
        keywords: [
            "baha",
            "flood",
            "bagyo",
            "typhoon",
            "storm",
            "lindol",
            "earthquake",
            "landslide",
            "guho",
            "evacuate",
            "evacuation",
            "lumikas",
            "likas",
            "sakuna",
            "disaster",
            "kalamidad",
            "calamity",
            "go bag",
        ],
        answer: {
            tl: "🌧️ Kapag may sakuna:\n• Sundan ang mga **anunsyo ng barangay** para sa mga babala at evacuation.\n• Ihanda ang go-bag: tubig, pagkain, gamot, flashlight, at mahahalagang dokumento.\n• Kung delikado na, lumikas agad at tumawag sa MDRRMO.\n• I-report ang mga pinsala sa iyong lugar para malaman ng barangay.",
            en: "🌧️ During a disaster:\n• Follow the **barangay's announcements** for warnings and evacuation.\n• Prepare a go-bag: water, food, medicine, a flashlight, and important documents.\n• If it gets dangerous, evacuate right away and call the MDRRMO.\n• Report any damage in your area so the barangay knows.",
        },
        actions: [OPEN.announcements, callAction(AMBULANCE), OPEN.report],
        followUps: ["emergency-hotlines", "notifications"],
    },

    // ----- feed and chat -----
    {
        id: "post-blocked",
        topic: "community",
        question: {
            tl: "Bakit hindi ma-post ang post ko?",
            en: "Why won't my post go through?",
        },
        keywords: [
            "hindi ma post",
            "hindi mapost",
            "di mapost",
            "ayaw mag post",
            "cant post",
            "cannot post",
            "can't post",
            "post failed",
            "blocked",
            "bad words",
            "bad word",
            "masamang salita",
            "mura",
            "inappropriate",
            "slow down",
            "masyadong mabilis",
            "limit",
            "bawal",
        ],
        answer: (ctx) => {
            const note = needsVerify(ctx);
            return {
                tl:
                    `Maaaring dahil sa isa sa mga ito:\n• May **hindi angkop na salita** ang post. Tanggalin ito at subukang muli.\n• Masyado kang mabilis: hanggang **${RATE_LIMITS.post.max} post** at **${RATE_LIMITS.comment.max} komento** lang bawat minuto.` +
                    note.tl,
                en:
                    `It may be one of these:\n• The post has **inappropriate language**. Remove it and try again.\n• You're going too fast: up to **${RATE_LIMITS.post.max} posts** and **${RATE_LIMITS.comment.max} comments** per minute.` +
                    note.en,
            };
        },
        actions: (ctx) => withVerify(ctx, [OPEN.createPost]),
        followUps: ["censored", "create-post"],
    },
    {
        id: "censored",
        topic: "community",
        question: {
            tl: "Bakit may *** sa mensahe ko?",
            en: "Why is there *** in my message?",
        },
        keywords: [
            "asterisk",
            "asterisks",
            "censored",
            "censor",
            "tinakpan",
            "natakpan",
            "nakatakip",
            "bituin",
            "stars",
            "***",
        ],
        answer: {
            tl: "🙊 Awtomatikong tinatakpan ng *** ang mga **hindi angkop na salita** sa Chat para manatiling magalang ang usapan sa komunidad.",
            en: "🙊 **Inappropriate words** in Chat are automatically covered with *** to keep conversations in the community respectful.",
        },
        followUps: ["post-blocked", "chat"],
    },
    {
        id: "delete-post",
        topic: "community",
        question: {
            tl: "Paano mag-delete ng post?",
            en: "How do I delete a post?",
        },
        keywords: [
            "delete",
            "burahin",
            "bura",
            "tanggalin",
            "alisin",
            "remove post",
            "delete post",
            "burahin ang post",
            "trash",
        ],
        answer: (ctx) => ({
            tl:
                "🗑️ Pindutin ang **⋯** sa iyong post sa Feed at piliin ang **Burahin**, o buksan ang post at pindutin ang basurahan sa itaas." +
                (ctx.isAdmin
                    ? "\n\nBilang admin, kaya mo ring burahin ang post ng ibang user."
                    : ""),
            en:
                "🗑️ Tap **⋯** on your post in the Feed and choose **Delete**, or open the post and tap the trash icon at the top." +
                (ctx.isAdmin
                    ? "\n\nAs an admin, you can delete other users' posts too."
                    : ""),
        }),
        actions: [OPEN.feed],
        followUps: ["create-post"],
    },
    {
        id: "create-post",
        topic: "community",
        question: {
            tl: "Paano mag-post sa Feed?",
            en: "How do I post on the Feed?",
        },
        keywords: [
            "magpost",
            "mag post",
            "create",
            "gumawa",
            "write",
            "sumulat",
            "gumawa ng post",
            "create post",
            "new post",
            "bagong post",
            "make a post",
            "share",
            "ibahagi",
            "magbahagi",
            "upload",
            "photo",
            "larawan sa post",
        ],
        answer: (ctx) => {
            const note = needsVerify(ctx);
            return {
                tl:
                    '✍️ Sa **Feed**, pindutin ang "Ano ang nasa isip mo?" para gumawa ng post. Puwede kang magsulat at magdagdag ng larawan, tapos pindutin ang **I-post**.' +
                    note.tl,
                en:
                    '✍️ On the **Feed**, tap "What\'s on your mind?" to make a post. You can write and add a photo, then tap **Post**.' +
                    note.en,
            };
        },
        actions: (ctx) => withVerify(ctx, [OPEN.createPost, OPEN.feed]),
        followUps: ["delete-post", "post-blocked"],
    },
    {
        id: "comments",
        topic: "community",
        question: {
            tl: "Paano mag-comment o mag-like?",
            en: "How do I comment or like?",
        },
        keywords: [
            "comment",
            "comments",
            "komento",
            "magkomento",
            "likes",
            "mag like",
            "puso",
            "heart",
        ],
        answer: {
            tl: "💬 Pindutin ang puso para mag-like. Para mag-comment, buksan ang post at isulat ang iyong komento sa ibaba.",
            en: "💬 Tap the heart to like. To comment, open the post and type your comment at the bottom.",
        },
        actions: [OPEN.feed],
        followUps: ["post-blocked"],
    },
    {
        id: "chat",
        topic: "community",
        question: {
            tl: "Paano mag-message sa isang residente?",
            en: "How do I message a resident?",
        },
        keywords: [
            "chat",
            "mensahe",
            "message",
            "messages",
            "magmessage",
            "inbox",
            "dm",
            "pm",
            "kausap",
            "makipag usap",
            "kausapin",
            "usapan",
            "conversation",
        ],
        answer: (ctx) => {
            const note = needsVerify(ctx);
            return {
                tl:
                    "💬 Pindutin ang **⋯** sa post ng residente sa Feed at piliin ang **I-Chat**. Makikita ang lahat ng iyong usapan sa **Mensahe**." +
                    note.tl,
                en:
                    "💬 Tap **⋯** on a resident's post in the Feed and choose **Chat**. All your conversations are in **Messages**." +
                    note.en,
            };
        },
        actions: (ctx) => withVerify(ctx, [OPEN.chat, OPEN.feed]),
        followUps: ["censored", "feed"],
    },
    {
        id: "feed",
        topic: "community",
        question: { tl: "Ano ang Feed?", en: "What is the Feed?" },
        keywords: [
            "feed",
            "post",
            "posts",
            "newsfeed",
            "timeline",
            "kapitbahay",
            "neighbors",
            "komunidad",
            "community",
        ],
        answer: {
            tl: "🏘️ Ang **Feed** ay kung saan nagbabahagi ang mga residente ng balita, larawan, at kuwento sa komunidad.",
            en: "🏘️ The **Feed** is where residents share news, photos, and stories with the community.",
        },
        actions: [OPEN.feed],
        followUps: ["create-post", "chat"],
    },

    // ----- account -----
    {
        id: "badge-revoked",
        topic: "account",
        question: {
            tl: "Bakit nawala ang verified badge ko?",
            en: "Why was my verified badge removed?",
        },
        keywords: [
            "revoked",
            "revoke",
            "binawi",
            "nawala ang badge",
            "nawala ang check",
            "tinanggal ang badge",
            "lost my badge",
            "badge removed",
        ],
        answer: {
            tl: "Maaaring bawiin ng admin ng barangay ang badge kung may problema sa iyong beripikasyon. Makikita ang **dahilan** sa I-verify ang Account page. Makipag-ugnayan sa barangay para maibalik ito.",
            en: "A barangay admin can revoke the badge if there's a problem with your verification. The **reason** is shown on the Verify Account page. Contact the barangay to get it back.",
        },
        actions: [OPEN.verify, EMAIL_US],
    },
    {
        id: "verify-ids",
        topic: "account",
        question: {
            tl: "Anong ID ang tinatanggap?",
            en: "Which IDs are accepted?",
        },
        keywords: [
            "id",
            "ids",
            "valid id",
            "anong id",
            "which id",
            "national id",
            "philsys",
            "drivers license",
            "lisensya",
            "barangay id",
            "egov",
        ],
        answer: {
            tl: "🪪 Tinatanggap ang:\n• **National ID** (card o screenshot mula sa eGovPH app)\n• **Driver's License**\n• **Barangay ID**\n• Iba pang **valid na government ID**",
            en: "🪪 These are accepted:\n• **National ID** (card or a screenshot from the eGovPH app)\n• **Driver's License**\n• **Barangay ID**\n• Another **valid government ID**",
        },
        actions: [OPEN.verify],
        followUps: ["verify"],
    },
    {
        id: "verify",
        topic: "account",
        question: {
            tl: "Paano ma-verify ang account?",
            en: "How do I get verified?",
        },
        keywords: [
            "verify",
            "verified",
            "verification",
            "iverify",
            "maverify",
            "beripikasyon",
            "beripikado",
            "blue check",
            "asul na tsek",
            "check mark",
            "badge",
            "unverified",
            "hindi verified",
        ],
        answer: (ctx) =>
            ctx.isVerified
                ? {
                      tl: `✅ Verified ka na, ${ctx.name}! Kaya mo nang mag-post, mag-message, at mag-report.`,
                      en: `✅ You're already verified, ${ctx.name}! You can post, message, and report.`,
                  }
                : {
                      tl: "🛡️ Ang mga **verified** na residente lang ang makakapag-post, makakapag-message, at makakapag-report. Ganito ang gagawin:\n1. Pumili ng **ID**.\n2. Kunan ng larawan ang ID.\n3. Mag-**selfie**.\n4. Kumpirmahin ang iyong mga detalye.\n\nAgad mong makukuha ang asul na tsek pagkatapos! ✨",
                      en: "🛡️ Only **verified** residents can post, message, and report. Here's how:\n1. Pick an **ID**.\n2. Take a photo of the ID.\n3. Take a **selfie**.\n4. Confirm your details.\n\nYou get the blue check right after! ✨",
                  },
        actions: (ctx) => (ctx.isVerified ? [OPEN.profile] : [OPEN.verify]),
        followUps: ["verify-ids", "badge-revoked"],
    },
    {
        id: "language",
        topic: "account",
        question: {
            tl: "Paano palitan ang wika?",
            en: "How do I change the language?",
        },
        keywords: [
            "wika",
            "language",
            "english",
            "ingles",
            "tagalog",
            "filipino",
            "translate",
            "salin",
            "isalin",
        ],
        answer: {
            tl: "🌐 Puwede kong palitan ang wika ngayon din! Pumili sa ibaba, o pumunta sa **Mga Setting > Wika**.",
            en: "🌐 I can change the language right now! Pick one below, or go to **Settings > Language**.",
        },
        actions: [
            {
                kind: "language",
                lang: "en",
                label: { tl: "Gamitin ang English", en: "Use English" },
                icon: "language",
            },
            {
                kind: "language",
                lang: "tl",
                label: { tl: "Gamitin ang Tagalog", en: "Use Tagalog" },
                icon: "language",
            },
            OPEN.settings,
        ],
    },
    {
        id: "password",
        topic: "account",
        question: {
            tl: "Nakalimutan ko ang password ko",
            en: "I forgot my password",
        },
        keywords: [
            "password",
            "nakalimutan",
            "forgot",
            "reset",
            "palitan ang password",
            "change password",
        ],
        answer: {
            tl: "🔑 Kung Google ang ginamit mo sa pag-register, mag-login lang gamit ang **Google button**. Kung email at password, mag-email sa amin para matulungan ka naming ma-reset ito.",
            en: "🔑 If you registered with Google, just log in with the **Google button**. If you used an email and password, email us and we'll help you reset it.",
        },
        actions: [EMAIL_US],
    },
    {
        id: "logout",
        topic: "account",
        question: { tl: "Paano mag-sign out?", en: "How do I sign out?" },
        keywords: [
            "logout",
            "log out",
            "sign out",
            "signout",
            "magsign out",
            "mag logout",
            "umalis sa account",
        ],
        answer: {
            tl: "Pumunta sa **Profile > Mga Setting** at pindutin ang **Mag-sign Out** sa ibaba.",
            en: "Go to **Profile > Settings** and tap **Sign Out** at the bottom.",
        },
        actions: [OPEN.settings],
    },
    {
        id: "google-login",
        topic: "account",
        question: {
            tl: "Puwede bang mag-login gamit ang Google?",
            en: "Can I log in with Google?",
        },
        keywords: [
            "google",
            "gmail",
            "google login",
            "google account",
            "sign in with google",
        ],
        answer: {
            tl: "Oo! Pindutin ang **Google button** sa Login o Register page. Kung bago ang account, kailangan mo pa ring tapusin ang account setup.",
            en: "Yes! Tap the **Google button** on the Login or Register page. If the account is new, you'll still need to finish the account setup.",
        },
    },
    {
        id: "edit-profile",
        topic: "account",
        question: {
            tl: "Paano palitan ang username o larawan ko?",
            en: "How do I change my username or photo?",
        },
        keywords: [
            "edit profile",
            "iedit",
            "username",
            "pangalan",
            "name",
            "profile picture",
            "profile photo",
            "larawan",
            "picture",
            "avatar",
            "dp",
            "palitan",
            "change",
        ],
        answer: {
            tl: "👤 Pumunta sa **Profile > I-edit ang Profile**, o pindutin ang iyong larawan sa itaas ng Profile.",
            en: "👤 Go to **Profile > Edit Profile**, or tap your photo at the top of Profile.",
        },
        actions: [OPEN.editProfile],
    },
    {
        id: "settings",
        topic: "account",
        question: { tl: "Nasaan ang Settings?", en: "Where are the Settings?" },
        keywords: ["settings", "setting", "mga setting", "preferences"],
        answer: {
            tl: "⚙️ Nasa **Profile > Mga Setting**. Dito mo makikita ang iyong account, mapapalitan ang wika, at makakapag-sign out.",
            en: "⚙️ It's in **Profile > Settings**. That's where you see your account, change the language, and sign out.",
        },
        actions: [OPEN.settings],
    },
    {
        id: "profile",
        topic: "account",
        question: { tl: "Nasaan ang Profile ko?", en: "Where's my Profile?" },
        keywords: ["profile", "account"],
        answer: {
            tl: "Nasa **Profile** tab sa ibaba ng screen. Dito ang iyong account, mga ulat, settings, at tulong.",
            en: "It's the **Profile** tab at the bottom of the screen. Your account, reports, settings, and help are there.",
        },
        actions: [OPEN.profile],
        followUps: ["edit-profile", "verify", "settings"],
    },

    // ----- admin -----
    {
        id: "admin-verify-users",
        topic: "admin",
        adminOnly: true,
        question: {
            tl: "Paano i-review ang mga verified user?",
            en: "How do I review verified users?",
        },
        keywords: [
            "verify users",
            "iverify ang mga user",
            "verification requests",
            "review users",
            "approve",
            "bawiin",
            "revoke badge",
            "ibalik ang badge",
            "restore",
        ],
        answer: {
            tl: "🛡️ Buksan ang **Profile > I-verify ang mga User**. Makikita mo roon ang ID, selfie, at detalye ng bawat user, at puwede mong **bawiin** o **ibalik** ang kanilang badge.",
            en: "🛡️ Open **Profile > Verify Users**. You'll see each user's ID, selfie, and details, and you can **revoke** or **restore** their badge.",
        },
        actions: [OPEN.verifyUsers],
        followUps: ["create-announcement", "delete-post"],
    },

    // ----- about the app -----
    {
        id: "privacy",
        topic: "app",
        question: {
            tl: "Ligtas ba ang impormasyon ko?",
            en: "Is my information safe?",
        },
        keywords: [
            "privacy",
            "data",
            "impormasyon",
            "information",
            "personal",
            "ligtas",
            "safe",
            "secure",
            "security",
            "delete account",
            "burahin ang account",
            "delete my account",
        ],
        answer: {
            tl: "🔒 Hindi namin ibinebenta ang iyong impormasyon. Ang ID at selfie mo ay makikita lang ng mga admin ng barangay. Basahin ang buong **Patakaran sa Privacy** para sa detalye, o mag-email sa amin para ipabura ang iyong account.",
            en: "🔒 We don't sell your information. Your ID and selfie are only seen by barangay admins. Read the full **Privacy Policy** for details, or email us to have your account deleted.",
        },
        actions: [OPEN.privacy, EMAIL_US],
    },
    {
        id: "about",
        topic: "app",
        question: { tl: "Ano ang TriboConnect?", en: "What is TriboConnect?" },
        keywords: [
            "triboconnect",
            "tungkol",
            "about",
            "ano ang app",
            "what is this app",
            "capstone",
            "school project",
            "sino gumawa",
            "who made",
            "developer",
            "version",
            "bersyon",
        ],
        answer: {
            tl: `🌿 Ang **TriboConnect** ay ang community app ng Barangay ${BARANGAY}, ${MUNICIPALITY}. Isa itong **school capstone project** na ginawa ng mga mag-aaral para ilapit ang barangay sa mga residente.`,
            en: `🌿 **TriboConnect** is the community app of Barangay ${BARANGAY}, ${MUNICIPALITY}. It's a **school capstone project** made by students to bring the barangay closer to its residents.`,
        },
        actions: [OPEN.about],
        followUps: ["all-pages", "privacy"],
    },
    {
        id: "barangay",
        topic: "app",
        question: {
            tl: "Para saang barangay ang app?",
            en: "Which barangay is this app for?",
        },
        keywords: [
            "nabuclod",
            "floridablanca",
            "pampanga",
            "saang barangay",
            "which barangay",
            "anong barangay",
            "lugar",
            "location",
        ],
        answer: {
            tl: `📍 Ang TriboConnect ay para sa mga residente ng **Barangay ${BARANGAY}, ${MUNICIPALITY}, ${PROVINCE}**.`,
            en: `📍 TriboConnect is for the residents of **Barangay ${BARANGAY}, ${MUNICIPALITY}, ${PROVINCE}**.`,
        },
        followUps: ["about", "announcements"],
    },
    {
        id: "contact",
        topic: "app",
        question: {
            tl: "Paano makipag-ugnayan sa barangay?",
            en: "How do I contact the barangay?",
        },
        keywords: [
            "contact",
            "makipag ugnayan",
            "ugnayan",
            "email",
            "kontak",
            "barangay hall",
            "opisina",
            "office",
            "kapitan",
            "captain",
        ],
        answer: {
            tl: "📬 Para sa mga insidente o hinaing, magpadala ng **ulat**, direkta itong napupunta sa barangay. Para sa tanong tungkol sa app, mag-email sa amin. Kung emergency, tumawag sa hotline.",
            en: "📬 For incidents or concerns, send a **report**, it goes straight to the barangay. For questions about the app, email us. If it's an emergency, call a hotline.",
        },
        actions: [OPEN.report, EMAIL_US, OPEN.emergency],
    },
    {
        id: "help-faq",
        topic: "app",
        question: {
            tl: "Nasaan ang Tulong at FAQ?",
            en: "Where's the Help and FAQ?",
        },
        keywords: [
            "faq",
            "faqs",
            "help center",
            "tulong at faq",
            "mga tanong",
            "questions",
            "guide",
            "gabay",
            "tutorial",
        ],
        answer: {
            tl: "❓ Nasa **Profile > Tulong at FAQ** ang mga sagot sa mga madalas itanong. Pero puwede mo rin akong tanungin dito!",
            en: "❓ Answers to common questions are in **Profile > Help and FAQ**. But you can ask me here too!",
        },
        actions: [OPEN.help],
        followUps: ["all-pages"],
    },
    {
        id: "all-pages",
        topic: "app",
        question: { tl: "Ano ang kaya mong gawin?", en: "What can you do?" },
        keywords: [
            "ano ang kaya mo",
            "kaya mo",
            "what can you do",
            "help",
            "tulong",
            "tulungan mo ako",
            "menu",
            "pages",
            "pahina",
            "lahat ng pahina",
            "all pages",
            "navigate",
            "saan",
            "where",
            "pumunta",
            "open",
            "buksan",
            "dalhin",
            "paano gamitin",
            "how to use",
            "gumamit",
            "features",
        ],
        answer: {
            tl: '🧭 Kaya kitang dalhin kahit saan sa app! Pumili ng pahina sa ibaba, o itanong lang sa akin, halimbawa: "Paano mag-report?" o "Numero ng pulis".',
            en: '🧭 I can take you anywhere in the app! Pick a page below, or just ask me, for example: "How do I report?" or "Police number".',
        },
        actions: (ctx) => [
            OPEN.home,
            OPEN.announcements,
            OPEN.emergency,
            OPEN.report,
            OPEN.feed,
            OPEN.chat,
            OPEN.profile,
            ...(ctx.isAdmin ? [OPEN.verifyUsers] : [OPEN.verify]),
            OPEN.myReports,
            OPEN.settings,
            OPEN.help,
        ],
    },
];

export function findIntent(id: string): BotIntent | undefined {
    return INTENTS.find((intent) => intent.id === id);
}
