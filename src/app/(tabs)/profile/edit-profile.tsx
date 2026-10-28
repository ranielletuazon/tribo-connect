import { AuthHeader } from "@/components/auth-header";
import { AVATAR_RING } from "@/components/avatar";
import { BackgroundBlobs, clayRaised, pressScale } from "@/components/clay";
import {
    ERROR_COLOR,
    ErrorText,
    FIELD_BG,
    FIELD_BORDER,
} from "@/components/step-section";
import { BARANGAYS } from "@/constants/barangays";
import { PALETTE } from "@/constants/palette";
import { db } from "@/lib/firebase";
import { uploadImage } from "@/lib/upload-image";
import { useAuth } from "@/providers/auth-provider";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { doc, updateDoc } from "firebase/firestore";
import type { ReactNode } from "react";
import { useState } from "react";
import {
    ActivityIndicator,
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

type Field = "username" | "phone";

function FormCard({
    title,
    color,
    children,
}: {
    title: string;
    color: string;
    children: ReactNode;
}) {
    return (
        <View style={clayRaised} className="bg-white rounded-[26px] p-4 mb-4">
            <View className="flex-row items-center gap-2 mb-1">
                <View
                    className="w-1.5 h-4 rounded-full"
                    style={{ backgroundColor: color }}
                />
                <Text
                    className="text-[15px] font-extrabold"
                    style={{ color: PALETTE.ink }}
                >
                    {title}
                </Text>
            </View>
            {children}
        </View>
    );
}

function FieldLabel({ children }: { children: string }) {
    return (
        <Text
            className="text-[12.5px] font-semibold mt-3.5 mb-2 ml-1"
            style={{ color: PALETTE.muted }}
        >
            {children}
        </Text>
    );
}

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
    const [birthdate, setBirthdate] = useState<Date | null>(initialBirthdate);
    const [phoneNumber, setPhoneNumber] = useState(profile?.phoneNumber ?? "");
    const [imageUri, setImageUri] = useState<string | null>(
        profile?.photoURL ?? null,
    );

    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showBarangayModal, setShowBarangayModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [focusedField, setFocusedField] = useState<Field | null>(null);

    const hasChanges =
        username.trim() !== (profile?.username ?? "") ||
        barangay !== (profile?.barangay ?? null) ||
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

    const fieldBorder = (field: Field) =>
        focusedField === field ? PALETTE.forest : FIELD_BORDER;

    return (
        <SafeAreaView
            className="flex-1"
            style={{ backgroundColor: PALETTE.cream }}
            edges={["top"]}
        >
            <BackgroundBlobs colors={[PALETTE.leaf, PALETTE.gold]} />

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <ScrollView
                    contentContainerClassName="px-5 pt-4 pb-10"
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <AuthHeader title="I-edit ang Profile" />

                    {/* Avatar */}
                    <View className="items-center mb-6 mt-1">
                        <Pressable onPress={handlePickImage} disabled={isSaving}>
                            {({ pressed }) => (
                                <View style={pressScale(pressed)}>
                                    {imageUri ? (
                                        <LinearGradient
                                            colors={AVATAR_RING}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                            style={[
                                                clayRaised,
                                                {
                                                    borderRadius: 999,
                                                    padding: 3,
                                                },
                                            ]}
                                        >
                                            <Image
                                                source={{ uri: imageUri }}
                                                className="w-28 h-28 rounded-full border-[3px] border-white"
                                                resizeMode="cover"
                                            />
                                        </LinearGradient>
                                    ) : (
                                        <View
                                            className="w-[118px] h-[118px] rounded-full items-center justify-center border-2 border-dashed"
                                            style={{
                                                backgroundColor:
                                                    "rgba(62,123,79,0.08)",
                                                borderColor:
                                                    "rgba(62,123,79,0.35)",
                                            }}
                                        >
                                            <Ionicons
                                                name="person"
                                                size={44}
                                                color="rgba(62,123,79,0.45)"
                                            />
                                        </View>
                                    )}
                                    <LinearGradient
                                        colors={["#56A06A", "#2F6540"]}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={[
                                            clayRaised,
                                            {
                                                position: "absolute",
                                                right: 0,
                                                bottom: 2,
                                                width: 36,
                                                height: 36,
                                                borderRadius: 18,
                                                alignItems: "center",
                                                justifyContent: "center",
                                                borderWidth: 3,
                                                borderColor: PALETTE.cream,
                                            },
                                        ]}
                                    >
                                        <Ionicons
                                            name="camera"
                                            size={15}
                                            color="#fff"
                                        />
                                    </LinearGradient>
                                </View>
                            )}
                        </Pressable>
                        <Text
                            className="text-[12.5px] font-semibold mt-2.5"
                            style={{ color: PALETTE.forest }}
                        >
                            {imageUri !== (profile?.photoURL ?? null)
                                ? "Bagong larawan, i-save para magamit"
                                : "Pindutin para palitan ang larawan"}
                        </Text>
                    </View>

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

                    {/* Personal info */}
                    <FormCard
                        title="Personal na Impormasyon"
                        color={PALETTE.forest}
                    >
                        <FieldLabel>Username</FieldLabel>
                        <View
                            className="flex-row items-center gap-2.5 rounded-2xl px-3.5 border-[1.5px] mb-1"
                            style={{
                                backgroundColor: FIELD_BG,
                                borderColor:
                                    username.trim().length === 0
                                        ? ERROR_COLOR
                                        : fieldBorder("username"),
                            }}
                        >
                            <Ionicons
                                name="at"
                                size={17}
                                color={
                                    focusedField === "username"
                                        ? PALETTE.forest
                                        : "#B5AFA0"
                                }
                            />
                            <TextInput
                                value={username}
                                onChangeText={setUsername}
                                onFocus={() => setFocusedField("username")}
                                onBlur={() => setFocusedField(null)}
                                autoCapitalize="none"
                                autoCorrect={false}
                                editable={!isSaving}
                                className="flex-1 py-3.5 text-[15px]"
                                style={{ color: PALETTE.ink }}
                            />
                        </View>
                        {username.trim().length === 0 && (
                            <ErrorText>Kailangan ang username.</ErrorText>
                        )}

                        <FieldLabel>Numero ng Telepono</FieldLabel>
                        <View
                            className="flex-row items-center gap-2.5 rounded-2xl px-3.5 border-[1.5px]"
                            style={{
                                backgroundColor: FIELD_BG,
                                borderColor: fieldBorder("phone"),
                            }}
                        >
                            <Ionicons
                                name="call-outline"
                                size={17}
                                color={
                                    focusedField === "phone"
                                        ? PALETTE.forest
                                        : "#B5AFA0"
                                }
                            />
                            <TextInput
                                value={phoneNumber}
                                onChangeText={setPhoneNumber}
                                onFocus={() => setFocusedField("phone")}
                                onBlur={() => setFocusedField(null)}
                                keyboardType="phone-pad"
                                placeholder="09XX XXX XXXX"
                                placeholderTextColor="#B5AFA0"
                                editable={!isSaving}
                                className="flex-1 py-3.5 text-[15px]"
                                style={{ color: PALETTE.ink }}
                            />
                            <Text className="text-[10.5px] font-semibold text-[#B5AFA0]">
                                Opsyonal
                            </Text>
                        </View>

                        <FieldLabel>Kaarawan</FieldLabel>
                        <Pressable
                            onPress={() => setShowDatePicker(true)}
                            disabled={isSaving}
                        >
                            {({ pressed }) => (
                                <View
                                    className="flex-row items-center gap-2.5 rounded-2xl px-3.5 py-3.5 border-[1.5px]"
                                    style={[
                                        pressScale(pressed),
                                        {
                                            backgroundColor: FIELD_BG,
                                            borderColor: showDatePicker
                                                ? PALETTE.forest
                                                : FIELD_BORDER,
                                        },
                                    ]}
                                >
                                    <Ionicons
                                        name="calendar-outline"
                                        size={17}
                                        color={
                                            showDatePicker
                                                ? PALETTE.forest
                                                : "#B5AFA0"
                                        }
                                    />
                                    <Text
                                        className="flex-1 text-[15px]"
                                        style={{
                                            color: birthdate
                                                ? PALETTE.ink
                                                : "#B5AFA0",
                                        }}
                                    >
                                        {birthdate
                                            ? birthdate.toLocaleDateString(
                                                  "fil-PH",
                                                  {
                                                      year: "numeric",
                                                      month: "long",
                                                      day: "numeric",
                                                  },
                                              )
                                            : "Pumili ng petsa"}
                                    </Text>
                                    <Ionicons
                                        name="chevron-down"
                                        size={16}
                                        color="#B5AFA0"
                                    />
                                </View>
                            )}
                        </Pressable>
                        {showDatePicker && (
                            <DateTimePicker
                                value={birthdate ?? new Date(2000, 0, 1)}
                                mode="date"
                                display={
                                    Platform.OS === "ios" ? "spinner" : "default"
                                }
                                maximumDate={new Date()}
                                onValueChange={(_, selectedDate) => {
                                    setShowDatePicker(Platform.OS === "ios");
                                    if (selectedDate) setBirthdate(selectedDate);
                                }}
                                onDismiss={() => setShowDatePicker(false)}
                            />
                        )}
                    </FormCard>

                    {/* Location */}
                    <FormCard title="Lokasyon" color={PALETTE.gold}>
                        <FieldLabel>Barangay</FieldLabel>
                        <Pressable
                            onPress={() => setShowBarangayModal(true)}
                            disabled={isSaving}
                        >
                            {({ pressed }) => (
                                <View
                                    className="flex-row items-center gap-3 rounded-2xl px-3.5 py-3 border-[1.5px]"
                                    style={[
                                        pressScale(pressed),
                                        {
                                            backgroundColor: FIELD_BG,
                                            borderColor: FIELD_BORDER,
                                        },
                                    ]}
                                >
                                    <View
                                        className="w-9 h-9 rounded-full items-center justify-center"
                                        style={{
                                            backgroundColor: PALETTE.forest,
                                        }}
                                    >
                                        <Ionicons
                                            name="location"
                                            size={16}
                                            color="#fff"
                                        />
                                    </View>
                                    <Text
                                        className="flex-1 text-[15px] font-semibold"
                                        style={{
                                            color: barangay
                                                ? PALETTE.ink
                                                : "#B5AFA0",
                                        }}
                                    >
                                        {barangay ?? "Pumili ng barangay"}
                                    </Text>
                                    <Text
                                        className="text-[12px] font-bold"
                                        style={{ color: PALETTE.forest }}
                                    >
                                        Palitan
                                    </Text>
                                    <Ionicons
                                        name="chevron-down"
                                        size={16}
                                        color={PALETTE.forest}
                                    />
                                </View>
                            )}
                        </Pressable>
                    </FormCard>

                    {/* Save */}
                    <Pressable
                        disabled={!canSave}
                        onPress={handleSave}
                        accessibilityRole="button"
                        className="mt-1"
                    >
                        {({ pressed }) => (
                            <LinearGradient
                                colors={
                                    canSave
                                        ? ["#56A06A", "#2F6540"]
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
                                {isSaving ? (
                                    <ActivityIndicator
                                        size="small"
                                        color="#fff"
                                    />
                                ) : (
                                    <Ionicons
                                        name="checkmark-circle"
                                        size={19}
                                        color="#fff"
                                    />
                                )}
                                <Text className="text-white font-bold text-[16px]">
                                    {isSaving
                                        ? "Sine-save..."
                                        : "I-save ang Pagbabago"}
                                </Text>
                            </LinearGradient>
                        )}
                    </Pressable>
                    {!hasChanges && !isSaving && (
                        <Text className="text-[12px] text-[#9C978C] text-center mt-2.5">
                            Wala pang binago.
                        </Text>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Barangay picker */}
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
                        className="rounded-t-[30px] max-h-[75%]"
                        style={{ backgroundColor: PALETTE.cream }}
                        onPress={(e) => e.stopPropagation()}
                    >
                        <View className="items-center pt-3 pb-1">
                            <View className="w-10 h-1.5 rounded-full bg-[#E5E1D8]" />
                        </View>
                        <View className="flex-row items-center justify-between px-5 pt-2 pb-3">
                            <Text
                                className="text-[17px] font-extrabold"
                                style={{ color: PALETTE.ink }}
                            >
                                Piliin ang Barangay
                            </Text>
                            <Pressable
                                onPress={() => setShowBarangayModal(false)}
                                className="w-9 h-9 rounded-full bg-[#F0EDE6] items-center justify-center"
                            >
                                <Ionicons
                                    name="close"
                                    size={19}
                                    color={PALETTE.ink}
                                />
                            </Pressable>
                        </View>
                        <ScrollView contentContainerClassName="px-4 pb-10 gap-1.5">
                            {BARANGAYS.map((b) => {
                                const selected = barangay === b;
                                return (
                                    <Pressable
                                        key={b}
                                        className="flex-row items-center gap-3 rounded-2xl px-3.5 py-3"
                                        style={{
                                            backgroundColor: selected
                                                ? "rgba(62,123,79,0.12)"
                                                : "transparent",
                                        }}
                                        onPress={() => {
                                            setBarangay(b);
                                            setShowBarangayModal(false);
                                        }}
                                    >
                                        <Ionicons
                                            name="location-outline"
                                            size={18}
                                            color={
                                                selected
                                                    ? PALETTE.forest
                                                    : "#9C978C"
                                            }
                                        />
                                        <Text
                                            className={`flex-1 text-[15px] ${selected ? "font-bold" : ""}`}
                                            style={{
                                                color: selected
                                                    ? PALETTE.forest
                                                    : PALETTE.ink,
                                            }}
                                        >
                                            {b}
                                        </Text>
                                        {selected && (
                                            <Ionicons
                                                name="checkmark-circle"
                                                size={20}
                                                color={PALETTE.forest}
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
