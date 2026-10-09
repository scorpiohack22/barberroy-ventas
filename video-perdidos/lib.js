// Librería de dibujo para "Perdidos": cartoon estilo años 30 (rubber hose) en blanco y negro.
// Personajes con extremidades de goma, ojos de pastel, guantes y zapatones; efecto de película antigua.
(function () {
  const INK = '#151312';
  const PAPEL = '#f1ece0';

  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const inv = (a, b, v) => clamp((v - a) / (b - a));
  const ease = t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const easeIn = t => t * t * t;
  const backOut = t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
  const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  function rrect(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  // ---------- capa de color: lo que se dibuja aquí sobrevive al virado sepia ----------
  let COLA = [];
  function enColor(ctx, fn) { COLA.push({ m: ctx.getTransform(), a: ctx.globalAlpha, fn }); }
  function vaciarColor(ctx) {
    for (const c of COLA) { ctx.save(); ctx.setTransform(c.m); ctx.globalAlpha = c.a; c.fn(ctx); ctx.restore(); }
    COLA = [];
  }

  // ---------- personajes ----------
  const TIPOS = {
    adulto: { pierna: 60, torso: 54, ancho: 42, cabeza: 27, brazo: 54 },
    alto: { pierna: 76, torso: 62, ancho: 32, cabeza: 24, brazo: 64 },
    gordo: { pierna: 44, torso: 60, ancho: 66, cabeza: 28, brazo: 50 },
    dama: { pierna: 64, torso: 46, ancho: 34, cabeza: 26, brazo: 52 },
    nino: { pierna: 34, torso: 36, ancho: 36, cabeza: 35, brazo: 36 },
    viejo: { pierna: 50, torso: 50, ancho: 40, cabeza: 26, brazo: 50 },
  };
  const GRISES = ['#ffffff', '#d8d4cc', '#a9a49b', '#77736c', '#4a4743', '#2a2826'];

  function nuevoToon(r, tipo) {
    tipo = tipo || pick(r, ['adulto', 'adulto', 'alto', 'gordo', 'dama', 'dama']);
    return {
      tipo,
      cuerpo: pick(r, GRISES.slice(0, 5)),
      pantalon: pick(r, ['#2a2826', '#4a4743', '#77736c', '#1d1b1a']),
      rayas: r() < 0.25,
      pelo: tipo === 'dama' ? pick(r, ['moño', 'melena', 'rizos']) : pick(r, ['raya', 'calvo', 'tupe', 'gorra', 'sombrero', 'raya']),
      nariz: pick(r, ['bola', 'bola', 'larga', 'chata']),
      gafas: r() < 0.15,
      bigote: tipo !== 'dama' && r() < 0.2,
    };
  }
  const NINO = { tipo: 'nino', cuerpo: '#ffffff', pantalon: '#2a2826', rayas: false, pelo: 'nino', nariz: 'chata', gafas: false, bigote: false, tirantes: true };

  // Manguera de goma: curva cuadrática con grosor constante, contorno negro y relleno.
  function manguera(ctx, x1, y1, x2, y2, curva, ancho, color) {
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, dx = x2 - x1, dy = y2 - y1, d = Math.hypot(dx, dy) || 1;
    const cx = mx - (dy / d) * curva, cy = my + (dx / d) * curva;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo(cx, cy, x2, y2);
    ctx.strokeStyle = INK; ctx.lineWidth = ancho + 5; ctx.stroke();
    if (color !== INK) { ctx.strokeStyle = color; ctx.lineWidth = ancho; ctx.stroke(); }
    // dirección final (para orientar guantes y zapatos)
    return Math.atan2(y2 - cy, x2 - cx);
  }

  // Guante blanco de cartoon (dedos gordos, puño enrollado). Coordenadas locales: x hacia los dedos.
  function guante(ctx, x, y, ang, tipo, escala = 1) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(escala, escala);
    ctx.fillStyle = '#fbf8f0'; ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.lineJoin = 'round';
    // puño
    ctx.beginPath(); ctx.ellipse(-2, 0, 5, 9, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-3, -6); ctx.lineTo(-3, 6); ctx.stroke();
    if (tipo === 'abierta') {
      for (let k = 0; k < 3; k++) { const a = -0.35 + k * 0.35; ctx.beginPath(); ctx.ellipse(10 + Math.cos(a) * 9, Math.sin(a) * 9, 7.5, 4.6, a, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
      ctx.beginPath(); ctx.ellipse(6, -10, 6, 4, -1.1, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(7, 0, 8, 9, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    } else if (tipo === 'señala') {
      ctx.beginPath(); ctx.ellipse(7, 1, 8, 8, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(17, -3, 9, 4, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(6, -8, 5, 3.5, -0.9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    } else {
      // puño cerrado / agarrando
      ctx.beginPath(); ctx.ellipse(7, 0, 9, 9.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(9, -5); ctx.quadraticCurveTo(14, -4, 15, -1); ctx.moveTo(9, 0); ctx.quadraticCurveTo(14, 1, 15, 3); ctx.moveTo(9, 5); ctx.quadraticCurveTo(13, 6, 14, 7); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(6, -9, 5, 3.6, -0.8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
    ctx.restore();
  }

  function zapato(ctx, x, y, ang, escala) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
    ctx.fillStyle = INK; ctx.strokeStyle = INK; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-8 * escala, -4); ctx.bezierCurveTo(-10 * escala, 8, 4 * escala, 10, 22 * escala, 9); ctx.bezierCurveTo(30 * escala, 8, 30 * escala, -6, 18 * escala, -8); ctx.bezierCurveTo(8 * escala, -10, 0, -9, -8 * escala, -4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fbf8f0'; ctx.beginPath(); ctx.ellipse(18 * escala, -3, 4 * escala, 2.2, -0.3, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  // Teléfono con pantalla brillante (la pantalla va en la capa de color).
  function telefono(ctx, x, y, ang, color = '#59c7ff', flash = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
    ctx.fillStyle = INK; rrect(ctx, -7, -12, 14, 24, 3); ctx.fill();
    enColor(ctx, c => {
      c.shadowColor = color; c.shadowBlur = 18; c.fillStyle = color; c.fillRect(-5, -10, 10, 19); c.shadowBlur = 0;
      c.fillStyle = 'rgba(255,255,255,0.55)'; c.fillRect(-4, -9, 8, 3);
      if (flash > 0) { const g = c.createRadialGradient(0, 0, 2, 0, 0, 90); g.addColorStop(0, `rgba(255,255,255,${flash})`); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, 90, 0, 7); c.fill(); }
    });
    ctx.restore();
  }

  function cabeza(ctx, R, p, o) {
    const mood = o.mood || 'neutral', lx = o.lookX ?? 0.35, ly = o.lookY ?? 0;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    // pelo trasero
    if (p.pelo === 'melena') { ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(-R * 0.35, R * 0.3, R * 0.75, R * 1.05, 0.15, 0, Math.PI * 2); ctx.fill(); }
    if (p.pelo === 'moño') { ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(-R * 0.55, -R * 0.85, R * 0.4, 0, Math.PI * 2); ctx.fill(); }
    // oreja
    ctx.fillStyle = PAPEL; ctx.strokeStyle = INK; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(-R * 0.5, R * 0.05, R * 0.2, R * 0.27, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    // cara
    ctx.beginPath();
    ctx.moveTo(-R * 0.85, -R * 0.2);
    ctx.bezierCurveTo(-R * 0.95, -R * 1.05, R * 0.55, -R * 1.2, R * 0.92, -R * 0.35);
    ctx.bezierCurveTo(R * 1.12, R * 0.2, R * 1.0, R * 0.85, R * 0.35, R * 0.98);
    ctx.bezierCurveTo(-R * 0.25, R * 1.08, -R * 0.82, R * 0.75, -R * 0.85, -R * 0.2);
    ctx.closePath(); ctx.fillStyle = PAPEL; ctx.fill(); ctx.stroke();
    // pelo superior
    ctx.fillStyle = INK;
    const pelo = p.pelo;
    if (pelo === 'nino') {
      ctx.beginPath(); ctx.moveTo(-R * 0.88, -R * 0.1); ctx.bezierCurveTo(-R * 1.0, -R * 1.15, R * 0.6, -R * 1.25, R * 0.9, -R * 0.4);
      ctx.bezierCurveTo(R * 0.5, -R * 0.62, R * 0.2, -R * 0.55, R * 0.05, -R * 0.75); ctx.bezierCurveTo(-R * 0.1, -R * 0.5, -R * 0.4, -R * 0.45, -R * 0.55, -R * 0.1); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(R * 0.0, -R * 1.02); ctx.quadraticCurveTo(R * 0.15, -R * 1.45, R * 0.45, -R * 1.35); ctx.quadraticCurveTo(R * 0.2, -R * 1.25, R * 0.25, -R * 1.0); ctx.fill();
    } else if (pelo === 'raya' || pelo === 'tupe') {
      ctx.beginPath(); ctx.moveTo(-R * 0.88, -R * 0.05); ctx.bezierCurveTo(-R * 1.0, -R * 1.1, R * 0.5, -R * 1.25, R * 0.85, -R * 0.55);
      ctx.bezierCurveTo(R * 0.4, -R * 0.72, -R * 0.1, -R * 0.62, -R * 0.45, -R * 0.35); ctx.lineTo(-R * 0.6, -R * 0.05); ctx.closePath(); ctx.fill();
      if (pelo === 'tupe') { ctx.beginPath(); ctx.ellipse(R * 0.35, -R * 0.95, R * 0.5, R * 0.28, -0.3, 0, Math.PI * 2); ctx.fill(); }
      ctx.strokeStyle = PAPEL; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-R * 0.5, -R * 0.75); ctx.quadraticCurveTo(0, -R * 0.95, R * 0.4, -R * 0.82); ctx.stroke();
    } else if (pelo === 'calvo') {
      ctx.beginPath(); ctx.ellipse(-R * 0.72, -R * 0.15, R * 0.18, R * 0.35, 0.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(0, -R * 0.75, R * 0.25, R * 0.1, -0.2, 0, Math.PI * 2); ctx.fill();
    } else if (pelo === 'gorra') {
      ctx.beginPath(); ctx.ellipse(-R * 0.05, -R * 0.7, R * 0.95, R * 0.55, 0, Math.PI, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(R * 0.7, -R * 0.68, R * 0.6, R * 0.13, 0.05, 0, Math.PI * 2); ctx.fill();
    } else if (pelo === 'sombrero') {
      ctx.beginPath(); ctx.ellipse(0, -R * 0.75, R * 1.15, R * 0.18, -0.05, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); rrect(ctx, -R * 0.62, -R * 1.45, R * 1.2, R * 0.75, R * 0.2); ctx.fill();
      ctx.fillStyle = '#77736c'; ctx.fillRect(-R * 0.62, -R * 0.95, R * 1.2, R * 0.15);
    } else if (pelo === 'melena' || pelo === 'moño' || pelo === 'rizos') {
      ctx.beginPath(); ctx.moveTo(-R * 0.9, R * 0.2); ctx.bezierCurveTo(-R * 1.05, -R * 1.15, R * 0.6, -R * 1.3, R * 0.95, -R * 0.45);
      ctx.bezierCurveTo(R * 0.55, -R * 0.7, R * 0.1, -R * 0.7, -R * 0.2, -R * 0.4); ctx.bezierCurveTo(-R * 0.45, -R * 0.2, -R * 0.55, R * 0.05, -R * 0.6, R * 0.3); ctx.closePath(); ctx.fill();
      if (pelo === 'rizos') for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.arc(-R * 0.75 + k * R * 0.3, -R * 0.9 + Math.sin(k) * R * 0.1, R * 0.22, 0, Math.PI * 2); ctx.fill(); }
      // lazo
      ctx.fillStyle = '#fbf8f0'; ctx.strokeStyle = INK; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.ellipse(-R * 0.25, -R * 1.0, R * 0.22, R * 0.14, -0.6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(-R * 0.6, -R * 0.8, R * 0.22, R * 0.14, 0.6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
    // ojos de pastel
    const ojo = (ex, ey, rx, ry) => {
      ctx.fillStyle = '#fff'; ctx.strokeStyle = INK; ctx.lineWidth = 2.6;
      ctx.beginPath(); ctx.ellipse(ex, ey, rx, ry, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      if (mood === 'risa' || o.blink) { ctx.fillStyle = PAPEL; ctx.fill(); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(ex, ey + ry * 0.3, rx * 0.8, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke(); return; }
      const px = ex + lx * rx * 0.45, py = ey + ly * ry * 0.45 + ry * 0.12;
      ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(px, py, rx * 0.55, ry * 0.62, 0, 0, Math.PI * 2); ctx.fill();
      // corte de pastel
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(px + rx * 0.05, py - ry * 0.05); ctx.lineTo(px + rx * 0.32, py - ry * 0.62); ctx.lineTo(px + rx * 0.58, py - ry * 0.3); ctx.closePath(); ctx.fill();
      if (mood === 'hipno' || mood === 'triste' || mood === 'cansado') {
        ctx.fillStyle = PAPEL; ctx.strokeStyle = INK; ctx.lineWidth = 2.6;
        ctx.beginPath(); ctx.ellipse(ex, ey, rx + 0.5, ry + 0.5, 0, Math.PI, Math.PI * 2); ctx.lineTo(ex + rx, ey + (mood === 'hipno' ? ry * 0.1 : -ry * 0.1)); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(ex - rx, ey + (mood === 'triste' ? -ry * 0.25 : 0)); ctx.lineTo(ex + rx, ey + (mood === 'triste' ? ry * 0.05 : 0)); ctx.stroke();
      }
    };
    const big = mood === 'susto' ? 1.18 : 1;
    ojo(R * 0.18, -R * 0.18, R * 0.2 * big, R * 0.33 * big);
    ojo(R * 0.62, -R * 0.16, R * 0.17 * big, R * 0.3 * big);
    if (p.gafas) { ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(R * 0.18, -R * 0.15, R * 0.3, 0, 7); ctx.moveTo(R * 0.92, -R * 0.13); ctx.arc(R * 0.62, -R * 0.13, R * 0.27, 0, 7); ctx.moveTo(-R * 0.12, -R * 0.15); ctx.lineTo(-R * 0.45, -R * 0.08); ctx.stroke(); }
    // cejas
    ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath();
    const cy = -R * 0.6;
    if (mood === 'triste') { ctx.moveTo(R * 0.02, cy + R * 0.05); ctx.lineTo(R * 0.34, cy - R * 0.08); ctx.moveTo(R * 0.48, cy - R * 0.08); ctx.lineTo(R * 0.78, cy + R * 0.04); }
    else if (mood === 'susto') { ctx.moveTo(R * 0.02, cy - R * 0.12); ctx.quadraticCurveTo(R * 0.18, cy - R * 0.24, R * 0.34, cy - R * 0.12); ctx.moveTo(R * 0.48, cy - R * 0.12); ctx.quadraticCurveTo(R * 0.62, cy - R * 0.22, R * 0.78, cy - R * 0.1); }
    else if (mood === 'enfado') { ctx.moveTo(R * 0.02, cy - R * 0.06); ctx.lineTo(R * 0.34, cy + R * 0.06); ctx.moveTo(R * 0.48, cy + R * 0.06); ctx.lineTo(R * 0.78, cy - R * 0.06); }
    ctx.stroke();
    // nariz
    ctx.fillStyle = INK;
    if (p.nariz === 'larga') { ctx.beginPath(); ctx.ellipse(R * 1.05, R * 0.18, R * 0.32, R * 0.15, 0.25, 0, Math.PI * 2); ctx.fill(); }
    else if (p.nariz === 'chata') { ctx.beginPath(); ctx.ellipse(R * 0.98, R * 0.12, R * 0.14, R * 0.11, 0, 0, Math.PI * 2); ctx.fill(); }
    else { ctx.beginPath(); ctx.ellipse(R * 0.98, R * 0.14, R * 0.22, R * 0.18, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(R * 0.93, R * 0.07, R * 0.06, R * 0.035, -0.4, 0, Math.PI * 2); ctx.fill();
    if (p.bigote) { ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(R * 0.62, R * 0.38, R * 0.32, R * 0.1, -0.1, 0, Math.PI * 2); ctx.fill(); }
    // boca
    ctx.strokeStyle = INK; ctx.lineWidth = 3;
    const mx = R * 0.55, my = R * 0.52;
    ctx.beginPath();
    if (mood === 'feliz' || mood === 'risa') {
      ctx.moveTo(mx - R * 0.35, my - R * 0.08); ctx.quadraticCurveTo(mx, my + R * 0.42, mx + R * 0.35, my - R * 0.12); ctx.closePath();
      ctx.fillStyle = INK; ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#8c8680'; ctx.beginPath(); ctx.ellipse(mx, my + R * 0.18, R * 0.14, R * 0.07, 0, 0, Math.PI * 2); ctx.fill();
    } else if (mood === 'triste') { ctx.moveTo(mx - R * 0.25, my + R * 0.12); ctx.quadraticCurveTo(mx, my - R * 0.08, mx + R * 0.25, my + R * 0.1); ctx.stroke(); }
    else if (mood === 'susto' || mood === 'grito') { ctx.fillStyle = INK; ctx.ellipse(mx, my + R * 0.06, R * 0.14, R * 0.2, 0, 0, Math.PI * 2); ctx.fill(); }
    else if (mood === 'hipno') { ctx.fillStyle = INK; ctx.ellipse(mx + R * 0.02, my + R * 0.06, R * 0.09, R * 0.07, 0, 0, Math.PI * 2); ctx.fill(); }
    else if (mood === 'besito') { ctx.fillStyle = INK; ctx.ellipse(R * 0.95, my, R * 0.1, R * 0.12, 0, 0, Math.PI * 2); ctx.fill(); }
    else { ctx.moveTo(mx - R * 0.22, my + R * 0.02); ctx.quadraticCurveTo(mx, my + R * 0.14, mx + R * 0.22, my); ctx.stroke(); }
    if (p.tipo === 'dama') { ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); for (let k = 0; k < 3; k++) { ctx.moveTo(R * 0.3 + k * R * 0.07, -R * 0.48); ctx.lineTo(R * 0.36 + k * R * 0.09, -R * 0.62); } ctx.stroke(); }
    if (o.lagrima) { ctx.fillStyle = '#fff'; ctx.strokeStyle = INK; ctx.lineWidth = 2; const ty = R * (0.1 + (o.lagrima % 1) * 0.8); ctx.beginPath(); ctx.moveTo(R * 0.25, ty - R * 0.14); ctx.quadraticCurveTo(R * 0.36, ty + R * 0.05, R * 0.25, ty + R * 0.08); ctx.quadraticCurveTo(R * 0.14, ty + R * 0.05, R * 0.25, ty - R * 0.14); ctx.fill(); ctx.stroke(); }
  }

  // Personaje rubber hose. Origen en el suelo bajo el cuerpo; mira hacia +x.
  // o: phase, run (0 quieto, 0.5 andar, 1 correr), facing, mood, arms, bob, lookX, lookY, headTilt, lean, screen (color de pantalla), flash.
  function toon(ctx, x, y, s, p, o = {}) {
    const T = TIPOS[p.tipo] || TIPOS.adulto;
    const ph = o.phase || 0, run = o.run || 0, f = o.facing || 1;
    const arms = o.arms || 'swing';
    ctx.save(); ctx.translate(x, y); ctx.scale(s * f, s);
    // sombra
    if (o.shadow !== false) { ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.beginPath(); ctx.ellipse(4, 2, T.ancho * 0.8, 6, 0, 0, Math.PI * 2); ctx.fill(); }
    // piernas
    const L = T.pierna;
    let pies;
    if (o.sentado) pies = [{ x: T.ancho * 0.1 + 26, y: -6, a: 0, c: -18 }, { x: T.ancho * 0.25 + 30, y: -4, a: 0, c: -16 }];
    else {
      const A = run ? lerp(0.35, 0.8, clamp((run - 0.4) / 0.6)) : 0;
      pies = [Math.PI, 0].map(off => {
        const q = ph + off, a = run ? A * Math.sin(q) : (off ? 0.12 : -0.1);
        const lift = run ? Math.max(0, Math.cos(q)) * lerp(0.15, 0.4, run) : 0;
        return { x: Math.sin(a) * L, y: -lift * L * 0.6, a, c: run ? -lift * 30 - 6 : 4 };
      });
    }
    const bob = o.sentado ? 0 : (run ? Math.abs(Math.sin(ph)) * lerp(4, 10, run) : (o.bob || 0) * 6);
    const hipY = o.sentado ? -(o.alturaAsiento ?? 30) : -L + bob * (run ? 1 : 0) - (run ? 0 : 0) ;
    const estira = 1 + (run ? Math.sin(ph * 2) * 0.04 : (o.bob || 0) * 0.05);
    const hip = { x: 0, y: (o.sentado ? hipY : -L - (run ? bob : 0) + (o.bob || 0) * 4) };
    const piernaCol = p.tipo === 'nino' ? INK : p.pantalon;
    const ancho = p.tipo === 'nino' ? 7 : p.tipo === 'gordo' ? 13 : 10;
    const pierna = (i, lejos) => {
      const q = pies[i];
      const hx = (i ? 1 : -1) * T.ancho * 0.18;
      const ang = manguera(ctx, hx, hip.y, q.x, q.y - 8, q.c, ancho, lejos && piernaCol !== INK ? mezclar(piernaCol, '#000000', 0.25) : piernaCol);
      const za = o.sentado ? 0 : (run ? -q.a * 0.6 + (q.y < -2 ? 0.3 : 0) : 0);
      zapato(ctx, q.x, q.y - 4, za, p.tipo === 'nino' ? 0.95 : 1.1);
    };
    // brazos
    const sh = { x: T.ancho * 0.1, y: hip.y - T.torso * estira + 14 };
    const B = T.brazo;
    const poseBrazo = (lejos) => {
      const sw = run ? Math.sin(ph + (lejos ? 0 : Math.PI)) * lerp(0.4, 1.0, run) : 0;
      const w = Math.sin((o.t || 0) * 9) * 0.15;
      switch (arms) {
        case 'phone': return lejos ? { a: 0.4 + sw * 0.3, c: 8, g: 'puño' } : { hx: 36, hy: -B * 0.3, c: -16, g: 'puño', tel: true };
        case 'selfie': return lejos ? { a: 0.55, c: 10, g: 'puño', hips: true } : { hx: 66, hy: -B * 1.15, c: -14, g: 'puño', tel: true, telAng: -0.5 };
        case 'film': return lejos ? { hx: 50, hy: -B * 1.05, c: 12, g: 'puño' } : { hx: 58, hy: -B * 1.15, c: -12, g: 'puño', tel: true, telAng: 0 };
        case 'up': return lejos ? { hx: -8, hy: -B * 1.55, c: 14 + w * 40, g: 'abierta' } : { hx: 22, hy: -B * 1.6, c: -14 - w * 40, g: 'abierta' };
        case 'help': return lejos ? { hx: 40, hy: -B * 0.2, c: -10, g: 'puño' } : { hx: 46, hy: -B * 0.1, c: -12, g: 'puño' };
        case 'point': return lejos ? { a: 0.2, c: 8, g: 'puño' } : { hx: B * 0.95, hy: -B * 0.35, c: -6, g: 'señala' };
        case 'cry': return lejos ? { hx: 34, hy: -B * 1.0, c: -22, g: 'puño' } : { hx: 44, hy: -B * 0.95, c: -22, g: 'puño' };
        case 'wave': return lejos ? { a: 0.2, c: 8, g: 'puño' } : { hx: 26 + Math.sin((o.t || 0) * 14) * 10, hy: -B * 1.4, c: -12, g: 'abierta' };
        case 'cane': return lejos ? { a: 0.3, c: 8, g: 'puño' } : { hx: 34, hy: B * 0.55, c: -6, g: 'puño', baston: true };
        case 'hips': return { hx: -14, hy: B * 0.45, c: lejos ? 26 : -26, g: 'puño' };
        case 'down': return { a: lejos ? 0.08 : -0.05, c: 10, g: 'puño' };
        default: return { a: sw + 0.1, c: run ? 12 : 6, g: 'puño' };
      }
    };
    const brazo = (lejos) => {
      const pz = poseBrazo(lejos);
      const sx = sh.x + (lejos ? -4 : 6), sy = sh.y;
      let hx, hy;
      if (pz.hx !== undefined) { hx = sx + pz.hx; hy = sy + pz.hy; }
      else { hx = sx + Math.sin(pz.a) * B; hy = sy + Math.cos(pz.a) * B; }
      const ang = manguera(ctx, sx, sy, hx, hy, pz.c, p.tipo === 'gordo' ? 9 : 7, INK);
      if (pz.tel) telefono(ctx, hx + 8, hy - 6, pz.telAng ?? -0.25, o.screen || '#59c7ff', o.flash || 0);
      if (pz.baston) { ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(hx + 4, hy - 4); ctx.lineTo(hx + 10, -2 - (hip.y + L) * 0); ctx.stroke(); ctx.beginPath(); ctx.arc(hx - 2, hy - 6, 7, Math.PI * 1.1, Math.PI * 2.1); ctx.stroke(); }
      guante(ctx, hx, hy, ang, pz.g, p.tipo === 'nino' ? 0.9 : 1);
    };

    ctx.save();
    ctx.translate(0, hip.y); ctx.rotate(o.lean || (run ? run * 0.12 : 0)); ctx.translate(0, -hip.y);
    brazo(true);
    ctx.restore();
    pierna(0, true); pierna(1, false);
    ctx.save();
    ctx.translate(0, hip.y); ctx.rotate(o.lean || (run ? run * 0.12 : 0)); ctx.scale(1, estira); ctx.translate(0, -hip.y);
    // torso con forma de judía
    const tw = T.ancho, th = T.torso, ty = hip.y;
    ctx.lineJoin = 'round';
    const torso = new Path2D();
    torso.moveTo(-tw * 0.5, ty + 4);
    torso.bezierCurveTo(-tw * 0.62, ty - th * 0.4, -tw * 0.4, ty - th, -tw * 0.05, ty - th);
    torso.bezierCurveTo(tw * 0.35, ty - th, tw * 0.62, ty - th * 0.6, tw * 0.55, ty - th * 0.2);
    torso.bezierCurveTo(tw * 0.52, ty, tw * 0.45, ty + 4, tw * 0.3, ty + 6);
    torso.closePath();
    ctx.fillStyle = p.cuerpo; ctx.fill(torso);
    ctx.save(); ctx.clip(torso);
    if (p.rayas) { ctx.fillStyle = INK; for (let k = 0; k < 6; k++) ctx.fillRect(-tw, ty - th + 8 + k * 11, tw * 2, 5); }
    ctx.fillStyle = p.tipo === 'nino' ? INK : p.pantalon; ctx.fillRect(-tw, ty - (p.tipo === 'dama' ? 4 : 12), tw * 2, 30);
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath(); ctx.ellipse(-tw * 0.45, ty - th * 0.45, tw * 0.25, th * 0.6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.strokeStyle = INK; ctx.lineWidth = 3.5; ctx.stroke(torso);
    if (p.tipo === 'dama') {
      // falda acampanada
      ctx.fillStyle = p.pantalon; ctx.beginPath(); ctx.moveTo(-tw * 0.5, ty - 6); ctx.lineTo(tw * 0.45, ty - 6); ctx.quadraticCurveTo(tw * 0.9, ty + 14, tw * 0.75, ty + 22); ctx.quadraticCurveTo(0, ty + 30, -tw * 0.85, ty + 22); ctx.quadraticCurveTo(-tw * 0.85, ty + 12, -tw * 0.5, ty - 6); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    if (p.tirantes) { ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-tw * 0.15, ty - 10); ctx.lineTo(-tw * 0.05, ty - th + 2); ctx.moveTo(tw * 0.3, ty - 10); ctx.lineTo(tw * 0.25, ty - th + 3); ctx.stroke(); ctx.fillStyle = '#fff'; for (const bx of [-tw * 0.15, tw * 0.3]) { ctx.beginPath(); ctx.arc(bx, ty - 14, 3.5, 0, 7); ctx.fill(); ctx.stroke(); } }
    else if (!p.rayas) { ctx.fillStyle = p.cuerpo === '#ffffff' ? INK : '#fff'; for (let k = 0; k < 2; k++) { ctx.beginPath(); ctx.arc(tw * 0.35, ty - th * 0.62 + k * 13, 3, 0, 7); ctx.fill(); } }
    const brazoDetras = ['phone', 'selfie', 'film', 'up', 'wave'].includes(arms);
    if (brazoDetras) brazo(false);
    // cabeza
    const R = T.cabeza;
    ctx.save();
    ctx.translate(tw * 0.08, ty - th - R * 0.62);
    ctx.rotate(o.headTilt || 0);
    cabeza(ctx, R, p, o);
    if (o.screen && (arms === 'phone' || arms === 'film' || arms === 'selfie')) {
      const col = o.screen;
      enColor(ctx, c => { c.globalCompositeOperation = 'screen'; const g = c.createRadialGradient(R * 0.7, R * 0.4, 2, R * 0.6, R * 0.2, R * 1.3); g.addColorStop(0, hexA(col, 0.55)); g.addColorStop(1, hexA(col, 0)); c.fillStyle = g; c.beginPath(); c.arc(R * 0.4, 0, R * 1.2, 0, 7); c.fill(); c.globalCompositeOperation = 'source-over'; });
    }
    ctx.restore();
    ctx.restore();
    if (!brazoDetras) {
      ctx.save();
      ctx.translate(0, hip.y); ctx.rotate(o.lean || (run ? run * 0.12 : 0)); ctx.translate(0, -hip.y);
      brazo(false);
      ctx.restore();
    }
    ctx.restore();
  }

  function mezclar(a, b, t) {
    const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    const c = s => Math.round(lerp((pa >> s) & 255, (pb >> s) & 255, t));
    return '#' + [16, 8, 0].map(s => c(s).toString(16).padStart(2, '0')).join('');
  }
  function hexA(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; }

  // ---------- elementos de color ----------
  function emoji(ctx, x, y, r, tipo, rot = 0) {
    enColor(ctx, c => {
      c.save(); c.translate(x, y); c.rotate(rot);
      if (tipo === 'corazon') {
        c.fillStyle = '#ff3b5c'; c.strokeStyle = INK; c.lineWidth = 3;
        c.beginPath(); c.moveTo(0, r * 0.9); c.bezierCurveTo(-r * 1.4, -r * 0.1, -r * 0.7, -r * 1.2, 0, -r * 0.45); c.bezierCurveTo(r * 0.7, -r * 1.2, r * 1.4, -r * 0.1, 0, r * 0.9); c.fill(); c.stroke();
        c.fillStyle = 'rgba(255,255,255,0.6)'; c.beginPath(); c.ellipse(-r * 0.45, -r * 0.4, r * 0.18, r * 0.1, -0.6, 0, 7); c.fill();
      } else if (tipo === 'like') {
        c.fillStyle = '#2f7bff'; c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.arc(0, 0, r, 0, 7); c.fill(); c.stroke();
        c.fillStyle = '#fff'; c.fillRect(-r * 0.45, -r * 0.05, r * 0.25, r * 0.5); rrect(c, -r * 0.15, -r * 0.15, r * 0.6, r * 0.6, r * 0.1); c.fill(); c.beginPath(); c.moveTo(-r * 0.1, -r * 0.1); c.lineTo(r * 0.05, -r * 0.6); c.lineTo(r * 0.25, -r * 0.55); c.lineTo(r * 0.2, -r * 0.1); c.fill();
      } else {
        const g = c.createRadialGradient(-r * 0.3, -r * 0.3, 2, 0, 0, r); g.addColorStop(0, '#fff27a'); g.addColorStop(1, '#ffc21f');
        c.fillStyle = g; c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.arc(0, 0, r, 0, 7); c.fill(); c.stroke();
        c.fillStyle = INK; c.lineWidth = r * 0.12;
        if (tipo === 'risa') { c.beginPath(); c.arc(-r * 0.35, -r * 0.2, r * 0.18, Math.PI, 0); c.arc(r * 0.35, -r * 0.2, r * 0.18, Math.PI, 0); c.stroke(); c.beginPath(); c.moveTo(-r * 0.55, r * 0.1); c.quadraticCurveTo(0, r * 0.85, r * 0.55, r * 0.1); c.closePath(); c.fill(); c.fillStyle = '#5fc8ff'; c.beginPath(); c.ellipse(-r * 0.75, r * 0.05, r * 0.12, r * 0.2, 0, 0, 7); c.ellipse(r * 0.75, r * 0.05, r * 0.12, r * 0.2, 0, 0, 7); c.fill(); }
        else if (tipo === 'enamorado') { for (const sx of [-1, 1]) { c.fillStyle = '#ff3b5c'; c.beginPath(); const hx = sx * r * 0.35, hy = -r * 0.2, hr = r * 0.22; c.moveTo(hx, hy + hr); c.bezierCurveTo(hx - hr * 1.4, hy, hx - hr * 0.7, hy - hr * 1.2, hx, hy - hr * 0.45); c.bezierCurveTo(hx + hr * 0.7, hy - hr * 1.2, hx + hr * 1.4, hy, hx, hy + hr); c.fill(); } c.strokeStyle = INK; c.beginPath(); c.arc(0, r * 0.15, r * 0.45, 0.3, Math.PI - 0.3); c.stroke(); }
        else if (tipo === 'triste') { c.beginPath(); c.arc(-r * 0.35, -r * 0.2, r * 0.11, 0, 7); c.arc(r * 0.35, -r * 0.2, r * 0.11, 0, 7); c.fill(); c.strokeStyle = INK; c.beginPath(); c.arc(0, r * 0.6, r * 0.35, Math.PI + 0.4, -0.4); c.stroke(); c.fillStyle = '#5fc8ff'; c.beginPath(); c.ellipse(-r * 0.4, r * 0.15, r * 0.1, r * 0.18, 0, 0, 7); c.fill(); }
        else { c.beginPath(); c.arc(-r * 0.35, -r * 0.2, r * 0.12, 0, 7); c.arc(r * 0.35, -r * 0.2, r * 0.12, 0, 7); c.fill(); c.strokeStyle = INK; c.beginPath(); c.arc(0, r * 0.05, r * 0.5, 0.35, Math.PI - 0.35); c.stroke(); }
      }
      c.restore();
    });
  }

  // ---------- escenario ----------
  function fachada(ctx, x, base, w, h, o = {}) {
    const r = rng(o.seed || 1);
    ctx.save();
    ctx.fillStyle = o.color || '#a9a49b'; ctx.strokeStyle = INK; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(x, base); ctx.lineTo(x + 3, base - h); ctx.lineTo(x + w - 2, base - h - 4); ctx.lineTo(x + w, base); ctx.closePath(); ctx.fill(); ctx.stroke();
    if (o.ladrillo) { ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 2; for (let yy = base - h + 10, k = 0; yy < base; yy += 22, k++) for (let xx = x + (k % 2) * 20; xx < x + w - 20; xx += 40) if (r() < 0.25) ctx.strokeRect(xx, yy, 40, 22); }
    const cw = o.winW || 50, ch = o.winH || 70;
    for (let yy = base - h + 40; yy + ch < base - (o.bajos ?? 160); yy += ch + 50) {
      for (let xx = x + 30; xx + cw < x + w - 20; xx += cw + 40) {
        ctx.fillStyle = r() < 0.3 ? '#e8e2d2' : '#3a3734'; ctx.strokeStyle = INK; ctx.lineWidth = 3.5;
        ctx.beginPath(); ctx.moveTo(xx, yy + ch); ctx.lineTo(xx, yy + 14); ctx.quadraticCurveTo(xx + cw / 2, yy - 6, xx + cw, yy + 14); ctx.lineTo(xx + cw, yy + ch); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(xx + cw / 2, yy + 4); ctx.lineTo(xx + cw / 2, yy + ch); ctx.moveTo(xx, yy + ch * 0.55); ctx.lineTo(xx + cw, yy + ch * 0.55); ctx.stroke();
        ctx.fillStyle = '#77736c'; ctx.fillRect(xx - 6, yy + ch, cw + 12, 9); ctx.strokeRect(xx - 6, yy + ch, cw + 12, 9);
      }
    }
    ctx.restore();
  }

  function farola(ctx, x, base, h) {
    ctx.save(); ctx.fillStyle = INK; ctx.strokeStyle = INK;
    ctx.fillRect(x - 6, base - h, 12, h); ctx.fillRect(x - 16, base - 20, 32, 20);
    ctx.beginPath(); ctx.moveTo(x - 26, base - h); ctx.lineTo(x + 26, base - h); ctx.lineTo(x + 16, base - h - 50); ctx.lineTo(x - 16, base - h - 50); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#f6f0d8'; ctx.fillRect(x - 12, base - h - 44, 24, 38);
    ctx.restore();
  }

  function cartel(ctx, x, y, w, h, txt, sub, o = {}) {
    ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.rotate(o.rot || 0);
    ctx.fillStyle = o.bg || '#e8e2d2'; ctx.strokeStyle = INK; ctx.lineWidth = 4;
    ctx.fillRect(-w / 2, -h / 2, w, h); ctx.strokeRect(-w / 2, -h / 2, w, h);
    ctx.lineWidth = 2; ctx.strokeRect(-w / 2 + 8, -h / 2 + 8, w - 16, h - 16);
    ctx.fillStyle = o.fg || INK; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    let fs = h * (sub ? 0.32 : 0.42); const font = o.font || '900 {s}px "Liberation Serif"';
    ctx.font = font.replace('{s}', fs); while (ctx.measureText(txt).width > w * 0.82 && fs > 6) { fs--; ctx.font = font.replace('{s}', fs); }
    ctx.fillText(txt, 0, sub ? -h * 0.12 : 0);
    if (sub) { let ss = h * 0.15; ctx.font = `italic ${ss}px "Liberation Serif"`; while (ctx.measureText(sub).width > w * 0.82 && ss > 5) { ss--; ctx.font = `italic ${ss}px "Liberation Serif"`; } ctx.fillText(sub, 0, h * 0.24); }
    ctx.restore();
  }

  // ---------- película antigua ----------
  let grano = null;
  function pelicula(ctx, W, H, t, o = {}) {
    if (!grano) {
      grano = document.createElement('canvas'); grano.width = 512; grano.height = 512;
      const g = grano.getContext('2d'), img = g.createImageData(512, 512), r = rng(77);
      for (let i = 0; i < img.data.length; i += 4) { const v = 128 + (r() - 0.5) * 150; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
      g.putImageData(img, 0, 0);
    }
    const fr = Math.floor(t * 24);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    // blanco y negro + virado sepia
    ctx.globalCompositeOperation = 'saturation'; ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = o.tono || '#f3e6cc'; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
    // elementos en color
    vaciarColor(ctx);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (o.despuesColor) o.despuesColor(ctx);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    // parpadeo
    ctx.fillStyle = `rgba(0,0,0,${0.03 + hash(fr) * 0.09})`; ctx.fillRect(0, 0, W, H);
    if (hash(fr + 3) < 0.08) { ctx.fillStyle = 'rgba(255,250,235,0.06)'; ctx.fillRect(0, 0, W, H); }
    // grano
    ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.28;
    const ox = Math.floor(hash(fr) * 512), oy = Math.floor(hash(fr + 7) * 512);
    for (let yy = -oy; yy < H; yy += 512) for (let xx = -ox; xx < W; xx += 512) ctx.drawImage(grano, xx, yy);
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    // rayas verticales
    for (let k = 0; k < 3; k++) {
      if (hash(fr * 3 + k) > 0.45) continue;
      const x = hash(fr * 7 + k) * W, a = 0.15 + hash(fr + k * 11) * 0.3;
      ctx.strokeStyle = hash(fr + k) < 0.5 ? `rgba(20,15,10,${a})` : `rgba(255,250,235,${a})`; ctx.lineWidth = 1 + hash(fr + k * 5) * 2;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + (hash(fr + k * 9) - 0.5) * 20, H); ctx.stroke();
    }
    // polvo y pelos
    for (let k = 0; k < 14; k++) {
      if (hash(fr * 13 + k) > 0.5) continue;
      const x = hash(fr * 17 + k) * W, y = hash(fr * 19 + k) * H, r = 1 + hash(fr * 23 + k) * 4;
      ctx.fillStyle = hash(fr + k * 3) < 0.6 ? 'rgba(15,10,8,0.6)' : 'rgba(255,250,235,0.6)';
      ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    }
    if (hash(fr * 29) < 0.12) { const x = hash(fr * 31) * W, y = hash(fr * 37) * H; ctx.strokeStyle = 'rgba(15,10,8,0.5)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, y); ctx.bezierCurveTo(x + 30, y - 20, x + 10, y + 40, x + 50, y + 30); ctx.stroke(); }
    // viñeta fuerte
    const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.68);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(0.75, 'rgba(10,6,2,0.35)'); v.addColorStop(1, 'rgba(10,6,2,0.85)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  // Iris de cartoon antiguo: todo negro excepto un círculo.
  function iris(ctx, W, H, cx, cy, r) {
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#000'; ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.arc(cx, cy, Math.max(0, r), 0, Math.PI * 2, true); ctx.fill('evenodd');
    ctx.restore();
  }

  window.LIB = {
    INK, PAPEL, clamp, lerp, inv, ease, easeOut, easeIn, backOut, rng, pick, hash, rrect,
    enColor, nuevoToon, NINO, toon, telefono, guante, emoji, fachada, farola, cartel, pelicula, iris, hexA, mezclar, manguera,
    reiniciarColor: () => { COLA = []; },
  };
})();
