// 23 — TE SUBEN: en un hoyo, los grises jalan hacia abajo al que intenta salir (dos veces).
// Desde arriba llega alguien, se tumba al borde y le tiende la mano: lo saca. Abrazo arriba; los grises se quedan abajo.
(() => {
const { FLOOR, clamp, lerp, prog, smooth, easeOut, easeInOut, keyed, figure, mix, poseAt, stand, walk, crouch, kneel, sit, mixStyle, STYLE, ctx, glowCircle, burst, ring, rays, sun, rng, pulse, bump } = E;
const D = 20;
const X0 = 250, X1 = 520, PF = FLOOR + 330; // hoyo: paredes y piso
const CUE = { grab1: 1.6, yank1: 2.4, land1: 2.72, leap2: 5.15, peek: 6.55, grab2: 5.9, yank2: 7.45, land2: 8.45,
  helper: 9.7, kneelH: 11.0, prone: 11.6, reach: 12.2, jump: 13.15, clasp: 13.45, rim: 15.2, out: 16.3, hug: 16.9 };

// ── textura de tierra (corte transversal) ──
const earth = (() => {
  const c = document.createElement('canvas'); c.width = 1400; c.height = 700;
  const g = c.getContext('2d'), r = rng(77);
  const gr = g.createLinearGradient(0, 0, 0, 700); gr.addColorStop(0, '#24211e'); gr.addColorStop(.25, '#181614'); gr.addColorStop(1, '#0b0a09');
  g.fillStyle = gr; g.fillRect(0, 0, 1400, 700);
  for (let i = 0; i < 7000; i++) { g.fillStyle = r() > .5 ? `rgba(255,240,220,${.035 * r()})` : `rgba(0,0,0,${.3 * r()})`; g.fillRect(r() * 1400, r() * 700, 1 + r() * 3, 1 + r() * 2); }
  for (let k = 0; k < 18; k++) { // estratos
    const y = 30 + r() * 640; g.strokeStyle = `rgba(0,0,0,${.25 + r() * .2})`; g.lineWidth = 1 + r() * 2;
    g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= 1400; x += 40) g.lineTo(x, y + Math.sin(x * .01 + k) * 6 + (r() - .5) * 4); g.stroke();
  }
  for (let k = 0; k < 60; k++) { // piedras
    const x = r() * 1400, y = r() * 700, rr = 3 + r() * 9;
    g.fillStyle = `rgba(${90 + r() * 40},${85 + r() * 35},${78 + r() * 30},${.25 + r() * .25})`;
    g.beginPath(); g.ellipse(x, y, rr * 1.3, rr, r() * 3, 0, Math.PI * 2); g.fill();
  }
  return c;
})();

// ── poses del protagonista ──
function climbPose(h, ph, o = {}) {
  const hip = { x: 488 - (o.back || 0), y: PF - 94 - h };
  const hand = (k) => {
    let y = hip.y - 138 + 22 * Math.sin(ph + k * Math.PI), x = 512;
    if (y < FLOOR - 4) { y = FLOOR - 4; x = 530 + 10 * k; }   // manos en el borde
    return { x: x - (o.slip || 0) * 6, y: y + (o.slip || 0) * 18 * (k ? 1 : .4) };
  };
  const foot = (k) => ({ x: 515, y: Math.min(PF, hip.y + 84 + 14 * Math.sin(ph + k * Math.PI + 1)) });
  return { hip, s: 1, dir: 1, lean: .1 + (o.lean || 0), tilt: o.tilt ?? -.45, feet: [foot(0), foot(1)],
    arms: [{ target: hand(0) }, { target: hand(1) }] };
}
const fallAir = (x, y) => ({ hip: { x, y }, s: 1, dir: 1, lean: -.75, tilt: -.3,
  feet: [{ x: x + 70, y: y - 20 }, { x: x + 55, y: y + 40 }], arms: [{ ang: Math.PI - .2, bend: .2 }, { ang: Math.PI * .7, bend: .4 }] });
const H1 = t => keyed([[0, 35], [1.6, 104], [2.0, 108], [2.4, 100]], t);
const H2 = t => keyed([[5.15, 0], [5.42, 98], [6.55, 175], [7.0, 170], [7.45, 160]], t);
const struggle = (t, a, b) => bump(t, a, b) * Math.sin(t * 38) * 5;

const WD = E.distance([[0, 0], [17.2, 0], [17.8, 28], [D, 28]], D);
const C0 = { x: 508, y: 966 };
const clasp = t => ({ x: keyed([[CUE.clasp, C0.x], [14.6, 512], [15.2, 560]], t), y: keyed([[CUE.clasp, C0.y], [14.6, 846], [15.2, 820]], t) });
function hang(C, t) {
  const sw = Math.sin(t * 5) * 6;
  const hip = { x: C.x - 12, y: C.y + 150 };
  return { hip, s: 1, dir: 1, lean: .06, tilt: -.5,
    feet: [{ x: hip.x + 10 + sw, y: hip.y + 96 }, { x: hip.x - 6 - sw, y: hip.y + 94 }],
    arms: [{ target: C }, { target: { x: hip.x + 18, y: hip.y - 140 } }] };
}

function heroPose(t) {
  const cl1 = t => climbPose(H1(t) + struggle(t, CUE.grab1, CUE.yank1), t * 7, { tilt: -.55 });
  const cl2 = t => climbPose(H2(t) + struggle(t, CUE.grab2, CUE.yank2) * 1.4, t * 6.5 * (t < CUE.peek ? 1 : .2), { slip: smooth(prog(t, 6.9, 7.45)), tilt: t > CUE.peek - .3 ? -.15 : -.5 });
  const sitP = sit(470, { ground: true, y: PF, lean: -.12, tilt: .1 });
  sitP.arms = [{ ang: -.6, bend: .3 }, { ang: -.4, bend: .3 }];
  const despair = kneel(462, { y: PF, lean: .55, tilt: .75, arms: [{ ang: .1, bend: .05 }, { ang: 0, bend: .05 }] });
  despair.hip.y += 4 * Math.sin(t * 2.2);
  const look = kneel(466, { y: PF, lean: -.05, tilt: -.6, arms: [{ ang: .15, bend: .1 }, { ang: .05, bend: .1 }] });
  const reachUp = stand(492, { y: PF, t, lean: -.05, tilt: -.55 }); reachUp.arms = [{ target: { x: 506, y: PF - 230 } }, { ang: .4, bend: .3 }];
  const crouchJ = crouch(494, { y: PF, amt: .55, tilt: -.6 }); crouchJ.arms = [{ target: { x: 506, y: PF - 200 } }, { ang: -.5, bend: .3 }];
  const jumpP = hang(C0, t);
  const mantle = { hip: { x: 525, y: FLOOR - 18 }, s: 1, dir: 1, lean: 1.05, tilt: -.2,
    feet: [{ x: 512, y: FLOOR + 30 }, { x: 508, y: FLOOR + 60 }], arms: [{ target: { x: 600, y: FLOOR - 4 } }, { target: { x: 575, y: FLOOR - 70 } }] };
  return poseAt(t, [
    [0, cl1], [CUE.yank1, cl1], [CUE.yank1 + .18, fallAir(476, PF - 150)], [CUE.land1, sitP], [3.25, sitP],
    [3.75, crouch(470, { y: PF, amt: .8, tilt: -.2 })], [4.3, stand(474, { y: PF, t, tilt: -.65 })], [4.8, stand(478, { y: PF, t, tilt: -.6 })],
    [CUE.leap2, crouch(482, { y: PF, amt: .7, tilt: -.6 })], [5.42, cl2], [CUE.yank2, cl2],
    [CUE.yank2 + .35, fallAir(478, PF - 165)], [8.2, fallAir(472, PF - 60)], [CUE.land2, kneel(468, { y: PF, lean: .3, tilt: .4 })],
    [9.0, despair], [10.75, despair], [11.35, look], [11.9, look], [12.5, stand(490, { y: PF, t, tilt: -.6 })], [12.85, reachUp],
    [CUE.jump, crouchJ], [CUE.clasp, jumpP], [CUE.clasp + .01, t => hang(clasp(t), t)], [14.6, t => hang(clasp(t), t)],
    [CUE.rim, mantle], [15.75, crouch(556, { amt: .8, tilt: -.1 })], [CUE.out, stand(556, { t, tilt: -.05 })],
    [16.9, stand(558, { t, tilt: .15 })], [17.3, t => walk(558 + WD(t), WD(t), { stride: .8 })],
  ]);
}

function helperPose(t) {
  const d = t => Math.max(0, 720 - keyed([[CUE.helper, 720], [CUE.kneelH, 598]], t, x => x));
  const w = t => walk(720 - d(t), d(t), { dir: -1, tilt: .1 + .3 * prog(t, 10.3, 11) });
  const prone = (C, tl = .75) => ({ hip: { x: 604, y: FLOOR - 13 }, s: 1, dir: -1, lean: Math.PI / 2 - .08, tilt: tl,
    feet: [{ x: 700, y: FLOOR - 6 }, { x: 696, y: FLOOR - 11 }], arms: [{ target: C }, { target: { x: 540, y: FLOOR - 3 } }] });
  const pull1 = C => ({ ...kneel(606, { dir: -1, lean: -.32, tilt: -.1 }), arms: [{ target: C }, { target: { x: C.x + 8, y: C.y + 6 } }] });
  const pull2 = C => ({ ...stand(622, { dir: -1, lean: -.28, tilt: -.05 }), feet: [{ x: 600, y: FLOOR }, { x: 640, y: FLOOR }], arms: [{ target: C }, { target: { x: C.x + 6, y: C.y + 8 } }] });
  return poseAt(t, [
    [CUE.helper, w], [CUE.kneelH, w], [CUE.kneelH + .45, stand(598, { dir: -1, tilt: .55, t })],
    [CUE.prone, kneel(602, { dir: -1, lean: .5, tilt: .6 })], [12.0, prone({ x: 530, y: FLOOR - 40 }, .8)], [CUE.reach, prone(C0, .9)],
    [CUE.clasp, prone(C0, .9)], [14.1, t => pull1(clasp(t))], [14.6, t => pull1(clasp(t))], [CUE.rim, t => pull2(clasp(t))],
    [CUE.out, stand(618, { dir: -1, t, tilt: 0 })],
    [16.8, { ...stand(616, { dir: -1, t, tilt: .1 }), arms: [{ target: { x: 566, y: 738 } }, { ang: .1, bend: .3 }] }],
    [17.05, stand(614, { dir: 1, t })], [17.3, t => walk(614 + WD(t), WD(t) + 30, { stride: .8 })],
  ]);
}

// los grises del hoyo
const GR = [{ x: 445, role: 1 }, { x: 405, role: 2 }, { x: 345, role: 0 }, { x: 290, role: 3 }];
function grayPose(g, i, t, heroSl) {
  const look = clamp((heroSl.head.y < PF - 200) ? -.55 : -.2, -.7, .2);
  let p;
  if (g.role === 3) { p = sit(g.x, { ground: true, y: PF, dir: 1, tilt: lerp(.2, -.4, smooth(prog(t, 5.5, 6.5))), lean: .02 }); p.arms = [{ ang: .9, bend: .9 }, { ang: .8, bend: 1 }]; }
  else p = stand(g.x, { y: PF, t: t + i, tilt: look, lean: .02 });
  const grabbing = (t > 1.25 && t < CUE.land1) || (t > 5.6 && t < CUE.yank2 + .25) || (t > 13.2 && t < 14.4);
  if (g.role === 1 || g.role === 2) {
    const k = g.role === 1 ? 0 : 1;
    const ft = heroSl.legs[k][2];
    const yank = bump(t, CUE.yank1 - .1, CUE.yank1 + .35) + bump(t, CUE.yank2 - .1, CUE.yank2 + .45);
    const pre = smooth(prog(t, 1.0, 1.4)) * (1 - smooth(prog(t, CUE.land1, 3.0))) + smooth(prog(t, 5.3, 5.7)) * (1 - smooth(prog(t, CUE.land2 - .5, CUE.land2)))
      + smooth(prog(t, 13.1, 13.4)) * (1 - smooth(prog(t, 14.3, 14.8)));
    p.hip.x += (g.role === 1 ? 32 : 70) * pre; p.feet.forEach(f => f.x += (g.role === 1 ? 30 : 66) * pre);
    p.lean = lerp(p.lean, -.15, pre) - .25 * yank; p.hip.y += 10 * yank;
    if (t > 13.2) { const j = bump(t, 13.45, 14.0); p.hip.y -= 22 * j; p.feet.forEach(f => f.y -= 22 * j); }
    if (grabbing && pre > .2) {
      const gr = { x: ft.x - 4, y: ft.y + 6 };
      p.arms = [{ target: gr }, { target: { x: gr.x - 6, y: gr.y + 16 } }];
    } else if (pre > 0) p.arms = [{ ang: Math.PI - .4, bend: .2 }, { ang: Math.PI - .6, bend: .2 }];
  } else if (g.role === 0) {
    // el que se ríe / señala
    const laugh = bump(t, 2.8, 4.2) + bump(t, 8.5, 10.2);
    p.hip.y += Math.abs(Math.sin(t * 16)) * 3 * laugh; p.lean -= .1 * laugh;
    p.arms = [{ ang: lerp(.1, 1.45, laugh), bend: .1 }, { ang: .9, bend: 1.4 }];
    p.tilt = lerp(p.tilt, -.3, laugh);
  }
  if (t > 14.6) { p.tilt = lerp(p.tilt, -.6, smooth(prog(t, 14.6, 15.4))); }
  return p;
}

function drawGround(t) {
  ctx.save();
  // tierra en corte (fuera del hoyo) y hoyo oscuro
  ctx.beginPath(); ctx.rect(-600, FLOOR, 1900, 900); ctx.clip();
  ctx.drawImage(earth, -500, FLOOR); ctx.drawImage(earth, 900, FLOOR, 400, 700);
  const g = ctx.createLinearGradient(0, FLOOR, 0, PF + 40);
  g.addColorStop(0, '#0b0b0c'); g.addColorStop(1, '#030303');
  ctx.fillStyle = g; ctx.fillRect(X0, FLOOR - 1, X1 - X0, PF - FLOOR + 1);
  // pared del fondo: grietas tenues
  const r = rng(4); ctx.strokeStyle = 'rgba(255,255,255,.035)'; ctx.lineWidth = 1.5;
  for (let k = 0; k < 9; k++) { let x = X0 + 20 + r() * (X1 - X0 - 40), y = FLOOR + 20 + r() * 260; ctx.beginPath(); ctx.moveTo(x, y); for (let j = 0; j < 5; j++) { x += (r() - .5) * 40; y += r() * 30; ctx.lineTo(x, y); } ctx.stroke(); }
  // luz fría al fondo del hoyo
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(385, PF); ctx.scale(1, .3);
  glowCircle(0, 0, 190, '130,130,150', .16); ctx.restore();
  // paredes con borde
  for (const [x, s] of [[X0, 1], [X1, -1]]) {
    const wg = ctx.createLinearGradient(x, 0, x + 16 * s, 0);
    wg.addColorStop(0, 'rgba(120,112,100,.5)'); wg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = wg; ctx.fillRect(Math.min(x, x + 16 * s), FLOOR, 16, PF - FLOOR);
  }
  // piso del hoyo
  ctx.fillStyle = '#16140f'; ctx.fillRect(X0, PF, X1 - X0, 60);
  ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(X0, PF, X1 - X0, 1.5);
  ctx.restore();
  // superficie del suelo: línea iluminada y bordes del hoyo
  const fl = ctx.createLinearGradient(-200, 0, 900, 0);
  fl.addColorStop(0, 'rgba(255,255,255,0)'); fl.addColorStop(.5, 'rgba(255,255,255,.55)'); fl.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = fl; ctx.fillRect(-200, FLOOR - 1, X0 + 200, 3); ctx.fillRect(X1, FLOOR - 1, 700, 3);
  ctx.fillStyle = '#cfc6b8'; ctx.fillRect(X0 - 5, FLOOR - 2, 7, 5); ctx.fillRect(X1 - 2, FLOOR - 2, 7, 5);
}

// rayo de luz de esperanza que baja al hoyo
function hopeLight(t) {
  const a = smooth(prog(t, 10.3, 12.3)) * (1 - .5 * smooth(prog(t, 17, 19)));
  if (a <= 0) return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createLinearGradient(0, FLOOR - 400, 0, PF);
  g.addColorStop(0, `rgba(255,245,230,${.0})`); g.addColorStop(.45, `rgba(255,245,230,${.07 * a})`); g.addColorStop(1, `rgba(255,245,230,${.14 * a})`);
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(560, FLOOR - 400); ctx.lineTo(640, FLOOR - 400); ctx.lineTo(530, PF); ctx.lineTo(400, PF); ctx.fill();
  ctx.restore();
}

window.SCENE = {
  id: '23-te-suben', title: 'Rodéate de quienes *te suben*', duration: D, cue: CUE,
  reflection: false, beam: false,
  spot: t => ({ x: 600, r: 300, a: .06 * smooth(prog(t, 9, 11)) }),
  sky: t => .35 * smooth(prog(t, 15, 19)),
  flashes: [CUE.clasp], blackouts: [CUE.land1, CUE.land2],
  camera: t => {
    const sh = .5 * pulse(t, CUE.land1, .3) + .7 * pulse(t, CUE.land2, .35) + .25 * pulse(t, CUE.clasp, .25) + .12 * bump(t, CUE.grab2, CUE.yank2) * (t > 6.6 ? 1 : 0);
    return {
      zoom: keyed([[0, 1.72], [1.5, 1.95], [2.3, 1.9], [3, 1.78], [5.2, 1.85], [6.5, 2.15], [7.4, 2.1], [8.4, 1.85], [9.4, 2.2], [9.9, 2.15], [10.8, 1.6], [12.0, 1.62], [13.2, 1.7], [13.6, 1.9], [15.0, 1.85], [16.6, 1.75], [D, 1.5]], t),
      x: keyed([[0, 420], [2.3, 440], [3, 410], [5.2, 440], [6.5, 480], [8.4, 430], [9.4, 455], [9.9, 465], [10.8, 500], [12.0, 500], [13.6, 520], [15.0, 540], [16.6, 560], [D, 515]], t),
      y: keyed([[0, 1010], [2.3, 1060], [3, 1080], [5.2, 1060], [6.5, 960], [7.4, 975], [8.4, 1080], [9.4, 1130], [9.9, 1110], [10.8, 905], [12.0, 925], [13.6, 935], [15.0, 860], [16.6, 800], [D, 860]], t),
      shake: sh,
    };
  },
  backdrop(t) {
    // el mundo de arriba tiene luz; el hoyo no
    const up = .5 + .5 * smooth(prog(t, 10, 12));
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(430, FLOOR); ctx.scale(1.8, .55);
    glowCircle(0, 0, 360, '235,228,220', .26 * up); ctx.restore();
    const r = smooth(prog(t, 14.5, 19.5));
    if (r > 0) sun(650, lerp(1000, 690, r), 46, r);
  },
  world(t) {
    drawGround(t);
    hopeLight(t);
    const hp = heroPose(t);
    const hsl = E.solve(hp);
    const fadeG = smooth(prog(t, 15.5, 18.5));
    GR.forEach((g, i) => figure(grayPose(g, i, t, hsl), mixStyle(STYLE.gray, STYLE.dim, fadeG * .7)));
    // enlace de manos (rojo): brilla desde que se tocan
    const C = t >= CUE.clasp ? clasp(t) : C0;
    const link = smooth(prog(t, CUE.clasp - .05, CUE.clasp + .1)) * (1 - smooth(prog(t, 15.4, 16)));
    let hep = t > CUE.helper ? helperPose(t) : null;
    if (t > 17.25) {
      const k = smooth(prog(t, 17.25, 17.5));
      const hd = E.holdPoint(E.shoulderOf(hp), E.ARM, E.shoulderOf(hep), E.ARM);
      if (k > .5) { hp.arms = [{ target: hd }, hp.arms[1]]; hep.arms = [hep.arms[0], { target: hd, elbowBack: true }]; }
    }
    figure(hp, STYLE.hero);
    if (hep) figure(hep, STYLE.hero);
    if (link > 0) {
      glowCircle(C.x, C.y, 70, '255,50,40', .55 * link);
      glowCircle(C.x, C.y, 22, '255,120,100', .8 * link);
    }
    // gesto de la mano tendida antes de que la tome: pulso rojo
    const wait = smooth(prog(t, CUE.reach, CUE.reach + .3)) * (1 - smooth(prog(t, CUE.clasp - .1, CUE.clasp)));
    if (wait > 0) glowCircle(C0.x, C0.y, 40 + 12 * Math.sin(t * 8), '255,50,40', .45 * wait);
    ring(C0.x, C0.y, t, CUE.clasp, { color: '255,70,60', r: 190, width: 8, life: 1 });
    burst(C0.x, C0.y, t, CUE.clasp, { n: 36, speed: 300, seed: 5, life: 1.3 });
    // tierra que cae cuando resbala
    for (const [t0, x] of [[CUE.yank1, 525], [7.1, 532], [CUE.yank2, 540]]) burst(x, FLOOR, t, t0, { n: 14, speed: 60, size: 2.5, color: '170,160,140', seed: t0 * 10, life: 1.1, gravity: 2.5 });
  },
  events() {
    const ev = [];
    for (let t = .2; t < 1.6; t += .38) ev.push({ t, type: 'scuff', vol: .5 });
    for (let t = 5.5; t < 6.5; t += .3) ev.push({ t, type: 'scuff', vol: .55 });
    const hs = E.footsteps(D, t => [t > CUE.helper && t < CUE.kneelH - .1 ? { phi: (720 - keyed([[CUE.helper, 720], [CUE.kneelH, 598]], t, x => x)) / 88, size: 1 } : null]);
    return ev.concat(hs, [
      { t: .02, type: 'whoosh', vol: .8 }, { t: .1, type: 'heartbeat', vol: .8 }, { t: .55, type: 'heartbeat', vol: .6 },
      { t: CUE.grab1, type: 'snap', vol: .6 }, { t: CUE.yank1, type: 'whoosh', up: false }, { t: CUE.land1, type: 'thud' },
      { t: CUE.leap2, type: 'whoosh', vol: .7 }, { t: CUE.grab2, type: 'snap', vol: .7 }, { t: CUE.peek, type: 'swell', dur: 1 },
      { t: 7.0, type: 'heartbeat', vol: .7 }, { t: CUE.yank2, type: 'whoosh', up: false, dur: .9 }, { t: CUE.land2, type: 'boom' },
      { t: 8.6, type: 'crowd', dur: 1.6, vol: .25 },
      { t: 10.4, type: 'chime' }, { t: CUE.prone, type: 'slide', vol: .5 }, { t: CUE.jump, type: 'whoosh' },
      { t: CUE.clasp, type: 'impact' }, { t: CUE.clasp, type: 'sparkle' }, { t: 13.6, type: 'riser', dur: 1.6 },
      { t: CUE.rim, type: 'scuff' }, { t: CUE.out, type: 'step' }, { t: 16.5, type: 'swell', dur: 2 },
    ]);
  },
  music: {
    sections: [
      { t: .3, dur: 8.2, style: 'tension', chords: ['Am', 'Am', 'F', 'E'], chordLen: 1.2 },
      { t: CUE.land2 + .2, dur: 3.6, style: 'sad', chords: ['Am', 'F', 'Dm', 'E'], chordLen: 1.0 },
      { t: 12.2, dur: 1.3, style: 'build', chords: ['F', 'G'], chordLen: .6 },
      { t: CUE.clasp, dur: D - CUE.clasp, style: 'hope', chords: ['F', 'C', 'G', 'C'], chordLen: 1.6 },
    ],
    stingers: [{ t: CUE.land2, type: 'boom' }, { t: CUE.clasp, type: 'bells' }],
    duck: [[CUE.land2 + .1, 9.6], [12.9, CUE.clasp]],
  },
};
})();
