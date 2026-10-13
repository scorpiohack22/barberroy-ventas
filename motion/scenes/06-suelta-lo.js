// 06 — SUELTA LO QUE TE PESA: camina con una mochila; una nube oscura le deja caer piedras rojas, una a una.
// Cada vez más lento y encorvado, cae de rodillas. Se quita la mochila: las piedras ruedan y se apagan.
// Se levanta, respira… y camina ligero hacia el sol que sale.
(() => {
const { FLOOR, clamp, lerp, prog, smooth, easeOut, easeIn, easeInOut, bump, pulse, keyed, poseAt, walk, stand, kneel, figure, STYLE, shoulderOf, ctx } = E;
const D = 19;
const FR = x => (Math.round(x * 30) + .5) / 30;
const X = 300;
const DROPS = [.75, 2.15, 3.3, 4.35, 5.3, 6.15];
const C = { knee: 7.15, look: 8.4, strap: 9.5, off: 10.0, land: 10.45, rise: 11.9, tall: 13.0, breath: 13.0, go: 13.6 };
const SPEED = [[0, 96], [.8, 96], [.95, 35], [1.5, 82], [2.15, 74], [2.3, 25], [2.9, 62], [3.3, 55], [3.45, 15], [3.95, 44], [4.35, 38], [4.5, 8], [5.0, 30], [5.3, 25], [5.45, 4], [5.9, 18],
  [6.15, 15], [6.3, 2], [6.7, 12], [7.0, 6], [7.15, 0], [C.go, 0], [C.go + .6, 120], [D, 125]];
const dist = E.distance(SPEED, D);
const load = t => DROPS.reduce((s, d) => s + smooth(prog(t, d, d + .35)), 0) / DROPS.length; // 0..1
const lighter = t => smooth(prog(t, C.off, C.land + .3));
const heroX = t => X + 120 * smooth(prog(t, 15.5, D));

function poseB(t) {
  const L = load(t) * (1 - lighter(t)), d = dist(t), x = heroX(t);
  // impacto: se doblan las rodillas y se va hacia adelante
  const hit = DROPS.reduce((m, q) => Math.max(m, bump(t, q - .02, q + .45)), 0);
  if (t < C.knee - .35) {
    const w = walk(x, d, { stride: lerp(1, .45, L), lean: lerp(.07, .75, L) + .2 * hit, tilt: lerp(0, .45, L), stand: lerp(94, 82, L) - 10 * hit, swing: lerp(.42, .12, L) });
    w.arms = [{ ang: lerp(-.2, .25, L) + w.arms[0].ang * (1 - L), bend: .3 + .3 * L }, { ang: lerp(-.1, .2, L) + w.arms[1].ang * (1 - L), bend: .3 }];
    // anticipación del primer golpe: mira arriba
    w.tilt -= .5 * bump(t, DROPS[0] - .5, DROPS[0]);
    return w;
  }
  const w0 = walk(x, dist(C.knee - .35), { stride: .45, lean: .75, tilt: .45, stand: 82, freeze: 1 });
  const kn = kneel(x, { lean: .72, tilt: .55 }); kn.arms = [{ target: { x: x + 46, y: FLOOR - 64 } }, { target: { x: x + 40, y: FLOOR - 60 } }];
  const down = kneel(x, { lean: .85, tilt: .7 }); down.hip.y += 4; down.arms = [{ target: { x: x + 72, y: FLOOR - 2 } }, { target: { x: x + 64, y: FLOOR - 2 } }];
  const lookUp = kneel(x, { lean: .45, tilt: -.25 }); lookUp.arms = [{ target: { x: x + 46, y: FLOOR - 64 } }, { target: { x: x + 40, y: FLOOR - 60 } }];
  const back = kneel(x, { lean: .4, tilt: .25 }); back.arms = lookUp.arms; // mira la mochila (hombro)
  const sh = shoulderOf(back);
  const strap = { ...back, lean: .3, tilt: .35, arms: [{ target: { x: sh.x - 8, y: sh.y + 2 }, elbowUp: true }, back.arms[1]] };
  const pull = { ...back, lean: .25, tilt: .2, arms: [{ target: { x: sh.x + 40, y: sh.y + 30 } }, { ang: -.6, bend: .2 }] };
  const free = kneel(x, { lean: .2, tilt: .1 }); free.arms = [{ ang: .4, bend: .3 }, { ang: .3, bend: .3 }];
  const half = kneel(x, { lean: .05, tilt: -.25 }); half.hip.y -= 14; half.arms = [{ ang: .3, bend: .2 }, { ang: .2, bend: .2 }];
  const tall = stand(x, { lean: -.06, tilt: -.38, t }); tall.arms = [{ ang: .45, bend: .1 }, { ang: .35, bend: .1 }];
  const breath = stand(x, { lean: -.1, tilt: -.5, t }); breath.hip.y -= 3; breath.arms = [{ ang: .8, bend: .05 }, { ang: .7, bend: .05 }];
  if (t < C.go) return poseAt(t, [[C.knee - .35, w0], [C.knee, kn], [C.knee + .5, down], [C.look - .3, down], [C.look + .3, lookUp], [C.strap - .4, back], [C.strap, strap], [C.off, pull], [C.land + .2, free],
    [C.rise - .6, free], [C.rise, half], [C.tall, tall], [C.breath + .45, breath], [C.go, breath]]);
  const k = smooth(prog(t, C.go, C.go + .6));
  const w = walk(x, d, { stride: 1.15, lean: .1, tilt: -.12, swing: .55 });
  w.hip.y -= 3 * Math.abs(Math.sin(2 * Math.PI * w.phi)); // paso ligero
  return k < 1 ? E.mix(breath, w, k) : w;
}
// mochila: tamaño según la carga
const packSize = t => 1 + 2.3 * load(t);
function packOnBack(sl, t) {
  const s = packSize(t), g = .25 + .75 * load(t);
  const bx = lerp(sl.hip.x, sl.sh.x, .55) - sl.dir * (16 + 10 * s) * sl.s, by = lerp(sl.hip.y, sl.sh.y, .55);
  const ang = Math.atan2(sl.sh.x - sl.hip.x, sl.hip.y - sl.sh.y);
  E.glowCircle(bx, by, 60 * Math.sqrt(s), '255,40,30', .25 * g);
  drawPack(bx, by, ang, s, t, load(t));
  // correas
  ctx.strokeStyle = '#4e463e'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(sl.sh.x, sl.sh.y + 2); ctx.lineTo(bx + sl.dir * 6, by - 10); ctx.stroke();
}
function drawPack(bx, by, ang, s, t, fill) {
  ctx.save(); ctx.translate(bx, by); ctx.rotate(ang);
  const w = 26 * s, h = 40 * Math.sqrt(s);
  // piedras asomando arriba
  const n = Math.round(fill * 6);
  for (let i = 0; i < n; i++) stoneR(-w * .3 + (i % 3) * w * .3, -h / 2 - 4 - Math.floor(i / 3) * 7, 7 + (i % 2) * 2, i, 1);
  const g = ctx.createLinearGradient(-w / 2, 0, w / 2, 0); g.addColorStop(0, '#3b342d'); g.addColorStop(.4, '#7a6c5c'); g.addColorStop(1, '#2f2924');
  ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 9); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(-w / 2 + 3, h * .05, w - 6, 4);
  ctx.restore();
}
// piedra roja brillante (glow 1) o apagada (glow 0)
function stoneR(x, y, r, seed, glow) {
  const col = E.mixCol([80, 76, 72], [255, 59, 54], glow);
  ctx.save(); if (glow > .05) { ctx.shadowColor = `rgba(255,40,30,${glow})`; ctx.shadowBlur = 18 * glow; }
  E.stone(x, y, r, seed + 3, col); ctx.restore();
}
// piedras que caen
function fallingStones(t, sl) {
  DROPS.forEach((q, i) => {
    const t0 = q - .55; if (t < t0 || t > q) return;
    const p = easeIn(prog(t, t0, q));
    const tx = lerp(sl.hip.x, sl.sh.x, .55) - sl.dir * 30, ty = lerp(sl.hip.y, sl.sh.y, .8) - 20;
    const y = lerp(FLOOR - 460, ty, p), x = lerp(tx + 30, tx, p);
    for (let k = 1; k <= 6; k++) E.glowCircle(x, y - k * 22 * p, 16, '255,50,40', .18 * (1 - k / 7));
    stoneR(x, y, 13, i, 1); E.glowCircle(x, y, 50, '255,40,30', .35);
  });
}
// mochila tirada y piedras rodando
const DROPX = () => heroX(C.off) - 40;
function droppedPack(t) {
  const scr = dist(t) - dist(C.land);
  const p = easeIn(prog(t, C.off, C.land));
  const x0 = DROPX() - scr;
  const y = lerp(FLOOR - 120, FLOOR - 22, p), ang = lerp(.3, -1.45, p);
  drawPack(x0 - 20 * p, y, ang, packSize(C.off) * .95, t, t < C.land ? 1 : 0);
  const n = 6;
  for (let i = 0; i < n; i++) {
    const r = E.rng(50 + i), v = 60 + r() * 150, dt = Math.max(0, t - C.land - i * .06);
    const travel = v * (1 - Math.exp(-dt * 1.6)) / 1.6;
    const sx = x0 - 50 - travel - scr * 0, sy = FLOOR - 9 - Math.abs(Math.sin(dt * 9 + i)) * 10 * Math.exp(-dt * 3);
    if (t < C.land) continue;
    const glow = 1 - smooth(prog(t, C.land + .6 + i * .1, C.land + 1.8 + i * .1));
    stoneR(sx, sy, 9 + r() * 3, i, glow);
  }
}
function darkCloud(t, sl) {
  const a = 1 - smooth(prog(t, C.land, C.land + 1.5));
  if (a <= 0) return;
  const x = sl.sh.x - 10, y = FLOOR - 470 + 40 * load(t) + 6 * Math.sin(t * 1.3);
  const fl = DROPS.reduce((m, q) => Math.max(m, pulse(t, q - .55, .12)), 0);
  E.glowCircle(x, y + 10, 160, '255,40,30', .25 * fl * a);
  E.cloud(x, y, 1.5 + .4 * load(t), '#2b2b30', a);
  E.cloud(x + 50, y + 18, 1.1, '#232327', a);
}
const sunUp = t => smooth(prog(t, C.land + .3, D - .5));

const SHOTS = [
  [0, { x: 315, y: FLOOR - 250, z: 1.72 }, { x: 320, y: FLOOR - 240, z: 1.85 }],
  [FR(1.45), { x: 295, y: FLOOR - 170, z: 2.45 }, { x: 290, y: FLOOR - 165, z: 2.55 }],
  [FR(2.85), { x: 300, y: FLOOR - 70, z: 2.55 }, { x: 295, y: FLOOR - 75, z: 2.65 }],
  [FR(3.85), { x: 330, y: FLOOR - 290, z: 1.6 }, { x: 325, y: FLOOR - 270, z: 1.68 }],
  [FR(4.9), { x: 300, y: FLOOR - 150, z: 2.3 }, { x: 305, y: FLOOR - 140, z: 2.5 }],
  [FR(6.5), { x: 315, y: FLOOR - 160, z: 1.95 }, { x: 320, y: FLOOR - 130, z: 2.2 }],
  [FR(8.25), { x: 340, y: FLOOR - 125, z: 2.75 }, { x: 345, y: FLOOR - 125, z: 2.9 }],
  [FR(9.35), { x: 285, y: FLOOR - 135, z: 2.15 }, { x: 280, y: FLOOR - 125, z: 2.25 }],
  [FR(10.95), { x: 215, y: FLOOR - 50, z: 2.5 }, { x: 200, y: FLOOR - 50, z: 2.6 }],
  [FR(11.85), { x: 330, y: FLOOR - 150, z: 2.35 }, { x: 345, y: FLOOR - 185, z: 2.0 }],
  [FR(13.6), { x: 370, y: FLOOR - 200, z: 1.95 }, { x: 430, y: FLOOR - 240, z: 1.45 }],
];
function shotCam(t) {
  let i = SHOTS.length - 1; while (i > 0 && t < SHOTS[i][0]) i--;
  const [t0, a, b] = SHOTS[i], t1 = i + 1 < SHOTS.length ? SHOTS[i + 1][0] : D;
  const p = smooth(prog(t, t0, t1));
  const sh = Math.max(...DROPS.map((q, i) => pulse(t, q, .22) * (.3 + .1 * i)), pulse(t, C.land, .3) * .9, pulse(t, C.knee, .2) * .5);
  return { x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p), zoom: lerp(a.z, b.z, p), shake: sh };
}

window.SCENE = {
  id: '06-suelta-lo', title: 'Suelta lo que *te pesa*', duration: D, cue: C,
  scroll: dist,
  sky: t => .15 + .85 * sunUp(t),
  spot: t => ({ x: heroX(t), r: lerp(300, 420, sunUp(t)), a: lerp(.06, .13, sunUp(t)) }),
  beam: t => ({ x: heroX(t) + 10, a: lerp(.03, .09, lighter(t)), w: 150 }),
  flashes: [DROPS[5], C.tall - .1],
  camera: shotCam,
  backdrop(t) {
    const u = sunUp(t);
    if (u > 0) { const y = lerp(FLOOR + 40, FLOOR - 280, u); E.rays(600, y, t, u, '255,60,50', 18, 900); E.sun(600, y, 50 + 14 * u); }
  },
  world(t, refl) {
    if (t > C.off) droppedPack(t);
    const b = poseB(t), sl = figure(b, STYLE.hero);
    if (t < C.off) packOnBack(sl, t);
    if (refl) return;
    darkCloud(t, sl);
    fallingStones(t, sl);
    DROPS.forEach((q, i) => {
      const px = lerp(sl.hip.x, sl.sh.x, .55) - 40, py = lerp(sl.hip.y, sl.sh.y, .7) - 20;
      E.burst(px, py, t, q, { n: 24, speed: 220, life: .7, size: 3, seed: 3 + i });
      E.ring(px, py, t, q, { r: 70 + 10 * i, life: .5, width: 4, color: '255,70,60' });
    });
    E.burst(DROPX() - 20, FLOOR - 10, t, C.land, { n: 30, color: '170,160,150', speed: 150, life: .9, size: 3, seed: 2 });
    E.ring(DROPX() - 20, FLOOR - 5, t, C.land, { r: 120, life: .7, width: 5, flat: .3 });
    // respiro: anillo de luz que se expande desde el pecho
    const chest = { x: lerp(sl.hip.x, sl.sh.x, .7), y: lerp(sl.hip.y, sl.sh.y, .7) };
    E.ring(chest.x, chest.y, t, C.breath + .1, { r: 260, life: 1.2, width: 6, color: '255,255,255' });
    E.burst(chest.x, chest.y, t, C.breath + .1, { n: 36, color: '255,255,255', speed: 200, life: 1.4, size: 2.4, gravity: -.3, seed: 12 });
  },
  events() {
    const ev = E.footsteps(D, t => { const b = poseB(t); return [b.phi !== undefined && (t < C.knee - .4 || t > C.go) ? { phi: b.phi, size: t < C.knee ? 1.2 : .8, vol: t < C.knee ? 1 : .7 } : null]; });
    return ev.concat(
      DROPS.map((q, i) => ({ t: q - .55, type: 'whoosh', dur: .55, up: false, vol: .5 })),
      DROPS.map((q, i) => ({ t: q, type: 'thud', vol: .7 + i * .06 })), DROPS.map((q, i) => ({ t: q, type: 'impact', vol: .35 + i * .08 })),
      [
        { t: 0.0, type: 'rumble', dur: 1.2, vol: .7 }, { t: 0.05, type: 'wind', dur: 7, vol: .5 },
        { t: C.knee, type: 'thud', vol: 1 }, { t: C.knee + .2, type: 'heartbeat' }, { t: C.knee + .95, type: 'heartbeat', vol: .8 }, { t: C.knee + 1.7, type: 'heartbeat', vol: .6 },
        { t: C.strap + .1, type: 'slide', dur: .4, vol: .6 }, { t: C.land, type: 'boom' }, { t: C.land + .05, type: 'clatter', vol: .8 },
        { t: C.land + .3, type: 'slide', dur: 1.2, vol: .5 }, { t: C.rise, type: 'swell', dur: 1.4 }, { t: C.breath + .1, type: 'sparkle' }, { t: C.breath + .1, type: 'chime', vol: .7 },
      ]);
  },
  music: {
    sections: [
      { t: .2, dur: C.knee - .2, style: 'tension', chords: ['Am', 'F', 'Dm', 'E'], chordLen: 1.15 },
      { t: C.knee + .1, dur: C.off - C.knee - .1, style: 'sad', chords: ['Am', 'F'], chordLen: 1.4 },
      { t: C.land + .4, dur: C.go - C.land - .4, style: 'tender', chords: ['F', 'C'], chordLen: 1.3 },
      { t: C.go, dur: D - C.go, style: 'hope', chords: ['F', 'C', 'G', 'C'], chordLen: 1.3 },
    ],
    stingers: [{ t: C.land, type: 'impact' }, { t: C.breath + .1, type: 'bells' }],
    duck: [[C.strap - .2, C.land]],
  },
};
})();
