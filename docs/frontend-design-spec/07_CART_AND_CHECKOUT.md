# 07 — Cart & Checkout

## 7.1 Cart

### Overview

A calm continuation of shopping, not a "gate" before checkout — the brief is explicit that mobile cart should feel native, not transactional-generic.

### Layout — mobile (full-screen route, `/cart`)

- Top bar: back-chevron, "Your Bag (3)" title (item count in title, not a separate label), no cart icon needed here (you're already in it).
- **Line items**: image (square-ish, `4:5` cropped consistent with product cards, ~88px), product name, selected variant line ("Size M · Sapphire"), quantity stepper (component `03`), unit price, remove action (text link "Remove" beneath the stepper, not a trash icon alone — icon-only destructive actions are ambiguous and this is a destructive one), and a "Save for later" secondary text link next to Remove.
- Between line items and totals: an **Alert banner** (component `03`, informational tint) showing free-shipping progress if applicable: "Add $24 more for free shipping" with a thin progress bar beneath it — this is the one piece of "gamification" allowed, because it's genuinely useful, factual, and non-manipulative.
- **Discount code**: single-line input + "Apply" button, collapsed by default behind a "Have a promo code?" text-link toggle (keeps the default cart visually calm; most sessions don't have a code).
- **Price breakdown**: Subtotal, Shipping (or "Calculated at checkout" if not yet determinable), Discount (if applied, shown as a negative line in `color-success`), Total — right-aligned numerals, `type-price` for the Total row only, others `type-body-l`.
- **Sticky bottom bar**: Total price (left) + `primary` "Checkout" button (right, full available width otherwise) — same sticky-purchase-bar pattern as PDP for consistency.
- **Recommended complementary products**: horizontal carousel beneath the line items (above price breakdown, so it doesn't interrupt the transaction-focused bottom section), same Product Card component, sourced from what's already in the cart.

### Layout — desktop

Two columns: left (line items + recommendations + saved-for-later section), right (sticky price breakdown card + discount code + Checkout button) — this mirrors the PDP's left-scroll/right-sticky-panel pattern for consistency across the app, not a new layout idiom.

Cart also renders as the **slide-over panel** (per `04`) triggered from the header cart icon — same content, condensed (no recommendations carousel in the panel, to keep it quick), with a "View full bag" link to `/cart` for the complete experience.

### Interactions

- Quantity change: debounced, updates price breakdown with a brief cross-fade on the changed numbers (`duration-fast`) rather than an instant snap — signals "recalculated," not "glitched."
- Remove: item row collapses (height animates to 0, `duration-base`) rather than vanishing instantly; an undo Toast appears ("Removed — Undo") for 4s.
- "Save for later": moves item to a **Saved for later** section beneath the main list (visually distinct, muted, own small "Move to bag" action) rather than deleting it.

### States

Empty cart, error adding item, coupon invalid, item became unavailable between add and checkout — all defined in `11`.

---

## 7.2 Checkout

### Overview

Single continuous flow, not treated as separate pages — minimizes navigation/back-button confusion and lets progress feel linear. "Frictionless and trustworthy," per brief: no unnecessary account requirement, no unnecessary fields, no trust-badge wall.

### Flow structure (one route, sectioned, not paginated)

Rendered as sequential sections on one scrollable page (desktop) / one scrollable screen (mobile), each section collapses to a compact summary once completed and the next section auto-expands — an **accordion-of-steps** pattern rather than a multi-page wizard, so users can glance back at earlier choices without a full "back" navigation:

1. **Contact** — email (+ optional "Sign in" text link for returning customers, and a checkbox "Email me with news and offers" — unchecked by default). Guest checkout is the default path; account creation is offered _after_ purchase (§08), never required before it.
2. **Delivery address** — standard address form (name, address lines, city, region, postal code, country, phone). Address autocomplete recommended (implementation detail, not a visual requirement) to reduce typing on mobile.
3. **Shipping method** — radio list: option name, delivery estimate, price (or "Free"), selected = `color-accent-royal` left-border accent + `color-accent-royal-tint` background per the Selector pattern.
4. **Payment** — card fields (or wallet/pay-by-link options if integrated) + billing-address-same-as-shipping checkbox (checked by default, unchecked reveals a second address form).
5. **Review & place order** — condensed order summary (line items collapsed to thumbnail row, not full detail — full detail already lived in Cart), final price breakdown, required legal checkbox only where actually required (e.g. terms acceptance) — no decorative checkboxes, then `primary` "Place Order" button, full width, `lg` size.

### Layout — mobile

Order summary is collapsed by default behind a tappable "Order summary ▾" bar directly beneath the top bar (shows item count + total, expands to itemized view) — keeps the form the visual priority on a small screen, summary is one tap away rather than always consuming vertical space.

### Layout — desktop

Two columns: left = the 5-step accordion form, right = order summary card, persistently visible (not collapsed — desktop has the width for it), sticky as the left column scrolls.

### Trust, stated once, plainly

One line near the Payment section and one near Place Order: a small lock icon + "Secure checkout" and the accepted payment icons (small, monochrome-ish treatment, not a colorful logo wall) — per brief, "without filling the screen with unnecessary trust badges."

### Interactions

- Section completion: on valid submit of a section's fields, it collapses to a one-line summary (e.g. "Ship to: Aisha R., 42 Marina Rd, …") with an "Edit" text link, and the next section expands and receives focus automatically — smooth height animation, `duration-base`.
- Field-level validation: inline, on blur (not on every keystroke — avoids flashing errors while a user is mid-type), per the Input component's error state.
- Place Order: button enters `loading` state; on success, navigates to Order Confirmation (§08); on failure, see `11` (payment failed) — the form state and entered data are preserved, nothing is cleared.

### States

Invalid address, invalid coupon carried over from cart, payment processing, payment failed, session/cart-expired mid-checkout, item went out of stock mid-checkout — all in `11`.
