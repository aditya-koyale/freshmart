# FreshMart

Fresh fruits delivered to your door — powered by Aditya Fruit Supplier.
Built against `FreshMart SRS v1.0` (Parts 1–12).

## Tech Stack

Next.js 14 (App Router) · TypeScript · Tailwind CSS · PostgreSQL · Prisma ·
NextAuth · Cloudinary · Google Maps API

## Project Status

Build proceeds phase by phase per the approved architecture document:

- [x] **Phase 0 — Foundation** (this delivery)
- [ ] Phase 1 — Core Catalog
- [ ] Phase 2 — Cart & Checkout
- [ ] Phase 3 — Orders & COD Payment
- [ ] Phase 4 — Admin Dashboard & Analytics
- [ ] Phase 5 — Polish & Production Readiness

## Local Setup

### 1. Prerequisites

- Node.js 18.18+
- A local PostgreSQL instance (or a free Neon/Supabase project)

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Fill in at minimum:
- `DATABASE_URL` — your Postgres connection string
- `NEXTAUTH_SECRET` — generate with `openssl rand -base64 32`
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` — credentials for the one seeded admin account

`CLOUDINARY_*` and `GOOGLE_MAPS_API_KEY` aren't required to run Phase 0, but
will be needed starting Phase 1 (product images) and Phase 2 (delivery
address lookup).

### 4. Set up the database

```bash
npm run prisma:migrate   # creates all v1 tables
npm run db:seed          # creates the single admin account + default settings
```

### 5. Run the dev server

```bash
npm run dev
```

Visit `http://localhost:3000` — you should see the FreshMart foundation
page confirming the design tokens, fonts, and Tailwind setup are working.

## Project Structure

See `FreshMart_Architecture_v1.md` (provided separately) for the full
folder structure, database design, and roadmap rationale.

## Notes on Version 1 Scope Decisions

- **Email verification** is intentionally skipped in v1. The `User` model
  and `authorize()` flow in `src/lib/auth.ts` have a marked extension point
  for adding it in Version 2 without breaking changes.
- **Order quantity**: no maximum beyond available stock; minimum purchasable
  unit is whatever weight variants the admin defines per product.
- **Database**: PostgreSQL/Prisma locally, compatible with Neon, Supabase,
  or Vercel Postgres — hosting choice deferred.
