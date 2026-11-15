// Shared by every Restore Oppy page (owner, 2026-11-14 and 2026-11-15): the caption comes word by word, in step
// with the voice, and key words are highlighted. Load it once, anywhere after the caption bar:
//   <script src="captions.js"></script>
// It needs no changes to a game's say() / speak(): it watches the #line caption, and listens to the speech the page
// starts. With the voice off (or a voice that reports no word timing) a timer shows the words at reading speed.
// #line.textContent still holds the whole line at once.
// The caption text is ONE size on every screen (the games' long / xlong shrink classes no longer change it) and the
// bar shows at most MAX_LINES lines. A longer line is split into pages ("1/2", "2/2"), shown one after another;
// the marker, or the , and . keys, flips pages by hand. #line gets a fixed height of MAX_LINES line-heights.
// Next only after the words are all shown (owner, 2026-11-15). The state is <html data-cap="busy|done|idle">, the event
// "caption:done" fires on document when the last page is fully shown, and window.captions = { state, finish, skip, follow }.
// follow(text, charIndex): voice.js drives the words for a recorded voice file (no boundary events), see .claude/script-contract.md.
// A game marks its forward button(s) data-cap-next. One INSIDE the caption bar (the footer that holds #line) is "waiting"
// while busy: visible but dim and grey with a progress line along its bottom edge, aria-disabled, and a click on it is a
// speed-up step, not a press. One OUTSIDE the bar (popup card, overlay, panel) is never touched: always normal, clickable at
// once. While busy, a click on the caption bar, or Enter / Space / ArrowRight, speeds the text up one step, but only when the
// bar has a visible Next and no outside [data-cap-next] (an open card) is visible: then the keys go to the game as usual.
(() => {
  const line = document.getElementById("line");
  if (!line) return;

  // Key words: the science words the stories teach, plus every number and date (shown in a clear font).
  const KEY = /^(ice|icy|water|gas|sublimation|trench|scoop|oven|frost|snow|winter|wheels?|rocks?|elements|tracks?|marsquakes?|vibrations|seismometer|parachute|canopy|stripes|code|rotors?|flights?|flew|hematite|blueberries|storm|solar|sunlight|batteries|memory|memories|parts?)$/i;
  const WORD_MS = Math.round(340 / (window.VOICE_SPEED || 1));   // about the speed the voices read at (voice.js sets VOICE_SPEED)
  const MAX_LINES = 2;                                // the caption bar never shows more lines than this
  const BEAT_MS = 350;                                // pause on the last word of a page before the next page comes
  const UNIT = /^(km|m|mm|cm|kg|g|s|sec|secs|seconds?|minutes?|mins?|hours?|hrs?|days?|sols?|weeks?|months?|years?|miles?|mph|kph|meters?|metres?|kilometers?|kilometres?|centimeters?|feet|ft|percent|degrees?|c|f|k|million|billion|thousand|times|watts?|w|volts?|v|grams?|kilograms?|pounds?|lbs?|tons?|am|pm|hz|pa|bar)$/i;
  const LABEL = /^(sol|day|page|no\.?|number|flight|sample)$/i;
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!document.querySelector('link[href*="Atkinson+Hyperlegible"]')) {
    const l = document.createElement("link"); l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&display=swap";
    document.head.append(l);
  }
  const css = document.createElement("style");
  // One caption size: --caption-size (house.css) or the clamp. The shrink classes are beaten here on purpose.
  css.textContent = `
    #line, #line.long, #line.xlong, .line.long #line, .line.xlong #line, .long #line, .xlong #line {
      font-size: var(--caption-size, clamp(18px, 2.2vh + 0.6vw, 28px)) !important; line-height: 1.3 !important;
      box-sizing: content-box !important; height: ${MAX_LINES * 1.3}em !important; min-height: ${MAX_LINES * 1.3}em !important;
      max-height: ${MAX_LINES * 1.3}em !important; overflow: hidden !important; }
    #line .cw { opacity: 0; transition: opacity .12s; line-height: 0; }   /* a word never makes its line taller than the strut (the number font differs) */
    #line .cw.on { opacity: 1; }
    #line .cw.kw { color: var(--yellow, #fff27a); font-weight: 700; }
    #line .cw.num { font-family: "Atkinson Hyperlegible", system-ui, sans-serif; letter-spacing: .5px; }
    #line .cw.cw-off { display: none; }
    .cap-page { position: absolute; top: 0; right: 0; z-index: 2; margin: 0; padding: 1px 9px; border-radius: 999px; line-height: 1.3;
      font: 700 clamp(11px, 1.5vh, 14px)/1.3 var(--font-read, "Atkinson Hyperlegible", system-ui, sans-serif); color: var(--yellow, #fff27a);
      background: #ffffff1f; border: 1px solid #ffffff55; cursor: pointer; }
    .cap-page[hidden] { display: none; }
    .cap-page:hover { background: #ffffff38; }
    html[data-cap="busy"] [data-cap-next][data-cap-wait] { opacity: .45 !important; filter: saturate(.15) !important; box-shadow: none !important; animation: none !important;
      cursor: progress !important; background-repeat: no-repeat !important; background-position: left bottom !important; background-size: 100% 4px !important;
      background-image: linear-gradient(to right, var(--yellow, #fff27a) calc(var(--cap-progress, 0) * 100%), transparent calc(var(--cap-progress, 0) * 100%)) !important; }
    /* the words are all shown but the voice is still talking (owner, 2026-11-15): Next keeps waiting, with a moving bar instead of a full one */
    html[data-cap="busy"][data-cap-voice="1"] [data-cap-next][data-cap-wait] {
      background-image: linear-gradient(90deg, transparent 0%, var(--yellow, #fff27a) 35%, transparent 70%) !important; background-size: 200% 4px !important;
      animation: cap-talk 1.1s linear infinite !important; }
    @keyframes cap-talk { from { background-position: 200% 100%; } to { background-position: -100% 100%; } }
    @keyframes cap-pop { from { opacity: 0; transform: scale(.7); } 65% { opacity: 1; transform: scale(1.1); } to { opacity: 1; transform: none; } }
    html[data-cap="done"] [data-cap-next][data-cap-wait] { animation: cap-pop .3s ease-out; }
    html[data-cap="busy"][data-cap-page="ready"] [data-cap-next][data-cap-wait] { opacity: 1 !important; filter: none !important; cursor: pointer !important;
      background-image: none !important; animation: cap-pop .3s ease-out !important; }
    @media (prefers-reduced-motion: reduce) { #line .cw { transition: none; } html[data-cap="done"] [data-cap-next][data-cap-wait], html[data-cap="busy"][data-cap-page="ready"] [data-cap-next][data-cap-wait], html[data-cap="busy"][data-cap-voice="1"] [data-cap-next][data-cap-wait] { animation: none !important; } }`;
  document.head.append(css);

  const mark = document.createElement("button");       // the "1/2" pill: next to #line, not inside it
  mark.type = "button"; mark.className = "cap-page"; mark.hidden = true; mark.tabIndex = -1; mark.setAttribute("aria-hidden", "true");
  mark.addEventListener("mousedown", e => e.preventDefault());   // a click must not take the keyboard focus from the game
  mark.addEventListener("click", () => go(1));
  line.after(mark);
  const holder = line.parentElement;
  const barOf = () => line.closest("footer") || line.parentElement;   // the caption bar
  if (holder && getComputedStyle(holder).position === "static") holder.style.position = "relative";

  let cur = null;   // { text, spans, starts, shown, timer, voiced, heard, pages: [[from, to)], pageOf, page, pending, manual, sig }

  // ---- busy / done / idle ----
  // "done" also waits for the voice to stop (owner, 2026-11-15: "if i clicked next while voice is speaking it goes to the next step").
  // Some voices (Chrome's online ones) send no word events, so the words follow a reading timer that can finish early; Next then
  // stays waiting until the voice really ends. A voice stuck "speaking" can hold Next for at most VOICE_HOLD_MS after the last word.
  const VOICE_HOLD_MS = 12000;
  const voiceBusy = () => { try { return !!(window.Voice && Voice.talking && Voice.talking()) || (!window.Voice && "speechSynthesis" in window && speechSynthesis.speaking); } catch { return false; } };
  const stateNow = () => !cur ? "idle" : cur.shown < cur.spans.length ? "busy"
    : (voiceBusy() && performance.now() - (cur.allShownAt || (cur.allShownAt = performance.now())) < VOICE_HOLD_MS) ? "busy" : "done";
  // A page is "ready" when it is fully shown and another page follows (owner, 2026-11-15: "next button can move from 1/2 2/2"):
  // the bar's Next then looks and works like a normal button, and one press turns to the next page.
  const pageReady = () => !!cur && !voiceBusy() && cur.shown < cur.spans.length && cur.pages.length > 1 && cur.page + 1 < cur.pages.length && cur.shown >= cur.pages[cur.page][1];
  function sync() {
    const st = stateNow();
    if (document.documentElement.dataset.cap !== st) document.documentElement.dataset.cap = st;
    const ready = pageReady() ? "ready" : "";
    const talkingOn = !!cur && st === "busy" && cur.shown >= cur.spans.length;     // all words shown, the voice still talking
    if (talkingOn !== (document.documentElement.dataset.capVoice === "1")) { if (talkingOn) document.documentElement.dataset.capVoice = "1"; else delete document.documentElement.dataset.capVoice; }
    if ((document.documentElement.dataset.capPage || "") !== ready) { if (ready) document.documentElement.dataset.capPage = ready; else delete document.documentElement.dataset.capPage; }
    const p = cur ? cur.shown / Math.max(1, cur.spans.length) : 0, root = document.documentElement;
    if (root.style.getPropertyValue("--cap-progress") !== String(p)) root.style.setProperty("--cap-progress", String(p));   // 0 to 1 as the words come
    ariaSync();
    if (st === "done" && !cur.fired) { cur.fired = true; document.dispatchEvent(new CustomEvent("caption:done", { detail: { text: cur.text } })); }
  }
  const ariaSet = new WeakSet();                       // [data-cap-next] buttons we marked aria-disabled while busy
  function ariaSync() {
    const busy = document.documentElement.dataset.cap === "busy" && !pageReady();
    const bar = barOf();
    document.querySelectorAll("[data-cap-next]").forEach(b => {
      const inBar = !!bar && bar.contains(b);         // only the caption bar's own Next waits; popups never do
      if (inBar !== b.hasAttribute("data-cap-wait")) b.toggleAttribute("data-cap-wait", inBar);
      if (busy && inBar && b.getAttribute("aria-disabled") !== "true") { b.setAttribute("aria-disabled", "true"); ariaSet.add(b); }
      else if (!(busy && inBar) && ariaSet.has(b)) { b.removeAttribute("aria-disabled"); ariaSet.delete(b); }
    });
  }
  let ariaSoon = 0;                                   // a card built while busy (or given the attribute later) gets it too
  new MutationObserver(() => { if (!ariaSoon) ariaSoon = setTimeout(() => { ariaSoon = 0; ariaSync(); }, 0); })
    .observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-cap-next"] });
  sync();

  // ---- paging ----
  const wordText = i => cur.spans[i].textContent;
  const bare = t => t.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
  const endsSentence = i => /[.!?…]["'”’)\]]*$/.test(wordText(i));
  function canBreak(k) {                              // may a page start at word k?
    const prev = wordText(k - 1), next = wordText(k);
    if (!/[\p{L}\p{N}]/u.test(next)) return false;    // a lone closing quote or mark stays with its word
    if (!/[\p{L}\p{N}]/u.test(prev)) return false;    // a lone opening quote stays with its word
    if (/\d/.test(prev) && UNIT.test(bare(next))) return false;   // "12 minutes", "5 km", "20 °C"
    if (LABEL.test(bare(prev)) && /\d/.test(next)) return false;  // "Sol 12"
    return true;
  }
  // The last page must never hold a lone word or a tiny tail (owner, 2026-11-15: a page "3/3" holding only "that."). If the last page is a
  // single short row (under a third of the line), its words and the page before it are split again, as evenly as the two-line pages allow.
  function balanceTail(pages, setOff, rowH) {
    const n = cur.spans.length, last = pages[pages.length - 1], prev = pages[pages.length - 2];
    const lineW = line.clientWidth, rowsOf = (a, b) => {   // how many rows words a..b-1 take, with the page starting at word a
      setOff(a); const r0 = cur.spans[a].getClientRects()[0], rl = cur.spans[b - 1].getClientRects(), t = rl[rl.length - 1];
      return { rows: Math.round((t.top - r0.top) / rowH) + 1, wide: t.right - r0.left };
    };
    const tail = rowsOf(last[0], last[1]);
    const tiny = tail.rows === 1 && (tail.wide < lineW / 3 || last[1] - last[0] === 1);
    if (!tiny) return;
    const a = prev[0], len = i => wordText(i).length + 1, chars = (x, y) => { let c = 0; for (let i = x; i < y; i++) c += len(i); return c; }, total = chars(a, n);
    let best = -1, bestScore = -1;
    for (let k = a + 1; k < n; k++) {
      if (!canBreak(k)) continue;
      if (rowsOf(a, k).rows > MAX_LINES || rowsOf(k, n).rows > MAX_LINES) continue;
      const sc = Math.min(chars(a, k), chars(k, n)) + (endsSentence(k - 1) ? total * 0.12 : 0);
      if (sc > bestScore) { bestScore = sc; best = k; }
    }
    if (best < 0) return;
    const old = tail.wide;                            // only take the new split when the last page is no smaller than before
    const nt = rowsOf(best, n);
    if (nt.wide <= old && nt.rows === 1) return;
    prev[1] = best; last[0] = best;
  }
  function paginate() {
    const n = cur.spans.length, pages = [];
    const setOff = s => cur.spans.forEach((sp, i) => sp.classList.toggle("cw-off", i < s));
    setOff(0);                                        // measure with every word showing, in the box's real, full state
    const fs = fontPx();
    cur.sig = line.clientWidth + "x" + fs;
    cur.measured = sane();                            // no usable box (hidden, 0 wide, mid-layout): one page, measure again later
    const lh = parseFloat(getComputedStyle(line).lineHeight) || fs * 1.3;
    const lr = line.getBoundingClientRect(), sy = line.offsetHeight ? lr.height / line.offsetHeight : 1;   // a scaled stage (transform) must not skew the rows
    let s = 0;
    while (s < n && cur.measured) {
      setOff(s);
      const top0 = cur.spans[s].getClientRects()[0].top;
      let e = n;
      for (let i = s; i < n; i++) {                   // the first word that would sit on line MAX_LINES+1
        const r = cur.spans[i].getClientRects(), t = r[r.length - 1].top;
        if (Math.round((t - top0) / (lh * sy)) >= MAX_LINES) { e = Math.max(i, s + 1); break; }
      }
      if (e < n) {
        let j = -1;
        for (let k = e; k > Math.max(s, s + Math.ceil((e - s) * 2 / 3) - 1) && k > s; k--)   // a sentence end in the last third
          if (endsSentence(k - 1) && canBreak(k)) { j = k; break; }
        if (j < 0) { j = e; while (j > s + 1 && !canBreak(j)) j--; if (!canBreak(j)) j = e; }
        e = j;
      }
      pages.push([s, e]); s = e;
    }
    if (cur.measured && pages.length > 1) balanceTail(pages, setOff, lh * sy);
    if (!pages.length) pages.push([0, n]);
    cur.pages = pages; cur.pageOf = [];
    pages.forEach(([a, b], p) => { for (let i = a; i < b; i++) cur.pageOf[i] = p; });
    if (cur.measured && pages.length > 1 && pages.some(([a, b]) => b - a === 1) && (cur.guard = (cur.guard || 0) + 1) <= 4) retry();   // a one-word page in a wide box: caught mid-transition, look again next frame
  }
  const fontPx = () => parseFloat(getComputedStyle(line).fontSize) || 20;
  const sane = () => line.getClientRects().length > 0 && line.clientWidth >= 8 * fontPx();   // shown, and wider than a few words
  function retry() {                                  // re-measure on the next frame(s), for up to about 2 s, until the box is usable
    const me = cur, t0 = performance.now();
    const tick = () => {
      if (cur !== me) return;
      if (!me.measured || me.guardNow) { me.guardNow = false; if (sane()) repage(); }
      if (cur === me && !me.measured && performance.now() - t0 < 2000) requestAnimationFrame(tick);
    };
    me.guardNow = true; requestAnimationFrame(tick);
  }
  function setPage(p, fade) {
    cur.page = p;
    const [a, b] = cur.pages[p];
    cur.spans.forEach((sp, i) => sp.classList.toggle("cw-off", i < a || i >= b));
    mark.hidden = cur.pages.length < 2;
    mark.textContent = mark.hidden ? "" : (p + 1) + "/" + cur.pages.length;
    if (fade && !reduced() && line.animate) line.animate([{ opacity: 0.2 }, { opacity: 1 }], { duration: 160 });
  }
  function go(d) {                                    // by hand: marker or , and . keys; true if the page changed
    if (!cur) return false;
    const p = cur.page + d;
    if (p < 0 || p >= cur.pages.length) return false;
    clearTimeout(cur.pending); cur.pending = 0; cur.manual = true;
    setPage(p, true);
    reveal(cur.pages[p][1]);
    return true;
  }
  function repage() {                                 // new width or font: same words, new pages
    if (!cur) return;
    const anchor = cur.manual ? cur.pages[cur.page][0] : Math.max(0, Math.min(cur.shown - 1, cur.spans.length - 1));
    clearTimeout(cur.pending); cur.pending = 0;
    paginate(); setPage(cur.pageOf[anchor] || 0, false);
  }

  // ---- reveal ----
  function reveal(n) {                                // switch nothing: just mark the first n words as read
    const before = cur.shown;
    for (let i = cur.shown; i < Math.min(n, cur.spans.length); i++) cur.spans[i].classList.add("on");
    cur.shown = Math.max(cur.shown, Math.min(n, cur.spans.length));
    if (cur.shown > before) cur.progress = performance.now();
    if (cur.shown >= cur.spans.length) clearInterval(cur.timer);
    sync();
  }
  function show(n, voiced) {                          // reveal the first n words; turn the page when the next word is on the next one
    if (!cur) return;
    const me = cur, target = Math.min(n, me.spans.length);
    while (me.shown < target) {
      const next = me.shown, p = me.pageOf[next];
      if (p !== me.page && !me.manual) {
        if (voiced) { clearTimeout(me.pending); me.pending = 0; setPage(p, true); }   // the voice is already there
        else {                                        // wait a beat on the last word of the page, then turn it
          if (!me.pending) me.pending = setTimeout(() => { me.pending = 0; if (cur !== me) return; setPage(me.pageOf[me.shown], true); show(target, false); }, BEAT_MS);
          return;
        }
      }
      reveal(me.shown + 1);
    }
  }
  function build() {
    const text = line.textContent;
    if (cur) { clearInterval(cur.timer); clearTimeout(cur.pending); }
    cur = { text, spans: [], starts: [], shown: 0, timer: 0, voiced: false, heard: 0, pages: [[0, 0]], pageOf: [], page: 0, pending: 0, manual: false, sig: "", fired: false, progress: performance.now() };
    line.textContent = "";
    let at = 0;
    for (const bit of text.split(/(\s+)/)) {
      if (!bit) continue;
      if (/^\s+$/.test(bit)) line.append(bit);
      else {
        const s = document.createElement("span"), core = bare(bit).replace(/['’]s$/i, "");
        s.className = "cw" + (/\d/.test(bit) ? " kw num" : KEY.test(core) ? " kw" : "");
        s.textContent = bit; line.append(s); cur.spans.push(s); cur.starts.push(at);
      }
      at += bit.length;
    }
    sync();                                           // busy until the last word is shown
    paginate(); setPage(0, false);
    show(1, false);
    if (!cur.measured) retry();                       // the box was not usable yet
    const me = cur;                                   // the timer: used until the voice reports its own words
    me.timer = setInterval(() => { if (cur !== me) return clearInterval(me.timer); if (!me.voiced || performance.now() - me.heard > 1500) show(me.shown + 1, false); }, WORD_MS);   // also if the voice goes quiet
  }
  new MutationObserver(() => {                        // the page set a new line (plain text): rebuild it as words
    if (line.textContent.trim() && !line.querySelector(".cw")) build();
    else if (!line.textContent.trim() && cur) { clearInterval(cur.timer); clearTimeout(cur.pending); cur = null; mark.hidden = true; sync(); }
  }).observe(line, { childList: true, characterData: true, subtree: true });
  if (line.textContent.trim()) build();

  // ---- re-measure: window resize, the caption box changing width (or appearing), fonts arriving ----
  let again = 0;
  const later = force => { clearTimeout(again); again = setTimeout(() => {
    if (!cur) return;
    if (force || !cur.measured || cur.sig !== fullSig()) repage();
  }, 60); };
  function fullSig() {                                // the width with every word showing (a shrink-to-fit bar is narrower on a short page)
    const [a, b] = cur.pages[cur.page], hid = cur.spans.some(sp => sp.classList.contains("cw-off"));
    if (hid) cur.spans.forEach(sp => sp.classList.remove("cw-off"));
    const sg = line.clientWidth + "x" + fontPx();
    if (hid) cur.spans.forEach((sp, i) => sp.classList.toggle("cw-off", i < a || i >= b));
    return sg;
  }
  addEventListener("resize", () => later(false));
  if (window.ResizeObserver) { const ro = new ResizeObserver(() => later(false)); ro.observe(line); const bar = line.closest("footer"); if (bar && bar !== line) ro.observe(bar); if (holder && holder !== bar) ro.observe(holder); }
  if (window.IntersectionObserver) new IntersectionObserver(() => later(false)).observe(line);   // shown again after being hidden
  if (document.fonts) { document.fonts.ready.then(() => later(true)); document.fonts.addEventListener?.("loadingdone", () => later(true)); }

  // ---- , and . turn the page by hand (never while typing; the games' own keys are left alone) ----
  addEventListener("keydown", e => {
    if (e.key !== "," && e.key !== ".") return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const t = e.target;
    if (t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable)) return;
    if (go(e.key === "." ? 1 : -1)) e.preventDefault();
  });

  // ---- speed up, finish, and the safety net ----
  function finish() {                                 // show everything now, on the last page
    if (!cur) return;
    clearTimeout(cur.pending); cur.pending = 0;
    const last = cur.pages.length - 1;
    if (cur.page !== last) setPage(last, true);
    reveal(cur.spans.length);
  }
  function skip() {                                   // ONE step: the rest of this page, else the next page whole
    if (!cur || stateNow() !== "busy") return;
    clearTimeout(cur.pending); cur.pending = 0;
    if (cur.shown < cur.pages[cur.page][1]) reveal(cur.pages[cur.page][1]);
    else if (cur.page + 1 < cur.pages.length) { setPage(cur.page + 1, true); sync(); }   // Next turns to the next page; its words come with the voice
    else reveal(cur.spans.length);
    cur.progress = performance.now();
  }
  // A voice that is not speechSynthesis (voice.js playing a recorded file, or a step of several lines) reports how far it
  // has got: the first `at` characters of `text` are spoken (at >= text.length: all of it). Same effect as a boundary event,
  // and the reading timer waits while reports keep coming. Ignored unless `text` is the caption on screen. (2026-11-15)
  function follow(text, at) {
    const me = cur;
    if (!me || text !== me.text) return false;
    me.voiced = true; me.heard = performance.now();
    let n = 0; while (n < me.starts.length && me.starts[n] <= at) n++;
    show(at >= text.length ? me.spans.length : n, true);
    return true;
  }
  window.captions = { state: stateNow, finish, skip, follow };
  setInterval(() => { if (cur && cur.shown >= cur.spans.length && document.documentElement.dataset.cap !== stateNow()) sync(); }, 150);   // the voice ended: Next can light up
  setInterval(() => { if (cur && stateNow() === "busy" && performance.now() - cur.progress > cur.spans.length * 600 + 3000) finish(); }, 500);   // Next never stays hidden for good

  const shown = b => b.getClientRects().length > 0 && getComputedStyle(b).visibility !== "hidden";   // really on screen (no display:none anywhere above it)
  const hasNext = () => {                             // a waiting Next in the bar, and no popup's button taking over as the forward control
    const all = [...document.querySelectorAll("[data-cap-next]")].filter(shown), bar = barOf();
    return all.some(b => bar && bar.contains(b)) && !all.some(b => !bar || !bar.contains(b));
  };
  const typing = t => t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable);
  document.addEventListener("click", e => {           // a tap on the caption bar speeds the text up (not its buttons)
    if (stateNow() !== "busy") return;
    const t = e.target, bar = barOf();
    if (!hasNext() && !(t.closest && t.closest("[data-cap-next][data-cap-wait]"))) return;
    if (!bar || !bar.contains(t)) return;               // a click outside the bar (a popup's button too) is the game's
    if (t.closest("button, a, input, select, textarea") && !mark.contains(t) && !t.closest("[data-cap-next]")) return;   // the bar's other buttons work as usual
    e.stopPropagation(); e.preventDefault(); skip();
  }, true);
  for (const type of ["pointerdown", "pointerup", "mousedown", "mouseup", "touchstart", "touchend"])   // a game listening for these must not fire either
    document.addEventListener(type, e => { if (stateNow() === "busy" && e.target.closest?.("[data-cap-next][data-cap-wait]")) e.stopPropagation(); }, true);
  const eaten = new Set();                            // keys we took on keydown: their keyup must not reach the game either
  addEventListener("keydown", e => {
    if (!/^(Enter| |ArrowRight)$/.test(e.key) || e.ctrlKey || e.metaKey || e.altKey || e.shiftKey || typing(e.target)) return;
    if (stateNow() !== "busy" || !hasNext()) return;
    e.stopImmediatePropagation(); e.preventDefault(); eaten.add(e.key);
    if (!e.repeat) skip();
  }, true);
  addEventListener("keyup", e => { if (eaten.delete(e.key)) { e.stopImmediatePropagation(); e.preventDefault(); } }, true);

  if ("speechSynthesis" in window) {                  // follow the voice, word by word, when it tells us
    const speak = speechSynthesis.speak.bind(speechSynthesis);
    speechSynthesis.speak = u => {
      const me = cur;
      if (me && u && u.text === me.text) {
        u.addEventListener("boundary", e => {
          if (cur !== me || (e.name && e.name !== "word")) return;
          me.voiced = true; me.heard = performance.now();
          let n = 0; while (n < me.starts.length && me.starts[n] <= e.charIndex) n++;
          show(n, true);
        });
        u.addEventListener("end", () => { if (cur === me) show(me.spans.length, true); });
        u.addEventListener("error", () => { if (cur === me) me.voiced = false; });   // cut off: the timer takes over
      }
      return speak(u);
    };
  }
})();
