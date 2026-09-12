import { AuthHeader } from "@/components/auth-header";
import { ClayButton, clayRaised } from "@/components/clay";
import { PasswordStrengthMeter } from "@/components/password-strength-meter";
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

export default function Register() {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [password, setPassword] = useState("");

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

                {/* Email/phone */}
                <View style={clayRaised} className="mb-3 rounded-2xl">
                    <TextInput
                        placeholder="Email o Numero ng Telepono"
                        placeholderTextColor="#9C978C"
                        className="bg-[#F0EDE6] rounded-2xl px-4 py-3.5 text-[15px] text-[#1F2A1F]"
                    />
                </View>

                {/* Password */}
                <View style={clayRaised} className="relative mb-3 rounded-2xl">
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

                <PasswordStrengthMeter password={password} />

                {/* Confirm password */}
                <View style={clayRaised} className="relative mb-3 rounded-2xl">
                    <TextInput
                        placeholder="Kumpirmahin ang Password"
                        placeholderTextColor="#9C978C"
                        secureTextEntry={!showConfirmPassword}
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

                {/* Terms checkbox */}
                <Pressable
                    className="flex-row items-start gap-2 mb-6 px-1"
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

                {/* Sign up button TODO: wire to Firebase Auth + Firestore user doc creation */}
                <ClayButton
                    colors={["#4C7350", "#254631"]}
                    borderRadius={20}
                    style={{ marginBottom: 20 }}
                    onPress={() => router.push("/(auth)/account-setup")}
                >
                    <Text className="text-white font-semibold text-[16px]">
                        Mag-sign Up
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
