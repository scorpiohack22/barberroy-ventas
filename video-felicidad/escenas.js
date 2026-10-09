// "Felicidad" — cortometraje de 60 s hecho 100% con código (Canvas 2D).
// Inspirado en "Happiness" de Steve Cutts. Todo es determinista: renderFrame(t) dibuja el instante t (segundos).
(function () {
  const W = 1280, H = 720, DURACION = 60;
  const INK = '#262626';

  // ---------- utilidades ----------
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const inv = (a, b, v) => clamp((v - a) / (b - a));
  const ease = t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const easeIn = t => t * t * t;
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

  const SKIN = ['#f1c9a5', '#e0ac83', '#c68b60', '#8d5a3b', '#f5d6bd', '#a96f4a'];
  const GRIS = ['#7d8a7a', '#6f7b74', '#8e958a', '#5f6b66', '#9aa196', '#77806f', '#a3a89b', '#868c80'];
  const COLOR = ['#c96b5b', '#5b7fc9', '#d9b44a', '#6aa86b', '#9a6bc9', '#e08a3c', '#4ab0b0', '#d36f9a'];
  const PANTS = ['#3b4048', '#2f3a45', '#4a4238', '#353535', '#55504a', '#46505a'];
  const HAIR = ['#2a211c', '#5a3a22', '#1b1b1b', '#8a6a3a', '#b9b2a8', '#3a2a1e'];

  function nuevaPersona(r, colorida) {
    return {
      skin: pick(r, SKIN),
      shirt: colorida ? pick(r, COLOR) : pick(r, GRIS),
      pants: pick(r, PANTS),
      hair: pick(r, HAIR),
      hairStyle: pick(r, ['short', 'short', 'long', 'long', 'curly', 'bald']),
      shoes: pick(r, ['#2a2522', '#3b2a20', '#1f1f24', '#5a4a3a']),
      glasses: r() < 0.18,
      tie: r() < 0.25 ? pick(r, ['#7a2f2f', '#2f3f7a', '#2f5a3a']) : null,
    };
  }
  // El protagonista: camisa blanca y corbata azul (homenaje al original).
  const PROTA = { skin: '#efc39e', shirt: '#f3f1ea', pants: '#3b4048', hair: '#3a2a1e', hairStyle: 'short', shoes: '#2a2522', glasses: false, tie: '#2c4fa3' };

  function rrect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // ---------- persona ----------
  // Rig 2D con cinemática directa: cadera → muslo → espinilla → zapato; hombro → brazo → antebrazo → mano.
  // Origen en el suelo bajo la cadera (de pie, el pie más bajo siempre toca y = 0). Mira hacia +x.
  const MUSLO = 25, ESPINILLA = 24, TORSO = 30, BRAZO = 17, ANTEBRAZO = 15, LW = 2.2;
  const SENTADO = [{ th: 1.5, kn: 1.5 }, { th: 1.38, kn: 1.42 }];

  function poseBrazos(arms, legs, run, ph, o) {
    const r = o.reach || 0, w = Math.sin(ph) * 0.25;
    switch (arms) {
      case 'up': return [[2.75 - w, 0.25], [2.55 + w, 0.35]];
      case 'phone': return [[-legs[0].th * 0.7, 0.3], [0.35, 2.35]];
      case 'box': return [[0.95, 0.75], [0.85, 0.8]];
      case 'wheel': return [[1.05, 0.45], [0.95, 0.55]];
      case 'reach': return [[lerp(0.8, 1.35, r), lerp(0.7, 0.2, r)], [lerp(0.8, 1.5, r), lerp(0.6, 0.02, r)]];
      case 'limp': return [[0.12, 0.12], [0.05, 0.2]];
      case 'fly': return [[2.3, 0.1], [2.15, 0.15]];
      case 'cheer': return [[2.6 + w, 0.5], [2.4 - w, 0.6]];
      default: {
        const e = 0.25 + run * 1.25;
        return [[-legs[0].th * 1.05, e], [-legs[1].th * 1.05, e]];
      }
    }
  }

  function persona(ctx, x, y, s, p, o = {}) {
    const ph = o.phase || 0, run = o.run ?? 0, f = o.facing || 1, mood = o.mood || 'neutral';
    const arms = o.arms || 'swing', seated = !!o.seated, moving = run > 0 && !seated;
    // --- piernas: ángulo del muslo (th, + hacia delante) y flexión de rodilla (kn) ---
    let legs;
    if (seated) legs = o.legs || SENTADO;
    else if (moving) {
      const A = lerp(0.32, 0.78, run), K = lerp(0.55, 1.65, run);
      legs = [Math.PI, 0].map(off => {
        const q = ph + off;
        return { th: A * Math.sin(q) + run * 0.12, kn: 0.1 + K * Math.pow(Math.max(0, Math.cos(q - 0.35 * run)), 1.4) };
      });
    } else legs = o.legs || [{ th: -0.07, kn: 0.05 }, { th: 0.09, kn: 0.05 }];
    // posición de tobillos respecto a la cadera
    const pies = legs.map(({ th, kn }) => {
      const kx = Math.sin(th) * MUSLO, ky = Math.cos(th) * MUSLO, a = th - kn;
      return { kx, ky, ax: kx + Math.sin(a) * ESPINILLA, ay: ky + Math.cos(a) * ESPINILLA, a };
    });
    const apoyo = Math.max(pies[0].ay, pies[1].ay) + 6;
    const vuelo = moving ? Math.max(0, Math.sin(ph * 2)) * run * 5 : 0;
    const hipY = seated ? -36 : -apoyo - vuelo;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s * f, s);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (o.shadow !== false && !seated) {
      ctx.fillStyle = `rgba(0,0,0,${0.16 - vuelo * 0.01})`;
      ctx.beginPath(); ctx.ellipse(3, 1, 22, 4.5, 0, 0, Math.PI * 2); ctx.fill();
    }
    if (o.chair) silla(ctx, hipY);
    ctx.translate(0, hipY);

    const lean = o.lean ?? (moving ? run * 0.22 + 0.03 : 0);
    const [brA, brB] = poseBrazos(arms, legs, moving ? run : 0, ph, o);
    const hombro = { x: 2, y: -TORSO + 3 };
    const rotar = (px, py) => [px * Math.cos(lean) - py * Math.sin(lean), px * Math.sin(lean) + py * Math.cos(lean)];

    const pierna = (i, lejos) => {
      const q = pies[i];
      const col = lejos ? shade(p.pants, -0.2) : p.pants;
      ctx.strokeStyle = INK; ctx.lineWidth = 13;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(q.kx, q.ky); ctx.lineTo(q.ax, q.ay); ctx.stroke();
      ctx.strokeStyle = col; ctx.lineWidth = 13 - LW * 2; ctx.stroke();
      // zapato: plano al apoyar, sigue la espinilla en el aire
      const contacto = seated ? 1 : clamp(1 - (apoyo - 6 - q.ay) / 7);
      const rot = seated ? 0 : -q.a * 0.75 * (1 - contacto);
      ctx.save(); ctx.translate(q.ax, q.ay); ctx.rotate(rot);
      ctx.fillStyle = lejos ? shade(p.shoes, -0.25) : p.shoes; ctx.strokeStyle = INK; ctx.lineWidth = LW;
      ctx.beginPath(); ctx.moveTo(-6, -4); ctx.lineTo(4, -4); ctx.quadraticCurveTo(14, -3, 14, 3); ctx.lineTo(14, 6); ctx.lineTo(-6, 6); ctx.quadraticCurveTo(-8, 1, -6, -4); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(-5, 3.5, 18, 2);
      ctx.restore();
    };

    const mano = (hx, hy, ang, piel) => {
      ctx.save(); ctx.translate(hx, hy); ctx.rotate(ang);
      ctx.fillStyle = piel; ctx.strokeStyle = INK; ctx.lineWidth = 1.7;
      ctx.beginPath(); ctx.ellipse(3.5, 0, 5.4, 4.3, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(3, -3.6, 2.6, 1.9, -0.6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.restore();
    };

    const brazo = ([a1, e], lejos) => {
      const [sx, sy] = rotar(hombro.x, hombro.y);
      const ga = a1 - lean; // ángulo global
      const ex = sx + Math.sin(ga) * BRAZO, ey = sy + Math.cos(ga) * BRAZO;
      const b = ga + e;
      const hx = ex + Math.sin(b) * ANTEBRAZO, hy = ey + Math.cos(b) * ANTEBRAZO;
      ctx.strokeStyle = INK; ctx.lineWidth = 10.5;
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.lineTo(hx, hy); ctx.stroke();
      ctx.strokeStyle = lejos ? shade(p.shirt, -0.16) : p.shirt; ctx.lineWidth = 10.5 - LW * 2; ctx.stroke();
      // puño de la camisa
      ctx.strokeStyle = INK; ctx.lineWidth = 1.4;
      const cx = hx - Math.sin(b) * 3, cy = hy - Math.cos(b) * 3;
      ctx.beginPath(); ctx.moveTo(cx - Math.cos(b) * 4, cy + Math.sin(b) * 4); ctx.lineTo(cx + Math.cos(b) * 4, cy - Math.sin(b) * 4); ctx.stroke();
      const hx2 = hx + Math.sin(b) * 2, hy2 = hy + Math.cos(b) * 2;
      mano(hx2, hy2, Math.atan2(Math.cos(b), Math.sin(b)), lejos ? shade(p.skin, -0.1) : p.skin);
      return [hx2, hy2, b];
    };

    brazo(brA, true);
    pierna(0, true);
    pierna(1, false);

    // --- torso ---
    ctx.save();
    ctx.rotate(lean);
    ctx.fillStyle = p.shirt; ctx.strokeStyle = INK; ctx.lineWidth = LW;
    ctx.beginPath();
    ctx.moveTo(-11, 2); ctx.lineTo(12, 2);
    ctx.quadraticCurveTo(16, -14, 15, -TORSO + 5); ctx.quadraticCurveTo(14, -TORSO, 6, -TORSO);
    ctx.lineTo(-7, -TORSO); ctx.quadraticCurveTo(-14, -TORSO + 1, -13.5, -TORSO + 7); ctx.quadraticCurveTo(-13, -12, -11, 2);
    ctx.closePath(); ctx.fill();
    ctx.save(); ctx.clip(); ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(-16, -TORSO - 2, 8, TORSO + 6); ctx.restore();
    ctx.stroke();
    // cinturón
    ctx.fillStyle = shade(p.pants, -0.35); ctx.fillRect(-11, -2, 23, 4);
    // cuello de la camisa
    ctx.fillStyle = shade(p.shirt, 0.15); ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(1, -TORSO); ctx.lineTo(7, -TORSO + 6); ctx.lineTo(11, -TORSO); ctx.closePath(); ctx.fill(); ctx.stroke();
    if (p.tie) {
      const sw = moving ? -0.25 * run + Math.sin(ph * 2) * 0.15 * run : 0;
      ctx.save(); ctx.translate(8, -TORSO + 3); ctx.rotate(sw);
      ctx.fillStyle = p.tie; ctx.strokeStyle = INK; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(-2, 0); ctx.lineTo(2, 0); ctx.lineTo(3, 18); ctx.lineTo(0, 22); ctx.lineTo(-3, 18); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.restore();
    }
    // --- cuello y cabeza ---
    ctx.fillStyle = p.skin; ctx.strokeStyle = INK; ctx.lineWidth = LW;
    ctx.fillRect(0, -TORSO - 6, 8, 8);
    ctx.beginPath(); ctx.moveTo(0, -TORSO - 6); ctx.lineTo(0, -TORSO + 1); ctx.moveTo(8, -TORSO - 6); ctx.lineTo(8, -TORSO + 1); ctx.stroke();
    cabeza(ctx, 4, -TORSO - 17 + (o.headDrop || 0), o.headTilt || 0, p, mood, o.blink);
    ctx.restore();

    // --- brazo cercano y objetos en mano ---
    if (arms === 'box') {
      const [sx, sy] = rotar(hombro.x, hombro.y);
      ctx.save(); ctx.translate(sx + 20, sy + 10);
      ctx.fillStyle = o.boxColor || '#e9d24a'; ctx.strokeStyle = INK; ctx.lineWidth = LW;
      ctx.fillRect(-6, -18, 34, 28); ctx.strokeRect(-6, -18, 34, 28);
      ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(-6, -18, 34, 6);
      ctx.fillStyle = INK; ctx.font = '900 10px "Inter Display"'; ctx.fillText('4K', 4, 2);
      ctx.restore();
    }
    const [hx, hy] = brazo(brB, false);
    if (arms === 'phone') {
      ctx.save(); ctx.translate(hx + 2, hy - 3); ctx.rotate(-0.3);
      ctx.fillStyle = '#1d1d1d'; rrect(ctx, -3, -8, 7, 12, 1.5); ctx.fill();
      ctx.fillStyle = 'rgba(150,215,255,0.95)'; ctx.fillRect(-2, -7, 5, 9);
      ctx.restore();
      mano(hx, hy, -1.2, p.skin);
    }
    ctx.restore();
  }

  function cabeza(ctx, cx, cy, tilt, p, mood, blink) {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(tilt);
    // pelo largo por detrás
    if (p.hairStyle === 'long') { ctx.fillStyle = p.hair; ctx.strokeStyle = INK; ctx.lineWidth = LW; rrect(ctx, -14, -8, 17, 27, 7); ctx.fill(); ctx.stroke(); }
    // cara
    ctx.fillStyle = p.skin; ctx.strokeStyle = INK; ctx.lineWidth = LW;
    ctx.beginPath();
    ctx.moveTo(-11, -4); ctx.quadraticCurveTo(-12, -14, 0, -14.5); ctx.quadraticCurveTo(12, -14, 12.5, -3);
    ctx.quadraticCurveTo(13, 6, 9, 10); ctx.quadraticCurveTo(4, 14, -3, 12.5); ctx.quadraticCurveTo(-11, 9, -11, -4);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // oreja
    ctx.beginPath(); ctx.ellipse(-3, 0.5, 3, 4, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    // nariz
    ctx.beginPath(); ctx.moveTo(12, -3); ctx.quadraticCurveTo(17.5, 2, 12.2, 3.8); ctx.fill(); ctx.stroke();
    // mejilla
    ctx.fillStyle = 'rgba(220,90,80,0.18)'; ctx.beginPath(); ctx.arc(6, 5, 3.2, 0, Math.PI * 2); ctx.fill();
    // pelo
    ctx.fillStyle = p.hair; ctx.strokeStyle = INK; ctx.lineWidth = LW;
    ctx.beginPath();
    if (p.hairStyle === 'bald') {
      ctx.moveTo(-11, -2); ctx.quadraticCurveTo(-12, -8, -7, -10); ctx.lineTo(-4, -5); ctx.quadraticCurveTo(-7, -1, -7, 3); ctx.closePath();
    } else if (p.hairStyle === 'curly') {
      for (let k = 0; k < 7; k++) { const a = Math.PI * (0.95 + k * 0.15); ctx.moveTo(Math.cos(a) * 11 + 4.5, Math.sin(a) * 11 - 2); ctx.arc(Math.cos(a) * 11, Math.sin(a) * 11 - 2, 4.5, 0, Math.PI * 2); }
    } else {
      ctx.moveTo(-11.5, 2); ctx.quadraticCurveTo(-14, -15, 1, -16); ctx.quadraticCurveTo(12, -16, 13, -7);
      ctx.quadraticCurveTo(6, -10, 3, -8); ctx.quadraticCurveTo(-2, -8, -5, -3); ctx.quadraticCurveTo(-7, 1, -8, 4); ctx.closePath();
    }
    ctx.fill(); ctx.stroke();
    // ojo
    const ex = 6.5, ey = -3;
    if (blink || mood === 'happy') {
      ctx.strokeStyle = INK; ctx.lineWidth = 1.8; ctx.beginPath();
      if (mood === 'happy' && !blink) ctx.arc(ex, ey + 1.2, 2.6, Math.PI * 1.1, Math.PI * 1.9); else { ctx.moveTo(ex - 2.6, ey); ctx.lineTo(ex + 2.6, ey); }
      ctx.stroke();
    } else {
      ctx.fillStyle = '#fbfaf4'; ctx.strokeStyle = INK; ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.ellipse(ex, ey, 2.9, mood === 'shout' ? 4 : 3.4, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(ex + 1, ey + 0.3, 1.6, 0, Math.PI * 2); ctx.fill();
      if (mood === 'tired' || mood === 'sad') { ctx.fillStyle = p.skin; ctx.beginPath(); ctx.ellipse(ex, ey - 1.6, 3.4, 2.2, 0, Math.PI, Math.PI * 2); ctx.fill(); ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(ex - 3, ey - 0.6); ctx.lineTo(ex + 3, ey - 0.6); ctx.stroke(); }
    }
    if (p.glasses) { ctx.strokeStyle = INK; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(ex, ey, 4.4, 0, Math.PI * 2); ctx.moveTo(ex - 4.4, ey); ctx.lineTo(-2, -2); ctx.stroke(); }
    // ceja
    ctx.strokeStyle = shade(p.hair, -0.2); ctx.lineWidth = 2; ctx.beginPath();
    if (mood === 'sad' || mood === 'tired') { ctx.moveTo(3.5, -7); ctx.lineTo(9.5, -9); }
    else if (mood === 'shout') { ctx.moveTo(3.5, -10); ctx.lineTo(9.5, -7.5); }
    else if (mood === 'happy') { ctx.moveTo(3.5, -9); ctx.quadraticCurveTo(6.5, -11, 9.5, -9); }
    else { ctx.moveTo(3.5, -8.5); ctx.lineTo(9.5, -8.5); }
    ctx.stroke();
    // boca
    ctx.strokeStyle = INK; ctx.lineWidth = 1.7; ctx.beginPath();
    if (mood === 'happy') { ctx.fillStyle = '#7a2a2a'; ctx.moveTo(4, 6); ctx.quadraticCurveTo(8, 11, 11.5, 5.5); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    else if (mood === 'sad') { ctx.moveTo(5, 8.5); ctx.quadraticCurveTo(8, 6, 11, 8); ctx.stroke(); }
    else if (mood === 'shout') { ctx.fillStyle = '#5a1f1f'; ctx.ellipse(8.5, 7, 3, 3.8, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
    else if (mood === 'tired') { ctx.moveTo(5.5, 7.5); ctx.lineTo(10.5, 7.8); ctx.stroke(); }
    else { ctx.moveTo(5.5, 7); ctx.quadraticCurveTo(8, 8, 10.5, 6.8); ctx.stroke(); }
    ctx.restore();
  }

  function silla(ctx, hipY) {
    ctx.save();
    ctx.fillStyle = '#3b3f45'; ctx.strokeStyle = INK; ctx.lineWidth = LW;
    rrect(ctx, -22, hipY - 34, 9, 40, 4); ctx.fill(); ctx.stroke();
    rrect(ctx, -18, hipY - 2, 30, 7, 3); ctx.fill(); ctx.stroke();
    ctx.fillRect(-4, hipY + 5, 5, 22); ctx.strokeRect(-4, hipY + 5, 5, 22);
    ctx.beginPath(); ctx.moveTo(-20, hipY + 30); ctx.lineTo(20, hipY + 30); ctx.lineWidth = 4; ctx.stroke();
    ctx.restore();
  }

  function shade(hex, k) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    if (k < 0) { r *= 1 + k; g *= 1 + k; b *= 1 + k; }
    else { r += (255 - r) * k; g += (255 - g) * k; b += (255 - b) * k; }
    const h = v => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0');
    return `#${h(r)}${h(g)}${h(b)}`;
  }

  // Persona vista de espaldas: hombros, brazos y torso que sigue fuera de cuadro (multitudes en primer plano).
  function espalda(ctx, x, y, s, p) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.lineJoin = 'round';
    for (const sx of [-1, 1]) {
      ctx.fillStyle = shade(p.shirt, -0.12);
      ctx.beginPath(); ctx.moveTo(sx * 34, -4); ctx.quadraticCurveTo(sx * 50, 10, sx * 49, 120); ctx.lineTo(sx * 33, 124); ctx.lineTo(sx * 30, 10); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = p.skin; ctx.beginPath(); ctx.ellipse(sx * 41, 134, 9, 12, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
    ctx.fillStyle = p.shirt;
    ctx.beginPath(); ctx.moveTo(-36, 320); ctx.lineTo(-38, 20); ctx.quadraticCurveTo(-36, -10, 0, -12); ctx.quadraticCurveTo(36, -10, 38, 20); ctx.lineTo(36, 320); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 300); ctx.stroke();
    ctx.strokeStyle = INK;
    ctx.fillStyle = p.skin; ctx.fillRect(-8, -24, 16, 14);
    ctx.beginPath(); ctx.ellipse(-20, -32, 4, 6, 0, 0, Math.PI * 2); ctx.ellipse(20, -32, 4, 6, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0, -34, 19, 21, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = p.hair;
    if (p.hairStyle === 'bald') { ctx.beginPath(); ctx.ellipse(0, -24, 18, 9, 0, 0, Math.PI); ctx.fill(); }
    else if (p.hairStyle === 'long') { rrect(ctx, -20, -54, 40, 56, 14); ctx.fill(); ctx.stroke(); }
    else { ctx.beginPath(); ctx.ellipse(0, -38, 19.5, 18, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
    ctx.restore();
  }

  // ---------- coche ----------
  function coche(ctx, x, y, s, color, o = {}) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s * (o.facing || 1), s);
    ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.lineJoin = 'round';
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(0, 0, 135, 8, 0, 0, Math.PI * 2); ctx.fill();
    if (!o.convertible) {
      ctx.fillStyle = shade(color, -0.1);
      ctx.beginPath(); ctx.moveTo(-85, -54); ctx.lineTo(-65, -98); ctx.lineTo(40, -98); ctx.lineTo(70, -54); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#b8c6c8';
      ctx.beginPath(); ctx.moveTo(-72, -58); ctx.lineTo(-58, -90); ctx.lineTo(-12, -90); ctx.lineTo(-12, -58); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-2, -58); ctx.lineTo(-2, -90); ctx.lineTo(36, -90); ctx.lineTo(58, -58); ctx.closePath(); ctx.fill(); ctx.stroke();
      if (o.passenger) {
        ctx.fillStyle = o.passenger; ctx.beginPath(); ctx.arc(18, -72, 10, 0, Math.PI * 2); ctx.fill();
      }
    } else if (o.driver) {
      persona(ctx, -20, -48, 0.9, o.driver, { seated: true, arms: 'wheel', mood: o.mood, headTilt: o.headTilt || 0, shadow: false, lean: -0.05 });
      ctx.strokeStyle = INK; ctx.lineWidth = 2.5;
      ctx.fillStyle = 'rgba(200,225,230,0.55)';
      ctx.beginPath(); ctx.moveTo(22, -56); ctx.lineTo(38, -92); ctx.lineTo(44, -92); ctx.lineTo(34, -56); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-128, -22); ctx.lineTo(-130, -46); ctx.quadraticCurveTo(-118, -58, -90, -58);
    ctx.lineTo(60, -58); ctx.quadraticCurveTo(115, -54, 130, -40); ctx.lineTo(132, -22);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = shade(color, -0.35); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-110, -40); ctx.lineTo(110, -40); ctx.stroke();
    ctx.fillStyle = '#fff6c8'; ctx.beginPath(); ctx.ellipse(124, -44, 6, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c0392b'; ctx.fillRect(-131, -46, 5, 8);
    for (const wx of [-80, 82]) {
      ctx.fillStyle = '#1e1e1e'; ctx.strokeStyle = INK; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(wx, -22, 22, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#c9cdd0'; ctx.beginPath(); ctx.arc(wx, -22, 12, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#666'; ctx.lineWidth = 2;
      for (let k = 0; k < 5; k++) {
        const a = (o.wheel || 0) + (k * Math.PI * 2) / 5;
        ctx.beginPath(); ctx.moveTo(wx, -22); ctx.lineTo(wx + Math.cos(a) * 11, -22 + Math.sin(a) * 11); ctx.stroke();
      }
    }
    ctx.restore();
  }

  // ---------- recursos precalculados ----------
  let papel = null, matrizTitulo = null;
  function prepararRecursos() {
    papel = document.createElement('canvas'); papel.width = W; papel.height = H;
    const pc = papel.getContext('2d');
    const img = pc.createImageData(W, H), r = rng(7);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = 128 + (r() - 0.5) * 70;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255;
    }
    pc.putImageData(img, 0, 0);
    matrizTitulo = matrizTexto('FELICIDAD', 9, 13);
  }
  function matrizTexto(txt, cols, rows) {
    const c = document.createElement('canvas'); c.width = txt.length * cols; c.height = rows;
    const x = c.getContext('2d');
    x.fillStyle = '#fff'; x.font = `bold ${rows}px "DejaVu Sans Mono"`; x.textBaseline = 'top';
    x.fillText(txt, 0, 0);
    const d = x.getImageData(0, 0, c.width, c.height).data, pts = [];
    for (let j = 0; j < c.height; j++) for (let i = 0; i < c.width; i++) if (d[(j * c.width + i) * 4 + 3] > 110) pts.push([i, j]);
    return { pts, w: c.width, h: c.height };
  }
  function puntosLED(ctx, m, cx, cy, dot, color, prog) {
    ctx.fillStyle = 'rgba(80,50,10,0.35)';
    for (let j = 0; j < m.h; j++) for (let i = 0; i < m.w; i++) {
      ctx.beginPath(); ctx.arc(cx - (m.w * dot) / 2 + i * dot, cy - (m.h * dot) / 2 + j * dot, dot * 0.32, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = dot * 1.2;
    for (const [i, j] of m.pts) {
      if (i / m.w > prog) continue;
      ctx.beginPath(); ctx.arc(cx - (m.w * dot) / 2 + i * dot, cy - (m.h * dot) / 2 + j * dot, dot * 0.4, 0, Math.PI * 2); ctx.fill();
    }
    ctx.shadowBlur = 0;
  }

  function cartel(ctx, x, y, w, h, bg, fg, txt, sub, rot = 0) {
    ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.rotate(rot);
    ctx.fillStyle = bg; ctx.strokeStyle = INK; ctx.lineWidth = 3;
    ctx.fillRect(-w / 2, -h / 2, w, h); ctx.strokeRect(-w / 2, -h / 2, w, h);
    ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    let fs = h * (sub ? 0.38 : 0.5);
    ctx.font = `900 ${fs}px "Inter Display"`;
    while (ctx.measureText(txt).width > w * 0.88 && fs > 6) { fs -= 1; ctx.font = `900 ${fs}px "Inter Display"`; }
    ctx.fillText(txt, 0, sub ? -h * 0.1 : 0);
    if (sub) { ctx.font = `600 ${h * 0.14}px "Inter"`; ctx.fillText(sub, 0, h * 0.28); }
    ctx.restore();
  }

  function edificio(ctx, x, yBase, w, h, color, win, seed) {
    ctx.fillStyle = color; ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.fillRect(x, yBase - h, w, h); ctx.strokeRect(x, yBase - h, w, h);
    const r = rng(seed);
    ctx.fillStyle = win;
    for (let yy = yBase - h + 12; yy < yBase - 20; yy += 22)
      for (let xx = x + 10; xx < x + w - 14; xx += 18)
        if (r() > 0.25) ctx.fillRect(xx, yy, 9, 12);
  }

  // ======================= ESCENAS =======================

  // 0–6 s: una persona camina sobre blanco; se suman más hasta la estampida.
  const corredores = (() => {
    const r = rng(11), out = [];
    for (let i = 0; i < 140; i++) {
      const y = 330 + r() * 380;
      out.push({ p: nuevaPersona(r, false), spawn: 1.6 + 4.2 * Math.pow(i / 140, 0.55), y, s: 0.55 + (y - 330) / 380 * 1.1, v: 280 + r() * 220, ph: r() * 6 });
    }
    return out.sort((a, b) => a.y - b.y);
  })();
  function escena1(ctx, t) {
    ctx.fillStyle = '#f4f1ea'; ctx.fillRect(0, 0, W, H);
    // protagonista: entra caminando, mira atrás y echa a correr
    const pRun = inv(2.6, 3.4, t);
    let px = -60 + Math.min(t, 2.6) * 150 + Math.max(0, t - 2.6) * 380;
    for (const c of corredores) {
      if (t < c.spawn) continue;
      const x = -80 + (t - c.spawn) * c.v * (0.7 + c.s * 0.4);
      if (x > W + 100) continue;
      persona(ctx, x, c.y, c.s, c.p, { run: 1, phase: c.ph + t * 13, mood: 'neutral' });
    }
    if (px < W + 80) persona(ctx, px, 540, 1.7, PROTA, { run: lerp(0.45, 1, pRun), phase: t * lerp(7, 13, pRun), headTilt: t > 2 && t < 2.7 ? -0.2 : 0, mood: t > 2 && t < 3 ? 'shout' : 'neutral' });
    // primer plano desenfocado al final
    if (t > 4.8) {
      const k = inv(4.8, 6, t);
      ctx.save(); ctx.filter = 'blur(4px)';
      const r = rng(5);
      for (let i = 0; i < 6; i++) {
        const sp = 4.8 + i * 0.18;
        if (t < sp) continue;
        persona(ctx, -150 + (t - sp) * 900 + r() * 80, 760 + r() * 60, 3.2, nuevaPersona(r, false), { run: 1, phase: t * 12 + i, shadow: false });
      }
      ctx.restore();
      ctx.fillStyle = `rgba(110,120,105,${k * k * 0.8})`; ctx.fillRect(0, 0, W, H);
    }
  }

  // 6–8.5 s: marea de gente (capas con paralaje).
  const filas = (() => {
    const out = [], r = rng(21);
    const defs = [[150, 0.55, 260], [240, 0.8, 360], [360, 1.15, 480], [520, 1.6, 640], [740, 2.3, 860]];
    for (const [y, s, v] of defs) {
      const gente = [];
      const n = Math.ceil((W + 400) / (34 * s));
      for (let i = 0; i < n; i++) gente.push({ p: nuevaPersona(r, r() < 0.15), dx: i * 34 * s + r() * 14 * s, dy: (r() - 0.5) * 30 * s, ph: r() * 6 });
      out.push({ y, s, v, gente, span: n * 34 * s });
    }
    return out;
  })();
  function escena2a(ctx, t) {
    const lt = t - 6;
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#6d7a69'); g.addColorStop(1, '#4c574b');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    for (const f of filas) {
      for (const q of f.gente) {
        const x = ((q.dx + lt * f.v) % f.span) - 200;
        persona(ctx, x, f.y + q.dy, f.s, q.p, { run: 1, phase: q.ph + t * 12, shadow: false });
      }
    }
    ctx.fillStyle = `rgba(30,35,30,${inv(8.1, 8.5, t)})`; ctx.fillRect(0, 0, W, H);
  }

  // 8.5–12 s: andén de metro, el tren llega repleto y aparece el título.
  const caras = (() => { const r = rng(31), o = []; for (let i = 0; i < 400; i++) o.push({ x: r(), y: r(), p: nuevaPersona(r, false) }); return o; })();
  const cola = (() => { const r = rng(41), o = []; for (let i = 0; i < 14; i++) o.push({ x: -40 + i * 100 + r() * 40, y: 690 + r() * 40, s: 1.6 + r() * 0.5, p: nuevaPersona(r, false) }); return o; })();
  function escena2b(ctx, t) {
    const lt = t - 8.5;
    const zoom = 1 + 0.35 * ease(inv(10.3, 12, t));
    ctx.save();
    ctx.translate(640, 150); ctx.scale(zoom, zoom); ctx.translate(-640, -150);
    // pared de azulejos
    ctx.fillStyle = '#4e6a51'; ctx.fillRect(-200, -200, W + 400, 700);
    ctx.strokeStyle = 'rgba(20,40,25,0.35)'; ctx.lineWidth = 1.5;
    for (let y = -200; y < 470; y += 22) { ctx.beginPath(); ctx.moveTo(-200, y); ctx.lineTo(W + 200, y); ctx.stroke(); }
    for (let y = -200, k = 0; y < 470; y += 22, k++) for (let x = -200 + (k % 2) * 22; x < W + 200; x += 44) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 22); ctx.stroke(); }
    ctx.fillStyle = '#8a3b2f'; ctx.fillRect(-200, 228, W + 400, 14);
    cartel(ctx, 60, 120, 170, 80, '#e7d34c', '#222', 'COMPRA', 'y sé feliz');
    cartel(ctx, 1050, 120, 170, 80, '#d1504a', '#fff', '-50%', 'solo hoy');
    // vía
    ctx.fillStyle = '#2b2a27'; ctx.fillRect(-200, 470, W + 400, 300);
    // tren
    const tx = lerp(1500, 0, easeOut(inv(0, 1.4, lt)));
    ctx.save(); ctx.translate(tx, 0);
    ctx.fillStyle = '#c9c08f'; ctx.strokeStyle = INK; ctx.lineWidth = 3;
    rrect(ctx, -60, 250, 1500, 260, 26); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#7a2f2a'; ctx.fillRect(-60, 455, 1500, 16);
    ctx.save();
    for (let i = 0; i < 7; i++) {
      const wx = 10 + i * 190;
      ctx.save(); rrect(ctx, wx, 285, 150, 150, 12); ctx.clip();
      ctx.fillStyle = '#d8d2b0'; ctx.fillRect(wx, 285, 150, 150);
      for (let k = 0; k < 40; k++) {
        const c = caras[(i * 40 + k) % caras.length];
        const jx = Math.sin(t * 9 + k) * 1.5;
        espalda(ctx, wx + c.x * 150 + jx, 300 + c.y * 160, 0.55, c.p);
      }
      ctx.restore();
      ctx.strokeStyle = INK; ctx.lineWidth = 3; rrect(ctx, wx, 285, 150, 150, 12); ctx.stroke();
    }
    ctx.restore();
    ctx.restore();
    // letrero LED con el título
    ctx.fillStyle = '#151515'; ctx.strokeStyle = '#555'; ctx.lineWidth = 6;
    rrect(ctx, 400, 40, 480, 150, 10); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#333'; ctx.fillRect(520, -40, 8, 80); ctx.fillRect(752, -40, 8, 80);
    const prog = inv(9.6, 10.6, t);
    puntosLED(ctx, matrizTitulo, 640, 100, 5.1, '#ffb52e', prog);
    ctx.fillStyle = '#ffb52e'; ctx.font = '600 15px "DejaVu Sans Mono"'; ctx.textAlign = 'center';
    if (t > 10.8) ctx.fillText('UN CORTO HECHO CON CÓDIGO', 640, 172);
    ctx.textAlign = 'left';
    ctx.restore();
    // cola de gente esperando (primer plano)
    for (const c of cola) {
      const push = Math.sin(t * 6 + c.x) * 3 - easeIn(inv(10.5, 12, t)) * 30;
      espalda(ctx, c.x, c.y + push, c.s, c.p);
    }
  }

  // 12–20 s: ciudad saturada de publicidad.
  const anuncios = [
    ['COMPRA YA', '', '#d1504a', '#fff'], ['SÉ FELIZ', 'cuesta poco', '#e7d34c', '#222'], ['50% OFF', '', '#e48bb3', '#222'],
    ['LO NECESITAS', '', '#4ab0a5', '#fff'], ['NUEVO', 'modelo 2026', '#8c6bc9', '#fff'], ['MÁS ES MEJOR', '', '#f08a3c', '#222'],
    ['¿AÚN NO LO TIENES?', '', '#5b7fc9', '#fff'], ['HAZLO HOY', 'mañana es tarde', '#6aa86b', '#fff'], ['SONRÍE', 'compra', '#f3efe2', '#d1504a'],
    ['SALE', '', '#222', '#e7d34c'], ['TÚ LO VALES', '', '#c96b5b', '#fff'], ['5G · 4K · 8K', '', '#e7e2d0', '#333'],
  ];
  const ciudad = (() => {
    const r = rng(51), b = [];
    let x = -300;
    while (x < 3600) {
      const w = 160 + r() * 140, h = 330 + r() * 260;
      b.push({ x, w, h, c: pick(r, ['#b7b39b', '#a4a99a', '#c2b59d', '#9fa69c', '#b9ac93']), seed: (r() * 1e6) | 0, ad: pick(r, anuncios), ad2: pick(r, anuncios), fl: r() });
      x += w + 6;
    }
    return b;
  })();
  const peatones = (() => { const r = rng(61), o = []; for (let i = 0; i < 60; i++) o.push({ x: r() * 3800 - 300, y: 560 + r() * 130, dir: r() < 0.5 ? 1 : -1, v: 40 + r() * 50, p: nuevaPersona(r, r() < 0.35), ph: r() * 6, phone: r() < 0.7 }); return o.sort((a, b) => a.y - b.y); })();
  function escena3(ctx, t) {
    const lt = t - 12;
    const cam = 1500 * ease(inv(0, 5.5, lt));
    ctx.fillStyle = '#cfd3c4'; ctx.fillRect(0, 0, W, H);
    // fondo lejano
    ctx.save(); ctx.translate(-cam * 0.3, 0);
    const r0 = rng(3);
    for (let x = -100; x < 2400; x += 70) { const h = 200 + r0() * 250; ctx.fillStyle = '#b4b9ab'; ctx.fillRect(x, 520 - h, 64, h); }
    ctx.restore();
    ctx.save(); ctx.translate(-cam, 0);
    for (const b of ciudad) {
      if (b.x - cam > W + 50 || b.x + b.w - cam < -50) continue;
      edificio(ctx, b.x, 560, b.w, b.h, b.c, '#7f8a87', b.seed);
      const on = Math.sin(t * 12 + b.fl * 40) > -0.7;
      cartel(ctx, b.x + 12, 560 - b.h + 30, b.w - 24, 90, on ? b.ad[2] : shade(b.ad[2], -0.3), b.ad[3], b.ad[0], b.ad[1]);
      cartel(ctx, b.x + 22, 560 - b.h + 150, b.w - 44, 70, b.ad2[2], b.ad2[3], b.ad2[0], b.ad2[1], (b.fl - 0.5) * 0.1);
      // escaparate
      ctx.fillStyle = shade(b.ad[2], 0.5); ctx.fillRect(b.x + 10, 470, b.w - 20, 90); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.strokeRect(b.x + 10, 470, b.w - 20, 90);
    }
    // marquesina de cine "FELICIDAD · AGOTADO"
    const mx = 1500 + 640 - 230;
    ctx.fillStyle = '#7a2f2a'; ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.fillRect(mx - 20, 110, 500, 450); ctx.strokeRect(mx - 20, 110, 500, 450);
    ctx.fillStyle = '#e9d9a8'; for (const dx of [40, 190, 340]) { ctx.fillRect(mx + dx, 380, 80, 180); ctx.strokeRect(mx + dx, 380, 80, 180); }
    cartel(ctx, mx + 10, 320, 120, 46, '#e7d34c', '#222', 'ESTRENO', '');
    cartel(ctx, mx + 330, 320, 120, 46, '#e7d34c', '#222', 'TAQUILLA', '');
    ctx.fillStyle = '#f3efe2'; ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.fillRect(mx, 150, 460, 150); ctx.strokeRect(mx, 150, 460, 150);
    for (let i = 0; i < 24; i++) { ctx.fillStyle = (Math.floor(t * 8) + i) % 2 ? '#ffd55a' : '#a8873a'; ctx.beginPath(); ctx.arc(mx + 10 + i * 19.5, 140, 5, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(mx + 10 + i * 19.5, 310, 5, 0, 7); ctx.fill(); }
    ctx.fillStyle = '#222'; ctx.textAlign = 'center'; ctx.font = '900 64px "Inter Display"'; ctx.fillText('FELICIDAD', mx + 230, 225);
    ctx.font = '600 18px "Inter"'; ctx.fillText('FUNCIÓN ÚNICA ESTA NOCHE', mx + 230, 258);
    if (lt > 5) { ctx.save(); ctx.translate(mx + 230, 283); ctx.rotate(-0.06); ctx.scale(lerp(2.2, 1, easeOut(inv(5, 5.4, lt))), lerp(2.2, 1, easeOut(inv(5, 5.4, lt)))); ctx.fillStyle = '#d1504a'; ctx.fillRect(-90, -16, 180, 32); ctx.fillStyle = '#fff'; ctx.font = '900 22px "Inter Display"'; ctx.fillText('AGOTADO', 0, 8); ctx.restore(); }
    ctx.textAlign = 'left';
    // acera
    ctx.fillStyle = '#8f8d82'; ctx.fillRect(-300, 560, 4200, 200);
    ctx.fillStyle = '#7b796f'; for (let x = -300; x < 3900; x += 90) ctx.fillRect(x, 560, 3, 200);
    for (const q of peatones) {
      const x = q.x + q.dir * q.v * lt;
      persona(ctx, x, q.y, 0.95 + (q.y - 560) / 400, q.p, { run: 0.45, phase: q.ph + t * 7, facing: q.dir, arms: q.phone ? 'phone' : 'swing', headTilt: q.phone ? 0.35 : 0 });
    }
    ctx.restore();
    // protagonista (fijo en pantalla mientras la cámara avanza)
    const moving = lt < 5.5;
    persona(ctx, 560, 640, 1.35, PROTA, { run: moving ? 0.45 : 0, phase: t * 7, arms: lt < 3 ? 'phone' : 'swing', headTilt: lt < 3 ? 0.35 : lerp(0, -0.45, ease(inv(4.5, 6, lt))), mood: lt > 6.3 ? 'sad' : 'neutral' });
    // coches que pasan en primer plano
    const cx = ((lt * 1100) % 2600) - 300;
    coche(ctx, cx, 790, 1.4, '#d9b44a', { wheel: lt * 20, passenger: '#e0ac83' });
  }

  // 20–28 s: Black Friday.
  const masa = (() => { const r = rng(71), o = []; for (let i = 0; i < 46; i++) o.push({ x: r() * 1400 - 60, y: 480 + r() * 260, s: 1.2 + r() * 1.3, p: nuevaPersona(r, r() < 0.3), ph: r() * 6, lane: r() }); return o.sort((a, b) => a.y - b.y); })();
  const objetos = (() => { const r = rng(81), o = []; for (let i = 0; i < 26; i++) o.push({ a: r() * Math.PI * 2, v: 300 + r() * 600, rot: (r() - 0.5) * 10, t0: 22.4 + r() * 2.4, c: pick(r, ['#e9d24a', '#e48bb3', '#4ab0a5', '#f3efe2', '#8c6bc9']), txt: pick(r, ['4K', '5G', 'TV', 'HD', 'NEW', '-70%']) }); return o; })();
  function tienda(ctx, t, abierta) {
    ctx.fillStyle = '#e8e3d3'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#2a2a2a'; ctx.fillRect(0, 0, W, 120);
    ctx.fillStyle = '#e7d34c'; ctx.font = '900 70px "Inter Display"'; ctx.textAlign = 'center'; ctx.fillText('MEGA STORE', 640, 85);
    // puertas
    const ox = 220 * abierta;
    ctx.fillStyle = '#3a3f3e'; ctx.fillRect(330, 180, 620, 420);
    ctx.fillStyle = '#f7f1d6'; ctx.fillRect(340, 190, 600, 410);
    ctx.fillStyle = 'rgba(160,190,195,0.85)'; ctx.strokeStyle = INK; ctx.lineWidth = 4;
    ctx.fillRect(340 - ox, 190, 300, 410); ctx.strokeRect(340 - ox, 190, 300, 410);
    ctx.fillRect(640 + ox, 190, 300, 410); ctx.strokeRect(640 + ox, 190, 300, 410);
    // banderines
    cartel(ctx, 40, 150, 330, 90, '#111', '#e7d34c', 'BLACK FRIDAY', '', -0.12);
    cartel(ctx, 910, 150, 330, 90, '#111', '#e7d34c', 'BLACK FRIDAY', '', 0.12);
    cartel(ctx, 60, 330, 220, 140, '#d1504a', '#fff', '-70%', 'en todo', -0.05);
    cartel(ctx, 1000, 330, 220, 140, '#e48bb3', '#222', 'SALE', 'hasta agotar', 0.06);
    ctx.textAlign = 'left';
  }
  function escena4(ctx, t) {
    const lt = t - 20;
    if (t < 27) {
      const abierta = easeOut(inv(22, 22.5, t));
      const shake = t > 22 && t < 25.5 ? 6 : t < 22 ? 1.5 : 0;
      ctx.save();
      ctx.translate((hash(t * 30) - 0.5) * shake * 2, (hash(t * 30 + 9) - 0.5) * shake * 2);
      if (t < 25) {
        tienda(ctx, t, abierta);
        // cuenta atrás
        if (t > 20.4 && t < 22) {
          const n = 3 - Math.floor((t - 20.4) / 0.53);
          const f = ((t - 20.4) % 0.53) / 0.53;
          ctx.save(); ctx.translate(640, 380); ctx.scale(1.6 - f * 0.5, 1.6 - f * 0.5);
          ctx.fillStyle = `rgba(209,80,74,${1 - f * 0.6})`; ctx.font = '900 160px "Inter Display"'; ctx.textAlign = 'center'; ctx.fillText(String(n), 0, 55); ctx.restore();
        }
        // multitud
        for (const m of masa) {
          if (t < 22) {
            espalda(ctx, m.x + Math.sin(t * 20 + m.ph) * 3, m.y + Math.sin(t * 15 + m.ph) * 4, m.s * 0.8, m.p);
          } else {
            // corren hacia la puerta (punto de fuga)
            const k = easeIn(clamp((t - 22 - m.lane * 0.9) / 1.6));
            if (k >= 1) continue;
            const x = lerp(m.x, 640 + (m.x - 640) * 0.15, k), y = lerp(m.y, 470, k);
            persona(ctx, x, y, m.s * lerp(1.2, 0.35, k), m.p, { run: 1, phase: m.ph + t * 15, facing: m.x < 640 ? 1 : -1, mood: 'shout', arms: k > 0.3 ? 'up' : 'swing' });
          }
        }
        if (t > 22 && t < 22.25) { ctx.fillStyle = `rgba(255,255,255,${1 - inv(22, 22.25, t)})`; ctx.fillRect(0, 0, W, H); }
      } else {
        // montaña de gente y cajas
        ctx.fillStyle = '#e8e3d3'; ctx.fillRect(0, 0, W, H);
        cartel(ctx, 80, 40, 360, 90, '#111', '#e7d34c', 'BLACK FRIDAY', '', -0.08);
        cartel(ctx, 840, 50, 360, 90, '#111', '#e7d34c', 'SALE  SALE', '', 0.08);
        const r = rng(91);
        const crece = ease(inv(25, 26.5, t));
        for (let i = 0; i < 160; i++) {
          const a = r() * Math.PI, d = Math.sqrt(r());
          const x = 640 + Math.cos(a) * 620 * d, y = 760 - Math.sin(a) * 520 * d * crece;
          const jit = Math.sin(t * 18 + i) * 4;
          if (r() < 0.25) {
            ctx.save(); ctx.translate(x + jit, y); ctx.rotate(r() * 6);
            ctx.fillStyle = pick(r, ['#e9d24a', '#e48bb3', '#4ab0a5', '#f3efe2']); ctx.strokeStyle = INK; ctx.lineWidth = 2;
            ctx.fillRect(-30, -20, 60, 40); ctx.strokeRect(-30, -20, 60, 40); ctx.restore();
          } else {
            persona(ctx, x + jit, y + 40, 0.9 + r() * 0.5, nuevaPersona(r, r() < 0.3), { run: 0.6, phase: t * 14 + i, arms: r() < 0.5 ? 'up' : 'box', mood: 'shout', facing: r() < 0.5 ? 1 : -1, lean: (r() - 0.5) * 1.2, shadow: false });
          }
        }
      }
      // objetos volando hacia cámara
      for (const o of objetos) {
        const k = (t - o.t0) / 1.2;
        if (k < 0 || k > 1) continue;
        const s = lerp(0.3, 3.2, easeIn(k));
        ctx.save(); ctx.translate(640 + Math.cos(o.a) * o.v * k * 1.3, 420 + Math.sin(o.a) * o.v * k * 0.8); ctx.rotate(o.rot * k); ctx.scale(s, s);
        ctx.fillStyle = o.c; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillRect(-30, -20, 60, 40); ctx.strokeRect(-30, -20, 60, 40);
        ctx.fillStyle = INK; ctx.font = '900 16px "Inter Display"'; ctx.textAlign = 'center'; ctx.fillText(o.txt, 0, 6); ctx.restore();
      }
      ctx.restore();
      ctx.textAlign = 'left';
    } else {
      // calma después del caos
      ctx.fillStyle = '#ddd8c8'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#b9b4a4'; ctx.fillRect(0, 520, W, 200);
      const r = rng(101);
      for (let i = 0; i < 30; i++) {
        ctx.save(); ctx.translate(r() * W, 540 + r() * 170); ctx.rotate(r() * 6);
        ctx.fillStyle = pick(r, ['#e9d24a', '#e48bb3', '#f3efe2', '#cfc9b6']); ctx.strokeStyle = INK; ctx.lineWidth = 2;
        ctx.fillRect(-18, -10, 36, 20); ctx.strokeRect(-18, -10, 36, 20); ctx.restore();
      }
      cartel(ctx, 900, 140, 300, 80, '#111', '#e7d34c', 'BLACK FRI', '', 0.5);
      persona(ctx, 640, 620, 1.6, PROTA, { arms: 'box', mood: 'happy', boxColor: '#e9d24a', lean: -0.05 });
    }
  }

  // 28–36 s: el coche rojo, el atasco y la lluvia.
  function escena5(ctx, t) {
    const lt = t - 28;
    if (lt < 2) {
      ctx.fillStyle = '#e9dcb9'; ctx.fillRect(0, 0, W, H);
      // rayos de sol
      ctx.save(); ctx.translate(250, 120);
      for (let i = 0; i < 14; i++) { ctx.rotate(Math.PI / 7); ctx.fillStyle = 'rgba(255,220,140,0.35)'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(1400, -90); ctx.lineTo(1400, 90); ctx.closePath(); ctx.fill(); }
      ctx.restore();
      ctx.fillStyle = '#f3efe2'; ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.fillRect(560, 210, 640, 260); ctx.strokeRect(560, 210, 640, 260);
      ctx.fillStyle = '#9fb7bb'; ctx.fillRect(590, 300, 580, 170);
      ctx.fillStyle = '#c0392b'; ctx.font = 'italic 900 64px "Inter Display"'; ctx.fillText('Autos Alegría', 640, 280);
      ctx.fillStyle = '#7d7a70'; ctx.fillRect(0, 560, W, 160);
      const x = lerp(520, 900, easeIn(inv(0.6, 2, lt)));
      coche(ctx, x, 650, 1.6, '#d6372b', { convertible: true, driver: PROTA, mood: 'happy', wheel: easeIn(inv(0.6, 2, lt)) * 20 });
    } else if (lt < 4.5) {
      // autopista con sol
      ctx.fillStyle = '#f0d9a8'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#ffd56b'; ctx.beginPath(); ctx.arc(1000, 170, 90, 0, 7); ctx.fill();
      const off = lt * 900;
      ctx.save(); ctx.translate(-(off * 0.3) % 1400, 0);
      const r = rng(111);
      for (let x = 0; x < 2800; x += 110) { const h = 120 + r() * 200; ctx.fillStyle = '#c9b48d'; ctx.fillRect(x, 470 - h, 100, h); }
      ctx.restore();
      ctx.fillStyle = '#6d6b64'; ctx.fillRect(0, 470, W, 250);
      ctx.fillStyle = '#efe8d3'; for (let x = -(off % 160); x < W; x += 160) ctx.fillRect(x, 610, 80, 8);
      coche(ctx, 560, 600, 1.7, '#d6372b', { convertible: true, driver: PROTA, mood: 'happy', wheel: lt * 25 });
    } else {
      // atasco + lluvia
      const gris = inv(4.5, 6, lt);
      ctx.fillStyle = `rgb(${lerp(200, 140, gris)},${lerp(190, 148, gris)},${lerp(170, 145, gris)})`; ctx.fillRect(0, 0, W, H);
      const r = rng(121);
      for (let x = -40; x < W; x += 120) { const h = 220 + r() * 260; edificio(ctx, x, 470, 110, h, '#9a9d96', '#6f7471', (r() * 1e5) | 0); }
      ctx.fillStyle = '#5f5e59'; ctx.fillRect(0, 470, W, 250);
      const close = ease(inv(6.6, 8, lt));
      ctx.save();
      ctx.translate(560, 560); ctx.scale(1 + close * 2.2, 1 + close * 2.2); ctx.translate(-560 - close * 10, -560 + close * 55);
      coche(ctx, 180, 540, 1.2, '#a7b4b0', { passenger: '#c68b60' });
      coche(ctx, 1150, 540, 1.2, '#d9c9a0', { passenger: '#f1c9a5', facing: 1 });
      coche(ctx, -250, 690, 1.5, '#8a9aa8', {});
      coche(ctx, 1300, 690, 1.5, '#b4a68c', {});
      coche(ctx, 640, 690, 1.5, '#d6372b', { convertible: true, driver: PROTA, mood: 'sad', headTilt: 0.15 });
      // bocinazos
      if (lt < 7) {
        ctx.fillStyle = '#d1504a'; ctx.font = '900 46px "Inter Display"';
        if (Math.sin(t * 14) > 0) ctx.fillText('¡¡PIIII!!', 120, 400);
        if (Math.sin(t * 11 + 2) > 0) ctx.fillText('¡MUÉVETE!', 1000, 400);
      }
      ctx.restore();
      ctx.fillStyle = `rgba(90,105,110,${gris * 0.35})`; ctx.fillRect(0, 0, W, H);
      // lluvia
      const lluvia = inv(5, 6, lt);
      ctx.strokeStyle = `rgba(220,230,235,${0.55 * lluvia})`; ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < 260; i++) {
        const x = (hash(i) * 1500 + t * -200) % 1500 + 100, y = (hash(i + 99) * 800 + t * 1400) % 800 - 40;
        ctx.moveTo(x, y); ctx.lineTo(x - 8, y + 34);
      }
      ctx.stroke();
    }
  }

  // 36–44 s: evasión — alcohol, pastillas y alucinación.
  function escena6(ctx, t) {
    const lt = t - 36;
    if (lt < 2.5) {
      ctx.fillStyle = '#8b6f5c'; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(40,25,20,0.45)'; ctx.lineWidth = 2;
      for (let y = 0, k = 0; y < 560; y += 26, k++) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); for (let x = (k % 2) * 30; x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 26); ctx.stroke(); } }
      ctx.fillStyle = '#5a5650'; ctx.fillRect(0, 560, W, 160);
      cartel(ctx, 120, 70, 520, 230, '#1f3a2b', '#efe2c0', 'FELICIDAD', 'bebe y olvida', 0);
      // botella
      ctx.save(); ctx.translate(560, 220); ctx.rotate(0.15);
      ctx.fillStyle = '#7a4a1e'; ctx.strokeStyle = INK; ctx.lineWidth = 3; rrect(ctx, -30, -60, 60, 120, 10); ctx.fill(); ctx.stroke(); ctx.fillRect(-10, -95, 20, 40);
      ctx.fillStyle = '#efe2c0'; ctx.fillRect(-24, -20, 48, 40); ctx.restore();
      cartel(ctx, 760, 100, 420, 150, '#f3efe2', '#d1504a', 'BEBE · OLVIDA · SONRÍE', '', 0);
      // bolsas de basura
      for (const [x, c] of [[700, '#2f3a33'], [790, '#3a3a3a'], [1080, '#2f3a33']]) { ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(x, 600, 60, 45, 0, 0, 7); ctx.fill(); }
      // protagonista sentado, abatido
      ctx.save(); ctx.translate(900, 700); ctx.scale(1.5, 1.5);
      persona(ctx, 0, 0, 1.5, PROTA, { seated: true, legs: [{ th: 2.1, kn: 2.0 }, { th: 1.9, kn: 1.75 }], arms: 'limp', mood: 'sad', headTilt: 0.35, lean: 0.3, shadow: false });
      ctx.restore();
    } else if (lt < 4.5) {
      // frasco gigante bajo un foco
      ctx.fillStyle = '#0d0d0d'; ctx.fillRect(0, 0, W, H);
      const g = ctx.createRadialGradient(640, 600, 10, 640, 600, 420);
      g.addColorStop(0, 'rgba(255,248,215,0.35)'); g.addColorStop(1, 'rgba(255,248,215,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(560, -10); ctx.lineTo(720, -10); ctx.lineTo(1000, 720); ctx.lineTo(280, 720); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,248,215,0.12)'; ctx.beginPath(); ctx.ellipse(640, 650, 330, 50, 0, 0, 7); ctx.fill();
      const sc = lerp(1, 1.12, inv(2.5, 4.5, lt));
      ctx.save(); ctx.translate(680, 640); ctx.scale(sc, sc);
      ctx.fillStyle = '#b6481e'; ctx.strokeStyle = INK; ctx.lineWidth = 4; rrect(ctx, -140, -360, 280, 360, 30); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#f3efe2'; ctx.fillRect(-140, -380, 280, 50); ctx.strokeRect(-140, -380, 280, 50);
      ctx.fillStyle = '#fff'; ctx.fillRect(-140, -260, 280, 150); ctx.strokeRect(-140, -260, 280, 150);
      ctx.fillStyle = '#222'; ctx.textAlign = 'center'; ctx.font = '900 46px "Inter Display"'; ctx.fillText('FELICIDAD', 0, -200);
      ctx.font = '700 22px "Inter"'; ctx.fillText('200 mg · 30 cápsulas', 0, -160);
      ctx.fillStyle = '#2c4fa3'; ctx.font = '600 16px "Inter"'; ctx.fillText('tómela cuando esté triste', 0, -130);
      ctx.textAlign = 'left';
      ctx.restore();
      persona(ctx, 470, 650, 1.3, PROTA, { arms: lt > 3.5 ? 'reach' : 'limp', reach: inv(3.5, 4.5, lt), mood: 'sad', headTilt: -0.4 });
      // cápsulas cayendo
      for (let i = 0; i < 18; i++) {
        const k = (lt - 3.6 - i * 0.04) / 0.8; if (k < 0) continue;
        const x = 600 + (hash(i) - 0.5) * 300, y = 300 + k * k * 500;
        if (y > 660) continue;
        ctx.save(); ctx.translate(x, y); ctx.rotate(hash(i + 3) * 6 + k * 4);
        ctx.fillStyle = pick(rng(i), ['#ff6fa8', '#ffe066', '#6fd3ff', '#9dff7a']); rrect(ctx, -10, -5, 20, 10, 5); ctx.fill(); ctx.restore();
      }
    } else {
      halucinacion(ctx, t, 0);
    }
  }

  function halucinacion(ctx, t, gris) {
    const lt = t - 40.5;
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#5ec8ff'); g.addColorStop(1, '#c9f2ff');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // sol con cara
    ctx.save(); ctx.translate(1060, 150); ctx.rotate(t * 0.8);
    ctx.fillStyle = '#ffe14d';
    for (let i = 0; i < 12; i++) { ctx.rotate(Math.PI / 6); ctx.beginPath(); ctx.moveTo(0, -95); ctx.lineTo(18, -135); ctx.lineTo(-18, -135); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    ctx.fillStyle = '#ffd21f'; ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(1060, 150, 80, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(1035, 135, 8, 0, 7); ctx.arc(1085, 135, 8, 0, 7); ctx.fill();
    ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(1060, 160, 34, 0.2, Math.PI - 0.2); ctx.stroke();
    // arcoíris
    const col = ['#ff4d4d', '#ff9a3c', '#ffe14d', '#5fd35f', '#4da6ff', '#9a6bff'];
    for (let i = 0; i < col.length; i++) { ctx.strokeStyle = col[i]; ctx.lineWidth = 24; ctx.beginPath(); ctx.arc(420, 640, 470 - i * 24, Math.PI, Math.PI * 2); ctx.stroke(); }
    // colinas
    for (const [y, c, a] of [[560, '#7fdc6a', 0.7], [620, '#5cc24f', 1.1], [690, '#46a83c', 1.6]]) {
      ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(0, H);
      for (let x = 0; x <= W; x += 20) ctx.lineTo(x, y + Math.sin(x / 180 * a + t * 0.6) * 40);
      ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
    }
    // flores
    for (let i = 0; i < 26; i++) {
      const x = hash(i) * W, y = 640 + hash(i + 50) * 70, sw = Math.sin(t * 4 + i) * 0.3;
      ctx.save(); ctx.translate(x, y); ctx.rotate(sw);
      ctx.strokeStyle = '#2f7a2a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -30); ctx.stroke();
      ctx.fillStyle = col[i % col.length];
      for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(Math.cos(k * 1.256) * 8, -30 + Math.sin(k * 1.256) * 8, 6, 0, 7); ctx.fill(); }
      ctx.fillStyle = '#fff2a8'; ctx.beginPath(); ctx.arc(0, -30, 5, 0, 7); ctx.fill(); ctx.restore();
    }
    // pájaros
    ctx.strokeStyle = INK; ctx.lineWidth = 3;
    for (let i = 0; i < 6; i++) {
      const x = ((t * 120 + i * 230) % 1500) - 100, y = 120 + hash(i) * 200 + Math.sin(t * 3 + i) * 15, fl = Math.sin(t * 14 + i) * 10;
      ctx.beginPath(); ctx.moveTo(x - 16, y - fl); ctx.quadraticCurveTo(x - 6, y - 8, x, y); ctx.quadraticCurveTo(x + 6, y - 8, x + 16, y - fl); ctx.stroke();
    }
    // protagonista bailando y luego volando
    const vuelo = ease(inv(2, 3.5, lt));
    const x = lerp(560, 760, vuelo), y = lerp(620 - Math.abs(Math.sin(t * 7)) * 30, 330, vuelo);
    persona(ctx, x, y, 1.6, { ...PROTA, shirt: '#ffffff' }, { arms: vuelo > 0.1 ? 'fly' : 'up', phase: t * 7, run: vuelo > 0.1 ? 0.3 : 0.6, mood: 'happy', lean: vuelo * 1.2, headTilt: vuelo * -0.6 });
    if (gris > 0) {
      ctx.save(); ctx.globalCompositeOperation = 'saturation'; ctx.fillStyle = `rgba(128,128,128,${gris})`; ctx.fillRect(0, 0, W, H); ctx.restore();
      ctx.fillStyle = `rgba(80,100,105,${gris * 0.6})`; ctx.fillRect(0, 0, W, H);
    }
  }

  // 44–50 s: los colores se apagan, cae, y la cámara revela un planeta de edificios.
  const planeta = (() => { const r = rng(131), o = []; for (let i = 0; i < 150; i++) o.push({ a: r() * Math.PI * 2, h: 40 + r() * 140, w: 16 + r() * 22, ring: r() < 0.5 ? 0 : 1, c: pick(r, ['#9aa59f', '#7f8b86', '#b4b8ad', '#6c7672']) }); return o.sort((a, b) => a.ring - b.ring); })();
  function escena7(ctx, t) {
    const lt = t - 44;
    if (lt < 1.2) { halucinacion(ctx, t, ease(inv(0, 1.1, lt))); return; }
    ctx.fillStyle = '#5d7a7c'; ctx.fillRect(0, 0, W, H);
    const zoomOut = ease(inv(3.2, 6, lt));
    // nubes subiendo (sensación de caída)
    ctx.fillStyle = 'rgba(220,230,228,0.35)';
    for (let i = 0; i < 9; i++) {
      const y = ((hash(i) * 900 - lt * 700 * (1 - zoomOut)) % 900 + 900) % 900 - 100;
      ctx.beginPath(); ctx.ellipse(hash(i + 7) * W, y, 160, 40, 0, 0, 7); ctx.fill();
    }
    // planeta de edificios
    if (lt > 2.6) {
      const R = lerp(1400, 150, zoomOut), cx = 640, cy = lerp(H + 1350, 360, zoomOut);
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(t * 0.15);
      const sk = R / 150;
      for (const b of planeta) {
        ctx.save(); ctx.rotate(b.a);
        const h = b.h * sk * (b.ring ? 1 : 0.7), w = b.w * sk;
        ctx.fillStyle = b.ring ? b.c : shade(b.c, -0.25); ctx.strokeStyle = INK; ctx.lineWidth = Math.max(1, sk);
        ctx.fillRect(-w / 2, -R - h, w, h); ctx.strokeRect(-w / 2, -R - h, w, h);
        ctx.fillStyle = 'rgba(255,240,190,0.7)';
        for (let yy = -R - h + 6 * sk; yy < -R - 4 * sk; yy += 10 * sk) ctx.fillRect(-w / 4, yy, w / 2, 3 * sk);
        ctx.restore();
      }
      ctx.fillStyle = '#4a5250'; ctx.beginPath(); ctx.arc(0, 0, R, 0, 7); ctx.fill();
      ctx.restore();
    }
    // cae girando
    const s = lerp(1.6, 0.25, zoomOut);
    const py = lerp(360, 120, zoomOut) + Math.sin(t * 2) * 10;
    ctx.save(); ctx.translate(640, py); ctx.rotate(Math.PI + Math.sin(t * 1.3) * 0.6);
    persona(ctx, 0, 50 * s, s, PROTA, { arms: 'up', phase: t * 4, mood: 'shout', shadow: false });
    ctx.restore();
    // líneas de viento
    if (zoomOut < 0.6) {
      ctx.strokeStyle = 'rgba(240,245,240,0.5)'; ctx.lineWidth = 2;
      for (let i = 0; i < 14; i++) { const x = 400 + hash(i) * 480, y = ((hash(i + 3) * 720 - lt * 1600) % 720 + 720) % 720; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 60); ctx.stroke(); }
    }
  }

  // 50–56 s: la oficina... que resulta ser una trampa.
  // Plano general en proyección oblicua: x a lo largo de la tabla, z en profundidad, y hacia arriba.
  const TX = 140, TY = 520, PROF = 360, BISAGRA = 470, BARRA = 400;
  const P = (x, y, z) => [TX + x + z * 0.5, TY - y - z * 0.35];
  const companeros = (() => { const r = rng(141), o = []; for (let i = 0; i < 9; i++) o.push({ x: 560 + i * 42, p: nuevaPersona(r, false), ph: r() * 6 }); return o; })();
  function escena8(ctx, t) {
    const lt = t - 50;
    const pull = ease(inv(3.3, 5.1, lt));
    const snap = easeIn(inv(5.2, 5.38, lt));
    const [fx, fy] = P(650, 0, 170);
    const zoom = lerp(3.4, 1, pull);
    const cx = lerp(fx + 40, 640, pull), cy = lerp(fy - 40, 390, pull);
    const g = ctx.createRadialGradient(640, 420, 100, 640, 420, 900); g.addColorStop(0, '#8b8576'); g.addColorStop(1, '#3d3a33');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.translate(640, 360); ctx.scale(zoom, zoom); ctx.translate(-cx, -cy);
    ctx.strokeStyle = INK; ctx.lineJoin = 'round';
    // tabla de madera: cara frontal + superficie
    const quad = (pts, fill) => { ctx.fillStyle = fill; ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.fill(); ctx.lineWidth = 3; ctx.stroke(); };
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(640, 600, 620, 50, 0, 0, 7); ctx.fill();
    quad([P(0, 0, 0), P(900, 0, 0), P(900, 0, PROF), P(0, 0, PROF)], '#d3a46a');
    quad([P(0, 0, 0), P(900, 0, 0), P(900, -55, 0), P(0, -55, 0)], '#b07f48');
    quad([P(900, 0, 0), P(900, 0, PROF), P(900, -55, PROF), P(900, -55, 0)], '#9c6f3e');
    ctx.strokeStyle = 'rgba(120,75,30,0.35)'; ctx.lineWidth = 2;
    for (let i = 1; i < 9; i++) { const z = (i * PROF) / 9; const [a, b] = P(0, 0, z), [c, d] = P(900, 0, z); ctx.beginPath(); ctx.moveTo(a, b); ctx.bezierCurveTo(a + 300, b + 6, c - 300, d - 6, c, d); ctx.stroke(); }
    // muelles en la bisagra
    for (const z0 of [30, PROF - 70]) {
      ctx.strokeStyle = '#d5d9db'; ctx.lineWidth = 5;
      for (let k = 0; k < 7; k++) { const [x, y] = P(BISAGRA, 12, z0 + k * 6); ctx.beginPath(); ctx.ellipse(x, y, 9, 14, 0.4, 0, 7); ctx.stroke(); }
    }
    // barra de la trampa (en forma de U), gira sobre la bisagra
    const barra = () => {
      const th = lerp(Math.PI - 0.02, 0.06, snap);
      const ex = BISAGRA + Math.cos(th) * BARRA, ey = 6 + Math.sin(th) * BARRA;
      const a = P(BISAGRA, 6, 25), b = P(ex, ey, 25), c = P(ex, ey, PROF - 25), d = P(BISAGRA, 6, PROF - 25);
      ctx.lineCap = 'round';
      for (const [w, col] of [[13, INK], [8, '#cfd4d6']]) {
        ctx.strokeStyle = col; ctx.lineWidth = w;
        ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.lineTo(...c); ctx.lineTo(...d); ctx.stroke();
      }
    };
    if (snap < 0.5) barra();
    // placa del cebo + billete
    quad([P(720, 2, 120), P(820, 2, 120), P(820, 2, 200), P(720, 2, 200)], '#c98b4a');
    // tabiques de oficina con compañeros
    for (const c of companeros) {
      const [x, y] = P(c.x, 0, 300);
      persona(ctx, x, y - 22, 0.42, c.p, { seated: true, arms: 'wheel', mood: 'tired', headTilt: 0.2 + Math.sin(t * 8 + c.ph) * 0.05, shadow: false });
    }
    quad([P(540, 0, 280), P(900, 0, 280), P(900, 48, 280), P(540, 48, 280)], '#8f948c');
    ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 2;
    for (let x = 600; x < 900; x += 60) { const [a, b] = P(x, 0, 280), [c, d] = P(x, 48, 280); ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(c, d); ctx.stroke(); }
    // escritorio, ordenador y protagonista
    const [dx, dy] = P(600, 0, 170);
    persona(ctx, dx - 6, dy, 0.62, PROTA, { seated: true, chair: true, arms: lt > 3.0 ? 'reach' : 'wheel', reach: inv(3.0, 5.1, lt), mood: lt > 2.4 && lt < 5.2 ? 'neutral' : 'tired', headTilt: lt > 2.2 && lt < 3 ? 0.35 : 0.12 + Math.sin(t * 8) * 0.02, shadow: false });
    ctx.fillStyle = '#d8c3a0'; ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.fillRect(dx + 8, dy - 34, 92, 9); ctx.strokeRect(dx + 8, dy - 34, 92, 9);
    ctx.fillRect(dx + 14, dy - 25, 6, 25); ctx.strokeRect(dx + 14, dy - 25, 6, 25); ctx.fillRect(dx + 88, dy - 25, 6, 25); ctx.strokeRect(dx + 88, dy - 25, 6, 25);
    ctx.fillStyle = '#e4e2da'; ctx.fillRect(dx + 46, dy - 76, 46, 36); ctx.strokeRect(dx + 46, dy - 76, 46, 36);
    ctx.fillStyle = '#9fb3b5'; ctx.fillRect(dx + 50, dy - 72, 38, 28);
    ctx.fillStyle = '#e4e2da'; ctx.fillRect(dx + 64, dy - 40, 10, 6);
    // billete que cae sobre la placa
    const bk = inv(1.3, 3.0, lt);
    const [bxf, byf] = P(770, 4, 160);
    const bx = bxf + Math.sin(bk * 10) * 40 * (1 - bk), by = lerp(byf - 260, byf, easeOut(bk));
    ctx.save(); ctx.translate(bx, by); ctx.rotate(Math.sin(bk * 10) * 0.6 * (1 - bk) - 0.1);
    ctx.fillStyle = '#9ec08a'; ctx.strokeStyle = '#3e5a33'; ctx.lineWidth = 1.2;
    ctx.fillRect(-22, -6, 44, 12); ctx.strokeRect(-22, -6, 44, 12);
    ctx.fillStyle = '#3e5a33'; ctx.font = '900 8px "Inter Display"'; ctx.textAlign = 'center'; ctx.fillText('$100', 0, 3); ctx.textAlign = 'left';
    ctx.restore();
    if (snap >= 0.5) barra();
    ctx.restore();
    if (lt > 5.3) { ctx.fillStyle = `rgba(255,255,255,${1 - inv(5.3, 5.45, lt)})`; ctx.fillRect(0, 0, W, H); }
    if (lt > 5.45) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); }
  }

  // 56–60 s: rótulo final.
  function escena9(ctx, t) {
    const lt = t - 56;
    ctx.fillStyle = '#1d2120'; ctx.fillRect(0, 0, W, H);
    const g = ctx.createRadialGradient(640, 330, 50, 640, 330, 700); g.addColorStop(0, 'rgba(90,100,95,0.5)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    const a = inv(0.4, 1.6, lt);
    ctx.globalAlpha = a;
    const tg = ctx.createLinearGradient(0, 260, 0, 380); tg.addColorStop(0, '#e9ece6'); tg.addColorStop(0.5, '#8d9590'); tg.addColorStop(1, '#d5d9d3');
    ctx.fillStyle = tg; ctx.font = 'italic bold 128px "Liberation Serif"'; ctx.fillText('Felicidad', 640, 360);
    ctx.globalAlpha = inv(1.6, 2.4, lt);
    ctx.fillStyle = '#b9beb8'; ctx.font = '600 22px "Inter"'; ctx.fillText('UN CORTOMETRAJE HECHO 100% CON CÓDIGO', 640, 440);
    ctx.font = '400 19px "Inter"'; ctx.fillStyle = '#a3a8a2'; ctx.fillText('Inspirado en «Happiness» de Steve Cutts · Música generada por código', 640, 476);
    ctx.globalAlpha = 1; ctx.textAlign = 'left';
    ctx.fillStyle = `rgba(0,0,0,${inv(3.4, 4, lt)})`; ctx.fillRect(0, 0, W, H);
  }

  const ESCENAS = [
    [0, 6, escena1], [6, 8.5, escena2a], [8.5, 12, escena2b], [12, 20, escena3], [20, 28, escena4],
    [28, 36, escena5], [36, 44, escena6], [44, 50, escena7], [50, 56, escena8], [56, 60, escena9],
  ];

  function renderFrame(ctx, t) {
    if (!papel) prepararRecursos();
    ctx.save();
    ctx.clearRect(0, 0, W, H);
    const e = ESCENAS.find(([a, b]) => t >= a && t < b) || ESCENAS[ESCENAS.length - 1];
    e[2](ctx, t);
    ctx.restore();
    // textura de papel + viñeta
    ctx.save();
    ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.16; ctx.drawImage(papel, 0, 0);
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    const v = ctx.createRadialGradient(640, 360, 380, 640, 360, 820); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.35)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
    ctx.restore();
    // fundidos entre escenas
    const fades = [[0, 0.6, 'in'], [11.85, 12.15], [19.85, 20.1], [27.85, 28.1], [35.85, 36.1], [43.9, 44.05], [55.9, 56.2]];
    for (const [a, b, k] of fades) {
      if (t < a || t > b) continue;
      const m = (a + b) / 2;
      const al = k === 'in' ? 1 - inv(a, b, t) : 1 - Math.abs(t - m) / ((b - a) / 2);
      ctx.fillStyle = `rgba(0,0,0,${clamp(al)})`; ctx.fillRect(0, 0, W, H);
    }
  }

  window.FELICIDAD = { W, H, DURACION, renderFrame };
})();
