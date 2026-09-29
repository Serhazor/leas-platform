"use client";

import { useTransition } from "react";
import { AdminForm } from "@/components/admin/AdminForm";
import { AText } from "@/components/admin/fields";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { createAdminUser, setAdminActive } from "@/lib/actions/admin/settings";
import { PASSWORD_RULES } from "@/lib/auth/password-rules";

export function AdminAccessActions({ id, active }: { id: string; active: boolean }) {
  const [pending, start] = useTransition();
  const { notify } = useToast();
  return (
    <Button
      variant="secondary"
      size="sm"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await setAdminActive(id, !active);
          notify(res.message ?? "", res.status === "success" ? "success" : "error");
        })
      }
    >
      {active ? "Désactiver" : "Réactiver"}
    </Button>
  );
}

export function NewAdminForm() {
  return (
    <AdminForm action={createAdminUser} stickyBar={false} submitLabel="Créer l'accès" resetOnSuccess>
      <div className="grid gap-4 sm:grid-cols-3">
        <AText name="name" label="Nom" required />
        <AText name="email" type="email" label="E-mail" required />
        <AText name="password" type="text" label="Mot de passe provisoire" required hint={PASSWORD_RULES} autoComplete="off" />
      </div>
    </AdminForm>
  );
}
