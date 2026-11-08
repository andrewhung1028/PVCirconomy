# PV Circonomy redesign

Tesla-inspired image-first corporate website prototype. Main navigation: Solutions / Services / Circular Products / Discover / Shop.

The three conversion paths are recycling estimates and booking, PV Circulator and the business case calculator, and circular-material RFQs. Existing company equipment video, poster, logos and brochures are retained. `solar-circularity.png` is generated illustrative imagery, not a photograph of a company facility. Material SVGs are original category illustrations, not actual batch photographs.

## Preview limits

This branch is a review preview. GitHub Pages still publishes only from `main`. Forms on the recycling and equipment journeys validate in the browser. They do not submit, store personal details, call a CRM, or create a quote, order, or pickup. Nominal equipment figures already on the public site are labeled as company-published claims, not new measurements. The business-case calculator remains the separate site at https://businesscase.pvcirconomy.com/ and is not modified here.

`/settings/` controls the announcement content, link and visibility, plus the bottom assistant entry. Settings persist in this browser and sync between same-origin tabs; they are not global admin settings. The bottom support panel is clearly labeled knowledge navigation, with OpenAI not connected. See `server/README.md` for the server-only API handoff.

## Development

Use Node.js 24, `npm ci`, then `npm run dev`. The application base path is `/PVCirconomy/`. `npm run build` exports to `out/`.

The GitHub Pages workflow deploys the static export on a push to main. Live site: https://andrewhung1028.github.io/PVCirconomy/.
