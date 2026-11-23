# FarmSetu — Original V1 (Enhanced Recovery)

FarmSetu is a Telangana-focused farm-to-community procurement platform for agricultural produce, community bulk buying, farmer quotations, and marketplace analytics. This repository contains the **full original TanStack Start source code** with the enhanced dashboard and overview components, restored from the V1 recovery archive rather than replaced with a simplified application.

## Application
- Marketplace for rice, turmeric, red chillies, groundnuts, and other supported crops.
- Farmer onboarding, produce listings, stock and quotations.
- Community purchase groups, pack-size constraints, order lifecycle, and buyer journeys.
- Admin dashboard, analytics, public overview, and multilingual product support.
- Supabase schema and row-level security migrations under `supabase/migrations/`.

## Local development

Requires modern Node.js (22+ recommended). From the repository root:

```bash
npm ci
npm run dev
npm run build
```

Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` as appropriate for your Supabase instance. Never commit database passwords, secret or service-role keys, or genuine user credentials. Run the SQL migrations against the **intended** database environment after reviewing them.

## Vercel

The full original application is deployed at https://farmsetu-original-v1.vercel.app via the `farmsetu-original-v1` project, using `npm run build` and the TanStack Start/Lovable framework.

## Production verification

A passing Vercel build confirms deployment, not the integrity of live farmer accounts, payments, quotations or database transactions. Before any real pilot, test registration, confirmation emails, database migrations, row-level security, farmer profile ownership, group membership, quoting, order states, and analytics with authorized test users. Catalogue planning figures are not verified live sales or inventory.

## Source preservation

The full original archive, restoration scripts, and GitHub Actions unpack workflow are preserved on the `original-v1-restored` branch. This `main` branch holds the editable source directly, including image assets and SQL migrations.
