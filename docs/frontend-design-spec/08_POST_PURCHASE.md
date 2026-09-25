# 08 — Post-Purchase: Confirmation, Tracking, Order History

## 8.1 Order Confirmation (`/checkout/confirmation/[order-id]`)

### Overview

The emotional peak of the transaction — the brief specifically asks this not read as a bare "Order successful" toast-in-page-form. It should feel like a considered close to the experience, at the same visual quality bar as everything before it.

### Layout — mobile

1. **Success moment**: centered, generous top padding (`space-9`). A single restrained checkmark treatment (line-drawn icon, `color-accent-royal`, animates in via stroke-draw over `duration-slow` — the one place a slightly more expressive animation is earned, once, on entry only) + `type-heading-l` "Thank you, [First Name]." + `type-body-l` "Your order is confirmed." No confetti, no color explosion — restraint carries the moment, per brand direction.
2. **Order number** — `type-body-m`, `color-text-secondary`, "Order #HC-10234" with a small copy-to-clipboard icon action.
3. **Order summary card**: thumbnail row of purchased items (small, `4:5`), item count, amount paid (`type-price`), payment method last-4 if card.
4. **Delivery info card**: shipping address, shipping method chosen, **estimated delivery date range** (`type-heading-m`, given visual priority — this is the fact the customer most wants right now).
5. Two actions, stacked full-width on mobile: `primary` "Track Your Order" → `/track/[order-id]`, `secondary` "Continue Shopping" → `/shop`.
6. **Support info**: one line, "Questions about your order? [Contact us]" linking to `/contact`, pre-filled with order context if the contact form supports it.
7. If the customer checked out as a guest: an inline, non-blocking prompt — "Save your details for faster checkout next time" with a single email/password (or magic-link) field + "Create account" button — optional, dismissible, never a modal interrupting the confirmation itself.

### Layout — desktop

Same content, presented as a centered single column max-width ~640px (this page is not a place for a two-column layout — it's a single, calm resolution, and the desktop canvas earns _more whitespace around_ the same column, not more columns).

### Interactions

An order-confirmation email is implied to be sent server-side; the page itself doesn't need to state "check your email" as its primary message — the on-page confirmation is complete and self-sufficient (email is a backup, not the primary confirmation surface).

---

## 8.2 Order Tracking (`/track/[order-id]`)

### Overview

Must be "visually understandable at a glance," especially on mobile, per brief — this is a status-communication screen, not a data table.

### Layout — mobile

1. Top bar: back-chevron, "Order #HC-10234" title.
2. **Current status hero**: large `type-heading-l` current-state label ("Out for delivery"), one supporting line with the most specific detail available ("Arriving today by 8pm" / "Estimated Thu, Oct 2"), courier name + tracking number (if applicable) as a text link out to the courier's own tracking page.
3. **Vertical timeline** (this is the centerpiece): six stages — _Order placed → Payment confirmed → Processing → Shipped → In transit → Out for delivery → Delivered_ (brief lists these as the stage set; render as a vertical stepper on mobile, each stage as a row: filled `color-accent-royal` circle + connecting line for completed stages, hollow circle + `color-border-strong` line for upcoming stages, the _current_ stage gets a subtle pulsing ring (single slow pulse loop, not attention-grabbing — a calm "this is live" signal) rather than a color difference alone (accessibility: status is also conveyed by text label, not color/animation alone). Each stage shows its timestamp once reached ("Shipped — Sep 28, 2:14pm"), no timestamp shown for future stages.
4. **Order & delivery summary**: collapsed accordion beneath the timeline — items, address, shipping method — same data as confirmation, de-emphasized here since tracking's job is status, not re-displaying the receipt.
5. Actions: `secondary` "Contact Support" (pre-filled with order context), and if eligible by status, `secondary` "Request Return/Exchange" → `/returns` flow.

### Layout — desktop

Timeline becomes **horizontal** across the top (stages left-to-right instead of top-to-bottom) since desktop width supports it better than a tall vertical list — same visual language (filled/hollow/pulsing-current), summary and actions beneath in a single centered column.

### States

Delayed shipment (a stage that's taking longer than the original estimate — shown as an amber `color-warning` inline note beneath the current stage, factual, not alarming: "Running slightly behind schedule — updated estimate: Oct 4"), failed delivery attempt (courier attempted, nobody home — shown as its own timeline sub-note with a "Reschedule delivery" or "Contact courier" action if available), order cancelled/refunded (timeline replaced by a single status statement + refund details, see `11`).

---

## 8.3 Order History (`/account/orders`) & Order Detail (`/account/orders/[order-id]`)

### Order History layout

List of past orders, most recent first, each row: order number + date (`type-body-m`), item thumbnails (small, up to 3 + "+2 more"), total paid, status badge (component `03` badge styling, using semantic colors: Processing = neutral, Shipped/In Transit = `color-accent-royal-tint`, Delivered = `color-success`, Cancelled/Refunded = `color-error`-adjacent muted), chevron to detail. Search/filter by date range or status once history grows long enough to need it (not required for a small initial catalog, but the list layout must not break if it does).

### Order Detail layout

Everything from Order Confirmation (§8.1 items 3–4) plus: full itemized line items (image, name, variant, qty, unit price — same row pattern as Cart, but read-only), full price breakdown, payment method, a link into Tracking (§8.2) if the order is still in flight, and a **"Buy Again"** action per line item or for the whole order (adds the same items back to cart at current price/stock — clearly does not guarantee the original price if it changed, no false promise).

### States

Empty order history (new customer, no orders yet) — see `11`.
