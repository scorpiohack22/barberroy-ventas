// 19 — EL TIEMPO NO VUELVE: el padre trabaja frente a una pantalla roja. El hijo con su pelota le toca la
// espalda: "espera" (mano arriba, sin mirarlo). El niño espera junto a la puerta mientras el reloj de arena
// se vacía y él crece. Ya grande, se va por la puerta hacia la luz. El padre al fin se da vuelta: solo queda la pelota.
(() => {
const { FLOOR, clamp, lerp, prog, smooth, easeOut, easeInOut, keyed, figure, STYLE, ctx, mix, stand, walk, poseAt, pulse, bump } = E;
const D = 19;
const C = { goDad: 1.6, tap: 3.0, wait: 3.35, back: 4.2, sitDoor: 5.6, grow0: 6.2, grow1: 10.6, rise: 11.0, lookDad: 11.6, turn: 12.4, open: 12.7, exit: 13.0, gone: 14.1, close: 14.3, stop: 15.0, off: 15.3, turnD: 15.7, see: 16.1, standD: 16.5, walkD: 16.9, kneel: 17.6, hold: 18.0 };
const DOORX = 118, DESKX = 512, CHAIRX = 408, KX = 205, BALLX = 240, HGX = 318, HGY = FLOOR - 330;

const sandP = t => keyed([[0, .08], [C.grow0, .16], [C.grow1, .86], [C.stop, .96], [C.kneel, 1]], t);
const age = t => smooth(prog(t, C.grow0, C.grow1));

// ── utilería propia ──
function monitor(on, refl) {
  const x = DESKX + 10, y = FLOOR - 80;
  ctx.fillStyle = '#2a2a2a'; ctx.fillRect(x - 4, y - 26, 8, 26); ctx.fillRect(x - 20, y - 4, 40, 4);
  ctx.save(); ctx.translate(x, y - 66);
  ctx.fillStyle = '#151515'; ctx.beginPath(); ctx.moveTo(-20, -38); ctx.lineTo(8, -33); ctx.lineTo(8, 33); ctx.lineTo(-20, 38); ctx.fill();
  if (!refl && on > 0) { ctx.shadowColor = '#ff2a2a'; ctx.shadowBlur = 40 * on; }
  ctx.fillStyle = on > 0 ? `rgba(255,55,45,${.95 * on})` : "#0d0d0d";
  ctx.beginPath(); ctx.moveTo(-17, -34); ctx.lineTo(4, -30); ctx.lineTo(4, 30); ctx.lineTo(-17, 34); ctx.fill();
  ctx.restore();
  if (on > 0 && !refl) E.glowCircle(x - 50, y - 70, 200, '255,30,30', .3 * on);
  // teclado
  ctx.fillStyle = '#3a3a3a'; ctx.fillRect(DESKX - 70, y - 5, 46, 5);
}

// ── padre ──
function dadPose(t) {
  const typing = k => {
    const p = E.sit(CHAIRX, { dir: 1, lean: .22, tilt: .12 });
    const ty = Math.sin(t * k) * 4, ty2 = Math.sin(t * k + 2) * 4;
    p.arms = [{ target: { x: DESKX - 54, y: FLOOR - 90 + ty } }, { target: { x: DESKX - 40, y: FLOOR - 90 + ty2 } }];
    return p;
  };
  const fast = 26 + 20 * age(t);
  const type = typing(fast);
  const wait = { ...type, arms: [{ ang: -1.75, bend: -.9 }, type.arms[1]], tilt: .05 };
  const stretch = { ...E.sit(CHAIRX, { dir: 1, lean: -.08, tilt: -.25 }), arms: [{ ang: 2.9, bend: .2 }, { ang: 2.7, bend: .2 }] };
  const turned = E.sit(CHAIRX - 6, { dir: -1, lean: .05, tilt: -.05, arms: [{ ang: .5, bend: .4 }, { ang: .3, bend: .4 }] });
  const seeing = E.sit(CHAIRX - 6, { dir: -1, lean: -.04, tilt: -.15, arms: [{ ang: .3, bend: .2 }, { ang: .2, bend: .2 }] });
  const up = stand(CHAIRX - 40, { t, dir: -1, lean: .1, tilt: .1 });
  const wx = lerp(CHAIRX - 40, BALLX + 50, easeInOut(prog(t, C.walkD, C.kneel)));
  const walking = walk(wx, -wx * 1.0, { dir: -1, lean: .15, tilt: .2, stride: .8 });
  const kneelP = E.kneel(BALLX + 50, { dir: -1, lean: .25, tilt: .45 });
  const ballH = { x: BALLX + 22, y: FLOOR - 98 };
  const holding = { ...E.kneel(BALLX + 50, { dir: -1, lean: .2, tilt: .3 }), arms: [{ target: ballH }, { target: { x: ballH.x + 8, y: ballH.y + 4 } }] };
  const reach = { ...kneelP, arms: [{ target: { x: BALLX + 4, y: FLOOR - 16 } }, { ang: .6, bend: .3 }] };
  if (t < C.stop) return poseAt(t, [[0, type], [C.wait - .15, type], [C.wait + .1, wait], [C.back + .2, wait], [C.back + .6, type]]);
  return poseAt(t, [[C.stop, type], [C.stop + .3, stretch], [C.turnD - .1, stretch], [C.turnD + .3, turned], [C.see, turned], [C.see + .2, seeing], [C.standD, seeing], [C.walkD, up], [C.walkD + .15, walking], [C.kneel - .15, walking], [C.kneel + .25, reach], [C.hold, holding]]);
}
// ── hijo ──
function kidPose(t) {
  const s = lerp(.5, 1, age(t));
  // ida y vuelta (caminar con la pelota)
  const goP = easeInOut(prog(t, C.goDad, C.tap - .2)), backP = easeInOut(prog(t, C.back, C.sitDoor - .2));
  const x = t < C.back ? lerp(KX, CHAIRX - 70, goP) : lerp(CHAIRX - 70, KX, backP);
  const bounce = stand(KX, { s, t, dir: 1, lean: .05, tilt: -.05 });
  bounce.arms = [{ ang: .9 + .25 * Math.sin(t * 7), bend: .3 }, { ang: .4, bend: .4 }];
  const going = walk(x, x * 1.8, { s, dir: 1, lean: .1 });
  const tap = stand(CHAIRX - 70, { s, t, dir: 1, lean: .1, tilt: -.25 });
  const dsh = E.shoulderOf(E.sit(CHAIRX, { dir: 1, lean: .22 }));
  tap.arms = [{ target: { x: dsh.x - 22, y: dsh.y + 30 } }, { ang: .3, bend: .4 }];
  const deny = stand(CHAIRX - 74, { s, t, dir: 1, lean: .2, tilt: .55 });
  const returning = walk(x, -x * 1.8, { s, dir: -1, lean: .2, tilt: .4, stride: .7 });
  const sitP = E.sit(KX, { s, ground: true, dir: 1, lean: .35, tilt: lerp(.35, .55, age(t)), arms: [{ ang: .9, bend: .4 }, { ang: .8, bend: .5 }] });
  const standW = stand(KX + 6, { s: 1, t, dir: 1, lean: .05, tilt: -.05 });
  const toDoor = stand(KX - 4, { s: 1, t, dir: -1, lean: .1, tilt: .2 });
  const ex = lerp(KX - 4, DOORX + 4, easeInOut(prog(t, C.exit, C.gone)));
  const leaving = walk(ex, -ex * 1.2, { s: 1, dir: -1, lean: .06, tilt: -.1 });
  if (t < C.goDad) return bounce;
  if (t < C.back) return poseAt(t, [[C.goDad, bounce], [C.goDad + .2, going], [C.tap - .2, going], [C.tap, tap], [C.wait + .15, tap], [C.wait + .45, deny], [C.back, deny]]);
  if (t < C.rise) return poseAt(t, [[C.back, deny], [C.back + .2, returning], [C.sitDoor - .2, returning], [C.sitDoor + .3, sitP], [C.rise, sitP]]);
  return poseAt(t, [[C.rise, sitP], [C.rise + .5, standW], [C.turn, standW], [C.turn + .3, toDoor], [C.exit, toDoor], [C.exit + .2, leaving]]);
}
// pelota: rebota en la mano del niño; la lleva; queda junto a la puerta
function ballPos(t, ksl) {
  if (t < C.goDad) { const h = E.hand(ksl, 0); const b = Math.abs(Math.sin(t * 3.5)); return { x: h.x + 4, y: lerp(FLOOR - 9, h.y + 6, 1 - b) }; }
  if (t < C.sitDoor) { const h = E.hand(ksl, 1); return { x: h.x + 2, y: h.y + 6 }; }
  return { x: BALLX, y: FLOOR - 9 };
}

window.SCENE = {
  id: '19-no-vuelve', title: 'El tiempo *no vuelve*', duration: D,
  spot: t => ({ x: keyed([[0, 260], [C.tap, 380], [C.grow0, 320], [C.turn, 180], [C.stop, 380], [C.kneel, 300]], t), r: 400 }),
  beam: t => ({ x: keyed([[0, KX], [C.tap, 380], [C.grow0, HGX], [C.turn, KX], [C.stop, 400], [C.kneel, BALLX + 30]], t), a: .05, w: 150 }),
  flashes: [C.open + .1],
  blackouts: [C.close],
  camera: t => {
    const zoom = keyed([[0, 2.3], [1.4, 2.0], [C.tap, 1.85], [C.wait, 2.15], [C.back + .3, 1.85], [C.sitDoor, 1.75], [C.grow0 + .3, 1.42], [C.grow1, 1.55], [C.lookDad, 1.9], [C.turn, 1.95], [C.gone, 1.65], [C.stop, 2.0], [C.see, 2.25], [C.walkD, 1.7], [C.hold, 1.95], [D, 2.1]], t);
    const x = keyed([[0, KX + 20], [1.4, KX + 60], [C.tap, 360], [C.wait, 372], [C.back + .3, 300], [C.sitDoor, 280], [C.grow0 + .3, 320], [C.grow1, 300], [C.lookDad, 250], [C.turn, 215], [C.gone, 200], [C.stop, 400], [C.see, 380], [C.walkD, 330], [C.hold, 285], [D, 280]], t);
    const y = keyed([[0, FLOOR - 170], [C.tap, FLOOR - 190], [C.sitDoor, FLOOR - 180], [C.grow0 + .3, FLOOR - 300], [C.grow1, FLOOR - 260], [C.lookDad, FLOOR - 200], [C.stop, FLOOR - 190], [C.hold, FLOOR - 170], [D, FLOOR - 160]], t);
    return { x, y, zoom, shake: .25 * pulse(t, C.close, .3) };
  },
  backdrop(t) {
    // reloj de arena gigante (el tiempo)
    ctx.save(); ctx.globalAlpha = .9;
    E.hourglass(HGX, HGY, sandP(t), 1.55);
    ctx.restore();
    if (t > C.grow0 && t < C.grow1 + .3) E.glowCircle(HGX, HGY, 160, '255,40,40', .12 * bump(t, C.grow0, C.grow1 + .3));
  },
  world(t, refl) {
    const op = smooth(prog(t, C.open, C.open + .35)) * (1 - smooth(prog(t, C.gone, C.close)));
    E.door(DOORX, FLOOR, op, 1, 80, 190);
    E.table(DESKX, 150, FLOOR, 80, '#5e5e5e');
    monitor(1 - smooth(prog(t, C.off, C.off + .25)), refl);
    E.chair(CHAIRX, 1, FLOOR, '#5a5a5a');
    const dsl = figure(dadPose(t), STYLE.hero);
    const kp = kidPose(t);
    const fade = 1 - smooth(prog(t, C.gone - .45, C.gone));
    let ksl = null;
    if (fade > 0) ksl = figure(kp, STYLE.hero, { alpha: fade });
    else ksl = E.solve(kp);
    // pelota
    let b = ballPos(t, ksl);
    if (t > C.kneel + .1) { const h = E.hand(E.solve(dadPose(t)), 0); const k = smooth(prog(t, C.kneel + .1, C.hold)); b = { x: lerp(BALLX, h.x - 6, k), y: lerp(FLOOR - 9, h.y + 4, k) }; }
    E.ball(b.x, b.y, 11 * (t < C.sitDoor ? lerp(.9, 1, age(t)) : 1));
    if (!refl) {
      // "espera": destello sobre la mano levantada
      if (t > C.wait && t < C.wait + 1) { const h = E.hand(dsl, 0); E.ring(h.x, h.y, t, C.wait + .05, { r: 40, life: .6, color: '255,255,255', width: 3 }); }
      // luz que sale de la puerta al irse
      if (op > 0) E.glowCircle(DOORX, FLOOR - 95, 260, '255,235,210', .22 * op);
      // última gota de arena
      E.ring(HGX, HGY + 86, t, C.kneel, { r: 70, life: 1, color: '255,70,60' });
    }
  },
  events() {
    const ev = [];
    for (let k = 0; k < 6; k++) ev.push({ t: .15 + k * (Math.PI / 3.5), type: 'thud', vol: .35 });
    // tecleo
    for (let tt = .1; tt < C.stop; tt += .11 + .05 * Math.sin(tt * 13)) if (!(tt > C.wait - .1 && tt < C.back + .6)) ev.push({ t: tt, type: 'tick', vol: .22 });
    ev.push(...E.footsteps(D, t => {
      const going = t > C.goDad && t < C.tap - .2 || t > C.back + .2 && t < C.sitDoor - .2;
      const kp = kidPose(t), dp = dadPose(t);
      return [going || (t > C.exit && t < C.gone) ? { phi: kp.phi || 0, size: lerp(.5, 1, age(t)), vol: .6 } : null,
              t > C.walkD && t < C.kneel - .15 ? { phi: dp.phi || 0, size: 1, vol: .7 } : null];
    }));
    return ev.concat([
      { t: C.tap, type: 'knock', vol: .35 },
      { t: C.wait + .05, type: 'whoosh', vol: .35 },
      { t: C.sitDoor + .3, type: 'thud', vol: .3 },
      { t: C.grow0, type: 'clock', dur: C.grow1 - C.grow0 }, { t: C.grow0, type: 'riser', dur: C.grow1 - C.grow0 },
      { t: C.open, type: 'door' }, { t: C.open + .1, type: 'swell', dur: 1.2 },
      { t: C.close, type: 'door', vol: .9 }, { t: C.close, type: 'boom', vol: .6 },
      { t: C.off, type: 'pop', vol: .4 },
      { t: C.see, type: 'heartbeat', vol: .8 }, { t: C.see + .8, type: 'heartbeat', vol: .6 },
      { t: C.kneel, type: 'tick', vol: .9 }, { t: C.hold, type: 'heartbeat', vol: .5 },
    ]);
  },
  music: {
    sections: [
      { t: .3, dur: C.grow0 - .3, style: 'tender', chords: ['C', 'G', 'Am', 'F'], chordLen: 1.2 },
      { t: C.grow0, dur: C.grow1 - C.grow0, style: 'build', chords: ['Am', 'F', 'C', 'G'], chordLen: .7 },
      { t: C.grow1, dur: C.close - C.grow1, style: 'sad', chords: ['Am', 'F', 'C', 'G'], chordLen: 1.0 },
      { t: C.see + .4, dur: D - C.see - .4, style: 'sad', chords: ['Am', 'Em', 'F', 'Am'], chordLen: 1.3 },
    ],
    stingers: [{ t: C.grow1, type: 'impact' }],
    duck: [[C.close + .1, C.see + .3]],
  },
};
})();
