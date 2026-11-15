// voice.js: the one voice of every Restore Oppy page (owner, 2026-11-15: "separate the script out so that the person can
// work on the script and the voice over"). Contract: .claude/script-contract.md. No dependencies, no modules, works from file://.
//
// Load order (each page):
//   <script src="audio/manifest.js"></script>            which lines have a recording (tools/build_audio_manifest.mjs writes it)
//   <script src="voice.js"></script>                     defines SCRIPT / SPEAKER / STORY / LINE / TEXT / Voice
//   <script src="script/<page>.script.js"></script>      the page's words, one SCRIPT(...) per spoken line
//   <script src="../storytimes/stories.js"></script>     (if the page has story time)
//   <script src="captions.js"></script>  <script src="giftbox.js"></script>  <script> game </script>
//
// Script files call:
//   SPEAKER(key, name, { pitch, rate })       a speaker: caption name and computer-voice settings
//   SCRIPT(id, who, text, { static: true })   one spoken line; {name} = a placeholder the game fills in; static = the
//                                             filled value never changes, so one recording is right (else: computer voice)
//   STORY(storyId, who, "parts"|"sentences")  this page reads Person 1's story storytimes/stories.js[storyId] aloud:
//                                             IDs story.<storyId>.<part> (1-based, = "Part N of M") or, when the page
//                                             packs a part into several caption steps, story.<storyId>.<part>.<sentence>
// Games call:
//   TEXT(id, vars) -> the words (placeholders filled)      LINE(id, vars) -> { id, who, text }
//   Voice.speak(lineOrStep, { onstart, onend })            speaks it: the recording if there is one, else the computer voice
//   Voice.step([line | { line, text }, ...]) -> { who, text, parts }   several lines (or sentences of lines) as ONE caption step
//   Voice.stop(), Voice.on, Voice.setOn(b), Voice.toggle(), Voice.button(el), Voice.talking(now), Voice.name(who)
//   Voice.story(storyId, i) -> the line (parts) or step (sentences) for part i (0-based)   Voice.storySentences(storyId, i)
//
// A recording plays when audio/manifest.js lists the line's ID, the step holds the WHOLE line (not a piece of it), and the
// line has no placeholders (or is static). A step of several lines plays them one after another (recording, or computer
// voice for a line without one); captions.js reveals the words across the whole step (captions.follow). A file that fails
// to load or play: the computer voice says that line, and the console says so once.
(() => {
  const G = typeof window !== "undefined" ? window : globalThis;
  const LINES = Object.create(null), SPEAKERS = Object.create(null), STORIES = Object.create(null);
  const warned = new Set();
  const warnOnce = (key, ...msg) => { if (warned.has(key)) return; warned.add(key); console.warn(...msg); };
  const PH = /\{([A-Za-z_][\w]*)\}/g;

  // ---------------- the script ----------------
  function SCRIPT(id, who, text, opts = {}) {
    if (LINES[id]) console.error(`[voice] duplicate script ID ${id}: the second one wins`);
    LINES[id] = { id, who, text: String(text), static: !!(opts && opts.static) };
  }
  function SPEAKER(key, name, opts = {}) { SPEAKERS[key] = { key, name, pitch: opts.pitch ?? 1, rate: opts.rate ?? 1 }; }
  function STORY(storyId, who, mode = "parts") { STORIES[storyId] = { storyId, who, mode: mode === "sentences" ? "sentences" : "parts" }; }
  function fill(id, text, vars) {
    return text.replace(PH, (m, k) => {
      if (vars && vars[k] !== undefined && vars[k] !== null) return String(vars[k]);
      warnOnce("ph:" + id + ":" + k, `[voice] ${id}: placeholder {${k}} not supplied`);
      return m;
    });
  }
  function TEXT(id, vars) {
    const ln = LINES[id];
    if (!ln) { warnOnce("id:" + id, `[voice] unknown script ID ${id}: add it to the page's script file`); return `[missing line ${id}]`; }
    return fill(id, ln.text, vars);
  }
  function LINE(id, vars) {
    const ln = LINES[id];
    if (!ln) { TEXT(id); return { id, who: "curiosity", text: `[missing line ${id}]`, missing: true }; }
    const dyn = PH.test(ln.text); PH.lastIndex = 0;
    return { id, who: ln.who, text: fill(id, ln.text, vars), dynamic: dyn && !ln.static };
  }
  // Sentences: split after . ! ? … (and closing quotes) that are followed by a space. Used for story-time sentence IDs, here and in
  // tools/export_script.mjs (which loads this file), so the numbering is the same everywhere.
  const sentences = t => String(t).split(/(?<=[.!?…]["'”’)\]]*)\s+/).map(x => x.trim()).filter(Boolean);
  const storyText = (storyId, i) => G.restoreOppyStories?.[storyId]?.lines?.[i];
  function storySentences(storyId, i) {          // [{ id, who, text }] for part i (0-based): story.<id>.<i+1>.<n>
    const st = STORIES[storyId], t = storyText(storyId, i);
    if (t == null) return [];
    if (!st) warnOnce("story:" + storyId, `[voice] story ${storyId} has no STORY(...) line in the page's script file`);
    const who = st ? st.who : "curiosity";
    return sentences(t).map((s, k) => ({ id: `story.${storyId}.${i + 1}.${k + 1}`, who, text: s }));
  }
  function story(storyId, i) {                    // the line (mode "parts") or a step of its sentences (mode "sentences")
    const st = STORIES[storyId], t = storyText(storyId, i);
    if (t == null) return null;
    if (!st) warnOnce("story:" + storyId, `[voice] story ${storyId} has no STORY(...) line in the page's script file`);
    if (st && st.mode === "sentences") return step(storySentences(storyId, i));
    return { id: `story.${storyId}.${i + 1}`, who: st ? st.who : "curiosity", text: t };
  }

  // ---------------- steps: several lines, or pieces of lines, in one caption ----------------
  const norm = s => String(s).replace(/\s+/g, " ").trim();
  function step(items) {                          // items: lines { id, who, text }, or pieces { line, text } in order
    const parts = [];
    for (const it of items) {
      const ln = it.line || it, text = it.text, last = parts[parts.length - 1];
      if (last && last.line === ln && it.line) last.text += " " + text;    // the next sentence of the same line
      else parts.push({ id: ln.id, text, line: ln });
    }
    for (const p of parts) p.full = norm(p.text) === norm(p.line.text);   // the whole line: its recording may play
    return { who: (items[0] && (items[0].line || items[0]).who) || "curiosity", text: parts.map(p => p.text).join(" "), parts };
  }
  const asStep = it => it && it.parts ? it : { who: it.who, text: it.text, parts: [{ id: it.id, text: it.text, line: it, full: true }] };

  // ---------------- recordings ----------------
  const bad = new Set();                          // files that failed to load this session
  function recordingFor(p) {
    const M = G.AUDIO_MANIFEST || {};
    if (!p.id || !p.full || !M[p.id] || bad.has(p.id)) return null;
    if (p.line && p.line.dynamic) return null;    // the words change: the computer voice says them
    // A recording whose words no longer match the script (the line was reworded after it was recorded) is not played:
    // the computer voice says the new words until the line is recorded again (owner, 2026-11-15: "follow real NASA data").
    const T = G.AUDIO_TEXT && G.AUDIO_TEXT[p.id], norm = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, " ").trim();   // accents, curly quotes and spacing do not change how a line sounds
    if (T && T.text && p.text && norm(T.text) !== norm(p.text)) return null;
    const stage = oppyStage(p);                    // Oppy's thank-you lines: the recording for how many parts Oppy has (1 tired ... 5 strong)
    if (stage && M[p.id + ".s" + stage] && !bad.has(p.id + ".s" + stage)) return "audio/" + M[p.id + ".s" + stage];
    return "audio/" + M[p.id];
  }
  // Oppy grows stronger with every part (owner, 2026-11-15). Each game's Oppy line has five recordings, <id>.s1 (very tired) to
  // <id>.s5 (strong). The stage is the number of parts Oppy will have once this game's part is fitted, read from the map page's
  // save ("oppy.hub", same origin). A game played on its own, with no save, counts as the first part.
  const PART_OF = { td: "sojourner", phx: "phoenix", ins: "insight", pc: "parachute", ing: "ingenuity" };
  function oppyStage(p) {
    const game = PART_OF[String(p.id).split(".")[0]];
    if (!game || (p.line && p.line.who && p.line.who !== "oppy")) return 0;
    let parts = {};
    try { parts = (JSON.parse(localStorage.getItem("oppy.hub") || "{}") || {}).parts || {}; } catch {}
    const have = Object.keys(parts).filter(k => parts[k]).length;
    return Math.max(1, Math.min(5, parts[game] ? have : have + 1));
  }

  // ---------------- state ----------------
  const QS = typeof location !== "undefined" ? location.search : "";
  let on = !/[?&]mute=1\b/.test(QS), seq = 0, talkUntil = 0, audio = null, timers = [];
  // Every voice plays at this speed (owner, 2026-11-15: "back to normal speed (1.0x)"). Recordings keep their pitch.
  const SPEED = 1.0; G.VOICE_SPEED = SPEED;
  const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now());
  const hasTTS = () => typeof speechSynthesis !== "undefined";
  let voices = [];
  function pickVoices() { voices = (speechSynthesis.getVoices() || []).filter(v => /^en/i.test(v.lang)); }
  if (hasTTS()) { pickVoices(); speechSynthesis.addEventListener ? speechSynthesis.addEventListener("voiceschanged", pickVoices) : (speechSynthesis.onvoiceschanged = pickVoices); }
  const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.push(t); return t; };
  const follow = (text, at) => G.captions?.follow?.(text, at);

  function stop() {                               // silence: the recording and the computer voice
    seq++;
    timers.forEach(clearTimeout); timers = [];
    if (audio) { const a = audio; audio = null; a.onended = a.onerror = a.onplaying = null; try { a.pause(); a.removeAttribute("src"); a.load(); } catch {} }
    if (hasTTS()) speechSynthesis.cancel();
    talkUntil = 0;
  }

  // The computer voice, exactly as the games did it. Chrome can leave its speech engine stuck after cancel(): it says
  // "speaking" but stays silent, and every new line queues behind the stuck one. So: cancel, resume, wait a moment, speak,
  // and if the voice has not started within about a second, reset and try once more.
  function tts(text, who, my, h = {}) {
    if (!hasTTS()) { h.end && later(h.end, 0); return; }
    speechSynthesis.cancel(); speechSynthesis.resume();
    const make = () => {
      const u = new SpeechSynthesisUtterance(text), v = SPEAKERS[who] || { pitch: 1, rate: 1 };
      const local = voices.filter(x => x.localService);
      const prefer = local.find(x => /Samantha/i.test(x.name)) || local.find(x => /en-US/i.test(x.lang)) || local[0] || voices[0];
      if (prefer) u.voice = prefer;
      u.pitch = v.pitch; u.rate = Math.min(2, v.rate * SPEED);
      let ended = false;
      const end = () => { if (ended || my !== seq) return; ended = true; talkUntil = 0; h.end && h.end(); };
      u.onend = end;
      if (h.guard) u.onerror = e => { if (my === seq && e && e.error !== "interrupted" && e.error !== "canceled") end(); };   // in a sequence: go on
      if (h.boundary) u.addEventListener("boundary", e => { if (my === seq && (!e.name || e.name === "word")) h.boundary(e.charIndex); });
      return u;
    };
    later(() => {
      if (my !== seq) return;
      const u = make(); let started = false;
      u.addEventListener("start", () => { started = true; h.start && h.start(); });
      speechSynthesis.speak(u);
      later(() => {                               // watchdog: not started? reset the engine and retry once
        if (started || my !== seq) return;
        speechSynthesis.cancel(); speechSynthesis.resume(); speechSynthesis.speak(make());
      }, 1200);
      if (h.guard) later(() => { if (my === seq && !h.done?.()) h.end && h.end(); }, h.guard);   // a stuck engine never blocks a sequence
    }, 120);
  }

  // Word reveal for a recording: the words come evenly over the file's length, longer words (and sentence ends) taking
  // longer; the last word is shown at the latest 0.25 s before the end, and everything at the end.
  function wordTimes(text) {
    const out = []; let at = 0, total = 0;
    for (const bit of text.split(/(\s+)/)) {
      if (bit && !/^\s+$/.test(bit)) {
        const w = bit.replace(/[^\p{L}\p{N}]/gu, "").length + 1 + (/[.!?…]["'”’)\]]*$/.test(bit) ? 3 : /[,;:]$/.test(bit) ? 1.5 : 0);
        out.push({ at, w, before: total }); total += w;
      }
      at += bit.length;
    }
    return { words: out, total: total || 1 };
  }
  function play(p, src, my, off, stepText, done, fallback) {
    const a = new Audio(src); audio = a; a.preload = "auto";
    const W = (G.AUDIO_WORDS || {})[String(src).split("/").pop().replace(/\.[a-z0-9]+$/i, "")];   // word start times for this exact file a.playbackRate = SPEED; a.defaultPlaybackRate = SPEED; a.preservesPitch = true;
    const { words, total } = wordTimes(p.text);
    let failed = false, tick = 0;
    const fail = why => {
      if (failed || my !== seq) return; failed = true; clearInterval(tick);
      if (why !== "NotAllowedError") bad.add(p.id);
      warnOnce("rec:" + p.id, `[voice] recording ${src} for ${p.id} did not play (${why}): using the computer voice for this line`);
      if (audio === a) audio = null;
      try { a.pause(); } catch {}
      fallback();
    };
    a.onerror = () => fail("could not load");
    later(() => { if (audio === a && !failed && a.currentTime === 0 && a.paused) fail("did not start within 4 s"); }, 4000);
    a.onplaying = () => {
      if (my !== seq) return;
      clearInterval(tick);
      tick = setInterval(() => {
        if (my !== seq || audio !== a) return clearInterval(tick);
        const D = a.duration, t = a.currentTime;
        if (!isFinite(D) || D <= 0) return follow(stepText, off);   // keep the caption "voiced" until the length is known
        let k = 0;
        if (W && W.length) {                         // the real moment each word is spoken (from ElevenLabs), mapped onto the caption's words
          for (let i = 0; i < words.length; i++) { const wi = W[Math.min(W.length - 1, Math.round(i * (W.length - 1) / Math.max(1, words.length - 1)))]; if (i === 0 || t >= wi) k = i; }
        } else for (let i = 0; i < words.length; i++) {
          let ti = D * (words[i].before + 0.6 * words[i].w) / total;
          if (i === words.length - 1) ti = Math.max(ti, D - 0.25);
          if (i === 0 || t >= ti) k = i;
        }
        talkUntil = now() + 200;
        follow(stepText, off + words[k].at);
      }, 40);
      timers.push(tick);
    };
    a.onended = () => {
      if (my !== seq) return; clearInterval(tick); if (audio === a) audio = null;
      follow(stepText, off + p.text.length); done();
    };
    let pr; try { pr = a.play(); } catch (e) { return fail(e && e.name || "play failed"); }
    if (pr && pr.catch) pr.catch(e => fail(e && e.name || "play failed"));
  }

  function speak(item, hooks = {}) {
    if (!item) return;
    const st = asStep(item), text = st.text, who = st.who;
    stop();
    const my = seq;
    talkUntil = now() + Math.max(600, text.length * 55 / SPEED);
    if (!on) return;
    const recs = st.parts.map(recordingFor);
    if (!recs.some(Boolean)) {                    // no recording: one utterance for the whole step (captions.js follows it itself)
      tts(text, who, my, { start: hooks.onstart, end: hooks.onend });
      return;
    }
    const offs = []; let o = 0;
    for (const p of st.parts) { offs.push(o); o += p.text.length + 1; }
    let i = 0, started = false;
    const begin = () => { if (!started) { started = true; hooks.onstart && hooks.onstart(); } };
    later(() => follow(text, 0), 0);              // the caption waits for the voice, not its reading timer (after captions.js built it)
    const next = () => {
      if (my !== seq) return;
      if (i >= st.parts.length) { talkUntil = 0; follow(text, text.length); hooks.onend && hooks.onend(); return; }
      const k = i++, p = st.parts[k], off = offs[k];
      const byComputer = () => {
        let finished = false;
        follow(text, off);
        talkUntil = now() + Math.max(600, p.text.length * 55 / SPEED);
        tts(p.text, who, my, { start: begin, boundary: ci => follow(text, off + ci),
          end: () => { if (finished) return; finished = true; follow(text, off + p.text.length); next(); },
          done: () => finished, guard: 1500 + p.text.length * 120 });
      };
      if (recs[k]) { begin(); play(p, recs[k], my, off, text, next, byComputer); }
      else byComputer();
    };
    next();
  }

  function setOn(v) { on = !!v; if (!on) { const t = talkUntil; stop(); talkUntil = t; } syncButtons(); }
  const buttons = [];
  function syncButtons() { for (const b of buttons) { b.setAttribute("aria-pressed", String(on)); b.textContent = on ? "🔊 Voice" : "🔇 Voice"; } }
  function button(el) { if (!el) return; buttons.push(el); el.onclick = () => setOn(!on); syncButtons(); }
  const talking = (t = now()) => t < talkUntil || !!(audio && !audio.paused) || (hasTTS() && speechSynthesis.speaking);
  const name = who => (SPEAKERS[who] && SPEAKERS[who].name) || who;

  Object.assign(G, { SCRIPT, SPEAKER, STORY, TEXT, LINE });
  G.Voice = {
    speak, stop, step, story, storySentences, sentences, setOn, toggle: () => setOn(!on), button, talking, name,
    get on() { return on; }, set on(v) { setOn(v); },
    speaker: who => SPEAKERS[who], recorded: id => !!(G.AUDIO_MANIFEST || {})[id],
    lines: LINES, speakers: SPEAKERS, stories: STORIES,
  };
})();
