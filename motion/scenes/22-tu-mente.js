// 22 — LA CADENA ESTÁ EN TU MENTE: un niño atado del tobillo a una estaca con una cuerda fina. Jala con todo,
// no puede, se rinde y se sienta. Pasan los años: crece hasta ser un adulto grande… sentado, con la misma
// cuerda fina, sin intentarlo. Un día sale el sol rojo: se levanta, da un paso fuerte y la cuerda revienta.
(() => {
const { FLOOR, clamp, lerp, prog, smooth, easeOut, easeIn, easeInOut, keyed, distance, figure, STYLE, ctx, mix, stand, walk, poseAt, pulse, bump } = E;
const D = 18;
const RATE = [[0, 1], [12.75, 1], [12.95, .3], [14.1, .3], [14.4, 1], [D, 1]];
const tau = distance(RATE, D);
const realOf = x => { let lo = 0, hi = D; for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (tau(m) < x) lo = m; else hi = m; } return lo; };
const C = { tug1: .25, tug2: .95, tug3: 1.65, fall: 2.35, sat: 2.9, lookRope: 3.3, tl0: 4.2, tl1: 9.4, dawn: 9.8, lift: 10.7, rise: 11.5, stood: 12.3, turn: 12.0, step: 12.65, snap: 13.0, walk: 13.45 };
const STX = 196, ROPE_L = 132, MX = 318;
const age = T => smooth(prog(T, C.tl0, C.tl1));
const S = T => lerp(.55, 1.12, age(T));
const walkD = distance([[0, 0], [C.walk, 0], [C.walk + .4, 46], [30, 46]], 30);

function manPose(T) {
  const s = S(T);
  // niño jalando (mira a la derecha, el pie de atrás atado)
  const tug = Math.max(pulse(T, C.tug1 + .2, .35), pulse(T, C.tug2 + .2, .35), pulse(T, C.tug3 + .2, .35));
  const pull = stand(MX + 10, { s, dir: 1, lean: .35 + .3 * tug, tilt: -.1 - .2 * tug });
  pull.hip.x += 6 * tug;
  pull.feet = [{ x: MX + 26 + 4 * tug, y: FLOOR }, { x: STX + ROPE_L * .9, y: FLOOR - 4 * tug }];
  pull.arms = [{ ang: 1.2 + .5 * tug, bend: .2 }, { ang: -.9 - .4 * tug, bend: .3 }];
  const fallen = E.sit(MX, { s, ground: true, dir: -1, lean: -.15, tilt: -.2 });
  // sentado mirando la estaca y la cuerda (cabeza baja)
  const sitP = (lean, tilt) => { const p = E.sit(MX, { s, ground: true, dir: -1, lean, tilt }); const sl = E.solve({ ...p, arms: [] }); const kn = sl.legs[0][1]; p.feet = [{ x: MX - 52 * s, y: FLOOR }, { x: MX - 44 * s, y: FLOOR }]; const k2 = E.solve({ ...p, arms: [] }).legs[0][1]; p.arms = [{ target: { x: k2.x + 4 * s, y: k2.y + 10 * s } }, { target: { x: k2.x + 10 * s, y: k2.y + 16 * s } }]; return p; };
  const sad = sitP(.55, .8);
  const breathe = sitP(.55 + .03 * Math.sin(T * 2), .8);
  const looking = sitP(.25, -.15);
  // se levanta y gira hacia el sol
  const up = stand(MX + 4, { s, t: T, dir: 1, lean: .05, tilt: -.25 });
  const crouchP = E.crouch(MX + 2, { s, dir: 1, amt: .55, tilt: -.2 });
  const stepP = stand(MX + 40, { s, dir: 1, lean: .3, tilt: -.25 });
  stepP.feet = [{ x: MX + 84, y: FLOOR }, { x: MX + 6, y: FLOOR - 6 }];
  stepP.arms = [{ ang: -.7, bend: .4 }, { ang: .9, bend: .5 }];
  if (T < C.fall) return pull;
  if (T < C.rise) return poseAt(T, [[C.fall, pull], [C.sat, fallen], [C.lookRope, sad], [C.dawn, breathe], [C.lift - .2, breathe], [C.lift + .4, looking], [C.rise, looking]]);
  if (T < C.walk) return poseAt(T, [[C.rise, looking], [C.rise + .45, crouchP], [C.stood, up], [C.step - .1, up], [C.snap, stepP], [C.walk, stepP]]);
  const x = MX + 40 + walkD(T);
  const w = walk(x, walkD(T) + 30, { s, dir: 1, lean: .02, tilt: -.25, stride: 1.1 });
  const cheer = smooth(prog(T, 16.2, 16.8));
  if (cheer > 0) w.arms = [{ ang: lerp(.3, Math.PI - .5, cheer), bend: .1 }, { ang: lerp(-.2, Math.PI - .35, cheer), bend: .1 }];
  return mix(stepP, w, smooth(prog(T, C.walk, C.walk + .3)));
}

// sol y luna durante el paso del tiempo; al final, el amanecer rojo a la derecha
function skyBodies(T) {
  const th = easeInOut(prog(T, C.tl0, C.tl1)) * Math.PI * 6;
  const R = 230, cx = MX - 20, cy = FLOOR - 60;
  const sx = cx - Math.cos(th) * R, sy = cy - Math.sin(th) * R * 1.05;
  return { sun: { x: sx, y: sy, a: (T > C.tl0 && T < C.tl1 + .2) ? clamp(Math.sin(th) * 3) : 0 }, moon: { x: cx + Math.cos(th) * R, y: cy + Math.sin(th) * R * 1.05, a: (T > C.tl0 && T < C.tl1) ? clamp(-Math.sin(th) * 3) : 0 } };
}
const dawn = T => smooth(prog(T, C.dawn, C.lift + 1));
const SUNX = 590;

window.SCENE = {
  id: '22-tu-mente', title: 'La única cadena *está en tu mente*', duration: D,
  spot: t => { const T = tau(t); return { x: lerp(MX - 30, MX + 60 + walkD(T) * .8, smooth(prog(T, C.walk, D))), r: 380 }; },
  beam: t => { const T = tau(t); return { x: MX - 20 + walkD(T), a: .05 - .03 * dawn(T), w: 150 }; },
  sky: t => { const T = tau(t); const b = skyBodies(T); return Math.max(.6 * b.sun.a * (T > C.tl0 && T < C.tl1 ? 1 : 0), dawn(T)); },
  flashes: [realOf(C.snap)],
  camera: t => {
    const T = tau(t), wd = walkD(T);
    const zoom = keyed([[0, 2.35], [C.tug3, 2.15], [C.fall, 2.0], [C.lookRope, 2.4], [C.tl0, 2.2], [C.tl0 + 1.2, 1.7], [C.tl1 - .5, 1.8], [C.dawn, 2.0], [C.lift, 2.45], [C.rise, 2.1], [C.stood, 1.95], [C.step, 2.3], [C.snap, 2.6], [C.walk + .3, 2.0], [C.walk + 2, 1.65], [D, 1.5]], T);
    const x = keyed([[0, MX - 30], [C.fall, MX - 50], [C.lookRope, MX - 40], [C.tl0 + 1.2, MX - 20], [C.tl1 - .5, MX - 10], [C.dawn, MX + 20], [C.lift, MX + 10], [C.stood, MX + 40], [C.step, MX - 10], [C.snap, MX - 20], [C.walk + .3, MX + 40]], T) + smooth(prog(T, C.walk, D)) * wd * .75;
    const y = keyed([[0, FLOOR - 140], [C.lookRope, FLOOR - 110], [C.tl0 + 1.2, FLOOR - 220], [C.tl1 - .5, FLOOR - 210], [C.dawn, FLOOR - 200], [C.lift, FLOOR - 170], [C.stood, FLOOR - 210], [C.step, FLOOR - 140], [C.snap, FLOOR - 110], [C.walk + .3, FLOOR - 190], [D, FLOOR - 260]], T);
    return { x, y, zoom, shake: .45 * pulse(T, C.snap, .25) + .12 * Math.max(pulse(T, C.tug1 + .2, .2), pulse(T, C.tug2 + .2, .2), pulse(T, C.tug3 + .2, .2)) };
  },
  backdrop(t) {
    const T = tau(t), b = skyBodies(T);
    if (b.moon.a > 0) E.moon(b.moon.x, b.moon.y, 26, b.moon.a);
    if (b.sun.a > 0) E.sun(b.sun.x, b.sun.y, 30, b.sun.a);
    const d = dawn(T);
    if (d > 0) {
      const sy = lerp(FLOOR + 50, FLOOR - 150, easeOut(d)) - 40 * smooth(prog(T, C.walk, D));
      E.rays(SUNX, sy, t, d * (.6 + .4 * smooth(prog(T, C.snap, C.snap + 1))), '255,60,50', 16, 900);
      E.sun(SUNX, sy, 50 + 14 * smooth(prog(T, C.snap, D)), d);
    }
  },
  world(t, refl) {
    const T = tau(t);
    // estaca
    ctx.fillStyle = '#8a7a66'; ctx.beginPath(); ctx.moveTo(STX - 7, FLOOR); ctx.lineTo(STX - 6, FLOOR - 52); ctx.lineTo(STX + 6, FLOOR - 52); ctx.lineTo(STX + 7, FLOOR); ctx.fill();
    ctx.fillStyle = '#a8957c'; ctx.fillRect(STX - 8, FLOOR - 56, 16, 6);
    const m = manPose(T);
    const sl = E.solve(m);
    const ankle = sl.legs[1][2];
    const knot = { x: STX + 4, y: FLOOR - 40 };
    // cuerda: fina, gris; tensa cuando el pie está lejos
    ctx.save();
    const ropeCol = '#d8d2c4';
    if (T < C.snap) {
      const dist = Math.hypot(ankle.x - knot.x, ankle.y - knot.y);
      const sag = Math.max(0, ROPE_L - dist) * .55;
      const vib = (T > C.step && T < C.snap) ? Math.sin(T * 120) * 1.5 : 0;
      E.sagRope(knot, { x: ankle.x, y: ankle.y - 3 }, sag + vib, ropeCol, 2.2);
    } else {
      // dos pedazos que saltan
      const p = easeOut(prog(T, C.snap, C.snap + .6));
      const brk = { x: lerp(knot.x, ankle.x, .5), y: FLOOR - 26 };
      const endA = { x: brk.x - 20 * p - 8, y: lerp(brk.y, FLOOR - 1, p) - 18 * Math.sin(Math.PI * p) };
      E.sagRope(knot, endA, 6 + 14 * p, ropeCol, 2.2);
      const tail = 20 + 10 * (1 - p);
      const sw = Math.sin(T * 9) * 4;
      E.rope([{ x: ankle.x, y: ankle.y - 3 }, { x: ankle.x - tail * .6, y: ankle.y - 2 + sw * .3 }, { x: ankle.x - tail, y: ankle.y + 1 + sw * .5 }], ropeCol, 2.2);
    }
    ctx.restore();
    figure(m, STYLE.hero);
    if (!refl) {
      // lazo en el tobillo
      ctx.strokeStyle = '#d8d2c4'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(ankle.x, ankle.y - 4, 5 * m.s + 2, 3, 0, 0, Math.PI * 2); ctx.stroke();
      // la ruptura
      const bx = lerp(knot.x, ankle.x, .5), by = FLOOR - 26;
      E.ring(bx, by, T, C.snap, { r: 160, life: .9, color: '255,90,70', width: 6 });
      E.burst(bx, by, T, C.snap, { n: 40, speed: 280, color: '255,220,200', gravity: .6, life: 1.2, size: 3, seed: 3 });
      E.burst(bx, by, T, C.snap + .02, { n: 26, speed: 200, color: '255,70,50', gravity: .3, life: 1.4, seed: 11 });
      // tiempo pasando: brillo del reloj
      if (T > C.tl0 && T < C.tl1) E.glowCircle(sl.head.x, sl.head.y, 60, '255,255,255', .06);
      // luz del amanecer en su cara
      const d = dawn(T);
      if (d > 0) E.glowCircle(sl.head.x + 20, sl.head.y, 90, '255,60,50', .25 * d);
    }
  },
  events() {
    const r = realOf;
    const ev = [
      { t: r(C.tug1 + .1), type: 'thud', vol: .5 }, { t: r(C.tug1 + .15), type: 'scuff', vol: .5 },
      { t: r(C.tug2 + .1), type: 'thud', vol: .6 }, { t: r(C.tug2 + .15), type: 'scuff', vol: .5 },
      { t: r(C.tug3 + .1), type: 'thud', vol: .7 }, { t: r(C.tug3 + .15), type: 'scuff', vol: .6 },
      { t: r(C.sat - .1), type: 'thud', vol: .8 },
      { t: r(C.tl0), type: 'clock', dur: r(C.tl1) - r(C.tl0) }, { t: r(C.tl0), type: 'wind', dur: r(C.tl1) - r(C.tl0), vol: .4 },
      { t: r(C.dawn), type: 'swell', dur: 2 },
      { t: r(C.lift), type: 'heartbeat', vol: .7 }, { t: r(C.lift) + .7, type: 'heartbeat', vol: .8 },
      { t: r(C.rise), type: 'riser', dur: r(C.snap) - r(C.rise) },
      { t: r(C.step), type: 'thud', vol: .7 },
      { t: r(C.snap), type: 'snap', vol: 1.2 }, { t: r(C.snap), type: 'impact' }, { t: r(C.snap) + .05, type: 'sparkle' },
    ];
    ev.push(...E.footsteps(D, t => { const T = tau(t); return [T > C.walk + .2 ? { phi: manPose(T).phi || 0, size: 1.1, vol: .8 } : null]; }));
    ev.push({ t: r(16.3), type: 'cheer', dur: 1.6, vol: .4 });
    return ev;
  },
  music: {
    sections: [
      { t: .3, dur: realOf(C.tl0) - .3, style: 'sad', chords: ['Am', 'Em', 'F', 'Am'], chordLen: 1.1 },
      { t: realOf(C.tl0), dur: realOf(C.tl1) - realOf(C.tl0), style: 'build', chords: ['Am', 'F', 'C', 'G'], chordLen: .7 },
      { t: realOf(C.tl1), dur: realOf(C.rise) - realOf(C.tl1), style: 'tender', chords: ['F', 'C'], chordLen: 1.2 },
      { t: realOf(C.rise), dur: realOf(C.snap) - realOf(C.rise), style: 'tension', chords: ['Am'], chordLen: 2 },
      { t: realOf(C.snap), dur: D - realOf(C.snap), style: 'epic', chords: ['F', 'C', 'G', 'C'], chordLen: 1.2 },
    ],
    stingers: [{ t: realOf(C.snap), type: 'boom' }, { t: realOf(C.snap) + .1, type: 'bells' }],
    duck: [[realOf(C.step) + .05, realOf(C.snap) - .02]],
  },
};
})();
