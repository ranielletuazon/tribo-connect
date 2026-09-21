import { AuthHeader } from "@/components/auth-header";
import { clayRaised } from "@/components/clay";
import { useAuth } from "@/providers/auth-provider";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, type Href } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface MenuItem {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    route?: Href; // omitted = not built yet, row is inert
}

interface MenuSection {
    label: string;
    items: MenuItem[];
}

const MENU_SECTIONS: MenuSection[] = [
    {
        label: "Account",
        items: [
            { icon: "person-outline", label: "I-edit ang Profile" },
            {
                icon: "settings-outline",
                label: "Mga Setting",
                route: "/(tabs)/profile/settings",
            },
        ],
    },
    {
        label: "Aktibidad",
        items: [{ icon: "document-text-outline", label: "Aking mga Ulat" }],
    },
    {
        label: "Suporta",
        items: [
            { icon: "help-circle-outline", label: "Tulong at FAQ" },
            { icon: "call-outline", label: "Makipag-ugnayan sa Barangay" },
        ],
    },
    {
        label: "Tungkol",
        items: [
            {
                icon: "information-circle-outline",
                label: "Tungkol sa TriboConnect",
            },
            { icon: "shield-checkmark-outline", label: "Patakaran sa Privacy" },
        ],
    },
];

export default function Profile() {
    const router = useRouter();
    const { user, profile } = useAuth();

    const displayName = profile?.username ?? user?.email ?? "Gumagamit";
    const initials = displayName.slice(0, 2).toUpperCase();

    return (
        <SafeAreaView className="flex-1 bg-[--main-white]" edges={["top"]}>
            <ScrollView contentContainerClassName="px-6 pt-6 pb-10">
                <AuthHeader title="Profile" />

                <View className="items-center mb-8">
                    <View
                        style={clayRaised}
                        className="w-20 h-20 rounded-full bg-[#3F5C42] items-center justify-center mb-3"
                    >
                        <Text className="text-white text-[22px] font-bold">
                            {initials}
                        </Text>
                    </View>
                    <Text className="text-[17px] font-bold text-[#1F2A1F]">
                        {displayName}
                    </Text>
                    {profile?.barangay && (
                        <Text className="text-[13px] text-[#7A6D5C] mt-0.5">
                            Barangay {profile.barangay}
                        </Text>
                    )}
                </View>

                {MENU_SECTIONS.map((section) => (
                    <View key={section.label} className="mb-6">
                        <Text className="text-[13px] font-medium text-[#7A6D5C] mb-2 ml-1">
                            {section.label}
                        </Text>
                        <View
                            className="bg-[--main-white] rounded-[20px] overflow-hidden"
                            style={clayRaised}
                        >
                            {section.items.map((item, i) => (
                                <Pressable
                                    key={item.label}
                                    className={`flex-row items-center gap-3 p-4 ${
                                        i < section.items.length - 1
                                            ? "border-b border-[#EDEAE2]"
                                            : ""
                                    }`}
                                    disabled={!item.route}
                                    onPress={() =>
                                        item.route && router.push(item.route)
                                    }
                                >
                                    <Ionicons
                                        name={item.icon}
                                        size={19}
                                        color="#1F2A1F"
                                    />
                                    <Text className="flex-1 text-[14.5px] font-medium text-[#1F2A1F]">
                                        {item.label}
                                    </Text>
                                    {item.route ? (
                                        <Ionicons
                                            name="chevron-forward"
                                            size={16}
                                            color="#C4BFB2"
                                        />
                                    ) : (
                                        <Text className="text-[10.5px] text-[#C4BFB2] font-medium">
                                            Malapit na
                                        </Text>
                                    )}
                                </Pressable>
                            ))}
                        </View>
                    </View>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}
