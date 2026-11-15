// Lists the voice recordings in prototype/audio/ for the games: rewrites prototype/audio/manifest.js.
// Run after adding, renaming or removing a recording:   node tools/build_audio_manifest.mjs
// A recording is named <line ID>.<ext>, e.g. td.open.010.mp3 or story.sojourner.1.m4a (IDs: prototype/script/*.script.js).
// If one ID has several files (td.open.010.mp3 and td.open.010.wav), the first in EXTS wins and the others are reported.
// It also remembers WHAT each recording says: window.AUDIO_TEXT[id] = { file, text, mtime } = the line's words (from the
// script files, or storytimes/stories.js for story lines) when the file was first listed, and the file's modified time.
// Earlier records are kept on every run, so tools/export_script.mjs can mark a line whose words changed since it was recorded
// "OUT OF DATE". A replaced file (newer modified time, or another file name) gets a fresh record. voice.js reads only
// window.AUDIO_MANIFEST; window.AUDIO_TEXT is for the tools.
// No dependencies. Exit 0; it only warns (unknown IDs are checked by tools/export_script.mjs).
// OPPY_ROOT=/some/copy runs it on a copy of the project (for testing).
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ROOT = process.env.OPPY_ROOT ? path.resolve(process.env.OPPY_ROOT) : path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIR = path.join(ROOT, "prototype", "audio");
const EXTS = ["mp3", "m4a", "aac", "ogg", "oga", "opus", "webm", "wav"];   // all play in Chrome; Safari: not ogg/oga/opus/webm
const ID = /^(?:[a-z]+\.[a-z][a-z0-9]*\.\d+|story\.[a-z][a-z0-9-]*\.\d+(?:\.\d+)?)$/;
// An energy-level version of a line, <line id>.s1 to .s5 (Oppy grows stronger with each part: voice.js picks one).
const VARIANT = /\.s[1-5]$/;

fs.mkdirSync(DIR, { recursive: true });
const found = {}, warn = [];
for (const f of fs.readdirSync(DIR).sort()) {
  const m = f.match(/^(.+)\.([A-Za-z0-9]+)$/);
  if (!m || f === "manifest.js" || f === "README.md" || f.startsWith(".")) continue;
  const [, id, ext] = m, e = ext.toLowerCase();
  if (!EXTS.includes(e)) { warn.push(`skipped ${f}: not a sound file the games play (${EXTS.join(", ")})`); continue; }
  if (!ID.test(id.replace(VARIANT, ""))) { warn.push(`skipped ${f}: "${id}" is not a line ID (like td.open.010 or story.sojourner.1)`); continue; }
  (found[id] = found[id] || []).push(f);
}
const manifest = {};
for (const id of Object.keys(found).sort()) {
  const files = found[id].sort((a, b) => EXTS.indexOf(a.split(".").pop().toLowerCase()) - EXTS.indexOf(b.split(".").pop().toLowerCase()));
  manifest[id] = files[0];
  if (files.length > 1) warn.push(`${id}: several files (${files.join(", ")}): using ${files[0]}`);
}
// ---- the words of every line now: voice.js + the script files + Person 1's stories (all read only) ----
const ctx = { console: { log() {}, warn() {}, error() {} } }; ctx.window = ctx;
const run = (file, name) => { try { vm.runInNewContext(fs.readFileSync(file, "utf8"), ctx, { filename: name }); return true; } catch (e) { warn.push(`${name} does not run (${e.message}): its lines get no recorded text`); return false; } };
run(path.join(ROOT, "prototype", "voice.js"), "voice.js");
const SDIR = path.join(ROOT, "prototype", "script");
if (fs.existsSync(SDIR)) for (const f of fs.readdirSync(SDIR).filter(f => f.endsWith(".script.js")).sort()) run(path.join(SDIR, f), f);
if (fs.existsSync(path.join(ROOT, "storytimes", "stories.js"))) run(path.join(ROOT, "storytimes", "stories.js"), "stories.js");
function textOf(id) {
  id = String(id).replace(VARIANT, "");
  const V = ctx.Voice; if (!V) return null;
  if (V.lines[id]) return V.lines[id].text;
  const m = id.match(/^story\.([a-z][a-z0-9-]*)\.(\d+)(?:\.(\d+))?$/); if (!m) return null;
  const i = +m[2] - 1;
  if (m[3]) { const s = V.storySentences(m[1], i)[+m[3] - 1]; return s ? s.text : null; }
  const part = ctx.restoreOppyStories?.[m[1]]?.lines?.[i]; return part == null ? null : String(part);
}

// ---- earlier records (kept), refreshed when the file was replaced ----
const old = { window: {} }; old.window = old;
try { vm.runInNewContext(fs.readFileSync(path.join(DIR, "manifest.js"), "utf8"), old); } catch {}
const before = old.AUDIO_TEXT || {}, texts = {};
let fresh = 0, kept = 0;
for (const id of Object.keys(manifest)) {
  const mtime = Math.round(fs.statSync(path.join(DIR, manifest[id])).mtimeMs), prev = before[id];
  if (prev && prev.file === manifest[id] && prev.mtime === mtime && prev.text != null) { texts[id] = prev; kept++; continue; }
  const text = textOf(id);
  if (text == null) warn.push(`${manifest[id]}: no line has the ID ${id}, so its words are not known (recorded text left empty)`);
  texts[id] = { file: manifest[id], text, mtime }; fresh++;
}
const body = Object.keys(manifest).map(id => `  ${JSON.stringify(id)}: ${JSON.stringify(manifest[id])},`).join("\n");
const tbody = Object.keys(texts).map(id => `  ${JSON.stringify(id)}: ${JSON.stringify(texts[id])},`).join("\n");
// Word start times saved by tools/elevenlabs_emotion.mjs (tools/align/<id>.json), for recordings made after them: the captions
// show each word exactly when it is spoken. Ignored when the recording is newer than its timing (it was made another way).
const ALIGN = path.join(ROOT, "tools", "align"), words = {};
for (const id of Object.keys(manifest)) {
  const af = path.join(ALIGN, id + ".json"); if (!fs.existsSync(af)) continue;
  try { const a = JSON.parse(fs.readFileSync(af, "utf8")); if (fs.statSync(af).mtimeMs + 5000 >= fs.statSync(path.join(DIR, manifest[id])).mtimeMs && Array.isArray(a.words) && a.words.length) words[id] = a.words; } catch {}
}
const wbody = Object.keys(words).map(id => `  ${JSON.stringify(id)}: ${JSON.stringify(words[id])},`).join("\n");
const out = `// GENERATED by tools/build_audio_manifest.mjs: do not edit. Re-run it after adding or removing a recording in this folder.
// Line ID -> recording file (in prototype/audio/). A line listed here plays its recording instead of the computer voice.
window.AUDIO_MANIFEST = {${body ? "\n" + body + "\n" : ""}};
// For the tools only (voice.js ignores it): the words each recording says (the line's text when the file was first listed)
// and the file's modified time. tools/export_script.mjs marks a line OUT OF DATE when its words have changed since.
window.AUDIO_TEXT = {${tbody ? "\n" + tbody + "\n" : ""}};
// When each word of a recording starts (seconds): voice.js shows each word of the caption at that moment.
window.AUDIO_WORDS = {${wbody ? "\n" + wbody + "\n" : ""}};
`;
fs.writeFileSync(path.join(DIR, "manifest.js"), out);
for (const w of warn) console.warn("warning: " + w);
console.log(`audio manifest: ${Object.keys(manifest).length} recording(s), ${Object.keys(words).length} with word timings (${fresh} new or replaced, ${kept} kept) -> prototype/audio/manifest.js`);
