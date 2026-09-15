import { AuthHeader } from "@/components/auth-header";
import { clayRaised } from "@/components/clay";
import { db } from "@/lib/firebase";
import { useAuth } from "@/providers/auth-provider";
import { Ionicons } from "@expo/vector-icons";
import { doc, updateDoc } from "firebase/firestore";
import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Settings() {
    const { user, profile, logOut } = useAuth();
    const [showSignOutModal, setShowSignOutModal] = useState(false);
    const [isChangingLanguage, setIsChangingLanguage] = useState(false);

    const handleLanguageChange = async (lang: "tl" | "en") => {
        if (!user || isChangingLanguage || profile?.language === lang) return;
        setIsChangingLanguage(true);
        try {
            await updateDoc(doc(db, "users", user.uid), { language: lang });
        } finally {
            setIsChangingLanguage(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-[--main-white]" edges={["top"]}>
            <ScrollView contentContainerClassName="px-6 pt-4 pb-10">
                <AuthHeader title="Mga Setting" />

                {/* Account info */}
                <Text className="text-[13px] font-medium text-[#7A6D5C] mb-2 ml-1 mt-4">
                    Account
                </Text>
                <View
                    style={clayRaised}
                    className="bg-[#F8F4EA] rounded-2xl p-4 mb-6"
                >
                    <Text className="text-[14px] text-[#1F2A1F]">
                        {user?.email}
                    </Text>
                </View>

                {/* Language */}
                <Text className="text-[13px] font-medium text-[#7A6D5C] mb-2 ml-1">
                    Wika
                </Text>
                <View className="flex-row gap-3 mb-6">
                    {(["tl", "en"] as const).map((lang) => (
                        <Pressable
                            key={lang}
                            style={clayRaised}
                            disabled={isChangingLanguage}
                            className={`flex-1 rounded-2xl py-3.5 items-center ${
                                profile?.language === lang
                                    ? "bg-[#2F5233]"
                                    : "bg-[#F8F4EA]"
                            }`}
                            onPress={() => handleLanguageChange(lang)}
                        >
                            <Text
                                className={`text-[14px] font-medium ${
                                    profile?.language === lang
                                        ? "text-white"
                                        : "text-[#1F2A1F]"
                                }`}
                            >
                                {lang === "tl" ? "Tagalog" : "English"}
                            </Text>
                        </Pressable>
                    ))}
                </View>

                {/* Sign out */}
                <Pressable
                    className="flex-row items-center justify-center gap-2 py-3.5 rounded-2xl bg-[#F4DDD6]"
                    onPress={() => setShowSignOutModal(true)}
                >
                    <Ionicons
                        name="log-out-outline"
                        size={18}
                        color="#9C3A2A"
                    />
                    <Text className="text-[14.5px] font-semibold text-[#9C3A2A]">
                        Mag-sign Out
                    </Text>
                </Pressable>
            </ScrollView>

            {/* Confirm modal */}
            <Modal visible={showSignOutModal} transparent animationType="fade">
                <Pressable
                    className="flex-1 bg-black/40 items-center justify-center px-8"
                    onPress={() => setShowSignOutModal(false)}
                >
                    <Pressable
                        className="bg-[--main-white] rounded-[24px] p-6 w-full"
                        onPress={(e) => e.stopPropagation()}
                    >
                        <Text className="text-[16px] font-bold text-[#1F2A1F] text-center mb-2">
                            Mag-sign Out?
                        </Text>
                        <Text className="text-[13px] text-[#6B7280] text-center mb-5">
                            Kakailanganin mong mag-login muli para bumalik.
                        </Text>
                        <Pressable
                            className="bg-[#9C3A2A] rounded-2xl py-3.5 items-center mb-2"
                            onPress={() => {
                                setShowSignOutModal(false);
                                logOut();
                            }}
                        >
                            <Text className="text-white font-semibold text-[15px]">
                                Oo, mag-sign out
                            </Text>
                        </Pressable>
                        <Pressable
                            className="py-3 items-center"
                            onPress={() => setShowSignOutModal(false)}
                        >
                            <Text className="text-[14px] text-[#6B7280]">
                                Kanselahin
                            </Text>
                        </Pressable>
                    </Pressable>
                </Pressable>
            </Modal>
        </SafeAreaView>
    );
}
