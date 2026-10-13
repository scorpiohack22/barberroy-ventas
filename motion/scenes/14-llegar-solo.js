// 14 — ¿DE QUÉ SIRVE LLEGAR SOLO?: corre cuesta arriba sin detenerse. Su esposa y su hijo lo saludan
// (el niño le ofrece un globo-corazón rojo) y él no se detiene. Cada vez que pasa, ellos están más lejos y más apagados.
// Llega a la cima, alza el trofeo, se voltea para compartirlo… y ya no hay nadie.
(() => {
const { FLOOR, ctx, clamp, lerp, prog, smooth, easeOut, easeIn, easeInOut, keyed, bump, pulse, rng, walk, run, stand, kneel, sad, cheer, mix, poseAt,
  shoulderOf, headOf, figure, mixStyle, STYLE, glowCircle, burst, ring, rays, heart, distance } = E;
const D = 20;
const H0 = 80, H1 = 1300, RISE = 330, TOP = 1600;
const hillY = x => FLOOR - RISE * clamp((x - H0) / (H1 - H0));
const CUE = { e1: 3.9, e2: 7.4, e3: 10.4, summit: 12.0, grab: 12.55, raise: 13.0, turn: 14.3, empty: 14.9, drop: 16.0, fall: 16.9, kneel: 17.6 };
const SPEED = [[0, 135], [3, 125], [9, 110], [11.6, 105], [12.0, 40], [12.35, 0], [D, 0]];
const rd = distance(SPEED, D);
const RX = t => -20 + rd(t);
const TROPHY = 1442;
const FAM = [{ x: 470, t: CUE.e1, fade: 0 }, { x: 850, t: CUE.e2, fade: .45 }, { x: 1170, t: CUE.e3, fade: .8 }];

function onHill(p) { // pies sobre la ladera
  const y = p.hip.y;
  p.feet = p.feet.map(f => ({ x: f.x, y: f.y - FLOOR + hillY(f.x) }));
  return p;
}
function cast(t) {
  const o = {}, x = RX(t), y = hillY(x);
  // ── corredor
  const r = run(x, rd(t) * .95, { y, lean: .32, tilt: .15 });
  r.feet = r.feet.map(f => ({ x: f.x, y: f.y - y + hillY(f.x) }));
  const brake = stand(x + 6, { t, y: hillY(x + 6), lean: .1, tilt: -.2 });
  const tx = TROPHY;
  const reach = { ...stand(1408, { t, y: hillY(1408), lean: .35, tilt: .3 }), arms: [{ target: { x: tx - 6, y: hillY(tx) - 92 } }, { target: { x: tx + 4, y: hillY(tx) - 92 } }] };
  const lift = cheer(1414, { t, y: hillY(1414) });
  const troH = () => { const sh = shoulderOf(lift); return { x: sh.x + 8, y: sh.y - 84 }; };
  lift.arms = [{ target: troH() }, { target: { x: troH().x + 10, y: troH().y + 4 } }];
  const turnP = stand(1414, { t, y: hillY(1414), dir: -1, tilt: -.1, lean: -.02 });
  const tsh = shoulderOf(turnP);
  turnP.arms = [{ target: { x: tsh.x - 58, y: tsh.y + 20 } }, { target: { x: tsh.x - 48, y: tsh.y + 26 } }];
  const lookP = { ...turnP, tilt: .25, lean: .04 };
  const dropP = sad(1414, { t, y: hillY(1414), dir: -1, tilt: .6, lean: .25 });
  const kneelP = kneel(1418, { dir: -1, y: hillY(1418), lean: .45, tilt: .8 }); kneelP.arms = [{ ang: .1, bend: .1 }, { ang: -.05, bend: .1 }];
  o.hero = poseAt(t, [[0, () => r], [CUE.summit - .05, () => r], [CUE.summit + .35, brake], [CUE.grab - .1, reach], [CUE.grab + .1, reach], [CUE.raise, lift], [CUE.turn - .2, lift],
    [CUE.turn + .3, turnP], [CUE.empty, lookP], [CUE.drop, lookP], [CUE.drop + .8, dropP], [CUE.kneel, dropP], [CUE.kneel + .7, kneelP], [D, kneelP]]);
  // dónde está el trofeo
  if (t < CUE.grab) o.trophy = { x: tx, y: hillY(tx) - 70, a: 0, held: false };
  else if (t < CUE.fall) { const sl = E.solve(o.hero); const h = { x: (sl.arms[0][2].x + sl.arms[1][2].x) / 2, y: (sl.arms[0][2].y + sl.arms[1][2].y) / 2 }; o.trophy = { x: h.x, y: h.y + 4, a: 0, held: true }; }
  else {
    const k = prog(t, CUE.fall, CUE.fall + .45), sl = E.solve(o.hero);
    const st = { x: 1360, y: hillY(1360) - 70 };
    o.trophy = { x: lerp(1372, 1352, k), y: lerp(hillY(1372) - 150, hillY(1352) - 14, easeIn(k)), a: lerp(0, 1.6, k), held: false, fallen: true };
  }
  // ── familia: esposa y niño junto al camino; cada vez más lejos y más apagados
  o.fam = FAM.map((f, i) => {
    const dt = t - f.t, near = clamp(1 - Math.abs(dt + .6) / 1.6);
    const wave = Math.sin(t * 9) * .35;
    const wife = stand(f.x + 30, { t, y: hillY(f.x + 30), dir: -1, tilt: lerp(-.05, .3, prog(dt, .2, 1.2)), s: .97 });
    const kidX = f.x - 6 + (i === 0 ? 34 * easeOut(prog(dt, .1, 1.0)) : 0);
    const kid = i < 2 ? stand(kidX, { t, y: hillY(kidX), dir: i === 0 && dt > .1 && dt < 1.4 ? 1 : -1, tilt: -.2 + .5 * prog(dt, .8, 1.6), s: i === 0 ? .55 : .7 }) : null;
    if (i === 0 && dt > .1 && dt < 1.0) { const k = walk(kidX, kidX * 2, { s: .55, y: hillY(kidX), lean: .15 }); Object.assign(kid, k); kid.feet = k.feet.map(ft => ({ x: ft.x, y: ft.y - hillY(kidX) + hillY(ft.x) })); }
    const before = dt < .15, after = smooth(prog(dt, .2, 1.4));
    // brazos: saludan y se extienden hacia él; luego caen
    wife.arms = before ? [{ ang: Math.PI - .5 + wave, bend: .2 }, { ang: .9, bend: .3 }] : [{ ang: lerp(1.5, .15, after), bend: .2 }, { ang: lerp(1.3, -.05, after), bend: .2 }];
    if (kid) kid.arms = before ? [{ ang: Math.PI - .25, bend: .05 }, { ang: Math.PI - .7 - wave, bend: .2 }] : [{ ang: lerp(1.7, .1, after), bend: .1 }, { ang: lerp(1.5, -.05, after), bend: .2 }];
    if (i === 1 && kid) { const sh = shoulderOf(wife); wife.arms[1] = { target: { x: shoulderOf(kid).x + 4, y: shoulderOf(kid).y - 2 } }; }
    // se desvanecen tras su paso y desaparecen del todo al final
    const vis = (1 - f.fade * .8) * (1 - (i === 2 ? smooth(prog(dt, .8, 2.2)) : 0)) * (1 - smooth(prog(t, CUE.turn - .6, CUE.turn - .1)));
    return { wife, kid, vis, style: mixStyle(STYLE.hero, STYLE.gray, .35 + f.fade * .55) };
  });
  o.x = x;
  return o;
}
// globo de corazón rojo del niño: se le escapa y sube al cielo
function balloonPos(t, c) {
  const k = c.fam[0].kid, sl = E.solve(k), hand = sl.arms[0][2];
  if (t < CUE.e1 + 1.6) return { x: hand.x + 4 + Math.sin(t * 2) * 3, y: Math.min(hand.y - 60, headOf(k).y - 50), hand };
  const dt = t - CUE.e1 - 1.6;
  return { x: hand.x + 4 + dt * 26 + Math.sin(dt * 1.5) * 14, y: Math.min(hand.y - 60, headOf(k).y - 50) - dt * dt * 18 - dt * 40, hand: null };
}
function trophy(x, y, rot, glow, refl) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  if (!refl && glow > 0) glowCircle(0, -20, 110, '255,190,60', .35 * glow);
  ctx.fillStyle = '#ffc93c'; ctx.shadowColor = '#ffb400'; ctx.shadowBlur = 25 * glow;
  ctx.beginPath(); ctx.moveTo(-24, -52); ctx.lineTo(24, -52); ctx.quadraticCurveTo(22, -14, 4, -8); ctx.lineTo(4, 4); ctx.lineTo(14, 10); ctx.lineTo(-14, 10); ctx.lineTo(-4, 4); ctx.lineTo(-4, -8); ctx.quadraticCurveTo(-22, -14, -24, -52); ctx.fill();
  ctx.strokeStyle = '#ffc93c'; ctx.lineWidth = 5; ctx.shadowBlur = 0;
  ctx.beginPath(); ctx.arc(-25, -38, 10, Math.PI * .5, Math.PI * 1.5); ctx.stroke(); ctx.beginPath(); ctx.arc(25, -38, 10, -Math.PI * .5, Math.PI * .5); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.fillRect(-14, -48, 5, 26);
  ctx.restore();
}
function hill(refl) {
  ctx.save();
  ctx.beginPath(); ctx.moveTo(-600, FLOOR); ctx.lineTo(H0, FLOOR); ctx.lineTo(H1, FLOOR - RISE); ctx.lineTo(TOP + 600, FLOOR - RISE); ctx.lineTo(TOP + 600, FLOOR + 900); ctx.lineTo(H0 + 300, FLOOR + 900); ctx.lineTo(H0, FLOOR + 2);
  ctx.lineTo(H0, FLOOR + 2); ctx.closePath();
  const g = ctx.createLinearGradient(0, FLOOR - RISE, 0, FLOOR + 200);
  g.addColorStop(0, '#191919'); g.addColorStop(1, '#050505');
  ctx.fillStyle = g; ctx.fill();
  // borde iluminado de la ladera
  ctx.strokeStyle = 'rgba(230,230,230,.55)'; ctx.lineWidth = 2.5; ctx.shadowColor = 'rgba(255,255,255,.5)'; ctx.shadowBlur = 8;
  ctx.beginPath(); ctx.moveTo(-600, FLOOR); ctx.lineTo(H0, FLOOR); ctx.lineTo(H1, FLOOR - RISE); ctx.lineTo(TOP + 600, FLOOR - RISE); ctx.stroke();
  ctx.restore();
  // textura de piedritas en la ladera
  const g2 = rng(9); ctx.fillStyle = 'rgba(255,255,255,.07)';
  for (let i = 0; i < 160; i++) { const x = H0 + g2() * (TOP + 300 - H0), y = hillY(x) + 6 + g2() * 60; ctx.fillRect(x, y, 2 + g2() * 6, 1.5); }
}
// pedestal de la cima
function pedestal() {
  const y = hillY(TROPHY);
  ctx.fillStyle = '#3a3a3a'; ctx.fillRect(TROPHY - 26, y - 60, 52, 60);
  ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(TROPHY - 26, y - 60, 52, 3);
}

const camX = t => t < CUE.summit ? RX(t) + 60 * smooth(prog(t, 0, 1.2)) + 10 : keyed([[CUE.summit, RX(CUE.summit) + 70], [CUE.raise, 1400], [CUE.turn, 1395], [CUE.empty + .4, 1270], [CUE.drop + .6, 1310], [D, 1330]], t, p => p);
const camY = t => t < CUE.summit ? hillY(RX(t) + 60) - 180 : keyed([[CUE.summit, hillY(RX(CUE.summit) + 60) - 180], [CUE.raise, hillY(1400) - 200], [CUE.turn, hillY(1400) - 190], [CUE.empty + .4, FLOOR - RISE - 150], [D, FLOOR - RISE - 165]], t, p => p);
window.SCENE = {
  id: '14-llegar-solo', title: '¿De qué sirve llegar *solo*?', duration: D, cue: CUE,
  scroll: t => camX(t),
  sky: t => .35 * bump(t, CUE.raise - .2, CUE.turn + 1),
  spot: t => ({ x: camX(t), r: 360, a: .07 }),
  beam: t => ({ x: lerp(camX(t), TROPHY - 20, smooth(prog(t, CUE.summit - 1, CUE.summit))), a: .04 + .04 * bump(t, CUE.summit, CUE.empty + 1), w: 150 }),
  flashes: [CUE.raise + .05],
  blackouts: [CUE.empty - .05],
  reflection: true,
  camera: t => ({
    zoom: keyed([[0, 2.05], [1.5, 1.85], [CUE.e1 - .6, 1.75], [CUE.e1 + .8, 1.9], [CUE.e2 - .6, 1.7], [CUE.e2 + .8, 1.85], [CUE.e3, 1.75], [CUE.summit, 1.9], [CUE.raise + .2, 2.1], [CUE.turn, 2.15],
      [CUE.empty + .4, 1.5], [CUE.drop + .4, 1.55], [CUE.kneel + .5, 1.8], [D, 1.75]], t),
    x: camX(t), y: camY(t),
    shake: .15 * bump(t, 0, CUE.summit) * .5 + .4 * pulse(t, CUE.raise + .05, .4) + .3 * pulse(t, CUE.fall + .45, .3),
  }),
  backdrop(t) {
    const c = cast(t), b = balloonPos(t, c);
    if (!b.hand) { // el globo, ya suelto, se aleja en el cielo
      heart(b.x, b.y, 22, '#ff3b36', clamp(1 - (t - CUE.e1 - 1.6) / 14), 16);
    }
  },
  world(t, refl) {
    const c = cast(t);
    hill(refl);
    pedestal();
    c.fam.forEach((f, i) => {
      if (f.vis <= .01 || Math.abs(f.wife.hip.x - c.x) > 700) return;
      figure(f.wife, f.style, { alpha: f.vis });
      if (f.kid) figure(f.kid, f.style, { alpha: f.vis });
    });
    // globo en la mano del niño
    const b = balloonPos(t, c);
    if (b.hand && c.fam[0].vis > .01) {
      ctx.strokeStyle = 'rgba(220,220,220,.7)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(b.hand.x, b.hand.y); ctx.lineTo(b.x, b.y + 8); ctx.stroke();
      heart(b.x, b.y, 22, '#ff3b36', c.fam[0].vis, 18);
    }
    figure(c.hero, STYLE.hero);
    const tr = c.trophy, glow = t < CUE.fall ? .6 + .4 * bump(t, CUE.raise - .1, CUE.turn + .3) : clamp(1 - (t - CUE.fall) / .9) * .6;
    trophy(tr.x, tr.y, tr.a, glow, refl);
    if (!refl) {
      burst(tr.x, tr.y - 30, t, CUE.raise + .05, { color: '255,200,60', n: 40, speed: 340, gravity: .7, size: 4, life: 1.6, seed: 2 });
      burst(tr.x, tr.y - 30, t, CUE.raise + .15, { color: '255,60,50', n: 30, speed: 300, gravity: .7, size: 3.5, life: 1.6, seed: 5 });
      ring(tr.x, tr.y - 30, t, CUE.raise + .05, { r: 200, color: '255,210,120', width: 7 });
      burst(tr.x, tr.y, t, CUE.fall + .45, { color: '255,200,60', n: 14, speed: 120, gravity: 1.2, size: 2.5, life: .8, seed: 8 });
      // huecos donde estaban: siluetas fantasma que se apagan
      const gh = bump(t, CUE.empty - .1, CUE.empty + 1.6);
      if (gh > 0) for (const f of FAM) {
        const w = stand(f.x + 30, { y: hillY(f.x + 30), dir: -1, s: .97 }), k = stand(f.x - 6, { y: hillY(f.x - 6), dir: -1, s: .62 });
        figure(w, STYLE.dim, { alpha: .55 * gh, noShadow: true }); figure(k, STYLE.dim, { alpha: .55 * gh, noShadow: true });
      }
    }
  },
  events() {
    const ev = E.footsteps(D, t => { const c = cast(t); return [c.hero.phi !== undefined && t < CUE.summit + .2 ? { phi: c.hero.phi, size: 1.1, moving: true } : null]; });
    return ev.concat([
      { t: 0, type: 'whoosh', vol: .8 }, { t: .05, type: 'impact', vol: .6 }, { t: .1, type: 'clock', dur: CUE.summit - .2 },
      ...[0, 1, 2].map(i => ({ t: FAM[i].t - .8, type: 'bell', note: [79, 76, 72][i], vol: .5 - i * .12 })),
      { t: FAM[0].t + 1.6, type: 'pop', vol: .3 },
      { t: CUE.summit, type: 'riser', dur: .9 }, { t: CUE.raise, type: 'impact' }, { t: CUE.raise + .05, type: 'cheer', dur: 1.2, vol: .6 }, { t: CUE.raise + .1, type: 'sparkle' },
      { t: CUE.empty - .05, type: 'boom', vol: .6 }, { t: CUE.empty, type: 'wind', dur: 5, vol: .8 },
      { t: CUE.empty + .3, type: 'heartbeat', vol: .7 }, { t: CUE.empty + 1.1, type: 'heartbeat', vol: .55 }, { t: CUE.empty + 1.9, type: 'heartbeat', vol: .4 },
      { t: CUE.fall + .45, type: 'clatter' }, { t: CUE.kneel + .6, type: 'thud', vol: .5 },
    ]);
  },
  music: {
    sections: [
      { t: .1, dur: CUE.summit - .1, style: 'build', chords: ['Am', 'F', 'C', 'G'], chordLen: 1.6 },
      { t: CUE.summit, dur: CUE.turn - CUE.summit, style: 'epic', chords: ['F', 'G', 'C'], chordLen: .8 },
      { t: CUE.empty + 1, dur: D - CUE.empty - 1, style: 'sad', chords: ['Am', 'F', 'Am', 'E'], chordLen: 1.4 },
    ],
    stingers: [{ t: CUE.raise, type: 'bells' }],
    duck: [[CUE.turn + .1, CUE.empty + 1]],
  },
};
})();
