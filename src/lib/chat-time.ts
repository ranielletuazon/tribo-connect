import type { Timestamp } from "firebase/firestore";

const WEEKDAYS = ["Lin", "Lun", "Mar", "Miy", "Huw", "Biy", "Sab"];
const MONTHS = [
    "Ene",
    "Peb",
    "Mar",
    "Abr",
    "May",
    "Hun",
    "Hul",
    "Ago",
    "Set",
    "Okt",
    "Nob",
    "Dis",
];

function startOfDay(date: Date): number {
    return new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
    ).getTime();
}

function daysAgo(date: Date): number {
    return Math.round(
        (startOfDay(new Date()) - startOfDay(date)) / (24 * 60 * 60 * 1000),
    );
}

export function formatClock(timestamp: Timestamp | null): string {
    if (!timestamp) return "";
    return timestamp
        .toDate()
        .toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" });
}

// time on the conversation list: clock for today, then Kahapon,
// weekday for this week, and a short date for anything older
export function formatListTime(timestamp: Timestamp | null): string {
    if (!timestamp) return "";
    const date = timestamp.toDate();
    const days = daysAgo(date);
    if (days <= 0) return formatClock(timestamp);
    if (days === 1) return "Kahapon";
    if (days < 7) return WEEKDAYS[date.getDay()];
    const sameYear = date.getFullYear() === new Date().getFullYear();
    return `${MONTHS[date.getMonth()]} ${date.getDate()}${sameYear ? "" : `, ${date.getFullYear()}`}`;
}

// label for the date divider between messages
export function formatDayLabel(timestamp: Timestamp): string {
    const date = timestamp.toDate();
    const days = daysAgo(date);
    if (days <= 0) return "Ngayon";
    if (days === 1) return "Kahapon";
    const sameYear = date.getFullYear() === new Date().getFullYear();
    return `${MONTHS[date.getMonth()]} ${date.getDate()}${sameYear ? "" : `, ${date.getFullYear()}`}`;
}

export function isSameDay(a: Timestamp, b: Timestamp): boolean {
    return startOfDay(a.toDate()) === startOfDay(b.toDate());
}
