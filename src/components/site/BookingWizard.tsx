"use client";

import { submitWithoutReset } from "@/lib/use-submit";
import { Check, CheckCircle2, Clock, Loader2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { DatePicker, monthKey, shiftMonth, type MonthRef } from "@/components/ui/DatePicker";
import { CheckboxField, FormMessage, TextAreaField, TextField } from "@/components/ui/FormField";
import { RichText } from "@/components/ui/RichText";
import { TimePicker } from "@/components/ui/TimePicker";
import { submitBooking, type BookingFormState, type BookingResult } from "@/lib/actions/booking";
import { formatDateStringLong, formatDuration } from "@/lib/time";

export interface BookableService {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  categoryName: string | null;
  durationMinutes: number;
  requiresAddress: boolean;
}

interface Texts {
  mode: "request" | "instant";
  requestHeading: string;
  requestBody: string;
  instantHeading: string;
  instantBody: string;
}

type MonthData = { days: Record<string, boolean>; firstDate: string; lastDate: string };

const STEPS = ["Service", "Date et heure", "Vos coordonnées"];

function todayMonthInParis(): MonthRef {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit" }).formatToParts(new Date());
  return { year: Number(parts.find((p) => p.type === "year")!.value), month: Number(parts.find((p) => p.type === "month")!.value) };
}

const toMonth = (date: string): MonthRef => ({ year: Number(date.slice(0, 4)), month: Number(date.slice(5, 7)) });

async function fetchMonth(cache: Map<string, MonthData>, svcId: string, m: MonthRef): Promise<MonthData> {
  const key = `${svcId}:${monthKey(m)}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const res = await fetch(`/api/disponibilites?service=${svcId}&mois=${monthKey(m)}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Chargement impossible");
  const json = (await res.json()) as { days: { date: string; available: boolean }[]; firstDate: string; lastDate: string };
  const data: MonthData = {
    days: Object.fromEntries(json.days.map((d) => [d.date, d.available])),
    firstDate: json.firstDate,
    lastDate: json.lastDate,
  };
  cache.set(key, data);
  return data;
}

const initialState: BookingFormState = { status: "idle" };

export function BookingWizard({ services, texts }: { services: BookableService[]; texts: Texts }) {
  const searchParams = useSearchParams();
  const [state, formAction, pending] = useActionState(submitBooking, initialState);

  const [step, setStep] = useState(1);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [month, setMonth] = useState<MonthRef>(todayMonthInParis);
  const [monthData, setMonthData] = useState<MonthData | null>(null);
  const [monthLoading, setMonthLoading] = useState(false);
  const [date, setDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<string[] | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [time, setTime] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const cache = useRef(new Map<string, MonthData>());
  const headingRef = useRef<HTMLHeadingElement>(null);
  const startedRef = useRef<HTMLInputElement>(null);
  const handledSubmission = useRef<number | undefined>(undefined);

  const service = services.find((s) => s.id === serviceId) ?? null;
  const result = state.status === "success" ? (state.data as BookingResult) : null;
  const e = state.fieldErrors ?? {};

  const loadMonth = useCallback(async (svcId: string, requested: MonthRef, autoAdvance = false) => {
    setLoadError(null);
    setMonthLoading(true);
    try {
      let m = requested;
      let data = await fetchMonth(cache.current, svcId, m);
      // Jump to the first month that still has free slots (at most 3 months ahead).
      if (autoAdvance) {
        const firstMonth = toMonth(data.firstDate);
        if (monthKey(firstMonth) > monthKey(m)) {
          m = firstMonth;
          data = await fetchMonth(cache.current, svcId, m);
        }
        for (let i = 0; i < 3 && !Object.values(data.days).some(Boolean) && monthKey(m) < monthKey(toMonth(data.lastDate)); i++) {
          m = shiftMonth(m, 1);
          data = await fetchMonth(cache.current, svcId, m);
        }
      }
      setMonth(m);
      setMonthData(data);
    } catch {
      setLoadError("Les disponibilités n'ont pas pu être chargées. Merci de réessayer.");
    } finally {
      setMonthLoading(false);
    }
  }, []);

  const loadSlots = useCallback(async (svcId: string, d: string) => {
    setSlotsLoading(true);
    setSlots(null);
    setLoadError(null);
    try {
      const res = await fetch(`/api/disponibilites?service=${svcId}&date=${d}`, { cache: "no-store" });
      if (!res.ok) throw new Error();
      const json = (await res.json()) as { slots: string[] };
      setSlots(json.slots);
    } catch {
      setLoadError("Les horaires n'ont pas pu être chargés. Merci de réessayer.");
    } finally {
      setSlotsLoading(false);
    }
  }, []);

  function goTo(next: number) {
    setStep(next);
    requestAnimationFrame(() => {
      headingRef.current?.focus({ preventScroll: true });
      headingRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function chooseService(id: string) {
    setServiceId(id);
    setDate(null);
    setTime(null);
    setSlots(null);
    setMonthData(null);
    void loadMonth(id, todayMonthInParis(), true);
  }

  function chooseDate(d: string) {
    setDate(d);
    setTime(null);
    if (serviceId) void loadSlots(serviceId, d);
  }

  // Preselect a service from ?service=slug (links from service pages).
  useEffect(() => {
    const slug = searchParams.get("service");
    const match = services.find((s) => s.slug === slug) ?? (services.length === 1 ? services[0] : null);
    if (match) {
      /* eslint-disable react-hooks/set-state-in-effect -- one-time initialisation from the URL */
      setServiceId(match.id);
      setStep(2);
      /* eslint-enable react-hooks/set-state-in-effect */
      void loadMonth(match.id, todayMonthInParis(), true);
    }
    if (startedRef.current) startedRef.current.value = String(Date.now());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // React to server responses (slot taken => back to step 2 with fresh availability).
  useEffect(() => {
    if (state.submittedAt === handledSubmission.current) return;
    handledSubmission.current = state.submittedAt;
    if (state.status === "success") {
      requestAnimationFrame(() => headingRef.current?.focus());
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const data = state.data as { code?: string } | undefined;
    if (state.status === "error" && data?.code === "slot_unavailable" && serviceId) {
      cache.current.clear();
      /* eslint-disable react-hooks/set-state-in-effect -- synchronising with the server response */
      setTime(null);
      setStep(2);
      /* eslint-enable react-hooks/set-state-in-effect */
      void loadMonth(serviceId, month);
      if (date) void loadSlots(serviceId, date);
    }
  }, [state, serviceId, month, date, loadMonth, loadSlots]);

  /* ------------------------------ Confirmation ------------------------------ */
  if (result) {
    const instant = result.status === "confirmed";
    return (
      <div className="mx-auto max-w-2xl animate-fade-up rounded-[var(--radius-card)] border border-line bg-white p-7 sm:p-10">
        <CheckCircle2 className="h-10 w-10 text-primary" aria-hidden="true" />
        <h2 ref={headingRef} tabIndex={-1} className="mt-5 text-3xl outline-none sm:text-4xl">
          {instant ? texts.instantHeading : texts.requestHeading}
        </h2>
        <RichText text={instant ? texts.instantBody : texts.requestBody} className="prose-site mt-4" />
        <dl className="mt-8 divide-y divide-line border-y border-line text-[0.97rem]">
          {[
            ["Référence", result.reference],
            ["Service", result.serviceTitle],
            ["Date", result.dateLabel],
            ["Heure", result.timeLabel],
            ["Statut", instant ? "Confirmé" : "En attente de confirmation"],
            ["E-mail de contact", result.email],
          ].map(([k, v]) => (
            <div key={k} className="flex flex-col gap-1 py-3 sm:flex-row sm:justify-between">
              <dt className="text-subtle">{k}</dt>
              <dd className={`font-medium break-all ${k === "Date" ? "first-letter:uppercase" : ""}`}>{v}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/">Retour à l&apos;accueil</ButtonLink>
          <ButtonLink href="/services" variant="secondary">
            Découvrir les services
          </ButtonLink>
        </div>
      </div>
    );
  }

  /* --------------------------------- Wizard --------------------------------- */
  const minMonth = monthData ? toMonth(monthData.firstDate) : undefined;
  const maxMonth = monthData ? toMonth(monthData.lastDate) : undefined;
  const monthHasAvailability = monthData ? Object.values(monthData.days).some(Boolean) : false;

  return (
    <form onSubmit={submitWithoutReset(formAction)} noValidate className="relative">
      <input type="hidden" name="serviceId" value={serviceId ?? ""} />
      <input type="hidden" name="date" value={date ?? ""} />
      <input type="hidden" name="time" value={time ?? ""} />
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Ne pas remplir ce champ
          <input type="text" name="site_web" tabIndex={-1} autoComplete="off" />
        </label>
        <input ref={startedRef} type="hidden" name="_t" />
      </div>

      {/* Progress */}
      <ol className="mb-10 grid grid-cols-3 gap-2 text-sm" aria-label="Étapes de la réservation">
        {STEPS.map((label, i) => {
          const n = i + 1;
          const done = n < step;
          const current = n === step;
          return (
            <li key={label} aria-current={current ? "step" : undefined} className="flex flex-col gap-2">
              <span className={`h-1 rounded-full ${n <= step ? "bg-primary" : "bg-line"}`} aria-hidden="true" />
              <span className={`flex items-center gap-1.5 ${current ? "font-medium text-ink" : "text-subtle"}`}>
                {done && <Check className="h-3.5 w-3.5 text-primary" aria-hidden="true" />}
                <span className="sr-only">Étape {n} sur 3 : </span>
                <span className={current ? "" : "hidden sm:inline"}>{label}</span>
                {!current && <span className="sm:hidden" aria-hidden="true">{n}</span>}
                {done && <span className="sr-only"> (terminée)</span>}
              </span>
            </li>
          );
        })}
      </ol>

      <h2 ref={headingRef} tabIndex={-1} className="scroll-mt-28 text-3xl outline-none sm:text-4xl">
        {step === 1 && "Quel service souhaitez-vous réserver ?"}
        {step === 2 && "Choisissez une date et un horaire"}
        {step === 3 && "Vos coordonnées"}
      </h2>

      {state.status === "error" && state.message && (
        <div className="mt-6">
          <FormMessage status="error" message={state.message} />
        </div>
      )}

      {/* Step 1 — service */}
      <fieldset hidden={step !== 1} className="mt-8">
        <legend className="sr-only">Service</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {services.map((s) => {
            const checked = s.id === serviceId;
            return (
              <label
                key={s.id}
                className={`flex cursor-pointer gap-4 rounded-[var(--radius-card)] border p-5 transition-colors ${
                  checked ? "border-primary bg-primary-soft/60 ring-1 ring-primary" : "border-line-strong bg-white hover:border-muted"
                }`}
              >
                <input
                  type="radio"
                  name="_service"
                  value={s.id}
                  checked={checked}
                  onChange={() => chooseService(s.id)}
                  className="mt-1.5 h-4 w-4 shrink-0 accent-[var(--brand-primary)]"
                />
                <span>
                  {s.categoryName && <span className="block text-xs text-subtle">{s.categoryName}</span>}
                  <span className="mt-0.5 block font-serif text-xl leading-snug">{s.title}</span>
                  {s.shortDescription && <span className="mt-1.5 block text-sm leading-relaxed text-muted">{s.shortDescription}</span>}
                  <span className="mt-2 inline-flex items-center gap-1.5 text-xs text-subtle">
                    <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                    Durée indicative : {formatDuration(s.durationMinutes)}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
        {e.serviceId && <p className="mt-3 text-sm font-medium text-red-800">{e.serviceId}</p>}
        <div className="mt-8 flex justify-end">
          <Button size="lg" onClick={() => goTo(2)} disabled={!serviceId} className="w-full sm:w-auto">
            Continuer
          </Button>
        </div>
      </fieldset>

      {/* Step 2 — date & time */}
      <div hidden={step !== 2} className="mt-8">
        {service && (
          <p className="mb-6 text-muted">
            <span className="font-medium text-ink">{service.title}</span> · durée indicative {formatDuration(service.durationMinutes)} ·{" "}
            <button type="button" className="link-underline text-primary" onClick={() => goTo(1)}>
              Changer de service
            </button>
          </p>
        )}
        {loadError && (
          <div className="mb-6">
            <FormMessage status="error" message={loadError} />
          </div>
        )}
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
          <div className="rounded-[var(--radius-card)] border border-line bg-white p-4 sm:p-6">
            <p id="label-date" className="sr-only">
              Date
            </p>
            {serviceId && (
              <DatePicker
                month={month}
                onMonthChange={(m) => serviceId && void loadMonth(serviceId, m)}
                selected={date}
                onSelect={chooseDate}
                isAvailable={(d) => Boolean(monthData?.days[d])}
                minMonth={minMonth}
                maxMonth={maxMonth}
                loading={monthLoading}
                labelledBy="label-date"
              />
            )}
            {monthData && !monthLoading && !monthHasAvailability && (
              <p className="mt-4 text-center text-sm text-muted">Aucun créneau disponible ce mois-ci. Essayez le mois suivant.</p>
            )}
            {e.date && <p className="mt-3 text-sm font-medium text-red-800">{e.date}</p>}
          </div>
          <div>
            <h3 id="label-heure" className="font-sans text-base font-semibold">
              {date ? <span className="first-letter:uppercase">{formatDateStringLong(date)}</span> : "Horaire"}
            </h3>
            <div className="mt-4" aria-live="polite">
              {!date && <p className="text-sm text-muted">Sélectionnez d&apos;abord une date dans le calendrier.</p>}
              {date && slotsLoading && (
                <p className="flex items-center gap-2 text-sm text-muted">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Chargement des horaires…
                </p>
              )}
              {date && slots && slots.length === 0 && <p className="text-sm text-muted">Plus aucun horaire disponible à cette date.</p>}
              {date && slots && slots.length > 0 && <TimePicker slots={slots} value={time} onChange={setTime} labelledBy="label-heure" />}
            </div>
            {e.time && <p className="mt-3 text-sm font-medium text-red-800">{e.time}</p>}
          </div>
        </div>
        <div className="mt-10 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          <Button variant="secondary" size="lg" onClick={() => goTo(1)}>
            Retour
          </Button>
          <Button size="lg" onClick={() => goTo(3)} disabled={!date || !time}>
            Continuer
          </Button>
        </div>
      </div>

      {/* Step 3 — details */}
      <div hidden={step !== 3} className="mt-8">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_0.7fr] lg:gap-14">
          <div className="space-y-5">
            <p className="text-sm text-muted">Tous les champs sont obligatoires, sauf mention contraire.</p>
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField name="firstName" label="Prénom" autoComplete="given-name" required error={e.firstName} />
              <TextField name="lastName" label="Nom" autoComplete="family-name" required error={e.lastName} />
            </div>
            <TextField name="company" label="Société" optional autoComplete="organization" error={e.company} />
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField name="email" type="email" label="Adresse e-mail" autoComplete="email" inputMode="email" required error={e.email} />
              <TextField name="phone" type="tel" label="Téléphone" autoComplete="tel" inputMode="tel" required error={e.phone} />
            </div>
            {service?.requiresAddress !== false && (
              <fieldset className="space-y-5 border-t border-line pt-6">
                <legend className="pt-6 text-base font-semibold">Adresse de l&apos;intervention</legend>
                <TextField name="addressLine" label="Adresse" autoComplete="street-address" required error={e.addressLine} hint="Numéro, rue, bâtiment, étage…" />
                <div className="grid gap-5 sm:grid-cols-[0.6fr_1.4fr]">
                  <TextField name="postalCode" label="Code postal" autoComplete="postal-code" inputMode="numeric" maxLength={5} required error={e.postalCode} />
                  <TextField name="city" label="Ville" autoComplete="address-level2" required error={e.city} />
                </div>
              </fieldset>
            )}
            <TextAreaField
              name="message"
              label="Informations complémentaires"
              optional
              rows={4}
              error={e.message}
              hint="Type de bien, surface, accès, personnes présentes, attentes particulières…"
            />
            <CheckboxField
              name="consent"
              required
              error={e.consent}
              label={
                <>
                  J&apos;accepte que mes données soient utilisées pour traiter ma demande de rendez-vous, conformément à la{" "}
                  <Link href="/politique-de-confidentialite" className="underline underline-offset-4" target="_blank">
                    politique de confidentialité
                  </Link>
                  .
                </>
              }
            />
          </div>

          <aside className="h-fit rounded-[var(--radius-card)] bg-secondary p-6 lg:sticky lg:top-28" aria-label="Récapitulatif">
            <h3 className="font-sans text-sm font-semibold tracking-wide text-subtle uppercase">Récapitulatif</h3>
            <dl className="mt-4 space-y-3 text-[0.95rem]">
              <div>
                <dt className="text-subtle">Service</dt>
                <dd className="font-medium">{service?.title ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-subtle">Date</dt>
                <dd className="font-medium first-letter:uppercase">{date ? formatDateStringLong(date) : "—"}</dd>
              </div>
              <div>
                <dt className="text-subtle">Heure</dt>
                <dd className="font-medium">{time ?? "—"}</dd>
              </div>
            </dl>
            <button type="button" className="link-underline mt-4 text-sm text-primary" onClick={() => goTo(2)}>
              Modifier la date ou l&apos;horaire
            </button>
          </aside>
        </div>
        <div className="mt-10 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          <Button variant="secondary" size="lg" onClick={() => goTo(2)} disabled={pending}>
            Retour
          </Button>
          <Button type="submit" size="lg" disabled={pending || !serviceId || !date || !time}>
            {pending ? "Envoi en cours…" : texts.mode === "instant" ? "Confirmer la réservation" : "Envoyer ma demande"}
          </Button>
        </div>
      </div>
    </form>
  );
}
