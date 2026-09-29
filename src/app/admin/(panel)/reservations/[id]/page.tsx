import { Mail, MapPin, Phone } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BookingStatusBadge } from "@/components/admin/BookingBits";
import { AdminPageHeader, Panel } from "@/components/admin/Panel";
import { requireAdmin } from "@/lib/auth/session";
import { BOOKING_TRANSITIONS } from "@/lib/booking/status";
import { getAdminSettings, getBooking } from "@/lib/data/admin";
import { formatPhone, fullName, phoneHref } from "@/lib/format";
import { formatDateLong, formatDateTime, formatDuration, formatTime } from "@/lib/time";
import { NotesForm, StatusActions } from "./BookingActions";

export const metadata: Metadata = { title: "Réservation" };

export default async function BookingPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const [data, settings] = await Promise.all([getBooking(id), getAdminSettings()]);
  if (!data) notFound();
  const { booking: b, history } = data;
  const tz = settings?.timezone || "Europe/Paris";
  const address = [b.addressLine, [b.postalCode, b.city].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  const duration = Math.round((b.endsAt.getTime() - b.startsAt.getTime()) / 60000);

  return (
    <>
      <AdminPageHeader
        back={{ href: "/admin/reservations", label: "Réservations" }}
        title={
          <span className="flex flex-wrap items-center gap-3">
            {fullName(b)} <BookingStatusBadge status={b.status} />
          </span>
        }
        description={`Référence ${b.reference} · reçue le ${formatDateTime(b.createdAt, tz)}`}
      />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Panel title="Rendez-vous" actions={<StatusActions id={b.id} allowed={BOOKING_TRANSITIONS[b.status]} />}>
            <dl className="grid gap-4 text-[0.95rem] sm:grid-cols-2">
              <div>
                <dt className="text-sm text-subtle">Service</dt>
                <dd className="font-medium">{b.serviceTitle}</dd>
              </div>
              <div>
                <dt className="text-sm text-subtle">Date et heure</dt>
                <dd className="font-medium first-letter:uppercase">
                  {formatDateLong(b.startsAt, tz)} à {formatTime(b.startsAt, tz)}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-subtle">Durée prévue</dt>
                <dd>{formatDuration(duration)} (fin vers {formatTime(b.endsAt, tz)})</dd>
              </div>
              {address && (
                <div>
                  <dt className="text-sm text-subtle">Adresse de l&apos;intervention</dt>
                  <dd>
                    {address}
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      <MapPin className="h-3.5 w-3.5" aria-hidden="true" /> Voir sur une carte
                      <span className="sr-only">(nouvel onglet)</span>
                    </a>
                  </dd>
                </div>
              )}
            </dl>
            {b.message && (
              <div className="mt-6 border-t border-line pt-5">
                <p className="text-sm text-subtle">Informations complémentaires du client</p>
                <p className="mt-1 whitespace-pre-line">{b.message}</p>
              </div>
            )}
          </Panel>

          <Panel title="Notes">
            <NotesForm id={b.id} notes={b.privateNotes} />
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Client">
            <p className="font-medium">{fullName(b)}</p>
            {b.company && <p className="text-sm text-muted">{b.company}</p>}
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <a href={`mailto:${b.email}?subject=${encodeURIComponent(`Votre rendez-vous — ${b.serviceTitle}`)}`} className="flex items-center gap-2 text-primary hover:underline">
                  <Mail className="h-4 w-4" aria-hidden="true" /> {b.email}
                </a>
              </li>
              <li>
                <a href={phoneHref(b.phone)} className="flex items-center gap-2 text-primary hover:underline">
                  <Phone className="h-4 w-4" aria-hidden="true" /> {formatPhone(b.phone)}
                </a>
              </li>
            </ul>
            <p className="mt-4 text-xs text-subtle">Consentement RGPD donné le {formatDateTime(b.consentAt, tz)}.</p>
          </Panel>

          <Panel title="Historique">
            {history.length ? (
              <ol className="space-y-3">
                {history.map((h) => (
                  <li key={h.id} className="text-sm">
                    <span className="block">{h.summary}</span>
                    <span className="text-xs text-subtle">{formatDateTime(h.createdAt, tz)}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-muted">Aucun événement enregistré.</p>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
