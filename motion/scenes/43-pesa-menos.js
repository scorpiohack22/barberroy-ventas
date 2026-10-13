// 43 — CON AYUDA PESA MENOS: empuja solo una roca enorme cuesta arriba, resbala y casi lo aplasta.
// Llega alguien y empuja con él. Suben, la roca se asienta en la cima, sale el sol rojo, chocan las manos.
(() => {
const { FLOOR, clamp, lerp, prog, smooth, easeOut, easeIn, easeInOut, keyed, bump, pulse, stand, walk, run, kneel, mix, poseAt,
        figure, STYLE, glowCircle, ctx, burst, ring, rays, sun } = E;
const D = 19;
const CUE = { slip: 3.15, crushed: 3.75, arrive: 7.4, together: 8.3, crest: 13.8, settle: 14.6, sunUp: 15.0, look: 15.4, five: 16.25, cheer: 17.0 };
const K = .42, TH = Math.atan(K), XS = 760, YS = FLOOR - XS * K, R = 92;
const ground = x => x < XS ? FLOOR - x * K : YS;
// ── roca: u = punto de contacto con el piso ──
const U = [[0, 150], [CUE.slip - .05, 226], [CUE.slip + .1, 228], [CUE.crushed, 146], [6.2, 138], [CUE.arrive + .05, 136], [CUE.together, 146],
           [CUE.crest, 760], [CUE.settle, 880], [CUE.settle + .4, 896], [D, 896]];
const rockU = t => keyed(U, t);
function rockC(u) {
  const a = { x: u - R * Math.sin(TH), y: ground(u) - R * Math.cos(TH) }, b = { x: u, y: YS - R };
  const k = smooth(prog(u, XS - 50, XS + 30));
  return { x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k) };
}
// pies pegados a la ladera
function onSlope(p) {
  const base = p._base ?? FLOOR;
  p.feet = p.feet.map(f => ({ x: f.x, y: ground(f.x) - (base - f.y) }));
  return p;
}
// pose de empujar: cadera detrás de la roca, torso muy inclinado, manos sobre la roca
function push(hx, d, o = {}) {
  const c = rockC(rockU(o.t));
  const gy = ground(hx);
  const p = walk(hx, d, { lean: o.lean ?? .78, tilt: o.tilt ?? -.35, stride: o.stride ?? 1.15, y: gy, stand: o.stand ?? 86, freeze: o.freeze || 0 });
  p._base = gy;
  const a1 = o.hand1 ?? .55, a2 = o.hand2 ?? .2;
  p.arms = [{ target: { x: c.x - R * Math.cos(a1) + 3, y: c.y - R * Math.sin(a1) + 3 } }, { target: { x: c.x - R * Math.cos(a2) + 3, y: c.y - R * Math.sin(a2) } }];
  return onSlope(p);
}
const back = (t, off) => rockU(t) - R * Math.sin(TH) - R - off; // x de cadera detrás de la roca
// slow motion en el resbalón
function heroA(t) {
  const strain = Math.sin(t * 38) * 1.2;
  const pushing = t2 => { const x = back(t2, 96); const p = push(x, x * 1.2, { t: t2, lean: .8 + .04 * Math.sin(t2 * 4), tilt: -.15, hand1: -.05, hand2: -.32 }); p.hip.x += strain * .5; return p; };
  const slipped = t2 => {
    const c = rockC(rockU(t2)), hx = c.x - R - 62, gy = ground(hx);
    const p = { hip: { x: hx, y: gy - 50 }, s: 1, dir: 1, lean: .95, tilt: .45,
                feet: [{ x: hx + 30, y: ground(hx + 30) }, { x: hx - 56, y: ground(hx - 56) - 2 }] };
    p.arms = [{ target: { x: c.x - R * .97, y: c.y + R * .05 } }, { target: { x: c.x - R * .85, y: c.y + R * .45 } }];
    p.hip.x += Math.sin(t2 * 46) * 1.6; return p;
  };
  const together = t2 => { const x = back(t2, 96); return push(x, x * 1.25, { t: t2, lean: .78, tilt: -.15, hand1: .05, hand2: -.22 }); };
  const xT = XS - 6;
  const tired = t2 => { const p = stand(xT, { t: t2, y: YS, lean: .55, tilt: .1 }); const k = p.hip; p.arms = [{ target: { x: k.x + 26, y: YS - 52 } }, { target: { x: k.x + 18, y: YS - 50 } }]; p.hip.y += 8 + 3 * Math.sin(t2 * 7); return p; };
  const look = t2 => { const p = stand(xT, { t: t2, y: YS, lean: -.05, tilt: -.3 }); p.arms = [{ ang: .2, bend: .3 }, { ang: 0, bend: .3 }]; return p; };
  const five = t2 => { const p = stand(xT - 4, { t: t2, y: YS, dir: -1, lean: -.08, tilt: -.25 }); p.arms = [{ target: { x: XS - 48, y: YS - 200 } }, { ang: .1, bend: .3 }]; return p; };
  const cheer = t2 => { const p = E.cheer(xT, { y: YS }); p.hip.y += Math.sin(t2 * 6) * 2; return p; };
  return poseAt(t, [[0, pushing], [CUE.slip, pushing], [CUE.slip + .45, slipped], [CUE.arrive + .3, slipped], [CUE.together, together], [CUE.crest - .3, together],
                    [CUE.settle, tired], [CUE.look, tired], [CUE.look + .5, look], [CUE.five - .35, look], [CUE.five - .05, five], [CUE.five + .5, five], [CUE.cheer, cheer], [D, cheer]]);
}
// B está un poco más cerca de cámara (más abajo en pantalla) para separarlo de A
function deep(p) { const k = p.hip.y; p.feet = p.feet.map(f => ({ x: f.x, y: f.y + BDY })); p.hip = { x: p.hip.x, y: p.hip.y + BDY }; if (p.arms) p.arms = p.arms.map(a => a.target ? { ...a, target: { x: a.target.x, y: a.target.y + BDY * .5 } } : a); return p; }
// el que llega a ayudar: corre ladera arriba
const BOFF = 66, BDY = 40;
const bRunX = t => keyed([[5.4, -300], [CUE.arrive - .35, back(CUE.arrive, BOFF) - 24], [CUE.arrive, back(CUE.arrive, BOFF)]], t, p => p);
function heroB(t) {
  const running = t2 => { const x = bRunX(t2), p = run(x, (x + 300) * 1.1, { y: ground(x), lean: .42 }); p._base = ground(x); return deep(onSlope(p)); };
  const together = t2 => { const x = back(t2, BOFF); return deep(push(x, x * 1.25 + 30, { t: t2, lean: .95, tilt: -.25, hand1: -.45, hand2: -.62, stand: 74 })); };
  const xT = XS - 90;
  const tired = t2 => { const p = stand(xT, { t: t2 + 1, y: YS, lean: .5, tilt: .15 }); const k = p.hip; p.arms = [{ target: { x: k.x + 24, y: YS - 50 } }, { target: { x: k.x + 16, y: YS - 48 } }]; p.hip.y += 8 + 3 * Math.sin(t2 * 7 + 1); return p; };
  const look = t2 => { const p = stand(xT, { t: t2 + 1, y: YS, lean: -.05, tilt: -.3 }); p.arms = [{ ang: .15, bend: .3 }, { ang: 0, bend: .3 }]; return p; };
  const five = t2 => { const p = stand(xT + 4, { t: t2, y: YS, lean: -.08, tilt: -.25 }); p.arms = [{ target: { x: XS - 48, y: YS - 200 } }, { ang: .1, bend: .3 }]; return p; };
  const cheer = t2 => { const p = E.cheer(xT, { y: YS }); p.hip.y += Math.sin(t2 * 6 + 1) * 2; return p; };
  return poseAt(t, [[5.6, running], [CUE.arrive - .1, running], [CUE.arrive + .25, together], [CUE.crest - .3, together],
                    [CUE.settle, tired], [CUE.look + .1, tired], [CUE.look + .6, look], [CUE.five - .35, look], [CUE.five - .05, five], [CUE.five + .5, five], [CUE.cheer, cheer], [D, cheer]]);
}

// ── dibujo ──
const ROCKPTS = (() => { const g = E.rng(77); return Array.from({ length: 16 }, (_, i) => 1 + (g() - .5) * .13); })();
function rock(t) {
  const u = rockU(t), c = rockC(u), rot = (u - 150) / R;
  ctx.save(); ctx.translate(c.x, c.y);
  // sombra/oclusión sobre la ladera
  ctx.save(); ctx.rotate(-TH); ctx.scale(1, .2); glowCircle(0, R * 5, R * 1.2, '0,0,0', .7); ctx.restore();
  ctx.save(); ctx.rotate(rot);
  ctx.beginPath();
  ROCKPTS.forEach((k, i) => { const a = i / 16 * Math.PI * 2; ctx.lineTo(Math.cos(a) * R * k, Math.sin(a) * R * k); });
  ctx.closePath(); ctx.save(); ctx.clip();
  ctx.rotate(-rot);
  const g = ctx.createRadialGradient(-R * .4, -R * .45, R * .1, 0, 0, R * 1.15);
  g.addColorStop(0, '#8a837a'); g.addColorStop(.5, '#57524c'); g.addColorStop(1, '#1a1817');
  ctx.fillStyle = g; ctx.fillRect(-R * 1.2, -R * 1.2, R * 2.4, R * 2.4);
  ctx.rotate(rot);
  // grietas y manchas (giran con la roca)
  ctx.strokeStyle = 'rgba(20,18,16,.55)'; ctx.lineWidth = 2.2;
  ctx.beginPath(); ctx.moveTo(-R * .5, -R * .2); ctx.lineTo(-R * .1, -R * .05); ctx.lineTo(R * .05, R * .35); ctx.moveTo(-R * .1, -R * .05); ctx.lineTo(R * .4, -R * .4);
  ctx.moveTo(R * .2, R * .6); ctx.lineTo(R * .5, R * .2); ctx.stroke();
  ctx.fillStyle = 'rgba(0,0,0,.18)'; for (const [x, y, r] of [[-.3, .45, .16], [.45, .05, .12], [-.55, -.5, .1], [.1, -.6, .09]]) { ctx.beginPath(); ctx.arc(x * R, y * R, r * R, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();
  ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = 2; ctx.stroke();
  ctx.restore(); ctx.restore();
}
function hill(t) {
  ctx.save();
  const g = ctx.createLinearGradient(0, YS - 40, 0, FLOOR + 300);
  g.addColorStop(0, '#1e1d1c'); g.addColorStop(1, '#050505');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.moveTo(-600, ground(-600)); ctx.lineTo(XS, YS); ctx.lineTo(2000, YS); ctx.lineTo(2000, FLOOR + 900); ctx.lineTo(-600, FLOOR + 900); ctx.closePath(); ctx.fill();
  // borde iluminado
  ctx.strokeStyle = 'rgba(255,255,255,.28)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-600, ground(-600)); ctx.lineTo(XS, YS); ctx.lineTo(2000, YS); ctx.stroke();
  // piedritas en la ladera
  const r = E.rng(5);
  for (let i = 0; i < 40; i++) { const x = -500 + r() * 1700, y = ground(x) + 4 + r() * 30; E.stone(x, y, 2 + r() * 4, i, `rgba(120,115,110,${.3 + r() * .3})`); }
  ctx.restore();
}
const sunY = t => lerp(YS + 60, YS - 270, easeOut(prog(t, CUE.sunUp, CUE.sunUp + 2.6)));
// grava que rueda cuando resbala
function gravel(t) {
  const dt = t - CUE.slip; if (dt < 0 || dt > 2.2) return;
  const g = E.rng(31);
  for (let i = 0; i < 16; i++) {
    const x0 = back(CUE.slip, 10) + g() * 30, sp = 120 + g() * 220, x = x0 - sp * dt * Math.cos(TH), bounce = Math.abs(Math.sin(dt * (8 + g() * 6))) * 8 * (1 - dt / 2.2);
    E.stone(x, ground(x) - 3 - bounce, 2 + g() * 3, i, `rgba(170,160,150,${1 - dt / 2.2})`);
  }
}

window.SCENE = {
  id: '43-pesa-menos', title: 'Con ayuda pesa *menos*', duration: D, cue: CUE,
  reflection: false,
  sky: t => .45 * smooth(prog(t, CUE.slip, CUE.slip + .3)) * (1 - smooth(prog(t, CUE.arrive, CUE.together))) + .9 * smooth(prog(t, CUE.sunUp, CUE.sunUp + 2)),
  spot: t => ({ x: rockU(t), r: 300, a: .05 }),
  beam: t => ({ x: rockC(rockU(t)).x - 60, a: .05 * (1 - smooth(prog(t, CUE.sunUp, CUE.sunUp + 1.5))), w: 170 }),
  flashes: [],
  blackouts: [CUE.slip + .12],
  camera: t => {
    const c = rockC(rockU(t));
    const fx = keyed([[0, -95], [CUE.slip, -90], [CUE.crushed, -80], [5.6, -150], [6.4, -170], [CUE.arrive, -110], [CUE.together, -95], [11, -80], [CUE.crest, -60], [CUE.settle, -70], [CUE.five, -70], [D, -40]], t);
    const fy = keyed([[0, -60], [CUE.crushed, -40], [5.6, -40], [CUE.together, -60], [11, -90], [CUE.settle, -110], [CUE.look, -150], [D, -170]], t);
    const z = keyed([[0, 2.15], [CUE.slip, 1.95], [CUE.crushed, 2.05], [5.4, 1.95], [6.4, 1.4], [CUE.arrive, 1.75], [CUE.together, 1.95], [10.5, 1.5], [CUE.crest, 1.65], [CUE.settle, 1.75], [CUE.look + .3, 1.5], [CUE.five, 1.75], [CUE.cheer, 1.6], [D, 1.38]], t);
    const lock = keyed([[0, 1], [CUE.settle, 1], [CUE.settle + .6, 0], [D, 0]], t);
    const fixed = { x: XS + 50, y: YS - 160 };
    return { x: lerp(fixed.x, c.x + fx, lock), y: lerp(fixed.y + fy * 0, c.y + fy, lock), zoom: z,
             shake: .25 * pulse(t, CUE.slip + .2, .5) + .35 * pulse(t, CUE.crushed, .3) + .04 * (t < CUE.slip ? 1 : 0) + .2 * pulse(t, CUE.arrive, .25) + .25 * pulse(t, CUE.settle, .3) };
  },
  backdrop(t) {
    if (t > CUE.sunUp - .2) {
      const sy = sunY(t);
      rays(XS + 190, sy, t, smooth(prog(t, CUE.sunUp + .6, CUE.sunUp + 2.5)), '255,70,50', 16, 900);
      sun(XS + 190, sy, 58);
    }
  },
  world(t) {
    hill(t);
    gravel(t);
    const b = t > 5.6 ? heroB(t) : null;
    rock(t);
    const lastPush = t < CUE.crest + .2;
    if (b && !lastPush) figure(b, STYLE.hero);
    const a = heroA(t);
    const danger = smooth(prog(t, CUE.slip, CUE.crushed)) * (1 - smooth(prog(t, CUE.arrive, CUE.together)));
    figure(a, E.mixStyle(STYLE.hero, STYLE.gray, Math.max(.4 * danger, lastPush && b && t > CUE.arrive ? .5 * smooth(prog(t, CUE.arrive, CUE.together)) : 0)));
    if (b && lastPush) figure(b, STYLE.hero);
  },
  front(t) {
    // gotas de sudor / esfuerzo
    const a = E.solve(heroA(t));
    if (t < CUE.crest) for (let i = 0; i < 3; i++) {
      const k = ((t * 1.3 + i / 3) % 1);
      ctx.fillStyle = `rgba(220,230,255,${.6 * (1 - k)})`; ctx.beginPath(); ctx.arc(a.head.x - 14 - 20 * k, a.head.y - 10 + 40 * k * k, 2.4, 0, Math.PI * 2); ctx.fill();
    }
    // llega la ayuda: manos sobre la roca
    const c = rockC(rockU(CUE.arrive + .25));
    ring(c.x - R, c.y, t, CUE.arrive + .25, { r: 150, color: '255,255,255', life: .7 });
    burst(c.x - R, c.y, t, CUE.arrive + .25, { n: 20, speed: 180, size: 2.5, color: '255,255,255', life: .8, seed: 8 });
    // polvo al asentarse la roca
    const cs = rockC(rockU(CUE.settle));
    burst(cs.x, YS - 4, t, CUE.settle, { n: 30, speed: 160, size: 3, color: '170,160,150', life: 1.2, gravity: .4, seed: 12 });
    ring(cs.x, YS, t, CUE.settle, { r: 180, flat: .25, color: '200,190,180', life: .9 });
    // choque de manos
    const fp = { x: XS - 48, y: YS - 204 };
    burst(fp.x, fp.y, t, CUE.five, { n: 44, speed: 280, size: 3.5, color: '255,70,55', life: 1.4, seed: 21 });
    ring(fp.x, fp.y, t, CUE.five, { r: 220, color: '255,80,60', life: .9, width: 8 });
    if (t > CUE.five) glowCircle(fp.x, fp.y, 90, '255,80,60', .5 * (1 - prog(t, CUE.five, CUE.five + .8)));
  },
  events() {
    const ev = E.footsteps(D, t => {
      const a = t < CUE.crest ? back(t, 96) * 1.2 / (4 * 22 * 1.15) : 0;
      const b = t > 5.6 && t < CUE.arrive ? (bRunX(t) + 300) * 1.1 / (4 * 34) : t > CUE.arrive && t < CUE.crest ? (back(t, BOFF) * 1.25 + 30) / (4 * 22 * 1.15) : 0;
      return [t < CUE.slip || (t > CUE.together && t < CUE.crest) ? { phi: a, size: 1.1, vol: .9 } : null, b ? { phi: b, size: 1, vol: 1 } : null];
    });
    ev.push({ t: .05, type: 'rumble', dur: 3.2, vol: .8 }, { t: .1, type: 'thud', vol: .7 });
    for (const k of [.9, 1.9, 2.7]) ev.push({ t: k, type: 'scuff', vol: .5 });
    ev.push({ t: CUE.slip, type: 'scuff', vol: 1.2 }, { t: CUE.slip + .05, type: 'slide', dur: .6 }, { t: CUE.slip + .1, type: 'rumble', dur: 1.2 }, { t: CUE.crushed, type: 'thud', vol: 1.2 }, { t: CUE.crushed, type: 'impact' });
    for (let k = 0; k < 5; k++) ev.push({ t: CUE.crushed + .3 + k * .65, type: 'heartbeat', vol: .9 - k * .1 });
    ev.push({ t: 5.6, type: 'whoosh', vol: .5 }, { t: CUE.arrive + .25, type: 'thud', vol: 1 }, { t: CUE.arrive + .3, type: 'sparkle', vol: .6 });
    ev.push({ t: CUE.together, type: 'rumble', dur: CUE.crest - CUE.together, vol: .7 }, { t: CUE.settle, type: 'boom', vol: .8 }, { t: CUE.sunUp + .2, type: 'swell', dur: 2.2 });
    ev.push({ t: CUE.five, type: 'snap', vol: .8 }, { t: CUE.five + .05, type: 'sparkle' }, { t: CUE.cheer, type: 'cheer', dur: 2 });
    return ev;
  },
  music: {
    sections: [
      { t: 0, dur: CUE.slip + .1, style: 'tension', chords: ['Am', 'Em'], chordLen: 1 },
      { t: CUE.crushed, dur: CUE.arrive - CUE.crushed, style: 'sad', chords: ['Am', 'F', 'Am'], chordLen: 1.1 },
      { t: CUE.arrive, dur: CUE.crest - CUE.arrive, style: 'build', chords: ['F', 'G', 'Am', 'C'], chordLen: .8 },
      { t: CUE.settle, dur: D - CUE.settle, style: 'epic', chords: ['F', 'C', 'G', 'C'], chordLen: 1.2 },
    ],
    stingers: [{ t: CUE.crushed, type: 'impact' }, { t: CUE.arrive + .25, type: 'chime' }, { t: CUE.settle, type: 'boom' }, { t: CUE.five, type: 'bells' }],
    duck: [[CUE.slip + .1, CUE.crushed]],
  },
};
})();
