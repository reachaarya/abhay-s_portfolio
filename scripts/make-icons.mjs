// Renders public/favicon.svg into the PNG icons browsers and phones ask for.
// Usage: node scripts/make-icons.mjs
import sharp from 'sharp';
import { readFileSync } from 'node:fs';

const svg = readFileSync('public/favicon.svg');
const paper = { r: 241, g: 237, b: 228, alpha: 1 };

await sharp(svg, { density: 300 }).resize(32, 32).png().toFile('public/favicon-32.png');
// home-screen icons sit on newsprint with some breathing room
for (const [size, name] of [[180, 'apple-touch-icon.png'], [192, 'icon-192.png'], [512, 'icon-512.png']]) {
  const inner = Math.round(size * 0.74);
  const art = await sharp(svg, { density: 600 }).resize(inner, inner).png().toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: paper } })
    .composite([{ input: art, gravity: 'center' }])
    .png()
    .toFile(`public/${name}`);
}
console.log('icons written');
