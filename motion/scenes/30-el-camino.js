// 30 — EL CAMINO: corre tras una bandera que siempre se aleja; al rendirse descubre
// que todo el camino estaba lleno de flores y de un amanecer que nunca miró.
(() => {
const { FLOOR, clamp, lerp, prog, smooth, easeOut, easeInOut, keyed, figure, STYLE, mix, stand, run, sit, glowCircle, ctx } = E;
const D = 19;
// tiempo de historia con cámara lenta en el salto final
const SLOW0 = 5.05, SLOW1 = 6.25, SLOWK = .32;
const S = t => t < SLOW0 ? t : t < SLOW1 ? SLOW0 + (t - SLOW0) * SLOWK : SLOW0 + (SLOW1 - SLOW0) * SLOWK + (t - SLOW1);
const R = s => s < SLOW0 ? s : s < SLOW0 + (SLOW1 - SLOW0) * SLOWK ? SLOW0 + (s - SLOW0) / SLOWK : SLOW1 + (s - SLOW0 - (SLOW1 - SLOW0) * SLOWK);
// cues en tiempo de historia
const C = { zip1: 1.75, zip2: 3.55, leap: 5.05, zip3: 5.24, land: 5.5, stop: 6.0, sprout: 7.3, look: 8.0, kneel: 8.1, bloom: 8.75, sunUp: 9.0, rise: 9.9, turn: 10.9, sitT: 11.9 };
const FX = 412;
const SPEED = [[0, 250], [1.6, 250], [1.8, 230], [3.4, 290], [5.0, 330], [5.4, 300], [5.6, 120], [6.0, 0], [D, 0]];
const distS = E.distance(SPEED, D);
const RUNX = 285;
// separación bandera-corredor (cada vez que la toca, se va)
const gap = s => gapK([[0, 190], [C.zip1 - .15, 112], [C.zip1, 108], [C.zip1 + .35, 290], [C.zip2 - .15, 116], [C.zip2, 112], [C.zip2 + .35, 290],
  [C.zip3 - .02, 150], [C.zip3 + .45, 265], [D, 265]], s);
function gapK(keys, s) {
  if (s <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (s <= keys[i][0]) {
    const [t0, v0] = keys[i - 1], [t1, v1] = keys[i], q = (s - t0) / (t1 - t0);
    return lerp(v0, v1, v1 > v0 ? easeOut(q) : q);
  }
  return keys[keys.length - 1][1];
}
function flagX(s) {
  // movimiento real: el corredor se acerca (scroll) y la bandera huye con easeOut
  const base = RUNX + gap(s);
  return base;
}
const runX = s => RUNX + 40 * smooth(prog(s, C.land - .1, C.stop + .2));

// flores: posición, profundidad, retardo
const FLOWERS = (() => {
  const r = E.rng(77), a = [];
  for (let i = 0; i < 80 && a.length < 34; i++) {
    const z = r(), x = -80 + r() * 580;
    if ((z > .35 && x > 240 && x < 360) || Math.abs(x - FX) < 34) continue;
    a.push({ x, z, y: FLOOR + 2 + z * 70, sc: .75 + z * .9, d: C.bloom + Math.abs(x - FX) / 420 * 1.4 + r() * .4, seed: i });
  }
  a.push({ x: FX, z: .3, y: FLOOR + 14, sc: 1.4, d: C.sprout, seed: 99, first: true });
  return a.sort((p, q) => p.z - q.z);
})();
function flower(f, s, refl) {
  const p = smooth(prog(s, f.d, f.d + .7)); if (p <= 0) return;
  const h = 34 * f.sc * easeOut(p), sway = Math.sin(s * 1.8 + f.seed) * .06;
  const top = { x: f.x + Math.sin(sway) * h, y: f.y - h };
  ctx.strokeStyle = '#cfe6c6'; ctx.lineWidth = 3 * f.sc; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.quadraticCurveTo(f.x - 4 * f.sc, f.y - h * .5, top.x, top.y); ctx.stroke();
  ctx.fillStyle = '#d9f0d0';
  ctx.beginPath(); ctx.ellipse(f.x + 6 * f.sc * p, f.y - h * .45, 7 * f.sc * p, 3 * f.sc * p, -.5, 0, Math.PI * 2); ctx.fill();
  const b = E.backOut(prog(s, f.d + .45, f.d + 1.05));
  if (b > 0) {
    const r = 9 * f.sc * b;
    if (!refl) glowCircle(top.x, top.y, r * 3.2, '255,50,40', .35 * clamp(b));
    ctx.save(); ctx.fillStyle = '#ff3b36'; ctx.shadowColor = '#ff2a2a'; ctx.shadowBlur = refl ? 0 : 12;
    for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2 + f.seed; ctx.beginPath(); ctx.arc(top.x + Math.cos(a) * r * .6, top.y + Math.sin(a) * r * .6, r * .55, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#ffd9c0'; ctx.beginPath(); ctx.arc(top.x, top.y, r * .32, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}
// bandera con estela de velocidad
function theFlag(s, t, refl) {
  const x = flagX(s), dx = (flagX(s + .03) - x) / .03;
  const still = s > C.stop + .6, a = still ? lerp(1, .55, smooth(prog(s, C.turn, C.sitT + 1))) : 1;
  ctx.save(); ctx.globalAlpha *= a;
  if (!refl && Math.abs(dx) > 120) {
    const k = clamp((Math.abs(dx) - 120) / 600);
    for (let i = 0; i < 6; i++) {
      const y = FLOOR - 160 + i * 9, len = (60 + i * 17 % 50) * k * 2.2;
      const g = ctx.createLinearGradient(x - len, 0, x, 0);
      g.addColorStop(0, 'rgba(255,60,50,0)'); g.addColorStop(1, `rgba(255,60,50,${.5 * k})`);
      ctx.fillStyle = g; ctx.fillRect(x - len, y, len, 3);
    }
  }
  // base
  ctx.fillStyle = '#555'; ctx.fillRect(x - 12, FLOOR - 5, 24, 5);
  E.flag(x, FLOOR, still ? C.stop + .6 + Math.min(.4, s - C.stop - .6) * .3 : t, '#ff3b36', 1.15);
  ctx.restore();
  if (!refl) glowCircle(x + 34, FLOOR - 140, 70, '255,40,40', .18 * a);
}

function hero(s, t) {
  const d = distS(s), x = runX(s);
  // carrera: se inclina más con el cansancio
  const tired = smooth(prog(s, C.zip2, C.leap));
  let p = run(x, d, { lean: .28 + .1 * tired, stride: 1.05 });
  // estira el brazo justo antes de cada intento
  const reach = Math.max(E.bump(s, C.zip1 - .45, C.zip1 + .3), E.bump(s, C.zip2 - .45, C.zip2 + .3));
  if (reach > 0) { p.arms[0] = { ang: lerp(p.arms[0].ang, 1.85, reach), bend: lerp(1.4, .05, reach) }; p.tilt = lerp(p.tilt, -.3, reach); p.lean += .1 * reach; }
  // salto desesperado
  const lp = prog(s, C.leap - .12, C.land);
  if (s > C.leap - .3 && s < C.stop + .3) {
    const air = Math.sin(Math.PI * lp);
    const leapP = { hip: { x: x + 10, y: FLOOR - 112 - 40 * air }, s: 1, dir: 1, lean: .75, tilt: -.45,
      feet: [{ x: x - 30, y: FLOOR - 40 * air - 10 }, { x: x - 70, y: FLOOR - 30 * air - 30 }],
      arms: [{ ang: 1.95, bend: 0 }, { ang: 1.7, bend: .1 }] };
    const landP = { hip: { x: x + 18, y: FLOOR - 70 }, s: 1, dir: 1, lean: .7, tilt: .2,
      feet: [{ x: x + 40, y: FLOOR }, { x: x - 34, y: FLOOR }], arms: [{ ang: 1.0, bend: .4 }, { ang: .6, bend: .3 }] };
    if (s < C.land) p = mix(p, leapP, smooth(prog(s, C.leap - .3, C.leap)));
    else p = mix(leapP, landP, smooth(prog(s, C.land, C.land + .12)));
  }
  if (s < C.land) return p;
  // jadeo: manos en las rodillas, respiración agitada
  const pantA = smooth(prog(s, C.land + .1, C.stop + .2));
  const pant = q => { const br = Math.sin(q * 9); return { hip: { x: x + 14, y: FLOOR - 82 + br * 2 }, s: 1, dir: 1, lean: .78 + .05 * br, tilt: -.1 - .05 * br,
    feet: [{ x: x + 26, y: FLOOR }, { x: x - 18, y: FLOOR }],
    arms: [{ target: { x: x + 46, y: FLOOR - 50 } }, { target: { x: x + 36, y: FLOOR - 54 } }] }; };
  if (s < C.stop + .2) return mix(p, pant(s), pantA);
  const upLook = { ...stand(x + 6, { t: s, lean: .2, tilt: .62 }), arms: [{ ang: .3, bend: .3 }, { ang: .1, bend: .3 }] };
  const kneelP = { ...E.kneel(x + 36, { lean: .62, tilt: .35 }), arms: [{ target: { x: FX - 4, y: FLOOR - 36 } }, { ang: .4, bend: .5 }] };
  const riseP = { ...stand(x + 14, { t: s, lean: -.03, tilt: -.3 }), arms: [{ ang: .55, bend: .3 }, { ang: .4, bend: .3 }] };
  const wow = { ...stand(x + 14, { t: s, lean: -.07, tilt: -.38, dir: -1 }), arms: [{ ang: .85, bend: .25 }, { ang: .7, bend: .25 }] };
  const sx = x + 4;
  const sitP = { hip: { x: sx, y: FLOOR - 13 }, s: 1, dir: -1, lean: .12, tilt: -.32,
    feet: [{ x: sx - 46, y: FLOOR }, { x: sx - 38, y: FLOOR }],
    arms: [{ target: { x: sx - 40, y: FLOOR - 50 } }, { target: { x: sx - 34, y: FLOOR - 56 } }] };
  return E.poseAt(s, [[C.stop + .2, pant], [C.sprout + .3, pant], [C.sprout + 1.0, upLook], [C.kneel, upLook], [C.kneel + .55, kneelP],
    [C.bloom + .7, kneelP], [C.rise, riseP], [C.rise + .5, riseP], [C.turn, wow], [C.sitT, wow], [C.sitT + 1.1, sitP]]);
}

const sunP = s => {
  const p = easeOut(prog(s, C.sunUp, C.sunUp + 4.2));
  return { x: 205, y: lerp(FLOOR + 40, FLOOR - 230, p), r: lerp(30, 46, p), a: p };
};

window.SCENE = {
  id: '30-el-camino', title: 'Disfruta *el camino*', duration: D, cue: C,
  scroll: t => distS(S(t)),
  sky: t => .9 * smooth(prog(S(t), C.sunUp, C.sunUp + 3)),
  spot: t => ({ x: lerp(330, 300, smooth(prog(S(t), C.look, C.sitT))), r: lerp(330, 470, smooth(prog(S(t), C.bloom, C.sitT + 1))) }),
  beam: t => ({ x: lerp(330, 300, smooth(prog(S(t), C.look, C.sitT))), a: lerp(.05, .03, smooth(prog(S(t), C.sunUp, C.sitT))), w: 170 }),
  flashes: [R(C.zip3) + .05],
  blackouts: [],
  camera: t => {
    const s = S(t);
    return {
      zoom: keyed([[0, 2.15], [1.5, 1.85], [3.3, 1.8], [4.9, 1.95], [5.25, 2.2], [5.5, 2.25], [6.3, 1.9], [7.1, 1.95], [8.6, 2.5], [9.2, 2.35], [10.6, 1.8], [12.8, 1.62], [D - .9, 1.55]], s),
      x: keyed([[0, 360], [1.5, 395], [3.5, 400], [5.2, 360], [5.5, 380], [6.3, 430], [7.1, 420], [8.6, 385], [9.2, 375], [10.6, 320], [12.8, 360], [D - .9, 400]], s),
      y: keyed([[0, FLOOR - 175], [3.5, FLOOR - 185], [5.3, FLOOR - 150], [6.3, FLOOR - 175], [7.1, FLOOR - 175], [8.6, FLOOR - 115], [9.2, FLOOR - 130], [10.6, FLOOR - 195], [D - .9, FLOOR - 225]], s),
      shake: .4 * E.pulse(s, C.land, .25),
    };
  },
  backdrop(t) {
    const s = S(t), sp = sunP(s);
    if (sp.a > 0) { E.rays(sp.x, sp.y, s, .8 * sp.a, '255,70,50', 16, 900); E.sun(sp.x, sp.y, sp.r, Math.min(1, sp.a * 1.5)); }
    // colinas lejanas que aparecen con la luz
    const hl = smooth(prog(s, C.sunUp + .5, C.sitT + 1));
    if (hl > 0) {
      ctx.save(); ctx.globalAlpha = hl;
      ctx.fillStyle = '#1a0b0a';
      ctx.beginPath(); ctx.moveTo(-500, FLOOR);
      for (let x = -500; x <= 1200; x += 40) ctx.lineTo(x, FLOOR - 40 - 30 * Math.sin(x * .006) - 18 * Math.sin(x * .017 + 1));
      ctx.lineTo(1200, FLOOR); ctx.fill(); ctx.restore();
    }
  },
  world(t, refl) {
    const s = S(t);
    for (const f of FLOWERS) if (f.z < .35) flower(f, s, refl);
    theFlag(s, t, refl);
    const p = hero(s, t);
    const sl = figure(p, STYLE.hero);
    for (const f of FLOWERS) if (f.z >= .35) flower(f, s, refl);
    if (!refl) {
      // gotas de sudor/jadeo
      const pa = E.bump(s, C.land + .2, C.sprout);
      if (pa > 0) for (let i = 0; i < 3; i++) {
        const ph = ((s * 1.6 + i / 3) % 1);
        ctx.fillStyle = `rgba(230,230,240,${pa * (1 - ph) * .8})`;
        ctx.beginPath(); ctx.arc(sl.head.x + 20 + ph * 22, sl.head.y - 8 + ph * 6 + i * 4, 4 * (1 - ph * .5), 0, Math.PI * 2); ctx.fill();
      }
      // chispas al florecer cerca de él
      E.burst(FX, FLOOR - 30, s, C.sprout + .55, { n: 16, speed: 120, size: 3, color: '255,90,70', gravity: -.4, life: 1 });
      E.burst(FX, FLOOR - 30, s, C.bloom, { n: 30, speed: 260, size: 3.5, color: '255,80,60', gravity: -.3, life: 1.3, seed: 4 });
      E.ring(FX, FLOOR + 10, s, C.bloom, { r: 420, flat: .18, color: '255,80,60', life: 1.4, width: 4 });
    }
  },
  front(t) {
    const s = S(t);
    // pétalos flotando al final
    const pa = smooth(prog(s, C.sitT, C.sitT + 2));
    if (pa > 0) {
      const r = E.rng(5);
      for (let i = 0; i < 18; i++) {
        const x0 = r() * 700 - 60, sp = 20 + r() * 30, ph = r();
        const y = FLOOR - 40 - ((s * sp / 300 + ph) % 1) * 360, x = x0 + Math.sin(s + i) * 20;
        ctx.fillStyle = `rgba(255,70,55,${.5 * pa})`; ctx.beginPath(); ctx.ellipse(x, y, 4, 2.5, s + i, 0, Math.PI * 2); ctx.fill();
      }
    }
  },
  events() {
    const ev = E.footsteps(D, t => {
      const s = S(t);
      return [{ phi: distS(s) / (4 * 34 * 1.05), size: 1, moving: s < C.leap - .1, vol: 1.2 }];
    });
    return ev.concat([
      { t: 0.02, type: 'whoosh', vol: .8 }, { t: .08, type: 'impact', vol: .4 }, { t: R(C.zip1), type: 'whoosh', vol: .9 }, { t: R(C.zip2), type: 'whoosh', vol: 1 }, { t: R(C.zip3), type: 'whoosh', vol: 1.1, dur: .9 },
      { t: R(C.zip1) + .05, type: 'slide', vol: .5 }, { t: R(C.zip2) + .05, type: 'slide', vol: .5 },
      { t: R(C.land), type: 'thud', vol: .9 }, { t: R(C.land) + .05, type: 'scuff' },
      { t: R(C.land) + .4, type: 'heartbeat', vol: .9 }, { t: R(C.land) + 1.05, type: 'heartbeat', vol: .8 }, { t: R(C.land) + 1.7, type: 'heartbeat', vol: .6 }, { t: R(C.land) + 2.4, type: 'heartbeat', vol: .4 },
      { t: R(C.sprout) + .5, type: 'chime', vol: .8 }, { t: R(C.sprout) + .55, type: 'sparkle', vol: .7 },
      { t: R(C.bloom) + .3, type: 'swell', dur: 3, vol: .8 }, { t: R(C.bloom) + .6, type: 'sparkle' }, { t: R(C.bloom) + 1.4, type: 'sparkle', vol: .7 },
      { t: R(C.bloom) + .2, type: 'wind', dur: 6, vol: .35 },
      ...[0, .35, .7, 1.0, 1.3, 1.6].map((k, i) => ({ t: R(C.bloom) + .9 + k, type: 'pop', vol: .35, pan: (i % 2 ? .4 : -.4) })),
    ]);
  },
  music: {
    sections: [
      { t: .2, dur: R(C.leap) - .2, style: 'build', chords: ['Am', 'F', 'C', 'G'], chordLen: .9 },
      { t: R(C.land), dur: R(C.sprout) - R(C.land), style: 'tension', chords: ['Am'], chordLen: 2 },
      { t: R(C.sprout), dur: R(C.bloom) - R(C.sprout) + .2, style: 'tender', chords: ['F', 'C'], chordLen: 1.2 },
      { t: R(C.bloom), dur: D - R(C.bloom), style: 'hope', chords: ['F', 'C', 'G', 'C'], chordLen: 1.7 },
    ],
    stingers: [{ t: R(C.zip3), type: 'impact' }, { t: R(C.bloom) + .3, type: 'bells' }],
    duck: [[R(C.zip3) + .1, R(C.land) + .2]],
  },
};
})();
