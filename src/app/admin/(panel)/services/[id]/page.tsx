import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/Panel";
import { requireAdmin } from "@/lib/auth/session";
import { getAdminService, getAdminSettings, listCategories } from "@/lib/data/admin";
import { ServiceForm } from "../ServiceForm";

export const metadata: Metadata = { title: "Modifier un service" };

export default async function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const [service, categories, settings] = await Promise.all([getAdminService(id), listCategories(), getAdminSettings()]);
  if (!service) notFound();
  return (
    <>
      <AdminPageHeader
        title={service.title}
        back={{ href: "/admin/services", label: "Services" }}
        actions={
          service.isActive ? (
            <a href={`/services/${service.slug}`} target="_blank" rel="noopener" className="inline-flex h-10 items-center gap-2 rounded-md border border-line-strong bg-white px-4 text-sm">
              <ExternalLink className="h-4 w-4" aria-hidden="true" /> Voir sur le site
            </a>
          ) : null
        }
      />
      <ServiceForm
        categories={categories}
        defaultDuration={settings?.defaultDurationMinutes ?? 60}
        values={{ ...service, image: service.image, gallery: service.gallery }}
      />
    </>
  );
}
