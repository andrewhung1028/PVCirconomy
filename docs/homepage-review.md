# Homepage review snapshot

This documents the approved homepage review implemented by `app/page.tsx` and `app/components/review-home.tsx`, with styles in `app/components/review-home.css`. It is for a Vercel **preview deployment**, not production replacement. Existing unrelated routes were not redesigned.

## Approved visual decisions

The approved composition draws on the user's mockups, TSGC proportions, SpaceX's lower-left hero placement, and the explicit TSGC/SpaceX/ROSI reference context. These are references, not affiliations or copied brand identities. The later generated sample established the fuller, bold type direction. Self-hosted Manrope is the licensed visual approximation, not an identification of the exact font in that raster sample; font source and license are in `public/fonts`.

One family has two used weights: light body, navigation and actions (300), and bold headings and emphasis (800). The transparent yellow infinity mark and light white company name sit directly over imagery. There is no logo plaque or blank top bar.

The desktop sequence has four viewport-scale sections: Recycling, Pricing, Technology and Delivery. The hero's copy and CTA sit lower left. Pricing and Delivery use 64/36 image/text divisions; Technology uses an 80/20 media/text division. At intermediate widths the image/text division becomes 56/44. Mobile stacks imagery and content. Expanded disclosures and shorter screens may increase section height; content remains in normal document flow without scroll hijacking or clipping.

Fixed section links and left quick dots navigate within the page. The mobile menu supports Escape. Native disclosures keep detailed terms on the same page. Reduced-motion preferences disable animated scrolling. The equipment video requires an explicit play action.

## Estimate behavior and disclosure

This is an estimate worksheet, not a binding quote, booking, payment or submitted request. The three confirmed examples are 300 × 350 W at $9/panel, 150 × 450 W at $15/panel, and 7,000 × 275 W at $0.16/lb. Other model/quantity/condition combinations require rate review; rates are not interpolated. The trailer example assumes approximately 45 lb per panel before packaging, with final settlement by measured weight including packaging and pallets. Transport is separate and taxes require confirmation.

Condition adjustments, the unresolved complete-condition benefit, settlement, packaging, acceptance, seven-day batch scheduling, arrival discrepancies, documentation and unconfirmed cancellation/return terms remain readable in inline disclosures. DTSC approval scope and supporting evidence are pending verification; no invented certificate or approval badge appears. TSGC develops PV Circulator; PV Circonomy provides recycling services and acts as an equipment sales channel.

Model lookup has loading, no-match and unavailable states that preserve input. A real model backend is not guaranteed to be available in this preview. Manual rated watts remain available. Label photos are local previews only, with file-type and size validation; they are not uploaded or analyzed by AI. Recycling help does not claim a connected AI unless its panel explicitly indicates one. Copying estimate details submits nothing.

## Assets

The equipment poster and process video come from the existing project. The solar-circularity image is generated illustrative imagery, captioned as such rather than presented as a real company facility. Delivery reuses that illustrative source pending an approved transport image.

## Validation snapshot

The implementation's build and Playwright checks passed. The source detector returned `[]`. These are the implementation validation results supplied with this documentation task; documentation does not establish production readiness, a working external model service, or verified commercial terms.

`DESIGN.md` and `.impeccable/design.json` capture this homepage review system only. They do not replace the existing palette or design rules of unrelated routes.
