import Image from "next/image";
import { ContentSection, CtaBand } from "@/components/site/Sections";
import { ImageFrame } from "@/components/ui/ImageFrame";
import { RichText } from "@/components/ui/RichText";
import { pageMetadata } from "@/lib/data/metadata";
import { getPage, getSettings } from "@/lib/data/public";

export const revalidate = 3600;

export function generateMetadata() {
  return pageMetadata("a-propos", "/a-propos", "À propos");
}

export default async function AboutPage() {
  const [page, settings] = await Promise.all([getPage("a-propos"), getSettings()]);
  const s = page?.sections ?? {};
  const textSections = [s.biography, s.experience, s.qualifications].filter((x) => x && x.body.trim());
  const gallery = s.gallery?.items.filter((i) => i.image) ?? [];

  return (
    <>
      <section className="border-b border-line/70 bg-secondary/55">
        <div className="container-page grid gap-10 py-14 sm:py-18 md:grid-cols-[1.2fr_0.8fr] md:items-center lg:gap-20 lg:py-22">
          <div className="animate-fade-up">
            {s.hero?.eyebrow && <p className="eyebrow">{s.hero.eyebrow}</p>}
            <h1 className="mt-4 text-[2.4rem] sm:text-5xl lg:text-[3.6rem]">{s.hero?.heading || "À propos"}</h1>
            {s.hero?.subheading && <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted sm:text-xl">{s.hero.subheading}</p>}
            {settings?.ownerName && (
              <p className="mt-8 font-serif text-2xl text-primary">
                {settings.ownerName}
                <span className="mt-1 block font-sans text-sm text-subtle">{settings.companyName}</span>
              </p>
            )}
          </div>
          <ImageFrame image={s.hero?.image} ratio="4/5" priority sizes="(min-width: 768px) 35vw, 100vw" className="mx-auto w-full max-w-sm md:max-w-none" />
        </div>
      </section>

      {textSections.length > 0 && (
        <ContentSection>
          <div className="mx-auto max-w-3xl space-y-16">
            {textSections.map((section) => (
              <article key={section!.key}>
                <h2 className="text-3xl sm:text-4xl">{section!.heading}</h2>
                <RichText text={section!.body} className="prose-site mt-6 text-lg" headingLevel={3} />
              </article>
            ))}
          </div>
        </ContentSection>
      )}

      {s.philosophy && (s.philosophy.body || s.philosophy.items.length > 0) && (
        <ContentSection tone="soft" labelledBy="titre-philosophie">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
            <div>
              <h2 id="titre-philosophie" className="text-3xl sm:text-4xl">
                {s.philosophy.heading}
              </h2>
              <RichText text={s.philosophy.body} className="prose-site mt-6 text-lg" />
            </div>
            <dl className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
              {s.philosophy.items.map((item, i) => (
                <div key={i} className="border-t border-ink/15 pt-5">
                  <dt className="font-serif text-2xl">{item.title}</dt>
                  <dd className="mt-2 leading-relaxed text-muted">{item.text}</dd>
                </div>
              ))}
            </dl>
          </div>
        </ContentSection>
      )}

      {gallery.length > 0 && (
        <ContentSection labelledBy="titre-galerie">
          <h2 id="titre-galerie" className="text-3xl sm:text-4xl">
            {s.gallery?.heading}
          </h2>
          <ul className="mt-10 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
            {gallery.map((item, i) => (
              <li key={i}>
                <figure>
                  <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-card)] bg-secondary">
                    <Image src={item.image!.url} alt={item.image!.alt} fill sizes="(min-width: 1024px) 33vw, 50vw" className="object-cover" />
                  </div>
                  {item.text && <figcaption className="mt-2 text-sm text-muted">{item.text}</figcaption>}
                </figure>
              </li>
            ))}
          </ul>
        </ContentSection>
      )}

      <CtaBand section={s.final_cta} />
    </>
  );
}
