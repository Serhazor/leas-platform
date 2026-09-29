import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import { getAdminSettings } from "@/lib/data/admin";
import { LegalSettingsForm } from "../SettingsForms";

export const metadata: Metadata = { title: "Paramètres" };

export default async function Page() {
  await requireAdmin();
  const s = await getAdminSettings();
  if (!s) return <p>Les paramètres n&apos;ont pas encore été initialisés. Lancez l&apos;initialisation de la base de données.</p>;
  return <LegalSettingsForm s={s} />;
}
