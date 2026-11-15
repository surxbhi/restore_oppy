// Code-made pixel art for Perseverance's parachute chapter ("Secret in the Stripes").
// Run: node tools/make_perseverance_sprites.mjs        (then node tools/build_perseverance_sheet.mjs)
// Also builds prototype/secret-in-the-stripes.html from its template, with the art inlined.
// Writes art/out/perse-*.png + .json. Optional: ZOOM_DIR=/some/dir writes 8x copies to look at.
// Style rules: .claude/skills/restore-oppy-minigame/references/owner-decisions.md
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PAL, M, Img, chunkyRect, bigEyes, chunkyWheel, sheet } from "./pixel-art.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "art", "out");
const APP = "tools/make_perseverance_sprites.mjs";

// Colours for this chapter. Real canopy: white and international-orange gores (PIA24431).
export const P = {
  gore: "#ff8a3d", goreShade: "#d9622b", goreHi: "#ffb27a",           // international orange, neon
  cloth: "#f8f2e0", clothShade: "#d9d0b6",                              // white gores (warm, like the photo)
  gap: "#1a1330",                                                       // the gap between disk and band (sky shows through)
  vent: "#dfe2ea", startMark: "#1b1433",                                // pale centre vent (PIA24431), black start gore
  line: "#e8ecf6",                                                      // suspension lines
  shell: "#d6deef", shellShade: "#a3aecb", shellHi: "#ffffff",          // backshell (white)
  heat: "#9a5a7a", heatShade: "#6e3d5c",                                // heat shield
  rtg: "#7d86a8", rtgFin: "#646e93", glow: "#ffb36b", glowHi: "#ffe2b8", // MMRTG power at the back
  stripe: "#7ff7ff",                                                    // Perseverance's accent (Curiosity's is lime)
  dust: "#c24a2e",
};

function poly(im, pts, c) {                       // fill a polygon (even-odd)
  const ys = pts.map(p => p[1]), y0 = Math.floor(Math.min(...ys)), y1 = Math.ceil(Math.max(...ys));
  for (let y = y0; y <= y1; y++) for (let x = 0; x < im.w; x++) {
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i], [xj, yj] = pts[j];
      if ((yi > y + 0.5) !== (yj > y + 0.5) && x + 0.5 < (xj - xi) * (y + 0.5 - yi) / (yj - yi) + xi) inside = !inside;
    }
    if (inside) im.set(x, y, c);
  }
}
// Big eyes ringed in outline colour, so they read on white cloth as well as orange.
function ringedEye(im, x, y, w, h, look, mood) {
  if (mood !== "blink" && mood !== "happy") chunkyRect(im, x - 1, y - 1, w + 2, h + 2, PAL.outline, 1);
  bigEyes(im, x, y, w, h, look, mood, 0);
}
// A camera-lens eye (Curiosity's family look): dark lens, big pupil, white shine, cyan glint.
function lensEye(im, ex, ey, mood) {
  if (mood === "blink") { im.rect(ex - 3, ey + 1, 7, 1, PAL.pupil); return; }
  if (mood === "happy") { im.set(ex - 3, ey + 1, PAL.pupil); im.set(ex - 2, ey, PAL.pupil); im.rect(ex - 1, ey - 1, 3, 1, PAL.pupil); im.set(ex + 2, ey, PAL.pupil); im.set(ex + 3, ey + 1, PAL.pupil); return; }
  im.disc(ex, ey, 4, PAL.lens); im.disc(ex + 0.5, ey + 0.5, 2.4, PAL.pupil);
  im.rect(ex - 2, ey - 2, 2, 2, PAL.shine); im.set(ex + 2, ey + 2, PAL.neonCyan);
  if (mood === "worried") { im.rect(ex - 3, ey - 6, 3, 1, PAL.pupil); im.rect(ex + 1, ey - 6, 3, 1, PAL.pupil); }
}
function mouthAt(im, x, y, mouth) {
  if (mouth === "smile") { im.set(x, y, PAL.mouth); im.rect(x + 1, y + 1, 2, 1, PAL.mouth); im.set(x + 3, y, PAL.mouth); }
  if (mouth === "open" || mouth === "talk") { chunkyRect(im, x, y, 4, mouth === "open" ? 3 : 2, PAL.mouth, 0); if (mouth === "open") im.rect(x + 1, y + 2, 2, 1, PAL.tongue); }
  if (mouth === "wobble") for (let i = 0; i < 5; i++) im.set(x - 1 + i, y + (i % 2), PAL.mouth);
  if (mouth === "o") chunkyRect(im, x + 1, y, 3, 3, PAL.mouth, 1);
}

// ---------- Chute, the parachute: 64 x 64, side view, lines meet at the bottom centre ----------
// The canopy is its body, so the face sits on the canopy (never on the lines or the backshell).
// Disk-gap-band shape: a dome (disk), a thin gap, then the band round the rim. Gores show as
// vertical slices that narrow toward the edges; orange/white follows a bit pattern.
const SIDE_BITS = [1, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0, 1];
function canopy(im, cx, top, rx, ry, bandH, sway = 0) {
  const rim = top + ry;                                           // y of the disk's rim
  for (let y = top; y <= rim + bandH + 1; y++) for (let x = cx - rx - 2; x <= cx + rx + 2; x++) {
    let dx, half;
    if (y <= rim) { const t = (rim - y) / ry; half = rx * Math.sqrt(Math.max(0, 1 - t * t)); }
    else half = rx + (y - rim) * 0.35;                            // the band flares out a little
    dx = x - cx - sway * ((rim + bandH - y) / (ry + bandH));
    if (Math.abs(dx) > half) continue;
    const u = Math.asin(Math.max(-1, Math.min(1, dx / Math.max(1, half))));   // -pi/2..pi/2 across
    const g = Math.floor((u + Math.PI / 2) / Math.PI * 9.999);
    const band = y > rim + 1, gapRow = y === rim + 1 || y === rim;
    if (gapRow) { im.set(x, y, P.gap); continue; }
    const bit = SIDE_BITS[(g + (band ? 5 : 0)) % SIDE_BITS.length];
    const shade = u > 0.55;                                       // light from the top left
    im.set(x, y, bit ? (shade ? P.goreShade : P.gore) : (shade ? P.clothShade : P.cloth));
  }
  for (let i = 0; i < 4; i++) im.set(cx - rx * 0.55 + i, top + 3 + Math.floor(i / 2), P.goreHi);  // shine
  return rim + bandH + 1;                                         // bottom edge of the band
}
function lines(im, xs, y0, ax, ay) { for (const x of xs) im.line(Math.round(x), y0, ax, ay, P.line); }

function chute({ pose = "open", eyes = "open", mouth = "smile", bob = 0 } = {}) {
  const im = new Img(64, 64), ax = 32, ay = 63;
  if (pose === "packed") {                                        // folded in its bag, asleep
    chunkyRect(im, 22, 40, 20, 22, P.cloth, 3);
    im.rect(23, 41, 18, 2, P.shellHi);
    for (const y of [47, 53]) im.rect(22, y, 20, 2, P.gore);      // orange straps
    im.rect(38, 43, 3, 18, P.clothShade);
    im.outline();
    for (const ex of [26, 34]) im.rect(ex, 50, 4, 1, PAL.pupil); // sleeping eyes
    mouthAt(im, 30, 56, "smile");
    return im;
  }
  if (pose === "opening") {                                       // half-full, stretching open
    const bottom = canopy(im, ax, 12 + bob, 13, 22, 4);
    im.outline();
    lines(im, [20, 26, 32, 38, 44], bottom, ax, ay);
    ringedEye(im, 24, 20 + bob, 6, 8, 0, eyes === "open" ? "open" : eyes); ringedEye(im, 34, 20 + bob, 6, 8, 0, eyes === "open" ? "open" : eyes);
    mouthAt(im, 30, 31 + bob, "o");
    return im;
  }
  if (pose === "ground") {                                        // discarded: draped flat on the sand
    for (let y = 44; y < 62; y++) for (let x = 2; x < 62; x++) {
      const t = (x - 32) / 30, top = 44 + 10 * t * t + (x > 40 ? 3 : 0);
      if (y < top) continue;
      const g = Math.floor((x - 2) / 6), bit = SIDE_BITS[g % SIDE_BITS.length], shade = y > 57 || x > 50;
      im.set(x, y, bit ? (shade ? P.goreShade : P.gore) : (shade ? P.clothShade : P.cloth));
    }
    im.rect(4, 58, 56, 1, P.gap);                                 // the gap line, now a fold
    im.outline();
    for (let i = 0; i < 6; i++) im.line(60, 60, 63, 52 + i * 2, P.line);   // lines trail off to the right
    ringedEye(im, 22, 47, 6, 7, 1, eyes); ringedEye(im, 32, 47, 6, 7, 1, eyes);
    mouthAt(im, 28, 56, mouth);
    return im;
  }
  // open: the full dome
  const bottom = canopy(im, ax, 3 + bob, 27, 20, 6);
  im.outline();
  lines(im, [6, 15, 24, 32, 40, 49, 58], bottom, ax, ay);
  ringedEye(im, 20, 9 + bob, 8, 10, 0, eyes); ringedEye(im, 36, 9 + bob, 8, 10, 0, eyes);
  if (eyes !== "blink" && eyes !== "happy") { im.rect(17, 21 + bob, 3, 2, PAL.blush); im.rect(45, 21 + bob, 3, 2, PAL.blush); }
  mouthAt(im, 30, 22 + bob, mouth);
  return im;
}
const CHUTE_FRAMES = [
  ["packed", { pose: "packed" }],
  ["opening", { pose: "opening", eyes: "open" }],
  ["idle", {}], ["idle", { eyes: "blink" }],
  ["talk", { mouth: "talk" }], ["talk", { mouth: "open", bob: 1 }],
  ["happy", { eyes: "happy", mouth: "open" }], ["happy", { eyes: "happy", mouth: "open", bob: 1 }],
  ["worried", { eyes: "worried", mouth: "wobble" }],
  ["ground", { pose: "ground", eyes: "open", mouth: "smile" }],
];

// ---------- Canopy seen from below (the up-look camera's view): 128 x 128 ----------
// The REAL code: 7-digit binary per letter, A = 1 … Z = 26, numbers as themselves. Read from the
// innermost ring outward, clockwise; ring 1 starts right after a black gore, and each later ring
// starts where the word before ended (NASA parachute coding activity, p. 4). 80 gores
// [source]. Orange = 1 [source]. Filler gores (no code) are orange in the inner rings and white in
// the band, which matches the activity's Figure 2 by eye [source]; game version.
export const CODE = { rings: ["DARE", "MIGHTY", "THINGS"], outer: [34, 11, 58, "N", 118, 10, 31, "W"] };
export const GORES = 80;
const bits7 = n => n.toString(2).padStart(7, "0").split("").map(Number);
const letterBits = w => [...w].flatMap(c => bits7(c.charCodeAt(0) - 64));
export function codeRings() {                                    // per ring: array of 80 (1, 0, or -1 for the start mark)
  const rings = []; let pos = 1;                                  // gore 0 of ring 1 is the black start gore
  for (const w of CODE.rings) {
    const r = new Array(GORES).fill(2), b = letterBits(w);       // 2 = filler (drawn orange in the inner rings)
    b.forEach((v, i) => { r[(pos + i) % GORES] = v; });
    if (!rings.length) r[0] = -1;
    pos += b.length; rings.push(r);
  }
  const o = new Array(GORES).fill(0);
  CODE.outer.flatMap(v => typeof v === "number" ? bits7(v) : bits7(v.charCodeAt(0) - 64)).forEach((v, i) => { o[(pos + i) % GORES] = v; });
  rings.push(o);
  return rings;
}
function canopyBelow() {
  const S = 128, c = 63.5, im = new Img(S, S), rings = codeRings();
  const R = [5, 20, 34, 49, 53, 62];                              // vent | ring1 | ring2 | ring3 | gap | band (photo proportions)
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const dx = x - c, dy = y - c, r = Math.hypot(dx, dy);
    if (r > R[5]) continue;
    if (r < R[0]) { im.set(x, y, P.vent); continue; }
    if (r >= R[3] && r < R[4]) { im.set(x, y, P.gap); continue; }
    const ang = (Math.atan2(dx, -dy) + 2 * Math.PI) % (2 * Math.PI);      // 0 at the top, clockwise
    const g = Math.floor(ang / (2 * Math.PI) * GORES);
    const ring = r < R[1] ? 0 : r < R[2] ? 1 : r < R[3] ? 2 : 3;
    const v = rings[ring][g];
    const seam = ring === 3 && (ang / (2 * Math.PI) * GORES) % 1 < 0.14;     // gore seams on the band
    const shade = (r > R[4] + 8 && dx + dy > 30) || (r < R[3] && r > R[3] - 3 && dx + dy > 20); // shadow at the lower-right edges
    im.set(x, y, v === -1 ? P.startMark : v === 2 ? (shade ? P.goreShade : P.gore) : v ? (shade ? P.goreShade : P.gore) : (seam || shade) ? P.clothShade : P.cloth);
  }
  im.outline();
  return im;
}

// ---------- Backshell: 48 x 48. Falling (with heat shield, lines from the top) and discarded ----------
function backshell({ ground = false } = {}) {
  const im = new Img(48, 48);
  if (!ground) {
    poly(im, [[18, 6], [30, 6], [44, 34], [4, 34]], P.shell);      // the cone
    poly(im, [[30, 6], [44, 34], [36, 34], [27, 6]], P.shellShade);
    im.rect(19, 7, 8, 1, P.shellHi);
    for (const y of [16, 25]) im.rect(Math.round(15 - (y - 6) * 0.38), y, Math.round(18 + (y - 6) * 0.76), 1, P.shellShade);
    chunkyRect(im, 20, 2, 8, 5, P.shellShade, 1);                   // parachute mortar on top
    for (let x = 3; x < 45; x++) for (let y = 34; y < 44; y++) {    // heat shield: a wide shallow dish
      const t = (x - 23.5) / 21; if (y - 34 > 9 * (1 - t * t)) continue;
      im.set(x, y, y > 38 ? P.heatShade : P.heat);
    }
    im.outline();
    chunkyRect(im, 31, 9, 3, 3, PAL.lens, 0); im.set(32, 10, PAL.lensHi); // up-look camera (PIA24431)
    return im;
  }
  // on the ground: tipped on its side, open end to the left, half sunk in the sand, a bit crumpled
  poly(im, [[8, 18], [40, 30], [40, 41], [8, 47]], P.shell);      // cone lying on its side, tip to the right
  poly(im, [[8, 37], [40, 37], [40, 41], [8, 47]], P.shellShade);
  for (const x of [18, 29]) im.line(x, Math.round(22 + (x - 18) * 0.35), x, Math.round(44 - (x - 18) * 0.2), P.shellShade);  // panel rings
  for (let y = 18; y <= 47; y++) for (let x = 2; x <= 14; x++) {   // the open base: a rim with a dark hollow
    const e = ((x - 8) / 6) ** 2 + ((y - 32.5) / 14.5) ** 2;
    if (e <= 1) im.set(x, y, e < 0.55 ? P.gap : P.shellShade);
  }
  im.rect(22, 27, 5, 2, P.shellShade);                              // a dent
  im.outline();
  for (let x = 0; x < 48; x++) for (let y = 43 + (x % 5 === 0 ? 1 : 0); y < 48; y++) im.set(x, y, null);  // sunk into the sand
  for (let x = 1; x < 46; x++) im.set(x, 43 + (x % 5 === 0 ? 1 : 0), P.dust);
  return im;
}

// ---------- Perseverance, side view: 64 x 56 (Curiosity's box), facing right ----------
// Real features kept: car-sized like Curiosity; MMRTG power unit at the back (no solar panels);
// mast head with two Mastcam-Z cameras (its eyes) and SuperCam's big round window on top;
// a robotic arm with a big turret and coring drill at the front; six wheels on a rocker-bogie.
function perseverance({ eyes = "open", mouth = "smile", bob = 0, wheelPhase = 0 } = {}) {
  const im = new Img(64, 56), b = bob;
  // MMRTG at the back, tilted, with fins and a warm glow
  poly(im, [[2, 20 + b], [11, 24 + b], [11, 38 + b], [2, 36 + b]], P.rtg);
  for (let y = 22; y < 37; y += 3) im.rect(0, y + b, 2, 1, P.rtgFin);
  im.rect(5, 26 + b, 3, 7, P.glow); im.rect(6, 27 + b, 1, 5, P.glowHi);
  // wheels
  for (const x of [13, 32, 51]) chunkyWheel(im, x, 47, 6.5, wheelPhase);
  im.rect(13, 39, 38, 2, M.bodyShade);                                        // rocker bar
  // body
  chunkyRect(im, 10, 25 + b, 43, 15, M.body, 2);
  im.rect(12, 26 + b, 39, 1, M.bodyHi); im.rect(12, 36 + b, 39, 3, M.bodyShade);
  // deck: high-gain antenna (a hexagon) and a sample-tube bay
  chunkyRect(im, 15, 20 + b, 10, 5, M.hubDot, 2); im.rect(17, 20 + b, 6, 1, M.body);
  chunkyRect(im, 27, 22 + b, 8, 3, M.tool, 1);
  // mast and head
  im.rect(43, 13 + b, 4, 12, M.bodyShade); im.rect(43, 13 + b, 1, 12, M.bodyHi);
  chunkyRect(im, 33, 3 + b, 27, 13, M.body, 2); im.rect(35, 4 + b, 23, 1, M.bodyHi); im.rect(35, 13 + b, 23, 2, M.bodyShade);
  // SuperCam's round window, on top of the head
  chunkyRect(im, 41, 0 + b, 11, 4, M.bodyShade, 1);
  // arm folded at the front, with the turret (grey box) and coring drill (pink head)
  im.rect(53, 29 + b, 4, 3, M.tool); im.rect(56, 29 + b, 3, 9, M.tool);
  chunkyRect(im, 54, 36 + b, 9, 7, M.tool, 1);
  chunkyRect(im, 57, 43 + b, 4, 4, PAL.antennaTip, 1);
  im.outline();
  // after the outline: thin details
  im.rect(14, 31 + b, 36, 1, P.stripe);                                        // cyan stripe (Curiosity's is lime)
  im.disc(46.5, 1.5 + b, 1.6, PAL.lens); im.set(46, 1 + b, PAL.lensHi);        // SuperCam lens
  im.line(36, 41, 51, 41, PAL.leg); im.line(36, 41, 22, 41, PAL.leg);
  // face: Mastcam-Z's two cameras are its eyes
  for (const ex of [41, 52]) lensEye(im, ex, 8 + b, eyes);
  if (eyes !== "blink" && eyes !== "happy") { im.rect(36, 13 + b, 2, 1, PAL.blush); im.rect(57, 13 + b, 2, 1, PAL.blush); }
  mouthAt(im, 45, 13 + b, mouth === "talk" ? "talk" : mouth);
  return im;
}
const PERSE_FRAMES = [
  ["idle", { eyes: "open" }], ["idle", { eyes: "blink" }],
  ["talk", { mouth: "talk" }], ["talk", { mouth: "open" }],
  ["drive", { wheelPhase: 0 }], ["drive", { wheelPhase: 1, bob: 1 }],
  ["worried", { eyes: "worried", mouth: "wobble" }], ["worried", { eyes: "worried", mouth: "wobble", bob: 1 }],
  ["happy", { eyes: "happy", mouth: "open", bob: 1 }], ["happy", { eyes: "happy", mouth: "open" }],
];

const sheets = {
  chute: sheet(OUT, "perse-chute", CHUTE_FRAMES.map(([l, o]) => [l, chute(o)]), APP),
  canopy: sheet(OUT, "perse-canopy", [["below", canopyBelow()]], APP),
  backshell: sheet(OUT, "perse-backshell", [["falling", backshell()], ["ground", backshell({ ground: true })]], APP),
  rover: sheet(OUT, "perse-rover", PERSE_FRAMES.map(([l, o]) => [l, perseverance(o)]), APP),
};
// ---------- build the prototype page ----------
// Curiosity and Oppy come from Track Detective's sheets in art/out (drawn by tools/make_sprites.mjs).
function fromOut(name) {
  const d = JSON.parse(fs.readFileSync(path.join(OUT, name + ".json"), "utf8"));
  return { src: "data:image/png;base64," + fs.readFileSync(path.join(OUT, name + ".png")).toString("base64"),
    fw: d.frames[0].frame.w, fh: d.frames[0].frame.h, tags: d.meta.frameTags, names: d.frames.map(f => f.label) };
}
const ASSETS = { ...sheets, curiosity: fromOut("curiosity"), curiosityFull: fromOut("curiosity-full"), oppy: fromOut("oppy"), oppyWheel: fromOut("oppy-wheel"), oppyParts: fromOut("oppy-parts") };
const tplPath = path.join(ROOT, "prototype", "secret-in-the-stripes.template.html");
if (fs.existsSync(tplPath)) {
  const html = fs.readFileSync(tplPath, "utf8")
    .replace("__ASSETS__", () => JSON.stringify(ASSETS)).replace("__PAL__", () => JSON.stringify(PAL)).replace("__P__", () => JSON.stringify(P));
  fs.writeFileSync(path.join(ROOT, "prototype", "secret-in-the-stripes.html"), html);
  console.log("wrote prototype/secret-in-the-stripes.html", Math.round(html.length / 1024), "KB");
}
console.log("wrote", Object.entries(sheets).map(([k, s]) => `${k} ${s.fw}x${s.fh}x${s.names.length}`).join(", "));
