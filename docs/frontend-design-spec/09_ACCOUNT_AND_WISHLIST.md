# 09 — Account & Wishlist

## 9.1 Account (`/account`)

### Overview

Should feel like "part of the same mobile application," per brief — not a bolted-on settings panel with a different visual language.

### Layout — mobile

1. Header: avatar/initials circle (`radius-full`) + name + email, `space-4` padding, sits directly beneath the top bar (no separate "banner" treatment — kept modest, consistent with brand tone).
2. Navigation list (each row 56px, `type-body-l` label + leading icon + trailing chevron, 1px `color-border-subtle` divider between rows — this _is_ effectively an accordion/list-nav pattern, reused rather than invented fresh):
   - Orders → `/account/orders`
   - Wishlist → `/account/wishlist`
   - Saved Addresses → `/account/addresses`
   - Account Preferences → `/account/preferences`
   - Notification Preferences → (sub-section of Preferences, or its own row — implementation choice; spec requires both concerns exist, not that they're separate routes)
3. **Logout** — visually separated at the bottom (own section, `space-6` gap above it, `color-error` text, no icon needed) so it doesn't sit adjacent to functional rows and get tapped by accident.

Since Account is also a bottom-nav root, it's reachable in one tap at all times — this list-of-rows pattern is intentionally simple because the bottom nav already handles top-level app navigation; Account's job is just to fan out into its own sub-areas cleanly.

### Layout — desktop

Left sidebar (persistent list of the same rows, no chevrons needed since there's no "drill in" — clicking a row loads its content in the right panel) + right content panel showing the selected section — a classic settings-panel split, appropriate here specifically because desktop account management benefits from not losing sidebar context (unlike Shop, where full immersion is more valuable than a persistent sidebar of _this kind_).

### 9.1a Saved Addresses

List of address cards (name, full address, phone, "Default" badge on one), each with Edit/Delete text actions, + "Add new address" as a `secondary` button/row at the top or bottom of the list. Add/Edit opens as bottom sheet (mobile) / modal (desktop) with the standard address form (same fields as Checkout §07).

### 9.1b Account Preferences

Simple form: name, email, password-change action (opens its own modal/sheet, not inline fields, since it needs current-password confirmation), account deletion (if required by policy — placed at the very bottom, `ghost` destructive style, requires confirmation dialog).

### 9.1c Notification Preferences

List of toggle rows: Order updates (recommend locked "on," it's transactional), Promotions & new arrivals, Restock alerts (relevant given the PDP's "Notify me" flows in `06`) — each a simple on/off switch, `duration-fast` slide transition, immediate save (no separate "Save" button for toggles — toast confirms "Preferences updated" per change, debounced if multiple are flipped quickly).

---

## 9.2 Wishlist (`/account/wishlist`, also reachable directly from bottom nav)

### Layout — mobile

Grid, same 2-column Product Card pattern as Shop, but each card's overlay actions differ: the heart icon is _always filled_ (it's already wishlisted — tapping it removes, with the same pulse-then-empty animation reversed, and an undo Toast) and a persistent "Add to bag" quick-action is always visible beneath the price (not hover-revealed) since the whole point of this screen is fast re-conversion.

- If a wishlisted item has variants (size/color), tapping "Add to bag" opens the same quick-add bottom sheet as elsewhere rather than guessing a variant.
- Availability is shown inline: in-stock items render normally; out-of-stock wishlisted items get the "Sold Out" badge and their "Add to bag" action is replaced with "Notify me" — consistent with PDP's out-of-stock logic (`06`), never silently hidden from the wishlist.

### Layout — desktop

Same grid, 3–4 columns, no structural change beyond column count — this screen doesn't need a desktop-specific layout idiom beyond the shared Product Card grid rules already defined in `05`.

### Recommendations

Beneath the wishlist grid: "You might also like" — a standard Product Card carousel, sourced from the categories represented in the wishlist.

### States

Empty wishlist — see `11`.
