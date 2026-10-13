// 47 — LEVANTA LA MIRADA, VIVE: camina toda su vida mirando el celular. A su lado pasan un niño que lo
// saluda, un amigo que le tiende la mano, un perro que juega, un atardecer y flores; no ve nada y envejece.
// El celular se apaga: levanta la cabeza y todo está oscuro y vacío. Suelta el celular. Amanece, un niño
// corre hacia él y esta vez sí lo ve: lo abraza. La vida vuelve.
(() => {
const { FLOOR, clamp, lerp, prog, smooth, easeOut, easeIn, easeInOut, keyed, distance, solve, figure, mixStyle, STYLE, stand, walk, run, crouch, mix, poseAt, heart, burst, ring, rays, glowCircle, phone, sun, tree, dog, ctx } = E;
const D = 20;
const HX = 330;
const CUE = { kidPass: 3.2, friendPass: 5.5, dog: 6.6, dogStop: 8.7, sunset: 8.4, sunGone: 11.0, slow: 11.0, stop: 12.1, dead: 11.9,
  lookUp: 12.4, lookBack: 13.0, drop: 14.0, crash: 14.4, dawn: 14.8, kidRun: 15.6, see: 15.9, hug: 17.0 };
const SPEED = [[0, 72], [CUE.slow, 60], [CUE.stop, 0], [D, 0]];
const dist = distance(SPEED, D);
const age = t => smooth(prog(t, 2.5, 11.5));
const WX = (X, t) => X - dist(t) * .9;   // carril de fondo: algo de paralaje
const LANE = FLOOR - 34;   // objeto del mundo en x de pantalla

const KID_X = HX + 14 + dist(CUE.kidPass) * .9, FRIEND_X = HX + 14 + dist(CUE.friendPass) * .9;
const DOG_X = HX + 120 + dist(CUE.dogStop) * .9;
const FLOWERS = [{ X: HX + dist(9.4) + 150, s: .5, seed: 3 }, { X: HX + dist(10.1) + 40, s: .38, seed: 8 }, { X: HX + dist(10.6) + 170, s: .45, seed: 12 }];

function hero(t) {
  const a = age(t), d = dist(t), v = keyed(SPEED, t);
  const fr = smooth(prog(t, CUE.stop - .4, CUE.stop));
  let p = walk(HX, d, { lean: lerp(.16, .36, a), tilt: .62, stride: lerp(1, .7, a), stand: lerp(94, 89, a), swing: .12, freeze: fr });
  if (fr > 0) p.feet = p.feet.map((f, i) => ({ x: lerp(f.x, HX + (i ? -10 : 8), fr), y: lerp(f.y, FLOOR, fr) }));
  // levanta la cabeza, mira atrás, suelta el celular
  const up = smooth(prog(t, CUE.lookUp, CUE.lookUp + .5));
  p.tilt = lerp(p.tilt, -.18, up); p.lean = lerp(p.lean, .12, up);
  const back = E.bump(t, CUE.lookBack, CUE.lookBack + .8);
  if (back > .5) p.dir = -1;
  const sh = E.shoulderOf(p);
  const ph = { x: sh.x + 22 * p.dir, y: sh.y + 26 - 12 * up };
  p.arms = [{ target: { x: ph.x - 2 * p.dir, y: ph.y + 4 } }, { target: { x: ph.x + 3 * p.dir, y: ph.y + 6 } }];
  const drop = smooth(prog(t, CUE.drop - .3, CUE.drop + .2));
  if (drop > 0) p.arms = [{ target: { x: lerp(ph.x, sh.x + 26, drop), y: lerp(ph.y + 4, sh.y + 48, drop) } }, { ang: lerp(.6, .05, drop), bend: .3 }];
  // ve al niño: abre los brazos, se agacha y lo abraza
  const see = smooth(prog(t, CUE.see, CUE.see + .5));
  if (see > 0) {
    p.tilt = lerp(p.tilt, -.05, see); p.lean = lerp(p.lean, -.05, see);
    p.arms = [{ ang: lerp(.3, 1.9, see), bend: lerp(.3, -.2, see) }, { ang: lerp(.05, 1.6, see), bend: -.2 }];
    const hugP = smooth(prog(t, CUE.hug - .2, CUE.hug + .3));
    if (hugP > 0) {
      const c = crouch(HX + 6, { amt: .55, tilt: .35 });
      p = mix(p, c, hugP);
      const k = kidPose(t), ksl = solve(k);
      const tgt = { x: ksl.sh.x + 6, y: lerp(ksl.sh.y, ksl.hip.y, .3) };
      p.arms = [{ target: tgt }, { target: { x: tgt.x + 10, y: tgt.y - 8 } }];
    }
  }
  return { p, ph, drop, see };
}
function phoneState(t, h) {
  const flick = t > CUE.dead - .5 && t < CUE.dead ? (Math.sin(t * 60) > 0 ? .3 : 1) : 1;
  const on = (t < CUE.dead ? 1 : 0) * flick;
  if (t < CUE.drop) return { x: h.ph.x, y: h.ph.y, rot: .3 * h.p.dir, on };
  const f = easeIn(prog(t, CUE.drop, CUE.crash));
  return { x: lerp(h.ph.x, h.ph.x + 18, f), y: lerp(h.ph.y, FLOOR - 4, f), rot: lerp(.3, Math.PI / 2, f) + f * 3, on: 0, landed: f >= 1 };
}
// niño del final: corre hacia él
function kidPose(t) {
  const k = easeOut(prog(t, CUE.kidRun, CUE.hug));
  const x = lerp(760, HX + 52, k);
  if (t < CUE.hug) return run(x, (760 - x) * 1.2, { s: .58, dir: -1, lean: .25 });
  const p = stand(HX + 50, { s: .58, dir: -1, t, lean: .25, tilt: -.2 });
  const sh = E.shoulderOf(p);
  p.arms = [{ target: { x: sh.x - 24, y: sh.y - 6 } }, { target: { x: sh.x - 20, y: sh.y - 2 } }];
  return p;
}

// pasantes que él no ve
function waver(t) {
  const x = WX(KID_X, t), passed = t > CUE.kidPass + .25;
  const p = stand(x, { s: .5, y: LANE, dir: passed ? 1 : -1, t, tilt: passed ? lerp(-.1, .45, smooth(prog(t, CUE.kidPass + .4, CUE.kidPass + 1.2))) : -.25 });
  const w = Math.sin(t * 11);
  const droop = smooth(prog(t, CUE.kidPass + .2, CUE.kidPass + 1.0));
  p.arms = [{ ang: lerp(Math.PI - .35 + w * .35, .05, droop), bend: lerp(.2, .1, droop) }, { ang: lerp(Math.PI - .6 - w * .35, .05, droop), bend: .1 }];
  if (!passed) p.hip.y -= Math.abs(Math.sin(t * 7)) * 5;
  return p;
}
function friend(t) {
  const x = WX(FRIEND_X, t), passed = t > CUE.friendPass + .3;
  const p = stand(x, { s: .86, y: LANE, dir: passed ? 1 : -1, t, lean: .08, tilt: .05 });
  const drop = smooth(prog(t, CUE.friendPass + .3, CUE.friendPass + 1.3));
  const offer = smooth(prog(t, CUE.friendPass - 1.6, CUE.friendPass - 1.0));
  p.arms = [{ ang: lerp(.1, 1.45, offer * (1 - drop)), bend: lerp(.3, -.05, offer * (1 - drop)) }, { ang: lerp(.05, .4, drop), bend: lerp(.3, 1.6, drop) }];
  if (passed) { p.tilt = lerp(.05, .4, drop); }
  return p;
}
function dogState(t) {
  if (t < CUE.dog - .8) return null;
  const inP = easeOut(prog(t, CUE.dog - .8, CUE.dog));
  const sit = smooth(prog(t, CUE.dogStop, CUE.dogStop + .4));
  let x = lerp(760, HX + 115, inP) + Math.sin(t * 2.4) * 18;
  if (t > CUE.dogStop) x = lerp(HX + 115, WX(DOG_X, t), smooth(prog(t, CUE.dogStop, CUE.dogStop + .3)));
  const jump = Math.max(0, Math.sin(t * 7)) * 22 * (t > CUE.dog && t < CUE.dogStop ? 1 : 0);
  return { x, y: FLOOR - jump, phase: t * 3.2 * (1 - sit), sit, dir: t > CUE.dogStop + .4 ? -1 : 1 };
}

const CAM = {
  zoom: [[0, 2.5], [1.6, 2.05], [CUE.kidPass, 1.9], [CUE.dog, 1.8], [CUE.sunset, 1.65], [CUE.sunGone, 1.8], [CUE.lookUp, 2.2], [CUE.lookBack + .8, 1.95], [CUE.drop, 2.25], [CUE.crash + .2, 2.15], [CUE.dawn + .5, 1.6], [CUE.hug, 1.9], [D, 1.75]],
  x: [[0, 345], [CUE.kidPass, 380], [CUE.dog, 400], [CUE.sunset, 390], [CUE.lookUp, 340], [CUE.drop, 350], [CUE.dawn + .5, 380], [CUE.hug, 370], [D, 360]],
  y: [[0, FLOOR - 195], [1.6, FLOOR - 180], [CUE.sunset, FLOOR - 200], [CUE.lookUp, FLOOR - 185], [CUE.drop, FLOOR - 140], [CUE.dawn + .5, FLOOR - 220], [CUE.hug, FLOOR - 170], [D, FLOOR - 195]],
};
const dark = t => smooth(prog(t, CUE.sunGone - .5, CUE.dead + .3)) * (1 - smooth(prog(t, CUE.dawn, CUE.dawn + 1.5)));
const sunsetPos = t => ({ x: 520, y: lerp(FLOOR - 230, FLOOR + 40, easeIn(prog(t, CUE.sunset, CUE.sunGone))) });
const sunrisePos = t => ({ x: 230, y: lerp(FLOOR + 40, FLOOR - 300, easeOut(prog(t, CUE.dawn, CUE.dawn + 3.5))) });

window.SCENE = {
  id: '47-mira-arriba', title: 'Levanta la mirada, *vive*', duration: D, cue: CUE,
  scroll: dist,
  spot: t => ({ x: 360, r: lerp(380, 170, dark(t)), a: lerp(.12, .05, dark(t)) }),
  beam: t => ({ x: HX, a: lerp(.05, .09, dark(t)) + .05 * smooth(prog(t, CUE.dawn, CUE.dawn + 2)), w: lerp(170, 90, dark(t)) }),
  sky: t => Math.max(.7 * E.bump(t, CUE.sunset - .5, CUE.sunGone + .3), .8 * smooth(prog(t, CUE.dawn, CUE.dawn + 2.5))),
  blackouts: [CUE.dead],
  flashes: [],
  camera: t => ({ zoom: keyed(CAM.zoom, t), x: keyed(CAM.x, t), y: keyed(CAM.y, t), shake: .2 * E.pulse(t, CUE.crash, .2) }),
  backdrop(t) {
    if (t > CUE.sunset - .2 && t < CUE.sunGone + .2) { const s = sunsetPos(t); sun(s.x, s.y, 46); }
    if (t > CUE.dawn) {
      const s = sunrisePos(t), a = smooth(prog(t, CUE.dawn, CUE.dawn + 1));
      rays(s.x, s.y, t, a, '255,70,60', 16, 900); sun(s.x, s.y, 50, a);
    }
  },
  world(t, refl) {
    const h = hero(t), a = age(t), dk = dark(t);
    // flores del camino (no las ve) y flores del final
    for (const f of FLOWERS) { const x = WX(f.X, t); if (x > -100 && x < 820 && t < CUE.dead) tree(x, LANE, 1, f.seed, f.s * .62, 1); }
    if (t > CUE.dawn + 1) {
      const g = smooth(prog(t, CUE.dawn + 1, CUE.hug + 1.2));
      [[150, .45, 2], [215, .3, 5], [520, .5, 9], [600, .35, 4], [95, .32, 7]].forEach(([x, s, sd], i) => tree(x, FLOOR, clamp(g * 1.4 - i * .1), sd, s, 1));
    }
    // pasantes
    if (t < CUE.dead) {
      const k = waver(t), kx = solve(k).hip.x;
      if (kx > -60 && kx < 800) figure(k, STYLE.hero);
      const fr = friend(t), fx = solve(fr).hip.x;
      if (fx > -60 && fx < 820) figure(fr, mixStyle(STYLE.hero, STYLE.gray, .3), { noShadow: false });
      const dg = dogState(t);
      if (dg && dg.x > -80) dog(dg.x, dg.phase, { dir: dg.dir, s: .75, y: dg.y, sit: dg.sit, moving: 1 - dg.sit, tail: t * (dg.sit ? .4 : 3) });
    }
    // el protagonista
    const style = mixStyle(STYLE.hero, STYLE.gray, .7 * a * (1 - .85 * smooth(prog(t, CUE.hug, CUE.hug + 1.2))));
    const sl = figure(h.p, style);
    const ps = phoneState(t, h);
    if (!refl) {
      // luz roja del celular en la cara
      if (ps.on > 0) glowCircle(sl.head.x + 8 * h.p.dir, sl.head.y + 6, 50, '255,40,40', .2 * ps.on);
      ring(ps.x, ps.y, t, .25, { r: 70, color: '255,60,50', life: .6, width: 4 });
      ring(ps.x, ps.y, t, 4.4, { r: 50, color: '255,60,50', life: .5, width: 3 });
      ring(ps.x, ps.y, t, 7.9, { r: 50, color: '255,60,50', life: .5, width: 3 });
    }
    phone(ps.x, ps.y, ps.rot, ps.on, .8);
    if (ps.landed && !refl) {
      ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(ps.x - 8, ps.y - 3); ctx.lineTo(ps.x + 2, ps.y + 1); ctx.lineTo(ps.x + 9, ps.y - 4); ctx.stroke();
    }
    if (!refl) burst(ps.x + 18, FLOOR - 4, t, CUE.crash, { n: 18, speed: 140, size: 2.5, color: '220,220,220', life: .7 });
    // niño final
    if (t > CUE.kidRun) {
      figure(kidPose(t), STYLE.hero);
      if (!refl && t > CUE.hug) {
        const hp = smooth(prog(t, CUE.hug + .1, CUE.hug + .8));
        const hx = HX + 30, hy = FLOOR - 250 - 8 * Math.sin(t * 2.3);
        glowCircle(hx, hy, 150, '255,60,50', .25 * hp);
        heart(hx, hy, 44 * E.backOut(hp) * (1 + .05 * Math.sin(t * 6)), '#ff3b36', hp, 40);
        burst(hx, hy, t, CUE.hug + .15, { n: 34, speed: 240, size: 3.2, color: '255,150,120', life: 1.4, gravity: .2 });
        ring(HX + 30, FLOOR - 120, t, CUE.hug, { r: 220, color: '255,255,255', life: 1 });
      }
    }
  },
  front(t) {
    // oscuridad que se cierra alrededor (viñeta propia)
    const dk = dark(t);
    if (dk > 0) {
      const g = ctx.createRadialGradient(HX, FLOOR - 120, 60, HX, FLOOR - 120, 420);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${.85 * dk})`);
      ctx.fillStyle = g; ctx.fillRect(-500, -500, 2000, 2500);
    }
  },
  events() {
    const ev = E.footsteps(D, t => {
      const h = hero(t), v = keyed(SPEED, t);
      return [{ phi: h.p.phi || 0, size: lerp(1, .85, age(t)), moving: v > 4, vol: .8 }];
    });
    return ev.concat([
      { t: .2, type: 'notify', vol: .9 }, { t: .25, type: 'whoosh', dur: .4, vol: .5 },
      { t: 4.4, type: 'notify', vol: .6 }, { t: 7.9, type: 'notify', vol: .6 },
      { t: CUE.kidPass - .8, type: 'chime', vol: .4 }, { t: CUE.friendPass - .4, type: 'bell', note: 76, vol: .3 },
      { t: CUE.dog, type: 'bark', vol: .7 }, { t: CUE.dog + .7, type: 'bark', vol: .6 }, { t: CUE.dogStop + .4, type: 'bark', vol: .35 },
      { t: CUE.dead - .5, type: 'buzz', dur: .5, vol: .6 }, { t: CUE.dead, type: 'impact', vol: .5 },
      { t: CUE.dead + .3, type: 'wind', dur: 3.5, vol: .7 },
      { t: CUE.lookUp, type: 'heartbeat', vol: .8 }, { t: CUE.lookUp + .8, type: 'heartbeat', vol: .7 }, { t: CUE.lookUp + 1.6, type: 'heartbeat', vol: .5 },
      { t: CUE.crash, type: 'crack' }, { t: CUE.crash, type: 'clatter', vol: .6 },
      { t: CUE.dawn, type: 'swell', dur: 2.5 }, { t: CUE.kidRun + .2, type: 'chime' },
      ...Array.from({ length: 6 }, (_, i) => ({ t: CUE.kidRun + .1 + i * .22, type: 'step', size: .5, vol: .8 })),
      { t: CUE.hug, type: 'sparkle' }, { t: CUE.hug + .1, type: 'kiss', vol: .5 },
    ]);
  },
  music: {
    sections: [
      { t: .3, dur: CUE.sunset - .3, style: 'tender', chords: ['Am', 'F', 'C', 'G'], chordLen: 1.4, vol: .8 },
      { t: CUE.sunset, dur: CUE.dead - CUE.sunset, style: 'sad', chords: ['Am', 'F', 'Dm', 'E'], chordLen: 1.2 },
      { t: CUE.dead, dur: CUE.dawn - CUE.dead, style: 'tension', chords: ['Am'], chordLen: 1.5, vol: .7 },
      { t: CUE.dawn, dur: D - CUE.dawn, style: 'hope', chords: ['C', 'G', 'Am', 'F'], chordLen: 1.5 },
    ],
    stingers: [{ t: CUE.dawn, type: 'boom' }, { t: CUE.hug, type: 'bells' }],
    duck: [[CUE.dead, CUE.dead + .3], [CUE.drop, CUE.dawn]],
  },
};
})();
