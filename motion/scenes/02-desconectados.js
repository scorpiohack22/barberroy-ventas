// 02 — DESCONECTADOS: la abuela sirve la cena; todos miran su celular. Ella toca un brazo y la apartan.
// El tiempo pasa: la comida se enfría y ella se desvanece. Silla vacía, una vela. Bajan los celulares…
// el nieto se levanta y pone la mano en su silla. Ya no está.
(() => {
const { FLOOR, clamp, lerp, prog, smooth, easeOut, easeInOut, keyed, poseAt, walk, sit, stand, figure, STYLE, shoulderOf, ctx } = E;
const D = 20;
const FR = x => (Math.round(x * 30) + .5) / 30; // corte entre dos cuadros (sin mezcla del desenfoque)
const CUE = { place: 2.35, sit: 3.25, reach: 4.6, touch: 5.3, shrug: 5.75, pull: 6.5, drop: 7.6, lapse: 8.7, gone: 11.6, look: 12.5, look2: 13.5, rise: 14.6, walk: 15.15, arrive: 16.2, GT: 17.55, end: 17.4 };

// ── posiciones ──
const TX = 345, TW = 290, TOP = FLOOR - 80;            // mesa 200..490
const XA = 150, XB = 268, XC = 382, XG = 580;          // A (punta izq), B y C (detrás de la mesa), abuela (punta der)
const BOWL = { x: 452, y: TOP };
const XSTOP = 535; const XEND = 498;                                     // donde la abuela deja el plato / donde termina el nieto

// mixStyle local: acepta colores #hex y rgb() (el del motor solo #hex)
const rgbv = c => c[0] === '#' ? [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16)) : c.match(/[\d.]+/g).slice(0, 3).map(Number);
const mixStyle = (a, b, p) => ({ near: E.mixCol(rgbv(a.near), rgbv(b.near), p), far: E.mixCol(rgbv(a.far), rgbv(b.far), p), glow: lerp(a.glow, b.glow, p), glowColor: p < .5 ? a.glowColor : b.glowColor });

// ── cámara por planos (cortes secos entre planos) ──
const SHOTS = [
  [0, { x: 420, y: FLOOR - 205, z: 1.36 }, { x: 385, y: FLOOR - 200, z: 1.5 }],
  [FR(2.5), { x: 505, y: FLOOR - 172, z: 2.1 }, { x: 500, y: FLOOR - 170, z: 2.25 }],
  [FR(4.45), { x: 488, y: FLOOR - 170, z: 2.15 }, { x: 485, y: FLOOR - 168, z: 2.4 }],
  [FR(7.35), { x: 560, y: FLOOR - 160, z: 2.6 }, { x: 562, y: FLOOR - 162, z: 2.9 }],
  [FR(8.7), { x: 370, y: FLOOR - 205, z: 1.4 }, { x: 372, y: FLOOR - 200, z: 1.48 }],
  [FR(12.2), { x: 478, y: FLOOR - 172, z: 2.25 }, { x: 482, y: FLOOR - 170, z: 2.45 }],
  [FR(13.35), { x: 250, y: FLOOR - 182, z: 1.9 }, { x: 275, y: FLOOR - 180, z: 2.0 }],
  [FR(14.5), { x: 430, y: FLOOR - 175, z: 1.95 }, { x: 495, y: FLOOR - 170, z: 2.15 }],
  [FR(16.25), { x: 548, y: FLOOR - 168, z: 2.4 }, { x: 552, y: FLOOR - 166, z: 2.62 }],
  [FR(18.3), { x: 470, y: FLOOR - 185, z: 2.0 }, { x: 390, y: FLOOR - 205, z: 1.45 }],
];
function shotCam(t) {
  let i = SHOTS.length - 1; while (i > 0 && t < SHOTS[i][0]) i--;
  const [t0, a, b] = SHOTS[i], t1 = i + 1 < SHOTS.length ? SHOTS[i + 1][0] : D;
  const p = smooth(prog(t, t0, t1));
  return { x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p), zoom: lerp(a.z, b.z, p) };
}

// ── utilería propia ──
function bowl(x, y, steam, t) {
  ctx.save();
  const g = ctx.createLinearGradient(x - 22, 0, x + 22, 0);
  g.addColorStop(0, '#6a6a6a'); g.addColorStop(.35, '#dedede'); g.addColorStop(1, '#5a5a5a');
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - 22, y - 18); ctx.quadraticCurveTo(x - 20, y, x, y); ctx.quadraticCurveTo(x + 20, y, x + 22, y - 18); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#9a9a9a'; ctx.beginPath(); ctx.ellipse(x, y - 18, 22, 4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  if (steam > 0.01) {
    ctx.save(); ctx.lineCap = 'round';
    for (let k = 0; k < 3; k++) {
      const ph = (t * .5 + k / 3) % 1;
      ctx.strokeStyle = `rgba(255,255,255,${.35 * steam * Math.sin(Math.PI * ph)})`; ctx.lineWidth = 2.6;
      ctx.beginPath();
      for (let j = 0; j <= 9; j++) {
        const yy = y - 24 - ph * 46 - j * 4.5, xx = x + (k - 1) * 9 + Math.sin(j * .7 + t * 3 + k) * 4;
        j ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy);
      }
      ctx.stroke();
    }
    ctx.restore();
  }
}
function plate(x, y) { ctx.fillStyle = '#bdbdbd'; ctx.beginPath(); ctx.ellipse(x, y - 2, 17, 3.5, 0, 0, Math.PI * 2); ctx.fill(); }
function lamp(on) {
  ctx.strokeStyle = '#444'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(TX, 200); ctx.lineTo(TX, 560); ctx.stroke();
  ctx.fillStyle = '#5a5a5a'; ctx.beginPath(); ctx.moveTo(TX - 12, 560); ctx.lineTo(TX + 12, 560); ctx.lineTo(TX + 30, 586); ctx.lineTo(TX - 30, 586); ctx.fill();
  if (on > 0) { E.glowCircle(TX, 590, 70, '255,245,225', .35 * on); ctx.fillStyle = `rgba(255,250,235,${on})`; ctx.beginPath(); ctx.arc(TX, 588, 7, 0, Math.PI); ctx.fill(); }
}
const lapseP = t => prog(t, CUE.lapse, CUE.gone - .3);
const lampOn = t => {
  const p = lapseP(t);
  if (p <= 0) return 1;
  if (p >= 1) return .45;
  return lerp(1, .45, p) * (.55 + .45 * Math.abs(Math.sin(t * 37) * Math.sin(t * 13)));
};
function windowView(t) {
  const x0 = 112, x1 = 222, y0 = 488, y1 = 626;
  const p = lapseP(t), th = p * Math.PI * 6;           // tres días en el lapso
  ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, x1 - x0, y1 - y0); ctx.clip();
  const day = p > 0 && p < 1 ? Math.max(0, Math.sin(th)) : 0;
  ctx.fillStyle = `rgb(${Math.round(10 + 50 * day)},${Math.round(8 + 14 * day)},${Math.round(10 + 12 * day)})`; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  if (p > 0 && p < 1) {
    const ang = th % (Math.PI * 2), isDay = ang < Math.PI, q = (ang % Math.PI) / Math.PI;
    const bx = lerp(x0 - 20, x1 + 20, q), by = y1 - Math.sin(q * Math.PI) * 110;
    if (isDay) E.sun(bx, by, 16); else E.moon(bx, by, 13);
  } else E.moon(192, 530, 12, .7);
  ctx.restore();
  ctx.strokeStyle = '#4c4c4c'; ctx.lineWidth = 6; ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
  ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo((x0 + x1) / 2, y0); ctx.lineTo((x0 + x1) / 2, y1); ctx.moveTo(x0, (y0 + y1) / 2); ctx.lineTo(x1, (y0 + y1) / 2); ctx.stroke();
}

// ── reparto ──
function phonePose(x, dir, o = {}) { // sentado con celular frente a la cara
  const s = o.s || 1, p = sit(x, { dir, lean: o.lean ?? .3, tilt: o.tilt ?? .55, s });
  const sh = shoulderOf(p), ph = { x: sh.x + dir * 30 * s, y: sh.y + 36 * s };
  p.arms = [{ target: ph }, { target: { x: ph.x + dir * 3, y: ph.y + 2 } }];
  p.phone = ph;
  return p;
}
function lookPose(x, dir, o = {}) { // celular bajado (sobre la mesa), mirando al frente
  const s = o.s || 1, p = sit(x, { dir, lean: o.lean ?? .06, tilt: o.tilt ?? -.05, s });
  const sh = shoulderOf(p);
  p.arms = [{ target: { x: sh.x + dir * 34 * s, y: TOP - 4 } }, { target: { x: sh.x + dir * 26 * s, y: TOP - 2 } }];
  p.phone = null;
  return p;
}
const phoneDown = (t, t0) => smooth(prog(t, t0, t0 + .7));

function famA(t) {
  const s = 1.02, base = phonePose(XA, 1, { s }), look = lookPose(XA, 1, { s, tilt: -.02 });
  const p = poseAt(t, [[0, base], [CUE.look2, base], [CUE.look2 + .8, look]]);
  p.phone = t < CUE.look2 + .4 ? base.phone : null;
  p.tilt += .04 * Math.sin(t * 2.1) * (1 - phoneDown(t, CUE.look2));
  // al final gira la cabeza hacia el nieto que se levanta
  p.tilt -= .1 * smooth(prog(t, CUE.rise, CUE.rise + .8));
  return p;
}
function famB(t) {
  const s = .78, base = phonePose(XB, 1, { s, lean: .25 }), look = lookPose(XB, 1, { s, lean: .1, tilt: -.08 });
  const p = poseAt(t, [[0, base], [CUE.look2 + .25, base], [CUE.look2 + 1.1, look]]);
  p.phone = t < CUE.look2 + .65 ? base.phone : null;
  p.tilt += .05 * Math.sin(t * 1.7 + 1) * (1 - phoneDown(t, CUE.look2 + .2));
  return p;
}
// C: el nieto al que ella toca
const CW = [[0, 0], [CUE.walk, 0], [CUE.walk + .25, 95], [CUE.arrive - .3, 95], [CUE.arrive, 0], [D, 0]];
const cDist = E.distance(CW, D);
function famC(t) {
  const base = phonePose(XC, 1, { lean: .28 });
  const away = phonePose(XC - 8, 1, { lean: .08, tilt: .62 });          // se echa atrás sin levantar la vista
  const aSh = shoulderOf(away);
  const flick = { ...away, arms: [{ target: { x: aSh.x + 50, y: aSh.y - 16 } }, away.arms[1]] };
  const freeze = lookPose(XC, 1, { lean: .14, tilt: .05 });
  const rise0 = lookPose(XC, 1, { lean: .55, tilt: .1 }); // anticipación para pararse
  if (t < CUE.rise + .35) {
    const p = poseAt(t, [
      [0, base], [CUE.shrug - .05, base], [CUE.shrug + .16, away], [CUE.shrug + .28, flick], [CUE.shrug + .6, away],
      [CUE.pull + .4, away], [CUE.pull + 1.1, base], [CUE.look, base], [CUE.look + .9, freeze], [CUE.rise, freeze], [CUE.rise + .35, rise0],
    ]);
    const w = smooth(prog(t, CUE.shrug, CUE.shrug + .16)) * (1 - smooth(prog(t, CUE.pull + .4, CUE.pull + 1.1)));
    p.phone = t < CUE.look + .5 ? { x: lerp(base.phone.x, away.phone.x, w), y: lerp(base.phone.y, away.phone.y, w) } : null;
    return p;
  }
  // se levanta, camina a la silla de ella y apoya la mano en el respaldo
  const d = cDist(t), x = XC + d;
  const up = stand(XC + 6, { lean: .12, tilt: .05 });
  const w = walk(x, d, { lean: .1, tilt: .08, stride: .8 });
  const rest = stand(XEND + 4, { lean: .12, tilt: -.05, t });
  rest.arms = [{ ang: .2, bend: .3 }, { ang: .05, bend: .2 }];
  const ghostSh = { x: XG - 8, y: FLOOR - 138 };
  const reach = stand(XEND + 8, { lean: .26, tilt: .12 }); reach.arms = [{ target: { x: ghostSh.x - 4, y: ghostSh.y + 4 } }, { ang: .05, bend: .2 }];
  const empty = stand(XEND + 8, { lean: .3, tilt: .3 }); empty.arms = [{ target: { x: ghostSh.x + 2, y: ghostSh.y + 30 } }, { ang: .05, bend: .2 }];
  const bow = stand(XEND + 2, { lean: .36, tilt: .8 }); bow.arms = [{ ang: .25, bend: .4 }, { ang: .02, bend: .1 }];
  const p = poseAt(t, [[CUE.rise + .35, rise0], [CUE.walk, up], [CUE.walk + .2, () => w], [CUE.arrive - .2, () => w], [CUE.arrive + .2, rest],
    [CUE.GT - .7, rest], [CUE.GT, reach], [CUE.GT + .5, empty], [CUE.GT + 1.4, bow]]);
  p.phone = null;
  return p;
}
// abuela: entra con el plato, lo sirve, se sienta, toca, la apartan, baja la cabeza, se desvanece
const GSPEED = [[0, 78], [1.65, 78], [2.05, 0], [D, 0]];
const gDist = E.distance(GSPEED, D);
const GX0 = XSTOP + gDist(2.1);
function grandma(t) {
  const gx = GX0 - gDist(t);
  if (t < 2.05) {
    const carry = walk(gx, gDist(t), { dir: -1, lean: .2, stride: .7, tilt: .3 });
    const bh = { x: gx - 36, y: FLOOR - 120 };
    carry.arms = [{ target: bh }, { target: { x: bh.x - 4, y: bh.y + 2 } }];
    carry.bowl = { x: bh.x - 6, y: bh.y + 14 };
    return carry;
  }
  const place = stand(XSTOP, { dir: -1, lean: .5, tilt: .35 }); place.arms = [{ target: { x: BOWL.x + 6, y: TOP - 12 } }, { target: { x: BOWL.x + 10, y: TOP - 10 } }];
  const carryEnd = stand(XSTOP, { dir: -1, lean: .2, tilt: .3 }); const cbh = { x: XSTOP - 36, y: FLOOR - 120 }; carryEnd.arms = [{ target: cbh }, { target: { x: cbh.x - 4, y: cbh.y + 2 } }];
  const up = stand(XSTOP + 12, { dir: -1, lean: .1, tilt: -.05, t }); up.arms = [{ ang: .25, bend: .9 }, { ang: .15, bend: 1 }];
  const pre = sit(XG, { dir: -1, lean: .4, tilt: 0 }); pre.hip.y -= 24; pre.arms = [{ ang: .8, bend: .4 }, { ang: .7, bend: .4 }];
  const seat = sit(XG, { dir: -1, lean: .12, tilt: -.12, t }); seat.arms = [{ ang: .65, bend: .9 }, { ang: .55, bend: .9 }];
  const smile = { ...seat, tilt: -.28, lean: .08 };
  const touchPt = { x: XC + 63, y: FLOOR - 110 };
  const lean = sit(XG - 30, { dir: -1, lean: .55, tilt: .18 }); lean.hip.y -= 22; lean.arms = [{ target: touchPt }, { target: { x: XG - 70, y: TOP - 6 } }];
  const tap = { ...lean, arms: [{ target: { x: touchPt.x + 2, y: touchPt.y - 8 } }, lean.arms[1]] };
  const reject = sit(XG - 8, { dir: -1, lean: .4, tilt: .15 }); reject.hip.y -= 8; reject.arms = [{ target: { x: touchPt.x + 46, y: touchPt.y + 6 } }, lean.arms[1]];
  const drop = sit(XG, { dir: -1, lean: .32, tilt: .72 }); drop.arms = [{ ang: .55, bend: .6 }, { ang: .5, bend: .65 }];
  const p = poseAt(t, [
    [2.05, carryEnd], [CUE.place, place], [CUE.place + .45, up], [CUE.sit - .15, pre], [CUE.sit + .35, seat], [CUE.sit + .8, smile],
    [CUE.reach, smile], [CUE.touch, lean], [CUE.touch + .12, tap], [CUE.touch + .24, lean], [CUE.touch + .36, tap], [CUE.shrug + .1, lean],
    [CUE.shrug + .4, reject], [CUE.pull, reject], [CUE.pull + .9, seat], [CUE.drop - .2, seat], [CUE.drop + 1.1, drop],
  ]);
  if (t < CUE.place) { const w = smooth(prog(t, 2.05, CUE.place)); p.bowl = { x: lerp(cbh.x - 6, BOWL.x, w), y: lerp(cbh.y + 14, BOWL.y, w) }; }
  return p;
}
const gStyle = t => {
  const p = lapseP(t);
  return { style: mixStyle(mixStyle(STYLE.hero, STYLE.gray, .25), STYLE.dim, smooth(p)), alpha: 1 - smooth(prog(p, .5, 1)) };
};
function bun(sl, st, a) { // moño de abuela
  const r = sl.R.headR;
  ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = st.far;
  const ang = Math.atan2(sl.head.y - sl.sh.y, sl.head.x - sl.sh.x);
  const bx = sl.head.x - sl.dir * r * .8 + Math.cos(ang) * r * .2, by = sl.head.y - r * .5;
  ctx.beginPath(); ctx.arc(bx, by, r * .42, 0, Math.PI * 2); ctx.fill(); ctx.restore();
}
function drawFam(p, st, refl) {
  const sl = figure(p, st);
  if (p.phone) {
    E.phone(p.phone.x, p.phone.y, -p.dir * .35, refl ? .6 : 1, .82);
    if (!refl) E.glowCircle(sl.head.x + p.dir * 10, sl.head.y + 6, 26, '255,40,35', .2);
  }
  return sl;
}
const steamOf = t => 1 - smooth(prog(t, CUE.lapse + .4, CUE.lapse + 2.2));

window.SCENE = {
  id: '02-desconectados', title: 'Mírala *antes de que* se vaya', duration: D, cue: CUE,
  sky: t => { const p = lapseP(t); return p > 0 && p < 1 ? .15 + .6 * Math.max(0, Math.sin(p * Math.PI * 6)) : t < CUE.lapse ? .25 : 0; },
  spot: t => ({ x: 380, r: 420, a: .11 * lampOn(t) }),
  beam: t => ({ x: TX, a: .085 * lampOn(t), w: 210 }),
  blackouts: [FR(8.7) - 1 / 60, CUE.gone + .05],
  camera: t => shotCam(t),
  backdrop(t) { windowView(t); lamp(lampOn(t)); },
  world(t, refl) {
    E.chair(XA, 1, FLOOR, '#4d4d4d'); E.chair(XB, 1, FLOOR, '#383838'); E.chair(XC, 1, FLOOR, '#3a3a3a'); E.chair(XG, -1, FLOOR, '#5a5a5a');
    const cBehind = t < CUE.rise + .4;
    drawFam(famB(t), STYLE.gray, refl);
    if (cBehind) drawFam(famC(t), STYLE.hero, refl);
    E.table(TX, TW, FLOOR, 80, '#6b6b6b');
    plate(XA + 70, TOP); plate(XB + 40, TOP);
    // plato servido: humea… y se enfría
    const g = grandma(t);
    if (!g.bowl) bowl(BOWL.x, BOWL.y, steamOf(t), t);
    // celulares sobre la mesa al final (apagados)
    if (t > CUE.look2 + .4) E.phone(XA + 55, TOP - 2, Math.PI / 2, 0, .8);
    if (t > CUE.look2 + .65) E.phone(XB + 30, TOP - 2, Math.PI / 2, 0, .7);
    if (t > CUE.look + .5) E.phone(XC + 34, TOP - 2, Math.PI / 2, 0, .8);
    // vela donde estaba ella
    const cand = smooth(prog(t, CUE.gone - .9, CUE.gone + .2));
    if (cand > 0) { ctx.save(); ctx.globalAlpha *= cand; E.candle(478, TOP, t, cand); ctx.restore(); }
    drawFam(famA(t), mixStyle(STYLE.hero, STYLE.gray, .15), refl);
    // abuela
    const gs = gStyle(t);
    if (gs.alpha > 0) {
      const sl = figure(g, gs.style, { alpha: gs.alpha });
      bun(sl, gs.style, gs.alpha);
      if (g.bowl) bowl(g.bowl.x, g.bowl.y, 1, t);
      if (!refl && t > CUE.lapse + .8) { // se va como polvo de luz
        const r = E.rng(7), q = prog(t, CUE.lapse + .8, CUE.gone + .4);
        for (let i = 0; i < 46; i++) {
          const ph = (r() + t * .35) % 1, x0 = sl.hip.x + (r() - .6) * 60, y0 = sl.hip.y + 20 - r() * 130;
          ctx.fillStyle = `rgba(255,255,255,${.55 * Math.sin(Math.PI * ph) * clamp(q * 3) * (gs.alpha * .8 + .2)})`;
          ctx.beginPath(); ctx.arc(x0 + Math.sin(ph * 6 + i) * 8, y0 - ph * 150, 1.7, 0, Math.PI * 2); ctx.fill();
        }
      }
    }
    // recuerdo: ella aparece un instante en su silla, lo mira, y se deshace
    const gh = smooth(prog(t, CUE.arrive + .1, CUE.arrive + .7)) * (1 - smooth(prog(t, CUE.GT - .05, CUE.GT + .35)));
    if (gh > 0) {
      const gp = sit(XG, { dir: -1, lean: .08, tilt: -.38 }); gp.arms = [{ ang: .65, bend: .9 }, { ang: .55, bend: .9 }];
      const st = { near: '#e8e8e8', far: '#b0b0b0', glow: .6 };
      const sl = figure(gp, st, { alpha: .32 * gh, noShadow: true }); bun(sl, st, .32 * gh);
      if (!refl) {
        E.glowCircle(sl.head.x, sl.head.y, 70, '255,230,200', .14 * gh);
        const r = E.rng(17);
        for (let i = 0; i < 18; i++) {
          const ph = (r() + t * .3) % 1, x0 = sl.hip.x + (r() - .5) * 50, y0 = sl.hip.y + 10 - r() * 120;
          ctx.fillStyle = `rgba(255,240,220,${.6 * Math.sin(Math.PI * ph)})`;
          ctx.beginPath(); ctx.arc(x0 + Math.sin(ph * 6 + i) * 8, y0 - ph * 140, 1.6, 0, Math.PI * 2); ctx.fill();
        }
      }
    }
    if (!cBehind) drawFam(famC(t), STYLE.hero, refl);
    if (!refl) {
      E.burst(XG - 6, FLOOR - 150, t, CUE.GT, { n: 70, color: '255,236,210', speed: 120, gravity: -.35, life: 1.8, size: 2.6 });
      E.ring(XG - 6, FLOOR - 150, t, CUE.GT, { r: 110, life: 1, width: 4, color: '255,230,200' });
      E.ring(XC + 63, FLOOR - 110, t, CUE.touch, { r: 26, life: .45, width: 3 });
      E.ring(XC + 63, FLOOR - 110, t, CUE.touch + .24, { r: 26, life: .45, width: 3 });
    }
  },
  events() {
    const ev = E.footsteps(D, t => [
      t < 2.05 ? { phi: grandma(t).phi || 0, size: .8 } : null,
      t > CUE.walk && t < CUE.arrive ? { phi: famC(t).phi || 0, size: 1, vol: .8 } : null,
    ]);
    return ev.concat([
      { t: 0.45, type: 'notify', vol: .35, pan: -.4 }, { t: 1.35, type: 'notify', vol: .3, pan: .3 },
      { t: CUE.place, type: 'knock', vol: .45 }, { t: CUE.sit + .3, type: 'thud', vol: .35 },
      { t: CUE.touch, type: 'tick', vol: .7 }, { t: CUE.touch + .24, type: 'tick', vol: .7 },
      { t: CUE.shrug + .2, type: 'whoosh', dur: .3, vol: .5 }, { t: CUE.shrug + .45, type: 'notify', vol: .5 },
      { t: CUE.drop + .2, type: 'heartbeat', vol: .7 }, { t: CUE.drop + .9, type: 'heartbeat', vol: .5 },
      { t: CUE.lapse, type: 'clock', dur: CUE.gone - CUE.lapse - .2 }, { t: CUE.lapse, type: 'riser', dur: 2.8 },
      { t: CUE.gone, type: 'boom', vol: .5 }, { t: CUE.gone - .6, type: 'sparkle', vol: .5 },
      { t: CUE.look + .5, type: 'knock', vol: .3 }, { t: CUE.look + .9, type: 'heartbeat', vol: .6 },
      { t: CUE.look2 + .4, type: 'knock', vol: .25 }, { t: CUE.look2 + .65, type: 'knock', vol: .25 },
      { t: CUE.rise + .4, type: 'scuff', vol: .5 },
      { t: CUE.arrive + .1, type: 'swell', dur: 2.2, vol: .6 }, { t: CUE.arrive + .2, type: 'chime', vol: .5 }, { t: CUE.GT, type: 'sparkle', vol: .6 }, { t: CUE.GT + .05, type: 'whoosh', dur: .8, vol: .4 }, { t: CUE.GT + .6, type: 'heartbeat', vol: .5 },
    ]);
  },
  music: {
    sections: [
      { t: .3, dur: CUE.shrug - .3, style: 'tender', chords: ['Am', 'F', 'C', 'G'], chordLen: 1.35 },
      { t: CUE.shrug + .3, dur: CUE.lapse - CUE.shrug - .3, style: 'sad', chords: ['Am', 'F'], chordLen: 1.3 },
      { t: CUE.lapse, dur: CUE.gone - CUE.lapse, style: 'build', chords: ['Am', 'F', 'C', 'G'], chordLen: .7 },
      { t: CUE.look + .9, dur: D - CUE.look - .9, style: 'sad', chords: ['Am', 'Em', 'F', 'G'], chordLen: 1.5 },
    ],
    stingers: [{ t: CUE.gone, type: 'impact' }],
    duck: [[CUE.gone, CUE.look + .6]],
  },
};
})();
