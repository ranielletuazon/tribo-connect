import { Avatar } from "@/components/avatar";
import {
    BackgroundBlobs,
    clayRaised,
    pressScale,
} from "@/components/clay";
import { VerifiedBadge } from "@/components/verified-badge";
import { PALETTE } from "@/constants/palette";
import { formatClock, formatDayLabel, isSameDay } from "@/lib/chat-time";
import { db } from "@/lib/firebase";
import { useAuth } from "@/providers/auth-provider";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
    router,
    useFocusEffect,
    useIsFocused,
    useLocalSearchParams,
    useNavigation,
} from "expo-router";
import {
    arrayRemove,
    arrayUnion,
    collection,
    doc,
    onSnapshot,
    serverTimestamp,
    Timestamp,
    updateDoc,
    writeBatch,
} from "firebase/firestore";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import {
    SafeAreaView,
    useSafeAreaInsets,
} from "react-native-safe-area-context";

interface StoredMessage {
    id: string;
    senderId: string;
    message: string;
    dateSent: Timestamp;
}

function makeMessageId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const GREEN: [string, string] = ["#56A06A", "#2F6540"];
const MESSAGE_MAX = 1000;
const QUICK_STARTERS = ["Kumusta! 👋", "Magandang araw po!", "May tanong po ako."];

// messages from the same person within 5 minutes are shown as one group
const GROUP_GAP_MS = 5 * 60 * 1000;

function isSameGroup(a: StoredMessage, b: StoredMessage): boolean {
    return (
        a.senderId === b.senderId &&
        b.dateSent.toMillis() - a.dateSent.toMillis() < GROUP_GAP_MS
    );
}

export default function ConversationThread() {
    const {
        conversationId,
        targetUid,
        targetName,
        targetPhotoURL,
        targetVerified,
    } = useLocalSearchParams<{
        conversationId: string;
        targetUid?: string;
        targetName?: string;
        targetPhotoURL?: string;
        targetVerified?: string;
    }>();
    const { user, profile } = useAuth();

    // the current conversation id. for a new chat we just update this after
    // creating it, because router.replace would reload the whole screen
    const [activeConversationId, setActiveConversationId] =
        useState(conversationId);

    useEffect(() => {
        setActiveConversationId(conversationId);
    }, [conversationId]);

    const isNew = activeConversationId === "new";

    const [otherName, setOtherName] = useState(targetName ?? "");
    const [otherPhotoURL, setOtherPhotoURL] = useState<string | null>(
        targetPhotoURL || null,
    );
    const [otherVerified, setOtherVerified] = useState(
        targetVerified === "1",
    );
    const [messages, setMessages] = useState<StoredMessage[]>([]);
    const [isLoading, setIsLoading] = useState(!isNew);
    const [text, setText] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [otherUidFromConversation, setOtherUidFromConversation] = useState<
        string | null
    >(null);
    const [isUnreadForMe, setIsUnreadForMe] = useState(false);
    // still in the unread list means the other user hasn't opened it yet
    const [isUnreadForOther, setIsUnreadForOther] = useState(false);
    const [otherBarangay, setOtherBarangay] = useState<string | null>(null);
    const [isInputFocused, setIsInputFocused] = useState(false);
    const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
    const insets = useSafeAreaInsets();
    const inputRef = useRef<TextInput>(null);
    const hasScrolledRef = useRef(false);
    const navigation = useNavigation();

    // hide the tab bar while this chat is open, otherwise it hides and comes
    // back every time the keyboard opens and closes and the screen jumps.
    // the style put back here must match tabBarStyle in (tabs)/_layout.tsx
    useFocusEffect(
        useCallback(() => {
            const tabs = navigation.getParent();
            tabs?.setOptions({ tabBarStyle: { display: "none" } });
            return () =>
                tabs?.setOptions({
                    tabBarStyle: {
                        paddingTop: 10,
                        paddingBottom: insets.bottom + 8,
                        height: 48 + insets.bottom,
                    },
                });
        }, [navigation, insets.bottom]),
    );
    const isFocused = useIsFocused();
    const scrollRef = useRef<ScrollView>(null);

    // one listener for the whole conversation (other user info, messages and my unread flag)
    useEffect(() => {
        if (isNew || !user || !activeConversationId) return;
        const convRef = doc(db, "conversations", activeConversationId);

        return onSnapshot(convRef, (snap) => {
            const data = snap.data();
            if (!data) return;

            const other = (data.participantIds as string[]).find(
                (id: string) => id !== user.uid,
            );
            if (other) {
                setOtherUidFromConversation(other);
            }
            if (other) {
                const info = data.participantsInfo?.[other] ?? {};
                setOtherName(info.name ?? "Gumagamit");
                setOtherPhotoURL(info.photoURL ?? null);
            }

            setMessages(data.messages ?? []);
            setIsLoading(false);
            setIsUnreadForMe((data.unread ?? []).includes(user.uid));
            setIsUnreadForOther(
                !!other && (data.unread ?? []).includes(other),
            );
        });
    }, [isNew, activeConversationId, user]);

    // only mark as read while this screen is actually on screen. the chat tab
    // stays mounted in the background, so the listener above keeps running
    useEffect(() => {
        if (isNew || !user || !isFocused || !isUnreadForMe || !activeConversationId)
            return;
        updateDoc(doc(db, "conversations", activeConversationId), {
            unread: arrayRemove(user.uid),
        }).catch((err) => console.error("Clear unread error:", err));
    }, [isNew, isFocused, isUnreadForMe, activeConversationId, user]);

    // keep the latest message in view when the keyboard opens. iOS tells us
    // before it animates in, Android only after it's shown
    useEffect(() => {
        const showEvent =
            Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
        const hideEvent =
            Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

        const showSub = Keyboard.addListener(showEvent, () => {
            setIsKeyboardOpen(true);
            setTimeout(
                () => scrollRef.current?.scrollToEnd({ animated: true }),
                Platform.OS === "ios" ? 250 : 50,
            );
        });
        const hideSub = Keyboard.addListener(hideEvent, () =>
            setIsKeyboardOpen(false),
        );
        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    const canSend = text.trim().length > 0 && !isSending;

    const handleSend = async () => {
        if (!canSend || !user) return;
        const toSend = text.trim();
        setText("");
        setError(null);
        setIsSending(true);

        const newMessage: StoredMessage = {
            id: makeMessageId(),
            senderId: user.uid,
            message: toSend,
            dateSent: Timestamp.now(), // serverTimestamp() doesn't work inside arrays
        };

        try {
            if (isNew) {
                if (!profile || !targetUid)
                    throw new Error("Missing user or target");

                const convRef = doc(collection(db, "conversations"));
                const batch = writeBatch(db);

                batch.set(convRef, {
                    participantIds: [user.uid, targetUid],
                    participantsInfo: {
                        [user.uid]: {
                            name: profile.username,
                            photoURL: profile.photoURL ?? null,
                        },
                        [targetUid]: {
                            name: targetName,
                            photoURL: targetPhotoURL || null,
                        },
                    },
                    lastMessage: toSend,
                    lastMessageSenderId: user.uid,
                    lastMessageAt: serverTimestamp(),
                    unread: [targetUid],
                    messages: [newMessage],
                    createdAt: serverTimestamp(),
                });
                batch.update(doc(db, "users", user.uid), {
                    [`messages.${targetUid}`]: convRef.id,
                });
                batch.update(doc(db, "users", targetUid), {
                    [`messages.${user.uid}`]: convRef.id,
                });

                await batch.commit();

                setActiveConversationId(convRef.id);
            } else {
                const recipientUid = otherUidFromConversation ?? targetUid;
                if (!recipientUid)
                    throw new Error("Missing recipient for conversation");

                await updateDoc(doc(db, "conversations", activeConversationId), {
                    messages: arrayUnion(newMessage),
                    lastMessage: toSend,
                    lastMessageSenderId: user.uid,
                    lastMessageAt: serverTimestamp(),
                    unread: arrayUnion(recipientUid),
                });
            }
        } catch (err) {
            console.error("Send message error:", err);
            setText(toSend);
            setError("Hindi naipadala ang mensahe. Pakisubukang muli.");
        } finally {
            setIsSending(false);
        }
    };

    // use the other user's latest name, photo and verified status
    useEffect(() => {
        const uidToWatch = isNew ? targetUid : otherUidFromConversation;
        if (!uidToWatch) return;

        return onSnapshot(doc(db, "users", uidToWatch), (snap) => {
            const data = snap.data();
            if (!data) return;
            setOtherName(data.username ?? "Gumagamit");
            setOtherPhotoURL(data.photoURL ?? null);
            setOtherVerified(data.isVerified === true);
            setOtherBarangay(data.barangay ?? null);
        });
    }, [isNew, targetUid, otherUidFromConversation]);

    const lastMessage = messages[messages.length - 1];

    return (
        <SafeAreaView
            className="flex-1"
            style={{ backgroundColor: PALETTE.cream }}
            edges={["top"]}
        >
            <BackgroundBlobs
                colors={[PALETTE.leaf, PALETTE.gold]}
                opacity={[0.16, 0.12]}
            />

            {/* "padding" on both platforms. Android draws edge-to-edge, so the
                screen isn't resized for the keyboard anymore and the message
                box would end up behind it. if the system does resize, there's
                no overlap left and this adds nothing */}
            <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
                {/* Header */}
                <View
                    className="flex-row items-center gap-3 px-4 py-3 bg-white"
                    style={{
                        borderBottomLeftRadius: 26,
                        borderBottomRightRadius: 26,
                        ...clayRaised,
                    }}
                >
                    <Pressable
                        onPress={() => router.back()}
                        hitSlop={6}
                        className="w-10 h-10 rounded-full bg-[#F0EDE6] items-center justify-center"
                    >
                        <Ionicons
                            name="arrow-back"
                            size={20}
                            color={PALETTE.ink}
                        />
                    </Pressable>
                    <Avatar
                        name={otherName}
                        photoURL={otherPhotoURL}
                        size={40}
                        ring
                    />
                    <View className="flex-1">
                        <View className="flex-row items-center gap-1">
                            <Text
                                className="text-[16px] font-extrabold shrink"
                                style={{ color: PALETTE.ink }}
                                numberOfLines={1}
                            >
                                {otherName}
                            </Text>
                            {otherVerified && <VerifiedBadge size={15} />}
                        </View>
                        {otherBarangay && (
                            <View className="flex-row items-center gap-1 mt-0.5">
                                <Ionicons
                                    name="location"
                                    size={11}
                                    color={PALETTE.forest}
                                />
                                <Text
                                    className="text-[11.5px] font-semibold"
                                    style={{ color: PALETTE.forest }}
                                    numberOfLines={1}
                                >
                                    Barangay {otherBarangay}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                {isLoading ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator color={PALETTE.forest} />
                    </View>
                ) : messages.length === 0 ? (
                    // new conversation, show who you're about to message
                    <ScrollView
                        contentContainerClassName="flex-grow justify-center px-6 py-6"
                        keyboardShouldPersistTaps="handled"
                        keyboardDismissMode="on-drag"
                    >
                        <View
                            style={clayRaised}
                            className="bg-white rounded-[28px] items-center px-6 py-7"
                        >
                            <Avatar
                                name={otherName}
                                photoURL={otherPhotoURL}
                                size={80}
                                ring
                            />
                            <View className="flex-row items-center gap-1 mt-3">
                                <Text
                                    className="text-[18px] font-extrabold"
                                    style={{ color: PALETTE.ink }}
                                >
                                    {otherName}
                                </Text>
                                {otherVerified && <VerifiedBadge size={17} />}
                            </View>
                            {otherBarangay && (
                                <Text className="text-[12.5px] text-[#9C978C] mt-0.5">
                                    Barangay {otherBarangay} · Porac
                                </Text>
                            )}
                            <Text
                                className="text-[13px] text-center mt-3"
                                style={{ color: PALETTE.muted }}
                            >
                                Magpadala ng mensahe para simulan ang usapan.
                            </Text>

                            <View className="flex-row flex-wrap justify-center gap-2 mt-4">
                                {QUICK_STARTERS.map((starter) => (
                                    <Pressable
                                        key={starter}
                                        onPress={() => {
                                            setText(starter);
                                            inputRef.current?.focus();
                                        }}
                                    >
                                        {({ pressed }) => (
                                            <View
                                                className="rounded-full px-3.5 py-2 border"
                                                style={[
                                                    pressScale(pressed),
                                                    {
                                                        borderColor:
                                                            "rgba(62,123,79,0.3)",
                                                        backgroundColor:
                                                            "rgba(62,123,79,0.07)",
                                                    },
                                                ]}
                                            >
                                                <Text
                                                    className="text-[12.5px] font-semibold"
                                                    style={{
                                                        color: PALETTE.forest,
                                                    }}
                                                >
                                                    {starter}
                                                </Text>
                                            </View>
                                        )}
                                    </Pressable>
                                ))}
                            </View>
                        </View>
                    </ScrollView>
                ) : (
                    <ScrollView
                        ref={scrollRef}
                        contentContainerStyle={{
                            paddingHorizontal: 12,
                            paddingTop: 8,
                            paddingBottom: 12,
                        }}
                        keyboardShouldPersistTaps="handled"
                        keyboardDismissMode={
                            Platform.OS === "ios" ? "interactive" : "on-drag"
                        }
                        showsVerticalScrollIndicator={false}
                        // jump straight to the latest message when the chat
                        // opens, then animate for each new one
                        onContentSizeChange={() => {
                            scrollRef.current?.scrollToEnd({
                                animated: hasScrolledRef.current,
                            });
                            hasScrolledRef.current = true;
                        }}
                    >
                        {messages.map((msg, i) => {
                            const isMine = msg.senderId === user?.uid;
                            const prev = messages[i - 1];
                            const next = messages[i + 1];
                            const newDay =
                                !prev || !isSameDay(prev.dateSent, msg.dateSent);
                            const joinsPrev = !newDay && isSameGroup(prev, msg);
                            const joinsNext =
                                !!next &&
                                isSameDay(msg.dateSent, next.dateSent) &&
                                isSameGroup(msg, next);
                            const isLatestMine =
                                isMine && msg.id === lastMessage?.id;

                            // round everywhere except where bubbles in the
                            // same group touch, and a small "tail" corner
                            // on the last one
                            const sideTop = joinsPrev ? 6 : 20;
                            const sideBottom = joinsNext ? 6 : 4;
                            const bubbleShape = isMine
                                ? {
                                      borderRadius: 20,
                                      borderTopRightRadius: sideTop,
                                      borderBottomRightRadius: sideBottom,
                                  }
                                : {
                                      borderRadius: 20,
                                      borderTopLeftRadius: sideTop,
                                      borderBottomLeftRadius: sideBottom,
                                  };

                            return (
                                <View key={msg.id}>
                                    {newDay && (
                                        <View className="flex-row items-center gap-3 my-4 px-6">
                                            <View className="flex-1 h-px bg-[#E6E0D4]" />
                                            <Text className="text-[11px] font-bold text-[#9C978C] tracking-wide">
                                                {formatDayLabel(msg.dateSent)}
                                            </Text>
                                            <View className="flex-1 h-px bg-[#E6E0D4]" />
                                        </View>
                                    )}

                                    <View
                                        className={`flex-row items-end gap-2 ${isMine ? "justify-end" : "justify-start"}`}
                                        style={{ marginTop: joinsPrev ? 2 : 10 }}
                                    >
                                        {/* the other user's photo sits beside their last message in a group */}
                                        {!isMine &&
                                            (joinsNext ? (
                                                <View style={{ width: 30 }} />
                                            ) : (
                                                <Avatar
                                                    name={otherName}
                                                    photoURL={otherPhotoURL}
                                                    size={30}
                                                />
                                            ))}

                                        <View
                                            className={`max-w-[76%] ${isMine ? "items-end" : "items-start"}`}
                                        >
                                            {isMine ? (
                                                <LinearGradient
                                                    colors={GREEN}
                                                    start={{ x: 0, y: 0 }}
                                                    end={{ x: 1, y: 1 }}
                                                    style={[
                                                        bubbleShape,
                                                        {
                                                            paddingHorizontal: 14,
                                                            paddingVertical: 10,
                                                        },
                                                    ]}
                                                >
                                                    <Text
                                                        className="text-[15px] leading-[21px] text-white"
                                                        selectable
                                                    >
                                                        {msg.message}
                                                    </Text>
                                                </LinearGradient>
                                            ) : (
                                                <View
                                                    style={[
                                                        bubbleShape,
                                                        {
                                                            paddingHorizontal: 14,
                                                            paddingVertical: 10,
                                                            backgroundColor:
                                                                "#fff",
                                                            borderWidth: 1,
                                                            borderColor:
                                                                "#EDE8DE",
                                                        },
                                                    ]}
                                                >
                                                    <Text
                                                        className="text-[15px] leading-[21px]"
                                                        style={{
                                                            color: PALETTE.ink,
                                                        }}
                                                        selectable
                                                    >
                                                        {msg.message}
                                                    </Text>
                                                </View>
                                            )}

                                            {!joinsNext && (
                                                <View className="flex-row items-center gap-1 mt-1 mx-1">
                                                    <Text className="text-[10.5px] text-[#9C978C]">
                                                        {formatClock(
                                                            msg.dateSent,
                                                        )}
                                                    </Text>
                                                    {isLatestMine && (
                                                        <>
                                                            <Ionicons
                                                                name={
                                                                    isUnreadForOther
                                                                        ? "checkmark"
                                                                        : "checkmark-done"
                                                                }
                                                                size={13}
                                                                color={
                                                                    isUnreadForOther
                                                                        ? "#9C978C"
                                                                        : PALETTE.forest
                                                                }
                                                            />
                                                            <Text
                                                                className="text-[10.5px] font-semibold"
                                                                style={{
                                                                    color: isUnreadForOther
                                                                        ? "#9C978C"
                                                                        : PALETTE.forest,
                                                                }}
                                                            >
                                                                {isUnreadForOther
                                                                    ? "Naipadala"
                                                                    : "Nakita"}
                                                            </Text>
                                                        </>
                                                    )}
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                </View>
                            );
                        })}
                    </ScrollView>
                )}

                {error && (
                    <View
                        className="flex-row items-center gap-2 mx-4 mb-2 rounded-2xl px-3.5 py-2.5 border"
                        style={{
                            backgroundColor: "rgba(192,57,43,0.08)",
                            borderColor: "rgba(192,57,43,0.25)",
                        }}
                    >
                        <Ionicons name="alert-circle" size={16} color="#C0392B" />
                        <Text className="flex-1 text-[12.5px] text-[#C0392B]">
                            {error}
                        </Text>
                    </View>
                )}

                {/* Composer. the bottom inset only matters while the keyboard
                    is closed, the keyboard already covers that area */}
                <View
                    className="px-3 pt-2"
                    style={{
                        paddingBottom: isKeyboardOpen
                            ? 10
                            : Math.max(insets.bottom, 10),
                    }}
                >
                    <View
                        style={[
                            clayRaised,
                            {
                                borderWidth: 1.5,
                                borderColor: isInputFocused
                                    ? "rgba(62,123,79,0.45)"
                                    : "transparent",
                            },
                        ]}
                        className="flex-row items-end gap-2 bg-white rounded-[26px] pl-4 pr-1.5 py-1.5"
                    >
                        <TextInput
                            ref={inputRef}
                            value={text}
                            onChangeText={setText}
                            onFocus={() => setIsInputFocused(true)}
                            onBlur={() => setIsInputFocused(false)}
                            placeholder="Mag-type ng mensahe..."
                            placeholderTextColor="#B5AFA0"
                            multiline
                            maxLength={MESSAGE_MAX}
                            textAlignVertical="center"
                            className="flex-1 text-[15px] max-h-[120px]"
                            style={{
                                color: PALETTE.ink,
                                paddingTop: 9,
                                paddingBottom: 9,
                            }}
                        />
                        <Pressable
                            onPress={handleSend}
                            disabled={!canSend}
                            accessibilityRole="button"
                            accessibilityLabel="Ipadala"
                        >
                            {({ pressed }) => (
                                <LinearGradient
                                    colors={
                                        canSend
                                            ? GREEN
                                            : ["#ECE8E0", "#ECE8E0"]
                                    }
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 20,
                                        alignItems: "center",
                                        justifyContent: "center",
                                        transform: [
                                            { scale: pressed ? 0.9 : 1 },
                                        ],
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
                                            size={17}
                                            color={
                                                canSend ? "#fff" : "#B5AFA0"
                                            }
                                            style={{ marginLeft: 2 }}
                                        />
                                    )}
                                </LinearGradient>
                            )}
                        </Pressable>
                    </View>
                    {text.length > MESSAGE_MAX - 100 && (
                        <Text className="text-[10.5px] text-[#9C978C] text-right mt-1 mr-3">
                            {text.length}/{MESSAGE_MAX}
                        </Text>
                    )}
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
