import { PALETTE } from "@/constants/palette";
import { LinearGradient } from "expo-linear-gradient";
import { Image, Text, View } from "react-native";

export const AVATAR_RING: [string, string, string] = [
    PALETTE.leaf,
    PALETTE.gold,
    PALETTE.terracotta,
];

// round profile photo, or the first two letters of the name when there's no photo.
// `ring` adds the green-gold-orange ring used around avatars in the app
export function Avatar({
    name,
    photoURL,
    size = 48,
    ring = false,
}: {
    name: string;
    photoURL: string | null;
    size?: number;
    ring?: boolean;
}) {
    const face = (
        <View
            style={{
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: PALETTE.sage,
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                borderWidth: ring ? 2 : 0,
                borderColor: "#fff",
            }}
        >
            {photoURL ? (
                <Image
                    source={{ uri: photoURL }}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="cover"
                />
            ) : (
                <Text
                    style={{ fontSize: size * 0.32 }}
                    className="text-white font-bold"
                >
                    {(name || "U").slice(0, 2).toUpperCase()}
                </Text>
            )}
        </View>
    );

    if (!ring) return face;

    return (
        <LinearGradient
            colors={AVATAR_RING}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: size / 2 + 2.5, padding: 2.5 }}
        >
            {face}
        </LinearGradient>
    );
}
