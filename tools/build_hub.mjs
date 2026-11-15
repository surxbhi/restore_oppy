// Builds prototype/restore-oppy.html (the game shell: intro, Mars map, missions, assembly, Oppy's story)
// from prototype/restore-oppy.template.html and the sheets already in art/out.
// Run after tools/make_sprites.mjs (it writes oppy-parts too), make_phoenix_sprites.mjs, make_ingenuity_sprites.mjs and make_perseverance_sprites.mjs:  node tools/build_hub.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PAL } from "./pixel-art.mjs";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "art", "out");
function readSheet(name) {
  const data = JSON.parse(fs.readFileSync(path.join(OUT, name + ".json"), "utf8"));
  const f = data.frames[0].frame;
  return { src: "data:image/png;base64," + fs.readFileSync(path.join(OUT, name + ".png")).toString("base64"),
    fw: f.w, fh: f.h, tags: data.meta.frameTags, names: data.frames.map(x => x.label) };
}
const ASSETS = {
  curiosity: readSheet("curiosity"), curiosityFull: readSheet("curiosity-full"),
  oppy: readSheet("oppy"), oppyParts: readSheet("oppy-parts"),
  sojourner: readSheet("sojourner"), phoenixScoop: readSheet("phoenix-scoop"), phoenixLander: readSheet("phoenix-lander"), ingenuity: readSheet("ingenuity"), chute: readSheet("perse-chute"),
};
const html = fs.readFileSync(path.join(ROOT, "prototype", "restore-oppy.template.html"), "utf8")
  .replace("__ASSETS__", () => JSON.stringify(ASSETS))
  .replace("__PAL__", () => JSON.stringify(PAL));
fs.writeFileSync(path.join(ROOT, "prototype", "restore-oppy.html"), html);
console.log("built prototype/restore-oppy.html", Math.round(html.length / 1024), "KB");
