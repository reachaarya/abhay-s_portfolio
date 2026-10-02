// Compresses the eagle in Eagle/ (a .glb, or Eagle.gltf with its files) into a small, laptop-friendly public/models/eagle.glb.
//  - welds + simplifies the mesh (keeps the silhouette, drops redundant triangles)
//  - quantizes geometry (smaller vertex data with no WebAssembly decoder needed in the browser)
//  - shrinks the texture to 1024px and converts it to WebP
// Usage: npm run compress:eagle
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';

// Use a single-file .glb if there is one in Eagle/, otherwise Eagle/Eagle.gltf (+ its .bin and textures).
const glb = existsSync('Eagle') ? readdirSync('Eagle').find((f) => f.toLowerCase().endsWith('.glb')) : null;
const SRC = glb ? `Eagle/${glb}` : 'Eagle/Eagle.gltf';
const OUT = 'public/models/eagle.glb';

if (!existsSync(SRC)) {
  console.error(`✗ ${SRC} not found.`);
  process.exit(1);
}

// a .glb is self-contained; a .gltf lists its companion files, which must sit next to it
const gltf = SRC.endsWith('.glb') ? {} : JSON.parse(readFileSync(SRC, 'utf8'));
const needed = [...(gltf.buffers || []), ...(gltf.images || [])]
  .map((x) => x.uri)
  .filter((uri) => uri && !uri.startsWith('data:'));
const missing = needed.filter((uri) => !existsSync(join(dirname(SRC), decodeURIComponent(uri))));
if (missing.length) {
  console.error(`✗ ${SRC} references files that are not in the Eagle folder:\n  - ${missing.join('\n  - ')}`);
  console.error('  Export from Blender as "glTF Binary (.glb)", or copy those files next to Eagle.gltf, then rerun.');
  process.exit(1);
}

mkdirSync(dirname(OUT), { recursive: true });
const before = needed.reduce((s, uri) => s + statSync(join(dirname(SRC), decodeURIComponent(uri))).size, statSync(SRC).size);
execSync(
  `npx gltf-transform optimize "${SRC}" "${OUT}" --compress quantize --texture-compress webp --texture-size 1024 --simplify-ratio 0.6 --simplify-error 0.002`,
  { stdio: 'inherit' }
);
const after = statSync(OUT).size;
console.log(`\n✓ ${OUT}: ${(before / 1024).toFixed(0)} KB → ${(after / 1024).toFixed(0)} KB`);
