// _layout.tsx at the root of the app directory

import "../global.css";

import { AuthProvider, useAuth } from "@/providers/auth-provider";
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";

function RootNavigation() {
    const { user, profile, isLoading } = useAuth();
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        if (isLoading) return;

        const inAuthGroup = segments[0] === "(auth)";
        const needsOnboarding =
            !!user && (!profile || profile.onboardingComplete === false);

        if (!user && segments.length > 0 && !inAuthGroup) {
            router.replace("/(auth)/login");
        } else if (user && needsOnboarding) {
            router.replace("/(auth)/account-setup");
        } else if (user && !needsOnboarding && inAuthGroup) {
            router.replace("/(tabs)");
        }
    }, [user, profile, isLoading, segments, router]);

    if (isLoading) {
        return <View className="flex-1 bg-main-white" />;
    }

    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
        </Stack>
    );
}

export default function RootLayout() {
    return (
        <AuthProvider>
            <RootNavigation />
        </AuthProvider>
    );
}
