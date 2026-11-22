# Homepage review round 2

- Typography is unchanged (Manrope 300/800).
- Company header navigation is Recycling / PV Circulator / About, with a separate hamburger for future customer access. Equipment and About open inline summaries; login is explicitly unavailable, not a fake working flow.
- Side navigation and DOM order are Recycling / Pricing / Delivery / Recycling Passport.
- Hero copy begins near the upper part of the lower-left quadrant: top51% desktop,48% mobile.
- Fourth screen responds to the user's chosen value proposition: a recycling passport, rather than an equipment technology pitch. It presents a planned, evidence-based record structure with receiving/processing/material-outcome/documentation fields, not a fabricated verified record. Qualifications, scope, timing and available outputs remain pending confirmation.
- Build/TypeScript, desktop/mobile navigation, Escape behavior, disabled future sign-in, section order and passport expansion checked. Production untouched; preview deployment only.
- Detector returned advisory design-token mismatches against the newly documented token inventory (colors/font sizes/radii); no broad ignore was added and these are not represented as a clean accessibility audit.


## Five-section review and CSS baseline

Order: Recycling → Pricing → Delivery → Traceability → FAQ. FAQ answers expand on the same page. Traceability describes the proposed recycling passport, not live batch data.

The homepage CSS now names its approved color, weight (300/800), heading, control, spacing and layout values as `--pv-*` variables in `app/components/review-home.css`. Manrope remains self-hosted; desktop split is 64/36, equipment media/band 80/20, and hero copy starts at 51% (48% mobile). Mobile content expands to fit rather than clipping to viewport height. Corporate navigation remains separate from section navigation. Logo is exported directly from the supplied second-generation Illustrator vector original, with transparent background and cropped art bounds.


## Section scroll behavior

Homepage enables native vertical mandatory scroll snap with section start alignment and stop points. Oversized sections retain native scrolling to read expanded details. Reduced motion uses proximity snapping and immediate anchor navigation. The class is removed on homepage unmount. FAQ and footer share the last section; expanded answers may grow its height.
