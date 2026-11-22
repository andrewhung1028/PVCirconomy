# Recycling estimate integration

## Surface and scope

`/recycling-estimate/` is an Operate surface for waste-panel owners to describe one panel model per batch, inspect a processing estimate, choose delivery preferences, and prepare an estimate reference or downloadable worksheet. Its entry point is `app/recycling-estimate/page.tsx`; the client interaction and scoped styling live in `app/components/recycling-quote.tsx` and `app/components/recycling-quote.css`.

This is an ordinary extension of the existing website. The incumbent `Shell` in `app/components/marketing.tsx` supplies site navigation, announcement, footer, and the main-content structure. Existing marketing CSS remains the visual authority; this document does not establish a new design system or global tokens.

## Inherited presentation and local treatment

The page inherits the site's Arial/Helvetica/sans-serif typography, white background, responsive centered `pc-wrap` gutters, and shared shell. The estimate limits its content width to 1,280px and uses a two-column form/summary layout, collapsing to one column at 760px. Its local heading hierarchy uses a 40–72px title and 27px section headings rather than the larger marketing display sizes.

Local dark green (`#154d32`) identifies totals, primary actions, selection and keyboard focus; a pale green (`#edf4e9`) summary panel distinguishes the estimate from form inputs. These values belong to this surface. Rounded fields, bordered delivery options, numbered section links, explicit labels and status messages support task completion. The shared assistant bar is hidden on this route to keep the form controls accessible.

## Price and transaction boundaries

`lib/recycling-quote.ts` recognizes only three complete-panel examples: 300 × 350 W at $9/panel ($2,700), 150 × 450 W at $15/panel ($2,250), and 7,000 × 275 W at $0.16/lb ($50,400 using 45 lb/panel). It does not interpolate other quantities, wattages or conditions; those require rate confirmation.

The complete-panel benefit is already reflected in these examples. No additional 15% is deducted because its calculation basis is unresolved. Missing-component percentages are disclosed without assuming adjusted totals; broken-panel rates and a complete commercial schedule remain pending. There is no separate double-glass surcharge. Transport is quoted separately and tax requires confirmation. Trailer estimates exclude packaging; final billing uses actual scale weight including pallets and packaging. Batch scheduling, minimum volumes and availability require agreement.

Saving an estimate does not issue a formal quote, book a delivery, request pickup, take payment or submit a contact request. Downloads are local worksheets. Prices are processing estimates in USD for the United States; a ZIP code does not establish pickup coverage.

## Model lookup, photos and server integration

The UI offers database model search and manual specification entry. Search returns verified model rows only; no fabricated model catalogue is seeded. Selecting a match fills the description and wattage and still asks the user to verify the label. Photos are browser-only previews, restricted to JPEG/PNG/WebP up to 10 MB; they are neither uploaded nor analyzed. Photo AI recognition is not connected.

The Next.js Node runtime is intended for Vercel with the retained `` base path:

- `GET /api/panel-models/?q=…` searches verified records in `pv_panel_models`.
- `POST /api/estimates/` validates an anonymous snapshot, recalculates the processing estimate on the server and stores it in `pv_estimates`, returning a reference. Photos are excluded. A same-origin check and request limits are present; they do not provide authentication.

Both paths depend on server-only `DATABASE_URL` and the schema in `server/db/schema.sql`. Database configuration is currently pending; no live database read/write validation or Vercel publication is established by this integration record. Missing or unavailable database connections return an unavailable response. The UI retains entries, supports manual specifications, and offers worksheet download when saving fails. Setup and subsequent live checks are described in `docs/vercel-neon-setup.md`.

## Evidence and existing drift

Checked `PRODUCT.md`, the route and quote component/CSS, shared Shell and marketing CSS, `lib/recycling-quote.ts`, both API handlers, `server/db/client.ts`, `server/db/schema.sql`, `next.config.ts`, the pricing policy and Vercel setup notes. This is a source-level integration record, not a browser or live-database verification report.

`PRODUCT.md` still describes a static export and local-only estimate interactions, while the current Next.js configuration and new API paths support a server runtime and conditional estimate persistence. The pricing policy's earlier model/AI planning paragraph predates the new database search implementation; AI recognition remains unavailable. These existing context differences are recorded here without changing product or design authority.
