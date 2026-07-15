# DESIGN.md — blog.dimus.com.br/admin

## Color strategy: Restrained

Tinted near-black neutrals + one committed accent used as a lantern (active state, key deltas, links) — never decorative fill. All neutrals tinted toward the brand hue (magenta family), chroma 0.006–0.012, never `#000`/`#fff`.

```css
--bg:        oklch(14% 0.010 335);   /* base canvas */
--surface-1: oklch(17% 0.011 335);   /* first elevation: sidebar, table body */
--surface-2: oklch(20% 0.012 335);   /* second elevation: hover, active nav */
--line:      oklch(28% 0.012 335);   /* hairline borders, 1px only */
--ink:       oklch(95% 0.006 335);   /* primary text */
--ink-mut:   oklch(68% 0.014 335);   /* secondary text, labels */
--ink-faint: oklch(48% 0.012 335);   /* tertiary, timestamps, disabled */
--accent:    oklch(62% 0.19 350);    /* magenta #e1379e family, lantern only */
--accent-dim:oklch(62% 0.19 350 / 0.10); /* accent wash for active-row bg, ≤10% surface */
--good:      oklch(64% 0.14 152);    /* real/clean signal, e.g. non-bot */
--warn:      oklch(70% 0.15 75);     /* attention, not error */
```

Reduce chroma near the lightness extremes (already respected above — no neutral exceeds chroma 0.012).

## Typography

- Display/section titles: Fraunces, weight ≤500, used sparingly — page title + the 3-4 section dividers, never every label.
- Body/UI/labels: system sans (ui-sans-serif stack) — NOT JetBrains Mono for prose or labels. Mono is reserved for **data**: slugs, timestamps, counts, percentages, IDs.
- Scale (ratio ~1.3, not flat): 12 / 13 / 15 / 19 / 25 / 33px. Page title at 33px Fraunces; section dividers at 13px uppercase tracked sans, not Fraunces at small size (small serif caps reads muddy).
- Body line length: cap prose blocks (empty states, bot-filter note) at ~70ch.

## Spacing rhythm

8px base unit but NOT uniform — vary by relationship, not by rule:
- 8px: within a tight cluster (icon to label, number to its own sub-label).
- 16-20px: between related elements in the same component.
- 32-40px: between distinct sections — enough that a section change reads as a change of subject, not just another card.
Never pad every box to the same 16px reflexively — that flatness is what read as templated.

## Elevation without cards-on-cards

- Sidebar = surface-1, flat, no border except the single 1px right hairline separating it from canvas.
- Data itself (tables) sits directly on canvas with a single 1px top+bottom rule per section, not boxed in a bordered rounded rectangle. Reserve the bordered "card" affordance for the KPI numbers only, and even there: no icon, no top-left decorative dot, no pill unless the pill communicates a real state (inactive/active).
- Never nest a bordered box inside another bordered box.

## Components

- **KPI strip**: numbers set in Fraunces (not mono) at large scale, unit label below in small tracked sans. Only wrap in a border where the number is genuinely a headline metric (2-3 max) — the rest render as a plain inline row of label:value pairs, mono value, no box.
- **Tables**: no rounded-card wrapper. Header row: small tracked sans-serif caps, `--ink-mut`. Body rows: hairline bottom rule only, generous 10-14px vertical padding, numeric columns in mono with `font-variant-numeric: tabular-nums`, right-aligned. Zebra via a 1-2% surface tint on alternating rows only if the table exceeds ~8 rows — not by default.
- **Sidebar nav item**: active state = accent text + `--accent-dim` background wash, no left border stripe (banned pattern), no pill.
- **Chart**: single stroke line, 1.5-2px, accent color, on transparent background, no gridlines, no axis, day labels below in mono/faint. This is the one place motion is worth adding: draw-in on first paint (stroke-dashoffset, expo ease-out, ~600ms) — not on every re-render, only first paint per section visit.
- **Empty states**: prose sentence in `--ink-mut`, no icon, no bordered box — a plain paragraph under the section divider.

## Explicit bans (in addition to shared impeccable bans)

- No `.pill` class used decoratively (current build uses it for tipo/cluster/status all the same way — collapse to one visual language: a plain mono label, not a pill, unless representing literal on/off state).
- No repeated 4-card KPI strip as the header of every single section — it's a one-time overview affordance, not a page template.
- No `box-shadow`, no `border-radius` above 8px (10-14px currently used reads soft/generic for this editorial-technical register — tighten to 6-8px or 0 on table rows).
