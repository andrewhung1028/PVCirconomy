---
name: PV Circonomy site design system
description: Shared visual system for every PV Circonomy page
colors:
  review-yellow: "#f4c526"
  review-ink: "#151719"
  review-paper: "#fff"
  review-gray: "#f5f5f2"
  review-line: "#d8d9d7"
typography:
  display:
    fontFamily: "Manrope, sans-serif"
    fontSize: "80px"
    fontWeight: 800
    lineHeight: 1.08
    letterSpacing: "-.035em"
  headline:
    fontFamily: "Manrope, sans-serif"
    fontSize: "56px"
    fontWeight: 800
    lineHeight: 1.06
    letterSpacing: "-.035em"
  body:
    fontFamily: "Manrope, sans-serif"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Manrope, sans-serif"
    fontSize: "12px"
    fontWeight: 400
rounded:
  control: "0"
spacing:
  field-gap: "12px"
components:
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.review-ink}"
    rounded: "{rounded.control}"
    padding: "12px 18px"
  button-outline-hover:
    backgroundColor: "{colors.review-ink}"
    textColor: "{colors.review-paper}"
  button-on-image:
    backgroundColor: "transparent"
    textColor: "{colors.review-paper}"
    rounded: "{rounded.control}"
    padding: "12px 18px"
---

# Design System: PV Circonomy

## Overview

This is the approved site-wide visual system for every PV Circonomy page. The user's approved composition and explicit TSGC/SpaceX/ROSI reference context supply the direction. No additional brand metaphor has been invented.

Large imagery, fuller bold headings, light supporting text and a restrained yellow accent define this surface. Its page composition is recorded in `docs/homepage-review.md` and `.impeccable/surfaces/home-review.md`; do not promote that composition into a rule for every route.

## Colors

### Primary

PV Circonomy Yellow is `#F4C526` and is exposed as `--pv-yellow` (design token `review-yellow`). Use this exact color for all yellow UI elements across the site, including navigation icons, action arrows, fills, indicators and focus outlines. Use ink, paper and line tokens when a component needs more contrast.

### Neutral

Page and section backgrounds use exactly three surface colors: black (review ink, `#151719`), gray (`#F5F5F2`, `--pv-gray`), and white (review paper, `#FFFFFF`). Use the exact gray from the Our Solution Wave chart pane for every gray background. Review line separates results and disclosures. Image overlays support readable white type. The shared site header is transparent across every page and section, revealing the underlying photo or page background. Use white navigation text on dark sections and ink navigation text on light sections. Use PV Circonomy Yellow line icons with no shadow or underline, and retain a visible keyboard focus outline.

## Typography

Front-end typography uses self-hosted Manrope in English, Noto Sans TC in Traditional Chinese and Noto Sans JP in Japanese. Across the public site, use 400 for regular text and 800 for headings and emphasis.

The shared CSS in `app/globals.css` defines eight semantic sizes. Desktop uses 80, 56, 40, 28, 20, 16, 14 and 12 px. Mobile uses 40, 32, 28, 24, 18, 16, 14 and 12 px. Tablet uses the same scale with a 56 px display, 40 px section heading and 28 px panel heading. Body text and form inputs remain 16 px. Interface labels and table text use 14 px, while chart legends, sources and notes use 12 px.

## Layout

Apply this system to every PV Circonomy route. `app/components/review-home.css` is the canonical source for brand tokens, typography, navigation, controls and responsive behavior. Each route may keep only the structural rules required by its content; it must not introduce a separate visual language. Administration pages may retain dense form and table layouts, but must consume the same tokens and component styling. Sections may grow when disclosures open; maintain normal document overflow. Source breakpoints are mobile (760px), intermediate tablet (761–1000px), and wide desktop (1700px).

**The 1600px Content Safety Frame.** Every public route uses `--pv-content-max: 1600px` as its shared wide-screen coordinate system. Background colors, photography and video remain full bleed. Navigation, overlay copy, charts, tables, progress controls and footer content stay within the centered safety frame. Split sections retain their canonical viewport proportions; readable content inside each pane is capped independently so forms and text do not stretch on cinema-width displays. Mobile spacing continues to use the established fixed gutters.

**The Recycling Structure Rule.** Public marketing pages are assembled from five canonical structures derived from the Recycling page; they do not invent route-specific page shells.

1. **Full screen:** `100svh`; the screen may contain media, text, or both.
2. **Large left / small right:** desktop uses `64% / 36%`. Either side may contain media or text. When content exceeds one viewport, the left and right panes may scroll independently.
3. **Large top / small bottom:** `80svh / 20svh`; the upper pane is media and the lower pane is text. The lower pane may grow naturally when its content requires more room.
4. **Small left / large right:** desktop uses `43% / 57%`; both panes contain text. When content exceeds one viewport, the left and right panes may scroll independently.
5. **Footer fused with the final section:** the footer is part of the last section's document flow and never creates an additional standalone screen.

On mobile, split layouts become a single natural document flow; independent pane scrolling is a desktop behavior and must not create nested-scroll traps on touch devices. The structural source of truth is also recorded in `docs/layout-structure.md`.

**Public section scrolling.** Every public route uses the Recycling page's vertical section-snap behavior. Desktop pointer layouts snap to the next outermost page section after normal wheel, trackpad or keyboard scrolling; long sections remain natively scrollable within their full height. Touch and narrow layouts use proximity snapping so a visitor is never trapped while reading or completing a form. Reduced-motion preferences disable smooth scrolling and also use proximity snapping. Administration and browser-preview settings routes retain ordinary document scrolling.

## Elevation & Depth

The page relies on image overlays, white panels and thin dividers. Buttons and reading surfaces are flat. Quick navigation uses a small shadow for legibility over imagery; the mobile light-section dots receive a translucent backing. The scoped help trigger removes its incumbent shadow.

## Shapes

Actions and input fields have square corners. Thin strokes define controls and disclosures. Section dots and numbered delivery markers are circular; this does not imply rounded cards throughout the page.

## Components

Outline actions use a thin current-color border and a yellow arrow. Their minimum height is 46px. Dark-on-light actions invert on hover; image actions become white with dark text. Keyboard focus uses a yellow outline (3px), offset by 4px.

Fields use visible labels, a white fill, square corners and a thin gray border. Native disclosures use a top divider and plus/minus indicators; expanded content stays on the page. Navigation uses light type, an active yellow underline, quick section dots and an expandable mobile menu. The estimate result uses bold tabular numbers and an announced status. There is no separate general-purpose card or chip system in this scope.

## Do's and Don'ts

- Do preserve the two-weight typography and transparent infinity/wordmark treatment.
- Do retain keyboard focus, reduced-motion behavior and room for expanded content.
- Do keep the site-wide visual language in `app/components/review-home.css`; route-specific CSS may define structure only and must reuse the shared tokens and components.
- Don't represent illustrative imagery as a company facility.
- Don't turn this preview worksheet into an apparent binding quote or confirmed booking.
- Don't add an invented brand metaphor or treat reference brands as affiliations.

## Pricing administration surface

`/admin/pricing/` uses the homepage's Manrope 300/800, ink/paper/yellow palette and squared controls in a conventional form-and-table workspace. Desktop puts editable rules left and a live calculation/tier table right; mobile stacks them. Version history sits below; current staff identity and activation time are shown above. This is an Operate surface: save status, validation, authentication state and concurrent-edit errors take priority over marketing imagery. Its dedicated styles are `app/components/pricing-admin.css`.

## Delivery and order management

The homepage keeps its split-image composition. Delivery now starts with the carried quotation and method choice, then reveals the booking form after Place recycling order. Date inputs use native calendars; morning/afternoon availability is capacity-based. The primary Plan your delivery action sits beside the pricing total and wraps below it on narrow screens. `/admin/delivery/` reuses the administration form language for receiving settings, freight rates and order review. AI remains a visible disabled identification tab.
