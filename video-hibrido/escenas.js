// "Felicidad" universal — versión híbrida vertical (1080×1920) de 60 s: fondos ilustrados con IA + animación por código.
// Sin texto: solo símbolos que se entienden en cualquier país. Inspirado en "Happiness" de Steve Cutts.
(function () {
  const {
    INK, clamp, lerp, inv, ease, easeOut, easeIn, rng, pick, hash, shade, mix, rrect,
    nuevaPersona, PROTA, persona, espalda, coche, edificio, cartel, nubes, farola, post,
  } = LIB;
  const W = 1080, H = 1920, DURACION = 60;
  const backOut = t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };

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

  // ======================= fondos ilustrados (IA) =======================
  const FONDOS = ['metro', 'ciudad', 'tienda', 'tienda_caos', 'concesionario', 'autopista', 'atasco', 'callejon', 'alucinacion', 'caida'];
  const IMG = {};
  window.LISTO = Promise.all(FONDOS.map(k => new Promise(res => { const i = new Image(); i.onload = res; i.onerror = res; i.src = `fondos/${k}.jpg`; IMG[k] = i; })));
  // Coloca la imagen (1086×1920) con zoom y desplazamiento, y deja el contexto en "coordenadas de imagen".
  function escenario(ctx, k, zoom = 1, dx = 0, dy = 0) {
    const im = IMG[k], w = 1086 * zoom, h = 1920 * zoom;
    ctx.translate((W - w) / 2 + dx, (H - h) / 2 + dy); ctx.scale(zoom, zoom);
    ctx.drawImage(im, 0, 0, 1086, 1920);
  }
  function sombraSuelo(ctx, y0, y1, a = 0.3) {
    const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, 'rgba(30,25,20,0)'); g.addColorStop(1, `rgba(30,25,20,${a})`);
    ctx.fillStyle = g; ctx.fillRect(-200, y0, 1500, y1 - y0);
  }
  function carita(ctx, x, y, r, triste = false, color = '#ffd21f') {
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = color; ctx.strokeStyle = INK; ctx.lineWidth = r * 0.08;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(-r * 0.33, -r * 0.2, r * 0.1, r * 0.16, 0, 0, 7); ctx.ellipse(r * 0.33, -r * 0.2, r * 0.1, r * 0.16, 0, 0, 7); ctx.fill();
    ctx.lineWidth = r * 0.1; ctx.lineCap = 'round'; ctx.beginPath();
    if (triste) ctx.arc(0, r * 0.62, r * 0.4, Math.PI * 1.2, Math.PI * 1.8); else ctx.arc(0, r * 0.05, r * 0.5, 0.25, Math.PI - 0.25);
    ctx.stroke(); ctx.restore();
  }
  function prohibido(ctx, x, y, r, k = 1) {
    ctx.save(); ctx.translate(x, y); ctx.scale(lerp(2.2, 1, k), lerp(2.2, 1, k)); ctx.globalAlpha = k; ctx.rotate(-0.1);
    ctx.strokeStyle = '#d6372b'; ctx.lineWidth = r * 0.22; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-r * 0.7, -r * 0.7); ctx.lineTo(r * 0.7, r * 0.7); ctx.stroke(); ctx.restore();
  }

  // ======================= 8.5–12 s: el metro =======================
  const pasajeros = (() => { const r = rng(31), o = []; for (let i = 0; i < 160; i++) o.push({ x: r(), y: r(), p: nuevaPersona(r, r() < 0.2), f: r() < 0.5 ? 1 : -1, m: pick(r, ['tired', 'neutral', 'sad']) }); return o; })();
  const anden = (() => { const r = rng(41), o = []; for (let k = 0; k < 3; k++) for (let i = 0; i < 6 + k; i++) o.push({ x: -40 + i * (1160 / (5 + k)) + r() * 50, y: 1500 + k * 150 + r() * 30, s: 1.35 + k * 0.5, p: nuevaPersona(r, r() < 0.15) }); return o.sort((a, b) => a.y - b.y); })();
  function ledCarita(ctx, cx, cy, prog, t) {
    const C = 46, F = 14, d = 11.5, x0 = cx - (C * d) / 2, y0 = cy - (F * d) / 2;
    const corazon = (gx, gy, hx) => { const x = (gx - hx) / 4.2, y = -(gy - 7) / 4.2 + 0.2; return Math.pow(x * x + y * y - 1, 3) - x * x * y * y * y < 0; };
    for (let gy = 0; gy < F; gy++) for (let gx = 0; gx < C; gx++) {
      const dd = Math.hypot(gx - 23, gy - 6.5);
      let on = Math.abs(dd - 6) < 0.75 || Math.hypot(gx - 21, gy - 4.5) < 0.9 || Math.hypot(gx - 25, gy - 4.5) < 0.9 || (Math.abs(dd - 3.4) < 0.7 && gy > 7);
      if (corazon(gx, gy, 8) || corazon(gx, gy, 38)) on = Math.sin(t * 8) > -0.3 || on;
      const x = x0 + gx * d, y = y0 + gy * d;
      if (on && gx / C <= prog) { ctx.fillStyle = '#ffb52e'; ctx.shadowColor = '#ffb52e'; ctx.shadowBlur = 14; }
      else { ctx.fillStyle = 'rgba(90,60,15,0.45)'; ctx.shadowBlur = 0; }
      ctx.beginPath(); ctx.arc(x, y, d * 0.38, 0, 7); ctx.fill();
    }
    ctx.shadowBlur = 0;
  }
  function escena2b(ctx, t) {
    const lt = t - 8.5;
    ctx.fillStyle = '#111'; ctx.fillRect(0, 0, W, H);
    const z = 1 + 0.4 * ease(inv(10.4, 12, t));
    ctx.save(); camara(ctx, 540, lerp(960, 560, ease(inv(10.4, 12, t))), z);
    ctx.save(); escenario(ctx, 'metro'); ctx.restore();
    // tren que llega
    const tx = lerp(1700, 0, easeOut(inv(0, 1.45, lt)));
    ctx.save(); ctx.translate(tx, 0);
    const gt = ctx.createLinearGradient(0, 700, 0, 1290); gt.addColorStop(0, '#e2d8a8'); gt.addColorStop(0.5, '#c9bf8c'); gt.addColorStop(1, '#8f8760');
    ctx.fillStyle = gt; ctx.strokeStyle = INK; ctx.lineWidth = 5; rrect(ctx, -80, 700, 1800, 590, 44); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#7a2f2a'; ctx.fillRect(-80, 1190, 1800, 28); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(-60, 726, 1760, 8);
    const puerta = easeOut(inv(1.9, 2.4, lt)) * 80;
    for (let i = 0; i < 4; i++) {
      const wx = 30 + i * 420;
      ctx.save(); rrect(ctx, wx, 780, 300, 330, 22); ctx.clip();
      ctx.fillStyle = '#d8d2b0'; ctx.fillRect(wx, 780, 300, 330);
      for (let k = 0; k < 44; k++) { const c = pasajeros[(i * 44 + k) % pasajeros.length]; persona(ctx, wx + c.x * 300 + Math.sin(t * 8 + k) * 2, 960 + c.y * 330, 1.0, c.p, { facing: c.f, mood: c.m, arms: 'limp', shadow: false }); }
      ctx.fillStyle = 'rgba(200,225,230,0.18)'; ctx.beginPath(); ctx.moveTo(wx, 1110); ctx.lineTo(wx + 150, 780); ctx.lineTo(wx + 220, 780); ctx.lineTo(wx + 70, 1110); ctx.fill();
      ctx.restore();
      ctx.strokeStyle = INK; ctx.lineWidth = 5; rrect(ctx, wx, 780, 300, 330, 22); ctx.stroke();
      const dx = wx + 330;
      ctx.fillStyle = '#b7ad7c'; ctx.fillRect(dx - puerta, 750, 45, 520); ctx.fillRect(dx + 45 + puerta, 750, 45, 520);
      ctx.strokeRect(dx - puerta, 750, 45, 520); ctx.strokeRect(dx + 45 + puerta, 750, 45, 520);
    }
    ctx.restore();
    // letrero luminoso del fondo: carita y corazones
    ledCarita(ctx, 540, 238, inv(9.7, 10.7, t), t);
    ctx.restore();
    for (const c of anden) { const push = Math.sin(t * 5 + c.x) * 3 - easeIn(inv(10.6, 12, t)) * 40; espalda(ctx, c.x, c.y + push, c.s, c.p); }
  }

  // ======================= 12–20 s: la ciudad de los anuncios =======================
  const peatones = (() => { const r = rng(61), o = []; for (let i = 0; i < 16; i++) o.push({ x: r() * 1400 - 150, y: 1720 + r() * 190, dir: r() < 0.5 ? 1 : -1, v: 40 + r() * 35, p: nuevaPersona(r, r() < 0.35), ph: r() * 6, phone: r() < 0.8 }); return o; })();
  function taquilla(ctx, x, y, lt) {
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = '#7a2f2a'; ctx.strokeStyle = INK; ctx.lineWidth = 4;
    rrect(ctx, -110, -330, 220, 330, 14); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e9d9a8'; rrect(ctx, -80, -190, 160, 120, 10); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#3a2a22'; ctx.fillRect(-60, -110, 120, 20);
    ctx.fillStyle = '#f3efe2'; rrect(ctx, -95, -440, 190, 120, 14); ctx.fill(); ctx.stroke();
    for (let i = 0; i < 9; i++) { const on = (Math.floor(lt * 8) + i) % 2; ctx.fillStyle = on ? '#ffd55a' : '#8f7230'; ctx.shadowColor = '#ffd55a'; ctx.shadowBlur = on ? 10 : 0; ctx.beginPath(); ctx.arc(-80 + i * 20, -450, 5, 0, 7); ctx.fill(); ctx.shadowBlur = 0; }
    carita(ctx, 0, -380, 44);
    if (lt > 5.1) prohibido(ctx, 0, -380, 56, easeOut(inv(5.1, 5.4, lt)));
    ctx.restore();
  }
  function escena3(ctx, t) {
    const lt = t - 12;
    const zoom = 1.35, pan = ease(inv(0, 5.6, lt));
    ctx.save();
    escenario(ctx, 'ciudad', zoom, 0, lerp(336, -336, pan));
    sombraSuelo(ctx, 1650, 1920, 0.35);
    const lista = [];
    for (const q of peatones) {
      const x = ((q.x + q.dir * q.v * lt) % 1500 + 1500) % 1500 - 200, s = 0.95 + ((q.y - 1720) / 190) * 0.45;
      lista.push({ y: q.y, draw: () => persona(ctx, x, q.y, s, q.p, { run: 0.42, phase: q.ph + t * 6.5, facing: q.dir, arms: q.phone ? 'phone' : 'swing', headTilt: q.phone ? 0.38 : 0, mood: q.phone ? 'tired' : 'neutral' }) });
    }
    lista.push({ y: 1800, draw: () => taquilla(ctx, 790, 1800, lt) });
    const andar = lt < 5.4, px = lerp(120, 560, ease(inv(0, 5.4, lt)));
    lista.push({ y: 1830, draw: () => persona(ctx, px, 1830, 1.35, PROTA, { run: andar ? 0.42 : 0, phase: t * 6.5, arms: lt < 3.4 ? 'phone' : 'swing', headTilt: lt < 3.4 ? 0.38 : lerp(0, -0.35, ease(inv(4.6, 6, lt))), mood: lt > 5.5 ? 'sad' : 'neutral', blink: lt > 6.6 && lt < 6.75 }) });
    lista.sort((a, b) => a.y - b.y).forEach(d => d.draw());
    ctx.restore();
  }

  // ======================= 20–28 s: Black Friday =======================
  const masa = (() => { const r = rng(71), o = []; for (let k = 0; k < 4; k++) for (let i = 0; i < 7 + k; i++) o.push({ x: -60 + i * (1200 / (6 + k)) + r() * 60, y: 1480 + k * 140 + r() * 40, s: 1.05 + k * 0.4, p: nuevaPersona(r, r() < 0.3), ph: r() * 6, lane: r() }); return o.sort((a, b) => a.y - b.y); })();
  const objetos = (() => { const r = rng(81), o = []; for (let i = 0; i < 26; i++) o.push({ a: -Math.PI / 2 + (r() - 0.5) * 2.6, v: 400 + r() * 700, rot: (r() - 0.5) * 10, t0: 22.4 + r() * 2.5, c: pick(r, ['#e9d24a', '#e48bb3', '#4ab0a5', '#f3efe2', '#8c6bc9']), txt: pick(r, ['%', '$', '★', '♥', '%', '$']) }); return o; })();
  const PUERTA = { x: 302, y: 716, w: 476, h: 651 };
  function caja(ctx, x, y, s, rot, c, txt) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
    ctx.fillStyle = c; ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.fillRect(-30, -20, 60, 40); ctx.strokeRect(-30, -20, 60, 40);
    ctx.fillStyle = shade(c, -0.2); ctx.fillRect(-29, -19, 58, 8);
    if (txt) { ctx.fillStyle = INK; ctx.font = '900 22px "Inter Display"'; ctx.textAlign = 'center'; ctx.fillText(txt, 0, 12); ctx.textAlign = 'left'; }
    ctx.restore();
  }
  function escena4(ctx, t) {
    if (t < 27) {
      const abierta = easeOut(inv(22, 22.45, t));
      const shake = t > 22 && t < 25.5 ? 9 : t < 22 ? 2 : 0;
      ctx.save();
      ctx.translate((hash(t * 30) - 0.5) * shake * 2, (hash(t * 30 + 9) - 0.5) * shake * 2);
      if (t < 25) {
        ctx.save(); escenario(ctx, 'tienda', lerp(1.04, 1.1, inv(20, 25, t)));
        if (abierta > 0) {
          const g = ctx.createLinearGradient(0, PUERTA.y, 0, PUERTA.y + PUERTA.h); g.addColorStop(0, `rgba(255,250,225,${abierta})`); g.addColorStop(1, `rgba(255,236,180,${abierta * 0.9})`);
          ctx.fillStyle = g; ctx.fillRect(PUERTA.x + 40, PUERTA.y + 60, PUERTA.w - 80, PUERTA.h - 60);
        }
        ctx.restore();
        if (t > 20.4 && t < 22) {
          const n = 3 - Math.floor((t - 20.4) / 0.53), f = ((t - 20.4) % 0.53) / 0.53;
          ctx.save(); ctx.translate(540, 1060); ctx.scale(1.7 - f * 0.5, 1.7 - f * 0.5);
          ctx.font = '900 260px "Inter Display"'; ctx.textAlign = 'center'; ctx.lineWidth = 14; ctx.strokeStyle = `rgba(42,38,34,${1 - f * 0.6})`; ctx.strokeText(String(n), 0, 90);
          ctx.fillStyle = `rgba(209,80,74,${1 - f * 0.6})`; ctx.fillText(String(n), 0, 90); ctx.restore();
        }
        const lista = [];
        for (const m of masa) {
          if (t < 22) lista.push({ y: m.y, draw: () => espalda(ctx, m.x + Math.sin(t * 20 + m.ph) * 4, m.y + Math.sin(t * 15 + m.ph) * 5, m.s, m.p) });
          else {
            const k = easeIn(clamp((t - 22 - m.lane * 1.0) / 1.5));
            if (k >= 1) continue;
            const x = lerp(m.x, 540 + (m.x - 540) * 0.12, k), y = lerp(m.y + 280 * m.s, 1380, k);
            lista.push({ y, draw: () => persona(ctx, x, y, m.s * lerp(1.1, 0.4, k), m.p, { run: 1, phase: m.ph + t * 15, facing: m.x < 540 ? 1 : -1, mood: 'shout', arms: k > 0.25 ? 'up' : 'swing' }) });
          }
        }
        lista.sort((a, b) => a.y - b.y).forEach(d => d.draw());
        if (t > 22 && t < 22.3) velo(ctx, '#ffffff', 1 - inv(22, 22.3, t));
      } else {
        ctx.save(); escenario(ctx, 'tienda_caos', 1.05); ctx.restore();
        const r = rng(91), crece = ease(inv(25, 26.6, t));
        const items = [];
        for (let i = 0; i < 150; i++) {
          const a = r() * Math.PI, d = Math.sqrt(r());
          const x = 540 + Math.cos(a) * 640 * d, y = 2000 - Math.sin(a) * 1150 * d * crece;
          items.push({ y, i, x, box: r() < 0.28, c: pick(r, ['#e9d24a', '#e48bb3', '#4ab0a5', '#f3efe2']), rot: r() * 6, p: nuevaPersona(r, r() < 0.3), s: 1.0 + r() * 0.6, up: r() < 0.5, f: r() < 0.5 ? 1 : -1, lean: (r() - 0.5) * 1.2 });
        }
        items.sort((a, b) => a.y - b.y);
        for (const it of items) {
          const jit = Math.sin(t * 18 + it.i) * 5;
          if (it.box) caja(ctx, it.x + jit, it.y, 1.5, it.rot, it.c, '');
          else persona(ctx, it.x + jit, it.y + 60, it.s, it.p, { run: 0.6, phase: t * 14 + it.i, arms: it.up ? 'up' : 'box', mood: 'shout', facing: it.f, lean: it.lean, shadow: false });
        }
      }
      for (const o of objetos) {
        const k = (t - o.t0) / 1.2;
        if (k < 0 || k > 1) continue;
        caja(ctx, 540 + Math.cos(o.a) * o.v * k * 0.9, 1040 + Math.sin(o.a) * o.v * k * 1.2 + k * k * 900, lerp(0.4, 4, easeIn(k)), o.rot * k, o.c, o.txt);
      }
      ctx.restore();
    } else {
      ctx.save(); escenario(ctx, 'tienda_caos', 1.05); sombraSuelo(ctx, 1450, 1920, 0.3); ctx.restore();
      persona(ctx, 520, 1720, 2.8, PROTA, { arms: 'box', mood: 'happy', boxColor: '#e9d24a', lean: -0.04 });
    }
  }

  // ======================= 28–36 s: el coche, el atasco y la lluvia =======================
  function escena5(ctx, t) {
    const lt = t - 28;
    if (lt < 2) {
      ctx.save(); escenario(ctx, 'concesionario', lerp(1.0, 1.06, lt / 2)); sombraSuelo(ctx, 1300, 1920, 0.25); ctx.restore();
      const k = easeIn(inv(0.6, 2, lt));
      coche(ctx, lerp(540, 1500, k), 1660, 2.1, '#d6372b', { convertible: true, driver: PROTA, mood: 'happy', wheel: k * 30, spin: k > 0.4 ? 1 : 0, lights: true });
    } else if (lt < 4.5) {
      ctx.save(); escenario(ctx, 'autopista', 1.06, lerp(20, -30, inv(2, 4.5, lt))); ctx.restore();
      const off = (lt - 2) * 1400;
      const ga = ctx.createLinearGradient(0, 1215, 0, 1920); ga.addColorStop(0, '#5f5d58'); ga.addColorStop(1, '#3f3e3a');
      ctx.fillStyle = ga; ctx.fillRect(0, 1215, W, 705);
      ctx.fillStyle = '#e9e2cc'; ctx.fillRect(0, 1225, W, 8);
      for (let x = -(off % 260); x < W; x += 260) ctx.fillRect(x, 1760, 130, 12);
      for (let i = 0; i < 3; i++) { const fx = ((-off + i * 700) % 2100 + 2100) % 2100 - 500; farola(ctx, fx, 1230, 560, false); }
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 3;
      for (let i = 0; i < 10; i++) { const yy = 1300 + hash(i) * 520, xx = ((-(off * 2) + hash(i + 3) * 2000) % 1600 + 1600) % 1600 - 300; ctx.beginPath(); ctx.moveTo(xx, yy); ctx.lineTo(xx + 160, yy); ctx.stroke(); }
      coche(ctx, 540, 1660, 2.15, '#d6372b', { convertible: true, driver: PROTA, mood: 'happy', wheel: lt * 30, spin: 1, bounce: Math.sin(t * 22) * 1.2, lights: true });
    } else {
      const zoom = ease(inv(6.6, 7.9, lt));
      ctx.save();
      const [dx, dy] = [540 - 60 * 2.0, 1700 - 160 * 2.0];
      camara(ctx, lerp(540, dx, zoom), lerp(960, dy, zoom), lerp(1, 3.0, zoom));
      ctx.save(); escenario(ctx, 'atasco', 1.0); ctx.restore();
      const filasC = [[1060, 0.8, ['#a7b4b0', '#d9c9a0', '#8a9aa8', '#b4a68c', '#c4b8a0']], [1270, 1.15, ['#9aa59f', '#bfae8f', '#8796a3', '#a8a092']], [1480, 1.5, ['#b4a68c', '#8a9aa8', '#cfc2a4']]];
      for (const [y, s, cols] of filasC) cols.forEach((c, i) => coche(ctx, -150 + i * 455 * s + (y % 300) * 0.4, y, s, c, { passenger: true, passengerMood: 'tired', lights: true }));
      coche(ctx, 1475, 1720, 2.0, '#8f9aa0', { passenger: true });
      coche(ctx, -395, 1720, 2.0, '#bfb29a', { passenger: true });
      coche(ctx, 540, 1720, 2.0, '#d6372b', { convertible: true, driver: PROTA, mood: 'sad', headTilt: 0.12, blink: lt > 7.4 && lt < 7.55 });
      if (lt < 6.8) {
        const pito = (x, y, on) => { if (!on) return; ctx.save(); ctx.translate(x, y); ctx.fillStyle = '#ffe14d'; ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.beginPath(); for (let i = 0; i < 16; i++) { const r = i % 2 ? 40 : 75, a = (i * Math.PI) / 8; ctx.lineTo(Math.cos(a) * r * 1.3, Math.sin(a) * r); } ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#d1504a'; ctx.font = '900 60px "Inter Display"'; ctx.textAlign = 'center'; ctx.fillText('!!!', 0, 22); ctx.restore(); };
        pito(160, 900, Math.sin(t * 14) > 0); pito(880, 1160, Math.sin(t * 11 + 2) > 0); pito(520, 820, Math.sin(t * 9 + 4) > 0.2);
      }
      ctx.restore();
      const lluvia = inv(5, 6, lt);
      ctx.strokeStyle = `rgba(225,235,240,${0.55 * lluvia})`; ctx.lineWidth = 2.5; ctx.beginPath();
      for (let i = 0; i < 360; i++) { const x = ((hash(i) * 1300 - t * 220) % 1300 + 1300) % 1300 - 100, y = ((hash(i + 99) * 2100 + t * 1900) % 2100) - 90; ctx.moveTo(x, y); ctx.lineTo(x - 10, y + 48); }
      ctx.stroke();
      if (zoom > 0.5) { for (let i = 0; i < 40; i++) { const x = hash(i + 5) * W, y = (hash(i + 8) * H + t * 60 * hash(i)) % H, rr = 6 + hash(i + 2) * 12; ctx.fillStyle = 'rgba(220,235,240,0.22)'; ctx.beginPath(); ctx.ellipse(x, y, rr * 0.8, rr, 0, 0, 7); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1.5; ctx.stroke(); } }
    }
  }

  // ======================= 36–44 s: evasión =======================
  function escena6(ctx, t) {
    const lt = t - 36;
    if (lt < 2.5) {
      ctx.save(); escenario(ctx, 'callejon', lerp(1.0, 1.1, lt / 2.5), 0, lerp(0, -60, lt / 2.5)); sombraSuelo(ctx, 1400, 1920, 0.3);
      persona(ctx, 330, 1760, 2.7, PROTA, { seated: true, seatH: 4, legs: [{ th: 2.35, kn: 2.45 }, { th: 2.15, kn: 2.2 }], arms: 'knees', mood: 'sad', headTilt: 0.32, lean: 0.12, shadow: false, blink: lt > 1.6 && lt < 1.75 });
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
      ctx.fillStyle = '#fbfaf4'; ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.fillRect(-230, -660, 460, 360); ctx.strokeRect(-230, -660, 460, 360);
      carita(ctx, -70, -480, 110);
      ctx.save(); ctx.translate(130, -480); ctx.rotate(-0.6); ctx.fillStyle = '#ff6fa8'; ctx.strokeStyle = INK; ctx.lineWidth = 5; rrect(ctx, -40, -95, 80, 190, 40); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#fff'; rrect(ctx, -40, 0, 80, 95, 40); ctx.fill(); ctx.stroke(); ctx.restore();
      ctx.restore();
      persona(ctx, 200, 1730, 1.7, PROTA, { arms: lt > 3.3 ? 'reach' : 'limp', reach: inv(3.3, 4.3, lt), mood: 'sad', headTilt: -0.55, look: 0.6 });
      for (let i = 0; i < 26; i++) {
        const k = (lt - 3.4 - i * 0.03) / 0.9; if (k < 0) continue;
        const x = 350 + (hash(i) - 0.5) * 360, y = 600 + k * k * 1100;
        if (y > 1740) continue;
        ctx.save(); ctx.translate(x, y); ctx.rotate(hash(i + 3) * 6 + k * 5);
        ctx.fillStyle = pick(rng(i), ['#ff6fa8', '#ffe066', '#6fd3ff', '#9dff7a']); ctx.strokeStyle = INK; ctx.lineWidth = 2; rrect(ctx, -18, -9, 36, 18, 9); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#fff'; rrect(ctx, 0, -9, 18, 18, 9); ctx.fill(); ctx.stroke(); ctx.restore();
      }
    } else {
      halucinacion(ctx, t, 0);
    }
  }
  function halucinacion(ctx, t, gris) {
    const lt = t - 40.5;
    ctx.save(); escenario(ctx, 'alucinacion', 1.04 + 0.03 * Math.sin(t * 1.5), Math.sin(t * 0.9) * 12, 0); ctx.restore();
    ctx.strokeStyle = INK; ctx.lineWidth = 4;
    for (let i = 0; i < 7; i++) { const x = ((t * 140 + i * 230) % 1400) - 150, y = 700 + hash(i) * 400 + Math.sin(t * 3 + i) * 20, fl = Math.sin(t * 14 + i) * 14; ctx.beginPath(); ctx.moveTo(x - 22, y - fl); ctx.quadraticCurveTo(x - 8, y - 12, x, y); ctx.quadraticCurveTo(x + 8, y - 12, x + 22, y - fl); ctx.stroke(); }
    for (let i = 0; i < 30; i++) { const x = hash(i + 70) * W, y = (((hash(i + 80) * H - t * 120) % H) + H) % H, a = 0.5 + 0.5 * Math.sin(t * 6 + i); ctx.fillStyle = `rgba(255,255,255,${a})`; ctx.save(); ctx.translate(x, y); ctx.rotate(t + i); ctx.fillRect(-2, -9, 4, 18); ctx.fillRect(-9, -2, 18, 4); ctx.restore(); }
    const vuelo = ease(inv(2, 3.5, lt));
    const x = lerp(540, 600, vuelo), y = lerp(1700 - Math.abs(Math.sin(t * 7)) * 50, 700, vuelo);
    persona(ctx, x, y, 2.3, { ...PROTA, shirt: '#ffffff' }, { arms: vuelo > 0.1 ? 'fly' : 'up', phase: t * 7, run: vuelo > 0.1 ? 0.3 : 0.6, mood: 'happy', lean: vuelo * 1.1, headTilt: vuelo * -0.5, shadow: vuelo < 0.05 });
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
    // caída entre rascacielos: la imagen se acerca y gira
    if (zoomOut < 0.98) {
      ctx.save(); ctx.globalAlpha = 1 - zoomOut;
      ctx.translate(540, 960); ctx.rotate(lt * 0.25); ctx.translate(-540, -960);
      escenario(ctx, 'caida', lerp(1.15, 2.4, easeIn(inv(1.2, 4.5, lt))));
      ctx.restore();
    }
    if (lt > 2.8) {
      const R = lerp(2100, 300, zoomOut), cx = 540, cy = lerp(H + 2000, 1150, zoomOut);
      ctx.save(); ctx.globalAlpha = inv(2.8, 3.6, lt); ctx.translate(cx, cy); ctx.rotate(t * 0.12);
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

  // ======================= 56–60 s: cierre universal =======================
  function escena9(ctx, t) {
    const lt = t - 56;
    ctx.fillStyle = '#1b1f1e'; ctx.fillRect(0, 0, W, H);
    const g = ctx.createRadialGradient(540, 860, 50, 540, 860, 900); g.addColorStop(0, 'rgba(95,105,100,0.55)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // la carita sonriente se apaga y se vuelve triste
    const a = inv(0.3, 1.0, lt), triste = lt > 1.9;
    ctx.save(); ctx.globalAlpha = a;
    const s = triste ? 1 - 0.04 * Math.sin((lt - 1.9) * 30) * Math.exp(-(lt - 1.9) * 4) : backOut(inv(0.3, 1.0, lt));
    ctx.translate(540, 880); ctx.scale(s, s);
    carita(ctx, 0, 0, 230, triste, triste ? '#b9b2a0' : '#ffd21f');
    ctx.restore();
    ctx.globalAlpha = inv(2.4, 3, lt);
    ctx.fillStyle = '#a3a8a2'; ctx.font = '400 26px "Inter"'; ctx.textAlign = 'center';
    ctx.fillText('inspired by «Happiness» — Steve Cutts', 540, 1290);
    ctx.globalAlpha = 1; ctx.textAlign = 'left';
    velo(ctx, '#000', inv(3.5, 4, lt));
  }

  const ESCENAS = [
    [0, 6, escena1], [6, 8.5, escena2a], [8.5, 12, escena2b], [12, 20, escena3], [20, 28, escena4],
    [28, 36, escena5], [36, 44, escena6], [44, 50, escena7], [50, 56, escena8], [56, 60, escena9],
  ];
  const GRADO = { 6: { top: '#e9efe0', bottom: '#2f4038' }, 7: { top: '#ffe9c0', bottom: '#4a5c66' } };

  function renderFrame(ctx, t) {
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
