// 15 — LAS PALABRAS DEJAN MARCAS: uno grita y de su boca salen dardos rojos que se clavan en el otro.
// Se arrepiente, se acerca y le quita los dardos uno a uno… pero donde estaban quedan marcas rojas que no se borran.
(() => {
const { FLOOR, ctx, clamp, lerp, prog, smooth, easeOut, easeIn, easeInOut, keyed, bump, pulse, rng, walk, stand, sit, kneel, crouch, mix, poseAt,
  shoulderOf, headOf, figure, mixStyle, STYLE, glowCircle, burst, ring, rays, heart } = E;
const D = 19;
const TX = 236, VX = 486;
const HITS = [.62, 1.42, 2.12, 2.72, 3.22];
const FLY = .32;
const CUE = { stop: 3.5, regret: 4.2, mouth: 4.6, approach: 5.2, kneel: 6.1, pulls: [6.7, 7.5, 8.25, 8.95, 9.6], drop: 10.4, reach: 10.9, turnAway: 11.6, sitDown: 12.4, marks: 12.0, alone: 13.5 };
// dónde se clava cada dardo: segmento del cuerpo y fracción
const SPOTS = [{ seg: 'torso', f: .72 }, { seg: 'arm0', f: .55 }, { seg: 'torso', f: .3 }, { seg: 'thigh', f: .5 }, { seg: 'arm1', f: .6 }];
const ORDER = [4, 1, 0, 2, 3]; // orden en que los quita
const hitsBy = t => HITS.filter(h => t >= h).length;

function bodyPoint(sl, spot) {
  const L = (a, b) => ({ x: lerp(a.x, b.x, spot.f), y: lerp(a.y, b.y, spot.f) });
  if (spot.seg === 'torso') return L(sl.hip, sl.sh);
  if (spot.seg === 'arm0') return L(sl.arms[0][0], sl.arms[0][1]);
  if (spot.seg === 'arm1') return L(sl.arms[1][0], sl.arms[1][1]);
  if (spot.seg === 'thigh') return L(sl.legs[0][0], sl.legs[0][1]);
  return sl.head;
}

function cast(t) {
  const o = {};
  // ── el que grita (gris): se echa atrás y escupe cada palabra con todo el cuerpo
  const shout = i => { const h = HITS[i] - FLY; return bump(t, h - .28, h + .22); };
  let thrust = 0, wind = 0;
  HITS.forEach((h, i) => { const s = h - FLY; wind = Math.max(wind, bump(t, s - .32, s - .02)); thrust = Math.max(thrust, bump(t, s - .06, s + .3)); });
  const ang = stand(TX, { t, lean: .08 - .22 * wind + .32 * thrust, tilt: -.25 * thrust + .1 * wind });
  ang.arms = [{ ang: lerp(.4, 1.75, thrust) - .5 * wind, bend: lerp(.9, .05, thrust) }, { ang: -.6 * wind - .2, bend: 1.2 }];
  ang.feet = [{ x: TX + 18, y: FLOOR }, { x: TX - 20, y: FLOOR }];
  const calm = stand(TX, { t, lean: .02, tilt: .1 });
  const shocked = stand(TX - 6, { t, lean: -.08, tilt: .35 });
  const hd = headOf(shocked);
  shocked.arms = [{ target: { x: hd.x + 14, y: hd.y + 8 } }, { ang: .2, bend: .4 }]; // mano a la boca
  const ax = keyed([[CUE.approach, TX], [CUE.kneel - .2, VX - 128]], t, easeInOut);
  const w = walk(ax, ax * 1.4, { lean: .12, tilt: .35, stride: .7 });
  const kn = kneel(VX - 128, { lean: .3, tilt: .25 });
  o.tormentor = poseAt(t, [[0, () => ang], [CUE.stop, () => ang], [CUE.stop + .4, calm], [CUE.regret, calm], [CUE.mouth, shocked], [CUE.approach - .1, shocked], [CUE.approach + .3, () => w], [CUE.kneel - .3, () => w], [CUE.kneel, kn], [D, kn]]);
  // ── la víctima (blanca): retrocede con cada golpe y se va encogiendo
  let rec = 0; HITS.forEach(h => { rec = Math.max(rec, bump(t, h, h + .4)); });
  const shrink = smooth(prog(hitsBy(t) / 5 + (t - (HITS[Math.max(0, hitsBy(t) - 1)])) * 0, 0, 1)) ;
  const am = lerp(0, .55, smooth(prog(t, HITS[0], HITS[4] + .5)));
  const v = crouch(VX, { dir: -1, amt: am, tilt: .45 + .2 * am });
  v.lean = lerp(.05, .55, am) - .38 * rec;
  v.hip.x += 10 * rec;
  const tremble = Math.sin(t * 38) * 1.2 * smooth(prog(t, HITS[4], HITS[4] + .5)) * (1 - smooth(prog(t, CUE.sitDown, CUE.sitDown + 1)));
  v.hip.x += tremble;
  // brazos: se cubre
  const vsh = shoulderOf(v), vhd = headOf(v);
  v.arms = am > .05 ? [{ target: { x: vhd.x - 16, y: vhd.y + 10 } }, { target: { x: vsh.x - 20, y: vsh.y + 30 } }] : [{ ang: .2, bend: .3 }, { ang: 0, bend: .3 }];
  // flinch en cada tirón
  let fl = 0; CUE.pulls.forEach(p => { fl = Math.max(fl, bump(t, p + .25, p + .6)); });
  v.lean -= .12 * fl;
  // se aparta y se sienta de espaldas
  const turned = stand(VX + 10, { t, dir: 1, tilt: .5, lean: .2 }); turned.arms = [{ ang: .05, bend: .1 }, { ang: 0, bend: .1 }];
  const sitP = sit(VX + 40, { ground: true, dir: 1, lean: .55, tilt: .85 });
  sitP.arms = [{ target: { x: VX + 92, y: FLOOR - 60 } }, { target: { x: VX + 86, y: FLOOR - 56 } }];
  sitP.hip.y += Math.sin(t * 2) * 1.2;
  o.victim = poseAt(t, [[0, () => v], [CUE.turnAway, () => v], [CUE.turnAway + .5, turned], [CUE.sitDown, turned], [CUE.sitDown + .9, sitP], [D, sitP]]);
  // ── manos del que se arrepiente: quita cada dardo, al final intenta tocar su hombro
  if (t > CUE.kneel) {
    const vsl = E.solve(o.victim);
    let target = null;
    CUE.pulls.forEach((p, k) => {
      const i = ORDER[k];
      const reach = smooth(prog(t, p - .45, p - .05)) * (1 - smooth(prog(t, p + .15, p + .55)));
      if (reach > 0) { const bp = bodyPoint(vsl, SPOTS[i]); target = { p: bp, k: reach }; }
    });
    const tsl = E.solve(o.tormentor), rest = tsl.arms[0][2];
    if (target) o.tormentor.arms = [{ target: E.lerpP(rest, { x: target.p.x - 18, y: target.p.y }, target.k) }, o.tormentor.arms[1]];
    const r2 = smooth(prog(t, CUE.reach, CUE.reach + .5)) * (1 - smooth(prog(t, CUE.turnAway + .1, CUE.turnAway + .5)));
    if (r2 > 0) { const vs = shoulderOf(o.victim); o.tormentor.arms = [{ target: E.lerpP(rest, { x: vs.x - 10, y: vs.y + 6 }, r2) }, o.tormentor.arms[1]]; }
    if (t > CUE.turnAway + .5) { // se queda solo con la cabeza baja
      const k = smooth(prog(t, CUE.turnAway + .5, CUE.alone));
      o.tormentor = mix(o.tormentor, { ...kn, lean: .5, tilt: .9, arms: [{ ang: .3, bend: .2 }, { ang: .2, bend: .2 }] }, k);
    }
  }
  o.am = am;
  return o;
}

// dardos: vuelan desde la boca, se clavan, luego se los quita y caen al piso
function dartState(t, i, c) {
  const h = HITS[i];
  if (t < h - FLY) return null;
  const tsl = E.solve(c.tormentor), vsl = E.solve(c.victim);
  const k = ORDER.indexOf(i), pt = CUE.pulls[k];
  const ang = -.08 + (i % 2 ? .06 : -.04);
  if (t < h) {
    // en vuelo: de la boca al punto de impacto (calculado en el instante del golpe)
    const c2 = cast(h), target = bodyPoint(E.solve(c2.victim), SPOTS[i]);
    const hd = headOf(c2.tormentor), mouth = { x: hd.x + 22, y: hd.y + 6 };
    const p = easeIn(prog(t, h - FLY, h) * .6 + .4 * prog(t, h - FLY, h));
    return { x: lerp(mouth.x, target.x, p), y: lerp(mouth.y, target.y, p) - Math.sin(Math.PI * p) * 14, ang, mode: 'fly' };
  }
  if (t < pt) { const bp = bodyPoint(vsl, SPOTS[i]); return { x: bp.x, y: bp.y, ang, mode: 'stuck' }; }
  // en la mano y luego al piso
  const hand = tsl.arms[0][2];
  if (t < pt + .3) return { x: hand.x + 8, y: hand.y, ang: ang - .3, mode: 'hand' };
  const f = easeIn(prog(t, pt + .3, pt + .7));
  const fx = VX - 150 + k * 9, fy = FLOOR - 3;
  return { x: lerp(hand.x, fx, f), y: lerp(hand.y, fy, f), ang: lerp(ang - .3, .1 + k * .25, f), mode: 'floor' };
}
function dart(x, y, ang, a = 1) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(1.35, 1.35); ctx.translate(-8, 0); ctx.globalAlpha *= a;
  ctx.shadowColor = '#ff2a2a'; ctx.shadowBlur = 16;
  ctx.strokeStyle = '#ff3b36'; ctx.lineWidth = 4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-34, 0); ctx.lineTo(4, 0); ctx.stroke();
  ctx.fillStyle = '#ff3b36'; ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(2, -5); ctx.lineTo(2, 5); ctx.fill();
  ctx.fillStyle = '#ff6a60';
  ctx.beginPath(); ctx.moveTo(-34, 0); ctx.lineTo(-44, -9); ctx.lineTo(-28, 0); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-34, 0); ctx.lineTo(-44, 9); ctx.lineTo(-28, 0); ctx.fill();
  ctx.restore();
}
// marca roja brillante que queda en el cuerpo
function scar(x, y, t, k, seed) {
  const pz = .75 + .25 * Math.pow(Math.max(0, Math.sin(t * 4.4 + seed)), 4);
  glowCircle(x, y, 17 * k, '255,40,30', .5 * k * pz);
  ctx.save(); ctx.strokeStyle = `rgba(255,70,55,${.95 * k})`; ctx.lineWidth = 2.6; ctx.lineCap = 'round'; ctx.shadowColor = '#ff2020'; ctx.shadowBlur = 10;
  const g = rng(seed);
  ctx.beginPath();
  for (let j = 0; j < 4; j++) { const a = g() * 6.28, l = 5 + g() * 6; ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * l * k, y + Math.sin(a) * l * k); }
  ctx.stroke();
  ctx.fillStyle = `rgba(255,90,70,${k})`; ctx.beginPath(); ctx.arc(x, y, 3.5 * k, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
// grito: espinas rojas que salen de la boca
function shoutFx(c, t) {
  HITS.forEach(h => {
    const s = h - FLY, k = bump(t, s - .08, s + .25);
    if (k <= 0) return;
    const hd = headOf(c.tormentor), x = hd.x + 26, y = hd.y + 4;
    ctx.save(); ctx.strokeStyle = `rgba(255,60,50,${.9 * k})`; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.shadowColor = '#ff2a2a'; ctx.shadowBlur = 14;
    for (let j = -2; j <= 2; j++) { const a = j * .32; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * 8, y + Math.sin(a) * 8); ctx.lineTo(x + Math.cos(a) * (22 + 18 * k), y + Math.sin(a) * (22 + 18 * k)); ctx.stroke(); }
    ctx.restore();
  });
}

const VSTYLE = t => mixStyle(STYLE.hero, STYLE.gray, .3 * smooth(prog(t, HITS[0], HITS[4] + 1)));
window.SCENE = {
  id: '15-las-palabras', title: 'Las palabras *dejan marcas*', duration: D, cue: CUE,
  sky: t => .3 * smooth(prog(t, 0, 1)) * (1 - smooth(prog(t, CUE.stop, CUE.regret + 1))) + .12,
  spot: t => ({ x: keyed([[0, 360], [CUE.kneel, 420], [CUE.sitDown, 470]], t), r: 360 }),
  beam: t => ({ x: keyed([[0, 470], [CUE.kneel, 440], [CUE.sitDown + 1, VX + 40]], t), a: .05, w: 150 }),
  flashes: [HITS[0] + .01, HITS[4] + .01],
  blackouts: [CUE.marks + .02],
  camera: t => {
    let sh = 0; HITS.forEach(h => { sh = Math.max(sh, .45 * pulse(t, h + .01, .25)); });
    return {
      zoom: keyed([[0, 1.95], [HITS[2], 1.8], [HITS[4], 1.9], [CUE.stop, 2.15], [CUE.mouth, 2.3], [CUE.approach + .3, 1.85], [CUE.kneel, 2.05], [CUE.pulls[4], 2.25], [CUE.reach, 2.2], [CUE.marks + .3, 2.45], [CUE.sitDown + .8, 2.1], [D, 1.8]], t),
      x: keyed([[0, 340], [HITS[2], 360], [HITS[4], 395], [CUE.stop, 420], [CUE.regret, 330], [CUE.mouth, 280], [CUE.approach + .3, 350], [CUE.kneel, 425], [CUE.pulls[4], 440], [CUE.marks + .3, 470], [CUE.sitDown + .8, 470], [D, 430]], t),
      y: keyed([[0, FLOOR - 185], [CUE.stop, FLOOR - 160], [CUE.mouth, FLOOR - 190], [CUE.kneel, FLOOR - 150], [CUE.marks + .3, FLOOR - 140], [CUE.sitDown + .8, FLOOR - 140], [D, FLOOR - 180]], t),
      shake: sh,
    };
  },
  world(t, refl) {
    const c = cast(t);
    // dardos ya en el piso, detrás
    const ds = [0, 1, 2, 3, 4].map(i => dartState(t, i, c));
    ds.forEach(d => { if (d && d.mode === 'floor') dart(d.x, d.y, d.ang, 1); });
    figure(c.tormentor, STYLE.gray);
    const vsl = figure(c.victim, VSTYLE(t));
    // marcas que quedan donde estaban los dardos
    if (!refl) CUE.pulls.forEach((p, k) => {
      const i = ORDER[k];
      const sk = smooth(prog(t, p + .05, p + .35));
      if (sk > 0) { const bp = bodyPoint(vsl, SPOTS[i]); scar(bp.x, bp.y, t, sk * (1 + .35 * bump(t, CUE.marks, CUE.marks + 1.4)), i * 7 + 3); }
    });
    ds.forEach((d, i) => { if (d && d.mode !== 'floor') dart(d.x, d.y, d.ang, 1); });
    if (!refl) {
      shoutFx(c, t);
      HITS.forEach((h, i) => {
        const bp = bodyPoint(vsl, SPOTS[i]);
        burst(bp.x, bp.y, t, h, { color: '255,60,50', n: 18, speed: 220, size: 3, gravity: .6, life: .6, seed: 3 + i });
        ring(bp.x, bp.y, t, h, { r: 60, color: '255,70,60', width: 5, life: .45 });
      });
      CUE.pulls.forEach((p, k) => { const bp = bodyPoint(vsl, SPOTS[ORDER[k]]); burst(bp.x, bp.y, t, p + .05, { color: '255,200,190', n: 10, speed: 120, size: 2, life: .5, gravity: .2, seed: 40 + k }); });
    }
  },
  events() {
    const ev = E.footsteps(D, t => { const c = cast(t); return [c.tormentor.phi !== undefined && t > CUE.approach ? { phi: c.tormentor.phi, size: 1, moving: true } : null]; });
    return ev.concat([
      ...HITS.map((h, i) => ({ t: h - FLY - .05, type: 'buzz', dur: .3, vol: .6 })),
      ...HITS.map(h => ({ t: h - FLY, type: 'whoosh', dur: .3, vol: .8 })),
      ...HITS.map((h, i) => ({ t: h, type: 'impact', vol: .7 + i * .05 })),
      ...HITS.map(h => ({ t: h + .02, type: 'crack', vol: .5 })),
      { t: CUE.stop + .2, type: 'heartbeat', vol: .8 }, { t: CUE.stop + 1, type: 'heartbeat', vol: .6 },
      { t: CUE.mouth, type: 'swell', dur: 1.2, vol: .5 },
      ...CUE.pulls.map((p, k) => ({ t: p + .05, type: 'snap', vol: .6 })),
      ...CUE.pulls.map((p, k) => ({ t: p + .7, type: 'tick', vol: .6 })),
      { t: CUE.drop, type: 'clatter', vol: .5 },
      { t: CUE.marks, type: 'boom', vol: .6 }, { t: CUE.marks + .1, type: 'heartbeat', vol: 1 }, { t: CUE.marks + .9, type: 'heartbeat', vol: .8 },
      { t: CUE.marks + 1.7, type: 'heartbeat', vol: .6 }, { t: CUE.marks + 2.5, type: 'heartbeat', vol: .45 }, { t: CUE.marks + 3.3, type: 'heartbeat', vol: .3 },
    ]);
  },
  music: {
    sections: [
      { t: 0, dur: CUE.stop, style: 'tension', chords: ['Am', 'E'], chordLen: .9 },
      { t: CUE.mouth, dur: CUE.marks - CUE.mouth, style: 'sad', chords: ['Am', 'F', 'C', 'E'], chordLen: 1.5 },
      { t: CUE.marks + 1, dur: D - CUE.marks - 1, style: 'sad', chords: ['Am', 'F', 'Dm', 'E'], chordLen: 1.6, vol: .9 },
    ],
    stingers: [{ t: HITS[4], type: 'impact' }],
    duck: [[CUE.stop, CUE.mouth], [CUE.marks - .05, CUE.marks + .9]],
  },
};
})();
