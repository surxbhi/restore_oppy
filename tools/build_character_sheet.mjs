// Builds art/character-sheet.html (a shareable model sheet for Sojourner) from the sprite sheets in art/out.
// Run after tools/make_sprites.mjs:  node tools/build_character_sheet.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "art", "out");
const pick = { sojourner: "sojourner", front: "sojourner-front", back: "sojourner-back", curiosity: "curiosity-full", oppy: "oppy", oppyWheel: "oppy-wheel", tiles: "tiles" };
const SH = {};
for (const [k, f] of Object.entries(pick)) {
  const meta = JSON.parse(fs.readFileSync(path.join(OUT, f + ".json"), "utf8")).meta;
  SH[k] = { src: "data:image/png;base64," + fs.readFileSync(path.join(OUT, f + ".png")).toString("base64"), tags: meta.frameTags };
}
SH.__palette = [["#d6deef", "body"], ["#a3aecb", "shade"], ["#6a5ae8", "panel"], ["#a89cff", "panel light"], ["#46496e", "wheel"], ["#ff7ad9", "antenna"], ["#2a1f4a", "outline"], ["#e8643c", "Mars sand"]];
const tpl = fs.readFileSync(path.join(ROOT, "art", "character-sheet.template.html"), "utf8");
fs.writeFileSync(path.join(ROOT, "art", "character-sheet.html"), tpl.replace("__SHEETS__", () => JSON.stringify(SH)));
console.log("wrote art/character-sheet.html", Math.round(fs.statSync(path.join(ROOT, "art", "character-sheet.html")).size / 1024), "KB");
