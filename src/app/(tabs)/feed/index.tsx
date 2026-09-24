import { clayRaised } from "@/components/clay";
import { db } from "@/lib/firebase";
import { useAuth } from "@/providers/auth-provider";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import {
    arrayRemove,
    arrayUnion,
    collection,
    doc,
    getDocs,
    limit,
    orderBy,
    query,
    startAfter,
    updateDoc,
    type DocumentData,
    type QueryDocumentSnapshot,
    type Timestamp,
} from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Image,
    Pressable,
    RefreshControl,
    Text,
    View,
} from "react-native";
import Animated, {
    useAnimatedScrollHandler,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const COMPOSER_HEIGHT = 64;
const POSTS_PER_PAGE = 5;

interface Post {
    id: string;
    authorId: string;
    authorName: string;
    authorBarangay: string;
    authorPhotoURL: string | null;
    content: string;
    imageUrl: string | null;
    likes: string[];
    commentCount: number;
    createdAt: Timestamp | null;
}

function formatTimeAgo(timestamp: Timestamp | null): string {
    if (!timestamp) return "";
    const diffMins = Math.floor(
        (Date.now() - timestamp.toDate().getTime()) / 60000,
    );
    if (diffMins < 1) return "Ngayon lang";
    if (diffMins < 60) return `${diffMins} minuto ang nakalipas`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} oras ang nakalipas`;
    const diffDays = Math.floor(diffHours / 24);
    return diffDays === 1 ? "Kahapon" : `${diffDays} araw ang nakalipas`;
}

function mapDocToPost(docSnap: QueryDocumentSnapshot<DocumentData>): Post {
    const data = docSnap.data();
    return {
        id: docSnap.id,
        authorId: data.authorId,
        authorName: data.authorName,
        authorBarangay: data.authorBarangay,
        authorPhotoURL: data.authorPhotoURL ?? null,
        content: data.content,
        imageUrl: data.imageUrl ?? null,
        likes: data.likes ?? [],
        commentCount: data.commentCount ?? 0,
        createdAt: data.createdAt ?? null,
    };
}

export default function Feed() {
    const { user, profile } = useAuth();
    const { newPostJson } = useLocalSearchParams<{ newPostJson?: string }>();
    const lastScrollY = useRef(0);

    const [posts, setPosts] = useState<Post[]>([]);
    const [lastDoc, setLastDoc] =
        useState<QueryDocumentSnapshot<DocumentData> | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const composerHeight = useSharedValue(COMPOSER_HEIGHT);
    const composerOpacity = useSharedValue(1);

    const initials = (profile?.username ?? "U").slice(0, 2).toUpperCase();

    useEffect(() => {
        fetchInitialPosts();
    }, []);

    useEffect(() => {
        if (!newPostJson) return;
        try {
            const newPost: Post = JSON.parse(newPostJson);
            setPosts((prev) => [newPost, ...prev]);
        } catch (err) {
            console.error("Failed to parse returned post:", err);
        }
        router.setParams({ newPostJson: undefined });
    }, [newPostJson]);

    const fetchInitialPosts = async () => {
        setIsInitialLoading(true);
        try {
            const q = query(
                collection(db, "posts"),
                orderBy("createdAt", "desc"),
                limit(POSTS_PER_PAGE),
            );
            const snapshot = await getDocs(q);
            setPosts(snapshot.docs.map(mapDocToPost));
            setLastDoc(snapshot.docs[snapshot.docs.length - 1] ?? null);
            setHasMore(snapshot.docs.length === POSTS_PER_PAGE);
        } catch (err) {
            console.error("Fetch posts error:", err);
        } finally {
            setIsInitialLoading(false);
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await fetchInitialPosts();
        setIsRefreshing(false);
    };

    const loadMorePosts = async () => {
        if (!lastDoc || isLoadingMore) return;
        setIsLoadingMore(true);
        try {
            const q = query(
                collection(db, "posts"),
                orderBy("createdAt", "desc"),
                startAfter(lastDoc),
                limit(POSTS_PER_PAGE),
            );
            const snapshot = await getDocs(q);
            setPosts((prev) => [...prev, ...snapshot.docs.map(mapDocToPost)]);
            setLastDoc(snapshot.docs[snapshot.docs.length - 1] ?? lastDoc);
            setHasMore(snapshot.docs.length === POSTS_PER_PAGE);
        } catch (err) {
            console.error("Load more posts error:", err);
        } finally {
            setIsLoadingMore(false);
        }
    };

    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            const currentY = event.contentOffset.y;
            const delta = currentY - lastScrollY.current;

            if (currentY <= 4) {
                composerHeight.value = withTiming(COMPOSER_HEIGHT, {
                    duration: 220,
                });
                composerOpacity.value = withTiming(1, { duration: 220 });
            } else if (delta > 6) {
                composerHeight.value = withTiming(0, { duration: 220 });
                composerOpacity.value = withTiming(0, { duration: 150 });
            } else if (delta < -6) {
                composerHeight.value = withTiming(COMPOSER_HEIGHT, {
                    duration: 220,
                });
                composerOpacity.value = withTiming(1, { duration: 220 });
            }
            lastScrollY.current = currentY;
        },
    });

    const composerAnimatedStyle = useAnimatedStyle(() => ({
        height: composerHeight.value,
        opacity: composerOpacity.value,
        marginBottom: composerHeight.value > 4 ? 16 : 0,
    }));

    // update the like on screen first so it feels fast, then save it to Firestore
    const toggleLike = async (postId: string) => {
        if (!user) return;
        const target = posts.find((p) => p.id === postId);
        if (!target) return;
        const alreadyLiked = target.likes.includes(user.uid);

        setPosts((prev) =>
            prev.map((p) =>
                p.id === postId
                    ? {
                          ...p,
                          likes: alreadyLiked
                              ? p.likes.filter((id) => id !== user.uid)
                              : [...p.likes, user.uid],
                      }
                    : p,
            ),
        );

        try {
            await updateDoc(doc(db, "posts", postId), {
                likes: alreadyLiked
                    ? arrayRemove(user.uid)
                    : arrayUnion(user.uid),
            });
        } catch (err) {
            console.error("Toggle like error:", err);
            // if saving failed, undo the like
            setPosts((prev) =>
                prev.map((p) =>
                    p.id === postId
                        ? {
                              ...p,
                              likes: alreadyLiked
                                  ? [...p.likes, user.uid]
                                  : p.likes.filter((id) => id !== user.uid),
                          }
                        : p,
                ),
            );
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-[--main-white]" edges={["top"]}>
            {/* Header */}
            <View className="flex-row items-center justify-between px-6 pt-4 pb-3">
                <Text className="text-[18px] font-bold text-[#1F2A1F]">
                    Feed
                </Text>
            </View>

            {/* Composer */}
            <Animated.View
                style={[
                    composerAnimatedStyle,
                    { overflow: "hidden", paddingHorizontal: 24 },
                ]}
            >
                <Pressable
                    style={clayRaised}
                    className="flex-row items-center gap-3 bg-[--main-white] rounded-2xl p-3"
                    onPress={() => router.push("/(tabs)/feed/create-post")}
                >
                    <View className="w-9 h-9 rounded-full bg-[#5C7A5F] items-center justify-center overflow-hidden">
                        {profile?.photoURL ? (
                            <Image
                                source={{ uri: profile.photoURL }}
                                className="w-full h-full"
                                resizeMode="cover"
                            />
                        ) : (
                            <Text className="text-white text-[12px] font-semibold">
                                {initials}
                            </Text>
                        )}
                    </View>
                    <View className="flex-1 bg-[#F0EDE6] rounded-full px-4 py-2.5">
                        <Text className="text-[13.5px] text-[#9C978C]">
                            Ano ang nasa isip mo?
                        </Text>
                    </View>
                </Pressable>
            </Animated.View>

            <Animated.ScrollView
                onScroll={scrollHandler}
                scrollEventThrottle={16}
                contentContainerStyle={{
                    paddingHorizontal: 24,
                    paddingBottom: 32,
                    gap: 16,
                }}
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
                ) : posts.length === 0 ? (
                    <Text className="text-center text-[13px] text-[#9C978C] mt-10">
                        Walang post pa. Ikaw ang una!
                    </Text>
                ) : (
                    posts.map((post) => {
                        const isLiked = !!user && post.likes.includes(user.uid);
                        const authorInitials = post.authorName
                            .slice(0, 2)
                            .toUpperCase();
                        return (
                            <View
                                key={post.id}
                                style={clayRaised}
                                className="bg-[--main-white] rounded-2xl overflow-hidden"
                            >
                                <View className="flex-row items-center gap-3 p-4 pb-3">
                                    <View className="w-11 h-11 rounded-full bg-[#5C7A5F] items-center justify-center overflow-hidden">
                                        {post.authorPhotoURL ? (
                                            <Image
                                                source={{
                                                    uri: post.authorPhotoURL,
                                                }}
                                                className="w-full h-full"
                                                resizeMode="cover"
                                            />
                                        ) : (
                                            <Text className="text-white text-[13px] font-semibold">
                                                {authorInitials}
                                            </Text>
                                        )}
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-[14px] font-semibold text-[#1F2A1F]">
                                            {post.authorName}
                                        </Text>
                                        <Text className="text-[11.5px] text-[#9C978C] mt-0.5">
                                            Barangay {post.authorBarangay} ·{" "}
                                            {formatTimeAgo(post.createdAt)}
                                        </Text>
                                    </View>
                                    <Ionicons
                                        name="ellipsis-horizontal"
                                        size={18}
                                        color="#C4BFB2"
                                    />
                                </View>

                                <Text className="text-[13.5px] text-[#1F2A1F] leading-5 px-4 pb-3">
                                    {post.content}
                                </Text>

                                {post.imageUrl && (
                                    <Image
                                        source={{ uri: post.imageUrl }}
                                        className="w-full h-48 bg-[#EDEAE2]"
                                        resizeMode="cover"
                                    />
                                )}

                                <View className="flex-row items-center justify-between px-4 pt-3 pb-1">
                                    <Text className="text-[11.5px] text-[#9C978C]">
                                        {post.likes.length} gusto
                                    </Text>
                                    <Text className="text-[11.5px] text-[#9C978C]">
                                        {post.commentCount} komento
                                    </Text>
                                </View>

                                <View className="h-px bg-[#EDEAE2] mx-4 mt-2" />

                                <View className="flex-row items-center px-2 py-1">
                                    <Pressable
                                        className="flex-1 flex-row items-center justify-center gap-1.5 py-2.5"
                                        onPress={() => toggleLike(post.id)}
                                    >
                                        <Ionicons
                                            name={
                                                isLiked
                                                    ? "heart"
                                                    : "heart-outline"
                                            }
                                            size={18}
                                            color={
                                                isLiked ? "#B23A2E" : "#7A6D5C"
                                            }
                                        />
                                        <Text
                                            className="text-[13px] font-medium"
                                            style={{
                                                color: isLiked
                                                    ? "#B23A2E"
                                                    : "#7A6D5C",
                                            }}
                                        >
                                            Gusto
                                        </Text>
                                    </Pressable>

                                    <Pressable className="flex-1 flex-row items-center justify-center gap-1.5 py-2.5">
                                        <Ionicons
                                            name="chatbubble-outline"
                                            size={17}
                                            color="#7A6D5C"
                                        />
                                        <Text className="text-[13px] font-medium text-[#7A6D5C]">
                                            Komento
                                        </Text>
                                    </Pressable>
                                </View>
                            </View>
                        );
                    })
                )}

                {!isInitialLoading && hasMore && posts.length > 0 && (
                    <Pressable
                        onPress={loadMorePosts}
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
            </Animated.ScrollView>
        </SafeAreaView>
    );
}
