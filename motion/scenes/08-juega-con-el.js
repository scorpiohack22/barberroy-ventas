// 08 — JUEGA CON ÉL HOY: papá en su silla con el celular. El niño llega con su pelota roja: tres intentos,
// tres veces la mano de "espera". El niño se va; la pelota rueda. Pasan los años (el reloj gira, el niño crece).
// Mismo encuadre: ahora el hijo está en la silla con el celular; el padre anciano llega con la misma pelota… "espera".
(() => {
const { FLOOR, clamp, lerp, prog, smooth, easeOut, easeIn, easeInOut, bump, pulse, keyed, poseAt, walk, run, stand, sit, sad, figure, STYLE, shoulderOf, ctx } = E;
const D = 20;
const FR = x => (Math.round(x * 30) + .5) / 30;
const XC = 452, XK = 342, XO = 318;     // silla (mirando a la izquierda), donde se para el que pide
const C = { arrive: 1.45, offer: 1.65, tap1: 2.15, wait1: 2.35, back1: 2.95, tug: 3.45, wait2: 3.95, jump: 4.75, wait3: 5.35, drop: 6.2, slip: 6.85, leave: 7.25,
  lapse: 8.6, lapseEnd: 11.55, act3: 11.7, oArrive: 13.9, oOffer: 14.0, oTap: 14.35, oWait: 14.55, oDrop: 15.4, oSlip: 16.3, oLeave: 17.5, sonLook: 18.2 };
const rgbv = c => c[0] === '#' ? [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16)) : c.match(/[\d.]+/g).slice(0, 3).map(Number);
const mixStyle = (a, b, p) => ({ near: E.mixCol(rgbv(a.near), rgbv(b.near), p), far: E.mixCol(rgbv(a.far), rgbv(b.far), p), glow: lerp(a.glow, b.glow, p), glowColor: a.glowColor });
const lapseP = t => prog(t, C.lapse, C.lapseEnd);
const age = t => smooth(lapseP(t));

// ── utilería ──
function palm(at, ang, col) { // mano abierta de "espera"
  ctx.save(); ctx.translate(at.x, at.y); ctx.rotate(ang);
  ctx.fillStyle = col; ctx.shadowColor = 'rgba(255,255,255,.35)'; ctx.shadowBlur = 8;
  ctx.beginPath(); ctx.roundRect(-6.5, -8, 13, 13, 4); ctx.fill();
  ctx.strokeStyle = col; ctx.lineCap = 'round'; ctx.lineWidth = 3.4;
  for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-4.5 + i * 3, -7); ctx.lineTo(-5.5 + i * 3.6, -16 + Math.abs(i - 1.5) * 1.6); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(6, -1); ctx.lineTo(10, -7); ctx.stroke();
  ctx.restore();
}
function wallClock(t) {
  const x = 330, y = FLOOR - 330, r = 40, sp = lapseP(t) > 0 && lapseP(t) < 1 ? 1 : 0;
  ctx.save(); ctx.strokeStyle = '#5a5a5a'; ctx.lineWidth = 5; ctx.fillStyle = '#121212';
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.lineWidth = 2.5; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * r * .78, y + Math.sin(a) * r * .78); ctx.lineTo(x + Math.cos(a) * r * .9, y + Math.sin(a) * r * .9); ctx.stroke(); }
  const base = t * .02 + lapseP(t) * 60, mh = base * Math.PI * 2, hh = base / 12 * Math.PI * 2;
  ctx.strokeStyle = '#ddd'; ctx.lineCap = 'round';
  ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.sin(hh) * r * .5, y - Math.cos(hh) * r * .5); ctx.stroke();
  ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.sin(mh) * r * .75, y - Math.cos(mh) * r * .75); ctx.stroke();
  ctx.fillStyle = '#ff3b36'; ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2); ctx.fill();
  if (sp) E.glowCircle(x, y, 90, '255,255,255', .08);
  ctx.restore();
}
function lampShade(on) {
  ctx.strokeStyle = '#3c3c3c'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(530, FLOOR); ctx.lineTo(530, FLOOR - 160); ctx.stroke();
  ctx.fillStyle = '#4a4a4a'; ctx.beginPath(); ctx.moveTo(512, FLOOR - 160); ctx.lineTo(548, FLOOR - 160); ctx.lineTo(556, FLOOR - 190); ctx.lineTo(504, FLOOR - 190); ctx.fill();
  E.glowCircle(530, FLOOR - 160, 70, '255,240,220', .2 * on);
}

// ── el que está en la silla con el celular (papá en el acto 1, hijo en el acto 3) ──
function seated(t, tw, o = {}) { // tw = tiempos de "espera": [[t0,t1], ...]
  const base = sit(XC, { dir: -1, lean: o.lean ?? .28, tilt: o.tilt ?? .55 });
  const sh = shoulderOf(base), ph = { x: sh.x - 30, y: sh.y + 34 };
  base.arms = [{ target: { x: ph.x + 4, y: ph.y + 3 } }, { target: ph }];
  base.phone = ph;
  let w = 0;
  for (const [a, b] of tw) w = Math.max(w, smooth(prog(t, a, a + .2)) * (1 - smooth(prog(t, b - .25, b))));
  if (w > 0) {
    const away = o.away ? smooth(prog(t, o.away, o.away + .3)) * (1 - smooth(prog(t, o.away + 1, o.away + 1.4))) : 0;
    const p = { ...base, lean: base.lean - .18 * away, hip: { x: base.hip.x + 6 * away, y: base.hip.y } };
    const s2 = shoulderOf(p);
    const raise = { x: s2.x - 70, y: s2.y - 14 };
    p.arms = [{ target: { x: lerp(ph.x + 4, raise.x, w), y: lerp(ph.y + 3, raise.y, w) } }, { target: { x: ph.x + 6 * away, y: ph.y } }];
    p.phone = { x: ph.x + 6 * away, y: ph.y }; p.palm = w;
    return p;
  }
  return base;
}
// ── el que pide jugar (niño en el acto 1, papá anciano en el acto 3) ──
function asker(t, s, T, o = {}) {
  const old = o.old || 0, XK = o.x ?? 342, step = o.old ? 4 : 24;
  const offer = stand(XK, { s, lean: .05 - .1 * old, tilt: -.35 + .2 * old, t }); const sh = shoulderOf(offer);
  offer.arms = [{ target: { x: sh.x + 26 * s, y: sh.y - 12 * s } }, { target: { x: sh.x + 18 * s, y: sh.y - 8 * s } }];
  offer.ball = { x: sh.x + 30 * s, y: sh.y - 26 * s };
  const hold = stand(XK, { s, lean: .12 + .2 * old, tilt: -.25 + .3 * old, t }); const sh2 = shoulderOf(hold);
  hold.arms = [{ target: { x: sh2.x + 12 * s, y: sh2.y + 40 * s } }, { target: { x: sh2.x + 6 * s, y: sh2.y + 44 * s } }];
  hold.ball = { x: sh2.x + 16 * s, y: sh2.y + 54 * s };
  const tapB = stand(XK + step, { s, lean: .3 - .1 * old, tilt: -.1 + .3 * old, t }); const sh4 = shoulderOf(tapB);
  const tap = { ...tapB, arms: [{ target: { x: XC - 44 - 4 * old, y: FLOOR - 94 + 10 * old } }, { target: { x: sh4.x + 6 * s, y: sh4.y + 44 * s } }], ball: { x: sh4.x + 10 * s, y: sh4.y + 54 * s } };
  const drop = sad(XK, { s, lean: .25 - .12 * old, tilt: .75 + .1 * old, t }); const sh3 = shoulderOf(drop);
  drop.arms = [{ target: { x: sh3.x + 10 * s, y: sh3.y + 52 * s } }, { target: { x: sh3.x + 4 * s, y: sh3.y + 56 * s } }];
  drop.ball = { x: sh3.x + 14 * s, y: sh3.y + 64 * s };
  return { offer, hold, tap, drop };
}
function poseKid(t) {
  const s = .55, A = asker(t, s);
  if (t < C.arrive) { // llega corriendo y botando la pelota
    const x = lerp(90, XK, easeOut(prog(t, 0, C.arrive)));
    const r = run(x, x * 1.3, { s, lean: .2 });
    const sh = shoulderOf(r), bounce = Math.abs(Math.sin(t * 9));
    const by = lerp(FLOOR - 8, sh.y + 50 * s, bounce);
    r.arms = [{ target: { x: sh.x + 20 * s, y: Math.min(by - 8, sh.y + 52 * s) } }, r.arms[1]];
    r.ball = { x: sh.x + 22 * s, y: by };
    return r;
  }
  const tug = (ph) => { const p = stand(XK + 26, { s, lean: -.3, tilt: -.25 }); p.arms = [{ target: { x: XC - 42 + 3 * Math.sin(ph), y: FLOOR - 88 } }, { target: { x: XC - 46 + 3 * Math.sin(ph), y: FLOOR - 86 } }]; p.ball = { x: XK - 30, y: FLOOR - 9 }; return p; };
  const jump = (ph) => { const p = { ...A.offer }; const j = 26 * Math.abs(Math.sin(ph)); p.hip = { ...p.hip, y: p.hip.y - j }; p.feet = p.feet.map(f => ({ x: f.x, y: f.y - j })); p.arms = p.arms.map(a => ({ target: { x: a.target.x, y: a.target.y - j } })); p.ball = { x: p.ball.x, y: p.ball.y - j }; return p; };
  if (t < C.leave) return poseAt(t, [[C.arrive, A.hold], [C.offer, A.offer], [C.tap1 - .1, A.offer], [C.tap1, A.tap], [C.back1, A.tap], [C.back1 + .3, A.hold],
    [C.tug - .15, A.hold], [C.tug + .1, () => tug(t * 18)], [C.wait2 + .4, () => tug(t * 18)], [C.wait2 + .7, A.hold], [C.jump - .1, A.hold], [C.jump + .1, () => jump(t * 8)],
    [C.wait3 + .45, () => jump(t * 8)], [C.wait3 + .7, A.hold], [C.drop, A.hold], [C.drop + .7, A.drop], [C.leave, A.drop]]);
  // se va triste… y en el lapso crece sentado en el piso, con un celular
  const xSit = 238;
  const w = walk(lerp(XK, xSit + 20, smooth(prog(t, C.leave + .3, C.lapse - .3))), 70 * t, { s, dir: -1, lean: .25, tilt: .5, stride: .7 });
  const grow = lerp(s, 1, age(t));
  const sitK = sit(xSit, { s: grow, ground: true, lean: .3, tilt: .5 });
  const shK = shoulderOf(sitK);
  sitK.arms = [{ ang: .7, bend: .5 }, { ang: .6, bend: .5 }];
  if (age(t) > .55) { const ph = { x: shK.x + 28 * grow, y: shK.y + 34 * grow }; sitK.arms = [{ target: ph }, { target: { x: ph.x - 3, y: ph.y + 2 } }]; sitK.phone = ph; }
  return poseAt(t, [[C.leave, A.drop], [C.leave + .3, sad(XK, { s, dir: -1, lean: .25, tilt: .6 })], [C.leave + .5, () => w], [C.lapse - .3, () => w], [C.lapse + .2, () => sitK], [D, () => sitK]]);
}
function poseOld(t) { // papá anciano, acto 3
  const s = .95, A = asker(t, s, null, { old: 1, x: XO });
  if (t < C.oArrive) {
    const x = lerp(200, XO, prog(t, C.act3, C.oArrive));
    const w = walk(x, x * 1.1, { s, lean: .32, tilt: .2, stride: .5, stand: 90 });
    const sh = shoulderOf(w); w.arms = [{ target: { x: sh.x + 14, y: sh.y + 44 } }, { target: { x: sh.x + 8, y: sh.y + 48 } }]; w.ball = { x: sh.x + 18, y: sh.y + 58 };
    return w;
  }
  const away = walk(lerp(XO, 170, smooth(prog(t, C.oLeave + .3, D))), 40 * t, { s, dir: -1, lean: .38, tilt: .55, stride: .45, stand: 90 });
  away.arms = [{ ang: .05, bend: .1 }, { ang: 0, bend: .1 }];
  const turn = sad(XO, { s, dir: -1, lean: .35, tilt: .7 });
  return poseAt(t, [[C.oArrive, A.hold], [C.oOffer + .1, A.offer], [C.oTap - .1, A.offer], [C.oTap, A.tap], [C.oWait + .6, A.tap], [C.oWait + .9, A.hold],
    [C.oDrop, A.hold], [C.oDrop + .9, A.drop], [C.oLeave, A.drop], [C.oLeave + .3, turn], [C.oLeave + .6, () => away], [D, () => away]]);
}
// pelota suelta que bota y rueda (desde la mano en tSlip)
function looseBall(t, from, tSlip, dirX = 1, slow = 1) {
  const dt = (t - tSlip) * slow; if (dt < 0) return null;
  const g = 900, e = .55; let y0 = from.y, vy = 0, tt = dt, y = FLOOR - 13, h = FLOOR - 13 - y0;
  // tiempo hasta el primer bote
  const t1 = Math.sqrt(2 * Math.max(0, -h) / g);
  if (tt < t1) y = y0 + .5 * g * tt * tt;
  else {
    tt -= t1; let v = g * t1 * e; y = FLOOR - 13;
    while (v > 40) { const air = 2 * v / g; if (tt < air) { y = FLOOR - 13 - (v * tt - .5 * g * tt * tt); break; } tt -= air; v *= e; }
  }
  const x = from.x + dirX * 90 * (1 - Math.exp(-dt * 1.1));
  return { x, y, rot: dirX * dt * 6 * Math.exp(-dt * .6) };
}

const SHOTS = [
  [0, { x: 230, y: FLOOR - 70, z: 2.6 }, { x: 360, y: FLOOR - 95, z: 2.4 }],
  [FR(1.6), { x: 405, y: FLOOR - 150, z: 1.95 }, { x: 405, y: FLOOR - 150, z: 2.05 }],
  [FR(3.3), { x: 440, y: FLOOR - 155, z: 2.7 }, { x: 438, y: FLOOR - 152, z: 2.8 }],
  [FR(4.55), { x: 412, y: FLOOR - 140, z: 2.15 }, { x: 412, y: FLOOR - 145, z: 2.25 }],
  [FR(6.0), { x: 362, y: FLOOR - 105, z: 2.6 }, { x: 360, y: FLOOR - 100, z: 2.75 }],
  [FR(7.2), { x: 340, y: FLOOR - 170, z: 1.8 }, { x: 330, y: FLOOR - 180, z: 1.75 }],
  [FR(8.6), { x: 345, y: FLOOR - 230, z: 1.58 }, { x: 345, y: FLOOR - 210, z: 1.72 }],
  [FR(11.7), { x: 395, y: FLOOR - 150, z: 1.95 }, { x: 400, y: FLOOR - 150, z: 2.05 }],
  [FR(14.3), { x: 440, y: FLOOR - 155, z: 2.7 }, { x: 438, y: FLOOR - 152, z: 2.8 }],
  [FR(15.45), { x: 345, y: FLOOR - 165, z: 2.5 }, { x: 345, y: FLOOR - 160, z: 2.65 }],
  [FR(16.3), { x: 360, y: FLOOR - 50, z: 2.7 }, { x: 410, y: FLOOR - 55, z: 2.6 }],
  [FR(17.6), { x: 440, y: FLOOR - 150, z: 2.5 }, { x: 370, y: FLOOR - 210, z: 1.5 }],
];
function shotCam(t) {
  let i = SHOTS.length - 1; while (i > 0 && t < SHOTS[i][0]) i--;
  const [t0, a, b] = SHOTS[i], t1 = i + 1 < SHOTS.length ? SHOTS[i + 1][0] : D;
  const p = smooth(prog(t, t0, t1));
  return { x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p), zoom: lerp(a.z, b.z, p) };
}
const act3 = t => t >= C.act3;
function drawAsker(sl, p, refl) { if (p.ball) E.ball(p.ball.x, p.ball.y, 13 * (p.s || 1) / .75 * .75); }

window.SCENE = {
  id: '08-juega-con-el', title: 'Juega con él *hoy*', duration: D, cue: C,
  sky: () => 0,
  spot: { x: 410, r: 380 },
  beam: t => ({ x: 420, a: .06, w: 170 }),
  blackouts: [FR(8.6) - 1 / 60, FR(11.7) - 1 / 60],
  camera: shotCam,
  backdrop(t) { wallClock(t); },
  world(t, refl) {
    lampShade(1);
    E.chair(XC, -1, FLOOR, '#5c5c5c');
    // en la silla
    const waits1 = [[C.wait1, C.back1 + .3], [C.wait2, C.wait2 + .8], [C.wait3, C.wait3 + 1.0]];
    let p, st;
    if (!act3(t)) {
      p = seated(t, waits1, { away: C.wait3, lean: lerp(.28, .5, age(t)), tilt: lerp(.55, .7, age(t)) });
      st = mixStyle(STYLE.hero, STYLE.gray, age(t) * .85);
    } else {
      p = seated(t, [[C.oWait, C.oWait + 1.0]]);
      if (t > C.sonLook) { p.tilt = lerp(.55, .05, smooth(prog(t, C.sonLook, C.sonLook + .6))); }
      st = STYLE.hero;
    }
    const sl = figure(p, st);
    E.phone(p.phone.x, p.phone.y, .35, refl ? .6 : 1, .8);
    if (!refl) E.glowCircle(sl.head.x - 8, sl.head.y + 6, 26, '255,40,35', .2);
    if (p.palm > .3) { const h = E.hand(sl, 0); ctx.save(); ctx.translate(h.x, h.y); ctx.scale(1.5, 1.5); palm({ x: 0, y: -2 }, -.15, st.near); ctx.restore(); }
    // el que pide
    if (!act3(t)) {
      const k = poseKid(t);
      const ks = mixStyle(STYLE.hero, STYLE.hero, 0);
      const ksl = figure(k, ks);
      if (k.phone) { E.phone(k.phone.x, k.phone.y, -.35, refl ? .6 : 1, .5 + .3 * age(t)); if (!refl) E.glowCircle(ksl.head.x + 6, ksl.head.y + 6, 22, '255,40,35', .2 * age(t)); }
      if (t < C.slip && k.ball) E.ball(k.ball.x, k.ball.y, 10);
      else { const from = asker(C.slip, .55).drop.ball; const b = looseBall(t, from, C.slip, 1, 1); if (b) E.ball(Math.min(b.x, XC - 50), b.y, 10); }
    } else {
      const o = poseOld(t);
      figure(o, mixStyle(STYLE.hero, STYLE.gray, .8));
      if (t < C.oSlip && o.ball) E.ball(o.ball.x, o.ball.y, 12);
      else { const from = asker(C.oSlip, .95, null, { old: 1, x: XO }).drop.ball; const b = looseBall(t, from, C.oSlip, 1, .55); if (b) E.ball(Math.min(b.x, XC - 52), b.y, 12); }
    }
    if (refl) return;
    // toques
    for (const q of [C.tap1, C.oTap]) E.ring(XC - 40, FLOOR - 92, t, q, { r: 28, life: .45, width: 3 });
  },
  events() {
    const ev = E.footsteps(D, t => [
      t > C.leave + .4 && t < C.lapse - .3 ? { phi: poseKid(t).phi || 0, size: .55 } : null,
      t > C.act3 && t < C.oArrive ? { phi: poseOld(t).phi || 0, size: .9, vol: .7 } : null,
      t > C.oLeave + .6 ? { phi: poseOld(t).phi || 0, size: .9, vol: .6 } : null,
    ]);
    const bounces = []; for (let t = 0; t < C.arrive; t += Math.PI / 9) bounces.push({ t: t + Math.PI / 18, type: 'thud', vol: .45 });
    const loose = (t0, slow, from) => { const out = []; let prevY = null, prevV = 0; for (let t = t0; t < t0 + 3; t += 1 / 120) { const b = looseBall(t, from, t0, 1, slow); if (!b) continue; const v = b.y - (prevY ?? b.y); if (prevV > 0 && v <= 0 && b.y > FLOOR - 16) out.push({ t, type: 'thud', vol: .5 * Math.max(.2, 1 - (t - t0) / 2) }); prevY = b.y; prevV = v; } return out; };
    return ev.concat(bounces, loose(C.slip, 1, asker(C.slip, .55).drop.ball), loose(C.oSlip, .55, asker(C.oSlip, .95, null, { old: 1, x: XO }).drop.ball), [
      { t: 0.0, type: 'whoosh', dur: .4, vol: .6 }, { t: .2, type: 'notify', vol: .4 },
      { t: C.tap1, type: 'tick', vol: .7 }, { t: C.wait1, type: 'notify', vol: .4 }, { t: C.wait2, type: 'notify', vol: .4 }, { t: C.wait3, type: 'buzz', dur: .4, vol: .4 },
      { t: C.drop, type: 'heartbeat', vol: .6 },
      { t: C.lapse, type: 'clock', dur: C.lapseEnd - C.lapse - .2 }, { t: C.lapse, type: 'riser', dur: 2.8 },
      { t: C.act3 + .1, type: 'notify', vol: .4 }, { t: C.oTap, type: 'tick', vol: .7 }, { t: C.oWait, type: 'notify', vol: .45 },
      { t: C.oDrop, type: 'heartbeat', vol: .8 }, { t: C.oDrop + .75, type: 'heartbeat', vol: .6 },
    ]);
  },
  music: {
    sections: [
      { t: .2, dur: C.wait3 - .2, style: 'upbeat', chords: ['C', 'G', 'Am', 'F'], chordLen: 1.07, bpm: 112, vol: .6 },
      { t: C.wait3 + .2, dur: C.lapse - C.wait3 - .2, style: 'sad', chords: ['Am', 'F'], chordLen: 1.3 },
      { t: C.lapse, dur: C.lapseEnd - C.lapse, style: 'build', chords: ['Am', 'F', 'C', 'G'], chordLen: .75 },
      { t: C.act3, dur: D - C.act3, style: 'sad', chords: ['Am', 'Em', 'F', 'G'], chordLen: 1.45 },
    ],
    stingers: [{ t: C.act3, type: 'impact' }],
    duck: [[C.oWait, C.oDrop + .2]],
  },
};
})();
