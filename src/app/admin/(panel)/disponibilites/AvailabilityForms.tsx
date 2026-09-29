"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";
import { AdminForm, useFieldError, useMarkDirty } from "@/components/admin/AdminForm";
import { DeleteButton } from "@/components/admin/ActionButtons";
import { AText } from "@/components/admin/fields";
import { addBlockedPeriod, deleteBlockedPeriod, saveWeeklyHours } from "@/lib/actions/admin/availability";
import { WEEKDAY_LABELS } from "@/lib/time";

type Range = { start: string; end: string };

export function WeeklyHoursForm({ days }: { days: Record<number, Range[]> }) {
  return (
    <AdminForm action={saveWeeklyHours} stickyBar={false} submitLabel="Enregistrer les horaires">
      <ul className="divide-y divide-line">
        {WEEKDAY_LABELS.map((label, i) => (
          <DayRow key={label} day={i + 1} label={label} initial={days[i + 1] ?? []} />
        ))}
      </ul>
    </AdminForm>
  );
}

function DayRow({ day, label, initial }: { day: number; label: string; initial: Range[] }) {
  const [open, setOpen] = useState(initial.length > 0);
  const [ranges, setRanges] = useState<Range[]>(initial.length ? initial : [{ start: "09:00", end: "17:00" }]);
  const markDirty = useMarkDirty();
  const error = useFieldError(`day.${day}`);

  const update = (next: Range[]) => {
    setRanges(next);
    markDirty();
  };

  return (
    <li className="py-3.5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <label className="flex w-40 shrink-0 items-center gap-3 pt-2">
          <input
            type="checkbox"
            name={`day.${day}.open`}
            checked={open}
            onChange={(e) => {
              setOpen(e.target.checked);
              markDirty();
            }}
            className="h-5 w-5 accent-[var(--brand-primary)]"
          />
          <span className="font-medium">{label}</span>
        </label>
        {open ? (
          <div className="flex-1 space-y-2">
            {ranges.map((r, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="time"
                  name={`day.${day}.start.${i}`}
                  value={r.start}
                  step={900}
                  onChange={(e) => update(ranges.map((x, j) => (j === i ? { ...x, start: e.target.value } : x)))}
                  className="field-control w-32"
                  aria-label={`${label} : début de la plage ${i + 1}`}
                />
                <span className="text-muted" aria-hidden="true">
                  –
                </span>
                <input
                  type="time"
                  name={`day.${day}.end.${i}`}
                  value={r.end}
                  step={900}
                  onChange={(e) => update(ranges.map((x, j) => (j === i ? { ...x, end: e.target.value } : x)))}
                  className="field-control w-32"
                  aria-label={`${label} : fin de la plage ${i + 1}`}
                />
                {ranges.length > 1 && (
                  <button
                    type="button"
                    onClick={() => update(ranges.filter((_, j) => j !== i))}
                    className="rounded p-2 text-muted hover:bg-red-50 hover:text-red-800"
                    aria-label={`${label} : supprimer la plage ${i + 1}`}
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
              </div>
            ))}
            {ranges.length < 6 && (
              <button
                type="button"
                onClick={() => update([...ranges, { start: "14:00", end: "18:00" }])}
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                <Plus className="h-4 w-4" aria-hidden="true" /> Ajouter une plage
              </button>
            )}
          </div>
        ) : (
          <p className="pt-2 text-sm text-subtle">Indisponible</p>
        )}
      </div>
      {error && (
        <p className="mt-2 text-sm font-medium text-red-800" role="alert">
          {error}
        </p>
      )}
    </li>
  );
}

export function BlockedList({ items }: { items: { id: string; label: string; reason: string }[] }) {
  if (!items.length) return <p className="text-sm text-muted">Aucune absence prévue.</p>;
  return (
    <ul className="divide-y divide-line">
      {items.map((b) => (
        <li key={b.id} className="flex items-center justify-between gap-3 py-2.5">
          <span className="text-sm">
            <span className="block font-medium">{b.label}</span>
            {b.reason && <span className="text-muted">{b.reason}</span>}
          </span>
          <DeleteButton id={b.id} action={deleteBlockedPeriod} title="Supprimer cette indisponibilité ?" label="Retirer" />
        </li>
      ))}
    </ul>
  );
}

export function NewBlockedForm() {
  const [kind, setKind] = useState<"days" | "hours">("days");
  return (
    <AdminForm action={addBlockedPeriod} stickyBar={false} submitLabel="Ajouter l'indisponibilité" resetOnSuccess>
      <fieldset>
        <legend className="mb-2 text-sm font-medium">Ajouter une indisponibilité</legend>
        <input type="hidden" name="kind" value={kind} />
        <div className="mb-4 inline-flex rounded-md border border-line-strong p-0.5 text-sm" role="radiogroup" aria-label="Type d'indisponibilité">
          {(
            [
              ["days", "Journée(s) entière(s)"],
              ["hours", "Quelques heures"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={kind === value}
              onClick={() => setKind(value)}
              className={`rounded px-3 py-1.5 ${kind === value ? "bg-primary text-on-primary" : "text-muted hover:text-ink"}`}
            >
              {label}
            </button>
          ))}
        </div>
        {kind === "days" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <AText name="from" type="date" label="Du" required />
            <AText name="to" type="date" label="Au (inclus)" optional hint="Laisser vide pour une seule journée." />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            <AText name="date" type="date" label="Date" required />
            <AText name="startTime" type="time" label="De" required step={900} />
            <AText name="endTime" type="time" label="À" required step={900} />
          </div>
        )}
        <AText name="label" label="Motif" optional placeholder="Congés, jour férié…" className="mt-4" hint="Visible uniquement par vous." />
      </fieldset>
    </AdminForm>
  );
}
