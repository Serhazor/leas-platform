"use client";

import { useState } from "react";
import { AdminForm } from "@/components/admin/AdminForm";
import { DeleteButton, ReorderButtons } from "@/components/admin/ActionButtons";
import { ACheck, AText } from "@/components/admin/fields";
import { Button } from "@/components/ui/Button";
import { deleteCategory, moveCategory, saveCategory } from "@/lib/actions/admin/services";

type Category = { id: string; name: string; description: string; isActive: boolean; serviceCount: number };

export function CategoryEditor({ category, isFirst, isLast }: { category: Category; isFirst: boolean; isLast: boolean }) {
  const [editing, setEditing] = useState(false);
  return (
    <div className="rounded-lg border border-line bg-white">
      <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <p className="font-medium">
            {category.name} {!category.isActive && <span className="text-sm font-normal text-subtle">(masquée)</span>}
          </p>
          <p className="text-sm text-muted">
            {category.serviceCount} service{category.serviceCount > 1 ? "s" : ""}
            {category.description ? ` · ${category.description}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ReorderButtons id={category.id} action={moveCategory} isFirst={isFirst} isLast={isLast} label={category.name} />
          <Button variant="secondary" size="sm" onClick={() => setEditing((v) => !v)} aria-expanded={editing}>
            {editing ? "Fermer" : "Modifier"}
          </Button>
          <DeleteButton
            id={category.id}
            action={deleteCategory}
            title={`Supprimer la catégorie « ${category.name} » ?`}
            description="Une catégorie ne peut être supprimée que si elle ne contient aucun service."
          />
        </div>
      </div>
      {editing && (
        <div className="border-t border-line px-4 pb-4">
          <AdminForm action={saveCategory} stickyBar={false} onSuccess={() => setEditing(false)}>
            <input type="hidden" name="id" value={category.id} />
            <div className="mt-4 space-y-4">
              <AText name="name" label="Nom" defaultValue={category.name} required />
              <AText name="description" label="Description" defaultValue={category.description} optional />
              <ACheck name="isActive" label="Afficher cette catégorie sur le site" defaultChecked={category.isActive} />
            </div>
          </AdminForm>
        </div>
      )}
    </div>
  );
}

export function NewCategoryForm() {
  return (
    <AdminForm action={saveCategory} stickyBar={false} submitLabel="Ajouter" resetOnSuccess>
      <div className="grid gap-4 sm:grid-cols-2">
        <AText name="name" label="Nom" required />
        <AText name="description" label="Description" optional />
      </div>
    </AdminForm>
  );
}
