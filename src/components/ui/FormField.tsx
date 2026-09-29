import type { ComponentProps, ReactNode } from "react";

interface FieldShellProps {
  id: string;
  label: ReactNode;
  error?: string;
  hint?: ReactNode;
  optional?: boolean;
  className?: string;
  children: ReactNode;
}

/** Label + control + hint + error, with the right ARIA wiring. */
export function FieldShell({ id, label, error, hint, optional, className = "", children }: FieldShellProps) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
        {optional && <span className="ml-1 font-normal text-subtle">(facultatif)</span>}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1.5 text-sm text-subtle">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-sm font-medium text-red-800" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function describedBy(id: string, error?: string, hint?: ReactNode) {
  if (error) return `${id}-error`;
  if (hint) return `${id}-hint`;
  return undefined;
}

type BaseProps = {
  name: string;
  label: ReactNode;
  error?: string;
  hint?: ReactNode;
  optional?: boolean;
  className?: string;
  id?: string;
};

export function TextField({
  name,
  label,
  error,
  hint,
  optional,
  className,
  id,
  ...input
}: BaseProps & Omit<ComponentProps<"input">, "name" | "id">) {
  const fieldId = id ?? `f-${name}`;
  return (
    <FieldShell id={fieldId} label={label} error={error} hint={hint} optional={optional} className={className}>
      <input
        id={fieldId}
        name={name}
        className="field-control"
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(fieldId, error, hint)}
        required={!optional && input.required !== false ? input.required : undefined}
        {...input}
      />
    </FieldShell>
  );
}

export function TextAreaField({
  name,
  label,
  error,
  hint,
  optional,
  className,
  id,
  rows = 5,
  ...input
}: BaseProps & Omit<ComponentProps<"textarea">, "name" | "id">) {
  const fieldId = id ?? `f-${name}`;
  return (
    <FieldShell id={fieldId} label={label} error={error} hint={hint} optional={optional} className={className}>
      <textarea
        id={fieldId}
        name={name}
        rows={rows}
        className="field-control resize-y leading-relaxed"
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(fieldId, error, hint)}
        {...input}
      />
    </FieldShell>
  );
}

export function SelectField({
  name,
  label,
  error,
  hint,
  optional,
  className,
  id,
  children,
  ...input
}: BaseProps & Omit<ComponentProps<"select">, "name" | "id">) {
  const fieldId = id ?? `f-${name}`;
  return (
    <FieldShell id={fieldId} label={label} error={error} hint={hint} optional={optional} className={className}>
      <select
        id={fieldId}
        name={name}
        className="field-control appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 20 20%22 fill=%22%23566064%22><path d=%22M5.5 7.5 10 12l4.5-4.5%22 stroke=%22%23566064%22 stroke-width=%221.5%22 fill=%22none%22/></svg>')] bg-[length:1.1rem] bg-[right_0.75rem_center] bg-no-repeat pr-10"
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(fieldId, error, hint)}
        {...input}
      >
        {children}
      </select>
    </FieldShell>
  );
}

export function CheckboxField({
  name,
  label,
  error,
  hint,
  className = "",
  id,
  ...input
}: Omit<BaseProps, "optional"> & Omit<ComponentProps<"input">, "name" | "id" | "type">) {
  const fieldId = id ?? `f-${name}`;
  return (
    <div className={className}>
      <div className="flex items-start gap-3">
        <input
          id={fieldId}
          name={name}
          type="checkbox"
          className="mt-0.5 h-5 w-5 shrink-0 rounded border-line-strong accent-[var(--brand-primary)]"
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(fieldId, error, hint)}
          {...input}
        />
        <label htmlFor={fieldId} className="text-sm leading-relaxed text-ink">
          {label}
        </label>
      </div>
      {hint && !error && (
        <p id={`${fieldId}-hint`} className="mt-1 pl-8 text-sm text-subtle">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${fieldId}-error`} className="mt-1 pl-8 text-sm font-medium text-red-800" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/** Invisible anti-spam fields (honeypot + timestamp). */
export function SpamTrap({ startedAt }: { startedAt: number }) {
  return (
    <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
      <label>
        Ne pas remplir ce champ
        <input type="text" name="site_web" tabIndex={-1} autoComplete="off" defaultValue="" />
      </label>
      <input type="hidden" name="_t" value={startedAt || ""} readOnly />
    </div>
  );
}

export function FormMessage({ status, message }: { status: "success" | "error" | "idle"; message?: string }) {
  if (!message || status === "idle") return null;
  const cls =
    status === "success"
      ? "border-emerald-700/25 bg-emerald-50 text-emerald-900"
      : "border-red-700/25 bg-red-50 text-red-900";
  return (
    <div role={status === "error" ? "alert" : "status"} className={`rounded-md border px-4 py-3 text-sm ${cls}`}>
      {message}
    </div>
  );
}
