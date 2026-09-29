import type { Metadata } from "next";
import { Tabs } from "@/components/admin/ListControls";
import { AdminPageHeader, Panel } from "@/components/admin/Panel";
import { requireAdmin } from "@/lib/auth/session";
import { listCategories } from "@/lib/data/admin";
import { CategoryEditor, NewCategoryForm } from "./CategoryEditor";

export const metadata: Metadata = { title: "Catégories de services" };

export default async function CategoriesPage() {
  await requireAdmin();
  const categories = await listCategories();
  return (
    <>
      <AdminPageHeader title="Services" description="Les catégories regroupent les services sur la page Services." />
      <Tabs
        label="Sections"
        items={[
          { href: "/admin/services", label: "Services", active: false },
          { href: "/admin/services/categories", label: "Catégories", active: true },
        ]}
      />
      <div className="space-y-3">
        {categories.map((c, i) => (
          <CategoryEditor key={c.id} category={c} isFirst={i === 0} isLast={i === categories.length - 1} />
        ))}
      </div>
      <Panel title="Ajouter une catégorie" className="mt-6">
        <NewCategoryForm />
      </Panel>
    </>
  );
}
