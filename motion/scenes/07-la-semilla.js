// 07 — LO BUENO TOMA TIEMPO: dos plantan una semilla. El impaciente escarba, y jala el brote para que crezca:
// se rompe y se marchita. El paciente riega; pasan los días y su árbol crece enorme y florece rojo.
// Se sienta a la sombra, invita al impaciente… y le regala una semilla nueva.
(() => {
const { FLOOR, clamp, lerp, prog, smooth, easeOut, easeIn, easeInOut, bump, pulse, keyed, poseAt, walk, stand, sit, kneel, crouch, figure, STYLE, shoulderOf, ctx } = E;
const D = 20;
const FR = x => (Math.round(x * 30) + .5) / 30;
const XL = 200, PL = 262, XR = 520, PR = 440;   // impaciente y su hoyo; paciente y su hoyo (árbol)
const C = { seed: .7, pat: .95, up: 1.2, can: 1.4, pour1: [1.7, 2.6], dig: [2.55, 3.3], sprout: 3.55, pour2: [4.0, 4.8], grab: 4.45, pull: 4.75, snap: 5.15, fall: 5.3,
  mad: 5.75, sulk: 6.5, lapse: 6.6, lapseEnd: 11.0, bloom: 10.6, toTree: 12.4, sitR: 13.3, beck: 13.8, lookL: 14.7, standL: 15.15, walkL: 15.6, sitL: 16.9, give: 17.6, take: 18.25 };
const rgbv = c => c[0] === '#' ? [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16)) : c.match(/[\d.]+/g).slice(0, 3).map(Number);
const mixStyle = (a, b, p) => ({ near: E.mixCol(rgbv(a.near), rgbv(b.near), p), far: E.mixCol(rgbv(a.far), rgbv(b.far), p), glow: lerp(a.glow, b.glow, p), glowColor: a.glowColor });
const LSTYLE = mixStyle(STYLE.hero, STYLE.gray, .35);

const lapseP = t => prog(t, C.lapse, C.lapseEnd);
const growth = t => t < C.sprout ? 0 : t < C.lapse ? .04 * smooth(prog(t, C.sprout, C.sprout + .5)) : lerp(.04, 1, easeInOut(lapseP(t)));
const bloomA = t => smooth(prog(t, C.bloom, C.bloom + 1.2));

// ── utilería ──
function wateringCan(x, y, tilt, dir) {
  ctx.save(); ctx.translate(x, y); ctx.scale(dir, 1); ctx.rotate(tilt);
  ctx.fillStyle = '#9fa4a8'; ctx.beginPath(); ctx.moveTo(-14, -16); ctx.lineTo(14, -16); ctx.lineTo(17, 12); ctx.lineTo(-17, 12); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fillRect(-12, -14, 5, 24);
  ctx.strokeStyle = '#9fa4a8'; ctx.lineWidth = 4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(14, 4); ctx.lineTo(34, -14); ctx.stroke();
  ctx.beginPath(); ctx.arc(-4, -18, 10, Math.PI, 0); ctx.stroke();
  ctx.restore();
  return { x: x + dir * (Math.cos(tilt) * 34 + Math.sin(tilt) * 14), y: y + Math.sin(tilt) * 34 - Math.cos(tilt) * 14 };
}
function pour(t, spout, target, a) {
  if (a <= 0) return;
  for (let i = 0; i < 18; i++) {
    const ph = (t * 2.4 + i / 18) % 1, x = lerp(spout.x, target.x + Math.sin(i * 7) * 6, ph), y = lerp(spout.y, target.y, ph) - 18 * Math.sin(Math.PI * ph) * (1 - ph);
    ctx.fillStyle = `rgba(230,235,240,${.75 * a})`; ctx.beginPath(); ctx.arc(x, y, 2.2, 0, Math.PI * 2); ctx.fill();
  }
}
function mound(x, wet = 0) {
  ctx.fillStyle = E.mixCol([70, 62, 54], [42, 36, 32], wet); ctx.beginPath(); ctx.ellipse(x, FLOOR, 30, 9, 0, Math.PI, 0); ctx.fill();
}
function seedDot(x, y, a = 1) { E.glowCircle(x, y, 18, '255,50,40', .5 * a); ctx.fillStyle = `rgba(255,59,54,${a})`; ctx.beginPath(); ctx.ellipse(x, y, 4.5, 3.2, .4, 0, Math.PI * 2); ctx.fill(); }
// brote del impaciente: crece, lo estiran, se rompe y se marchita
function badSprout(t) {
  if (t < C.sprout) return;
  const p = smooth(prog(t, C.sprout, C.sprout + .5));
  const stretch = t < C.snap ? 1 + .9 * easeIn(prog(t, C.pull, C.snap)) : 1;
  const wilt = smooth(prog(t, C.snap, C.snap + 1.0)), dry = smooth(prog(t, C.snap, C.snap + 2.5));
  const col = E.mixCol([215, 240, 205], [110, 96, 80], dry);
  const h = 38 * p * stretch * (1 - .35 * wilt);
  ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.lineCap = 'round';
  const tipX = PL + 26 * wilt, tipY = FLOOR - 8 - h + 18 * wilt;
  ctx.beginPath(); ctx.moveTo(PL, FLOOR - 6); ctx.quadraticCurveTo(PL, FLOOR - 6 - h, tipX, tipY); ctx.stroke();
  ctx.fillStyle = col;
  for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(tipX + s * 8 * p, tipY + 4 + 8 * wilt, 9 * p, 3.6 * p, s * -.5 + wilt * 1.3 * s, 0, Math.PI * 2); ctx.fill(); }
  if (t > C.snap) { // pedacito roto en la mano/piso
    const k = prog(t, C.snap, C.snap + .6);
    ctx.save(); ctx.globalAlpha = 1 - smooth(prog(t, C.snap + 1.5, C.snap + 2.5)); ctx.strokeStyle = col; ctx.beginPath(); ctx.moveTo(PL - 30 - 20 * k, FLOOR - 70 + 66 * easeIn(k)); ctx.lineTo(PL - 22 - 20 * k, FLOOR - 76 + 66 * easeIn(k)); ctx.stroke(); ctx.restore();
  }
}
// pétalos rojos que caen del árbol
function petals(t) {
  const a = bloomA(t); if (a <= 0) return;
  const r = E.rng(77);
  for (let i = 0; i < 46; i++) {
    const x0 = PR - 190 + r() * 380, sp = 30 + r() * 30, ph = r() * 20, life = (t * sp / 330 + ph) % 1;
    const y = FLOOR - 330 + life * 330, x = x0 + Math.sin(t * 1.6 + i) * 20 - life * 40;
    ctx.save(); ctx.globalAlpha = a * .85 * Math.sin(Math.PI * life); ctx.translate(x, y); ctx.rotate(t * 3 + i);
    ctx.fillStyle = '#ff4a40'; ctx.shadowColor = '#ff3b36'; ctx.shadowBlur = 8; ctx.beginPath(); ctx.ellipse(0, 0, 4.5, 2.4, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
}

// ── paciente (derecha) ──
function poseR(t) {
  const st = stand(XR, { dir: -1, lean: .04, tilt: .1, t });
  const kn = kneel(XR - 8, { dir: -1, lean: .55, tilt: .45 }); kn.arms = [{ target: { x: PR + 6, y: FLOOR - 10 } }, { target: { x: PR + 16, y: FLOOR - 12 } }];
  const pat = { ...kn, arms: [{ target: { x: PR + 6, y: FLOOR - 18 } }, kn.arms[1]] };
  const water = stand(XR, { dir: -1, lean: .12, tilt: .35, t }); water.arms = [{ target: { x: XR - 46, y: FLOOR - 112 } }, { ang: .1, bend: .3 }];
  const rest = stand(XR, { dir: -1, lean: .02, tilt: .05, t }); rest.arms = [{ ang: .15, bend: .3 }, { ang: -.05, bend: .3 }];
  const sitG = sit(XR + 18, { dir: -1, ground: true, lean: .05, tilt: .05 }); sitG.arms = [{ ang: .7, bend: .6 }, { ang: -.4, bend: .2 }];
  if (t < C.lapse) return poseAt(t, [[0, st], [.3, kn], [C.seed + .1, kn], [C.pat, pat], [C.pat + .15, kn], [C.up, rest], [C.pour1[0] - .2, water], [C.pour1[1], water], [C.pour1[1] + .3, rest],
    [C.pour2[0] - .2, water], [C.pour2[1], water], [C.pour2[1] + .3, rest], [5.6, rest], [6.2, sitG]]);
  if (t < C.lapseEnd + .3) { // lapso: poses entrecortadas (regar / sentarse)
    const k = Math.floor((t - C.lapse) / .45) % 3;
    return k === 0 ? water : k === 1 ? sitG : rest;
  }
  // camina bajo el árbol, se sienta contra el tronco, invita al otro con la mano
  const xs = PR - 22;
  const w = walk(lerp(XR, xs, smooth(prog(t, C.toTree, C.sitR - .3))), 90 * t, { dir: -1, lean: .08 });
  const under = sit(xs, { dir: -1, ground: true, lean: -.12, tilt: -.05 }); under.arms = [{ ang: .5, bend: .5 }, { ang: -.3, bend: .2 }];
  const sh = shoulderOf(under);
  const beck = (ph) => ({ ...under, tilt: .0, arms: [{ target: { x: sh.x - 30 - 8 * Math.sin(ph), y: sh.y - 52 + 10 * Math.sin(ph) }, elbowUp: false }, under.arms[1]] });
  const give = { ...under, lean: .12, tilt: .25, arms: [{ target: { x: 356, y: FLOOR - 72 } }, under.arms[1]] };
  return poseAt(t, [[C.lapseEnd + .3, rest], [C.toTree, rest], [C.toTree + .2, () => w], [C.sitR - .3, () => w], [C.sitR + .2, under], [C.beck, under],
    [C.beck + .3, () => beck(t * 12)], [C.walkL + .3, () => beck(t * 12)], [C.walkL + .8, under], [C.give, under], [C.give + .45, give], [C.take + .1, give], [C.take + .6, under]]);
}
const canPos = (t, sl) => {
  if (t < C.can) return { x: XR + 34, y: FLOOR - 16, tilt: 0 };
  const pouring = (t > C.pour1[0] && t < C.pour1[1]) || (t > C.pour2[0] && t < C.pour2[1]) || (t > C.lapse && t < C.lapseEnd + .3 && Math.floor((t - C.lapse) / .45) % 3 === 0);
  if (t > C.toTree) return { x: XR + 34, y: FLOOR - 16, tilt: 0 };
  if (t > 5.6 && !pouring && t < C.lapse + 10) { if (t < C.lapse || Math.floor((t - C.lapse) / .45) % 3 !== 0) return { x: XR + 34, y: FLOOR - 16, tilt: 0 }; }
  const h = E.hand(sl, 0);
  return { x: h.x - 4, y: h.y + 14, tilt: pouring ? .55 : .05, pouring };
};

// ── impaciente (izquierda) ──
function poseL(t) {
  const st = stand(XL, { lean: .04, t });
  const kn = kneel(XL + 8, { lean: .55, tilt: .45 }); kn.arms = [{ target: { x: PL - 6, y: FLOOR - 10 } }, { target: { x: PL - 16, y: FLOOR - 12 } }];
  const pat = { ...kn, arms: [{ target: { x: PL - 6, y: FLOOR - 18 } }, kn.arms[1]] };
  const sh0 = shoulderOf(st);
  const tap = (ph) => { const p = stand(XL, { lean: .0, tilt: lerp(.35, -.05, (Math.sin(ph * .4) + 1) / 2), t }); p.arms = [{ target: { x: sh0.x + 16, y: sh0.y + 34 } }, { target: { x: sh0.x + 10, y: sh0.y + 30 } }]; p.feet[0].y -= 7 * Math.max(0, Math.sin(ph)); return p; };
  const dig = (ph) => { const p = crouch(XL + 30, { amt: 1, tilt: .5 }); p.arms = [{ target: { x: PL - 4 + 6 * Math.sin(ph), y: FLOOR - 4 - 8 * Math.abs(Math.sin(ph)) } }, { target: { x: PL - 12, y: FLOOR - 6 } }]; return p; };
  const grab = crouch(XL + 30, { amt: .95, tilt: .55 }); grab.arms = [{ target: { x: PL - 2, y: FLOOR - 40 } }, { target: { x: PL - 6, y: FLOOR - 36 } }];
  const tug = crouch(XL + 20, { amt: .7, tilt: .2 }); tug.lean = -.25; tug.arms = [{ target: { x: PL - 4, y: FLOOR - 74 } }, { target: { x: PL - 8, y: FLOOR - 70 } }];
  const fell = sit(XL + 4, { ground: true, lean: -.25, tilt: -.2 }); fell.arms = [{ ang: Math.PI - .7, bend: .2 }, { ang: -.9, bend: .2 }];
  const madUp = stand(XL, { lean: -.05, tilt: -.3, t }); madUp.arms = [{ ang: Math.PI - .5, bend: .3 }, { ang: Math.PI - .3, bend: .3 }];
  const madDown = stand(XL, { lean: .2, tilt: .4, t }); madDown.arms = [{ ang: -.35, bend: .1 }, { ang: -.45, bend: .1 }];
  const sulk = sit(XL - 30, { dir: -1, ground: true, lean: .35, tilt: .55 }); sulk.arms = [{ ang: 1.2, bend: 1.2 }, { ang: 1.1, bend: 1.3 }];
  if (t < C.lapse) return poseAt(t, [[0, st], [.3, kn], [C.seed + .1, kn], [C.pat, pat], [C.pat + .15, kn], [C.up, () => tap(t * 14)], [C.dig[0] - .15, () => tap(t * 14)], [C.dig[0] + .15, () => dig(t * 16)],
    [C.dig[1], () => dig(t * 16)], [C.dig[1] + .25, () => tap(t * 14)], [C.grab - .3, () => tap(t * 14)], [C.grab, grab], [C.pull, grab], [C.snap, tug], [C.fall, fell], [C.mad - .15, fell],
    [C.mad + .1, madUp], [C.mad + .35, madDown], [C.mad + .5, madUp], [C.mad + .7, madDown], [C.sulk, sulk]]);
  // enfurruñado durante el lapso; luego voltea, se levanta, camina y se sienta junto al otro
  const look = { ...sulk, dir: 1, hip: { ...sulk.hip }, feet: sulk.feet.map(f => ({ x: 2 * sulk.hip.x - f.x, y: f.y })), lean: .1, tilt: -.1 };
  const up = stand(XL - 30, { lean: .05, tilt: -.05, t });
  const xEnd = 282;
  const w = walk(lerp(XL - 30, xEnd + 6, smooth(prog(t, C.walkL, C.sitL - .2))), 100 * t, { lean: .08, tilt: -.05 });
  const sitN = sit(xEnd, { dir: 1, ground: true, lean: .06, tilt: -.05 }); sitN.arms = [{ ang: .6, bend: .5 }, { ang: .4, bend: .5 }];
  const take = { ...sitN, tilt: .6, lean: .04, arms: [{ target: { x: 350, y: FLOOR - 70 } }, { target: { x: 344, y: FLOOR - 64 } }] };
  return poseAt(t, [[C.lapse, sulk], [C.lookL, sulk], [C.lookL + .25, look], [C.standL, look], [C.walkL - .1, up], [C.walkL + .15, () => w], [C.sitL - .25, () => w], [C.sitL + .3, sitN],
    [C.take - .3, sitN], [C.take, take]]);
}

const sunAt = t => {
  const th = .55 + lapseP(t) * Math.PI * 6 + (t > C.lapseEnd ? (t - C.lapseEnd) * .05 : 0);
  return { x: 360 + Math.cos(th) * 270, y: FLOOR - 60 - Math.sin(th) * 360, h: Math.sin(th) };
};
const SHOTS = [
  [0, { x: 355, y: FLOOR - 150, z: 1.95 }, { x: 350, y: FLOOR - 155, z: 1.75 }],
  [FR(1.4), { x: 470, y: FLOOR - 120, z: 2.45 }, { x: 465, y: FLOOR - 120, z: 2.55 }],
  [FR(2.55), { x: 235, y: FLOOR - 115, z: 2.45 }, { x: 240, y: FLOOR - 112, z: 2.55 }],
  [FR(3.4), { x: 350, y: FLOOR - 140, z: 1.85 }, { x: 350, y: FLOOR - 140, z: 1.95 }],
  [FR(4.4), { x: 245, y: FLOOR - 90, z: 2.75 }, { x: 250, y: FLOOR - 95, z: 2.9 }],
  [FR(5.6), { x: 225, y: FLOOR - 150, z: 2.1 }, { x: 225, y: FLOOR - 150, z: 2.15 }],
  [FR(6.6), { x: 400, y: FLOOR - 140, z: 2.0 }, { x: 345, y: FLOOR - 300, z: 1.38 }],
  [FR(11.0), { x: PR, y: FLOOR - 330, z: 1.85 }, { x: PR - 10, y: FLOOR - 300, z: 1.95 }],
  [FR(12.3), { x: 400, y: FLOOR - 180, z: 1.85 }, { x: 405, y: FLOOR - 175, z: 2.0 }],
  [FR(14.6), { x: 205, y: FLOOR - 120, z: 2.45 }, { x: 205, y: FLOOR - 125, z: 2.5 }],
  [FR(15.55), { x: 300, y: FLOOR - 180, z: 1.8 }, { x: 340, y: FLOOR - 175, z: 1.95 }],
  [FR(17.45), { x: 360, y: FLOOR - 120, z: 2.5 }, { x: 358, y: FLOOR - 128, z: 2.6 }],
  [FR(18.7), { x: 390, y: FLOOR - 200, z: 2.1 }, { x: 370, y: FLOOR - 270, z: 1.42 }],
];
function shotCam(t) {
  let i = SHOTS.length - 1; while (i > 0 && t < SHOTS[i][0]) i--;
  const [t0, a, b] = SHOTS[i], t1 = i + 1 < SHOTS.length ? SHOTS[i + 1][0] : D;
  const p = smooth(prog(t, t0, t1));
  return { x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p), zoom: lerp(a.z, b.z, p), shake: pulse(t, C.fall, .2) * .5 + pulse(t, C.snap, .1) * .3 };
}

window.SCENE = {
  id: '07-la-semilla', title: 'Lo bueno *toma tiempo*', duration: D, cue: C,
  sky: t => clamp(sunAt(t).h * .9 + .2),
  spot: t => ({ x: lerp(350, 400, smooth(prog(t, C.lapse, C.lapseEnd))), r: 420 }),
  beam: t => ({ x: 380, a: .04 + .04 * bloomA(t), w: 200 }),
  flashes: [C.bloom + .2],
  blackouts: [FR(6.6) - 1 / 60],
  camera: shotCam,
  backdrop(t) {
    const s = sunAt(t), lp = E.bump(t, C.lapse - .1, C.lapseEnd + .1);
    if (lp > 0) for (let i = 12; i >= 1; i--) { const q = sunAt(t - i * .02); E.glowCircle(q.x, q.y, 30, '255,50,40', .3 * lp * (1 - i / 13)); }
    E.sun(s.x, s.y, 34);
  },
  world(t, refl) {
    // árbol del paciente
    const g = growth(t);
    if (t >= C.lapse) E.tree(PR, FLOOR, g, 5, 1.08, bloomA(t), '255,60,50');
    mound(PL, 0); mound(PR, t > C.pour1[0] ? 1 : 0);
    if (t < C.sprout + .2) {
      for (const [x, k] of [[PL, -1], [PR, 1]]) {
        const p = easeIn(prog(t, .45, C.seed)); if (t < .45) continue;
        if (t < C.seed + .3) seedDot(x, lerp(FLOOR - 40, FLOOR - 8, p), 1 - smooth(prog(t, C.seed + .1, C.seed + .3)));
      }
    }
    if (t >= C.sprout && t < C.lapse) E.sprout(PR, FLOOR - 6, smooth(prog(t, C.sprout, C.sprout + .5)), 1);
    if (t >= C.lapse && g < .12) E.sprout(PR, FLOOR - 6, 1 + g * 6, 1);
    badSprout(t);
    // personajes
    const l = poseL(t), lSl = figure(l, LSTYLE);
    const r = poseR(t), rSl = figure(r, STYLE.hero);
    const cp = canPos(t, rSl), spout = wateringCan(cp.x, cp.y, cp.tilt, -1);
    if (cp.pouring && !refl) pour(t, spout, { x: PR, y: FLOOR - 8 }, 1);
    // semilla nueva: del paciente al impaciente
    if (t > C.give && !refl) {
      const k = smooth(prog(t, C.give + .2, C.take));
      const hr = E.hand(rSl, 0), hl = E.hand(lSl, 0);
      const x = lerp(hr.x, hl.x, k), y = lerp(hr.y, hl.y, k) - 4;
      seedDot(x, y, 1); E.glowCircle(x, y, 60, '255,60,45', .25 + .15 * Math.sin(t * 4));
      E.ring(x, y, t, C.take, { r: 90, life: .9, width: 4, color: '255,80,60' });
      E.burst(x, y, t, C.take, { n: 22, speed: 120, life: 1.2, size: 2.2, gravity: -.2, seed: 6 });
    }
    if (refl) return;
    petals(t);
    // tierra que salta al escarbar
    for (const q of [2.75, 3.0, 3.15]) E.burst(PL, FLOOR - 4, t, q, { n: 10, color: '120,105,90', speed: 140, life: .6, size: 3, seed: q * 10 });
    E.burst(PL, FLOOR - 60, t, C.snap, { n: 14, color: '210,235,200', speed: 160, life: .6, size: 2, seed: 4 });
    E.burst(PR, FLOOR - 300, t, C.bloom + .2, { n: 60, speed: 340, life: 1.6, size: 3.5, gravity: .5, seed: 11 });
    E.ring(PR, FLOOR - 300, t, C.bloom + .2, { r: 300, life: 1.1, width: 8, color: '255,80,60' });
  },
  events() {
    const ev = E.footsteps(D, t => [t > C.toTree && t < C.sitR ? { phi: poseR(t).phi || 0 } : null, t > C.walkL && t < C.sitL ? { phi: poseL(t).phi || 0 } : null]);
    const taps = []; for (let t = C.up + .1; t < C.dig[0]; t += 2 * Math.PI / 14) taps.push({ t, type: 'tick', vol: .4 });
    return ev.concat(taps, [
      { t: 0.0, type: 'whoosh', dur: .5, vol: .8 }, { t: C.seed, type: 'pop', vol: .9 }, { t: C.pat, type: 'thud', vol: .3 },
      { t: C.pour1[0], type: 'rain', dur: C.pour1[1] - C.pour1[0], vol: .35 }, { t: C.pour2[0], type: 'rain', dur: C.pour2[1] - C.pour2[0], vol: .35 },
      { t: 2.75, type: 'scuff', vol: .6 }, { t: 3.0, type: 'scuff', vol: .6 }, { t: C.sprout, type: 'sparkle', vol: .5 },
      { t: C.pull - .1, type: 'slide', dur: .4, vol: .5 }, { t: C.snap, type: 'snap' }, { t: C.fall, type: 'thud', vol: .8 },
      { t: C.mad + .35, type: 'thud', vol: .4 }, { t: C.mad + .7, type: 'thud', vol: .4 },
      { t: C.lapse, type: 'clock', dur: C.lapseEnd - C.lapse - .2 }, { t: C.lapse, type: 'riser', dur: C.bloom - C.lapse },
      { t: C.bloom + .2, type: 'impact' }, { t: C.bloom + .25, type: 'sparkle' }, { t: C.bloom + .3, type: 'wind', dur: 4, vol: .4 },
      { t: C.beck + .3, type: 'chime', vol: .5 }, { t: C.take, type: 'sparkle' }, { t: C.take, type: 'swell', dur: 1.5, vol: .6 },
    ]);
  },
  music: {
    sections: [
      { t: .2, dur: C.snap - .2, style: 'upbeat', chords: ['C', 'G', 'Am', 'F'], chordLen: 1.07, bpm: 112, vol: .7 },
      { t: C.snap + .1, dur: C.lapse - C.snap - .1, style: 'sad', chords: ['Am', 'F'], chordLen: .9 },
      { t: C.lapse, dur: C.lapseEnd - C.lapse - .4, style: 'build', chords: ['F', 'G', 'Am', 'C'], chordLen: .8 },
      { t: C.bloom + .2, dur: D - C.bloom - .2, style: 'hope', chords: ['F', 'C', 'G', 'C'], chordLen: 1.6 },
    ],
    stingers: [{ t: C.bloom + .2, type: 'bells' }],
    duck: [[C.snap, C.snap + .5]],
  },
};
})();
