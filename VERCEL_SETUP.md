# FarmSetu — GitHub and Vercel setup

1. Extract this ZIP. Do not upload the ZIP itself to GitHub.
2. Run `npm ci` and `npm run build` locally; fix any errors before deployment.
3. Create a GitHub repository `farmsetu`, and push project source files (never `.env` or `node_modules`).
4. In Vercel, import the GitHub repository; use the build command `npm run build` and the output configuration appropriate to this TanStack Start/Vite app. Verify server-side runtime compatibility rather than assuming a static SPA deployment.
5. Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in Vercel environment variables.
6. Review and apply pending Supabase migrations carefully after backing up the database.
7. Verify authentication, product listing, role-based order visibility, group-order lifecycle, and mobile navigation before production use.
8. Payment integration is not implemented; do not accept real payments until provider-side creation and webhook verification are complete.

Navigation: Home, Marketplace, Group Buying, Crop Recommendation, Soil Test, Dashboards, Overview, How It Works, About.
