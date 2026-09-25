# 01 — Brand & Visual Identity

## Positioning

The Haya Collection is a small, personal modest-fashion label presented with the visual confidence of an established premium house. "Haya" (modesty, dignified restraint) is both the product category and the design principle: nothing is shown that doesn't need to be shown. The brand earns "premium" through space, precision, and quiet consistency — not through embellishment.

**One-line brief for every design decision**: _if removing an element makes the layout calmer without losing information, remove it._

## Voice

- Warm, direct, unhurried. Editorial rather than promotional.
- Never uses discount-store urgency language ("HURRY", "LIMITED!!"). Scarcity/urgency, when genuinely true (e.g. low stock), is stated plainly: "Only 2 left."
- Product copy favors concrete fact over adjective stacking: fabric, cut, occasion, care — not "stunning, gorgeous, must-have."
- Second person, present tense: "Designed for movement. Finished by hand."

## Logotype / wordmark

- Primary lockup: **"THE HAYA COLLECTION"** — set in the display serif (see `02-design-tokens.md`), small caps or true uppercase, letter-spacing `+0.08em`, regular/medium weight (not bold). This is a _name_, not a logo mark — no icon, no monogram badge. Fashion houses at this tier are typographic.
- Compact lockup (nav bar, favicon-adjacent contexts): **"HAYA"** in the same treatment, used only where "The Haya Collection" would wrap or crowd a 44px-height bar.
- Minimum clear space around the wordmark: the height of the capital "H" on all sides.
- Never italicize, never add a drop shadow, never place on a busy photographic background without a solid-color safe area beneath it.

## Photography direction

This is the single highest-leverage lever for making the store feel premium — more than any UI decoration.

- **Product-on-model** shots are primary; flat lay / ghost-mannequin is secondary (used in gallery position 3+, not position 1).
- Natural or soft studio light, warm-neutral color grade consistent with the ivory background — imagery should never look color-clashed against the site.
- Consistent crop logic per product type (e.g. every outer piece gets one full-length front, one full-length back or movement shot, one detail/fabric shot, one styled/lifestyle shot). This consistency is what makes a small catalog feel systemized rather than ad hoc.
- Negative space bias: leave breathing room around the subject in hero/editorial imagery so type can sit in the frame without a scrim or gradient overlay.
- No stock-photo aesthetic, no busy backgrounds, no more than one dominant color per shot outside of skin/fabric tones.

## Editorial content patterns

- Homepage and About page use a **magazine-spread pattern**: large image + a short block of set-width text (max `680px` measure) rather than full-bleed text banners.
- Section intros are short (1–2 sentences). If a thought needs more than that, it becomes body copy inside an expandable/accordion or its own page (About), not a homepage wall of text.

## What "premium" is not, here

Explicitly out of scope per brand brief — flag and reject if any implementation drifts toward:

- Gradients as decoration, glassmorphism/blur panels, neon or saturated brights.
- Card-heavy layouts (shadowed boxes around everything).
- Heavy rounding (>4px radius) anywhere.
- Countdown timers, flashing "SALE" badges, autoplaying carousels with motion the user didn't trigger.
