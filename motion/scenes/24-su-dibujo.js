// 24 — SU DIBUJO: el niño le lleva un dibujo con un corazón a su mamá ocupada; ella, sin mirar, lo tira a una caja.
// Pasan los años (el hijo crece y se va). La mamá anciana abre la caja: el corazón brilla; el recuerdo del niño
// se lo vuelve a ofrecer y se deshace en luz. Ella abraza el dibujo contra el pecho.
(() => {
const { FLOOR, clamp, lerp, prog, smooth, easeOut, easeInOut, keyed, bump, pulse, figure, mix, poseAt, stand, walk, run, sit, kneel, sad, mixStyle, STYLE, ctx, glowCircle, burst, ring, rays, sun, moon, chair, table, heart, hand, rng } = E;
const D = 20;
const CUE = { stop: 1.55, tug: 2.25, offer: 3.0, take: 3.75, hold: 4.2, drop: 4.95, lid: 5.45, sadK: 5.7, leave: 6.6,
  tl0: 7.6, tl1: 10.4, rise: 10.8, kneelO: 12.9, open: 13.4, lift: 13.9, glow: 14.3, ghost: 14.7, ghostOut: 16.0, hug: 16.2 };
const BOX = 425, TBL = 262, CH = 368;

// ── utilería propia ──
function laptop(x, a) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha *= a;
  ctx.fillStyle = '#a5a5a5'; ctx.fillRect(x - 30, FLOOR - 86, 62, 6);
  ctx.strokeStyle = '#8a8a8a'; ctx.lineWidth = 7; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x + 28, FLOOR - 84); ctx.lineTo(x + 12, FLOOR - 140); ctx.stroke();
  const fl = .85 + .15 * Math.sin(x + performance.now() * 0); // pantalla encendida
  ctx.strokeStyle = '#e9f0ff'; ctx.lineWidth = 3; ctx.shadowColor = '#cfe0ff'; ctx.shadowBlur = 18 * fl;
  ctx.beginPath(); ctx.moveTo(x + 32, FLOOR - 88); ctx.lineTo(x + 17, FLOOR - 138); ctx.stroke();
  ctx.restore();
  // luz fría de la pantalla sobre la cara
  glowCircle(x + 34, FLOOR - 115, 85, '200,215,240', .26 * a);
}
// caja de recuerdos: lid 0 cerrada → 1 abierta
function memBox(x, lid, dusty) {
  const w = 50, h = 36, y = FLOOR;
  const c = Math.round(lerp(140, 95, dusty));
  ctx.fillStyle = `rgb(${c},${c - 10},${c - 22})`; ctx.fillRect(x - w / 2, y - h, w, h);
  ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(x - w / 2, y - h + 14, w, 3);
  ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(x - w / 2, y - h, w, 3);
  ctx.save(); ctx.translate(x + w / 2, y - h); ctx.rotate(-lid * 1.9);
  ctx.fillStyle = `rgb(${c + 15},${c + 5},${c - 8})`; ctx.fillRect(-w - 2, -6, w + 4, 7);
  ctx.restore();
}
// dibujo: papel con un corazón rojo. glow 0..1
function drawing(x, y, rot, sc, glow) {
  if (glow > 0) { glowCircle(x, y, 90 * sc + 160 * glow, '255,40,35', .35 * glow); }
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sc, sc);
  ctx.fillStyle = '#f2efe8'; ctx.shadowColor = 'rgba(255,255,255,.4)'; ctx.shadowBlur = 8;
  ctx.fillRect(-15, -12, 30, 24); ctx.shadowBlur = 0;
  ctx.restore();
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  heart(0, 1.5 * sc, 15 * sc, '#ff3b36', 1, 8 + 30 * glow);
  ctx.restore();
}

// ── personajes ──
const kidRunD = E.distance([[0, 330], [1.2, 300], [CUE.stop, 0], [D, 0]], D);
function kidPose(t) {
  const x = 760 - kidRunD(t);
  const runP = t => { const p = run(760 - kidRunD(t), kidRunD(t), { s: .55, dir: -1 }); p.arms[0] = { ang: Math.PI - .4, bend: .2 }; return p; };
  const hop = t => { const h = Math.abs(Math.sin((t - CUE.stop) * 9)) * 10 * (1 - prog(t, 2.1, 2.25)); const p = stand(482, { s: .55, dir: -1, tilt: -.35, t }); p.hip.y -= h; p.feet.forEach(f => f.y -= h); p.arms = [{ ang: Math.PI - .35, bend: .1 }, { ang: .4, bend: .3 }]; return p; };
  const tug = t => { const p = stand(474, { s: .55, dir: -1, tilt: -.3, lean: .12, t }); p.arms = [{ target: { x: 452 - 6 * Math.sin(t * 14), y: 812 } }, { ang: .3, bend: .3 }]; return p; };
  const offer = t => { const p = stand(480, { s: .55, dir: -1, tilt: -.45, lean: -.05, t }); p.hip.y -= 4; p.arms = [{ target: { x: 456, y: 770 } }, { ang: .2, bend: .3 }]; return p; };
  const wait = stand(480, { s: .55, dir: -1, tilt: -.2, t, arms: [{ ang: .4, bend: .5 }, { ang: .3, bend: .4 }] });
  const sadP = sad(486, { s: .55, dir: -1, tilt: .7, lean: .22, t });
  const leaveP = t => { const d = Math.max(0, (t - CUE.leave) * 34); const p = walk(488 + d, d, { s: .55, dir: 1, lean: .2, tilt: .6, stride: .7 }); p.arms = [{ ang: .02, bend: .05 }, { ang: -.02, bend: .05 }]; return p; };
  return poseAt(t, [[0, runP], [CUE.stop - .1, runP], [CUE.stop + .15, hop], [CUE.tug - .05, hop], [CUE.tug + .2, tug], [CUE.offer - .1, tug],
    [CUE.offer + .25, offer], [CUE.take + .25, offer], [CUE.take + .6, wait], [CUE.drop, wait], [CUE.sadK + .5, sadP], [CUE.leave - .1, sadP], [CUE.leave + .3, leaveP], [D, leaveP]]);
}
const typing = (t, k) => ({ target: { x: 316 + 6 * Math.sin(t * 19 + k * 2) + k * 8, y: FLOOR - 86 - 4 * Math.abs(Math.sin(t * 23 + k)) } });
function momPose(t) {
  const age = smooth(prog(t, CUE.tl0 + .4, CUE.tl1 - .3));
  const sitP = t => { const p = sit(358, { dir: -1, lean: lerp(.12, .3, age), tilt: lerp(.15, .45, age) }); p.arms = age < .3 ? [typing(t, 0), typing(t, 1)] : [{ target: { x: 335, y: 830 } }, { target: { x: 342, y: 838 } }]; return p; };
  const shrug = t => { const p = sitP(t); p.hip.y -= 3 * bump(t, CUE.tug, CUE.tug + .5); p.lean += .08 * bump(t, CUE.tug, CUE.tug + .5); return p; };
  const reachBack = (tg, ln = -.3) => t => { const p = sitP(t); p.lean = ln; p.arms = [typing(t, 0), { target: tg }]; return p; };
  const stand1 = t => { const p = stand(372, { dir: 1, lean: .3, tilt: .3, t }); p.arms = [{ target: { x: 404, y: FLOOR - 70 } }, { ang: .1, bend: .2 }]; return p; };
  const walkO = t => { const d = keyed([[11.5, 0], [12.6, 92]], t, x => x); const p = walk(372 + d, d, { stride: .5, lean: .3, tilt: .35, stand: 90 }); p.arms = [{ target: { x: 404 + d, y: FLOOR - 70 } }, { ang: .2, bend: .2 }]; p.walkD = d; return p; };
  const turn = stand(470, { dir: -1, lean: .3, tilt: .5, t });
  const reachIn = { ...kneel(488, { dir: -1, lean: .78, tilt: .5 }), arms: [{ target: { x: BOX + 2, y: FLOOR - 26 } }, { target: { x: 446, y: FLOOR - 24 } }] };
  const lookP = { ...kneel(488, { dir: -1, lean: .15, tilt: -.05 }), arms: [{ target: { x: 452, y: 772 } }, { target: { x: 458, y: 790 } }] };
  const lookUp = { ...kneel(488, { dir: -1, lean: .05, tilt: -.25 }), arms: [{ target: { x: 446, y: 768 } }, { target: { x: 452, y: 786 } }] };
  const hugP = t => { const p = kneel(488, { dir: -1, lean: .42, tilt: .75 }); const b = Math.sin(t * 2.4) * 2; p.hip.y += b; p.arms = [{ target: { x: 470, y: 790 + b }, elbowBack: true }, { target: { x: 466, y: 800 + b } }]; return p; };
  return poseAt(t, [[0, sitP], [CUE.tug, shrug], [CUE.take - .4, shrug], [CUE.take, reachBack({ x: 454, y: 772 }, -.32)], [CUE.hold, reachBack({ x: 446, y: 742 }, -.15)],
    [CUE.drop - .25, reachBack({ x: 430, y: 812 }, -.45)], [CUE.drop + .3, sitP], [CUE.rise, sitP], [11.5, stand1], [11.52, walkO], [12.6, walkO], [12.75, turn],
    [CUE.open, reachIn], [CUE.lift, reachIn], [CUE.glow, lookP], [CUE.ghost + .3, lookUp], [CUE.ghostOut, lookUp], [CUE.hug + .6, hugP], [D, hugP]]);
}

// dónde está el dibujo
function paperAt(t, kidSl, momSl) {
  if (t < CUE.take) { const h = hand(kidSl, 0); return { x: h.x - 6, y: h.y - 8, rot: -.2, sc: .9 }; }
  if (t < CUE.drop) { const h = hand(momSl, 1); return { x: h.x, y: h.y - 4, rot: .3, sc: .9 }; }
  if (t < CUE.lid) { const p = easeInOut(prog(t, CUE.drop, CUE.drop + .4)); return { x: lerp(430, BOX, p), y: lerp(808, FLOOR - 18, p * p), rot: lerp(.3, 1.6, p), sc: .9 }; }
  if (t < CUE.lift) return null;
  if (t < CUE.hug) { const h = hand(momSl, 0); return { x: h.x - 2, y: h.y - 2, rot: -.1, sc: lerp(.9, 1.05, smooth(prog(t, CUE.lift, CUE.glow))) }; }
  const h = hand(momSl, 0); return { x: h.x - 6, y: h.y, rot: -.5, sc: 1 };
}

const sunTh = t => 2.3 + easeInOut(prog(t, CUE.tl0, CUE.tl1)) * Math.PI * 6;

window.SCENE = {
  id: '24-su-dibujo', title: 'Guárdalo, *un día* lo extrañarás', duration: D, cue: CUE,
  spot: t => ({ x: keyed([[0, 380], [11, 380], [13, 440]], t), r: 330 }),
  beam: t => ({ x: keyed([[0, 380], [11, 380], [13, 445]], t), a: .045 + .04 * smooth(prog(t, CUE.glow, CUE.glow + 1)), w: 150 }),
  sky: t => .5 * bump(t, CUE.tl0, CUE.tl1) * Math.max(0, Math.sin(sunTh(t))) + .25 * smooth(prog(t, CUE.glow, CUE.glow + 1.5)),
  flashes: [CUE.glow], blackouts: [CUE.lid],
  camera: t => ({
    zoom: keyed([[0, 1.7], [CUE.stop, 1.95], [CUE.offer, 2.1], [CUE.take, 2.4], [CUE.drop, 2.45], [CUE.lid, 2.6], [CUE.sadK + .6, 2.15], [CUE.tl0, 1.95], [CUE.tl1, 1.65],
      [CUE.rise, 1.75], [12.6, 1.9], [CUE.lift, 2.3], [CUE.glow + .3, 2.55], [CUE.ghost + .4, 2.05], [CUE.ghostOut + .4, 2.3], [17.5, 2.2], [D, 1.6]], t),
    x: keyed([[0, 520], [CUE.stop, 425], [CUE.take, 405], [CUE.drop, 410], [CUE.lid, 425], [CUE.sadK + .6, 440], [CUE.tl0, 440], [CUE.tl1, 380],
      [CUE.rise, 380], [12.6, 430], [CUE.lift, 450], [CUE.glow + .3, 452], [CUE.ghost + .4, 430], [CUE.ghostOut + .4, 462], [D, 410]], t),
    y: keyed([[0, FLOOR - 160], [CUE.stop, FLOOR - 150], [CUE.take, FLOOR - 130], [CUE.drop, FLOOR - 100], [CUE.lid, FLOOR - 70], [CUE.sadK + .6, FLOOR - 120], [CUE.tl0, FLOOR - 150], [CUE.tl1, FLOOR - 190],
      [CUE.rise, FLOOR - 180], [12.6, FLOOR - 150], [CUE.lift, FLOOR - 110], [CUE.glow + .3, FLOOR - 125], [CUE.ghost + .4, FLOOR - 140], [CUE.ghostOut + .4, FLOOR - 120], [D, FLOOR - 190]], t),
    shake: .25 * pulse(t, CUE.lid, .2),
  }),
  backdrop(t) {
    const a = bump(t, CUE.tl0 - .2, CUE.tl1 + .2);
    if (a <= 0) return;
    const th = sunTh(t), s = Math.sin(th);
    const p = { x: 380 - Math.cos(th) * 260, y: FLOOR - 60 - s * 330 };
    if (s > 0) sun(p.x, p.y, 30, a);
    else moon(380 + Math.cos(th) * 260, FLOOR - 60 + s * 330, 22, a * .8);
  },
  world(t, refl) {
    const age = smooth(prog(t, CUE.tl0 + .4, CUE.tl1 - .3));
    table(TBL, 170, FLOOR, 80, '#6a6a6a');
    laptop(316, 1 - smooth(prog(t, CUE.tl0 + .2, CUE.tl0 + .9)));
    chair(CH, -1, FLOOR, '#5d5d5d');
    const lid = smooth(prog(t, CUE.drop + .3, CUE.drop + .45)) * 0 + (t < CUE.lid ? smooth(prog(t, 0, .01)) * (1 - smooth(prog(t, CUE.lid - .15, CUE.lid))) : smooth(prog(t, CUE.open, CUE.open + .4)));
    memBox(BOX, lid, age);
    // el hijo crece y se va (silueta lejana durante el time-lapse)
    const gw = prog(t, 8.4, 10.0);
    if (gw > 0 && gw < 1) {
      const d = gw * 520, son = walk(170 + d, d, { s: .95 });
      const sl = figure(son, STYLE.dim, { alpha: bump(t, 8.4, 10.0) });
      E.backpack(sl, 1.1, '#3c3c3c');
    }
    const ms = mixStyle(STYLE.hero, STYLE.gray, age * .55);
    const mp = momPose(t);
    if (t > 11.5 && t < 12.75) { const c = mp; }
    const msl = figure(mp, ms);
    // bastón de la anciana
    if (t > CUE.rise && t < 12.8) { const h = hand(msl, 0); E.cane({ x: h.x, y: h.y - 4 }, { x: h.x + 6, y: FLOOR }); }
    if (t >= 12.8) E.cane({ x: 520, y: FLOOR - 4 }, { x: 572, y: FLOOR - 2 }, '#9a9a9a');
    let ksl = null;
    if (t < 8) ksl = figure(kidPose(t), STYLE.hero, { alpha: 1 - smooth(prog(t, 7.0, 7.7)) });
    else ksl = E.solve(kidPose(0));
    // recuerdo del niño (fantasma) ofreciendo el dibujo otra vez
    const ga = smooth(prog(t, CUE.ghost, CUE.ghost + .5)) * (1 - smooth(prog(t, CUE.ghostOut - .4, CUE.ghostOut + .2)));
    if (ga > 0 && !refl) {
      const gp = stand(396, { s: .55, dir: 1, tilt: -.4, t }); gp.arms = [{ target: { x: 424, y: 772 } }, { ang: .2, bend: .3 }];
      glowCircle(400, 820, 90, '255,255,255', .12 * ga);
      figure(gp, { near: '#ffffff', far: '#d0d0d0', glow: .6 }, { alpha: .55 * ga, noShadow: true });
    }
    const pp = paperAt(t, ksl, msl);
    const glow = smooth(prog(t, CUE.lift + .1, CUE.glow)) * (1 - .4 * smooth(prog(t, CUE.ghostOut, CUE.hug + 1)));
    if (pp) {
      if (glow > 0 && !refl) rays(pp.x, pp.y, t, glow * (1 - .6 * smooth(prog(t, CUE.hug, CUE.hug + 1))), '255,60,50', 14, 380);
      drawing(pp.x, pp.y, pp.rot, pp.sc, refl ? 0 : glow + .5 * pulse((t - CUE.hug) % .9 + CUE.hug, CUE.hug + .1, .3) * (t > CUE.hug ? 1 : 0));
    }
    if (!refl) {
      // el niño-recuerdo se deshace en partículas que vuelven al corazón
      const dt = t - (CUE.ghostOut - .4);
      if (dt > 0 && dt < 1.4 && pp) {
        const g = rng(31);
        for (let i = 0; i < 40; i++) {
          const sx = 380 + g() * 40, sy = 760 + g() * 120, p = easeInOut(clamp(dt / (1 + g() * .4)));
          const x = lerp(sx, pp.x, p) + Math.sin(p * 6 + i) * 16 * (1 - p), y = lerp(sy, pp.y, p) - Math.sin(p * Math.PI) * 40;
          glowCircle(x, y, 7, '255,90,80', .7 * (1 - p * .7));
        }
      }
      ring(450, 772, t, CUE.glow, { color: '255,70,60', r: 160, width: 6, life: 1.1 });
      burst(450, 772, t, CUE.glow, { n: 30, speed: 200, seed: 8, gravity: -.3, life: 1.5 });
    }
  },
  events() {
    const ev = [];
    for (let t = 0; t < 1.5; t += .19) ev.push({ t, type: 'step', size: .55, vol: 1.2 });
    for (let t = .05; t < 5.6; t += .11) if (!(t > CUE.take - .4 && t < CUE.drop + .3)) ev.push({ t, type: 'tick', vol: .18 + .1 * Math.sin(t * 7) ** 2 });
    for (let t = CUE.leave + .2; t < 7.6; t += .42) ev.push({ t, type: 'step', size: .55, vol: .6 });
    for (let t = 11.6; t < 12.6; t += .55) ev.push({ t, type: 'step', size: .9, vol: .7 }, { t: t + .25, type: 'cane', vol: .5 });
    return ev.concat([
      { t: 0, type: 'whoosh', vol: .7 }, { t: .05, type: 'pop', vol: .6 },
      { t: CUE.stop + .2, type: 'pop', vol: .5 }, { t: CUE.stop + .55, type: 'pop', vol: .45 },
      { t: CUE.take, type: 'slide', vol: .5 }, { t: CUE.drop + .35, type: 'slide', vol: .4 }, { t: CUE.lid, type: 'thud', vol: .9 },
      { t: CUE.sadK, type: 'heartbeat', vol: .5 },
      { t: CUE.tl0, type: 'clock', dur: CUE.tl1 - CUE.tl0 }, { t: CUE.tl0 + .1, type: 'riser', dur: 2.8 }, { t: 8.6, type: 'door', vol: .5 },
      { t: CUE.open, type: 'door', vol: .6 }, { t: CUE.lift + .2, type: 'riser', dur: .6 }, { t: CUE.glow, type: 'chime' }, { t: CUE.glow, type: 'sparkle' },
      { t: CUE.ghost, type: 'bell', note: 88 }, { t: CUE.ghostOut - .3, type: 'sparkle' },
      { t: CUE.hug + .7, type: 'heartbeat', vol: .7 }, { t: CUE.hug + 1.6, type: 'heartbeat', vol: .5 }, { t: CUE.hug + 2.5, type: 'heartbeat', vol: .35 },
    ]);
  },
  music: {
    sections: [
      { t: .2, dur: 5.2, style: 'tender', chords: ['C', 'G', 'Am', 'F'], chordLen: 1.3 },
      { t: CUE.lid + .1, dur: 2.1, style: 'sad', chords: ['Am', 'F'], chordLen: 1.0 },
      { t: CUE.tl0, dur: CUE.tl1 - CUE.tl0, style: 'build', chords: ['Am', 'F', 'C', 'G'], chordLen: .7 },
      { t: CUE.tl1, dur: 3.5, style: 'sad', chords: ['Am', 'Em', 'F', 'G'], chordLen: .9 },
      { t: CUE.glow, dur: D - CUE.glow, style: 'hope', chords: ['F', 'C', 'G', 'Am'], chordLen: 1.5 },
    ],
    stingers: [{ t: CUE.tl1, type: 'impact' }, { t: CUE.glow, type: 'bells' }],
    duck: [[CUE.lid, CUE.lid + .5], [CUE.lift - .3, CUE.glow]],
  },
};
})();
