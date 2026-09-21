// NOIRÉ — photo optimizer.
// Re-encodes source photos into assets/images/photos/ at a sane max width
// and JPEG quality for the web. Requires `sharp` (not vendored — install
// with `npm i -D sharp` before running).
//
// Usage: node scripts/optimize-photos.mjs <manifest.json>
// manifest.json: [{ "src": "/abs/path/in.jpg", "out": "slug-name.jpg", "maxWidth": 2000 }, ...]
import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '..', 'assets', 'images', 'photos');
mkdirSync(OUT_DIR, { recursive: true });

const manifestPath = process.argv[2];
if (!manifestPath) {
  console.error('Usage: node scripts/optimize-photos.mjs <manifest.json>');
  process.exit(1);
}
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

for (const { src, out, maxWidth = 2000 } of manifest) {
  const dest = path.join(OUT_DIR, out);
  await sharp(src)
    .rotate() // respect EXIF orientation
    .resize({ width: maxWidth, withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(dest);
  console.log('wrote', out);
}
