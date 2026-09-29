"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, type KeyboardEvent } from "react";
import { addDays, daysInMonth, formatDateStringLong, MONTH_LABELS, weekdayOf, WEEKDAY_SHORT } from "@/lib/time";

export interface MonthRef {
  year: number;
  month: number; // 1-12
}

export function shiftMonth(m: MonthRef, delta: number): MonthRef {
  const idx = m.year * 12 + (m.month - 1) + delta;
  return { year: Math.floor(idx / 12), month: (idx % 12) + 1 };
}

export const monthKey = (m: MonthRef) => `${m.year}-${String(m.month).padStart(2, "0")}`;

/**
 * Accessible month calendar (Monday first, French labels).
 * Arrow keys move between days; unavailable days stay focusable but cannot be chosen.
 */
export function DatePicker({
  month,
  onMonthChange,
  selected,
  onSelect,
  isAvailable,
  minMonth,
  maxMonth,
  loading = false,
  labelledBy,
}: {
  month: MonthRef;
  onMonthChange: (m: MonthRef) => void;
  selected: string | null;
  onSelect: (date: string) => void;
  isAvailable: (date: string) => boolean;
  minMonth?: MonthRef;
  maxMonth?: MonthRef;
  loading?: boolean;
  labelledBy?: string;
}) {
  const gridRef = useRef<HTMLDivElement>(null);
  const total = daysInMonth(month.year, month.month);
  const first = `${monthKey(month)}-01`;
  const offset = weekdayOf(first) - 1;
  const dates = Array.from({ length: total }, (_, i) => addDays(first, i));
  const canPrev = !minMonth || monthKey(month) > monthKey(minMonth);
  const canNext = !maxMonth || monthKey(month) < monthKey(maxMonth);
  const focusTarget = (selected && selected.startsWith(monthKey(month)) && selected) || dates.find((d) => isAvailable(d)) || first;

  function focusDate(date: string) {
    gridRef.current?.querySelector<HTMLButtonElement>(`[data-date="${date}"]`)?.focus();
  }

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>, date: string) {
    const moves: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    if (e.key in moves) {
      e.preventDefault();
      const next = addDays(date, moves[e.key]);
      if (next.startsWith(monthKey(month))) focusDate(next);
    } else if (e.key === "Home") {
      e.preventDefault();
      focusDate(first);
    } else if (e.key === "End") {
      e.preventDefault();
      focusDate(dates[dates.length - 1]);
    }
  }

  return (
    <div className="select-none">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => canPrev && onMonthChange(shiftMonth(month, -1))}
          disabled={!canPrev}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-ink hover:bg-ink/5 disabled:opacity-30"
          aria-label="Mois précédent"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <p className="font-serif text-xl capitalize" aria-live="polite">
          {MONTH_LABELS[month.month - 1]} {month.year}
        </p>
        <button
          type="button"
          onClick={() => canNext && onMonthChange(shiftMonth(month, 1))}
          disabled={!canNext}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-ink hover:bg-ink/5 disabled:opacity-30"
          aria-label="Mois suivant"
        >
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-7 text-center text-xs font-medium tracking-wide text-subtle uppercase" aria-hidden="true">
        {WEEKDAY_SHORT.map((d) => (
          <span key={d} className="py-2">
            {d}
          </span>
        ))}
      </div>
      <div ref={gridRef} role="group" aria-labelledby={labelledBy} aria-busy={loading} className={`grid grid-cols-7 gap-1 ${loading ? "opacity-50" : ""}`}>
        {Array.from({ length: offset }, (_, i) => (
          <span key={`e${i}`} aria-hidden="true" />
        ))}
        {dates.map((date) => {
          const available = !loading && isAvailable(date);
          const isSelected = selected === date;
          return (
            <button
              key={date}
              type="button"
              data-date={date}
              tabIndex={date === focusTarget ? 0 : -1}
              aria-pressed={isSelected}
              aria-disabled={!available}
              aria-label={`${formatDateStringLong(date)}${available ? "" : ", indisponible"}`}
              onKeyDown={(e) => onKeyDown(e, date)}
              onClick={() => available && onSelect(date)}
              className={`relative flex aspect-square items-center justify-center rounded-full text-[0.95rem] transition-colors sm:text-base ${
                isSelected
                  ? "bg-primary font-semibold text-on-primary"
                  : available
                    ? "font-medium text-ink hover:bg-primary-soft"
                    : "cursor-default text-subtle/60"
              }`}
            >
              {Number(date.slice(8))}
              {available && !isSelected && <span className="absolute bottom-1.5 h-1 w-1 rounded-full bg-accent" aria-hidden="true" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
