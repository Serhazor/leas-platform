"use client";

import { AdminForm } from "@/components/admin/AdminForm";
import { ASelect, ATextArea } from "@/components/admin/fields";
import { DeleteButton } from "@/components/admin/ActionButtons";
import type { EnquiryStatus } from "@/db/schema";
import { deleteEnquiry, updateEnquiry } from "@/lib/actions/admin/enquiries";
import { ENQUIRY_STATUS_LABELS, ENQUIRY_STATUSES } from "@/lib/booking/status";

export function EnquiryForm({ id, status, notes }: { id: string; status: EnquiryStatus; notes: string }) {
  return (
    <AdminForm
      action={updateEnquiry}
      stickyBar={false}
      secondaryActions={
        <DeleteButton
          id={id}
          action={async (x) => deleteEnquiry(x)}
          title="Supprimer cette demande ?"
          description="Le message et vos notes seront définitivement supprimés."
        />
      }
    >
      <input type="hidden" name="id" value={id} />
      <div className="space-y-5">
        <ASelect name="status" label="Statut" defaultValue={status}>
          {ENQUIRY_STATUSES.map((s) => (
            <option key={s} value={s}>
              {ENQUIRY_STATUS_LABELS[s]}
            </option>
          ))}
        </ASelect>
        <ATextArea name="privateNotes" label="Notes internes" optional rows={5} defaultValue={notes} hint="Visibles uniquement dans l'administration." />
      </div>
    </AdminForm>
  );
}
