"use server";

import { after } from "next/server";
import { getDb } from "@/db";
import { contactEnquiries, siteSettings } from "@/db/schema";
import { logActivity } from "@/lib/activity";
import { sendEmailSafely, siteUrl } from "@/lib/email";
import { adminEnquiryNotification } from "@/lib/email/templates";
import { fullName } from "@/lib/format";
import { isLikelyBot, tooManyEnquiries } from "@/lib/rate-limit";
import { contactSchema, failure, formDataToObject, invalid, success, type FormState } from "@/lib/validation";
import { eq } from "drizzle-orm";

const SUCCESS = "Merci, votre message a bien été envoyé. Vous recevrez une réponse dans les meilleurs délais.";

export async function submitContact(_prev: FormState, formData: FormData): Promise<FormState> {
  if (isLikelyBot(formData)) return success(SUCCESS);

  const parsed = contactSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return invalid(parsed.error);
  const data = parsed.data;

  try {
    if (await tooManyEnquiries(data.email)) {
      return failure("Vous avez déjà envoyé plusieurs messages récemment. Merci de patienter avant de réessayer.");
    }
    const db = getDb();
    const [enquiry] = await db
      .insert(contactEnquiries)
      .values({
        firstName: data.firstName,
        lastName: data.lastName,
        company: data.company,
        email: data.email,
        phone: data.phone,
        subject: data.subject,
        message: data.message,
        consentAt: new Date(),
      })
      .returning();

    after(async () => {
      await logActivity({
        type: "enquiry.created",
        summary: `Nouvelle demande de contact de ${fullName(enquiry)} — ${enquiry.subject}`,
        entityType: "enquiry",
        entityId: enquiry.id,
      });
      const [settings] = await db.select().from(siteSettings).where(eq(siteSettings.id, 1));
      const to = settings?.notificationEmail || settings?.email;
      if (settings && to) {
        const mail = adminEnquiryNotification(settings, enquiry, siteUrl(`/admin/demandes/${enquiry.id}`));
        await sendEmailSafely({ ...mail, to, replyTo: enquiry.email, fromName: settings.emailSenderName || settings.companyName });
      }
    });

    return success(SUCCESS);
  } catch (err) {
    console.error("[contact] échec de l'enregistrement", err);
    return failure("Votre message n'a pas pu être envoyé. Merci de réessayer dans quelques instants ou de nous contacter par téléphone.");
  }
}
