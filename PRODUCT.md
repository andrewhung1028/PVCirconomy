# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Owners of waste solar panels who need solar-panel recycling services. Prospective buyers of PV Circulator equipment are another audience; their specific roles and purchasing criteria remain open.

## Product Purpose

PV Circonomy provides waste solar-panel recycling services using PV Circulator equipment. It also serves as a sales channel for PV Circulator equipment developed in-house by its parent company, TSGC.

PV Circonomy aims to address a lack of transparency in solar-panel recycling by enabling customers to obtain recycling quotes directly online. This is a user-confirmed product goal; it does not establish that the current prototype provides binding commercial quotes.

## Positioning

The user identifies PV Circonomy as a DTSC-approved solar-panel recycler. TSGC develops PV Circulator equipment, and PV Circonomy combines operating the equipment for recycling services with selling it through its channel. These company and regulatory facts were supplied by the user; supporting regulatory documentation has not been verified in this project.

The user states that PV Circulator’s technical advantages enable PV Circonomy to pass substantial economic benefits to waste solar-panel owners through more favorable recycling pricing. This customer benefit is part of the intended positioning alongside transparent online quotes. The specific technical mechanism, cost basis, comparison baseline, and amount of savings have not yet been documented; do not invent savings percentages, guaranteed lowest prices, or free recycling claims.

## Operating Context

The website supports evaluation of recycling services and PV Circulator equipment. Existing routes include recycling estimates and booking, equipment information, a business-case calculator, circular products, and inquiries. Circular-material sales are present in the prototype; their business priority has not been confirmed.

## Capabilities and Constraints

- Existing implementation: Next.js with React, Node.js 24, deployed on Vercel with a Next.js server runtime under `/`. GitHub Pages is the earlier static draft.
- The estimate interface supports three user-confirmed pricing examples. Other quantity/wattage combinations require rate confirmation. No complete commercial tier schedule has been approved.
- Server APIs for verified model lookup and saving anonymous estimate references are implemented with Neon PostgreSQL. Actual availability depends on deployment configuration and schema; the recent live review found model lookup unavailable. Do not imply a successful save without a confirmed API response.
- Saving an estimate does not create a formal quote, booking, pickup, payment, or contact request. Existing equipment and material inquiry forms remain local previews. Photos are local-only; AI recognition is not implemented.
- Material passports demonstrate information structure rather than verified batch records. Calculator results use scenario assumptions.
- Settings persist in browser storage, not organization-wide server storage.
- The assistant uses local knowledge navigation until server-only OPENAI_API_KEY and OPENAI_MODEL are configured. A public server API is prepared; no live AI call has been verified. No photo AI recognition or transaction tools exist.
- Do not present prototype interactions as operational transactions or illustrative figures as verified commercial offers.

## Brand Commitments

Preserve the names PV Circonomy, TSGC, and PV Circulator and their distinct roles: recycling service provider and equipment sales channel; parent company and equipment developer; equipment product, respectively.

## Evidence on Hand

- User-confirmed company relationship, service model, equipment origin, and DTSC approval claim.
- `README.md` and `server/README.md` document prototype functionality and limitations.
- Existing equipment video: `public/videos/pv-circulator-operation.mp4`.
- Equipment brochures: `public/PV_Circulator_Solution_Overview.pdf` and `public/2026_PV_Circulator_Solution_Brochure.pdf`.
- Existing equipment imagery is available under `public/images/`.
- README identifies generated illustrative imagery and category illustrations; do not relabel them as facility photographs or actual batch evidence.
- DTSC approval documentation, approval scope, and authoritative citation remain to be supplied or verified before adding detailed regulatory claims.

## Product Principles

- Help customers understand recycling costs and obtain quotes online with clear terms. Whether quotes are binding, what inputs determine pricing, and which charges are included remain open product decisions.

- Make recycling services and equipment purchasing understandable as distinct customer workflows.
- Explain TSGC's development role and PV Circonomy's service and distribution roles accurately.
- Keep regulatory claims and commercial statements tied to supporting evidence.
- Make prototype limits clear wherever visitors could mistake an interaction for a completed transaction.

## Confirmed Pricing Boundaries

USD, US market only. Truck-scale shipments are per panel; trailer-scale shipments settle by measured weight including pallets and packaging. Transport is priced separately. Third-party scale tickets are accepted. Exact batch thresholds and the full wattage/volume table remain open.

Existing example prices apply to glass-intact modules with frames and junction boxes present. The user specified a 15% complete-condition difference, but its denominator remains unresolved: do not apply another discount or publish invented before/after prices. Double-glass modules have no separate surcharge. Detailed confirmed rules and open questions live in `docs/recycling-pricing-policy.md`.

## Reinitialization Scope

This refresh preserves the confirmed users, service/equipment roles, original assets and comp-first workflow preference. Refresh technical capability descriptions from implementation evidence rather than resetting earlier product decisions. Regulatory claims still require source documentation before expanded public claims.

## Residential processing tier (2026-11-22)

Tier order: Residential, Truck, Trailer. Whole-batch quantity across all lines determines eligibility. Residential defaults to 1–29 panels at Truck processing rate +50%; both values are editable under delivery administration transport settings (`residentialMaxPanels`, `residentialSurchargePct`). From 30 panels, existing Truck / Trailer logic applies, with Trailer gated by `trailerMinimumPanels`. The surcharge affects processing only, never transport or pickup services. Quotations show the applied basis. Saved order totals remain unchanged. Public tier copy loads current settings rather than hard-coding the threshold or percentage.
