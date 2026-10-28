import { AuthHeader } from "@/components/auth-header";
import {
    BackgroundBlobs,
    clayRaised,
    pressScale,
    PulseRing,
} from "@/components/clay";
import { PALETTE } from "@/constants/palette";
import { useLanguage } from "@/hooks/use-language";
import { useAuth } from "@/providers/auth-provider";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// TODO: replace placeholder numbers with real, verified hotlines before launch
const NATIONAL_HOTLINES = [
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

// TODO: add the real hotline numbers for each barangay
// the names here should be the same as the BARANGAYS list in account-setup.tsx
const BARANGAY_HOTLINES: Record<string, string> = {
    "Babo Pangulo": "0923 000 0001",
    "Babo Sacan (Guanson)": "0923 000 0002",
    Balubad: "0923 000 0003",
    "Calzadang Bayu": "0923 000 0004",
    Camias: "0923 000 0005",
    Cangatba: "0923 000 0006",
    Diaz: "0923 000 0007",
    "Dolores (Hacienda Dolores)": "0923 000 0008",
    "Inararo (Aetas)": "0923 000 0009",
    Jalung: "0923 000 0010",
    Mancatian: "0923 000 0011",
    "Manibaug Libutad": "0923 000 0012",
    "Manibaug Paralaya": "0923 000 0013",
    "Manibaug Pasig": "0923 000 0014",
    Manuali: "0923 000 0015",
    "Mitla Proper": "0923 000 0016",
    "Model Community (Tokwing)": "0923 000 0017",
    Palat: "0923 000 0018",
    Pias: "0923 000 0019",
    Pio: "0923 000 0020",
    Planas: "0923 000 0021",
    Poblacion: "0923 000 0022",
    "Pulung Santol": "0923 000 0023",
    Salu: "0923 000 0024",
    "San Jose Mitla": "0923 000 0025",
    "Santa Cruz": "0923 000 0026",
    "Sepung Bulaon": "0923 000 0027",
    Sinura: "0923 000 0028",
};
const FALLBACK_BARANGAY_HOTLINE = "0917 000 0000";

function callNumber(number: string) {
    Linking.openURL(`tel:${number.replace(/\s/g, "")}`);
}

function SectionTitle({ title, color }: { title: string; color: string }) {
    return (
        <View className="flex-row items-center gap-2 mb-3 ml-1">
            <View
                className="w-1.5 h-5 rounded-full"
                style={{ backgroundColor: color }}
            />
            <Text
                className="text-[17px] font-extrabold"
                style={{ color: PALETTE.ink }}
            >
                {title}
            </Text>
        </View>
    );
}

function LineButton({
    label,
    number,
    colors,
}: {
    label: string;
    number: string;
    colors: [string, string];
}) {
    return (
        <Pressable className="flex-1" onPress={() => callNumber(number)}>
            {({ pressed }) => (
                <LinearGradient
                    colors={colors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[
                        clayRaised,
                        pressScale(pressed),
                        {
                            borderRadius: 18,
                            paddingVertical: 11,
                            paddingHorizontal: 12,
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 8,
                        },
                    ]}
                >
                    <View className="w-7 h-7 rounded-full bg-white/25 items-center justify-center">
                        <Ionicons name="call" size={13} color="#fff" />
                    </View>
                    <View className="flex-1">
                        <Text className="text-[10px] text-white/80 font-semibold">
                            {label}
                        </Text>
                        <Text
                            className="text-[13px] font-bold text-white"
                            numberOfLines={1}
                            adjustsFontSizeToFit
                        >
                            {number}
                        </Text>
                    </View>
                </LinearGradient>
            )}
        </Pressable>
    );
}

export default function Emergency() {
    const { profile } = useAuth();
    const { t } = useLanguage();
    const barangay = profile?.barangay as string | undefined;
    const barangayHotline = barangay
        ? (BARANGAY_HOTLINES[barangay] ?? FALLBACK_BARANGAY_HOTLINE)
        : FALLBACK_BARANGAY_HOTLINE;

    return (
        <SafeAreaView
            className="flex-1"
            style={{ backgroundColor: PALETTE.cream }}
            edges={["top"]}
        >
            <BackgroundBlobs
                colors={[PALETTE.ember, PALETTE.gold]}
                opacity={[0.16, 0.18]}
            />

            <ScrollView
                contentContainerClassName="px-5 pt-4 pb-10"
                showsVerticalScrollIndicator={false}
            >
                <AuthHeader title="Emergency" />

                {/* Hero with the pulsing SOS badge (just for design) */}
                <LinearGradient
                    colors={[PALETTE.ember, "#D33C2E", PALETTE.blood]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                        borderRadius: 30,
                        overflow: "hidden",
                        marginTop: 4,
                        marginBottom: 28,
                        shadowColor: PALETTE.blood,
                        shadowOffset: { width: 0, height: 8 },
                        shadowOpacity: 0.35,
                        shadowRadius: 14,
                        elevation: 10,
                    }}
                >
                    {/* decorative circles */}
                    <View
                        pointerEvents="none"
                        className="absolute w-48 h-48 rounded-full bg-white/10"
                        style={{ right: -60, top: -70 }}
                    />
                    <View
                        pointerEvents="none"
                        className="absolute w-32 h-32 rounded-full bg-white/10"
                        style={{ left: -40, bottom: -60 }}
                    />

                    <View className="items-center px-6 pt-8 pb-6">
                        <View className="w-32 h-32 items-center justify-center mb-5">
                            <PulseRing size={112} maxScale={1.45} />
                            <PulseRing size={112} maxScale={1.45} delay={900} />
                            <View
                                className="w-28 h-28 rounded-full bg-white items-center justify-center"
                                style={{
                                    shadowColor: "#000",
                                    shadowOffset: { width: 0, height: 6 },
                                    shadowOpacity: 0.2,
                                    shadowRadius: 10,
                                    elevation: 8,
                                }}
                            >
                                <Ionicons
                                    name="warning"
                                    size={30}
                                    color={PALETTE.blood}
                                />
                                <Text
                                    className="text-[24px] font-extrabold tracking-widest"
                                    style={{ color: PALETTE.blood }}
                                >
                                    SOS
                                </Text>
                            </View>
                        </View>

                        <Text className="text-[20px] font-extrabold text-white text-center">
                            Emergency Assistance
                        </Text>
                        <Text className="text-[13px] text-white/85 text-center mt-1">
                            {t(
                                "Piliin ang numerong tatawagan para sa agarang tulong.",
                                "Choose a number to call for urgent help.",
                            )}
                        </Text>

                        <View className="flex-row items-center gap-1.5 mt-4 px-3 py-1.5 rounded-full bg-black/20 border border-white/20">
                            <Ionicons name="heart" size={12} color="#FFD2C9" />
                            <Text className="text-white text-[11.5px] font-semibold">
                                {t(
                                    "Manatiling kalmado, may tutulong sa iyo",
                                    "Stay calm, help is on the way",
                                )}
                            </Text>
                        </View>
                    </View>
                </LinearGradient>

                {/* Dynamic barangay hotline */}
                {profile?.role !== "admin" && (
                    <>
                        <SectionTitle
                            title={t("Pinakamalapit na Tulong", "Nearest Help")}
                            color={PALETTE.forest}
                        />
                        <Pressable
                            className="mb-7"
                            onPress={() => callNumber(barangayHotline)}
                        >
                            {({ pressed }) => (
                                <LinearGradient
                                    colors={["#56A06A", "#2F6540"]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={[
                                        clayRaised,
                                        pressScale(pressed),
                                        { borderRadius: 26, overflow: "hidden" },
                                    ]}
                                >
                                    {/* big faded icon as a background decoration */}
                                    <View
                                        pointerEvents="none"
                                        className="absolute"
                                        style={{
                                            right: -14,
                                            bottom: -24,
                                            opacity: 0.14,
                                        }}
                                    >
                                        <Ionicons
                                            name="home"
                                            size={104}
                                            color="#fff"
                                        />
                                    </View>

                                    <View className="flex-row items-center gap-3 p-4">
                                        <View className="w-12 h-12 rounded-2xl bg-white/25 items-center justify-center border border-white/30">
                                            <Ionicons
                                                name="call"
                                                size={22}
                                                color="#fff"
                                            />
                                        </View>
                                        <View className="flex-1">
                                            <Text
                                                className="text-[12px] text-white/85 font-semibold"
                                                numberOfLines={1}
                                            >
                                                Barangay {barangay ?? "Hotline"}
                                            </Text>
                                            <Text className="text-[19px] font-extrabold text-white mt-0.5">
                                                {barangayHotline}
                                            </Text>
                                        </View>
                                        <View className="px-3.5 py-2 rounded-full bg-white">
                                            <Text
                                                className="text-[12px] font-bold"
                                                style={{ color: PALETTE.forest }}
                                            >
                                                {t("Tawagan", "Call")}
                                            </Text>
                                        </View>
                                    </View>
                                </LinearGradient>
                            )}
                        </Pressable>
                    </>
                )}

                {/* National agency hotlines */}
                <SectionTitle
                    title={t("Mga Numero ng Ahensya", "Agency Hotlines")}
                    color={PALETTE.terracotta}
                />

                <View className="gap-3.5 mb-6">
                    {NATIONAL_HOTLINES.map((agency) => (
                        <View
                            key={agency.agency}
                            style={clayRaised}
                            className="bg-white rounded-[26px] p-4 overflow-hidden"
                        >
                            {/* big faded icon as a background decoration */}
                            <View
                                pointerEvents="none"
                                className="absolute"
                                style={{ right: -16, top: -18, opacity: 0.08 }}
                            >
                                <Ionicons
                                    name={agency.icon}
                                    size={110}
                                    color={agency.colors[1]}
                                />
                            </View>

                            <View className="flex-row items-center gap-3 mb-3.5">
                                <LinearGradient
                                    colors={agency.colors}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={{
                                        width: 46,
                                        height: 46,
                                        borderRadius: 16,
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    <Ionicons
                                        name={agency.icon}
                                        size={21}
                                        color="#fff"
                                    />
                                </LinearGradient>
                                <View className="flex-1">
                                    <Text
                                        className="text-[15px] font-extrabold"
                                        style={{ color: PALETTE.ink }}
                                    >
                                        {t(agency.agency, agency.agencyEn)}
                                    </Text>
                                    <View className="flex-row mt-1">
                                        <View
                                            className="px-2 py-0.5 rounded-full"
                                            style={{
                                                backgroundColor: agency.tint,
                                            }}
                                        >
                                            <Text
                                                className="text-[11px] font-semibold"
                                                style={{
                                                    color: agency.colors[1],
                                                }}
                                            >
                                                {t(
                                                    agency.description,
                                                    agency.descriptionEn,
                                                )}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </View>

                            <View className="flex-row gap-2.5">
                                <LineButton
                                    label={t("Linya 1", "Line 1")}
                                    number={agency.hotline1}
                                    colors={agency.colors}
                                />
                                <LineButton
                                    label={t("Linya 2", "Line 2")}
                                    number={agency.hotline2}
                                    colors={agency.colors}
                                />
                            </View>
                        </View>
                    ))}
                </View>

                {/* Reminder */}
                <View
                    className="flex-row items-start gap-3 p-4 rounded-[22px] border"
                    style={{
                        backgroundColor: "rgba(232,169,59,0.12)",
                        borderColor: "rgba(232,169,59,0.35)",
                    }}
                >
                    <Ionicons
                        name="information-circle"
                        size={20}
                        color="#B9791A"
                    />
                    <Text
                        className="flex-1 text-[12px] leading-[18px]"
                        style={{ color: PALETTE.muted }}
                    >
                        {t(
                            "Sabihin agad ang iyong pangalan, eksaktong lokasyon, at kung ano ang nangyari para mabilis kang matulungan.",
                            "Say your name, exact location, and what happened right away so you can be helped quickly.",
                        )}
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

