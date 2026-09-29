"use client";

import { useRef, type KeyboardEvent } from "react";

/** Radio-group of time slots (24-hour format). */
export function TimePicker({
  slots,
  value,
  onChange,
  labelledBy,
}: {
  slots: string[];
  value: string | null;
  onChange: (time: string) => void;
  labelledBy?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const current = value && slots.includes(value) ? value : slots[0];

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    const delta = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const next = (index + delta + slots.length) % slots.length;
    onChange(slots[next]);
    ref.current?.querySelectorAll<HTMLButtonElement>("button")[next]?.focus();
  }

  return (
    <div ref={ref} role="radiogroup" aria-labelledby={labelledBy} className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {slots.map((slot, i) => {
        const checked = value === slot;
        return (
          <button
            key={slot}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={slot === current ? 0 : -1}
            onKeyDown={(e) => onKeyDown(e, i)}
            onClick={() => onChange(slot)}
            className={`h-11 rounded-md border text-[0.95rem] tabular-nums transition-colors ${
              checked
                ? "border-primary bg-primary font-semibold text-on-primary"
                : "border-line-strong bg-white text-ink hover:border-primary"
            }`}
          >
            {slot}
          </button>
        );
      })}
    </div>
  );
}
