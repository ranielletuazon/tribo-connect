import { clayRaised, pressScale } from "@/components/clay";
import { PALETTE } from "@/constants/palette";
import { useLanguage } from "@/hooks/use-language";
import type { Suggestion } from "@/lib/tribobot/engine";
import type { BotAction, BotTopic } from "@/lib/tribobot/knowledge";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, type ReactNode } from "react";
import { Animated, Easing, Image, Pressable, Text, View } from "react-native";

// the pieces of the TriboBot chat screen

export const TRIBO_MASCOT = require("../../assets/images/triboAI.png");

const GREEN: [string, string] = ["#56A06A", "#2F6540"];
const RED: [string, string] = ["#F0624D", "#B8321F"];

// the round mascot picture beside Tribo's messages and in the header
export function TriboAvatar({
    size,
    online = false,
}: {
    size: number;
    online?: boolean;
}) {
    return (
        <View style={{ width: size, height: size }}>
            <View
                className="items-center justify-center overflow-hidden"
                style={{
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: "#E9F4E4",
                    borderWidth: 1.5,
                    borderColor: "#fff",
                }}
            >
                <Image
                    source={TRIBO_MASCOT}
                    style={{ width: size * 0.95, height: size * 0.95 }}
                    resizeMode="contain"
                />
            </View>
            {online && (
                <View
                    className="absolute rounded-full border-2 border-white"
                    style={{
                        width: size * 0.3,
                        height: size * 0.3,
                        right: -1,
                        bottom: -1,
                        backgroundColor: "#3FBF5F",
                    }}
                />
            )}
        </View>
    );
}

// fades and slides each new message in
export function FadeIn({ children }: { children: ReactNode }) {
    const progress = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(progress, {
            toValue: 1,
            duration: 260,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        }).start();
    }, [progress]);

    return (
        <Animated.View
            style={{
                opacity: progress,
                transform: [
                    {
                        translateY: progress.interpolate({
                            inputRange: [0, 1],
                            outputRange: [10, 0],
                        }),
                    },
                ],
            }}
        >
            {children}
        </Animated.View>
    );
}

function Dot({ delay }: { delay: number }) {
    const progress = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.delay(delay),
                Animated.timing(progress, {
                    toValue: 1,
                    duration: 300,
                    easing: Easing.out(Easing.quad),
                    useNativeDriver: true,
                }),
                Animated.timing(progress, {
                    toValue: 0,
                    duration: 300,
                    easing: Easing.in(Easing.quad),
                    useNativeDriver: true,
                }),
                // wait for the other dots so they bounce one after another
                Animated.delay(600 - delay),
            ]),
        );
        loop.start();
        return () => loop.stop();
    }, [progress, delay]);

    return (
        <Animated.View
            className="w-2 h-2 rounded-full"
            style={{
                backgroundColor: PALETTE.sage,
                opacity: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.35, 1],
                }),
                transform: [
                    {
                        translateY: progress.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, -4],
                        }),
                    },
                ],
            }}
        />
    );
}

// "Tribo is typing" bubble
export function TypingBubble() {
    return (
        <View className="flex-row items-end gap-2 mt-3">
            <TriboAvatar size={30} />
            <View
                className="flex-row items-center gap-1.5 bg-white px-4 py-4 border border-[#EDE8DE]"
                style={{
                    borderRadius: 20,
                    borderBottomLeftRadius: 4,
                }}
            >
                <Dot delay={0} />
                <Dot delay={150} />
                <Dot delay={300} />
            </View>
        </View>
    );
}

// message text where **this** is shown in bold
export function BotText({ text, color }: { text: string; color: string }) {
    const parts = text.split("**");
    return (
        <Text className="text-[14.5px] leading-[21px]" style={{ color }}>
            {parts.map((part, i) =>
                i % 2 === 1 ? (
                    <Text key={i} className="font-bold">
                        {part}
                    </Text>
                ) : (
                    <Text key={i}>{part}</Text>
                ),
            )}
        </Text>
    );
}

// the topic cards in the welcome and menu messages
export function TopicGrid({
    topics,
    disabled,
    onPress,
}: {
    topics: BotTopic[];
    disabled: boolean;
    onPress: (topic: BotTopic) => void;
}) {
    const { t } = useLanguage();

    return (
        <View className="flex-row flex-wrap justify-between mt-2">
            {topics.map((topic) => (
                <Pressable
                    key={topic.id}
                    disabled={disabled}
                    onPress={() => onPress(topic)}
                    accessibilityRole="button"
                    style={{ width: "48.5%", marginBottom: 8 }}
                >
                    {({ pressed }) => (
                        <View
                            className="bg-white rounded-[20px] p-3 border border-[#EFE9DE]"
                            style={[clayRaised, pressScale(pressed)]}
                        >
                            <LinearGradient
                                colors={topic.colors}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 12,
                                    alignItems: "center",
                                    justifyContent: "center",
                                    marginBottom: 8,
                                }}
                            >
                                <Ionicons
                                    name={topic.icon}
                                    size={18}
                                    color="#fff"
                                />
                            </LinearGradient>
                            <Text
                                className="text-[13.5px] font-extrabold"
                                style={{ color: PALETTE.ink }}
                                numberOfLines={1}
                            >
                                {t(topic.label.tl, topic.label.en)}
                            </Text>
                            <Text
                                className="text-[11px] mt-0.5"
                                style={{ color: PALETTE.muted }}
                                numberOfLines={1}
                            >
                                {t(topic.description.tl, topic.description.en)}
                            </Text>
                        </View>
                    )}
                </Pressable>
            ))}
        </View>
    );
}

// a list of questions inside a message, e.g. a topic's common questions
export function SuggestionList({
    items,
    disabled,
    onPress,
}: {
    items: Suggestion[];
    disabled: boolean;
    onPress: (item: Suggestion) => void;
}) {
    const { t } = useLanguage();

    return (
        <View
            className="bg-white rounded-[20px] overflow-hidden mt-2 border border-[#EFE9DE]"
            style={clayRaised}
        >
            {items.map((item, i) => (
                <Pressable
                    key={item.intentId}
                    disabled={disabled}
                    onPress={() => onPress(item)}
                    accessibilityRole="button"
                    style={({ pressed }) => ({
                        backgroundColor: pressed ? "#F3F9F1" : "transparent",
                    })}
                >
                    <View className="flex-row items-center gap-2.5 px-3.5 py-3">
                        <Ionicons
                            name="chatbubble-ellipses-outline"
                            size={15}
                            color={PALETTE.forest}
                        />
                        <Text
                            className="flex-1 text-[13.5px] font-semibold"
                            style={{ color: PALETTE.ink }}
                        >
                            {t(item.label.tl, item.label.en)}
                        </Text>
                        <Ionicons
                            name="chevron-forward"
                            size={14}
                            color="#C4BFB2"
                        />
                    </View>
                    {i < items.length - 1 && (
                        <View className="h-px bg-[#F1ECE3] ml-[38px]" />
                    )}
                </Pressable>
            ))}
        </View>
    );
}

// the buttons under an answer. the first one stands out, calls are red
export function ActionButtons({
    actions,
    disabled,
    onPress,
}: {
    actions: BotAction[];
    disabled: boolean;
    onPress: (action: BotAction) => void;
}) {
    const { t } = useLanguage();

    return (
        <View className="gap-2 mt-2">
            {actions.map((action, i) => {
                const filled = i === 0 || action.kind === "call";
                const label = t(action.label.tl, action.label.en);
                const trailing =
                    action.kind === "route" ? "arrow-forward" : null;
                return (
                    <Pressable
                        key={`${action.kind}-${label}`}
                        disabled={disabled}
                        onPress={() => onPress(action)}
                        accessibilityRole="button"
                    >
                        {({ pressed }) =>
                            filled ? (
                                <LinearGradient
                                    colors={
                                        action.kind === "call" ? RED : GREEN
                                    }
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={[
                                        pressScale(pressed),
                                        {
                                            borderRadius: 16,
                                            paddingVertical: 11,
                                            paddingHorizontal: 14,
                                            flexDirection: "row",
                                            alignItems: "center",
                                            gap: 8,
                                        },
                                    ]}
                                >
                                    <Ionicons
                                        name={action.icon}
                                        size={16}
                                        color="#fff"
                                    />
                                    <Text className="flex-1 text-white text-[13.5px] font-bold">
                                        {label}
                                    </Text>
                                    {trailing && (
                                        <Ionicons
                                            name={trailing}
                                            size={15}
                                            color="#fff"
                                        />
                                    )}
                                </LinearGradient>
                            ) : (
                                <View
                                    className="flex-row items-center gap-2 rounded-2xl px-3.5 py-[10px] border-[1.5px]"
                                    style={[
                                        pressScale(pressed),
                                        {
                                            backgroundColor: "#fff",
                                            borderColor: "rgba(62,123,79,0.28)",
                                        },
                                    ]}
                                >
                                    <Ionicons
                                        name={action.icon}
                                        size={16}
                                        color={PALETTE.forest}
                                    />
                                    <Text
                                        className="flex-1 text-[13.5px] font-bold"
                                        style={{ color: PALETTE.forest }}
                                    >
                                        {label}
                                    </Text>
                                    {trailing && (
                                        <Ionicons
                                            name={trailing}
                                            size={15}
                                            color={PALETTE.forest}
                                        />
                                    )}
                                </View>
                            )
                        }
                    </Pressable>
                );
            })}
        </View>
    );
}
