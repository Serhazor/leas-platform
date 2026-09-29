import { NextResponse, type NextRequest } from "next/server";
import { getCurrentAdmin } from "@/lib/auth/session";
import { getStorage, MAX_UPLOAD_BYTES } from "@/lib/storage";

/** Development-only upload endpoint used when STORAGE_DRIVER=local. */
export async function PUT(request: NextRequest) {
  const storage = getStorage();
  if (storage.name !== "local" || !storage.put) {
    return NextResponse.json({ error: "Indisponible." }, { status: 404 });
  }
  if (!(await getCurrentAdmin())) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  const key = request.nextUrl.searchParams.get("key") ?? "";
  if (!/^\d{4}\/\d{2}\/[a-z0-9-]+\.[a-z]+$/.test(key)) return NextResponse.json({ error: "Clé invalide." }, { status: 400 });
  const body = Buffer.from(await request.arrayBuffer());
  if (body.length > MAX_UPLOAD_BYTES) return NextResponse.json({ error: "Fichier trop lourd." }, { status: 413 });
  await storage.put(key, body);
  return NextResponse.json({ ok: true });
}
