# 05 — Home, Shop, Category & Search

## 5.1 Home

### Overview

First-time visitors from Instagram usually land on a PDP, not Home — so Home's job is to convert _returning_ interest and browsers into believers: it must communicate brand identity fast, then hand off cleanly into product discovery. It is not the primary conversion surface, so it earns the right to be more editorial/slower-paced than Shop or PDP.

### Layout — mobile (primary target)

1. **Hero** — full-bleed editorial image or short (≤6s, muted, no autoplay-with-sound) looping video, `type-display-xl` wordmark/campaign line overlaid in the image's negative space (never on a scrim — the photo is shot to have a calm area for type), one `primary` button ("Shop the Collection") anchored `space-6` from the bottom of the hero. Height: ~85vh so the bottom nav doesn't crowd it, scroll-snap not required.
2. **Brand intro strip** — one sentence (`type-heading-m`) + a "Read our story" text link to `/about`. `space-8` vertical padding, no image, pure typography moment — a deliberate pause after the visual hero.
3. **New Arrivals** — `type-heading-l` section title + "View all" link (top-right of section), horizontal swipeable carousel of Product Cards, 1.4 cards visible at a time (peeking next card signals more content without an explicit arrow).
4. **Featured Collection** — one large editorial banner (image + collection name + short line + button) for the current seasonal/curated collection — this is the merchandising slot the brand re-themes most often.
5. **Best Sellers** — same carousel pattern as New Arrivals, different data source.
6. **Curated collections grid** — 2-column grid of collection tiles (image + name, e.g. "Abayas", "Accessories", "Modest Wear") each linking to `/collections/[slug]`.
7. **Craftsmanship/quality strip** — 3 short items in a horizontally-scrollable or stacked list (e.g. "Considered Fabrics", "Finished by Hand", "Made to Last"), icon + `type-body-m` line each, no long paragraphs here — this is a trust signal, not the About page.
8. **Social proof** — a short row of customer photo/quote cards (reuses the Product Card's image discipline: consistent aspect ratio) pulled from reviews/UGC.
9. **Instagram section** — grid of recent Instagram post thumbnails (3–6), tapping opens the post externally; header links to the brand's Instagram profile. This directly supports the "discovered via Instagram" acquisition loop by making the site feel like a continuation of the feed, not a break from it.
10. **Newsletter** — email input + submit, one short line of value prop ("New arrivals, before anyone else."), inline success state (see `11`), no modal popup version (popups contradict the calm brand feel — this is placed in-flow only).
11. **Footer** — per `04`.

### Layout — desktop delta

- Hero becomes a two-thirds/one-third split option for campaign moments (large image left, headline + CTA in generous whitespace right) _or_ stays full-bleed with centered type — both are valid per-campaign, not a fixed rule, since Home's hero is a merchandising slot that changes seasonally.
- New Arrivals / Best Sellers carousels show 4 cards at once with prev/next arrow controls appearing on container hover (not always visible — keeps the section calm at rest).
- Curated collections grid becomes 3 or 4 columns depending on collection count.
- Craftsmanship strip becomes a 3-column row, not scrollable.

### Interactions

- Hero CTA: `primary` button, standard hover/press states.
- Carousels: swipe (mobile) / drag or arrow-click (desktop); snap-to-card; momentum scroll is native, not custom-physics.
- Scroll-triggered reveal: each major section fades up (`opacity 0→1` + `translateY 12px→0`, `duration-slow`, `ease-decelerate`) once 20% visible, triggered once only — never on every scroll pass, never parallax.

### States

- Skeleton: hero image placeholder (`color-bg-sunken`) + product-card skeletons for carousels while data loads — see `11`.
- Newsletter: inline error (invalid email) and success (see `11`) — no page reload.

---

## 5.2 Shop (product discovery / all products)

### Overview

The primary browse-to-buy surface for users not arriving via a direct PDP link. Must feel fast and uncluttered even with a large catalog eventually.

### Layout — mobile

- Sticky sub-header beneath the main top bar: product count ("128 items") left, **Filter** and **Sort** as two separate pill-shaped ghost buttons right (not one combined "Filter & Sort" button — users scan for one or the other, not both at once).
- Grid: 2 columns, `space-3` gutter, Product Cards (component `03`).
- Infinite scroll with a manual "Load more" button appearing after the first 2 pages (24 items) rather than pure auto-infinite-scroll — gives users a sense of catalog size and avoids the "footer I can never reach" problem; auto-infinite-scroll is acceptable if a footer is intentionally excluded from this route (design decision left to implementation, but must be consistent).
- Filter → opens as a **bottom sheet** (component `03`): sections = Category, Size, Color, Price range (slider), Availability. Sheet footer is fixed: `secondary` "Clear all" + `primary` "Show 42 items" (count updates live as filters are toggled, before the user commits — this live count is important, it's the difference between a filter drawer and a filter _tool_).
- Sort → opens as a smaller bottom sheet, radio-style list: Featured, Newest, Price low–high, Price high–low, Best selling.

### Layout — desktop

- Left sidebar (fixed width ~280px), filters always visible/expanded (accordion per filter group), no sheet needed — this is the "sidebar becomes sheet on mobile" adaptation named in the brief, applied in reverse (sheet is the mobile-native form, sidebar is the desktop-native form of the same filter set).
- Grid: 3–4 columns depending on viewport, same card component, larger gutter (`space-5`).
- Sort remains a sheet-equivalent: a simple dropdown/select next to the item count, top-right of the grid.
- Pagination or "Load more" — same policy as mobile, consistent choice site-wide.

### Interactions

- Applying a filter animates the grid: exiting items fade+shrink slightly, remaining/entering items reflow — `duration-base`, staggered slightly (~20ms per item, capped) so it reads as one cohesive transition, not a jump-cut.
- Active filters appear as removable chips (component `03`) beneath the sticky sub-header, letting users see and undo filter state without reopening the sheet/sidebar.

### States

- **Skeleton** grid on initial load.
- **No results after filtering** → see `11` (distinct from "no products in catalog," which shouldn't happen post-launch but is specced anyway).
- **Loading more** → small centered spinner beneath the grid, not a full-page loader.

---

## 5.3 Category / Collection pages (`/collections/[slug]`)

### Overview

Same underlying grid/filter mechanics as Shop, wrapped in a collection-specific editorial header — this is what gives each collection "its own visual identity while remaining part of the design system," per brief.

### Layout

- **Collection header** (new vs. Shop): full-width banner image (aspect ratio `16:9` mobile, `21:9` desktop) specific to the collection, `type-display-l` collection name overlaid or immediately beneath, one short (`type-body-l`, 1–2 sentences) editorial description of the collection's intent ("Considered layers for cooler days" for a seasonal collection, etc.). This block is swappable per collection without touching layout code — it's data (image + name + description), not a bespoke page.
- Below the header: identical Filter/Sort/Grid pattern as Shop (§5.2), pre-filtered to this collection, with the collection's own filter facets (a "Seasonal" collection might not need a "Category" filter if it's single-category, for example — facets shown are driven by what actually varies within the collection's product set).

### States

Same as Shop (§5.2), plus: an **empty collection** (coming-soon seasonal drop with 0 products yet) — see `11`.

---

## 5.4 Search

### Overview

Must feel instant and forgiving — a large share of Shop-page traffic on fashion sites is search-driven once a catalog grows.

### Layout — mobile

- Full-screen overlay (not a small dropdown) opened from the bottom-nav Search tab: top has a single focused text input with a cancel/close action beside it, auto-focused with keyboard raised immediately.
- **Empty query state**: "Recent searches" (chips, max 6, most recent first, individually removable via a small × per chip) above "Popular searches" (chips, editorially curated, not just top-queried) above a small 2×2 grid of Category suggestions (image + label) as a fallback browse path for users who opened search without a specific product in mind.
- **Typing (debounced ~200ms)**: results appear grouped — a horizontal row of up to 4 matching Product Cards (image, name, price only — condensed) at top, followed by a vertical list of matching Category/Collection names beneath, each row tap-through immediately.
- **No results**: see `11`.

### Layout — desktop

Same content model, presented as a large centered overlay/panel beneath the header search icon (not full browser-width) — width ~640px, `elevation-2`, appears with a `duration-base` fade+slight-scale, dismiss via Esc/click-outside/× .

### Interactions

- Each keystroke re-runs the debounced query; a subtle inline spinner replaces the search icon in the input (not a full loading blocker) while a request is in flight.
- Selecting any suggestion navigates immediately and adds the _resolved product/category name_ (not the raw typed string) to Recent Searches — keeps recent searches meaningful.

### States

Skeleton for in-flight results (2–3 grey card placeholders), empty/no-results (`11`), and the "just opened, no query yet" state above are the three states this screen needs.
