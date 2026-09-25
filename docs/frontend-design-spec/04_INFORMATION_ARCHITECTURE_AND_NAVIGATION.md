# 04 — Information Architecture & Navigation

## Sitemap

```
/                              Home
/shop                          Shop (all products, filterable)
/collections/[slug]            Category/Collection (New Arrivals, Abayas, Accessories, Modest Wear, seasonal…)
/product/[slug]                Product Detail Page
/search                        Search overlay/results
/cart                          Cart
/checkout                      Checkout (single route, multi-step within it — see 07)
/checkout/confirmation/[order-id]   Order confirmation
/track/[order-id]              Order tracking (also reachable without login via order-id + email/phone lookup)
/account                       Account home
/account/orders                Order history
/account/orders/[order-id]     Order detail
/account/wishlist              Wishlist
/account/addresses             Saved addresses
/account/preferences           Notification / account preferences
/about                         About the Brand (editorial)
/contact                       Contact / Support
/faq                           FAQ
/shipping                      Shipping & Delivery
/returns                       Returns & Exchanges
/legal/privacy, /legal/terms, /legal/refunds, /legal/shipping-policy, /legal/cookies
```

Collections are a **type**, not a hardcoded list — the IA must support adding new `/collections/[slug]` entries without new navigation code, since the brief requires scaling into more categories later.

## Navigation model

Navigation is organized around **intent** (Home / Shop / Search / Wishlist / Account / Cart), never around backend structure (no nav item is literally "Categories" or "Database"). Collections are surfaces users discover _through_ Shop and Home, not a top-level nav destination competing with Shop.

### Mobile (`<768px`)

- **Bottom nav** (fixed, always visible): Home, Shop, Search, Wishlist, Account — see component spec `03`.
- **Top bar** (scrolls away on Home's hero, otherwise sticky): back-chevron (contextual — absent on the 5 bottom-nav root screens, present everywhere else), page title or logotype (Home only), Cart icon with a count badge (`color-accent-royal` filled circle, white number, `type-label` size) — always present, always tappable, opens Cart as a full-screen route (not a drawer, to match "cart continues the shopping app" requirement while still being a first-class page reachable via deep link/back button).
- Search is a bottom-nav destination _and_ a search icon isn't duplicated in the top bar on mobile — one clear entry point avoids redundant affordances.

### Tablet/Desktop (`≥768px`)

- **Header**: logotype (left), primary text nav (Shop, Collections ▾ [reveals New Arrivals/Abayas/Accessories/Modest Wear/Seasonal on hover/click], About) center-left, utility icons right-aligned: Search, Account, Wishlist, Cart+count.
- No bottom nav at this width — the header carries everything.
- Cart icon opens a **slide-over panel** from the right (desktop affordance a bottom sheet doesn't fit) showing the same Cart content/logic as the mobile Cart route; a "View full cart" link inside it goes to `/cart` for the complete page (with recommendations etc.).

### Footer (desktop/tablet primary; a condensed accordion version on mobile beneath bottom-nav-covered content, reachable by scrolling past page content)

Columns: Shop (Shop, New Arrivals, Best Sellers), Help (FAQ, Shipping & Delivery, Returns & Exchanges, Contact), Brand (About, Instagram/social links), Legal (Privacy, Terms, Refund Policy), Newsletter signup input + submit. Logotype + copyright line beneath all columns.

## Wayfinding rules (apply everywhere)

- The active bottom-nav / header item is always visually indicated (see component states in `03`).
- Every non-root page has an unambiguous back action: mobile = top-bar back-chevron mirroring native app back behavior (returns to prior scroll position, not top of a fresh page load, wherever technically feasible); desktop = breadcrumb + browser back both work identically.
- Cart state (count, and a lightweight recent-addition indicator — see Toast in `03`) is visible from literally every screen; the user is never more than the current screen away from seeing what's in their cart.
- Session/auth state does not block browsing: guest users can browse, search, add to cart, wishlist (locally) and reach checkout; account creation is offered but never forced before checkout (see `07`).
