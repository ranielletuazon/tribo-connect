import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Landing() {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.logoPlaceholder} />
            <Text style={styles.title}>TriboConnect</Text>
            <Text style={styles.subtitle}>
                Connecting the Aeta community of Porac
            </Text>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        backgroundColor: "#F7F4EE",
    },
    logoPlaceholder: {
        width: 120,
        height: 120,
        borderRadius: 24,
        backgroundColor: "#4B6B4F",
        marginBottom: 16,
    },
    title: { fontSize: 28, fontWeight: "700", color: "#1F2A1F" },
    subtitle: {
        fontSize: 15,
        color: "#6B7280",
        marginTop: 4,
        textAlign: "center",
    },
});
