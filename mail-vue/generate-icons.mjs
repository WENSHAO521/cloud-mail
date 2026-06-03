/**
 * Generates PWA + apple-touch-icon PNG files from the PSG favicon design.
 * Uses only Node.js built-ins (zlib, fs) — no external dependencies.
 * Run: node generate-icons.mjs
 */
import { deflateSync } from 'zlib';
import { writeFileSync } from 'fs';

// ─── CRC32 ───────────────────────────────────────────────────────────────────
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) crc = CRC_TABLE[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// ─── PNG encoder ─────────────────────────────────────────────────────────────
function makePNG(pixels, w, h) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 2; // 8-bit RGB

  // filter byte 0 (None) + RGB scanlines
  const raw = Buffer.alloc(h * (1 + w * 3));
  for (let y = 0; y < h; y++) {
    raw[y * (1 + w * 3)] = 0;
    for (let x = 0; x < w; x++) {
      const pi = (y * w + x) * 3;
      const si = y * (1 + w * 3) + 1 + x * 3;
      raw[si] = pixels[pi]; raw[si + 1] = pixels[pi + 1]; raw[si + 2] = pixels[pi + 2];
    }
  }

  function chunk(type, data) {
    const t = Buffer.from(type, 'ascii');
    const l = Buffer.alloc(4); l.writeUInt32BE(data.length);
    const c = Buffer.alloc(4); c.writeUInt32BE(crc32(Buffer.concat([t, data])));
    return Buffer.concat([l, t, data, c]);
  }

  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

// ─── Draw helpers ────────────────────────────────────────────────────────────
function fill(px, w, h, x1, y1, x2, y2, r, g, b) {
  for (let y = Math.max(0, y1); y < Math.min(h, y2); y++)
    for (let x = Math.max(0, x1); x < Math.min(w, x2); x++) {
      const i = (y * w + x) * 3;
      px[i] = r; px[i + 1] = g; px[i + 2] = b;
    }
}

// Filled semi-circle bowl (right half of a circle) via per-pixel test
function fillBowl(px, w, h, cx, cy, rx, ry, r, g, b) {
  const x1 = Math.round(cx - rx), x2 = Math.round(cx + rx);
  const y1 = Math.round(cy - ry), y2 = Math.round(cy + ry);
  for (let y = Math.max(0, y1); y < Math.min(h, y2); y++)
    for (let x = Math.max(0, x1); x < Math.min(w, x2); x++) {
      const dx = (x - cx) / rx, dy = (y - cy) / ry;
      if (dx * dx + dy * dy <= 1) {
        const i = (y * w + x) * 3;
        px[i] = r; px[i + 1] = g; px[i + 2] = b;
      }
    }
}

// ─── Icon renderer ───────────────────────────────────────────────────────────
// Design is based on the 32×32 favicon geometry, scaled to any size.
// offsetX / offsetY shift the design (used for maskable safe-zone centering).
function renderPSG(size, offsetX = 0, offsetY = 0, designScale = 1) {
  const px = new Uint8Array(size * size * 3);
  const s = (size / 32) * designScale; // pixels per favicon unit

  const bg = [0x11, 0x11, 0x11];
  const red = [0xCC, 0x00, 0x00];
  const white = [0xFF, 0xFF, 0xFF];

  // background
  fill(px, size, size, 0, 0, size, size, ...bg);

  // red left bar (0..5 in 32px coords)
  fill(px, size, size, offsetX, 0, Math.round(offsetX + 5 * s), size, ...red);

  // P stem (x=10..13.5, y=7..27)
  fill(px, size, size,
    Math.round(offsetX + 10 * s), Math.round(offsetY + 7 * s),
    Math.round(offsetX + 13.5 * s), Math.round(offsetY + 27 * s),
    ...white);

  // P bowl — D-shape: right half of an ellipse + rectangle on left
  // Outer filled area (x=13.5..24.5, y=7..16.6)
  const bx1 = Math.round(offsetX + 13.5 * s);
  const by1 = Math.round(offsetY + 7 * s);
  const by2 = Math.round(offsetY + 16.6 * s);
  const bowlCX = offsetX + 14 * s;       // center of ellipse x
  const bowlCY = offsetY + 11.8 * s;     // center of ellipse y
  const bowlRX = 10.5 * s;               // horizontal radius
  const bowlRY = 4.8 * s;                // vertical radius

  // Fill right half of ellipse
  fillBowl(px, size, size, bowlCX, bowlCY, bowlRX, bowlRY, ...white);
  // Clip left side: anything left of the stem join is already covered by stem
  fill(px, size, size, 0, by1, bx1, by2, ...bg);
  fill(px, size, size, 0, by1, bx1, by2, ...bg); // belt-and-suspenders

  // Restore stem over any ellipse bleed
  fill(px, size, size,
    Math.round(offsetX + 10 * s), Math.round(offsetY + 7 * s),
    Math.round(offsetX + 13.5 * s), Math.round(offsetY + 27 * s),
    ...white);

  // P bowl inner cutout ellipse
  const icX = offsetX + 14 * s;
  const icY = offsetY + 11.8 * s;
  const icRX = 8 * s;
  const icRY = 2.4 * s;
  fillBowl(px, size, size, icX, icY, icRX, icRY, ...bg);

  // Re-draw stem (inner ellipse may bleed left)
  fill(px, size, size,
    Math.round(offsetX + 10 * s), Math.round(offsetY + 7 * s),
    Math.round(offsetX + 13.5 * s), Math.round(offsetY + 27 * s),
    ...white);

  // Red colophon rule (x=10..24.5, y=29.5..31)
  fill(px, size, size,
    Math.round(offsetX + 10 * s), Math.round(offsetY + 29.5 * s),
    Math.round(offsetX + 24.5 * s), Math.round(offsetY + 31 * s),
    ...red);

  return px;
}

// ─── Generate files ──────────────────────────────────────────────────────────

// Regular icons: full-bleed design (red bar goes edge-to-edge)
for (const size of [192, 512]) {
  const px = renderPSG(size);
  writeFileSync(`./public/pwa-${size}.png`, makePNG(px, size, size));
  console.log(`✓ pwa-${size}.png`);
}

// Apple touch icon 180×180
{
  const px = renderPSG(180);
  writeFileSync('./public/apple-touch-icon.png', makePNG(px, 180, 180));
  console.log('✓ apple-touch-icon.png');
}

// Maskable 512×512: design centered in 80% safe zone (10% padding each side)
{
  const size = 512;
  const pad = Math.round(size * 0.12);   // 12% padding
  const designSize = size - pad * 2;
  const scale = designSize / 32;
  const px = renderPSG(size, pad, pad, designSize / 32 / (size / 32));
  writeFileSync('./public/pwa-maskable-512.png', makePNG(px, size, size));
  console.log('✓ pwa-maskable-512.png');
}

console.log('\nAll icons written to public/');
