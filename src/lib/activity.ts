import "server-only";
import { getDb } from "@/db";
import { activityLog } from "@/db/schema";

export type ActivityType =
  | "booking.created"
  | "booking.status"
  | "booking.notes"
  | "enquiry.created"
  | "enquiry.status"
  | "content.updated"
  | "service.updated"
  | "media.updated"
  | "settings.updated"
  | "availability.updated"
  | "auth.login";

/** Records an entry for the dashboard "Activité récente". Never throws. */
export async function logActivity(entry: {
  type: ActivityType;
  summary: string;
  entityType?: string;
  entityId?: string;
  actorId?: string | null;
}) {
  try {
    await getDb().insert(activityLog).values({
      type: entry.type,
      summary: entry.summary,
      entityType: entry.entityType ?? null,
      entityId: entry.entityId ?? null,
      actorId: entry.actorId ?? null,
    });
  } catch (err) {
    console.error("[activity] impossible d'enregistrer l'activité", err);
  }
}
