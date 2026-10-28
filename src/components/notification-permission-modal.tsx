import { useLanguage } from "@/hooks/use-language";
import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, Text, View } from "react-native";

// "settings" is when Android won't show the permission prompt anymore
export type NotificationPromptMode = "enable" | "settings";

interface NotificationPermissionModalProps {
    visible: boolean;
    mode: NotificationPromptMode;
    isEnabling: boolean;
    onEnable: () => void;
    onDismiss: () => void;
}

export function NotificationPermissionModal({
    visible,
    mode,
    isEnabling,
    onEnable,
    onDismiss,
}: NotificationPermissionModalProps) {
    const { t } = useLanguage();

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onDismiss}
        >
            <View className="flex-1 bg-black/70 items-center justify-center px-8">
                <View className="bg-[--main-white] rounded-[28px] p-6 items-center w-full">
                    <View className="w-16 h-16 rounded-full bg-[#F6E6DA] items-center justify-center mb-4">
                        <Ionicons
                            name="notifications"
                            size={30}
                            color="#C97748"
                        />
                    </View>
                    <Text className="text-[17px] font-bold text-[#1F2A1F] text-center mb-2">
                        {t("I-on ang Notifications", "Turn On Notifications")}
                    </Text>
                    <Text className="text-[13px] text-[#7A6D5C] text-center leading-5 mb-5">
                        {t(
                            "Para makatanggap ng napapanahon at agarang impormasyon tungkol sa mga emergency at anunsiyo sa iyong barangay, pakipayagan ang TriboConnect na magpadala ng notifications.",
                            "To get timely and urgent updates about emergencies and announcements in your barangay, please allow TriboConnect to send notifications.",
                        )}
                        {mode === "settings" &&
                            t(
                                " Buksan ang Settings at i-on ang Notifications para sa TriboConnect.",
                                " Open Settings and turn on Notifications for TriboConnect.",
                            )}
                    </Text>
                    <Pressable
                        onPress={onEnable}
                        disabled={isEnabling}
                        className="w-full rounded-full py-3 bg-[#2F5233] items-center"
                        style={{ opacity: isEnabling ? 0.7 : 1 }}
                    >
                        <Text className="text-[14px] font-semibold text-white">
                            {isEnabling
                                ? t("Sandali lang...", "One moment...")
                                : mode === "settings"
                                  ? t("Buksan ang Settings", "Open Settings")
                                  : t("Payagan", "Allow")}
                        </Text>
                    </Pressable>
                    <Pressable
                        onPress={onDismiss}
                        disabled={isEnabling}
                        className="w-full py-3 items-center mt-1"
                    >
                        <Text className="text-[13.5px] font-medium text-[#9C978C]">
                            {t("Mamaya na", "Maybe later")}
                        </Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
}
