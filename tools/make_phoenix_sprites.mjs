// Code-made pixel art for the Phoenix chapter ("The Clue That Vanished").
// Run: node tools/make_phoenix_sprites.mjs        (ZOOM_DIR=/dir also writes 8x copies)
// Writes art/out/phoenix-*.png + .json (Aseprite-style) using the shared kit in tools/pixel-art.mjs.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PAL, M, Img, rng, chunkyRect, bigEyes, sheet } from "./pixel-art.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "art", "out");

// Phoenix colours on top of the shared palette. The icy north stays neon rusty red (owner rule);
// ice is cool blue-white, the salt-white pebble is WARM white so the two never look alike.
export const PH = {
  gold: "#ffd36e", goldShade: "#e0a03e",                       // thermal skirt under the deck
  panelLine: "#4a3cc0",
  arm: "#eef2fa", armShade: "#b9c2da", joint: "#8b93b3",
  scoop: "#aab5d0", scoopShade: "#7d86a8", scoopIn: "#555c80", blade: "#ffffff", rasp: "#646e93",
  ice: "#ffffff", iceHi: "#ffffff", iceShade: "#bfe3f5", iceDeep: "#8fc3df",
  iceLayer: "#e3ecf0", iceLayerShade: "#b7cbd6",
  soil: "#a83f28", soilDeep: "#86301f", soilLip: "#ff9a6a",
  pebble: "#f6e7c8", pebbleShade: "#d2b98c",
  shadow: "#7a2c1c", crack: "#b0442a", frost: "#ffd2bd",
  spark: PAL.neonYellow, wisp: "#e9fbff",
};

// ---------- small geometry helpers ----------
function poly(im, pts, c) {                                     // filled polygon (even-odd)
  const ys = pts.map(p => p[1]), y0 = Math.floor(Math.min(...ys)), y1 = Math.ceil(Math.max(...ys));
  for (let y = y0; y <= y1; y++) {
    const xs = [];
    for (let i = 0; i < pts.length; i++) {
      const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length];
      if ((ay <= y + 0.5 && by > y + 0.5) || (by <= y + 0.5 && ay > y + 0.5)) xs.push(ax + (y + 0.5 - ay) * (bx - ax) / (by - ay));
    }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.round(xs[k]); x < Math.round(xs[k + 1]); x++) im.set(x, y, c);
  }
}
function thick(im, x0, y0, x1, y1, w, c) {                     // thick line made of discs
  const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0)));
  for (let i = 0; i <= n; i++) im.disc(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, w / 2, c);
}
function ellipse(im, cx, cy, rx, ry, c) {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++)
    if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) im.set(x, y, c);
}

// ---------- Phoenix lander: 112 x 80, three-quarter view from the front, anchor bottom centre ----------
// Real hardware kept: two round ten-sided solar arrays, the deck, three legs with footpads,
// the stereo camera mast (SSI), the small weather mast (MET), the arm's shoulder on the deck.
// No face on the lander: the character is the ARM (Person 1's story: "I was the arm with the scoop").
function decagon(cx, cy, r, squash) {
  return Array.from({ length: 10 }, (_, i) => { const a = Math.PI / 10 + i * Math.PI / 5; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r * squash]; });
}
function solarArray(im, cx, cy) {
  const pts = decagon(cx, cy, 23, 0.42);
  poly(im, pts, M.panel);
  poly(im, decagon(cx, cy - 1.5, 19, 0.36), M.panelHi);        // lit top face
  poly(im, decagon(cx, cy - 0.5, 17, 0.32), M.panel);
  for (const [px, py] of pts) im.line(Math.round(cx), Math.round(cy), Math.round(px), Math.round(py), PH.panelLine);
  im.disc(cx, cy, 2, M.hub);
}
function lander({ dusty = false } = {}) {
  const im = new Img(112, 80);
  // legs first (behind the deck): back leg, then the two front legs with flat footpads
  thick(im, 56, 50, 56, 66, 3, M.hubDot); im.rect(52, 66, 9, 2, M.tire);
  thick(im, 44, 50, 33, 74, 3, M.hubDot); chunkyRect(im, 27, 74, 12, 4, M.tire, 1);
  thick(im, 68, 50, 79, 74, 3, M.hubDot); chunkyRect(im, 73, 74, 12, 4, M.tire, 1);
  // solar arrays on short struts
  thick(im, 38, 40, 46, 40, 3, M.hubDot); thick(im, 66, 40, 74, 40, 3, M.hubDot);
  solarArray(im, 24, 40); solarArray(im, 88, 40);
  // deck: body with a lit top, gold thermal skirt under it
  chunkyRect(im, 39, 28, 34, 18, M.body, 3);
  im.rect(42, 29, 28, 3, M.bodyHi); im.rect(41, 41, 30, 4, M.bodyShade);
  chunkyRect(im, 41, 45, 30, 7, PH.gold, 2); im.rect(43, 49, 26, 2, PH.goldShade);
  for (let x = 45; x < 68; x += 5) im.set(x, 47, PH.goldShade);
  // instrument boxes on the deck (small, simple)
  chunkyRect(im, 43, 33, 8, 6, M.bodyShade, 1); chunkyRect(im, 53, 33, 6, 6, M.panelHi, 1); chunkyRect(im, 61, 33, 8, 6, M.bodyShade, 1);
  // stereo camera mast (SSI): pole + head with two small dark lenses
  im.rect(47, 9, 2, 20, M.hubDot);
  chunkyRect(im, 41, 2, 14, 8, M.body, 2); im.rect(42, 3, 12, 1, M.bodyHi);
  im.rect(43, 5, 10, 2, PAL.lens); im.set(44, 5, PAL.lensHi); im.set(51, 5, PAL.lensHi);
  // weather mast (MET) with its little telltale
  im.rect(66, 13, 1, 16, M.hubDot); im.rect(64, 11, 4, 2, PAL.neonCyan);
  // arm shoulder (the game draws the arm itself from here)
  chunkyRect(im, 70, 30, 7, 7, PH.armShade, 2);
  if (dusty) for (let i = 0, r = rng(9); i < 30; i++) im.set(14 + r() * 84, 32 + r() * 14, PAL.sandLight);
  im.outline();
  return im;
}

// ---------- the arm's head: 40 x 40, wrist block with the face + the scoop, reaching right ----------
// The face sits on the wrist, next to the Robotic Arm Camera (the arm's real camera, mounted just
// above the scoop). Blade on the FRONT edge; the rasp comes out of the BACK of the scoop.
function scoopHead({ pose = "idle", eyes = "open", mouth = "smile", bob = 0 } = {}) {
  const im = new Img(40, 40), b = bob;
  thick(im, 0, 7 + b, 9, 10 + b, 4, PH.arm); im.rect(0, 10 + b, 8, 1, PH.armShade);       // forearm coming in
  im.disc(10, 11 + b, 3, PH.joint);                                                        // wrist joint
  chunkyRect(im, 11, 3 + b, 16, 13, PH.arm, 3);                                            // wrist block (the head)
  im.rect(13, 13 + b, 12, 2, PH.armShade); im.rect(14, 4 + b, 10, 1, M.bodyHi);
  chunkyRect(im, 19, 0 + b, 6, 4, PAL.lens, 1); im.set(20, 1 + b, PAL.lensHi);            // Robotic Arm Camera on top
  im.rect(16, 16 + b, 6, 3, PH.joint);                                                     // neck down to the scoop
  if (pose !== "rasp") {
    // the scoop seen from above: an open pan, back wall on the left, mouth (blade) on the right
    poly(im, [[11, 21], [25, 18], [37, 21], [37, 35], [25, 38], [11, 34]].map(([x, y]) => [x, y + b]), PH.scoop);
    poly(im, [[11, 31], [25, 34], [37, 31], [37, 35], [25, 38], [11, 34]].map(([x, y]) => [x, y + b]), PH.scoopShade);
    poly(im, [[15, 23], [25, 21], [35, 23.5], [35, 31], [25, 33], [15, 30.5]].map(([x, y]) => [x, y + b]), PH.scoopIn);
    thick(im, 37, 22 + b, 37, 34 + b, 2, PH.blade);                                       // front blade
    chunkyRect(im, 8, 26 + b, 4, 6, PH.rasp, 1);                                          // rasp housing on the back
    if (pose === "full") { im.disc(24, 26 + b, 4.5, PAL.sand); im.disc(30, 27 + b, 3.5, PAL.sandDark); im.disc(21, 25 + b, 2.5, PAL.sandLight); }
    if (pose === "dig") for (const [x, y] of [[39, 30], [38, 36], [39, 25]]) im.set(x, y + b, PAL.sandLight);
  } else {
    // turned round: the scoop's underside faces down and the rasp spins out of its back
    poly(im, [[11, 20], [25, 19], [36, 21], [35, 29], [25, 31], [12, 29]].map(([x, y]) => [x, y + b]), PH.scoop);
    im.rect(13, 27 + b, 21, 2, PH.scoopShade);
    chunkyRect(im, 20, 29 + b, 6, 3, PH.rasp, 1);
    thick(im, 23, 32 + b, 23, 38, 2, PH.rasp); im.set(22, 34, M.hub); im.set(24, 36, M.hub);  // the spinning rasp bit
    for (const [x, y] of [[19, 38], [27, 37], [17, 36], [29, 39]]) im.set(x, y, PH.spark); // icy shavings
  }
  im.outline();
  // face on the wrist block
  bigEyes(im, 14, 5, 4, 6, 1, eyes, b); bigEyes(im, 20, 5, 4, 6, 1, eyes, b);
  im.set(13, 12 + b, PAL.blush); im.set(25, 12 + b, PAL.blush);
  const my = 12 + b;
  if (mouth === "smile") { im.set(18, my, PAL.mouth); im.set(19, my + 1, PAL.mouth); im.set(20, my, PAL.mouth); }
  if (mouth === "open" || mouth === "talk") { chunkyRect(im, 18, my, 3, mouth === "open" ? 3 : 2, PAL.mouth, 0); if (mouth === "open") im.set(19, my + 2, PAL.tongue); }
  if (mouth === "wobble") for (let i = 0; i < 4; i++) im.set(17 + i, my + (i % 2), PAL.mouth);
  if (mouth === "hmm") im.rect(18, my, 3, 1, PAL.mouth);
  return im;
}
const SCOOP_FRAMES = [
  ["idle", {}], ["idle", { bob: 1 }], ["talk", { mouth: "talk" }], ["talk", { mouth: "open" }],
  ["dig", { pose: "dig", mouth: "open" }], ["full", { pose: "full", eyes: "happy" }],
  ["clunk", { pose: "dig", eyes: "worried", mouth: "wobble" }], ["rasp", { pose: "rasp", mouth: "open" }],
  ["detective", { eyes: "worried", mouth: "hmm" }], ["happy", { eyes: "happy", mouth: "open" }],
];

// ---------- things in the trench, 24 x 20 each, shadow down-right ----------
function blob(im, cx, cy, r, seed, fill, shade, hi) {
  const R = rng(seed), k = Array.from({ length: 7 }, () => 0.75 + R() * 0.4);
  const pts = k.map((f, i) => { const a = i * Math.PI * 2 / 7; return [cx + Math.cos(a) * r * f * 1.25, cy + Math.sin(a) * r * f * 0.8]; });
  poly(im, pts.map(([x, y]) => [x + 2, y + 2]), PH.shadow);                                // shadow down-right
  poly(im, pts, fill);
  poly(im, pts.map(([x, y]) => [x + (x - cx) * -0.25 + 1, y + (y - cy) * -0.25 + 1.2]), shade);
  poly(im, pts.map(([x, y]) => [x + (x - cx) * -0.35 - 0.6, y + (y - cy) * -0.35 - 0.6]), fill);
  if (hi) { im.set(cx - r * 0.5, cy - r * 0.3, hi); im.set(cx - r * 0.5 + 1, cy - r * 0.3, hi); }
}
function iceChunk(stage = 0) {        // stage 0 whole … 3 gone (sublimating: shrinks, wisps rise; ILLUSTRATION)
  const im = new Img(24, 20), r = [6, 4.5, 2.5, 0][stage];
  if (r) blob(im, 11, 12, r, 4, PH.ice, PH.iceShade, PH.iceHi);
  if (stage === 1 || stage === 2) for (const [x, y] of [[9, 4], [14, 2], [11, 1], [16, 5]]) im.set(x, y + stage, PH.wisp);
  if (r) im.outline();                                         // gone: nothing left
  return im;
}
function pebble() { const im = new Img(24, 20); blob(im, 11, 12, 4.5, 11, PH.pebble, PH.pebbleShade, "#fffaf0"); im.outline(); return im; }
function rockBit() { const im = new Img(24, 20); blob(im, 11, 12, 6, 21, PAL.rock, PAL.rockShade, PAL.rockHi); im.outline(); return im; }
function dumpPile(size) {             // 0 small … 2 big: the soil the scoop dug, piled beside the trench
  const im = new Img(24, 20), rx = [5, 7.5, 10][size], ry = [3, 4.5, 6][size];
  ellipse(im, 13, 17, rx + 1, 2, PH.shadow);
  for (let y = 0; y < 20; y++) for (let x = 0; x < 24; x++) {
    const dx = (x - 11) / rx, dy = (y - 16) / ry;
    if (y <= 16 && dx * dx + dy * dy <= 1) im.set(x, y, dx + dy * 0.6 < -0.35 ? PAL.sandLight : dx - dy * 0.3 > 0.45 ? PAL.sandDark : PAL.sand);
  }
  const R = rng(40 + size); for (let i = 0; i < 2 + size * 2; i++) im.set(11 + (R() - 0.5) * rx * 1.4, 16 - R() * ry * 0.8, PAL.sandDark);
  im.outline();
  return im;
}

// ---------- ground: icy northern plain with polygon cracks (one seamless pass, no strips) ----------
function plain(im, x0, y0, w, h, horizon, seed) {
  const R = rng(seed), pts = [];
  for (let gy = -2; gy < 40; gy++) for (let gx = -30; gx < 30; gx++) pts.push([gx * 38 + R() * 28, gy * 38 + R() * 28]);
  for (let y = Math.max(y0, horizon); y < y0 + h; y++) {
    const d = y - horizon + 10, s = 70 / d;                       // ground units per pixel at this row
    for (let x = x0; x < x0 + w; x++) {
      const gx = (x - 160) * s, gy = 2600 / d;
      let a = 1e9, b = 1e9, ia = 0;
      for (let i = 0; i < pts.length; i++) {
        const dx = pts[i][0] - gx; if (dx > 120 || dx < -120) continue;
        const dy = pts[i][1] - gy; if (dy > 120 || dy < -120) continue;
        const q = dx * dx + dy * dy;
        if (q < a) { b = a; a = q; ia = i; } else if (q < b) b = q;
      }
      const edge = Math.sqrt(b) - Math.sqrt(a);
      let c = ia % 3 === 0 ? PAL.sandLight : PAL.sand;
      if (edge < 2.2 * s) c = PH.crack;
      else if ((((x * 73856093) ^ (y * 19349663)) >>> 0) % 53 === 0) c = PH.frost;   // scattered frost glints
      im.set(x, y, c);
    }
  }
}

// ---------- a trench seen from the camera mast (used for Earlier / Later) ----------
// Parallelogram hole: lit far wall, shadowed near wall, floor of soil with the icy layer showing.
function trench(im, ox, oy, w, h, { chunks = [], pebbles = [], shadow = 0, pile = 0, ice = true } = {}) {
  const sk = 10;                                                 // slant of the side walls
  poly(im, [[ox, oy], [ox + w, oy], [ox + w - sk, oy + h], [ox - sk, oy + h]], PH.soilDeep);           // hole
  poly(im, [[ox + 2, oy + 6], [ox + w - 2, oy + 6], [ox + w - sk - 2, oy + h - 2], [ox - sk + 2, oy + h - 2]], PH.soil);  // floor
  if (ice) {                                                     // the hard icy layer: pale, patchy, speckled with soil
    poly(im, [[ox + 3, oy + h * 0.46], [ox + w * 0.3, oy + h * 0.36], [ox + w * 0.56, oy + h * 0.42], [ox + w * 0.5, oy + h - 3], [ox - sk + 4, oy + h - 3]], PH.iceLayerShade);
    poly(im, [[ox + 5, oy + h * 0.5], [ox + w * 0.3, oy + h * 0.41], [ox + w * 0.52, oy + h * 0.46], [ox + w * 0.47, oy + h - 6], [ox - sk + 7, oy + h - 5]], PH.iceLayer);
    const R = rng(77); for (let i = 0; i < w; i++) im.set(ox - sk + 6 + R() * w * 0.55, oy + h * 0.5 + R() * h * 0.42, R() < 0.5 ? PH.soil : PH.iceLayerShade);
  }
  im.rect(ox, oy, w, 6, PH.soilDeep); im.rect(ox + 1, oy + 1, w - 2, 1, PH.soilLip);                  // far wall + lit lip
  // the far wall's shadow on the floor; it moves when the Sun moves (a lookalike, not a clue)
  poly(im, [[ox + 2, oy + 6], [ox + w - 2, oy + 6], [ox + w - 2 - shadow * 3, oy + 14 - shadow], [ox + 2 - shadow, oy + 14 - shadow]], PH.shadow);
  for (const c of chunks) im.blit(iceChunk(c.stage || 0), ox + c.x - 12, oy + c.y - 12);
  for (const p of pebbles) im.blit(pebble(), ox + p.x - 12, oy + p.y - 12);
  im.blit(dumpPile(pile), ox + w + 2, oy + h - 18);
}

// ---------- scenes for the art review ----------
function sky(im, h) {
  for (let y = 0; y < h; y++) for (let x = 0; x < im.w; x++) im.set(x, y, y < h * 0.55 ? PAL.night : PAL.nightHi);
  const R = rng(3); for (let i = 0; i < 40; i++) im.set(R() * im.w, R() * h * 0.8, R() < 0.3 ? PAL.neonCyan : "#ffffff");
}
// Landing clues Curiosity follows to find Phoenix. Phoenix's parachute with its backshell, and its
// heat shield, came down near the lander, and orbiter pictures show all three [source].
function heatShield(im, x, y) {                 // a big round shield lying tilted, its rim sunk in the soil
  ellipse(im, x + 4, y + 4, 25, 7, PH.shadow);
  ellipse(im, x, y, 24, 8, "#5c3a2a"); ellipse(im, x - 1, y - 1, 21, 6.5, "#8a5a3c");
  ellipse(im, x - 2, y - 2, 15, 4.5, "#b5794c"); ellipse(im, x - 5, y - 3, 6, 1.6, "#e0b080");
  for (let a = 0; a < 6.28; a += 0.02) im.set(x + Math.cos(a) * 24.5, y + Math.sin(a) * 8.5, PAL.outline);   // dark rim
  for (let i = -22; i <= 22; i += 3) im.set(x + i, y + 7, PAL.sandDark);
}
function parachute(im, x, y) {                  // canopy spread on the ground, lines to the backshell
  ellipse(im, x + 3, y + 3, 40, 9, PH.shadow);
  ellipse(im, x, y, 40, 9, "#c9c0e6"); ellipse(im, x, y - 1, 37, 7.5, "#f4f1ff");
  for (let i = -32; i <= 32; i += 8) im.line(x + i, y - 7, x + Math.round(i * 1.15), y + 7, "#d6cff0");   // gores (whole pixels: line() needs integers)
  im.rect(x - 36, y - 2, 72, 2, PAL.neonPink);                    // a pink band so it reads as fabric
  for (let a = 0; a < 6.28; a += 0.02) im.set(x + Math.cos(a) * 40.5, y + Math.sin(a) * 9.5, PAL.outline);
  const bx = x + 62, by = y + 8;                                  // backshell: a white cone on its side
  for (const dy of [-4, 0, 4]) im.line(x + 38, y + dy, bx - 10, by - 4, "#e2dcf5");
  ellipse(im, bx + 4, by + 6, 16, 4, PH.shadow);
  poly(im, [[bx - 12, by - 13], [bx + 8, by - 8], [bx + 13, by + 5], [bx - 14, by + 4]], "#e8ecf6");
  poly(im, [[bx - 14, by + 1], [bx + 13, by + 2], [bx + 13, by + 5], [bx - 14, by + 4]], "#aab5d0");
  poly(im, [[bx - 9, by - 10], [bx - 2, by - 8], [bx - 3, by - 2], [bx - 10, by - 3]], "#ffffff");
}
function wideScene() {                 // 560 x 200: the plain with the landing clues, then Phoenix digging
  const W = 560, im = new Img(W, 200), H = 58;
  sky(im, H); plain(im, 0, H, W, 200 - H, H, 7);
  im.rect(0, H, W, 1, PH.frost);                                   // flat northern horizon
  heatShield(im, 296, 178);
  parachute(im, 404, 150);
  trench(im, 176, 132, 64, 30, { chunks: [{ x: 18, y: 22 }, { x: 34, y: 25 }, { x: 10, y: 27 }], pile: 1 });
  const L = lander(); ellipse(im, 92, 196, 50, 4, PH.shadow); im.blit(L, 36, 118);
  // the arm: shoulder → elbow → wrist, then the scoop head
  const sh = [110, 152], el = [152, 104], wr = [186, 114];
  thick(im, sh[0], sh[1], el[0], el[1], 5, PH.armShade); thick(im, sh[0], sh[1] - 1, el[0], el[1] - 1, 3, PH.arm);
  thick(im, el[0], el[1], wr[0], wr[1], 4, PH.armShade); thick(im, el[0], el[1] - 1, wr[0], wr[1] - 1, 2, PH.arm);
  im.disc(el[0], el[1], 3.5, PH.joint);
  im.blit(scoopHead({ pose: "dig", mouth: "open" }), wr[0] - 4, wr[1] - 8);
  return im;
}
const CASE1 = { chunks: [{ x: 22, y: 30 }, { x: 40, y: 34 }, { x: 14, y: 40 }], pebbles: [{ x: 70, y: 36 }] };
function closeUp(later) {             // 160 x 100 Earlier / Later pair for "find what vanished"
  const im = new Img(160, 100);
  plain(im, 0, 0, 160, 100, -40, 12);
  trench(im, 30, 22, 100, 62, {
    chunks: CASE1.chunks.map((c, i) => ({ ...c, stage: later ? (i === 2 ? 2 : 3) : 0 })),
    pebbles: CASE1.pebbles, shadow: later ? 4 : 0, pile: later ? 2 : 1,
  });
  return im;
}

// ---------- base pictures for the game (160 x 100): ground, soil floor, icy floor ----------
// The game builds every trench picture from these at runtime, square by square, so the dig and the
// Earlier / Later pictures always match. TRENCH comes from prototype/phoenix-cases.json.
const CASES = JSON.parse(fs.readFileSync(path.join(ROOT, "prototype", "phoenix-cases.json"), "utf8"));
const [TX, TY, TW, TH] = CASES.trench;
function trenchBase(kind) {
  const im = new Img(160, 100);
  plain(im, 0, 0, 160, 100, -40, 12);
  if (kind === "ground") return im;
  im.rect(TX, TY, TW, TH, PH.soilDeep);
  const fx = TX + 1, fy = TY + 6, fw = TW - 2, fh = TH - 7;
  im.rect(fx, fy, fw, fh, PH.soil);
  const R = rng(kind === "ice" ? 81 : 82);
  if (kind === "ice") {
    im.rect(fx, fy, fw, fh, PH.iceLayerShade); im.rect(fx + 1, fy + 2, fw - 2, fh - 3, PH.iceLayer);
    for (let i = 0; i < fw * 1.4; i++) im.set(fx + 1 + R() * (fw - 2), fy + 2 + R() * (fh - 3), R() < 0.55 ? PH.soil : PH.iceLayerShade);
  } else for (let i = 0; i < fw; i++) im.set(fx + R() * fw, fy + R() * fh, R() < 0.5 ? PH.soilDeep : PAL.sandDark);
  im.rect(TX, TY, TW, 6, PH.soilDeep); im.rect(TX + 1, TY + 1, TW - 2, 1, PH.soilLip);   // far wall + lit lip
  im.rect(TX, TY, 1, TH, PH.shadow); im.rect(TX + TW - 1, TY, 1, TH, PH.soilLip);       // side walls
  im.rect(TX, TY + TH - 1, TW, 1, PH.soilLip);                                         // near lip
  return im;
}

// ---------- write ----------
const sheets = {
  phoenixLander: sheet(OUT, "phoenix-lander", [["idle", lander()], ["dusty", lander({ dusty: true })]], "tools/make_phoenix_sprites.mjs"),
  phoenixScoop: sheet(OUT, "phoenix-scoop", SCOOP_FRAMES.map(([n, o]) => [n, scoopHead(o)]), "tools/make_phoenix_sprites.mjs"),
  phoenixIce: sheet(OUT, "phoenix-ice", [0, 1, 2, 3].map(s => ["ice", iceChunk(s)]), "tools/make_phoenix_sprites.mjs"),
  phoenixBits: sheet(OUT, "phoenix-bits", [["pebble", pebble()], ["rock", rockBit()], ["pile", dumpPile(0)], ["pile", dumpPile(1)], ["pile", dumpPile(2)]], "tools/make_phoenix_sprites.mjs"),
  phoenixScene: sheet(OUT, "phoenix-scene", [["wide", wideScene()]], "tools/make_phoenix_sprites.mjs"),
  phoenixCompare: sheet(OUT, "phoenix-compare", [["earlier", closeUp(false)], ["later", closeUp(true)]], "tools/make_phoenix_sprites.mjs"),
  phoenixBase: sheet(OUT, "phoenix-base", [["ground", trenchBase("ground")], ["soil", trenchBase("soil")], ["ice", trenchBase("ice")]], "tools/make_phoenix_sprites.mjs"),
};

// ---------- build the playable prototype: prototype/phoenix.html from phoenix.template.html ----------
function readSheet(name) {                       // a sheet written earlier by tools/make_sprites.mjs
  const data = JSON.parse(fs.readFileSync(path.join(OUT, name + ".json"), "utf8"));
  const f = data.frames[0].frame;
  return { src: "data:image/png;base64," + fs.readFileSync(path.join(OUT, name + ".png")).toString("base64"),
    fw: f.w, fh: f.h, tags: data.meta.frameTags, names: data.frames.map(x => x.label) };
}
const ASSETS = { ...sheets, curiosity: readSheet("curiosity"), curiosityAngled: readSheet("curiosity-angled"), oppy: readSheet("oppy"), oppyParts: readSheet("oppy-parts") };
delete ASSETS.phoenixCompare;
const tpl = path.join(ROOT, "prototype", "phoenix.template.html");
if (fs.existsSync(tpl)) {
  const html = fs.readFileSync(tpl, "utf8")
    .replace("__ASSETS__", () => JSON.stringify(ASSETS))
    .replace("__PAL__", () => JSON.stringify({ ...PAL, ...PH }))
    .replace("__CASES__", () => JSON.stringify(CASES));
  fs.writeFileSync(path.join(ROOT, "prototype", "phoenix.html"), html);
  console.log("built prototype/phoenix.html", Math.round(html.length / 1024), "KB");
}
export { sheets };
console.log("wrote", Object.keys(sheets).length, "Phoenix sheets to art/out");
