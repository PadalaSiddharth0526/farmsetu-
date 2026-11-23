# FarmSetu V1 release candidate

This source package includes the existing V1 application, catalogue, public Overview, analytics dashboards, predefined scenario metrics and illustrative user profiles.

**Data integrity:** Scenario charts and example profiles are not actual orders, registered customers, verified inventory, or earned revenue. Supabase-backed activity is kept distinct.

**Build status:** This package has not passed `npm ci && npm run build` in this environment. The latest Vercel deployment failed while resolving the TanStack Start `router` entry. Do not assume this package is deployable until that error is resolved on the exact GitHub commit.

**Deploy:** Upload the contents of this `farmsetu-main` directory (not its parent folder) to the GitHub repo. Ensure `src/router.ts` exists in the repository root's `src/` folder, and configure Vercel Root Directory to the folder containing `package.json`. Set required Supabase environment variables in Vercel without committing secrets. Verify the production build and site before deleting any prior deployment.
