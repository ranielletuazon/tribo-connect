import { clayRaised } from "@/components/clay";
import { GoogleSignInError } from "@/lib/google-signin";
import { useAuth } from "@/providers/auth-provider";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

function getGoogleErrorMessage(error: unknown): string | null {
    if (error instanceof GoogleSignInError) {
        switch (error.code) {
            case "unavailable":
                return "Hindi available ang Google login sa bersyong ito ng app.";
            case "play-services":
                return "Kailangan ng Google Play Services para mag-login gamit ang Google.";
            case "in-progress":
                // the account picker is already open
                return null;
            default:
                return "Nabigo ang Google login. Pakisubukang muli.";
        }
    }

    const code =
        typeof error === "object" && error !== null && "code" in error
            ? String((error as { code: unknown }).code)
            : "";

    switch (code) {
        case "auth/account-exists-with-different-credential":
            return "May account na gamit ang email na ito. Mag-login muna gamit ang iyong email at password, pagkatapos ay magagamit mo na rin ang Google.";
        case "auth/user-disabled":
            return "Na-disable ang account na ito.";
        case "auth/network-request-failed":
            return "Walang koneksyon sa internet. Pakisubukang muli.";
        default:
            return "Nabigo ang Google login. Pakisubukang muli.";
    }
}

// the root guard handles where to go next: account-setup for new
// accounts, the app for accounts that are already set up
export function GoogleSignInButton({
    disabled = false,
}: {
    disabled?: boolean;
}) {
    const { signInWithGoogle } = useAuth();
    const [isSigningIn, setIsSigningIn] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handlePress = async () => {
        if (isSigningIn || disabled) return;
        setError(null);
        setIsSigningIn(true);
        try {
            await signInWithGoogle();
        } catch (err) {
            console.error("Google sign in error:", err);
            setError(getGoogleErrorMessage(err));
        } finally {
            setIsSigningIn(false);
        }
    };

    return (
        <View className="mb-3">
            <View style={clayRaised} className="rounded-2xl">
                <Pressable
                    onPress={handlePress}
                    disabled={isSigningIn || disabled}
                    className="flex-row items-center justify-center gap-2.5 bg-[#F0EDE6] rounded-2xl py-3.5"
                >
                    {isSigningIn ? (
                        <ActivityIndicator size="small" color="#1F2A1F" />
                    ) : (
                        <Ionicons
                            name="logo-google"
                            size={18}
                            color="#1F2A1F"
                        />
                    )}
                    <Text className="text-[15px] font-medium text-[#1F2A1F]">
                        {isSigningIn ? "Sandali lang..." : "Google"}
                    </Text>
                </Pressable>
            </View>
            {error && (
                <Text className="text-[13px] text-[#B23A2E] mt-2 px-1">
                    {error}
                </Text>
            )}
        </View>
    );
}
