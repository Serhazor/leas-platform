"use client";

import type { ComponentProps, ReactNode } from "react";
import { CheckboxField, SelectField, TextAreaField, TextField } from "@/components/ui/FormField";
import { useFieldError } from "./AdminForm";

type Common = { name: string; label: ReactNode; hint?: ReactNode; optional?: boolean; className?: string };

export function AText(props: Common & Omit<ComponentProps<"input">, "name">) {
  const error = useFieldError(props.name);
  return <TextField {...props} error={error} />;
}

export function ATextArea(props: Common & Omit<ComponentProps<"textarea">, "name">) {
  const error = useFieldError(props.name);
  return <TextAreaField {...props} error={error} />;
}

export function ASelect(props: Common & Omit<ComponentProps<"select">, "name">) {
  const error = useFieldError(props.name);
  return <SelectField {...props} error={error} />;
}

export function ACheck(props: Omit<Common, "optional"> & Omit<ComponentProps<"input">, "name" | "type">) {
  const error = useFieldError(props.name);
  return <CheckboxField {...props} error={error} />;
}

/** Text field with a live character counter (SEO titles, descriptions). */
export function ACounted({
  max,
  multiline = false,
  ...props
}: Common & { max: number; multiline?: boolean; defaultValue?: string; placeholder?: string }) {
  const error = useFieldError(props.name);
  const hint = (
    <>
      {props.hint ? <>{props.hint} </> : null}
      <span className="whitespace-nowrap">({max} caractères maximum conseillés)</span>
    </>
  );
  return multiline ? (
    <TextAreaField {...props} rows={3} error={error} hint={hint} maxLength={max * 2} />
  ) : (
    <TextField {...props} error={error} hint={hint} maxLength={max * 2} />
  );
}
