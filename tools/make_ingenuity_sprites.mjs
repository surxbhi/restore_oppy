// Code-made pixel art for the Ingenuity (Mars helicopter) chapter of Restore Oppy.
// Run: node tools/make_ingenuity_sprites.mjs
// Writes art/out/ingenuity-*.png + .json (Aseprite-style sheet data). Same style and helpers as
// tools/make_sprites.mjs (Track Detective); the helpers are copied, not imported, because importing
// make_sprites.mjs would rebuild the Track Detective prototype as a side effect.
// Optional: ZOOM_DIR=/some/dir writes 8x enlarged copies for checking by eye.

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "art", "out");
export const TILE = 40;

// ---------- palette: the shared pastel-neon colours (kept in step with make_sprites.mjs) + Ingenuity ----------
export const PAL = {
  outline: "#2a1f4a", night: "#1b1433", nightHi: "#2e2357",
  eye: "#ffffff", pupil: "#2a1f4a", shine: "#ffffff", blush: "#ff8fd0", mouth: "#2a1f4a", tongue: "#ff7ab8",
  lens: "#3a3f6e", lensHi: "#7ff7ff",
  sand: "#e8643c", sandLight: "#ff8f5e", sandDark: "#c24a2e", sandGlint: "#ffc09a",   // neon rusty red (owner, 2026-11-14)
  rock: "#9a5a7a", rockHi: "#c27ea0", rockShade: "#6e3d5c",
  neonPink: "#ff7ad9", neonCyan: "#7ff7ff", neonLime: "#b8ff7a", neonYellow: "#fff27a", neonLav: "#c6a8ff",
  // chunky body tones (same as Sojourner's M palette)
  body: "#d6deef", bodyShade: "#a3aecb", bodyHi: "#ffffff", hubDot: "#8b93b3", tool: "#7d86a8",
  panel: "#6a5ae8", panelHi: "#a89cff",
  // Ingenuity
  blade: "#f2f5ff", bladeShade: "#b9c3de", blur: "#c9f6ff", blurDim: "#9fdcec",
  mast: "#8b93b3", hub: "#ff7ad9", leg: "#5c5f80", foot: "#ff7ad9", hatch: "#ff9ee6",
  ripple: "#f07a4c", rippleLine: "#d9603a",
  pebble: "#c98a6a", pebbleHi: "#f0b393",
  airfield: "#f5895a", airfieldEdge: "#d65a36",
  outcrop: "#d9c7d8", outcropHi: "#f3e8f2", outcropLine: "#a98fb0",
};

// ---------- tiny image helpers (copied from make_sprites.mjs) ----------
class Img {
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
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
function chunkyRect(im, x, y, w, h, c, cut = 2) {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const cx = Math.min(i, w - 1 - i), cy = Math.min(j, h - 1 - j);
    if (cx + cy < cut) continue;
    im.set(x + i, y + j, c);
  }
}
function bigEyes(im, x, y, w, h, look, mood, b) {
  if (mood === "blink") { im.rect(x, y + h - 2 + b, w, 1, PAL.pupil); return; }
  if (mood === "happy") { im.set(x, y + 4 + b, PAL.pupil); for (let i = 1; i < w - 1; i++) im.set(x + i, y + 3 + b, PAL.pupil); im.set(x + w - 1, y + 4 + b, PAL.pupil); return; }
  chunkyRect(im, x, y + b, w, h, PAL.eye, 1);
  const pw = w - 2, ph = h - 3, px = x + 1 + look, py = y + 2 + b + (mood === "worried" ? -1 : 0);
  chunkyRect(im, px, py, pw, ph, PAL.pupil, 1);
  im.set(px, py, PAL.shine); im.set(px + 1, py, PAL.shine); im.set(px, py + 1, PAL.shine);
  if (mood === "worried") im.rect(x + (look > 0 ? 0 : 1), y - 2 + b, w - 1, 1, PAL.pupil);
}
function mouthAt(im, x, y, mouth) {           // x = left of a 4-wide mouth
  if (mouth === "smile") { im.set(x, y, PAL.mouth); im.rect(x + 1, y + 1, 2, 1, PAL.mouth); im.set(x + 3, y, PAL.mouth); }
  if (mouth === "open" || mouth === "talk") { chunkyRect(im, x, y, 4, mouth === "open" ? 3 : 2, PAL.mouth, 0); if (mouth === "open") im.rect(x + 1, y + 2, 2, 1, PAL.tongue); }
  if (mouth === "wobble") for (let i = 0; i < 5; i++) im.set(x - 1 + i, y + (i % 2), PAL.mouth);
}

// ---------- Ingenuity ----------
// Real hardware kept [source: see plans/INGENUITY-GAME-DESIGN.md]: two stacked rotors that spin
// opposite ways, a solar panel on top of the mast, a small box body, four splayed legs, and two
// cameras under the body (colour camera looking forward, navigation camera looking down).
// Every view uses the SAME 40 x 40 box: panel y 1..6, rotors y 6..13, body y 14..28, legs and
// feet to y 38, so Ingenuity never changes size when it turns (owner rule from Track Detective).
// The face is on the body, the colour camera is its "nose" under the face: front = where it looks.
const ROTOR_Y = [7, 11];                       // top rotor, bottom rotor (2 px thick each)
const HALF = 18;                               // blade half-length when side-on (x 2..37)
function rotor(im, y, half, broken = false) {
  if (half > 0) {
    im.rect(20 - half, y, half * 2, 1, PAL.blade); im.rect(20 - half, y + 1, half * 2, 1, PAL.bladeShade);
    if (broken) { im.rect(20 + half - 6, y, 6, 2, null); im.set(20 + half - 7, y + 1, null); }   // a chipped blade tip
  }
}
// spin phase 0..3: the two blades of each rotor seen side-on, at 0°, 45°, 90°, 135°.
// The rotors turn opposite ways, so the bottom rotor uses the mirrored phase.
const PHASE_LEN = [1, 0.66, 0.12, 0.66];
function ingenuity(view, { eyes = "open", mouth = "smile", bob = 0, spin = -1, broken = false } = {}) {
  const im = new Img(40, 40), b = bob;
  const turning = view === "back34" || view === "front34";
  // solar panel on top of the mast
  chunkyRect(im, 10, 2 + b, 20, 4, PAL.panel, 1); im.rect(11, 2 + b, 18, 1, PAL.panelHi);
  im.rect(19, 6 + b, 2, 8, PAL.mast);                                          // mast
  // rotors: still (full length) or one spin phase
  const lenTop = spin < 0 ? 1 : PHASE_LEN[spin], lenBot = spin < 0 ? 1 : PHASE_LEN[(4 - spin) % 4];
  rotor(im, ROTOR_Y[0] + b, Math.round(HALF * lenTop), broken);
  rotor(im, ROTOR_Y[1] + b, Math.round(HALF * lenBot));
  for (const y of ROTOR_Y) chunkyRect(im, 18, y - 1 + b, 4, 4, PAL.hub, 1);   // pink hubs
  // legs: four thin carbon legs splayed out to little feet (front and back pairs overlap from the side)
  const legs = view === "side" ? [[14, 6], [25, 33]] : turning ? [[13, 5], [26, 34], [20, 20]] : [[13, 5], [26, 34]];
  for (const [x0, x1] of legs) {
    const top = 27 + b;
    for (let i = 0; i <= 9; i++) { const t = i / 9, x = Math.round(x0 + (x1 - x0) * t), y = Math.round(top + (35 - top) * t); im.set(x, y, PAL.leg); im.set(x + (x1 < x0 ? 1 : x1 > x0 ? -1 : 1), y, PAL.leg); }
    chunkyRect(im, x1 - 2, 36, 5, 2, PAL.foot, 0);
  }
  // body: a small box
  chunkyRect(im, 11, 14 + b, 18, 14, PAL.body);
  im.rect(13, 15 + b, 14, 1, PAL.bodyHi); im.rect(13, 25 + b, 14, 2, PAL.bodyShade);
  // cameras under the body
  if (view === "side") { chunkyRect(im, 24, 27 + b, 5, 3, PAL.tool, 1); im.set(28, 28 + b, PAL.lensHi); }        // colour camera, looking forward
  else if (view === "front") { chunkyRect(im, 17, 27 + b, 6, 3, PAL.tool, 1); im.rect(19, 28 + b, 2, 1, PAL.lensHi); }
  else if (view === "front34") { chunkyRect(im, 22, 27 + b, 5, 3, PAL.tool, 1); im.set(25, 28 + b, PAL.lensHi); }
  if (view === "side" || view === "front" || view === "front34") im.rect(view === "side" ? 15 : 13, 27 + b, 3, 2, PAL.lens);   // navigation camera, looking down
  // back: a pink hatch where the batteries sit, no face
  if (view === "back") { chunkyRect(im, 15, 18 + b, 10, 7, PAL.tool, 1); im.rect(17, 20 + b, 6, 3, PAL.hatch); }
  if (view === "back34") { chunkyRect(im, 12, 18 + b, 8, 7, PAL.tool, 1); im.rect(14, 20 + b, 4, 3, PAL.hatch); }
  // the corner edge on half-turned views
  if (turning) {
    const split = view === "back34" ? 21 : 18;
    if (view === "back34") im.rect(split, 15 + b, 7, 12, PAL.bodyShade); else im.rect(12, 15 + b, split - 12, 12, PAL.bodyShade);
    im.rect(split, 15 + b, 1, 12, PAL.hubDot);
  }
  im.outline();
  // spinning rotors: a pale blur line across the whole disc, drawn after the outline so it stays light
  if (spin >= 0) for (const y of ROTOR_Y) for (let x = 2; x <= 37; x++) {
    const c = im.get(x, y + b);
    if (!c || c === PAL.outline) im.set(x, y + b, (x + spin) % 3 ? PAL.blur : PAL.blurDim);
  }
  // face
  if (view === "side") {
    bigEyes(im, 17, 16, 5, 7, 1, eyes, b); bigEyes(im, 23, 16, 5, 7, 1, eyes, b);
    im.rect(16, 23 + b, 2, 1, PAL.blush); im.rect(27, 23 + b, 1, 1, PAL.blush);
    mouthAt(im, 22, 23 + b, mouth);
  } else if (view === "front") {
    bigEyes(im, 13, 16, 6, 8, 0, eyes, b); bigEyes(im, 21, 16, 6, 8, 0, eyes, b);
    im.rect(12, 24 + b, 2, 1, PAL.blush); im.rect(26, 24 + b, 2, 1, PAL.blush);
    mouthAt(im, 18, 24 + b, mouth);
  } else if (view === "front34") {
    bigEyes(im, 19, 16, 4, 7, 1, eyes, b); bigEyes(im, 24, 16, 4, 7, 1, eyes, b);
    mouthAt(im, 22, 24 + b, mouth);
  } else if (view === "back34") {
    bigEyes(im, 24, 16, 3, 6, 1, eyes, b);                                       // one eye peeking round the front
  }
  return im;
}
// Its shadow, seen from straight above: rotors as an X, the body, and four legs. The game draws it
// on the ground under the helicopter, see-through, further away as it climbs (light from the top left).
function ingenuityShadow(spin = 0) {
  const im = new Img(40, 40), c = PAL.outline;
  if (spin < 0) { im.line(4, 4, 35, 35, c); im.line(5, 4, 36, 35, c); im.line(35, 4, 4, 35, c); im.line(36, 4, 5, 35, c); }
  else for (let y = 0; y < 40; y++) for (let x = 0; x < 40; x++) { const d = Math.hypot(x - 19.5, y - 19.5); if (d < 18 && d > 16.5) im.set(x, y, c); }
  im.rect(15, 15, 10, 10, c);
  for (const [x, y] of [[9, 9], [29, 9], [9, 29], [29, 29]]) im.rect(x, y, 2, 2, c);
  return im;
}

const SIDE = [
  ["idle", {}], ["idle", { eyes: "blink" }],
  ["fly", { spin: 0 }], ["fly", { spin: 1, bob: -1 }], ["fly", { spin: 2, bob: -1 }], ["fly", { spin: 3 }],
  ["talk", { mouth: "talk" }], ["talk", { mouth: "open" }],
  ["happy", { eyes: "happy", mouth: "open", spin: 0 }], ["happy", { eyes: "happy", mouth: "open", spin: 2, bob: -1 }],
  ["worried", { eyes: "worried", mouth: "wobble" }], ["worried", { eyes: "worried", mouth: "wobble", bob: 1 }],
  ["broken", { eyes: "worried", mouth: "wobble", broken: true }],
];
const FRONT = [
  ["idle", {}], ["idle", { eyes: "blink" }],
  ["fly", { spin: 0 }], ["fly", { spin: 1, bob: -1 }], ["fly", { spin: 2, bob: -1 }], ["fly", { spin: 3 }],
  ["happy", { eyes: "happy", mouth: "open", spin: 0 }], ["worried", { eyes: "worried", mouth: "wobble" }],
];
const BACK = [["idle", {}], ["fly", { spin: 0 }], ["fly", { spin: 1, bob: -1 }], ["fly", { spin: 2, bob: -1 }], ["fly", { spin: 3 }]];
const TURN_VIEWS = [["up", "back"], ["upRight", "back34"], ["right", "side"], ["downRight", "front34"], ["down", "front"]];

// ---------- ground and props, 40 x 40 ----------
function sand(seed) {
  const im = new Img(TILE, TILE), r = rng(seed);
  im.rect(0, 0, TILE, TILE, PAL.sand);
  for (let i = 0; i < 40; i++) im.set(r() * TILE, r() * TILE, r() < 0.5 ? PAL.sandLight : PAL.sandDark);
  for (let i = 0; i < 4; i++) { const x = 3 + r() * 34, y = 3 + r() * 34; im.set(x, y, PAL.sandDark); im.set(x + 1, y, PAL.sandDark); im.set(x, y - 1, PAL.sandGlint); }
  return im;
}
function rockShape(seed) {                    // same mauve rock as Track Detective: can be flown over, never landed on
  const im = new Img(TILE, TILE), r = rng(seed);
  for (const [x, y, rad] of [[20, 25, 10], [13, 28, 6], [27, 28, 6]]) im.disc(x + (r() - 0.5) * 2, y, rad, PAL.rock);
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
    if (!im.get(x, y)) continue;
    if (!im.get(x - 2, y - 2)) im.set(x, y, PAL.rockHi);
    else if (!im.get(x + 1, y + 2)) im.set(x, y, PAL.rockShade);
  }
  for (let i = 0; i < 7; i++) { const x = 11 + r() * 18, y = 20 + r() * 10; if (im.get(x, y) === PAL.rock) im.set(x, y, PAL.rockShade); }
  im.outline();
  return im;
}
// Smooth sand ripples: no pebbles, no rocks, nothing for the navigation camera to hold on to.
// Like the "steep, relatively featureless sand ripples" of its last flight (JPL accident investigation).
function ripples() {
  const im = new Img(TILE, TILE);
  im.rect(0, 0, TILE, TILE, PAL.ripple);
  for (let k = 0; k < 5; k++) {
    const y0 = 4 + k * 8;
    for (let x = 0; x < TILE; x++) { const y = y0 + Math.round(Math.sin((x + k * 7) / 6.4) * 1.6); im.set(x, y, PAL.rippleLine); im.set(x, y - 1, PAL.sandLight); }
  }
  return im;
}
function onSand(top, seed) { const im = sand(seed); im.blit(top, 0, 0); return im; }
// An airfield: a flat, smooth, rock-free patch the team picked from earlier pictures [source].
// It is a kind of ground, not a marker: lighter, rounder, with a few pebbles at its edge. No ring, no glow.
function airfield() {
  const im = sand(13), r = rng(14);
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
    const d = Math.hypot((x - 19.5) / 1.15, y - 20);
    if (d < 14) im.set(x, y, d < 13 ? PAL.airfield : PAL.airfieldEdge);
  }
  for (const [x, y] of [[12, 15], [25, 13], [16, 26], [27, 24]]) { im.rect(x, y, 2, 1, PAL.pebble); im.set(x, y, PAL.pebbleHi); }   // a few tiny pebbles for the down camera
  for (let i = 0; i < 6; i++) { const a = r() * Math.PI * 2, x = Math.round(19.5 + Math.cos(a) * 16.5), y = Math.round(20 + Math.sin(a) * 14); im.rect(x, y, 2, 2, PAL.pebble); im.set(x, y, PAL.pebbleHi); }
  return im;
}
// A rock outcrop the science team wants pictures of: pale, flat-topped, with stripes (layers).
function outcrop() {
  const im = new Img(TILE, TILE);
  for (let y = 0; y < 16; y++) { const w = 30 - Math.round(Math.abs(y - 3) * 0.6); im.rect(20 - Math.floor(w / 2), 17 + y, w, 1, PAL.outcrop); }
  for (const y of [21, 25, 29]) for (let x = 6; x < 34; x++) if (im.get(x, y)) im.set(x, y, PAL.outcropLine);
  for (let x = 6; x < 34; x++) if (im.get(x, 17)) { im.set(x, 17, PAL.outcropHi); im.set(x, 18, PAL.outcropHi); }
  im.outline();
  return im;
}
const TILES = [["sand", sand(1)], ["rock", onSand(rockShape(3), 3)], ["ripples", ripples()], ["airfield", airfield()], ["outcrop", onSand(outcrop(), 6)]];

// ---------- PNG writer (Node zlib + own CRC) ----------
const CRC = new Uint32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
function crc32(buf) { let c = 0xffffffff; for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]), crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(im) {
  const row = im.w * 4 + 1, raw = Buffer.alloc(row * im.h);
  for (let y = 0; y < im.h; y++) for (let x = 0; x < im.w; x++) {
    const c = im.get(x, y), o = y * row + 1 + x * 4;
    if (!c) continue;
    raw[o] = parseInt(c.slice(1, 3), 16); raw[o + 1] = parseInt(c.slice(3, 5), 16); raw[o + 2] = parseInt(c.slice(5, 7), 16); raw[o + 3] = 255;
  }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(im.w, 0); ihdr.writeUInt32BE(im.h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}
function sheet(name, items) {
  const fw = items[0][1].w, fh = items[0][1].h;
  const s = new Img(fw * items.length, fh);
  items.forEach(([, im], i) => s.blit(im, i * fw, 0));
  const frames = items.map(([label], i) => ({ filename: `${name} ${i}`, label, frame: { x: i * fw, y: 0, w: fw, h: fh }, duration: 100 }));
  const tags = [];
  items.forEach(([label], i) => { const t = tags.at(-1); if (t && t.name === label) t.to = i; else tags.push({ name: label, from: i, to: i, direction: "forward" }); });
  const data = { frames, meta: { app: "tools/make_ingenuity_sprites.mjs", image: `${name}.png`, size: { w: s.w, h: fh }, scale: "1", frameTags: tags } };
  const buf = png(s);
  fs.writeFileSync(path.join(OUT, `${name}.png`), buf);
  fs.writeFileSync(path.join(OUT, `${name}.json`), JSON.stringify(data, null, 2));
  if (process.env.ZOOM_DIR) {
    const z = 8, big = new Img(s.w * z, s.h * z);
    for (let y = 0; y < big.h; y++) for (let x = 0; x < big.w; x++) big.set(x, y, s.get(Math.floor(x / z), Math.floor(y / z)) || PAL.nightHi);
    fs.writeFileSync(path.join(process.env.ZOOM_DIR, `${name}-8x.png`), png(big));
  }
  return { src: "data:image/png;base64," + buf.toString("base64"), fw, fh, tags, names: items.map(([n]) => n) };
}

fs.mkdirSync(OUT, { recursive: true });
export const ASSETS = {
  ingenuity: sheet("ingenuity", SIDE.map(([l, o]) => [l, ingenuity("side", o)])),
  ingenuityFront: sheet("ingenuity-front", FRONT.map(([l, o]) => [l, ingenuity("front", o)])),
  ingenuityBack: sheet("ingenuity-back", BACK.map(([l, o]) => [l, ingenuity("back", o)])),
  // one frame per 45° from facing up to facing down (right-hand side), rotors spinning; the game flips for the left
  ingenuityTurn: sheet("ingenuity-turn", TURN_VIEWS.flatMap(([n, v]) => [0, 1, 2, 3].map(s => [n, ingenuity(v, { spin: s, bob: s % 3 ? -1 : 0 })]))),
  ingenuityShadow: sheet("ingenuity-shadow", [["still", ingenuityShadow(-1)], ["spin", ingenuityShadow(0)]]),
  ingenuityTiles: sheet("ingenuity-tiles", TILES),
  // props without a sand square behind them, for the board (the board draws its own seamless ground)
  ingenuityProps: sheet("ingenuity-props", [["outcrop", outcrop()]]),
};
console.log("wrote", Object.keys(ASSETS).map(k => `${k} ${ASSETS[k].fw}x${ASSETS[k].fh}x${ASSETS[k].names.length}`).join(", "));

// ---------- build the playable prototype: prototype/ingenuity-flight-plan.html ----------
// Curiosity, Oppy and the plain rocks are shared with Track Detective: read their finished sheets from
// art/out (made by tools/make_sprites.mjs) instead of drawing them again.
function reuse(name) {
  const data = JSON.parse(fs.readFileSync(path.join(OUT, name + ".json"), "utf8"));
  const f = data.frames;
  return { src: "data:image/png;base64," + fs.readFileSync(path.join(OUT, name + ".png")).toString("base64"),
    fw: f[0].frame.w, fh: f[0].frame.h, tags: data.meta.frameTags, names: f.map(x => x.label) };
}
const tplPath = path.join(ROOT, "prototype", "ingenuity-flight-plan.template.html");
if (fs.existsSync(tplPath)) {
  const GAME = { ...ASSETS, curiosityFull: reuse("curiosity-full"), curiosity: reuse("curiosity"), oppy: reuse("oppy"), oppyParts: reuse("oppy-parts"), rockKinds: reuse("rock-kinds") };
  const html = fs.readFileSync(tplPath, "utf8")
    .replace("__ASSETS__", () => JSON.stringify(GAME))
    .replace("__PAL__", () => JSON.stringify(PAL));
  fs.writeFileSync(path.join(ROOT, "prototype", "ingenuity-flight-plan.html"), html);
  console.log("wrote prototype/ingenuity-flight-plan.html", Math.round(html.length / 1024), "KB");

  // Optional: ARTIFACT_DIR=/some/dir writes a shareable copy (index.html + storytimes/ingenuity-story.js).
  // It carries only Person 1's Ingenuity story (read from storytimes/stories.js, never edited), and its
  // paths point inside the folder, so it can be published as a web page with its two photos beside it.
  if (process.env.ARTIFACT_DIR) {
    const dir = process.env.ARTIFACT_DIR, vm = await import("node:vm");
    const ctx = { window: {} }; vm.createContext(ctx);
    vm.runInContext(fs.readFileSync(path.join(ROOT, "storytimes", "stories.js"), "utf8"), ctx);
    const story = ctx.window.restoreOppyStories?.ingenuity;
    fs.mkdirSync(path.join(dir, "storytimes"), { recursive: true });
    fs.writeFileSync(path.join(dir, "storytimes", "ingenuity-story.js"),
      "// Person 1's Ingenuity story, copied from storytimes/stories.js for the shared game page.\n" +
      "window.restoreOppyStories = " + JSON.stringify({ ingenuity: story }, null, 1) + ";\n");
    const page = html
      .replace('<script src="../storytimes/stories.js"></script>', '<script src="storytimes/ingenuity-story.js"></script>')
      .replace('const STORY_MEDIA = "../storytimes/media/";', 'const STORY_MEDIA = "storytimes/media/";');
    fs.writeFileSync(path.join(dir, "index.html"), page);
    fs.cpSync(path.join(ROOT, "prototype", "media"), path.join(dir, "media"), { recursive: true });   // the story-time NASA pictures
    console.log("wrote shareable copy to", dir);
  }
}
