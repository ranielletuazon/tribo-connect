import { Ionicons } from "@expo/vector-icons";
import type { DocumentSnapshot, Timestamp } from "firebase/firestore";

export type AnnouncementSeverity = "abiso" | "babala" | "kritikal";

export type AnnouncementCategory =
    | "bagyo"
    | "baha"
    | "sunog"
    | "lindol"
    | "kalusugan"
    | "iba-pa";

export interface Announcement {
    id: string;
    authorId: string;
    authorName: string;
    authorPhotoURL: string | null;
    title: string;
    content: string;
    category: AnnouncementCategory;
    severity: AnnouncementSeverity;
    // null means the announcement is for every barangay
    targetBarangay: string | null;
    imageUrl: string | null;
    createdAt: Timestamp | null;
}

export const SEVERITIES: Record<
    AnnouncementSeverity,
    {
        label: string;
        labelEn: string;
        description: string;
        descriptionEn: string;
        icon: keyof typeof Ionicons.glyphMap;
        colorLight: string;
        colorDark: string;
        tint: string;
    }
> = {
    abiso: {
        label: "Abiso",
        labelEn: "Notice",
        description: "Paalala o impormasyon",
        descriptionEn: "Reminder or information",
        icon: "information-circle",
        colorLight: "#5B8DEF",
        colorDark: "#2A4F9E",
        tint: "#EAF1FD",
    },
    babala: {
        label: "Babala",
        labelEn: "Warning",
        description: "Maging handa at alerto",
        descriptionEn: "Be ready and alert",
        icon: "warning",
        colorLight: "#F2A64E",
        colorDark: "#B8601C",
        tint: "#FDF1E3",
    },
    kritikal: {
        label: "Kritikal",
        labelEn: "Critical",
        description: "Kumilos agad",
        descriptionEn: "Act now",
        icon: "alert-circle",
        colorLight: "#F0624D",
        colorDark: "#A4271D",
        tint: "#FDEBE8",
    },
};

export const SEVERITY_ORDER: AnnouncementSeverity[] = [
    "abiso",
    "babala",
    "kritikal",
];

export const CATEGORIES: Record<
    AnnouncementCategory,
    { label: string; labelEn: string; icon: keyof typeof Ionicons.glyphMap }
> = {
    bagyo: { label: "Bagyo", labelEn: "Typhoon", icon: "thunderstorm" },
    baha: { label: "Baha", labelEn: "Flood", icon: "water" },
    sunog: { label: "Sunog", labelEn: "Fire", icon: "flame" },
    lindol: { label: "Lindol", labelEn: "Earthquake", icon: "pulse" },
    kalusugan: { label: "Kalusugan", labelEn: "Health", icon: "medkit" },
    "iba-pa": { label: "Iba Pa", labelEn: "Others", icon: "megaphone" },
};

export const CATEGORY_ORDER: AnnouncementCategory[] = [
    "bagyo",
    "baha",
    "sunog",
    "lindol",
    "kalusugan",
    "iba-pa",
];

export function formatAnnouncementDate(timestamp: Timestamp | null): string {
    const date = timestamp ? timestamp.toDate() : new Date();
    return date.toLocaleString("en-PH", {
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}

export function mapDocToAnnouncement(docSnap: DocumentSnapshot): Announcement {
    const data = docSnap.data() ?? {};
    return {
        id: docSnap.id,
        authorId: data.authorId,
        authorName: data.authorName ?? "Admin",
        authorPhotoURL: data.authorPhotoURL ?? null,
        title: data.title ?? "",
        content: data.content ?? "",
        category: data.category in CATEGORIES ? data.category : "iba-pa",
        severity: data.severity in SEVERITIES ? data.severity : "abiso",
        targetBarangay: data.targetBarangay ?? null,
        imageUrl: data.imageUrl ?? null,
        createdAt: data.createdAt ?? null,
    };
}
