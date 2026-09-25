# Frontend Architecture & System Design Specification

## Executive Summary

This document establishes the architectural foundation, engineering principles, design token framework, component hierarchy, and tech stack choices for the frontend re-architecture of the **H&H / Haya Collection** platform. It bridges the generic design specifications in `docs/frontend-design-spec/` with the production Next.js 15, React 19, TypeScript monorepo codebase.

Any engineer or AI agent working on this repository must consult this document as the authoritative architectural blueprint for all user interface, design system, and client-side application decisions.

---

## 1. High-Level Architectural Vision

The target application is a **high-fashion, modest-luxury Progressive Web App (PWA)** engineered with an editorial aesthetic: calm, typography-first, unhurried, and precise.

### Core Architectural Pillars

1. **Adaptive Form, Not Just Responsive Size**: Components adapt their interaction archetype to the viewport. A persistent sidebar filter on desktop becomes a native bottom sheet on mobile; a vertical image stack on desktop becomes a swipeable edge-to-edge carousel on mobile.
2. **Speed & Perceived Instantaneity**: Sub-100ms visual response to touch interactions. Optimistic state updates for carts and wishlists, debounced server mutations, and layout-preserving skeletons prevent Cumulative Layout Shift (CLS = 0).
3. **Restrained Visual Polish**: Strict adherence to design tokens. **No radius exceeds `radius-md: 4px`** anywhere in the system (no pill buttons, no heavy rounded cards). Exactly one accent color (`#2E3454` Royal) used purposefully for CTA backgrounds and active indicators—never as large background fills.
4. **Resilient Offline-First PWA**: Service Worker caching with stale-while-revalidate for catalog pages, offline fallback routes, manifest shortcuts, and install prompt affordances.
5. **Universal Brand Single Source of Truth**: All brand labels, copy, contact metadata, and legal entities cascade from `@hh/domain`'s `BrandIdentity` module, with zero orphan strings.

---

## 2. Tech Stack Decisions & Rationale

| Layer                    | Technology                            | Version             | Rationale & Architectural Decisions                                                                                                                                                   |
| :----------------------- | :------------------------------------ | :------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Framework**            | **Next.js (App Router)**              | `^15.2.1`           | Native Server Components (RSC) for zero-JS initial payload on content/trust pages; streaming SSR with Suspense boundaries; Route Handlers for BFF API orchestration.                  |
| **UI Runtime**           | **React**                             | `^19.0.0`           | React 19 Actions for form transitions (`useActionState`, `useOptimistic`); concurrent rendering; eliminates hydration mismatches via clean server/client separation.                  |
| **Component Primitives** | **Radix UI + shadcn/ui**              | Headless primitives | Unstyled, accessible, fully keyboard-navigable and screen-reader compliant (WAI-ARIA). Allows total customization to strict tokens without bloated default styles.                    |
| **Styling Engine**       | **Tailwind CSS + CSS Variables**      | `^3.4.19`           | Utility-first compile-time CSS with zero runtime overhead. Extended with design tokens mapped directly to CSS variables for dynamic brand theme injection.                            |
| **Typography**           | **Next.js Google Fonts**              | Native optimization | **Fraunces** (Variable serif for display headlines) + **Inter** (UI, body copy, and tabular numbers for pricing/counters). Preloaded at build time with `font-display: swap`.         |
| **Icons**                | **Lucide React**                      | `^1.47.0`           | Consistent 1.5px/2px stroke weight line icons that complement the restrained editorial aesthetic.                                                                                     |
| **State Management**     | **React Context + Hooks**             | Native React        | Lightweight domain contexts (`CartContext`, `AuthContext`) paired with browser `localStorage` and URL query params (`useSearchParams`) for shareable, bookmarkable filter/sort state. |
| **PWA & Storage**        | **Custom Service Worker + Cache API** | Standard Web API    | Fine-grained cache strategies (`CacheFirst` for static assets and CDN images, `NetworkFirst` with cache fallback for catalog, offline queue for cart sync).                           |
| **Validation & Schema**  | **Zod**                               | `^3.24.2`           | Runtime schema validation shared between client forms and backend API routes via `@hh/domain`.                                                                                        |
| **Testing**              | **Vitest + React Testing Library**    | `^3.0.7`            | Fast in-memory unit and integration testing; verifies accessible roles, keyboard interactions, and responsive behaviors.                                                              |

---

## 3. Design Tokens & Styling System

The styling layer is organized around **three token tiers**:

1. **Global Tokens** (raw values in `tailwind.config.ts` and `globals.css`)
2. **Semantic Tokens** (purpose-based CSS custom properties)
3. **Component Tokens** (utility compositions in `cva` variants)

### 3.1 Color System

```css
:root {
  /* Neutrals: Calm ivory canvas & crisp surface */
  --color-bg-canvas: #faf7f2; /* Page background */
  --color-bg-surface: #ffffff; /* Cards, modals, inputs */
  --color-bg-sunken: #f1ece3; /* Skeletons, disabled fields */
  --color-text-primary: #1f1b18; /* 14.8:1 contrast on canvas (WCAG AAA) */
  --color-text-secondary: #6b6459; /* Metadata, captions, secondary copy */
  --color-text-tertiary: #9c9483; /* Placeholders, disabled text */
  --color-border-subtle: #e7e0d4; /* Hairline borders (1px) */
  --color-border-strong: #d2c8b6; /* Input hover/active boundaries */
  --color-overlay-scrim: rgba(31, 27, 24, 0.45);

  /* Accent: Royal Blue (Restrained luxury) */
  --color-accent-royal: #2e3454; /* Primary CTA, active nav */
  --color-accent-royal-hover: #252a45; /* Hover / pressed state */
  --color-accent-royal-tint: #e7e9f0; /* Active chips, selected swatches */

  /* Semantic Feedback */
  --color-success: #5b6e4f;
  --color-success-tint: #eaefe3;
  --color-error: #9c4a3b;
  --color-error-tint: #f3e7e2;
  --color-warning: #8a6d3b;
  --color-warning-tint: #f2e9d8;
  --color-sale: #7a2e2e; /* Deep crimson for sale pricing */
}
```

### 3.2 Strict Radius Constraints

> [!IMPORTANT]
> **No component in the entire design system may exceed `radius-md` (4px).**
>
> - `radius-sm`: `2px` (Inputs, buttons, chips, badges)
> - `radius-md`: `4px` (Cards, product images, modals, bottom sheets)
> - `radius-full`: `999px` (Strictly reserved for avatar thumbnails, cart-count dot, and color swatches)
>   Pill buttons, 8px/12px/16px rounded card corners are strictly prohibited.

### 3.3 Typography Hierarchy

- **Display Serif**: `Fraunces` variable serif (`font-display: swap; font-optical-sizing: auto;`).
- **Body & Numerals**: `Inter` sans-serif (`font-feature-settings: 'tnum' on, 'cv05' on;`). All prices and quantities enforce tabular numerals to prevent layout jiggle during counters or cart recalculations.

| Scale Token  | Mobile (px) | Desktop (px) | Weight                 | Family   |
| :----------- | :---------- | :----------- | :--------------------- | :------- |
| `display-xl` | 36 / 42     | 64 / 70      | 500                    | Fraunces |
| `display-l`  | 30 / 36     | 48 / 54      | 500                    | Fraunces |
| `heading-l`  | 22 / 28     | 32 / 38      | 500                    | Fraunces |
| `heading-m`  | 18 / 24     | 22 / 28      | 500                    | Fraunces |
| `body-l`     | 16 / 24     | 17 / 26      | 400                    | Inter    |
| `body-m`     | 14 / 22     | 15 / 23      | 400                    | Inter    |
| `body-s`     | 13 / 18     | 13 / 18      | 400                    | Inter    |
| `label`      | 12 / 16     | 12 / 16      | 500 (+0.06em tracking) | Inter    |
| `price`      | 16 / 22     | 18 / 24      | 600 (tabular numbers)  | Inter    |

### 3.4 Elevation & Shadows

Depth is achieved via **1px hairline borders first, shadow second**:

- `elevation-0`: `none; border: 1px solid var(--color-border-subtle)` (Standard cards)
- `elevation-1`: `0 1px 3px rgba(31, 27, 24, 0.06)` (Sticky navigation, dropdowns)
- `elevation-2`: `0 8px 24px rgba(31, 27, 24, 0.10)` (Modals, bottom sheets, toasts)

---

## 4. Component Hierarchy & Code Organization

The frontend codebase is partitioned cleanly into four distinct layers:

```
apps/web/src/
├── app/                              # Next.js App Router (Pages, Layouts, Route Handlers)
│   ├── (storefront)/                 # Public storefront route group
│   │   ├── page.tsx                  # Home (Editorial magazine spread)
│   │   ├── shop/page.tsx             # Shop / Catalog browse
│   │   ├── collections/[slug]/       # Curated category collections
│   │   ├── products/[slug]/          # Product Detail Page (PDP)
│   │   ├── cart/page.tsx             # Full-screen mobile / desktop cart
│   │   ├── checkout/page.tsx         # 5-step accordion checkout
│   │   ├── track/[reference]/        # 6-stage order tracking
│   │   ├── account/                  # Patron account hub & orders
│   │   └── (trust)/                  # About, FAQ, Contact, Shipping, Legal
│   └── api/                          # Backend BFF routes (Orders, Razorpay, Auth)
│
├── components/
│   ├── ui/                           # Layer 1: Headless / shadcn primitives (re-styled to tokens)
│   │   ├── button.tsx                # Primary, secondary, ghost, destructive (lg/md/sm)
│   │   ├── input.tsx                 # 44px height, reserved error space
│   │   ├── badge.tsx                 # Radius-sm, semantic tints
│   │   ├── modal-sheet.tsx           # Unified: Modal on desktop >=768px, Bottom Sheet on mobile
│   │   ├── accordion.tsx             # Hairline dividers, measured content height
│   │   ├── toast.tsx                 # Bottom-anchored mobile, bottom-left desktop
│   │   ├── alert.tsx                 # Inline contextual banners
│   │   ├── skeleton.tsx              # Shimmer sweep animation
│   │   └── stepper.tsx               # Quantity and stage tracking steppers
│   │
│   ├── design-system/                # Layer 2: Pattern blocks & micro-components
│   │   ├── ProductCard.tsx           # 4:5 aspect ratio, hover swap (desktop), quick-add (mobile)
│   │   ├── ProductGallery.tsx        # Carousel (mobile) / Vertical Stack (desktop)
│   │   ├── SizeSelector.tsx          # 44x44px targets, out-of-stock strike-through
│   │   ├── ColorSwatchPicker.tsx     # 32px circular swatches with 2px offset ring
│   │   ├── FreeShippingBar.tsx       # Gamified threshold progress meter
│   │   └── OrderTimeline.tsx         # 6 stages, horizontal (desktop) / vertical (mobile)
│   │
│   ├── layout/                       # Layer 3: Shell & Global Chrome
│   │   ├── Header.tsx                # Sticky header with border-on-scroll
│   │   ├── MobileBottomNav.tsx       # 5 items: Home, Shop, Search, Wishlist, Account
│   │   ├── DesktopCartDrawer.tsx     # Slide-over panel from header cart icon
│   │   ├── SearchOverlay.tsx         # Full-screen mobile / 640px desktop overlay
│   │   └── Footer.tsx                # Multi-column desktop / accordion mobile
│   │
│   └── views/                        # Layer 4: Composed Page Views & Sections
│       ├── home/                     # Hero, Curated Grids, Craftsmanship, Instagram UGC
│       ├── shop/                     # Filter drawer/sidebar, sort list, product grid
│       ├── pdp/                      # Sticky purchase bar, progressive accordions
│       ├── checkout/                 # 5-step accordion form, order summary
│       └── account/                  # Order cards, address manager, preference toggles
│
├── context/                          # Client state providers
│   ├── CartContext.tsx               # Cart items, optimistic updates, drawer open/close
│   ├── AuthContext.tsx               # User profile, patron status, login modals
│   └── WishlistContext.tsx           # Saved items with pulse micro-interactions
│
└── lib/                              # Client utilities, analytics, service worker helpers
    ├── formatters.ts                 # Tabular currency formatting (INR ₹)
    ├── pwa-utils.ts                  # Service worker registration & install prompts
    └── haptics.ts                    # Subtle vibration feedback for mobile interactions
```

---

## 5. Responsive Interaction Patterns

| Component / Feature      | Mobile (`< 768px`)                                                                     | Desktop (`≥ 1024px`)                                                                |
| :----------------------- | :------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------- |
| **Main Navigation**      | **Fixed Bottom Navigation Bar** (5 items: Home, Shop, Search, Wishlist, Account).      | **Sticky Top Header** with text links, category dropdowns, and right utility icons. |
| **Cart Access**          | Dedicated **`/cart` full-screen route**. Persistent cart badge in top bar.             | **Slide-over Drawer** from right edge + `/cart` full view option.                   |
| **Product Filtering**    | **Bottom Sheet** with drag-to-dismiss handle and live product count ("Show 42 items"). | **Sticky Left Sidebar** (280px width) with expanded accordions.                     |
| **Product Gallery**      | **Edge-to-edge swipeable carousel** (4:5 ratio) with 6px dot indicators.               | **Vertical image stack** (55-60% width) with generous 32px spacing.                 |
| **Purchase Controls**    | In-page buttons scroll to **Sticky Bottom Bar** (Add to Bag + Buy Now 50/50).          | **Sticky Right Purchase Panel** (40-45% width) staying in viewport.                 |
| **Checkout Flow**        | Single-column 5-step accordion; order summary collapsed behind a top bar.              | Two-column split: left 5-step accordion, right sticky order summary.                |
| **Order Tracking**       | **Vertical Stepper** with pulsing active ring and stage timestamps.                    | **Horizontal Stepper** across top of viewport.                                      |
| **Quick Add Affordance** | Persistent "+" icon button on cards (no hover exists on touch).                        | Card hover reveals secondary photo cross-fade + animated "Quick Add" button.        |

---

## 6. Motion & Micro-Interaction Engine

Motion serves four purposes only: **Entrance/Exit**, **State Change Feedback**, **Loading**, and **Ambient Liveness**.

- **Tokens**:
  - `duration-instant`: `100ms` (Button scale 100% → 98% on touch)
  - `duration-fast`: `180ms` (Chevron rotate, swatch select, chip fill)
  - `duration-base`: `240ms` (Accordions, bottom sheets, toast entrances)
  - `duration-slow`: `400ms` (Scroll section reveals, skeleton sweep)
- **Easings**:
  - `ease-decelerate`: `cubic-bezier(0, 0, 0.2, 1)` (All entering surfaces)
  - `ease-accelerate`: `cubic-bezier(0.4, 0, 1, 1)` (All exiting surfaces)
- **Reduced Motion Support**:
  - When `@media (prefers-reduced-motion: reduce)` is active, all transforms and position shifts are disabled; state transitions fall back to instant or subtle opacity changes.

---

## 7. Performance & PWA Metrics Targets

- **Lighthouse Performance Score**: `≥ 95` on mobile.
- **Core Web Vitals**:
  - **LCP (Largest Contentful Paint)**: `< 1.8s` (via Next.js Image priority optimization on hero/PDP).
  - **FID / INP (Interaction to Next Paint)**: `< 100ms` (instant optimistic UI feedback on cart/wishlist).
  - **CLS (Cumulative Layout Shift)**: `0.00` (aspect-ratio locks on images, skeleton geometry matches exact components, reserved layout space for form errors).
- **Bundle Budget**: `< 120 kB` shared initial JavaScript.
