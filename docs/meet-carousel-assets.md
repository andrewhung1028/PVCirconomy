# Meet PV Circonomy replacement artwork

Desktop: **2400 × 1350 px (16:9)**. Mobile: **1200 × 900 px (4:3)**.
Use WebP or AVIF where possible, with JPEG as an alternative. Aim for 150–400 KB per image. Do not bake text into artwork: titles and descriptions are HTML overlays. Keep the main subject in the central 60% and leave the lower-left area quiet enough for white copy. The frame uses `object-fit: cover`; desktop height fills the available screen space between the heading and KPI row, so outer edges can be cropped.

Replace `image`, `mobileImage`, `alt` and `position` in `app/components/meet-carousel.tsx`. Assets belong in `public/images/`. Existing images are temporary layout placeholders, not final representations of each offering. Desktop and mobile sources currently point to the same placeholder; `<picture>` already supports separate files.

Slides and intended art direction:

1. Compliance: dry physical processing in a clean California operating environment. No heat or process water.
2. Unit economics: automated infeed, continuous movement and a small operating team.
3. Material value: clearly separated glass, polymers, cells and metals; show industrial outputs rather than mixed waste.
4. Business model: modular equipment deployed at a customer location or alongside retired panels.
5. Traceable value: panel identification and traceability documentation, without real customer data or fabricated certificates.

Three KPI cards update with each slide. Navigation supports previous/next buttons, five indicators, arrow keys and horizontal touch swipes. Playback is optional; it pauses when the carousel is off-screen, hovered or focused. Reduced-motion preferences stop playback when enabled.
