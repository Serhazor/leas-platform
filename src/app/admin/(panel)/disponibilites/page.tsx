import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageHeader, Panel } from "@/components/admin/Panel";
import { requireAdmin } from "@/lib/auth/session";
import { getAdminSettings, getAvailability } from "@/lib/data/admin";
import { formatDate, formatDateTime, formatDuration, formatTime, toDateString } from "@/lib/time";
import { BlockedList, NewBlockedForm, WeeklyHoursForm } from "./AvailabilityForms";

export const metadata: Metadata = { title: "Disponibilités" };

export default async function AvailabilityPage() {
  await requireAdmin();
  const [{ rules, blocked }, settings] = await Promise.all([getAvailability(), getAdminSettings()]);
  const tz = settings?.timezone || "Europe/Paris";
  const days: Record<number, { start: string; end: string }[]> = {};
  for (const r of rules) (days[r.weekday] ??= []).push({ start: r.startTime.slice(0, 5), end: r.endTime.slice(0, 5) });

  const blockedItems = blocked.map((b) => {
    const lastDay = new Date(b.endsAt.getTime() - 1);
    const label = b.allDay
      ? toDateString(b.startsAt, tz) === toDateString(lastDay, tz)
        ? `Le ${formatDate(b.startsAt, tz)} (journée entière)`
        : `Du ${formatDate(b.startsAt, tz)} au ${formatDate(lastDay, tz)} inclus`
      : `Le ${formatDate(b.startsAt, tz)} de ${formatTime(b.startsAt, tz)} à ${formatTime(b.endsAt, tz)}`;
    return { id: b.id, label, reason: b.label };
  });

  return (
    <>
      <AdminPageHeader
        title="Disponibilités"
        description="Définissez vos horaires de travail et vos jours d'absence. Seuls les créneaux libres sont proposés aux clients."
      />
      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <Panel title="Horaires de la semaine" description="Vous pouvez ajouter plusieurs plages par jour (par exemple le matin et l'après-midi).">
          <WeeklyHoursForm days={days} />
        </Panel>
        <div className="space-y-6">
          <Panel title="Absences et indisponibilités" description="Congés, jours fériés, rendez-vous personnels…">
            <BlockedList items={blockedItems} />
            <div className="mt-6 border-t border-line pt-5">
              <NewBlockedForm />
            </div>
          </Panel>
          {settings && (
            <Panel
              title="Règles de réservation"
              actions={
                <Link href="/admin/parametres/reservations" className="text-sm text-primary hover:underline">
                  Modifier
                </Link>
              }
            >
              <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 text-sm">
                <dt className="text-muted">Mode</dt>
                <dd className="font-medium">{settings.bookingMode === "instant" ? "Confirmation immédiate" : "Demande à valider"}</dd>
                <dt className="text-muted">Durée par défaut</dt>
                <dd className="font-medium">{formatDuration(settings.defaultDurationMinutes)}</dd>
                <dt className="text-muted">Battement entre deux rendez-vous</dt>
                <dd className="font-medium">{settings.bufferMinutes} min</dd>
                <dt className="text-muted">Délai minimum avant un rendez-vous</dt>
                <dd className="font-medium">{settings.minNoticeHours} h</dd>
                <dt className="text-muted">Réservation possible jusqu&apos;à</dt>
                <dd className="font-medium">{settings.maxAdvanceDays} jours</dd>
              </dl>
              <p className="mt-4 text-xs text-subtle">Dernière mise à jour : {formatDateTime(settings.updatedAt, tz)}</p>
            </Panel>
          )}
        </div>
      </div>
    </>
  );
}
