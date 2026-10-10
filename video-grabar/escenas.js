// "Grabar en vez de ayudar" — corto vertical (1080×1920) de 60 s, sin texto.
// Un abuelo se cae en la calle; todos sacan el móvil para grabar en vez de ayudar. Solo una niña le da la mano.
// Fondos: Higgsfield Soul 2.0 (vista frontal a la altura de los ojos). Personajes con medidas reales (cm), animación y música: código.
(function () {
  const { INK, clamp, lerp, inv, ease, easeOut, easeIn, hash, mix, rrect, post } = LIB;
  const { persona } = FIG;
  const W = 1080, H = 1920, DURACION = 60;

  // ---------- fondos ----------
  const NOMBRES = ['casa', 'tienda', 'ancha', 'cerca', 'cocina', 'cuarto'];
  const IMG = {};
  window.LISTO = Promise.all(NOMBRES.map(k => new Promise(res => { const i = new Image(); i.onload = res; i.onerror = res; i.src = `fondos/${k}.jpg`; IMG[k] = i; })));
  function camara(ctx, z = 1, cx = 543, cy = 960) { ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-cx, -cy); }
  function fondo(ctx, k) { ctx.drawImage(IMG[k], 0, 0, 1086, 1920); }
  function velo(ctx, color, a) { if (a <= 0) return; ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = clamp(a); ctx.fillStyle = color; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  // Escala en profundidad: k (px/cm) crece linealmente con la y del suelo; yh = horizonte.
  const escala = (k0, y0, yh) => y => (k0 * (y - yh)) / (y0 - yh);
  // Calzada de asfalto para la parte inferior que la imagen dejó vacía.
  function calzada(ctx, y0, bordillo = true) {
    const g = ctx.createLinearGradient(0, y0, 0, 1920); g.addColorStop(0, '#77736b'); g.addColorStop(1, '#5d5a54');
    ctx.fillStyle = g; ctx.fillRect(-300, y0, 1700, 2000 - y0);
    if (bordillo) { ctx.fillStyle = '#cfc8b8'; ctx.fillRect(-300, y0 - 6, 1700, 18); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-300, y0 - 6); ctx.lineTo(1400, y0 - 6); ctx.moveTo(-300, y0 + 12); ctx.lineTo(1400, y0 + 12); ctx.stroke(); }
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    for (let i = 0; i < 260; i++) { ctx.fillRect(hash(i) * 1086, y0 + 14 + hash(i * 3.3) * (1920 - y0), 2 + hash(i * 7) * 4, 2); }
  }

  // ---------- personajes (alturas reales en cm) ----------
  const ABUELO = { altura: 166, sexo: 'h', piel: '#e2b08a', pelo: '#9a9288', canas: 1, peinado: 'calvo', gafas: true, arrugas: 1, barba: 0.35, colorBarba: '#d8d4cc',
    camisa: '#e6dfcf', chaqueta: '#86664a', pantalon: '#6a6862', zapatos: '#3a2a20', ojos: '#5a4a3a', complexion: 0.96 };
  const NINA = { altura: 116, cabezas: 5.8, sexo: 'm', piel: '#c98d62', pelo: '#2a1a12', peinado: 'coleta', camisa: '#f0c23a', manga: 'corta', cuello: 'redondo', falda: { color: '#f0c23a', largo: 'rodilla' }, zapatos: '#c0453a', ojos: '#3a2a1e' };
  const MAMA = { altura: 164, sexo: 'm', piel: '#c98d62', pelo: '#2a1a12', peinado: 'largo', camisa: '#4f7f9a', cuello: 'pico', pantalon: '#2f3440', zapatos: '#5a3a2a', labios: '#a8504a' };
  const ADOLESCENTE = { altura: 168, cabezas: 7.1, sexo: 'h', piel: '#efc6a2', pelo: '#3a2a1e', peinado: 'corto', camisa: '#5d6b80', cuello: 'redondo', pantalon: '#3a4150', zapatos: '#e6e2da' };
  const GENTE = [
    { altura: 180, sexo: 'h', piel: '#f0c9a5', pelo: '#2a211c', peinado: 'corto', camisa: '#ffffff', chaqueta: '#3d4552', corbata: '#7a2f2f', pantalon: '#3d4552', zapatos: '#1f1f24' },
    { altura: 166, sexo: 'm', piel: '#eec6a4', pelo: '#b07a3a', peinado: 'largo', camisa: '#c95b4f', cuello: 'pico', pantalon: '#3b4250', zapatos: '#2a2420', labios: '#b0504a' },
    { altura: 175, sexo: 'h', piel: '#8d5a3b', pelo: '#1b1b1b', peinado: 'corto', camisa: '#6aa86b', cuello: 'redondo', manga: 'corta', pantalon: '#4a4238', zapatos: '#e6e2da' },
    { altura: 162, sexo: 'm', piel: '#f5d6bd', pelo: '#2a211c', peinado: 'mono', camisa: '#9a6bc9', cuello: 'redondo', falda: { color: '#2f3a45', largo: 'rodilla' }, zapatos: '#2a2420', labios: '#b0504a' },
    { altura: 183, sexo: 'h', piel: '#c68b60', pelo: '#3a2a1e', peinado: 'corto', camisa: '#d9b44a', cuello: 'redondo', pantalon: '#2f3a45', zapatos: '#3b2a20', barba: 0.7 },
    { altura: 170, sexo: 'h', piel: '#e0ac83', pelo: '#5a3a22', peinado: 'corto', camisa: '#4ab0b0', cuello: 'camisa', pantalon: '#55504a', zapatos: '#2a2522', gafas: true },
    { altura: 158, sexo: 'm', piel: '#a96f4a', pelo: '#1b1b1b', peinado: 'mono', camisa: '#e08a3c', cuello: 'pico', pantalon: '#46505a', zapatos: '#2a2420', labios: '#9a4040' },
    { altura: 172, sexo: 'm', piel: '#f1c9a5', pelo: '#7a3b22', peinado: 'largo', camisa: '#5b7fc9', cuello: 'redondo', pantalon: '#2f3440', zapatos: '#e6e2da' },
  ];

  // ---------- poses de manos (coordenadas del cuerpo, cm) ----------
  const colgando = lado => (sx, sy, M) => ({ x: sx + lado * M.H * 0.012, y: sy + (M.brazo + M.antebrazo) * 0.97, tipo: 'relajada' });
  const movilD = (sx, sy) => ({ x: -2, y: sy + 13, tipo: 'agarra', objeto: 'movil', escorzo: 0.55 });
  const enRegazo = lado => (sx, sy, M) => ({ x: lado * M.H * 0.07, y: M.H * 0.04, tipo: 'relajada', escorzo: 0.75 });
  // grabar: el móvil en horizontal delante de la cara, sujeto con las dos manos
  const grabaI = s => (sx, sy, M) => ({ x: -M.H * 0.045, y: sy - M.H * 0.035 * s, tipo: 'agarra', escorzoB: 0.78, escorzo: 1.15 });
  const grabaD = s => (sx, sy, M) => ({ x: M.H * 0.045, y: sy - M.H * 0.035 * s, tipo: 'agarra', escorzoB: 0.78, escorzo: 1.15 });
  const manoEn = (r, x, y, k, lado) => { const b = r.brazos.find(q => q.lado === lado); return [x + b.tx * k, y + b.ty * k]; };

  // móvil grabando (vemos la parte de atrás) y el punto rojo parpadeante
  function movilGrabando(ctx, r, x, y, k, t, seed, sube = 1) {
    const [ax, ay] = manoEn(r, x, y, k, -1), [bx, by] = manoEn(r, x, y, k, 1);
    const mx = (ax + bx) / 2, my = (ay + by) / 2 - 3 * k;
    ctx.save(); ctx.translate(mx, my); ctx.scale(k, k);
    ctx.fillStyle = '#23252a'; ctx.strokeStyle = INK; ctx.lineWidth = 0.55;
    rrect(ctx, -8, -4, 16, 8, 1.2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#4a4d55'; rrect(ctx, -6.8, -3, 4, 3.4, 0.7); ctx.fill();
    ctx.fillStyle = '#0d0d0f'; ctx.beginPath(); ctx.arc(-5.6, -1.9, 0.75, 0, 7); ctx.arc(-4, -1.9, 0.75, 0, 7); ctx.fill();
    ctx.restore();
    if (sube > 0.5 && Math.floor(t * 2.2 + hash(seed) * 2) % 2 === 0) {
      ctx.save(); ctx.globalAlpha = 0.95; ctx.fillStyle = '#ff2d2d'; ctx.strokeStyle = '#fff'; ctx.lineWidth = Math.max(1.5, k * 0.4);
      ctx.beginPath(); ctx.arc(mx, my - 9 * k, Math.max(4, 2.2 * k), 0, 7); ctx.fill(); ctx.stroke(); ctx.restore();
    }
    return [mx, my];
  }
  function naranja(ctx, x, y, r, rot = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.fillStyle = '#f08a24'; ctx.strokeStyle = INK; ctx.lineWidth = Math.max(1.5, r * 0.14);
    ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.arc(-r * 0.35, -r * 0.35, r * 0.3, 0, 7); ctx.fill();
    ctx.fillStyle = '#4c7a2e'; ctx.beginPath(); ctx.ellipse(r * 0.15, -r * 0.92, r * 0.35, r * 0.16, 0.4, 0, 7); ctx.fill();
    ctx.restore();
  }
  function bolsa(ctx, x, y, k, rot = 0, llena = true) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(k, k);
    if (llena) { naranja(ctx, -5, -22, 4.2); naranja(ctx, 4, -23, 4.2); ctx.fillStyle = '#e2b56a'; ctx.strokeStyle = INK; ctx.lineWidth = 0.5; rrect(ctx, 0, -32, 5, 18, 2); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = '#c9a06a'; ctx.strokeStyle = INK; ctx.lineWidth = 0.55;
    ctx.beginPath(); ctx.moveTo(-12, -20); ctx.lineTo(12, -20); ctx.lineTo(13, 6); ctx.lineTo(-13, 6); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(40,30,20,0.4)'; ctx.beginPath(); ctx.moveTo(-12, -16); ctx.lineTo(12, -16); ctx.moveTo(-6, -20); ctx.lineTo(-7, 6); ctx.stroke();
    ctx.restore();
  }
  // iconos que flotan desde los móviles: corazón, ojo (vistas), pulgar
  function icono(ctx, tipo, x, y, s, a) {
    ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.scale(s, s); ctx.strokeStyle = INK; ctx.lineWidth = 3;
    if (tipo === 0) { ctx.fillStyle = '#ff3b5c'; ctx.beginPath(); ctx.moveTo(0, 18); ctx.bezierCurveTo(-30, -2, -15, -26, 0, -10); ctx.bezierCurveTo(15, -26, 30, -2, 0, 18); ctx.fill(); ctx.stroke(); }
    else if (tipo === 1) { ctx.fillStyle = '#fbf8f0'; ctx.beginPath(); ctx.moveTo(-22, 0); ctx.quadraticCurveTo(0, -20, 22, 0); ctx.quadraticCurveTo(0, 20, -22, 0); ctx.fill(); ctx.stroke(); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(0, 0, 7, 0, 7); ctx.fill(); }
    else { ctx.fillStyle = '#2f7bff'; ctx.beginPath(); ctx.arc(0, 0, 20, 0, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.fillRect(-9, -2, 5, 11); rrect(ctx, -3, -4, 13, 13, 2); ctx.fill(); ctx.beginPath(); ctx.moveTo(-2, -3); ctx.lineTo(2, -13); ctx.lineTo(6, -12); ctx.lineTo(5, -3); ctx.fill(); }
    ctx.restore();
  }
  function iconos(ctx, x, y, t, t0, t1, seed, s = 1, ritmo = 0.6) {
    for (let k = 0; ; k++) {
      const ts = t0 + k * ritmo + hash(seed + k) * 0.2; if (ts > t1) break;
      const a = (t - ts) / 1.4; if (a < 0 || a > 1) continue;
      const tipo = Math.floor(hash(seed + k * 3) * 3);
      icono(ctx, tipo, x + (Math.sin(a * 5 + k) * 22 + (hash(seed + k * 7) - 0.5) * 70) * s, y - a * 260 * s, (0.6 + a * 0.4) * s, a < 0.15 ? a / 0.15 : 1 - Math.max(0, a - 0.7) / 0.3);
    }
  }
  // contador de vistas: ojo + cifra que sube (los números se entienden en todo el mundo)
  function contador(ctx, n, a = 1) {
    if (a <= 0) return;
    const s = Math.floor(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = a;
    ctx.font = '800 58px "Inter Display", Inter, system-ui, sans-serif';
    const w = ctx.measureText(s).width + 130;
    ctx.fillStyle = 'rgba(15,15,18,0.72)'; rrect(ctx, 540 - w / 2, 120, w, 92, 46); ctx.fill();
    ctx.fillStyle = '#ff2d2d'; ctx.beginPath(); ctx.arc(540 - w / 2 + 44, 166, 14, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.textBaseline = 'middle'; ctx.fillText(s, 540 - w / 2 + 78, 168);
    ctx.restore();
  }
  function flash(ctx, x, y, r, a) {
    if (a <= 0) return;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 3; ctx.beginPath();
    for (let i = 0; i < 4; i++) { const an = i * Math.PI / 4; ctx.moveTo(x - Math.cos(an) * r * 0.9, y - Math.sin(an) * r * 0.9); ctx.lineTo(x + Math.cos(an) * r * 0.9, y + Math.sin(an) * r * 0.9); }
    ctx.stroke(); ctx.restore();
  }
  // una persona que llega caminando de lado y se para a grabar
  function mirón(ctx, P, x0, x1, y, kE, t, tLlega, seed, o = {}) {
    if (t < tLlega - 1.6) return null;
    const k = kE(y), anda = ease(inv(tLlega - 1.6, tLlega, t)), x = lerp(x0, x1, anda);
    const sube = ease(inv(tLlega + 0.15, tLlega + 0.7, t));
    const dir = Math.sign(x1 - x0) || 1;
    const O = anda < 1
      ? { modo: 'camina', fase: t * 8 + seed, lateral: 1, dir, giro: 0.5 * dir, manoD: movilD, baja: 0.7, gesto: 'neutral', luzMovil: 0.6 }
      : { manoI: (sx, sy, M) => { const g = grabaI(1)(sx, sy, M), c = colgando(-1)(sx, sy, M); return { ...g, x: lerp(c.x, g.x, sube), y: lerp(c.y, g.y, sube), tipo: sube > 0.3 ? 'agarra' : 'relajada' }; },
          manoD: (sx, sy, M) => { const g = grabaD(1)(sx, sy, M), m = movilD(sx, sy); return { ...g, x: lerp(m.x, g.x, sube), y: lerp(m.y, g.y, sube), escorzo: lerp(0.55, 0.55, sube), objeto: sube < 0.3 ? 'movil' : undefined }; },
          giro: o.giro ?? 0, mirada: { x: o.mira ?? 0, y: 0.2 }, gesto: o.gesto || 'neutral', luzMovil: 0.5 * sube, parpadeo: ((t + seed) % 3.1) < 0.12 };
    const r = persona(ctx, x, y, k, P, O);
    let cam = null;
    if (anda >= 1 && sube > 0.25) cam = movilGrabando(ctx, r, x, y, k, t, seed, sube);
    return { r, x, y, k, cam };
  }

  // ======================= 0–6 s: el abuelo sale de casa con su bolsa vacía =======================
  function escena1(ctx, t) {
    ctx.save(); camara(ctx, lerp(1.42, 1.5, t / 6), lerp(470, 640, t / 6), 1080);
    fondo(ctx, 'casa');
    calzada(ctx, 1405);
    const kE = escala(2.6, 1330, 1330 - 150 * 2.6);
    const y = 1345, k = kE(y);
    const anda = inv(1.2, 6, t), x = lerp(290, 1000, anda);
    persona(ctx, x, y, k, ABUELO, {
      modo: t > 1.2 ? 'camina' : 'pie', fase: t * 6.5, lateral: 1, dir: 1, giro: t > 1.2 ? 0.5 : 0, encorvado: 0.6, gesto: t < 1.2 ? 'sonrie' : 'neutral',
      manoD: (sx, sy, M) => ({ x: sx + 4, y: sy + 52 + (t > 1.2 ? Math.sin(t * 6.5) * 2 : 0), tipo: 'agarra' }), parpadeo: t > 0.6 && t < 0.72,
    });
    // bolsa de tela vacía colgando de la mano
    { const M = FIG.medidas(ABUELO); ctx.save(); ctx.translate(x + (M.hombro - M.H * 0.036 + 4) * k * 1.02, y + (M.hombroY + M.H * 0.026 + 52 + 6) * k); ctx.rotate(Math.sin(t * 6.5) * 0.08 * (t > 1.2 ? 1 : 0));
      ctx.fillStyle = '#d9cfb8'; ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-9 * k, 0); ctx.lineTo(9 * k, 0); ctx.lineTo(11 * k, 30 * k); ctx.lineTo(-11 * k, 30 * k); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); }
    ctx.restore();
  }

  // ======================= 6–12 s: sale de la tienda con pan y naranjas y camina hacia nosotros =======================
  function escena2(ctx, t) {
    const lt = t - 6;
    ctx.save(); camara(ctx, 1.0);
    fondo(ctx, 'tienda');
    const kE = escala(2.5, 1232, 855);
    const anda = ease(inv(0.6, 6, lt)), y = lerp(1236, 1700, anda), x = lerp(486, 610, anda), k = kE(y);
    const r = persona(ctx, x, y, k, ABUELO, {
      modo: anda > 0 && anda < 1 ? 'camina' : 'pie', fase: lt * 6.2, lateral: 0, encorvado: 0.6, gesto: 'sonrie', mirada: { x: 0.3, y: 0 },
      manoD: (sx, sy, M) => ({ x: sx + 3, y: sy + 50, tipo: 'agarra' }), parpadeo: lt > 3 && lt < 3.12,
    });
    const [hx, hy] = manoEn(r, x, y, k, 1); bolsa(ctx, hx + 2 * k, hy + 22 * k, k, Math.sin(lt * 6.2) * 0.05);
    ctx.restore();
  }

  // ======================= 12–20 s: la acera; se tropieza y todos sacan el móvil =======================
  const CAIDA = 15.0;
  function naranjasRodando(ctx, t, kE, x0, y0) {
    for (let i = 0; i < 5; i++) {
      const v = (hash(i * 5.1) - 0.35) * 220, yy = y0 + 4 + hash(i * 2.3) * 22, d = easeOut(clamp((t - CAIDA - 0.1) / 2.2));
      const x = x0 + v * d * (1 + i * 0.25), k = kE(yy);
      naranja(ctx, x, yy - 4 * k, 4 * k, d * v * 0.05);
    }
  }
  function escena3(ctx, t) {
    const lt = t - 12;
    const acerca = ease(inv(16.2, 20, t));
    ctx.save(); camara(ctx, lerp(2.0, 2.6, acerca), lerp(560, 470, acerca), lerp(900, 960, acerca));
    fondo(ctx, 'ancha');
    calzada(ctx, 1310, false);
    const kE = escala(1.3, 1000, 805);
    // transeúntes mirando el móvil; al caer el abuelo se paran a grabar
    const pasan = [
      { P: GENTE[0], y: 1018, x0: 980, v: -55, para: 16.0 },
      { P: GENTE[1], y: 1050, x0: 80, v: 50, para: 16.7 },
      { P: GENTE[2], y: 985, x0: 1100, v: -60, para: 17.3 },
      { P: GENTE[3], y: 1062, x0: 860, v: -42, para: 17.9 },
    ];
    for (const [i, p] of pasan.entries()) {
      const tt = Math.min(t, p.para), x = p.x0 + p.v * (tt - 12), k = kE(p.y);
      const sube = ease(inv(p.para + 0.2, p.para + 0.7, t));
      const dirAb = Math.sign(470 - x);
      const O = t < p.para
        ? { modo: 'camina', fase: t * 8 + i, lateral: 1, dir: Math.sign(p.v), giro: 0.5 * Math.sign(p.v), manoD: movilD, baja: 0.8, gesto: 'cansado', luzMovil: 0.7 }
        : { giro: 0.45 * dirAb, mirada: { x: dirAb, y: 0.3 }, luzMovil: 0.5,
            manoI: (sx, sy, M) => { const g = grabaI(1)(sx, sy, M), c = colgando(-1)(sx, sy, M); return { ...g, x: lerp(c.x, g.x, sube), y: lerp(c.y, g.y, sube) }; },
            manoD: (sx, sy, M) => { const g = grabaD(1)(sx, sy, M), m = movilD(sx, sy); return { ...g, x: lerp(m.x, g.x, sube), y: lerp(m.y, g.y, sube), objeto: sube < 0.3 ? 'movil' : undefined }; } };
      const r = persona(ctx, x, p.y, k, p.P, O);
      if (t >= p.para && sube > 0.25) movilGrabando(ctx, r, x, p.y, k, t, i * 3, sube);
    }
    // el abuelo
    const y = 1072, k = kE(y);
    const xA = lerp(120, 470, clamp((Math.min(t, CAIDA) - 12) / 3));
    if (t < CAIDA) {
      const r = persona(ctx, xA, y, k, ABUELO, { modo: 'camina', fase: t * 6.5, lateral: 1, dir: 1, giro: 0.5, encorvado: 0.6, gesto: 'sonrie', manoD: (sx, sy) => ({ x: sx + 3, y: sy + 50, tipo: 'agarra' }) });
      const [hx, hy] = manoEn(r, xA, y, k, 1); bolsa(ctx, hx + 2 * k, hy + 22 * k, k);
    } else if (t < CAIDA + 0.35) {
      // tropieza: el cuerpo se va hacia delante
      const c = easeIn((t - CAIDA) / 0.35);
      ctx.save(); ctx.translate(xA + 10 * k, y); ctx.rotate(c * 1.25); ctx.translate(-xA - 10 * k, -y);
      persona(ctx, xA, y, k, ABUELO, { modo: 'camina', fase: CAIDA * 6.5, lateral: 1, dir: 1, giro: 0.5, gesto: 'sorpresa', manoI: (sx, sy) => ({ x: sx + 10, y: sy - 10, tipo: 'abierta', codo: -1 }), manoD: (sx, sy) => ({ x: sx + 18, y: sy - 5, tipo: 'abierta', codo: -1 }) });
      ctx.restore();
    } else {
      persona(ctx, xA + 25 * k, y + 2 * k, k, ABUELO, { modo: 'suelo', flex: [0.1, 0.7], gesto: 'triste', encorvado: 0.8, inclina: -0.12,
        manoI: (sx, sy, M) => ({ x: -26, y: 2, tipo: 'abierta' }), manoD: (sx, sy, M) => ({ x: 26, y: 2, tipo: 'abierta' }) });
      bolsa(ctx, xA + 70 * k, y + 4 * k, k, 1.4, false);
    }
    if (t > CAIDA) naranjasRodando(ctx, t, kE, xA + 40 * k, y);
    ctx.restore();
    if (t > CAIDA + 0.3 && t < CAIDA + 0.42) velo(ctx, '#000', 0.25);
    contador(ctx, Math.pow(inv(16, 20, t), 2) * 4800, inv(16, 16.5, t));
  }

  // ======================= 20–36 s: el círculo de móviles; una niña le da la mano =======================
  const kC = escala(2, 800, 500); // cerca: horizonte en y≈500
  const MIRONES = [
    { P: GENTE[4], x0: -200, x1: 120, y: 1215, t: 20.6 },
    { P: GENTE[5], x0: 1300, x1: 960, y: 1225, t: 21.1 },
    { P: GENTE[0], x0: -200, x1: 300, y: 1170, t: 21.7, giro: 0.2 },
    { P: GENTE[1], x0: 1300, x1: 640, y: 1150, t: 22.2 },
    { P: GENTE[6], x0: -200, x1: 440, y: 1135, t: 22.9 },
    { P: GENTE[2], x0: 1300, x1: 400, y: 1110, t: 23.6 },
    { P: GENTE[7], x0: -200, x1: 560, y: 1100, t: 24.3 },
  ];
  function escena4(ctx, t, enMovil = false) {
    const lt = t - 20;
    const z = enMovil ? 1 : lerp(1.0, 1.08, lt / 16);
    ctx.save(); camara(ctx, z, 543, lerp(960, 990, lt / 16));
    fondo(ctx, 'cerca');
    // fondo de la multitud (más lejos primero)
    const orden = [...MIRONES].sort((a, b) => a.y - b.y);
    const cams = [];
    const levanta = t > 33.0, ayuda = ease(inv(27.2, 29.6, t));
    // la mamá que graba y la niña (de la mano hasta que se suelta)
    const yMa = 1205, kMa = kC(yMa);
    for (const m of orden) {
      if (m.y < yMa && m.y >= 1100) { const q = mirón(ctx, m.P, m.x0, m.x1, m.y, kC, t, m.t, m.x1, { giro: m.giro, mira: (540 - m.x1) / 500 }); if (q?.cam) cams.push(q.cam); }
    }
    const xMa = 820;
    const rMa = persona(ctx, xMa, yMa, kMa, MAMA, { giro: -0.3, mirada: { x: -0.6, y: 0.3 }, luzMovil: 0.5, manoI: grabaI(1), manoD: grabaD(1) });
    cams.push(movilGrabando(ctx, rMa, xMa, yMa, kMa, t, 77, 1));
    for (const m of orden) if (m.y >= yMa) { const q = mirón(ctx, m.P, m.x0, m.x1, m.y, kC, t, m.t, m.x1, { giro: m.giro, mira: (540 - m.x1) / 500 }); if (q?.cam) cams.push(q.cam); }
    // naranjas por el suelo
    for (const [nx, ny, r] of [[300, 1640, 0], [770, 1590, 1], [880, 1700, 2], [610, 1730, 3]]) if (!(levanta && r === 0)) naranja(ctx, nx, ny, 4 * kC(ny), r);
    // la niña
    const xN = lerp(735, 700, ayuda), yN = lerp(1212, 1535, ayuda), kN = kC(yN);
    const MN = FIG.medidas(NINA), manoNinaY = MN.hombroY + MN.H * 0.026 + 44; // altura de su mano tendida (cm, coords del cuerpo)
    const manoNina = [xN - 34 * kN, yN + manoNinaY * kN];
    // el abuelo en el suelo (o ya de pie)
    const yA = 1530, kA = kC(yA), xA = 520;
    if (!levanta) {
      const intenta = lt > 1 && lt < 6.5 ? Math.max(0, Math.sin((lt - 1) * 2.4)) : 0;
      const pide = ease(inv(4.2, 5.2, lt)) * (1 - ease(inv(6.8, 7.4, lt)));
      const coge = ease(inv(30.6, 31.8, t));
      persona(ctx, xA, yA, kA, ABUELO, {
        modo: 'suelo', flex: [0.1, 0.7], encorvado: 0.7 - intenta * 0.4,
        gesto: coge > 0.5 ? 'sonrie' : 'triste', giro: coge > 0 ? 0.5 * coge : Math.sin(lt * 0.8) * 0.4, mirada: { x: coge > 0 ? 1 : Math.sin(lt * 0.8), y: -0.6 },
        inclina: -0.05,
        manoI: (sx, sy, M) => ({ x: -26 + intenta * 4, y: 2 - intenta * 6, tipo: 'abierta' }),
        manoD: (sx, sy, M) => {
          if (coge > 0) return { x: lerp(26, (manoNina[0] - xA) / kA, coge), y: lerp(2, (manoNina[1] - yA) / kA, coge), tipo: coge > 0.6 ? 'agarra' : 'abierta', codo: 1 };
          return { x: lerp(26, 30, pide), y: lerp(2, sy - 30, pide), tipo: 'abierta', codo: -1 };
        },
      });
    }
    // la niña: de la mano de su madre → se suelta → camina hacia él con una naranja → le tiende la mano
    {
      const camina = ayuda > 0 && ayuda < 1;
      const tiende = ease(inv(29.8, 30.6, t));
      persona(ctx, xN, yN, kN, NINA, {
        modo: camina ? 'camina' : 'pie', fase: t * 8, lateral: 0, gesto: t < 27 ? 'triste' : levanta ? 'feliz' : 'sonrie', giro: t < 27 ? -0.2 : levanta ? 0.5 : -0.4, mirada: { x: t < 27 ? -1 : -0.5, y: 0.2 },
        manoD: t < 27 ? ((sx, sy, M) => ({ x: (xMa - 25 * kMa - xN) / kN, y: (yMa - 82 * kMa - yN) / kN, tipo: 'agarra', codo: -1 })) : colgando(1),
        manoI: levanta ? ((sx, sy, M) => ({ x: -34, y: manoNinaY, tipo: 'agarra' }))
          : (sx, sy, M) => ({ x: lerp(sx - 3, -34, tiende), y: lerp(sy + 42, manoNinaY, tiende), tipo: tiende > 0.5 ? 'abierta' : 'agarra', codo: 1 }),
      });
      if (!levanta && t > 28) { const M = FIG.medidas(NINA); naranja(ctx, xN + (M.hombro - M.H * 0.036 + 2) * kN, yN + (M.hombroY + 0.026 * M.H + 44) * kN, 4 * kN); }
    }
    if (levanta) {
      // ya de pie, de la mano de la niña; la gente sigue grabando (ahora a ella)
      persona(ctx, xA, yA, kA, ABUELO, { encorvado: 0.7, gesto: 'sonrie', giro: 0.5, mirada: { x: 1, y: 0.6 }, manoD: (sx, sy, M) => ({ x: (manoNina[0] - xA) / kA, y: (manoNina[1] - yA) / kA, tipo: 'agarra' }), manoI: colgando(-1) });
      bolsa(ctx, xA - 40 * kA, yA, kA, 0.2);
    }
    ctx.restore();
    if (!enMovil) {
      // iconos de corazones y vistas saliendo de los móviles; flashes cuando ella le ayuda
      ctx.save(); camara(ctx, z, 543, lerp(960, 990, lt / 16));
      cams.forEach((c, i) => iconos(ctx, c[0], c[1] - 40, t, 21 + i * 0.3, 36, 40 + i * 7, 0.8, t > 31 ? 0.25 : 0.8));
      if (t > 31) cams.forEach((c, i) => flash(ctx, c[0], c[1], 90, clamp(1 - ((t * 3 + hash(i) * 7) % 2.3) * 2.5)));
      ctx.restore();
      if (levanta && t < 33.15) velo(ctx, '#fff', 0.7);
      contador(ctx, 4800 + Math.pow(inv(20, 31, t), 1.6) * 180000 + Math.pow(inv(31, 36, t), 2) * 2400000, 1);
    }
  }

  // ======================= 36–44 s: de noche, alguien lo ve en su móvil, le da like y pasa al siguiente =======================
  function pantallaClip(ctx, t, tClip, desliza) {
    // contenido de la pantalla: el vídeo del abuelo y la niña; al deslizar, entra otro vídeo
    ctx.save(); ctx.translate(0, -desliza * H);
    escena4(ctx, tClip, true);
    ctx.restore();
    if (desliza > 0) {
      ctx.save(); ctx.translate(0, (1 - desliza) * H);
      const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#ff7eb3'); g.addColorStop(1, '#7a5cff');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 14; i++) { ctx.fillStyle = ['#ffe14d', '#fff', '#4dffd2'][i % 3]; ctx.beginPath(); ctx.arc(hash(i) * W, (hash(i * 2) * H + t * 400) % H, 30 + hash(i * 5) * 50, 0, 7); ctx.fill(); }
      persona(ctx, 540, 1500 - Math.abs(Math.sin(t * 6)) * 80, 6, { ...GENTE[7], camisa: '#ffe14d' }, { modo: 'salto', altoSalto: 4, gesto: 'feliz', manoI: (sx, sy, M) => ({ x: sx - 20, y: sy - 40 + Math.sin(t * 12) * 8, tipo: 'abierta', codo: -1 }), manoD: (sx, sy, M) => ({ x: sx + 20, y: sy - 40 - Math.sin(t * 12) * 8, tipo: 'abierta', codo: -1 }) });
      ctx.restore();
    }
    // botones de la red social: corazón, comentario, compartir
    ctx.save(); ctx.setTransform(ctx.getTransform());
    const ui = (y, f) => { ctx.save(); ctx.translate(960, y); f(); ctx.restore(); };
    ui(1180, () => { icono(ctx, 0, 0, 0, 2.2, 1); });
    ui(1350, () => { ctx.fillStyle = '#fff'; ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.beginPath(); ctx.ellipse(0, 0, 46, 36, 0, 0, 7); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-20, 28); ctx.lineTo(-34, 52); ctx.lineTo(0, 34); ctx.fill(); });
    ui(1510, () => { ctx.fillStyle = '#fff'; ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-40, 30); ctx.quadraticCurveTo(-30, -20, 14, -18); ctx.lineTo(14, -40); ctx.lineTo(48, -4); ctx.lineTo(14, 30); ctx.lineTo(14, 8); ctx.quadraticCurveTo(-20, 6, -40, 30); ctx.fill(); ctx.stroke(); });
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(60, 1840, 960, 10); ctx.fillStyle = '#fff'; ctx.fillRect(60, 1840, 960 * ((t * 0.18) % 1), 10);
    ctx.restore();
  }
  function telefonoGrande(ctx, t, x, y, s, contenido, pantallaOn = 1) {
    // marco del móvil y la pantalla (contenido dibujado a tamaño 1080×1920, escalado)
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = '#16171b'; rrect(ctx, -W / 2 - 40, -H / 2 - 40, W + 80, H + 80, 110); ctx.fill();
    ctx.strokeStyle = '#3a3c42'; ctx.lineWidth = 8; ctx.stroke();
    ctx.save(); rrect(ctx, -W / 2, -H / 2, W, H, 80); ctx.clip();
    ctx.translate(-W / 2, -H / 2);
    if (pantallaOn > 0) { ctx.save(); contenido(ctx); ctx.restore(); }
    if (pantallaOn < 1) { ctx.fillStyle = `rgba(6,7,9,${1 - pantallaOn})`; ctx.fillRect(0, 0, W, H); }
    ctx.restore();
    ctx.fillStyle = '#000'; rrect(ctx, -90, -H / 2 + 24, 180, 44, 22); ctx.fill();
    ctx.restore();
  }
  function manoGrande(ctx, x, y, s, pulgar) {
    // mano en primera persona sujetando el móvil desde abajo
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    const piel = '#e8bc96';
    ctx.strokeStyle = INK; ctx.lineWidth = 7; ctx.lineJoin = 'round';
    ctx.fillStyle = '#3a4a6a'; ctx.beginPath(); ctx.moveTo(-260, 700); ctx.lineTo(-170, 260); ctx.lineTo(170, 260); ctx.lineTo(260, 700); ctx.closePath(); ctx.fill(); ctx.stroke(); // manga
    ctx.fillStyle = piel;
    ctx.beginPath(); ctx.moveTo(-200, 300); ctx.quadraticCurveTo(-260, 60, -150, -40); ctx.lineTo(150, -40); ctx.quadraticCurveTo(250, 60, 200, 300); ctx.closePath(); ctx.fill(); ctx.stroke(); // palma
    for (const dy of [-150, -60, 30]) { ctx.beginPath(); ctx.ellipse(-205, dy, 52, 40, 0.2, 0, 7); ctx.fill(); ctx.stroke(); } // dedos por la izquierda
    // pulgar (se mueve hacia el corazón)
    const [px, py] = pulgar;
    ctx.beginPath(); ctx.moveTo(130, 40); ctx.quadraticCurveTo(px * 0.4 + 60, py * 0.5 - 40, px, py); ctx.lineWidth = 92; ctx.strokeStyle = INK; ctx.lineCap = 'round'; ctx.stroke();
    ctx.lineWidth = 78; ctx.strokeStyle = piel; ctx.stroke();
    ctx.fillStyle = '#f3d4b8'; ctx.beginPath(); ctx.ellipse(px, py, 22, 16, -0.6, 0, 7); ctx.fill();
    ctx.restore();
  }
  function escena5(ctx, t) {
    const lt = t - 36;
    if (lt < 3) {
      // el chico en la cama, la habitación a oscuras iluminada por el móvil
      ctx.save(); camara(ctx, lerp(1.45, 1.6, lt / 3), 470, 1100);
      fondo(ctx, 'cuarto');
      const X = 470, Y = 1160, k = 3.6;
      const r = persona(ctx, X, Y, k, ADOLESCENTE, { modo: 'sentado', piesY: 40, sombra: false, sombraAsiento: false, manoD: movilD, manoI: (sx, sy) => ({ x: sx + 2, y: sy + 56, tipo: 'relajada' }), baja: 0.85, gesto: 'sonrie', luzMovil: 1, encorvado: 0.5 });
      // edredón sobre las piernas
      ctx.fillStyle = '#5a6d8a'; ctx.strokeStyle = INK; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(230, 1180); ctx.bezierCurveTo(320, 1130, 620, 1140, 710, 1175); ctx.lineTo(790, 1470); ctx.bezierCurveTo(600, 1500, 330, 1500, 150, 1470); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(380, 1200); ctx.quadraticCurveTo(400, 1330, 370, 1460); ctx.moveTo(560, 1195); ctx.quadraticCurveTo(580, 1330, 610, 1460); ctx.stroke();
      const [mx, my] = manoEn(r, X, Y, k, 1);
      ctx.restore();
      // noche: todo oscuro salvo el brillo del móvil y la lámpara
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = 'rgba(8,14,32,0.45)'; ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      const z = lerp(1.45, 1.6, lt / 3), sx = W / 2 + (mx - 470) * z, sy = H / 2 + (my - 1100) * z;
      const g = ctx.createRadialGradient(sx, sy, 10, sx, sy, 520); g.addColorStop(0, 'rgba(110,170,255,0.5)'); g.addColorStop(1, 'rgba(90,150,255,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.restore();
      return;
    }
    // primer plano de la pantalla: doble toque (corazón) y desliza al siguiente vídeo
    ctx.fillStyle = '#0b0d14'; ctx.fillRect(0, 0, W, H);
    const desliza = ease(inv(42, 42.6, t));
    const toque = t > 40.4 && t < 41.6;
    telefonoGrande(ctx, t, 540, 930, 0.8, c => {
      pantallaClip(c, t, 31.5 + (t - 39) * 0.8, desliza);
      if (toque) { const a = (t - 40.4) / 1.2; icono(c, 0, 540, 900 - a * 120, 6 + a * 3, a < 0.2 ? a * 5 : 1 - (a - 0.2) / 0.8); }
    });
    const tap = t > 40.2 && t < 40.6 ? Math.abs(Math.sin((t - 40.2) * Math.PI * 5)) : 0;
    const pul = desliza > 0 && desliza < 1 ? [20, -260 - desliza * 300] : [40 - tap * 20, -200 + tap * 40];
    manoGrande(ctx, 600, 1620, 1, pul);
  }

  // ======================= 44–52 s: el abuelo, solo en su cocina =======================
  function escena6(ctx, t, enMovil = false) {
    const lt = t - 44;
    ctx.save(); camara(ctx, enMovil ? 1.18 : lerp(1.1, 1.22, clamp(lt / 8)), 530, 1150);
    fondo(ctx, 'cocina');
    const k = 5.8, X = 520, Y = 1408;
    const muerde = Math.max(0, Math.sin(lt * 1.3)) > 0.6;
    persona(ctx, X, Y, k, ABUELO, { modo: 'sentado', piesY: 46, encorvado: 1, gesto: 'triste', baja: 0.3, giro: Math.sin(lt * 0.5) * 0.25, mirada: { x: 0.4, y: 0.3 }, parpadeo: (lt % 3.3) < 0.13,
      manoI: (sx, sy, M) => ({ x: -12, y: M.H * 0.05, tipo: 'relajada', escorzo: 0.75 }),
      manoD: (sx, sy, M) => ({ x: muerde ? 3 : 14, y: muerde ? sy - 14 : M.H * 0.04, tipo: 'agarra', escorzo: muerde ? 0.5 : 0.75, dibuja: (c, x, y, dir, s) => { c.fillStyle = '#e2b56a'; c.strokeStyle = INK; c.lineWidth = 0.5; c.beginPath(); c.ellipse(x, y - 4 * s, 6 * s, 3.6 * s, 0.3, 0, 7); c.fill(); c.stroke(); } }) });
    bolsa(ctx, 800, 1700, 5.6, 0.05);
    ctx.restore();
    // noche: lámpara cálida y el resto en penumbra
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = 'rgba(12,16,30,0.48)'; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(W * 0.6, 300, 20, W * 0.6, 300, 900); g.addColorStop(0, 'rgba(255,200,120,0.28)'); g.addColorStop(1, 'rgba(255,200,120,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  // ======================= 52–60 s: todo estaba dentro de un móvil... el tuyo =======================
  function escena7(ctx, t) {
    const lt = t - 52;
    const aleja = ease(inv(0, 2.4, lt));
    ctx.fillStyle = '#0b0d12'; ctx.fillRect(0, 0, W, H);
    const s = lerp(1.08, 0.66, aleja), y = lerp(960, 880, aleja);
    const apaga = inv(57.5, 57.62, t);
    telefonoGrande(ctx, t, 540, y, s, c => {
      escena6(c, t);
      // botones de la red social sobre el vídeo
      c.save(); c.translate(960, 1180); icono(c, 0, 0, 0, 2.2, 1); c.restore();
    }, 1 - apaga);
    // reflejo en la pantalla apagada
    if (apaga > 0) {
      ctx.save(); ctx.globalAlpha = 0.18 * inv(57.7, 58.8, t);
      ctx.fillStyle = '#9aa4b8'; ctx.beginPath(); ctx.ellipse(540, y - 120, 150, 190, 0, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.ellipse(540, y + 260, 330, 200, 0, Math.PI, 0); ctx.fill(); ctx.restore();
    }
    // la mano: el pulgar duda sobre el corazón
    const corX = 540 + (960 - 540) * s, corY = y + (1180 - 960) * s;
    const duda = inv(54.6, 55.8, t) * (1 - inv(57.0, 57.5, t));
    const mano = [lerp(40, (corX - 600) + 10, duda) + Math.sin(t * 9) * 6 * duda, lerp(-200, corY - 1640 + 20, duda)];
    manoGrande(ctx, 600, lerp(2100, 1640, aleja), 1, mano);
  }

  const ESCENAS = [[0, 6, escena1], [6, 12, escena2], [12, 20, escena3], [20, 36, escena4], [36, 44, escena5], [44, 52, escena6], [52, 60, escena7]];
  function renderFrame(ctx, t) {
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, W, H);
    const e = ESCENAS.find(([a, b]) => t >= a && t < b) || ESCENAS[ESCENAS.length - 1];
    ctx.save(); e[2](ctx, t); ctx.restore();
    ctx.globalAlpha = 1; ctx.filter = 'none';
    const noche = inv(35.5, 36.5, t);
    post(ctx, W, H, t, { bloom: 0.1, top: mix('#ffe8c0', '#c8d2e8', noche), bottom: mix('#3d5a66', '#1a2030', noche) });
    for (const b of [6, 12, 20, 36, 39, 44]) if (Math.abs(t - b) < 0.12) velo(ctx, '#000', 1 - Math.abs(t - b) / 0.12);
    if (t < 0.6) velo(ctx, '#000', 1 - t / 0.6);
    velo(ctx, '#000', inv(58.8, 60, t));
    ctx.restore();
  }
  window.FELICIDAD = { W, H, DURACION, renderFrame };
})();
