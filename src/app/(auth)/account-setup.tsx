import { ClayButton, clayRaised } from "@/components/clay";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    Modal,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AccountSetup() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [birthdate, setBirthdate] = useState<Date | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [language, setLanguage] = useState<"tl" | "en">("tl");
    const [barangay, setBarangay] = useState<string | null>(null);
    const [emergencyContact, setEmergencyContact] = useState("");
    const [showBarangayModal, setShowBarangayModal] = useState(false);

    const BARANGAYS = [
        "Babo Pangulo",
        "Babo Sacan (Guanson)",
        "Balubad",
        "Calzadang Bayu",
        "Camias",
        "Cangatba",
        "Diaz",
        "Dolores (Hacienda Dolores)",
        "Inararo (Aetas)",
        "Jalung",
        "Mancatian",
        "Manibaug Libutad",
        "Manibaug Paralaya",
        "Manibaug Pasig",
        "Manuali",
        "Mitla Proper",
        "Model Community (Tokwing)",
        "Palat",
        "Pias",
        "Pio",
        "Planas",
        "Poblacion",
        "Pulung Santol",
        "Salu",
        "San Jose Mitla",
        "Santa Cruz",
        "Sepung Bulaon",
        "Sinura",
    ];

    return (
        <SafeAreaView className="flex-1 bg-[--main-white]" edges={["top"]}>
            <ScrollView
                contentContainerClassName="px-6 pt-4 pb-10"
                keyboardShouldPersistTaps="handled"
            >
                {/* <AuthHeader /> */}

                {/* Avatar placeholder */}
                <View className="items-center mb-6">
                    <Pressable
                        style={clayRaised}
                        className="w-24 h-24 rounded-full bg-[#F0EDE6] items-center justify-center"
                    >
                        <Ionicons name="camera" size={26} color="#9C978C" />
                    </Pressable>
                    <Text className="text-[12px] text-[#6B7280] mt-2">
                        Magdagdag ng larawan
                    </Text>
                </View>

                <Text className="text-[22px] font-bold text-[#1F2A1F] text-center leading-7 mb-6">
                    Kumpletuhin ang{"\n"}Iyong Profile
                </Text>

                {/* Username */}
                <Text className="text-[13px] font-medium text-[#4B4739] mb-2 ml-1">
                    Pangalan ng Gumagamit (Username)
                </Text>
                <View style={clayRaised} className="mb-4 rounded-2xl">
                    <TextInput
                        placeholder="hal. juan_delacruz"
                        placeholderTextColor="#9C978C"
                        value={username}
                        onChangeText={setUsername}
                        autoCapitalize="none"
                        className="bg-[#F0EDE6] rounded-2xl px-4 py-3.5 text-[15px] text-[#1F2A1F]"
                    />
                </View>

                {/* Emergency contact */}
                <Text className="text-[13px] font-medium text-[#4B4739] mb-2 ml-1">
                    Numero ng Telepono
                </Text>
                <View style={clayRaised} className="mb-6 rounded-2xl">
                    <TextInput
                        placeholder="09XX XXX XXXX"
                        placeholderTextColor="#9C978C"
                        value={emergencyContact}
                        onChangeText={setEmergencyContact}
                        keyboardType="phone-pad"
                        className="bg-[#F0EDE6] rounded-2xl px-4 py-3.5 text-[15px] text-[#1F2A1F]"
                    />
                </View>

                {/* Birthdate */}
                <Text className="text-[13px] font-medium text-[#4B4739] mb-2 ml-1">
                    Kaarawan
                </Text>
                <Pressable
                    style={clayRaised}
                    className="mb-4 rounded-2xl bg-[#F0EDE6] px-4 py-3.5 flex-row items-center justify-between"
                    onPress={() => setShowDatePicker(true)}
                >
                    <Text
                        className={`text-[15px] ${birthdate ? "text-[#1F2A1F]" : "text-[#9C978C]"}`}
                    >
                        {birthdate
                            ? birthdate.toLocaleDateString("fil-PH")
                            : "Pumili ng petsa"}
                    </Text>
                    <Ionicons
                        name="calendar-outline"
                        size={18}
                        color="#6B7280"
                    />
                </Pressable>
                {showDatePicker && (
                    <DateTimePicker
                        value={birthdate ?? new Date(2000, 0, 1)}
                        mode="date"
                        display={Platform.OS === "ios" ? "spinner" : "default"}
                        maximumDate={new Date()}
                        onValueChange={(_, selectedDate) => {
                            setShowDatePicker(Platform.OS === "ios");
                            if (selectedDate) setBirthdate(selectedDate);
                        }}
                        onDismiss={() => setShowDatePicker(false)}
                    />
                )}

                {/* Language preference */}
                <Text className="text-[13px] font-medium text-[#4B4739] mb-2 ml-1">
                    Wika
                </Text>
                <View className="flex-row gap-3 mb-4">
                    {(["tl", "en"] as const).map((lang) => (
                        <Pressable
                            key={lang}
                            style={clayRaised}
                            className={`flex-1 rounded-2xl py-3.5 items-center ${
                                language === lang
                                    ? "bg-[#2F5233]"
                                    : "bg-[#F0EDE6]"
                            }`}
                            onPress={() => setLanguage(lang)}
                        >
                            <Text
                                className={`text-[14px] font-medium ${language === lang ? "text-white" : "text-[#1F2A1F]"}`}
                            >
                                {lang === "tl" ? "Tagalog" : "English"}
                            </Text>
                        </Pressable>
                    ))}
                </View>

                {/* Barangay */}
                <Text className="text-[13px] font-medium text-[#4B4739] mb-2 ml-1">
                    Barangay
                </Text>
                <Pressable
                    style={clayRaised}
                    className="mb-4 rounded-2xl bg-[#F0EDE6] px-4 py-3.5 flex-row items-center justify-between"
                    onPress={() => setShowBarangayModal(true)}
                >
                    <Text
                        className={`text-[15px] ${barangay ? "text-[#1F2A1F]" : "text-[#9C978C]"}`}
                    >
                        {barangay ?? "Piliin ang barangay"}
                    </Text>
                    <Ionicons name="chevron-down" size={18} color="#6B7280" />
                </Pressable>

                <Modal
                    visible={showBarangayModal}
                    transparent
                    animationType="slide"
                    onRequestClose={() => setShowBarangayModal(false)}
                >
                    <Pressable
                        className="flex-1 bg-black/40 justify-end"
                        onPress={() => setShowBarangayModal(false)}
                    >
                        <Pressable
                            className="bg-[--main-white] rounded-t-[28px] max-h-[75%]"
                            onPress={(e) => e.stopPropagation()}
                        >
                            <View className="items-center pt-3 pb-2">
                                <View className="w-10 h-1.5 rounded-full bg-[#E5E1D8]" />
                            </View>
                            <Text className="text-[16px] font-semibold text-[#1F2A1F] text-center mb-2">
                                Piliin ang Barangay
                            </Text>
                            <ScrollView className="px-4 pb-8">
                                {BARANGAYS.map((b) => (
                                    <Pressable
                                        key={b}
                                        className="flex-row items-center justify-between py-3.5 border-b border-[#EDEAE2]"
                                        onPress={() => {
                                            setBarangay(b);
                                            setShowBarangayModal(false);
                                        }}
                                    >
                                        <Text
                                            className={`text-[15px] ${
                                                barangay === b
                                                    ? "text-[#2F5233] font-semibold"
                                                    : "text-[#1F2A1F]"
                                            }`}
                                        >
                                            {b}
                                        </Text>
                                        {barangay === b && (
                                            <Ionicons
                                                name="checkmark"
                                                size={18}
                                                color="#2F5233"
                                            />
                                        )}
                                    </Pressable>
                                ))}
                            </ScrollView>
                        </Pressable>
                    </Pressable>
                </Modal>

                {/* Continue TODO: write to Firestore users/{uid} doc, role defaults to "resident" */}
                <ClayButton
                    colors={["#4C7350", "#254631"]}
                    borderRadius={20}
                    onPress={() =>
                        router.push({
                            pathname: "/(auth)/otp-verify",
                            params: { phone: emergencyContact },
                        })
                    }
                >
                    <Text className="text-white font-semibold text-[16px]">
                        Tapusin
                    </Text>
                </ClayButton>
            </ScrollView>
        </SafeAreaView>
    );
}
