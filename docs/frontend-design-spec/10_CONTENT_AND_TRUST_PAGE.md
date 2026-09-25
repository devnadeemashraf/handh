# 10 — Content & Trust Pages

## 10.1 About the Brand (`/about`)

### Overview

Editorial, not corporate. Per brief: "should feel like a fashion brand editorial," not an "About Us" page with a stock team photo and mission-statement bullet points.

### Layout

A long-form scroll built from the same magazine-spread pattern as Home's brand-intro (`05`) repeated with variation, not a form/table structure:

1. Opening full-bleed image + a single evocative line (`type-display-l`) — sets tone, doesn't summarize yet.
2. **Why the brand exists** — image (or none) + `type-body-l` copy block, max 68ch measure, `space-8` vertical rhythm between blocks.
3. **Meaning behind the name** — short, specific block on "Haya" — this is a genuine differentiator for the brand story and deserves its own beat rather than being folded into a general paragraph.
4. **Design philosophy** — pairs with visual examples (2–3 detail/process photos) rather than abstract adjectives alone.
5. **Craftsmanship & quality** — concrete specifics (fabric sourcing, construction choices, finishing details) — same "specificity over adjectives" voice rule as PDP copy (`01`).
6. **Founder/brand story** (if used) — a portrait-style image + first-person or warm third-person short narrative; kept modest in length, this is a modest-fashion brand, not a celebrity-founder tell-all.
7. **Commitment to customers** — short closing statement, transitions naturally into a `secondary` "Shop the Collection" CTA — the page should still gently return the reader to commerce, without feeling like a sales pitch.

Alternating image-left/image-right rhythm on desktop for the text+image blocks (2–4); mobile stacks image-above-text throughout, consistent with mobile's single-column discipline everywhere else in the system.

---

## 10.2 Contact / Customer Support (`/contact`)

### Layout

Simple and fast to scan — per brief, this should build trust through clarity, not through volume of options.

1. Short intro line — "We're here to help."
2. **Contact options** as a short list of cards or rows (not a giant form-first page): Email (with expected response time, e.g. "within 24 hours"), a contact form (name, email, order number [optional], topic dropdown: Order issue / Shipping question / Return or exchange / Product question / Other, message), Instagram DM link, and — if used — WhatsApp/phone.
3. Quick links row: FAQ, Shipping & Delivery, Returns & Exchanges — routes the "I have a question" visitor away from filling out a form when self-serve answers already exist, before the form itself.
4. The form is the last element on the page, not the first — options + self-serve links come before it.

### States

Form submitted successfully (see `11`), form validation errors (per Input component in `03`).

---

## 10.3 FAQ (`/faq`)

### Layout

Category tabs or a category chip row at top (Orders, Payments, Shipping, Delivery, Returns, Exchanges, Products, Sizing, Care — per brief's category list), a search-within-FAQ input beneath/beside the categories, and an Accordion list (component `03`) of questions within the selected category — one open at a time is fine here (unlike PDP, FAQ benefits from a single-focus reading pattern since questions are often mutually exclusive concerns).

### States

No FAQ results for a search-within-FAQ query — see `11`.

---

## 10.4 Shipping & Delivery (`/shipping`)

### Layout

Structured, scannable reading page — headings per topic (Shipping Process, Delivery Timelines, Delivery Locations, Tracking, Shipping Charges, Delays, Failed Delivery), short paragraphs and a rate/timeline **table** where numeric (e.g. region → estimated days → cost), not paragraphs of prose for numeric facts. Sticky in-page jump-nav (a simple anchor list) on desktop for quick scanning; mobile relies on normal scroll + browser find, kept short enough not to need its own nav.

---

## 10.5 Returns & Exchanges (`/returns`)

### Layout

Same scannable structure as Shipping: Eligibility, Time Limits, Process (as a numbered **step list** — reuse the Step pattern conceptually: 1. Start a return in Order Detail → 2. Print label → 3. Ship it → 4. Refund/exchange processed), Conditions, Refund/Exchange timing, Exceptions (final-sale items, etc., clearly flagged). A `primary` "Start a Return" button/link near the top for users who already know they want one, jumping into the relevant Order Detail (`08`) flow rather than making them read the whole policy first if they don't need to.

---

## 10.6 Legal / Policy pages (`/legal/*`)

### Layout

Deliberately the plainest pages in the system, by design — per brief, "prioritize readability" over brand flourish. Single centered column, max 68ch, `type-body-l` body text, `type-heading-m` section headers, generous `space-6` between sections, no imagery, no accent color beyond standard link styling. Logotype + minimal header/footer only, to stay recognizably part of the site without competing with legal clarity. Last-updated date shown beneath the page title.
