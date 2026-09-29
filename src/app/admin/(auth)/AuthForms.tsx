"use client";

import { submitWithoutReset } from "@/lib/use-submit";
import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { FormMessage, TextField } from "@/components/ui/FormField";
import { login, requestPasswordReset, resetPassword } from "@/lib/actions/admin/auth";
import { PASSWORD_RULES } from "@/lib/auth/password-rules";
import { initialFormState } from "@/lib/validation";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(login, initialFormState);
  const e = state.fieldErrors ?? {};
  return (
    <form onSubmit={submitWithoutReset(action)} noValidate className="space-y-5">
      <h1 className="font-sans text-xl font-semibold">Connexion</h1>
      <FormMessage status={state.status} message={state.status === "error" ? state.message : undefined} />
      <input type="hidden" name="suite" value={next ?? ""} />
      <TextField name="email" type="email" label="Adresse e-mail" autoComplete="username" inputMode="email" required autoFocus error={e.email} />
      <TextField name="password" type="password" label="Mot de passe" autoComplete="current-password" required error={e.password} />
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Connexion…" : "Se connecter"}
      </Button>
      <p className="text-center text-sm">
        <Link href="/admin/mot-de-passe-oublie" className="text-muted underline underline-offset-4 hover:text-ink">
          Mot de passe oublié ?
        </Link>
      </p>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, initialFormState);
  return (
    <form onSubmit={submitWithoutReset(action)} noValidate className="space-y-5">
      <h1 className="font-sans text-xl font-semibold">Mot de passe oublié</h1>
      {state.status === "success" ? (
        <FormMessage status="success" message={state.message} />
      ) : (
        <>
          <p className="text-sm text-muted">Indiquez votre adresse e-mail : vous recevrez un lien pour choisir un nouveau mot de passe.</p>
          <TextField name="email" type="email" label="Adresse e-mail" autoComplete="username" required error={state.fieldErrors?.email} />
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Envoi…" : "Recevoir le lien"}
          </Button>
        </>
      )}
      <p className="text-center text-sm">
        <Link href="/admin/connexion" className="text-muted underline underline-offset-4 hover:text-ink">
          Retour à la connexion
        </Link>
      </p>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetPassword, initialFormState);
  const e = state.fieldErrors ?? {};
  if (state.status === "success") {
    return (
      <div className="space-y-5">
        <FormMessage status="success" message={state.message} />
        <Link href="/admin/connexion" className="block text-center text-sm underline underline-offset-4">
          Se connecter
        </Link>
      </div>
    );
  }
  return (
    <form onSubmit={submitWithoutReset(action)} noValidate className="space-y-5">
      <h1 className="font-sans text-xl font-semibold">Nouveau mot de passe</h1>
      <FormMessage status={state.status} message={state.status === "error" ? state.message : undefined} />
      <input type="hidden" name="jeton" value={token} />
      <TextField name="password" type="password" label="Nouveau mot de passe" autoComplete="new-password" required hint={PASSWORD_RULES} error={e.password} />
      <TextField name="confirm" type="password" label="Confirmer le mot de passe" autoComplete="new-password" required error={e.confirm} />
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Enregistrement…" : "Enregistrer le mot de passe"}
      </Button>
    </form>
  );
}
