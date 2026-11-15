// Record lines with ElevenLabs v3 using the emotion tags in tools/tags/<page>.json, and save each word's start time
// so the captions show every word exactly as it is spoken.
//
// Usage:
//   node tools/elevenlabs_emotion.mjs --sample          two lines per page, to listen to first (written to tools/sample/)
//   node tools/elevenlabs_emotion.mjs --all             every tagged line (into prototype/audio/)
//   node tools/elevenlabs_emotion.mjs --resume          only the tagged lines not recorded this way yet
//   node tools/elevenlabs_emotion.mjs id1 id2 ...       just these lines
//   add --dry to list what would be sent, without calling ElevenLabs
// Then run: node tools/build_audio_manifest.mjs   (it packs the word times into prototype/audio/manifest.js)
//
// Key: ELEVENLABS_API_KEY in the environment or in .env (never printed). Voices and model: tools/elevenlabs_voices.json.
// Word times go to tools/align/<line id>.json: { "text": the words read, "words": [start seconds of each word] }.
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const args = process.argv.slice(2), dry = args.includes("--dry"), sample = args.includes("--sample");
const env = [".env", ".env.local"].map(f => path.join(ROOT, f)).filter(f => fs.existsSync(f)).map(f => fs.readFileSync(f, "utf8")).join("\n");
const KEY = (process.env.ELEVENLABS_API_KEY || (env.match(/^\s*ELEVENLABS_API_KEY\s*=\s*["']?([^"'\r\n]+)/m) || [])[1] || "").trim();
if (!KEY && !dry) { console.error("No ELEVENLABS_API_KEY found (environment or .env)."); process.exit(1); }
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, "tools/elevenlabs_voices.json"), "utf8"));

// every spoken line: script files + Person 1's stories (the same IDs voice.js uses)
const lines = new Map(), order = [];
const add = (id, who, text, page) => { if (!lines.has(id)) order.push(id); lines.set(id, { who, text, page }); };
const sctx = { window: {} }; vm.createContext(sctx); vm.runInContext(fs.readFileSync(path.join(ROOT, "storytimes/stories.js"), "utf8"), sctx);
const sentences = t => String(t).split(/(?<=[.!?…]["'”’)\]]*)\s+/).map(x => x.trim()).filter(Boolean);
for (const f of fs.readdirSync(path.join(ROOT, "prototype/script")).filter(f => f.endsWith(".script.js")).sort()) {
  const page = f.replace(".script.js", ""), stories = [];
  const ctx = { SCRIPT: (id, who, text) => add(id, who, text, page), SPEAKER() {}, NOTE() {}, STORY: (s, who, mode) => stories.push({ s, who, mode }), window: {} };
  vm.createContext(ctx); vm.runInContext(fs.readFileSync(path.join(ROOT, "prototype/script", f), "utf8"), ctx);
  for (const { s, who, mode } of stories) {
    const st = (sctx.window.restoreOppyStories || {})[s]; if (!st) continue;
    st.lines.forEach((ln, i) => mode === "sentences" ? sentences(ln).forEach((x, k) => add(`story.${s}.${i + 1}.${k + 1}`, who, x, page)) : add(`story.${s}.${i + 1}`, who, ln, page));
  }
}
const tags = {};
for (const f of fs.readdirSync(path.join(ROOT, "tools/tags")).filter(f => f.endsWith(".json"))) Object.assign(tags, JSON.parse(fs.readFileSync(path.join(ROOT, "tools/tags", f), "utf8")));

let ids = args.filter(a => !a.startsWith("--"));
if (args.includes("--all")) ids = order.filter(id => tags[id]);
// --resume: skip lines already recorded this way (they have word timings), e.g. after the account ran out of credit
if (args.includes("--resume")) ids = order.filter(id => tags[id] && !fs.existsSync(path.join(ROOT, "tools/align", id + ".json")));
if (sample) { const per = {}; ids = order.filter(id => tags[id] && (per[lines.get(id).page] = (per[lines.get(id).page] || 0) + 1) <= 2); }
if (!ids.length) { console.error("Nothing to record: pass line IDs, --sample or --all."); process.exit(1); }

const SAY = t => t.replace(/(\d)-(\d) meters/g, "$1 to $2 meters");      // how the voice reads a few things (the screen keeps the text)
const outDir = sample ? path.join(ROOT, "tools/sample") : path.join(ROOT, "prototype/audio");
fs.mkdirSync(outDir, { recursive: true }); fs.mkdirSync(path.join(ROOT, "tools/align"), { recursive: true });

let ok = 0, failed = 0, chars = 0;
for (const id of ids) {
  const ln = lines.get(id);
  if (!ln) { console.error(`? ${id}: no such line`); failed++; continue; }
  if (/\{\w+\}/.test(ln.text)) { console.error(`- ${id}: has a {placeholder}, the computer voice reads it`); continue; }
  const voice = cfg.voices[ln.who];
  if (!voice) { console.error(`? ${id}: no voice for "${ln.who}"`); failed++; continue; }
  const spoken = SAY(ln.text), prefix = tags[id] ? tags[id].trim() + " " : "", text = prefix + spoken;
  chars += text.length;
  if (dry) { console.log(`${id} (${ln.who}): ${text}`); continue; }
  let j = null;
  for (let attempt = 1; attempt <= 3 && !j; attempt++) {
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}/with-timestamps?output_format=mp3_44100_128`, {
      method: "POST", headers: { "xi-api-key": KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ text, model_id: cfg.model || "eleven_v3", voice_settings: cfg.settings || { stability: 0.5 } }) });
    if (r.ok) j = await r.json();
    else { const msg = (await r.text()).slice(0, 160); console.error(`x ${id}: ${r.status} ${msg}${attempt < 3 ? " (retrying)" : ""}`); if (/quota_exceeded/.test(msg)) { console.error("The ElevenLabs account is out of credit: stopping. Run again with --resume when there is more."); process.exit(2); }
      if (r.status === 401 || r.status === 400) break; await new Promise(res => setTimeout(res, 2000 * attempt)); }
  }
  if (!j) { failed++; continue; }
  fs.writeFileSync(path.join(outDir, id + ".mp3"), Buffer.from(j.audio_base64, "base64"));
  // each spoken word's start: the time of its first character (the tags at the front are skipped)
  const al = j.alignment || {}, chs = al.characters || [], st = al.character_start_times_seconds || [];
  const full = chs.join(""), base = full.indexOf(spoken) >= 0 ? full.indexOf(spoken) : prefix.length;
  const words = []; const re = /\S+/g; let m;
  while ((m = re.exec(spoken))) { const t = st[base + m.index]; words.push(Math.round((t ?? (words.at(-1) ?? 0)) * 100) / 100); }
  if (!sample) fs.writeFileSync(path.join(ROOT, "tools/align", id + ".json"), JSON.stringify({ text: spoken, words }));
  ok++; if (ok % 20 === 0) console.log(`... ${ok} made`);
}
console.log(dry ? `${ids.length} lines, ${chars} characters would be sent` : `${ok} made, ${failed} failed, ${chars} characters sent.${ok && !sample ? " Now run: node tools/build_audio_manifest.mjs" : ""}`);
process.exit(failed ? 1 : 0);
