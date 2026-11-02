// words that block a post or comment and get censored with * in chat.
//
// add new words in lowercase, one per line. you only need the base word:
// matching ignores upper/lower case, stretched letters ("gaaago"), number
// swaps ("g4g0", "sh1t"), a * in the middle ("f*ck") and common endings
// (-ng, -s, -es, -ing, -in, -er, -ed, -y). phrases with spaces also catch
// the joined and dashed spellings ("putang ina" = "putangina", "putang-ina").
//
// only whole words are matched, so "puta" doesn't block "putahe". still,
// don't add words that also have a clean meaning (e.g. "hayop", "leche",
// "cock") or normal posts will get blocked
export const BAD_WORDS: string[] = [
    // Tagalog
    "putang ina",
    "tang ina",
    "tangna",
    "puta",
    "pota",
    "amputa",
    "ampota",
    "bwakanang ina",
    "punyeta",
    "gago",
    "gaga",
    "ulol",
    "olol",
    "ulul",
    "tanga",
    "bobo",
    "boba",
    "tarantado",
    "tarantada",
    "gunggong",
    "inutil",
    "hinayupak",
    "kupal",
    "pakshet",
    "pakyu",
    "hindot",
    "kantot",
    "kantutan",
    "jakol",
    "salsal",
    "tite",
    "titi",
    "burat",
    "puke",
    "pekpek",
    "bilat",
    "pokpok",

    // Kapampangan
    "ukinam",
    "ukininam",
    "ukinana",

    // English
    "fuck",
    "fck",
    "fuk",
    "motherfucker",
    "wtf",
    "stfu",
    "shit",
    "bullshit",
    "bitch",
    "bastard",
    "asshole",
    "dick",
    "dickhead",
    "cunt",
    "pussy",
    "slut",
    "whore",
    "retard",
    "nigger",
    "nigga",
    "faggot",
];
