# Vercel + Neon deployment

The app uses the Next.js Node runtime at the domain root rather than a static export or subpath deployment. GitHub Pages automatic deployment is retired; Vercel runs `npm run build` with the Next.js preset on Node 24 (select Node 24 in project settings). Do not set the output directory to `out`.

## Configuration

1. Import the GitHub repository into Vercel. Choose Next.js and the repository root.
2. Set server-only `DATABASE_URL` in the relevant Vercel environments using the Neon connection string with TLS enabled. Never use a `NEXT_PUBLIC_` name or put it in source. Prefer a Neon development branch for local/preview and a production branch for production.
3. In this workspace, supply the same server-only variable through secure environment settings or an ignored `.env.local` file. Do not paste credentials into chat. The Cloud network policy may need your specific Neon endpoint hostname allowed.
4. Review `server/db/schema.sql`, then run `npm run db:migrate` against the intended database. The migration creates two PV-prefixed tables; it does not drop tables or modify existing rows. It is not run during build or automatically against production.
5. Run `npm run dev` or `npm run build && npm start`. Open the application at `/recycling-estimate/`.

## Data paths

- `GET /api/panel-models/?q=…` searches verified model records. No fabricated model data is seeded. Populate `pv_panel_models` from verified specifications with sources.
- `POST /api/estimates/` saves an anonymous estimate snapshot with panel count, watts, condition, model description, delivery method and ZIP. Prices are recalculated on the server; client-supplied totals are ignored. No public estimate-list API is exposed.
- Saved references are estimates, not accepted orders, scheduled pickups, formal quotes or contact requests. No contact workflow or AI recognition is implemented. Photos stay local.
- The current three-case price table remains intentionally limited until commercial tiers and the 15% benefit basis are confirmed.
- Request body and input limits and same-origin write checks are included. Configure platform traffic limits and monitoring before opening anonymous writes publicly; same-origin checks are not authentication or bot protection. Data retention and an authenticated staff workflow remain to be defined.

## Verify

After configuring the connection, initialize the schema, search a verified model, save an estimate in the UI, and confirm the returned reference in the intended Neon branch. Try an unavailable database: the UI must retain input and offer worksheet download without claiming success. No live Neon connection or Vercel publication is established by source changes alone.
