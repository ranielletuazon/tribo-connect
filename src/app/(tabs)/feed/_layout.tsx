import { Stack } from "expo-router";

export default function FeedLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="create-post" />
        </Stack>
    );
}
