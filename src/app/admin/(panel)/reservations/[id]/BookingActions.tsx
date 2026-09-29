"use client";

import { submitWithoutReset } from "@/lib/use-submit";
import { useActionState, useEffect, useRef, useState } from "react";
import { AdminForm } from "@/components/admin/AdminForm";
import { ATextArea } from "@/components/admin/fields";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import type { BookingStatus } from "@/db/schema";
import { changeBookingStatus, updateBookingNotes } from "@/lib/actions/admin/bookings";
import { initialFormState } from "@/lib/validation";

const ACTIONS: Record<BookingStatus, { label: string; variant: "primary" | "secondary" | "danger"; title: string; email: boolean; help: string }> = {
  confirmed: {
    label: "Confirmer",
    variant: "primary",
    title: "Confirmer le rendez-vous",
    email: true,
    help: "Le client recevra un e-mail de confirmation avec le récapitulatif.",
  },
  refused: {
    label: "Refuser",
    variant: "danger",
    title: "Refuser la demande",
    email: true,
    help: "Le client sera informé que le créneau ne peut pas être retenu. Vous pouvez proposer une alternative.",
  },
  cancelled: {
    label: "Annuler",
    variant: "secondary",
    title: "Annuler le rendez-vous",
    email: true,
    help: "Le créneau sera libéré et le client informé de l'annulation.",
  },
  completed: { label: "Marquer comme terminé", variant: "secondary", title: "Marquer comme terminé", email: false, help: "L'intervention a été réalisée." },
  pending: { label: "Remettre en attente", variant: "secondary", title: "Remettre en attente", email: false, help: "La réservation redevient une demande à traiter." },
};

export function StatusActions({ id, allowed }: { id: string; allowed: BookingStatus[] }) {
  const [target, setTarget] = useState<BookingStatus | null>(null);
  const [state, action, pending] = useActionState(changeBookingStatus, initialFormState);
  const { notify } = useToast();
  const handled = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!state.submittedAt || state.submittedAt === handled.current) return;
    handled.current = state.submittedAt;
    if (state.status === "success") {
      notify(state.message ?? "Statut mis à jour.");
      /* eslint-disable-next-line react-hooks/set-state-in-effect -- close the dialog after the server response */
      setTarget(null);
    } else if (state.status === "error") {
      notify(state.message ?? "Action impossible.", "error");
    }
  }, [state, notify]);

  if (!allowed.length) return null;
  const current = target ? ACTIONS[target] : null;

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {allowed.map((s) => (
          <Button key={s} variant={ACTIONS[s].variant} onClick={() => setTarget(s)}>
            {ACTIONS[s].label}
          </Button>
        ))}
      </div>
      <Modal open={Boolean(target)} onClose={() => setTarget(null)} title={current?.title ?? ""} size="md">
        {target && current && (
          <form onSubmit={submitWithoutReset(action)} className="space-y-4">
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="status" value={target} />
            <p className="text-[0.95rem] text-muted">{current.help}</p>
            {current.email && (
              <>
                <label className="flex items-center gap-3 text-sm">
                  <input type="checkbox" name="notify" defaultChecked className="h-5 w-5 accent-[var(--brand-primary)]" />
                  Prévenir le client par e-mail
                </label>
                <div>
                  <label htmlFor="note" className="mb-1.5 block text-sm font-medium">
                    Message personnel <span className="font-normal text-subtle">(facultatif, ajouté à l&apos;e-mail)</span>
                  </label>
                  <textarea id="note" name="note" rows={4} className="field-control" maxLength={2000} />
                </div>
              </>
            )}
            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <Button variant="secondary" onClick={() => setTarget(null)} disabled={pending}>
                Retour
              </Button>
              <Button type="submit" variant={current.variant === "danger" ? "danger" : "primary"} disabled={pending}>
                {pending ? "Veuillez patienter…" : current.label}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}

export function NotesForm({ id, notes }: { id: string; notes: string }) {
  return (
    <AdminForm action={updateBookingNotes} stickyBar={false} submitLabel="Enregistrer les notes">
      <input type="hidden" name="id" value={id} />
      <ATextArea
        name="privateNotes"
        label="Notes privées"
        hint="Visibles uniquement dans l'administration."
        rows={5}
        defaultValue={notes}
        optional
      />
    </AdminForm>
  );
}
