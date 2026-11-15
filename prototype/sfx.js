// Short sound effects for actions (made with ElevenLabs Sound Effects: tools/elevenlabs_sfx.mjs), kept quieter than the voices.
// SFX.play("dig") ; silent with ?mute=1; never throws, never blocks the game.
(function (G) {
  const NAMES = ["drive", "bump", "dig", "rasp", "place", "rumble", "swish", "rotor", "land", "right", "wrong", "gift", "solved"];
  const VOL = { rumble: 0.5, solved: 0.4, gift: 0.4, right: 0.35, wrong: 0.3 };
  const off = /[?&]mute=1\b/.test(location.search);
  const base = (document.currentScript && document.currentScript.src || "").replace(/[^/]*$/, "") + "sfx/";
  const pool = {}, last = {};
  function get(n) { if (!pool[n]) { const a = new Audio(base + n + ".mp3"); a.preload = "auto"; pool[n] = a; } return pool[n]; }
  function play(n, o = {}) {
    if (off || !NAMES.includes(n)) return;
    const now = performance.now(); if (last[n] && now - last[n] < 120) return; last[n] = now;   // no machine-gun repeats
    try {
      const a = get(n).cloneNode(); a.volume = Math.min(1, (o.vol ?? VOL[n] ?? 0.3));
      const p = a.play(); if (p && p.catch) p.catch(() => {});
    } catch {}
  }
  addEventListener("pointerdown", function warm() { removeEventListener("pointerdown", warm, true); NAMES.forEach(get); }, true);
  G.SFX = { play };
})(window);
