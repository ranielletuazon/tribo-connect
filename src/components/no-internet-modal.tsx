import { useNetworkStatus } from "@/hooks/use-network-status";
import { Ionicons } from "@expo/vector-icons";
import { Modal, Text, View } from "react-native";

export function NoInternetModal() {
    const isConnected = useNetworkStatus();

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
                        Walang Koneksyon sa Internet
                    </Text>
                    <Text className="text-[13px] text-[#7A6D5C] text-center leading-5">
                        Kailangan ng internet connection para magamit ang
                        TriboConnect. Pakisuri ang iyong Wi-Fi o mobile data.
                    </Text>
                </View>
            </View>
        </Modal>
    );
}
