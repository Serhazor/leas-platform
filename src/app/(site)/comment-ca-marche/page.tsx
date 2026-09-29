import { ContentSection, CtaBand, PageHeader } from "@/components/site/Sections";
import { pageMetadata } from "@/lib/data/metadata";
import { getPage, getProcessSteps } from "@/lib/data/public";

export const revalidate = 3600;

export function generateMetadata() {
  return pageMetadata("comment-ca-marche", "/comment-ca-marche", "Comment ça marche");
}

export default async function HowItWorksPage() {
  const [page, steps] = await Promise.all([getPage("comment-ca-marche"), getProcessSteps()]);
  const s = page?.sections ?? {};

  return (
    <>
      <PageHeader section={s.hero} fallbackTitle="Comment ça marche" />

      <ContentSection>
        <ol className="mx-auto max-w-3xl">
          {steps.map((step, i) => (
            <li key={step.id} className="relative grid grid-cols-[3.5rem_1fr] gap-5 pb-12 last:pb-0 sm:grid-cols-[5rem_1fr] sm:gap-8">
              {i < steps.length - 1 && (
                <span className="absolute top-14 bottom-2 left-[1.75rem] w-px bg-line-strong sm:top-16 sm:left-[2.5rem]" aria-hidden="true" />
              )}
              <span
                className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full border border-line-strong bg-paper font-serif text-2xl text-accent sm:h-20 sm:w-20 sm:text-3xl"
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <div className="pt-2 sm:pt-5">
                <h2 className="text-2xl sm:text-3xl">
                  <span className="sr-only">Étape {i + 1} : </span>
                  {step.title}
                </h2>
                {step.description && <p className="mt-3 text-lg leading-relaxed text-muted">{step.description}</p>}
              </div>
            </li>
          ))}
        </ol>
      </ContentSection>

      {s.details && s.details.items.length > 0 && (
        <ContentSection tone="soft" labelledBy="titre-details">
          <h2 id="titre-details" className="text-3xl sm:text-4xl">
            {s.details.heading}
          </h2>
          <dl className="mt-10 grid gap-10 md:grid-cols-3">
            {s.details.items.map((item, i) => (
              <div key={i} className="border-t border-ink/15 pt-6">
                <dt className="font-serif text-2xl">{item.title}</dt>
                <dd className="mt-2 leading-relaxed text-muted">{item.text}</dd>
              </div>
            ))}
          </dl>
        </ContentSection>
      )}

      <CtaBand section={s.final_cta} />
    </>
  );
}
