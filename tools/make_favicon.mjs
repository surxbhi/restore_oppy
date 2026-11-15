// The browser-tab icon: Curiosity's head with its big eyes, drawn in code in the game's pixel style.
// Usage: node tools/make_favicon.mjs   -> prototype/favicon-32.png, prototype/favicon-192.png (also the home-screen icon)
import fs from "node:fs";
import path from "node:path";
import { PAL, M, Img, chunkyRect, bigEyes, png } from "./pixel-art.mjs";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const im = new Img(32, 32);
im.rect(13, 25, 6, 6, M.bodyShade);                         // the mast below the head
chunkyRect(im, 1, 5, 30, 21, M.body, 3);                    // the camera head
for (let x = 4; x < 28; x++) im.set(x, 6, M.bodyHi);        // top shine
for (let x = 3; x < 29; x++) { im.set(x, 23, M.bodyShade); im.set(x, 24, M.bodyShade); }
bigEyes(im, 5, 8, 9, 13, 1, "", 0);                          // two big eyes, looking a little to the right
bigEyes(im, 18, 8, 9, 13, 1, "", 0);
im.set(27, 4, PAL.antennaTip); im.set(27, 3, PAL.antennaTip); im.set(27, 2, PAL.antennaTip);   // a tiny antenna with a pink tip
im.outline();

function scaled(src, k) { const o = new Img(src.w * k, src.h * k); for (let y = 0; y < o.h; y++) for (let x = 0; x < o.w; x++) o.p[y * o.w + x] = src.get(Math.floor(x / k), Math.floor(y / k)); return o; }
fs.writeFileSync(path.join(ROOT, "prototype/favicon-32.png"), png(im));
fs.writeFileSync(path.join(ROOT, "prototype/favicon-192.png"), png(scaled(im, 6)));
console.log("favicon: prototype/favicon-32.png, prototype/favicon-192.png");
