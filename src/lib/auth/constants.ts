/** Name of the admin session cookie (strictly necessary cookie, only set on /admin login). */
export const SESSION_COOKIE = "leas_admin_session";
export const SESSION_DURATION_DAYS = 14;
/** Admin routes reachable without being signed in. */
export const PUBLIC_ADMIN_PATHS = ["/admin/connexion", "/admin/mot-de-passe-oublie", "/admin/reinitialiser"];
