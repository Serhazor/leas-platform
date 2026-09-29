import type { Metadata } from "next";
import { AdminPageHeader, Panel } from "@/components/admin/Panel";
import { requireAdmin } from "@/lib/auth/session";
import { getAdminProfile } from "@/lib/data/admin";
import { PasswordForm, ProfileForm } from "./AccountForms";

export const metadata: Metadata = { title: "Mon compte" };

export default async function AccountPage() {
  const admin = await requireAdmin();
  const profile = await getAdminProfile(admin.id);
  return (
    <>
      <AdminPageHeader title="Mon compte" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Mes informations">
          <ProfileForm name={profile?.name ?? ""} email={profile?.email ?? ""} />
        </Panel>
        <Panel title="Changer de mot de passe">
          <PasswordForm />
        </Panel>
      </div>
    </>
  );
}
