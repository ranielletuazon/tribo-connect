import { AuthHeader } from "@/components/auth-header";
import { ClayButton, clayRaised } from "@/components/clay";
import { VerificationSteps } from "@/components/verification-steps";
import { functions } from "@/lib/firebase";
import { uploadImage } from "@/lib/upload-image";
import {
    VERIFICATION_TYPES,
    VERIFICATION_TYPE_ORDER,
    callableErrorMessage,
    type ScanResult,
    type VerificationType,
} from "@/lib/verification";
import { useAuth } from "@/providers/auth-provider";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { httpsCallable } from "firebase/functions";
import { useState } from "react";
import {
    ActivityIndicator,
    Image,
    Pressable,
    ScrollView,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Stage = "idle" | "uploading" | "scanning" | "failed";

const TIPS: { icon: keyof typeof Ionicons.glyphMap; text: string }[] = [
    { icon: "sunny-outline", text: "Maliwanag na lugar, walang silaw ng ilaw" },
    { icon: "scan-outline", text: "Buo ang ID sa larawan, walang natatakpan" },
    {
        icon: "hand-left-outline",
        text: "Hawakan nang matatag para hindi malabo",
    },
    { icon: "card-outline", text: "Orihinal na ID, hindi photocopy" },
];

// OCR on a cold function can take a while, so wait longer than the default
const scanIdImage = httpsCallable<
    { idType: VerificationType; imagePath: string },
    ScanResult
>(functions, "scanIdImage", { timeout: 150000 });

export default function VerifyId() {
    const { user } = useAuth();
    const [idType, setIdType] = useState<VerificationType | null>(null);
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [stage, setStage] = useState<Stage>("idle");
    const [failure, setFailure] = useState<string | null>(null);

    const isProcessing = stage === "uploading" || stage === "scanning";
    const selected = idType ? VERIFICATION_TYPES[idType] : null;

    const processImage = async (uri: string, type: VerificationType) => {
        if (!user) return;
        setFailure(null);
        try {
            setStage("uploading");
            const imagePath = `verification/${user.uid}/id-${Date.now()}.jpg`;
            await uploadImage(uri, imagePath);

            setStage("scanning");
            const { data } = await scanIdImage({ idType: type, imagePath });
            if (!data.ok) {
                setStage("failed");
                setFailure(data.message);
                return;
            }

            setStage("idle");
            router.push({
                pathname: "/(tabs)/profile/verify-selfie",
                params: {
                    idType: type,
                    imagePath,
                    fieldsJson: JSON.stringify(data.fields),
                    typeMatch: data.typeMatch ? "1" : "0",
                },
            });
        } catch (err) {
            console.error("Scan ID error:", err);
            setStage("failed");
            setFailure(
                callableErrorMessage(
                    err,
                    "Nagkaproblema sa pagbasa ng ID. Pakisubukang muli.",
                ),
            );
        }
    };

    const handleCapture = async (source: "camera" | "gallery") => {
        if (!idType || isProcessing) return;

        const permission =
            source === "camera"
                ? await ImagePicker.requestCameraPermissionsAsync()
                : await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            setStage("failed");
            setFailure(
                source === "camera"
                    ? "Kailangan ng pahintulot sa camera para makunan ang ID."
                    : "Kailangan ng pahintulot sa mga larawan.",
            );
            return;
        }

        const options: ImagePicker.ImagePickerOptions = {
            mediaTypes: ["images"],
            quality: 0.7,
        };
        const result =
            source === "camera"
                ? await ImagePicker.launchCameraAsync(options)
                : await ImagePicker.launchImageLibraryAsync(options);
        if (result.canceled) return;

        const uri = result.assets[0].uri;
        setImageUri(uri);
        await processImage(uri, idType);
    };

    const chooseType = (type: VerificationType) => {
        if (isProcessing) return;
        setIdType(type);
        // a photo of a different ID type shouldn't carry over
        setImageUri(null);
        setStage("idle");
        setFailure(null);
    };

    // the eGov ID lives on the phone, so a screenshot is the main option
    const primarySource = selected?.allowGallery ? "gallery" : "camera";
    const hasTried = !!imageUri;

    return (
        <SafeAreaView className="flex-1 bg-[--main-white]" edges={["top"]}>
            <ScrollView contentContainerClassName="px-6 pt-4 pb-8">
                <AuthHeader title="Beripikasyon" />
                <VerificationSteps current={0} />

                {/* ID type */}
                <Text className="text-[13px] font-medium text-[#7A6D5C] mb-3 ml-1">
                    Anong ID ang gagamitin mo?
                </Text>
                <View
                    style={clayRaised}
                    className="bg-[--main-white] rounded-[20px] overflow-hidden"
                >
                    {VERIFICATION_TYPE_ORDER.map((key, i) => {
                        const type = VERIFICATION_TYPES[key];
                        const isSelected = idType === key;
                        return (
                            <Pressable
                                key={key}
                                onPress={() => chooseType(key)}
                                disabled={isProcessing}
                                className={`flex-row items-center gap-3 p-4 ${
                                    i < VERIFICATION_TYPE_ORDER.length - 1
                                        ? "border-b border-[#EDEAE2]"
                                        : ""
                                }`}
                                style={
                                    isSelected
                                        ? { backgroundColor: "#F3F6F1" }
                                        : undefined
                                }
                            >
                                <View
                                    className="w-10 h-10 rounded-full items-center justify-center"
                                    style={{
                                        backgroundColor: `${type.color}1A`,
                                    }}
                                >
                                    <Ionicons
                                        name={type.icon}
                                        size={19}
                                        color={type.color}
                                    />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-[14.5px] font-semibold text-[#1F2A1F]">
                                        {type.label}
                                    </Text>
                                    <Text className="text-[12px] text-[#7A6D5C] mt-0.5">
                                        {type.description}
                                    </Text>
                                </View>
                                <View
                                    className="w-5 h-5 rounded-full items-center justify-center"
                                    style={{
                                        borderWidth: 2,
                                        borderColor: isSelected
                                            ? "#2F5233"
                                            : "#C4BFB2",
                                    }}
                                >
                                    {isSelected && (
                                        <View className="w-2.5 h-2.5 rounded-full bg-[#2F5233]" />
                                    )}
                                </View>
                            </Pressable>
                        );
                    })}
                </View>

                {/* Captured image and scan status */}
                {imageUri && (
                    <View className="mt-6">
                        <Text className="text-[13px] font-medium text-[#7A6D5C] mb-3 ml-1">
                            Larawan ng ID
                        </Text>
                        <View
                            style={clayRaised}
                            className="rounded-2xl overflow-hidden bg-[#1F2A1F]"
                        >
                            <Image
                                source={{ uri: imageUri }}
                                className="w-full h-52"
                                resizeMode="contain"
                                style={{ opacity: isProcessing ? 0.45 : 1 }}
                            />
                            {isProcessing && (
                                <View className="absolute inset-0 items-center justify-center px-6">
                                    <ActivityIndicator
                                        color="#fff"
                                        size="large"
                                    />
                                    <Text className="text-white text-[14px] font-semibold mt-3">
                                        {stage === "uploading"
                                            ? "Ina-upload ang larawan..."
                                            : "Binabasa ang iyong ID..."}
                                    </Text>
                                    <Text className="text-white/75 text-[11.5px] mt-1 text-center">
                                        {stage === "uploading"
                                            ? "Sandali lang"
                                            : "Sinusuri ang linaw at binabasa ang detalye. Maaaring tumagal nang hanggang 30 segundo."}
                                    </Text>
                                </View>
                            )}
                        </View>

                        {stage === "failed" && failure && (
                            <View className="flex-row gap-3 bg-[#FBECE9] rounded-2xl p-4 mt-3">
                                <Ionicons
                                    name="alert-circle"
                                    size={20}
                                    color="#9C3A2A"
                                />
                                <View className="flex-1">
                                    <Text className="text-[13px] font-semibold text-[#9C3A2A]">
                                        Hindi natapos ang pagbasa
                                    </Text>
                                    <Text className="text-[12.5px] text-[#7A6D5C] leading-[18px] mt-0.5">
                                        {failure}
                                    </Text>
                                </View>
                            </View>
                        )}
                    </View>
                )}

                {/* Permission errors before any image was taken */}
                {!imageUri && stage === "failed" && failure && (
                    <Text className="text-[12.5px] text-[#B23A2E] mt-4 ml-1">
                        {failure}
                    </Text>
                )}

                {/* Tips */}
                <Text className="text-[13px] font-medium text-[#7A6D5C] mb-3 ml-1 mt-6">
                    Mga Tip para sa Malinaw na Larawan
                </Text>
                <View className="bg-[#F3F6F1] rounded-2xl p-4 gap-3">
                    {TIPS.map((tip) => (
                        <View
                            key={tip.text}
                            className="flex-row items-center gap-3"
                        >
                            <Ionicons
                                name={tip.icon}
                                size={17}
                                color="#3F5C42"
                            />
                            <Text className="flex-1 text-[12.5px] text-[#1F2A1F]">
                                {tip.text}
                            </Text>
                        </View>
                    ))}
                </View>
            </ScrollView>

            {/* Capture buttons */}
            <View className="px-6 pt-3 pb-4 border-t border-[#EDEAE2] bg-[--main-white] gap-2.5">
                <ClayButton
                    colors={["#4C7350", "#254631"]}
                    borderRadius={20}
                    disabled={!idType || isProcessing}
                    onPress={() => handleCapture(primarySource)}
                >
                    <Ionicons
                        name={primarySource === "gallery" ? "images" : "camera"}
                        size={19}
                        color="#fff"
                    />
                    <Text className="text-white font-semibold text-[16px]">
                        {primarySource === "gallery"
                            ? hasTried
                                ? "Pumili Muli ng Screenshot"
                                : "Pumili ng Screenshot"
                            : hasTried
                              ? "Kunan Muli ang ID"
                              : "Kunan ng Larawan ang ID"}
                    </Text>
                </ClayButton>

                {selected?.allowGallery && (
                    <Pressable
                        onPress={() => handleCapture("camera")}
                        disabled={isProcessing}
                        className="flex-row items-center justify-center gap-2 py-2"
                    >
                        <Ionicons
                            name="camera-outline"
                            size={17}
                            color="#2F5233"
                        />
                        <Text className="text-[13.5px] font-semibold text-[#2F5233]">
                            O kunan gamit ang camera
                        </Text>
                    </Pressable>
                )}

                {!idType && (
                    <Text className="text-[11.5px] text-[#9C978C] text-center">
                        Pumili muna ng uri ng ID
                    </Text>
                )}
            </View>
        </SafeAreaView>
    );
}
