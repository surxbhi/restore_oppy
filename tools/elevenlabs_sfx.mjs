// Make the game's short sound effects with ElevenLabs Sound Effects, into prototype/sfx/<name>.mp3.
// Usage: node tools/elevenlabs_sfx.mjs            all missing ones
//        node tools/elevenlabs_sfx.mjs dig rasp   just these (replaces them)
// Key: ELEVENLABS_API_KEY in the environment or in .env (never printed).
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const env = [".env", ".env.local"].map(f => path.join(ROOT, f)).filter(f => fs.existsSync(f)).map(f => fs.readFileSync(f, "utf8")).join("\n");
const KEY = (process.env.ELEVENLABS_API_KEY || (env.match(/^\s*ELEVENLABS_API_KEY\s*=\s*["']?([^"'\r\n]+)/m) || [])[1] || "").trim();
if (!KEY) { console.error("No ELEVENLABS_API_KEY found (environment or .env)."); process.exit(1); }

// name: [what it should sound like, seconds]
export const SFX = {
  drive:  ["small toy rover wheels rolling and crunching slowly over dry gravel, gentle, no music", 1.2],
  bump:   ["soft dull thunk of a small robot gently bumping into a rock, no music", 0.6],
  dig:    ["small metal scoop scraping into cold icy dirt, short, no music", 1.0],
  rasp:   ["short burst of a tiny electric rasp drill grinding hard ice, buzzy, no music", 1.0],
  place:  ["gentle mechanical clunk of a small instrument being set down on soil, no music", 0.6],
  rumble: ["soft low deep rumble of a distant small earthquake, fading, no music", 2.0],
  swish:  ["soft quick fabric swish, no music", 0.5],
  rotor:  ["small drone rotors spinning up, rising soft hum, no music", 1.2],
  land:   ["small drone landing softly with a little dusty puff, no music", 0.8],
  right:  ["happy bright two-note chime for a correct answer in a kids game", 0.7],
  wrong:  ["gentle soft low boop for try again in a kids game, friendly, not harsh", 0.5],
  gift:   ["magical sparkle twinkle of a gift box opening in a kids game", 1.2],
  solved: ["short cheerful chiptune fanfare jingle, puzzle solved in a kids game", 1.6],
};

const only = process.argv.slice(2);
const outDir = path.join(ROOT, "prototype/sfx"); fs.mkdirSync(outDir, { recursive: true });
let ok = 0, failed = 0;
await Promise.all(Object.entries(SFX).filter(([n]) => only.length ? only.includes(n) : !fs.existsSync(path.join(outDir, n + ".mp3"))).map(async ([name, [text, secs]]) => {
  const r = await fetch("https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_128", {
    method: "POST", headers: { "xi-api-key": KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ text, duration_seconds: secs, prompt_influence: 0.6 }) });
  if (!r.ok) { console.error(`x ${name}: ${r.status} ${(await r.text()).slice(0, 160)}`); failed++; return; }
  fs.writeFileSync(path.join(outDir, name + ".mp3"), Buffer.from(await r.arrayBuffer())); ok++; console.log(`+ ${name}`);
}));
console.log(`${ok} made, ${failed} failed`);
process.exit(failed ? 1 : 0);
