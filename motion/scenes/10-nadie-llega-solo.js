// 10 — NADIE LLEGA SOLO: uno se tiende como puente sobre el abismo; los demás cruzan sobre él.
// Al final él resbala y queda colgando… y los tres forman una cadena para sacarlo. Abrazo.
(() => {
const { FLOOR, ctx, clamp, lerp, prog, smooth, easeOut, easeIn, easeInOut, keyed, bump, pulse, rng, walk, stand, kneel, crouch, lie, cheer, mix, poseAt,
  shoulderOf, figure, mixStyle, STYLE, glowCircle, burst, ring, rays, heart, stone } = E;
const D = 20;
const PX0 = 250, PX1 = 452, DEPTH = 520, BX = 324;
const CUE = { edge: 1.45, crumble: 1.7, look: 3.2, decide: 4.0, kneel: 4.4, dive: 4.95, slam: 5.35, cross1: 6.2, cross2: 7.2, cross3: 8.2, across: 10.2,
  slip: 10.9, hang: 11.45, dive3: 11.55, catch: 11.95, chain2: 12.15, chain1: 12.4, pull: 12.6, out: 13.9, kneelUp: 14.4, hug: 15.0 };
// cámara lenta en el clavado y en la caída
const slowT = t => {
  const seg = [[CUE.dive, CUE.slam + .1, .45], [CUE.slip, CUE.hang + .1, .5]];
  let out = t;
  for (const [a, b, k] of seg) if (t > a) out -= (Math.min(t, b) - a) * (1 - k);
  return out + (t > CUE.dive ? (CUE.slam + .1 - CUE.dive) * (1 - .45) : 0) * 0 ;
};
const FRIEND = mixStyle(STYLE.hero, STYLE.gray, .55);

// superficie para caminar: piso, o la espalda del puente
const surf = (x, t) => {
  const on = smooth(prog(x, BX - 112, BX - 84)) * (1 - smooth(prog(x, PX1 - 10, PX1 + 12)));
  const head = bump(x, BX + 86, BX + 140) * 16;
  return FLOOR - (22 + head) * on;
};

function bridgePose(t, sag) {
  const p = lie(BX, { dir: 1, tilt: -.45 });
  p.hip.y += sag * 7;
  p.feet = [{ x: BX - 102, y: FLOOR - 6 }, { x: BX - 96, y: FLOOR - 10 }];
  p.arms = [{ target: { x: PX1 + 18, y: FLOOR - 4 } }, { target: { x: PX1 + 30, y: FLOOR - 5 } }];
  p.lean = Math.PI / 2 - .04 - .03 * sag;
  return p;
}

function cast(t) {
  const o = {};
  // ── cruce de los amigos
  const crossX = (t0, x0, x1) => keyed([[t0, x0], [t0 + 2.0, x1]], t, easeInOut);
  const onBridge = [];
  const friend = (key, x0, start, x1, i) => {
    const intro = keyed([[0, x0 - 150], [CUE.edge + .2 + i * .1, x0]], t, easeOut);
    let p;
    if (t < CUE.edge + .3 + i * .1) p = walk(intro, intro + 200, { lean: .08 });
    else if (t < start) {
      // reacciones: susto al borde, asombro ante el puente
      const scared = bump(t, CUE.crumble, CUE.crumble + 1.2), shock = bump(t, CUE.slam - .1, CUE.slam + 1.2);
      p = stand(x0 - 8 * shock, { t, tilt: lerp(.15, .5, smooth(prog(t, 2.2, 3))) * (1 - smooth(prog(t, CUE.look, CUE.look + .4))) + .3 * smooth(prog(t, CUE.dive, CUE.slam)) - .3 * shock, lean: -.15 * scared - .2 * shock + .04 });
      if (shock > .05) p.arms = [{ ang: lerp(.1, 2.6, shock), bend: .5 }, { ang: lerp(-.08, 2.3, shock), bend: .5 }];
      else if (scared > .05) p.arms = [{ ang: lerp(.1, 1.2, scared), bend: .9 }, { ang: lerp(-.08, 1, scared), bend: .9 }];
      if (t > CUE.slam + 1.2) { const k = smooth(prog(t, start - .5, start)); p = mix(p, walk(x0, x0 + 200, { lean: .1 }), k); }
    } else if (t < start + 2.0) {
      const x = crossX(start, x0, x1), y = surf(x, t);
      p = walk(x, x + 200, { y, lean: .12, tilt: .35, stride: .85 });
      // los pies siguen la superficie de cada uno
      p.feet = p.feet.map(f => ({ x: f.x, y: f.y - FLOOR + y + (surf(f.x, t) - y) * .8 }));
      p.arms = [{ ang: .7 + .2 * Math.sin(t * 9 + i), bend: .5 }, { ang: -.5 - .2 * Math.sin(t * 9 + i), bend: .5 }]; // equilibrio
      if (x > BX - 100 && x < PX1) onBridge.push(1 - Math.abs(x - BX) / 160);
    } else {
      const turn = smooth(prog(t, start + 2.0, start + 2.5));
      p = mix(walk(x1, x1 + 200, { freeze: 1 }), stand(x1, { t, dir: -1, tilt: .35 }), turn);
    }
    o[key] = p;
  };
  friend('f1', 168, CUE.cross1, 642, 0);
  friend('f2', 106, CUE.cross2, 590, 1);
  friend('f3', 44, CUE.cross3, 538, 2);
  const sag = clamp(onBridge.reduce((a, b) => a + Math.max(0, b), 0));

  // ── héroe
  const hx0 = keyed([[0, 120], [CUE.edge, 232]], t, easeOut);
  const walkIn = walk(hx0, hx0 + 200, { lean: .08 });
  const wobble = bump(t, CUE.crumble, CUE.crumble + 1.0);
  const atEdge = stand(232 - 12 * smooth(prog(t, CUE.crumble, CUE.crumble + .4)), { t, lean: .05 - .35 * wobble, tilt: .45 });
  atEdge.arms = wobble > .02 ? [{ ang: Math.PI + Math.sin(t * 16) * 1.5, bend: .2 }, { ang: Math.PI * .8 + Math.sin(t * 16 + 2) * 1.5, bend: .2 }] : atEdge.arms;
  const lookDown = stand(222, { t, lean: .2, tilt: .8 });
  const lookBack = stand(222, { t, dir: -1, tilt: .15 });
  const resolve = stand(226, { t, dir: 1, tilt: .1, lean: .02 });
  resolve.arms = [{ ang: .05, bend: .15 }, { ang: -.05, bend: .15 }];
  const kn = kneel(236, { tilt: .3, lean: .3 }); kn.arms = [{ ang: 1.1, bend: .2 }, { ang: .9, bend: .2 }];
  const diveMid = { hip: { x: 280, y: FLOOR - 70 }, s: 1, dir: 1, lean: 1.25, tilt: -.4, feet: [{ x: 220, y: FLOOR - 4 }, { x: 214, y: FLOOR - 20 }],
    arms: [{ target: { x: 430, y: FLOOR - 70 } }, { target: { x: 440, y: FLOOR - 64 } }] };
  const hangP = { hip: { x: PX1 - 16, y: FLOOR + 132 }, s: 1, dir: 1, lean: .08, tilt: -.5, feet: [{ x: PX1 - 22, y: FLOOR + 228 }, { x: PX1 - 34, y: FLOOR + 222 }],
    arms: [{ target: { x: PX1 + 6, y: FLOOR - 2 } }, { target: { x: PX1 + 16, y: FLOOR - 1 } }] };
  const swing = Math.sin(t * 5) * 4 * (1 - smooth(prog(t, CUE.catch, CUE.pull)));
  hangP.hip.x += swing; hangP.feet.forEach(f => f.x += swing * 2);
  const pullK = easeInOut(prog(t, CUE.pull, CUE.out));
  const elbows = { hip: { x: PX1 - 6, y: FLOOR + 36 }, s: 1, dir: 1, lean: .75, tilt: -.4, feet: [{ x: PX1 - 26, y: FLOOR + 132 }, { x: PX1 - 12, y: FLOOR + 118 }],
    arms: [{ target: { x: PX1 + 92, y: FLOOR - 4 } }, { target: { x: PX1 + 100, y: FLOOR - 6 } }] };
  const knee = kneel(PX1 + 46, { tilt: .55, lean: .45 }); knee.arms = [{ target: { x: PX1 + 110, y: FLOOR - 70 } }, { ang: .4, bend: .3 }];
  const up = stand(PX1 + 66, { t, tilt: .05, lean: .02 });
  o.hero = poseAt(t, [[0, () => walkIn], [CUE.edge, () => walkIn], [CUE.edge + .2, atEdge], [CUE.crumble + 1.0, () => atEdge], [2.4, lookDown], [CUE.look, lookDown],
    [CUE.look + .35, lookBack], [CUE.decide - .1, lookBack], [CUE.decide + .25, resolve], [CUE.kneel, resolve], [CUE.kneel + .45, kn], [CUE.dive, kn]]);
  if (t > CUE.dive) {
    const ts = t;
    const br = bridgePose(t, sag);
    if (ts < CUE.slam) o.hero = poseAt(ts, [[CUE.dive, kn], [CUE.dive + .22, diveMid], [CUE.slam, br]], easeIn);
    else if (t < CUE.slip) {
      o.hero = br;
      // intenta levantarse cuando ya cruzaron: se arquea, los pies se resbalan
      const tryUp = smooth(prog(t, CUE.across + .3, CUE.slip));
      o.hero.feet = o.hero.feet.map(f => ({ x: f.x + 10 * tryUp, y: f.y }));
      o.hero.tilt -= .3 * tryUp;
    } else {
      const fall = easeIn(prog(t, CUE.slip, CUE.hang));
      const br2 = bridgePose(t, 0); br2.feet = br2.feet.map(f => ({ x: f.x + 18, y: f.y + 8 }));
      o.hero = poseAt(t, [[CUE.slip, br2], [CUE.slip + .18, { ...br2, hip: { x: BX + 40, y: FLOOR + 30 }, lean: 1.0, feet: [{ x: BX - 20, y: FLOOR + 60 }, { x: BX - 30, y: FLOOR + 50 }] }],
        [CUE.hang, hangP], [CUE.pull, hangP], [CUE.out - .15, elbows], [CUE.out + .45, knee], [CUE.kneelUp + .3, knee], [CUE.hug - .1, up]]);
      o.hang = t < lerp(CUE.pull, CUE.out, .7);
    }
  }
  // ── la cadena de rescate
  if (t > CUE.slip) {
    const hh = E.solve(o.hero).arms.map(a => a[2]);
    const wrist = { x: (hh[0].x + hh[1].x) / 2, y: (hh[0].y + hh[1].y) / 2 - 2 };
    const back = 45 * pullK;
    // f3 se lanza boca abajo y agarra las muñecas
    const prone = lie(PX1 + 88 + back, { dir: -1, tilt: -.3 });
    prone.hip.y = FLOOR - 12;
    prone.feet = [{ x: PX1 + 186 + back, y: FLOOR - 8 }, { x: PX1 + 180 + back, y: FLOOR - 12 }];
    const tgt = t < CUE.catch ? { x: lerp(PX1 + 10, wrist.x, prog(t, CUE.dive3, CUE.catch)), y: lerp(FLOOR - 40, wrist.y, prog(t, CUE.dive3, CUE.catch)) } : wrist;
    prone.arms = [{ target: { x: tgt.x - 4, y: tgt.y } }, { target: { x: tgt.x + 4, y: tgt.y - 2 } }];
    const dive3 = { hip: { x: PX1 + 120, y: FLOOR - 60 }, s: 1, dir: -1, lean: 1.2, tilt: -.4, feet: [{ x: PX1 + 170, y: FLOOR - 6 }, { x: PX1 + 190, y: FLOOR - 20 }],
      arms: [{ target: { x: PX1 + 20, y: FLOOR - 50 } }, { target: { x: PX1 + 26, y: FLOOR - 46 } }] };
    const getUp = { ...crouch(PX1 + 165, { dir: -1, amt: .6 }), arms: [{ target: { x: PX1 + 70, y: FLOOR - 70 } }, { ang: .4, bend: .3 }] };
    o.f3 = poseAt(t, [[CUE.dive3 - .05, o.f3], [CUE.dive3 + .2, dive3], [CUE.catch, prone], [CUE.out - .65, prone], [CUE.out - .1, getUp], [CUE.hug, getUp]]);
    // f2 agarra los tobillos de f3; f1 abraza a f2 por la cintura; jalan hacia atrás
    const ank = { x: PX1 + 182 + back, y: FLOOR - 14 };
    const f2c = crouch(PX1 + 226 + back, { dir: -1, amt: .75, tilt: .1 });
    f2c.lean = .2 + .25 * (1 - pullK) - .25 * bump(t, CUE.pull, CUE.out) ; f2c.hip.x += 10;
    f2c.feet = [{ x: PX1 + 200 + back, y: FLOOR }, { x: PX1 + 252 + back, y: FLOOR }];
    f2c.arms = [{ target: ank }, { target: { x: ank.x + 6, y: ank.y - 4 } }];
    o.f2 = poseAt(t, [[CUE.chain2 - .45, o.f2], [CUE.chain2, f2c], [CUE.out + .2, () => f2c], [CUE.kneelUp + .4, stand(PX1 + 250, { t, dir: -1, tilt: .3 })]]);
    const f2sh = shoulderOf(f2c);
    const f1p = stand(PX1 + 286 + back, { t, dir: -1, lean: -.32 - .1 * bump(t, CUE.pull, CUE.out), tilt: .3 });
    f1p.feet = [{ x: PX1 + 256 + back, y: FLOOR }, { x: PX1 + 308 + back, y: FLOOR }]; f1p.hip.y += 18;
    f1p.arms = [{ target: { x: f2sh.x + 30, y: f2sh.y + 40 } }, { target: { x: f2sh.x + 36, y: f2sh.y + 36 } }];
    o.f1 = poseAt(t, [[CUE.chain1 - .55, o.f1], [CUE.chain1, f1p], [CUE.out + .2, () => f1p], [CUE.kneelUp + .5, stand(PX1 + 290, { t, dir: -1, tilt: .3 })]]);
  }
  // ── abrazo final
  if (t > CUE.hug - .6) {
    const k = smooth(prog(t, CUE.hug - .6, CUE.hug + .4));
    const HX = PX1 + 70;
    const hug = {
      hero: stand(HX, { t, dir: 1, tilt: .25, lean: .1 }),
      f3: stand(HX + 46, { t, dir: -1, tilt: .2, lean: .1 }),
      f2: stand(HX + 104, { t, dir: -1, tilt: .1, lean: .2 }),
      f1: stand(HX - 58, { t, dir: 1, tilt: .1, lean: .2 }),
    };
    const sh = {}; for (const kk in hug) sh[kk] = shoulderOf(hug[kk]);
    hug.hero.arms = [{ target: { x: sh.f3.x + 10, y: sh.f3.y + 30 } }, { target: { x: sh.f3.x + 14, y: sh.f3.y + 14 } }];
    hug.f3.arms = [{ target: { x: sh.hero.x - 10, y: sh.hero.y + 26 } }, { target: { x: sh.hero.x - 14, y: sh.hero.y + 10 } }];
    hug.f2.arms = [{ target: { x: sh.f3.x + 2, y: sh.f3.y + 6 } }, { target: { x: sh.f3.x - 6, y: sh.f3.y + 2 } }];
    hug.f1.arms = [{ target: { x: sh.hero.x - 2, y: sh.hero.y + 6 } }, { target: { x: sh.hero.x + 6, y: sh.hero.y + 2 } }];
    for (const kk in hug) o[kk] = mix(o[kk], hug[kk], k);
  }
  o.sag = sag; o.pullK = pullK;
  return o;
}

// piedras que caen al abismo cuando se desmorona el borde
const pebbles = (() => { const g = rng(31); return Array.from({ length: 7 }, (_, i) => ({ x: PX0 - 4 - g() * 22, r: 4 + g() * 7, t0: CUE.crumble + g() * .35, vx: 20 + g() * 40, s: i + 3 })); })();
const pebbles2 = (() => { const g = rng(41); return Array.from({ length: 6 }, (_, i) => ({ x: PX0 - 2 - g() * 18, r: 3 + g() * 6, t0: CUE.slip + g() * .3, vx: 10 + g() * 30, s: i + 13 })); })();

window.SCENE = {
  id: '10-nadie-llega-solo', title: 'Nadie llega *solo*', duration: D, cue: CUE,
  sky: t => .15 + .6 * smooth(prog(t, CUE.hug, CUE.hug + 2)),
  spot: t => ({ x: keyed([[0, 260], [5, 340], [11, 420], [14, 500]], t), r: 380 }),
  beam: t => ({ x: keyed([[0, 240], [5, 330], [11, 430], [14.5, 530]], t), a: .05 + .03 * smooth(prog(t, CUE.hug, CUE.hug + 1)), w: 170 }),
  flashes: [CUE.slam + .02, CUE.catch + .02, CUE.hug + .3],
  blackouts: [CUE.slip + .45],
  camera: t => ({
    zoom: keyed([[0, 1.95], [CUE.crumble, 2.05], [2.6, 1.75], [CUE.look, 1.85], [CUE.kneel, 2.15], [CUE.slam, 1.85], [6.2, 1.72], [10.2, 1.6], [CUE.slip, 1.85], [CUE.hang + .2, 1.75], [CUE.chain1, 1.5], [CUE.out, 1.6], [CUE.hug, 1.95], [17, 1.85], [D, 1.6]], t),
    x: keyed([[0, 210], [CUE.crumble, 250], [2.6, 290], [CUE.look, 260], [CUE.kneel, 270], [CUE.slam, 340], [6.2, 330], [8, 400], [10.2, 470], [CUE.slip, 420], [CUE.hang + .2, 460], [CUE.chain1, 565], [CUE.out, 540], [CUE.hug, 530], [D, 520]], t),
    y: keyed([[0, FLOOR - 175], [CUE.crumble, FLOOR - 150], [2.6, FLOOR - 40], [3.1, FLOOR - 60], [CUE.look + .3, FLOOR - 165], [CUE.kneel, FLOOR - 150], [CUE.slam, FLOOR - 120], [6.2, FLOOR - 150],
      [10.2, FLOOR - 165], [CUE.slip, FLOOR - 120], [CUE.hang + .2, FLOOR - 60], [CUE.pull, FLOOR - 75], [CUE.out, FLOOR - 130], [CUE.hug, FLOOR - 165], [D, FLOOR - 210]], t),
    shake: .7 * pulse(t, CUE.slam + .02, .4) + .4 * pulse(t, CUE.crumble + .1, .5) + .8 * pulse(t, CUE.hang, .45) + .35 * pulse(t, CUE.catch, .3) + .12 * bump(t, CUE.pull, CUE.out),
  }),
  world(t, refl) {
    const c = cast(t);
    if (!refl) {
      E.pit(PX0, PX1, DEPTH);
      for (const [x, d] of [[PX0, 1], [PX1, -1]]) { // paredes de roca y borde iluminado
        const g = ctx.createLinearGradient(x, 0, x + d * 34, 0);
        g.addColorStop(0, 'rgba(90,88,86,.9)'); g.addColorStop(1, 'rgba(20,20,20,0)');
        ctx.fillStyle = g; ctx.fillRect(Math.min(x, x + d * 34), FLOOR, 34, DEPTH);
        const v = ctx.createLinearGradient(0, FLOOR, 0, FLOOR + DEPTH); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(.7, 'rgba(0,0,0,.9)');
        ctx.fillStyle = v; ctx.fillRect(Math.min(x, x + d * 34), FLOOR, 34, DEPTH);
        ctx.fillStyle = 'rgba(235,235,235,.85)'; ctx.fillRect(x - (d > 0 ? 60 : 0), FLOOR - 1.5, 60, 3);
      }
      // niebla roja muy tenue desde el fondo del abismo
      const g = ctx.createLinearGradient(0, FLOOR + 60, 0, FLOOR + DEPTH);
      g.addColorStop(0, 'rgba(150,12,10,0)'); g.addColorStop(1, 'rgba(170,15,12,.6)');
      ctx.fillStyle = g; ctx.fillRect(PX0 + 10, FLOOR + 60, PX1 - PX0 - 20, DEPTH - 60);
      for (const p of [...pebbles, ...pebbles2]) {
        const dt = t - p.t0; if (dt < 0 || dt > 1.6) continue;
        stone(p.x + p.vx * dt, FLOOR - 4 + 520 * dt * dt, p.r, p.s, `rgba(154,149,144,${1 - dt / 1.6})`);
      }
    }
    const order = ['f3', 'f2', 'f1'];
    const heroDraw = () => {
      if (refl && t > CUE.slip && t < CUE.out + .5) return;
      if (c.hero) figure(c.hero, STYLE.hero, { noShadow: !!c.hang || (t > CUE.dive && t < CUE.slam) });
    };
    // el héroe va detrás de los que caminan sobre él
    heroDraw();
    for (const k of order) if (c[k]) figure(c[k], FRIEND, { noShadow: false });
    if (!refl) {
      // esfuerzo del puente: ondas al pisarlo
      ring(PX1 + 24, FLOOR - 4, t, CUE.slam + .02, { r: 120, flat: .25, color: '255,70,60', width: 8 });
      ring(PX1 + 10, FLOOR, t, CUE.catch + .02, { r: 150, flat: .3, color: '255,255,255' });
      burst(PX1 + 14, FLOOR - 10, t, CUE.catch + .02, { color: '255,255,255', n: 20, speed: 200, size: 3, life: .8, seed: 3 });
    }
  },
  front(t) {
    const hk = smooth(prog(t, CUE.hug, CUE.hug + 1.2));
    if (hk > 0) {
      const cx = PX1 + 90, cy = FLOOR - 180;
      burst(cx, cy, t, CUE.hug + .3, { color: '255,60,50', n: 40, speed: 320, gravity: .5, size: 4.5, life: 1.8, seed: 21 });
      burst(cx, cy, t, CUE.hug + .5, { color: '255,240,220', n: 30, speed: 260, gravity: .4, size: 3, life: 1.6, seed: 23 });
      ring(cx, cy, t, CUE.hug + .3, { r: 260, color: '255,80,70', width: 8, life: 1.1 });
      for (let i = 0; i < 6; i++) {
        const tt = (t - CUE.hug - .4 - i * .55); if (tt < 0) continue;
        const life = (tt % 3.3) / 3.3;
        heart(cx + Math.sin(i * 2.3) * 90 + Math.sin(t * 2 + i) * 10, cy - 30 - life * 220, 14 + 10 * (i % 3) / 2, '#ff3b36', (1 - life) * hk * .9, 18);
      }
    }
  },
  backdrop(t) {
    const k = smooth(prog(t, CUE.hug, CUE.hug + 2));
    if (k > 0) { glowCircle(PX1 + 90, FLOOR - 220, 420, '255,40,30', .22 * k); rays(PX1 + 90, FLOOR - 200, t, .8 * k, '255,70,60', 16, 900); }
  },
  events() {
    const ev = E.footsteps(D, t => {
      const c = cast(t);
      return ['hero', 'f1', 'f2', 'f3'].map(k => c[k] && c[k].phi !== undefined ? { phi: c[k].phi, size: 1, moving: true, vol: k === 'hero' ? 1 : .8 } : null);
    });
    return ev.concat([
      { t: 0, type: 'whoosh', vol: .7 }, { t: .1, type: 'boom', vol: .5 }, { t: .1, type: 'wind', dur: 1.6, vol: .5 },
      { t: CUE.crumble, type: 'crack', vol: .8 }, { t: CUE.crumble + .05, type: 'clatter', vol: .5 }, { t: CUE.crumble + .2, type: 'wind', dur: 2.8, vol: .6 },
      { t: CUE.look + .3, type: 'heartbeat', vol: .5 }, { t: CUE.decide + .2, type: 'heartbeat', vol: .6 },
      { t: CUE.dive, type: 'whoosh', vol: .8 }, { t: CUE.slam, type: 'impact' }, { t: CUE.slam + .02, type: 'thud' },
      ...[0, 1, 2].map(i => ({ t: CUE.cross1 + i + .7, type: 'thud', vol: .35 })),
      { t: CUE.slip, type: 'scuff' }, { t: CUE.slip + .05, type: 'crack' }, { t: CUE.slip + .1, type: 'whoosh', up: false, vol: .9 }, { t: CUE.hang, type: 'thud', vol: .9 },
      { t: CUE.hang + .1, type: 'heartbeat' }, { t: CUE.hang + .6, type: 'heartbeat', vol: .7 },
      { t: CUE.dive3, type: 'whoosh', vol: .6 }, { t: CUE.catch, type: 'snap', vol: .8 }, { t: CUE.catch + .02, type: 'thud', vol: .6 },
      { t: CUE.pull, type: 'rumble', dur: 1.3, vol: .4 }, { t: CUE.pull + .3, type: 'riser', dur: 1.2 },
      { t: CUE.hug + .3, type: 'sparkle' }, { t: CUE.hug + .3, type: 'swell', dur: 2 },
    ]);
  },
  music: {
    sections: [
      { t: .2, dur: CUE.crumble - .2, style: 'tender', chords: ['Am', 'F'], chordLen: .8 },
      { t: CUE.crumble, dur: CUE.dive - CUE.crumble, style: 'tension', chords: ['Am', 'Em'], chordLen: 1.6 },
      { t: CUE.slam, dur: CUE.slip - CUE.slam, style: 'build', chords: ['Am', 'F', 'C', 'G'], chordLen: 1.4 },
      { t: CUE.hang, dur: CUE.hug - CUE.hang, style: 'tension', chords: ['Am', 'E'], chordLen: 1.2 },
      { t: CUE.hug, dur: D - CUE.hug, style: 'hope', chords: ['F', 'C', 'G', 'C'], chordLen: 1.3 },
    ],
    stingers: [{ t: CUE.slam, type: 'impact' }, { t: CUE.hug + .3, type: 'bells' }],
    duck: [[CUE.slip - .1, CUE.hang], [CUE.out, CUE.hug - .05]],
  },
};
})();
