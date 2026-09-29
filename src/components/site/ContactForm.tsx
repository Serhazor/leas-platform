"use client";

import { submitWithoutReset } from "@/lib/use-submit";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { CheckboxField, FormMessage, SelectField, TextAreaField, TextField } from "@/components/ui/FormField";
import { submitContact } from "@/lib/actions/contact";
import { initialFormState } from "@/lib/validation";

const SUBJECTS = [
  "Demande de devis",
  "Question sur un service",
  "Collaboration régulière",
  "Services événementiels",
  "Autre demande",
];

export function ContactForm() {
  const [state, action, pending] = useActionState(submitContact, initialFormState);
  const startedRef = useRef<HTMLInputElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const e = state.fieldErrors ?? {};

  useEffect(() => {
    if (startedRef.current && !startedRef.current.value) startedRef.current.value = String(Date.now());
  }, []);

  useEffect(() => {
    if (state.status === "success") successRef.current?.focus();
  }, [state.status, state.submittedAt]);

  if (state.status === "success") {
    return (
      <div ref={successRef} tabIndex={-1} className="rounded-[var(--radius-card)] border border-line bg-white p-8 outline-none" role="status">
        <CheckCircle2 className="h-8 w-8 text-primary" aria-hidden="true" />
        <h2 className="mt-4 text-3xl">Message envoyé</h2>
        <p className="mt-3 leading-relaxed text-muted">{state.message}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submitWithoutReset(action)} noValidate className="relative space-y-5">
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Ne pas remplir ce champ
          <input type="text" name="site_web" tabIndex={-1} autoComplete="off" />
        </label>
        <input ref={startedRef} type="hidden" name="_t" />
      </div>

      <FormMessage status={state.status} message={state.status === "error" ? state.message : undefined} />

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField name="firstName" label="Prénom" autoComplete="given-name" required error={e.firstName} />
        <TextField name="lastName" label="Nom" autoComplete="family-name" required error={e.lastName} />
      </div>
      <TextField name="company" label="Société" optional autoComplete="organization" error={e.company} />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField name="email" type="email" label="E-mail" autoComplete="email" inputMode="email" required error={e.email} />
        <TextField name="phone" type="tel" label="Téléphone" optional autoComplete="tel" inputMode="tel" error={e.phone} />
      </div>
      <SelectField name="subject" label="Objet" defaultValue="" required error={e.subject}>
        <option value="" disabled>
          Choisissez un objet
        </option>
        {SUBJECTS.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </SelectField>
      <TextAreaField name="message" label="Message" rows={6} required error={e.message} />
      <CheckboxField
        name="consent"
        required
        error={e.consent}
        label={
          <>
            J&apos;accepte que mes données soient utilisées pour répondre à ma demande, conformément à la{" "}
            <Link href="/politique-de-confidentialite" className="underline underline-offset-4" target="_blank">
              politique de confidentialité
            </Link>
            .
          </>
        }
      />
      <div className="pt-2">
        <Button type="submit" size="lg" disabled={pending} className="w-full sm:w-auto">
          {pending ? "Envoi en cours…" : "Envoyer le message"}
        </Button>
      </div>
    </form>
  );
}
