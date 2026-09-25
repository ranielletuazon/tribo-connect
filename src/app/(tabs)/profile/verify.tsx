import { AuthHeader } from "@/components/auth-header";
import { ClayButton, clayRaised } from "@/components/clay";
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
    description: string;
    color: string;
    tint: string;
}[] = [
    {
        icon: "checkmark-circle",
        title: "Verified Badge",
        description: "Makikita ng lahat ang tsek sa tabi ng iyong pangalan.",
        color: VERIFIED_BLUE,
        tint: "#EAF1FC",
    },
    {
        icon: "shield-checkmark",
        title: "Mas Pinagkakatiwalaan",
        description: "Mas paniniwalaan ang iyong mga post at mensahe.",
        color: "#3F5C42",
        tint: "#EEF3EE",
    },
    {
        icon: "document-text",
        title: "Mas Matibay na Ulat",
        description: "Mas madaling mapatunayan ng barangay ang iyong mga ulat.",
        color: "#A85A30",
        tint: "#FBF1E8",
    },
    {
        icon: "people",
        title: "Ligtas na Komunidad",
        description: "Nakakatulong labanan ang mga pekeng account.",
        color: "#6B4F94",
        tint: "#F2EEF8",
    },
];

const STEPS: { title: string; description: string }[] = [
    {
        title: "Piliin ang Uri ng ID",
        description: "Pumili mula sa mga suportadong ID sa ibaba.",
    },
    {
        title: "Kunan ng Larawan ang ID",
        description: "Susuriin agad kung malinaw at nababasa ang larawan.",
    },
    {
        title: "Awtomatikong Pagbasa",
        description:
            "Babasahin ng app ang iyong pangalan, kaarawan at tirahan mula sa ID.",
    },
    {
        title: "Suriin ang Detalye",
        description: 'Itama kung may mali, saka pindutin ang "I-Verify".',
    },
    {
        title: "Hintayin ang Pagsusuri",
        description: "Susuriin ng admin ng barangay ang iyong impormasyon.",
    },
];

const STATUS_CARDS: Record<
    VerificationStatus,
    {
        icon: keyof typeof Ionicons.glyphMap;
        title: string;
        description: string;
        color: string;
        tint: string;
    }
> = {
    pending: {
        icon: "hourglass",
        title: "Naghihintay ng Pagsusuri",
        description:
            "Naipadala na ang iyong beripikasyon. Susuriin ito ng admin ng barangay.",
        color: "#A85A30",
        tint: "#FBF1E8",
    },
    approved: {
        icon: "checkmark-circle",
        title: "Verified na ang iyong Account",
        description: "Makikita na ng lahat ang tsek sa tabi ng iyong pangalan.",
        color: VERIFIED_BLUE,
        tint: "#EAF1FC",
    },
    rejected: {
        icon: "close-circle",
        title: "Hindi Naaprubahan",
        description: "Maaari kang magsumite muli gamit ang malinaw na ID.",
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
    const displayName = profile?.username ?? user?.email ?? "Gumagamit";
    const initials = displayName.slice(0, 2).toUpperCase();

    // set by the submitVerification function, and later by the admin
    const status = profile?.verificationStatus as
        VerificationStatus | undefined;
    const statusCard = status ? STATUS_CARDS[status] : null;
    const [rejectionReason, setRejectionReason] = useState<string | null>(null);

    // the reason is only on the verification doc, not the profile
    useEffect(() => {
        if (status !== "rejected" || !user) return;
        getDoc(doc(db, "verification", user.uid))
            .then((snap) =>
                setRejectionReason(snap.data()?.rejectionReason ?? null),
            )
            .catch((err) => console.error("Load verification error:", err));
    }, [status, user]);

    return (
        <SafeAreaView className="flex-1 bg-[--main-white]" edges={["top"]}>
            <ScrollView contentContainerClassName="px-6 pt-4 pb-8">
                <AuthHeader title="Beripikasyon" />

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
                        I-verify ang Iyong Account
                    </Text>
                    <Text className="text-[13.5px] text-[#7A6D5C] text-center leading-5 mt-2">
                        Patunayan na ikaw ay tunay na residente ng iyong
                        barangay gamit ang isang valid na ID. Ang verified na
                        account ay mas pinagkakatiwalaan sa buong komunidad ng
                        TriboConnect.
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
                                {statusCard.title}
                            </Text>
                            <Text className="text-[12.5px] text-[#7A6D5C] leading-[18px] mt-0.5">
                                {statusCard.description}
                            </Text>
                            {status === "rejected" && rejectionReason && (
                                <Text className="text-[12.5px] text-[#1F2A1F] leading-[18px] mt-2">
                                    <Text className="font-semibold">
                                        Dahilan:{" "}
                                    </Text>
                                    {rejectionReason}
                                </Text>
                            )}
                        </View>
                    </View>
                )}

                {/* Badge preview */}
                <SectionTitle>Ganito ka makikita ng iba</SectionTitle>
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
                            Verified na Residente
                            {profile?.barangay
                                ? ` · Barangay ${profile.barangay}`
                                : ""}
                        </Text>
                    </View>
                </View>

                {/* Benefits */}
                <SectionTitle>Mga Benepisyo</SectionTitle>
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
                                {benefit.title}
                            </Text>
                            <Text className="text-[11.5px] text-[#7A6D5C] leading-4 mt-1">
                                {benefit.description}
                            </Text>
                        </View>
                    ))}
                </View>

                {/* Steps */}
                <SectionTitle>Mga Hakbang</SectionTitle>
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
                                        {step.title}
                                    </Text>
                                    <Text className="text-[12px] text-[#7A6D5C] leading-[17px] mt-0.5">
                                        {step.description}
                                    </Text>
                                </View>
                            </View>
                        );
                    })}
                </View>

                {/* Supported IDs */}
                <SectionTitle>Mga Suportadong ID</SectionTitle>
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
                                {type.label}
                            </Text>
                        </View>
                    ))}
                </View>

                {/* Privacy */}
                <View className="flex-row gap-3 bg-[#F3F6F1] rounded-2xl p-4 mt-7">
                    <Ionicons name="lock-closed" size={18} color="#3F5C42" />
                    <View className="flex-1">
                        <Text className="text-[13px] font-semibold text-[#1F2A1F]">
                            Protektado ang iyong impormasyon
                        </Text>
                        <Text className="text-[12px] text-[#7A6D5C] leading-[17px] mt-1">
                            Gagamitin lamang ang iyong ID at larawan para sa
                            beripikasyon, at makikita lamang ito ng mga admin ng
                            barangay.
                        </Text>
                    </View>
                </View>
            </ScrollView>

            {/* Start button, always visible until the account is verified */}
            {status !== "approved" && (
                <View className="px-6 pt-3 pb-4 border-t border-[#EDEAE2] bg-[--main-white]">
                    <ClayButton
                        colors={["#4C7350", "#254631"]}
                        borderRadius={20}
                        disabled={status === "pending"}
                        onPress={() => router.push("/(tabs)/profile/verify-id")}
                    >
                        <Ionicons
                            name={
                                status === "pending"
                                    ? "hourglass"
                                    : "shield-checkmark"
                            }
                            size={19}
                            color="#fff"
                        />
                        <Text className="text-white font-semibold text-[16px]">
                            {status === "pending"
                                ? "Naghihintay ng Pagsusuri"
                                : status === "rejected"
                                  ? "Subukang Muli"
                                  : "I-Verify ang Account"}
                        </Text>
                    </ClayButton>
                    {status !== "pending" && (
                        <Text className="text-[11.5px] text-[#9C978C] text-center mt-2">
                            Aabutin lamang ng ilang minuto
                        </Text>
                    )}
                </View>
            )}
        </SafeAreaView>
    );
}
