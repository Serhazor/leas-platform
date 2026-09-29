import { FaqList } from "@/components/site/FaqList";
import { ContentSection, CtaBand, PageHeader } from "@/components/site/Sections";
import { JsonLd } from "@/components/ui/JsonLd";
import { pageMetadata } from "@/lib/data/metadata";
import { getFaqs, getPage } from "@/lib/data/public";
import { faqJsonLd } from "@/lib/seo";

export const revalidate = 3600;

export function generateMetadata() {
  return pageMetadata("questions-frequentes", "/questions-frequentes", "Questions fréquentes");
}

export default async function FaqPage() {
  const [page, faqs] = await Promise.all([getPage("questions-frequentes"), getFaqs()]);
  const s = page?.sections ?? {};
  return (
    <>
      <PageHeader section={s.hero} fallbackTitle="Questions fréquentes" />
      <ContentSection>
        <div className="mx-auto max-w-3xl">
          {faqs.length ? <FaqList faqs={faqs} /> : <p className="text-muted">Aucune question pour le moment.</p>}
        </div>
      </ContentSection>
      <CtaBand section={s.final_cta} />
      {faqs.length > 0 && <JsonLd data={faqJsonLd(faqs)} />}
    </>
  );
}
