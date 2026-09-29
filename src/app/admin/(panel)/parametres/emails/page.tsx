import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import { getAdminSettings } from "@/lib/data/admin";
import { EmailSettingsForm } from "../SettingsForms";

export const metadata: Metadata = { title: "Paramètres" };

export default async function Page() {
  await requireAdmin();
  const s = await getAdminSettings();
  if (!s) return <p>Les paramètres n&apos;ont pas encore été initialisés.</p>;
  return <EmailSettingsForm s={s} providerConfigured={Boolean(process.env.RESEND_API_KEY)} />;
}
