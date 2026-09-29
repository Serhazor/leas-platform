/**
 * DEMO MODE — the admin is reachable WITHOUT logging in.
 *
 * ⚠️ Temporary, for the demo only. Anyone who knows the /admin URL can edit the site and
 * see the bookings. Before real use, either:
 *   - set the environment variable ADMIN_OPEN_ACCESS=false in Vercel, or
 *   - change DEFAULT_OPEN below to false.
 */
const DEFAULT_OPEN = true;

export function isAdminOpenAccess(): boolean {
  const v = process.env.ADMIN_OPEN_ACCESS;
  if (v === "false" || v === "0") return false;
  if (v === "true" || v === "1") return true;
  return DEFAULT_OPEN;
}

export const DEMO_ADMIN_EMAIL = "demo@demo.invalid";
