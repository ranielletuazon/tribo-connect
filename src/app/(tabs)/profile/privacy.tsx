import { AuthHeader } from "@/components/auth-header";
import { BackgroundBlobs, clayRaised, pressScale } from "@/components/clay";
import {
    InfoBullet,
    InfoHero,
    InfoSection,
    InfoStrong,
    InfoText,
} from "@/components/info-page";
import { CONTACT_EMAIL } from "@/constants/contact";
import { PALETTE } from "@/constants/palette";
import { useLanguage } from "@/hooks/use-language";
import { Ionicons } from "@expo/vector-icons";
import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// change this date whenever the policy below changes
const LAST_UPDATED = { tl: "Nobyembre 2, 2026", en: "November 2, 2026" };

export default function PrivacyPolicy() {
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
                <AuthHeader
                    title={t("Patakaran sa Privacy", "Privacy Policy")}
                />

                <InfoHero
                    icon="lock-closed"
                    colors={["#7FA8D9", "#2A5C99"]}
                    title={t("Ang Iyong Privacy", "Your Privacy")}
                    subtitle={t(
                        `Huling na-update: ${LAST_UPDATED.tl}. Narito kung anong impormasyon ang kinokolekta ng TriboConnect at kung paano ito ginagamit.`,
                        `Last updated: ${LAST_UPDATED.en}. Here's what information TriboConnect collects and how it's used.`,
                    )}
                />

                <InfoSection
                    icon="document-text"
                    title={t("Ang Kinokolekta Namin", "What We Collect")}
                    color={PALETTE.forest}
                >
                    <InfoBullet>
                        <InfoStrong>{t("Account: ", "Account: ")}</InfoStrong>
                        {t(
                            "email, username, profile photo, barangay at napiling wika. Kung Google ang ginamit sa pag-login, ang email ng iyong Google account. Ang password ay hawak ng Firebase at hindi namin nakikita.",
                            "email, username, profile photo, barangay and chosen language. If you log in with Google, your Google account's email. Your password is handled by Firebase and we can't see it.",
                        )}
                    </InfoBullet>
                    <InfoBullet>
                        <InfoStrong>
                            {t("Beripikasyon: ", "Verification: ")}
                        </InfoStrong>
                        {t(
                            "larawan ng iyong ID, selfie, at mga detalyeng nabasa mula sa ID (pangalan, kaarawan, kasarian, address at ID number).",
                            "a photo of your ID, a selfie, and the details read from the ID (name, birthday, sex, address and ID number).",
                        )}
                    </InfoBullet>
                    <InfoBullet>
                        <InfoStrong>
                            {t(
                                "Mga ginagawa mo sa app: ",
                                "What you do in the app: ",
                            )}
                        </InfoStrong>
                        {t(
                            "mga post, larawan, komento, like, mensahe sa chat at mga ulat na ipinapadala mo.",
                            "the posts, photos, comments, likes, chat messages and reports you send.",
                        )}
                    </InfoBullet>
                    <InfoBullet>
                        <InfoStrong>{t("Device: ", "Device: ")}</InfoStrong>
                        {t(
                            "isang notification token para makapagpadala kami ng mga abiso, at ang iyong login session na naka-save sa iyong telepono.",
                            "a notification token so we can send you alerts, and your login session saved on your phone.",
                        )}
                    </InfoBullet>
                </InfoSection>

                <InfoSection
                    icon="construct"
                    title={t("Paano Namin Ito Ginagamit", "How We Use It")}
                    color="#C9821F"
                >
                    <InfoBullet>
                        {t(
                            "Para gumana ang Feed, Chat, Report at iba pang bahagi ng app.",
                            "To run the Feed, Chat, Report and the rest of the app.",
                        )}
                    </InfoBullet>
                    <InfoBullet>
                        {t(
                            "Para matiyak na ikaw ay tunay na residente bago ka mabigyan ng verified badge.",
                            "To confirm you're a real resident before you get a verified badge.",
                        )}
                    </InfoBullet>
                    <InfoBullet>
                        {t(
                            "Para makipag-ugnayan sa iyo ang barangay tungkol sa iyong mga ulat.",
                            "So the barangay can contact you about your reports.",
                        )}
                    </InfoBullet>
                    <InfoBullet>
                        {t(
                            "Para magpadala ng mga anunsyo at babala ng barangay.",
                            "To send you the barangay's announcements and alerts.",
                        )}
                    </InfoBullet>
                    <InfoBullet>
                        {t(
                            "Para pigilan ang spam at hindi angkop na salita sa Feed at Chat.",
                            "To stop spam and inappropriate language on the Feed and in Chat.",
                        )}
                    </InfoBullet>
                    <InfoText>
                        {t(
                            "Hindi namin ibinebenta ang iyong impormasyon at hindi ito ginagamit para sa advertising.",
                            "We don't sell your information and it isn't used for advertising.",
                        )}
                    </InfoText>
                </InfoSection>

                <InfoSection
                    icon="eye"
                    title={t("Sino ang Nakakakita", "Who Can See It")}
                    color="#6B4F94"
                >
                    <InfoBullet>
                        <InfoStrong>
                            {t("Lahat ng user: ", "All users: ")}
                        </InfoStrong>
                        {t(
                            "ang iyong username, profile photo, verified badge, mga post at komento.",
                            "your username, profile photo, verified badge, posts and comments.",
                        )}
                    </InfoBullet>
                    <InfoBullet>
                        <InfoStrong>
                            {t(
                                "Kausap mo lang: ",
                                "Only who you're chatting with: ",
                            )}
                        </InfoStrong>
                        {t(
                            "ang iyong mga mensahe sa chat.",
                            "your chat messages.",
                        )}
                    </InfoBullet>
                    <InfoBullet>
                        <InfoStrong>
                            {t("Mga admin ng barangay: ", "Barangay admins: ")}
                        </InfoStrong>
                        {t(
                            "ang iyong ID, selfie at mga detalye sa beripikasyon, at ang mga ulat mo kasama ang iyong email.",
                            "your ID, selfie and verification details, and your reports along with your email.",
                        )}
                    </InfoBullet>
                </InfoSection>

                <InfoSection
                    icon="server"
                    title={t("Mga Serbisyong Ginagamit", "Services We Use")}
                    color="#2A7F8F"
                >
                    <InfoText>
                        {t(
                            "Nakaimbak ang iyong impormasyon sa mga serbisyong ito, na may sarili ring mga patakaran sa privacy:",
                            "Your information is stored with these services, which have their own privacy policies too:",
                        )}
                    </InfoText>
                    <InfoBullet>
                        <InfoStrong>Google Firebase</InfoStrong>
                        {t(
                            " – login, database, mga larawan, at ang pagbasa ng iyong ID.",
                            " – login, database, photos, and reading your ID.",
                        )}
                    </InfoBullet>
                    <InfoBullet>
                        <InfoStrong>Google Sign-In</InfoStrong>
                        {t(
                            " – kung pipiliin mong mag-login gamit ang Google.",
                            " – if you choose to log in with Google.",
                        )}
                    </InfoBullet>
                    <InfoBullet>
                        <InfoStrong>Resend</InfoStrong>
                        {t(
                            " – pagpapadala ng iyong mga ulat sa email ng barangay.",
                            " – sending your reports to the barangay's email.",
                        )}
                    </InfoBullet>
                    <InfoBullet>
                        <InfoStrong>Expo</InfoStrong>
                        {t(
                            " – pagpapadala ng mga notification sa iyong telepono.",
                            " – delivering notifications to your phone.",
                        )}
                    </InfoBullet>
                </InfoSection>

                <InfoSection
                    icon="shield-checkmark"
                    title={t("Seguridad", "Security")}
                    color={PALETTE.terracotta}
                >
                    <InfoText>
                        {t(
                            "Gumagawa kami ng makatwirang hakbang para protektahan ang iyong impormasyon. Pero dahil ang TriboConnect ay isang school capstone project, hindi namin magagarantiya ang ganap na seguridad. Iwasang magbahagi ng sensitibong impormasyon sa mga post at chat.",
                            "We take reasonable steps to protect your information. But since TriboConnect is a school capstone project, we can't guarantee complete security. Avoid sharing sensitive information in posts and chats.",
                        )}
                    </InfoText>
                </InfoSection>

                <InfoSection
                    icon="hand-left"
                    title={t("Ang Iyong mga Karapatan", "Your Rights")}
                    color="#2A5C99"
                >
                    <InfoText>
                        {t(
                            "Ayon sa Data Privacy Act of 2012 (RA 10173), may karapatan kang malaman, makita, itama at ipabura ang iyong personal na impormasyon.",
                            "Under the Data Privacy Act of 2012 (RA 10173), you have the right to know about, access, correct and have your personal information deleted.",
                        )}
                    </InfoText>
                    <InfoBullet>
                        {t(
                            "Mapapalitan mo ang iyong username at larawan sa I-edit ang Profile.",
                            "You can change your username and photo in Edit Profile.",
                        )}
                    </InfoBullet>
                    <InfoBullet>
                        {t(
                            "Mabubura mo ang sarili mong mga post anumang oras.",
                            "You can delete your own posts at any time.",
                        )}
                    </InfoBullet>
                    <InfoBullet>
                        {t(
                            "Para ipabura ang iyong account o iba pang impormasyon, mag-email sa amin.",
                            "To have your account or other information deleted, email us.",
                        )}
                    </InfoBullet>
                </InfoSection>

                <InfoSection
                    icon="refresh"
                    title={t("Mga Pagbabago", "Changes")}
                    color={PALETTE.muted}
                >
                    <InfoText>
                        {t(
                            "Maaari naming baguhin ang patakarang ito. Makikita ang petsa ng huling pagbabago sa itaas ng pahinang ito.",
                            "We may update this policy. The date of the last change is shown at the top of this page.",
                        )}
                    </InfoText>
                </InfoSection>

                {/* Contact */}
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
                                        "May tanong tungkol sa privacy?",
                                        "Questions about privacy?",
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
