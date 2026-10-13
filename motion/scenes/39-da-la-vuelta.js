// 39 — UN FAVOR DA LA VUELTA AL MUNDO: un corazón rojo pasa de mano en mano. El del sombrero le da su paraguas
// a un desconocido bajo la lluvia; ese levanta a una mujer que cayó; ella consuela a un niño que llora; y el
// niño —al final del camino— levanta al del sombrero, que había tropezado. El corazón vuelve a él.
(() => {
const { FLOOR, clamp, lerp, prog, smooth, easeOut, easeIn, easeInOut, keyed, bump, pulse, stand, walk, run, sit, kneel, crouch, mix, poseAt,
        figure, STYLE, glowCircle, ctx, burst, ring, rays, heart, umbrella, holdPoint } = E;
const D = 22;
const CUE = { aStop: 1.2, offer: 2.0, give1: 2.8, aLeave: 3.5, bGo: 3.7, cTrip: 5.25, bReach: 5.9, give2: 7.0, cGo: 7.5, cKneel: 9.3, give3: 10.6,
              dGo: 11.0, aIn: 11.0, aTrip: 12.4, dRun: 12.6, pull: 13.6, give4: 14.6, hat: 15.0, look: 15.8, wide: 16.4, loop: 17.2 };
const V1 = 345, V2 = 700, V3 = 1070, V4 = 1460;
const lit = (t, t0) => smooth(prog(t, t0 + .15, t0 + .7));
const styleFor = (t, t0) => E.mixStyle(STYLE.gray, STYLE.hero, lit(t, t0));

// ── A: el del sombrero ──
const aX = t => t < 6 ? keyed([[0, 120], [CUE.aStop, 246], [CUE.aLeave, 246], [5.2, 20]], t, p => p) : keyed([[CUE.aIn, 1640], [CUE.aTrip, 1490]], t, p => p);
function A(t) {
  if (t < 6) {
    const walking = t2 => { const x = aX(t2); const p = walk(x, x - 120, { lean: .06, tilt: .02 }); p.arms = [{ target: { x: x + 24, y: FLOOR - 128 } }, p.arms[1]]; return p; };
    const see = t2 => { const p = stand(246, { t: t2, lean: .04, tilt: .2 }); p.arms = [{ target: { x: 270, y: FLOOR - 130 } }, { ang: .1, bend: .3 }]; return p; };
    const offer = t2 => { const p = stand(252, { t: t2, lean: .16, tilt: .15 }); p.arms = [{ target: { x: 316, y: FLOOR - 150 } }, { ang: .1, bend: .3 }]; return p; };
    const tip = t2 => { const p = stand(250, { t: t2, lean: .02, tilt: -.05 }); const h = E.headOf(p); p.arms = [{ target: { x: h.x + 10, y: h.y - 20 } }, { ang: .1, bend: .3 }]; return p; };
    const leave = t2 => { const x = aX(t2); return walk(x, 246 - x, { dir: -1, lean: -.02, tilt: -.3 }); };
    return poseAt(t, [[0, walking], [CUE.aStop - .1, walking], [CUE.aStop + .25, see], [CUE.offer - .1, see], [CUE.offer + .4, offer], [CUE.give1 + .1, offer],
                      [CUE.give1 + .45, tip], [CUE.aLeave - .1, tip], [CUE.aLeave + .3, leave], [6, leave]]);
  }
  const walkIn = t2 => { const x = aX(t2); return walk(x, 1640 - x, { dir: -1, lean: .06 }); };
  const fall = t2 => { const p = { hip: { x: 1478, y: FLOOR - 12 }, s: 1, dir: -1, lean: -.35, tilt: .3, feet: [{ x: 1408, y: FLOOR }, { x: 1418, y: FLOOR - 4 }] };
    p.arms = [{ target: { x: 1440, y: FLOOR - 40 } }, { target: { x: 1505, y: FLOOR - 2 } }]; return p; };
  const hurt = t2 => { const p = { hip: { x: 1478, y: FLOOR - 12 }, s: 1, dir: -1, lean: .05, tilt: .5, feet: [{ x: 1408, y: FLOOR }, { x: 1420, y: FLOOR - 4 }] };
    p.arms = [{ target: { x: 1420 + 4 * Math.sin(t2 * 8), y: FLOOR - 18 } }, { target: { x: 1505, y: FLOOR - 2 } }]; return p; };
  const reachUp = t2 => { const p = { hip: { x: 1478, y: FLOOR - 12 }, s: 1, dir: -1, lean: -.1, tilt: -.25, feet: [{ x: 1408, y: FLOOR }, { x: 1420, y: FLOOR - 4 }] };
    p.arms = [{ target: pullHand(t2) }, { target: { x: 1505, y: FLOOR - 2 } }]; return p; };
  const up = t2 => { const p = stand(1474, { t: t2, dir: -1, lean: .08, tilt: .1 }); p.arms = [{ target: pullHand(t2) }, { ang: .1, bend: .3 }]; return p; };
  const chest = t2 => { const p = stand(1474, { t: t2, dir: -1, lean: -.04, tilt: .45 }); const s = E.shoulderOf(p); p.arms = [{ target: { x: s.x - 10, y: s.y + 30 } }, { ang: .1, bend: .3 }]; return p; };
  const thank = t2 => { const p = stand(1474, { t: t2, dir: -1, lean: .2, tilt: .4 }); p.arms = [{ target: { x: 1428, y: FLOOR - 136 } }, { ang: .1, bend: .3 }]; return p; };
  const proud = t2 => { const p = stand(1474, { t: t2, dir: -1, lean: -.05, tilt: -.2 }); p.arms = [{ target: { x: 1432, y: FLOOR - 128 } }, { ang: .15, bend: .3 }]; return p; };
  return poseAt(t, [[6, walkIn], [CUE.aTrip, walkIn], [CUE.aTrip + .35, fall], [CUE.aTrip + .7, hurt], [CUE.pull - .4, hurt], [CUE.pull, reachUp], [CUE.pull + .8, up],
                    [CUE.give4 + .2, up], [CUE.give4 + .6, chest], [CUE.hat + .7, chest], [CUE.look, thank], [CUE.wide, proud], [D, proud]]);
}
function aVisible(t) { return t < 5.3 || t > CUE.aIn; }
// el sombrero
function hatPos(t, sl) {
  if (t < CUE.aTrip + .05 || t > CUE.hat + .55) return null; // en la cabeza
  const fallP = easeOut(prog(t, CUE.aTrip + .05, CUE.aTrip + .6));
  const floor = { x: 1418, y: FLOOR - 6 };
  if (t < CUE.hat - .4) { const h0 = { x: 1470, y: FLOOR - 200 }; return { x: lerp(h0.x, floor.x, fallP), y: lerp(h0.y, floor.y, fallP) - 50 * bump(fallP, 0, 1), rot: -2.4 * fallP }; }
  const k = smooth(prog(t, CUE.hat - .4, CUE.hat + .5));
  const head = E.solve(A(t)).head;
  return { x: lerp(floor.x, head.x, k), y: lerp(floor.y, head.y - 20, k) - 40 * bump(k, 0, 1), rot: lerp(-2.4, 0, k) };
}
function hat(x, y, rot, dir = 1) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(dir, 1);
  ctx.fillStyle = '#2e2e30'; ctx.shadowColor = 'rgba(255,255,255,.35)'; ctx.shadowBlur = 8;
  ctx.fillRect(-25, -4, 50, 6);
  ctx.beginPath(); ctx.moveTo(-15, -4); ctx.lineTo(-13, -22); ctx.quadraticCurveTo(0, -27, 13, -22); ctx.lineTo(15, -4); ctx.fill();
  ctx.fillStyle = '#d8d8d8'; ctx.shadowBlur = 0; ctx.fillRect(-15, -9, 30, 4);
  ctx.restore();
}
function hatOnHead(sl) {
  const a = Math.atan2(sl.head.y - sl.sh.y, sl.head.x - sl.sh.x) + Math.PI / 2;
  const r = sl.R.headR;
  hat(sl.head.x + Math.sin(a) * r * .55, sl.head.y - Math.cos(a) * r * .55, a, sl.dir);
}

// ── B: el que espera bajo la lluvia ──
const bX = t => keyed([[0, V1], [CUE.bGo, V1], [CUE.bReach - .4, V2 - 66]], t, p => p);
function B(t) {
  const shiver = t2 => { const p = E.sad(V1, { t: t2 }); p.hip.x += Math.sin(t2 * 40) * 1.2; const s = E.shoulderOf(p); p.arms = [{ target: { x: s.x + 14, y: s.y + 26 } }, { target: { x: s.x + 8, y: s.y + 22 } }]; return p; };
  const take = t2 => { const p = stand(V1, { t: t2, lean: -.04, tilt: -.25 }); p.arms = [{ ang: .1, bend: .3 }, { target: { x: V1 + 2, y: FLOOR - 150 } }]; return p; };
  const thank = t2 => { const p = stand(V1, { t: t2, dir: -1, lean: .2, tilt: .2 }); p.arms = [{ ang: .2, bend: .5 }, { target: { x: V1 - 2, y: FLOOR - 150 } }]; return p; };
  const walking = t2 => { const x = bX(t2); const p = walk(x, x - V1, { lean: .08, stride: 1.2 }); p.arms = [p.arms[0], { target: { x: x + 4, y: FLOOR - 150 } }]; return p; };
  const reach = t2 => { const x = V2 - 66; const p = stand(x, { t: t2, lean: .35, tilt: .45 }); p.arms = [{ target: pullC(t2) }, { target: { x: x - 4, y: FLOOR - 150 } }]; return p; };
  const pullBack = t2 => { const x = V2 - 70; const p = stand(x, { t: t2, lean: -.05, tilt: .1 }); p.arms = [{ target: pullC(t2) }, { target: { x: x - 2, y: FLOOR - 150 } }]; return p; };
  const wave = t2 => { const x = V2 - 70; const p = stand(x, { t: t2, lean: -.02, tilt: -.05 }); p.arms = [{ ang: 2.4 + .3 * Math.sin(t2 * 8), bend: .3 }, { target: { x: x - 2, y: FLOOR - 150 } }]; return p; };
  return poseAt(t, [[0, shiver], [CUE.give1 - .2, shiver], [CUE.give1 + .3, take], [CUE.aLeave - .2, take], [CUE.aLeave + .1, thank], [CUE.bGo, thank], [CUE.bGo + .3, walking],
                    [CUE.bReach - .5, walking], [CUE.bReach, reach], [CUE.bReach + .5, reach], [CUE.give2 - .1, pullBack], [CUE.cGo, pullBack], [CUE.cGo + .5, wave], [D, wave]]);
}
// paraguas: de A al principio, luego de B
function umbrellaState(t) {
  if (t < CUE.give1) { const sl = E.solve(A(t)), h = sl.arms[0][2]; return { x: h.x, y: h.y - 86 * .95, open: 1 }; }
  const sl = E.solve(B(t)), h = sl.arms[1][2]; return { x: h.x, y: h.y - 86 * .95, open: 1 };
}
// ── C: la mujer que cae ──
const C0 = V2 + 24;
const cX = t => t < CUE.cGo ? keyed([[3.8, V2 + 140], [CUE.cTrip, C0]], t, p => p) : keyed([[CUE.cGo, C0], [CUE.cKneel - .2, V3 - 66]], t, p => p);
function pullC(t) { const c = cHandBase(t); return c; }
function cHandBase(t) { const k = smooth(prog(t, CUE.bReach + .5, CUE.give2)); return { x: lerp(V2 - 4, V2 - 18, k), y: lerp(FLOOR - 70, FLOOR - 112, k) }; }
function C(t) {
  const walking = t2 => { const x = cX(t2); return walk(x, V2 + 140 - x, { dir: -1, lean: .1, tilt: .1 }); };
  const fallen = t2 => { const p = kneel(C0 + 6, { dir: -1, lean: .75, tilt: .4 }); p.arms = [{ target: { x: C0 - 40, y: FLOOR - 4 } }, { target: { x: C0 - 28, y: FLOOR - 2 } }]; return p; };
  const reach = t2 => { const p = kneel(C0 + 6, { dir: -1, lean: .35, tilt: -.2 }); p.arms = [{ target: pullC(t2) }, { target: { x: C0 - 22, y: FLOOR - 2 } }]; return p; };
  const up = t2 => { const p = stand(C0, { t: t2, dir: -1, lean: .05, tilt: -.05 }); p.arms = [{ target: pullC(t2) }, { ang: .1, bend: .3 }]; return p; };
  const walking2 = t2 => { const x = cX(t2); return walk(x, x - C0, { lean: .08 }); };
  const kneelHug = t2 => { const x = V3 - 62; const p = kneel(x, { lean: .38, tilt: .3 }); p.arms = [{ target: { x: V3 + 10, y: FLOOR - 72 } }, { target: { x: V3 + 2, y: FLOOR - 84 } }]; return p; };
  const kneelLet = t2 => { const x = V3 - 62; const p = kneel(x, { lean: .12, tilt: -.05 }); p.arms = [{ target: { x: V3 - 12, y: FLOOR - 70 } }, { ang: .4, bend: .3 }]; return p; };
  return poseAt(t, [[3.8, walking], [CUE.cTrip - .05, walking], [CUE.cTrip + .25, fallen], [CUE.bReach + .2, fallen], [CUE.bReach + .6, reach], [CUE.bReach + .8, reach],
                    [CUE.give2 - .1, up], [CUE.cGo, up], [CUE.cGo + .3, walking2], [CUE.cKneel - .25, walking2], [CUE.cKneel + .3, kneelHug], [CUE.give3 + .1, kneelHug], [CUE.give3 + .6, kneelLet], [D, kneelLet]]);
}
// ── D: el niño que llora ──
const dX = t => keyed([[CUE.dGo, V3], [CUE.dRun, V4 - 120], [CUE.pull - .2, V4 - 64]], t, p => p);
function pullHand(t) { const k = smooth(prog(t, CUE.pull, CUE.pull + .8)); return { x: lerp(1452, 1438, k), y: lerp(FLOOR - 70, FLOOR - 110, k) }; }
function Dk(t) {
  const S = .62;
  const cry = t2 => { const p = sit(V3, { s: S, ground: true, dir: -1, lean: .55, tilt: .7 }); p.hip.y += Math.sin(t2 * 9) * .8; p.arms = [{ target: { x: V3 - 24, y: FLOOR - 36 } }, { target: { x: V3 - 20, y: FLOOR - 32 } }]; return p; };
  const hugged = t2 => { const p = sit(V3, { s: S, ground: true, dir: -1, lean: .2, tilt: .1 }); p.arms = [{ target: { x: V3 - 34, y: FLOOR - 70 } }, { target: { x: V3 - 28, y: FLOOR - 66 } }]; return p; };
  const standUp = t2 => { const p = stand(V3, { s: S, t: t2, dir: -1, tilt: -.3 }); p.arms = [{ ang: .4, bend: .3 }, { ang: .2, bend: .3 }]; return p; };
  const go = t2 => { const x = dX(t2); return walk(x, x - V3, { s: S, lean: .1, tilt: -.1, stride: 1.2 }); };
  const runP = t2 => { const x = dX(t2); return run(x, x - V3, { s: S }); };
  const pullP = t2 => { const x = V4 - 64; const p = stand(x, { s: S, t: t2, lean: -.25, tilt: -.1 }); p.feet = [{ x: x - 8, y: FLOOR }, { x: x - 22, y: FLOOR }]; p.arms = [{ target: pullHand(t2) }, { target: pullHand(t2) }]; return p; };
  const giveHat = t2 => { const x = V4 - 62; const p = stand(x, { s: S, t: t2, lean: .05, tilt: -.4 }); const hp = hatPos(t2); p.arms = [{ target: hp ? { x: hp.x, y: hp.y + 6 } : { x: x + 20, y: FLOOR - 60 } }, { ang: .2, bend: .3 }]; return p; };
  const pick = t2 => { const x = V4 - 62; const p = crouch(x, { s: S, amt: .8 }); p.arms = [{ target: { x: 1420, y: FLOOR - 8 } }, { ang: .6, bend: .3 }]; return p; };
  const happy = t2 => { const x = V4 - 62; const p = stand(x, { s: S, t: t2, tilt: -.45 }); p.hip.y -= 6 * Math.max(0, Math.sin(t2 * 7)); p.arms = [{ ang: 2.5, bend: .2 }, { ang: 2.2, bend: .2 }]; return p; };
  return poseAt(t, [[0, cry], [CUE.cKneel + .3, cry], [CUE.cKneel + .7, hugged], [CUE.give3 + .2, hugged], [CUE.dGo, standUp], [CUE.dGo + .3, go], [CUE.dRun - .1, go], [CUE.dRun + .15, runP],
                    [CUE.pull - .25, runP], [CUE.pull, pullP], [CUE.give4 - .2, pullP], [CUE.give4 + .1, pick], [CUE.hat - .4, pick], [CUE.hat, giveHat], [CUE.hat + .55, giveHat], [CUE.look + .2, happy], [D, happy]]);
}

// ── el corazón: viaja de pecho en pecho ──
const chest = sl => ({ x: lerp(sl.hip.x, sl.sh.x, .72) + 6 * sl.dir * sl.s, y: lerp(sl.hip.y, sl.sh.y, .72) });
const HOLD = [[-1, 'A'], [CUE.give1, 'B'], [CUE.give2, 'C'], [CUE.give3, 'D'], [CUE.give4, 'A']];
const who = { A, B, C, D: Dk };
function heartAt(t) {
  let i = 0; while (i + 1 < HOLD.length && t >= HOLD[i + 1][0] - .55) i++;
  const [t0, w] = HOLD[i], nxt = HOLD[i + 1];
  const pos = (name, tt) => chest(E.solve(who[name](tt)));
  if (i === 0 && t > 5.3) return null;
  if (t >= t0 - .55 && t < t0 && i > 0) {
    const a = pos(HOLD[i - 1][1], t), b = pos(w, t), k = easeInOut(prog(t, t0 - .55, t0));
    return { x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k) - 70 * Math.sin(Math.PI * k), fly: k, holder: w };
  }
  return { ...pos(w, t), fly: 0, holder: w };
}

const camKeys = [[0, 250, 2.05, 175], [CUE.aStop, 300, 1.95, 175], [CUE.give1, 310, 2.2, 165], [CUE.aLeave, 300, 1.95, 175], [CUE.bGo + .5, 420, 1.8, 180],
                 [CUE.cTrip, 650, 1.9, 175], [CUE.give2, 680, 2.25, 160], [CUE.cGo + .4, 760, 1.8, 180], [CUE.cKneel + .4, 1040, 2.1, 165], [CUE.give3, 1050, 2.35, 150],
                 [CUE.dGo + .4, 1150, 1.85, 175], [CUE.aTrip, 1400, 1.8, 180], [CUE.pull, 1440, 2.05, 165], [CUE.give4, 1450, 2.4, 150], [CUE.hat + .5, 1440, 2.1, 165],
                 [CUE.look + .3, 1400, 1.8, 185], [CUE.loop + .8, 900, .56, 330], [D, 900, .54, 335]];
// arco de regreso (cierra el círculo) de V4 a V1 por arriba
const arcPt = k => ({ x: lerp(1470, 250, k), y: FLOOR - 150 - Math.sin(Math.PI * k) * 520 });

window.SCENE = {
  id: '39-da-la-vuelta', title: 'Un favor *da la vuelta* al mundo', duration: D, cue: CUE,
  scroll: t => keyed(camKeys.map(r => [r[0], r[1]]), t) * .3,
  sky: t => .25 * smooth(prog(t, CUE.give4, CUE.give4 + 1)),
  spot: t => ({ x: keyed(camKeys.map(r => [r[0], r[1]]), t), r: 340 }),
  beam: t => ({ x: keyed(camKeys.map(r => [r[0], r[1]]), t), a: .04 * (1 - smooth(prog(t, CUE.wide, CUE.loop))), w: 140 }),
  flashes: [],
  blackouts: [],
  camera: t => {
    const pick = i => camKeys.map(r => [r[0], r[i]]);
    return { x: keyed(pick(1), t), zoom: keyed(pick(2), t), y: FLOOR - keyed(pick(3), t), shake: .2 * pulse(t, CUE.cTrip + .2, .25) + .2 * pulse(t, CUE.aTrip + .3, .25) + .15 * pulse(t, CUE.give4, .3) };
  },
  backdrop(t) {
    // nube de lluvia sobre V1
    E.cloud(V1 - 10, FLOOR - 420, 1.5, '#1d1d22');
  },
  world(t, refl) {
    // personas (cada una se ilumina cuando recibe el corazón)
    if (t < 9) figure(B(t), styleFor(t, CUE.give1));
    else figure(B(t), styleFor(t, CUE.give1));
    const us = umbrellaState(t);
    umbrella(us.x, us.y, .95, 0, us.open);
    if (t > 3.8) figure(C(t), styleFor(t, CUE.give2));
    figure(Dk(t), styleFor(t, CUE.give3));
    if (aVisible(t)) {
      const sl = figure(A(t), STYLE.hero);
      const hp = hatPos(t);
      if (!hp) hatOnHead(sl); else hat(hp.x, hp.y, hp.rot, -1);
    }
    // corazón
    const h = heartAt(t);
    if (h && !refl) {
      const pul = 1 + .12 * Math.sin(t * 8), big = 1 + 1.4 * bump(t, CUE.give4 - .1, CUE.give4 + .9);
      glowCircle(h.x, h.y, 50 * big, '255,40,30', .45);
      heart(h.x, h.y + 6, 15 * pul * big * (1 + .4 * h.fly), '#ff3b36', 1, 30);
    }
    // corazones que se quedan en cada persona que ayudó (pequeños, latiendo)
    if (!refl) for (const [t0, name] of HOLD.slice(1, 4)) {
      const k = smooth(prog(t, t0 + 1.2, t0 + 2)); if (k <= 0) continue;
      const c = chest(E.solve(who[name](t)));
      heart(c.x, c.y + 4, 9 * k * (1 + .1 * Math.sin(t * 7 + t0)), '#ff3b36', .9 * k, 16);
    }
  },
  front(t) {
    E.rain(t, V1 - 260, V1 + 130, FLOOR - 400, FLOOR, .8, 3);
    // destellos en cada entrega
    for (const [t0] of HOLD.slice(1)) {
      const h = heartAt(t0 + .02); if (!h) continue;
      const big = t0 === CUE.give4;
      ring(h.x, h.y, t, t0, { r: big ? 320 : 120, color: '255,60,50', life: big ? 1.2 : .7, width: big ? 10 : 5 });
      burst(h.x, h.y, t, t0, { n: big ? 50 : 18, speed: big ? 300 : 160, size: big ? 3.5 : 2.5, life: big ? 1.6 : .9, gravity: -.1, seed: Math.round(t0 * 10) });
    }
    if (t > CUE.give4) { const h = heartAt(t); if (h) rays(h.x, h.y, t, bump(t, CUE.give4, CUE.loop + .5), '255,60,50', 14, 420); }
    // estela del corazón
    if (t > .3) for (let i = 1; i < 10; i++) {
      const p = heartAt(t - i * .05); if (!p || !p.fly) continue;
      glowCircle(p.x, p.y, 18 - i, '255,60,50', .25 * (1 - i / 10));
    }
    // lágrimas del niño
    if (t < CUE.cKneel + .5) { const sl = E.solve(Dk(t)); for (let i = 0; i < 3; i++) { const k = (t * 1.6 + i / 3) % 1; ctx.fillStyle = `rgba(200,220,255,${.7 * (1 - k)})`; ctx.beginPath(); ctx.arc(sl.head.x - 10, sl.head.y + 6 + 30 * k * k, 2, 0, Math.PI * 2); ctx.fill(); } }
    // el círculo se cierra: arco rojo de V4 de vuelta al principio
    const ak = smooth(prog(t, CUE.wide + .3, CUE.loop + 1.4));
    if (ak > 0) {
      ctx.save(); ctx.strokeStyle = 'rgba(255,60,50,.9)'; ctx.lineWidth = 13; ctx.shadowColor = '#ff2a20'; ctx.shadowBlur = 24; ctx.setLineDash([2, 26]); ctx.lineCap = 'round';
      ctx.beginPath(); for (let i = 0; i <= 60 * ak; i++) { const p = arcPt(i / 60); i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); } ctx.stroke(); ctx.restore();
      // camino por el piso: A → B → C → D → A
      ctx.save(); ctx.strokeStyle = 'rgba(255,60,50,.7)'; ctx.lineWidth = 6; ctx.shadowColor = '#ff2a20'; ctx.shadowBlur = 18; ctx.setLineDash([2, 16]); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(250, FLOOR - 150); for (const x of [V1, V2, V3, 1470]) ctx.lineTo(x, FLOOR - 150 - 30 * Math.sin(x)); ctx.globalAlpha = ak; ctx.stroke(); ctx.restore();
      // un corazoncito que da vueltas por el círculo
      if (ak >= 1) { const q = ((t - CUE.loop - 1.4) * .5) % 1; const p = q < .5 ? arcPt(q * 2) : { x: lerp(250, 1470, (q - .5) * 2), y: FLOOR - 150 }; heart(p.x, p.y, 64, '#ff3b36', 1, 50); }
    }
  },
  events() {
    const ev = E.footsteps(D, t => [
      t < CUE.aStop || (t > CUE.aLeave && t < 5.2) ? { phi: Math.abs(aX(t) - (t < 3 ? 120 : 246)) / 88, size: 1, vol: .8 } : t > CUE.aIn && t < CUE.aTrip ? { phi: (1640 - aX(t)) / 88, size: 1 } : null,
      t > CUE.bGo + .2 && t < CUE.bReach - .4 ? { phi: (bX(t) - V1) / (88 * 1.2), size: 1 } : null,
      (t > 3.8 && t < CUE.cTrip) || (t > CUE.cGo && t < CUE.cKneel - .2) ? { phi: Math.abs(cX(t) - (t < 6 ? V2 + 140 : C0)) / 88, size: 1 } : null,
      t > CUE.dGo + .2 && t < CUE.pull - .2 ? { phi: (dX(t) - V3) / (88 * .62 * 1.2), size: .62 } : null,
    ]);
    ev.push({ t: 0, type: 'rain', dur: 5.5, vol: .8 }, { t: .05, type: 'whoosh', vol: .5 });
    for (const [t0] of HOLD.slice(1)) ev.push({ t: t0 - .5, type: 'whoosh', vol: .4 }, { t: t0, type: 'chime', vol: t0 === CUE.give4 ? 1.2 : .8 }, { t: t0 + .05, type: 'sparkle', vol: .7 });
    ev.push({ t: CUE.cTrip + .15, type: 'thud', vol: .7 }, { t: CUE.cTrip, type: 'scuff' }, { t: CUE.aTrip, type: 'scuff' }, { t: CUE.aTrip + .3, type: 'thud', vol: .8 });
    ev.push({ t: CUE.give4, type: 'heartbeat' }, { t: CUE.wide, type: 'riser', dur: 1.2 }, { t: CUE.loop + 1.4, type: 'bells' });
    return ev;
  },
  music: {
    sections: [
      { t: 0, dur: CUE.give1 + .2, style: 'sad', chords: ['Am', 'F', 'C'], chordLen: .95 },
      { t: CUE.give1, dur: CUE.aTrip - CUE.give1, style: 'upbeat', chords: ['C', 'G', 'Am', 'F'], chordLen: 1.1, bpm: 108 },
      { t: CUE.aTrip, dur: CUE.give4 - CUE.aTrip, style: 'tender', chords: ['Am', 'F'], chordLen: 1 },
      { t: CUE.give4, dur: D - CUE.give4, style: 'hope', chords: ['F', 'C', 'G', 'C'], chordLen: 1.3 },
    ],
    stingers: [{ t: CUE.give1, type: 'chime' }, { t: CUE.give4, type: 'impact' }, { t: CUE.loop + 1.4, type: 'bells' }],
    duck: [[CUE.aTrip + .3, CUE.give4 - .3]],
  },
};
})();
