import { clayRaised, pressScale } from "@/components/clay";
import { VERIFIED_BLUE } from "@/components/verified-badge";
import { PALETTE } from "@/constants/palette";
import { useLanguage } from "@/hooks/use-language";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, Text, View } from "react-native";

const BUTTON_COLORS: [string, string] = ["#4C8BE8", "#2457B0"];

function goToVerify() {
    router.push("/(tabs)/profile/verify");
}

// shown instead of a post, message or report form for unverified users.
// "compact" is a short bar for the chat composer, the default is a card
export function VerifyRequired({
    action,
    actionEn,
    compact = false,
}: {
    // what the user wanted to do, e.g. "magpadala ng mensahe"
    action: string;
    actionEn: string;
    compact?: boolean;
}) {
    const { t } = useLanguage();
    const message = t(
        `I-verify muna ang iyong account para ${action}.`,
        `Verify your account first to ${actionEn}.`,
    );

    if (compact) {
        return (
            <View
                style={clayRaised}
                className="flex-row items-center gap-3 bg-[#EAF1FC] rounded-[22px] pl-4 pr-1.5 py-1.5"
            >
                <Ionicons
                    name="shield-checkmark"
                    size={18}
                    color={VERIFIED_BLUE}
                />
                <Text
                    className="flex-1 text-[12.5px] leading-[17px]"
                    style={{ color: PALETTE.ink }}
                >
                    {message}
                </Text>
                <Pressable onPress={goToVerify} accessibilityRole="button">
                    {({ pressed }) => (
                        <LinearGradient
                            colors={BUTTON_COLORS}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={[
                                pressScale(pressed),
                                {
                                    borderRadius: 18,
                                    paddingHorizontal: 14,
                                    paddingVertical: 10,
                                },
                            ]}
                        >
                            <Text className="text-white text-[13px] font-bold">
                                {t("I-verify", "Verify")}
                            </Text>
                        </LinearGradient>
                    )}
                </Pressable>
            </View>
        );
    }

    return (
        <View
            style={clayRaised}
            className="bg-[--main-white] rounded-[26px] p-6 items-center"
        >
            <View className="w-16 h-16 rounded-full bg-[#EAF1FC] items-center justify-center mb-4">
                <Ionicons
                    name="shield-checkmark"
                    size={30}
                    color={VERIFIED_BLUE}
                />
            </View>
            <Text
                className="text-[18px] font-bold text-center"
                style={{ color: PALETTE.ink }}
            >
                {t("Kailangang Ma-verify", "Verification Required")}
            </Text>
            <Text
                className="text-[13.5px] text-center leading-5 mt-2 mb-5"
                style={{ color: PALETTE.muted }}
            >
                {message}{" "}
                {t(
                    "Ilang minuto lang ito gamit ang isang valid na ID.",
                    "It only takes a few minutes with a valid ID.",
                )}
            </Text>
            <Pressable
                onPress={goToVerify}
                accessibilityRole="button"
                className="self-stretch"
            >
                {({ pressed }) => (
                    <LinearGradient
                        colors={BUTTON_COLORS}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[
                            pressScale(pressed),
                            {
                                borderRadius: 20,
                                paddingVertical: 15,
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 8,
                            },
                        ]}
                    >
                        <Ionicons
                            name="shield-checkmark"
                            size={18}
                            color="#fff"
                        />
                        <Text className="text-white text-[15.5px] font-bold">
                            {t("I-verify ang Account", "Verify Account")}
                        </Text>
                    </LinearGradient>
                )}
            </Pressable>
        </View>
    );
}
