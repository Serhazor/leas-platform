"use client";

import { Copy, Loader2, RefreshCw } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AdminForm } from "@/components/admin/AdminForm";
import { DeleteButton } from "@/components/admin/ActionButtons";
import { AText } from "@/components/admin/fields";
import { MediaGrid, UploadButton } from "@/components/admin/MediaPicker";
import { formatBytes, useMediaUpload } from "@/components/admin/useMediaUpload";
import { EmptyState } from "@/components/admin/Panel";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { deleteMedia, mediaUsage, updateMediaAlt, type MediaItem } from "@/lib/actions/admin/media";
import { formatDate } from "@/lib/time";

export function MediaLibrary({ items }: { items: MediaItem[] }) {
  const router = useRouter();
  const { notify } = useToast();
  const [selected, setSelected] = useState<MediaItem | null>(null);
  const current = selected ? items.find((i) => i.id === selected.id) ?? selected : null;

  return (
    <>
      <div className="mb-6 rounded-lg border border-dashed border-line-strong bg-white p-5">
        <UploadButton
          onUploaded={(done) => {
            notify(done.length > 1 ? `${done.length} images ajoutées.` : "Image ajoutée.");
            router.refresh();
          }}
        />
      </div>
      {items.length ? (
        <MediaGrid items={items} onSelect={setSelected} />
      ) : (
        <EmptyState title="La médiathèque est vide">Ajoutez vos premières photos avec le bouton ci-dessus.</EmptyState>
      )}
      <Modal open={Boolean(current)} onClose={() => setSelected(null)} title="Détails de l'image" size="lg">
        {current && <MediaDetails key={current.id + current.url} item={current} onDeleted={() => setSelected(null)} />}
      </Modal>
    </>
  );
}

function MediaDetails({ item, onDeleted }: { item: MediaItem; onDeleted: () => void }) {
  const router = useRouter();
  const { notify } = useToast();
  const [usage, setUsage] = useState<string[] | null>(null);
  const replaceInput = useRef<HTMLInputElement>(null);
  const { upload, uploading, error } = useMediaUpload();

  useEffect(() => {
    mediaUsage(item.id).then(setUsage).catch(() => setUsage([]));
  }, [item.id]);

  const absoluteUrl = typeof window !== "undefined" ? new URL(item.url, window.location.origin).toString() : item.url;

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_1fr]">
      <div>
        <div className="relative aspect-[4/3] overflow-hidden rounded-md border border-line bg-secondary">
          <Image src={item.url} alt={item.alt} fill sizes="(min-width: 768px) 400px, 90vw" className="object-contain" />
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted">
          <dt>Dimensions</dt>
          <dd className="text-ink">
            {item.width} × {item.height} px
          </dd>
          <dt>Poids</dt>
          <dd className="text-ink">{formatBytes(item.sizeBytes)}</dd>
          <dt>Ajoutée le</dt>
          <dd className="text-ink">{formatDate(new Date(item.createdAt))}</dd>
        </dl>
      </div>
      <div className="space-y-5">
        <AdminForm action={updateMediaAlt} stickyBar={false} submitLabel="Enregistrer la description">
          <input type="hidden" name="id" value={item.id} />
          <AText
            name="alt"
            label="Description de l'image"
            defaultValue={item.alt}
            hint="Décrivez brièvement ce que montre l'image. Utile aux personnes malvoyantes et au référencement."
            optional
          />
        </AdminForm>

        <div>
          <p className="text-sm font-medium">Utilisation</p>
          {usage === null ? (
            <p className="mt-1 text-sm text-muted">Vérification…</p>
          ) : usage.length ? (
            <ul className="mt-1 list-disc pl-5 text-sm text-muted">
              {usage.map((u) => (
                <li key={u}>{u}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-sm text-muted">Cette image n&apos;est utilisée nulle part.</p>
          )}
        </div>

        <div className="flex flex-wrap gap-2 border-t border-line pt-4">
          <label className={`inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-line-strong px-3.5 text-sm font-medium hover:border-muted ${uploading ? "pointer-events-none opacity-60" : ""}`}>
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <RefreshCw className="h-4 w-4" aria-hidden="true" />}
            Remplacer l&apos;image
            <input
              ref={replaceInput}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
              className="sr-only"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const res = await upload(file, { replaceId: item.id });
                if (res) {
                  notify("Image remplacée partout où elle est utilisée.");
                  router.refresh();
                }
              }}
            />
          </label>
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard?.writeText(absoluteUrl);
              notify("Adresse de l'image copiée.");
            }}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-line-strong px-3.5 text-sm font-medium hover:border-muted"
          >
            <Copy className="h-4 w-4" aria-hidden="true" /> Copier l&apos;adresse
          </button>
          <DeleteButton
            id={item.id}
            action={async (id) => {
              const res = await deleteMedia(id);
              if (res.status === "success") {
                onDeleted();
                router.refresh();
              }
              return res;
            }}
            title="Supprimer cette image ?"
            description={
              usage && usage.length
                ? `Attention : cette image est utilisée (${usage.join(", ")}). Elle sera retirée de ces emplacements.`
                : "L'image sera définitivement supprimée."
            }
          />
        </div>
        {error && (
          <p className="text-sm font-medium text-red-800" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
