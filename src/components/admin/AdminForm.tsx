"use client";

import { submitWithoutReset } from "@/lib/use-submit";
import { useRouter } from "next/navigation";
import { createContext, useActionState, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import type { FormState } from "@/lib/validation";

type Action<T> = (prev: FormState<T>, formData: FormData) => Promise<FormState<T>>;

const ErrorsContext = createContext<Record<string, string>>({});

export function useFieldError(name: string): string | undefined {
  return useContext(ErrorsContext)[name];
}

const DirtyContext = createContext<() => void>(() => {});
/** Lets custom (non-native) inputs flag the form as modified. */
export function useMarkDirty() {
  return useContext(DirtyContext);
}

/**
 * Warns before leaving the page when there are unsaved changes
 * (browser navigation + in-app links).
 */
export function useUnsavedChangesWarning(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const message = "Vous avez des modifications non enregistrées. Voulez-vous vraiment quitter cette page ?";
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    const onClick = (e: MouseEvent) => {
      const link = (e.target as HTMLElement).closest("a");
      if (!link || link.target === "_blank" || e.defaultPrevented) return;
      const href = link.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
      if (!window.confirm(message)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [dirty]);
}

/**
 * Standard admin form: server action + validation errors + toast + unsaved-changes warning
 * + sticky "Enregistrer" bar.
 */
export function AdminForm<T = undefined>({
  action,
  children,
  submitLabel = "Enregistrer",
  className = "",
  stickyBar = true,
  resetOnSuccess = false,
  onSuccess,
  secondaryActions,
}: {
  action: Action<T>;
  children: ReactNode;
  submitLabel?: string;
  className?: string;
  stickyBar?: boolean;
  resetOnSuccess?: boolean;
  onSuccess?: (state: FormState<T>) => void;
  secondaryActions?: ReactNode;
}) {
  const [state, formAction, pending] = useActionState<FormState<T>, FormData>(action, { status: "idle" });
  const [dirty, setDirty] = useState(false);
  const { notify } = useToast();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const handled = useRef<number | undefined>(undefined);

  useUnsavedChangesWarning(dirty && !pending);

  useEffect(() => {
    if (!state.submittedAt || state.submittedAt === handled.current) return;
    handled.current = state.submittedAt;
    if (state.status === "success") {
      /* eslint-disable-next-line react-hooks/set-state-in-effect -- reset after a successful save */
      setDirty(false);
      if (state.message) notify(state.message, "success");
      if (resetOnSuccess) formRef.current?.reset();
      onSuccess?.(state);
      router.refresh();
    } else if (state.status === "error") {
      notify(state.message || "Merci de corriger les champs indiqués.", "error");
      const firstInvalid = formRef.current?.querySelector<HTMLElement>("[aria-invalid='true']");
      firstInvalid?.focus();
    }
  }, [state, notify, router, resetOnSuccess, onSuccess]);

  return (
    <ErrorsContext.Provider value={state.fieldErrors ?? {}}>
      <DirtyContext.Provider value={() => setDirty(true)}>
        <form
          ref={formRef}
          onSubmit={submitWithoutReset(formAction)}
          noValidate
          onInput={() => setDirty(true)}
          onChange={() => setDirty(true)}
          className={className}
        >
          {children}
          <div
            className={
              stickyBar
                ? "sticky bottom-0 z-20 -mx-4 mt-8 flex flex-col-reverse gap-3 border-t border-line bg-white/95 px-4 py-3 backdrop-blur sm:-mx-8 sm:flex-row sm:items-center sm:justify-between sm:px-8"
                : "mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between"
            }
          >
            <p className="text-sm text-subtle" aria-live="polite">
              {pending ? "Enregistrement en cours…" : dirty ? "Modifications non enregistrées" : ""}
            </p>
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              {secondaryActions}
              <Button type="submit" disabled={pending}>
                {pending ? "Enregistrement…" : submitLabel}
              </Button>
            </div>
          </div>
        </form>
      </DirtyContext.Provider>
    </ErrorsContext.Provider>
  );
}
