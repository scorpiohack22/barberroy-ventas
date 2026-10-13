// 26 — NO ABRAZA: un hombre atrapa monedas y las apila; detrás, su esposa e hijo le tienden la mano y se
// desvanecen con cada moneda. Celebra, voltea: ya no están. Abraza la montaña de monedas: se vuelve fría.
// Un corazón rojo se rompe.
(() => {
const { FLOOR, clamp, lerp, prog, smooth, easeOut, easeIn, easeInOut, keyed, bump, pulse, figure, mix, poseAt, stand, walk, run, sad, cheer, kneel, mixStyle, STYLE, ctx, glowCircle, burst, ring, rays, heart, coin, rng, holdPoint, shoulderOf } = E;
const D = 20;
const CUE = { touch: 2.4, shrug: 3.05, tugA: 5.0, yank: 6.0, fadeOut: 8.3, last: 10.3, triumph: 10.6, turn: 11.7, alone: 12.3, toPile: 13.5, hug: 14.3, cold: 14.6, heart: 15.4, crack: 16.3 };
const PX = 568, MAN = 420;

// ── montaña de monedas ──
const PILE = (() => {
  const r = rng(13), out = [];
  for (let k = 0; k < 17; k++) {
    const hw = 112 * Math.pow(1 - k / 17, .85), n = Math.max(1, Math.floor(hw * 2 / 15));
    for (let j = 0; j < n; j++) out.push({ x: PX - hw + (j + .5) * (hw * 2 / n) + (r() - .5) * 6, y: FLOOR - 5 - k * 12.5 + (r() - .5) * 3, k, sh: r() });
  }
  return out;
})();
const pileN = t => Math.floor(PILE.length * keyed([[.4, .02], [3, .2], [6, .5], [CUE.last, 1]], t, x => x * x * (3 - 2 * x)));
function pileTop(t, x = PX) {
  const n = pileN(t); if (n < 1) return FLOOR;
  let top = FLOOR; for (let i = 0; i < n; i++) if (Math.abs(PILE[i].x - x) < 16) top = Math.min(top, PILE[i].y - 6);
  return top;
}
function drawPile(t, cold) {
  const n = pileN(t);
  const gold = [255, 201, 60], gray = [96, 98, 104];
  const c = gold.map((v, i) => Math.round(lerp(v, gray[i], cold))), e = c.map(v => Math.round(v * .62)), hi = c.map(v => Math.round(v + (255 - v) * .5));
  if (n > 8) glowCircle(PX, FLOOR - 60, 220, '255,190,60', .22 * (1 - cold) * Math.min(1, n / 60));
  for (let i = 0; i < n; i++) {
    const p = PILE[i];
    ctx.fillStyle = `rgb(${e})`; ctx.beginPath(); ctx.ellipse(p.x, p.y + 2.5, 10, 4.6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = `rgb(${c})`; ctx.beginPath(); ctx.ellipse(p.x, p.y, 10, 4.6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = `rgba(${hi},${.8})`; ctx.beginPath(); ctx.ellipse(p.x - 2, p.y - 1, 5, 1.8, 0, 0, Math.PI * 2); ctx.fill();
  }
  // destellos sobre el oro
  if (cold < 1) for (let i = 0; i < n; i += 9) {
    const s = Math.max(0, Math.sin(t * 3 + PILE[i].sh * 20)); if (s < .9) continue;
    glowCircle(PILE[i].x, PILE[i].y, 14, '255,240,200', (s - .9) * 8 * (1 - cold));
  }
}

// ciclo de atrapar/apilar: fase integrada
const cyc = E.distance([[0, .5], [1, .8], [4, 1.1], [8, 1.7], [CUE.last - .3, 1.8], [CUE.last, 0], [D, 0]], D);
function manPose(t) {
  const work = t => {
    const c = cyc(t), f = c % 1;
    const top = pileTop(t, PX - 40);
    const catchP = stand(MAN, { tilt: -.55, lean: -.04, t }); catchP.arms = [{ target: { x: MAN + 18, y: FLOOR - 236 } }, { target: { x: MAN + 8, y: FLOOR - 240 } }];
    const placeP = stand(MAN + 6, { tilt: .3, lean: .32, t }); placeP.arms = [{ target: { x: Math.min(PX - 60, MAN + 76), y: Math.max(top + 4, FLOOR - 190) } }, { target: { x: Math.min(PX - 64, MAN + 70), y: Math.max(top + 10, FLOOR - 186) } }];
    const p = f < .42 ? catchP : f < .72 ? mix(catchP, placeP, easeInOut((f - .42) / .3)) : mix(placeP, catchP, easeInOut((f - .72) / .28));
    // encogerse de hombros cuando lo tocan / jalar la mano
    p.hip.x -= 4 * bump(t, CUE.shrug - .1, CUE.shrug + .35); p.lean += .12 * bump(t, CUE.shrug - .1, CUE.shrug + .35);
    return p;
  };
  const triumph = t => { const p = cheer(MAN, { t }); p.hip.y -= 6 * bump(t, CUE.triumph, CUE.triumph + .5); return p; };
  const turned = t => stand(MAN - 6, { dir: -1, tilt: .05, t, arms: [{ ang: .5, bend: .3 }, { ang: .4, bend: .4 }] });
  const lookL = t => stand(MAN - 8, { dir: -1, tilt: -.1, lean: .05, t, arms: [{ ang: .2, bend: .2 }, { ang: .1, bend: .2 }] });
  const lookR = t => stand(MAN - 8, { dir: 1, tilt: .1, lean: .05, t, arms: [{ ang: .1, bend: .2 }, { ang: .05, bend: .2 }] });
  const slump = t => sad(MAN - 8, { dir: -1, t, tilt: .6, lean: .25 });
  const walkP = t => { const d = keyed([[CUE.toPile, 0], [CUE.hug, 30]], t, x => x); return walk(MAN - 8 + d, d * 1.6, { stride: .6, lean: .25, tilt: .4 }); };
  const hugP = t => { const p = stand(MAN + 30, { lean: .42, tilt: .55, t }); p.feet = [{ x: MAN + 34, y: FLOOR }, { x: MAN + 6, y: FLOOR }];
    p.arms = [{ target: { x: MAN + 98, y: FLOOR - 140 } }, { target: { x: MAN + 92, y: FLOOR - 112 } }]; p.hip.y += 1.5 * Math.sin(t * 2); return p; };
  return poseAt(t, [[0, work], [CUE.last - .1, work], [CUE.triumph, triumph], [CUE.turn - .3, triumph], [CUE.turn, turned], [CUE.alone, turned],
    [12.6, lookL], [12.75, lookR], [13.0, lookR], [13.15, slump], [CUE.toPile, slump], [CUE.toPile + .15, walkP], [CUE.hug - .2, walkP], [CUE.hug + .4, hugP], [D, hugP]]);
}

// familia
const famA = t => 1 - .5 * smooth(prog(t, 3.2, 6.2)) - .28 * smooth(prog(t, 6.2, CUE.fadeOut)) - .22 * smooth(prog(t, CUE.fadeOut + .4, 10.0));
function wifePose(t, manSh) {
  const reach = t => stand(296, { s: .95, t, tilt: -.05, arms: [{ ang: 1.25 + .05 * Math.sin(t * 2), bend: .1 }, { ang: .2, bend: .3 }] });
  const toHim = t => { const d = keyed([[CUE.touch - .9, 0], [CUE.touch, 62]], t); const p = walk(296 + d, d, { s: .95 }); return p; };
  const touch = t => { const p = stand(358, { s: .95, t, lean: .1, tilt: .15 }); p.arms = [{ target: { x: manSh.x - 6, y: manSh.y + 4 } }, { ang: .2, bend: .3 }]; return p; };
  const back = t => stand(300, { s: .95, t, tilt: .25, lean: .1, arms: [{ ang: .5, bend: .5 }, { ang: .3, bend: .4 }] });
  const away = t => stand(300, { s: .95, dir: -1, t, tilt: .5, lean: .15, arms: [{ ang: .05, bend: .1 }, { ang: 0, bend: .1 }] });
  return poseAt(t, [[0, reach], [CUE.touch - .9, reach], [CUE.touch - .85, toHim], [CUE.touch, toHim], [CUE.touch + .15, touch], [CUE.shrug + .1, touch],
    [CUE.shrug + .7, back], [4.4, back], [5.0, reach], [CUE.fadeOut, reach], [CUE.fadeOut + .6, away], [D, away]]);
}
function kidPose(t, manSl) {
  const up = t => { const h = Math.abs(Math.sin(t * 6)) * 6 * bump(t, .3, 2.2); const p = stand(338, { s: .55, t, tilt: -.5 }); p.hip.y -= h; p.feet.forEach(f => f.y -= h);
    p.arms = [{ ang: Math.PI - .55, bend: .15 }, { ang: Math.PI - .35, bend: .15 }]; return p; };
  const runIn = t => { const d = keyed([[CUE.tugA - .4, 0], [CUE.tugA, 52]], t, x => x); return run(338 + d, d * 1.4, { s: .55 }); };
  const tug = t => { const p = stand(392, { s: .55, t, lean: -.2, tilt: -.5 }); p.arms = [{ target: { x: MAN - 6 + 4 * Math.sin(t * 16), y: FLOOR - 92 } }, { target: { x: MAN - 10, y: FLOOR - 88 } }]; return p; };
  const stumble = { ...stand(352, { s: .55, lean: -.35, tilt: .1 }), arms: [{ ang: 1.4, bend: .2 }, { ang: 1.7, bend: .2 }] };
  const sadK = t => sad(348, { s: .55, t, tilt: .7 });
  const withMom = t => { const p = sad(340, { s: .55, dir: -1, t, tilt: .5 }); p.arms = [{ ang: .1, bend: .1 }, { target: { x: 322, y: FLOOR - 70 } }]; return p; };
  return poseAt(t, [[0, up], [CUE.tugA - .45, up], [CUE.tugA - .4, runIn], [CUE.tugA, runIn], [CUE.tugA + .1, tug], [CUE.yank, tug], [CUE.yank + .25, stumble],
    [CUE.yank + .8, sadK], [CUE.fadeOut, sadK], [CUE.fadeOut + .6, withMom], [D, withMom]]);
}

// monedas en el aire
const RAIN = (() => { const r = rng(7), a = []; for (let i = 0; i < 70; i++) { const u = r(); a.push({ t0: lerp(2.5, CUE.last - .5, Math.sqrt(u)), x: PX + (r() - .5) * 170, sp: .45 + r() * .2, ph: r() * 6 }); } return a; })();

function brokenHeart(x, y, t) {
  const a = smooth(prog(t, CUE.heart, CUE.heart + .4));
  if (a <= 0) return;
  const beat = 1 + .12 * pulse(t, CUE.heart + .6, .15) + .12 * pulse(t, CUE.heart + .95, .15);
  const sp = easeIn(prog(t, CUE.crack, CUE.crack + 1.6));
  const fade = 1 - smooth(prog(t, CUE.crack + .9, CUE.crack + 2.2));
  glowCircle(x, y, 110, '255,40,35', .45 * a * (1 - sp));
  for (const s of [-1, 1]) {
    ctx.save(); ctx.globalAlpha *= a * fade;
    ctx.translate(x + s * (4 + 26 * sp), y + 60 * sp * sp); ctx.rotate(s * .5 * sp);
    ctx.beginPath();
    if (t < CUE.crack) ctx.rect(-40, -40, 80, 80);
    else { // mitad con borde dentado
      ctx.moveTo(0, -24); ctx.lineTo(-4 * s, -14); ctx.lineTo(3 * s, -6); ctx.lineTo(-3 * s, 2); ctx.lineTo(2 * s, 8); ctx.lineTo(0, 14); ctx.lineTo(-40 * s, 14); ctx.lineTo(-40 * s, -24); ctx.closePath();
    }
    ctx.clip();
    heart(0, 0, 38 * beat, '#ff3b36', 1, 30);
    ctx.restore();
    if (t < CUE.crack) break;
  }
}

window.SCENE = {
  id: '26-no-abraza', title: 'El dinero *no abraza*', duration: D, cue: CUE,
  spot: t => ({ x: keyed([[0, 440], [CUE.turn, 420], [CUE.hug, 480]], t), r: 360 }),
  beam: t => ({ x: keyed([[0, 430], [CUE.hug, 470]], t), a: .05 * (1 - .6 * smooth(prog(t, CUE.cold, CUE.cold + 1.5))), w: 170 }),
  sky: t => 0,
  flashes: [CUE.triumph], blackouts: [CUE.crack, CUE.alone + .05],
  camera: t => ({
    zoom: keyed([[0, 2.15], [1.1, 1.72], [3.0, 1.8], [6.0, 1.95], [CUE.fadeOut, 2.05], [9.6, 2.15], [CUE.triumph, 1.6], [CUE.turn, 1.75], [CUE.alone, 2.15], [13.4, 2.3], [CUE.hug, 2.0], [CUE.heart, 2.35], [CUE.crack + .2, 2.6], [17.4, 2.25], [D, 1.55]], t),
    x: keyed([[0, 440], [1.1, 430], [3.0, 420], [6.0, 400], [CUE.fadeOut, 360], [9.6, 350], [CUE.triumph, 470], [CUE.turn, 440], [CUE.alone, 380], [13.4, 390], [CUE.hug, 470], [CUE.heart, 475], [CUE.crack + .2, 482], [17.4, 478], [D, 455]], t),
    y: keyed([[0, FLOOR - 270], [1.1, FLOOR - 190], [6.0, FLOOR - 170], [9.6, FLOOR - 150], [CUE.triumph, FLOOR - 210], [CUE.alone, FLOOR - 170], [13.4, FLOOR - 165], [CUE.hug, FLOOR - 170], [CUE.heart, FLOOR - 165], [CUE.crack + .2, FLOOR - 160], [D, FLOOR - 200]], t),
    shake: .25 * pulse(t, CUE.crack, .3) + .1 * pulse(t, CUE.yank, .2),
  }),
  world(t, refl) {
    const cold = smooth(prog(t, CUE.cold, CUE.cold + 1.8));
    drawPile(t, cold);
    const mp = manPose(t), msl = E.solve(mp);
    // familia (se desvanece)
    const fa = famA(t);
    if (fa > .01) {
      const st = mixStyle(STYLE.hero, STYLE.gray, 1 - fa);
      figure(wifePose(t, msl.sh), st, { alpha: fa });
      figure(kidPose(t, msl), st, { alpha: fa });
    }
    if (!refl && t > 9.2 && t < 11.5) { // se deshacen en polvo
      const g = rng(3);
      for (let i = 0; i < 50; i++) {
        const sx = 285 + g() * 70, sy = FLOOR - 30 - g() * 170, dt = t - 9.2 - g() * .6; if (dt < 0) continue;
        glowCircle(sx - dt * 18 + Math.sin(dt * 3 + i) * 8, sy - dt * 45, 4, '255,255,255', .4 * Math.max(0, 1 - dt / 1.6));
      }
    }
    const ms = mixStyle(STYLE.hero, { near: '#cfd4dc', far: '#8d939c', glow: .08 }, cold);
    figure(mp, ms);
    // moneda que cae hacia sus manos en cada ciclo
    if (t < CUE.last) {
      const c = cyc(t), f = c % 1;
      if (f < .42) { const p = easeIn(f / .42); coin(MAN + 13, lerp(FLOOR - 640, FLOOR - 244, p), 11, t + c); }
      else if (f < .72) { const h = E.hand(msl, 0); coin(h.x + 2, h.y - 8, 11, t * .3); }
    }
    // lluvia de monedas sobre la montaña
    if (!refl) for (const r of RAIN) {
      const dt = t - r.t0; if (dt < 0 || dt > r.sp) continue;
      const top = pileTop(r.t0 + r.sp, r.x);
      coin(r.x, lerp(FLOOR - 650, top, easeIn(dt / r.sp)), 10, t + r.ph);
    }
    if (!refl) {
      burst(PX - 10, FLOOR - 200, t, CUE.triumph, { n: 40, speed: 280, seed: 2, color: '255,205,80', life: 1.4 });
      ring(MAN, FLOOR - 160, t, CUE.triumph, { color: '255,210,100', r: 240, width: 7, life: 1 });
      // frío: escarcha/vaho
      if (cold > 0) glowCircle(PX - 30, FLOOR - 100, 260, '120,150,200', .08 * cold);
      brokenHeart(lerp(msl.hip.x, msl.sh.x, .78) + 10 * msl.dir, lerp(msl.hip.y, msl.sh.y, .78) + 4, t);
    }
  },
  events() {
    const ev = [];
    let prev = 0;
    for (let t = 0; t < CUE.last; t += 1 / 120) { const c = cyc(t); if (Math.floor(c - .4) !== Math.floor(prev - .4)) ev.push({ t, type: 'coin', vol: .9 }); prev = c; }
    for (const r of RAIN) ev.push({ t: r.t0 + r.sp, type: 'coin', vol: .25 + .15 * Math.sin(r.ph), pan: (r.x - PX) / 140 });
    return ev.concat([
      { t: 0, type: 'whoosh', vol: .6 }, { t: .12, type: 'coin', vol: 1 }, { t: .4, type: 'chime', vol: .6 },
      { t: CUE.touch, type: 'pop', vol: .3 }, { t: CUE.shrug, type: 'whoosh', vol: .4 },
      { t: CUE.yank, type: 'whoosh', vol: .5 }, { t: CUE.yank + .3, type: 'scuff', vol: .6 },
      { t: CUE.fadeOut + .9, type: 'sparkle', vol: .5 }, { t: CUE.triumph, type: 'cheer', dur: 1.2, vol: .4 }, { t: CUE.triumph, type: 'impact' },
      { t: CUE.alone, type: 'heartbeat', vol: .8 }, { t: CUE.alone + .8, type: 'heartbeat', vol: .6 },
      { t: CUE.cold, type: 'wind', dur: 4, vol: .6 },
      { t: CUE.heart + .6, type: 'heartbeat', vol: .9 }, { t: CUE.crack, type: 'crack' }, { t: CUE.crack, type: 'boom' },
    ]);
  },
  music: {
    sections: [
      { t: 0, dur: 6.2, style: 'tender', chords: ['C', 'Am', 'F', 'G'], chordLen: 1.2 },
      { t: 6.0, dur: CUE.last - 6.0, style: 'build', chords: ['Am', 'F', 'C', 'G'], chordLen: .6 },
      { t: CUE.alone, dur: CUE.crack - CUE.alone, style: 'sad', chords: ['Am', 'F', 'Dm', 'E'], chordLen: 1.1 },
      { t: CUE.crack + .3, dur: D - CUE.crack, style: 'sad', chords: ['Am', 'F', 'C', 'E'], chordLen: 1.2 },
    ],
    stingers: [{ t: CUE.triumph, type: 'impact' }, { t: CUE.crack, type: 'boom' }],
    duck: [[CUE.turn, CUE.alone + .2], [CUE.crack - .5, CUE.crack]],
  },
};
})();
