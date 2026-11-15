// Builds art/ingenuity-sheet.html (a shareable model sheet for Ingenuity) from the sprite sheets in art/out.
// Run after tools/make_ingenuity_sprites.mjs:  node tools/build_ingenuity_sheet.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "art", "out");
const pick = { side: "ingenuity", front: "ingenuity-front", back: "ingenuity-back", turn: "ingenuity-turn", shadow: "ingenuity-shadow", tiles: "ingenuity-tiles", curiosity: "curiosity-full" };
const SH = {};
for (const [k, f] of Object.entries(pick)) {
  const meta = JSON.parse(fs.readFileSync(path.join(OUT, f + ".json"), "utf8")).meta;
  SH[k] = { src: "data:image/png;base64," + fs.readFileSync(path.join(OUT, f + ".png")).toString("base64"), tags: meta.frameTags, w: meta.size.w / JSON.parse(fs.readFileSync(path.join(OUT, f + ".json"), "utf8")).frames.length, h: meta.size.h };
}
SH.__palette = [["#d6deef", "body"], ["#a3aecb", "shade"], ["#6a5ae8", "solar panel"], ["#f2f5ff", "blade"], ["#c9f6ff", "rotor blur"], ["#ff7ad9", "hubs and feet"], ["#5c5f80", "legs"], ["#2a1f4a", "outline"], ["#e8643c", "Mars sand"]];
const tpl = fs.readFileSync(path.join(ROOT, "art", "ingenuity-sheet.template.html"), "utf8");
fs.writeFileSync(path.join(ROOT, "art", "ingenuity-sheet.html"), tpl.replace("__SHEETS__", () => JSON.stringify(SH)));
console.log("wrote art/ingenuity-sheet.html", Math.round(fs.statSync(path.join(ROOT, "art", "ingenuity-sheet.html")).size / 1024), "KB");
