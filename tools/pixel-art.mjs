// Shared pixel-art kit for Restore Oppy mini-games (drawn in code, no dependencies).
// Copied from tools/make_sprites.mjs (Track Detective), which still has its own copy so that game
// is untouched. New games import from here:  import { PAL, M, Img, ... } from "./pixel-art.mjs";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

// ---------- palette: pastel neon ----------
export const PAL = {
  outline: "#2a1f4a", night: "#1b1433", nightHi: "#2e2357",
  // metal (Sojourner, Curiosity)
  metalHi: "#f4f7ff", metal: "#cdd6ea", metalMid: "#aab5d0", metalLow: "#8590b2", metalDeep: "#646e93",
  rim: "#7ff7ff", rivet: "#8a95b6",
  panel: "#5b4bd6", panelHi: "#9d8cff", panelLine: "#3d2f9e", panelSpec: "#ff9ee6",
  tire: "#5c5f80", wheel: "#c3cbe0", hub: "#ffffff",
  eye: "#ffffff", pupil: "#2a1f4a", shine: "#ffffff", iris: "#4fd6ff", blush: "#ff8fd0", mouth: "#2a1f4a", tongue: "#ff7ab8",
  lens: "#3a3f6e", lensHi: "#7ff7ff", leg: "#9aa3c4", antennaTip: "#ff7ad9",
  // Mars, pastel
  sand: "#e8643c", sandLight: "#ff8f5e", sandDark: "#c24a2e", sandGlint: "#ffc09a",   // neon rusty red (owner, 2026-11-14)
  rock: "#9a5a7a", rockHi: "#c27ea0", rockShade: "#6e3d5c",
  // neon accents
  neonPink: "#ff7ad9", neonCyan: "#7ff7ff", neonLime: "#b8ff7a", neonYellow: "#fff27a", neonLav: "#c6a8ff",
  track: "#b5412a", trackDeep: "#93321f",
};

// ---------- tiny image helpers ----------
export class Img {
  constructor(w, h) { this.w = w; this.h = h; this.p = new Array(w * h).fill(null); }
  set(x, y, c) { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.p[y * this.w + x] = c; }
  get(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h ? this.p[y * this.w + x] : null; }
  rect(x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c); }
  disc(cx, cy, r, c) {
    for (let y = Math.floor(cy - r - 1); y <= Math.ceil(cy + r + 1); y++)
      for (let x = Math.floor(cx - r - 1); x <= Math.ceil(cx + r + 1); x++)
        if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r + r * 0.6) this.set(x, y, c);
  }
  line(x0, y0, x1, y1, c) {
    let dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1, e = dx + dy;
    for (;;) { this.set(x0, y0, c); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } }
  }
  outline(c = PAL.outline) {
    const add = [];
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      if (this.get(x, y)) continue;
      if (this.get(x - 1, y) || this.get(x + 1, y) || this.get(x, y - 1) || this.get(x, y + 1)) add.push([x, y]);
    }
    for (const [x, y] of add) this.set(x, y, c);
  }
  blit(src, ox, oy) { for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) { const c = src.get(x, y); if (c) this.set(ox + x, oy + y, c); } }
}

export function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

// ---------- chunky platform-game style (owner, 2026-11-14) ----------
export const M = {
  body: "#d6deef", bodyShade: "#a3aecb", bodyHi: "#ffffff",
  panel: "#6a5ae8", panelHi: "#a89cff", tire: "#46496e", hub: "#e8ecf6", hubDot: "#8b93b3",
  tool: "#7d86a8",
};
export function chunkyRect(im, x, y, w, h, c, cut = 2) {        // rectangle with cut corners (rounded look)
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const cx = Math.min(i, w - 1 - i), cy = Math.min(j, h - 1 - j);
    if (cx + cy < cut) continue;
    im.set(x + i, y + j, c);
  }
}
export function bigEyes(im, x, y, w, h, look, mood, b) {        // one tall cartoon eye; look = pupil offset
  if (mood === "blink") { im.rect(x, y + h - 2 + b, w, 1, PAL.pupil); return; }
  if (mood === "happy") { im.set(x, y + 4 + b, PAL.pupil); for (let i = 1; i < w - 1; i++) im.set(x + i, y + 3 + b, PAL.pupil); im.set(x + w - 1, y + 4 + b, PAL.pupil); return; }
  chunkyRect(im, x, y + b, w, h, PAL.eye, 1);
  const pw = w - 2, ph = h - 3, px = x + 1 + look, py = y + 2 + b + (mood === "worried" ? -1 : 0);
  chunkyRect(im, px, py, pw, ph, PAL.pupil, 1);
  im.set(px, py, PAL.shine); im.set(px + 1, py, PAL.shine); im.set(px, py + 1, PAL.shine);
  if (mood === "worried") im.rect(x + (look > 0 ? 0 : 1), y - 2 + b, w - 1, 1, PAL.pupil);    // little brow
}
export function chunkyWheel(im, cx, cy, r, phase) {
  im.disc(cx, cy, r, M.tire); im.disc(cx, cy, r * 0.5, M.hub);
  const a = phase * Math.PI / 2; im.set(cx + Math.cos(a) * r * 0.5, cy + Math.sin(a) * r * 0.5, M.hubDot);
}

// ---------- PNG writer ----------
const CRC = new Uint32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
function crc32(buf) { let c = 0xffffffff; for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
export function png(im) {
  const row = im.w * 4 + 1, raw = Buffer.alloc(row * im.h);
  for (let y = 0; y < im.h; y++) for (let x = 0; x < im.w; x++) {
    const c = im.get(x, y), o = y * row + 1 + x * 4;
    if (!c) continue;
    raw[o] = parseInt(c.slice(1, 3), 16); raw[o + 1] = parseInt(c.slice(3, 5), 16); raw[o + 2] = parseInt(c.slice(5, 7), 16); raw[o + 3] = 255;
  }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(im.w, 0); ihdr.writeUInt32BE(im.h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}

// ---------- sheets + Aseprite-style JSON ----------

// One horizontal strip of same-size frames + Aseprite-style JSON (frameTags group equal labels).
export function sheet(outDir, name, items, app = "tools/pixel-art.mjs") {
  const fw = items[0][1].w, fh = items[0][1].h;
  const s = new Img(fw * items.length, fh);
  items.forEach(([, im], i) => s.blit(im, i * fw, 0));
  const frames = items.map(([label], i) => ({ filename: `${name} ${i}`, label, frame: { x: i * fw, y: 0, w: fw, h: fh }, duration: 100 }));
  const tags = [];
  items.forEach(([label], i) => { const t = tags.at(-1); if (t && t.name === label) t.to = i; else tags.push({ name: label, from: i, to: i, direction: "forward" }); });
  const data = { frames, meta: { app, image: `${name}.png`, size: { w: s.w, h: fh }, scale: "1", frameTags: tags } };
  const buf = png(s);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, `${name}.png`), buf);
  fs.writeFileSync(path.join(outDir, `${name}.json`), JSON.stringify(data, null, 2));
  if (process.env.ZOOM_DIR) {
    const z = 8, big = new Img(s.w * z, s.h * z);
    for (let y = 0; y < big.h; y++) for (let x = 0; x < big.w; x++) big.set(x, y, s.get(Math.floor(x / z), Math.floor(y / z)) || PAL.nightHi);
    fs.writeFileSync(path.join(process.env.ZOOM_DIR, `${name}-8x.png`), png(big));
  }
  return { src: "data:image/png;base64," + buf.toString("base64"), fw, fh, tags, names: items.map(([n]) => n) };
}
