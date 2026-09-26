import { AuthHeader } from "@/components/auth-header";
import { ClayButton, clayRaised } from "@/components/clay";
import { VerifiedBadge } from "@/components/verified-badge";
import { db, functions, storage } from "@/lib/firebase";
import { formatTimeAgo } from "@/lib/posts";
import {
    VERIFICATION_TYPES,
    callableErrorMessage,
    mapDocToVerification,
    type ExtractedFields,
    type VerificationRequest,
} from "@/lib/verification";
import { useAuth } from "@/providers/auth-provider";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { doc, onSnapshot } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { getDownloadURL, ref } from "firebase/storage";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
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

const REASON_MAX = 300;

const QUICK_REASONS = [
    "Malabo o hindi mabasa ang larawan ng ID.",
    "Hindi tugma ang inilagay na detalye sa ID.",
    "Expired o hindi valid ang ID.",
    "Hindi buo ang ID sa larawan.",
];

// the rows of the comparison table, in the order they show
const COMPARE_ROWS: { key: keyof ExtractedFields; label: string }[] = [
    { key: "lastName", label: "Apelyido" },
    { key: "firstName", label: "Pangalan" },
    { key: "middleName", label: "Gitnang Pangalan" },
    { key: "birthDate", label: "Kapanganakan" },
    { key: "sex", label: "Kasarian" },
    { key: "address", label: "Tirahan" },
    { key: "idNumber", label: "Numero ng ID" },
];

const reviewVerification = httpsCallable<
    { uid: string; decision: "approve" | "reject"; reason?: string },
    unknown
>(functions, "reviewVerification");

// ignores case, spaces and punctuation, since OCR and typing differ in those
function normalize(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9ñ]/g, "");
}

function displayValue(key: keyof ExtractedFields, value: string): string {
    if (!value) return "—";
    if (key === "sex") return value === "F" ? "Babae" : "Lalaki";
    if (key === "birthDate") {
        const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (!match) return value;
        return new Date(
            Number(match[1]),
            Number(match[2]) - 1,
            Number(match[3]),
        ).toLocaleDateString("fil-PH", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    }
    return value;
}

function Section({
    title,
    right,
    children,
}: {
    title: string;
    right?: ReactNode;
    children: ReactNode;
}) {
    return (
        <View className="mb-5">
            <View className="flex-row items-center justify-between mb-2.5 ml-1">
                <Text className="text-[13px] font-medium text-[#7A6D5C]">
                    {title}
                </Text>
                {right}
            </View>
            {children}
        </View>
    );
}

export default function ReviewVerification() {
    const { verificationId } = useLocalSearchParams<{
        verificationId: string;
    }>();
    const { profile } = useAuth();
    const isAdmin = profile?.role === "admin";

    const [request, setRequest] = useState<VerificationRequest | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [imageAspect, setImageAspect] = useState(1.58);
    const [selfieUrl, setSelfieUrl] = useState<string | null>(null);
    // the image open in the full screen viewer, ID or selfie
    const [fullscreenUrl, setFullscreenUrl] = useState<string | null>(null);
    const [showRawText, setShowRawText] = useState(false);

    const [showRejectModal, setShowRejectModal] = useState(false);
    const [reason, setReason] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // live, so if another admin reviews it first this screen updates
    useEffect(() => {
        if (!verificationId || !isAdmin) return;
        return onSnapshot(
            doc(db, "verification", verificationId),
            (snap) => {
                setRequest(snap.exists() ? mapDocToVerification(snap) : null);
                setIsLoading(false);
            },
            (err) => {
                console.error("Load verification error:", err);
                setIsLoading(false);
            },
        );
    }, [verificationId, isAdmin]);

    useEffect(() => {
        if (!request?.imagePath) return;
        getDownloadURL(ref(storage, request.imagePath))
            .then((url) => {
                setImageUrl(url);
                Image.getSize(
                    url,
                    (width, height) => {
                        if (width > 0 && height > 0) {
                            setImageAspect(width / height);
                        }
                    },
                    () => {},
                );
            })
            .catch((err) => console.error("Load ID image error:", err));
    }, [request?.imagePath]);

    useEffect(() => {
        if (!request?.selfiePath) return;
        getDownloadURL(ref(storage, request.selfiePath))
            .then(setSelfieUrl)
            .catch((err) => console.error("Load selfie error:", err));
    }, [request?.selfiePath]);

    const submitReview = async (decision: "approve" | "reject") => {
        if (!request || isSubmitting) return;
        setIsSubmitting(true);
        try {
            await reviewVerification({
                uid: request.uid,
                decision,
                reason: decision === "reject" ? reason.trim() : undefined,
            });
            setShowRejectModal(false);
            router.back();
        } catch (err) {
            console.error("Review verification error:", err);
            Alert.alert(
                "Nabigo",
                callableErrorMessage(
                    err,
                    "Hindi naisumite ang desisyon. Pakisubukang muli.",
                ),
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleApprove = () => {
        if (!request) return;
        Alert.alert(
            "Aprubahan ang beripikasyon?",
            `Magiging verified ang account ni ${request.username} at makikita ng lahat ang verified badge.`,
            [
                { text: "Kanselahin", style: "cancel" },
                { text: "Aprubahan", onPress: () => submitReview("approve") },
            ],
        );
    };

    if (!isAdmin) {
        return (
            <SafeAreaView className="flex-1 bg-[--main-white] items-center justify-center px-8">
                <Ionicons name="lock-closed" size={36} color="#C4BFB2" />
                <Text className="text-center text-[13.5px] text-[#9C978C] mt-3">
                    Ang mga admin lamang ang maaaring pumasok sa pahinang ito.
                </Text>
            </SafeAreaView>
        );
    }

    if (isLoading) {
        return (
            <SafeAreaView className="flex-1 bg-[--main-white] items-center justify-center">
                <ActivityIndicator color="#2F5233" />
            </SafeAreaView>
        );
    }

    if (!request) {
        return (
            <SafeAreaView className="flex-1 bg-[--main-white] px-6 pt-4">
                <AuthHeader title="Suriin ang Beripikasyon" />
                <View className="flex-1 items-center justify-center px-8">
                    <Ionicons
                        name="document-text-outline"
                        size={36}
                        color="#C4BFB2"
                    />
                    <Text className="text-center text-[13.5px] text-[#9C978C] mt-3">
                        Hindi makita ang beripikasyong ito.
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    const type = VERIFICATION_TYPES[request.idType];
    const isPending = request.status === "pending";
    const info = request.personalInfo;
    const fullName = [info.firstName, info.middleName, info.lastName]
        .filter(Boolean)
        .join(" ");
    const mismatchCount = COMPARE_ROWS.filter(({ key }) => {
        const scanned = request.ocr.fields[key];
        return scanned && normalize(scanned) !== normalize(info[key]);
    }).length;
    const canReject =
        reason.trim().length >= 5 && reason.trim().length <= REASON_MAX;

    return (
        <SafeAreaView className="flex-1 bg-[--main-white]" edges={["top"]}>
            <ScrollView contentContainerClassName="px-6 pt-4 pb-8">
                <AuthHeader title="Suriin ang Beripikasyon" />

                {/* User */}
                <View
                    style={clayRaised}
                    className="bg-[--main-white] rounded-[20px] p-4 mb-5 flex-row items-center gap-3"
                >
                    <View className="w-14 h-14 rounded-full bg-[#5C7A5F] items-center justify-center overflow-hidden">
                        {request.photoURL ? (
                            <Image
                                source={{ uri: request.photoURL }}
                                className="w-full h-full"
                                resizeMode="cover"
                            />
                        ) : (
                            <Text className="text-white text-[16px] font-bold">
                                {request.username.slice(0, 2).toUpperCase()}
                            </Text>
                        )}
                    </View>
                    <View className="flex-1">
                        <View className="flex-row items-center gap-1">
                            <Text
                                className="text-[15.5px] font-bold text-[#1F2A1F] shrink"
                                numberOfLines={1}
                            >
                                {request.username}
                            </Text>
                            {request.status === "approved" && <VerifiedBadge />}
                        </View>
                        {request.email && (
                            <Text
                                className="text-[12px] text-[#7A6D5C] mt-0.5"
                                numberOfLines={1}
                            >
                                {request.email}
                            </Text>
                        )}
                        <Text className="text-[11.5px] text-[#9C978C] mt-0.5">
                            Isinumite {formatTimeAgo(request.submittedAt)}
                            {request.attempts > 1
                                ? ` · Ika-${request.attempts} pagsumite`
                                : ""}
                        </Text>
                    </View>
                </View>

                {/* Result, once reviewed */}
                {!isPending && (
                    <View
                        className="flex-row gap-3 rounded-2xl p-4 mb-5"
                        style={{
                            backgroundColor:
                                request.status === "approved"
                                    ? "#EAF1FC"
                                    : "#FBECE9",
                        }}
                    >
                        <Ionicons
                            name={
                                request.status === "approved"
                                    ? "checkmark-circle"
                                    : "close-circle"
                            }
                            size={20}
                            color={
                                request.status === "approved"
                                    ? "#2A6FDB"
                                    : "#9C3A2A"
                            }
                        />
                        <View className="flex-1">
                            <Text className="text-[13.5px] font-bold text-[#1F2A1F]">
                                {request.status === "approved"
                                    ? "Naaprubahan"
                                    : "Tinanggihan"}
                                {request.reviewedByName
                                    ? ` ni ${request.reviewedByName}`
                                    : ""}
                            </Text>
                            <Text className="text-[11.5px] text-[#7A6D5C] mt-0.5">
                                {formatTimeAgo(request.reviewedAt)}
                            </Text>
                            {request.rejectionReason && (
                                <Text className="text-[12.5px] text-[#1F2A1F] leading-[18px] mt-2">
                                    <Text className="font-semibold">
                                        Dahilan:{" "}
                                    </Text>
                                    {request.rejectionReason}
                                </Text>
                            )}
                        </View>
                    </View>
                )}

                {/* ID image */}
                <Section
                    title="Larawan ng ID"
                    right={
                        <View className="flex-row items-center gap-1">
                            <Ionicons
                                name={type.icon}
                                size={12}
                                color={type.color}
                            />
                            <Text
                                className="text-[12px] font-semibold"
                                style={{ color: type.color }}
                            >
                                {type.label}
                            </Text>
                        </View>
                    }
                >
                    <Pressable
                        onPress={() => imageUrl && setFullscreenUrl(imageUrl)}
                        style={clayRaised}
                        className="rounded-2xl overflow-hidden bg-[#1F2A1F]"
                    >
                        {imageUrl ? (
                            <Image
                                source={{ uri: imageUrl }}
                                className="w-full"
                                style={{ aspectRatio: imageAspect }}
                                resizeMode="contain"
                            />
                        ) : (
                            <View className="h-48 items-center justify-center">
                                <ActivityIndicator color="#fff" />
                            </View>
                        )}
                        {imageUrl && (
                            <View className="absolute bottom-2 right-2 flex-row items-center gap-1 bg-black/60 rounded-full px-2.5 py-1">
                                <Ionicons
                                    name="expand"
                                    size={12}
                                    color="#fff"
                                />
                                <Text className="text-[11px] text-white font-medium">
                                    Palakihin
                                </Text>
                            </View>
                        )}
                    </Pressable>

                    {/* scan quality */}
                    <View className="flex-row gap-2 mt-3">
                        <View className="flex-1 bg-[#F3F6F1] rounded-xl px-3 py-2">
                            <Text className="text-[10.5px] text-[#7A6D5C]">
                                Kumpiyansa ng OCR
                            </Text>
                            <Text className="text-[14px] font-bold text-[#1F2A1F]">
                                {Math.round(request.ocr.confidence)}%
                            </Text>
                        </View>
                        <View
                            className="flex-1 rounded-xl px-3 py-2"
                            style={{
                                backgroundColor: request.ocr.typeMatch
                                    ? "#F3F6F1"
                                    : "#FBF1E8",
                            }}
                        >
                            <Text className="text-[10.5px] text-[#7A6D5C]">
                                Uri ng ID
                            </Text>
                            <Text
                                className="text-[14px] font-bold"
                                style={{
                                    color: request.ocr.typeMatch
                                        ? "#1F2A1F"
                                        : "#A85A30",
                                }}
                            >
                                {request.ocr.typeMatch
                                    ? "Tugma"
                                    : "Suriing mabuti"}
                            </Text>
                        </View>
                    </View>
                </Section>

                {/* Selfie, to compare with the face on the ID */}
                <Section title="Selfie">
                    <View
                        style={clayRaised}
                        className="bg-[--main-white] rounded-[20px] p-4 flex-row items-center gap-4"
                    >
                        <Pressable
                            onPress={() =>
                                selfieUrl && setFullscreenUrl(selfieUrl)
                            }
                            disabled={!selfieUrl}
                            className="w-28 h-28 rounded-full overflow-hidden bg-[#F0EDE6] items-center justify-center"
                        >
                            {selfieUrl ? (
                                <Image
                                    source={{ uri: selfieUrl }}
                                    className="w-full h-full"
                                    resizeMode="cover"
                                />
                            ) : request.selfiePath ? (
                                <ActivityIndicator color="#2F5233" />
                            ) : (
                                <Ionicons
                                    name="person"
                                    size={44}
                                    color="#D9D4C8"
                                />
                            )}
                        </Pressable>
                        <View className="flex-1">
                            {request.selfiePath ? (
                                <>
                                    <Text className="text-[13.5px] font-semibold text-[#1F2A1F]">
                                        Ihambing ang mukha
                                    </Text>
                                    <Text className="text-[12px] text-[#7A6D5C] leading-[17px] mt-1">
                                        Siguraduhing iisang tao ang nasa selfie
                                        at sa larawan ng ID. Pindutin para
                                        palakihin.
                                    </Text>
                                </>
                            ) : (
                                <Text className="text-[12.5px] text-[#9C978C] leading-[18px]">
                                    Walang selfie ang beripikasyong ito dahil
                                    naisumite ito bago idinagdag ang selfie.
                                </Text>
                            )}
                        </View>
                    </View>
                </Section>

                {/* Details the user entered vs what the OCR read */}
                <Section
                    title="Paghahambing ng Detalye"
                    right={
                        mismatchCount > 0 ? (
                            <Text className="text-[11.5px] font-semibold text-[#A85A30]">
                                {mismatchCount} binago ng user
                            </Text>
                        ) : (
                            <Text className="text-[11.5px] font-semibold text-[#3F5C42]">
                                Lahat tugma
                            </Text>
                        )
                    }
                >
                    <View
                        style={clayRaised}
                        className="bg-[--main-white] rounded-[20px] overflow-hidden"
                    >
                        <View className="flex-row bg-[#F3F6F1] px-4 py-2.5">
                            <Text className="flex-1 text-[11px] font-semibold text-[#7A6D5C]">
                                INILAGAY NG USER
                            </Text>
                            <Text className="flex-1 text-[11px] font-semibold text-[#7A6D5C]">
                                NABASA SA ID
                            </Text>
                        </View>
                        {COMPARE_ROWS.map(({ key, label }, i) => {
                            const entered = info[key];
                            const scanned = request.ocr.fields[key];
                            const matches =
                                !!scanned &&
                                normalize(scanned) === normalize(entered);
                            const differs = !!scanned && !matches;
                            return (
                                <View
                                    key={key}
                                    className={`px-4 py-3 ${
                                        i < COMPARE_ROWS.length - 1
                                            ? "border-b border-[#EDEAE2]"
                                            : ""
                                    }`}
                                    style={
                                        differs
                                            ? { backgroundColor: "#FDF8F2" }
                                            : undefined
                                    }
                                >
                                    <View className="flex-row items-center gap-1 mb-1">
                                        <Text className="text-[11px] text-[#9C978C]">
                                            {label}
                                        </Text>
                                        {matches && (
                                            <Ionicons
                                                name="checkmark-circle"
                                                size={12}
                                                color="#3F5C42"
                                            />
                                        )}
                                        {differs && (
                                            <Ionicons
                                                name="alert-circle"
                                                size={12}
                                                color="#A85A30"
                                            />
                                        )}
                                    </View>
                                    <View className="flex-row gap-3">
                                        <Text className="flex-1 text-[13.5px] font-semibold text-[#1F2A1F]">
                                            {displayValue(key, entered)}
                                        </Text>
                                        <Text
                                            className="flex-1 text-[13px]"
                                            style={{
                                                color: scanned
                                                    ? "#4B4739"
                                                    : "#C4BFB2",
                                            }}
                                        >
                                            {scanned
                                                ? displayValue(key, scanned)
                                                : "Hindi nabasa"}
                                        </Text>
                                    </View>
                                </View>
                            );
                        })}
                        <View className="px-4 py-3 border-t border-[#EDEAE2]">
                            <Text className="text-[11px] text-[#9C978C] mb-1">
                                Barangay
                            </Text>
                            <Text className="text-[13.5px] font-semibold text-[#1F2A1F]">
                                {info.barangay || "—"}
                            </Text>
                        </View>
                    </View>
                    {fullName.length > 0 && (
                        <Text className="text-[11.5px] text-[#9C978C] mt-2 ml-1">
                            Buong pangalan: {fullName}
                        </Text>
                    )}
                </Section>

                {/* Raw OCR text, for checking what the scan actually saw */}
                {request.ocr.rawText.length > 0 && (
                    <View className="mb-2">
                        <Pressable
                            onPress={() => setShowRawText((v) => !v)}
                            className="flex-row items-center gap-1.5 ml-1 mb-2"
                        >
                            <Ionicons
                                name={
                                    showRawText
                                        ? "chevron-down"
                                        : "chevron-forward"
                                }
                                size={14}
                                color="#7A6D5C"
                            />
                            <Text className="text-[12.5px] font-medium text-[#7A6D5C]">
                                Buong teksto na nabasa ng OCR
                            </Text>
                        </Pressable>
                        {showRawText && (
                            <View className="bg-[#F0EDE6] rounded-2xl p-3">
                                <Text
                                    className="text-[11.5px] text-[#4B4739] leading-4"
                                    style={{
                                        fontFamily:
                                            Platform.OS === "ios"
                                                ? "Menlo"
                                                : "monospace",
                                    }}
                                    selectable
                                >
                                    {request.ocr.rawText.trim()}
                                </Text>
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>

            {/* Decision buttons, only while pending */}
            {isPending && (
                <View className="flex-row gap-3 px-6 pt-3 pb-4 border-t border-[#EDEAE2] bg-[--main-white]">
                    <Pressable
                        onPress={() => setShowRejectModal(true)}
                        disabled={isSubmitting}
                        className="flex-1 flex-row items-center justify-center gap-2 rounded-[20px] border-2 border-[#9C3A2A]"
                        style={{ opacity: isSubmitting ? 0.5 : 1 }}
                    >
                        <Ionicons name="close" size={19} color="#9C3A2A" />
                        <Text className="text-[15px] font-semibold text-[#9C3A2A]">
                            Tanggihan
                        </Text>
                    </Pressable>
                    <View className="flex-1">
                        <ClayButton
                            colors={["#4C7350", "#254631"]}
                            borderRadius={20}
                            disabled={isSubmitting}
                            onPress={handleApprove}
                        >
                            {isSubmitting && !showRejectModal ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <Ionicons
                                    name="checkmark"
                                    size={19}
                                    color="#fff"
                                />
                            )}
                            <Text className="text-white font-semibold text-[15px]">
                                Aprubahan
                            </Text>
                        </ClayButton>
                    </View>
                </View>
            )}

            {/* Full screen ID or selfie */}
            <Modal
                visible={!!fullscreenUrl}
                transparent
                animationType="fade"
                onRequestClose={() => setFullscreenUrl(null)}
            >
                <Pressable
                    className="flex-1 bg-black items-center justify-center"
                    onPress={() => setFullscreenUrl(null)}
                >
                    {fullscreenUrl && (
                        <Image
                            source={{ uri: fullscreenUrl }}
                            className="w-full h-full"
                            resizeMode="contain"
                        />
                    )}
                    <View className="absolute top-14 right-5 w-10 h-10 rounded-full bg-white/20 items-center justify-center">
                        <Ionicons name="close" size={22} color="#fff" />
                    </View>
                </Pressable>
            </Modal>

            {/* Rejection reason */}
            <Modal
                visible={showRejectModal}
                transparent
                animationType="slide"
                onRequestClose={() =>
                    !isSubmitting && setShowRejectModal(false)
                }
            >
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === "ios" ? "padding" : undefined}
                >
                    <Pressable
                        className="flex-1 bg-black/40 justify-end"
                        onPress={() =>
                            !isSubmitting && setShowRejectModal(false)
                        }
                    >
                        <Pressable
                            className="bg-[--main-white] rounded-t-[28px] px-6 pb-8"
                            onPress={(e) => e.stopPropagation()}
                        >
                            <View className="items-center pt-3 pb-3">
                                <View className="w-10 h-1.5 rounded-full bg-[#E5E1D8]" />
                            </View>
                            <Text className="text-[17px] font-bold text-[#1F2A1F]">
                                Tanggihan ang beripikasyon
                            </Text>
                            <Text className="text-[12.5px] text-[#7A6D5C] leading-[18px] mt-1 mb-4">
                                Makikita ni {request.username} ang dahilang ito
                                para maitama niya bago magsumite muli.
                            </Text>

                            <View className="flex-row flex-wrap gap-2 mb-3">
                                {QUICK_REASONS.map((quick) => (
                                    <Pressable
                                        key={quick}
                                        onPress={() => setReason(quick)}
                                        disabled={isSubmitting}
                                        className="rounded-full px-3 py-1.5"
                                        style={{
                                            backgroundColor:
                                                reason === quick
                                                    ? "#9C3A2A"
                                                    : "#F0EDE6",
                                        }}
                                    >
                                        <Text
                                            className="text-[12px] font-medium"
                                            style={{
                                                color:
                                                    reason === quick
                                                        ? "#fff"
                                                        : "#1F2A1F",
                                            }}
                                        >
                                            {quick}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>

                            <TextInput
                                value={reason}
                                onChangeText={setReason}
                                placeholder="Isulat ang dahilan..."
                                placeholderTextColor="#9C978C"
                                multiline
                                maxLength={REASON_MAX}
                                textAlignVertical="top"
                                editable={!isSubmitting}
                                className="rounded-2xl bg-[#F0EDE6] px-4 py-3 text-[14.5px] text-[#1F2A1F] min-h-[96px]"
                            />
                            <Text className="text-[11px] text-[#9C978C] text-right mt-1 mb-4">
                                {reason.length}/{REASON_MAX}
                            </Text>

                            <ClayButton
                                colors={["#E0715F", "#9C3A2A"]}
                                borderRadius={20}
                                disabled={!canReject || isSubmitting}
                                onPress={() => submitReview("reject")}
                            >
                                {isSubmitting && (
                                    <ActivityIndicator
                                        color="#fff"
                                        size="small"
                                    />
                                )}
                                <Text className="text-white font-semibold text-[16px]">
                                    {isSubmitting
                                        ? "Ipinapadala..."
                                        : "Tanggihan"}
                                </Text>
                            </ClayButton>
                        </Pressable>
                    </Pressable>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
}
