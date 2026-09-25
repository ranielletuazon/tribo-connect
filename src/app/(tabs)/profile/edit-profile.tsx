import { AuthHeader } from "@/components/auth-header";
import { ClayButton, clayRaised } from "@/components/clay";
import { db } from "@/lib/firebase";
import { uploadImage } from "@/lib/upload-image";
import { useAuth } from "@/providers/auth-provider";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { doc, updateDoc } from "firebase/firestore";
import { useState } from "react";
import {
    Image,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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

export default function EditProfile() {
    const router = useRouter();
    const { user, profile } = useAuth();

    const initialBirthdate = profile?.birthdate
        ? new Date(profile.birthdate)
        : null;

    const [username, setUsername] = useState(profile?.username ?? "");
    const [barangay, setBarangay] = useState<string | null>(
        profile?.barangay ?? null,
    );
    const [language, setLanguage] = useState<"tl" | "en">(
        profile?.language ?? "tl",
    );
    const [birthdate, setBirthdate] = useState<Date | null>(initialBirthdate);
    const [phoneNumber, setPhoneNumber] = useState(profile?.phoneNumber ?? "");
    const [imageUri, setImageUri] = useState<string | null>(
        profile?.photoURL ?? null,
    );

    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showBarangayModal, setShowBarangayModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const hasChanges =
        username.trim() !== (profile?.username ?? "") ||
        barangay !== (profile?.barangay ?? null) ||
        language !== (profile?.language ?? "tl") ||
        phoneNumber.trim() !== (profile?.phoneNumber ?? "") ||
        (birthdate?.toISOString() ?? null) !== (profile?.birthdate ?? null) ||
        imageUri !== (profile?.photoURL ?? null);

    const canSave =
        hasChanges &&
        !isSaving &&
        username.trim().length > 0 &&
        !!barangay &&
        !!birthdate;

    const handlePickImage = async () => {
        const permission =
            await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) return;

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled) {
            setImageUri(result.assets[0].uri);
        }
    };

    const handleSave = async () => {
        if (!canSave || !user) return;
        setError(null);
        setIsSaving(true);

        try {
            let photoURL = profile?.photoURL ?? null;

            // only upload the photo if the user picked a new one
            // (new photos start with file://, old ones are already a link)
            if (imageUri && imageUri !== profile?.photoURL) {
                photoURL = await uploadImage(
                    imageUri,
                    `users/${user.uid}/profile-image`,
                );
            }

            await updateDoc(doc(db, "users", user.uid), {
                username: username.trim(),
                barangay,
                language,
                phoneNumber: phoneNumber.trim() || null,
                birthdate: birthdate!.toISOString(),
                photoURL,
            });

            router.back();
        } catch (err) {
            console.error("Edit profile error:", err);
            setError("Nabigo ang pag-save. Pakisubukang muli.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-[--main-white]" edges={["top"]}>
            <ScrollView
                contentContainerClassName="px-6 pt-4 pb-10"
                keyboardShouldPersistTaps="handled"
            >
                <AuthHeader title="I-edit ang Profile" />

                {/* Avatar */}
                <View className="items-center mb-6 mt-2">
                    <Pressable
                        onPress={handlePickImage}
                        style={clayRaised}
                        className="w-24 h-24 rounded-full bg-[#F0EDE6] items-center justify-center overflow-hidden"
                    >
                        {imageUri ? (
                            <Image
                                source={{ uri: imageUri }}
                                className="w-full h-full"
                                resizeMode="cover"
                            />
                        ) : (
                            <Ionicons name="camera" size={26} color="#9C978C" />
                        )}
                    </Pressable>
                    <Text className="text-[12px] text-[#6B7280] mt-2">
                        Palitan ang larawan
                    </Text>
                </View>

                {error && (
                    <Text className="text-[13px] text-[#B23A2E] text-center mb-4">
                        {error}
                    </Text>
                )}

                {/* Username */}
                <Text className="text-[13px] font-medium text-[#4B4739] mb-2 ml-1">
                    Username
                </Text>
                <View style={clayRaised} className="mb-4 rounded-2xl">
                    <TextInput
                        value={username}
                        onChangeText={setUsername}
                        autoCapitalize="none"
                        className="bg-[#F0EDE6] rounded-2xl px-4 py-3.5 text-[15px] text-[#1F2A1F]"
                    />
                </View>

                {/* Phone */}
                <Text className="text-[13px] font-medium text-[#4B4739] mb-2 ml-1">
                    Numero ng Telepono
                </Text>
                <View style={clayRaised} className="mb-4 rounded-2xl">
                    <TextInput
                        value={phoneNumber}
                        onChangeText={setPhoneNumber}
                        keyboardType="phone-pad"
                        placeholder="09XX XXX XXXX"
                        placeholderTextColor="#9C978C"
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
                    <Text className="text-[15px] text-[#1F2A1F]">
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

                {/* Language */}
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
                                className={`text-[14px] font-medium ${
                                    language === lang
                                        ? "text-white"
                                        : "text-[#1F2A1F]"
                                }`}
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
                    className="mb-6 rounded-2xl bg-[#F0EDE6] px-4 py-3.5 flex-row items-center justify-between"
                    onPress={() => setShowBarangayModal(true)}
                >
                    <Text className="text-[15px] text-[#1F2A1F]">
                        {barangay}
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

                <ClayButton
                    colors={
                        canSave
                            ? ["#4C7350", "#254631"]
                            : ["#C4BFB2", "#9C978C"]
                    }
                    borderRadius={20}
                    disabled={!canSave}
                    onPress={handleSave}
                >
                    <Text className="text-white font-semibold text-[16px]">
                        {isSaving ? "Sine-save..." : "I-save ang Pagbabago"}
                    </Text>
                </ClayButton>
            </ScrollView>
        </SafeAreaView>
    );
}
