"use client";

import { useState } from "react";
import { AdminForm } from "@/components/admin/AdminForm";
import { DeleteButton, ReorderButtons } from "@/components/admin/ActionButtons";
import { ACheck, AText, ATextArea } from "@/components/admin/fields";
import { Button } from "@/components/ui/Button";
import { deleteStep, moveStep, saveStep } from "@/lib/actions/admin/content";

type Step = { id: string; title: string; description: string; isActive: boolean; updatedAt: string };

export function StepsEditor({ steps }: { steps: Step[] }) {
  const [adding, setAdding] = useState(false);
  return (
    <div className="space-y-3">
      <ol className="space-y-3">
        {steps.map((s, i) => (
          <StepRow key={s.id} step={s} index={i} isFirst={i === 0} isLast={i === steps.length - 1} />
        ))}
      </ol>
      {adding ? (
        <div className="rounded-md border border-line p-4">
          <AdminForm action={saveStep} stickyBar={false} submitLabel="Ajouter l'étape" resetOnSuccess onSuccess={() => setAdding(false)}>
            <div className="space-y-4">
              <AText name="title" label="Titre de l'étape" required />
              <ATextArea name="description" label="Description" rows={3} optional />
            </div>
          </AdminForm>
        </div>
      ) : (
        <Button variant="secondary" size="sm" onClick={() => setAdding(true)}>
          Ajouter une étape
        </Button>
      )}
    </div>
  );
}

function StepRow({ step, index, isFirst, isLast }: { step: Step; index: number; isFirst: boolean; isLast: boolean }) {
  const [editing, setEditing] = useState(false);
  return (
    <li className="rounded-md border border-line">
      <div className="flex items-center gap-3 px-3 py-2.5">
        <span className="w-6 text-center font-semibold text-accent">{index + 1}</span>
        <span className={`min-w-0 flex-1 truncate ${step.isActive ? "" : "text-subtle line-through"}`}>{step.title}</span>
        <ReorderButtons id={step.id} action={moveStep} isFirst={isFirst} isLast={isLast} label={step.title} />
        <Button variant="secondary" size="sm" onClick={() => setEditing((v) => !v)} aria-expanded={editing}>
          {editing ? "Fermer" : "Modifier"}
        </Button>
      </div>
      {editing && (
        <div className="border-t border-line p-4">
          <AdminForm
            action={saveStep}
            stickyBar={false}
            onSuccess={() => setEditing(false)}
            secondaryActions={<DeleteButton id={step.id} action={deleteStep} title="Supprimer cette étape ?" successMessage="Étape supprimée." />}
          >
            <input type="hidden" name="id" value={step.id} />
            <div className="space-y-4">
              <AText name="title" label="Titre de l'étape" defaultValue={step.title} required />
              <ATextArea name="description" label="Description" rows={3} defaultValue={step.description} optional />
              <ACheck name="isActive" label="Afficher cette étape" defaultChecked={step.isActive} />
            </div>
          </AdminForm>
        </div>
      )}
    </li>
  );
}
