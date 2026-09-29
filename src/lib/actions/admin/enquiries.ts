"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { contactEnquiries, type EnquiryStatus } from "@/db/schema";
import { logActivity } from "@/lib/activity";
import { requireAdmin } from "@/lib/auth/session";
import { ENQUIRY_STATUS_LABELS } from "@/lib/booking/status";
import { fullName } from "@/lib/format";
import { failure, success, type FormState } from "@/lib/validation";
import { str, UUID_RE } from "./helpers";

export async function updateEnquiry(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const id = str(formData, "id");
  const status = str(formData, "status") as EnquiryStatus;
  if (!UUID_RE.test(id) || !(status in ENQUIRY_STATUS_LABELS)) return failure("Action invalide.");
  const db = getDb();
  const [before] = await db.select().from(contactEnquiries).where(eq(contactEnquiries.id, id));
  if (!before) return failure("Cette demande n'existe plus.");
  await db
    .update(contactEnquiries)
    .set({ status, privateNotes: str(formData, "privateNotes").slice(0, 10_000) })
    .where(eq(contactEnquiries.id, id));
  if (before.status !== status) {
    await logActivity({
      type: "enquiry.status",
      summary: `Demande de ${fullName(before)} : ${ENQUIRY_STATUS_LABELS[status]}`,
      entityType: "enquiry",
      entityId: id,
      actorId: admin.id,
    });
  }
  revalidatePath("/admin", "layout");
  return success("Demande mise à jour.");
}

export async function deleteEnquiry(id: string) {
  await requireAdmin();
  if (!UUID_RE.test(id)) return;
  await getDb().delete(contactEnquiries).where(eq(contactEnquiries.id, id));
  revalidatePath("/admin", "layout");
  redirect("/admin/demandes?supprime=1");
}
