import { AuthHeader } from "@/components/auth-header";
import { Avatar } from "@/components/avatar";
import { BackgroundBlobs, clayRaised, pressScale } from "@/components/clay";
import { VerifiedBadge } from "@/components/verified-badge";
import { BARANGAY } from "@/constants/barangays";
import { PALETTE } from "@/constants/palette";
import { useLanguage } from "@/hooks/use-language";
import { db } from "@/lib/firebase";
import { useAuth } from "@/providers/auth-provider";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";
import { doc, updateDoc } from "firebase/firestore";
import type { ReactNode } from "react";
import { useState } from "react";
import {
    ActivityIndicator,
    Modal,
    Pressable,
    ScrollView,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const LANGUAGES = [
    { key: "tl", label: "Tagalog", hint: "Filipino", hintEn: "Filipino" },
    { key: "en", label: "English", hint: "Ingles", hintEn: "English" },
] as const;

const APP_VERSION = Constants.expoConfig?.version ?? "1.0.0";

function SectionTitle({ title, color }: { title: string; color: string }) {
    return (
        <View className="flex-row items-center gap-2 mb-2.5 ml-1">
            <View
                className="w-1.5 h-4 rounded-full"
                style={{ backgroundColor: color }}
            />
            <Text
                className="text-[14px] font-extrabold"
                style={{ color: PALETTE.ink }}
            >
                {title}
            </Text>
        </View>
    );
}

function InfoRow({
    icon,
    label,
    value,
    last,
}: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value: ReactNode;
    last?: boolean;
}) {
    return (
        <>
            <View className="flex-row items-center gap-3 px-4 py-3">
                <View
                    className="w-9 h-9 rounded-xl items-center justify-center"
                    style={{ backgroundColor: "rgba(62,123,79,0.12)" }}
                >
                    <Ionicons name={icon} size={17} color={PALETTE.forest} />
                </View>
                <View className="flex-1">
                    <Text className="text-[11px] font-semibold text-[#9C978C]">
                        {label}
                    </Text>
                    {typeof value === "string" ? (
                        <Text
                            className="text-[14px] font-semibold mt-0.5"
                            style={{ color: PALETTE.ink }}
                            numberOfLines={1}
                        >
                            {value}
                        </Text>
                    ) : (
                        value
                    )}
                </View>
            </View>
            {!last && <View className="h-px bg-[#F1ECE3] ml-[64px]" />}
        </>
    );
}

export default function Settings() {
    const { user, profile, logOut } = useAuth();
    const { t } = useLanguage();
    const [showSignOutModal, setShowSignOutModal] = useState(false);
    const [isChangingLanguage, setIsChangingLanguage] = useState(false);
    // the language being saved, so its tile can show a spinner
    const [pendingLanguage, setPendingLanguage] = useState<"tl" | "en" | null>(
        null,
    );

    const handleLanguageChange = async (lang: "tl" | "en") => {
        if (
            !user ||
            isChangingLanguage ||
            (profile?.language ?? "tl") === lang
        )
            return;
        setIsChangingLanguage(true);
        setPendingLanguage(lang);
        try {
            await updateDoc(doc(db, "users", user.uid), { language: lang });
        } finally {
            setIsChangingLanguage(false);
            setPendingLanguage(null);
        }
    };

    const isVerified = profile?.isVerified === true;
    const displayName =
        profile?.username ?? user?.email ?? t("Gumagamit", "User");

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
                <AuthHeader title={t("Mga Setting", "Settings")} />

                {/* Account */}
                <View className="mt-2 mb-6">
                    <SectionTitle title="Account" color={PALETTE.forest} />
                    <View
                        style={clayRaised}
                        className="bg-white rounded-[24px] overflow-hidden"
                    >
                        <View className="flex-row items-center gap-3 p-4 bg-[#F3F9F1]">
                            <Avatar
                                name={displayName}
                                photoURL={profile?.photoURL ?? null}
                                size={48}
                                ring
                            />
                            <View className="flex-1">
                                <View className="flex-row items-center gap-1">
                                    <Text
                                        className="text-[15.5px] font-extrabold shrink"
                                        style={{ color: PALETTE.ink }}
                                        numberOfLines={1}
                                    >
                                        {displayName}
                                    </Text>
                                    {isVerified && <VerifiedBadge size={16} />}
                                </View>
                                <Text className="text-[12px] text-[#9C978C] mt-0.5">
                                    {profile?.role === "admin"
                                        ? "Admin"
                                        : t("Residente", "Resident")}
                                    {` · ${BARANGAY}`}
                                </Text>
                            </View>
                        </View>
                        <InfoRow
                            icon="mail-outline"
                            label="Email"
                            value={user?.email ?? "—"}
                        />
                        <InfoRow
                            icon="shield-checkmark-outline"
                            label={t("Beripikasyon", "Verification")}
                            last
                            value={
                                <Text
                                    className="text-[14px] font-semibold mt-0.5"
                                    style={{
                                        color: isVerified
                                            ? PALETTE.forest
                                            : "#C9821F",
                                    }}
                                >
                                    {isVerified
                                        ? t("Beripikado", "Verified")
                                        : t("Hindi pa beripikado", "Not verified yet")}
                                </Text>
                            }
                        />
                    </View>
                </View>

                {/* Language */}
                <View className="mb-6">
                    <SectionTitle
                        title={t("Wika", "Language")}
                        color={PALETTE.gold}
                    />
                    <View className="flex-row gap-3">
                        {LANGUAGES.map((lang) => {
                            // accounts without a saved language use Tagalog
                            const selected =
                                (profile?.language ?? "tl") === lang.key;
                            return (
                                <Pressable
                                    key={lang.key}
                                    className="flex-1"
                                    disabled={isChangingLanguage}
                                    onPress={() =>
                                        handleLanguageChange(lang.key)
                                    }
                                >
                                    {({ pressed }) => (
                                        <LinearGradient
                                            colors={
                                                selected
                                                    ? ["#56A06A", "#2F6540"]
                                                    : ["#FFFFFF", "#FFFFFF"]
                                            }
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                            style={[
                                                clayRaised,
                                                pressScale(pressed),
                                                {
                                                    borderRadius: 22,
                                                    padding: 14,
                                                    opacity:
                                                        isChangingLanguage &&
                                                        pendingLanguage !==
                                                            lang.key
                                                            ? 0.6
                                                            : 1,
                                                },
                                            ]}
                                        >
                                            <View className="flex-row items-center justify-between mb-3">
                                                <View
                                                    className="w-9 h-9 rounded-xl items-center justify-center"
                                                    style={{
                                                        backgroundColor:
                                                            selected
                                                                ? "rgba(255,255,255,0.25)"
                                                                : "rgba(232,169,59,0.16)",
                                                    }}
                                                >
                                                    <Ionicons
                                                        name="language"
                                                        size={18}
                                                        color={
                                                            selected
                                                                ? "#fff"
                                                                : "#C9821F"
                                                        }
                                                    />
                                                </View>
                                                {pendingLanguage ===
                                                lang.key ? (
                                                    <ActivityIndicator
                                                        size="small"
                                                        color={PALETTE.forest}
                                                    />
                                                ) : (
                                                    <View
                                                        className="w-5 h-5 rounded-full items-center justify-center border-2"
                                                        style={{
                                                            borderColor:
                                                                selected
                                                                    ? "#fff"
                                                                    : "#D9D3C6",
                                                            backgroundColor:
                                                                selected
                                                                    ? "#fff"
                                                                    : "transparent",
                                                        }}
                                                    >
                                                        {selected && (
                                                            <Ionicons
                                                                name="checkmark"
                                                                size={12}
                                                                color={
                                                                    PALETTE.forest
                                                                }
                                                            />
                                                        )}
                                                    </View>
                                                )}
                                            </View>
                                            <Text
                                                className="text-[15px] font-extrabold"
                                                style={{
                                                    color: selected
                                                        ? "#fff"
                                                        : PALETTE.ink,
                                                }}
                                            >
                                                {lang.label}
                                            </Text>
                                            <Text
                                                className="text-[11.5px] mt-0.5"
                                                style={{
                                                    color: selected
                                                        ? "rgba(255,255,255,0.85)"
                                                        : "#9C978C",
                                                }}
                                            >
                                                {t(lang.hint, lang.hintEn)}
                                            </Text>
                                        </LinearGradient>
                                    )}
                                </Pressable>
                            );
                        })}
                    </View>
                </View>

                {/* Sign out */}
                <Pressable onPress={() => setShowSignOutModal(true)}>
                    {({ pressed }) => (
                        <View
                            className="flex-row items-center justify-center gap-2 py-4 rounded-[22px] border-[1.5px]"
                            style={[
                                pressScale(pressed),
                                {
                                    backgroundColor: "rgba(240,98,77,0.08)",
                                    borderColor: "rgba(240,98,77,0.3)",
                                },
                            ]}
                        >
                            <Ionicons
                                name="log-out-outline"
                                size={19}
                                color={PALETTE.blood}
                            />
                            <Text
                                className="text-[15px] font-bold"
                                style={{ color: PALETTE.blood }}
                            >
                                {t("Mag-sign Out", "Sign Out")}
                            </Text>
                        </View>
                    )}
                </Pressable>

                <Text className="text-[11.5px] text-[#B5AFA0] text-center mt-6">
                    TriboConnect · {t("Bersyon", "Version")} {APP_VERSION}
                </Text>
            </ScrollView>

            {/* Confirm modal */}
            <Modal
                visible={showSignOutModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowSignOutModal(false)}
            >
                <Pressable
                    className="flex-1 bg-black/40 items-center justify-center px-8"
                    onPress={() => setShowSignOutModal(false)}
                >
                    <Pressable
                        className="rounded-[28px] p-6 w-full items-center"
                        style={{ backgroundColor: PALETTE.cream }}
                        onPress={(e) => e.stopPropagation()}
                    >
                        <View
                            className="w-16 h-16 rounded-full items-center justify-center mb-3"
                            style={{ backgroundColor: "rgba(240,98,77,0.12)" }}
                        >
                            <Ionicons
                                name="log-out-outline"
                                size={28}
                                color={PALETTE.blood}
                            />
                        </View>
                        <Text
                            className="text-[17px] font-extrabold text-center mb-1.5"
                            style={{ color: PALETTE.ink }}
                        >
                            {t("Mag-sign Out?", "Sign Out?")}
                        </Text>
                        <Text
                            className="text-[13px] text-center mb-5"
                            style={{ color: PALETTE.muted }}
                        >
                            {t(
                                "Kakailanganin mong mag-login muli para bumalik.",
                                "You'll need to log in again to come back.",
                            )}
                        </Text>
                        <Pressable
                            className="w-full mb-2"
                            onPress={() => {
                                setShowSignOutModal(false);
                                logOut();
                            }}
                        >
                            {({ pressed }) => (
                                <LinearGradient
                                    colors={[PALETTE.ember, PALETTE.blood]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={[
                                        pressScale(pressed),
                                        {
                                            borderRadius: 18,
                                            paddingVertical: 14,
                                            alignItems: "center",
                                        },
                                    ]}
                                >
                                    <Text className="text-white font-bold text-[15px]">
                                        {t("Oo, mag-sign out", "Yes, sign out")}
                                    </Text>
                                </LinearGradient>
                            )}
                        </Pressable>
                        <Pressable
                            className="w-full py-3 items-center rounded-[18px]"
                            style={({ pressed }) => ({
                                backgroundColor: pressed
                                    ? "#F0EDE6"
                                    : "transparent",
                            })}
                            onPress={() => setShowSignOutModal(false)}
                        >
                            <Text
                                className="text-[14px] font-semibold"
                                style={{ color: PALETTE.muted }}
                            >
                                {t("Kanselahin", "Cancel")}
                            </Text>
                        </Pressable>
                    </Pressable>
                </Pressable>
            </Modal>
        </SafeAreaView>
    );
}
