// 18 — TORMENTA: un hombre sentado con una nube negra que llueve solo sobre él. Todos pasan sin mirar.
// Uno se detiene, entra a la lluvia, se sienta a su lado y lo abraza. La nube se encoge, sale el sol rojo
// y se levantan juntos.
(() => {
const { FLOOR, clamp, lerp, prog, smooth, easeOut, easeInOut, keyed, figure, STYLE, ctx, mix, stand, walk, poseAt, pulse, bump } = E;
const D = 19;
const C = { bolt: .25, f_in: 3.7, f_stop: 5.4, f_look: 5.7, f_hand: 6.3, f_enter: 6.9, f_sit: 7.6, f_sat: 8.4, hug: 8.8, lean: 9.4, shrink: 10.8, gone: 12.6, sun: 12.4, look: 13.0, f_up: 14.4, give: 15.1, m_up: 15.4, stood: 16.4, walk: 17.0 };
const MX = 300, CLX = 312;

// ── hombre sentado abrazando sus rodillas ──
function manPose(t) {
  const sob = Math.sin(t * 7) * .03 * (1 - smooth(prog(t, C.hug, C.shrink)));
  const hunch = (lean, tilt) => {
    const p = { hip: { x: MX, y: FLOOR - 12 }, s: 1, dir: 1, lean: lean + sob, tilt, feet: [{ x: MX + 44, y: FLOOR }, { x: MX + 36, y: FLOOR }] };
    const sl = E.solve({ ...p, arms: [] });
    const knee = sl.legs[0][1];
    p.arms = [{ target: { x: knee.x + 4, y: knee.y + 10 } }, { target: { x: knee.x - 2, y: knee.y + 14 } }];
    return p;
  };
  const sad = hunch(.62, .85), toFriend = hunch(.5, .55), lookUp = hunch(.2, -.3);
  const standing = stand(MX + 6, { t, lean: 0, tilt: -.2 });
  const rising = { ...E.crouch(MX + 10, { amt: .6, tilt: -.2 }) };
  let p = poseAt(t, [[0, sad], [C.lean - .3, sad], [C.lean + .3, toFriend], [C.look - .2, toFriend], [C.look + .5, lookUp], [C.m_up, lookUp], [C.m_up + .5, rising], [C.stood, standing]]);
  if (t > C.give && t < C.stood + .2) {
    const fh = friendHand(t);
    p = { ...p, arms: [{ target: fh }, p.arms ? p.arms[1] : { ang: .1, bend: .3 }] };
  }
  if (t > C.stood) {
    p.arms = [{ ang: .15, bend: .3 }, { ang: .1, bend: .3 }];
  }
  return p;
}
// ── el amigo: llega por la izquierda, se detiene al borde de la lluvia, entra y se sienta detrás de él ──
const F0 = 2.4;
const fdist = E.distance([[0, 125], [C.f_stop - .45, 125], [C.f_stop, 0], [C.f_enter, 0], [C.f_enter + .15, 90], [C.f_sit - .1, 90], [C.f_sit, 0], [30, 0]], 30);
const friendX = t => -130 + Math.max(0, fdist(t) - fdist(F0));
const FX = MX - 62; // donde se sienta
function friendPose(t) {
  const x = friendX(t), d = fdist(t);
  const walking = walk(x, d, { dir: 1, lean: .08 });
  const stopped = stand(x, { t, dir: 1, lean: .02, tilt: .1 });
  const looking = stand(x, { t, dir: 1, lean: .12, tilt: .45 });
  const hand = { ...looking, arms: [{ ang: 1.3, bend: .15 }, { ang: .1, bend: .3 }], tilt: -.25, lean: -.02 };
  const msh = E.shoulderOf(manPose(Math.max(t, C.lean + .3)));
  const sitP = { hip: { x: FX, y: FLOOR - 12 }, s: 1, dir: 1, lean: .42, tilt: .35, feet: [{ x: FX + 40, y: FLOOR }, { x: FX + 32, y: FLOOR }],
    arms: [{ target: { x: msh.x + 6, y: msh.y - 4 }, elbowUp: true }, { target: { x: msh.x - 6, y: msh.y + 18 } }] };
  const sitNoArm = { ...sitP, arms: [{ ang: .8, bend: .6 }, { ang: .9, bend: .5 }] };
  const crouchDown = E.crouch(FX + 4, { dir: 1, amt: .8, tilt: .3 });
  const up = stand(FX - 6, { t, dir: 1, lean: .25, tilt: .3 });
  const giveHand = { ...up, arms: [{ target: friendHand(t) }, { ang: .1, bend: .3 }] };
  const sideBy = stand(MX - 60, { t, dir: 1, lean: 0, tilt: -.2 });
  const msh2 = E.shoulderOf(stand(MX + 6, { t, lean: 0 }));
  sideBy.arms = [{ target: { x: msh2.x + 2, y: msh2.y - 2 }, elbowUp: true }, { ang: .1, bend: .3 }];
  if (t < C.f_stop) return walking;
  return poseAt(t, [
    [C.f_stop, walking], [C.f_stop + .3, stopped], [C.f_look, stopped], [C.f_look + .3, looking], [C.f_hand, looking], [C.f_hand + .3, hand],
    [C.f_enter, hand], [C.f_enter + .3, t > C.f_enter && t < C.f_sit ? walk(x, d, { dir: 1, lean: .1 }) : looking],
    [C.f_sit, walk(x, d, { dir: 1, lean: .1, freeze: 1 })], [C.f_sit + .4, crouchDown], [C.f_sat, sitNoArm], [C.hug, sitNoArm], [C.hug + .4, sitP],
    [C.f_up - .1, sitP], [C.f_up + .3, crouchDown], [C.give - .1, up], [C.give + .2, giveHand], [C.stood - .1, giveHand], [C.stood + .4, stand(MX - 60, { t, dir: 1, lean: 0, tilt: -.15 })], [C.walk, sideBy],
  ]);
}
function friendHand(t) {
  const lift = smooth(prog(t, C.m_up, C.stood));
  return { x: MX - 22, y: lerp(FLOOR - 92, FLOOR - 118, lift) };
}

// pasantes (grises): no miran
function passers(t) {
  const out = [];
  // 1: derecha → izquierda, rápido
  { const d = 120 * (t + 1.5), x = 820 - d; if (x > -120) out.push({ p: walk(x, d, { dir: -1, lean: .06 }), st: STYLE.gray }); }
  // 2: izquierda → derecha con el celular
  { const d = 110 * (t + .2), x = 60 + d; if (x < 820) { const p = walk(x, d, { dir: 1, lean: .1, tilt: .45 }); const sh = E.shoulderOf(p); p.arms = [{ target: { x: sh.x + 26, y: sh.y + 10 } }, { target: { x: sh.x + 22, y: sh.y + 14 } }]; out.push({ p, st: STYLE.gray, phone: true }); } }
  // 3: al fondo, de derecha a izquierda
  { const d = 120 * (t - .3), x = 860 - d; if (t > .3 && x > -120) out.push({ p: walk(x, d, { dir: -1, lean: .04, s: .85, y: FLOOR - 26 }), st: STYLE.dim, back: true }); }
  return out;
}

const cloudSc = t => lerp(1, .05, easeInOut(prog(t, C.shrink, C.gone)));
const rainA = t => (1 - smooth(prog(t, C.shrink + .3, C.gone - .3)));
const SUNX = 470;
const sunY = t => lerp(FLOOR + 60, FLOOR - 230, easeOut(prog(t, C.sun, C.sun + 3)));

window.SCENE = {
  id: '18-tormenta', title: 'No dejes a nadie *solo* en su tormenta', duration: D,
  spot: t => ({ x: keyed([[0, MX], [C.f_hand, MX - 50], [C.hug, MX - 20], [D, MX + 40]], t), r: 380, a: lerp(.06, .14, smooth(prog(t, C.sun, C.sun + 2))) }),
  beam: t => ({ x: CLX, a: lerp(.025, .07, smooth(prog(t, C.sun, C.sun + 2))), w: 160 }),
  sky: t => .9 * smooth(prog(t, C.sun, C.sun + 2.5)),
  flashes: [C.bolt, C.gone],
  blackouts: [],
  camera: t => {
    const zoom = keyed([[0, 2.45], [1.0, 2.1], [2.6, 1.7], [C.f_stop, 1.8], [C.f_hand, 2.05], [C.f_sat, 1.95], [C.lean, 2.45], [C.shrink, 2.35], [C.gone, 1.8], [C.look + 1, 1.7], [C.stood, 1.85], [D, 1.65]], t);
    const x = keyed([[0, MX + 10], [2.6, MX + 10], [C.f_stop, MX - 50], [C.f_hand, MX - 45], [C.f_sat, MX - 10], [C.lean, MX - 5], [C.gone, MX + 30], [C.stood, MX + 20], [D, MX + 40]], t);
    const y = keyed([[0, FLOOR - 190], [2.6, FLOOR - 210], [C.f_sat, FLOOR - 170], [C.lean, FLOOR - 120], [C.shrink, FLOOR - 140], [C.gone, FLOOR - 240], [C.look + 1, FLOOR - 250], [C.stood, FLOOR - 220], [D, FLOOR - 240]], t);
    return { x, y, zoom, shake: .3 * pulse(t, C.bolt + .05, .35) };
  },
  backdrop(t) {
    const sy = sunY(t);
    if (t > C.sun) {
      E.rays(SUNX, sy, t, smooth(prog(t, C.sun + .8, C.sun + 3)), '255,60,50', 16, 800);
      E.sun(SUNX, sy, 52);
    }
  },
  world(t, refl) {
    // pasantes del fondo
    for (const q of passers(t).filter(q => q.back)) figure(q.p, q.st);
    const f = friendPose(t), m = manPose(t);
    const friendFront = t > C.f_sit; // al sentarse queda delante: su brazo pasa sobre la espalda del otro
    if (!friendFront) figure(f, STYLE.hero);
    const msl = figure(m, E.mixStyle(STYLE.gray, STYLE.hero, .35 + .65 * smooth(prog(t, C.shrink, C.sun + 1.5))));
    if (friendFront) figure(f, STYLE.hero);
    for (const q of passers(t).filter(q => !q.back)) {
      const sl = figure(q.p, q.st);
      if (q.phone) E.phone(E.hand(sl, 0).x + 2, E.hand(sl, 0).y - 6, -.3, 1, .8);
    }
    if (!refl) {
      // gotas sobre el amigo cuando extiende la mano
      if (t > C.f_hand && t < C.f_enter + .3) {
        const sl = E.solve(f), h = E.hand(sl, 0);
        E.burst(h.x, h.y, t, Math.floor((t - C.f_hand) * 4) / 4 + C.f_hand, { n: 6, speed: 60, color: '200,210,230', size: 2, life: .25, seed: Math.floor(t * 4) });
      }
      // calor del abrazo
      const warm = smooth(prog(t, C.hug + .3, C.hug + 1.2)) * (1 - smooth(prog(t, C.gone, C.gone + 1)));
      if (warm > 0) { E.glowCircle(MX - 10, FLOOR - 70, 140, '255,60,50', .22 * warm); }
      E.ring(MX - 10, FLOOR - 80, t, C.hug + .4, { r: 140, life: 1.1, color: '255,90,80' });
      // corazón entre los dos
      const hp = prog(t, C.lean + .2, C.lean + 2.6);
      if (hp > 0 && hp < 1) E.heart(MX + 10, FLOOR - 160 - 90 * hp, 18 + 8 * Math.sin(Math.PI * hp), '#ff3b36', Math.sin(Math.PI * hp));
      if (t > C.stood) {
        E.burst(MX - 20, FLOOR - 260, t, C.stood, { n: 30, speed: 220, color: '255,225,190', gravity: .3, life: 1.4 });
      }
    }
  },
  front(t) {
    const sc = cloudSc(t), a = rainA(t);
    const cy = FLOOR - 330 + 30 * (1 - sc);
    // lluvia solo en la columna bajo la nube
    if (a > 0) {
      const w = 90 * Math.max(sc, .3);
      ctx.save(); ctx.beginPath(); ctx.rect(CLX - w, cy + 10, w * 2, FLOOR - cy); ctx.clip();
      E.rain(t, CLX - w, CLX + w, cy + 10, FLOOR, a * .9, 4);
      E.rain(t + 2.1, CLX - w, CLX + w, cy + 10, FLOOR, a * .7, 6);
      ctx.restore();
    }
    if (sc > .06) {
      // nube negra con relámpago interno
      const L = Math.max(pulse(t, C.bolt, .1), pulse(t, C.bolt + .22, .07), .5 * pulse(t, 4.6, .08));
      E.cloud(CLX, cy, 1.05 * sc, L > 0 ? E.mixCol([30, 30, 34], [200, 200, 210], L) : '#1d1d21', clamp(sc * 1.5));
      if (L > .3) {
        ctx.save(); ctx.strokeStyle = `rgba(255,255,255,${L})`; ctx.lineWidth = 3; ctx.shadowColor = '#fff'; ctx.shadowBlur = 20;
        ctx.beginPath(); ctx.moveTo(CLX - 6, cy + 30); ctx.lineTo(CLX - 22, cy + 80); ctx.lineTo(CLX - 4, cy + 84); ctx.lineTo(CLX - 26, cy + 150); ctx.stroke(); ctx.restore();
      }
    }
    // la nube se deshace en chispas
    E.burst(CLX, cy, t, C.gone - .2, { n: 34, speed: 200, color: '255,255,255', gravity: .1, life: 1.2, size: 3, seed: 4 });
    E.ring(CLX, cy, t, C.gone - .15, { r: 200, life: 1, color: '255,255,255' });
  },
  events() {
    const ev = E.footsteps(D, t => {
      const f = friendPose(t);
      const ps = passers(t);
      return [
        t < 6 ? { phi: 120 * (t + 1.5) / 88, size: 1, vol: .5 } : null,
        t < 6.5 ? { phi: 110 * (t + .2) / 88, size: 1, vol: .45 } : null,
        t > F0 && (t < C.f_stop || (t > C.f_enter && t < C.f_sit)) ? { phi: fdist(t) / 88, size: 1, vol: .8 } : null,
      ];
    });
    return ev.concat([
      { t: 0, type: 'rain', dur: C.gone + .3, vol: .8 },
      { t: C.bolt, type: 'crack', vol: .9 }, { t: C.bolt + .05, type: 'rumble', dur: 2.5, vol: .9 },
      { t: 4.6, type: 'rumble', dur: 1.5, vol: .5 },
      { t: 1.6, type: 'notify', vol: .3, pan: -.4 },
      { t: C.f_hand + .2, type: 'scuff', vol: .4 },
      { t: C.f_sat, type: 'thud', vol: .5 },
      { t: C.hug + .4, type: 'heartbeat', vol: .7 }, { t: C.hug + 1.2, type: 'heartbeat', vol: .55 }, { t: C.hug + 2.0, type: 'heartbeat', vol: .4 },
      { t: C.shrink, type: 'riser', dur: C.gone - C.shrink },
      { t: C.gone - .15, type: 'sparkle' }, { t: C.gone - .1, type: 'whoosh', vol: .6 },
      { t: C.sun + .3, type: 'swell', dur: 2.5 },
      { t: C.stood, type: 'chime' },
    ]);
  },
  music: {
    sections: [
      { t: .5, dur: C.f_stop - .5, style: 'sad', chords: ['Am', 'Em', 'F', 'G'], chordLen: 1.2 },
      { t: C.f_stop, dur: C.hug - C.f_stop, style: 'tension', chords: ['Am'], chordLen: 2 },
      { t: C.hug, dur: C.gone - C.hug, style: 'tender', chords: ['F', 'C', 'Am', 'G'], chordLen: 1.0 },
      { t: C.gone, dur: D - C.gone, style: 'epic', chords: ['F', 'C', 'G', 'C'], chordLen: 1.3 },
    ],
    stingers: [{ t: C.hug + .4, type: 'impact' }, { t: C.gone, type: 'bells' }],
    duck: [[C.f_look, C.f_enter]],
  },
};
})();
