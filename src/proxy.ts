import { NextResponse, type NextRequest } from "next/server";
import { PUBLIC_ADMIN_PATHS, SESSION_COOKIE } from "@/lib/auth/constants";

/**
 * Optimistic protection of /admin: redirects visitors without a session cookie to the
 * login page. The session itself is verified against the database in the admin layout
 * and in every server action (see requireAdmin()).
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublicAdminPath = PUBLIC_ADMIN_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);

  if (!isPublicAdminPath && !hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/connexion";
    url.search = pathname !== "/admin" ? `?suite=${encodeURIComponent(pathname)}` : "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/admin"],
};
