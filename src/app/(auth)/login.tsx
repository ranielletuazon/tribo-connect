import { ClayButton, clayRaised } from "@/components/clay";
import { useAuth } from "@/providers/auth-provider";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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

function getAuthErrorMessage(error: unknown): string {
    const code =
        typeof error === "object" && error !== null && "code" in error
            ? String((error as { code: unknown }).code)
            : "";

    switch (code) {
        case "auth/invalid-email":
            return "Hindi wastong email address.";
        case "auth/user-not-found":
        case "auth/wrong-password":
        case "auth/invalid-credential":
            return "Mali ang email o password.";
        case "auth/too-many-requests":
            return "Sobra na ang maling pagtatangka. Subukang muli mamaya.";
        case "auth/network-request-failed":
            return "Walang koneksyon sa internet. Pakisubukang muli.";
        default:
            return "May naganap na error. Pakisubukang muli.";
    }
}

export default function Login() {
    const router = useRouter();
    const { signIn } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<{
        email?: string;
        password?: string;
        general?: string;
    }>({});

    const handleSubmit = async () => {
        if (isSubmitting) return;

        const nextErrors: typeof errors = {};
        if (email.trim().length === 0) {
            nextErrors.email = "Ilagay ang iyong email.";
        }
        if (password.length === 0) {
            nextErrors.password = "Ilagay ang iyong password.";
        }

        if (Object.keys(nextErrors).length > 0) {
            setErrors(nextErrors);
            return;
        }

        setErrors({});
        setIsSubmitting(true);
        try {
            await signIn(email.trim(), password);
        } catch (error) {
            console.error("Login error:", error);
            setErrors({ general: getAuthErrorMessage(error) });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-[--main-white]" edges={["top"]}>
            <ScrollView
                contentContainerClassName="px-6 pt-8 pb-10"
                keyboardShouldPersistTaps="handled"
            >
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
                    Mag-login sa iyong{"\n"}account
                </Text>

                {errors.general && (
                    <View className="mb-3 px-1">
                        <Text className="text-[13px] text-[#B23A2E]">
                            {errors.general}
                        </Text>
                    </View>
                )}

                {/* Email/phone input */}
                <View style={clayRaised} className="mb-1 rounded-2xl">
                    <TextInput
                        placeholder="Email o Numero ng Telepono"
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

                {/* Password input */}
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
                    <Text className="text-[12px] text-[#B23A2E] mb-2 ml-1">
                        {errors.password}
                    </Text>
                )}
                <View className="mb-3" />

                {/* Remember me + forgot password */}
                <View className="flex-row items-center justify-between mb-6 px-1">
                    <Pressable
                        className="flex-row items-center gap-2"
                        onPress={() => setRememberMe((prev) => !prev)}
                    >
                        <View
                            className={`w-[18px] h-[18px] mt-0.5 rounded-[4px] border ${
                                rememberMe
                                    ? "bg-[#2F5233] border-[#2F5233]"
                                    : "border-[#C4BFB2]"
                            } items-center justify-center`}
                        >
                            {rememberMe && (
                                <Ionicons
                                    name="checkmark"
                                    size={12}
                                    color="#fff"
                                />
                            )}
                        </View>
                        <Text className="text-[13px] text-[#4B4739]">
                            Tandaan ako
                        </Text>
                    </Pressable>

                    <Text className="text-[13px] text-[#6B7280]">
                        Nakalimutan ang password?
                    </Text>
                </View>

                {/* Login button */}
                <ClayButton
                    colors={["#4C7350", "#254631"]}
                    borderRadius={20}
                    style={{ marginBottom: 20 }}
                    disabled={isSubmitting}
                    onPress={handleSubmit}
                >
                    <Text className="text-white font-semibold text-[16px]">
                        {isSubmitting ? "Sandali lang..." : "Mag-login"}
                    </Text>
                </ClayButton>

                {/* Divider */}
                <Text className="text-center text-[13px] text-[#9C978C] mb-5">
                    o magpatuloy gamit
                </Text>

                {/* Google button */}
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

                {/* OTP button */}
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

                {/* Sign up link */}
                <Pressable onPress={() => router.push("/(auth)/register")}>
                    <Text className="text-center text-[13px] text-[#6B7280]">
                        Wala pang account?{" "}
                        <Text className="text-[#2F5233] font-semibold">
                            Mag-sign up
                        </Text>
                    </Text>
                </Pressable>
            </ScrollView>
        </SafeAreaView>
    );
}
