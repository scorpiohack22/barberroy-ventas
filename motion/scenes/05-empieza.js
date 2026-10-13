// 05 — DEJA DE PLANEAR, EMPIEZA: dos al borde de un abismo; al otro lado brilla el sol.
// Uno se sienta a dibujar planos (la pila de papeles crece). El otro empieza a poner tablones; uno cae al vacío,
// casi se cae él… respira, sigue. Termina el puente, cruza a la luz y celebra. El otro sigue sentado con sus papeles.
(() => {
const { FLOOR, clamp, lerp, prog, smooth, easeOut, easeIn, easeInOut, bump, pulse, keyed, poseAt, walk, stand, sit, kneel, crouch, cheer, figure, STYLE, shoulderOf, ctx } = E;
const D = 20;
const FR = x => (Math.round(x * 30) + .5) / 30;
const LX = 300, RX = 510, PW = 42;          // bordes del abismo, ancho de tablón
const XP = 112;                              // el planificador
const PLACE = [4.7, 6.75, 10.45, 11.4, 12.35]; // tablones colocados
const C = { start: 0, sitP: 2.0, lift: 2.6, fail: 7.9, slip: 8.1, wob: 8.55, steady: 9.15, lookP: 9.4, nod: 10.0, walk: 12.85, arrive: 14.4, cheer: 14.75, look: 16.6 };
const rgbv = c => c[0] === '#' ? [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16)) : c.match(/[\d.]+/g).slice(0, 3).map(Number);
const mixStyle = (a, b, p) => ({ near: E.mixCol(rgbv(a.near), rgbv(b.near), p), far: E.mixCol(rgbv(a.far), rgbv(b.far), p), glow: lerp(a.glow, b.glow, p), glowColor: a.glowColor });

const placed = t => PLACE.filter(p => t >= p).length;
const endX = n => LX + PW * n;

// ── utilería ──
function plank(cx, cy, rot = 0, a = 1) {
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(cx, cy); ctx.rotate(rot);
  ctx.fillStyle = '#9a7650'; ctx.fillRect(-PW / 2 - 1, -5, PW + 2, 9);
  ctx.fillStyle = 'rgba(255,230,190,.35)'; ctx.fillRect(-PW / 2, -5, PW, 2);
  ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(-PW / 2 + 9, -2, 1.4, 5); ctx.fillRect(PW / 2 - 12, -2, 1.4, 5);
  ctx.restore();
}
function bundle(sl, n) { // tablones a la espalda
  if (n <= 0) return;
  const bx = lerp(sl.hip.x, sl.sh.x, .7) - sl.dir * 16, by = lerp(sl.hip.y, sl.sh.y, .7);
  for (let i = 0; i < n; i++) plank(bx - sl.dir * i * 1.5, by - i * 6, -sl.dir * .95, 1);
}
function paperPile(h, t) {
  const r = E.rng(9), n = Math.floor(h / 4);
  for (let i = 0; i < n; i++) {
    const x = XP - 62 + (r() - .5) * 26 * (1 + i / 30), y = FLOOR - 3 - i * 3.6;
    ctx.save(); ctx.translate(x, y); ctx.rotate((r() - .5) * .5);
    ctx.fillStyle = i % 3 ? '#e0e0e0' : '#b5b5b5'; ctx.fillRect(-20, -2.5, 40, 4.5); ctx.restore();
  }
  // bolas arrugadas alrededor
  const m = Math.floor(h / 12);
  for (let i = 0; i < m; i++) { ctx.fillStyle = '#cfcfcf'; ctx.beginPath(); ctx.arc(XP - 110 + r() * 50, FLOOR - 5, 5 + r() * 2, 0, Math.PI * 2); ctx.fill(); }
}
function bridgeIcon(cx, cy) {
  ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 4.5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-34 + cx, 10 + cy); ctx.lineTo(-16 + cx, 10 + cy); ctx.moveTo(16 + cx, 10 + cy); ctx.lineTo(34 + cx, 10 + cy); ctx.stroke();
  ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.moveTo(-16 + cx, 10 + cy); ctx.lineTo(16 + cx, 10 + cy); ctx.stroke(); ctx.setLineDash([]);
  ctx.beginPath(); ctx.arc(cx, cy + 22, 20, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
  ctx.fillStyle = '#ff3b36'; ctx.beginPath(); ctx.arc(cx + 22, cy - 12, 7, 0, Math.PI * 2); ctx.fill();
}

// ── planificador: se sienta y dibuja sin parar ──
function poseP(t) {
  const st = stand(XP, { lean: .02, tilt: -.1, t });
  const s0 = sit(XP, { ground: true, lean: .32, tilt: .45 });
  const sc = Math.sin(t * 14) * 5, paper = { x: XP + 52 + sc, y: FLOOR - 16 + Math.cos(t * 11) * 2 };
  s0.arms = [{ target: paper }, { target: { x: XP + 46, y: FLOOR - 12 } }];
  const tossT = [5.5, 6.3, 9.9, 13.3].find(tt => t > tt && t < tt + .5);
  if (tossT !== undefined) { const k = bump(t, tossT, tossT + .5); s0.arms[0] = { target: { x: lerp(paper.x, XP - 10, k), y: lerp(paper.y, FLOOR - 140, k) } }; }
  const up = { ...s0, tilt: -.25, lean: .15 }; // levanta la vista al final
  if (t < C.sitP) return E.mix(st, s0, 0);
  return poseAt(t, [[C.sitP, st], [C.sitP + .6, s0], [C.look, s0], [C.look + .7, up]]);
}
const pileH = t => 6 + 110 * smooth(prog(t, 2.6, 16.5));

// ── constructor ──
function kneelAt(n, o = {}) { // arrodillado al final del puente, n tablones puestos
  const x = endX(n) - 40, ln = o.lean ?? .95;
  const p = { hip: { x, y: FLOOR - 52 }, s: 1, dir: 1, lean: ln, tilt: o.tilt ?? .45, feet: [{ x: x + 20, y: FLOOR }, { x: x - 12, y: FLOOR }], arms: [{ ang: .9, bend: .3 }, { ang: .8, bend: .3 }] };
  return p;
}
function poseB(t) {
  const x0 = LX - 52;
  const look = stand(x0, { lean: .02, tilt: -.15, t });
  if (t < C.lift - .3) { const p = { ...look }; p.tilt = t < 1.4 ? -.15 : lerp(-.15, .3, smooth(prog(t, 1.4, 1.9))); return p; }
  const pick = crouch(x0 - 20, { amt: .9, tilt: .3 }); pick.arms = [{ target: { x: x0 - 30, y: FLOOR - 10 } }, { target: { x: x0 - 40, y: FLOOR - 10 } }];
  const loaded = stand(x0, { lean: .14, tilt: 0, t }); loaded.arms = [{ ang: 2.2, bend: 1.6 }, { ang: 1.8, bend: 1.8 }];
  if (t < PLACE[0] - .9) return poseAt(t, [[C.lift - .3, look], [C.lift, pick], [C.lift + .5, pick], [C.lift + 1.0, loaded], [PLACE[0] - .9, loaded]]);
  // ciclo de colocar: arrodillarse, poner, pararse, avanzar
  const cycles = [[PLACE[0], 0], [PLACE[1], 1], [C.slip, 2], [PLACE[2], 2], [PLACE[3], 3], [PLACE[4], 4]];
  const post = k => cycles[k][0] === C.slip ? PLACE[2] - .5 - C.slip : k >= 3 ? .3 : .75;
  let i = cycles.findIndex((c, k) => t < c[0] + post(k)); if (i < 0) i = cycles.length - 1;
  const [tp, n] = cycles[i], prevT = i ? cycles[i - 1][0] + post(i - 1) : PLACE[0] - .9;
  const prevN = i ? cycles[i - 1][1] + (cycles[i - 1][0] === C.slip ? 0 : 1) : 0;
  const stA = stand(endX(prevN) - 50, { lean: .1, t }); stA.arms = [{ ang: .3, bend: .4 }, { ang: .1, bend: .4 }];
  const stB = stand(endX(n) - 50, { lean: .12, t }); stB.arms = stA.arms;
  const kn = kneelAt(n);
  const plk = plankInHand(t);
  if (plk) kn.arms = [{ target: { x: plk.x - PW / 2 + 6, y: plk.y - 4 } }, { target: { x: plk.x - PW / 2 + 14, y: plk.y - 6 } }];
  if (tp === C.slip) return failPose(t, n, stB, kn);
  const speed = i >= 3 ? .65 : 1;
  const walkIn = stB.hip.x - stA.hip.x;
  const w = walkIn > 2 ? walk(lerp(stA.hip.x, stB.hip.x, smooth(prog(t, prevT, tp - .55 * speed))), 3 * t * 42, { lean: .14 }) : stB;
  const keys = [[prevT, stA], [tp - .55 * speed - .05, () => w], [tp - .45 * speed, kn], [tp + .15, kn], [tp + .55, { ...kn, lean: .3, tilt: .1 }]];
  if (i === cycles.length - 1) {
    // terminó: se pone de pie y cruza
    if (t > tp + .3) return crossPose(t);
  }
  return poseAt(t, keys);
}
// el tablón en las manos (centro), o null
function plankInHand(t) {
  const list = [[PLACE[0], 0], [PLACE[1], 1], [C.slip, 2], [PLACE[2], 2], [PLACE[3], 3], [PLACE[4], 4]];
  for (const [tp, n] of list) {
    const dur = tp >= PLACE[2] ? .45 : .6;
    if (t > tp - dur && t < tp) {
      const k = easeInOut(prog(t, tp - dur, tp)), x = endX(n) - 46;
      const from = { x: x + 10, y: FLOOR - 150 }, to = { x: endX(n) + PW / 2, y: FLOOR - 2 };
      return { x: lerp(from.x, to.x, k), y: lerp(from.y, to.y, k) - 30 * Math.sin(Math.PI * k), rot: lerp(-1, 0, k) };
    }
  }
  return null;
}
function failPose(t, n, stB, kn) { // el tablón resbala; se va de boca, agita los brazos, recupera
  const lunge = kneelAt(n, { lean: 1.15, tilt: .7 }); lunge.arms = [{ target: { x: endX(n) + 50, y: FLOOR + 30 } }, { target: { x: endX(n) + 40, y: FLOOR + 20 } }];
  const wob = (k) => { const p = kneelAt(n, { lean: lerp(1.0, .2, k), tilt: .2 }); const w = Math.sin(t * 22) * (1 - k); p.arms = [{ ang: Math.PI - .4 + w * .8, bend: .2 }, { ang: Math.PI - 1.2 - w * .8, bend: .2 }]; p.hip.x -= 8 * k; return p; };
  const rest = kneelAt(n, { lean: .15, tilt: .4 }); rest.hip.x -= 10; rest.arms = [{ ang: .5, bend: .5 }, { ang: .4, bend: .5 }];
  const toP = { ...rest, tilt: .1 }; // mira al planificador (gira la cabeza: se endereza)
  const nod = { ...rest, lean: .35, tilt: .5 };
  const stB2 = stand(endX(n) - 50, { lean: .12, t }); stB2.arms = stB.arms;
  return poseAt(t, [[C.slip - .7, stB2], [C.slip - .6 + .05, kn], [C.slip, kn], [C.slip + .2, lunge], [C.wob, () => wob(0)], [C.steady, () => wob(1)], [C.lookP, rest],
    [C.lookP + .3, toP], [C.nod, toP], [C.nod + .25, nod], [C.nod + .5, rest], [PLACE[2] - .45, kn]]);
}
function crossPose(t) {
  const xs = endX(4) - 46, xe = RX + 64;
  const up = stand(xs + 6, { lean: .05, tilt: -.1, t });
  if (t < C.walk) return E.mix(kneelAt(4, { lean: .3, tilt: .1 }), up, smooth(prog(t, PLACE[4] + .3, C.walk)));
  if (t < C.arrive) { const x = lerp(xs + 6, xe, easeInOut(prog(t, C.walk, C.arrive))); return walk(x, x, { lean: .1, tilt: -.1 }); }
  const st = stand(xe, { lean: 0, tilt: -.3, t });
  const ch = cheer(xe, {});
  const jump = 30 * Math.max(0, Math.sin((t - C.cheer - .2) * 7)) * clamp((t - C.cheer - .2) * 5) * (1 - smooth(prog(t, 16.4, 16.8)));
  const turn = stand(xe, { dir: -1, lean: .02, tilt: 0, t }); turn.arms = [{ ang: .9, bend: .4 }, { ang: .1, bend: .2 }]; // le tiende la mano al otro
  const p = poseAt(t, [[C.arrive, st], [C.cheer, st], [C.cheer + .3, ch], [16.6, ch], [17.3, turn]]);
  p.hip.y -= jump; p.feet.forEach(f => f.y -= jump);
  return p;
}
const fallPlank = t => {
  if (t < C.slip) return null;
  const dt = t - C.slip, k = Math.min(dt, 2.2);
  return { x: endX(2) + PW / 2 + 30 * k, y: FLOOR - 2 + 420 * k * k * .5 + 20 * k, rot: 3.5 * k * k };
};

const sunPos = t => ({ x: 600, y: lerp(FLOOR - 70, FLOOR - 250, smooth(prog(t, 0, 16))) });

const SHOTS = [
  [0, { x: 600, y: FLOOR - 170, z: 2.4 }, { x: 330, y: FLOOR - 210, z: 1.42 }],
  [FR(2.15), { x: 190, y: FLOOR - 165, z: 2.0 }, { x: 205, y: FLOOR - 160, z: 2.1 }],
  [FR(3.75), { x: LX + 5, y: FLOOR - 150, z: 2.1 }, { x: LX + 25, y: FLOOR - 145, z: 2.25 }],
  [FR(5.35), { x: XP + 5, y: FLOOR - 135, z: 2.4 }, { x: XP + 5, y: FLOOR - 140, z: 2.6 }],
  [FR(6.3), { x: LX + 40, y: FLOOR - 140, z: 2.15 }, { x: LX + 55, y: FLOOR - 140, z: 2.2 }],
  [FR(7.4), { x: LX + 80, y: FLOOR - 110, z: 2.45 }, { x: LX + 95, y: FLOOR - 105, z: 2.55 }],
  [FR(8.25), { x: LX + 115, y: FLOOR - 70, z: 2.2 }, { x: LX + 120, y: FLOOR + 70, z: 2.0 }],
  [FR(9.1), { x: LX + 80, y: FLOOR - 120, z: 2.5 }, { x: LX + 75, y: FLOOR - 125, z: 2.6 }],
  [FR(9.55), { x: 210, y: FLOOR - 170, z: 1.72 }, { x: 220, y: FLOOR - 170, z: 1.8 }],
  [FR(10.25), { x: LX + 110, y: FLOOR - 130, z: 2.4 }, { x: LX + 120, y: FLOOR - 125, z: 2.5 }],
  [FR(11.0), { x: LX + 150, y: FLOOR - 200, z: 1.9 }, { x: LX + 160, y: FLOOR - 190, z: 2.0 }],
  [FR(11.8), { x: LX + 175, y: FLOOR - 110, z: 2.55 }, { x: LX + 185, y: FLOOR - 115, z: 2.65 }],
  [FR(12.7), { x: LX + 150, y: FLOOR - 160, z: 2.0 }, { x: RX + 40, y: FLOOR - 170, z: 2.05 }],
  [FR(14.55), { x: RX + 70, y: FLOOR - 200, z: 2.25 }, { x: RX + 70, y: FLOOR - 205, z: 2.1 }],
  [FR(16.5), { x: RX - 30, y: FLOOR - 200, z: 1.9 }, { x: 325, y: FLOOR - 230, z: 1.3 }],
  [18.2, { x: 325, y: FLOOR - 230, z: 1.3 }, { x: 322, y: FLOOR - 235, z: 1.27 }],
];
function shotCam(t) {
  let i = SHOTS.length - 1; while (i > 0 && t < SHOTS[i][0]) i--;
  const [t0, a, b] = SHOTS[i], t1 = i + 1 < SHOTS.length ? SHOTS[i + 1][0] : D;
  const p = i === 0 || t0 > 16 ? easeInOut(prog(t, t0, t1)) : smooth(prog(t, t0, t1));
  const sh = pulse(t, C.slip + .15, .3) * .5 + PLACE.reduce((m, q) => Math.max(m, pulse(t, q, .12) * .25), 0);
  return { x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p), zoom: lerp(a.z, b.z, p), shake: sh };
}
const lit = t => smooth(prog(t, C.arrive - .5, C.cheer + .5));

window.SCENE = {
  id: '05-empieza', title: 'Deja de planear, *empieza*', duration: D, cue: C,
  sky: t => .45 + .45 * lit(t),
  spot: t => ({ x: lerp(250, RX + 60, lit(t)), r: 380 }),
  beam: t => ({ x: RX + 70, a: .03 + .07 * lit(t), w: 160 }),
  flashes: [C.cheer + .3],
  camera: shotCam,
  backdrop(t) {
    const s = sunPos(t);
    E.rays(s.x, s.y, t, .55 + .45 * lit(t), '255,60,50', 18, 900);
    E.sun(s.x, s.y, 62 + 10 * lit(t));
  },
  world(t, refl) {
    if (!refl) {
      E.pit(LX, RX, 1500);
      // niebla del abismo
      const g = ctx.createLinearGradient(0, FLOOR, 0, FLOOR + 500);
      g.addColorStop(0, 'rgba(40,10,10,.0)'); g.addColorStop(1, 'rgba(60,12,12,.35)');
      ctx.fillStyle = g; ctx.fillRect(LX + 10, FLOOR, RX - LX - 20, 500);
      const fp = fallPlank(t); if (fp && fp.y < FLOOR + 1400) plank(fp.x, fp.y, fp.rot);
      E.burst(endX(2) + 5, FLOOR, t, C.slip, { n: 14, color: '150,140,130', speed: 90, life: 1, size: 2.5, gravity: 1.5 });
    }
    // tablones puestos
    const n = placed(t);
    for (let i = 0; i < n; i++) plank(endX(i) + PW / 2, FLOOR - 1 + (i > 0 && i < 4 ? 1.5 * Math.sin(Math.PI * (i + .5) / 5) : 0));
    // planificador y sus papeles
    paperPile(pileH(t), t);
    const p = poseP(t), pSl = figure(p, STYLE.gray);
    if (t > C.sitP + .5) { ctx.fillStyle = '#e6e6e6'; ctx.save(); ctx.translate(XP + 52, FLOOR - 6); ctx.rotate(-.15); ctx.fillRect(-16, -2, 32, 4); ctx.restore(); }
    if (!refl) {
      const ba = smooth(prog(t, C.sitP + .6, C.sitP + 1.1)) * (1 - smooth(prog(t, C.look, C.look + .6)) * .5);
      E.bubble(pSl.head.x + 58, pSl.head.y - 96, 1.05 + .03 * Math.sin(t * 3), ba, (cx, cy) => bridgeIcon(cx, cy));
      // bolas de papel que vuelan hacia atrás
      for (const tt of [5.5, 6.3, 9.9, 13.3]) {
        const k = prog(t, tt + .25, tt + .9); if (k <= 0 || k >= 1) continue;
        ctx.fillStyle = '#ddd'; ctx.beginPath(); ctx.arc(lerp(XP, XP - 90, k), FLOOR - 140 * Math.sin(Math.PI * k) * .9 - 6, 5, 0, Math.PI * 2); ctx.fill();
      }
    }
    // constructor
    const b = poseB(t);
    const st = mixStyle(STYLE.hero, { near: '#ffffff', far: '#d8c8c0', glow: .55, glowColor: '255,120,100' }, lit(t));
    const bSl = figure(b, st);
    const remain = 6 - n - (t > C.slip - .6 ? 1 : 0) - (plankInHand(t) && t < C.slip - .6 ? 1 : 0) - (plankInHand(t) && t > C.slip ? 1 : 0);
    if (t > C.lift + .6 && remain > 0) bundle(bSl, remain);
    if (t > C.lift && t < C.lift + .7) { const k = smooth(prog(t, C.lift, C.lift + .7)); for (let i = 0; i < 6; i++) plank(lerp(LX - 85, bSl.sh.x - 10, k), lerp(FLOOR - 5 - i * 9, bSl.sh.y + 20 - i * 6, k), -.95 * k); }
    else if (t <= C.lift) for (let i = 0; i < 6; i++) plank(LX - 85, FLOOR - 5 - i * 9);
    const ph = plankInHand(t); if (ph) plank(ph.x, ph.y, ph.rot);
    if (refl) return;
    // impactos de cada tablón
    PLACE.forEach((q, i) => { E.ring(endX(i) + PW / 2, FLOOR, t, q, { r: 50, life: .5, width: 3, flat: .3 }); E.burst(endX(i) + PW / 2, FLOOR - 4, t, q, { n: 10, color: '255,230,200', speed: 120, life: .45, size: 2, seed: 3 + i }); });
    // llegada a la luz
    E.burst(RX + 64, FLOOR - 190, t, C.cheer + .3, { n: 55, color: '255,80,60', speed: 330, life: 1.5, size: 3.4, gravity: .5 });
    E.ring(RX + 64, FLOOR - 150, t, C.cheer + .3, { r: 220, life: 1, width: 7, color: '255,90,70' });
  },
  events() {
    const ev = E.footsteps(D, t => {
      const b = poseB(t); return [b.phi !== undefined && t > 3 ? { phi: b.phi, size: 1 } : null];
    });
    return ev.concat(
      PLACE.map(q => ({ t: q, type: 'knock', vol: .9 })), PLACE.map(q => ({ t: q - .5, type: 'whoosh', dur: .3, vol: .3 })),
      [
        { t: 0.0, type: 'whoosh', dur: 1.6, vol: .9 }, { t: 0.05, type: 'wind', dur: 4, vol: .5 },
        { t: C.sitP + .4, type: 'thud', vol: .3 }, { t: C.lift + .6, type: 'clatter', vol: .5 },
        { t: 3.2, type: 'slide', dur: .4, vol: .3 }, { t: 5.5, type: 'slide', dur: .3, vol: .3 }, { t: 6.3, type: 'slide', dur: .3, vol: .3 },
        { t: C.slip, type: 'scuff' }, { t: C.slip + .05, type: 'whoosh', dur: 1.2, up: false }, { t: C.slip + .2, type: 'heartbeat' }, { t: C.slip + .9, type: 'heartbeat', vol: .7 },
        { t: C.slip + 2.0, type: 'thud', vol: .2 }, { t: C.nod + .25, type: 'tick', vol: .6 }, { t: 10.2, type: 'riser', dur: 2.4 },
        { t: C.arrive, type: 'swell', dur: 1.2 }, { t: C.cheer + .3, type: 'impact' }, { t: C.cheer + .3, type: 'cheer', dur: 2.5, vol: .8 }, { t: C.cheer + .35, type: 'sparkle' },
      ]);
  },
  music: {
    sections: [
      { t: .2, dur: C.slip - .2, style: 'tender', chords: ['Am', 'F', 'C', 'G'], chordLen: 1.4 },
      { t: C.slip + .1, dur: C.nod - C.slip, style: 'tension', chords: ['Am', 'E'], chordLen: .9 },
      { t: C.nod + .2, dur: C.arrive - C.nod - .2, style: 'build', chords: ['F', 'G', 'Am', 'C'], chordLen: .8 },
      { t: C.arrive, dur: D - C.arrive, style: 'epic', chords: ['C', 'G', 'Am', 'F'], chordLen: 1.3 },
    ],
    stingers: [{ t: C.cheer + .3, type: 'bells' }],
    duck: [[C.slip, C.slip + .6]],
  },
};
})();
