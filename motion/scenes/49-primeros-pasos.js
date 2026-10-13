// 49 — LOS PRIMEROS PASOS: el bebé se tambalea, cae sentado, mamá lo anima, lo intenta otra vez,
// cada paso deja una huella roja; llega a sus brazos y ella lo eleva al cielo. Las huellas quedan.
(() => {
const { FLOOR, clamp, lerp, prog, smooth, easeOut, easeInOut, keyed, solve, figure, STYLE, ARM, stand, kneel, crouch, sit, mix, poseAt, heart, burst, ring, rays, glowCircle, ctx } = E;
const D = 18.5;
const BS = .42;                        // escala del bebé
const PX = 440;                        // mamá arrodillada (mira a la izquierda)
const CUE = { step1: 1.5, fall: 2.55, sat: 2.85, look: 3.9, clap1: 4.25, clap2: 4.65, up: 5.2, upEnd: 6.2,
  catch: 10.35, rise: 10.7, top: 11.7, hug: 15.0 };
// pasos: [t, pie, nuevoX, duración]
const STEPS = [[CUE.step1, 0, 262, .45], [6.55, 1, 285, .55], [7.4, 0, 309, .6], [8.3, 1, 333, .7], [9.3, 0, 356, .8]];
const PRINTS = STEPS.map(s => ({ t: s[0] + s[3], x: s[2] + 4 }));

function feetAt(t) {
  const f = t < CUE.up ? [{ x: 246 }, { x: 236 }] : [{ x: 254 }, { x: 242 }];
  let lift = [0, 0];
  for (const [ts, i, nx, du] of STEPS) {
    if (ts < CUE.up && t >= CUE.up) continue;
    if (ts >= CUE.up && t < CUE.up) continue;
    const p = prog(t, ts, ts + du);
    if (p <= 0) continue;
    f[i].x = lerp(f[i].x, nx, easeInOut(p));
    lift[i] = Math.sin(Math.PI * p) * 14 * BS * 1.6;
  }
  return f.map((q, i) => ({ x: q.x, y: FLOOR - lift[i] }));
}

// bebé de pie/caminando: brazos arriba para equilibrio, tambaleo
function toddler(t, extraLean = 0) {
  const f = feetAt(t);
  const cx = (f[0].x + f[1].x) / 2;
  const wob = Math.sin(t * 7.3) * .09 + Math.sin(t * 3.1) * .05;
  const bob = Math.abs(Math.sin(t * 5)) * 1.5;
  return {
    hip: { x: cx + wob * 10, y: FLOOR - 88 * BS - bob }, s: BS, dir: 1, lean: .05 + wob + extraLean, tilt: -.15 - wob * .5,
    feet: [f[0], f[1]],
    arms: [{ ang: 1.9 + Math.sin(t * 6) * .3, bend: -.5 }, { ang: 2.2 + Math.sin(t * 5 + 1) * .3, bend: -.6 }],
  };
}

// cabeza grande de bebé: resolver y agrandar la cabeza
function babyFig(pose, opts = {}) {
  const sl = solve(pose);
  const R = { ...sl.R, headR: 23 * .62 };
  const dx = sl.head.x - sl.sh.x, dy = sl.head.y - sl.sh.y, L = Math.hypot(dx, dy) || 1, k = (R.neck + R.headR) / L;
  const head = { x: sl.sh.x + dx * k, y: sl.sh.y + dy * k };
  return figure({ ...sl, R, head }, STYLE.hero, opts);
}

function baby(t) {
  // fase A: primer intento y caída de sentón
  if (t < CUE.fall) {
    const lean = -.25 * smooth(prog(t, 2.1, CUE.fall));
    return { pose: toddler(t, lean + .15 * smooth(prog(t, CUE.step1, CUE.step1 + .3)) * (1 - smooth(prog(t, 1.9, 2.2)))) };
  }
  const seated = sit(250, { s: BS, ground: true, tilt: .1, lean: -.05, arms: [{ ang: .9, bend: .3 }, { ang: .7, bend: .3 }] });
  if (t < CUE.up) {
    const fallP = easeOut(prog(t, CUE.fall, CUE.sat));
    const bounce = Math.sin(prog(t, CUE.sat, CUE.sat + .35) * Math.PI) * 5 * (t > CUE.sat ? 1 : 0);
    const sad = smooth(prog(t, CUE.sat + .2, CUE.sat + .7)) * (1 - smooth(prog(t, CUE.look - .2, CUE.look + .3)));
    const look = smooth(prog(t, CUE.look - .2, CUE.look + .3));
    const p = mix(toddler(CUE.fall, -.25), seated, fallP);
    p.hip.y -= bounce; p.tilt = lerp(p.tilt, .55, sad) - .45 * look; p.lean += .25 * sad - .1 * look;
    if (sad > 0) p.arms = [{ ang: lerp(.9, .3, sad), bend: .5 }, { ang: lerp(.7, .2, sad), bend: .5 }];
    if (look > 0) p.arms = [{ ang: lerp(.3, 1.6, look), bend: -.3 }, { ang: lerp(.2, 1.4, look), bend: -.3 }];
    return { pose: p };
  }
  if (t < CUE.upEnd + .3) {
    const tStand = toddler(CUE.upEnd + .3);
    const c = crouch(250, { s: BS, amt: 1, tilt: -.1 });
    c.arms = [{ ang: .8, bend: .2 }, { ang: .6, bend: .2 }];
    return { pose: poseAt(t, [[CUE.up, seated], [CUE.up + .55, c], [CUE.upEnd, tStand]]) };
  }
  if (t < CUE.catch) {
    const p = toddler(t, .25 * smooth(prog(t, 9.75, CUE.catch)));
    return { pose: p };
  }
  return { air: true };
}

function mom(t) {
  const wait = kneel(PX, { dir: -1, lean: .22, tilt: .15 });
  wait.arms = [{ ang: 1.25 + Math.sin(t * 2) * .05, bend: -.25 }, { ang: 1.45, bend: -.3 }];
  // reacciona a la caída: manos a la boca/pecho, se inclina
  const worry = smooth(prog(t, CUE.fall, CUE.fall + .3)) * (1 - smooth(prog(t, 3.7, 4.1)));
  const clap = t > 4.0 && t < 5.0;
  const p = { ...wait, arms: [...wait.arms] };
  p.lean = lerp(p.lean, .45, worry); p.tilt = lerp(p.tilt, .35, worry);
  if (worry > 0) p.arms = [{ ang: lerp(1.25, 2.6, worry), bend: lerp(-.25, 2.2, worry) }, { ang: lerp(1.45, 2.4, worry), bend: lerp(-.3, 2.3, worry) }];
  if (clap) {
    const sh = E.shoulderOf(p);
    const k = Math.max(E.bump(t, CUE.clap1 - .15, CUE.clap1 + .15), E.bump(t, CUE.clap2 - .15, CUE.clap2 + .15));
    p.tilt = -.05;
    p.arms = [{ target: { x: sh.x - 46, y: sh.y + 20 - 4 * k + (1 - k) * 0 + 14 * (1 - k) } }, { target: { x: sh.x - 46 + 28 * (1 - k), y: sh.y + 10 + 14 * (1 - k) } }];
  }
  return p;
}

// trayectoria del bebé en brazos (relativa al hombro de mamá)
function airBaby(t, psh) {
  const up = easeInOut(prog(t, CUE.rise + .4, CUE.top));
  const down = easeInOut(prog(t, CUE.hug, CUE.hug + .9));
  const sp = prog(t, CUE.top, CUE.hug);
  const swing = Math.sin(sp * Math.PI * 3) * 26 * smooth(prog(t, CUE.top, CUE.top + .4)) * (1 - smooth(prog(t, CUE.hug - .4, CUE.hug)));
  const chest = { x: psh.x - 26, y: psh.y + 30 };
  const over = { x: psh.x - 46 + swing, y: psh.y - 50 - 6 * Math.sin(sp * Math.PI * 6) };
  const hugP = { x: psh.x - 22, y: psh.y + 34 };
  let h = { x: lerp(chest.x, over.x, up), y: lerp(chest.y, over.y, up) };
  h = { x: lerp(h.x, hugP.x, down), y: lerp(h.y, hugP.y, down) };
  const kick = Math.sin(t * 9);
  const pose = {
    hip: h, s: BS, dir: 1, lean: lerp(.2, -.05, up) + swing * .006 - .25 * down, tilt: lerp(-.3, -.5, up) + .2 * down,
    feet: [{ x: h.x + 4 + kick * 4, y: h.y + 36 }, { x: h.x - 8 - kick * 4, y: h.y + 35 }],
    arms: up > .5 && down < .5 ? [{ ang: 2.7 + Math.sin(t * 8) * .2, bend: .1 }, { ang: 2.9 + Math.sin(t * 8 + 1) * .2, bend: .1 }]
      : [{ ang: 1.6 + 1.2 * down, bend: .6 }, { ang: 1.4 + 1.2 * down, bend: .6 }],
  };
  return pose;
}

function cast(t) {
  const out = {};
  const b = baby(t);
  if (!b.air) {
    out.baby = b.pose;
    const m = mom(t);
    // alcanzar y atrapar
    const reachIn = smooth(prog(t, 9.6, CUE.catch));
    if (reachIn > 0) {
      m.lean = lerp(m.lean, .78, reachIn); m.tilt = lerp(m.tilt, .2, reachIn);
      const sl = solve(b.pose), msh = E.shoulderOf(m);
      const tgt = { x: sl.sh.x + 4, y: lerp(sl.hip.y, sl.sh.y, .4) };
      const ms = solve(m), h0 = E.hand(ms, 0), h1 = E.hand(ms, 1);
      m.arms = [{ target: { x: lerp(h0.x, tgt.x, reachIn), y: lerp(h0.y, tgt.y, reachIn) } },
        { target: { x: lerp(h1.x, tgt.x - 8, reachIn), y: lerp(h1.y, tgt.y - 6, reachIn) } }];
    }
    out.mom = m;
    return out;
  }
  // mamá se levanta con el bebé y lo eleva
  const k0 = kneel(PX, { dir: -1, lean: .78, tilt: .2 });
  const stUp = stand(PX - 12, { dir: -1, lean: -.14, tilt: -.3, t });
  const hugPose = stand(PX - 12, { dir: -1, lean: .12, tilt: .25, t });
  const sway = Math.sin(prog(t, CUE.top, CUE.hug) * Math.PI * 3) * .1 * (t > CUE.top && t < CUE.hug ? 1 : 0);
  let m = poseAt(t, [[CUE.catch, k0], [CUE.rise + .7, stand(PX - 12, { dir: -1, lean: .05, tilt: 0 })], [CUE.top, stUp], [CUE.hug, stUp], [CUE.hug + .9, hugPose]]);
  m.lean = (m.lean || 0) + sway;
  // pasitos de giro de mamá
  if (t > CUE.top && t < CUE.hug) {
    const ph = (t - CUE.top) * 3.2;
    m.feet = [{ x: PX - 12 - 7 + Math.sin(ph * Math.PI) * 8, y: FLOOR - Math.max(0, Math.sin(ph * Math.PI)) * 6 }, { x: PX - 12 + 9 - Math.sin(ph * Math.PI) * 8, y: FLOOR - Math.max(0, -Math.sin(ph * Math.PI)) * 6 }];
  }
  const msh = E.shoulderOf(m);
  // antes de levantarse: el bebé pasa del piso al pecho
  let bp;
  if (t < CUE.rise + .4) {
    const g = smooth(prog(t, CUE.catch, CUE.rise + .4));
    const land = toddler(CUE.catch, .25);
    const target = airBaby(CUE.rise + .4, msh);
    bp = mix(land, target, g);
  } else bp = airBaby(t, msh);
  const bsl = solve(bp);
  const tgt = { x: bsl.hip.x + 2, y: lerp(bsl.hip.y, bsl.sh.y, .45) };
  m.arms = [{ target: { x: tgt.x - 7, y: tgt.y }, elbowUp: t > CUE.top - .5 && t < CUE.hug + .4 }, { target: { x: tgt.x + 7, y: tgt.y - 4 }, elbowUp: t > CUE.top - .5 && t < CUE.hug + .4 }];
  out.mom = m; out.baby = bp; out.air = true;
  return out;
}

function footprint(x, a, glow) {
  ctx.save(); ctx.globalAlpha *= a;
  if (glow > 0) glowCircle(x, FLOOR + 3, 22 + 10 * glow, '255,50,40', .35 * glow);
  ctx.fillStyle = '#ff3b36'; ctx.shadowColor = '#ff3b36'; ctx.shadowBlur = 12 + 14 * glow;
  ctx.beginPath(); ctx.ellipse(x, FLOOR + 3, 8, 2.6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x + 8, FLOOR + 2, 2, 1.2, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

const CAM = {
  zoom: [[0, 1.95], [1.4, 2.25], [2.6, 2.4], [3.1, 2.0], [5.0, 2.0], [6.3, 2.15], [9.6, 2.45], [10.4, 2.3], [11.0, 1.95], [11.7, 1.75], [14.8, 1.85], [16.2, 2.0], [D, 1.75]],
  x: [[0, 350], [2.6, 320], [3.2, 340], [5.0, 345], [6.4, 320], [9.6, 380], [10.6, 400], [11.7, 405], [15.0, 405], [D, 370]],
  y: [[0, FLOOR - 135], [2.6, FLOOR - 120], [3.2, FLOOR - 150], [6.4, FLOOR - 140], [9.6, FLOOR - 130], [10.6, FLOOR - 190], [11.7, FLOOR - 255], [14.8, FLOOR - 250], [16.2, FLOOR - 205], [D, FLOOR - 215]],
};

window.SCENE = {
  id: '49-primeros-pasos', title: 'Los primeros pasos *nunca se olvidan*', duration: D, cue: CUE,
  spot: t => ({ x: lerp(330, 400, smooth(prog(t, 9, 11))), r: 340 }),
  beam: t => ({ x: lerp(300, 400, smooth(prog(t, 9, 11))), a: .05 + .07 * smooth(prog(t, CUE.top - .3, CUE.top + .5)), w: 170 }),
  sky: t => .5 * smooth(prog(t, CUE.top - .4, CUE.top + 1)),
  flashes: [CUE.top],
  blackouts: [CUE.sat],
  camera: t => ({
    zoom: keyed(CAM.zoom, t), x: keyed(CAM.x, t), y: keyed(CAM.y, t),
    shake: .35 * E.pulse(t, CUE.sat + .02, .2) + .25 * E.pulse(t, CUE.top, .25),
  }),
  backdrop(t) {
    const a = smooth(prog(t, CUE.top - .3, CUE.top + .6));
    if (a > 0) { rays(PX - 30, FLOOR - 330, t, a * 1.2, '255,70,60', 16, 800); glowCircle(PX - 30, FLOOR - 330, 260, '255,60,50', .25 * a); }
  },
  world(t, refl) {
    // huellas
    const endGlow = smooth(prog(t, CUE.hug + .5, CUE.hug + 1.6));
    for (const p of PRINTS) {
      const a = smooth(prog(t, p.t, p.t + .15));
      if (a > 0 && !refl) footprint(p.x, a, Math.max(E.pulse(t, p.t + .1, .5), endGlow));
      if (!refl) ring(p.x, FLOOR + 3, t, p.t, { r: 46, flat: .25, color: '255,70,60', life: .7, width: 4 });
    }
    const c = cast(t);
    figure(c.mom, STYLE.hero);
    const fall = E.pulse(t, CUE.sat, .4);
    babyFig(c.baby, c.air ? { noShadow: true } : {});
    if (!refl) {
      burst(255, FLOOR - 4, t, CUE.sat, { n: 14, speed: 90, size: 2.5, color: '200,200,200', life: .6, gravity: .3 });
      // corazones y destellos del triunfo
      if (t > CUE.top - .2) {
        const bsl = solve(c.baby);
        burst(bsl.head.x, bsl.head.y, t, CUE.top, { n: 40, speed: 320, size: 3.5, color: '255,210,120', life: 1.5, gravity: .4, seed: 4 });
        burst(bsl.head.x, bsl.head.y, t, CUE.top + .1, { n: 26, speed: 220, size: 4, color: '255,60,50', life: 1.4, gravity: .2, seed: 7 });
        ring(bsl.head.x, bsl.head.y, t, CUE.top, { r: 240, color: '255,255,255', life: .9, width: 8 });
        for (let i = 0; i < 9; i++) {
          const t0 = CUE.top + .2 + i * .55, dt = t - t0;
          if (dt < 0 || dt > 2.6) continue;
          const x = PX - 30 + Math.sin(i * 2.3) * 90 + Math.sin(dt * 3 + i) * 10, y = FLOOR - 200 - dt * 85;
          heart(x, y, 14 + (i % 3) * 6, '#ff3b36', Math.min(1, dt * 3) * (1 - dt / 2.6));
        }
      }
      if (t > CUE.hug + .6) {
        const hp = smooth(prog(t, CUE.hug + .6, CUE.hug + 1.4));
        const msl = solve(c.mom);
        heart(msl.sh.x - 14, msl.sh.y - 70 - 6 * Math.sin(t * 3), 34 * E.backOut(hp) * (1 + .06 * Math.sin(t * 6)), '#ff3b36', hp);
      }
    }
  },
  events() {
    const ev = [];
    for (const p of PRINTS) ev.push({ t: p.t, type: 'step', size: .4, vol: 1.6 }, { t: p.t + .02, type: 'bell', note: 72 + PRINTS.indexOf(p) * 2 + (PRINTS.indexOf(p) > 0 ? 2 : 0), vol: .35 });
    return ev.concat([
      { t: 0, type: 'whoosh', dur: .5, vol: .7 }, { t: .2, type: 'chime', vol: .6 }, { t: .35, type: 'heartbeat', vol: .5 },
      { t: CUE.fall + .05, type: 'whoosh', dur: .3, vol: .4 }, { t: CUE.sat, type: 'thud', vol: .7 },
      { t: CUE.clap1, type: 'snap', vol: .8 }, { t: CUE.clap2, type: 'snap', vol: .8 },
      { t: CUE.up, type: 'swell', dur: 1.2, vol: .4 },
      { t: CUE.catch, type: 'thud', vol: .4 }, { t: CUE.catch + .05, type: 'heartbeat', vol: .6 },
      { t: CUE.rise, type: 'riser', dur: 1 }, { t: CUE.top, type: 'sparkle' }, { t: CUE.top, type: 'cheer', dur: 3.2, vol: .8 },
      { t: CUE.top + .1, type: 'chime' }, { t: CUE.hug + .6, type: 'kiss', vol: .8 }, { t: CUE.hug + .7, type: 'sparkle', vol: .6 },
    ]);
  },
  music: {
    sections: [
      { t: .3, dur: CUE.fall, style: 'tender', chords: ['C', 'G', 'Am', 'F'], chordLen: .9 },
      { t: CUE.sat + .2, dur: CUE.up - CUE.sat - .2, style: 'sad', chords: ['Am', 'F'], chordLen: 1.1 },
      { t: CUE.up, dur: CUE.catch - CUE.up, style: 'build', chords: ['F', 'G', 'Am', 'G'], chordLen: 1.2 },
      { t: CUE.top - .05, dur: D - CUE.top, style: 'hope', chords: ['C', 'G', 'Am', 'F'], chordLen: 1.5 },
    ],
    stingers: [{ t: CUE.top, type: 'bells' }, { t: CUE.top, type: 'impact' }],
    duck: [[CUE.sat, CUE.sat + .3], [CUE.catch - .1, CUE.top - .1]],
  },
};
})();
