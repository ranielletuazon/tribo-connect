import { clayRaised } from "@/components/clay";
import { useAuth } from "@/providers/auth-provider";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Profile() {
    const router = useRouter();
    const { user, profile } = useAuth();

    const displayName = profile?.username ?? user?.email ?? "Gumagamit";
    const initials = displayName.slice(0, 2).toUpperCase();

    return (
        <SafeAreaView className="flex-1 bg-[--main-white]" edges={["top"]}>
            <ScrollView contentContainerClassName="px-6 pt-6 pb-10">
                {/* Header */}
                <View className="items-center mb-8">
                    <View
                        style={clayRaised}
                        className="w-20 h-20 rounded-full bg-[#3F5C42] items-center justify-center mb-3"
                    >
                        <Text className="text-white text-[22px] font-bold">
                            {initials}
                        </Text>
                    </View>
                    <Text className="text-[17px] font-bold text-[#1F2A1F]">
                        {displayName}
                    </Text>
                    {profile?.barangay && (
                        <Text className="text-[13px] text-[#7A6D5C] mt-0.5">
                            Barangay {profile.barangay}
                        </Text>
                    )}
                </View>

                {/* Menu */}
                <View
                    className="bg-[#F8F4EA] rounded-[24px] overflow-hidden"
                    style={clayRaised}
                >
                    <Pressable
                        className="flex-row items-center gap-3 p-4 border-b border-[#EDEAE2]"
                        onPress={() => router.push("/(tabs)/profile/settings")}
                    >
                        <Ionicons
                            name="settings-outline"
                            size={20}
                            color="#1F2A1F"
                        />
                        <Text className="flex-1 text-[14.5px] font-medium text-[#1F2A1F]">
                            Mga Setting
                        </Text>
                        <Ionicons
                            name="chevron-forward"
                            size={16}
                            color="#C4BFB2"
                        />
                    </Pressable>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
