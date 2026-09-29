import "server-only";
import { mkdir, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Media storage abstraction.
 *  - "supabase" (production): files go to a public Supabase Storage bucket; the browser
 *    uploads directly with a signed URL, so large photos never transit through a Vercel
 *    function (which is limited to 4.5 MB per request).
 *  - "local" (development only): files are written to /public/uploads.
 *  - Photos committed in /public/images are registered by the seed (storage key "static/…")
 *    and served directly by Vercel; they need no storage service.
 *
 * To add another provider (e.g. Cloudinary), implement `StorageDriver`
 * (signed/unsigned direct upload URL + public URL + delete) and select it in getStorage().
 */
export interface UploadTarget {
  key: string;
  uploadUrl: string;
  /** "supabase-signed" => PUT multipart like supabase-js, "local" => PUT raw body */
  kind: "supabase-signed" | "local";
}

export interface StorageDriver {
  readonly name: "supabase" | "local";
  createUploadTarget(key: string): Promise<UploadTarget>;
  publicUrl(key: string): string;
  exists(key: string): Promise<boolean>;
  remove(key: string): Promise<void>;
  /** Server-side upload (used by the local upload route). */
  put?(key: string, body: Buffer): Promise<void>;
}

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "media";

class SupabaseStorage implements StorageDriver {
  readonly name = "supabase" as const;
  private client: SupabaseClient;
  constructor(url: string, serviceKey: string) {
    this.client = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  async createUploadTarget(key: string): Promise<UploadTarget> {
    const { data, error } = await this.client.storage.from(BUCKET).createSignedUploadUrl(key);
    if (error || !data) throw new Error(`Supabase Storage: ${error?.message ?? "URL indisponible"}`);
    return { key, uploadUrl: data.signedUrl, kind: "supabase-signed" };
  }
  publicUrl(key: string) {
    return this.client.storage.from(BUCKET).getPublicUrl(key).data.publicUrl;
  }
  async exists(key: string) {
    const dir = key.split("/").slice(0, -1).join("/");
    const name = key.split("/").pop()!;
    const { data } = await this.client.storage.from(BUCKET).list(dir, { search: name, limit: 1 });
    return Boolean(data?.some((f) => f.name === name));
  }
  async remove(key: string) {
    await this.client.storage.from(BUCKET).remove([key]);
  }
}

const LOCAL_ROOT = path.join(process.cwd(), "public", "uploads");

class LocalStorage implements StorageDriver {
  readonly name = "local" as const;
  private resolve(key: string) {
    const target = path.resolve(LOCAL_ROOT, key);
    if (!target.startsWith(LOCAL_ROOT + path.sep)) throw new Error("Chemin invalide");
    return target;
  }
  async createUploadTarget(key: string): Promise<UploadTarget> {
    return { key, uploadUrl: `/api/admin/medias/televersement-local?key=${encodeURIComponent(key)}`, kind: "local" };
  }
  publicUrl(key: string) {
    return `/uploads/${key}`;
  }
  async exists(key: string) {
    try {
      await stat(this.resolve(key));
      return true;
    } catch {
      return false;
    }
  }
  async remove(key: string) {
    try {
      await unlink(this.resolve(key));
    } catch {
      /* already gone */
    }
  }
  async put(key: string, body: Buffer) {
    const target = this.resolve(key);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, body);
  }
}

let driver: StorageDriver | null = null;

export class StorageNotConfiguredError extends Error {
  constructor() {
    super("Stockage des images non configuré (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).");
  }
}

export function getStorage(): StorageDriver {
  if (driver) return driver;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const wanted = process.env.STORAGE_DRIVER;
  if (wanted !== "local" && url && key) {
    driver = new SupabaseStorage(url, key);
  } else if (!process.env.VERCEL) {
    driver = new LocalStorage();
  } else {
    throw new StorageNotConfiguredError();
  }
  return driver;
}

/** Files shipped with the code in /public (registered by the seed) are never deleted. */
export function isBundledKey(key: string): boolean {
  return key.startsWith("static/");
}

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];
export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

export function extensionFor(mime: string): string {
  return { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif", "image/gif": "gif" }[mime] ?? "bin";
}
