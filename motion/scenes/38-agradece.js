// 38 — AGRADECE LO QUE TIENES: un niño descalzo se lastima con una piedra y ve unos zapatos rojos
// brillantes. Los envidia… hasta que la luz revela que el dueño está en silla de ruedas y envidia sus piernas.
// El descalzo sonríe, empuja la silla y corren juntos riendo.
(() => {
const { FLOOR, clamp, lerp, prog, smooth, easeOut, easeIn, easeInOut, keyed, bump, pulse, stand, walk, run, sit, mix, poseAt,
        figure, STYLE, glowCircle, ctx, burst, ring, rays, heart, bubble, distance } = E;
const D = 19;
const CUE = { stone: 1.3, limp: 2.2, look: 2.9, shoes: 3.1, envy: 4.3, feet: 5.2, reveal: 6.1, both: 6.9, pop: 8.6, smile: 9.1, around: 9.6,
              grab: 11.0, push: 11.6, fly: 12.4, slow: 16.8 };
const KS = .6, WX = 430, STONE = 178;
const SEAT = 44;
// ── niño descalzo ──
const kWalkX = t => keyed([[0, 40], [CUE.stone, 160], [CUE.stone + .9, 166], [CUE.look, 244], [D, 244]], t, p => p);
const kAroundX = t => keyed([[CUE.around, 254], [CUE.around + .7, 360], [CUE.grab - .1, WX + 68]], t);
// distancia recorrida en la carrera (hacia la izquierda)
const SPEED = [[0, 0], [CUE.push, 0], [CUE.fly, 160], [CUE.fly + .4, 330], [CUE.slow, 330], [D, 250]];
const travel = distance(SPEED, D);
const wx = t => WX - Math.min(travel(t), 240);           // la silla avanza un poco y luego la cámara la "acompaña"
const scrollD = t => travel(t);

function kid(t) {
  const walking = t2 => { const x = kWalkX(t2); return walk(x, (x - 40) * 1.0, { s: KS, lean: .08, tilt: .15 }); };
  const ouch = t2 => {
    const x = kWalkX(t2), h = bump(t2, CUE.stone, CUE.limp) * 14;
    const p = stand(x, { s: KS, lean: -.05, tilt: .4 }); p.hip.y -= h;
    p.feet = [{ x: x + 2, y: FLOOR - h * 1.6 }, { x: x - 18, y: FLOOR - 38 - h * .4 }];
    p.arms = [{ target: { x: x - 16, y: FLOOR - 40 - h * .3 } }, { ang: -1.2, bend: .2 }];
    p.hip.x += Math.sin(t2 * 30) * 2; return p;
  };
  const limping = t2 => { const x = kWalkX(t2); const p = walk(x, (x - 40), { s: KS, lean: .1, tilt: .35, stride: .7 }); return p; };
  const stare = t2 => { const p = stand(244, { s: KS, t: t2, lean: .1, tilt: -.05 }); p.arms = [{ ang: .1, bend: .2 }, { ang: 0, bend: .2 }]; return p; };
  const lookFeet = t2 => { const p = stand(244, { s: KS, t: t2, lean: .28, tilt: .7 }); p.arms = [{ ang: 0, bend: .1 }, { ang: -.05, bend: .1 }]; p.feet[0].y -= 3 * Math.max(0, Math.sin(t2 * 9)); return p; };
  const atW = t2 => { const p = stand(248, { s: KS, t: t2, lean: .02, tilt: .05 }); p.arms = [{ ang: .2, bend: .3 }, { ang: 0, bend: .2 }]; return p; };
  const smile = t2 => { const p = stand(252, { s: KS, t: t2, lean: -.05, tilt: -.25 }); p.arms = [{ ang: .5, bend: .8 }, { ang: .2, bend: .3 }]; return p; };
  const around = t2 => { const x = kAroundX(t2); return walk(x, x * 1.1, { s: KS, lean: .1, tilt: -.1 }); };
  const handle = () => ({ x: wx(CUE.grab) + 30, y: FLOOR - 86 });
  const grab = t2 => { const x = WX + 66; const p = stand(x, { s: KS, dir: -1, t: t2, lean: .15, tilt: -.1 }); p.arms = [{ target: handle() }, { target: { x: handle().x + 2, y: handle().y + 3 } }]; return p; };
  const brace = t2 => { const x = WX + 74; const p = E.crouch(x, { s: KS, dir: -1, amt: .45, tilt: -.2 }); p.arms = [{ target: handle() }, { target: { x: handle().x + 2, y: handle().y + 3 } }]; return p; };
  const running = t2 => {
    const x = wx(t2) + 70, d = travel(t2) * 1.25;
    const p = run(x, d, { s: KS, dir: -1, lean: .42, tilt: -.25 });
    const h = { x: wx(t2) + 30, y: FLOOR - 86 };
    p.arms = [{ target: h }, { target: { x: h.x + 2, y: h.y + 3 } }]; return p;
  };
  return poseAt(t, [[0, walking], [CUE.stone - .05, walking], [CUE.stone + .15, ouch], [CUE.limp - .1, ouch], [CUE.limp + .15, limping], [CUE.look, limping],
    [CUE.look + .3, stare], [CUE.feet, stare], [CUE.feet + .4, lookFeet], [CUE.reveal + .2, lookFeet], [CUE.reveal + .6, atW], [CUE.pop, atW],
    [CUE.smile - .1, smile], [CUE.around - .05, smile], [CUE.around + .2, around], [CUE.grab - .2, around], [CUE.grab + .15, grab], [CUE.push - .2, brace],
    [CUE.push + .25, grab], [CUE.fly - .2, running], [D, running]]);
}
// ── niño en silla de ruedas (mira a la izquierda) ──
function wkid(t) {
  const x = wx(t) - 4, seat = FLOOR - SEAT;
  const base = (lean, tilt) => {
    const p = sit(x, { s: KS, dir: -1, seat: seat + 10 * KS, lean, tilt });
    p.feet = [{ x: x - 30, y: FLOOR - 14 }, { x: x - 26, y: FLOOR - 15 }];
    return p;
  };
  const rest = t2 => { const p = base(.06, .05 + .03 * Math.sin(t2 * 2)); p.arms = [{ target: { x: x - 16, y: seat - 6 } }, { target: { x: x - 12, y: seat - 4 } }]; return p; };
  const watch = t2 => { const p = base(.12, .35); p.arms = [{ target: { x: x - 18, y: seat - 6 } }, { target: { x: x - 12, y: seat - 4 } }]; return p; };
  const sadP = t2 => { const p = base(.25, .75); p.arms = [{ target: { x: x - 12, y: seat - 2 } }, { target: { x: x - 8, y: seat } }]; return p; };
  const lookBack = t2 => { const p = base(-.05, -.35); p.arms = [{ target: { x: x + 6, y: seat - 2 } }, { target: { x: x + 4, y: seat } }]; return p; };
  const cheerP = t2 => { const p = base(-.12, -.4); const s = E.shoulderOf(p); const w = Math.sin(t2 * 9) * 6; p.arms = [{ target: { x: s.x - 18, y: s.y - 40 + w } }, { target: { x: s.x - 6, y: s.y - 42 - w } }]; return p; };
  return poseAt(t, [[0, rest], [CUE.reveal - .3, rest], [CUE.reveal + .3, watch], [CUE.pop, watch], [CUE.pop + .5, sadP], [CUE.grab - .3, sadP], [CUE.grab + .3, lookBack],
                    [CUE.fly, lookBack], [CUE.fly + .5, cheerP], [D, cheerP]]);
}
// ── silla de ruedas de niño (dibujada a mano), mirando a la izquierda ──
function wheelchair(x, rot, st) {
  ctx.save(); ctx.translate(x, FLOOR); ctx.scale(-1, 1);
  ctx.strokeStyle = st.far; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  // rueda grande
  ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(-4, -30, 30, 0, Math.PI * 2); ctx.stroke();
  ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(-4, -30, 24, 0, Math.PI * 2); ctx.stroke();
  ctx.save(); ctx.translate(-4, -30); ctx.rotate(rot);
  for (let i = 0; i < 6; i++) { ctx.rotate(Math.PI / 3); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(24, 0); ctx.stroke(); }
  ctx.restore();
  ctx.strokeStyle = st.near; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(-14, -SEAT); ctx.lineTo(24, -SEAT); ctx.lineTo(32, -16); ctx.lineTo(42, -16);   // asiento, pata, reposapiés
  ctx.moveTo(-14, -SEAT); ctx.lineTo(-20, -86); ctx.lineTo(-30, -86);                                       // respaldo y manija
  ctx.stroke();
  ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(32, -6, 6, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
}
// zapato rojo brillante
function shoe(x, y, sc = 1, a = 1, dir = -1) {
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.scale(dir * sc, sc);
  ctx.fillStyle = '#ff3b36'; ctx.shadowColor = '#ff2a20'; ctx.shadowBlur = 18;
  ctx.beginPath(); ctx.moveTo(-6, -8); ctx.lineTo(4, -8); ctx.quadraticCurveTo(8, -2, 16, -1); ctx.quadraticCurveTo(20, 0, 19, 4); ctx.lineTo(-7, 4); ctx.closePath(); ctx.fill();
  ctx.shadowBlur = 0; ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.fillRect(-7, 2, 26, 2.2);
  ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.beginPath(); ctx.arc(0, -4, 1.6, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
// postes de luz de la calle (paralaje durante la carrera)
function posts(t) {
  const d = scrollD(t);
  for (let i = -2; i < 8; i++) {
    const x = ((i * 300 + d * .9) % 2400 + 2400) % 2400 - 700;
    ctx.strokeStyle = '#2c2c2c'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(x, FLOOR); ctx.lineTo(x, FLOOR - 250); ctx.lineTo(x + 26, FLOOR - 250); ctx.stroke();
    glowCircle(x + 26, FLOOR - 244, 44, '255,220,170', .25);
    ctx.fillStyle = 'rgba(255,230,190,.8)'; ctx.beginPath(); ctx.arc(x + 26, FLOOR - 245, 4, 0, Math.PI * 2); ctx.fill();
  }
}

const revealA = t => smooth(prog(t, CUE.reveal, CUE.reveal + .8));
const shoeShine = t => smooth(prog(t, CUE.shoes - .1, CUE.shoes + .3));

window.SCENE = {
  id: '38-agradece', title: 'Agradece *lo que tienes*', duration: D, cue: CUE,
  scroll: t => scrollD(t),
  sky: t => .2 * smooth(prog(t, CUE.fly, CUE.fly + 1.5)),
  spot: t => ({ x: t < CUE.reveal ? lerp(200, 330, smooth(prog(t, 0, CUE.reveal))) : wx(t) - 20, r: 320 }),
  beam: t => ({ x: t < CUE.shoes ? kWalkX(t) : t < CUE.envy ? WX - 30 : wx(t) - 60, a: .05, w: 130 }),
  flashes: [], blackouts: [CUE.shoes - .05, CUE.reveal - .02],
  camera: t => {
    const z = keyed([[0, 2.6], [CUE.stone, 2.5], [CUE.limp, 2.2], [CUE.look - .05, 2.1], [CUE.shoes - .01, 2.1], [CUE.shoes, 3.4], [CUE.envy - .01, 3.0], [CUE.envy, 2.25], [CUE.feet + .4, 2.45],
                     [CUE.reveal, 2.35], [CUE.reveal + 1, 1.75], [CUE.pop, 1.85], [CUE.smile + .3, 2.0], [CUE.grab, 2.0], [CUE.push, 2.25], [CUE.fly + .6, 2.2], [CUE.slow, 2.3], [D, 1.9]], t, smooth);
    const x = keyed([[0, 80], [CUE.stone, 175], [CUE.limp, 190], [CUE.look - .05, 238], [CUE.shoes - .01, 250], [CUE.shoes, WX - 20], [CUE.envy - .01, WX - 30], [CUE.envy, 252], [CUE.feet + .4, 250],
                     [CUE.reveal, 262], [CUE.reveal + 1, 345], [CUE.pop, 340], [CUE.smile + .3, 320], [CUE.grab, 440], [CUE.push, 450], [CUE.fly + .6, wx(CUE.fly + .6) + 10], [D, wx(D) + 20]], t);
    const y = keyed([[0, FLOOR - 70], [CUE.stone, FLOOR - 80], [CUE.limp, FLOOR - 105], [CUE.look - .05, FLOOR - 120], [CUE.shoes - .01, FLOOR - 120], [CUE.shoes, FLOOR - 30], [CUE.envy - .01, FLOOR - 34],
                     [CUE.envy, FLOOR - 110], [CUE.feet + .4, FLOOR - 90], [CUE.reveal, FLOOR - 105], [CUE.reveal + 1, FLOOR - 150], [CUE.pop, FLOOR - 150], [CUE.grab, FLOOR - 110], [CUE.fly + .6, FLOOR - 105], [D, FLOOR - 150]], t);
    const cut = (a, b) => t >= a && t < b;
    // cortes secos (sin interpolar) en el plano de los zapatos
    return { x, y, zoom: z, shake: .25 * pulse(t, CUE.stone, .25) + (t > CUE.fly && t < CUE.slow ? .05 : 0) };
  },
  backdrop(t) { if (t > CUE.push) { ctx.save(); ctx.globalAlpha = smooth(prog(t, CUE.push, CUE.fly + .5)); posts(t); ctx.restore(); } },
  world(t, refl) {
    E.stone(STONE, FLOOR - 4, 6, 3, '#b0aaa2');
    const ra = revealA(t), sh = shoeShine(t);
    const wst = E.mixStyle(STYLE.dim, STYLE.hero, ra), cst = { near: E.mixCol([18, 18, 18], [190, 190, 190], ra), far: E.mixCol([14, 14, 14], [130, 130, 130], ra) };
    const wrot = -travel(t) / 30;
    const k = kid(t);
    const kBehind = t < CUE.around + .45 || t > CUE.grab - .3; // pasa por delante de la silla al rodearla
    if (kBehind) figure(k, STYLE.hero);
    wheelchair(wx(t), wrot, cst);
    const w = figure(wkid(t), wst, { alpha: .12 + .88 * ra });
    if (!kBehind) figure(k, STYLE.hero);
    // zapatos rojos en los pies del niño de la silla
    const s1 = w.legs[0][2], s2 = w.legs[1][2];
    if (!refl && sh > 0) glowCircle(s1.x, s1.y, 70, '255,40,30', .35 * sh * (1 - .5 * ra) + .15 * bump(t, CUE.shoes, CUE.envy));
    shoe(s2.x + 2, s2.y + 1, .62, .5 + .5 * sh); shoe(s1.x, s1.y + 2, .65, .5 + .5 * sh);
    // estela roja de los zapatos al correr
    if (!refl && t > CUE.fly) {
      const a = smooth(prog(t, CUE.fly, CUE.fly + .6));
      const g = ctx.createLinearGradient(s1.x, 0, s1.x + 160, 0);
      g.addColorStop(0, `rgba(255,50,40,${.5 * a})`); g.addColorStop(1, 'rgba(255,50,40,0)');
      ctx.fillStyle = g; ctx.fillRect(s1.x, s1.y - 6, 160, 8);
    }
  },
  front(t) {
    // destellos sobre los zapatos
    const w = E.solve(wkid(t)), s1 = w.legs[0][2];
    if (t > CUE.shoes && t < CUE.envy + .4) for (let i = 0; i < 5; i++) {
      const k = ((t * 1.1 + i / 5) % 1), a = Math.sin(Math.PI * k);
      const x = s1.x - 6 + (i * 9 % 22), y = s1.y - 8 - (i * 5 % 9);
      ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(x - 4 * a, y); ctx.lineTo(x + 4 * a, y); ctx.moveTo(x, y - 4 * a); ctx.lineTo(x, y + 4 * a); ctx.stroke(); ctx.restore();
    }
    // golpe con la piedra
    burst(STONE, FLOOR - 8, t, CUE.stone + .02, { n: 10, speed: 90, size: 2, color: '255,90,70', life: .6, seed: 2 });
    ring(STONE, FLOOR - 6, t, CUE.stone + .02, { r: 40, color: '255,80,60', life: .4, width: 3 });
    // globos de pensamiento: él quiere zapatos; el otro quiere correr
    const k = E.solve(kid(t));
    const kA = smooth(prog(t, CUE.envy + .1, CUE.envy + .5)) * (1 - smooth(prog(t, CUE.pop - .05, CUE.pop + .05)));
    bubble(k.head.x + 44, k.head.y - 74, .75, kA, (cx, cy) => { shoe(cx - 14, cy + 6, 1.7, 1, 1); });
    const wA = smooth(prog(t, CUE.both - .2, CUE.both + .3)) * (1 - smooth(prog(t, CUE.pop + .3, CUE.pop + .8)));
    ctx.save(); ctx.translate(w.head.x - 44, w.head.y - 74); ctx.scale(-1, 1);
    bubble(0, 0, .75, wA, () => { const rp = run(0, t * 140, { s: .3, y: 20 }); figure(rp, STYLE.hero, { noShadow: true }); });
    ctx.restore();
    burst(k.head.x + 40, k.head.y - 70, t, CUE.pop, { n: 18, speed: 160, size: 2.5, color: '255,255,255', life: .6, seed: 6 });
    // corazones y risas en la carrera
    for (let i = 0; i < 6; i++) {
      const t0 = CUE.fly + .4 + i * .65, q = prog(t, t0, t0 + 1.8); if (q <= 0 || q >= 1) continue;
      heart(w.head.x + 30 + 30 * Math.sin(i * 2.1) + 50 * q, w.head.y - 30 - 110 * easeOut(q), 12 + 4 * (i % 3), '#ff3b36', 1 - q);
    }
    // líneas de velocidad
    if (t > CUE.fly) {
      const a = smooth(prog(t, CUE.fly, CUE.fly + .5)) * (1 - smooth(prog(t, CUE.slow, D)) * .6);
      const g = E.rng(Math.floor(t * 12));
      ctx.strokeStyle = `rgba(255,255,255,${.25 * a})`; ctx.lineWidth = 1.5;
      for (let i = 0; i < 10; i++) { const y = FLOOR - 20 - g() * 200, x = wx(t) + 60 + g() * 220; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 50 + g() * 60, y); ctx.stroke(); }
      burst(wx(t) + 10, FLOOR - 4, t, Math.floor(t * 4) / 4, { n: 6, speed: 60, size: 2, color: '180,180,180', life: .5, seed: Math.floor(t * 4) });
    }
  },
  events() {
    const ev = E.footsteps(D, t => {
      if (t < CUE.look + .2 && !(t > CUE.stone && t < CUE.limp)) return [{ phi: (kWalkX(t) - 40) / (4 * 22 * KS * (t > CUE.limp ? .7 : 1)), size: KS, vol: 1 }];
      if (t > CUE.around && t < CUE.grab) return [{ phi: kAroundX(t) * 1.1 / (4 * 22 * KS), size: KS }];
      if (t > CUE.fly - .2) return [{ phi: travel(t) * 1.25 / (4 * 34 * KS), size: KS, vol: .9 }];
      return [null];
    });
    ev.push({ t: .05, type: 'whoosh', vol: .5 }, { t: CUE.stone, type: 'scuff', vol: 1 }, { t: CUE.stone + .02, type: 'snap', vol: .6 }, { t: CUE.stone + .1, type: 'thud', vol: .3 });
    ev.push({ t: CUE.shoes, type: 'sparkle' }, { t: CUE.shoes, type: 'chime', vol: .7 }, { t: CUE.envy + .1, type: 'pop', vol: .5 });
    ev.push({ t: CUE.reveal, type: 'impact', vol: .5 }, { t: CUE.both, type: 'pop', vol: .5 }, { t: CUE.pop, type: 'pop', vol: .9 }, { t: CUE.pop + .4, type: 'heartbeat', vol: .5 });
    ev.push({ t: CUE.smile, type: 'chime' }, { t: CUE.push, type: 'whoosh', vol: .7 }, { t: CUE.fly, type: 'wind', dur: D - CUE.fly, vol: .6 }, { t: CUE.fly + .3, type: 'cheer', dur: 3 });
    for (let i = 0; i < 6; i++) ev.push({ t: CUE.fly + .4 + i * .65, type: 'pop', vol: .3 });
    return ev;
  },
  music: {
    sections: [
      { t: 0, dur: CUE.reveal, style: 'tender', chords: ['Am', 'F', 'C', 'G'], chordLen: 1.2 },
      { t: CUE.reveal, dur: CUE.smile - CUE.reveal, style: 'sad', chords: ['Am', 'F', 'Am', 'Em'], chordLen: 1 },
      { t: CUE.smile, dur: CUE.fly - CUE.smile, style: 'build', chords: ['F', 'G', 'Am', 'G'], chordLen: .7 },
      { t: CUE.fly, dur: D - CUE.fly, style: 'upbeat', chords: ['C', 'G', 'Am', 'F'], chordLen: 1, bpm: 118 },
    ],
    stingers: [{ t: CUE.shoes, type: 'chime' }, { t: CUE.reveal, type: 'impact' }, { t: CUE.fly, type: 'bells' }],
    duck: [[CUE.pop - .1, CUE.smile]],
  },
};
})();
