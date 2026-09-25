import { ClaySurface, clayRaised } from "@/components/clay";
import { BARANGAYS } from "@/constants/barangays";
import {
    CATEGORIES,
    CATEGORY_ORDER,
    SEVERITIES,
    SEVERITY_ORDER,
    type AnnouncementCategory,
    type AnnouncementSeverity,
} from "@/lib/announcements";
import { db } from "@/lib/firebase";
import { uploadImage } from "@/lib/upload-image";
import { useAuth } from "@/providers/auth-provider";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { collection, doc, serverTimestamp, setDoc } from "firebase/firestore";
import type { ReactNode } from "react";
import { useState } from "react";
import {
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const TITLE_MAX = 120;
const CONTENT_MAX = 3000;

function SectionLabel({ children }: { children: ReactNode }) {
    return (
        <Text className="text-[13px] font-medium text-[#7A6D5C] mb-2.5 ml-1 mt-5">
            {children}
        </Text>
    );
}

export default function CreateEmergency() {
    const router = useRouter();
    const { user, profile } = useAuth();
    const isAdmin = profile?.role === "admin";

    const [severity, setSeverity] = useState<AnnouncementSeverity>("abiso");
    const [category, setCategory] = useState<AnnouncementCategory | null>(
        null,
    );
    const [targetBarangay, setTargetBarangay] = useState<string | null>(null);
    const [showBarangayModal, setShowBarangayModal] = useState(false);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [isPosting, setIsPosting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const level = SEVERITIES[severity];
    const canPost =
        title.trim().length > 0 &&
        content.trim().length > 0 &&
        !!category &&
        !isPosting;

    const handlePickImage = async () => {
        const permission =
            await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) return;

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            quality: 0.8,
        });

        if (!result.canceled) {
            setImageUri(result.assets[0].uri);
        }
    };

    const handlePost = async () => {
        if (!canPost || !category || !user || !profile || !isAdmin) return;
        setError(null);
        setIsPosting(true);

        try {
            const announcementRef = doc(collection(db, "announcements"));

            let imageUrl: string | null = null;
            if (imageUri) {
                imageUrl = await uploadImage(
                    imageUri,
                    `announcements/${announcementRef.id}.jpg`,
                );
            }

            const newAnnouncement = {
                id: announcementRef.id,
                authorId: user.uid,
                authorName: profile.username,
                authorPhotoURL: profile.photoURL ?? null,
                title: title.trim(),
                content: content.trim(),
                category,
                severity,
                targetBarangay,
                imageUrl,
            };

            await setDoc(announcementRef, {
                ...newAnnouncement,
                createdAt: serverTimestamp(),
            });

            router.back();
            router.setParams({
                newAnnouncementJson: JSON.stringify({
                    ...newAnnouncement,
                    createdAt: null,
                }),
            });
        } catch (err) {
            console.error("Create announcement error:", err);
            setError("Nabigo ang pag-post ng anunsyo. Pakisubukang muli.");
        } finally {
            setIsPosting(false);
        }
    };

    // only admins can open this screen, everyone else gets sent back
    if (!isAdmin) {
        return (
            <SafeAreaView className="flex-1 bg-[--main-white] items-center justify-center px-8">
                <Ionicons name="lock-closed" size={36} color="#C4BFB2" />
                <Text className="text-center text-[13.5px] text-[#9C978C] mt-3 mb-5">
                    Ang mga admin lamang ang maaaring gumawa ng anunsyo.
                </Text>
                <Pressable
                    onPress={() => router.back()}
                    className="rounded-full px-5 py-2 bg-[#2F5233]"
                >
                    <Text className="text-[13.5px] font-semibold text-white">
                        Bumalik
                    </Text>
                </Pressable>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-[--main-white]" edges={["top"]}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                {/* Header */}
                <View className="flex-row items-center justify-between px-4 py-3 border-b border-[#EDEAE2]">
                    <Pressable
                        onPress={() => router.back()}
                        className="p-1"
                        disabled={isPosting}
                    >
                        <Ionicons name="close" size={24} color="#1F2A1F" />
                    </Pressable>
                    <Text className="text-[15px] font-bold text-[#1F2A1F]">
                        Bagong Anunsyo
                    </Text>
                    <Pressable
                        disabled={!canPost}
                        onPress={handlePost}
                        className="rounded-full px-4 py-1.5"
                        style={{
                            backgroundColor: canPost
                                ? level.colorDark
                                : "#E5E1D8",
                        }}
                    >
                        <Text
                            className="text-[13.5px] font-semibold"
                            style={{ color: canPost ? "#fff" : "#9C978C" }}
                        >
                            {isPosting ? "Nagpopost..." : "I-post"}
                        </Text>
                    </Pressable>
                </View>

                <ScrollView
                    contentContainerClassName="px-5 pt-4 pb-10"
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Banner that follows the selected alert level */}
                    <ClaySurface
                        colors={[level.colorLight, level.colorDark]}
                        borderRadius={20}
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 12,
                            padding: 16,
                        }}
                    >
                        <View className="w-11 h-11 rounded-full bg-white/20 items-center justify-center">
                            <Ionicons
                                name={
                                    category
                                        ? CATEGORIES[category].icon
                                        : "megaphone"
                                }
                                size={22}
                                color="#fff"
                            />
                        </View>
                        <View className="flex-1">
                            <Text className="text-[11px] font-bold text-white/80 tracking-wider">
                                {level.label.toUpperCase()}
                                {category
                                    ? ` · ${CATEGORIES[category].label.toUpperCase()}`
                                    : ""}
                            </Text>
                            <Text
                                className="text-[15px] font-bold text-white mt-0.5"
                                numberOfLines={2}
                            >
                                {title.trim() || "Opisyal na Anunsyo"}
                            </Text>
                        </View>
                    </ClaySurface>

                    {error && (
                        <Text className="text-[13px] text-[#B23A2E] mt-4">
                            {error}
                        </Text>
                    )}

                    {/* Alert level */}
                    <SectionLabel>Antas ng Alerto</SectionLabel>
                    <View className="flex-row gap-2.5">
                        {SEVERITY_ORDER.map((key) => {
                            const item = SEVERITIES[key];
                            const selected = severity === key;
                            return (
                                <Pressable
                                    key={key}
                                    className="flex-1"
                                    onPress={() => setSeverity(key)}
                                    disabled={isPosting}
                                >
                                    <View
                                        style={[
                                            clayRaised,
                                            {
                                                backgroundColor: selected
                                                    ? item.colorDark
                                                    : item.tint,
                                                borderWidth: 1.5,
                                                borderColor: selected
                                                    ? item.colorDark
                                                    : "transparent",
                                            },
                                        ]}
                                        className="rounded-2xl items-center py-3 px-1"
                                    >
                                        <Ionicons
                                            name={item.icon}
                                            size={20}
                                            color={
                                                selected
                                                    ? "#fff"
                                                    : item.colorDark
                                            }
                                        />
                                        <Text
                                            className="text-[13px] font-bold mt-1"
                                            style={{
                                                color: selected
                                                    ? "#fff"
                                                    : item.colorDark,
                                            }}
                                        >
                                            {item.label}
                                        </Text>
                                        <Text
                                            className="text-[10px] mt-0.5 text-center"
                                            style={{
                                                color: selected
                                                    ? "rgba(255,255,255,0.8)"
                                                    : "#7A6D5C",
                                            }}
                                        >
                                            {item.description}
                                        </Text>
                                    </View>
                                </Pressable>
                            );
                        })}
                    </View>

                    {/* Category */}
                    <SectionLabel>Uri ng Anunsyo</SectionLabel>
                    <View className="flex-row flex-wrap gap-2">
                        {CATEGORY_ORDER.map((key) => {
                            const item = CATEGORIES[key];
                            const selected = category === key;
                            return (
                                <Pressable
                                    key={key}
                                    onPress={() => setCategory(key)}
                                    disabled={isPosting}
                                    className="flex-row items-center gap-1.5 rounded-full px-3.5 py-2"
                                    style={{
                                        backgroundColor: selected
                                            ? level.colorDark
                                            : "#F0EDE6",
                                    }}
                                >
                                    <Ionicons
                                        name={item.icon}
                                        size={15}
                                        color={selected ? "#fff" : "#7A6D5C"}
                                    />
                                    <Text
                                        className="text-[13px] font-medium"
                                        style={{
                                            color: selected
                                                ? "#fff"
                                                : "#1F2A1F",
                                        }}
                                    >
                                        {item.label}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>

                    {/* Target area */}
                    <SectionLabel>Sakop na Lugar</SectionLabel>
                    <Pressable
                        style={clayRaised}
                        className="rounded-2xl bg-[#F0EDE6] px-4 py-3.5 flex-row items-center gap-2.5"
                        onPress={() => setShowBarangayModal(true)}
                        disabled={isPosting}
                    >
                        <Ionicons
                            name={targetBarangay ? "location" : "earth"}
                            size={18}
                            color="#7A6D5C"
                        />
                        <Text className="flex-1 text-[15px] text-[#1F2A1F]">
                            {targetBarangay
                                ? `Barangay ${targetBarangay}`
                                : "Lahat ng Barangay"}
                        </Text>
                        <Ionicons name="chevron-down" size={18} color="#6B7280" />
                    </Pressable>

                    {/* Title */}
                    <SectionLabel>Pamagat</SectionLabel>
                    <TextInput
                        placeholder="Hal. Signal No. 2 sa buong bayan"
                        placeholderTextColor="#9C978C"
                        value={title}
                        onChangeText={setTitle}
                        maxLength={TITLE_MAX}
                        editable={!isPosting}
                        className="rounded-2xl bg-[#F0EDE6] px-4 py-3.5 text-[15px] font-semibold text-[#1F2A1F]"
                    />
                    <Text className="text-[11px] text-[#9C978C] text-right mt-1 mr-1">
                        {title.length}/{TITLE_MAX}
                    </Text>

                    {/* Details */}
                    <SectionLabel>Detalye</SectionLabel>
                    <TextInput
                        placeholder="Ilarawan ang sitwasyon at kung ano ang dapat gawin ng mga residente."
                        placeholderTextColor="#9C978C"
                        value={content}
                        onChangeText={setContent}
                        maxLength={CONTENT_MAX}
                        multiline
                        textAlignVertical="top"
                        editable={!isPosting}
                        className="rounded-2xl bg-[#F0EDE6] px-4 py-3.5 text-[15px] text-[#1F2A1F] leading-[21px] min-h-[140px]"
                    />
                    <Text className="text-[11px] text-[#9C978C] text-right mt-1 mr-1">
                        {content.length}/{CONTENT_MAX}
                    </Text>

                    {/* Image preview */}
                    {imageUri && (
                        <View className="relative mt-4">
                            <Image
                                source={{ uri: imageUri }}
                                className="w-full h-56 rounded-2xl"
                                resizeMode="cover"
                            />
                            {!isPosting && (
                                <Pressable
                                    onPress={() => setImageUri(null)}
                                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 items-center justify-center"
                                >
                                    <Ionicons
                                        name="close"
                                        size={18}
                                        color="#fff"
                                    />
                                </Pressable>
                            )}
                        </View>
                    )}

                    {/* Add image */}
                    <Pressable
                        onPress={handlePickImage}
                        disabled={isPosting}
                        className="flex-row items-center justify-between border border-[#EDEAE2] rounded-2xl px-4 py-3 mt-4"
                    >
                        <Text className="text-[13.5px] font-medium text-[#1F2A1F]">
                            {imageUri ? "Palitan ang Larawan" : "Idagdag ng Larawan"}
                        </Text>
                        <View
                            className="w-9 h-9 rounded-full items-center justify-center"
                            style={{ backgroundColor: level.colorDark }}
                        >
                            <Ionicons name="image" size={18} color="#fff" />
                        </View>
                    </Pressable>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Target barangay picker */}
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
                            Sakop na Lugar
                        </Text>
                        <ScrollView className="px-4 pb-8">
                            {[null, ...BARANGAYS].map((b) => {
                                const selected = targetBarangay === b;
                                return (
                                    <Pressable
                                        key={b ?? "all"}
                                        className="flex-row items-center justify-between py-3.5 border-b border-[#EDEAE2]"
                                        onPress={() => {
                                            setTargetBarangay(b);
                                            setShowBarangayModal(false);
                                        }}
                                    >
                                        <Text
                                            className={`text-[15px] ${
                                                selected
                                                    ? "font-semibold"
                                                    : "text-[#1F2A1F]"
                                            }`}
                                            style={
                                                selected
                                                    ? { color: level.colorDark }
                                                    : undefined
                                            }
                                        >
                                            {b ?? "Lahat ng Barangay"}
                                        </Text>
                                        {selected && (
                                            <Ionicons
                                                name="checkmark"
                                                size={18}
                                                color={level.colorDark}
                                            />
                                        )}
                                    </Pressable>
                                );
                            })}
                        </ScrollView>
                    </Pressable>
                </Pressable>
            </Modal>
        </SafeAreaView>
    );
}
