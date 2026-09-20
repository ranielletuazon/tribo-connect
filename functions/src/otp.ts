import * as crypto from "crypto";
import * as admin from "firebase-admin";
import {defineSecret} from "firebase-functions/params";
import {HttpsError, onCall} from "firebase-functions/v2/https";

const RESEND_API_KEY = defineSecret("RESEND_API_KEY");

const OTP_TTL_MS = 5 * 60 * 1000;
const RESEND_COOLDOWN_MS = 45 * 1000;
const MAX_ATTEMPTS = 5;

/**
 * Hashes a plaintext OTP code with SHA-256.
 * @param {string} code The plaintext 6-digit code.
 * @return {string} The hex-encoded SHA-256 hash.
 */
function hashCode(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

/**
 * Generates a random 6-digit OTP code.
 * @return {string} A 6-digit numeric code as a string.
 */
function generateCode(): string {
  return String(crypto.randomInt(100000, 1000000));
}

export const requestOtp = onCall(
  {secrets: [RESEND_API_KEY]},
  async (request) => {
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "Kailangan mong mag-login bago humiling ng OTP.",
      );
    }

    const uid = request.auth.uid;
    const email = request.auth.token.email;
    if (!email) {
      throw new HttpsError(
        "failed-precondition",
        "Walang email na nakalagay sa account na ito.",
      );
    }

    const db = admin.firestore();
    const otpRef = db.collection("otps").doc(uid);
    const existing = await otpRef.get();

    if (existing.exists) {
      const lastSentAt = existing.data()?.lastSentAt as
                admin.firestore.Timestamp | undefined;
      if (lastSentAt) {
        const elapsedMs = Date.now() - lastSentAt.toMillis();
        if (elapsedMs < RESEND_COOLDOWN_MS) {
          throw new HttpsError(
            "resource-exhausted",
            "Maghintay muna bago humiling ng bagong code.",
          );
        }
      }
    }

    const code = generateCode();
    const now = admin.firestore.Timestamp.now();
    const expiresAt = admin.firestore.Timestamp.fromMillis(
      now.toMillis() + OTP_TTL_MS,
    );

    await otpRef.set({
      codeHash: hashCode(code),
      expiresAt,
      attempts: 0,
      lastSentAt: now,
    });

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY.value()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "TriboConnect <noreply@veritasorganisation.com>",
          to: email,
          subject: "Ang iyong TriboConnect verification code",
          text:
            `Ang iyong TriboConnect verification code ay: ${code}. ` +
            "Mag-expire ito sa loob ng 5 minuto.\n\n" +
            `Your TriboConnect verification code is: ${code}. ` +
            "This will expire in 5 minutes.",
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(
          "Resend API error response:",
          response.status,
          errorBody,
        );
        throw new Error(
          `Resend responded with status ${response.status}`,
        );
      }
    } catch (error) {
      console.error("Failed to send OTP email via Resend:", error);
      throw new HttpsError(
        "internal",
        "Nabigo ang pagpapadala ng verification code. Pakisubukang muli.",
      );
    }

    return {success: true};
  },
);

export const verifyOtp = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "Kailangan mong mag-login bago mag-verify.",
    );
  }

  const uid = request.auth.uid;
  const submittedCode = request.data as string;

  const db = admin.firestore();
  const otpRef = db.collection("otps").doc(uid);
  const snapshot = await otpRef.get();

  if (!snapshot.exists) {
    throw new HttpsError("failed-precondition", "No pending verification");
  }

  const data = snapshot.data()!;
  const attempts = data.attempts as number;

  if (attempts >= MAX_ATTEMPTS) {
    throw new HttpsError(
      "resource-exhausted",
      "Sobra na ang maling pagsubok. Humiling ng bagong code.",
    );
  }

  const expiresAt = data.expiresAt as admin.firestore.Timestamp;
  if (expiresAt.toMillis() < Date.now()) {
    throw new HttpsError(
      "deadline-exceeded",
      "Nag-expire na ang code. Humiling ng bagong code.",
    );
  }

  const submittedHash = hashCode(submittedCode);
  if (submittedHash !== data.codeHash) {
    await otpRef.update({
      attempts: admin.firestore.FieldValue.increment(1),
    });
    throw new HttpsError("invalid-argument", "Incorrect code");
  }

  await otpRef.delete();
  await db.collection("users").doc(uid).update({onboardingComplete: true});

  return {success: true};
});
