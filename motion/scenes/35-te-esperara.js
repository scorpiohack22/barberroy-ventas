// 35 — TE ESPERARÁ: su dueño sale por la puerta. El perro espera: días, lluvias, inviernos... envejece esperando.
// Una noche la puerta se abre con luz: el perro corre, el dueño se arrodilla y lo abraza.
(() => {
const { FLOOR, clamp, lerp, prog, smooth, easeOut, easeIn, easeInOut, keyed, figure, STYLE, mix, mixStyle, stand, walk, kneel, crouch, glowCircle, ctx } = E;
const D = 17.5, DOGX = 318, DOORX = 512, HUGX = DOORX - 62, DHX = HUGX - 80;
const C = { pet: 0, leave: .75, atDoor: 1.75, close: 2.25, wait: 2.6, tl0: 3.6, rain0: 4.6, rain1: 6.2, snow0: 7.2, snow1: 9.0, tl1: 9.8, lieT: 8.0,
  light: 11.0, open: 11.3, ears: 11.5, dogUp: 11.9, run: 12.4, kneelT: 12.3, jump: 13.0, hug: 13.25 };
const age = t => smooth(prog(t, C.tl0 + .5, C.tl1)) * (1 - .8 * smooth(prog(t, C.hug, C.hug + 1.5)));
const mixc = (a, b, p) => `rgb(${a.map((v, i) => Math.round(lerp(v, b[i], p))).join(',')})`;

// perro con más actuación: sentado / acostado / cabeza abajo / orejas / salto
function dog(x, phase, o = {}) {
  const s = o.s || 1, dir = o.dir || 1, y = (o.y ?? FLOOR) - (o.jump || 0), col = o.color || '#fff', sitA = o.sit || 0, lieA = o.lie || 0, hd = o.head || 0;
  ctx.save(); ctx.translate(x, y); ctx.scale(dir * s, s);
  ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineCap = 'round';
  ctx.shadowColor = 'rgba(255,255,255,.3)'; ctx.shadowBlur = 14;
  const by = lerp(-46 + sitA * 8, -15, lieA), bodyBack = -34, bodyFront = 26;
  const backY = lerp(lerp(by, -14, sitA), -13, lieA);
  ctx.lineWidth = 12;
  [[bodyFront, 0], [bodyFront - 10, .5], [bodyBack + 8, .5], [bodyBack, 0]].forEach(([lx, off], i) => {
    const sw = Math.sin((phase + off) * Math.PI * 2) * 14 * (o.moving ?? 0);
    const back = i >= 2, ly = back ? backY : by;
    let fx = lx + sw * (1 - sitA) + (back ? 14 * sitA : 0), fy = 0;
    if (lieA > 0) { fx = lerp(fx, lx + (back ? 22 : 30), lieA); fy = lerp(0, -4, lieA); }
    if (o.tuck) { fx = lerp(fx, lx + (back ? -18 : 18), o.tuck); fy = lerp(fy, -14, o.tuck); }
    ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(fx, fy); ctx.stroke();
  });
  ctx.lineWidth = 22; ctx.beginPath(); ctx.moveTo(bodyBack, backY); ctx.lineTo(bodyFront, by); ctx.stroke();
  // cabeza
  const hx = bodyFront + lerp(18, 26, hd), hy = by + lerp(-22, 2, hd) + (o.nod || 0);
  ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(bodyFront - 2, by - 4); ctx.lineTo(hx - 4, hy + 4); ctx.stroke();
  ctx.beginPath(); ctx.arc(hx, hy, 14, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(hx + 14, hy + lerp(5, 8, hd), 9, 6, lerp(0, .5, hd), 0, Math.PI * 2); ctx.fill();
  const ear = o.ear ?? 0; // 0 caída, 1 parada
  ctx.beginPath(); ctx.ellipse(hx - 6, hy - lerp(4, 14, ear), 6, 11, lerp(.5, -.2, ear) + .4 * hd, 0, Math.PI * 2); ctx.fill();
  // cola
  ctx.lineWidth = 7; const tw = Math.sin((o.tail ?? 0) * Math.PI * 2) * .5 * (o.wag ?? 1);
  const tUp = o.tailUp ?? 1;
  ctx.beginPath(); ctx.moveTo(bodyBack - 2, backY - 2); ctx.lineTo(bodyBack - 22, backY - lerp(-6, 20, tUp) + tw * 18); ctx.stroke();
  ctx.restore();
}
function dogState(t) {
  const a = age(t);
  const col = mixc([255, 255, 255], [128, 128, 128], a);
  // antes de salir el dueño: parado, mueve la cola; luego sentado esperando; luego acostado
  const sitA = smooth(prog(t, C.close + .1, C.wait + .2)) * (1 - smooth(prog(t, C.dogUp - .1, C.dogUp + .3)));
  const lieA = smooth(prog(t, C.lieT - .6, C.lieT + .6)) * (1 - smooth(prog(t, C.dogUp - .2, C.dogUp + .3)));
  const head = Math.max(lieA * .9, .5 * smooth(prog(t, C.tl1, C.light - .2))) * (1 - smooth(prog(t, C.ears - .1, C.ears + .3)));
  const ear = Math.max(1 - smooth(prog(t, C.wait, C.tl0 + 1.5)) * .8, smooth(prog(t, C.ears, C.ears + .2)));
  const runP = prog(t, C.run, C.jump);
  let x = DOGX + lerp(0, DHX - 40 - DOGX, easeIn(runP));
  let jump = 0, dir = 1;
  if (t > C.jump - .25) { const jp = prog(t, C.jump - .25, C.hug); x = lerp(DHX - 40, DHX, easeOut(jp)); jump = Math.sin(Math.PI * Math.min(jp, .6) / .6 * .5) * 42; }
  if (t > C.hug) { x = DHX; jump = 42; }
  const happy = t < C.close || t > C.run - .2;
  const wag = happy ? 1 : lerp(.35, .05, a);
  const tail = happy ? t * 3.2 : t * lerp(.9, .25, a);
  const tailUp = happy ? 1 : lerp(.6, -.3, a);
  // pequeño gemido / mirada con la cabeza ladeada
  const nod = 4 * E.bump(t, C.wait, C.wait + .8);
  return { x, phase: (x - DOGX) / 60, s: 1.15, dir, color: col, sit: sitA, lie: lieA, head, ear, jump, moving: runP > 0 && t < C.jump ? 1 : 0, tail, wag, tailUp, nod, tuck: smooth(prog(t, C.jump - .1, C.jump + .1)) };
}
function owner(t) {
  if (t < C.close) {
    const pet = { ...crouch(DOGX - 40, { amt: .75 }), arms: [{ target: { x: DOGX + 18, y: FLOOR - 82 } }, { ang: .5, bend: .4 }] };
    const wx = lerp(DOGX - 40, DOORX, easeInOut(prog(t, C.leave, C.atDoor)));
    const w = walk(wx, wx - DOGX + 40, { tilt: 0 });
    return E.poseAt(t, [[0, pet], [C.leave - .25, pet], [C.leave + .05, w], [C.atDoor, w], [C.close, stand(DOORX, { t })]]);
  }
  const x0 = DOORX;
  const st = stand(x0, { t, dir: -1, tilt: .1 });
  const wx = lerp(x0, HUGX, smooth(prog(t, C.open + .2, C.kneelT)));
  const w = walk(wx, x0 - wx, { dir: -1 });
  const kn = { ...kneel(HUGX, { dir: -1, tilt: .2, lean: .15 }), arms: [{ ang: 1.6, bend: .5 }, { ang: 1.3, bend: .6 }] };
  const hugP = q => ({ ...kneel(HUGX, { dir: -1, tilt: .6, lean: .3 + .02 * Math.sin(q * 3) }),
    arms: [{ target: { x: DHX - 8, y: FLOOR - 84 } }, { target: { x: DHX + 8, y: FLOOR - 100 } }] });
  return E.poseAt(t, [[C.open, st], [C.open + .2, w], [C.kneelT, w], [C.kneelT + .3, kn], [C.jump, kn], [C.hug + .1, hugP]]);
}
const ownerAlpha = t => t < C.close ? 1 - smooth(prog(t, C.atDoor - .1, C.close)) : smooth(prog(t, C.open, C.open + .4));
const doorOpen = t => Math.max(E.bump(t, C.atDoor - .4, C.close + .05) * 1, smooth(prog(t, C.open - .1, C.open + .5)));
const sunTh = t => smooth(prog(t, C.tl0, C.tl1)) * Math.PI * 2 * 4;
function sky(t) {
  const p = prog(t, C.tl0, C.tl1); if (p <= 0 || p >= 1) return;
  const th = sunTh(t), a = Math.min(1, prog(t, C.tl0, C.tl0 + .4) * 1, 1 - prog(t, C.tl1 - .4, C.tl1));
  const cx = 330, cy = FLOOR - 20, R = 330;
  const sx = cx - Math.cos(th) * R, sy = cy - Math.sin(th) * R;
  E.sun(sx, sy, 30, a * clamp(Math.sin(th) * 3 + .3));
  E.moon(cx + Math.cos(th) * R, cy + Math.sin(th) * R, 24, a * clamp(-Math.sin(th) * 3 + .3));
}
function wall(t) {
  ctx.fillStyle = '#121212'; ctx.fillRect(DOORX - 70, FLOOR - 270, 400, 270);
  ctx.fillStyle = 'rgba(255,255,255,.06)'; ctx.fillRect(DOORX - 70, FLOOR - 270, 3, 270);
  ctx.fillStyle = '#1a1a1a'; ctx.beginPath(); ctx.moveTo(DOORX - 90, FLOOR - 268); ctx.lineTo(DOORX + 160, FLOOR - 380); ctx.lineTo(DOORX + 420, FLOOR - 268); ctx.fill();
}
function snow(t, a) {
  if (a <= 0) return;
  const r = E.rng(12);
  for (let i = 0; i < 110; i++) {
    const x0 = 120 + r() * 520, sp = 40 + r() * 50, ph = r();
    const y = FLOOR - 520 + ((t * sp / 520 + ph) % 1) * 520, x = x0 + Math.sin(t * 1.5 + i) * 12;
    ctx.fillStyle = `rgba(240,240,250,${.6 * a})`; ctx.beginPath(); ctx.arc(x, y, 1.5 + r() * 2, 0, Math.PI * 2); ctx.fill();
  }
}
const rainA = t => smooth(prog(t, C.rain0, C.rain0 + .3)) * (1 - smooth(prog(t, C.rain1 - .3, C.rain1)));
const snowA = t => smooth(prog(t, C.snow0, C.snow0 + .3)) * (1 - smooth(prog(t, C.snow1 - .3, C.snow1)));

window.SCENE = {
  id: '35-te-esperara', title: 'Él te esperará *siempre*', duration: D, cue: C,
  sky: t => { const p = prog(t, C.tl0, C.tl1); return p > 0 && p < 1 ? .45 * clamp(Math.sin(sunTh(t)) * 2) : 0; },
  spot: t => ({ x: keyed([[0, 420], [C.light, 440]], t), r: 360 }),
  beam: t => ({ x: keyed([[0, 400], [C.light, 450]], t), a: .05 - .02 * E.bump(t, C.tl1, C.light + .5), w: 170 }),
  flashes: [], blackouts: [C.close + .02],
  camera: t => ({
    zoom: keyed([[0, 2.15], [C.leave, 2.0], [C.close, 2.05], [C.wait + .6, 2.3], [C.tl0, 1.85], [C.tl1, 1.7], [C.light - .2, 2.1], [C.dogUp, 2.0], [C.run, 1.95], [C.hug, 2.25], [15, 2.3], [D, 1.9]], t),
    x: keyed([[0, 370], [C.atDoor, 440], [C.close, 430], [C.wait + .6, 395], [C.tl0, 420], [C.tl1, 420], [C.light - .2, 420], [C.run, 425], [C.hug, 420], [D, 420]], t),
    y: keyed([[0, FLOOR - 150], [C.close, FLOOR - 170], [C.wait + .6, FLOOR - 120], [C.tl0, FLOOR - 230], [C.tl1, FLOOR - 220], [C.light - .2, FLOOR - 150], [C.hug, FLOOR - 140], [D, FLOOR - 190]], t),
    shake: .25 * E.pulse(t, C.close, .2),
  }),
  backdrop(t) { sky(t); },
  world(t, refl) {
    wall(t);
    const op = doorOpen(t), lightA = t < C.light ? op : Math.max(op, smooth(prog(t, C.light, C.open)));
    // rendija de luz antes de abrir
    if (!refl && t > C.light - .3 && t < C.open + .3) { const a = smooth(prog(t, C.light - .3, C.light + .2)); ctx.fillStyle = `rgba(255,236,210,${.8 * a})`; ctx.shadowColor = '#fff'; ctx.shadowBlur = 30; ctx.fillRect(DOORX - 47, FLOOR - 4, 94, 4); ctx.fillRect(DOORX + 43, FLOOR - 190, 3, 190); ctx.shadowBlur = 0; }
    E.door(DOORX, FLOOR, op, lightA, 90, 190);
    if (!refl && t > C.open) glowCircle(DOORX, FLOOR - 95, 260, '255,230,200', .25 * smooth(prog(t, C.open, C.open + .6)));
    // plato de comida
    ctx.fillStyle = '#555'; ctx.beginPath(); ctx.ellipse(DOGX - 64, FLOOR - 5, 18, 6, 0, 0, Math.PI * 2); ctx.fill();
    const oa = ownerAlpha(t);
    if (oa > 0 && t < C.hug + .05) figure(owner(t), STYLE.hero, { alpha: oa });
    const ds = dogState(t);
    // nieve acumulada sobre el perro
    dog(ds.x, ds.phase, ds);
    if (t >= C.hug - .05) figure(owner(t), STYLE.hero);
    const sa = smooth(prog(t, C.snow0 + .5, C.snow1)) * (1 - smooth(prog(t, C.snow1 + .5, C.tl1 + .5)));
    if (sa > 0) { ctx.fillStyle = `rgba(245,245,255,${.85 * sa})`; ctx.beginPath(); ctx.ellipse(ds.x - 6, FLOOR - 32 * 1.15 + lerp(-12, 10, ds.lie) * 1.15, 26 * sa, 5 * sa, 0, 0, Math.PI * 2); ctx.fill(); }
    if (!refl) {
      // corazones
      for (let i = 0; i < 10; i++) {
        const st = C.hug + .1 + i * .38, p = prog(t, st, st + 2.8); if (p <= 0 || p >= 1) continue;
        const x = DHX + 30 + ((i * 53) % 120) - 60 + Math.sin(t * 2 + i) * 10;
        E.heart(x, FLOOR - 160 - p * 260, 14 + (i % 3) * 6, '#ff3b36', Math.sin(Math.PI * p), 18);
      }
      E.burst(DHX + 40, FLOOR - 130, t, C.hug, { n: 34, speed: 260, size: 4, color: '255,70,60', gravity: .3, life: 1.4 });
      E.ring(DHX + 40, FLOOR - 120, t, C.hug, { r: 220, color: '255,80,60', width: 6 });
      // signo de pregunta-gemido: lágrima del perro al quedarse solo
      const tr = E.bump(t, C.wait + .1, C.tl0 + .3);
      if (tr > 0) { ctx.fillStyle = `rgba(200,220,255,${.8 * tr})`; ctx.beginPath(); ctx.arc(DOGX + 50, FLOOR - 74 + (t - C.wait) * 20, 3.2, 0, Math.PI * 2); ctx.fill(); }
    }
  },
  front(t) {
    const ra = rainA(t); if (ra > 0) E.rain(t, 100, 700, FLOOR - 560, FLOOR, ra);
    snow(t, snowA(t));
  },
  events() {
    const ev = [{ t: .02, type: 'bark', vol: .7 }, { t: C.leave, type: 'step' }, { t: C.leave + .5, type: 'step' }, { t: C.leave + 1.0, type: 'step' },
      { t: C.atDoor - .2, type: 'door', vol: .8 }, { t: C.close, type: 'thud', vol: .8 }, { t: C.close + .05, type: 'knock', vol: .4 },
      { t: C.wait + .2, type: 'whoosh', vol: .2 },
      { t: C.tl0, type: 'clock', dur: C.tl1 - C.tl0, vol: .9 }, { t: C.rain0, type: 'rain', dur: C.rain1 - C.rain0, vol: .9 }, { t: C.snow0, type: 'wind', dur: C.snow1 - C.snow0 + .5, vol: .8 },
      { t: C.light - .1, type: 'swell', dur: 1.2, vol: .7 }, { t: C.open, type: 'door' }, { t: C.ears, type: 'pop', vol: .3 },
      { t: C.dogUp + .3, type: 'bark', vol: .9 }, { t: C.run + .2, type: 'bark', vol: 1 }, { t: C.hug, type: 'thud', vol: .5 }, { t: C.hug + .05, type: 'sparkle' }, { t: C.hug + .3, type: 'kiss', vol: .6 }];
    for (let k = 0; k < 6; k++) ev.push({ t: C.run + k * .1, type: 'step', size: .5, vol: .7 });
    return ev;
  },
  music: {
    sections: [
      { t: .2, dur: C.tl0 - .2, style: 'tender', chords: ['C', 'G', 'Am', 'F'], chordLen: 1.0 },
      { t: C.tl0, dur: C.tl1 - C.tl0, style: 'sad', chords: ['Am', 'F', 'C', 'G'], chordLen: .8 },
      { t: C.tl1, dur: C.light - C.tl1, style: 'silence' },
      { t: C.open, dur: D - C.open, style: 'hope', chords: ['F', 'C', 'G', 'C'], chordLen: 1.3 },
    ],
    stingers: [{ t: C.hug, type: 'bells' }, { t: C.open, type: 'chime' }],
    duck: [[C.close + .05, C.wait + .4]],
  },
};
})();
