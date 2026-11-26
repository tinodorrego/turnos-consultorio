---
version: 1
slug: "src-app-page-tsx"
primary_target: "src/app/page.tsx"
related_targets: ["src/app/turno/[codigo]/page.tsx"]
---

# Surface brief: reserva pública de turnos (Centro Sereno)

Scope: `/` (reserva) and `/turno/[codigo]` (comprobante). Mode: Persuade (the action is booking itself).
Audience: patients 25–65 on phones, many older adults; reviewers of the repo.
Task: see real open slots, pick one, leave three details, get a proof of booking; cancel easily.
Constraints: Spanish (AR); fictitious practice; no invented testimonials, ratings or counts; large tap targets.

## Direction contract

THESIS: The page is a pharmacy wall calendar (almanaque de farmacia): the month itself is the booking widget. Refuses the category default of white + teal with a stock doctor photo and a "Reservá tu turno" button leading elsewhere.

OWN-WORLD: Glossy-white calendar sheet on a saturated field; a printed sponsor band (practice name, address, phone) in pharmacy green with a yellow rule; huge condensed numerals (Archivo, width-condensed) in ink; Sundays and holidays printed red; specialty colours as bold section tabs (kinesiología naranja, nutrición verde, psicología violeta); a rivet hole at the top; tear-off stub with a perforated edge for time slots.

STORY: The visitor recognises the calendar, sees which days have room for their specialty, taps a day, the stub drops with times grouped by professional, taps a time, types name/phone/email, confirms, and gets the classic appointment card stamped with the practice's seal, with a one-tap cancel.

FIRST VIEWPORT: On a phone: sponsor band on top; specialty tabs and first-visit/follow-up toggle; the month grid filling the width with big numerals, available days marked and today circled in ballpoint blue. On desktop: the calendar sheet centred at poster scale, the stub to its right. The primary action is tapping a marked day; no separate "book" button.

FORM: Pharmacy wall calendar, IMPECCABLE’S PICK (position 1 of 7 on the grounded list), chosen by the user over the assigned "cartilla de obra social". seed:c05ec711c95b58c4. Signature move: the confirmation card receives a rubber-stamp press (scale + rotation + ink settle), instant under reduced motion. Raise (step-row challenger): "now" is always marked, so the patient knows how soon is soon. Raise (wax-pack cards challenger): every professional appears with the same compact identity block in every slot group.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
