import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ACTIVE_COLOR = "#4B6B4F"; // green color for the active tab
const INACTIVE_COLOR = "#9CA3AF";

export default function TabsLayout() {
    const insets = useSafeAreaInsets();

    return (
        <Tabs
            backBehavior="history"
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: false,
                tabBarHideOnKeyboard: true,
                tabBarActiveTintColor: ACTIVE_COLOR,
                tabBarInactiveTintColor: INACTIVE_COLOR,
                tabBarStyle: {
                    paddingTop: 10,
                    paddingBottom: insets.bottom + 8,
                    height: 48 + insets.bottom,
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "Home",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="home" color={color} size={size + 2} />
                    ),
                }}
            />
            <Tabs.Screen
                name="feed"
                options={{
                    title: "Feed",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="albums" color={color} size={size + 2} />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: "Profile",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="person" color={color} size={size + 2} />
                    ),
                }}
            />

            {/* hidden from the tab bar but can still be opened with router.push */}
            <Tabs.Screen name="community" options={{ href: null }} />
            <Tabs.Screen name="emergency" options={{ href: null }} />
            <Tabs.Screen name="chat" options={{ href: null }} />
            <Tabs.Screen name="report" options={{ href: null }} />
            <Tabs.Screen name="tribobot" options={{ href: null }} />
        </Tabs>
    );
}
