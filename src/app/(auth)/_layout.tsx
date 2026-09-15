import { Stack } from "expo-router";

export default function AuthLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            {/* Add routes here */}
            {/* <Stack.Screen name="index" /> */}
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
            <Stack.Screen name="account-setup" />
            <Stack.Screen name="otp-verify" />
        </Stack>
    );
}
