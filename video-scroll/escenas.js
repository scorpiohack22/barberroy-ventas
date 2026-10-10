// "Una vida en scroll" — corto vertical (1080×1920) de 60 s, sin texto.
// Fondos: Higgsfield Soul 2.0. Personajes, animación, efectos y música: código.
(function () {
  const { INK, clamp, lerp, inv, ease, easeOut, easeIn, rng, hash, mix, rrect, persona, post } = LIB;
  const W = 1080, H = 1920, DURACION = 60;

  // ---------- fondos ----------
  const NOMBRES = ['01_dormitorio_amanecer', '02_cocina_desayuno', '03_autobus', '04_oficina', '05_sala_primavera', '06_sala_verano', '07_sala_otono', '08_sala_invierno', '09_parque_atardecer', '10_cumpleanos', '11_boda', '12_sala_vieja'];
  const IMG = {};
  window.LISTO = Promise.all(NOMBRES.map(k => new Promise(res => { const i = new Image(); i.onload = res; i.onerror = res; i.src = `fondos/${k}.jpg`; IMG[k] = i; })));
  function escenario(ctx, k, zoom = 1, dx = 0, dy = 0, alpha = 1) {
    const w = 1086 * zoom, h = 1920 * zoom;
    ctx.translate((W - w) / 2 + dx, (H - h) / 2 + dy); ctx.scale(zoom, zoom);
    ctx.globalAlpha = alpha; ctx.drawImage(IMG[k], 0, 0, 1086, 1920); ctx.globalAlpha = 1;
  }
  function sombraSuelo(ctx, y0, a = 0.28) {
    const g = ctx.createLinearGradient(0, y0, 0, 1920); g.addColorStop(0, 'rgba(40,32,24,0)'); g.addColorStop(1, `rgba(40,32,24,${a})`);
    ctx.fillStyle = g; ctx.fillRect(-100, y0, 1300, 1920 - y0);
  }
  function velo(ctx, color, a) { if (a <= 0) return; ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = clamp(a); ctx.fillStyle = color; ctx.fillRect(0, 0, W, H); ctx.restore(); }

  // ---------- personajes ----------
  const PAPA0 = { skin: '#efc39e', shirt: '#f3f1ea', pants: '#3b4048', hair: '#3a2a1e', hairStyle: 'short', shoes: '#2a2522', glasses: false, beard: false, jacket: null, tie: '#2c4fa3' };
  const papa = edad => ({ ...PAPA0, hair: mix('#3a2a1e', '#e4e1da', clamp(edad * 1.2)), beard: edad > 0.55, glasses: edad > 0.7, shirt: mix('#f3f1ea', '#c9c2b2', edad), tie: edad > 0.8 ? null : '#2c4fa3', skin: mix('#efc39e', '#e3b996', edad) });
  const MAMA = { skin: '#e0ac83', shirt: '#6aa86b', pants: '#46505a', hair: '#5a3a22', hairStyle: 'long', shoes: '#3b2a20', glasses: false, beard: false, jacket: null, tie: null };
  const HIJA = { skin: '#e8b892', shirt: '#d1504a', pants: '#2f3a45', hair: '#5a3a22', hairStyle: 'bun', shoes: '#d1504a', glasses: false, beard: false, jacket: null, tie: null };
  const HIJA_ADULTA = { ...HIJA, hairStyle: 'long', shoes: '#3b2a20' };
  const NOVIA = { ...HIJA_ADULTA, shirt: '#f7f4ee', pants: '#f0ece2', shoes: '#efe9dc' };
  const NOVIO = { skin: '#c68b60', shirt: '#f3f1ea', pants: '#2b2f36', hair: '#1b1b1b', hairStyle: 'short', shoes: '#1f1f24', glasses: false, beard: true, jacket: '#2b2f36', tie: '#7a2f2f' };
  const VIAJERO = { skin: '#c68b60', shirt: '#7d8a7a', pants: '#3b4048', hair: '#1b1b1b', hairStyle: 'curly', shoes: '#2a2522', glasses: false, beard: false, jacket: null, tie: null };
  const COLEGA = { skin: '#f1c9a5', shirt: '#9aa196', pants: '#46505a', hair: '#8a6a3a', hairStyle: 'bald', shoes: '#2a2522', glasses: true, beard: false, jacket: null, tie: '#2f3f7a' };
  const PIERNAS_SOFA = [{ th: 2.3, kn: 2.4 }, { th: 2.1, kn: 2.2 }];

  // iconos que salen del móvil mientras hace scroll
  function iconos(ctx, x, y, t, t0, t1, seed) {
    for (let k = 0; ; k++) {
      const ts = t0 + k * 0.7 + hash(seed + k) * 0.2;
      if (ts > t1) break;
      const a = (t - ts) / 1.4; if (a < 0 || a > 1) continue;
      const tipo = Math.floor(hash(seed + k * 3) * 4);
      const ix = x + Math.sin(a * 5 + k) * 26 + (hash(seed + k * 7) - 0.5) * 90, iy = y - a * 300;
      ctx.save(); ctx.globalAlpha = a < 0.15 ? a / 0.15 : 1 - Math.max(0, a - 0.7) / 0.3;
      ctx.translate(ix, iy); ctx.scale(0.6 + a * 0.4, 0.6 + a * 0.4);
      ctx.strokeStyle = INK; ctx.lineWidth = 3;
      if (tipo === 0) { ctx.fillStyle = '#ff3b5c'; ctx.beginPath(); ctx.moveTo(0, 18); ctx.bezierCurveTo(-30, -2, -15, -26, 0, -10); ctx.bezierCurveTo(15, -26, 30, -2, 0, 18); ctx.fill(); ctx.stroke(); }
      else if (tipo === 1) { ctx.fillStyle = '#2f7bff'; ctx.beginPath(); ctx.arc(0, 0, 20, 0, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.fillRect(-9, -2, 5, 11); rrect(ctx, -3, -4, 13, 13, 2); ctx.fill(); ctx.beginPath(); ctx.moveTo(-2, -3); ctx.lineTo(2, -13); ctx.lineTo(6, -12); ctx.lineTo(5, -3); ctx.fill(); }
      else if (tipo === 2) { ctx.fillStyle = '#ffd21f'; ctx.beginPath(); ctx.arc(0, 0, 20, 0, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(-7, -5, 2.6, 0, 7); ctx.arc(7, -5, 2.6, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(0, 1, 10, 0.3, Math.PI - 0.3); ctx.stroke(); }
      else { ctx.fillStyle = '#ff6a2e'; ctx.beginPath(); ctx.moveTo(0, -22); ctx.quadraticCurveTo(18, -4, 10, 12); ctx.quadraticCurveTo(0, 22, -10, 12); ctx.quadraticCurveTo(-16, -2, 0, -22); ctx.fill(); ctx.stroke(); }
      ctx.restore();
    }
  }
  function bateria(ctx, x, y, nivel, t) {
    ctx.save(); ctx.translate(x, y);
    const parp = nivel < 0.12 && Math.floor(t * 4) % 2;
    ctx.fillStyle = '#fbf8f0'; ctx.strokeStyle = INK; ctx.lineWidth = 4;
    rrect(ctx, -46, -24, 86, 48, 8); ctx.fill(); ctx.stroke(); ctx.fillStyle = INK; ctx.fillRect(40, -10, 8, 20);
    ctx.fillStyle = nivel > 0.3 ? '#4caf50' : '#e53935';
    if (!parp) ctx.fillRect(-40, -18, 74 * clamp(nivel), 36);
    ctx.restore();
  }
  // el dibujo del niño: familia de la mano, corazón y sol
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
  function confeti(ctx, t, seed, n, colores) {
    for (let i = 0; i < n; i++) {
      const x = hash(seed + i) * W, y = ((hash(seed + i * 2) * 2200 + t * (120 + hash(i) * 120)) % 2200) - 200, r = t * 3 + i;
      ctx.save(); ctx.translate(x + Math.sin(t * 2 + i) * 30, y); ctx.rotate(r);
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
    ctx.fillStyle = '#fbf8f0'; ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill(); ctx.stroke();
    ctx.lineWidth = 3; for (let k = 0; k < 12; k++) { const a = (k * Math.PI) / 6; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r * 0.8, Math.sin(a) * r * 0.8); ctx.lineTo(Math.cos(a) * r * 0.92, Math.sin(a) * r * 0.92); ctx.stroke(); }
    ctx.lineCap = 'round';
    ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.sin(ang / 12) * r * 0.5, -Math.cos(ang / 12) * r * 0.5); ctx.stroke();
    ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.sin(ang) * r * 0.78, -Math.cos(ang) * r * 0.78); ctx.stroke();
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(0, 0, 6, 0, 7); ctx.fill();
    ctx.restore();
  }

  // ======================= 0–5 s: despierta y agarra el móvil =======================
  function escena1(ctx, t) {
    ctx.save(); escenario(ctx, '01_dormitorio_amanecer', lerp(1.0, 1.1, t / 5), lerp(0, -30, t / 5));
    // alarma vibrando
    if (t > 0.5 && t < 1.7) {
      ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.lineCap = 'round';
      const v = Math.sin(t * 60) * 4;
      for (const s of [-1, 1]) for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(287, 750, 70 + k * 18, s > 0 ? -0.5 + v * 0.01 : Math.PI - 0.5, s > 0 ? 0.5 : Math.PI + 0.5); ctx.stroke(); }
    }
    const sube = ease(inv(1.5, 2.2, t)), agarra = t > 2.5;
    persona(ctx, 800, 1010 + 36 * 2.9, 2.9, papa(0), { seated: true, legs: [{ th: 1.5, kn: 0.1 }, { th: 1.45, kn: 0.1 }], facing: -1, lean: lerp(-0.75, 0, sube), arms: agarra ? 'phone' : 'limp', mood: t < 1.5 ? 'tired' : agarra ? 'neutral' : 'shout', blink: t < 0.6, headTilt: agarra ? 0.35 : lerp(-0.3, 0, sube), shadow: false });
    // manta por encima de las piernas
    ctx.fillStyle = '#e9e3d5'; ctx.strokeStyle = INK; ctx.lineWidth = 4;
    ctx.fillStyle = '#ece6d8';
    ctx.beginPath(); ctx.moveTo(600, 1040); ctx.bezierCurveTo(680, 1000, 800, 1010, 880, 1015); ctx.bezierCurveTo(960, 1020, 1040, 1000, 1100, 1005); ctx.lineTo(1100, 1200); ctx.bezierCurveTo(950, 1230, 760, 1210, 640, 1180); ctx.bezierCurveTo(600, 1140, 590, 1090, 600, 1040); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(560, 1060); ctx.quadraticCurveTo(640, 1130, 620, 1240); ctx.moveTo(760, 1030); ctx.quadraticCurveTo(820, 1140, 800, 1280); ctx.moveTo(950, 1030); ctx.quadraticCurveTo(990, 1150, 980, 1290); ctx.stroke();
    if (agarra) iconos(ctx, 690, 640, t, 2.7, 5, 1);
    ctx.restore();
  }

  // ======================= 5–10 s: desayuno; la hija le enseña su dibujo =======================
  function escena2(ctx, t) {
    const lt = t - 5;
    ctx.save(); escenario(ctx, '02_cocina_desayuno', lerp(1.04, 1.0, lt / 5)); sombraSuelo(ctx, 1300);
    const ensena = lt > 1.0 && lt < 3.8, triste = lt > 3.8;
    persona(ctx, 230, 1760, 2.8, MAMA, { mood: triste ? 'sad' : 'neutral', look: 0.4, blink: lt > 2.2 && lt < 2.35 });
    persona(ctx, 520, 1790, 1.7, HIJA, { arms: ensena ? 'up' : 'limp', t: lt, phase: lt * 6, mood: triste ? 'sad' : 'happy', look: 0.6, headTilt: triste ? 0.3 : -0.1, bob: ensena ? 0.5 : 0 });
    if (ensena) dibujo(ctx, 575, 1330 + Math.sin(lt * 8) * 6, 1.05, Math.sin(lt * 6) * 0.08);
    persona(ctx, 830, 1770, 2.85, papa(0.03), { arms: 'phone', facing: -1, headTilt: 0.38, mood: 'tired' });
    iconos(ctx, 760, 1260, t, 5, 10, 2);
    ctx.restore();
  }

  // ======================= 10–14 s: el autobús =======================
  function escena3(ctx, t) {
    const lt = t - 10;
    ctx.save();
    ctx.translate(540, 960); ctx.rotate(Math.sin(t * 2.4) * 0.008); ctx.translate(-540, -960 + Math.sin(t * 9) * 3);
    escenario(ctx, '03_autobus', 1.06);
    // luces que pasan por las ventanas
    ctx.save(); ctx.beginPath(); ctx.rect(0, 300, 1086, 320); ctx.clip();
    for (let i = 0; i < 4; i++) { const x = ((-(lt * 900) + i * 420) % 1600 + 1600) % 1600 - 300; ctx.fillStyle = 'rgba(255,255,240,0.22)'; ctx.beginPath(); ctx.moveTo(x, 300); ctx.lineTo(x + 140, 300); ctx.lineTo(x + 60, 620); ctx.lineTo(x - 80, 620); ctx.fill(); }
    ctx.restore();
    sombraSuelo(ctx, 1250);
    persona(ctx, 230, 1660, 2.5, VIAJERO, { arms: 'phone', headTilt: 0.38, mood: 'tired' });
    persona(ctx, 660, 1770, 2.85, papa(0.06), { arms: 'phone', facing: -1, headTilt: 0.38, mood: 'tired', blink: lt > 2 && lt < 2.15 });
    iconos(ctx, 590, 1270, t, 10, 14, 3);
    ctx.restore();
  }

  // ======================= 14–18 s: la oficina; el reloj vuela =======================
  function escena4(ctx, t) {
    const lt = t - 14;
    ctx.save(); escenario(ctx, '04_oficina', lerp(1.0, 1.08, lt / 4)); sombraSuelo(ctx, 1300);
    const x = lerp(1250, -250, lt / 4);
    persona(ctx, x, 1560, 2.0, COLEGA, { run: 0.45, phase: t * 6.5, facing: -1, arms: 'box', boxColor: '#f3efe2', mood: 'tired' });
    persona(ctx, 640, 1780, 2.85, papa(0.1), { arms: 'phone', facing: -1, headTilt: 0.38, mood: 'tired' });
    iconos(ctx, 570, 1280, t, 14, 18, 4);
    ctx.restore();
    // reloj de pared que gira cada vez más rápido (el tiempo vuela)
    const ang = Math.pow(lt, 2.2) * 6;
    reloj(ctx, 880, 330, 95, ang);
    velo(ctx, '#0b1630', (Math.sin(ang * 0.5) * 0.5 + 0.5) * 0.25 * inv(1, 3, lt));
  }

  // ======================= 18–22 s: el cumpleaños =======================
  function sombrero(ctx, x, y, s, c) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = c; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(14, 0); ctx.lineTo(0, -38); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffe14d'; ctx.beginPath(); ctx.arc(0, -40, 5, 0, 7); ctx.fill(); ctx.restore();
  }
  function escena5(ctx, t) {
    const lt = t - 18;
    ctx.save(); escenario(ctx, '10_cumpleanos', lerp(1.0, 1.06, lt / 4)); sombraSuelo(ctx, 1450);
    const salto = Math.abs(Math.sin(lt * 7)) * 30;
    persona(ctx, 220, 1760, 2.7, MAMA, { arms: 'cheer', t: lt, phase: lt * 8, mood: 'happy', look: 0.5 });
    persona(ctx, 500, 1790 - salto, 1.8, HIJA, { arms: 'up', phase: lt * 8, mood: 'happy', look: 0.7 });
    sombrero(ctx, 508, 1790 - salto - 205, 1.6, '#4ab0a5');
    persona(ctx, 840, 1770, 2.8, papa(0.16), { arms: 'phone', facing: -1, headTilt: 0.38, mood: 'tired' });
    iconos(ctx, 770, 1260, t, 18, 22, 5);
    ctx.restore();
    confeti(ctx, t, 50, 40, ['#ff3b5c', '#ffd21f', '#2f7bff', '#4caf50']);
  }

  // ======================= 22–26 s: el parque; ella le saluda =======================
  function escena6(ctx, t) {
    const lt = t - 22;
    ctx.save(); escenario(ctx, '09_parque_atardecer', 1.25); sombraSuelo(ctx, 1150, 0.25);
    persona(ctx, 820, 1300, 1.55, HIJA, { arms: lt > 0.8 ? 'up' : 'swing', t: lt, phase: lt * 7, mood: lt > 3 ? 'sad' : 'happy', facing: -1, look: 0.5 });
    persona(ctx, 330, 1580, 2.4, papa(0.25), { arms: 'phone', headTilt: 0.38, mood: 'tired' });
    iconos(ctx, 390, 1170, t, 22, 26, 6);
    ctx.restore();
  }

  // ======================= 26–42 s: las estaciones pasan en el mismo sofá =======================
  const SALAS = [
    { k: '05_sala_primavera', seat: 990, win: [104, 277, 952, 782], p: 'petalos' },
    { k: '06_sala_verano', seat: 1160, win: [290, 147, 844, 897], p: null },
    { k: '07_sala_otono', seat: 1060, win: [104, 320, 985, 887], p: 'hojas' },
    { k: '08_sala_invierno', seat: 1190, win: [310, 245, 822, 995], p: 'nieve' },
  ];
  function sala(ctx, t, i, a) {
    const S = SALAS[i], lt = t - 26 - i * 4, edad = lerp(0.3, 0.85, inv(26, 42, t));
    ctx.save(); ctx.globalAlpha = a;
    escenario(ctx, S.k, 1.0 + 0.02 * Math.sin(t * 0.5));
    if (S.p) particulas(ctx, t, S.win, S.p);
    sombraSuelo(ctx, 1400, 0.25);
    // la hija crece en cada estación
    if (i === 0) persona(ctx, lerp(120, 240, ease(inv(0, 3, lt))), 1820, 1.7, HIJA, { run: lt < 3 ? 0.45 : 0, phase: lt * 7, arms: lt > 2.6 ? 'up' : 'swing', mood: 'happy', look: 0.6 });
    if (i === 1) persona(ctx, 200, 1820, 2.1, HIJA, { arms: lt > 0.6 && lt < 3 ? 'up' : 'limp', phase: lt * 6, mood: lt > 3 ? 'sad' : 'happy', look: 0.6 });
    if (i === 2) persona(ctx, lerp(-120, 300, ease(inv(0, 2.5, lt))), 1820, 2.5, HIJA_ADULTA, { run: lt < 2.5 ? 0.42 : 0, phase: lt * 6.5, arms: 'phone', headTilt: 0.35, mood: 'tired' });
    if (i === 3) {
      const sale = lt > 2.2, x = sale ? lerp(260, -300, ease(inv(2.2, 4, lt))) : 260;
      persona(ctx, x, 1820, 2.7, HIJA_ADULTA, { run: sale ? 0.42 : 0, phase: lt * 6.5, facing: sale ? -1 : 1, arms: sale ? 'box' : 'up', boxColor: '#8a5a3a', mood: 'sad', look: 0.6 });
    }
    persona(ctx, 560, S.seat + 36 * 2.7, 2.7, papa(edad), { seated: true, legs: PIERNAS_SOFA, arms: 'phone', headTilt: 0.38, lean: edad * 0.18, mood: 'tired', shadow: false });
    iconos(ctx, 620, S.seat - 270, t, 26 + i * 4, 30 + i * 4, 10 + i);
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
      ctx.translate(lerp(900, -150, a) + hash(k) * 200, 300 + hash(k + 4) * 700 - a * 200); ctx.rotate(a * 6 + k);
      ctx.fillStyle = '#fbf8f0'; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillRect(-28, -34, 56, 68); ctx.strokeRect(-28, -34, 56, 68);
      ctx.fillStyle = '#d1504a'; ctx.fillRect(-28, -34, 56, 14);
      ctx.restore();
    }
  }

  // ======================= 42–46 s: la boda de su hija =======================
  function escena8(ctx, t) {
    const lt = t - 42;
    ctx.save(); escenario(ctx, '11_boda', lerp(1.0, 1.06, lt / 4)); sombraSuelo(ctx, 1250, 0.25);
    persona(ctx, 410, 1600, 2.45, NOVIA, { arms: 'reach', reach: 0.5, mood: 'happy', blink: lt > 1.5 && lt < 1.65 });
    persona(ctx, 660, 1600, 2.45, NOVIO, { arms: 'reach', reach: 0.5, facing: -1, mood: 'happy' });
    // silla y padre mayor mirando el móvil
    ctx.fillStyle = '#efe9dc'; ctx.strokeStyle = INK; ctx.lineWidth = 4;
    ctx.fillRect(830, 1420, 26, 330); ctx.strokeRect(830, 1420, 26, 330); ctx.fillRect(830, 1600, 190, 22); ctx.strokeRect(830, 1600, 190, 22);
    persona(ctx, 905, 1600 + 36 * 2.5, 2.5, papa(0.9), { seated: true, arms: 'phone', headTilt: 0.4, lean: 0.15, mood: 'tired', shadow: false });
    iconos(ctx, 950, 1230, t, 42, 46, 20);
    ctx.restore();
    confeti(ctx, t, 90, 34, ['#fff2f5', '#ffd1dc', '#f7f4ee']);
  }

  // ======================= 46–56 s: se acaba la batería; está solo =======================
  function escena9(ctx, t) {
    const lt = t - 46;
    const zoomFinal = ease(inv(7.2, 10, lt));
    ctx.save();
    // la cámara se acerca al dibujo sobre la mesa al final
    const cx = lerp(540, 560, zoomFinal), cy = lerp(960, 1262, zoomFinal), z = lerp(1, 3.6, zoomFinal);
    ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-cx, -cy);
    escenario(ctx, '12_sala_vieja', lerp(1.0, 1.05, lt / 10));
    particulas(ctx, t, [280, 163, 845, 815], 'nieve');
    sombraSuelo(ctx, 1450, 0.3);
    const muerto = lt > 2.6, mira = lt > 3.2, alcanza = lt > 5.2;
    dibujo(ctx, 560, 1265, 0.8, -0.06);
    persona(ctx, 560, 1092 + 36 * 2.7, 2.7, papa(1), { seated: true, legs: PIERNAS_SOFA, arms: alcanza ? 'reach' : muerto ? 'limp' : 'phone', reach: inv(5.2, 7, lt), headTilt: mira ? lerp(0.38, alcanza ? 0.45 : -0.15, ease(inv(3.2, 4, lt))) : 0.4, look: mira && !alcanza ? Math.sin(lt * 1.6) * 0.8 : 0, lean: 0.2, mood: mira ? 'sad' : 'tired', blink: lt > 4.6 && lt < 4.75, shadow: false });
    if (!muerto) { bateria(ctx, 650, 760, lerp(0.15, 0, inv(0, 2.4, lt)), t); iconos(ctx, 620, 820, t, 46, 48, 30); }
    if (muerto && lt < 4.5) {
      // el móvil cae sobre el sofá con la pantalla negra
      const k = easeIn(inv(2.6, 3.0, lt));
      ctx.save(); ctx.translate(680, lerp(950, 1060, k)); ctx.rotate(k * 1.2);
      ctx.fillStyle = '#111'; rrect(ctx, -14, -24, 28, 48, 5); ctx.fill(); ctx.restore();
    }
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
    post(ctx, W, H, t, { bloom: 0.12, top: mix('#ffe2b0', '#d9dde0', frio), bottom: mix('#3d5a66', '#2c3238', frio) });
    if (t > 46 && t < 56) { ctx.save(); ctx.globalCompositeOperation = 'saturation'; ctx.fillStyle = `rgba(128,128,128,${0.45 * inv(48.6, 50, t)})`; ctx.fillRect(0, 0, W, H); ctx.restore(); }
    for (const b of [5, 10, 14, 18, 22, 26, 42, 46, 56]) if (Math.abs(t - b) < 0.12) velo(ctx, '#000', 1 - Math.abs(t - b) / 0.12);
    if (t < 0.6) velo(ctx, '#000', 1 - t / 0.6);
    ctx.restore();
  }
  window.FELICIDAD = { W, H, DURACION, renderFrame };
})();
