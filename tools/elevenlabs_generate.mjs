// Generate recordings for script lines with ElevenLabs, named by line ID, into prototype/audio/.
//
// Usage:
//   node tools/elevenlabs_generate.mjs --voices            list the voices on your ElevenLabs account (name and ID)
//   node tools/elevenlabs_generate.mjs --rerecord          generate every line in prototype/script/RERECORD.md
//   node tools/elevenlabs_generate.mjs id1 id2 ...         generate these line IDs
//   add --dry to see what would be sent, without calling ElevenLabs
//
// The API key is read from ELEVENLABS_API_KEY in the environment, or from a line ELEVENLABS_API_KEY=... in the
// project's .env or .env.local. It is never printed. Voices per character come from tools/elevenlabs_voices.json:
//   { "model": "eleven_multilingual_v2", "voices": { "curiosity": "<voice id>", "chute": "<voice id>", ... } }
// Then run: node tools/build_audio_manifest.mjs
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const args = process.argv.slice(2), dry = args.includes("--dry");

function apiKey() {
  if (process.env.ELEVENLABS_API_KEY) return process.env.ELEVENLABS_API_KEY.trim();
  for (const f of [".env", ".env.local"]) {
    const p = path.join(ROOT, f);
    if (!fs.existsSync(p)) continue;
    const m = fs.readFileSync(p, "utf8").match(/^\s*ELEVENLABS_API_KEY\s*=\s*["']?([^"'\r\n]+)["']?\s*$/m);
    if (m) return m[1].trim();
  }
  return null;
}
const KEY = apiKey();
if (!KEY && !dry) { console.error("No ELEVENLABS_API_KEY found (environment, .env or .env.local). Add it to .env and run again."); process.exit(1); }
const H = { "xi-api-key": KEY || "", "Content-Type": "application/json" };

if (args.includes("--voices")) {
  const r = await fetch("https://api.elevenlabs.io/v1/voices", { headers: H });
  if (!r.ok) { console.error("ElevenLabs said", r.status, await r.text()); process.exit(1); }
  const j = await r.json();
  for (const v of j.voices || []) console.log(`${v.voice_id}  ${v.name}${v.labels ? "  (" + Object.values(v.labels).join(", ") + ")" : ""}`);
  process.exit(0);
}

// every spoken line: the script files plus Person 1's stories (same IDs as voice.js)
const lines = new Map();
for (const f of fs.readdirSync(path.join(ROOT, "prototype/script")).filter(f => f.endsWith(".script.js"))) {
  const stories = [];
  const ctx = { SCRIPT: (id, who, text) => lines.set(id, { who, text }), SPEAKER() {}, NOTE() {}, STORY: (sid, who, mode) => stories.push({ sid, who, mode }), window: {} };
  vm.createContext(ctx); vm.runInContext(fs.readFileSync(path.join(ROOT, "prototype/script", f), "utf8"), ctx);
  if (stories.length) {
    const sctx = { window: {} }; vm.createContext(sctx); vm.runInContext(fs.readFileSync(path.join(ROOT, "storytimes/stories.js"), "utf8"), sctx);
    const sentences = t => String(t).split(/(?<=[.!?…]["'”’)\]]*)\s+/).map(x => x.trim()).filter(Boolean);
    for (const { sid, who, mode } of stories) {
      const st = (sctx.window.restoreOppyStories || {})[sid]; if (!st) continue;
      st.lines.forEach((ln, i) => {
        if (mode === "sentences") sentences(ln).forEach((s, k) => lines.set(`story.${sid}.${i + 1}.${k + 1}`, { who, text: s }));
        else lines.set(`story.${sid}.${i + 1}`, { who, text: ln });
      });
    }
  }
}

let ids = args.filter(a => !a.startsWith("--"));
if (args.includes("--rerecord")) ids = [...fs.readFileSync(path.join(ROOT, "prototype/script/RERECORD.md"), "utf8").matchAll(/^## (?:New line: )?(\S+)\.mp3/gm)].map(m => m[1]);
if (!ids.length) { console.error("Nothing to generate: pass line IDs or --rerecord."); process.exit(1); }

const cfgPath = path.join(ROOT, "tools/elevenlabs_voices.json");
const cfg = fs.existsSync(cfgPath) ? JSON.parse(fs.readFileSync(cfgPath, "utf8")) : { voices: {} };
const model = cfg.model || "eleven_multilingual_v2";
// how the voice should say a few things (the on-screen text stays as written)
const SAY = t => t.replace(/(\d)-(\d) meters/g, "$1 to $2 meters");

let ok = 0, failed = 0;
for (const id of ids) {
  const ln = lines.get(id);
  if (!ln) { console.error(`? ${id}: no such line in the script`); failed++; continue; }
  const voice = (cfg.voices || {})[ln.who];
  if (!voice) { console.error(`? ${id}: no voice set for "${ln.who}" in tools/elevenlabs_voices.json`); failed++; continue; }
  const text = SAY(ln.text);
  if (dry) { console.log(`would make ${id}.mp3 (${ln.who}): ${text}`); continue; }
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_128`, {
    method: "POST", headers: H, body: JSON.stringify({ text, model_id: model, ...(cfg.settings ? { voice_settings: cfg.settings } : {}) }) });
  if (!r.ok) { console.error(`x ${id}: ElevenLabs said ${r.status} ${(await r.text()).slice(0, 200)}`); failed++; continue; }
  fs.writeFileSync(path.join(ROOT, "prototype/audio", id + ".mp3"), Buffer.from(await r.arrayBuffer()));
  console.log(`made ${id}.mp3 (${ln.who})`); ok++;
}
console.log(`${ok} made, ${failed} failed.${ok ? " Now run: node tools/build_audio_manifest.mjs" : ""}`);
process.exit(failed ? 1 : 0);
