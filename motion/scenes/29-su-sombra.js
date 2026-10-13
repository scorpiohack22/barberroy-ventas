// 29 — SU SOMBRA: un anciano planta y riega un brote, se sienta a su lado e imagina el árbol.
// Pasa el tiempo: él se deshace en luz que sube al árbol; el árbol crece enorme con flores rojas.
// Un niño llega corriendo y se sienta a su sombra donde se sentaba el anciano; caen pétalos. El recuerdo del anciano sonríe.
(() => {
const { FLOOR, clamp, lerp, prog, smooth, easeOut, easeIn, easeInOut, keyed, bump, pulse, figure, mix, poseAt, stand, walk, run, sit, kneel, mixStyle, STYLE, ctx, glowCircle, burst, ring, rays, sun, moon, tree, sprout, cane, bubble, rng } = E;
const D = 19;
const CUE = { can: 1.3, pour: 1.8, pourEnd: 3.3, sitT: 3.9, dream: 4.9, dreamEnd: 6.9, tl0: 7.4, fade0: 8.6, fade1: 10.4, tl1: 11.4, kid: 12.2, kidStop: 13.4, kidSit: 14.0, petal: 15.0, ghost: 15.4, ghostOut: 17.6 };
const TX = 404, SEAT = 300;
// mixStyle del motor solo acepta hex: convertir para poder encadenar
const toHex = c => c[0] === '#' ? c : '#' + c.match(/\d+/g).slice(0, 3).map(v => (+v).toString(16).padStart(2, '0')).join('');
const mixS = (a, b, p) => { const m = mixStyle(a, b, p); return { ...m, near: toHex(m.near), far: toHex(m.far) }; };
const OLD = mixS(STYLE.hero, STYLE.gray, .35);

function canDraw(x, y, rot) { // regadera: x,y = asa
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.fillStyle = '#9aa0a6'; ctx.strokeStyle = '#c9ced3'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.roundRect(-14, 4, 30, 24, 4); ctx.fill();
  ctx.beginPath(); ctx.arc(1, 6, 10, Math.PI, 0); ctx.stroke();
  ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(14, 12); ctx.lineTo(32, -2); ctx.stroke();
  ctx.restore();
}
const canTip = (x, y, rot) => ({ x: x + Math.cos(rot) * 32 - Math.sin(rot) * -2, y: y + Math.sin(rot) * 32 + Math.cos(rot) * -2 });

function oldPose(t) {
  const pat = t => { const p = kneel(328, { lean: .78, tilt: .5 }); const b = Math.abs(Math.sin(t * 9)) * 6;
    p.arms = [{ target: { x: TX - 10, y: FLOOR - 6 - b } }, { target: { x: TX + 8, y: FLOOR - 4 - Math.abs(Math.sin(t * 9 + 1.5)) * 6 } }]; return p; };
  const grab = { ...kneel(328, { lean: .7, tilt: .3 }), arms: [{ target: { x: 300, y: FLOOR - 26 } }, { target: { x: TX, y: FLOOR - 6 } }] };
  const pour = t => { const p = kneel(328, { lean: .3, tilt: .45 }); p.arms = [{ target: { x: 368, y: FLOOR - 76 } }, { target: { x: 376, y: FLOOR - 92 } }]; return p; };
  const put = { ...kneel(326, { lean: .65, tilt: .3 }), arms: [{ target: { x: 300, y: FLOOR - 26 } }, { ang: .4, bend: .3 }] };
  const seated = t => { const p = sit(SEAT, { ground: true, lean: .14, tilt: .3 }); p.hip.y += Math.sin(t * 2) * .8; p.arms = [{ target: { x: SEAT + 52, y: FLOOR - 36 } }, { target: { x: SEAT - 26, y: FLOOR - 4 } }]; return p; };
  const dream = t => { const p = seated(t); p.tilt = -.4; p.lean = .02; return p; };
  const tender = t => { const p = seated(t); p.tilt = .35; p.lean = .2; p.arms = [{ target: { x: TX - 20, y: FLOOR - 24 } }, { target: { x: SEAT - 26, y: FLOOR - 4 } }]; return p; };
  return poseAt(t, [[0, pat], [CUE.can - .2, pat], [CUE.can + .2, grab], [CUE.pour, pour], [CUE.pourEnd, pour], [CUE.pourEnd + .35, put], [CUE.sitT, seated],
    [CUE.dream - .2, seated], [CUE.dream + .3, dream], [CUE.dreamEnd, dream], [CUE.dreamEnd + .5, tender], [D, tender]]);
}
function canState(t, sl) {
  if (t < CUE.can + .2 || t > CUE.pourEnd + .35) return { x: 300, y: FLOOR - 28, rot: 0 };
  const h = E.hand(sl, 0);
  const rot = .55 * smooth(prog(t, CUE.pour, CUE.pour + .3)) * (1 - smooth(prog(t, CUE.pourEnd - .2, CUE.pourEnd + .1)));
  return { x: h.x - 2, y: h.y - 6, rot };
}

const kidD = E.distance([[0, 0], [CUE.kid, 260], [CUE.kidStop - .3, 230], [CUE.kidStop, 0], [D, 0]], D);
function kidPose(t) {
  const runP = t => { const d = kidD(t) - kidD(CUE.kid); return run(-60 + d, d, { s: .55, tilt: -.25 }); };
  const xs = -60 + kidD(CUE.kidStop) - kidD(CUE.kid);
  const look = t => stand(xs, { s: .55, t, tilt: -.6, lean: -.05 });
  const seated = t => { const p = sit(SEAT + 4, { ground: true, s: .55, lean: .02, tilt: -.45 }); p.arms = [{ target: { x: SEAT + 30, y: FLOOR - 62 - 4 * smooth(prog(t, CUE.petal - .4, CUE.petal)) } }, { target: { x: SEAT - 12, y: FLOOR - 3 } }]; return p; };
  return poseAt(t, [[CUE.kid, runP], [CUE.kidStop - .15, runP], [CUE.kidStop + .2, look], [CUE.kidSit, look], [CUE.kidSit + .55, seated], [D, seated]]);
}

const growth = t => keyed([[CUE.tl0, 0], [8.4, .18], [9.6, .45], [10.6, .78], [CUE.tl1, 1]], t);
const bloom = t => smooth(prog(t, 10.4, CUE.tl1 + .4));
const sunTh = t => 2.6 - .3 * prog(t, 0, CUE.tl0) + easeInOut(prog(t, CUE.tl0, CUE.tl1)) * Math.PI * 6;
const PETALS = (() => { const r = rng(17), a = []; for (let i = 0; i < 90; i++) a.push({ t0: 11.4 + r() * 7.4, x: TX + (r() - .5) * 340, y: FLOOR - 230 - r() * 180, sp: 38 + r() * 30, ph: r() * 6, s: .7 + r() * .6 }); return a; })();
function petal(x, y, rot, s, a) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.globalAlpha *= a;
  ctx.fillStyle = '#ff4a40'; ctx.shadowColor = '#ff2a2a'; ctx.shadowBlur = 8;
  ctx.beginPath(); ctx.ellipse(0, 0, 5 * s, 2.8 * s, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
}

window.SCENE = {
  id: '29-su-sombra', title: 'Planta árboles *cuya sombra* no verás', duration: D, cue: CUE,
  spot: t => ({ x: keyed([[0, 380], [CUE.tl1, 390]], t), r: keyed([[0, 300], [CUE.tl1, 430]], t) }),
  beam: t => ({ x: 390, a: .05 * (1 - bump(t, CUE.tl0, CUE.tl1)), w: keyed([[0, 150], [CUE.tl1, 260]], t) }),
  sky: t => { const s = Math.sin(sunTh(t)); return clamp(.15 + .6 * Math.max(0, s)) * (t < CUE.tl1 + .5 ? 1 : .6); },
  flashes: [CUE.tl1], blackouts: [],
  camera: t => ({
    zoom: keyed([[0, 2.45], [CUE.can, 2.35], [CUE.pourEnd, 2.2], [CUE.sitT + .3, 1.95], [CUE.dream + .5, 1.8], [CUE.dreamEnd, 1.9], [CUE.tl0, 1.95], [CUE.tl1, 1.32], [CUE.kid + .5, 1.4], [CUE.kidSit, 1.6], [CUE.ghost + .6, 1.7], [CUE.ghostOut, 1.62], [D, 1.3]], t),
    x: keyed([[0, 382], [CUE.can, 370], [CUE.pourEnd, 375], [CUE.sitT + .3, 350], [CUE.dream + .5, 350], [CUE.dreamEnd, 345], [CUE.tl0, 352], [CUE.tl1, 392], [CUE.kid + .5, 360], [CUE.kidSit, 355], [CUE.ghost + .6, 375], [D, 385]], t),
    y: keyed([[0, FLOOR - 110], [CUE.can, FLOOR - 120], [CUE.pourEnd, FLOOR - 120], [CUE.sitT + .3, FLOOR - 150], [CUE.dream + .5, FLOOR - 205], [CUE.dreamEnd, FLOOR - 170], [CUE.tl0, FLOOR - 160], [CUE.tl1, FLOOR - 300], [CUE.kid + .5, FLOOR - 270], [CUE.kidSit, FLOOR - 230], [CUE.ghost + .6, FLOOR - 230], [D, FLOOR - 300]], t),
    shake: 0,
  }),
  backdrop(t) {
    const th = sunTh(t), s = Math.sin(th), a = t > CUE.tl1 + .6 ? 1 - smooth(prog(t, CUE.tl1 + .6, CUE.tl1 + 1.6)) : 1;
    if (s > -.05) sun(390 - Math.cos(th) * 280, FLOOR - 40 - s * 360, 36, a);
    else moon(390 + Math.cos(th) * 280, FLOOR - 40 + s * 360, 24, .8 * a);
  },
  world(t, refl) {
    const g = growth(t);
    // brote (antes de que el árbol lo reemplace)
    const sp = keyed([[0, .45], [CUE.pour + .3, .45], [CUE.pourEnd, .8], [CUE.tl0, .8]], t);
    if (g < .1) { ctx.save(); ctx.globalAlpha *= 1 - g * 10; sprout(TX, FLOOR, sp, 1.1); ctx.restore(); }
    // tierra removida
    ctx.fillStyle = '#2a2622'; ctx.beginPath(); ctx.ellipse(TX, FLOOR + 2, 26, 5, 0, 0, Math.PI * 2); ctx.fill();
    if (g > 0) tree(TX, FLOOR, g, 5, 1.22, bloom(t));
    if (!refl && bloom(t) > 0) glowCircle(TX, FLOOR - 330, 300, '255,40,30', .12 * bloom(t));
    // bastón en el suelo (se queda para siempre)
    cane({ x: 262, y: FLOOR - 5 }, { x: 330, y: FLOOR - 3 }, '#bdbdbd');
    // anciano
    const fadeO = 1 - smooth(prog(t, CUE.fade0, CUE.fade1));
    let osl = null;
    if (fadeO > 0) osl = figure(oldPose(t), mixS(OLD, STYLE.dim, 1 - fadeO), { alpha: fadeO });
    const cs = canState(t, osl || E.solve(oldPose(t)));
    ctx.save(); ctx.globalAlpha *= 1 - smooth(prog(t, CUE.fade0, CUE.fade1)); canDraw(cs.x, cs.y, cs.rot); ctx.restore();
    if (!refl) {
      // agua
      if (t > CUE.pour + .2 && t < CUE.pourEnd) {
        const tip = canTip(cs.x, cs.y, cs.rot), r = rng(Math.floor(t * 30));
        for (let i = 0; i < 9; i++) { const k = ((t * 3 + i / 9) % 1); ctx.fillStyle = `rgba(190,215,255,${.75 * (1 - k * .5)})`;
          ctx.beginPath(); ctx.ellipse(lerp(tip.x, TX + (r() - .5) * 10, k), lerp(tip.y, FLOOR - 8, k * k), 1.6, 3.2, 0, 0, Math.PI * 2); ctx.fill(); }
      }
      burst(TX, FLOOR - 30, t, CUE.pourEnd - .3, { n: 16, speed: 80, seed: 3, color: '210,255,200', gravity: -.4, size: 2.5, life: 1.2 });
      // sueño del anciano: el árbol que no verá
      const ba = smooth(prog(t, CUE.dream, CUE.dream + .5)) * (1 - smooth(prog(t, CUE.dreamEnd - .3, CUE.dreamEnd + .2)));
      bubble(400, FLOOR - 250, 1.3, ba, (cx, cy) => {
        ctx.strokeStyle = '#e8e2d6'; ctx.lineWidth = 4; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(cx, cy + 28); ctx.lineTo(cx, cy + 2); ctx.moveTo(cx, cy + 8); ctx.lineTo(cx - 12, cy - 4); ctx.moveTo(cx, cy + 4); ctx.lineTo(cx + 12, cy - 6); ctx.stroke();
        for (const [dx, dy, r] of [[-14, -10, 11], [0, -18, 13], [14, -10, 11], [-6, -4, 9], [8, -2, 9]]) glowCircle(cx + dx, cy + dy, r * 1.8, '255,60,50', .9);
        ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(cx - 22, cy + 28, 44, 2);
      });
      // se deshace en luz que sube al árbol
      if (t > CUE.fade0 - .2 && t < CUE.fade1 + 1.4) {
        const r = rng(9);
        for (let i = 0; i < 60; i++) {
          const sx = SEAT - 10 + r() * 60, sy = FLOOR - 10 - r() * 120, dl = r() * 1.2, dur = 1.4 + r() * .6;
          const k = clamp((t - CUE.fade0 - dl) / dur); if (k <= 0 || k >= 1) continue;
          const tx = TX + (r() - .5) * 200, ty = FLOOR - 200 - r() * 200;
          const x = lerp(sx, tx, easeInOut(k)) + Math.sin(k * 7 + i) * 12, y = lerp(sy, ty, easeInOut(k));
          glowCircle(x, y, 7, k > .6 ? '255,110,90' : '255,255,255', .6 * Math.sin(Math.PI * k));
        }
      }
      ring(TX, FLOOR - 300, t, CUE.tl1, { color: '255,80,70', r: 330, width: 8, life: 1.3 });
    }
    // niño
    if (t > CUE.kid) figure(kidPose(t), STYLE.hero);
    // recuerdo del anciano junto al tronco
    const ga = smooth(prog(t, CUE.ghost, CUE.ghost + .7)) * (1 - smooth(prog(t, CUE.ghostOut - .6, CUE.ghostOut + .3)));
    if (ga > 0 && !refl) {
      const gp = stand(452, { dir: -1, t, tilt: .3, lean: .08 }); gp.arms = [{ target: { x: TX + 10, y: FLOOR - 140 } }, { ang: .1, bend: .3 }];
      glowCircle(452, FLOOR - 120, 120, '255,255,255', .08 * ga);
      figure(gp, { near: '#ffffff', far: '#cfcfcf', glow: .7 }, { alpha: .4 * ga, noShadow: true });
    }
    // pétalos
    if (!refl) for (const p of PETALS) {
      const dt = t - p.t0; if (dt < 0) continue;
      const fallT = (FLOOR - 2 - p.y) / p.sp, k = Math.min(dt, fallT);
      const x = p.x + Math.sin(k * 1.8 + p.ph) * 22 + k * 8, y = p.y + k * p.sp;
      petal(x, y, dt < fallT ? Math.sin(dt * 3 + p.ph) * 1.2 : p.ph, p.s, Math.min(1, dt * 3));
    }
    // un pétalo cae en la mano del niño
    if (!refl && t > CUE.petal - 1.6) {
      const k = clamp((t - (CUE.petal - 1.6)) / 1.6), hx = SEAT + 30, hy = FLOOR - 66;
      petal(lerp(hx - 30, hx, k) + Math.sin(k * 6) * 14 * (1 - k), lerp(FLOOR - 330, hy, k), Math.sin(t * 3) * (1 - k), 1.3, 1);
      if (k >= 1) glowCircle(hx, hy, 30, '255,60,50', .35 + .1 * Math.sin(t * 4));
    }
  },
  events() {
    const ev = [];
    for (let t = .05; t < CUE.can - .2; t += .22) ev.push({ t, type: 'scuff', vol: .35 });
    ev.push(...E.footsteps(D, t => [t > CUE.kid && t < CUE.kidStop ? { phi: (kidD(t) - kidD(CUE.kid)) / (4 * 34 * .55), size: .55 } : null]));
    return ev.concat([
      { t: 0, type: 'wind', dur: 3, vol: .5 }, { t: .02, type: 'chime', vol: .5 },
      { t: CUE.can + .1, type: 'clatter', vol: .3 }, { t: CUE.pour + .25, type: 'rain', dur: 1.4, vol: .35 }, { t: CUE.pourEnd - .3, type: 'sparkle', vol: .6 },
      { t: CUE.sitT, type: 'thud', vol: .4 }, { t: CUE.dream, type: 'bell', note: 79 }, { t: CUE.dream + .4, type: 'sparkle', vol: .5 },
      { t: CUE.tl0, type: 'clock', dur: CUE.tl1 - CUE.tl0 }, { t: CUE.tl0 + .2, type: 'riser', dur: 3.8 }, { t: CUE.fade0, type: 'swell', dur: 2 },
      { t: CUE.tl1, type: 'impact' }, { t: CUE.tl1, type: 'sparkle' }, { t: CUE.tl1 + .2, type: 'wind', dur: 6, vol: .35 },
      { t: CUE.kid + .3, type: 'cheer', dur: 1, vol: .25 }, { t: CUE.kidSit + .5, type: 'thud', vol: .3 }, { t: CUE.petal, type: 'chime' },
      { t: CUE.ghost + .3, type: 'bell', note: 84 },
    ]);
  },
  music: {
    sections: [
      { t: 0, dur: CUE.tl0 + .2, style: 'tender', chords: ['C', 'G', 'Am', 'F'], chordLen: 1.4 },
      { t: CUE.tl0, dur: CUE.tl1 - CUE.tl0, style: 'build', chords: ['Am', 'F', 'C', 'G'], chordLen: .7 },
      { t: CUE.tl1, dur: D - CUE.tl1, style: 'hope', chords: ['F', 'C', 'G', 'Am'], chordLen: 1.6 },
    ],
    stingers: [{ t: CUE.tl1, type: 'bells' }, { t: CUE.ghost + .3, type: 'chime' }],
    duck: [],
  },
};
})();
