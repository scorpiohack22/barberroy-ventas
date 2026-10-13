// 09 — JUNTOS: uno solo no puede mover la roca que tapa el sol; llegan otros, jalan juntos, la roca cede y sale el sol.
(() => {
const { FLOOR, ctx, clamp, lerp, prog, smooth, easeOut, easeInOut, keyed, bump, pulse, rng, walk, run, stand, sit, cheer, mix, poseAt,
  shoulderOf, figure, mixStyle, STYLE, sun, glowCircle, burst, ring, rays, heart } = E;
const D = 20;
const CUE = { regrip: 1.3, slip: 2.9, sitDown: 3.25, turnAway: 3.7, f2In: 4.5, f2Stop: 5.75, offer: 5.9, rise: 6.25, up: 6.9, grab2: 7.4,
  f3In: 7.5, f3Grab: 8.35, f4In: 7.9, f4Grab: 8.75, load: 9.0, heave: 9.45, haulEnd: 12.9, drop: 13.1, light: 13.3, cheer: 14.0, hug: 16.2 };
const R = 100, ROCK0 = 560, ROCK1 = 445;
// tiempo de acción con cámara lenta en el tirón
const slowT = t => t < CUE.heave ? t : t < CUE.heave + 1.2 ? CUE.heave + (t - CUE.heave) * .4 : CUE.heave + .48 + (t - CUE.heave - 1.2);
const haul = t => easeInOut(prog(slowT(t), CUE.heave + .05, CUE.haulEnd - .7));
const rockX = t => lerp(ROCK0, ROCK1, haul(t)) + (t < CUE.heave ? Math.sin(t * 50) * 1.6 * (bump(t, CUE.regrip, CUE.regrip + .6) + bump(t, CUE.grab2, 8.9) * .8) : 0);
const light = t => smooth(prog(t, CUE.light - .4, CUE.light + 1.2));
const sunY = t => lerp(FLOOR - 112, FLOOR - 375, easeInOut(prog(t, 10.2, 14.2)));
const SUNX = 522;
const anchor = t => ({ x: rockX(t) - R * .82, y: FLOOR - 104 });
const ropeY = (t, x) => { const a = anchor(t); return a.y + (a.x - x) * .03; };

// pose de jalar (mirando a la roca, a la derecha, inclinado hacia atrás)
function puller(x, t, o = {}) {
  const back = o.back || 0, strain = o.strain ?? 1;
  const w = walk(x, -back, { freeze: o.moving ? 0 : 1 });
  const tremble = Math.sin(t * 37 + x) * .012 * strain;
  const p = {
    hip: { x, y: FLOOR - 84 + (o.drop || 0) + (o.moving ? -Math.cos(4 * Math.PI * w.phi) * 2 : 0) }, s: 1, dir: 1,
    lean: lerp(-.05, -.42, strain) + tremble + (o.lean || 0), tilt: .22 * strain + .05,
    feet: o.moving ? w.feet.map(f => ({ x: f.x + 16, y: f.y })) : [{ x: x + 40, y: FLOOR }, { x: x - 16, y: FLOOR }], phi: w.phi,
  };
  const sh = shoulderOf(p), hx = sh.x + 50 + 8 * (1 - strain);
  p.arms = [{ target: { x: hx, y: ropeY(t, hx) } }, { target: { x: hx - 22, y: ropeY(t, hx - 22) + 2 } }];
  return p;
}
const reachRope = (p, t, amt) => { // brazos hacia la cuerda (amt 0..1) desde la pose dada
  if (amt <= 0) return p;
  const sh = shoulderOf(p), hx = sh.x + 50;
  const tgt = [{ x: hx, y: ropeY(t, hx) }, { x: hx - 22, y: ropeY(t, hx - 22) }];
  const sl = E.solve(p);
  p.arms = [0, 1].map(i => ({ target: E.lerpP(sl.arms[i][2], tgt[i], amt) }));
  return p;
};

function cast(t) {
  const ts = slowT(t), back = (ROCK0 - rockX(t)) , h = haul(t);
  const moving = h > 0 && h < 1 && Math.abs(lerp(ROCK0, ROCK1, haul(t + .05)) - lerp(ROCK0, ROCK1, h)) > .3;
  const HX = 398, X2 = 346, X3 = 294, X4 = 242;
  // tirón coordinado: todos se echan adelante (carga) y luego atrás (tirón)
  const load = bump(t, CUE.load, CUE.heave + .1) * .3, yank = smooth(prog(ts, CUE.heave, CUE.heave + .25));
  const lean = load - .12 * yank * (1 - smooth(prog(ts, CUE.heave + .5, CUE.heave + 1.3)));
  const reg = bump(t, CUE.regrip, CUE.regrip + .5) * .28 - bump(t, CUE.regrip + .45, CUE.regrip + 1) * .12;
  const out = {};
  // ── héroe
  const hPull = puller(HX - back, t, { back, moving, lean: t < 2.9 ? reg : lean });
  const slipFall = (() => { // resbala: el pie se va adelante y cae sentado
    const p = puller(HX, t, { lean: reg });
    const q = sit(HX + 18, { ground: true, lean: -.25, tilt: .1, arms: [{ ang: -.6, bend: .2 }, { ang: -.9, bend: .2 }] });
    return mix(p, q, easeOut(prog(t, CUE.slip, CUE.sitDown)));
  });
  const slump = sit(HX + 4, { ground: true, dir: -1, lean: .75, tilt: .7, arms: [{ target: { x: HX - 46, y: FLOOR - 38 } }, { target: { x: HX - 40, y: FLOOR - 30 } }] });
  slump.hip.y += Math.sin(t * 2.4) * 1.2; slump.feet = [{ x: HX - 54, y: FLOOR }, { x: HX - 46, y: FLOOR }];
  const lookUp = { ...slump, lean: .35, tilt: -.35, arms: [{ target: { x: HX - 50, y: FLOOR - 120 } }, { target: { x: HX - 30, y: FLOOR - 30 } }] };
  const hStand = stand(HX - 8, { t, dir: -1, tilt: -.1 });
  hStand.arms = [{ target: { x: HX - 50, y: FLOOR - 125 } }, { ang: .1, bend: .3 }];
  const hTurn = reachRope(stand(HX, { t, dir: 1, tilt: .2 }), t, 1);
  out.hero = t < CUE.slip ? hPull
    : t < CUE.turnAway ? slipFall()
    : t < CUE.grab2 + .4 ? poseAt(t, [[CUE.turnAway, slipFall], [CUE.turnAway + .7, slump], [CUE.offer + .1, slump], [CUE.rise, lookUp], [CUE.up, hStand], [CUE.grab2, hTurn], [CUE.grab2 + .4, () => puller(HX, t, { strain: .9 })]])
    : hPull;
  // ── ayudantes: entran caminando/corriendo, toman la cuerda
  const helper = (x, tin, tstop, tgrab, runIn) => {
    if (t < tin) return null;
    const xs = -70, k = easeOut(prog(t, tin, tstop)), xx = lerp(xs, x, k);
    const go = runIn ? run(xx, xx * 1.05) : walk(xx, xx, { lean: .1 });
    const pre = mix(go, stand(x, { t, tilt: .15 }), smooth(prog(t, tstop - .25, tstop + .1)));
    return poseAt(t, [[tstop, pre], [tgrab, reachRope(stand(x, { t, tilt: .25, lean: .2 }), t, 1)], [tgrab + .35, () => puller(x - back, t, { back, moving, lean, strain: .85 })], [D, () => puller(x - back, t, { back, moving, lean })]]);
  };
  // f2 llega, ofrece la mano, levanta al héroe y luego toma la cuerda
  if (t >= CUE.f2In) {
    const xs = -70, k = easeOut(prog(t, CUE.f2In, CUE.f2Stop)), xx = lerp(xs, X2 - 52, k);
    const go = walk(xx, xx, { lean: .08 });
    const st = stand(X2 - 52, { t, tilt: .35, lean: .12 });
    const offer = { ...st, lean: .22, tilt: .45, arms: [{ target: { x: HX - 50, y: FLOOR - 125 } }, { ang: .1, bend: .3 }] };
    const lift = { ...stand(X2 - 30, { t, tilt: .1, lean: -.08 }), arms: [{ target: { x: HX - 40, y: FLOOR - 140 } }, { ang: -.1, bend: .3 }] };
    out.f2 = poseAt(t, [[CUE.f2In, go], [CUE.f2Stop - .2, () => go], [CUE.f2Stop + .1, st], [CUE.offer + .3, offer], [CUE.rise + .1, offer], [CUE.up, lift],
      [CUE.grab2, reachRope(stand(X2, { t, tilt: .25, lean: .2 }), t, 1)], [CUE.grab2 + .4, () => puller(X2, t, { strain: .85 })],
      [CUE.f3Grab, () => puller(X2 - back, t, { back, moving, lean })], [D, () => puller(X2 - back, t, { back, moving, lean })]]);
  }
  out.f3 = helper(X3, CUE.f3In, CUE.f3Grab - .35, CUE.f3Grab, true);
  out.f4 = helper(X4, CUE.f4In, CUE.f4Grab - .35, CUE.f4Grab, true);
  // ── final: sueltan la cuerda, celebran, se abrazan mirando al sol
  if (t > CUE.drop) {
    const order = [['hero', HX], ['f2', X2], ['f3', X3], ['f4', X4]];
    order.forEach(([k, x0], i) => {
      const x = x0 - (ROCK0 - ROCK1), hxF = 318 - i * 54;
      const base = out[k];
      const stumble = { ...stand(x - 14, { t, tilt: -.25, lean: -.2 }), arms: [{ ang: .5, bend: .4 }, { ang: .3, bend: .4 }] };
      const amaze = { ...stand(lerp(x, hxF, .5), { t, tilt: -.5, lean: -.06 }), arms: [{ ang: .25, bend: .5 }, { ang: .15, bend: .5 }] };
      const jumpT = t - CUE.cheer - i * .13, jump = jumpT > 0 && t < CUE.hug - .2 ? Math.abs(Math.sin(jumpT * 5.2)) * 26 * (1 - prog(t, CUE.hug - .9, CUE.hug - .2)) : 0;
      const ch = cheer(hxF, { t }); ch.hip.y -= jump; ch.feet.forEach(f => f.y -= jump);
      ch.arms = [{ ang: Math.PI - .45 + Math.sin(t * 7 + i) * .15, bend: .1 }, { ang: Math.PI - .25 - Math.sin(t * 7 + i) * .15, bend: .1 }];
      const hugP = stand(hxF, { t, tilt: -.38, lean: -.02 });
      out[k] = poseAt(t, [[CUE.drop, base], [CUE.drop + .35, stumble], [CUE.light + .3, stumble], [CUE.light + .8, amaze], [CUE.cheer + i * .1, amaze],
        [CUE.cheer + .35 + i * .1, ch], [CUE.hug - .3, () => ch], [CUE.hug + .5, hugP], [D, hugP]]);
      out[k].hx = hugP.hip.x; out[k].hugP = hugP;
    });
    // brazos sobre los hombros del vecino
    const hk = smooth(prog(t, CUE.hug + .1, CUE.hug + .7));
    if (hk > 0) {
      const keys = ['hero', 'f2', 'f3', 'f4'];
      const shs = keys.map(k => shoulderOf(out[k]));
      keys.forEach((k, i) => {
        const sl = E.solve(out[k]);
        const tgt = i > 0 ? { x: shs[i - 1].x - 6, y: shs[i - 1].y + 4 } : { x: shs[0].x + 52 + Math.sin(t * 3) * 3, y: shs[0].y - 56 };
        out[k].arms = [{ target: E.lerpP(sl.arms[0][2], tgt, hk) }, { target: sl.arms[1][2] }];
      });
    }
  }
  return out;
}

// roca irregular con volumen, rueda al moverse
const rockPts = (() => { const g = rng(7); return Array.from({ length: 22 }, (_, i) => ({ a: i / 22 * Math.PI * 2, r: R * (.9 + g() * .13) })); })();
const cracks = (() => { const g = rng(19); return Array.from({ length: 6 }, () => { const a = g() * 6.28, r0 = g() * .5; return [a, r0, .25 + g() * .4, (g() - .5) * .8]; }); })();
function rock(x, t, refl) {
  const cy = FLOOR - R + 8, rot = -(ROCK0 - x) / R;
  ctx.save(); ctx.translate(x, cy);
  if (!refl) { ctx.save(); ctx.translate(0, R - 8); ctx.scale(1, .16); const g = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 1.4); g.addColorStop(0, 'rgba(0,0,0,.75)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(-R * 1.5, -R * 1.5, R * 3, R * 3); ctx.restore(); }
  ctx.save(); ctx.rotate(rot);
  ctx.beginPath(); rockPts.forEach((p, i) => { const px = Math.cos(p.a) * p.r, py = Math.sin(p.a) * p.r * .94; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }); ctx.closePath();
  ctx.restore();
  const g = ctx.createRadialGradient(-R * .4, -R * .45, R * .1, 0, 0, R * 1.1);
  g.addColorStop(0, '#77736d'); g.addColorStop(.55, '#46433f'); g.addColorStop(1, '#1d1c1a');
  ctx.fillStyle = g; ctx.fill();
  // borde rojo del sol que está detrás
  const rim = 1 - smooth(prog(sunY(t), FLOOR - 200, FLOOR - 300));
  ctx.save(); ctx.clip(); ctx.globalCompositeOperation = 'lighter';
  const rg = ctx.createRadialGradient(SUNX - x, sunY(t) - cy, 10, SUNX - x, sunY(t) - cy, R * 1.4);
  rg.addColorStop(0, `rgba(255,60,40,${.0})`); rg.addColorStop(.55, `rgba(255,50,40,${.0})`); rg.addColorStop(.8, `rgba(255,50,40,${.22 * rim})`); rg.addColorStop(1, 'rgba(255,50,40,0)');
  ctx.fillStyle = rg; ctx.fillRect(-R * 1.2, -R * 1.2, R * 2.4, R * 2.4);
  ctx.restore();
  ctx.save(); ctx.rotate(rot); ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  for (const [a, r0, len, bend] of cracks) { ctx.beginPath(); const x0 = Math.cos(a) * R * r0, y0 = Math.sin(a) * R * r0; ctx.moveTo(x0, y0); ctx.quadraticCurveTo(x0 + Math.cos(a + bend) * R * len * .6, y0 + Math.sin(a + bend) * R * len * .6, x0 + Math.cos(a) * R * len * 1.2, y0 + Math.sin(a) * R * len * 1.2); ctx.stroke(); }
  ctx.restore();
  // amarre de la cuerda
  ctx.strokeStyle = '#cdbb9a'; ctx.lineWidth = 6; ctx.beginPath(); ctx.ellipse(0, -4, R * .93, 16, 0, 0, Math.PI, false); ctx.stroke();
  ctx.restore();
}

window.SCENE = {
  id: '09-juntos', title: 'Solo no, *juntos sí*', duration: D, cue: CUE,
  sky: t => .25 + .75 * light(t),
  spot: t => ({ x: lerp(420, 330, light(t)), r: lerp(300, 420, light(t)) }),
  beam: t => ({ x: lerp(400, 300, light(t)), a: lerp(.05, .03, light(t)), w: 170 }),
  flashes: [CUE.heave + .05, CUE.light + .1],
  blackouts: [CUE.slip + .3],
  camera: t => {
    const sh = .5 * pulse(t, CUE.sitDown, .25) + .35 * bump(t, CUE.regrip, CUE.regrip + .6) * .4 + .7 * pulse(t, CUE.heave + .1, .5) + .25 * bump(t, CUE.heave, CUE.haulEnd - 1) * .5 + .3 * bump(t, CUE.grab2 + .3, 8.9) * .25;
    return {
      zoom: keyed([[0, 2.25], [2.7, 2.15], [3.3, 2.35], [4.4, 2.2], [5.2, 1.85], [7.3, 1.8], [8.6, 1.62], [9.4, 1.72], [10.2, 1.66], [12.6, 1.6], [13.6, 1.48], [16, 1.52], [D, 1.42]], t),
      x: keyed([[0, 445], [2.7, 430], [3.4, 400], [4.4, 385], [6, 350], [8.6, 375], [9.4, 380], [12.6, 320], [13.6, 330], [16, 335], [D, 332]], t),
      y: keyed([[0, FLOOR - 160], [3.4, FLOOR - 130], [4.4, FLOOR - 150], [8.6, FLOOR - 180], [12, FLOOR - 200], [13.6, FLOOR - 245], [D, FLOOR - 250]], t),
      shake: sh,
    };
  },
  backdrop(t) {
    const y = sunY(t), l = light(t);
    sun(SUNX, y, 44 + 10 * l);
    if (l > 0) rays(SUNX, y, t, l, '255,60,50', 16, 900);
  },
  world(t, refl) {
    const c = cast(t), l = light(t);
    const rx = rockX(t);
    rock(rx, t, refl);
    if (!refl) { // polvo al moverse
      burst(rx - R * .7, FLOOR - 6, t, CUE.heave + .05, { color: '170,160,150', n: 46, speed: 230, gravity: 1.2, size: 3.2, life: 1.6, seed: 4 });
      burst(rx - R * .5, FLOOR - 4, t, 11.0, { color: '150,145,140', n: 22, speed: 140, gravity: 1, size: 2.6, life: 1.2, seed: 8 });
      ring(rx, FLOOR - 2, t, CUE.heave + .05, { r: 260, flat: .18, life: 1, color: '255,255,255' });
    }
    const helperStyle = mixStyle(STYLE.gray, STYLE.hero, Math.max(.25 * smooth(prog(t, CUE.heave, CUE.heave + 1)), l));
    const keys = ['f4', 'f3', 'f2', 'hero'];
    const hands = [];
    for (const k of keys) {
      if (!c[k]) continue;
      const sl = figure(c[k], k === 'hero' ? STYLE.hero : helperStyle);
      hands.push({ k, h: sl.arms[0][2], h2: sl.arms[1][2] });
    }
    // cuerda: del amarre a las manos de quienes jalan; si nadie, tirada en el piso
    const a = anchor(t);
    const holding = hands.filter(o => {
      if (t > CUE.drop + .1) return false;
      if (o.k === 'hero') return t < CUE.slip + .12 || t > CUE.grab2 + .1;
      if (o.k === 'f2') return t > CUE.grab2 + .1;
      if (o.k === 'f3') return t > CUE.f3Grab - .05;
      return t > CUE.f4Grab - .05;
    }).sort((p, q) => q.h.x - p.h.x);
    ctx.save(); ctx.globalAlpha *= 1;
    if (holding.length) {
      const pts = [a, ...holding.map(o => o.h)];
      const last = holding[holding.length - 1].h2;
      pts.push(last, { x: last.x - 40, y: FLOOR - 4 }, { x: last.x - 110, y: FLOOR - 1 });
      E.rope(pts, '#d8c7a4', 5);
    } else {
      const slack = smooth(prog(t, CUE.slip, CUE.slip + .5)), dropped = t > CUE.drop;
      const end = dropped ? { x: a.x - 110, y: FLOOR - 2 } : { x: lerp(a.x - 40, a.x - 210, slack), y: lerp(a.y, FLOOR - 2, slack) };
      E.rope([a, { x: dropped ? a.x - 4 : lerp(a.x - 20, a.x - 30, slack), y: lerp(a.y, FLOOR - 3, slack) }, end, { x: end.x - 60, y: FLOOR }], '#d8c7a4', 5);
    }
    ctx.restore();
    if (!refl && t > CUE.hug + .4) { // corazón sobre el grupo
      const hp = smooth(prog(t, CUE.hug + .4, CUE.hug + 1.2));
      heart(215, FLOOR - 300 - 14 * hp + Math.sin(t * 3) * 3, 30 * E.backOut(hp), '#ff3b36', hp);
    }
  },
  front(t) {
    burst(300, FLOOR - 260, t, CUE.cheer + .3, { color: '255,70,55', n: 34, speed: 300, gravity: .6, size: 4, life: 1.6, seed: 12 });
    burst(170, FLOOR - 240, t, CUE.cheer + .55, { color: '255,255,255', n: 22, speed: 260, gravity: .6, size: 3, life: 1.4, seed: 15 });
  },
  events() {
    const ev = E.footsteps(D, t => {
      const c = cast(t);
      return ['f2', 'f3', 'f4'].map(k => c[k] && c[k].phi !== undefined ? { phi: c[k].phi, size: 1, moving: true } : null);
    });
    return ev.concat([
      { t: 0, type: 'whoosh', vol: .7 }, { t: .12, type: 'impact', vol: .7 }, { t: .15, type: 'rumble', dur: 1.8, vol: .5 }, { t: .2, type: 'crack', vol: .4 },
      { t: CUE.regrip + .3, type: 'crack', vol: .3 },
      { t: CUE.slip, type: 'scuff' }, { t: CUE.slip + .05, type: 'slide', dur: .3 }, { t: CUE.sitDown, type: 'thud', vol: .9 },
      { t: CUE.sitDown + .5, type: 'heartbeat', vol: .5 }, { t: CUE.sitDown + 1.3, type: 'heartbeat', vol: .35 },
      { t: CUE.rise, type: 'whoosh', vol: .4 },
      { t: CUE.grab2 + .4, type: 'rumble', dur: 1.2, vol: .45 },
      { t: CUE.load, type: 'whoosh', vol: .5 }, { t: CUE.heave, type: 'boom' }, { t: CUE.heave + .02, type: 'crack', vol: .9 },
      { t: CUE.heave + .1, type: 'rumble', dur: 3.4, vol: 1 },
      { t: CUE.light - .6, type: 'riser', dur: .9 }, { t: CUE.light + .1, type: 'impact' },
      { t: CUE.cheer + .2, type: 'cheer', dur: 2.4, vol: .9 }, { t: CUE.cheer + .4, type: 'sparkle' }, { t: CUE.hug + .6, type: 'chime' },
    ]);
  },
  music: {
    sections: [
      { t: .2, dur: CUE.f2In - .2, style: 'tension', chords: ['Am', 'Em'], chordLen: 2.2 },
      { t: CUE.f2In, dur: CUE.heave - CUE.f2In, style: 'build', chords: ['Am', 'F', 'C', 'G'], chordLen: 1.2 },
      { t: CUE.heave, dur: CUE.light - CUE.heave, style: 'epic', chords: ['F', 'G', 'Am', 'G'], chordLen: 1 },
      { t: CUE.light, dur: D - CUE.light, style: 'hope', chords: ['F', 'C', 'G', 'C'], chordLen: 1.6 },
    ],
    stingers: [{ t: CUE.heave, type: 'impact' }, { t: CUE.light + .1, type: 'bells' }],
    duck: [[CUE.load - .1, CUE.heave - .05]],
  },
};
})();
