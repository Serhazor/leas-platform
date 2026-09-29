import type { Metadata } from "next";
import { Panel } from "@/components/admin/Panel";
import { requireAdmin } from "@/lib/auth/session";
import { getAdminSettings, listAdmins } from "@/lib/data/admin";
import { formatDateTime } from "@/lib/time";
import { AdminAccessActions, NewAdminForm } from "./AccessForms";

export const metadata: Metadata = { title: "Accès" };

export default async function AccessPage() {
  const me = await requireAdmin();
  const [admins, settings] = await Promise.all([listAdmins(), getAdminSettings()]);
  const tz = settings?.timezone || "Europe/Paris";
  return (
    <div className="space-y-6">
      <Panel title="Personnes ayant accès à l'administration" description="Il n'existe aucune inscription publique : seuls les comptes créés ici peuvent se connecter.">
        <ul className="divide-y divide-line">
          {admins.map((a) => (
            <li key={a.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
              <span>
                <span className="block font-medium">
                  {a.name} {a.id === me.id && <span className="text-sm font-normal text-subtle">(vous)</span>}
                  {!a.isActive && <span className="text-sm font-normal text-red-800"> — désactivé</span>}
                </span>
                <span className="block text-sm text-muted">
                  {a.email} · {a.role === "owner" ? "Propriétaire" : "Administrateur"}
                  {a.lastLoginAt ? ` · dernière connexion le ${formatDateTime(a.lastLoginAt, tz)}` : " · jamais connecté"}
                </span>
              </span>
              {a.id !== me.id && <AdminAccessActions id={a.id} active={a.isActive} />}
            </li>
          ))}
        </ul>
      </Panel>
      <Panel title="Ajouter un accès">
        <NewAdminForm />
      </Panel>
    </div>
  );
}
