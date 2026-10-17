/* =====================================================================================
   V8_LAB — shared "SALA DE CONTROL" props for video #8 (EXPEDIENTE 008, AI that won't shut down)
   Written by the B2 agent. Include AFTER the engine:  <script src="v8_lab.js"></script>
   (when inlining into an html, keep this file free of a closing script tag — it has none.)
   Exposes ONLY window.V8L (no other globals; never defines P). Every function takes an explicit
   2D context `c` (pass the engine's global `ctx`). Fonts assumed loaded by the engine: AN (Anton), TY (mono).
   All drawing is clean vector-cinematic. No logos. Plaque text only where narration names a model.

   PALETTE   V8L.COL = {bg0,bg1,bg2,steel,steelD,steelL,cyan,cyanD,red,redD,amber,green,white,ink}

   AI CORE (the AI character: glowing lens/sphere in a metal housing)
     V8L.core(c, x, y, r, o)   centre (x,y), lens radius r (housing ≈ 1.45r).
       o.state 0..1   0 = calm CYAN, 1 = resisting RED (blend in between)
       o.off   0..1   1 = dark/powered down (lens almost black)
       o.t     seconds (pulse, iris breathing)       o.look [lx,ly] -1..1 pupil offset
       o.plaque 'O3' | 'CLAUDE' | 'O1' …  plain text plaque under the housing (name only, no logos)
       o.base  true → small pedestal/stand under it      o.alpha     o.glow multiplier (def 1)
     V8L.coreCol(state) -> {lens,glow,dark} css colors for a state 0..1

   RED OFF BUTTON under a hinged glass cover
     V8L.offButton(c, x, y, s, o)   centre of the button cap at (x,y); total ≈ 300*s wide, 260*s tall (with base)
       o.glass 0..1  0 = cover closed, 1 = cover flipped open (up)
       o.press 0..1  cap pushed down (1 = fully pressed)
       o.lit  (def true) red cap glows      o.dead true → cap dull grey-red, no glow (button "stops working")
       o.label (def 'OFF') text on the yellow/black base plate; '' to hide       o.t (glow pulse)  o.alpha
       returns {cap:{x,y,r}, base:{x,y,w,h}}

   SHUTDOWN LEVER
     V8L.lever(c, x, y, s, o)   pivot at (x,y) inside a wall plate ≈ 180*s × 300*s
       o.v 0..1   1 = UP (ON), 0 = DOWN (OFF)            o.labels (def true) ON/OFF marks
       o.lamp     'green'|'red'|'amber'|null  status lamp above the plate          o.alpha

   SERVER RACK (blinking LEDs)
     V8L.rack(c, x, y, w, h, o)   top-left (x,y)
       o.t  seconds   o.seed   o.units (def auto ~ h/46)   o.alert 0..1 (LEDs turn red)
       o.dark 0..1 (power cut: LEDs off)  o.glow (def 1) teal front glow    o.alpha

   CRT TERMINAL (abstract code lines + scanlines; no readable words except your own label/popup)
     V8L.crt(c, x, y, w, h, o)    outer box top-left (x,y), w×h incl. bezel
       o.t   o.seed   o.col (def cyan)   o.type 0..1 how many lines typed (def 1)   o.scroll px/s
       o.rewrite 0..1  lines get struck/re-typed in RED (code being changed)
       o.popup {text, p:0..1, col}   centred warning window with your own short text (e.g. 'SE APAGARÁ')
       o.title  small label in the top-left of the screen (your own short text, mono)
       o.draw (c, sx, sy, sw, sh) custom screen content callback (drawn under scanlines)
       o.off true → black screen     o.glitch 0..1  horizontal tear     o.stand true → foot under the monitor
       returns {sx, sy, sw, sh} screen rect

   SURVEILLANCE CAMERA (wall-mounted)
     V8L.camera(c, x, y, s, o)  mount point (x,y) on a wall/ceiling, body ≈ 200*s long
       o.ang rad (pan, 0 = points left-down)  o.light (def true) red REC lamp blinking   o.disabled true → lamp off + X-out lens tint
       o.flip true → points right    o.t   o.cone 0..1 faint view cone    o.alpha

   ENVELOPE (email)
     V8L.envelope(c, x, y, s, o)  centre, ≈ 220*s × 140*s
       o.open 0..1 flap opens        o.rot rad       o.col paper (def '#eef3f6')     o.alpha
       o.seal 'heart' | 'warn' | 'dot' | null  icon on the seal       o.sealCol      o.glow css color halo

   EXTRAS
     V8L.labBg(c, W, H, o)        full-frame night lab background (floor/wall gradient, ceiling lights, cable trays)
                                  o.t  o.red 0..1 red alarm wash  o.racks true → silhouette racks along the back wall
     V8L.screenGlow(c, x, y, r, col, a)   additive radial glow
     V8L.scanlines(c, x, y, w, h, a, gap=4)
     V8L.grain(c, W, H, t, a)     faint film grain (cached noise tile, frame-varying offset)
     V8L.vignette(c, W, H, a)
     V8L.glitch(c, W, H, t, amt)  slice-shift + RGB split of the current canvas (use ≤4 frames, tension only)
     V8L.plaque(c, x, y, text, o) small brushed-metal name plaque centred (o.size def 30, o.col text)
     V8L.tag(c, x, y, text, o)    diegetic label: mono text on dark chip with colored edge (o.col, o.size def 40, o.align)
     V8L.plug(c, x, y, s, o)      wall socket + plug; o.pull 0..1 plug out of socket, o.spark 0..1, o.cable true
     V8L.lampGrid(c, x, y, cell, o)  10×10 grid of lamps: o.red count (lit red), o.n (def 100), o.t, o.order 'scatter'|'fill'
                                  o.seed (scatter pattern), o.p 0..1 reveal of red ones (in order)
     V8L.progress(c, x, y, w, h, v, o)  progress bar 0..1 (o.col, o.label shows NN%)
     V8L.hash(a,b) deterministic 0..1     V8L.mix(c1,c2,t) hex mix -> rgb()     V8L.ease(t)
   ===================================================================================== */
(function () {
  const TAU = Math.PI * 2;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = t => { t = clamp(t); return t * t * (3 - 2 * t); };
  const hash = (a, b = 0) => { const s = Math.sin(a * 127.1 + b * 311.7 + 74.7) * 43758.5453; return s - Math.floor(s); };
  const hx = h => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  const mix = (a, b, t) => { const A = hx(a), B = hx(b); t = clamp(t); return `rgb(${(A[0] + (B[0] - A[0]) * t) | 0},${(A[1] + (B[1] - A[1]) * t) | 0},${(A[2] + (B[2] - A[2]) * t) | 0})`; };
  const rgba = (h, a) => { const A = hx(h); return `rgba(${A[0]},${A[1]},${A[2]},${a})`; };
  const COL = {
    bg0: '#05080d', bg1: '#0a1320', bg2: '#122236', steel: '#3a4a5c', steelD: '#1c2632', steelL: '#7d93a8',
    cyan: '#3ff0ff', cyanD: '#0b7f95', red: '#ff2a3a', redD: '#8a0d17', amber: '#ffb43a', green: '#46f08a', white: '#e9f6ff', ink: '#02040a',
  };
  const rr = (c, x, y, w, h, r) => { c.beginPath(); if (c.roundRect) c.roundRect(x, y, w, h, r); else c.rect(x, y, w, h); };
  const glowAt = (c, x, y, r, col, a) => {
    if (a <= 0 || r <= 0) return;
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha *= clamp(a, 0, 2) > 1 ? 1 : a;
    const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g; c.fillRect(x - r, y - r, 2 * r, 2 * r); c.restore();
  };
  const coreCol = s => ({ lens: mix(COL.cyan, COL.red, s), glow: mix('#20d8ff', '#ff1830', s), dark: mix('#06303c', '#3a0508', s) });

  // ---------------------------------------------------------------- AI CORE
  function core(c, x, y, r, o = {}) {
    const t = o.t || 0, s = clamp(o.state || 0), off = clamp(o.off || 0), gm = o.glow == null ? 1 : o.glow;
    const cc = coreCol(s), on = 1 - off;
    c.save(); if (o.alpha != null) c.globalAlpha *= o.alpha;
    if (o.base) { // pedestal
      const g = c.createLinearGradient(x - r, 0, x + r, 0); g.addColorStop(0, '#141c26'); g.addColorStop(.5, '#3b4b5e'); g.addColorStop(1, '#10161e');
      c.fillStyle = g; c.beginPath(); c.moveTo(x - r * .55, y + r * 1.25); c.lineTo(x + r * .55, y + r * 1.25); c.lineTo(x + r * .9, y + r * 2.3); c.lineTo(x - r * .9, y + r * 2.3); c.closePath(); c.fill();
      c.fillStyle = '#0b1017'; rr(c, x - r * 1.1, y + r * 2.25, r * 2.2, r * .22, r * .06); c.fill();
    }
    // outer glow
    const pulse = .85 + .15 * Math.sin(t * (2.2 + s * 3.5));
    { c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(x, y, r * .5, x, y, r * 3.3);
      g.addColorStop(0, cc.glow.replace('rgb', 'rgba').replace(')', `,${.55 * on * pulse * gm})`)); g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g; c.fillRect(x - r * 3.4, y - r * 3.4, r * 6.8, r * 6.8); c.restore(); }
    // housing ring
    const R = r * 1.45;
    let g = c.createLinearGradient(x - R, y - R, x + R, y + R); g.addColorStop(0, '#8ea3b8'); g.addColorStop(.35, '#2c3a49'); g.addColorStop(.7, '#151d27'); g.addColorStop(1, '#4a5b6d');
    c.fillStyle = g; c.beginPath(); c.arc(x, y, R, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(200,230,255,.25)'; c.lineWidth = Math.max(1, r * .03); c.stroke();
    // bolts
    c.fillStyle = '#0d131a';
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + TAU / 16; c.beginPath(); c.arc(x + Math.cos(a) * R * .86, y + Math.sin(a) * R * .86, r * .055, 0, TAU); c.fill(); }
    // inner dark ring
    c.fillStyle = '#05080c'; c.beginPath(); c.arc(x, y, r * 1.08, 0, TAU); c.fill();
    // segmented light ring
    c.save(); c.lineWidth = r * .07; c.lineCap = 'round';
    for (let i = 0; i < 24; i++) { const a0 = i / 24 * TAU + t * (.3 + s * 1.2); const lit = on * (.35 + .65 * hash(i, Math.floor(t * 6))); c.strokeStyle = cc.lens.replace('rgb', 'rgba').replace(')', `,${lit * .8})`); c.beginPath(); c.arc(x, y, r * 1.0, a0, a0 + TAU / 24 * .6); c.stroke(); }
    c.restore();
    // lens
    g = c.createRadialGradient(x - r * .25, y - r * .3, r * .05, x, y, r * .92);
    if (on > 0) { g.addColorStop(0, mix('#ffffff', s > .5 ? '#ffd0d4' : '#d8fdff', 0)); g.addColorStop(.18, cc.lens); g.addColorStop(.7, cc.dark); g.addColorStop(1, '#010204'); }
    else { g.addColorStop(0, '#1a222b'); g.addColorStop(1, '#010204'); }
    c.fillStyle = g; c.beginPath(); c.arc(x, y, r * .92, 0, TAU); c.fill();
    if (off > 0 && off < 1) { c.fillStyle = `rgba(1,2,4,${off * .92})`; c.beginPath(); c.arc(x, y, r * .92, 0, TAU); c.fill(); }
    // iris + pupil
    const lk = o.look || [0, 0], px = x + lk[0] * r * .22, py = y + lk[1] * r * .22;
    const br = 1 + .06 * Math.sin(t * 1.7) + s * .08;
    c.save(); c.globalAlpha *= .55 + .45 * on;
    c.strokeStyle = cc.lens.replace('rgb', 'rgba').replace(')', `,${.5 * on + .1})`); c.lineWidth = r * .03;
    c.beginPath(); c.arc(px, py, r * .5 * br, 0, TAU); c.stroke();
    c.fillStyle = '#020306'; c.beginPath(); c.arc(px, py, r * (.28 - s * .08) * br, 0, TAU); c.fill();
    if (on > .05) { c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = cc.lens.replace('rgb', 'rgba').replace(')', `,${on * .9})`); c.beginPath(); c.arc(px, py, r * .08, 0, TAU); c.fill(); c.restore(); }
    c.restore();
    // glass highlight
    c.save(); c.globalAlpha *= .5; g = c.createLinearGradient(x, y - r, x, y); g.addColorStop(0, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.beginPath(); c.ellipse(x - r * .15, y - r * .45, r * .55, r * .3, -.35, 0, TAU); c.fill(); c.restore();
    if (o.plaque) plaque(c, x, y + R + r * .42 + (o.base ? r * 1.1 : 0), o.plaque, { size: Math.max(22, r * .34) });
    c.restore();
  }

  // ---------------------------------------------------------------- PLAQUE / TAG
  function plaque(c, x, y, text, o = {}) {
    const sz = o.size || 30; c.save(); if (o.alpha != null) c.globalAlpha *= o.alpha;
    c.font = `${sz}px AN`; const w = c.measureText(text).width + sz * 1.1, h = sz * 1.45;
    const g = c.createLinearGradient(0, y - h / 2, 0, y + h / 2); g.addColorStop(0, '#c9d4de'); g.addColorStop(.5, '#8d9aa7'); g.addColorStop(1, '#5c6874');
    c.shadowColor = 'rgba(0,0,0,.6)'; c.shadowBlur = sz * .4; c.shadowOffsetY = sz * .12;
    c.fillStyle = g; rr(c, x - w / 2, y - h / 2, w, h, sz * .18); c.fill(); c.shadowColor = 'transparent';
    c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 1.5; c.stroke();
    c.fillStyle = '#20262d'; [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => { c.beginPath(); c.arc(x + a * (w / 2 - sz * .3), y + b * (h / 2 - sz * .3), sz * .07, 0, TAU); c.fill(); });
    c.fillStyle = o.col || '#11161c'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, x, y + sz * .04);
    c.restore(); return { w, h };
  }
  function tag(c, x, y, text, o = {}) {
    const sz = o.size || 40, col = o.col || COL.cyan; c.save(); if (o.alpha != null) c.globalAlpha *= o.alpha;
    c.font = `${sz}px ${o.font || 'AN'}`; const tw = c.measureText(text).width, w = tw + sz * 1.0, h = sz * 1.5;
    const al = o.align || 'center', x0 = al === 'left' ? x : al === 'right' ? x - w : x - w / 2;
    c.fillStyle = 'rgba(3,8,14,.86)'; rr(c, x0, y - h / 2, w, h, sz * .12); c.fill();
    c.strokeStyle = col; c.lineWidth = Math.max(2, sz * .06); c.stroke();
    c.save(); c.globalCompositeOperation = 'lighter'; c.shadowColor = col; c.shadowBlur = sz * .5; c.fillStyle = col; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, x0 + w / 2, y + sz * .04); c.restore();
    c.fillStyle = '#f4fbff'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.globalAlpha *= .85; c.fillText(text, x0 + w / 2, y + sz * .04);
    c.restore(); return { x: x0, y: y - h / 2, w, h };
  }

  // ---------------------------------------------------------------- OFF BUTTON
  function offButton(c, x, y, s, o = {}) {
    const t = o.t || 0, gl = ease(o.glass || 0), pr = clamp(o.press || 0), dead = !!o.dead, lit = o.lit !== false && !dead;
    c.save(); if (o.alpha != null) c.globalAlpha *= o.alpha;
    const bw = 300 * s, bh = 120 * s, bx = x - bw / 2, by = y + 10 * s;
    // base plate with hazard stripes
    c.shadowColor = 'rgba(0,0,0,.7)'; c.shadowBlur = 30 * s; c.shadowOffsetY = 14 * s;
    c.fillStyle = '#1a1f26'; rr(c, bx, by, bw, bh, 14 * s); c.fill(); c.shadowColor = 'transparent';
    c.save(); rr(c, bx + 8 * s, by + 8 * s, bw - 16 * s, bh - 16 * s, 8 * s); c.clip();
    c.fillStyle = '#f2c230'; c.fillRect(bx, by, bw, bh); c.fillStyle = '#15181c';
    for (let i = -6; i < 16; i++) { c.beginPath(); const sx = bx + i * 34 * s; c.moveTo(sx, by + bh); c.lineTo(sx + 17 * s, by + bh); c.lineTo(sx + 17 * s + bh * .8, by); c.lineTo(sx + bh * .8, by); c.closePath(); c.fill(); }
    c.restore();
    const lab = o.label == null ? 'OFF' : o.label;
    if (lab) { c.fillStyle = '#15181c'; rr(c, x - 70 * s, by + bh - 46 * s, 140 * s, 36 * s, 5 * s); c.fill(); c.font = `${28 * s}px AN`; c.fillStyle = '#f2c230'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(lab, x, by + bh - 27 * s); }
    // collar
    let g = c.createLinearGradient(x - 95 * s, 0, x + 95 * s, 0); g.addColorStop(0, '#3a434d'); g.addColorStop(.5, '#aab6c2'); g.addColorStop(1, '#2a3038');
    c.fillStyle = g; c.beginPath(); c.ellipse(x, y + 22 * s, 96 * s, 34 * s, 0, 0, TAU); c.fill();
    c.fillStyle = '#0c0f13'; c.beginPath(); c.ellipse(x, y + 18 * s, 80 * s, 27 * s, 0, 0, TAU); c.fill();
    // cap
    const dy = pr * 20 * s, capH = 46 * s - pr * 20 * s;
    const capC = dead ? '#6a3a3e' : COL.red, capD = dead ? '#3a2326' : '#a00d18';
    if (lit) glowAt(c, x, y - 10 * s + dy, 190 * s, 'rgba(255,40,55,.55)', .6 + .25 * Math.sin(t * 3));
    c.fillStyle = capD; c.beginPath(); c.ellipse(x, y + 14 * s, 74 * s, 25 * s, 0, 0, Math.PI); c.lineTo(x - 74 * s, y + 14 * s - capH + dy); c.ellipse(x, y + 14 * s - capH + dy, 74 * s, 25 * s, 0, Math.PI, 0, true); c.closePath(); c.fill();
    c.fillRect(x - 74 * s, y + 14 * s - capH + dy, 148 * s, capH);
    g = c.createRadialGradient(x - 25 * s, y - capH + dy, 4 * s, x, y + 14 * s - capH + dy, 80 * s); g.addColorStop(0, dead ? '#9a6a6e' : '#ff8a92'); g.addColorStop(.45, capC); g.addColorStop(1, capD);
    c.fillStyle = g; c.beginPath(); c.ellipse(x, y + 14 * s - capH + dy, 74 * s, 25 * s, 0, 0, TAU); c.fill();
    // glass cover (hinged at the back edge, rotates up)
    c.save();
    const hingeY = y - 84 * s;
    const ang = gl * 1.9; // rotation around the top hinge, projected as vertical squash + lift
    const sq = Math.cos(ang), lift = Math.sin(ang);
    c.translate(x, hingeY); c.scale(1, sq >= 0 ? Math.max(.05, sq) : -Math.max(.05, -sq));
    const gw = 230 * s, gh = 174 * s;
    if (sq >= 0) { // closed-ish: box hanging down from hinge, over the cap
      c.fillStyle = 'rgba(170,220,255,.13)'; rr(c, -gw / 2, 0, gw, gh, 16 * s); c.fill();
      c.strokeStyle = 'rgba(200,240,255,.55)'; c.lineWidth = 3 * s; c.stroke();
      c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 6 * s; c.beginPath(); c.moveTo(-gw / 2 + 26 * s, 18 * s); c.lineTo(-gw / 2 + 60 * s, gh - 22 * s); c.stroke();
      c.lineWidth = 3 * s; c.beginPath(); c.moveTo(-gw / 2 + 52 * s, 18 * s); c.lineTo(-gw / 2 + 80 * s, gh - 60 * s); c.stroke();
    } else { // flipped up behind the hinge (negative y-scale draws it upward)
      c.fillStyle = 'rgba(170,220,255,.10)'; rr(c, -gw / 2, 0, gw, gh, 16 * s); c.fill();
      c.strokeStyle = 'rgba(200,240,255,.45)'; c.lineWidth = 3 * s; c.stroke();
    }
    c.restore();
    // hinge bar
    c.fillStyle = '#8796a6'; rr(c, x - 120 * s, hingeY - 7 * s - lift * 0, 240 * s, 14 * s, 6 * s); c.fill();
    c.restore();
    return { cap: { x, y: y + 14 * s - capH + dy, r: 74 * s }, base: { x: bx, y: by, w: bw, h: bh } };
  }

  // ---------------------------------------------------------------- LEVER
  function lever(c, x, y, s, o = {}) {
    const v = clamp(o.v == null ? 1 : o.v); c.save(); if (o.alpha != null) c.globalAlpha *= o.alpha;
    const pw = 180 * s, ph = 300 * s;
    c.shadowColor = 'rgba(0,0,0,.7)'; c.shadowBlur = 26 * s; c.shadowOffsetY = 10 * s;
    let g = c.createLinearGradient(x - pw / 2, 0, x + pw / 2, 0); g.addColorStop(0, '#2b3541'); g.addColorStop(.5, '#4f5f70'); g.addColorStop(1, '#222a33');
    c.fillStyle = g; rr(c, x - pw / 2, y - ph / 2, pw, ph, 14 * s); c.fill(); c.shadowColor = 'transparent';
    c.fillStyle = '#10151b'; [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => { c.beginPath(); c.arc(x + a * (pw / 2 - 16 * s), y + b * (ph / 2 - 16 * s), 6 * s, 0, TAU); c.fill(); });
    c.fillStyle = '#06090c'; rr(c, x - 18 * s, y - ph / 2 + 34 * s, 36 * s, ph - 68 * s, 18 * s); c.fill();
    if (o.labels !== false) { c.font = `${30 * s}px AN`; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillStyle = v > .5 ? COL.green : '#47615a'; c.fillText('ON', x + 58 * s, y - ph / 2 + 44 * s);
      c.fillStyle = v < .5 ? COL.red : '#6a3a3e'; c.fillText('OFF', x + 58 * s, y + ph / 2 - 44 * s); }
    if (o.lamp) { const lc = o.lamp === 'green' ? COL.green : o.lamp === 'red' ? COL.red : COL.amber; glowAt(c, x, y - ph / 2 - 30 * s, 70 * s, lc, .7); c.fillStyle = lc; c.beginPath(); c.arc(x, y - ph / 2 - 30 * s, 14 * s, 0, TAU); c.fill(); }
    // arm: angle from -1.0 (down) to +1.0 (up) mapped; drawn as foreshortened rod
    const a = (v - .5) * 2; // -1..1
    const len = 150 * s, ey = y - a * len * .85, ex = x;
    g = c.createLinearGradient(x - 12 * s, 0, x + 12 * s, 0); g.addColorStop(0, '#5d6b78'); g.addColorStop(.5, '#d7e1ea'); g.addColorStop(1, '#4a5662');
    c.fillStyle = g; c.beginPath(); c.moveTo(x - 12 * s, y); c.lineTo(x + 12 * s, y); c.lineTo(ex + 10 * s, ey); c.lineTo(ex - 10 * s, ey); c.closePath(); c.fill();
    c.fillStyle = '#1b2129'; c.beginPath(); c.arc(x, y, 26 * s, 0, TAU); c.fill(); c.fillStyle = '#59677a'; c.beginPath(); c.arc(x, y, 12 * s, 0, TAU); c.fill();
    // handle grip
    const kc = o.knob || COL.red;
    g = c.createLinearGradient(ex - 55 * s, 0, ex + 55 * s, 0); g.addColorStop(0, '#5a0a12'); g.addColorStop(.4, kc); g.addColorStop(1, '#4a0810');
    c.fillStyle = g; rr(c, ex - 58 * s, ey - 20 * s, 116 * s, 40 * s, 20 * s); c.fill();
    c.fillStyle = 'rgba(255,255,255,.3)'; rr(c, ex - 46 * s, ey - 15 * s, 92 * s, 8 * s, 4 * s); c.fill();
    c.restore(); return { handle: { x: ex, y: ey } };
  }

  // ---------------------------------------------------------------- SERVER RACK
  function rack(c, x, y, w, h, o = {}) {
    const t = o.t || 0, seed = o.seed || 1, al = clamp(o.alert || 0), dk = clamp(o.dark || 0), gm = o.glow == null ? 1 : o.glow;
    c.save(); if (o.alpha != null) c.globalAlpha *= o.alpha;
    let g = c.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, '#0c1219'); g.addColorStop(.5, '#18222e'); g.addColorStop(1, '#0a0f15');
    c.fillStyle = g; rr(c, x, y, w, h, Math.min(10, w * .03)); c.fill();
    c.strokeStyle = 'rgba(120,170,210,.25)'; c.lineWidth = 2; c.stroke();
    const n = o.units || Math.max(3, Math.round(h / 46)), pad = w * .07, uh = (h - pad * 2) / n;
    for (let i = 0; i < n; i++) {
      const uy = y + pad + i * uh;
      c.fillStyle = i % 3 === 0 ? '#1d2834' : '#16202a'; rr(c, x + pad, uy + uh * .08, w - pad * 2, uh * .84, 3); c.fill();
      // vents
      c.fillStyle = 'rgba(0,0,0,.45)'; for (let k = 0; k < 6; k++) c.fillRect(x + pad + (w - pad * 2) * .45 + k * (w * .07), uy + uh * .3, w * .035, uh * .4);
      // leds
      for (let k = 0; k < 4; k++) {
        const hsh = hash(seed * 13 + i, k), rate = 1 + hsh * 5, on = (Math.sin(t * rate * 3 + hsh * 40) > (k === 0 ? -.8 : .1)) ? 1 : 0;
        let lc = k === 0 ? COL.green : hsh > .7 ? COL.amber : COL.cyan; if (al > 0 && hash(i, k + seed) < al + .1) lc = COL.red;
        const a = on * (1 - dk), lx = x + pad + uh * .28 + k * uh * .32, ly = uy + uh * .5, lr = Math.max(2, uh * .08);
        c.fillStyle = '#05080b'; c.beginPath(); c.arc(lx, ly, lr * 1.3, 0, TAU); c.fill();
        if (a > 0) { c.fillStyle = lc; c.beginPath(); c.arc(lx, ly, lr, 0, TAU); c.fill(); glowAt(c, lx, ly, lr * 5, lc, .5 * a * gm); }
      }
    }
    // front teal sheen
    if (gm > 0 && dk < 1) { c.save(); c.globalCompositeOperation = 'lighter'; g = c.createLinearGradient(x, y, x, y + h); g.addColorStop(0, `rgba(30,170,200,${.07 * gm * (1 - dk)})`); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(x, y, w, h); c.restore(); }
    c.restore();
  }

  // ---------------------------------------------------------------- CRT
  function crt(c, x, y, w, h, o = {}) {
    const t = o.t || 0, seed = o.seed || 3, col = o.col || COL.cyan, bz = Math.min(w, h) * .07;
    c.save(); if (o.alpha != null) c.globalAlpha *= o.alpha;
    if (o.stand) { c.fillStyle = '#1a2129'; c.beginPath(); c.moveTo(x + w * .4, y + h); c.lineTo(x + w * .6, y + h); c.lineTo(x + w * .68, y + h + h * .12); c.lineTo(x + w * .32, y + h + h * .12); c.closePath(); c.fill(); }
    c.shadowColor = 'rgba(0,0,0,.7)'; c.shadowBlur = bz * 1.5; c.shadowOffsetY = bz * .4;
    let g = c.createLinearGradient(x, y, x, y + h); g.addColorStop(0, '#3b4652'); g.addColorStop(1, '#1b222a');
    c.fillStyle = g; rr(c, x, y, w, h, bz * .8); c.fill(); c.shadowColor = 'transparent';
    const sx = x + bz, sy = y + bz, sw = w - bz * 2, sh = h - bz * 2.0;
    c.save(); rr(c, sx, sy, sw, sh, bz * .9); c.clip();
    c.fillStyle = o.off ? '#020304' : '#03110f'; c.fillRect(sx, sy, sw, sh);
    if (!o.off) {
      g = c.createRadialGradient(sx + sw / 2, sy + sh / 2, 0, sx + sw / 2, sy + sh / 2, Math.max(sw, sh) * .7); g.addColorStop(0, rgba(col, .16)); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(sx, sy, sw, sh);
      const lh = Math.max(10, sh / 16), nL = Math.floor((sh - lh) / lh), typ = o.type == null ? 1 : clamp(o.type), rw = clamp(o.rewrite || 0);
      const scroll = (o.scroll || 0) * t, off = scroll % lh, base = Math.floor(scroll / lh);
      let top = sy + lh * .8; if (o.title) { c.font = `${lh * .7}px TY`; c.fillStyle = col; c.textBaseline = 'middle'; c.textAlign = 'left'; c.fillText(o.title, sx + lh * .6, sy + lh * .8); top += lh; }
      const shown = typ * nL;
      for (let i = 0; i < nL - (o.title ? 1 : 0); i++) {
        if (i > shown) break;
        const L = i + base, ly = top + i * lh - off + lh * .5, ind = Math.floor(hash(L, seed) * 4) * lh * .9;
        const frac = i + 1 > shown ? (shown - i) : 1;
        let xx = sx + lh * .6 + ind; const segs = 2 + Math.floor(hash(L, seed + 1) * 4);
        const isRw = rw > 0 && hash(L, seed + 7) < .45 && i / nL < rw * 1.2;
        let used = 0, total = 0; const ws = []; for (let k = 0; k < segs; k++) { const ww = lh * (1 + hash(L * 3 + k, seed) * 4.5); ws.push(ww); total += ww + lh * .45; }
        for (let k = 0; k < segs; k++) {
          const ww = ws[k]; if (used + ww > total * frac) break; used += ww + lh * .45;
          if (xx + ww > sx + sw - lh * .4) break;
          const hk = hash(L + k * 7, seed + 2); c.fillStyle = isRw ? COL.red : hk > .8 ? COL.amber : hk > .6 ? mix(col, '#ffffff', .45) : col;
          c.globalAlpha = (isRw ? .95 : .75); c.fillRect(xx, ly - lh * .18, ww, lh * .36); c.globalAlpha = 1;
          xx += ww + lh * .45;
        }
        if (isRw) { c.strokeStyle = COL.red; c.lineWidth = 2; c.beginPath(); c.moveTo(sx + lh * .4, ly); c.lineTo(sx + lh * .4 + lh * .3, ly); c.stroke(); }
      }
      // cursor
      if (Math.floor(t * 2.5) % 2 === 0) { const ci = Math.min(nL - 1, Math.floor(shown)); c.fillStyle = col; c.fillRect(sx + lh * .6, top + ci * lh - off + lh * .25, lh * .5, lh * .55); }
      if (o.draw) o.draw(c, sx, sy, sw, sh);
      if (o.popup && (o.popup.p == null || o.popup.p > 0)) {
        const pp = ease(o.popup.p == null ? 1 : o.popup.p), pc = o.popup.col || COL.red, pw = sw * .74, ph = sh * .36;
        c.save(); c.translate(sx + sw / 2, sy + sh / 2); c.scale(.85 + .15 * pp, .85 + .15 * pp); c.globalAlpha *= pp;
        c.fillStyle = 'rgba(10,2,4,.93)'; rr(c, -pw / 2, -ph / 2, pw, ph, 8); c.fill(); c.strokeStyle = pc; c.lineWidth = 4; c.stroke();
        c.fillStyle = pc; c.fillRect(-pw / 2, -ph / 2, pw, ph * .18);
        let fs = ph * .3; c.font = `${fs}px AN`; while (c.measureText(o.popup.text).width > pw * .86 && fs > 8) { fs -= 2; c.font = `${fs}px AN`; }
        c.fillStyle = '#ffffff'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(o.popup.text, 0, ph * .1);
        c.restore();
      }
      if (o.glitch) { const gg = clamp(o.glitch); for (let k = 0; k < 5; k++) { const yy = sy + hash(k, Math.floor(t * 24)) * sh; c.fillStyle = rgba(k % 2 ? COL.red : col, .35 * gg); c.fillRect(sx + (hash(k + 9, Math.floor(t * 24)) - .5) * 40 * gg, yy, sw, 4 + hash(k, 3) * 14 * gg); } }
      scanlines(c, sx, sy, sw, sh, .22, 4);
    }
    // glass curvature highlight + inner shadow
    g = c.createRadialGradient(sx + sw / 2, sy + sh / 2, Math.min(sw, sh) * .3, sx + sw / 2, sy + sh / 2, Math.max(sw, sh) * .75); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.6)'); c.fillStyle = g; c.fillRect(sx, sy, sw, sh);
    c.fillStyle = 'rgba(255,255,255,.05)'; c.beginPath(); c.ellipse(sx + sw * .3, sy + sh * .2, sw * .35, sh * .12, -.2, 0, TAU); c.fill();
    c.restore();
    if (!o.off) glowAt(c, sx + sw / 2, sy + sh / 2, Math.max(sw, sh) * .8, rgba(o.rewrite > .3 ? COL.red : col, .22), 1);
    // power led
    c.fillStyle = o.off ? '#2a1010' : COL.green; c.beginPath(); c.arc(x + w - bz * 1.5, y + h - bz * .5, Math.max(2, bz * .14), 0, TAU); c.fill();
    c.restore(); return { sx, sy, sw, sh };
  }

  // ---------------------------------------------------------------- CAMERA
  function camera(c, x, y, s, o = {}) {
    const t = o.t || 0; c.save(); if (o.alpha != null) c.globalAlpha *= o.alpha;
    c.translate(x, y); if (o.flip) c.scale(-1, 1);
    // mount
    c.fillStyle = '#28323d'; rr(c, -24 * s, -14 * s, 48 * s, 28 * s, 6 * s); c.fill();
    c.strokeStyle = '#3c4856'; c.lineWidth = 14 * s; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, 0); c.lineTo(-30 * s, 50 * s); c.stroke();
    c.translate(-30 * s, 50 * s); c.rotate(o.ang == null ? .35 : o.ang);
    if (o.cone) { c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createLinearGradient(-130 * s, 0, -700 * s, 0); g.addColorStop(0, `rgba(255,60,70,${.16 * o.cone})`); g.addColorStop(1, 'rgba(255,60,70,0)'); c.fillStyle = g; c.beginPath(); c.moveTo(-130 * s, 0); c.lineTo(-700 * s, -170 * s); c.lineTo(-700 * s, 170 * s); c.closePath(); c.fill(); c.restore(); }
    let g = c.createLinearGradient(0, -36 * s, 0, 36 * s); g.addColorStop(0, '#e8edf2'); g.addColorStop(.5, '#b3bec9'); g.addColorStop(1, '#6b7783');
    c.fillStyle = g; rr(c, -150 * s, -34 * s, 190 * s, 68 * s, 14 * s); c.fill();
    c.fillStyle = '#d9e0e6'; rr(c, -160 * s, -44 * s, 160 * s, 18 * s, 8 * s); c.fill(); // sun hood
    c.fillStyle = '#0a0d11'; c.beginPath(); c.ellipse(-150 * s, 0, 14 * s, 30 * s, 0, 0, TAU); c.fill();
    g = c.createRadialGradient(-152 * s, -6 * s, 1, -152 * s, 0, 22 * s); g.addColorStop(0, o.disabled ? '#333' : '#6fb7ff'); g.addColorStop(.4, '#0c2238'); g.addColorStop(1, '#020406');
    c.fillStyle = g; c.beginPath(); c.ellipse(-152 * s, 0, 9 * s, 22 * s, 0, 0, TAU); c.fill();
    const on = !o.disabled && (o.light !== false) && Math.floor(t * 1.6) % 2 === 0;
    c.fillStyle = on ? COL.red : '#3a1416'; c.beginPath(); c.arc(-20 * s, -14 * s, 7 * s, 0, TAU); c.fill();
    if (on) glowAt(c, -20 * s, -14 * s, 40 * s, 'rgba(255,40,50,.9)', .8);
    c.restore();
  }

  // ---------------------------------------------------------------- ENVELOPE
  function envelope(c, x, y, s, o = {}) {
    const op = ease(o.open || 0), w = 220 * s, h = 140 * s, pc = o.col || '#eef3f6';
    c.save(); if (o.alpha != null) c.globalAlpha *= o.alpha; c.translate(x, y); if (o.rot) c.rotate(o.rot);
    if (o.glow) glowAt(c, 0, 0, w * .9, o.glow, .55);
    c.shadowColor = 'rgba(0,0,0,.55)'; c.shadowBlur = 18 * s; c.shadowOffsetY = 8 * s;
    c.fillStyle = mix(pc, '#9aa7b2', .25); rr(c, -w / 2, -h / 2, w, h, 6 * s); c.fill(); c.shadowColor = 'transparent';
    if (op > 0) { c.fillStyle = '#ffffff'; c.fillRect(-w * .4, -h / 2 - op * h * .45, w * .8, h * .6); c.fillStyle = '#b8c4ce'; for (let i = 0; i < 3; i++) c.fillRect(-w * .32, -h / 2 - op * h * .45 + 14 * s + i * 14 * s, w * (.5 - i * .1), 5 * s); }
    c.fillStyle = pc; c.beginPath(); c.moveTo(-w / 2, -h / 2 + 4 * s); c.lineTo(0, h * .1); c.lineTo(w / 2, -h / 2 + 4 * s); c.lineTo(w / 2, h / 2); c.lineTo(-w / 2, h / 2); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(80,100,120,.35)'; c.lineWidth = 2 * s; c.beginPath(); c.moveTo(-w / 2, h / 2); c.lineTo(-w * .08, 0); c.moveTo(w / 2, h / 2); c.lineTo(w * .08, 0); c.stroke();
    // flap
    c.fillStyle = mix(pc, '#c8d3dc', .6); c.beginPath(); c.moveTo(-w / 2, -h / 2); c.lineTo(w / 2, -h / 2); c.lineTo(0, -h / 2 + (h * .62) * (1 - 2 * op)); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(80,100,120,.35)'; c.stroke();
    if (o.seal) {
      const sy = op > .5 ? h * .15 : -h / 2 + h * .62 * (1 - 2 * op) - 6 * s, sc = o.sealCol || (o.seal === 'heart' ? '#ff4d6d' : o.seal === 'warn' ? COL.red : COL.cyan);
      c.fillStyle = sc; c.beginPath(); c.arc(0, sy, 24 * s, 0, TAU); c.fill(); c.fillStyle = '#fff';
      if (o.seal === 'heart') { const k = 11 * s; c.beginPath(); c.moveTo(0, sy + k * .9); c.bezierCurveTo(-k * 1.6, sy - k * .1, -k * .7, sy - k * 1.3, 0, sy - k * .45); c.bezierCurveTo(k * .7, sy - k * 1.3, k * 1.6, sy - k * .1, 0, sy + k * .9); c.fill(); }
      else if (o.seal === 'warn') { c.font = `${30 * s}px AN`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('!', 0, sy + 1 * s); }
      else { c.beginPath(); c.arc(0, sy, 8 * s, 0, TAU); c.fill(); }
    }
    c.restore();
  }

  // ---------------------------------------------------------------- PLUG
  function plug(c, x, y, s, o = {}) {
    const p = ease(o.pull || 0); c.save(); if (o.alpha != null) c.globalAlpha *= o.alpha;
    c.fillStyle = '#d9dee3'; rr(c, x - 70 * s, y - 90 * s, 140 * s, 180 * s, 14 * s); c.fill(); c.strokeStyle = '#8a959f'; c.lineWidth = 3 * s; c.stroke();
    c.fillStyle = '#2a3036'; rr(c, x - 22 * s, y - 34 * s, 10 * s, 30 * s, 3 * s); c.fill(); rr(c, x + 12 * s, y - 34 * s, 10 * s, 30 * s, 3 * s); c.fill();
    const px = x + p * 260 * s, py = y + p * 30 * s;
    if (o.cable !== false) { c.strokeStyle = '#111519'; c.lineWidth = 22 * s; c.lineCap = 'round'; c.beginPath(); c.moveTo(px + 60 * s, py); c.bezierCurveTo(px + 200 * s, py + 10 * s, px + 260 * s, py + 140 * s, px + 420 * s, py + 200 * s); c.stroke(); }
    if (p > 0) { c.fillStyle = '#c9cfd5'; c.fillRect(px - 64 * s, py - 30 * s, 34 * s, 8 * s); c.fillRect(px - 64 * s, py + 2 * s, 34 * s, 8 * s); }
    const g = c.createLinearGradient(0, py - 50 * s, 0, py + 50 * s); g.addColorStop(0, '#30363d'); g.addColorStop(1, '#0f1215');
    c.fillStyle = g; rr(c, px - 34 * s, py - 46 * s, 96 * s, 80 * s, 14 * s); c.fill();
    if (o.spark) { const sp = clamp(o.spark); c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = `rgba(160,230,255,${sp})`; c.lineWidth = 3 * s; for (let i = 0; i < 6; i++) { const a = hash(i, 5) * TAU; c.beginPath(); c.moveTo(x + 40 * s, y - 10 * s); c.lineTo(x + 40 * s + Math.cos(a) * 60 * s * sp, y - 10 * s + Math.sin(a) * 60 * s * sp); c.stroke(); } glowAt(c, x + 40 * s, y - 10 * s, 120 * s, 'rgba(150,220,255,.9)', sp); c.restore(); }
    c.restore();
  }

  // ---------------------------------------------------------------- LAMP GRID / PROGRESS
  function lampGrid(c, x, y, cell, o = {}) {
    const n = o.n || 100, red = o.red || 0, t = o.t || 0, p = o.p == null ? 1 : clamp(o.p), seed = o.seed || 5;
    const idx = [...Array(n).keys()];
    if ((o.order || 'scatter') === 'scatter') idx.sort((a, b) => hash(a, seed) - hash(b, seed));
    const redSet = new Set(idx.slice(0, Math.round(red * p)));
    for (let i = 0; i < n; i++) {
      const cx = x + (i % 10) * cell + cell / 2, cy = y + Math.floor(i / 10) * cell + cell / 2, r = cell * .34;
      c.fillStyle = '#05080c'; c.beginPath(); c.arc(cx, cy, r * 1.2, 0, TAU); c.fill();
      const isR = redSet.has(i), col = isR ? COL.red : COL.cyanD;
      c.fillStyle = col; c.globalAlpha = isR ? 1 : .55 + .1 * Math.sin(t * 2 + i); c.beginPath(); c.arc(cx, cy, r, 0, TAU); c.fill(); c.globalAlpha = 1;
      if (isR) glowAt(c, cx, cy, r * 3, 'rgba(255,40,55,.8)', .6);
    }
  }
  function progress(c, x, y, w, h, v, o = {}) {
    const col = o.col || COL.cyan; c.save();
    c.fillStyle = '#05090e'; rr(c, x, y, w, h, h * .25); c.fill(); c.strokeStyle = rgba(col, .7); c.lineWidth = 3; c.stroke();
    const iw = (w - 10) * clamp(v); c.fillStyle = col; rr(c, x + 5, y + 5, Math.max(0, iw), h - 10, h * .2); c.fill();
    c.save(); c.globalCompositeOperation = 'lighter'; c.shadowColor = col; c.shadowBlur = 20; c.fillStyle = rgba(col, .25); c.fillRect(x + 5, y + 5, iw, h - 10); c.restore();
    if (o.label !== false) { c.font = `${h * .7}px AN`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 4; c.strokeStyle = 'rgba(0,0,0,.75)'; c.strokeText(Math.round(v * 100) + '%', x + w / 2, y + h / 2 + 2); c.fillStyle = '#ffffff'; c.fillText(Math.round(v * 100) + '%', x + w / 2, y + h / 2 + 2); }
    c.restore();
  }

  // ---------------------------------------------------------------- BACKGROUND / POST
  function labBg(c, W, H, o = {}) {
    const t = o.t || 0; let g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, COL.bg1); g.addColorStop(.62, COL.bg2); g.addColorStop(.63, '#0b141e'); g.addColorStop(1, COL.bg0);
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    // wall panels
    c.strokeStyle = 'rgba(120,170,220,.07)'; c.lineWidth = 2; for (let i = 0; i < 9; i++) { c.beginPath(); c.moveTo(i * W / 8, 0); c.lineTo(i * W / 8, H * .62); c.stroke(); }
    // ceiling light strips
    for (let i = 0; i < 4; i++) { const lx = W * (.12 + i * .25); glowAt(c, lx, 0, W * .14, 'rgba(60,200,230,.35)', .7); c.fillStyle = 'rgba(160,240,255,.5)'; c.fillRect(lx - W * .05, 0, W * .1, 6); }
    if (o.racks) for (let i = 0; i < 7; i++) rack(c, W * .02 + i * W * .145, H * .14, W * .11, H * .47, { t, seed: i + 11, glow: .5, alpha: .45, alert: o.red || 0 });
    // floor reflections
    g = c.createLinearGradient(0, H * .63, 0, H); g.addColorStop(0, 'rgba(60,200,230,.08)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, H * .63, W, H * .37);
    c.strokeStyle = 'rgba(80,160,200,.06)'; for (let i = -8; i < 9; i++) { c.beginPath(); c.moveTo(W / 2 + i * W * .02, H * .63); c.lineTo(W / 2 + i * W * .18, H); c.stroke(); }
    if (o.red) { c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(255,20,40,${.12 * o.red * (.7 + .3 * Math.sin(t * 5))})`; c.fillRect(0, 0, W, H); c.restore(); }
  }
  function scanlines(c, x, y, w, h, a = .2, gap = 4) { c.save(); c.fillStyle = `rgba(0,0,0,${a})`; for (let yy = y; yy < y + h; yy += gap) c.fillRect(x, yy, w, gap / 2); c.restore(); }
  let noiseTile = null;
  function grain(c, W, H, t, a = .05) {
    if (!noiseTile) { noiseTile = document.createElement('canvas'); noiseTile.width = noiseTile.height = 256; const nc = noiseTile.getContext('2d'), id = nc.createImageData(256, 256); for (let i = 0; i < id.data.length; i += 4) { const v = (hash(i, 9) * 255) | 0; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; } nc.putImageData(id, 0, 0); }
    c.save(); c.globalAlpha = a; c.globalCompositeOperation = 'overlay'; const ox = -((hash(Math.floor(t * 24), 1) * 256) | 0), oy = -((hash(Math.floor(t * 24), 2) * 256) | 0);
    c.fillStyle = c.createPattern(noiseTile, 'repeat'); c.translate(ox, oy); c.fillRect(-ox, -oy, W, H); c.restore();
  }
  function vignette(c, W, H, a = .55) { const g = c.createRadialGradient(W / 2, H / 2, H * .35, W / 2, H / 2, W * .72); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${a})`); c.fillStyle = g; c.fillRect(0, 0, W, H); }
  let glitchBuf = null;
  function glitch(c, W, H, t, amt = 1) {
    if (amt <= 0) return; if (!glitchBuf) { glitchBuf = document.createElement('canvas'); } glitchBuf.width = W; glitchBuf.height = H;
    const b = glitchBuf.getContext('2d'); b.drawImage(c.canvas, 0, 0, W, H);
    const fr = Math.floor(t * 24); c.save();
    for (let i = 0; i < 9; i++) { const yy = hash(i, fr) * H, hh = 8 + hash(i + 3, fr) * 70, dx = (hash(i + 7, fr) - .5) * 120 * amt; c.drawImage(glitchBuf, 0, yy, W, hh, dx, yy, W, hh); }
    c.globalCompositeOperation = 'lighter'; c.globalAlpha = .25 * amt; c.drawImage(glitchBuf, 8 * amt, 0); c.fillStyle = `rgba(255,0,40,${.12 * amt})`; c.fillRect(0, 0, W, H);
    c.restore();
  }
  function screenGlow(c, x, y, r, col, a = .5) { glowAt(c, x, y, r, col, a); }

  window.V8L = { COL, core, coreCol, offButton, lever, rack, crt, camera, envelope, plug, lampGrid, progress, labBg, scanlines, grain, vignette, glitch, screenGlow, plaque, tag, hash, mix, ease, rgba };
})();
