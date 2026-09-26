import { AuthHeader } from "@/components/auth-header";
import { ClayButton } from "@/components/clay";
import { VerificationSteps } from "@/components/verification-steps";
import { uploadImage } from "@/lib/upload-image";
import { useAuth } from "@/providers/auth-provider";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const CIRCLE_SIZE = 220;

const TIPS: { icon: keyof typeof Ionicons.glyphMap; text: string }[] = [
    { icon: "happy-outline", text: "Harapin ang camera nang diretso" },
    { icon: "glasses-outline", text: "Tanggalin ang salamin, sumbrero o mask" },
    {
        icon: "sunny-outline",
        text: "Maliwanag na lugar, walang anino sa mukha",
    },
    { icon: "person-outline", text: "Ikaw lang dapat ang nasa larawan" },
];

export default function VerifySelfie() {
    // passed along from verify-id to verify-details
    const params = useLocalSearchParams<{
        idType: string;
        imagePath: string;
        fieldsJson?: string;
        typeMatch?: string;
    }>();
    const { user } = useAuth();

    const [selfieUri, setSelfieUri] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // camera only, so the selfie is taken now and not an old photo
    const handleCapture = async () => {
        if (isUploading) return;
        setError(null);

        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
            setError(
                "Kailangan ng pahintulot sa camera para makakuha ng selfie.",
            );
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ["images"],
            quality: 0.7,
            cameraType: ImagePicker.CameraType.front,
        });
        if (!result.canceled) setSelfieUri(result.assets[0].uri);
    };

    const handleContinue = async () => {
        if (!selfieUri || !user || isUploading) return;
        setError(null);
        setIsUploading(true);
        try {
            const selfiePath = `verification/${user.uid}/selfie-${Date.now()}.jpg`;
            await uploadImage(selfieUri, selfiePath);
            router.push({
                pathname: "/(tabs)/profile/verify-details",
                params: { ...params, selfiePath },
            });
        } catch (err) {
            console.error("Upload selfie error:", err);
            setError("Hindi na-upload ang selfie. Pakisubukang muli.");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-[--main-white]" edges={["top"]}>
            <ScrollView contentContainerClassName="px-6 pt-4 pb-8">
                <AuthHeader title="Beripikasyon" />
                <VerificationSteps current={1} />

                <Text className="text-[20px] font-bold text-[#1F2A1F] text-center">
                    Kumuha ng Selfie
                </Text>
                <Text className="text-[13.5px] text-[#7A6D5C] text-center leading-5 mt-2 px-2">
                    Para matiyak na ikaw ang may-ari ng ID, kumuha ng malinaw na
                    larawan ng iyong mukha. Ihahambing ito ng admin sa larawan
                    sa iyong ID.
                </Text>

                {/* Face circle */}
                <Pressable
                    onPress={handleCapture}
                    disabled={isUploading}
                    className="self-center mt-7 mb-2 items-center justify-center"
                    style={{
                        width: CIRCLE_SIZE + 24,
                        height: CIRCLE_SIZE + 24,
                    }}
                >
                    <View
                        className="absolute rounded-full"
                        style={{
                            width: CIRCLE_SIZE + 24,
                            height: CIRCLE_SIZE + 24,
                            borderWidth: 2,
                            borderStyle: "dashed",
                            borderColor: selfieUri ? "#2F5233" : "#C4BFB2",
                        }}
                    />
                    <View
                        className="rounded-full overflow-hidden bg-[#F0EDE6] items-center justify-center"
                        style={{ width: CIRCLE_SIZE, height: CIRCLE_SIZE }}
                    >
                        {selfieUri ? (
                            <Image
                                source={{ uri: selfieUri }}
                                className="w-full h-full"
                                resizeMode="cover"
                                style={{ opacity: isUploading ? 0.5 : 1 }}
                            />
                        ) : (
                            <>
                                <Ionicons
                                    name="person"
                                    size={84}
                                    color="#D9D4C8"
                                />
                                <Text className="text-[12px] text-[#9C978C] mt-1">
                                    Pindutin para kumuha
                                </Text>
                            </>
                        )}
                    </View>
                    {selfieUri && !isUploading && (
                        <View className="absolute bottom-3 right-6 w-10 h-10 rounded-full bg-[#2F5233] items-center justify-center border-[3px] border-[--main-white]">
                            <Ionicons name="checkmark" size={20} color="#fff" />
                        </View>
                    )}
                </Pressable>

                {error && (
                    <Text className="text-[12.5px] text-[#B23A2E] text-center mt-2">
                        {error}
                    </Text>
                )}

                {/* Tips */}
                <View className="bg-[#F3F6F1] rounded-2xl p-4 gap-3 mt-5">
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

            {/* Buttons */}
            <View className="px-6 pt-3 pb-4 border-t border-[#EDEAE2] bg-[--main-white] gap-2">
                {selfieUri ? (
                    <>
                        <ClayButton
                            colors={["#4C7350", "#254631"]}
                            borderRadius={20}
                            disabled={isUploading}
                            onPress={handleContinue}
                        >
                            <Text className="text-white font-semibold text-[16px]">
                                {isUploading ? "Ina-upload..." : "Magpatuloy"}
                            </Text>
                            {!isUploading && (
                                <Ionicons
                                    name="arrow-forward"
                                    size={18}
                                    color="#fff"
                                />
                            )}
                        </ClayButton>
                        <Pressable
                            onPress={handleCapture}
                            disabled={isUploading}
                            className="flex-row items-center justify-center gap-2 py-2"
                        >
                            <Ionicons
                                name="refresh"
                                size={16}
                                color="#2F5233"
                            />
                            <Text className="text-[13.5px] font-semibold text-[#2F5233]">
                                Kunan Muli
                            </Text>
                        </Pressable>
                    </>
                ) : (
                    <ClayButton
                        colors={["#4C7350", "#254631"]}
                        borderRadius={20}
                        onPress={handleCapture}
                    >
                        <Ionicons name="camera" size={19} color="#fff" />
                        <Text className="text-white font-semibold text-[16px]">
                            Kumuha ng Selfie
                        </Text>
                    </ClayButton>
                )}
            </View>
        </SafeAreaView>
    );
}
