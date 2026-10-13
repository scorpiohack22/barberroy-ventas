// 40 — DEJA DE TOCAR ESA PUERTA: golpea una puerta cerrada hasta rendirse; a sus espaldas,
// en silencio, se abren tres puertas de luz. Se da vuelta, la luz le pega en la cara y entra.
(() => {
const { FLOOR, clamp, lerp, prog, smooth, easeOut, easeIn, easeInOut, keyed, bump, pulse, stand, walk, kneel, mix, poseAt,
        figure, STYLE, glowCircle, ctx, rays, burst, ring } = E;
const D = 19;
const CUE = { pound1: 4.0, pound2: 4.45, slump: 4.9, sink: 5.9, open1: 7.0, open2: 7.8, open3: 8.5, look: 9.4, turn: 10.1,
              shield: 10.9, go: 11.8, arrive: 15.0, enter: 15.9, gone: 16.6 };
const KNOCKS = [0.22, 0.5, 0.78, 1.06, 2.35, 2.58, 2.81, 3.04, CUE.pound1, CUE.pound2];
const DOOR = { x: 548, w: 92, h: 204 };
const DOORS = [{ x: 252, t: CUE.open1 }, { x: 132, t: CUE.open2 }, { x: 372, t: CUE.open3 }];
const DW = 80, DH = 184;
const WARM = { near: '#fff0d8', far: '#d0b48e', glow: .5, glowColor: '255,190,120' };
const X0 = 446;
// mezcla de estilos que acepta hex o rgb() (la del motor sólo acepta hex)
const rgbOf = c => c[0] === '#' ? [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16)) : c.match(/[\d.]+/g).slice(0, 3).map(Number);
const mixStyle = (a, b, p) => ({ near: E.mixCol(rgbOf(a.near), rgbOf(b.near), p), far: E.mixCol(rgbOf(a.far), rgbOf(b.far), p), glow: lerp(a.glow, b.glow, p), glowColor: p < .5 ? a.glowColor : b.glowColor });
const walkX = t => lerp(X0, 252, easeInOut(prog(t, CUE.go, CUE.arrive + .3)));
const lightAmt = t => smooth(prog(t, CUE.open1, CUE.open3 + 1.2));
const doorOpen = (t, d) => easeOut(prog(t, d.t + .25, d.t + 1.3));
const doorCrack = (t, d) => smooth(prog(t, d.t - .3, d.t + .25));

// ── puño que golpea: se retrae y pega en cada KNOCK ──
function knockHit(t) { let h = 0; for (const k of KNOCKS) h = Math.max(h, pulse(t, k, .13)); return h; }
const FACE = DOOR.x - DOOR.w / 2;

function hero(t) {
  // 0) golpes con una mano
  const hit = knockHit(t);
  const knockPose = (t2, y = 752) => {
    const p = stand(X0, { t: t2, lean: .1 + .05 * hit, tilt: -.05 });
    p.arms = [{ target: { x: lerp(FACE - 34, FACE + 2, hit), y: y - 10 * (1 - hit) } }, { ang: .15, bend: .4 }];
    return p;
  };
  const listen = t2 => { const p = stand(X0 + 6, { t: t2, lean: .22, tilt: .25 }); p.arms = [{ target: { x: FACE - 4, y: 752 } }, { ang: .1, bend: .3 }]; return p; };
  const lookUp = t2 => { const p = stand(X0 - 14, { t: t2, lean: -.04, tilt: -.35 }); p.arms = [{ ang: .25, bend: .5 }, { ang: .05, bend: .3 }]; return p; };
  // golpe con ambos puños
  const pound = t2 => {
    const ph = Math.max(pulse(t2, CUE.pound1, .2), pulse(t2, CUE.pound2, .2));
    const up = 1 - ph;
    const p = stand(X0 - 4, { lean: lerp(-.02, .26, ph), tilt: lerp(-.25, .1, ph) });
    p.hip.y += 6 * ph;
    p.arms = [{ target: { x: lerp(FACE - 8, FACE + 2, ph), y: lerp(676, 738, ph) } }, { target: { x: lerp(FACE - 16, FACE, ph), y: lerp(686, 746, ph) } }];
    return p;
  };
  const lean = t2 => { const p = stand(X0 + 10, { t: t2 * .6, lean: .42, tilt: .3 }); p.arms = [{ target: { x: FACE, y: 722 } }, { target: { x: FACE - 2, y: 704 } }]; return p; };
  const slumped = t2 => { const p = E.crouch(X0 + 14, { amt: .85, tilt: .55 }); p.lean = .62; p.hip.y += Math.sin(t2 * 2.4) * 1.5; p.arms = [{ target: { x: FACE - 1, y: 786 } }, { target: { x: FACE - 3, y: 812 } }]; return p; };
  const raised = t2 => { const p = E.crouch(X0 + 6, { amt: .7, tilt: -.15 }); p.lean = .25; p.arms = [{ target: { x: FACE - 2, y: 792 } }, { ang: .3, bend: .2 }]; return p; };
  // ya volteado (mira a la izquierda) cubriéndose de la luz
  const shield = t2 => {
    const p = stand(X0 - 4, { t: t2, dir: -1, lean: -.12, tilt: -.12 });
    const h = E.headOf(p);
    p.arms = [{ target: { x: h.x - 30, y: h.y - 4 } }, { ang: .25, bend: .4 }];
    return p;
  };
  const open = t2 => { const p = stand(X0 - 6, { t: t2, dir: -1, lean: .02, tilt: -.05 }); p.arms = [{ ang: .5, bend: .2 }, { ang: .35, bend: .2 }]; return p; };
  const walking = t2 => {
    const x = walkX(t2), d = X0 - x;
    const p = walk(x, d, { dir: -1, lean: .1, tilt: -.08, stride: 1.05 });
    const reachA = smooth(prog(t2, CUE.arrive - 1.2, CUE.arrive));
    p.arms = [mixArm(p.arms[0], { ang: 2.0, bend: -.15 }, reachA), mixArm(p.arms[1], { ang: 1.7, bend: -.1 }, reachA * .8)];
    return p;
  };
  return poseAt(t, [
    [0, knockPose], [1.25, knockPose], [1.55, listen], [2.1, listen], [2.25, knockPose], [3.15, knockPose],
    [3.45, lookUp], [3.7, lookUp], [3.8, pound], [4.6, pound],
    [CUE.slump, lean], [CUE.sink, lean], [CUE.sink + .9, slumped], [CUE.look, slumped], [CUE.turn, raised],
    [CUE.turn + .75, shield], [CUE.shield + .4, shield], [CUE.go - .1, open], [CUE.go + .35, walking], [D, walking],
  ]);
}
function mixArm(a, b, p) { return p <= 0 ? a : { ang: lerp(a.ang ?? 0, b.ang, p), bend: lerp(a.bend ?? .3, b.bend, p) }; }

// ── puertas ──
function closedDoor(t) {
  const { x, w, h } = DOOR, y = FLOOR;
  const shk = KNOCKS.reduce((s, k) => s + pulse(t, k + .02, .12), 0) * 2.2;
  ctx.save(); ctx.translate(shk, 0);
  // marco
  ctx.fillStyle = '#141414'; ctx.fillRect(x - w / 2 - 12, y - h - 12, w + 24, h + 12);
  const g = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
  g.addColorStop(0, '#2c2a29'); g.addColorStop(.5, '#3a3735'); g.addColorStop(1, '#232120');
  ctx.fillStyle = g; ctx.fillRect(x - w / 2, y - h, w, h);
  ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.lineWidth = 3;
  ctx.strokeRect(x - w / 2 + 12, y - h + 14, w - 24, h * .42); ctx.strokeRect(x - w / 2 + 12, y - h * .5, w - 24, h * .42);
  ctx.strokeStyle = 'rgba(255,255,255,.06)'; ctx.lineWidth = 1.5;
  ctx.strokeRect(x - w / 2 + 14, y - h + 16, w - 28, h * .42 - 4); ctx.strokeRect(x - w / 2 + 14, y - h * .5 + 2, w - 28, h * .42 - 4);
  // pomo y cerradura (roja, lo que lo tiene atrapado)
  ctx.fillStyle = '#777'; ctx.beginPath(); ctx.arc(x + w / 2 - 14, y - h * .48, 5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ff3b36'; ctx.shadowColor = '#ff2020'; ctx.shadowBlur = 12;
  ctx.beginPath(); ctx.arc(x + w / 2 - 14, y - h * .48 + 14, 2.6, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(x + w / 2 - 15, y - h * .48 + 14, 2, 6);
  ctx.shadowBlur = 0;
  // luz cálida de las otras puertas pegando en esta
  const la = lightAmt(t);
  if (la > 0) { ctx.save(); ctx.beginPath(); ctx.rect(x - w / 2, y - h, w, h); ctx.clip(); glowCircle(x - 40, y - 90, 150, '255,180,110', .1 * la); ctx.restore(); }
  ctx.restore();
}
function lightDoor(t, d, refl) {
  const x = d.x, y = FLOOR, w = DW, h = DH;
  const c = doorCrack(t, d), o = doorOpen(t, d), fl = 1 + .04 * Math.sin(t * 7 + x);
  // marco tenue (se ve apenas antes de abrirse)
  if (c <= 0) return;
  ctx.fillStyle = `rgba(13,13,13,${c})`; ctx.fillRect(x - w / 2 - 9, y - h - 9, w + 18, h + 9);
  ctx.strokeStyle = `rgba(255,255,255,${.17 * c})`; ctx.lineWidth = 2; ctx.strokeRect(x - w / 2 - 9, y - h - 9, w + 18, h + 9);
  if (c > 0) {
    // interior de luz
    const L = Math.max(c * .35, o);
    if (!refl) glowCircle(x, y - h / 2, 260 * (.5 + L), '255,190,120', .38 * L * fl);
    const g = ctx.createLinearGradient(0, y - h, 0, y);
    g.addColorStop(0, `rgba(255,236,205,${.95 * L})`); g.addColorStop(1, `rgba(255,205,150,${.95 * L})`);
    ctx.save(); ctx.shadowColor = '#ffd9a0'; ctx.shadowBlur = refl ? 0 : 50 * L;
    ctx.fillStyle = g; ctx.fillRect(x - w / 2, y - h, w, h); ctx.restore();
    // haz de luz que se derrama por el piso hacia el frente
    if (!refl && o > 0) {
      const sp = ctx.createLinearGradient(0, y, 0, y + 260);
      sp.addColorStop(0, `rgba(255,200,140,${.32 * o})`); sp.addColorStop(1, 'rgba(255,200,140,0)');
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = sp;
      ctx.beginPath(); ctx.moveTo(x - w / 2, y); ctx.lineTo(x + w / 2, y); ctx.lineTo(x + w * 1.6, y + 260); ctx.lineTo(x - w * 1.6, y + 260); ctx.fill();
      // rayos volumétricos que salen hacia la derecha (hacia él)
      const rg = ctx.createLinearGradient(x, 0, x + 380, 0);
      rg.addColorStop(0, `rgba(255,200,140,${.14 * o})`); rg.addColorStop(1, 'rgba(255,200,140,0)');
      ctx.fillStyle = rg; ctx.beginPath(); ctx.moveTo(x + w / 2, y - h); ctx.lineTo(x + 380, y - h - 40); ctx.lineTo(x + 380, y + 10); ctx.lineTo(x + w / 2, y); ctx.fill();
      ctx.restore();
    }
  }
  // hoja de la puerta: gira sobre la bisagra izquierda (se acorta y se abre hacia el frente)
  const ang = lerp(0, 1.35, o) + .04 * c, pw = w * Math.cos(ang), skew = 26 * Math.sin(ang);
  ctx.fillStyle = '#2b2927'; ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x - w / 2, y - h); ctx.lineTo(x - w / 2 + pw, y - h - skew * .35); ctx.lineTo(x - w / 2 + pw, y + skew * .25); ctx.lineTo(x - w / 2, y); ctx.closePath(); ctx.fill(); ctx.stroke();
}

window.SCENE = {
  id: '40-otra-puerta', title: 'Deja de tocar *esa puerta*', duration: D, cue: CUE,
  sky: t => .25 * lightAmt(t),
  spot: t => ({ x: lerp(480, 290, smooth(prog(t, CUE.open1, CUE.arrive))), r: lerp(260, 420, lightAmt(t)) }),
  beam: t => ({ x: lerp(470, 300, smooth(prog(t, CUE.open1, CUE.arrive))), a: lerp(.06, .03, lightAmt(t)), w: 140 }),
  flashes: [CUE.enter + .15],
  blackouts: [CUE.pound2 + .05],
  camera: t => ({
    zoom: keyed([[0, 2.75], [1.4, 2.3], [3.2, 2.15], [4.5, 2.35], [6.6, 2.05], [7.0, 2.0], [9.6, 1.45], [10.2, 1.7], [11.4, 1.85], [12.4, 1.6], [15, 1.7], [16.2, 1.95], [D, 1.36]], t),
    x: keyed([[0, 500], [3.2, 498], [6.6, 486], [7.0, 480], [9.6, 318], [10.2, 410], [11.4, 420], [12.4, 380], [15, 280], [16.2, 262], [D, 352]], t),
    y: keyed([[0, FLOOR - 160], [4.5, FLOOR - 170], [6.6, FLOOR - 150], [9.6, FLOOR - 205], [11.4, FLOOR - 180], [15, FLOOR - 185], [16.2, FLOOR - 170], [D, FLOOR - 215]], t),
    shake: .35 * (pulse(t, CUE.pound1, .18) + pulse(t, CUE.pound2, .22)) + .06 * KNOCKS.slice(0, 8).reduce((s, k) => s + pulse(t, k, .08), 0),
  }),
  world(t, refl) {
    closedDoor(t);
    for (const d of DOORS) lightDoor(t, d, refl);
    const p = hero(t);
    const la = lightAmt(t), lit = smooth(prog(t, CUE.look, CUE.shield + .3));
    const into = smooth(prog(t, CUE.enter - .2, CUE.gone));
    if (into >= 1) return;
    if (!refl && la > 0) glowCircle(p.hip.x - 20, p.hip.y - 60, 140, '255,190,120', .22 * la);
    const st = mixStyle(mixStyle(STYLE.hero, STYLE.gray, .35 * smooth(prog(t, CUE.slump, CUE.sink + .5)) * (1 - lit)), WARM, lit);
    figure(p, st, { alpha: 1 - into });
  },
  front(t) {
    // polvo al golpear la puerta
    KNOCKS.forEach((k, i) => burst(FACE + 2, 748, t, k, { n: i >= 8 ? 22 : 8, speed: i >= 8 ? 200 : 110, size: 2, color: '200,190,180', life: .7, seed: 3 + i }));
    for (const k of [CUE.pound1, CUE.pound2]) ring(FACE, 720, t, k, { r: 120, color: '255,60,50', life: .5, width: 5 });
    // entra en la luz: destello y rayos
    const e = bump(t, CUE.enter - .3, D);
    if (e > 0) rays(252, FLOOR - 95, t, e * 1.1, '255,200,140', 16, 620);
    burst(252, FLOOR - 100, t, CUE.enter + .1, { n: 40, speed: 240, size: 3, color: '255,210,150', life: 1.6, gravity: -.2, seed: 41 });
    ring(252, FLOOR - 95, t, CUE.enter + .1, { r: 260, color: '255,210,160', life: 1.1, width: 8 });
    // motas de luz flotando desde las puertas
    const la = lightAmt(t);
    if (la > 0) {
      const g = E.rng(17);
      for (let i = 0; i < 40; i++) {
        const dx = DOORS[i % 3].x + (g() - .5) * 70, sp = 10 + g() * 25, ph = g();
        const yy = FLOOR - ((t * sp + ph * 200) % 200), xx = dx + (t * 18 + ph * 300) % 300;
        ctx.fillStyle = `rgba(255,215,160,${.35 * la * (1 - ((t * 18 + ph * 300) % 300) / 300)})`;
        ctx.beginPath(); ctx.arc(xx, yy, 1.4 + g() * 1.4, 0, Math.PI * 2); ctx.fill();
      }
    }
  },
  events() {
    const ev = E.footsteps(D, t => [t > CUE.go + .2 && t < CUE.arrive + .3 ? { phi: (X0 - walkX(t)) / (4 * 22 * 1.05), size: 1 } : null]);
    KNOCKS.slice(0, 8).forEach(k => ev.push({ t: k, type: 'knock', vol: .9 }));
    ev.push({ t: CUE.pound1, type: 'thud', vol: 1.1 }, { t: CUE.pound1, type: 'knock', vol: 1.2 }, { t: CUE.pound2, type: 'thud', vol: 1.2 }, { t: CUE.pound2, type: 'knock', vol: 1.3 });
    ev.push({ t: CUE.sink + .2, type: 'scuff', vol: .6 }, { t: CUE.sink + .7, type: 'thud', vol: .4 });
    ev.push({ t: 1.55, type: 'heartbeat', vol: .5 }, { t: 3.4, type: 'heartbeat', vol: .6 });
    DOORS.forEach(d => ev.push({ t: d.t, type: 'door', vol: .7 }, { t: d.t + .3, type: 'sparkle', vol: .6 }));
    ev.push({ t: CUE.open1 - .2, type: 'swell', dur: 3 }, { t: CUE.turn, type: 'whoosh', vol: .5 }, { t: CUE.go + 1, type: 'riser', dur: CUE.enter - CUE.go - 1 });
    ev.push({ t: CUE.enter + .1, type: 'chime' }, { t: CUE.enter + .15, type: 'sparkle' });
    return ev;
  },
  music: {
    sections: [
      { t: .2, dur: 4.6, style: 'tension', chords: ['Am', 'Em'], chordLen: 1.2 },
      { t: CUE.slump, dur: CUE.open1 - CUE.slump + .6, style: 'sad', chords: ['Am', 'F', 'Am'], chordLen: 1 },
      { t: CUE.open1 + .3, dur: CUE.go - CUE.open1, style: 'tender', chords: ['F', 'C', 'G'], chordLen: 1.3 },
      { t: CUE.go, dur: D - CUE.go, style: 'hope', chords: ['F', 'C', 'G', 'C'], chordLen: 1.4 },
    ],
    stingers: [{ t: CUE.pound2, type: 'impact' }, { t: CUE.turn + .1, type: 'chime' }, { t: CUE.enter + .1, type: 'bells' }],
    duck: [[CUE.sink + .4, CUE.open1 + .1]],
  },
};
})();
