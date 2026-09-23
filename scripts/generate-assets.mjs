// NOIRÉ — procedural SVG asset generator.
// Produces the site's entire visual library: architectural garment line-art,
// abstract croquis figures, and macro fabric-grain textures. Run once with
// `node scripts/generate-assets.mjs`; output lives in assets/images/.
import { writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'assets', 'images');
mkdirSync(OUT, { recursive: true });

// Champagne & Emerald palette (keep in sync with css/variables.css)
const INK = '#142922';    // ink-emerald
const PAPER = '#f3e9d7';  // champagne
const GRAY = '#8d7d5f';   // taupe

// ---------- seeded RNG (deterministic output across runs) ----------
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function save(name, svg) {
  writeFileSync(path.join(OUT, name), svg.trim() + '\n');
  console.log('wrote', name);
}

// ---------- grain filter (macro texture / noise) ----------
function grainFilter(id, { freq = 0.9, oct = 2, seed = 4, scale = 18 } = {}) {
  return `<filter id="${id}" x="-20%" y="-20%" width="140%" height="140%">
    <feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="${oct}" seed="${seed}" result="n"/>
    <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.9 0.9 0.9 0 0" result="na"/>
    <feComponentTransfer in="na" result="nb"><feFuncA type="linear" slope="0.5"/></feComponentTransfer>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="${scale}"/>
  </filter>`;
}

function noiseOverlay(id, opacity = 0.35, freq = 1.3, seed = 7) {
  return `<filter id="${id}"><feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="2" seed="${seed}" stitchTiles="stitch"/><feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 ${opacity} 0"/></filter>`;
}

// ---------- abstract croquis figure (gesture line, not literal anatomy) ----------
function figurePath(rng, { h = 900, lean = 0 } = {}) {
  const cx = 300 + lean;
  const headY = h * 0.06;
  const neckY = h * 0.14;
  const shoulderY = h * 0.17;
  const waistY = h * 0.46;
  const hipY = h * 0.53;
  const kneeY = h * 0.74;
  const ankleY = h * 0.97;
  const sway = (rng() - 0.5) * 40;
  const sway2 = (rng() - 0.5) * 30;
  return `M ${cx} ${headY}
    C ${cx + 14} ${headY + 20} ${cx + 16} ${neckY - 10} ${cx + 6} ${neckY}
    C ${cx - 40 + sway} ${shoulderY} ${cx - 46 + sway} ${waistY * 0.7} ${cx - 30 + sway2} ${waistY}
    C ${cx - 24} ${hipY} ${cx - 36} ${hipY + 20} ${cx - 42} ${kneeY}
    C ${cx - 46} ${kneeY + 40} ${cx - 40} ${ankleY - 30} ${cx - 34} ${ankleY}
    M ${cx + 6} ${neckY}
    C ${cx + 46 - sway} ${shoulderY} ${cx + 50 - sway} ${waistY * 0.72} ${cx + 30 - sway2} ${waistY}
    C ${cx + 22} ${hipY} ${cx + 34} ${hipY + 24} ${cx + 40} ${kneeY}
    C ${cx + 44} ${kneeY + 46} ${cx + 30} ${ankleY - 20} ${cx + 20} ${ankleY}
    M ${cx - 30 + sway} ${shoulderY + 6}
    C ${cx - 70} ${shoulderY + 60} ${cx - 66} ${waistY - 30} ${cx - 50} ${waistY + 10}
    M ${cx + 32 - sway} ${shoulderY + 6}
    C ${cx + 72} ${shoulderY + 50} ${cx + 60} ${waistY - 20} ${cx + 44} ${waistY + 6}`;
}

function croquisSVG({ w = 600, h = 900, seed = 1, bg = 'none', stroke = INK, id = 'a' } = {}) {
  const rng = mulberry32(seed);
  const p = figurePath(rng, { h: h * 0.92, lean: (rng() - 0.5) * 20 });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <defs>${noiseOverlay('grain-' + id, 0.05)}</defs>
  ${bg !== 'none' ? `<rect width="${w}" height="${h}" fill="${bg}"/>` : ''}
  <g transform="translate(${(w - 600) / 2},${h * 0.02})">
    <path d="${p}" fill="none" stroke="${stroke}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" opacity="0.92"/>
    <ellipse cx="306" cy="${h * 0.06 - 10}" rx="20" ry="26" fill="none" stroke="${stroke}" stroke-width="1.6" opacity="0.92"/>
  </g>
  ${bg !== 'none' ? `<rect width="${w}" height="${h}" filter="url(#grain-${id})"/>` : ''}
</svg>`;
}

// ---------- garment technical schematic (architectural line diagram) ----------
function schematicSVG({ w = 800, h = 1000, type = 'coat', seed = 2, id = 's' } = {}) {
  const rng = mulberry32(seed);
  const cx = w / 2;
  const top = h * 0.12;
  const shoulder = w * 0.32;
  const waist = h * 0.5;
  const hem = h * (type === 'trousers' ? 0.92 : type === 'skirt' ? 0.62 : 0.8);
  const bodyW = type === 'coat' ? w * 0.36 : type === 'blazer' ? w * 0.3 : w * 0.26;

  let garment = '';
  if (type === 'trousers') {
    garment = `M ${cx - bodyW * 0.5} ${top} L ${cx + bodyW * 0.5} ${top}
      L ${cx + bodyW * 0.5} ${waist} L ${cx + bodyW * 0.62} ${hem}
      L ${cx + bodyW * 0.18} ${hem} L ${cx} ${waist + (hem - waist) * 0.4}
      L ${cx - bodyW * 0.18} ${hem} L ${cx - bodyW * 0.62} ${hem}
      L ${cx - bodyW * 0.5} ${waist} Z`;
  } else if (type === 'skirt') {
    garment = `M ${cx - bodyW * 0.42} ${top} L ${cx + bodyW * 0.42} ${top}
      L ${cx + bodyW * 0.9} ${hem} L ${cx - bodyW * 0.9} ${hem} Z`;
  } else {
    // coat / jacket / dress: shoulders -> waist -> hem, with lapel lines
    const hemW = type === 'dress' ? bodyW * 0.55 : bodyW * 0.9;
    garment = `M ${cx - shoulder} ${top}
      L ${cx - bodyW * 0.5} ${waist * 0.85}
      L ${cx - hemW} ${hem}
      L ${cx + hemW} ${hem}
      L ${cx + bodyW * 0.5} ${waist * 0.85}
      L ${cx + shoulder} ${top}
      L ${cx + shoulder * 0.5} ${top + 40}
      L ${cx} ${top + 90}
      L ${cx - shoulder * 0.5} ${top + 40} Z`;
  }

  // measurement ticks (architectural dimension lines)
  const ticks = [];
  const tickY = hem + 40;
  ticks.push(`<line x1="${cx - bodyW}" y1="${tickY}" x2="${cx + bodyW}" y2="${tickY}" stroke="${GRAY}" stroke-width="0.75"/>`);
  ticks.push(`<line x1="${cx - bodyW}" y1="${tickY - 8}" x2="${cx - bodyW}" y2="${tickY + 8}" stroke="${GRAY}" stroke-width="0.75"/>`);
  ticks.push(`<line x1="${cx + bodyW}" y1="${tickY - 8}" x2="${cx + bodyW}" y2="${tickY + 8}" stroke="${GRAY}" stroke-width="0.75"/>`);
  for (let i = 0; i < 5; i++) {
    const y = top + i * (hem - top) / 4;
    ticks.push(`<line x1="${cx - bodyW - 30}" y1="${y}" x2="${cx - bodyW - 18}" y2="${y}" stroke="${GRAY}" stroke-width="0.5" opacity="0.6"/>`);
  }
  const seam = `M ${cx} ${top + 90} L ${cx} ${hem}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <defs>${noiseOverlay('grain-' + id, 0.045)}</defs>
  <rect width="${w}" height="${h}" fill="${PAPER}"/>
  <g fill="none" stroke="${INK}" stroke-width="1.1" stroke-linejoin="round">
    <path d="${garment}"/>
    <path d="${seam}" stroke-width="0.6" opacity="0.55" stroke-dasharray="1 5"/>
  </g>
  <g opacity="0.7">${ticks.join('')}</g>
  <rect width="${w}" height="${h}" filter="url(#grain-${id})"/>
</svg>`;
}

// ---------- fabric / material macro texture ----------
function materialSVG({ w = 900, h = 900, kind = 'wool', seed = 3, id = 'm' } = {}) {
  const cfg = {
    wool: { freq: 0.9, oct: 3, base: '#223229' },
    silk: { freq: 0.25, oct: 2, base: '#2b2438' },
    leather: { freq: 0.35, oct: 4, base: '#241a14' },
    metal: { freq: 0.6, oct: 2, base: '#33403a' },
    cotton: { freq: 0.55, oct: 3, base: '#332c22' },
    stitch: { freq: 0.7, oct: 2, base: '#1a231d' },
  }[kind] || { freq: 0.6, oct: 3, base: '#232220' };

  let overlayLines = '';
  if (kind === 'stitch') {
    const rng = mulberry32(seed);
    let rows = '';
    for (let y = 60; y < h - 40; y += 46) {
      let d = `M -20 ${y}`;
      for (let x = 0; x <= w + 20; x += 24) {
        d += ` L ${x} ${y + (x / 24 % 2 === 0 ? -6 : 6)}`;
      }
      rows += `<path d="${d}" fill="none" stroke="${PAPER}" stroke-width="1.1" opacity="0.5"/>`;
    }
    overlayLines = rows;
  }
  if (kind === 'metal') {
    let lines = '';
    for (let x = -40; x < w + 40; x += 14) {
      lines += `<line x1="${x}" y1="0" x2="${x + 120}" y2="${h}" stroke="${PAPER}" stroke-width="0.4" opacity="0.12"/>`;
    }
    overlayLines = lines;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <defs>
    <filter id="tex-${id}" x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="${cfg.freq}" numOctaves="${cfg.oct}" seed="${seed}" stitchTiles="stitch" result="n"/>
      <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.86  0 0 0 0 0.74  0 0 0 0 0.5  0 0 0 0.5 0" result="nc"/>
      <feComposite in="nc" in2="SourceGraphic" operator="in" result="tinted"/>
      <feBlend in="SourceGraphic" in2="tinted" mode="soft-light"/>
    </filter>
    <radialGradient id="vig-${id}" cx="50%" cy="45%" r="75%">
      <stop offset="60%" stop-color="#000000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.35"/>
    </radialGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="${cfg.base}"/>
  <rect width="${w}" height="${h}" filter="url(#tex-${id})"/>
  <g>${overlayLines}</g>
  <rect width="${w}" height="${h}" fill="url(#vig-${id})"/>
</svg>`;
}

// ---------- large architectural composition (hero / campaign / final) ----------
// `wide`: author the figure directly for a landscape full-bleed crop instead
// of relying on object-fit:cover to salvage a portrait-native drawing.
function compositionSVG({ w = 1600, h = 2000, seed = 5, id = 'c', tone = 'dark', wide = false, twin = true } = {}) {
  const rng = mulberry32(seed);
  const dark = tone === 'dark';
  const base = dark ? '#111110' : PAPER;
  const ink = dark ? PAPER : INK;
  const cx = wide ? w * (0.62 + rng() * 0.1) : w * (0.42 + rng() * 0.16);
  const groundY = wide ? h * 0.86 : h * 0.94;

  // architectural guide lines + a grounding floor line + dimension ticks
  let guides = '';
  const cols = wide ? 9 : 6;
  for (let i = 0; i <= cols; i++) {
    const x = (w / cols) * i;
    guides += `<line x1="${x}" y1="0" x2="${x}" y2="${h}" stroke="${ink}" stroke-width="0.4" opacity="0.075"/>`;
  }
  guides += `<line x1="0" y1="${groundY}" x2="${w}" y2="${groundY}" stroke="${ink}" stroke-width="0.6" opacity="0.16"/>`;
  guides += `<line x1="${cx}" y1="${h * 0.02}" x2="${cx}" y2="${groundY}" stroke="${ink}" stroke-width="0.5" opacity="0.14" stroke-dasharray="1 7"/>`;
  for (let t = 0; t < 5; t++) {
    const ty = h * 0.02 + t * (groundY - h * 0.02) / 4;
    guides += `<line x1="${cx - 10}" y1="${ty}" x2="${cx + 10}" y2="${ty}" stroke="${ink}" stroke-width="0.5" opacity="0.16"/>`;
  }

  // figure scaled to reach from just below the top guide to the ground line
  const figH = groundY - h * 0.05;
  const figScale = wide ? 1.55 : 1.35;
  const figA = figurePath(mulberry32(seed + 1), { h: figH / figScale });
  const figB = figurePath(mulberry32(seed + 2), { h: figH * 0.66 });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice">
  <defs>
    ${noiseOverlay('grain-' + id, dark ? 0.06 : 0.05, 1.1, seed)}
    <linearGradient id="lg-${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${base}"/>
      <stop offset="100%" stop-color="${dark ? '#050505' : '#e7e3db'}"/>
    </linearGradient>
    <radialGradient id="glow-${id}" cx="${(cx / w) * 100}%" cy="45%" r="60%">
      <stop offset="0%" stop-color="${ink}" stop-opacity="${dark ? 0.14 : 0.1}"/>
      <stop offset="100%" stop-color="${ink}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#lg-${id})"/>
  <rect width="${w}" height="${h}" fill="url(#glow-${id})"/>
  <g>${guides}</g>
  ${twin ? `<g transform="translate(${cx - 300 - figH * 0.24},${h * 0.05})" opacity="0.22">
    <path d="${figB}" fill="none" stroke="${ink}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" transform="scale(${figScale * 0.66})"/>
  </g>` : ''}
  <g transform="translate(${cx - 300 * (figScale / 1.35)},${h * 0.05})" opacity="${dark ? 0.94 : 0.88}">
    <path d="${figA}" fill="none" stroke="${ink}" stroke-width="${wide ? 2.4 : 2.1}" stroke-linecap="round" stroke-linejoin="round" transform="scale(${figScale})"/>
  </g>
  <rect width="${w}" height="${h}" filter="url(#grain-${id})"/>
</svg>`;
}

// ---------- motion study (chronophotographic trail — for the film section) ----------
function motionStudySVG({ w = 1920, h = 1080, seed = 31, id = 'film' } = {}) {
  const ink = PAPER;
  const groundY = h * 0.88;
  const cx = w * 0.5;
  const figH = groundY - h * 0.06;
  const scale = 1.5;

  let guides = '';
  for (let i = 0; i <= 10; i++) {
    const x = (w / 10) * i;
    guides += `<line x1="${x}" y1="0" x2="${x}" y2="${h}" stroke="${ink}" stroke-width="0.4" opacity="0.06"/>`;
  }
  guides += `<line x1="0" y1="${groundY}" x2="${w}" y2="${groundY}" stroke="${ink}" stroke-width="0.6" opacity="0.15"/>`;

  const positions = [-1, -0.5, 0, 0.5, 1];
  let frames = '';
  positions.forEach((p, i) => {
    const seed2 = seed + 10 + i;
    const path = figurePath(mulberry32(seed2), { h: figH / scale });
    const x = cx + p * w * 0.16 - 300 * scale * 0.5;
    const op = i === 2 ? 0.95 : 0.16 + Math.abs(p) * 0.05;
    frames += `<g transform="translate(${x},${h * 0.06})" opacity="${op}">
      <path d="${path}" fill="none" stroke="${ink}" stroke-width="${i === 2 ? 2.3 : 1.1}" stroke-linecap="round" stroke-linejoin="round" transform="scale(${scale})"/>
    </g>`;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice">
  <defs>
    ${noiseOverlay('grain-' + id, 0.06, 1.1, seed)}
    <linearGradient id="lg-${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#131211"/>
      <stop offset="100%" stop-color="#050505"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#lg-${id})"/>
  <g>${guides}</g>
  ${frames}
  <rect width="${w}" height="${h}" filter="url(#grain-${id})"/>
</svg>`;
}

// ================= GENERATE FILE SET =================
//
// Real campaign/lookbook/product photography now lives in
// assets/images/photos/ (see README — "A note on the imagery"). This
// generator still covers the pieces that stay illustrative by design:
// the architectural garment schematics (a distinct NOIRÉ device, used for
// the manifesto diagram and for the two products with no matching photo)
// and the macro material-texture tiles. The hero/campaign/film/lookbook/
// journal composition + croquis functions above are kept in the file —
// and still fully working — for anyone who wants to fall back to the
// illustration-only look; just uncomment the calls below.

// All six products and the manifesto diagram now use real photos — the
// schematic generator calls (all six garment types) live in the
// illustration-only fallback block below if needed again.

// Materials — macro fabric/hardware textures, all six still in use
const materials = ['wool', 'silk', 'leather', 'metal', 'cotton', 'stitch'];
materials.forEach((m, i) => save(`material-${m}.svg`, materialSVG({ kind: m, seed: 300 + i, id: 'mat' + i })));

/* -- illustration-only fallback set (uncomment to regenerate) --------------
save('hero-main.svg', compositionSVG({ w: 1920, h: 1080, seed: 11, id: 'hero', tone: 'dark', wide: true }));
save('campaign-large.svg', compositionSVG({ w: 1400, h: 1800, seed: 21, id: 'camL', tone: 'dark', twin: false }));
save('campaign-small.svg', compositionSVG({ w: 900, h: 1200, seed: 22, id: 'camS', tone: 'light', twin: false }));
save('film-still.svg', motionStudySVG({ w: 1920, h: 1080, seed: 31, id: 'film' }));
save('final-campaign.svg', compositionSVG({ w: 1920, h: 1300, seed: 41, id: 'finalc', tone: 'dark', wide: true, twin: false }));
save('studio-portrait.svg', compositionSVG({ w: 1100, h: 1400, seed: 51, id: 'studio', tone: 'light', twin: false }));
save('product-coat.svg', schematicSVG({ type: 'coat', seed: 100, id: 'p0' }));
save('product-jacket.svg', schematicSVG({ type: 'jacket', seed: 101, id: 'p1' }));
save('product-trousers.svg', schematicSVG({ type: 'trousers', seed: 102, id: 'p2' }));
save('product-dress.svg', schematicSVG({ type: 'dress', seed: 103, id: 'p3' }));
save('product-blazer.svg', schematicSVG({ type: 'blazer', seed: 104, id: 'p4' }));
save('product-skirt.svg', schematicSVG({ type: 'skirt', seed: 105, id: 'p5' }));
for (let i = 1; i <= 4; i++) {
  save(`look-0${i}.svg`, compositionSVG({ w: 1920, h: 1080, seed: 200 + i, id: 'look' + i, tone: i % 2 ? 'dark' : 'light', wide: true, twin: i % 2 === 1 }));
}
for (let i = 1; i <= 4; i++) {
  save(`journal-0${i}.svg`, croquisSVG({ w: 700, h: 500, seed: 400 + i, bg: '#171613', stroke: PAPER, id: 'jr' + i }));
}
---------------------------------------------------------------------- */

console.log('Done. Assets in', OUT);
