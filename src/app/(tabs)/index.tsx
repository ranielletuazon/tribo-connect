import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
    ImageBackground,
    Pressable,
    ScrollView,
    Text,
    View,
    type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const HERO_IMAGE = require("../../../assets/images/triboconnect-poster.jpg");

// Shadow-only clay treatment
const clayRaised: ViewStyle = {
    shadowColor: "#7A6A50",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 6,
};

// Gradient border wrapper
function GradientBorderCard({
    colors,
    borderRadius,
    borderWidth = 1.5,
    style,
    innerStyle,
    children,
}: {
    colors: [string, string, ...string[]];
    borderRadius: number;
    borderWidth?: number;
    style?: ViewStyle;
    innerStyle?: ViewStyle;
    children: React.ReactNode;
}) {
    return (
        <LinearGradient
            colors={colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[{ borderRadius, padding: borderWidth }, clayRaised, style]}
        >
            <View
                style={[
                    {
                        borderRadius: borderRadius - borderWidth,
                        overflow: "hidden",
                    },
                    innerStyle,
                ]}
            >
                {children}
            </View>
        </LinearGradient>
    );
}

const listItems = [
    {
        icon: "megaphone" as const,
        color: "#C97748",
        title: "Mga Anunsyo",
        subtitle: "Balita mula sa iyong komunidad",
    },
    {
        icon: "chatbubbles" as const,
        color: "#4CA396",
        title: "Mensahe",
        subtitle: "Makipag-usap sa pamilya at komunidad",
    },
    {
        icon: "document-text" as const,
        color: "#5A83B8",
        title: "Mag-report ng Insidente",
        subtitle: "I-pakalat ang isang pangyayari",
    },
];

export default function Home() {
    return (
        <SafeAreaView className="flex-1 bg-[#F1ECE0]" edges={["top"]}>
            <ScrollView contentContainerClassName="p-5 pb-8">
                {/* Header */}
                <View className="flex-row items-center justify-between mb-6">
                    <View className="flex-row items-center gap-3">
                        <View
                            className="w-11 h-11 rounded-[22px] bg-[#5C7A5F] items-center justify-center"
                            style={clayRaised}
                        >
                            <Text className="text-white text-[13px] font-semibold">
                                Pp
                            </Text>
                        </View>
                        <View>
                            <Text className="text-[15px] font-semibold text-[#1F2A1F]">
                                Kumusta! Pangalan
                            </Text>
                            <Text className="text-[12px] text-[#7A6D5C] mt-0.5">
                                Barangay Name · Porac
                            </Text>
                        </View>
                    </View>

                    <Pressable
                        className="w-10 h-10 rounded-[20px] bg-[#F8F4EA] items-center justify-center"
                        style={clayRaised}
                    >
                        <Ionicons
                            name="notifications"
                            size={18}
                            color="#1F2A1F"
                        />
                        <View className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#B23A2E]" />
                    </Pressable>
                </View>

                {/* Hero */}
                <GradientBorderCard
                    colors={["rgba(255,255,255,0.55)", "rgba(122,106,80,0.15)"]}
                    borderRadius={28}
                    style={{ marginBottom: 24 }}
                >
                    <ImageBackground
                        source={HERO_IMAGE}
                        className="h-52"
                        resizeMode="cover"
                    >
                        <View className="flex-1 justify-end p-5 bg-black/35">
                            <Text className="text-white text-[20px] font-bold leading-7">
                                Maligayang Pagdating sa{"\n"}TriboConnect
                            </Text>
                            <Text className="text-[#EDEDED] text-[13px] mt-1">
                                Iyong komunidad. Iyong boses. Iyong kaligtasan.
                            </Text>
                        </View>
                    </ImageBackground>
                </GradientBorderCard>

                {/* Emergency */}
                <GradientBorderCard
                    colors={["rgba(255,255,255,0.5)", "rgba(156,74,59,0.18)"]}
                    borderRadius={26}
                    style={{ marginBottom: 16 }}
                    innerStyle={{ backgroundColor: "#F4DDD6" }}
                >
                    <Pressable className="flex-row items-center gap-3 p-4">
                        <View
                            className="w-11 h-11 rounded-[22px] bg-[#B23A2E] items-center justify-center"
                            style={clayRaised}
                        >
                            <Ionicons name="warning" size={20} color="#fff" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-[15px] font-semibold text-[#9C4A3B]">
                                Emergency
                            </Text>
                            <Text className="text-[12.5px] text-[#A6685D] mt-0.5">
                                Humingi ng agarang tulong
                            </Text>
                        </View>
                        <Ionicons
                            name="chevron-forward"
                            size={18}
                            color="#9C4A3B"
                        />
                    </Pressable>
                </GradientBorderCard>

                <Text className="text-[13px] font-medium text-[#7A6D5C] mb-3 ml-1">
                    Mabilisang Serbisyo
                </Text>

                {/* List tiles  */}
                <View className="gap-4">
                    {listItems.map((item) => (
                        <Pressable
                            key={item.title}
                            className="flex-row items-center gap-3 bg-[#F8F4EA] rounded-[26px] p-4"
                            style={clayRaised}
                        >
                            <View
                                className="w-10 h-10 rounded-[20px] items-center justify-center"
                                style={[
                                    clayRaised,
                                    {
                                        backgroundColor: item.color,
                                        shadowOpacity: 0.12,
                                    },
                                ]}
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
                                <Text className="text-[12px] text-[#7A6D5C] mt-0.5">
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
