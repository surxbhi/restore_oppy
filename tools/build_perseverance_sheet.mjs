// Builds art/perseverance-sheet.html (the art review page for Perseverance's parachute chapter)
// from the sheets in art/out. Run after tools/make_perseverance_sprites.mjs:
//   node tools/build_perseverance_sheet.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "art", "out");
const names = { chute: "perse-chute", canopy: "perse-canopy", backshell: "perse-backshell", rover: "perse-rover", curiosity: "curiosity-full" };
const SH = {};
for (const [k, n] of Object.entries(names)) {
  const data = JSON.parse(fs.readFileSync(path.join(OUT, n + ".json"), "utf8"));
  SH[k] = { src: "data:image/png;base64," + fs.readFileSync(path.join(OUT, n + ".png")).toString("base64"), frames: data.frames.map(f => ({ label: f.label, ...f.frame })) };
}
const tpl = fs.readFileSync(path.join(ROOT, "art", "perseverance-sheet.template.html"), "utf8");
fs.writeFileSync(path.join(ROOT, "art", "perseverance-sheet.html"), tpl.replace("__SHEETS__", () => JSON.stringify(SH)));
console.log("wrote art/perseverance-sheet.html", Math.round(fs.statSync(path.join(ROOT, "art", "perseverance-sheet.html")).size / 1024), "KB");
