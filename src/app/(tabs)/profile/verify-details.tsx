import { AuthHeader } from "@/components/auth-header";
import { ClayButton, clayRaised } from "@/components/clay";
import { VerificationSteps } from "@/components/verification-steps";
import { BARANGAYS } from "@/constants/barangays";
import { functions, storage } from "@/lib/firebase";
import {
    VERIFICATION_TYPES,
    callableErrorMessage,
    type ExtractedFields,
    type VerificationType,
} from "@/lib/verification";
import { useAuth } from "@/providers/auth-provider";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router, useLocalSearchParams } from "expo-router";
import { httpsCallable } from "firebase/functions";
import { getDownloadURL, ref } from "firebase/storage";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
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

const EMPTY_FIELDS: ExtractedFields = {
    lastName: "",
    firstName: "",
    middleName: "",
    birthDate: "",
    sex: "",
    address: "",
    idNumber: "",
};

// the same limits as submitVerification in functions/src/verification.ts
const MAX_LENGTH = {
    lastName: 60,
    firstName: 80,
    middleName: 60,
    address: 200,
    idNumber: 40,
};

const submitVerification = httpsCallable<Record<string, string>, unknown>(
    functions,
    "submitVerification",
);

function parseFields(json: string | undefined): ExtractedFields {
    try {
        return { ...EMPTY_FIELDS, ...JSON.parse(json ?? "{}") };
    } catch {
        return EMPTY_FIELDS;
    }
}

// "1990-01-15" to a local date, without the timezone shift of new Date(string)
function parseBirthDate(value: string): Date | null {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return null;
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function formatBirthDate(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${date.getFullYear()}-${month}-${day}`;
}

function FieldLabel({
    label,
    fromId,
    optional,
}: {
    label: string;
    // left out for fields the ID doesn't have, like the barangay
    fromId?: boolean;
    optional?: boolean;
}) {
    return (
        <View className="flex-row items-center justify-between mb-2 ml-1 mt-4">
            <Text className="text-[13px] font-medium text-[#4B4739]">
                {label}
                {optional && (
                    <Text className="text-[#9C978C] font-normal">
                        {" "}
                        (opsyonal)
                    </Text>
                )}
            </Text>
            {fromId === undefined ? null : fromId ? (
                <View className="flex-row items-center gap-1 bg-[#EAF1FC] rounded-full px-2 py-0.5">
                    <Ionicons name="scan" size={10} color="#2A6FDB" />
                    <Text className="text-[10px] font-semibold text-[#2A6FDB]">
                        Mula sa ID
                    </Text>
                </View>
            ) : (
                !optional && (
                    <Text className="text-[10.5px] text-[#A85A30]">
                        Hindi nabasa, pakipunan
                    </Text>
                )
            )}
        </View>
    );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
    return (
        <View
            style={clayRaised}
            className="bg-[--main-white] rounded-[20px] px-4 pb-4 pt-1 mb-5"
        >
            <Text className="text-[14px] font-bold text-[#1F2A1F] mt-3">
                {title}
            </Text>
            {children}
        </View>
    );
}

const inputClass =
    "rounded-2xl bg-[#F0EDE6] px-4 py-3.5 text-[15px] text-[#1F2A1F]";

export default function VerifyDetails() {
    const params = useLocalSearchParams<{
        idType: VerificationType;
        imagePath: string;
        fieldsJson?: string;
        typeMatch?: string;
    }>();
    const { profile } = useAuth();
    const idType = params.idType;
    const idInfo = VERIFICATION_TYPES[idType] ?? VERIFICATION_TYPES["iba-pa"];

    // what the OCR read, used to mark which fields came from the ID
    const [scanned] = useState(() => parseFields(params.fieldsJson));

    const [lastName, setLastName] = useState(scanned.lastName);
    const [firstName, setFirstName] = useState(scanned.firstName);
    const [middleName, setMiddleName] = useState(scanned.middleName);
    const [birthDate, setBirthDate] = useState<Date | null>(() =>
        parseBirthDate(scanned.birthDate),
    );
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [sex, setSex] = useState(scanned.sex);
    const [address, setAddress] = useState(scanned.address);
    const [barangay, setBarangay] = useState<string | null>(
        profile?.barangay ?? null,
    );
    const [showBarangayModal, setShowBarangayModal] = useState(false);
    const [idNumber, setIdNumber] = useState(scanned.idNumber);
    const [confirmed, setConfirmed] = useState(false);

    const [idImageUrl, setIdImageUrl] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // thumbnail of the uploaded ID so the user can compare while checking
    useEffect(() => {
        if (!params.imagePath) return;
        getDownloadURL(ref(storage, params.imagePath))
            .then(setIdImageUrl)
            .catch((err) => console.error("Load ID image error:", err));
    }, [params.imagePath]);

    const isComplete =
        lastName.trim().length > 0 &&
        firstName.trim().length > 0 &&
        !!birthDate &&
        (sex === "M" || sex === "F") &&
        address.trim().length > 0 &&
        !!barangay &&
        idNumber.trim().length > 0;
    const canSubmit = isComplete && confirmed && !isSubmitting;

    const handleSubmit = async () => {
        if (!canSubmit || !birthDate || !barangay) return;
        setError(null);
        setIsSubmitting(true);
        try {
            await submitVerification({
                idType,
                imagePath: params.imagePath,
                lastName: lastName.trim(),
                firstName: firstName.trim(),
                middleName: middleName.trim(),
                birthDate: formatBirthDate(birthDate),
                sex,
                address: address.trim(),
                barangay,
                idNumber: idNumber.trim(),
            });
            setIsSubmitted(true);
        } catch (err) {
            console.error("Submit verification error:", err);
            setError(
                callableErrorMessage(
                    err,
                    "Hindi naipadala ang beripikasyon. Pakisubukang muli.",
                ),
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSubmitted) {
        return (
            <SafeAreaView className="flex-1 bg-[--main-white] px-8 items-center justify-center">
                <View className="w-24 h-24 rounded-full bg-[#EEF3EE] items-center justify-center mb-5">
                    <View className="w-16 h-16 rounded-full bg-[#2F5233] items-center justify-center">
                        <Ionicons name="checkmark" size={36} color="#fff" />
                    </View>
                </View>
                <Text className="text-[20px] font-bold text-[#1F2A1F] text-center">
                    Naipadala na!
                </Text>
                <Text className="text-[13.5px] text-[#7A6D5C] text-center leading-5 mt-2 mb-8">
                    Susuriin ng admin ng barangay ang iyong impormasyon.
                    Makikita mo ang status nito sa Beripikasyon page ng iyong
                    profile.
                </Text>
                <View className="self-stretch">
                    <ClayButton
                        colors={["#4C7350", "#254631"]}
                        borderRadius={20}
                        onPress={() =>
                            router.dismissTo("/(tabs)/profile/verify")
                        }
                    >
                        <Text className="text-white font-semibold text-[16px]">
                            Tapos Na
                        </Text>
                    </ClayButton>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-[--main-white]" edges={["top"]}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <ScrollView
                    contentContainerClassName="px-6 pt-4 pb-8"
                    keyboardShouldPersistTaps="handled"
                >
                    <AuthHeader title="Beripikasyon" />
                    <VerificationSteps current={1} />

                    <Text className="text-[13.5px] text-[#7A6D5C] leading-5 mb-4 px-1">
                        Nabasa namin ang iyong ID. Suriing mabuti ang bawat
                        field at itama kung may mali bago isumite.
                    </Text>

                    {/* the OCR didn't find the words expected on this ID */}
                    {params.typeMatch === "0" && (
                        <View className="flex-row gap-3 bg-[#FBF1E8] rounded-2xl p-4 mb-5">
                            <Ionicons
                                name="warning"
                                size={18}
                                color="#A85A30"
                            />
                            <Text className="flex-1 text-[12.5px] text-[#7A6D5C] leading-[18px]">
                                Mukhang hindi ito {idInfo.label}. Kung mali ang
                                napiling ID, bumalik at pumili muli.
                            </Text>
                        </View>
                    )}

                    {/* ID preview */}
                    <View
                        style={clayRaised}
                        className="bg-[--main-white] rounded-[20px] p-3 mb-5 flex-row items-center gap-3"
                    >
                        <View className="w-24 h-16 rounded-xl overflow-hidden bg-[#EDEAE2] items-center justify-center">
                            {idImageUrl ? (
                                <Image
                                    source={{ uri: idImageUrl }}
                                    className="w-full h-full"
                                    resizeMode="cover"
                                />
                            ) : (
                                <Ionicons
                                    name={idInfo.icon}
                                    size={22}
                                    color="#C4BFB2"
                                />
                            )}
                        </View>
                        <View className="flex-1">
                            <Text className="text-[14px] font-semibold text-[#1F2A1F]">
                                {idInfo.label}
                            </Text>
                            <View className="flex-row items-center gap-1 mt-0.5">
                                <Ionicons
                                    name="checkmark-circle"
                                    size={13}
                                    color="#3F5C42"
                                />
                                <Text className="text-[12px] text-[#3F5C42]">
                                    Malinaw at nabasa
                                </Text>
                            </View>
                        </View>
                        <Pressable
                            onPress={() => router.back()}
                            disabled={isSubmitting}
                            className="px-3 py-1.5 rounded-full bg-[#F0EDE6]"
                        >
                            <Text className="text-[12px] font-semibold text-[#1F2A1F]">
                                Palitan
                            </Text>
                        </Pressable>
                    </View>

                    {/* Name */}
                    <Card title="Pangalan">
                        <FieldLabel
                            label="Apelyido"
                            fromId={!!scanned.lastName}
                        />
                        <TextInput
                            value={lastName}
                            onChangeText={setLastName}
                            placeholder="Hal. Dela Cruz"
                            placeholderTextColor="#9C978C"
                            maxLength={MAX_LENGTH.lastName}
                            autoCapitalize="words"
                            editable={!isSubmitting}
                            className={inputClass}
                        />
                        <FieldLabel
                            label="Pangalan"
                            fromId={!!scanned.firstName}
                        />
                        <TextInput
                            value={firstName}
                            onChangeText={setFirstName}
                            placeholder="Hal. Juan"
                            placeholderTextColor="#9C978C"
                            maxLength={MAX_LENGTH.firstName}
                            autoCapitalize="words"
                            editable={!isSubmitting}
                            className={inputClass}
                        />
                        <FieldLabel
                            label="Gitnang Pangalan"
                            fromId={!!scanned.middleName}
                            optional
                        />
                        <TextInput
                            value={middleName}
                            onChangeText={setMiddleName}
                            placeholder="Hal. Santos"
                            placeholderTextColor="#9C978C"
                            maxLength={MAX_LENGTH.middleName}
                            autoCapitalize="words"
                            editable={!isSubmitting}
                            className={inputClass}
                        />
                    </Card>

                    {/* Personal details */}
                    <Card title="Personal na Detalye">
                        <FieldLabel
                            label="Petsa ng Kapanganakan"
                            fromId={!!scanned.birthDate}
                        />
                        <Pressable
                            onPress={() => setShowDatePicker(true)}
                            disabled={isSubmitting}
                            className="rounded-2xl bg-[#F0EDE6] px-4 py-3.5 flex-row items-center justify-between"
                        >
                            <Text
                                className={`text-[15px] ${birthDate ? "text-[#1F2A1F]" : "text-[#9C978C]"}`}
                            >
                                {birthDate
                                    ? birthDate.toLocaleDateString("fil-PH", {
                                          year: "numeric",
                                          month: "long",
                                          day: "numeric",
                                      })
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
                                value={birthDate ?? new Date(2000, 0, 1)}
                                mode="date"
                                display={
                                    Platform.OS === "ios"
                                        ? "spinner"
                                        : "default"
                                }
                                maximumDate={new Date()}
                                onValueChange={(_, selectedDate) => {
                                    setShowDatePicker(Platform.OS === "ios");
                                    if (selectedDate)
                                        setBirthDate(selectedDate);
                                }}
                                onDismiss={() => setShowDatePicker(false)}
                            />
                        )}

                        <FieldLabel label="Kasarian" fromId={!!scanned.sex} />
                        <View className="flex-row gap-2.5">
                            {(
                                [
                                    ["M", "Lalaki", "male"],
                                    ["F", "Babae", "female"],
                                ] as const
                            ).map(([value, label, icon]) => (
                                <Pressable
                                    key={value}
                                    onPress={() => setSex(value)}
                                    disabled={isSubmitting}
                                    className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl py-3.5"
                                    style={{
                                        backgroundColor:
                                            sex === value
                                                ? "#2F5233"
                                                : "#F0EDE6",
                                    }}
                                >
                                    <Ionicons
                                        name={icon}
                                        size={16}
                                        color={
                                            sex === value ? "#fff" : "#7A6D5C"
                                        }
                                    />
                                    <Text
                                        className="text-[14px] font-semibold"
                                        style={{
                                            color:
                                                sex === value
                                                    ? "#fff"
                                                    : "#1F2A1F",
                                        }}
                                    >
                                        {label}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                    </Card>

                    {/* Address */}
                    <Card title="Tirahan">
                        <FieldLabel
                            label="Buong Tirahan"
                            fromId={!!scanned.address}
                        />
                        <TextInput
                            value={address}
                            onChangeText={setAddress}
                            placeholder="Bahay/Blg., Kalye, Barangay, Bayan, Probinsya"
                            placeholderTextColor="#9C978C"
                            maxLength={MAX_LENGTH.address}
                            multiline
                            textAlignVertical="top"
                            editable={!isSubmitting}
                            className={`${inputClass} min-h-[80px]`}
                        />
                        <FieldLabel label="Barangay" />
                        <Pressable
                            onPress={() => setShowBarangayModal(true)}
                            disabled={isSubmitting}
                            className="rounded-2xl bg-[#F0EDE6] px-4 py-3.5 flex-row items-center justify-between"
                        >
                            <Text
                                className={`text-[15px] ${barangay ? "text-[#1F2A1F]" : "text-[#9C978C]"}`}
                            >
                                {barangay ?? "Piliin ang barangay"}
                            </Text>
                            <Ionicons
                                name="chevron-down"
                                size={18}
                                color="#6B7280"
                            />
                        </Pressable>
                    </Card>

                    {/* ID number */}
                    <Card title="Detalye ng ID">
                        <FieldLabel
                            label="Numero ng ID"
                            fromId={!!scanned.idNumber}
                        />
                        <TextInput
                            value={idNumber}
                            onChangeText={setIdNumber}
                            placeholder="Hal. 1234-5678-9012-3456"
                            placeholderTextColor="#9C978C"
                            maxLength={MAX_LENGTH.idNumber}
                            autoCapitalize="characters"
                            autoCorrect={false}
                            editable={!isSubmitting}
                            className={inputClass}
                        />
                    </Card>

                    {/* Confirmation */}
                    <Pressable
                        onPress={() => setConfirmed((c) => !c)}
                        disabled={isSubmitting}
                        className="flex-row gap-3 px-1"
                    >
                        <View
                            className="w-5 h-5 rounded-md items-center justify-center mt-0.5"
                            style={{
                                borderWidth: 2,
                                borderColor: confirmed ? "#2F5233" : "#C4BFB2",
                                backgroundColor: confirmed
                                    ? "#2F5233"
                                    : "transparent",
                            }}
                        >
                            {confirmed && (
                                <Ionicons
                                    name="checkmark"
                                    size={13}
                                    color="#fff"
                                />
                            )}
                        </View>
                        <Text className="flex-1 text-[12.5px] text-[#4B4739] leading-[18px]">
                            Kinukumpirma kong tama ang lahat ng impormasyon at
                            ang ID na ito ay akin.
                        </Text>
                    </Pressable>

                    {error && (
                        <Text className="text-[12.5px] text-[#B23A2E] text-center mt-4">
                            {error}
                        </Text>
                    )}
                </ScrollView>

                {/* Submit */}
                <View className="px-6 pt-3 pb-4 border-t border-[#EDEAE2] bg-[--main-white]">
                    <ClayButton
                        colors={["#4C7350", "#254631"]}
                        borderRadius={20}
                        disabled={!canSubmit}
                        onPress={handleSubmit}
                    >
                        <Ionicons
                            name="shield-checkmark"
                            size={19}
                            color="#fff"
                        />
                        <Text className="text-white font-semibold text-[16px]">
                            {isSubmitting ? "Ipinapadala..." : "I-Verify"}
                        </Text>
                    </ClayButton>
                    {!isComplete && (
                        <Text className="text-[11.5px] text-[#9C978C] text-center mt-2">
                            Punan ang lahat ng kailangang field
                        </Text>
                    )}
                </View>
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
        </SafeAreaView>
    );
}
