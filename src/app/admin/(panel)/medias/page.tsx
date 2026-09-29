import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/Panel";
import { requireAdmin } from "@/lib/auth/session";
import { listMedia } from "@/lib/actions/admin/media";
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
      <MediaLibrary items={items} />
    </>
  );
}
