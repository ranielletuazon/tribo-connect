import { AuthHeader } from "@/components/auth-header";
import { ClaySurface, clayRaised } from "@/components/clay";
import { useAuth } from "@/providers/auth-provider";
import { Ionicons } from "@expo/vector-icons";
import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// TODO: replace placeholder numbers with real, verified hotlines before launch
const NATIONAL_HOTLINES = [
    {
        agency: "Ambulance (MDRRMO)",
        icon: "medkit" as const,
        colorLight: "#E0715F",
        colorDark: "#9C3A2A",
        hotline1: "0929 441 6188",
        hotline2: "0960 846 8671",
    },
    {
        agency: "Bumbero (BFP)",
        icon: "flame" as const,
        colorLight: "#E0A177",
        colorDark: "#A85A30",
        hotline1: "0909 918 7205",
        hotline2: "0967 283 6777",
    },
    {
        agency: "Pulis (PNP)",
        icon: "shield-checkmark" as const,
        colorLight: "#6B93E8",
        colorDark: "#2A4F9E",
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

export default function Emergency() {
    const { profile } = useAuth();
    const barangay = profile?.barangay as string | undefined;
    const barangayHotline = barangay
        ? (BARANGAY_HOTLINES[barangay] ?? FALLBACK_BARANGAY_HOTLINE)
        : FALLBACK_BARANGAY_HOTLINE;

    return (
        <SafeAreaView className="flex-1 bg-[--main-white]" edges={["top"]}>
            <ScrollView contentContainerClassName="px-6 pt-4 pb-10">
                <AuthHeader title="Emergency" />

                {/* SOS badge (just for design) */}
                <View
                    className="items-center justify-center mt-6 mb-2"
                    style={{ width: 180, height: 180, alignSelf: "center" }}
                >
                    <View
                        className="absolute rounded-full"
                        style={{
                            width: 180,
                            height: 180,
                            backgroundColor: "rgba(224,113,95,0.12)",
                        }}
                    />
                    <View
                        className="absolute rounded-full"
                        style={{
                            width: 158,
                            height: 158,
                            backgroundColor: "rgba(224,113,95,0.22)",
                        }}
                    />
                    <ClaySurface
                        colors={["#E0715F", "#9C3A2A"]}
                        borderRadius={999}
                        style={{
                            width: 136,
                            height: 136,
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <Text className="text-white text-[26px] font-bold tracking-wider">
                            SOS
                        </Text>
                    </ClaySurface>
                </View>

                <Text className="text-[16px] font-bold text-[#1F2A1F] text-center mt-2">
                    Emergency Assistance
                </Text>
                <Text className="text-[13px] text-[#7A6D5C] text-center mt-1 px-6 mb-2">
                    Piliin ang numerong tatawagan para sa agarang tulong.
                </Text>

                {/* National agency hotlines */}
                <Text className="text-[13px] font-medium text-[#7A6D5C] mb-3 ml-1 mt-6">
                    Mga Numero ng Ahensya
                </Text>

                <View className="gap-3.5 mb-6">
                    {NATIONAL_HOTLINES.map((agency) => (
                        <View
                            key={agency.agency}
                            style={clayRaised}
                            className="bg-[--main-white] rounded-2xl p-4"
                        >
                            <View className="flex-row items-center gap-3 mb-3.5">
                                <View
                                    className="w-10 h-10 rounded-full items-center justify-center"
                                    style={{
                                        backgroundColor: agency.colorDark,
                                    }}
                                >
                                    <Ionicons
                                        name={agency.icon}
                                        size={18}
                                        color="#fff"
                                    />
                                </View>
                                <Text className="text-[14.5px] font-bold text-[#1F2A1F]">
                                    {agency.agency}
                                </Text>
                            </View>

                            <View className="flex-row gap-2.5">
                                <Pressable
                                    className="flex-1"
                                    onPress={() => callNumber(agency.hotline1)}
                                >
                                    {({ pressed }) => (
                                        <ClaySurface
                                            colors={[
                                                agency.colorLight,
                                                agency.colorDark,
                                            ]}
                                            borderRadius={16}
                                            style={{
                                                paddingVertical: 12,
                                                alignItems: "center",
                                                opacity: pressed ? 0.88 : 1,
                                            }}
                                        >
                                            <Text className="text-[10px] text-white/75 font-medium mb-0.5">
                                                Linya 1
                                            </Text>
                                            <Text className="text-[13px] font-bold text-white">
                                                {agency.hotline1}
                                            </Text>
                                        </ClaySurface>
                                    )}
                                </Pressable>

                                <Pressable
                                    className="flex-1"
                                    onPress={() => callNumber(agency.hotline2)}
                                >
                                    {({ pressed }) => (
                                        <ClaySurface
                                            colors={[
                                                agency.colorLight,
                                                agency.colorDark,
                                            ]}
                                            borderRadius={16}
                                            style={{
                                                paddingVertical: 12,
                                                alignItems: "center",
                                                opacity: pressed ? 0.88 : 1,
                                            }}
                                        >
                                            <Text className="text-[10px] text-white/75 font-medium mb-0.5">
                                                Linya 2
                                            </Text>
                                            <Text className="text-[13px] font-bold text-white">
                                                {agency.hotline2}
                                            </Text>
                                        </ClaySurface>
                                    )}
                                </Pressable>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Dynamic barangay hotline */}
                <Text className="text-[13px] font-medium text-[#7A6D5C] mb-3 ml-1">
                    Barangay Hotline
                </Text>
                <Pressable onPress={() => callNumber(barangayHotline)}>
                    {({ pressed }) => (
                        <ClaySurface
                            colors={["#7A9B7D", "#3F5C42"]}
                            borderRadius={20}
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                gap: 12,
                                padding: 16,
                                opacity: pressed ? 0.9 : 1,
                            }}
                        >
                            <View className="w-11 h-11 rounded-full bg-white/20 items-center justify-center">
                                <Ionicons name="call" size={20} color="#fff" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-[14.5px] font-bold text-white">
                                    {barangayHotline}
                                </Text>
                                <Text className="text-[12px] text-white/75 mt-0.5">
                                    Barangay {barangay ?? "Hotline"}
                                </Text>
                            </View>
                            <Ionicons
                                name="chevron-forward"
                                size={18}
                                color="rgba(255,255,255,0.7)"
                            />
                        </ClaySurface>
                    )}
                </Pressable>
            </ScrollView>
        </SafeAreaView>
    );
}
