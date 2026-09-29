"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { availabilityRules, blockedPeriods, siteSettings } from "@/db/schema";
import { logActivity } from "@/lib/activity";
import { requireAdmin } from "@/lib/auth/session";
import { addDays, isValidDateString, isValidTimeString, timeToMinutes, WEEKDAY_LABELS, zonedTimeToUtc } from "@/lib/time";
import { failure, success, type FormState } from "@/lib/validation";
import { str, UUID_RE } from "./helpers";

type Range = { weekday: number; startTime: string; endTime: string };

/** Saves the whole weekly schedule. Fields: `day.<1-7>.open`, `day.<n>.start.<i>`, `day.<n>.end.<i>`. */
export async function saveWeeklyHours(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const ranges: Range[] = [];
  const errors: Record<string, string> = {};

  for (let day = 1; day <= 7; day++) {
    if (formData.get(`day.${day}.open`) !== "on") continue;
    const dayRanges: Range[] = [];
    for (let i = 0; i < 6; i++) {
      const start = str(formData, `day.${day}.start.${i}`);
      const end = str(formData, `day.${day}.end.${i}`);
      if (!start && !end) continue;
      if (!isValidTimeString(start) || !isValidTimeString(end)) {
        errors[`day.${day}`] = "Horaires invalides.";
        continue;
      }
      if (timeToMinutes(start) >= timeToMinutes(end)) {
        errors[`day.${day}`] = "L'heure de fin doit être après l'heure de début.";
        continue;
      }
      dayRanges.push({ weekday: day, startTime: start, endTime: end });
    }
    dayRanges.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
    for (let i = 1; i < dayRanges.length; i++) {
      if (timeToMinutes(dayRanges[i].startTime) < timeToMinutes(dayRanges[i - 1].endTime)) {
        errors[`day.${day}`] = "Les plages horaires se chevauchent.";
      }
    }
    if (!dayRanges.length && !errors[`day.${day}`]) errors[`day.${day}`] = `Indiquez au moins une plage horaire pour le ${WEEKDAY_LABELS[day - 1].toLowerCase()}, ou marquez-le comme fermé.`;
    ranges.push(...dayRanges);
  }
  if (Object.keys(errors).length) {
    return { status: "error", message: "Merci de corriger les horaires indiqués.", fieldErrors: errors, submittedAt: Date.now() };
  }

  await getDb().transaction(async (tx) => {
    await tx.delete(availabilityRules);
    if (ranges.length) await tx.insert(availabilityRules).values(ranges);
  });
  await logActivity({ type: "availability.updated", summary: "Horaires hebdomadaires modifiés", actorId: admin.id });
  revalidatePath("/admin/disponibilites");
  return success("Horaires enregistrés.");
}

export async function addBlockedPeriod(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const kind = str(formData, "kind");
  const label = str(formData, "label").trim().slice(0, 120);
  const [settings] = await getDb().select({ tz: siteSettings.timezone }).from(siteSettings).where(eq(siteSettings.id, 1));
  const tz = settings?.tz || "Europe/Paris";
  const errors: Record<string, string> = {};
  let startsAt: Date | null = null;
  let endsAt: Date | null = null;

  if (kind === "hours") {
    const date = str(formData, "date");
    const start = str(formData, "startTime");
    const end = str(formData, "endTime");
    if (!isValidDateString(date)) errors.date = "Date invalide.";
    if (!isValidTimeString(start)) errors.startTime = "Heure invalide.";
    if (!isValidTimeString(end)) errors.endTime = "Heure invalide.";
    if (!Object.keys(errors).length) {
      if (timeToMinutes(start) >= timeToMinutes(end)) errors.endTime = "L'heure de fin doit être après l'heure de début.";
      else {
        startsAt = zonedTimeToUtc(date, start, tz);
        endsAt = zonedTimeToUtc(date, end, tz);
      }
    }
  } else {
    const from = str(formData, "from");
    const to = str(formData, "to") || from;
    if (!isValidDateString(from)) errors.from = "Date invalide.";
    if (!isValidDateString(to)) errors.to = "Date invalide.";
    if (!Object.keys(errors).length) {
      if (to < from) errors.to = "La date de fin doit être après la date de début.";
      else {
        startsAt = zonedTimeToUtc(from, "00:00", tz);
        endsAt = zonedTimeToUtc(addDays(to, 1), "00:00", tz);
      }
    }
  }
  if (!startsAt || !endsAt) {
    return { status: "error", message: "Merci de corriger les champs indiqués.", fieldErrors: errors, submittedAt: Date.now() };
  }
  await getDb().insert(blockedPeriods).values({ startsAt, endsAt, allDay: kind !== "hours", label });
  await logActivity({ type: "availability.updated", summary: `Indisponibilité ajoutée${label ? ` : ${label}` : ""}`, actorId: admin.id });
  revalidatePath("/admin/disponibilites");
  return success("Indisponibilité ajoutée.");
}

export async function deleteBlockedPeriod(id: string): Promise<FormState> {
  await requireAdmin();
  if (!UUID_RE.test(id)) return failure("Action invalide.");
  await getDb().delete(blockedPeriods).where(eq(blockedPeriods.id, id));
  revalidatePath("/admin/disponibilites");
  return success("Indisponibilité supprimée.");
}
