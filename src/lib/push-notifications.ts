import { db } from "@/lib/firebase";
import { isRunningInExpoGo } from "expo";
import Constants from "expo-constants";
import { router } from "expo-router";
import { arrayUnion, doc, updateDoc } from "firebase/firestore";
import { useEffect } from "react";
import { Platform } from "react-native";

type NotificationsModule = typeof import("expo-notifications");

// expo-notifications throws as soon as it's imported in Android Expo Go (SDK 53+),
// so it's only loaded outside of it. Use a development build to test push.
const Notifications: NotificationsModule | null =
    isRunningInExpoGo() && Platform.OS === "android"
        ? null
        : require("expo-notifications");

// "ask" = we can show the prompt, "blocked" = user denied and Android won't ask again
export type NotificationPermission =
    | "granted"
    | "ask"
    | "blocked"
    | "unavailable";

// without this, notifications that arrive while the app is open are not shown
export function setupNotificationHandler() {
    Notifications?.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowBanner: true,
            shouldShowList: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
        }),
    });
}

// opens the announcement when the user taps its notification,
// also when the tap is what opened the app
export function useAnnouncementNotificationTap() {
    useEffect(() => {
        if (!Notifications) return;
        const notifications = Notifications;

        const openAnnouncement = (
            response: import("expo-notifications").NotificationResponse,
        ) => {
            const announcementId =
                response.notification.request.content.data?.announcementId;
            if (typeof announcementId !== "string") return;

            // so it doesn't open again the next time this runs
            notifications.clearLastNotificationResponse();
            router.push({
                pathname: "/(tabs)/community/[emergencyId]",
                params: { emergencyId: announcementId },
            });
        };

        const lastResponse = notifications.getLastNotificationResponse();
        if (lastResponse) openAnnouncement(lastResponse);

        const subscription =
            notifications.addNotificationResponseReceivedListener(
                openAnnouncement,
            );
        return () => subscription.remove();
    }, []);
}

// Android 13+ won't show the permission prompt until a channel exists
export async function setupNotificationChannel() {
    if (!Notifications || Platform.OS !== "android") return;
    await Notifications.setNotificationChannelAsync("default", {
        name: "Mga Anunsiyo",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#C97748",
    });
}

export async function getNotificationPermission(): Promise<NotificationPermission> {
    if (!Notifications) return "unavailable";
    const { status, canAskAgain } = await Notifications.getPermissionsAsync();
    if (status === "granted") return "granted";
    return canAskAgain ? "ask" : "blocked";
}

export async function requestNotificationPermission(): Promise<boolean> {
    if (!Notifications) return false;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === "granted";
}

// gets this device's Expo push token and adds it to the user's doc,
// arrayUnion keeps it from being saved twice and allows multiple devices
export async function savePushToken(uid: string): Promise<string | null> {
    // Expo Go can't get push tokens anymore (SDK 53+)
    if (!Notifications || isRunningInExpoGo()) return null;

    const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ??
        Constants.easConfig?.projectId;
    if (!projectId) {
        throw new Error("EAS projectId not found in app config");
    }

    const { data: token } = await Notifications.getExpoPushTokenAsync({
        projectId,
    });

    await updateDoc(doc(db, "users", uid), {
        pushTokens: arrayUnion(token),
    });
    console.log("Push token saved:", token);

    return token;
}
