import { db } from "@/lib/firebase";
import { Ionicons } from "@expo/vector-icons";
import {
    addDoc,
    collection,
    getDocs,
    query,
    serverTimestamp,
    where,
    type DocumentSnapshot,
    type Timestamp,
} from "firebase/firestore";

export interface ReportCategory {
    key: string;
    label: string;
    labelEn: string;
    icon: keyof typeof Ionicons.glyphMap;
    colors: [string, string];
}

export const REPORT_CATEGORIES: ReportCategory[] = [
    {
        key: "sakuna",
        label: "Sakuna",
        labelEn: "Disaster",
        icon: "water",
        colors: ["#5BA3E8", "#2A5C99"],
    },
    {
        key: "kaligtasan",
        label: "Kaligtasan",
        labelEn: "Safety",
        icon: "shield-checkmark",
        colors: ["#E8894F", "#B4562A"],
    },
    {
        key: "kalusugan",
        label: "Kalusugan",
        labelEn: "Health",
        icon: "medkit",
        colors: ["#F0624D", "#B8321F"],
    },
    {
        key: "paligid",
        label: "Paligid",
        labelEn: "Surroundings",
        icon: "leaf",
        colors: ["#56A06A", "#2F6540"],
    },
    {
        key: "sarili",
        label: "Sarili",
        labelEn: "Personal",
        icon: "eye",
        colors: ["#A98FE0", "#6B4F94"],
    },
    {
        key: "iba-pa",
        label: "Iba Pa",
        labelEn: "Others",
        icon: "ellipsis-horizontal",
        colors: ["#B5AFA0", "#7A6D5C"],
    },
];

export function findReportCategory(key: string): ReportCategory {
    return (
        REPORT_CATEGORIES.find((c) => c.key === key) ??
        REPORT_CATEGORIES[REPORT_CATEGORIES.length - 1]
    );
}

export interface ReportInput {
    categories: string[];
    subject: string;
    description: string;
}

// a doc in the reports collection. the report itself is emailed to the
// barangay by the submitReport function, this copy is for My Reports
export interface Report extends ReportInput {
    id: string;
    reporterId: string;
    createdAt: Timestamp | null;
}

export function mapDocToReport(docSnap: DocumentSnapshot): Report {
    const data = docSnap.data() ?? {};
    return {
        id: docSnap.id,
        reporterId: data.reporterId,
        categories: data.categories ?? [],
        subject: data.subject ?? "",
        description: data.description ?? "",
        createdAt: data.createdAt ?? null,
    };
}

// call after the report email was sent
export async function saveReport(
    uid: string,
    email: string | null,
    report: ReportInput,
): Promise<void> {
    await addDoc(collection(db, "reports"), {
        reporterId: uid,
        reporterEmail: email,
        categories: report.categories,
        subject: report.subject,
        description: report.description,
        createdAt: serverTimestamp(),
    });
}

// newest first. sorted here instead of with orderBy so Firestore doesn't
// need a composite index
export function sortNewestFirst(reports: Report[]): Report[] {
    return [...reports].sort(
        (a, b) =>
            (b.createdAt?.toMillis() ?? Date.now()) -
            (a.createdAt?.toMillis() ?? Date.now()),
    );
}

export function myReportsQuery(uid: string) {
    return query(collection(db, "reports"), where("reporterId", "==", uid));
}

export async function fetchMyReports(uid: string): Promise<Report[]> {
    const snap = await getDocs(myReportsQuery(uid));
    return sortNewestFirst(snap.docs.map(mapDocToReport));
}
