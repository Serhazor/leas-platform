import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { BookingStatusBadge } from "@/components/admin/BookingBits";
import { Pagination, Tabs, withParams } from "@/components/admin/ListControls";
import { AdminPageHeader, EmptyState } from "@/components/admin/Panel";
import type { Booking } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/session";
import { BOOKING_STATUS_LABELS, BOOKING_STATUSES } from "@/lib/booking/status";
import { getAdminSettings, listAdminServices, listBookings, listBookingsBetween } from "@/lib/data/admin";
import { fullName } from "@/lib/format";
import { addDays, daysInMonth, formatDate, formatDateStringLong, formatTime, MONTH_LABELS, toDateString, weekdayOf, WEEKDAY_SHORT, zonedTimeToUtc } from "@/lib/time";

export const metadata: Metadata = { title: "Réservations" };

type SP = { vue?: string; statut?: string; service?: string; periode?: string; q?: string; page?: string; mois?: string };

export default async function BookingsPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdmin();
  const sp = await searchParams;
  const settings = await getAdminSettings();
  const tz = settings?.timezone || "Europe/Paris";
  const view = sp.vue === "calendrier" ? "calendrier" : "liste";
  const params = { ...sp } as Record<string, string | undefined>;

  return (
    <>
      <AdminPageHeader title="Réservations" description="Toutes les demandes et réservations de vos clients." />
      <Tabs
        label="Affichage"
        items={[
          { href: withParams("/admin/reservations", params, { vue: undefined, page: undefined }), label: "Liste", active: view === "liste" },
          { href: withParams("/admin/reservations", {}, { vue: "calendrier", mois: sp.mois }), label: "Calendrier", active: view === "calendrier" },
        ]}
      />
      {view === "liste" ? <ListView sp={sp} tz={tz} /> : <CalendarView sp={sp} tz={tz} />}
    </>
  );
}

async function ListView({ sp, tz }: { sp: SP; tz: string }) {
  const [result, services] = await Promise.all([
    listBookings({ q: sp.q, status: sp.statut, service: sp.service, period: sp.periode, page: Number(sp.page) || 1 }),
    listAdminServices(),
  ]);
  const params = { statut: sp.statut, service: sp.service, periode: sp.periode, q: sp.q };

  return (
    <>
      <form method="get" className="mb-6 grid gap-3 rounded-lg border border-line bg-white p-4 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr_auto] lg:items-end">
        <label className="block">
          <span className="mb-1 block text-sm text-muted">Rechercher</span>
          <span className="relative block">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-subtle" aria-hidden="true" />
            <input type="search" name="q" defaultValue={sp.q} placeholder="Nom, e-mail, référence, ville…" className="field-control pl-9" />
          </span>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-muted">Statut</span>
          <select name="statut" defaultValue={sp.statut ?? ""} className="field-control">
            <option value="">Tous</option>
            {BOOKING_STATUSES.map((s) => (
              <option key={s} value={s}>
                {BOOKING_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-muted">Service</span>
          <select name="service" defaultValue={sp.service ?? ""} className="field-control">
            <option value="">Tous</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-muted">Période</span>
          <select name="periode" defaultValue={sp.periode ?? "a-venir"} className="field-control">
            <option value="a-venir">À venir</option>
            <option value="passees">Passées</option>
            <option value="toutes">Toutes</option>
          </select>
        </label>
        <button type="submit" className="h-11 rounded-md bg-ink px-5 text-sm font-medium text-white hover:bg-ink/90">
          Filtrer
        </button>
      </form>

      {result.rows.length === 0 ? (
        <EmptyState title="Aucune réservation trouvée">Modifiez les filtres pour élargir la recherche.</EmptyState>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-lg border border-line bg-white md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line bg-paper text-xs tracking-wide text-subtle uppercase">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">Date</th>
                  <th scope="col" className="px-4 py-3 font-medium">Client</th>
                  <th scope="col" className="px-4 py-3 font-medium">Service</th>
                  <th scope="col" className="px-4 py-3 font-medium">Ville</th>
                  <th scope="col" className="px-4 py-3 font-medium">Statut</th>
                  <th scope="col" className="px-4 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {result.rows.map((b) => (
                  <tr key={b.id} className="hover:bg-paper">
                    <td className="px-4 py-3 whitespace-nowrap tabular-nums">
                      {formatDate(b.startsAt, tz)} <span className="text-muted">à {formatTime(b.startsAt, tz)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium">{fullName(b)}</span>
                      {b.company && <span className="block text-xs text-muted">{b.company}</span>}
                    </td>
                    <td className="px-4 py-3">{b.serviceTitle}</td>
                    <td className="px-4 py-3">{b.city || "—"}</td>
                    <td className="px-4 py-3"><BookingStatusBadge status={b.status} /></td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/reservations/${b.id}`} className="font-medium text-primary hover:underline">
                        Ouvrir<span className="sr-only"> la réservation de {fullName(b)}</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile cards */}
          <ul className="space-y-3 md:hidden">
            {result.rows.map((b) => (
              <li key={b.id}>
                <Link href={`/admin/reservations/${b.id}`} className="block rounded-lg border border-line bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-medium">{fullName(b)}</span>
                    <BookingStatusBadge status={b.status} />
                  </div>
                  <p className="mt-1 text-sm text-muted">{b.serviceTitle}</p>
                  <p className="mt-2 text-sm tabular-nums">
                    {formatDate(b.startsAt, tz)} à {formatTime(b.startsAt, tz)}
                    {b.city ? ` · ${b.city}` : ""}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
          <Pagination base="/admin/reservations" params={params} page={result.page} pageCount={result.pageCount} total={result.total} />
        </>
      )}
    </>
  );
}

async function CalendarView({ sp, tz }: { sp: SP; tz: string }) {
  const today = toDateString(new Date(), tz);
  const [y, m] = (sp.mois && /^\d{4}-\d{2}$/.test(sp.mois) ? sp.mois : today.slice(0, 7)).split("-").map(Number);
  const monthStr = `${y}-${String(m).padStart(2, "0")}`;
  const first = `${monthStr}-01`;
  const total = daysInMonth(y, m);
  const bookings = await listBookingsBetween(zonedTimeToUtc(first, "00:00", tz), zonedTimeToUtc(addDays(first, total), "00:00", tz));
  const byDay = new Map<string, Booking[]>();
  for (const b of bookings) {
    const d = toDateString(b.startsAt, tz);
    byDay.set(d, [...(byDay.get(d) ?? []), b]);
  }
  const prev = m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`;
  const next = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
  const offset = weekdayOf(first) - 1;
  const dates = Array.from({ length: total }, (_, i) => addDays(first, i));
  const tone: Record<string, string> = {
    pending: "border-l-amber-500 bg-amber-50",
    confirmed: "border-l-emerald-600 bg-emerald-50",
    completed: "border-l-sky-600 bg-sky-50",
  };

  return (
    <div className="rounded-lg border border-line bg-white">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <Link href={`/admin/reservations?vue=calendrier&mois=${prev}`} className="rounded-md p-2 hover:bg-ink/5" aria-label="Mois précédent">
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </Link>
        <h2 className="font-sans text-lg font-semibold capitalize">
          {MONTH_LABELS[m - 1]} {y}
        </h2>
        <Link href={`/admin/reservations?vue=calendrier&mois=${next}`} className="rounded-md p-2 hover:bg-ink/5" aria-label="Mois suivant">
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </Link>
      </div>

      {/* Desktop month grid */}
      <div className="hidden md:block">
        <div className="grid grid-cols-7 border-b border-line text-center text-xs tracking-wide text-subtle uppercase" aria-hidden="true">
          {WEEKDAY_SHORT.map((d) => (
            <div key={d} className="py-2">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: offset }, (_, i) => (
            <div key={`e${i}`} className="min-h-28 border-r border-b border-line bg-paper/60" />
          ))}
          {dates.map((d) => {
            const items = byDay.get(d) ?? [];
            return (
              <div key={d} className={`min-h-28 border-r border-b border-line p-1.5 ${d === today ? "bg-primary-soft/40" : ""}`}>
                <p className={`mb-1 text-right text-xs ${d === today ? "font-bold text-primary" : "text-subtle"}`}>{Number(d.slice(8))}</p>
                <ul className="space-y-1">
                  {items.map((b) => (
                    <li key={b.id}>
                      <Link href={`/admin/reservations/${b.id}`} className={`block truncate rounded border-l-2 px-1.5 py-1 text-xs hover:brightness-95 ${tone[b.status] ?? "bg-stone-100"}`}>
                        <span className="font-semibold tabular-nums">{formatTime(b.startsAt, tz)}</span> {b.lastName}
                        <span className="sr-only"> — {b.serviceTitle} ({BOOKING_STATUS_LABELS[b.status]})</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile agenda */}
      <div className="md:hidden">
        {byDay.size === 0 ? (
          <p className="p-6 text-center text-sm text-muted">Aucun rendez-vous ce mois-ci.</p>
        ) : (
          <ul className="divide-y divide-line">
            {[...byDay.entries()].map(([d, items]) => (
              <li key={d} className="p-4">
                <p className="mb-2 text-sm font-semibold first-letter:uppercase">{formatDateStringLong(d)}</p>
                <ul className="space-y-2">
                  {items.map((b) => (
                    <li key={b.id}>
                      <Link href={`/admin/reservations/${b.id}`} className={`flex items-center justify-between gap-3 rounded border-l-2 px-3 py-2 text-sm ${tone[b.status] ?? "bg-stone-100"}`}>
                        <span>
                          <span className="font-semibold tabular-nums">{formatTime(b.startsAt, tz)}</span> · {fullName(b)}
                          <span className="block text-xs text-muted">{b.serviceTitle}</span>
                        </span>
                        <BookingStatusBadge status={b.status} />
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="flex flex-wrap gap-4 border-t border-line px-4 py-3 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-amber-500" aria-hidden="true" /> En attente</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-600" aria-hidden="true" /> Confirmé</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-sky-600" aria-hidden="true" /> Terminé</span>
      </p>
    </div>
  );
}
