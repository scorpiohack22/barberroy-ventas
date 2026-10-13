// 41 — TU MIEDO ES MÁS PEQUEÑO: una sombra de monstruo con ojos rojos llena la pared. Él tiembla
// y retrocede; respira, avanza paso a paso. La sombra se encoge… era un gatito asustado frente a una lámpara.
(() => {
const { FLOOR, clamp, lerp, prog, smooth, easeOut, easeIn, easeInOut, keyed, bump, pulse, stand, walk, kneel, crouch, mix, poseAt,
        figure, STYLE, glowCircle, ctx, burst, ring, heart, distance } = E;
const D = 19;
const CUE = { eyes: .55, flinch: .7, retreat: 1.3, cower: 3.1, swipe: 3.7, rise: 5.3, breath: 6.3, step: 7.4, catGo: 8.3,
              reveal: 11.0, relief: 11.7, kneel: 12.1, reach: 12.8, rub: 13.5, heart: 13.9, lift: 15.0, held: 16.0 };
const LAMP = 610;
// ── posición del gatito (se aleja de la lámpara → la sombra se encoge) ──
const catX = t => keyed([[0, 580], [CUE.catGo, 580], [CUE.reveal - .3, 458], [CUE.reach - .2, 458], [CUE.rub, 440]], t);
const catArch = t => smooth(prog(t, .2, .55)) * (1 - smooth(prog(t, CUE.catGo - .2, CUE.catGo + 1.2)));
const shadowScale = x => 165 / Math.max(20, LAMP - x) + .55;

// ── el protagonista ──
const STEP = [[0, 0], [CUE.step, 0], [CUE.step + .3, 96], [CUE.step + .7, 96], [CUE.step + .9, 0], [CUE.step + 1.2, 0], [CUE.step + 1.4, 96], [CUE.step + 1.8, 96],
              [CUE.step + 2.0, 0], [CUE.step + 2.15, 0], [CUE.step + 2.35, 110], [CUE.reveal - .25, 110], [CUE.reveal, 0], [D, 0]];
const stepD = distance(STEP, D);
const XR = 142; // donde termina retrocediendo
const heroX = t => t < CUE.step ? keyed([[0, 212], [CUE.flinch + .3, 196], [CUE.retreat, 196], [CUE.cower, XR]], t) : XR + stepD(t);
function hero(t) {
  const tr = Math.sin(t * 47) * 1.6 * (smooth(prog(t, CUE.flinch, CUE.flinch + .2)) * (1 - smooth(prog(t, CUE.breath, CUE.breath + .8))) + .6 * bump(t, CUE.step, CUE.reveal));
  const x = heroX(t);
  const idle = t2 => { const p = stand(212, { t: t2, lean: .06, tilt: -.1 }); p.arms = [{ ang: .1, bend: .3 }, { ang: -.05, bend: .3 }]; return p; };
  const flinch = t2 => { const p = stand(196, { lean: -.32, tilt: -.25 }); p.feet = [{ x: 206, y: FLOOR }, { x: 168, y: FLOOR }]; const h = E.headOf(p); p.arms = [{ target: { x: h.x + 26, y: h.y - 4 } }, { target: { x: h.x + 22, y: h.y + 18 } }]; return p; };
  const back = t2 => {
    const xx = heroX(t2), p = walk(xx, xx - 212, { lean: -.22, tilt: -.2, stride: .8 });
    const h = E.headOf(p); p.arms = [{ target: { x: h.x + 24, y: h.y + 14 } }, { target: { x: h.x + 18, y: h.y + 30 } }]; return p;
  };
  const cower = t2 => {
    const p = crouch(XR, { amt: 1, tilt: .6 }); p.lean = .45;
    const h = E.headOf(p); p.arms = [{ target: { x: h.x + 4, y: h.y - 18 } }, { target: { x: h.x - 10, y: h.y - 14 } }]; return p;
  };
  const peek = t2 => { const p = crouch(XR, { amt: .9, tilt: -.2 }); p.lean = .2; const h = E.headOf(p); p.arms = [{ target: { x: h.x + 22, y: h.y + 26 } }, { target: { x: h.x + 10, y: h.y + 20 } }]; return p; };
  const breathe = t2 => {
    const b = bump(t2, CUE.breath, CUE.breath + 1.1);
    const p = stand(XR, { lean: lerp(.05, -.12, b), tilt: lerp(0, -.3, b) }); p.hip.y -= 4 * b;
    p.arms = [{ ang: lerp(.15, .35, b), bend: 1.2 }, { ang: lerp(-.05, .2, b), bend: 1.2 }]; return p; // puños cerrados
  };
  const advance = t2 => {
    const xx = heroX(t2), d = stepD(t2);
    const p = walk(xx, d, { lean: .12, tilt: -.06, stride: .9, freeze: 0 });
    p.arms = [{ ang: .35 + .1 * Math.sin(2 * Math.PI * p.phi), bend: 1.1 }, { ang: .15 - .1 * Math.sin(2 * Math.PI * p.phi), bend: 1.1 }]; return p;
  };
  const xs = XR + stepD(D);
  const surprised = t2 => { const p = stand(xs, { t: t2, lean: -.12, tilt: .35 }); p.arms = [{ ang: .5, bend: .6 }, { ang: .3, bend: .6 }]; return p; };
  const relief = t2 => { const p = stand(xs, { t: t2, lean: .14, tilt: .55 }); p.hip.y += 3; p.arms = [{ ang: .05, bend: .1 }, { ang: -.03, bend: .1 }]; return p; };
  const kn = t2 => { const p = kneel(xs + 6, { lean: .32, tilt: .5 }); p.arms = [{ target: { x: xs + 66, y: FLOOR - 26 } }, { ang: .3, bend: .4 }]; return p; };
  const pet = t2 => { const p = kneel(xs + 6, { lean: .34, tilt: .5 }); const c = catX(t2); p.arms = [{ target: { x: c + 4 + 6 * Math.sin(t2 * 5), y: FLOOR - 40 + 3 * Math.cos(t2 * 5) } }, { ang: .3, bend: .4 }]; return p; };
  const hold = t2 => { const p = stand(xs, { t: t2, lean: .02, tilt: .32 }); const s = E.shoulderOf(p); p.arms = [{ target: { x: s.x + 30, y: s.y + 50 } }, { target: { x: s.x + 24, y: s.y + 30 } }]; return p; };
  const p = poseAt(t, [
    [0, idle], [CUE.flinch - .05, idle], [CUE.flinch + .25, flinch], [CUE.retreat, flinch], [CUE.retreat + .3, back], [CUE.cower - .2, back], [CUE.cower + .3, cower],
    [CUE.rise - .5, cower], [CUE.rise, peek], [CUE.rise + .4, peek], [CUE.breath, breathe], [CUE.step - .1, breathe], [CUE.step + .2, advance], [CUE.reveal - .1, advance],
    [CUE.reveal + .3, surprised], [CUE.relief, surprised], [CUE.relief + .35, relief], [CUE.kneel, relief], [CUE.kneel + .6, kn], [CUE.rub - .3, kn], [CUE.rub, pet],
    [CUE.lift, pet], [CUE.held, hold], [D, hold],
  ]);
  p.hip = { x: p.hip.x + tr, y: p.hip.y };
  return p;
}
// la mano que sostiene al gatito al final
const heldPoint = t => { const p = hero(t), sl = E.solve(p); return { x: (sl.arms[0][2].x + sl.arms[1][2].x) / 2 + 2, y: Math.min(sl.arms[0][2].y, sl.arms[1][2].y) + 8 }; };

// gatito cargado: de piso a los brazos
const liftedCat = t => {
  const lp = smooth(prog(t, CUE.lift, CUE.held - .2)), hp = heldPoint(t), fx = catX(CUE.lift);
  return { x: lerp(fx, hp.x, lp), y: lerp(FLOOR, hp.y + 4, lp) - 30 * bump(lp, 0, 1), sc: lerp(1, .8, lp) };
};
// ── gatito (dibujado a mano). o: {dir, arch, sit, phase, moving, paw, tail, sc, col, rub} → devuelve la cabeza ──
function kitten(x, y, o = {}) {
  const dir = o.dir || -1, a = o.arch || 0, st = o.sit || 0, sc = o.sc || 1, col = o.col || '#f2f2f2', ph = o.phase || 0, mv = o.moving || 0;
  ctx.save(); ctx.translate(x, y); ctx.scale(dir * sc, sc);
  ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (o.glow) { ctx.shadowColor = o.glow; ctx.shadowBlur = 14; }
  const rear = { x: lerp(-17, -9, st), y: lerp(-20 - 6 * a, -9, st) }, front = { x: lerp(15, 7, st), y: lerp(-22 - 4 * a, -30, st) };
  const mid = { x: (rear.x + front.x) / 2, y: (rear.y + front.y) / 2 - 16 * a - 3 };
  // patas
  ctx.lineWidth = 5;
  const legs = [[front.x - 2, 0], [front.x - 7, .5], [rear.x + 5, .5], [rear.x, 0]];
  legs.forEach(([lx, off], i) => {
    const back = i >= 2, sw = Math.sin((ph + off) * Math.PI * 2) * 7 * mv;
    const top = back ? rear : front;
    let fx = lx + sw, fy = 0;
    if (!back && i === 0 && o.paw) { fx = lerp(fx, lx + 14, o.paw); fy = -lerp(0, 22, o.paw); }
    if (back && st > 0) { fx = lerp(fx, rear.x + 10, st); }
    ctx.beginPath(); ctx.moveTo(top.x + (back ? 2 : -2), top.y + 2); ctx.lineTo(lerp(top.x, fx, 1), lerp(-(4 + 14 * a) * 0, fy, 1) + 0); ctx.stroke();
  });
  // cuerpo arqueado
  ctx.lineWidth = 15 + 2 * a;
  ctx.beginPath(); ctx.moveTo(rear.x, rear.y); ctx.quadraticCurveTo(mid.x, mid.y - 6 * a, front.x, front.y); ctx.stroke();
  // pelo erizado
  if (a > .05) {
    ctx.beginPath();
    for (let i = 0; i <= 8; i++) {
      const p = i / 8, bx = (1 - p) * (1 - p) * rear.x + 2 * p * (1 - p) * mid.x + p * p * front.x, by = (1 - p) * (1 - p) * rear.y + 2 * p * (1 - p) * (mid.y - 6 * a) + p * p * front.y;
      ctx.moveTo(bx - 3, by - 6); ctx.lineTo(bx + (o.spike || 1) * 2, by - 6 - (o.spike || 1) * 9 * a * (.6 + .4 * Math.sin(i * 2.3))); ctx.lineTo(bx + 4, by - 6);
    }
    ctx.lineWidth = 2; ctx.fill(); ctx.stroke();
  }
  // cola
  const tw = o.tail ?? Math.sin(ph * 2) * .4;
  ctx.lineWidth = 4.5;
  ctx.beginPath(); ctx.moveTo(rear.x, rear.y - 2);
  ctx.quadraticCurveTo(rear.x - 18, rear.y - 6 + 10 * st, rear.x - 16 + 8 * tw, rear.y - 24 - 12 * a + 14 * st); ctx.stroke();
  // cabeza
  const rubD = o.rub || 0;
  const head = { x: front.x + lerp(9, 5, st) + 3 * rubD, y: front.y - lerp(9, 12, st) + 7 * a * 0 + 6 * rubD };
  ctx.beginPath(); ctx.arc(head.x, head.y, 9.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(head.x - 8, head.y - 3); ctx.lineTo(head.x - 6 - 2 * a, head.y - 17 - 3 * a); ctx.lineTo(head.x - 1, head.y - 8);
  ctx.moveTo(head.x + 1, head.y - 8); ctx.lineTo(head.x + 6 + 2 * a, head.y - 17 - 3 * a); ctx.lineTo(head.x + 8, head.y - 3); ctx.fill();
  ctx.restore();
  return { x: x + dir * sc * head.x, y: y + sc * head.y };
}
const catState = t => {
  const a = catArch(t), mv = smooth(prog(t, CUE.catGo, CUE.catGo + .3)) * (1 - smooth(prog(t, CUE.reveal - .5, CUE.reveal - .2))) + bump(t, CUE.reach - .3, CUE.rub);
  const sit = smooth(prog(t, CUE.reveal - .3, CUE.reveal + .2)) * (1 - smooth(prog(t, CUE.reach - .4, CUE.reach))) ;
  const paw = bump(t, CUE.swipe - .15, CUE.swipe + .45) + .8 * bump(t, 1.7, 2.2);
  const rub = t > CUE.rub ? .5 + .5 * Math.sin((t - CUE.rub) * 5) : 0;
  return { arch: a, moving: mv, sit, paw, rub, phase: (580 - catX(t)) / 40, tail: t > CUE.reveal ? Math.sin(t * 3) * .8 : undefined };
};

// lámpara de piso pequeña
function lamp(t, on) {
  const x = LAMP, y = FLOOR, fl = on * (1 - .5 * pulse(t, .25, .15) - .6 * pulse(t, 2.6, .08) - .4 * pulse(t, 4.4, .06));
  glowCircle(x - 6, y - 40, 120, '255,225,180', .35 * fl);
  ctx.fillStyle = '#5a5a5a'; ctx.beginPath(); ctx.ellipse(x, y - 3, 18, 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#777'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x, y - 4); ctx.lineTo(x + 4, y - 40); ctx.stroke();
  ctx.save(); ctx.translate(x + 4, y - 44); ctx.rotate(-.5);
  ctx.fillStyle = '#8a8a8a'; ctx.beginPath(); ctx.moveTo(-6, -12); ctx.lineTo(8, -12); ctx.lineTo(18, 12); ctx.lineTo(-16, 12); ctx.closePath(); ctx.fill();
  ctx.fillStyle = `rgba(255,240,210,${fl})`; ctx.shadowColor = '#ffe6b0'; ctx.shadowBlur = 30 * fl; ctx.beginPath(); ctx.ellipse(1, 12, 16, 4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
const lampOn = t => 1 - .55 * pulse(t, .25, .15) - .5 * pulse(t, 2.6, .08);

// sombras proyectadas sobre la pared (de la lámpara hacia arriba/izquierda)
function project(sc, fn) { ctx.save(); ctx.translate(LAMP, FLOOR); ctx.scale(sc, sc); ctx.translate(-LAMP, -FLOOR); fn(); ctx.restore(); }

window.SCENE = {
  id: '41-tu-miedo', title: 'Tu miedo es *más pequeño* de lo que crees', duration: D, cue: CUE,
  sky: t => .3 * (1 - smooth(prog(t, CUE.catGo, CUE.reveal))) * (.6 + .4 * Math.sin(t * 5)),
  spot: t => ({ x: lerp(300, 480, smooth(prog(t, CUE.step, CUE.reveal))), r: 330 }),
  beam: t => ({ x: lerp(220, 470, smooth(prog(t, CUE.step, CUE.reveal + 1))), a: .045, w: 130 }),
  flashes: [CUE.eyes + .02],
  blackouts: [CUE.reveal - .05],
  camera: t => ({
    zoom: keyed([[0, 1.95], [CUE.eyes + .2, 1.5], [CUE.cower, 1.45], [CUE.rise, 1.75], [CUE.breath + .8, 1.95], [CUE.step + .6, 1.6], [CUE.reveal - .3, 1.55], [CUE.reveal, 2.35], [CUE.rub, 2.25], [CUE.lift, 2.1], [CUE.held + .5, 1.7], [D, 1.45]], t),
    x: keyed([[0, 300], [CUE.eyes + .2, 350], [CUE.cower, 330], [CUE.rise, 230], [CUE.breath + .8, 210], [CUE.step + .6, 330], [CUE.reveal - .3, 400], [CUE.reveal, 440], [CUE.rub, 430], [CUE.held + .5, 420], [D, 400]], t),
    y: keyed([[0, FLOOR - 250], [CUE.eyes + .2, FLOOR - 285], [CUE.cower, FLOOR - 275], [CUE.rise, FLOOR - 190], [CUE.breath + .8, FLOOR - 180], [CUE.step + .6, FLOOR - 250], [CUE.reveal - .3, FLOOR - 240], [CUE.reveal, FLOOR - 120], [CUE.rub, FLOOR - 125], [CUE.held + .5, FLOOR - 200], [D, FLOOR - 245]], t),
    shake: .5 * pulse(t, CUE.eyes, .5) + .35 * pulse(t, CUE.swipe, .35) + .2 * pulse(t, 1.95, .3),
  }),
  backdrop(t) {
    // pared iluminada por la lámpara
    const on = lampOn(t);
    ctx.fillStyle = '#0b0a0a'; ctx.fillRect(-400, FLOOR - 900, 1600, 900);
    const g = ctx.createRadialGradient(LAMP - 120, FLOOR - 40, 20, LAMP - 120, FLOOR - 80, 620);
    g.addColorStop(0, `rgba(150,138,122,${.55 * on})`); g.addColorStop(.5, `rgba(80,72,64,${.4 * on})`); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(-400, FLOOR - 900, 1600, 900);
    // zócalo
    ctx.fillStyle = 'rgba(255,255,255,.05)'; ctx.fillRect(-400, FLOOR - 14, 1600, 3);
    // sombra del gatito → monstruo
    const cx = catX(t), sc = shadowScale(cx), cs = catState(t), mon = clamp((sc - 1.6) / 4);
    let eye;
    if (t < CUE.lift) project(sc, () => { eye = kitten(cx, FLOOR, { ...cs, col: '#030303', spike: 1 + 1.4 * mon, arch: cs.arch * (1 + .3 * mon) }); });
    else { const lc = liftedCat(t); eye = { x: 0, y: 0 }; ctx.save(); ctx.globalAlpha *= 1 - prog(t, CUE.lift, CUE.lift + .5); project(shadowScale(lc.x), () => kitten(lc.x, lc.y, { sit: 1, sc: lc.sc, dir: -1, col: '#030303' })); ctx.restore(); }
    // ojos rojos del monstruo
    const ex = LAMP + (eye.x - LAMP) * sc, ey = FLOOR + (eye.y - FLOOR) * sc;
    const open = smooth(prog(t, CUE.eyes - .1, CUE.eyes + .15)) * (1 - smooth(prog(t, CUE.catGo + .5, CUE.reveal - .6)));
    const blink = 1 - bump(t, 4.8, 4.95);
    if (open > 0) {
      const er = 3 * sc;
      for (const k of [-1, 1]) {
        const xx = ex + k * 3.6 * sc - 2 * sc, yy = ey - .5 * sc;
        glowCircle(xx, yy, er * 4, '255,30,20', .5 * open);
        ctx.save(); ctx.fillStyle = '#ff3b36'; ctx.shadowColor = '#ff2010'; ctx.shadowBlur = 30;
        ctx.beginPath(); ctx.ellipse(xx, yy, er * 1.1, er * .55 * blink * open, k * -.25, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      }
    }
  },
  world(t, refl) {
    lamp(t, lampOn(t));
    const cs = catState(t);
    const reveal = smooth(prog(t, CUE.catGo, CUE.reveal));
    if (t < CUE.lift) {
      const cx = t < CUE.lift ? catX(t) : 0;
      if (!refl) glowCircle(cx, FLOOR - 20, 60, '255,235,200', .12 * reveal);
      kitten(cx, FLOOR, { ...cs, dir: -1, col: E.mixCol([70, 70, 70], [245, 245, 245], .25 + .75 * reveal), glow: reveal > .5 ? 'rgba(255,255,255,.35)' : null });
    } else {
      this._cat = liftedCat(t); // se dibuja después del cuerpo para quedar en sus brazos
    }
    const p = hero(t);
    const fear = smooth(prog(t, CUE.flinch, CUE.flinch + .3)) * (1 - smooth(prog(t, CUE.step, CUE.reveal)));
    const sl = figure(p, E.mixStyle(STYLE.hero, STYLE.gray, .35 * fear));
    if (t >= CUE.lift && this._cat) {
      const c = this._cat; kitten(c.x, c.y, { sit: 1, sc: c.sc, dir: -1, col: '#f4f4f4', glow: 'rgba(255,255,255,.4)', tail: Math.sin(t * 3), rub: t > CUE.held ? .5 + .5 * Math.sin(t * 3) : 0 });
    }
  },
  front(t) {
    // corazón al acariciarlo y al cargarlo
    for (const [t0, x, y, s] of [[CUE.heart, 470, FLOOR - 70, 22], [CUE.held + .2, 0, 0, 30]]) {
      const k = prog(t, t0, t0 + 2.2); if (k <= 0 || k >= 1) continue;
      let hx = x, hy = y; if (!x) { const hp = heldPoint(t0); hx = hp.x + 6; hy = hp.y - 85; }
      heart(hx + 8 * Math.sin(k * 7), hy - 90 * easeOut(k), s * E.backOut(clamp(k * 3)), '#ff3b36', 1 - smooth(prog(k, .6, 1)));
    }
    burst(470, FLOOR - 80, t, CUE.heart, { n: 18, speed: 120, size: 2.5, life: 1, gravity: -.3, seed: 4 });
    // gotas de sudor / temblor (partículas frías) en el miedo
    ring(300, FLOOR - 250, t, CUE.eyes, { r: 420, color: '255,40,30', life: .7, width: 10 });
  },
  events() {
    const ev = E.footsteps(D, t => {
      if (t > CUE.retreat && t < CUE.cower) { const x = heroX(t); return [{ phi: (x - 212) / (4 * 22 * .8), size: 1, vol: .8 }]; }
      if (t > CUE.step && t < CUE.reveal) return [{ phi: stepD(t) / (4 * 22 * .9), size: 1, vol: 1.2 }];
      return [null];
    });
    ev.push({ t: .05, type: 'rumble', dur: 1.2, vol: .8 }, { t: .1, type: 'whoosh', vol: .6, up: false }, { t: CUE.eyes, type: 'boom' }, { t: CUE.eyes, type: 'rumble', dur: 2.5 }, { t: CUE.flinch, type: 'whoosh', vol: .6 }, { t: CUE.swipe, type: 'impact', vol: .7 }, { t: 1.95, type: 'whoosh', vol: .5 });
    for (let k = 0; k < 7; k++) ev.push({ t: 1.2 + k * .55, type: 'heartbeat', vol: .9 - k * .05 });
    ev.push({ t: CUE.breath, type: 'wind', dur: 1.2, vol: .5 });
    for (let k = 0; k < 5; k++) ev.push({ t: CUE.step + .2 + k * .78, type: 'heartbeat', vol: .55 - k * .08 });
    ev.push({ t: CUE.reveal, type: 'pop', vol: .8 }, { t: CUE.reveal + .1, type: 'chime' }, { t: CUE.heart, type: 'sparkle' }, { t: CUE.heart, type: 'kiss', vol: .5 },
            { t: CUE.held + .2, type: 'sparkle' }, { t: CUE.lift, type: 'swell', dur: 2 });
    return ev;
  },
  music: {
    sections: [
      { t: .3, dur: CUE.breath, style: 'tension', chords: ['Am', 'Em', 'F', 'Em'], chordLen: 1 },
      { t: CUE.breath, dur: CUE.reveal - CUE.breath, style: 'build', chords: ['Am', 'F', 'C', 'G'], chordLen: .9 },
      { t: CUE.reveal + .2, dur: D - CUE.reveal - .2, style: 'tender', chords: ['C', 'G', 'Am', 'F'], chordLen: 1.4 },
      { t: CUE.lift - .2, dur: D - CUE.lift + .2, style: 'hope', chords: ['F', 'C', 'G', 'C'], chordLen: 1.3 },
    ],
    stingers: [{ t: CUE.eyes, type: 'impact' }, { t: CUE.reveal, type: 'whoosh' }, { t: CUE.held, type: 'bells' }],
    duck: [[CUE.reveal - .35, CUE.reveal + .2]],
  },
};
})();
