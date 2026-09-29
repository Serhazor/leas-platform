"use client";

import { startTransition, type FormEvent } from "react";

/**
 * React 19 resets uncontrolled forms after an action submission, which would erase
 * what the user typed when the server returns validation errors. Submitting through
 * this handler keeps the values in place.
 */
export function submitWithoutReset(action: (formData: FormData) => void) {
  return (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => action(formData));
  };
}
