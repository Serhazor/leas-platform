import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AdminPageHeader, EmptyState } from "@/components/admin/Panel";
import { Tabs } from "@/components/admin/ListControls";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ButtonLink } from "@/components/ui/Button";
import { ServiceIcon } from "@/components/ui/icons";
import { requireAdmin } from "@/lib/auth/session";
import { listAdminServices } from "@/lib/data/admin";
import { formatServicePrice } from "@/lib/format";
import { ServiceRowActions } from "./ServiceRowActions";

export const metadata: Metadata = { title: "Services" };

export default async function ServicesAdminPage() {
  await requireAdmin();
  const services = await listAdminServices();
  return (
    <>
      <AdminPageHeader
        title="Services"
        description="Les prestations présentées sur le site. L'ordre ci-dessous est celui de l'affichage."
        actions={
          <ButtonLink href="/admin/services/nouveau">
            <Plus className="h-4 w-4" aria-hidden="true" /> Ajouter un service
          </ButtonLink>
        }
      />
      <Tabs
        label="Sections"
        items={[
          { href: "/admin/services", label: "Services", active: true },
          { href: "/admin/services/categories", label: "Catégories", active: false },
        ]}
      />
      {services.length === 0 ? (
        <EmptyState title="Aucun service pour le moment">Ajoutez votre premier service pour le présenter sur le site.</EmptyState>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-white">
          {services.map((s, i) => {
            const price = formatServicePrice(s);
            return (
              <li key={s.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:gap-5">
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <div className="relative flex h-14 w-20 shrink-0 items-center justify-center overflow-hidden rounded bg-secondary text-primary">
                    {s.image ? (
                      <Image src={s.image.url} alt="" fill sizes="80px" className="object-cover" />
                    ) : (
                      <ServiceIcon name={s.icon} className="h-6 w-6" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <Link href={`/admin/services/${s.id}`} className="block truncate font-medium hover:text-primary hover:underline">
                      {s.title}
                    </Link>
                    <p className="truncate text-sm text-muted">
                      {s.categoryName ?? "Sans catégorie"}
                      {price ? ` · ${price}` : ""}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {!s.isActive ? (
                        <StatusBadge tone="neutral">Masqué</StatusBadge>
                      ) : s.isComingSoon ? (
                        <StatusBadge tone="info">Bientôt disponible</StatusBadge>
                      ) : (
                        <StatusBadge tone="success">En ligne</StatusBadge>
                      )}
                      {s.isActive && !s.isComingSoon && !s.bookingEnabled && <StatusBadge tone="neutral">Réservation désactivée</StatusBadge>}
                    </div>
                  </div>
                </div>
                <ServiceRowActions id={s.id} title={s.title} isActive={s.isActive} isFirst={i === 0} isLast={i === services.length - 1} />
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
