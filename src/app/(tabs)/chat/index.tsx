import { clayRaised } from "@/components/clay";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
    Image,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PLACEHOLDER_AVATAR = {
    uri: "https://placehold.co/80x80/4a5d43/ffffff?text=%20",
};

// Dummy data — no Firestore wiring yet, same convention as every other
// screen so far.
const CONVERSATIONS = [
    {
        id: "1",
        name: "Aeta Community",
        lastMessage: "Jaan: Salamat po!",
        time: "9:24 AM",
        unread: 3,
        isEmergency: false,
    },
    {
        id: "2",
        name: "Barangay Updates",
        lastMessage: "Bagong anunsyo ang na-post.",
        time: "8:50 AM",
        unread: 1,
        isEmergency: false,
    },
    {
        id: "3",
        name: "Family Group",
        lastMessage: "Maria: Okay na po.",
        time: "8:12 AM",
        unread: 2,
        isEmergency: false,
    },
    {
        id: "4",
        name: "Youth Organization",
        lastMessage: "Rizal: See you later!",
        time: "7:45 AM",
        unread: 1,
        isEmergency: false,
    },
    {
        id: "5",
        name: "Emergency Alerts",
        lastMessage: "Walang bagong alert.",
        time: "Kahapon",
        unread: 0,
        isEmergency: true,
    },
    {
        id: "6",
        name: "Education & Livelihood",
        lastMessage: "Lisa: Training schedule...",
        time: "Apr 15",
        unread: 4,
        isEmergency: false,
    },
];

export default function Chat() {
    const [searchQuery, setSearchQuery] = useState("");

    const filtered = CONVERSATIONS.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    return (
        <SafeAreaView className="flex-1 bg-[--main-white]" edges={["top"]}>
            <View className="px-6 pt-4">
                {/* Header — no back arrow, this is a tab root */}
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

                {/* Search — same pattern as Community, for visual consistency */}
                <View
                    style={clayRaised}
                    className="flex-row items-center gap-2.5 bg-[--main-white] rounded-[24px] px-4 py-2 mb-5"
                >
                    <Ionicons name="search" size={18} color="#9C978C" />
                    <TextInput
                        placeholder="Maghanap ng mensahe..."
                        placeholderTextColor="#9C978C"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        className="flex-1 text-[14px] text-[#1F2A1F]"
                    />
                </View>
            </View>

            {/* List */}
            <ScrollView contentContainerClassName="px-6 pb-8 gap-3">
                {filtered.length === 0 ? (
                    <Text className="text-center text-[13px] text-[#9C978C] mt-10">
                        Walang nahanap na mensahe.
                    </Text>
                ) : (
                    filtered.map((item) => (
                        <Pressable
                            key={item.id}
                            style={clayRaised}
                            className="flex-row items-center gap-3 bg-[--main-white] rounded-2xl p-3"
                            // TODO: wire once (tabs)/chat/[conversationId].tsx exists
                            // onPress={() => router.push(`/(tabs)/chat/${item.id}`)}
                        >
                            {item.isEmergency ? (
                                <View className="w-12 h-12 rounded-full bg-[#B23A2E] items-center justify-center">
                                    <Ionicons
                                        name="notifications"
                                        size={20}
                                        color="#fff"
                                    />
                                </View>
                            ) : (
                                <Image
                                    source={PLACEHOLDER_AVATAR}
                                    className="w-12 h-12 rounded-full"
                                    resizeMode="cover"
                                />
                            )}

                            <View className="flex-1">
                                <Text className="text-[14.5px] font-semibold text-[#1F2A1F] mb-0.5">
                                    {item.name}
                                </Text>
                                <Text
                                    className="text-[12.5px] text-[#7A6D5C]"
                                    numberOfLines={1}
                                >
                                    {item.lastMessage}
                                </Text>
                            </View>

                            <View className="items-end gap-1.5">
                                <Text className="text-[11px] text-[#9C978C]">
                                    {item.time}
                                </Text>
                                {item.unread > 0 && (
                                    <View className="w-5 h-5 rounded-full bg-[#B23A2E] items-center justify-center">
                                        <Text className="text-[10px] font-bold text-white">
                                            {item.unread}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </Pressable>
                    ))
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
