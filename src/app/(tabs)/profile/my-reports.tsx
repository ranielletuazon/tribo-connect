import { AuthHeader } from "@/components/auth-header";
import { BackgroundBlobs, clayRaised, pressScale } from "@/components/clay";
import { PALETTE } from "@/constants/palette";
import { useLanguage } from "@/hooks/use-language";
import { formatTimeAgo } from "@/lib/posts";
import {
    findReportCategory,
    mapDocToReport,
    myReportsQuery,
    sortNewestFirst,
    type Report,
} from "@/lib/reports";
import { useAuth } from "@/providers/auth-provider";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const REPORT_COLORS: [string, string] = ["#F2BD4E", "#C9821F"];

function formatDate(report: Report, lang: "tl" | "en"): string {
    if (!report.createdAt) return "";
    return report.createdAt
        .toDate()
        .toLocaleDateString(lang === "en" ? "en-PH" : "fil-PH", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
}

function ReportCard({ report }: { report: Report }) {
    const { lang, t } = useLanguage();
    const [expanded, setExpanded] = useState(false);

    return (
        <Pressable onPress={() => setExpanded((prev) => !prev)}>
            {({ pressed }) => (
                <View
                    className="bg-white rounded-[24px] p-4 mb-3"
                    style={[clayRaised, pressScale(pressed)]}
                >
                    <View className="flex-row flex-wrap gap-1.5 mb-2.5">
                        {report.categories.map((key) => {
                            const cat = findReportCategory(key);
                            return (
                                <View
                                    key={key}
                                    className="flex-row items-center gap-1 rounded-full px-2.5 py-1"
                                    style={{
                                        backgroundColor: `${cat.colors[0]}26`,
                                    }}
                                >
                                    <Ionicons
                                        name={cat.icon}
                                        size={11}
                                        color={cat.colors[1]}
                                    />
                                    <Text
                                        className="text-[11px] font-bold"
                                        style={{ color: cat.colors[1] }}
                                    >
                                        {t(cat.label, cat.labelEn)}
                                    </Text>
                                </View>
                            );
                        })}
                    </View>

                    <Text
                        className="text-[15px] font-extrabold"
                        style={{ color: PALETTE.ink }}
                        numberOfLines={expanded ? undefined : 2}
                    >
                        {report.subject}
                    </Text>
                    <Text
                        className="text-[13.5px] leading-[20px] mt-1"
                        style={{ color: PALETTE.muted }}
                        numberOfLines={expanded ? undefined : 3}
                    >
                        {report.description}
                    </Text>

                    <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-[#F1ECE3]">
                        <View className="flex-row items-center gap-1.5">
                            <Ionicons
                                name="time-outline"
                                size={13}
                                color="#B5AFA0"
                            />
                            <Text className="text-[11.5px] text-[#9C978C]">
                                {formatTimeAgo(report.createdAt, lang)}
                                {report.createdAt
                                    ? ` · ${formatDate(report, lang)}`
                                    : ""}
                            </Text>
                        </View>
                        <View
                            className="flex-row items-center gap-1 rounded-full px-2.5 py-1"
                            style={{ backgroundColor: "rgba(62,123,79,0.12)" }}
                        >
                            <Ionicons
                                name="checkmark-done"
                                size={12}
                                color={PALETTE.forest}
                            />
                            <Text
                                className="text-[11px] font-bold"
                                style={{ color: PALETTE.forest }}
                            >
                                {t("Naipadala", "Sent")}
                            </Text>
                        </View>
                    </View>
                </View>
            )}
        </Pressable>
    );
}

export default function MyReports() {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [reports, setReports] = useState<Report[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        if (!user) return;
        return onSnapshot(
            myReportsQuery(user.uid),
            (snap) => {
                setReports(sortNewestFirst(snap.docs.map(mapDocToReport)));
                setHasError(false);
                setIsLoading(false);
            },
            (err) => {
                console.error("Load my reports error:", err);
                setHasError(true);
                setIsLoading(false);
            },
        );
    }, [user]);

    return (
        <SafeAreaView
            className="flex-1"
            style={{ backgroundColor: PALETTE.cream }}
            edges={["top"]}
        >
            <BackgroundBlobs
                colors={[PALETTE.gold, PALETTE.leaf]}
                opacity={[0.22, 0.2]}
            />

            <ScrollView
                contentContainerClassName="px-5 pt-4 pb-10 grow"
                showsVerticalScrollIndicator={false}
            >
                <AuthHeader title={t("Aking mga Ulat", "My Reports")} />

                {isLoading ? (
                    <View className="flex-1 items-center justify-center py-20">
                        <ActivityIndicator color={PALETTE.forest} />
                    </View>
                ) : hasError ? (
                    <View className="items-center py-16 px-6">
                        <Ionicons
                            name="cloud-offline-outline"
                            size={40}
                            color="#B5AFA0"
                        />
                        <Text
                            className="text-[14px] text-center mt-3"
                            style={{ color: PALETTE.muted }}
                        >
                            {t(
                                "Hindi ma-load ang iyong mga ulat. Pakisubukang muli mamaya.",
                                "Couldn't load your reports. Please try again later.",
                            )}
                        </Text>
                    </View>
                ) : reports.length === 0 ? (
                    <View
                        className="bg-white rounded-[26px] p-6 items-center mt-2"
                        style={clayRaised}
                    >
                        <View className="w-16 h-16 rounded-full bg-[#FCF1DC] items-center justify-center mb-4">
                            <Ionicons
                                name="document-text"
                                size={28}
                                color="#C9821F"
                            />
                        </View>
                        <Text
                            className="text-[17px] font-bold text-center"
                            style={{ color: PALETTE.ink }}
                        >
                            {t("Wala pang ulat", "No reports yet")}
                        </Text>
                        <Text
                            className="text-[13.5px] text-center leading-5 mt-2 mb-5"
                            style={{ color: PALETTE.muted }}
                        >
                            {t(
                                "Dito makikita ang mga ulat na ipapadala mo sa barangay.",
                                "The reports you send to the barangay will show up here.",
                            )}
                        </Text>
                        <Pressable
                            onPress={() => router.push("/(tabs)/report")}
                            className="self-stretch"
                        >
                            {({ pressed }) => (
                                <LinearGradient
                                    colors={REPORT_COLORS}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={[
                                        pressScale(pressed),
                                        {
                                            borderRadius: 20,
                                            paddingVertical: 15,
                                            flexDirection: "row",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            gap: 8,
                                        },
                                    ]}
                                >
                                    <Ionicons
                                        name="megaphone"
                                        size={17}
                                        color="#fff"
                                    />
                                    <Text className="text-white text-[15px] font-bold">
                                        {t(
                                            "Mag-report ng Insidente",
                                            "Report an Incident",
                                        )}
                                    </Text>
                                </LinearGradient>
                            )}
                        </Pressable>
                    </View>
                ) : (
                    <>
                        <Text
                            className="text-[12.5px] mb-3 ml-1"
                            style={{ color: PALETTE.muted }}
                        >
                            {t(
                                `${reports.length} ulat · pindutin ang ulat para makita ang buong detalye`,
                                `${reports.length} ${reports.length === 1 ? "report" : "reports"} · tap a report to see the full details`,
                            )}
                        </Text>
                        {reports.map((report) => (
                            <ReportCard key={report.id} report={report} />
                        ))}
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
