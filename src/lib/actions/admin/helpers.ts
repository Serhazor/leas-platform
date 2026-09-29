import "server-only";
import { sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";

/** Refreshes every public page after a content change (ISR cache). */
export function revalidatePublic() {
  revalidatePath("/", "layout");
}

export function str(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v : "";
}

export function bool(formData: FormData, key: string): boolean {
  const v = formData.get(key);
  return v === "on" || v === "true" || v === "1";
}

export function nullableId(formData: FormData, key: string): string | null {
  const v = str(formData, key).trim();
  return /^[0-9a-f-]{36}$/i.test(v) ? v : null;
}

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type OrderedTable = "services" | "faqs" | "process_steps" | "service_categories";

/** Moves a row up or down in a manually ordered list and renumbers positions 1..n. */
export async function moveRow(table: OrderedTable, id: string, direction: "up" | "down") {
  const db = getDb();
  const rows = (await db.execute(
    sql`select id::text as id from ${sql.identifier(table)} order by position asc, created_at asc`,
  )) as unknown as { id: string }[];
  const ids = rows.map((r) => r.id);
  const i = ids.indexOf(id);
  const j = direction === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= ids.length) return;
  [ids[i], ids[j]] = [ids[j], ids[i]];
  await renumber(table, ids);
}

export async function renumber(table: OrderedTable, ids: string[]) {
  if (!ids.length) return;
  const values = sql.join(
    ids.map((rowId, index) => sql`(${rowId}::uuid, ${index + 1}::int)`),
    sql`, `,
  );
  await getDb().execute(
    sql`update ${sql.identifier(table)} as t set position = v.pos from (values ${values}) as v(id, pos) where t.id = v.id`,
  );
}

export async function nextPosition(table: OrderedTable): Promise<number> {
  const rows = (await getDb().execute(
    sql`select coalesce(max(position), 0) + 1 as next from ${sql.identifier(table)}`,
  )) as unknown as { next: number }[];
  return Number(rows[0]?.next ?? 1);
}
