"use client";

import { useCallback, useState } from "react";
import { prepareUpload, registerMedia, type MediaItem } from "@/lib/actions/admin/media";

const MAX_DIMENSION = 2400;
const QUALITY = 0.85;

async function optimise(file: File): Promise<{ blob: Blob; width: number; height: number; mimeType: string; fileName: string }> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error(`« ${file.name} » n'est pas une image lisible. Utilisez une photo JPEG, PNG ou WebP.`);
  }
  const { width, height } = bitmap;
  // Animated GIFs are kept as-is.
  if (file.type === "image/gif") {
    bitmap.close();
    return { blob: file, width, height, mimeType: file.type, fileName: file.name };
  }
  const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
  const w = Math.round(width * scale);
  const h = Math.round(height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Votre navigateur ne permet pas de préparer l'image.");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", QUALITY));
  const baseName = file.name.replace(/\.[^.]+$/, "");
  // Keep the original if the browser cannot encode WebP or if it would be heavier without resizing.
  if (!blob || blob.type !== "image/webp" || (scale === 1 && blob.size >= file.size && ["image/jpeg", "image/webp", "image/png", "image/avif"].includes(file.type))) {
    return { blob: file, width, height, mimeType: file.type, fileName: file.name };
  }
  return { blob, width: w, height: h, mimeType: "image/webp", fileName: `${baseName}.webp` };
}

/**
 * Upload pipeline: resize/convert in the browser (max 2400 px, WebP), upload directly to
 * storage with a one-time URL, then register the file in the media library.
 */
export function useMediaUpload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(async (file: File, options: { replaceId?: string; alt?: string } = {}): Promise<MediaItem | null> => {
    setUploading(true);
    setError(null);
    try {
      const prepared = await optimise(file);
      const target = await prepareUpload({ fileName: prepared.fileName, mimeType: prepared.mimeType, sizeBytes: prepared.blob.size });
      if (!target.ok) throw new Error(target.error);

      let res: Response;
      if (target.kind === "supabase-signed") {
        const body = new FormData();
        body.append("cacheControl", "31536000");
        body.append("", prepared.blob, prepared.fileName);
        res = await fetch(target.uploadUrl, { method: "PUT", body, headers: { "x-upsert": "false" } });
      } else {
        res = await fetch(target.uploadUrl, { method: "PUT", body: prepared.blob, headers: { "Content-Type": prepared.mimeType } });
      }
      if (!res.ok) throw new Error("L'envoi de l'image a échoué. Merci de réessayer.");

      const registered = await registerMedia({
        key: target.key,
        fileName: prepared.fileName,
        mimeType: prepared.mimeType,
        sizeBytes: prepared.blob.size,
        width: prepared.width,
        height: prepared.height,
        alt: options.alt,
        replaceId: options.replaceId,
      });
      if (!registered.ok) throw new Error(registered.error);
      return registered.media;
    } catch (err) {
      setError(err instanceof Error ? err.message : "L'envoi de l'image a échoué.");
      return null;
    } finally {
      setUploading(false);
    }
  }, []);

  return { upload, uploading, error, clearError: () => setError(null) };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / 1024 / 1024).toFixed(1).replace(".", ",")} Mo`;
}
