import { clayRaised, ClaySurface } from "@/components/clay";
import { useLanguage } from "@/hooks/use-language";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// TODO: check if this is the right file name
const TRIBO_AI_MASCOT = require("../../../../assets/images/triboAI.png");

interface Topic {
    key: string;
    label: string;
    labelEn: string;
    color: string;
}

const TOPICS: Topic[] = [
    {
        key: "anunsyo",
        label: "Anunsyo sa Barangay",
        labelEn: "Barangay Announcements",
        color: "#C97748",
    },
    {
        key: "emergency",
        label: "Emergency Contacts",
        labelEn: "Emergency Contacts",
        color: "#B23A2E",
    },
    {
        key: "serbisyo",
        label: "Mga Serbisyo",
        labelEn: "Services",
        color: "#3B6FD1",
    },
    {
        key: "report",
        label: "I-report ang Isyu",
        labelEn: "Report an Issue",
        color: "#5C7A5F",
    },
];

// TODO: placeholder answers for now, change these later
const CANNED_RESPONSES: Record<string, { tl: string; en: string }> = {
    anunsyo: {
        tl: "Makikita mo ang mga pinakabagong anunsyo ng iyong barangay sa Community tab. Gusto mo bang pumunta doon?",
        en: "You can see your barangay's latest announcements in the Community tab. Do you want to go there?",
    },
    emergency: {
        tl: "Para sa Ambulansya, Bumbero, at Pulis na numero, buksan ang Emergency page mula sa Home.",
        en: "For Ambulance, Fire, and Police numbers, open the Emergency page from Home.",
    },
    serbisyo: {
        tl: "Dito ipapakita ang listahan ng mga serbisyong available sa iyong barangay. (Content pa lang na inihahanda.)",
        en: "The list of services available in your barangay will be shown here. (Content is still being prepared.)",
    },
    report: {
        tl: "Gamitin ang Report Incident page para magsumite ng ulat tungkol sa isang pangyayari sa iyong lugar.",
        en: "Use the Report Incident page to submit a report about something that happened in your area.",
    },
};

// both languages are kept so the chat follows a language change
interface Message {
    id: string;
    sender: "bot" | "user";
    text: string;
    textEn: string;
}

export default function TriboBot() {
    const router = useRouter();
    const { t } = useLanguage();
    const scrollRef = useRef<ScrollView>(null);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "greeting",
            sender: "bot",
            text: "Kamusta! 👋 Ako si Tribo, handa akong tumulong sa iyo.",
            textEn: "Hello! 👋 I'm Tribo, ready to help you.",
        },
    ]);

    useEffect(() => {
        const timeout = setTimeout(() => {
            scrollRef.current?.scrollToEnd({ animated: true });
        }, 50);
        return () => clearTimeout(timeout);
    }, [messages]);

    const handleTopicPress = (topic: Topic) => {
        const userMsg: Message = {
            id: `${topic.key}-u-${Date.now()}`,
            sender: "user",
            text: topic.label,
            textEn: topic.labelEn,
        };
        const botMsg: Message = {
            id: `${topic.key}-b-${Date.now()}`,
            sender: "bot",
            text: CANNED_RESPONSES[topic.key].tl,
            textEn: CANNED_RESPONSES[topic.key].en,
        };
        setMessages((prev) => [...prev, userMsg, botMsg]);
    };

    return (
        <SafeAreaView className="flex-1 bg-[--main-white]" edges={["top"]}>
            {/* Header */}
            <View className="flex-row items-center justify-between px-6 pt-4 pb-3">
                <Pressable
                    onPress={() => router.back()}
                    style={clayRaised}
                    className="w-9 h-9 rounded-full bg-[#F8F4EA] items-center justify-center"
                >
                    <Ionicons name="arrow-back" size={18} color="#1F2A1F" />
                </Pressable>
                <Text className="text-[16px] font-bold text-[#1F2A1F]">
                    Chat Assistant
                </Text>
                <Pressable
                    style={clayRaised}
                    className="w-9 h-9 rounded-full bg-[#F8F4EA] items-center justify-center"
                >
                    <Ionicons
                        name="ellipsis-horizontal"
                        size={18}
                        color="#1F2A1F"
                    />
                </Pressable>
            </View>

            {/* Chat messages, mascot and suggestion chips */}
            <ScrollView
                ref={scrollRef}
                contentContainerClassName="px-6 pb-6 gap-3"
                className="flex-1"
            >
                <View className="items-center mt-2 mb-2">
                    <ClaySurface
                        colors={["#FDFCFA", "#EDE9E0"]}
                        borderRadius={999}
                        style={{
                            width: 108,
                            height: 108,
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <Image
                            source={TRIBO_AI_MASCOT}
                            className="w-28 h-28"
                            resizeMode="contain"
                        />
                    </ClaySurface>
                </View>

                {messages.map((msg) =>
                    msg.sender === "bot" ? (
                        <View
                            key={msg.id}
                            style={clayRaised}
                            className="self-start max-w-[85%] bg-white rounded-2xl rounded-tl-sm px-4 py-3"
                        >
                            <Text className="text-[14.5px] text-[#1F2A1F] leading-5">
                                {t(msg.text, msg.textEn)}
                            </Text>
                        </View>
                    ) : (
                        <View
                            key={msg.id}
                            className="self-end max-w-[85%] bg-[#2F5233] rounded-2xl rounded-tr-sm px-4 py-3"
                        >
                            <Text className="text-[14.5px] text-white leading-5">
                                {t(msg.text, msg.textEn)}
                            </Text>
                        </View>
                    ),
                )}

                {/* Suggestion chips */}
                <View className="mt-2">
                    <Text className="text-[12.5px] text-[#7A6D5C] mb-3">
                        {t(
                            "Puwede mo pa akong tanungin tungkol sa:",
                            "You can also ask me about:",
                        )}
                    </Text>
                    <View className="flex-row flex-wrap gap-2.5">
                        {TOPICS.map((topic) => (
                            <Pressable
                                key={topic.key}
                                style={clayRaised}
                                className="rounded-full px-4 py-2.5 bg-[#F8F4EA]"
                                onPress={() => handleTopicPress(topic)}
                            >
                                <Text
                                    className="text-[13px] font-semibold"
                                    style={{ color: topic.color }}
                                >
                                    {t(topic.label, topic.labelEn)}
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
