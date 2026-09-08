import { Ionicons } from "@expo/vector-icons";
import {
    ImageBackground,
    Pressable,
    ScrollView,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const HERO_PLACEHOLDER = {
    uri: "https://placehold.co/800x400/2d3b2e/ffffff?text=Community+Photo",
};

const listItems = [
    {
        icon: "megaphone" as const,
        color: "#B5562E",
        title: "Mga Anunsyo",
        subtitle: "Balita mula sa iyong komunidad",
    },
    {
        icon: "chatbubbles" as const,
        color: "#2F8F82",
        title: "Mensahe",
        subtitle: "Makipag-usap sa pamilya at komunidad",
    },
    {
        icon: "document-text" as const,
        color: "#35608F",
        title: "Mag-report ng Insidente",
        subtitle: "I-pakalat ang isang pangyayari",
    },
];

export default function Home() {
    return (
        <SafeAreaView className="flex-1 bg-[#F7F4EE]" edges={["top"]}>
            <ScrollView contentContainerClassName="p-5 pb-8">
                {/* Header */}
                <View className="flex-row items-center justify-between mb-5">
                    <View className="flex-row items-center gap-3">
                        <View className="w-11 h-11 rounded-full bg-[#3F5C42] items-center justify-center">
                            <Text className="text-white text-[13px] font-semibold">
                                Pp
                            </Text>
                        </View>
                        <View>
                            <Text className="text-[15px] font-semibold text-[#1F2A1F]">
                                Kumusta! Pangalan
                            </Text>
                            <Text className="text-[12px] text-[#6B6357] mt-0.5">
                                Barangay Name · Porac
                            </Text>
                        </View>
                    </View>

                    <Pressable className="w-9 h-9 rounded-full bg-[#FDFCF9] items-center justify-center">
                        <Ionicons
                            name="notifications"
                            size={18}
                            color="#1F2A1F"
                        />
                        <View className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#B23A2E]" />
                    </Pressable>
                </View>

                {/* Hero banner */}
                <ImageBackground
                    source={HERO_PLACEHOLDER}
                    className="h-60 rounded-[20px] overflow-hidden mb-4"
                    imageClassName="rounded-[20px]"
                >
                    <View className="flex-1 justify-end p-[18px] bg-black/35">
                        <Text className="text-white text-[20px] font-bold leading-7">
                            Maligayang Pagdating sa{"\n"}TriboConnect
                        </Text>
                        <Text className="text-[#EDEDED] text-[13px] mt-1">
                            Iyong komunidad. Iyong boses. Iyong kaligtasan.
                        </Text>
                    </View>
                </ImageBackground>

                {/* Emergency — isolated, urgent, distinct from the rest */}
                <Pressable className="flex-row items-center gap-3 bg-[#F7E5E2] rounded-2xl p-4 mb-5 border border-[#E8C4BE]">
                    <View className="w-11 h-11 rounded-full bg-[#B23A2E] items-center justify-center">
                        <Ionicons name="warning" size={20} color="#fff" />
                    </View>
                    <View className="flex-1">
                        <Text className="text-[15px] font-semibold text-[#B23A2E]">
                            Emergency
                        </Text>
                        <Text className="text-[12.5px] text-[#8A5A54] mt-0.5">
                            Humingi ng agarang tulong
                        </Text>
                    </View>
                    <Ionicons
                        name="chevron-forward"
                        size={18}
                        color="#B23A2E"
                    />
                </Pressable>

                {/* Section label — plain, sentence case */}
                <Text className="text-[13px] font-medium text-[#6B6357] mb-2.5 ml-1">
                    Mabilisang Serbisyo
                </Text>

                {/* Grouped list — calm, informational, visually different from Emergency */}
                <View className="bg-[#FDFCF9] rounded-2xl overflow-hidden">
                    {listItems.map((item, i) => (
                        <Pressable
                            key={item.title}
                            className={`flex-row items-center gap-3 p-4 ${
                                i < listItems.length - 1
                                    ? "border-b border-[#EDEAE2]"
                                    : ""
                            }`}
                        >
                            <View
                                className="w-9 h-9 rounded-full items-center justify-center"
                                style={{ backgroundColor: item.color }}
                            >
                                <Ionicons
                                    name={item.icon}
                                    size={17}
                                    color="#fff"
                                />
                            </View>
                            <View className="flex-1">
                                <Text className="text-[14.5px] font-semibold text-[#1F2A1F]">
                                    {item.title}
                                </Text>
                                <Text className="text-[12px] text-[#6B6357] mt-0.5">
                                    {item.subtitle}
                                </Text>
                            </View>
                            <Ionicons
                                name="chevron-forward"
                                size={16}
                                color="#C4BFB2"
                            />
                        </Pressable>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
