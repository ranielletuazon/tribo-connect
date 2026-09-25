import { Ionicons } from "@expo/vector-icons";

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
