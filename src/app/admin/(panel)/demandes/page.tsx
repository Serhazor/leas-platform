import { Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EnquiryStatusBadge } from "@/components/admin/BookingBits";
import { Pagination, Tabs, withParams } from "@/components/admin/ListControls";
import { AdminPageHeader, EmptyState } from "@/components/admin/Panel";
import { requireAdmin } from "@/lib/auth/session";
import { ENQUIRY_STATUS_LABELS, ENQUIRY_STATUSES } from "@/lib/booking/status";
import { getAdminSettings, listEnquiries } from "@/lib/data/admin";
import { fullName } from "@/lib/format";
import { formatDateTime } from "@/lib/time";

export const metadata: Metadata = { title: "Demandes de contact" };

export default async function EnquiriesPage({ searchParams }: { searchParams: Promise<{ statut?: string; q?: string; page?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const [result, settings] = await Promise.all([
    listEnquiries({ status: sp.statut, q: sp.q, page: Number(sp.page) || 1 }),
    getAdminSettings(),
  ]);
  const tz = settings?.timezone || "Europe/Paris";
  const params = { statut: sp.statut, q: sp.q };

  return (
    <>
      <AdminPageHeader title="Demandes de contact" description="Les messages envoyés depuis le formulaire de contact." />
      <Tabs
        label="Filtrer par statut"
        items={[
          { href: withParams("/admin/demandes", { q: sp.q }, {}), label: "Toutes", active: !sp.statut },
          ...ENQUIRY_STATUSES.map((s) => ({
            href: withParams("/admin/demandes", { q: sp.q }, { statut: s }),
            label: ENQUIRY_STATUS_LABELS[s],
            active: sp.statut === s,
          })),
        ]}
      />
      <form method="get" className="mb-6 flex gap-2">
        {sp.statut && <input type="hidden" name="statut" value={sp.statut} />}
        <label className="relative flex-1 sm:max-w-sm">
          <span className="sr-only">Rechercher</span>
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-subtle" aria-hidden="true" />
          <input type="search" name="q" defaultValue={sp.q} placeholder="Nom, e-mail, objet…" className="field-control pl-9" />
        </label>
        <button type="submit" className="h-11 rounded-md bg-ink px-5 text-sm font-medium text-white">
          Rechercher
        </button>
      </form>

      {result.rows.length === 0 ? (
        <EmptyState title="Aucune demande" />
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-white">
          {result.rows.map((e) => (
            <li key={e.id}>
              <Link href={`/admin/demandes/${e.id}`} className="flex flex-col gap-2 px-4 py-4 hover:bg-paper sm:flex-row sm:items-center sm:gap-6">
                <span className="min-w-0 flex-1">
                  <span className={`block truncate ${e.status === "new" ? "font-semibold" : "font-medium"}`}>{e.subject}</span>
                  <span className="block truncate text-sm text-muted">
                    {fullName(e)}
                    {e.company ? ` · ${e.company}` : ""} — {e.message.slice(0, 90)}
                  </span>
                </span>
                <span className="flex items-center gap-3 text-sm text-subtle sm:shrink-0">
                  {formatDateTime(e.createdAt, tz)}
                  <EnquiryStatusBadge status={e.status} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Pagination base="/admin/demandes" params={params} page={result.page} pageCount={result.pageCount} total={result.total} />
    </>
  );
}
