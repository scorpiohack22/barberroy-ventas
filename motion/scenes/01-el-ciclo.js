// 01 — EL CICLO: el padre levanta al hijo; pasan los años; el hijo sostiene al padre; llega un niño nuevo.
(() => {
const { FLOOR, clamp, lerp, prog, smooth, easeOut, easeInOut, keyed, distance, solve, walk, holdPoint, figure, mixStyle, STYLE, ARM, sun, cane } = E;
const D = 18;
const CUE = { kidTrip: 2.62, kidLift: 3.25, kidOk: 3.8, timeStart: 4.7, timeEnd: 8.5, oldTrip: 10.55, caneHit: 10.95, catchT: 11.0, steady: 12.0, newKid: 13.1, grab: 14.55 };
const SPEED = [[0, 64], [2.55, 64], [2.75, 0], [3.7, 0], [4.1, 64], [4.8, 64], [5.4, 190], [7.9, 190], [8.6, 44], [10.45, 44], [10.7, 0], [12.3, 0], [13.0, 40], [D, 40]];
const dist = distance(SPEED, D);
const age = t => smooth(prog(t, CUE.timeStart + .3, CUE.timeEnd - .3));

function cast(t) {
  const d = dist(t), a = age(t);
  // hijo (izquierda): crece; tropieza de niño; de grande se lanza a sostener al padre
  const kS = lerp(.55, 1.02, a);
  const kTrip = smooth(prog(t, CUE.kidTrip, CUE.kidTrip + .2)) * (1 - easeInOut(prog(t, CUE.kidLift, CUE.kidOk)));
  const catchIn = smooth(prog(t, CUE.oldTrip + .2, CUE.catchT + .25)), settle = smooth(prog(t, CUE.steady, CUE.steady + .9));
  const brace = catchIn * (1 - settle);
  const kX = lerp(lerp(lerp(318, 300, a), 386, catchIn), 362, settle);
  const kid = walk(kX, d + 40, { s: kS, lean: .06 + .82 * kTrip + .45 * brace, freeze: Math.max(kTrip, brace) });
  kid.hip.y += 20 * kS * kTrip; kid.hip.x += 4 * kTrip;
  kid.tilt = .1 * kTrip - .45 * smooth(prog(t, CUE.kidOk - .2, CUE.kidOk + .2)) * (1 - smooth(prog(t, 4.5, 5)));
  const fz = Math.max(kTrip, brace);
  if (fz > 0) kid.feet.forEach(f => f.y = lerp(f.y, FLOOR, fz));
  if (brace > 0) { kid.feet[0].x += 18 * brace; kid.feet[1].x -= 14 * brace; kid.hip.y += 8 * brace; }
  // padre (derecha): envejece, tropieza
  const pS = lerp(1, .93, a);
  const pTrip = smooth(prog(t, CUE.oldTrip, CUE.oldTrip + .35)) * (1 - easeInOut(prog(t, CUE.catchT + .25, CUE.steady)));
  const pFreeze = Math.max(pTrip, smooth(prog(t, CUE.oldTrip, CUE.oldTrip + .2)) * (1 - smooth(prog(t, CUE.steady + .1, CUE.steady + .6))));
  const par = walk(418 + 6 * pTrip, d, { s: pS, stride: lerp(1, .62, a), stand: lerp(94, 89, a), lean: lerp(.05, .34, a) + .4 * pTrip, freeze: pFreeze });
  par.hip.y += 14 * pTrip; par.hip.x += 6 * pTrip;
  par.tilt = lerp(0, .18, a) + .25 * smooth(prog(t, CUE.kidTrip, CUE.kidTrip + .3)) * (1 - smooth(prog(t, CUE.kidOk, CUE.kidOk + .5))) - .3 * pTrip;
  par.lean -= .12 * smooth(prog(t, CUE.kidLift - .1, CUE.kidLift + .2)) * (1 - smooth(prog(t, CUE.kidOk, CUE.kidOk + .4)));
  if (pTrip > 0) par.feet.forEach(f => f.y = lerp(f.y, FLOOR, pTrip));
  // niño nuevo: entra por la izquierda y toma la mano del hijo
  const nIn = easeOut(prog(t, CUE.newKid, CUE.grab));
  const nX = lerp(-70, 236, nIn);
  const nk = walk(nX, d + nX + 15, { s: .55, lean: .1 });

  // brazos
  const kSh = E.shoulderOf(kid), pSh = E.shoulderOf(par), nSh = E.shoulderOf(nk);
  const hold = holdPoint(kSh, ARM * kS, pSh, ARM * pS);
  hold.y -= 26 * smooth(prog(t, CUE.kidTrip + .1, CUE.kidLift + .2)) * (1 - smooth(prog(t, CUE.kidOk, CUE.kidOk + .4)));
  const held = t < CUE.oldTrip + .06;
  const support = smooth(prog(t, CUE.oldTrip + .1, CUE.catchT + .1));
  kid.arms = [held ? { target: hold } : { target: { x: pSh.x + 14 * pTrip - 18 * settle, y: pSh.y + 20 * pS } }, kid.arms[1]];
  if (support > 0 && t < CUE.steady + .3) kid.arms[1] = { target: { x: pSh.x - 26, y: pSh.y + 4 } };
  const grab = t > CUE.grab - .25;
  let nkHold = null;
  if (grab) { nkHold = holdPoint(nSh, ARM * .55, kSh, ARM * kS); kid.arms[1] = { target: nkHold, elbowBack: true }; nk.arms = [{ target: nkHold }, nk.arms[1]]; }
  const caneOn = smooth(prog(t, CUE.timeStart + 1.6, CUE.timeEnd - .6));
  let caneHand = null;
  if (caneOn > 0 && t < CUE.oldTrip + .05) {
    caneHand = { x: par.hip.x + 30 * pS + 6 * Math.sin(2 * Math.PI * par.phi), y: FLOOR - 82 * pS };
    par.arms = [{ target: caneHand }, held ? { target: hold, elbowBack: true } : { ang: .55, bend: .2 }];
  } else par.arms = [{ ang: lerp(-.3, .9, pTrip), bend: .3 }, held ? { target: hold, elbowBack: true } : { ang: .55 + .4 * pTrip, bend: .2 }];
  return { kid, par, nk, nIn, a, pS, caneOn, caneHand };
}

function caneState(t, c) {
  if (c.caneHand) return [{ x: c.caneHand.x, y: c.caneHand.y - 6 }, { x: c.caneHand.x + 12, y: FLOOR }];
  if (t < CUE.oldTrip || c.caneOn <= 0) return null;
  const fall = easeOut(prog(t, CUE.oldTrip + .05, CUE.caneHit));
  const slide = dist(t) - dist(CUE.oldTrip);
  const tip = { x: 486 + 30 * fall - slide, y: FLOOR - 1 }, len = 82 * c.pS, ang = lerp(.12, Math.PI / 2 - .04, fall);
  return [{ x: tip.x + Math.sin(ang) * len, y: tip.y - Math.cos(ang) * len }, tip];
}
const sunTheta = t => 2.25 + easeInOut(prog(t, CUE.timeStart, CUE.timeEnd)) * (Math.PI * 6 + (.5 - 2.25)) - .05 * prog(t, CUE.timeEnd, D);
const sunPos = t => { const th = sunTheta(t); return { x: 365 - Math.cos(th) * 215, y: FLOOR - 40 - Math.sin(th) * 330, h: Math.sin(th) }; };

window.SCENE = {
  id: '01-el-ciclo', title: 'Algún día *te tocará* a ti', duration: D, cue: CUE,
  scroll: dist,
  sky: t => clamp(sunPos(t).h * 1.4 + .2),
  spot: { x: 370, r: 380 },
  blackouts: [CUE.caneHit + .03],
  camera: t => ({
    zoom: keyed([[0, 1.9], [4.4, 2.05], [5.2, 1.7], [8.4, 1.75], [10.4, 1.9], [11.2, 2.2], [12.6, 2.15], [14.2, 1.8], [D, 1.68]], t),
    x: keyed([[0, 372], [11, 385], [11.3, 410], [12.6, 400], [14.2, 352], [D, 358]], t),
    y: keyed([[0, FLOOR - 190], [5, FLOOR - 215], [8.5, FLOOR - 200], [11.2, FLOOR - 165], [14, FLOOR - 185], [D, FLOOR - 215]], t),
  }),
  backdrop(t) { const s = sunPos(t); sun(s.x, s.y, 34 + 8 * smooth(prog(t, 14, 18))); },
  world(t) {
    const c = cast(t);
    figure(c.par, mixStyle(STYLE.hero, STYLE.gray, c.a * .85));
    const cn = caneState(t, c); if (cn) cane(cn[0], cn[1]);
    figure(c.kid, STYLE.hero);
    if (c.nIn > 0) figure(c.nk, STYLE.hero);
  },
  events() {
    const ev = E.footsteps(D, t => {
      const c = cast(t), v = keyed(SPEED, t), mute = t > CUE.timeStart && t < CUE.timeEnd ? .35 : 1;
      return [{ phi: c.kid.phi, size: c.kid.s, moving: v > 4, vol: mute }, { phi: c.par.phi, size: c.pS, moving: v > 4, vol: mute },
              c.nIn > 0 && c.nIn < 1 ? { phi: c.nk.phi, size: .55 } : null];
    });
    return ev.concat([
      { t: CUE.kidTrip + .05, type: 'scuff' }, { t: CUE.kidTrip + .2, type: 'thud', vol: .6 }, { t: CUE.kidLift - .25, type: 'whoosh', vol: .6 },
      { t: CUE.oldTrip + .02, type: 'scuff' }, { t: CUE.caneHit, type: 'clatter' }, { t: CUE.catchT, type: 'thud', vol: .9 },
      { t: CUE.caneHit, type: 'heartbeat', vol: .75 }, { t: CUE.caneHit + .75, type: 'heartbeat', vol: .55 }, { t: CUE.caneHit + 1.45, type: 'heartbeat', vol: .35 },
      { t: CUE.timeStart, type: 'clock', dur: CUE.timeEnd - CUE.timeStart }, { t: CUE.timeStart + .2, type: 'riser', dur: 3.6 },
    ]);
  },
  music: {
    sections: [
      { t: .3, dur: 4.4, style: 'tender', chords: ['Am', 'F', 'C', 'G'], chordLen: 1.1 },
      { t: CUE.timeStart, dur: CUE.timeEnd - CUE.timeStart, style: 'build', chords: ['Am', 'F', 'C', 'G'], chordLen: .62 },
      { t: CUE.timeEnd, dur: CUE.oldTrip - CUE.timeEnd + .2, style: 'sad', chords: ['Am', 'F'], chordLen: 1.1 },
      { t: CUE.steady - .2, dur: D - CUE.steady, style: 'hope', chords: ['F', 'C', 'G', 'C'], chordLen: 1.6 },
    ],
    stingers: [{ t: CUE.timeEnd, type: 'impact' }, { t: CUE.grab, type: 'bells' }, { t: CUE.newKid + .2, type: 'sparkle' }],
    duck: [[CUE.oldTrip, CUE.steady - .4]],
  },
};
})();
