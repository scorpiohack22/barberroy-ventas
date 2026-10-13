// 50 — NUNCA OLVIDES DE DÓNDE VIENES: el joven levanta el trofeo en el escenario, la multitud aplaude.
// Ve al fondo del salón a sus padres ancianos aplaudiendo tímidos en la sombra. Baja, cruza entre la gente,
// les entrega el trofeo y los abraza. El foco y los rayos se mueven hacia ellos.
(() => {
const { FLOOR, clamp, lerp, prog, smooth, easeOut, easeIn, easeInOut, keyed, solve, figure, mixStyle, STYLE, stand, walk, crouch, mix, poseAt, heart, burst, ring, rays, glowCircle, cane, ctx } = E;
const D = 19;
const ST = { x0: 70, x1: 385, h: 70 };          // escenario
const STEPS = [[385, 47], [408, 24]];            // escalones [x inicio, altura]
const LANE = FLOOR - 32;
const MX = 636, FX = 696;                        // madre y padre (miran a la izquierda)
const CUE = { see: 3.0, parents: 3.35, back: 4.5, go: 4.9, edge: 5.6, down: 6.25, arrive: 9.0, give: 9.45, given: 10.2, spot: 10.3, hug: 11.0, raise: 13.4 };
const CROWD = [[418, 1, .8], [458, -1, .84], [497, 1, .78], [536, -1, .82]];
// mixStyle del motor solo acepta colores hex: convertir el resultado de vuelta a hex para poder encadenar
const toHex = c => c[0] === '#' ? c : '#' + c.match(/\d+/g).slice(0, 3).map(v => (+v).toString(16).padStart(2, '0')).join('');
const mixS = (a, b, p) => { const m = mixStyle(a, b, p); return { ...m, near: toHex(m.near), far: toHex(m.far) }; };
const OLD = mixS(STYLE.hero, STYLE.gray, .62);

function trophy(x, y, sc = 1, a = 1, t = 0) {   // (x,y) = base
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.scale(sc, sc);
  glowCircle(0, -34, 70, '255,200,60', .35);
  ctx.shadowColor = '#ffb400'; ctx.shadowBlur = 22;
  const g = ctx.createLinearGradient(-20, 0, 20, 0);
  g.addColorStop(0, '#b8860b'); g.addColorStop(.35, '#ffe48a'); g.addColorStop(.6, '#ffc93c'); g.addColorStop(1, '#a87400');
  ctx.fillStyle = g;
  ctx.fillRect(-15, -8, 30, 8); ctx.fillRect(-10, -14, 20, 6); ctx.fillRect(-3, -30, 6, 16);
  ctx.beginPath(); ctx.moveTo(-20, -60); ctx.lineTo(20, -60); ctx.quadraticCurveTo(19, -30, 0, -28); ctx.quadraticCurveTo(-19, -30, -20, -60); ctx.fill();
  ctx.strokeStyle = '#ffd25a'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(-21, -48, 8, Math.PI * .5, Math.PI * 1.5); ctx.stroke();
  ctx.beginPath(); ctx.arc(21, -48, 8, -Math.PI * .5, Math.PI * .5); ctx.stroke();
  ctx.shadowBlur = 0; ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(-12, -57, 4, 20);
  const tw = .5 + .5 * Math.sin(t * 5);
  ctx.fillStyle = `rgba(255,255,255,${.8 * tw})`; ctx.beginPath(); ctx.arc(10, -54, 2.5 + 2 * tw, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
function stage() {
  const g = ctx.createLinearGradient(0, FLOOR - ST.h, 0, FLOOR);
  g.addColorStop(0, '#3a3a3e'); g.addColorStop(1, '#141416');
  ctx.fillStyle = g; ctx.fillRect(ST.x0, FLOOR - ST.h, ST.x1 - ST.x0, ST.h);
  for (const [x, hh] of STEPS) { ctx.fillStyle = '#26262a'; ctx.fillRect(x, FLOOR - hh, 23, hh); ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(x, FLOOR - hh, 23, 2); }
  ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.fillRect(ST.x0, FLOOR - ST.h, ST.x1 - ST.x0, 3);
  ctx.fillStyle = '#ffc93c'; ctx.globalAlpha = .5;
  for (let x = ST.x0 + 10; x < ST.x1; x += 22) { ctx.beginPath(); ctx.arc(x, FLOOR - ST.h + 14, 2.2, 0, Math.PI * 2); ctx.fill(); }
  ctx.globalAlpha = 1;
}
// altura del piso bajo x (escenario / escalones)
const groundAt = x => x < ST.x1 ? FLOOR - ST.h : x < STEPS[0][0] + 23 ? FLOOR - STEPS[0][1] : x < STEPS[1][0] + 23 ? FLOOR - STEPS[1][1] : FLOOR;

const HX = t => keyed([[0, 235], [CUE.go, 235], [CUE.edge, 362], [CUE.down, 452], [CUE.arrive, 586], [CUE.hug - .2, 586], [CUE.hug + .3, 600]], t, x => x);
function heroPose(t) {
  const x = HX(t), y = groundAt(x);
  const gy = (() => { // transición suave de altura en escalones
    const xs = [ST.x1 - 8, STEPS[0][0] + 12, STEPS[1][0] + 12, STEPS[1][0] + 30];
    const ys = [FLOOR - ST.h, FLOOR - STEPS[0][1], FLOOR - STEPS[1][1], FLOOR];
    if (x <= xs[0]) return ys[0]; if (x >= xs[3]) return FLOOR;
    for (let i = 1; i < 4; i++) if (x <= xs[i]) return lerp(ys[i - 1], ys[i], smooth((x - xs[i - 1]) / (xs[i] - xs[i - 1])));
    return y;
  })();
  const moving = t > CUE.go && t < CUE.arrive;
  let p;
  if (moving) {
    p = walk(x, (x - 235) * 1.15, { y: gy, lean: .1, tilt: lerp(.3, -.05, smooth(prog(t, CUE.down, CUE.down + .6))) });
  } else if (t < CUE.go) {
    // triunfo: trofeo arriba, gira a un lado y otro, luego ve a sus padres
    const sw = Math.sin(t * 2.2) * .12 * (1 - smooth(prog(t, 2.4, 2.9)));
    p = stand(x, { y: gy, t, lean: -.08 + sw * .3, tilt: -.35 + sw });
    const see = smooth(prog(t, CUE.see - .2, CUE.see + .3));
    p.tilt = lerp(p.tilt, .05, see); p.lean = lerp(p.lean, .05, see);
    if (t > CUE.see + 1.2) { p.tilt = lerp(.05, -.1, smooth(prog(t, CUE.back, CUE.go))); }
  } else {
    p = stand(x, { t, lean: .08, tilt: .15 });
    p.feet = [{ x: x + 9, y: FLOOR }, { x: x - 10, y: FLOOR }];
  }
  const sh = E.shoulderOf(p);
  // trofeo: arriba con dos manos → baja al pecho → en la mano al caminar → entrega
  const up = 1 - smooth(prog(t, 2.7, CUE.see + .2));
  const top = { x: sh.x + 14, y: sh.y - 70 }, chest = { x: sh.x + 24, y: sh.y + 40 };
  let tp = { x: lerp(chest.x, top.x, up), y: lerp(chest.y, top.y, up) };
  const give = smooth(prog(t, CUE.give - .3, CUE.give + .2));
  if (give > 0 && t < CUE.given) tp = { x: lerp(tp.x, sh.x + 50, give), y: lerp(tp.y, sh.y + 30, give) };
  const holds = t < CUE.given;
  if (holds) p.arms = [{ target: { x: tp.x - 4, y: tp.y - 4 - 14 * (1 - up) }, elbowUp: up > .5 }, { target: { x: tp.x + 4, y: tp.y - 6 - 14 * (1 - up) }, elbowUp: up > .5 }];
  if (moving && holds) p.arms[1] = { ang: Math.sin(t * 6) * .3, bend: .3 };
  // abrazo
  const hug = smooth(prog(t, CUE.hug - .2, CUE.hug + .4));
  if (hug > 0) {
    p.lean = lerp(p.lean, .3, hug); p.tilt = lerp(p.tilt, .4, hug);
    const m = solve(momPose(t)), f = solve(dadPose(t));
    p.arms = [{ target: { x: lerp(sh.x + 20, m.sh.x + 18, hug), y: lerp(sh.y + 50, m.sh.y + 14, hug) } }, { target: { x: lerp(sh.x + 20, f.sh.x - 4, hug), y: lerp(sh.y + 50, f.sh.y + 6, hug) } }];
  }
  return { p, tp, holds };
}
function momPose(t) {
  const p = stand(MX, { dir: -1, s: .9, t, lean: .25, tilt: .2 });
  const sh = E.shoulderOf(p);
  // aplauso tímido: manos al pecho
  const clap = Math.abs(Math.sin(t * 6)) * (t < CUE.arrive - .5 ? 1 : 0);
  p.arms = [{ target: { x: sh.x - 18 - 6 * clap, y: sh.y + 34 } }, { target: { x: sh.x - 18 + 6 * clap, y: sh.y + 36 } }];
  const surprise = E.bump(t, CUE.arrive - .6, CUE.give);
  p.lean -= .12 * surprise; p.tilt -= .3 * smooth(prog(t, CUE.arrive - .8, CUE.arrive));
  const recv = smooth(prog(t, CUE.give, CUE.given));
  if (recv > 0) {
    const tr = momTrophy(t, sh);
    p.arms = [{ target: { x: tr.x - 5, y: tr.y - 16 } }, { target: { x: tr.x + 5, y: tr.y - 18 } }];
    p.tilt = lerp(p.tilt, .45, recv);
  }
  const hug = smooth(prog(t, CUE.hug, CUE.hug + .4)) * (1 - smooth(prog(t, CUE.raise - .2, CUE.raise + .3)));
  p.lean += .1 * hug;
  return p;
}
function momTrophy(t, sh) {
  const rise = smooth(prog(t, CUE.raise, CUE.raise + .7));
  return { x: sh.x - 28 + 6 * rise, y: lerp(sh.y + 46, sh.y - 50, rise) };
}
function dadPose(t) {
  const p = stand(FX, { dir: -1, t, lean: .32, tilt: .22 });
  p.hip.y += 4;
  const sh = E.shoulderOf(p);
  const clap = Math.abs(Math.sin(t * 5 + 1)) * (t < CUE.arrive - .5 ? 1 : 0);
  p.arms = [{ target: { x: FX - 34, y: FLOOR - 82 } }, { target: { x: sh.x - 20 + 7 * clap, y: sh.y + 36 } }];
  const hug = smooth(prog(t, CUE.hug, CUE.hug + .4));
  if (hug > 0) p.arms[1] = { target: { x: lerp(sh.x - 20, sh.x - 34, hug), y: lerp(sh.y + 36, sh.y + 10, hug) } };
  if (t > CUE.raise) { const m = solve(momPose(t)), tr = momTrophy(t, m.sh); p.arms[1] = { target: { x: tr.x + 10, y: tr.y - 22 } }; p.tilt = lerp(.22, -.3, smooth(prog(t, CUE.raise, CUE.raise + .6))); }
  return p;
}
function crowdPose(c, i, t, heroX) {
  const [x, dir0, s] = c;
  const turn = heroX > x + 10 && t > CUE.go ? 1 : heroX > 300 && t > CUE.edge ? -1 : -1;
  let dir = t < CUE.edge ? -1 : turn;
  if (t > CUE.spot) dir = 1;
  const p = stand(x, { s, y: LANE, dir, t: t + i, lean: .02, tilt: -.25 });
  const sh = E.shoulderOf(p), hd = E.headOf(p);
  const clapping = t < CUE.edge + .3 || t > CUE.spot + .3;
  const osc = Math.abs(Math.sin(t * 9 + i * 1.7));
  if (clapping) p.arms = [{ target: { x: hd.x + 8 * dir + 7 * osc, y: hd.y - 32 * s } }, { target: { x: hd.x + 8 * dir - 7 * osc, y: hd.y - 30 * s } }];
  else { p.arms = [{ ang: .2, bend: .5 }, { ang: .1, bend: .5 }]; p.tilt = .1; }
  return p;
}

const CAM = {
  zoom: [[0, 2.25], [1.2, 2.05], [2.7, 1.95], [CUE.see + .1, 2.0], [CUE.parents, 2.05], [CUE.back - .3, 2.1], [CUE.back, 1.9], [CUE.down, 1.85], [CUE.arrive, 1.9], [CUE.hug, 2.05], [CUE.raise, 2.0], [D, 1.75]],
  x: [[0, 255], [2.7, 260], [CUE.see + .1, 265], [CUE.parents, 660], [CUE.back - .3, 668], [CUE.back, 300], [CUE.edge, 360], [CUE.down, 440], [CUE.arrive, 610], [CUE.hug, 635], [D, 590]],
  y: [[0, FLOOR - 245], [2.7, FLOOR - 235], [CUE.parents, FLOOR - 150], [CUE.back - .3, FLOOR - 145], [CUE.back, FLOOR - 220], [CUE.down, FLOOR - 185], [CUE.arrive, FLOOR - 170], [CUE.raise, FLOOR - 190], [D, FLOOR - 220]],
};
const spotX = t => lerp(235, 645, easeInOut(prog(t, CUE.spot, CUE.spot + 1.2)));

window.SCENE = {
  id: '50-de-donde-vienes', title: 'Nunca olvides *de dónde vienes*', duration: D, cue: CUE,
  spot: t => ({ x: spotX(t), r: 300, a: .1 }),
  beam: t => ({ x: spotX(t), a: .1 + .04 * smooth(prog(t, CUE.spot + 1, CUE.hug + .5)), w: 150 }),
  sky: t => .35 + .25 * smooth(prog(t, CUE.hug, CUE.hug + 1)),
  flashes: [.05, CUE.raise + .3],
  blackouts: [],
  camera: t => ({ zoom: keyed(CAM.zoom, t), x: keyed(CAM.x, t), y: keyed(CAM.y, t), shake: .15 * E.pulse(t, .1, .2) }),
  backdrop(t) {
    const x = spotX(t), a1 = 1 - smooth(prog(t, CUE.spot, CUE.spot + .8)), a2 = smooth(prog(t, CUE.spot + .5, CUE.spot + 1.5));
    rays(235, FLOOR - 360, t, a1 * 1.1, '255,70,60', 18, 900);
    rays(MX + 25, FLOOR - 330, t, a2 * 1.2, '255,80,60', 18, 900);
    glowCircle(x, FLOOR - 330, 240, '255,60,50', .2);
  },
  world(t, refl) {
    stage();
    const h = heroPose(t), hx = HX(t);
    CROWD.forEach((c, i) => figure(crowdPose(c, i, t, hx), mixS(STYLE.gray, STYLE.dim, .65)));
    // padres en la sombra (se iluminan cuando llega el foco)
    const lit = smooth(prog(t, CUE.spot + .3, CUE.spot + 1.2));
    const pStyle = mixS(mixS(STYLE.gray, STYLE.dim, .45), OLD, lit);
    const dad = figure(dadPose(t), pStyle);
    cane({ x: FX - 34, y: FLOOR - 86 }, { x: FX - 40, y: FLOOR });
    const mom = figure(momPose(t), pStyle);
    { // moño de la madre
      const a = Math.atan2(mom.head.y - mom.sh.y, mom.head.x - mom.sh.x) - Math.PI / 2 * mom.dir;
      ctx.save(); ctx.fillStyle = pStyle.far; ctx.beginPath(); ctx.arc(mom.head.x + 17 * mom.s * Math.cos(a), mom.head.y + 17 * mom.s * Math.sin(a), 8 * mom.s, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
    const hsl = figure(h.p, STYLE.hero);
    // trofeo
    if (h.holds) trophy(h.tp.x, h.tp.y, .62, 1, t);
    else { const tr = momTrophy(t, mom.sh); trophy(tr.x, tr.y, .62, 1, t); }
    if (!refl) {
      // confeti dorado del triunfo
      for (let k = 0; k < 4; k++) burst(235, FLOOR - 330, t, .05 + k * .55, { n: 26, speed: 260, size: 3, color: k % 2 ? '255,200,80' : '255,80,60', life: 1.6, gravity: .6, seed: 11 + k });
      // destello sobre los padres (ven al hijo en la luz)
      if (t > CUE.parents && t < CUE.back) glowCircle(MX + 25, FLOOR - 150, 120, '255,220,180', .06);
      if (t > CUE.given) {
        const tr = momTrophy(t, mom.sh);
        ring(tr.x, tr.y - 30, t, CUE.given, { r: 120, color: '255,210,120', life: .9 });
        burst(tr.x, tr.y - 30, t, CUE.raise + .3, { n: 40, speed: 280, size: 3.2, color: '255,200,90', life: 1.6, gravity: .5, seed: 5 });
      }
      const hp = smooth(prog(t, CUE.hug + .2, CUE.hug + 1));
      if (hp > 0) {
        const cx = (hsl.head.x + mom.head.x + dad.head.x) / 3, cy = Math.min(hsl.head.y, mom.head.y) - 90 - 6 * Math.sin(t * 2.4);
        heart(cx, cy, 40 * E.backOut(hp) * (1 + .05 * Math.sin(t * 6)), '#ff3b36', hp, 35);
        for (let i = 0; i < 6; i++) {
          const t0 = CUE.hug + .8 + i * .75, dt = t - t0;
          if (dt < 0 || dt > 2.4) continue;
          heart(cx + Math.sin(i * 2.3) * 110, cy + 80 - dt * 70, 13, '#ff3b36', Math.min(1, dt * 3) * (1 - dt / 2.4), 14);
        }
      }
    }
  },
  events() {
    const ev = E.footsteps(D, t => {
      const h = heroPose(t);
      return [{ phi: h.p.phi || 0, size: 1, moving: t > CUE.go && t < CUE.arrive }];
    });
    return ev.concat([
      { t: 0, type: 'impact' }, { t: 0, type: 'cheer', dur: 3.2 }, { t: .05, type: 'sparkle' }, { t: .1, type: 'crowd', dur: 5 },
      { t: CUE.see, type: 'whoosh', dur: .4, vol: .5 }, { t: CUE.parents, type: 'heartbeat', vol: .7 }, { t: CUE.parents + .7, type: 'heartbeat', vol: .5 },
      { t: CUE.back, type: 'whoosh', dur: .35, vol: .4 },
      { t: CUE.give, type: 'chime' }, { t: CUE.spot, type: 'whoosh', dur: 1.2, vol: .6 }, { t: CUE.spot + .9, type: 'boom', vol: .6 },
      { t: CUE.spot + 1, type: 'crowd', dur: 6, vol: .8 }, { t: CUE.hug, type: 'sparkle' },
      { t: CUE.raise + .3, type: 'cheer', dur: 3, vol: .9 }, { t: CUE.raise + .3, type: 'coin', vol: .6 },
    ]);
  },
  music: {
    sections: [
      { t: 0, dur: CUE.see, style: 'epic', chords: ['C', 'G', 'Am', 'F'], chordLen: .75 },
      { t: CUE.see + .1, dur: CUE.give - CUE.see - .1, style: 'tender', chords: ['Am', 'F', 'C', 'G'], chordLen: 1.3 },
      { t: CUE.give, dur: CUE.hug - CUE.give, style: 'build', chords: ['F', 'G'], chordLen: .8 },
      { t: CUE.hug - .05, dur: D - CUE.hug, style: 'hope', chords: ['F', 'C', 'G', 'C'], chordLen: 1.6 },
    ],
    stingers: [{ t: 0, type: 'bells' }, { t: CUE.hug, type: 'bells' }],
    duck: [[CUE.see + .05, CUE.see + .5]],
  },
};
})();
