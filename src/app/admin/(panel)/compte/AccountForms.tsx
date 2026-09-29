"use client";

import { AdminForm } from "@/components/admin/AdminForm";
import { AText } from "@/components/admin/fields";
import { changePassword, updateProfile } from "@/lib/actions/admin/auth";
import { PASSWORD_RULES } from "@/lib/auth/password-rules";

export function ProfileForm({ name, email }: { name: string; email: string }) {
  return (
    <AdminForm action={updateProfile} stickyBar={false}>
      <div className="space-y-4">
        <AText name="name" label="Nom" defaultValue={name} autoComplete="name" required />
        <AText name="email" type="email" label="E-mail de connexion" defaultValue={email} autoComplete="email" required />
      </div>
    </AdminForm>
  );
}

export function PasswordForm() {
  return (
    <AdminForm action={changePassword} stickyBar={false} submitLabel="Changer le mot de passe" resetOnSuccess>
      <div className="space-y-4">
        <AText name="current" type="password" label="Mot de passe actuel" autoComplete="current-password" required />
        <AText name="password" type="password" label="Nouveau mot de passe" autoComplete="new-password" required hint={PASSWORD_RULES} />
        <AText name="confirm" type="password" label="Confirmer le nouveau mot de passe" autoComplete="new-password" required />
      </div>
    </AdminForm>
  );
}
