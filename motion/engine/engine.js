// ═════════════════════════════════════════════════════════════════════
//  MOTOR DE ANIMACIÓN — figuras pictograma, utilería, cámara y escenario
//  Cada escena (motion/scenes/*.js) define window.SCENE y el motor la
//  dibuja con E.render(t). Todo es determinista: mismo t → mismo frame.
//  Mundo: 720 x 1280, suelo en E.FLOOR (900). Las figuras miran a la
//  derecha (dir: 1) o a la izquierda (dir: -1).
// ═════════════════════════════════════════════════════════════════════
(function () {
const W = 720, H = 1280, FPS = 30, FLOOR = 900;
// escala de salida: el mundo se describe en 720x1280 y se dibuja a 1080x1920
const SC = 1.5;
const cv = document.getElementById('c');
cv.width = W * SC; cv.height = H * SC;
const ctx = cv.getContext('2d');

// ───────────── utilidades ─────────────
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, p) => a + (b - a) * p;
const prog = (t, t0, t1) => clamp((t - t0) / (t1 - t0));
const easeInOut = p => p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
const easeOut = p => 1 - Math.pow(1 - p, 3);
const easeIn = p => p * p * p;
const smooth = p => p * p * (3 - 2 * p);
const backOut = p => { const c = 1.9; return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2); };
const pulse = (t, t0, dur) => Math.max(0, 1 - Math.abs(t - t0) / dur); // pico triangular en t0
const bump = (t, t0, t1) => Math.sin(Math.PI * prog(t, t0, t1));     // 0→1→0
function rng(seed) { seed = Math.max(1, Math.floor(seed) % 2147483646); return () => (seed = (seed * 16807) % 2147483647) / 2147483647; }
const mixCol = (a, b, p) => `rgb(${a.map((v, i) => Math.round(lerp(v, b[i], p))).join(',')})`;
// keyed([[t, v], ...], t) → valor interpolado suave entre claves (v puede ser número)
function keyed(keys, t, ease = smooth) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) {
    const [t0, v0] = keys[i - 1], [t1, v1] = keys[i];
    return lerp(v0, v1, ease((t - t0) / (t1 - t0)));
  }
  return keys[keys.length - 1][1];
}
// distancia recorrida integrando una curva de velocidad keyed (para caminatas)
function distance(speedKeys, duration) {
  const DT = 1 / 240, a = [0];
  for (let i = 1; i <= duration / DT + 2; i++) a.push(a[i - 1] + keyed(speedKeys, i * DT) * DT);
  return t => { const i = clamp(t / DT, 0, a.length - 2), f = Math.floor(i); return lerp(a[f], a[f + 1], i - f); };
}
const P = (x, y) => ({ x, y });
const add = (a, b) => ({ x: a.x + b.x, y: a.y + b.y });
const lerpP = (a, b, p) => ({ x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p) });

// ───────────── rig de la figura ─────────────
const BASE = { headR: 23, neck: 8, torso: 76, thigh: 50, shin: 50, upper: 40, fore: 38, w: 20 };
const ARM = BASE.upper + BASE.fore, LEG = BASE.thigh + BASE.shin;

function ik(a, b, l1, l2, bendDir) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const d = clamp(Math.hypot(dx, dy), Math.abs(l1 - l2) + .01, l1 + l2 - .01);
  const base = Math.atan2(dy, dx), off = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1));
  const c1 = { x: a.x + Math.cos(base + off) * l1, y: a.y + Math.sin(base + off) * l1 };
  const c2 = { x: a.x + Math.cos(base - off) * l1, y: a.y + Math.sin(base - off) * l1 };
  return bendDir(c1) > bendDir(c2) ? c1 : c2;
}
function reach(a, b, len) {
  const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
  return d <= len || d === 0 ? b : { x: a.x + dx / d * len, y: a.y + dy / d * len };
}

/* Una POSE es un objeto plano:
   { hip:{x,y}, s:escala(1=adulto, .55=niño), lean:inclinación del torso (rad, + = hacia donde mira),
     tilt:cabeza (rad, + = mira abajo, - = mira arriba), dir: 1 derecha / -1 izquierda,
     feet:[pieCercano, pieLejano] (puntos del mundo),
     arms:[cercano, lejano] cada uno {ang, bend} (ángulo desde abajo, + = adelante) o {target:{x,y}} }  */
function solve(p) {
  const dir = p.dir || 1, s = p.s || 1, hx = p.hip.x;
  const m = q => q && ({ x: dir === 1 ? q.x : 2 * hx - q.x, y: q.y }); // espejo a "mirando a la derecha"
  const R = {}; for (const k in BASE) R[k] = BASE[k] * s;
  const hip = p.hip, lean = p.lean || 0, tilt = p.tilt || 0;
  const sh = { x: hx + Math.sin(lean) * R.torso, y: hip.y - Math.cos(lean) * R.torso };
  const ha = lean + tilt;
  const head = { x: sh.x + Math.sin(ha) * (R.neck + R.headR), y: sh.y - Math.cos(ha) * (R.neck + R.headR) };
  const legs = (p.feet || [{ x: hx + 6 * s * dir, y: FLOOR }, { x: hx - 8 * s * dir, y: FLOOR }]).map(f0 => {
    const f = m(f0), foot = reach(hip, f, R.thigh + R.shin - .3);
    return [hip, ik(hip, foot, R.thigh, R.shin, k => k.x), foot];
  });
  const arms = (p.arms || [{ ang: .1, bend: .3 }, { ang: -.1, bend: .3 }]).map(a => {
    if (a.target) {
      const hand = reach(sh, m(a.target), R.upper + R.fore - .3);
      return [sh, ik(sh, hand, R.upper, R.fore, e => a.elbowUp ? -e.y : e.y - (a.elbowBack ? 1 : -.3) * e.x * .3), hand];
    }
    const e = { x: sh.x + Math.sin(a.ang) * R.upper, y: sh.y + Math.cos(a.ang) * R.upper };
    return [sh, e, { x: e.x + Math.sin(a.ang + (a.bend || 0)) * R.fore, y: e.y + Math.cos(a.ang + (a.bend || 0)) * R.fore }];
  });
  const back = q => m(q);
  return { hip, sh: back(sh), head: back(head), legs: legs.map(l => l.map(back)), arms: arms.map(l => l.map(back)), R, s, dir };
}

// Mezcla dos poses (interpolación de cadera, torso, pies y manos). Muy útil para keyframes.
function handOffsets(p) { const sl = solve(p); return sl.arms.map(a => ({ x: a[2].x - sl.sh.x, y: a[2].y - sl.sh.y })); }
function mix(a, b, p) {
  if (p <= 0) return a; if (p >= 1) return b;
  const s = lerp(a.s || 1, b.s || 1, p), dir = p < .5 ? (a.dir || 1) : (b.dir || 1);
  const out = {
    hip: lerpP(a.hip, b.hip, p), s, dir, lean: lerp(a.lean || 0, b.lean || 0, p), tilt: lerp(a.tilt || 0, b.tilt || 0, p),
    feet: [0, 1].map(i => lerpP((a.feet || solve(a).legs.map(l => l[2]))[i], (b.feet || solve(b).legs.map(l => l[2]))[i], p)),
  };
  const ha = handOffsets(a), hb = handOffsets(b);
  const sh = solve({ ...out, arms: [] }).sh;
  out.arms = [0, 1].map(i => ({ target: add(sh, lerpP(ha[i], hb[i], p)), elbowBack: (p < .5 ? a : b).arms?.[i]?.elbowBack, elbowUp: (p < .5 ? a : b).arms?.[i]?.elbowUp }));
  return out;
}
// Línea de tiempo de poses: poseAt(t, [[t0, pose0], [t1, pose1], ...]) — pose puede ser función (t)=>pose
function poseAt(t, keys, ease = easeInOut) {
  const get = (k) => typeof k[1] === 'function' ? k[1](t) : k[1];
  if (t <= keys[0][0]) return get(keys[0]);
  for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) return mix(get(keys[i - 1]), get(keys[i]), ease(prog(t, keys[i - 1][0], keys[i][0])));
  return get(keys[keys.length - 1]);
}

// ───────────── poses base ─────────────
// todas aceptan o = { s, dir, lean, tilt, t (para respirar), y (altura del piso donde está parado) }
function stand(x, o = {}) {
  const s = o.s || 1, dir = o.dir || 1, y = o.y ?? FLOOR, br = o.t !== undefined ? Math.sin(o.t * 3 + x) * 1.4 * s : 0;
  return {
    hip: { x, y: y - 94 * s + br }, s, dir, lean: o.lean ?? .04, tilt: o.tilt ?? 0,
    feet: [{ x: x + 7 * s * dir, y }, { x: x - 9 * s * dir, y }],
    arms: o.arms || [{ ang: .1, bend: .3 }, { ang: -.08, bend: .3 }],
  };
}
// caminar: d = distancia recorrida (px). Si x se mueve con d, se ve caminando en el lugar correcto.
function walk(x, d, o = {}) {
  const s = o.s || 1, dir = o.dir || 1, y = o.y ?? FLOOR, k = o.stride || 1, fr = o.freeze || 0;
  const L = 22 * s * k, phi = d / (4 * L);
  const foot = ph => {
    const q = ((ph % 1) + 1) % 1;
    if (q < .5) return { x: x + dir * lerp(L, -L, q / .5), y };
    const r = (q - .5) / .5;
    return { x: x + dir * lerp(-L, L, easeInOut(r)), y: y - Math.sin(Math.PI * r) * 13 * s * (1 - fr) };
  };
  const bob = -Math.cos(4 * Math.PI * phi) * 2.6 * s * (1 - fr);
  const sw = Math.sin(2 * Math.PI * phi) * (o.swing ?? .42) * (1 - fr);
  return {
    hip: { x, y: y - (o.stand || 94) * s + bob }, s, dir, lean: o.lean ?? .07, tilt: o.tilt ?? 0, phi,
    feet: [foot(phi), foot(phi + .5)],
    arms: o.arms || [{ ang: -sw + .08, bend: .3 + Math.max(0, -sw) * .5 }, { ang: sw + .08, bend: .3 + Math.max(0, sw) * .5 }],
  };
}
// correr: como walk pero con zancada larga, inclinación y brazos doblados
function run(x, d, o = {}) {
  const s = o.s || 1, dir = o.dir || 1, y = o.y ?? FLOOR, L = 34 * s * (o.stride || 1), phi = d / (4 * L);
  const foot = ph => {
    const q = ((ph % 1) + 1) % 1;
    if (q < .42) return { x: x + dir * lerp(L, -L, q / .42), y };
    const r = (q - .42) / .58;
    return { x: x + dir * lerp(-L, L * 1.1, easeInOut(r)), y: y - Math.sin(Math.PI * r) * 30 * s };
  };
  const sw = Math.sin(2 * Math.PI * phi) * .95;
  return {
    hip: { x, y: y - 90 * s - Math.abs(Math.sin(2 * Math.PI * phi)) * 6 * s }, s, dir, lean: o.lean ?? .3, tilt: o.tilt ?? -.15, phi,
    feet: [foot(phi), foot(phi + .5)],
    arms: [{ ang: -sw, bend: 1.4 }, { ang: sw, bend: 1.4 }],
  };
}
// sentado: en silla por defecto (asiento a 50px del piso, usar E.chair); en el piso: {ground:true}
function sit(x, o = {}) {
  const s = o.s || 1, dir = o.dir || 1, y = o.y ?? FLOOR, seat = o.seat ?? (o.ground ? y : y - 50 * s);
  const ground = seat >= y - 5;
  return {
    hip: { x, y: seat - 10 * s }, s, dir, lean: o.lean ?? .08, tilt: o.tilt ?? .05,
    feet: ground ? [{ x: x + 70 * s * dir, y }, { x: x + 60 * s * dir, y }] : [{ x: x + 46 * s * dir, y }, { x: x + 38 * s * dir, y }],
    arms: o.arms || [{ ang: .6, bend: .5 }, { ang: .5, bend: .5 }],
  };
}
// de rodillas (una rodilla en el piso)
function kneel(x, o = {}) {
  const s = o.s || 1, dir = o.dir || 1, y = o.y ?? FLOOR;
  return {
    hip: { x, y: y - 58 * s }, s, dir, lean: o.lean ?? .1, tilt: o.tilt ?? .1,
    feet: [{ x: x + 44 * s * dir, y }, { x: x - 52 * s * dir, y: y - 2 }],
    arms: o.arms || [{ ang: .5, bend: .4 }, { ang: .3, bend: .4 }],
  };
}
// agachado (cuclillas): amt 0 de pie → 1 agachado
function crouch(x, o = {}) {
  const s = o.s || 1, dir = o.dir || 1, y = o.y ?? FLOOR, a = o.amt ?? 1;
  return {
    hip: { x: x - 10 * s * dir * a, y: y - lerp(94, 42, a) * s }, s, dir, lean: lerp(.05, .7, a), tilt: o.tilt ?? .2,
    feet: [{ x: x + 12 * s * dir, y }, { x: x - 4 * s * dir, y }],
    arms: o.arms || [{ ang: .9, bend: .3 }, { ang: .8, bend: .3 }],
  };
}
// acostado en el piso boca arriba/abajo (dir indica hacia dónde queda la cabeza)
function lie(x, o = {}) {
  const s = o.s || 1, dir = o.dir || 1, y = o.y ?? FLOOR;
  return {
    hip: { x, y: y - 11 * s }, s, dir, lean: Math.PI / 2 - .02, tilt: o.tilt ?? -.1,
    feet: [{ x: x - 98 * s * dir, y: y - 8 * s }, { x: x - 94 * s * dir, y: y - 12 * s }],
    arms: o.arms || [{ ang: Math.PI / 2 + .3, bend: .1 }, { ang: Math.PI / 2 + .1, bend: .1 }],
  };
}
// encorvado/triste: de pie con la cabeza baja
function sad(x, o = {}) { return stand(x, { ...o, lean: o.lean ?? .3, tilt: o.tilt ?? .5, arms: o.arms || [{ ang: .05, bend: .05 }, { ang: 0, bend: .05 }] }); }
// brazos arriba (celebrar)
function cheer(x, o = {}) { return stand(x, { ...o, lean: -.05, tilt: -.35, arms: [{ ang: Math.PI - .5, bend: .1 }, { ang: Math.PI - .3, bend: .1 }] }); }

// punto donde dos figuras se toman la mano (al alcance de ambos)
function holdPoint(a, ra, b, rb) {
  const w = ra / (ra + rb);
  const p = { x: lerp(a.x, b.x, w), y: lerp(a.y, b.y, w) };
  for (let drop = 90; drop >= 0; drop -= 2) {
    const q = { x: p.x, y: p.y + drop };
    if (Math.hypot(q.x - a.x, q.y - a.y) < ra * .96 && Math.hypot(q.x - b.x, q.y - b.y) < rb * .96) return q;
  }
  return p;
}
// hombro de una pose (sin resolver brazos) — para calcular dónde tocar a otra figura
const shoulderOf = p => solve({ ...p, arms: [] }).sh;
const headOf = p => solve({ ...p, arms: [] }).head;

// ───────────── estilos de figura ─────────────
const STYLE = {
  hero: { near: '#f4f4f4', far: '#bdbdbd', glow: .28 },
  gray: { near: '#8e8e8e', far: '#5f5f5f', glow: .05 },
  dim: { near: '#4a4a4a', far: '#333333', glow: 0 },
  red: { near: '#ff3b36', far: '#b8221f', glow: .5, glowColor: '255,50,40' },
};
// interpolar estilo (ej. envejecer: hero → gray)
function mixStyle(a, b, p) {
  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  return { near: mixCol(hex(a.near), hex(b.near), p), far: mixCol(hex(a.far), hex(b.far), p), glow: lerp(a.glow, b.glow, p), glowColor: p < .5 ? a.glowColor : b.glowColor };
}

function limb(pts, color, w) {
  ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.stroke();
}
// ── color helpers para el sombreado ──
function rgbOf(c) {
  if (c[0] === '#') return [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
  const m = c.match(/[\d.]+/g); return m.slice(0, 3).map(Number);
}
const shade = (c, k) => { const v = rgbOf(c); return `rgb(${v.map(x => Math.round(clamp(x * k, 0, 255))).join(',')})`; };
const tint = (c, k) => { const v = rgbOf(c); return `rgb(${v.map(x => Math.round(x + (255 - x) * k)).join(',')})`; };
// extremidad con volumen: borde oscuro, cuerpo, brillo hacia la luz (arriba-izquierda)
function limb3d(pts, color, w, glow) {
  const o = w * .1, h = w * .16;
  if (glow) { ctx.save(); ctx.shadowColor = glow; ctx.shadowBlur = 24; limb(pts, shade(color, .5), w); ctx.restore(); }
  else limb(pts, shade(color, .5), w);
  ctx.save(); ctx.translate(-o, -o); limb(pts, color, w * .76); ctx.restore();
  ctx.save(); ctx.translate(-h, -h); ctx.globalAlpha *= .45; limb(pts, tint(color, .8), w * .3); ctx.restore();
}
// sombra de contacto suave en el piso bajo un punto
function contactShadow(x, y, r, a = .55) {
  ctx.save(); ctx.translate(x, y + 2); ctx.scale(1, .22);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
  g.addColorStop(0, `rgba(0,0,0,${a})`); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(-r, -r, r * 2, r * 2); ctx.restore();
}
// dibuja una figura. opts: { alpha, blindfold:true, headColor, noShadow }
function figure(pose, style = STYLE.hero, opts = {}) {
  const sl = pose.legs ? pose : solve(pose);
  const w = BASE.w * Math.pow(sl.s, .75);
  ctx.save();
  if (opts.alpha !== undefined) ctx.globalAlpha *= opts.alpha;
  if (!opts.noShadow) {
    for (const l of sl.legs) contactShadow(l[2].x, l[2].y, 26 * sl.s, .6);
    if (Math.abs(sl.hip.y - sl.legs[0][2].y) < 30 * sl.s) contactShadow(sl.hip.x, sl.legs[0][2].y, 60 * sl.s, .5);
  }
  const glow = style.glow > 0 ? `rgba(${style.glowColor || '255,255,255'},${style.glow})` : null;
  limb3d(sl.legs[1], style.far, w, glow); limb3d(sl.arms[1], style.far, w, glow);
  // torso: cápsula más ancha en el pecho
  const tw = w * 1.45, chest = lerpP(sl.hip, sl.sh, .72);
  limb3d([sl.hip, chest, sl.sh], style.near, tw, glow);
  // cabeza: esfera con luz
  const r = sl.R.headR, hc = opts.headColor || style.near;
  ctx.save();
  if (glow) { ctx.shadowColor = glow; ctx.shadowBlur = 26; }
  const g = ctx.createRadialGradient(sl.head.x - r * .38, sl.head.y - r * .42, r * .1, sl.head.x, sl.head.y, r * 1.02);
  g.addColorStop(0, tint(hc, .7)); g.addColorStop(.45, hc); g.addColorStop(1, shade(hc, .58));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(sl.head.x, sl.head.y, r, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  limb3d(sl.legs[0], style.near, w, glow); limb3d(sl.arms[0], style.near, w, glow);
  if (opts.blindfold) {
    const a = Math.atan2(sl.head.y - sl.sh.y, sl.head.x - sl.sh.x) + Math.PI / 2;
    ctx.save(); ctx.translate(sl.head.x, sl.head.y); ctx.rotate(a);
    ctx.fillStyle = '#ff3b36'; ctx.shadowColor = '#ff2020'; ctx.shadowBlur = 10;
    ctx.fillRect(-sl.R.headR - 1, -5 * sl.s, sl.R.headR * 2 + 2, 10 * sl.s);
    ctx.fillRect(-sl.R.headR * 1.1 * sl.dir - 6 * sl.dir, -3, -8 * sl.dir, 14 * sl.s);
    ctx.restore();
  }
  ctx.restore();
  return sl;
}
// mano de una figura ya resuelta: sl.arms[0][2] (cercana) / sl.arms[1][2] (lejana)
const hand = (sl, i = 0) => sl.arms[i][2];

// ───────────── utilería (props) ─────────────
function glowCircle(x, y, r, color, a = 1) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${color},${a})`); g.addColorStop(1, `rgba(${color},0)`);
  ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
}
function sun(x, y, r = 40, a = 1) {
  glowCircle(x, y, r * 5, '200,20,20', .25 * a);
  glowCircle(x, y, r * 2.2, '255,40,40', .35 * a);
  ctx.save(); ctx.globalAlpha *= a; ctx.shadowColor = '#ff2a2a'; ctx.shadowBlur = 45;
  ctx.fillStyle = '#ff3a34'; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.restore();
}
function moon(x, y, r = 30, a = 1) {
  glowCircle(x, y, r * 3, '255,255,255', .12 * a);
  ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = '#e8e8e8'; ctx.shadowColor = '#fff'; ctx.shadowBlur = 30;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.globalCompositeOperation = 'destination-out'; ctx.beginPath(); ctx.arc(x + r * .45, y - r * .2, r * .9, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
function phone(x, y, rot = 0, on = 1, sc = 1) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sc, sc);
  ctx.fillStyle = '#111'; ctx.fillRect(-8, -13, 16, 26);
  ctx.shadowColor = '#ff2a2a'; ctx.shadowBlur = 30 * on;
  ctx.fillStyle = `rgba(255,42,42,${.95 * on})`; ctx.fillRect(-6, -11, 12, 22);
  ctx.restore();
  if (on > 0) glowCircle(x, y, 90 * sc, '255,30,30', .22 * on);
}
function heart(x, y, size = 30, color = '#ff3b36', a = 1, glow = 25) {
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.scale(size / 30, size / 30);
  ctx.shadowColor = color; ctx.shadowBlur = glow; ctx.fillStyle = color;
  ctx.beginPath(); ctx.moveTo(0, 10);
  ctx.bezierCurveTo(-30, -10, -16, -34, 0, -18); ctx.bezierCurveTo(16, -34, 30, -10, 0, 10);
  ctx.fill(); ctx.restore();
}
function cane(top, tip, color = '#e6e6e6') {
  limb([top, tip], color, 6);
  ctx.strokeStyle = color; ctx.lineWidth = 6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(top.x - 8, top.y, 8, 0, Math.PI, true); ctx.stroke();
}
function brick(x, y, w = 31, h = 20, lit = 1) {
  const c = [lerp(34, 214, lit), lerp(33, 206, lit), lerp(32, 194, lit)].map(Math.round);
  ctx.fillStyle = `rgb(${c})`; ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
  ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.fillRect(x + 1, y + h - 4, w - 2, 3);
  ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(x + 1, y + 1, w - 2, 2);
}
// pared de ladrillos: x0, yBase (abajo), columnas, filas visibles (n puede ser decimal para animar)
function wall(x0, yBase, cols, rows, lit = 1, bw = 31, bh = 20) {
  for (let r = 0; r < Math.ceil(rows); r++) {
    const a = clamp(rows - r); if (a <= 0) break;
    const off = r % 2 ? bw / 2 : 0;
    for (let c = 0; c < cols; c++) {
      ctx.save(); ctx.globalAlpha *= a;
      brick(x0 + c * bw - off * (c === 0 ? 0 : 1), yBase - (r + 1) * bh - (1 - a) * 30, c === 0 && off ? bw - off : bw, bh, lit);
      ctx.restore();
    }
  }
}
function stone(x, y, r = 14, seed = 1, color = '#9a9590') {
  const g = rng(seed); ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2, rr = r * (.8 + g() * .3); ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr * .8); }
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.beginPath(); ctx.arc(x - r * .3, y - r * .3, r * .35, 0, Math.PI * 2); ctx.fill();
}
// lluvia en un rectángulo; a = intensidad 0..1
function rain(t, x0, x1, y0, y1, a = 1, seed = 3, floorY = FLOOR) {
  const g = rng(seed), n = Math.round(160 * a);
  ctx.strokeStyle = 'rgba(200,200,210,.35)'; ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const x = x0 + g() * (x1 - x0), sp = 900 + g() * 500, ph = g();
    const y = y0 + (((t * sp / (y1 - y0) + ph) % 1)) * (y1 - y0);
    ctx.moveTo(x, y); ctx.lineTo(x - 3, y + 22);
  }
  ctx.stroke();
  // salpicaduras
  for (let i = 0; i < n / 3; i++) {
    const x = x0 + g() * (x1 - x0), ph = (t * 3 + g()) % 1;
    ctx.strokeStyle = `rgba(220,220,230,${.4 * (1 - ph)})`;
    ctx.beginPath(); ctx.ellipse(x, floorY, 2 + ph * 10, 1 + ph * 2.5, 0, 0, Math.PI * 2); ctx.stroke();
  }
}
function cloud(x, y, sc = 1, color = '#2a2a2e', a = 1) {
  ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = color; ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 20;
  for (const [dx, dy, r] of [[-50, 8, 34], [-15, -14, 44], [30, -4, 38], [62, 12, 26], [5, 16, 34]]) {
    ctx.beginPath(); ctx.arc(x + dx * sc, y + dy * sc, r * sc, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}
// paraguas: x,y = punta del mango arriba; open 0..1
function umbrella(x, y, sc = 1, rot = 0, open = 1, color = '#e9e9e9') {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sc, sc);
  ctx.strokeStyle = '#ddd'; ctx.lineWidth = 4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(0, 92); ctx.arc(-8, 92, 8, 0, Math.PI); ctx.stroke();
  const wd = lerp(10, 66, open), hh = lerp(70, 26, open);
  ctx.fillStyle = color; ctx.shadowColor = 'rgba(255,255,255,.4)'; ctx.shadowBlur = 14;
  ctx.beginPath(); ctx.moveTo(-wd, hh * .6); ctx.quadraticCurveTo(0, -hh, wd, hh * .6);
  for (let i = 3; i >= 0; i--) ctx.quadraticCurveTo(-wd + (i + .5) * wd / 2, hh * .6 - 10 * open, -wd + i * wd / 2, hh * .6);
  ctx.fill(); ctx.restore();
}
function flame(x, y, t, sc = 1, a = 1) {
  const f = 1 + Math.sin(t * 23) * .08 + Math.sin(t * 37) * .05;
  glowCircle(x, y - 10 * sc, 90 * sc, '255,140,60', .28 * a);
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.scale(sc, sc * f);
  ctx.shadowColor = '#ff7a2a'; ctx.shadowBlur = 25;
  ctx.fillStyle = '#ff5a2a'; ctx.beginPath(); ctx.moveTo(0, -30); ctx.quadraticCurveTo(12, -8, 0, 0); ctx.quadraticCurveTo(-12, -8, 0, -30); ctx.fill();
  ctx.fillStyle = '#ffe0a0'; ctx.beginPath(); ctx.moveTo(0, -18); ctx.quadraticCurveTo(6, -5, 0, 0); ctx.quadraticCurveTo(-6, -5, 0, -18); ctx.fill();
  ctx.restore();
}
function candle(x, y, t, lit = 1) { // y = base
  ctx.fillStyle = '#e8e2d6'; ctx.fillRect(x - 7, y - 36, 14, 36);
  ctx.strokeStyle = '#222'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y - 36); ctx.lineTo(x, y - 42); ctx.stroke();
  if (lit > 0) flame(x, y - 40, t, .7 * lit, lit);
}
// árbol que crece: growth 0..1. bloom 0..1 = hojas/flores rojas
function tree(x, y, growth, seed = 5, sc = 1, bloom = 1, leafColor = '255,70,60') {
  const g = rng(seed);
  const branch = (x0, y0, ang, len, w, depth) => {
    const p = clamp(growth * 5 - depth);
    if (p <= 0) return;
    const x1 = x0 + Math.sin(ang) * len * p, y1 = y0 - Math.cos(ang) * len * p;
    ctx.strokeStyle = '#d9d2c6'; ctx.lineWidth = w; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    if (depth < 4) { branch(x1, y1, ang - .45 - g() * .25, len * .72, w * .65, depth + 1); branch(x1, y1, ang + .4 + g() * .25, len * .7, w * .65, depth + 1); }
    else if (bloom > 0 && p >= 1) { const r = (6 + g() * 8) * clamp(growth * 1.6 - .6) * bloom; if (r > 0) glowCircle(x1, y1, r * 2.6, leafColor, .55); }
  };
  ctx.save(); ctx.shadowColor = 'rgba(255,255,255,.25)'; ctx.shadowBlur = 10;
  branch(x, y, 0, 120 * sc, 16 * sc, 0); ctx.restore();
}
function sprout(x, y, p, sc = 1) {
  if (p <= 0) return;
  ctx.strokeStyle = '#d9f0d0'; ctx.lineWidth = 4 * sc; ctx.lineCap = 'round';
  const h = 40 * sc * p; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - h); ctx.stroke();
  ctx.fillStyle = '#e8ffe0';
  for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(x + s * 10 * sc * p, y - h + 4, 10 * sc * p, 4 * sc * p, s * -.5, 0, Math.PI * 2); ctx.fill(); }
}
function ball(x, y, r = 14, color = '#ff3b36') {
  ctx.save(); ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 18;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.arc(x - r * .35, y - r * .35, r * .3, 0, Math.PI * 2); ctx.fill();
}
function chair(x, dir = 1, y = FLOOR, color = '#6d6d6d') { // asiento a y-50
  ctx.strokeStyle = color; ctx.lineWidth = 7; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x - 24 * dir, y); ctx.lineTo(x - 24 * dir, y - 120); ctx.moveTo(x - 24 * dir, y - 50); ctx.lineTo(x + 26 * dir, y - 50); ctx.lineTo(x + 26 * dir, y); ctx.stroke();
}
function table(x, w = 220, y = FLOOR, h = 80, color = '#7a7a7a') {
  ctx.fillStyle = color; ctx.fillRect(x - w / 2, y - h, w, 10);
  ctx.fillRect(x - w / 2 + 12, y - h, 8, h); ctx.fillRect(x + w / 2 - 20, y - h, 8, h);
}
// puerta: open 0..1, con luz que sale
function door(x, y = FLOOR, open = 0, light = 1, w = 90, h = 190) {
  if (open > 0) {
    ctx.fillStyle = `rgba(255,240,220,${.85 * light})`; ctx.shadowColor = '#fff'; ctx.shadowBlur = 50 * light;
    ctx.fillRect(x - w / 2, y - h, w, h); ctx.shadowBlur = 0;
    const g = ctx.createLinearGradient(x, y, x, y + 160);
    g.addColorStop(0, `rgba(255,240,220,${.25 * light * open})`); g.addColorStop(1, 'rgba(255,240,220,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - w / 2, y); ctx.lineTo(x + w / 2, y); ctx.lineTo(x + w * 1.4, y + 160); ctx.lineTo(x - w * 1.4, y + 160); ctx.fill();
  }
  ctx.fillStyle = '#3a3a3a'; ctx.strokeStyle = '#888'; ctx.lineWidth = 3;
  const dw = w * (1 - open * .85);
  ctx.fillRect(x - w / 2, y - h, dw, h); ctx.strokeRect(x - w / 2, y - h, dw, h);
  ctx.fillStyle = '#bbb'; ctx.beginPath(); ctx.arc(x - w / 2 + dw - 12, y - h / 2, 4, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#666'; ctx.strokeRect(x - w / 2 - 4, y - h - 4, w + 8, h + 4);
}
// hoyo en el piso: x0..x1, profundidad. Dibujar ANTES de las figuras que caen dentro.
function pit(x0, x1, depth = 220, y = FLOOR) {
  ctx.fillStyle = '#000'; ctx.fillRect(x0, y - 1, x1 - x0, depth + 2);
  const g = ctx.createLinearGradient(0, y, 0, y + depth);
  g.addColorStop(0, '#2b2b2b'); g.addColorStop(1, '#0a0a0a');
  ctx.fillStyle = g; ctx.fillRect(x0, y, 10, depth); ctx.fillRect(x1 - 10, y, 10, depth);
  ctx.fillStyle = '#3a3a3a'; ctx.fillRect(x0 - 3, y - 2, 6, 4); ctx.fillRect(x1 - 3, y - 2, 6, 4);
}
function flag(x, y, t, color = '#ff3b36', sc = 1) { // y = base del mástil
  ctx.strokeStyle = '#ddd'; ctx.lineWidth = 4 * sc; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 140 * sc); ctx.stroke();
  ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 20;
  ctx.beginPath(); ctx.moveTo(x, y - 140 * sc);
  for (let i = 0; i <= 10; i++) ctx.lineTo(x + i * 6 * sc, y - 140 * sc + Math.sin(t * 6 + i * .6) * 4 * sc * (i / 10));
  for (let i = 10; i >= 0; i--) ctx.lineTo(x + i * 6 * sc, y - 100 * sc + Math.sin(t * 6 + i * .6) * 4 * sc * (i / 10));
  ctx.fill(); ctx.shadowBlur = 0;
}
function rope(points, color = '#cdbb9a', w = 5) {
  ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
  ctx.stroke();
}
// cuerda colgante entre dos puntos con caída (sag)
function sagRope(a, b, sag = 30, color, w) {
  const pts = []; for (let i = 0; i <= 16; i++) { const p = i / 16; pts.push({ x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p) + Math.sin(Math.PI * p) * sag }); }
  rope(pts, color, w);
}
function coin(x, y, r = 12, t = 0) {
  const sx = Math.abs(Math.cos(t * 6));
  ctx.save(); ctx.translate(x, y); ctx.scale(Math.max(.15, sx), 1);
  ctx.fillStyle = '#ffc93c'; ctx.shadowColor = '#ffb400'; ctx.shadowBlur = 16;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#c99400'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, r * .7, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
}
function hourglass(x, y, p, sc = 1) { // p = 0 lleno arriba → 1 vacío
  ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc);
  ctx.strokeStyle = '#ccc'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(-30, -60); ctx.lineTo(30, -60); ctx.lineTo(4, 0); ctx.lineTo(30, 60); ctx.lineTo(-30, 60); ctx.lineTo(-4, 0); ctx.closePath(); ctx.stroke();
  ctx.fillStyle = '#ff3b36'; ctx.shadowColor = '#ff3b36'; ctx.shadowBlur = 14;
  const top = 1 - p; ctx.beginPath(); ctx.moveTo(-26 * top, -4 - 52 * top); ctx.lineTo(26 * top, -4 - 52 * top); ctx.lineTo(0, -2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-28, 57); ctx.lineTo(28, 57); ctx.lineTo(0, 57 - 50 * p); ctx.fill();
  if (p < 1) ctx.fillRect(-1, -2, 2, 58);
  ctx.restore();
}
function box(x, y, w = 50, h = 40, color = '#b08a5a') { // y = base
  ctx.fillStyle = color; ctx.fillRect(x - w / 2, y - h, w, h);
  ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(x - w / 2, y - h * .55, w, 4);
  ctx.fillStyle = 'rgba(255,255,255,.15)'; ctx.fillRect(x - w / 2, y - h, w, 4);
}
// mochila pegada a la espalda de una figura resuelta; size crece con la carga
function backpack(sl, size = 1, color = '#8a7f72') {
  const bx = lerp(sl.hip.x, sl.sh.x, .55) - sl.dir * (16 + 10 * size) * sl.s, by = lerp(sl.hip.y, sl.sh.y, .55);
  ctx.save(); ctx.translate(bx, by); ctx.rotate(Math.atan2(sl.sh.x - sl.hip.x, sl.hip.y - sl.sh.y));
  ctx.fillStyle = color; const w = 26 * size * sl.s, h = 40 * Math.sqrt(size) * sl.s;
  ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 8); ctx.fill(); ctx.restore();
}
// perro pictograma: x,y = suelo; phase = ciclo de patas; tail = movimiento de cola
function dog(x, phase = 0, o = {}) {
  const s = o.s || 1, dir = o.dir || 1, y = o.y ?? FLOOR, col = o.color || '#ffffff', sitAmt = o.sit || 0;
  ctx.save(); ctx.translate(x, y); ctx.scale(dir * s, s);
  ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineCap = 'round'; ctx.lineWidth = 12;
  ctx.shadowColor = 'rgba(255,255,255,.3)'; ctx.shadowBlur = 14;
  const by = -46 + sitAmt * 8, bodyBack = -34, bodyFront = 26;
  const legs = [[bodyFront, 0], [bodyFront - 10, .5], [bodyBack + 8, .5], [bodyBack, 0]];
  legs.forEach(([lx, off], i) => {
    const sw = Math.sin((phase + off) * Math.PI * 2) * 12 * (o.moving ?? 1);
    const back = i >= 2; const ly = back ? lerp(by, -8, sitAmt) : by;
    ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx + sw * (1 - sitAmt) + (back ? 14 * sitAmt : 0), 0); ctx.stroke();
  });
  ctx.lineWidth = 22;
  ctx.beginPath(); ctx.moveTo(bodyBack, lerp(by, -14, sitAmt)); ctx.lineTo(bodyFront, by); ctx.stroke();
  ctx.beginPath(); ctx.arc(bodyFront + 18, by - 22, 14, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(bodyFront + 32, by - 17, 9, 6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(bodyFront + 10, by - 30, 6, 11, -.6, 0, Math.PI * 2); ctx.fill();
  ctx.lineWidth = 7; const tw = Math.sin((o.tail ?? phase * 3) * Math.PI * 2) * .5;
  ctx.beginPath(); ctx.moveTo(bodyBack - 2, lerp(by, -14, sitAmt) - 2); ctx.lineTo(bodyBack - 22, lerp(by, -14, sitAmt) - 20 + tw * 18); ctx.stroke();
  ctx.restore();
}
// globo de pensamiento con icono: icon = (cx, cy) => {dibuja}
function bubble(x, y, sc, a, icon) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.scale(sc, sc);
  ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(0, 0, 54, 42, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  for (const [dx, dy, r] of [[-30, 50, 9], [-44, 70, 5]]) { ctx.beginPath(); ctx.arc(dx, dy, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
  if (icon) icon(0, 0);
  ctx.restore();
}
// partículas que explotan desde (x,y) a partir de t0 — color "r,g,b"
function burst(x, y, t, t0, o = {}) {
  const dt = t - t0, life = o.life || 1.2; if (dt < 0 || dt > life) return;
  const g = rng(o.seed || 9), n = o.n || 26, col = o.color || '255,60,50';
  for (let i = 0; i < n; i++) {
    const a = g() * Math.PI * 2, sp = (o.speed || 260) * (.4 + g() * .8), r = (o.size || 4) * (.5 + g());
    const px = x + Math.cos(a) * sp * dt, py = y + Math.sin(a) * sp * dt + 300 * dt * dt * (o.gravity ?? 1);
    ctx.fillStyle = `rgba(${col},${(1 - dt / life) * .9})`;
    ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.fill();
  }
}
// anillo de onda expansiva
function ring(x, y, t, t0, o = {}) {
  const dt = t - t0, life = o.life || .8; if (dt < 0 || dt > life) return;
  const p = dt / life;
  ctx.strokeStyle = `rgba(${o.color || '255,255,255'},${(1 - p) * .7})`; ctx.lineWidth = (o.width || 6) * (1 - p);
  ctx.beginPath(); ctx.ellipse(x, y, (o.r || 160) * easeOut(p), (o.r || 160) * easeOut(p) * (o.flat || 1), 0, 0, Math.PI * 2); ctx.stroke();
}
// rayos de luz
function rays(x, y, t, a = 1, color = '255,60,50', n = 14, len = 700) {
  if (a <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(t * .08);
  for (let i = 0; i < n; i++) {
    ctx.rotate(Math.PI * 2 / n);
    const g = ctx.createLinearGradient(0, 0, len, 0);
    g.addColorStop(0, `rgba(${color},${.16 * a})`); g.addColorStop(1, `rgba(${color},0)`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(len, -len * .06); ctx.lineTo(len, len * .06); ctx.fill();
  }
  ctx.restore();
}
// cadena / grillete
function chain(a, b, color = '#9a9a9a') {
  const n = Math.max(2, Math.floor(Math.hypot(b.x - a.x, b.y - a.y) / 14));
  ctx.strokeStyle = color; ctx.lineWidth = 3;
  for (let i = 0; i < n; i++) {
    const p = (i + .5) / n, x = lerp(a.x, b.x, p), y = lerp(a.y, b.y, p) + Math.sin(Math.PI * p) * 10;
    ctx.beginPath(); ctx.ellipse(x, y, 8, 5, Math.atan2(b.y - a.y, b.x - a.x) + (i % 2) * 1.2, 0, Math.PI * 2); ctx.stroke();
  }
}
// casa simple (contorno) con ventana iluminada
function house(x, y = FLOOR, w = 160, h = 130, light = 1, color = '#6a6a6a') {
  ctx.strokeStyle = color; ctx.lineWidth = 6; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(x - w / 2, y); ctx.lineTo(x - w / 2, y - h); ctx.lineTo(x, y - h - w * .45); ctx.lineTo(x + w / 2, y - h); ctx.lineTo(x + w / 2, y); ctx.stroke();
  ctx.fillStyle = `rgba(255,220,150,${.85 * light})`; ctx.shadowColor = '#ffcc66'; ctx.shadowBlur = 30 * light;
  ctx.fillRect(x - 22, y - h + 26, 44, 40); ctx.shadowBlur = 0;
}
// silla de ruedas simple
function wheelchair(x, y = FLOOR, dir = 1, rot = 0) {
  ctx.strokeStyle = '#aaa'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.arc(x, y - 34, 34, 0, Math.PI * 2); ctx.stroke();
  ctx.save(); ctx.translate(x, y - 34); ctx.rotate(rot);
  for (let i = 0; i < 3; i++) { ctx.rotate(Math.PI / 3); ctx.beginPath(); ctx.moveTo(-30, 0); ctx.lineTo(30, 0); ctx.stroke(); }
  ctx.restore();
  ctx.beginPath(); ctx.arc(x + 46 * dir, y - 8, 8, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x - 20 * dir, y - 56); ctx.lineTo(x + 30 * dir, y - 56); ctx.lineTo(x + 46 * dir, y - 14);
  ctx.moveTo(x - 20 * dir, y - 56); ctx.lineTo(x - 26 * dir, y - 120); ctx.stroke();
}

// ───────────── escenario ─────────────
const dust = (() => { const r = rng(5); return Array.from({ length: 60 }, () => ({ x: r() * W, y: r() * H, s: .6 + r() * 1.6, v: 5 + r() * 12, ph: r() * 6 })); })();
const marks = (() => { const r = rng(11); return Array.from({ length: 46 }, () => ({ x: r() * 1400, z: r(), w: 6 + r() * 30 })); })();

// Título: "*palabra*" va en rojo. Aparece palabra por palabra con rebote.
function drawTitle(text, t, a) {
  if (!text || a <= 0) return;
  ctx.save();
  ctx.font = '900 52px Montserrat, sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  try { ctx.letterSpacing = '1px'; } catch (e) {}
  let red = false;
  const words = text.split(' ').map(w => {
    const startsRed = w.startsWith('*'), out = { txt: w.replace(/\*/g, '') };
    if (startsRed) red = true;
    out.red = red;
    if (w.replace(/[.,!?¿¡…]+$/, '').endsWith('*')) red = false;
    return out;
  });
  // líneas balanceadas (ancho parecido) de máximo ~610px
  const total = ctx.measureText(words.map(w => w.txt).join(' ')).width;
  const target = total / Math.ceil(total / 610);
  const lines = [[]]; let lw = 0;
  for (const w of words) {
    const ww = ctx.measureText(w.txt + ' ').width;
    if (lw > 0 && (lw + ww / 2 > target + 10 || lw + ww > 640)) { lines.push([]); lw = 0; }
    lines[lines.length - 1].push(w); lw += ww;
  }
  const lh = 62, y0 = 150 - (lines.length - 1) * lh / 2;
  let idx = 0;
  lines.forEach((line, li) => {
    const total = line.reduce((s, w) => s + ctx.measureText(w.txt + ' ').width, 0) - ctx.measureText(' ').width;
    let x = W / 2 - total / 2;
    for (const w of line) {
      const ww = ctx.measureText(w.txt).width;
      const appear = prog(t, .15 + idx * .09, .45 + idx * .09);
      if (appear > 0) {
        const sc = lerp(1.6, 1, backOut(appear));
        ctx.save(); ctx.globalAlpha = a * clamp(appear * 2);
        ctx.translate(x + ww / 2, y0 + li * lh); ctx.scale(sc, sc);
        ctx.shadowColor = w.red ? 'rgba(255,40,40,.9)' : 'rgba(0,0,0,.9)'; ctx.shadowBlur = w.red ? 22 : 12;
        ctx.fillStyle = w.red ? '#ff3b36' : '#ffffff';
        ctx.fillText(w.txt, 0, 0);
        ctx.restore();
      }
      x += ctx.measureText(w.txt + ' ').width; idx++;
    }
  });
  ctx.restore();
}

/* Escena (window.SCENE):
   { id, title, duration,
     camera(t) → {x, y, zoom, shake?},       // centro del mundo que se ve y zoom (≈1.6–2.2)
     backdrop(t)   → dibuja detrás del horizonte (sol, luna, nubes lejanas) [opcional]
     world(t, refl) → dibuja utilería y figuras (refl=true cuando dibuja el reflejo) [requerido]
     front(t)  → dibuja encima de todo en el mundo (partículas, lluvia) [opcional]
     scroll(t) → distancia recorrida para marcas del piso (cámara "acompaña") [opcional]
     sky(t)    → 0..1 tinte rojo del cielo [opcional]
     spot      → {x, r} foco de luz en el piso [opcional]
     flashes: [t...] destellos blancos, blackouts: [t...] parpadeos negros [opcional]
     events() → [{t, type, ...}] sonidos sincronizados; music: {...} (ver audio.py) }  */
// textura de piso (asfalto/grietas sutiles), generada una vez
const floorTex = (() => {
  const c = document.createElement('canvas'); c.width = 1600; c.height = 420;
  const g = c.getContext('2d'), r = rng(21);
  for (let i = 0; i < 9000; i++) { const v = r(); g.fillStyle = v > .5 ? `rgba(255,255,255,${.03 * r()})` : `rgba(0,0,0,${.25 * r()})`; g.fillRect(r() * 1600, r() * 420, 1 + r() * 2.5, 1 + r() * 1.2); }
  g.strokeStyle = 'rgba(0,0,0,.45)'; g.lineWidth = 1.2;
  for (let k = 0; k < 26; k++) {
    let x = r() * 1600, y = r() * 420; g.beginPath(); g.moveTo(x, y);
    for (let j = 0; j < 8; j++) { x += (r() - .5) * 90; y += (r() - .3) * 26; g.lineTo(x, y); }
    g.stroke();
  }
  return c;
})();

// dibuja el mundo (sin post-proceso) en el instante t — coordenadas lógicas 720x1280
function drawScene(t) {
  const S = window.SCENE;
  ctx.setTransform(SC, 0, 0, SC, 0, 0); ctx.globalAlpha = 1;
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  const skyA = S.sky ? S.sky(t) : 0;
  if (skyA > 0) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, `rgba(20,4,4,${.3 * skyA})`); g.addColorStop(.6, `rgba(60,10,9,${.4 * skyA})`); g.addColorStop(.75, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
  const cam = S.camera ? S.camera(t) : { x: 360, y: FLOOR - 180, zoom: 1.8 };
  const shake = cam.shake || 0, g0 = rng(1 + Math.floor(t * 60));
  ctx.save();
  ctx.translate(W / 2 + (g0() - .5) * shake * 20, H / 2 + (g0() - .5) * shake * 20);
  ctx.scale(cam.zoom, cam.zoom); ctx.translate(-cam.x, -cam.y);

  if (S.backdrop) S.backdrop(t);
  ctx.fillStyle = '#000'; ctx.fillRect(-2000, FLOOR, 4720, 2000);
  const spot = S.spot ? (typeof S.spot === 'function' ? S.spot(t) : S.spot) : { x: 360, r: 380 };
  if (S.scroll) {
    const d = S.scroll(t);
    for (const m of marks) {
      const y = FLOOR + 6 + m.z * m.z * 260, k = .4 + m.z * 1.4;
      const x = ((m.x - d * k) % 1400 + 1400) % 1400 - 340;
      ctx.fillStyle = `rgba(255,255,255,${.05 + .07 * (1 - m.z)})`; ctx.fillRect(x, y, m.w * k, 1.4 + m.z * 1.5);
    }
  }
  if (S.reflection !== false) {
    ctx.save(); ctx.translate(0, FLOOR * 2); ctx.scale(1, -1); ctx.globalAlpha = .2;
    S.world(t, true); ctx.restore();
    const g = ctx.createLinearGradient(0, FLOOR, 0, FLOOR + 320);
    g.addColorStop(0, 'rgba(0,0,0,.05)'); g.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.fillStyle = g; ctx.fillRect(-2000, FLOOR, 4720, 2000);
  }
  // piso con textura que se desvanece con la distancia al foco
  {
    const off = S.scroll ? ((S.scroll(t) % 800) + 800) % 800 : 0;
    ctx.save(); ctx.beginPath(); ctx.rect(-2000, FLOOR, 4720, 420); ctx.clip();
    ctx.globalAlpha = .7; ctx.drawImage(floorTex, spot.x - 800 - off, FLOOR); ctx.drawImage(floorTex, spot.x + 800 - off, FLOOR);
    ctx.restore();
    const g = ctx.createRadialGradient(spot.x, FLOOR, 10, spot.x, FLOOR, spot.r * 1.25);
    g.addColorStop(0, `rgba(42,42,44,${spot.a !== undefined ? spot.a * 4 : .45})`); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(spot.x, FLOOR); ctx.scale(1, .32); ctx.translate(-spot.x, -FLOOR);
    ctx.fillStyle = g; ctx.fillRect(spot.x - spot.r * 1.3, FLOOR - spot.r * 1.3, spot.r * 2.6, spot.r * 2.6); ctx.restore();
  }
  const fl = ctx.createLinearGradient(-400, 0, W + 400, 0);
  fl.addColorStop(0, 'rgba(255,255,255,0)'); fl.addColorStop(.5, 'rgba(255,255,255,.14)'); fl.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = fl; ctx.fillRect(-400, FLOOR, W + 800, 1.5);
  // haz de luz cenital (teatral)
  const beam = S.beam === false ? null : (typeof S.beam === 'function' ? S.beam(t) : (S.beam || { x: spot.x, a: .05, w: 150 }));
  if (beam && beam.a > 0) {
    const top = FLOOR - 1300, bw = beam.w || 200;
    const g = ctx.createLinearGradient(0, top, 0, FLOOR);
    g.addColorStop(0, `rgba(255,255,255,${beam.a * .2})`); g.addColorStop(1, `rgba(255,255,255,${beam.a})`);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(beam.x - bw * .3, top); ctx.lineTo(beam.x + bw * .3, top); ctx.lineTo(beam.x + bw, FLOOR); ctx.lineTo(beam.x - bw, FLOOR); ctx.fill();
    ctx.restore();
  }
  ctx.globalAlpha = 1;
  S.world(t, false);
  if (S.front) S.front(t);
  ctx.restore();
}

// canvases auxiliares: acumulación (desenfoque de movimiento) y bloom
const acc = document.createElement('canvas'); acc.width = cv.width; acc.height = cv.height;
const actx = acc.getContext('2d');
const blm = document.createElement('canvas'); blm.width = cv.width / 4; blm.height = cv.height / 4;
const bctx = blm.getContext('2d');

// render final: samples = sub-cuadros para desenfoque de movimiento (1 en vista previa)
function render(t, samples = 1) {
  const S = window.SCENE, D = S.duration;
  if (samples > 1) {
    const shutter = .5 / FPS; // obturador de 180°
    for (let i = 0; i < samples; i++) {
      drawScene(t + (i / (samples - 1) - .5) * shutter);
      actx.globalAlpha = 1 / (i + 1); actx.drawImage(cv, 0, 0);
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.drawImage(acc, 0, 0);
  } else drawScene(t);

  // bloom: copia reducida y desenfocada sumada encima
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  bctx.filter = 'brightness(.75) contrast(2.4) blur(7px)'; bctx.globalAlpha = 1; bctx.clearRect(0, 0, blm.width, blm.height);
  bctx.drawImage(cv, 0, 0, blm.width, blm.height); bctx.filter = 'none';
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .3; ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(blm, 0, 0, cv.width, cv.height); ctx.restore();

  ctx.setTransform(SC, 0, 0, SC, 0, 0);
  for (const p of dust) {
    const y = ((p.y - t * p.v) % H + H) % H, x = ((p.x + Math.sin(t * .7 + p.ph) * 8) % W + W) % W;
    ctx.fillStyle = `rgba(255,255,255,${.05 + .07 * Math.sin(t * 2 + p.ph) ** 2})`;
    ctx.beginPath(); ctx.arc(x, y, p.s, 0, Math.PI * 2); ctx.fill();
  }
  const v = ctx.createRadialGradient(W / 2, H * .55, H * .2, W / 2, H * .55, H * .8);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.9)');
  ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  const gr = rng(1 + Math.floor(t * FPS));
  ctx.fillStyle = 'rgba(255,255,255,.03)';
  for (let i = 0; i < 1400; i++) ctx.fillRect(gr() * W, gr() * H, 1.2, 1.2);

  let flash = 0, black = 0;
  for (const f of S.flashes || []) flash = Math.max(flash, .7 * pulse(t, f, .12));
  for (const b of S.blackouts || []) black = Math.max(black, .6 * pulse(t, b, .1));
  if (flash > 0) { ctx.fillStyle = `rgba(255,255,255,${flash})`; ctx.fillRect(0, 0, W, H); }

  drawTitle(S.title, t, 1 - smooth(prog(t, D - 1.1, D - .4)));

  const fade = Math.max(1 - smooth(prog(t, 0, .35)), smooth(prog(t, D - 1, D)), black);
  if (fade > 0) { ctx.fillStyle = `rgba(0,0,0,${fade})`; ctx.fillRect(0, 0, W, H); }
}

// detector de pasos para el audio: sampler(t) → [{phi, size, moving}] por caminante
function footsteps(duration, sampler, o = {}) {
  const ev = [], dt = 1 / 240; let prev = null;
  for (let t = 0; t < duration; t += dt) {
    const cur = sampler(t);
    if (prev) cur.forEach((c, i) => {
      if (c && prev[i] && c.moving !== false && Math.floor(c.phi * 2) !== Math.floor(prev[i].phi * 2))
        ev.push({ t, type: 'step', size: c.size ?? 1, vol: c.vol ?? 1 });
    });
    prev = cur;
  }
  return ev;
}

window.E = {
  W, H, FPS, FLOOR, ctx, BASE, ARM, LEG, STYLE,
  clamp, lerp, prog, easeInOut, easeOut, easeIn, smooth, backOut, pulse, bump, rng, mixCol, keyed, distance, P, add, lerpP,
  solve, mix, poseAt, stand, walk, run, sit, kneel, crouch, lie, sad, cheer, holdPoint, shoulderOf, headOf,
  figure, mixStyle, limb, hand,
  glowCircle, sun, moon, phone, heart, cane, brick, wall, stone, rain, cloud, umbrella, flame, candle, tree, sprout, ball, chair, table,
  door, pit, flag, rope, sagRope, coin, hourglass, box, backpack, dog, bubble, burst, ring, rays, chain, house, wheelchair,
  render, footsteps, drawTitle,
};
})();
