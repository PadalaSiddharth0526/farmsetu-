# CrowdQuote

Community group-buying marketplace connecting agricultural producers and buyers. Includes marketplace, farmer tools, community procurement, admin overview, and interactive dashboards.

## Run locally

1. Install Node.js and run `npm install`.
2. Configure a local `.env` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` for your Supabase project. Never commit secrets.
3. Apply the SQL migrations in `supabase/migrations/` to the intended Supabase project in chronological order.
4. Run `npm run dev`.
5. Run `npm run build` before deployment.

## Deployment

Configure environment variables in the hosting provider and verify TanStack Start compatibility with the deployment target. Test authentication, row-level security, farmer quotations, buyer groups, and dashboard data before release.

## Status

Portfolio/demo project. Payment, fulfilment, farmer verification and production deployment require further verification or implementation. Dashboard figures should only be treated as live performance metrics when sourced from real production data.
