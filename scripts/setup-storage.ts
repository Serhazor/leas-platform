/**
 * Creates (or updates) the public Supabase Storage bucket used by the media library.
 * Usage: npm run storage:setup
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
 */
import { config } from "dotenv";
config({ path: [".env.local", ".env"], quiet: true });
import { createClient } from "@supabase/supabase-js";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "media";
  if (!url || !key) {
    console.error("✗ NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY doivent être définis.");
    process.exit(1);
  }
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const options = {
    public: true,
    fileSizeLimit: "15MB",
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"],
  };
  const { data: existing } = await supabase.storage.getBucket(bucket);
  const { error } = existing
    ? await supabase.storage.updateBucket(bucket, options)
    : await supabase.storage.createBucket(bucket, options);
  if (error) {
    console.error("✗ Erreur :", error.message);
    process.exit(1);
  }
  console.log(`✓ Espace de stockage « ${bucket} » prêt (public, 15 Mo max, images uniquement).`);
}

main();
