// ================= PAPEL RECORTADO kit — VIDEO 7 BLOCK 7 (layered paper cut-out diorama) =================
// paper fiber texture (baked once)
const PAPER = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 384; const g = c.getContext('2d');
  const id = g.createImageData(384, 384), R = rng(77);
  for (let i = 0; i < 384 * 384; i++) { const v = 200 + (R() - .5) * 70; id.data[i * 4] = v; id.data[i * 4 + 1] = v; id.data[i * 4 + 2] = v - 6; id.data[i * 4 + 3] = 255; }
  g.putImageData(id, 0, 0); g.filter = 'blur(.7px)'; g.drawImage(c, 0, 0); g.filter = 'none';
  for (let i = 0; i < 520; i++) { const x = R() * 384, y = R() * 384, a = R() * 6.28, l = 6 + R() * 26; g.strokeStyle = R() < .5 ? 'rgba(255,255,255,.35)' : 'rgba(90,80,60,.25)'; g.lineWidth = .6 + R() * .8; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a + .6) * l * .5, y + Math.sin(a + .6) * l * .5, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
  return c;
})();
let PPAT = null; const ppat = () => PPAT || (PPAT = ctx.createPattern(PAPER, 'repeat'));
// stop-motion step (12 fps = hold 2 frames) + tiny jitter
const smT = t => Math.floor(t * 12) / 12;
function jit(t, seed, amp = 1.5, ra = .008) { const R = rng(Math.floor(t * 12) * 131 + seed * 977); return [(R() - .5) * 2 * amp, (R() - .5) * 2 * amp, (R() - .5) * 2 * ra]; }
// jagged cut edge: subdivide a closed polygon and push points along the normal (deterministic)
function jag(pts, seed = 1, amp = 2.2, step = 22) {
  const R = rng(seed), o = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, n = Math.max(1, Math.round(L / step)), nx = -dy / L, ny = dx / L;
    for (let k = 0; k < n; k++) { const u = k / n, j = k === 0 ? (R() - .5) * amp * .6 : (R() - .5) * 2 * amp; o.push([a[0] + dx * u + nx * j, a[1] + dy * u + ny * j]); }
  }
  return o;
}
function rrPts(x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); const p = [], arc = (cx, cy, a0) => { for (let k = 0; k <= 5; k++) { const a = a0 + k / 5 * Math.PI / 2; p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } };
  arc(x + w - r, y + r, -Math.PI / 2); arc(x + w - r, y + h - r, 0); arc(x + r, y + h - r, Math.PI / 2); arc(x + r, y + r, Math.PI); return p; }
function circPts(x, y, rx, ry = rx, n = 28) { const p = []; for (let k = 0; k < n; k++) { const a = k / n * 6.2832; p.push([x + Math.cos(a) * rx, y + Math.sin(a) * ry]); } return p; }
function heartPts(x, y, r, n = 40) { const p = []; for (let k = 0; k < n; k++) { const a = k / n * 6.2832, hx = 16 * Math.pow(Math.sin(a), 3), hy = 13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a); p.push([x + hx * r / 16, y - hy * r / 16]); } return p; }
function pathPts(p) { ctx.beginPath(); ctx.moveTo(p[0][0], p[0][1]); for (let i = 1; i < p.length; i++) ctx.lineTo(p[i][0], p[i][1]); ctx.closePath(); }
function lighten(hex, k) { const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = n >> 8 & 255, b = n & 255; r = Math.round(r + (255 - r) * k); g = Math.round(g + (255 - g) * k); b = Math.round(b + (255 - b) * k); return `rgb(${r},${g},${b})`; }
// one paper piece: drop shadow, fill, fiber texture, light cut rim
function paper(pts, col, o = {}) {
  const sh = o.sh ?? 9, bl = o.blur ?? 14;
  pathPts(pts);
  if (sh > 0 || o.blur) { ctx.save(); ctx.shadowColor = o.shCol || 'rgba(10,6,20,.5)'; ctx.shadowBlur = bl; ctx.shadowOffsetX = sh * .45; ctx.shadowOffsetY = sh; ctx.fillStyle = col; ctx.fill(); ctx.restore(); }
  else { ctx.fillStyle = col; ctx.fill(); }
  if (o.grad) { ctx.fillStyle = o.grad; ctx.fill(); }
  if (o.tex !== 0) { ctx.save(); ctx.clip(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = o.tex ?? .32; ctx.fillStyle = ppat(); ctx.fillRect(-2000, -2000, 6000, 6000); ctx.restore(); pathPts(pts); }
  if (o.rim !== 0 && col[0] === '#') { ctx.save(); ctx.strokeStyle = lighten(col, o.rimK ?? .4); ctx.globalAlpha = o.rim ?? .75; ctx.lineWidth = (o.rimW ?? 3) / LS; ctx.lineJoin = 'round'; ctx.stroke(); ctx.restore(); }
}
const PP = (pts, col, o = {}, seed = 3) => paper(jag(pts, seed, o.amp ?? 2.2, o.step ?? 22), col, o);
const prect = (x, y, w, h, r, col, o = {}, seed = 5) => PP(rrPts(x, y, w, h, r), col, o, seed);
const pcirc = (x, y, rx, ry, col, o = {}, seed = 7) => PP(circPts(x, y, rx, ry, o.n || 28), col, o, seed);
// jagged landscape band: top edge y(x) from fn, filled down to yb
function pband(fn, yb, col, o = {}, seed = 11) { const p = []; for (let x = -320; x <= W + 320; x += 40) p.push([x, fn(x)]); p.push([W + 320, yb], [-320, yb]); PP(p, col, o, seed); }
// paper text (cut letters): drawn with a soft shadow + light rim
function ptext(s, x, y, size, col, font = 'AN', o = {}) {
  ctx.save(); ctx.font = `${size}px ${font}`; ctx.textAlign = o.align || 'center'; ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(10,6,20,.55)'; ctx.shadowBlur = o.blur ?? 10; ctx.shadowOffsetX = 3; ctx.shadowOffsetY = o.sh ?? 6; ctx.fillStyle = col; ctx.fillText(s, x, y);
  ctx.shadowColor = 'transparent'; if (o.rim !== 0) { ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 2; ctx.strokeText(s, x, y); }
  ctx.restore();
}
// backlight glow behind back layers
function backlight(x, y, r, col = 'rgba(255,190,110,.55)') { glow(x, y, r, col); }
// paper confetti / fragments
function pconfetti(x0, y0, n, p, seed, cols, spread = 600) {
  if (p <= 0) return; const R = rng(seed);
  for (let i = 0; i < n; i++) { const a = R() * 6.28, v = (.3 + R()) * spread, g = 900 * p * p, x = x0 + Math.cos(a) * v * p, y = y0 + Math.sin(a) * v * p * .7 + g, s = 10 + R() * 18, rot = R() * 6 + p * (R() - .5) * 14;
    ctx.save(); ctx.globalAlpha = clamp(1.4 - p); ctx.translate(x, y); ctx.rotate(rot); ctx.fillStyle = cols[i % cols.length]; ctx.fillRect(-s / 2, -s * .3, s, s * .6); ctx.restore(); }
}
// railway lever (base at x,y; ang 0 = upright, + = to the right)
function pLever(x, y, s, ang, t, o = {}) {
  group(x, y, s, () => {
    prect(-95, -70, 190, 80, 14, o.base || '#5a4a3e', { sh: 10 }, 21);
    prect(-60, -96, 120, 34, 10, '#7a6656', { sh: 5 }, 22);
    ctx.save(); ctx.translate(0, -80); ctx.rotate(ang);
    prect(-13, -300, 26, 300, 10, o.stick || '#c9c2b4', { sh: 8 }, 23);
    if (o.glow) glow(0, -310, 140, `rgba(255,90,60,${.5 * o.glow})`);
    pcirc(0, -312, 40, 40, o.knob || '#d8432f', { sh: 8 }, 24);
    pcirc(-12, -324, 11, 9, '#f08c74', { sh: 0, tex: 0, rim: 0 }, 25);
    ctx.restore();
    pcirc(0, -80, 18, 18, '#3a302a', { sh: 3 }, 26);
  });
}
// railway track strip from a (near) to b (far): ties stay horizontal (receding perspective), half-gauge w0 -> w1
function pTrack(a, b, w0, w1, seed = 1, col = '#6b5a4a') {
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy);
  let u = 0, k = 0;
  while (u <= 1 && k < 200) { const w = lerp(w0, w1, u), cx = a[0] + dx * u, cy = a[1] + dy * u, th = Math.max(4, w * .16), tw = w * 1.35;
    PP([[cx - tw, cy - th / 2], [cx + tw, cy - th / 2], [cx + tw, cy + th / 2], [cx - tw, cy + th / 2]], col, { sh: 2 + w * .03, blur: 3 + w * .04, amp: .8, rim: .4, step: 30 }, seed * 50 + k);
    u += Math.max(.012, (w * .55) / L); k++; }
  for (const sd of [-1, 1]) { const r0 = Math.max(2.5, w0 * .07), r1 = Math.max(1.5, w1 * .07);
    PP([[a[0] + sd * w0 - r0, a[1]], [b[0] + sd * w1 - r1, b[1]], [b[0] + sd * w1 + r1, b[1]], [a[0] + sd * w0 + r0, a[1]]], '#bdb8b0', { sh: 3, blur: 5, amp: .6, step: 40 }, seed * 9 + sd); }
}
// paper star / sparkle
function pstar(x, y, r, col = '#fff2c4', seed = 1) { const p = []; for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? r * .45 : r; p.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]); } PP(p, col, { sh: 4, blur: 6, amp: 1 }, seed); }
// paper "?" (cut letter with a backing)
function pQuestion(x, y, size, p, t, col = '#ffd45a') { if (p <= 0) return; const k = backOut(p); ctx.save(); ctx.translate(x, y + Math.sin(t * 2.4) * 6); ctx.scale(k, k); ctx.rotate(Math.sin(t * 1.7) * .05); glow(0, 0, size * 1.3, 'rgba(255,200,90,.35)'); ptext('?', 0, 0, size, col, 'AN', { sh: 10, blur: 16 }); ctx.restore(); }
// soft vignette inside the layer (paper diorama)
function pVignette(a = .45) { ctx.save(); const g = ctx.createRadialGradient(W / 2, H / 2, H * .35, W / 2, H / 2, W * .62); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(10,5,20,${a})`); ctx.fillStyle = g; ctx.fillRect(-300, -300, W + 600, H + 600); ctx.restore(); }
// photo paper treatment (non-user paper diorama photos): low-opacity fiber overlay + backlight bloom
function photoPaperFX(a = .16, bloom = .22) {
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = a; ctx.fillStyle = ppat(); ctx.fillRect(-300, -300, W + 600, H + 600); ctx.restore();
  ctx.save(); ctx.globalCompositeOperation = 'screen'; const g = ctx.createRadialGradient(W * .5, H * .35, 40, W * .5, H * .35, 900); g.addColorStop(0, `rgba(255,205,140,${bloom})`); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
}
