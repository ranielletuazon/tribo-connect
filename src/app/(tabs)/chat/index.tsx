import { Avatar } from "@/components/avatar";
import { BackgroundBlobs, clayRaised, pressScale } from "@/components/clay";
import { VerifiedBadge } from "@/components/verified-badge";
import { PALETTE } from "@/constants/palette";
import { formatListTime } from "@/lib/chat-time";
import { db } from "@/lib/firebase";
import { useAuth } from "@/providers/auth-provider";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
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
    isVerified: boolean;
}

interface ConversationSummary {
    id: string;
    otherUid: string;
    otherName: string;
    otherPhotoURL: string | null;
    otherVerified: boolean;
    lastMessage: string;
    lastMessageAt: Timestamp | null;
    isLastMine: boolean;
    isUnread: boolean;
}

const GREEN: [string, string] = ["#56A06A", "#2F6540"];

function SectionTitle({ title, color }: { title: string; color: string }) {
    return (
        <View className="flex-row items-center gap-2 ml-1 mt-1">
            <View
                className="w-1.5 h-4 rounded-full"
                style={{ backgroundColor: color }}
            />
            <Text
                className="text-[14px] font-extrabold"
                style={{ color: PALETTE.ink }}
            >
                {title}
            </Text>
        </View>
    );
}

export default function Chat() {
    const { user, profile } = useAuth();
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<UserResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const searchInputRef = useRef<TextInput>(null);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [activeFilter, setActiveFilter] = useState<"all" | "unread">("all");

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
                        otherVerified: false,
                        lastMessage: data.lastMessage ?? "",
                        lastMessageAt: data.lastMessageAt ?? null,
                        isLastMine: data.lastMessageSenderId === user.uid,
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
                                    isVerified: d.data().isVerified === true,
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
                                          otherVerified: fresh.isVerified,
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
                            isVerified: data.isVerified === true,
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
                targetVerified: result.isVerified ? "1" : "",
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

    const unreadCount = conversations.filter((c) => c.isUnread).length;
    const visibleConversations =
        activeFilter === "unread"
            ? filteredConversations.filter((c) => c.isUnread)
            : filteredConversations;

    return (
        <SafeAreaView
            className="flex-1"
            style={{ backgroundColor: PALETTE.cream }}
            edges={["top"]}
        >
            <BackgroundBlobs colors={[PALETTE.leaf, PALETTE.gold]} />

            {/* Header and search bar */}
            <View className="px-5 pt-4">
                <View className="flex-row items-center gap-3 mb-4">
                    <Pressable
                        onPress={() => router.canGoBack() && router.back()}
                        className="w-10 h-10 rounded-full bg-[#F0EDE6] items-center justify-center"
                        style={clayRaised}
                    >
                        <Ionicons
                            name="arrow-back"
                            size={20}
                            color={PALETTE.ink}
                        />
                    </Pressable>
                    <View className="flex-1">
                        <Text
                            className="text-[22px] font-extrabold"
                            style={{ color: PALETTE.ink }}
                        >
                            Mensahe
                        </Text>
                        <Text
                            className="text-[12px]"
                            style={{ color: PALETTE.muted }}
                        >
                            Makipag-usap sa pamilya at komunidad
                        </Text>
                    </View>
                    {/* starts a new chat by jumping to the search box */}
                    <Pressable onPress={() => searchInputRef.current?.focus()}>
                        {({ pressed }) => (
                            <LinearGradient
                                colors={GREEN}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={[
                                    clayRaised,
                                    pressScale(pressed),
                                    {
                                        width: 42,
                                        height: 42,
                                        borderRadius: 21,
                                        alignItems: "center",
                                        justifyContent: "center",
                                    },
                                ]}
                            >
                                <Ionicons
                                    name="create-outline"
                                    size={19}
                                    color="#fff"
                                />
                            </LinearGradient>
                        )}
                    </Pressable>
                </View>

                {/* Search */}
                <View
                    style={[
                        clayRaised,
                        {
                            borderWidth: 1.5,
                            borderColor: isSearchFocused
                                ? PALETTE.forest
                                : "transparent",
                        },
                    ]}
                    className="flex-row items-center gap-2.5 bg-white rounded-2xl px-4 mb-3.5"
                >
                    <Ionicons
                        name="search"
                        size={18}
                        color={isSearchFocused ? PALETTE.forest : "#9C978C"}
                    />
                    <TextInput
                        ref={searchInputRef}
                        placeholder="Maghanap ng mensahe o gumagamit..."
                        placeholderTextColor="#B5AFA0"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        onFocus={() => setIsSearchFocused(true)}
                        onBlur={() => setIsSearchFocused(false)}
                        autoCapitalize="none"
                        autoCorrect={false}
                        returnKeyType="search"
                        className="flex-1 text-[14px] py-3"
                        style={{ color: PALETTE.ink }}
                    />
                    {isSearching ? (
                        <ActivityIndicator size="small" color={PALETTE.forest} />
                    ) : (
                        searchQuery.length > 0 && (
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
                        )
                    )}
                </View>

                {/* Filter chips */}
                {!showSearchUI && (
                    <View className="flex-row gap-2 pb-4">
                        {(
                            [
                                ["all", "Lahat", "chatbubbles"],
                                ["unread", "Hindi pa nababasa", "mail-unread"],
                            ] as const
                        ).map(([key, label, icon]) => {
                            const active = activeFilter === key;
                            return (
                                <Pressable
                                    key={key}
                                    onPress={() => setActiveFilter(key)}
                                >
                                    {({ pressed }) => (
                                        <LinearGradient
                                            colors={
                                                active
                                                    ? GREEN
                                                    : ["#FFFFFF", "#FFFFFF"]
                                            }
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                            style={[
                                                clayRaised,
                                                pressScale(pressed),
                                                {
                                                    borderRadius: 999,
                                                    paddingLeft: 14,
                                                    paddingRight:
                                                        key === "unread" &&
                                                        unreadCount > 0
                                                            ? 6
                                                            : 14,
                                                    paddingVertical: 7,
                                                    flexDirection: "row",
                                                    alignItems: "center",
                                                    gap: 6,
                                                },
                                            ]}
                                        >
                                            <Ionicons
                                                name={icon}
                                                size={14}
                                                color={
                                                    active
                                                        ? "#fff"
                                                        : PALETTE.forest
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
                                                {label}
                                            </Text>
                                            {key === "unread" &&
                                                unreadCount > 0 && (
                                                    <View
                                                        className="min-w-[20px] h-5 rounded-full px-1.5 items-center justify-center"
                                                        style={{
                                                            backgroundColor:
                                                                active
                                                                    ? "#fff"
                                                                    : PALETTE.ember,
                                                        }}
                                                    >
                                                        <Text
                                                            className="text-[11px] font-extrabold"
                                                            style={{
                                                                color: active
                                                                    ? PALETTE.forest
                                                                    : "#fff",
                                                            }}
                                                        >
                                                            {unreadCount}
                                                        </Text>
                                                    </View>
                                                )}
                                        </LinearGradient>
                                    )}
                                </Pressable>
                            );
                        })}
                    </View>
                )}
            </View>

            {/* handled taps go through on the first press even
                while the keyboard is open */}
            <ScrollView
                contentContainerClassName="px-5 pt-1 pb-10 gap-3"
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                showsVerticalScrollIndicator={false}
            >
                {showSearchUI && newUserResults.length > 0 && (
                    <>
                        <SectionTitle
                            title="Magsimula ng Usapan"
                            color={PALETTE.terracotta}
                        />
                        {newUserResults.map((result) => (
                            <Pressable
                                key={result.uid}
                                onPress={() => handleSelectUser(result)}
                            >
                                {({ pressed }) => (
                                    <View
                                        style={[clayRaised, pressScale(pressed)]}
                                        className="flex-row items-center gap-3 bg-white rounded-[22px] p-3"
                                    >
                                        <Avatar
                                            name={result.username}
                                            photoURL={result.photoURL}
                                            size={46}
                                        />
                                        <View className="flex-1">
                                            <View className="flex-row items-center gap-1">
                                                <Text
                                                    className="text-[14.5px] font-bold shrink"
                                                    style={{ color: PALETTE.ink }}
                                                    numberOfLines={1}
                                                >
                                                    {result.username}
                                                </Text>
                                                {result.isVerified && (
                                                    <VerifiedBadge />
                                                )}
                                            </View>
                                            {result.barangay && (
                                                <View className="flex-row items-center gap-1 mt-0.5">
                                                    <Ionicons
                                                        name="location"
                                                        size={11}
                                                        color="#9C978C"
                                                    />
                                                    <Text className="text-[12px] text-[#9C978C]">
                                                        Barangay{" "}
                                                        {result.barangay}
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                        <LinearGradient
                                            colors={GREEN}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                            style={{
                                                borderRadius: 999,
                                                paddingHorizontal: 12,
                                                paddingVertical: 7,
                                                flexDirection: "row",
                                                alignItems: "center",
                                                gap: 5,
                                            }}
                                        >
                                            <Ionicons
                                                name="chatbubble"
                                                size={12}
                                                color="#fff"
                                            />
                                            <Text className="text-[12px] font-bold text-white">
                                                Mensahe
                                            </Text>
                                        </LinearGradient>
                                    </View>
                                )}
                            </Pressable>
                        ))}
                        <SectionTitle
                            title="Mga Usapan"
                            color={PALETTE.forest}
                        />
                    </>
                )}

                {isLoadingConversations ? (
                    <ActivityIndicator
                        color={PALETTE.forest}
                        style={{ marginTop: 40 }}
                    />
                ) : visibleConversations.length === 0 ? (
                    <View className="items-center mt-10 px-8">
                        <View
                            className="w-[72px] h-[72px] rounded-full items-center justify-center mb-3"
                            style={{ backgroundColor: "rgba(62,123,79,0.12)" }}
                        >
                            <Ionicons
                                name={
                                    showSearchUI
                                        ? "search-outline"
                                        : activeFilter === "unread"
                                          ? "checkmark-done"
                                          : "chatbubbles-outline"
                                }
                                size={30}
                                color={PALETTE.forest}
                            />
                        </View>
                        <Text
                            className="text-[15px] font-extrabold text-center"
                            style={{ color: PALETTE.ink }}
                        >
                            {showSearchUI
                                ? "Walang nahanap na mensahe."
                                : activeFilter === "unread"
                                  ? "Nabasa mo na lahat!"
                                  : "Wala pang mensahe"}
                        </Text>
                        <Text
                            className="text-[12.5px] text-center mt-1"
                            style={{ color: PALETTE.muted }}
                        >
                            {showSearchUI
                                ? isSearching
                                    ? "Naghahanap ng gumagamit..."
                                    : "Subukan ang ibang pangalan."
                                : activeFilter === "unread"
                                  ? "Walang bagong mensahe sa ngayon."
                                  : "Maghanap ng gumagamit para magsimula ng usapan."}
                        </Text>
                        {!showSearchUI && activeFilter === "all" && (
                            <Pressable
                                onPress={() => searchInputRef.current?.focus()}
                                className="flex-row items-center gap-1.5 rounded-full px-4 py-2.5 mt-4"
                                style={{ backgroundColor: PALETTE.forest }}
                            >
                                <Ionicons name="search" size={14} color="#fff" />
                                <Text className="text-[13px] font-bold text-white">
                                    Maghanap ng kausap
                                </Text>
                            </Pressable>
                        )}
                    </View>
                ) : (
                    visibleConversations.map((item) => (
                        <Pressable
                            key={item.id}
                            onPress={() =>
                                router.push({
                                    pathname: "/(tabs)/chat/[conversationId]",
                                    params: { conversationId: item.id },
                                })
                            }
                        >
                            {({ pressed }) => (
                                <View
                                    style={[
                                        clayRaised,
                                        pressScale(pressed),
                                        {
                                            backgroundColor: item.isUnread
                                                ? "#F3F9F1"
                                                : "#fff",
                                            borderWidth: 1.5,
                                            borderColor: item.isUnread
                                                ? "rgba(62,123,79,0.22)"
                                                : "transparent",
                                        },
                                    ]}
                                    className="flex-row items-center gap-3 rounded-[22px] p-3"
                                >
                                    <Avatar
                                        name={item.otherName}
                                        photoURL={item.otherPhotoURL}
                                        size={item.isUnread ? 47 : 52}
                                        ring={item.isUnread}
                                    />

                                    <View className="flex-1">
                                        <View className="flex-row items-center gap-2">
                                            <View className="flex-1 flex-row items-center gap-1">
                                                <Text
                                                    className={`text-[15px] shrink ${item.isUnread ? "font-extrabold" : "font-bold"}`}
                                                    style={{ color: PALETTE.ink }}
                                                    numberOfLines={1}
                                                >
                                                    {item.otherName}
                                                </Text>
                                                {item.otherVerified && (
                                                    <VerifiedBadge />
                                                )}
                                            </View>
                                            <Text
                                                className={`text-[11.5px] ${item.isUnread ? "font-bold" : ""}`}
                                                style={{
                                                    color: item.isUnread
                                                        ? PALETTE.forest
                                                        : "#9C978C",
                                                }}
                                            >
                                                {formatListTime(
                                                    item.lastMessageAt,
                                                )}
                                            </Text>
                                        </View>

                                        <View className="flex-row items-center gap-2 mt-1">
                                            {item.isLastMine && (
                                                <Ionicons
                                                    name="arrow-undo"
                                                    size={12}
                                                    color="#B5AFA0"
                                                />
                                            )}
                                            <Text
                                                className={`flex-1 text-[13px] ${item.isUnread ? "font-semibold" : ""}`}
                                                style={{
                                                    color: item.isUnread
                                                        ? PALETTE.ink
                                                        : PALETTE.muted,
                                                }}
                                                numberOfLines={1}
                                            >
                                                {item.isLastMine && "Ikaw: "}
                                                {item.lastMessage}
                                            </Text>
                                            {item.isUnread && (
                                                <View
                                                    className="w-2.5 h-2.5 rounded-full"
                                                    style={{
                                                        backgroundColor:
                                                            PALETTE.forest,
                                                    }}
                                                />
                                            )}
                                        </View>
                                    </View>
                                </View>
                            )}
                        </Pressable>
                    ))
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
