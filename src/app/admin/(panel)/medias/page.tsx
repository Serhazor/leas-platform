import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/Panel";
import { requireAdmin } from "@/lib/auth/session";
import { listMedia } from "@/lib/actions/admin/media";
import { isStorageConfigured } from "@/lib/storage";
import { MediaLibrary } from "./MediaLibrary";

export const metadata: Metadata = { title: "Médiathèque" };

export default async function MediaPage() {
  await requireAdmin();
  const items = await listMedia();
  return (
    <>
      <AdminPageHeader
        title="Médiathèque"
        description="Toutes les images du site. Elles sont automatiquement redimensionnées et optimisées : envoyez vos photos telles quelles."
      />
      {!isStorageConfigured() && (
        <p className="mb-6 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-900">
          L&apos;envoi de nouvelles images n&apos;est pas encore activé sur cette version du site. Les photos livrées avec le site restent
          utilisables et leur description peut être modifiée.
        </p>
      )}
      <MediaLibrary items={items} />
    </>
  );
}
