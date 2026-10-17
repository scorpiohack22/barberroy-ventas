// ================= V9 B1 — "OJO DE CÁMARA" helpers (CCTV feed overlay + face recognition graphics, own copy) =================
const SMt = (lt, k = 2) => Math.floor(lt * 24 / k + 1e-6) * k / 24;
// frame-rate stutter: inside the windows [a,b] the time is held for 2 frames (12 fps look)
const stut = (lt, wins) => { for (const [a, b] of wins) if (lt >= a && lt < b) return a + SMt(lt - a, 2); return lt; };
const BLM = document.createElement('canvas'); BLM.width = W / 4; BLM.height = H / 4; const blm = BLM.getContext('2d');
function bloom(a = .3, px = 6) { blm.setTransform(1, 0, 0, 1, 0, 0); blm.clearRect(0, 0, W / 4, H / 4); blm.filter = `brightness(1.1) blur(${px}px)`; blm.drawImage(layer, 0, 0, W / 4, H / 4); blm.filter = 'none';
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = a; ctx.drawImage(BLM, 0, 0, W, H); ctx.restore(); }
let SCANP = null;
function scanlines(a = .1, x = 0, y = 0, w = W, h = H) {
  if (!SCANP) { const c = document.createElement('canvas'); c.width = 4; c.height = 4; const g = c.getContext('2d'); g.fillStyle = 'rgba(0,0,0,1)'; g.fillRect(0, 2, 4, 2); SCANP = ctx.createPattern(c, 'repeat'); }
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = a; ctx.fillStyle = SCANP; ctx.fillRect(x, y, w, h); ctx.restore();
}
// CCTV grade: desaturate + green-grey tint + a little contrast loss
function camGrade(a = 1) {
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'saturation'; ctx.globalAlpha = .62 * a; ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'soft-light'; ctx.globalAlpha = .55 * a; ctx.fillStyle = '#5d8a6c'; ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = .07 * a; ctx.fillStyle = '#9fb8a6'; ctx.fillRect(0, 0, W, H);
  ctx.restore();
}
// rolling bright band (old CCTV) + light noise lines
function camRoll(t, a = 1) {
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  const y = ((t * 140) % (H + 400)) - 200, g = ctx.createLinearGradient(0, y - 120, 0, y + 120);
  g.addColorStop(0, 'rgba(200,255,220,0)'); g.addColorStop(.5, `rgba(200,255,220,${.05 * a})`); g.addColorStop(1, 'rgba(200,255,220,0)');
  ctx.fillStyle = g; ctx.fillRect(0, y - 120, W, 240);
  const R = rng(Math.floor(t * 24) * 13 + 5); ctx.fillStyle = `rgba(220,255,230,${.06 * a})`;
  for (let k = 0; k < 3; k++) ctx.fillRect(0, R() * H, W, 1 + R() * 2);
  ctx.restore();
}
const CYN = '#4fe6ff', CYNa = a => `rgba(79,230,255,${a})`, REDa = a => `rgba(255,56,48,${a})`;
// timecode string from seconds
const tcode = s => { s = Math.floor(s); const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, q = s % 60; return [h, m, q].map(v => String(v).padStart(2, '0')).join(':'); };
// CCTV HUD (screen coords; drawn on the output canvas via SC.hud): corner brackets, ● REC, timecode, camera id
// o.rec: 0..1 (REC visible), o.recBig: 0..1 emphasis, o.tc: seconds for the timecode, o.cam: 'CAM 04'
function ccHUD(t, o = {}) {
  const m = 84, L = 120, col = 'rgba(235,245,238,.88)';
  ctx.save(); ctx.lineWidth = 5; ctx.strokeStyle = col; ctx.lineCap = 'square'; ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 6;
  for (const [x, y, sx, sy] of [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]]) { ctx.beginPath(); ctx.moveTo(x, y + sy * L); ctx.lineTo(x, y); ctx.lineTo(x + sx * L, y); ctx.stroke(); }
  // centre crosshair (small)
  if (o.cross !== false) { ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(235,245,238,.45)'; ctx.beginPath(); ctx.moveTo(W / 2 - 26, H / 2); ctx.lineTo(W / 2 + 26, H / 2); ctx.moveTo(W / 2, H / 2 - 26); ctx.lineTo(W / 2, H / 2 + 26); ctx.stroke(); }
  ctx.font = '40px TY'; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
  const rec = o.rec ?? 1;
  if (rec > 0) {
    const big = o.recBig || 0, on = Math.floor(t * 1.6) % 2 === 0 || big > 0 && Math.floor(t * 3) % 2 === 0;
    const rx = 150, ry = 150, rr = 15 * (1 + .5 * big);
    ctx.globalAlpha = rec;
    if (on) { ctx.fillStyle = REDa(1); ctx.beginPath(); ctx.arc(rx, ry, rr, 0, 7); ctx.fill(); ctx.save(); ctx.shadowColor = REDa(.9); ctx.shadowBlur = 20 + 30 * big; ctx.fill(); ctx.restore(); }
    ctx.font = `${Math.round(40 * (1 + .35 * big))}px TY`; ctx.fillStyle = col; ctx.fillText('REC', rx + rr + 18, ry + 2);
    ctx.globalAlpha = 1;
  }
  ctx.font = '38px TY'; ctx.textAlign = 'right'; ctx.fillStyle = col; ctx.fillText(tcode(o.tc ?? (8077 + t)), W - 150, 150);
  if (o.cam) { ctx.textAlign = 'left'; ctx.fillText(o.cam, 150, H - 150); }
  ctx.restore();
}
// square tracking box with corner ticks. (x,y) centre, w size, p 0..1 snap progress, col
function faceBox(x, y, w, p, col = CYN, o = {}) {
  if (p <= 0) return; const k = easeOut(clamp(p)), s = lerp(o.from ?? 1.9, 1, k), hw = w * s / 2, c = w * .26 * s;
  ctx.save(); ctx.globalAlpha *= clamp(p * 3) * (o.alpha ?? 1); ctx.strokeStyle = col; ctx.lineWidth = (o.lw || 4) / LS; ctx.lineCap = 'square';
  ctx.shadowColor = col; ctx.shadowBlur = 10;
  for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { ctx.beginPath(); ctx.moveTo(x + sx * hw, y + sy * (hw - c)); ctx.lineTo(x + sx * hw, y + sy * hw); ctx.lineTo(x + sx * (hw - c), y + sy * hw); ctx.stroke(); }
  if (o.thin !== false) { ctx.globalAlpha *= .35; ctx.lineWidth = 1.5 / LS; ctx.strokeRect(x - hw, y - hw, 2 * hw, 2 * hw); }
  ctx.restore();
}
// data tag that snaps next to a box: leader line from (ax,ay) to the tag at (x,y). txt = label word, p 0..1
function dataTag(txt, ax, ay, x, y, p, col = CYN, o = {}) {
  if (p <= 0) return; const k = easeOut(clamp(p / .5)), sz = o.size || 34;
  ctx.save(); ctx.font = `${sz}px TY`; const tw = ctx.measureText(txt).width, w = Math.max(tw + 48, o.w || 0), h = sz * 2.3;
  // leader
  ctx.strokeStyle = col; ctx.lineWidth = 3 / LS; ctx.globalAlpha *= clamp(p * 4);
  ctx.beginPath(); ctx.moveTo(ax, ay); const mx = lerp(ax, x, .5); ctx.lineTo(lerp(ax, mx, k), ay); if (k > .5) ctx.lineTo(mx, lerp(ay, y, (k - .5) * 2)); if (k >= 1) ctx.lineTo(x, y); ctx.stroke();
  ctx.fillStyle = col; ctx.beginPath(); ctx.arc(ax, ay, 6 / LS, 0, 7); ctx.fill();
  if (k >= 1) {
    const q = clamp((p - .5) / .5), dx = o.left ? x - w : x;
    ctx.globalAlpha = 1; ctx.fillStyle = 'rgba(4,16,22,.78)'; ctx.fillRect(dx, y - h / 2, w, h); ctx.strokeRect(dx, y - h / 2, w, h);
    ctx.fillStyle = col; ctx.fillRect(dx, y - h / 2, 8, h);
    const n = Math.floor(q * txt.length * 1.6); ctx.fillStyle = 'rgba(225,250,255,.95)'; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    ctx.fillText(txt.slice(0, n), dx + 26, y - sz * .38);
    // redacted data bar (no real data)
    const bw = (w - 52) * clamp(q * 1.4 - .3); ctx.fillStyle = 'rgba(79,230,255,.55)'; ctx.fillRect(dx + 26, y + sz * .42, bw, sz * .38);
  }
  ctx.restore();
}
// match bar with % (x,y left-centre), p 0..1 fill, pct shown, col
function matchBar(x, y, w, p, pct, col = CYN, lbl = 'MATCH') {
  ctx.save(); ctx.font = '36px TY'; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(4,16,22,.75)'; ctx.fillRect(x - 20, y - 64, w + 40, 112);
  ctx.fillStyle = 'rgba(225,250,255,.95)'; ctx.fillText(lbl, x, y - 30);
  ctx.textAlign = 'right'; ctx.fillStyle = col; ctx.fillText(Math.round(pct) + '%', x + w, y - 30);
  ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.strokeRect(x, y + 4, w, 26);
  ctx.fillStyle = col; ctx.fillRect(x + 4, y + 8, (w - 8) * clamp(p), 18);
  ctx.restore();
}
// ---------- drawn security camera (box housing on a wall arm). (x,y) mount point, ang (rad, 0 = pointing right), o.led, o.flip ----------
function secCam9(x, y, s, ang, t, o = {}) {
  group(x, y, s, () => {
    rect(-14, -6, 28, 70, '#2b333d', 4); rrect(-34, -18, 68, 24, 6, '#39424e', 4);
    ctx.save(); ctx.translate(0, 64); ctx.rotate(ang);
    rrect(-40, -36, 210, 72, 16, o.body || '#d9dee4', 5); ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(-36, 6, 200, 26);
    rrect(-60, -46, 230, 22, 8, o.body2 || '#c4cad2', 4); // sun hood
    rrect(156, -26, 34, 52, 8, '#8f99a5', 4); ell(190, 0, 14, 22, '#06080b', 3); ell(186, -6, 4, 7, 'rgba(160,220,255,.7)', 0);
    const led = o.led ?? (Math.sin(t * 5 + x) > -.2 ? 1 : .15);
    ell(-14, -8, 8, 8, led > .3 ? '#ff3a30' : '#4a1612', 0); if (led > .3) glow(-14, -8, 44, `rgba(255,50,40,${.55 * led})`);
    ctx.restore();
  });
}
// small desk camera on a short stand pointing at the detective (seen from the front/three-quarter): (x,y) base
function deskCam(x, y, s, t, o = {}) {
  group(x, y, s, () => {
    ell(0, 0, 70, 16, '#1d2228', 4); rect(-10, -80, 20, 80, '#2a3038', 4);
    ctx.save(); ctx.translate(0, -100); ctx.rotate(o.ang ?? -.12);
    rrect(-100, -40, 170, 80, 18, '#e2e5ea', 5); rrect(-108, -50, 190, 20, 8, '#c7ccd3', 4);
    ell(-100, 0, 30, 34, '#8f99a5', 4); ell(-104, 0, 20, 24, '#05070a', 3); ell(-110, -7, 6, 8, 'rgba(160,220,255,.75)', 0);
    const led = o.led ?? (Math.floor(t * 1.6) % 2 === 0 ? 1 : .2);
    ell(30, -12, 9, 9, led > .3 ? '#ff3a30' : '#4a1612', 0); if (led > .3) glow(30, -12, 60, `rgba(255,50,40,${.6 * led})`);
    ctx.restore();
  });
}
// printed photo of a generic face (simple drawn silhouette face, never a real person) with a cyan box
function facePrint(x, y, w, h, rot, seed, o = {}) { group(x, y, 1, () => {
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 5; rect(-w / 2, -h / 2, w, h, '#efeadf', 0); ctx.restore();
  rect(-w / 2, -h / 2, w, h, '#efeadf', 3);
  const iw = w - 20, ih = h - 34; ctx.fillStyle = ['#3c4a55', '#4a4038', '#384a40'][seed % 3]; ctx.fillRect(-iw / 2, -h / 2 + 10, iw, ih);
  const R = rng(seed), hc = ['#151515', '#3a2618', '#2a2420'][seed % 3];
  ctx.fillStyle = '#c99f7e'; ctx.beginPath(); ctx.ellipse(0, -h / 2 + 10 + ih * .48, iw * .2, iw * .25, 0, 0, 7); ctx.fill();
  ctx.fillStyle = hc; ctx.beginPath(); ctx.ellipse(0, -h / 2 + 10 + ih * .3, iw * .22, iw * .14 + R() * 6, 0, Math.PI, 0); ctx.fill();
  ctx.fillStyle = '#2b2f36'; ctx.beginPath(); ctx.ellipse(0, -h / 2 + 10 + ih * 1.02, iw * .42, iw * .3, 0, Math.PI, 0); ctx.fill();
  if (o.box !== false) { ctx.strokeStyle = o.red ? REDa(.9) : CYNa(.9); ctx.lineWidth = 2.5 / LS; ctx.strokeRect(-iw * .27, -h / 2 + 10 + ih * .2, iw * .54, iw * .62); }
}, rot); }

// ---------- generic face for the mesh (drawn, frontal, dark blue-grey with cyan rim light) ----------
// landmark points (head coords, head centre 0,0, ~rx 230 ry 300)
const FLM = (() => {
  const P = {};
  const jaw = []; for (let i = 0; i <= 16; i++) { const a = Math.PI * (.05 + .9 * i / 16); jaw.push([-Math.cos(a) * 214 * (1 - .12 * Math.sin(a)), 20 + Math.sin(a) * 268]); }
  P.jaw = jaw;
  P.browL = [[-170, -92], [-130, -112], [-88, -114], [-50, -102]]; P.browR = P.browL.map(([x, y]) => [-x, y]);
  P.eyeL = [[-150, -40], [-120, -58], [-82, -58], [-54, -40], [-84, -26], [-120, -26]]; P.eyeR = P.eyeL.map(([x, y]) => [-x, y]);
  P.nose = [[0, -60], [0, -10], [0, 36], [0, 78], [-40, 86], [-20, 96], [0, 100], [20, 96], [40, 86]];
  P.mouth = [[-80, 160], [-40, 146], [0, 150], [40, 146], [80, 160], [40, 182], [0, 188], [-40, 182]];
  P.fore = [[-150, -200], [-80, -238], [0, -250], [80, -238], [150, -200]];
  return P;
})();
const FLM_ALL = [].concat(FLM.jaw, FLM.browL, FLM.browR, FLM.eyeL, FLM.eyeR, FLM.nose, FLM.mouth, FLM.fore);
// mesh edges: connect each point to its 3 nearest neighbours (computed once)
const FLM_E = (() => { const E = new Set(), out = []; FLM_ALL.forEach((p, i) => { FLM_ALL.map((q, j) => [j, Math.hypot(p[0] - q[0], p[1] - q[1])]).filter(v => v[0] !== i).sort((a, b) => a[1] - b[1]).slice(0, 3).forEach(([j]) => { const k = Math.min(i, j) + '_' + Math.max(i, j); if (!E.has(k)) { E.add(k); out.push([Math.min(i, j), Math.max(i, j)]); } }); }); return out; })();
function faceHead(x, y, s, t, o = {}) { group(x, y, s, () => {
  // shoulders + neck
  ctx.fillStyle = vgrad(200, 700, [[0, '#16232e'], [1, '#0a1118']]);
  ctx.beginPath(); ctx.moveTo(-420, 700); ctx.quadraticCurveTo(-400, 380, -110, 330); ctx.lineTo(110, 330); ctx.quadraticCurveTo(400, 380, 420, 700); ctx.closePath(); ctx.fill();
  rect(-80, 200, 160, 150, '#1b2a36', 0);
  // head
  const g = ctx.createRadialGradient(-60, -60, 40, 0, 0, 340); g.addColorStop(0, '#3a5262'); g.addColorStop(1, '#14212b');
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, 230, 300, 0, 0, 7); ctx.fill();
  // hair cap
  ctx.fillStyle = '#0b1218'; ctx.beginPath(); ctx.ellipse(0, -150, 236, 170, 0, Math.PI * 1.02, Math.PI * 1.98); ctx.quadraticCurveTo(120, -230, 0, -232); ctx.quadraticCurveTo(-140, -226, -232, -170); ctx.fill();
  // ears
  ell(-232, 10, 26, 60, '#22323e', 0); ell(232, 10, 26, 60, '#22323e', 0);
  // features (soft)
  ctx.fillStyle = 'rgba(5,10,14,.75)'; for (const sx of [-1, 1]) { ctx.beginPath(); ctx.ellipse(sx * 102, -42, 46, 15, 0, 0, 7); ctx.fill(); }
  ctx.fillStyle = 'rgba(190,230,245,.35)'; for (const sx of [-1, 1]) { ctx.beginPath(); ctx.arc(sx * 102 - 6, -46, 6, 0, 7); ctx.fill(); }
  ctx.strokeStyle = 'rgba(5,10,14,.6)'; ctx.lineWidth = 6 / LS; for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sx * 160, -96); ctx.quadraticCurveTo(sx * 110, -118, sx * 54, -104); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(-6, -40); ctx.quadraticCurveTo(-14, 50, -36, 84); ctx.quadraticCurveTo(0, 104, 36, 84); ctx.stroke();
  ctx.fillStyle = 'rgba(40,20,24,.55)'; ctx.beginPath(); ctx.moveTo(-80, 160); ctx.quadraticCurveTo(0, 140, 80, 160); ctx.quadraticCurveTo(0, 196, -80, 160); ctx.fill();
  // cyan rim
  ctx.save(); ctx.strokeStyle = CYNa(.35); ctx.lineWidth = 6 / LS; ctx.shadowColor = CYN; ctx.shadowBlur = 24; ctx.beginPath(); ctx.ellipse(0, 0, 230, 300, 0, -1.2, 1.3); ctx.stroke(); ctx.restore();
}); }
// mesh over the face (head coords as faceHead), p 0..1 build, o.meas 0..1 (measurement lines), o.col
function faceMesh(x, y, s, p, t, o = {}) { group(x, y, s, () => {
  const col = o.col || CYN, n = FLM_ALL.length, shown = Math.floor(p * n * 1.0001);
  ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 1.8 / LS; ctx.globalAlpha = .55;
  for (const [i, j] of FLM_E) { if (i < shown && j < shown) { ctx.beginPath(); ctx.moveTo(...FLM_ALL[i]); ctx.lineTo(...FLM_ALL[j]); ctx.stroke(); } }
  ctx.globalAlpha = 1; ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 12;
  for (let i = 0; i < shown; i++) { const [px, py] = FLM_ALL[i]; ctx.beginPath(); ctx.arc(px, py, 5.5 / LS * (i === shown - 1 ? 1.8 : 1), 0, 7); ctx.fill(); }
  ctx.restore();
  // measurement lines: eye-eye, eye-nose, nose-chin
  const M = o.meas || 0; const ms = [[[-102, -42], [102, -42]], [[-102, -42], [0, 100], [102, -42]], [[0, 100], [0, 288]]];
  ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 3 / LS; ctx.setLineDash([12 / LS, 8 / LS]);
  ms.forEach((pts, k) => { const q = clamp(M * 3 - k); if (q <= 0) return; ctx.beginPath(); ctx.moveTo(...pts[0]); for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i], u = clamp(q * (pts.length - 1) - (i - 1)); if (u <= 0) break; ctx.lineTo(lerp(a[0], b[0], u), lerp(a[1], b[1], u)); } ctx.stroke(); });
  ctx.restore();
}); }

// ---------- night street with neon (drawn fallback for the selfie / camera street) ----------
function neonStreet(t, o = {}) {
  const dx = o.dx || 0;
  ctx.fillStyle = vgrad(0, H, [[0, '#090d1c'], [.55, '#141a30'], [1, '#0b0e18']]); ctx.fillRect(-300, -300, W + 600, H + 600);
  const R = rng(o.seed || 7);
  // far buildings
  for (let i = 0; i < 16; i++) { const bx = -260 + i * 150 + dx * .3, bh = 380 + R() * 380; ctx.fillStyle = '#0d1326'; ctx.fillRect(bx, 760 - bh, 140, bh);
    for (let r = 0; r < 12; r++) for (let c = 0; c < 4; c++) if (R() < .32) { ctx.fillStyle = R() < .7 ? 'rgba(255,200,120,.5)' : 'rgba(140,200,255,.45)'; ctx.fillRect(bx + 14 + c * 32, 760 - bh + 20 + r * 34, 16, 18); } }
  // near facades left/right with neon tubes (abstract shapes, no text)
  for (const [x0, w0, c] of [[-300 + dx, 560, '#1b1f33'], [1560 + dx, 700, '#1d1a2c']]) { ctx.fillStyle = c; ctx.fillRect(x0, 80, w0, 760); }
  const neon = (pts, col, a = 1) => { ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.shadowColor = col; ctx.shadowBlur = 30; ctx.globalAlpha = a; ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0] + dx, p[1]) : ctx.moveTo(p[0] + dx, p[1])); ctx.stroke(); ctx.restore(); };
  const fl = .85 + .15 * Math.sin(t * 9);
  neon([[40, 240], [200, 240], [200, 330], [40, 330], [40, 240]], '#ff4fa0', fl); neon([[80, 280], [160, 280]], '#ff4fa0', fl);
  neon([[1640, 200], [1700, 140], [1760, 200], [1820, 140]], '#46e6ff'); neon([[1660, 300], [1860, 300]], '#ffb347', .9);
  glow(120 + dx, 290, 380, 'rgba(255,60,150,.22)'); glow(1740 + dx, 220, 420, 'rgba(60,220,255,.2)');
  // sidewalk + street
  ctx.fillStyle = vgrad(760, H, [[0, '#1a1d2b'], [1, '#0c0e16']]); ctx.fillRect(-300, 760, W + 600, H);
  ctx.fillStyle = 'rgba(255,79,160,.08)'; ctx.fillRect(-300, 780, 900, 300); ctx.fillStyle = 'rgba(70,230,255,.07)'; ctx.fillRect(1300, 780, 900, 300);
  // bokeh
  for (let i = 0; i < 26; i++) { const bx = R() * W, by = 420 + R() * 380, r = 14 + R() * 30; ell(bx, by, r, r, `rgba(${R() < .5 ? '255,180,110' : '120,200,255'},${.08 + R() * .1})`, 0); }
}
// drawn high-angle crowd (heads + shoulders from a security camera). returns head positions [{x,y,s}]
function crowdTop(t, o = {}) {
  ctx.fillStyle = vgrad(0, H, [[0, '#2a2f2c'], [1, '#1d211f']]); ctx.fillRect(-300, -300, W + 600, H + 600);
  // paving grid in perspective
  ctx.strokeStyle = 'rgba(255,255,255,.06)'; ctx.lineWidth = 3; for (let i = -14; i <= 14; i++) { ctx.beginPath(); ctx.moveTo(960 + i * 60, -100); ctx.lineTo(960 + i * 150, H + 100); ctx.stroke(); }
  for (let k = 0; k < 12; k++) { const y = -100 + Math.pow(k / 12, 1.4) * 1300; ctx.beginPath(); ctx.moveTo(-300, y); ctx.lineTo(W + 300, y); ctx.stroke(); }
  const R = rng(o.seed || 31), heads = [];
  const cols = ['#2e3a4a', '#4a3a30', '#3c4a3a', '#5a2e32', '#2a2a30', '#6a5a40', '#3a3550', '#24343a'];
  const N = o.n || 46;
  const P = []; for (let i = 0; i < N; i++) { const row = Math.floor(i / 8), y = 60 + row * 190 + R() * 70, x = (i % 8) * 250 + R() * 150 - 40 + (row % 2) * 110; P.push([x, y, .8 + y / 1500, R() < .5 ? 1 : -1, cols[Math.floor(R() * cols.length)], R()]); }
  P.sort((a, b) => a[1] - b[1]);
  for (const [x0, y0, s, dir, c, r] of P) {
    const x = x0 + dir * t * 26 * s, y = y0 + Math.sin(t * 3 + r * 6) * 2;
    group(x, y, s, () => {
      ell(10, 60, 80, 34, 'rgba(0,0,0,.28)', 0);           // shadow
      ell(0, 30, 72, 44, c, 4);                              // shoulders
      ell(0, 0, 34, 38, r < .6 ? '#1a1410' : '#4a3020', 4);  // hair (top of head)
      ctx.fillStyle = '#c99f7e'; ctx.beginPath(); ctx.ellipse(0, 18, 26, 18, 0, 0, Math.PI); ctx.fill(); // forehead/face foreshortened
    });
    heads.push({ x, y: y + 10, s });
  }
  return heads;
}
