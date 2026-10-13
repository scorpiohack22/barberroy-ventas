// 20 — TU LUZ: oscuridad total. Una chispa enciende una vela. Esa persona enciende la vela de la siguiente,
// y así en cadena, cada vez más rápido. Al final llega a alguien sentado en el suelo, derrotado: también se
// enciende y se levanta. Todos alzan sus velas: la luz no se apagó al compartirla, se multiplicó.
(() => {
const { FLOOR, clamp, lerp, prog, smooth, easeOut, easeInOut, keyed, figure, STYLE, ctx, mix, stand, walk, poseAt, pulse, bump } = E;
const D = 18;
const X = [118, 200, 282, 364, 446, 528];
const S = [1, .94, .62, 1, .9, 1];
const SITX = 640;
// tiempos de cada traspaso de luz (a la figura i): inicio y duración — cada vez más rápido
const DUR = [0, 2.0, 1.55, 1.15, .9, .75];
const START = [0, 2.3]; for (let i = 2; i < 6; i++) START[i] = START[i - 1] + DUR[i - 1];
const SPARK1 = .45, LIGHT0 = 1.0;
const touchT = i => i === 0 ? LIGHT0 : START[i] + .55 * DUR[i];
// la persona sentada
const L = { walk: START[5] + DUR[5] + .05 }; L.kneel = L.walk + .55; L.lift = L.kneel + .3; L.touch = L.kneel + .75; L.rise = L.touch + .5; L.stood = L.rise + .9;
const RAISE = L.stood + .25; // todos alzan las velas (ola)
const raiseT = i => RAISE + i * .13;

const STY = (lit) => E.mixStyle(STYLE.dim, STYLE.hero, lit);
// vela rotada en la mano
function candleAt(base, rot, t, lit, refl) {
  ctx.save(); ctx.translate(base.x, base.y); ctx.rotate(rot);
  E.candle(0, 0, t, refl ? lit * .6 : lit);
  ctx.restore();
}
const wickOf = (base, rot) => ({ x: base.x + Math.sin(rot) * 44, y: base.y - Math.cos(rot) * 44 });

function person(i, t) {
  const x = X[i], s = S[i];
  const base = (dir, o = {}) => stand(x, { s, t: t + i, dir, lean: o.lean ?? .05, tilt: o.tilt ?? .05 });
  const sh0 = E.shoulderOf(base(1));
  const chest = (p, dir) => { const sh = E.shoulderOf(p); return { x: sh.x + 18 * dir * s, y: sh.y + 42 * s }; };
  // fases como receptor (i) y como dador (i+1)
  let p, hand, rot = 0;
  const recv = i > 0 ? { S: START[i], d: DUR[i] } : null;
  const give = i < 5 ? { S: START[i + 1], d: DUR[i + 1] } : null;
  const meetY = (j) => (E.shoulderOf(stand(X[j], { s: S[j] })).y + E.shoulderOf(stand(X[j + 1], { s: S[j + 1] })).y) / 2 + 26;
  const mid = (j) => (X[j] + X[j + 1]) / 2;
  // dirección: los que esperan miran a la derecha; el receptor gira a la izquierda para recibir y vuelve
  let dir = 1;
  let reach = 0, tiltK = .05, lean = .05;
  if (recv) {
    const turnL = smooth(prog(t, recv.S, recv.S + .25 * recv.d)), turnR = smooth(prog(t, recv.S + .85 * recv.d, recv.S + recv.d));
    if (turnL > .5 && turnR < .5) dir = -1;
    if (t > recv.S && t < recv.S + recv.d) reach = bump(t, recv.S + .2 * recv.d, recv.S + .9 * recv.d);
  }
  if (give && t > give.S && t < give.S + give.d) reach = Math.max(reach, bump(t, give.S + .2 * give.d, give.S + .9 * give.d));
  p = base(dir, { lean, tilt: tiltK });
  const sh = E.shoulderOf(p);
  hand = chest(p, dir);
  // extender hacia el vecino
  if (reach > 0) {
    const j = recv && t > recv.S && t < recv.S + recv.d ? i - 1 : i;
    const meet = { x: mid(j) - 20 * dir, y: meetY(j) + 30 };
    hand = { x: lerp(hand.x, meet.x, clamp(reach * 1.4)), y: lerp(hand.y, meet.y, clamp(reach * 1.4)) };
    rot = .5 * dir * clamp(reach * 1.4);
    p.lean = .05 + .12 * reach; p.tilt = .35 * reach;
  }
  // antes de encenderse: cabeza baja; después: mira su llama
  const lit = smooth(prog(t, touchT(i), touchT(i) + .25));
  if (reach === 0) p.tilt = lerp(.3, .1, lit) - .15 * pulse(t, touchT(i) + .4, .6);
  // primera figura: se agacha sobre la chispa
  if (i === 0) {
    const strike = 1 - smooth(prog(t, LIGHT0 + .2, LIGHT0 + .9));
    p.lean += .2 * strike; p.tilt += .35 * strike;
    if (t < LIGHT0 + .9) { p.arms = [{ target: { x: hand.x, y: hand.y } }, { target: { x: hand.x + 4, y: hand.y - 52 + 10 * Math.sin(t * 30) * (t < LIGHT0 ? 1 : 0) } }]; }
  }
  // alzar todos
  const up = smooth(prog(t, raiseT(i), raiseT(i) + .5));
  if (up > 0) {
    const pu = stand(x, { s, t: t + i, dir: 1, lean: -.04, tilt: -.35 });
    const shu = E.shoulderOf(pu);
    p = mix(p, pu, up); dir = 1;
    hand = { x: lerp(hand.x, shu.x + 14 * s, up), y: lerp(hand.y, shu.y - 62 * s, up) };
    rot = lerp(rot, 0, up);
  }
  if (!p.arms || i !== 0 || t >= LIGHT0 + .9) p.arms = [{ target: { x: hand.x - 3 * dir, y: hand.y + 4 } }, up > 0 ? { ang: lerp(.2, -.5, up), bend: .2 } : { target: { x: hand.x + 6 * dir, y: hand.y + 10 } }];
  return { p, base: { x: hand.x, y: hand.y + 2 }, rot, lit, i };
}

function sitter(t) {
  const lit = smooth(prog(t, L.touch, L.touch + .25));
  const look = smooth(prog(t, L.lift - .2, L.lift + .3));
  const slump = E.sit(SITX, { ground: true, dir: -1, lean: lerp(.75, .35, look), tilt: lerp(.9, -.1, look) });
  const sl = E.solve({ ...slump, arms: [] });
  const knee = sl.legs[0][1];
  slump.feet = [{ x: SITX - 44, y: FLOOR }, { x: SITX - 36, y: FLOOR }];
  const k2 = E.solve({ ...slump, arms: [] }).legs[0][1];
  const holdK = { x: k2.x + 6, y: k2.y + 16 };
  const reachP = look * (1 - smooth(prog(t, L.touch + .2, L.rise)));
  let hand = { x: lerp(holdK.x, SITX - 50, reachP), y: lerp(holdK.y, FLOOR - 92, reachP) };
  slump.arms = [{ target: hand }, { target: { x: k2.x + 2, y: k2.y + 20 } }];
  const rising = E.crouch(SITX - 4, { dir: -1, amt: .5, tilt: -.1 });
  const standP = stand(SITX - 6, { t, dir: -1, lean: .02, tilt: -.1 });
  let p = poseAt(t, [[0, slump], [L.rise, slump], [L.rise + .45, rising], [L.stood, standP]]);
  let dir = -1;
  if (t > L.rise) { const sh = E.shoulderOf(p); hand = { x: sh.x - 16, y: sh.y + 42 }; p.arms = [{ target: hand }, { target: { x: hand.x + 4, y: hand.y + 10 } }]; }
  const up = smooth(prog(t, raiseT(6), raiseT(6) + .5));
  if (up > 0) { const pu = stand(SITX - 6, { t, dir: 1, lean: -.04, tilt: -.35 }); const shu = E.shoulderOf(pu); p = mix(p, pu, up); hand = { x: lerp(hand.x, shu.x + 14, up), y: lerp(hand.y, shu.y - 62, up) }; p.arms = [{ target: hand }, { ang: lerp(.2, -.5, up), bend: .2 }]; }
  const rot = t > L.kneel && t < L.rise ? -.5 * reachP : 0;
  return { p, base: { x: hand.x, y: hand.y + 2 }, rot, lit, i: 6 };
}
// la quinta figura camina hacia el sentado y se arrodilla
function giver5(t, q) {
  if (t < L.walk) return q;
  const x5 = lerp(X[5], SITX - 92, easeInOut(prog(t, L.walk, L.kneel)));
  const w = walk(x5, x5 * 1.2, { dir: 1, s: S[5] });
  const kn = E.kneel(SITX - 92, { dir: 1, lean: .25, tilt: .3 });
  const ksh = E.shoulderOf(kn);
  const reachK = bump(t, L.kneel, L.touch + .45);
  const hk = { x: lerp(ksh.x + 18, SITX - 62, reachK), y: lerp(ksh.y + 40, FLOOR - 92, reachK) };
  kn.arms = [{ target: hk }, { ang: .3, bend: .3 }];
  const backUp = stand(SITX - 92, { t, dir: 1, lean: 0, tilt: -.1 });
  const bsh = E.shoulderOf(backUp); backUp.arms = [{ target: { x: bsh.x + 18, y: bsh.y + 42 } }, { target: { x: bsh.x + 22, y: bsh.y + 52 } }];
  let p = poseAt(t, [[L.walk, q.p], [L.walk + .15, w], [L.kneel - .1, w], [L.kneel + .2, kn], [L.rise + .2, kn], [L.stood, backUp]]);
  let hand = t < L.kneel + .2 ? q.base : (t < L.rise + .2 ? hk : { x: bsh.x + 18, y: bsh.y + 42 });
  if (t < L.kneel + .2) { const sh = E.shoulderOf(p); hand = { x: sh.x + 18, y: sh.y + 42 }; p.arms = [{ target: hand }, { target: { x: hand.x + 6, y: hand.y + 10 } }]; }
  let rot = t > L.kneel && t < L.rise ? .5 * reachK : 0;
  const up = smooth(prog(t, raiseT(5), raiseT(5) + .5));
  if (up > 0) { const pu = stand(SITX - 92, { t, dir: 1, lean: -.04, tilt: -.35 }); const shu = E.shoulderOf(pu); p = mix(p, pu, up); hand = { x: lerp(hand.x, shu.x + 14, up), y: lerp(hand.y, shu.y - 62, up) }; p.arms = [{ target: hand }, { ang: lerp(.2, -.5, up), bend: .2 }]; rot = 0; }
  return { ...q, p, base: { x: hand.x, y: hand.y + 2 }, rot };
}
function cast(t) {
  const ps = [0, 1, 2, 3, 4, 5].map(i => person(i, t));
  ps[5] = giver5(t, ps[5]);
  ps.push(sitter(t));
  return ps;
}
const litCount = t => [0, 1, 2, 3, 4, 5, 6].reduce((n, i) => n + smooth(prog(t, i === 6 ? L.touch : touchT(i), (i === 6 ? L.touch : touchT(i)) + .4)), 0);
const focusX = t => keyed([[0, X[0]], [START[1], X[0] + 20], [touchT(1), X[1]], [touchT(2), X[2]], [touchT(3), X[3] + 20], [touchT(4), X[4] + 20], [touchT(5), X[5]], [L.kneel, SITX - 50], [L.stood, SITX - 70], [RAISE, 385], [RAISE + 2.4, 385], [D, 575]], t);

// capa de oscuridad con agujeros de luz (en pantalla)
const dark = document.createElement('canvas'); dark.width = 1080; dark.height = 1920;
const dctx = dark.getContext('2d');

window.SCENE = {
  id: '20-tu-luz', title: 'Tu luz *no se apaga* al compartirla', duration: D,
  spot: t => ({ x: focusX(t), r: lerp(160, 520, litCount(t) / 7), a: lerp(.03, .12, litCount(t) / 7) }),
  beam: t => ({ x: focusX(t), a: .03 * litCount(t) / 7 + .05 * smooth(prog(t, RAISE, RAISE + 1.5)), w: 260 }),
  sky: t => .25 * smooth(prog(t, RAISE, RAISE + 2)),
  flashes: [LIGHT0],
  camera: t => {
    const zoom = keyed([[0, 2.6], [LIGHT0 + .4, 2.45], [START[1], 2.2], [touchT(1), 2.35], [touchT(2), 2.1], [touchT(3), 1.95], [touchT(4), 1.8], [touchT(5), 1.75], [L.kneel, 2.0], [L.touch + .3, 2.3], [L.stood, 1.9], [RAISE + .3, 1.2], [RAISE + 2.4, 1.17], [D, 1.75]], t);
    const y = keyed([[0, FLOOR - 200], [START[1], FLOOR - 190], [L.kneel, FLOOR - 150], [L.touch + .3, FLOOR - 130], [L.stood, FLOOR - 190], [RAISE + .3, FLOOR - 250], [RAISE + 2.4, FLOOR - 260], [D, FLOOR - 215]], t);
    return { x: focusX(t) + (t < START[1] ? 10 : 0), y, zoom, shake: .2 * pulse(t, LIGHT0, .3) };
  },
  backdrop(t) {
    // estrellas que aparecen al final (la luz que se comparte llega lejos)
    const a = smooth(prog(t, RAISE + .6, RAISE + 2.5));
    if (a > 0) { const g = E.rng(17); for (let k = 0; k < 70; k++) { const x = -100 + g() * 920, y = FLOOR - 200 - g() * 700, tw = .5 + .5 * Math.sin(t * 3 + k); E.glowCircle(x, y, 6 + g() * 6, '255,220,170', a * .5 * tw); } }
  },
  world(t, refl) {
    const ps = cast(t);
    for (const q of ps) {
      const sl = figure(q.p, STY(.15 + .85 * q.lit));
      candleAt(q.base, q.rot, t + q.i * 1.7, q.lit, refl);
    }
    if (!refl) {
      // chispas del cerillo
      for (const [st, n] of [[SPARK1, 12], [LIGHT0 - .05, 26]]) { const w = wickOf(ps[0].base, ps[0].rot); E.burst(w.x, w.y, t, st, { n, speed: 150, color: '255,200,120', size: 2.5, life: .5, gravity: 1, seed: n }); }
      // destello en cada traspaso
      for (let i = 1; i < 7; i++) {
        const tt = i === 6 ? L.touch : touchT(i), q = ps[i], w = wickOf(q.base, q.rot);
        E.ring(w.x, w.y, t, tt, { r: 60, life: .6, color: '255,190,120', width: 4 });
        E.burst(w.x, w.y, t, tt, { n: 14, speed: 120, color: '255,210,150', size: 2, life: .5, gravity: .4, seed: i * 7 });
      }
      // alzar: brasas que suben
      if (t > RAISE) {
        const g = E.rng(23);
        for (let k = 0; k < 60; k++) {
          const q = ps[k % 7], st = RAISE + (k / 60) * 3.5 + g() * .4, p = prog(t, st, st + 2.6);
          if (p <= 0 || p >= 1) continue;
          const w = wickOf(q.base, q.rot);
          E.glowCircle(w.x + Math.sin(k + p * 6) * 20, w.y - 20 - p * 380, 8, '255,190,110', .9 * Math.sin(Math.PI * p));
        }
      }
    }
  },
  front(t) {
    const ps = cast(t), n = litCount(t);
    const base = lerp(.93, .3, n / 7) - .15 * smooth(prog(t, RAISE, RAISE + 2));
    const m = ctx.getTransform();
    dctx.setTransform(1, 0, 0, 1, 0, 0); dctx.globalCompositeOperation = 'source-over';
    dctx.clearRect(0, 0, 1080, 1920);
    dctx.fillStyle = `rgba(0,0,0,${clamp(base)})`; dctx.fillRect(0, 0, 1080, 1920);
    dctx.globalCompositeOperation = 'destination-out';
    const holes = [];
    for (const q of ps) if (q.lit > 0) holes.push([wickOf(q.base, q.rot), q.lit]);
    for (const st of [SPARK1, LIGHT0 - .05]) { const k = pulse(t, st, .25); if (k > 0) holes.push([wickOf(ps[0].base, ps[0].rot), k]); }
    for (const [w, a] of holes) {
      const pt = m.transformPoint(new DOMPoint(w.x, w.y)), r = (150 + 8 * Math.sin(t * 9 + w.x)) * m.a / 1.5 * 1.0;
      const g = dctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, r);
      g.addColorStop(0, `rgba(0,0,0,${a})`); g.addColorStop(.55, `rgba(0,0,0,${.6 * a})`); g.addColorStop(1, 'rgba(0,0,0,0)');
      dctx.fillStyle = g; dctx.fillRect(pt.x - r, pt.y - r, r * 2, r * 2);
    }
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(dark, 0, 0); ctx.restore();
    // brillo cálido sumado sobre las llamas
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const [w, a] of holes) E.glowCircle(w.x, w.y, 70, '255,150,60', .18 * a);
    ctx.restore();
  },
  events() {
    const ev = [
      { t: SPARK1, type: 'snap', vol: .7 }, { t: LIGHT0 - .05, type: 'snap', vol: .8 }, { t: LIGHT0, type: 'fire', dur: 2.5, vol: .5 },
      { t: LIGHT0 + .05, type: 'whoosh', vol: .4 },
    ];
    const notes = [72, 74, 76, 79, 81, 84];
    for (let i = 1; i < 6; i++) ev.push({ t: touchT(i), type: 'bell', note: notes[i - 1], vol: .7 }, { t: touchT(i), type: 'sparkle', vol: .5 });
    ev.push({ t: L.touch, type: 'bell', note: 84, vol: .9 }, { t: L.touch + .05, type: 'heartbeat', vol: .6 });
    ev.push({ t: L.walk + .1, type: 'step', size: 1, vol: .5 }, { t: L.walk + .35, type: 'step', size: 1, vol: .5 });
    ev.push({ t: L.rise + .3, type: 'swell', dur: 1.3 }, { t: RAISE, type: 'riser', dur: .9 }, { t: RAISE + .9, type: 'cheer', dur: 2.5, vol: .4 }, { t: RAISE + .9, type: 'fire', dur: 3, vol: .4 });
    return ev;
  },
  music: {
    sections: [
      { t: LIGHT0, dur: START[3] - LIGHT0, style: 'tender', chords: ['Am', 'F', 'C', 'G'], chordLen: 1.3 },
      { t: START[3], dur: L.walk - START[3], style: 'build', chords: ['F', 'G', 'Am', 'C'], chordLen: .65 },
      { t: L.walk, dur: L.rise - L.walk, style: 'tender', chords: ['F', 'C'], chordLen: 1 },
      { t: L.rise, dur: D - L.rise, style: 'epic', chords: ['F', 'C', 'G', 'C'], chordLen: 1.2 },
    ],
    stingers: [{ t: RAISE + .9, type: 'bells' }, { t: L.touch, type: 'chime' }],
    duck: [[L.kneel - .2, L.touch]],
  },
};
})();
