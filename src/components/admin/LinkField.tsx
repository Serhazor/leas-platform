"use client";

import { useState } from "react";
import { INTERNAL_LINKS } from "@/lib/content/registry";
import { useFieldError, useMarkDirty } from "./AdminForm";

/** Button text + destination (choose a page of the site or type another address). */
export function ButtonFields({
  labelName,
  hrefName,
  title,
  defaultLabel,
  defaultHref,
  extraLinks = [],
}: {
  labelName: string;
  hrefName: string;
  title: string;
  defaultLabel: string;
  defaultHref: string;
  extraLinks?: { href: string; label: string }[];
}) {
  const links = [...INTERNAL_LINKS, ...extraLinks];
  const known = links.some((l) => l.href === defaultHref);
  const [mode, setMode] = useState<string>(defaultHref === "" ? "" : known ? defaultHref : "__custom");
  const [custom, setCustom] = useState(known ? "" : defaultHref);
  const markDirty = useMarkDirty();
  const labelError = useFieldError(labelName);
  const hrefError = useFieldError(hrefName);
  const href = mode === "__custom" ? custom : mode;
  const id = labelName.replace(/\W/g, "-");

  return (
    <fieldset className="rounded-md border border-line p-3 sm:p-4">
      <legend className="px-1 text-sm font-medium text-ink">{title}</legend>
      <input type="hidden" name={hrefName} value={href} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor={`${id}-label`} className="mb-1 block text-sm text-muted">
            Texte du bouton
          </label>
          <input
            id={`${id}-label`}
            name={labelName}
            defaultValue={defaultLabel}
            maxLength={60}
            className="field-control"
            aria-invalid={labelError ? true : undefined}
            placeholder="Laisser vide pour masquer le bouton"
          />
          {labelError && <p className="mt-1 text-sm text-red-800">{labelError}</p>}
        </div>
        <div>
          <label htmlFor={`${id}-href`} className="mb-1 block text-sm text-muted">
            Destination
          </label>
          <select
            id={`${id}-href`}
            className="field-control"
            value={mode}
            onChange={(e) => {
              setMode(e.target.value);
              markDirty();
            }}
          >
            <option value="">— Aucune —</option>
            {links.map((l) => (
              <option key={l.href} value={l.href}>
                {l.label}
              </option>
            ))}
            <option value="__custom">Autre adresse…</option>
          </select>
          {mode === "__custom" && (
            <input
              className="field-control mt-2"
              value={custom}
              onChange={(e) => {
                setCustom(e.target.value);
                markDirty();
              }}
              placeholder="https://… ou /page"
              aria-label="Autre adresse"
              aria-invalid={hrefError ? true : undefined}
            />
          )}
          {hrefError && <p className="mt-1 text-sm text-red-800">{hrefError}</p>}
        </div>
      </div>
    </fieldset>
  );
}
