// Builds art/phoenix-sheet.html (the Phoenix art review page) from the sheets in art/out.
// Run after tools/make_phoenix_sprites.mjs:  node tools/build_phoenix_sheet.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "art", "out");
const names = ["phoenix-scene", "phoenix-lander", "phoenix-scoop", "phoenix-ice", "phoenix-bits", "phoenix-compare", "curiosity-angled"];
const SH = {};
for (const n of names) {
  const data = JSON.parse(fs.readFileSync(path.join(OUT, n + ".json"), "utf8"));
  SH[n] = { src: "data:image/png;base64," + fs.readFileSync(path.join(OUT, n + ".png")).toString("base64"), frames: data.frames.map(f => ({ label: f.label, ...f.frame })) };
}
const tpl = fs.readFileSync(path.join(ROOT, "art", "phoenix-sheet.template.html"), "utf8");
fs.writeFileSync(path.join(ROOT, "art", "phoenix-sheet.html"), tpl.replace("__SHEETS__", () => JSON.stringify(SH)));
console.log("wrote art/phoenix-sheet.html", Math.round(fs.statSync(path.join(ROOT, "art", "phoenix-sheet.html")).size / 1024), "KB");
