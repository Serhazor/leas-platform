import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { JsonLd } from "@/components/ui/JsonLd";
import { getPublicServices, getSettings } from "@/lib/data/public";
import { businessJsonLd } from "@/lib/seo";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [settings, services] = await Promise.all([getSettings(), getPublicServices()]);
  return (
    <>
      <Header settings={settings} />
      <main id="contenu" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <Footer settings={settings} services={services} />
      <JsonLd data={businessJsonLd(settings)} />
    </>
  );
}
