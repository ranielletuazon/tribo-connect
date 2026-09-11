import { clayRaised, GradientBorderCard } from "@/components/clay";
import { Ionicons } from "@expo/vector-icons";
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

export default function Login() {
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    return (
        <SafeAreaView className="flex-1 bg-main-white" edges={["top"]}>
            <ScrollView
                contentContainerClassName="px-6 pt-8 pb-10"
                keyboardShouldPersistTaps="handled"
            >
                {/* Logo */}
                <View className="items-center mb-6">
                    <View style={clayRaised}>
                        <Image
                            source={require("../../../assets/images/logo-triboconnect.png")}
                            className="w-32 h-24"
                            resizeMode="contain"
                        />
                    </View>
                </View>

                {/* Heading */}
                <Text className="text-[22px] font-bold text-[#1F2A1F] text-center leading-7 mb-6">
                    Mag-login sa iyong{"\n"}account
                </Text>

                {/* Email/phone input */}
                <View style={clayRaised} className="mb-3 rounded-2xl">
                    <TextInput
                        placeholder="Email o Numero ng Telepono"
                        placeholderTextColor="#9C978C"
                        className="bg-[#F0EDE6] rounded-2xl px-4 py-3.5 text-[15px] text-[#1F2A1F]"
                    />
                </View>

                {/* Password input */}
                <View style={clayRaised} className="relative mb-3 rounded-2xl">
                    <TextInput
                        placeholder="Password"
                        placeholderTextColor="#9C978C"
                        secureTextEntry={!showPassword}
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

                {/* Remember me + forgot password */}
                <View className="flex-row items-center justify-between mb-6 px-1">
                    <Pressable
                        className="flex-row items-center gap-2"
                        onPress={() => setRememberMe((prev) => !prev)}
                    >
                        <View
                            className={`w-4.5 h-4.5 rounded-[4px] border ${
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

                {/* Login button — primary CTA, gets the gradient border treatment */}
                <GradientBorderCard
                    colors={["rgba(255,255,255,0.5)", "rgba(47,82,51,0.25)"]}
                    borderRadius={20}
                    style={{ marginBottom: 20 }}
                    innerStyle={{ backgroundColor: "#2F5233" }}
                >
                    <Pressable className="py-4 items-center">
                        <Text className="text-white font-semibold text-[16px]">
                            Mag-login
                        </Text>
                    </Pressable>
                </GradientBorderCard>

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
                <Text className="text-center text-[13px] text-[#6B7280]">
                    Wala pang account?{" "}
                    <Text className="text-[#2F5233] font-semibold">
                        Mag-sign up
                    </Text>
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
}
