// Shared by every Restore Oppy page: the "You earned this!" mystery-crate reveal. Load with <script src="giftbox.js"></script>, then
//   giftBox({ name: "Camera mast", line: "It lets Oppy look around.", draw: (ctx, w, h, t) => {...} }).then(() => ...)
// Light rays fade in, a purple-and-gold "?" crate drops in, bobs and shakes (tap / click / Enter / Space opens it sooner), the lid
// swings open on a back hinge, light pours out and the part rises out of the box. The promise resolves when the button is pressed.
// Options: size [w,h] (default 96x72; drawn at 1 px = 1 px then scaled up by a whole number), button, fast (or ?fast=1).
// Extras: giftBox.isOpen(), giftBox.close(). No images, no sound, no storage, no network.
(() => {
  const W = 320, H = 300, CX = 160, BY = 288;         // canvas size, box centre x, box base y
  const BODY = 88, HINGE = 112, LIDD = 24, LIDL = 56; // box body height, hinge height, lid apparent depth / real length
  const OPEN_ANG = 2.09;                              // lid ends about 120 degrees back
  const T_READY = 1.9;                                // seconds until the crate opens by itself
  let cur = null;                                     // the open overlay's state

  function addCss() {
    if (document.getElementById("gb-css")) return;
    const s = document.createElement("style"); s.id = "gb-css";
    s.textContent = `
      .gb-over { position: fixed; inset: 0; z-index: 2147483000; display: flex; flex-direction: column; align-items: center; justify-content: center;
        gap: 6px; padding: 8px 12px; overflow: hidden; color: #f6f0ff; text-align: center; touch-action: manipulation;
        font-family: "Jersey 15", system-ui, sans-serif;
        background: radial-gradient(ellipse at 50% 40%, #3b2266f2 0%, #1b1433f7 75%); }
      .gb-cv { width: min(94vw, 600px, calc(56vh * 320 / 300)); aspect-ratio: 320 / 300; image-rendering: pixelated; display: block; flex: 0 1 auto; }
      .gb-txt { min-height: 0; display: flex; flex-direction: column; align-items: center; gap: 6px; max-width: 92vw; }
      .gb-h { margin: 0; font-size: clamp(28px, 7vw, 44px); font-weight: 700; color: #fff27a; text-shadow: 0 0 18px #fff27a88; }
      .gb-n { margin: 0; font-size: clamp(22px, 5vw, 30px); font-weight: 600; color: #7ff7ff; }
      .gb-l { margin: 0; font-family: "Atkinson Hyperlegible", system-ui, sans-serif; font-size: clamp(16px, 3.6vw, 21px); color: #f6f0ff; max-width: 34em; }
      .gb-b { height: 64px; padding: 0 28px; border-radius: 16px; border: 3px solid #b8ff7a; background: linear-gradient(180deg, #b8ff7a, #6fe08a);
        color: #1b1433; font: inherit; font-size: clamp(22px, 5vw, 28px); font-weight: 700; cursor: pointer; box-shadow: 0 0 22px #b8ff7a88; }
      .gb-b:focus-visible { outline: 3px solid #fff; outline-offset: 3px; }
      .gb-h, .gb-n, .gb-l, .gb-b { opacity: 0; visibility: hidden; transform: translateY(8px); transition: opacity .35s, transform .35s, visibility 0s .35s; }
      .gb-on { opacity: 1 !important; visibility: visible !important; transform: none !important; transition: opacity .35s, transform .35s, visibility 0s !important; }
      @media (prefers-reduced-motion: reduce) { .gb-h, .gb-n, .gb-l, .gb-b { transition: none; transform: none; } }`;
    document.head.append(s);
  }

  const rnd = (a, b) => a + Math.random() * (b - a);
  const cl = x => Math.max(0, Math.min(1, x));
  const smooth = u => u * u * (3 - 2 * u);
  const outBack = u => { const c = 1.9; return 1 + (c + 1) * Math.pow(u - 1, 3) + c * Math.pow(u - 1, 2); };
  const COLORS = ["#fff27a", "#7ff7ff", "#ff7ad9", "#b8ff7a", "#c6a8ff", "#ffffff"];
  const Q = ["01110", "10001", "00001", "00110", "00100", "00000", "00100"];   // the "?" in pixels

  function giftBox(opts) {
    opts = opts || {};
    if (cur) cur.finish();                            // a second call replaces the first
    addCss();
    const size = opts.size || [96, 72], pw = size[0], ph = size[1];
    const PF = Math.max(1, Math.min(Math.floor(150 / ph), Math.round(0.6 * W / pw)));   // whole-number scale for the part
    const fast = !!opts.fast || /[?&]fast=1\b/.test(location.search);
    const still = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);

    const over = document.createElement("div"); over.className = "gb-over";
    over.setAttribute("role", "dialog"); over.setAttribute("aria-modal", "true"); over.setAttribute("aria-label", "You earned this!");
    const cv = document.createElement("canvas"); cv.className = "gb-cv"; cv.width = W; cv.height = H; cv.setAttribute("aria-hidden", "true");
    const txt = document.createElement("div"); txt.className = "gb-txt";
    const h = document.createElement("h2"); h.className = "gb-h"; h.textContent = "You earned this!";
    const n = document.createElement("p"); n.className = "gb-n"; n.textContent = opts.name || "";
    const l = document.createElement("p"); l.className = "gb-l"; l.textContent = opts.line || "";
    const b = document.createElement("button"); b.type = "button"; b.className = "gb-b"; b.textContent = opts.button || "Fit it on Oppy ▶";
    txt.append(h, n); if (opts.line) txt.append(l); txt.append(b);
    over.append(cv, txt);
    // Leave the page's header row (◀ Map, Voice, Full screen) uncovered and clickable (owner, 2026-11-15).
    const hdr = document.querySelector(".hdr");
    if (hdr) {
      const fit = () => { if (!over.isConnected && over.dataset.placed) { removeEventListener("resize", fit); return; } over.dataset.placed = 1; over.style.top = Math.max(0, Math.round(hdr.getBoundingClientRect().bottom + 4)) + "px"; };
      fit(); addEventListener("resize", fit);
    }
    document.body.append(over);
    const ctx = cv.getContext("2d"); ctx.imageSmoothingEnabled = false;

    let resolve; const done = new Promise(r => { resolve = r; });
    const S = { raf: 0, finished: false };
    let t0 = performance.now(), openAt = fast ? 0 : -1, shown = 0, parts = [], buttonUp = false, burstDone = false, dim = 0;
    const reduced = still && !fast;
    if (reduced) setTimeout(() => { if (!S.finished && openAt < 0) open(); }, 500);

    function reveal(k) {                              // 1 heading, 2 name+line, 3 button
      if (k <= shown) return;
      if (k >= 1 && shown < 1) h.classList.add("gb-on");
      if (k >= 2 && shown < 2) { n.classList.add("gb-on"); l.classList.add("gb-on"); }
      if (k >= 3 && shown < 3) { b.classList.add("gb-on"); buttonUp = true; try { b.focus({ preventScroll: true }); } catch (e) { b.focus(); } }
      shown = k;
    }
    function open() {
      if (openAt >= 0 || S.finished) return;
      openAt = (performance.now() - t0) / 1000; window.SFX && SFX.play("gift");
    }
    if (fast) reveal(3);

    function add(x, y, vx, vy, life, c, s, g) { parts.push({ x, y, vx, vy, life, age: 0, c: c || COLORS[(Math.random() * 6) | 0], s: s || (Math.random() < 0.3 ? 3 : 2), g: g === undefined ? 140 : g }); }
    function spark(x, y, c, s) { ctx.fillStyle = c; ctx.fillRect(x | 0, y | 0, s, s); if (s > 2) { ctx.fillRect((x | 0) - 2, (y | 0) + 1, 7, 1); ctx.fillRect((x | 0) + 1, (y | 0) - 2, 1, 7); } }

    const mix = (hex, k) => { if (!k) return hex; const v = parseInt(hex.slice(1), 16), m = (a, c) => Math.round(a + (c - a) * k);
      return "rgb(" + m(v >> 16, 27) + "," + m((v >> 8) & 255, 20) + "," + m(v & 255, 51) + ")"; };
    const C = hex => mix(hex, dim);
    const R = (x, y, w, h2, hex) => { ctx.fillStyle = C(hex); ctx.fillRect(x, y, w, h2); };

    // The crate, in its own units: x -64..64, y 0 (base) up to -88 (front top edge); hinge at y -112. `mid` draws the part (clipped to above the front edge).
    function drawBox(sc, dx, dy, tilt, ang, glow, mid) {
      ctx.save(); ctx.translate(Math.round(CX + dx), Math.round(BY + dy)); ctx.rotate(tilt); ctx.scale(sc, sc);
      // back rim and inside of the box
      R(-66, -HINGE - 4, 132, 30, "#1b1433"); R(-64, -HINGE - 2, 128, 28, "#2a1850");
      if (ang > 0.05) {
        ctx.globalAlpha = cl(ang * 2) * (0.55 + 0.45 * glow);
        R(-58, -HINGE + 2, 116, 22, "#fff7c0"); R(-44, -HINGE + 4, 88, 8, "#ffffff"); R(-20, -HINGE + 14, 40, 4, "#ffe566");
        ctx.globalAlpha = 1;
      }
      R(-64, -HINGE - 4, 128, 4, "#f5c542");
      // lid: a flat panel hinged along the back edge, swinging up and over
      const yf = -HINGE + LIDD * Math.cos(ang) - LIDL * Math.sin(ang), yt = Math.min(-HINGE, yf), lh = Math.max(4, Math.abs(yf + HINGE));
      R(-68, yt, 136, lh, "#1b1433");
      R(-66, yt + 2, 132, lh - 4, "#f5c542");
      R(-62, yt + 5, 124, Math.max(0, lh - 10), ang < 1.5708 ? "#8a5fd0" : "#3a2370");
      if (ang < 1.5708 && lh > 14) { R(-4, yt + 5, 8, lh - 10, "#f5c542"); R(-62, yt + 5, 124, 3, "#a97fe8"); }
      const by = yf > -HINGE ? yf - 10 : yf, bh = Math.min(10, lh);
      R(-68, by, 136, bh, "#c99a1e"); R(-68, by, 136, 3, "#f5c542");
      if (mid) {
        ctx.save(); ctx.beginPath(); ctx.rect(-400, -900, 800, 900 - BODY); ctx.clip();
        ctx.setTransform(1, 0, 0, 1, 0, 0); mid(); ctx.restore();
      }
      // front face
      R(-66, -BODY - 2, 132, BODY + 4, "#1b1433");
      R(-64, -BODY, 128, BODY, "#6b3fb0");
      R(-64, -BODY, 6, BODY, "#8a5fd0"); R(-64, -8, 128, 8, "#4a2a86");
      R(-64, -BODY, 128, 4, "#8a5fd0"); R(-58, -BODY + 4, 4, BODY - 12, "#7a4fc0");
      for (const x of [-44, 40]) { R(x, -BODY + 6, 4, BODY - 14, "#5a3399"); }
      R(-64, -6, 128, 6, "#c99a1e"); R(-64, -6, 128, 2, "#f5c542");
      for (const sx of [-1, 1]) {                                           // gold corner brackets and bolts
        const x0 = sx < 0 ? -64 : 50;
        R(x0, -BODY, 14, 6, "#f5c542"); R(sx < 0 ? -64 : 58, -BODY, 6, 20, "#f5c542");
        R(sx < 0 ? -56 : 50, -BODY + 8, 4, 4, "#fff7c0"); R(sx < 0 ? -56 : 50, -18, 4, 4, "#fff7c0");
      }
      R(-35, -81, 70, 74, "#c99a1e"); R(-32, -78, 64, 68, "#ffe566"); R(-32, -78, 64, 4, "#fff7c0"); R(-32, -14, 64, 4, "#f5c542");
      for (let r = 0; r < 7; r++) for (let c = 0; c < 5; c++) if (Q[r][c] === "1") R(-20 + c * 8, -72 + r * 8, 8, 8, "#3a1a70");
      ctx.restore();
    }

    const lc = document.createElement("canvas"); lc.width = W; lc.height = H; const lx = lc.getContext("2d");
    let last = t0;
    function frame(now) {
      if (S.finished) return;
      S.raf = requestAnimationFrame(frame);
      const t = (now - t0) / 1000, dt = Math.min(0.05, (now - last) / 1000); last = now;
      ctx.clearRect(0, 0, W, H);
      const opened = openAt >= 0, since = opened ? t - openAt : 0, vis = reduced ? 99 : since;   // vis = animation progress (jumps to the end if motion is reduced)

      // pose of the crate before it opens: drop, bounce, bob, tilt, shake
      const tp = fast ? 1 : opened ? Math.max(0.9, openAt) : t;
      let dy = 0, dx = 0, tilt = -0.05, vis_c = 1;
      if (!reduced) {
        if (tp < 0.35) vis_c = 0;
        else if (tp < 0.65) { const u = (tp - 0.35) / 0.3; dy = -300 * (1 - u * u); }
        else if (tp < 0.9) dy = -26 * Math.sin(Math.PI * (tp - 0.65) / 0.25);
        else { dy = Math.sin((tp - 0.9) * 3.2) * 4; tilt += Math.sin((tp - 0.9) * 2.4) * 0.04; }
        const sh = cl((tp - 1.3) / 0.6);
        tilt += Math.sin(tp * 50) * 0.05 * sh; dx = Math.sin(tp * 61) * 3 * sh;
        if (opened) { const f = Math.max(0, 1 - since / 0.25); dy *= f; dx *= f; tilt *= f; }
      }
      const sc = opened ? 1.5 - 0.5 * smooth(cl((vis - 0.4) / 0.8)) : 1.5;
      const ang = opened ? OPEN_ANG * outBack(cl(vis / 0.5)) : 0;
      const frontTop = BY - BODY * sc, ox = CX, oy = BY - (HINGE - 6) * sc;
      const rise = opened ? 1 - Math.pow(1 - cl((vis - 0.45) / 0.9), 3) : 0;
      dim = opened ? 0.5 * smooth(cl((vis - 1.3) / 0.5)) : 0;
      const glow = opened ? Math.max(0.2, 1 - Math.max(0, vis - 0.2) / 1.8) : 0;

      // light rays and beams: drawn on their own layer, faded to nothing well inside the canvas edge, then laid behind the box
      lx.clearRect(0, 0, W, H);
      const rayK = reduced ? 1 : cl(t / 0.7), boost = opened ? 1 + 0.7 * glow : 1, cy = 160;
      if (rayK > 0) {
        lx.save(); lx.translate(CX, cy); lx.rotate(still ? 0.3 : t * 0.22);
        lx.globalAlpha = 0.32 * rayK * boost * (1 - dim * 0.8);
        const rg = lx.createRadialGradient(0, 0, 0, 0, 0, 175); rg.addColorStop(0, "#fff2a0"); rg.addColorStop(0.75, "#fff2a0"); rg.addColorStop(1, "rgba(255,242,160,0)"); lx.fillStyle = rg;
        const N = 14;
        for (let i = 0; i < N; i++) { const a0 = i * 6.2832 / N; lx.beginPath(); lx.moveTo(0, 0); lx.lineTo(Math.cos(a0) * 440, Math.sin(a0) * 440);
          lx.lineTo(Math.cos(a0 + 3.1416 / N) * 440, Math.sin(a0 + 3.1416 / N) * 440); lx.closePath(); lx.fill(); }
        lx.restore();
        const g = lx.createRadialGradient(CX, cy, 10, CX, cy, 160);
        g.addColorStop(0, "rgba(255,244,160," + (0.45 * rayK * boost / 1.7).toFixed(3) + ")"); g.addColorStop(1, "rgba(255,244,160,0)");
        lx.fillStyle = g; lx.fillRect(0, 0, W, H);
      }

      // light pouring out of the open box
      if (opened && glow > 0) {
        lx.save(); lx.fillStyle = "#fff6b0";
        const shimmer = reduced ? 0 : Math.sin(t * 18) * 0.04;
        lx.globalAlpha = Math.max(0, (0.3 * glow + shimmer) * cl(vis / 0.2)) * (1 - dim);
        for (let i = -3; i <= 3; i++) { lx.beginPath(); lx.moveTo(ox + i * 14 * sc, oy); lx.lineTo(ox + i * 14 * sc + 10, oy);
          lx.lineTo(ox + i * 70 + 24, oy - 420); lx.lineTo(ox + i * 70 - 24, oy - 420); lx.closePath(); lx.fill(); }
        lx.restore();
      }
      lx.globalCompositeOperation = "destination-in";
      const mk = lx.createRadialGradient(0, 0, 0, 0, 0, 1); mk.addColorStop(0, "#fff"); mk.addColorStop(0.55, "#fff"); mk.addColorStop(1, "rgba(255,255,255,0)");
      lx.save(); lx.translate(CX, 150); lx.scale(136, 128); lx.fillStyle = mk; lx.fillRect(-6, -6, 12, 12); lx.restore();
      lx.globalCompositeOperation = "source-over";
      ctx.drawImage(lc, 0, 0);

      // the part: halo, then drawn clipped by the front of the box so it comes out of it
      const part = () => {
        const e = rise, s = PF * (0.4 + 0.6 * e), floatY = reduced ? 0 : Math.sin(since * 2.2) * 5 * e, floatX = 0;
        const top = (frontTop + 6) + (22 - (frontTop + 6)) * e + floatY, left = CX - pw * s / 2 + floatX;
        if (e > 0.02) { const g = ctx.createRadialGradient(CX, top + ph * s / 2, 10, CX, top + ph * s / 2, 85);
          g.addColorStop(0, "rgba(255,244,160," + (0.35 * e).toFixed(3) + ")"); g.addColorStop(1, "rgba(255,244,160,0)"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
        ctx.save(); ctx.translate(Math.round(left), Math.round(top)); ctx.scale(s, s);
        ctx.beginPath(); ctx.rect(0, 0, pw, ph); ctx.clip();
        try { if (typeof opts.draw === "function") opts.draw(ctx, pw, ph, still ? 0 : since); } catch (e2) { console.error(e2); }
        ctx.restore();
        S.partY = top + ph * s / 2;
      };

      if (vis_c) drawBox(sc, dx, dy, tilt, ang, glow, opened && rise > 0 ? part : null);

      // sparkles
      if (opened && !burstDone && !reduced) { burstDone = true; for (let i = 0; i < 40; i++) add(ox + rnd(-50, 50), oy, rnd(-60, 60), -rnd(60, 220), rnd(0.6, 1.3)); }
      if (!reduced) {
        if (opened && since < 1.0) for (let i = 0; i < 2; i++) add(ox + rnd(-55, 55), oy, rnd(-40, 40), -rnd(80, 240), rnd(0.5, 1.0));
        if (opened && since > 1.1 && since < 3.2 && Math.random() < 0.3) { const a = rnd(0, 6.283), r = rnd(50, 110); add(CX + Math.cos(a) * r, (S.partY || 100) + Math.sin(a) * r * 0.7, rnd(-8, 8), rnd(-14, -4), rnd(0.8, 1.5), 0, 0, 0); }
        if (!opened && tp > 0.9 && Math.random() < 0.12) add(CX + rnd(-110, 110), rnd(90, 260), rnd(-8, 8), -rnd(8, 20), rnd(0.6, 1.1), 0, 2, 0);
      }
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i]; p.age += dt;
        if (p.age >= p.life) { parts.splice(i, 1); continue; }
        p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt * 0.3;
        if (p.age / p.life < 0.85 || ((p.age * 20) | 0) % 2) spark(p.x, p.y, p.c, p.s);
      }
      if (opened && !reduced && since < 0.25) { ctx.fillStyle = "#ffffff"; ctx.globalAlpha = 0.3 * (1 - since / 0.25); ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }

      if (opened && !buttonUp) { if (since > 0.9) reveal(1); if (since > 1.2) reveal(2); if (since > 1.5) reveal(3); }
      if (!opened && !reduced && t >= T_READY) open();
    }

    function finish() {
      if (S.finished) return;
      S.finished = true; cancelAnimationFrame(S.raf);
      window.removeEventListener("keydown", onKey, true);
      over.remove();
      if (cur === S) cur = null;
      resolve();
    }
    function onKey(e) {
      if (e.key !== "Enter" && e.key !== " " && e.key !== "Spacebar") return;
      e.preventDefault(); e.stopPropagation();
      if (e.repeat) return;
      if (buttonUp) finish(); else if (openAt < 0) open(); else reveal(3);
    }
    S.finish = finish;
    window.addEventListener("keydown", onKey, true);
    cv.addEventListener("pointerdown", () => { if (openAt < 0) open(); });
    over.addEventListener("pointerdown", () => { if (openAt < 0) open(); });
    b.addEventListener("click", finish);
    cur = S;
    S.raf = requestAnimationFrame(frame);
    return done;
  }

  giftBox.isOpen = () => !!cur;
  giftBox.close = () => { if (cur) cur.finish(); };
  window.giftBox = giftBox;
})();
