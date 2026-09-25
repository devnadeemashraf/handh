# 06 — Product Detail Page (PDP)

## Overview

The most important page in the system. A large share of first-time visitors land here directly from an Instagram post/reel/story with zero prior context on the brand. The page has two jobs simultaneously, in order: **(1) establish enough trust and clarity in the first viewport that a cold visitor doesn't bounce**, **(2) make purchasing effortless once they've decided.** Everything below the fold is in service of the undecided-but-interested visitor; everything above the fold is in service of the decided-but-impatient one.

## Layout — mobile

**Above the fold, top to bottom:**

1. Top bar: back-chevron + Cart icon only (no page title — the product gallery _is_ the header).
2. Product gallery — full-bleed swipeable carousel (component `03`), `4:5`, dot indicators.
3. Wishlist heart — floating, top-right corner of the gallery, `elevation-1` white circular backing so it's visible over any image.
4. Badge (New/Sale/Low stock) — top-left of gallery, same overlay logic as Product Card.
5. Content padding starts (`space-4` margins):
   - Product name — `type-heading-l`.
   - Price row — `type-price` (+ `type-price-compare` struck through if on sale + a `Sale` badge inline).
   - Rating summary if reviews exist — star row + "(42 reviews)" text link that jumps to the Reviews accordion via anchor scroll.
   - Color selector (if applicable) — swatches + selected color name.
   - Size selector (if applicable) — row of size tap targets + a small "Size guide" text link (`color-accent-royal`) right-aligned on the same row, opens the Size Guide as its own bottom sheet.
   - Quantity selector.
6. **Sticky bottom purchase bar** (persists from here through the rest of the scroll): price (or "from $X" if variant pricing differs) on the left, **Add to Cart** (`secondary`, large) and **Buy Now** (`primary`, large) side-by-side on the right, full-width split 50/50. Height ~64px + safe-area-inset-bottom. This bar appears once the user scrolls past the in-page Add to Cart controls in step 5 and the in-page button scrolls out of view — i.e. there is exactly one set of purchase controls visible at any given scroll position, never two competing simultaneously (in-page button while in view; sticky bar once it isn't).

**Below the fold (progressive disclosure via Accordion component, one after another, none open by default except Description):** 7. **Description** (open by default) — `type-body-l`, ≤68ch measure, short. 8. **Materials & Fabric** — composition, weight/feel notes. 9. **Size Guide** — measurement table (bust/waist/hip/length by size, both cm and in — toggle), plus "how to measure yourself" short instructions. 10. **Care Instructions** — wash/iron/store guidance, short bullet list. 11. **Shipping & Returns** — condensed summary (processing time, delivery estimate, return window) with a text link through to the full `/shipping` and `/returns` pages for detail — PDP gives the essential facts inline, not the full policy. 12. **Reviews** — summary stats (average, distribution bar chart) + individual review cards (name/initials, star rating, date, verified-purchase tag, text, optional customer photo). Paginated ("Show more reviews"), not infinite — reviews are finite content, an explicit end is fine. 13. **Frequently Bought Together** — 2–3 complementary products shown as a horizontal set with a single "Add all to cart" action alongside individual add buttons. 14. **You May Also Like / Related Products** — Product Card carousel, same as Home's pattern, sourced from the same category/collection. 15. **Recently Viewed** — Product Card carousel, populated from the visitor's own browsing (local/session-based, no login required) — appears only if the history is non-empty (see `11` for the empty case, which here just means: omit the section entirely rather than show it empty).

## Layout — desktop

Two-column from the top of content: **left column (55–60%)** is the vertical-scroll image stack described in component `03`; **right column (40–45%)**, sticky within the viewport as the left column scrolls (stops sticking once the left column's images run out, then continues in normal flow into Description/Reviews/etc. below), contains everything in mobile steps 4–6 (badge context, name, price, rating, selectors, quantity, Add to Cart + Buy Now as two full-width stacked buttons rather than a sticky bar — desktop has no thumb-reach constraint forcing a bottom-anchored bar, and a sticky _panel_ achieves the same "always accessible" goal more elegantly at this width).

Below the two-column hero section, Description/Materials/Size Guide/Care/Shipping/Reviews continue as a **single centered column, max 680px**, still accordion-based — desktop width doesn't mean these sections should sprawl into multiple columns; the editorial reading experience stays consistent with mobile's pacing. Frequently Bought Together / Related / Recently Viewed become horizontal multi-card rows (4+ visible) rather than swipeable single-peek carousels.

## Variant logic & availability states

| Situation                                                           | Behavior                                                                                                                                                                                                    |
| ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Product has color variants with different images                    | Selecting a color swaps the gallery to that color's image set (crossfade `duration-base`), does not reset scroll position                                                                                   |
| Selected size out of stock                                          | Size tap-target shows struck-through label; tapping it reveals inline "Notify me when back in stock" with an email field, replacing the Add to Cart/Buy Now actions until a valid (in-stock) size is chosen |
| Whole product out of stock                                          | Gallery + info render normally (still a landing page worth seeing); purchase controls replaced by `secondary` "Notify Me" flow; a `type-label` "Sold Out" badge replaces New/Sale on the gallery            |
| Product coming soon (pre-launch, shared early via Instagram teaser) | Same page shell; price optionally hidden or shown as "From $X"; purchase controls replaced with an email-capture "Notify me at launch"; no fake countdown timer (violates brand voice rule in `01`)         |
| No reviews yet                                                      | Reviews accordion section is omitted entirely, not shown empty                                                                                                                                              |

## Interactions

- **Add to Cart**: button shows brief `loading` state (component `03`) while the request completes (even if near-instant, the transition itself is the feedback), then the cart icon in the top bar/sticky bar performs the cart-count-increment animation (see `13`), and a Toast confirms with a "View cart" action. The user is **not** navigated away from the PDP — this preserves momentum for continued browsing/upsell sections below.
- **Buy Now**: same instant validation, but proceeds directly to `/checkout` with this single item pre-loaded into the order — skips the Cart page entirely for users who already know what they want (this directly serves the "Instagram visitor who wants to buy in seconds" use case named in the brief).
- **Wishlist heart**: fills with the pulse micro-interaction (component `03`), toast confirms, no navigation.
- Accordion sections: standard expand/collapse per component `03`; deep-linking to a specific section (e.g. a "Size guide" link from elsewhere) auto-expands that section and scrolls to it.

## Trust elements woven through (not a separate "trust" block)

Per the brief's "build trust quickly" requirement — trust is distributed through the page rather than concentrated in one badge row: verified-purchase tags on reviews, specific (not vague) shipping/return facts in step 11, real fabric/material specificity in step 8, and consistent photography discipline (per `01`) across every product. A single small trust strip (secure checkout icon + return-window line) is permitted directly above/below the purchase buttons — one line, no badge-wall.
