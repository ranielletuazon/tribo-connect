// shared by the Emergency page and TriboBot
// TODO: replace placeholder numbers with real, verified hotlines before launch
export const NATIONAL_HOTLINES = [
    {
        agency: "Ambulance (MDRRMO)",
        agencyEn: "Ambulance (MDRRMO)",
        description: "Medikal na emergency at aksidente",
        descriptionEn: "Medical emergencies and accidents",
        icon: "medkit" as const,
        colors: ["#F0624D", "#B8321F"] as [string, string],
        tint: "rgba(240,98,77,0.12)",
        hotline1: "0929 441 6188",
        hotline2: "0960 846 8671",
    },
    {
        agency: "Bumbero (BFP)",
        agencyEn: "Fire (BFP)",
        description: "Sunog at pagsagip",
        descriptionEn: "Fire and rescue",
        icon: "flame" as const,
        colors: ["#F59A4A", "#C4561F"] as [string, string],
        tint: "rgba(245,154,74,0.14)",
        hotline1: "0909 918 7205",
        hotline2: "0967 283 6777",
    },
    {
        agency: "Pulis (PNP)",
        agencyEn: "Police (PNP)",
        description: "Krimen at seguridad",
        descriptionEn: "Crime and security",
        icon: "shield-checkmark" as const,
        colors: ["#5B8DEF", "#2A4F9E"] as [string, string],
        tint: "rgba(91,141,239,0.13)",
        hotline1: "0977 301 4154",
        hotline2: "0998 598 5464",
    },
];
