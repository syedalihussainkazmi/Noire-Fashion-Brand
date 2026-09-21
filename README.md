# NOIRÉ — Form in Motion

A cinematic, editorial digital experience for a fictional contemporary luxury
fashion house. Autumn/Winter 2026. Desktop-first (1440 / 1600 / 1920),
plain HTML + CSS + JavaScript, GSAP + ScrollTrigger + Lenis for motion.

## A note on the imagery

The build environment this project was created in has no network access to
any photo host (Unsplash, Pexels, Wikimedia, Google Images, etc.), so
photography couldn't be fetched automatically. The site now runs on a
**hybrid** set of visuals:

- **`assets/images/photos/`** — nine real photographs supplied directly by
  the project owner, used for the hero, campaign, film, studio, lookbook,
  journal, and four of the six products (coat, jacket, dress, blazer).
- **`assets/images/*.svg`** — original, procedurally generated line art
  (architectural garment schematics + macro fabric textures) for the pieces
  with no matching photo (trousers, skirt) and the manifesto diagram. This
  is produced by [`scripts/generate-assets.mjs`](scripts/generate-assets.mjs),
  a small, seeded, deterministic generator with no external dependencies —
  the composition/lookbook/journal functions are still in the file and
  fully working if you ever want to fall back to an illustration-only look
  (see the commented-out block at the bottom of the script).

**Licensing responsibility:** the photos in `assets/images/photos/` were
supplied by whoever is running this project, not sourced or verified by the
build process. Before deploying this site publicly or using it commercially,
confirm you hold the rights to each photo (a purchased/licensed stock image,
a properly licensed shoot, or your own photography). Swap any file you're
unsure of for one you do hold rights to — same filename, same path, nothing
else needs to change.

**To swap any image:** replace the file (keep the same name) and, if it's a
product, update the `image` field in `js/products.js`; everything else
(the `src` in `index.html`, the crops via `object-fit: cover`, the aspect
ratios) was authored to take a real photograph directly.

## Color theme — Champagne & Emerald

The site moved off an all-black palette to a warm champagne/ivory base
(`--c-champagne`) with deep-emerald text, gold accents (`--c-gold`,
`--c-gold-bright`), and a handful of cinematic deep-emerald sections —
hero, campaign, film, lookbook, final campaign, footer, and every overlay
(cart, product, film) — that stay dark for contrast and drama against the
otherwise light, editorial body copy. All tokens live in `css/variables.css`;
each dark section re-declares the shared `--local-*` custom properties
(`--local-bg`, `--local-fg`, `--local-secondary`, `--local-muted`,
`--local-border`, `--local-accent`) so a section's descendants (headings,
labels, borders, hovers) automatically pick up the right color without
per-element overrides. The nav is the one exception: transparent with light
text over the hero, then a solid champagne bar with dark text once
scrolled, so it stays legible over whichever section is underneath.

A slow-drifting, GPU-cheap `.ambient-bg` layer (three blurred gold/emerald/
champagne radial blobs, pure CSS `transform` animation, paused under
`prefers-reduced-motion`) sits fixed behind the light sections; dark
sections simply paint over it with their own opaque background.

## Quick start

No build step. It's a static site.

```bash
# from the project root
python3 -m http.server 8080
# or: npx serve .
# or: php -S localhost:8080
```

Open `http://localhost:8080`. A local server is required (not
`file://`) because the CSS uses `@import` and the JS uses `fetch`-adjacent
browser APIs that some browsers restrict under the `file:` protocol.

To regenerate the SVG asset library (e.g. after tweaking the generator):

```bash
node scripts/generate-assets.mjs
```

## Folder structure

```
/index.html                 One page, all 11 sections + overlays
/css
  variables.css              Design tokens: color, type, spacing, motion
  base.css                   Reset + base typography
  layout.css                 Section-by-section layout (desktop grid)
  components.css              Nav, cursor, drawer, overlays, buttons
  animations.css              GSAP hooks + reduced-motion-safe primitives
  style.css                   Entry point (@imports the above, in order)
/js
  utils.js                    qs/qsa, formatPrice, debounce, focus trap…
  products.js                 Product data + collection/storefront render
  cart.js                     Shopping bag (localStorage) + product overlay
  animations.js               Lenis + GSAP/ScrollTrigger orchestration
  main.js                     Bootstraps everything, newsletter, anchors
  vendor/                     GSAP, ScrollTrigger, Lenis (vendored, no CDN)
/assets/images
  photos/                      Real photography (see "A note on the imagery")
  *.svg                        Generated line-art for the rest (see above)
/scripts
  generate-assets.mjs          Procedural SVG asset generator
  optimize-photos.mjs          Re-encodes source photos into photos/ (needs `sharp`)
  qa-screenshot.mjs            Playwright QA harness used during build
```

## Product data

`js/products.js` holds a single source-of-truth array (`NOIRE.products.DATA`)
of six pieces — id, name, category, material, price, description, image,
sizes — used to render both the editorial Collection list and the
Storefront rail, and looked up by id for the cart and the product overlay.
Add a seventh product by adding one object to that array; nothing else
needs touching.

## Shopping bag

Frontend-only, persisted to `localStorage` (`noire_bag_v1`). Supports
add / remove / quantity change / subtotal, survives a page reload, and
"Checkout" resolves to an honest **"Checkout integration ready."** message
— no fake payment is simulated.

## Motion system

- **Lenis** drives smooth scrolling; GSAP's ticker powers its `raf` loop so
  ScrollTrigger and Lenis stay in sync.
- **Mask-line reveals** (`.mask-line` / `.split-line__inner`) power every
  headline: the hidden state is set via `gsap.set(..., { yPercent: 110 })`
  at boot (deliberately *not* in CSS — see the comment in
  `animations.css` above the `.split-line__inner` rule for why mixing the
  two breaks the tween).
- **Parallax** via `data-speed` attributes + `ScrollTrigger` scrub.
- **One pinned moment**: the Lookbook stage pins for a scroll dwell so a
  visitor can click through the four looks without the page racing on —
  used once, deliberately, per the brief's "sparingly" guidance.
- **Custom cursor** with `view` / `link` / `enter` states, delegated off a
  single `mouseover`/`mouseout` listener rather than one per element.
- Respects `prefers-reduced-motion`: Lenis, parallax, and pinning are all
  skipped, and every reveal renders in its final state immediately.

## Accessibility

Semantic landmarks, visible focus states, `aria-modal`/focus-trapped
overlays (cart, product, film), `Escape` to close, alt text on every image,
labelled form fields, and a full reduced-motion path.

## Browser support

Built and tested against current desktop Chromium. Uses only standard,
broadly-supported CSS/JS (Grid, custom properties, `clip-path`,
`IntersectionObserver`-free ScrollTrigger). No framework, no build step.

## Deployment

It's static files — deploy the repository root as-is to any static host:

- **GitHub Pages**: enable Pages on this repo, root of `main`.
- **Netlify / Vercel**: "no build command," publish directory `/`.
- **Any web server**: copy the repository contents to the document root.

There is no environment configuration, API keys, or server-side code.
