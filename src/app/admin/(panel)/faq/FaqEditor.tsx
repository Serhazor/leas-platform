"use client";

import { useState } from "react";
import { AdminForm } from "@/components/admin/AdminForm";
import { DeleteButton, ReorderButtons, ToggleSwitch } from "@/components/admin/ActionButtons";
import { ACheck, AText, ATextArea } from "@/components/admin/fields";
import { Button } from "@/components/ui/Button";
import { deleteFaq, moveFaq, saveFaq, toggleFaq } from "@/lib/actions/admin/content";

type Faq = { id: string; question: string; answer: string; isActive: boolean; showOnHome: boolean };

export function FaqEditor({ faq, isFirst, isLast }: { faq: Faq; isFirst: boolean; isLast: boolean }) {
  const [editing, setEditing] = useState(false);
  return (
    <div className="rounded-lg border border-line bg-white">
      <div className="flex flex-col gap-3 px-4 py-3 md:flex-row md:items-center">
        <div className="min-w-0 flex-1">
          <p className={`font-medium ${faq.isActive ? "" : "text-subtle"}`}>{faq.question}</p>
          <p className="truncate text-sm text-muted">{faq.answer}</p>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="flex items-center gap-2 text-sm text-muted">
            <ToggleSwitch checked={faq.isActive} onToggle={(v) => toggleFaq(faq.id, "isActive", v)} label={`Afficher « ${faq.question} » sur le site`} />
            <span aria-hidden="true">Visible</span>
          </span>
          <span className="flex items-center gap-2 text-sm text-muted">
            <ToggleSwitch checked={faq.showOnHome} onToggle={(v) => toggleFaq(faq.id, "showOnHome", v)} label={`Afficher « ${faq.question} » sur la page d'accueil`} />
            <span aria-hidden="true">Accueil</span>
          </span>
          <ReorderButtons id={faq.id} action={moveFaq} isFirst={isFirst} isLast={isLast} label={faq.question} />
          <Button variant="secondary" size="sm" onClick={() => setEditing((v) => !v)} aria-expanded={editing}>
            {editing ? "Fermer" : "Modifier"}
          </Button>
        </div>
      </div>
      {editing && (
        <div className="border-t border-line px-4 pb-4">
          <AdminForm
            action={saveFaq}
            stickyBar={false}
            onSuccess={() => setEditing(false)}
            secondaryActions={<DeleteButton id={faq.id} action={deleteFaq} title="Supprimer cette question ?" successMessage="Question supprimée." />}
          >
            <input type="hidden" name="id" value={faq.id} />
            <div className="mt-4 space-y-4">
              <AText name="question" label="Question" defaultValue={faq.question} required />
              <ATextArea name="answer" label="Réponse" rows={5} defaultValue={faq.answer} required />
              <div className="flex flex-col gap-3 sm:flex-row sm:gap-8">
                <ACheck name="isActive" label="Afficher sur le site" defaultChecked={faq.isActive} />
                <ACheck name="showOnHome" label="Afficher sur la page d'accueil" defaultChecked={faq.showOnHome} />
              </div>
            </div>
          </AdminForm>
        </div>
      )}
    </div>
  );
}

export function NewFaqForm() {
  return (
    <AdminForm action={saveFaq} stickyBar={false} submitLabel="Ajouter la question" resetOnSuccess>
      <div className="space-y-4">
        <AText name="question" label="Question" required />
        <ATextArea name="answer" label="Réponse" rows={4} required />
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-8">
          <ACheck name="isActive" label="Afficher sur le site" defaultChecked />
          <ACheck name="showOnHome" label="Afficher sur la page d'accueil" />
        </div>
      </div>
    </AdminForm>
  );
}
