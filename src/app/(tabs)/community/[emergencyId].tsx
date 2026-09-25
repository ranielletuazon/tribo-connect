import { ClaySurface, clayRaised } from "@/components/clay";
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
import { router, useLocalSearchParams } from "expo-router";
import { deleteDoc, doc, onSnapshot } from "firebase/firestore";
import { deleteObject, ref } from "firebase/storage";
import { useEffect, useState } from "react";
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
        <SafeAreaView className="flex-1 bg-[--main-white]" edges={["top"]}>
            {/* Header */}
            <View className="flex-row items-center gap-3 px-4 py-3 border-b border-[#EDEAE2]">
                <Pressable onPress={() => router.back()} className="p-1">
                    <Ionicons name="arrow-back" size={22} color="#1F2A1F" />
                </Pressable>
                <Text
                    className="flex-1 text-[15.5px] font-bold text-[#1F2A1F]"
                    numberOfLines={1}
                >
                    Anunsyo
                </Text>
                {announcement && (
                    <Pressable
                        onPress={handleShare}
                        hitSlop={8}
                        className="p-1"
                    >
                        <Ionicons
                            name="share-social-outline"
                            size={21}
                            color="#1F2A1F"
                        />
                    </Pressable>
                )}
                {announcement && isAdmin && (
                    <Pressable
                        onPress={handleDelete}
                        disabled={isDeleting}
                        hitSlop={8}
                        className="p-1"
                    >
                        {isDeleting ? (
                            <ActivityIndicator size="small" color="#B23A2E" />
                        ) : (
                            <Ionicons
                                name="trash-outline"
                                size={21}
                                color="#B23A2E"
                            />
                        )}
                    </Pressable>
                )}
            </View>

            {isLoading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator color="#9C3A2A" />
                </View>
            ) : !announcement || !level || !category ? (
                <View className="flex-1 items-center justify-center px-8">
                    <Ionicons
                        name="megaphone-outline"
                        size={36}
                        color="#C4BFB2"
                    />
                    <Text className="text-center text-[13.5px] text-[#9C978C] mt-3">
                        Hindi na makita ang anunsyong ito. Maaaring binura na
                        ito.
                    </Text>
                </View>
            ) : (
                <ScrollView contentContainerClassName="px-5 pt-4 pb-10">
                    {/* Alert banner */}
                    <ClaySurface
                        colors={[level.colorLight, level.colorDark]}
                        borderRadius={22}
                        style={{ padding: 18 }}
                    >
                        <View className="flex-row items-center gap-2 mb-3">
                            <View className="flex-row items-center gap-1 bg-white/25 rounded-full px-2.5 py-1">
                                <Ionicons
                                    name={level.icon}
                                    size={13}
                                    color="#fff"
                                />
                                <Text className="text-[11px] font-bold text-white tracking-wider">
                                    {level.label.toUpperCase()}
                                </Text>
                            </View>
                            <View className="flex-row items-center gap-1 bg-white/15 rounded-full px-2.5 py-1">
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
                        <Text className="text-[19px] font-bold text-white leading-[25px]">
                            {announcement.title}
                        </Text>
                        <Text className="text-[12px] text-white/80 mt-2">
                            {formatAnnouncementDate(announcement.createdAt)}
                        </Text>
                    </ClaySurface>

                    {/* Posted by and target area */}
                    <View
                        style={clayRaised}
                        className="bg-[--main-white] rounded-2xl p-4 mt-4 gap-3"
                    >
                        <View className="flex-row items-center gap-3">
                            <View className="w-10 h-10 rounded-full bg-[#5C7A5F] items-center justify-center overflow-hidden">
                                {announcement.authorPhotoURL ? (
                                    <Image
                                        source={{
                                            uri: announcement.authorPhotoURL,
                                        }}
                                        className="w-full h-full"
                                        resizeMode="cover"
                                    />
                                ) : (
                                    <Text className="text-white text-[12px] font-semibold">
                                        {announcement.authorName
                                            .slice(0, 2)
                                            .toUpperCase()}
                                    </Text>
                                )}
                            </View>
                            <View className="flex-1">
                                <View className="flex-row items-center gap-1">
                                    <Text className="text-[14px] font-semibold text-[#1F2A1F]">
                                        {announcement.authorName}
                                    </Text>
                                    <Ionicons
                                        name="checkmark-circle"
                                        size={14}
                                        color="#2A4F9E"
                                    />
                                </View>
                                <Text className="text-[11.5px] text-[#9C978C] mt-0.5">
                                    Opisyal na Anunsyo ·{" "}
                                    {formatTimeAgo(announcement.createdAt)}
                                </Text>
                            </View>
                        </View>

                        <View className="h-px bg-[#EDEAE2]" />

                        <View className="flex-row items-center gap-2">
                            <Ionicons
                                name={
                                    announcement.targetBarangay
                                        ? "location"
                                        : "earth"
                                }
                                size={16}
                                color={level.colorDark}
                            />
                            <Text className="text-[12.5px] text-[#7A6D5C]">
                                Sakop:{" "}
                                <Text className="font-semibold text-[#1F2A1F]">
                                    {announcement.targetBarangay
                                        ? `Barangay ${announcement.targetBarangay}`
                                        : "Lahat ng Barangay"}
                                </Text>
                            </Text>
                        </View>
                    </View>

                    {/* Details */}
                    <Text className="text-[15px] text-[#1F2A1F] leading-[23px] mt-5">
                        {announcement.content}
                    </Text>

                    {announcement.imageUrl && (
                        <Image
                            source={{ uri: announcement.imageUrl }}
                            className="w-full rounded-2xl bg-[#EDEAE2] mt-5"
                            style={{ aspectRatio: imageAspect }}
                            resizeMode="cover"
                        />
                    )}

                    {/* Shortcut to the emergency hotlines */}
                    <Pressable
                        className="flex-row items-center gap-2 rounded-2xl px-4 py-3 mt-6"
                        style={{ backgroundColor: level.tint }}
                        onPress={() => router.push("/(tabs)/emergency")}
                    >
                        <Ionicons
                            name="call-outline"
                            size={17}
                            color={level.colorDark}
                        />
                        <Text className="flex-1 text-[12px] text-[#7A6D5C] leading-[17px]">
                            Para sa agarang tulong, tumawag sa mga numero ng
                            ahensya.
                        </Text>
                        <Ionicons
                            name="chevron-forward"
                            size={16}
                            color={level.colorDark}
                        />
                    </Pressable>
                </ScrollView>
            )}
        </SafeAreaView>
    );
}
