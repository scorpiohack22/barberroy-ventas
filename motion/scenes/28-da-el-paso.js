// 28 — DA EL PASO: tres grandes empujan a un niño al piso. Los espectadores miran (uno graba con el celular).
// Uno da el paso: se pone delante del niño con los brazos abiertos. Otros se suman, uno a uno. Los abusones
// retroceden y se van. Ayudan al niño a levantarse.
(() => {
const { FLOOR, clamp, lerp, prog, smooth, easeOut, easeIn, easeInOut, keyed, bump, pulse, figure, mix, poseAt, stand, walk, run, sit, kneel, mixStyle, STYLE, ctx, glowCircle, burst, ring, rays, heart, phone, rng, holdPoint, shoulderOf, ARM } = E;
const D = 18.5;
const CUE = { shove: .35, land: .85, fist: 3.3, step: 4.2, plant: 5.4, j1: 6.5, j2: 7.3, j3: 8.1, look: 9.0, leave: 9.7, kneelD: 12.0, take: 12.8, up: 13.5, heart: 14.2 };
const KS = .6, BS = 1.12;
const KID = 340, DEF = 395;
const JOIN = [{ x0: 282, x1: 292, t: CUE.j1 }, { x0: 240, x1: 262, t: CUE.j2, phone: true }, { x0: 150, x1: 232, t: CUE.j3 }];
const SOFT = { near: '#d2d2d2', far: '#9a9a9a', glow: .12 };
const BUL = [470, 512, 552];

// ── niño ──
function kidPose(t, defSl) {
  const st = stand(424, { s: KS, t, tilt: -.3 });
  const air = { hip: { x: 384, y: FLOOR - 62 }, s: KS, dir: 1, lean: -.7, tilt: -.2, feet: [{ x: 420, y: FLOOR - 50 }, { x: 410, y: FLOOR - 30 }], arms: [{ ang: 1.7, bend: .2 }, { ang: 2.1, bend: .2 }] };
  const cower = t => { const p = sit(KID, { ground: true, s: KS, lean: -.05, tilt: .55 }); const sh = shoulderOf(p);
    const tr = Math.sin(t * 30) * 1.2 * (t < CUE.plant ? 1 : .3);
    p.arms = [{ target: { x: sh.x + 18 + tr, y: sh.y - 26 } }, { target: { x: sh.x + 10, y: sh.y - 14 } }]; return p; };
  const look = t => { const p = sit(KID, { ground: true, s: KS, lean: .02, tilt: -.25 }); p.arms = [{ ang: .5, bend: .4 }, { ang: -.4, bend: .3 }]; return p; };
  const reach = t => { const p = look(t); return p; };
  const upP = t => stand(KID + 6, { s: KS, t, tilt: -.45 });
  return poseAt(t, [[0, st], [CUE.shove, st], [CUE.shove + .25, air], [CUE.land, sit(KID, { ground: true, s: KS, lean: -.3, tilt: -.1 })], [1.4, cower], [CUE.plant + .8, cower],
    [CUE.plant + 1.6, look], [CUE.take, reach], [CUE.up, upP], [D, upP]]);
}

// ── abusones ──
function bully(i, t, kidSh) {
  const x0 = BUL[i];
  const back = 14 * smooth(prog(t, CUE.plant, CUE.plant + .5)) + 16 * smooth(prog(t, CUE.j1, CUE.j1 + .5)) + 16 * smooth(prog(t, CUE.j2, CUE.j2 + .5)) + 18 * smooth(prog(t, CUE.j3, CUE.j3 + .5));
  const adv = -22 * smooth(prog(t, 1.0, 1.8));
  const x = x0 + adv + back;
  const laugh = bump(t, 1.3, 3.2) * (i === 0 ? .4 : 1);
  let p = stand(x, { s: BS, dir: -1, t: t + i, lean: .12 - .1 * smooth(prog(t, CUE.plant, CUE.plant + .4)), tilt: .2 - .3 * laugh });
  p.hip.y -= Math.abs(Math.sin(t * 15 + i)) * 4 * laugh;
  if (i === 0) {
    const shv = bump(t, CUE.shove - .25, CUE.shove + .35);
    p.lean += .35 * shv; p.hip.x -= 14 * shv;
    const fistUp = smooth(prog(t, CUE.fist - .3, CUE.fist + .2)) * (1 - smooth(prog(t, CUE.plant + .2, CUE.plant + 1.2)));
    if (shv > .05) p.arms = [{ target: { x: 438 - 20 * shv, y: FLOOR - 150 } }, { target: { x: 442 - 20 * shv, y: FLOOR - 136 } }];
    else p.arms = [{ ang: lerp(.3, -2.3, fistUp), bend: lerp(.3, 1.9, fistUp) }, { ang: lerp(.2, .9, fistUp), bend: .6 }];
  } else if (i === 1) p.arms = [{ ang: lerp(.2, 1.5, laugh), bend: .05 }, { ang: .8, bend: 1.8 }];
  else p.arms = [{ ang: .9, bend: 1.9 }, { ang: .8, bend: 1.8 }];
  if (t > CUE.look && t < CUE.leave) { if (i === 1 && t > CUE.look + .2 && t < CUE.look + .55) p.dir = 1; if (i === 2 && t > CUE.look + .1 && t < CUE.look + .5) p.dir = 1; }
  if (t >= CUE.leave + i * .15) {
    const d = Math.max(0, (t - CUE.leave - i * .15)) * 95;
    const w = walk(x + d, d, { s: BS, lean: .15, tilt: .2 });
    w.arms = [{ ang: .1, bend: .2 }, { ang: -.1, bend: .2 }];
    p = mix(p, w, smooth(prog(t, CUE.leave + i * .15, CUE.leave + i * .15 + .25)));
    if (t > CUE.leave + i * .15 + .2) { w.phi = w.phi; return w; }
  }
  return p;
}

// ── espectadores ──
const SPEC0 = 195; // el que da el paso
function defender(t) {
  const idle = t => { const p = stand(SPEC0, { s: .97, t, tilt: .05 + .1 * Math.sin(t * .7) }); p.arms = [{ ang: .15, bend: .4 }, { ang: .05, bend: .5 }]; return p; };
  const hes = t => { const p = stand(SPEC0 + 4, { s: .97, t, lean: .1, tilt: .15 }); p.arms = [{ ang: .4, bend: .6 }, { ang: .1, bend: .5 }]; return p; };
  const go = t => { const d = keyed([[CUE.step, 0], [CUE.plant - .15, DEF - SPEC0]], t, x => x * (2 - x)); return run(SPEC0 + d, d * 1.1, { s: .97, lean: .2, tilt: -.05 }); };
  const shield = t => { const p = stand(DEF, { s: .97, t, lean: -.04, tilt: -.12 }); p.feet = [{ x: DEF + 22, y: FLOOR }, { x: DEF - 24, y: FLOOR }];
    p.arms = [{ ang: 1.55 + .05 * Math.sin(t * 2), bend: -.05 }, { ang: -1.5, bend: .05 }]; return p; };
  const firm = t => { const p = shield(t); p.arms = [{ ang: 1.2, bend: .1 }, { ang: -1.1, bend: .1 }]; return p; };
  const turnK = t => stand(DEF - 2, { s: .97, dir: -1, t, tilt: .4 });
  const kn = t => ({ ...kneel(DEF - 6, { s: .97, dir: -1, lean: .3, tilt: .35 }), arms: [{ target: holdK(t) }, { ang: .4, bend: .4 }] });
  const lift = t => { const p = stand(DEF - 6, { s: .97, dir: -1, t, lean: .02, tilt: .35 }); p.arms = [{ target: holdK(t) }, { ang: .2, bend: .3 }]; return p; };
  const rest = t => { const p = stand(DEF - 6, { s: .97, dir: -1, t, tilt: .3 }); const ks = shoulderOf(stand(KID + 6, { s: KS })); p.arms = [{ target: { x: ks.x + 4, y: ks.y - 2 } }, { ang: .15, bend: .3 }]; return p; };
  return poseAt(t, [[0, idle], [CUE.step - .9, idle], [CUE.step - .2, hes], [CUE.step, hes], [CUE.step + .1, go], [CUE.plant - .15, go], [CUE.plant + .1, shield],
    [CUE.leave + 1.2, shield], [CUE.leave + 1.7, firm], [CUE.kneelD - .5, firm], [CUE.kneelD - .2, turnK], [CUE.kneelD + .4, kn], [CUE.take + .2, kn], [CUE.up + .2, lift], [CUE.up + .9, rest], [D, rest]]);
}
const holdK = t => { const k = t < CUE.take ? { x: KID + 26, y: FLOOR - 70 } : null;
  const up = smooth(prog(t, CUE.take, CUE.up));
  return { x: lerp(KID + 30, KID + 34, up), y: lerp(FLOOR - 66, FLOOR - 92, up) }; };

function joiner(j, t) {
  const idle = t => { const p = stand(j.x0, { s: .95, t: t + j.x0, tilt: .1 }); p.arms = [{ ang: .12, bend: .3 }, { ang: -.05, bend: .3 }];
    if (j.phone) p.arms = [{ target: { x: j.x0 + 30, y: FLOOR - 172 } }, { ang: .1, bend: .3 }]; return p; };
  const go = t => { const d = keyed([[j.t, 0], [j.t + .7, j.x1 - j.x0]], t, x => x); return walk(j.x0 + d, d * 1.3, { s: .95, lean: .12 }); };
  const firm = t => { const p = stand(j.x1, { s: .95, t: t + j.x1, lean: -.02, tilt: -.1 }); p.feet = [{ x: j.x1 + 16, y: FLOOR }, { x: j.x1 - 18, y: FLOOR }];
    const sh = shoulderOf(p); p.arms = t < CUE.leave + 1.5 ? [{ target: { x: sh.x + 16, y: sh.y + 34 } }, { target: { x: sh.x + 20, y: sh.y + 26 } }] : [{ ang: .2, bend: .3 }, { ang: .1, bend: .3 }]; return p; };
  return poseAt(t, [[0, idle], [j.t - .1, idle], [j.t + .05, go], [j.t + .7, go], [j.t + .95, firm], [D, firm]]);
}
const brave = (t, t0) => smooth(prog(t, t0 - .1, t0 + .35));

window.SCENE = {
  id: '28-da-el-paso', title: 'Sé quien *da el paso*', duration: D, cue: CUE,
  spot: t => ({ x: keyed([[0, 420], [CUE.step, 380], [CUE.j3, 340]], t), r: 380 }),
  beam: t => ({ x: keyed([[0, 420], [CUE.step, SPEC0], [CUE.plant, DEF], [CUE.j3, 345]], t), a: .035 + .06 * smooth(prog(t, CUE.step, CUE.plant)), w: keyed([[CUE.plant, 120], [CUE.j3 + .5, 200]], t) }),
  sky: t => .2 * bump(t, 0, CUE.step),
  flashes: [CUE.plant], blackouts: [CUE.land],
  camera: t => ({
    zoom: keyed([[0, 2.05], [CUE.land, 2.15], [1.6, 1.6], [3.0, 1.75], [CUE.fist, 2.2], [CUE.step - .3, 2.25], [CUE.step + .2, 1.9], [CUE.plant, 2.05], [6.2, 2.1], [CUE.j3 + .6, 1.6], [CUE.leave + .5, 1.55], [11.5, 1.7], [CUE.take, 2.15], [CUE.up + .5, 2.1], [D, 1.65]], t),
    x: keyed([[0, 430], [CUE.land, 400], [1.6, 360], [3.0, 380], [CUE.fist, 400], [CUE.step - .3, 380], [CUE.step + .2, 250], [CUE.plant, 420], [6.2, 425], [CUE.j3 + .6, 360], [CUE.leave + .5, 400], [11.5, 360], [CUE.take, 365], [CUE.up + .5, 355], [D, 320]], t, easeInOut),
    y: keyed([[0, FLOOR - 190], [CUE.land, FLOOR - 160], [1.6, FLOOR - 200], [CUE.fist, FLOOR - 170], [CUE.step + .2, FLOOR - 190], [CUE.plant, FLOOR - 190], [CUE.j3 + .6, FLOOR - 205], [11.5, FLOOR - 190], [CUE.take, FLOOR - 140], [CUE.up + .5, FLOOR - 150], [D, FLOOR - 210]], t),
    shake: .35 * pulse(t, CUE.land, .3) + .2 * pulse(t, CUE.plant, .25) + .06 * (pulse(t, CUE.j1 + .9, .15) + pulse(t, CUE.j2 + .9, .15) + pulse(t, CUE.j3 + .9, .15)),
  }),
  world(t, refl) {
    // espectadores en la penumbra (los que se suman se vuelven blancos)
    const others = [{ x: 108, dir: 1, a: .8 }];
    for (const o of others) figure(stand(o.x, { s: .9, t: t + 3, tilt: .15 }), STYLE.dim);
    for (const j of JOIN) {
      const b = brave(t, j.t);
      const sl = figure(joiner(j, t), mixStyle(STYLE.dim, SOFT, b));
      if (j.phone) { const h = E.hand(sl, 0); const on = 1 - smooth(prog(t, j.t - .4, j.t)); if (on > 0) phone(h.x + 2, h.y - 6, -.2, on, .9); }
      if (!refl) ring(j.x1, FLOOR, t, j.t + .9, { color: '255,255,255', r: 70, flat: .25, width: 4, life: .6 });
    }
    const dp = defender(t);
    const dsl = figure(dp, mixStyle(STYLE.dim, STYLE.hero, brave(t, CUE.step)));
    const kp = kidPose(t, dsl);
    BUL.forEach((_, i) => { if (t < CUE.leave + 3.2) figure(bully(i, t), STYLE.gray, { alpha: 1 - smooth(prog(t, CUE.leave + 2, CUE.leave + 3)) }); });
    // niño encima (delante de todos)
    if (t > CUE.take - .1) { const hk = holdK(t); kp.arms = [{ target: hk }, kp.arms[1]]; }
    const ksl = figure(kp, STYLE.hero);
    if (!refl) {
      ring(DEF, FLOOR, t, CUE.step, { color: '255,255,255', r: 80, flat: .25, width: 5, life: .6 });
      ring(DEF, FLOOR - 130, t, CUE.plant, { color: '255,255,255', r: 230, width: 7, life: .9 });
      burst(DEF, FLOOR - 140, t, CUE.plant, { n: 26, speed: 260, seed: 6, color: '255,255,255', life: 1 });
      // la mano que levanta: brillo rojo
      const hk = holdK(t), la = bump(t, CUE.take - .1, CUE.up + .6);
      if (la > 0) glowCircle(hk.x, hk.y, 50, '255,50,40', .55 * la);
      ring(hk.x, hk.y, t, CUE.take, { color: '255,70,60', r: 120, width: 5, life: .9 });
      const ha = smooth(prog(t, CUE.heart, CUE.heart + .6));
      if (ha > 0) { const u = t - CUE.heart; heart(ksl.head.x + 4, ksl.head.y - 46 - u * 10, 22 * easeOut(clamp(u * 2)), '#ff3b36', ha * (1 - smooth(prog(t, D - 1.2, D))), 28);
        glowCircle(ksl.head.x, ksl.head.y - 46 - u * 10, 80, '255,40,30', .25 * ha); }
    }
  },
  events() {
    const ev = E.footsteps(D, t => [
      t > CUE.step && t < CUE.plant ? { phi: keyed([[CUE.step, 0], [CUE.plant - .15, DEF - SPEC0]], t, x => x * (2 - x)) * 1.1 / (4 * 34 * .97), size: 1 } : null,
      ...JOIN.map(j => t > j.t && t < j.t + .7 ? { phi: keyed([[j.t, 0], [j.t + .7, j.x1 - j.x0]], t, x => x) * 1.3 / (4 * 22 * .95), size: 1 } : null),
      ...[0, 1, 2].map(i => t > CUE.leave + i * .15 + .2 && t < CUE.leave + 3 ? { phi: (t - CUE.leave - i * .15) * 95 / (4 * 22 * BS), size: 1.2, vol: .8 } : null),
    ]);
    return ev.concat([
      { t: 0, type: 'whoosh', vol: .7 }, { t: CUE.shove, type: 'impact', vol: .8 }, { t: CUE.land, type: 'thud' },
      { t: 1.3, type: 'crowd', dur: 2.2, vol: .45 }, { t: CUE.fist, type: 'heartbeat', vol: .8 }, { t: CUE.fist + .55, type: 'heartbeat', vol: .9 },
      { t: CUE.step, type: 'thud', vol: .7 }, { t: CUE.plant, type: 'impact' }, { t: CUE.plant, type: 'boom', vol: .6 },
      { t: CUE.j1 + .9, type: 'bell', note: 76 }, { t: CUE.j2 + .9, type: 'bell', note: 79 }, { t: CUE.j3 + .9, type: 'bell', note: 84 },
      { t: CUE.j2 - .2, type: 'snap', vol: .4 },
      { t: CUE.leave, type: 'whoosh', up: false, vol: .5 },
      { t: CUE.take, type: 'chime' }, { t: CUE.up, type: 'swell', dur: 2 }, { t: CUE.heart, type: 'sparkle' },
    ]);
  },
  music: {
    sections: [
      { t: 0, dur: CUE.step, style: 'tension', chords: ['Am', 'Am', 'F', 'E'], chordLen: 1.0 },
      { t: CUE.plant, dur: CUE.leave - CUE.plant, style: 'build', chords: ['Am', 'F', 'C', 'G'], chordLen: .8 },
      { t: CUE.leave, dur: D - CUE.leave, style: 'epic', chords: ['F', 'C', 'G', 'C'], chordLen: 1.5 },
    ],
    stingers: [{ t: CUE.plant, type: 'impact' }, { t: CUE.take, type: 'bells' }],
    duck: [[CUE.step - .3, CUE.plant]],
  },
};
})();
