import { NextResponse, type NextRequest } from "next/server";
import { getDaySlots, getMonthAvailability } from "@/lib/booking/engine";
import { isValidDateString } from "@/lib/time";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * GET /api/disponibilites?service=<id>&mois=2026-10   -> days with availability
 * GET /api/disponibilites?service=<id>&date=2026-10-05 -> free time slots
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const serviceId = params.get("service") ?? "";
  const month = params.get("mois");
  const date = params.get("date");
  const headers = { "Cache-Control": "no-store" };

  if (!UUID.test(serviceId)) {
    return NextResponse.json({ error: "Service invalide." }, { status: 400, headers });
  }

  try {
    if (date) {
      if (!isValidDateString(date)) return NextResponse.json({ error: "Date invalide." }, { status: 400, headers });
      const result = await getDaySlots(serviceId, date);
      if (!result) return NextResponse.json({ error: "Service indisponible." }, { status: 404, headers });
      return NextResponse.json(result, { headers });
    }
    if (month && /^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      const [y, m] = month.split("-").map(Number);
      const result = await getMonthAvailability(serviceId, y, m);
      if (!result) return NextResponse.json({ error: "Service indisponible." }, { status: 404, headers });
      return NextResponse.json(result, { headers });
    }
    return NextResponse.json({ error: "Paramètres manquants." }, { status: 400, headers });
  } catch (err) {
    console.error("[disponibilites]", err);
    return NextResponse.json({ error: "Les disponibilités n'ont pas pu être chargées." }, { status: 500, headers });
  }
}
