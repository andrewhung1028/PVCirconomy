# PV Circonomy redesign

Tesla-inspired image-first corporate website prototype. Main navigation: Solutions / Services / Circular Products / Discover / Shop.

The three conversion paths are recycling estimates and booking, PV Circulator and the business case calculator, and circular-material RFQs. Existing company equipment video, poster, logos and brochures are retained. `solar-circularity.png` is generated illustrative imagery, not a photograph of a company facility. Material SVGs are original category illustrations, not actual batch photographs.

## Preview limits

Recycling prices are illustrative. Booking and RFQ forms validate locally without submitting, reserving, emailing or saving requests. Material passports demonstrate information structure, not verified batch records. The calculator uses its existing scenario assumptions.

`/settings/` controls the announcement content, link and visibility, plus the bottom assistant entry. Settings persist in this browser and sync between same-origin tabs; they are not global admin settings. The bottom support panel is clearly labeled knowledge navigation, with OpenAI not connected. See `server/README.md` for the server-only API handoff.

## Development

Use Node.js 24, `npm ci`, then `npm run dev`. The application base path is `/`. `npm run build` prepares a Next.js server build; use `npm start` for production. The quote page is `/recycling-estimate/`.

The application is prepared for Vercel hosting with Neon PostgreSQL. GitHub Pages automatic deployment is retired. The previous public static draft remains at https://andrewhung1028.github.io/ until separately replaced. See `docs/vercel-neon-setup.md` for connection, schema initialization and deployment instructions. No deployment is performed by these changes.
