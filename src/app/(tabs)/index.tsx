import { clayRaised, ClaySurface, GradientBorderCard } from "@/components/clay";
import { Ionicons } from "@expo/vector-icons";
import {
    ImageBackground,
    Pressable,
    ScrollView,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const HERO_IMAGE = require("../../../assets/images/triboconnect-poster.jpg");

const listItems = [
    {
        icon: "megaphone" as const,
        color: "#C97748",
        title: "Mga Anunsyo",
        subtitle: "Balita mula sa iyong komunidad",
    },
    {
        icon: "chatbubbles" as const,
        color: "#5C7A5F",
        title: "Mensahe",
        subtitle: "Makipag-usap sa pamilya at komunidad",
    },
    {
        icon: "document-text" as const,
        color: "#5C7A5F",
        title: "Mag-report ng Insidente",
        subtitle: "I-pakalat ang isang pangyayari",
    },
];

export default function Home() {
    return (
        <SafeAreaView className="flex-1 bg-[--main-white]" edges={["top"]}>
            <ScrollView contentContainerClassName="p-5 pb-8">
                {/* Header — small/repeated elements stay shadow-only */}
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

                {/* Hero — stays a non-interactive GradientBorderCard */}
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
                            <Text className="text-[20px] font-semibold leading-7">
                                <Text className="text-white">
                                    Maligayang Pagdating sa{"\n"}
                                </Text>
                                <Text className="text-[#5C7A5F] font-bold">
                                    Tribo
                                </Text>
                                <Text className="text-[#C97748] font-bold">
                                    Connect
                                </Text>
                            </Text>
                            <Text className="text-[#EDEDED] text-[13px] mt-1">
                                Iyong komunidad. Iyong boses. Iyong kaligtasan.
                            </Text>
                        </View>
                    </ImageBackground>
                </GradientBorderCard>

                {/* Emergency — now a real ClaySurface gradient fill, custom layout, so colors flip for contrast */}
                <Pressable style={{ marginBottom: 16 }}>
                    {({ pressed }) => (
                        <ClaySurface
                            colors={["#E0715F", "#9C3A2A"]}
                            borderRadius={26}
                            style={{ opacity: pressed ? 0.9 : 1 }}
                        >
                            <View className="flex-row items-center gap-3 p-4">
                                <View className="w-11 h-11 rounded-[22px] bg-white items-center justify-center">
                                    <Ionicons
                                        name="warning"
                                        size={20}
                                        color="#9C3A2A"
                                    />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-[15px] font-bold text-white">
                                        Emergency
                                    </Text>
                                    <Text className="text-[12.5px] text-white/80 mt-0.5">
                                        Humingi ng agarang tulong
                                    </Text>
                                </View>
                                <Ionicons
                                    name="chevron-forward"
                                    size={18}
                                    color="#fff"
                                />
                            </View>
                        </ClaySurface>
                    )}
                </Pressable>

                <Text className="text-[13px] font-medium text-[#7A6D5C] mb-3 ml-1">
                    Mabilisang Serbisyo
                </Text>

                {/* List tiles — kept shadow-only on purpose, see note below */}
                <View className="gap-4">
                    {listItems.map((item) => (
                        <Pressable
                            key={item.title}
                            className="flex-row items-center gap-3 bg-[--main-white] rounded-[26px] p-4"
                            style={clayRaised}
                        >
                            <View
                                className="w-10 h-10 rounded-full items-center justify-center"
                                style={[
                                    clayRaised,
                                    {
                                        backgroundColor: item.color,
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
                                <Text className="text-[14.5px] font-bold text-[#1F2A1F]">
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
