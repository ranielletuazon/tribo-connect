// register.tsx

import { AuthHeader } from "@/components/auth-header";
import { ClayButton, clayRaised } from "@/components/clay";
import { PasswordStrengthMeter } from "@/components/password-strength-meter";
import { db } from "@/lib/firebase";
import { useAuth } from "@/providers/auth-provider";
import { getPasswordStrength } from "@/utils/password-strength";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { useState } from "react";
import {
    Image,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getAuthErrorMessage(error: unknown): string {
    const code =
        typeof error === "object" && error !== null && "code" in error
            ? String((error as { code: unknown }).code)
            : "";

    switch (code) {
        case "auth/email-already-in-use":
            return "May account na gamit ang email na ito.";
        case "auth/invalid-email":
            return "Hindi wastong email address.";
        case "auth/weak-password":
            return "Masyadong mahina ang password.";
        case "auth/network-request-failed":
            return "Walang koneksyon sa internet. Pakisubukang muli.";
        default:
            return "May naganap na error. Pakisubukang muli.";
    }
}

export default function Register() {
    const router = useRouter();
    const { signUp } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [pendingUid, setPendingUid] = useState<string | null>(null);
    const [errors, setErrors] = useState<{
        email?: string;
        password?: string;
        confirmPassword?: string;
        terms?: string;
        general?: string;
    }>({});

    const createUserDoc = async (uid: string) => {
        await setDoc(doc(db, "users", uid), {
            email,
            role: "resident",
            onboardingComplete: false,
            createdAt: serverTimestamp(),
            username: null,
            birthdate: null,
            language: null,
            barangay: null,
            phoneNumber: null,
        });
    };

    const handleRetry = async () => {
        if (!pendingUid) return;
        setIsSubmitting(true);
        setErrors({});
        try {
            await createUserDoc(pendingUid);
        } catch (error) {
            console.error("Register retry error:", error);
            setErrors({
                general: "Nabigo ang paggawa ng account. Pakisubukang muli.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmit = async () => {
        if (isSubmitting) return;

        const nextErrors: typeof errors = {};

        if (!EMAIL_REGEX.test(email.trim())) {
            nextErrors.email = "Maglagay ng wastong email address.";
        }
        if (getPasswordStrength(password).score < 2) {
            nextErrors.password =
                "Dapat ay hindi bababa sa 'Katamtaman' ang lakas ng password.";
        }
        if (password !== confirmPassword) {
            nextErrors.confirmPassword = "Hindi magkatugma ang password.";
        }
        if (!agreedToTerms) {
            nextErrors.terms =
                "Kailangan mong sumang-ayon sa Mga Tuntunin at Patakaran sa Privacy.";
        }

        if (Object.keys(nextErrors).length > 0) {
            setErrors(nextErrors);
            return;
        }

        setErrors({});
        setIsSubmitting(true);
        try {
            const user = await signUp(email.trim(), password);
            try {
                await createUserDoc(user.uid);
            } catch (error) {
                console.error("Register error:", error);
                setPendingUid(user.uid);
                setErrors({
                    general:
                        "Nagawa ang account pero nabigo ang pag-save ng profile. Pakisubukang muli.",
                });
            }
        } catch (error) {
            console.error("Register error:", error);
            setErrors({ general: getAuthErrorMessage(error) });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-[--main-white]" edges={["top"]}>
            <ScrollView
                contentContainerClassName="px-6 pt-4 pb-10"
                keyboardShouldPersistTaps="handled"
            >
                <AuthHeader />

                {/* Logo */}
                <View className="items-center mb-6">
                    <View style={clayRaised}>
                        <Image
                            source={require("../../../assets/images/logo-triboconnect.png")}
                            className="w-34 h-28"
                            resizeMode="contain"
                        />
                    </View>
                </View>

                {/* Heading */}
                <Text className="text-[22px] font-bold text-[#1F2A1F] text-center leading-7 mb-6">
                    Gumawa ng Iyong{"\n"}Account
                </Text>

                {errors.general && (
                    <View className="mb-3 px-1">
                        <Text className="text-[13px] text-[#B23A2E]">
                            {errors.general}
                        </Text>
                        {pendingUid && (
                            <Pressable onPress={handleRetry} className="mt-1">
                                <Text className="text-[13px] font-semibold text-[#2F5233]">
                                    Subukang Muli
                                </Text>
                            </Pressable>
                        )}
                    </View>
                )}

                {/* Email */}
                <View style={clayRaised} className="mb-1 rounded-2xl">
                    <TextInput
                        placeholder="Email"
                        placeholderTextColor="#9C978C"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        className="bg-[#F0EDE6] rounded-2xl px-4 py-3.5 text-[15px] text-[#1F2A1F]"
                    />
                </View>
                {errors.email && (
                    <Text className="text-[12px] text-[#B23A2E] mb-2 ml-1">
                        {errors.email}
                    </Text>
                )}
                <View className="mb-3" />

                {/* Password */}
                <View style={clayRaised} className="relative mb-1 rounded-2xl">
                    <TextInput
                        placeholder="Password"
                        placeholderTextColor="#9C978C"
                        secureTextEntry={!showPassword}
                        value={password}
                        onChangeText={setPassword}
                        className="bg-[#F0EDE6] rounded-2xl px-4 py-3.5 pr-11 text-[15px] text-[#1F2A1F]"
                    />
                    <Pressable
                        className="absolute right-4 top-0 bottom-0 justify-center"
                        onPress={() => setShowPassword((prev) => !prev)}
                    >
                        <Ionicons
                            name={showPassword ? "eye-off" : "eye"}
                            size={20}
                            color="#6B7280"
                        />
                    </Pressable>
                </View>
                {errors.password && (
                    <Text className="text-[12px] text-[#B23A2E] mb-1 ml-1">
                        {errors.password}
                    </Text>
                )}

                <PasswordStrengthMeter password={password} />

                {/* Confirm password */}
                <View style={clayRaised} className="relative mb-1 rounded-2xl">
                    <TextInput
                        placeholder="Kumpirmahin ang Password"
                        placeholderTextColor="#9C978C"
                        secureTextEntry={!showConfirmPassword}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        className="bg-[#F0EDE6] rounded-2xl px-4 py-3.5 pr-11 text-[15px] text-[#1F2A1F]"
                    />
                    <Pressable
                        className="absolute right-4 top-0 bottom-0 justify-center"
                        onPress={() => setShowConfirmPassword((prev) => !prev)}
                    >
                        <Ionicons
                            name={showConfirmPassword ? "eye-off" : "eye"}
                            size={20}
                            color="#6B7280"
                        />
                    </Pressable>
                </View>
                {errors.confirmPassword && (
                    <Text className="text-[12px] text-[#B23A2E] mb-2 ml-1">
                        {errors.confirmPassword}
                    </Text>
                )}
                <View className="mb-3" />

                {/* Terms checkbox */}
                <Pressable
                    className="flex-row items-start gap-2 mb-1 px-1"
                    onPress={() => setAgreedToTerms((prev) => !prev)}
                >
                    <View
                        className={`w-4.5 h-4.5 mt-0.5 rounded-[4px] border ${
                            agreedToTerms
                                ? "bg-[#2F5233] border-[#2F5233]"
                                : "border-[#C4BFB2]"
                        } items-center justify-center`}
                    >
                        {agreedToTerms && (
                            <Ionicons name="checkmark" size={12} color="#fff" />
                        )}
                    </View>
                    <Text className="text-[13px] text-[#4B4739] flex-1 leading-5">
                        Sumasang-ayon ako sa{" "}
                        <Text className="text-[#2F5233] font-semibold">
                            Mga Tuntunin
                        </Text>{" "}
                        at{" "}
                        <Text className="text-[#2F5233] font-semibold">
                            Patakaran sa Privacy
                        </Text>
                    </Text>
                </Pressable>
                {errors.terms && (
                    <Text className="text-[12px] text-[#B23A2E] mb-4 ml-1">
                        {errors.terms}
                    </Text>
                )}
                {!errors.terms && <View className="mb-5" />}

                {/* Sign up button */}
                <ClayButton
                    colors={["#4C7350", "#254631"]}
                    borderRadius={20}
                    style={{ marginBottom: 20 }}
                    disabled={isSubmitting}
                    onPress={handleSubmit}
                >
                    <Text className="text-white font-semibold text-[16px]">
                        {isSubmitting ? "Sandali lang..." : "Mag-sign Up"}
                    </Text>
                </ClayButton>

                {/* Divider */}
                <Text className="text-center text-[13px] text-[#9C978C] mb-5">
                    o magpatuloy gamit
                </Text>

                {/* Google */}
                <View style={clayRaised} className="mb-3 rounded-2xl">
                    <Pressable className="flex-row items-center justify-center gap-2.5 bg-[#F0EDE6] rounded-2xl py-3.5">
                        <Ionicons
                            name="logo-google"
                            size={18}
                            color="#1F2A1F"
                        />
                        <Text className="text-[15px] font-medium text-[#1F2A1F]">
                            Google
                        </Text>
                    </Pressable>
                </View>

                {/* Phone OTP */}
                <View style={clayRaised} className="mb-8 rounded-2xl">
                    <Pressable className="flex-row items-center justify-center gap-2.5 bg-[#F0EDE6] rounded-2xl py-3.5">
                        <Ionicons
                            name="call-outline"
                            size={18}
                            color="#1F2A1F"
                        />
                        <Text className="text-[15px] font-medium text-[#1F2A1F]">
                            Numero ng Telepono (OTP)
                        </Text>
                    </Pressable>
                </View>

                {/* Back to login */}
                <Pressable onPress={() => router.push("/(auth)/login")}>
                    <Text className="text-center text-[13px] text-[#6B7280]">
                        May account ka na?{" "}
                        <Text className="text-[#2F5233] font-semibold">
                            Mag-login
                        </Text>
                    </Text>
                </Pressable>
            </ScrollView>
        </SafeAreaView>
    );
}
