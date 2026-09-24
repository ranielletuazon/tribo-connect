import {defineSecret} from "firebase-functions/params";
import {HttpsError, onCall} from "firebase-functions/v2/https";

const RESEND_API_KEY = defineSecret("RESEND_API_KEY");
const REPORT_RECIPIENT = "triboconnectapp@gmail.com";
const FROM_ADDRESS = "TriboConnect <noreply@veritasorganisation.com>";

interface SubmitReportData {
    categories: string[];
    subject: string;
    description: string;
}

export const submitReport = onCall(
  {secrets: [RESEND_API_KEY]},
  async (request) => {
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "Kailangan mag-login muna.",
      );
    }

    const {categories, subject, description} =
            request.data as SubmitReportData;

    if (
      !Array.isArray(categories) ||
            categories.length === 0 ||
            typeof subject !== "string" ||
            subject.trim().length === 0 ||
            typeof description !== "string" ||
            description.trim().length === 0
    ) {
      throw new HttpsError(
        "invalid-argument",
        "Kulang ang mga detalye ng ulat.",
      );
    }

    // get the email from the user's login token so it can't be faked
    const reporterEmail = request.auth.token.email ?? "Walang email";
    const submittedAt = new Date().toLocaleString("en-PH", {
      timeZone: "Asia/Manila",
    });

    const descriptionHtml = description.replace(/\n/g, "<br/>");
    const html = `
        <h2>Bagong Ulat mula sa TriboConnect</h2>
        <p><strong>Uri:</strong> ${categories.join(", ")}</p>
        <p><strong>Pamagat:</strong> ${subject}</p>
        <p><strong>Detalye:</strong><br/>${descriptionHtml}</p>
        <hr/>
        <p><strong>Nag-report:</strong> ${reporterEmail}</p>
        <p><strong>UID:</strong> ${request.auth.uid}</p>
        <p><strong>Petsa:</strong> ${submittedAt}</p>
        `;

    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY.value()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: FROM_ADDRESS,
          to: [REPORT_RECIPIENT],
          reply_to: reporterEmail,
          subject: `[TriboConnect Report] ${subject}`,
          html,
        }),
      });

      if (!res.ok) {
        console.error("Resend error:", await res.text());
        throw new Error("Resend request failed");
      }
    } catch (err) {
      console.error("Failed to send report email:", err);
      throw new HttpsError(
        "internal",
        "Nabigo ang pagpapadala ng ulat. Pakisubukang muli.",
      );
    }

    return {success: true};
  },
);
