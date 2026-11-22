# Business Case Hub — Phase 1

Implemented in `www` on `feature/business-case-hub`, 2026-11-22. The sibling `businesscase` checkout remains unchanged. Nothing was pushed or deployed. No production database, Microsoft Graph, Apollo, paid service, or Vercel command was used.

## Changes and files

- `/business-case`: server-rendered source label and ported interactive calculator, comparison tables, methodology, and follow-up form. `app/business-case/{page.tsx,calculator.tsx,calculator.css,methodology/page.tsx}`. Public desktop/mobile navigation links are in `app/components/public-header.tsx`. Calculator sections opt out of the main site's section-snapping behavior.
- `lib/business-case/calculator/engine.ts`, `fallback.ts`, `report-time.ts`, `supported-countries.ts`, and `business-case-pdf.ts` were copied from the reference. Engine, fallback, and PDF generator were checked byte-for-byte. Calculation formulas were not edited. `types.ts` only broadens the source-label type. `input.ts` validates public requests without changing formulas.
- `/api/calculator-data` and `/api/calculate` read the active published version on the server. `lib/business-case/master-data.ts` delegates to `server/business-case/store.ts`; unavailable, missing, or invalid database data falls back to the bundled seed. Labels are `Published master vX` and `Built-in fallback`. No SharePoint data loader was copied.
- `server/business-case/workbook.ts` exports, parses, validates, and diffs seven-sheet Excel workbooks. Sheet names and canonical headers follow the fields consumed by the reference SharePoint loader. Exact headers, typed cells, unique keys, foreign references, rates, nonnegative amounts, positive FX/capacity, required OPEX, and engine usability are validated. Formulas and rich object cell values are rejected. Uploads over 3,000,000 bytes are rejected. The seventh sheet, `Payable`, stores `Material`, `Route/Solution`, `Payable %`, `Source`, and `Note`; it is never read by the engine. Payable uses 0–100; engine rate columns use 0–1. Nullable benchmark/recovery fields remain nullable.
- `/admin/system` includes `Business Case 主檔`, implemented by `app/components/business-case-admin.tsx`. Download current/seed/previous workbooks; upload a validation draft; inspect cell differences; publish explicitly; inspect numbered version history; restore a historical version as a new version. Restores preserve history and use the current `expectedVersion`.
- `app/api/admin/business-case-data/{route.ts,import/route.ts,export/route.ts}` enforce full-admin access. Publish and restore compare `expectedVersion` under the singleton row lock; stale requests return HTTP 409. Historical versions retain their IDs, data, actor, timestamp, and note.
- `/api/follow-up` persists contact, intent, calculation, and timezone in Neon before attempting mail. Totals and assumptions are recalculated from validated inputs rather than trusting submitted totals. Mail-disabled submissions are stored and return `emailStatus: not_configured`. The existing reference email copy and PDF/brochure attachments are retained in `lib/business-case/business-case-email.ts`. `graph.ts` and `graph-mail.ts` use www's Microsoft configuration, mail flag, and administrator-selected sender from `server/delivery/communications.ts`, including upload sessions for the existing brochure exceeding 3 MB. No Apollo synchronization is performed.
- `server/auth/roles.ts` is the single role map. Andrew is admin; Terry and both Emily addresses are quotation/order viewers; all other staff are denied. Matching is case-insensitive. Existing allowed sign-in domains remain unchanged. The Microsoft session exposes `adminRole`; all admin API handlers call `adminAccess` before data access. `proxy.ts` protects admin pages server-side. Navigation and order mutation controls reflect the role. Microsoft login/callback route viewers to orders. Staff outside the role map receive HTTP 403 on admin pages/APIs.
- `data/business-case/seed-v1.xlsx` is the generated initial workbook. Public calculator assets are bundled under `public/business-case`. The existing brochure was preserved.
- Added test dependencies: PGlite (isolated PostgreSQL engine) and Playwright. Added production dependency: `pdf-lib`. Next.js was not upgraded.

## Migration and initialization

`server/db/business-case-phase1.sql` is the standalone idempotent migration. The same statements are appended to `server/db/schema.sql` for the existing `server/db/migrate.mjs` workflow. Apply one migration path when the operator is ready; neither was run against a real database during this task.

Tables:

| Table | Purpose |
| --- | --- |
| `pv_business_case_versions` | UUID ID, integer version, JSONB master data, creator, creation time, note |
| `pv_business_case_active` | One boolean singleton row pointing to the active version |
| `pv_business_case_followups` | UUID/reference, JSONB submission snapshot, creation time, email status |

The migration inserts fallback-derived version 1 and its active pointer only if absent. Reapplying it preserves existing versions and the active pointer. Seed v1 has exactly one operating region (California), three solutions, eight OPEX rows, one FX row, nine materials, 27 recovery rows, and an empty Payable sheet. No additional regions or commercial assumptions were invented.

Published master data is USD/local-currency data exactly as represented by the reference engine. The parser validates a complete dataset; the template is prefilled seed data rather than an unusable empty workbook. Download the current workbook before editing an established master.

## Environment variables

Names only; use the existing configuration mechanism and never commit environment files:

- `DATABASE_URL`
- `AUTH_SECRET`
- `AUTH_ORIGIN`
- `MICROSOFT_TENANT_ID`
- `MICROSOFT_CLIENT_ID`
- `MICROSOFT_CLIENT_SECRET`
- `MICROSOFT_MAIL_ENABLED`

The existing administrator-managed Microsoft sender is reused. No new SharePoint, Apollo, or separate business-case sender variable is needed. Mail attachments use the existing Microsoft application's configured mailbox and permissions; large attachment upload sessions require the permissions described by the retained reference transport. Actual tenant permissions and delivery remain unverified because production Graph access was prohibited.

## Verification results

- `npm ci --cache /tmp/pvc-npm-cache`: passed after the default cache was denied by the sandbox. Final lockfile installation succeeded (245 packages). Runtime here is Node 26.10.0; the project declares Node 24.x, so npm emitted an engine warning. npm reported 3 advisories (2 moderate, 1 critical); no automatic dependency upgrades were applied.
- `npm run typecheck`: passed.
- `npm run lint`: attempted; existing `next lint` script fails because Next.js 16 does not implement that command (`Invalid project directory ... /lint`). No lint configuration/toolchain was introduced solely to mask this existing issue.
- `node tests/business-case.cjs`: passed. All 6 reference scenarios (1 region × 3 solutions × 2 volumes) match across 3,140 numeric comparisons, including altered Payable datasets. Allowed tolerance is $1; actual difference is zero. Workbook/seed round trips, seven sheets, eight rejection cases, cell diff, and 80 role-policy checks pass.
- `node tests/business-case-store.cjs`: passed using disposable in-memory PGlite only. Applied the migration twice; verified one seed version, published v2, rejected a stale version, restored as v3, tested competing publishers and immutable history, and exercised real API 409/400/201 responses. The real follow-up handler stores a recalculated snapshot with mail disabled and never invokes the mail transport.
- `node tests/business-case-auth.mjs`: passed, 122 local HTTP checks. Covers admin/viewer/denied classes, both Emily addresses, mixed-case admin, every admin API resource, write denial, admin pages, fallback source, valid/invalid public calculations, and follow-up validation. Local HTTP test servers have no database credentials and disable mail.
- `npm run test:business-case`: passed (three suites above).
- Existing non-browser suites passed: `batch-quote.cjs`, `pickup-policy.cjs`, `quotation-email.cjs`, `pricing-auth.mjs`. The latter now uses the explicitly authorized Andrew account for admin tests.
- Eight existing browser suites were attempted but blocked by their environment-specific Playwright module path or missing browser runtime. The new `business-case-ui.cjs` covers 1440/390px calculation, overflow, JS errors, upload/diff/publish/restore. It was attempted with installed Chrome but the sandbox aborted browser launch (SIGABRT/EPERM). The computer-use browser host was also unavailable. No visual-QA pass is claimed. Run `npm run test:business-case:ui` with a usable Playwright browser; `PV_TEST_BROWSER_PATH` optionally selects an installed browser.
- Existing `delivery-integration.cjs` was attempted but could not connect to its disposable local PostgreSQL service at port 55432. That service is not installed/running here. New master-data SQL tests do not depend on it.
- `next build`: compilation, TypeScript, and generation of 54 static pages pass. Some completed builds then exited with the prescribed Next.js security-upgrade nudge; retrying the same build completed successfully. Next.js remains 16.4.0. No security upgrade was run, as explicitly required by the task.
- `git diff --check`: passed. Reference checkout status remained clean. Engine, fallback, and PDF generator compare equal to the reference files.

## Open issues and local commits

Implementation and the executable local suites are ready for operator review. Real Neon migration execution, real Microsoft permission/delivery checks, and deployment were intentionally not performed. Visual browser verification and the legacy delivery integration suite remain environment-blocked as described above.

**No commits could be created.** The current session grants read-only access to `www/.git`. Both `git add` and `git commit` failed before mutation with `Unable to create .../.git/index.lock: Operation not permitted`. The branch remains `feature/business-case-hub`; `main` was untouched, and nothing was pushed. Files remain in the working tree.

Suggested small logical commit subjects once Git metadata is writable:

1. `Enforce staff admin and quotation/order viewer roles`
2. `Port business-case calculator and persisted follow-up workflow`
3. `Add versioned business-case workbook administration and seed migration`
4. `Verify business-case parity, role boundaries and local persistence`

Review all working-tree changes before staging. This document records the actual uncommitted state and does not claim commit hashes that do not exist.

## Fix round 1: local verification

Run `npm run typecheck`, then `npm run build` before `npm run test:business-case`
and `npm run test:business-case:ui`. The authentication and browser tests start
`next start` and require the production build. A local Playwright Chromium install
(or `PV_TEST_BROWSER_PATH`) is required. Tests use local adapters and disable mail;
no production database or Graph connection is needed.

`node scripts/business-case-seed.cjs` regenerates fallback and both SQL initial
seeds from `data/business-case/seed-v1.xlsx`. The seed is the verified 71-region
v1 workbook; migrations do not overwrite an existing published version.
`tests/fixtures/parity-live-responses.json` contains the 225 captured live cases
from 2026-11-22; parity tests replay them offline with a numeric tolerance of $1.
The obsolete `next lint` script was removed (no ESLint dependency/configuration).
