// 48 — RESPETA TODO TRABAJO: un hombre elegante se burla del barrendero y le patea la basura;
// sigue con la nariz arriba y cae en un hoyo. El barrendero suelta la escoba y lo saca.
// El elegante, avergonzado, se quita el sombrero y le estrecha la mano.
(() => {
const { FLOOR, clamp, lerp, prog, smooth, easeOut, easeIn, easeInOut, keyed, distance, solve, figure, STYLE, stand, walk, kneel, mix, poseAt, heart, burst, ring, rng, glowCircle, ctx } = E;
const D = 19;
const SX = 400;                 // barrendero (mira a la izquierda)
const PIT0 = 545, PIT1 = 655, DEPTH = 262;
const SPEED = [[0, 0], [.9, 0], [1.2, 64], [2.9, 64], [3.25, 0], [5.75, 0], [6.1, 125], [D, 125]];
const dist = distance(SPEED, D);
const ex = t => 110 + dist(t);
// instante en que el pie llega al hoyo
let FALL = 8.3; for (let t = 6; t < 12; t += 1 / 240) if (ex(t) >= PIT0 + 14) { FALL = t; break; }
const CUE = { stop: 3.25, point: 3.5, kick: 5.02, go: 5.75, warn: FALL - .9, fall: FALL, land: FALL + .62,
  jump1: FALL + 1.35, look: FALL + 2.0, drop: FALL + 2.45, walkTo: FALL + 2.7, kneel: FALL + 3.6, grab: FALL + 4.15,
  out: FALL + 5.5, bow: FALL + 6.3, shake: FALL + 7.15 };
const EX_IN = PIT0 + 30; // x del elegante dentro del hoyo

// ── utilería propia ──
function broom(top, tip) {
  const a = Math.atan2(tip.y - top.y, tip.x - top.x);
  E.limb([top, tip], '#b9a27e', 5);
  ctx.save(); ctx.translate(tip.x, tip.y); ctx.rotate(a - Math.PI / 2);
  ctx.fillStyle = '#c9b58a'; ctx.shadowColor = 'rgba(255,230,180,.25)'; ctx.shadowBlur = 8;
  ctx.beginPath(); ctx.moveTo(-5, -4); ctx.lineTo(5, -4); ctx.lineTo(16, 18); ctx.lineTo(-16, 18); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(80,60,30,.6)'; ctx.lineWidth = 1.2;
  for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(i * 1.5, 0); ctx.lineTo(i * 4.6, 17); ctx.stroke(); }
  ctx.restore();
}
function hat(x, y, ang, sc = 1, a = 1) {
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.rotate(ang); ctx.scale(sc, sc);
  ctx.shadowColor = 'rgba(255,255,255,.3)'; ctx.shadowBlur = 10;
  ctx.fillStyle = '#d9d9d9'; ctx.beginPath(); ctx.roundRect(-30, -4, 60, 7, 3); ctx.fill();
  ctx.fillStyle = '#c4c4c4'; ctx.fillRect(-18, -40, 36, 37);
  ctx.fillStyle = '#ff3b36'; ctx.shadowColor = '#ff3b36'; ctx.fillRect(-18, -12, 36, 7);
  ctx.restore();
}
const hatOn = sl => { const a = Math.atan2(sl.head.x - sl.sh.x, sl.sh.y - sl.head.y); return { x: sl.head.x + Math.sin(a) * 19, y: sl.head.y - Math.cos(a) * 19, a }; };
function paper(x, y, r, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.fillStyle = '#bdb8ae';
  ctx.beginPath(); for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2, rr = r * (i % 2 ? .75 : 1); ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
  ctx.closePath(); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(-r * .4, -r * .4, r * .5, r * .3); ctx.restore();
}
const PAPERS = (() => { const g = rng(31); return Array.from({ length: 16 }, (_, i) => ({ x0: 300 + g() * 34, r: 4 + g() * 4, vx: 70 + g() * 170, vy: -(150 + g() * 200), rot: g() * 6, spin: (g() - .5) * 18, d: g() * .08 })); })();
function paperPos(p, t) {
  const dt = t - CUE.kick - p.d;
  if (dt <= 0) return { x: p.x0, y: FLOOR - p.r * .7, rot: p.rot };
  const G = 900;
  const T = 2 * -p.vy / G;
  const tt = Math.min(dt, T), slide = Math.max(0, dt - T);
  const x = p.x0 + p.vx * tt + p.vx * .25 * (1 - Math.exp(-slide * 4)) / 4;
  return { x: Math.min(x, PIT0 - 12 - p.r), y: FLOOR - p.r * .7 + p.vy * tt + G / 2 * tt * tt, rot: p.rot + p.spin * Math.min(dt, T + .3) };
}

// ── elenco ──
function sweeper(t) {
  const sweepAmt = 1 - smooth(prog(t, CUE.kick - .1, CUE.kick + .2)) + smooth(prog(t, CUE.go + .6, CUE.go + 1.2)) * (1 - smooth(prog(t, CUE.warn - .3, CUE.warn)));
  const sw = Math.sin(t * 5.2);
  let p = stand(SX, { dir: -1, lean: .22 + .05 * sw * sweepAmt, tilt: .35, t });
  p.feet = [{ x: SX - 12, y: FLOOR }, { x: SX + 14, y: FLOOR }];
  // burla: baja la cabeza; patada: se cubre
  const shame = smooth(prog(t, CUE.point + .4, CUE.point + 1)) * (1 - smooth(prog(t, CUE.kick - .2, CUE.kick)));
  const flinch = smooth(prog(t, CUE.kick + .05, CUE.kick + .25)) * (1 - smooth(prog(t, CUE.kick + .9, CUE.go + .6)));
  p.tilt += .3 * shame - .35 * flinch; p.lean += .12 * shame - .32 * flinch; p.hip.x += 10 * flinch;
  // advertencia: ve el hoyo, estira la mano
  const warn = smooth(prog(t, CUE.warn - .2, CUE.warn + .2)) * (1 - smooth(prog(t, CUE.fall + .7, CUE.land + .6)));
  const shock = smooth(prog(t, CUE.fall, CUE.fall + .3)) * (1 - smooth(prog(t, CUE.look - .3, CUE.look)));
  let broomTop, broomTip, hold = true;
  const sh = E.shoulderOf(p);
  broomTip = { x: SX - 62 - 16 * sw * sweepAmt, y: FLOOR - 4 + 2 * Math.abs(sw) * sweepAmt };
  const dirv = { x: sh.x - 10 - broomTip.x, y: sh.y - 30 - broomTip.y }, L = Math.hypot(dirv.x, dirv.y);
  broomTop = { x: broomTip.x + dirv.x / L * 132, y: broomTip.y + dirv.y / L * 132 };
  if (flinch > 0) { broomTip = { x: lerp(broomTip.x, SX - 30, flinch), y: lerp(broomTip.y, FLOOR - 50, flinch) }; broomTop = { x: lerp(broomTop.x, SX + 20, flinch), y: lerp(broomTop.y, FLOOR - 175, flinch) }; }
  // turn toward the pit (right) when the man passes
  const turn = t > CUE.go + .9;
  if (turn) {
    p = stand(SX, { dir: 1, lean: .08, tilt: .05, t });
    p.feet = [{ x: SX + 12, y: FLOOR }, { x: SX - 12, y: FLOOR }];
    const sh2 = E.shoulderOf(p);
    broomTip = { x: SX - 30, y: FLOOR - 2 }; broomTop = { x: sh2.x - 8, y: sh2.y - 40 };
    p.lean += .25 * warn + .1 * shock; p.tilt += -.25 * shock;
  }
  let arms = [{ target: lerpP(broomTop, broomTip, .22) }, { target: lerpP(broomTop, broomTip, .55) }];
  if (turn && warn > 0) arms[0] = { ang: lerp(.2, 1.75, warn), bend: lerp(.3, -.1, warn) };
  if (turn && shock > 0) arms = [{ ang: lerp(1.75, 2.7, shock), bend: 2.4 * shock }, { ang: 2.5 * shock, bend: 2.3 * shock }];
  // mira la escoba, la suelta, camina al hoyo, se arrodilla, jala
  if (t >= CUE.look) {
    hold = t < CUE.drop;
    const look = smooth(prog(t, CUE.look, CUE.look + .3));
    const walkP = easeInOut(prog(t, CUE.walkTo, CUE.kneel));
    const wx = lerp(SX, 488, walkP);
    let w = walk(wx, (wx - SX) * 1.1, { dir: 1, lean: .15, freeze: walkP >= 1 ? 1 : 0 });
    if (t < CUE.walkTo) { w = stand(SX, { dir: 1, lean: .1, tilt: lerp(.05, .6, look) * (1 - smooth(prog(t, CUE.drop, CUE.drop + .2))) }); w.feet = [{ x: SX + 12, y: FLOOR }, { x: SX - 12, y: FLOOR }]; }
    const kn = kneel(488, { dir: 1, lean: .62, tilt: .45 });
    const pull = stand(410, { dir: 1, lean: -.32, tilt: .25 }); pull.feet = [{ x: 440, y: FLOOR }, { x: 388, y: FLOOR }];
    const upright = stand(398, { dir: 1, lean: .05, tilt: .1, t });
    p = poseAt(t, [[CUE.kneel - .05, w], [CUE.kneel + .4, kn], [CUE.grab + .25, kn], [CUE.out - .3, pull], [CUE.out + .5, upright]]);
    if (t < CUE.kneel) p = w.legs ? w : (t < CUE.kneel - .05 ? w : p);
    if (hold) { const sh3 = E.shoulderOf(p); broomTip = { x: SX - 30, y: FLOOR - 2 }; broomTop = { x: sh3.x - 8, y: sh3.y - 40 }; arms = [{ target: lerpP(broomTop, broomTip, .22) }, { target: lerpP(broomTop, broomTip, .55) }]; }
    else arms = null;
  }
  if (arms) p.arms = arms;
  // escoba suelta: cae al piso
  let broomState = { top: broomTop, tip: broomTip };
  if (!hold || t >= CUE.drop) {
    const f = easeIn(prog(t, CUE.drop, CUE.drop + .4));
    const tip = { x: SX - 30, y: FLOOR - 2 }, th = lerp(.2, Math.PI / 2 - .02, f);
    broomState = { tip, top: { x: tip.x + Math.sin(th) * 132, y: tip.y - Math.cos(th) * 132 } };
  }
  return { p, broom: broomState };
}
const lerpP = E.lerpP;

function elegant(t, sP) {
  const x = ex(t), d = dist(t);
  const swagger = { dir: 1, lean: -.07, tilt: -.42, swing: .62, stride: 1.1 };
  let p = walk(x, d, { ...swagger, freeze: t > CUE.stop - .1 && t < CUE.go + .3 ? smooth(prog(t, CUE.stop - .3, CUE.stop)) * (1 - smooth(prog(t, CUE.go, CUE.go + .3))) : 0 });
  const stopped = t > CUE.stop - .3 && t < CUE.go + .3;
  if (stopped) {
    const fr = smooth(prog(t, CUE.stop - .3, CUE.stop)) * (1 - smooth(prog(t, CUE.go, CUE.go + .3)));
    p.feet = p.feet.map((f, i) => ({ x: lerp(f.x, x + (i ? -12 : 10), fr), y: lerp(f.y, FLOOR, fr) }));
    // burla: señala y se ríe
    const laugh = smooth(prog(t, CUE.point, CUE.point + .3)) * (1 - smooth(prog(t, CUE.kick - .45, CUE.kick - .25)));
    const bounce = Math.sin(t * 19) * laugh;
    p.hip.y += 2.2 * bounce; p.tilt = lerp(p.tilt, -.62 + .12 * bounce, laugh); p.lean = lerp(p.lean, -.18, laugh);
    if (laugh > 0) {
      const sh = E.shoulderOf(p);
      p.arms = [{ ang: lerp(.1, 1.72, laugh), bend: lerp(.3, -.08, laugh) }, { target: { x: sh.x + 18 * laugh + 4, y: sh.y + 58 } }];
    }
    // patada con anticipación
    const kAnt = smooth(prog(t, CUE.kick - .35, CUE.kick - .05)), kHit = easeOut(prog(t, CUE.kick - .05, CUE.kick + .1)), kRet = smooth(prog(t, CUE.kick + .25, CUE.kick + .6));
    if (kAnt > 0 && kRet < 1) {
      const back = { x: x - 34, y: FLOOR - 26 }, fwd = { x: x + 62, y: FLOOR - 40 }, rest = { x: x + 10, y: FLOOR };
      let f = lerpP(rest, back, kAnt); f = lerpP(f, fwd, kHit); f = lerpP(f, rest, kRet);
      p.feet[0] = f; p.lean = lerp(p.lean, -.2, kAnt) + .25 * kHit * (1 - kRet); p.tilt = -.3;
      p.arms = [{ ang: lerp(.1, -.6, kHit) * (1 - kRet), bend: .3 }, { ang: .9 * kHit * (1 - kRet) + .1, bend: .3 }];
    }
    // sacude las manos, sigue
    const dust = E.bump(t, CUE.kick + .6, CUE.go);
    if (dust > 0) { const sh = E.shoulderOf(p); const w = Math.sin(t * 30) * 4; p.arms = [{ target: { x: sh.x + 26 + w, y: sh.y + 45 } }, { target: { x: sh.x + 24 - w, y: sh.y + 48 } }]; }
  }
  // caída al hoyo (cámara lenta)
  if (t >= CUE.fall) {
    const fp = easeIn(prog(t, CUE.fall, CUE.land));
    const xf = PIT0 + 14 + 16 * easeOut(prog(t, CUE.fall, CUE.land));
    const drop = DEPTH * fp;
    const flail = smooth(prog(t, CUE.fall, CUE.fall + .2));
    p = walk(xf, dist(CUE.fall) + 30 * fp, { ...swagger, y: FLOOR + drop, freeze: .7 });
    p.tilt = lerp(-.42, .2, flail); p.lean = lerp(-.07, -.35, flail);
    p.arms = [{ ang: lerp(.1, 2.7, flail), bend: .3 }, { ang: lerp(-.1, 2.4, flail), bend: .5 }];
    const crash = smooth(prog(t, CUE.land, CUE.land + .15)) * (1 - smooth(prog(t, CUE.land + .5, CUE.jump1 - .2)));
    if (t >= CUE.land) {
      const b = E.crouch(EX_IN - 10, { y: FLOOR + DEPTH, amt: .8 * crash, tilt: .3 });
      const up = stand(EX_IN, { y: FLOOR + DEPTH, lean: .02, tilt: -.6, t });
      // intenta saltar y alcanzar el borde (no llega)
      const jumps = [CUE.jump1, CUE.jump1 + .9];
      let jy = 0; for (const j of jumps) jy += Math.sin(Math.PI * prog(t, j, j + .45)) * 34;
      const reach = smooth(prog(t, CUE.land + .5, CUE.jump1));
      p = mix(b, up, reach);
      p.hip.y -= jy;
      if (jy > 0) p.feet = p.feet.map(f => ({ x: f.x, y: f.y - jy * .9 }));
      p.arms = [{ ang: lerp(.8, 3.05, reach), bend: .05 }, { ang: lerp(.6, 2.95, reach), bend: .05 }];
      p.tilt = lerp(.3, -.6, reach);
      p.noShadow = jy > 2;
    }
  }
  // rescate: lo agarra y lo saca
  if (t >= CUE.grab - .35) {
    const sSl = solve(sP);
    const sh = sSl.sh;
    const lift = easeInOut(prog(t, CUE.grab + .25, CUE.out));
    const hang = stand(EX_IN - 14, { y: FLOOR + DEPTH - 85, lean: -.12, tilt: -.6 });
    hang.feet = [{ x: EX_IN - 8, y: FLOOR + DEPTH - 80 }, { x: EX_IN - 20, y: FLOOR + DEPTH - 76 }];
    const top = stand(PIT0 - 14, { dir: -1, lean: .3, tilt: .5 });
    top.feet = [{ x: PIT0 - 24, y: FLOOR }, { x: PIT0 + 6, y: FLOOR - 30 }];
    const ashamed = stand(PIT0 - 26, { dir: -1, lean: .2, tilt: .62, t });
    if (t < CUE.grab + .25) {
      const g = smooth(prog(t, CUE.grab - .35, CUE.grab));
      const base = stand(EX_IN, { y: FLOOR + DEPTH, lean: .02, tilt: -.6, t });
      p = mix(base, hang, g);
    } else p = poseAt(t, [[CUE.grab + .25, hang], [CUE.out - .2, top], [CUE.out + .45, ashamed]]);
    const sh2 = E.shoulderOf(p);
    const hp = E.holdPoint(sh, E.ARM * .98, sh2, E.ARM * .98);
    if (t < CUE.out + .45) {
      p.arms = [{ target: hp }, { ang: lerp(2.9, .3, smooth(prog(t, CUE.out - .6, CUE.out))), bend: .2 }];
      p.noShadow = lift < .9;
    }
    const sArm = t < CUE.out + .45 ? { target: hp, elbowBack: true } : null;
    // inclinación y apretón de manos
    if (t >= CUE.out + .45) {
      const bow = smooth(prog(t, CUE.bow, CUE.bow + .6));
      const offer = smooth(prog(t, CUE.shake - .7, CUE.shake));
      p = stand(PIT0 - 26, { dir: -1, lean: .2 + .28 * bow, tilt: .62 - .1 * bow, t });
      const ssh = E.shoulderOf(sP), esh = E.shoulderOf(p);
      const meet = E.holdPoint(ssh, E.ARM, esh, E.ARM); meet.y += 6;
      const pump = Math.sin(prog(t, CUE.shake, CUE.shake + 1.2) * Math.PI * 4) * 6 * (t > CUE.shake && t < CUE.shake + 1.2 ? 1 : 0);
      meet.y += pump;
      const hatHand = { x: esh.x + 6, y: esh.y + 42 };
      p.arms = [{ target: { x: lerp(esh.x - 18, meet.x, offer), y: lerp(esh.y + 62, meet.y, offer) } }, { target: bow > .05 ? hatHand : { x: esh.x + 4, y: esh.y + 62 } }];
      return { p, sArm: offer > 0 ? { target: { x: lerp(ssh.x + 20, meet.x, offer), y: lerp(ssh.y + 62, meet.y, offer) } } : null, bow, meet, offer };
    }
    return { p, sArm };
  }
  return { p };
}

function cast(t) {
  const s = sweeper(t);
  const e = elegant(t, s.p);
  if (e.sArm) s.p.arms = [e.sArm, s.p.arms ? s.p.arms[1] : { ang: .1, bend: .3 }];
  if (t > CUE.out + .45) s.p.arms[1] = { ang: .05, bend: .3 };
  return { s, e };
}

// sombrero: en la cabeza → sale volando al caer → reposa en el borde → en la mano (respeto)
function hatState(t, eSl, e) {
  if (t < CUE.fall + .05) { const h = hatOn(eSl); return { ...h, a: h.a }; }
  const fly = prog(t, CUE.fall + .05, CUE.fall + .75);
  const start = hatOn(solve(elegant(CUE.fall + .05, stand(SX, {})).p));
  const restX = PIT0 - 34;
  if (t < CUE.bow) {
    const x = lerp(start.x, restX, easeOut(fly)), y = fly < 1 ? lerp(start.y, FLOOR - 4, fly) - Math.sin(Math.PI * fly) * 70 : FLOOR - 4;
    return { x, y, a: start.a + fly * 7.2 };
  }
  const h = E.hand(eSl, 1);
  const g = smooth(prog(t, CUE.bow, CUE.bow + .3));
  return { x: lerp(restX, h.x - 4, g), y: lerp(FLOOR - 4, h.y + 6, g), a: lerp(0, -Math.PI / 2 + .3, g) };
}

const CAM = {
  zoom: [[0, 2.25], [1.1, 1.95], [3.3, 2.0], [4.4, 2.2], [5.3, 2.05], [6.2, 1.85], [CUE.fall, 1.95], [CUE.land + .2, 1.9], [CUE.look, 1.85], [CUE.kneel, 1.85], [CUE.out + .4, 1.9], [CUE.shake, 2.3], [CUE.shake + 1.6, 2.35], [D, 1.95]],
  x: [[0, 380], [1.1, 330], [3.3, 315], [4.6, 320], [6.2, 380], [CUE.fall - .3, 525], [CUE.land + .3, 560], [CUE.look, 510], [CUE.kneel, 520], [CUE.out + .4, 480], [CUE.shake, 478], [D, 470]],
  y: [[0, FLOOR - 165], [3.3, FLOOR - 175], [4.6, FLOOR - 165], [CUE.fall - .1, FLOOR - 160], [CUE.land, FLOOR - 15], [CUE.look, FLOOR - 25], [CUE.grab, FLOOR - 50], [CUE.out + .3, FLOOR - 165], [CUE.shake, FLOOR - 175], [D, FLOOR - 190]],
};

window.SCENE = {
  id: '48-todo-trabajo', title: 'Respeta *todo trabajo*', duration: D, cue: CUE,
  spot: t => ({ x: keyed([[0, 360], [6, 360], [CUE.fall, 560], [CUE.look, 500], [CUE.out, 470]], t), r: 360 }),
  beam: t => ({ x: keyed([[0, 380], [6, 360], [CUE.fall, 580], [CUE.look, 520], [CUE.out, 475]], t), a: .05 + .08 * smooth(prog(t, CUE.shake - .5, CUE.shake + .6)), w: 170 }),
  sky: t => .45 * smooth(prog(t, CUE.shake, CUE.shake + 1.2)),
  blackouts: [CUE.land],
  camera: t => ({ zoom: keyed(CAM.zoom, t), x: keyed(CAM.x, t), y: keyed(CAM.y, t),
    shake: .5 * E.pulse(t, CUE.land + .02, .25) + .2 * E.pulse(t, CUE.kick + .05, .15) }),
  world(t, refl) {
    const c = cast(t);
    if (!refl) {
      E.pit(PIT0, PIT1, DEPTH);
      const g = ctx.createLinearGradient(0, FLOOR, 0, FLOOR + DEPTH);
      g.addColorStop(0, 'rgba(255,255,255,.07)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g; ctx.fillRect(PIT0 + 10, FLOOR, PIT1 - PIT0 - 20, DEPTH);
      ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(PIT0 - 6, FLOOR - 1, 8, 3); ctx.fillRect(PIT1 - 2, FLOOR - 1, 8, 3);
    }
    // basura
    for (const p of PAPERS) { const q = paperPos(p, t); paper(q.x, q.y, p.r, q.rot); }
    broom(c.s.broom.top, c.s.broom.tip);
    const eSl = solve(c.e.p);
    const inPit = eSl.hip.y > FLOOR - 40;
    if (!(refl && inPit)) figure(eSl, STYLE.hero, { noShadow: c.e.p.noShadow || inPit && eSl.legs[0][2].y < FLOOR + DEPTH - 4 });
    const h = hatState(t, eSl, c.e);
    if (!(refl && t > CUE.fall && t < CUE.fall + .75)) hat(h.x, h.y, h.a, .62);
    figure(c.s.p, STYLE.gray);
    if (!refl) {
      // polvo de la escoba
      if (t < CUE.kick) for (let i = 0; i < 3; i++) burst(c.s.broom.tip.x, FLOOR - 4, t, Math.floor(t * 2.6) / 2.6 + i * .02, { n: 6, speed: 60, size: 2, color: '170,170,170', life: .5, gravity: -.2, seed: 3 + i + Math.floor(t * 2.6) });
      burst(EX_IN, FLOOR + DEPTH - 4, t, CUE.land, { n: 30, speed: 160, size: 3, color: '180,180,180', life: .9, gravity: .2 });
      ring(EX_IN, FLOOR + DEPTH, t, CUE.land, { r: 90, flat: .25, life: .6 });
      // manos que se juntan: destello y corazón
      if (c.e.meet && t > CUE.shake - .05) {
        const m = c.e.meet, hp = smooth(prog(t, CUE.shake + .2, CUE.shake + .9));
        glowCircle(m.x, m.y, 70, '255,70,60', .4 * hp);
        ring(m.x, m.y, t, CUE.shake, { r: 140, color: '255,90,80', life: .9 });
        burst(m.x, m.y, t, CUE.shake, { n: 22, speed: 200, size: 3, color: '255,200,150', life: 1.1, gravity: .3 });
        heart(m.x, m.y - 120 - 8 * Math.sin(t * 2.5), 40 * E.backOut(hp), '#ff3b36', hp);
      }
    }
  },
  events() {
    const ev = E.footsteps(D, t => {
      const c = cast(t), v = keyed(SPEED, t);
      return [{ phi: c.e.p.phi || 0, size: 1.1, moving: v > 4 && t < CUE.fall }];
    });
    const sw = []; for (let t = .4; t < CUE.kick - .2; t += Math.PI / 5.2) sw.push({ t, type: 'slide', dur: .35, vol: .35 });
    return ev.concat(sw, [
      { t: 0, type: 'whoosh', dur: .5 }, { t: .15, type: 'slide', dur: .4, vol: .6 }, { t: .3, type: 'impact', vol: .35 },
      { t: CUE.kick - .05, type: 'whoosh', dur: .35 }, { t: CUE.kick + .02, type: 'clatter', vol: .5 }, { t: CUE.kick + .02, type: 'impact', vol: .4 },
      { t: CUE.warn, type: 'heartbeat', vol: .7 },
      { t: CUE.fall + .05, type: 'whoosh', dur: .6, up: false }, { t: CUE.land, type: 'boom' }, { t: CUE.land, type: 'thud' },
      { t: CUE.jump1 + .4, type: 'thud', vol: .4 }, { t: CUE.jump1 + 1.3, type: 'thud', vol: .4 },
      { t: CUE.drop + .35, type: 'clatter', vol: .7 },
      { t: CUE.grab, type: 'snap', vol: .7 }, { t: CUE.grab + .3, type: 'riser', dur: CUE.out - CUE.grab - .2 },
      { t: CUE.shake, type: 'chime' }, { t: CUE.shake + .1, type: 'sparkle' },
    ]);
  },
  music: {
    sections: [
      { t: .3, dur: CUE.point - .3, style: 'tender', chords: ['Am', 'F', 'C', 'G'], chordLen: 1.0, vol: .8 },
      { t: CUE.point, dur: CUE.fall - CUE.point, style: 'tension', chords: ['Am', 'E', 'Am', 'E'], chordLen: 1.2 },
      { t: CUE.land + .6, dur: CUE.grab - CUE.land - .6, style: 'sad', chords: ['Am', 'F', 'C'], chordLen: 1.2 },
      { t: CUE.grab, dur: CUE.shake - CUE.grab, style: 'build', chords: ['F', 'G', 'Am', 'G'], chordLen: 1.1 },
      { t: CUE.shake - .05, dur: D - CUE.shake, style: 'hope', chords: ['F', 'C', 'G', 'C'], chordLen: 1.5 },
    ],
    stingers: [{ t: CUE.land, type: 'impact' }, { t: CUE.shake, type: 'bells' }],
    duck: [[CUE.fall, CUE.land + .5]],
  },
};
})();
