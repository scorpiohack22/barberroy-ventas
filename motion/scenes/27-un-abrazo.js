// 27 — UN ABRAZO: dos personas discuten (rayos rojos entre ellas; los pedazos caen al piso). Se dan la espalda.
// Una duda… y vuelve: la abraza por detrás. La otra se da vuelta y la abraza. Los pedazos se vuelven corazones.
(() => {
const { FLOOR, clamp, lerp, prog, smooth, easeOut, easeIn, easeInOut, keyed, bump, pulse, figure, mix, poseAt, stand, walk, sad, mixStyle, STYLE, ctx, glowCircle, burst, ring, rays, heart, rng, shoulderOf } = E;
const D = 19;
const CUE = { big: 4.4, away: 5.0, glance: 8.0, back: 8.45, turnA: 9.2, step: 9.5, doubt: 9.9, go: 10.3, hugBack: 11.35, lift: 11.9, turnB: 12.4, hug: 13.0 };
const SA = [.15, 1.55, 2.95], SB = [.85, 2.25, 3.65];
const SB_S = .86;

const shoutAmt = (t, beats) => Math.max(0, ...beats.map(b => bump(t, b - .08, b + .62)), bump(t, CUE.big - .15, CUE.big + .7));
function arguer(x, dir, s, t, beats, other) {
  const a = shoutAmt(t, beats), lis = Math.max(0, ...other.map(b => bump(t, b - .05, b + .55)));
  const p = stand(x + dir * (10 * a - 8 * lis), { dir, s, t, lean: .04 + .28 * a - .12 * lis, tilt: -.15 * a + .12 * lis });
  // apuntar con el brazo / puño atrás al gritar; manos abiertas al escuchar
  p.arms = [{ ang: lerp(lerp(.15, .9, lis), 1.55, a), bend: lerp(.3, .05, a) }, { ang: lerp(lerp(-.1, .7, lis), -.5, a), bend: lerp(.3, 1.6, a) }];
  return p;
}
function crossed(x, dir, s, t, tilt = .4) {
  const p = stand(x, { dir, s, t, tilt, lean: .06 });
  const sh = shoutOfP(p);
  p.arms = [{ target: { x: sh.x + dir * 16 * s, y: sh.y + 36 * s } }, { target: { x: sh.x + dir * 20 * s, y: sh.y + 28 * s } }];
  return p;
}
const shoutOfP = p => shoulderOf(p);

function poseA(t) {
  const arg = t => arguer(290, 1, 1, t, SA, SB);
  const turnAway = crossed(262, -1, 1, CUE.away + 1);
  const glance = t => { const p = crossed(262, 1, 1, t, .1); p.arms = [{ ang: .2, bend: .3 }, { ang: .1, bend: .3 }]; return p; };
  const doubt = t => { const p = stand(300, { t, tilt: .35, lean: .05 }); p.arms = [{ ang: .9, bend: .4 }, { ang: .1, bend: .2 }]; return p; };
  const walkTo = t => { const d = keyed([[CUE.go, 0], [CUE.hugBack - .15, 136]], t, x => x); return walk(300 + d, d, { tilt: .15, stride: .85 }); };
  const backHug = t => { const p = stand(442, { t, lean: .16, tilt: .45 });
    const bs = shoulderOf(stand(474, { s: SB_S }));
    p.arms = [{ target: { x: bs.x + 22, y: bs.y + 26 } }, { target: { x: bs.x + 18, y: bs.y + 44 } }]; return p; };
  const frontHug = t => { const sw = Math.sin((t - CUE.hug) * 1.7) * 2.5; const p = stand(418 + sw * .3, { t, lean: .2, tilt: .35 });
    p.arms = [{ target: { x: 474, y: FLOOR - 136 } }, { target: { x: 470, y: FLOOR - 114 } }]; return p; };
  return poseAt(t, [[0, arg], [CUE.away, arg], [CUE.away + .35, stand(290, { dir: -1, tilt: .2 })], [CUE.away + 1, turnAway], [CUE.glance, turnAway],
    [CUE.glance + .2, glance], [CUE.back, glance], [CUE.back + .2, turnAway], [CUE.turnA, turnAway], [CUE.turnA + .3, stand(270, { tilt: .2 })],
    [CUE.step + .3, doubt], [CUE.go, doubt], [CUE.go + .2, walkTo], [CUE.hugBack - .15, walkTo], [CUE.hugBack + .3, backHug], [CUE.turnB, backHug], [CUE.hug, frontHug], [D, frontHug]]);
}
function poseB(t) {
  const arg = t => arguer(442, -1, SB_S, t, SB, SA);
  const turnAway = crossed(474, 1, SB_S, CUE.away + 1, .45);
  const held = t => { const p = stand(474, { s: SB_S, t, tilt: lerp(.45, -.2, smooth(prog(t, CUE.lift - .2, CUE.lift + .3))), lean: .02 });
    p.arms = [{ target: { x: 478, y: FLOOR - 128 } }, { target: { x: 474, y: FLOOR - 118 } }]; return p; };
  const frontHug = t => { const sw = Math.sin((t - CUE.hug) * 1.7) * 2.5; const p = stand(480 + sw * .3, { s: SB_S, dir: -1, t, lean: .2, tilt: .2 });
    p.arms = [{ target: { x: 424, y: FLOOR - 130 } }, { target: { x: 428, y: FLOOR - 108 } }]; return p; };
  return poseAt(t, [[0, arg], [CUE.away + .1, arg], [CUE.away + .45, stand(440, { s: SB_S, tilt: .2 })], [CUE.away + 1.05, turnAway], [CUE.hugBack, turnAway],
    [CUE.hugBack + .3, held], [CUE.turnB, held], [CUE.turnB + .25, stand(476, { s: SB_S, dir: -1, tilt: 0 })], [CUE.hug, frontHug], [D, frontHug]]);
}

// rayos en zigzag entre las cabezas
function bolt(a, b, t, seed, w = 1) {
  const g = rng(seed * 97 + Math.floor(t * 24)), n = 7, pts = [];
  const nx = -(b.y - a.y), ny = b.x - a.x, L = Math.hypot(nx, ny);
  for (let i = 0; i <= n; i++) { const p = i / n, o = (i === 0 || i === n) ? 0 : (g() - .5) * 64 * w; pts.push({ x: lerp(a.x, b.x, p) + nx / L * o, y: lerp(a.y, b.y, p) + ny / L * o }); }
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.shadowColor = '#ff2a2a'; ctx.shadowBlur = 26;
  for (const [col, lw] of [['rgba(255,40,35,.9)', 10 * w], ['#ffe0d8', 3 * w]]) {
    ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.stroke();
  }
  ctx.restore();
  glowCircle((a.x + b.x) / 2, (a.y + b.y) / 2, 90 * w, '255,40,30', .25);
}
// fragmentos rojos que caen al piso tras cada grito
const SHARDS = (() => { const r = rng(5), out = []; [...SA, ...SB, CUE.big, CUE.big + .05, CUE.big + .1].forEach((b, k) => { for (let j = 0; j < 2; j++) out.push({ t0: b + .45, x0: 345 + r() * 40, y0: FLOOR - 190 + r() * 20, x1: 310 + r() * 140, rot: r() * 6, sz: 5 + r() * 4, ph: r() * 6 }); }); return out; })();
function shard(x, y, rot, sz, a) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.globalAlpha *= a;
  ctx.fillStyle = '#ff3b36'; ctx.shadowColor = '#ff2a2a'; ctx.shadowBlur = 12;
  ctx.beginPath(); ctx.moveTo(-sz, sz * .4); ctx.lineTo(0, -sz); ctx.lineTo(sz * .8, sz * .6); ctx.closePath(); ctx.fill(); ctx.restore();
}

window.SCENE = {
  id: '27-un-abrazo', title: 'Un abrazo *lo arregla* todo', duration: D, cue: CUE,
  spot: t => ({ x: keyed([[0, 365], [CUE.go, 365], [CUE.hugBack, 450]], t), r: 360 }),
  beam: t => ({ x: keyed([[0, 365], [CUE.go, 365], [CUE.hugBack, 450]], t), a: .04 + .05 * smooth(prog(t, CUE.hug, CUE.hug + 1)), w: 170 }),
  sky: t => .35 * bump(t, 0, CUE.away + .6) + .4 * smooth(prog(t, CUE.hug, CUE.hug + 2)),
  flashes: [CUE.big, CUE.hug], blackouts: [CUE.away + .9],
  camera: t => {
    const punch = SA.concat(SB).reduce((m, b) => m + .07 * pulse(t, b + .1, .25), 0) + .12 * pulse(t, CUE.big + .1, .35);
    return {
      zoom: keyed([[0, 2.45], [CUE.big, 2.3], [CUE.away + .8, 1.7], [CUE.glance, 1.95], [CUE.turnA, 2.05], [CUE.go, 1.9], [CUE.hugBack, 2.15], [CUE.turnB, 2.35], [CUE.hug, 2.4], [CUE.hug + 1.5, 2.1], [D, 1.65]], t) + punch,
      x: keyed([[0, 365], [CUE.big, 365], [CUE.away + .8, 368], [CUE.glance, 300], [CUE.turnA, 300], [CUE.go, 340], [CUE.hugBack, 445], [CUE.turnB, 455], [CUE.hug, 450], [D, 450]], t),
      y: keyed([[0, FLOOR - 210], [CUE.away + .8, FLOOR - 190], [CUE.glance, FLOOR - 180], [CUE.hugBack, FLOOR - 185], [CUE.hug, FLOOR - 175], [CUE.hug + 1.5, FLOOR - 200], [D, FLOOR - 250]], t),
      shake: .45 * pulse(t, CUE.big + .05, .4) + SA.concat(SB).reduce((m, b) => m + .12 * pulse(t, b + .05, .2), 0),
    };
  },
  world(t, refl) {
    const pa = poseA(t), pb = poseB(t);
    // pedazos en el piso (antes de que se vuelvan corazones)
    if (!refl) {
      const tr = smooth(prog(t, CUE.hug, CUE.hug + .4));
      for (const s of SHARDS) {
        const dt = t - s.t0; if (dt < 0) continue;
        const p = easeIn(clamp(dt / .55));
        const x = lerp(s.x0, s.x1, p), y = lerp(s.y0, FLOOR - 3, p);
        const pulseG = .6 + .4 * Math.sin(t * 2 + s.ph);
        if (tr < 1) shard(x, y, s.rot + dt * 8 * (1 - p), s.sz, (1 - tr) * (p < 1 ? 1 : pulseG));
        if (tr > 0) { // se transforman en corazones que suben
          const u = t - CUE.hug - s.ph * .12, k = clamp(u / 4);
          if (u > 0 && k < 1) heart(lerp(s.x1, 450 + (s.x1 - 380) * .9, smooth(clamp(u / 1.5))) + Math.sin(u * 2 + s.ph) * 14, FLOOR - 6 - u * (70 + s.sz * 10), 10 + 14 * easeOut(clamp(u * 1.5)), '#ff3b36', Math.min(1, u * 4) * (1 - k * k), 26);
        }
      }
      // rayos durante los gritos
      const ha = E.headOf(pa), hb = E.headOf(pb);
      for (const b of SA) if (t > b && t < b + .4) bolt({ x: ha.x + 22, y: ha.y }, { x: hb.x - 16, y: hb.y }, t, b * 10, 1.25);
      for (const b of SB) if (t > b && t < b + .4) bolt({ x: hb.x - 22, y: hb.y }, { x: ha.x + 16, y: ha.y }, t, b * 10, 1.25);
      if (t > CUE.big && t < CUE.big + .5) { bolt({ x: ha.x + 20, y: ha.y - 4 }, { x: hb.x - 20, y: hb.y - 4 }, t, 77, 1.6); bolt({ x: ha.x + 20, y: ha.y + 30 }, { x: hb.x - 20, y: hb.y + 30 }, t, 78, 1.1); }
    }
    // la que abraza va detrás en el abrazo por la espalda
    if (t > CUE.hugBack && t < CUE.turnB + .1) { figure(pa, STYLE.hero); figure(pb, STYLE.hero); }
    else { figure(pb, STYLE.hero); figure(pa, STYLE.hero); }
    if (!refl) {
      ring(448, FLOOR - 150, t, CUE.hug, { color: '255,80,70', r: 260, width: 7, life: 1.2 });
      burst(448, FLOOR - 160, t, CUE.hug, { n: 40, speed: 240, seed: 3, gravity: -.2, life: 1.6 });
      const ra = smooth(prog(t, CUE.hug, CUE.hug + .6)) * (1 - .5 * smooth(prog(t, D - 3, D)));
      if (ra > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; rays(448, FLOOR - 160, t, ra * .8, '255,70,60', 16, 520); ctx.restore(); }
      // tensión en el silencio: el espacio entre los dos late en rojo tenue
      const gap = bump(t, CUE.away + .8, CUE.go + .5);
      if (gap > 0) glowCircle(368, FLOOR - 4, 80, '255,40,30', .18 * gap * (.7 + .3 * Math.sin(t * 4)));
    }
  },
  events() {
    const ev = [];
    for (const b of SA) ev.push({ t: b, type: 'buzz', dur: .35, vol: .9, pan: -.3 }, { t: b + .05, type: 'crack', vol: .5 });
    for (const b of SB) ev.push({ t: b, type: 'buzz', dur: .35, vol: .9, pan: .3 }, { t: b + .05, type: 'crack', vol: .5 });
    ev.push(...E.footsteps(D, t => [t > CUE.go && t < CUE.hugBack - .1 ? { phi: keyed([[CUE.go, 0], [CUE.hugBack - .15, 136]], t, x => x) / 88, size: 1 } : null]));
    return ev.concat([
      { t: 0, type: 'impact', vol: .8 }, { t: CUE.big, type: 'boom' }, { t: CUE.big + .02, type: 'crack' },
      { t: CUE.away + .2, type: 'whoosh', up: false, vol: .5 }, { t: CUE.away + .9, type: 'thud', vol: .6 },
      { t: 6.4, type: 'clock', dur: 1.6, accel: false, vol: .5 }, { t: CUE.glance, type: 'heartbeat', vol: .6 }, { t: CUE.doubt, type: 'heartbeat', vol: .7 },
      { t: CUE.hugBack, type: 'slide', vol: .4 }, { t: CUE.hugBack + .2, type: 'swell', dur: 1.5 },
      { t: CUE.turnB, type: 'whoosh', vol: .4 }, { t: CUE.hug, type: 'chime' }, { t: CUE.hug, type: 'sparkle' }, { t: CUE.hug + .6, type: 'sparkle', vol: .6 },
    ]);
  },
  music: {
    sections: [
      { t: 0, dur: CUE.away + .4, style: 'tension', chords: ['Dm', 'Dm', 'Bb', 'A'], chordLen: .9 },
      { t: CUE.away + 1, dur: CUE.hugBack - CUE.away - 1, style: 'sad', chords: ['Am', 'F', 'C', 'G'], chordLen: 1.3 },
      { t: CUE.hugBack, dur: CUE.hug - CUE.hugBack, style: 'tender', chords: ['F', 'G'], chordLen: .8 },
      { t: CUE.hug, dur: D - CUE.hug, style: 'hope', chords: ['F', 'C', 'G', 'C'], chordLen: 1.5 },
    ],
    stingers: [{ t: CUE.big, type: 'impact' }, { t: CUE.hug, type: 'bells' }],
    duck: [[CUE.big + .6, CUE.away + 1.2], [CUE.turnB, CUE.hug]],
  },
};
})();
