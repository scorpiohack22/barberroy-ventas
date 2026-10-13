// 45 — AYUDAR ES HUMANO: a una anciana se le rompe la bolsa y las manzanas ruedan. Pasan de largo
// mirando el celular. Un niño se detiene y las recoge; al verlo, dos adultos guardan el celular y ayudan
// (al ayudar se "iluminan"). La anciana acaricia la cabeza del niño: corazón.
(() => {
const { FLOOR, clamp, lerp, prog, smooth, easeOut, easeIn, easeInOut, keyed, solve, figure, mixStyle, STYLE, ARM, stand, walk, crouch, mix, poseAt, heart, burst, ring, rng, glowCircle, phone, cane, ctx } = E;
const D = 19;
const WX = 330;                    // anciana (mira a la derecha)
const CUE = { rip: 1.15, shock: 1.3, bend: 2.6, give: 9.4, pat: 12.2, heart: 12.7 };
const OLD = mixStyle(STYLE.hero, STYLE.gray, .72);

// ── manzanas: [x reposo, recolector, t recoger, t entregar] ──
const APPLES = [
  { x: 255, who: 'p2', pick: 9.95, give: 11.05, d: .05 },
  { x: 388, who: 'p3', pick: 10.15, give: 11.3, d: .12 },
  { x: 438, who: 'kid', pick: 8.45, give: CUE.give, d: 0 },
  { x: 488, who: 'kid', pick: 7.75, give: CUE.give, d: .09 },
  { x: 548, who: 'kid', pick: 7.0, give: CUE.give, d: .03 },
];

// walker por tramos: keys [[t, x]] → posición y distancia recorrida
function track(keys) {
  return t => {
    let d = 0;
    for (let i = 1; i < keys.length; i++) {
      const [t0, x0] = keys[i - 1], [t1, x1] = keys[i];
      if (t <= t0) break;
      const p = clamp((t - t0) / (t1 - t0));
      d += Math.abs(x1 - x0) * p;
    }
    let x = keys[0][1];
    for (let i = 1; i < keys.length; i++) { const [t0, x0] = keys[i - 1], [t1, x1] = keys[i]; if (t > t0) x = lerp(x0, x1, clamp((t - t0) / (t1 - t0))); }
    let v = 0; for (let i = 1; i < keys.length; i++) { const [t0, x0] = keys[i - 1], [t1, x1] = keys[i]; if (t > t0 && t < t1) v = (x1 - x0) / (t1 - t0); }
    return { x, d, v };
  };
}
const W_T = track([[0, 250], [CUE.rip, WX]]);
const P1_T = track([[2.0, -90], [7.2, 820]]);
const P2_T = track([[3.0, 820], [8.6, 232]]);
const P3_T = track([[4.6, -90], [9.4, 420]]);
const KID_T = track([[5.6, 790], [6.8, 572], [7.0, 572], [7.55, 520], [7.75, 520], [8.25, 470], [8.45, 470], [9.15, 410]]);

function phoneWalker(tr, t, dir, o = {}) {
  const s = tr(t);
  const p = walk(s.x, s.d, { dir, lean: .12, tilt: .55, swing: .2, freeze: Math.abs(s.v) < 1 ? 1 : 0, ...o });
  if (Math.abs(s.v) < 1) { p.feet = [{ x: s.x + 7 * dir, y: FLOOR }, { x: s.x - 9 * dir, y: FLOOR }]; p.hip.y = FLOOR - 94; }
  const sh = E.shoulderOf(p);
  const ph = { x: sh.x + 24 * dir, y: sh.y + 22 };
  p.arms = [{ target: { x: ph.x - 2 * dir, y: ph.y + 4 } }, { target: { x: ph.x + 3 * dir, y: ph.y + 6 } }];
  return { p, ph };
}

// adulto que se detiene, guarda el celular y recoge su manzana
function helper(tr, t, dir, stopT, ap, gx) {
  const base = phoneWalker(tr, t, dir);
  const s = tr(t);
  const noticeT = stopT + .1, turnT = stopT + .5;
  const notice = smooth(prog(t, noticeT, noticeT + .35));
  let p = base.p, phOn = 1 - smooth(prog(t, turnT - .1, turnT + .2));
  if (t < noticeT) return { p, ph: base.ph, phOn, glow: 0 };
  const ndir = ap.x > s.x ? 1 : -1;
  const look = stand(s.x, { dir, tilt: .25, lean: .05 });
  look.arms = [{ ang: .2, bend: .5 }, { ang: .1, bend: .4 }];
  const face = stand(s.x, { dir: ndir, tilt: .5, lean: .15, t });
  const cr = crouch(s.x + 10 * ndir, { dir: ndir, amt: .95, tilt: .5 });
  const sh = E.shoulderOf(cr);
  cr.arms = [{ target: { x: ap.x, y: FLOOR - 8 } }, { ang: .6, bend: .4 }];
  const up = stand(s.x, { dir: ndir, tilt: .1, lean: .05, t });
  // camina a la anciana a entregar
  const go = easeInOut(prog(t, ap.pick + .45, ap.give - .1));
  const wk = walk(lerp(s.x, gx, go), Math.abs(gx - s.x) * go, { dir: gx > s.x ? 1 : -1, lean: .08, freeze: go >= 1 ? 1 : 0 });
  const giveP = stand(gx, { dir: gx > WX ? -1 : 1, lean: .12, tilt: .25, t });
  p = poseAt(t, [[noticeT, base.p], [noticeT + .3, look], [turnT + .2, face], [ap.pick - .05, cr], [ap.pick + .45, up]]);
  if (t > ap.pick + .45) p = t < ap.give - .1 ? wk : giveP;
  const glow = smooth(prog(t, ap.pick, ap.give + .6));
  return { p, ph: base.ph, phOn, glow, carry: t > ap.pick && t < ap.give };
}

function kid(t) {
  const s = KID_T(t), moving = Math.abs(s.v) > 1;
  let p = walk(s.x, s.d * 1.05, { s: .58, dir: -1, lean: .1, freeze: moving ? 0 : 1 });
  if (!moving) p.feet = [{ x: s.x - 6, y: FLOOR }, { x: s.x + 8, y: FLOOR }];
  // descubre la manzana: se agacha, mira a la anciana
  const picks = APPLES.filter(a => a.who === 'kid');
  for (const a of picks) {
    const k = E.bump(t, a.pick - .3, a.pick + .25);
    if (k > 0) {
      const c = crouch(s.x, { s: .58, dir: -1, amt: .9, tilt: .4 });
      c.arms = [{ target: { x: a.x, y: FLOOR - 6 } }, { ang: .5, bend: .5 }];
      p = mix(p, c, k);
    }
  }
  // primera: se queda mirando a la anciana (pausa)
  const firstLook = smooth(prog(t, 7.15, 7.3)) * (1 - smooth(prog(t, 7.4, 7.55)));
  p.tilt = lerp(p.tilt, -.25, firstLook);
  if (t > CUE.give - .3) {
    const g = stand(410, { s: .58, dir: -1, tilt: -.2, lean: .02, t });
    p = mix(p, g, smooth(prog(t, CUE.give - .3, CUE.give)));
    const sh = E.shoulderOf(p);
    const offer = E.bump(t, CUE.give - .25, CUE.give + .7);
    if (offer > 0) p.arms = [{ target: { x: sh.x - 30 * offer - 10, y: sh.y + 10 - 12 * offer } }, { target: { x: sh.x - 26 * offer - 6, y: sh.y + 14 - 10 * offer } }];
    // levanta la cara cuando lo acarician
    const pat = smooth(prog(t, CUE.pat - .2, CUE.pat + .3));
    p.tilt = lerp(p.tilt, -.45, pat); p.lean = lerp(p.lean, -.1, pat);
    if (t > CUE.give + .7) p.arms = [{ ang: .25 + .1 * pat, bend: .4 }, { ang: .1, bend: .4 }];
  } else if (t > picks[picks.length - 1].pick + .25) {
    const sh = E.shoulderOf(p);
    p.arms = [{ target: { x: sh.x - 14, y: sh.y + 16 } }, { target: { x: sh.x - 10, y: sh.y + 20 } }];
  }
  return p;
}

function woman(t) {
  const w = W_T(t), walking = t < CUE.rip;
  let p = walk(w.x, w.d, { dir: 1, stride: .55, stand: 88, lean: .3, tilt: .2, freeze: walking ? 0 : 1 });
  if (!walking) {
    const shock = smooth(prog(t, CUE.shock, CUE.shock + .2)) * (1 - smooth(prog(t, CUE.bend - .3, CUE.bend)));
    const bend = E.bump(t, CUE.bend, CUE.bend + 1.6);
    const pain = smooth(prog(t, CUE.bend + .5, CUE.bend + .8)) * (1 - smooth(prog(t, CUE.bend + 1.4, CUE.bend + 1.9)));
    p = stand(WX, { dir: 1, lean: .3 + .35 * bend - .12 * shock, tilt: .35 + .25 * bend - .25 * shock, t });
    p.hip.y += 4 + 8 * bend;
    p.feet = [{ x: WX + 12, y: FLOOR }, { x: WX - 12, y: FLOOR }];
    const sh = E.shoulderOf(p);
    p.arms = [{ target: { x: WX + 34, y: FLOOR - 82 } }, { ang: lerp(.4, 2.4, shock), bend: lerp(.3, 1.5, shock) }];
    if (bend > 0) p.arms[1] = pain > 0 ? { target: { x: p.hip.x - 14, y: p.hip.y - 12 } } : { ang: .9 * bend + .4, bend: .2 };
    // recibe manzanas: brazos al pecho
    const hold = smooth(prog(t, CUE.give - .2, CUE.give + .2));
    if (hold > 0) p.arms[1] = { target: { x: lerp(sh.x + 30, sh.x + 8, hold), y: lerp(sh.y + 34, sh.y + 50, hold) } };
    // acaricia la cabeza del niño
    const pat = smooth(prog(t, CUE.pat - .3, CUE.pat));
    if (pat > 0) {
      const kh = E.headOf(kid(t));
      const tap = Math.sin(Math.max(0, t - CUE.pat) * 7) * 3;
      p.arms[0] = { target: { x: lerp(WX + 34, kh.x - 2, pat), y: lerp(FLOOR - 82, kh.y - 16 + tap, pat) } };
      p.tilt = lerp(p.tilt, .55, pat); p.lean = lerp(p.lean, .4, pat);
    }
  }
  return p;
}

function bag(hand, t) {
  const rip = prog(t, CUE.rip, CUE.rip + .15);
  ctx.save(); ctx.translate(hand.x, hand.y);
  ctx.fillStyle = '#b8966a'; ctx.shadowColor = 'rgba(255,220,170,.2)'; ctx.shadowBlur = 8;
  ctx.beginPath(); ctx.moveTo(-14, 4); ctx.lineTo(14, 4); ctx.lineTo(16, 40 - 10 * rip); ctx.lineTo(8, 40 + 8 * rip); ctx.lineTo(0, 38 - 6 * rip); ctx.lineTo(-8, 42 + 6 * rip); ctx.lineTo(-16, 40); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(-14, 4, 28, 4);
  ctx.restore();
}
function apple(x, y, r = 8, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.fillStyle = '#ff3b36'; ctx.shadowColor = '#ff3b36'; ctx.shadowBlur = 14;
  ctx.beginPath(); ctx.arc(-3, 0, r * .8, 0, Math.PI * 2); ctx.arc(3, 0, r * .8, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0; ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.arc(-4, -3, r * .25, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#8a6a40'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -r * .6); ctx.lineTo(1, -r * 1.1); ctx.stroke();
  ctx.restore();
}

function cast(t) {
  const W = woman(t);
  const p1 = phoneWalker(P1_T, t, 1);
  const p2 = helper(P2_T, t, -1, 8.6, APPLES[0], 262);
  const p3 = helper(P3_T, t, 1, 9.4, APPLES[1], 492);
  const K = kid(t);
  return { W, p1, p2, p3, K };
}

function applePos(a, i, t, c, sl) {
  const wHand = E.hand(sl.W, 1);
  const t0 = CUE.rip + a.d;
  if (t < t0) return { x: wHand.x + (i - 2) * 4, y: wHand.y + 26, rot: 0, hide: true };
  const fallT = .32, rollT = 1.3 + Math.abs(a.x - wHand.x) / 260;
  const dt = t - t0;
  const x0 = wHand.x + (i - 2) * 4;
  let x, y;
  if (dt < fallT) { const f = dt / fallT; x = x0 + (a.x - x0) * .08 * f; y = lerp(wHand.y + 26, FLOOR - 8, f * f); }
  else {
    const r = clamp((dt - fallT) / rollT), bounce = Math.abs(Math.sin(r * Math.PI * 3)) * 14 * (1 - r) * (1 - r);
    x = lerp(x0 + (a.x - x0) * .08, a.x, easeOut(r)); y = FLOOR - 8 - bounce;
  }
  let rot = (x - x0) / 8;
  // recogida
  if (t > a.pick) {
    const holder = a.who === 'kid' ? sl.K : a.who === 'p2' ? sl.p2 : sl.p3;
    const h = E.hand(holder, 0);
    const g = smooth(prog(t, a.pick, a.pick + .2));
    const idx = APPLES.filter(b => b.who === a.who).indexOf(a);
    x = lerp(x, h.x + idx * 6 - 6, g); y = lerp(y, h.y - 4 - idx * 3, g); rot = 0;
  }
  if (t > a.give) {
    const sh = sl.W.sh, g = smooth(prog(t, a.give, a.give + .4));
    const ord = [2, 3, 4, 0, 1].indexOf(i);
    x = lerp(x, sh.x + 10 + (ord % 3) * 8 - 6, g); y = lerp(y, sh.y + 42 - Math.floor(ord / 3) * 9 + (ord % 2) * 3, g);
  }
  return { x, y, rot };
}

const CAM = {
  zoom: [[0, 2.35], [CUE.rip, 2.2], [CUE.rip + .6, 2.05], [2.4, 1.75], [5.5, 1.7], [7.0, 1.9], [8.6, 1.95], [9.6, 1.7], [11.4, 1.7], [CUE.pat, 1.95], [CUE.heart + 2, 2.1], [D, 1.75]],
  x: [[0, 320], [CUE.rip, 345], [2.4, 390], [5.5, 400], [7.0, 480], [8.6, 430], [9.6, 360], [11.4, 365], [CUE.pat, 365], [D, 365]],
  y: [[0, FLOOR - 165], [2.4, FLOOR - 190], [7.0, FLOOR - 160], [9.6, FLOOR - 185], [CUE.pat, FLOOR - 165], [CUE.heart + 2, FLOOR - 175], [D, FLOOR - 200]],
};

window.SCENE = {
  id: '45-ayudar', title: 'Ayudar *es humano*', duration: D, cue: CUE,
  spot: t => ({ x: keyed([[0, 330], [5, 380], [8.5, 440], [10, 350]], t), r: 380 }),
  beam: t => ({ x: keyed([[0, 330], [9, 330], [CUE.pat, 345]], t), a: .05 + .08 * smooth(prog(t, CUE.pat - .3, CUE.heart + .5)), w: 190 }),
  sky: t => .4 * smooth(prog(t, CUE.heart, CUE.heart + 1.5)),
  blackouts: [CUE.rip + .02],
  camera: t => ({ zoom: keyed(CAM.zoom, t), x: keyed(CAM.x, t), y: keyed(CAM.y, t), shake: .25 * E.pulse(t, CUE.rip + .35, .2) }),
  world(t, refl) {
    const c = cast(t);
    const sl = { W: solve(c.W), K: solve(c.K), p2: solve(c.p2.p), p3: solve(c.p3.p) };
    // pasante de fondo (más oscuro)
    if (t > 2 && t < 7.3) { figure(c.p1.p, STYLE.dim); if (!refl) phone(c.p1.ph.x, c.p1.ph.y, .3, .9, .8); }
    figure(sl.p3, mixStyle(STYLE.gray, STYLE.hero, c.p3.glow * .5));
    if (c.p3.phOn > 0 && !refl) phone(c.p3.ph.x, c.p3.ph.y, .3, c.p3.phOn, .8);
    if (t >= CUE.pat - .3) cane({ x: WX + 12, y: FLOOR - 92 }, { x: WX + 24, y: FLOOR });
    figure(sl.W, OLD);
    const ch = { x: sl.W.arms[0][2].x, y: sl.W.arms[0][2].y };
    if (t < CUE.pat - .3) cane({ x: ch.x, y: ch.y - 4 }, { x: WX + 44, y: FLOOR });
    {
      const h = E.hand(sl.W, 1), f = easeIn(prog(t, CUE.rip + .1, CUE.rip + .45));
      if (t < CUE.rip + .1) bag(h, t);
      else { const h0 = E.hand(solve(woman(CUE.rip + .1)), 1); bag({ x: lerp(h0.x, WX - 42, f), y: lerp(h0.y, FLOOR - 40, f) }, t); }
    }
    figure(sl.p2, mixStyle(STYLE.gray, STYLE.hero, c.p2.glow * .5));
    if (c.p2.phOn > 0 && !refl) phone(c.p2.ph.x, c.p2.ph.y, -.3, c.p2.phOn, .8);
    figure(sl.K, STYLE.hero);
    APPLES.forEach((a, i) => { const q = applePos(a, i, t, c, sl); if (!q.hide) apple(q.x, q.y, 8, q.rot); });
    if (!refl) {
      // los que ayudan se encienden
      for (const [h, s] of [[c.p2, sl.p2], [c.p3, sl.p3]]) if (h.glow > 0) glowCircle(s.sh.x, s.sh.y + 10, 120, '255,255,255', .08 * h.glow);
      burst(WX + 40, FLOOR - 120, t, CUE.rip, { n: 10, speed: 120, size: 2.5, color: '200,160,110', life: .6 });
      ring(548, FLOOR - 8, t, 7.0, { r: 50, color: '255,80,70', life: .6, width: 4 });
      for (const a of APPLES) ring(a.x, FLOOR - 8, t, a.pick, { r: 36, color: '255,255,255', life: .5, width: 3 });
      // corazón final
      const hp = smooth(prog(t, CUE.heart, CUE.heart + .8));
      if (hp > 0) {
        const hx = (sl.W.head.x + sl.K.head.x) / 2, hy = sl.W.head.y - 70 - 10 * Math.sin(t * 2.4);
        glowCircle(hx, hy, 160, '255,60,50', .25 * hp);
        heart(hx, hy, 46 * E.backOut(hp) * (1 + .05 * Math.sin(t * 7)), '#ff3b36', hp, 40);
        burst(hx, hy, t, CUE.heart + .2, { n: 30, speed: 220, size: 3, color: '255,120,100', life: 1.3, gravity: .2 });
        for (let i = 0; i < 6; i++) {
          const t0 = CUE.heart + .6 + i * .7, dt = t - t0;
          if (dt < 0 || dt > 2.4) continue;
          heart(hx + Math.sin(i * 2.1) * 120, hy + 60 - dt * 70, 14, '#ff3b36', Math.min(1, dt * 3) * (1 - dt / 2.4), 15);
        }
      }
    }
  },
  events() {
    const ev = E.footsteps(D, t => {
      const c = cast(t);
      return [t < CUE.rip ? { phi: c.W.phi || 0, size: .8 } : null, t > 2 && t < 7.2 ? { phi: c.p1.p.phi || 0, size: .9, vol: .6 } : null,
        { phi: c.p2.p.phi || 0, size: 1, vol: .7, moving: Math.abs(P2_T(t).v) > 1 }, { phi: c.p3.p.phi || 0, size: 1, vol: .7, moving: Math.abs(P3_T(t).v) > 1 },
        { phi: c.K.phi || 0, size: .55, moving: Math.abs(KID_T(t).v) > 1 }];
    });
    const caneT = []; for (let t = .2; t < CUE.rip; t += .55) caneT.push({ t, type: 'cane' });
    const drops = APPLES.map(a => ({ t: CUE.rip + a.d + .32, type: 'knock', vol: .45 }));
    return ev.concat(caneT, drops, [
      { t: 0, type: 'whoosh', dur: .5, vol: .6 },
      { t: CUE.rip, type: 'snap' }, { t: CUE.rip + .02, type: 'crack', vol: .4 }, { t: CUE.rip + .3, type: 'impact', vol: .3 },
      { t: CUE.bend + .6, type: 'heartbeat', vol: .5 },
      { t: 2.3, type: 'notify', vol: .35, pan: .5 }, { t: 4.0, type: 'notify', vol: .3, pan: -.5 }, { t: 5.6, type: 'buzz', dur: .4, vol: .3 },
      ...APPLES.map(a => ({ t: a.pick, type: 'pop', vol: .6 })),
      { t: 7.0, type: 'chime', vol: .6 }, { t: CUE.give, type: 'sparkle', vol: .6 },
      { t: 9.25, type: 'swell', dur: 1.5, vol: .5 },
      { t: CUE.heart, type: 'bells' }, { t: CUE.heart + .1, type: 'sparkle' },
    ]);
  },
  music: {
    sections: [
      { t: .1, dur: CUE.rip, style: 'tender', chords: ['C', 'G'], chordLen: .6, vol: .7 },
      { t: CUE.rip + .4, dur: 6.8 - CUE.rip - .4, style: 'sad', chords: ['Am', 'F', 'C', 'G'], chordLen: 1.3 },
      { t: 6.8, dur: CUE.pat - 6.8, style: 'build', chords: ['F', 'G', 'Am', 'C'], chordLen: 1.3 },
      { t: CUE.pat, dur: D - CUE.pat, style: 'hope', chords: ['F', 'C', 'G', 'C'], chordLen: 1.6 },
    ],
    stingers: [{ t: CUE.rip, type: 'impact' }],
    duck: [[CUE.rip, CUE.rip + .5]],
  },
};
})();
