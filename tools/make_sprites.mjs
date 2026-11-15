// Code-made pixel art for Track Detective (Sojourner chapter).
// Run: node tools/make_sprites.mjs
// Writes art/out/<sheet>.png + .json (Aseprite-style sheet data that Phaser can load) and builds
// prototype/track-detective.html from prototype/track-detective.template.html with the art inlined.
// No dependencies: PNGs are written with Node's built-in zlib.
// Optional: ZOOM_DIR=/some/dir writes 8x enlarged copies for checking by eye.

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "art", "out");
export const TILE = 40;

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

// A wheel seen from the side: tyre, metal disc, hub, cleats that shift with `phase`.
function wheel(im, cx, cy, r, phase) {
  im.disc(cx, cy, r, PAL.tire);
  im.disc(cx, cy, r - 1.4, PAL.wheel);
  im.disc(cx, cy, Math.max(1, r - 3), PAL.metalMid);
  im.set(cx, cy, PAL.hub);
  const n = 8;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + (phase ? Math.PI / n : 0);
    im.set(cx + Math.cos(a) * (r + 0.4), cy + Math.sin(a) * (r + 0.4), PAL.wheel);
  }
}

// ---------- Sojourner: 40 x 40, metallic, facing right, anchor bottom centre ----------
function sojourner({ eyes = "open", mouth = "smile", bob = 0, wheelPhase = 0 } = {}) {
  const im = new Img(40, 40), b = bob;
  // antenna at the back
  im.line(10, 9 + b, 10, 4 + b, PAL.leg);
  im.rect(9, 2 + b, 3, 3, PAL.antennaTip); im.set(9, 2 + b, "#ffd1f2");
  // solar panel: wide, flat, neon violet cells with a pink shine
  im.rect(4, 9 + b, 32, 4, PAL.panel);
  im.rect(4, 9 + b, 32, 1, PAL.panelHi);
  for (let x = 8; x < 36; x += 5) { im.set(x, 10 + b, PAL.panelLine); im.set(x, 11 + b, PAL.panelLine); }
  im.rect(4, 12 + b, 32, 1, PAL.panelLine);
  im.set(6, 10 + b, PAL.panelSpec); im.set(7, 10 + b, PAL.panelSpec); im.set(21, 10 + b, PAL.panelSpec);
  // body: metal box with highlight, shading, rivets and a neon rim light
  im.rect(8, 13 + b, 24, 13, PAL.metal);
  im.rect(8, 13 + b, 24, 2, PAL.metalHi);
  im.rect(8, 23 + b, 24, 2, PAL.metalMid);
  im.rect(8, 25 + b, 24, 1, PAL.metalLow);
  for (let i = 0; i < 4; i++) im.set(10 + i, 16 + b + i, PAL.metalHi);       // diagonal shine
  im.set(11, 15 + b, PAL.metalHi);
  for (const [x, y] of [[9, 14], [30, 14], [9, 24], [30, 24]]) im.set(x, y + b, PAL.rivet);
  // front camera
  im.rect(32, 16 + b, 3, 4, PAL.lens); im.set(33, 17 + b, PAL.lensHi);
  // wheels: three on this side
  for (const cx of [9, 20, 31]) wheel(im, cx, 34, 4.4, wheelPhase);
  im.outline();
  // neon rim light on the right edge of body (after outline)
  for (let y = 14; y < 25; y++) im.set(31, y + b, PAL.rim);
  // rocker-bogie legs, thin, after the outline
  const L = PAL.leg;
  im.line(22, 26 + b, 31, 29, L);
  im.line(22, 26 + b, 14, 29, L);
  im.line(14, 29, 9, 29, L);
  im.line(14, 29, 20, 29, L);
  // face: big eyes (6 wide, 7 tall) toward the front
  const ey = 15 + b;
  for (const ex of [15, 23]) {
    const left = ex === 15;
    if (eyes === "blink") { im.rect(ex, ey + 4, 6, 1, PAL.pupil); im.set(ex, ey + 3, PAL.pupil); im.set(ex + 5, ey + 3, PAL.pupil); continue; }
    if (eyes === "happy") {
      im.set(ex, ey + 4, PAL.pupil); im.set(ex + 1, ey + 3, PAL.pupil); im.set(ex + 2, ey + 2, PAL.pupil);
      im.set(ex + 3, ey + 2, PAL.pupil); im.set(ex + 4, ey + 3, PAL.pupil); im.set(ex + 5, ey + 4, PAL.pupil);
      continue;
    }
    im.rect(ex, ey + 1, 6, 5, PAL.eye); im.rect(ex + 1, ey, 4, 7, PAL.eye);   // rounded white
    if (eyes === "worried") {
      im.rect(ex + 2, ey + 2, 3, 4, PAL.pupil); im.set(ex + 2, ey + 2, PAL.shine);
      im.set(left ? ex + 4 : ex + 1, ey - 2, PAL.pupil); im.set(left ? ex + 5 : ex, ey - 2, PAL.pupil); // brows tilt up toward the middle
      im.set(left ? ex + 3 : ex + 2, ey - 1, PAL.pupil);
    } else {
      im.rect(ex + 2, ey + 1, 4, 5, PAL.pupil);              // looking forward (right)
      im.rect(ex + 3, ey + 4, 2, 1, PAL.iris);               // neon iris glint
      im.rect(ex + 2, ey + 1, 2, 2, PAL.shine); im.set(ex + 5, ey + 5, PAL.shine);
    }
  }
  // blush
  im.rect(13, 23 + b, 2, 1, PAL.blush); im.rect(29, 23 + b, 2, 1, PAL.blush);
  // mouth, centred between the eyes (x 21..22)
  const my = 23 + b;
  if (mouth === "smile") { im.set(20, my, PAL.mouth); im.set(21, my + 1, PAL.mouth); im.set(22, my + 1, PAL.mouth); im.set(23, my, PAL.mouth); }
  if (mouth === "open") { im.rect(20, my, 4, 2, PAL.mouth); im.rect(21, my + 1, 2, 1, PAL.tongue); }
  if (mouth === "talk") { im.rect(21, my, 2, 2, PAL.mouth); }
  if (mouth === "wobble") { for (let i = 0; i < 5; i++) im.set(19 + i, my + (i % 2), PAL.mouth); }
  return im;
}
const SOJ_FRAMES = [
  ["idle", { eyes: "open" }],
  ["idle", { eyes: "blink" }],
  ["talk", { eyes: "open", mouth: "talk" }],
  ["talk", { eyes: "open", mouth: "open" }],
  ["drive", { eyes: "open", wheelPhase: 0 }],
  ["drive", { eyes: "open", wheelPhase: 1, bob: 1 }],
  ["worried", { eyes: "worried", mouth: "wobble" }],
  ["worried", { eyes: "worried", mouth: "wobble", bob: 1 }],
  ["happy", { eyes: "happy", mouth: "open", bob: 1 }],
  ["happy", { eyes: "happy", mouth: "open" }],
];

// ---------- Sojourner from the FRONT (driving down / looking at you) and BACK (driving up) ----------
// 3/4 view from above: the solar panel's top shows as a wide slab, wheels stand in columns at the sides.
function sojournerFB(view, { eyes = "open", mouth = "smile", bob = 0, wheelPhase = 0 } = {}) {
  const im = new Img(40, 40), b = bob;
  const ax = view === "front" ? 9 : 30;                                        // antenna sits at the back-left
  im.line(ax, 8 + b, ax, 3 + b, PAL.leg); im.rect(ax - 1, 1 + b, 3, 3, PAL.antennaTip);
  // wheels: back two peek out behind, front one is biggest (perspective)
  for (const [x, w] of [[1, 6], [33, 6]]) {
    im.rect(x + 1, 18, w - 2, 7, PAL.tire);                                     // rear/middle wheels behind
    im.rect(x, 26, w, 11, PAL.tire); im.rect(x + 1, 27, w - 2, 9, PAL.wheel);   // front wheel
    for (let y = 27 + wheelPhase; y < 36; y += 2) im.rect(x + 1, y, w - 2, 1, PAL.metalMid); // treads
    im.set(x + w / 2 - 0.5, 31, PAL.hub);
  }
  // body
  im.rect(8, 13 + b, 24, 14, PAL.metal);
  im.rect(8, 13 + b, 24, 2, PAL.metalHi);
  im.rect(8, 24 + b, 24, 2, PAL.metalMid); im.rect(8, 26 + b, 24, 1, PAL.metalLow);
  for (let i = 0; i < 3; i++) im.set(10 + i, 16 + b + i, PAL.metalHi);
  // solar panel seen from above: a wide slab on top
  im.rect(3, 5 + b, 34, 8, PAL.panel); im.rect(3, 5 + b, 34, 1, PAL.panelHi);
  for (let x = 8; x < 37; x += 6) im.rect(x, 6 + b, 1, 6, PAL.panelLine);
  im.rect(3, 9 + b, 34, 1, PAL.panelLine); im.rect(3, 12 + b, 34, 1, PAL.panelLine);
  im.set(5, 6 + b, PAL.panelSpec); im.set(6, 6 + b, PAL.panelSpec); im.set(23, 7 + b, PAL.panelSpec);
  if (view === "back") { im.rect(17, 22 + b, 6, 4, PAL.metalLow); im.rect(18, 26 + b, 4, 1, PAL.antennaTip); } // the rock tool (APXS) on its back
  im.outline();
  for (const [x, y] of [[7, 26], [32, 26]]) { im.line(x, y + b, x === 7 ? 4 : 35, 26, PAL.leg); }       // rocker legs
  for (const [x, y] of [[9, 14], [30, 14], [9, 25], [30, 25]]) im.set(x, y + b, PAL.rivet);
  if (view === "front") {
    const ey = 15 + b;
    for (const ex of [11, 23]) {
      if (eyes === "blink") { im.rect(ex, ey + 4, 6, 1, PAL.pupil); im.set(ex, ey + 3, PAL.pupil); im.set(ex + 5, ey + 3, PAL.pupil); continue; }
      if (eyes === "happy") { im.set(ex, ey + 4, PAL.pupil); im.set(ex + 1, ey + 3, PAL.pupil); im.set(ex + 2, ey + 2, PAL.pupil); im.set(ex + 3, ey + 2, PAL.pupil); im.set(ex + 4, ey + 3, PAL.pupil); im.set(ex + 5, ey + 4, PAL.pupil); continue; }
      im.rect(ex, ey + 1, 6, 5, PAL.eye); im.rect(ex + 1, ey, 4, 7, PAL.eye);
      if (eyes === "worried") { im.rect(ex + 1, ey + 2, 4, 4, PAL.pupil); im.set(ex + 1, ey + 2, PAL.shine); im.set(ex === 11 ? ex + 5 : ex, ey - 1, PAL.pupil); im.set(ex === 11 ? ex + 4 : ex + 1, ey - 1, PAL.pupil); }
      else { im.rect(ex + 1, ey + 2, 4, 4, PAL.pupil); im.rect(ex + 2, ey + 4, 2, 1, PAL.iris); im.rect(ex + 1, ey + 2, 2, 2, PAL.shine); }
    }
    im.rect(9, 22 + b, 2, 1, PAL.blush); im.rect(29, 22 + b, 2, 1, PAL.blush);
    const my = 23 + b;
    if (mouth === "smile") { im.set(18, my, PAL.mouth); im.set(19, my + 1, PAL.mouth); im.set(20, my + 1, PAL.mouth); im.set(21, my, PAL.mouth); }
    if (mouth === "open") { im.rect(18, my, 4, 2, PAL.mouth); im.rect(19, my + 1, 2, 1, PAL.tongue); }
    if (mouth === "talk") im.rect(19, my, 2, 2, PAL.mouth);
    if (mouth === "wobble") for (let i = 0; i < 5; i++) im.set(17 + i, my + (i % 2), PAL.mouth);
  } else {
    for (let y = 15; y < 22; y += 3) im.rect(12, y + b, 16, 1, PAL.metalMid);   // panel seams on its back
  }
  return im;
}
const SOJ_FRONT = [
  ["idle", { eyes: "open" }], ["idle", { eyes: "blink" }],
  ["talk", { mouth: "talk" }], ["talk", { mouth: "open" }],
  ["drive", { wheelPhase: 0 }], ["drive", { wheelPhase: 1, bob: 1 }],
  ["worried", { eyes: "worried", mouth: "wobble" }], ["worried", { eyes: "worried", mouth: "wobble", bob: 1 }],
  ["happy", { eyes: "happy", mouth: "open", bob: 1 }], ["happy", { eyes: "happy", mouth: "open" }],
];
const SOJ_BACK = [["idle", {}], ["idle", { bob: 1 }], ["drive", { wheelPhase: 0 }], ["drive", { wheelPhase: 1, bob: 1 }]];
// A plain rock with no sand behind it, so the board can lift it and give it a shadow.
function plainRock() { return rockShape(3, false); }

// ---------- Sojourner seen from above and behind (the board view), FACING UP ----------
// The game rotates this one picture to face up, right, down or left. Six wheels at the sides,
// the solar panel on top, the antenna at the back, and two camera eyes peeking over the front.
function sojournerTop({ wheelPhase = 0 } = {}) {
  const im = new Img(40, 40);
  for (const x of [3, 31]) for (const y of [6, 16, 26]) {                          // six wheels
    im.rect(x, y, 6, 8, PAL.tire); im.rect(x + 1, y + 1, 4, 6, PAL.wheel);
    for (let k = y + 1 + wheelPhase; k < y + 7; k += 2) im.rect(x + 1, k, 4, 1, PAL.metalMid);
  }
  im.rect(10, 6, 20, 28, PAL.metalMid);                                              // body under the panel
  im.rect(8, 9, 24, 23, PAL.panel); im.rect(8, 9, 24, 1, PAL.panelHi);              // solar panel
  for (let x = 13; x < 32; x += 5) im.rect(x, 10, 1, 21, PAL.panelLine);
  for (let y = 15; y < 31; y += 6) im.rect(8, y, 24, 1, PAL.panelLine);
  im.set(10, 11, PAL.panelSpec); im.set(11, 11, PAL.panelSpec); im.set(24, 17, PAL.panelSpec);
  im.rect(11, 1, 18, 8, PAL.metal); im.rect(11, 1, 18, 1, PAL.metalHi);              // front camera bar
  im.rect(14, 34, 12, 3, PAL.metalLow); im.rect(18, 37, 4, 1, PAL.antennaTip);       // the rock tool at the back
  im.outline();
  for (const ex of [12, 22]) {                                                         // two round eyes looking forward
    im.rect(ex, 2, 6, 6, PAL.eye); im.set(ex, 2, PAL.metal); im.set(ex + 5, 2, PAL.metal); im.set(ex, 7, PAL.metal); im.set(ex + 5, 7, PAL.metal);
    im.rect(ex + 1, 2, 4, 3, PAL.pupil); im.rect(ex + 2, 4, 2, 1, PAL.iris); im.set(ex + 1, 2, PAL.shine);
  }
  im.line(30, 33, 30, 36, PAL.leg); im.rect(29, 36, 3, 3, PAL.antennaTip);          // antenna, back right
  for (const [x0, x1] of [[9, 10], [30, 31]]) for (const y of [10, 20, 30]) im.line(x0, y, x1, y, PAL.leg);
  return im;
}
// ---------- Sojourner, chunky "Mario-style" design: side, front and back views ----------
// Owner, 2026-11-14: simpler and easier to read, like classic platform-game characters.
// Big simple shapes, bold outline, two tones per part (light + shade), huge eyes, round wheels,
// no fiddly panel grids or treads. Side view faces right (code flips it for left).
const M = {
  body: "#d6deef", bodyShade: "#a3aecb", bodyHi: "#ffffff",
  panel: "#6a5ae8", panelHi: "#a89cff", tire: "#46496e", hub: "#e8ecf6", hubDot: "#8b93b3",
  tool: "#7d86a8",
};
function chunkyRect(im, x, y, w, h, c, cut = 2) {        // rectangle with cut corners (rounded look)
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const cx = Math.min(i, w - 1 - i), cy = Math.min(j, h - 1 - j);
    if (cx + cy < cut) continue;
    im.set(x + i, y + j, c);
  }
}
function bigEyes(im, x, y, w, h, look, mood, b) {        // one tall cartoon eye; look = pupil offset
  if (mood === "blink") { im.rect(x, y + h - 2 + b, w, 1, PAL.pupil); return; }
  if (mood === "happy") { im.set(x, y + 4 + b, PAL.pupil); for (let i = 1; i < w - 1; i++) im.set(x + i, y + 3 + b, PAL.pupil); im.set(x + w - 1, y + 4 + b, PAL.pupil); return; }
  chunkyRect(im, x, y + b, w, h, PAL.eye, 1);
  const pw = w - 2, ph = h - 3, px = x + 1 + look, py = y + 2 + b + (mood === "worried" ? -1 : 0);
  chunkyRect(im, px, py, pw, ph, PAL.pupil, 1);
  im.set(px, py, PAL.shine); im.set(px + 1, py, PAL.shine); im.set(px, py + 1, PAL.shine);
  if (mood === "worried") im.rect(x + (look > 0 ? 0 : 1), y - 2 + b, w - 1, 1, PAL.pupil);    // little brow
}
function chunkyWheel(im, cx, cy, r, phase) {
  im.disc(cx, cy, r, M.tire); im.disc(cx, cy, r * 0.5, M.hub);
  const a = phase * Math.PI / 2; im.set(cx + Math.cos(a) * r * 0.5, cy + Math.sin(a) * r * 0.5, M.hubDot);
}
function sojournerChunky(view, { eyes = "open", mouth = "smile", bob = 0, wheelPhase = 0 } = {}) {
  const im = new Img(40, 40), b = bob;
  // Every view uses the SAME box (x 3..36, y 1..38): panel y 9..14, body y 15..29, wheels to y 38,
  // so Sojourner keeps its size when it turns (owner, 2026-11-14).
  if (view === "side") {
    im.rect(11, 5 + b, 2, 5, M.hubDot); chunkyRect(im, 9, 1 + b, 5, 5, PAL.antennaTip, 1); im.set(10, 2 + b, "#ffd1f2"); // antenna
    for (const x of [9, 20, 31]) chunkyWheel(im, x, 33, 5.5, wheelPhase);
    im.rect(9, 28, 22, 2, M.bodyShade);                                                        // leg bar
    chunkyRect(im, 8, 15 + b, 24, 15, M.body);                                                 // body
    im.rect(10, 26 + b, 20, 3, M.bodyShade); im.rect(10, 16 + b, 20, 1, M.bodyHi);
    chunkyRect(im, 3, 9 + b, 34, 6, M.panel, 2); im.rect(5, 9 + b, 30, 2, M.panelHi);        // solar panel slab
    chunkyRect(im, 32, 18 + b, 3, 4, PAL.lens, 1);                                             // front camera
    chunkyRect(im, 4, 19 + b, 5, 7, M.tool, 1); im.rect(5, 20 + b, 3, 1, M.hub);                // rock tool (APXS) on its BACK
    chunkyRect(im, 3, 21 + b, 2, 4, PAL.antennaTip, 0);                                         // …with a pink sensor head
  } else {
    const ax = view === "front" ? 28 : 11;
    im.rect(ax, 5 + b, 2, 5, M.hubDot); chunkyRect(im, ax - 2, 1 + b, 5, 5, PAL.antennaTip, 1);
    for (const x of [3, 31]) { chunkyRect(im, x, 18, 6, 8, M.hubDot, 2); chunkyRect(im, x, 26, 6, 13, M.tire, 2); im.rect(x + 2, 29, 2, 7, M.hub); } // wheels
    chunkyRect(im, 8, 15 + b, 24, 15, M.body);
    im.rect(10, 26 + b, 20, 3, M.bodyShade); im.rect(10, 16 + b, 20, 1, M.bodyHi);
    chunkyRect(im, 3, 9 + b, 34, 6, M.panel, 2); im.rect(5, 9 + b, 30, 2, M.panelHi);        // panel slab, same as the side view
    if (view === "back") { chunkyRect(im, 15, 20 + b, 10, 6, M.tool, 1); im.rect(18, 26 + b, 4, 2, PAL.antennaTip); }
  }
  im.outline();
  // face
  if (view === "side") {
    bigEyes(im, 18, 17, 5, 7, 1, eyes, b); bigEyes(im, 24, 17, 5, 7, 1, eyes, b);
    im.set(19, 24 + b, PAL.blush); im.set(20, 24 + b, PAL.blush); im.set(30, 24 + b, PAL.blush); im.set(31, 24 + b, PAL.blush);
    const my = 24 + b;
    if (mouth === "smile") { im.set(24, my, PAL.mouth); im.set(25, my + 1, PAL.mouth); im.set(26, my, PAL.mouth); }
    if (mouth === "open" || mouth === "talk") { chunkyRect(im, 24, my, 3, mouth === "open" ? 3 : 2, PAL.mouth, 0); if (mouth === "open") im.set(25, my + 2, PAL.tongue); }
    if (mouth === "wobble") for (let i = 0; i < 4; i++) im.set(23 + i, my + (i % 2), PAL.mouth);
  } else if (view === "front") {
    bigEyes(im, 11, 17, 7, 8, 0, eyes, b); bigEyes(im, 22, 17, 7, 8, 0, eyes, b);
    im.rect(10, 25 + b, 2, 1, PAL.blush); im.rect(28, 25 + b, 2, 1, PAL.blush);
    const my = 26 + b;
    if (mouth === "smile") { im.set(18, my, PAL.mouth); im.rect(19, my + 1, 2, 1, PAL.mouth); im.set(21, my, PAL.mouth); }
    if (mouth === "open" || mouth === "talk") { chunkyRect(im, 18, my, 4, mouth === "open" ? 3 : 2, PAL.mouth, 0); if (mouth === "open") im.rect(19, my + 2, 2, 1, PAL.tongue); }
    if (mouth === "wobble") for (let i = 0; i < 5; i++) im.set(17 + i, my + (i % 2), PAL.mouth);
  }
  return im;
}

// ---------- Half-turned views, so a turn shows a frame for every 45° (owner, 2026-11-14) ----------
// "back34": facing up-right, we see its BACK (rock tool) on the left and its right side on the right.
// "front34": facing down-right, we see its right side on the left and its FACE on the right.
// Same 40 x 40 box as the other views; the game flips them for up-left and down-left.
function sojourner34(view, { eyes = "open", bob = 0 } = {}) {
  const im = new Img(40, 40), b = bob, back = view === "back34";
  const ax = back ? 13 : 10;
  im.rect(ax, 5 + b, 2, 5, M.hubDot); chunkyRect(im, ax - 2, 1 + b, 5, 5, PAL.antennaTip, 1);   // antenna, at the back
  if (back) {
    chunkyRect(im, 4, 22, 6, 17, M.tire, 2); im.rect(6, 26, 2, 9, M.hub);                       // near back wheel, seen end-on
    for (const x of [22, 32]) chunkyWheel(im, x, 33, 5.5, 0);                                     // side wheels, round
  } else {
    for (const x of [8, 18]) chunkyWheel(im, x, 33, 5.5, 0);                                      // side wheels, round
    chunkyRect(im, 30, 22, 6, 17, M.tire, 2); im.rect(32, 26, 2, 9, M.hub);                     // near front wheel, seen end-on
  }
  chunkyRect(im, 8, 15 + b, 24, 15, M.body);                                                      // body
  const split = back ? 22 : 18;                                                                    // where the two faces meet
  if (back) { im.rect(split, 16 + b, 9, 13, M.bodyShade); im.rect(10, 16 + b, split - 10, 1, M.bodyHi); }
  else { im.rect(9, 16 + b, split - 9, 13, M.bodyShade); im.rect(split, 16 + b, 12, 1, M.bodyHi); }
  im.rect(split, 16 + b, 1, 13, M.hubDot);                                                         // the corner edge
  chunkyRect(im, 3, 9 + b, 34, 6, M.panel, 2); im.rect(5, 9 + b, 30, 2, M.panelHi);               // solar panel slab
  if (back) { chunkyRect(im, 11, 19 + b, 9, 7, M.tool, 1); im.rect(14, 26 + b, 4, 2, PAL.antennaTip); } // rock tool on the back
  im.outline();
  if (back) bigEyes(im, 28, 17, 4, 6, 1, eyes, b);                                                 // one eye peeking round the front
  else {
    bigEyes(im, 20, 17, 5, 8, 1, eyes, b); bigEyes(im, 27, 17, 5, 8, 1, eyes, b);                 // the face, looking where it turns
    const my = 26 + b; im.set(25, my, PAL.mouth); im.rect(26, my + 1, 2, 1, PAL.mouth); im.set(28, my, PAL.mouth);
    im.rect(20, 25 + b, 2, 1, PAL.blush); im.rect(31, 25 + b, 1, 1, PAL.blush);
  }
  return im;
}

// ---------- ANGLED (three-quarter, from above and to the side) views for the opening scene ----------
// Owner, 2026-11-14: "a top side view at an angle so we can see it running on the ground".
// Oblique projection: we see the TOP of each rover and its NEAR side; its far-side wheels show
// a few pixels higher up. Each sprite faces right; the anchor is the bottom of the NEAR wheels.
// The far wheels touch the ground a fixed number of pixels higher (DEPTH), so the game can lay
// one track under each row of wheels.
export const CUR_DEPTH = 11, SOJ_DEPTH = 10;
function curiosityAngled({ eyes = "open", mouth = "smile", bob = 0, wheelPhase = 0 } = {}) {
  const im = new Img(72, 64), b = bob;
  for (const x of [16, 36, 56]) { im.disc(x, 46, 5.5, "#353858"); im.disc(x, 46, 2.5, M.hubDot); }            // far-side wheels
  // RTG power unit at the back: finned cylinder with a warm window
  im.rect(3, 22 + b, 10, 18, PAL.metalLow); im.rect(4, 22 + b, 2, 18, PAL.metalMid);
  for (let y = 23; y < 40; y += 3) im.rect(1, y + b, 2, 1, PAL.metalDeep);
  im.rect(7, 26 + b, 3, 8, "#ffb36b"); im.rect(8, 27 + b, 1, 6, "#ffe2b8");
  im.rect(12, 24 + b, 47, 11, "#e6ecf8");                                                                        // top deck (seen from above)
  im.rect(12, 24 + b, 47, 1, PAL.metalHi);
  im.rect(20, 26 + b, 9, 5, PAL.metalMid); im.rect(21, 26 + b, 7, 2, PAL.metalHi);                              // antenna dish on the deck
  im.rect(12, 35 + b, 47, 10, PAL.metal);                                                                        // near side
  im.rect(12, 43 + b, 47, 2, PAL.metalMid); im.rect(15, 39 + b, 40, 1, PAL.neonLime);
  im.rect(46, 11 + b, 3, 15, PAL.metalMid); im.rect(46, 11 + b, 1, 15, PAL.metalHi);                            // mast
  im.rect(36, 1 + b, 28, 3, "#eef3fb");                                                                          // camera head: top…
  im.rect(36, 4 + b, 28, 11, PAL.metal); im.rect(36, 13 + b, 28, 2, PAL.metalMid);                              // …and front face
  im.line(59, 30 + b, 65, 35 + b, PAL.metalMid); im.line(65, 35 + b, 62, 42 + b, PAL.metalMid); im.disc(62, 43 + b, 2, PAL.metalLow); // arm
  for (const x of [18, 38, 58]) chunkyWheel(im, x, 56, 6.5, wheelPhase);                                       // near-side wheels
  im.outline();
  for (let y = 36; y < 44; y++) im.set(58, y + b, PAL.rim);
  for (const x of [18, 38, 58]) im.line(x, 45 + b, x, 50, PAL.leg);                                             // legs to the near wheels
  for (const ex of [43, 56]) {                                                                                   // two lens eyes on the head
    const ey = 8 + b;
    if (eyes === "blink") { im.rect(ex - 3, ey + 1, 7, 1, PAL.pupil); continue; }
    if (eyes === "happy") { im.set(ex - 3, ey + 1, PAL.pupil); im.set(ex - 2, ey, PAL.pupil); for (let i = -1; i <= 1; i++) im.set(ex + i, ey - 1, PAL.pupil); im.set(ex + 2, ey, PAL.pupil); im.set(ex + 3, ey + 1, PAL.pupil); continue; }
    im.disc(ex, ey, 3.4, PAL.lens); im.disc(ex + 0.5, ey + 0.5, 1.9, PAL.pupil); im.rect(ex - 2, ey - 2, 2, 2, PAL.shine);
    if (eyes === "worried") { im.set(ex === 43 ? ex + 2 : ex - 2, ey - 5, PAL.pupil); im.set(ex === 43 ? ex + 1 : ex - 1, ey - 4, PAL.pupil); }
  }
  im.set(38, 12 + b, PAL.blush); im.set(61, 12 + b, PAL.blush);
  const my = 12 + b;
  if (mouth === "smile") { im.set(48, my, PAL.mouth); im.set(49, my + 1, PAL.mouth); im.set(50, my + 1, PAL.mouth); im.set(51, my, PAL.mouth); }
  if (mouth === "open") { im.rect(48, my, 4, 2, PAL.mouth); im.rect(49, my + 1, 2, 1, PAL.tongue); }
  if (mouth === "talk") im.rect(49, my, 2, 2, PAL.mouth);
  if (mouth === "wobble") for (let i = 0; i < 5; i++) im.set(47 + i, my + (i % 2), PAL.mouth);
  return im;
}
function sojournerAngled({ eyes = "open", mouth = "smile", bob = 0, wheelPhase = 0 } = {}) {
  // Drawn larger than true scale (owner, 2026-11-14) so its face reads; still clearly smaller than Curiosity.
  const im = new Img(58, 52), b = bob;
  for (const x of [12, 27, 42]) { im.disc(x, 35, 4.6, "#353858"); im.set(x, 35, M.hubDot); }                 // far-side wheels
  im.rect(13, 6 + b, 2, 10, M.hubDot); chunkyRect(im, 10, 1 + b, 6, 6, PAL.antennaTip, 1); im.set(11, 2 + b, "#ffd1f2"); // antenna (back)
  chunkyRect(im, 9, 29 + b, 36, 11, M.body, 1); im.rect(10, 37 + b, 34, 2, M.bodyShade);                    // near side of the body
  chunkyRect(im, 5, 15 + b, 44, 15, M.panel, 2);                                                              // the solar panel, seen from above
  im.rect(7, 15 + b, 40, 2, M.panelHi);
  for (let x = 12; x < 47; x += 7) im.rect(x, 17 + b, 1, 12, "#5a49d0");
  im.rect(6, 23 + b, 42, 1, "#5a49d0");
  im.set(9, 18 + b, PAL.panelSpec); im.set(10, 18 + b, PAL.panelSpec);
  chunkyRect(im, 2, 30 + b, 7, 8, M.tool, 1); im.rect(3, 31 + b, 5, 1, M.hub); im.rect(1, 32 + b, 2, 4, PAL.antennaTip); // rock tool on its BACK
  chunkyRect(im, 45, 31 + b, 4, 5, PAL.lens, 1); im.set(46, 32 + b, PAL.lensHi);                            // front camera
  for (const x of [13, 28, 43]) chunkyWheel(im, x, 45, 5.6, wheelPhase);                                    // near-side wheels
  im.outline();
  bigEyes(im, 28, 30, 6, 8, 1, eyes, b); bigEyes(im, 36, 30, 6, 8, 1, eyes, b);                             // big eyes on the near side, toward the front
  im.set(26, 38 + b, PAL.blush); im.set(43, 38 + b, PAL.blush);
  const my = 38 + b;
  if (mouth === "smile") { im.set(34, my, PAL.mouth); im.set(35, my, PAL.mouth); }
  if (mouth === "open" || mouth === "talk") im.rect(34, my - 1, 2, 2, PAL.mouth);
  if (mouth === "wobble") { im.set(33, my, PAL.mouth); im.set(35, my, PAL.mouth); }
  return im;
}
const ANGLED_FRAMES = [
  ["idle", { eyes: "open" }], ["idle", { eyes: "blink" }],
  ["talk", { mouth: "talk" }], ["talk", { mouth: "open" }],
  ["drive", { wheelPhase: 0 }], ["drive", { wheelPhase: 1, bob: 1 }],
  ["worried", { eyes: "worried", mouth: "wobble" }], ["worried", { eyes: "worried", mouth: "wobble", bob: 1 }],
  ["happy", { eyes: "happy", mouth: "open", bob: 1 }], ["happy", { eyes: "happy", mouth: "open" }],
];

// ---------- Sojourner seen from above at ANY angle (16 directions, for smooth turning) ----------
// The rover is described as simple shapes in its own coordinates (facing up = -y), then each
// pixel of each frame asks "which part is here?" after un-rotating. Every angle stays pixel-crisp
// and looks the same rover, so left and right look as good as up and down.
function sojournerAngle(angle, wheelPhase) {
  const im = new Img(40, 40), cs = Math.cos(-angle), sn = Math.sin(-angle);
  const inR = (x, y, x0, y0, x1, y1) => x >= x0 && x < x1 && y >= y0 && y < y1;
  const at = (lx, ly) => {                                   // top-most part at a local point
    for (const ex of [-4.5, 4.5]) {                          // eyes on the front camera bar
      const d = Math.hypot(lx - ex, ly + 15.5);
      if (d < 3.4) {
        if (Math.hypot(lx - ex + 0.9, ly + 17.2) < 0.9) return PAL.shine;
        if (Math.hypot(lx - ex, ly + 16.4) < 2) return PAL.pupil;
        return PAL.eye;
      }
    }
    if (inR(lx, ly, -9, -19.5, 9, -12)) return ly < -18.5 ? PAL.metalHi : PAL.metal;          // camera bar
    if (inR(lx, ly, 8, 15, 11, 19.5)) return ly > 17.5 ? PAL.antennaTip : PAL.leg;            // antenna
    if (inR(lx, ly, -6, 14, 6, 18)) return ly > 16.8 && Math.abs(lx) < 2.2 ? PAL.antennaTip : PAL.metalLow; // rock tool
    if (inR(lx, ly, -12, -11.5, 12, 11.5)) {                                                    // solar panel
      if (ly < -10.5) return PAL.panelHi;
      if (Math.abs(((lx + 12) % 6) - 0) < 0.9 || Math.abs(((ly + 11.5) % 6.5) - 0) < 0.9) return PAL.panelLine;
      if (Math.hypot(lx + 9, ly + 8.5) < 1.2) return PAL.panelSpec;
      return PAL.panel;
    }
    if (inR(lx, ly, -10, -14, 10, 14.5)) return PAL.metalMid;                                   // body
    for (const wx of [-14.5, 14.5]) for (const wy of [-10.5, -0.5, 9.5]) {                     // six wheels
      if (inR(lx, ly, wx - 3.2, wy - 3.8, wx + 3.2, wy + 3.8)) {
        if (Math.abs(lx - wx) > 2.2 || Math.abs(ly - wy) > 2.8) return PAL.tire;
        return Math.floor(ly - wy + 10 + wheelPhase) % 2 ? PAL.metalMid : PAL.wheel;
      }
      if (inR(lx, ly, Math.min(wx, 0) + (wx < 0 ? 3 : -3), wy - 0.6, Math.max(wx, 0) + (wx < 0 ? 3 : -3), wy + 0.6) && Math.abs(lx) > 9.5) return PAL.leg;
    }
    return null;
  };
  for (let y = 0; y < 40; y++) for (let x = 0; x < 40; x++) {
    const wx = x + 0.5 - 20, wy = y + 0.5 - 20;
    const c = at(wx * cs - wy * sn, wx * sn + wy * cs);
    if (c) im.set(x, y, c);
  }
  im.outline();
  return im;
}
const DIR16 = Array.from({ length: 16 }, (_, i) => i * Math.PI / 8);

// Other kinds of Mars rock, so the board has look-alikes and the player must read the clue.
function darkRock() {               // small, dark, rounded basalt-like rock
  const im = new Img(TILE, TILE);
  im.disc(20, 26, 8.5, "#5a4660"); im.disc(14, 28, 5, "#5a4660"); im.disc(26, 28, 5, "#5a4660");
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) if (im.get(x, y) && !im.get(x - 2, y - 2)) im.set(x, y, "#7c6684");
  for (const [x, y] of [[17, 25], [23, 29], [19, 31]]) im.set(x, y, "#3f3046");
  im.outline(); return im;
}
function layeredRock() {            // flat, striped (layered) rock
  const im = new Img(TILE, TILE);
  im.rect(8, 22, 24, 10, "#c98a6a"); im.rect(10, 19, 20, 4, "#c98a6a"); im.rect(12, 17, 15, 3, "#c98a6a");
  for (const y of [21, 25, 29]) for (let x = 8; x < 32; x++) if (im.get(x, y)) im.set(x, y, "#a96d55");
  for (let x = 12; x < 27; x++) if (im.get(x, 17)) im.set(x, 17, "#e2a888");
  im.outline(); return im;
}

// ---------- Curiosity portrait (head on its mast) for the caption bar: 40 x 40 ----------
function curiosity({ talk = false, blink = false } = {}) {
  const im = new Img(40, 40);
  im.rect(18, 26, 5, 14, PAL.metalMid); im.rect(18, 26, 1, 14, PAL.metalHi);          // mast
  im.disc(20, 6, 3, PAL.metal); im.set(19, 5, PAL.metalHi);                              // top sensor
  im.rect(5, 9, 30, 17, PAL.metal);                                                      // camera head
  im.rect(5, 9, 30, 2, PAL.metalHi); im.rect(5, 23, 30, 3, PAL.metalMid);
  im.outline();
  for (const cx of [13, 27]) {                                                           // camera "eyes"
    if (blink) { im.rect(cx - 4, 17, 9, 1, PAL.pupil); continue; }
    im.disc(cx, 16, 4.2, PAL.lens); im.disc(cx, 16, 2.4, PAL.pupil);
    im.rect(cx - 2, 13, 2, 2, PAL.shine); im.set(cx + 1, 18, PAL.neonCyan);
  }
  im.rect(8, 21, 2, 1, PAL.blush); im.rect(30, 21, 2, 1, PAL.blush);
  if (talk) im.rect(19, 21, 3, 2, PAL.mouth); else { im.set(19, 21, PAL.mouth); im.set(20, 22, PAL.mouth); im.set(21, 21, PAL.mouth); }
  for (let y = 10; y < 23; y++) im.set(34, y, PAL.rim);
  return im;
}
const CUR_FRAMES = [["idle", {}], ["idle", { blink: true }], ["talk", { talk: true }], ["talk", {}]];

// ---------- Curiosity, full body: 64 x 56, facing right, anchor bottom centre ----------
// Car-sized next to little Sojourner. Face on the mast head; RTG power unit at the back;
// arm folded at the front; six wheels (three on this side) on a rocker-bogie.
function curiosityFull({ eyes = "open", mouth = "smile", bob = 0, wheelPhase = 0 } = {}) {
  const im = new Img(64, 56), b = bob;
  // RTG power unit at the back (Curiosity has no solar panels): a finned cylinder with a warm glow
  im.rect(2, 19 + b, 9, 15, PAL.metalLow);                                  // cylinder
  im.rect(3, 19 + b, 2, 15, PAL.metalMid);                                  // light side
  for (let y = 20; y < 34; y += 2) { im.rect(0, y + b, 2, 1, PAL.metalDeep); im.rect(11, y + b, 1, 1, PAL.metalDeep); } // fins
  im.rect(5, 23 + b, 3, 7, "#ffb36b"); im.rect(6, 24 + b, 1, 5, "#ffe2b8");  // warm glow window
  im.line(10, 26 + b, 10, 30 + b, PAL.metalDeep);                            // strut to the body
  // body
  im.rect(10, 25 + b, 40, 13, PAL.metal);
  im.rect(10, 25 + b, 40, 2, PAL.metalHi);
  im.rect(10, 35 + b, 40, 2, PAL.metalMid);
  im.rect(10, 37 + b, 40, 1, PAL.metalLow);
  for (let i = 0; i < 4; i++) im.set(13 + i, 28 + b + i, PAL.metalHi);
  im.rect(14, 32 + b, 30, 1, PAL.neonLime);                         // neon stripe
  for (const [x, y] of [[12, 26], [47, 26], [12, 36], [47, 36]]) im.set(x, y + b, PAL.rivet);
  // high-gain antenna dish on the deck
  im.rect(18, 21 + b, 8, 3, PAL.metalMid); im.rect(19, 20 + b, 6, 1, PAL.metalHi); im.rect(21, 24 + b, 2, 1, PAL.metalLow);
  // mast
  im.rect(41, 13 + b, 3, 12, PAL.metalMid); im.rect(41, 13 + b, 1, 12, PAL.metalHi);
  // camera head
  im.rect(31, 1 + b, 27, 13, PAL.metal);
  im.rect(31, 1 + b, 27, 2, PAL.metalHi);
  im.rect(31, 12 + b, 27, 2, PAL.metalMid);
  // arm folded at the front, with its turret
  im.line(50, 29 + b, 56, 34 + b, PAL.metalMid); im.line(50, 30 + b, 56, 35 + b, PAL.metalMid);
  im.line(56, 35 + b, 54, 41 + b, PAL.metalMid);
  im.disc(54, 42 + b, 2.2, PAL.metalLow);
  // wheels
  for (const cx of [12, 32, 52]) wheel(im, cx, 48, 6.2, wheelPhase);
  im.outline();
  // rim light, legs (after outline so they stay thin)
  for (let y = 26; y < 37; y++) im.set(49, y + b, PAL.rim);
  for (let y = 2; y < 13; y++) im.set(57, y + b, PAL.rim);
  const L = PAL.leg;
  im.line(36, 38 + b, 52, 41, L); im.line(36, 38 + b, 22, 41, L); im.line(22, 41, 12, 41, L); im.line(22, 41, 32, 41, L);
  // face on the camera head: two big lens eyes
  for (const ex of [38, 50]) {
    const ey = 7 + b;
    if (eyes === "blink") { im.rect(ex - 3, ey + 1, 7, 1, PAL.pupil); continue; }
    if (eyes === "happy") { im.set(ex - 3, ey + 1, PAL.pupil); im.set(ex - 2, ey, PAL.pupil); im.set(ex - 1, ey - 1, PAL.pupil); im.set(ex, ey - 1, PAL.pupil); im.set(ex + 1, ey - 1, PAL.pupil); im.set(ex + 2, ey, PAL.pupil); im.set(ex + 3, ey + 1, PAL.pupil); continue; }
    im.disc(ex, ey, 3.6, PAL.lens); im.disc(ex + 0.5, ey + 0.5, 2, PAL.pupil);
    im.rect(ex - 2, ey - 2, 2, 2, PAL.shine); im.set(ex + 2, ey + 2, PAL.neonCyan);
    if (eyes === "worried") { im.set(ex === 38 ? ex + 2 : ex - 2, ey - 5, PAL.pupil); im.set(ex === 38 ? ex + 3 : ex - 3, ey - 5, PAL.pupil); im.set(ex === 38 ? ex + 1 : ex - 1, ey - 4, PAL.pupil); }
  }
  im.set(33, 11 + b, PAL.blush); im.set(34, 11 + b, PAL.blush); im.set(55, 11 + b, PAL.blush); im.set(56, 11 + b, PAL.blush);
  const my = 11 + b;
  if (mouth === "smile") { im.set(43, my, PAL.mouth); im.set(44, my + 1, PAL.mouth); im.set(45, my + 1, PAL.mouth); im.set(46, my, PAL.mouth); }
  if (mouth === "open") { im.rect(43, my, 4, 2, PAL.mouth); im.rect(44, my + 1, 2, 1, PAL.tongue); }
  if (mouth === "talk") im.rect(44, my, 2, 2, PAL.mouth);
  if (mouth === "wobble") for (let i = 0; i < 5; i++) im.set(42 + i, my + (i % 2), PAL.mouth);
  return im;
}
const CURF_FRAMES = [
  ["idle", { eyes: "open" }], ["idle", { eyes: "blink" }],
  ["talk", { mouth: "talk" }], ["talk", { mouth: "open" }],
  ["drive", { wheelPhase: 0 }], ["drive", { wheelPhase: 1, bob: 1 }],
  ["worried", { eyes: "worried", mouth: "wobble" }], ["worried", { eyes: "worried", mouth: "wobble", bob: 1 }],
  ["happy", { eyes: "happy", mouth: "open", bob: 1 }], ["happy", { eyes: "happy", mouth: "open" }],
];

// ---------- Oppy (Opportunity), 64 x 56, facing right ----------
// Drawn as a base body plus one aligned layer per real part, so the game can put Oppy back together:
//   base (body, rocker-bogie tubes, hazard cameras, sundial, bare mounting points)
//   wheels (6 aluminium MER wheels), arm (the Instrument Deployment Device and its 4-tool turret),
//   antenna (high-gain dish on a gimbal post), mast (Pancam mast with the camera "head"),
//   panels (the solar-cell deck).
// The main `oppy` sheet is base + arm + antenna + mast + panels (no wheels: the game fits those from
// `oppy-wheel`, as before). The `oppy-parts` sheet shows every layer and the finished rover.
// Personality rule: the eyes live on the mast camera head, never on tools. `dusty` dulls the panels.
const OPPY_HUBS = [12, 32, 52], OPPY_HUB_Y = 48;               // wheel hub x positions and y (do not move: the game fits wheels here)
const SOLAR = { hi: "#8a94ff", cell: "#4249cf", cellLo: "#303596", grid: "#20246b" };

function shadeHex(h, f) { const n = parseInt(h.slice(1), 16); return "#" + [16, 8, 0].map(s => Math.round(((n >> s) & 255) * f).toString(16).padStart(2, "0")).join(""); }
// A chunky 3 px tube: light edge on top/left, dark edge below/right.
function tube(im, x0, y0, x1, y1, mid = PAL.leg, hi = PAL.metalHi, lo = PAL.metalLow) {
  const steep = Math.abs(y1 - y0) > Math.abs(x1 - x0);
  for (const [o, c] of [[1, lo], [-1, hi], [0, mid]]) steep ? im.line(x0 + o, y0, x1 + o, y1, c) : im.line(x0, y0 + o, x1, y1 + o, c);
}
// Outline a layer, but never over pixels the base already has (so a part never hides the body's own edge).
function outlineOver(layer, under, c = PAL.outline) {
  const add = [];
  for (let y = 0; y < layer.h; y++) for (let x = 0; x < layer.w; x++) {
    if (layer.get(x, y) || under.get(x, y)) continue;
    if (layer.get(x - 1, y) || layer.get(x + 1, y) || layer.get(x, y - 1) || layer.get(x, y + 1)) add.push([x, y]);
  }
  for (const [x, y] of add) layer.set(x, y, c);
}

function oppyBase() {
  const im = new Img(64, 56);
  // bare deck frame: the wing structure the solar cells will be fixed onto (no cells yet)
  im.rect(1, 21, 62, 5, PAL.metalLow); im.rect(1, 21, 62, 1, PAL.metalMid); im.rect(1, 25, 62, 1, PAL.metalDeep);
  for (let x = 5; x < 63; x += 5) im.rect(x, 22, 1, 3, PAL.metalDeep);
  // bare mounting points: antenna pad, mast pad, arm shoulder lug, wheel axle plates
  im.rect(7, 19, 6, 2, PAL.metalDeep); im.set(8, 19, PAL.metalHi); im.set(11, 19, PAL.metalHi);
  im.rect(50, 19, 7, 2, PAL.metalDeep); im.set(51, 19, PAL.metalHi); im.set(55, 19, PAL.metalHi);
  im.rect(50, 27, 2, 4, PAL.metalDeep); im.set(50, 27, PAL.metalHi);
  // warm electronics body (same box as before)
  im.rect(14, 26, 36, 10, "#e9dcc0"); im.rect(14, 26, 36, 1, "#fff4dc"); im.rect(14, 34, 36, 2, "#cdb994");
  for (const [x, y] of [[16, 28], [47, 28], [16, 33], [47, 33]]) im.set(x, y, PAL.rivet);
  // front hazard cameras: two small lenses low on the front of the body
  for (const hx of [43, 46]) { im.rect(hx, 31, 3, 3, PAL.outline); im.set(hx + 1, 32, PAL.lens); im.set(hx + 1, 31, PAL.lensHi); }
  // sundial calibration target on the rear deck: a small colour-chip square with a post
  im.rect(22, 18, 6, 3, PAL.metalMid); im.set(22, 18, "#ff6b8a"); im.set(27, 18, PAL.neonLime); im.set(22, 20, "#6ba8ff"); im.set(27, 20, PAL.neonYellow);
  im.rect(24, 15, 2, 3, PAL.metalHi);
  // rocker-bogie: chunky tubes, joints and axle plates
  tube(im, 34, 36, 52, 47); tube(im, 34, 36, 22, 44); tube(im, 22, 44, 12, 47); tube(im, 22, 44, 32, 47);
  for (const [px, py] of [[34, 36], [22, 44]]) { im.disc(px, py, 2, PAL.metalDeep); im.set(px, py, PAL.metalHi); }
  for (const hx of OPPY_HUBS) { im.rect(hx - 2, OPPY_HUB_Y - 2, 5, 5, PAL.metalDeep); im.set(hx, OPPY_HUB_Y, PAL.hub); }
  im.outline();
  return im;
}

// One Oppy wheel, 14 x 14: aluminium rim with cleats, curved spoke flexures, open dark between them.
// Two tread phases (fitted on the bench, turned when driving). shade < 1 darkens it (far-side wheels).
function oppyWheel(phase, shade = 1) {
  const im = new Img(14, 14), c = 6.5, k = h => (shade === 1 ? h : shadeHex(h, shade));
  const a0 = phase ? Math.PI / 5 : 0;
  im.disc(c, c, 5.2, k(M.tire));                                                 // open dark between the spokes
  for (let y = 0; y < 14; y++) for (let x = 0; x < 14; x++) { const d = Math.hypot(x - c, y - c); if (d > 4.3 && d <= 5.6) im.set(x, y, k(PAL.wheel)); }   // aluminium rim
  for (let i = 0; i < 5; i++) {                                                  // five curved spoke flexures
    for (let t = 0; t <= 1.001; t += 0.1) { const r = 1.4 + t * 3.2, a = a0 + i * 2 * Math.PI / 5 + t * 1.1; im.set(c + Math.cos(a) * r, c + Math.sin(a) * r, k(PAL.metal)); }
  }
  im.disc(c, c, 1.4, k(PAL.metalLow)); im.set(c - 0.5, c - 0.5, k(PAL.hub));     // hub
  for (let i = 0; i < 12; i++) { const a = a0 + (i / 12) * Math.PI * 2; im.set(c + Math.cos(a) * 6.0, c + Math.sin(a) * 6.0, k(PAL.metalMid)); }   // cleats on the rim
  im.outline();
  return im;
}

function oppyWheelsLayer(base) {
  const im = new Img(64, 56), far = new Img(64, 56);
  for (const hx of OPPY_HUBS) far.blit(oppyWheel(0, 0.72), hx - 10, 38);          // far side: shifted up-left, darker, behind the body
  for (let y = 0; y < 56; y++) for (let x = 0; x < 64; x++) { const c = far.get(x, y); if (c && !base.get(x, y)) im.set(x, y, c); }
  for (const hx of OPPY_HUBS) im.blit(oppyWheel(0), hx - 7, OPPY_HUB_Y - 7);        // near side, in front of everything
  return im;
}

// The Instrument Deployment Device, folded under the front of the body, ending in a 4-tool turret:
// rock grinder (RAT), microscopic imager, APXS and Mossbauer spectrometer. Tools are plain hardware, no faces.
function oppyArmLayer(base) {
  const im = new Img(64, 56);
  tube(im, 51, 28, 57, 29, PAL.metal, PAL.metalHi, PAL.metalMid);                  // upper arm
  tube(im, 58, 29, 58, 34, PAL.metal, PAL.metalHi, PAL.metalMid);                  // forearm (folded down)
  im.disc(51.5, 28.5, 1.6, PAL.metalDeep); im.set(51, 28, PAL.metalHi);            // shoulder joint, over the body lug
  im.disc(58, 29, 1.4, PAL.metalDeep);                                              // elbow
  im.rect(57, 35, 3, 3, PAL.metalDeep);                                             // turret hub
  const head = (x, y, w, h, tip, tx, ty) => { im.rect(x, y, w, h, PAL.metalMid); im.set(tx, ty, tip); };
  head(57, 33, 3, 2, PAL.neonLime, 58, 33);       // up: APXS
  head(57, 38, 3, 2, PAL.neonYellow, 58, 39);     // down: rock grinder (RAT)
  head(55, 35, 2, 3, PAL.neonCyan, 55, 36);       // back: microscopic imager
  head(60, 35, 2, 3, PAL.neonPink, 61, 36);       // front: Moessbauer spectrometer
  outlineOver(im, base);
  return im;
}

// High-gain antenna: a steerable round dish on a short gimbal post on the rear deck.
function oppyAntennaLayer(base) {
  const im = new Img(64, 56);
  im.rect(9, 14, 2, 6, PAL.metalMid); im.rect(9, 14, 1, 6, PAL.metalHi);          // short post
  im.rect(8, 17, 4, 2, PAL.metalDeep); im.set(9, 17, PAL.metalHi);                // gimbal block
  for (let y = 4; y <= 15; y++) for (let x = 3; x <= 16; x++) {                   // round dish, tipped up toward the front
    const dx = (x - 9.5) / 6.6, dy = (y - 9.5) / 5.6;
    if (dx * dx + dy * dy <= 1) im.set(x, y, dx * dx + dy * dy > 0.62 ? PAL.metalHi : (dx + dy > 0.35 ? PAL.metalLow : PAL.metalMid));
  }
  im.line(10, 10, 14, 6, PAL.metalDeep); im.rect(14, 5, 2, 2, PAL.neonLime);      // feed horn
  outlineOver(im, base);
  return im;
}

// Pancam mast: a post rising from the FRONT of the deck, topped by the camera bar "head" with two stereo eyes.
function oppyMastLayer(base, { eyes = "open", mouth = "smile" } = {}) {
  const im = new Img(64, 56);
  im.rect(52, 11, 3, 10, PAL.metalMid); im.rect(52, 11, 1, 10, PAL.metalHi);       // post (stands on the mast pad)
  im.rect(51, 19, 5, 2, PAL.metalDeep);                                             // flange bolted to the pad
  im.rect(34, 1, 22, 10, PAL.metal); im.rect(34, 1, 22, 2, PAL.metalHi); im.rect(34, 9, 22, 2, PAL.metalMid);   // camera bar head
  for (const ex of [40, 50]) {                                                      // the two stereo camera eyes
    const ey = 5;
    if (eyes === "closed") { im.rect(ex - 3, ey + 1, 7, 1, PAL.pupil); continue; }
    if (eyes === "happy") { im.set(ex - 3, ey + 1, PAL.pupil); im.set(ex - 2, ey, PAL.pupil); im.set(ex - 1, ey - 1, PAL.pupil); im.set(ex, ey - 1, PAL.pupil); im.set(ex + 1, ey - 1, PAL.pupil); im.set(ex + 2, ey, PAL.pupil); im.set(ex + 3, ey + 1, PAL.pupil); continue; }
    im.disc(ex, ey, 3.4, PAL.lens); im.disc(ex + 0.5, ey + 0.5, 1.8, PAL.pupil);
    im.rect(ex - 2, ey - 2, 2, 2, PAL.shine); im.set(ex + 2, ey + 2, PAL.neonLime);
  }
  im.set(36, 9, PAL.blush); im.set(37, 9, PAL.blush); im.set(53, 9, PAL.blush); im.set(54, 9, PAL.blush);
  if (mouth === "smile") { im.set(43, 9, PAL.mouth); im.set(44, 10, PAL.mouth); im.set(45, 9, PAL.mouth); }
  if (mouth === "open") { im.rect(43, 8, 3, 2, PAL.mouth); im.set(44, 9, PAL.tongue); }
  if (mouth === "talk") { im.rect(43, 8, 2, 2, PAL.mouth); }
  if (mouth === "flat") { im.rect(43, 9, 3, 1, PAL.mouth); }
  outlineOver(im, base);
  return im;
}

// Solar panels: the wing-shaped deck covered in dark blue cells with grid lines.
function oppyPanelsLayer(base, { dusty = false } = {}) {
  const im = new Img(64, 56);
  im.rect(1, 21, 62, 5, SOLAR.cell); im.rect(1, 21, 62, 1, SOLAR.hi); im.rect(1, 25, 62, 1, SOLAR.cellLo);
  for (let x = 5; x < 63; x += 4) im.rect(x, 22, 1, 3, SOLAR.grid);                  // cell columns
  im.rect(1, 23, 62, 1, SOLAR.grid);                                                  // cell rows
  im.set(4, 22, PAL.panelSpec); im.set(5, 22, PAL.panelSpec); im.set(33, 22, PAL.panelSpec);
  outlineOver(im, base);
  if (dusty) { const r = rng(5); for (let i = 0; i < 26; i++) { const x = Math.round(2 + r() * 60), y = Math.round(21 + r() * 4), c = r() < 0.5 ? PAL.sandDark : PAL.sand; if (im.get(x, y)) im.set(x, y, c); } }
  for (let y = 22; y < 25; y++) im.set(62, y, PAL.rim);                                // lit front edge
  return im;
}

// Stack layers in order (later layers go on top).
function stack(...layers) { const im = new Img(64, 56); for (const l of layers) im.blit(l, 0, 0); return im; }
function oppyLayers(opts = {}) {
  const base = oppyBase();
  return { base, wheels: oppyWheelsLayer(base), arm: oppyArmLayer(base), antenna: oppyAntennaLayer(base), mast: oppyMastLayer(base, opts), panels: oppyPanelsLayer(base, opts) };
}
// The main-sheet frame: everything but the wheels (the game adds those from the oppy-wheel sheet).
function oppy(opts = {}) { const L = oppyLayers(opts); return stack(L.base, L.arm, L.antenna, L.mast, L.panels); }
const OPPY_FRAMES = [
  ["off", { eyes: "closed", mouth: "flat", dusty: true }],
  ["idle", { eyes: "open" }], ["idle", { eyes: "closed" }],
  ["talk", { mouth: "talk" }], ["talk", { mouth: "open" }],
  ["happy", { eyes: "happy", mouth: "open" }], ["happy", { eyes: "happy", mouth: "smile" }],
];

// ---------- ground tiles: 40 x 40 ----------
function sand(seed) {
  const im = new Img(TILE, TILE), r = rng(seed);
  im.rect(0, 0, TILE, TILE, PAL.sand);
  for (let i = 0; i < 40; i++) im.set(r() * TILE, r() * TILE, r() < 0.5 ? PAL.sandLight : PAL.sandDark);
  for (let i = 0; i < 4; i++) { const x = 3 + r() * 34, y = 3 + r() * 34; im.set(x, y, PAL.sandDark); im.set(x + 1, y, PAL.sandDark); im.set(x, y - 1, PAL.sandGlint); }
  return im;
}
function rockShape(seed, big) {
  const im = new Img(TILE, TILE), r = rng(seed);
  const lumps = big ? [[20, 23, 12], [12, 27, 7], [28, 27, 7], [19, 16, 7]] : [[20, 25, 10], [13, 28, 6], [27, 28, 6]];
  for (const [x, y, rad] of lumps) im.disc(x + (r() - 0.5) * 2, y, rad, PAL.rock);
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
    if (!im.get(x, y)) continue;
    if (!im.get(x - 2, y - 2)) im.set(x, y, PAL.rockHi);
    else if (!im.get(x + 1, y + 2)) im.set(x, y, PAL.rockShade);
  }
  for (let i = 0; i < 7; i++) { const x = 11 + r() * 18, y = 20 + r() * 10; if (im.get(x, y) === PAL.rock) im.set(x, y, PAL.rockShade); }
  im.outline();
  return im;
}
function onSand(top, seed) { const im = sand(seed); im.blit(top, 0, 0); return im; }
function ringTile() {
  const im = sand(7);
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
    const d = Math.hypot(x - 19.5, y - 19.5);
    if (d >= 13.5 && d < 15.5) im.set(x, y, PAL.neonCyan);
    else if (d >= 15.5 && d < 16.5 && (x + y) % 2 === 0) im.set(x, y, "#d9fdff");
    else if (d >= 12.5 && d < 13.5 && (x + y) % 2 === 0) im.set(x, y, PAL.neonPink);
  }
  return im;
}
// The rock to study: a different KIND of rock from the plain mauve ones. Pale grey stone with
// bumps and glinting mineral flecks, so children see it is special. A magnifier bobs above it.
function specialRock() {
  const im = new Img(TILE, TILE), r = rng(21);
  for (const [x, y, rad] of [[20, 24, 11], [12, 27, 7], [28, 27, 7], [20, 17, 7]]) im.disc(x, y, rad, "#b9b4cc");
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
    if (!im.get(x, y)) continue;
    if (!im.get(x - 2, y - 2)) im.set(x, y, "#e2def0");
    else if (!im.get(x + 1, y + 2)) im.set(x, y, "#8a84a3");
  }
  for (let i = 0; i < 9; i++) { const x = 10 + r() * 20, y = 15 + r() * 14; if (im.get(x, y) === "#b9b4cc") { im.set(x, y, "#d6d2e6"); im.set(x + 1, y, "#9e98b8"); } } // bumps
  im.outline();
  for (const [x, y] of [[15, 20], [24, 18], [19, 27], [27, 25], [13, 28]]) { im.set(x, y, PAL.neonCyan); im.set(x + 1, y - 1, "#ffffff"); } // mineral glints
  return im;
}
function targetRock() { return onSand(specialRock(), 5); }
// "Study this rock" marker: a magnifying glass, 16 x 16.
function marker() {
  const im = new Img(16, 16);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const d = Math.hypot(x - 6.5, y - 6.5);
    if (d < 5.6 && d >= 3.8) im.set(x, y, PAL.neonCyan);
    else if (d < 3.8) im.set(x, y, "#e9fdff");
  }
  im.set(5, 4, "#ffffff"); im.set(4, 5, "#ffffff");
  for (let i = 0; i < 4; i++) { im.set(10 + i, 10 + i, PAL.neonPink); im.set(11 + i, 10 + i, PAL.neonPink); }
  im.outline();
  return im;
}
const TILES = [["sand-a", sand(1)], ["sand-b", sand(2)], ["rock", onSand(rockShape(3, false), 3)], ["target-rock", targetRock()], ["ring", ringTile()]];

// ---------- Part 1: track cards (64 x 48, seen from above) and the wheel close-up ----------
function trackCard(kind) {
  const im = new Img(64, 48), r = rng(kind.length * 7);
  im.rect(0, 0, 64, 48, PAL.sand);
  for (let i = 0; i < 60; i++) im.set(r() * 64, r() * 48, r() < 0.5 ? PAL.sandLight : PAL.sandDark);
  if (kind === "sojourner") {              // Sojourner: small wheels with straight cleats -> two thin tracks, evenly ticked
    for (const x of [24, 37]) {
      im.rect(x, 0, 4, 48, PAL.track);
      for (let y = 1; y < 48; y += 3) im.rect(x, y, 4, 1, PAL.trackDeep);
    }
  } else if (kind === "curiosity") {       // Curiosity: wide treads with chevron grousers, and holes that print "JPL" in Morse code
    const MORSE = ".--- .--. .-..  ";      // J P L, then a pause; dot = short mark, dash = long mark
    for (const x0 of [5, 45]) {
      im.rect(x0, 0, 14, 48, PAL.track);
      for (let y = 0; y < 48; y += 5) for (let i = 0; i < 7; i++) { im.set(x0 + i, y + Math.floor(i / 2), PAL.trackDeep); im.set(x0 + 13 - i, y + Math.floor(i / 2), PAL.trackDeep); } // chevrons
      let y = 1;
      for (let k = 0; y < 47; k++) {        // the Morse marks run down the middle of each tread
        const c = MORSE[k % MORSE.length];
        if (c === ".") { im.rect(x0 + 6, y, 2, 2, PAL.sandLight); y += 4; }
        else if (c === "-") { im.rect(x0 + 6, y, 2, 5, PAL.sandLight); y += 7; }
        else y += 3;
      }
    }
  } else {                                 // a rock that rolled: one wobbly line ending at a rock
    for (let y = 12; y < 48; y++) { const x = 32 + Math.round(Math.sin(y / 4) * 6); im.rect(x - 1, y, 3, 1, PAL.track); }
    const small = new Img(20, 16);
    small.disc(10, 9, 6, PAL.rock); small.disc(6, 10, 4, PAL.rock); small.disc(14, 10, 4, PAL.rock);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 20; x++) { if (small.get(x, y) && !small.get(x - 1, y - 1)) small.set(x, y, PAL.rockHi); }
    small.outline();
    im.blit(small, 23, 0);
  }
  return im;
}
function wheelCloseUp() {        // big, clear wheel: metal rim, spokes, and chunky cleats around the edge
  const im = new Img(32, 32), c = 15.5;
  im.disc(c, c, 12, PAL.metalMid);
  im.disc(c, c, 10, PAL.metal);
  for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; im.line(Math.round(c + Math.cos(a) * 2), Math.round(c + Math.sin(a) * 2), Math.round(c + Math.cos(a) * 9), Math.round(c + Math.sin(a) * 9), PAL.metalLow); }
  im.disc(c, c, 2.5, PAL.metalDeep); im.set(15, 15, PAL.hub);
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    for (let r = 11; r <= 13; r++) im.set(c + Math.cos(a) * r, c + Math.sin(a) * r, PAL.metalDeep);
  }
  im.outline();
  for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) if (im.get(x, y) === PAL.metal && Math.hypot(x - 11, y - 11) < 4) im.set(x, y, PAL.metalHi);
  return im;
}
const TRACKS = [["sojourner", trackCard("sojourner")], ["curiosity", trackCard("curiosity")], ["rock", trackCard("rock")]];

// ---------- PNG writer ----------
const CRC = new Uint32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
function crc32(buf) { let c = 0xffffffff; for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
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

// ---------- sheets + Aseprite-style JSON ----------
function sheet(name, items) {
  const fw = items[0][1].w, fh = items[0][1].h;
  const s = new Img(fw * items.length, fh);
  items.forEach(([, im], i) => s.blit(im, i * fw, 0));
  const frames = items.map(([label], i) => ({ filename: `${name} ${i}`, label, frame: { x: i * fw, y: 0, w: fw, h: fh }, duration: 100 }));
  const tags = [];
  items.forEach(([label], i) => { const t = tags.at(-1); if (t && t.name === label) t.to = i; else tags.push({ name: label, from: i, to: i, direction: "forward" }); });
  const data = { frames, meta: { app: "tools/make_sprites.mjs", image: `${name}.png`, size: { w: s.w, h: fh }, scale: "1", frameTags: tags } };
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
const ASSETS = {
  sojourner: sheet("sojourner", SOJ_FRAMES.map(([l, o]) => [l, sojournerChunky("side", o)])),
  curiosity: sheet("curiosity", CUR_FRAMES.map(([l, o]) => [l, curiosity(o)])),
  curiosityFull: sheet("curiosity-full", CURF_FRAMES.map(([l, o]) => [l, curiosityFull(o)])),
  tiles: sheet("tiles", TILES),
  tracks: sheet("tracks", TRACKS),
  wheel: sheet("wheel", [["wheel", wheelCloseUp()]]),
  marker: sheet("marker", [["marker", marker()]]),
  oppy: sheet("oppy", OPPY_FRAMES.map(([l, o]) => [l, oppy(o)])),
  oppyWheel: sheet("oppy-wheel", [["wheel", oppyWheel(0)], ["wheel", oppyWheel(1)]]),
  specialRock: sheet("special-rock", [["rock", specialRock()]]),
  plainRock: sheet("plain-rock", [["rock", plainRock()]]),
  curiosityAngled: sheet("curiosity-angled", ANGLED_FRAMES.map(([l, o]) => [l, curiosityAngled(o)])),
  sojournerAngled: sheet("sojourner-angled", ANGLED_FRAMES.map(([l, o]) => [l, sojournerAngled(o)])),
  rockKinds: sheet("rock-kinds", [["plain", plainRock()], ["dark", darkRock()], ["layered", layeredRock()]]),
  sojournerFront: sheet("sojourner-front", SOJ_FRONT.map(([l, o]) => [l, sojournerChunky("front", o)])),
  sojournerBack: sheet("sojourner-back", SOJ_BACK.map(([l, o]) => [l, sojournerChunky("back", o)])),
  // one frame per 45° from facing up to facing down (right-hand side); the game flips for the left
  sojournerTurn: sheet("sojourner-turn", [["up", sojournerChunky("back")], ["upRight", sojourner34("back34")],
    ["right", sojournerChunky("side")], ["downRight", sojourner34("front34")], ["down", sojournerChunky("front")]]),
};

// ---------- Oppy parts sheet: base + one layer per part + the finished rover ----------
{
  const L = oppyLayers(OPPY_FRAMES[1][1]);                                  // awake, neutral: eyes open, smile
  const ORDER = ["wheels", "arm", "antenna", "mast", "panels"];
  const complete = stack(L.base, ...ORDER.map(k => L[k]));
  const partsItems = [["base", L.base], ...ORDER.map(k => [k, L[k]]), ["complete", complete]];
  ASSETS.oppyParts = sheet("oppy-parts", partsItems);                    // embedded in the Track Detective page

  // Assertion 1 (file level): decode the written PNG and check base + 5 layers == complete, pixel for pixel.
  const pngBuf = fs.readFileSync(path.join(OUT, "oppy-parts.png"));
  let o = 8, W = 0, H = 0; const idat = [];
  while (o < pngBuf.length) { const n = pngBuf.readUInt32BE(o), t = pngBuf.toString("latin1", o + 4, o + 8); if (t === "IHDR") { W = pngBuf.readUInt32BE(o + 8); H = pngBuf.readUInt32BE(o + 12); } if (t === "IDAT") idat.push(pngBuf.subarray(o + 8, o + 8 + n)); o += 12 + n; }
  const raw = zlib.inflateSync(Buffer.concat(idat)), stride = W * 4 + 1;
  const px = (x, y) => { const i = y * stride + 1 + x * 4; return raw[i + 3] ? [raw[i], raw[i + 1], raw[i + 2], 255].join(",") : "-"; };
  let bad = 0, total = 0;
  for (let y = 0; y < 56; y++) for (let x = 0; x < 64; x++) {
    let want = "-";
    for (const f of [0, 1, 2, 3, 4, 5]) { const v = px(f * 64 + x, y); if (v !== "-") want = v; }      // base, then the five layers on top
    total++; if (want !== px(6 * 64 + x, y)) bad++;
  }
  console.log(`oppy-parts assertion: base + 5 layers vs complete: ${total - bad}/${total} pixels equal, ${bad} differ`);
  if (bad) { console.error("FAIL: oppy-parts layers do not add up to the complete frame"); process.exit(1); }

  // Assertion 2: the complete frame is the main-sheet awake/neutral frame plus the wheel layer, nothing else.
  const mainIdle = oppy(OPPY_FRAMES[1][1]);
  let drift = 0, wheelPx = 0;
  for (let y = 0; y < 56; y++) for (let x = 0; x < 64; x++) { if (L.wheels.get(x, y)) { wheelPx++; continue; } if (mainIdle.get(x, y) !== complete.get(x, y)) drift++; }
  console.log(`oppy-parts complete vs oppy idle frame: ${drift} differing pixels outside the ${wheelPx}-pixel wheel layer`);
  if (drift) { console.error("FAIL: complete drifts from the main oppy idle frame"); process.exit(1); }

  // Anchors for the game: bounding box of each part in frame pixels, its mount point, wheel centres.
  const bbox = im => { let x0 = 99, y0 = 99, x1 = -1, y1 = -1; for (let y = 0; y < im.h; y++) for (let x = 0; x < im.w; x++) if (im.get(x, y)) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); } return { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 }; };
  const wheelAt = (hx, near) => { const ox = hx - (near ? 7 : 10), oy = OPPY_HUB_Y - (near ? 7 : 10); return { centre: { x: ox + 6.5, y: oy + 6.5 }, hub: { x: hx, y: OPPY_HUB_Y }, box: { x: ox, y: oy, w: 14, h: 14 }, near }; };
  const anchors = {
    frame: { w: 64, h: 56 }, sheet: "oppy-parts.png", order: ["base", ...ORDER, "complete"],
    note: "Frame pixels, origin top-left of one 64 x 56 frame. Draw base, then the parts in order; every part layer overlaps the base at its mount.",
    groundY: bbox(L.wheels).y + bbox(L.wheels).h,
    parts: {
      base: { box: bbox(L.base), mount: null },
      wheels: { box: bbox(L.wheels), mount: OPPY_HUBS.map(hx => ({ x: hx, y: OPPY_HUB_Y })), centres: { near: OPPY_HUBS.map(hx => wheelAt(hx, true)), far: OPPY_HUBS.map(hx => wheelAt(hx, false)) } },
      arm: { box: bbox(L.arm), mount: { x: 51, y: 28, what: "shoulder joint on the lug at the front of the body" }, turret: { x: 58, y: 36 } },
      antenna: { box: bbox(L.antenna), mount: { x: 10, y: 19, what: "gimbal base on the rear deck pad" }, dish: { x: 9.5, y: 9.5 } },
      mast: { box: bbox(L.mast), mount: { x: 53, y: 20, what: "post foot on the front deck pad" }, head: { x: 34, y: 1, w: 22, h: 10 }, eyes: [{ x: 40, y: 5 }, { x: 50, y: 5 }] },
      panels: { box: bbox(L.panels), mount: { x: 32, y: 25, what: "deck wings sit on the bare deck frame above the body" } },
    },
  };
  fs.writeFileSync(path.join(OUT, "oppy-parts-anchors.json"), JSON.stringify(anchors, null, 2));
  console.log("wrote art/out/oppy-parts.png/.json and oppy-parts-anchors.json");
}

// ---------- build the prototype page ----------
const tplPath = path.join(ROOT, "prototype", "track-detective.template.html");
if (fs.existsSync(tplPath)) {
  const html = fs.readFileSync(tplPath, "utf8")
    .replace("__ASSETS__", () => JSON.stringify(ASSETS))
    .replace("__PAL__", () => JSON.stringify(PAL));
  fs.writeFileSync(path.join(ROOT, "prototype", "track-detective.html"), html);
}
console.log("wrote", Object.keys(ASSETS).map(k => `${k} ${ASSETS[k].fw}x${ASSETS[k].fh}x${ASSETS[k].names.length}`).join(", "));
const insight = path.join(ROOT, "prototype", "insight.template.html");
if (fs.existsSync(insight)) {
  const puzzles = fs.readFileSync(path.join(ROOT, "prototype", "insight-puzzles.mjs"), "utf8").replace(/^export /gm, "");
  const html = fs.readFileSync(insight, "utf8")
    .replace("__PUZZLES__", () => puzzles)
    .replace("__ASSETS__", () => JSON.stringify({ curiosity: ASSETS.curiosity, curiosityAngled: ASSETS.curiosityAngled, oppy: ASSETS.oppy,
      oppyParts: { src: "data:image/png;base64," + fs.readFileSync(path.join(OUT, "oppy-parts.png")).toString("base64"), fw: 64, fh: 56, tags: [], names: ["base", "wheels", "arm", "antenna", "mast", "panels", "complete"] } }))
    .replace("__PAL__", () => JSON.stringify(PAL));
  fs.writeFileSync(path.join(ROOT, "prototype", "insight.html"), html);
}
