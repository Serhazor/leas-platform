import type { ProcessStep } from "@/db/schema";

export function ProcessSteps({ steps, compact = false }: { steps: ProcessStep[]; compact?: boolean }) {
  if (!steps.length) return null;
  const cols = steps.length >= 5 ? "lg:grid-cols-5" : steps.length === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3";
  return (
    <ol className={`grid gap-x-8 gap-y-10 sm:grid-cols-2 ${cols}`}>
      {steps.map((step, i) => (
        <li key={step.id} className="relative border-l border-line-strong pl-6 lg:border-t lg:border-l-0 lg:pt-6 lg:pl-0">
          <span className="font-serif text-4xl leading-none text-accent sm:text-5xl" aria-hidden="true">
            {String(i + 1).padStart(2, "0")}
          </span>
          <h3 className="mt-3 text-xl sm:text-[1.4rem]">
            <span className="sr-only">Étape {i + 1} : </span>
            {step.title}
          </h3>
          {!compact && step.description && <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">{step.description}</p>}
        </li>
      ))}
    </ol>
  );
}
