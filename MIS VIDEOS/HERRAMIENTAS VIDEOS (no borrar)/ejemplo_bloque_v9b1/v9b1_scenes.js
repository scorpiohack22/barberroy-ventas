// ================= SCENES — VIDEO 9 BLOCK 1 "YA EXISTE" (EXPEDIENTE 009) — FULL SCREEN + OJO DE CÁMARA =================
// Photos 01-04 (../yt10/img/NN_k.png) replace the drawn fallbacks automatically when present (PICK below; missing -> drawn).
// picks after review (photo sync): 01_0 (only variant; fake shop signs blurred as bokeh), 02_0 (14 cameras get brackets; 02_1 is a single pole), 03_1 (glowing lens; 03_0 looks like a red monitor), 04_1 (clear generic faces; 04_0 blurred faces, 04_2 deformed faces)
const PICK = { '01': '01_0', '02': '02_0', '03': '03_1', '04': '04_1' };
const PH_LIST = Object.values(PICK);
const PH_GRADE = Object.fromEntries(PH_LIST.map(id => [id, id.startsWith('01') ? 'brightness(1.1) contrast(1.04)' : 'brightness(1.06) contrast(1.06)']));
let MISSING = [];
function loadSoft(list, grades) {
  return Promise.all(list.map(id => new Promise(res => {
    const im = new Image();
    im.onload = async () => { try { await im.decode(); } catch (e) { } PH[id] = gradePhoto(im, grades[id]); res(); };
    im.onerror = () => { MISSING.push(id); console.log('MISSING ' + id); res(); }; im.src = IMG_DIR + id + '.png';
  })));
}
const FOC = { f01: [[.5, .44], [.51, .4]], f02: [[.45, .45], [.48, .44]], f03: [[.44, .54], [.44, .55]], f04: [[.45, .45], [.47, .43]] };
// soften AI pseudo-text regions in a photo (polygons in image fractions); the blurred copy is cached once per photo
const BLP9 = {}, BLPX = { '01': 16 };
function blurredPhoto(id, px) { const k = id + px; if (BLP9[k]) return BLP9[k]; const im = PH[id], c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const g = c.getContext('2d'); g.filter = `blur(${px}px)`; g.drawImage(im, 0, 0); return BLP9[k] = c; }
function blurPolys(id, polys, px) { const im = PH[id]; if (!im) return; const bi = blurredPhoto(id, px); for (const pg of polys) { ctx.save(); ctx.beginPath(); pg.forEach(([u, v], i) => i ? ctx.lineTo(u * im.width, v * im.height) : ctx.moveTo(u * im.width, v * im.height)); ctx.closePath(); ctx.clip(); ctx.drawImage(bi, 0, 0); ctx.restore(); } }
const BLUR = { '01': [[[0, 0], [.435, 0], [.435, .56], [.34, .56], [.34, .64], [0, .64]], [[.615, 0], [1, 0], [1, .66], [.615, .66]]], '02': [[[.345, .26], [.405, .26], [.405, .39], [.345, .39]], [[.72, .91], [.95, .91], [.95, .97], [.72, .97]]], '03': [], '04': [[[.1, .7], [.32, .7], [.32, .98], [.1, .98]]] };
function camPhoto(id, lt, d, o) { const T = photoShot(id, lt, d, o); if (o.over2) o.over2(lt, d, T); return T; }
function shotOr(nn, lt, d, o, drawn) { const id = PICK[nn]; if (PH[id]) { camPhoto(id, lt, d, Object.assign({ over: () => blurPolys(id, BLUR[nn], BLPX[nn] || 10) }, o)); return true; } drawn(); return false; }
// photo pixel -> screen (after photoShot returned T)
const p2s = (T, u, v, id) => [T.x + u * PH[id].width * T.s, T.y + v * PH[id].height * T.s];

// ---------- detective office for this case: desk security camera pointing at him + printed face photos ----------
function office9Back(t, o = {}) { noirOffice(t, Object.assign({ lamp: .8, blinds: .1 }, o, { part: 'back' })); }
function office9Front(t, o = {}) {
  noirOffice(t, Object.assign({ lamp: .8 }, o, { part: 'front' }));
  const dx = o.dx || 0, dy = o.desk ?? 800;
  facePrint(dx + 800, dy + 80, 150, 180, -.1, 1); facePrint(dx + 950, dy + 96, 150, 180, .07, 2, { red: 1 }); facePrint(dx + 1090, dy + 76, 150, 180, -.03, 3);
  deskCam(dx + 1230, dy + 10, .8, t, { ang: .14 });
}
function detDesk(lt, t, e, o = {}) {
  const dx = o.dx || 0;
  office9Back(t, { dx });
  person(960 + (o.px || 0), 1150, .95, DET, Object.assign({ pose: 'none', talk: env(t), blink: blinkAt(t, o.bl || .4) }, e), t);
  glow(1300, 600, 300, 'rgba(255,50,40,.05)');
  blindStripes(.06, { x0: 300 + dx, y0: 140, n: 7, gap: 58, bw: 24, len: 1200 });
  office9Front(t, { dx });
}

// ---------- S1 0.00 "El otro día me tomé una foto en la calle…" — selfie on a neon street (photo 01), shutter flash on "foto" ----------
const FLASH1 = 1.32;
function fbSelfie(lt, d, t) {
  neonStreet(t, { dx: -lt * 14 });
  const smile = at(lt, .6, 1.0);
  person(900, 1520, 1.15, DET, { pose: 'none', talk: env(t), blink: blinkAt(t, .7), mouth: env(t) < .1 && smile > .5 ? 'smile' : undefined, brow: .1, browUp: .25,
    look: [.45, -.35], lean: -.03 + Math.sin(lt * 1.5) * .006,
    arms: { r: [[260, -560], [330, -800]] },
    prop: () => { group(352, -860, 1, () => { rrect(-62, -112, 124, 224, 22, '#1d2026', 5); rrect(-40, -96, 46, 46, 12, '#2e333c', 3); ell(-17, -73, 13, 13, '#07090c', 3); ell(18, -86, 6, 6, '#e8e2c8', 0); }, .12); ell(330, -800, 30, 32, DET.skin, 5); } }, t);
  glow(1100, 360, 360, 'rgba(255,120,190,.10)');
}
SC.selfie = { tin: 'cut', label: { txt: 'EXPEDIENTE 009', at: .3, pos: 'tl', size: 40 }, draw(lt, d, t) {
  shotOr('01', lt, d, { z: [1.06, 1.16], f: FOC.f01, ease: easeIO }, () => fbSelfie(lt, d, t));
  bloom(.14, 7);
  const fl = lt - FLASH1; if (fl > 0 && fl < .35) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = `rgba(255,252,245,${.75 * Math.pow(1 - fl / .35, 2)})`; ctx.fillRect(0, 0, W, H); ctx.restore(); }
}, cam: (lt, d) => PH[PICK['01']] ? { weave: .4, grain: .1 } : ({ z: lerp(1.0, 1.06, easeIO(lt / d)), y: -20, grain: .1 }) };

// ---------- S2 2.47 "y me pregunté" — detective at his desk, the desk camera's red LED on him ----------
SC.ask = { tin: 'cut', draw(lt, d, t) {
  detDesk(lt, t, { lid: .3, brow: .35, browUp: .55, look: [lerp(0, .35, easeIO(at(lt, .2, .7))), lerp(0, -.4, easeIO(at(lt, .2, .7)))], lean: .015 });
  scanlines(.035);
}, cam: (lt, d) => ({ z: lerp(1.12, 1.17, easeIO(lt / d)), y: -110, x: 60, grain: .1 }) };

// ---------- S3 3.70 "¿cuántas cámaras me vieron hoy?" — street corner: cameras pop up one by one + counter (photo 02) ----------
// drawn camera spots: [x, y, s, ang]
const CAMS = [[330, 170, .55, .5], [1640, 140, .55, 2.6], [120, 430, .45, .2], [1810, 420, .45, 2.9], [470, 236, .38, .7], [1460, 236, .38, 2.4], [760, 130, .32, 1.1],
  [1170, 120, .32, 2.0], [250, 640, .4, .1], [1690, 640, .4, 3.0], [940, 250, .3, 1.57], [470, 520, .3, .4], [1460, 520, .3, 2.7], [1050, 470, .26, 1.9]];
const POP0 = .14, POPK = .105;
// photo 02 spots (image fractions) — filled after reviewing the photo; empty -> boxes on drawn spots are skipped for the photo
const CAMS02 = [[.05, .555], [.255, .545], [.35, .535], [.425, .53], [.505, .545], [.575, .535], [.455, .175], [.46, .29], [.36, .43], [.455, .46], [.62, .575], [.675, .565], [.715, .6], [.765, .585]];
function fbStreetCams(lt, d, t) {
  neonStreet(t, { seed: 11, dx: 0 });
  // poles
  for (const x of [470, 1460, 940]) { rect(x - 10, 236, 20, 584, '#20242e', 4); }
  CAMS.forEach(([x, y, s, a], i) => { const p = at(lt, POP0 + i * POPK, POP0 + i * POPK + .18); if (p <= 0) return; group(x, y, backOut(p), () => secCam9(0, 0, s, a, t, { led: 1 })); });
}
function camCounter(n, x, y) {
  ctx.save(); ctx.fillStyle = 'rgba(4,16,22,.78)'; ctx.fillRect(x - 170, y - 70, 340, 140); ctx.strokeStyle = CYN; ctx.lineWidth = 3; ctx.strokeRect(x - 170, y - 70, 340, 140);
  // little camera icon
  ctx.fillStyle = CYN; ctx.fillRect(x - 140, y - 22, 70, 40); ctx.beginPath(); ctx.moveTo(x - 70, y - 4); ctx.lineTo(x - 44, y - 22); ctx.lineTo(x - 44, y + 18); ctx.closePath(); ctx.fill(); ctx.fillRect(x - 120, y + 18, 10, 26);
  ctx.font = '110px AN'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillStyle = 'rgba(225,250,255,.98)'; ctx.shadowColor = CYN; ctx.shadowBlur = 18; ctx.fillText(String(n), x + 140, y + 6);
  ctx.restore();
}
SC.cams = { tin: 'cut', draw(lt, d, t) {
  let T2 = null;
  const ph = shotOr('02', lt, d, { z: [1.02, 1.1], f: FOC.f02, ease: easeIO, over2: (l, dd, T) => { T2 = T; } }, () => fbStreetCams(lt, d, t));
  let n = 0;
  camGrade(.45); scanlines(.06);
  if (ph) CAMS02.forEach(([u, v], i) => { const a0 = POP0 + i * POPK, p = at(lt, a0, a0 + .25); if (p > 0) n++; const [x, y] = p2s(T2, u, v, PICK['02']); faceBox(x, y + 8, 82 * T2.s * 2048 / 1920, p, CYN, { alpha: 1 - .5 * at(lt, a0 + .5, a0 + .9) }); });
  else n = CAMS.filter((c, i) => lt > POP0 + i * POPK).length;
  // brackets snapping on each camera as it appears (drawn layer coords)
  if (!ph) CAMS.forEach(([x, y, s, a], i) => { const p = at(lt, POP0 + i * POPK, POP0 + i * POPK + .25); faceBox(x + Math.cos(a) * 60 * s, y + 64 * s + Math.sin(a) * 60 * s, 230 * s, p, CYN, { alpha: 1 - .5 * at(lt, POP0 + i * POPK + .5, POP0 + i * POPK + .9) }); });
  if (n > 0) camCounter(n, 1560, 900);
}, hud: (lt, d, t) => ccHUD(t, { rec: 1, tc: 8077 + 3.7 + lt, cam: 'CAM 12', cross: false }),
cam: (lt, d) => ({ z: lerp(1.0, 1.03, easeIO(lt / d)), grain: .16 }) };

// ---------- S4 5.67 "Ahora imagínate que cualquiera de esas cámaras" — close on a security camera lens (photo 03) ----------
function fbLens(lt, d, t) {
  ctx.fillStyle = vgrad(0, H, [[0, '#121822'], [1, '#07090e']]); ctx.fillRect(-300, -300, W + 600, H + 600);
  for (let i = 0; i < 9; i++) rect(-100 + i * 260, -60, 250, 1200, i % 2 ? '#10161f' : '#131a24', 3);
  glow(400, 300, 600, 'rgba(70,200,255,.08)');
  const foc = easeIO(at(lt, 1.5, 2.1)), cx = 1000, cy = 540;
  group(cx, cy, 1, () => {
    // housing (three-quarter front)
    rrect(-470, -330, 940, 640, 80, '#d5dae1', 6); ctx.fillStyle = 'rgba(0,0,0,.14)'; ctx.fillRect(-470, 80, 940, 200);
    rrect(-520, -380, 1040, 90, 30, '#c2c8d0', 5);
    // lens rings
    ell(0, 10, 290, 290, '#8d96a2', 6); ell(0, 10, 250, 250, '#2a3038', 5);
    ctx.save(); ctx.translate(0, 10); ctx.rotate(foc * 1.2); ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 6; for (let k = 0; k < 24; k++) { const a = k / 24 * 6.283; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 252, Math.sin(a) * 252); ctx.lineTo(Math.cos(a) * 285, Math.sin(a) * 285); ctx.stroke(); } ctx.restore();
    ell(0, 10, 210, 210, '#0d1117', 5);
    const ir = lerp(170, 110, foc);
    const g = ctx.createRadialGradient(-40, -30, 10, 0, 10, 200); g.addColorStop(0, '#22384a'); g.addColorStop(1, '#03060a'); ell(0, 10, ir + 30, ir + 30, g, 0);
    // reflection of a street crowd (tiny silhouettes curved in the glass)
    ctx.save(); ctx.beginPath(); ctx.arc(0, 10, 205, 0, 7); ctx.clip(); ctx.globalAlpha = .55;
    for (let k = 0; k < 14; k++) { const x = -190 + k * 30, y = 70 + Math.abs(k - 7) * 5; ctx.fillStyle = '#5a8aa8'; ctx.beginPath(); ctx.arc(x, y - 30, 9, 0, 7); ctx.fill(); ctx.fillRect(x - 10, y - 20, 20, 44); }
    ctx.globalAlpha = 1; ctx.restore();
    ell(0, 10, ir * .55, ir * .55, '#010203', 0);
    ctx.save(); ctx.globalAlpha = .55; ell(-70, -60, 70, 36, 'rgba(220,240,255,.5)', 0, -.6); ell(90, 90, 26, 14, 'rgba(220,240,255,.35)', 0, -.6); ctx.restore();
    // red LED
    const on = Math.sin(t * 5) > -.3; ell(360, -220, 20, 20, on ? '#ff3a30' : '#5a1814', 4); if (on) glow(360, -220, 120, 'rgba(255,50,40,.5)');
  });
}
SC.lens = { tin: 'cut', draw(lt, d, t) {
  if (!shotOr('03', lt, d, { z: [1.02, 1.18], f: FOC.f03, ease: easeIO }, () => fbLens(lt, d, t))) bloom(.22, 7);
  scanlines(.04);
}, cam: (lt, d) => PH[PICK['03']] ? { grain: .12 } : ({ z: lerp(1.0, 1.16, easeIO(lt / d)), x: lerp(0, 40, lt / d), grain: .12 }) };

// ---------- S5 7.95 "pudiera decir tu nombre, dónde trabajas y con quién andas" — CCTV crowd: box locks, 3 data tags (photo 04) ----------
const TG = { lock: .2, nombre: .85, trabajo: 1.65, amigos: 2.62 };
const ST5 = [[0, .5], [1.6, 1.95], [2.6, 2.95]];
const TGT = 21, FR1 = 14, FR2 = 27; // indexes into the sorted head list (target + two friends)
// photo 04 face spots (image fractions) [u,v,w] — target first, then two friends; filled after review
let F04 = [[.40, .46, .09], [.177, .385, .105], [.81, .29, .095]];
SC.crowd = { tin: 'cut', draw(lt0, d, t0) {
  const lt = stut(lt0, ST5), t = t0 - lt0 + lt;
  let tgt, fr = [], others = [];
  const ph = shotOr('04', lt, d, { z: [1.04, 1.12], f: FOC.f04, ease: easeIO, over2: (l, dd, T) => { if (F04) { const id = PICK['04'], m = F04.map(([u, v, w]) => { const [x, y] = p2s(T, u, v, id); return { x, y, w: w * PH[id].width * T.s }; }); tgt = m[0]; fr = m.slice(1, 3); others = m.slice(3); } } }, () => {
    const hs = crowdTop(t, { n: 46 }); const hd = h => ({ x: h.x, y: h.y, w: 120 * h.s }); tgt = hd(hs[TGT]); fr = [hd(hs[FR1]), hd(hs[FR2])]; others = hs.filter((h, i) => i !== TGT && i !== FR1 && i !== FR2 && i % 2 === 0).map(hd);
  });
  camGrade(1); scanlines(.08); camRoll(t);
  others.forEach((h, i) => faceBox(h.x, h.y, h.w, at(lt, .05 + (i % 7) * .04, .3 + (i % 7) * .04), 'rgba(235,245,238,.8)', { lw: 2.5, alpha: .55, thin: false }));
  if (tgt) {
    faceBox(tgt.x, tgt.y, tgt.w * 1.25, at(lt, TG.lock, TG.lock + .35), CYN, { lw: 5 });
    const ax = tgt.x + tgt.w * .65;
    dataTag('NOMBRE', ax, tgt.y - tgt.w * .35, tgt.x + tgt.w * 1.6, tgt.y - tgt.w * 1.2, at(lt, TG.nombre, TG.nombre + .6), CYN, { w: 300 });
    dataTag('TRABAJO', ax, tgt.y, tgt.x + tgt.w * 1.6, tgt.y + tgt.w * .05, at(lt, TG.trabajo, TG.trabajo + .6), CYN, { w: 300 });
    const pa = at(lt, TG.amigos, TG.amigos + .6);
    fr.forEach((f, k) => { faceBox(f.x, f.y, f.w * 1.15, at(lt, TG.amigos + k * .12, TG.amigos + .35 + k * .12), '#ffd34f', { lw: 4 });
      if (pa > 0) { ctx.save(); ctx.strokeStyle = 'rgba(255,211,79,.85)'; ctx.lineWidth = 3; ctx.setLineDash([10, 8]); ctx.beginPath(); ctx.moveTo(tgt.x, tgt.y); ctx.lineTo(lerp(tgt.x, f.x, easeOut(pa)), lerp(tgt.y, f.y, easeOut(pa))); ctx.stroke(); ctx.restore(); } });
    dataTag('AMIGOS', ax, tgt.y + tgt.w * .35, tgt.x + tgt.w * 1.6, tgt.y + tgt.w * 1.3, pa, '#ffd34f', { w: 300 });
  }
}, hud: (lt, d, t) => ccHUD(t, { rec: 1, tc: 8077 + 7.95 + SMt(lt, 2), cam: 'CAM 07' }),
cam: (lt, d) => ({ z: lerp(1.0, 1.04, easeIO(lt / d)), grain: .18 }) };

// ---------- S6 11.70 "solo con ver tu cara." — face mesh builds on a generic drawn face + match bar ----------
SC.mesh = { tin: 'cut', draw(lt, d, t) {
  ctx.fillStyle = vgrad(0, H, [[0, '#06121a'], [1, '#02070b']]); ctx.fillRect(-300, -300, W + 600, H + 600);
  ctx.strokeStyle = 'rgba(79,230,255,.06)'; ctx.lineWidth = 2; for (let x = 0; x <= W; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); } for (let y = 0; y <= H; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  // scan line sweeping down
  const sy = lerp(80, 1000, easeIO(at(lt, .05, .9))); if (lt < 1.0) { ctx.fillStyle = CYNa(.12); ctx.fillRect(0, sy - 40, W, 80); ctx.fillStyle = CYNa(.7); ctx.fillRect(0, sy - 2, W, 4); }
  faceHead(800, 470, 1.18, t);
  faceMesh(800, 470, 1.18, easeOut(at(lt, .08, .95)), t, { meas: at(lt, .55, 1.25) });
  faceBox(800, 470, 760, at(lt, .02, .3), CYN, { lw: 4, from: 1.3 });
  const mp = easeOut(at(lt, .7, 1.45)); if (lt > .6) matchBar(1300, 560, 440, mp, 97 * mp);
  bloom(.25, 7); scanlines(.05);
}, cam: (lt, d) => ({ z: lerp(1.0, 1.05, easeIO(lt / d)), grain: .1 }) };

// ---------- S7 13.37 "Yo pensé que eso era de película," — detective, wry smile; the desk camera watching ----------
SC.movie = { tin: 'cut', draw(lt, d, t) {
  detDesk(lt, t, { lid: .22, brow: .05, browUp: .45, mouth: env(t) < .12 ? 'smile' : undefined, look: [.2, -.05], lean: Math.sin(lt * 1.4) * .01 }, { dx: -120, bl: 1.1 });
  scanlines(.035);
}, cam: (lt, d) => ({ z: lerp(1.06, 1.1, easeIO(lt / d)), y: -60, x: 40, grain: .1 }) };

// ---------- S8 15.10 "pero no, ya existe." — CCTV feed from the desk camera: the detective is being watched; REC + face box ----------
const REC8 = .93, BOX8 = 1.12;
SC.feed = { tin: 'glitch', draw(lt0, d, t0) {
  const lt = stut(lt0, [[.9, 1.35]]), t = t0 - lt0 + lt;
  office9Back(t, { dx: -60, lamp: .7 });
  const serious = at(lt, .1, .5);
  person(960, 1520, 1.18, DET, { pose: 'none', talk: env(t), lid: .3, blink: blinkAt(t, 2.2), brow: lerp(.3, .6, serious), browUp: 0, look: [0, .05], lean: Math.sin(lt * 1.2) * .006 }, t);
  // desk edge in the foreground (low camera)
  rect(-300, 1000, W + 600, 200, '#3b2416', 6); ctx.fillStyle = vgrad(1000, 1040, [[0, '#5a3820'], [1, '#3b2416']]); ctx.fillRect(-300, 1003, W + 600, 40);
  camGrade(1); scanlines(.09); camRoll(t, 1.2);
  // fish-eye-ish darkening at the edges
  const v = ctx.createRadialGradient(W / 2, H / 2, 300, W / 2, H / 2, 1150); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.45)'); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  const hy = 1520 - 810 * 1.18;
  faceBox(960, hy + 20, 360, at(lt, BOX8, BOX8 + .3), CYN, { lw: 5 });
  dataTag('IDENTIFICADO', 960 + 180, hy + 20, 1330, hy - 150, at(lt, BOX8 + .45, BOX8 + 1.1), CYN, { w: 420 });
}, hud: (lt, d, t) => ccHUD(t, { rec: at(lt, REC8, REC8 + .05), recBig: at(lt, REC8, REC8 + .1) * (1 - at(lt, REC8 + .8, REC8 + 1.2)), tc: 8077 + 15.1 + SMt(lt, 2), cam: 'CAM 01' }),
cam: (lt, d) => ({ z: lerp(1.0, 1.05, easeIO(lt / d)), y: -10, grain: .2, weave: .3 }) };

const SCN = [['selfie', 0], ['ask', 2.47], ['cams', 3.70], ['lens', 5.67], ['crowd', 7.95], ['mesh', 11.70], ['movie', 13.37], ['feed', 15.10]];
const DUR = 17.51, FADE_IN = 0, FADE_OUT = 0;
