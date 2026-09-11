import { clayRaised, GradientBorderCard } from "@/components/clay";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Image, ImageBackground, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// TODO: replace with your own illustration, e.g.
// require("../../assets/images/landing-illustration.png")
const ILLUSTRATION = require("../../assets/images/bg-login.png");

export default function Landing() {
    const router = useRouter();

    return (
        <SafeAreaView
            className="flex-1 bg-main-white"
            edges={["top", "bottom"]}
        >
            {/* Header */}
            <View className="items-center px-6 pt-6">
                <View style={clayRaised} className="mb-3">
                    <Image
                        source={require("../../assets/images/logo-triboconnect.png")}
                        className="w-20 h-20"
                        resizeMode="contain"
                    />
                </View>

                <Text className="text-[28px] font-bold text-center mb-3">
                    <Text style={{ color: "#2F5233" }}>Tribo</Text>
                    <Text style={{ color: "#D9622E" }}>Connect</Text>
                </Text>

                <Text className="text-[16px] font-bold text-[#1F2A1F] text-center leading-6 mb-2">
                    Mas Malakas na Komunidad,{"\n"}Mas Ligtas na Bukas.
                </Text>

                <Text className="text-[13px] text-[#6B7280] text-center leading-5">
                    Isang plataporma para sa ating{"\n"}Aeta komunidad.
                </Text>
            </View>

            {/* Illustration fills remaining space, card pinned to bottom */}
            <ImageBackground
                source={ILLUSTRATION}
                className="flex-1 mt-4 justify-end"
                resizeMode="cover"
            >
                <View
                    className="bg-[--main-white] rounded-t-[36px] px-6 pt-10 pb-8"
                    style={{
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: -6 },
                        shadowRadius: 16,
                        elevation: 10,
                    }}
                >
                    <GradientBorderCard
                        colors={[
                            "rgba(255,255,255,0.5)",
                            "rgba(217,98,46,0.28)",
                        ]}
                        borderRadius={999}
                        innerStyle={{ backgroundColor: "#D9622E" }}
                    >
                        <Pressable
                            className="flex-row items-center justify-center gap-2 py-4"
                            onPress={() => router.push("/(auth)/login")}
                        >
                            <Text className="text-white font-semibold text-[16px]">
                                Magsimula
                            </Text>
                            <Ionicons
                                name="arrow-forward"
                                size={18}
                                color="#fff"
                            />
                        </Pressable>
                    </GradientBorderCard>
                </View>
            </ImageBackground>
        </SafeAreaView>
    );
}
