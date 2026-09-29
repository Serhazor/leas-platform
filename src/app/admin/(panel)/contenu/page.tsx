import { ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/Panel";
import { requireAdmin } from "@/lib/auth/session";
import { PAGE_DEFINITIONS } from "@/lib/content/registry";
import { getAdminSettings, listPagesMeta } from "@/lib/data/admin";
import { formatDateTime } from "@/lib/time";

export const metadata: Metadata = { title: "Pages du site" };

export default async function ContentIndexPage() {
  await requireAdmin();
  const [meta, settings] = await Promise.all([listPagesMeta(), getAdminSettings()]);
  const updated = new Map(meta.map((m) => [m.key, m.updatedAt]));
  const tz = settings?.timezone || "Europe/Paris";
  const main = PAGE_DEFINITIONS.filter((p) => !["mentions-legales", "politique-de-confidentialite", "politique-cookies"].includes(p.key));
  const legal = PAGE_DEFINITIONS.filter((p) => !main.includes(p));

  return (
    <>
      <AdminPageHeader title="Pages du site" description="Modifiez les textes, images et boutons de chaque page." />
      <PageList items={main} updated={updated} tz={tz} />
      <h2 className="mt-10 mb-3 font-sans text-base font-semibold">Pages légales</h2>
      <PageList items={legal} updated={updated} tz={tz} />
    </>
  );
}

function PageList({ items, updated, tz }: { items: typeof PAGE_DEFINITIONS; updated: Map<string, Date>; tz: string }) {
  return (
    <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-white">
      {items.map((p) => (
        <li key={p.key}>
          <Link href={`/admin/contenu/${p.key}`} className="flex items-center gap-4 px-4 py-4 hover:bg-paper">
            <span className="min-w-0 flex-1">
              <span className="block font-medium">{p.name}</span>
              <span className="block text-sm text-muted">{p.description}</span>
            </span>
            {updated.get(p.key) && (
              <span className="hidden text-xs text-subtle sm:block">Modifiée le {formatDateTime(updated.get(p.key)!, tz)}</span>
            )}
            <span className="text-sm font-medium text-primary">Modifier</span>
            <ChevronRight className="h-4 w-4 text-subtle" aria-hidden="true" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
