# 03 — Component Library

Every component below is referenced by name in the page specs (`05`–`10`). Build these once, in isolation, before assembling pages.

## Button

**Variants**: `primary` (filled `color-accent-royal`, white label — the one main action per screen), `secondary` (1px `color-border-strong` outline, `color-text-primary` label, transparent fill), `ghost` (no border/fill, used for tertiary actions like "Clear filters"), `destructive` (label `color-error`, ghost or outline).

**Sizes**: `lg` (48px height, PDP add-to-cart / checkout CTA), `md` (44px, default), `sm` (36px, inline actions like "Edit" in cart row — never used as the only way to complete a primary action).

| State                | Visual                                                                                                  |
| -------------------- | ------------------------------------------------------------------------------------------------------- |
| Default              | Per variant above, `radius-sm`                                                                          |
| Hover (pointer only) | `primary`→`color-accent-royal-hover`; `secondary`→ fill `color-bg-sunken`                               |
| Active/pressed       | Scale to 98% over `duration-instant`, no color change beyond hover state                                |
| Focus-visible        | 2px `color-accent-royal` outline, 2px offset                                                            |
| Disabled             | 40% opacity, no pointer events, no hover/active response                                                |
| Loading              | Label replaced by a 16px spinner (same color as label), button width does not change, disabled to input |

Full-width on mobile for primary purchase actions; auto-width elsewhere. Never smaller than 44×44px hit area even if visual size is smaller (`sm` gets invisible padding to reach 44px).

## Input (text, email, etc.)

44px height mobile / 44px desktop (do not shrink on desktop — consistency beats density here), `radius-sm`, 1px `color-border-subtle`, `space-3` horizontal padding, label above field (never placeholder-as-label).

| State    | Visual                                                                  |
| -------- | ----------------------------------------------------------------------- |
| Default  | Border `color-border-subtle`                                            |
| Focus    | Border `color-accent-royal`, 2px, no glow/shadow                        |
| Filled   | Border `color-border-strong`                                            |
| Error    | Border `color-error`, helper text below in `color-error`, `type-body-s` |
| Disabled | `color-bg-sunken` fill, `color-text-tertiary` text                      |

Helper/error text transitions in via height-auto + opacity over `duration-fast` (never pops in, never shifts layout abruptly — the field's margin-bottom is reserved space so the appearance doesn't push content below it by more than the text's own height).

## Selectors

### Size selector (PDP)

Row of tap targets, min 44×44px each, `radius-sm`, 1px border. Selected = `color-accent-royal` border 2px + `color-accent-royal-tint` fill. Out-of-stock size = same shape, `color-text-tertiary` label, diagonal strike, still tappable → triggers "notify when back in stock" flow, not a dead element.

### Color/swatch selector

Circular swatches (`radius-full`), 32px, showing actual fabric/color. Selected = 2px `color-accent-royal` ring with 2px offset gap (ring doesn't touch the swatch). Label of the selected color name appears as `type-body-s` next to the row, updates on selection.

### Quantity selector

`− [ number ] +` stepper, 36px tall buttons either side of a 40px numeric field, `radius-sm` container with 1px border. Minus disables at quantity 1. Plus disables at available stock, showing inline helper "Only 4 left" once within 5 of stock limit.

## Product Card

The single most-repeated component — used in grids, carousels, "related", "recently viewed", wishlist.

**Anatomy** (top to bottom): image (aspect ratio `4:5`, fixed, never cropped differently between cards in the same grid) → wishlist heart icon (top-right overlay on the image, 44×44 hit area) → sale/new badge (top-left overlay, `type-label`, only one badge at a time — priority Sale > New > Low Stock) → product name (`type-body-m`, 1 line, ellipsis-truncate) → price row (`type-price`; if on sale, `type-price` in `color-sale` + `type-price-compare` struck through beside it) → color-count if >1 (`type-body-s`, "3 colors").

**Interaction**:

- Pointer hover (desktop): swap primary image → secondary product image over `duration-base` cross-fade; reveal a `secondary` "Quick Add" button sliding up from the bottom edge of the image.
- Touch (mobile): no hover swap (no secondary pointer state to fake) — tapping the card navigates; the wishlist heart and a persistent small "+" quick-add affordance are always visible, not hover-revealed, since touch has no hover.
- Wishlist heart tap: fills + a single scale-pulse (1 → 1.2 → 1) over `duration-fast`, no page navigation, optimistic update with toast confirmation (see Toast).
- Quick Add tap: opens the variant-select bottom sheet if the product has size/color variants; adds directly with a toast if it doesn't.

**Loading**: skeleton variant — image area `color-bg-sunken` pulse, two text-line bars beneath. See `11-ux-states-catalog.md`.

## Product Gallery (PDP)

- Mobile: full-bleed edge-to-edge horizontal swipeable carousel, one image per viewport width, `4:5` aspect. Dot indicators (not numbers) below, current dot = `color-accent-royal`, 6px, others `color-border-strong` 6px. Pinch-to-zoom enabled on the active image (native browser zoom is acceptable; don't build a custom zoom lightbox on mobile — it adds friction).
- Desktop: left column (55–60% width) shows a vertical stack of all images at full quality with generous `space-6` gaps between them (editorial scroll, not a boxed carousel); a thin vertical thumbnail rail is not required — scroll position itself is the navigation. Right column is the sticky purchase panel (see PDP spec).
- Tap/click any image → lightbox: full-screen, black `color-overlay-scrim` at 92% opacity, swipe/arrow between images, pinch-zoom, close via swipe-down (mobile) or × top-right (desktop).

## Badge / Tag

`type-label` (uppercase, `+0.06em` tracking), `radius-sm`, `space-1`×`space-2` padding, no border — filled background only.

| Variant   | Background                | Text                  |
| --------- | ------------------------- | --------------------- |
| New       | `color-accent-royal-tint` | `color-accent-royal`  |
| Sale      | `color-sale` at 10% tint  | `color-sale`          |
| Low stock | `color-warning-tint`      | `color-warning`       |
| Sold out  | `color-bg-sunken`         | `color-text-tertiary` |

Filter chips (Shop page) use the same shape but are interactive: default = outline only (`color-border-subtle`), selected = `color-accent-royal-tint` fill + `color-accent-royal` text, with an inline × to remove, `duration-fast` fill transition.

## Alert / Inline Banner

Full-width within its container, `radius-md`, tinted background per semantic color, icon + `type-body-m` message + optional single text-link action, no border. Used for: cart shipping-threshold messaging ("Add $24 more for free shipping"), checkout errors, account notices. Dismissible variants get a small × top-right; non-dismissible ones (payment failed) don't, to force acknowledgment via the retry action instead.

## Toast

Bottom-anchored on mobile (above the bottom nav/sticky bar, `space-4` margin), bottom-left on desktop. `elevation-2`, `radius-md`, `color-bg-surface` background, max-width 360px, icon + one line of text + optional single action link ("View cart"). Enters via translate-up + fade over `duration-base` with `ease-decelerate`; auto-dismisses after 3.5s with a fade-out over `duration-fast`; swipe-to-dismiss on mobile. Never stack more than 2 toasts — a third replaces the oldest instantly.

## Modal (desktop-biased) vs. Bottom Sheet (mobile-biased)

These are the same semantic component rendered differently per breakpoint — one spec, two presentations. Used for: variant/quick-add, filters, sort, size guide, address forms, confirmation dialogs.

|             | Modal (desktop/tablet)                                         | Bottom Sheet (mobile)                                                                                                                           |
| ----------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Position    | Centered, max-width 480–560px depending on content             | Anchored to bottom edge, full width                                                                                                             |
| Entrance    | Fade + scale from 98%→100%, `duration-base`, `ease-decelerate` | Translate up from below viewport, `duration-base`, `ease-decelerate`                                                                            |
| Scrim       | `color-overlay-scrim`, click to dismiss                        | `color-overlay-scrim`, tap to dismiss                                                                                                           |
| Dismiss     | × top-right, `Esc` key, scrim click                            | Drag-down gesture (rubber-band resistance past a threshold, then dismiss), swipe-down flick, scrim tap, explicit close button for accessibility |
| Height      | Content-based, capped at 85vh with internal scroll             | Content-based up to 90vh; long content (e.g. filters) becomes internally scrollable with a fixed sheet-header and fixed action-footer           |
| Grab handle | —                                                              | 32×4px `color-border-strong` bar, centered, top of sheet                                                                                        |

Focus is trapped inside while open; closing returns focus to the trigger element (accessibility requirement, see `12`).

## Accordion

Used for PDP progressive disclosure (description, materials/care, shipping/returns, size guide) and FAQ. Header row: `type-heading-m` or `type-body-l` label + chevron icon, 48px min-height, full-width tap target, 1px `color-border-subtle` divider between items (no divider inside an open panel). Chevron rotates 180° over `duration-fast`. Panel expands via height animation (measure actual content height, animate `0→auto` equivalent, not a fixed guess) over `duration-base`, content fades in slightly after (staggered ~40ms) so text doesn't smear during the height change. Only one PDP accordion section open at a time is _not_ enforced — multiple can be open; this is disclosure, not a wizard.

## Navigation

### Header (desktop/tablet)

Sticky, `color-bg-canvas` background, 1px bottom border on scroll only (transparent border at scroll position 0, fades in border by `space-8` scroll depth — avoids a hard line sitting under a hero image). Logotype centered or left (left-aligned recommended once nav items exist on both sides: left = Shop / Collections / About, right = Search icon / Account icon / Wishlist icon / Cart icon+count). Underline-on-hover for text nav items, `color-accent-royal`, animated width `0→100%` over `duration-fast`.

### Bottom Navigation (mobile only, `<768px`)

Fixed, 56px height + safe-area-inset-bottom padding, `color-bg-surface` background, 1px top border `color-border-subtle`, `elevation-1` shadow (upward). Five items max: **Home, Shop, Search, Wishlist, Account**. Active item: icon switches to filled variant + `color-accent-royal`, label `type-label` beneath icon. Inactive: outline icon, `color-text-secondary`. Cart is deliberately _not_ in the bottom nav — it lives as a persistent icon+count in the top bar on every screen (see `04`) so it doesn't compete for one of the five primary slots, per the brief's "highly visible without consuming navigation space."

### Tabs

Underline style, not pill/boxed. Active tab: `color-text-primary` + `color-accent-royal` 2px underline, animated position/width change (not fade) when switching, `duration-base ease-emphasized`, so the eye can track motion between tabs. Inactive: `color-text-secondary`.

### Breadcrumbs

Desktop/tablet only (mobile relies on back-navigation + bottom nav instead — breadcrumbs add clutter at narrow widths). `type-body-s`, `color-text-secondary`, `color-accent-royal` on the final (current, non-link) crumb, `/` separator in `color-border-strong`.

## Empty / Loading / Error / Success states

Defined once, exhaustively, in `11-ux-states-catalog.md`. Every component/page above must point to that file rather than improvising its own empty/error copy.
