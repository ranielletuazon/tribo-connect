import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import { Pressable, View, type StyleProp, type ViewStyle } from "react-native";

export const clayRaised: ViewStyle = {
    shadowColor: "#7A6A50",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 6,
};

export function ClaySurface({
    colors,
    borderRadius = 20,
    style,
    children,
}: {
    colors: [string, string, ...string[]];
    borderRadius?: number;
    style?: StyleProp<ViewStyle>;
    children: ReactNode;
}) {
    return (
        <LinearGradient
            colors={colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={[{ borderRadius }, clayRaised, style]}
        >
            {children}
        </LinearGradient>
    );
}

export function ClayButton({
    colors,
    borderRadius = 20,
    onPress,
    disabled,
    style,
    children,
}: {
    colors: [string, string, ...string[]];
    borderRadius?: number;
    onPress?: () => void;
    disabled?: boolean;
    style?: StyleProp<ViewStyle>;
    children: ReactNode;
}) {
    return (
        <Pressable onPress={onPress} disabled={disabled}>
            {({ pressed }) => (
                <ClaySurface
                    colors={colors}
                    borderRadius={borderRadius}
                    style={[
                        {
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 8,
                            paddingVertical: 16,
                            opacity: pressed ? 0.85 : disabled ? 0.5 : 1,
                        },
                        style,
                    ]}
                >
                    {children}
                </ClaySurface>
            )}
        </Pressable>
    );
}

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
    style?: StyleProp<ViewStyle>;
    innerStyle?: StyleProp<ViewStyle>;
    children: ReactNode;
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
