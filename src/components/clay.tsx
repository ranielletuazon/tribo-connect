import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, type ReactNode } from "react";
import {
    Animated,
    Easing,
    Pressable,
    View,
    type StyleProp,
    type ViewStyle,
} from "react-native";

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

// slight shrink while pressed so cards feel tappable
export function pressScale(pressed: boolean): ViewStyle {
    return { transform: [{ scale: pressed ? 0.97 : 1 }] };
}

// soft ring that keeps growing and fading behind an icon
export function PulseRing({
    size,
    color = "#fff",
    delay = 0,
    maxScale = 1.7,
}: {
    size: number;
    color?: string;
    delay?: number;
    maxScale?: number;
}) {
    const progress = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.delay(delay),
                Animated.timing(progress, {
                    toValue: 1,
                    duration: 1800,
                    easing: Easing.out(Easing.ease),
                    useNativeDriver: true,
                }),
            ]),
        );
        loop.start();
        return () => loop.stop();
    }, [progress, delay]);

    return (
        <Animated.View
            pointerEvents="none"
            style={{
                position: "absolute",
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: color,
                opacity: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.45, 0],
                }),
                transform: [
                    {
                        scale: progress.interpolate({
                            inputRange: [0, 1],
                            outputRange: [1, maxScale],
                        }),
                    },
                ],
            }}
        />
    );
}

// two soft color circles behind the top of a screen
export function BackgroundBlobs({
    colors,
    opacity = [0.22, 0.18],
}: {
    colors: [string, string];
    opacity?: [number, number];
}) {
    return (
        <View
            pointerEvents="none"
            style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
        >
            <View
                style={{
                    position: "absolute",
                    width: 288,
                    height: 288,
                    borderRadius: 144,
                    top: -120,
                    right: -90,
                    backgroundColor: colors[0],
                    opacity: opacity[0],
                }}
            />
            <View
                style={{
                    position: "absolute",
                    width: 224,
                    height: 224,
                    borderRadius: 112,
                    top: -60,
                    left: -110,
                    backgroundColor: colors[1],
                    opacity: opacity[1],
                }}
            />
        </View>
    );
}
