# Production deployment (Supabase + Vercel)

> **Quick demo without Supabase?** See [Demo on Vercel only (Neon)](#demo-on-vercel-only-neon) at the end.

Estimated time: 30–45 minutes. Everything below uses free tiers except where noted.

## 1. Supabase (database + image storage)

1. Create a project on <https://supabase.com>. **Choose an EU region** — *West EU (Paris)*
   `eu-west-3` is ideal (RGPD, and it matches the Vercel region `cdg1` configured in `vercel.json`).
2. Keep the database password.
3. **Project Settings → Database → Connection string**:
   - *Transaction pooler* (port **6543**) → `DATABASE_URL` (used by the app on Vercel);
   - *Session pooler* (port **5432**) → `DATABASE_URL_DIRECT` (used for migrations).
4. **Project Settings → API**: copy the *Project URL* → `NEXT_PUBLIC_SUPABASE_URL` and the
   *service_role* secret → `SUPABASE_SERVICE_ROLE_KEY` (server-side only).
5. Authentication is **not** provided by Supabase Auth (see ARCHITECTURE.md); nothing to configure there.

> Free Supabase projects pause after 7 days without any activity. A live site (and the daily
> cron job) keeps it active; upgrade to Pro for a guarantee.

## 2. Initialise the database (from your computer)

```bash
cp .env.example .env.local     # fill DATABASE_URL, DATABASE_URL_DIRECT, Supabase keys
npm install
npm run db:setup               # tables, constraints, security lock-down, French content
npm run storage:setup          # public "media" bucket (images only, 15 MB max)
npm run admin:create -- --email=proprietaire@votre-domaine.fr --name="Prénom Nom"
```

`admin:create` prints a generated password if you omit `--password`. Give it to the owner;
she can change it in **Mon compte**.

The migration `0001_security_and_constraints.sql` enables Row Level Security with no policy on
every table and revokes access from Supabase's `anon`/`authenticated` roles: the public Supabase
Data API cannot read or write any data. Only the server (direct Postgres connection) can.

## 3. E-mails (Resend)

1. Create an account on <https://resend.com> and **verify your domain** (DNS records).
2. Create an API key → `RESEND_API_KEY`.
3. `EMAIL_FROM=Leas <notifications@votre-domaine.fr>` (address on the verified domain).
4. After deployment, use **Admin → Paramètres → E-mails → Envoyer un e-mail de test**.

Without these variables the site works but notifications are only written to the logs.

## 4. Vercel

1. Push the repository to GitHub/GitLab/Bitbucket.
2. <https://vercel.com/new> → import the repository. Framework preset: **Next.js** (auto-detected).
   No build setting to change.
3. **Environment Variables** (Production + Preview):

   | Name | Value |
   | --- | --- |
   | `NEXT_PUBLIC_SITE_URL` | `https://www.votre-domaine.fr` |
   | `DATABASE_URL` | transaction pooler URL (port 6543) |
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` |
   | `SUPABASE_SERVICE_ROLE_KEY` | service role secret |
   | `AUTH_SECRET` | `openssl rand -base64 32` |
   | `CRON_SECRET` | `openssl rand -base64 32` |
   | `RESEND_API_KEY` | Resend key |
   | `EMAIL_FROM` | `Leas <notifications@votre-domaine.fr>` |

4. Deploy. The build prerenders the public pages from the database (ISR, refreshed every hour
   and immediately after every admin change).
5. **Domains**: add your domain in Vercel and update DNS as instructed. Update
   `NEXT_PUBLIC_SITE_URL` accordingly and redeploy.
6. **Cron**: `vercel.json` declares a daily job at 03:00 UTC calling `/api/cron/nettoyage`
   (RGPD retention: deletes enquiries older than 3 years, anonymises bookings 3 years after the
   appointment, purges expired sessions). Vercel automatically sends `CRON_SECRET`.
7. Plan: a commercial site should use **Vercel Pro** (Hobby is for non-commercial use).

`robots.txt` blocks indexing on Preview deployments automatically (`VERCEL_ENV`).

## 5. Future schema changes

```bash
# edit src/db/schema.ts
npm run db:generate -- --name=description_du_changement
npm run db:migrate           # against production with DATABASE_URL_DIRECT
```

Run migrations **before** deploying code that depends on them. New tables are covered by the
default-privilege revocation, but also add `ALTER TABLE … ENABLE ROW LEVEL SECURITY;` in the
migration for defence in depth.

## 6. Go-live checklist

- [ ] Admin → Paramètres: e-mail, téléphone, secteur d'intervention, réseaux sociaux
- [ ] Paramètres → Informations légales: dénomination, SIRET, directeur·rice de publication
- [ ] Paramètres → Apparence: logo, icône, couleurs
- [ ] Pages du site → À propos: photo, parcours, expérience, qualifications
- [ ] Disponibilités: horaires et congés; Paramètres → Réservations: mode et délais
- [ ] Services: prix (facultatif), photos, durées
- [ ] Relire la politique de confidentialité (prestataires, durées de conservation)
- [ ] E-mail de test reçu; une réservation de test de bout en bout
- [ ] Search Console: soumettre `https://www.votre-domaine.fr/sitemap.xml`

## Demo on Vercel only (Neon)

For a demo you don't need a Supabase account: a free Neon Postgres database can be created
from inside Vercel, and the deployment sets everything up by itself.

1. Vercel → your project → **Storage** → **Create Database** → **Neon (Serverless Postgres)** →
   free plan, region *Europe (Frankfurt)* → **Connect** to the project (all environments).
   Vercel adds `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `POSTGRES_URL`… automatically.
2. **Settings → Environment Variables**, add:
   - `ADMIN_EMAIL` and `ADMIN_PASSWORD` (≥ 10 characters, a letter and a digit) — the first admin account;
   - optionally `ADMIN_NAME`, `AUTH_SECRET`, `CRON_SECRET`, `NEXT_PUBLIC_SITE_URL`.
3. **Deployments → Redeploy** (or push a commit).

During the build, `npm run vercel-build` runs `scripts/vercel-prebuild.ts`: migrations, French
seed content (idempotent) and creation of the admin account if it doesn't exist yet. Nothing to
run from your computer.

Limits of this demo setup: uploading new images from the admin is disabled (a French notice
explains it); photos committed in `public/images/` still work. Enable uploads later by adding
the Supabase Storage variables (or a Cloudinary driver). E-mails are only logged until
`RESEND_API_KEY` is set.

### Open admin (demo mode)

For the demo, `/admin` is accessible **without logging in** (a banner says so).
This is controlled by `src/lib/auth/demo.ts`. Before real use, close it by setting
`ADMIN_OPEN_ACCESS=false` in Vercel (or `DEFAULT_OPEN = false` in that file) and redeploy;
normal login then applies (`ADMIN_EMAIL` / `ADMIN_PASSWORD` or `npm run admin:create`).
