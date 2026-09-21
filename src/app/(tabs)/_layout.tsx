import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

const ACTIVE_COLOR = "#4B6B4F"; // deep sage green, matches brand accent
const INACTIVE_COLOR = "#9CA3AF";

export default function TabsLayout() {
    return (
        <Tabs
            backBehavior="history"
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: ACTIVE_COLOR,
                tabBarInactiveTintColor: INACTIVE_COLOR,
                tabBarStyle: { paddingTop: 6, height: 60 },
                tabBarLabelStyle: { fontSize: 12, fontWeight: "500" },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "Home",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="home" color={color} size={size} />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: "Profile",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="person" color={color} size={size} />
                    ),
                }}
            />

            {/* Reachable via router.push, hidden from the tab bar itself */}
            <Tabs.Screen name="community" options={{ href: null }} />
            <Tabs.Screen name="emergency" options={{ href: null }} />
            <Tabs.Screen name="chat" options={{ href: null }} />
            <Tabs.Screen name="report" options={{ href: null }} />
            <Tabs.Screen name="tribobot" options={{ href: null }} />
        </Tabs>
    );
}
