import { AuthHeader } from "@/components/auth-header";
import { BackgroundBlobs, clayRaised, pressScale } from "@/components/clay";
import { InfoHero } from "@/components/info-page";
import { PALETTE } from "@/constants/palette";
import { useLanguage } from "@/hooks/use-language";
import { RATE_LIMITS } from "@/lib/moderation";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// same inbox the submitReport function sends reports to
const CONTACT_EMAIL = "triboconnectapp@gmail.com";

interface Faq {
    q: string;
    qEn: string;
    a: string;
    aEn: string;
}

interface FaqTopic {
    label: string;
    labelEn: string;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
    items: Faq[];
}

const TOPICS: FaqTopic[] = [
    {
        label: "Account",
        labelEn: "Account",
        icon: "person",
        color: PALETTE.forest,
        items: [
            {
                q: "Paano ko papalitan ang aking username o larawan?",
                qEn: "How do I change my username or photo?",
                a: "Pumunta sa Profile at pindutin ang I-edit ang Profile, o pindutin ang iyong larawan sa itaas.",
                aEn: "Go to Profile and tap Edit Profile, or tap your photo at the top.",
            },
            {
                q: "Paano palitan ang wika ng app?",
                qEn: "How do I change the app's language?",
                a: "Pumunta sa Profile > Mga Setting > Wika at piliin ang Tagalog o English.",
                aEn: "Go to Profile > Settings > Language and pick Tagalog or English.",
            },
            {
                q: "Pwede ba akong mag-login gamit ang Google?",
                qEn: "Can I log in with Google?",
                a: "Oo. Pindutin ang Google button sa Login o Register page. Kung bago ang account, kailangan mo pa ring tapusin ang account setup.",
                aEn: "Yes. Tap the Google button on the Login or Register page. If the account is new, you'll still need to finish the account setup.",
            },
        ],
    },
    {
        label: "Beripikasyon",
        labelEn: "Verification",
        icon: "shield-checkmark",
        color: "#2457B0",
        items: [
            {
                q: "Bakit kailangan kong ma-verify?",
                qEn: "Why do I need to be verified?",
                a: "Ang mga verified na residente lang ang makakapag-post sa Feed, makakapagpadala ng mensahe, at makakapag-report. Makakakuha ka rin ng asul na tsek para malaman ng iba na tunay kang residente.",
                aEn: "Only verified residents can post on the Feed, send messages, and send reports. You also get a blue check so others know you're a real resident.",
            },
            {
                q: "Paano mag-verify?",
                qEn: "How do I get verified?",
                a: "Pumunta sa Profile > I-verify ang Account. Pumili ng ID, kunan ito ng larawan, mag-selfie, at kumpirmahin ang iyong mga detalye. Agad na ibibigay ang verified badge pagkatapos.",
                aEn: "Go to Profile > Verify Account. Pick an ID, take a photo of it, take a selfie, and confirm your details. You get the verified badge right after.",
            },
            {
                q: "Anong mga ID ang tinatanggap?",
                qEn: "Which IDs are accepted?",
                a: "National ID (card o eGov app), Driver's License, Barangay ID, o iba pang valid na government ID.",
                aEn: "National ID (card or eGov app), Driver's License, Barangay ID, or another valid government ID.",
            },
            {
                q: "Bakit nawala ang aking verified badge?",
                qEn: "Why was my verified badge removed?",
                a: "Maaaring bawiin ng admin ng barangay ang badge kung may problema sa iyong beripikasyon. Makikita ang dahilan sa I-verify ang Account page. Makipag-ugnayan sa barangay para maibalik ito.",
                aEn: "A barangay admin can revoke the badge if there's a problem with your verification. The reason is shown on the Verify Account page. Contact the barangay to get it back.",
            },
        ],
    },
    {
        label: "Feed at Chat",
        labelEn: "Feed and Chat",
        icon: "chatbubbles",
        color: "#C9821F",
        items: [
            {
                q: "Paano mag-delete ng post?",
                qEn: "How do I delete a post?",
                a: "Pindutin ang ⋯ sa iyong post at piliin ang Burahin, o buksan ang post at pindutin ang basurahan sa itaas.",
                aEn: "Tap ⋯ on your post and choose Delete, or open the post and tap the trash icon at the top.",
            },
            {
                q: "Bakit hindi ma-post ang aking post o komento?",
                qEn: "Why won't my post or comment go through?",
                a: `Maaaring may hindi angkop na salita ito, o masyado kang mabilis mag-post. Hanggang ${RATE_LIMITS.post.max} post at ${RATE_LIMITS.comment.max} komento lang bawat minuto.`,
                aEn: `It may have inappropriate language, or you're posting too fast. You can make up to ${RATE_LIMITS.post.max} posts and ${RATE_LIMITS.comment.max} comments per minute.`,
            },
            {
                q: "Bakit may *** sa aking mensahe?",
                qEn: "Why are there *** in my message?",
                a: "Awtomatikong tinatakpan ng *** ang mga hindi angkop na salita sa Chat.",
                aEn: "Inappropriate words in Chat are automatically covered with ***.",
            },
            {
                q: "Paano magsimula ng chat sa isang residente?",
                qEn: "How do I start a chat with a resident?",
                a: "Pindutin ang ⋯ sa kanilang post sa Feed at piliin ang I-Chat. Makikita ang lahat ng iyong usapan sa Mensahe sa Home.",
                aEn: "Tap ⋯ on their post in the Feed and choose Chat. All your conversations are in Messages on Home.",
            },
        ],
    },
    {
        label: "Mga Ulat",
        labelEn: "Reports",
        icon: "megaphone",
        color: PALETTE.terracotta,
        items: [
            {
                q: "Paano mag-report ng insidente?",
                qEn: "How do I report an incident?",
                a: "Sa Home, pindutin ang Mag-report ng Insidente. Pumili ng uri ng ulat, maglagay ng pamagat at detalye, at pindutin ang Isumite ang Ulat.",
                aEn: "On Home, tap Report an Incident. Pick the report type, add a title and details, and tap Submit Report.",
            },
            {
                q: "Saan napupunta ang aking ulat?",
                qEn: "Where does my report go?",
                a: "Direkta itong ipinapadala sa email ng barangay. Gagamitin nila ang email ng iyong account para makipag-ugnayan sa iyo.",
                aEn: "It's sent straight to the barangay's email. They'll use your account's email to contact you.",
            },
            {
                q: 'Bakit "Naipadala Na" ang lumalabas?',
                qEn: 'Why does it say "Already Sent"?',
                a: "Naipadala mo na ang parehong ulat sa nakaraang 24 oras. Hindi na ito kailangang ipadala ulit.",
                aEn: "You already sent the same report in the last 24 hours. There's no need to send it again.",
            },
            {
                q: "Saan ko makikita ang aking mga naipadalang ulat?",
                qEn: "Where can I see the reports I sent?",
                a: "Pumunta sa Profile > Aking mga Ulat.",
                aEn: "Go to Profile > My Reports.",
            },
        ],
    },
    {
        label: "Mga Abiso at Emergency",
        labelEn: "Alerts and Emergencies",
        icon: "notifications",
        color: PALETTE.ember,
        items: [
            {
                q: "Paano ako makakatanggap ng mga anunsyo ng barangay?",
                qEn: "How do I get the barangay's announcements?",
                a: "Payagan ang notifications ng TriboConnect sa iyong telepono. Makikita rin ang lahat ng anunsyo sa Mga Anunsiyo sa Home.",
                aEn: "Allow notifications for TriboConnect on your phone. All announcements are also in Announcements on Home.",
            },
            {
                q: "Sino ang tatawagan kapag may emergency?",
                qEn: "Who do I call in an emergency?",
                a: "Pindutin ang Emergency sa Home para sa mga numero ng pinakamalapit na tulong at mga ahensya.",
                aEn: "Tap Emergency on Home for the numbers of the nearest help and agency hotlines.",
            },
        ],
    },
];

function FaqItem({
    item,
    color,
    last,
}: {
    item: Faq;
    color: string;
    last: boolean;
}) {
    const { t } = useLanguage();
    const [open, setOpen] = useState(false);

    return (
        <>
            <Pressable
                onPress={() => setOpen((prev) => !prev)}
                accessibilityRole="button"
                accessibilityState={{ expanded: open }}
                style={({ pressed }) => ({
                    backgroundColor: pressed ? "#F7F3EC" : "transparent",
                })}
            >
                <View className="flex-row items-center gap-3 px-4 py-3.5">
                    <Text
                        className="flex-1 text-[14px] font-semibold leading-5"
                        style={{ color: open ? color : PALETTE.ink }}
                    >
                        {t(item.q, item.qEn)}
                    </Text>
                    <Ionicons
                        name={open ? "chevron-up" : "chevron-down"}
                        size={16}
                        color={open ? color : "#C4BFB2"}
                    />
                </View>
                {open && (
                    <Text
                        className="text-[13.5px] leading-[21px] px-4 pb-4 -mt-1"
                        style={{ color: PALETTE.muted }}
                    >
                        {t(item.a, item.aEn)}
                    </Text>
                )}
            </Pressable>
            {!last && <View className="h-px bg-[#F1ECE3] mx-4" />}
        </>
    );
}

export default function HelpFaq() {
    const { t } = useLanguage();

    return (
        <SafeAreaView
            className="flex-1"
            style={{ backgroundColor: PALETTE.cream }}
            edges={["top"]}
        >
            <BackgroundBlobs colors={[PALETTE.leaf, PALETTE.gold]} />

            <ScrollView
                contentContainerClassName="px-5 pt-4 pb-10"
                showsVerticalScrollIndicator={false}
            >
                <AuthHeader title={t("Tulong at FAQ", "Help and FAQ")} />

                <InfoHero
                    icon="help-buoy"
                    colors={["#7FA8D9", "#2A5C99"]}
                    title={t(
                        "Paano ka namin matutulungan?",
                        "How can we help?",
                    )}
                    subtitle={t(
                        "Mga sagot sa mga madalas itanong tungkol sa TriboConnect.",
                        "Answers to common questions about TriboConnect.",
                    )}
                />

                {TOPICS.map((topic) => (
                    <View key={topic.labelEn} className="mb-5">
                        <View className="flex-row items-center gap-2 mb-2.5 ml-1">
                            <Ionicons
                                name={topic.icon}
                                size={15}
                                color={topic.color}
                            />
                            <Text
                                className="text-[14px] font-extrabold"
                                style={{ color: PALETTE.ink }}
                            >
                                {t(topic.label, topic.labelEn)}
                            </Text>
                        </View>
                        <View
                            className="bg-white rounded-[24px] overflow-hidden"
                            style={clayRaised}
                        >
                            {topic.items.map((item, i) => (
                                <FaqItem
                                    key={item.qEn}
                                    item={item}
                                    color={topic.color}
                                    last={i === topic.items.length - 1}
                                />
                            ))}
                        </View>
                    </View>
                ))}

                {/* Still need help */}
                <Pressable
                    onPress={() => Linking.openURL(`mailto:${CONTACT_EMAIL}`)}
                    accessibilityRole="link"
                >
                    {({ pressed }) => (
                        <View
                            className="flex-row items-center gap-3 p-4 rounded-[22px] border"
                            style={[
                                pressScale(pressed),
                                clayRaised,
                                {
                                    backgroundColor: "#F3F9F1",
                                    borderColor: "rgba(62,123,79,0.2)",
                                },
                            ]}
                        >
                            <Ionicons
                                name="mail"
                                size={20}
                                color={PALETTE.forest}
                            />
                            <View className="flex-1">
                                <Text
                                    className="text-[13px] font-bold"
                                    style={{ color: PALETTE.ink }}
                                >
                                    {t(
                                        "May tanong pa? Mag-email sa amin",
                                        "Still have questions? Email us",
                                    )}
                                </Text>
                                <Text
                                    className="text-[12.5px] mt-0.5"
                                    style={{ color: PALETTE.forest }}
                                >
                                    {CONTACT_EMAIL}
                                </Text>
                            </View>
                            <Ionicons
                                name="open-outline"
                                size={16}
                                color="#B5AFA0"
                            />
                        </View>
                    )}
                </Pressable>
            </ScrollView>
        </SafeAreaView>
    );
}
