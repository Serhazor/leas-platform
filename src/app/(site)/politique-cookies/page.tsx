import { LegalPage } from "@/components/site/LegalPage";
import { pageMetadata } from "@/lib/data/metadata";
import { getPage, getSettings } from "@/lib/data/public";

export const revalidate = 3600;

export function generateMetadata() {
  return pageMetadata("politique-cookies", "/politique-cookies", "Politique relative aux cookies");
}

export default async function Page() {
  const [page, settings] = await Promise.all([getPage("politique-cookies"), getSettings()]);
  return <LegalPage page={page} settings={settings} fallbackTitle="Politique relative aux cookies" variant="cookies" />;
}
