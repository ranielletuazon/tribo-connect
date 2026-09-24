import { AuthHeader } from "@/components/auth-header";
import { ClayButton } from "@/components/clay";
import { functions } from "@/lib/firebase";
import { useAuth } from "@/providers/auth-provider";
import { useRouter } from "expo-router";
import { httpsCallable } from "firebase/functions";
import { useEffect, useRef, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const CODE_LENGTH = 6;
const RESEND_SECONDS = 45;

function getSendErrorMessage(error: unknown): string {
    const code =
        typeof error === "object" && error !== null && "code" in error
            ? String((error as { code: unknown }).code)
            : "";

    switch (code) {
        case "functions/resource-exhausted":
            return "Maghintay muna bago humiling ng bagong code.";
        case "functions/unauthenticated":
            return "Kailangan mong mag-login bago humiling ng OTP.";
        default:
            return "Nabigo ang pagpapadala ng code. Pakisubukang muli.";
    }
}

function getVerifyErrorMessage(error: unknown): string {
    const code =
        typeof error === "object" && error !== null && "code" in error
            ? String((error as { code: unknown }).code)
            : "";

    switch (code) {
        case "functions/invalid-argument":
            return "Maling code. Pakisubukang muli.";
        case "functions/deadline-exceeded":
            return "Nag-expire na ang code. Mag-resend ng bago.";
        case "functions/resource-exhausted":
            return "Sobra na ang maling pagsubok. Humiling ng bagong code.";
        case "functions/failed-precondition":
            return "Wala kang naka-pending na verification. Mag-request muna ng code.";
        default:
            return "May naganap na error. Pakisubukang muli.";
    }
}

export default function OtpVerify() {
    const router = useRouter();
    const { user } = useAuth();
    const [codeSent, setCodeSent] = useState(false);
    const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
    const [secondsLeft, setSecondsLeft] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [sendError, setSendError] = useState<string | null>(null);
    const [verifyError, setVerifyError] = useState<string | null>(null);
    const inputRefs = useRef<Array<TextInput | null>>([]);

    useEffect(() => {
        if (!codeSent || secondsLeft <= 0) return;
        const timer = setInterval(
            () => setSecondsLeft((prev) => prev - 1),
            1000,
        );
        return () => clearInterval(timer);
    }, [codeSent, secondsLeft]);

    const handleSendCode = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        setSendError(null);
        try {
            await httpsCallable(functions, "requestOtp")();
            setCodeSent(true);
            setSecondsLeft(RESEND_SECONDS);
        } catch (error) {
            console.error("Request OTP error:", error);
            setSendError(getSendErrorMessage(error));
        } finally {
            setIsSubmitting(false);
        }
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
        // TODO: actually resend the code here
    };

    const handleVerify = async () => {
        if (isVerifying) return;
        setIsVerifying(true);
        setVerifyError(null);
        try {
            await httpsCallable(functions, "verifyOtp")(digits.join(""));
        } catch (error) {
            console.error("Verify OTP error:", error);
            setVerifyError(getVerifyErrorMessage(error));
            setDigits(Array(CODE_LENGTH).fill(""));
            inputRefs.current[0]?.focus();
        } finally {
            setIsVerifying(false);
        }
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
                    {user?.email ?? "iyong email"}
                </Text>

                {!codeSent ? (
                    /* code not sent yet, user has to press the button first */
                    <>
                        <ClayButton
                            colors={["#4C7350", "#254631"]}
                            borderRadius={999}
                            disabled={isSubmitting}
                            style={{ marginBottom: 20 }}
                            onPress={handleSendCode}
                        >
                            <Text className="text-white font-semibold text-[16px]">
                                {isSubmitting
                                    ? "Ipinapadala..."
                                    : "Ipadala ang Code"}
                            </Text>
                        </ClayButton>
                        {sendError && (
                            <Text className="text-[12px] text-[#B23A2E] text-center -mt-3 mb-4">
                                {sendError}
                            </Text>
                        )}
                    </>
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

                        {verifyError && (
                            <Text className="text-[12px] text-[#B23A2E] text-center mb-3">
                                {verifyError}
                            </Text>
                        )}

                        <ClayButton
                            colors={["#4C7350", "#254631"]}
                            borderRadius={999}
                            disabled={!isComplete || isVerifying}
                            style={{ marginBottom: 20 }}
                            onPress={handleVerify}
                        >
                            <Text className="text-white font-semibold text-[16px]">
                                {isVerifying ? "Sandali lang..." : "I-verify"}
                            </Text>
                        </ClayButton>
                    </>
                )}

                <Pressable onPress={() => router.push("/(auth)/account-setup")}>
                    <Text className="text-center text-[13px] text-[#6B7280]">
                        Gumamit ng ibang numero
                    </Text>
                </Pressable>
            </View>
        </SafeAreaView>
    );
}
