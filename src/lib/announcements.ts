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
        description: string;
        icon: keyof typeof Ionicons.glyphMap;
        colorLight: string;
        colorDark: string;
        tint: string;
    }
> = {
    abiso: {
        label: "Abiso",
        description: "Paalala o impormasyon",
        icon: "information-circle",
        colorLight: "#6B93E8",
        colorDark: "#2A4F9E",
        tint: "#EEF3FC",
    },
    babala: {
        label: "Babala",
        description: "Maging handa at alerto",
        icon: "warning",
        colorLight: "#E0A177",
        colorDark: "#A85A30",
        tint: "#FBF1E8",
    },
    kritikal: {
        label: "Kritikal",
        description: "Kumilos agad",
        icon: "alert-circle",
        colorLight: "#E0715F",
        colorDark: "#9C3A2A",
        tint: "#FBECE9",
    },
};

export const SEVERITY_ORDER: AnnouncementSeverity[] = [
    "abiso",
    "babala",
    "kritikal",
];

export const CATEGORIES: Record<
    AnnouncementCategory,
    { label: string; icon: keyof typeof Ionicons.glyphMap }
> = {
    bagyo: { label: "Bagyo", icon: "thunderstorm" },
    baha: { label: "Baha", icon: "water" },
    sunog: { label: "Sunog", icon: "flame" },
    lindol: { label: "Lindol", icon: "pulse" },
    kalusugan: { label: "Kalusugan", icon: "medkit" },
    "iba-pa": { label: "Iba Pa", icon: "megaphone" },
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
