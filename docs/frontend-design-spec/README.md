# The Haya Collection — Design & Build Specification

A complete, implementation-ready blueprint for a premium modest-fashion PWA. Written for an AI coding agent or developer to build directly from — every visual decision is expressed as a token, every screen as a layout + interaction table, not as prose to be reinterpreted.

## How to use this package

1. Start with **01–03** (brand, tokens, components) — this is the vocabulary every later file assumes.
2. **04** defines the sitemap and navigation shell that wraps every page.
3. **05–10** are page-by-page specs, mobile-first with a desktop delta. Each references components from `03` by name and tokens from `02` by name — never raw values.
4. **11** is a cross-cutting catalog of the non-happy-path states (empty, error, loading, etc.). Page specs point into it rather than repeating it.
5. **12** and **13** are cross-cutting rulebooks (responsive behavior, accessibility, motion) that apply to everything built from `05–10`.

## Build assumptions

- **Platform**: Progressive Web App. Mobile is the primary target; desktop is the same product on a larger canvas, not a separate design.
- **Breakpoints**: mobile `<768px`, tablet `768–1023px`, desktop `≥1024px` (large desktop `≥1440px` gets a wider max-width, not new layout logic).
- **Stack-agnostic**: specs describe structure and behavior, not markup. They translate equally well to React/Next.js, Vue, or a templated storefront (e.g. a headless Shopify build).
- **Content model implied by these specs**: Product (name, price, compare-at price, images[], variants: size/color, description, materials, care, specs, stock state), Collection, Order, Customer, Address, Review. Build these as the data layer before wiring pages.

## Contents

| File                                            | Covers                                                                           |
| ----------------------------------------------- | -------------------------------------------------------------------------------- |
| `01-brand-and-visual-identity.md`               | Name treatment, logotype, voice, photography direction                           |
| `02-design-tokens.md`                           | Color, type scale, spacing, radius, elevation, motion tokens                     |
| `03-component-library.md`                       | Buttons, inputs, product card/gallery, badges, modals, sheets, nav, toasts, etc. |
| `04-information-architecture-and-navigation.md` | Sitemap, header/bottom-nav/footer, routing                                       |
| `05-home-and-discovery.md`                      | Home, Shop/Collection grid, Category pages, Search                               |
| `06-product-detail-page.md`                     | PDP — the primary landing surface for Instagram traffic                          |
| `07-cart-and-checkout.md`                       | Cart, Checkout                                                                   |
| `08-post-purchase.md`                           | Order confirmation, order tracking, order history/details                        |
| `09-account-and-wishlist.md`                    | Account/profile, wishlist                                                        |
| `10-content-and-trust-pages.md`                 | About, Contact, FAQ, Shipping & Delivery, Returns & Exchanges, legal pages       |
| `11-ux-states-catalog.md`                       | Every empty/loading/error/success state, defined once                            |
| `12-responsive-and-accessibility.md`            | Breakpoint adaptation rules, WCAG AA checklist                                   |
| `13-motion-and-microinteractions.md`            | The motion language and every named animation                                    |

## Non-negotiables carried through every file

- No component exceeds `radius-md` (4px). No pill buttons, no heavy card shadows.
- One accent color (`color-accent-royal`) used sparingly — never as a background fill for large areas.
- Every interactive element has a minimum 44×44px touch target on mobile.
- Every list/grid has a defined skeleton, empty, and error state before it ships.
- Motion default is 180–240ms with a standard ease; nothing bounces, nothing loops.
