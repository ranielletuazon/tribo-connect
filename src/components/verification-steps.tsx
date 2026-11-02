import { useLanguage } from "@/hooks/use-language";
import { Ionicons } from "@expo/vector-icons";
import { Fragment } from "react";
import { Text, View } from "react-native";

const STEPS = {
    tl: ["Kunan ang ID", "Selfie", "Suriin ang Detalye"],
    en: ["Capture ID", "Selfie", "Review Details"],
};

// progress bar at the top of the verification screens, current is 0-based
export function VerificationSteps({ current }: { current: number }) {
    const { lang } = useLanguage();
    const steps = STEPS[lang];

    return (
        <View className="flex-row items-center mb-5 px-1">
            {steps.map((label, i) => {
                const done = i < current;
                const active = i === current;
                return (
                    <Fragment key={label}>
                        <View className="items-center" style={{ width: 72 }}>
                            <View
                                className="w-7 h-7 rounded-full items-center justify-center"
                                style={{
                                    backgroundColor:
                                        done || active ? "#2F5233" : "#E5E1D8",
                                }}
                            >
                                {done ? (
                                    <Ionicons
                                        name="checkmark"
                                        size={15}
                                        color="#fff"
                                    />
                                ) : (
                                    <Text
                                        className="text-[12px] font-bold"
                                        style={{
                                            color: active ? "#fff" : "#9C978C",
                                        }}
                                    >
                                        {i + 1}
                                    </Text>
                                )}
                            </View>
                            <Text
                                className="text-[10.5px] mt-1 text-center"
                                style={{
                                    color: active ? "#1F2A1F" : "#9C978C",
                                    fontWeight: active ? "600" : "400",
                                }}
                            >
                                {label}
                            </Text>
                        </View>
                        {i < steps.length - 1 && (
                            <View
                                className="flex-1 h-0.5 rounded-full -mt-4"
                                style={{
                                    backgroundColor: done
                                        ? "#2F5233"
                                        : "#E5E1D8",
                                }}
                            />
                        )}
                    </Fragment>
                );
            })}
        </View>
    );
}
