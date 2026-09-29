import { AdminShell } from "@/components/admin/AdminShell";
import { isAdminOpenAccess } from "@/lib/auth/demo";
import { requireAdmin } from "@/lib/auth/session";
import { countNew } from "@/lib/data/admin";
import { getSettings } from "@/lib/data/public";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const [counts, settings] = await Promise.all([countNew(), getSettings()]);
  return (
    <AdminShell
      userName={admin.name}
      companyName={settings?.companyName || "Administration"}
      counts={{ bookings: counts.pendingBookings, enquiries: counts.newEnquiries }}
      demoMode={isAdminOpenAccess()}
    >
      {children}
    </AdminShell>
  );
}
