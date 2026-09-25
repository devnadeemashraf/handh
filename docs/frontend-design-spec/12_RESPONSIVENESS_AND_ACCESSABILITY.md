# 12 — Responsive Behavior & Accessibility

## Responsive philosophy

Components **adapt their form**, not just their size, per breakpoint. The rule used throughout `05`–`10`: identify the _purpose_ a desktop pattern serves, then find the mobile-native pattern that serves the same purpose — don't just shrink the desktop version. Reference table of every such swap defined in this spec:

| Purpose                                   | Desktop pattern                                        | Mobile pattern                                                    |
| ----------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------- |
| Primary app navigation                    | Header nav bar                                         | Bottom navigation (5 items)                                       |
| Product filtering                         | Persistent left sidebar                                | Bottom sheet, opened via button                                   |
| Sorting                                   | Inline dropdown                                        | Small bottom sheet, radio list                                    |
| Variant/quick-add                         | Modal                                                  | Bottom sheet                                                      |
| Cart (quick access)                       | Slide-over panel from header icon                      | Full-screen route                                                 |
| Product gallery                           | Vertical scroll stack, sticky purchase panel beside it | Swipeable horizontal carousel, sticky bottom purchase bar beneath |
| Purchase actions (PDP/Cart)               | Stacked buttons in a sticky right panel                | Sticky bottom bar, full-width buttons                             |
| Checkout layout                           | Two columns (form + persistent summary)                | Single column, summary collapsed behind a tap                     |
| Order tracking timeline                   | Horizontal stepper                                     | Vertical stepper                                                  |
| Breadcrumbs                               | Shown                                                  | Omitted (back-chevron + bottom nav cover the same need)           |
| Hover reveal (secondary image, quick-add) | Hover-triggered                                        | Always visible (no hover state exists on touch)                   |

## Breakpoint specifics

- **Mobile `<768px`**: single column content, 4-col grid (`02`), bottom nav present, all modals render as bottom sheets, touch targets ≥44×44px everywhere, no hover-dependent functionality (anything hover reveals on desktop must have a visible/tappable mobile equivalent — never hidden behind hover with no touch fallback).
- **Tablet `768–1023px`**: hybrid — header nav present (bottom nav removed), but density/column counts stay closer to mobile than desktop (e.g. Shop grid = 2–3 columns, not 4; PDP may still stack single-column if the two-column layout would crush the image column below a usable width — test at 768px specifically). Sheets vs. modals: follow mobile (sheets) below ~900px, desktop (modals) above, as a soft internal threshold within this range.
- **Desktop `≥1024px`**: full multi-column layouts as specced per page. **Large desktop `≥1440px`**: max content width caps at 1440px centered; margins grow, columns/components do not stretch further — prevents line lengths and card sizes from becoming absurd on ultrawide screens.

## Touch & input

- Minimum touch target 44×44px (Apple/WCAG-aligned), including invisible padding around visually smaller elements (icon buttons, chip ×'s, stepper +/−).
- Swipe gestures (gallery, dismiss sheet, dismiss toast) always have a non-gesture equivalent (dots are tappable to jump to a specific image; sheets have an explicit close affordance; toasts auto-dismiss and don't rely on swipe alone).
- No functionality requires a hover state, a right-click, a hard press, or a multi-finger gesture as the _only_ path to it.

## Accessibility (WCAG 2.1 AA baseline)

- **Color contrast**: all token pairs in `02` meet 4.5:1 for body text / 3:1 for large text (≥24px or ≥19px bold) and UI component boundaries. Status must never be conveyed by color alone — every badge/state also carries a text label (e.g. tracking timeline stages, in `08`, use text labels + icon shape, not color-only differentiation).
- **Focus order**: follows visual/DOM reading order on every page; modals/sheets trap focus while open and return it to the triggering element on close (per `03`).
- **Focus-visible**: 2px `color-accent-royal` outline, 2px offset, on every interactive element — never `outline: none` without a replacement.
- **Keyboard support**: all interactive elements reachable via Tab; Enter/Space activate buttons and toggles; Esc closes modals/sheets/search overlay/lightbox; arrow keys navigate carousels and the PDP lightbox as an enhancement (not a requirement) once basic tab/enter access works.
- **ARIA**: buttons that are icon-only (wishlist heart, cart icon, close ×) carry an `aria-label` describing the action in its current state (e.g. "Add to wishlist" vs. "Remove from wishlist," not a static label). Live regions (`aria-live="polite"`) announce Toasts, inline form-validation results, and cart-count changes. Accordion headers use `aria-expanded`. The current step in the checkout accordion and the current stage in order tracking are marked with `aria-current`.
- **Images**: every product image has descriptive alt text (product name + color, at minimum — not "image1.jpg," not a repeated generic "product photo"); decorative imagery (hero backgrounds where the accompanying headline already conveys the meaning) uses empty alt text so screen readers skip it.
- **Forms**: every input has a programmatically associated `<label>` (not placeholder-only labeling, consistent with the Input component spec in `03`); error messages are associated to their field via `aria-describedby` and announced on appearance.
- **Motion sensitivity**: every animation in `13` respects `prefers-reduced-motion` — reduce to opacity-only or instant-state transitions (no translate/scale/shimmer) when the user has that OS-level preference set. This includes the tracking-timeline pulse and the confirmation-page stroke-draw checkmark.
- **Text resize**: layout must not break or clip content at 200% browser zoom / OS text-size increase — verify especially on the PDP sticky bar and the checkout sticky summary, the two most layout-constrained regions in the system.
