import { clayRaised, ClaySurface, GradientBorderCard } from "@/components/clay";
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
import { useAuth } from "@/providers/auth-provider";
import { Ionicons } from "@expo/vector-icons";
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

interface FeatureItem {
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
    title: string;
    subtitle: string;
    route: Href;
}

const HERO_IMAGE = require("../../../assets/images/triboconnect-poster.jpg");
// TODO: check if this is the right file name
const TRIBO_AI_MASCOT = require("../../../assets/images/triboAI.png");

const listItems: FeatureItem[] = [
    {
        icon: "megaphone",
        color: "#C97748",
        title: "Mga Anunsiyo",
        subtitle: "Balita mula sa iyong komunidad",
        route: "/(tabs)/community",
    },
    {
        icon: "chatbubbles",
        color: "#5C7A5F",
        title: "Mensahe",
        subtitle: "Makipag-usap sa pamilya at komunidad",
        route: "/(tabs)/chat",
    },
    {
        icon: "document-text",
        color: "#5C7A5F",
        title: "Mag-report ng Insidente",
        subtitle: "I-pakalat ang isang pangyayari",
        route: "/(tabs)/report",
    },
];

export default function Home() {
    const { user, profile } = useAuth();
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

    return (
        <SafeAreaView className="flex-1 bg-[--main-white]" edges={["top"]}>
            <NotificationPermissionModal
                visible={notificationPrompt !== null}
                mode={notificationPrompt ?? "enable"}
                isEnabling={isEnablingNotifications}
                onEnable={handleEnableNotifications}
                onDismiss={() => setNotificationPrompt(null)}
            />
            <ScrollView contentContainerClassName="p-5 pb-8">
                {/* Header */}
                <View className="flex-row items-center justify-between mb-6">
                    <View className="flex-1 flex-row items-center gap-3 mr-3">
                        <View
                            className="w-11 h-11 rounded-[22px] bg-[#5C7A5F] items-center justify-center"
                            style={clayRaised}
                        >
                            {profile?.photoURL ? (
                                <Image
                                    source={{ uri: profile.photoURL }}
                                    className="w-full h-full rounded-full"
                                    resizeMode="cover"
                                />
                            ) : (
                                <Text className="text-white text-[22px] font-bold">
                                    {(profile?.username ?? "U")
                                        .slice(0, 2)
                                        .toUpperCase()}
                                </Text>
                            )}
                        </View>
                        <View className="flex-1">
                            <View className="flex-row items-center gap-1">
                                <Text
                                    className="text-[15px] font-semibold text-[#1F2A1F] shrink"
                                    numberOfLines={1}
                                >
                                    Kumusta! {profile?.username}
                                </Text>
                                {profile?.isVerified === true && (
                                    <VerifiedBadge size={15} />
                                )}
                            </View>
                            {profile?.role === "admin" ? (
                                <Text className="text-[12px] text-[#7A6D5C] mt-0.5">
                                    Admin ng {profile?.barangay} · Porac
                                </Text>
                            ) : (
                                <Text className="text-[12px] text-[#7A6D5C] mt-0.5">
                                    Barangay {profile?.barangay} · Porac
                                </Text>
                            )}
                        </View>
                    </View>

                    {/* TriboAI (page not made yet) */}
                    <Pressable
                        style={clayRaised}
                        className="w-14 h-14 rounded-full overflow-hidden bg-[--main-white] p-1.5"
                        onPress={() => router.push("/(tabs)/tribobot" as Href)}
                    >
                        <Image
                            source={TRIBO_AI_MASCOT}
                            className="w-full h-full"
                            resizeMode="cover"
                        />
                    </Pressable>
                </View>

                {/* Hero */}
                <GradientBorderCard
                    colors={["rgba(255,255,255,0.55)", "rgba(122,106,80,0.15)"]}
                    borderRadius={28}
                    style={{ marginBottom: 24 }}
                >
                    <ImageBackground
                        source={HERO_IMAGE}
                        className="h-52"
                        resizeMode="cover"
                    >
                        <View className="flex-1 justify-end p-5 bg-black/35">
                            <Text className="text-[20px] font-semibold leading-7">
                                <Text className="text-white">
                                    Maligayang Pagdating sa{"\n"}
                                </Text>
                                <Text className="text-[#5C7A5F] font-bold">
                                    Tribo
                                </Text>
                                <Text className="text-[#C97748] font-bold">
                                    Connect
                                </Text>
                            </Text>
                            <Text className="text-[#EDEDED] text-[13px] mt-1">
                                Iyong komunidad. Iyong boses. Iyong kaligtasan.
                            </Text>
                        </View>
                    </ImageBackground>
                </GradientBorderCard>

                {/* Emergency */}
                <Pressable
                    style={{ marginBottom: 16 }}
                    onPress={() => router.push("/(tabs)/emergency/" as Href)}
                >
                    {({ pressed }) => (
                        <ClaySurface
                            colors={["#E0715F", "#9C3A2A"]}
                            borderRadius={26}
                            style={{ opacity: pressed ? 0.9 : 1 }}
                        >
                            <View className="flex-row items-center gap-3 p-4">
                                <View className="w-11 h-11 rounded-[22px] bg-white items-center justify-center">
                                    <Ionicons
                                        name="warning"
                                        size={20}
                                        color="#9C3A2A"
                                    />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-[15px] font-bold text-white">
                                        Emergency
                                    </Text>
                                    <Text className="text-[12.5px] text-white/80 mt-0.5">
                                        Humingi ng agarang tulong
                                    </Text>
                                </View>
                                <Ionicons
                                    name="chevron-forward"
                                    size={18}
                                    color="#fff"
                                />
                            </View>
                        </ClaySurface>
                    )}
                </Pressable>

                <Text className="text-[13px] font-medium text-[#7A6D5C] mb-3 ml-1">
                    Mabilisang Serbisyo
                </Text>

                {/* List tiles */}
                <View className="gap-4">
                    {listItems.map((item) => (
                        <Pressable
                            key={item.title}
                            className="flex-row items-center gap-3 bg-[--main-white] rounded-[26px] p-4"
                            style={clayRaised}
                            onPress={() => router.push(item.route)}
                        >
                            <View
                                className="w-10 h-10 rounded-full items-center justify-center"
                                style={[
                                    clayRaised,
                                    { backgroundColor: item.color },
                                ]}
                            >
                                <Ionicons
                                    name={item.icon}
                                    size={17}
                                    color="#fff"
                                />
                            </View>
                            <View className="flex-1">
                                <Text className="text-[14.5px] font-bold text-[#1F2A1F]">
                                    {item.title}
                                </Text>
                                <Text className="text-[12px] text-[#7A6D5C] mt-0.5">
                                    {item.subtitle}
                                </Text>
                            </View>
                            <Ionicons
                                name="chevron-forward"
                                size={16}
                                color="#C4BFB2"
                            />
                        </Pressable>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
