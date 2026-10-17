/* =====================================================================================
   V7_ROBOTS — shared "PAPEL RECORTADO" paper-cut helpers + THE 5 AI ROBOTS for video #7 (EXPEDIENTE 007)
   Written by the B2 agent. Include AFTER the engine:  <script src="v7_robots.js"></script>
   Everything takes an explicit 2D context `c` (pass the engine's global `ctx`), so it works in any engine copy.
   No logos ever. Robots differ ONLY by color (+ optional name plaque with the name only).

   COLORS / IDS  V7R.IDS = ['chatgpt','grok','claude','gemini','deepseek']
     V7R.COL[id] = {body, dark, rim, eye, glow, name}   chatgpt=green, grok=black(white eyes), claude=orange,
     gemini=blue, deepseek=purple. Extra id 'neutral' = generic cream robot ("una IA", not one of the 5).  V7R.COL[id].name = plaque text ('CHATGPT','GROK','CLAUDE','GEMINI','DEEPSEEK').

   ROBOT
     V7R.robot(c, x, yFeet, s, id, o) -> {head:{x,y}, handL:{x,y}, handR:{x,y}, top:y}
       Feet on the ground at (x, yFeet). Total height ≈ 330*s (feet→antenna ball). Width ≈ 180*s (head).
       o.t        seconds (needed for stop-motion jitter + blink + antenna glow)
       o.stop     (default true) stop-motion: pose/jitter update on 12 fps steps (hold 2 frames), ±1.5px, ±0.5°
       o.seed     per-robot jitter seed (default derived from id)
       o.look     [lx,ly] -1..1 eye direction          o.eyes 'open'|'happy'|'closed'|'wide'|'squint'|'side'
       o.mouth    'flat'|'smile'|'o'|'sad'|'none'       o.talk 0..1 (opens the mouth bar, lip-sync)
       o.blink    true (default) auto blinks             o.glow 0..1.5 face-screen glow strength (default 1)
       o.armL/armR angle in radians from hanging down; positive = raised outward/sideways (PI ≈ straight up).
       o.handFn   (c, hx, hy, side) draw a prop at a hand (after the arm, before nothing else)
       o.tilt     head tilt rad     o.lean body lean rad     o.bob extra vertical px (screen)
       o.plaque   true → small paper name plaque on the ground in front of the feet (name only)
       o.shadow   (default true) soft drop shadows between paper layers     o.dim 0..1 darken (silhouette-ish, via c.filter)
       o.alpha    overall alpha      o.flip mirror horizontally (arms swap)
     V7R.lineup(c, cx, yFeet, s, gap, o, per) draws all 5 in order (per[id] overrides o per robot). Returns positions.
     V7R.plaque(c, x, y, s, id, o)   paper name plaque centred at (x,y) (o.rot, o.alpha).

   PAPER HELPERS (use for props/sets so every block shares the look)
     V7R.fiberPattern(c)     cached paper-fiber pattern (procedural, baked once)
     V7R.roughRR(x,y,w,h,r,seed,amp,step) -> Path2D rounded rect with slightly irregular cut edge
     V7R.roughPoly(pts,seed,amp,step,closed=true) -> Path2D polygon with irregular cut edge
     V7R.paper(c, path, col, o)   fill a Path2D as a paper piece: drop shadow (o.sh px offset, def 8; o.blur def 14;
                                  o.shA def .45), lighter rim (o.rim col or auto, o.rimW def 3), fiber texture (o.tex .22),
                                  o.grad [top,bottom] colors instead of flat col, o.alpha
     V7R.backlight(c, x, y, r, col, a)  warm/colored radial glow (screen blend) behind back layers
     V7R.vignette(c, W, H, a)     light vignette
     V7R.step(t, fps=12)          stop-motion quantised time      V7R.jit(t, seed, amp) -> {x,y,r} stop-motion jitter
     V7R.hash(a, b)               deterministic 0..1
     V7R.confetti(c, x, y, w, h, p, seed, cols, o)  paper fragments bursting/flying out of a box (0..1 progress)
     V7R.lever(c, x, yBase, s, ang, o)  big railway switch LEVER (ang -0.6..0.6 rad, 0 = upright); o.knob col
     V7R.paperPerson(c, x, yFeet, s, o) tiny paper person (o.col, o.tied:true draws rope, o.seed)
   ===================================================================================== */
(function () {
  const TAU = Math.PI * 2;
  const hash = (a, b = 0) => { const s = Math.sin(a * 127.1 + b * 311.7 + 74.7) * 43758.5453; return s - Math.floor(s); };
  const shade = (hex, f) => { // f>0 lighten, f<0 darken
    const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    if (f >= 0) { r += (255 - r) * f; g += (255 - g) * f; b += (255 - b) * f; } else { r *= 1 + f; g *= 1 + f; b *= 1 + f; }
    return `rgb(${r | 0},${g | 0},${b | 0})`;
  };
  const COL = {
    chatgpt: { body: '#2f9e6a', dark: '#1d6b47', rim: '#8fd9b4', eye: '#d9fff0', glow: '#5dffb4', screen: '#0d2a22', name: 'CHATGPT' },
    grok: { body: '#232328', dark: '#121215', rim: '#5a5a66', eye: '#ffffff', glow: '#e8f0ff', screen: '#050507', name: 'GROK' },
    claude: { body: '#e0773a', dark: '#a8501f', rim: '#ffc79c', eye: '#fff1d6', glow: '#ffc06a', screen: '#2c1408', name: 'CLAUDE' },
    gemini: { body: '#3d7fe0', dark: '#2554a3', rim: '#a9ccff', eye: '#e3f2ff', glow: '#7cc8ff', screen: '#0a1a33', name: 'GEMINI' },
    deepseek: { body: '#7b4fd0', dark: '#523096', rim: '#c9b0ff', eye: '#f0e6ff', glow: '#c39bff', screen: '#1a0f33', name: 'DEEPSEEK' },
    neutral: { body: '#d8d2c4', dark: '#958f82', rim: '#fffaf0', eye: '#e6fbff', glow: '#9fe8ff', screen: '#16212a', name: 'IA' }, // generic "an AI" (not one of the 5)
  };
  const IDS = ['chatgpt', 'grok', 'claude', 'gemini', 'deepseek'];
  const SEED = { chatgpt: 11, grok: 23, claude: 37, gemini: 41, deepseek: 53 };

  // ---------- paper fiber texture (baked once) ----------
  let FIB = null; const PAT = new WeakMap();
  function fiberCanvas() {
    if (FIB) return FIB;
    const S = 256; FIB = document.createElement('canvas'); FIB.width = FIB.height = S;
    const f = FIB.getContext('2d'); const id = f.createImageData(S, S);
    for (let i = 0; i < S * S; i++) { const v = 200 + (hash(i % S, (i / S) | 0) * 55) | 0; id.data[i * 4] = id.data[i * 4 + 1] = id.data[i * 4 + 2] = v; id.data[i * 4 + 3] = 255; }
    f.putImageData(id, 0, 0);
    f.globalAlpha = .5; f.lineCap = 'round';
    for (let i = 0; i < 260; i++) { // fibers
      const x = hash(i, 1) * S, y = hash(i, 2) * S, a = hash(i, 3) * TAU, l = 6 + hash(i, 4) * 22;
      f.strokeStyle = hash(i, 5) > .5 ? 'rgba(120,110,100,.55)' : 'rgba(255,255,255,.7)'; f.lineWidth = .6 + hash(i, 6);
      f.beginPath(); f.moveTo(x, y); f.quadraticCurveTo(x + Math.cos(a + .6) * l * .5, y + Math.sin(a + .6) * l * .5, x + Math.cos(a) * l, y + Math.sin(a) * l); f.stroke();
    }
    return FIB;
  }
  function fiberPattern(c) { let p = PAT.get(c); if (!p) { p = c.createPattern(fiberCanvas(), 'repeat'); PAT.set(c, p); } return p; }

  // ---------- rough cut paths ----------
  function roughPoly(pts, seed = 1, amp = 1.4, step = 9, closed = true) {
    const P = new Path2D(); let k = 0, first = true;
    const n = pts.length, m = closed ? n : n - 1;
    for (let i = 0; i < m; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % n];
      const L = Math.hypot(x1 - x0, y1 - y0), nx = -(y1 - y0) / (L || 1), ny = (x1 - x0) / (L || 1);
      const segs = Math.max(1, Math.round(L / step));
      for (let j = 0; j < segs; j++) {
        const u = j / segs, d = (hash(seed, k++) - .5) * 2 * amp;
        const x = x0 + (x1 - x0) * u + nx * d, y = y0 + (y1 - y0) * u + ny * d;
        if (first) { P.moveTo(x, y); first = false; } else P.lineTo(x, y);
      }
    }
    if (!closed) P.lineTo(pts[n - 1][0], pts[n - 1][1]); else P.closePath();
    return P;
  }
  function rrPts(x, y, w, h, r, seg = 5) {
    r = Math.min(r, w / 2, h / 2); const pts = [];
    const cs = [[x + w - r, y + r, -Math.PI / 2], [x + w - r, y + h - r, 0], [x + r, y + h - r, Math.PI / 2], [x + r, y + r, Math.PI]];
    for (const [cx, cy, a0] of cs) for (let i = 0; i <= seg; i++) { const a = a0 + (i / seg) * Math.PI / 2; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
    return pts;
  }
  const roughRR = (x, y, w, h, r, seed = 1, amp = 1.3, step = 9) => roughPoly(rrPts(x, y, w, h, r), seed, amp, step, true);
  function ellPts(cx, cy, rx, ry, n = 28) { const p = []; for (let i = 0; i < n; i++) { const a = i / n * TAU; p.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); } return p; }
  const roughEll = (cx, cy, rx, ry, seed = 1, amp = 1.2) => roughPoly(ellPts(cx, cy, rx, ry, Math.max(12, Math.round((rx + ry) / 5))), seed, amp, 60, true);

  // ---------- paper fill ----------
  function paper(c, path, col, o = {}) {
    c.save();
    if (o.alpha != null) c.globalAlpha *= o.alpha;
    const sh = o.sh ?? 8;
    if (sh > 0 && o.shadow !== false) {
      c.save(); c.shadowColor = `rgba(0,0,0,${o.shA ?? .45})`; c.shadowBlur = o.blur ?? 14; c.shadowOffsetX = sh * .7; c.shadowOffsetY = sh;
      c.fillStyle = '#000'; c.fill(path); c.restore();
    }
    // rim (lighter cut edge) = whole shape in rim color, body drawn over it with an inset stroke trick
    const rimW = o.rimW ?? 3;
    let fill = col;
    if (o.grad) { const b = o.gradBox || [0, -200, 0, 200]; const g = c.createLinearGradient(b[0], b[1], b[2], b[3]); g.addColorStop(0, o.grad[0]); g.addColorStop(1, o.grad[1]); fill = g; }
    c.fillStyle = fill; c.fill(path);
    if (rimW > 0) {
      c.save(); c.clip(path);
      c.strokeStyle = o.rim || (typeof col === 'string' && col[0] === '#' ? shade(col, .45) : 'rgba(255,255,255,.45)');
      c.lineWidth = rimW * 2; c.globalAlpha *= o.rimA ?? .85; c.stroke(path); c.restore();
    }
    const tex = o.tex ?? .22;
    if (tex > 0) { c.save(); c.clip(path); c.globalAlpha *= tex; c.globalCompositeOperation = 'multiply'; c.fillStyle = fiberPattern(c); c.fill(path); c.restore(); }
    c.restore();
  }
  function backlight(c, x, y, r, col = '255,170,90', a = .6) {
    c.save(); c.globalCompositeOperation = 'screen';
    const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(.45, `rgba(${col},${a * .35})`); g.addColorStop(1, `rgba(${col},0)`);
    c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); c.restore();
  }
  function vignette(c, W = 1920, H = 1080, a = .45) {
    c.save(); const g = c.createRadialGradient(W / 2, H / 2, H * .35, W / 2, H / 2, H * .95);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${a})`); c.fillStyle = g; c.fillRect(0, 0, W, H); c.restore();
  }
  const step = (t, fps = 12) => Math.floor(t * fps) / fps;
  function jit(t, seed = 1, amp = 1.5) { const k = Math.floor(t * 12); return { x: (hash(k, seed) - .5) * 2 * amp, y: (hash(k, seed + 7) - .5) * 2 * amp, r: (hash(k, seed + 13) - .5) * 2 * (.5 * Math.PI / 180) }; }

  // ---------- robot ----------
  function capsule(c, x0, y0, x1, y1, w, col, o, seed) {
    const a = Math.atan2(y1 - y0, x1 - x0), L = Math.hypot(x1 - x0, y1 - y0);
    c.save(); c.translate(x0, y0); c.rotate(a);
    paper(c, roughRR(-w / 2, -w / 2, L + w, w, w / 2, seed, .9, 7), col, o);
    c.restore();
  }
  function robot(c, x, yFeet, s, id, o = {}) {
    const C = COL[id] || COL.claude; const t = o.t || 0; const sd = o.seed ?? SEED[id] ?? 5;
    const tt = o.stop === false ? t : step(t);
    const j = o.stop === false ? { x: 0, y: 0, r: 0 } : jit(t, sd, 1.5);
    const shOn = o.shadow !== false;
    const po = (extra) => Object.assign({ sh: shOn ? 7 * Math.min(1.4, s) : 0, blur: 12 * Math.min(1.4, s), rimW: 2.6 * Math.min(1.5, Math.max(.6, s)) }, extra || {});
    c.save();
    if (o.alpha != null) c.globalAlpha *= o.alpha;
    if (o.dim) c.filter = `brightness(${1 - .85 * o.dim})`;
    c.translate(x + j.x, yFeet + j.y + (o.bob || 0));
    if (o.flip) c.scale(-1, 1);
    c.rotate(j.r + (o.lean || 0));
    c.scale(s, s);
    // ground contact shadow
    c.save(); c.globalAlpha *= .35; c.fillStyle = '#000'; c.beginPath(); c.ellipse(4, 2, 78, 10, 0, 0, TAU); c.fill(); c.restore();
    // legs + feet
    for (const sx of [-1, 1]) {
      paper(c, roughRR(sx * 30 - 12, -52, 24, 46, 8, sd + sx * 3, .9, 7), C.dark, po());
      paper(c, roughRR(sx * 30 - 22 + sx * 4, -14, 44, 16, 8, sd + sx * 5, .9, 7), C.dark, po({ rim: C.rim }));
    }
    // arms (behind body if hanging, drawn after body if raised)
    const shoulderY = -150, shX = 62;
    const armA = { l: o.armL ?? .12, r: o.armR ?? .12 };
    const armLen = 78;
    const hands = {};
    const drawArm = (side) => {
      const sx = side === 'l' ? -1 : 1, a = armA[side];
      const hx = sx * (shX + Math.sin(a) * armLen), hy = shoulderY + Math.cos(a) * armLen;
      capsule(c, sx * shX, shoulderY, hx, hy, 20, C.body, po({ rim: C.rim }), sd + (side === 'l' ? 61 : 67));
      paper(c, roughEll(hx, hy, 15, 15, sd + 3, .8), C.dark, po({ rim: C.rim }));
      hands[side] = { lx: hx, ly: hy };
      if (o.handFn) { c.save(); o.handFn(c, hx, hy, side); c.restore(); }
    };
    const raised = (a) => Math.abs(a) > .9;
    if (!raised(armA.l)) drawArm('l'); if (!raised(armA.r)) drawArm('r');
    // body
    paper(c, roughRR(-62, -175, 124, 128, 26, sd + 1, 1.2, 8), C.body, po({ rim: C.rim, grad: [shade(C.body, .12), shade(C.body, -.12)], gradBox: [0, -175, 0, -47] }));
    // chest panel: little paper square with 3 dots (no logos)
    paper(c, roughRR(-30, -140, 60, 40, 9, sd + 2, .8, 6), C.dark, po({ sh: 3, blur: 4, rim: C.rim, rimW: 1.6 }));
    for (let i = 0; i < 3; i++) { c.fillStyle = i === 1 ? C.glow : shade(C.body, .5); c.beginPath(); c.arc(-15 + i * 15, -120, 5, 0, TAU); c.fill(); }
    if (raised(armA.l)) drawArm('l'); if (raised(armA.r)) drawArm('r');
    // neck
    paper(c, roughRR(-18, -192, 36, 22, 6, sd + 4, .7, 6), C.dark, po({ sh: 3 }));
    // head group
    const hy = -262; // head centre
    c.save(); c.translate(0, hy); c.rotate(o.tilt || 0);
    // antenna
    c.save(); c.strokeStyle = C.dark; c.lineWidth = 6; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, -66); c.lineTo(4, -100); c.stroke(); c.restore();
    const ag = .55 + .45 * Math.sin(tt * 4 + sd);
    c.save(); c.globalCompositeOperation = 'screen'; const gg = c.createRadialGradient(4, -106, 0, 4, -106, 34); gg.addColorStop(0, hexA(C.glow, .8 * ag)); gg.addColorStop(1, hexA(C.glow, 0)); c.fillStyle = gg; c.fillRect(-40, -150, 90, 90); c.restore();
    paper(c, roughEll(4, -106, 12, 12, sd + 9, .7), id === 'grok' ? '#e9ecf2' : C.glow, po({ sh: 4, rim: '#fff' }));
    // ears
    for (const sx of [-1, 1]) paper(c, roughRR(sx * 92 - 10, -22, 20, 44, 7, sd + 20 + sx, .7, 6), C.dark, po({ sh: 4 }));
    // head shell
    paper(c, roughRR(-88, -68, 176, 136, 34, sd + 6, 1.3, 9), C.body, po({ rim: C.rim, grad: [shade(C.body, .18), shade(C.body, -.1)], gradBox: [0, -68, 0, 68] }));
    // face screen
    const scr = roughRR(-68, -48, 136, 96, 22, sd + 7, .9, 8);
    paper(c, scr, C.screen, po({ sh: 0, rim: shade(C.body, -.35), rimW: 2.4, tex: .1 }));
    const gl = o.glow ?? 1;
    c.save(); c.clip(scr); c.globalCompositeOperation = 'screen';
    const sg = c.createRadialGradient(0, 0, 4, 0, 0, 90); sg.addColorStop(0, hexA(C.glow, .32 * gl)); sg.addColorStop(1, hexA(C.glow, 0)); c.fillStyle = sg; c.fillRect(-70, -50, 140, 100);
    c.restore();
    // eyes
    const lk = o.look || [0, 0]; const ex = lk[0] * 10, ey = lk[1] * 6;
    let eyes = o.eyes || 'open';
    const bl = o.blink === false ? 0 : blinkAmt(tt, sd);
    c.save(); c.shadowColor = C.glow; c.shadowBlur = 14 * gl; c.fillStyle = C.eye; c.strokeStyle = C.eye; c.lineCap = 'round'; c.lineWidth = 7;
    for (const sx of [-1, 1]) {
      const cx = sx * 30 + ex, cy = -8 + ey;
      if (eyes === 'closed' || bl > .8) { c.beginPath(); c.moveTo(cx - 11, cy + 2); c.quadraticCurveTo(cx, cy + 7, cx + 11, cy + 2); c.stroke(); }
      else if (eyes === 'happy') { c.beginPath(); c.moveTo(cx - 12, cy + 4); c.quadraticCurveTo(cx, cy - 12, cx + 12, cy + 4); c.stroke(); }
      else if (eyes === 'squint') { c.beginPath(); c.ellipse(cx, cy, 13, 5, 0, 0, TAU); c.fill(); }
      else if (eyes === 'side') { c.beginPath(); c.ellipse(cx + 4, cy, 9, 13 * (1 - bl), 0, 0, TAU); c.fill(); }
      else { const r = eyes === 'wide' ? 15 : 11; c.beginPath(); c.ellipse(cx, cy, r * .85, r * 1.15 * (1 - bl * .9), 0, 0, TAU); c.fill(); }
    }
    // mouth
    const m = o.mouth || 'flat', talk = clamp01(o.talk || 0);
    c.lineWidth = 5;
    const my = 24 + ey * .5;
    if (talk > .05) { c.beginPath(); c.ellipse(ex * .5, my, 13, 2 + talk * 10, 0, 0, TAU); c.fill(); }
    else if (m === 'smile') { c.beginPath(); c.moveTo(-16 + ex * .5, my - 3); c.quadraticCurveTo(ex * .5, my + 10, 16 + ex * .5, my - 3); c.stroke(); }
    else if (m === 'sad') { c.beginPath(); c.moveTo(-14 + ex * .5, my + 5); c.quadraticCurveTo(ex * .5, my - 6, 14 + ex * .5, my + 5); c.stroke(); }
    else if (m === 'o') { c.beginPath(); c.ellipse(ex * .5, my + 1, 7, 9, 0, 0, TAU); c.stroke(); }
    else if (m === 'flat') { c.beginPath(); c.moveTo(-12 + ex * .5, my); c.lineTo(12 + ex * .5, my); c.stroke(); }
    c.restore();
    // screen highlight
    c.save(); c.clip(scr); c.globalAlpha = .12; c.fillStyle = '#fff'; c.beginPath(); c.moveTo(-70, -50); c.lineTo(-10, -50); c.lineTo(-60, 50); c.lineTo(-70, 50); c.fill(); c.restore();
    c.restore(); // head
    c.restore();
    // return world coords (approx; ignores jitter rotation)
    const fx = o.flip ? -1 : 1;
    const toW = (lx, ly) => ({ x: x + j.x + fx * lx * s, y: yFeet + j.y + (o.bob || 0) + ly * s });
    const res = { head: toW(0, hy), top: yFeet - 380 * s };
    if (hands.l) res.handL = toW(hands.l.lx, hands.l.ly); if (hands.r) res.handR = toW(hands.r.lx, hands.r.ly);
    if (o.flip) { const a = res.handL; res.handL = res.handR; res.handR = a; }
    if (o.plaque) plaque(c, x, yFeet + 34 * s, s, id, { alpha: o.alpha });
    return res;
  }
  const clamp01 = v => Math.max(0, Math.min(1, v));
  function hexA(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; }
  function blinkAmt(t, sd) { const per = 3.1 + hash(sd, 3) * 1.6; const ph = ((t + hash(sd, 9) * per) % per); return ph < .17 ? 1 : 0; }

  function plaque(c, x, y, s, id, o = {}) {
    const C = COL[id]; const name = C.name; const fs = 30 * s;
    c.save(); if (o.alpha != null) c.globalAlpha *= o.alpha; c.translate(x, y); c.rotate(o.rot || 0);
    c.font = `${fs}px AN, Anton, Impact, sans-serif`; const w = c.measureText(name).width + 34 * s, h = fs * 1.45;
    paper(c, roughRR(-w / 2, -h / 2, w, h, 6 * s, (SEED[id] || 3) + 90, .9, 8), '#f1e6cf', { sh: 5 * s, blur: 8 * s, rim: '#fff', rimW: 2 });
    c.fillStyle = C.body; c.fillRect(-w / 2 + 6 * s, -h / 2 + 6 * s, 7 * s, h - 12 * s);
    c.fillStyle = '#2a2018'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(name, 4 * s, fs * .06);
    c.restore();
    return { w, h };
  }
  function lineup(c, cx, yFeet, s, gap, o = {}, per = {}) {
    const pos = {};
    IDS.forEach((id, i) => { const x = cx + (i - 2) * gap; pos[id] = robot(c, x, yFeet, s, id, Object.assign({}, o, per[id] || {})); pos[id].x = x; });
    return pos;
  }

  // ---------- props ----------
  function confetti(c, x, y, w, h, p, seed = 1, cols = ['#e8e0cc', '#7fb2ff', '#3d7fe0', '#c9d6ea'], o = {}) {
    if (p <= 0) return; const n = o.n || 70;
    c.save();
    for (let i = 0; i < n; i++) {
      const sx = x + hash(seed, i) * w, sy = y + hash(seed, i + 300) * h;
      const vx = (hash(seed, i + 600) - .5) * (o.spread || 520), vy = -(80 + hash(seed, i + 900) * 380);
      const tt = p * (o.dur || 1.6);
      const px = sx + vx * tt, py = sy + vy * tt + 420 * tt * tt;
      const rot = hash(seed, i + 1200) * 6 + tt * (hash(seed, i + 1500) - .5) * 14;
      const sz = (o.size || 14) * (.5 + hash(seed, i + 1800));
      c.save(); c.globalAlpha *= clamp01(1.4 - p * 1.1); c.translate(px, py); c.rotate(rot); c.scale(1, Math.cos(tt * 7 + i));
      c.shadowColor = 'rgba(0,0,0,.35)'; c.shadowBlur = 4; c.shadowOffsetY = 3;
      c.fillStyle = cols[i % cols.length]; c.fillRect(-sz / 2, -sz * .35, sz, sz * .7); c.restore();
    }
    c.restore();
  }
  function lever(c, x, yBase, s, ang = 0, o = {}) {
    c.save(); c.translate(x, yBase); c.scale(s, s);
    paper(c, roughRR(-70, -40, 140, 40, 8, 401, 1, 8), o.base || '#5b4636', { rim: '#9c7d62' });
    paper(c, roughRR(-50, -62, 100, 26, 10, 402, 1, 8), o.base2 || '#3e2f25', { rim: '#7f6450', sh: 4 });
    c.save(); c.translate(0, -50); c.rotate(ang);
    paper(c, roughRR(-8, -230, 16, 232, 7, 403, .8, 8), o.rod || '#b9bcc4', { rim: '#eef', sh: 6 });
    paper(c, roughEll(0, -240, 26, 26, 404, 1), o.knob || '#d8342c', { rim: '#ff9b8f', sh: 6 });
    c.restore(); c.restore();
  }
  function paperPerson(c, x, yFeet, s, o = {}) {
    const sd = o.seed || 7, col = o.col || '#e9dfc9';
    c.save(); c.translate(x, yFeet); c.scale(s, s);
    paper(c, roughPoly([[-16, 0], [-10, -40], [-20, -42], [-14, -78], [14, -78], [20, -42], [10, -40], [16, 0]], sd, .9, 7), col, { sh: 5, blur: 8 });
    paper(c, roughEll(0, -94, 15, 16, sd + 1, .8), col, { sh: 5, blur: 8 });
    if (o.tied) { c.strokeStyle = '#8a6a44'; c.lineWidth = 3; for (const yy of [-30, -56]) { c.beginPath(); c.moveTo(-20, yy); c.lineTo(20, yy + 3); c.stroke(); } }
    c.restore();
  }

  window.V7R = { COL, IDS, SEED, hash, shade, hexA, robot, lineup, plaque, fiberPattern, roughRR, roughPoly, roughEll, paper, backlight, vignette, step, jit, confetti, lever, paperPerson };
})();
