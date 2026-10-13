// 46 — MIENTRAS DORMÍAS, ELLA VELABA: noche tras noche el bebé llora y la madre se levanta,
// mece la cuna y lo arropa con su mantita roja. Pasan los años. Ahora ella está en la cama y es el hijo
// quien despierta, la arropa con la misma manta roja y le toma la mano, bajo la misma luna.
(() => {
const { FLOOR, clamp, lerp, prog, smooth, easeOut, easeIn, easeInOut, keyed, solve, figure, mixStyle, STYLE, stand, walk, sit, lie, mix, poseAt, heart, burst, ring, glowCircle, moon, sun, chair, ctx } = E;
const D = 19.5;
const CX = 485, CW = 112, MAT = FLOOR - 58, RAIL = FLOOR - 132;   // cuna
const CHX = 375;                                                  // silla
const BED_L = [150, 345], BED_R = [448, 700];
const CUE = { cry1: .2, wake1: .5, up1: 1.15, atCrib1: 2.2, tuck1: 2.9, calm1: 3.2, sit1: 4.0, jump1: 4.75,
  cry2: 4.95, wake2: 5.1, up2: 5.45, sit2: 7.0, jump2: 7.55, cry3: 7.7, up3: 7.85, lapse: 8.9, lapseEnd: 11.25,
  act3: 11.6, cough: 12.1, wake3: 12.35, up3b: 12.75, tuck3: 13.15, tuckEnd: 13.95, sit3: 14.15, hand: 14.75, look: 15.15, heart: 15.4, kiss: 16.4 };
const WIN = { x0: 172, x1: 292, y0: FLOOR - 352, y1: FLOOR - 212 };

function babyFig(pose, style = STYLE.hero, opts = {}) {
  const sl = solve(pose);
  const R = { ...sl.R, headR: 23 * pose.s * 1.55 };
  const dx = sl.head.x - sl.sh.x, dy = sl.head.y - sl.sh.y, L = Math.hypot(dx, dy) || 1, k = (R.neck + R.headR) / L;
  return figure({ ...sl, R, head: { x: sl.sh.x + dx * k, y: sl.sh.y + dy * k } }, style, opts);
}

// ── utilería ──
const crying = t => Math.max(E.bump(t, CUE.cry1, CUE.calm1), E.bump(t, CUE.cry2, CUE.cry2 + 1.4), E.bump(t, CUE.cry3, CUE.cry3 + 1.0));
const rockAng = t => (Math.sin((t - 2.2) * 4.2) * .05) * (smooth(prog(t, CUE.atCrib1, CUE.atCrib1 + .2)) * (1 - smooth(prog(t, 3.7, 4.0))) + smooth(prog(t, 5.7, 5.9)) * (1 - smooth(prog(t, 6.7, 7.0))) + smooth(prog(t, 8.0, 8.2)) * (1 - smooth(prog(t, 8.6, 8.85))));
function crib(t, a, front, baby) {
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(CX, FLOOR); ctx.rotate(rockAng(t)); ctx.translate(-CX, -FLOOR);
  const x0 = CX - CW / 2, x1 = CX + CW / 2;
  ctx.strokeStyle = '#a8a29a'; ctx.lineCap = 'round';
  if (!front) {
    // patas mecedoras y colchón
    ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x0 - 14, FLOOR - 12); ctx.quadraticCurveTo(CX, FLOOR + 10, x1 + 14, FLOOR - 12); ctx.stroke();
    ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x0, FLOOR - 4); ctx.lineTo(x0, RAIL - 8); ctx.moveTo(x1, FLOOR - 4); ctx.lineTo(x1, RAIL - 8); ctx.stroke();
    ctx.fillStyle = '#d8d3cb'; ctx.fillRect(x0, MAT, CW, 9);
    if (baby) baby();
  } else {
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(190,185,178,.9)';
    ctx.beginPath(); for (let i = 1; i < 8; i++) { const x = x0 + i * CW / 8; ctx.moveTo(x, MAT); ctx.lineTo(x, RAIL); } ctx.stroke();
    ctx.lineWidth = 6; ctx.strokeStyle = '#bdb7ae'; ctx.beginPath(); ctx.moveTo(x0 - 4, RAIL); ctx.lineTo(x1 + 4, RAIL); ctx.moveTo(x0, MAT + 9); ctx.lineTo(x1, MAT + 9); ctx.stroke();
  }
  ctx.restore();
}
function bed(x0, x1, a = 1, headLeft = true) {
  ctx.save(); ctx.globalAlpha *= a;
  ctx.strokeStyle = '#8f8a83'; ctx.lineWidth = 7; ctx.lineCap = 'round';
  const hx = headLeft ? x0 : x1, fx = headLeft ? x1 : x0;
  ctx.beginPath(); ctx.moveTo(hx, FLOOR); ctx.lineTo(hx, FLOOR - 128); ctx.moveTo(fx, FLOOR); ctx.lineTo(fx, FLOOR - 84);
  ctx.moveTo(x0, FLOOR - 40); ctx.lineTo(x1, FLOOR - 40); ctx.stroke();
  ctx.fillStyle = '#cfc9c0'; ctx.beginPath(); ctx.roundRect(x0 + 4, FLOOR - 62, x1 - x0 - 8, 20, 6); ctx.fill();
  ctx.fillStyle = '#ece8e1'; ctx.beginPath(); ctx.ellipse(headLeft ? x0 + 30 : x1 - 30, FLOOR - 66, 26, 9, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
// manta roja: cubre de xa a xb a la altura y (sobre un cuerpo acostado)
function blanket(xa, xb, y, th, a = 1) {
  if (Math.abs(xb - xa) < 2) return;
  ctx.save(); ctx.globalAlpha *= a;
  ctx.fillStyle = '#e8342f'; ctx.shadowColor = '#ff3b36'; ctx.shadowBlur = 18;
  const l = Math.min(xa, xb), r = Math.max(xa, xb);
  ctx.beginPath(); ctx.moveTo(l, y + 4); ctx.quadraticCurveTo(l + 4, y - th, l + 18, y - th); ctx.lineTo(r - 10, y - th * .8);
  ctx.quadraticCurveTo(r + 4, y - th * .7, r + 2, y + 6); ctx.lineTo(r + 4, y + th * .9); ctx.lineTo(l - 2, y + th * .9); ctx.closePath(); ctx.fill();
  ctx.shadowBlur = 0; ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(l + 10, y - th + 3, r - l - 22, 2.5);
  ctx.restore();
}
function waves(x, y, t, a, dir = -1) {
  if (a <= 0) return;
  for (let i = 0; i < 3; i++) {
    const ph = (t * 1.8 + i / 3) % 1;
    ctx.strokeStyle = `rgba(255,59,54,${a * (1 - ph) * .9})`; ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.arc(x, y, 12 + ph * 46, -Math.PI / 2 - .7, -Math.PI / 2 + .7); ctx.stroke();
  }
}

// ── luna en la ventana ──
function sky(t) {
  const { x0, x1, y0, y1 } = WIN;
  ctx.save();
  ctx.fillStyle = '#05070c'; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  ctx.beginPath(); ctx.rect(x0, y0, x1 - x0, y1 - y0); ctx.clip();
  const lapse = prog(t, CUE.lapse, CUE.lapseEnd);
  if (lapse > 0 && lapse < 1) {
    const th = easeInOut(lapse) * Math.PI * 2 * 4;
    const cx = (x0 + x1) / 2, cy = y1 + 30;
    sun(cx - Math.cos(th) * 70, cy - Math.sin(th) * 90, 14);
    moon(cx + Math.cos(th) * 70, cy + Math.sin(th) * 90, 13);
    ctx.fillStyle = `rgba(80,20,15,${.4 * Math.max(0, Math.sin(th))})`; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  } else {
    const p1 = { x: 205, y: FLOOR - 312 }, p2 = { x: 236, y: FLOOR - 292 }, p3 = { x: 266, y: FLOOR - 262 };
    let p = t < CUE.jump1 ? p1 : t < CUE.jump2 ? p2 : t < CUE.lapse ? p3 : p1;
    const dawn = smooth(prog(t, 8.2, 8.9)) * (t < CUE.lapse ? 1 : 0);
    if (dawn > 0) { ctx.fillStyle = `rgba(90,22,16,${.5 * dawn})`; ctx.fillRect(x0, y0, x1 - x0, y1 - y0); }
    const bright = 1 + .5 * smooth(prog(t, CUE.heart, CUE.heart + 1));
    moon(p.x + (t - (t < CUE.jump1 ? 0 : t < CUE.jump2 ? CUE.jump1 : CUE.jump2)) * 1.5, p.y, 15, Math.min(1, bright));
    if (bright > 1) glowCircle(p.x, p.y, 70, '255,255,255', .15 * (bright - 1));
  }
  ctx.restore();
  ctx.strokeStyle = '#6b6b70'; ctx.lineWidth = 6; ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
  ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo((x0 + x1) / 2, y0); ctx.lineTo((x0 + x1) / 2, y1); ctx.moveTo(x0, (y0 + y1) / 2); ctx.lineTo(x1, (y0 + y1) / 2); ctx.stroke();
  // luz de luna que entra
  const g = ctx.createLinearGradient(0, y1, 0, FLOOR);
  g.addColorStop(0, 'rgba(190,200,230,.07)'); g.addColorStop(1, 'rgba(190,200,230,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x0, y1); ctx.lineTo(x1, y1); ctx.lineTo(x1 + 170, FLOOR); ctx.lineTo(x0 + 120, FLOOR); ctx.fill();
}

// ── ACTO 1: la madre ──
const LIE_M = () => { const p = lie(250, { dir: -1, y: FLOOR - 62 }); p.tilt = 0; return p; };
function mother(t) {
  const age = smooth(prog(t, CUE.lapse + .3, CUE.lapseEnd));
  const rail = h => { const a = rockAng(t); const x = CX - CW / 2 + 4, y = RAIL; return { x: CX + (x - CX) * Math.cos(a) - (y - FLOOR) * Math.sin(a), y: FLOOR + (x - CX) * Math.sin(a) + (y - FLOOR) * Math.cos(a) + h }; };
  const lying = LIE_M();
  const jolt = sit(318, { dir: 1, seat: FLOOR - 58, lean: -.1, tilt: -.25 });
  jolt.arms = [{ ang: .5, bend: .3 }, { ang: -.3, bend: .3 }];
  const standA = stand(338, { dir: 1, lean: .15, tilt: .2 });
  const atCrib = (o = {}) => { const p = stand(410, { dir: 1, lean: .32 + (o.lean || 0), tilt: .55 + (o.tilt || 0), t }); p.feet = [{ x: 418, y: FLOOR }, { x: 398, y: FLOOR }]; return p; };
  const chairP = (o = {}) => sit(CHX, { dir: 1, lean: .12 + (o.lean || 0), tilt: .2 + (o.tilt || 0) });
  let p;
  if (t < CUE.up1) p = poseAt(t, [[CUE.wake1, lying], [CUE.up1, jolt]]);
  else if (t < CUE.atCrib1) {
    const w = prog(t, CUE.up1 + .25, CUE.atCrib1), x = lerp(338, 410, easeInOut(w));
    p = t < CUE.up1 + .25 ? mix(jolt, standA, smooth(prog(t, CUE.up1, CUE.up1 + .25))) : walk(x, (x - 338) * 1.3, { dir: 1, lean: .18, freeze: w >= 1 ? 1 : 0 });
  } else if (t < CUE.sit1) p = atCrib();
  else if (t < CUE.wake2) {
    const doze = smooth(prog(t, CUE.sit1 + .4, CUE.sit1 + .9));
    p = poseAt(t, [[CUE.sit1, atCrib()], [CUE.sit1 + .45, chairP()]]);
    if (t > CUE.sit1 + .45) p = chairP({ tilt: .55 * doze + Math.sin(t * 2) * .03, lean: .15 * doze });
  } else if (t < CUE.sit2) {
    const tired = Math.sin(t * 1.7) * .06;
    p = poseAt(t, [[CUE.wake2, chairP({ tilt: -.25, lean: -.05 })], [CUE.up2, chairP({ tilt: .1 })], [CUE.up2 + .3, atCrib({ tilt: .1 + tired, lean: .05 })], [CUE.sit2 - .1, atCrib({ tilt: .2, lean: .08 })]]);
  } else if (t < CUE.cry3) {
    const doze = smooth(prog(t, CUE.sit2 + .4, CUE.sit2 + .7));
    p = poseAt(t, [[CUE.sit2, atCrib({ tilt: .2 })], [CUE.sit2 + .4, chairP({ tilt: .6 * doze, lean: .2 * doze })]]);
  } else if (t < CUE.lapse) {
    p = poseAt(t, [[CUE.cry3, chairP({ tilt: .6, lean: .2 })], [CUE.up3, chairP({ tilt: -.2 })], [CUE.up3 + .3, atCrib({ tilt: .25, lean: .12 })], [8.8, atCrib({ tilt: .55, lean: .2 })]]);
  } else {
    // pasan los años: sentada en la silla, envejece
    p = chairP({ lean: .1 + .25 * age, tilt: .1 + .2 * age });
    p.arms = [{ ang: .7, bend: .5 }, { ang: .6, bend: .5 }];
    return { p, age, rockHand: null };
  }
  // manos: mecer la cuna / arropar / frotarse los ojos
  const sh = E.shoulderOf(p);
  const atC = (t > CUE.atCrib1 - .1 && t < CUE.sit1 + .2) || (t > CUE.up2 + .2 && t < CUE.sit2 + .1) || (t > CUE.up3 + .2 && t < CUE.lapse);
  if (atC) {
    const r = rail(0);
    p.arms = [{ target: r }, { target: { x: r.x + 22, y: r.y + 4 } }];
    const tuck = E.bump(t, CUE.tuck1, CUE.tuck1 + .9);
    if (tuck > 0) p.arms[1] = { target: { x: lerp(r.x + 22, CX + 6, tuck), y: lerp(r.y + 4, MAT - 14, tuck) } };
    const rub = E.bump(t, 6.0, 6.7);
    if (rub > 0) { const h = solve(p).head; p.arms[1] = { target: { x: lerp(r.x + 22, h.x + 8, rub), y: lerp(r.y, h.y + 6 + Math.sin(t * 20) * 2, rub) }, elbowUp: false }; }
    if (t > 8.3) p.arms[1] = { target: { x: r.x + 8, y: r.y - 6 } };
  } else if (t > CUE.sit1 + .2 && t < CUE.lapse) {
    // dormida en la silla, una mano sobre la cuna
    const r = rail(6);
    p.arms = [{ target: { x: r.x + 6, y: r.y } }, { ang: .6, bend: .6 }];
  }
  return { p, age };
}
function babyPose(t) {
  const c = crying(t), kick = Math.sin(t * 16) * c;
  const p = lie(500, { s: .4, dir: -1, y: MAT - 1 });
  p.tilt = -.2 - .2 * c;
  p.arms = [{ ang: Math.PI / 2 + .9 + kick * .5 + .6 * c, bend: .3 }, { ang: Math.PI / 2 + .6 - kick * .5 + .6 * c, bend: .3 }];
  p.feet = p.feet.map((f, i) => ({ x: f.x, y: f.y - Math.abs(Math.sin(t * 14 + i)) * 8 * c }));
  return p;
}

// ── ACTO 3: el hijo ──
function son(t) {
  const chairS = (o = {}) => sit(CHX, { dir: 1, lean: .12 + (o.lean || 0), tilt: .25 + (o.tilt || 0) });
  const sleep = chairS({ tilt: .45, lean: .15 });
  const jolt = chairS({ tilt: -.25, lean: -.08 });
  const standS = stand(CHX + 30, { dir: 1, lean: .2, tilt: .4 });
  const tuck = stand(530, { dir: 1, lean: .55, tilt: .55, t }); tuck.feet = [{ x: 542, y: FLOOR }, { x: 516, y: FLOOR }];
  const tuck2 = stand(600, { dir: 1, lean: .6, tilt: .6, t }); tuck2.feet = [{ x: 610, y: FLOOR }, { x: 586, y: FLOOR }];
  const back = chairS({ lean: .3, tilt: .35 });
  const kiss = chairS({ lean: .62, tilt: .5 });
  let p = poseAt(t, [[CUE.cough + .2, sleep], [CUE.wake3 + .2, jolt], [CUE.up3b, standS], [CUE.tuck3, tuck2], [CUE.tuck3 + .35, tuck2], [CUE.tuckEnd, tuck], [CUE.sit3 + .4, back], [CUE.kiss, back], [CUE.kiss + .6, kiss], [CUE.kiss + 1.6, kiss], [CUE.kiss + 2.2, back]]);
  if (t < CUE.cough + .2) { p = { ...sleep }; p.tilt = .45 + Math.sin(t * 2) * .03; }
  return p;
}
const LIE_O = () => { const p = lie(582, { dir: -1, y: FLOOR - 64, s: .93 }); p.tilt = 0; return p; };
function oldMom(t) {
  const p = LIE_O();
  const c = E.bump(t, CUE.cough, CUE.cough + 1.0);
  p.hip.y -= Math.abs(Math.sin(t * 22)) * 3 * c;
  p.tilt = -.05 - .25 * smooth(prog(t, CUE.look, CUE.look + .5));
  return p;
}
const BL3 = t => lerp(668, 512, easeInOut(prog(t, CUE.tuck3 + .2, CUE.tuckEnd - .1)));

function act3(t, refl) {
  const s = son(t), m = oldMom(t);
  const ms = solve({ ...m, arms: [] }), ss = solve({ ...s, arms: [] });
  // brazos
  const take = smooth(prog(t, CUE.hand - .4, CUE.hand));
  const hp = E.holdPoint(ss.sh, E.ARM * .97, ms.sh, E.ARM * .93); hp.y = Math.max(hp.y, FLOOR - 70);
  const kissT = E.bump(t, CUE.kiss, CUE.kiss + 2.2);
  m.arms = [{ target: { x: lerp(ms.sh.x + 40, hp.x, take), y: lerp(FLOOR - 58, hp.y, take) } }, { ang: Math.PI / 2 + .2, bend: .1 }];
  if (t > CUE.cough && t < CUE.cough + 1) m.arms[0] = { target: { x: ms.head.x + 12, y: ms.head.y + 18 } };
  const bx = BL3(t);
  if (t > CUE.up3b - .1 && t < CUE.tuckEnd + .2) {
    const g = { x: bx + 4, y: FLOOR - 74 };
    s.arms = [{ target: g }, { target: { x: g.x + 14, y: g.y + 2 } }];
  } else if (t >= CUE.tuckEnd + .2) {
    s.arms = [{ target: { x: lerp(ss.sh.x + 40, hp.x + 2, take), y: lerp(ss.sh.y + 70, hp.y - 3, take) } }, { target: { x: lerp(ss.sh.x + 30, hp.x + 8, take), y: lerp(ss.sh.y + 75, hp.y + 4, take) } }];
  } else s.arms = [{ ang: .5, bend: .6 }, { ang: .4, bend: .6 }];
  const shake = E.bump(t, CUE.wake3, CUE.wake3 + .25);
  bed(BED_R[0], BED_R[1], 1, true);
  chair(CHX, 1);
  const msl = figure(m, mixStyle(STYLE.hero, STYLE.gray, .7));
  blanket(bx, 682, FLOOR - 68, 13);
  const ssl = figure(s, STYLE.hero);
  if (!refl) {
    waves(msl.head.x, msl.head.y - 24, t, E.bump(t, CUE.cough, CUE.cough + 1.0) * .8);
    if (t > CUE.hand) {
      const hh = smooth(prog(t, CUE.heart, CUE.heart + .8));
      glowCircle(hp.x, hp.y, 70, '255,60,50', .35 * hh);
      ring(hp.x, hp.y, t, CUE.hand + .05, { r: 120, color: '255,90,80', life: .9 });
      heart(hp.x + 4, hp.y - 100 - 6 * Math.sin(t * 2.2), 36 * E.backOut(hh) * (1 + .05 * Math.sin(t * 6)), '#ff3b36', hh, 35);
      burst(hp.x, hp.y - 100, t, CUE.heart + .1, { n: 26, speed: 180, size: 3, color: '255,140,120', life: 1.2, gravity: .1 });
    }
  }
}

const CAM = {
  zoom: [[0, 1.95], [1.0, 1.75], [2.2, 1.95], [3.6, 2.05], [4.6, 1.75], [5.6, 1.95], [7.4, 1.8], [8.6, 2.0], [CUE.lapse, 1.6], [CUE.lapseEnd, 1.65], [CUE.act3, 1.7], [CUE.wake3, 1.85], [CUE.tuck3, 1.9], [CUE.hand, 2.1], [CUE.kiss + 1.5, 2.35], [D, 2.05]],
  x: [[0, 330], [1.0, 360], [2.2, 440], [4.6, 400], [5.6, 430], [7.4, 410], [8.6, 445], [CUE.lapse, 380], [CUE.lapseEnd, 380], [CUE.act3, 470], [CUE.tuck3, 520], [CUE.hand, 450], [D, 450]],
  y: [[0, FLOOR - 160], [2.2, FLOOR - 175], [4.6, FLOOR - 185], [CUE.lapse, FLOOR - 205], [CUE.act3, FLOOR - 185], [CUE.hand, FLOOR - 150], [CUE.kiss + 1.5, FLOOR - 140], [D, FLOOR - 165]],
};

window.SCENE = {
  id: '46-ella-velaba', title: 'Mientras dormías, *ella velaba*', duration: D, cue: CUE,
  spot: t => ({ x: t < CUE.act3 ? 400 : 440, r: 330, a: .07 }),
  beam: t => ({ x: t < CUE.act3 ? 430 : 470, a: .035 + .05 * smooth(prog(t, CUE.heart, CUE.heart + 1)), w: 150 }),
  sky: t => .25 * smooth(prog(t, CUE.heart, CUE.heart + 1.5)),
  blackouts: [CUE.jump1, CUE.jump2],
  flashes: [],
  camera: t => ({ zoom: keyed(CAM.zoom, t), x: keyed(CAM.x, t), y: keyed(CAM.y, t), shake: .12 * E.pulse(t, CUE.wake3 + .05, .2) + .12 * E.pulse(t, CUE.wake1 + .1, .2) }),
  backdrop(t) { sky(t); },
  world(t, refl) {
    // transición entre actos: fundido propio
    if (t < CUE.act3) {
      const m = mother(t);
      const lapseA = smooth(prog(t, CUE.lapse, CUE.lapse + .5));
      bed(BED_L[0], BED_L[1], 1, true);
      if (t > CUE.sit1 - .2) chair(CHX, 1);
      // cuna con bebé (se desvanece al pasar los años)
      crib(t, 1 - lapseA, false, () => { babyFig(babyPose(t), STYLE.hero, { noShadow: true }); blanket(lerp(536, 492, easeInOut(prog(t, CUE.tuck1, CUE.tuck1 + .7))), 540, MAT - 6, 8); });
      // el niño que crece donde estaba la cuna
      if (lapseA > 0) {
        const g = smooth(prog(t, CUE.lapse + .2, CUE.lapseEnd - .3));
        const k = stand(492, { s: lerp(.42, 1, g), dir: -1, t, tilt: lerp(.1, -.05, g) });
        figure(k, STYLE.hero, { alpha: lapseA });
      }
      const sl = figure(m.p, mixStyle(STYLE.hero, STYLE.gray, .15 + .6 * (m.age || 0)));
      crib(t, 1 - lapseA, true);
      if (!refl) {
        const bh = { x: 470, y: MAT - 18 };
        waves(bh.x, bh.y - 12, t, crying(t) * (1 - lapseA));
        if (t > CUE.calm1 && t < CUE.sit1 + .5) {
          const hp = E.bump(t, CUE.calm1, CUE.sit1 + .5);
          heart(CX - 6, RAIL - 40 - (t - CUE.calm1) * 14, 18, '#ff3b36', hp, 20);
        }
      }
    } else act3(t, refl);
  },
  front(t) {
    const f = Math.max(E.bump(t, CUE.lapseEnd - .1, CUE.act3 + .35), .0);
    if (f > 0) { ctx.fillStyle = `rgba(0,0,0,${f})`; ctx.fillRect(-1000, -1000, 3000, 3000); }
  },
  events() {
    const cry = (t0, n) => Array.from({ length: n }, (_, i) => ({ t: t0 + i * .42, type: 'bell', note: i % 2 ? 81 : 84, vol: .22 }));
    const ev = [
      ...cry(CUE.cry1, 6), ...cry(CUE.cry2, 3), ...cry(CUE.cry3, 2),
      { t: 0, type: 'whoosh', dur: .5, vol: .5 }, { t: CUE.wake1 + .05, type: 'heartbeat', vol: .5 },
      { t: CUE.up1 + .4, type: 'step', size: .9 }, { t: CUE.up1 + .75, type: 'step', size: .9 }, { t: 1.95, type: 'step', size: .9 },
      { t: CUE.tuck1 + .2, type: 'swell', dur: 1.2, vol: .5 }, { t: CUE.calm1, type: 'chime', vol: .5 },
      { t: CUE.jump1, type: 'tick' }, { t: CUE.jump2, type: 'tick' },
      { t: CUE.lapse, type: 'clock', dur: CUE.lapseEnd - CUE.lapse }, { t: CUE.lapse + .1, type: 'riser', dur: 2.2 },
      { t: CUE.cough, type: 'heartbeat', vol: .8 }, { t: CUE.cough + .5, type: 'heartbeat', vol: .6 },
      { t: CUE.wake3 + .05, type: 'whoosh', dur: .3, vol: .4 },
      { t: CUE.tuck3 + .2, type: 'slide', dur: .8, vol: .5 },
      { t: CUE.hand, type: 'chime' }, { t: CUE.heart, type: 'sparkle' }, { t: CUE.kiss + .5, type: 'kiss', vol: .7 },
    ];
    return ev;
  },
  music: {
    sections: [
      { t: .1, dur: CUE.lapse - .1, style: 'tender', chords: ['Am', 'F', 'C', 'G'], chordLen: 1.4, vol: .75 },
      { t: CUE.lapse, dur: CUE.lapseEnd - CUE.lapse, style: 'build', chords: ['Am', 'F', 'C', 'G'], chordLen: .6 },
      { t: CUE.act3, dur: CUE.hand - CUE.act3, style: 'sad', chords: ['Am', 'F', 'C', 'G'], chordLen: 1.2 },
      { t: CUE.hand - .05, dur: D - CUE.hand, style: 'hope', chords: ['F', 'C', 'G', 'Am'], chordLen: 1.6 },
    ],
    stingers: [{ t: CUE.lapseEnd, type: 'impact' }, { t: CUE.heart, type: 'bells' }],
    duck: [[CUE.lapseEnd, CUE.act3 + .3]],
  },
};
})();
