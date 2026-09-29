"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { ItemField } from "@/lib/content/registry";
import { useMarkDirty } from "./AdminForm";
import { MediaPickerModal } from "./MediaPicker";

type Item = { key: number; title: string; text: string; imageId: string | null; imageUrl: string | null };

let counter = 0;

/** Repeatable list of simple items (title / text / image) edited without any technical notion. */
export function ItemsEditor({
  name,
  label,
  itemLabel = "Élément",
  fields,
  initial,
}: {
  name: string;
  label: string;
  itemLabel?: string;
  fields: ItemField[];
  initial: { title?: string; text?: string; imageId?: string | null; imageUrl?: string | null }[];
}) {
  const [items, setItems] = useState<Item[]>(() =>
    initial.map((i) => ({ key: ++counter, title: i.title ?? "", text: i.text ?? "", imageId: i.imageId ?? null, imageUrl: i.imageUrl ?? null })),
  );
  const [pickerFor, setPickerFor] = useState<number | null>(null);
  const markDirty = useMarkDirty();

  function update(next: Item[]) {
    setItems(next);
    markDirty();
  }
  function patch(key: number, values: Partial<Item>) {
    update(items.map((i) => (i.key === key ? { ...i, ...values } : i)));
  }
  function move(index: number, d: -1 | 1) {
    const next = [...items];
    [next[index], next[index + d]] = [next[index + d], next[index]];
    update(next);
  }

  const serialised = JSON.stringify(items.map(({ title, text, imageId }) => ({ title, text, imageId })));

  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-ink">{label}</legend>
      <input type="hidden" name={name} value={serialised} />
      <ol className="space-y-3">
        {items.map((item, index) => (
          <li key={item.key} className="rounded-md border border-line bg-paper p-3 sm:p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="text-xs font-semibold tracking-wide text-subtle uppercase">
                {itemLabel} {index + 1}
              </span>
              <div className="flex items-center gap-0.5">
                <button type="button" onClick={() => move(index, -1)} disabled={index === 0} className="rounded p-1.5 text-muted hover:bg-ink/5 disabled:opacity-30" aria-label={`Monter ${itemLabel.toLowerCase()} ${index + 1}`}>
                  <ArrowUp className="h-4 w-4" aria-hidden="true" />
                </button>
                <button type="button" onClick={() => move(index, 1)} disabled={index === items.length - 1} className="rounded p-1.5 text-muted hover:bg-ink/5 disabled:opacity-30" aria-label={`Descendre ${itemLabel.toLowerCase()} ${index + 1}`}>
                  <ArrowDown className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => update(items.filter((i) => i.key !== item.key))}
                  className="rounded p-1.5 text-muted hover:bg-red-50 hover:text-red-800"
                  aria-label={`Supprimer ${itemLabel.toLowerCase()} ${index + 1}`}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-[auto_1fr]">
              {fields.includes("image") && (
                <div className="flex items-start gap-3 sm:flex-col">
                  <div className="relative h-24 w-32 overflow-hidden rounded border border-line bg-secondary">
                    {item.imageUrl && <Image src={item.imageUrl} alt="" fill sizes="128px" className="object-cover" />}
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => setPickerFor(item.key)}>
                    {item.imageId ? "Changer" : "Choisir une image"}
                  </Button>
                </div>
              )}
              <div className={`space-y-3 ${fields.includes("image") ? "" : "sm:col-span-2"}`}>
                {fields.includes("title") && (
                  <label className="block">
                    <span className="mb-1 block text-sm text-muted">Titre</span>
                    <input className="field-control" value={item.title} onChange={(e) => patch(item.key, { title: e.target.value })} maxLength={200} />
                  </label>
                )}
                {fields.includes("text") && (
                  <label className="block">
                    <span className="mb-1 block text-sm text-muted">{fields.includes("image") ? "Légende" : "Texte"}</span>
                    <textarea
                      className="field-control"
                      rows={fields.includes("image") ? 2 : 3}
                      value={item.text}
                      onChange={(e) => patch(item.key, { text: e.target.value })}
                      maxLength={2000}
                    />
                  </label>
                )}
              </div>
            </div>
          </li>
        ))}
      </ol>
      <Button
        variant="secondary"
        size="sm"
        className="mt-3"
        onClick={() => update([...items, { key: ++counter, title: "", text: "", imageId: null, imageUrl: null }])}
      >
        <Plus className="h-4 w-4" aria-hidden="true" /> Ajouter : {itemLabel.toLowerCase()}
      </Button>
      <MediaPickerModal
        open={pickerFor !== null}
        onClose={() => setPickerFor(null)}
        onSelect={(m) => pickerFor !== null && patch(pickerFor, { imageId: m.id, imageUrl: m.url })}
      />
    </fieldset>
  );
}
