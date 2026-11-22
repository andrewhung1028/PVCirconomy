---
name: PV Circonomy site design system
description: Shared visual system for every PV Circonomy page
colors:
  review-yellow: "#f4c526"
  review-ink: "#151719"
  review-paper: "#fff"
  review-line: "#d8d9d7"
typography:
  display:
    fontFamily: "Manrope, sans-serif"
    fontSize: "clamp(38px,4vw,64px)"
    fontWeight: 800
    lineHeight: 1.08
    letterSpacing: "-.035em"
  headline:
    fontFamily: "Manrope, sans-serif"
    fontSize: "clamp(32px,3.2vw,52px)"
    fontWeight: 800
    lineHeight: 1.06
    letterSpacing: "-.035em"
  body:
    fontFamily: "Manrope, sans-serif"
    fontWeight: 300
    lineHeight: 1.6
  label:
    fontFamily: "Manrope, sans-serif"
    fontSize: "12px"
    fontWeight: 300
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

Review yellow identifies the infinity mark, action arrows, current section indicators and keyboard focus.

### Neutral

Review ink carries text and dark interactive surfaces. Review paper forms reading panels and reversed text. Review line separates results and disclosures. Image overlays support readable white type; they do not form a separate blank header strip.

## Typography

Self-hosted Manrope is the sole site family. It approximates the user-selected generated sample under its included license. Light text (300) and bold headings/emphasis (800) are the only used weights. Navigation and action labels remain light. Heading scale and spacing are normative in the frontmatter; responsive adjustments live in the source stylesheet.

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
