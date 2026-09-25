import { AuthHeader } from "@/components/auth-header";
import { clayRaised } from "@/components/clay";
import { useAuth } from "@/providers/auth-provider";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, type Href } from "expo-router";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface MenuItem {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    route?: Href; // no route means the page isn't made yet
}

interface MenuSection {
    label: string;
    items: MenuItem[];
}

const MENU_SECTIONS: MenuSection[] = [
    {
        label: "Account",
        items: [
            {
                icon: "person-outline",
                label: "I-edit ang Profile",
                route: "/(tabs)/profile/edit-profile",
            },
            {
                icon: "settings-outline",
                label: "Mga Setting",
                route: "/(tabs)/profile/settings",
            },
            {
                icon: "settings-outline",
                label: "I-Verify ang Account",
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

// only shown to users with role: "admin"
const ADMIN_SECTION: MenuSection = {
    label: "Admin Settings",
    items: [
        {
            icon: "person-add-outline",
            label: "I-verify ang mga User",
            route: "/(tabs)/profile/verify-users",
        },
    ],
};

export default function Profile() {
    const router = useRouter();
    const { user, profile } = useAuth();

    const displayName = profile?.username ?? user?.email ?? "Gumagamit";
    const initials = displayName.slice(0, 2).toUpperCase();
    const menuSections =
        profile?.role === "admin"
            ? [MENU_SECTIONS[0], ADMIN_SECTION, ...MENU_SECTIONS.slice(1)]
            : MENU_SECTIONS;

    return (
        <SafeAreaView className="flex-1 bg-[--main-white]" edges={["top"]}>
            <ScrollView contentContainerClassName="px-6 pt-6 pb-10">
                <AuthHeader title="Profile" />

                <View className="items-center mb-8">
                    <View
                        style={clayRaised}
                        className="w-20 h-20 rounded-full bg-[#3F5C42] items-center justify-center mb-3"
                    >
                        {profile?.photoURL ? (
                            <Image
                                source={{ uri: profile.photoURL }}
                                className="w-full h-full rounded-full"
                                resizeMode="cover"
                            />
                        ) : (
                            <Text className="text-white text-[22px] font-bold">
                                {initials}
                            </Text>
                        )}
                    </View>
                    <View className="flex-row items-center gap-1.5">
                        <Text className="text-[17px] font-bold text-[#1F2A1F]">
                            {displayName}
                        </Text>
                        {profile?.role === "admin" && (
                            <View className="flex-row items-center gap-1 bg-[#9C3A2A] rounded-full px-2 py-0.5">
                                <Ionicons
                                    name="shield-checkmark"
                                    size={11}
                                    color="#fff"
                                />
                                <Text className="text-[10.5px] font-bold text-white tracking-wider">
                                    ADMIN
                                </Text>
                            </View>
                        )}
                    </View>
                    {profile?.role === "admin" ? (
                        <Text className="text-[13px] text-[#7A6D5C] mt-0.5">
                            {profile?.barangay}
                        </Text>
                    ) : (
                        <Text className="text-[13px] text-[#7A6D5C] mt-0.5">
                            Barangay {profile?.barangay}
                        </Text>
                    )}
                </View>

                {menuSections.map((section) => (
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
