import "server-only";
import { getEmailProvider, type EmailMessage } from "./provider";

/** Sends an e-mail without ever throwing: a failed e-mail must not break a booking. */
export async function sendEmailSafely(message: EmailMessage): Promise<boolean> {
  const recipients = [message.to].flat().filter(Boolean);
  if (!recipients.length) return false;
  try {
    await getEmailProvider().send({ ...message, to: recipients });
    return true;
  } catch (err) {
    console.error("[e-mail] échec de l'envoi :", err);
    return false;
  }
}

export { siteUrl } from "@/lib/site-url";
