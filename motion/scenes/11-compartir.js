// 11 — COMPARTIR: bajo la tormenta, uno pasa de largo… se detiene, vuelve y cubre al anciano con su paraguas rojo.
// Caminan juntos bajo el mismo paraguas; la lluvia para y sale el sol.
(() => {
const { FLOOR, ctx, clamp, lerp, prog, smooth, easeOut, easeIn, easeInOut, keyed, bump, pulse, rng, walk, stand, sit, mix, poseAt,
  shoulderOf, figure, mixStyle, STYLE, sun, glowCircle, burst, ring, rays, heart, cloud, umbrella, distance } = E;
const D = 19;
const CUE = { pass: 2.2, stop: 3.1, doubt: 3.5, turn: 4.2, back: 4.45, cover: 5.2, lookUp: 5.9, offer: 6.3, take: 6.8, rise: 7.0, upT: 7.9, together: 8.3,
  go: 8.7, ease: 12.0, sun: 12.8, stopT: 13.6, close: 14.1, closed: 14.7, warm: 15.2 };
const BENCH = 420;
const SPEED = [[0, 160], [2.6, 160], [3.05, 0], [CUE.back - .05, 0], [CUE.back + .15, -95], [CUE.cover - .35, -95], [CUE.cover - .05, 0]];
const hDist = distance(SPEED, D);
const GO = [[0, 0], [CUE.go, 0], [CUE.go + .5, 78], [CUE.stopT - .5, 78], [CUE.stopT, 0], [D, 0]];
const gDist = distance(GO, D);
const rainA = t => 1 - smooth(prog(t, CUE.ease, CUE.sun + .8));
const sunK = t => smooth(prog(t, CUE.sun - .3, CUE.sun + 1.6));
const OLD = t => mixStyle(STYLE.gray, STYLE.hero, .45 * smooth(prog(t, CUE.sun, CUE.warm + 1)));

function cast(t) {
  const o = {};
  const hx = 150 + hDist(t), ox = BENCH, g = gDist(t);
  // ── héroe
  const abs = Math.abs;
  const walkR = walk(hx, hDist(t), { lean: .1, tilt: .1 });
  const stopP = stand(hx, { t, tilt: .05, lean: .02 });
  const doubtP = stand(hx, { t, tilt: .25, lean: .06 }); // cabeza baja: duda
  const turnP = stand(hx, { t, dir: -1, tilt: .3 });
  const backW = walk(hx, 400 - hDist(t), { dir: -1, lean: .08, tilt: .2 });
  const coverP = stand(hx, { t, dir: -1, tilt: .5, lean: .2 });
  const offerP = { ...coverP, lean: .32, tilt: .55 };
  const pullP = stand(hx - 10, { t, dir: -1, tilt: .35, lean: -.05 });
  const HT = ox + 20 + 50;
  const togetherP = stand(HT, { t, dir: 1, tilt: .1 });
  const gw = walk(HT + g, g * 1.2, { stride: .7, lean: .05, tilt: .05 });
  const endP = stand(HT + gDist(D), { t, tilt: -.3 });
  o.hero = poseAt(t, [[0, () => walkR], [2.85, () => walkR], [CUE.stop, stopP], [CUE.doubt, stopP], [CUE.doubt + .4, doubtP], [CUE.turn - .2, doubtP], [CUE.turn + .15, turnP],
    [CUE.back + .05, () => backW], [CUE.cover - .3, () => backW], [CUE.cover, coverP], [CUE.offer, coverP], [CUE.offer + .3, offerP], [CUE.take, offerP], [CUE.upT, pullP],
    [CUE.together - .1, pullP], [CUE.together + .3, togetherP], [CUE.go, togetherP], [CUE.go + .35, () => gw], [CUE.stopT - .15, () => gw], [CUE.stopT + .3, endP], [D, endP]]);
  // ── anciano
  const shiver = Math.sin(t * 43) * 1.3 * (1 - smooth(prog(t, CUE.cover, CUE.cover + .8)));
  const sitP = sit(ox, { dir: 1, lean: .5 + Math.sin(t * 2.1) * .02, tilt: .55 });
  sitP.hip.x += shiver;
  const hug = shoulderOf(sitP);
  sitP.arms = [{ target: { x: hug.x + 18, y: hug.y + 30 } }, { target: { x: hug.x + 22, y: hug.y + 24 } }];
  const look = { ...sitP, lean: .32, tilt: -.25 };
  const reach = { ...look, lean: .38, tilt: -.2 };
  const oldUp = stand(ox + 20, { t, tilt: .1, lean: .28, s: .95 });
  const oldW = walk(ox + 20 + g, g * 1.2, { s: .95, stride: .6, lean: .26, stand: 90 });
  const oldEnd = stand(ox + 20 + gDist(D), { t, tilt: -.38, lean: .16, s: .95 });
  o.old = poseAt(t, [[0, sitP], [CUE.lookUp, sitP], [CUE.lookUp + .4, look], [CUE.offer + .2, look], [CUE.take, reach], [CUE.rise, reach],
    [CUE.upT, oldUp], [CUE.go, oldUp], [CUE.go + .35, () => oldW], [CUE.stopT - .15, () => oldW], [CUE.stopT + .3, oldEnd], [D, oldEnd]]);
  // brazos de ayuda: mano tendida, se toman de la mano
  const hSh = shoulderOf(o.hero), oSh = shoulderOf(o.old);
  if (t > CUE.offer && t < CUE.together + .2) {
    const k = smooth(prog(t, CUE.offer, CUE.take)), meet = E.holdPoint(hSh, E.ARM, oSh, E.ARM * .95);
    const hand0 = { x: hSh.x - 30, y: hSh.y + 60 };
    o.hero.arms = [o.hero.arms[0], { target: E.lerpP(hand0, meet, k) }];
    if (t > CUE.take - .2) o.old.arms = [{ target: meet }, o.old.arms[1]];
  }
  // ── paraguas: lo sostiene la mano cercana del héroe
  let rot = 0, hand;
  if (t < CUE.cover - .3) { hand = { x: hSh.x + (hx > 0 ? 6 : 0) * 1, y: hSh.y + 6 }; rot = 0; }
  const coverHand = { x: hSh.x - 66, y: FLOOR - 162 };
  const walkHand = { x: hSh.x - 22, y: hSh.y - 18 };
  const keys = [[0, { x: hSh.x + 8 * (o.hero.dir || 1), y: hSh.y + 4 }, .04], [CUE.cover - .3, { x: hSh.x - 8, y: hSh.y + 4 }, -.05], [CUE.cover + .1, coverHand, -.3], [CUE.take, coverHand, -.3],
    [CUE.upT, { x: lerp(hSh.x, oSh.x, .5), y: hSh.y - 10 }, .1], [CUE.together + .3, walkHand, -.14], [CUE.close, walkHand, -.14]];
  let i = 0; while (i < keys.length - 1 && t > keys[i + 1][0]) i++;
  const k0 = keys[i], k1 = keys[Math.min(i + 1, keys.length - 1)], kp = k1 === k0 ? 1 : easeInOut(prog(t, k0[0], k1[0]));
  hand = E.lerpP(k0[1], k1[1], kp); rot = lerp(k0[2], k1[2], kp);
  const open = 1 - smooth(prog(t, CUE.close, CUE.closed));
  if (t > CUE.close) {
    const down = smooth(prog(t, CUE.closed - .1, CUE.closed + .5));
    hand = E.lerpP(hand, { x: hSh.x + 16, y: hSh.y + 70 }, down); rot = lerp(rot, Math.PI - .12, down);
  }
  // la mano que sostiene el paraguas
  o.hero.arms = [{ target: hand }, o.hero.arms[1]];
  if (t > CUE.together && t < CUE.close + .2) { // el anciano se toma del brazo del héroe
    const el = { x: lerp(hSh.x, hand.x, .5) - 4, y: lerp(hSh.y, hand.y, .5) + 26 };
    o.old.arms = [{ target: el }, o.old.arms[1]];
  }
  if (t > CUE.warm) { // mano en la espalda del héroe
    const k = smooth(prog(t, CUE.warm, CUE.warm + .6));
    o.old.arms = [{ target: E.lerpP(E.solve(o.old).arms[0][2], { x: hSh.x - 12, y: hSh.y + 30 }, k) }, o.old.arms[1]];
  }
  const L = 80;
  o.umb = { top: { x: hand.x + Math.sin(rot) * L, y: hand.y - Math.cos(rot) * L }, rot, open, sc: 1.18 };
  o.hx = hx; o.g = g;
  return o;
}

// lluvia con sombra del paraguas (las gotas no pasan debajo del paraguas)
const DROPS = (() => { const g = rng(17); return Array.from({ length: 420 }, () => ({ x: g(), sp: 1100 + g() * 500, ph: g(), len: 18 + g() * 14 })); })();
function myRain(t, cx, a, umb) {
  if (a <= 0) return;
  const x0 = cx - 330, w = 660, y0 = FLOOR - 640, H = 640;
  const sw = umb.open > .3 ? 66 * umb.sc * umb.open : 0, ux = umb.top.x, uy = umb.top.y;
  ctx.strokeStyle = `rgba(205,210,220,${.42 * a})`; ctx.lineWidth = 1.6; ctx.beginPath();
  const n = Math.round(DROPS.length * a);
  for (let i = 0; i < n; i++) {
    const d = DROPS[i], x = x0 + ((d.x * w - t * 60) % w + w) % w;
    let y = y0 + ((t * d.sp / H + d.ph) % 1) * H;
    let yEnd = y + d.len;
    if (Math.abs(x - ux) < sw && yEnd > uy - 12) { if (y > uy - 12) continue; yEnd = uy - 12; }
    ctx.moveTo(x, y); ctx.lineTo(x - 4, yEnd);
  }
  ctx.stroke();
  // salpicaduras en el piso y sobre la tela
  const g = rng(5);
  for (let i = 0; i < 60 * a; i++) {
    const x = x0 + g() * w, ph = (t * 3.2 + g()) % 1;
    if (Math.abs(x - ux) < sw * .9) continue;
    ctx.strokeStyle = `rgba(220,225,235,${.45 * (1 - ph) * a})`; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.ellipse(x, FLOOR + 2, 2 + ph * 11, 1 + ph * 2.6, 0, 0, Math.PI * 2); ctx.stroke();
  }
  if (sw > 0) for (let i = 0; i < 9; i++) {
    const ph = (t * 4 + i * .37) % 1, xx = ux + (g() - .5) * sw * 1.7;
    ctx.fillStyle = `rgba(255,220,220,${.6 * (1 - ph) * a})`;
    ctx.beginPath(); ctx.arc(xx, uy - 14 * umb.open - ph * 10, 1.6 + ph * 2, 0, Math.PI * 2); ctx.fill();
  }
}
// banca del parque y farol
function bench(x) {
  ctx.fillStyle = '#5b5b5b';
  ctx.fillRect(x - 70, FLOOR - 54, 140, 9); ctx.fillRect(x - 70, FLOOR - 100, 8, 50);
  ctx.fillRect(x - 70, FLOOR - 92, 10, 26);
  ctx.fillStyle = '#4a4a4a'; ctx.fillRect(x - 62, FLOOR - 46, 7, 46); ctx.fillRect(x + 56, FLOOR - 46, 7, 46);
  ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(x - 70, FLOOR - 54, 140, 2);
}
function lamp(x, t, refl) {
  ctx.fillStyle = '#3c3c3c'; ctx.fillRect(x - 4, FLOOR - 330, 8, 330); ctx.fillRect(x - 4, FLOOR - 330, 34, 6);
  const fl = .9 + .1 * Math.sin(t * 31) * Math.sin(t * 7);
  if (!refl) {
    const g = ctx.createLinearGradient(0, FLOOR - 320, 0, FLOOR);
    g.addColorStop(0, `rgba(255,214,150,${.22 * fl})`); g.addColorStop(1, 'rgba(255,214,150,0)');
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(x + 20, FLOOR - 322); ctx.lineTo(x + 34, FLOOR - 322); ctx.lineTo(x + 110, FLOOR); ctx.lineTo(x - 56, FLOOR); ctx.fill(); ctx.restore();
  }
  glowCircle(x + 27, FLOOR - 320, 40, '255,214,150', .7 * fl);
}

const camX = t => keyed([[0, 270], [2.6, 500], [CUE.doubt, 520], [CUE.cover, 490], [CUE.offer, 485], [CUE.upT, 480], [CUE.go, 480], [CUE.stopT, 760], [D, 790]], t);
window.SCENE = {
  id: '11-compartir', title: 'Compartir *no cuesta* nada', duration: D, cue: CUE,
  scroll: t => camX(t) - 260,
  sky: t => .55 * sunK(t),
  spot: t => ({ x: camX(t), r: 400 }),
  beam: t => ({ x: lerp(camX(t), 820, sunK(t)), a: .04 + .04 * sunK(t), w: 170 }),
  flashes: [.12, CUE.doubt + .1, CUE.sun + .5],
  camera: t => ({
    zoom: keyed([[0, 1.75], [2.6, 1.85], [CUE.doubt, 2.25], [CUE.turn + .3, 2.05], [CUE.cover, 2.3], [CUE.take, 2.2], [CUE.upT, 2.0], [CUE.go + 1, 1.85], [CUE.sun, 1.7], [CUE.warm, 1.75], [D, 1.6]], t),
    x: camX(t),
    y: keyed([[0, FLOOR - 190], [CUE.doubt, FLOOR - 170], [CUE.cover, FLOOR - 150], [CUE.upT, FLOOR - 175], [CUE.sun, FLOOR - 225], [D, FLOOR - 245]], t),
    shake: .45 * pulse(t, .14, .5) + .3 * pulse(t, CUE.doubt + .12, .4),
  }),
  backdrop(t) {
    const s = sunK(t);
    if (s > 0) { sun(905, lerp(FLOOR - 120, FLOOR - 330, s), 50, s); rays(905, lerp(FLOOR - 120, FLOOR - 330, s), t, s, '255,60,50', 16, 900); }
    const part = smooth(prog(t, CUE.ease, CUE.sun + 1.5));
    for (const [x, y, sc, v] of [[180, FLOOR - 520, 1.6, -1], [460, FLOOR - 560, 2, -1], [740, FLOOR - 520, 1.8, 1], [980, FLOOR - 560, 2.1, 1], [1180, FLOOR - 500, 1.6, 1]])
      cloud(x + t * 6 * v + part * 380 * v, y - part * 60, sc, '#1e1e22', 1 - part * .7);
  },
  world(t, refl) {
    const c = cast(t);
    lamp(BENCH - 140, t, refl);
    bench(BENCH);
    figure(c.old, OLD(t));
    figure(c.hero, STYLE.hero);
    umbrella(c.umb.top.x, c.umb.top.y, c.umb.sc, c.umb.rot, c.umb.open, '#ff3b36');
    if (!refl) {
      // gotas sobre el héroe cuando queda bajo la lluvia
      const wet = smooth(prog(t, CUE.cover, CUE.cover + .3)) * (1 - smooth(prog(t, CUE.upT, CUE.together)));
      if (wet > 0) { const hd = E.headOf(c.hero); for (let i = 0; i < 5; i++) { const ph = (t * 3 + i * .23) % 1; ctx.fillStyle = `rgba(220,225,235,${.7 * (1 - ph) * wet})`; ctx.beginPath(); ctx.arc(hd.x + Math.cos(i * 2.1) * (20 + ph * 14), hd.y - 18 - ph * 10 + i, 2, 0, Math.PI * 2); ctx.fill(); } }
      if (t > CUE.warm + .4) {
        const k = smooth(prog(t, CUE.warm + .4, CUE.warm + 1.2)), hs = E.headOf(c.hero), os = E.headOf(c.old);
        heart((hs.x + os.x) / 2, Math.min(hs.y, os.y) - 70 - 10 * k + Math.sin(t * 3) * 3, 30 * E.backOut(k), '#ff3b36', k);
      }
    }
  },
  front(t) {
    const c = cast(t);
    myRain(t, camX(t), rainA(t), c.umb);
    burst(c.umb.top.x, c.umb.top.y + 10, t, CUE.closed - .1, { color: '220,225,235', n: 26, speed: 200, size: 2.6, life: .9, gravity: 1.5, seed: 6 });
  },
  events() {
    const ev = E.footsteps(D, t => {
      const c = cast(t);
      return [c.hero.phi !== undefined ? { phi: c.hero.phi, size: 1, moving: true, vol: 1.2 } : null, c.old.phi !== undefined ? { phi: c.old.phi, size: .9, moving: true } : null];
    });
    return ev.concat([
      { t: 0, type: 'rain', dur: 12.6, vol: 1 }, { t: 0, type: 'rain', dur: 12.6, vol: .6 }, { t: .1, type: 'boom', vol: 1 }, { t: .12, type: 'crack', vol: .8 },
      { t: CUE.doubt + .1, type: 'rumble', dur: 2, vol: .8 }, { t: CUE.doubt + .4, type: 'heartbeat', vol: .5 }, { t: CUE.turn - .1, type: 'heartbeat', vol: .6 },
      { t: CUE.turn + .1, type: 'whoosh', vol: .4 }, { t: CUE.cover, type: 'whoosh', vol: .6 }, { t: CUE.cover + .15, type: 'thud', vol: .3 },
      { t: CUE.take, type: 'chime', vol: .6 }, { t: CUE.ease, type: 'wind', dur: 2, vol: .3 },
      { t: CUE.sun + .4, type: 'swell', dur: 2 }, { t: CUE.sun + .5, type: 'sparkle' }, { t: CUE.close, type: 'slide', dur: .4 }, { t: CUE.closed, type: 'pop', vol: .6 },
    ]);
  },
  music: {
    sections: [
      { t: .3, dur: CUE.doubt - .3, style: 'sad', chords: ['Am', 'F'], chordLen: 1.6 },
      { t: CUE.doubt, dur: CUE.cover - CUE.doubt, style: 'tension', chords: ['Am'], chordLen: 1.7 },
      { t: CUE.cover, dur: CUE.sun - CUE.cover, style: 'tender', chords: ['Am', 'F', 'C', 'G'], chordLen: 1.9 },
      { t: CUE.sun, dur: D - CUE.sun, style: 'hope', chords: ['F', 'C', 'G', 'C'], chordLen: 1.6 },
    ],
    stingers: [{ t: CUE.sun + .5, type: 'bells' }],
    duck: [[CUE.doubt + .2, CUE.turn + .1]],
  },
};
})();
