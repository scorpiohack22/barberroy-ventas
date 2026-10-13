// 37 — NO ENVIDIES LO QUE NO CONOCES: en una casa pequeña una familia se abraza. El padre sale y mira
// con envidia la mansión. Adentro de la mansión, un hombre solo en una mesa larga mira la casita con la misma
// envidia. Ambos bajan la cabeza… el hijo sale corriendo por su papá y vuelven juntos al abrazo.
(() => {
const { FLOOR, clamp, lerp, prog, smooth, easeOut, easeIn, easeInOut, keyed, bump, pulse, stand, walk, run, sit, mix, poseAt,
        figure, STYLE, glowCircle, ctx, burst, ring, heart, bubble, coin, holdPoint } = E;
const D = 20;
const CUE = { kidIn: .1, hug: .75, leave: 3.3, door: 4.4, stop: 5.9, mansion: 6.1, dadB: 6.6, inside: 8.0, richB: 8.8, wide: 10.6, sigh: 12.0,
              kidOut: 12.6, reach: 13.9, smile: 14.2, home: 14.7, inHome: 16.7, momHug: 17.0 };
const HX = 165, HW = 250, HH = 185;           // casa pequeña
const MX = 745, MW = 340, MH = 310;           // mansión
const DAD_OUT = 425;
const WARM = { near: '#fff2e0', far: '#cdb79a', glow: .35, glowColor: '255,200,140' };

// ── papá ──
const dadX = t => t < CUE.home ? keyed([[CUE.leave, 200], [CUE.door, 290], [CUE.stop, DAD_OUT]], t, p => p) : keyed([[CUE.home, DAD_OUT], [CUE.inHome, 210]], t, p => p);
function dad(t) {
  const hugP = t2 => { const p = stand(200, { t: t2, dir: -1, lean: .2, tilt: .3 }); const sway = Math.sin(t2 * 2.2) * 3; p.hip.x += sway;
    p.arms = [{ target: { x: 166 + sway, y: FLOOR - 120 } }, { target: { x: 154 + sway, y: FLOOR - 128 } }]; return p; };
  const turn = t2 => { const p = stand(200, { t: t2, dir: 1, lean: .1, tilt: .25 }); p.arms = [{ ang: .1, bend: .3 }, { ang: -.05, bend: .3 }]; return p; };
  const walking = t2 => { const x = dadX(t2); return walk(x, x, { lean: .08, tilt: .05 }); };
  const look = t2 => { const p = stand(DAD_OUT, { t: t2, lean: -.02, tilt: -.22 }); p.arms = [{ ang: .05, bend: .2 }, { ang: -.05, bend: .2 }]; return p; };
  const envy = t2 => { const p = stand(DAD_OUT, { t: t2, lean: .02, tilt: -.28 }); const h = E.headOf(p); p.arms = [{ target: { x: h.x + 4, y: h.y + 28 } }, { ang: -.05, bend: .2 }]; return p; };
  const sighP = t2 => { const p = E.sad(DAD_OUT, { t: t2 }); return p; };
  const kidCome = t2 => { const p = stand(DAD_OUT, { t: t2, dir: -1, lean: .3, tilt: .55 }); p.arms = [{ target: kidHand(t2) }, { ang: 0, bend: .2 }]; return p; };
  const smileP = t2 => { const p = stand(DAD_OUT, { t: t2, dir: -1, lean: .12, tilt: .2 }); p.arms = [{ target: kidHand(t2) }, { ang: .1, bend: .3 }]; return p; };
  const back = t2 => { const x = dadX(t2); const p = walk(x, DAD_OUT - x, { dir: -1, lean: .06, tilt: .15 }); p.arms = [{ target: kidHand(t2) }, p.arms[1]]; return p; };
  const famHug = t2 => { const p = stand(210, { t: t2, dir: -1, lean: .22, tilt: .35 }); const sway = Math.sin(t2 * 2) * 3; p.hip.x += sway;
    p.arms = [{ target: { x: 174 + sway, y: FLOOR - 118 } }, { target: { x: 162 + sway, y: FLOOR - 126 } }]; return p; };
  return poseAt(t, [[0, hugP], [CUE.leave - .3, hugP], [CUE.leave + .2, turn], [CUE.leave + .4, walking], [CUE.stop - .1, walking], [CUE.stop + .3, look], [CUE.dadB - .2, look],
    [CUE.dadB + .3, envy], [CUE.sigh - .1, envy], [CUE.sigh + .5, sighP], [CUE.reach - .4, sighP], [CUE.reach, kidCome], [CUE.smile + .3, smileP], [CUE.home + .2, back],
    [CUE.inHome - .1, back], [CUE.momHug, famHug], [D, famHug]]);
}
// ── hijo ──
const kidX = t => t < CUE.kidOut ? keyed([[0, 60], [CUE.hug, 172]], t, easeOut) : t < CUE.home ? keyed([[CUE.kidOut, 172], [CUE.reach - .1, DAD_OUT - 46]], t, p => p) : dadX(t) - 46;
function kidHand(t) { const k = kidPose0(t), d0 = stand(dadX(t), { dir: -1 }); return holdPoint(E.shoulderOf(k), E.ARM * .55, E.shoulderOf(d0), E.ARM); }
function kidPose0(t) { return stand(kidX(t), { s: .55, t, lean: 0, tilt: -.3 }); }
function kid(t) {
  const running = t2 => { const x = kidX(t2); return run(x, x * 1.3, { s: .55, lean: .3 }); };
  const hugK = t2 => { const p = stand(172, { s: .55, t: t2, tilt: -.25 }); const sway = Math.sin(t2 * 2.2) * 3; p.hip.x += sway;
    p.arms = [{ target: { x: 202, y: FLOOR - 112 } }, { target: { x: 138, y: FLOOR - 112 } }]; return p; };
  const waveBye = t2 => { const p = stand(172, { s: .55, t: t2, tilt: -.15 }); p.arms = [{ ang: .1, bend: .2 }, { ang: 0, bend: .2 }]; return p; };
  const runOut = t2 => { const x = kidX(t2); return run(x, x * 1.2, { s: .55, lean: .3, tilt: -.2 }); };
  const holdUp = t2 => { const p = stand(kidX(t2), { s: .55, t: t2, tilt: -.45, lean: -.05 }); p.arms = [{ target: kidHand(t2) }, { ang: .2, bend: .3 }]; return p; };
  const backK = t2 => { const x = kidX(t2); const p = walk(x, DAD_OUT - x, { s: .55, dir: -1, tilt: -.35 }); p.dir = -1; p.arms = [{ target: kidHand(t2) }, p.arms[1]]; return p; };
  const famK = t2 => { const p = stand(174, { s: .55, t: t2, tilt: -.3 }); p.arms = [{ target: { x: 208, y: FLOOR - 110 } }, { target: { x: 142, y: FLOOR - 110 } }]; return p; };
  return poseAt(t, [[0, running], [CUE.hug - .15, running], [CUE.hug + .1, hugK], [CUE.leave, hugK], [CUE.leave + .4, waveBye], [CUE.kidOut, waveBye], [CUE.kidOut + .2, runOut],
    [CUE.reach - .15, runOut], [CUE.reach + .2, holdUp], [CUE.home, holdUp], [CUE.home + .3, backK], [CUE.inHome - .2, backK], [CUE.momHug, famK], [D, famK]]);
}
// ── mamá ──
function mom(t) {
  const hugM = t2 => { const p = stand(140, { t: t2 + 2, lean: .2, tilt: .3 }); const sway = Math.sin(t2 * 2.2) * 3; p.hip.x += sway;
    p.arms = [{ target: { x: 176 + sway, y: FLOOR - 118 } }, { target: { x: 186 + sway, y: FLOOR - 128 } }]; return p; };
  const watch = t2 => { const p = stand(140, { t: t2 + 2, lean: .04, tilt: 0 }); p.arms = [{ ang: .3, bend: .9 }, { ang: .2, bend: .9 }]; return p; };
  const door = t2 => { const p = stand(140, { t: t2 + 2, lean: .02, tilt: -.05 }); p.arms = [{ ang: .9, bend: .2 }, { ang: .6, bend: .3 }]; return p; };
  return poseAt(t, [[0, hugM], [CUE.leave, hugM], [CUE.leave + .5, watch], [CUE.home + .5, watch], [CUE.inHome - .3, door], [CUE.momHug, hugM], [D, hugM]]);
}
// ── el rico, sentado al final de la mesa larga, mirando a la izquierda ──
const RX = 862, SEAT = FLOOR - 50;
function rich(t) {
  const base = (lean, tilt) => { const p = sit(RX, { dir: -1, lean, tilt }); return p; };
  const eat = t2 => { const p = base(.15, .25); p.arms = [{ target: { x: RX - 54, y: FLOOR - 86 + 3 * Math.sin(t2 * 3) } }, { target: { x: RX - 46, y: FLOOR - 84 } }]; return p; };
  const look = t2 => { const p = base(.02, -.12); p.arms = [{ target: { x: RX - 50, y: FLOOR - 84 } }, { target: { x: RX - 40, y: FLOOR - 84 } }]; return p; };
  const chin = t2 => { const p = base(.22, -.05); const h = E.headOf(p); p.arms = [{ target: { x: h.x - 4, y: h.y + 26 } }, { target: { x: RX - 40, y: FLOOR - 84 } }]; return p; };
  const down = t2 => { const p = base(.38, .7); p.arms = [{ target: { x: RX - 46, y: FLOOR - 84 } }, { target: { x: RX - 38, y: FLOOR - 84 } }]; return p; };
  return poseAt(t, [[0, eat], [CUE.richB - .9, eat], [CUE.richB - .4, look], [CUE.richB + .5, look], [CUE.richB + 1, chin], [CUE.sigh, chin], [CUE.sigh + .6, down], [D, down]]);
}

// ── escenografía ──
function smallHouse(t, refl) {
  const x0 = HX - HW / 2, x1 = HX + HW / 2, top = FLOOR - HH, peak = top - 78;
  const warm = .8 + .2 * smooth(prog(t, CUE.inHome, CUE.momHug + 1)) + .04 * Math.sin(t * 6);
  if (!refl) { glowCircle(HX, FLOOR - 70, 260, '255,170,90', .2 * warm); }
  // interior cálido
  const g = ctx.createLinearGradient(0, peak, 0, FLOOR);
  g.addColorStop(0, `rgba(120,70,30,${.35 * warm})`); g.addColorStop(1, `rgba(255,170,90,${.32 * warm})`);
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x0, FLOOR); ctx.lineTo(x0, top); ctx.lineTo(HX, peak); ctx.lineTo(x1, top); ctx.lineTo(x1, FLOOR); ctx.fill();
  // lámpara colgante cálida
  ctx.strokeStyle = 'rgba(255,220,180,.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(HX, peak + 10); ctx.lineTo(HX, top + 10); ctx.stroke();
  if (!refl) glowCircle(HX, top + 16, 70, '255,200,120', .55 * warm);
  ctx.fillStyle = '#ffd9a0'; ctx.beginPath(); ctx.arc(HX, top + 16, 6, 0, Math.PI * 2); ctx.fill();
  // paredes y techo (contorno)
  ctx.strokeStyle = '#a89a88'; ctx.lineWidth = 6; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(x1, FLOOR - 112); ctx.lineTo(x1, top); ctx.lineTo(HX, peak); ctx.lineTo(x0, top); ctx.lineTo(x0, FLOOR); ctx.stroke();
  // chimenea y marco de la puerta
  ctx.beginPath(); ctx.moveTo(x0 + 34, top - 30); ctx.lineTo(x0 + 34, top - 56); ctx.lineTo(x0 + 54, top - 56); ctx.lineTo(x0 + 54, top - 46); ctx.stroke();
}
function mansion(t, refl) {
  const x0 = MX - MW / 2, x1 = MX + MW / 2, top = FLOOR - MH, ped = top - 70;
  const lit = 1 - .5 * smooth(prog(t, CUE.sigh, CUE.momHug + 1.5));
  // interior frío y enorme
  const g = ctx.createLinearGradient(0, ped, 0, FLOOR);
  g.addColorStop(0, `rgba(40,42,48,${.5 * lit})`); g.addColorStop(1, `rgba(70,72,80,${.35 * lit})`);
  ctx.fillStyle = g; ctx.fillRect(x0, top, MW, MH);
  // ventanas doradas arriba (riqueza)
  for (let i = 0; i < 5; i++) {
    const wx = x0 + 40 + i * 65, wy = top + 26;
    ctx.fillStyle = `rgba(255,205,110,${.5 * lit})`; ctx.shadowColor = '#ffc860'; ctx.shadowBlur = refl ? 0 : 16 * lit;
    ctx.beginPath(); ctx.roundRect(wx - 12, wy, 24, 46, [12, 12, 0, 0]); ctx.fill(); ctx.shadowBlur = 0;
  }
  // candelabro
  ctx.strokeStyle = '#8c8470'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(MX, top); ctx.lineTo(MX, top + 98); ctx.stroke();
  ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(MX - 34, top + 110); ctx.quadraticCurveTo(MX, top + 130, MX + 34, top + 110); ctx.stroke();
  for (const dx of [-34, -12, 12, 34]) { if (!refl) glowCircle(MX + dx, top + 104, 18, '255,220,150', .6 * lit); ctx.fillStyle = `rgba(255,235,190,${lit})`; ctx.beginPath(); ctx.arc(MX + dx, top + 104, 2.5, 0, Math.PI * 2); ctx.fill(); }
  // mesa larga y sillas vacías
  ctx.fillStyle = '#6e6658'; ctx.fillRect(x0 + 30, FLOOR - 78, 232, 8);
  ctx.fillRect(x0 + 40, FLOOR - 78, 6, 78); ctx.fillRect(x0 + 250, FLOOR - 78, 6, 78);
  for (let i = 0; i < 4; i++) { const cx = x0 + 62 + i * 52; ctx.strokeStyle = 'rgba(140,130,115,.6)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(cx, FLOOR); ctx.lineTo(cx, FLOOR - 50); ctx.lineTo(cx + 18, FLOOR - 50); ctx.moveTo(cx, FLOOR - 50); ctx.lineTo(cx, FLOOR - 104); ctx.stroke(); }
  // monedas y copa doradas junto a él
  for (let i = 0; i < 4; i++) { ctx.fillStyle = '#ffc93c'; ctx.shadowColor = '#ffb400'; ctx.shadowBlur = refl ? 0 : 8; ctx.fillRect(x0 + 216 - 3, FLOOR - 86 - i * 4, 16, 3.5); }
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#ffc93c'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x0 + 200, FLOOR - 79); ctx.lineTo(x0 + 200, FLOOR - 92); ctx.moveTo(x0 + 192, FLOOR - 102); ctx.quadraticCurveTo(x0 + 200, FLOOR - 88, x0 + 208, FLOOR - 102); ctx.stroke();
  // fachada: columnas, frontón, escalinata
  ctx.strokeStyle = '#9a9a9e'; ctx.lineWidth = 6; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(x0, FLOOR); ctx.lineTo(x0, top); ctx.lineTo(x1, top); ctx.lineTo(x1, FLOOR); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x0 - 16, top); ctx.lineTo(MX, ped); ctx.lineTo(x1 + 16, top); ctx.closePath(); ctx.stroke();
  ctx.lineWidth = 10; for (const cx of [x0 + 4, x1 - 4]) { ctx.beginPath(); ctx.moveTo(cx, FLOOR); ctx.lineTo(cx, top + 6); ctx.stroke(); }
  ctx.fillStyle = '#5a5a5e'; ctx.fillRect(x0 - 20, FLOOR - 6, MW + 40, 6);
}
// íconos de los globos
function iconMansion(cx, cy) {
  ctx.strokeStyle = '#ddd'; ctx.lineWidth = 3; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(cx - 26, cy + 20); ctx.lineTo(cx - 26, cy - 6); ctx.lineTo(cx + 26, cy - 6); ctx.lineTo(cx + 26, cy + 20); ctx.closePath(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx - 30, cy - 6); ctx.lineTo(cx, cy - 24); ctx.lineTo(cx + 30, cy - 6); ctx.stroke();
  for (const dx of [-16, 0, 16]) { ctx.beginPath(); ctx.moveTo(cx + dx, cy - 2); ctx.lineTo(cx + dx, cy + 18); ctx.stroke(); }
  coin(cx + 30, cy + 16, 9, 0);
}
function iconFamily(cx, cy) {
  for (const [dx, s] of [[-18, .3], [18, .3], [0, .2]]) figure(stand(cx + dx, { s, y: cy + 28 }), WARM, { noShadow: true });
  heart(cx, cy - 22, 12, '#ff3b36', 1, 10);
}

window.SCENE = {
  id: '37-no-envidies', title: 'No envidies *lo que no conoces*', duration: D, cue: CUE,
  sky: t => .15,
  spot: t => ({ x: keyed([[0, 160], [CUE.stop, 330], [CUE.inside, 680], [CUE.wide, 460], [CUE.kidOut, 300], [CUE.momHug, 200]], t), r: 380 }),
  beam: t => ({ x: keyed([[0, 160], [CUE.stop, DAD_OUT], [CUE.inside, RX - 20], [CUE.wide, DAD_OUT], [CUE.momHug, 170]], t), a: .045, w: 130 }),
  flashes: [], blackouts: [CUE.inside - .02, CUE.wide - .02],
  camera: t => {
    const k = [[0, 160, 2.0, 160], [CUE.hug + .4, 170, 2.1, 155], [CUE.leave, 185, 1.95, 165], [CUE.door, 280, 1.9, 175], [CUE.stop, 390, 1.85, 175],
               [CUE.mansion + .1, 395, 1.85, 175], [CUE.dadB + .6, 600, 1.08, 300], [CUE.inside - .03, 615, 1.05, 300],
               [CUE.inside, 780, 2.1, 140], [CUE.richB + 1.2, 810, 2.3, 125], [CUE.wide - .03, 820, 2.35, 125],
               [CUE.wide, 515, .84, 300], [CUE.sigh + .4, 515, .87, 290], [CUE.kidOut + .3, 380, 1.6, 190], [CUE.reach + .3, 390, 2.0, 160],
               [CUE.home + .4, 360, 1.95, 165], [CUE.inHome, 225, 1.95, 160], [CUE.momHug + .8, 200, 2.0, 165], [D - 1.6, 320, 1.3, 240], [D, 520, .83, 300]];
    const pick = i => k.map(r => [r[0], r[i]]);
    return { x: keyed(pick(1), t), zoom: keyed(pick(2), t), y: FLOOR - keyed(pick(3), t), shake: 0 };
  },
  world(t, refl) {
    smallHouse(t, refl);
    mansion(t, refl);
    E.chair(RX, -1, FLOOR, '#6d6d6d');
    figure(rich(t), E.mixStyle(STYLE.gray, STYLE.dim, .4 * smooth(prog(t, CUE.sigh, CUE.momHug + 1))));
    const lit = smooth(prog(t, CUE.leave, CUE.stop)) * (1 - smooth(prog(t, CUE.home, CUE.inHome)));
    figure(mom(t), WARM);
    figure(dad(t), E.mixStyle(WARM, STYLE.hero, lit));
    figure(kid(t), WARM);
  },
  front(t) {
    const dh = E.headOf(dad(t)), rh = E.headOf(rich(t));
    const dA = smooth(prog(t, CUE.dadB, CUE.dadB + .4)) * (1 - smooth(prog(t, CUE.sigh + .3, CUE.sigh + .8)));
    bubble(dh.x + 46, dh.y - 76, .8, dA, iconMansion);
    const rA = smooth(prog(t, CUE.richB, CUE.richB + .4)) * (1 - smooth(prog(t, CUE.sigh + .3, CUE.sigh + .8)));
    ctx.save(); ctx.translate(rh.x - 46, rh.y - 76); ctx.scale(-1, 1); bubble(0, 0, .8, rA, (cx, cy) => { ctx.scale(-1, 1); iconFamily(cx, cy); }); ctx.restore();
    // el abrazo final: corazones que suben de la casa
    for (let i = 0; i < 7; i++) {
      const t0 = CUE.momHug + .2 + i * .35, q = prog(t, t0, t0 + 2); if (q <= 0 || q >= 1) continue;
      heart(176 + 40 * Math.sin(i * 2.4) + 10 * Math.sin(q * 6), FLOOR - 160 - 160 * easeOut(q), 12 + 5 * (i % 3), '#ff3b36', 1 - q);
    }
    for (const t0 of [CUE.hug]) { heart(172, FLOOR - 170 - 60 * easeOut(prog(t, t0, t0 + 1.5)), 16, '#ff3b36', bump(t, t0, t0 + 1.5)); }
    ring(190, FLOOR - 110, t, CUE.momHug, { r: 200, color: '255,190,120', life: 1 });
    burst(190, FLOOR - 110, t, CUE.momHug, { n: 30, speed: 180, size: 2.5, color: '255,200,140', life: 1.3, gravity: -.2, seed: 7 });
  },
  events() {
    const ev = E.footsteps(D, t => {
      const d = t > CUE.leave + .4 && t < CUE.stop ? { phi: dadX(t) / 88, size: 1 } : t > CUE.home && t < CUE.inHome ? { phi: (DAD_OUT - dadX(t)) / 88, size: 1 } : null;
      const k = t < CUE.hug ? { phi: kidX(t) * 1.3 / (4 * 34 * .55), size: .55 } : t > CUE.kidOut && t < CUE.reach ? { phi: kidX(t) * 1.2 / (4 * 34 * .55), size: .55 } : null;
      return [d, k];
    });
    ev.push({ t: CUE.hug, type: 'kiss', vol: .6 }, { t: CUE.hug, type: 'chime', vol: .6 }, { t: CUE.door, type: 'door', vol: .6 });
    ev.push({ t: CUE.mansion + .1, type: 'whoosh', vol: .7 }, { t: CUE.dadB, type: 'pop', vol: .5 }, { t: CUE.dadB + .1, type: 'coin', vol: .6 });
    ev.push({ t: CUE.inside, type: 'whoosh', vol: .5 }, { t: CUE.inside + .2, type: 'clock', dur: CUE.wide - CUE.inside - .2, accel: false });
    ev.push({ t: CUE.richB, type: 'pop', vol: .5 }, { t: CUE.wide, type: 'impact', vol: .5 }, { t: CUE.sigh, type: 'wind', dur: 1.5, vol: .4 });
    ev.push({ t: CUE.reach, type: 'chime' }, { t: CUE.momHug, type: 'sparkle' }, { t: CUE.momHug + .1, type: 'kiss', vol: .6 }, { t: CUE.momHug, type: 'swell', dur: 2 });
    return ev;
  },
  music: {
    sections: [
      { t: .05, dur: CUE.leave + .3, style: 'tender', chords: ['C', 'G', 'Am', 'F'], chordLen: 1.1 },
      { t: CUE.leave + .3, dur: CUE.inside - CUE.leave, style: 'build', chords: ['Am', 'F', 'C', 'G'], chordLen: .9 },
      { t: CUE.inside, dur: CUE.kidOut - CUE.inside, style: 'sad', chords: ['Am', 'Em', 'F', 'Am'], chordLen: 1.1 },
      { t: CUE.reach - .2, dur: D - CUE.reach + .2, style: 'hope', chords: ['F', 'C', 'G', 'C'], chordLen: 1.4 },
    ],
    stingers: [{ t: CUE.mansion + .1, type: 'impact' }, { t: CUE.wide, type: 'boom' }, { t: CUE.momHug, type: 'bells' }],
    duck: [[CUE.sigh + .2, CUE.reach - .2]],
  },
};
})();
