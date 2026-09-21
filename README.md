# NOIRÉ — Form in Motion

A cinematic, editorial digital experience for a fictional contemporary luxury
fashion house. Autumn/Winter 2026. Desktop-first (1440 / 1600 / 1920),
plain HTML + CSS + JavaScript, GSAP + ScrollTrigger + Lenis for motion.

## A note on the imagery

Every visual on the site — the campaign compositions, the product images,
the lookbook, the material tiles — is an **original, procedurally generated
SVG**, not a photograph. This was a constraint, not a stylistic whim: the
build environment this project was created in has no network access to any
photo host (Unsplash, Pexels, Wikimedia, etc.), so no real photography could
be sourced or verified.

Rather than ship broken `<img>` tags or generic AI-looking filler, the site
leans into an **architectural line-art identity** — garment schematics,
croquis silhouettes, and generated grain/fabric textures — that reinforces
the manifesto ("Clothing as architecture") instead of fighting it. All of
it lives in `assets/images/*.svg` and is produced by
[`scripts/generate-assets.mjs`](scripts/generate-assets.mjs), a small,
seeded, deterministic generator (no external dependencies).

**To swap in real campaign photography later:** replace any file in
`assets/images/` with a same-named `.jpg`/`.webp` and update the
`src` in `index.html` (or the `image` field in `js/products.js` for
products). Nothing else needs to change — the layout, crops
(`object-fit: cover`) and aspect ratios were all authored to take a real
photograph directly.

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
/assets/images                Generated SVG art direction (see above)
/scripts
  generate-assets.mjs          Procedural SVG asset generator
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
