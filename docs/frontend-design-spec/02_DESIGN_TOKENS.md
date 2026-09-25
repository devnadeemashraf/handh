# 02 — Design Tokens

All later specs reference these by name. Implement as CSS custom properties / a theme object — never hardcode the raw values inside components.

## Color

### Neutrals (the base of the whole UI)

| Token                  | Value                 | Usage                                                           |
| ---------------------- | --------------------- | --------------------------------------------------------------- |
| `color-bg-canvas`      | `#FAF7F2`             | Page background (warm ivory)                                    |
| `color-bg-surface`     | `#FFFFFF`             | Cards, sheets, modals, inputs — anything sitting "above" canvas |
| `color-bg-sunken`      | `#F1ECE3`             | Skeleton loaders, disabled fields, subtle section breaks        |
| `color-text-primary`   | `#1F1B18`             | Headings, body copy, primary buttons' label on light            |
| `color-text-secondary` | `#6B6459`             | Metadata, captions, secondary body copy                         |
| `color-text-tertiary`  | `#9C9483`             | Placeholder text, disabled text, timestamps                     |
| `color-border-subtle`  | `#E7E0D4`             | Hairline dividers, card outlines, input borders (default)       |
| `color-border-strong`  | `#D2C8B6`             | Input borders (focus-adjacent), active filter chips             |
| `color-overlay-scrim`  | `rgba(31,27,24,0.45)` | Behind modals / bottom sheets                                   |

### Accent (royal) — used sparingly

| Token                      | Value     | Usage                                                                     |
| -------------------------- | --------- | ------------------------------------------------------------------------- |
| `color-accent-royal`       | `#2E3454` | Primary CTA background, active nav indicator, link color, focus ring      |
| `color-accent-royal-hover` | `#252A45` | Hover/pressed state of the above                                          |
| `color-accent-royal-tint`  | `#E7E9F0` | Selected-state background (e.g. active filter chip, selected size swatch) |

### Semantic

| Token                | Value     | Usage                                                   |
| -------------------- | --------- | ------------------------------------------------------- |
| `color-success`      | `#5B6E4F` | Success text/icon (order confirmed, in stock)           |
| `color-success-tint` | `#EAEFE3` | Success banner/toast background                         |
| `color-error`        | `#9C4A3B` | Error text/icon, destructive actions                    |
| `color-error-tint`   | `#F3E7E2` | Error banner/toast background, invalid-field background |
| `color-warning`      | `#8A6D3B` | Low stock, pending states                               |
| `color-warning-tint` | `#F2E9D8` | Warning banner background                               |
| `color-sale`         | `#7A2E2E` | Sale price text and sale badge (deep, not bright red)   |

Contrast check: `color-text-primary` on `color-bg-canvas` = 14.8:1. `color-accent-royal` on `color-bg-surface` = 8.9:1. Both clear WCAG AA for all text sizes.

## Typography

- **Display/heading family**: `Fraunces` (variable serif — soft, editorial, slightly quirky at large sizes, calms down at small sizes). Fallback stack: `"Fraunces", "Iowan Old Style", "Palatino Linotype", Georgia, serif`.
- **UI/body family**: `Inter`. Fallback stack: `"Inter", -apple-system, "Segoe UI", Roboto, sans-serif`.
- Never mix in a third family. Numerals (prices) use `Inter` even inside serif-set headings, tabular-nums enabled for prices and quantities so they don't jitter.

### Scale (mobile → desktop)

| Token                | Mobile (size/line) | Desktop (size/line) | Weight | Family   | Usage                                                       |
| -------------------- | ------------------ | ------------------- | ------ | -------- | ----------------------------------------------------------- |
| `type-display-xl`    | 36/42              | 64/70               | 500    | Fraunces | Hero headline (Home, About)                                 |
| `type-display-l`     | 30/36              | 48/54               | 500    | Fraunces | Page H1 (Collection title, PDP brand mark treatment)        |
| `type-heading-l`     | 22/28              | 32/38               | 500    | Fraunces | Section headers ("New Arrivals")                            |
| `type-heading-m`     | 18/24              | 22/28               | 500    | Fraunces | Card group titles, modal titles                             |
| `type-body-l`        | 16/24              | 17/26               | 400    | Inter    | Primary body copy, product description                      |
| `type-body-m`        | 14/22              | 15/23               | 400    | Inter    | Secondary copy, form labels, nav items                      |
| `type-body-s`        | 13/18              | 13/18               | 400    | Inter    | Captions, helper text, timestamps                           |
| `type-label`         | 12/16              | 12/16               | 500    | Inter    | Uppercase eyebrow labels, badges — `letter-spacing +0.06em` |
| `type-price`         | 16/22              | 18/24               | 600    | Inter    | Product price (tabular-nums)                                |
| `type-price-compare` | 14/20              | 15/21               | 400    | Inter    | Struck-through original price                               |
| `type-button`        | 14/20              | 14/20               | 500    | Inter    | Button labels — `letter-spacing +0.02em`                    |

Line length for body copy is capped at `68ch` regardless of container width (About page, descriptions).

## Spacing

4px base unit.

| Token     | Value |     | Token      | Value |
| --------- | ----- | --- | ---------- | ----- |
| `space-1` | 4px   |     | `space-6`  | 32px  |
| `space-2` | 8px   |     | `space-7`  | 48px  |
| `space-3` | 12px  |     | `space-8`  | 64px  |
| `space-4` | 16px  |     | `space-9`  | 96px  |
| `space-5` | 24px  |     | `space-10` | 128px |

Page gutters: mobile `space-4` (16px), tablet `space-6` (32px), desktop `space-8` (64px), capped content width `1440px` centered beyond that.

## Radius

| Token         | Value | Usage                                                             |
| ------------- | ----- | ----------------------------------------------------------------- |
| `radius-sm`   | 2px   | Inputs, buttons, badges                                           |
| `radius-md`   | 4px   | Cards, images, modals, sheets                                     |
| `radius-full` | 999px | Only for: avatar thumbnails, the cart-count dot, swatch selectors |

Nothing else in the system uses radius. No large rounded "app card" corners.

## Elevation (shadow)

Kept nearly flat — depth comes from a 1px border first, shadow second.

| Token         | Value                                         | Usage                           |
| ------------- | --------------------------------------------- | ------------------------------- |
| `elevation-0` | none, `border: 1px solid color-border-subtle` | Default cards                   |
| `elevation-1` | `0 1px 3px rgba(31,27,24,0.06)`               | Sticky bars, dropdowns          |
| `elevation-2` | `0 8px 24px rgba(31,27,24,0.10)`              | Modals, bottom sheets, popovers |

## Motion

Full behavioral language is in `13-motion-and-microinteractions.md`; these are the raw tokens.

| Token              | Value                                    |
| ------------------ | ---------------------------------------- |
| `duration-instant` | 100ms                                    |
| `duration-fast`    | 180ms                                    |
| `duration-base`    | 240ms                                    |
| `duration-slow`    | 400ms                                    |
| `ease-standard`    | `cubic-bezier(0.4, 0, 0.2, 1)`           |
| `ease-emphasized`  | `cubic-bezier(0.2, 0, 0, 1)`             |
| `ease-decelerate`  | `cubic-bezier(0, 0, 0.2, 1)` (entrances) |
| `ease-accelerate`  | `cubic-bezier(0.4, 0, 1, 1)` (exits)     |

## Grid

| Breakpoint          | Columns | Gutter | Margin                         |
| ------------------- | ------- | ------ | ------------------------------ |
| Mobile `<768px`     | 4       | 16px   | 16px                           |
| Tablet `768–1023px` | 8       | 24px   | 32px                           |
| Desktop `≥1024px`   | 12      | 24px   | 64px (fixed, not proportional) |

Max content width `1440px`; beyond that, margins grow instead of columns widening further.
