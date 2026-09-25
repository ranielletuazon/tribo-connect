import { clayRaised } from "@/components/clay";
import {
    CATEGORIES,
    SEVERITIES,
    mapDocToAnnouncement,
    type Announcement,
} from "@/lib/announcements";
import { db } from "@/lib/firebase";
import { formatTimeAgo } from "@/lib/posts";
import { useAuth } from "@/providers/auth-provider";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import {
    collection,
    doc,
    getDoc,
    getDocs,
    limit,
    orderBy,
    query,
    startAfter,
    type DocumentData,
    type QueryDocumentSnapshot,
} from "firebase/firestore";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    RefreshControl,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const FILTERS = ["Lahat", "Barangay", "Emergency"] as const;
type Filter = (typeof FILTERS)[number];

const ANNOUNCEMENTS_PER_PAGE = 5;

export default function Community() {
    const { profile } = useAuth();
    const isAdmin = profile?.role === "admin";
    const userBarangay = profile?.barangay as string | undefined;

    const { newAnnouncementJson } = useLocalSearchParams<{
        newAnnouncementJson?: string;
    }>();
    // the announcement that was opened in [emergencyId], refreshed when we come back
    const openedAnnouncementId = useRef<string | null>(null);

    const [activeFilter, setActiveFilter] = useState<Filter>("Lahat");
    const [searchQuery, setSearchQuery] = useState("");

    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [lastDoc, setLastDoc] =
        useState<QueryDocumentSnapshot<DocumentData> | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        fetchInitialAnnouncements();
    }, []);

    useEffect(() => {
        if (!newAnnouncementJson) return;
        try {
            const newAnnouncement: Announcement =
                JSON.parse(newAnnouncementJson);
            setAnnouncements((prev) => [newAnnouncement, ...prev]);
        } catch (err) {
            console.error("Failed to parse returned announcement:", err);
        }
        router.setParams({ newAnnouncementJson: undefined });
    }, [newAnnouncementJson]);

    // after coming back from [emergencyId], reload that announcement
    // so it disappears here if an admin deleted it there
    useFocusEffect(
        useCallback(() => {
            const announcementId = openedAnnouncementId.current;
            if (!announcementId) return;
            openedAnnouncementId.current = null;

            getDoc(doc(db, "announcements", announcementId))
                .then((snap) => {
                    if (!snap.exists()) {
                        setAnnouncements((prev) =>
                            prev.filter((a) => a.id !== announcementId),
                        );
                        return;
                    }
                    const fresh = mapDocToAnnouncement(snap);
                    setAnnouncements((prev) =>
                        prev.map((a) => (a.id === announcementId ? fresh : a)),
                    );
                })
                .catch((err) =>
                    console.error("Refresh announcement error:", err),
                );
        }, []),
    );

    const openAnnouncement = (announcementId: string) => {
        openedAnnouncementId.current = announcementId;
        router.push({
            pathname: "/(tabs)/community/[emergencyId]",
            params: { emergencyId: announcementId },
        });
    };

    const fetchInitialAnnouncements = async () => {
        setIsInitialLoading(true);
        try {
            const q = query(
                collection(db, "announcements"),
                orderBy("createdAt", "desc"),
                limit(ANNOUNCEMENTS_PER_PAGE),
            );
            const snapshot = await getDocs(q);
            setAnnouncements(snapshot.docs.map(mapDocToAnnouncement));
            setLastDoc(snapshot.docs[snapshot.docs.length - 1] ?? null);
            setHasMore(snapshot.docs.length === ANNOUNCEMENTS_PER_PAGE);
        } catch (err) {
            console.error("Fetch announcements error:", err);
        } finally {
            setIsInitialLoading(false);
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await fetchInitialAnnouncements();
        setIsRefreshing(false);
    };

    const loadMoreAnnouncements = async () => {
        if (!lastDoc || isLoadingMore) return;
        setIsLoadingMore(true);
        try {
            const q = query(
                collection(db, "announcements"),
                orderBy("createdAt", "desc"),
                startAfter(lastDoc),
                limit(ANNOUNCEMENTS_PER_PAGE),
            );
            const snapshot = await getDocs(q);
            setAnnouncements((prev) => [
                ...prev,
                ...snapshot.docs.map(mapDocToAnnouncement),
            ]);
            setLastDoc(snapshot.docs[snapshot.docs.length - 1] ?? lastDoc);
            setHasMore(snapshot.docs.length === ANNOUNCEMENTS_PER_PAGE);
        } catch (err) {
            console.error("Load more announcements error:", err);
        } finally {
            setIsLoadingMore(false);
        }
    };

    // filter and search only go through the announcements already loaded
    // "Barangay" is the ones meant for the user's own barangay
    // "Emergency" is every announcement for now, since all of them are emergency ones
    const search = searchQuery.trim().toLowerCase();
    const filtered = announcements.filter((item) => {
        const matchesFilter =
            activeFilter !== "Barangay" ||
            (!!userBarangay && item.targetBarangay === userBarangay);
        const matchesSearch =
            search.length === 0 ||
            item.title.toLowerCase().includes(search) ||
            item.content.toLowerCase().includes(search);
        return matchesFilter && matchesSearch;
    });

    return (
        <SafeAreaView className="flex-1 bg-[--main-white]" edges={["top"]}>
            <View className="px-6 pt-4">
                {/* Header */}
                <View className="flex-row items-center justify-between mb-5">
                    <Text className="text-[18px] font-bold text-[#1F2A1F]">
                        Mga Anunsyo
                    </Text>
                    {/* only admins see this */}
                    {isAdmin && (
                        <Pressable
                            onPress={() =>
                                router.push("/(tabs)/community/create-emergency")
                            }
                            style={clayRaised}
                            className="flex-row items-center gap-1.5 rounded-full px-3.5 py-2 bg-[#9C3A2A]"
                        >
                            <Ionicons name="megaphone" size={15} color="#fff" />
                            <Text className="text-[13px] font-semibold text-white">
                                Mag-anunsyo
                            </Text>
                        </Pressable>
                    )}
                </View>

                {/* Search */}
                <View
                    style={clayRaised}
                    className="flex-row items-center gap-2.5 bg-[--main-white] rounded-[24px] px-4 py-2 mb-4"
                >
                    <Ionicons name="search" size={18} color="#9C978C" />
                    <TextInput
                        placeholder="Maghanap ng anunsyo..."
                        placeholderTextColor="#9C978C"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        className="flex-1 text-[14px] text-[#1F2A1F]"
                    />
                </View>

                {/* Filter chips */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerClassName="gap-2.5 pb-4"
                >
                    {FILTERS.map((filter) => (
                        <Pressable
                            key={filter}
                            style={clayRaised}
                            className={`rounded-full px-4 py-2 ${
                                activeFilter === filter
                                    ? "bg-[#2F5233]"
                                    : "bg-[--main-white]"
                            }`}
                            onPress={() => setActiveFilter(filter)}
                        >
                            <Text
                                className={`text-[13px] font-medium ${
                                    activeFilter === filter
                                        ? "text-white"
                                        : "text-[#1F2A1F]"
                                }`}
                            >
                                {filter}
                            </Text>
                        </Pressable>
                    ))}
                </ScrollView>
            </View>

            {/* List */}
            <ScrollView
                contentContainerClassName="px-6 pb-8 gap-3.5"
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={handleRefresh}
                        tintColor="#2F5233"
                        colors={["#2F5233"]}
                    />
                }
            >
                {isInitialLoading ? (
                    <ActivityIndicator
                        color="#2F5233"
                        style={{ marginTop: 40 }}
                    />
                ) : filtered.length === 0 ? (
                    <Text className="text-center text-[13px] text-[#9C978C] mt-10">
                        Walang nahanap na anunsyo.
                    </Text>
                ) : (
                    filtered.map((announcement) => {
                        const level = SEVERITIES[announcement.severity];
                        const category = CATEGORIES[announcement.category];
                        return (
                            <Pressable
                                key={announcement.id}
                                onPress={() => openAnnouncement(announcement.id)}
                            >
                                {({ pressed }) => (
                                    <View
                                        style={[
                                            clayRaised,
                                            { opacity: pressed ? 0.9 : 1 },
                                        ]}
                                        className="bg-[--main-white] rounded-2xl overflow-hidden flex-row"
                                    >
                                        {/* severity color strip */}
                                        <View
                                            style={{
                                                width: 5,
                                                backgroundColor:
                                                    level.colorDark,
                                            }}
                                        />
                                        <View className="flex-1 p-4">
                                            <View className="flex-row items-center gap-2 mb-2">
                                                <View
                                                    className="w-8 h-8 rounded-full items-center justify-center"
                                                    style={{
                                                        backgroundColor:
                                                            level.tint,
                                                    }}
                                                >
                                                    <Ionicons
                                                        name={category.icon}
                                                        size={16}
                                                        color={level.colorDark}
                                                    />
                                                </View>
                                                <View
                                                    className="rounded-full px-2 py-0.5"
                                                    style={{
                                                        backgroundColor:
                                                            level.colorDark,
                                                    }}
                                                >
                                                    <Text className="text-[10px] font-bold text-white tracking-wider">
                                                        {level.label.toUpperCase()}
                                                    </Text>
                                                </View>
                                                <Text className="text-[11.5px] font-medium text-[#7A6D5C]">
                                                    {category.label}
                                                </Text>
                                                <Text className="flex-1 text-right text-[11px] text-[#9C978C]">
                                                    {formatTimeAgo(
                                                        announcement.createdAt,
                                                    )}
                                                </Text>
                                            </View>

                                            <Text
                                                className="text-[14.5px] font-bold text-[#1F2A1F]"
                                                numberOfLines={2}
                                            >
                                                {announcement.title}
                                            </Text>
                                            <Text
                                                className="text-[12.5px] text-[#7A6D5C] leading-[18px] mt-1"
                                                numberOfLines={2}
                                            >
                                                {announcement.content}
                                            </Text>

                                            <View className="flex-row items-center gap-1 mt-2.5">
                                                <Ionicons
                                                    name={
                                                        announcement.targetBarangay
                                                            ? "location"
                                                            : "earth"
                                                    }
                                                    size={12}
                                                    color="#9C978C"
                                                />
                                                <Text
                                                    className="flex-1 text-[11.5px] text-[#9C978C]"
                                                    numberOfLines={1}
                                                >
                                                    {announcement.targetBarangay
                                                        ? `Barangay ${announcement.targetBarangay}`
                                                        : "Lahat ng Barangay"}
                                                </Text>
                                                {announcement.imageUrl && (
                                                    <Ionicons
                                                        name="image-outline"
                                                        size={13}
                                                        color="#9C978C"
                                                    />
                                                )}
                                            </View>
                                        </View>
                                    </View>
                                )}
                            </Pressable>
                        );
                    })
                )}

                {!isInitialLoading && hasMore && announcements.length > 0 && (
                    <Pressable
                        onPress={loadMoreAnnouncements}
                        disabled={isLoadingMore}
                        style={clayRaised}
                        className="bg-[#F8F4EA] rounded-2xl py-3 items-center"
                    >
                        {isLoadingMore ? (
                            <ActivityIndicator color="#2F5233" />
                        ) : (
                            <Text className="text-[13.5px] font-semibold text-[#2F5233]">
                                Mag-load ng Higit Pa
                            </Text>
                        )}
                    </Pressable>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
