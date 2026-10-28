import { BackgroundBlobs, clayRaised, pressScale } from "@/components/clay";
import { BARANGAY } from "@/constants/barangays";
import { PALETTE } from "@/constants/palette";
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
import { LinearGradient } from "expo-linear-gradient";
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

const FILTERS = ["Lahat", "Emergency"] as const;
type Filter = (typeof FILTERS)[number];

const FILTER_STYLES: Record<
    Filter,
    { icon: keyof typeof Ionicons.glyphMap; colors: [string, string] }
> = {
    Lahat: { icon: "apps", colors: ["#56A06A", "#2F6540"] },
    Emergency: { icon: "warning", colors: [PALETTE.ember, PALETTE.blood] },
};

const ANNOUNCEMENTS_PER_PAGE = 5;

export default function Community() {
    const { profile } = useAuth();
    const isAdmin = profile?.role === "admin";

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
    // "Emergency" is every announcement for now, since all of them are emergency ones
    const search = searchQuery.trim().toLowerCase();
    const filtered = announcements.filter(
        (item) =>
            search.length === 0 ||
            item.title.toLowerCase().includes(search) ||
            item.content.toLowerCase().includes(search),
    );

    return (
        <SafeAreaView
            className="flex-1"
            style={{ backgroundColor: PALETTE.cream }}
            edges={["top"]}
        >
            <BackgroundBlobs colors={[PALETTE.terracotta, PALETTE.gold]} />

            <View className="px-5 pt-4">
                {/* Header */}
                <View className="flex-row items-center gap-3 mb-4">
                    <Pressable
                        onPress={() => router.canGoBack() && router.back()}
                        className="w-10 h-10 rounded-full bg-[#F0EDE6] items-center justify-center"
                        style={clayRaised}
                    >
                        <Ionicons name="arrow-back" size={20} color={PALETTE.ink} />
                    </Pressable>
                    <View className="flex-1">
                        <Text
                            className="text-[22px] font-extrabold"
                            style={{ color: PALETTE.ink }}
                        >
                            Mga Anunsyo
                        </Text>
                        <Text
                            className="text-[12px]"
                            style={{ color: PALETTE.muted }}
                        >
                            Balita at abiso mula sa komunidad
                        </Text>
                    </View>
                    {/* only admins see this */}
                    {isAdmin && (
                        <Pressable
                            onPress={() =>
                                router.push("/(tabs)/community/create-emergency")
                            }
                        >
                            {({ pressed }) => (
                                <LinearGradient
                                    colors={["#E8894F", PALETTE.clay]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={[
                                        clayRaised,
                                        pressScale(pressed),
                                        {
                                            borderRadius: 999,
                                            paddingHorizontal: 14,
                                            paddingVertical: 9,
                                            flexDirection: "row",
                                            alignItems: "center",
                                            gap: 6,
                                        },
                                    ]}
                                >
                                    <Ionicons name="add" size={16} color="#fff" />
                                    <Text className="text-[13px] font-bold text-white">
                                        Mag-anunsyo
                                    </Text>
                                </LinearGradient>
                            )}
                        </Pressable>
                    )}
                </View>

                {/* Search */}
                <View
                    style={clayRaised}
                    className="flex-row items-center gap-2.5 bg-white rounded-2xl px-4 py-1.5 mb-3.5"
                >
                    <Ionicons name="search" size={18} color={PALETTE.terracotta} />
                    <TextInput
                        placeholder="Maghanap ng anunsyo..."
                        placeholderTextColor="#B5AFA0"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        className="flex-1 text-[14px] py-2"
                        style={{ color: PALETTE.ink }}
                    />
                    {searchQuery.length > 0 && (
                        <Pressable
                            onPress={() => setSearchQuery("")}
                            hitSlop={8}
                        >
                            <Ionicons
                                name="close-circle"
                                size={18}
                                color="#C4BFB2"
                            />
                        </Pressable>
                    )}
                </View>

                {/* Filter chips */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerClassName="gap-2 pb-4"
                >
                    {FILTERS.map((filter) => {
                        const active = activeFilter === filter;
                        const style = FILTER_STYLES[filter];
                        return (
                            <Pressable
                                key={filter}
                                onPress={() => setActiveFilter(filter)}
                            >
                                {({ pressed }) => (
                                    <LinearGradient
                                        colors={
                                            active
                                                ? style.colors
                                                : ["#FFFFFF", "#FFFFFF"]
                                        }
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={[
                                            clayRaised,
                                            pressScale(pressed),
                                            {
                                                borderRadius: 999,
                                                paddingHorizontal: 14,
                                                paddingVertical: 8,
                                                flexDirection: "row",
                                                alignItems: "center",
                                                gap: 6,
                                            },
                                        ]}
                                    >
                                        <Ionicons
                                            name={style.icon}
                                            size={14}
                                            color={
                                                active ? "#fff" : style.colors[1]
                                            }
                                        />
                                        <Text
                                            className="text-[13px] font-semibold"
                                            style={{
                                                color: active
                                                    ? "#fff"
                                                    : PALETTE.ink,
                                            }}
                                        >
                                            {filter}
                                        </Text>
                                    </LinearGradient>
                                )}
                            </Pressable>
                        );
                    })}
                </ScrollView>
            </View>

            {/* List */}
            <ScrollView
                contentContainerClassName="px-5 pt-1 pb-10 gap-3.5"
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={handleRefresh}
                        tintColor={PALETTE.terracotta}
                        colors={[PALETTE.terracotta]}
                    />
                }
            >
                {isInitialLoading ? (
                    <ActivityIndicator
                        color={PALETTE.terracotta}
                        style={{ marginTop: 40 }}
                    />
                ) : filtered.length === 0 ? (
                    <View className="items-center mt-12 px-8">
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
                            className="text-[14.5px] font-bold"
                            style={{ color: PALETTE.ink }}
                        >
                            Walang nahanap na anunsyo.
                        </Text>
                        {(search.length > 0 || activeFilter !== "Lahat") && (
                            <Text
                                className="text-[12.5px] text-center mt-1"
                                style={{ color: PALETTE.muted }}
                            >
                                Subukan ang ibang salita o filter.
                            </Text>
                        )}
                    </View>
                ) : (
                    filtered.map((announcement) => {
                        const level = SEVERITIES[announcement.severity];
                        const category = CATEGORIES[announcement.category];
                        const isCritical = announcement.severity === "kritikal";
                        return (
                            <Pressable
                                key={announcement.id}
                                onPress={() => openAnnouncement(announcement.id)}
                            >
                                {({ pressed }) => (
                                    <View
                                        style={[
                                            clayRaised,
                                            pressScale(pressed),
                                            {
                                                borderWidth: isCritical
                                                    ? 1.5
                                                    : 0,
                                                borderColor: `${level.colorLight}66`,
                                            },
                                        ]}
                                        className="bg-white rounded-[24px] overflow-hidden flex-row"
                                    >
                                        {/* severity color strip */}
                                        <LinearGradient
                                            colors={[
                                                level.colorLight,
                                                level.colorDark,
                                            ]}
                                            style={{ width: 6 }}
                                        />
                                        <View className="flex-1 p-4">
                                            <View className="flex-row items-center gap-2.5 mb-3">
                                                <LinearGradient
                                                    colors={[
                                                        level.colorLight,
                                                        level.colorDark,
                                                    ]}
                                                    start={{ x: 0, y: 0 }}
                                                    end={{ x: 1, y: 1 }}
                                                    style={{
                                                        width: 40,
                                                        height: 40,
                                                        borderRadius: 14,
                                                        alignItems: "center",
                                                        justifyContent:
                                                            "center",
                                                    }}
                                                >
                                                    <Ionicons
                                                        name={category.icon}
                                                        size={19}
                                                        color="#fff"
                                                    />
                                                </LinearGradient>
                                                <View className="flex-1">
                                                    <View className="flex-row items-center gap-1.5">
                                                        <View
                                                            className="flex-row items-center gap-1 rounded-full px-2 py-0.5"
                                                            style={{
                                                                backgroundColor:
                                                                    level.tint,
                                                            }}
                                                        >
                                                            <Ionicons
                                                                name={level.icon}
                                                                size={11}
                                                                color={
                                                                    level.colorDark
                                                                }
                                                            />
                                                            <Text
                                                                className="text-[10px] font-extrabold tracking-wider"
                                                                style={{
                                                                    color: level.colorDark,
                                                                }}
                                                            >
                                                                {level.label.toUpperCase()}
                                                            </Text>
                                                        </View>
                                                        <Text
                                                            className="text-[11.5px] font-semibold"
                                                            style={{
                                                                color: PALETTE.muted,
                                                            }}
                                                        >
                                                            {category.label}
                                                        </Text>
                                                    </View>
                                                    <Text className="text-[11px] text-[#9C978C] mt-0.5">
                                                        {formatTimeAgo(
                                                            announcement.createdAt,
                                                        )}
                                                    </Text>
                                                </View>
                                            </View>

                                            <Text
                                                className="text-[15.5px] font-extrabold leading-[21px]"
                                                style={{ color: PALETTE.ink }}
                                                numberOfLines={2}
                                            >
                                                {announcement.title}
                                            </Text>
                                            <Text
                                                className="text-[12.5px] leading-[18px] mt-1"
                                                style={{ color: PALETTE.muted }}
                                                numberOfLines={2}
                                            >
                                                {announcement.content}
                                            </Text>

                                            <View className="flex-row items-center gap-2 mt-3 pt-3 border-t border-[#F1ECE3]">
                                                <View className="flex-row items-center gap-1 shrink rounded-full px-2.5 py-1 bg-[#F6F2EA]">
                                                    <Ionicons
                                                        name="location"
                                                        size={12}
                                                        color={PALETTE.forest}
                                                    />
                                                    <Text
                                                        className="shrink text-[11.5px] font-semibold"
                                                        style={{
                                                            color: PALETTE.forest,
                                                        }}
                                                        numberOfLines={1}
                                                    >
                                                        Barangay {BARANGAY}
                                                    </Text>
                                                </View>
                                                {announcement.imageUrl && (
                                                    <View className="w-7 h-7 rounded-full bg-[#F6F2EA] items-center justify-center">
                                                        <Ionicons
                                                            name="image"
                                                            size={13}
                                                            color={PALETTE.muted}
                                                        />
                                                    </View>
                                                )}
                                                <View className="flex-1" />
                                                <View className="flex-row items-center gap-0.5">
                                                    <Text
                                                        className="text-[12px] font-bold"
                                                        style={{
                                                            color: level.colorDark,
                                                        }}
                                                    >
                                                        Basahin
                                                    </Text>
                                                    <Ionicons
                                                        name="chevron-forward"
                                                        size={14}
                                                        color={level.colorDark}
                                                    />
                                                </View>
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
                        className="flex-row items-center justify-center gap-1.5 rounded-full py-3 border-[1.5px] mt-1"
                        style={{
                            borderColor: "rgba(217,115,63,0.35)",
                            backgroundColor: "rgba(217,115,63,0.06)",
                        }}
                    >
                        {isLoadingMore ? (
                            <ActivityIndicator color={PALETTE.terracotta} />
                        ) : (
                            <>
                                <Text
                                    className="text-[13.5px] font-bold"
                                    style={{ color: PALETTE.clay }}
                                >
                                    Mag-load ng Higit Pa
                                </Text>
                                <Ionicons
                                    name="chevron-down"
                                    size={15}
                                    color={PALETTE.clay}
                                />
                            </>
                        )}
                    </Pressable>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
