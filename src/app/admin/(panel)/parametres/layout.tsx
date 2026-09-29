import { AdminPageHeader } from "@/components/admin/Panel";
import { SettingsTabs } from "./SettingsTabs";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AdminPageHeader title="Paramètres" description="Informations de l'entreprise, apparence, réservations et e-mails." />
      <SettingsTabs />
      {children}
    </>
  );
}
