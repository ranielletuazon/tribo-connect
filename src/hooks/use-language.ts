import { useAuth } from "@/providers/auth-provider";
import { useCallback } from "react";

export type Language = "tl" | "en";

// the language saved on the profile, accounts without one use Tagalog
export function useLanguage() {
    const { profile } = useAuth();
    const lang: Language = profile?.language === "en" ? "en" : "tl";

    // t("Tagalog text", "English text"), only for app text, never user input
    const t = useCallback(
        (tl: string, en: string) => (lang === "en" ? en : tl),
        [lang],
    );

    return { lang, t };
}
