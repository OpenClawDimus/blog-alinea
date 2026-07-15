# PRODUCT.md — blog.dimus.com.br/admin

## Register
product

## What this is

Internal analytics + content dashboard for blog.dimus.com.br (Dimus, agência de marketing automotivo B2B). Not a marketing surface — nobody outside the Dimus team ever sees this. One person (Guilherme, founder) checks it to decide which posts/lead magnets are working and whether the tracking pipeline itself is healthy.

## Users

- **Who**: Guilherme, founder of Dimus. Technical, works across a dozen internal tools daily (Supabase, Cloudflare, Chatwoot, Portainer). Not a design client — a working operator who wants signal fast.
- **Where/when**: checked a few times a week, usually mid-work on a laptop, sometimes to settle a specific question ("did that post convert?") rather than to browse idly.
- **Mood**: impatient with anything that reads as decorative or templated. Explicitly reacted against the first build as "raso" (shallow) and "amador" (amateur) — the generic SaaS-dashboard look with 4 identical KPI cards and a gradient/pill vocabulary reads as AI slop to him, not as craft.

## Scene sentence

Guilherme scanning real (bot-filtered) traffic and conversion numbers on a MacBook, at his desk, checking one specific number to decide if a post pays for itself — not a glanceable ambient screen, a working instrument he interrogates.

## Product purpose

Answer three questions with real (bot-filtered) D1 data: which posts convert views into leads, where do leads come from, is the tracking pipeline itself trustworthy. Everything else is secondary.

## Data reality (do not decorate around this)

Volumes are small and that is itself information: 2 leads, 1 download, ~35 posts with traffic, ~1.9k real sessions after stripping ~94% bot traffic. The dashboard must read as honest at this scale — not inflate small numbers with celebratory affordances (badges, progress rings, "streak" language) built for volume the product doesn't have yet.

## Tone / brand

Editorial, dark, dense, technical. Already-approved reference: the /admin login screen (Fraunces serif display type + JetBrains Mono for chrome/labels + one magenta accent `#e1379e` on `#0b0a0d`). The dashboard body should read as the same publication, not a different, genericized product bolted underneath a nice login screen.

## Anti-references (explicitly reject)

- Generic SaaS analytics template: 4 equal-width rounded "KPI cards" at the top of every page, pill badges everywhere, a sea of bordered `<div class="card">` boxes nested inside more card boxes.
- Vercel/Plausible-style ambient minimalism — wrong register, this product needs density and drill-down, not glanceable calm.
- Any dashboard where a reader could swap the color variables and get a different product with zero other changes — the current build fails this test.

## Strategic principles

1. Real data or an honest, quiet gap — never a filled placeholder.
2. Density is the deliverable at this data volume: small numbers should look considered, not padded out with whitespace to seem more important than they are.
3. One visual grammar for the whole surface (login screen included) — not "nice hero, generic app below."
4. Never delete tracking history; is_bot is additive. Not a design constraint, but a hard product constraint carried over from the tracking rebuild.
