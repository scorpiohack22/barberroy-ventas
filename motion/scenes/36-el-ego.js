// 36 — EL EGO: a uno se le infla la cabeza (roja, como globo) y se eleva sobre los demás; los mira desde arriba.
// Todos se van. Sube solo... la cabeza revienta, cae. Uno de los que se fueron regresa y le tiende la mano.
(() => {
const { FLOOR, clamp, lerp, prog, smooth, easeOut, easeIn, easeInOut, keyed, figure, STYLE, mix, mixStyle, stand, walk, kneel, lie, sit, glowCircle, ctx } = E;
const D = 18.5, EX = 360;
const C = { puff: .25, grow: .6, lift: 2.7, snub: 4.3, wave: 3.7, leave: 5.0, gone: 7.6, alone: 8.2, wobble: 9.4, pop: 10.4, ground: 10.85, raise: 12.0,
  back: 12.4, arrive: 14.0, offer: 14.2, take: 14.9, up: 15.7, hug: 16.4 };
const OTHERS = [{ x: 218, s: .96, dir: 1, out: -1 }, { x: 272, s: .78, dir: 1, out: -1 }, { x: 452, s: .92, dir: -1, out: 1 }, { x: 506, s: 1, dir: -1, out: 1 }];
const HELPER = 1; // el que regresa (desde la izquierda)
const R = t => t < C.pop ? lerp(23, 92, easeInOut(prog(t, C.grow, C.wobble))) + 4 * Math.sin(t * 9) * prog(t, C.wobble - .5, C.pop) : 23;
const rise = t => t < C.pop ? 330 * easeInOut(prog(t, C.lift, C.pop)) + 12 * Math.sin(t * 2.2) * prog(t, C.lift, C.lift + 1) : 0;
const fallY = t => { // altura durante la caída
  const h0 = rise(C.pop - .001); const p = prog(t, C.pop + .05, C.ground); return h0 * (1 - easeIn(p));
};
const red = t => smooth(prog(t, C.grow + .3, C.lift + .5));

function egoPose(t) {
  if (t < C.pop + .05) {
    const h = rise(t), y = FLOOR - h;
    const air = smooth(prog(t, C.lift - .2, C.lift + .4));
    const st = stand(EX, { t, tilt: .0 });
    const puff = { ...stand(EX, { t, lean: -.12, tilt: -.25 }), arms: [{ target: { x: EX - 6, y: FLOOR - 118 } }, { target: { x: EX + 2, y: FLOOR - 122 } }] };
    const proud = { ...stand(EX, { t, lean: -.08, tilt: -.35 }), arms: [{ target: { x: EX - 8, y: FLOOR - 98 }, elbowUp: false }, { target: { x: EX + 4, y: FLOOR - 104 } }] };
    let p = E.poseAt(t, [[0, st], [C.puff, st], [C.puff + .4, puff], [C.grow + 1.2, proud]]);
    // en el aire: piernas colgando, mira abajo con desprecio, luego le da la espalda
    const hang = { hip: { x: EX, y: y - 96 }, s: 1, dir: 1, lean: -.05, tilt: .35, feet: [{ x: EX + 4, y: y - 4 }, { x: EX - 10, y: y - 2 }],
      arms: [{ target: { x: EX + 14, y: y - 106 } }, { target: { x: EX + 22, y: y - 110 } }] };
    const snub = { ...hang, dir: -1, tilt: -.45, lean: -.12 };
    const lonely = { ...hang, tilt: .55, lean: .1, arms: [{ ang: .4, bend: .2 }, { ang: .25, bend: .2 }], feet: [{ x: EX + 8, y: y }, { x: EX - 8, y: y + 2 }] };
    const look2 = { ...lonely, dir: -1 };
    const panic = { ...hang, tilt: -.6, lean: -.15, arms: [{ ang: 2.5, bend: .3 }, { ang: 2.2, bend: .3 }], feet: [{ x: EX + 20, y: y - 10 }, { x: EX - 20, y: y + 4 }] };
    if (air > 0) {
      const aerial = E.poseAt(t, [[C.lift, hang], [C.snub - .2, hang], [C.snub + .2, snub], [C.alone - .2, snub], [C.alone + .3, lonely], [C.alone + .9, lonely], [C.alone + 1.2, look2], [C.wobble + .3, look2], [C.wobble + .6, lonely], [C.pop - .25, lonely], [C.pop, panic]]);
      p = mix({ ...p, hip: { ...p.hip, y: p.hip.y - h }, feet: p.feet.map(f => ({ x: f.x, y: f.y - h })) }, aerial, air);
    }
    return p;
  }
  // cae: brazos arriba, luego en el piso
  const y = FLOOR - fallY(t);
  const falling = { hip: { x: EX, y: y - 96 }, s: 1, dir: 1, lean: -.2, tilt: -.5, feet: [{ x: EX + 24, y: y - 20 }, { x: EX - 14, y }], arms: [{ ang: 2.8, bend: .1 }, { ang: 2.5, bend: .2 }] };
  const down = { ...lie(EX + 40, { dir: -1, tilt: .1 }), feet: [{ x: EX + 100, y: FLOOR }, { x: EX + 139, y: FLOOR - 9 }], arms: [{ ang: -1.5, bend: .1 }, { ang: 1.4, bend: .2 }] };
  const raiseHead = { ...sit(EX + 30, { ground: true, dir: -1, tilt: .45, lean: .25 }), feet: [{ x: EX - 30, y: FLOOR }, { x: EX - 40, y: FLOOR }], arms: [{ target: { x: EX + 62, y: FLOOR - 2 } }, { target: { x: EX + 58, y: FLOOR - 2 } }] };
  const lookUp = { ...raiseHead, tilt: -.25, lean: .05 };
  const reachP = { ...raiseHead, tilt: -.3, lean: .1, arms: [{ target: { x: EX - 26, y: FLOOR - 92 } }, { target: { x: EX + 58, y: FLOOR - 2 } }] };
  const upP = q => ({ ...stand(EX + 18, { t: q, dir: -1, tilt: .45, lean: .12 }), arms: [{ target: { x: EX - 26, y: FLOOR - 104 } }, { ang: .1, bend: .3 }] });
  const hugP = q => ({ ...stand(EX + 8, { t: q, dir: -1, tilt: .35, lean: .14 }), arms: [{ target: { x: EX - 40, y: FLOOR - 160 } }, { target: { x: EX - 30, y: FLOOR - 150 } }] });
  return E.poseAt(t, [[C.pop + .05, falling], [C.ground - .06, falling], [C.ground + .05, down], [C.raise - .2, down], [C.raise + .4, raiseHead], [C.arrive - .4, raiseHead], [C.arrive, lookUp], [C.offer + .2, lookUp], [C.take, reachP], [C.up, upP], [C.hug - .1, upP], [C.hug + .4, hugP]]);
}
function otherPose(i, t) {
  const o = OTHERS[i];
  const look = smooth(prog(t, C.puff + .2, C.puff + .7)) * .7 + .3 * smooth(prog(t, C.lift, C.lift + 1));
  const base = q => ({ ...stand(o.x, { t: q + i * 1.3, dir: o.dir, s: o.s, tilt: lerp(.05, -.55 * (1 + .1 * i), look), lean: lerp(.04, -.06, look) }),
    arms: [{ ang: .1 + .05 * Math.sin(q * 2 + i), bend: .3 }, { ang: -.08, bend: .3 }] });
  let p = base(t);
  // saludan/llaman y él los ignora
  if (i === 2 || i === 1) {
    const w = E.bump(t, C.wave, C.snub + .3);
    if (w > 0) p.arms[0] = { ang: lerp(.1, 2.7 + .25 * Math.sin(t * 14), w), bend: .2 };
  }
  // se encogen de hombros y se van
  const lt = C.leave + i * .25 * (i % 2 ? 1 : 1.4);
  const shrug = E.bump(t, lt - .7, lt - .05);
  if (shrug > 0) { p.arms = [{ ang: lerp(.1, .9, shrug), bend: lerp(.3, 1.6, shrug) }, { ang: lerp(-.08, .7, shrug), bend: lerp(.3, 1.6, shrug) }]; p.tilt = lerp(p.tilt, .3, shrug); }
  if (t > lt) {
    const sp = keyed([[lt, 0], [lt + .4, 95], [D, 95]], t);
    const d = (t - lt) * 95 - 20 * (1 - prog(t, lt, lt + .4));
    const x = o.x + o.out * Math.max(0, d);
    const turnW = walk(x, Math.max(0, d), { dir: o.out, s: o.s, tilt: .1 });
    p = mix(p, turnW, smooth(prog(t, lt, lt + .2)));
  }
  return p;
}
const othersGone = t => t > C.gone;
// el que regresa
function helperPose(t) {
  const x0 = 70, x1 = EX - 74;
  const wx = lerp(x0, x1, smooth(prog(t, C.back, C.arrive)));
  const w = walk(wx, wx - x0, { dir: 1, s: .9, tilt: .15 });
  const offer = { ...stand(x1, { t, s: .9, tilt: .3, lean: .12 }), arms: [{ target: { x: x1 + 50, y: FLOOR - 90 } }, { ang: .1, bend: .3 }] };
  const pull = { ...stand(x1 - 6, { t, s: .9, tilt: .1, lean: -.15 }), arms: [{ target: { x: x1 + 44, y: FLOOR - 104 } }, { ang: -.2, bend: .3 }] };
  const hugP = { ...stand(x1 + 4, { t, s: .9, tilt: .1, lean: .1 }), arms: [{ target: { x: x1 + 54, y: FLOOR - 140 } }, { target: { x: x1 + 48, y: FLOOR - 134 } }] };
  return E.poseAt(t, [[C.back, w], [C.arrive, w], [C.offer + .2, offer], [C.take, offer], [C.up - .2, pull], [C.hug - .1, pull], [C.hug + .4, hugP]]);
}
function headCenter(sl, r) {
  const nk = { x: sl.sh.x + (sl.head.x - sl.sh.x) * .35, y: sl.sh.y + (sl.head.y - sl.sh.y) * .35 };
  const dx = (sl.head.x - sl.sh.x), dy = (sl.head.y - sl.sh.y), L = Math.hypot(dx, dy);
  return { x: nk.x + dx / L * r, y: nk.y + dy / L * r, dx, dy };
}
function balloonHead(sl, t, refl) {
  const r = R(t), rd = red(t);
  const c = headCenter(sl, r), dx = c.dx, dy = c.dy;
  const col = [Math.round(lerp(244, 255, rd)), Math.round(lerp(244, 59, rd)), Math.round(lerp(244, 54, rd))];
  if (!refl && rd > 0) glowCircle(c.x, c.y, r * 2.4, '255,40,30', .3 * rd);
  ctx.save(); ctx.shadowColor = `rgba(255,${Math.round(lerp(255, 40, rd))},${Math.round(lerp(255, 30, rd))},.6)`; ctx.shadowBlur = 30;
  const g = ctx.createRadialGradient(c.x - r * .38, c.y - r * .42, r * .08, c.x, c.y, r * 1.02);
  g.addColorStop(0, `rgb(${col.map(v => Math.round(v + (255 - v) * .7))})`); g.addColorStop(.5, `rgb(${col})`); g.addColorStop(1, `rgb(${col.map(v => Math.round(v * .55))})`);
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(c.x, c.y, r, r * 1.06, Math.atan2(dy, dx) + Math.PI / 2, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  // brillo de globo
  ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.ellipse(c.x - r * .38, c.y - r * .45, r * .16, r * .09, -.6, 0, Math.PI * 2); ctx.fill();
  // nariz arrogante (se ve hacia dónde mira)
  return c;
}

let popC = null;
const POP = () => popC || (popC = headCenter(E.solve(egoPose(C.pop - .01)), R(C.pop - .01)));
window.SCENE = {
  id: '36-el-ego', title: 'El ego *te deja solo*', duration: D, cue: C,
  sky: t => .25 * red(t) * (t < C.pop ? 1 : 0),
  spot: t => ({ x: keyed([[0, EX], [C.back, EX - 30]], t), r: keyed([[0, 420], [C.gone, 300], [C.pop, 260], [C.back, 400]], t) }),
  beam: t => ({ x: EX, a: keyed([[0, .05], [C.alone, .08], [C.pop, .03], [C.arrive, .06]], t), w: 160 }),
  flashes: [C.pop], blackouts: [C.ground + .02],
  camera: t => {
    const h = t < C.pop ? rise(t) : fallY(t);
    const follow = t < C.pop ? smooth(prog(t, C.lift, C.lift + 1.5)) : 1 - smooth(prog(t, C.pop + .05, C.ground));
    return {
      zoom: keyed([[0, 1.9], [C.grow + .8, 1.8], [C.lift, 1.55], [C.snub, 1.62], [C.leave + 1, 1.5], [C.alone, 1.42], [C.wobble, 1.6], [C.pop, 1.75], [C.pop + .2, 1.6], [C.ground + .2, 2.0], [C.raise + .4, 2.15], [C.arrive, 1.85], [C.up, 2.0], [C.hug + 1, 2.15], [D, 1.8]], t),
      x: keyed([[0, EX], [C.back, EX - 20], [C.arrive, EX - 30], [D, EX - 28]], t),
      y: FLOOR - 190 - h * .85 * follow + (t > C.pop ? keyed([[C.ground, 40], [C.raise + .4, 50], [C.arrive, 10], [D, -10]], t) : 0),
      shake: .5 * E.pulse(t, C.pop, .25) + .7 * E.pulse(t, C.ground, .3),
    };
  },
  world(t, refl) {
    // los demás
    OTHERS.forEach((o, i) => {
      if (i === HELPER && t > C.back) return;
      const p = otherPose(i, t);
      if (Math.abs(p.hip.x - o.x) < 420) figure(p, STYLE.gray);
    });
    if (t > C.back) {
      const hs = mixStyle(STYLE.gray, STYLE.hero, smooth(prog(t, C.offer, C.hug)));
      figure(helperPose(t), hs);
    }
    const ep = egoPose(t), air = t < C.pop && t > C.lift;
    const sl = figure(ep, STYLE.hero, { noShadow: air || (t > C.pop && t < C.ground) });
    if (t < C.pop) {
      const c = balloonHead(sl, t, refl);
      if (!refl) E.ring(c.x, c.y, t, C.puff + .3, { r: 50, life: .4, width: 3, color: '255,90,80' });
      // sombra en el piso que se aleja
      if (!refl && air) { ctx.save(); ctx.globalAlpha = clamp(1 - rise(t) / 400) * .6; ctx.translate(EX, FLOOR + 3); ctx.scale(1, .2); const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 50); g.addColorStop(0, 'rgba(0,0,0,.8)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(-50, -50, 100, 100); ctx.restore(); }
    }
    if (!refl) {
      const pc = POP();
      E.burst(pc.x, pc.y, t, C.pop, { n: 60, speed: 520, size: 5, color: '255,60,50', gravity: 1.2, life: 1.4 });
      E.burst(pc.x, pc.y, t, C.pop, { n: 24, speed: 300, size: 7, color: '255,120,100', gravity: 1.6, life: 1.1, seed: 5 });
      E.ring(pc.x, pc.y, t, C.pop, { r: 280, color: '255,80,60', width: 9, life: .7 });
      E.burst(EX, FLOOR - 4, t, C.ground, { n: 24, speed: 180, size: 3, color: '200,200,200', gravity: 1.2, life: .7 });
      E.ring(EX, FLOOR, t, C.ground, { r: 160, flat: .2, life: .5, width: 5 });
      // corazón entre los dos al final
      const ha = E.backOut(prog(t, C.hug + .3, C.hug + .9));
      if (ha > 0) { const bt = 1 + .08 * Math.sin(t * 6); E.heart(EX - 38, FLOOR - 270, 34 * ha * bt, '#ff3b36', clamp(ha), 30); glowCircle(EX - 38, FLOOR - 278, 80, '255,40,30', .2 * clamp(ha)); }
      E.burst(EX - 38, FLOOR - 275, t, C.hug + .3, { n: 22, speed: 160, size: 3, color: '255,80,60', gravity: .2, life: 1.2 });
    }
  },
  events() {
    const ev = E.footsteps(D, t => OTHERS.map((o, i) => {
      const lt = C.leave + i * .25 * (i % 2 ? 1 : 1.4);
      if (t < lt || (i === HELPER && t > C.back) || t > lt + 3) return null;
      return { phi: otherPose(i, t).phi ?? 0, size: o.s, vol: .6 };
    }).concat([t > C.back && t < C.arrive ? { phi: helperPose(t).phi ?? 0, size: .9 } : null]));
    return ev.concat([
      { t: .02, type: 'whoosh', vol: .6 }, { t: C.puff + .3, type: 'pop', vol: .5 }, { t: C.grow, type: 'riser', dur: C.lift - C.grow + .5, vol: .6 },
      { t: C.grow + .2, type: 'slide', dur: 1.8, vol: .25 }, { t: C.lift, type: 'whoosh', vol: .5 }, { t: C.wave, type: 'crowd', dur: 1.2, vol: .4 },
      { t: C.snub, type: 'whoosh', vol: .4 }, { t: C.alone, type: 'wind', dur: 2.2, vol: .6 },
      { t: C.wobble, type: 'buzz', dur: .9, vol: .25 }, { t: C.pop, type: 'pop', vol: 1.4 }, { t: C.pop + .01, type: 'boom', vol: .8 }, { t: C.pop + .05, type: 'whoosh', vol: .8, up: false },
      { t: C.ground, type: 'thud', vol: 1 }, { t: C.ground + .02, type: 'impact' },
      { t: C.ground + .5, type: 'heartbeat', vol: .7 }, { t: C.ground + 1.3, type: 'heartbeat', vol: .5 },
      { t: C.take, type: 'snap', vol: .4 }, { t: C.up - .2, type: 'whoosh', vol: .3 }, { t: C.hug + .3, type: 'sparkle' },
    ]);
  },
  music: {
    sections: [
      { t: .1, dur: C.leave - .1, style: 'upbeat', chords: ['C', 'G', 'Am', 'F'], chordLen: 1.0, bpm: 118 },
      { t: C.leave, dur: C.pop - C.leave, style: 'tension', chords: ['Am', 'F'], chordLen: 1.4 },
      { t: C.ground + .3, dur: C.back - C.ground, style: 'sad', chords: ['Am', 'F'], chordLen: 1.1 },
      { t: C.back, dur: D - C.back, style: 'hope', chords: ['F', 'C', 'G', 'C'], chordLen: 1.4 },
    ],
    stingers: [{ t: C.pop, type: 'impact' }, { t: C.hug + .3, type: 'bells' }],
    duck: [[C.pop - .5, C.ground + .3]],
  },
};
})();
