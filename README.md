# Leas — plateforme web

Bespoke French website + lightweight business back-office for an independent
professional-services business (états des lieux, conciergerie, assistance
administrative et commerciale — événementiel à venir).

- **Public site (French):** home, services (dynamic, SEO URLs), États des lieux,
  À propos, Comment ça marche, FAQ, Contact, online booking, legal pages.
- **Admin (`/admin`, French):** dashboard, bookings (list + calendar), availability,
  contact enquiries, services & categories, page content, FAQ, media library,
  settings (identity, branding, booking rules, SEO, e-mails, legal info, access).

| Documentation | |
| --- | --- |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Supabase + Vercel production setup, step by step |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Technical decisions, data model, booking engine, extension points |
| [docs/GUIDE-ADMINISTRATION.md](docs/GUIDE-ADMINISTRATION.md) | Guide d'utilisation de l'administration (en français, pour la propriétaire) |
| [public/images/README.md](public/images/README.md) | Photos livrées avec le code |

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind CSS 4 ·
PostgreSQL (Supabase) via Drizzle ORM · Supabase Storage · Resend (e-mails) · Vercel.

## Quick start (local)

Requirements: Node.js ≥ 20.9 and a PostgreSQL database (a free Supabase project, or a local Postgres ≥ 14).

```bash
npm install
cp .env.example .env.local        # then fill DATABASE_URL at minimum
# local Postgres example: DATABASE_URL=postgres://postgres@localhost:5432/leas
# for local image uploads without Supabase: STORAGE_DRIVER=local

npm run db:setup                  # migrations + French seed content
npm run admin:create -- --email=vous@exemple.fr --name="Prénom Nom" --password="UnMotDePasse2026"
npm run dev                       # http://localhost:3000  — admin: /admin
```

Without `RESEND_API_KEY`, e-mails are printed in the terminal instead of being sent.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js |
| `npm run typecheck` · `npm run lint` · `npm test` | TypeScript, ESLint, Vitest unit tests (`npm run check` runs all three) |
| `npm run db:generate` | Generate a new SQL migration after editing `src/db/schema.ts` |
| `npm run db:migrate` | Apply pending migrations (`/drizzle`) |
| `npm run db:seed` | Insert initial French content + register photos from `public/images` (idempotent, never overwrites edits) |
| `npm run db:setup` | `db:migrate` + `db:seed` |
| `npm run admin:create -- --email=… --name=… [--password=…]` | Create an admin account (or reset its password). The only way to create the first account — there is no public registration. |
| `npm run storage:setup` | Create/update the public Supabase Storage bucket for the media library |

## Environment variables

See [.env.example](.env.example) for the full, commented list.

| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | yes (prod) | Public URL, used for canonical URLs, sitemap, e-mail links |
| `DATABASE_URL` | yes | Postgres connection (Supabase **transaction pooler**, port 6543, on Vercel) |
| `DATABASE_URL_DIRECT` | no | Session/direct connection for migrations & seed (falls back to `DATABASE_URL`) |
| `NEXT_PUBLIC_SUPABASE_URL` | for uploads | Supabase project URL (Storage + image domain allow-list) |
| `SUPABASE_SERVICE_ROLE_KEY` | for uploads | Server-only key used to sign upload URLs |
| `SUPABASE_STORAGE_BUCKET` | no | Default `media` |
| `AUTH_SECRET` | yes | Random secret (≥ 32 chars) |
| `CRON_SECRET` | yes (prod) | Protects `/api/cron/nettoyage` (Vercel Cron sends it automatically) |
| `RESEND_API_KEY` | for e-mails | Resend API key |
| `EMAIL_FROM` | for e-mails | Sender on a verified domain, e.g. `Leas <notifications@votre-domaine.fr>` |
| `STORAGE_DRIVER` | no | `local` = write uploads to `public/uploads` (development only) |

## Project structure

```
drizzle/                 SQL migrations (generated + custom constraints/RLS lock-down)
scripts/                 migrate, seed, create-admin, setup-storage
public/images/           optional photos shipped with the code (see README inside)
src/
  app/(site)/            public pages (French URLs)
  app/admin/(auth)/      login, forgot/reset password
  app/admin/(panel)/     back-office (protected)
  app/api/               availability API, cron, local upload (dev)
  components/ui|site|admin
  db/                    schema.ts (source of truth), seed-data.ts (initial French copy)
  lib/
    actions/             server actions (public forms + admin/*)
    auth/                password hashing, sessions
    booking/             slot engine (pure + DB), status labels
    calendar/            calendar-sync extension point (Google Calendar later)
    content/registry.ts  editable page structure (labels shown in the admin)
    data/                read queries (public cached pages, admin)
    email/               provider abstraction (Resend) + French templates
    storage/             media storage abstraction (Supabase / local; Cloudinary-ready)
  proxy.ts               /admin guard (Next.js 16 "proxy", ex-middleware)
```

## Quality gates

`npm run check` (typecheck + lint + tests) and `npm run build` pass. The build also
succeeds without any database configured (pages then render an empty state), so a
first Vercel deployment never fails because of missing variables.
