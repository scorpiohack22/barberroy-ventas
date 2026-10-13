// 34 — MIENTRAS PUEDAS: el abuelo quiere abrazar a su nieto, que solo mira el celular.
// Pasa el tiempo, el abuelo se desvanece. El nieto deja el celular y abraza el aire. Un corazón rojo late... y se apaga.
(() => {
const { FLOOR, clamp, lerp, prog, smooth, easeOut, easeIn, easeInOut, keyed, figure, STYLE, mix, mixStyle, sit, stand, glowCircle, ctx } = E;
const D = 18.5, GX = 306, KX = 398, SEAT = FLOOR - 50;
const C = { tap: 1.6, shrug: 1.9, open: 3.0, lean: 3.55, dodge: 3.65, freeze: 4.2, lower: 4.7, sadT: 5.4, tl0: 6.2, tl1: 9.6, fade0: 8.4, fade1: 9.6,
  notice: 10.6, put: 11.4, turn: 12.0, hug: 12.75, ghost0: 13.2, ghost1: 14.6, heart: 13.3, heartOff: 16.3 };
const age = t => smooth(prog(t, C.tl0, C.fade0));

function grandpa(t) {
  const a = age(t);
  const base = { ...sit(GX, { seat: SEAT, s: .96, tilt: .05 + .1 * a, lean: .14 + .16 * a }), arms: [{ ang: .7, bend: .6 }, { ang: .55, bend: .6 }] };
  const look = { ...base, tilt: .22, lean: .2 };
  const tap = { ...base, lean: .42, tilt: .15, arms: [{ target: { x: KX - 6, y: FLOOR - 128 } }, { ang: .6, bend: .6 }] };
  const wind = { ...base, lean: -.1, tilt: -.15, arms: [{ ang: 2.3, bend: .25 }, { ang: 2.0, bend: .25 }] };
  const hugIn = { ...base, lean: .5, tilt: .1, arms: [{ ang: 1.9, bend: .55 }, { ang: 1.7, bend: .6 }] };
  const frozen = { ...base, lean: .38, tilt: .2, arms: [{ ang: 1.6, bend: .4 }, { ang: 1.4, bend: .45 }] };
  const sadP = { ...base, lean: .36, tilt: .7, arms: [{ ang: .45, bend: .6 }, { ang: .35, bend: .6 }] };
  const old = q => ({ ...sit(GX, { seat: SEAT, s: .96, tilt: .55, lean: .42 + .03 * Math.sin(q * 2) }), arms: [{ ang: .45, bend: .7 }, { ang: .35, bend: .7 }] });
  return E.poseAt(t, [[0, look], [C.tap - .35, look], [C.tap, tap], [C.shrug + .4, tap], [C.shrug + .8, look], [C.open - .1, look], [C.open + .3, wind], [C.lean, hugIn],
    [C.freeze, frozen], [C.lower, frozen], [C.sadT, sadP], [C.tl0, sadP], [C.fade0, old]]);
}
function kid(t) {
  const scroll = Math.sin(t * 7) * 2;
  const phoneP = q => { const p = sit(KX, { seat: SEAT, s: .86, tilt: .62, lean: .3 }); const sh = E.shoulderOf(p);
    p.arms = [{ target: { x: sh.x + 26, y: sh.y + 34 + Math.sin(q * 7) * 1.5 } }, { target: { x: sh.x + 22, y: sh.y + 38 } }]; return p; };
  const shrug = q => { const p = phoneP(q); p.lean = .42; p.hip = { ...p.hip, x: p.hip.x + 4 }; return p; };
  const dodge = q => { const p = phoneP(q); p.lean = .6; p.tilt = .5; p.hip = { ...p.hip, x: p.hip.x + 14 }; const sh = E.shoulderOf(p);
    p.arms = [{ target: { x: sh.x + 34, y: sh.y + 26 } }, { target: { x: sh.x - 30, y: sh.y + 6 }, elbowUp: true }]; return p; };
  const look = { ...sit(KX, { seat: SEAT, s: .86, tilt: .1, lean: .05, dir: -1 }) };
  look.arms = [{ ang: .5, bend: .6 }, { target: { x: KX + 30, y: SEAT - 2 } }];
  // al darse cuenta: gira la cabeza (dir -1) mirando el asiento vacío
  const noticeP = { ...sit(KX, { seat: SEAT, s: .86, tilt: .35, lean: .12, dir: -1 }), arms: [{ target: { x: KX - 30, y: SEAT - 30 } }, { target: { x: KX + 30, y: SEAT - 4 } }] };
  const reach = { ...sit(KX - 6, { seat: SEAT, s: .86, tilt: 0, lean: .2, dir: -1 }), arms: [{ ang: 2.1, bend: .3 }, { ang: 1.9, bend: .35 }] };
  const hugP = q => ({ ...sit(KX - 14, { seat: SEAT, s: .86, tilt: .55, lean: .55 + .02 * Math.sin(q * 3), dir: -1 }),
    arms: [{ target: { x: GX + 4, y: FLOOR - 128 } }, { target: { x: GX + 14, y: FLOOR - 138 } }] });
  return E.poseAt(t, [[0, phoneP], [C.shrug - .1, phoneP], [C.shrug + .1, shrug], [C.shrug + .5, phoneP], [C.dodge - .1, phoneP], [C.dodge + .15, dodge], [C.freeze + .5, dodge],
    [C.lower + .4, phoneP], [C.notice - .1, phoneP], [C.notice + .4, noticeP], [C.put, noticeP], [C.put + .4, noticeP], [C.turn, look], [C.turn + .35, reach], [C.hug, hugP]]);
}
const phoneOn = t => 1 - smooth(prog(t, C.put, C.put + .4));
const phonePos = t => {
  if (t < C.put) { const sl = E.solve(kid(t)); return { ...E.hand(sl, 0), rot: -.4 }; }
  const p = prog(t, C.put, C.put + .4); const sl = E.solve(kid(C.put));
  const h = E.hand(sl, 0); return { x: lerp(h.x, KX + 36, easeInOut(p)), y: lerp(h.y, SEAT - 4, easeIn(p)), rot: lerp(-.4, -Math.PI / 2, p) };
};
// cielo: soles y lunas que pasan en el time-lapse
function sky(t) {
  const p = smooth(prog(t, C.tl0, C.tl1)), th = p * Math.PI * 2 * 3.5;
  if (p <= 0 || p >= 1) return;
  const a = Math.min(1, prog(t, C.tl0, C.tl0 + .4) * 1, 1 - prog(t, C.tl1 - .4, C.tl1));
  const cx = 352, cy = FLOOR - 40, R = 360;
  const sx = cx - Math.cos(th) * R, sy = cy - Math.sin(th) * R * .9;
  if (Math.sin(th) > -.1) E.sun(sx, sy, 30, a);
  const mx = cx + Math.cos(th) * R, my = cy + Math.sin(th) * R * .9;
  if (-Math.sin(th) > -.1) E.moon(mx, my, 24, a);
}
function bench() {
  ctx.fillStyle = '#5a5047'; ctx.fillRect(GX - 50, SEAT - 4, KX - GX + 110, 9);
  ctx.fillStyle = 'rgba(255,255,255,.1)'; ctx.fillRect(GX - 50, SEAT - 4, KX - GX + 110, 2);
  ctx.fillStyle = '#3a342f'; for (const x of [GX - 40, KX + 48]) ctx.fillRect(x, SEAT + 5, 7, FLOOR - SEAT - 5);
  ctx.fillStyle = '#4a423b'; ctx.fillRect(GX - 52, SEAT - 70, 8, 70); ctx.fillRect(GX - 52, SEAT - 70, 30, 7);
}
// partículas que se elevan del abuelo al desvanecerse
function dissolve(t, sl) {
  const p = prog(t, C.fade0, C.fade1 + .6); if (p <= 0 || p >= 1) return;
  const r = E.rng(17);
  for (let i = 0; i < 70; i++) {
    const pts = [sl.head, sl.sh, sl.hip, sl.legs[0][1], sl.arms[0][1], sl.arms[0][2]];
    const b = pts[i % pts.length], st = r() * .6, q = clamp((p - st) / .4);
    if (q <= 0 || q >= 1) continue;
    const x = b.x + (r() - .5) * 30 + Math.sin(t * 2 + i) * 8 * q, y = b.y + (r() - .5) * 30 - q * 120;
    ctx.fillStyle = `rgba(200,200,200,${(1 - q) * .7})`; ctx.beginPath(); ctx.arc(x, y, 1.5 + r() * 2.5, 0, Math.PI * 2); ctx.fill();
  }
}

window.SCENE = {
  id: '34-mientras-puedas', title: 'Abrázalos *mientras puedas*', duration: D, cue: C,
  sky: t => .5 * E.bump(t, C.tl0, C.tl1) * (.5 + .5 * Math.sin(smooth(prog(t, C.tl0, C.tl1)) * Math.PI * 2 * 3.5)),
  spot: { x: 352, r: 330 },
  beam: t => ({ x: 352, a: .06, w: 160 }),
  flashes: [], blackouts: [C.tl1 - .05],
  camera: t => ({
    zoom: keyed([[0, 2.25], [1.5, 2.1], [C.open, 2.15], [C.dodge, 2.4], [C.sadT, 2.45], [C.tl0, 1.95], [C.tl1, 1.8], [C.notice, 2.0], [C.put, 2.15], [C.hug, 2.35], [C.heart + .8, 2.3], [D, 1.85]], t),
    x: keyed([[0, 372], [C.open, 352], [C.dodge, 340], [C.sadT, 318], [C.tl0, 352], [C.tl1, 345], [C.notice, 360], [C.hug, 345], [D, 350]], t),
    y: keyed([[0, FLOOR - 160], [C.dodge, FLOOR - 150], [C.sadT, FLOOR - 140], [C.tl0, FLOOR - 220], [C.tl1, FLOOR - 200], [C.notice, FLOOR - 160], [C.hug, FLOOR - 160], [C.heart + .8, FLOOR - 190], [D, FLOOR - 210]], t),
  }),
  backdrop(t) { sky(t); },
  world(t, refl) {
    bench();
    // bastón apoyado en la banca (se queda cuando él ya no está)
    E.cane({ x: GX - 70, y: SEAT - 52 }, { x: GX - 84, y: FLOOR });
    const ga = 1 - smooth(prog(t, C.fade0, C.fade1));
    if (ga > 0) {
      const st = mixStyle(STYLE.gray, STYLE.dim, age(t) * .6);
      const sl = figure(grandpa(t), st, { alpha: ga });
      if (!refl) dissolve(t, sl);
    } else if (!refl) dissolve(t, E.solve(grandpa(C.fade1 - .01)));
    // fantasma del abuelo en el abrazo
    const gh = E.bump(t, C.ghost0, C.ghost1) * .3;
    if (gh > 0) figure({ ...sit(GX, { seat: SEAT, s: .96, tilt: .3, lean: .1 }), arms: [{ target: { x: KX - 20, y: FLOOR - 132 } }, { ang: .6, bend: .5 }] }, STYLE.dim, { alpha: gh, noShadow: true });
    const ks = figure(kid(t), STYLE.hero);
    const pp = phonePos(t);
    E.phone(pp.x, pp.y, pp.rot, phoneOn(t) * (.85 + .15 * Math.sin(t * 13)), .8);
    if (!refl) {
      if (phoneOn(t) > 0) { const hd = ks.head; glowCircle(hd.x + 10, hd.y + 6, 36, '255,40,30', .35 * phoneOn(t)); }
      // corazón sobre el asiento vacío: late y se apaga
      const ha = smooth(prog(t, C.heart, C.heart + .5)) * (1 - smooth(prog(t, C.heartOff - .3, C.heartOff + .25)));
      if (ha > 0) {
        const beat = 1 + .16 * Math.max(0, Math.sin((t - C.heart) * 7.5)) ** 8 + .1 * Math.max(0, Math.sin((t - C.heart) * 7.5 - .9)) ** 8;
        const flick = t > C.heartOff - .8 ? (Math.sin(t * 40) > 0 ? 1 : .3) : 1;
        E.heart(GX + 10, FLOOR - 250, 36 * beat, '#ff3b36', ha * flick, 35);
        glowCircle(GX + 10, FLOOR - 258, 90, '255,40,30', .25 * ha * flick);
      }
      E.burst(GX + 10, FLOOR - 258, t, C.heartOff + .1, { n: 22, speed: 120, size: 2.5, color: '255,70,60', gravity: .5, life: 1.2 });
      // hojas/años que caen en el time-lapse
      const lp = E.bump(t, C.tl0, C.tl1);
      if (lp > 0) { const r = E.rng(4); for (let i = 0; i < 26; i++) { const x0 = 150 + r() * 420, sp = 140 + r() * 120, ph = r();
        const y = FLOOR - 420 + ((t * sp / 420 + ph) % 1) * 420, x = x0 + Math.sin(t * 3 + i) * 14;
        ctx.fillStyle = `rgba(210,210,210,${.45 * lp})`; ctx.beginPath(); ctx.ellipse(x, y, 4, 2, t * 2 + i, 0, Math.PI * 2); ctx.fill(); } }
    }
  },
  events() {
    return [
      { t: .02, type: 'notify', vol: .8 }, { t: .3, type: 'buzz', dur: .3, vol: .3 },
      { t: C.tap, type: 'knock', vol: .3 }, { t: C.shrug + .05, type: 'scuff', vol: .4 },
      { t: C.open + .1, type: 'whoosh', vol: .4 }, { t: C.dodge, type: 'whoosh', vol: .6 }, { t: C.dodge + .2, type: 'notify', vol: .6 },
      { t: C.tl0, type: 'clock', dur: C.tl1 - C.tl0, vol: 1 }, { t: C.tl0 + .1, type: 'wind', dur: 3.5, vol: .5 }, { t: C.tl0 + .2, type: 'riser', dur: C.fade0 - C.tl0 },
      { t: C.fade0, type: 'swell', dur: 1.4, vol: .6 }, { t: C.fade0 + .3, type: 'sparkle', vol: .5 },
      { t: C.put + .4, type: 'knock', vol: .35 },
      ...[0, 1, 2, 3, 4].map(i => ({ t: C.heart + .1 + i * .84, type: 'heartbeat', vol: .9 - i * .14 })),
      { t: C.heartOff, type: 'snap', vol: .4 },
    ];
  },
  music: {
    sections: [
      { t: .2, dur: C.tl0 - .2, style: 'tender', chords: ['C', 'G', 'Am', 'F'], chordLen: 1.3 },
      { t: C.tl0, dur: C.tl1 - C.tl0, style: 'build', chords: ['Am', 'F', 'C', 'G'], chordLen: .55 },
      { t: C.tl1 + .2, dur: C.hug - C.tl1, style: 'silence' },
      { t: C.hug - .2, dur: D - C.hug + .2, style: 'sad', chords: ['Am', 'F', 'C', 'G'], chordLen: 1.5 },
    ],
    stingers: [{ t: C.tl1, type: 'impact' }],
    duck: [[C.dodge + .05, C.sadT]],
  },
};
})();
