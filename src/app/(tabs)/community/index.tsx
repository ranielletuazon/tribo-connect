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

const FILTERS = ["Lahat", "Barangay", "Emergency"] as const;
type Filter = (typeof FILTERS)[number];

const PLACEHOLDER_THUMB = {
    uri: "https://placehold.co/120x120/4a5d43/ffffff?text=%20",
};

// Dummy data — no Firestore wiring yet, matches the design-first convention
// used for every other screen so far.
const ANNOUNCEMENTS = [
    {
        id: "1",
        title: "Barangay Meeting",
        date: "May 16, 2025",
        time: "8:00 AM",
        location: "Barangay Hall",
        category: "Barangay" as Filter,
    },
];

export default function Community() {
    const [activeFilter, setActiveFilter] = useState<Filter>("Lahat");
    const [searchQuery, setSearchQuery] = useState("");

    const filtered = ANNOUNCEMENTS.filter((item) => {
        const matchesFilter =
            activeFilter === "Lahat" || item.category === activeFilter;
        const matchesSearch = item.title
            .toLowerCase()
            .includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    return (
        <SafeAreaView className="flex-1 bg-[--main-white]" edges={["top"]}>
            <View className="px-6 pt-4">
                {/* Header — no back arrow, this is a tab root */}
                <View className="flex-row items-center justify-between mb-5">
                    <Text className="text-[18px] font-bold text-[#1F2A1F]">
                        Mga Anunsyo
                    </Text>
                </View>

                {/* Search */}
                <View
                    style={clayRaised}
                    className="flex-row items-center gap-2.5 bg-[--main-white] rounded-[24px] px-4 py-2 mb-4"
                >
                    <Ionicons name="search" size={18} color="#9C978C" />
                    <TextInput
                        placeholder="Maghanap ng anunsyo..."
                        placeholderTextColor="#9C978C"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        className="flex-1 text-[14px] text-[#1F2A1F]"
                    />
                </View>

                {/* Filter chips */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerClassName="gap-2.5 pb-4"
                >
                    {FILTERS.map((filter) => (
                        <Pressable
                            key={filter}
                            style={clayRaised}
                            className={`rounded-full px-4 py-2 ${
                                activeFilter === filter
                                    ? "bg-[#2F5233]"
                                    : "bg-[--main-white]"
                            }`}
                            onPress={() => setActiveFilter(filter)}
                        >
                            <Text
                                className={`text-[13px] font-medium ${
                                    activeFilter === filter
                                        ? "text-white"
                                        : "text-[#1F2A1F]"
                                }`}
                            >
                                {filter}
                            </Text>
                        </Pressable>
                    ))}
                </ScrollView>
            </View>

            {/* List */}
            <ScrollView contentContainerClassName="px-6 pb-8 gap-3.5">
                {filtered.length === 0 ? (
                    <Text className="text-center text-[13px] text-[#9C978C] mt-10">
                        Walang nahanap na anunsyo.
                    </Text>
                ) : (
                    filtered.map((item) => (
                        <Pressable
                            key={item.id}
                            style={clayRaised}
                            className="flex-row items-center gap-3 bg-[--main-white] rounded-2xl p-3"
                            // TODO: wire once (tabs)/community/[postId].tsx exists
                            // onPress={() => router.push(`/(tabs)/community/${item.id}`)}
                        >
                            <Image
                                source={PLACEHOLDER_THUMB}
                                className="w-14 h-14 rounded-xl"
                                resizeMode="cover"
                            />
                            <View className="flex-1">
                                <Text className="text-[14.5px] font-semibold text-[#1F2A1F] mb-1">
                                    {item.title}
                                </Text>
                                <View className="flex-row items-center gap-1 mb-0.5">
                                    <Ionicons
                                        name="calendar-outline"
                                        size={12}
                                        color="#7A6D5C"
                                    />
                                    <Text className="text-[12px] text-[#7A6D5C]">
                                        {item.date} · {item.time}
                                    </Text>
                                </View>
                                <View className="flex-row items-center gap-1">
                                    <Ionicons
                                        name="location-outline"
                                        size={12}
                                        color="#7A6D5C"
                                    />
                                    <Text className="text-[12px] text-[#7A6D5C]">
                                        {item.location}
                                    </Text>
                                </View>
                            </View>
                            <Ionicons
                                name="chevron-forward"
                                size={18}
                                color="#C4BFB2"
                            />
                        </Pressable>
                    ))
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
