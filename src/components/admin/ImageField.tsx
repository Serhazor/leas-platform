"use client";

import { ArrowDown, ArrowUp, ImageIcon, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { MediaItem } from "@/lib/actions/admin/media";
import { useMarkDirty } from "./AdminForm";
import { MediaPickerModal } from "./MediaPicker";

export type PickedImage = { id: string; url: string; alt: string };

/** Single image chooser storing the media id in a hidden input. */
export function ImageField({
  name,
  label,
  initial,
  hint,
  aspect = "4/3",
}: {
  name: string;
  label: string;
  initial?: PickedImage | null;
  hint?: string;
  aspect?: string;
}) {
  const [image, setImage] = useState<PickedImage | null>(initial ?? null);
  const [open, setOpen] = useState(false);
  const markDirty = useMarkDirty();

  function choose(m: MediaItem | null) {
    setImage(m ? { id: m.id, url: m.url, alt: m.alt } : null);
    markDirty();
  }

  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-ink">{label}</p>
      <input type="hidden" name={name} value={image?.id ?? ""} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative w-full max-w-[14rem] overflow-hidden rounded-md border border-line bg-secondary" style={{ aspectRatio: aspect }}>
          {image ? (
            <Image src={image.url} alt={image.alt} fill sizes="224px" className="object-cover" />
          ) : (
            <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-xs text-subtle">
              <ImageIcon className="h-6 w-6" aria-hidden="true" />
              Aucune image
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
            {image ? "Changer d'image" : "Choisir une image"}
          </Button>
          {image && (
            <Button variant="ghost" size="sm" onClick={() => choose(null)}>
              Retirer
            </Button>
          )}
        </div>
      </div>
      {hint && <p className="mt-2 text-sm text-subtle">{hint}</p>}
      <MediaPickerModal open={open} onClose={() => setOpen(false)} onSelect={(m) => choose(m)} />
    </div>
  );
}

/** Ordered list of images (service gallery). Stored as comma-separated ids. */
export function GalleryField({ name, label, initial }: { name: string; label: string; initial: PickedImage[] }) {
  const [images, setImages] = useState<PickedImage[]>(initial);
  const [open, setOpen] = useState(false);
  const markDirty = useMarkDirty();

  function update(next: PickedImage[]) {
    setImages(next);
    markDirty();
  }
  function move(i: number, d: -1 | 1) {
    const next = [...images];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    update(next);
  }

  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-ink">{label}</p>
      <input type="hidden" name={name} value={images.map((i) => i.id).join(",")} />
      {images.length > 0 && (
        <ul className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((img, i) => (
            <li key={img.id} className="overflow-hidden rounded-md border border-line">
              <div className="relative aspect-[4/3] bg-secondary">
                <Image src={img.url} alt={img.alt} fill sizes="200px" className="object-cover" />
              </div>
              <div className="flex items-center justify-between px-1.5 py-1">
                <div className="flex">
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="rounded p-1.5 text-muted hover:bg-ink/5 disabled:opacity-30" aria-label="Déplacer vers la gauche">
                    <ArrowUp className="h-4 w-4 -rotate-90" aria-hidden="true" />
                  </button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === images.length - 1} className="rounded p-1.5 text-muted hover:bg-ink/5 disabled:opacity-30" aria-label="Déplacer vers la droite">
                    <ArrowDown className="h-4 w-4 -rotate-90" aria-hidden="true" />
                  </button>
                </div>
                <button type="button" onClick={() => update(images.filter((x) => x.id !== img.id))} className="rounded p-1.5 text-muted hover:bg-red-50 hover:text-red-800" aria-label="Retirer de la galerie">
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        Ajouter une image à la galerie
      </Button>
      <MediaPickerModal
        open={open}
        onClose={() => setOpen(false)}
        onSelect={(m) => {
          if (!images.some((x) => x.id === m.id)) update([...images, { id: m.id, url: m.url, alt: m.alt }]);
        }}
      />
    </div>
  );
}
