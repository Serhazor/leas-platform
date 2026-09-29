import { LegalPage } from "@/components/site/LegalPage";
import { pageMetadata } from "@/lib/data/metadata";
import { getPage, getSettings } from "@/lib/data/public";

export const revalidate = 3600;

export function generateMetadata() {
  return pageMetadata("politique-de-confidentialite", "/politique-de-confidentialite", "Politique de confidentialité");
}

export default async function Page() {
  const [page, settings] = await Promise.all([getPage("politique-de-confidentialite"), getSettings()]);
  return <LegalPage page={page} settings={settings} fallbackTitle="Politique de confidentialité" variant="privacy" />;
}
