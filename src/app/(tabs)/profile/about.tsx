import { AuthHeader } from "@/components/auth-header";
import { BackgroundBlobs } from "@/components/clay";
import {
    InfoBullet,
    InfoHero,
    InfoSection,
    InfoStrong,
    InfoText,
} from "@/components/info-page";
import { BARANGAY, MUNICIPALITY } from "@/constants/barangays";
import { PALETTE } from "@/constants/palette";
import { useLanguage } from "@/hooks/use-language";
import Constants from "expo-constants";
import { ScrollView, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const APP_VERSION = Constants.expoConfig?.version ?? "1.0.0";

const FEATURES = [
    {
        label: "Feed",
        labelEn: "Feed",
        text: "magbahagi ng balita at makipag-usap sa mga kapitbahay.",
        textEn: "share news and talk with your neighbors.",
    },
    {
        label: "Mga Anunsyo",
        labelEn: "Announcements",
        text: "mga abiso at babala mula mismo sa barangay.",
        textEn: "notices and alerts straight from the barangay.",
    },
    {
        label: "Report",
        labelEn: "Report",
        text: "mag-ulat ng insidente na direktang ipinapadala sa barangay.",
        textEn: "report incidents that go straight to the barangay.",
    },
    {
        label: "Chat",
        labelEn: "Chat",
        text: "magpadala ng pribadong mensahe sa ibang residente.",
        textEn: "send private messages to other residents.",
    },
    {
        label: "Emergency Hotlines",
        labelEn: "Emergency Hotlines",
        text: "mga numerong matatawagan kapag may emergency.",
        textEn: "numbers to call when there's an emergency.",
    },
    {
        label: "Verified Badge",
        labelEn: "Verified Badge",
        text: "patunay na tunay na residente ang kausap mo.",
        textEn: "proof that you're talking to a real resident.",
    },
];

export default function About() {
    const { t } = useLanguage();

    return (
        <SafeAreaView
            className="flex-1"
            style={{ backgroundColor: PALETTE.cream }}
            edges={["top"]}
        >
            <BackgroundBlobs colors={[PALETTE.leaf, PALETTE.gold]} />

            <ScrollView
                contentContainerClassName="px-5 pt-4 pb-10"
                showsVerticalScrollIndicator={false}
            >
                <AuthHeader
                    title={t("Tungkol sa TriboConnect", "About TriboConnect")}
                />

                <InfoHero
                    icon="people"
                    colors={["#56A06A", "#2F6540"]}
                    title="TriboConnect"
                    subtitle={t(
                        `Ang community app ng Barangay ${BARANGAY}, ${MUNICIPALITY}.`,
                        `The community app of Barangay ${BARANGAY}, ${MUNICIPALITY}.`,
                    )}
                />

                <InfoSection
                    icon="heart"
                    title={t("Ano ang TriboConnect?", "What is TriboConnect?")}
                    color={PALETTE.forest}
                >
                    <InfoText>
                        {t(
                            `Ang TriboConnect ay isang mobile app na naglalapit sa mga residente at sa barangay ng ${BARANGAY}. Dito mabilis na makakatanggap ng mga anunsyo, makakapag-ulat ng insidente, at makakausap ang mga kapitbahay sa iisang lugar.`,
                            `TriboConnect is a mobile app that brings the residents and the barangay of ${BARANGAY} closer together. It's one place to get announcements quickly, report incidents, and talk with your neighbors.`,
                        )}
                    </InfoText>
                </InfoSection>

                <InfoSection
                    icon="school"
                    title={t("Isang Capstone Project", "A Capstone Project")}
                    color="#2A5C99"
                >
                    <InfoText>
                        {t(
                            "Ang TriboConnect ay isang school project na ginawa ng mga mag-aaral bilang kanilang capstone project. Layunin nitong ipakita kung paano makakatulong ang teknolohiya sa pang-araw-araw na serbisyo ng barangay.",
                            "TriboConnect is a school project made by students as their capstone project. It aims to show how technology can help with the barangay's everyday services.",
                        )}
                    </InfoText>
                    <InfoText>
                        {t(
                            "Dahil ito ay isang school project, maaaring may mga pagbabago o pansamantalang aberya habang patuloy namin itong pinapaganda.",
                            "Since it's a school project, there may be changes or temporary issues while we keep improving it.",
                        )}
                    </InfoText>
                </InfoSection>

                <InfoSection
                    icon="apps"
                    title={t("Mga Tampok", "Features")}
                    color="#C9821F"
                >
                    {FEATURES.map((feature) => (
                        <InfoBullet key={feature.labelEn}>
                            <InfoStrong>
                                {t(feature.label, feature.labelEn)}
                            </InfoStrong>
                            {" – "}
                            {t(feature.text, feature.textEn)}
                        </InfoBullet>
                    ))}
                </InfoSection>

                <Text className="text-[11.5px] text-[#B5AFA0] text-center mt-2">
                    TriboConnect · {t("Bersyon", "Version")} {APP_VERSION}
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
}
