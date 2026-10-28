import {
    BackgroundBlobs,
    clayRaised,
    pressScale,
    PulseRing,
} from "@/components/clay";
import { VerifiedBadge } from "@/components/verified-badge";
import { PALETTE } from "@/constants/palette";
import {
    CATEGORIES,
    SEVERITIES,
    formatAnnouncementDate,
    mapDocToAnnouncement,
    type Announcement,
} from "@/lib/announcements";
import { db, storage } from "@/lib/firebase";
import { formatTimeAgo } from "@/lib/posts";
import { useAuth } from "@/providers/auth-provider";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { deleteDoc, doc, onSnapshot } from "firebase/firestore";
import { deleteObject, ref } from "firebase/storage";
import { useEffect, useState, type ReactNode } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Pressable,
    ScrollView,
    Share,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// round icon button used in the header
function RoundButton({
    onPress,
    disabled,
    tint = "#F0EDE6",
    children,
}: {
    onPress: () => void;
    disabled?: boolean;
    tint?: string;
    children: ReactNode;
}) {
    return (
        <Pressable
            onPress={onPress}
            disabled={disabled}
            hitSlop={6}
            className="w-10 h-10 rounded-full items-center justify-center"
            style={[clayRaised, { backgroundColor: tint }]}
        >
            {children}
        </Pressable>
    );
}

export default function ViewEmergency() {
    const { emergencyId } = useLocalSearchParams<{ emergencyId: string }>();
    const { profile } = useAuth();
    const isAdmin = profile?.role === "admin";

    const [announcement, setAnnouncement] = useState<Announcement | null>(
        null,
    );
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);
    const [imageAspect, setImageAspect] = useState(4 / 3);

    // live, so a delete by an admin shows up right away
    useEffect(() => {
        if (!emergencyId) return;
        return onSnapshot(
            doc(db, "announcements", emergencyId),
            (snap) => {
                setAnnouncement(
                    snap.exists() ? mapDocToAnnouncement(snap) : null,
                );
                setIsLoading(false);
            },
            (err) => {
                console.error("Load announcement error:", err);
                setIsLoading(false);
            },
        );
    }, [emergencyId]);

    // show the whole image instead of cropping it
    useEffect(() => {
        if (!announcement?.imageUrl) return;
        Image.getSize(
            announcement.imageUrl,
            (width, height) => {
                if (width > 0 && height > 0) setImageAspect(width / height);
            },
            () => {},
        );
    }, [announcement?.imageUrl]);

    const handleShare = async () => {
        if (!announcement) return;
        const area = announcement.targetBarangay
            ? `Barangay ${announcement.targetBarangay}`
            : "Lahat ng Barangay";
        try {
            await Share.share({
                message: `[${SEVERITIES[announcement.severity].label.toUpperCase()}] ${announcement.title}\n\n${announcement.content}\n\nSakop: ${area}\n— TriboConnect`,
            });
        } catch (err) {
            console.error("Share announcement error:", err);
        }
    };

    const handleDelete = () => {
        if (!announcement || !isAdmin) return;
        Alert.alert(
            "Burahin ang anunsyo?",
            "Hindi na ito makikita ng mga residente.",
            [
                { text: "Kanselahin", style: "cancel" },
                {
                    text: "Burahin",
                    style: "destructive",
                    onPress: async () => {
                        setIsDeleting(true);
                        try {
                            await deleteDoc(
                                doc(db, "announcements", announcement.id),
                            );
                            if (announcement.imageUrl) {
                                // the post is already gone, so a leftover image is fine
                                deleteObject(
                                    ref(
                                        storage,
                                        `announcements/${announcement.id}.jpg`,
                                    ),
                                ).catch((err) =>
                                    console.error(
                                        "Delete announcement image error:",
                                        err,
                                    ),
                                );
                            }
                            router.back();
                        } catch (err) {
                            console.error("Delete announcement error:", err);
                            setIsDeleting(false);
                            Alert.alert(
                                "Nabigo",
                                "Hindi nabura ang anunsyo. Pakisubukang muli.",
                            );
                        }
                    },
                },
            ],
        );
    };

    const level = announcement ? SEVERITIES[announcement.severity] : null;
    const category = announcement ? CATEGORIES[announcement.category] : null;

    return (
        <SafeAreaView
            className="flex-1"
            style={{ backgroundColor: PALETTE.cream }}
            edges={["top"]}
        >
            <BackgroundBlobs
                colors={[
                    level?.colorLight ?? PALETTE.terracotta,
                    PALETTE.gold,
                ]}
                opacity={[0.18, 0.16]}
            />

            {/* Header */}
            <View className="flex-row items-center gap-2.5 px-5 pt-4 pb-3">
                <RoundButton onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={20} color={PALETTE.ink} />
                </RoundButton>
                <Text
                    className="flex-1 text-center text-[15px] font-bold"
                    style={{ color: PALETTE.ink }}
                    numberOfLines={1}
                >
                    Anunsyo
                </Text>
                {announcement ? (
                    <RoundButton onPress={handleShare}>
                        <Ionicons
                            name="share-social-outline"
                            size={19}
                            color={PALETTE.ink}
                        />
                    </RoundButton>
                ) : (
                    <View className="w-10" />
                )}
                {announcement && isAdmin && (
                    <RoundButton
                        onPress={handleDelete}
                        disabled={isDeleting}
                        tint="#FDEBE8"
                    >
                        {isDeleting ? (
                            <ActivityIndicator
                                size="small"
                                color={PALETTE.blood}
                            />
                        ) : (
                            <Ionicons
                                name="trash-outline"
                                size={19}
                                color={PALETTE.blood}
                            />
                        )}
                    </RoundButton>
                )}
            </View>

            {isLoading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator color={PALETTE.terracotta} />
                </View>
            ) : !announcement || !level || !category ? (
                <View className="flex-1 items-center justify-center px-8">
                    <View
                        className="w-16 h-16 rounded-full items-center justify-center mb-3"
                        style={{ backgroundColor: "rgba(217,115,63,0.12)" }}
                    >
                        <Ionicons
                            name="megaphone-outline"
                            size={28}
                            color={PALETTE.terracotta}
                        />
                    </View>
                    <Text
                        className="text-center text-[13.5px]"
                        style={{ color: PALETTE.muted }}
                    >
                        Hindi na makita ang anunsyong ito. Maaaring binura na
                        ito.
                    </Text>
                    <Pressable
                        onPress={() => router.back()}
                        className="rounded-full px-5 py-2.5 mt-5"
                        style={{ backgroundColor: PALETTE.forest }}
                    >
                        <Text className="text-[13.5px] font-bold text-white">
                            Bumalik
                        </Text>
                    </Pressable>
                </View>
            ) : (
                <ScrollView
                    contentContainerClassName="px-5 pt-1 pb-10"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Alert banner */}
                    <LinearGradient
                        colors={[level.colorLight, level.colorDark]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{
                            borderRadius: 28,
                            overflow: "hidden",
                            shadowColor: level.colorDark,
                            shadowOffset: { width: 0, height: 8 },
                            shadowOpacity: 0.3,
                            shadowRadius: 14,
                            elevation: 9,
                        }}
                    >
                        {/* big faded icon as a background decoration */}
                        <View
                            pointerEvents="none"
                            className="absolute"
                            style={{ right: -22, bottom: -26, opacity: 0.16 }}
                        >
                            <Ionicons
                                name={category.icon}
                                size={140}
                                color="#fff"
                            />
                        </View>

                        <View className="p-5">
                            <View className="flex-row items-center gap-3 mb-4">
                                <View className="w-12 h-12 items-center justify-center">
                                    {announcement.severity === "kritikal" && (
                                        <PulseRing size={48} maxScale={1.5} />
                                    )}
                                    <View className="w-12 h-12 rounded-2xl bg-white items-center justify-center">
                                        <Ionicons
                                            name={level.icon}
                                            size={24}
                                            color={level.colorDark}
                                        />
                                    </View>
                                </View>
                                <View className="flex-row flex-wrap gap-1.5 flex-1">
                                    <View className="bg-white rounded-full px-2.5 py-1">
                                        <Text
                                            className="text-[11px] font-extrabold tracking-wider"
                                            style={{ color: level.colorDark }}
                                        >
                                            {level.label.toUpperCase()}
                                        </Text>
                                    </View>
                                    <View className="flex-row items-center gap-1 bg-white/20 border border-white/30 rounded-full px-2.5 py-1">
                                        <Ionicons
                                            name={category.icon}
                                            size={12}
                                            color="#fff"
                                        />
                                        <Text className="text-[11px] font-semibold text-white">
                                            {category.label}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            <Text className="text-[22px] font-extrabold text-white leading-[28px]">
                                {announcement.title}
                            </Text>
                            <Text className="text-[12.5px] text-white/85 mt-1">
                                {level.description}
                            </Text>
                            <View className="flex-row items-center gap-1.5 mt-4">
                                <Ionicons
                                    name="time-outline"
                                    size={13}
                                    color="rgba(255,255,255,0.85)"
                                />
                                <Text className="text-[12px] text-white/85">
                                    {formatAnnouncementDate(
                                        announcement.createdAt,
                                    )}
                                </Text>
                            </View>
                        </View>
                    </LinearGradient>

                    {/* Posted by and target area */}
                    <View
                        style={clayRaised}
                        className="bg-white rounded-[24px] p-4 mt-4"
                    >
                        <View className="flex-row items-center gap-3">
                            <LinearGradient
                                colors={[
                                    PALETTE.leaf,
                                    PALETTE.gold,
                                    PALETTE.terracotta,
                                ]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={{ borderRadius: 24, padding: 2 }}
                            >
                                <View className="w-11 h-11 rounded-full items-center justify-center overflow-hidden border-2 border-white bg-[#5C7A5F]">
                                    {announcement.authorPhotoURL ? (
                                        <Image
                                            source={{
                                                uri: announcement.authorPhotoURL,
                                            }}
                                            className="w-full h-full"
                                            resizeMode="cover"
                                        />
                                    ) : (
                                        <Text className="text-white text-[13px] font-bold">
                                            {announcement.authorName
                                                .slice(0, 2)
                                                .toUpperCase()}
                                        </Text>
                                    )}
                                </View>
                            </LinearGradient>
                            <View className="flex-1">
                                <View className="flex-row items-center gap-1">
                                    <Text
                                        className="text-[14.5px] font-bold shrink"
                                        style={{ color: PALETTE.ink }}
                                        numberOfLines={1}
                                    >
                                        {announcement.authorName}
                                    </Text>
                                    <VerifiedBadge size={15} />
                                </View>
                                <Text className="text-[11.5px] text-[#9C978C] mt-0.5">
                                    Opisyal na Anunsyo ·{" "}
                                    {formatTimeAgo(announcement.createdAt)}
                                </Text>
                            </View>
                        </View>

                        <View
                            className="flex-row items-center gap-2.5 rounded-2xl px-3 py-2.5 mt-3.5"
                            style={{ backgroundColor: "rgba(62,123,79,0.08)" }}
                        >
                            <View
                                className="w-8 h-8 rounded-full items-center justify-center"
                                style={{ backgroundColor: PALETTE.forest }}
                            >
                                <Ionicons
                                    name={
                                        announcement.targetBarangay
                                            ? "location"
                                            : "earth"
                                    }
                                    size={15}
                                    color="#fff"
                                />
                            </View>
                            <View className="flex-1">
                                <Text
                                    className="text-[11px] font-semibold"
                                    style={{ color: PALETTE.muted }}
                                >
                                    Sakop
                                </Text>
                                <Text
                                    className="text-[13.5px] font-bold"
                                    style={{ color: PALETTE.ink }}
                                >
                                    {announcement.targetBarangay
                                        ? `Barangay ${announcement.targetBarangay}`
                                        : "Lahat ng Barangay"}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Details */}
                    <View
                        style={clayRaised}
                        className="bg-white rounded-[24px] p-5 mt-4"
                    >
                        <View className="flex-row items-center gap-2 mb-3">
                            <View
                                className="w-1.5 h-5 rounded-full"
                                style={{ backgroundColor: level.colorLight }}
                            />
                            <Text
                                className="text-[15.5px] font-extrabold"
                                style={{ color: PALETTE.ink }}
                            >
                                Detalye
                            </Text>
                        </View>
                        <Text
                            className="text-[15px] leading-[24px]"
                            style={{ color: PALETTE.ink }}
                        >
                            {announcement.content}
                        </Text>

                        {announcement.imageUrl && (
                            <Image
                                source={{ uri: announcement.imageUrl }}
                                className="w-full rounded-[20px] bg-[#EDEAE2] mt-4"
                                style={{ aspectRatio: imageAspect }}
                                resizeMode="cover"
                            />
                        )}
                    </View>

                    {/* Shortcut to the emergency hotlines */}
                    <Pressable
                        className="mt-5"
                        onPress={() => router.push("/(tabs)/emergency")}
                    >
                        {({ pressed }) => (
                            <LinearGradient
                                colors={[PALETTE.ember, "#D33C2E", PALETTE.blood]}
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
                                    className="absolute w-28 h-28 rounded-full bg-white/10"
                                    style={{ right: -30, top: -40 }}
                                />
                                <View className="flex-row items-center gap-3 p-4">
                                    <View className="w-11 h-11 rounded-full bg-white items-center justify-center">
                                        <Ionicons
                                            name="call"
                                            size={20}
                                            color={PALETTE.blood}
                                        />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-[14.5px] font-extrabold text-white">
                                            Kailangan ng agarang tulong?
                                        </Text>
                                        <Text className="text-[12px] text-white/85 mt-0.5">
                                            Tumawag sa mga numero ng ahensya.
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
                </ScrollView>
            )}
        </SafeAreaView>
    );
}
