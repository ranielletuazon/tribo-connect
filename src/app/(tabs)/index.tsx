import { Ionicons } from "@expo/vector-icons";
import {
    ImageBackground,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const HERO_PLACEHOLDER = {
    uri: "https://placehold.co/800x400/2d3b2e/ffffff?text=Community+Photo",
};

export default function Home() {
    return (
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.avatar}>
                        <Ionicons name="person" size={20} color="#fff" />
                    </View>
                    <View>
                        <Text style={styles.greeting}>
                            Hello, Juan Dela Cruz
                        </Text>
                        <Text style={styles.role}>Aeta Community Member</Text>
                    </View>
                </View>

                {/* Hero banner */}
                <ImageBackground
                    source={HERO_PLACEHOLDER}
                    style={styles.hero}
                    imageStyle={styles.heroImage}
                >
                    <View style={styles.heroOverlay}>
                        <Text style={styles.heroTitle}>
                            Welcome to{"\n"}TriboConnect
                        </Text>
                        <Text style={styles.heroSubtitle}>
                            Your community. Your voice. Your safety.
                        </Text>
                    </View>
                </ImageBackground>

                {/* Feature grid — raw, no component */}
                <View style={styles.grid}>
                    <View style={styles.card}>
                        <View
                            style={[
                                styles.iconBadge,
                                { backgroundColor: "#E8654B" },
                            ]}
                        >
                            <Ionicons name="megaphone" size={20} color="#fff" />
                        </View>
                        <Text style={styles.cardTitle}>Announcements</Text>
                        <Text style={styles.cardSubtitle}>
                            Latest updates from your barangay
                        </Text>
                    </View>

                    <View style={styles.card}>
                        <View
                            style={[
                                styles.iconBadge,
                                { backgroundColor: "#2F9E8F" },
                            ]}
                        >
                            <Ionicons
                                name="chatbubbles"
                                size={20}
                                color="#fff"
                            />
                        </View>
                        <Text style={styles.cardTitle}>Messages</Text>
                        <Text style={styles.cardSubtitle}>
                            Chat with your family and community
                        </Text>
                    </View>

                    <View style={styles.card}>
                        <View
                            style={[
                                styles.iconBadge,
                                { backgroundColor: "#F0803D" },
                            ]}
                        >
                            <Ionicons name="warning" size={20} color="#fff" />
                        </View>
                        <Text style={styles.cardTitle}>Emergency</Text>
                        <Text style={styles.cardSubtitle}>
                            Report and get help quickly
                        </Text>
                    </View>

                    <View style={styles.card}>
                        <View
                            style={[
                                styles.iconBadge,
                                { backgroundColor: "#3B6FD1" },
                            ]}
                        >
                            <Ionicons
                                name="document-text"
                                size={20}
                                color="#fff"
                            />
                        </View>
                        <Text style={styles.cardTitle}>Report Incident</Text>
                        <Text style={styles.cardSubtitle}>
                            Send a report and track status
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: "#F7F4EE" },
    scrollContent: { padding: 20, paddingBottom: 32 },
    header: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginBottom: 20,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#4B6B4F",
        alignItems: "center",
        justifyContent: "center",
    },
    greeting: { fontSize: 15, fontWeight: "600", color: "#1F2A1F" },
    role: { fontSize: 12.5, color: "#6B7280", marginTop: 1 },
    hero: {
        height: 160,
        borderRadius: 20,
        overflow: "hidden",
        marginBottom: 20,
    },
    heroImage: { borderRadius: 20 },
    heroOverlay: {
        flex: 1,
        justifyContent: "flex-end",
        padding: 18,
        backgroundColor: "rgba(20,30,20,0.35)",
    },
    heroTitle: {
        color: "#fff",
        fontSize: 22,
        fontWeight: "700",
        lineHeight: 27,
    },
    heroSubtitle: { color: "#EDEDED", fontSize: 13, marginTop: 6 },
    grid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
    },
    card: {
        flexBasis: "48%",
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
        marginBottom: 14,
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
        elevation: 2,
    },
    iconBadge: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 10,
    },
    cardTitle: {
        fontSize: 15,
        fontWeight: "600",
        color: "#1F2A1F",
        marginBottom: 3,
    },
    cardSubtitle: { fontSize: 12.5, color: "#6B7280", lineHeight: 17 },
});
