// 17 — NO JUZGUES: bajo la lluvia, un hombre empapado tiembla; tres con paraguas lo señalan y murmuran.
// La cámara se mueve: detrás de él, un niño seco bajo su paraguas, envuelto en su abrigo rojo.
// Los que señalaban bajan los brazos avergonzados; uno se acerca y lo cubre con su paraguas.
(() => {
const { FLOOR, clamp, lerp, prog, smooth, easeOut, easeInOut, keyed, distance, figure, STYLE, ctx, mix, stand, walk, poseAt, umbrella, pulse } = E;
const D = 18;
const C = { thunder: .25, p1: 1.25, p2: 1.75, p3: 2.2, murmur: 2.6, glance: 4.7, back: 5.9, pan: 5.5, reveal: 7.0, kidLook: 7.6, shame1: 8.6, shame2: 9.0, shame3: 9.4, walk: 10.8, arrive: 12.6, cover: 13.0, lookUp: 13.5 };
const MX = 330, KIDX = 182, AX = [480, 572, 650];

function manPose(t) {
  const tr = Math.sin(t * 58) * 1.4 * (1 - .7 * smooth(prog(t, C.cover, C.cover + 1.5)));
  const base = (dir, tilt, lean) => {
    const p = stand(MX, { t, dir, lean, tilt });
    const sh = E.shoulderOf(p);
    p.hip.x += tr;
    p.arms = [{ target: { x: sh.x + 4 * dir + tr, y: sh.y + 26 }, elbowBack: false }, { target: { x: sh.x + 12 * dir + tr, y: sh.y + 18 } }];
    return p;
  };
  const hunched = base(1, .45, .2), front = base(1, .15, .12), glance = base(-1, .35, .12), up = base(1, -.2, .02);
  return poseAt(t, [[0, front], [C.p1, front], [C.p3 + .3, hunched], [C.glance, hunched], [C.glance + .35, glance], [C.back - .3, glance], [C.back, hunched], [C.cover, hunched], [C.lookUp, up]]);
}

const aWalk = distance([[0, 0], [C.walk, 0], [C.walk + .3, 30], [C.arrive - .3, 30], [C.arrive, 0], [30, 0]], 30);
function accuser(i, t) {
  const p0 = [C.p1, C.p2, C.p3][i], sh0 = [C.shame1, C.shame2, C.shame3][i];
  let x = AX[i];
  if (i === 0) x = AX[0] - aWalk(t);
  const nod = Math.sin(t * 4 + i * 2) * .12 * smooth(prog(t, C.murmur, C.murmur + .4)) * (1 - smooth(prog(t, C.reveal - .4, C.reveal)));
  const toNeighbor = i === 1 ? .1 * Math.sin(t * 2.3) : 0;
  const shame = smooth(prog(t, sh0, sh0 + .7));
  let p = walk(x, i === 0 ? aWalk(t) : 0, { dir: -1, lean: lerp(-.03, .22, shame), tilt: lerp(-.05 + nod + toNeighbor, .5, shame), freeze: i === 0 && t > C.walk && t < C.arrive ? 0 : 1 });
  if (!(i === 0 && t > C.walk && t < C.arrive)) p = { ...p, ...stand(x, { t: t + i, dir: -1, lean: p.lean, tilt: p.tilt }) };
  // brazo cercano: anticipación (se recoge) → señala con fuerza → baja avergonzado
  const wind = smooth(prog(t, p0 - .3, p0)), thrust = E.backOut(prog(t, p0, p0 + .3));
  const jab = Math.sin(t * 9 + i) * .06 * smooth(prog(t, C.murmur, C.murmur + .3)) * (1 - shame);
  const pointA = lerp(lerp(.15, -.4, wind), 1.6 + jab, clamp(thrust)) ;
  const ang = lerp(pointA, .1, shame);
  p.arms = [{ ang, bend: lerp(lerp(.3, 1.4, wind * (1 - clamp(thrust))), 0, clamp(thrust)) * (1 - shame) + .25 * shame }, null];
  // paraguas en la mano lejana
  const sh = E.shoulderOf(p);
  const cover = i === 0 ? smooth(prog(t, C.arrive - .2, C.cover + .3)) : 0;
  const ux = lerp(sh.x + 2, MX + 30, cover), uy = lerp(FLOOR - 262, FLOOR - 270, cover);
  p.arms[1] = { target: { x: ux - 4, y: uy + 78 } };
  if (cover > 0) { p.arms[0] = { ang: lerp(ang, .2, cover), bend: .3 }; p.lean = lerp(p.lean, .02, cover); p.tilt = lerp(p.tilt, .2, cover); }
  return { p, ux, uy };
}

function kidPose(t) {
  const look = smooth(prog(t, C.kidLook, C.kidLook + .5));
  const p = E.sit(KIDX, { s: .6, ground: true, dir: 1, lean: lerp(.25, .05, look), tilt: lerp(.3, -.35, look) });
  const sh = E.shoulderOf(p);
  p.arms = [{ target: { x: KIDX + 18, y: FLOOR - 74 } }, { target: { x: sh.x + 14, y: sh.y + 16 } }];
  return p;
}
const kidUmb = { x: KIDX + 20, y: FLOOR - 150 };

// abrigo rojo grande sobre el niño
function coat(sl, refl) {
  const s = sl.s, sh = sl.sh, hip = sl.hip;
  ctx.save();
  if (!refl) { ctx.shadowColor = '#ff2a2a'; ctx.shadowBlur = 22; }
  const g = ctx.createLinearGradient(sh.x - 20, sh.y, hip.x + 20, hip.y);
  g.addColorStop(0, '#ff5a52'); g.addColorStop(1, '#b8221f');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(sh.x - 16 * s, sh.y - 14 * s);
  ctx.quadraticCurveTo(sh.x + 30 * s, sh.y - 18 * s, sh.x + 30 * s, sh.y + 20 * s);
  ctx.lineTo(hip.x + 56 * s, hip.y + 8);
  ctx.lineTo(hip.x - 34 * s, hip.y + 10);
  ctx.quadraticCurveTo(hip.x - 40 * s, sh.y + 10, sh.x - 16 * s, sh.y - 14 * s);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(sh.x + 4, sh.y); ctx.lineTo(hip.x + 10, hip.y + 6); ctx.stroke();
  ctx.restore();
}

function cast(t) {
  return { man: manPose(t), acc: [0, 1, 2].map(i => accuser(i, t)), kid: kidPose(t) };
}
function umbrellasOf(t, c) {
  return [{ x: kidUmb.x, y: kidUmb.y, sc: .85 }, ...c.acc.map((a, i) => ({ x: a.ux, y: a.uy, sc: i === 0 ? lerp(1, 1.15, smooth(prog(t, C.arrive, C.cover + .3))) : 1 }))];
}
const rainA = t => lerp(1, .55, smooth(prog(t, C.cover, D)));

window.SCENE = {
  id: '17-no-juzgues', title: 'No juzgues *sin saber*', duration: D,
  spot: t => ({ x: keyed([[0, 420], [C.pan, 420], [C.reveal, 300], [C.walk, 330], [D, 360]], t), r: 400 }),
  beam: t => ({ x: keyed([[0, MX], [C.pan, MX], [C.reveal, KIDX + 20], [C.shame1, KIDX + 60], [C.cover, MX], [D, MX]], t), a: .05 + .04 * smooth(prog(t, C.reveal - .5, C.reveal)), w: 140 }),
  flashes: [C.thunder, C.thunder + .2, 8.1],
  blackouts: [],
  camera: t => {
    const zoom = keyed([[0, 2.35], [1.0, 2.1], [C.p2, 2.3], [C.p3 + .4, 1.95], [C.murmur + 1, 2.05], [C.glance, 2.25], [C.pan, 2.2], [C.reveal, 1.8], [C.kidLook + .6, 2.0], [C.shame1 - .2, 1.85], [C.shame3 + .6, 1.65], [C.walk + .6, 1.75], [C.cover, 1.85], [C.lookUp + 1.5, 1.9], [D, 1.6]], t);
    const x = keyed([[0, 390], [1.0, 420], [C.p2, 430], [C.p3 + .4, 440], [C.glance, 360], [C.pan, 340], [C.reveal, 235], [C.kidLook + .6, 225], [C.shame1 - .2, 330], [C.shame3 + .6, 420], [C.walk + .6, 400], [C.cover, 315], [C.lookUp + 1.5, 300], [D, 310]], t);
    const y = keyed([[0, FLOOR - 220], [C.p2, FLOOR - 240], [C.glance, FLOOR - 210], [C.reveal, FLOOR - 170], [C.kidLook + .6, FLOOR - 165], [C.shame3 + .6, FLOOR - 210], [C.cover, FLOOR - 220], [D, FLOOR - 230]], t);
    return { x, y, zoom, shake: .35 * pulse(t, C.thunder + .1, .4) };
  },
  backdrop(t) {
    E.cloud(200, FLOOR - 470, 2.4, '#151518', 1); E.cloud(520, FLOOR - 500, 2.8, '#121215', 1);
    // relámpago lejano
    const L = Math.max(pulse(t, C.thunder, .08), pulse(t, C.thunder + .2, .06), .6 * pulse(t, 8.1, .07));
    if (L > 0) {
      ctx.save(); ctx.strokeStyle = `rgba(255,255,255,${L})`; ctx.lineWidth = 3; ctx.shadowColor = '#fff'; ctx.shadowBlur = 30;
      ctx.beginPath(); ctx.moveTo(560, FLOOR - 520); ctx.lineTo(530, FLOOR - 430); ctx.lineTo(556, FLOOR - 420); ctx.lineTo(515, FLOOR - 300); ctx.stroke(); ctx.restore();
    }
    // farol con luz cálida
    ctx.strokeStyle = '#3a3a3a'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(90, FLOOR); ctx.lineTo(90, FLOOR - 300); ctx.lineTo(118, FLOOR - 300); ctx.stroke();
    E.glowCircle(118, FLOOR - 290, 120, '255,200,140', .18);
  },
  world(t, refl) {
    const c = cast(t);
    // niño (detrás, a la izquierda)
    const ks = figure(c.kid, STYLE.hero);
    coat(ks, refl);
    umbrella(kidUmb.x, kidUmb.y, .85, -.08, 1);
    // acusadores (al fondo los de atrás primero)
    for (let i = 2; i >= 0; i--) {
      const a = c.acc[i];
      const st = i === 0 ? STYLE.gray : E.mixStyle(STYLE.gray, STYLE.dim, .25 * i);
      figure(a.p, st);
      umbrella(a.ux, a.uy, i === 0 ? lerp(1, 1.15, smooth(prog(t, C.arrive, C.cover + .3))) : 1, 0, 1, i === 0 ? '#cfcfcf' : '#9c9c9c');
    }
    const ms = figure(c.man, STYLE.hero);
    if (!refl) {
      // gotas que escurren del hombre
      const g = E.rng(7);
      for (let k = 0; k < 9; k++) {
        const ph = (t * 1.4 + g()) % 1, ox = (g() - .5) * 40;
        ctx.fillStyle = `rgba(210,220,235,${.6 * (1 - ph)})`;
        ctx.beginPath(); ctx.ellipse(ms.hip.x + ox, lerp(ms.sh.y + 20, FLOOR, ph), 1.6, 4, 0, 0, Math.PI * 2); ctx.fill();
      }
      // vaho de frío
      const br = (t * .8) % 1;
      if (t < C.cover + 1) { ctx.fillStyle = `rgba(230,230,240,${.18 * Math.sin(Math.PI * br)})`; ctx.beginPath(); ctx.arc(ms.head.x + 26 + br * 30, ms.head.y + 6 - br * 14, 6 + br * 12, 0, Math.PI * 2); ctx.fill(); }
      // destello de revelación sobre el niño
      E.ring(KIDX + 10, FLOOR - 60, t, C.reveal, { r: 120, life: 1.2, color: '255,80,70' });
      E.glowCircle(KIDX + 10, FLOOR - 50, 110, '255,60,50', .25 * smooth(prog(t, C.reveal - .3, C.reveal + .5)));
      if (t > C.cover) E.burst(MX + 10, FLOOR - 250, t, C.cover + .1, { n: 22, speed: 140, color: '255,255,255', gravity: .2, life: 1.2, size: 3 });
    }
  },
  front(t) {
    const c = cast(t), us = umbrellasOf(t, c);
    ctx.save();
    ctx.beginPath(); ctx.rect(-400, 0, 1600, FLOOR + 40);
    for (const u of us) { const w = 60 * u.sc; ctx.moveTo(u.x - w, u.y + 6); ctx.lineTo(u.x - w * 1.15, FLOOR + 10); ctx.lineTo(u.x + w * 1.15, FLOOR + 10); ctx.lineTo(u.x + w, u.y + 6); ctx.closePath(); }
    ctx.clip('evenodd');
    E.rain(t, -100, 820, 300, FLOOR, rainA(t), 3);
    E.rain(t + 3.3, -100, 820, 300, FLOOR, rainA(t) * .6, 8);
    ctx.restore();
  },
  events() {
    return [
      { t: 0, type: 'rain', dur: D, vol: .9 },
      { t: C.thunder, type: 'boom', vol: 1 }, { t: C.thunder + .05, type: 'rumble', dur: 2.2, vol: .8 },
      { t: C.p1, type: 'whoosh', vol: .5 }, { t: C.p2, type: 'whoosh', vol: .5 }, { t: C.p3, type: 'whoosh', vol: .55 },
      { t: C.murmur, type: 'crowd', dur: 2.6, vol: .55 },
      { t: C.glance + .2, type: 'heartbeat', vol: .5 }, { t: C.glance + .9, type: 'heartbeat', vol: .4 },
      { t: C.pan, type: 'whoosh', vol: .6 }, { t: C.reveal, type: 'chime' },
      { t: 8.1, type: 'rumble', dur: 1.6, vol: .5 },
      { t: C.shame1, type: 'scuff', vol: .4 }, { t: C.shame3, type: 'scuff', vol: .4 },
      ...[0, 1, 2, 3, 4, 5].map(k => ({ t: C.walk + .35 + k * .3, type: 'step', size: 1, vol: .6 })),
      { t: C.cover, type: 'scuff', vol: .5 }, { t: C.cover, type: 'rain', dur: .6, vol: .4 }, { t: C.cover + .1, type: 'sparkle' },
    ];
  },
  music: {
    sections: [
      { t: .6, dur: C.glance - .6, style: 'tension', chords: ['Am', 'Em'], chordLen: 1.2 },
      { t: C.glance, dur: C.reveal - C.glance, style: 'sad', chords: ['Am', 'F'], chordLen: 1.1 },
      { t: C.reveal, dur: C.walk - C.reveal, style: 'tender', chords: ['F', 'C', 'Am', 'G'], chordLen: 1.0 },
      { t: C.walk, dur: D - C.walk, style: 'hope', chords: ['F', 'C', 'G', 'C'], chordLen: 1.5 },
    ],
    stingers: [{ t: C.reveal, type: 'impact' }, { t: C.cover, type: 'bells' }],
    duck: [[C.glance + .4, C.reveal - .2]],
  },
};
})();
