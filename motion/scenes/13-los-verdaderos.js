// 13 — LOS VERDADEROS SE QUEDAN: en la fiesta todos bailan con él. Se apagan las luces, él se derrumba
// con el corazón roto… y uno a uno se van. Silencio. Unos pasos vuelven: uno se sienta a su lado.
(() => {
const { FLOOR, ctx, clamp, lerp, prog, smooth, easeOut, easeIn, easeInOut, keyed, bump, pulse, rng, walk, stand, sit, mix, poseAt,
  shoulderOf, headOf, figure, mixStyle, STYLE, glowCircle, burst, ring, rays, heart, bubble } = E;
const D = 20;
const BEAT = .5;
const CUE = { off: 4.5, sink: 4.8, sat: 5.7, bubble: 5.4, leave: [6.3, 6.95, 7.55, 8.1, 8.6], alone: 9.6, back: 10.7, arrive: 12.0, sitBy: 12.5, touch: 12.9, lift: 13.5, lean: 14.0, mend: 14.2, warm: 12.4 };
const HX = 360;
// mezcla de estilos que acepta colores hex o rgb() (E.mixStyle solo acepta hex)
const toHex = c => c[0] === '#' ? c : '#' + c.match(/\d+/g).slice(0, 3).map(v => (+v).toString(16).padStart(2, '0')).join('');
const mixS = (a, b, p) => { const m = mixStyle({ ...a, near: toHex(a.near), far: toHex(a.far) }, { ...b, near: toHex(b.near), far: toHex(b.far) }, p); return { ...m, near: toHex(m.near), far: toHex(m.far) }; };
// amigos: x, dirección de salida, tipo de baile
const FR = [{ x: 168, out: -1, mv: 1 }, { x: 246, out: -1, mv: 2, TRUE: true }, { x: 474, out: 1, mv: 0 }, { x: 548, out: 1, mv: 1 }, { x: 622, out: 1, mv: 2 }];
const ORDER = [3, 1, 0, 4, 2]; // quién se va en qué orden
const party = t => 1 - smooth(prog(t, CUE.off - .02, CUE.off + .05));
const warm = t => smooth(prog(t, CUE.warm, CUE.mend + 1.2));

function dance(x, t, ph, mv, o = {}) {
  const b = (t + ph) / BEAT, bi = Math.floor(b), f = b - bi;
  const bounce = Math.abs(Math.sin(Math.PI * b)) * 9;
  const sway = Math.sin(Math.PI * b / 2) * .12;
  const p = stand(x + Math.sin(Math.PI * b / 2) * 8, { dir: o.dir || 1, lean: sway, tilt: -.15 + .1 * Math.sin(Math.PI * b) });
  p.hip.y += bounce - 6;
  const step = Math.sin(Math.PI * b / 2) * 10;
  p.feet = [{ x: p.hip.x + 10 + step, y: FLOOR - Math.max(0, Math.sin(Math.PI * b)) * 8 * (bi % 2) }, { x: p.hip.x - 12 + step * .3, y: FLOOR - Math.max(0, Math.sin(Math.PI * b)) * 8 * ((bi + 1) % 2) }];
  const up = (bi % 2) ? 1 : 0, e = easeOut(Math.min(1, f * 2.2));
  if (mv === 0) p.arms = [{ ang: Math.PI - .35 + (up ? .3 : -.2) * e, bend: .1 }, { ang: Math.PI - .2 - (up ? .2 : -.3) * e, bend: .1 }];
  else if (mv === 1) p.arms = [{ ang: 1.2 + .5 * Math.sin(Math.PI * b), bend: 1.4 }, { ang: 1.0 - .5 * Math.sin(Math.PI * b), bend: 1.4 }];
  else p.arms = [{ ang: up ? 2.6 : .4, bend: up ? .05 : .9 }, { ang: up ? .3 : 2.5, bend: up ? .9 : .05 }];
  return p;
}

function cast(t) {
  const o = { fr: [] };
  // ── héroe: baila, se apaga todo, se derrumba sentado; después se recarga en su amigo
  const dn = dance(HX, t, 0, 0);
  const stunned = stand(HX, { t, tilt: .2, lean: .02 }); stunned.arms = [{ ang: .2, bend: .2 }, { ang: 0, bend: .2 }];
  const sinkP = sit(HX - 4, { ground: true, lean: .5, tilt: 1.0 });
  sinkP.hip.y += Math.sin(t * 2.2) * 1.2 * (t > CUE.sat ? 1 : 0);
  sinkP.arms = [{ target: { x: HX + 44, y: FLOOR - 66 } }, { target: { x: HX + 40, y: FLOOR - 60 } }];
  const liftP = { ...sinkP, lean: .4, tilt: .1 };
  const leanP = { ...sinkP, lean: .15, tilt: -.05, arms: [{ target: { x: HX + 50, y: FLOOR - 40 } }, { target: { x: HX + 44, y: FLOOR - 36 } }] };
  leanP.hip = { x: HX - 8, y: sinkP.hip.y };
  o.hero = poseAt(t, [[0, () => dn], [CUE.off - .02, () => dn], [CUE.off + .1, stunned], [CUE.sink, stunned], [CUE.sat, sinkP], [CUE.lift, sinkP], [CUE.lift + .5, liftP], [CUE.lean, liftP], [CUE.lean + .7, leanP], [D, leanP]]);
  // ── amigos
  FR.forEach((f, i) => {
    const k = ORDER.indexOf(i), tl = CUE.leave[k];
    const dnc = dance(f.x, t, i * .13 + .07, f.mv, { dir: f.x < HX ? 1 : -1 });
    const face = f.x < HX ? 1 : -1;
    const frozen = stand(f.x, { t, dir: face, tilt: .1 }); frozen.arms = [{ ang: .3, bend: .4 }, { ang: .1, bend: .4 }];
    const lookAt = stand(f.x, { t, dir: face, tilt: .45, lean: .05 });
    const turned = stand(f.x, { t, dir: f.out, tilt: .2 });
    const sp = 150, dx = Math.max(0, t - tl - .55) * sp;
    const gone = walk(f.x + f.out * dx, dx, { dir: f.out, lean: .1, tilt: .1 });
    let p = poseAt(t, [[0, () => dnc], [CUE.off - .02, () => dnc], [CUE.off + .15, frozen], [tl - .9, frozen], [tl - .5, lookAt], [tl, lookAt], [tl + .3, turned], [tl + .6, () => gone], [D, () => gone]]);
    let style = mixS(mixS(STYLE.gray, STYLE.hero, .25), STYLE.dim, .45 * smooth(prog(t, CUE.off, CUE.off + .5)));
    if (f.TRUE && t > CUE.back) {
      // regresa: entra por la izquierda, se sienta junto a él y le pone la mano en el hombro
      const x = keyed([[CUE.back, -60], [CUE.arrive, HX - 70]], t, p => easeOut(p) * .3 + p * .7);
      const w = walk(x, x, { lean: .1, tilt: .15 });
      const st = stand(HX - 70, { t, tilt: .5, lean: .1 });
      const sitP = sit(HX - 60, { ground: true, lean: .2, tilt: .4 });
      sitP.feet = [{ x: HX + 4, y: FLOOR }, { x: HX - 4, y: FLOOR }];
      const hs = shoulderOf(o.hero);
      const touch = { ...sitP, arms: [{ target: { x: hs.x - 2, y: hs.y + 6 } }, { target: { x: HX - 10, y: FLOOR - 36 } }], tilt: .3 };
      p = poseAt(t, [[CUE.back, () => w], [CUE.arrive - .2, () => w], [CUE.arrive + .1, st], [CUE.sitBy + .5, sitP], [CUE.touch + .3, touch], [D, touch]]);
      if (t > CUE.touch) { const h2 = shoulderOf(o.hero); p.arms = [{ target: { x: h2.x - 4, y: h2.y + 4 } }, p.arms[1]]; }
      style = mixStyle(STYLE.gray, STYLE.hero, .35 + .65 * warm(t));
    }
    o.fr.push({ p, style, out: !f.TRUE || t < CUE.back ? Math.abs(p.hip.x - f.x) : 0 });
  });
  return o;
}

// luces de fiesta (círculos rojos/blancos que laten con el ritmo)
const BLOBS = (() => { const g = rng(44); return Array.from({ length: 16 }, (_, i) => ({ x: g() * 900 - 90, y: FLOOR - 120 - g() * 640, r: 30 + g() * 70, red: i % 3 !== 0, ph: g() * 4 })); })();
function partyLights(t, a) {
  if (a <= 0) return;
  for (const b of BLOBS) {
    const k = (.35 + .65 * Math.pow(Math.max(0, Math.cos(Math.PI * (t + b.ph * BEAT) / BEAT)), 3)) * a;
    glowCircle(b.x + Math.sin(t * .8 + b.ph) * 20, b.y, b.r * 2.2, b.red ? '255,45,40' : '255,255,255', .22 * k);
    ctx.fillStyle = b.red ? `rgba(255,59,54,${.75 * k})` : `rgba(255,255,255,${.55 * k})`;
    ctx.beginPath(); ctx.arc(b.x + Math.sin(t * .8 + b.ph) * 20, b.y, b.r * .28, 0, Math.PI * 2); ctx.fill();
  }
  // haces que barren desde arriba
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 4; i++) {
    const ang = Math.sin(t * 1.3 + i * 1.7) * .55, x0 = 120 + i * 160, y0 = FLOOR - 820;
    const g = ctx.createLinearGradient(x0, y0, x0 + Math.sin(ang) * 800, y0 + 800);
    const col = i % 2 ? '255,50,45' : '255,255,255';
    g.addColorStop(0, `rgba(${col},${.16 * a})`); g.addColorStop(1, `rgba(${col},0)`);
    ctx.fillStyle = g; ctx.save(); ctx.translate(x0, y0); ctx.rotate(-ang);
    ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(6, 0); ctx.lineTo(70, 860); ctx.lineTo(-70, 860); ctx.fill(); ctx.restore();
  }
  ctx.restore();
}
function floorSpots(t, a) {
  if (a <= 0) return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 6; i++) {
    const x = 360 + Math.sin(t * 1.1 + i * 2.1) * 260, k = .5 + .5 * Math.cos(Math.PI * (t + i * .25) / BEAT);
    ctx.save(); ctx.translate(x, FLOOR + 14); ctx.scale(1, .22);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 90);
    g.addColorStop(0, i % 2 ? `rgba(255,60,50,${.5 * a * k})` : `rgba(255,255,255,${.3 * a * k})`); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(-90, -90, 180, 180); ctx.restore();
  }
  ctx.restore();
}
// corazón roto (y luego reparado) para el globo de pensamiento
function brokenHeart(cx, cy, t) {
  const open = (1 - smooth(prog(t, CUE.mend, CUE.mend + .8))) * smooth(prog(t, CUE.bubble, CUE.bubble + .5));
  const gap = 7 * open;
  for (const s of [-1, 1]) {
    ctx.save(); ctx.translate(cx + s * gap, cy + 4); ctx.rotate(s * .18 * open);
    ctx.beginPath();
    if (s < 0) { ctx.moveTo(0, -18); ctx.bezierCurveTo(-16, -34, -30, -10, 0, 10); ctx.lineTo(-3, 0); ctx.lineTo(3, -7); ctx.lineTo(-2, -12); ctx.closePath(); }
    else { ctx.moveTo(0, -18); ctx.bezierCurveTo(16, -34, 30, -10, 0, 10); ctx.lineTo(-3, 0); ctx.lineTo(3, -7); ctx.lineTo(-2, -12); ctx.closePath(); }
    ctx.fillStyle = '#ff3b36'; ctx.shadowColor = '#ff3b36'; ctx.shadowBlur = 14 + 20 * (1 - open);
    ctx.fill(); ctx.restore();
  }
}

window.SCENE = {
  id: '13-los-verdaderos', title: 'Los verdaderos *se quedan*', duration: D, cue: CUE,
  sky: t => .45 * party(t),
  spot: t => ({ x: lerp(360, HX - 30, warm(t)), r: lerp(lerp(160, 420, party(t)), 260, warm(t)), a: lerp(lerp(.05, .14, party(t)), .16, warm(t)) }),
  beam: t => ({ x: HX - 20, a: t < CUE.off ? .02 : .05 * smooth(prog(t, CUE.off + .4, CUE.sat)), w: 120 }),
  flashes: [.05, 2.05],
  blackouts: [CUE.off],
  camera: t => {
    const beatPulse = party(t) * .035 * Math.pow(Math.max(0, Math.cos(Math.PI * t / BEAT)), 6);
    return {
      zoom: keyed([[0, 1.85], [2, 1.65], [CUE.off - .1, 1.6], [CUE.off + .05, 2.05], [CUE.sat, 2.15], [CUE.leave[0], 1.8], [CUE.alone, 1.55], [CUE.back + .4, 1.6], [CUE.arrive, 1.9], [CUE.mend, 2.25], [17, 2.2], [D, 1.95]], t) + beatPulse,
      x: keyed([[0, 360], [2, 400], [CUE.off - .1, 390], [CUE.off + .05, HX + 10], [CUE.sat, HX + 20], [CUE.alone, 370], [CUE.back + .4, 330], [CUE.arrive, HX - 20], [CUE.mend, HX - 18], [D, HX - 20]], t),
      y: keyed([[0, FLOOR - 200], [CUE.off - .1, FLOOR - 200], [CUE.off + .05, FLOOR - 190], [CUE.sat, FLOOR - 160], [CUE.alone, FLOOR - 210], [CUE.arrive, FLOOR - 165], [CUE.mend, FLOOR - 165], [D, FLOOR - 190]], t),
      shake: .25 * pulse(t, .05, .3) + .2 * pulse(t, 2.05, .3) + .3 * pulse(t, CUE.off, .3),
    };
  },
  backdrop(t) { partyLights(t, party(t)); },
  world(t, refl) {
    const c = cast(t);
    floorSpots(t, party(t));
    // luz cálida que los envuelve al final
    const w = warm(t);
    if (w > 0 && !refl) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createLinearGradient(0, FLOOR - 900, 0, FLOOR);
      g.addColorStop(0, `rgba(255,200,140,${.02 * w})`); g.addColorStop(1, `rgba(255,190,120,${.2 * w})`);
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(HX - 60, FLOOR - 900); ctx.lineTo(HX + 10, FLOOR - 900); ctx.lineTo(HX + 120, FLOOR); ctx.lineTo(HX - 200, FLOOR); ctx.fill();
      ctx.restore();
      glowCircle(HX - 30, FLOOR - 60, 240, '255,190,120', .18 * w);
    }
    // amigos detrás, héroe al frente
    for (const f of c.fr) if (f.p.hip.x > -120 && f.p.hip.x < 860) figure(f.p, f.style);
    figure(c.hero, STYLE.hero);
    if (!refl) {
      const hd = headOf(c.hero);
      const ba = smooth(prog(t, CUE.bubble, CUE.bubble + .4)) * (1 - smooth(prog(t, CUE.mend + 1.2, CUE.mend + 1.8)));
      bubble(hd.x + 30, hd.y - 112, .95, ba, (x, y) => brokenHeart(x, y, t));
      if (t > CUE.mend + 1.2) {
        const k = smooth(prog(t, CUE.mend + 1.2, CUE.mend + 2));
        heart(HX - 30, FLOOR - 250 - 30 * k + Math.sin(t * 3) * 3, 34 * E.backOut(k), '#ff3b36', k);
      }
      burst(hd.x + 30, hd.y - 112, t, CUE.mend + .8, { color: '255,70,60', n: 26, speed: 200, gravity: .3, size: 3.5, life: 1.4, seed: 7 });
    }
  },
  front(t) {
    if (party(t) > 0) for (let i = 0; i < 3; i++) burst(200 + i * 160, FLOOR - 380, t, Math.floor(t / 1) * 1 + i * .33, { color: i % 2 ? '255,60,50' : '255,255,255', n: 10, speed: 160, size: 2.5, life: .9, gravity: .4, seed: 50 + Math.floor(t) * 3 + i });
  },
  events() {
    const ev = E.footsteps(D, t => {
      const c = cast(t);
      return c.fr.map((f, i) => f.p.phi !== undefined && t > CUE.off ? { phi: f.p.phi, size: 1, moving: true, vol: 1.3, pan: clamp((f.p.hip.x - 360) / 300, -1, 1) } : null);
    });
    return ev.concat([
      { t: 0, type: 'boom', vol: .7 }, { t: .02, type: 'crowd', dur: 4.4, vol: .5 },
      { t: CUE.off - .05, type: 'slide', dur: .35, vol: 1 }, { t: CUE.off, type: 'snap', vol: 1 }, { t: CUE.off + .02, type: 'thud', vol: .6 },
      { t: CUE.sat, type: 'thud', vol: .4 }, { t: CUE.bubble, type: 'crack', vol: .5 },
      { t: CUE.alone - .2, type: 'heartbeat', vol: .7 }, { t: CUE.alone + .6, type: 'heartbeat', vol: .55 }, { t: CUE.alone + 1.3, type: 'heartbeat', vol: .4 },
      { t: CUE.touch, type: 'chime', vol: .7 }, { t: CUE.mend, type: 'sparkle' }, { t: CUE.mend + .8, type: 'swell', dur: 2 },
    ]);
  },
  music: {
    sections: [
      { t: 0, dur: CUE.off, style: 'upbeat', chords: ['C', 'G', 'Am', 'F'], chordLen: 1, bpm: 120 },
      { t: CUE.off + .6, dur: CUE.back - CUE.off - .6, style: 'sad', chords: ['Am', 'F', 'Am', 'E'], chordLen: 1.3, vol: .8 },
      { t: CUE.touch - .3, dur: D - CUE.touch + .3, style: 'hope', chords: ['F', 'C', 'G', 'C'], chordLen: 1.6, vol: .8 },
    ],
    stingers: [{ t: CUE.mend, type: 'bells' }],
    duck: [[CUE.off - .02, CUE.off + .7], [CUE.alone - .3, CUE.back + .5]],
  },
};
})();
