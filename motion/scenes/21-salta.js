// 21 — CONFÍA Y SALTA: un niño en lo alto de una torre de ladrillos. Mira abajo, una piedrita cae: da miedo.
// Retrocede. Abajo su papá abre los brazos. El niño respira, toma impulso y salta. Cámara lenta en el aire.
// Papá lo atrapa, gira con él y lo levanta como avión: corazones y destellos.
(() => {
const { FLOOR, clamp, lerp, prog, smooth, easeOut, easeIn, easeInOut, keyed, distance, figure, STYLE, ctx, mix, stand, walk, poseAt, pulse, bump } = E;
const D = 17;
const RATE = [[0, 1], [6.55, 1], [6.8, .26], [8.9, .26], [9.3, 1], [D, 1]];
const tau = distance(RATE, D);
const realOf = x => { let lo = 0, hi = D; for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (tau(m) < x) lo = m; else hi = m; } return lo; };
// cues en tiempo de acción
const C = { peek: .2, pebble: .35, pebLand: 1.05, back: 1.7, scared: 2.3, dadArms: 3.3, nod: 3.8, look: 4.5, breath1: 4.8, breath2: 5.4, step: 5.9, crouch: 6.25, jump: 6.6, apex: 6.85, catch: 7.25, spin: 7.6, spinEnd: 8.7, lift: 8.9, high: 9.6 };
const WX0 = 160, COLS = 4, BW = 31, ROWS = 18, BH = 20;
const TOP = FLOOR - ROWS * BH, EDGE = WX0 + COLS * BW - 4;
const KS = .56, DX = 420;
const CATCH = { x: DX + 34, y: FLOOR - 128 };
const fwd = T => 80 * smooth(prog(T, C.high + .2, C.high + 5.5));

function kidPose(T) {
  const at = (x, o = {}) => stand(x, { s: KS, t: T, dir: 1, y: TOP, ...o });
  const peek = at(EDGE - 18, { lean: .45, tilt: .75 }); peek.arms = [{ ang: .9, bend: .3 }, { ang: -.6, bend: .3 }];
  const scared = at(EDGE - 58, { lean: -.18, tilt: .25 });
  const ssh = E.shoulderOf(scared); scared.arms = [{ target: { x: ssh.x + 8, y: ssh.y + 12 } }, { target: { x: ssh.x + 4, y: ssh.y + 16 } }];
  scared.hip.x += Math.sin(T * 50) * 1.2 * bump(T, C.scared - .3, C.look);
  const looking = at(EDGE - 52, { lean: .1, tilt: .55 }); looking.arms = scared.arms;
  const breath = (k) => { const p = at(EDGE - 50, { lean: -.06, tilt: -.05 }); p.hip.y -= 5 * k; const sh = E.shoulderOf(p); p.arms = [{ ang: .35 + .3 * k, bend: .2 }, { ang: -.2 - .2 * k, bend: .2 }]; return p; };
  const b = bump(T, C.breath1, C.breath1 + .55) + bump(T, C.breath2, C.breath2 + .55);
  const steady = at(EDGE - 14, { lean: .12, tilt: .3 });
  const crouchP = { ...E.crouch(EDGE - 14, { s: KS, amt: .75, y: TOP, tilt: .05 }), arms: [{ ang: -1.2, bend: .2 }, { ang: -1.0, bend: .2 }] };
  if (T < C.jump) {
    return poseAt(T, [[0, peek], [C.back - .2, peek], [C.back + .25, scared], [C.look - .2, scared], [C.look + .2, looking], [C.breath1 - .1, looking], [C.breath1 + .1, breath(b)], [C.step - .1, breath(b)], [C.step + .3, steady], [C.crouch, steady], [C.jump, crouchP]]);
  }
  // en el aire: arco de la orilla a los brazos de papá
  const p = prog(T, C.jump, C.catch);
  const x = lerp(EDGE - 6, CATCH.x - 10, p), yb = lerp(TOP - 50 * KS, CATCH.y, easeIn(p)) - 70 * Math.sin(Math.PI * p);
  const air = { hip: { x, y: yb }, s: KS, dir: 1, lean: lerp(-.1, .35, p), tilt: lerp(-.3, -.1, p),
    feet: [{ x: x - 30, y: yb + 40 }, { x: x - 40, y: yb + 30 }], arms: [{ ang: 2.1, bend: .1 }, { ang: 1.8, bend: .1 }] };
  if (T < C.catch) return mix(crouchP, air, smooth(prog(T, C.jump, C.jump + .12)));
  // en brazos de papá (frente a frente), luego en alto como avión
  const held = { hip: { x: CATCH.x + 4, y: CATCH.y }, s: KS, dir: -1, lean: .45, tilt: .1,
    feet: [{ x: DX + 18, y: CATCH.y + 34 }, { x: DX + 10, y: CATCH.y + 40 }], arms: [{ target: { x: DX + 8, y: FLOOR - 172 } }, { target: { x: DX + 2, y: FLOOR - 168 } }] };
  const hy = FLOOR - 258;
  const fx = fwd(T), sw = .12 * Math.sin(T * 2.4) * smooth(prog(T, C.high, C.high + 1));
  const plane = { hip: { x: DX + 4 + fx, y: hy }, s: KS, dir: 1, lean: Math.PI / 2 - .15 + sw, tilt: -.6,
    feet: [{ x: DX - 52 + fx, y: hy - 8 - 10 * sw }, { x: DX - 56 + fx, y: hy - 2 - 10 * sw }], arms: [{ ang: Math.PI / 2 + .9, bend: .1 }, { ang: Math.PI / 2 + .6, bend: .1 }] };
  plane.hip.y += Math.sin(T * 3) * 4;
  return poseAt(T, [[C.catch, mix(air, held, .3)], [C.catch + .25, held], [C.lift, held], [C.high, plane]]);
}
function dadPose(T) {
  const idle = stand(DX, { t: T, dir: -1, lean: .02, tilt: -.45 });
  const open = stand(DX, { t: T, dir: -1, lean: -.06, tilt: -.6, arms: [{ ang: 2.5, bend: .1 }, { ang: 2.1, bend: .1 }] });
  const nodP = { ...open, tilt: -.6 + .18 * Math.max(0, Math.sin((T - C.nod) * 9)) * bump(T, C.nod, C.nod + .9) };
  // sigue con la mirada al niño en el aire y se prepara
  const ready = stand(DX + 4, { t: T, dir: -1, lean: .02, tilt: -.5, arms: [{ ang: 2.0, bend: .4 }, { ang: 1.8, bend: .4 }] });
  ready.hip.y += 8;
  const k = kidPose(T);
  const ksl = T >= C.catch ? E.solve({ ...k, arms: [] }) : null;
  if (T < C.catch - .35) return poseAt(T, [[0, idle], [C.dadArms - .3, idle], [C.dadArms, open], [C.jump, nodP], [C.jump + .2, ready]]);
  const hug = stand(DX, { t: T, dir: 1, lean: -.1, tilt: .1 });
  const catchP = { ...hug, arms: [{ target: { x: CATCH.x + 22, y: CATCH.y - 6 } }, { target: { x: CATCH.x + 18, y: CATCH.y - 30 } }] };
  catchP.hip.y += 10 * bump(T, C.catch, C.catch + .5);
  const fx = fwd(T), moving = prog(T, C.high + .2, C.high + 5.5) > 0 && prog(T, C.high + .2, C.high + 5.5) < 1;
  const lifted = walk(DX + fx, fx * 1.3, { dir: 1, lean: -.08, tilt: -.35, stride: .6, freeze: T < C.high + .3 ? 1 : 0 });
  lifted.arms = [{ target: { x: DX + 10 + fx, y: FLOOR - 262 } }, { target: { x: DX - 16 + fx, y: FLOOR - 262 } }];
  return poseAt(T, [[C.catch - .35, ready], [C.catch, catchP], [C.lift, catchP], [C.high, lifted]]);
}
// piedrita que cae
function pebble(T) {
  if (T < C.pebble) return { x: EDGE - 4, y: TOP - 3 };
  const p = prog(T, C.pebble, C.pebLand);
  const x = EDGE - 4 + 30 * p, y = TOP - 3 + (FLOOR - 4 - TOP) * p * p;
  if (T > C.pebLand) { const q = prog(T, C.pebLand, C.pebLand + .4); return { x: EDGE + 26 + 14 * q, y: FLOOR - 4 - 12 * Math.sin(Math.PI * q) * (1 - q) }; }
  return { x, y };
}

window.SCENE = {
  id: '21-salta', title: 'Confía y *salta*', duration: D,
  spot: t => ({ x: keyed([[0, 300], [C.dadArms, 360], [C.catch, DX]], tau(t)), r: 380 }),
  beam: t => { const T = tau(t); return { x: keyed([[0, EDGE - 30], [C.dadArms, DX], [C.look, EDGE - 30], [C.jump, (EDGE + DX) / 2], [C.catch, DX]], T), a: .05 + .05 * smooth(prog(T, C.catch, C.catch + .6)), w: 150 }; },
  sky: t => .35 * smooth(prog(tau(t), C.catch, C.high)),
  flashes: [realOf(C.catch)],
  camera: t => {
    const T = tau(t);
    const zoom = keyed([[0, 2.15], [C.pebble + .2, 1.75], [C.pebLand, 1.6], [C.back, 2.2], [C.scared, 2.55], [C.dadArms - .2, 2.4], [C.dadArms + .3, 1.5], [C.nod + .7, 1.6], [C.look + .1, 2.3], [C.breath2 + .4, 2.55], [C.crouch, 2.3], [C.jump + .1, 1.75], [C.apex, 1.7], [C.catch, 1.95], [C.spinEnd, 2.15], [C.high, 1.85], [C.high + 3, 1.95], [C.high + 6, 2.15]], T);
    const x = keyed([[0, EDGE - 10], [C.pebble + .2, EDGE + 10], [C.pebLand, EDGE + 30], [C.back, EDGE - 30], [C.dadArms - .2, EDGE - 30], [C.dadArms + .3, 330], [C.nod + .7, 335], [C.look + .1, EDGE - 30], [C.crouch, EDGE - 10], [C.jump + .1, (EDGE + DX) / 2], [C.catch, DX + 10], [C.high, DX], [C.high + 3, DX]], T) + fwd(T) * .9;
    const y = keyed([[0, TOP - 40], [C.pebble + .2, TOP + 40], [C.pebLand, FLOOR - 140], [C.back, TOP - 30], [C.dadArms - .2, TOP - 20], [C.dadArms + .3, FLOOR - 230], [C.nod + .7, FLOOR - 235], [C.look + .1, TOP - 20], [C.crouch, TOP - 10], [C.jump + .1, TOP + 40], [C.apex, TOP + 40], [C.catch, FLOOR - 190], [C.high, FLOOR - 250], [C.high + 3, FLOOR - 245]], T);
    return { x, y, zoom, shake: .3 * pulse(T, C.catch, .3) + .08 * pulse(T, C.pebLand, .15) };
  },
  backdrop(t) {
    const T = tau(t), a = smooth(prog(T, C.lift, C.high + 1));
    if (a > 0) { E.rays(DX, FLOOR - 300, t, a, '255,60,50', 14, 700); E.sun(DX + 150, FLOOR - 120 - 120 * a, 34, a); }
  },
  world(t, refl) {
    const T = tau(t);
    E.wall(WX0, FLOOR, COLS, ROWS, .5);
    // borde superior iluminado
    ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(WX0, TOP - 2, COLS * BW, 2);
    const pb = pebble(T); E.stone(pb.x, pb.y, 4, 3, '#bbb');
    const k = kidPose(T), d = dadPose(T);
    const ph = 2 * Math.PI * easeInOut(prog(T, C.spin, C.spinEnd)), cs = Math.cos(ph), spin = T > C.spin && T < C.spinEnd;
    if (spin) { const s = Math.sign(cs) * Math.max(.45, Math.abs(cs)); ctx.save(); ctx.translate(DX + 14, 0); ctx.scale(s, 1); ctx.translate(-(DX + 14), 0); }
    figure(d, STYLE.hero);
    figure(k, STYLE.hero, { noShadow: T > C.jump - .05 });
    if (spin) ctx.restore();
    if (!refl) {
      // líneas de velocidad / estela en el aire
      if (T > C.jump && T < C.catch) {
        for (let i = 1; i < 6; i++) {
          const kp = kidPose(T - i * .03), sl = E.solve({ ...kp, arms: [] });
          E.glowCircle(sl.hip.x, sl.hip.y - 20, 28, '255,255,255', .12 * (1 - i / 6));
        }
        E.glowCircle(CATCH.x, CATCH.y - 30, 110, '255,60,50', .2 * smooth(prog(T, C.jump, C.catch)));
      }
      const cx = CATCH.x - 4, cy = CATCH.y - 40;
      E.ring(cx, cy, T, C.catch, { r: 200, life: 1, color: '255,80,70', width: 7 });
      E.burst(cx, cy, T, C.catch, { n: 46, speed: 320, color: '255,90,70', gravity: .4, life: 1.5, seed: 4 });
      E.burst(cx, cy, T, C.catch + .05, { n: 30, speed: 220, color: '255,240,220', gravity: .2, life: 1.2, size: 3, seed: 8 });
      if (T > C.lift) {
        for (let i = 0; i < 9; i++) {
          const t0 = C.lift + i * .45, p = prog(T, t0, t0 + 2.2);
          if (p > 0 && p < 1) E.heart(DX + Math.sin(i * 2.1 + p * 4) * 70 + (i % 2 ? 40 : -40), FLOOR - 300 - p * 260, 13 + (i % 3) * 5, '#ff3b36', Math.sin(Math.PI * p));
        }
      }
    }
  },
  events() {
    const r = realOf;
    return [
      { t: .05, type: 'wind', dur: 5, vol: .5 },
      { t: r(C.pebble), type: 'scuff', vol: .6 }, { t: r(C.pebble) + .05, type: 'whoosh', vol: .4 },
      { t: r(C.pebLand), type: 'tick', vol: 1 }, { t: r(C.pebLand) + .2, type: 'tick', vol: .5 },
      { t: r(C.back), type: 'scuff', vol: .5 },
      { t: r(C.scared), type: 'heartbeat', vol: .9 }, { t: r(C.scared) + .6, type: 'heartbeat', vol: .9 }, { t: r(C.scared) + 1.2, type: 'heartbeat', vol: .8 },
      { t: r(C.dadArms), type: 'swell', dur: 1.4 },
      { t: r(C.breath1), type: 'wind', dur: .6, vol: .3 }, { t: r(C.breath2), type: 'wind', dur: .6, vol: .3 },
      { t: r(C.step), type: 'step', size: .55, vol: .7 },
      { t: r(C.crouch), type: 'riser', dur: r(C.jump) - r(C.crouch) },
      { t: r(C.jump), type: 'whoosh', vol: .9 }, { t: r(C.jump) + .2, type: 'heartbeat', vol: .6 }, { t: r(C.apex), type: 'heartbeat', vol: .5 },
      { t: r(C.catch), type: 'impact' }, { t: r(C.catch), type: 'thud', vol: .9 }, { t: r(C.catch) + .05, type: 'sparkle' },
      { t: r(C.spin), type: 'whoosh', vol: .5 }, { t: r(C.high), type: 'cheer', dur: 2.5, vol: .5 }, { t: r(C.high), type: 'chime' },
    ];
  },
  music: {
    sections: [
      { t: .4, dur: realOf(C.dadArms) - .4, style: 'tension', chords: ['Am', 'Em'], chordLen: 1.2 },
      { t: realOf(C.dadArms), dur: realOf(C.crouch) - realOf(C.dadArms), style: 'tender', chords: ['F', 'C', 'Am', 'G'], chordLen: .9 },
      { t: realOf(C.crouch), dur: realOf(C.catch) - realOf(C.crouch), style: 'build', chords: ['F', 'G'], chordLen: .8 },
      { t: realOf(C.catch), dur: D - realOf(C.catch), style: 'epic', chords: ['F', 'C', 'G', 'C'], chordLen: 1.2 },
    ],
    stingers: [{ t: realOf(C.catch), type: 'bells' }],
    duck: [[realOf(C.jump) + .1, realOf(C.catch) - .05]],
  },
};
})();
