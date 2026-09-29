import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/Panel";
import { requireAdmin } from "@/lib/auth/session";
import { getAdminSettings, listCategories } from "@/lib/data/admin";
import { ServiceForm } from "../ServiceForm";

export const metadata: Metadata = { title: "Nouveau service" };

export default async function NewServicePage() {
  await requireAdmin();
  const [categories, settings] = await Promise.all([listCategories(), getAdminSettings()]);
  return (
    <>
      <AdminPageHeader title="Nouveau service" back={{ href: "/admin/services", label: "Services" }} />
      <ServiceForm
        categories={categories}
        defaultDuration={settings?.defaultDurationMinutes ?? 60}
        values={{
          title: "",
          slug: "",
          categoryId: null,
          shortDescription: "",
          description: "",
          icon: "",
          image: null,
          gallery: [],
          priceCents: null,
          priceFrom: false,
          priceNote: "",
          showPrice: false,
          ctaLabel: "",
          isActive: true,
          isComingSoon: false,
          isFeatured: true,
          bookingEnabled: true,
          requiresAddress: true,
          durationMinutes: null,
          seoTitle: "",
          seoDescription: "",
        }}
      />
    </>
  );
}
