import { clayRaised } from "@/components/clay";
import { PALETTE } from "@/constants/palette";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import { Text, View } from "react-native";

// building blocks for the read-only pages under Profile
// (Help and FAQ, About, Privacy Policy)

export function InfoHero({
    icon,
    title,
    subtitle,
    colors,
}: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle: string;
    colors: [string, string];
}) {
    return (
        <LinearGradient
            colors={colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
                clayRaised,
                {
                    borderRadius: 30,
                    overflow: "hidden",
                    marginTop: 4,
                    marginBottom: 22,
                },
            ]}
        >
            {/* big faded icon as a background decoration */}
            <View
                pointerEvents="none"
                className="absolute"
                style={{ right: -20, top: -16, opacity: 0.16 }}
            >
                <Ionicons name={icon} size={130} color="#fff" />
            </View>
            <View className="p-5">
                <View className="w-12 h-12 rounded-2xl bg-white/25 items-center justify-center border border-white/30 mb-3">
                    <Ionicons name={icon} size={22} color="#fff" />
                </View>
                <Text className="text-[21px] font-extrabold text-white">
                    {title}
                </Text>
                <Text className="text-[13px] text-white/90 mt-1 pr-8 leading-[19px]">
                    {subtitle}
                </Text>
            </View>
        </LinearGradient>
    );
}

export function InfoSection({
    icon,
    title,
    color,
    children,
}: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    color: string;
    children: ReactNode;
}) {
    return (
        <View className="bg-white rounded-[24px] p-4 mb-4" style={clayRaised}>
            <View className="flex-row items-center gap-3 mb-2.5">
                <View
                    className="w-9 h-9 rounded-xl items-center justify-center"
                    // light tint of the section color
                    style={{ backgroundColor: `${color}1F` }}
                >
                    <Ionicons name={icon} size={18} color={color} />
                </View>
                <Text
                    className="flex-1 text-[15px] font-extrabold"
                    style={{ color: PALETTE.ink }}
                >
                    {title}
                </Text>
            </View>
            {children}
        </View>
    );
}

export function InfoText({ children }: { children: ReactNode }) {
    return (
        <Text
            className="text-[13.5px] leading-[21px] mb-1.5"
            style={{ color: PALETTE.muted }}
        >
            {children}
        </Text>
    );
}

export function InfoBullet({ children }: { children: ReactNode }) {
    return (
        <View className="flex-row gap-2.5 mb-1.5 pr-1">
            <View
                className="w-1.5 h-1.5 rounded-full mt-[8px]"
                style={{ backgroundColor: PALETTE.leaf }}
            />
            <Text
                className="flex-1 text-[13.5px] leading-[21px]"
                style={{ color: PALETTE.muted }}
            >
                {children}
            </Text>
        </View>
    );
}

// a bold label at the start of a bullet or paragraph
export function InfoStrong({ children }: { children: ReactNode }) {
    return (
        <Text className="font-bold" style={{ color: PALETTE.ink }}>
            {children}
        </Text>
    );
}
