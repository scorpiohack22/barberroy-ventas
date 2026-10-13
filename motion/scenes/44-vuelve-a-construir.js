// 44 — VUELVE A CONSTRUIR: construye su castillo de ladrillos en la orilla y le pone su bandera roja.
// Una ola oscura lo derrumba todo. Se sienta, vencido. Un niño se acerca y le ofrece un ladrillo.
// Se levanta y juntos construyen uno más grande; el niño, en brazos, planta la bandera. Amanece.
(() => {
const { FLOOR, clamp, lerp, prog, smooth, easeOut, easeIn, easeInOut, keyed, solve, figure, STYLE, stand, walk, crouch, sit, mix, poseAt, heart, burst, ring, rays, glowCircle, sun, brick, rng, flag, ctx } = E;
const D = 19;
const BW = 31, BH = 20;
const CUE = { built: 3.25, flag1: 3.5, rumble: 4.4, rise: 4.9, crash: 5.85, recede: 6.8, sit: 6.3, kid: 8.6, kidStop: 9.9, look: 10.25, take: 10.75, up: 11.1,
  build2: 11.9, built2: 14.8, lift: 14.9, flag2: 15.55, dawn: 13.2 };
const HX = 262, PILE = 196;

function castle(x0, cols, rows, towers) {
  const out = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) out.push({ x: x0 + c * BW, y: FLOOR - (r + 1) * BH, c, r });
  for (const [c, extra] of towers) for (let r = rows; r < rows + extra; r++) out.push({ x: x0 + c * BW, y: FLOOR - (r + 1) * BH, c, r, tw: true });
  out.sort((a, b) => a.r - b.r || a.c - b.c);
  return out;
}
const C1 = castle(300, 4, 3, [[0, 2], [3, 2]]);
C1.forEach((b, i) => { b.t = .25 + i * (CUE.built - .25) / C1.length; });
const C2 = castle(296, 6, 6, [[0, 3], [2, 4], [3, 4], [5, 3]]);
C2.forEach((b, i) => { b.t = CUE.build2 + i * (CUE.built2 - CUE.build2) / C2.length; });
// destino de cada ladrillo tras la ola
const SCAT = (() => { const g = rng(17); return C1.map(b => ({ dx: -40 - g() * 170 - b.r * 18, rot: (g() - .5) * 2.4, d: g() * .2 + b.r * .03 })); })();

function brickAt(b, t, src) {
  // vuela desde la mano/montón hasta su lugar
  const p = clamp((t - b.t) / .22);
  if (p <= 0) return null;
  const e = easeOut(p);
  return { x: lerp(src.x, b.x, e), y: lerp(src.y, b.y, e) - Math.sin(Math.PI * p) * 26, rot: (1 - e) * .6, land: p >= 1 };
}
function drawBrick(x, y, rot, lit) {
  ctx.save(); ctx.translate(x + BW / 2, y + BH / 2); ctx.rotate(rot); brick(-BW / 2, -BH / 2, BW, BH, lit); ctx.restore();
}

// ── la ola ──
const waveH = t => keyed([[CUE.rumble, 0], [CUE.rise, 30], [CUE.crash - .3, 250], [CUE.crash + .2, 200], [CUE.recede, 30], [CUE.recede + 1.2, 0]], t);
const waveX = t => keyed([[CUE.rumble, 720], [CUE.rise, 640], [CUE.crash - .2, 470], [CUE.crash + .35, 240], [CUE.recede, 330], [CUE.recede + 1.2, 640]], t);
function sea(t) {
  // mar en calma a la derecha
  ctx.save();
  const x0 = 560;
  const g = ctx.createLinearGradient(0, FLOOR - 30, 0, FLOOR + 40);
  g.addColorStop(0, '#26303b'); g.addColorStop(1, '#0b0f14');
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x0, FLOOR + 2);
  for (let x = x0; x <= 1300; x += 10) ctx.lineTo(x, FLOOR - 10 - Math.sin(x * .05 + t * 2.4) * 3 - clamp((x - x0) / 60) * 6);
  ctx.lineTo(1300, FLOOR + 60); ctx.lineTo(x0, FLOOR + 60); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(170,195,215,.35)'; ctx.lineWidth = 2; ctx.beginPath();
  for (let x = x0; x <= 1300; x += 10) ctx.lineTo(x, FLOOR - 10 - Math.sin(x * .05 + t * 2.4) * 3 - clamp((x - x0) / 60) * 6);
  ctx.stroke();
  ctx.restore();
}
function wave(t) {
  const h = waveH(t); if (h <= 1) return;
  const xc = waveX(t), curl = smooth(prog(t, CUE.crash - .7, CUE.crash)) * (1 - smooth(prog(t, CUE.crash + .1, CUE.recede)));
  ctx.save();
  const g = ctx.createLinearGradient(0, FLOOR - h, 0, FLOOR);
  g.addColorStop(0, '#3a4a5a'); g.addColorStop(.5, '#1d2732'); g.addColorStop(1, '#0c1117');
  ctx.fillStyle = g; ctx.shadowColor = 'rgba(120,160,200,.3)'; ctx.shadowBlur = 30;
  ctx.beginPath(); ctx.moveTo(1300, FLOOR + 4); ctx.lineTo(1300, FLOOR - h * .55);
  ctx.bezierCurveTo(xc + 260, FLOOR - h * .6, xc + 120, FLOOR - h * 1.05, xc + 30 - 40 * curl, FLOOR - h);
  ctx.bezierCurveTo(xc - 40 - 60 * curl, FLOOR - h * (.98 - .1 * curl), xc - 70 * curl, FLOOR - h * (.75 - .2 * curl), xc - 20 * curl, FLOOR - h * (.6 - .25 * curl));
  ctx.bezierCurveTo(xc - 30, FLOOR - h * .35, xc - 60, FLOOR - h * .12, xc - 110, FLOOR + 4);
  ctx.closePath(); ctx.fill();
  // espuma
  ctx.shadowBlur = 0; ctx.strokeStyle = 'rgba(210,225,235,.65)'; ctx.lineWidth = 4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(xc + 120, FLOOR - h * 1.0); ctx.bezierCurveTo(xc + 60, FLOOR - h * 1.06, xc - 20 - 50 * curl, FLOOR - h * 1.0, xc - 50 * curl, FLOOR - h * (.75 - .2 * curl)); ctx.stroke();
  ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(200,215,230,.3)';
  for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.moveTo(xc + 40 + k * 60, FLOOR - h * (.9 - k * .15)); ctx.quadraticCurveTo(xc + 120 + k * 70, FLOOR - h * (.8 - k * .15), 1300, FLOOR - h * (.55 - k * .1)); ctx.stroke(); }
  ctx.restore();
}

// ── elenco ──
function builder(t) {
  // fase 1: construye (cada ladrillo: se agacha al montón y lo coloca)
  let p;
  const cur = (list) => { let b = null; for (const q of list) if (t >= q.t - .25) b = q; return b; };
  if (t < CUE.flag1 + .2) {
    const b = cur(C1) || C1[0];
    const ph = clamp((t - (b.t - .25)) / .45);
    const reachLow = 1 - Math.sin(Math.PI * clamp(ph * 1.3));
    p = stand(HX, { lean: .25 + .25 * reachLow * (b.r < 2 ? 1 : .4), tilt: .3, t });
    p.hip.y += 10 * reachLow;
    const sh = E.shoulderOf(p);
    p.arms = [{ target: { x: lerp(b.x + 6, sh.x + 30, reachLow * .4), y: lerp(b.y + 10, sh.y + 40, reachLow * .4) } }, { target: { x: b.x + 2, y: b.y + 14 } }];
    if (t > C1[C1.length - 1].t + .3) {
      // planta la bandera
      const f = E.bump(t, CUE.flag1 - .25, CUE.flag1 + .3);
      p.arms = [{ target: { x: 315, y: FLOOR - 100 - 30 * f } }, { ang: .2, bend: .3 }];
    }
  } else if (t < CUE.crash) {
    // admira: manos en la cadera, pecho afuera; luego ve la ola y se asusta
    const proud = stand(HX - 8, { lean: -.06, tilt: -.1, t });
    const sh = E.shoulderOf(proud);
    proud.arms = [{ target: { x: proud.hip.x + 18, y: proud.hip.y - 8 }, elbowBack: false }, { target: { x: proud.hip.x - 14, y: proud.hip.y - 6 } }];
    const fear = smooth(prog(t, CUE.rise + .3, CUE.crash - .3));
    const scared = stand(HX - 22, { lean: -.25, tilt: -.45 });
    scared.arms = [{ ang: 2.3, bend: 1.4 }, { ang: 2.0, bend: 1.6 }];
    p = mix(proud, scared, fear);
  } else {
    // derribado → sentado, vencido
    const knock = easeOut(prog(t, CUE.crash, CUE.sit));
    const sat = sit(222, { ground: true, lean: .35, tilt: .7, arms: [{ target: { x: 262, y: FLOOR - 40 } }, { target: { x: 258, y: FLOOR - 36 } }] });
    const fallP = stand(205, { lean: -.5, tilt: -.3 }); fallP.arms = [{ ang: 2.6, bend: .3 }, { ang: 2.3, bend: .3 }];
    if (t < CUE.sit + .4) p = poseAt(t, [[CUE.crash, (() => { const s = stand(HX - 22, { lean: -.25, tilt: -.45 }); s.arms = [{ ang: 2.3, bend: 1.4 }, { ang: 2.0, bend: 1.6 }]; return s; })()], [CUE.sit - .15, fallP], [CUE.sit + .4, sat]]);
    else {
      p = sat;
      p.hip.y += Math.sin(t * 2) * .8;
      // mira al niño por encima del hombro
      const look = smooth(prog(t, CUE.look, CUE.look + .35));
      if (look > 0) { p.tilt = lerp(.7, .1, look); p.lean = lerp(.35, .05, look); }
      if (look > .5) p.dir = -1, p.feet = [{ x: 222 + 70, y: FLOOR }, { x: 222 + 60, y: FLOOR }], p.lean = -.1, p.tilt = -.1;
      const take = smooth(prog(t, CUE.take - .3, CUE.take));
      if (take > 0) { const k = solve(kidPose(t)); const h = E.hand(k, 0); p.arms = [{ target: { x: lerp(260, h.x + 4, take), y: lerp(FLOOR - 40, h.y, take) } }, { target: { x: 250, y: FLOOR - 38 } }]; }
      if (t > CUE.take + .1) {
        // se levanta
        const st = stand(HX, { lean: .05, tilt: -.05, t });
        st.arms = [{ ang: .5, bend: .6 }, { ang: .2, bend: .4 }];
        p = poseAt(t, [[CUE.take + .1, { ...p, dir: 1, feet: [{ x: 292, y: FLOOR }, { x: 282, y: FLOOR }], lean: .3, tilt: .1 }], [CUE.up - .1, crouch(236, { amt: .9, tilt: .1 })], [CUE.up + .4, st]]);
      }
    }
    if (t >= CUE.build2 - .3) {
      const b = cur(C2) || C2[0];
      p = stand(HX, { lean: .18, tilt: lerp(.2, -.35, clamp((FLOOR - b.y) / 220)), t });
      const sh = E.shoulderOf(p);
      const hand = { x: b.x + 6, y: Math.max(b.y + 10, sh.y - 74) };
      p.arms = [{ target: hand }, { target: { x: sh.x + 10, y: sh.y + 44 } }];
      // eleva al niño para la bandera
      const lift = smooth(prog(t, CUE.lift, CUE.lift + .5));
      if (lift > 0) {
        p.tilt = lerp(p.tilt, -.5, lift); p.lean = lerp(p.lean, -.05, lift);
        const k = solve(kidPose(t));
        p.arms = [{ target: { x: k.hip.x + 2, y: k.hip.y - 6 }, elbowUp: lift > .5 }, { target: { x: k.hip.x - 6, y: k.hip.y - 2 }, elbowUp: lift > .5 }];
      }
    }
  }
  return p;
}
function kidPose(t) {
  const walkP = prog(t, CUE.kid, CUE.kidStop), x = lerp(-60, 168, easeOut(walkP));
  let p = walk(x, (x + 60) * 1.1, { s: .58, lean: .1, freeze: walkP >= 1 ? 1 : 0 });
  if (walkP >= 1) p = stand(168, { s: .58, t, tilt: .25, lean: .1 });
  const sh = E.shoulderOf(p);
  // ofrece el ladrillo
  const offer = smooth(prog(t, CUE.kidStop, CUE.kidStop + .4));
  p.arms = [{ target: { x: lerp(sh.x + 14, sh.x + 38, offer), y: lerp(sh.y + 34, sh.y + 6, offer) } }, { target: { x: sh.x + 10, y: sh.y + 34 } }];
  if (t > CUE.take + .2) p.arms = [{ ang: .3, bend: .4 }, { ang: .1, bend: .4 }];
  // pasa ladrillos desde el montón
  if (t > CUE.build2 - .3 && t < CUE.lift) {
    const k = stand(214, { s: .58, t, lean: .12, tilt: .1 });
    const ph = ((t - CUE.build2) * 3.3) % 1;
    const kh = E.shoulderOf(k);
    const pick = Math.sin(ph * Math.PI);
    k.lean = .12 + .5 * pick; k.hip.y += 8 * pick;
    k.arms = [{ target: { x: lerp(kh.x + 30, PILE + 8, pick), y: lerp(kh.y + 8, FLOOR - 16, pick) } }, { target: { x: lerp(kh.x + 26, PILE + 2, pick), y: lerp(kh.y + 12, FLOOR - 14, pick) } }];
    p = poseAt(t, [[CUE.build2 - .3, p], [CUE.build2, k]]);
    if (t > CUE.build2) p = k;
  }
  if (t >= CUE.lift) {
    // en brazos, alto, planta la bandera
    const lift = smooth(prog(t, CUE.lift, CUE.lift + .5));
    const b = builderShoulder(t);
    const hip = { x: lerp(214, b.x + 22, lift), y: lerp(FLOOR - 94 * .58, b.y - 56, lift) };
    p = { hip, s: .58, dir: 1, lean: .05, tilt: -.3, feet: [{ x: hip.x + 4, y: hip.y + 50 }, { x: hip.x - 8, y: hip.y + 48 }] };
    const plant = smooth(prog(t, CUE.flag2 - .4, CUE.flag2));
    p.arms = [{ target: { x: lerp(hip.x + 20, 312, plant), y: lerp(hip.y - 30, FLOOR - 186 - 26 * (1 - plant), plant) } }, { ang: 2.7 * smooth(prog(t, CUE.flag2 + .2, CUE.flag2 + .6)), bend: .1 }];
    p.noShadow = true;
  }
  return p;
}
function builderShoulder(t) { const p = stand(HX, { lean: -.05 }); return E.shoulderOf(p); }

const CAM = {
  zoom: [[0, 2.35], [1.5, 2.15], [CUE.flag1, 2.1], [CUE.rumble, 1.95], [CUE.crash - .4, 1.6], [CUE.crash + .3, 1.7], [CUE.recede, 1.85], [9.6, 2.3], [CUE.look, 2.25], [CUE.up + .4, 2.05], [CUE.build2 + 1, 1.8], [CUE.built2, 1.65], [CUE.flag2 + .4, 1.75], [D, 1.6]],
  x: [[0, 330], [CUE.flag1, 320], [CUE.rumble, 360], [CUE.crash - .4, 380], [CUE.crash + .3, 330], [CUE.recede, 300], [9.6, 250], [CUE.look, 235], [CUE.up + .4, 270], [CUE.build2 + 1, 330], [CUE.built2, 345], [D, 345]],
  y: [[0, FLOOR - 130], [CUE.flag1, FLOOR - 150], [CUE.crash - .4, FLOOR - 230], [CUE.crash + .3, FLOOR - 190], [CUE.recede, FLOOR - 140], [9.6, FLOOR - 100], [CUE.up + .4, FLOOR - 160], [CUE.built2, FLOOR - 230], [CUE.flag2, FLOOR - 245], [D, FLOOR - 250]],
};

window.SCENE = {
  id: '44-vuelve-a-construir', title: 'Vuelve a *construir*', duration: D, cue: CUE,
  spot: t => ({ x: keyed([[0, 340], [CUE.recede, 300], [CUE.build2, 360]], t), r: 360 }),
  beam: t => ({ x: 330, a: .05 + .06 * smooth(prog(t, CUE.flag2 - .2, CUE.flag2 + .6)), w: 190 }),
  sky: t => Math.max(.35 * (1 - smooth(prog(t, CUE.rumble, CUE.rise))), .9 * smooth(prog(t, CUE.dawn, CUE.flag2))),
  blackouts: [CUE.crash + .02],
  flashes: [CUE.flag2],
  camera: t => ({ zoom: keyed(CAM.zoom, t), x: keyed(CAM.x, t), y: keyed(CAM.y, t),
    shake: .25 * E.bump(t, CUE.rumble, CUE.crash) * .5 + .8 * E.pulse(t, CUE.crash + .05, .35) }),
  backdrop(t) {
    // sol: atardecer al inicio, amanecer al final
    const a0 = 1 - smooth(prog(t, CUE.rumble, CUE.rise + .3));
    if (a0 > 0) sun(520, FLOOR - 170 + 30 * prog(t, 0, CUE.rise), 34, a0);
    if (t > CUE.dawn) {
      const p = easeOut(prog(t, CUE.dawn, CUE.flag2 + .5));
      const sx = 400, sy = lerp(FLOOR + 40, FLOOR - 330, p);
      rays(sx, sy, t, smooth(prog(t, CUE.flag2 - .5, CUE.flag2 + .5)) * 1.2, '255,70,60', 18, 900);
      sun(sx, sy, lerp(40, 58, p));
    }
  },
  world(t, refl) {
    sea(t);
    // montón de ladrillos
    for (let i = 0; i < 5; i++) brick(PILE - 30 + (i % 3) * 22, FLOOR - BH * (1 + Math.floor(i / 3)), 31, 20, .75);
    // castillo 1 (y sus restos)
    const bSrc = { x: HX + 10, y: FLOOR - 120 };
    const after = t > CUE.crash - .05;
    C1.forEach((b, i) => {
      if (!after) { const q = brickAt(b, t, bSrc); if (q) drawBrick(q.x, q.y, q.rot, .9); return; }
      const s = SCAT[i], f = easeOut(prog(t, CUE.crash + s.d, CUE.crash + s.d + .7));
      const tx = b.x + s.dx, ty = FLOOR - BH;
      const x = lerp(b.x, tx, f), y = lerp(b.y, ty, Math.min(1, f * 1.4)) - Math.sin(Math.PI * clamp(f * 1.4)) * 30;
      drawBrick(x, y, s.rot * f, lerp(.9, .45, f));
    });
    // bandera 1: sobre la torre → arrastrada
    if (t > CUE.flag1 - .05) {
      if (!after) flag(312, FLOOR - 100 + 30 * (1 - smooth(prog(t, CUE.flag1 - .05, CUE.flag1 + .1))), t, '#ff3b36', .45);
      else {
        const f = easeOut(prog(t, CUE.crash, CUE.crash + .8));
        ctx.save(); ctx.translate(lerp(312, 150, f), lerp(FLOOR - 100, FLOOR - 4, f)); ctx.rotate(-1.4 * f); flag(0, 0, t * (1 - f), '#b8221f', .45); ctx.restore();
      }
    }
    // castillo 2 (más grande)
    if (t > CUE.build2 - .1) {
      const lit = lerp(.85, 1, smooth(prog(t, CUE.flag2, CUE.flag2 + .5)));
      C2.forEach(b => { const src = b.c >= 4 ? { x: 214, y: FLOOR - 90 } : bSrc; const q = brickAt(b, t, src); if (q) drawBrick(q.x, q.y, q.rot, lit); });
      if (t > CUE.flag2 - .05) flag(312, FLOOR - 180 + 26 * (1 - smooth(prog(t, CUE.flag2 - .05, CUE.flag2 + .12))), t, '#ff3b36', .6);
      if (!refl && t > CUE.flag2) {
        glowCircle(380, FLOOR - 120, 240, '255,190,120', .12 * smooth(prog(t, CUE.flag2, CUE.flag2 + 1)));
        burst(312, FLOOR - 240, t, CUE.flag2, { n: 44, speed: 300, size: 3.5, color: '255,210,120', life: 1.6, gravity: .5, seed: 4 });
        burst(312, FLOOR - 240, t, CUE.flag2 + .1, { n: 26, speed: 220, size: 4, color: '255,60,50', life: 1.4, gravity: .3, seed: 9 });
        ring(312, FLOOR - 240, t, CUE.flag2, { r: 260, color: '255,255,255', life: 1, width: 8 });
      }
    }
    // figuras
    const bp = builder(t);
    figure(bp, STYLE.hero);
    if (t > CUE.kid) {
      const kp = kidPose(t);
      const ksl = figure(kp, STYLE.hero, { noShadow: kp.noShadow });
      // el ladrillo que ofrece el niño (brilla)
      if (t < CUE.take + .1) {
        const h = E.hand(ksl, 0);
        if (!refl) glowCircle(h.x + 6, h.y - 4, 50, '255,210,140', .3 * smooth(prog(t, CUE.kidStop, CUE.kidStop + .5)));
        drawBrick(h.x - 10, h.y - 14, 0, 1);
      } else if (t < CUE.up) {
        const h = E.hand(solve(bp), 0); drawBrick(h.x - 10, h.y - 14, 0, 1);
      }
      if (!refl && t > CUE.flag2 + .4) {
        const hp = smooth(prog(t, CUE.flag2 + .4, CUE.flag2 + 1.1));
        heart(HX + 40, FLOOR - 330 - 6 * Math.sin(t * 2.5), 34 * E.backOut(hp), '#ff3b36', hp, 30);
      }
    }
    if (!refl) {
      // salpicadura de la ola
      burst(330, FLOOR - 120, t, CUE.crash, { n: 60, speed: 380, size: 4, color: '190,210,225', life: 1.2, gravity: 1.1, seed: 2 });
      burst(380, FLOOR - 40, t, CUE.crash + .1, { n: 40, speed: 260, size: 3, color: '160,185,205', life: 1, gravity: 1.2, seed: 6 });
      for (const b of C1) if (t < CUE.crash) ring(b.x + BW / 2, b.y + BH, t, b.t + .22, { r: 22, flat: .3, color: '255,255,255', life: .3, width: 2 });
      for (const b of C2.filter((_, i) => i % 3 === 0)) ring(b.x + BW / 2, b.y + BH, t, b.t + .22, { r: 26, flat: .3, color: '255,220,160', life: .35, width: 2 });
    }
    wave(t);
    // agua que se esparce por el piso y se retira
    const wl = E.bump(t, CUE.crash, CUE.recede + 1.2);
    if (wl > 0) {
      const x0 = lerp(700, 120, smooth(prog(t, CUE.crash, CUE.crash + .5))) + 560 * smooth(prog(t, CUE.recede - .3, CUE.recede + 1.2));
      ctx.fillStyle = `rgba(40,55,70,${.75 * wl})`; ctx.fillRect(x0, FLOOR - 6 * wl, 1300, 8 * wl);
    }
  },
  events() {
    const ev = [];
    for (const b of C1) ev.push({ t: b.t + .2, type: 'knock', vol: .45 });
    C2.forEach((b, i) => { if (i % 2 === 0) ev.push({ t: b.t + .2, type: 'knock', vol: .35 }); });
    return ev.concat([
      { t: 0, type: 'whoosh', dur: .4, vol: .5 }, { t: CUE.flag1, type: 'pop' }, { t: CUE.flag1 + .05, type: 'chime', vol: .5 },
      { t: CUE.rumble, type: 'rumble', dur: 1.6 }, { t: CUE.rise, type: 'wind', dur: 1.2, vol: .8 }, { t: CUE.crash - 1.1, type: 'riser', dur: 1.1 },
      { t: CUE.crash, type: 'boom' }, { t: CUE.crash, type: 'rain', dur: 1.2, vol: .9 }, { t: CUE.crash + .05, type: 'clatter' }, { t: CUE.crash + .1, type: 'wind', dur: 1.0, vol: .7 },
      { t: CUE.recede - .2, type: 'wind', dur: 1.8, vol: .4 },
      { t: CUE.sit + .4, type: 'heartbeat', vol: .6 }, { t: CUE.sit + 1.2, type: 'heartbeat', vol: .45 },
      ...Array.from({ length: 7 }, (_, i) => ({ t: CUE.kid + .1 + i * .19, type: 'step', size: .5, vol: .7 })),
      { t: CUE.kidStop + .2, type: 'chime' }, { t: CUE.take, type: 'swell', dur: 1.2, vol: .6 },
      { t: CUE.lift, type: 'riser', dur: .6 }, { t: CUE.flag2, type: 'impact' }, { t: CUE.flag2, type: 'sparkle' }, { t: CUE.flag2 + .1, type: 'cheer', dur: 2.2, vol: .5 },
    ]);
  },
  music: {
    sections: [
      { t: 0, dur: CUE.rumble, style: 'upbeat', chords: ['C', 'G', 'Am', 'F'], chordLen: 1.07, bpm: 112, vol: .7 },
      { t: CUE.rumble, dur: CUE.crash - CUE.rumble, style: 'tension', chords: ['Am'], chordLen: .75 },
      { t: CUE.recede, dur: CUE.take - CUE.recede, style: 'sad', chords: ['Am', 'F', 'C', 'G'], chordLen: 1.1 },
      { t: CUE.take, dur: CUE.flag2 - CUE.take, style: 'build', chords: ['F', 'G', 'Am', 'C'], chordLen: 1.1 },
      { t: CUE.flag2 - .05, dur: D - CUE.flag2, style: 'epic', chords: ['C', 'G', 'Am', 'F'], chordLen: 1.2 },
    ],
    stingers: [{ t: CUE.crash, type: 'impact' }, { t: CUE.flag2, type: 'bells' }],
    duck: [[CUE.crash + .3, CUE.recede]],
  },
};
})();
