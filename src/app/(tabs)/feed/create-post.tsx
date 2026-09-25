import { db } from "@/lib/firebase";
import { uploadImage } from "@/lib/upload-image";
import { useAuth } from "@/providers/auth-provider";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { collection, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { useState } from "react";
import {
    Image,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CreatePost() {
    const router = useRouter();
    const { user, profile } = useAuth();
    const [content, setContent] = useState("");
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [isPosting, setIsPosting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const canPost = (content.trim().length > 0 || !!imageUri) && !isPosting;
    const initials = (profile?.username ?? "U").slice(0, 2).toUpperCase();

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
        if (!canPost || !user || !profile) return;
        setError(null);
        setIsPosting(true);

        try {
            const postRef = doc(collection(db, "posts"));

            let imageUrl: string | null = null;
            if (imageUri) {
                imageUrl = await uploadImage(
                    imageUri,
                    `posts/${postRef.id}.jpg`,
                );
            }

            const newPost = {
                id: postRef.id,
                authorId: user.uid,
                authorName: profile.username,
                authorBarangay: profile.barangay,
                authorPhotoURL: profile.photoURL ?? null,
                content: content.trim(),
                imageUrl,
                likeCount: 0,
                commentCount: 0,
            };

            await setDoc(postRef, { ...newPost, createdAt: serverTimestamp() });

            router.back();
            router.setParams({
                newPostJson: JSON.stringify({ ...newPost, createdAt: null }),
            });
        } catch (err) {
            console.error("Create post error:", err);
            setError("Nabigo ang pag-post. Pakisubukang muli.");
        } finally {
            setIsPosting(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-[--main-white]" edges={["top"]}>
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
                    Gumawa ng Post
                </Text>
                <Pressable
                    disabled={!canPost}
                    onPress={handlePost}
                    className="rounded-full px-4 py-1.5"
                    style={{ backgroundColor: canPost ? "#2F5233" : "#E5E1D8" }}
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
                contentContainerClassName="px-4 pt-4 pb-8"
                keyboardShouldPersistTaps="handled"
            >
                {error && (
                    <Text className="text-[13px] text-[#B23A2E] mb-3">
                        {error}
                    </Text>
                )}

                {/* Author name and profile photo */}
                <View className="flex-row items-center gap-3 mb-3">
                    <View className="w-11 h-11 rounded-full bg-[#5C7A5F] items-center justify-center overflow-hidden">
                        {profile?.photoURL ? (
                            <Image
                                source={{ uri: profile.photoURL }}
                                className="w-full h-full"
                                resizeMode="cover"
                            />
                        ) : (
                            <Text className="text-white text-[13px] font-semibold">
                                {initials}
                            </Text>
                        )}
                    </View>
                    <View>
                        <Text className="text-[14.5px] font-bold text-[#1F2A1F]">
                            {profile?.username ?? "Gumagamit"}
                        </Text>
                        <View className="flex-row items-center gap-1 mt-0.5 bg-[#F0EDE6] self-start rounded-full px-2 py-0.5">
                            <Ionicons name="earth" size={11} color="#7A6D5C" />
                            <Text className="text-[11px] text-[#7A6D5C]">
                                Publiko
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Text input */}
                <TextInput
                    placeholder={`Ano ang nasa isip mo, ${profile?.username ?? "kaibigan"}?`}
                    placeholderTextColor="#9C978C"
                    value={content}
                    onChangeText={setContent}
                    multiline
                    autoFocus
                    editable={!isPosting}
                    className="text-[17px] text-[#1F2A1F] leading-6 min-h-[80px]"
                />

                {/* Image preview */}
                {imageUri && (
                    <View className="relative mt-2 mb-4">
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
                                <Ionicons name="close" size={18} color="#fff" />
                            </Pressable>
                        )}
                    </View>
                )}

                {/* Add image */}
                <Pressable
                    onPress={handlePickImage}
                    disabled={isPosting}
                    className="flex-row items-center justify-between border border-[#EDEAE2] rounded-2xl px-4 py-3 mt-2"
                >
                    <Text className="text-[13.5px] font-medium text-[#1F2A1F]">
                        Idagdag ng Larawan
                    </Text>
                    <View className="w-9 h-9 rounded-full bg-[#3F9142] items-center justify-center">
                        <Ionicons name="image" size={18} color="#fff" />
                    </View>
                </Pressable>
            </ScrollView>
        </SafeAreaView>
    );
}
