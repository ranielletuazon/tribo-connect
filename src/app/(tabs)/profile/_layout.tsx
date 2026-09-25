import { Stack } from "expo-router";

export default function ProfileLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="settings" />
            <Stack.Screen name="edit-profile" />
            <Stack.Screen name="verify" />
            <Stack.Screen name="verify-id" />
            <Stack.Screen name="verify-details" />
            <Stack.Screen name="verify-users" />
        </Stack>
    );
}
