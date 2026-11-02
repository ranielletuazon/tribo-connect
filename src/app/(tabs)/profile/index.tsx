import { Avatar } from "@/components/avatar";
import { BackgroundBlobs, clayRaised, pressScale } from "@/components/clay";
import { VerifiedBadge } from "@/components/verified-badge";
import { BARANGAY } from "@/constants/barangays";
import { PALETTE } from "@/constants/palette";
import { useLanguage } from "@/hooks/use-language";
import { useAuth } from "@/providers/auth-provider";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, type Href } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface MenuItem {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    labelEn: string;
    route?: Href; // no route means the page isn't made yet
}

interface MenuSection {
    label: string;
    labelEn: string;
    // color of the icon tiles in this section
    color: string;
    tint: string;
    items: MenuItem[];
}

const MENU_SECTIONS: MenuSection[] = [
    {
        label: "Account",
        labelEn: "Account",
        color: PALETTE.forest,
        tint: "rgba(62,123,79,0.12)",
        items: [
            {
                icon: "person-outline",
                label: "I-edit ang Profile",
                labelEn: "Edit Profile",
                route: "/(tabs)/profile/edit-profile",
            },
            {
                icon: "shield-checkmark-outline",
                label: "I-verify ang Account",
                labelEn: "Verify Account",
                route: "/(tabs)/profile/verify",
            },
            {
                icon: "settings-outline",
                label: "Mga Setting",
                labelEn: "Settings",
                route: "/(tabs)/profile/settings",
            },
        ],
    },
    {
        label: "Aktibidad",
        labelEn: "Activity",
        color: "#C9821F",
        tint: "rgba(232,169,59,0.16)",
        items: [
            {
                icon: "document-text-outline",
                label: "Aking mga Ulat",
                labelEn: "My Reports",
            },
        ],
    },
    {
        label: "Suporta",
        labelEn: "Support",
        color: "#2A5C99",
        tint: "rgba(91,163,232,0.14)",
        items: [
            {
                icon: "help-circle-outline",
                label: "Tulong at FAQ",
                labelEn: "Help and FAQ",
            },
            {
                icon: "call-outline",
                label: "Makipag-ugnayan sa Barangay",
                labelEn: "Contact the Barangay",
            },
        ],
    },
    {
        label: "Tungkol",
        labelEn: "About",
        color: PALETTE.muted,
        tint: "rgba(122,109,92,0.12)",
        items: [
            {
                icon: "information-circle-outline",
                label: "Tungkol sa TriboConnect",
                labelEn: "About TriboConnect",
            },
            {
                icon: "shield-checkmark-outline",
                label: "Patakaran sa Privacy",
                labelEn: "Privacy Policy",
            },
        ],
    },
];

// only shown to users with role: "admin"
const ADMIN_SECTION: MenuSection = {
    label: "Admin Settings",
    labelEn: "Admin Settings",
    color: PALETTE.clay,
    tint: "rgba(217,115,63,0.14)",
    items: [
        {
            icon: "person-add-outline",
            label: "I-verify ang mga User",
            labelEn: "Verify Users",
            route: "/(tabs)/profile/verify-users",
        },
    ],
};

const APP_VERSION = Constants.expoConfig?.version ?? "1.0.0";

export default function Profile() {
    const router = useRouter();
    const { user, profile } = useAuth();
    const { t } = useLanguage();

    const displayName =
        profile?.username ?? user?.email ?? t("Gumagamit", "User");
    const isAdmin = profile?.role === "admin";
    const isVerified = profile?.isVerified === true;
    const menuSections = isAdmin
        ? [MENU_SECTIONS[0], ADMIN_SECTION, ...MENU_SECTIONS.slice(1)]
        : MENU_SECTIONS;

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
                {/* Profile card */}
                <LinearGradient
                    colors={["#56A06A", "#2F6540"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[
                        clayRaised,
                        { borderRadius: 30, overflow: "hidden", marginBottom: 16 },
                    ]}
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
                        style={{ left: -40, bottom: -50 }}
                    />

                    <View className="flex-row justify-between px-4 pt-4">
                        {router.canGoBack() ? (
                            <Pressable
                                onPress={() => router.back()}
                                hitSlop={6}
                                className="w-10 h-10 rounded-full bg-white/20 items-center justify-center border border-white/25"
                            >
                                <Ionicons
                                    name="arrow-back"
                                    size={20}
                                    color="#fff"
                                />
                            </Pressable>
                        ) : (
                            <View className="w-10" />
                        )}
                        <Pressable
                            onPress={() =>
                                router.push("/(tabs)/profile/settings")
                            }
                            hitSlop={6}
                            className="w-10 h-10 rounded-full bg-white/20 items-center justify-center border border-white/25"
                        >
                            <Ionicons
                                name="settings-outline"
                                size={19}
                                color="#fff"
                            />
                        </Pressable>
                    </View>

                    <View className="items-center px-5 pb-6 -mt-4">
                        <Pressable
                            onPress={() =>
                                router.push("/(tabs)/profile/edit-profile")
                            }
                        >
                            {({ pressed }) => (
                                <View style={pressScale(pressed)}>
                                    <Avatar
                                        name={displayName}
                                        photoURL={profile?.photoURL ?? null}
                                        size={88}
                                        ring
                                    />
                                    <View
                                        className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-white items-center justify-center"
                                        style={clayRaised}
                                    >
                                        <Ionicons
                                            name="pencil"
                                            size={14}
                                            color={PALETTE.forest}
                                        />
                                    </View>
                                </View>
                            )}
                        </Pressable>

                        <View className="flex-row items-center gap-1.5 mt-3">
                            <Text
                                className="text-[21px] font-extrabold text-white shrink"
                                numberOfLines={1}
                            >
                                {displayName}
                            </Text>
                            {isVerified && (
                                <View className="w-[22px] h-[22px] rounded-full bg-white items-center justify-center">
                                    <VerifiedBadge size={20} />
                                </View>
                            )}
                        </View>
                        {!!user?.email && (
                            <Text
                                className="text-[12.5px] text-white/80 mt-0.5"
                                numberOfLines={1}
                            >
                                {user.email}
                            </Text>
                        )}

                        <View className="flex-row flex-wrap justify-center gap-2 mt-3.5">
                            <View
                                className="flex-row items-center gap-1 rounded-full px-3 py-1.5"
                                style={{
                                    backgroundColor: isAdmin
                                        ? PALETTE.terracotta
                                        : "rgba(255,255,255,0.2)",
                                }}
                            >
                                <Ionicons
                                    name={isAdmin ? "shield-checkmark" : "person"}
                                    size={12}
                                    color="#fff"
                                />
                                <Text className="text-[11.5px] font-bold text-white">
                                    {isAdmin ? "Admin" : t("Residente", "Resident")}
                                </Text>
                            </View>
                            <View className="flex-row items-center gap-1 rounded-full px-3 py-1.5 bg-white/20">
                                <Ionicons
                                    name="location"
                                    size={12}
                                    color="#fff"
                                />
                                <Text className="text-[11.5px] font-semibold text-white">
                                    {isAdmin ? BARANGAY : `Barangay ${BARANGAY}`}
                                </Text>
                            </View>
                        </View>
                    </View>
                </LinearGradient>

                {/* Verification prompt, only until the account is verified */}
                {!isVerified && (
                    <Pressable
                        className="mb-6"
                        onPress={() => router.push("/(tabs)/profile/verify")}
                    >
                        {({ pressed }) => (
                            <LinearGradient
                                colors={["#F2BD4E", "#C9821F"]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={[
                                    clayRaised,
                                    pressScale(pressed),
                                    { borderRadius: 24, overflow: "hidden" },
                                ]}
                            >
                                <View
                                    pointerEvents="none"
                                    className="absolute"
                                    style={{
                                        right: -14,
                                        bottom: -22,
                                        opacity: 0.16,
                                    }}
                                >
                                    <Ionicons
                                        name="shield-checkmark"
                                        size={96}
                                        color="#fff"
                                    />
                                </View>
                                <View className="flex-row items-center gap-3 p-4">
                                    <View className="w-11 h-11 rounded-2xl bg-white/25 items-center justify-center border border-white/30">
                                        <Ionicons
                                            name="shield-checkmark"
                                            size={20}
                                            color="#fff"
                                        />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-[15px] font-extrabold text-white">
                                            {t(
                                                "I-verify ang iyong account",
                                                "Verify your account",
                                            )}
                                        </Text>
                                        <Text className="text-[12px] text-white/90 mt-0.5">
                                            {t(
                                                "Makakuha ng asul na tsek at tiwala ng komunidad.",
                                                "Get a blue check and the community's trust.",
                                            )}
                                        </Text>
                                    </View>
                                    <View className="w-8 h-8 rounded-full bg-white/25 items-center justify-center">
                                        <Ionicons
                                            name="arrow-forward"
                                            size={16}
                                            color="#fff"
                                        />
                                    </View>
                                </View>
                            </LinearGradient>
                        )}
                    </Pressable>
                )}

                {menuSections.map((section) => (
                    <View key={section.label} className="mb-5">
                        <View className="flex-row items-center gap-2 mb-2.5 ml-1">
                            <View
                                className="w-1.5 h-4 rounded-full"
                                style={{ backgroundColor: section.color }}
                            />
                            <Text
                                className="text-[14px] font-extrabold"
                                style={{ color: PALETTE.ink }}
                            >
                                {t(section.label, section.labelEn)}
                            </Text>
                        </View>
                        <View
                            className="bg-white rounded-[24px] overflow-hidden"
                            style={clayRaised}
                        >
                            {section.items.map((item, i) => (
                                <Pressable
                                    key={item.label}
                                    disabled={!item.route}
                                    onPress={() =>
                                        item.route && router.push(item.route)
                                    }
                                    style={({ pressed }) => ({
                                        backgroundColor: pressed
                                            ? section.tint
                                            : "transparent",
                                    })}
                                >
                                    <View className="flex-row items-center gap-3 px-4 py-3.5">
                                        <View
                                            className="w-9 h-9 rounded-xl items-center justify-center"
                                            style={{
                                                backgroundColor: section.tint,
                                            }}
                                        >
                                            <Ionicons
                                                name={item.icon}
                                                size={18}
                                                color={section.color}
                                            />
                                        </View>
                                        <Text
                                            className="flex-1 text-[14.5px] font-semibold"
                                            style={{
                                                color: item.route
                                                    ? PALETTE.ink
                                                    : "#9C978C",
                                            }}
                                        >
                                            {t(item.label, item.labelEn)}
                                        </Text>
                                        {item.route ? (
                                            <Ionicons
                                                name="chevron-forward"
                                                size={16}
                                                color="#C4BFB2"
                                            />
                                        ) : (
                                            <View className="rounded-full px-2 py-0.5 bg-[#F3EFE7]">
                                                <Text className="text-[10.5px] text-[#9C978C] font-semibold">
                                                    {t("Malapit na", "Coming soon")}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                    {/* divider lines up with the text, not the icon */}
                                    {i < section.items.length - 1 && (
                                        <View className="h-px bg-[#F1ECE3] ml-[64px]" />
                                    )}
                                </Pressable>
                            ))}
                        </View>
                    </View>
                ))}

                <Text className="text-[11.5px] text-[#B5AFA0] text-center mt-2">
                    TriboConnect · {t("Bersyon", "Version")} {APP_VERSION}
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
}
