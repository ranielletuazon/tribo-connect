import {
    BackgroundBlobs,
    clayRaised,
    pressScale,
    PulseRing,
} from "@/components/clay";
import {
    NotificationPermissionModal,
    type NotificationPromptMode,
} from "@/components/notification-permission-modal";
import { VerifiedBadge } from "@/components/verified-badge";
import {
    getNotificationPermission,
    requestNotificationPermission,
    savePushToken,
    setupNotificationChannel,
} from "@/lib/push-notifications";
import { BARANGAY, MUNICIPALITY, PROVINCE } from "@/constants/barangays";
import { PALETTE as COLORS } from "@/constants/palette";
import { useLanguage, type Language } from "@/hooks/use-language";
import { useAuth } from "@/providers/auth-provider";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, type Href } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    AppState,
    Image,
    ImageBackground,
    Linking,
    Pressable,
    ScrollView,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface ServiceItem {
    icon: keyof typeof Ionicons.glyphMap;
    colors: [string, string];
    title: string;
    titleEn: string;
    subtitle: string;
    subtitleEn: string;
    route: Href;
}

const HERO_IMAGE = require("../../../assets/images/triboconnect-poster.jpg");
const TRIBO_AI_MASCOT = require("../../../assets/images/triboAI.png");

const announcements: ServiceItem = {
    icon: "megaphone",
    colors: ["#E8894F", COLORS.clay],
    title: "Mga Anunsiyo",
    titleEn: "Announcements",
    subtitle: "Balita mula sa komunidad",
    subtitleEn: "News from the community",
    route: "/(tabs)/community",
};

const messages: ServiceItem = {
    icon: "chatbubbles",
    colors: ["#56A06A", "#2F6540"],
    title: "Mensahe",
    titleEn: "Messages",
    subtitle: "Pamilya at komunidad",
    subtitleEn: "Family and community",
    route: "/(tabs)/chat",
};

const report: ServiceItem = {
    icon: "document-text",
    colors: ["#F2BD4E", "#C9821F"],
    title: "Mag-report ng Insidente",
    titleEn: "Report an Incident",
    subtitle: "I-pakalat ang isang pangyayari",
    subtitleEn: "Let others know what happened",
    route: "/(tabs)/report",
};

function getGreeting(lang: Language) {
    const hour = new Date().getHours();
    const en = lang === "en";
    if (hour < 12) return en ? "Good morning" : "Magandang umaga";
    if (hour < 18) return en ? "Good afternoon" : "Magandang hapon";
    return en ? "Good evening" : "Magandang gabi";
}

function ServiceTile({ item, wide }: { item: ServiceItem; wide?: boolean }) {
    const { t } = useLanguage();

    return (
        <Pressable
            className={wide ? "w-full" : "flex-1"}
            onPress={() => router.push(item.route)}
        >
            {({ pressed }) => (
                <LinearGradient
                    colors={item.colors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[
                        clayRaised,
                        pressScale(pressed),
                        {
                            borderRadius: 26,
                            overflow: "hidden",
                            minHeight: wide ? 0 : 150,
                        },
                    ]}
                >
                    {/* big faded icon as a background decoration */}
                    <View
                        pointerEvents="none"
                        className="absolute"
                        style={{ right: -18, bottom: -22, opacity: 0.16 }}
                    >
                        <Ionicons
                            name={item.icon}
                            size={wide ? 96 : 110}
                            color="#fff"
                        />
                    </View>

                    <View
                        className={
                            wide
                                ? "flex-row items-center gap-3 p-4"
                                : "flex-1 justify-between p-4"
                        }
                    >
                        <View className="w-11 h-11 rounded-2xl bg-white/25 items-center justify-center border border-white/30">
                            <Ionicons name={item.icon} size={20} color="#fff" />
                        </View>
                        <View className={wide ? "flex-1" : "mt-6"}>
                            <Text className="text-[15px] font-bold text-white">
                                {t(item.title, item.titleEn)}
                            </Text>
                            <Text className="text-[12px] text-white/85 mt-0.5">
                                {t(item.subtitle, item.subtitleEn)}
                            </Text>
                        </View>
                        {wide && (
                            <View className="w-8 h-8 rounded-full bg-white/25 items-center justify-center">
                                <Ionicons
                                    name="arrow-forward"
                                    size={16}
                                    color="#fff"
                                />
                            </View>
                        )}
                    </View>
                </LinearGradient>
            )}
        </Pressable>
    );
}

export default function Home() {
    const { user, profile } = useAuth();
    const { lang, t } = useLanguage();
    const uid = user?.uid;

    const [notificationPrompt, setNotificationPrompt] =
        useState<NotificationPromptMode | null>(null);
    const [isEnablingNotifications, setIsEnablingNotifications] =
        useState(false);
    // the system prompt sends the app to the background on Android,
    // so skip the re-check that happens when it comes back
    const isRequestingRef = useRef(false);

    // keep asking until notifications are allowed and this device's token is saved.
    // runs when the user lands here and every time the app is opened again
    useEffect(() => {
        if (!uid) return;
        let cancelled = false;

        const checkNotifications = async () => {
            try {
                await setupNotificationChannel();
                const permission = await getNotificationPermission();
                if (cancelled) return;

                if (permission === "granted") {
                    try {
                        // refresh the token every time since it can change
                        await savePushToken(uid);
                        if (!cancelled) setNotificationPrompt(null);
                    } catch (err) {
                        // allowed but no token saved yet, ask again
                        console.error("Save push token error:", err);
                        if (!cancelled) setNotificationPrompt("enable");
                    }
                } else if (permission === "ask") {
                    setNotificationPrompt("enable");
                } else if (permission === "blocked") {
                    setNotificationPrompt("settings");
                }
            } catch (err) {
                console.error("Notification permission check error:", err);
            }
        };

        checkNotifications();

        let previousState = AppState.currentState;
        const subscription = AppState.addEventListener("change", (state) => {
            if (
                previousState === "background" &&
                state === "active" &&
                !isRequestingRef.current
            ) {
                checkNotifications();
            }
            previousState = state;
        });

        return () => {
            cancelled = true;
            subscription.remove();
        };
    }, [uid]);

    const handleEnableNotifications = async () => {
        if (!uid) return;

        // Android won't show the prompt anymore, the user has to turn it on
        // in settings. it gets checked again when they come back to the app
        if (notificationPrompt === "settings") {
            setNotificationPrompt(null);
            await Linking.openSettings();
            return;
        }

        setIsEnablingNotifications(true);
        isRequestingRef.current = true;
        try {
            const granted = await requestNotificationPermission();
            if (granted) {
                await savePushToken(uid);
            }
        } catch (err) {
            console.error("Enable notifications error:", err);
        } finally {
            setIsEnablingNotifications(false);
            setNotificationPrompt(null);
            setTimeout(() => {
                isRequestingRef.current = false;
            }, 1000);
        }
    };

    const isAdmin = profile?.role === "admin";

    return (
        <SafeAreaView
            className="flex-1"
            style={{ backgroundColor: COLORS.cream }}
            edges={["top"]}
        >
            <NotificationPermissionModal
                visible={notificationPrompt !== null}
                mode={notificationPrompt ?? "enable"}
                isEnabling={isEnablingNotifications}
                onEnable={handleEnableNotifications}
                onDismiss={() => setNotificationPrompt(null)}
            />

            <BackgroundBlobs
                colors={[COLORS.leaf, COLORS.gold]}
                opacity={[0.28, 0.18]}
            />

            <ScrollView
                contentContainerClassName="px-5 pt-3 pb-10"
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View className="flex-row items-center justify-between mb-5">
                    <View className="flex-1 mr-3">
                        <Text
                            className="text-[13px] font-medium"
                            style={{ color: COLORS.muted }}
                        >
                            {getGreeting(lang)},
                        </Text>
                        <View className="flex-row items-center gap-1.5 mt-0.5">
                            <Text
                                className="text-[24px] font-extrabold shrink"
                                style={{ color: COLORS.ink }}
                                numberOfLines={1}
                            >
                                {profile?.username ?? t("Kaibigan", "Friend")}
                            </Text>
                            {profile?.isVerified === true && (
                                <VerifiedBadge size={19} />
                            )}
                        </View>
                        <View className="flex-row mt-2">
                            <View
                                className="flex-row items-center gap-1 px-2.5 py-1 rounded-full"
                                style={{
                                    backgroundColor: isAdmin
                                        ? "rgba(217,115,63,0.14)"
                                        : "rgba(62,123,79,0.12)",
                                }}
                            >
                                <Ionicons
                                    name={
                                        isAdmin
                                            ? "shield-checkmark"
                                            : "location"
                                    }
                                    size={12}
                                    color={
                                        isAdmin ? COLORS.clay : COLORS.forest
                                    }
                                />
                                <Text
                                    className="text-[11.5px] font-semibold"
                                    style={{
                                        color: isAdmin
                                            ? COLORS.clay
                                            : COLORS.forest,
                                    }}
                                    numberOfLines={1}
                                >
                                    {isAdmin
                                        ? t(`Admin ng ${BARANGAY}`, `${BARANGAY} Admin`)
                                        : `Brgy. ${BARANGAY}`}{" "}
                                    · {MUNICIPALITY}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* avatar with a gradient ring, opens the profile */}
                    <Pressable onPress={() => router.push("/(tabs)/profile")}>
                        {({ pressed }) => (
                            <LinearGradient
                                colors={[
                                    COLORS.leaf,
                                    COLORS.gold,
                                    COLORS.terracotta,
                                ]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={[
                                    clayRaised,
                                    pressScale(pressed),
                                    { borderRadius: 32, padding: 2.5 },
                                ]}
                            >
                                <View
                                    className="w-14 h-14 rounded-full items-center justify-center overflow-hidden border-2"
                                    style={{
                                        backgroundColor: COLORS.sage,
                                        borderColor: COLORS.cream,
                                    }}
                                >
                                    {profile?.photoURL ? (
                                        <Image
                                            source={{ uri: profile.photoURL }}
                                            className="w-full h-full"
                                            resizeMode="cover"
                                        />
                                    ) : (
                                        <Text className="text-white text-[20px] font-bold">
                                            {(profile?.username ?? "U")
                                                .slice(0, 2)
                                                .toUpperCase()}
                                        </Text>
                                    )}
                                </View>
                            </LinearGradient>
                        )}
                    </Pressable>
                </View>

                {/* Hero */}
                <View
                    className="rounded-[30px] overflow-hidden mb-5"
                    style={clayRaised}
                >
                    <ImageBackground
                        source={HERO_IMAGE}
                        className="h-56"
                        resizeMode="cover"
                    >
                        <LinearGradient
                            colors={[
                                "rgba(20,35,24,0.05)",
                                "rgba(20,35,24,0.35)",
                                "rgba(16,32,20,0.92)",
                            ]}
                            locations={[0, 0.45, 1]}
                            style={{ flex: 1, padding: 20 }}
                        >
                            <View className="flex-row">
                                <View className="flex-row items-center gap-1 px-3 py-1.5 rounded-full bg-black/30 border border-white/25">
                                    <Ionicons
                                        name="leaf"
                                        size={12}
                                        color={COLORS.leaf}
                                    />
                                    <Text className="text-white text-[11px] font-semibold tracking-wide">
                                        {MUNICIPALITY}, {PROVINCE}
                                    </Text>
                                </View>
                            </View>

                            <View className="flex-1 justify-end">
                                <Text className="text-white/85 text-[14px] font-medium">
                                    {t("Maligayang Pagdating sa", "Welcome to")}
                                </Text>
                                <Text className="text-[30px] font-extrabold leading-9">
                                    <Text style={{ color: COLORS.leaf }}>
                                        Tribo
                                    </Text>
                                    <Text style={{ color: "#F5A45D" }}>
                                        Connect
                                    </Text>
                                </Text>
                                <Text className="text-white/90 text-[12.5px]">
                                    {t(
                                        "Iyong komunidad. Iyong boses. Iyong kaligtasan.",
                                        "Your community. Your voice. Your safety.",
                                    )}
                                </Text>
                            </View>
                        </LinearGradient>
                    </ImageBackground>
                </View>

                {/* Emergency */}
                <Pressable
                    className="mb-7"
                    onPress={() => router.push("/(tabs)/emergency/" as Href)}
                >
                    {({ pressed }) => (
                        <LinearGradient
                            colors={[COLORS.ember, "#D33C2E", COLORS.blood]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={[
                                {
                                    borderRadius: 26,
                                    overflow: "hidden",
                                    shadowColor: COLORS.blood,
                                    shadowOffset: { width: 0, height: 8 },
                                    shadowOpacity: 0.35,
                                    shadowRadius: 14,
                                    elevation: 10,
                                },
                                pressScale(pressed),
                            ]}
                        >
                            {/* decorative circles */}
                            <View
                                pointerEvents="none"
                                className="absolute w-40 h-40 rounded-full bg-white/10"
                                style={{ right: -40, top: -60 }}
                            />
                            <View
                                pointerEvents="none"
                                className="absolute w-24 h-24 rounded-full bg-white/10"
                                style={{ right: 50, bottom: -50 }}
                            />

                            <View className="flex-row items-center gap-4 px-4 py-5">
                                <View className="w-14 h-14 items-center justify-center">
                                    <PulseRing size={56} />
                                    <View className="w-14 h-14 rounded-full bg-white items-center justify-center">
                                        <Ionicons
                                            name="warning"
                                            size={26}
                                            color={COLORS.blood}
                                        />
                                    </View>
                                </View>
                                <View className="flex-1">
                                    <Text className="text-[18px] font-extrabold text-white">
                                        Emergency
                                    </Text>
                                    <Text className="text-[12.5px] text-white/85 mt-0.5">
                                        {t(
                                            "Pindutin para humingi ng agarang tulong",
                                            "Tap to ask for urgent help",
                                        )}
                                    </Text>
                                </View>
                                <View className="px-3 py-1.5 rounded-full bg-white">
                                    <Text
                                        className="text-[12px] font-extrabold tracking-widest"
                                        style={{ color: COLORS.blood }}
                                    >
                                        SOS
                                    </Text>
                                </View>
                            </View>
                        </LinearGradient>
                    )}
                </Pressable>

                {/* Services */}
                <View className="flex-row items-center gap-2 mb-3 ml-1">
                    <Text
                        className="text-[17px] font-extrabold"
                        style={{ color: COLORS.ink }}
                    >
                        {t("Mabilisang Serbisyo", "Quick Services")}
                    </Text>
                </View>

                <View className="gap-3 mb-7">
                    <View className="flex-row gap-3">
                        <ServiceTile item={announcements} />
                        <ServiceTile item={messages} />
                    </View>
                    <ServiceTile item={report} wide />
                </View>

                {/* TriboAI */}
                <Pressable
                    onPress={() => router.push("/(tabs)/tribobot" as Href)}
                >
                    {({ pressed }) => (
                        <LinearGradient
                            colors={["#E9F4E4", "#CFE7C8"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={[
                                clayRaised,
                                pressScale(pressed),
                                {
                                    borderRadius: 26,
                                    overflow: "hidden",
                                    borderWidth: 1,
                                    borderColor: "rgba(62,123,79,0.15)",
                                },
                            ]}
                        >
                            <View className="flex-row items-center p-4 gap-3">
                                <View className="flex-1">
                                    <View className="flex-row items-center gap-1 mb-1">
                                        <Ionicons
                                            name="sparkles"
                                            size={13}
                                            color={COLORS.forest}
                                        />
                                        <Text
                                            className="text-[11px] font-bold tracking-widest"
                                            style={{ color: COLORS.forest }}
                                        >
                                            TRIBOAI
                                        </Text>
                                    </View>
                                    <Text
                                        className="text-[16px] font-extrabold"
                                        style={{ color: COLORS.ink }}
                                    >
                                        {t("May tanong ka ba?", "Have a question?")}
                                    </Text>
                                    <Text
                                        className="text-[12px] mt-0.5"
                                        style={{ color: COLORS.muted }}
                                    >
                                        {t(
                                            "Kausapin si TriboAI, ang iyong katuwang sa komunidad.",
                                            "Talk to TriboAI, your community helper.",
                                        )}
                                    </Text>
                                    <View className="flex-row mt-3">
                                        <View
                                            className="flex-row items-center gap-1.5 px-3.5 py-2 rounded-full"
                                            style={{
                                                backgroundColor: COLORS.forest,
                                            }}
                                        >
                                            <Text className="text-white text-[12px] font-bold">
                                                {t("Magtanong", "Ask")}
                                            </Text>
                                            <Ionicons
                                                name="arrow-forward"
                                                size={13}
                                                color="#fff"
                                            />
                                        </View>
                                    </View>
                                </View>
                                <Image
                                    source={TRIBO_AI_MASCOT}
                                    className="w-24 h-24"
                                    resizeMode="contain"
                                />
                            </View>
                        </LinearGradient>
                    )}
                </Pressable>
            </ScrollView>
        </SafeAreaView>
    );
}
