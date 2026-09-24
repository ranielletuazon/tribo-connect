import { clayRaised } from "@/components/clay";
import { db } from "@/lib/firebase";
import { useAuth } from "@/providers/auth-provider";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
    collection,
    documentId,
    getDocs,
    limit,
    onSnapshot,
    orderBy,
    query,
    where,
    type Timestamp,
} from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Image,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface UserResult {
    uid: string;
    username: string;
    photoURL: string | null;
    barangay: string | null;
}

interface ConversationSummary {
    id: string;
    otherUid: string;
    otherName: string;
    otherPhotoURL: string | null;
    lastMessage: string;
    lastMessageAt: Timestamp | null;
    isUnread: boolean;
}

function formatTime(timestamp: Timestamp | null): string {
    if (!timestamp) return "";
    return timestamp
        .toDate()
        .toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" });
}

export default function Chat() {
    const { user, profile } = useAuth();
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<UserResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [conversations, setConversations] = useState<ConversationSummary[]>(
        [],
    );
    const [isLoadingConversations, setIsLoadingConversations] = useState(true);

    useEffect(() => {
        if (!user) return;
        const q = query(
            collection(db, "conversations"),
            where("participantIds", "array-contains", user.uid),
            orderBy("lastMessageAt", "desc"),
        );

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const baseList = snapshot.docs.map((docSnap) => {
                    const data = docSnap.data();
                    const otherUid =
                        (data.participantIds as string[]).find(
                            (id) => id !== user.uid,
                        ) ?? "";
                    const otherInfo = data.participantsInfo?.[otherUid] ?? {};
                    return {
                        id: docSnap.id,
                        otherUid,
                        otherName: otherInfo.name ?? "Gumagamit",
                        otherPhotoURL: otherInfo.photoURL ?? null,
                        lastMessage: data.lastMessage ?? "",
                        lastMessageAt: data.lastMessageAt ?? null,
                        isUnread: (data.unread ?? []).includes(user.uid),
                    };
                });

                setConversations(baseList);
                setIsLoadingConversations(false);

                const uniqueOtherUids = [
                    ...new Set(baseList.map((c) => c.otherUid).filter(Boolean)),
                ];
                if (uniqueOtherUids.length === 0) return;

                getDocs(
                    query(
                        collection(db, "users"),
                        where(documentId(), "in", uniqueOtherUids.slice(0, 30)),
                    ),
                )
                    .then((freshSnap) => {
                        const freshByUid = new Map(
                            freshSnap.docs.map((d) => [
                                d.id,
                                {
                                    name: d.data().username,
                                    photoURL: d.data().photoURL ?? null,
                                },
                            ]),
                        );
                        setConversations((prev) =>
                            prev.map((c) => {
                                const fresh = freshByUid.get(c.otherUid);
                                return fresh
                                    ? {
                                          ...c,
                                          otherName: fresh.name,
                                          otherPhotoURL: fresh.photoURL,
                                      }
                                    : c;
                            }),
                        );
                    })
                    .catch((err) =>
                        console.error("Fresh profile overlay error:", err),
                    );
            },
            (err) => {
                console.error("Conversations listener error:", err);
                setIsLoadingConversations(false);
            },
        );

        return unsubscribe;
    }, [user]);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);

        const term = searchQuery.trim().toLowerCase();
        if (term.length === 0) {
            setSearchResults([]);
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        debounceRef.current = setTimeout(async () => {
            try {
                const q = query(
                    collection(db, "users"),
                    where("username", ">=", term),
                    where("username", "<=", term + "\uf8ff"),
                    limit(10),
                );
                const snapshot = await getDocs(q);
                const results = snapshot.docs
                    .map((docSnap) => {
                        const data = docSnap.data();
                        return {
                            uid: docSnap.id,
                            username: data.username,
                            photoURL: data.photoURL ?? null,
                            barangay: data.barangay ?? null,
                        };
                    })
                    .filter((r) => r.uid !== user?.uid);
                setSearchResults(results);
            } catch (err) {
                console.error("User search error:", err);
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 400);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [searchQuery, user?.uid]);

    const handleSelectUser = (result: UserResult) => {
        setSearchQuery("");
        setSearchResults([]);

        const existingConversationId: string | undefined =
            profile?.messages?.[result.uid];

        router.push({
            pathname: "/(tabs)/chat/[conversationId]",
            params: {
                conversationId: existingConversationId ?? "new",
                targetUid: result.uid,
                targetName: result.username,
                targetPhotoURL: result.photoURL ?? "",
            },
        });
    };

    const term = searchQuery.trim().toLowerCase();
    const showSearchUI = term.length > 0;

    const filteredConversations = showSearchUI
        ? conversations.filter((c) => c.otherName.toLowerCase().includes(term))
        : conversations;

    const existingOtherUids = new Set(conversations.map((c) => c.otherUid));
    const newUserResults = searchResults.filter(
        (r) => !existingOtherUids.has(r.uid),
    );

    return (
        <SafeAreaView className="flex-1 bg-[--main-white]" edges={["top"]}>
            {/* Header + search bar — stays fixed at top, unchanged */}
            <View className="px-6 pt-4">
                <View className="flex-row items-center justify-between mb-5">
                    <Text className="text-[18px] font-bold text-[#1F2A1F]">
                        Mensahe
                    </Text>
                    <Pressable
                        style={clayRaised}
                        className="w-9 h-9 rounded-full bg-[#F8F4EA] items-center justify-center"
                    >
                        <Ionicons
                            name="settings-outline"
                            size={16}
                            color="#1F2A1F"
                        />
                    </Pressable>
                </View>

                <View
                    style={clayRaised}
                    className="flex-row items-center gap-2.5 bg-[--main-white] rounded-[24px] px-4 py-4"
                >
                    <Ionicons name="search" size={18} color="#9C978C" />
                    <TextInput
                        placeholder="Maghanap ng mensahe o gumagamit..."
                        placeholderTextColor="#9C978C"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoCapitalize="none"
                        className="flex-1 text-[14px] text-[#1F2A1F]"
                    />
                    {isSearching && (
                        <ActivityIndicator size="small" color="#2F5233" />
                    )}
                </View>
            </View>

            {/* Everything below is one normal scroll flow — no overlay, no absolute positioning */}
            <ScrollView contentContainerClassName="px-6 pt-5 pb-8 gap-3">
                {showSearchUI && newUserResults.length > 0 && (
                    <>
                        <Text className="text-[13px] font-medium text-[#7A6D5C] ml-1 -mb-1">
                            Mag Request ng Mensahe
                        </Text>
                        {newUserResults.map((result) => (
                            <Pressable
                                key={result.uid}
                                style={clayRaised}
                                className="flex-row items-center gap-3 bg-[--main-white] rounded-2xl p-3"
                                onPress={() => handleSelectUser(result)}
                            >
                                <View className="w-11 h-11 rounded-full bg-[#5C7A5F] items-center justify-center overflow-hidden">
                                    {result.photoURL ? (
                                        <Image
                                            source={{ uri: result.photoURL }}
                                            className="w-full h-full"
                                            resizeMode="cover"
                                        />
                                    ) : (
                                        <Text className="text-white text-[12px] font-semibold">
                                            {result.username
                                                .slice(0, 2)
                                                .toUpperCase()}
                                        </Text>
                                    )}
                                </View>
                                <View className="flex-1">
                                    <Text className="text-[14px] font-semibold text-[#1F2A1F]">
                                        {result.username}
                                    </Text>
                                    {result.barangay && (
                                        <Text className="text-[11.5px] text-[#9C978C]">
                                            Barangay {result.barangay}
                                        </Text>
                                    )}
                                </View>
                                <Ionicons
                                    name="chatbubble-outline"
                                    size={16}
                                    color="#C4BFB2"
                                />
                            </Pressable>
                        ))}
                        <Text className="text-[13px] font-medium text-[#7A6D5C] ml-1 mt-1 -mb-1">
                            Mga Mensahe
                        </Text>
                    </>
                )}

                {isLoadingConversations ? (
                    <ActivityIndicator
                        color="#2F5233"
                        style={{ marginTop: 40 }}
                    />
                ) : filteredConversations.length === 0 ? (
                    <Text className="text-center text-[13px] text-[#9C978C] mt-6">
                        {showSearchUI
                            ? "Walang nahanap na mensahe."
                            : "Walang mensahe pa. Maghanap ng gumagamit para magsimula."}
                    </Text>
                ) : (
                    filteredConversations.map((item) => (
                        <Pressable
                            key={item.id}
                            style={clayRaised}
                            className="flex-row items-center gap-3 bg-[--main-white] rounded-2xl p-3"
                            onPress={() =>
                                router.push({
                                    pathname: "/(tabs)/chat/[conversationId]",
                                    params: { conversationId: item.id },
                                })
                            }
                        >
                            <View className="w-12 h-12 rounded-full bg-[#5C7A5F] items-center justify-center overflow-hidden">
                                {item.otherPhotoURL ? (
                                    <Image
                                        source={{ uri: item.otherPhotoURL }}
                                        className="w-full h-full"
                                        resizeMode="cover"
                                    />
                                ) : (
                                    <Text className="text-white text-[13px] font-semibold">
                                        {item.otherName
                                            .slice(0, 2)
                                            .toUpperCase()}
                                    </Text>
                                )}
                            </View>

                            <View className="flex-1">
                                <Text className="text-[14.5px] font-semibold text-[#1F2A1F] mb-0.5">
                                    {item.otherName}
                                </Text>
                                <Text
                                    className={`text-[12.5px] ${item.isUnread ? "text-[#1F2A1F] font-semibold" : "text-[#7A6D5C]"}`}
                                    numberOfLines={1}
                                >
                                    {item.lastMessage}
                                </Text>
                            </View>

                            <View className="items-end gap-1.5">
                                <Text className="text-[11px] text-[#9C978C]">
                                    {formatTime(item.lastMessageAt)}
                                </Text>
                                {item.isUnread && (
                                    <View className="w-2.5 h-2.5 rounded-full bg-[#B23A2E]" />
                                )}
                            </View>
                        </Pressable>
                    ))
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
