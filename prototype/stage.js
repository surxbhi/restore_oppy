// stage.js: the scaled stage shared by every Restore Oppy page (owner, 2026-11-15: "Current HTML and canvas, plus a scaled stage").
// Load it right after house.css:   <link rel="stylesheet" href="house.css"><script src="stage.js"></script>
// The page's whole UI lives in ONE element marked data-stage (design size 1280 x 720):   <div id="app" data-stage> ... </div>
// stage.js scales that element as a single unit with a CSS transform to the largest size that fits the window
// (uniform scale, centred, letterboxed with the page background), and re-fits on resize, orientation change and
// visual-viewport changes (so it also fits inside the shell's iframe). A scale within 4% above a whole or half step
// (1, 1.5, 2, 2.5, 3...) snaps down to that step so pixel art stays crisp; otherwise the exact fit is used.
// It sets <html data-staged> and --stage-scale on <html>, fires "stage:fit" on window after every fit, and exposes
//   window.stage = { scale, width, height, fit(), toStage(clientX, clientY) }.
// Inside the stage, layout never depends on the real window: use px on the 1280 x 720 design, or cqw / cqh.
// Pointer maths: convert pointer to canvas coordinates with getBoundingClientRect (it already includes the transform):
//   const r = canvas.getBoundingClientRect(); x = (e.clientX - r.left) * canvas.width / r.width;
(() => {
  // The game starts from the map (owner, 2026-11-15: "just the main game"). On the live site a mini-game opened on its own,
  // not inside the map's mission window, goes to the main game. On localhost it still opens on its own, for testing.
  if (window.parent === window && /\/(track-detective|phoenix|insight|secret-in-the-stripes|ingenuity-flight-plan)(\.html)?$/i.test(location.pathname)
      && !/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)) { location.replace("/"); return; }
  const W = 1280, H = 720, SNAP = 0.04;
  const api = { scale: 1, width: W, height: H, fit, toStage };
  window.stage = api;
  const root = document.documentElement;
  let el = null, raf = 0;

  function pick(fitScale) {                       // prefer a whole or half step when we are within 4% above it
    const step = Math.floor(fitScale * 2) / 2;
    if (step >= 0.5 && fitScale - step <= fitScale * SNAP) return step;
    return fitScale;
  }
  function fit() {
    el = el || document.querySelector("[data-stage]");
    if (!el) return api.scale;
    const vw = root.clientWidth || innerWidth, vh = root.clientHeight || innerHeight;
    // The dev box floats over the window (see floatDev below): it never takes room from the stage.
    const s = pick(Math.min(vw / W, vh / H));
    const x = Math.round((vw - W * s) / 2), y = Math.round((vh - H * s) / 2);   // whole-pixel offsets: no blurry half pixels
    el.style.transform = `translate(${x}px, ${y}px) scale(${s})`;
    api.scale = s;
    root.style.setProperty("--stage-scale", String(s));
    root.dataset.staged = "";
    dispatchEvent(new CustomEvent("stage:fit", { detail: { scale: s } }));
    return s;
  }
  function toStage(clientX, clientY) {            // a window point in design pixels of the stage
    const r = (el || document.querySelector("[data-stage]"))?.getBoundingClientRect();
    if (!r) return { x: clientX, y: clientY };
    return { x: (clientX - r.left) / api.scale, y: (clientY - r.top) / api.scale };
  }
  const later = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(fit); };
  addEventListener("resize", later);
  addEventListener("orientationchange", later);
  if (window.visualViewport) visualViewport.addEventListener("resize", later);
  if (window.ResizeObserver) new ResizeObserver(later).observe(root);
  addEventListener("scroll", () => { if (scrollX || scrollY) scrollTo(0, 0); });   // the page never scrolls (a focus() can try)
  // ---- the floating dev box: the page's `body > .dev` becomes a small draggable, collapsible panel fixed to the WINDOW ----
  // Default (owner, 2026-11-15): the TOP-RIGHT corner of the window, collapsed to the "DEV" pill (click "+" to open), so it never covers the
  // caption bar's portrait and the start of the caption. A position / state saved in sessionStorage (key oppy.devbox) wins. Inside the shell's
  // iframe the shell's own dev box sits bottom-right, so the two never overlap.
  function floatDev() {
    const dev = document.querySelector("body > .dev");
    if (!dev || dev.dataset.floating) return;
    dev.dataset.floating = "1";
    const bar = document.createElement("span"); bar.className = "dev-bar";
    const grip = document.createElement("span"); grip.className = "dev-grip"; grip.textContent = "DEV"; grip.title = "Drag to move";
    const tog = document.createElement("button"); tog.type = "button"; tog.className = "dev-tog"; tog.setAttribute("aria-label", "Collapse the dev box"); tog.textContent = "\u2013";
    bar.append(grip, tog); dev.prepend(bar);
    [...dev.childNodes].forEach(n => { if (n !== bar && n.nodeType === 1 && n.tagName === "B" && /^DEV$/i.test(n.textContent.trim())) n.remove(); });   // the old inline "DEV" label
    const KEY = "oppy.devbox", ss = { get: () => { try { return JSON.parse(sessionStorage.getItem(KEY)) || {}; } catch { return {}; } }, set: v => { try { sessionStorage.setItem(KEY, JSON.stringify(v)); } catch {} } };
    let st = ss.get();
    const clamp = () => {
      const w = dev.offsetWidth, h = dev.offsetHeight, vw = root.clientWidth || innerWidth, vh = root.clientHeight || innerHeight;
      if (st.x == null) {                                                  // default: pinned to the top-right corner (anchored by `right`, so it stays there however wide it wraps)
        const y = Math.max(0, Math.min(st.y ?? 8, vh - h));
        dev.style.left = "auto"; dev.style.right = "8px"; dev.style.top = y + "px"; dev.style.bottom = "auto";
        return { x: Math.max(0, vw - w - 8), y };
      }
      let x = st.x, y = st.y ?? 8;
      x = Math.max(0, Math.min(x, vw - w)); y = Math.max(0, Math.min(y, vh - h));
      dev.style.left = x + "px"; dev.style.right = "auto"; dev.style.top = y + "px"; dev.style.bottom = "auto";
      return { x, y };
    };
    const collapsed = () => st.c ?? true;                                   // collapsed unless the saved state says otherwise
    const apply = () => { const c = collapsed(); dev.classList.toggle("dev-collapsed", c); tog.textContent = c ? "+" : "\u2013"; tog.setAttribute("aria-label", c ? "Expand the dev box" : "Collapse the dev box"); clamp(); };
    tog.addEventListener("click", () => { st = { ...st, c: !collapsed(), ...(st.x != null ? clamp() : {}) }; ss.set(st); apply(); });
    let drag = null;
    grip.addEventListener("pointerdown", e => { const r = dev.getBoundingClientRect(); drag = { dx: e.clientX - r.left, dy: e.clientY - r.top }; grip.setPointerCapture(e.pointerId); e.preventDefault(); });
    grip.addEventListener("pointermove", e => { if (!drag) return; st = { ...st, x: e.clientX - drag.dx, y: e.clientY - drag.dy }; st = { ...st, ...clamp() }; });
    const end = () => { if (drag) { drag = null; ss.set(st); } };
    grip.addEventListener("pointerup", end); grip.addEventListener("pointercancel", end);
    addEventListener("resize", apply);
    if (window.MutationObserver) new MutationObserver(apply).observe(dev, { attributes: true, attributeFilter: ["hidden"] });
    apply();
  }
  // ---- inside the shell's iframe: a "Map" button first in the game header, and the part-found nudge ----
  function mapButton() {
    // Also when a game is opened on its own (owner, 2026-11-15: "add the map button it disappeared"): then it goes to the map page.
    // Never on the map page itself.
    const framed = window.parent !== window;
    if (!framed && /restore-oppy\.html$/i.test(location.pathname)) return;
    const hdr = document.querySelector("[data-stage] .hdr, .hdr");
    if (!hdr || hdr.querySelector("#mapBtn")) return;
    const b = document.createElement("button"); b.type = "button"; b.id = "mapBtn"; b.className = "hbtn mapbtn";
    b.setAttribute("aria-label", "Back to the map"); b.textContent = "\u25C0 Map";
    b.addEventListener("click", () => {
      if (!framed) { location.href = "restore-oppy.html"; return; }
      try { parent.postMessage({ type: "restore-oppy:back-to-map" }, location.origin); } catch {}
    });
    hdr.prepend(b);
    if (!framed) return;
    addEventListener("message", e => {
      if (e.origin !== location.origin || e.source !== parent || !e.data) return;
      if (e.data.type === "restore-oppy:part-found") { b.classList.add("found"); b.textContent = "Part found! Back to the map \u25B6"; }
      else if (e.data.type === "restore-oppy:part-reset") { b.classList.remove("found"); b.textContent = "\u25C0 Map"; }
    });
  }

  // ---- ONE Full screen toggle in every page's header row (owner, 2026-11-15: "full screen can be a setting button at the top navigation layer for all games") ----
  // Standalone page: it fullscreens the page. Inside the shell's iframe: it asks the shell (postMessage, the same protocol as the Map button) to
  // fullscreen the SHELL (the iframe needs allow="fullscreen"), and the shell tells the game the state so the label follows. The shell page itself runs
  // both halves: it answers messages from the iframe it holds.
  const fsEl = () => document.fullscreenElement || document.webkitFullscreenElement || null;
  const fsCan = () => !!(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen);
  const target = () => location.origin === "null" ? "*" : location.origin;
  function fsToggle() {
    try {
      if (fsEl()) { (document.exitFullscreen || document.webkitExitFullscreen).call(document); }
      else { const d = document.documentElement, r = d.requestFullscreen || d.webkitRequestFullscreen, p = r && r.call(d); if (p && p.catch) p.catch(() => {}); }
    } catch {}
  }
  api.toggleFullscreen = fsToggle;
  const inFrame = () => window.parent !== window;
  function fullscreenButton() {
    const hdr = document.querySelector("[data-stage] .hdr, .hdr");
    if (!hdr || hdr.querySelector("#fsBtn")) return;
    const box = hdr.querySelector(".hdr-ctrls") || hdr;
    const b = document.createElement("button"); b.type = "button"; b.id = "fsBtn"; b.className = "hbtn fsbtn";
    let on = false;
    const paint = () => { b.textContent = on ? "Exit full screen" : "Full screen"; b.title = on ? "Leave full screen" : "Fill the whole screen"; };
    api.fsState = v => { on = !!v; paint(); };
    paint();
    b.addEventListener("click", () => {
      if (inFrame()) { try { parent.postMessage({ type: "restore-oppy:toggle-fullscreen" }, target()); } catch {} }
      else fsToggle();
    });
    box.append(b);
    if (!inFrame()) {
      if (!fsCan()) b.hidden = true;                                       // a device with no fullscreen API (iPhone Safari): no dead button
      const sync = () => { on = !!fsEl(); paint(); tellKids(); };
      document.addEventListener("fullscreenchange", sync); document.addEventListener("webkitfullscreenchange", sync);
    } else {
      try { parent.postMessage({ type: "restore-oppy:fullscreen-ask" }, target()); } catch {}
    }
  }
  function tellKids() {                                                    // the page that holds iframes (the shell): tell them whether it is full screen
    document.querySelectorAll("iframe").forEach(f => { try { f.contentWindow.postMessage({ type: "restore-oppy:fullscreen-state", on: !!fsEl() }, target()); } catch {} });
  }
  addEventListener("message", e => {
    if (!e.data || typeof e.data.type !== "string" || (location.origin !== "null" && e.origin !== location.origin)) return;
    if (e.source === parent && parent !== window && e.data.type === "restore-oppy:fullscreen-state") { if (api.fsState) api.fsState(e.data.on); return; }
    if (e.source === window) return;
    const kid = [...document.querySelectorAll("iframe")].some(f => f.contentWindow === e.source);
    if (!kid) return;
    if (e.data.type === "restore-oppy:toggle-fullscreen") fsToggle();
    else if (e.data.type === "restore-oppy:fullscreen-ask") tellKids();
  });
  // the main action (house.css .main-action) pulses until it is first pressed
  addEventListener("click", e => { const b = e.target && e.target.closest && e.target.closest(".main-action"); if (b) b.classList.add("pressed"); }, true);
  const start = () => { mapButton(); fullscreenButton(); floatDev(); fit(); };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
  addEventListener("load", fit, { once: true });

  // ---- zoomable story pictures: a click on any story picture opens a full-window viewer (no magnifier button; house.css gives the hover / focus state) ----
  const ZSEL = ".st-fig img, .st-frame img, img[data-zoom]";
  let viewer = null;
  function openViewer(img) {
    if (viewer) return;
    const opener = img, src = img.dataset.zoomSrc || img.currentSrc || img.src, fig = img.closest("figure"), cap = fig && fig.querySelector("figcaption");
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const el = document.createElement("div"); el.className = "zv"; el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); el.setAttribute("aria-label", "Zoomed picture");
    el.innerHTML = '<div class="zv-view" tabindex="0"><img class="zv-img" alt="" draggable="false"></div><div class="zv-bar"><div class="zv-cap"></div></div>' +
      '<div class="zv-tools"><button type="button" class="zv-btn" data-a="out" aria-label="Zoom out">−</button><button type="button" class="zv-btn" data-a="reset" aria-label="Fit the picture">⤢</button><button type="button" class="zv-btn" data-a="in" aria-label="Zoom in">+</button></div>' +
      '<button type="button" class="zv-btn zv-x" data-a="close" aria-label="Close the picture">✕</button>';
    const view = el.querySelector(".zv-view"), im = el.querySelector(".zv-img"), capBox = el.querySelector(".zv-cap");
    im.alt = img.alt || "";
    if (cap) { capBox.innerHTML = cap.innerHTML; capBox.querySelectorAll("a").forEach(a => { a.target = "_blank"; a.rel = "noopener"; }); }
    else capBox.textContent = img.alt || "";
    document.body.appendChild(el); viewer = el;
    let nw = 0, nh = 0, fit1 = 1, z = 1, tx = 0, ty = 0, steps = [1];
    const area = () => ({ w: view.clientWidth, h: view.clientHeight });
    const sc = () => fit1 * z;
    const clampPos = () => {
      const a = area(), w = nw * sc(), h = nh * sc();
      tx = w <= a.w ? (a.w - w) / 2 : Math.min(0, Math.max(a.w - w, tx));
      ty = h <= a.h ? (a.h - h) / 2 : Math.min(0, Math.max(a.h - h, ty));
    };
    const paint = (anim) => {
      clampPos(); im.style.transition = anim && !reduce ? "transform .16s ease-out" : "none";
      im.style.transform = `translate(${tx}px, ${ty}px) scale(${sc()})`;
      el.querySelector('[data-a="out"]').disabled = z <= 1.001; el.querySelector('[data-a="in"]').disabled = z >= steps[steps.length - 1] - 0.001;
      view.style.cursor = z >= steps[steps.length - 1] - 0.001 ? "grab" : "zoom-in";
    };
    const zoomTo = (nz, cx, cy, anim) => {
      const a = area(); if (cx == null) { cx = a.w / 2; cy = a.h / 2; }
      nz = Math.max(1, Math.min(steps[steps.length - 1], nz));
      const k = nz / z; tx = cx - (cx - tx) * k; ty = cy - (cy - ty) * k; z = nz; paint(anim);
    };
    const stepBy = (dir, cx, cy) => {
      const nxt = dir > 0 ? steps.find(v => v > z + 0.001) : [...steps].reverse().find(v => v < z - 0.001);
      zoomTo(nxt ?? (dir > 0 ? steps[steps.length - 1] : 1), cx, cy, true);
    };
    const reset = () => { z = 1; tx = ty = 0; paint(true); };
    const layout = () => {
      const a = area(); if (!nw) return;
      fit1 = Math.min(a.w / nw, a.h / nh, 1e9);
      const maxZ = Math.max(1, 2 / fit1);                         // up to twice the picture's natural resolution
      steps = [1, 2, 4].filter(v => v < maxZ - 0.05).concat(maxZ);
      z = Math.min(z, maxZ); paint(false);
    };
    im.onload = () => { nw = im.naturalWidth; nh = im.naturalHeight; im.style.width = nw + "px"; im.style.height = nh + "px"; layout(); };
    im.src = src;
    const onResize = () => layout(); addEventListener("resize", onResize);
    // pointer: drag to pan, click to zoom in a step, two fingers to pinch
    const ptrs = new Map(); let moved = 0, pinch0 = 0, pz0 = 1;
    view.addEventListener("pointerdown", e => { view.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); moved = 0;
      if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch0 = Math.hypot(a.x - b.x, a.y - b.y); pz0 = z; } });
    view.addEventListener("pointermove", e => {
      const p = ptrs.get(e.pointerId); if (!p) return;
      const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
      if (ptrs.size === 2) { const [a, b] = [...ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y), r = view.getBoundingClientRect();
        if (pinch0) zoomTo(pz0 * d / pinch0, (a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top, false); moved = 99; return; }
      moved += Math.abs(dx) + Math.abs(dy); tx += dx; ty += dy; paint(false);
    });
    const up = e => { const was = ptrs.size; ptrs.delete(e.pointerId); if (was === 1 && moved < 5 && e.type === "pointerup") { const r = view.getBoundingClientRect(); stepBy(1, e.clientX - r.left, e.clientY - r.top); } };
    view.addEventListener("pointerup", up); view.addEventListener("pointercancel", up);
    view.addEventListener("dblclick", e => { e.preventDefault(); reset(); });
    view.addEventListener("wheel", e => { e.preventDefault(); const r = view.getBoundingClientRect(); zoomTo(z * Math.exp(-e.deltaY * 0.0018), e.clientX - r.left, e.clientY - r.top, false); }, { passive: false });
    // backdrop: a click outside the picture closes it; the bar and tools do not
    el.addEventListener("click", e => {
      e.stopPropagation();
      const b = e.target.closest("[data-a]");
      if (b) { const a = b.dataset.a; if (a === "close") close(); else if (a === "in") stepBy(1); else if (a === "out") stepBy(-1); else if (a === "reset") reset(); return; }
      if (e.target === view) { const r = im.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) close(); }
    });
    for (const t of ["pointerdown", "pointerup", "mousedown", "mouseup", "touchstart", "touchend", "wheel"]) el.addEventListener(t, e => e.stopPropagation());
    const focusables = () => [...el.querySelectorAll("button:not(:disabled), a[href], .zv-view")];
    const onKey = e => {
      if (!viewer) return;
      const k = e.key, t = e.target, onBtn = t && t.closest && t.closest("button, a");
      if (e.type === "keydown") {
        if (k === "Escape") { close(); e.preventDefault(); }
        else if (k === "Tab") { const f = focusables(), i = f.indexOf(document.activeElement); const n = e.shiftKey ? (i <= 0 ? f.length - 1 : i - 1) : (i + 1) % f.length; f[n].focus(); e.preventDefault(); }
        else if (k === "+" || k === "=") { stepBy(1); e.preventDefault(); }
        else if (k === "-" || k === "_") { stepBy(-1); e.preventDefault(); }
        else if (k === "0") { reset(); e.preventDefault(); }
        else if (/^Arrow/.test(k)) { const d = { ArrowLeft: [60, 0], ArrowRight: [-60, 0], ArrowUp: [0, 60], ArrowDown: [0, -60] }[k]; tx += d[0]; ty += d[1]; paint(true); e.preventDefault(); }
        else if ((k === "Enter" || k === " ") && !onBtn) { stepBy(1); e.preventDefault(); }
      }
      e.stopImmediatePropagation();                                   // the game and captions.js never see a key while the viewer is open
    };
    addEventListener("keydown", onKey, true); addEventListener("keyup", onKey, true); addEventListener("keypress", onKey, true);
    function close() {
      removeEventListener("keydown", onKey, true); removeEventListener("keyup", onKey, true); removeEventListener("keypress", onKey, true); removeEventListener("resize", onResize);
      el.remove(); viewer = null; try { opener.focus({ preventScroll: true }); } catch {}
    }
    el.querySelector('[data-a="close"]').focus();
  }
  function zoomify(img) {
    if (img.dataset.zoomed || img.closest(".zv") || img.closest("video")) return;
    img.dataset.zoomed = "1";
    img.setAttribute("role", "button"); img.tabIndex = 0; img.setAttribute("aria-label", "Zoom picture"); img.classList.add("zoomable");
    img.addEventListener("click", e => { e.preventDefault(); openViewer(img); });
    img.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); openViewer(img); } });
  }

  // ---- story videos (owner, 2026-11-15: "the Phoenix landing-day video isn't playing") ----
  // A story <video> autoplays muted and loops. If it is still paused about 1.5 s after it is shown (play() rejected or not), the large
  // play button (.vid-play, house.css) appears over it; play() is retried on `canplay`. Automatic for every video inside .st-frame / .st-fig
  // or marked data-story-video; a game that builds its video some other way can call stage.storyVideo(videoElement). Safe to call twice.
  const VSEL = ".st-frame video, .st-fig video, video[data-story-video]";
  function storyVideo(v) {
    if (!v || v.dataset.sv) return; v.dataset.sv = "1";
    // data-sound (owner, 2026-11-15: the marsquake clip's sound is the point): play WITH sound. If the browser refuses sound before a
    // user gesture, play muted and turn the sound on at the next click or key press anywhere.
    const wantSound = v.hasAttribute("data-sound");
    v.muted = true; v.defaultMuted = true;          // a data-sound video gets its sound once the voice has finished (below) v.loop = true; v.autoplay = true; v.playsInline = true; v.setAttribute("playsinline", "");
    v.setAttribute("muted", "");
    const host = v.parentElement; if (host && getComputedStyle(host).position === "static") host.style.position = "relative";
    let btn = null, tries = 0, waiting = false;
    const unmuteOnGesture = () => {
      if (waiting) return; waiting = true;
      const on = () => { removeEventListener("pointerdown", on, true); removeEventListener("keydown", on, true); waiting = false; if (v.isConnected) { v.muted = false; if (v.paused) tryPlay(); } };
      addEventListener("pointerdown", on, true); addEventListener("keydown", on, true);
    };
    const tryPlay = () => {
      try {
        const p = v.play();
        if (p && p.catch) p.catch(() => { if (wantSound && !v.muted) { v.muted = true; unmuteOnGesture(); try { const q = v.play(); if (q && q.catch) q.catch(() => {}); } catch {} } });
      } catch {}
    };
    const showBtn = () => {
      if (btn || !v.isConnected) return;
      btn = document.createElement("button"); btn.type = "button"; btn.className = "vid-play"; btn.setAttribute("aria-label", "Play the video"); btn.textContent = "▶";
      btn.addEventListener("click", e => { e.preventDefault(); e.stopPropagation(); v.muted = !wantSound; tryPlay(); });
      v.after(btn);
    };
    const hideBtn = () => { if (btn) { btn.remove(); btn = null; } };
    v.addEventListener("canplay", () => { if (v.paused) tryPlay(); });
    v.addEventListener("playing", hideBtn);
    const check = () => {
      if (!v.isConnected) return;
      if (!v.paused && !v.ended) return hideBtn();
      if (v.getClientRects().length) showBtn();                    // really on screen, and still paused
      else if (++tries < 8) setTimeout(check, 1500);               // not shown yet: look again
    };
    if (wantSound) {                                 // a video with its own sound waits for the voice: it plays muted while a character speaks,
      v.muted = true; let waited = 0;                // then restarts from the beginning WITH its sound (owner, 2026-11-15)
      const sound = () => {
        if (!v.isConnected) return;
        const talking = !!(window.Voice && Voice.talking && Voice.talking());
        if (talking && waited++ < 600) return setTimeout(sound, 100);   // at most 60 s
        v.currentTime = 0; v.muted = false;
        try { const p = v.play(); if (p && p.catch) p.catch(() => { v.muted = true; unmuteOnGesture(); tryPlay(); }); } catch {}
      };
      setTimeout(sound, 400);
    }
    tryPlay(); setTimeout(check, 1500);
  }
  // the REAL PHOTO / REAL VIDEO tags are gone (owner, 2026-11-15); a label stays only on drawings and charts. A game that still writes one gets it dropped here.
  const REALTAG = /^\s*REAL\s+(PHOTO|VIDEO)S?\b/i;
  function dropPhotoTags() { document.querySelectorAll(".st-tag").forEach(t => { if (REALTAG.test(t.textContent)) t.remove(); }); }
  api.zoom = img => zoomify(img); api.storyVideo = storyVideo;
  const scanZoom = () => { document.querySelectorAll(ZSEL).forEach(zoomify); document.querySelectorAll(VSEL).forEach(storyVideo); dropPhotoTags(); };
  const startZoom = () => { scanZoom(); if (window.MutationObserver) new MutationObserver(() => scanZoom()).observe(document.body, { childList: true, subtree: true }); };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", startZoom, { once: true }); else startZoom();
})();
