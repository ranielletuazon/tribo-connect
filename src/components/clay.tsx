import { LinearGradient } from "expo-linear-gradient";
import { View, type ViewStyle } from "react-native";

// Shadow-only clay treatment — default for repeated/smaller elements
export const clayRaised: ViewStyle = {
    shadowColor: "#7A6A50",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 6,
};

// Gradient border wrapper — reserved for high-priority, non-repeated elements only
// (hero banners, primary CTAs, emergency/alert cards) — not list items or repeated rows.
export function GradientBorderCard({
    colors,
    borderRadius,
    borderWidth = 1.5,
    style,
    innerStyle,
    children,
}: {
    colors: [string, string, ...string[]];
    borderRadius: number;
    borderWidth?: number;
    style?: ViewStyle;
    innerStyle?: ViewStyle;
    children: React.ReactNode;
}) {
    return (
        <LinearGradient
            colors={colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[{ borderRadius, padding: borderWidth }, clayRaised, style]}
        >
            <View
                style={[
                    {
                        borderRadius: borderRadius - borderWidth,
                        overflow: "hidden",
                    },
                    innerStyle,
                ]}
            >
                {children}
            </View>
        </LinearGradient>
    );
}
