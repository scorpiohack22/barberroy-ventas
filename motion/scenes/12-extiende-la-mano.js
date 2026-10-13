// 12 — EXTIENDE LA MANO: sube la escalera escalón por escalón y llega a la cima bajo el sol…
// pero mira abajo: su amigo sigue sentado en la oscuridad. Baja, le tiende la mano y suben juntos.
(() => {
const { FLOOR, ctx, clamp, lerp, prog, smooth, easeOut, easeIn, easeInOut, keyed, bump, pulse, rng, walk, stand, sit, kneel, cheer, mix, poseAt,
  shoulderOf, figure, mixStyle, STYLE, sun, glowCircle, burst, ring, rays, heart, brick, holdPoint, ARM } = E;
const D = 20;
const SX = 300, SW = 50, SH = 44, N = 6, TOPX = 720;
const CUE = { start: .9, top: 6.2, cheer: 6.5, cheerEnd: 7.9, turn: 8.1, look: 8.4, down: 9.0, kneel: 10.6, offer: 10.9, fLook: 10.9, fUp: 11.4, grip: 12.3,
  rise: 12.6, climb: 13.0, arrive: 16.4, win: 16.7 };
const rampY = x => FLOOR - SH * clamp((x - SX) / SW + .5, 0, N);
const stepIdx = x => x < SX ? -1 : Math.min(N - 1, Math.floor((x - SX) / SW));
const stepY = x => x < SX ? FLOOR : FLOOR - SH * (stepIdx(x) + 1);
const heroX = t => keyed([[0, 276], [CUE.start, 276], [CUE.top, 600], [CUE.turn, 610], [CUE.down, 606], [CUE.kneel - .1, 392], [CUE.climb, 392], [CUE.arrive, 650], [D, 650]], t, p => p);
const friendX = t => keyed([[0, 182], [CUE.fUp, 182], [CUE.grip - .3, 282], [CUE.climb, 282], [CUE.arrive, 594], [D, 594]], t, p => p);
const sunK = t => smooth(prog(t, CUE.top - .1, CUE.top + 1));
const together = t => smooth(prog(t, CUE.arrive - .3, CUE.arrive + 1.2));

// escalera: momento en que cada escalón se ilumina (lo pisa el héroe)
const litAt = (() => {
  const out = Array(N).fill(99);
  for (let t = 0; t < CUE.top + 1; t += .01) { const i = stepIdx(heroX(t) + 14); if (i >= 0 && out[i] === 99) out[i] = t; }
  return out;
})();
const litAt2 = (() => {
  const out = Array(N).fill(99);
  for (let t = CUE.climb; t < D; t += .01) { const i = stepIdx(friendX(t) + 14); if (i >= 0 && out[i] === 99) out[i] = t; }
  return out;
})();

function climber(x, d, o = {}) {
  const y = rampY(x), s = o.s || 1;
  const p = walk(x, d, { ...o, y, stride: .8 });
  p.feet = p.feet.map(f => { const lift = y - f.y; return { x: f.x, y: stepY(f.x) - lift * 1.8 }; });
  p.hip.y = Math.min(p.hip.y, Math.max(...p.feet.map(f => f.y)) - 70 * s);
  return p;
}
const standOn = (x, o = {}) => stand(x, { ...o, y: stepY(x) });

function cast(t) {
  const o = {}, hx = heroX(t), fx = friendX(t);
  // ── héroe
  const look0 = standOn(276, { t, tilt: -.45, lean: -.04 });
  const glance = standOn(276, { t, tilt: .25 });
  const up = climber(hx, hx * 1.0, { lean: .2, tilt: -.15 });
  const cheerP = cheer(610, { t, y: stepY(610) });
  cheerP.arms = [{ ang: Math.PI - .4 + Math.sin(t * 6) * .1, bend: .1 }, { ang: Math.PI - .2 - Math.sin(t * 6) * .1, bend: .1 }];
  const turnP = standOn(610, { t, dir: -1, tilt: .1 });
  const lookDown = standOn(606, { t, dir: -1, tilt: .75, lean: .12 });
  const downW = climber(hx, 2000 - hx, { dir: -1, lean: .05, tilt: .5 });
  const kn = kneel(392, { dir: -1, y: stepY(392), lean: .4, tilt: .5 });
  kn.feet = [{ x: 356, y: stepY(392) }, { x: 440, y: stepY(440) - 2 }];
  const hand = { x: 326, y: FLOOR - 196 };
  const knOffer = { ...kn, lean: .62, tilt: .35, arms: [{ target: hand }, { ang: .3, bend: .3 }] };
  const riseP = standOn(394, { t, dir: -1, tilt: .3, lean: -.15 });
  const upT = climber(hx, hx, { lean: .14, tilt: -.1 });
  const topP = standOn(650, { t, tilt: -.35 });
  o.hero = poseAt(t, [[0, look0], [.45, look0], [.75, glance], [.95, () => mix(glance, climber(hx, hx), smooth(prog(t, .95, 1.25)))], [1.25, () => up], [CUE.top - .1, () => up],
    [CUE.cheer, cheerP], [CUE.cheerEnd, cheerP], [CUE.turn + .1, turnP], [CUE.look, lookDown], [CUE.down, lookDown], [CUE.down + .3, () => downW], [CUE.kneel - .3, () => downW],
    [CUE.kneel, kn], [CUE.offer + .3, knOffer], [CUE.rise, knOffer], [CUE.climb - .1, riseP], [CUE.climb + .3, () => upT], [CUE.arrive - .1, () => upT], [CUE.arrive + .3, topP], [D, topP]]);
  if (t > CUE.offer && t < CUE.climb + .1) o.hero.arms = [{ target: hand }, o.hero.arms[1]];
  // ── amigo (abajo, en gris)
  const sitP = sit(182, { ground: true, dir: 1, lean: .62, tilt: .7 });
  sitP.feet = [{ x: 239, y: FLOOR }, { x: 231, y: FLOOR }];
  const sh0 = shoulderOf(sitP);
  sitP.arms = [{ target: { x: 229, y: FLOOR - 52 } }, { target: { x: 223, y: FLOOR - 48 } }];
  sitP.hip.y += Math.sin(t * 2) * 1;
  const peek = { ...sitP, lean: .28, tilt: -.55 };
  const hope = { ...sitP, lean: .2, tilt: -.6, arms: [{ target: { x: 240, y: FLOOR - 120 } }, { target: { x: 223, y: FLOOR - 48 } }] };
  const fStand = stand(282, { t, tilt: -.5, lean: .05 });
  fStand.arms = [{ target: hand }, { ang: .1, bend: .3 }];
  const fWalk = walk(fx, fx, { lean: .1, tilt: -.4 });
  const fUp = climber(fx, fx, { lean: .2, tilt: -.25 });
  const fTop = standOn(594, { t, tilt: -.35 });
  o.friend = poseAt(t, [[0, sitP], [CUE.cheer + .2, sitP], [CUE.cheer + .6, peek], [CUE.cheerEnd, peek], [CUE.cheerEnd + .5, sitP], [CUE.fLook, sitP], [CUE.fLook + .4, hope],
    [CUE.fUp, hope], [CUE.fUp + .5, () => fWalk], [CUE.grip - .3, fStand], [CUE.climb, fStand], [CUE.climb + .3, () => fUp], [CUE.arrive - .1, () => fUp], [CUE.arrive + .3, fTop], [D, fTop]]);
  // tomados de la mano al subir
  if (t > CUE.grip - .15 && t < CUE.arrive + .2) {
    const hs = shoulderOf(o.hero), fs = shoulderOf(o.friend);
    const hp = t < CUE.climb ? hand : holdPoint(fs, ARM, hs, ARM);
    o.friend.arms = [{ target: hp }, o.friend.arms[1]];
    o.hero.arms = t < CUE.climb ? [{ target: hp }, o.hero.arms[1]] : [o.hero.arms[0], { target: hp, elbowBack: true }];
  }
  // final: brazos arriba juntos, mano en la espalda
  const w = together(t);
  if (w > 0) {
    const hs = shoulderOf(o.hero), fs = shoulderOf(o.friend);
    const hold = { x: (hs.x + fs.x) / 2, y: hs.y - 70 - 10 * Math.sin(t * 3) };
    const ha = E.solve(o.hero).arms.map(a => a[2]), fa = E.solve(o.friend).arms.map(a => a[2]);
    o.hero.arms = [{ target: E.lerpP(ha[0], { x: hs.x + 40, y: hs.y - 66 }, w) }, { target: E.lerpP(ha[1], hold, w) }];
    o.friend.arms = [{ target: E.lerpP(fa[0], hold, w) }, { target: E.lerpP(fa[1], { x: fs.x - 30, y: fs.y + 60 }, w) }];
  }
  o.hx = hx; o.fx = fx;
  return o;
}

function stairs(t, refl) {
  for (let i = 0; i < N; i++) {
    const x0 = SX + i * SW, x1 = i === N - 1 ? TOPX : x0 + SW;
    const l1 = smooth(prog(t, litAt[i], litAt[i] + .3)), l2 = smooth(prog(t, litAt2[i], litAt2[i] + .3));
    const lit = .1 + .32 * l1 + .2 * l2 + .05 * smooth(prog(t, CUE.top, CUE.top + 1));
    const rows = (i + 1) * 2;
    for (let r = 0; r < rows; r++) {
      const off = r % 2 ? 12 : 0, y = FLOOR - (r + 1) * 22;
      for (let x = x0 - off; x < x1; x += 25) {
        const xa = Math.max(x, x0), xb = Math.min(x + 25, x1);
        if (xb - xa > 2) brick(xa, y, xb - xa, 22, lit * (1 - .25 * r / rows));
      }
    }
    if (!refl && (l1 > 0 || l2 > 0)) { // borde del escalón brillante
      const yT = FLOOR - SH * (i + 1);
      ctx.save(); ctx.shadowColor = 'rgba(255,255,255,.9)'; ctx.shadowBlur = 16 * Math.max(l1, l2);
      ctx.fillStyle = `rgba(255,255,255,${.75 * Math.max(l1, l2)})`; ctx.fillRect(x0, yT - 2, x1 - x0, 3); ctx.restore();
      ring((x0 + x1) / 2, yT, t, litAt[i] + .02, { r: 46, flat: .25, life: .6 });
      ring((x0 + x1) / 2, yT, t, litAt2[i] + .02, { r: 46, flat: .25, life: .6, color: '255,90,80' });
    }
  }
}

const camKeys = {
  zoom: [[0, 2.15], [CUE.start, 2.0], [3.5, 1.85], [CUE.top, 1.9], [CUE.cheer + .3, 2.05], [CUE.cheerEnd, 1.9], [CUE.look + .2, 1.45], [CUE.down + .6, 1.5], [CUE.offer, 1.9], [CUE.grip, 2.15], [CUE.climb + .5, 1.8], [CUE.arrive, 1.7], [CUE.win + 1, 1.85], [D, 1.6]],
  x: [[0, 240], [CUE.start, 262], [3.5, 420], [CUE.top, 560], [CUE.cheerEnd, 580], [CUE.look + .2, 425], [CUE.down + .6, 410], [CUE.offer, 340], [CUE.grip, 320], [CUE.climb + .5, 420], [CUE.arrive, 590], [D, 590]],
  y: [[0, FLOOR - 165], [CUE.start, FLOOR - 170], [3.5, FLOOR - 270], [CUE.top, FLOOR - 390], [CUE.cheerEnd, FLOOR - 400], [CUE.look + .2, FLOOR - 280], [CUE.down + .6, FLOOR - 250],
    [CUE.offer, FLOOR - 170], [CUE.grip, FLOOR - 170], [CUE.climb + .5, FLOOR - 250], [CUE.arrive, FLOOR - 400], [D, FLOOR - 420]],
};

window.SCENE = {
  id: '12-extiende-la-mano', title: 'Al llegar arriba, *extiende la mano*', duration: D, cue: CUE,
  sky: t => .7 * sunK(t),
  spot: t => ({ x: keyed([[0, 240], [CUE.top, 520], [CUE.down, 420], [CUE.grip, 320], [CUE.arrive, 560]], t), r: 380 }),
  beam: t => ({ x: lerp(250, 620, sunK(t)), a: .05 + .03 * sunK(t), w: 160 }),
  flashes: [CUE.top + .05, CUE.grip + .02],
  blackouts: [],
  camera: t => ({
    zoom: keyed(camKeys.zoom, t), x: keyed(camKeys.x, t), y: keyed(camKeys.y, t),
    shake: .45 * pulse(t, CUE.top + .05, .4) + .2 * pulse(t, CUE.grip, .3) + .15 * pulse(t, .05, .4),
  }),
  backdrop(t) {
    const k = sunK(t), y = lerp(FLOOR - 300, FLOOR - 560, easeOut(k));
    if (k > 0) { sun(660, y, 54 + 10 * together(t), k); rays(660, y, t, k * (.7 + .3 * together(t)), '255,60,50', 18, 1000); }
  },
  world(t, refl) {
    const c = cast(t);
    stairs(t, refl);
    // el amigo, abajo, se ilumina al subir
    const fl = smooth(prog(t, CUE.grip, CUE.arrive + .5));
    const fs = mixStyle(STYLE.gray, STYLE.hero, fl);
    figure(c.friend, fs);
    figure(c.hero, STYLE.hero);
    if (!refl) {
      // chispa roja al tomarse de la mano
      const hp = { x: 326, y: FLOOR - 196 };
      const g = bump(t, CUE.grip - .1, CUE.grip + 1.2);
      if (g > 0) { glowCircle(hp.x, hp.y, 70 * g, '255,60,50', .7 * g); }
      burst(hp.x, hp.y, t, CUE.grip, { color: '255,70,60', n: 30, speed: 220, size: 3.5, gravity: .5, life: 1.3, seed: 33 });
      ring(hp.x, hp.y, t, CUE.grip, { r: 120, color: '255,80,70', width: 6 });
      // la oscuridad abajo: el amigo solo (contraste)
      if (t > CUE.win) {
        const k = smooth(prog(t, CUE.win, CUE.win + .8));
        heart(622, FLOOR - SH * N - 300 - 12 * k + Math.sin(t * 3) * 3, 32 * E.backOut(k), '#ff3b36', k);
      }
    }
  },
  front(t) {
    burst(620, FLOOR - SH * N - 220, t, CUE.win, { color: '255,70,55', n: 40, speed: 330, gravity: .5, size: 4, life: 1.8, seed: 12 });
    burst(620, FLOOR - SH * N - 220, t, CUE.win + .2, { color: '255,255,255', n: 26, speed: 260, gravity: .5, size: 3, life: 1.5, seed: 15 });
  },
  events() {
    const notes = [72, 74, 76, 77, 79, 81, 83];
    const ev = E.footsteps(D, t => { const c = cast(t); return [c.hero.phi !== undefined ? { phi: c.hero.phi, size: 1, moving: true } : null, c.friend.phi !== undefined ? { phi: c.friend.phi, size: 1, moving: true } : null]; });
    return ev.concat([
      { t: 0, type: 'whoosh', vol: .7 }, { t: .1, type: 'boom', vol: .5 },
      ...litAt.filter(x => x < 90).map((x, i) => ({ t: x, type: 'bell', note: notes[i], vol: .55 })),
      ...litAt2.filter(x => x < 90).map((x, i) => ({ t: x, type: 'bell', note: notes[i] + 12, vol: .45 })),
      { t: CUE.top, type: 'impact' }, { t: CUE.top + .05, type: 'swell', dur: 1.6 }, { t: CUE.cheer, type: 'cheer', dur: 1.4, vol: .5 },
      { t: CUE.look, type: 'heartbeat', vol: .6 }, { t: CUE.look + .8, type: 'heartbeat', vol: .45 },
      { t: CUE.offer + .2, type: 'whoosh', vol: .4 }, { t: CUE.grip, type: 'chime' }, { t: CUE.grip, type: 'sparkle' },
      { t: CUE.arrive, type: 'riser', dur: .6 }, { t: CUE.win, type: 'cheer', dur: 2.2, vol: .8 },
    ]);
  },
  music: {
    sections: [
      { t: .1, dur: CUE.top - .1, style: 'build', chords: ['C', 'G', 'Am', 'F'], chordLen: 1.3 },
      { t: CUE.top, dur: CUE.cheerEnd - CUE.top, style: 'epic', chords: ['F', 'G'], chordLen: .85 },
      { t: CUE.look - .2, dur: CUE.grip - CUE.look + .2, style: 'sad', chords: ['Am', 'F', 'Am', 'E'], chordLen: 1.1 },
      { t: CUE.grip, dur: D - CUE.grip, style: 'hope', chords: ['F', 'C', 'G', 'C'], chordLen: 1.4 },
    ],
    stingers: [{ t: CUE.top, type: 'bells' }, { t: CUE.win, type: 'bells' }],
    duck: [[CUE.cheerEnd + .1, CUE.look - .2]],
  },
};
})();
