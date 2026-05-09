// Pure Node.js PNG generator — no external deps required
const zlib = require('zlib');
const fs   = require('fs');
const path = require('path');

// ── CRC32 table ──────────────────────────────────────────────────────────────
const CRC_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
  CRC_TABLE[i] = c;
}
function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) crc = CRC_TABLE[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}
function chunk(type, data) {
  const t = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const crcBuf = Buffer.alloc(4); crcBuf.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crcBuf]);
}

// ── PNG builder ───────────────────────────────────────────────────────────────
function buildPNG(w, h, pixels /* Uint8Array RGBA, row-major */) {
  const sig  = Buffer.from([137,80,78,71,13,10,26,10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8]=8; ihdr[9]=6; // 8-bit RGBA
  // Build raw image data (filter byte 0 per row)
  const raw = Buffer.alloc(h * (1 + w * 4));
  for (let y = 0; y < h; y++) {
    raw[y * (1 + w * 4)] = 0; // filter None
    for (let x = 0; x < w; x++) {
      const src = (y * w + x) * 4;
      const dst = y * (1 + w * 4) + 1 + x * 4;
      raw[dst]   = pixels[src];
      raw[dst+1] = pixels[src+1];
      raw[dst+2] = pixels[src+2];
      raw[dst+3] = pixels[src+3];
    }
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

// ── pixel helpers ─────────────────────────────────────────────────────────────
function setRGBA(pixels, w, x, y, r, g, b, a) {
  if (x < 0 || x >= w || y < 0 || y >= pixels.length / (4 * w)) return;
  const i = (y * w + x) * 4;
  // Alpha blend over existing
  const srcA = a / 255, dstA = pixels[i+3] / 255;
  const outA = srcA + dstA * (1 - srcA);
  if (outA === 0) return;
  pixels[i]   = Math.round((r * srcA + pixels[i]   * dstA * (1-srcA)) / outA);
  pixels[i+1] = Math.round((g * srcA + pixels[i+1] * dstA * (1-srcA)) / outA);
  pixels[i+2] = Math.round((b * srcA + pixels[i+2] * dstA * (1-srcA)) / outA);
  pixels[i+3] = Math.round(outA * 255);
}

// Anti-aliased circle check (for rounded corners)
function circleAlpha(px, py, cx, cy, r) {
  const d = Math.sqrt((px-cx)**2 + (py-cy)**2);
  if (d < r - 0.7) return 255;
  if (d > r + 0.7) return 0;
  return Math.round((r + 0.7 - d) / 1.4 * 255);
}

// ── draw icon ─────────────────────────────────────────────────────────────────
function drawIcon(size, maskable = false) {
  const pixels = new Uint8Array(size * size * 4);

  const R  = [16,  185, 129]; // #10b981 primary green
  const R2 = [5,   150, 105]; // #059669 darker green
  const rd = maskable ? 0 : Math.round(size * 0.185); // corner radius

  // ── background ────────────────────────────────────────────────────────────
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let alpha = 255;
      if (!maskable) {
        // rounded corners via AA
        const cx = x < rd ? rd : x > size-1-rd ? size-1-rd : x;
        const cy = y < rd ? rd : y > size-1-rd ? size-1-rd : y;
        if (cx !== x || cy !== y) {
          alpha = circleAlpha(x, y, cx, cy, rd);
        }
      }
      // gradient: top-left lighter, bottom-right darker
      const t = (x + y) / (2 * (size - 1));
      const gr = Math.round(R[0] + (R2[0]-R[0]) * t);
      const gg = Math.round(R[1] + (R2[1]-R[1]) * t);
      const gb = Math.round(R[2] + (R2[2]-R[2]) * t);
      setRGBA(pixels, size, x, y, gr, gg, gb, alpha);
    }
  }

  // ── open book (Lucide BookOpen paths, scaled + centered) ──────────────────
  // Source paths are in 24×24 viewBox. We scale to ~55% of icon size.
  const bookSz = size * 0.55;
  const sc = bookSz / 24;
  // Center: source x range ≈ 2–22 (mid 12), y range ≈ 3–20 (mid 11.5)
  const ox = size / 2 - 12 * sc;
  const oy = size / 2 - 11.5 * sc;

  // Stroke pixel AA helper
  function strokeLine(x0, y0, x1, y1, sw) {
    const dx = x1-x0, dy = y1-y0, len = Math.sqrt(dx*dx+dy*dy);
    if (len === 0) return;
    const steps = Math.ceil(len * 2);
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const px = x0 + dx*t, py = y0 + dy*t;
      const hw = sw / 2;
      for (let iy = Math.floor(py-hw-1); iy <= Math.ceil(py+hw+1); iy++) {
        for (let ix = Math.floor(px-hw-1); ix <= Math.ceil(px+hw+1); ix++) {
          const dist = Math.sqrt((ix-px)**2 + (iy-py)**2);
          const a = Math.max(0, Math.min(255, Math.round((hw+0.5-dist) / 1.0 * 255)));
          if (a > 0) setRGBA(pixels, size, ix, iy, 255, 255, 255, a);
        }
      }
    }
  }

  // Transform a point from 24×24 → pixel space
  const tx = (x) => ox + x * sc;
  const ty = (y) => oy + y * sc;
  const sw = sc * 1.5; // stroke width

  // Left cover (approx rectangle with slight taper)
  // M2 3 h6 a4 4 0 0 1 4 4 v14 a3 3 0 0 0 -3 -3 H2 z
  // Simplified as: top-left(2,3) top-right(12,7) bottom-right(9,17+3)=(9,20) bottom-left(2,17+3)=(2,20)?
  // Let's just draw the outline segments
  strokeLine(tx(2),ty(3),  tx(8),ty(3),  sw); // top
  strokeLine(tx(8),ty(3),  tx(12),ty(7), sw); // top-right curve approx
  strokeLine(tx(12),ty(7), tx(12),ty(17),sw); // right (v14)
  strokeLine(tx(12),ty(17),tx(9),ty(20), sw); // bottom curve
  strokeLine(tx(9),ty(20), tx(2),ty(20), sw); // bottom
  strokeLine(tx(2),ty(20), tx(2),ty(3),  sw); // left

  // Right cover
  // M22 3 h-6 a4 4 0 0 0 -4 4 v14 a3 3 0 0 1 3 -3 H22 z
  strokeLine(tx(22),ty(3),  tx(16),ty(3),  sw);
  strokeLine(tx(16),ty(3),  tx(12),ty(7),  sw);
  strokeLine(tx(12),ty(7),  tx(12),ty(17), sw);
  strokeLine(tx(12),ty(17), tx(15),ty(20), sw);
  strokeLine(tx(15),ty(20), tx(22),ty(20), sw);
  strokeLine(tx(22),ty(20), tx(22),ty(3),  sw);

  return buildPNG(size, size, pixels);
}

// ── output ────────────────────────────────────────────────────────────────────
const outDir = path.join(__dirname, '..', 'public', 'icons');
fs.mkdirSync(outDir, { recursive: true });

const sizes = [
  { size: 192, maskable: false, name: 'icon-192.png' },
  { size: 512, maskable: true,  name: 'icon-512.png' },
];

for (const { size, maskable, name } of sizes) {
  const buf = drawIcon(size, maskable);
  const p = path.join(outDir, name);
  fs.writeFileSync(p, buf);
  console.log(`✓  ${name}  (${buf.length.toLocaleString()} bytes)`);
}
console.log('Done.');
