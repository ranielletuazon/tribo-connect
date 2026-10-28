import { AuthHeader } from "@/components/auth-header";
import { ClayButton, clayRaised } from "@/components/clay";
import { BARANGAY } from "@/constants/barangays";
import { useLanguage } from "@/hooks/use-language";
import { db } from "@/lib/firebase";
import {
    VERIFICATION_TYPES,
    type VerificationStatus,
} from "@/lib/verification";
import { useAuth } from "@/providers/auth-provider";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Image, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const HERO_BANNER = require("../../../../assets/images/hero-banner-verify.png");
const HERO_ASPECT = 588 / 500;
const VERIFIED_BLUE = "#2A6FDB";

const BENEFITS: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    titleEn: string;
    description: string;
    descriptionEn: string;
    color: string;
    tint: string;
}[] = [
    {
        icon: "checkmark-circle",
        title: "Verified Badge",
        titleEn: "Verified Badge",
        description: "Makikita ng lahat ang tsek sa tabi ng iyong pangalan.",
        descriptionEn: "Everyone will see the check next to your name.",
        color: VERIFIED_BLUE,
        tint: "#EAF1FC",
    },
    {
        icon: "shield-checkmark",
        title: "Mas Pinagkakatiwalaan",
        titleEn: "More Trusted",
        description: "Mas paniniwalaan ang iyong mga post at mensahe.",
        descriptionEn: "Your posts and messages will be more trusted.",
        color: "#3F5C42",
        tint: "#EEF3EE",
    },
    {
        icon: "document-text",
        title: "Mas Matibay na Ulat",
        titleEn: "Stronger Reports",
        description: "Mas madaling mapatunayan ng barangay ang iyong mga ulat.",
        descriptionEn: "The barangay can confirm your reports more easily.",
        color: "#A85A30",
        tint: "#FBF1E8",
    },
    {
        icon: "people",
        title: "Ligtas na Komunidad",
        titleEn: "Safer Community",
        description: "Nakakatulong labanan ang mga pekeng account.",
        descriptionEn: "Helps fight fake accounts.",
        color: "#6B4F94",
        tint: "#F2EEF8",
    },
];

const STEPS: {
    title: string;
    titleEn: string;
    description: string;
    descriptionEn: string;
}[] = [
    {
        title: "Piliin ang Uri ng ID",
        titleEn: "Choose the ID Type",
        description: "Pumili mula sa mga suportadong ID sa ibaba.",
        descriptionEn: "Pick from the supported IDs below.",
    },
    {
        title: "Kunan ng Larawan ang ID",
        titleEn: "Take a Photo of the ID",
        description: "Susuriin agad kung malinaw at nababasa ang larawan.",
        descriptionEn: "The photo is checked right away to see if it's clear and readable.",
    },
    {
        title: "Awtomatikong Pagbasa",
        titleEn: "Automatic Reading",
        description:
            "Babasahin ng app ang iyong pangalan, kaarawan at tirahan mula sa ID.",
        descriptionEn:
            "The app reads your name, birthday and address from the ID.",
    },
    {
        title: "Kumuha ng Selfie",
        titleEn: "Take a Selfie",
        description: "Kunan ang iyong mukha para maitugma sa larawan sa ID.",
        descriptionEn: "Take a photo of your face to match the photo on the ID.",
    },
    {
        title: "Suriin ang Detalye",
        titleEn: "Review the Details",
        description: 'Itama kung may mali, saka pindutin ang "I-Verify".',
        descriptionEn: 'Fix anything wrong, then press "Verify".',
    },
    {
        title: "Verified Agad",
        titleEn: "Verified Right Away",
        description:
            "Makukuha mo agad ang verified badge. Babantayan ito ng admin ng barangay.",
        descriptionEn:
            "You get the verified badge right away. The barangay admin will keep an eye on it.",
    },
];

const STATUS_CARDS: Record<
    VerificationStatus,
    {
        icon: keyof typeof Ionicons.glyphMap;
        title: string;
        titleEn: string;
        description: string;
        descriptionEn: string;
        color: string;
        tint: string;
    }
> = {
    approved: {
        icon: "checkmark-circle",
        title: "Verified na ang iyong Account",
        titleEn: "Your Account is Verified",
        description: "Makikita na ng lahat ang tsek sa tabi ng iyong pangalan.",
        descriptionEn: "Everyone can now see the check next to your name.",
        color: VERIFIED_BLUE,
        tint: "#EAF1FC",
    },
    revoked: {
        icon: "close-circle",
        title: "Binawi ang Verified Badge",
        titleEn: "Verified Badge Revoked",
        description:
            "Binawi ng admin ng barangay ang iyong verified badge. Makipag-ugnayan sa kanila para maibalik ito.",
        descriptionEn:
            "The barangay admin revoked your verified badge. Contact them to get it back.",
        color: "#9C3A2A",
        tint: "#FBECE9",
    },
    // only on requests from before auto-verify, these users can submit again
    pending: {
        icon: "refresh-circle",
        title: "Kailangang Magsumite Muli",
        titleEn: "Please Submit Again",
        description:
            "Awtomatiko na ang beripikasyon. Pakisumite muli ang iyong ID para ma-verify agad.",
        descriptionEn:
            "Verification is now automatic. Please submit your ID again to get verified right away.",
        color: "#A85A30",
        tint: "#FBF1E8",
    },
    rejected: {
        icon: "close-circle",
        title: "Hindi Naaprubahan",
        titleEn: "Not Approved",
        description: "Maaari kang magsumite muli gamit ang malinaw na ID.",
        descriptionEn: "You can submit again with a clear ID.",
        color: "#9C3A2A",
        tint: "#FBECE9",
    },
};

function SectionTitle({ children }: { children: ReactNode }) {
    return (
        <Text className="text-[13px] font-medium text-[#7A6D5C] mb-3 ml-1 mt-7">
            {children}
        </Text>
    );
}

export default function Verify() {
    const { user, profile } = useAuth();
    const { t } = useLanguage();
    const displayName =
        profile?.username ?? user?.email ?? t("Gumagamit", "User");
    const initials = displayName.slice(0, 2).toUpperCase();

    // set by the submitVerification function, and by an admin revoking it
    const status = profile?.verificationStatus as
        VerificationStatus | undefined;
    const statusCard = status ? STATUS_CARDS[status] : null;
    const [reason, setReason] = useState<string | null>(null);
    const hasReason = status === "revoked" || status === "rejected";
    // revoked users can't submit again, only an admin can restore the badge
    const canSubmit = status !== "approved" && status !== "revoked";

    // the reason is only on the verification doc, not the profile
    useEffect(() => {
        if (!hasReason || !user) return;
        getDoc(doc(db, "verification", user.uid))
            .then((snap) =>
                setReason(
                    snap.data()?.revokeReason ??
                        snap.data()?.rejectionReason ??
                        null,
                ),
            )
            .catch((err) => console.error("Load verification error:", err));
    }, [hasReason, user]);

    return (
        <SafeAreaView className="flex-1 bg-[--main-white]" edges={["top"]}>
            <ScrollView contentContainerClassName="px-6 pt-4 pb-8">
                <AuthHeader title={t("Beripikasyon", "Verification")} />

                {/* Hero banner */}
                <View
                    style={clayRaised}
                    className="rounded-[28px] bg-[#E9EEFB] overflow-hidden"
                >
                    <Image
                        source={HERO_BANNER}
                        className="w-full"
                        style={{ aspectRatio: HERO_ASPECT }}
                        resizeMode="contain"
                    />
                </View>

                {/* Intro */}
                <View className="items-center mt-6 px-2">
                    <View className="flex-row items-center gap-1 bg-[#EAF1FC] rounded-full px-3 py-1 mb-3">
                        <Ionicons
                            name="shield-checkmark"
                            size={12}
                            color={VERIFIED_BLUE}
                        />
                        <Text
                            className="text-[11px] font-bold tracking-wider"
                            style={{ color: VERIFIED_BLUE }}
                        >
                            ACCOUNT VERIFICATION
                        </Text>
                    </View>
                    <Text className="text-[21px] font-bold text-[#1F2A1F] text-center">
                        {t("I-verify ang Iyong Account", "Verify Your Account")}
                    </Text>
                    <Text className="text-[13.5px] text-[#7A6D5C] text-center leading-5 mt-2">
                        {t(
                            "Patunayan na ikaw ay tunay na residente ng iyong barangay gamit ang isang valid na ID. Ang verified na account ay mas pinagkakatiwalaan sa buong komunidad ng TriboConnect.",
                            "Prove that you are a real resident of your barangay using a valid ID. A verified account is more trusted across the whole TriboConnect community.",
                        )}
                    </Text>
                </View>

                {/* Current verification status */}
                {statusCard && (
                    <View
                        className="flex-row gap-3 rounded-2xl p-4 mt-6"
                        style={{ backgroundColor: statusCard.tint }}
                    >
                        <Ionicons
                            name={statusCard.icon}
                            size={22}
                            color={statusCard.color}
                        />
                        <View className="flex-1">
                            <Text
                                className="text-[14px] font-bold"
                                style={{ color: statusCard.color }}
                            >
                                {t(statusCard.title, statusCard.titleEn)}
                            </Text>
                            <Text className="text-[12.5px] text-[#7A6D5C] leading-[18px] mt-0.5">
                                {t(
                                    statusCard.description,
                                    statusCard.descriptionEn,
                                )}
                            </Text>
                            {hasReason && reason && (
                                <Text className="text-[12.5px] text-[#1F2A1F] leading-[18px] mt-2">
                                    <Text className="font-semibold">
                                        {t("Dahilan:", "Reason:")}{" "}
                                    </Text>
                                    {reason}
                                </Text>
                            )}
                        </View>
                    </View>
                )}

                {/* Badge preview */}
                <SectionTitle>
                    {t("Ganito ka makikita ng iba", "This is how others will see you")}
                </SectionTitle>
                <View
                    style={clayRaised}
                    className="bg-[--main-white] rounded-2xl p-4 flex-row items-center gap-3"
                >
                    <View className="w-12 h-12 rounded-full bg-[#3F5C42] items-center justify-center overflow-hidden">
                        {profile?.photoURL ? (
                            <Image
                                source={{ uri: profile.photoURL }}
                                className="w-full h-full"
                                resizeMode="cover"
                            />
                        ) : (
                            <Text className="text-white text-[14px] font-bold">
                                {initials}
                            </Text>
                        )}
                    </View>
                    <View className="flex-1">
                        <View className="flex-row items-center gap-1">
                            <Text
                                className="text-[15px] font-bold text-[#1F2A1F] shrink"
                                numberOfLines={1}
                            >
                                {displayName}
                            </Text>
                            <Ionicons
                                name="checkmark-circle"
                                size={17}
                                color={VERIFIED_BLUE}
                            />
                        </View>
                        <Text className="text-[12px] text-[#7A6D5C] mt-0.5">
                            {t("Verified na Residente", "Verified Resident")} ·
                            Barangay {BARANGAY}
                        </Text>
                    </View>
                </View>

                {/* Benefits */}
                <SectionTitle>{t("Mga Benepisyo", "Benefits")}</SectionTitle>
                <View className="flex-row flex-wrap justify-between gap-y-3">
                    {BENEFITS.map((benefit) => (
                        <View
                            key={benefit.title}
                            style={clayRaised}
                            className="bg-[--main-white] rounded-2xl p-4 w-[48.5%]"
                        >
                            <View
                                className="w-10 h-10 rounded-full items-center justify-center mb-3"
                                style={{ backgroundColor: benefit.tint }}
                            >
                                <Ionicons
                                    name={benefit.icon}
                                    size={20}
                                    color={benefit.color}
                                />
                            </View>
                            <Text className="text-[13.5px] font-bold text-[#1F2A1F]">
                                {t(benefit.title, benefit.titleEn)}
                            </Text>
                            <Text className="text-[11.5px] text-[#7A6D5C] leading-4 mt-1">
                                {t(benefit.description, benefit.descriptionEn)}
                            </Text>
                        </View>
                    ))}
                </View>

                {/* Steps */}
                <SectionTitle>{t("Mga Hakbang", "Steps")}</SectionTitle>
                <View
                    style={clayRaised}
                    className="bg-[--main-white] rounded-2xl px-4 pt-4 pb-1"
                >
                    {STEPS.map((step, i) => {
                        const isLast = i === STEPS.length - 1;
                        return (
                            <View key={step.title} className="flex-row gap-3">
                                {/* number and the line to the next step */}
                                <View className="items-center">
                                    <View className="w-8 h-8 rounded-full bg-[#2F5233] items-center justify-center">
                                        <Text className="text-white text-[13px] font-bold">
                                            {i + 1}
                                        </Text>
                                    </View>
                                    {!isLast && (
                                        <View className="w-0.5 flex-1 bg-[#DCE5D8] my-1" />
                                    )}
                                </View>
                                <View className="flex-1 pb-4 pt-1">
                                    <Text className="text-[14px] font-semibold text-[#1F2A1F]">
                                        {t(step.title, step.titleEn)}
                                    </Text>
                                    <Text className="text-[12px] text-[#7A6D5C] leading-[17px] mt-0.5">
                                        {t(step.description, step.descriptionEn)}
                                    </Text>
                                </View>
                            </View>
                        );
                    })}
                </View>

                {/* Supported IDs */}
                <SectionTitle>{t("Mga Suportadong ID", "Supported IDs")}</SectionTitle>
                <View className="flex-row flex-wrap gap-2">
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
                                {t(type.label, type.labelEn)}
                            </Text>
                        </View>
                    ))}
                </View>

                {/* Privacy */}
                <View className="flex-row gap-3 bg-[#F3F6F1] rounded-2xl p-4 mt-7">
                    <Ionicons name="lock-closed" size={18} color="#3F5C42" />
                    <View className="flex-1">
                        <Text className="text-[13px] font-semibold text-[#1F2A1F]">
                            {t(
                                "Protektado ang iyong impormasyon",
                                "Your information is protected",
                            )}
                        </Text>
                        <Text className="text-[12px] text-[#7A6D5C] leading-[17px] mt-1">
                            {t(
                                "Gagamitin lamang ang iyong ID at larawan para sa beripikasyon, at makikita lamang ito ng mga admin ng barangay.",
                                "Your ID and photo are only used for verification, and only barangay admins can see them.",
                            )}
                        </Text>
                    </View>
                </View>
            </ScrollView>

            {/* Start button, until the account is verified or revoked */}
            {canSubmit && (
                <View className="px-6 pt-3 pb-4 border-t border-[#EDEAE2] bg-[--main-white]">
                    <ClayButton
                        colors={["#4C7350", "#254631"]}
                        borderRadius={20}
                        onPress={() => router.push("/(tabs)/profile/verify-id")}
                    >
                        <Ionicons
                            name="shield-checkmark"
                            size={19}
                            color="#fff"
                        />
                        <Text className="text-white font-semibold text-[16px]">
                            {status
                                ? t("Subukang Muli", "Try Again")
                                : t("I-Verify ang Account", "Verify Account")}
                        </Text>
                    </ClayButton>
                    <Text className="text-[11.5px] text-[#9C978C] text-center mt-2">
                        {t("Aabutin lamang ng ilang minuto", "It only takes a few minutes")}
                    </Text>
                </View>
            )}
        </SafeAreaView>
    );
}
