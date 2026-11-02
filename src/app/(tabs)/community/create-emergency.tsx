import { BackgroundBlobs, clayRaised, pressScale } from "@/components/clay";
import {
    ERROR_COLOR,
    FIELD_BG,
    FIELD_BORDER,
    StepSection,
} from "@/components/step-section";
import { BARANGAY, MUNICIPALITY, PROVINCE } from "@/constants/barangays";
import { PALETTE } from "@/constants/palette";
import { useLanguage } from "@/hooks/use-language";
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
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { collection, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { useState } from "react";
import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
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

export default function CreateEmergency() {
    const router = useRouter();
    const { user, profile } = useAuth();
    const { t } = useLanguage();
    const isAdmin = profile?.role === "admin";

    const [severity, setSeverity] = useState<AnnouncementSeverity>("abiso");
    const [category, setCategory] = useState<AnnouncementCategory | null>(
        null,
    );
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [isPosting, setIsPosting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [focusedField, setFocusedField] = useState<
        "title" | "content" | null
    >(null);

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
                targetBarangay: BARANGAY,
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
            setError(
                t(
                    "Nabigo ang pag-post ng anunsyo. Pakisubukang muli.",
                    "Posting the announcement failed. Please try again.",
                ),
            );
        } finally {
            setIsPosting(false);
        }
    };

    // only admins can open this screen, everyone else gets sent back
    if (!isAdmin) {
        return (
            <SafeAreaView
                className="flex-1 items-center justify-center px-8"
                style={{ backgroundColor: PALETTE.cream }}
            >
                <View
                    className="w-16 h-16 rounded-full items-center justify-center mb-3"
                    style={{ backgroundColor: "rgba(217,115,63,0.12)" }}
                >
                    <Ionicons
                        name="lock-closed"
                        size={28}
                        color={PALETTE.terracotta}
                    />
                </View>
                <Text
                    className="text-center text-[13.5px] mb-5"
                    style={{ color: PALETTE.muted }}
                >
                    {t(
                        "Ang mga admin lamang ang maaaring gumawa ng anunsyo.",
                        "Only admins can create announcements.",
                    )}
                </Text>
                <Pressable
                    onPress={() => router.back()}
                    className="rounded-full px-5 py-2.5"
                    style={{ backgroundColor: PALETTE.forest }}
                >
                    <Text className="text-[13.5px] font-bold text-white">
                        {t("Bumalik", "Go Back")}
                    </Text>
                </Pressable>
            </SafeAreaView>
        );
    }

    const levelColors: [string, string] = [level.colorLight, level.colorDark];

    return (
        <SafeAreaView
            className="flex-1"
            style={{ backgroundColor: PALETTE.cream }}
            edges={["top"]}
        >
            <BackgroundBlobs
                colors={[level.colorLight, PALETTE.gold]}
                opacity={[0.18, 0.16]}
            />

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                {/* Header */}
                <View className="flex-row items-center gap-3 px-5 pt-4 pb-3">
                    <Pressable
                        onPress={() => router.back()}
                        disabled={isPosting}
                        className="w-10 h-10 rounded-full bg-[#F0EDE6] items-center justify-center"
                        style={clayRaised}
                    >
                        <Ionicons name="close" size={21} color={PALETTE.ink} />
                    </Pressable>
                    <Text
                        className="flex-1 text-center text-[15px] font-bold"
                        style={{ color: PALETTE.ink }}
                    >
                        {t("Bagong Anunsyo", "New Announcement")}
                    </Text>
                    <Pressable disabled={!canPost} onPress={handlePost}>
                        {({ pressed }) => (
                            <LinearGradient
                                colors={
                                    canPost
                                        ? levelColors
                                        : ["#E5E1D8", "#E5E1D8"]
                                }
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={[
                                    canPost ? clayRaised : null,
                                    pressScale(pressed),
                                    {
                                        borderRadius: 999,
                                        paddingHorizontal: 16,
                                        paddingVertical: 9,
                                    },
                                ]}
                            >
                                <Text
                                    className="text-[13.5px] font-bold"
                                    style={{
                                        color: canPost ? "#fff" : "#9C978C",
                                    }}
                                >
                                    {isPosting
                                        ? t("Nagpopost...", "Posting...")
                                        : t("I-post", "Post")}
                                </Text>
                            </LinearGradient>
                        )}
                    </Pressable>
                </View>

                <ScrollView
                    contentContainerClassName="px-5 pt-1 pb-10"
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Preview that follows the selected alert level */}
                    <LinearGradient
                        colors={levelColors}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{
                            borderRadius: 28,
                            overflow: "hidden",
                            marginBottom: 20,
                            shadowColor: level.colorDark,
                            shadowOffset: { width: 0, height: 8 },
                            shadowOpacity: 0.3,
                            shadowRadius: 14,
                            elevation: 9,
                        }}
                    >
                        {/* big faded icon as a background decoration */}
                        <View
                            pointerEvents="none"
                            className="absolute"
                            style={{ right: -20, bottom: -24, opacity: 0.16 }}
                        >
                            <Ionicons
                                name={
                                    category
                                        ? CATEGORIES[category].icon
                                        : "megaphone"
                                }
                                size={120}
                                color="#fff"
                            />
                        </View>

                        <View className="p-5">
                            <View className="flex-row items-center gap-1.5 mb-3">
                                <View className="flex-row items-center gap-1 rounded-full px-2.5 py-1 bg-black/20 border border-white/25">
                                    <Ionicons
                                        name="eye-outline"
                                        size={11}
                                        color="#fff"
                                    />
                                    <Text className="text-[10px] font-bold text-white tracking-widest">
                                        PREVIEW
                                    </Text>
                                </View>
                            </View>
                            <View className="flex-row items-center gap-3">
                                <View className="w-12 h-12 rounded-2xl bg-white items-center justify-center">
                                    <Ionicons
                                        name={level.icon}
                                        size={24}
                                        color={level.colorDark}
                                    />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-[11px] font-extrabold text-white/85 tracking-wider">
                                        {t(level.label, level.labelEn).toUpperCase()}
                                        {category
                                            ? ` · ${t(CATEGORIES[category].label, CATEGORIES[category].labelEn).toUpperCase()}`
                                            : ""}
                                    </Text>
                                    <Text
                                        className="text-[17px] font-extrabold text-white mt-0.5"
                                        numberOfLines={2}
                                    >
                                        {title.trim() ||
                                            t(
                                                "Opisyal na Anunsyo",
                                                "Official Announcement",
                                            )}
                                    </Text>
                                </View>
                            </View>
                            <View className="flex-row items-center gap-1 mt-3">
                                <Ionicons
                                    name="location"
                                    size={12}
                                    color="rgba(255,255,255,0.85)"
                                />
                                <Text className="text-[12px] text-white/85">
                                    Barangay {BARANGAY}
                                </Text>
                            </View>
                        </View>
                    </LinearGradient>

                    {error && (
                        <View
                            className="flex-row items-center gap-2.5 rounded-2xl px-4 py-3 mb-4 border"
                            style={{
                                backgroundColor: "rgba(192,57,43,0.08)",
                                borderColor: "rgba(192,57,43,0.25)",
                            }}
                        >
                            <Ionicons
                                name="alert-circle"
                                size={18}
                                color={ERROR_COLOR}
                            />
                            <Text
                                className="flex-1 text-[13px]"
                                style={{ color: ERROR_COLOR }}
                            >
                                {error}
                            </Text>
                        </View>
                    )}

                    {/* Step 1: alert level */}
                    <StepSection
                        step={1}
                        title={t("Antas ng Alerto", "Alert Level")}
                        hint={t(
                            "Gaano kaseryoso ang sitwasyon",
                            "How serious the situation is",
                        )}
                        done
                    >
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
                                        {({ pressed }) => (
                                            <LinearGradient
                                                colors={
                                                    selected
                                                        ? [
                                                              item.colorLight,
                                                              item.colorDark,
                                                          ]
                                                        : [item.tint, item.tint]
                                                }
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 1 }}
                                                style={[
                                                    selected
                                                        ? clayRaised
                                                        : null,
                                                    pressScale(pressed),
                                                    {
                                                        borderRadius: 20,
                                                        alignItems: "center",
                                                        paddingVertical: 14,
                                                        paddingHorizontal: 4,
                                                    },
                                                ]}
                                            >
                                                {selected && (
                                                    <View className="absolute top-2 right-2 w-[18px] h-[18px] rounded-full bg-white items-center justify-center">
                                                        <Ionicons
                                                            name="checkmark"
                                                            size={12}
                                                            color={
                                                                item.colorDark
                                                            }
                                                        />
                                                    </View>
                                                )}
                                                <View
                                                    className="w-10 h-10 rounded-2xl items-center justify-center mb-1.5"
                                                    style={{
                                                        backgroundColor:
                                                            selected
                                                                ? "rgba(255,255,255,0.25)"
                                                                : "#fff",
                                                    }}
                                                >
                                                    <Ionicons
                                                        name={item.icon}
                                                        size={21}
                                                        color={
                                                            selected
                                                                ? "#fff"
                                                                : item.colorDark
                                                        }
                                                    />
                                                </View>
                                                <Text
                                                    className="text-[13px] font-extrabold"
                                                    style={{
                                                        color: selected
                                                            ? "#fff"
                                                            : item.colorDark,
                                                    }}
                                                >
                                                    {t(item.label, item.labelEn)}
                                                </Text>
                                                <Text
                                                    className="text-[10px] mt-0.5 text-center"
                                                    style={{
                                                        color: selected
                                                            ? "rgba(255,255,255,0.85)"
                                                            : PALETTE.muted,
                                                    }}
                                                >
                                                    {t(item.description, item.descriptionEn)}
                                                </Text>
                                            </LinearGradient>
                                        )}
                                    </Pressable>
                                );
                            })}
                        </View>
                    </StepSection>

                    {/* Step 2: category */}
                    <StepSection
                        step={2}
                        title={t("Uri ng Anunsyo", "Announcement Type")}
                        hint={t("Pumili ng isa", "Pick one")}
                        done={!!category}
                    >
                        <View className="flex-row flex-wrap justify-between">
                            {CATEGORY_ORDER.map((key) => {
                                const item = CATEGORIES[key];
                                const selected = category === key;
                                return (
                                    <Pressable
                                        key={key}
                                        onPress={() => setCategory(key)}
                                        disabled={isPosting}
                                        style={{
                                            width: "31.5%",
                                            marginBottom: 10,
                                        }}
                                    >
                                        {({ pressed }) => (
                                            <LinearGradient
                                                colors={
                                                    selected
                                                        ? levelColors
                                                        : [FIELD_BG, FIELD_BG]
                                                }
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 1 }}
                                                style={[
                                                    selected
                                                        ? clayRaised
                                                        : null,
                                                    pressScale(pressed),
                                                    {
                                                        borderRadius: 20,
                                                        alignItems: "center",
                                                        paddingVertical: 13,
                                                        borderWidth: selected
                                                            ? 0
                                                            : 1,
                                                        borderColor:
                                                            "#EFE9DE",
                                                    },
                                                ]}
                                            >
                                                <View
                                                    className="w-10 h-10 rounded-2xl items-center justify-center mb-1.5"
                                                    style={{
                                                        backgroundColor:
                                                            selected
                                                                ? "rgba(255,255,255,0.25)"
                                                                : level.tint,
                                                    }}
                                                >
                                                    <Ionicons
                                                        name={item.icon}
                                                        size={19}
                                                        color={
                                                            selected
                                                                ? "#fff"
                                                                : level.colorDark
                                                        }
                                                    />
                                                </View>
                                                <Text
                                                    className="text-[12.5px] font-bold"
                                                    style={{
                                                        color: selected
                                                            ? "#fff"
                                                            : PALETTE.ink,
                                                    }}
                                                >
                                                    {t(item.label, item.labelEn)}
                                                </Text>
                                            </LinearGradient>
                                        )}
                                    </Pressable>
                                );
                            })}
                        </View>
                    </StepSection>

                    {/* Step 3: target area */}
                    <StepSection
                        step={3}
                        title={t("Sakop na Lugar", "Covered Area")}
                        hint={t("Sino ang makakatanggap", "Who will receive it")}
                        done
                    >
                        <View
                            className="flex-row items-center gap-3 rounded-2xl px-3.5 py-3 border-[1.5px]"
                            style={{
                                backgroundColor: FIELD_BG,
                                borderColor: FIELD_BORDER,
                            }}
                        >
                            <View
                                className="w-9 h-9 rounded-full items-center justify-center"
                                style={{
                                    backgroundColor: PALETTE.forest,
                                }}
                            >
                                <Ionicons
                                    name="location"
                                    size={17}
                                    color="#fff"
                                />
                            </View>
                            <View className="flex-1">
                                <Text
                                    className="text-[15px] font-semibold"
                                    style={{ color: PALETTE.ink }}
                                >
                                    Barangay {BARANGAY}
                                </Text>
                                <Text
                                    className="text-[12px]"
                                    style={{ color: PALETTE.muted }}
                                >
                                    {MUNICIPALITY}, {PROVINCE}
                                </Text>
                            </View>
                            <Ionicons
                                name="lock-closed-outline"
                                size={16}
                                color="#B5AFA0"
                            />
                        </View>
                    </StepSection>

                    {/* Step 4: title */}
                    <StepSection
                        step={4}
                        title={t("Pamagat", "Title")}
                        hint={t("Maikli at malinaw", "Short and clear")}
                        done={title.trim().length > 0}
                    >
                        <View
                            className="flex-row items-center gap-2.5 rounded-2xl px-3.5 border-[1.5px]"
                            style={{
                                backgroundColor: FIELD_BG,
                                borderColor:
                                    focusedField === "title"
                                        ? level.colorDark
                                        : FIELD_BORDER,
                            }}
                        >
                            <Ionicons
                                name="create-outline"
                                size={17}
                                color={
                                    focusedField === "title"
                                        ? level.colorDark
                                        : "#B5AFA0"
                                }
                            />
                            <TextInput
                                placeholder={t(
                                    "Hal. Signal No. 2 sa buong bayan",
                                    "E.g. Signal No. 2 across the town",
                                )}
                                placeholderTextColor="#B5AFA0"
                                value={title}
                                onChangeText={setTitle}
                                onFocus={() => setFocusedField("title")}
                                onBlur={() => setFocusedField(null)}
                                maxLength={TITLE_MAX}
                                editable={!isPosting}
                                className="flex-1 py-3.5 text-[15px] font-semibold"
                                style={{ color: PALETTE.ink }}
                            />
                        </View>
                        <Text className="text-[11px] text-[#B5AFA0] text-right mt-2">
                            {title.length}/{TITLE_MAX}
                        </Text>
                    </StepSection>

                    {/* Step 5: details */}
                    <StepSection
                        step={5}
                        title={t("Detalye", "Details")}
                        hint={t(
                            "Ano ang nangyayari at ano ang dapat gawin",
                            "What is happening and what to do",
                        )}
                        done={content.trim().length > 0}
                    >
                        <View
                            className="rounded-2xl px-3.5 pt-3 pb-2 border-[1.5px]"
                            style={{
                                backgroundColor: FIELD_BG,
                                borderColor:
                                    focusedField === "content"
                                        ? level.colorDark
                                        : FIELD_BORDER,
                            }}
                        >
                            <TextInput
                                placeholder={t(
                                    "Ilarawan ang sitwasyon at kung ano ang dapat gawin ng mga residente.",
                                    "Describe the situation and what residents should do.",
                                )}
                                placeholderTextColor="#B5AFA0"
                                value={content}
                                onChangeText={setContent}
                                onFocus={() => setFocusedField("content")}
                                onBlur={() => setFocusedField(null)}
                                maxLength={CONTENT_MAX}
                                multiline
                                textAlignVertical="top"
                                editable={!isPosting}
                                className="text-[15px] leading-[21px] min-h-[140px]"
                                style={{ color: PALETTE.ink }}
                            />
                        </View>
                        <Text className="text-[11px] text-[#B5AFA0] text-right mt-2">
                            {content.length}/{CONTENT_MAX}
                        </Text>
                    </StepSection>

                    {/* Step 6: image */}
                    <StepSection
                        step={6}
                        title={t("Larawan", "Photo")}
                        hint={t("Opsyonal", "Optional")}
                        done={!!imageUri}
                    >
                        {imageUri ? (
                            <View>
                                <Image
                                    source={{ uri: imageUri }}
                                    className="w-full h-56 rounded-[20px]"
                                    resizeMode="cover"
                                />
                                {!isPosting && (
                                    <View className="absolute top-2.5 right-2.5 flex-row gap-2">
                                        <Pressable
                                            onPress={handlePickImage}
                                            className="flex-row items-center gap-1 rounded-full px-3 h-8 bg-black/60"
                                        >
                                            <Ionicons
                                                name="swap-horizontal"
                                                size={14}
                                                color="#fff"
                                            />
                                            <Text className="text-[12px] font-bold text-white">
                                                {t("Palitan", "Change")}
                                            </Text>
                                        </Pressable>
                                        <Pressable
                                            onPress={() => setImageUri(null)}
                                            className="w-8 h-8 rounded-full bg-black/60 items-center justify-center"
                                        >
                                            <Ionicons
                                                name="close"
                                                size={17}
                                                color="#fff"
                                            />
                                        </Pressable>
                                    </View>
                                )}
                            </View>
                        ) : (
                            <Pressable
                                onPress={handlePickImage}
                                disabled={isPosting}
                            >
                                {({ pressed }) => (
                                    <View
                                        className="items-center rounded-[20px] py-6 border-2 border-dashed"
                                        style={[
                                            pressScale(pressed),
                                            {
                                                backgroundColor: level.tint,
                                                borderColor: `${level.colorLight}80`,
                                            },
                                        ]}
                                    >
                                        <LinearGradient
                                            colors={levelColors}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                            style={{
                                                width: 46,
                                                height: 46,
                                                borderRadius: 23,
                                                alignItems: "center",
                                                justifyContent: "center",
                                                marginBottom: 8,
                                            }}
                                        >
                                            <Ionicons
                                                name="image"
                                                size={21}
                                                color="#fff"
                                            />
                                        </LinearGradient>
                                        <Text
                                            className="text-[13.5px] font-bold"
                                            style={{ color: level.colorDark }}
                                        >
                                            {t("Idagdag ng Larawan", "Add a Photo")}
                                        </Text>
                                        <Text
                                            className="text-[11.5px] mt-0.5"
                                            style={{ color: PALETTE.muted }}
                                        >
                                            {t(
                                                "Pindutin para pumili sa gallery",
                                                "Tap to pick from the gallery",
                                            )}
                                        </Text>
                                    </View>
                                )}
                            </Pressable>
                        )}
                    </StepSection>

                    {/* Post */}
                    <Pressable
                        disabled={!canPost}
                        onPress={handlePost}
                        accessibilityRole="button"
                        className="mt-1"
                    >
                        {({ pressed }) => (
                            <LinearGradient
                                colors={
                                    canPost
                                        ? levelColors
                                        : ["#C4BFB2", "#A39E92"]
                                }
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={[
                                    clayRaised,
                                    pressScale(pressed),
                                    {
                                        borderRadius: 22,
                                        paddingVertical: 17,
                                        flexDirection: "row",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: 10,
                                    },
                                ]}
                            >
                                {isPosting ? (
                                    <ActivityIndicator
                                        size="small"
                                        color="#fff"
                                    />
                                ) : (
                                    <Ionicons
                                        name="megaphone"
                                        size={18}
                                        color="#fff"
                                    />
                                )}
                                <Text className="text-white text-[16px] font-bold">
                                    {isPosting
                                        ? t("Nagpopost...", "Posting...")
                                        : t(
                                              "I-post ang Anunsyo",
                                              "Post Announcement",
                                          )}
                                </Text>
                            </LinearGradient>
                        )}
                    </Pressable>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
