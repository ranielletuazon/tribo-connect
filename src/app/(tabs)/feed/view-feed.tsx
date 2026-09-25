import { db } from "@/lib/firebase";
import {
    formatTimeAgo,
    mapDocToComment,
    mapDocToPost,
    type Post,
    type PostComment,
} from "@/lib/posts";
import { useAuth } from "@/providers/auth-provider";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import {
    arrayRemove,
    arrayUnion,
    collection,
    doc,
    increment,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
    writeBatch,
} from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const MAX_COMMENT_LENGTH = 1000;

function Avatar({
    name,
    photoURL,
    size,
}: {
    name: string;
    photoURL: string | null;
    size: number;
}) {
    return (
        <View
            className="rounded-full bg-[#5C7A5F] items-center justify-center overflow-hidden"
            style={{ width: size, height: size }}
        >
            {photoURL ? (
                <Image
                    source={{ uri: photoURL }}
                    className="w-full h-full"
                    resizeMode="cover"
                />
            ) : (
                <Text
                    className="text-white font-semibold"
                    style={{ fontSize: size * 0.3 }}
                >
                    {(name || "U").slice(0, 2).toUpperCase()}
                </Text>
            )}
        </View>
    );
}

export default function ViewFeed() {
    const { postId, focusComment } = useLocalSearchParams<{
        postId: string;
        focusComment?: string;
    }>();
    const { user, profile } = useAuth();

    const [post, setPost] = useState<Post | null>(null);
    const [isPostLoading, setIsPostLoading] = useState(true);
    const [comments, setComments] = useState<PostComment[]>([]);
    const [isCommentsLoading, setIsCommentsLoading] = useState(true);
    const [imageAspect, setImageAspect] = useState(4 / 3);

    const [text, setText] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const inputRef = useRef<TextInput>(null);
    const scrollRef = useRef<ScrollView>(null);
    // scroll to the bottom only after we send, not on every new comment
    const scrollAfterSend = useRef(false);

    // live post, so likes and the comment count stay current
    useEffect(() => {
        if (!postId) return;
        return onSnapshot(
            doc(db, "posts", postId),
            (snap) => {
                setPost(snap.exists() ? mapDocToPost(snap) : null);
                setIsPostLoading(false);
            },
            (err) => {
                console.error("Load post error:", err);
                setIsPostLoading(false);
            },
        );
    }, [postId]);

    // live comments, oldest first like a normal conversation
    useEffect(() => {
        if (!postId) return;
        const q = query(
            collection(db, "posts", postId, "comments"),
            orderBy("createdAt", "asc"),
        );
        return onSnapshot(
            q,
            (snapshot) => {
                setComments(snapshot.docs.map(mapDocToComment));
                setIsCommentsLoading(false);
            },
            (err) => {
                console.error("Load comments error:", err);
                setIsCommentsLoading(false);
            },
        );
    }, [postId]);

    // show the whole image instead of cropping it
    useEffect(() => {
        if (!post?.imageUrl) return;
        Image.getSize(
            post.imageUrl,
            (width, height) => {
                if (width > 0 && height > 0) setImageAspect(width / height);
            },
            () => {},
        );
    }, [post?.imageUrl]);

    useEffect(() => {
        if (!scrollAfterSend.current) return;
        scrollAfterSend.current = false;
        const timeout = setTimeout(
            () => scrollRef.current?.scrollToEnd({ animated: true }),
            50,
        );
        return () => clearTimeout(timeout);
    }, [comments]);

    const isLiked = !!user && !!post && post.likes.includes(user.uid);

    // onSnapshot shows the change right away from the local cache
    const toggleLike = async () => {
        if (!user || !post) return;
        try {
            await updateDoc(doc(db, "posts", post.id), {
                likes: isLiked ? arrayRemove(user.uid) : arrayUnion(user.uid),
            });
        } catch (err) {
            console.error("Toggle like error:", err);
        }
    };

    const trimmed = text.trim();
    const canSend =
        trimmed.length > 0 &&
        trimmed.length <= MAX_COMMENT_LENGTH &&
        !isSending &&
        !!post &&
        !!user &&
        !!profile;

    // the comment and the count go in one batch so they never get out of sync
    const handleSend = async () => {
        if (!canSend || !user || !profile || !post) return;
        setText("");
        setError(null);
        setIsSending(true);

        try {
            const postRef = doc(db, "posts", post.id);
            const commentRef = doc(collection(postRef, "comments"));
            const batch = writeBatch(db);
            batch.set(commentRef, {
                authorId: user.uid,
                authorName: profile.username,
                authorPhotoURL: profile.photoURL ?? null,
                content: trimmed,
                createdAt: serverTimestamp(),
            });
            batch.update(postRef, { commentCount: increment(1) });
            scrollAfterSend.current = true;
            await batch.commit();
        } catch (err) {
            console.error("Send comment error:", err);
            scrollAfterSend.current = false;
            setText(trimmed);
            setError("Hindi naipadala ang komento. Pakisubukang muli.");
        } finally {
            setIsSending(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-[--main-white]" edges={["top"]}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                {/* Header */}
                <View className="flex-row items-center gap-3 px-4 py-3 border-b border-[#EDEAE2]">
                    <Pressable onPress={() => router.back()} className="p-1">
                        <Ionicons name="arrow-back" size={22} color="#1F2A1F" />
                    </Pressable>
                    <Text
                        className="flex-1 text-[15.5px] font-bold text-[#1F2A1F]"
                        numberOfLines={1}
                    >
                        {post ? `Post ni ${post.authorName}` : "Post"}
                    </Text>
                </View>

                {isPostLoading ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator color="#2F5233" />
                    </View>
                ) : !post ? (
                    <View className="flex-1 items-center justify-center px-8">
                        <Ionicons
                            name="document-text-outline"
                            size={36}
                            color="#C4BFB2"
                        />
                        <Text className="text-center text-[13.5px] text-[#9C978C] mt-3">
                            Hindi na makita ang post na ito. Maaaring binura
                            na ito.
                        </Text>
                    </View>
                ) : (
                    <>
                        <ScrollView
                            ref={scrollRef}
                            keyboardShouldPersistTaps="handled"
                            contentContainerStyle={{ paddingBottom: 16 }}
                        >
                            {/* Post */}
                            <View className="flex-row items-center gap-3 px-4 pt-4 pb-3">
                                <Avatar
                                    name={post.authorName}
                                    photoURL={post.authorPhotoURL}
                                    size={44}
                                />
                                <View className="flex-1">
                                    <Text className="text-[14px] font-semibold text-[#1F2A1F]">
                                        {post.authorName}
                                    </Text>
                                    <Text className="text-[11.5px] text-[#9C978C] mt-0.5">
                                        Barangay {post.authorBarangay} ·{" "}
                                        {formatTimeAgo(post.createdAt)}
                                    </Text>
                                </View>
                            </View>

                            {post.content.length > 0 && (
                                <Text className="text-[14.5px] text-[#1F2A1F] leading-[21px] px-4 pb-3">
                                    {post.content}
                                </Text>
                            )}

                            {post.imageUrl && (
                                <Image
                                    source={{ uri: post.imageUrl }}
                                    className="w-full bg-[#EDEAE2]"
                                    style={{ aspectRatio: imageAspect }}
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
                                    onPress={toggleLike}
                                >
                                    <Ionicons
                                        name={isLiked ? "heart" : "heart-outline"}
                                        size={18}
                                        color={isLiked ? "#B23A2E" : "#7A6D5C"}
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

                                <Pressable
                                    className="flex-1 flex-row items-center justify-center gap-1.5 py-2.5"
                                    onPress={() => inputRef.current?.focus()}
                                >
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

                            <View className="h-px bg-[#EDEAE2]" />

                            {/* Comments */}
                            <View className="px-4 pt-4 gap-3">
                                {isCommentsLoading ? (
                                    <ActivityIndicator
                                        color="#2F5233"
                                        style={{ marginTop: 16 }}
                                    />
                                ) : comments.length === 0 ? (
                                    <Text className="text-center text-[13px] text-[#9C978C] mt-6">
                                        Wala pang komento. Ikaw ang mauna!
                                    </Text>
                                ) : (
                                    comments.map((comment) => (
                                        <View
                                            key={comment.id}
                                            className="flex-row gap-2"
                                        >
                                            <Avatar
                                                name={comment.authorName}
                                                photoURL={comment.authorPhotoURL}
                                                size={34}
                                            />
                                            <View className="flex-1 items-start">
                                                <View className="bg-[#F0EDE6] rounded-2xl px-3.5 py-2 max-w-full">
                                                    <Text className="text-[13px] font-semibold text-[#1F2A1F]">
                                                        {comment.authorName}
                                                    </Text>
                                                    <Text className="text-[14px] text-[#1F2A1F] leading-5 mt-0.5">
                                                        {comment.content}
                                                    </Text>
                                                </View>
                                                <Text className="text-[11px] text-[#9C978C] mt-1 ml-3">
                                                    {formatTimeAgo(
                                                        comment.createdAt,
                                                    )}
                                                </Text>
                                            </View>
                                        </View>
                                    ))
                                )}
                            </View>
                        </ScrollView>

                        {error && (
                            <Text className="text-[12px] text-[#B23A2E] text-center px-4 pb-1">
                                {error}
                            </Text>
                        )}

                        {/* Comment input */}
                        <View className="flex-row items-end gap-2 px-4 py-3 border-t border-[#EDEAE2]">
                            <Avatar
                                name={profile?.username ?? ""}
                                photoURL={profile?.photoURL ?? null}
                                size={36}
                            />
                            <TextInput
                                ref={inputRef}
                                value={text}
                                onChangeText={setText}
                                placeholder="Sumulat ng komento..."
                                placeholderTextColor="#9C978C"
                                multiline
                                maxLength={MAX_COMMENT_LENGTH}
                                autoFocus={focusComment === "1"}
                                className="flex-1 bg-[#F0EDE6] rounded-[22px] px-4 py-2.5 text-[15px] text-[#1F2A1F] max-h-[120px]"
                            />
                            <Pressable
                                onPress={handleSend}
                                disabled={!canSend}
                                className="w-11 h-11 rounded-full items-center justify-center"
                                style={{
                                    backgroundColor: canSend
                                        ? "#2F5233"
                                        : "#E5E1D8",
                                }}
                            >
                                {isSending ? (
                                    <ActivityIndicator
                                        size="small"
                                        color="#fff"
                                    />
                                ) : (
                                    <Ionicons
                                        name="send"
                                        size={18}
                                        color={canSend ? "#fff" : "#9C978C"}
                                    />
                                )}
                            </Pressable>
                        </View>
                    </>
                )}
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
