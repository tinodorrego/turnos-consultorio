# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: patients of a small multidisciplinary practice in Buenos Aires (adults 25–65, mostly booking from a phone, often in a spare minute). They want to see when they can be seen and lock a slot without calling or chatting. Secondary: the practice's receptionist and professionals, who manage the daily agenda, attendance and availability from a desktop.

Secondary audience for the repository: recruiters and technical leads evaluating the author as functional analyst, requirements engineer, UX/UI designer and developer.

## Product Purpose

Replace booking by WhatsApp, phone and paper notebook with online self-service booking that respects the practice's real rules, and give the practice an agenda with attendance tracking. Success: a patient books in under a minute on a phone; no-shows drop because cancelling is easy and reminders exist; the receptionist stops answering "do you have anything Thursday?".

## Positioning

Open appointment slots are the front door: the first thing a patient sees is real availability, not a "book now" button leading elsewhere. Every booking rule the interface enforces (minimum notice, cancellation window, session lengths, no double booking) is a numbered requirement in `docs/` verified by tests.

## Operating Context

The practice is **fictitious** ("Centro Sereno": kinesiology, nutrition and psychology, four professionals). Built as a case study ready to be validated with a real practice: usability tests and post-launch metrics are planned, not claimed. Patients book on phones; staff use desktop at the front desk. Language: Spanish (Argentina). Time zone: America/Argentina/Buenos_Aires.

## Capabilities and Constraints

- Public booking: choose specialty and professional, first visit or follow-up (different durations), pick an open slot, leave contact details, get a code and a self-service link to cancel.
- Practice panel: daily agenda per professional, mark attended / no-show, block time, availability.
- Stack: Next.js 16, TypeScript, Tailwind CSS 4, PostgreSQL via Drizzle (PGlite in development).
- No real patient data; no clinical records. Health data is out of scope on purpose.

## Evidence on Hand

None real. All people, the practice, prices and insurers are fictitious seed data. No testimonials, ratings, patient counts or outcome claims may be invented.

## Product Principles

1. Availability first: show real slots before asking for anything.
2. Ask for the minimum, at the moment it is needed.
3. Make cancelling as easy as booking: a freed slot helps the next patient.
4. Every rule the patient bumps into is explained in plain words and traces to a requirement.

## Accessibility & Inclusion

Many patients are older adults on small phones: large tap targets, high contrast, readable type sizes, no information conveyed by colour alone.
