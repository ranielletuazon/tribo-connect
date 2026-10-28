import { clayRaised } from "@/components/clay";
import { PALETTE } from "@/constants/palette";
import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { Text, View } from "react-native";

export const ERROR_COLOR = "#C0392B";

// background and border of the text boxes inside a step
export const FIELD_BG = "#FBF8F3";
export const FIELD_BORDER = "#ECE6DA";

// numbered card for each part of a form, the number turns into a
// check once that part is filled in
export function StepSection({
    step,
    title,
    hint,
    done,
    trailing,
    children,
}: {
    step: number;
    title: string;
    hint?: string;
    done: boolean;
    trailing?: ReactNode;
    children: ReactNode;
}) {
    return (
        <View style={clayRaised} className="bg-white rounded-[26px] p-4 mb-4">
            <View className="flex-row items-center gap-3 mb-4">
                <View
                    className="w-8 h-8 rounded-full items-center justify-center"
                    style={{
                        backgroundColor: done
                            ? PALETTE.forest
                            : "rgba(232,169,59,0.18)",
                    }}
                >
                    {done ? (
                        <Ionicons name="checkmark" size={17} color="#fff" />
                    ) : (
                        <Text
                            className="text-[14px] font-extrabold"
                            style={{ color: "#B9791A" }}
                        >
                            {step}
                        </Text>
                    )}
                </View>
                <View className="flex-1">
                    <Text
                        className="text-[15.5px] font-extrabold"
                        style={{ color: PALETTE.ink }}
                    >
                        {title}
                    </Text>
                    {hint ? (
                        <Text
                            className="text-[11.5px] mt-0.5"
                            style={{ color: PALETTE.muted }}
                        >
                            {hint}
                        </Text>
                    ) : null}
                </View>
                {trailing}
            </View>
            {children}
        </View>
    );
}

export function ErrorText({ children }: { children: string }) {
    return (
        <View className="flex-row items-center gap-1.5 mt-2">
            <Ionicons name="alert-circle" size={14} color={ERROR_COLOR} />
            <Text className="text-[12.5px]" style={{ color: ERROR_COLOR }}>
                {children}
            </Text>
        </View>
    );
}
