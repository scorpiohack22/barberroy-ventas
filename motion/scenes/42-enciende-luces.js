// 42 — UN BUEN MAESTRO ENCIENDE LUCES: en la oscuridad, un maestro con una llama en la mano toca la cabeza de
// cuatro niños y a cada uno se le enciende una luz. Pasan los años: crecen, él envejece. Ellos encienden a otros,
// y esos a otros… hasta que todo el horizonte brilla. Y todas esas luces empezaron en su mano.
(() => {
const { FLOOR, clamp, lerp, prog, smooth, easeOut, easeIn, easeInOut, keyed, bump, pulse, stand, walk, sit, crouch, mix, poseAt,
        figure, STYLE, glowCircle, ctx, burst, ring, rays, flame, cane } = E;
const D = 20;
const CUE = { ignite: .25, touch: [1.9, 3.0, 4.1, 5.2], back: 5.8, proud: 6.6, ageA: 8.0, ageB: 11.0, go: 11.3, touch2: 12.9, spread: 13.8, wide: 15.6, pulse: 17.6 };
const TX = 170;
const KIDS = [300, 400, 500, 600];
const GROWN = [300, 430, 540, 650];
const age = t => smooth(prog(t, CUE.ageA, CUE.ageB));
const rgbOf = c => c[0] === '#' ? [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16)) : c.match(/[\d.]+/g).slice(0, 3).map(Number);
const mixS = (a, b, p) => ({ near: E.mixCol(rgbOf(a.near), rgbOf(b.near), p), far: E.mixCol(rgbOf(a.far), rgbOf(b.far), p), glow: lerp(a.glow, b.glow, p), glowColor: p < .5 ? a.glowColor : b.glowColor });
const WARMH = { near: '#fff3e2', far: '#cfb89c', glow: .4, glowColor: '255,190,120' };

// ── maestro ──
const tX = t => keyed([[0, TX], [CUE.touch[0] - .6, KIDS[0] - 50], [CUE.touch[0] + .4, KIDS[0] - 50], [CUE.touch[1] - .3, KIDS[1] - 50], [CUE.touch[1] + .35, KIDS[1] - 50],
                       [CUE.touch[2] - .3, KIDS[2] - 50], [CUE.touch[2] + .35, KIDS[2] - 50], [CUE.touch[3] - .3, KIDS[3] - 50], [CUE.touch[3] + .3, KIDS[3] - 50], [CUE.proud, 205], [CUE.go + .4, 205], [CUE.spread + 1.2, 425], [D, 425]], t, smooth);
function teacher(t) {
  const x = tX(t), a = age(t);
  // mano con la llama al frente; al tocar, baja a la cabeza del niño
  let touchK = 0, ki = 0;
  CUE.touch.forEach((tt, i) => { const b = bump(t, tt - .35, tt + .3); if (b > touchK) { touchK = b; ki = i; } });
  const moving = Math.abs(tX(t + .05) - tX(t - .05)) > 2;
  const p = moving ? walk(x, x * 1.0, { lean: .08 + .3 * a, stride: lerp(1, .6, a), tilt: .1 }) : stand(x, { t, lean: lerp(.05, .4, a), tilt: lerp(-.05, .3, a) });
  if (a > 0) { p.s = lerp(1, .94, a); p.hip.y += 6 * a; }
  const kh = E.headOf(kidPose(CUE.touch[ki], ki));
  const hold = { x: x + 38, y: FLOOR - 130 + 10 * a };
  const touch = { x: kh.x - 6, y: kh.y - 22 };
  const raise = bump(t, CUE.proud - .2, CUE.ageA);
  p.arms = [{ target: { x: lerp(hold.x, touch.x, touchK), y: lerp(hold.y, touch.y, touchK) - 40 * raise } }, a > .3 ? { target: { x: x + 30, y: FLOOR - 82 } } : { ang: .1, bend: .3 }];
  p.tilt = lerp(p.tilt, .45, touchK);
  return p;
}
// ── niños: sentados (oscuros) → encendidos → crecen y se paran ──
function kidPose(t, i) {
  const x0 = KIDS[i], a = age(t), x = lerp(x0, GROWN[i], a);
  const lit = smooth(prog(t, CUE.touch[i], CUE.touch[i] + .4));
  const sitP = sit(x, { s: .55, ground: true, dir: -1, lean: lerp(.45, .05, lit), tilt: lerp(.55, -.35, lit) });
  sitP.arms = [{ target: { x: x - 30, y: FLOOR - 26 } }, { target: { x: x - 26, y: FLOOR - 24 } }];
  if (t < CUE.ageA) return sitP;
  const up = stand(x, { s: lerp(.55, 1, a), t: t + i, dir: -1, lean: .04, tilt: -.1 });
  up.arms = [{ ang: .15, bend: .3 }, { ang: 0, bend: .3 }];
  const p = mix(sitP, up, smooth(prog(t, CUE.ageA, CUE.ageA + 1.2)));
  if (a > 0 && a < 1) p.s = lerp(.55, 1, a);
  if (t < CUE.go) return p;
  // ola 2: los dos de la derecha van a la derecha; los dos de la izquierda se voltean y alzan su luz
  return grownAct(t, i, p);
}
// nuevos niños que encienden ellos
const NEW = [{ by: 2, x: 720, t: CUE.touch2 }, { by: 3, x: 790, t: CUE.touch2 + .25 }, { by: 0, x: 140, t: CUE.touch2 + .1 }, { by: 1, x: 72, t: CUE.touch2 + .35 }];
function grownAct(t, i, base) {
  const n = NEW.find(q => q.by === i), right = n.x > 400;
  const dir = right ? 1 : -1, target = n.x - dir * 50;
  const go = smooth(prog(t, CUE.go, n.t - .35));
  const x = lerp(GROWN[i], target, go);
  const moving = go > 0 && go < 1;
  const p = moving ? walk(x, Math.abs(x - GROWN[i]) * 1.1, { dir, lean: .1 }) : stand(x, { t: t + i, dir, lean: .05, tilt: go >= 1 ? .3 : -.1 });
  const k = bump(t, n.t - .35, n.t + .35);
  const nh = E.headOf(newKid(n, t));
  p.arms = [{ target: { x: lerp(x + dir * 28, nh.x - dir * 4, k), y: lerp(FLOOR - 120, nh.y - 22, k) } }, { ang: .1, bend: .3 }];
  if (t > n.t + .6) { const r = smooth(prog(t, n.t + .6, n.t + 1.2)); p.arms[0] = { target: { x: x + dir * 18, y: FLOOR - 120 - 90 * r } }; p.tilt = -.35 * r; }
  if (moving && go < .2) return mix(base, p, go / .2);
  return p;
}
function newKid(n, t) {
  const lit = smooth(prog(t, n.t, n.t + .4)), right = n.x > 400;
  const p = sit(n.x, { s: .55, ground: true, dir: right ? -1 : 1, lean: lerp(.45, .05, lit), tilt: lerp(.55, -.35, lit) });
  p.arms = [{ target: { x: n.x + (right ? -30 : 30), y: FLOOR - 26 } }, { target: { x: n.x + (right ? -26 : 26), y: FLOOR - 24 } }];
  return p;
}
// luz sobre la cabeza
function light(x, y, t, a, sc = 1, refl) {
  if (a <= 0) return;
  if (!refl) glowCircle(x, y, 120 * sc, '255,120,60', .22 * a);
  flame(x, y + 6, t + x * .01, .75 * sc * a, a);
}
// multitud lejana: siluetas pequeñas en el horizonte que se encienden en cadena desde el centro
const CROWD = (() => { const g = E.rng(42), out = [];
  for (let i = 0; i < 46; i++) { const side = i % 2 ? 1 : -1, k = Math.floor(i / 2); const x = (side > 0 ? 900 : -90) + side * (k * 52 + g() * 26);
    out.push({ x, s: .42 + g() * .16, t: CUE.spread + .2 + k * .11 + g() * .15, dir: -side, seed: g() }); }
  return out; })();

window.SCENE = {
  id: '42-enciende-luces', title: 'Un buen maestro *enciende luces*', duration: D, cue: CUE,
  sky: t => .35 * smooth(prog(t, CUE.spread, CUE.wide + 1)),
  spot: t => ({ x: keyed([[0, TX], [CUE.touch[3], 500], [CUE.proud, 430], [CUE.go, 450], [CUE.wide, 400]], t), r: keyed([[0, 200], [CUE.proud, 380], [CUE.wide, 900]], t) }),
  beam: t => ({ x: keyed([[0, TX + 20], [CUE.touch[3], 520], [CUE.proud, 400]], t), a: .05 * (1 - smooth(prog(t, CUE.spread, CUE.wide))), w: 140 }),
  flashes: [], blackouts: [],
  camera: t => ({
    zoom: keyed([[0, 2.4], [1.2, 2.1], [CUE.touch[0], 2.25], [CUE.touch[1], 2.1], [CUE.touch[3], 2.0], [CUE.proud, 1.55], [CUE.ageA, 1.5], [CUE.ageB, 1.4], [CUE.touch2, .86], [CUE.spread + .5, .82], [CUE.wide, .7], [D, .66]], t),
    x: keyed([[0, TX + 20], [1.2, 220], [CUE.touch[0], 270], [CUE.touch[1], 360], [CUE.touch[2], 440], [CUE.touch[3], 520], [CUE.proud, 385], [CUE.ageA, 400], [CUE.ageB, 440], [CUE.touch2, 428], [CUE.wide, 410], [D, 410]], t),
    y: FLOOR - keyed([[0, 150], [1.2, 160], [CUE.touch[0], 130], [CUE.touch[3], 140], [CUE.proud, 190], [CUE.ageB, 205], [CUE.touch2, 290], [CUE.wide, 440], [D, 470]], t),
    shake: 0,
  }),
  backdrop(t) {
    // estrellas que aparecen cuando todo se enciende
    const a = smooth(prog(t, CUE.spread, CUE.wide + 1.5));
    if (a <= 0) return;
    const g = E.rng(9);
    for (let i = 0; i < 90; i++) { const x = -500 + g() * 1800, y = FLOOR - 120 - g() * 900, tw = .5 + .5 * Math.sin(t * 3 + i);
      ctx.fillStyle = `rgba(255,${180 + 60 * g() | 0},150,${a * (.25 + .5 * tw) * g()})`; ctx.beginPath(); ctx.arc(x, y, 1 + g() * 1.6, 0, Math.PI * 2); ctx.fill(); }
  },
  world(t, refl) {
    const a = age(t);
    // multitud lejana
    for (const c of CROWD) {
      const on = smooth(prog(t, c.t, c.t + .35)); if (t < CUE.spread - .4) continue;
      const fade = smooth(prog(t, CUE.spread - .4, CUE.spread + .6));
      const p = stand(c.x, { s: c.s, t: t + c.seed * 9, dir: c.dir, tilt: -.2 * on });
      const sl = figure(p, E.mixStyle(STYLE.dim, STYLE.gray, on), { alpha: fade });
      light(sl.head.x, sl.head.y - 40 * c.s - 8, t, on, c.s * 2.2, refl);
    }
    // el maestro
    const tp = teacher(t);
    const ig0 = smooth(prog(t, CUE.ignite, CUE.ignite + .6));
    const tsl = figure(tp, mixS(mixS(STYLE.dim, WARMH, ig0), STYLE.gray, .6 * a));
    if (a > .3) cane({ x: tp.hip.x + 30, y: FLOOR - 84 }, { x: tp.hip.x + 38, y: FLOOR });
    // su llama en la mano
    const hand = tsl.arms[0][2], ig = smooth(prog(t, CUE.ignite, CUE.ignite + .5));
    light(hand.x, hand.y - 16, t, ig * (lerp(1.1, .7, a) + .9 * smooth(prog(t, CUE.wide, CUE.pulse))), 1, refl);
    // niños
    KIDS.forEach((_, i) => {
      const p = kidPose(t, i), lit = smooth(prog(t, CUE.touch[i], CUE.touch[i] + .5));
      const sl = figure(p, E.mixStyle(STYLE.dim, WARMH, lit));
      light(sl.head.x, sl.head.y - 40 * p.s - 6, t, lit * (1 + .25 * pulse(t, CUE.pulse, .4)), p.s * 1.6, refl);
    });
    for (const n of NEW) {
      const vis = smooth(prog(t, CUE.go, CUE.go + .8)); if (vis <= 0) continue;
      const lit = smooth(prog(t, n.t, n.t + .4)), p = newKid(n, t);
      const sl = figure(p, E.mixStyle(STYLE.dim, WARMH, lit), { alpha: vis });
      light(sl.head.x, sl.head.y - 28, t, lit, 1, refl);
    }
  },
  front(t) {
    CUE.touch.forEach((tt, i) => {
      const h = E.headOf(kidPose(tt + .1, i));
      ring(h.x, h.y - 30, t, tt, { r: 110, color: '255,150,80', life: .7 });
      burst(h.x, h.y - 30, t, tt, { n: 22, speed: 160, size: 2.5, color: '255,170,90', life: 1, gravity: -.3, seed: 3 + i });
    });
    for (const n of NEW) { const h = E.headOf(newKid(n, n.t)); ring(h.x, h.y - 28, t, n.t, { r: 90, color: '255,150,80', life: .6 }); burst(h.x, h.y - 28, t, n.t, { n: 14, speed: 120, size: 2, color: '255,170,90', life: .8, gravity: -.3, seed: 11 }); }
    // chispas que saltan de los nuevos niños hacia la multitud lejana
    for (const c of CROWD.slice(0, 12)) {
      const k = prog(t, c.t - .45, c.t); if (k <= 0 || k >= 1) continue;
      const src = c.x > 400 ? 790 : 72;
      const x = lerp(src, c.x, k), y = FLOOR - 70 - Math.sin(Math.PI * k) * 120;
      glowCircle(x, y, 26, '255,140,70', .8 * (1 - k * .3)); ctx.fillStyle = '#ffe0b0'; ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
    }
    // reloj del tiempo: anillos que se expanden durante los años
    if (t > CUE.ageA && t < CUE.ageB) { const k = (t - CUE.ageA) * 1.3 % 1; ring(440, FLOOR - 120, t, t - k * .9, { r: 300, color: '255,255,255', life: .9, width: 2 }); }
    // las luces suben y llenan el cielo de estrellas
    const g = E.rng(77), srcs = [...GROWN.map((x, i) => ({ x: lerp(x, NEW.find(q => q.by === i).x - (NEW.find(q => q.by === i).x > 400 ? 50 : -50), 1), y: FLOOR - 230 })), ...NEW.map(n => ({ x: n.x, y: FLOOR - 120 })), ...CROWD.map(c => ({ x: c.x, y: FLOOR - 240 * c.s - 20 })), { x: 450, y: FLOOR - 150 }];
    for (let i = 0; i < 380; i++) {
      const sr = srcs[Math.floor(g() * srcs.length)], tb = CUE.spread + .5 + g() * 4, sp = 70 + g() * 120, top = FLOOR - 320 - g() * 900, wob = g() * 6;
      const dt = t - tb; if (dt < 0) continue;
      const y = Math.max(top, sr.y - sp * dt), x = sr.x + (g() - .5) * 60 * Math.min(1, dt) + Math.sin(t * 2 + wob) * 6;
      const tw = .6 + .4 * Math.sin(t * 4 + wob * 3), a = Math.min(1, dt * 2) * tw;
      glowCircle(x, y, 26, '255,140,70', .45 * a); ctx.fillStyle = `rgba(255,228,185,${a})`; ctx.beginPath(); ctx.arc(x, y, 3.4, 0, Math.PI * 2); ctx.fill();
    }
    // todos laten juntos al final
    ring(400, FLOOR - 140, t, CUE.pulse, { r: 900, color: '255,140,70', life: 1.6, width: 8 });
    if (t > CUE.wide) rays(tX(t) + 30, FLOOR - 150, t, .6 * smooth(prog(t, CUE.wide, CUE.pulse)), '255,130,70', 18, 1100);
  },
  events() {
    const ev = E.footsteps(D, t => { const v = Math.abs(tX(t + .05) - tX(t - .05)); return [v > 2 ? { phi: tX(t) / 88, size: 1, vol: .6 } : { phi: 0, moving: false }]; });
    ev.push({ t: CUE.ignite, type: 'fire', dur: 1.2, vol: .6 }, { t: CUE.ignite, type: 'whoosh', vol: .6 });
    CUE.touch.forEach((tt, i) => ev.push({ t: tt, type: 'bell', note: [72, 76, 79, 84][i] }, { t: tt, type: 'sparkle', vol: .6 }));
    ev.push({ t: CUE.ageA, type: 'clock', dur: CUE.ageB - CUE.ageA }, { t: CUE.ageA + .2, type: 'riser', dur: 2.8 });
    NEW.forEach((n, i) => ev.push({ t: n.t, type: 'bell', note: [79, 83, 86, 88][i] }));
    for (let k = 0; k < 10; k++) ev.push({ t: CUE.spread + .3 + k * .25, type: 'chime', vol: .35 });
    ev.push({ t: CUE.wide, type: 'swell', dur: 2.4 }, { t: CUE.pulse, type: 'heartbeat' });
    return ev;
  },
  music: {
    sections: [
      { t: .2, dur: CUE.ageA - .2, style: 'tender', chords: ['C', 'G', 'Am', 'F'], chordLen: 1.1 },
      { t: CUE.ageA, dur: CUE.ageB - CUE.ageA, style: 'build', chords: ['Am', 'F', 'C', 'G'], chordLen: .6 },
      { t: CUE.ageB, dur: D - CUE.ageB, style: 'epic', chords: ['F', 'C', 'G', 'C'], chordLen: 1.3 },
    ],
    stingers: [{ t: CUE.ageB, type: 'impact' }, { t: CUE.spread, type: 'bells' }, { t: CUE.pulse, type: 'boom' }],
    duck: [],
  },
};
})();
