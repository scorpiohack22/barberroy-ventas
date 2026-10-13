// 25 — BÁJATE: fila de corredores en caminadoras, mirando pantallas rojas, sin avanzar.
// Uno baja el ritmo y se baja. Recupera el aliento, voltea: detrás sale un sol enorme. Abre los brazos y respira.
// Los demás siguen corriendo sin darse cuenta.
(() => {
const { FLOOR, clamp, lerp, prog, smooth, easeOut, easeInOut, keyed, bump, pulse, figure, mix, poseAt, stand, walk, run, crouch, mixStyle, STYLE, ctx, glowCircle, burst, ring, rays, sun, rng } = E;
const D = 19;
const CUE = { look: 4.3, slow: 5.0, walkT: 6.0, off: 7.0, down: 7.7, knees: 8.0, dark: 8.7, up: 9.4, light: 9.6, turn: 10.4, arms: 12.0, wide: 14.3 };
const TM = [300, 410, 520, 630];            // caminadoras (la primera es la del protagonista)
const DECK = FLOOR - 14, SPEED = 250;

function treadmill(x, t, on = 1) {
  // estructura
  ctx.fillStyle = '#2b2b2b'; ctx.fillRect(x - 50, DECK, 100, 14);
  ctx.fillStyle = '#4a4a4a'; ctx.fillRect(x - 50, DECK, 100, 3);
  // banda que corre hacia atrás
  ctx.fillStyle = 'rgba(255,255,255,.22)';
  const off = (t * SPEED * on) % 20;
  for (let i = -1; i < 6; i++) { const bx = x + 40 - i * 20 - (20 - off); if (bx > x - 48 && bx < x + 42) ctx.fillRect(bx, DECK + 5, 8, 2); }
  // poste y consola
  ctx.strokeStyle = '#5a5a5a'; ctx.lineWidth = 6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x + 46, DECK); ctx.lineTo(x + 56, FLOOR - 150); ctx.lineTo(x + 30, FLOOR - 140); ctx.stroke();
}
// pantalla roja frente a la cara del corredor
function screenR(x, t, on, seed) {
  const cx = x + 56, cy = FLOOR - 186;
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(-.12);
  ctx.fillStyle = '#111'; ctx.fillRect(-15, -26, 30, 52);
  if (on > 0) {
    const fl = .85 + .15 * Math.sin(t * 31 + seed * 7) * Math.sin(t * 13 + seed);
    ctx.shadowColor = '#ff2a2a'; ctx.shadowBlur = 30 * on;
    ctx.fillStyle = `rgba(255,42,38,${.95 * on * fl})`; ctx.fillRect(-12, -23, 24, 46);
    ctx.shadowBlur = 0;
    // íconos de notificación que se repiten
    const k = ((t * 1.3 + seed * .37) % 1);
    ctx.fillStyle = `rgba(255,255,255,${.85 * on})`;
    if (seed % 2) { ctx.beginPath(); ctx.arc(0, -4, 6, Math.PI, 0); ctx.lineTo(7, 5); ctx.lineTo(-7, 5); ctx.fill(); ctx.fillRect(-1.5, 6, 3, 3); }
    else { ctx.fillRect(-8, -8, 16, 11); ctx.fillStyle = `rgba(255,42,38,${on})`; ctx.beginPath(); ctx.moveTo(-8, -8); ctx.lineTo(0, -1); ctx.lineTo(8, -8); ctx.fill(); }
    ctx.fillStyle = `rgba(255,255,255,${on * (1 - k)})`; ctx.beginPath(); ctx.arc(8, -18 + k * 4, 3.5, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
  if (on > 0) glowCircle(cx - 20, cy, 110, '255,30,30', .2 * on);
}

function runner(i, t) {
  const x = TM[i], d = t * SPEED + i * 37;
  const p = run(x, d, { y: DECK, tilt: .32, lean: .22 });
  return p;
}

function heroPose(t) {
  const drift = t => 300 - 26 * smooth(prog(t, CUE.slow, CUE.off));
  const sp = t => keyed([[0, SPEED], [CUE.slow, SPEED], [CUE.walkT, 110], [CUE.off, 70]], t);
  // fase integrada para que la zancada no salte al bajar el ritmo
  const runF = t => { const p = run(drift(t), dPhase(t), { y: DECK, tilt: lerp(.32, -.05, smooth(prog(t, CUE.look, CUE.look + .5))), lean: .22 }); return p; };
  const walkF = t => walk(drift(t), dPhase(t), { y: DECK, tilt: -.05, lean: .12, stride: .9 });
  const stepOff = { hip: { x: 250, y: FLOOR - 100 }, s: 1, dir: 1, lean: .05, tilt: 0, feet: [{ x: 266, y: DECK }, { x: 230, y: FLOOR }], arms: [{ ang: .4, bend: .3 }, { ang: -.3, bend: .3 }] };
  const knees = t => { const b = Math.sin(t * 7.5) * 3; const p = crouch(226, { amt: .35, tilt: .25 }); p.lean = .75 + .03 * Math.sin(t * 7.5); p.hip.y += b * .4;
    p.feet = [{ x: 242, y: FLOOR }, { x: 214, y: FLOOR }]; p.arms = [{ target: { x: 252, y: FLOOR - 52 } }, { target: { x: 244, y: FLOOR - 50 } }]; return p; };
  const upright = t => stand(226, { t, tilt: -.15, lean: .02 });
  const facing = t => stand(222, { t, dir: -1, tilt: -.1, lean: .02 });
  const openA = t => { const br = Math.sin((t - CUE.arms) * 1.6); const p = stand(222, { dir: -1, lean: -.1, tilt: -.38 + .05 * br });
    p.hip.y += 1.5 * br; p.arms = [{ ang: 2.15 + .05 * br, bend: -.1 }, { ang: -2.05 - .05 * br, bend: .1 }]; return p; };
  return poseAt(t, [[0, runF], [CUE.slow, runF], [CUE.walkT, walkF], [CUE.off, walkF], [CUE.off + .35, stepOff], [CUE.down, stand(228, { tilt: .1, lean: .2 })],
    [CUE.knees, knees], [CUE.up, knees], [CUE.up + .6, upright], [CUE.turn, upright], [CUE.turn + .5, facing], [CUE.arms, facing], [CUE.arms + 1.4, openA], [D, openA]]);
}
// fase de pasos del protagonista (distancia integrada)
const dPhase = (() => { const f = E.distance([[0, SPEED], [CUE.slow, SPEED], [CUE.walkT, 110], [CUE.off, 70], [D, 70]], D); return t => f(t); })();

const sunA = t => smooth(prog(t, CUE.light - .2, CUE.arms + 1));
const sunY = t => lerp(FLOOR + 140, FLOOR - 110, easeOut(prog(t, CUE.light - .2, CUE.arms + 2.5)));

window.SCENE = {
  id: '25-bajate', title: 'Bájate de la rueda y *vive*', duration: D, cue: CUE,
  spot: t => ({ x: keyed([[0, 470], [CUE.off, 400], [CUE.turn, 260]], t), r: 380 }),
  beam: t => ({ x: keyed([[0, 470], [CUE.wide, 470]], t), a: .04 * (1 - sunA(t)), w: 260 }),
  sky: t => .9 * sunA(t),
  flashes: [CUE.arms + 1.2], blackouts: [CUE.dark],
  camera: t => ({
    zoom: keyed([[0, 2.45], [2.6, 1.7], [4.0, 2.0], [CUE.walkT, 2.15], [CUE.off, 2.05], [CUE.knees + .2, 2.35], [CUE.up, 2.25], [CUE.turn, 1.75], [CUE.arms, 1.85], [CUE.arms + 1.4, 2.05], [CUE.wide, 1.95], [17.2, 1.2], [D, 1.18]], t),
    x: keyed([[0, 650], [2.6, 470], [4.0, 330], [CUE.walkT, 315], [CUE.off, 280], [CUE.knees + .2, 250], [CUE.up, 250], [CUE.turn, 200], [CUE.arms, 205], [CUE.arms + 1.4, 215], [CUE.wide, 225], [17.2, 392], [D, 395]], t),
    y: keyed([[0, FLOOR - 190], [2.6, FLOOR - 190], [4.0, FLOOR - 180], [CUE.knees + .2, FLOOR - 140], [CUE.up, FLOOR - 150], [CUE.turn, FLOOR - 220], [CUE.arms, FLOOR - 210], [CUE.arms + 1.4, FLOOR - 200], [CUE.wide, FLOOR - 205], [17.2, FLOOR - 255], [D, FLOOR - 255]], t),
    shake: .15 * pulse(t, CUE.down, .2),
  }),
  backdrop(t) {
    const a = sunA(t);
    if (a <= 0) return;
    const y = sunY(t);
    rays(130, y, t, a * .9, '255,60,50', 18, 900);
    sun(130, y, 118, a);
    // pájaros que cruzan el sol
    const bp = prog(t, 13.0, 18.5);
    if (bp > 0 && bp < 1) {
      ctx.strokeStyle = 'rgba(10,0,0,.85)'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
      for (const [dx, dy, ph] of [[0, 0, 0], [26, 14, 1.3], [-22, 18, 2.1]]) {
        const x = lerp(330, -60, bp) + dx, y = FLOOR - 230 + dy - bp * 50, f = Math.sin(t * 9 + ph) * 6;
        ctx.beginPath(); ctx.moveTo(x - 9, y - f); ctx.quadraticCurveTo(x - 4, y - 2, x, y); ctx.quadraticCurveTo(x + 4, y - 2, x + 9, y - f); ctx.stroke();
      }
    }
  },
  world(t, refl) {
    // reflejo del sol en el piso
    const a = sunA(t);
    if (a > 0 && !refl) {
      const g = ctx.createLinearGradient(0, FLOOR, 0, FLOOR + 90);
      g.addColorStop(0, `rgba(255,60,45,${.35 * a})`); g.addColorStop(1, 'rgba(255,60,45,0)');
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(30, FLOOR); ctx.lineTo(230, FLOOR); ctx.lineTo(420, FLOOR + 90); ctx.lineTo(-160, FLOOR + 90); ctx.fill(); ctx.restore();
    }
    for (let i = TM.length - 1; i >= 1; i--) {
      treadmill(TM[i], t);
      figure(runner(i, t), STYLE.gray);
      screenR(TM[i], t, 1, i);
    }
    const heroOn = t < CUE.off + .2;
    treadmill(TM[0], t, 1);
    const scrOn = t < CUE.dark ? 1 - .7 * (t > CUE.dark - .3 ? (Math.sin(t * 90) > 0 ? 1 : 0) : 0) : 0;
    figure(heroPose(t), STYLE.hero);
    screenR(TM[0], t, scrOn, 4);
    if (!refl) {
      // calor/vapor del esfuerzo: partículas de respiración
      const br = bump(t, CUE.knees, CUE.up + .4);
      if (br > 0) for (let k = 0; k < 3; k++) {
        const ph = ((t * 1.25 + k / 3) % 1);
        glowCircle(256 + ph * 30, FLOOR - 128 + ph * -10, 8 + ph * 16, '255,255,255', .12 * br * (1 - ph));
      }
      ring(222, FLOOR - 140, t, CUE.arms + 1.2, { color: '255,120,100', r: 220, width: 6, life: 1.4 });
      burst(222, FLOOR - 150, t, CUE.arms + 1.2, { n: 34, speed: 180, seed: 4, gravity: -.25, life: 2, color: '255,150,120' });
    }
  },
  events() {
    const ev = E.footsteps(D, t => [
      { phi: dPhase(t) / (4 * 34), size: 1, moving: t < CUE.off + .1, vol: t < CUE.slow ? .7 : 1 },
      { phi: (t * SPEED + 37) / (4 * 34), size: 1, vol: t < CUE.wide ? .45 : .25 },
      { phi: (t * SPEED + 74) / (4 * 34), size: 1, vol: t < CUE.wide ? .4 : .2 },
    ]);
    for (let k = 0; k < 9; k++) ev.push({ t: .35 + k * .9 + (k % 3) * .17, type: 'notify', vol: .35, pan: [.6, .2, -.2][k % 3] });
    return ev.concat([
      { t: 0, type: 'buzz', dur: .5, vol: .7 }, { t: .02, type: 'notify', vol: .8 },
      { t: CUE.look, type: 'heartbeat', vol: .5 }, { t: CUE.slow + .6, type: 'heartbeat', vol: .5 },
      { t: CUE.off + .3, type: 'thud', vol: .5 }, { t: CUE.down, type: 'step' },
      { t: CUE.knees, type: 'wind', dur: 2.2, vol: .5 }, { t: CUE.dark, type: 'snap', vol: .6 },
      { t: CUE.light, type: 'riser', dur: 2.2 }, { t: CUE.turn, type: 'whoosh', vol: .5 },
      { t: CUE.arms + 1.2, type: 'swell', dur: 3 }, { t: CUE.arms + 1.2, type: 'chime' }, { t: 13.4, type: 'sparkle' },
    ]);
  },
  music: {
    sections: [
      { t: 0, dur: CUE.slow + .6, style: 'upbeat', chords: ['Am', 'G', 'F', 'E'], chordLen: 1.0, bpm: 128 },
      { t: CUE.slow + .4, dur: CUE.light - CUE.slow, style: 'tension', chords: ['Am', 'F'], chordLen: 1.6 },
      { t: CUE.light, dur: D - CUE.light, style: 'hope', chords: ['F', 'C', 'G', 'C'], chordLen: 1.6 },
    ],
    stingers: [{ t: CUE.dark, type: 'impact' }, { t: CUE.arms + 1.2, type: 'bells' }],
    duck: [[CUE.off, CUE.light]],
  },
};
})();
