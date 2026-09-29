"use client";

import { ImagePlus, Loader2, Search } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { listMedia, type MediaItem } from "@/lib/actions/admin/media";
import { useMediaUpload } from "./useMediaUpload";

/** Upload button (accepts several files). */
export function UploadButton({
  onUploaded,
  multiple = true,
  label = "Ajouter des images",
}: {
  onUploaded: (items: MediaItem[]) => void;
  multiple?: boolean;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { upload, uploading, error } = useMediaUpload();
  const [progress, setProgress] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    const done: MediaItem[] = [];
    const list = Array.from(files);
    for (let i = 0; i < list.length; i++) {
      setProgress(list.length > 1 ? `Envoi ${i + 1} sur ${list.length}…` : "Envoi en cours…");
      const item = await upload(list[i]);
      if (item) done.push(item);
    }
    setProgress(null);
    if (inputRef.current) inputRef.current.value = "";
    if (done.length) onUploaded(done);
  }

  return (
    <div>
      <label
        className={`inline-flex h-11 cursor-pointer items-center gap-2 rounded-md bg-primary px-4 text-[0.95rem] font-medium text-on-primary hover:bg-primary-dark ${uploading ? "pointer-events-none opacity-70" : ""}`}
      >
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ImagePlus className="h-4 w-4" aria-hidden="true" />}
        {progress ?? label}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
          multiple={multiple}
          className="sr-only"
          onChange={(e) => handleFiles(e.target.files)}
          disabled={uploading}
        />
      </label>
      <p className="mt-2 text-xs text-subtle">Les photos sont automatiquement redimensionnées et optimisées.</p>
      {error && (
        <p className="mt-2 text-sm font-medium text-red-800" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function MediaGrid({
  items,
  onSelect,
  selectedId,
}: {
  items: MediaItem[];
  onSelect: (item: MediaItem) => void;
  selectedId?: string | null;
}) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {items.map((m) => (
        <li key={m.id}>
          <button
            type="button"
            onClick={() => onSelect(m)}
            className={`group block w-full overflow-hidden rounded-md border text-left transition-colors ${
              selectedId === m.id ? "border-primary ring-2 ring-primary" : "border-line hover:border-muted"
            }`}
          >
            <span className="relative block aspect-[4/3] bg-secondary">
              <Image src={m.url} alt={m.alt || ""} fill sizes="(min-width: 1024px) 200px, 45vw" className="object-cover" />
            </span>
            <span className="block truncate px-2 py-1.5 text-xs text-muted">{m.alt || m.fileName}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

/** Modal to choose an image from the library (or upload a new one). */
export function MediaPickerModal({
  open,
  onClose,
  onSelect,
  title = "Choisir une image",
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (item: MediaItem) => void;
  title?: string;
}) {
  const [items, setItems] = useState<MediaItem[] | null>(null);
  const [query, setQuery] = useState("");
  const [loading, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    startTransition(async () => {
      setItems(await listMedia());
    });
  }, [open]);

  const filtered = (items ?? []).filter((m) =>
    `${m.alt} ${m.fileName}`.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <Modal open={open} onClose={onClose} title={title} size="xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <UploadButton
          multiple={false}
          label="Envoyer une nouvelle image"
          onUploaded={(uploaded) => {
            onSelect(uploaded[0]);
            onClose();
          }}
        />
        <label className="relative block sm:w-64">
          <span className="sr-only">Rechercher une image</span>
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-subtle" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher…"
            className="field-control pl-9"
          />
        </label>
      </div>
      <div className="mt-6">
        {loading && !items ? (
          <p className="flex items-center gap-2 text-sm text-muted">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Chargement de la médiathèque…
          </p>
        ) : filtered.length ? (
          <MediaGrid
            items={filtered}
            onSelect={(m) => {
              onSelect(m);
              onClose();
            }}
          />
        ) : (
          <p className="text-sm text-muted">{items?.length ? "Aucune image ne correspond à votre recherche." : "La médiathèque est vide. Envoyez votre première image."}</p>
        )}
      </div>
    </Modal>
  );
}
