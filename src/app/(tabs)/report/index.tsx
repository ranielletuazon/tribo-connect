import { AuthHeader } from "@/components/auth-header";
import { BackgroundBlobs, clayRaised, pressScale } from "@/components/clay";
import {
    ERROR_COLOR,
    ErrorText,
    FIELD_BG,
    FIELD_BORDER,
    StepSection,
} from "@/components/step-section";
import { PALETTE } from "@/constants/palette";
import { useLanguage } from "@/hooks/use-language";
import { functions } from "@/lib/firebase";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { httpsCallable } from "firebase/functions";
import { useState } from "react";
import {
    ActivityIndicator,
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
    labelEn: string;
    icon: keyof typeof Ionicons.glyphMap;
    colors: [string, string];
}

const CATEGORIES: ReportCategory[] = [
    {
        key: "sakuna",
        label: "Sakuna",
        labelEn: "Disaster",
        icon: "water",
        colors: ["#5BA3E8", "#2A5C99"],
    },
    {
        key: "kaligtasan",
        label: "Kaligtasan",
        labelEn: "Safety",
        icon: "shield-checkmark",
        colors: ["#E8894F", "#B4562A"],
    },
    {
        key: "kalusugan",
        label: "Kalusugan",
        labelEn: "Health",
        icon: "medkit",
        colors: ["#F0624D", "#B8321F"],
    },
    {
        key: "paligid",
        label: "Paligid",
        labelEn: "Surroundings",
        icon: "leaf",
        colors: ["#56A06A", "#2F6540"],
    },
    {
        key: "sarili",
        label: "Sarili",
        labelEn: "Personal",
        icon: "eye",
        colors: ["#A98FE0", "#6B4F94"],
    },
    {
        key: "iba-pa",
        label: "Iba Pa",
        labelEn: "Others",
        icon: "ellipsis-horizontal",
        colors: ["#B5AFA0", "#7A6D5C"],
    },
];

const SUBJECT_MAX = 120;
const DESCRIPTION_MAX = 2000;
// same gold as the report tile on the homepage
const REPORT_COLORS: [string, string] = ["#F2BD4E", "#C9821F"];

type Field = "subject" | "description";

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
    const { t } = useLanguage();
    const [categories, setCategories] = useState<string[]>([]);
    const [subject, setSubject] = useState("");
    const [description, setDescription] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [attemptedSubmit, setAttemptedSubmit] = useState(false);
    const [focusedField, setFocusedField] = useState<Field | null>(null);

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
    const steps = [categoriesValid, subjectValid, descriptionValid];
    const doneCount = steps.filter(Boolean).length;

    const showError = (fieldValid: boolean) => attemptedSubmit && !fieldValid;

    // border color of a text box: red on error, green while typing
    const fieldBorder = (field: Field, fieldValid: boolean) => {
        if (showError(fieldValid)) return ERROR_COLOR;
        if (focusedField === field) return PALETTE.forest;
        return FIELD_BORDER;
    };

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
                t("Naipadala ang Ulat", "Report Sent"),
                t(
                    "Salamat! Ire-review ito ng iyong barangay sa lalong madaling panahon.",
                    "Thank you! Your barangay will review it as soon as possible.",
                ),
            );
            setCategories([]);
            setSubject("");
            setDescription("");
            setAttemptedSubmit(false);
        } catch (err) {
            console.error("Submit report error:", err);
            Alert.alert(
                t("Hindi Naipadala", "Not Sent"),
                t(
                    "May problema sa pagpapadala ng ulat. Pakisubukang muli.",
                    "There was a problem sending the report. Please try again.",
                ),
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SafeAreaView
            className="flex-1"
            style={{ backgroundColor: PALETTE.cream }}
            edges={["top"]}
        >
            <BackgroundBlobs
                colors={[PALETTE.gold, PALETTE.leaf]}
                opacity={[0.22, 0.2]}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerClassName="px-5 pt-4 pb-10"
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <AuthHeader title={t("Report", "Report")} />

                    {/* Hero with the form progress */}
                    <LinearGradient
                        colors={REPORT_COLORS}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[
                            clayRaised,
                            {
                                borderRadius: 30,
                                overflow: "hidden",
                                marginTop: 4,
                                marginBottom: 24,
                            },
                        ]}
                    >
                        {/* big faded icon as a background decoration */}
                        <View
                            pointerEvents="none"
                            className="absolute"
                            style={{ right: -20, top: -16, opacity: 0.16 }}
                        >
                            <Ionicons
                                name="document-text"
                                size={130}
                                color="#fff"
                            />
                        </View>

                        <View className="p-5">
                            <View className="w-12 h-12 rounded-2xl bg-white/25 items-center justify-center border border-white/30 mb-3">
                                <Ionicons
                                    name="megaphone"
                                    size={22}
                                    color="#fff"
                                />
                            </View>
                            <Text className="text-[21px] font-extrabold text-white">
                                {t("Mag-report ng Insidente", "Report an Incident")}
                            </Text>
                            <Text className="text-[13px] text-white/90 mt-1 pr-8">
                                {t(
                                    "Ibahagi ang detalye ng pangyayari para makatulong sa iyong barangay.",
                                    "Share the details of what happened to help your barangay.",
                                )}
                            </Text>

                            <View className="flex-row gap-1.5 mt-4">
                                {steps.map((done, i) => (
                                    <View
                                        key={i}
                                        className="flex-1 h-1.5 rounded-full"
                                        style={{
                                            backgroundColor: done
                                                ? "#fff"
                                                : "rgba(255,255,255,0.3)",
                                        }}
                                    />
                                ))}
                            </View>
                            <Text className="text-[11.5px] font-semibold text-white/90 mt-2">
                                {isValid
                                    ? t("Handa nang isumite!", "Ready to submit!")
                                    : t(
                                          `${doneCount} sa 3 hakbang ang tapos`,
                                          `${doneCount} of 3 steps done`,
                                      )}
                            </Text>
                        </View>
                    </LinearGradient>

                    {/* Step 1: categories */}
                    <StepSection
                        step={1}
                        title={t("Uri ng Ulat", "Report Type")}
                        hint={t("Pumili ng isa o higit pa", "Pick one or more")}
                        done={categoriesValid}
                        trailing={
                            categoriesValid ? (
                                <View
                                    className="px-2.5 py-1 rounded-full"
                                    style={{
                                        backgroundColor: "rgba(62,123,79,0.12)",
                                    }}
                                >
                                    <Text
                                        className="text-[11px] font-bold"
                                        style={{ color: PALETTE.forest }}
                                    >
                                        {categories.length} {t("napili", "selected")}
                                    </Text>
                                </View>
                            ) : null
                        }
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
                                        accessibilityLabel={`${t(cat.label, cat.labelEn)}, ${
                                            selected
                                                ? t("napili", "selected")
                                                : t("hindi napili", "not selected")
                                        }`}
                                        style={{
                                            width: "31.5%",
                                            marginBottom: 10,
                                            opacity: isSubmitting ? 0.6 : 1,
                                        }}
                                    >
                                        {({ pressed }) =>
                                            selected ? (
                                                <LinearGradient
                                                    colors={cat.colors}
                                                    start={{ x: 0, y: 0 }}
                                                    end={{ x: 1, y: 1 }}
                                                    style={[
                                                        clayRaised,
                                                        pressScale(pressed),
                                                        {
                                                            borderRadius: 20,
                                                            paddingVertical: 14,
                                                            alignItems:
                                                                "center",
                                                        },
                                                    ]}
                                                >
                                                    <View className="absolute top-2 right-2 w-[18px] h-[18px] rounded-full bg-white items-center justify-center">
                                                        <Ionicons
                                                            name="checkmark"
                                                            size={12}
                                                            color={
                                                                cat.colors[1]
                                                            }
                                                        />
                                                    </View>
                                                    <View className="w-11 h-11 rounded-2xl bg-white/25 items-center justify-center mb-2 border border-white/30">
                                                        <Ionicons
                                                            name={cat.icon}
                                                            size={20}
                                                            color="#fff"
                                                        />
                                                    </View>
                                                    <Text className="text-[12.5px] font-bold text-white text-center">
                                                        {t(cat.label, cat.labelEn)}
                                                    </Text>
                                                </LinearGradient>
                                            ) : (
                                                <View
                                                    className="rounded-[20px] py-3.5 items-center border"
                                                    style={[
                                                        pressScale(pressed),
                                                        {
                                                            backgroundColor:
                                                                "#FBF8F3",
                                                            borderColor:
                                                                showError(
                                                                    categoriesValid,
                                                                )
                                                                    ? "rgba(192,57,43,0.4)"
                                                                    : "#EFE9DE",
                                                        },
                                                    ]}
                                                >
                                                    <View
                                                        className="w-11 h-11 rounded-2xl items-center justify-center mb-2"
                                                        style={{
                                                            // light tint of the category color
                                                            backgroundColor: `${cat.colors[0]}26`,
                                                        }}
                                                    >
                                                        <Ionicons
                                                            name={cat.icon}
                                                            size={20}
                                                            color={
                                                                cat.colors[1]
                                                            }
                                                        />
                                                    </View>
                                                    <Text
                                                        className="text-[12.5px] font-semibold text-center"
                                                        style={{
                                                            color: PALETTE.ink,
                                                        }}
                                                    >
                                                        {t(cat.label, cat.labelEn)}
                                                    </Text>
                                                </View>
                                            )
                                        }
                                    </Pressable>
                                );
                            })}
                        </View>
                        {showError(categoriesValid) && (
                            <ErrorText>
                                {t(
                                    "Pumili ng kahit isang uri ng ulat.",
                                    "Pick at least one report type.",
                                )}
                            </ErrorText>
                        )}
                    </StepSection>

                    {/* Step 2: subject */}
                    <StepSection
                        step={2}
                        title={t("Pamagat", "Title")}
                        hint={t("Maikling buod ng nangyari", "A short summary of what happened")}
                        done={subjectValid}
                    >
                        <View
                            className="flex-row items-center gap-2.5 rounded-2xl px-3.5 border-[1.5px]"
                            style={{
                                backgroundColor: FIELD_BG,
                                borderColor: fieldBorder(
                                    "subject",
                                    subjectValid,
                                ),
                            }}
                        >
                            <Ionicons
                                name="create-outline"
                                size={17}
                                color={
                                    focusedField === "subject"
                                        ? PALETTE.forest
                                        : "#B5AFA0"
                                }
                            />
                            <TextInput
                                placeholder={t(
                                    "Maikling paglalarawan ng insidente",
                                    "Short description of the incident",
                                )}
                                placeholderTextColor="#B5AFA0"
                                value={subject}
                                onChangeText={setSubject}
                                onFocus={() => setFocusedField("subject")}
                                onBlur={() => setFocusedField(null)}
                                maxLength={SUBJECT_MAX}
                                editable={!isSubmitting}
                                accessibilityLabel={t("Pamagat ng ulat", "Report title")}
                                className="flex-1 text-[15px] py-3.5"
                                style={{ color: PALETTE.ink }}
                            />
                        </View>
                        <View className="flex-row items-start justify-between">
                            <View className="flex-1">
                                {showError(subjectValid) && (
                                    <ErrorText>
                                        {t("Kailangan ang pamagat.", "A title is required.")}
                                    </ErrorText>
                                )}
                            </View>
                            <Text className="text-[11px] text-[#B5AFA0] mt-2 ml-2">
                                {subject.length}/{SUBJECT_MAX}
                            </Text>
                        </View>
                    </StepSection>

                    {/* Step 3: description */}
                    <StepSection
                        step={3}
                        title={t("Detalye", "Details")}
                        hint={t(
                            "Ano, saan, at kailan nangyari",
                            "What, where, and when it happened",
                        )}
                        done={descriptionValid}
                    >
                        <View
                            className="rounded-2xl px-3.5 pt-3 pb-2 border-[1.5px]"
                            style={{
                                backgroundColor: FIELD_BG,
                                borderColor: fieldBorder(
                                    "description",
                                    descriptionValid,
                                ),
                            }}
                        >
                            <TextInput
                                placeholder={t(
                                    "Ilarawan ang buong detalye ng pangyayari...",
                                    "Describe the full details of what happened...",
                                )}
                                placeholderTextColor="#B5AFA0"
                                value={description}
                                onChangeText={setDescription}
                                onFocus={() => setFocusedField("description")}
                                onBlur={() => setFocusedField(null)}
                                multiline
                                numberOfLines={6}
                                maxLength={DESCRIPTION_MAX}
                                editable={!isSubmitting}
                                textAlignVertical="top"
                                accessibilityLabel={t(
                                    "Detalye ng insidente",
                                    "Incident details",
                                )}
                                className="text-[15px] min-h-[130px]"
                                style={{ color: PALETTE.ink }}
                            />
                        </View>
                        <View className="flex-row items-start justify-between">
                            <View className="flex-1">
                                {showError(descriptionValid) && (
                                    <ErrorText>
                                        {t(
                                            "Ilarawan ang pangyayari.",
                                            "Describe what happened.",
                                        )}
                                    </ErrorText>
                                )}
                            </View>
                            <Text className="text-[11px] text-[#B5AFA0] mt-2 ml-2">
                                {description.length}/{DESCRIPTION_MAX}
                            </Text>
                        </View>
                    </StepSection>

                    {/* Contact note */}
                    <View
                        className="flex-row items-start gap-3 p-4 rounded-[22px] border mt-1 mb-5"
                        style={{
                            backgroundColor: "rgba(62,123,79,0.08)",
                            borderColor: "rgba(62,123,79,0.2)",
                        }}
                    >
                        <Ionicons
                            name="mail-outline"
                            size={18}
                            color={PALETTE.forest}
                        />
                        <Text
                            className="flex-1 text-[12px] leading-[18px]"
                            style={{ color: PALETTE.muted }}
                        >
                            {t(
                                "Gagamitin ang email ng iyong naka-log in na account para makipag-ugnayan tungkol sa ulat na ito.",
                                "The email of your logged-in account will be used to contact you about this report.",
                            )}
                        </Text>
                    </View>

                    {/* Submit */}
                    <Pressable
                        disabled={isSubmitting}
                        onPress={handleSubmit}
                        accessibilityRole="button"
                    >
                        {({ pressed }) => (
                            <LinearGradient
                                colors={
                                    isValid
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
                                        opacity: isSubmitting ? 0.85 : 1,
                                    },
                                ]}
                            >
                                {isSubmitting ? (
                                    <ActivityIndicator
                                        size="small"
                                        color="#fff"
                                    />
                                ) : (
                                    <Ionicons
                                        name="send"
                                        size={17}
                                        color="#fff"
                                    />
                                )}
                                <Text className="text-white text-[16px] font-bold">
                                    {isSubmitting
                                        ? t("Ipinapadala...", "Sending...")
                                        : t("Isumite ang Ulat", "Submit Report")}
                                </Text>
                            </LinearGradient>
                        )}
                    </Pressable>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
