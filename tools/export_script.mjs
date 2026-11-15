// The whole game's spoken script as one document, for the voice-over person, and a check of the script files.
// Run:  node tools/export_script.mjs
// Reads prototype/script/*.script.js, storytimes/stories.js (read only: Person 1's story lines), prototype/audio/manifest.js
// and the page templates (prototype/*.template.html). Writes prototype/script/SCRIPT.md (tables by page and scene) and
// prototype/script/script.csv (the same rows, for a spreadsheet). Uses voice.js itself to split story parts into sentences.
// Errors (exit 1): a script file that does not run, a bad or duplicate ID, an ID with the wrong page prefix, a speaker with no
// SPEAKER line, an ID a template uses that no script file has, a LINE()/TEXT() call that leaves a placeholder unfilled.
// Warnings: a script ID no template uses, a recording for an unknown ID, a recording that cannot play (placeholders), a
// manifest that does not match the audio folder, a page with story time but no STORY line, and a recording that is OUT OF
// DATE: the line's words now differ from the words it had when the recording was listed (window.AUDIO_TEXT, written by
// tools/build_audio_manifest.mjs). OUT OF DATE lines are marked in SCRIPT.md and script.csv with the old and the new words.
// OPPY_ROOT=/some/copy runs it on a copy of the project (for testing).
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ROOT = process.env.OPPY_ROOT ? path.resolve(process.env.OPPY_ROOT) : path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const P = (...a) => path.join(ROOT, ...a);
const rel = f => path.relative(ROOT, f);
const PAGES = {                                    // page (file name) -> ID prefix and title
  "track-detective": ["td", "Track Detective (Sojourner)"],
  "phoenix": ["phx", "Phoenix: The Clue That Vanished"],
  "ingenuity-flight-plan": ["ing", "Ingenuity Flight Plan"],
  "secret-in-the-stripes": ["pc", "Secret in the Stripes (parachute)"],
  "insight": ["ins", "InSight: When Mars Whispered"],
  "restore-oppy": ["shell", "Restore Oppy (the shell: map, intro, finale)"],
};
const PREFIXES = Object.values(PAGES).map(p => p[0]);
const ID_RE = new RegExp(`^(${PREFIXES.join("|")})\\.([a-z][a-z0-9]*)\\.(\\d{3})$`);
const PH = /\{([A-Za-z_]\w*)\}/g;
const errors = [], warnings = [];
const err = m => errors.push(m), warn = m => warnings.push(m);

// ---- voice.js, for its sentence splitter (the same numbering as the game) ----
const vctx = { console }; vctx.window = vctx;
vm.runInNewContext(fs.readFileSync(P("prototype", "voice.js"), "utf8"), vctx, { filename: "voice.js" });
const sentences = vctx.Voice.sentences;

// ---- script files ----
const SDIR = P("prototype", "script");
const lines = [], byId = new Map(), speakers = {}, stories = {}, broken = new Set();   // broken: prefixes of files that did not run
const files = fs.existsSync(SDIR) ? fs.readdirSync(SDIR).filter(f => f.endsWith(".script.js")).sort() : [];
for (const f of files) {
  const page = f.replace(/\.script\.js$/, ""), file = path.join(SDIR, f), src = fs.readFileSync(file, "utf8");
  if (!PAGES[page]) { err(`${rel(file)}: unknown page "${page}" (expected one of ${Object.keys(PAGES).join(", ")})`); continue; }
  const prefix = PAGES[page][0], sp = speakers[page] = {}, st = stories[page] = [];
  const lineNo = () => { const m = /\.script\.js:(\d+)/.exec(new Error().stack); return m ? +m[1] : 0; };
  let scene = "";
  const ctx = {
    SPEAKER: (key, name, o = {}) => { sp[key] = { key, name, pitch: o.pitch, rate: o.rate }; },
    STORY: (storyId, who, mode = "parts") => { st.push({ storyId, who, mode, at: lineNo() }); },
    SCRIPT: (id, who, text, o = {}) => {
      const at = lineNo(), where = `${rel(file)}:${at}`;
      if (typeof id !== "string" || !ID_RE.test(id)) { err(`${where}: bad ID ${JSON.stringify(id)} (like ${prefix}.scene.010)`); return; }
      if (!id.startsWith(prefix + ".")) err(`${where}: ${id} is in the ${page} script but does not start with "${prefix}."`);
      if (typeof text !== "string" || !text.trim()) err(`${where}: ${id} has no words`);
      if (byId.has(id)) { err(`${where}: duplicate ID ${id} (also ${byId.get(id).where})`); return; }
      const ln = { page, id, who, text: String(text), scene: id.split(".")[1], where, static: !!(o && o.static), story: false, ord: at };
      lines.push(ln); byId.set(id, ln);
    },
  };
  ctx.window = ctx;
  try { vm.runInNewContext(src, ctx, { filename: f }); }
  catch (e) {
    const m = /\.script\.js:(\d+)/.exec(e.stack || "");
    err(`${rel(file)}${m ? ":" + m[1] : ""}: the file does not run: ${e.message} (a missing quote or comma?)`); broken.add(prefix);
  }
  for (const ln of lines.filter(l => l.page === page)) if (!sp[ln.who]) err(`${ln.where}: ${ln.id} speaker "${ln.who}" has no SPEAKER(...) line in this file`);
  for (const s of st) if (!sp[s.who]) err(`${rel(file)}:${s.at}: STORY ${s.storyId} speaker "${s.who}" has no SPEAKER(...) line in this file`);
}

// ---- Person 1's stories (read only) ----
const sctx = {}; sctx.window = sctx;
try { vm.runInNewContext(fs.readFileSync(P("storytimes", "stories.js"), "utf8"), sctx, { filename: "stories.js" }); }
catch (e) { err(`storytimes/stories.js does not run: ${e.message}`); }
const STORIES = sctx.restoreOppyStories || {};
const storyLines = [];
for (const [page, list] of Object.entries(stories)) for (const s of list) {
  const story = STORIES[s.storyId];
  if (!story) { err(`${page}.script.js:${s.at}: STORY "${s.storyId}" is not in storytimes/stories.js`); continue; }
  story.lines.forEach((t, i) => {
    const base = { page, who: s.who, scene: "story", story: true, where: "storytimes/stories.js", ord: s.at + i / 100 };
    if (s.mode === "sentences") sentences(t).forEach((x, k) => storyLines.push({ ...base, id: `story.${s.storyId}.${i + 1}.${k + 1}`, text: x }));
    else storyLines.push({ ...base, id: `story.${s.storyId}.${i + 1}`, text: t });
  });
}
for (const ln of storyLines) { if (byId.has(ln.id)) err(`${ln.id}: story line read by two pages (${byId.get(ln.id).page}, ${ln.page})`); else byId.set(ln.id, ln); }

// ---- the audio manifest and folder ----
const actx = {}; actx.window = actx;
const MAN = P("prototype", "audio", "manifest.js");
if (fs.existsSync(MAN)) { try { vm.runInNewContext(fs.readFileSync(MAN, "utf8"), actx); } catch (e) { err(`prototype/audio/manifest.js does not run: ${e.message}`); } }
else warn("prototype/audio/manifest.js is missing: run node tools/build_audio_manifest.mjs");
const manifest = actx.AUDIO_MANIFEST || {};
const onDisk = fs.existsSync(P("prototype", "audio")) ? fs.readdirSync(P("prototype", "audio")).filter(f => !/^(manifest\.js|README\.md|\..*)$/.test(f)) : [];
if (Object.values(manifest).some(f => !onDisk.includes(f)) || onDisk.some(f => /\.(mp3|m4a|aac|ogg|oga|opus|webm|wav)$/i.test(f) && !Object.values(manifest).includes(f)))
  warn("the audio manifest does not match prototype/audio/: run node tools/build_audio_manifest.mjs");
for (const id of Object.keys(manifest)) {
  const ln = byId.get(id.replace(/\.s[1-5]$/, ""));   // <line id>.s1 to .s5: Oppy's energy-level versions of a line
  if (!ln) warn(`recording ${manifest[id]}: no line has the ID ${id}`);
  else if (!ln.story && PH.test(ln.text) && !ln.static) warn(`recording ${manifest[id]}: ${id} has placeholders and is not static, so the computer voice says it`);
  PH.lastIndex = 0;
}
// ---- recordings whose line has new words since they were recorded ----
const audioText = actx.AUDIO_TEXT || {}, stale = new Map();   // id -> the words the recording says
let unknownText = 0;
for (const id of Object.keys(manifest)) {
  const ln = byId.get(id), rec = audioText[id];
  if (!ln) continue;
  if (!rec || rec.file !== manifest[id] || rec.text == null) { unknownText++; continue; }
  // same spoken words = not out of date: accents, curly quotes and spacing do not change how a line sounds (Havard / Håvard)
  const said = t => String(t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[\u2018\u2019]/g, "'").replace(/[\u201c\u201d]/g, '"').replace(/\s+/g, " ").trim();
  if (said(rec.text) !== said(ln.text)) stale.set(id, rec.text);
}
if (unknownText) warn(`${unknownText} recording(s) have no recorded words yet, so they cannot be checked: run node tools/build_audio_manifest.mjs`);
for (const [id, was] of stale) warn(`OUT OF DATE: ${manifest[id]}: the words of ${id} changed since it was recorded. Recorded: "${was}" Now: "${byId.get(id).text}"`);

// ---- templates: the IDs they use, and the placeholders they fill ----
const used = new Map();                            // id -> [where]
const TPL = fs.readdirSync(P("prototype")).filter(f => f.endsWith(".template.html")).sort();
const LIT = new RegExp(`["'\`]((?:${PREFIXES.join("|")})\\.[A-Za-z0-9_-]+\\.[0-9A-Za-z_-]+)["'\`]`, "g");
const CALL = /\b(LINE|TEXT)\(\s*(["'`])([^"'`]*)\2\s*(?:,\s*(\{[^}]*\}|[^)\s][^)]*))?\)/g;
for (const f of TPL) {
  const src = fs.readFileSync(P("prototype", f), "utf8"), lineAt = i => src.slice(0, i).split("\n").length;
  for (const m of src.matchAll(LIT)) {
    const id = m[1], where = `prototype/${f}:${lineAt(m.index)}`;
    (used.get(id) || used.set(id, []).get(id)).push(where);
    if (!byId.has(id) && !broken.has(id.split(".")[0])) err(`${where}: ${id} is used but no script file has it`);
  }
  for (const m of src.matchAll(CALL)) {
    const [, fn, , id, args] = m, ln = byId.get(id), where = `prototype/${f}:${lineAt(m.index)}`;
    if (!ln) { if (!ID_RE.test(id)) err(`${where}: ${fn}("${id}"): not a script ID`); continue; }
    const need = [...ln.text.matchAll(PH)].map(x => x[1]);
    if (!need.length) continue;
    if (!args) { err(`${where}: ${fn}("${id}") leaves {${need.join("}, {")}} unfilled: pass ${fn}("${id}", { ${need.join(", ")} })`); continue; }
    if (!args.trim().startsWith("{")) continue;    // vars from a variable: cannot check here
    const keys = new Set([...args.matchAll(/([A-Za-z_]\w*)\s*(?=[:,}])/g)].map(x => x[1]));
    for (const k of need) if (!keys.has(k)) err(`${where}: ${fn}("${id}", ...) does not supply {${k}}`);
  }
  const page = f.replace(/\.template\.html$/, "");
  if (/restoreOppyStories/.test(src) && PAGES[page] && files.includes(page + ".script.js") && !(stories[page] || []).length)
    warn(`prototype/${f} has story time but ${page}.script.js has no STORY(...) line`);
}
for (const ln of lines) {
  if (!used.has(ln.id) && files.length) {
    const tpl = P("prototype", ln.page + ".template.html");
    if (fs.existsSync(tpl)) warn(`${ln.where}: ${ln.id} is never used in prototype/${ln.page}.template.html`);
  }
}

// ---- write SCRIPT.md and script.csv ----
const words = t => (String(t).match(/[\p{L}\p{N}][\p{L}\p{N}'’.,-]*/gu) || []).length;
const all = [...lines, ...storyLines].sort((a, b) => a.ord - b.ord);   // in the order of the script file (STORY where it stands)
const md = [], csv = [["page", "scene", "id", "speaker", "line", "words", "audio_file", "recorded", "recorded_words_if_out_of_date"]];
const esc = t => String(t).replace(/\|/g, "\\|").replace(/\n/g, " ");
const q = v => /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v);
let total = 0, totalW = 0, totalR = 0;
md.push("# Restore Oppy: the spoken script", "",
  "GENERATED by `node tools/export_script.mjs`: do not edit this file (your changes would be lost). It lists every line the game says.", "",
  "## How to use this", "",
  "- **Change the words** of a line in its page's script file, `prototype/script/<page>.script.js`: find the line by its ID and edit",
  "  only the words in the last quotes, e.g. `SCRIPT(\"td.open.020\", \"curiosity\", \"Who made them? Let's follow them!\");`. Keep the ID",
  "  and the speaker. Story-time lines (IDs `story.…`) belong to Person 1: their words are in `storytimes/stories.js`; ask Person 1.",
  "- **Record** one file per line, named after the ID: `<ID>.mp3` (the *Audio file* column), e.g. `td.open.010.mp3`, and drop it in",
  "  `prototype/audio/`. Mono, 44.1 kHz, silence trimmed, the same loudness for all (see `prototype/audio/README.md`).",
  "  `{name}` = a word the game fills in: the computer voice says those lines (unless marked *static*); skip them.",
  "- **Then run** these two commands from the project's top folder, and reload the game:",
  "  `node tools/build_audio_manifest.mjs` (the game starts playing the new files) and `node tools/export_script.mjs` (updates this file).",
  "- **OUT OF DATE** in the *Recorded* column: the line's words were changed after it was recorded, so the recording no longer says",
  "  what the caption shows. The row shows the words now and the words recorded. Record it again (same file name) and run the two",
  "  commands; or change the words back.", "");
const head = md.length;
const summary = [];
for (const [page, [prefix, title]] of Object.entries(PAGES)) {
  const mine = all.filter(l => l.page === page);
  if (!mine.length) { summary.push(`${page}: no script file yet`); continue; }
  const w = mine.reduce((a, l) => a + words(l.text), 0), r = mine.filter(l => manifest[l.id]).length;
  total += mine.length; totalW += w; totalR += r;
  summary.push(`${page}: ${mine.length} lines (${mine.filter(l => !l.story).length} script + ${mine.filter(l => l.story).length} story), ${w} words, ${r} recorded`);
  md.push(`## ${title}`, "", `Page \`${page}\`, IDs \`${prefix}.*\`: **${mine.length} lines**, ${w} words, ${r} recorded.`, "");
  const scenes = [...new Set(mine.map(l => l.scene))];
  for (const sc of scenes) {
    const rows = mine.filter(l => l.scene === sc);
    md.push(`### ${sc === "story" ? "story (Person 1's words, storytimes/stories.js)" : sc} (${rows.length} lines, ${rows.reduce((a, l) => a + words(l.text), 0)} words)`, "",
      "| ID | Speaker | Line | Words | Audio file | Recorded |", "|---|---|---|---|---|---|");
    for (const l of rows) {
      const name = (speakers[page] || {})[l.who]?.name || l.who, file = manifest[l.id] || l.id + ".mp3", was = stale.get(l.id);
      const rec = was != null ? "OUT OF DATE" : manifest[l.id] ? "yes" : "no";
      const cell = was != null ? `**Now:** ${esc(l.text)}<br>**Recorded:** ${esc(was)}` : esc(l.text);
      md.push(`| \`${l.id}\` | ${esc(name)} | ${cell}${l.static ? " *(static)*" : ""} | ${words(l.text)} | ${file} | ${was != null ? "**OUT OF DATE**" : rec} |`);
      csv.push([page, sc, l.id, name, l.text, words(l.text), file, rec, was ?? ""]);
    }
    md.push("");
  }
}
md.splice(head, 0, `**${total} lines, ${totalW} words, ${totalR} recorded, ${stale.size} OUT OF DATE.**`, "",
  ...(stale.size ? ["OUT OF DATE (record again): " + [...stale.keys()].map(id => "`" + id + "`").join(", "), ""] : []));
fs.writeFileSync(path.join(SDIR, "SCRIPT.md"), md.join("\n"));
fs.writeFileSync(path.join(SDIR, "script.csv"), csv.map(r => r.map(q).join(",")).join("\n") + "\n");

for (const s of summary) console.log(s);
console.log(`total: ${total} lines, ${totalW} words, ${totalR} recorded, ${stale.size} OUT OF DATE -> prototype/script/SCRIPT.md, prototype/script/script.csv`);
for (const w of warnings) console.warn("warning: " + w);
for (const e of errors) console.error("ERROR: " + e);
console.log(`${errors.length} error(s), ${warnings.length} warning(s)`);
process.exit(errors.length ? 1 : 0);
