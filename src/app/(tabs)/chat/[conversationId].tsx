import { db } from "@/lib/firebase";
import { useAuth } from "@/providers/auth-provider";
import { Ionicons } from "@expo/vector-icons";
import { router, useIsFocused, useLocalSearchParams } from "expo-router";
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

interface StoredMessage {
    id: string;
    senderId: string;
    message: string;
    dateSent: Timestamp;
}

function makeMessageId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function formatTime(timestamp: Timestamp | null): string {
    if (!timestamp) return "";
    return timestamp
        .toDate()
        .toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" });
}

export default function ConversationThread() {
    const { conversationId, targetUid, targetName, targetPhotoURL } =
        useLocalSearchParams<{
            conversationId: string;
            targetUid?: string;
            targetName?: string;
            targetPhotoURL?: string;
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
    const [messages, setMessages] = useState<StoredMessage[]>([]);
    const [isLoading, setIsLoading] = useState(!isNew);
    const [text, setText] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [otherUidFromConversation, setOtherUidFromConversation] = useState<
        string | null
    >(null);
    const [isUnreadForMe, setIsUnreadForMe] = useState(false);
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

    useEffect(() => {
        const timeout = setTimeout(
            () => scrollRef.current?.scrollToEnd({ animated: true }),
            50,
        );
        return () => clearTimeout(timeout);
    }, [messages]);

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

    // use the other user's latest name and photo
    useEffect(() => {
        const uidToWatch = isNew ? targetUid : otherUidFromConversation;
        if (!uidToWatch) return;

        return onSnapshot(doc(db, "users", uidToWatch), (snap) => {
            const data = snap.data();
            if (!data) return;
            setOtherName(data.username ?? "Gumagamit");
            setOtherPhotoURL(data.photoURL ?? null);
        });
    }, [isNew, targetUid, otherUidFromConversation]);

    return (
        <SafeAreaView className="flex-1 bg-[--main-white]" edges={["top"]}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <View className="flex-row items-center gap-3 px-4 py-3 border-b border-[#EDEAE2]">
                    <Pressable onPress={() => router.back()} className="p-1">
                        <Ionicons name="arrow-back" size={22} color="#1F2A1F" />
                    </Pressable>
                    <View className="w-9 h-9 rounded-full bg-[#5C7A5F] items-center justify-center overflow-hidden">
                        {otherPhotoURL ? (
                            <Image
                                source={{ uri: otherPhotoURL }}
                                className="w-full h-full"
                                resizeMode="cover"
                            />
                        ) : (
                            <Text className="text-white text-[11px] font-semibold">
                                {(otherName || "U").slice(0, 2).toUpperCase()}
                            </Text>
                        )}
                    </View>
                    <Text
                        className="flex-1 text-[15.5px] font-bold text-[#1F2A1F]"
                        numberOfLines={1}
                    >
                        {otherName}
                    </Text>
                </View>

                {isLoading ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator color="#2F5233" />
                    </View>
                ) : (
                    <ScrollView
                        ref={scrollRef}
                        contentContainerStyle={{ padding: 14, gap: 4 }}
                    >
                        {messages.length === 0 && (
                            <Text className="text-center text-[13px] text-[#9C978C] mt-10">
                                Magpadala ng mensahe para simulan ang usapan.
                            </Text>
                        )}
                        {messages.map((msg) => {
                            const isMine = msg.senderId === user?.uid;
                            return (
                                <View
                                    key={msg.id}
                                    className={`max-w-[75%] mb-1 ${isMine ? "self-end items-end" : "self-start items-start"}`}
                                >
                                    <View
                                        className={`px-3.5 py-2.5 rounded-[20px] ${
                                            isMine
                                                ? "bg-[#2F5233] rounded-br-md"
                                                : "bg-[#F0EDE6] rounded-bl-md"
                                        }`}
                                    >
                                        <Text
                                            className={`text-[14.5px] leading-5 ${isMine ? "text-white" : "text-[#1F2A1F]"}`}
                                        >
                                            {msg.message}
                                        </Text>
                                    </View>
                                    <Text className="text-[10.5px] text-[#9C978C] mt-1 mx-1">
                                        {formatTime(msg.dateSent)}
                                    </Text>
                                </View>
                            );
                        })}
                    </ScrollView>
                )}

                {error && (
                    <Text className="text-[12px] text-[#B23A2E] text-center px-4 pb-1">
                        {error}
                    </Text>
                )}

                <View className="flex-row items-end gap-2 px-4 py-3 border-t border-[#EDEAE2]">
                    <TextInput
                        value={text}
                        onChangeText={setText}
                        placeholder="Mag-type ng mensahe..."
                        placeholderTextColor="#9C978C"
                        multiline
                        className="flex-1 bg-[#F0EDE6] rounded-[22px] px-4 py-2.5 text-[15px] text-[#1F2A1F] max-h-[120px]"
                    />
                    <Pressable
                        onPress={handleSend}
                        disabled={!canSend}
                        className="w-11 h-11 rounded-full items-center justify-center"
                        style={{
                            backgroundColor: canSend ? "#2F5233" : "#E5E1D8",
                        }}
                    >
                        {isSending ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Ionicons
                                name="send"
                                size={18}
                                color={canSend ? "#fff" : "#9C978C"}
                            />
                        )}
                    </Pressable>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
