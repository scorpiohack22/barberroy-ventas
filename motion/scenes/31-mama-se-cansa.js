// 31 — MAMÁ SE CANSA: ella hace todo a toda velocidad mientras la familia mira el celular;
// se desploma (batería baja). El hijo deja el celular y ayuda; los demás lo siguen. Su batería se llena de amor.
(() => {
const { FLOOR, clamp, lerp, prog, smooth, easeOut, easeIn, easeInOut, keyed, figure, STYLE, mix, mixStyle, stand, run, walk, sit, crouch, glowCircle, ctx } = E;
const D = 19.5;
// cámara lenta en la caída
const SL0 = 5.25, SL1 = 6.45, SK = .35;
const S = t => t < SL0 ? t : t < SL1 ? SL0 + (t - SL0) * SK : SL0 + (SL1 - SL0) * SK + (t - SL1);
const SLD = (SL1 - SL0) * (1 - SK);
const R = s => s < SL0 ? s : s < SL0 + (SL1 - SL0) * SK ? SL0 + (s - SL0) / SK : s + SLD;
const C = { trip: 5.35, boxLand: 5.75, down: 6.25, bat: 6.6, notice: 7.9, sonUp: 8.45, sonWalk: 8.75, sonAt: 9.6, lift: 10.0, place: 10.9,
  famLook: 9.9, famUp: 10.45, famWalk: 10.7, dadAt: 11.75, hand: 12.0, take: 12.35, rise: 12.5, risen: 13.3, hug: 13.2, full: 13.9, heart: 14.25 };
// sofá y asientos
const SOFA = [430, 578], SON = 452, GIRL = 502, DAD = 550, TABLE = 345, MOMX = 296;
// viajes de mamá: [t, x]
const MX = [[-.6, 30], [1.0, MOMX], [1.2, MOMX], [1.85, 30], [2.7, MOMX], [2.9, MOMX], [3.45, 30], [4.2, MOMX], [4.38, MOMX], [4.85, 30], [C.trip, 190]];
const ITEMS = [{ until: 1.1, kind: 'boxes' }, { from: 1.85, until: 2.82, kind: 'pot' }, { from: 3.45, until: 4.3, kind: 'basket' }, { from: 4.85, until: C.trip + .08, kind: 'box' }];
const mease = p => lerp(p, smooth(p), .55);
const momX = s => keyed(MX, s, mease);
const momD = (() => { const a = [], dt = 1 / 240; let d = 0, px = momX(-1); for (let s = -1; s < 7; s += dt) { const x = momX(s); d += Math.abs(x - px); px = x; a.push(d); } return s => a[clamp(Math.round((s + 1) * 240), 0, a.length - 1)]; })();

// ── utilería propia ──
function sofa(refl) {
  const [x0, x1] = SOFA;
  ctx.fillStyle = '#262626'; ctx.beginPath(); ctx.roundRect(x0 - 8, FLOOR - 128, x1 - x0 + 16, 84, 14); ctx.fill();
  ctx.fillStyle = '#333'; ctx.fillRect(x0 - 10, FLOOR - 56, x1 - x0 + 20, 30);
  ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fillRect(x0 - 10, FLOOR - 56, x1 - x0 + 20, 3);
  ctx.fillStyle = '#1d1d1d'; ctx.fillRect(x0 - 4, FLOOR - 26, x1 - x0 + 8, 18);
  ctx.fillStyle = '#3c3c3c';
  for (const x of [x0 - 14, x1 - 6]) { ctx.beginPath(); ctx.roundRect(x, FLOOR - 82, 20, 60, 8); ctx.fill(); }
  ctx.fillStyle = '#555'; for (const x of [x0 + 2, x1 - 6]) ctx.fillRect(x, FLOOR - 8, 6, 8);
}
function pot(x, y, sc, t, steam = true) { // y = base
  ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc);
  ctx.fillStyle = '#9a9a9a'; ctx.beginPath(); ctx.roundRect(-20, -26, 40, 26, 6); ctx.fill();
  ctx.fillStyle = '#bdbdbd'; ctx.fillRect(-23, -29, 46, 5);
  ctx.fillStyle = '#7a7a7a'; ctx.fillRect(-29, -22, 7, 4); ctx.fillRect(22, -22, 7, 4);
  ctx.restore();
  if (steam) {
    ctx.strokeStyle = 'rgba(230,230,230,.35)'; ctx.lineWidth = 3 * sc; ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const ph = (t * 1.3 + i / 3) % 1, sx = x + (i - 1) * 11 * sc;
      ctx.globalAlpha = 1 - ph; ctx.beginPath(); ctx.moveTo(sx, y - 32 * sc - ph * 30 * sc);
      ctx.quadraticCurveTo(sx + 8 * sc, y - 42 * sc - ph * 30 * sc, sx, y - 52 * sc - ph * 30 * sc); ctx.stroke(); ctx.globalAlpha = 1;
    }
  }
}
function basket(x, y, sc) {
  ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc);
  ctx.fillStyle = '#e0e0e0'; ctx.beginPath(); ctx.arc(-8, -26, 10, 0, Math.PI * 2); ctx.arc(8, -28, 11, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#8a7f72'; ctx.beginPath(); ctx.moveTo(-24, -26); ctx.lineTo(24, -26); ctx.lineTo(18, 0); ctx.lineTo(-18, 0); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.lineWidth = 2; for (let i = -12; i <= 12; i += 8) { ctx.beginPath(); ctx.moveTo(i, -24); ctx.lineTo(i * .8, -2); ctx.stroke(); }
  ctx.restore();
}
function carried(kind, x, y, t, rot = 0) { // y = base del objeto
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.translate(-x, -y);
  if (kind === 'boxes') { E.box(x, y, 46, 30); E.box(x + 3, y - 30, 38, 24, '#9c7a50'); E.box(x - 2, y - 54, 30, 20); }
  else if (kind === 'box') E.box(x, y, 50, 38);
  else if (kind === 'pot') pot(x, y, 1, t);
  else if (kind === 'basket') basket(x, y, 1);
  ctx.restore();
}
function battery(x, y, level, t, a = 1, blink = 0) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y);
  ctx.strokeStyle = '#eee'; ctx.lineWidth = 4; ctx.shadowColor = 'rgba(255,255,255,.5)'; ctx.shadowBlur = 10;
  ctx.beginPath(); ctx.roundRect(-30, -15, 56, 30, 6); ctx.stroke(); ctx.fillStyle = '#eee'; ctx.fillRect(28, -6, 6, 12);
  const bars = Math.max(0, Math.min(4, level * 4));
  for (let i = 0; i < 4; i++) {
    const f = clamp(bars - i); if (f <= 0) continue;
    const low = level < .3;
    ctx.globalAlpha = a * (low ? (.35 + .65 * (Math.sin(t * 9) > -.2 ? 1 : 0) * (1 - blink) + blink) : f);
    ctx.fillStyle = low ? '#ff3b36' : '#ffffff'; ctx.shadowColor = low ? '#ff2020' : '#ffffff'; ctx.shadowBlur = 14;
    ctx.fillRect(-25 + i * 13, -10, 11 * (low ? 1 : 1), 20);
  }
  ctx.restore();
}
function bun(pose, col) { // moño de mamá (detrás de la cabeza)
  const h = E.headOf(pose), r = 23 * (pose.s || 1), dir = pose.dir || 1;
  ctx.fillStyle = col; ctx.beginPath(); ctx.arc(h.x - dir * r * .78, h.y - r * .55, r * .5, 0, Math.PI * 2); ctx.fill();
}

// ── mamá ──
function momItem(s) { for (const it of ITEMS) if (s >= (it.from ?? -9) && s < it.until) return it.kind; return null; }
function momPose(s) {
  if (s < C.trip) {
    const x = momX(s), v = (momX(s + .02) - momX(s - .02)) / .04;
    const goingRight = v > 0 || (v === 0 && momItem(s));
    const dir = Math.abs(v) > 5 ? Math.sign(v) : (s % 2 < 1.2 && x > 200 ? 1 : -1);
    const item = momItem(s);
    let p = run(x, momD(s), { dir, lean: item ? .16 : .3, stride: .9 });
    if (item) p.arms = [{ target: { x: x + dir * 40, y: FLOOR - 140 } }, { target: { x: x + dir * 34, y: FLOOR - 146 } }];
    if (Math.abs(v) < 5) { // dejando el objeto en la mesa
      p = { ...stand(x, { dir: 1, lean: .25, tilt: .3 }), arms: [{ target: { x: x + 54, y: FLOOR - 92 } }, { target: { x: x + 46, y: FLOOR - 96 } }] };
    }
    return p;
  }
  const x = 190;
  const tripP = { hip: { x: x + 22, y: FLOOR - 92 }, s: 1, dir: 1, lean: .95, tilt: -.3, feet: [{ x: x + 40, y: FLOOR }, { x: x - 30, y: FLOOR - 40 }],
    arms: [{ ang: 2.1, bend: .1 }, { ang: 1.7, bend: .2 }] };
  const knees = { hip: { x: x + 18, y: FLOOR - 52 }, s: 1, dir: 1, lean: .55, tilt: .4, feet: [{ x: x + 10, y: FLOOR }, { x: x - 40, y: FLOOR }],
    arms: [{ target: { x: x + 66, y: FLOOR - 4 } }, { target: { x: x + 58, y: FLOOR - 6 } }] };
  const tired = q => { const br = Math.sin(q * 4.2); return { ...sit(x, { ground: true, tilt: .75 + .05 * br, lean: .5 + .04 * br }), feet: [{ x: x + 58, y: FLOOR }, { x: x + 50, y: FLOOR }],
    arms: [{ target: { x: x + 48, y: FLOOR - 42 } }, { target: { x: x + 42, y: FLOOR - 44 } }] }; };
  const look = { ...sit(x, { ground: true, tilt: -.2, lean: .2 }), feet: [{ x: x + 58, y: FLOOR }, { x: x + 50, y: FLOOR }],
    arms: [{ target: { x: x + 56, y: FLOOR - 70 } }, { target: { x: x + 40, y: FLOOR - 42 } }] };
  const dadHand = { x: x + 64, y: FLOOR - 112 };
  const standUp = q => ({ ...stand(x + 14, { t: q, lean: .02, tilt: -.1 }), arms: [{ target: { x: x + 46, y: FLOOR - 124 } }, { ang: -.3, bend: .3 }] });
  const hugged = q => ({ ...stand(x + 14, { t: q, lean: -.04, tilt: .15 }), arms: [{ target: { x: x + 46, y: FLOOR - 124 } }, { target: { x: x - 28, y: FLOOR - 128 } }] });
  return E.poseAt(s, [[C.trip, run(x, momD(C.trip), { lean: .2 })], [C.trip + .2, tripP], [C.down - .1, knees], [C.down + .5, tired],
    [C.hand - .2, tired], [C.hand + .2, look], [C.take, look], [C.risen, standUp], [C.hug + .4, hugged]]);
}
const momStyle = s => STYLE.hero;

// ── familia ──
function seated(x, s, sc, phoneUp) {
  const p = sit(x, { dir: -1, s: sc, seat: FLOOR - 50, tilt: lerp(.62, -.05, phoneUp), lean: lerp(.28, .08, phoneUp) });
  const sh = E.shoulderOf(p);
  const ph = { x: sh.x - 36 * sc, y: sh.y + 20 * sc + 40 * phoneUp };
  p.arms = [{ target: ph }, { target: { x: ph.x + 4, y: ph.y + 3 } }];
  p.phone = ph;
  return p;
}
function sonPose(s) {
  const off = smooth(prog(s, C.notice - .4, C.notice + .2));
  const seat = seated(SON, s, .82, off);
  const look = { ...seat, tilt: -.1, arms: [{ target: { x: SON - 30, y: FLOOR - 70 } }, { ang: .4, bend: .5 }] };
  const up = { ...stand(SON - 8, { dir: -1, s: .82, t: s, tilt: .15 }) };
  const walkTo = 312;
  const wx = lerp(SON - 8, walkTo, smooth(prog(s, C.sonWalk, C.sonAt)));
  const w = walk(wx, (SON - wx) * 1.0, { dir: -1, s: .82, tilt: .2 });
  const pick = { ...crouch(walkTo, { dir: -1, s: .82, amt: .85 }), arms: [{ target: { x: 280, y: FLOOR - 22 } }, { target: { x: 290, y: FLOOR - 26 } }] };
  const lift = { ...stand(walkTo, { dir: 1, s: .82, t: s, lean: .1 }), arms: [{ target: { x: walkTo + 30, y: FLOOR - 112 } }, { target: { x: walkTo + 24, y: FLOOR - 116 } }] };
  const put = { ...stand(walkTo + 2, { dir: 1, s: .82, lean: .25 }), arms: [{ target: { x: walkTo + 46, y: FLOOR - 90 } }, { target: { x: walkTo + 40, y: FLOOR - 94 } }] };
  const fin = { ...stand(312, { dir: -1, s: .82, t: s, tilt: -.1 }), arms: [{ target: { x: 280, y: FLOOR - 118 } }, { ang: .1, bend: .3 }] };
  const finW = walk(lerp(walkTo, 312, smooth(prog(s, C.place + .4, C.hug))), 30 * prog(s, C.place + .4, C.hug), { dir: -1, s: .82 });
  return E.poseAt(s, [[C.notice - .4, seat], [C.notice + .1, look], [C.sonUp - .1, look], [C.sonWalk, up], [C.sonWalk + .05, w], [C.sonAt, w], [C.lift - .05, pick], [C.lift + .25, pick],
    [C.lift + .6, lift], [C.place - .2, lift], [C.place + .1, put], [C.place + .4, put], [C.place + .45, finW], [C.hug - .05, finW], [C.hug + .3, fin]]);
}
function famPose(s, x0, sc, xTo, tWalk, tAt, final) {
  const off = smooth(prog(s, C.famLook - .3, C.famLook + .3));
  const seat = seated(x0, s, sc, off);
  const up = stand(x0 - 8, { dir: -1, s: sc, t: s, tilt: .1 });
  const wx = lerp(x0 - 8, xTo, smooth(prog(s, tWalk, tAt)));
  const w = walk(wx, x0 - wx, { dir: -1, s: sc });
  return E.poseAt(s, [[C.famLook, seat], [C.famUp, up], [tWalk, up], [tWalk + .05, w], [tAt, w], [tAt + .45, final(s)]]);
}
const dadPose = s => famPose(s, DAD, 1, 262, C.famWalk, C.dadAt, q => {
  const p = { ...E.kneel(268, { dir: -1, tilt: .15, lean: .2 }), arms: [{ target: { x: 240, y: FLOOR - 82 } }, { ang: .3, bend: .4 }] };
  const st = { ...stand(258, { dir: -1, t: q, tilt: .08 }), arms: [{ target: { x: 236, y: FLOOR - 124 } }, { target: { x: 220, y: FLOOR - 166 } }] };
  return E.poseAt(q, [[C.dadAt, p], [C.take, p], [C.risen, st]]);
});
const girlPose = s => famPose(s, GIRL, .66, 152, C.famWalk + .3, C.hug - .2, q => ({ ...stand(156, { dir: 1, s: .66, t: q, tilt: -.25, lean: .14 }),
  arms: [{ target: { x: 196, y: FLOOR - 94 } }, { target: { x: 200, y: FLOOR - 100 } }] }));

window.SCENE = {
  id: '31-mama-se-cansa', title: 'Mamá también *se cansa*', duration: D, cue: C,
  sky: t => .35 * smooth(prog(S(t), C.full, C.full + 1.5)),
  spot: t => ({ x: keyed([[0, 320], [C.down, 220], [C.notice, 320], [C.hug, 230]], S(t)), r: 380 }),
  beam: t => ({ x: keyed([[0, 320], [C.down, 210], [C.notice, 290], [C.hug, 225]], S(t)), a: .05, w: 170 }),
  flashes: [], blackouts: [R(C.boxLand) + .02],
  camera: t => {
    const s = S(t);
    return {
      zoom: keyed([[0, 1.75], [1.0, 1.5], [4.6, 1.5], [C.trip, 1.75], [C.down + .3, 2.15], [C.notice - .5, 2.35], [C.notice + .4, 1.55], [C.dadAt, 1.65], [C.risen, 1.9], [C.heart, 2.05], [S(D), 1.75]], s),
      x: keyed([[0, 290], [1.0, 335], [4.6, 335], [C.trip, 260], [C.down + .3, 225], [C.notice - .5, 230], [C.notice + .4, 345], [C.lift, 320], [C.dadAt, 270], [C.risen, 235], [C.heart, 232], [S(D), 240]], s),
      y: keyed([[0, FLOOR - 175], [C.down + .3, FLOOR - 145], [C.notice - .5, FLOOR - 150], [C.notice + .4, FLOOR - 180], [C.risen, FLOOR - 190], [C.heart, FLOOR - 205], [S(D), FLOOR - 215]], s),
      shake: .35 * E.pulse(s, C.boxLand, .2),
    };
  },
  backdrop(t) {
    // ventana con luz de luna al fondo
    ctx.strokeStyle = '#2c2c2c'; ctx.lineWidth = 5; ctx.strokeRect(450, FLOOR - 300, 90, 110);
    ctx.beginPath(); ctx.moveTo(495, FLOOR - 300); ctx.lineTo(495, FLOOR - 190); ctx.moveTo(450, FLOOR - 245); ctx.lineTo(540, FLOOR - 245); ctx.stroke();
    // reloj de pared (el tiempo vuela)
    const s = S(t), cx = 180, cy = FLOOR - 275;
    ctx.strokeStyle = '#3a3a3a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(cx, cy, 26, 0, Math.PI * 2); ctx.stroke();
    const sp = s < C.trip ? s * 6 : C.trip * 6 + (s - C.trip) * .2;
    ctx.strokeStyle = '#777'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.sin(sp) * 20, cy - Math.cos(sp) * 20); ctx.stroke();
    ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.sin(sp / 12) * 13, cy - Math.cos(sp / 12) * 13); ctx.stroke();
  },
  world(t, refl) {
    const s = S(t);
    sofa(refl);
    E.table(TABLE + 30, 80, FLOOR, 78, '#5e5e5e');
    // pila de cosas que ella ya dejó
    if (s > 1.1) carried('boxes', TABLE + 14, FLOOR - 78, t);
    if (s > 2.82) pot(TABLE + 52, FLOOR - 78 - 0, .8, t);
    if (s > 4.3) basket(TABLE + 40, FLOOR - 78 - 0, .75);
    if (s > C.place) E.box(TABLE + 4, FLOOR - 78, 40, 30);
    // familia
    const son = sonPose(s), dad = dadPose(s), girl = girlPose(s);
    const help = p => mixStyle(STYLE.gray, STYLE.hero, p);
    const dl = figure(dad, help(smooth(prog(s, C.famUp, C.dadAt))));
    const sl = figure(son, help(smooth(prog(s, C.sonUp, C.sonAt))));
    // caja en el piso / en manos del hijo
    let boxP = null, rot = 0;
    if (s >= C.trip + .05) {
      const fp = prog(s, C.trip + .05, C.boxLand);
      boxP = { x: lerp(232, 285, fp), y: lerp(FLOOR - 128, FLOOR, easeIn(fp)) - Math.sin(Math.PI * fp) * 40 }; rot = lerp(0, 1.4, fp) + (fp >= 1 ? -1.4 + Math.PI / 2 : 0);
      if (fp >= 1) rot = Math.PI / 2 - .0;
      if (s > C.lift + .1) { const hh = E.hand(sl, 0); boxP = { x: hh.x + 4, y: hh.y + 18 }; rot = 0; }
      if (s > C.place) boxP = null;
    }
    // mamá
    const mp = momPose(s);
    const showMom = !(s < C.trip && momX(s) < 60);
    if (showMom) {
      if (!refl && s < C.trip) for (let k = 3; k >= 1; k--) {
        const q = s - k * .045; if (momX(q) < 70) continue;
        figure(momPose(q), STYLE.gray, { alpha: .22 / k, noShadow: true });
      }
      bun(mp, '#cfcfcf');
      const ml = figure(mp, momStyle(s));
      const it = momItem(s);
      if (it && s < C.trip) { const h = E.hand(ml, 0); carried(it, h.x - (mp.dir || 1) * 6, h.y + (it === 'boxes' ? 24 : 16), t); }
      if (!refl) {
        // sudor
        const sw = smooth(prog(s, 2.5, 4)) * (1 - smooth(prog(s, C.hand, C.risen)));
        for (let i = 0; i < 3 && sw > 0; i++) {
          const ph = (s * 1.4 + i / 3) % 1;
          ctx.fillStyle = `rgba(220,225,235,${sw * (1 - ph) * .8})`;
          ctx.beginPath(); ctx.arc(ml.head.x + (i - 1) * 16, ml.head.y - 10 + ph * 34, 3.2, 0, Math.PI * 2); ctx.fill();
        }
        // batería
        const ba = smooth(prog(s, C.bat, C.bat + .3)) * (1 - smooth(prog(s, C.heart - .05, C.heart + .1)));
        const lvl = lerp(.12, 1, smooth(prog(s, C.take, C.full)));
        const bpos = { x: ml.head.x + 4, y: ml.head.y - 64 };
        battery(bpos.x, bpos.y, lvl, s, ba, smooth(prog(s, C.take - .1, C.take + .2)));
        const hp = E.backOut(prog(s, C.heart, C.heart + .5));
        if (hp > 0) { const pulseH = 1 + .08 * Math.sin(s * 7); E.heart(bpos.x, bpos.y + 8, 46 * hp * pulseH, '#ff3b36', 1, 40); }
        E.burst(bpos.x, bpos.y, s, C.heart, { n: 30, speed: 280, size: 4, color: '255,70,60', gravity: .4 });
        E.ring(bpos.x, bpos.y, s, C.heart, { r: 200, color: '255,80,60', width: 6 });
      }
    }
    if (boxP) carried('box', boxP.x, boxP.y, t, rot);
    const gl = figure(girl, help(smooth(prog(s, C.famUp, C.hug))));
    // celulares
    if (!refl) {
      const ph = (pose, tOff) => { const on = 1 - smooth(prog(s, tOff - .3, tOff + .1)); if (on > 0 && pose.phone) { E.phone(pose.phone.x, pose.phone.y, -.5, on, .85 * (pose.s || 1)); const hd = E.headOf(pose); glowCircle(hd.x - 8, hd.y + 4, 34 * (pose.s || 1), "255,40,30", .45 * on); } };
      if (s < C.sonUp) ph(seated(SON, s, .82, smooth(prog(s, C.notice - .4, C.notice + .2))), C.notice + .1);
      if (s < C.famUp) { ph(seated(GIRL, s, .66, smooth(prog(s, C.famLook - .3, C.famLook + .3))), C.famLook + .2); ph(seated(DAD, s, 1, smooth(prog(s, C.famLook - .3, C.famLook + .3))), C.famLook + .2); }
      // corazones que suben
      if (s > C.heart) for (let i = 0; i < 9; i++) {
        const st = C.heart + .2 + i * .42, p = prog(s, st, st + 3.2); if (p <= 0 || p >= 1) continue;
        const x = 120 + ((i * 97) % 240) + Math.sin(s * 2 + i) * 12;
        E.heart(x, FLOOR - 120 - p * 300, 14 + (i % 3) * 5, '#ff3b36', Math.sin(Math.PI * p), 18);
      }
    }
  },
  events() {
    const ev = E.footsteps(D, t => {
      const s = S(t);
      return [s < C.trip && momX(s) > 60 ? { phi: momD(s) / (4 * 34 * .9), size: .9, vol: .9 } : null,
              s > C.sonWalk && s < C.sonAt ? { phi: (SON - lerp(SON - 8, 318, smooth(prog(s, C.sonWalk, C.sonAt)))) / (4 * 22 * .82), size: .8 } : null,
              s > C.famWalk && s < C.dadAt ? { phi: (DAD - lerp(DAD - 8, 292, smooth(prog(s, C.famWalk, C.dadAt)))) / 88, size: 1 } : null];
    });
    return ev.concat([
      { t: 0, type: 'clock', dur: R(C.trip), vol: .8 }, { t: 0.02, type: 'whoosh', vol: .7 }, { t: .05, type: 'notify', vol: .5 },
      { t: R(1.1), type: 'thud', vol: .35 }, { t: R(2.82), type: 'clatter', vol: .3 }, { t: R(4.3), type: 'thud', vol: .3 },
      { t: .4, type: 'whoosh', vol: .3 }, { t: 1.9, type: 'whoosh', vol: .3 }, { t: 3.5, type: 'whoosh', vol: .35 }, { t: 4.9, type: 'whoosh', vol: .4 },
      { t: R(C.trip), type: 'scuff' }, { t: R(C.boxLand), type: 'thud' }, { t: R(C.boxLand) + .03, type: 'clatter', vol: .6 }, { t: R(C.down - .1), type: 'thud', vol: .7 },
      ...[0, .8, 1.6, 2.4].map((k, i) => ({ t: R(C.bat) + k, type: 'heartbeat', vol: .8 - i * .12 })),
      ...[0, .5, 1.0].map(k => ({ t: R(C.bat) + .2 + k, type: 'buzz', dur: .18, vol: .25 })),
      { t: R(C.sonUp), type: 'slide', vol: .4 }, { t: R(C.lift + .3), type: 'whoosh', vol: .35 }, { t: R(C.place), type: 'thud', vol: .4 },
      { t: R(C.take), type: 'chime' }, { t: R(C.take) + .2, type: 'riser', dur: 1.6, vol: .7 }, { t: R(C.heart), type: 'sparkle' }, { t: R(C.heart), type: 'kiss', vol: .6 },
    ]);
  },
  music: {
    sections: [
      { t: .2, dur: R(C.trip) - .2, style: 'upbeat', chords: ['Am', 'F', 'C', 'G'], chordLen: .9, bpm: 140 },
      { t: R(C.down), dur: R(C.notice) - R(C.down) + .3, style: 'sad', chords: ['Am', 'F'], chordLen: 1.2 },
      { t: R(C.notice), dur: R(C.take) - R(C.notice), style: 'tender', chords: ['F', 'C', 'G', 'Am'], chordLen: 1.1 },
      { t: R(C.take), dur: D - R(C.take), style: 'hope', chords: ['F', 'C', 'G', 'C'], chordLen: 1.6 },
    ],
    stingers: [{ t: R(C.boxLand), type: 'impact' }, { t: R(C.heart), type: 'bells' }],
    duck: [[R(C.trip) + .05, R(C.down) + .2]],
  },
};
})();
