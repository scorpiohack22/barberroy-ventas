// 16 — DETRÁS DE TI: papá corre sosteniendo el asiento; lo suelta sin que el niño lo note; el niño
// sigue solo, se detiene, mira atrás: papá lejos con los brazos abiertos. Corre y lo abraza.
(() => {
const { FLOOR, clamp, lerp, prog, smooth, easeOut, easeInOut, keyed, distance, figure, STYLE, ctx, mix, stand, walk, run, poseAt } = E;
const D = 20;

// ── tiempo de acción con cámara lenta (τ) ──
const RATE = [[0, 1], [4.85, 1], [5.2, .3], [6.8, .3], [7.25, 1], [D, 1]];
const tau = distance(RATE, D);                  // t real → τ
const realOf = (x) => { let lo = 0, hi = D; for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (tau(m) < x) lo = m; else hi = m; } return lo; };

// cues en τ
const C = { release: 5.25, brake: 7.9, stop: 8.5, off: 8.75, turn: 9.15, look: 9.4, reveal: 9.9, open: 10.1, drop: 11.5, run: 11.9, jump: 13.25, catch: 13.55, lift: 13.9 };

const KS = .6;                                  // escala del niño
const kidSpeed = [[0, 150], [4.5, 165], [C.release, 165], [C.brake, 140], [C.stop, 0], [30, 0]];
const dadSpeed = [[0, 150], [4.5, 165], [C.release, 165], [C.release + .5, 120], [C.release + 1.6, 30], [C.release + 2.2, 0], [30, 0]];
const gk = distance(kidSpeed, 30), gd = distance(dadSpeed, 30);
const SC = gk;                                   // la cámara viaja con el niño
const KX = 440, GAP0 = 128;
// posición en el mundo de algo fijo al piso (en coordenadas de suelo g)
const wx = (g, T) => g - SC(T);
const kidG = T => KX + gk(T);
const dadG = T => KX - GAP0 + gd(T);

// ── bicicleta (dibujada aquí) ──
const BR = 27; // radio de rueda
function bikeGeo(bx, T) {
  const rear = { x: bx - 40, y: FLOOR - BR }, front = { x: bx + 42, y: FLOOR - BR }, bb = { x: bx - 2, y: FLOOR - 24 };
  const seat = { x: bx - 14, y: FLOOR - 76 }, head = { x: bx + 30, y: FLOOR - 72 }, bar = { x: bx + 24, y: FLOOR - 92 };
  const crank = gk(T) / (BR * 1.6);
  const ped = [0, Math.PI].map(o => ({ x: bb.x + Math.cos(crank + o) * 13, y: bb.y + Math.sin(crank + o) * 13 }));
  return { rear, front, bb, seat, head, bar, ped, rot: gk(T) / BR };
}
function wheel(c, rot, refl) {
  ctx.save();
  ctx.strokeStyle = '#d8d8d8'; ctx.lineWidth = 5;
  if (!refl) { ctx.shadowColor = 'rgba(255,255,255,.35)'; ctx.shadowBlur = 10; }
  ctx.beginPath(); ctx.arc(c.x, c.y, BR, 0, Math.PI * 2); ctx.stroke(); ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(200,200,200,.55)'; ctx.lineWidth = 1.4;
  for (let i = 0; i < 6; i++) { const a = rot + i * Math.PI / 3; ctx.beginPath(); ctx.moveTo(c.x + Math.cos(a) * BR, c.y + Math.sin(a) * BR); ctx.lineTo(c.x - Math.cos(a) * BR, c.y - Math.sin(a) * BR); ctx.stroke(); }
  ctx.fillStyle = '#eee'; ctx.beginPath(); ctx.arc(c.x, c.y, 3.5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
function bike(g, refl, fallen = 0) {
  ctx.save();
  if (fallen > 0) { ctx.translate(0, FLOOR); ctx.scale(1, lerp(1, .16, fallen)); ctx.translate(0, -FLOOR); }
  wheel(g.rear, g.rot, refl); wheel(g.front, g.rot, refl);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = '#ff3b36'; ctx.lineWidth = 6;
  if (!refl) { ctx.shadowColor = '#ff2a2a'; ctx.shadowBlur = 16; }
  ctx.beginPath();
  ctx.moveTo(g.rear.x, g.rear.y); ctx.lineTo(g.bb.x, g.bb.y); ctx.lineTo(g.seat.x + 3, g.seat.y + 6); ctx.lineTo(g.rear.x, g.rear.y);
  ctx.moveTo(g.seat.x + 2, g.seat.y + 10); ctx.lineTo(g.head.x, g.head.y + 4); ctx.lineTo(g.bb.x, g.bb.y);
  ctx.moveTo(g.head.x, g.head.y); ctx.lineTo(g.front.x, g.front.y);
  ctx.stroke(); ctx.shadowBlur = 0;
  ctx.strokeStyle = '#cfcfcf'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(g.head.x, g.head.y); ctx.lineTo(g.bar.x, g.bar.y); ctx.lineTo(g.bar.x - 9, g.bar.y + 2); ctx.stroke();
  ctx.fillStyle = '#e6e6e6'; ctx.beginPath(); ctx.ellipse(g.seat.x, g.seat.y, 13, 4.5, -.08, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#bbb'; ctx.lineWidth = 3;
  for (const p of g.ped) { ctx.beginPath(); ctx.moveTo(g.bb.x, g.bb.y); ctx.lineTo(p.x, p.y); ctx.stroke(); ctx.fillRect(p.x - 5, p.y - 1.5, 10, 3); }
  ctx.restore();
}

// ── reparto ──
function cast(t) {
  const T = tau(t);
  const kx = wx(kidG(T), T), dx = wx(dadG(T), T);
  // bici: sigue al niño hasta que se baja; luego queda fija en el piso
  const bgX = T < C.stop ? kidG(T) : kidG(C.stop);
  const bx = wx(bgX, T);
  const g = bikeGeo(bx, Math.min(T, C.stop));
  // tambaleo: grande al inicio, se calma
  const wob = (Math.sin(T * 5.3) * .06 + Math.sin(T * 8.1 + 1) * .03) * (1 - smooth(prog(T, 2.5, 7))) * (T < C.stop ? 1 : 0);

  // NIÑO en la bici
  const ride = {
    hip: { x: g.seat.x + 2, y: g.seat.y - 6 }, s: KS, dir: 1, lean: .32 + .1 * smooth(prog(T, C.release + .6, C.release + 2)) - wob * 2,
    tilt: -.05 + .15 * Math.sin(T * 2.2) * (1 - smooth(prog(T, 2, 4))),
    feet: g.ped.map(p => ({ x: p.x, y: p.y })),
    arms: [{ target: { x: g.bar.x - 6, y: g.bar.y + 2 } }, { target: { x: g.bar.x - 9, y: g.bar.y + 2 } }],
  };
  const offX = bx - 34;
  const offBike = stand(offX, { s: KS, t: T, dir: 1, arms: [{ target: { x: g.bar.x - 6, y: g.bar.y + 2 } }, { ang: .1, bend: .3 }] });
  const turned = stand(offX - 4, { s: KS, t: T, dir: -1, lean: .02, tilt: -.12, arms: [{ target: { x: g.bar.x - 6, y: g.bar.y + 2 } }, { ang: .2, bend: .4 }] });
  const amazed = stand(offX - 6, { s: KS, t: T, dir: -1, lean: -.06, tilt: -.2, arms: [{ ang: 2.6, bend: .6 }, { ang: 2.3, bend: .7 }] });
  // carrera del niño hacia papá
  const runX0 = offX - 8, dadStop = wx(dadG(30), T);
  const catchX = dadStop + 46;
  const rp = easeInOut(prog(T, C.run, C.jump));
  const rx = lerp(runX0, catchX + 30, rp);
  const runner = run(rx, -(rx - runX0) * 1.2, { s: KS, dir: -1, lean: .35 });
  const jumpP = prog(T, C.jump, C.catch);
  let kid;
  let kidAir = false;
  if (T < C.stop) kid = ride;
  else if (T < C.run) kid = poseAt(T, [[C.stop, ride], [C.off, offBike], [C.turn, offBike], [C.look, turned], [C.drop - .3, turned], [C.drop, amazed], [C.run, amazed]]);
  else if (T < C.jump) kid = mix(amazed, runner, smooth(prog(T, C.run, C.run + .25)));
  else {
    kidAir = true;
    // salto a los brazos: arco
    const lif = smooth(prog(T, C.catch, C.lift + .3)), hx0 = dadStop + 50;
    const held = {
      hip: { x: hx0, y: FLOOR - 124 - 26 * lif }, s: KS, dir: -1, lean: .5, tilt: .1,
      feet: [{ x: dadStop + 14, y: FLOOR - 82 - 26 * lif }, { x: dadStop + 6, y: FLOOR - 76 - 26 * lif }],
      arms: [{ target: { x: dadStop + 2, y: FLOOR - 176 - 22 * lif } }, { target: { x: dadStop - 4, y: FLOOR - 170 - 22 * lif } }],
    };
    const air = { ...runner, hip: { x: lerp(catchX + 30, hx0, jumpP), y: lerp(FLOOR - 90 * KS, FLOOR - 100, easeOut(jumpP)) - 30 * Math.sin(Math.PI * jumpP) }, lean: .1, feet: [{ x: catchX + 50, y: FLOOR - 40 }, { x: catchX + 64, y: FLOOR - 30 }], arms: [{ ang: 2.2, bend: .3 }, { ang: 2.0, bend: .3 }] };
    kid = mix(air, held, smooth(jumpP));
  }

  // PAPÁ
  const dd = gd(T);
  const rel = smooth(prog(T, C.release - .1, C.release + .35));
  const seatHand = { x: g.seat.x - 13, y: g.seat.y + 3 };
  const runP = run(dx, dd * .95, { lean: .62, tilt: -.25 });
  runP.hip.y += 10;
  runP.arms = [{ target: { x: lerp(seatHand.x, seatHand.x - 30, rel), y: lerp(seatHand.y, seatHand.y + 22, rel) } }, runP.arms[1]];
  const slowW = walk(dx, dd, { lean: .18, tilt: -.1, stride: .8 });
  slowW.arms = [{ ang: .6, bend: .4 }, slowW.arms[1]];
  const sp = keyed(dadSpeed, T);
  const proud = stand(dx, { t: T, lean: .02, tilt: -.05, arms: [{ ang: .5, bend: 1.6 }, { ang: .4, bend: 1.7 }] }); // manos juntas al pecho
  const open = stand(dx, { t: T, lean: -.06, tilt: -.15, arms: [{ ang: 2.25, bend: .1 }, { ang: -1.9, bend: -.1 }] });
  const crouchOpen = { ...E.crouch(dx, { amt: .45, tilt: -.25 }), arms: [{ ang: 1.45, bend: .35 }, { ang: 1.7, bend: .3 }] };
  let dad;
  if (T < C.release + .5) dad = runP;
  else if (sp > 4) dad = mix(runP, slowW, smooth(prog(T, C.release + .5, C.release + 1.4)));
  else dad = poseAt(T, [[C.release + 2.2, slowW], [C.release + 2.8, proud], [C.open - .2, proud], [C.open + .35, open], [C.run + .4, open], [C.run + 1, crouchOpen], [C.jump, crouchOpen]]);
  if (T > C.jump) {
    const hold = smooth(prog(T, C.jump + .1, C.catch + .1)), lift = smooth(prog(T, C.catch, C.lift + .3));
    const hug = stand(dx, { t: T, lean: -.08 - .08 * lift, tilt: .15, arms: [{ target: { x: dx + 46, y: FLOOR - 108 - 26 * lift } }, { target: { x: dx + 50, y: FLOOR - 146 - 26 * lift } }] });
    const sway = Math.sin((T - C.lift) * 2.2) * .05 * smooth(prog(T, C.lift, C.lift + .6));
    hug.lean += sway;
    dad = mix(crouchOpen, hug, hold);
  }
  const fallen = smooth(prog(T, C.drop, C.drop + .35));
  return { T, kid, dad, g, wob, kidAir, fallen, bx, dx, kx, catchX };
}

window.SCENE = {
  id: '16-detras-de-ti', title: 'Siempre estuve *detrás de ti*', duration: D,
  scroll: t => SC(tau(t)),
  spot: t => { const c = cast(t); return { x: lerp(c.bx - 30, c.dx + 60, smooth(prog(c.T, C.look, C.reveal + .4))), r: 420 }; },
  beam: t => { const c = cast(t), T = c.T; return { x: lerp(c.bx - 30, c.dx + 30, smooth(prog(T, C.look, C.reveal))), a: .04 + .05 * smooth(prog(T, C.reveal, C.open + .5)), w: 170 }; },
  sky: t => .25 * smooth(prog(tau(t), C.lift, C.lift + 2)),
  flashes: [realOf(C.catch)],
  blackouts: [],
  camera: t => {
    const c = cast(t), T = c.T;
    const kidFocus = c.bx - 8, dadFocus = c.dx + 30;
    // seguir al niño → primer plano de la mano que suelta → plano del niño solo → paneo a papá → abierto → abrazo
    const zoom = keyed([[0, 1.75], [3.5, 1.95], [C.release - .4, 2.35], [C.release + .5, 2.35], [C.release + 1.4, 1.85], [C.stop, 2.0], [C.look, 2.15], [C.reveal, 1.85], [C.open + .6, 2.05], [C.drop - .2, 2.0], [C.run + .3, 1.12], [C.jump - .5, 1.6], [C.lift, 2.0], [C.lift + 2.5, 2.2], [C.lift + 6.2, 1.85]], T);
    const xs = keyed([[0, kidFocus - 10], [C.release - .4, (c.bx + c.dx) / 2 - 20], [C.release + .5, (c.bx + c.dx) / 2], [C.release + 1.4, kidFocus], [C.look, kidFocus - 20]], T);
    const panP = easeInOut(prog(T, C.look + .15, C.reveal));
    const wideP = smooth(prog(T, C.drop - .1, C.run + .4));
    const hugP = smooth(prog(T, C.jump - .8, C.lift));
    let x = lerp(xs, dadFocus, panP);
    x = lerp(x, (c.bx + c.dx) / 2 - 10, wideP);
    x = lerp(x, c.dx + 40, hugP);
    let y = keyed([[0, FLOOR - 160], [C.release - .4, FLOOR - 140], [C.release + 1.4, FLOOR - 165], [C.reveal, FLOOR - 185], [C.run + .3, FLOOR - 260], [C.jump, FLOOR - 205], [C.lift + 1, FLOOR - 205]], T);
    return { x, y, zoom, shake: .25 * E.pulse(T, C.catch, .25) };
  },
  backdrop(t) {
    const T = tau(t), c = cast(t);
    const a = smooth(prog(T, C.lift - .2, C.lift + 2.5));
    if (a > 0) E.sun(c.dx + 125, FLOOR - 60 - 190 * a, 30, a);
  },
  world(t, refl) {
    const c = cast(t), T = c.T;
    // la bici: sostenida por el niño hasta que la suelta
    const ph = 2 * Math.PI * easeInOut(prog(T, C.lift, C.lift + 1.1)), cs = Math.cos(ph);
    const spin = T > C.lift && T < C.lift + 1.1;
    if (spin) { const k = Math.sign(cs) * Math.max(.5, Math.abs(cs)); ctx.save(); ctx.translate(c.dx + 12, 0); ctx.scale(k, 1); ctx.translate(-(c.dx + 12), 0); }
    figure(c.dad, STYLE.hero);
    if (spin) { figure(c.kid, STYLE.hero, { noShadow: true }); ctx.restore(); }
    if (T < C.stop) {
      ctx.save(); ctx.translate(c.g.rear.x + 40, FLOOR); ctx.rotate(c.wob * .5); ctx.translate(-(c.g.rear.x + 40), -FLOOR);
      bike(c.g, refl);
      figure(c.kid, STYLE.hero, { noShadow: true });
      ctx.restore();
    } else {
      bike(c.g, refl, c.fallen);
    }
    if (T >= C.stop && !spin) figure(c.kid, STYLE.hero, { noShadow: c.kidAir });
    if (!refl) {
      // destello en la mano que suelta
      const rT = C.release + .1;
      if (T > rT - .05 && T < rT + .9) {
        const sh = c.g.seat;
        E.ring(sh.x - 14, sh.y + 10, T, rT, { r: 50, life: .9, color: '255,70,60', width: 4 });
        E.glowCircle(sh.x - 14, sh.y + 10, 40, '255,60,50', .5 * E.pulse(T, rT, .5));
      }
      if (T > C.catch - .05) {
        const hx = c.catchX - 10, hy = FLOOR - 200;
        E.burst(hx, hy, T, C.catch, { n: 40, speed: 300, color: '255,90,70', gravity: .4, life: 1.6 });
        E.ring(hx, hy, T, C.catch, { r: 220, life: 1.1, color: '255,80,70' });
        for (let i = 0; i < 7; i++) {
          const t0 = C.lift + i * .55, p = prog(T, t0, t0 + 2.6);
          if (p > 0 && p < 1) E.heart(hx + Math.sin(i * 2.3 + p * 4) * 60 + (i % 2 ? 30 : -30), hy - 30 - p * 230, 14 + (i % 3) * 5, '#ff3b36', Math.sin(Math.PI * p));
        }
      }
    }
  },
  events() {
    const rt = realOf;
    const ev = E.footsteps(D, t => {
      const c = cast(t), T = c.T;
      const out = [];
      if (T > C.release + .3 && keyed(dadSpeed, T) > 4) out.push({ phi: (gd(T) * .95) / (4 * 22), size: 1, vol: .7 });
      else if (T < C.release + .3) out.push({ phi: (gd(T) * .95) / (4 * 34), size: 1.1, vol: .8 });
      else out.push(null);
      out.push(T > C.run && T < C.jump ? { phi: c.kid.phi || 0, size: .6 } : null);
      return out;
    });
    return ev.concat([
      { t: .1, type: 'wind', dur: 6, vol: .35 }, { t: .2, type: 'bell', note: 93, vol: .5 }, { t: .42, type: 'bell', note: 93, vol: .45 }, { t: .05, type: 'whoosh', vol: .5 },
      { t: rt(C.release + .05), type: 'whoosh', vol: .5 },
      { t: rt(C.release + .1), type: 'heartbeat', vol: .8 }, { t: rt(C.release + .45), type: 'heartbeat', vol: .6 },
      { t: rt(C.brake), type: 'slide', dur: .5, vol: .5 },
      { t: rt(C.look - .05), type: 'whoosh', vol: .6 },
      { t: rt(C.open), type: 'swell', dur: 1.6 },
      { t: rt(C.drop + .25), type: 'clatter' },
      { t: rt(C.catch), type: 'thud', vol: .8 }, { t: rt(C.catch), type: 'sparkle' },
      { t: rt(C.lift + .2), type: 'chime' },
    ]);
  },
  music: {
    sections: [
      { t: .3, dur: realOf(C.release) - .6, style: 'upbeat', chords: ['C', 'G', 'Am', 'F'], chordLen: 1.15, bpm: 104 },
      { t: realOf(C.release) - .3, dur: realOf(C.brake) - realOf(C.release) + .3, style: 'tender', chords: ['F', 'C', 'Am', 'G'], chordLen: 1.4 },
      { t: realOf(C.brake), dur: realOf(C.reveal) - realOf(C.brake), style: 'tension', chords: ['Am'], chordLen: 2 },
      { t: realOf(C.reveal), dur: realOf(C.run) - realOf(C.reveal), style: 'sad', chords: ['F', 'C'], chordLen: 1.2 },
      { t: realOf(C.run), dur: realOf(C.catch) - realOf(C.run), style: 'build', chords: ['F', 'G', 'Am', 'G'], chordLen: .6 },
      { t: realOf(C.catch) - .1, dur: D - realOf(C.catch), style: 'hope', chords: ['F', 'C', 'G', 'C'], chordLen: 1.4 },
    ],
    stingers: [{ t: realOf(C.reveal), type: 'impact' }, { t: realOf(C.catch), type: 'bells' }],
    duck: [[realOf(C.stop), realOf(C.reveal) - .1]],
  },
};
})();
