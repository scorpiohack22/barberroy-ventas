// 32 — LEVÁNTATE: sube la escalera y cae rodando, una y otra vez (las rayitas cuentan 7 caídas).
// Tirado en el piso mira las marcas... se levanta por octava vez (rayita roja) y llega a la cima: la bandera se enciende.
(() => {
const { FLOOR, clamp, lerp, prog, smooth, easeOut, easeIn, easeInOut, keyed, figure, STYLE, mix, stand, walk, run, kneel, lie, sit, glowCircle, ctx } = E;
const D = 21;
// escalera: 8 escalones
const SX = 200, SW = 38, SH = 30, NS = 8, TOPX = SX + SW * NS, TOPH = SH * NS, FLAGX = 590;
const stepH = x => x < SX ? 0 : x >= TOPX ? TOPH : SH * (Math.floor((x - SX) / SW) + 1);
const rampH = x => clamp((x - SX + SW * .5) / (SW * NS)) * TOPH;
// intentos: inicio, x inicial, resbalón, x del resbalón, aterrizaje, de pie
const A = [
  { c0: -.2, x0: 226, slip: 1.45, xs: 348, land: 2.3, up: 3.35 },
  { c0: 3.35, x0: 150, slip: 4.95, xs: 392, land: 5.6, up: 6.45 },
  { c0: 6.45, x0: 150, slip: 7.55, xs: 372, land: 8.0, up: 8.5 },
  { c0: 8.5, x0: 150, slip: 9.35, xs: 414, land: 9.75, up: 10.1 },
  { c0: 10.1, x0: 150, slip: 10.8, xs: 366, land: 11.1, up: 11.42 },
  { c0: 11.42, x0: 150, slip: 12.0, xs: 396, land: 12.28, up: 12.55 },
  { c0: 12.55, x0: 150, slip: 13.12, xs: 434, land: 13.5, up: 99 },
];
const C = { look: 14.0, prop: 14.5, kneelT: 15.0, rise: 15.55, go: 16.05, stagger: 17.0, top: 18.15, light: 18.5 };
const LAND7 = A[6].land;
const LX = 178; // donde cae

function climbPose(x, d, fast, lean = 0) {
  const y = FLOOR - rampH(x);
  const p = fast ? run(x, d, { lean: .34 + lean, y, tilt: -.1 }) : walk(x, d, { lean: .2 + lean, y, stride: 1.05, tilt: -.05 });
  p.feet = p.feet.map(f => { const lift = y - f.y; return { x: f.x, y: FLOOR - stepH(f.x) - lift }; });
  return p;
}
// pose "bola" para rodar (local, luego se rota)
function ballPose(cx, cy) {
  return { hip: { x: cx - 8, y: cy + 14 }, s: 1, dir: 1, lean: 1.1, tilt: .6,
    feet: [{ x: cx + 26, y: cy + 22 }, { x: cx + 18, y: cy + 30 }],
    arms: [{ target: { x: cx + 30, y: cy - 6 } }, { target: { x: cx + 24, y: cy } }] };
}
function tumble(a, t) {
  const p = prog(t, a.slip + .22, a.land), u = p * p * .45 + p * .55;
  const x0 = a.xs - 14, x = lerp(x0, LX + 10, u);
  const bounces = Math.max(2, Math.round((a.xs - SX) / SW));
  const y = FLOOR - Math.max(rampH(x), 0) - 48 - Math.abs(Math.sin(u * Math.PI * bounces)) * 26 * (1 - u * .6);
  return { x, y, ang: -u * Math.PI * 2 * (1 + bounces * .35) };
}
const fallen = tilt => ({ ...lie(LX, { dir: 1, tilt }), feet: [{ x: LX - 62, y: FLOOR }, { x: LX - 99.6, y: FLOOR - 9 }],
  arms: [{ ang: -1.4, bend: .1 }, { ang: 1.5, bend: .15 }] });
const getUp = (a, t, x) => {
  const k = clamp((a.up - a.land) / 1.05, .3, 1);
  const lieP = fallen(-.1);
  const kn = { ...kneel(LX - 14, { tilt: .35, lean: .3 }), arms: [{ target: { x: LX + 22, y: FLOOR - 56 } }, { ang: .3, bend: .4 }] };
  const st = { ...stand(150, { t, tilt: -.12, lean: .06 }), arms: [{ ang: .15, bend: .9 }, { ang: -.1, bend: .9 }] };
  return E.poseAt(t, [[a.land, lieP], [a.land + .3 * k, lieP], [a.land + .7 * k, kn], [a.up, st]]);
};

function state(t) {
  // intento actual
  let i = A.findIndex(a => t < a.up);
  if (i < 0 || t >= C.go - .001 && i === -1) i = 7;
  if (t >= A[6].land) {
    if (t < C.go) return { kind: 'pose', pose: finalRise(t) };
    return { kind: 'pose', pose: lastClimb(t) };
  }
  const a = A[i];
  if (t < a.slip) {
    const p = prog(t, a.c0, a.slip), speed = (a.xs - a.x0) / (a.slip - a.c0);
    const x = lerp(a.x0, a.xs, a.c0 < 0 ? p : easeIn(p) * .25 + p * .75);
    const climb = climbPose(x, x - a.x0 + 30 * i, speed > 165, .06 * i / 6);
    if (a.c0 > 0 && t < a.c0 + .12) return { kind: 'pose', pose: mix(getUp(A[i - 1], t, x), climb, prog(t, a.c0, a.c0 + .12)) };
    return { kind: 'pose', pose: climb };
  }
  if (t < a.slip + .22) { // resbala: pierde el piso y se va de espaldas
    const q = prog(t, a.slip, a.slip + .22), y = FLOOR - rampH(a.xs);
    const base = climbPose(a.xs, a.xs - a.x0 + 30 * i, false);
    const back = { hip: { x: a.xs - 12, y: y - 84 }, s: 1, dir: 1, lean: -.7, tilt: -.5,
      feet: [{ x: a.xs + 34, y: y - 40 }, { x: a.xs + 6, y: y - 8 }], arms: [{ ang: 2.7, bend: .2 }, { ang: 2.2, bend: .3 }] };
    return { kind: 'pose', pose: mix(base, back, easeOut(q)) };
  }
  if (t < a.land) return { kind: 'ball', tb: tumble(a, t) };
  return { kind: 'pose', pose: getUp(a, t) };
}
function finalRise(t) {
  const lieP = fallen(-.1);
  const lookUp = fallen(-.6);
  const prop = { ...sit(LX - 40, { ground: true, tilt: -.55, lean: -.3 }), arms: [{ target: { x: LX - 80, y: FLOOR - 4 } }, { target: { x: LX - 74, y: FLOOR - 4 } }] };
  const kn = { ...kneel(LX - 14, { tilt: -.2, lean: .25 }), arms: [{ target: { x: LX + 22, y: FLOOR - 56 } }, { ang: .2, bend: .9 }] };
  const st = { ...stand(152, { t, tilt: -.28, lean: -.02 }), arms: [{ ang: .25, bend: 1.5 }, { ang: .1, bend: 1.5 }] };
  return E.poseAt(t, [[LAND7, lieP], [C.look - .2, lieP], [C.look + .2, lookUp], [C.prop - .1, lookUp], [C.prop + .4, prop], [C.kneelT, prop], [C.kneelT + .35, kn], [C.rise - .1, kn], [C.rise + .45, st]]);
}
const lastX = t => {
  const v = keyed([[C.go, 0], [C.go + .5, 200], [C.stagger - .05, 200], [C.stagger + .05, 0], [C.stagger + .4, 0], [C.stagger + .6, 220], [C.top - .3, 200], [C.top, 0]], t);
  return v;
};
const lastD = E.distance([[0, 0], [C.go, 0], [C.go + .5, 200], [C.stagger - .05, 200], [C.stagger + .05, 0], [C.stagger + .4, 0], [C.stagger + .6, 220], [C.top - .3, 200], [C.top, 0], [D, 0]], D);
function lastClimb(t) {
  const x = Math.min(152 + lastD(t) - lastD(C.go), 532);
  const p = climbPose(x, lastD(t), true, .05);
  // tropiezo: se apoya con la mano en el escalón y sigue
  const sg = E.bump(t, C.stagger - .05, C.stagger + .55);
  if (sg > .002) {
    const y = FLOOR - rampH(x);
    const catchP = { hip: { x: x - 6, y: y - 62 }, s: 1, dir: 1, lean: .95, tilt: -.25, feet: [{ x: x + 14, y: FLOOR - stepH(x + 14) }, { x: x - 34, y: FLOOR - stepH(x - 34) }],
      arms: [{ target: { x: x + 56, y: FLOOR - stepH(x + 56) - 2 } }, { target: { x: x + 46, y: FLOOR - stepH(x + 46) - 2 } }] };
    return mix(p, catchP, sg);
  }
  const top = { ...stand(536, { t, y: FLOOR - TOPH, tilt: -.1 }), arms: [{ target: { x: FLAGX - 2, y: FLOOR - TOPH - 112 } }, { ang: .3, bend: .4 }] };
  const ch = { ...stand(530, { t, y: FLOOR - TOPH, tilt: -.45, lean: -.1 }), arms: [{ ang: Math.PI - .35, bend: .05 }, { ang: Math.PI - .65, bend: .1 }] };
  if (t > C.top - .25) return E.poseAt(t, [[C.top - .25, p], [C.top + .15, top], [C.light - .05, top], [C.light + .3, ch]]);
  return p;
}

// ── dibujo ──
function stairs() {
  for (let k = 0; k < NS; k++) {
    const x = SX + k * SW, y = FLOOR - SH * (k + 1);
    ctx.fillStyle = '#222'; ctx.fillRect(x, y, TOPX + 160 - x, SH * (k + 1) - SH * k);
    ctx.fillStyle = '#2c2c2c'; ctx.fillRect(x, y, SW + 1, SH * (k + 1));
    ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.fillRect(x, y, SW, 2.5);
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(x, y + 2.5, 3, SH - 2.5);
  }
  ctx.fillStyle = '#2c2c2c'; ctx.fillRect(TOPX, FLOOR - TOPH, 260, TOPH);
  ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.fillRect(TOPX, FLOOR - TOPH, 260, 2.5);
}
const MARKS = (() => { const r = E.rng(8), a = []; for (let i = 0; i < 8; i++) a.push({ tilt: (r() - .5) * .12, h: 70 + r() * 8 }); return a; })();
const markT = i => i < 7 ? A[i].land + .05 : C.rise + .2;
function tally(t, refl) {
  if (refl) return;
  ctx.save(); const K = ctx.canvas.width / E.W; ctx.setTransform(K, 0, 0, K, 0, 0);
  const bx = 222, by = 130;
  for (let i = 0; i < 8; i++) {
    const t0 = markT(i), p = prog(t, t0, t0 + .22); if (p <= 0) continue;
    const sc = lerp(2.2, 1, easeOut(p)), m = MARKS[i];
    let x0, y0, x1, y1;
    if (i === 4) { x0 = bx - 14; y0 = by + 56; x1 = bx + 3 * 34 + 16; y1 = by + 4; }
    else { const col = i < 4 ? i : i - 1, gx = col >= 4 ? 36 : 0; x0 = x1 = bx + col * 34 + gx; y0 = by + 74; y1 = by + 74 - m.h; x1 += Math.sin(m.tilt) * m.h; }
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    const red = i === 7;
    ctx.save(); ctx.translate(cx, cy); ctx.scale(sc, sc); ctx.translate(-cx, -cy);
    ctx.globalAlpha = clamp(p * 3);
    ctx.strokeStyle = red ? '#ff3b36' : '#e8e8e8'; ctx.lineWidth = 12; ctx.lineCap = 'round';
    ctx.shadowColor = red ? '#ff2020' : 'rgba(255,255,255,.6)'; ctx.shadowBlur = red ? 30 : 14;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    ctx.restore();
    if (red) glowCircle(cx, cy, 70, '255,40,40', .3 * clamp(p * 2));
    E.ring(cx, cy, t, t0, { r: 60, life: .5, width: 4, color: red ? '255,60,50' : '255,255,255' });
  }
  ctx.restore();
}
function theFlag(t, refl) {
  const lit = smooth(prog(t, C.light, C.light + .25));
  const y = FLOOR - TOPH;
  if (!refl && lit > 0) { E.rays(FLAGX + 30, y - 130, t, lit, '255,60,50', 16, 900); glowCircle(FLAGX + 30, y - 120, 160, '255,40,40', .35 * lit); }
  const col = lit > .5 ? '#ff3b36' : '#5a5a5a';
  E.flag(FLAGX, y, lit > 0 ? t : 0, col, 1);
}

window.SCENE = {
  id: '32-levantate', title: 'Cae siete veces, *levántate ocho*', duration: D, cue: C,
  sky: t => .9 * smooth(prog(t, C.light, C.light + 1)),
  spot: t => ({ x: keyed([[0, 260], [C.go, 220], [C.top, 420]], t), r: 420 }),
  beam: t => ({ x: keyed([[0, 260], [C.go, 200], [C.top, 480]], t), a: .05 + .04 * smooth(prog(t, C.light, C.light + .5)), w: 190 }),
  flashes: [C.light],
  blackouts: [A[0].land + .02, LAND7 + .02],
  camera: t => {
    let zoom = keyed([[0, 1.95], [1.4, 1.95], [A[0].land, 2.0], [3.3, 1.58], [12.6, 1.58], [LAND7, 1.75], [C.look, 2.1], [C.rise + .3, 1.95], [C.go + .6, 1.75], [C.top, 1.75], [C.light + .2, 1.95], [D, 1.62]], t);
    for (const a of A.slice(1, 6)) zoom += .07 * E.pulse(t, a.land, .25);
    let shake = 0; for (const a of A) shake = Math.max(shake, (a === A[0] || a === A[6] ? .6 : .4) * E.pulse(t, a.land, .22));
    return {
      zoom,
      x: keyed([[0, 300], [1.4, 320], [A[0].land, 225], [3.3, 340], [12.6, 340], [LAND7, 250], [C.look, 215], [C.rise + .3, 215], [C.go + .6, 300], [C.top, 450], [C.light + .2, 490], [D, 480]], t),
      y: keyed([[0, FLOOR - 230], [1.4, FLOOR - 250], [A[0].land, FLOOR - 160], [3.3, FLOOR - 230], [12.6, FLOOR - 230], [LAND7, FLOOR - 190], [C.look, FLOOR - 170], [C.rise + .3, FLOOR - 200], [C.go + .6, FLOOR - 250], [C.top, FLOOR - 340], [C.light + .2, FLOOR - 360], [D, FLOOR - 330]], t),
      shake: shake + .25 * E.pulse(t, C.light, .3),
    };
  },
  world(t, refl) {
    stairs();
    theFlag(t, refl);
    const st = state(t);
    if (st.kind === 'ball') {
      const { x, y, ang } = st.tb;
      ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.translate(-x, -y);
      figure(ballPose(x, y), STYLE.hero, { noShadow: true });
      ctx.restore();
    } else {
      const seven = t > LAND7 && t < C.rise;
      figure(st.pose, seven ? E.mixStyle(STYLE.hero, STYLE.gray, .35 * (1 - smooth(prog(t, C.kneelT, C.rise)))) : STYLE.hero);
    }
    if (!refl) {
      for (const a of A) { E.burst(LX, FLOOR - 6, t, a.land, { n: 18, speed: 170, size: 3, color: '200,200,200', gravity: 1.2, life: .7, seed: Math.round(a.land * 10) });
        E.ring(LX, FLOOR, t, a.land, { r: 120, flat: .2, life: .5, width: 4 }); }
      E.burst(FLAGX + 30, FLOOR - TOPH - 120, t, C.light, { n: 50, speed: 380, size: 4.5, color: '255,80,60', gravity: .5, life: 1.6 });
      E.burst(FLAGX + 30, FLOOR - TOPH - 120, t, C.light + .25, { n: 30, speed: 250, size: 3, color: '255,200,180', gravity: .3, life: 1.4, seed: 3 });
      E.ring(FLAGX + 30, FLOOR - TOPH - 120, t, C.light, { r: 320, color: '255,80,60', width: 8, life: 1 });
    }
  },
  front(t, refl) { tally(t, false); },
  events() {
    const ev = E.footsteps(D, t => {
      const st = state(t);
      if (st.kind !== 'pose' || st.pose.phi === undefined) return [null];
      return [{ phi: st.pose.phi, size: 1, vol: 1.1 }];
    });
    const out = ev.concat([{ t: 0.02, type: 'whoosh', vol: .7 }, { t: .1, type: 'step', vol: 1 }]);
    A.forEach((a, i) => {
      out.push({ t: a.slip, type: 'scuff', vol: 1 }, { t: a.slip + .05, type: 'whoosh', vol: .5 });
      const n = Math.max(2, Math.round((a.xs - SX) / SW));
      for (let k = 1; k < n; k++) out.push({ t: lerp(a.slip + .22, a.land, k / n), type: 'thud', vol: .35 });
      out.push({ t: a.land, type: 'thud', vol: 1 }, { t: a.land + .02, type: 'impact', vol: i === 0 || i === 6 ? .9 : .55 });
      out.push({ t: markT(i), type: 'knock', vol: .6 });
    });
    out.push(...[0, .8, 1.6].map((k, i) => ({ t: LAND7 + .4 + k, type: 'heartbeat', vol: .9 - i * .15 })));
    out.push({ t: C.rise + .2, type: 'boom', vol: .8 }, { t: C.go, type: 'riser', dur: C.light - C.go, vol: .9 },
      { t: C.stagger, type: 'scuff' }, { t: C.light, type: 'boom' }, { t: C.light + .05, type: 'sparkle' }, { t: C.light + .2, type: 'cheer', dur: 2.5, vol: .7 });
    return out;
  },
  music: {
    sections: [
      { t: .1, dur: 6.4, style: 'tension', chords: ['Am', 'F'], chordLen: 1.6 },
      { t: 6.45, dur: LAND7 - 6.45, style: 'build', chords: ['Am', 'F', 'C', 'G'], chordLen: .55 },
      { t: LAND7 + .3, dur: C.rise - LAND7, style: 'sad', chords: ['Am', 'F'], chordLen: 1.2 },
      { t: C.rise, dur: C.light - C.rise, style: 'epic', chords: ['Am', 'F', 'C', 'G'], chordLen: .7 },
      { t: C.light, dur: D - C.light, style: 'hope', chords: ['F', 'C', 'G', 'C'], chordLen: 1.3 },
    ],
    stingers: [{ t: A[0].land, type: 'impact' }, { t: LAND7, type: 'impact' }, { t: C.light, type: 'bells' }],
    duck: [[LAND7 + .05, LAND7 + .5]],
  },
};
})();
