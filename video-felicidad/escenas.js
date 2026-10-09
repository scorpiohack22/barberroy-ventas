// "Felicidad" — cortometraje vertical (1080×1920) de 60 s hecho 100% con código.
// Inspirado en "Happiness" de Steve Cutts. renderFrame(ctx, t) dibuja el instante t (segundos) de forma determinista.
(function () {
  const {
    INK, clamp, lerp, inv, ease, easeOut, easeIn, rng, pick, hash, shade, mix, rrect,
    nuevaPersona, PROTA, persona, espalda, coche, edificio, cartel, nubes, farola, post,
  } = LIB;
  const W = 1080, H = 1920, DURACION = 60;

  function camara(ctx, cx, cy, z, rot = 0) {
    ctx.translate(W / 2, H / 2); ctx.rotate(rot); ctx.scale(z, z); ctx.translate(-cx, -cy);
  }
  function fondo(ctx, top, bottom) {
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, top); g.addColorStop(1, bottom);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
  // Dibuja en una capa a media resolución y la desenfoca de una sola vez (mucho más rápido que filter por trazo).
  let capa = null;
  function desenfocado(ctx, px, fn) {
    if (!capa) { capa = document.createElement('canvas'); capa.width = W / 2; capa.height = H / 2; }
    const c = capa.getContext('2d');
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, capa.width, capa.height);
    const m = ctx.getTransform();
    c.setTransform(new DOMMatrix([0.5, 0, 0, 0.5, 0, 0]).multiply(m));
    fn(c);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.filter = `blur(${px}px)`; ctx.drawImage(capa, 0, 0, W, H); ctx.restore();
  }
  function velo(ctx, color, a) { if (a <= 0) return; ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = clamp(a); ctx.fillStyle = color; ctx.fillRect(0, 0, W, H); ctx.restore(); }

  // texto LED (matriz de puntos)
  let matrizTitulo = null;
  function matrizTexto(txt, rows) {
    const c = document.createElement('canvas'); c.width = txt.length * rows; c.height = rows;
    const x = c.getContext('2d');
    x.fillStyle = '#fff'; x.font = `bold ${rows}px "DejaVu Sans Mono"`; x.textBaseline = 'top'; x.fillText(txt, 0, 0);
    const d = x.getImageData(0, 0, c.width, c.height).data, pts = [];
    let maxX = 0;
    for (let j = 0; j < c.height; j++) for (let i = 0; i < c.width; i++) if (d[(j * c.width + i) * 4 + 3] > 110) { pts.push([i, j]); maxX = Math.max(maxX, i); }
    return { pts, w: maxX + 1, h: c.height };
  }
  function puntosLED(ctx, m, cx, cy, dot, color, prog) {
    const x0 = cx - (m.w * dot) / 2, y0 = cy - (m.h * dot) / 2;
    ctx.fillStyle = 'rgba(90,60,15,0.35)';
    for (let j = 0; j < m.h; j++) for (let i = 0; i < m.w; i++) { ctx.beginPath(); ctx.arc(x0 + i * dot, y0 + j * dot, dot * 0.3, 0, 7); ctx.fill(); }
    ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = dot * 1.6;
    for (const [i, j] of m.pts) { if (i / m.w > prog) continue; ctx.beginPath(); ctx.arc(x0 + i * dot, y0 + j * dot, dot * 0.4, 0, 7); ctx.fill(); }
    ctx.shadowBlur = 0;
  }

  // ======================= 0–6 s: estampida sobre blanco =======================
  const corredores = (() => {
    const r = rng(11), out = [];
    for (let i = 0; i < 150; i++) {
      const y = 1020 + r() * 820;
      out.push({ p: nuevaPersona(r, r() < 0.12), spawn: 2.0 + 3.9 * Math.pow(i / 150, 0.6), y, s: 0.55 + ((y - 1020) / 820) * 1.3, v: 400 + r() * 220, ph: r() * 6, x0: -160 - r() * 260 });
    }
    return out;
  })();
  function escena1(ctx, t) {
    const g = ctx.createRadialGradient(540, 1000, 100, 540, 1000, 1300);
    g.addColorStop(0, '#f8f5ee'); g.addColorStop(1, '#ddd6c6'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const parar = 2.3, salir = 2.9;
    let px = 140 + Math.min(t, parar) * 120;
    if (t > salir) px += Math.pow(t - salir, 1.4) * 700;
    const z = lerp(1.75, 0.82, ease(inv(1.6, 6, t)));
    const cx = lerp(Math.min(px, 560), 540, ease(inv(2.2, 4.6, t))), cy = lerp(1130, 1180, ease(inv(1.6, 6, t)));
    ctx.save(); camara(ctx, cx, cy, z);
    { const gf = ctx.createLinearGradient(0, 900, 0, 1500); gf.addColorStop(0, 'rgba(120,110,95,0)'); gf.addColorStop(1, 'rgba(120,110,95,0.12)'); ctx.fillStyle = gf; ctx.fillRect(-800, 900, 2800, 1500); }
    const lista = [];
    for (const c of corredores) {
      if (t < c.spawn) continue;
      const x = c.x0 + (t - c.spawn) * c.v * (0.6 + c.s * 0.45);
      if (x > 1500) continue;
      lista.push({ y: c.y, draw: () => persona(ctx, x, c.y, c.s, c.p, { run: 1, phase: c.ph + t * 12.5, mood: 'neutral', zoom: z }) });
    }
    const mira = t > parar && t < salir;
    lista.push({ y: 1300, draw: () => persona(ctx, px, 1300, 1.5, PROTA, { run: t < parar ? 0.42 : t > salir ? lerp(0.5, 1, inv(salir, salir + 0.6, t)) : 0, phase: t < parar ? t * 6.5 : t * 12, facing: mira ? -1 : 1, mood: mira ? 'shout' : 'neutral', zoom: z, blink: t > 1.1 && t < 1.22 }) });
    lista.sort((a, b) => a.y - b.y).forEach(d => d.draw());
    ctx.restore();
    if (t > 4.7) {
      desenfocado(ctx, 6, c => {
        const r = rng(5);
        for (let i = 0; i < 6; i++) { const sp = 4.7 + i * 0.2; if (t < sp) continue; persona(c, -260 + (t - sp) * 1300 + r() * 120, 2150 + r() * 80, 3.6, nuevaPersona(r, false), { run: 1, phase: t * 12 + i, shadow: false }); }
      });
    }
    velo(ctx, '#55604f', Math.pow(inv(5.3, 6, t), 2) * 0.9);
  }

  // ======================= 6–8.5 s: marea humana =======================
  const filas = (() => {
    const out = [], r = rng(21);
    for (let k = 0; k < 11; k++) {
      const y = 180 + Math.pow(k / 10, 1.25) * 1880, s = 0.3 + Math.pow(k / 10, 1.4) * 2.3;
      const gente = [], paso = 44 * s, n = Math.ceil((W + 500) / paso);
      for (let i = 0; i < n; i++) gente.push({ p: nuevaPersona(r, r() < 0.12), dx: i * paso + r() * 16 * s, dy: (r() - 0.5) * 34 * s, ph: r() * 6 });
      out.push({ y, s, v: 260 * s + 60, gente, span: n * paso });
    }
    return out;
  })();
  function escena2a(ctx, t) {
    const lt = t - 6;
    fondo(ctx, '#7b8873', '#3f4a3e');
    ctx.save(); ctx.translate(0, -lt * 35);
    filas.forEach((f, k) => {
      for (const q of f.gente) {
        const x = ((q.dx + lt * f.v) % f.span) - 250;
        persona(ctx, x, f.y + q.dy, f.s, q.p, { run: 1, phase: q.ph + t * 12, shadow: false });
      }
      if (k < 5) { ctx.fillStyle = `rgba(123,136,115,${0.22 - k * 0.04})`; ctx.fillRect(0, -200, W, f.y + 260); }
    });
    ctx.restore();
    velo(ctx, '#1d221c', inv(8.1, 8.5, t));
  }

  // ======================= 8.5–12 s: el metro =======================
  const pasajeros = (() => { const r = rng(31), o = []; for (let i = 0; i < 160; i++) o.push({ x: r(), y: r(), p: nuevaPersona(r, r() < 0.2), f: r() < 0.5 ? 1 : -1, m: pick(r, ['tired', 'neutral', 'sad']) }); return o; })();
  const anden = (() => { const r = rng(41), o = []; for (let k = 0; k < 3; k++) for (let i = 0; i < 6 + k; i++) o.push({ x: -40 + i * (1160 / (5 + k)) + r() * 50, y: 1430 + k * 170 + r() * 30, s: 1.35 + k * 0.5, p: nuevaPersona(r, r() < 0.15) }); return o.sort((a, b) => a.y - b.y); })();
  function escena2b(ctx, t) {
    const lt = t - 8.5;
    ctx.fillStyle = '#1f2622'; ctx.fillRect(0, 0, W, H);
    const z = 1 + 0.42 * ease(inv(10.4, 12, t));
    ctx.save(); camara(ctx, 540, lerp(960, 640, ease(inv(10.4, 12, t))), z);
    const gv = ctx.createLinearGradient(0, -200, 0, 300); gv.addColorStop(0, '#2b332d'); gv.addColorStop(1, '#4a5a4c');
    ctx.fillStyle = gv; ctx.fillRect(-300, -300, 1700, 600);
    for (let i = 0; i < 4; i++) { const lx = 60 + i * 270; ctx.fillStyle = '#f4f7e8'; ctx.shadowColor = '#f4f7e8'; ctx.shadowBlur = 30; ctx.fillRect(lx, 60, 160, 12); ctx.shadowBlur = 0; }
    ctx.fillStyle = '#5a7a5c'; ctx.fillRect(-300, 260, 1700, 940);
    ctx.strokeStyle = 'rgba(25,45,30,0.35)'; ctx.lineWidth = 2;
    for (let y = 260, k = 0; y < 1200; y += 28, k++) { ctx.beginPath(); ctx.moveTo(-300, y); ctx.lineTo(1400, y); ctx.stroke(); for (let x = -300 + (k % 2) * 28; x < 1400; x += 56) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 28); ctx.stroke(); } }
    const gl = ctx.createLinearGradient(0, 260, 0, 1200); gl.addColorStop(0, 'rgba(255,255,230,0.18)'); gl.addColorStop(1, 'rgba(0,0,0,0.25)'); ctx.fillStyle = gl; ctx.fillRect(-300, 260, 1700, 940);
    ctx.fillStyle = '#8a3b2f'; ctx.fillRect(-300, 610, 1700, 18); ctx.fillStyle = '#e8dfc4'; ctx.fillRect(-300, 628, 1700, 8);
    ctx.fillStyle = '#f1ecdf'; ctx.strokeStyle = INK; ctx.lineWidth = 4; rrect(ctx, 230, 650, 620, 70, 10); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#2c4fa3'; ctx.font = '900 40px "Inter Display"'; ctx.textAlign = 'center'; ctx.fillText('ESTACIÓN CONSUMO', 540, 700); ctx.textAlign = 'left';
    ctx.fillStyle = '#211f1c'; ctx.fillRect(-300, 1200, 1700, 90);
    // tren
    const tx = lerp(1700, 0, easeOut(inv(0, 1.45, lt)));
    ctx.save(); ctx.translate(tx, 0);
    const gt = ctx.createLinearGradient(0, 760, 0, 1250); gt.addColorStop(0, '#e2d8a8'); gt.addColorStop(0.5, '#c9bf8c'); gt.addColorStop(1, '#8f8760');
    ctx.fillStyle = gt; ctx.strokeStyle = INK; ctx.lineWidth = 5; rrect(ctx, -80, 760, 1800, 480, 40); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#7a2f2a'; ctx.fillRect(-80, 1150, 1800, 26); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(-60, 785, 1760, 8);
    const puerta = easeOut(inv(1.9, 2.4, lt)) * 80;
    for (let i = 0; i < 4; i++) {
      const wx = 30 + i * 420;
      ctx.save(); rrect(ctx, wx, 830, 300, 270, 20); ctx.clip();
      ctx.fillStyle = '#d8d2b0'; ctx.fillRect(wx, 830, 300, 270);
      for (let k = 0; k < 40; k++) {
        const c = pasajeros[(i * 40 + k) % pasajeros.length];
        persona(ctx, wx + c.x * 300 + Math.sin(t * 8 + k) * 2, 980 + c.y * 300, 0.95, c.p, { facing: c.f, mood: c.m, arms: 'limp', shadow: false });
      }
      ctx.fillStyle = 'rgba(200,225,230,0.18)'; ctx.beginPath(); ctx.moveTo(wx, 1100); ctx.lineTo(wx + 140, 830); ctx.lineTo(wx + 210, 830); ctx.lineTo(wx + 70, 1100); ctx.fill();
      ctx.restore();
      ctx.strokeStyle = INK; ctx.lineWidth = 5; rrect(ctx, wx, 830, 300, 270, 20); ctx.stroke();
      const dx = wx + 330;
      ctx.fillStyle = '#b7ad7c'; ctx.fillRect(dx - puerta, 800, 45, 400); ctx.fillRect(dx + 45 + puerta, 800, 45, 400);
      ctx.strokeRect(dx - puerta, 800, 45, 400); ctx.strokeRect(dx + 45 + puerta, 800, 45, 400);
    }
    ctx.restore();
    // letrero LED con el título
    ctx.strokeStyle = '#555'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(300, 0); ctx.lineTo(300, 300); ctx.moveTo(780, 0); ctx.lineTo(780, 300); ctx.stroke();
    ctx.fillStyle = '#111'; ctx.strokeStyle = '#4a4a4a'; ctx.lineWidth = 10; rrect(ctx, 90, 290, 900, 280, 16); ctx.fill(); ctx.stroke();
    puntosLED(ctx, matrizTitulo, 540, 410, 9.4, '#ffb52e', inv(9.7, 10.7, t));
    if (t > 10.9) { ctx.fillStyle = '#ffb52e'; ctx.font = '700 26px "DejaVu Sans Mono"'; ctx.textAlign = 'center'; ctx.shadowColor = '#ffb52e'; ctx.shadowBlur = 10; ctx.fillText('UN CORTO HECHO CON CÓDIGO', 540, 530); ctx.shadowBlur = 0; ctx.textAlign = 'left'; }
    ctx.fillStyle = '#6d6a62'; ctx.fillRect(-300, 1290, 1700, 900);
    ctx.fillStyle = '#e2c33a'; ctx.fillRect(-300, 1296, 1700, 16);
    ctx.restore();
    for (const c of anden) {
      const push = Math.sin(t * 5 + c.x) * 3 - easeIn(inv(10.6, 12, t)) * 40;
      espalda(ctx, c.x, c.y + push, c.s, c.p);
    }
  }

  // ======================= 12–20 s: la ciudad de los anuncios =======================
  const ANUNCIOS = [
    ['COMPRA YA', '', '#d1504a', '#fff'], ['SÉ FELIZ', 'cuesta poco', '#e7d34c', '#222'], ['50% OFF', 'solo hoy', '#e48bb3', '#222'],
    ['LO NECESITAS', '', '#4ab0a5', '#fff'], ['NUEVO', 'modelo 2026', '#8c6bc9', '#fff'], ['MÁS ES MEJOR', '', '#f08a3c', '#222'],
    ['¿AÚN NO LO TIENES?', '', '#5b7fc9', '#fff'], ['HAZLO HOY', 'mañana es tarde', '#6aa86b', '#fff'], ['SONRÍE', 'y compra', '#f3efe2', '#d1504a'],
    ['SALE', '', '#222', '#e7d34c'], ['TÚ LO VALES', '', '#c96b5b', '#fff'], ['5G · 4K · 8K', 'lo último', '#e7e2d0', '#333'],
  ];
  const CALLE = 3300;
  const fachadas = (() => {
    const r = rng(51);
    const defs = [[-60, 400, 2350, '#b9ac93'], [330, 440, 2700, '#a4a99a'], [760, 400, 2150, '#c2b59d']];
    return defs.map(([x, w, h, c], i) => {
      const ads = [];
      let y = CALLE - h + 120;
      while (y < CALLE - 760) { const hh = 160 + r() * 120; ads.push({ y, h: hh, ad: pick(r, ANUNCIOS), m: 20 + r() * 40, rot: (r() - 0.5) * 0.06 }); y += hh + 60 + r() * 120; }
      return { x, w, h, c, seed: 100 + i, ads, fl: r() };
    });
  })();
  const peatones = (() => { const r = rng(61), o = []; for (let i = 0; i < 26; i++) o.push({ x: r() * 1500 - 200, y: CALLE + 30 + r() * 300, dir: r() < 0.5 ? 1 : -1, v: 45 + r() * 40, p: nuevaPersona(r, r() < 0.35), ph: r() * 6, phone: r() < 0.75 }); return o; })();
  function escena3(ctx, t) {
    const lt = t - 12;
    fondo(ctx, '#d9d6c2', '#b9bca9');
    const cy = lerp(900, 2700, ease(inv(0, 5.6, lt)));
    ctx.save(); ctx.translate(0, -(cy - 900) * 0.35);
    const r0 = rng(3);
    for (let x = -60; x < 1200; x += 95) edificio(ctx, x, 2300, 86, 900 + r0() * 900, { color: '#b9bcae', lw: 1.4, lado: 0, winColor: '#a3aaa4', lit: 0.05, seed: x + 7, bajos: 0 });
    ctx.fillStyle = 'rgba(217,214,194,0.45)'; ctx.fillRect(0, -500, W, 3000);
    ctx.restore();
    ctx.save(); camara(ctx, 540, cy, 1);
    for (const f of fachadas) {
      edificio(ctx, f.x, CALLE, f.w, f.h, { color: f.c, seed: f.seed, techo: true, lit: 0.22, ac: 0.1, fireEscape: f.x > 700 });
      for (const a of f.ads) {
        const on = Math.sin(t * 11 + a.y) > -0.75;
        cartel(ctx, f.x + a.m, a.y, f.w - a.m * 2, a.h, on ? a.ad[2] : shade(a.ad[2], -0.35), a.ad[3], a.ad[0], a.ad[1], { rot: a.rot, focos: 3 });
      }
    }
    const neon = Math.sin(t * 9) > -0.6;
    ctx.save(); ctx.translate(310, 1500);
    ctx.fillStyle = '#2b2b2b'; ctx.strokeStyle = INK; ctx.lineWidth = 4; rrect(ctx, -38, 0, 76, 560, 12); ctx.fill(); ctx.stroke();
    ctx.font = '900 70px "Inter Display"'; ctx.textAlign = 'center'; ctx.fillStyle = neon ? '#ff5c8a' : '#6b3344'; ctx.shadowColor = '#ff5c8a'; ctx.shadowBlur = neon ? 25 : 0;
    'SALE'.split('').forEach((ch, i) => ctx.fillText(ch, 0, 110 + i * 125));
    ctx.restore(); ctx.textAlign = 'left';
    cartel(ctx, 360, CALLE - 2700 - 330, 380, 260, '#d1504a', '#fff', 'COMPRA', 'y serás feliz', { patas: 70, focos: 4 });
    // cine
    const mx = 300;
    ctx.fillStyle = '#7a2f2a'; ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.fillRect(mx, CALLE - 640, 480, 640); ctx.strokeRect(mx, CALLE - 640, 480, 640);
    ctx.fillStyle = '#f3efe2'; ctx.fillRect(mx + 20, CALLE - 620, 440, 210); ctx.strokeRect(mx + 20, CALLE - 620, 440, 210);
    for (let i = 0; i < 22; i++) { const on = (Math.floor(t * 8) + i) % 2; ctx.fillStyle = on ? '#ffd55a' : '#8f7230'; ctx.shadowColor = '#ffd55a'; ctx.shadowBlur = on ? 10 : 0; ctx.beginPath(); ctx.arc(mx + 30 + i * 20, CALLE - 632, 6, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(mx + 30 + i * 20, CALLE - 398, 6, 0, 7); ctx.fill(); ctx.shadowBlur = 0; }
    ctx.fillStyle = '#222'; ctx.textAlign = 'center'; ctx.font = '900 76px "Inter Display"'; ctx.fillText('FELICIDAD', mx + 240, CALLE - 520);
    ctx.font = '700 24px "Inter"'; ctx.fillText('FUNCIÓN ÚNICA · ESTA NOCHE', mx + 240, CALLE - 470);
    if (lt > 5.1) { const k = easeOut(inv(5.1, 5.45, lt)); ctx.save(); ctx.translate(mx + 240, CALLE - 438); ctx.rotate(-0.07); ctx.scale(lerp(2.4, 1, k), lerp(2.4, 1, k)); ctx.globalAlpha = k; ctx.fillStyle = '#d1504a'; ctx.fillRect(-120, -22, 240, 44); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.strokeRect(-114, -16, 228, 32); ctx.fillStyle = '#fff'; ctx.font = '900 30px "Inter Display"'; ctx.fillText('AGOTADO', 0, 11); ctx.restore(); }
    for (const dx of [50, 190, 330]) { ctx.fillStyle = '#e9d9a8'; ctx.fillRect(mx + dx, CALLE - 330, 100, 330); ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.strokeRect(mx + dx, CALLE - 330, 100, 330); ctx.fillStyle = 'rgba(90,60,30,0.35)'; ctx.fillRect(mx + dx + 10, CALLE - 320, 80, 150); }
    ctx.textAlign = 'left';
    farola(ctx, 70, CALLE + 10, 420, true); farola(ctx, 1000, CALLE + 10, 420, true);
    ctx.fillStyle = '#9a978b'; ctx.fillRect(-200, CALLE, 1500, 330);
    ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 2;
    for (let x = -200; x < 1300; x += 120) { ctx.beginPath(); ctx.moveTo(x, CALLE); ctx.lineTo(x - 60, CALLE + 330); ctx.stroke(); }
    ctx.fillStyle = '#6e6c64'; ctx.fillRect(-200, CALLE + 330, 1500, 30);
    ctx.fillStyle = '#4b4a46'; ctx.fillRect(-200, CALLE + 360, 1500, 400);
    const lista = [];
    for (const q of peatones) {
      const x = ((q.x + q.dir * q.v * lt) % 1600 + 1600) % 1600 - 260;
      const s = 1.05 + ((q.y - CALLE) / 300) * 0.8;
      lista.push({ y: q.y, draw: () => persona(ctx, x, q.y, s, q.p, { run: 0.42, phase: q.ph + t * 6.5, facing: q.dir, arms: q.phone ? 'phone' : 'swing', headTilt: q.phone ? 0.38 : 0, mood: q.phone ? 'tired' : 'neutral' }) });
    }
    const andar = lt < 5.4;
    const px = lerp(120, 560, ease(inv(0, 5.4, lt)));
    lista.push({ y: CALLE + 200, draw: () => persona(ctx, px, CALLE + 200, 1.75, PROTA, { run: andar ? 0.42 : 0, phase: t * 6.5, arms: lt < 3.4 ? 'phone' : 'swing', headTilt: lt < 3.4 ? 0.38 : lerp(0, -0.5, ease(inv(4.6, 6.2, lt))), mood: lt > 5.5 ? 'sad' : 'neutral', blink: lt > 6.6 && lt < 6.75 }) });
    lista.sort((a, b) => a.y - b.y).forEach(d => d.draw());
    const cxp = ((lt * 1300) % 3200) - 600;
    desenfocado(ctx, 3, c => coche(c, cxp, CALLE + 640, 1.7, '#e3b53c', { wheel: lt * 22, spin: 1, passenger: true }));
    ctx.restore();
  }

  // ======================= 20–28 s: Black Friday =======================
  const masa = (() => { const r = rng(71), o = []; for (let k = 0; k < 5; k++) for (let i = 0; i < 7 + k; i++) o.push({ x: -60 + i * (1200 / (6 + k)) + r() * 60, y: 1250 + k * 150 + r() * 40, s: 1.0 + k * 0.38, p: nuevaPersona(r, r() < 0.3), ph: r() * 6, lane: r() }); return o.sort((a, b) => a.y - b.y); })();
  const objetos = (() => { const r = rng(81), o = []; for (let i = 0; i < 26; i++) o.push({ a: -Math.PI / 2 + (r() - 0.5) * 2.6, v: 400 + r() * 700, rot: (r() - 0.5) * 10, t0: 22.4 + r() * 2.5, c: pick(r, ['#e9d24a', '#e48bb3', '#4ab0a5', '#f3efe2', '#8c6bc9']), txt: pick(r, ['TV 4K', '5G', 'HD', 'NEW', '-70%', 'PRO']) }); return o; })();
  function fachadaTienda(ctx, t, abierta) {
    fondo(ctx, '#e8e3d3', '#cfc8b4');
    ctx.fillStyle = '#262626'; ctx.fillRect(0, 0, W, 240);
    ctx.fillStyle = '#ffe04d'; ctx.shadowColor = '#ffd21f'; ctx.shadowBlur = 30; ctx.font = '900 118px "Inter Display"'; ctx.textAlign = 'center'; ctx.fillText('MEGA STORE', 540, 165); ctx.shadowBlur = 0; ctx.textAlign = 'left';
    cartel(ctx, 30, 290, 470, 120, '#111', '#e7d34c', 'BLACK FRIDAY', '', { rot: -0.1 });
    cartel(ctx, 580, 290, 470, 120, '#111', '#e7d34c', 'BLACK FRIDAY', '', { rot: 0.1 });
    cartel(ctx, 190, 450, 700, 150, '#d1504a', '#fff', 'HASTA -70%', 'en todo · hasta agotar existencias');
    ctx.fillStyle = '#3a3f3e'; ctx.fillRect(130, 640, 820, 680);
    ctx.fillStyle = '#fbf3d2'; ctx.fillRect(145, 655, 790, 665);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) { ctx.fillStyle = '#2d3236'; ctx.fillRect(175 + c * 125, 700 + r * 150, 105, 70); ctx.fillStyle = `hsl(${(c * 60 + r * 40 + t * 90) % 360},55%,62%)`; ctx.fillRect(181 + c * 125, 706 + r * 150, 93, 58); }
    const ox = 400 * abierta;
    ctx.fillStyle = 'rgba(160,195,200,0.78)'; ctx.strokeStyle = INK; ctx.lineWidth = 6;
    ctx.fillRect(145 - ox, 655, 395, 665); ctx.strokeRect(145 - ox, 655, 395, 665);
    ctx.fillRect(540 + ox, 655, 395, 665); ctx.strokeRect(540 + ox, 655, 395, 665);
    ctx.fillStyle = 'rgba(255,255,255,0.28)'; for (const dx of [145 - ox, 540 + ox]) { ctx.beginPath(); ctx.moveTo(dx + 40, 1320); ctx.lineTo(dx + 230, 655); ctx.lineTo(dx + 300, 655); ctx.lineTo(dx + 110, 1320); ctx.fill(); }
    cartel(ctx, 10, 700, 110, 420, '#e48bb3', '#222', 'SALE', '', {});
    cartel(ctx, 960, 700, 110, 420, '#4ab0a5', '#fff', '-50%', '', {});
    ctx.fillStyle = '#8f8a7c'; ctx.fillRect(0, 1320, W, 600);
  }
  function escena4(ctx, t) {
    if (t < 27) {
      const abierta = easeOut(inv(22, 22.45, t));
      const shake = t > 22 && t < 25.5 ? 9 : t < 22 ? 2 : 0;
      ctx.save();
      ctx.translate((hash(t * 30) - 0.5) * shake * 2, (hash(t * 30 + 9) - 0.5) * shake * 2);
      if (t < 25) {
        fachadaTienda(ctx, t, abierta);
        if (t > 20.4 && t < 22) {
          const n = 3 - Math.floor((t - 20.4) / 0.53), f = ((t - 20.4) % 0.53) / 0.53;
          ctx.save(); ctx.translate(540, 1000); ctx.scale(1.7 - f * 0.5, 1.7 - f * 0.5);
          ctx.font = '900 260px "Inter Display"'; ctx.textAlign = 'center'; ctx.lineWidth = 14; ctx.strokeStyle = `rgba(42,38,34,${1 - f * 0.6})`; ctx.strokeText(String(n), 0, 90);
          ctx.fillStyle = `rgba(209,80,74,${1 - f * 0.6})`; ctx.fillText(String(n), 0, 90); ctx.restore();
        }
        const lista = [];
        for (const m of masa) {
          if (t < 22) lista.push({ y: m.y, draw: () => espalda(ctx, m.x + Math.sin(t * 20 + m.ph) * 4, m.y + Math.sin(t * 15 + m.ph) * 5, m.s, m.p) });
          else {
            const k = easeIn(clamp((t - 22 - m.lane * 1.0) / 1.5));
            if (k >= 1) continue;
            const x = lerp(m.x, 540 + (m.x - 540) * 0.12, k), y = lerp(m.y + 280 * m.s, 1310, k);
            lista.push({ y, draw: () => persona(ctx, x, y, m.s * lerp(1.1, 0.4, k), m.p, { run: 1, phase: m.ph + t * 15, facing: m.x < 540 ? 1 : -1, mood: 'shout', arms: k > 0.25 ? 'up' : 'swing' }) });
          }
        }
        lista.sort((a, b) => a.y - b.y).forEach(d => d.draw());
        if (t > 22 && t < 22.3) velo(ctx, '#ffffff', 1 - inv(22, 22.3, t));
      } else {
        fondo(ctx, '#e8e3d3', '#bdb6a2');
        cartel(ctx, 40, 120, 480, 120, '#111', '#e7d34c', 'BLACK FRIDAY', '', { rot: -0.08 });
        cartel(ctx, 560, 160, 480, 120, '#111', '#e7d34c', 'SALE · SALE', '', { rot: 0.08 });
        const r = rng(91), crece = ease(inv(25, 26.6, t));
        const items = [];
        for (let i = 0; i < 150; i++) {
          const a = r() * Math.PI, d = Math.sqrt(r());
          const x = 540 + Math.cos(a) * 640 * d, y = 2000 - Math.sin(a) * 1250 * d * crece;
          items.push({ y, i, x, box: r() < 0.28, c: pick(r, ['#e9d24a', '#e48bb3', '#4ab0a5', '#f3efe2']), rot: r() * 6, p: nuevaPersona(r, r() < 0.3), s: 1.0 + r() * 0.6, up: r() < 0.5, f: r() < 0.5 ? 1 : -1, lean: (r() - 0.5) * 1.2 });
        }
        items.sort((a, b) => a.y - b.y);
        for (const it of items) {
          const jit = Math.sin(t * 18 + it.i) * 5;
          if (it.box) { ctx.save(); ctx.translate(it.x + jit, it.y); ctx.rotate(it.rot); ctx.fillStyle = it.c; ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.fillRect(-45, -30, 90, 60); ctx.strokeRect(-45, -30, 90, 60); ctx.fillStyle = shade(it.c, -0.2); ctx.fillRect(-44, -29, 88, 12); ctx.restore(); }
          else persona(ctx, it.x + jit, it.y + 60, it.s, it.p, { run: 0.6, phase: t * 14 + it.i, arms: it.up ? 'up' : 'box', mood: 'shout', facing: it.f, lean: it.lean, shadow: false });
        }
      }
      for (const o of objetos) {
        const k = (t - o.t0) / 1.2;
        if (k < 0 || k > 1) continue;
        const s = lerp(0.4, 4, easeIn(k));
        ctx.save(); ctx.translate(540 + Math.cos(o.a) * o.v * k * 0.9, 1000 + Math.sin(o.a) * o.v * k * 1.2 + k * k * 900); ctx.rotate(o.rot * k); ctx.scale(s, s);
        ctx.fillStyle = o.c; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillRect(-30, -20, 60, 40); ctx.strokeRect(-30, -20, 60, 40);
        ctx.fillStyle = shade(o.c, -0.2); ctx.fillRect(-29, -19, 58, 8);
        ctx.fillStyle = INK; ctx.font = '900 13px "Inter Display"'; ctx.textAlign = 'center'; ctx.fillText(o.txt, 0, 9); ctx.restore();
      }
      ctx.restore(); ctx.textAlign = 'left';
    } else {
      fondo(ctx, '#dcd6c4', '#a9a290');
      ctx.fillStyle = '#b9b2a0'; ctx.fillRect(0, 1250, W, 670);
      const r = rng(101);
      for (let i = 0; i < 34; i++) { ctx.save(); ctx.translate(r() * W, 1300 + r() * 600); ctx.rotate(r() * 6); ctx.fillStyle = pick(r, ['#e9d24a', '#e48bb3', '#f3efe2', '#cfc9b6']); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.fillRect(-30, -18, 60, 36); ctx.strokeRect(-30, -18, 60, 36); ctx.restore(); }
      cartel(ctx, 620, 380, 420, 110, '#111', '#e7d34c', 'BLACK FRI', '', { rot: 0.55 });
      persona(ctx, 500, 1640, 3.0, PROTA, { arms: 'box', mood: 'happy', boxColor: '#e9d24a', lean: -0.04 });
    }
  }

  // ======================= 28–36 s: el coche, el atasco y la lluvia =======================
  function escena5(ctx, t) {
    const lt = t - 28;
    if (lt < 2) {
      fondo(ctx, '#f3e3bb', '#e8cf98');
      ctx.save(); ctx.translate(540, 520);
      for (let i = 0; i < 16; i++) { ctx.rotate(Math.PI / 8); ctx.fillStyle = 'rgba(255,225,150,0.35)'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(1800, -120); ctx.lineTo(1800, 120); ctx.closePath(); ctx.fill(); }
      ctx.restore();
      ctx.fillStyle = '#f3efe2'; ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.fillRect(60, 520, 960, 760); ctx.strokeRect(60, 520, 960, 760);
      ctx.fillStyle = '#d6372b'; ctx.fillRect(60, 520, 960, 150); ctx.strokeRect(60, 520, 960, 150);
      ctx.fillStyle = '#fff'; ctx.font = 'italic 900 100px "Inter Display"'; ctx.textAlign = 'center'; ctx.fillText('Autos Alegría', 540, 630); ctx.textAlign = 'left';
      const gw = ctx.createLinearGradient(0, 690, 0, 1280); gw.addColorStop(0, '#b8d0d4'); gw.addColorStop(1, '#8fa8ad');
      ctx.fillStyle = gw; ctx.fillRect(100, 700, 880, 580); ctx.strokeRect(100, 700, 880, 580);
      for (let x = 320; x < 980; x += 220) { ctx.beginPath(); ctx.moveTo(x, 700); ctx.lineTo(x, 1280); ctx.stroke(); }
      ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.moveTo(140, 1280); ctx.lineTo(380, 700); ctx.lineTo(460, 700); ctx.lineTo(220, 1280); ctx.fill();
      ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 470); ctx.quadraticCurveTo(540, 560, 1080, 470); ctx.stroke();
      for (let i = 0; i < 14; i++) { const x = 30 + i * 75, y = 470 + Math.sin((i / 13) * Math.PI) * 45; ctx.fillStyle = ['#d1504a', '#e7d34c', '#4ab0a5', '#5b7fc9'][i % 4]; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 40, y + 2); ctx.lineTo(x + 20, y + 50); ctx.closePath(); ctx.fill(); ctx.stroke(); }
      ctx.fillStyle = '#7d7a70'; ctx.fillRect(0, 1280, W, 640);
      const k = easeIn(inv(0.6, 2, lt));
      coche(ctx, lerp(540, 1500, k), 1640, 2.1, '#d6372b', { convertible: true, driver: PROTA, mood: 'happy', wheel: k * 30, spin: k > 0.4 ? 1 : 0, lights: true });
    } else if (lt < 4.5) {
      fondo(ctx, '#f6d9a0', '#f0c987');
      const gs = ctx.createRadialGradient(820, 380, 20, 820, 380, 420); gs.addColorStop(0, 'rgba(255,240,180,1)'); gs.addColorStop(0.25, 'rgba(255,214,107,0.9)'); gs.addColorStop(1, 'rgba(255,214,107,0)');
      ctx.fillStyle = gs; ctx.fillRect(0, 0, W, 900);
      nubes(ctx, t, 4, 5, 200, 700, 'rgba(255,248,230,0.55)', 20);
      const off = (lt - 2) * 1400;
      ctx.save(); ctx.translate(-((off * 0.15) % 1300), 0);
      const r = rng(111);
      for (let x = -100; x < 2600; x += 130) edificio(ctx, x, 1300, 120, 300 + r() * 380, { color: '#d4b98e', lw: 1.6, lado: 0, winColor: '#c1a679', lit: 0, seed: x, bajos: 20 });
      ctx.fillStyle = 'rgba(246,217,160,0.4)'; ctx.fillRect(-100, 600, 2800, 700);
      ctx.restore();
      ctx.fillStyle = '#5f8a4a'; ctx.fillRect(0, 1280, W, 60);
      ctx.fillStyle = '#6a6862'; ctx.fillRect(0, 1340, W, 580);
      ctx.fillStyle = '#efe8d3'; for (let x = -(off % 260); x < W; x += 260) ctx.fillRect(x, 1760, 130, 12);
      for (let i = 0; i < 3; i++) { const fx = ((-off + i * 700) % 2100 + 2100) % 2100 - 500; farola(ctx, fx, 1350, 520, false); }
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 3;
      for (let i = 0; i < 10; i++) { const yy = 1380 + hash(i) * 420, xx = ((-(off * 2) + hash(i + 3) * 2000) % 1600 + 1600) % 1600 - 300; ctx.beginPath(); ctx.moveTo(xx, yy); ctx.lineTo(xx + 160, yy); ctx.stroke(); }
      coche(ctx, 540, 1650, 2.15, '#d6372b', { convertible: true, driver: PROTA, mood: 'happy', wheel: lt * 30, spin: 1, bounce: Math.sin(t * 22) * 1.2, lights: true });
    } else {
      const gris = inv(4.5, 5.8, lt);
      fondo(ctx, mix('#d8cdb5', '#8f9894', gris), mix('#b8ab90', '#6d7470', gris));
      const r = rng(121);
      for (let x = -40; x < W + 40; x += 150) edificio(ctx, x, 1000, 140, 380 + r() * 500, { color: mix('#a9a491', '#8d928e', gris), lw: 1.8, lado: 12, winColor: '#6f7471', lit: 0.1, seed: x * 3, bajos: 30 });
      ctx.fillStyle = '#56554f'; ctx.fillRect(0, 980, W, 940);
      ctx.fillStyle = 'rgba(230,226,210,0.5)'; for (let y = 1100; y < 1920; y += 230) for (let x = 200; x < W; x += 340) ctx.fillRect(x, y, 10, 90);
      const zoom = ease(inv(6.6, 7.9, lt));
      ctx.save();
      const [dx, dy] = [540 - 60 * 2.0, 1700 - 160 * 2.0];
      camara(ctx, lerp(540, dx, zoom), lerp(960, dy, zoom), lerp(1, 3.0, zoom));
      const filasC = [[1030, 0.8, ['#a7b4b0', '#d9c9a0', '#8a9aa8', '#b4a68c', '#c4b8a0']], [1250, 1.15, ['#9aa59f', '#bfae8f', '#8796a3', '#a8a092']], [1470, 1.5, ['#b4a68c', '#8a9aa8', '#cfc2a4']]];
      for (const [y, s, cols] of filasC) cols.forEach((c, i) => coche(ctx, -150 + i * 455 * s + (y % 300) * 0.4, y, s, c, { passenger: true, passengerMood: 'tired' }));
      coche(ctx, 1475, 1700, 2.0, '#8f9aa0', { passenger: true });
      coche(ctx, -395, 1700, 2.0, '#bfb29a', { passenger: true });
      coche(ctx, 540, 1700, 2.0, '#d6372b', { convertible: true, driver: PROTA, mood: 'sad', headTilt: 0.12, blink: lt > 7.4 && lt < 7.55 });
      if (lt < 6.8) {
        ctx.font = '900 64px "Inter Display"'; ctx.lineWidth = 8; ctx.strokeStyle = '#fff';
        const b = (txt, x, y, on) => { if (!on) return; ctx.strokeText(txt, x, y); ctx.fillStyle = '#d1504a'; ctx.fillText(txt, x, y); };
        b('¡¡PIIII!!', 60, 900, Math.sin(t * 14) > 0); b('¡MUÉVETE!', 600, 1180, Math.sin(t * 11 + 2) > 0); b('¡PIP PIP!', 380, 820, Math.sin(t * 9 + 4) > 0.2);
      }
      ctx.restore();
      velo(ctx, '#5a6a70', gris * 0.25);
      const lluvia = inv(5, 6, lt);
      ctx.strokeStyle = `rgba(225,235,240,${0.55 * lluvia})`; ctx.lineWidth = 2.5; ctx.beginPath();
      for (let i = 0; i < 360; i++) { const x = ((hash(i) * 1300 - t * 220) % 1300 + 1300) % 1300 - 100, y = ((hash(i + 99) * 2100 + t * 1900) % 2100) - 90; ctx.moveTo(x, y); ctx.lineTo(x - 10, y + 48); }
      ctx.stroke();
      if (zoom > 0.5) { for (let i = 0; i < 40; i++) { const x = hash(i + 5) * W, y = (hash(i + 8) * H + t * 60 * hash(i)) % H, rr = 6 + hash(i + 2) * 12; ctx.fillStyle = 'rgba(220,235,240,0.22)'; ctx.beginPath(); ctx.ellipse(x, y, rr * 0.8, rr, 0, 0, 7); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1.5; ctx.stroke(); } }
    }
  }

  // ======================= 36–44 s: evasión =======================
  function ladrillos(ctx, y0, y1, c) {
    ctx.fillStyle = c; ctx.fillRect(-200, y0, 1500, y1 - y0);
    ctx.strokeStyle = 'rgba(40,22,16,0.4)'; ctx.lineWidth = 2;
    for (let y = y0, k = 0; y < y1; y += 34, k++) { ctx.beginPath(); ctx.moveTo(-200, y); ctx.lineTo(1300, y); ctx.stroke(); for (let x = -200 + (k % 2) * 40; x < 1300; x += 80) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 34); ctx.stroke(); if (hash(x * 7 + k) < 0.1) { ctx.fillStyle = 'rgba(0,0,0,0.08)'; ctx.fillRect(x, y, 80, 34); } } }
  }
  function escena6(ctx, t) {
    const lt = t - 36;
    if (lt < 2.5) {
      const z = lerp(1, 1.12, lt / 2.5);
      ctx.save(); camara(ctx, 540, 1000, z);
      ladrillos(ctx, -200, 1480, '#8b6f5c');
      const gw = ctx.createRadialGradient(780, 1100, 50, 780, 1100, 900); gw.addColorStop(0, 'rgba(255,220,160,0.25)'); gw.addColorStop(1, 'rgba(0,0,0,0.35)'); ctx.fillStyle = gw; ctx.fillRect(-200, -200, 1500, 1700);
      cartel(ctx, 70, 160, 940, 560, '#1f3a2b', '#efe2c0', 'FELICIDAD', 'whisky añejo · bebe y olvida', { focos: 4, font: 'italic 900 {s}px "Liberation Serif"' });
      ctx.save(); ctx.translate(860, 470); ctx.rotate(0.18);
      const gb = ctx.createLinearGradient(-55, 0, 55, 0); gb.addColorStop(0, '#5a3010'); gb.addColorStop(0.4, '#a5652a'); gb.addColorStop(1, '#4a2808');
      ctx.fillStyle = gb; ctx.strokeStyle = INK; ctx.lineWidth = 4; rrect(ctx, -55, -110, 110, 220, 18); ctx.fill(); ctx.stroke(); ctx.fillRect(-18, -170, 36, 70); ctx.strokeRect(-18, -170, 36, 70);
      ctx.fillStyle = '#efe2c0'; ctx.fillRect(-44, -40, 88, 80); ctx.fillStyle = '#1f3a2b'; ctx.font = '900 18px "Inter Display"'; ctx.textAlign = 'center'; ctx.fillText('FELIZ', 0, 6); ctx.restore(); ctx.textAlign = 'left';
      cartel(ctx, 140, 820, 800, 200, '#f3efe2', '#d1504a', 'BEBE · OLVIDA · SONRÍE', '', {});
      farola(ctx, 990, 1500, 640, true);
      ctx.fillStyle = '#4f4c47'; ctx.fillRect(-200, 1480, 1500, 700);
      ctx.fillStyle = 'rgba(160,180,190,0.25)'; ctx.beginPath(); ctx.ellipse(300, 1820, 220, 30, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#3e5f4a'; ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.fillRect(40, 1290, 300, 230); ctx.strokeRect(40, 1290, 300, 230);
      ctx.fillStyle = '#34503e'; ctx.beginPath(); ctx.moveTo(30, 1290); ctx.lineTo(350, 1290); ctx.lineTo(330, 1250); ctx.lineTo(50, 1250); ctx.closePath(); ctx.fill(); ctx.stroke();
      for (const [x, y, c] of [[380, 1560, '#2f3a33'], [470, 1580, '#3a3a3a'], [880, 1590, '#2f3a33']]) { ctx.fillStyle = c; ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(x, y, 85, 62, 0, 0, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.beginPath(); ctx.ellipse(x - 25, y - 25, 25, 12, -0.5, 0, 7); ctx.fill(); }
      persona(ctx, 640, 1700, 2.9, PROTA, { seated: true, seatH: 4, legs: [{ th: 2.35, kn: 2.45 }, { th: 2.15, kn: 2.2 }], arms: 'knees', mood: 'sad', headTilt: 0.32, lean: 0.12, shadow: false, blink: lt > 1.6 && lt < 1.75 });
      ctx.restore();
    } else if (lt < 4.5) {
      ctx.fillStyle = '#0c0c0c'; ctx.fillRect(0, 0, W, H);
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(255,248,215,0.05)'); g.addColorStop(1, 'rgba(255,248,215,0.32)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(430, -10); ctx.lineTo(650, -10); ctx.lineTo(1060, 1800); ctx.lineTo(20, 1800); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,248,215,0.14)'; ctx.beginPath(); ctx.ellipse(540, 1720, 520, 80, 0, 0, 7); ctx.fill();
      const sc = lerp(1, 1.08, inv(2.5, 4.5, lt));
      ctx.save(); ctx.translate(600, 1720); ctx.scale(sc, sc);
      const gb = ctx.createLinearGradient(-230, 0, 230, 0); gb.addColorStop(0, '#7a2e10'); gb.addColorStop(0.35, '#d0602a'); gb.addColorStop(0.6, '#b6481e'); gb.addColorStop(1, '#5e220b');
      ctx.fillStyle = gb; ctx.strokeStyle = INK; ctx.lineWidth = 6; rrect(ctx, -230, -880, 460, 880, 50); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fillRect(-170, -840, 30, 800);
      const gc = ctx.createLinearGradient(0, -960, 0, -860); gc.addColorStop(0, '#ffffff'); gc.addColorStop(1, '#d9d4c4');
      ctx.fillStyle = gc; rrect(ctx, -245, -960, 490, 100, 20); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.lineWidth = 3; for (let x = -225; x < 240; x += 22) { ctx.beginPath(); ctx.moveTo(x, -950); ctx.lineTo(x, -870); ctx.stroke(); }
      ctx.fillStyle = '#fbfaf4'; ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.fillRect(-230, -640, 460, 330); ctx.strokeRect(-230, -640, 460, 330);
      ctx.fillStyle = '#222'; ctx.textAlign = 'center'; ctx.font = '900 82px "Inter Display"'; ctx.fillText('FELICIDAD', 0, -530);
      ctx.font = '700 36px "Inter"'; ctx.fillText('200 mg · 30 cápsulas', 0, -460);
      ctx.fillStyle = '#2c4fa3'; ctx.font = '600 28px "Inter"'; ctx.fillText('tómela cuando esté triste', 0, -400);
      ctx.fillStyle = '#d1504a'; ctx.fillRect(-230, -360, 460, 50); ctx.fillStyle = '#fff'; ctx.font = '800 22px "Inter"'; ctx.fillText('SIN RECETA · RESULTADOS INMEDIATOS', 0, -326);
      ctx.restore(); ctx.textAlign = 'left';
      persona(ctx, 200, 1730, 1.7, PROTA, { arms: lt > 3.3 ? 'reach' : 'limp', reach: inv(3.3, 4.3, lt), mood: 'sad', headTilt: -0.55, look: 0.6 });
      for (let i = 0; i < 26; i++) {
        const k = (lt - 3.4 - i * 0.03) / 0.9; if (k < 0) continue;
        const x = 350 + (hash(i) - 0.5) * 360, y = 600 + k * k * 1100;
        if (y > 1740) continue;
        ctx.save(); ctx.translate(x, y); ctx.rotate(hash(i + 3) * 6 + k * 5);
        const col = pick(rng(i), ['#ff6fa8', '#ffe066', '#6fd3ff', '#9dff7a']);
        ctx.fillStyle = col; ctx.strokeStyle = INK; ctx.lineWidth = 2; rrect(ctx, -18, -9, 36, 18, 9); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#fff'; rrect(ctx, 0, -9, 18, 18, 9); ctx.fill(); ctx.stroke(); ctx.restore();
      }
    } else {
      halucinacion(ctx, t, 0);
    }
  }

  function halucinacion(ctx, t, gris) {
    const lt = t - 40.5;
    fondo(ctx, '#4fbfff', '#d6f6ff');
    nubes(ctx, t, 8, 6, 200, 900, 'rgba(255,255,255,0.85)', 30);
    ctx.save(); ctx.translate(800, 360); ctx.rotate(t * 0.7);
    for (let i = 0; i < 14; i++) { ctx.rotate(Math.PI / 7); ctx.fillStyle = i % 2 ? '#ffe14d' : '#ffc62e'; ctx.beginPath(); ctx.moveTo(-20, -130); ctx.lineTo(0, -200); ctx.lineTo(20, -130); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    const gsun = ctx.createRadialGradient(780, 340, 10, 800, 360, 120); gsun.addColorStop(0, '#fff07a'); gsun.addColorStop(1, '#ffc21f');
    ctx.fillStyle = gsun; ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(800, 360, 115, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(762, 335, 11, 15, 0, 0, 7); ctx.ellipse(838, 335, 11, 15, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(766, 329, 4, 0, 7); ctx.arc(842, 329, 4, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,120,100,0.5)'; ctx.beginPath(); ctx.arc(735, 385, 16, 0, 7); ctx.arc(865, 385, 16, 0, 7); ctx.fill();
    ctx.strokeStyle = INK; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(800, 375, 50, 0.25, Math.PI - 0.25); ctx.stroke();
    const col = ['#ff4d4d', '#ff9a3c', '#ffe14d', '#5fd35f', '#4da6ff', '#9a6bff'];
    for (let i = 0; i < col.length; i++) { ctx.strokeStyle = col[i]; ctx.lineWidth = 36; ctx.beginPath(); ctx.arc(540, 1500, 620 - i * 36, Math.PI, Math.PI * 2); ctx.stroke(); }
    for (const [y, c, a] of [[1380, '#8fe07a', 0.7], [1520, '#62c752', 1.1], [1700, '#46a83c', 1.6]]) {
      ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(0, H);
      for (let x = 0; x <= W; x += 20) ctx.lineTo(x, y + Math.sin((x / 200) * a + t * 0.6) * 50);
      ctx.lineTo(W, H); ctx.closePath(); ctx.fill(); ctx.strokeStyle = shade(c, -0.25); ctx.lineWidth = 3; ctx.stroke();
    }
    for (let i = 0; i < 34; i++) {
      const x = hash(i) * W, y = 1560 + hash(i + 50) * 330, sw = Math.sin(t * 4 + i) * 0.3, sc = 1 + hash(i + 9);
      ctx.save(); ctx.translate(x, y); ctx.rotate(sw); ctx.scale(sc, sc);
      ctx.strokeStyle = '#2f7a2a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -40); ctx.stroke();
      ctx.fillStyle = col[i % col.length]; ctx.strokeStyle = INK; ctx.lineWidth = 1.5;
      for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(Math.cos(k * 1.256) * 10, -40 + Math.sin(k * 1.256) * 10, 8, 0, 7); ctx.fill(); ctx.stroke(); }
      ctx.fillStyle = '#fff2a8'; ctx.beginPath(); ctx.arc(0, -40, 7, 0, 7); ctx.fill(); ctx.stroke(); ctx.restore();
    }
    ctx.strokeStyle = INK; ctx.lineWidth = 4;
    for (let i = 0; i < 7; i++) { const x = ((t * 140 + i * 230) % 1400) - 150, y = 600 + hash(i) * 500 + Math.sin(t * 3 + i) * 20, fl = Math.sin(t * 14 + i) * 14; ctx.beginPath(); ctx.moveTo(x - 22, y - fl); ctx.quadraticCurveTo(x - 8, y - 12, x, y); ctx.quadraticCurveTo(x + 8, y - 12, x + 22, y - fl); ctx.stroke(); }
    for (let i = 0; i < 30; i++) { const x = hash(i + 70) * W, y = (((hash(i + 80) * H - t * 120) % H) + H) % H, a = 0.5 + 0.5 * Math.sin(t * 6 + i); ctx.fillStyle = `rgba(255,255,255,${a})`; ctx.save(); ctx.translate(x, y); ctx.rotate(t + i); ctx.fillRect(-2, -9, 4, 18); ctx.fillRect(-9, -2, 18, 4); ctx.restore(); }
    const vuelo = ease(inv(2, 3.5, lt));
    const x = lerp(540, 600, vuelo), y = lerp(1640 - Math.abs(Math.sin(t * 7)) * 50, 700, vuelo);
    persona(ctx, x, y, 2.2, { ...PROTA, shirt: '#ffffff' }, { arms: vuelo > 0.1 ? 'fly' : 'up', phase: t * 7, run: vuelo > 0.1 ? 0.3 : 0.6, mood: 'happy', lean: vuelo * 1.1, headTilt: vuelo * -0.5, shadow: vuelo < 0.05 });
    if (gris > 0) {
      ctx.save(); ctx.globalCompositeOperation = 'saturation'; ctx.fillStyle = `rgba(128,128,128,${gris})`; ctx.fillRect(0, 0, W, H); ctx.restore();
      velo(ctx, '#506468', gris * 0.55);
    }
  }

  // ======================= 44–50 s: la caída y el planeta de edificios =======================
  const planeta = (() => { const r = rng(131), o = []; for (let i = 0; i < 170; i++) o.push({ a: r() * Math.PI * 2, h: 40 + r() * 150, w: 16 + r() * 24, ring: r() < 0.5 ? 0 : 1, c: pick(r, ['#9aa59f', '#7f8b86', '#b4b8ad', '#6c7672']), seed: (r() * 1e5) | 0 }); return o.sort((a, b) => a.ring - b.ring); })();
  function escena7(ctx, t) {
    const lt = t - 44;
    if (lt < 1.2) { halucinacion(ctx, t, ease(inv(0, 1.1, lt))); return; }
    fondo(ctx, '#6d8a8c', '#3f585b');
    const zoomOut = ease(inv(3.4, 6, lt));
    ctx.save(); ctx.translate(0, ((-lt * 900 * (1 - zoomOut)) % 2400) + 2000);
    nubes(ctx, 0, 12, 10, -2400, 0, 'rgba(225,235,232,0.3)', 0);
    ctx.restore();
    if (zoomOut < 0.98) {
      const desliz = lt * 2200;
      ctx.save(); ctx.globalAlpha = 1 - zoomOut;
      for (const [x, w, c] of [[-140, 330, '#8c9792'], [890, 330, '#7f8b86']]) {
        ctx.save(); ctx.translate(0, -(desliz % 240));
        edificio(ctx, x, 2400, w, 2700, { color: c, seed: x + 5, lw: 2, lado: 0, lit: 0.18, bajos: 0, winW: 34, winH: 50, gapY: 30 });
        ctx.restore();
      }
      ctx.restore();
    }
    if (lt > 2.8) {
      const R = lerp(2100, 300, zoomOut), cx = 540, cy = lerp(H + 2000, 1150, zoomOut);
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(t * 0.12);
      const sk = R / 300;
      for (const b of planeta) {
        ctx.save(); ctx.rotate(b.a);
        const h = b.h * sk * (b.ring ? 1 : 0.7), w = b.w * sk;
        ctx.fillStyle = b.ring ? b.c : shade(b.c, -0.25); ctx.strokeStyle = INK; ctx.lineWidth = Math.max(1.2, sk * 1.5);
        ctx.fillRect(-w / 2, -R - h, w, h); ctx.strokeRect(-w / 2, -R - h, w, h);
        ctx.fillStyle = 'rgba(255,240,190,0.75)';
        for (let yy = -R - h + 7 * sk; yy < -R - 5 * sk; yy += 11 * sk) for (let xx = -w / 2 + 3 * sk; xx < w / 2 - 4 * sk; xx += 7 * sk) if (hash(b.seed + yy * 3 + xx) < 0.4) ctx.fillRect(xx, yy, 3.4 * sk, 4 * sk);
        ctx.restore();
      }
      const gp = ctx.createRadialGradient(-R * 0.3, -R * 0.3, R * 0.1, 0, 0, R); gp.addColorStop(0, '#6a7472'); gp.addColorStop(1, '#2f3534');
      ctx.fillStyle = gp; ctx.beginPath(); ctx.arc(0, 0, R, 0, 7); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.stroke();
      ctx.restore();
    }
    const s = lerp(2.2, 0.3, zoomOut);
    const py = lerp(900, 520, zoomOut) + Math.sin(t * 2) * 14;
    ctx.save(); ctx.translate(540, py); ctx.rotate(Math.PI + Math.sin(t * 1.3) * 0.6);
    persona(ctx, 0, 88 * s, s, PROTA, { arms: 'up', phase: t * 4, mood: 'shout', shadow: false });
    ctx.restore();
    if (zoomOut < 0.6) {
      ctx.strokeStyle = 'rgba(240,245,240,0.5)'; ctx.lineWidth = 3;
      for (let i = 0; i < 18; i++) { const x = 300 + hash(i) * 480, y = ((hash(i + 3) * 1920 - lt * 2600) % 1920 + 1920) % 1920; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 110); ctx.stroke(); }
    }
  }

  // ======================= 50–56 s: la oficina... que es una trampa =======================
  // Proyección oblicua vista desde arriba: u a lo largo de la tabla (hacia el fondo), v a lo ancho, h hacia arriba.
  const X0 = 300, Y0 = 1480, LARGO = 1400, ANCHO = 560, BISAGRA = 600, BARRA = 560;
  const P = (u, h, v) => [X0 + v - u * 0.17, Y0 - u * 0.6 - h];
  const companeros = (() => { const r = rng(141), o = []; for (let i = 0; i < 8; i++) o.push({ v: 40 + i * 66, p: nuevaPersona(r, false), ph: r() * 6 }); return o; })();
  function escena8(ctx, t) {
    const lt = t - 50;
    const pull = ease(inv(3.3, 5.1, lt));
    const snap = easeIn(inv(5.2, 5.37, lt));
    const [fx, fy] = P(1010, 0, 140);
    const z = lerp(3.3, 1, pull);
    const g = ctx.createRadialGradient(540, 1100, 100, 540, 1100, 1300); g.addColorStop(0, '#8e8878'); g.addColorStop(1, '#2f2c27');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.save(); camara(ctx, lerp(fx + 40, 560, pull), lerp(fy - 80, 1080, pull), z);
    const quad = (pts, fill, lw = 4) => { ctx.fillStyle = fill; ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = lw; ctx.stroke(); };
    const gs = ctx.createRadialGradient(560, 1200, 50, 560, 1200, 900); gs.addColorStop(0, 'rgba(0,0,0,0.45)'); gs.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gs; ctx.beginPath(); ctx.ellipse(560, 1250, 800, 520, -0.2, 0, 7); ctx.fill();
    quad([P(0, 0, 0), P(LARGO, 0, 0), P(LARGO, 0, ANCHO), P(0, 0, ANCHO)], '#d6a76c');
    quad([P(0, 0, 0), P(0, 0, ANCHO), P(0, -70, ANCHO), P(0, -70, 0)], '#a87a44');
    quad([P(0, 0, ANCHO), P(LARGO, 0, ANCHO), P(LARGO, -70, ANCHO), P(0, -70, ANCHO)], '#946a3a');
    ctx.strokeStyle = 'rgba(120,75,30,0.35)'; ctx.lineWidth = 2.5;
    for (let i = 1; i < 10; i++) { const v = (i * ANCHO) / 10; const [a, b] = P(0, 0, v), [c, d] = P(LARGO, 0, v); ctx.beginPath(); ctx.moveTo(a, b); ctx.bezierCurveTo(a - 40, b - 300, c + 40, d + 300, c, d); ctx.stroke(); }
    ctx.fillStyle = '#4a3420'; ctx.font = '900 30px "Inter Display"'; { const [a, b] = P(120, 0, 120); ctx.save(); ctx.translate(a, b); ctx.transform(1, 0, -0.27, 0.6, 0, 0); ctx.fillText('VICTORIA®', 0, 0); ctx.restore(); }
    for (const v0 of [50, ANCHO - 110]) { ctx.strokeStyle = '#d5d9db'; ctx.lineWidth = 7; for (let k = 0; k < 8; k++) { const [x, y] = P(BISAGRA, 14, v0 + k * 8); ctx.beginPath(); ctx.ellipse(x, y, 11, 17, 0.2, 0, 7); ctx.stroke(); } }
    const barra = () => {
      const th = lerp(Math.PI - 0.02, 0.05, snap);
      const eu = BISAGRA + Math.cos(th) * BARRA, eh = 8 + Math.sin(th) * BARRA;
      const a = P(BISAGRA, 8, 30), b = P(eu, eh, 30), c = P(eu, eh, ANCHO - 30), d = P(BISAGRA, 8, ANCHO - 30);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      for (const [w, col] of [[18, INK], [11, '#cfd4d6'], [3, '#ffffff']]) { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.lineTo(...c); ctx.lineTo(...d); ctx.stroke(); }
    };
    if (snap < 0.5) barra();
    quad([P(860, 3, 360), P(960, 3, 360), P(960, 3, 500), P(860, 3, 500)], '#c98b4a', 3);
    for (const c of companeros) { const [x, y] = P(1300, 0, c.v); persona(ctx, x, y, 0.5, c.p, { seated: true, chair: true, arms: 'type', phase: t * 6 + c.ph, mood: 'tired', headTilt: 0.2, shadow: false }); }
    quad([P(1250, 0, 0), P(1250, 0, ANCHO), P(1250, 80, ANCHO), P(1250, 80, 0)], '#8f948c', 3);
    const [dx, dy] = P(1010, 0, 140);
    persona(ctx, dx, dy, 0.62, PROTA, { seated: true, chair: true, arms: lt > 3.0 ? 'reach' : 'type', phase: t * 6, reach: inv(3.0, 5.1, lt), mood: lt > 2.4 && lt < 5.2 ? 'neutral' : 'tired', headTilt: lt > 2.0 && lt < 2.9 ? -0.3 : 0.12, look: lt > 2.0 && lt < 2.9 ? -0.6 : 0, blink: lt > 1.0 && lt < 1.15, zoom: z });
    ctx.fillStyle = '#d8c3a0'; ctx.strokeStyle = INK; ctx.lineWidth = 2.5;
    const desk = [dx + 22, dy - 50];
    ctx.fillRect(desk[0], desk[1], 120, 10); ctx.strokeRect(desk[0], desk[1], 120, 10);
    ctx.fillRect(desk[0] + 6, desk[1] + 10, 7, 40); ctx.strokeRect(desk[0] + 6, desk[1] + 10, 7, 40); ctx.fillRect(desk[0] + 106, desk[1] + 10, 7, 40); ctx.strokeRect(desk[0] + 106, desk[1] + 10, 7, 40);
    ctx.fillStyle = '#e4e2da'; ctx.fillRect(desk[0] + 60, desk[1] - 48, 56, 42); ctx.strokeRect(desk[0] + 60, desk[1] - 48, 56, 42);
    ctx.fillStyle = '#8fb0b5'; ctx.fillRect(desk[0] + 65, desk[1] - 43, 46, 32); ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillRect(desk[0] + 68, desk[1] - 40, 20, 3);
    ctx.fillStyle = '#e4e2da'; ctx.fillRect(desk[0] + 82, desk[1] - 6, 12, 6); ctx.fillStyle = '#cfcfc8'; ctx.fillRect(desk[0] + 10, desk[1] - 4, 40, 4);
    const bk = inv(1.2, 3.0, lt);
    const [bxf, byf] = P(910, 5, 430);
    const bx = bxf + Math.sin(bk * 10) * 50 * (1 - bk), by = lerp(byf - 320, byf, easeOut(bk));
    ctx.save(); ctx.translate(bx, by); ctx.rotate(Math.sin(bk * 10) * 0.6 * (1 - bk) - 0.15);
    ctx.fillStyle = '#9ec08a'; ctx.strokeStyle = '#3e5a33'; ctx.lineWidth = 1.3; ctx.fillRect(-26, -7, 52, 14); ctx.strokeRect(-26, -7, 52, 14);
    ctx.strokeRect(-23, -4.5, 46, 9); ctx.fillStyle = '#3e5a33'; ctx.font = '900 9px "Inter Display"'; ctx.textAlign = 'center'; ctx.fillText('$100', 0, 3.5); ctx.textAlign = 'left';
    ctx.restore();
    if (snap >= 0.5) barra();
    ctx.restore();
    if (lt > 5.3) velo(ctx, '#ffffff', 1 - inv(5.3, 5.45, lt));
    if (lt > 5.45) velo(ctx, '#000000', 1);
  }

  // ======================= 56–60 s: rótulo final =======================
  function escena9(ctx, t) {
    const lt = t - 56;
    ctx.fillStyle = '#1b1f1e'; ctx.fillRect(0, 0, W, H);
    const g = ctx.createRadialGradient(540, 860, 50, 540, 860, 900); g.addColorStop(0, 'rgba(95,105,100,0.55)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.globalAlpha = inv(0.4, 1.6, lt);
    const tg = ctx.createLinearGradient(0, 760, 0, 940); tg.addColorStop(0, '#eef1ea'); tg.addColorStop(0.5, '#8d9590'); tg.addColorStop(1, '#dfe3dc');
    ctx.fillStyle = tg; ctx.font = 'italic bold 190px "Liberation Serif"'; ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 20; ctx.fillText('Felicidad', 540, 920); ctx.shadowBlur = 0;
    ctx.globalAlpha = inv(1.6, 2.4, lt);
    ctx.fillStyle = '#c3c8c2'; ctx.font = '600 36px "Inter"'; ctx.fillText('UN CORTOMETRAJE', 540, 1040); ctx.fillText('HECHO 100% CON CÓDIGO', 540, 1090);
    ctx.font = '400 28px "Inter"'; ctx.fillStyle = '#a3a8a2'; ctx.fillText('Inspirado en «Happiness» de Steve Cutts', 540, 1180); ctx.fillText('Música generada por código', 540, 1224);
    ctx.globalAlpha = 1; ctx.textAlign = 'left';
    velo(ctx, '#000', inv(3.4, 4, lt));
  }

  const ESCENAS = [
    [0, 6, escena1], [6, 8.5, escena2a], [8.5, 12, escena2b], [12, 20, escena3], [20, 28, escena4],
    [28, 36, escena5], [36, 44, escena6], [44, 50, escena7], [50, 56, escena8], [56, 60, escena9],
  ];
  const GRADO = { 6: { top: '#e9efe0', bottom: '#2f4038' }, 7: { top: '#ffe9c0', bottom: '#4a5c66' } };

  function renderFrame(ctx, t) {
    if (!matrizTitulo) matrizTitulo = matrizTexto('FELICIDAD', 13);
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const i = ESCENAS.findIndex(([a, b]) => t >= a && t < b);
    const e = ESCENAS[i < 0 ? ESCENAS.length - 1 : i];
    ctx.save(); e[2](ctx, t); ctx.restore();
    ctx.lineWidth = 1; ctx.filter = 'none'; ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    post(ctx, W, H, t, GRADO[i] || {});
    const fades = [[0, 0.6, 'in'], [11.85, 12.15], [19.85, 20.1], [27.85, 28.1], [35.85, 36.1], [43.9, 44.05], [55.9, 56.2]];
    for (const [a, b, k] of fades) {
      if (t < a || t > b) continue;
      const m = (a + b) / 2;
      velo(ctx, '#000', k === 'in' ? 1 - inv(a, b, t) : 1 - Math.abs(t - m) / ((b - a) / 2));
    }
    ctx.restore();
  }

  window.FELICIDAD = { W, H, DURACION, renderFrame };
})();
