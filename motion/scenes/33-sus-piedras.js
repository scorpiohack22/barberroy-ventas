// 33 — SUS PIEDRAS: le lanzan piedras; él las atrapa y las pone bajo sus pies.
// Cada crítica lo eleva, hasta que ya no lo alcanzan y toca el sol.
(() => {
const { FLOOR, clamp, lerp, prog, smooth, easeOut, easeIn, easeInOut, keyed, figure, STYLE, mix, stand, crouch, glowCircle, ctx } = E;
const D = 17.5, HX = 360, STEP = 28;
const THROWERS = [{ x: 162, dir: 1 }, { x: 558, dir: -1 }, { x: 218, dir: 1 }, { x: 502, dir: -1 }];
// piedras: from = índice del lanzador
const ST = [];
ST.push({ from: 0, throwT: .25, fl: .62, kind: 'ground', gx: 312, pickT: 3.05, placeT: 3.45 });
ST.push({ from: 1, throwT: 1.2, fl: .62, kind: 'ground', gx: 410, pickT: 3.75, placeT: 4.15 });
[4.55, 5.3, 5.95, 6.5, 7.0, 7.45, 7.88, 8.28, 8.66, 9.02].forEach((tt, i) => ST.push({ from: (i + 2) % 4, throwT: tt, fl: .58, kind: 'catch' }));
ST.forEach(s => { if (s.kind === 'catch') { s.catchT = s.throwT + s.fl; s.placeT = s.catchT + .26; } });
const SHORT = { from: 1, throwT: 10.35, fl: 1.0, kind: 'short' };
const C = { look: 2.3, done: 9.9, short: SHORT.throwT, shortLand: SHORT.throwT + SHORT.fl, sunUp: 11.2, reach: 12.2, touch: 13.0 };
const placed = ST.filter(s => s.placeT).sort((a, b) => a.placeT - b.placeT);
placed.forEach((s, k) => s.k = k);
const H = t => { let h = 0; for (const s of placed) h += STEP * easeOut(prog(t, s.placeT, s.placeT + .16)); return h; };
const side = s => THROWERS[s.from].dir === 1 ? -1 : 1; // -1: viene de la izquierda
const rel = s => { const th = THROWERS[s.from]; return { x: th.x + th.dir * 44, y: FLOOR - 196 }; };
const catchPt = s => ({ x: HX + side(s) * 40, y: FLOOR - H(s.catchT) - 158 });
function stonePos(s, t) {
  const u = prog(t, s.throwT, s.throwT + s.fl), a = rel(s);
  let b, arc = 110;
  if (s.kind === 'ground') b = { x: s.gx, y: FLOOR - 12 };
  else if (s.kind === 'catch') b = catchPt(s);
  else { b = { x: HX + 50, y: FLOOR - 12 }; arc = 60; }
  const ue = s.kind === 'short' ? u : u;
  return { x: lerp(a.x, b.x, ue), y: lerp(a.y, b.y, ue) - Math.sin(Math.PI * ue) * arc, u };
}
// la piedra corta: sube poco, choca la torre y cae
function shortPos(t) {
  const s = SHORT, u = prog(t, s.throwT, s.throwT + .55), a = rel(s);
  if (t < s.throwT + .55) return { x: lerp(a.x, HX + 24, u), y: lerp(a.y, FLOOR - 170, u) - Math.sin(Math.PI * u) * 50 };
  const v = prog(t, s.throwT + .55, C.shortLand);
  return { x: lerp(HX + 24, HX + 70, v), y: lerp(FLOOR - 170, FLOOR - 12, easeIn(v)) };
}

// ── héroe ──
function heroPose(t) {
  const y = () => FLOOR - H(t);
  const idle = dir => () => ({ ...stand(HX, { t, y: y(), dir, tilt: .05 }), arms: [{ ang: .15, bend: .4 }, { ang: -.05, bend: .4 }] });
  const flinch = dir => () => { const yy = y(), p = crouch(HX, { amt: .35, dir, y: yy }); p.tilt = .5; p.lean = .35;
    const hd = E.headOf(p); p.arms = [{ target: { x: hd.x + dir * 18, y: hd.y - 14 }, elbowUp: true }, { target: { x: hd.x + dir * 6, y: hd.y - 20 }, elbowUp: true }]; return p; };
  const look = () => ({ ...stand(HX, { t, y: y(), dir: 1, tilt: .75, lean: .22 }), arms: [{ ang: .2, bend: .5 }, { ang: 0, bend: .4 }] });
  const pick = gx => () => { const d = gx < HX ? -1 : 1, p = crouch(HX, { amt: .95, dir: d, y: y() }); p.arms = [{ target: { x: gx, y: FLOOR - 16 } }, { ang: .5, bend: .4 }]; return p; };
  const place = d => () => { const p = crouch(HX, { amt: .7, dir: d, y: y() }); p.tilt = .5; p.arms = [{ target: { x: HX + d * 18, y: y() - 14 } }, { ang: .6, bend: .4 }]; return p; };
  const ready = s => () => { const d = side(s); return { ...stand(HX, { t, y: y(), dir: d, tilt: -.25, lean: -.02 }), arms: [{ ang: 2.0, bend: .2 }, { ang: 1.2, bend: .3 }] }; };
  const caught = s => () => { const d = side(s), c = catchPt(s), yy = y(); return { ...stand(HX, { t, y: yy, dir: d, tilt: -.15 }), arms: [{ target: { x: c.x, y: c.y + (FLOOR - H(s.catchT) - yy) * 0 } }, { ang: 1.0, bend: .4 }] }; };
  const tall = () => ({ ...stand(HX, { t, y: y(), dir: 1, tilt: -.25, lean: -.04 }), arms: [{ ang: .35, bend: .2 }, { ang: .2, bend: .3 }] });
  const reach = () => { const yy = y(); return { ...stand(HX, { t, y: yy, dir: 1, tilt: -.6, lean: -.1 }), arms: [{ target: { x: HX + 92, y: yy - 300 } }, { ang: .5, bend: .2 }] }; };
  const keys = [[0, idle(-1)]];
  const push = (tt, p) => { if (tt > keys[keys.length - 1][0] + .01) keys.push([tt, p]); };
  for (const s of ST.filter(s => s.kind === 'ground')) {
    const T = s.throwT + s.fl, d = side(s);
    push(T - .35, idle(d)); push(T - .12, flinch(d)); push(T + .35, flinch(d)); push(T + .65, idle(d));
  }
  push(C.look, idle(1)); push(C.look + .4, look); push(2.85, look);
  for (const s of ST.filter(s => s.kind === 'ground')) {
    const d = s.gx < HX ? -1 : 1;
    push(s.pickT, pick(s.gx)); push(s.pickT + .1, pick(s.gx)); push(s.placeT - .08, place(d)); push(s.placeT + .06, place(d)); push(s.placeT + .26, idle(d));
  }
  for (const s of ST.filter(s => s.kind === 'catch')) {
    push(s.catchT - .26, ready(s)); push(s.catchT, caught(s)); push(s.placeT - .06, place(side(s))); push(s.placeT + .04, place(side(s))); push(s.placeT + .2, idle(side(s)));
  }
  push(C.done + .3, tall); push(C.short + .5, tall); push(C.short + .8, () => ({ ...tall(), dir: 1, tilt: .55, lean: .15 }));
  push(C.shortLand + .3, () => ({ ...tall(), dir: 1, tilt: .55, lean: .15 })); push(C.sunUp + .4, tall); push(C.reach, tall); push(C.touch, reach);
  return E.poseAt(t, keys);
}
// lanzadores
function throwerPose(j, t) {
  const th = THROWERS[j], mine = ST.filter(s => s.from === j).concat(SHORT.from === j ? [SHORT] : []);
  const end = smooth(prog(t, C.shortLand + .3, C.sunUp + 1.2));
  const idle = { ...stand(th.x, { t: t + j, dir: th.dir, tilt: .02, lean: .12 }), arms: [{ ang: .5, bend: .9 }, { ang: -.1, bend: .4 }] };
  let p = idle;
  for (const s of mine) {
    const T = s.throwT;
    if (t > T - .45 && t < T + .7) {
      const wind = { ...idle, lean: -.12, tilt: -.1, arms: [{ ang: -2.3, bend: .3 }, { ang: .9, bend: .3 }] };
      const thr = { ...idle, lean: .3, tilt: .05, arms: [{ ang: 2.1, bend: .05 }, { ang: -.4, bend: .3 }] };
      p = E.poseAt(t, [[T - .45, idle], [T - .08, wind], [T + .06, thr], [T + .3, thr], [T + .7, idle]]);
    }
  }
  if (end > 0) {
    const up = { ...stand(th.x - th.dir * 14, { t: t + j, dir: th.dir, tilt: -.65, lean: -.12 }), arms: [{ ang: .05, bend: .1 }, { ang: -.05, bend: .1 }] };
    p = mix(p, up, end);
  }
  return p;
}
const holding = (j, t) => { // ¿tiene piedra lista en la mano?
  const nxt = ST.concat([SHORT]).filter(s => s.from === j && s.throwT + .02 > t).sort((a, b) => a.throwT - b.throwT)[0];
  return nxt && t > nxt.throwT - 1.6 && t < C.short + .05;
};

// ── dibujo ──
const ROCK = '#8d8780', ROCK_R = 19;
function tower(t, refl) {
  for (const s of placed) {
    const p = prog(t, s.placeT, s.placeT + .1); if (p <= 0) continue;
    const jx = Math.sin(s.k * 2.3) * 4, r = ROCK_R + (s.k < 3 ? 3 - s.k : 0);
    E.stone(HX + jx, FLOOR - 14 - STEP * s.k, r * lerp(.7, 1, p) * 1.15, 3 + s.k * 7, s.k % 2 ? '#948d85' : ROCK);
  }
}
window.SCENE = {
  id: '33-sus-piedras', title: 'Usa sus piedras *para subir*', duration: D, cue: C,
  sky: t => .8 * smooth(prog(t, C.sunUp, C.touch)),
  spot: t => ({ x: HX, r: lerp(330, 460, smooth(prog(t, C.done, C.touch))) }),
  beam: t => ({ x: HX, a: .05 + .05 * smooth(prog(t, C.sunUp, C.touch)), w: 150 }),
  flashes: [C.touch],
  blackouts: [],
  camera: t => {
    const h = H(t);
    return {
      zoom: keyed([[0, 1.75], [1.9, 1.6], [C.look, 1.7], [3.0, 2.0], [4.3, 1.6], [9.6, 1.42], [C.short, 1.45], [C.shortLand, 1.5], [C.sunUp, 1.45], [C.touch, 1.62], [14.2, 1.4], [D, 1.24]], t),
      x: keyed([[0, 360], [C.look, 360], [D, 360]], t),
      y: keyed([[0, FLOOR - 190], [C.look, FLOOR - 180], [3.0, FLOOR - 150], [4.3, FLOOR - 200]], t) * (1 - smooth(prog(t, 4.3, 9.6))) +
         smooth(prog(t, 4.3, 9.6)) * keyed([[4.3, FLOOR - 200 - h * .7], [9.6, FLOOR - 160 - h * .8], [C.sunUp, FLOOR - 360], [C.touch, FLOOR - 470], [14.2, FLOOR - 420], [D, FLOOR - 370]], t),
      shake: .3 * E.pulse(t, ST[0].throwT + ST[0].fl, .2) + .3 * E.pulse(t, ST[1].throwT + ST[1].fl, .2) + .2 * E.pulse(t, C.touch, .3),
    };
  },
  backdrop(t) {
    const p = easeOut(prog(t, C.sunUp, C.touch));
    if (p > 0) {
      const x = HX + 92, y = lerp(FLOOR + 60, FLOOR - STEP * 12 - 300, p);
      E.rays(x, y, t, smooth(prog(t, C.reach, C.touch + .6)), '255,70,50', 16, 900);
      E.sun(x, y, 46, 1);
    }
  },
  world(t, refl) {
    // lanzadores (atrás)
    THROWERS.forEach((th, j) => {
      const sl = figure(throwerPose(j, t), STYLE.gray);
      if (holding(j, t)) { const h = E.hand(sl, 0); E.stone(h.x, h.y, 13, j + 30, '#77716a'); }
    });
    tower(t, refl);
    // piedras del piso (antes de recogerlas)
    for (const s of ST.filter(s => s.kind === 'ground')) if (t > s.throwT + s.fl && t < s.pickT + .12) E.stone(s.gx, FLOOR - 13, 18, 50 + s.from, ROCK);
    const sl = figure(heroPose(t), STYLE.hero);
    // piedra en la mano del héroe
    for (const s of ST) {
      const from = s.kind === 'ground' ? s.pickT + .12 : s.catchT, to = s.placeT;
      if (t > from && t < to) { const h = E.hand(sl, 0); E.stone(h.x, h.y + 6, 17, 70 + s.from, ROCK); }
    }
    // piedras en el aire
    for (const s of ST) {
      if (t < s.throwT || t > s.throwT + s.fl) continue;
      const p = stonePos(s, t);
      if (!refl) for (let k = 1; k <= 3; k++) { const q = stonePos(s, t - k * .03); ctx.globalAlpha = .2 / k; E.stone(q.x, q.y, 16, 90 + s.from, ROCK); ctx.globalAlpha = 1; }
      E.stone(p.x, p.y, 16, 90 + s.from, ROCK);
    }
    if (t > SHORT.throwT && t < C.shortLand + 2.5) { const p = shortPos(t); E.stone(p.x, p.y, 16, 95, ROCK); }
    if (!refl) {
      for (const s of ST) {
        if (s.kind === 'ground') { E.burst(s.gx, FLOOR - 6, t, s.throwT + s.fl, { n: 14, speed: 150, size: 2.5, color: '190,185,180', life: .6 }); E.ring(s.gx, FLOOR, t, s.throwT + s.fl, { r: 70, flat: .25, life: .4 }); }
        else { const c = catchPt(s); E.ring(c.x, c.y, t, s.catchT, { r: 45, life: .3, width: 4 });
          E.burst(HX, FLOOR - STEP * s.k - 4, t, s.placeT, { n: 12, speed: 120, size: 2.5, color: '220,215,210', life: .5, gravity: .6 }); }
      }
      E.burst(HX + 70, FLOOR - 6, t, C.shortLand, { n: 10, speed: 110, size: 2.5, color: '190,185,180', life: .5 });
      // luz del sol sobre el héroe
      const hd = E.headOf(heroPose(t)), tc = smooth(prog(t, C.touch - .2, C.touch + .6));
      if (tc > 0) { glowCircle(HX + 64, FLOOR - H(t) - 278, 120, '255,60,50', .45 * tc); }
      E.burst(HX + 64, FLOOR - H(t) - 278, t, C.touch, { n: 40, speed: 300, size: 4, color: '255,90,70', gravity: .3, life: 1.5 });
      E.ring(HX + 64, FLOOR - H(t) - 278, t, C.touch, { r: 260, color: '255,80,60', width: 7, life: 1 });
    }
  },
  events() {
    const ev = [{ t: .02, type: 'whoosh', vol: .8 }, { t: .05, type: 'crowd', dur: 2.5, vol: .5 }];
    for (const s of ST) {
      ev.push({ t: s.throwT, type: 'whoosh', vol: .55, pan: side(s) * .6 });
      if (s.kind === 'ground') ev.push({ t: s.throwT + s.fl, type: 'thud', vol: .9 }, { t: s.throwT + s.fl, type: 'crack', vol: .5 });
      else ev.push({ t: s.catchT, type: 'snap', vol: .7 });
      ev.push({ t: s.placeT, type: 'thud', vol: .55 }, { t: s.placeT + .02, type: 'knock', vol: .4 });
    }
    ev.push({ t: SHORT.throwT, type: 'whoosh', vol: .5 }, { t: SHORT.throwT + .55, type: 'knock', vol: .6 }, { t: C.shortLand, type: 'thud', vol: .6 });
    ev.push({ t: C.sunUp, type: 'swell', dur: 2, vol: .8 }, { t: C.touch, type: 'boom', vol: .8 }, { t: C.touch + .05, type: 'sparkle' }, { t: 3.0, type: 'chime', vol: .6 });
    return ev;
  },
  music: {
    sections: [
      { t: .1, dur: 2.9, style: 'tension', chords: ['Am'], chordLen: 1.5 },
      { t: 3.0, dur: C.done - 3.0 + .3, style: 'build', chords: ['Am', 'F', 'C', 'G'], chordLen: .7 },
      { t: C.done + .3, dur: C.sunUp - C.done, style: 'tender', chords: ['F', 'C'], chordLen: .9 },
      { t: C.sunUp, dur: D - C.sunUp, style: 'epic', chords: ['F', 'C', 'G', 'Am'], chordLen: 1.3 },
    ],
    stingers: [{ t: C.touch, type: 'bells' }, { t: 3.45, type: 'impact', vol: .6 }],
    duck: [[2.4, 2.95]],
  },
};
})();
