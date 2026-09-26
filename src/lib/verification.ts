import { Ionicons } from "@expo/vector-icons";
import type { DocumentSnapshot, Timestamp } from "firebase/firestore";

// keep this list the same as ID_TYPES in functions/src/verification.ts
export type VerificationType =
    | "barangay-id"
    | "drivers-license"
    | "national-id"
    | "national-id-egov"
    | "iba-pa";

export type VerificationStatus = "pending" | "approved" | "rejected";

// the IDs a user can verify their account with
export const VERIFICATION_TYPES: Record<
    VerificationType,
    {
        label: string;
        description: string;
        icon: keyof typeof Ionicons.glyphMap;
        color: string;
        // the eGov ID only exists on the phone, so it's a screenshot, not a photo
        allowGallery: boolean;
    }
> = {
    "national-id": {
        label: "National ID",
        description: "PhilSys card, harap na bahagi",
        icon: "card",
        color: "#6B4F94",
        allowGallery: false,
    },
    "national-id-egov": {
        label: "National ID (eGov)",
        description: "Screenshot mula sa eGovPH app",
        icon: "phone-portrait",
        color: "#2A7F8F",
        allowGallery: true,
    },
    "drivers-license": {
        label: "Driver's License",
        description: "LTO license, harap na bahagi",
        icon: "car",
        color: "#2A4F9E",
        allowGallery: false,
    },
    "barangay-id": {
        label: "Barangay ID",
        description: "Mula sa iyong barangay hall",
        icon: "home",
        color: "#3F5C42",
        allowGallery: false,
    },
    "iba-pa": {
        label: "Iba Pa",
        description: "Ibang valid na government ID",
        icon: "document-text",
        color: "#7A6D5C",
        allowGallery: false,
    },
};

export const VERIFICATION_TYPE_ORDER: VerificationType[] = [
    "national-id",
    "national-id-egov",
    "drivers-license",
    "barangay-id",
    "iba-pa",
];

// what the scanIdImage function read from the ID
export interface ExtractedFields {
    lastName: string;
    firstName: string;
    middleName: string;
    birthDate: string; // YYYY-MM-DD, or "" if not found
    sex: string; // "M", "F", or ""
    address: string;
    idNumber: string;
}

export type ScanResult =
    | {
          ok: true;
          fields: ExtractedFields;
          confidence: number;
          typeMatch: boolean;
      }
    | {
          ok: false;
          reason: "blurry" | "too_dark" | "too_small" | "unreadable";
          message: string;
      };

// HttpsErrors from our functions carry a readable sentence, but network
// errors and crashes only have a code like "internal", so use the fallback
export function callableErrorMessage(err: unknown, fallback: string): string {
    const message = err instanceof Error ? err.message : "";
    return /\s/.test(message) ? message : fallback;
}

export interface PersonalInfo extends ExtractedFields {
    barangay: string;
}

// a doc in the verification collection, written by submitVerification
export interface VerificationRequest {
    uid: string;
    email: string | null;
    username: string;
    photoURL: string | null;
    idType: VerificationType;
    imagePath: string;
    // older requests were made before the selfie step
    selfiePath: string | null;
    personalInfo: PersonalInfo;
    ocr: {
        fields: ExtractedFields;
        rawText: string;
        confidence: number;
        blurScore: number;
        typeMatch: boolean;
    };
    status: VerificationStatus;
    attempts: number;
    submittedAt: Timestamp | null;
    reviewedAt: Timestamp | null;
    reviewedByName: string | null;
    rejectionReason: string | null;
}

export function mapDocToVerification(
    docSnap: DocumentSnapshot,
): VerificationRequest {
    const data = docSnap.data() ?? {};
    const emptyFields: ExtractedFields = {
        lastName: "",
        firstName: "",
        middleName: "",
        birthDate: "",
        sex: "",
        address: "",
        idNumber: "",
    };
    return {
        uid: docSnap.id,
        email: data.email ?? null,
        username: data.username ?? "Gumagamit",
        photoURL: data.photoURL ?? null,
        idType: data.idType in VERIFICATION_TYPES ? data.idType : "iba-pa",
        imagePath: data.imagePath ?? "",
        selfiePath: data.selfiePath ?? null,
        personalInfo: { ...emptyFields, barangay: "", ...data.personalInfo },
        ocr: {
            fields: { ...emptyFields, ...data.ocr?.fields },
            rawText: data.ocr?.rawText ?? "",
            confidence: data.ocr?.confidence ?? 0,
            blurScore: data.ocr?.blurScore ?? 0,
            typeMatch: data.ocr?.typeMatch ?? true,
        },
        status: data.status ?? "pending",
        attempts: data.attempts ?? 1,
        submittedAt: data.submittedAt ?? null,
        reviewedAt: data.reviewedAt ?? null,
        reviewedByName: data.reviewedByName ?? null,
        rejectionReason: data.rejectionReason ?? null,
    };
}
