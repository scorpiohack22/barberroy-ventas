/* =====================================================================================
   V9_CAM — shared "OJO DE CÁMARA" kit for video #9 (EXPEDIENTE 009, face recognition)
   Written by the B2 agent. Include AFTER the engine:  <script src="v9_cam.js"></script>
   (file contains no closing script tag, so it can be inlined safely.)
   Exposes ONLY window.V9C (no other globals; never defines P). Every function takes an explicit
   2D context `c` (pass the engine's global `ctx`). Fonts assumed loaded by the engine: AN (Anton), TY (mono).
   Everything is clean vector drawing. No logos, no real people: faces are generic drawn faces.

   PALETTE   V9C.COL = {cyan, cyanD, red, redD, green, amber, white, ink, steel, steelD, steelL, skin[], hair[]}

   CCTV FEED OVERLAY (use as a storytelling device on surveillance shots, not everywhere)
     V9C.grade(c, W, H, a=1)        desaturated green-grey CCTV grade of what is ALREADY on the canvas
                                    (saturation blend + green-grey multiply + slight lift). Call before cctv().
     V9C.cctv(c, W, H, o)           corner brackets, blinking red "● REC", running timecode, scanlines, noise
       o.t seconds (drives blink/timecode/noise)   o.tc0 timecode start in seconds (def 2*3600+14*60+37 → 02:14:37)
       o.cam 'CAM 04' small id label top-right ('' hides)  o.a overall alpha   o.margin (def 70; text stays ≥60 px in)
       o.scan (def .12) scanline alpha   o.noise (def .06) noise alpha   o.rec (def true)   o.col bracket color (def white)
     V9C.stutter(t, fps=24, hold=2) → t quantized so frames repeat `hold` times (frame-rate stutter). Use on the
                                    scene-time you pass to moving things on surveillance shots.
     V9C.tc(sec) → 'HH:MM:SS' string (plain digits)

   FACE TRACKING
     V9C.trackBox(c, x, y, w, h, o)   square tracking box centred on (x,y), size w×h
       o.snap 0..1  0 = loose big box drifting in, 1 = locked (eased overshoot snap, corner ticks tighten)
       o.col 'cyan' | 'red' | css     o.label short text above (e.g. 'ROSTRO', 'MATCH')   o.pct number shown under box
       o.t (blink of the lock dot)     o.a alpha   o.lw (def 4)
     V9C.mesh(c, x, y, s, o)          facial mesh (dots + triangle lines) for a face centred (x,y), face height s
       o.p 0..1 reveal (dots pop in, then lines)     o.col (def cyan)  o.a
       o.measure 'eyes'|'nose'|'jaw'|null  draws a bright measured distance line with end ticks + o.mlabel text
       o.mp 0..1 progress of the measure line    o.rot rad (head tilt)   returns landmarks
     V9C.landmarks(x, y, s, rot=0) → {name:[x,y]} landmark points used by face()/mesh() (to align on photos)

   GENERIC DRAWN FACES / PEOPLE (never real people)
     V9C.face(c, x, y, s, o)          simple flat face, head+neck+shoulders; (x,y) face centre, s = face height
       o.seed (varies skin/hair/shape)   o.skin o.hair css overrides   o.shirt css   o.look [-1..1, -1..1]
       o.blink 0..1   o.mouth 0..1 open   o.mono true → grey-green CCTV-ish flat palette   o.a
       o.shoulders (def true)   o.back true → seen from behind (hair only, no features)
     V9C.faceGrid(c, x, y, w, h, o)    grid of face thumbnails flipping fast (database search)
       o.cols o.rows (def 6×4)  o.t seconds  o.rate flips/s (def 14; 0 = frozen)  o.seed
       o.hi index of highlighted cell (or -1)  o.hiCol 'cyan'|'red'   o.dim 0..1 dims non-highlighted cells
       o.mono (def true)  o.a     returns array of cell rects [{x,y,w,h}]
     V9C.silhouette(c, x, y, s, o)    full-body standing person silhouette, FEET at (x,y), height s (has legs)
       o.col (def '#1b2228')  o.rim css rim light  o.seed  o.walk 0..1 phase (legs swing)  o.arms 'down'|'up'|'behind'
       o.hat 'cap'|null   o.a
     V9C.crowd(c, x, y, w, h, o)       rows of head+shoulder silhouettes filling the rect (back rows smaller)
       o.rows (def 4) o.seed o.col HEX (def '#151c22') o.rim rim-light css  o.t (tiny sway)  o.density (def 1)
       returns heads [{x,y,r,row}] (front row last) → use for trackBox targets
   SECURITY CAMERA (drawn)
     V9C.camera(c, x, y, s, o)        mount point (x,y); body ≈ 220*s long
       o.mount 'wall' | 'pole' | 'ceiling'   o.poleH px (pole: from (x,y) down to the ground; default 520*s)
       o.ang rad tilt (def .35 = looking down; negative = looking up)  o.flip true → points right (default points left)
       o.pan rad extra pan wobble   o.light (def true) red lamp blinks   o.t   o.cone 0..1 faint view cone
       o.cyan true → lens glints cyan   o.a
   READOUTS
     V9C.matchBar(c, x, y, w, o)       match bar, left (x,y)=top-left, height 46: label + fill + big %
       o.v 0..1 fill   o.col 'cyan'|'red'   o.label (def 'MATCH')   o.pct (override number shown)  o.a
     V9C.counter(c, x, y, v, o)        big glowing number with '.' thousands (o.size def 140, o.col, o.align, o.prefix, o.suffix)
     V9C.tag(c, x, y, text, o)         data tag chip with a connector line to (o.tx,o.ty) (o.col, o.size def 38, o.p 0..1 pop)
     V9C.fmt(n) → '30.000.000.000'     V9C.hash(a,b)  V9C.ease(t)  V9C.mix(hexA,hexB,t)
   ===================================================================================== */
(function () {
  const TAU = Math.PI * 2;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = t => { t = clamp(t); return t * t * (3 - 2 * t); };
  const backOut = t => { t = clamp(t); const k = 1.7; return 1 + (k + 1) * Math.pow(t - 1, 3) + k * Math.pow(t - 1, 2); };
  const hash = (a, b = 0) => { const s = Math.sin(a * 127.1 + b * 311.7 + 74.7) * 43758.5453; return s - Math.floor(s); };
  const hx = h => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  const mix = (a, b, t) => { const A = hx(a), B = hx(b); t = clamp(t); return `rgb(${(A[0] + (B[0] - A[0]) * t) | 0},${(A[1] + (B[1] - A[1]) * t) | 0},${(A[2] + (B[2] - A[2]) * t) | 0})`; };
  const rgba = (h, a) => { const A = hx(h); return `rgba(${A[0]},${A[1]},${A[2]},${a})`; };
  const COL = {
    cyan: '#3ee6ff', cyanD: '#0d8fa6', red: '#ff3346', redD: '#a3121f', green: '#7dffb0', amber: '#ffb83d',
    white: '#f2f7f8', ink: '#0b1014', steel: '#59646c', steelD: '#2b3238', steelL: '#a9b4bb',
    skin: ['#e9b993', '#c98e66', '#a86b45', '#7a4a2e', '#f1cfb1', '#d6a07a'],
    hair: ['#1e1612', '#3b2618', '#5b3a22', '#141414', '#7a5a3a', '#2a2a30']
  };
  const colOf = k => k === 'red' ? COL.red : k === 'cyan' || !k ? COL.cyan : k;
  const fmt = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const tc = s => { s = Math.max(0, Math.floor(s)); const h = Math.floor(s / 3600) % 100, m = Math.floor(s / 60) % 60, ss = s % 60; return [h, m, ss].map(v => String(v).padStart(2, '0')).join(':'); };
  const stutter = (t, fps = 24, hold = 2) => Math.floor(t * fps / hold) * hold / fps;

  // ---------- noise tile (cached) ----------
  let NT = null;
  function noiseTile() {
    if (NT) return NT;
    NT = document.createElement('canvas'); NT.width = NT.height = 256;
    const g = NT.getContext('2d'), id = g.createImageData(256, 256);
    let s = 1234567;
    for (let i = 0; i < id.data.length; i += 4) { s = (s * 1103515245 + 12345) & 0x7fffffff; const v = s % 256; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
    g.putImageData(id, 0, 0); return NT;
  }
  let SL = null;
  function scanTile() {
    if (SL) return SL;
    SL = document.createElement('canvas'); SL.width = 8; SL.height = 4;
    const g = SL.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, 8, 2); return SL;
  }

  // ---------- CCTV grade + overlay ----------
  function grade(c, W, H, a = 1) {
    if (a <= 0) return;
    c.save();
    c.globalAlpha = .78 * a; c.globalCompositeOperation = 'saturation'; c.fillStyle = '#808080'; c.fillRect(0, 0, W, H);
    c.globalAlpha = .55 * a; c.globalCompositeOperation = 'multiply'; c.fillStyle = '#b9cfc0'; c.fillRect(0, 0, W, H);
    c.globalAlpha = .10 * a; c.globalCompositeOperation = 'screen'; c.fillStyle = '#1e3a2c'; c.fillRect(0, 0, W, H);
    c.restore();
  }
  function cctv(c, W, H, o = {}) {
    const t = o.t || 0, m = o.margin == null ? 70 : o.margin, a = o.a == null ? 1 : o.a, bc = o.col || COL.white;
    if (a <= 0) return;
    c.save(); c.globalAlpha = a;
    // scanlines
    const sa = o.scan == null ? .12 : o.scan;
    if (sa > 0) { c.save(); c.globalAlpha = a * sa; c.fillStyle = c.createPattern(scanTile(), 'repeat'); c.fillRect(0, 0, W, H); c.restore(); }
    // noise
    const na = o.noise == null ? .06 : o.noise;
    if (na > 0) {
      c.save(); c.globalAlpha = a * na; c.globalCompositeOperation = 'overlay';
      const f = Math.floor(t * 24), ox = (hash(f, 1) * 256) | 0, oy = (hash(f, 2) * 256) | 0;
      c.translate(-ox, -oy); c.fillStyle = c.createPattern(noiseTile(), 'repeat'); c.fillRect(0, 0, W + 256, H + 256); c.restore();
      // rolling soft band
      const by = ((t * 90) % (H + 300)) - 150; const g = c.createLinearGradient(0, by - 80, 0, by + 80);
      g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.5, `rgba(255,255,255,${.035 * a})`); g.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = g; c.fillRect(0, by - 80, W, 160);
    }
    // corner brackets
    const L = 70, bw = 5, x0 = m - 26, y0 = m - 26, x1 = W - m + 26, y1 = H - m + 26;
    c.strokeStyle = bc; c.lineWidth = bw; c.lineCap = 'square'; c.shadowColor = 'rgba(0,0,0,.6)'; c.shadowBlur = 6;
    c.beginPath();
    c.moveTo(x0, y0 + L); c.lineTo(x0, y0); c.lineTo(x0 + L, y0);
    c.moveTo(x1 - L, y0); c.lineTo(x1, y0); c.lineTo(x1, y0 + L);
    c.moveTo(x1, y1 - L); c.lineTo(x1, y1); c.lineTo(x1 - L, y1);
    c.moveTo(x0 + L, y1); c.lineTo(x0, y1); c.lineTo(x0, y1 - L);
    c.stroke();
    // REC
    c.textBaseline = 'middle'; c.font = '44px TY';
    if (o.rec !== false) {
      const on = (t % 1) < .62;
      if (on) { c.fillStyle = COL.red; c.shadowColor = COL.red; c.shadowBlur = 16; c.beginPath(); c.arc(m + 26, m + 30, 15, 0, TAU); c.fill(); }
      c.shadowColor = 'rgba(0,0,0,.7)'; c.shadowBlur = 6; c.fillStyle = bc; c.textAlign = 'left'; c.fillText('REC', m + 56, m + 32);
    }
    // timecode bottom-left, cam id top-right
    const t0 = o.tc0 == null ? (2 * 3600 + 14 * 60 + 37) : o.tc0;
    c.textAlign = 'left'; c.font = '40px TY'; c.fillStyle = bc; c.fillText(tc(t0 + t), m + 4, H - m - 26);
    const fr = String(Math.floor((t * 24) % 24)).padStart(2, '0'); c.globalAlpha = a * .7; c.font = '30px TY'; c.fillText(fr, m + 214, H - m - 24); c.globalAlpha = a;
    const cam = o.cam == null ? 'CAM 04' : o.cam;
    if (cam) { c.textAlign = 'right'; c.font = '38px TY'; c.fillText(cam, W - m - 4, m + 32); }
    c.restore();
  }

  // ---------- landmarks / face ----------
  function landmarks(x, y, s, rot = 0) {
    const u = s; const P0 = {
      top: [0, -.52], fhL: [-.3, -.4], fhR: [.3, -.4], tmpL: [-.4, -.15], tmpR: [.4, -.15],
      eyeLo: [-.27, -.06], eyeLi: [-.09, -.06], eyeRi: [.09, -.06], eyeRo: [.27, -.06], eyeL: [-.18, -.06], eyeR: [.18, -.06],
      browL: [-.19, -.17], browR: [.19, -.17], bridge: [0, -.05], nose: [0, .12], nosL: [-.08, .15], nosR: [.08, .15],
      cheekL: [-.38, .08], cheekR: [.38, .08], mouthL: [-.13, .29], mouthR: [.13, .29], lipT: [0, .26], lipB: [0, .33],
      jawL: [-.36, .26], jawR: [.36, .26], jaw2L: [-.24, .43], jaw2R: [.24, .43], chin: [0, .5]
    };
    const cs = Math.cos(rot), sn = Math.sin(rot), out = {};
    for (const k in P0) { const px = P0[k][0] * u, py = P0[k][1] * u; out[k] = [x + px * cs - py * sn, y + px * sn + py * cs]; }
    return out;
  }
  const MESH_E = [['top', 'fhL'], ['top', 'fhR'], ['fhL', 'tmpL'], ['fhR', 'tmpR'], ['fhL', 'browL'], ['fhR', 'browR'], ['top', 'browL'], ['top', 'browR'], ['browL', 'browR'],
    ['browL', 'eyeLo'], ['browL', 'eyeLi'], ['browR', 'eyeRi'], ['browR', 'eyeRo'], ['tmpL', 'eyeLo'], ['tmpR', 'eyeRo'], ['eyeLi', 'bridge'], ['eyeRi', 'bridge'], ['browL', 'bridge'], ['browR', 'bridge'],
    ['tmpL', 'cheekL'], ['tmpR', 'cheekR'], ['eyeLo', 'cheekL'], ['eyeRo', 'cheekR'], ['eyeL', 'nosL'], ['eyeR', 'nosR'], ['bridge', 'nose'], ['nose', 'nosL'], ['nose', 'nosR'],
    ['cheekL', 'nosL'], ['cheekR', 'nosR'], ['cheekL', 'jawL'], ['cheekR', 'jawR'], ['nosL', 'mouthL'], ['nosR', 'mouthR'], ['nosL', 'lipT'], ['nosR', 'lipT'], ['mouthL', 'lipT'], ['mouthR', 'lipT'],
    ['mouthL', 'lipB'], ['mouthR', 'lipB'], ['jawL', 'mouthL'], ['jawR', 'mouthR'], ['jawL', 'jaw2L'], ['jawR', 'jaw2R'], ['jaw2L', 'chin'], ['jaw2R', 'chin'], ['lipB', 'chin'], ['mouthL', 'jaw2L'], ['mouthR', 'jaw2R'],
    ['eyeLo', 'eyeL'], ['eyeL', 'eyeLi'], ['eyeRi', 'eyeR'], ['eyeR', 'eyeRo']];
  const MEAS = { eyes: ['eyeL', 'eyeR'], nose: ['bridge', 'nose'], jaw: ['jawL', 'jawR'] };

  function mesh(c, x, y, s, o = {}) {
    const p = o.p == null ? 1 : o.p, col = colOf(o.col), a = o.a == null ? 1 : o.a, L = landmarks(x, y, s, o.rot || 0);
    const keys = Object.keys(L);
    c.save(); c.globalAlpha = a; c.lineCap = 'round';
    // lines after dots
    const lp = clamp((p - .35) / .65);
    if (lp > 0) {
      c.strokeStyle = rgba(col, .55); c.lineWidth = Math.max(1.2, s * .004); c.shadowColor = col; c.shadowBlur = 6;
      const n = Math.ceil(MESH_E.length * lp);
      c.beginPath();
      for (let i = 0; i < n; i++) { const e = MESH_E[i], A = L[e[0]], B = L[e[1]]; c.moveTo(A[0], A[1]); c.lineTo(B[0], B[1]); }
      c.stroke();
    }
    // dots
    c.shadowColor = col; c.shadowBlur = 10; c.fillStyle = col;
    keys.forEach((k, i) => {
      const d = clamp((p * 1.9) - i / keys.length * 1.2); if (d <= 0) return;
      const r = Math.max(2.5, s * .011) * backOut(d);
      c.beginPath(); c.arc(L[k][0], L[k][1], r, 0, TAU); c.fill();
    });
    // measure
    if (o.measure && MEAS[o.measure]) {
      const mp = o.mp == null ? 1 : o.mp, A = L[MEAS[o.measure][0]], B = L[MEAS[o.measure][1]];
      const ex = A[0] + (B[0] - A[0]) * ease(mp), ey = A[1] + (B[1] - A[1]) * ease(mp);
      c.strokeStyle = COL.white; c.shadowColor = col; c.shadowBlur = 14; c.lineWidth = Math.max(3, s * .009);
      c.beginPath(); c.moveTo(A[0], A[1]); c.lineTo(ex, ey); c.stroke();
      const dx = B[0] - A[0], dy = B[1] - A[1], dl = Math.hypot(dx, dy) || 1, nx = -dy / dl * s * .035, ny = dx / dl * s * .035;
      c.beginPath(); c.moveTo(A[0] - nx, A[1] - ny); c.lineTo(A[0] + nx, A[1] + ny);
      if (mp > .95) { c.moveTo(B[0] - nx, B[1] - ny); c.lineTo(B[0] + nx, B[1] + ny); }
      c.stroke();
      c.fillStyle = COL.white; [A, [ex, ey]].forEach(q => { c.beginPath(); c.arc(q[0], q[1], Math.max(4, s * .014), 0, TAU); c.fill(); });
      if (o.mlabel && mp > .6) {
        c.globalAlpha = a * clamp((mp - .6) / .3); c.shadowBlur = 8; c.shadowColor = '#000';
        c.font = `${Math.round(Math.max(26, s * .07))}px TY`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = col;
        const mx = (A[0] + B[0]) / 2 + nx * 2.2, my = (A[1] + B[1]) / 2 + ny * 2.2 - (o.measure === 'nose' ? 0 : s * .04);
        c.fillText(o.mlabel, o.measure === 'nose' ? mx + s * .22 : mx, my);
      }
    }
    c.restore();
    return L;
  }

  function face(c, x, y, s, o = {}) {
    const sd = o.seed || 0, a = o.a == null ? 1 : o.a;
    let skin = o.skin || COL.skin[(hash(sd, 3) * COL.skin.length) | 0], hair = o.hair || COL.hair[(hash(sd, 4) * COL.hair.length) | 0];
    let shirt = o.shirt || ['#33475b', '#5b3345', '#2f5a4a', '#4a4a52', '#6a5530', '#26303a'][(hash(sd, 5) * 6) | 0];
    if (o.mono) { const m = v => mix(v, '#7f8f86', .7); skin = m(skin); hair = mix(hair, '#26302c', .5); shirt = m(shirt); }
    const wf = .78 + hash(sd, 6) * .14, hs = hash(sd, 7), lk = o.look || [0, 0];
    const fw = s * wf * .5, fh = s * .54;
    c.save(); c.globalAlpha = a; c.lineJoin = 'round';
    const ol = o.mono ? 'rgba(10,16,14,.85)' : '#141014', lw = Math.max(1.5, s * .022);
    const stroke = () => { c.lineWidth = lw; c.strokeStyle = ol; c.stroke(); };
    // shoulders
    if (o.shoulders !== false) {
      c.beginPath(); c.moveTo(x - s * .95, y + s * 1.25); c.quadraticCurveTo(x - s * .9, y + s * .62, x - s * .2, y + s * .58);
      c.lineTo(x + s * .2, y + s * .58); c.quadraticCurveTo(x + s * .9, y + s * .62, x + s * .95, y + s * 1.25); c.closePath();
      c.fillStyle = shirt; c.fill(); stroke();
      c.beginPath(); c.rect(x - s * .12, y + s * .3, s * .24, s * .32); c.fillStyle = mix(skin.startsWith('#') ? skin : '#c0a080', '#000000', .12); c.fill(); stroke();
    }
    // back hair (for long hair variants)
    const longHair = hs > .62;
    if (longHair || o.back) { c.beginPath(); c.ellipse(x, y + s * .05, fw * 1.12, fh * 1.08, 0, 0, TAU); c.fillStyle = hair; c.fill(); stroke(); }
    if (o.back) {
      c.beginPath(); c.ellipse(x, y - s * .02, fw * 1.05, fh * 1.02, 0, 0, TAU); c.fillStyle = hair; c.fill(); stroke();
      c.restore(); return;
    }
    // hair volume (behind the head)
    const part = (hs - .5) * fw * .9, vol = 1.04 + hs * .08;
    c.beginPath(); c.ellipse(x, y - fh * .16, fw * vol, fh * (.84 + hs * .06), 0, Math.PI * .93, Math.PI * 2.07); c.closePath(); c.fillStyle = hair; c.fill(); stroke();
    // ears
    c.beginPath(); c.ellipse(x - fw * .98, y + s * .02, s * .06, s * .09, 0, 0, TAU); c.fillStyle = skin; c.fill(); stroke();
    c.beginPath(); c.ellipse(x + fw * .98, y + s * .02, s * .06, s * .09, 0, 0, TAU); c.fill(); stroke();
    // head (fill), fringe clipped inside, then outline below the hairline only
    c.beginPath(); c.ellipse(x, y, fw, fh, 0, 0, TAU); c.fillStyle = skin; c.fill();
    c.save(); c.beginPath(); c.ellipse(x, y, fw, fh, 0, 0, TAU); c.clip();
    c.beginPath(); c.moveTo(x - fw * 1.1, y - fh * .05); c.quadraticCurveTo(x - fw * .75, y - fh * .66, x + part, y - fh * .52);
    c.quadraticCurveTo(x + fw * .7, y - fh * .7, x + fw * 1.1, y - fh * .05); c.lineTo(x + fw * 1.1, y - fh * 1.3); c.lineTo(x - fw * 1.1, y - fh * 1.3); c.closePath();
    c.fillStyle = hair; c.fill(); c.restore();
    c.beginPath(); c.ellipse(x, y, fw, fh, 0, -.12, Math.PI + .12); stroke();
    // features
    const ink = o.mono ? '#1c2420' : '#1d1614';
    const ey = y - s * .06, ex = s * .18, er = s * .045, bl = clamp(o.blink || 0);
    c.fillStyle = '#fbfbf8';
    [-1, 1].forEach(d => {
      c.beginPath(); c.ellipse(x + d * ex, ey, er * 1.25, er * (1 - bl * .9), 0, 0, TAU); c.fill(); c.lineWidth = lw * .7; c.strokeStyle = ink; c.stroke();
      if (bl < .7) { c.fillStyle = ink; c.beginPath(); c.arc(x + d * ex + lk[0] * er * .5, ey + lk[1] * er * .4, er * .55, 0, TAU); c.fill(); c.fillStyle = '#fbfbf8'; }
      c.beginPath(); c.moveTo(x + d * ex - er * 1.4, ey - s * .1 + d * 0); c.quadraticCurveTo(x + d * ex, ey - s * .135, x + d * ex + er * 1.4, ey - s * .1);
      c.lineWidth = lw * 1.1; c.strokeStyle = hair; c.stroke();
    });
    c.beginPath(); c.moveTo(x - s * .01, y - s * .02); c.quadraticCurveTo(x - s * .06, y + s * .12, x + s * .01, y + s * .14);
    c.lineWidth = lw * .7; c.strokeStyle = mix(skin.startsWith('#') ? skin : '#c0a080', '#000000', .45); c.stroke();
    const mo = clamp(o.mouth || 0);
    c.beginPath(); c.ellipse(x, y + s * .28, s * .1, s * (.012 + mo * .05), 0, 0, TAU); c.fillStyle = '#6a2a2a'; c.fill();
    c.restore();
  }

  function faceGrid(c, x, y, w, h, o = {}) {
    const cols = o.cols || 6, rows = o.rows || 4, gap = Math.max(6, w * .008), cw = (w - gap * (cols - 1)) / cols, ch = (h - gap * (rows - 1)) / rows;
    const rate = o.rate == null ? 14 : o.rate, t = o.t || 0, sd = o.seed || 0, hi = o.hi == null ? -1 : o.hi, a = o.a == null ? 1 : o.a;
    const rects = [];
    c.save(); c.globalAlpha = a;
    for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) {
      const i = r * cols + q, cx = x + q * (cw + gap), cy = y + r * (ch + gap);
      rects.push({ x: cx, y: cy, w: cw, h: ch });
      const fl = rate > 0 ? Math.floor(t * rate * (.7 + hash(i, sd) * .6) + hash(i, sd + 9) * 7) : 0;
      const isHi = i === hi;
      c.save(); c.beginPath(); c.rect(cx, cy, cw, ch); c.clip();
      c.fillStyle = o.mono === false ? '#2a3440' : '#26302c'; c.fillRect(cx, cy, cw, ch);
      const fs = Math.min(cw, ch) * .62;
      face(c, cx + cw / 2, cy + ch * .44, fs, { seed: isHi && o.hiSeed != null ? o.hiSeed : sd * 1000 + i * 37 + fl * 13, mono: o.mono !== false });
      if (o.dim && !isHi) { c.fillStyle = `rgba(0,0,0,${.6 * o.dim})`; c.fillRect(cx, cy, cw, ch); }
      // flip flash
      const ph = rate > 0 ? (t * rate * (.7 + hash(i, sd) * .6) + hash(i, sd + 9) * 7) % 1 : .5;
      if (ph < .18 && !isHi) { c.fillStyle = `rgba(200,255,240,${.18 * (1 - ph / .18)})`; c.fillRect(cx, cy, cw, ch); }
      c.restore();
      c.lineWidth = isHi ? 5 : 2; c.strokeStyle = isHi ? colOf(o.hiCol) : 'rgba(160,210,200,.35)';
      if (isHi) { c.shadowColor = colOf(o.hiCol); c.shadowBlur = 18; }
      c.strokeRect(cx, cy, cw, ch); c.shadowBlur = 0;
    }
    c.restore();
    return rects;
  }

  // ---------- tracking box ----------
  function trackBox(c, x, y, w, h, o = {}) {
    const sn = o.snap == null ? 1 : o.snap, col = colOf(o.col), a = o.a == null ? 1 : o.a, t = o.t || 0, lw = o.lw || 4;
    const k = 1 + (1 - backOut(sn)) * .7, bw = w * k, bh = h * k;
    const jx = (1 - sn) * Math.sin(t * 7.3) * w * .08, jy = (1 - sn) * Math.cos(t * 5.1) * h * .08;
    const x0 = x - bw / 2 + jx, y0 = y - bh / 2 + jy, L = Math.min(bw, bh) * (.22 + .1 * sn);
    c.save(); c.globalAlpha = a * (.5 + .5 * clamp(sn * 2)); c.strokeStyle = col; c.lineWidth = lw; c.shadowColor = col; c.shadowBlur = 12; c.lineCap = 'square';
    // thin full box
    c.globalAlpha = a * .45 * clamp(sn * 1.5); c.lineWidth = Math.max(1.5, lw * .4); c.strokeRect(x0, y0, bw, bh);
    c.globalAlpha = a; c.lineWidth = lw;
    c.beginPath();
    c.moveTo(x0, y0 + L); c.lineTo(x0, y0); c.lineTo(x0 + L, y0);
    c.moveTo(x0 + bw - L, y0); c.lineTo(x0 + bw, y0); c.lineTo(x0 + bw, y0 + L);
    c.moveTo(x0 + bw, y0 + bh - L); c.lineTo(x0 + bw, y0 + bh); c.lineTo(x0 + bw - L, y0 + bh);
    c.moveTo(x0 + L, y0 + bh); c.lineTo(x0, y0 + bh); c.lineTo(x0, y0 + bh - L);
    c.stroke();
    // centre ticks when locked
    if (sn > .9) {
      const tk = Math.min(bw, bh) * .06; c.lineWidth = Math.max(2, lw * .6);
      c.beginPath(); c.moveTo(x0 + bw / 2, y0 - tk); c.lineTo(x0 + bw / 2, y0 + tk); c.moveTo(x0 + bw / 2, y0 + bh - tk); c.lineTo(x0 + bw / 2, y0 + bh + tk);
      c.moveTo(x0 - tk, y0 + bh / 2); c.lineTo(x0 + tk, y0 + bh / 2); c.moveTo(x0 + bw - tk, y0 + bh / 2); c.lineTo(x0 + bw + tk, y0 + bh / 2); c.stroke();
      if ((t * 2.5) % 1 < .6) { c.fillStyle = col; c.beginPath(); c.arc(x0 + bw - L * .35, y0 + L * .35, Math.max(4, lw * 1.2), 0, TAU); c.fill(); }
    }
    c.textBaseline = 'middle'; c.shadowColor = 'rgba(0,0,0,.8)'; c.shadowBlur = 8;
    const fs = Math.round(Math.max(24, Math.min(46, bw * .13)));
    if (o.label && sn > .3) {
      c.font = `${fs}px TY`; const tw = c.measureText(o.label).width + fs * .7;
      c.globalAlpha = a * clamp((sn - .3) / .4); c.fillStyle = col; c.fillRect(x0, y0 - fs * 1.45, tw, fs * 1.3);
      c.fillStyle = COL.ink; c.shadowBlur = 0; c.textAlign = 'left'; c.fillText(o.label, x0 + fs * .35, y0 - fs * .78);
    }
    if (o.pct != null && sn > .3) {
      c.globalAlpha = a * clamp((sn - .3) / .4); c.font = `${fs}px TY`; c.fillStyle = col; c.textAlign = 'right'; c.shadowBlur = 8;
      c.fillText(Math.round(o.pct) + '%', x0 + bw, y0 + bh + fs * .85);
    }
    c.restore();
  }

  // ---------- people ----------
  function silhouette(c, x, y, s, o = {}) {
    const col = o.col || '#1b2228', a = o.a == null ? 1 : o.a, sd = o.seed || 0, wk = o.walk || 0;
    const u = s / 100, sw = Math.sin(wk * TAU) * 9 * (o.walk != null ? 1 : 0), bw = 1 + (hash(sd, 1) - .5) * .18;
    c.save(); c.globalAlpha = a; c.translate(x, y); c.fillStyle = col;
    if (o.rim) { c.shadowColor = o.rim; c.shadowBlur = 10 * u; }
    const leg = (dx, ang) => { c.save(); c.translate(dx * u, -48 * u); c.rotate(ang * Math.PI / 180); c.beginPath(); c.roundRect(-5.5 * u, 0, 11 * u, 47 * u, 4 * u); c.fill(); c.beginPath(); c.ellipse(2.5 * u, 47 * u, 8 * u, 3.2 * u, 0, 0, TAU); c.fill(); c.restore(); };
    leg(-6 * bw, sw); leg(6 * bw, -sw);
    // torso
    c.beginPath(); c.moveTo(-17 * bw * u, -50 * u); c.lineTo(-19 * bw * u, -80 * u); c.quadraticCurveTo(-18 * bw * u, -86 * u, -10 * u, -87 * u);
    c.lineTo(10 * u, -87 * u); c.quadraticCurveTo(18 * bw * u, -86 * u, 19 * bw * u, -80 * u); c.lineTo(17 * bw * u, -50 * u); c.closePath(); c.fill();
    // arms
    const arm = (d) => {
      c.save(); c.translate(d * 17 * bw * u, -84 * u);
      const ang = o.arms === 'up' ? -d * 150 : o.arms === 'behind' ? d * 12 : d * 6 - sw * .8 * d;
      c.rotate(ang * Math.PI / 180); c.beginPath(); c.roundRect(-4.5 * u, 0, 9 * u, 36 * u, 4 * u); c.fill(); c.restore();
    };
    arm(-1); arm(1);
    // neck + head
    c.beginPath(); c.rect(-4 * u, -92 * u, 8 * u, 7 * u); c.fill();
    c.beginPath(); c.ellipse(0, -100 * u, 8.5 * u, 10 * u, 0, 0, TAU); c.fill();
    if (o.hat === 'cap') { c.beginPath(); c.ellipse(0, -106 * u, 9.5 * u, 6 * u, 0, Math.PI, TAU); c.fill(); c.fillRect(-2 * u, -107 * u, 15 * u, 3 * u); }
    c.restore();
  }

  function crowd(c, x, y, w, h, o = {}) {
    const rows = o.rows || 4, sd = o.seed || 0, col = o.col || '#151c22', t = o.t || 0, dens = o.density || 1, a = o.a == null ? 1 : o.a;
    const heads = [];
    c.save(); c.globalAlpha = a; c.beginPath(); c.rect(x, y, w, h); c.clip();
    for (let r = 0; r < rows; r++) {
      const f = (r + 1) / rows, sc = .45 + .55 * f, hr = h * .085 * sc * (4 / rows) * 1.35, ry = y + h * (.12 + .88 * Math.pow(f, 1.15)) - hr * 1.8;
      const step = hr * 2.5 / dens, n = Math.ceil(w / step) + 2;
            for (let i = -1; i < n; i++) {
        const hx2 = x + i * step + (hash(i, r + sd) - .3) * step * .6 + (r % 2) * step * .5;
        const hy = ry + (hash(i, r * 3 + sd) - .5) * hr * .5 + Math.sin(t * 1.3 + i + r) * hr * .03;
        const rr = hr * (.9 + hash(i, r * 7 + sd) * .2);
        c.fillStyle = mix('#3a4650', col, clamp(.35 + .65 * f - hash(i, r * 5 + sd) * .22));
        if (o.rim) { c.shadowColor = o.rim; c.shadowBlur = rr * .5; }
        c.beginPath(); c.moveTo(hx2 - rr * 2.5, hy + rr * 4.5); c.quadraticCurveTo(hx2 - rr * 2.4, hy + rr * 1.55, hx2 - rr * .5, hy + rr * 1.3);
        c.lineTo(hx2 + rr * .5, hy + rr * 1.3); c.quadraticCurveTo(hx2 + rr * 2.4, hy + rr * 1.55, hx2 + rr * 2.5, hy + rr * 4.5); c.closePath(); c.fill();
        c.beginPath(); c.rect(hx2 - rr * .32, hy + rr * .6, rr * .64, rr * .8); c.fill();
        c.beginPath(); c.ellipse(hx2, hy, rr * .78, rr * .98, 0, 0, TAU); c.fill();
        heads.push({ x: hx2, y: hy, r: rr, row: r });
      }
    }
    c.restore();
    return heads;
  }

  // ---------- security camera ----------
  function camera(c, x, y, s, o = {}) {
    const a = o.a == null ? 1 : o.a, t = o.t || 0, flip = o.flip ? -1 : 1, ang = (o.ang == null ? .35 : o.ang) + (o.pan || 0), mount = o.mount || 'wall';
    c.save(); c.globalAlpha = a; c.lineJoin = 'round';
    const OLc = '#141014', lw = Math.max(2, 5 * s);
    const st = () => { c.lineWidth = lw; c.strokeStyle = OLc; c.stroke(); };
    c.translate(x, y); c.scale(flip, 1);
    if (mount === 'pole') {
      const ph = o.poleH == null ? 520 * s : o.poleH;
      c.beginPath(); c.rect(-11 * s, 0, 22 * s, ph); c.fillStyle = '#5d676e'; c.fill(); st();
      c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(-7 * s, 4 * s, 4 * s, Math.max(0, ph - 8 * s));
      c.beginPath(); c.rect(-26 * s, ph - 14 * s, 52 * s, 14 * s); c.fillStyle = '#4a5359'; c.fill(); st();
      c.beginPath(); c.rect(-20 * s, -14 * s, 40 * s, 22 * s); c.fillStyle = '#6d777e'; c.fill(); st();
    } else if (mount === 'ceiling') {
      c.beginPath(); c.rect(-34 * s, -10 * s, 68 * s, 16 * s); c.fillStyle = '#8b959b'; c.fill(); st();
    } else {
      c.beginPath(); c.roundRect(-4 * s, -40 * s, 24 * s, 80 * s, 4 * s); c.fillStyle = '#8b959b'; c.fill(); st();
    }
    // arm
    c.beginPath(); c.moveTo(-6 * s, -8 * s); c.lineTo(-58 * s, -8 * s); c.lineTo(-58 * s, 14 * s); c.lineTo(-6 * s, 8 * s); c.closePath(); c.fillStyle = '#7b858c'; c.fill(); st();
    c.translate(-62 * s, 0); c.rotate(-ang);
    if (o.cone) {
      const g = c.createLinearGradient(-60 * s, 0, -900 * s, 0); g.addColorStop(0, `rgba(160,255,240,${.2 * o.cone})`); g.addColorStop(1, 'rgba(160,255,240,0)');
      c.fillStyle = g; c.beginPath(); c.moveTo(-150 * s, -12 * s); c.lineTo(-900 * s, -260 * s); c.lineTo(-900 * s, 260 * s); c.lineTo(-150 * s, 12 * s); c.closePath(); c.fill();
    }
    // body
    c.beginPath(); c.roundRect(-150 * s, -34 * s, 170 * s, 62 * s, 10 * s); c.fillStyle = '#e8ecee'; c.fill(); st();
    c.fillStyle = 'rgba(0,0,0,.12)'; c.fillRect(-146 * s, 6 * s, 162 * s, 18 * s);
    // hood
    c.beginPath(); c.moveTo(-168 * s, -44 * s); c.lineTo(10 * s, -44 * s); c.lineTo(10 * s, -30 * s); c.lineTo(-156 * s, -30 * s); c.closePath(); c.fillStyle = '#c9d0d4'; c.fill(); st();
    // lens
    c.beginPath(); c.roundRect(-172 * s, -26 * s, 26 * s, 48 * s, 6 * s); c.fillStyle = '#2c3338'; c.fill(); st();
    c.beginPath(); c.ellipse(-172 * s, -2 * s, 8 * s, 18 * s, 0, 0, TAU); c.fillStyle = o.cyan ? '#18a9c4' : '#0d1216'; c.fill();
    c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.ellipse(-173 * s, -9 * s, 2.5 * s, 5 * s, 0, 0, TAU); c.fill();
    // lamp
    if (o.light !== false && (t % 1.2) < .75) {
      c.fillStyle = COL.red; c.shadowColor = COL.red; c.shadowBlur = 14 * s; c.beginPath(); c.arc(-14 * s, -14 * s, 6 * s, 0, TAU); c.fill(); c.shadowBlur = 0;
    } else { c.fillStyle = '#5a1d22'; c.beginPath(); c.arc(-14 * s, -14 * s, 6 * s, 0, TAU); c.fill(); }
    c.restore();
  }

  // ---------- readouts ----------
  function matchBar(c, x, y, w, o = {}) {
    const v = clamp(o.v == null ? 1 : o.v), col = colOf(o.col), a = o.a == null ? 1 : o.a, h = 46;
    c.save(); c.globalAlpha = a; c.textBaseline = 'middle';
    c.font = '38px TY'; c.fillStyle = col; c.textAlign = 'left'; c.shadowColor = 'rgba(0,0,0,.8)'; c.shadowBlur = 8;
    c.fillText(o.label == null ? 'MATCH' : o.label, x, y - 30);
    c.fillStyle = 'rgba(8,14,16,.75)'; c.fillRect(x, y, w, h); c.shadowBlur = 0;
    c.strokeStyle = rgba(col, .8); c.lineWidth = 3; c.strokeRect(x, y, w, h);
    const g = c.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, rgba(col, .55)); g.addColorStop(1, col);
    c.fillStyle = g; c.shadowColor = col; c.shadowBlur = 16; c.fillRect(x + 5, y + 5, (w - 10) * v, h - 10); c.shadowBlur = 0;
    c.fillStyle = 'rgba(0,0,0,.25)'; for (let i = 1; i < 20; i++) c.fillRect(x + 5 + (w - 10) * i / 20 - 1, y + 5, 2, h - 10);
    const pct = o.pct == null ? v * 100 : o.pct;
    c.font = '64px AN'; c.textAlign = 'right'; c.fillStyle = COL.white; c.shadowColor = col; c.shadowBlur = 14;
    c.fillText(Math.round(pct) + '%', x + w, y - 40);
    c.restore();
  }
  function counter(c, x, y, v, o = {}) {
    const col = colOf(o.col), sz = o.size || 140, a = o.a == null ? 1 : o.a;
    c.save(); c.globalAlpha = a; c.font = `${sz}px AN`; c.textAlign = o.align || 'center'; c.textBaseline = 'middle';
    const s = (o.prefix || '') + (typeof v === 'string' ? v : fmt(v)) + (o.suffix || '');
    c.lineWidth = sz * .07; c.strokeStyle = 'rgba(0,0,0,.75)'; c.lineJoin = 'round'; c.strokeText(s, x, y);
    c.shadowColor = col; c.shadowBlur = sz * .25; c.fillStyle = COL.white; c.fillText(s, x, y);
    c.shadowBlur = sz * .08; c.fillStyle = mix(col, '#ffffff', .55); c.fillText(s, x, y);
    c.restore();
  }
  function tag(c, x, y, text, o = {}) {
    const col = colOf(o.col), sz = o.size || 38, p = o.p == null ? 1 : o.p, a = (o.a == null ? 1 : o.a) * clamp(p * 2);
    if (a <= 0) return;
    c.save(); c.globalAlpha = a; c.font = `${sz}px TY`; c.textBaseline = 'middle';
    const tw = c.measureText(text).width, w = tw + sz * 1.0, h = sz * 1.6, al = o.align || 'left';
    const x0 = al === 'right' ? x - w : al === 'center' ? x - w / 2 : x;
    if (o.tx != null) {
      const ax = al === 'right' ? x0 + w : x0, ay = y;
      const k = ease(p); c.strokeStyle = col; c.lineWidth = 3; c.shadowColor = col; c.shadowBlur = 8;
      c.beginPath(); c.moveTo(o.tx, o.ty); c.lineTo(o.tx + (ax - o.tx) * k, o.ty + (ay - o.ty) * k); c.stroke();
      c.fillStyle = col; c.beginPath(); c.arc(o.tx, o.ty, 7, 0, TAU); c.fill();
    }
    const sc = .6 + .4 * backOut(p);
    c.translate(x0 + (al === 'right' ? w : al === 'center' ? w / 2 : 0), y); c.scale(sc, sc); c.translate(-(x0 + (al === 'right' ? w : al === 'center' ? w / 2 : 0)), -y);
    c.shadowColor = 'rgba(0,0,0,.6)'; c.shadowBlur = 10; c.fillStyle = 'rgba(6,14,18,.86)'; c.fillRect(x0, y - h / 2, w, h); c.shadowBlur = 0;
    c.fillStyle = col; c.fillRect(x0, y - h / 2, 7, h);
    c.strokeStyle = rgba(col, .7); c.lineWidth = 2; c.strokeRect(x0, y - h / 2, w, h);
    c.fillStyle = COL.white; c.textAlign = 'left'; c.fillText(text, x0 + sz * .55, y + 2);
    c.restore();
  }

  window.V9C = { COL, grade, cctv, stutter, tc, trackBox, mesh, landmarks, face, faceGrid, silhouette, crowd, camera, matchBar, counter, tag, fmt, hash, ease, mix, rgba, backOut };
})();
