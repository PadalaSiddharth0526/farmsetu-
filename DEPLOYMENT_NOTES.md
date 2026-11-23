# CrowdQuote deployment and group-order workflow

## Implemented
- Overview uses live Supabase `products` inventory (not hard-coded samples) and authorized `group_orders` records, with filters for Placed, Confirmed, Packed, Dispatched, In Transit, Delivered, Cancelled.
- Signed-in group members can place one order per group against a full-quantity farmer quotation; price and identity are computed server-side by `place_group_order`.
- `advance_group_order` enforces authorized supplier/admin updates in order, and blocks dispatch until payment is verified.
- Existing group buying, dashboards and other routes remain.

## Required before launch
1. Apply `supabase/migrations/20261120203000_group_order_lifecycle.sql` **after** earlier migrations to the correct Supabase project. Back up production data first.
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in your deployment environment. Never commit `.env` or secret/service-role keys.
3. Configure a real payment provider (e.g. Razorpay) with a server-side order creation endpoint and a **signature-verified webhook** to set payment_status=`paid`. **This is not implemented**; the UI truthfully shows Payment Pending. Do not collect money or mark orders paid manually.
4. Implement shipping tracking details, refund/cancellation policies, inventory reservation across groups, and fulfillment notifications before accepting real customers.
5. Verify provider compatibility with TanStack Start SSR on Vercel; test `npm ci`, `npm run build`, and preview deployment. Existing uploaded node_modules were Windows-generated and were intentionally excluded.
6. Review public RLS policies, test buyer/farmer/admin roles and duplicate/concurrent orders before production.

## Known limitations
- Dashboard source has pre-existing TypeScript errors; `tsc --noEmit` is not currently clean.
- Build could not be verified in the provided runtime because the uploaded `node_modules` contains platform-incompatible native Rolldown bindings. Run a clean install on your own machine/CI.
- Group orders and ordinary marketplace orders are separate flows; Overview currently tracks group orders only.
- Orders do not automatically advance to Dispatched/Delivered without verified payment and a supplier/admin workflow. Payment is not yet live.
