import { useLanguage } from "@/hooks/use-language";
import { useNetworkStatus } from "@/hooks/use-network-status";
import { Ionicons } from "@expo/vector-icons";
import { Modal, Text, View } from "react-native";

export function NoInternetModal() {
    const isConnected = useNetworkStatus();
    // before login there's no profile, so this stays in Tagalog there
    const { t } = useLanguage();

    return (
        <Modal visible={!isConnected} transparent animationType="fade">
            <View className="flex-1 bg-black/70 items-center justify-center px-8">
                <View className="bg-[--main-white] rounded-[28px] p-6 items-center w-full">
                    <View className="w-16 h-16 rounded-full bg-[#F4DDD6] items-center justify-center mb-4">
                        <Ionicons
                            name="cloud-offline"
                            size={30}
                            color="#9C3A2A"
                        />
                    </View>
                    <Text className="text-[17px] font-bold text-[#1F2A1F] text-center mb-2">
                        {t(
                            "Walang Koneksyon sa Internet",
                            "No Internet Connection",
                        )}
                    </Text>
                    <Text className="text-[13px] text-[#7A6D5C] text-center leading-5">
                        {t(
                            "Kailangan ng internet connection para magamit ang TriboConnect. Pakisuri ang iyong Wi-Fi o mobile data.",
                            "TriboConnect needs an internet connection. Please check your Wi-Fi or mobile data.",
                        )}
                    </Text>
                </View>
            </View>
        </Modal>
    );
}
