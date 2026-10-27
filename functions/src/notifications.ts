import * as admin from "firebase-admin";
import {logger} from "firebase-functions";
import {onDocumentCreated} from "firebase-functions/v2/firestore";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
// the Expo push API takes at most 100 messages per request
const CHUNK_SIZE = 100;
const BODY_MAX = 150;

const SEVERITY_LABELS: Record<string, string> = {
  abiso: "ABISO",
  babala: "BABALA",
  kritikal: "KRITIKAL",
};

interface ExpoPushTicket {
  status: "ok" | "error";
  id?: string;
  message?: string;
  details?: {error?: string};
}

// sends a push notification to every user when an admin posts an announcement
export const notifyNewAnnouncement = onDocumentCreated(
  {
    document: "announcements/{announcementId}",
    // has to match the Firestore database location
    region: "asia-southeast1",
  },
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const db = admin.firestore();
    const announcementId = event.params.announcementId;

    // triggers can run more than once for the same doc, only send once
    const alreadySent = await db.runTransaction(async (tx) => {
      const fresh = await tx.get(snap.ref);
      if (!fresh.exists || fresh.get("pushSentAt")) return true;
      tx.update(snap.ref, {
        pushSentAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return false;
    });
    if (alreadySent) return;

    const announcement = snap.data();
    const severity = SEVERITY_LABELS[announcement.severity] ?? "ABISO";
    const title = `${severity}: ${announcement.title ?? "Bagong Anunsyo"}`;
    const content = String(announcement.content ?? "");
    const body = content.length > BODY_MAX ?
      `${content.slice(0, BODY_MAX - 3).trimEnd()}...` :
      content;

    // every barangay for now, targetBarangay filtering comes later.
    // the map also removes duplicate tokens (same phone, two accounts)
    const tokenOwners = new Map<string, string>();
    const usersSnap = await db.collection("users").select("pushTokens").get();
    usersSnap.forEach((userDoc) => {
      const tokens = userDoc.get("pushTokens");
      if (!Array.isArray(tokens)) return;
      for (const token of tokens) {
        if (
          typeof token === "string" &&
          token.startsWith("ExponentPushToken")
        ) {
          tokenOwners.set(token, userDoc.id);
        }
      }
    });

    const tokens = [...tokenOwners.keys()];
    if (tokens.length === 0) {
      logger.info("No push tokens, skipping announcement push", {
        announcementId,
      });
      return;
    }

    const invalidTokens: string[] = [];
    let sentCount = 0;

    for (let i = 0; i < tokens.length; i += CHUNK_SIZE) {
      const chunk = tokens.slice(i, i + CHUNK_SIZE);
      const messages = chunk.map((to) => ({
        to,
        title,
        body,
        sound: "default",
        priority: "high",
        // created on the device in src/lib/push-notifications.ts
        channelId: "default",
        data: {announcementId},
      }));

      try {
        const res = await fetch(EXPO_PUSH_URL, {
          method: "POST",
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(messages),
        });

        if (!res.ok) {
          logger.error("Expo push request failed", {
            status: res.status,
            body: await res.text(),
          });
          continue;
        }

        const {data: tickets} = (await res.json()) as {
          data: ExpoPushTicket[];
        };
        tickets.forEach((ticket, index) => {
          if (ticket.status === "ok") {
            sentCount++;
            return;
          }
          logger.warn("Expo push ticket error", {
            token: chunk[index],
            message: ticket.message,
            error: ticket.details?.error,
          });
          // the app was uninstalled or the token is no longer valid
          if (ticket.details?.error === "DeviceNotRegistered") {
            invalidTokens.push(chunk[index]);
          }
        });
      } catch (err) {
        logger.error("Expo push request error", err);
      }
    }

    await Promise.all(
      invalidTokens.map((token) =>
        db.collection("users").doc(tokenOwners.get(token) as string).update({
          pushTokens: admin.firestore.FieldValue.arrayRemove(token),
        })
      )
    );

    logger.info("Announcement push sent", {
      announcementId,
      sent: sentCount,
      total: tokens.length,
      removedTokens: invalidTokens.length,
    });
  }
);
