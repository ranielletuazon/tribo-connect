import * as path from "path";
import * as admin from "firebase-admin";
import {HttpsError, onCall} from "firebase-functions/v2/https";
import type {Worker} from "tesseract.js";

type IdType =
  | "barangay-id"
  | "drivers-license"
  | "national-id"
  | "national-id-egov"
  | "iba-pa";

const ID_TYPES: IdType[] = [
  "barangay-id",
  "drivers-license",
  "national-id",
  "national-id-egov",
  "iba-pa",
];

interface ExtractedFields {
  lastName: string;
  firstName: string;
  middleName: string;
  birthDate: string; // YYYY-MM-DD, or "" if not found
  sex: string; // "M", "F", or ""
  address: string;
  idNumber: string;
}

// image quality limits, tune these after testing with real IDs
const BLUR_THRESHOLD = 50; // lower laplacian variance = blurrier
const MIN_BRIGHTNESS = 45; // 0-255 average
const MIN_SHORT_SIDE = 500; // pixels
const MIN_OCR_CONFIDENCE = 40; // 0-100
const MIN_TEXT_LENGTH = 25;
const MAX_IMAGE_BYTES = 15 * 1024 * 1024;

// each scan costs a lot of CPU, so limit how often one user can scan
const MAX_SCANS_PER_WINDOW = 10;
const SCAN_WINDOW_MS = 24 * 60 * 60 * 1000;

// words that should appear on each ID, used to warn about a wrong ID type
const ID_KEYWORDS: Record<IdType, RegExp | null> = {
  "national-id":
    /PHILSYS|PAMBANSANG|PHILIPPINE IDENTIFICATION|PAGKAKAKILANLAN/i,
  "national-id-egov":
    /PHILSYS|PAMBANSANG|PHILIPPINE IDENTIFICATION|PAGKAKAKILANLAN|EPHIL/i,
  "drivers-license": /DRIVER|LICENSE|LAND TRANSPORTATION|\bLTO\b/i,
  "barangay-id": /BARANGAY|BRGY/i,
  "iba-pa": null,
};

// labels printed on Philippine IDs, a line matching one is never a value
const LABEL_PATTERN = new RegExp(
  [
    "last name", "apelyido", "given names?", "first name", "mga pangalan",
    "middle name", "gitnang", "date of birth", "birth ?date",
    "kapanganakan", "address", "tirahan", "sex", "kasarian", "nationality",
    "weight", "height", "blood", "eyes", "license no", "expiration",
    "agency code", "restrictions?", "conditions?", "signature", "lagda",
    "civil status", "place of birth",
  ].map((label) => `\\b(?:${label})\\b`).join("|"),
  "i",
);

const MONTHS: Record<string, number> = {
  JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6,
  JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12,
};

// surname particles that belong with the next word, like "Dela Cruz"
const SURNAME_PARTICLES = new Set([
  "DE", "DEL", "DELA", "DELOS", "DE LA", "DI", "LA", "LAS", "LOS",
  "SAN", "STA", "STA.", "STO", "STO.", "SANTA", "SANTO", "VON", "VAN",
]);

let workerPromise: Promise<Worker> | null = null;

/**
 * Returns the shared Tesseract worker, creating it on the first call.
 * Warm instances reuse it so only a cold start pays the load time.
 * @return {Promise<Worker>} The ready worker.
 */
function getWorker(): Promise<Worker> {
  if (!workerPromise) {
    const langDir = path.dirname(
      require.resolve("@tesseract.js-data/eng/package.json"),
    );
    // loaded here instead of at the top so the other functions
    // and the deploy step don't pay for it
    workerPromise = import("tesseract.js").then(({createWorker, OEM}) =>
      createWorker("eng", OEM.LSTM_ONLY, {
        langPath: path.join(langDir, "4.0.0_best_int"),
        gzip: true,
        // the functions source folder is read-only, so don't write a cache
        cacheMethod: "none",
      }),
    ).catch((err) => {
      workerPromise = null;
      throw err;
    });
  }
  return workerPromise;
}

/**
 * Measures sharpness as the variance of the Laplacian of a greyscale image.
 * @param {Buffer} pixels Raw 1-channel pixel data.
 * @param {number} width Image width.
 * @param {number} height Image height.
 * @return {number} The variance, higher means sharper.
 */
export function laplacianVariance(
  pixels: Buffer,
  width: number,
  height: number,
): number {
  let sum = 0;
  let sumSq = 0;
  let count = 0;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      const value =
        pixels[i - width] + pixels[i + width] +
        pixels[i - 1] + pixels[i + 1] - 4 * pixels[i];
      sum += value;
      sumSq += value * value;
      count++;
    }
  }
  const mean = sum / count;
  return sumSq / count - mean * mean;
}

/**
 * Converts "DELA CRUZ" to "Dela Cruz".
 * @param {string} text The text to convert.
 * @return {string} The title-cased text.
 */
function toTitleCase(text: string): string {
  return text
    .toLowerCase()
    .replace(/(^|[\s,.\-'/(])([a-zñ])/g, (_, p, c) => p + c.toUpperCase());
}

/**
 * Removes OCR noise characters from a value.
 * @param {string} text The raw value.
 * @return {string} The cleaned value.
 */
function cleanValue(text: string): string {
  return text
    .replace(/[|_~*<>{}[\]"`]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/^[\s:;,.-]+|[\s:;,-]+$/g, "")
    .trim();
}

/**
 * Finds the value for a label. The value is either after the label on the
 * same line ("Sex: M") or on the next lines, which is how most IDs print it.
 * @param {string[]} lines The OCR lines.
 * @param {RegExp} label The label to look for.
 * @param {number} maxLines How many lines the value can span.
 * @return {string} The value, or "" if not found.
 */
function valueAfterLabel(
  lines: string[],
  label: RegExp,
  maxLines = 1,
): string {
  const index = lines.findIndex((line) => label.test(line));
  if (index === -1) return "";

  const afterLabel = lines[index].replace(label, "").split("/").pop();
  const sameLine = cleanValue(afterLabel ?? "");
  if (sameLine.length >= 2 && !LABEL_PATTERN.test(sameLine)) {
    return sameLine;
  }

  const values: string[] = [];
  for (let i = index + 1; i < lines.length && values.length < maxLines; i++) {
    if (LABEL_PATTERN.test(lines[i])) break;
    const value = cleanValue(lines[i]);
    if (value.length >= 2) values.push(value);
  }
  return values.join(", ");
}

/**
 * Parses the date formats used on Philippine IDs into YYYY-MM-DD.
 * @param {string} text Text that may contain a date.
 * @return {string} The date, or "" if none was found.
 */
function parseDate(text: string): string {
  const upper = text.toUpperCase();
  let year = 0;
  let month = 0;
  let day = 0;

  // like "JANUARY 01, 1990" or "JAN. 1 1990"
  const named = upper.match(new RegExp(
    "\\b(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[A-Z]*\\.?" +
      "\\s*(\\d{1,2}),?\\s*(\\d{4})\\b",
  ));
  const yearFirst = upper.match(/\b(\d{4})[/.-](\d{1,2})[/.-](\d{1,2})\b/);
  const yearLast = upper.match(/\b(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})\b/);

  if (named) {
    month = MONTHS[named[1]];
    day = Number(named[2]);
    year = Number(named[3]);
  } else if (yearFirst) {
    year = Number(yearFirst[1]);
    month = Number(yearFirst[2]);
    day = Number(yearFirst[3]);
  } else if (yearLast) {
    // Philippine IDs use MM/DD/YYYY
    month = Number(yearLast[1]);
    day = Number(yearLast[2]);
    year = Number(yearLast[3]);
  } else {
    return "";
  }

  const thisYear = new Date().getFullYear();
  if (
    year < 1900 || year > thisYear ||
    month < 1 || month > 12 ||
    day < 1 || day > 31
  ) {
    return "";
  }
  return `${year}-${String(month).padStart(2, "0")}-` +
    String(day).padStart(2, "0");
}

/**
 * Finds the birth date, from its label or else the earliest date on the ID,
 * since the other dates (issued, expiry) always come after it.
 * @param {string[]} lines The OCR lines.
 * @return {string} The birth date as YYYY-MM-DD, or "".
 */
function findBirthDate(lines: string[]): string {
  const labeled = parseDate(
    valueAfterLabel(lines, /date of birth|birth ?date|kapanganakan|\bDOB\b/i),
  );
  if (labeled) return labeled;

  const dates = lines.map(parseDate).filter((d) => d.length > 0).sort();
  return dates[0] ?? "";
}

/**
 * Finds the sex printed on the ID.
 * @param {string[]} lines The OCR lines.
 * @param {string} text The full OCR text.
 * @return {string} "M", "F", or "".
 */
function findSex(lines: string[], text: string): string {
  const value = valueAfterLabel(lines, /\bsex\b|kasarian/i).toUpperCase();
  const word = value.match(/\b(MALE|FEMALE|LALAKI|BABAE|M|F)\b/)?.[1] ??
    text.toUpperCase().match(/\b(MALE|FEMALE)\b/)?.[1];
  if (!word) return "";
  return ["F", "FEMALE", "BABAE"].includes(word) ? "F" : "M";
}

/**
 * Splits a full name like "DELA CRUZ, JUAN PEDRO" or "JUAN P. DELA CRUZ".
 * @param {string} fullName The name as printed.
 * @return {object} The last, first and middle name.
 */
function splitFullName(fullName: string): {
  lastName: string;
  firstName: string;
  middleName: string;
} {
  const name = cleanValue(fullName).toUpperCase();
  if (!name) return {lastName: "", firstName: "", middleName: ""};

  // "LAST, FIRST MIDDLE" like on the driver's license
  if (name.includes(",")) {
    const [last, rest = ""] = name.split(",").map((part) => part.trim());
    const words = rest.split(" ").filter(Boolean);
    const middle = words.length >= 2 ? words.pop() ?? "" : "";
    return {
      lastName: toTitleCase(last),
      firstName: toTitleCase(words.join(" ")),
      middleName: toTitleCase(middle),
    };
  }

  // "FIRST MIDDLE LAST", the surname can have particles like "DELA"
  const words = name.split(" ").filter(Boolean);
  if (words.length === 1) {
    return {lastName: "", firstName: toTitleCase(words[0]), middleName: ""};
  }
  let lastStart = words.length - 1;
  while (lastStart > 1 && SURNAME_PARTICLES.has(words[lastStart - 1])) {
    lastStart--;
  }
  const lastName = words.slice(lastStart).join(" ");
  const firstWords = words.slice(0, lastStart);
  // a single letter like "P." is a middle initial
  const middle = firstWords.length >= 2 &&
    /^[A-Z]\.?$/.test(firstWords[firstWords.length - 1]) ?
    firstWords.pop() ?? "" :
    "";
  return {
    lastName: toTitleCase(lastName),
    firstName: toTitleCase(firstWords.join(" ")),
    middleName: toTitleCase(middle),
  };
}

/**
 * Pulls the personal details out of the OCR text for the given ID type.
 * This is best effort, the user checks and fixes every field after.
 * @param {string} text The OCR text.
 * @param {IdType} idType The ID the user said they scanned.
 * @return {ExtractedFields} The fields that were found.
 */
export function extractFields(text: string, idType: IdType): ExtractedFields {
  const lines = text
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line) => line.length >= 2);
  const upper = text.toUpperCase();

  let lastName = "";
  let firstName = "";
  let middleName = "";
  let idNumber = "";

  if (idType === "national-id" || idType === "national-id-egov") {
    lastName = valueAfterLabel(lines, /apelyido\s*\/?\s*last name|last name/i);
    firstName = valueAfterLabel(
      lines,
      /mga pangalan|given names?|first name/i,
    );
    middleName = valueAfterLabel(lines, /gitnang apelyido|middle name/i);
    // PhilSys Card Number, 16 digits in groups of 4
    idNumber = upper.match(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/)?.[0]
      ?.replace(/\s/g, "-") ?? "";
    lastName = toTitleCase(lastName);
    firstName = toTitleCase(firstName);
    middleName = toTitleCase(middleName);
  } else if (idType === "drivers-license") {
    const fullName = valueAfterLabel(
      lines,
      /last name\s*,?\s*first name|last name/i,
    );
    ({lastName, firstName, middleName} = splitFullName(fullName));
    // LTO license number, like A01-23-456789
    idNumber = upper.match(/\b[A-Z]\d{2}[-\s]?\d{2}[-\s]?\d{6}\b/)?.[0]
      ?.replace(/\s/g, "-") ?? "";
  } else {
    // Barangay IDs and others have no standard layout
    const labeledLast = valueAfterLabel(lines, /last name|apelyido/i);
    if (labeledLast) {
      lastName = toTitleCase(labeledLast);
      firstName = toTitleCase(
        valueAfterLabel(lines, /first name|given names?|pangalan/i),
      );
      middleName = toTitleCase(valueAfterLabel(lines, /middle name|gitnang/i));
    } else {
      ({lastName, firstName, middleName} = splitFullName(
        valueAfterLabel(lines, /\bname\b|pangalan/i),
      ));
    }
    idNumber = cleanValue(
      valueAfterLabel(lines, /\bid\s*(no|number|#)|control no|\bno\.?\s*:/i),
    );
  }

  if (!idNumber) {
    // any long code with enough digits that isn't a date
    idNumber = upper
      .match(/\b[A-Z0-9][A-Z0-9-]{5,}\b/g)
      ?.find((token) => (token.match(/\d/g) ?? []).length >= 5 &&
        !parseDate(token)) ?? "";
  }

  return {
    lastName: cleanValue(lastName),
    firstName: cleanValue(firstName),
    middleName: cleanValue(middleName),
    birthDate: findBirthDate(lines),
    sex: findSex(lines, text),
    address: toTitleCase(
      valueAfterLabel(lines, /tirahan|address/i, 2),
    ),
    idNumber: idNumber.slice(0, 40),
  };
}

/**
 * Checks that an image path belongs to this user's verification folder.
 * @param {unknown} imagePath The path sent by the app.
 * @param {string} uid The signed-in user.
 * @return {boolean} Whether the path is allowed.
 */
function isOwnImagePath(imagePath: unknown, uid: string): boolean {
  return typeof imagePath === "string" &&
    new RegExp(`^verification/${uid}/[\\w-]+\\.jpg$`).test(imagePath);
}

type ScanResult =
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

export const scanIdImage = onCall(
  {memory: "2GiB", timeoutSeconds: 120, concurrency: 1},
  async (request): Promise<ScanResult> => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Kailangan mag-login muna.");
    }
    const uid = request.auth.uid;
    const {idType, imagePath} = request.data ?? {};

    if (!ID_TYPES.includes(idType) || !isOwnImagePath(imagePath, uid)) {
      throw new HttpsError("invalid-argument", "Mali ang ipinadalang ID.");
    }

    const db = admin.firestore();
    const scanRef = db.collection("verificationScans").doc(uid);
    const scanSnap = await scanRef.get();
    const now = Date.now();
    const windowStart: number = scanSnap.data()?.windowStart ?? 0;
    const inWindow = now - windowStart < SCAN_WINDOW_MS;
    const count: number = inWindow ? scanSnap.data()?.count ?? 0 : 0;

    if (count >= MAX_SCANS_PER_WINDOW) {
      throw new HttpsError(
        "resource-exhausted",
        "Naabot mo na ang limitasyon ng pag-scan. Subukang muli bukas.",
      );
    }
    await scanRef.set(
      {count: count + 1, windowStart: inWindow ? windowStart : now},
      {merge: true},
    );

    const file = admin.storage().bucket().file(imagePath);
    const [metadata] = await file.getMetadata().catch(() => {
      throw new HttpsError("not-found", "Hindi makita ang larawan ng ID.");
    });
    if (Number(metadata.size) > MAX_IMAGE_BYTES) {
      throw new HttpsError("invalid-argument", "Masyadong malaki ang larawan.");
    }
    const [original] = await file.download();

    // rotate() applies the phone's orientation so the text is upright
    const {default: sharp} = await import("sharp");
    const base = sharp(original).rotate();
    const {width = 0, height = 0} = await base.clone().metadata();
    if (Math.min(width, height) < MIN_SHORT_SIDE) {
      return {
        ok: false,
        reason: "too_small",
        message: "Masyadong maliit ang larawan. Lumapit pa sa ID.",
      };
    }

    // quality checks on a fixed size so the scores are comparable
    const {data: grey, info} = await base
      .clone()
      .resize({width: 1000, withoutEnlargement: false})
      .greyscale()
      .raw()
      .toBuffer({resolveWithObject: true});

    const brightness = grey.reduce((sum, v) => sum + v, 0) / grey.length;
    if (brightness < MIN_BRIGHTNESS) {
      return {
        ok: false,
        reason: "too_dark",
        message: "Masyadong madilim ang larawan. " +
          "Humanap ng maliwanag na lugar.",
      };
    }

    const blurScore = laplacianVariance(grey, info.width, info.height);
    console.log(`scanIdImage ${uid}: blur=${blurScore.toFixed(1)} ` +
      `brightness=${brightness.toFixed(1)}`);
    if (blurScore < BLUR_THRESHOLD) {
      return {
        ok: false,
        reason: "blurry",
        message: "Malabo ang larawan. Hawakan nang matatag ang phone at " +
          "siguraduhing naka-focus ang ID.",
      };
    }

    // cleaner input for Tesseract: bigger, grey, higher contrast
    const ocrInput = await base
      .clone()
      .resize({width: 1800, withoutEnlargement: false})
      .greyscale()
      .normalize()
      .sharpen()
      .png()
      .toBuffer();

    let text = "";
    let confidence = 0;
    try {
      const worker = await getWorker();
      const {data} = await worker.recognize(ocrInput);
      text = data.text ?? "";
      confidence = data.confidence ?? 0;
    } catch (err) {
      console.error("Tesseract error:", err);
      workerPromise = null;
      throw new HttpsError(
        "internal",
        "Nabigo ang pagbasa ng ID. Pakisubukang muli.",
      );
    }

    if (
      confidence < MIN_OCR_CONFIDENCE ||
      text.replace(/\s/g, "").length < MIN_TEXT_LENGTH
    ) {
      return {
        ok: false,
        reason: "unreadable",
        message: "Hindi mabasa ang ID. Iwasan ang silaw ng ilaw at " +
          "siguraduhing buo ang ID sa larawan.",
      };
    }

    const fields = extractFields(text, idType);
    const keywords = ID_KEYWORDS[idType as IdType];
    const typeMatch = keywords ? keywords.test(text) : true;

    // kept on the server so the admin can compare it with what the user typed
    await scanRef.set(
      {
        lastScan: {
          idType,
          imagePath,
          rawText: text.slice(0, 5000),
          fields,
          confidence,
          blurScore,
          typeMatch,
          scannedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
      },
      {merge: true},
    );

    return {ok: true, fields, confidence, typeMatch};
  },
);

/**
 * Reads a trimmed string field and checks its length.
 * @param {Record<string, unknown>} data The request data.
 * @param {string} key The field name.
 * @param {number} max The max length.
 * @param {boolean} required Whether it can be empty.
 * @return {string} The trimmed value.
 */
function readString(
  data: Record<string, unknown>,
  key: string,
  max: number,
  required: boolean,
): string {
  const value = typeof data[key] === "string" ?
    (data[key] as string).trim() :
    "";
  if ((required && value.length === 0) || value.length > max) {
    throw new HttpsError("invalid-argument", `Mali ang field na ${key}.`);
  }
  return value;
}

export const submitVerification = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Kailangan mag-login muna.");
  }
  const uid = request.auth.uid;
  const data = (request.data ?? {}) as Record<string, unknown>;

  const idType = data.idType as IdType;
  const imagePath = data.imagePath;
  if (!ID_TYPES.includes(idType) || !isOwnImagePath(imagePath, uid)) {
    throw new HttpsError("invalid-argument", "Mali ang ipinadalang ID.");
  }
  const selfiePath = data.selfiePath;
  if (
    !isOwnImagePath(selfiePath, uid) ||
    !(selfiePath as string).includes("/selfie-")
  ) {
    throw new HttpsError(
      "invalid-argument",
      "Kumuha muna ng selfie bago magpatuloy.",
    );
  }

  const personalInfo = {
    lastName: readString(data, "lastName", 60, true),
    firstName: readString(data, "firstName", 80, true),
    middleName: readString(data, "middleName", 60, false),
    birthDate: readString(data, "birthDate", 10, true),
    sex: readString(data, "sex", 1, true),
    address: readString(data, "address", 200, true),
    barangay: readString(data, "barangay", 80, true),
    idNumber: readString(data, "idNumber", 40, true),
  };

  const birth = new Date(personalInfo.birthDate);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(personalInfo.birthDate) ||
    isNaN(birth.getTime()) ||
    birth.getTime() > Date.now()
  ) {
    throw new HttpsError(
      "invalid-argument",
      "Mali ang petsa ng kapanganakan.",
    );
  }
  if (!["M", "F"].includes(personalInfo.sex)) {
    throw new HttpsError("invalid-argument", "Mali ang kasarian.");
  }

  const db = admin.firestore();
  const verificationRef = db.collection("verification").doc(uid);
  const [existing, scanSnap, userSnap] = await Promise.all([
    verificationRef.get(),
    db.collection("verificationScans").doc(uid).get(),
    db.collection("users").doc(uid).get(),
  ]);

  const currentStatus = existing.data()?.status;
  if (currentStatus === "pending" || currentStatus === "approved") {
    throw new HttpsError(
      "already-exists",
      currentStatus === "pending" ?
        "May nakabinbin ka nang beripikasyon." :
        "Verified na ang iyong account.",
    );
  }

  // the ID must be the one that was just scanned by scanIdImage
  const lastScan = scanSnap.data()?.lastScan;
  if (!lastScan || lastScan.imagePath !== imagePath) {
    throw new HttpsError(
      "failed-precondition",
      "I-scan muna ang iyong ID bago magpatuloy.",
    );
  }

  // make sure the selfie was really uploaded
  const [selfieExists] = await admin.storage().bucket()
    .file(selfiePath as string).exists();
  if (!selfieExists) {
    throw new HttpsError(
      "failed-precondition",
      "Hindi makita ang iyong selfie. Pakikuha muli.",
    );
  }

  const user = userSnap.data() ?? {};
  const now = admin.firestore.FieldValue.serverTimestamp();
  const batch = db.batch();

  // doc id is the uid, so each user has at most one request
  batch.set(verificationRef, {
    uid,
    email: request.auth.token.email ?? null,
    username: user.username ?? null,
    photoURL: user.photoURL ?? null,
    idType,
    imagePath,
    selfiePath,
    personalInfo,
    // what the OCR read, for the admin to compare with personalInfo
    ocr: {
      fields: lastScan.fields,
      rawText: lastScan.rawText,
      confidence: lastScan.confidence,
      blurScore: lastScan.blurScore,
      typeMatch: lastScan.typeMatch,
    },
    status: "pending",
    submittedAt: now,
    updatedAt: now,
    attempts: (existing.data()?.attempts ?? 0) + 1,
    reviewedBy: null,
    reviewedAt: null,
    rejectionReason: null,
  });
  batch.update(userSnap.ref, {verificationStatus: "pending"});
  await batch.commit();

  return {success: true};
});

export const reviewVerification = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Kailangan mag-login muna.");
  }
  const adminUid = request.auth.uid;
  const {uid, decision, reason} = (request.data ?? {}) as {
    uid?: unknown;
    decision?: unknown;
    reason?: unknown;
  };

  if (typeof uid !== "string" || uid.length === 0) {
    throw new HttpsError("invalid-argument", "Walang napiling user.");
  }
  if (decision !== "approve" && decision !== "reject") {
    throw new HttpsError("invalid-argument", "Mali ang desisyon.");
  }
  const rejectionReason = typeof reason === "string" ? reason.trim() : "";
  if (
    decision === "reject" &&
    (rejectionReason.length < 5 || rejectionReason.length > 300)
  ) {
    throw new HttpsError(
      "invalid-argument",
      "Maglagay ng dahilan ng pagtanggi (5 hanggang 300 letra).",
    );
  }

  const db = admin.firestore();
  const adminSnap = await db.collection("users").doc(adminUid).get();
  if (adminSnap.data()?.role !== "admin") {
    throw new HttpsError(
      "permission-denied",
      "Ang mga admin lamang ang maaaring magsuri ng beripikasyon.",
    );
  }

  const verificationRef = db.collection("verification").doc(uid);
  const userRef = db.collection("users").doc(uid);

  // a transaction so two admins can't review the same request at once
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(verificationRef);
    if (!snap.exists) {
      throw new HttpsError("not-found", "Hindi makita ang beripikasyon.");
    }
    if (snap.data()?.status !== "pending") {
      throw new HttpsError(
        "failed-precondition",
        "Nasuri na ng ibang admin ang beripikasyong ito.",
      );
    }

    const now = admin.firestore.FieldValue.serverTimestamp();
    const approved = decision === "approve";

    tx.update(verificationRef, {
      status: approved ? "approved" : "rejected",
      reviewedBy: adminUid,
      reviewedByName: adminSnap.data()?.username ?? null,
      reviewedAt: now,
      rejectionReason: approved ? null : rejectionReason,
      updatedAt: now,
    });
    tx.update(userRef, {
      verificationStatus: approved ? "approved" : "rejected",
      isVerified: approved,
      verifiedAt: approved ? now : null,
      verifiedIdType: approved ? snap.data()?.idType ?? null : null,
    });
  });

  return {success: true};
});
