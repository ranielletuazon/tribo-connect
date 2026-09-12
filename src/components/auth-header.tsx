import { clayRaised } from "@/components/clay";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

export function AuthHeader({ title }: { title?: string }) {
    const router = useRouter();

    return (
        <View className="flex-row items-center mb-4">
            <Pressable
                onPress={() => router.back()}
                className="w-10 h-10 rounded-full bg-[#F0EDE6] items-center justify-center"
                style={clayRaised}
            >
                <Ionicons name="arrow-back" size={20} color="#1F2A1F" />
            </Pressable>

            {title && (
                <Text className="flex-1 text-center text-[15px] font-semibold text-[#1F2A1F] mr-10">
                    {title}
                </Text>
            )}
        </View>
    );
}
