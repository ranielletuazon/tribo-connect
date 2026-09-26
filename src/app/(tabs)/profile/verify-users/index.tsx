import { AuthHeader } from "@/components/auth-header";
import { clayRaised } from "@/components/clay";
import { db } from "@/lib/firebase";
import { formatTimeAgo } from "@/lib/posts";
import {
    VERIFICATION_TYPES,
    mapDocToVerification,
    type VerificationRequest,
    type VerificationStatus,
} from "@/lib/verification";
import { useAuth } from "@/providers/auth-provider";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Image,
    Pressable,
    ScrollView,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const TABS: { status: VerificationStatus; label: string; empty: string }[] = [
    {
        status: "pending",
        label: "Nakabinbin",
        empty: "Walang user na naghihintay ng beripikasyon.",
    },
    {
        status: "approved",
        label: "Naaprubahan",
        empty: "Wala pang naaprubahang beripikasyon.",
    },
    {
        status: "rejected",
        label: "Tinanggihan",
        empty: "Wala pang tinanggihang beripikasyon.",
    },
];

const STATUS_PILLS: Record<
    VerificationStatus,
    { label: string; color: string; tint: string }
> = {
    pending: { label: "Nakabinbin", color: "#A85A30", tint: "#FBF1E8" },
    approved: { label: "Naaprubahan", color: "#2A6FDB", tint: "#EAF1FC" },
    rejected: { label: "Tinanggihan", color: "#9C3A2A", tint: "#FBECE9" },
};

export default function VerifyUsers() {
    const router = useRouter();
    const { profile } = useAuth();
    const isAdmin = profile?.role === "admin";

    const [activeTab, setActiveTab] = useState<VerificationStatus>("pending");
    const [requests, setRequests] = useState<VerificationRequest[]>([]);
    const [pendingCount, setPendingCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    // live list, so a request disappears from "Nakabinbin" once reviewed.
    // sorted here instead of with orderBy so no composite index is needed
    useEffect(() => {
        if (!isAdmin) return;
        setIsLoading(true);
        const q = query(
            collection(db, "verification"),
            where("status", "==", activeTab),
        );
        return onSnapshot(
            q,
            (snapshot) => {
                const list = snapshot.docs.map(mapDocToVerification);
                if (activeTab === "pending") {
                    // oldest first, so no one waits too long
                    list.sort(
                        (a, b) =>
                            (a.submittedAt?.toMillis() ?? Date.now()) -
                            (b.submittedAt?.toMillis() ?? Date.now()),
                    );
                } else {
                    list.sort(
                        (a, b) =>
                            (b.reviewedAt?.toMillis() ?? 0) -
                            (a.reviewedAt?.toMillis() ?? 0),
                    );
                }
                setRequests(list);
                setIsLoading(false);
            },
            (err) => {
                console.error("Load verification requests error:", err);
                setIsLoading(false);
            },
        );
    }, [activeTab, isAdmin]);

    // the count on the "Nakabinbin" tab stays live on every tab
    useEffect(() => {
        if (!isAdmin) return;
        return onSnapshot(
            query(
                collection(db, "verification"),
                where("status", "==", "pending"),
            ),
            (snapshot) => setPendingCount(snapshot.size),
            (err) => console.error("Count pending error:", err),
        );
    }, [isAdmin]);

    // only admins can open this screen
    if (!isAdmin) {
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

    const emptyText = TABS.find((t) => t.status === activeTab)?.empty;

    return (
        <SafeAreaView className="flex-1 bg-[--main-white]" edges={["top"]}>
            <ScrollView contentContainerClassName="px-6 pt-4 pb-10">
                <AuthHeader title="I-verify ang mga User" />

                {/* Status tabs */}
                <View
                    style={clayRaised}
                    className="flex-row bg-[#F0EDE6] rounded-full p-1 mb-5"
                >
                    {TABS.map((tab) => {
                        const isActive = activeTab === tab.status;
                        return (
                            <Pressable
                                key={tab.status}
                                onPress={() => setActiveTab(tab.status)}
                                className="flex-1 flex-row items-center justify-center gap-1.5 rounded-full py-2"
                                style={{
                                    backgroundColor: isActive
                                        ? "#2F5233"
                                        : "transparent",
                                }}
                            >
                                <Text
                                    className="text-[12.5px] font-semibold"
                                    style={{
                                        color: isActive ? "#fff" : "#7A6D5C",
                                    }}
                                >
                                    {tab.label}
                                </Text>
                                {tab.status === "pending" &&
                                    pendingCount > 0 && (
                                        <View
                                            className="rounded-full px-1.5 min-w-[18px] items-center"
                                            style={{
                                                backgroundColor: isActive
                                                    ? "#fff"
                                                    : "#9C3A2A",
                                            }}
                                        >
                                            <Text
                                                className="text-[10.5px] font-bold"
                                                style={{
                                                    color: isActive
                                                        ? "#2F5233"
                                                        : "#fff",
                                                }}
                                            >
                                                {pendingCount}
                                            </Text>
                                        </View>
                                    )}
                            </Pressable>
                        );
                    })}
                </View>

                {/* Requests */}
                <View
                    style={clayRaised}
                    className="bg-[--main-white] rounded-[20px] overflow-hidden"
                >
                    {isLoading ? (
                        <ActivityIndicator
                            color="#2F5233"
                            style={{ marginVertical: 24 }}
                        />
                    ) : requests.length === 0 ? (
                        <View className="items-center p-6">
                            <Ionicons
                                name="checkmark-done-circle-outline"
                                size={32}
                                color="#C4BFB2"
                            />
                            <Text className="text-center text-[13px] text-[#9C978C] mt-2">
                                {emptyText}
                            </Text>
                        </View>
                    ) : (
                        requests.map((request, i) => {
                            const type = VERIFICATION_TYPES[request.idType];
                            const pill = STATUS_PILLS[request.status];
                            const fullName = [
                                request.personalInfo.firstName,
                                request.personalInfo.lastName,
                            ]
                                .filter(Boolean)
                                .join(" ");
                            return (
                                <Pressable
                                    key={request.uid}
                                    onPress={() =>
                                        router.push({
                                            pathname:
                                                "/(tabs)/profile/verify-users/[verificationId]",
                                            params: {
                                                verificationId: request.uid,
                                            },
                                        })
                                    }
                                    className={`flex-row items-center gap-3 p-4 ${
                                        i < requests.length - 1
                                            ? "border-b border-[#EDEAE2]"
                                            : ""
                                    }`}
                                >
                                    <View className="w-11 h-11 rounded-full bg-[#5C7A5F] items-center justify-center overflow-hidden">
                                        {request.photoURL ? (
                                            <Image
                                                source={{
                                                    uri: request.photoURL,
                                                }}
                                                className="w-full h-full"
                                                resizeMode="cover"
                                            />
                                        ) : (
                                            <Text className="text-white text-[13px] font-semibold">
                                                {request.username
                                                    .slice(0, 2)
                                                    .toUpperCase()}
                                            </Text>
                                        )}
                                    </View>
                                    <View className="flex-1">
                                        <Text
                                            className="text-[14.5px] font-semibold text-[#1F2A1F]"
                                            numberOfLines={1}
                                        >
                                            {request.username}
                                        </Text>
                                        {fullName.length > 0 && (
                                            <Text
                                                className="text-[12px] text-[#7A6D5C] mt-0.5"
                                                numberOfLines={1}
                                            >
                                                {fullName}
                                            </Text>
                                        )}
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
                                            {!request.ocr.typeMatch && (
                                                <Ionicons
                                                    name="warning"
                                                    size={12}
                                                    color="#A85A30"
                                                    style={{ marginLeft: 4 }}
                                                />
                                            )}
                                        </View>
                                    </View>
                                    <View className="items-end gap-1">
                                        <View
                                            className="rounded-full px-2 py-0.5"
                                            style={{
                                                backgroundColor: pill.tint,
                                            }}
                                        >
                                            <Text
                                                className="text-[10.5px] font-semibold"
                                                style={{ color: pill.color }}
                                            >
                                                {pill.label}
                                            </Text>
                                        </View>
                                        <Text className="text-[10.5px] text-[#9C978C]">
                                            {formatTimeAgo(
                                                request.status === "pending"
                                                    ? request.submittedAt
                                                    : request.reviewedAt,
                                            )}
                                        </Text>
                                        {request.attempts > 1 && (
                                            <Text className="text-[10px] text-[#9C978C]">
                                                Ika-{request.attempts} pagsumite
                                            </Text>
                                        )}
                                    </View>
                                    <Ionicons
                                        name="chevron-forward"
                                        size={16}
                                        color="#C4BFB2"
                                    />
                                </Pressable>
                            );
                        })
                    )}
                </View>

                <Text className="text-[11.5px] text-[#9C978C] text-center mt-4 px-4">
                    Pindutin ang isang user para makita ang kanyang ID at
                    aprubahan o tanggihan ang beripikasyon.
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
}
