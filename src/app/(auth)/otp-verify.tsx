import { AuthHeader } from "@/components/auth-header";
import { ClayButton } from "@/components/clay";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const CODE_LENGTH = 6;
const RESEND_SECONDS = 45;

export default function OtpVerify() {
    const router = useRouter();
    const { phone } = useLocalSearchParams<{ phone?: string }>();
    const [codeSent, setCodeSent] = useState(false);
    const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
    const [secondsLeft, setSecondsLeft] = useState(0);
    const inputRefs = useRef<Array<TextInput | null>>([]);

    useEffect(() => {
        if (!codeSent || secondsLeft <= 0) return;
        const timer = setInterval(
            () => setSecondsLeft((prev) => prev - 1),
            1000,
        );
        return () => clearInterval(timer);
    }, [codeSent, secondsLeft]);

    const handleSendCode = () => {
        setCodeSent(true);
        setSecondsLeft(RESEND_SECONDS);
        // TODO: trigger actual SMS send once backend exists
    };

    const handleChangeDigit = (text: string, index: number) => {
        const value = text.slice(-1);
        const next = [...digits];
        next[index] = value;
        setDigits(next);

        if (value && index < CODE_LENGTH - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyPress = (key: string, index: number) => {
        if (key === "Backspace" && !digits[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleResend = () => {
        if (secondsLeft > 0) return;
        setSecondsLeft(RESEND_SECONDS);
        // TODO: trigger actual resend request once backend exists
    };

    const formattedTime = `00:${String(secondsLeft).padStart(2, "0")}`;
    const isComplete = digits.every((d) => d !== "");

    return (
        <SafeAreaView className="flex-1 bg-main-white" edges={["top"]}>
            <View className="flex-1 px-6 pt-4">
                <AuthHeader />

                <Text className="text-[20px] font-bold text-[#1F2A1F] text-center mt-4 mb-2">
                    I-verify ang iyong OTP
                </Text>
                <Text className="text-[13px] text-[#6B7280] text-center mb-1">
                    {codeSent
                        ? "Nagpadala kami ng 6-digit code sa"
                        : "Ipapadala namin ang 6-digit code sa"}
                </Text>
                <Text className="text-[15px] font-semibold text-[#1F2A1F] text-center mb-8">
                    {phone || "+63 9XX XXX XXXX"}
                </Text>

                {!codeSent ? (
                    /* Nothing sent yet user must explicitly request it */
                    <ClayButton
                        colors={["#4C7350", "#254631"]}
                        borderRadius={999}
                        style={{ marginBottom: 20 }}
                        onPress={handleSendCode}
                    >
                        <Text className="text-white font-semibold text-[16px]">
                            Ipadala ang Code
                        </Text>
                    </ClayButton>
                ) : (
                    <>
                        {/* Digit boxes */}
                        <View className="flex-row justify-between mb-4">
                            {digits.map((digit, index) => (
                                <TextInput
                                    key={index}
                                    ref={(ref) => {
                                        inputRefs.current[index] = ref;
                                    }}
                                    value={digit}
                                    onChangeText={(text) =>
                                        handleChangeDigit(text, index)
                                    }
                                    onKeyPress={({ nativeEvent }) =>
                                        handleKeyPress(nativeEvent.key, index)
                                    }
                                    keyboardType="number-pad"
                                    maxLength={1}
                                    autoFocus={index === 0}
                                    className="w-12 h-14 rounded-2xl bg-[#F0EDE6] text-center text-[20px] font-semibold text-[#1F2A1F]"
                                />
                            ))}
                        </View>

                        {/* Resend timer / action */}
                        <Pressable
                            onPress={handleResend}
                            disabled={secondsLeft > 0}
                            className="mb-10"
                        >
                            <Text className="text-center text-[13px] text-[#9C978C]">
                                {secondsLeft > 0 ? (
                                    `Resend code sa ${formattedTime}`
                                ) : (
                                    <Text className="text-[#2F5233] font-semibold">
                                        I-resend ang code
                                    </Text>
                                )}
                            </Text>
                        </Pressable>

                        {/* Verify TODO: replace with real Firebase phone-auth confirmation */}
                        <ClayButton
                            colors={["#4C7350", "#254631"]}
                            borderRadius={999}
                            disabled={!isComplete}
                            style={{ marginBottom: 20 }}
                            onPress={() => router.push("/(tabs)")}
                        >
                            <Text className="text-white font-semibold text-[16px]">
                                I-verify
                            </Text>
                        </ClayButton>
                    </>
                )}

                <Pressable onPress={() => router.back()}>
                    <Text className="text-center text-[13px] text-[#6B7280]">
                        Gumamit ng ibang numero
                    </Text>
                </Pressable>
            </View>
        </SafeAreaView>
    );
}
