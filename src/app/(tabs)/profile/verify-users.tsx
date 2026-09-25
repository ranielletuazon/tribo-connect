import { AuthHeader } from "@/components/auth-header";
import { clayRaised } from "@/components/clay";
import { useAuth } from "@/providers/auth-provider";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type VerificationType =
    | "barangay-id"
    | "aeta-id"
    | "drivers-license"
    | "national-id"
    | "national-id-egov"
    | "iba-pa";

const VERIFICATION_TYPES: Record<
    VerificationType,
    { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }
> = {
    "barangay-id": { label: "Barangay ID", icon: "home", color: "#3F5C42" },
    "aeta-id": { label: "Aeta ID", icon: "people", color: "#A85A30" },
    "drivers-license": {
        label: "Driver's License",
        icon: "car",
        color: "#2A4F9E",
    },
    "national-id": { label: "National ID", icon: "card", color: "#6B4F94" },
    "national-id-egov": {
        label: "National ID (eGov)",
        icon: "phone-portrait",
        color: "#2A7F8F",
    },
    "iba-pa": { label: "Iba Pa", icon: "document-text", color: "#7A6D5C" },
};

// placeholder data for now, not connected to Firestore yet
const VERIFICATION_REQUESTS: {
    id: string;
    username: string;
    type: VerificationType;
    submittedAt: string;
}[] = [
    {
        id: "1",
        username: "juandelacruz",
        type: "barangay-id",
        submittedAt: "Ngayon lang",
    },
    {
        id: "2",
        username: "maria_santos",
        type: "national-id",
        submittedAt: "15 minuto ang nakalipas",
    },
    {
        id: "3",
        username: "pedro.reyes",
        type: "aeta-id",
        submittedAt: "1 oras ang nakalipas",
    },
    {
        id: "4",
        username: "ana_garcia",
        type: "drivers-license",
        submittedAt: "3 oras ang nakalipas",
    },
    {
        id: "5",
        username: "jose_mendoza",
        type: "national-id-egov",
        submittedAt: "Kahapon",
    },
    {
        id: "6",
        username: "liza.bautista",
        type: "iba-pa",
        submittedAt: "2 araw ang nakalipas",
    },
];

export default function VerifyUsers() {
    const router = useRouter();
    const { profile } = useAuth();

    // only admins can open this screen
    if (profile?.role !== "admin") {
        return (
            <SafeAreaView className="flex-1 bg-[--main-white] items-center justify-center px-8">
                <Ionicons name="lock-closed" size={36} color="#C4BFB2" />
                <Text className="text-center text-[13.5px] text-[#9C978C] mt-3 mb-5">
                    Ang mga admin lamang ang maaaring pumasok sa pahinang ito.
                </Text>
                <Pressable
                    onPress={() => router.back()}
                    className="rounded-full px-5 py-2 bg-[#2F5233]"
                >
                    <Text className="text-[13.5px] font-semibold text-white">
                        Bumalik
                    </Text>
                </Pressable>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-[--main-white]" edges={["top"]}>
            <ScrollView contentContainerClassName="px-6 pt-4 pb-10">
                <AuthHeader title="I-verify ang mga User" />

                {/* Supported IDs */}
                <Text className="text-[13px] font-medium text-[#7A6D5C] mb-2 ml-1 mt-2">
                    Mga Suportadong ID
                </Text>
                <View className="flex-row flex-wrap gap-2 mb-6">
                    {Object.values(VERIFICATION_TYPES).map((type) => (
                        <View
                            key={type.label}
                            className="flex-row items-center gap-1.5 bg-[#F0EDE6] rounded-full px-3 py-1.5"
                        >
                            <Ionicons
                                name={type.icon}
                                size={12}
                                color={type.color}
                            />
                            <Text className="text-[12px] font-medium text-[#1F2A1F]">
                                {type.label}
                            </Text>
                        </View>
                    ))}
                </View>

                {/* Requests */}
                <View className="flex-row items-center justify-between mb-2 ml-1">
                    <Text className="text-[13px] font-medium text-[#7A6D5C]">
                        Naghihintay ng Beripikasyon
                    </Text>
                    <View className="bg-[#9C3A2A] rounded-full px-2 py-0.5">
                        <Text className="text-[11px] font-bold text-white">
                            {VERIFICATION_REQUESTS.length}
                        </Text>
                    </View>
                </View>

                <View
                    style={clayRaised}
                    className="bg-[--main-white] rounded-[20px] overflow-hidden"
                >
                    {VERIFICATION_REQUESTS.length === 0 ? (
                        <Text className="text-center text-[13px] text-[#9C978C] p-6">
                            Walang user na naghihintay ng beripikasyon.
                        </Text>
                    ) : (
                        VERIFICATION_REQUESTS.map((request, i) => {
                            const type = VERIFICATION_TYPES[request.type];
                            return (
                                <View
                                    key={request.id}
                                    className={`flex-row items-center gap-3 p-4 ${
                                        i < VERIFICATION_REQUESTS.length - 1
                                            ? "border-b border-[#EDEAE2]"
                                            : ""
                                    }`}
                                >
                                    <View className="w-11 h-11 rounded-full bg-[#5C7A5F] items-center justify-center">
                                        <Text className="text-white text-[13px] font-semibold">
                                            {request.username
                                                .slice(0, 2)
                                                .toUpperCase()}
                                        </Text>
                                    </View>
                                    <View className="flex-1">
                                        <Text
                                            className="text-[14.5px] font-semibold text-[#1F2A1F]"
                                            numberOfLines={1}
                                        >
                                            {request.username}
                                        </Text>
                                        <View className="flex-row items-center gap-1 mt-1">
                                            <Ionicons
                                                name={type.icon}
                                                size={12}
                                                color={type.color}
                                            />
                                            <Text
                                                className="text-[12px] font-medium"
                                                style={{ color: type.color }}
                                            >
                                                {type.label}
                                            </Text>
                                        </View>
                                    </View>
                                    <View className="items-end gap-1">
                                        <View className="bg-[#FBF1E8] rounded-full px-2 py-0.5">
                                            <Text className="text-[10.5px] font-semibold text-[#A85A30]">
                                                Nakabinbin
                                            </Text>
                                        </View>
                                        <Text className="text-[10.5px] text-[#9C978C]">
                                            {request.submittedAt}
                                        </Text>
                                    </View>
                                </View>
                            );
                        })
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
