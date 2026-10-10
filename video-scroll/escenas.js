// "Una vida en scroll" — corto vertical (1080×1920) de 60 s, sin texto.
// Fondos: Higgsfield Soul 2.0. Personajes (rig con medidas reales en cm), animación, efectos y música: código.
// Cada escena se dibuja en coordenadas de la imagen de fondo (1086×1920); la escala k (px por cm)
// sale de los muebles de cada fondo: ancho del sofá ≈ 215 cm, mesa ≈ 75 cm, silla ≈ 90 cm, etc.
(function () {
  const { INK, clamp, lerp, inv, ease, easeOut, easeIn, hash, mix, rrect, post } = LIB;
  const { persona } = FIG;
  const W = 1080, H = 1920, DURACION = 60;

  // ---------- fondos ----------
  const NOMBRES = ['01_dormitorio_amanecer', '02_cocina_desayuno', '03_autobus', '04_oficina', '05_sala_primavera', '06_sala_verano', '07_sala_otono', '08_sala_invierno', '09_parque_atardecer', '10_cumpleanos', '11_boda', '12_sala_vieja'];
  const IMG = {};
  window.LISTO = Promise.all(NOMBRES.map(k => new Promise(res => { const i = new Image(); i.onload = res; i.onerror = res; i.src = `fondos/${k}.jpg`; IMG[k] = i; })));
  // Cámara: (cx, cy) es el punto de la imagen que queda en el centro de la pantalla.
  function camara(ctx, z = 1, cx = 543, cy = 960) {
    ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-cx, -cy);
  }
  function fondo(ctx, k, alpha = 1) { ctx.save(); ctx.globalAlpha *= alpha; ctx.drawImage(IMG[k], 0, 0, 1086, 1920); ctx.restore(); }
  // Vuelve a pintar trozos del fondo por encima de los personajes (p. ej. la mesa delante de las piernas).
  function delante(ctx, k, polys) {
    ctx.save(); ctx.beginPath();
    for (const p of polys) {
      if (p.length === 4 && typeof p[0] === 'number') ctx.rect(p[0], p[1], p[2], p[3]);
      else { ctx.moveTo(p[0][0], p[0][1]); for (const q of p.slice(1)) ctx.lineTo(q[0], q[1]); ctx.closePath(); }
    }
    ctx.clip(); ctx.drawImage(IMG[k], 0, 0, 1086, 1920); ctx.restore();
  }
  // Completa la parte inferior que la imagen dejó vacía con un suelo del mismo tono.
  function suelo(ctx, y0, c1, c2, o = {}) {
    const g = ctx.createLinearGradient(0, y0 - 40, 0, 1920);
    g.addColorStop(0, c1 + '00'); g.addColorStop(40 / (1960 - y0), c1); g.addColorStop(1, c2);
    ctx.fillStyle = g; ctx.fillRect(-200, y0 - 40, 1500, 2000 - y0);
    if (o.baldosas) {
      // baldosas en perspectiva hacia el punto de fuga
      const [vx, vy, paso] = o.baldosas;
      ctx.save(); ctx.beginPath(); ctx.rect(-200, y0, 1500, 2000 - y0); ctx.clip();
      ctx.strokeStyle = o.junta || 'rgba(40,36,30,0.35)'; ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = -14; i <= 14; i++) { const x = 543 + i * paso; ctx.moveTo(vx + (x - vx) * ((y0 - vy) / (1920 - vy)), y0); ctx.lineTo(x, 1920); }
      for (let d = 0; d < 12; d++) { const y = vy + (y0 - vy) * Math.pow(1.13, d); if (y > 1940) break; ctx.moveTo(-200, y); ctx.lineTo(1300, y); }
      ctx.stroke(); ctx.restore();
    }
    if (o.hierba) {
      ctx.save(); ctx.strokeStyle = o.hierba; ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.beginPath();
      for (let i = 0; i < 160; i++) {
        const x = hash(i * 3.1) * 1086, y = y0 + Math.pow(hash(i * 7.7), 0.8) * (1920 - y0), s = 0.6 + (y - y0) / (1920 - y0) * 1.6;
        for (let j = -1; j <= 1; j++) { ctx.moveTo(x + j * 5 * s, y); ctx.lineTo(x + j * 9 * s + 2, y - 12 * s); }
      }
      ctx.stroke(); ctx.restore();
    }
  }
  function sombraPiso(ctx, y0, a = 0.22) {
    const g = ctx.createLinearGradient(0, y0, 0, 1920); g.addColorStop(0, 'rgba(40,32,24,0)'); g.addColorStop(1, `rgba(40,32,24,${a})`);
    ctx.fillStyle = g; ctx.fillRect(-200, y0, 1500, 1920 - y0);
  }
  function velo(ctx, color, a) { if (a <= 0) return; ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = clamp(a); ctx.fillStyle = color; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  // Escala en profundidad: k crece linealmente con la y del suelo (horizonte en yh, k0 en y0).
  const escala = (k0, y0, yh) => y => (k0 * (y - yh)) / (y0 - yh);

  // ---------- personajes (alturas reales en cm) ----------
  const papa = e => ({
    altura: 178, sexo: 'h', piel: mix('#e9bf9a', '#dcb08c', e), pelo: '#3a2a1e', peinado: 'corto', ojos: '#5a3d28',
    canas: clamp((e - 0.12) * 1.5), entradas: clamp(e * 1.3), arrugas: clamp((e - 0.3) * 1.7), gafas: e > 0.55,
    barba: e > 0.45 ? clamp((e - 0.45) * 3) : 0, colorBarba: mix('#4a3a2e', '#d6d2ca', clamp(e * 1.4)),
    camisa: mix('#f2f0ea', '#b9b2a2', e), cuello: 'camisa', corbata: e < 0.5 ? '#2c4fa3' : null,
    pantalon: mix('#3b4250', '#57524b', e), zapatos: '#2a2420', complexion: 1 + e * 0.04,
  });
  const PIJAMA = { ...papa(0), camisa: '#8ea5c2', cuello: 'pico', corbata: null, pantalon: '#8ea5c2', zapatos: '#6b5848', bolsillo: false };
  const MAMA = { altura: 165, sexo: 'm', piel: '#eec6a4', pelo: '#5a3422', peinado: 'mono', camisa: '#6e9b7a', cuello: 'pico', pantalon: '#4a5368', zapatos: '#6a3b2a', labios: '#c0625a', ojos: '#4a6a3a' };
  const hija = edad => {
    const base = { sexo: 'm', piel: '#f0c9a8', pelo: '#4a2c1c', ojos: '#4a6a3a', camisa: '#d64b3c', zapatos: '#e6e2da', labios: edad > 14 ? '#c0625a' : null };
    if (edad < 7) return { ...base, altura: 116, cabezas: 5.8, peinado: 'coleta', manga: 'corta', pantalon: '#3d5a8a' };
    if (edad < 10) return { ...base, altura: 130, cabezas: 6.1, peinado: 'coleta', manga: 'corta', pantalon: '#3d5a8a' };
    if (edad < 13) return { ...base, altura: 146, cabezas: 6.5, peinado: 'largo', manga: 'corta', pantalon: '#344e78' };
    if (edad < 18) return { ...base, altura: 160, cabezas: 7, peinado: 'largo', manga: 'corta', pantalon: '#2f3d5c', camisa: '#c7433a' };
    return { ...base, altura: 165, cabezas: 7.4, peinado: 'largo', camisa: '#b8433a', pantalon: '#2f3d5c', zapatos: '#5a3a2a' };
  };
  const NOVIA = { altura: 166, sexo: 'm', piel: '#f0c9a8', pelo: '#4a2c1c', peinado: 'novia', camisa: '#fbf8f1', cuello: 'redondo', falda: { color: '#fbf8f1', largo: 'suelo' }, zapatos: '#eee', labios: '#c0625a', ojos: '#4a6a3a' };
  const NOVIO = { altura: 181, sexo: 'h', piel: '#8d5a3b', pelo: '#1b1b1b', peinado: 'corto', camisa: '#ffffff', chaqueta: '#24272e', corbata: '#7a2f2f', pantalon: '#24272e', zapatos: '#111', barba: 0.85 };
  const COLEGA = { altura: 172, sexo: 'h', piel: '#f1c9a5', pelo: '#8a6a3a', peinado: 'calvo', gafas: true, camisa: '#a9b8ae', cuello: 'camisa', corbata: '#2f3f7a', pantalon: '#46505a', zapatos: '#2a2522' };
  const VIAJERO = { altura: 175, sexo: 'h', piel: '#8d5a3b', pelo: '#1b1b1b', peinado: 'corto', camisa: '#7d8a7a', manga: 'corta', cuello: 'redondo', pantalon: '#3b4048', zapatos: '#2a2522' };

  // ---------- poses de manos (coordenadas del cuerpo, cm) ----------
  const movilD = (sx, sy) => ({ x: -2, y: sy + 13, tipo: 'agarra', objeto: 'movil', escorzo: 0.55 });
  const movilI = (sx, sy) => ({ x: 2, y: sy + 13, tipo: 'agarra', objeto: 'movil', escorzo: 0.55 });
  const colgando = (lado, dx = 0) => (sx, sy, M) => ({ x: sx + lado * (M.H * 0.012 + dx), y: sy + (M.brazo + M.antebrazo) * 0.97, tipo: 'relajada' });
  const enRegazo = lado => (sx, sy, M) => ({ x: lado * M.H * 0.06, y: M.H * 0.06, tipo: 'relajada', escorzo: 0.75 });
  const arriba = (lado, t = 0, vel = 0) => (sx, sy, M) => ({ x: sx + lado * M.H * (0.07 + Math.sin(t * vel) * 0.02), y: sy - M.H * 0.24, tipo: 'abierta', codo: -1 });
  const saluda = (lado, t) => (sx, sy, M) => ({ x: sx + lado * M.H * (0.1 + Math.sin(t * 11) * 0.04), y: sy - M.H * 0.17, tipo: 'abierta', codo: -1, pulgar: lado });
  // Posición en pantalla (coordenadas de imagen) de una mano devuelta por persona().
  const manoEn = (r, x, y, k, lado) => { const b = r.brazos.find(q => q.lado === lado); return [x + b.tx * k, y + b.ty * k]; };

  // iconos que salen del móvil mientras hace scroll
  function iconos(ctx, x, y, t, t0, t1, seed, s = 1) {
    for (let k = 0; ; k++) {
      const ts = t0 + k * 0.7 + hash(seed + k) * 0.2;
      if (ts > t1) break;
      const a = (t - ts) / 1.4; if (a < 0 || a > 1) continue;
      const tipo = Math.floor(hash(seed + k * 3) * 4);
      const ix = x + (Math.sin(a * 5 + k) * 26 + (hash(seed + k * 7) - 0.5) * 90) * s, iy = y - a * 300 * s;
      ctx.save(); ctx.globalAlpha = a < 0.15 ? a / 0.15 : 1 - Math.max(0, a - 0.7) / 0.3;
      ctx.translate(ix, iy); ctx.scale((0.6 + a * 0.4) * s, (0.6 + a * 0.4) * s);
      ctx.strokeStyle = INK; ctx.lineWidth = 3;
      if (tipo === 0) { ctx.fillStyle = '#ff3b5c'; ctx.beginPath(); ctx.moveTo(0, 18); ctx.bezierCurveTo(-30, -2, -15, -26, 0, -10); ctx.bezierCurveTo(15, -26, 30, -2, 0, 18); ctx.fill(); ctx.stroke(); }
      else if (tipo === 1) { ctx.fillStyle = '#2f7bff'; ctx.beginPath(); ctx.arc(0, 0, 20, 0, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.fillRect(-9, -2, 5, 11); rrect(ctx, -3, -4, 13, 13, 2); ctx.fill(); ctx.beginPath(); ctx.moveTo(-2, -3); ctx.lineTo(2, -13); ctx.lineTo(6, -12); ctx.lineTo(5, -3); ctx.fill(); }
      else if (tipo === 2) { ctx.fillStyle = '#ffd21f'; ctx.beginPath(); ctx.arc(0, 0, 20, 0, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(-7, -5, 2.6, 0, 7); ctx.arc(7, -5, 2.6, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(0, 1, 10, 0.3, Math.PI - 0.3); ctx.stroke(); }
      else { ctx.fillStyle = '#ff6a2e'; ctx.beginPath(); ctx.moveTo(0, -22); ctx.quadraticCurveTo(18, -4, 10, 12); ctx.quadraticCurveTo(0, 22, -10, 12); ctx.quadraticCurveTo(-16, -2, 0, -22); ctx.fill(); ctx.stroke(); }
      ctx.restore();
    }
  }
  function bateria(ctx, x, y, nivel, t, s = 1) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    const parp = nivel < 0.12 && Math.floor(t * 4) % 2;
    ctx.fillStyle = '#fbf8f0'; ctx.strokeStyle = INK; ctx.lineWidth = 4;
    rrect(ctx, -46, -24, 86, 48, 8); ctx.fill(); ctx.stroke(); ctx.fillStyle = INK; ctx.fillRect(40, -10, 8, 20);
    ctx.fillStyle = nivel > 0.3 ? '#4caf50' : '#e53935';
    if (!parp) ctx.fillRect(-40, -18, 74 * clamp(nivel), 36);
    ctx.restore();
  }
  // el dibujo de la niña: la familia, un corazón y el sol (s = 1 → 200 px de ancho)
  function dibujo(ctx, x, y, s, rot = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(-96, -66, 200, 140);
    ctx.fillStyle = '#fbf8ef'; ctx.strokeStyle = '#b9b2a2'; ctx.lineWidth = 2; ctx.fillRect(-100, -70, 200, 140); ctx.strokeRect(-100, -70, 200, 140);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = '#f2b51b'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(70, -42, 14, 0, 7); ctx.stroke();
    for (let k = 0; k < 8; k++) { const a = (k * Math.PI) / 4; ctx.beginPath(); ctx.moveTo(70 + Math.cos(a) * 19, -42 + Math.sin(a) * 19); ctx.lineTo(70 + Math.cos(a) * 26, -42 + Math.sin(a) * 26); ctx.stroke(); }
    const fig = (fx, h, col) => {
      ctx.strokeStyle = col; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(fx, 30 - h, 9, 0, 7); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(fx, 39 - h); ctx.lineTo(fx, 52 - h * 0.35); ctx.moveTo(fx, 52 - h * 0.35); ctx.lineTo(fx - 10, 60); ctx.moveTo(fx, 52 - h * 0.35); ctx.lineTo(fx + 10, 60); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(fx - 18, 46 - h * 0.6); ctx.lineTo(fx + 18, 46 - h * 0.6); ctx.stroke();
    };
    fig(-55, 52, '#2c4fa3'); fig(-10, 30, '#d1504a'); fig(35, 48, '#2f8f3a');
    ctx.fillStyle = '#e8263f'; ctx.beginPath(); ctx.moveTo(-10, -24); ctx.bezierCurveTo(-30, -38, -22, -58, -10, -46); ctx.bezierCurveTo(2, -58, 10, -38, -10, -24); ctx.fill();
    ctx.strokeStyle = '#6aa86b'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-100, 62); ctx.quadraticCurveTo(0, 54, 100, 62); ctx.stroke();
    ctx.restore();
  }
  function confeti(ctx, t, seed, n, colores, esc = 1) {
    for (let i = 0; i < n; i++) {
      const x = hash(seed + i) * W, y = ((hash(seed + i * 2) * 2200 + t * (120 + hash(i) * 120)) % 2200) - 200, r = t * 3 + i;
      ctx.save(); ctx.translate(x + Math.sin(t * 2 + i) * 30, y); ctx.rotate(r); ctx.scale(esc, esc);
      ctx.fillStyle = colores[i % colores.length]; ctx.fillRect(-7, -4, 14, 8); ctx.restore();
    }
  }
  function particulas(ctx, t, ventana, tipo) {
    const [x0, y0, x1, y1] = ventana;
    ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, x1 - x0, y1 - y0); ctx.clip();
    for (let i = 0; i < 30; i++) {
      const vel = tipo === 'nieve' ? 70 : tipo === 'hojas' ? 110 : 50;
      const x = x0 + hash(i * 3 + 1) * (x1 - x0) + Math.sin(t * 1.5 + i) * 25, y = y0 + (((hash(i * 7) * (y1 - y0)) + t * vel) % (y1 - y0));
      ctx.save(); ctx.translate(x, y); ctx.rotate(t * 2 + i);
      if (tipo === 'nieve') { ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.beginPath(); ctx.arc(0, 0, 4 + hash(i) * 4, 0, 7); ctx.fill(); }
      else if (tipo === 'hojas') { ctx.fillStyle = ['#d9822b', '#b5521f', '#e8b04a'][i % 3]; ctx.beginPath(); ctx.ellipse(0, 0, 9, 5, 0, 0, 7); ctx.fill(); }
      else if (tipo === 'petalos') { ctx.fillStyle = 'rgba(255,240,245,0.95)'; ctx.beginPath(); ctx.ellipse(0, 0, 6, 4, 0, 0, 7); ctx.fill(); }
      ctx.restore();
    }
    ctx.restore();
  }
  function reloj(ctx, x, y, r, ang) {
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = '#fbf8f0'; ctx.strokeStyle = INK; ctx.lineWidth = r * 0.07; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill(); ctx.stroke();
    ctx.lineWidth = r * 0.035; for (let k = 0; k < 12; k++) { const a = (k * Math.PI) / 6; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r * 0.8, Math.sin(a) * r * 0.8); ctx.lineTo(Math.cos(a) * r * 0.92, Math.sin(a) * r * 0.92); ctx.stroke(); }
    ctx.lineCap = 'round';
    ctx.lineWidth = r * 0.08; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.sin(ang / 12) * r * 0.5, -Math.cos(ang / 12) * r * 0.5); ctx.stroke();
    ctx.lineWidth = r * 0.045; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.sin(ang) * r * 0.78, -Math.cos(ang) * r * 0.78); ctx.stroke();
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(0, 0, r * 0.07, 0, 7); ctx.fill();
    ctx.restore();
  }
  function movilSuelto(ctx, x, y, ang, k, luz) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(k, k);
    ctx.fillStyle = '#23252a'; ctx.strokeStyle = INK; ctx.lineWidth = 0.5; rrect(ctx, -3.6, -7.5, 7.2, 15, 1.2); ctx.fill(); ctx.stroke();
    if (luz) { ctx.fillStyle = `rgba(150,210,255,${0.9 * luz})`; rrect(ctx, -3, -6.8, 6, 13.6, 0.8); ctx.fill(); }
    ctx.restore();
  }

  // ======================= 0–5 s: suena el despertador; lo primero que agarra es el móvil =======================
  function cobija(ctx) {
    // cobija sobre las piernas (estilo tinta, como la sábana del fondo)
    const p = new Path2D();
    p.moveTo(600, 1280); p.bezierCurveTo(640, 1198, 700, 1205, 770, 1194); p.bezierCurveTo(850, 1184, 980, 1208, 1100, 1198);
    p.lineTo(1100, 1960); p.lineTo(780, 1960); p.bezierCurveTo(720, 1800, 640, 1560, 600, 1290); p.closePath();
    ctx.save(); ctx.fillStyle = '#c9d3dc'; ctx.fill(p); ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.stroke(p);
    ctx.clip(p); ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.beginPath();
    for (const [x0, y0, x1, y1, x2, y2] of [[700, 1300, 760, 1450, 740, 1640], [860, 1270, 900, 1420, 880, 1600], [990, 1280, 1010, 1500, 1060, 1700], [760, 1700, 820, 1780, 800, 1900], [640, 1420, 690, 1500, 700, 1600]]) { ctx.moveTo(x0, y0); ctx.quadraticCurveTo(x1, y1, x2, y2); }
    ctx.stroke();
    const g = ctx.createLinearGradient(0, 1230, 0, 1400); g.addColorStop(0, 'rgba(60,50,40,0.18)'); g.addColorStop(1, 'rgba(60,50,40,0)');
    ctx.fillStyle = g; ctx.fillRect(560, 1220, 600, 200);
    ctx.restore();
  }
  function escena1(ctx, t) {
    // primero el reloj, luego un barrido de cámara hasta él, sentado en la cama
    const pan = ease(inv(1.35, 2.0, t));
    ctx.save(); camara(ctx, lerp(1.55, 1.3, pan) + t * 0.01, lerp(330, 655, pan), lerp(760, 1090, pan));
    fondo(ctx, '01_dormitorio_amanecer');
    if (t > 0.4 && t < 1.8) {
      ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.lineCap = 'round';
      const v = Math.sin(t * 60) * 4;
      for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(287 + v, 745, 95 + i * 22, s > 0 ? -0.5 : Math.PI - 0.5, s > 0 ? 0.5 : Math.PI + 0.5); ctx.stroke(); }
    }
    const k = 4.4, X = 770, Y = 1262;
    const susto = t > 1.5 && t < 2.1, alcanza = ease(inv(2.1, 2.7, t)), tiene = t > 2.7, mira = ease(inv(2.7, 3.2, t));
    const telefono = [965, 1300];
    const manoD = tiene
      ? (sx, sy) => ({ x: lerp((telefono[0] - X) / k, -2, mira), y: lerp((telefono[1] - Y) / k, sy + 13, mira), tipo: 'agarra', objeto: 'movil', escorzo: lerp(1, 0.55, mira) })
      : (sx, sy, M) => ({ x: lerp(sx + 4, (telefono[0] - X) / k, alcanza), y: lerp(sy + 40, (telefono[1] - Y) / k, alcanza), tipo: 'relajada' });
    const r = persona(ctx, X, Y, k, PIJAMA, {
      modo: 'sentado', piesY: 40, sombra: false, sombraAsiento: false, encorvado: susto ? 0 : lerp(0.8, 0.4, alcanza),
      manoD, manoI: (sx, sy) => ({ x: sx + 3, y: sy + 58, tipo: 'relajada' }),
      gesto: t < 1.5 ? 'dormido' : susto ? 'sorpresa' : 'cansado', giro: lerp(0, 0.5, alcanza) * (1 - mira), mirada: { x: lerp(0, 1, alcanza) * (1 - mira), y: mira },
      baja: t < 1.5 ? 0.6 : lerp(0.1, 0.4, alcanza) * (1 - mira) + mira * 0.85, inclina: t < 1.5 ? 0.12 : 0, luzMovil: mira, parpadeo: t > 3.6 && t < 3.72,
    });
    cobija(ctx);
    if (!tiene) movilSuelto(ctx, telefono[0], telefono[1], 0.3, k, 0.9);
    if (!tiene && alcanza > 0) persona(ctx, X, Y, k, PIJAMA, { modo: 'sentado', piesY: 40, manoD, soloBrazo: 1 });
    if (tiene) { const [mx, my] = manoEn(r, X, Y, k, 1); iconos(ctx, mx + 110, my - 40, t, 2.9, 5, 1, 0.8); }
    ctx.restore();
  }

  // ======================= 5–10 s: desayuno; la hija le enseña su dibujo =======================
  function escena2(ctx, t) {
    const lt = t - 5;
    ctx.save(); camara(ctx, lerp(1.04, 1.0, lt / 5));
    fondo(ctx, '02_cocina_desayuno');
    suelo(ctx, 1146, '#c4c0b6', '#a9a499', { baldosas: [459, -433, 150] });
    // patas de la mesa y de las sillas que la imagen dejó cortadas
    ctx.fillStyle = '#8a3b22'; ctx.strokeStyle = INK; ctx.lineWidth = 3;
    for (const [x, w] of [[232, 22], [886, 22]]) { ctx.fillRect(x, 1100, w, 300); ctx.strokeRect(x, 1100, w, 300); }
    sombraPiso(ctx, 1250, 0.25);
    const kE = escala(6.2, 1560, 1560 - 100 * 6.2 * 0.6);
    const ensena = lt > 1.0 && lt < 3.8, triste = lt > 3.8;
    const yM = 1560, yH = 1690, yP = 1585;
    persona(ctx, 185, yM, kE(yM), MAMA, { gesto: triste ? 'triste' : 'sonrie', giro: 0.45, mirada: { x: 1, y: 0.3 }, parpadeo: lt > 2.2 && lt < 2.35, manoI: colgando(-1), manoD: colgando(1) });
    const kh = kE(yH);
    const sube = ensena ? ease(inv(1.0, 1.4, lt)) * (1 - ease(inv(3.4, 3.8, lt))) : 0;
    const salto = ensena ? Math.abs(Math.sin(lt * 7)) * 3 : 0;
    const rH = persona(ctx, 520, yH, kh, hija(6), {
      modo: salto > 0.5 ? 'salto' : 'pie', altoSalto: salto, gesto: triste ? 'triste' : ensena ? 'feliz' : 'sonrie', giro: 0.4, mirada: { x: 1, y: -0.5 },
      manoI: (sx, sy, M) => ({ x: lerp(sx - 3, -12, sube), y: lerp(sy + 40, sy - 34, sube), tipo: sube > 0.3 ? 'agarra' : 'relajada', codo: sube > 0.3 ? -1 : 1 }),
      manoD: (sx, sy, M) => ({ x: lerp(sx + 3, 12, sube), y: lerp(sy + 40, sy - 34, sube), tipo: sube > 0.3 ? 'agarra' : 'relajada', codo: sube > 0.3 ? -1 : 1 }),
      inclina: triste ? 0.1 : 0,
    });
    if (sube > 0.05) { const [ax, ay] = manoEn(rH, 520, yH, kh, -1), [bx, by] = manoEn(rH, 520, yH, kh, 1); dibujo(ctx, (ax + bx) / 2, (ay + by) / 2 - 40, lerp(0.6, 1.25, sube), Math.sin(lt * 6) * 0.06); }
    else if (triste) { const [ax, ay] = manoEn(rH, 520, yH, kh, 1); dibujo(ctx, ax + 10, ay + 60, 0.9, 1.35); }
    const kp = kE(yP);
    const rP = persona(ctx, 880, yP, kp, papa(0.03), { manoD: movilD, manoI: colgando(-1), baja: 0.85, gesto: 'cansado', luzMovil: 1, giro: -0.1 });
    const [px, py] = manoEn(rP, 880, yP, kp, 1); iconos(ctx, px, py - 80, t, 5, 10, 2);
    ctx.restore();
  }

  // ======================= 10–14 s: el autobús =======================
  function escena3(ctx, t) {
    const lt = t - 10;
    ctx.save();
    camara(ctx, 1.02, 543, 960 - Math.sin(t * 9) * 3);
    ctx.translate(543, 960); ctx.rotate(Math.sin(t * 2.4) * 0.008); ctx.translate(-543, -960);
    fondo(ctx, '03_autobus');
    suelo(ctx, 1267, '#aaa291', '#8f897b', { baldosas: [600, 470, 170], junta: 'rgba(40,36,30,0.25)' });
    // luces que pasan por las ventanas
    ctx.save(); ctx.beginPath(); ctx.rect(0, 280, 1086, 330); ctx.clip();
    for (let i = 0; i < 4; i++) { const x = ((-(lt * 900) + i * 420) % 1600 + 1600) % 1600 - 300; ctx.fillStyle = 'rgba(255,255,240,0.22)'; ctx.beginPath(); ctx.moveTo(x, 280); ctx.lineTo(x + 140, 280); ctx.lineTo(x + 60, 610); ctx.lineTo(x - 80, 610); ctx.fill(); }
    ctx.restore();
    sombraPiso(ctx, 1300, 0.25);
    // pasajero sentado al fondo (banco a ~45 cm; k ≈ 2.4)
    persona(ctx, 820, 862, 2.4, VIAJERO, { modo: 'sentado', piesY: 46, manoD: movilD, manoI: enRegazo(-1), baja: 0.85, gesto: 'cansado', luzMovil: 1, sombra: false });
    // barra vertical y el padre agarrado a ella
    const k = 6.4, X = 640, Y = 1770;
    const barra = X - 27 * k;
    ctx.fillStyle = '#d9d6cf'; ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.fillRect(barra - 11, -50, 22, Y + 5); ctx.strokeRect(barra - 11, -50, 22, Y + 5);
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(barra - 6, -50, 4, Y);
    const rP = persona(ctx, X, Y, k, papa(0.06), {
      manoI: (sx, sy) => ({ x: (barra - X) / k + 2, y: sy - 44, tipo: 'agarra', codo: -1, pulgar: 1 }), manoD: movilD,
      baja: 0.85, gesto: 'cansado', luzMovil: 1, parpadeo: lt > 2 && lt < 2.15, inclina: Math.sin(t * 2.4) * 0.03,
    });
    const [px, py] = manoEn(rP, X, Y, k, 1); iconos(ctx, px, py - 80, t, 10, 14, 3);
    ctx.restore();
  }

  // ======================= 14–18 s: la oficina; el reloj vuela =======================
  function escena4(ctx, t) {
    const lt = t - 14;
    ctx.save(); camara(ctx, lerp(1.0, 1.06, lt / 4));
    fondo(ctx, '04_oficina');
    sombraPiso(ctx, 1500, 0.2);
    const kE = escala(6.9, 1888, 420);
    // reloj colgado en la mampara de la izquierda (30 cm de diámetro)
    const ang = Math.pow(lt, 2.2) * 6;
    reloj(ctx, 92, 1010, 15 * 6.9, ang);
    // compañero que cruza al fondo con una caja
    const yc = 1260, kc = kE(yc), xc = lerp(1150, -150, lt / 4);
    const rC = persona(ctx, xc, yc, kc, COLEGA, {
      modo: 'camina', fase: lt * 7, lateral: 1, dir: -1, giro: -0.6, gesto: 'cansado',
      manoI: (sx, sy) => ({ x: -12, y: sy + 30, tipo: 'agarra', escorzo: 0.6 }), manoD: (sx, sy) => ({ x: 12, y: sy + 30, tipo: 'agarra', escorzo: 0.6 }),
    });
    { const [ax, ay] = manoEn(rC, xc, yc, kc, -1), [bx, by] = manoEn(rC, xc, yc, kc, 1);
      ctx.fillStyle = '#d8c39a'; ctx.strokeStyle = INK; ctx.lineWidth = 3; const w = 46 * kc, h = 34 * kc; ctx.fillRect((ax + bx) / 2 - w / 2, ay - h * 0.9, w, h); ctx.strokeRect((ax + bx) / 2 - w / 2, ay - h * 0.9, w, h);
      ctx.fillStyle = '#c2a97c'; ctx.fillRect((ax + bx) / 2 - w / 2, ay - h * 0.9, w, h * 0.18); }
    const yP = 1850, kp = kE(yP);
    const rP = persona(ctx, 700, yP, kp, papa(0.1), { manoD: movilD, manoI: colgando(-1), baja: 0.85, gesto: 'cansado', luzMovil: 1 });
    const [px, py] = manoEn(rP, 700, yP, kp, 1); iconos(ctx, px, py - 80, t, 14, 18, 4);
    ctx.restore();
    velo(ctx, '#0b1630', (Math.sin(ang * 0.5) * 0.5 + 0.5) * 0.25 * inv(1, 3, lt));
  }

  // ======================= 18–22 s: el cumpleaños =======================
  function escena5(ctx, t) {
    const lt = t - 18;
    ctx.save(); camara(ctx, lerp(1.0, 1.05, lt / 4));
    fondo(ctx, '10_cumpleanos');
    suelo(ctx, 1450, '#8e3a2c', '#6e2c22');
    sombraPiso(ctx, 1450, 0.3);
    const kE = escala(4.9, 1562, 1562 - 100 * 4.9);
    const yM = 1720, yH = 1810, yP = 1735;
    persona(ctx, 175, yM, kE(yM), MAMA, { gesto: 'feliz', giro: 0.3, manoI: arriba(-1, lt, 8), manoD: arriba(1, lt + 1, 8) });
    const salto = Math.abs(Math.sin(lt * 7)) * 14;
    persona(ctx, 420, yH, kE(yH), hija(7), { modo: 'salto', altoSalto: salto, gesto: 'feliz', gorro: '#3aa79a', manoI: arriba(-1, lt, 14), manoD: arriba(1, lt + 0.5, 14) });
    const kp = kE(yP);
    const rP = persona(ctx, 905, yP, kp, papa(0.16), { manoD: movilD, manoI: colgando(-1), baja: 0.85, gesto: 'cansado', luzMovil: 1 });
    const [px, py] = manoEn(rP, 905, yP, kp, 1); iconos(ctx, px, py - 80, t, 18, 22, 5);
    ctx.restore();
    confeti(ctx, t, 50, 40, ['#ff3b5c', '#ffd21f', '#2f7bff', '#4caf50']);
  }

  // ======================= 22–26 s: el parque; ella le saluda desde los columpios =======================
  function escena6(ctx, t) {
    const lt = t - 22;
    ctx.save(); camara(ctx, 1.0);
    fondo(ctx, '09_parque_atardecer');
    suelo(ctx, 1171, '#aa997d', '#8d7d63', { hierba: 'rgba(60,50,30,0.35)' });
    const kE = escala(2.6, 1183, 800);
    const yH = 1190, kh = kE(yH);
    persona(ctx, 850, yH, kh, hija(8), { gesto: lt > 3 ? 'triste' : 'feliz', manoD: lt > 0.6 && lt < 3.2 ? saluda(1, lt) : colgando(1), manoI: colgando(-1), giro: -0.3 });
    const yP = 1830, kp = kE(yP);
    const rP = persona(ctx, 330, yP, kp, papa(0.25), { manoD: movilD, manoI: colgando(-1), baja: 0.85, gesto: 'cansado', luzMovil: 1 });
    const [px, py] = manoEn(rP, 330, yP, kp, 1); iconos(ctx, px, py - 80, t, 22, 26, 6);
    ctx.restore();
  }

  // ======================= 26–42 s: las estaciones pasan en el mismo sofá =======================
  // Por sala: centro del sofá, altura del asiento (y), k (ancho del sofá / 215 cm), pies (cm bajo el asiento),
  // suelo junto al sofá, mesa de centro (polígonos que tapan las piernas) y ventana (partículas).
  const SALAS = [
    { k: '05_sala_primavera', x: 512, seat: 1012, esc: 4.67, pies: 46, suelo: 1185, p: 'petalos', win: [104, 277, 952, 782],
      mesa: [[[195, 1106], [825, 1098], [945, 1255], [948, 1305], [70, 1312], [66, 1262]], [70, 1300, 62, 290], [893, 1290, 64, 278], [172, 1300, 40, 70], [812, 1290, 40, 58]] },
    { k: '06_sala_verano', x: 540, seat: 1160, esc: 4.9, pies: 53, suelo: 1390, p: null, win: [290, 147, 844, 897],
      mesa: [[[352, 1256], [745, 1256], [793, 1318], [791, 1360], [304, 1360], [307, 1318]], [298, 1352, 50, 205], [750, 1352, 44, 205], [350, 1352, 40, 118], [712, 1352, 38, 118]] },
    { k: '07_sala_otono', x: 555, seat: 1095, esc: 4.6, pies: 52, suelo: 1305, p: 'hojas', win: [104, 320, 985, 887],
      mesa: [[[393, 1114], [795, 1114], [819, 1163], [796, 1203], [374, 1203], [349, 1163]], [374, 1196, 36, 204], [751, 1196, 38, 206], [398, 1196, 34, 144], [720, 1196, 34, 146]] },
    { k: '08_sala_invierno', x: 542, seat: 1205, esc: 4.8, pies: 52, suelo: 1425, p: 'nieve', win: [310, 245, 822, 995],
      mesa: [[[330, 1242], [752, 1242], [823, 1338], [793, 1370], [302, 1370], [279, 1338]], [283, 1360, 70, 196], [740, 1360, 66, 196], [343, 1360, 34, 104], [716, 1360, 30, 104]] },
  ];
  const SALA_VIEJA = { k: '12_sala_vieja', x: 530, seat: 1172, esc: 4.9, pies: 40, suelo: 1330, p: 'nieve', win: [280, 163, 845, 815],
    mesa: [[[305, 1204], [745, 1202], [809, 1255], [801, 1293], [297, 1293], [292, 1255]], [288, 1286, 36, 184], [760, 1286, 44, 178], [734, 1286, 32, 138], [316, 1286, 28, 134]] };

  function sala(ctx, t, i, a) {
    const S = SALAS[i], lt = t - 26 - i * 4, edad = lerp(0.3, 0.85, inv(26, 42, t));
    ctx.save(); ctx.globalAlpha = a;
    camara(ctx, 1.0 + 0.015 * Math.sin(t * 0.5));
    fondo(ctx, S.k);
    if (S.p) particulas(ctx, t, S.win, S.p);
    const kE = escala(S.esc, S.suelo, S.suelo - 100 * S.esc);
    // el padre en el sofá, cada vez más mayor; la mesa de centro le tapa las piernas
    const k = S.esc, X = S.x, Y = S.seat;
    const rP = persona(ctx, X, Y, k, papa(edad), { modo: 'sentado', piesY: S.pies, manoD: movilD, manoI: enRegazo(-1), baja: 0.85, encorvado: edad, gesto: 'cansado', luzMovil: 1, sombra: false, parpadeo: (lt % 2.7) < 0.12 });
    delante(ctx, S.k, S.mesa);
    const [px, py] = manoEn(rP, X, Y, k, 1);
    // la hija crece en cada estación
    if (i === 0) {
      const y = 1420, kh = kE(y), x = lerp(-60, 150, ease(inv(0, 2.2, lt)));
      persona(ctx, x, y, kh, hija(8), { modo: lt < 2.2 ? 'camina' : 'pie', fase: lt * 9, lateral: 1, dir: 1, gesto: 'feliz', giro: 0.5, mirada: { x: 1, y: -0.3 }, manoD: lt > 2.4 ? saluda(1, lt) : undefined });
    }
    if (i === 1) {
      const y = 1460, kh = kE(y);
      persona(ctx, 140, y, kh, hija(11), { gesto: lt > 2.6 ? 'triste' : 'sonrie', giro: 0.5, mirada: { x: 1, y: -0.2 }, manoD: lt > 0.6 && lt < 2.6 ? saluda(1, lt) : colgando(1), manoI: colgando(-1) });
    }
    if (i === 2) {
      const y = 1470, kh = kE(y), x = lerp(-80, 145, ease(inv(0, 2.4, lt)));
      persona(ctx, x, y, kh, hija(15), { modo: lt < 2.4 ? 'camina' : 'pie', fase: lt * 7.5, lateral: 1, dir: 1, manoD: movilD, baja: 0.8, gesto: 'cansado', luzMovil: 1 });
    }
    if (i === 3) {
      const y = 1480, kh = kE(y), sale = ease(inv(2.0, 4.0, lt)), x = lerp(150, -260, sale);
      persona(ctx, x, y, kh, hija(24), { modo: sale > 0 && sale < 1 ? 'camina' : 'pie', fase: lt * 7.5, lateral: 1, dir: -1, gesto: 'triste', giro: sale > 0 ? 0.6 : 0.45, mirada: { x: 1, y: 0 },
        manoI: (sx, sy, M) => ({ x: sx - M.H * 0.03, y: sy + (M.brazo + M.antebrazo) * 0.95, tipo: 'agarra', objeto: 'maleta', color: '#8a5a3a' }), manoD: colgando(1) });
    }
    iconos(ctx, px, py - 80, t, 26 + i * 4, 30 + i * 4, 10 + i, 0.9);
    ctx.restore();
  }
  function escena7(ctx, t) {
    const lt = t - 26, i = Math.min(3, Math.floor(lt / 4)), f = lt - i * 4;
    sala(ctx, t, i, 1);
    if (i < 3 && f > 3.4) { ctx.save(); sala(ctx, t, i + 1, ease((f - 3.4) / 0.6)); ctx.restore(); }
    // hojas del calendario que vuelan (el tiempo pasa)
    for (let k = 0; k < 5; k++) {
      const a = ((lt * 0.7 + k * 0.53) % 1.6) / 1.6;
      ctx.save(); ctx.globalAlpha = 0.85 * Math.sin(a * Math.PI);
      ctx.translate(lerp(1000, -150, a) + hash(k) * 200, 120 + hash(k + 4) * 380 - a * 120); ctx.rotate(a * 6 + k);
      ctx.fillStyle = '#fbf8f0'; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillRect(-28, -34, 56, 68); ctx.strokeRect(-28, -34, 56, 68);
      ctx.fillStyle = '#d1504a'; ctx.fillRect(-28, -34, 56, 14);
      ctx.restore();
    }
  }

  // ======================= 42–46 s: la boda de su hija =======================
  function sillaBoda(ctx, x, yS, k) {
    // silla de madera curvada vista de frente (asiento a 46 cm, respaldo a 90 cm)
    ctx.save(); ctx.translate(x, yS); ctx.scale(k, k);
    ctx.strokeStyle = INK; ctx.lineWidth = 0.6; ctx.fillStyle = '#efe9dc';
    const r = (x0, y0, w, h) => { ctx.fillRect(x0, y0, w, h); ctx.strokeRect(x0, y0, w, h); };
    r(-21, -44, 3.2, 90); r(17.8, -44, 3.2, 90);
    ctx.beginPath(); ctx.ellipse(0, -44, 21, 6, 0, Math.PI, 0); ctx.lineWidth = 3.2; ctx.strokeStyle = '#efe9dc'; ctx.stroke(); ctx.lineWidth = 0.6; ctx.strokeStyle = INK;
    r(-22, -2, 44, 4.5); r(-19, 2, 3, 44); r(16, 2, 3, 44);
    ctx.restore();
  }
  function escena8(ctx, t) {
    const lt = t - 42;
    ctx.save(); camara(ctx, lerp(1.0, 1.05, lt / 4));
    fondo(ctx, '11_boda');
    suelo(ctx, 1226, '#707964', '#5c6452', { hierba: 'rgba(30,40,25,0.35)' });
    const kE = escala(5.6, 1260, 620);
    // los novios en el pasillo, bajo el arco
    const yN = 1010, kn = kE(yN);
    persona(ctx, 470, yN, kn, NOVIA, { gesto: 'feliz', giro: 0.35, parpadeo: lt > 1.5 && lt < 1.65, manoD: (sx, sy, M) => ({ x: 65 / kn, y: sy + 50, tipo: 'agarra' }), manoI: colgando(-1) });
    persona(ctx, 600, yN, kn, NOVIO, { gesto: 'feliz', giro: -0.35, manoI: (sx, sy, M) => ({ x: -65 / kn, y: sy + 50, tipo: 'agarra' }), manoD: colgando(1) });
    // el padre, de espaldas a la boda, en una silla girada, con el móvil
    const yS = 1235, k = kE(yS), X = 860, asiento = yS - 46 * k;
    sillaBoda(ctx, X, asiento, k);
    const rP = persona(ctx, X, asiento, k, papa(0.9), { modo: 'sentado', piesY: 46, manoD: movilD, manoI: enRegazo(-1), baja: 0.85, encorvado: 0.9, gesto: 'cansado', luzMovil: 1 });
    const [px, py] = manoEn(rP, X, asiento, k, 1); iconos(ctx, px, py - 80, t, 42, 46, 20);
    ctx.restore();
    confeti(ctx, t, 90, 34, ['#fff2f5', '#ffd1dc', '#f7f4ee']);
  }

  // ======================= 46–56 s: se acaba la batería; está solo =======================
  function escena9(ctx, t) {
    const lt = t - 46, S = SALA_VIEJA;
    const acerca = ease(inv(6.8, 10, lt));
    ctx.save();
    camara(ctx, lerp(1, 2.0, acerca), lerp(543, S.x, acerca), lerp(960, 900, acerca));
    fondo(ctx, S.k);
    particulas(ctx, t, S.win, 'nieve');
    const k = S.esc, X = S.x, Y = S.seat;
    const muerto = lt > 2.6, mira = lt > 3.2, alcanza = ease(inv(5.0, 6.2, lt)), recoge = ease(inv(6.2, 7.2, lt));
    const papel = [X - 2, 1240]; // el dibujo sobre la mesa
    const pecho = (sy) => ({ x: 13, y: sy + 26 });
    // mano derecha: móvil → regazo → alcanza el dibujo → lo sube al pecho
    const manoD = (sx, sy, M) => {
      if (!muerto) return movilD(sx, sy);
      const reg = enRegazo(1)(sx, sy, M), obj = { x: (papel[0] - X) / k + 4, y: (papel[1] - Y) / k };
      const p = pecho(sy);
      const x = lerp(lerp(reg.x, obj.x, alcanza), p.x, recoge), y = lerp(lerp(reg.y, obj.y, alcanza), p.y, recoge);
      return { x, y, tipo: alcanza > 0.5 ? 'agarra' : 'relajada', escorzo: lerp(0.75, 0.9, alcanza) - recoge * 0.3 };
    };
    const manoI = (sx, sy, M) => { const reg = enRegazo(-1)(sx, sy, M); return { x: lerp(reg.x, -13, recoge), y: lerp(reg.y, sy + 26, recoge), tipo: recoge > 0.5 ? 'agarra' : 'relajada', escorzo: lerp(0.75, 0.6, recoge) }; };
    const O = {
      modo: 'sentado', piesY: S.pies, manoD, manoI, encorvado: 1, sombra: false,
      baja: !mira ? 0.85 : recoge > 0 ? lerp(0.3, 0.8, recoge) : alcanza > 0 ? lerp(0.1, 0.6, alcanza) : 0.1,
      giro: mira && alcanza === 0 ? Math.sin((lt - 3.2) * 1.6) * 0.7 : 0, mirada: { x: mira && alcanza === 0 ? Math.sin((lt - 3.2) * 1.6) : 0, y: alcanza > 0 ? 0.8 : 0 },
      gesto: !mira ? 'cansado' : recoge > 0.8 && lt > 8.4 ? 'sonrie' : 'triste', luzMovil: muerto ? 0 : 1, movilEncendido: muerto ? 0 : 1, parpadeo: lt > 4.6 && lt < 4.75,
    };
    if (recoge === 0) dibujo(ctx, papel[0], papel[1], 0.74, -0.05);
    const rP = persona(ctx, X, Y, k, papa(1), O);
    delante(ctx, S.k, S.mesa);
    if (recoge === 0) dibujo(ctx, papel[0], papel[1], 0.74, -0.05);
    if (alcanza > 0 && recoge < 1) persona(ctx, X, Y, k, papa(1), { ...O, soloBrazo: 1 });
    if (recoge > 0) {
      const [ax, ay] = manoEn(rP, X, Y, k, -1), [bx, by] = manoEn(rP, X, Y, k, 1);
      dibujo(ctx, lerp(papel[0], (ax + bx) / 2, recoge), lerp(papel[1], (ay + by) / 2 - 50, recoge), lerp(0.74, 0.8, recoge), lerp(-0.05, 0.04, recoge));
      persona(ctx, X, Y, k, papa(1), { ...O, soloBrazo: -1 });
    }
    const [px, py] = manoEn(rP, X, Y, k, 1);
    if (!muerto) { bateria(ctx, px, py - 190, lerp(0.15, 0, inv(0, 2.4, lt)), t, 0.9); iconos(ctx, px, py - 80, t, 46, 48, 30, 0.9); }
    if (muerto && lt < 6) {
      // el móvil cae sobre el sofá con la pantalla negra
      const c = easeIn(inv(2.6, 3.0, lt));
      movilSuelto(ctx, lerp(px + 10, X + 150, c), lerp(py, Y - 10, c), c * 1.3, k, 0);
    }
    if (lt > 6) movilSuelto(ctx, X + 150, Y - 10, 1.3, k, 0);
    ctx.restore();
    if (lt > 2.6 && lt < 2.75) velo(ctx, '#000', 0.6);
  }

  // ======================= 56–60 s: el dibujo =======================
  function escena10(ctx, t) {
    const lt = t - 56;
    ctx.fillStyle = '#2a2622'; ctx.fillRect(0, 0, W, H);
    const g = ctx.createRadialGradient(540, 900, 50, 540, 900, 900); g.addColorStop(0, 'rgba(255,230,180,0.35)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    dibujo(ctx, 540, 920, lerp(4.2, 4.6, lt / 4), -0.04);
    // el corazón del dibujo late
    const latido = 1 + Math.max(0, Math.sin(lt * 7)) * 0.15 * inv(0.5, 1.5, lt);
    ctx.save(); ctx.translate(540 - 10 * 4.4, 920 - 41 * 4.4); ctx.scale(latido, latido); ctx.globalAlpha = 0.5 * inv(0.5, 1.5, lt);
    ctx.fillStyle = '#ff3b5c'; ctx.beginPath(); ctx.moveTo(0, 70); ctx.bezierCurveTo(-90, 10, -60, -70, 0, -30); ctx.bezierCurveTo(60, -70, 90, 10, 0, 70); ctx.fill(); ctx.restore();
    velo(ctx, '#000', inv(3.2, 4, lt));
  }

  const ESCENAS = [[0, 5, escena1], [5, 10, escena2], [10, 14, escena3], [14, 18, escena4], [18, 22, escena5], [22, 26, escena6], [26, 42, escena7], [42, 46, escena8], [46, 56, escena9], [56, 60, escena10]];
  function renderFrame(ctx, t) {
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, W, H);
    const e = ESCENAS.find(([a, b]) => t >= a && t < b) || ESCENAS[ESCENAS.length - 1];
    ctx.save(); e[2](ctx, t); ctx.restore();
    ctx.globalAlpha = 1; ctx.filter = 'none';
    // gradación: cálida al principio, fría y gris al final
    const frio = inv(30, 52, t);
    post(ctx, W, H, t, { bloom: 0.1, top: mix('#ffe2b0', '#d9dde0', frio), bottom: mix('#3d5a66', '#2c3238', frio) });
    if (t > 46 && t < 56) { ctx.save(); ctx.globalCompositeOperation = 'saturation'; ctx.fillStyle = `rgba(128,128,128,${0.45 * inv(48.6, 50, t)})`; ctx.fillRect(0, 0, W, H); ctx.restore(); }
    for (const b of [5, 10, 14, 18, 22, 26, 42, 46, 56]) if (Math.abs(t - b) < 0.12) velo(ctx, '#000', 1 - Math.abs(t - b) / 0.12);
    if (t < 0.6) velo(ctx, '#000', 1 - t / 0.6);
    ctx.restore();
  }
  window.FELICIDAD = { W, H, DURACION, renderFrame };
})();
