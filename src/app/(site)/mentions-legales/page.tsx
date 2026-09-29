import { LegalPage } from "@/components/site/LegalPage";
import { pageMetadata } from "@/lib/data/metadata";
import { getPage, getSettings } from "@/lib/data/public";

export const revalidate = 3600;

export function generateMetadata() {
  return pageMetadata("mentions-legales", "/mentions-legales", "Mentions légales");
}

export default async function Page() {
  const [page, settings] = await Promise.all([getPage("mentions-legales"), getSettings()]);
  return <LegalPage page={page} settings={settings} fallbackTitle="Mentions légales" variant="mentions" />;
}
