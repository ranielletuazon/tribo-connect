import { getPasswordStrength } from "@/utils/password-strength";
import { Text, View } from "react-native";

export function PasswordStrengthMeter({ password }: { password: string }) {
    if (password.length === 0) return null;

    const { score, label, color } = getPasswordStrength(password);

    return (
        <View className="mt-2 px-1">
            <View className="flex-row gap-1.5 mb-1.5">
                {[1, 2, 3, 4].map((segment) => (
                    <View
                        key={segment}
                        className="flex-1 h-1.5 rounded-full"
                        style={{
                            backgroundColor:
                                segment <= score ? color : "#E5E1D8",
                        }}
                    />
                ))}
            </View>
            <Text className="text-[11px]" style={{ color }}>
                {label}
            </Text>
        </View>
    );
}
