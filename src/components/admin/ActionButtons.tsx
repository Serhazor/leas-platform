"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import { useTransition } from "react";
import { ConfirmButton } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import type { FormState } from "@/lib/validation";

/** Up / down buttons for manually ordered lists. */
export function ReorderButtons({
  id,
  action,
  isFirst,
  isLast,
  label,
}: {
  id: string;
  action: (id: string, direction: "up" | "down") => Promise<void>;
  isFirst: boolean;
  isLast: boolean;
  label: string;
}) {
  const [pending, start] = useTransition();
  return (
    <div className="flex items-center">
      <button
        type="button"
        disabled={isFirst || pending}
        onClick={() => start(() => action(id, "up"))}
        className="rounded p-2 text-muted hover:bg-ink/5 hover:text-ink disabled:opacity-25"
        aria-label={`Monter « ${label} »`}
      >
        <ArrowUp className="h-4 w-4" aria-hidden="true" />
      </button>
      <button
        type="button"
        disabled={isLast || pending}
        onClick={() => start(() => action(id, "down"))}
        className="rounded p-2 text-muted hover:bg-ink/5 hover:text-ink disabled:opacity-25"
        aria-label={`Descendre « ${label} »`}
      >
        <ArrowDown className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

/** Delete button with confirmation, calling a server action by id. */
export function DeleteButton({
  id,
  action,
  title,
  description,
  label = "Supprimer",
  successMessage = "Élément supprimé.",
  variant = "ghost",
}: {
  id: string;
  action: (id: string) => Promise<FormState | void>;
  title: string;
  description?: React.ReactNode;
  label?: string;
  successMessage?: string;
  variant?: "ghost" | "danger" | "secondary";
}) {
  const { notify } = useToast();
  return (
    <ConfirmButton
      variant={variant}
      className={variant === "ghost" ? "text-red-800 hover:bg-red-50" : ""}
      title={title}
      description={description}
      confirmLabel="Supprimer"
      onConfirm={async () => {
        try {
          const res = await action(id);
          if (res && res.status === "error") notify(res.message ?? "Suppression impossible.", "error");
          else notify(res?.message ?? successMessage);
        } catch (err) {
          // redirect() from a server action throws a special error handled by Next.js.
          if (err && typeof err === "object" && "digest" in err && String((err as { digest: string }).digest).startsWith("NEXT_REDIRECT")) throw err;
          notify("Une erreur est survenue. Merci de réessayer.", "error");
        }
      }}
    >
      {label}
    </ConfirmButton>
  );
}

/** Small toggle calling a server action immediately (e.g. activate / deactivate). */
export function ToggleSwitch({
  checked,
  onToggle,
  label,
}: {
  checked: boolean;
  onToggle: (next: boolean) => Promise<void>;
  label: string;
}) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={pending}
      onClick={() => start(() => onToggle(!checked))}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-60 ${checked ? "bg-primary" : "bg-line-strong"}`}
    >
      <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
    </button>
  );
}
