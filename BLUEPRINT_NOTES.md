# Engineering Notes & Blueprint Adaptations

This document records architectural adaptations, practical tooling realities, and critical conventions discovered and implemented while executing the initial phases of the H&H platform based on [BLUEPRINT.md](file:///home/nadeemashraf/Projects/H&H/BLUEPRINT.md).

It serves as an authoritative guide for both human engineers and AI coding assistants working on subsequent modules.

---

## 1. Architectural & Domain Adaptations

### 1.1 Server-Driven UI (SDUI) vs. Static Templates

- **Blueprint Baseline:** The original blueprint planned standard static storefront and product pages.
- **Adaptation:** Implemented a **Server-Driven UI (SDUI)** pattern. Storefront colors, typography variables, announcement bars, hero copy/CTAs, and reassurance badges are stored as validated JSON in `stores.settings.storefront` (`StorefrontConfigSchema` in `@hh/domain`).
- **Why It Matters:** The brand image, promotional announcements, and color palettes can be modified instantly in the database or via future admin dashboards without rebuilding or redeploying code.
- **Key Files:**
  - [`packages/domain/src/catalog/storefront-config.ts`](file:///home/nadeemashraf/Projects/H&H/packages/domain/src/catalog/storefront-config.ts)
  - [`apps/web/src/components/layout/ThemeInjector.tsx`](file:///home/nadeemashraf/Projects/H&H/apps/web/src/components/layout/ThemeInjector.tsx)

### 1.2 Global E-Commerce Taxonomy vs. Niche Categories

- **Blueprint Baseline:** Early blueprint drafts conflated niche product use-cases (e.g., "Modest Wear", "Nose-Piece") as top-level categories.
- **Adaptation:** Standardized taxonomy strictly adhering to global e-commerce conventions:
  - Top-Level Categories: `Accessories`, `Apparel & Clothing`
  - Subcategories: `Jewelry`, `Modest Wear`
  - Products: Handcrafted nose-pieces are cataloged under `Accessories -> Jewelry` with modest wear styling attributes.
- **Why It Matters:** Ensures H&H can scale horizontally into Abayas, Hijabs, Caps, and Men's collections without redesigning category relationships or rewriting database schemas.
- **Key Files:**
  - [`packages/db/src/schema/categories.ts`](file:///home/nadeemashraf/Projects/H&H/packages/db/src/schema/categories.ts)
  - [`packages/db/src/seed.ts`](file:///home/nadeemashraf/Projects/H&H/packages/db/src/seed.ts)

### 1.3 Inventory Reservation Sequencing

- **Blueprint Baseline:** In `BLUEPRINT.md` Section 50, "Milestone 8: Inventory reservation/concurrency correctness" is listed _after_ Cart (Milestone 4), Checkout (Milestone 5), Razorpay (Milestone 6), and Webhooks (Milestone 7).
- **Adaptation & Warning:** In a high-integrity financial system, stock availability and reservation logic cannot be an afterthought added after checkout.
- **Action for Subsequent Modules:** In Milestone 1, we already created the necessary tables (`inventory_levels`, `inventory_reservations`) with database check constraints (`reserved <= on_hand`). When implementing Cart and Checkout (Milestones 4 & 5), the system must check available units (`on_hand - reserved`) and create pending inventory reservations during Razorpay order generation to prevent overselling 20-unit limited inventory drops.

### 1.4 Mobile-First Design & Progressive Web App (PWA) Scope

- **Context & Imperative:**
  - **Customer Front:** Discovery is overwhelmingly Instagram-driven (Stories, Reels, Bio links). Greater than 90% of shoppers will land on mobile devices via in-app browsers or mobile Safari/Chrome.
  - **Admin Front:** The store owner must be able to inspect order queues, manage inventory, and enter courier tracking numbers on-the-go from a mobile phone (e.g., at the India Post or DTDC dispatch counter).
- **Design Standard:**
  - Every UI layout (storefront, cart, checkout, and admin dashboard) must be engineered strictly **mobile-first**.
  - All interactive elements must adhere to standard mobile tap targets (minimum 44x44px touch targets, sticky bottom action bars, clean drawer sheets over intrusive desktop modals, zero horizontal overflow).
- **PWA Extensibility Scope:**
  - The customer-facing web application architecture must preserve clean boundaries for turning into an installable **Progressive Web App (PWA)**.
  - Scope includes `manifest.json`, web app icons, `display: standalone` viewport configurations, and lightweight offline service-worker caching for shell assets, enabling an installable app experience without maintaining separate iOS/Android codebases.

---

## 2. Tooling, Monorepo & TypeScript Nuances

### 2.1 Ultra-Strict TypeScript (`exactOptionalPropertyTypes: true`)

- **Baseline:** `tsconfig.base.json` enables `exactOptionalPropertyTypes: true` alongside `noUncheckedIndexedAccess`.
- **Adaptation Rule:** In TypeScript with `exactOptionalPropertyTypes`, an interface with `{ prop?: string }` permits `{ prop: 'value' }` or `{}` (omitted), but **strictly rejects** `{ prop: undefined }`.
- **Convention:** When passing values from database nullable columns, search parameters, or optional props, explicitly declare them as:
  ```typescript
  // Correct
  export interface ComponentProps {
    optionalField?: string | undefined;
  }
  ```
  Or omit the key entirely during object creation:
  ```typescript
  const options = { ...(slug ? { categorySlug: slug } : {}) };
  ```

### 2.2 Programmatic Database Migration Runner

- **Baseline:** The blueprint references standard Drizzle migration commands.
- **Adaptation:** Running `drizzle-kit` interactively in background tasks or containerized CI environments can stall waiting for interactive TTY confirmations.
- **Implementation:** Created [`packages/db/src/migrate.ts`](file:///home/nadeemashraf/Projects/H&H/packages/db/src/migrate.ts) using Drizzle's native Node-Postgres `migrate()` function. It executes migrations deterministically without interactive prompts. Run via `pnpm db:migrate`.

### 2.3 Local Cloud Storage Emulation (Floci / Local S3)

- **Baseline:** The blueprint specifies Cloudflare R2 / S3 for media storage, primarily focusing on VPS production.
- **Adaptation:** For local development, Floci runs on port `4566:4566` with bucket `hh-media-dev`. The environment validator ([`packages/config/src/env.ts`](file:///home/nadeemashraf/Projects/H&H/packages/config/src/env.ts)) supports custom S3 endpoint URLs, path-style addressing (`s3ForcePathStyle`), and test credentials alongside production S3/R2 configurations.

---

## 3. Operational & Engineering Discipline

### 3.1 Git Commit Message Rule

- **CRITICAL RULE:** **Never mention milestone numbers in any Git commit message** (e.g., do NOT write "Milestone 3 complete").
- **Convention:** Always use semantic commits focused on features, fixes, or infrastructure:
  - `feat: implement guest cart with local storage persistence`
  - `fix: prevent duplicate inventory reservation during payment retry`
  - `chore: update database migration scripts`

### 3.2 Financial & Inventory Correctness

- **Zero Floating-Point Math:** All prices, discounts, delivery fees, and order amounts must be represented in integer minor units (paise for INR) using the [`Money`](file:///home/nadeemashraf/Projects/H&H/packages/domain/src/money.ts) value object.
- **Database Authoritative:** Analytics (PostHog), client storage, and browser sessions are never sources of truth for price, inventory, or order status. The PostgreSQL database with row-level locks and transactions is always authoritative.
