// 04 — NO TE RINDAS A UN PASO: túnel en corte. Un minero pica y avanza; se cansa. El diamante rojo brilla
// detrás de la última roca (el espectador lo ve, él no). Se rinde, suelta el pico y se va.
// Otro toma el pico: un golpe y el diamante estalla en luz. El que se fue voltea… demasiado tarde.
(() => {
const { FLOOR, clamp, lerp, prog, smooth, easeOut, easeIn, easeInOut, bump, pulse, keyed, poseAt, walk, stand, crouch, sad, figure, STYLE, shoulderOf, ctx } = E;
const D = 20;
const FR = x => (Math.round(x * 30) + .5) / 30;
const CEIL = FLOOR - 255, F0 = 330, CW = 31, LAST = F0 + 4 * CW;   // la última columna empieza en LAST
const CH = { x: 548, y: FLOOR - 70, rx: 52, ry: 58 };              // cámara del diamante
const HITS = [.55, 1.75, 3.05, 4.6];                               // golpes que rompen columnas
const C = { weak: 7.3, drop: 8.35, turn: 8.95, aWalk: 9.1, aStop: 12.1, bIn: 9.3, bPick: 11.2, bUp: 11.75, wind: 12.15, hit: 12.85, toss: 13.6, step: 13.85, grab: 14.45, raise: 14.8, aLook: 13.25 };
const rgbv = c => c[0] === '#' ? [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16)) : c.match(/[\d.]+/g).slice(0, 3).map(Number);
const mixStyle = (a, b, p) => ({ near: E.mixCol(rgbv(a.near), rgbv(b.near), p), far: E.mixCol(rgbv(a.far), rgbv(b.far), p), glow: lerp(a.glow, b.glow, p), glowColor: a.glowColor });

// ── textura de roca (una vez, 2x) ──
const RX0 = -400, RY0 = 0, RW = 1600, RH = 920;
const rockTex = (() => {
  const c = document.createElement('canvas'); c.width = RW * 2; c.height = RH * 2;
  const g = c.getContext('2d'), r = E.rng(44); g.scale(2, 2);
  g.fillStyle = '#121110'; g.fillRect(0, 0, RW, RH);
  for (let i = 0; i < 1500; i++) {
    const x = r() * RW, y = r() * RH, s = 6 + r() * 22, v = 18 + r() * 26;
    g.fillStyle = `rgb(${v + 3},${v + 1},${v})`; g.beginPath();
    for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2, rr = s * (.7 + r() * .4); g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr * .75); }
    g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,255,255,.04)'; g.fillRect(x - s * .4, y - s * .45, s * .5, 2);
  }
  g.strokeStyle = 'rgba(0,0,0,.6)'; g.lineWidth = 1.2;
  for (let k = 0; k < 60; k++) { let x = r() * RW, y = r() * RH; g.beginPath(); g.moveTo(x, y); for (let j = 0; j < 6; j++) { x += (r() - .5) * 50; y += (r() - .5) * 40; g.lineTo(x, y); } g.stroke(); }
  return c;
})();
function rock(clipFn) { ctx.save(); ctx.beginPath(); clipFn(); ctx.clip(); ctx.drawImage(rockTex, RX0, RY0, RW, RH); ctx.restore(); }

// frente de roca: avanza con cada golpe
const breaks = t => HITS.reduce((n, h) => n + (t >= h ? 1 : 0), 0) + (t >= C.hit ? 1 : 0);
const face = t => F0 + CW * breaks(t);
const stepX = (t, x0) => x0 + CW * HITS.reduce((n, h) => n + smooth(prog(t, h + .3, h + .75)), 0);
const aX = t => stepX(t, F0 - 112);

// ── pico ──
const PL = 66;
function pickaxe(grip, th, a = 1) {
  const tip = { x: grip.x + Math.sin(th) * PL, y: grip.y - Math.cos(th) * PL }, bot = { x: grip.x - Math.sin(th) * 14, y: grip.y + Math.cos(th) * 14 };
  ctx.save(); ctx.globalAlpha *= a; ctx.lineCap = 'round';
  ctx.strokeStyle = '#8a6a48'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(bot.x, bot.y); ctx.lineTo(tip.x, tip.y); ctx.stroke();
  const nx = Math.cos(th), ny = Math.sin(th); // perpendicular
  ctx.strokeStyle = '#cfd3d6'; ctx.lineWidth = 6; ctx.shadowColor = 'rgba(255,255,255,.4)'; ctx.shadowBlur = 8;
  ctx.beginPath(); ctx.moveTo(tip.x - nx * 30 + Math.sin(th) * -8, tip.y - ny * 30 - Math.cos(th) * -8);
  ctx.quadraticCurveTo(tip.x + Math.sin(th) * 5, tip.y - Math.cos(th) * 5, tip.x + nx * 30 + Math.sin(th) * -8, tip.y + ny * 30 - Math.cos(th) * -8); ctx.stroke();
  ctx.restore();
  return { tip, head: { x: tip.x + nx * 30, y: tip.y + ny * 30 } };
}
// estado del golpe: th (ángulo del mango), grip relativo al hombro, inclinación
function swing(t, th0, power = 1) {
  const up = smooth(prog(t, th0 - .6 / power, th0 - .22)), down = easeIn(prog(t, th0 - .2, th0)), rec = smooth(prog(t, th0, th0 + .35));
  const raised = { th: -.75, gx: -6, gy: -50, lean: -.12 }, impact = { th: 1.95, gx: 46, gy: 24, lean: .38 }, rest = { th: 1.5, gx: 30, gy: 40, lean: .22 };
  let s = rest;
  const L = (a, b, p) => ({ th: lerp(a.th, b.th, p), gx: lerp(a.gx, b.gx, p), gy: lerp(a.gy, b.gy, p), lean: lerp(a.lean, b.lean, p) });
  if (t < th0) s = down > 0 ? L(raised, impact, down) : L(rest, raised, up);
  else s = L(impact, rest, rec);
  return s;
}
function miner(x, sw, o = {}) {
  const p = stand(x, { lean: sw.lean + (o.tired || 0) * .25, tilt: o.tilt ?? .05, t: o.t });
  if (o.tired) p.hip.y += 6 * o.tired;
  p.feet = [{ x: x + 24, y: FLOOR }, { x: x - 20, y: FLOOR }];
  const sh = shoulderOf(p), grip = { x: sh.x + sw.gx, y: sh.y + sw.gy };
  p.arms = [{ target: grip }, { target: { x: grip.x - Math.sin(sw.th) * 12, y: grip.y + Math.cos(sw.th) * 12 } }];
  p.grip = grip; p.th = sw.th;
  return p;
}
function helmet(sl, on = 1) {
  const r = sl.R.headR, h = sl.head, a = Math.atan2(h.y - sl.sh.y, h.x - sl.sh.x) + Math.PI / 2;
  ctx.save(); ctx.translate(h.x, h.y); ctx.rotate(a);
  ctx.fillStyle = '#d8b13a'; ctx.beginPath(); ctx.arc(0, -2, r + 3, Math.PI, 0); ctx.fill(); ctx.fillRect(-r - 7, -4, 2 * r + 14, 5);
  ctx.fillStyle = '#fff'; ctx.shadowColor = '#fff'; ctx.shadowBlur = 12 * on; ctx.beginPath(); ctx.arc(sl.dir * (r - 2), -r * .55, 4.5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  if (on > 0) { // haz de la linterna
    const lx = h.x + sl.dir * (r - 2), ly = h.y - r * .5, ang = a - Math.PI / 2 + (sl.dir === 1 ? .32 : Math.PI - .32);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(lx, ly); ctx.rotate(ang);
    const g = ctx.createLinearGradient(0, 0, 220, 0); g.addColorStop(0, `rgba(255,250,235,${.2 * on})`); g.addColorStop(1, 'rgba(255,250,235,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, -3); ctx.lineTo(220, -55); ctx.lineTo(220, 55); ctx.lineTo(0, 3); ctx.fill(); ctx.restore();
  }
}
function diamond(x, y, s, t, a = 1) {
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.scale(s, s);
  ctx.shadowColor = '#ff2a2a'; ctx.shadowBlur = 30;
  const top = -14, mid = -4, bot = 22, w = 22;
  ctx.fillStyle = '#ff3b36'; ctx.beginPath(); ctx.moveTo(-w, mid); ctx.lineTo(-w * .55, top); ctx.lineTo(w * .55, top); ctx.lineTo(w, mid); ctx.lineTo(0, bot); ctx.closePath(); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#ff8a7a'; ctx.beginPath(); ctx.moveTo(-w * .55, top); ctx.lineTo(0, mid); ctx.lineTo(w * .55, top); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#b81d1a'; ctx.beginPath(); ctx.moveTo(0, mid); ctx.lineTo(w, mid); ctx.lineTo(0, bot); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.beginPath(); ctx.moveTo(-w * .45, top + 2); ctx.lineTo(-w * .2, top + 2); ctx.lineTo(-w * .5, mid); ctx.closePath(); ctx.fill();
  const tw = Math.max(0, Math.sin(t * 3.1)) ** 8; // destello
  if (tw > .05) { ctx.fillStyle = `rgba(255,255,255,${tw})`; ctx.fillRect(-w * .5 - 8, top - 1, 16, 2); ctx.fillRect(-w * .5 - 1, top - 8, 2, 16); }
  ctx.restore();
}

// ── personajes ──
function poseA(t) {
  const x = aX(t);
  if (t < C.weak + .5) {
    let hit = HITS.find(h => t < h + .45) ?? C.weak; const prev = HITS.filter(h => h + .45 <= t).length;
    const tired = clamp(prev / 4) * .9 + .1 * smooth(prog(t, C.weak, C.weak + .4));
    const power = hit === C.weak ? .55 : lerp(1.2, .75, prev / 4);
    let sw = swing(t, hit, power);
    if (hit === C.weak) { sw = swing(t, C.weak, power); sw.th = Math.min(sw.th, 1.7); }
    // pausa de cansancio entre golpe 4 y el débil
    if (t > HITS[3] + .45 && t < C.weak - .9) sw = { th: 1.5, gx: 30, gy: 44, lean: .25 + .04 * Math.sin(t * 4) };
    const p = miner(x, sw, { tired, tilt: .05 + .25 * tired, t });
    if (t > HITS[3] + .45 && t < C.weak - .9) p.hip.y += 3 * Math.sin(t * 6); // respira agitado
    return p;
  }
  if (t < C.drop + .25) { // sin fuerzas: se apoya y suelta
    const sw = { th: lerp(1.6, 2.6, smooth(prog(t, C.weak + .5, C.drop))), gx: 26, gy: lerp(40, 70, smooth(prog(t, C.weak + .5, C.drop))), lean: .42 };
    const p = miner(x, sw, { tired: 1, tilt: .6 });
    return p;
  }
  // se queda mirando al piso, gira y se va (y se detiene; luego voltea)
  const slump = sad(x, { lean: .32, tilt: .65, t });
  if (t < C.turn) return E.mix(miner(x, { th: 2.6, gx: 26, gy: 70, lean: .42 }, { tired: 1, tilt: .6 }), slump, smooth(prog(t, C.drop + .25, C.drop + .7)));
  const v = 62, dd = v * clamp(t - C.aWalk, 0, C.aStop - C.aWalk);
  const wk = walk(x - dd, dd, { dir: -1, lean: .28, tilt: .55, stride: .75, freeze: t > C.aStop ? smooth(prog(t, C.aStop, C.aStop + .3)) : 0 });
  wk.arms = [{ ang: .02 + .1 * Math.sin(dd / 20), bend: .1 }, { ang: -.02, bend: .1 }];
  if (t < C.aWalk + .2) return E.mix(sad(x, { dir: -1, lean: .32, tilt: .65 }), wk, smooth(prog(t, C.aWalk, C.aWalk + .2)));
  if (t < C.aLook) return wk;
  // escucha el golpe: voltea, mira… y baja la cabeza
  const back = stand(x - dd, { dir: 1, lean: .02, tilt: -.1, t }); back.arms = [{ ang: .05, bend: .1 }, { ang: -.03, bend: .1 }];
  const regret = sad(x - dd, { dir: 1, lean: .3, tilt: .75 });
  return poseAt(t, [[C.aLook, wk], [C.aLook + .45, back], [16.2, back], [17.3, regret]]);
}
const aStyle = t => mixStyle(STYLE.hero, STYLE.gray, smooth(prog(t, C.turn, C.aStop)));
const PICK_FLOOR = () => ({ grip: { x: aX(C.drop) + 6, y: FLOOR - 5 }, th: Math.PI / 2 + .08 });
function pickDrop(t) { // cae del agarre al piso
  const a = poseA(C.drop), f = PICK_FLOOR(), p = easeIn(prog(t, C.drop, C.drop + .4));
  return { grip: { x: lerp(a.grip.x, f.grip.x, p), y: lerp(a.grip.y, f.grip.y, p) }, th: lerp(a.th, f.th, p) + .4 * Math.sin(Math.PI * p) };
}
function poseB(t) {
  if (t < C.bIn) return null;
  const xF = LAST - 112, x0 = 30;
  const xw = Math.min(xF - 30, x0 + 172 * (t - C.bIn));
  if (t < C.bPick) {
    const w = walk(xw, xw - x0, { lean: .1, tilt: lerp(-.05, .3, smooth(prog(t, C.bPick - .5, C.bPick))) });
    return w;
  }
  const pk = crouch(xF - 22, { amt: 1, tilt: .4 }), f = PICK_FLOOR();
  pk.arms = [{ target: f.grip }, { target: { x: f.grip.x + 10, y: f.grip.y } }];
  if (t < C.bUp) return E.mix(walk(xF - 30, xF - 30 - x0, { lean: .1 }), pk, smooth(prog(t, C.bPick, C.bPick + .3)));
  // se levanta con el pico, mira la roca, gran anticipación y GOLPE
  const sw = t < C.wind ? { th: lerp(Math.PI / 2, 1.5, smooth(prog(t, C.bUp, C.wind))), gx: 30, gy: 40, lean: .1 } : bigSwing(t);
  const xm = lerp(xF - 22, xF, smooth(prog(t, C.bUp, C.wind)));
  const m = miner(xm, sw, { tilt: t < C.wind ? -.1 : .05 });
  if (t < C.bUp + .35) { const k = smooth(prog(t, C.bUp, C.bUp + .35)); return { ...E.mix(pk, m, k), grip: m.grip, th: lerp(Math.PI / 2 + .08, m.th, k) }; }
  if (t < C.toss) {
    if (t > C.hit) { m.lean -= .3 * bump(t, C.hit, C.hit + .7); m.tilt = -.25; } // retrocede deslumbrado
    return m;
  }
  // tira el pico, entra a la cámara, toma el diamante y lo alza
  const st = stand(xF, { lean: -.05, tilt: -.2, t });
  const reach = stand(LAST + 8, { lean: .28, tilt: .05 }); reach.arms = [{ target: { x: CH.x - 6, y: CH.y + 6 } }, { ang: .4, bend: .4 }];
  const hold = stand(LAST + 6, { lean: .02, tilt: -.25, t }); hold.arms = [{ target: { x: LAST + 30, y: FLOOR - 150 } }, { ang: .3, bend: .4 }];
  const up = stand(LAST + 6, { lean: -.08, tilt: -.45, t }); up.arms = [{ ang: Math.PI - .25, bend: .05 }, { ang: Math.PI - .9, bend: .3 }];
  const jump = 26 * Math.max(0, Math.sin((t - C.raise - .6) * 7)) * clamp((t - C.raise - .6) * 9) * (1 - smooth(prog(t, 17, 17.6)));
  const p = poseAt(t, [[C.toss, st], [C.step, st], [C.grab, reach], [C.grab + .25, reach], [C.raise, hold], [C.raise + .45, up]]);
  if (t > C.step && t < C.grab) { const w = walk(lerp(xF, LAST + 8, prog(t, C.step, C.grab)), 120 * (t - C.step), { lean: .15 }); p.feet = w.feet; }
  p.hip.y -= jump; if (jump) p.feet.forEach(f => f.y -= jump);
  return p;
}
function bigSwing(t) {
  const up = easeOut(prog(t, C.wind, C.hit - .4)), down = easeIn(prog(t, C.hit - .3, C.hit)), rec = smooth(prog(t, C.hit, C.hit + .3));
  const raised = { th: -1.15, gx: -14, gy: -54, lean: -.24 }, impact = { th: 1.95, gx: 46, gy: 24, lean: .42 }, rest = { th: 1.5, gx: 30, gy: 40, lean: .1 };
  const L = (a, b, p) => ({ th: lerp(a.th, b.th, p), gx: lerp(a.gx, b.gx, p), gy: lerp(a.gy, b.gy, p), lean: lerp(a.lean, b.lean, p) });
  if (t < C.hit) return down > 0 ? L(raised, impact, down) : L(rest, raised, up);
  return L(impact, rest, rec);
}

// ── escombros ──
function debris(t) {
  const all = HITS.map((h, i) => [h, F0 + i * CW, 1]).concat([[C.hit, LAST, 2]]);
  for (const [h, x0, big] of all) {
    const dt = t - h; if (dt < 0) continue;
    const r = E.rng(31 + x0);
    for (let i = 0; i < 9 * big; i++) {
      const sx = x0 + r() * CW, sy = CEIL + 40 + r() * (FLOOR - CEIL - 50), vx = -(30 + r() * 120) * big, vy = -r() * 80 * big, sz = 5 + r() * 8;
      let x = sx + vx * Math.min(dt, 1.1), y = sy + vy * dt + 700 * dt * dt;
      const rest = FLOOR - sz * .5 - r() * 4;
      if (y > rest) y = rest;
      const seed = 3 + i;
      E.stone(x, y, sz, seed, '#3b3835');
    }
  }
}
function cracks(t) {
  const k = smooth(prog(t, C.weak, C.weak + .15));
  if (k <= 0 || t > C.hit) return;
  const r = E.rng(12), pu = .55 + .45 * Math.sin(t * 5);
  ctx.save(); ctx.strokeStyle = `rgba(255,60,45,${.85 * k * pu})`; ctx.shadowColor = '#ff2a2a'; ctx.shadowBlur = 14; ctx.lineWidth = 2;
  for (let c = 0; c < 6; c++) {
    let x = LAST + 2, y = FLOOR - 160 + c * 24 + r() * 10; ctx.beginPath(); ctx.moveTo(x, y);
    for (let j = 0; j < 5; j++) { x += 4 + r() * 6; y += (r() - .5) * 18; ctx.lineTo(Math.min(x, LAST + CW), y); }
    ctx.stroke();
  }
  ctx.restore();
}

const SHOTS = [
  [0, { x: F0 - 30, y: FLOOR - 150, z: 2.65 }, { x: F0 - 20, y: FLOOR - 150, z: 2.5 }],
  [FR(1.25), { x: F0 - 10, y: FLOOR - 170, z: 2.0 }, { x: F0 + 40, y: FLOOR - 170, z: 2.05 }],
  [FR(3.0), { x: F0 + 20, y: FLOOR - 175, z: 2.55 }, { x: F0 + 35, y: FLOOR - 175, z: 2.65 }],
  [FR(4.15), { x: F0 + 70, y: FLOOR - 170, z: 2.05 }, { x: F0 + 80, y: FLOOR - 170, z: 2.1 }],
  [FR(5.25), { x: F0 + 60, y: FLOOR - 165, z: 2.1 }, { x: CH.x - 20, y: FLOOR - 130, z: 2.45 }],
  [FR(7.0), { x: LAST - 40, y: FLOOR - 150, z: 2.3 }, { x: LAST - 20, y: FLOOR - 145, z: 2.4 }],
  [FR(8.15), { x: LAST - 70, y: FLOOR - 95, z: 2.7 }, { x: LAST - 75, y: FLOOR - 100, z: 2.75 }],
  [FR(9.25), { x: 300, y: FLOOR - 200, z: 1.6 }, { x: 290, y: FLOOR - 190, z: 1.7 }],
  [FR(11.1), { x: LAST - 90, y: FLOOR - 140, z: 2.3 }, { x: LAST - 70, y: FLOOR - 150, z: 2.35 }],
  [FR(12.1), { x: LAST - 50, y: FLOOR - 165, z: 2.2 }, { x: LAST - 30, y: FLOOR - 160, z: 2.6 }],
  [FR(12.85), { x: LAST + 10, y: FLOOR - 160, z: 2.0 }, { x: LAST + 10, y: FLOOR - 165, z: 1.95 }],
  [FR(14.4), { x: LAST + 20, y: FLOOR - 185, z: 2.3 }, { x: LAST + 20, y: FLOOR - 195, z: 2.4 }],
  [FR(16.0), { x: LAST - 20, y: FLOOR - 190, z: 2.0 }, { x: 330, y: FLOOR - 215, z: 1.38 }],
];
function shotCam(t) {
  let i = SHOTS.length - 1; while (i > 0 && t < SHOTS[i][0]) i--;
  const [t0, a, b] = SHOTS[i], t1 = i + 1 < SHOTS.length ? SHOTS[i + 1][0] : D;
  const p = smooth(prog(t, t0, t1));
  let sh = Math.max(...HITS.map(h => pulse(t, h + .02, .18) * .45), pulse(t, C.hit + .02, .45) * 1.4, pulse(t, C.weak, .12) * .15);
  return { x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p), zoom: lerp(a.z, b.z, p), shake: sh };
}
const revealed = t => smooth(prog(t, C.hit, C.hit + .5));

window.SCENE = {
  id: '04-a-un-paso', title: 'No te rindas *a un paso*', duration: D, cue: C,
  sky: () => 0,
  spot: t => ({ x: lerp(aX(t) + 40, LAST, smooth(prog(t, C.hit, C.hit + 1))), r: 340, a: .07 + .05 * revealed(t) }),
  beam: false,
  flashes: [C.hit + .02],
  blackouts: [FR(9.25) - 1 / 60],
  camera: shotCam,
  backdrop(t) {},
  world(t, refl) {
    const F = face(t);
    // roca: techo y frente (con la cámara del diamante)
    rock(() => { ctx.rect(RX0, RY0, RW, CEIL - RY0); });
    rock(() => {
      ctx.rect(F, CEIL - 1, 2000, FLOOR - CEIL + 1);
      if (t < C.hit) { ctx.moveTo(CH.x + CH.rx, CH.y); ctx.ellipse(CH.x, CH.y, CH.rx, CH.ry, 0, 0, Math.PI * 2, true); }
      else { ctx.moveTo(CH.x + CH.rx, CH.y); ctx.ellipse(CH.x, CH.y, CH.rx, CH.ry, 0, 0, Math.PI * 2, true); }
    });
    // bordes iluminados
    ctx.save(); ctx.strokeStyle = 'rgba(160,150,140,.35)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-500, CEIL); ctx.lineTo(F, CEIL); ctx.lineTo(F, FLOOR); ctx.stroke(); ctx.restore();
    // cámara del diamante
    const glow = .55 + .45 * Math.sin(t * 3) ** 2;
    ctx.save(); ctx.beginPath(); ctx.ellipse(CH.x, CH.y, CH.rx, CH.ry, 0, 0, Math.PI * 2); ctx.clip();
    const g = ctx.createRadialGradient(CH.x, CH.y, 4, CH.x, CH.y, CH.rx * 1.2);
    g.addColorStop(0, `rgba(120,10,10,${.5 * glow + .4 * revealed(t)})`); g.addColorStop(1, 'rgba(20,0,0,1)');
    ctx.fillStyle = g; ctx.fillRect(CH.x - 80, CH.y - 80, 160, 160); ctx.restore();
    ctx.save(); ctx.strokeStyle = `rgba(255,60,45,${.35 * glow})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(CH.x, CH.y, CH.rx, CH.ry, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    const b = poseB(t);
    const held = t > C.grab + .1;
    if (!held && !refl) {
      E.glowCircle(CH.x, CH.y, 90, '255,40,30', .25 * glow + .3 * revealed(t));
      diamond(CH.x, CH.y + 4, 1, t);
    }
    if (!refl) cracks(t);
    if (!refl) debris(t);
    // haz de luz roja al romperse
    if (!refl && t > C.hit) E.rays(CH.x, CH.y, t, revealed(t) * (held ? .4 : 1) * (1 - smooth(prog(t, D - 1, D))), '255,60,50', 16, 700);
    // A
    const a = poseA(t), aSl = figure(a, aStyle(t));
    helmet(aSl, refl ? 0 : 1 - smooth(prog(t, C.drop, C.aStop)));
    if (t < C.drop) pickaxe(a.grip, a.th);
    else if (!b || t < C.bUp) { const pd = pickDrop(t); pickaxe(pd.grip, pd.th); }
    // B
    if (b) {
      const bSl = figure(b, STYLE.hero);
      helmet(bSl, refl ? 0 : 1);
      if (t >= C.bUp && t < C.toss) pickaxe(b.grip, b.th);
      if (t >= C.toss) { const k = easeIn(prog(t, C.toss, C.toss + .35)); pickaxe({ x: LAST - 70 - 30 * k, y: lerp(FLOOR - 140, FLOOR - 5, k) }, lerp(1.4, Math.PI / 2 + .1, k)); }
      if (held) {
        const hp = E.hand(bSl, 0);
        if (!refl) { E.glowCircle(hp.x, hp.y - 18, 130, '255,40,30', .45); E.rays(hp.x, hp.y - 18, t, smooth(prog(t, C.raise, C.raise + .6)) * (1 - smooth(prog(t, D - 1, D))), '255,70,55', 14, 600); }
        diamond(hp.x, hp.y - 18, 1.05, t);
      }
    }
    if (refl) return;
    // chispas de cada golpe
    HITS.forEach((h, i) => { E.burst(F0 + i * CW, FLOOR - 128, t, h, { n: 22, color: '255,220,160', speed: 300, life: .5, size: 2.4, seed: 5 + i }); });
    E.burst(LAST, FLOOR - 128, t, C.weak, { n: 8, color: '255,210,150', speed: 160, life: .35, size: 2, seed: 2 });
    E.burst(LAST + 10, FLOOR - 128, t, C.hit, { n: 60, color: '255,90,70', speed: 520, life: 1.2, size: 3.6, seed: 8 });
    E.ring(CH.x, CH.y, t, C.hit + .05, { r: 300, life: 1.1, width: 10, color: '255,70,55' });
    E.ring(CH.x, CH.y, t, C.raise + .45, { r: 200, life: 1, width: 6, color: '255,90,70' });
    E.burst(CH.x - 30, FLOOR - 240, t, C.raise + .45, { n: 40, color: '255,80,60', speed: 300, life: 1.6, size: 3, gravity: .6, seed: 21 });
  },
  events() {
    const ev = E.footsteps(D, t => {
      const a = poseA(t), b = poseB(t);
      return [t > C.aWalk && t < C.aStop ? { phi: a.phi || 0, size: .9, vol: .6 } : null, b && t < C.bPick ? { phi: b.phi || 0 } : null];
    });
    return ev.concat(
      HITS.map((h, i) => ({ t: h, type: 'clatter', vol: .9 - i * .1 })), HITS.map(h => ({ t: h + .02, type: 'crack', vol: .6 })), HITS.map(h => ({ t: h + .3, type: 'rumble', dur: .6, vol: .4 })),
      HITS.map(h => ({ t: h - .2, type: 'whoosh', dur: .25, vol: .35 })),
      [
        { t: 0.0, type: 'impact', vol: .5 },
        { t: 5.4, type: 'heartbeat', vol: .7 }, { t: 6.1, type: 'heartbeat', vol: .7 }, { t: 6.8, type: 'heartbeat', vol: .7 },
        { t: C.weak, type: 'tick', vol: .8 }, { t: C.weak + .05, type: 'crack', vol: .3 },
        { t: C.drop + .4, type: 'clatter', vol: 1 }, { t: C.drop + .1, type: 'whoosh', dur: .4, up: false, vol: .4 },
        { t: C.bPick + .25, type: 'scuff', vol: .5 }, { t: C.wind, type: 'riser', dur: C.hit - C.wind },
        { t: C.hit - .25, type: 'whoosh', dur: .3, vol: .8 }, { t: C.hit, type: 'boom' }, { t: C.hit, type: 'crack' }, { t: C.hit + .1, type: 'rumble', dur: 1.4 },
        { t: C.hit + .15, type: 'sparkle' }, { t: C.toss + .35, type: 'clatter', vol: .5 }, { t: C.grab + .1, type: 'chime' },
        { t: C.raise + .45, type: 'cheer', dur: 2.5, vol: .7 }, { t: C.aLook + .4, type: 'heartbeat', vol: .6 },
      ]);
  },
  music: {
    sections: [
      { t: .2, dur: 5.0, style: 'build', chords: ['Am', 'F', 'C', 'G'], chordLen: 1.2, vol: .8 },
      { t: 5.2, dur: C.bIn - 5.2, style: 'sad', chords: ['Am', 'F', 'Dm', 'E'], chordLen: 1.3 },
      { t: C.bIn, dur: C.wind - C.bIn, style: 'tension', chords: ['Am', 'E'], chordLen: 1 },
      { t: C.hit, dur: D - C.hit, style: 'epic', chords: ['F', 'C', 'G', 'C'], chordLen: 1.4 },
    ],
    stingers: [{ t: C.hit, type: 'impact' }, { t: C.raise + .45, type: 'bells' }],
    duck: [[C.wind + .3, C.hit]],
  },
};
})();
