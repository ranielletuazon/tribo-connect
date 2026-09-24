import { AuthHeader } from "@/components/auth-header";
import { ClayButton, ClaySurface, clayRaised } from "@/components/clay";
import { functions } from "@/lib/firebase";
import { Ionicons } from "@expo/vector-icons";
import { httpsCallable } from "firebase/functions";
import type { ReactNode } from "react";
import { useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface ReportCategory {
    key: string;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    colorLight: string;
    colorDark: string;
}

const CATEGORIES: ReportCategory[] = [
    {
        key: "sakuna",
        label: "Sakuna",
        icon: "water",
        colorLight: "#6FA8DC",
        colorDark: "#2A5C99",
    },
    {
        key: "kaligtasan",
        label: "Kaligtasan",
        icon: "shield-checkmark",
        colorLight: "#C97A6A",
        colorDark: "#8B3A2E",
    },
    {
        key: "kalusugan",
        label: "Kalusugan",
        icon: "medkit",
        colorLight: "#E0857A",
        colorDark: "#B23A2E",
    },
    {
        key: "paligid",
        label: "Paligid",
        icon: "leaf",
        colorLight: "#7A9B7D",
        colorDark: "#3F5C42",
    },
    {
        key: "sarili",
        label: "Sarili",
        icon: "eye",
        colorLight: "#A98FC9",
        colorDark: "#6B4F94",
    },
    {
        key: "iba-pa",
        label: "Iba Pa",
        icon: "ellipsis-horizontal",
        colorLight: "#B5AFA0",
        colorDark: "#7A6D5C",
    },
];

const SUBJECT_MAX = 120;
const DESCRIPTION_MAX = 2000;
const BRAND_ACCENT = "#3F5C42";
const ERROR_COLOR = "#B23A2E";

const type = {
    micro: 11,
    small: 12,
    label: 13,
    body: 14,
    input: 15,
    button: 16,
};

function FormSection({
    title,
    hint,
    children,
}: {
    title: string;
    hint?: string;
    children: ReactNode;
}) {
    return (
        <View
            style={clayRaised}
            className="bg-[--main-white] rounded-2xl overflow-hidden mb-5"
        >
            <View
                className="flex-row items-center gap-2 px-4 py-3"
                style={{
                    backgroundColor: "#F3F6F1",
                    borderBottomWidth: 1,
                    borderBottomColor: "#E4E9DF",
                }}
            >
                <View
                    style={{
                        width: 4,
                        height: 15,
                        borderRadius: 2,
                        backgroundColor: BRAND_ACCENT,
                    }}
                />
                <Text
                    style={{ fontSize: type.label }}
                    className="font-semibold text-[#1F2A1F]"
                >
                    {title}
                </Text>
                {hint ? (
                    <Text
                        style={{ fontSize: type.body }}
                        className="text-[#9C978C]"
                    >
                        {hint}
                    </Text>
                ) : null}
            </View>
            <View className="p-4">{children}</View>
        </View>
    );
}

interface ReportPayload {
    categories: string[];
    subject: string;
    description: string;
}

async function submitReport(payload: ReportPayload): Promise<void> {
    const callable = httpsCallable(functions, "submitReport");
    await callable(payload);
}

export default function Report() {
    const [categories, setCategories] = useState<string[]>([]);
    const [subject, setSubject] = useState("");
    const [description, setDescription] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [attemptedSubmit, setAttemptedSubmit] = useState(false);

    const toggleCategory = (key: string) => {
        if (isSubmitting) return;
        setCategories((prev) =>
            prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
        );
    };

    const categoriesValid = categories.length > 0;
    const subjectValid = subject.trim().length > 0;
    const descriptionValid = description.trim().length > 0;
    const isValid = categoriesValid && subjectValid && descriptionValid;

    const showError = (fieldValid: boolean) => attemptedSubmit && !fieldValid;

    const handleSubmit = async () => {
        setAttemptedSubmit(true);
        if (!isValid || isSubmitting) return;

        setIsSubmitting(true);
        try {
            await submitReport({
                categories,
                subject: subject.trim(),
                description: description.trim(),
            });
            Alert.alert(
                "Naipadala ang Ulat",
                "Salamat! Ire-review ito ng iyong barangay sa lalong madaling panahon.",
            );
            setCategories([]);
            setSubject("");
            setDescription("");
            setAttemptedSubmit(false);
        } catch (err) {
            console.error("Submit report error:", err);
            Alert.alert(
                "Hindi Naipadala",
                "May problema sa pagpapadala ng ulat. Pakisubukang muli.",
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-[--main-white]" edges={["top"]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerClassName="px-6 pt-4 pb-10"
                    keyboardShouldPersistTaps="handled"
                >
                    <AuthHeader title="Report" />

                    <Text
                        style={{ fontSize: type.input }}
                        className="text-[#7A6D5C] text-center mt-2 mb-6 px-2"
                    >
                        Ibahagi ang detalye ng pangyayari para makatulong sa
                        iyong barangay.
                    </Text>

                    <FormSection
                        title="Uri ng Ulat"
                        hint="(pumili ng isa o higit pa)"
                    >
                        <View className="flex-row flex-wrap justify-between">
                            {CATEGORIES.map((cat) => {
                                const selected = categories.includes(cat.key);
                                return (
                                    <Pressable
                                        key={cat.key}
                                        onPress={() => toggleCategory(cat.key)}
                                        disabled={isSubmitting}
                                        accessibilityRole="checkbox"
                                        accessibilityState={{
                                            checked: selected,
                                            disabled: isSubmitting,
                                        }}
                                        accessibilityLabel={`${cat.label}, ${selected ? "napili" : "hindi napili"}`}
                                        style={{
                                            width: "31%",
                                            marginBottom: 12,
                                            opacity: isSubmitting ? 0.6 : 1,
                                        }}
                                    >
                                        {selected ? (
                                            <ClaySurface
                                                colors={[
                                                    cat.colorLight,
                                                    cat.colorDark,
                                                ]}
                                                borderRadius={18}
                                                style={{
                                                    padding: 14,
                                                    alignItems: "center",
                                                }}
                                            >
                                                <View className="absolute top-2 right-2 w-4 h-4 rounded-full bg-white items-center justify-center">
                                                    <Ionicons
                                                        name="checkmark"
                                                        size={11}
                                                        color={cat.colorDark}
                                                    />
                                                </View>
                                                <View className="w-11 h-11 rounded-full bg-white/20 items-center justify-center mb-2">
                                                    <Ionicons
                                                        name={cat.icon}
                                                        size={19}
                                                        color="#fff"
                                                    />
                                                </View>
                                                <Text
                                                    style={{
                                                        fontSize: type.small,
                                                    }}
                                                    className="font-bold text-white text-center"
                                                >
                                                    {cat.label}
                                                </Text>
                                            </ClaySurface>
                                        ) : (
                                            <View
                                                style={{
                                                    borderWidth: 1,
                                                    borderColor: "#E7E2D6",
                                                    backgroundColor: "#FBFAF7",
                                                }}
                                                className="rounded-[18px] p-3.5 items-center"
                                            >
                                                <View
                                                    className="w-11 h-11 rounded-full items-center justify-center mb-2"
                                                    style={{
                                                        backgroundColor:
                                                            "#F0EDE6",
                                                    }}
                                                >
                                                    <Ionicons
                                                        name={cat.icon}
                                                        size={19}
                                                        color={cat.colorDark}
                                                    />
                                                </View>
                                                <Text
                                                    style={{
                                                        fontSize: type.small,
                                                    }}
                                                    className="font-semibold text-[#1F2A1F] text-center"
                                                >
                                                    {cat.label}
                                                </Text>
                                            </View>
                                        )}
                                    </Pressable>
                                );
                            })}
                        </View>
                        {showError(categoriesValid) && (
                            <Text
                                style={{
                                    fontSize: type.body,
                                    color: ERROR_COLOR,
                                }}
                                className="mt-1"
                            >
                                Pumili ng kahit isang uri ng ulat.
                            </Text>
                        )}
                    </FormSection>

                    <FormSection title="Detalye ng Ulat" hint="(kinakailangan)">
                        <View className="flex-row items-center justify-between mb-2">
                            <View className="flex-row items-center gap-2">
                                <Ionicons
                                    name="create-outline"
                                    size={14}
                                    color="#9C978C"
                                />
                                <Text
                                    style={{ fontSize: type.body }}
                                    className="font-medium text-[#9C978C]"
                                >
                                    Pamagat
                                </Text>
                            </View>
                            <Text
                                style={{ fontSize: type.micro }}
                                className="text-[#B5AFA0]"
                            >
                                {subject.length}/{SUBJECT_MAX}
                            </Text>
                        </View>
                        <TextInput
                            placeholder="Maikling paglalarawan ng insidente"
                            placeholderTextColor="#B5AFA0"
                            value={subject}
                            onChangeText={setSubject}
                            maxLength={SUBJECT_MAX}
                            editable={!isSubmitting}
                            accessibilityLabel="Pamagat ng ulat"
                            style={{ fontSize: type.input }}
                            className="text-[#1F2A1F] pb-3"
                        />
                        {showError(subjectValid) && (
                            <Text
                                style={{
                                    fontSize: type.body,
                                    color: ERROR_COLOR,
                                }}
                                className="mb-2"
                            >
                                Kailangan ang pamagat.
                            </Text>
                        )}

                        <View className="h-px bg-[#EDEAE2] mb-3" />

                        <View className="flex-row items-center justify-between mb-2">
                            <View className="flex-row items-center gap-2">
                                <Ionicons
                                    name="document-text-outline"
                                    size={14}
                                    color="#9C978C"
                                />
                                <Text
                                    style={{ fontSize: type.body }}
                                    className="font-medium text-[#9C978C]"
                                >
                                    Detalye
                                </Text>
                            </View>
                            <Text
                                style={{ fontSize: type.micro }}
                                className="text-[#B5AFA0]"
                            >
                                {description.length}/{DESCRIPTION_MAX}
                            </Text>
                        </View>
                        <TextInput
                            placeholder="Ilarawan ang buong detalye ng pangyayari..."
                            placeholderTextColor="#B5AFA0"
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            numberOfLines={5}
                            maxLength={DESCRIPTION_MAX}
                            editable={!isSubmitting}
                            textAlignVertical="top"
                            accessibilityLabel="Detalye ng insidente"
                            style={{ fontSize: type.input }}
                            className="text-[#1F2A1F] min-h-[100px]"
                        />
                        {showError(descriptionValid) && (
                            <Text
                                style={{
                                    fontSize: type.body,
                                    color: ERROR_COLOR,
                                }}
                            >
                                Ilarawan ang pangyayari.
                            </Text>
                        )}
                    </FormSection>

                    <Text
                        style={{ fontSize: type.micro }}
                        className="text-[#9C978C] text-center mb-5 px-4"
                    >
                        Gagamitin ang email ng iyong naka-log in na account para
                        makipag-ugnayan tungkol sa ulat na ito.
                    </Text>

                    <ClayButton
                        colors={
                            isValid
                                ? ["#4C7350", "#254631"]
                                : ["#C4BFB2", "#9C978C"]
                        }
                        borderRadius={20}
                        disabled={isSubmitting}
                        onPress={handleSubmit}
                        style={{
                            borderWidth: 1,
                            borderColor: "rgba(255,255,255,0.16)",
                        }}
                    >
                        <Text
                            style={{ fontSize: type.button }}
                            className="text-white font-semibold"
                        >
                            {isSubmitting
                                ? "Ipinapadala..."
                                : "Isumite ang Ulat"}
                        </Text>
                    </ClayButton>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
