import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const repo = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const mascot = path.join(repo, 'public', 'mascot.png');
const outDir = path.join(repo, 'public', 'icons');
fs.mkdirSync(outDir, { recursive: true });

// Teal brand background #0d9488
const opts = { background: { r: 13, g: 148, b: 136, alpha: 1 } };

for (const size of [192, 512]) {
  await sharp(mascot)
    .resize(size, size, { fit: 'cover' })
    .flatten(opts)
    .png()
    .toFile(path.join(outDir, `icon-${size}.png`));
  console.log(`created icon-${size}.png`);
}