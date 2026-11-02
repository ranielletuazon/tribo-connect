import { clayRaised, pressScale } from "@/components/clay";
import {
    ActionButtons,
    BotText,
    FadeIn,
    SuggestionList,
    TopicGrid,
    TriboAvatar,
    TRIBO_MASCOT,
    TypingBubble,
} from "@/components/tribobot";
import { BARANGAY } from "@/constants/barangays";
import { CONTACT_EMAIL } from "@/constants/contact";
import { PALETTE } from "@/constants/palette";
import { useLanguage } from "@/hooks/use-language";
import { db } from "@/lib/firebase";
import {
    menuReply,
    replyForIntentId,
    replyForTopic,
    replyToText,
    textReply,
    topicsFor,
    typingDelay,
    welcomeReply,
    type BotReply,
    type Suggestion,
} from "@/lib/tribobot/engine";
import type {
    Bilingual,
    BotAction,
    BotContext,
    BotTopic,
} from "@/lib/tribobot/knowledge";
import { useAuth } from "@/providers/auth-provider";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect, useNavigation } from "expo-router";
import { doc, updateDoc } from "firebase/firestore";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Linking,
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

// the conversation only lives in this screen's state. it isn't saved
// anywhere and starts over when the app is closed

interface ChatItem {
    id: string;
    sender: "bot" | "user";
    text: Bilingual;
    // bot messages only: buttons, question lists and topic cards
    reply?: BotReply;
}

const GREEN: [string, string] = ["#56A06A", "#2F6540"];
const MESSAGE_MAX = 300;

let nextId = 0;
function makeId(): string {
    nextId += 1;
    return `${Date.now()}-${nextId}`;
}

export default function TriboBot() {
    const { user, profile } = useAuth();
    const { lang, t } = useLanguage();
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const scrollRef = useRef<ScrollView>(null);
    const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [items, setItems] = useState<ChatItem[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [text, setText] = useState("");
    const [isInputFocused, setIsInputFocused] = useState(false);
    const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

    const ctx: BotContext = useMemo(
        () => ({
            name: profile?.username ?? (lang === "en" ? "friend" : "kaibigan"),
            isVerified: profile?.isVerified === true,
            isAdmin: profile?.role === "admin",
        }),
        [profile?.username, profile?.isVerified, profile?.role, lang],
    );
    const topics = useMemo(() => topicsFor(ctx), [ctx]);

    // hide the tab bar while the chat is open, same as the chat screen.
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

    // Tribo "types" for a moment before every answer
    const botSays = useCallback((reply: BotReply) => {
        setIsTyping(true);
        if (typingTimer.current) clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => {
            setItems((prev) => [
                ...prev,
                { id: makeId(), sender: "bot", text: reply.text, reply },
            ]);
            setIsTyping(false);
            typingTimer.current = null;
        }, typingDelay(reply));
    }, []);

    const userSays = useCallback(
        (said: Bilingual, reply: BotReply) => {
            setItems((prev) => [
                ...prev,
                { id: makeId(), sender: "user", text: said },
            ]);
            botSays(reply);
        },
        [botSays],
    );

    // greet once, when the profile is ready so Tribo can use the name
    const hasGreeted = useRef(false);
    useEffect(() => {
        if (hasGreeted.current || !profile) return;
        hasGreeted.current = true;
        botSays(welcomeReply(ctx));
    }, [profile, ctx, botSays]);

    useEffect(
        () => () => {
            if (typingTimer.current) clearTimeout(typingTimer.current);
        },
        [],
    );

    const handleSend = () => {
        const typed = text.trim();
        if (!typed || isTyping) return;
        setText("");
        userSays({ tl: typed, en: typed }, replyToText(typed, ctx));
    };

    const handleSuggestion = (item: Suggestion) => {
        if (isTyping) return;
        const reply = replyForIntentId(item.intentId, ctx);
        if (reply) userSays(item.label, reply);
    };

    const handleTopic = (topic: BotTopic) => {
        if (isTyping) return;
        userSays(topic.label, replyForTopic(topic.id, ctx));
    };

    const handleMenu = () => {
        if (isTyping) return;
        userSays(
            { tl: "Ipakita ang mga paksa", en: "Show me the topics" },
            menuReply(),
        );
    };

    const handleRestart = () => {
        if (typingTimer.current) clearTimeout(typingTimer.current);
        setItems([]);
        setText("");
        botSays(welcomeReply(ctx));
    };

    const handleAction = async (action: BotAction) => {
        switch (action.kind) {
            case "route":
                router.push(action.route);
                return;
            case "call":
                Linking.openURL(`tel:${action.number.replace(/\s/g, "")}`);
                return;
            case "email":
                Linking.openURL(`mailto:${CONTACT_EMAIL}`);
                return;
            case "phone-settings":
                Linking.openSettings();
                return;
            case "language": {
                if (!user || isTyping) return;
                setItems((prev) => [
                    ...prev,
                    { id: makeId(), sender: "user", text: action.label },
                ]);
                try {
                    await updateDoc(doc(db, "users", user.uid), {
                        language: action.lang,
                    });
                    botSays(
                        textReply(
                            action.lang === "en"
                                ? {
                                      tl: "Sige! English na ang gagamitin natin. 👍",
                                      en: "Done! We'll use English from now on. 👍",
                                  }
                                : {
                                      tl: "Sige! Tagalog na ang gagamitin natin. 👍",
                                      en: "Done! We'll use Tagalog from now on. 👍",
                                  },
                        ),
                    );
                } catch (err) {
                    console.error("Change language error:", err);
                    botSays(
                        textReply({
                            tl: "Hindi napalitan ang wika. Pakisubukang muli sa Mga Setting.",
                            en: "The language wasn't changed. Please try again in Settings.",
                        }),
                    );
                }
            }
        }
    };

    // quick replies above the message box come from Tribo's latest answer
    const latestBot = [...items]
        .reverse()
        .find((item) => item.sender === "bot");
    const chips = !isTyping ? (latestBot?.reply?.chips ?? []) : [];
    const canSend = text.trim().length > 0 && !isTyping;

    return (
        <SafeAreaView
            className="flex-1"
            style={{ backgroundColor: PALETTE.cream }}
            edges={["top"]}
        >
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
                        accessibilityLabel={t("Bumalik", "Back")}
                        className="w-10 h-10 rounded-full bg-[#F0EDE6] items-center justify-center"
                    >
                        <Ionicons
                            name="arrow-back"
                            size={20}
                            color={PALETTE.ink}
                        />
                    </Pressable>
                    <TriboAvatar size={40} online />
                    <View className="flex-1">
                        <Text
                            className="text-[16px] font-extrabold"
                            style={{ color: PALETTE.ink }}
                        >
                            TriboBot
                        </Text>
                        <Text
                            className="text-[11.5px] font-semibold mt-0.5"
                            style={{
                                color: isTyping
                                    ? PALETTE.muted
                                    : PALETTE.forest,
                            }}
                        >
                            {isTyping
                                ? t("Nagta-type...", "Typing...")
                                : t(
                                      "Online · Laging handang tumulong",
                                      "Online · Always ready to help",
                                  )}
                        </Text>
                    </View>
                    <Pressable
                        onPress={handleRestart}
                        hitSlop={6}
                        accessibilityLabel={t("Bagong usapan", "New chat")}
                        className="w-10 h-10 rounded-full bg-[#F0EDE6] items-center justify-center"
                    >
                        <Ionicons
                            name="refresh"
                            size={19}
                            color={PALETTE.ink}
                        />
                    </Pressable>
                </View>

                <ScrollView
                    ref={scrollRef}
                    className="flex-1"
                    contentContainerStyle={{
                        paddingHorizontal: 14,
                        paddingTop: 16,
                        paddingBottom: 14,
                    }}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode={
                        Platform.OS === "ios" ? "interactive" : "on-drag"
                    }
                    showsVerticalScrollIndicator={false}
                    onContentSizeChange={() =>
                        scrollRef.current?.scrollToEnd({ animated: true })
                    }
                >
                    {/* Intro */}
                    <View className="items-center mb-2">
                        <LinearGradient
                            colors={["#E9F4E4", "#CFE7C8"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={[
                                clayRaised,
                                {
                                    width: 96,
                                    height: 96,
                                    borderRadius: 48,
                                    alignItems: "center",
                                    justifyContent: "center",
                                    borderWidth: 3,
                                    borderColor: "#fff",
                                },
                            ]}
                        >
                            <Image
                                source={TRIBO_MASCOT}
                                style={{ width: 88, height: 88 }}
                                resizeMode="contain"
                            />
                        </LinearGradient>
                        <Text
                            className="text-[18px] font-extrabold mt-3"
                            style={{ color: PALETTE.ink }}
                        >
                            Tribo
                        </Text>
                        <Text
                            className="text-[12.5px] text-center mt-1 px-8 leading-[18px]"
                            style={{ color: PALETTE.muted }}
                        >
                            {t(
                                `Ang iyong katulong sa TriboConnect para sa Barangay ${BARANGAY}.`,
                                `Your TriboConnect helper for Barangay ${BARANGAY}.`,
                            )}
                        </Text>
                        <View className="flex-row items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full bg-[#F3EFE7]">
                            <Ionicons
                                name="information-circle"
                                size={13}
                                color="#9C978C"
                            />
                            <Text className="text-[11px] text-[#9C978C]">
                                {t(
                                    "Automated na sagot · Sa emergency, tumawag agad",
                                    "Automated answers · In an emergency, call right away",
                                )}
                            </Text>
                        </View>
                    </View>

                    {items.map((item, i) => {
                        const prev = items[i - 1];
                        const next = items[i + 1];
                        const joinsPrev = prev?.sender === item.sender;
                        const joinsNext =
                            next?.sender === item.sender ||
                            (item.sender === "bot" && !next && isTyping);

                        if (item.sender === "user") {
                            return (
                                <FadeIn key={item.id}>
                                    <View
                                        className="flex-row justify-end"
                                        style={{
                                            marginTop: joinsPrev ? 3 : 14,
                                        }}
                                    >
                                        <LinearGradient
                                            colors={GREEN}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                            style={{
                                                maxWidth: "80%",
                                                borderRadius: 20,
                                                borderBottomRightRadius: 4,
                                                paddingHorizontal: 14,
                                                paddingVertical: 10,
                                            }}
                                        >
                                            <Text className="text-[14.5px] leading-[21px] text-white">
                                                {t(item.text.tl, item.text.en)}
                                            </Text>
                                        </LinearGradient>
                                    </View>
                                </FadeIn>
                            );
                        }

                        const reply = item.reply;
                        return (
                            <FadeIn key={item.id}>
                                <View
                                    className="flex-row items-end gap-2"
                                    style={{ marginTop: joinsPrev ? 3 : 14 }}
                                >
                                    {/* Tribo's picture sits beside the last of its messages */}
                                    {joinsNext ? (
                                        <View style={{ width: 30 }} />
                                    ) : (
                                        <TriboAvatar size={30} />
                                    )}
                                    <View style={{ flex: 1, maxWidth: "86%" }}>
                                        <View
                                            className="self-start bg-white px-3.5 py-2.5 border border-[#EDE8DE]"
                                            style={{
                                                borderRadius: 20,
                                                borderBottomLeftRadius: 4,
                                            }}
                                        >
                                            <BotText
                                                text={t(
                                                    item.text.tl,
                                                    item.text.en,
                                                )}
                                                color={PALETTE.ink}
                                            />
                                        </View>
                                        {reply && reply.list.length > 0 && (
                                            <SuggestionList
                                                items={reply.list}
                                                disabled={isTyping}
                                                onPress={handleSuggestion}
                                            />
                                        )}
                                        {reply && reply.actions.length > 0 && (
                                            <ActionButtons
                                                actions={reply.actions}
                                                disabled={isTyping}
                                                onPress={handleAction}
                                            />
                                        )}
                                        {reply?.showTopics && (
                                            <TopicGrid
                                                topics={topics}
                                                disabled={isTyping}
                                                onPress={handleTopic}
                                            />
                                        )}
                                    </View>
                                </View>
                            </FadeIn>
                        );
                    })}

                    {isTyping && <TypingBubble />}
                </ScrollView>

                {/* Quick replies */}
                {chips.length > 0 && (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        className="grow-0"
                        contentContainerStyle={{
                            paddingHorizontal: 14,
                            paddingBottom: 8,
                            gap: 8,
                        }}
                    >
                        {chips.map((chip) => (
                            <Pressable
                                key={chip.intentId}
                                onPress={() => handleSuggestion(chip)}
                            >
                                {({ pressed }) => (
                                    <View
                                        className="rounded-full px-3.5 py-2 border"
                                        style={[
                                            pressScale(pressed),
                                            {
                                                borderColor:
                                                    "rgba(62,123,79,0.3)",
                                                backgroundColor: "#fff",
                                            },
                                        ]}
                                    >
                                        <Text
                                            className="text-[12.5px] font-semibold"
                                            style={{ color: PALETTE.forest }}
                                        >
                                            {t(chip.label.tl, chip.label.en)}
                                        </Text>
                                    </View>
                                )}
                            </Pressable>
                        ))}
                    </ScrollView>
                )}

                {/* Composer. the bottom inset only matters while the keyboard
                    is closed, the keyboard already covers that area */}
                <View
                    className="flex-row items-end gap-2 px-3 pt-1"
                    style={{
                        paddingBottom: isKeyboardOpen
                            ? 10
                            : Math.max(insets.bottom, 10),
                    }}
                >
                    <Pressable
                        onPress={handleMenu}
                        disabled={isTyping}
                        accessibilityRole="button"
                        accessibilityLabel={t("Mga paksa", "Topics")}
                    >
                        {({ pressed }) => (
                            <View
                                className="w-[46px] h-[46px] rounded-full bg-white items-center justify-center"
                                style={[clayRaised, pressScale(pressed)]}
                            >
                                <Ionicons
                                    name="grid"
                                    size={19}
                                    color={PALETTE.forest}
                                />
                            </View>
                        )}
                    </Pressable>
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
                        className="flex-1 flex-row items-end gap-2 bg-white rounded-[26px] pl-4 pr-1.5 py-1"
                    >
                        <TextInput
                            value={text}
                            onChangeText={setText}
                            onFocus={() => setIsInputFocused(true)}
                            onBlur={() => setIsInputFocused(false)}
                            onSubmitEditing={handleSend}
                            submitBehavior="submit"
                            returnKeyType="send"
                            placeholder={t(
                                "Magtanong kay Tribo...",
                                "Ask Tribo something...",
                            )}
                            placeholderTextColor="#B5AFA0"
                            maxLength={MESSAGE_MAX}
                            className="flex-1 text-[15px]"
                            style={{
                                color: PALETTE.ink,
                                paddingTop: 10,
                                paddingBottom: 10,
                            }}
                        />
                        <Pressable
                            onPress={handleSend}
                            disabled={!canSend}
                            accessibilityRole="button"
                            accessibilityLabel={t("Ipadala", "Send")}
                        >
                            {({ pressed }) => (
                                <LinearGradient
                                    colors={
                                        canSend ? GREEN : ["#ECE8E0", "#ECE8E0"]
                                    }
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={{
                                        width: 38,
                                        height: 38,
                                        borderRadius: 19,
                                        alignItems: "center",
                                        justifyContent: "center",
                                        transform: [
                                            { scale: pressed ? 0.9 : 1 },
                                        ],
                                    }}
                                >
                                    <Ionicons
                                        name="send"
                                        size={16}
                                        color={canSend ? "#fff" : "#B5AFA0"}
                                        style={{ marginLeft: 2 }}
                                    />
                                </LinearGradient>
                            )}
                        </Pressable>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
