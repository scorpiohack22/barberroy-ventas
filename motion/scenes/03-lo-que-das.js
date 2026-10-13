// 03 — LO QUE DAS, REGRESA: uno cae a un hoyo; dos pasan con el celular; un tercero lo saca. Pasa el tiempo.
// Ahora cae el que ayudó… y quien llega a sacarlo es aquel a quien ayudó. Abrazo, corazón rojo.
(() => {
const { FLOOR, clamp, lerp, prog, smooth, easeOut, easeIn, easeInOut, bump, keyed, poseAt, walk, run, stand, kneel, crouch, figure, STYLE, shoulderOf, holdPoint, ARM, ctx } = E;
const D = 22;
const FR = x => (Math.round(x * 30) + .5) / 30;
const HX = 380, HY = FLOOR + 22, HRX = 84, HRY = 19;         // hoyo (elipse en el piso)
const SM = 1.05, SH = .95;                                    // M (el que cae primero), H (el que ayuda)
const C = {
  fall1: 1.15, land1: 1.6, p1: [1.95, 4.35], p2: [4.25, 6.9], hIn: 6.0, hSee: 6.55, hRun: 6.95, hKneel: 7.35, grip1: 7.7, pull1: 8.05, out1: 9.0,
  shake: 9.25, part: 10.35, lapse: 10.95, lapseEnd: 12.4, fall2: 13.3, land2: 13.7, p3: [13.75, 15.25], mIn: 15.15, mSee: 15.65, mRun: 16.2,
  mKneel: 16.65, grip2: 17.0, pull2: 17.35, out2: 18.35, hug: 18.6, heart: 19.0,
};
const ROT = t => smooth(prog(t, C.lapse, C.lapseEnd));         // avance del sol en el lapso

const SHOTS = [
  [0, { x: 300, y: FLOOR - 175, z: 1.85 }, { x: 362, y: FLOOR - 165, z: 1.95 }],
  [FR(1.75), { x: HX + 5, y: FLOOR - 110, z: 2.25 }, { x: HX + 5, y: FLOOR - 112, z: 2.4 }],
  [FR(3.95), { x: HX - 20, y: FLOOR - 150, z: 1.8 }, { x: HX + 10, y: FLOOR - 150, z: 1.9 }],
  [FR(6.0), { x: HX + 120, y: FLOOR - 160, z: 1.9 }, { x: HX + 70, y: FLOOR - 150, z: 2.05 }],
  [FR(7.6), { x: HX + 30, y: FLOOR - 110, z: 2.6 }, { x: HX + 32, y: FLOOR - 112, z: 2.7 }],
  [FR(8.05), { x: HX + 70, y: FLOOR - 150, z: 1.9 }, { x: HX + 110, y: FLOOR - 165, z: 1.95 }],
  [FR(9.15), { x: HX + 144, y: FLOOR - 160, z: 2.35 }, { x: HX + 144, y: FLOOR - 162, z: 2.5 }],
  [FR(10.3), { x: HX + 150, y: FLOOR - 170, z: 2.1 }, { x: HX + 190, y: FLOOR - 175, z: 1.95 }],
  [FR(10.95), { x: 360, y: FLOOR - 290, z: 1.3 }, { x: HX - 10, y: FLOOR - 230, z: 1.5 }],
  [FR(12.4), { x: HX + 70, y: FLOOR - 165, z: 1.9 }, { x: HX + 20, y: FLOOR - 160, z: 1.95 }],
  [FR(13.75), { x: HX - 5, y: FLOOR - 110, z: 2.3 }, { x: HX - 5, y: FLOOR - 112, z: 2.42 }],
  [FR(15.2), { x: HX - 150, y: FLOOR - 160, z: 2.0 }, { x: HX - 160, y: FLOOR - 165, z: 2.25 }],
  [FR(16.2), { x: HX - 90, y: FLOOR - 150, z: 1.9 }, { x: HX - 60, y: FLOOR - 140, z: 2.05 }],
  [FR(17.3), { x: HX - 80, y: FLOOR - 145, z: 1.9 }, { x: HX - 115, y: FLOOR - 165, z: 1.95 }],
  [FR(18.5), { x: HX - 127, y: FLOOR - 175, z: 2.4 }, { x: HX - 125, y: FLOOR - 190, z: 2.2 }],
  [FR(20.0), { x: HX - 100, y: FLOOR - 195, z: 2.15 }, { x: HX - 40, y: FLOOR - 215, z: 1.6 }],
];
function shotCam(t) {
  let i = SHOTS.length - 1; while (i > 0 && t < SHOTS[i][0]) i--;
  const [t0, a, b] = SHOTS[i], t1 = i + 1 < SHOTS.length ? SHOTS[i + 1][0] : D;
  const p = smooth(prog(t, t0, t1));
  const sh = Math.max(E.pulse(t, C.land1, .3), E.pulse(t, C.land2, .3)) * .9;
  return { x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p), zoom: lerp(a.z, b.z, p), shake: sh };
}

// ── hoyo ──
function holeBack() {
  ctx.save();
  const g = ctx.createRadialGradient(HX, HY - 4, 4, HX, HY, HRX);
  g.addColorStop(0, '#000'); g.addColorStop(.85, '#050505'); g.addColorStop(1, '#262626');
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(HX, HY, HRX, HRY, 0, Math.PI, Math.PI * 2); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(160,160,160,.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(HX, HY, HRX, HRY, 0, Math.PI, Math.PI * 2); ctx.stroke();
  ctx.restore();
}
function holeFront() {
  ctx.save();
  ctx.fillStyle = '#020202'; ctx.beginPath(); ctx.ellipse(HX, HY, HRX, HRY, 0, 0, Math.PI); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(200,200,200,.55)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(HX, HY, HRX, HRY, 0, .05, Math.PI - .05); ctx.stroke();
  ctx.restore();
}
function clipAboveHole(fn) { ctx.save(); ctx.beginPath(); ctx.rect(-3000, -3000, 7000, HY + 3000); ctx.clip(); fn(); ctx.restore(); }

// ── poses auxiliares ──
const IN_Y = FLOOR + 138; // piso dentro del hoyo
function trapped(t, s, dir, t0, opts = {}) { // dentro del hoyo, pidiendo ayuda con la mano en alto
  const jump = Math.max(0, Math.sin((t - t0) * 7.5)) * 16 * (opts.jump ?? 1);
  const p = stand(HX + dir * 4, { s, dir, y: IN_Y - jump, lean: -.04, tilt: opts.tilt ?? -.42 });
  const sh = shoulderOf(p), wave = Math.sin((t - t0) * 9) * .25 * (opts.wave ?? 1);
  const up = opts.handAt || { x: sh.x + dir * Math.sin(.25 + wave) * ARM * s * .97 + (opts.lean || 0), y: sh.y - Math.cos(.25 + wave) * ARM * s * .97 };
  p.arms = [{ target: up }, { ang: .35, bend: .5 }];
  return p;
}
function falling(t, x, s, dir, tf) { // pisa el hoyo y cae
  const p = prog(t, tf, tf + .45), drop = easeIn(p);
  const w = walk(x, x * dir, { s, dir, freeze: p, lean: .1 - .2 * p });
  w.hip.y += (IN_Y - FLOOR) * drop; w.feet.forEach(f => { f.y += (IN_Y - FLOOR) * drop + 30 * Math.sin(Math.PI * p) * 0; });
  w.tilt = -.5 * p;
  w.arms = [{ ang: lerp(.3, Math.PI - .4, smooth(p)), bend: .2 }, { ang: lerp(-.2, Math.PI - .1, smooth(p)), bend: .2 }];
  return w;
}
function landed(t, s, dir, tl) { // golpe en el fondo y se incorpora
  const p = stand(HX + dir * 4, { s, dir, y: IN_Y, lean: .1, tilt: .3 });
  const k = 1 - smooth(prog(t, tl + .1, tl + .5));
  p.hip.y += 34 * k * s; p.lean += .4 * k; p.tilt = lerp(-.3, .4, k);
  p.arms = [{ ang: .6 + .8 * (1 - k), bend: .4 }, { ang: .4, bend: .4 }];
  return p;
}
function phoneWalker(x, d, dir, s, glance = 0) {
  const p = walk(x, d, { s, dir, stride: .9, lean: .12, tilt: lerp(.5, -.05, glance) });
  const sh = shoulderOf(p), ph = { x: sh.x + dir * 28 * s, y: sh.y + 30 * s };
  p.arms = [{ target: ph }, { ang: -.1, bend: .3 }];
  p.phone = ph;
  return p;
}
// sacar del hoyo: el que está adentro sube en arco hasta pararse en el borde (side = +1 derecha / -1 izquierda)
function pulledOut(t, s, dirIn, t0, t1, side, dirOut) {
  const p = easeInOut(prog(t, t0, t1));
  const x = lerp(HX + dirIn * 4, HX + side * 96, p), footY = lerp(IN_Y, FLOOR, easeOut(p)) - 34 * Math.sin(Math.PI * p);
  const q = stand(x, { s, dir: p < .6 ? dirIn : dirOut, y: Math.min(footY, IN_Y), lean: lerp(.05, .2, Math.sin(Math.PI * p)), tilt: -.2 });
  const tuck = Math.sin(Math.PI * p);
  q.feet.forEach((f, i) => { f.y -= 26 * tuck; f.x -= side * 18 * tuck * (i ? .6 : 1); });
  q.hip.y += 10 * tuck;
  return q;
}

// ── M: cae primero; luego regresa a salvar ──
function poseM(t) {
  const s = SM;
  if (t < C.fall1) return walk(HX - 112 + 98 * t, 98 * t, { s, lean: .07 });
  if (t < C.land1) return falling(t, HX - 112 + 98 * C.fall1 + 40 * easeOut(prog(t, C.fall1, C.land1)), s, 1, C.fall1);
  if (t < C.grip1 - .3) {
    const g = landed(t, s, 1, C.land1);
    // pide ayuda: mano arriba; hacia P1/P2; desánimo cuando P2 se va; vuelve a pedir al ver a H
    const ask = trapped(t, s, 1, C.land1, { tilt: -.4 });
    const tired = trapped(t, s, 1, C.land1, { tilt: .35, jump: 0, wave: 0, handAt: { x: HX + 26, y: FLOOR - 52 } });
    const k = smooth(prog(t, C.land1 + .45, C.land1 + .9));
    const sad = smooth(prog(t, C.p2[1] - .5, C.p2[1])) * (1 - smooth(prog(t, C.hSee + .1, C.hSee + .5)));
    const a = E.mix(g, ask, k);
    return sad > 0 ? E.mix(a, tired, sad) : a;
  }
  const G = grip1(t);
  if (t < C.pull1) {
    const p = trapped(t, s, 1, C.land1, { tilt: -.5, jump: 0, wave: 0, handAt: G });
    p.hip.y += 14 * smooth(prog(t, C.grip1, C.pull1)); // se agacha para impulsarse
    return p;
  }
  if (t < C.out1) { const p = pulledOut(t, s, 1, C.pull1, C.out1, 1, 1); p.arms = [{ target: G }, { ang: 1.2, bend: .3 }]; return p; }
  // de pie a la derecha del hoyo, dándose la mano con H
  const xM = HX + 96;
  if (t < C.part) {
    const p = stand(xM, { s, dir: 1, lean: .05, tilt: -.05, t });
    p.arms = [{ target: shakePt(t) }, { ang: .05, bend: .3 }];
    if (t < C.shake) p.lean = lerp(.2, .05, smooth(prog(t, C.out1, C.shake)));
    return p;
  }
  if (t < C.lapse) { const d = 110 * (t - C.part) - 30; return walk(xM + Math.max(0, d), Math.max(0, d), { s, lean: .07 }); }
  // acto 3: llega desde la izquierda
  if (t < C.mIn) return null;
  const x0 = HX - 270;
  if (t < C.mSee) return walk(x0 + 110 * (t - C.mIn), 110 * (t - C.mIn), { s, lean: .07 });
  const xs = x0 + 110 * (C.mSee - C.mIn);
  if (t < C.mRun) {
    const p = stand(xs + 6, { s, lean: -.02, tilt: lerp(-.05, .25, smooth(prog(t, C.mSee, C.mSee + .3))), t });
    const k = smooth(prog(t, C.mSee + .15, C.mSee + .45));
    p.arms = [{ ang: lerp(.1, 1.0, k), bend: lerp(.3, 1.9, k) }, { ang: -.05, bend: .3 }]; // mano al pecho: lo reconoce
    p.lean -= .08 * k;
    return p;
  }
  const xk = HX - 88;
  if (t < C.mKneel) { const q = easeInOut(prog(t, C.mRun, C.mKneel)), x = lerp(xs + 6, xk, q); return run(x, x * 1.4, { s, lean: .35 }); }
  const kn = kneel(xk, { s, lean: .55, tilt: .35 });
  const G2 = grip2(t);
  if (t < C.pull2) {
    const p = E.mix(run(xk, xk * 1.4, { s, lean: .35 }), kn, smooth(prog(t, C.mKneel, C.mKneel + .25)));
    p.arms = [{ target: G2 }, { target: { x: G2.x - 6, y: G2.y - 4 } }];
    if (t > C.grip2) p.lean += .1 * smooth(prog(t, C.grip2, C.pull2));
    return p;
  }
  // tira hacia atrás y se pone de pie
  const pp = easeInOut(prog(t, C.pull2, C.out2));
  const st = stand(HX - 192, { s, lean: -.28, tilt: -.25 });
  const p = E.mix(kn, st, pp);
  p.arms = [{ target: G2 }, { target: { x: G2.x - 6, y: G2.y + 4 } }];
  if (t < C.out2 + .05) return p;
  return hugPose(t, HX - 192, 1, s, C.out2);
}
// ── H: ayuda primero; luego cae ──
function poseH(t) {
  const s = SH;
  if (t < C.hIn) return null;
  const x0 = HX + 300;
  if (t < C.hSee) return walk(x0 - 110 * (t - C.hIn), 110 * (t - C.hIn), { s, dir: -1, lean: .07 });
  const xs = x0 - 110 * (C.hSee - C.hIn);
  if (t < C.hRun) {
    const p = stand(xs - 6, { s, dir: -1, lean: .02, tilt: lerp(0, .35, smooth(prog(t, C.hSee, C.hSee + .3))), t });
    p.lean -= .1 * smooth(prog(t, C.hSee, C.hSee + .2)); // sorpresa: se echa atrás
    return p;
  }
  const xk = HX + 88;
  if (t < C.hKneel) { const q = easeInOut(prog(t, C.hRun, C.hKneel)), x = lerp(xs - 6, xk, q); return run(x, -x * 1.4, { s, dir: -1, lean: .35 }); }
  const kn = kneel(xk, { s, dir: -1, lean: .55, tilt: .35 });
  if (t < C.pull1) {
    const p = E.mix(run(xk, -xk * 1.4, { s, dir: -1, lean: .35 }), kn, smooth(prog(t, C.hKneel, C.hKneel + .25)));
    const G = grip1(t);
    p.arms = [{ target: G }, { target: { x: G.x + 6, y: G.y - 4 } }];
    if (t > C.grip1) p.lean += .1 * smooth(prog(t, C.grip1, C.pull1));
    return p;
  }
  const xH = HX + 192;
  if (t < C.out1) {
    const pp = easeInOut(prog(t, C.pull1, C.out1));
    const st = stand(xH, { s, dir: -1, lean: -.28, tilt: -.25 });
    const p = E.mix(kn, st, pp); const G = grip1(t);
    p.arms = [{ target: G }, { target: { x: G.x + 6, y: G.y + 4 } }];
    return p;
  }
  if (t < C.part) {
    const p = stand(xH, { s, dir: -1, lean: .05, tilt: -.05, t });
    if (t < C.shake) p.lean = lerp(-.28, .05, smooth(prog(t, C.out1, C.shake)));
    p.arms = [{ target: shakePt(t) }, { ang: .05, bend: .3 }];
    return p;
  }
  if (t < C.lapse) { // se despide con la mano y se va
    const d = Math.max(0, 100 * (t - C.part - .25));
    const p = d > 0 ? walk(xH + d, d, { s, lean: .07 }) : stand(xH, { s, dir: 1 });
    p.arms = [p.arms[0], { ang: Math.PI - .6 + .25 * Math.sin(t * 14), bend: .3 }];
    return p;
  }
  // acto 3: camina y cae
  if (t < C.lapseEnd) return null;
  const v2 = 146 / (C.fall2 - C.lapseEnd);
  if (t < C.fall2) return walk(HX + 150 - v2 * (t - C.lapseEnd), v2 * (t - C.lapseEnd), { s, dir: -1, lean: .07 });
  if (t < C.land2) return falling(t, HX + 4 - 30 * easeOut(prog(t, C.fall2, C.land2)), s, -1, C.fall2);
  if (t < C.grip2 - .3) {
    const g = landed(t, s, -1, C.land2);
    const ask = trapped(t, s, -1, C.land2, { tilt: -.4 });
    const tired = trapped(t, s, -1, C.land2, { tilt: .35, jump: 0, wave: 0, handAt: { x: HX - 26, y: FLOOR - 52 } });
    const k = smooth(prog(t, C.land2 + .45, C.land2 + .9));
    const sad = smooth(prog(t, C.p3[1] - .3, C.p3[1] + .2)) * (1 - smooth(prog(t, C.mSee + .3, C.mSee + .8)));
    const a = E.mix(g, ask, k);
    return sad > 0 ? E.mix(a, tired, sad) : a;
  }
  const G2 = grip2(t);
  if (t < C.pull2) { const p = trapped(t, s, -1, C.land2, { tilt: -.5, jump: 0, wave: 0, handAt: G2 }); p.hip.y += 14 * smooth(prog(t, C.grip2, C.pull2)); return p; }
  if (t < C.out2) { const p = pulledOut(t, s, -1, C.pull2, C.out2, -1, -1); p.arms = [{ target: G2 }, { ang: 1.2, bend: .3 }]; return p; }
  return hugPose(t, HX - 96, -1, s, C.out2);
}
// puntos de agarre
function grip1(t) {
  const a = { x: HX + 16, y: FLOOR - 100 }, b = { x: HX + 144, y: FLOOR - 128 };
  const p = easeInOut(prog(t, C.pull1, C.out1));
  return { x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p) - 40 * Math.sin(Math.PI * p) + 8 * smooth(prog(t, C.grip1, C.pull1)) * (1 - p) };
}
function grip2(t) {
  const a = { x: HX - 16, y: FLOOR - 100 }, b = { x: HX - 144, y: FLOOR - 128 };
  const p = easeInOut(prog(t, C.pull2, C.out2));
  return { x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p) - 40 * Math.sin(Math.PI * p) + 8 * smooth(prog(t, C.grip2, C.pull2)) * (1 - p) };
}
function shakePt(t) {
  const m = { x: HX + 96 + 6, y: FLOOR - 94 * SM - 76 * SM + 2 }, h = { x: HX + 192 - 6, y: FLOOR - 94 * SH - 76 * SH + 2 };
  const p = holdPoint(m, ARM * SM, h, ARM * SH);
  const k = smooth(prog(t, C.out1, C.shake));
  const from = { x: HX + 144, y: FLOOR - 128 };
  return { x: lerp(from.x, p.x, k), y: lerp(from.y, p.y, k) + 7 * Math.sin((t - C.shake) * 16) * clamp((t - C.shake) * 3) * (1 - smooth(prog(t, C.part - .4, C.part))) };
}
// abrazo: ambos se acercan y se envuelven
function hugPose(t, x, dir, s, t0) {
  const k = easeInOut(prog(t, t0, C.hug + .35));
  const xx = lerp(x, dir === 1 ? HX - 158 : HX - 96, k);
  const p = stand(xx, { s, dir, lean: lerp(-.1, .14, k), tilt: lerp(-.2, .3, k), t });
  const otherSh = { x: (dir === 1 ? HX - 96 : HX - 158) - dir * 6, y: FLOOR - 94 * s - 70 * s };
  const wrap = { x: otherSh.x + dir * 14, y: otherSh.y + 6 }, low = { x: otherSh.x + dir * 10, y: otherSh.y + 44 };
  p.arms = k < .05 ? [{ ang: .4, bend: .3 }, { ang: .2, bend: .3 }] : [{ target: lerpPt({ x: xx + dir * 40, y: FLOOR - 130 }, wrap, k) }, { target: lerpPt({ x: xx + dir * 30, y: FLOOR - 110 }, low, k) }];
  return p;
}
const lerpPt = (a, b, p) => ({ x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p) });

// ── transeúntes con celular ──
function passer(t, [t0, t1], x0, x1, s, glanceAt) {
  if (t < t0 || t > t1) return null;
  const p = prog(t, t0, t1), x = lerp(x0, x1, p), dir = x1 > x0 ? 1 : -1;
  const gl = glanceAt ? E.bump(t, glanceAt, glanceAt + .7) : 0;
  return phoneWalker(x, Math.abs(x - x0), dir, s, gl);
}
const P1 = t => passer(t, C.p1, HX - 210, HX + 230, .98);
const P2 = t => passer(t, C.p2, HX + 230, HX - 230, .9, 5.35);
const P3 = t => passer(t, C.p3, HX - 150, HX + 260, 1.0);

function moonPos(t) { const s = sunPos(t); return { x: 720 - s.x, y: 2 * (FLOOR - 60) - s.y }; }
function sunPos(t) {
  const th = .7 + ROT(t) * Math.PI * 4 + (t > C.lapseEnd ? 0 : 0);
  return { x: 360 - Math.cos(th) * 250, y: FLOOR - 60 - Math.sin(th) * 330, h: Math.sin(th) };
}

window.SCENE = {
  id: '03-lo-que-das', title: 'Lo que das, *regresa*', duration: D, cue: C,
  sky: t => clamp(sunPos(t).h * .9 + .15),
  spot: t => ({ x: t < C.lapseEnd ? HX + 40 : HX - 60, r: 400 }),
  beam: t => ({ x: t < C.lapseEnd ? HX + 40 : HX - 70, a: .05 + .04 * smooth(prog(t, C.hug, C.heart + .5)), w: 170 }),
  flashes: [C.heart + .05],
  blackouts: [FR(10.95) - 1 / 60, FR(12.4) - 1 / 60],
  camera: shotCam,
  backdrop(t) {
    const k = E.bump(t, C.lapse - .1, C.lapseEnd + .1);
    if (k > 0) for (let i = 14; i >= 1; i--) { // estela del sol y la luna (tiempo que vuela)
      const q = sunPos(t - i * .025), m = moonPos(t - i * .025);
      E.glowCircle(q.x, q.y, 34, '255,50,40', .3 * k * (1 - i / 15));
      E.glowCircle(m.x, m.y, 22, '255,255,255', .25 * k * (1 - i / 15));
    }
    const s = sunPos(t); E.sun(s.x, s.y, 30);
    if (k > 0) { const m = moonPos(t); E.moon(m.x, m.y, 20, k); }
  },
  world(t, refl) {
    // transeúntes (detrás del hoyo)
    for (const P of [P1, P2, P3]) {
      const p = P(t); if (!p) continue;
      const sl = figure(p, STYLE.gray);
      E.phone(p.phone.x, p.phone.y, -p.dir * .3, refl ? .5 : 1, .8);
      if (!refl) E.glowCircle(sl.head.x + p.dir * 8, sl.head.y + 6, 24, '255,40,35', .2);
    }
    const m = poseM(t), h = poseH(t);
    const mIn = t > C.fall1 && t < C.out1 - .25, hIn = t > C.fall2 && t < C.out2 - .25;
    if (!refl) {
      holeBack();
      if (mIn) clipAboveHole(() => figure(m, STYLE.hero, { noShadow: true }));
      if (hIn) clipAboveHole(() => figure(h, STYLE.hero, { noShadow: true }));
      holeFront();
      E.burst(HX, HY - 4, t, C.land1 - .05, { n: 30, color: '190,190,190', speed: 160, life: .9, size: 3 });
      E.burst(HX, HY - 4, t, C.land2 - .05, { n: 30, color: '190,190,190', speed: 160, life: .9, size: 3, seed: 4 });
    }
    if (m && !mIn) figure(m, STYLE.hero, { noShadow: t > C.pull1 && t < C.out1 });
    if (h && !hIn) figure(h, STYLE.hero, { noShadow: t > C.pull2 && t < C.out2 });
    if (refl) return;
    // destellos de agarre y apretón
    E.ring(HX + 16, FLOOR - 100, t, C.grip1, { r: 40, life: .6, width: 4 });
    E.ring(HX - 16, FLOOR - 100, t, C.grip2, { r: 40, life: .6, width: 4, color: '255,80,70' });
    if (t > C.shake && t < C.part) { const k = E.bump(t, C.shake, C.part); const sp = shakePt(t); E.glowCircle(sp.x, sp.y, 40, '255,255,255', .25 * k); }
    // corazón del abrazo
    const hx = HX - 127, hk = prog(t, C.heart, C.heart + .7);
    if (hk > 0) {
      E.rays(hx, FLOOR - 190, t, smooth(hk) * (1 - smooth(prog(t, D - 1.2, D))), '255,60,50', 16, 520);
      const sz = 34 * E.backOut(hk) * (1 + .06 * Math.sin(t * 7));
      E.heart(hx, FLOOR - 250 - 30 * smooth(hk), sz, '#ff3b36', 1, 40);
      E.burst(hx, FLOOR - 250, t, C.heart, { n: 40, speed: 260, life: 1.4, size: 3.5, gravity: .4 });
      E.ring(hx, FLOOR - 250, t, C.heart, { r: 140, life: .8, width: 6, color: '255,70,60' });
    }
  },
  front(t) {},
  events() {
    const ev = E.footsteps(D, t => {
      const m = poseM(t), h = poseH(t);
      const mv = (p, tA, tB) => p && t > tA && t < tB ? { phi: p.phi || 0, size: p.s || 1 } : null;
      return [mv(m, 0, C.fall1), mv(m, C.mIn, C.mKneel), mv(h, C.hIn, C.hKneel), mv(h, C.part + .25, C.lapse), mv(h, C.lapseEnd, C.fall2),
        mv(P1(t), C.p1[0], C.p1[1]), mv(P2(t), C.p2[0], C.p2[1]), mv(P3(t), C.p3[0], C.p3[1])];
    });
    return ev.concat([
      { t: 0.02, type: 'whoosh', dur: .5 }, { t: C.fall1 + .05, type: 'whoosh', dur: .45, up: false }, { t: C.land1 - .05, type: 'thud' }, { t: C.land1, type: 'boom', vol: .5 },
      { t: C.p1[0] + .5, type: 'notify', vol: .35 }, { t: C.p2[0] + .6, type: 'notify', vol: .35 },
      { t: C.hSee, type: 'heartbeat', vol: .6 }, { t: C.grip1, type: 'snap', vol: .6 }, { t: C.pull1, type: 'whoosh', dur: .9, vol: .8 }, { t: C.out1 - .05, type: 'thud', vol: .6 },
      { t: C.shake + .1, type: 'pop', vol: .5 }, { t: C.lapse, type: 'clock', dur: C.lapseEnd - C.lapse }, { t: C.lapse, type: 'riser', dur: 1.5 },
      { t: C.fall2 + .05, type: 'whoosh', dur: .45, up: false }, { t: C.land2 - .05, type: 'thud' }, { t: C.land2, type: 'boom', vol: .5 },
      { t: C.p3[0] + .3, type: 'notify', vol: .35 },
      { t: C.mSee + .1, type: 'heartbeat', vol: .9 }, { t: C.mSee + .75, type: 'heartbeat', vol: .7 },
      { t: C.grip2, type: 'snap', vol: .7 }, { t: C.pull2, type: 'whoosh', dur: 1, vol: .9 }, { t: C.pull2, type: 'swell', dur: 1.6 }, { t: C.out2 - .05, type: 'thud', vol: .6 },
      { t: C.heart, type: 'sparkle' }, { t: C.heart, type: 'impact', vol: .6 },
    ]);
  },
  music: {
    sections: [
      { t: .3, dur: C.hSee - .3, style: 'sad', chords: ['Am', 'F', 'C', 'G'], chordLen: 1.3 },
      { t: C.hSee, dur: C.lapse - C.hSee, style: 'tender', chords: ['F', 'C', 'G', 'Am'], chordLen: 1.1 },
      { t: C.lapse, dur: C.lapseEnd - C.lapse, style: 'build', chords: ['Am', 'F', 'C', 'G'], chordLen: .5 },
      { t: C.land2 + .2, dur: C.mSee - C.land2 - .2, style: 'tension', chords: ['Am', 'F'], chordLen: .9 },
      { t: C.pull2 - .2, dur: D - C.pull2 + .2, style: 'hope', chords: ['F', 'C', 'G', 'C'], chordLen: 1.2 },
    ],
    stingers: [{ t: C.lapseEnd, type: 'impact' }, { t: C.heart, type: 'bells' }],
    duck: [[C.mSee, C.mRun]],
  },
};
})();
