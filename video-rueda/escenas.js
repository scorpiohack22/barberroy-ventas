// "La rueda" — corto satírico vertical (1080×1920) de 30 s, sin texto, al estilo de las animaciones de crítica social.
// Trabajar toda la vida para pagar: el sueldo se evapora, la publicidad hipnotiza, las deudas son grilletes
// y la ciudad entera es una rueda de hámster que llena de monedas la torre de un millonario.
(function () {
  const { INK, clamp, lerp, inv, ease, easeOut, easeIn, hash, mix, rrect, post } = LIB;
  const { persona } = FIG;
  const W = 1080, H = 1920, DURACION = 30;

  const NOMBRES = ['metro', 'oficina_soul', 'ciudad_ilustracion', 'ciudad'];
  const IMG = {};
  window.LISTO = Promise.all(NOMBRES.map(k => new Promise(res => { const i = new Image(); i.onload = res; i.onerror = res; i.src = `fondos/${k}.jpg`; IMG[k] = i; })));
  function camara(ctx, z = 1, cx = 543, cy = 960) { ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-cx, -cy); }
  function fondo(ctx, k) { ctx.drawImage(IMG[k], 0, 0, 1086, 1920); }
  function velo(ctx, color, a) { if (a <= 0) return; ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = clamp(a); ctx.fillStyle = color; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  const escala = (k0, y0, yh) => y => (k0 * (y - yh)) / (y0 - yh);

  // ---------- personajes: todos grises e iguales; él solo se distingue por la corbata roja ----------
  const PIELES = ['#e6c3a1', '#c99a72', '#8d5a3b', '#f0cfb2', '#a96f4a', '#d9ac85'];
  const PELOS = ['#2a211c', '#3a2a1e', '#1b1b1b', '#5a3a22', '#2a211c', '#463428'];
  const GRIS = i => ({ altura: 172 + (hash(i * 3.7) * 12 | 0), sexo: hash(i * 9.1) < 0.3 ? 'm' : 'h', piel: PIELES[i % 6], pelo: PELOS[(i * 5) % 6], peinado: hash(i * 9.1) < 0.3 ? 'mono' : hash(i * 2.2) < 0.2 ? 'calvo' : 'corto',
    camisa: '#c9ccd0', chaqueta: '#5d6168', corbata: '#45494f', pantalon: '#4d5157', zapatos: '#25272b' });
  const prota = e => ({ ...GRIS(0), altura: 176, sexo: 'h', peinado: 'corto', piel: '#e6c3a1', pelo: '#3a2a1e', corbata: '#c0392b',
    canas: clamp(e * 1.3), entradas: clamp(e * 1.2), arrugas: clamp(e * 1.4 - 0.2), barba: e > 0.5 ? (e - 0.5) * 2 : 0, colorBarba: '#cfcac2', gafas: e > 0.6 });
  const RICO = { altura: 170, sexo: 'h', piel: '#f0b8a0', pelo: '#9a9288', peinado: 'calvo', complexion: 1.45, camisa: '#ffffff', chaqueta: '#1d1f24', corbata: '#d4a72c', pantalon: '#1d1f24', zapatos: '#111', barba: 0.9, colorBarba: '#cfcac2' };

  const movilD = (sx, sy) => ({ x: -2, y: sy + 13, tipo: 'agarra', objeto: 'movil', escorzo: 0.55 });
  const colgando = lado => (sx, sy, M) => ({ x: sx + lado * M.H * 0.012, y: sy + (M.brazo + M.antebrazo) * 0.97, tipo: 'relajada' });
  const manoEn = (r, x, y, k, lado) => { const b = r.brazos.find(q => q.lado === lado); return [x + b.tx * k, y + b.ty * k]; };
  const tobillo = (r, x, y, k, lado) => { const p = r.piernas.find(q => q.lado === lado); return [x + p.ax * k, y + p.ay * k]; };

  // grillete con cadena y bola de hierro arrastrada detrás
  function grillete(ctx, ax, ay, k, dir, n = 1, t = 0) {
    for (let b = 0; b < n; b++) {
      const bx = ax - dir * (60 + b * 34) * k / 2.4 * 2.4 / 2.4 * (k / k), by = ay + 6 * k;
      const L = (55 + b * 30) * k, ex = ax - dir * L, ey = ay + 4 * k + Math.abs(Math.sin(t * 9 + b)) * 1.5 * k;
      ctx.strokeStyle = '#2b2d31'; ctx.lineWidth = Math.max(2, 1.6 * k);
      for (let i = 0; i < 9; i++) { const u = i / 9, x = lerp(ax, ex, u), y = lerp(ay, ey, u) + Math.sin(u * Math.PI) * 6 * k; ctx.beginPath(); ctx.ellipse(x, y, 2.2 * k, 1.4 * k, i % 2 ? 0 : 1.2, 0, 7); ctx.stroke(); }
      const g = ctx.createRadialGradient(ex - 3 * k, ey - 3 * k, 1, ex, ey, 9 * k); g.addColorStop(0, '#7a7d84'); g.addColorStop(1, '#1d1e22');
      ctx.fillStyle = g; ctx.strokeStyle = INK; ctx.lineWidth = Math.max(2, 0.8 * k); ctx.beginPath(); ctx.arc(ex, ey - 3 * k, 9 * k, 0, 7); ctx.fill(); ctx.stroke();
    }
    ctx.fillStyle = '#3a3c42'; ctx.strokeStyle = INK; ctx.lineWidth = Math.max(1.5, 0.6 * k); ctx.fillRect(ax - 5 * k, ay - 4 * k, 10 * k, 3.2 * k); ctx.strokeRect(ax - 5 * k, ay - 4 * k, 10 * k, 3.2 * k);
  }
  function billete(ctx, x, y, s, rot) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
    ctx.fillStyle = '#7fb069'; ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.fillRect(-34, -16, 68, 32); ctx.strokeRect(-34, -16, 68, 32);
    ctx.strokeStyle = '#3e6b2e'; ctx.lineWidth = 2; ctx.strokeRect(-28, -11, 56, 22); ctx.beginPath(); ctx.arc(0, 0, 8, 0, 7); ctx.stroke();
    ctx.restore();
  }
  function moneda(ctx, x, y, r, rot = 0) {
    ctx.save(); ctx.translate(x, y); ctx.scale(Math.cos(rot) || 0.05, 1);
    ctx.fillStyle = '#e8b83a'; ctx.strokeStyle = INK; ctx.lineWidth = Math.max(1.5, r * 0.15); ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#b8862a'; ctx.lineWidth = Math.max(1, r * 0.1); ctx.beginPath(); ctx.arc(0, 0, r * 0.65, 0, 7); ctx.stroke();
    ctx.restore();
  }
  // iconos de gastos que se tragan el sueldo
  function iconoGasto(ctx, tipo, x, y, s, a) {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = clamp(a); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = '#fbf8f0'; ctx.strokeStyle = INK; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(0, 0, 62, 0, 7); ctx.fill(); ctx.stroke();
    ctx.lineWidth = 4; ctx.lineJoin = 'round';
    const col = ['#c0392b', '#2f6db0', '#333', '#d4a72c', '#6b6f77', '#c0392b'][tipo];
    ctx.fillStyle = col;
    if (tipo === 0) { ctx.beginPath(); ctx.moveTo(-34, -2); ctx.lineTo(0, -34); ctx.lineTo(34, -2); ctx.lineTo(24, -2); ctx.lineTo(24, 30); ctx.lineTo(-24, 30); ctx.lineTo(-24, -2); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#fbf8f0'; ctx.fillRect(-7, 10, 14, 20); } // casa
    else if (tipo === 1) { rrect(ctx, -38, -10, 76, 26, 8); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-22, -10); ctx.lineTo(-12, -26); ctx.lineTo(14, -26); ctx.lineTo(24, -10); ctx.fill(); ctx.stroke(); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(-20, 18, 9, 0, 7); ctx.arc(20, 18, 9, 0, 7); ctx.fill(); } // carro
    else if (tipo === 2) { rrect(ctx, -20, -36, 40, 72, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#8fc4ff'; ctx.fillRect(-14, -28, 28, 50); } // móvil
    else if (tipo === 3) { rrect(ctx, -40, -26, 80, 52, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = INK; ctx.fillRect(-40, -14, 80, 10); ctx.fillStyle = '#fbf8f0'; ctx.fillRect(-30, 6, 22, 12); } // tarjeta
    else if (tipo === 4) { ctx.beginPath(); ctx.moveTo(-38, -12); ctx.lineTo(0, -36); ctx.lineTo(38, -12); ctx.closePath(); ctx.fill(); ctx.stroke(); for (let i = -2; i <= 2; i++) ctx.fillRect(i * 15 - 4, -8, 8, 32); ctx.fillRect(-40, 26, 80, 8); } // banco
    else { ctx.fillRect(-11, -34, 22, 68); ctx.fillRect(-34, -11, 68, 22); ctx.strokeRect(-11, -34, 22, 68); } // médico
    ctx.restore();
  }
  function espirales(ctx, r, x, y, k, t, a) {
    if (a <= 0) return;
    const c = r.cabeza, cx = x + c.x * k, cy = y + c.y * k;
    for (const lado of [-1, 1]) {
      const ex = cx + (lado * c.hw * 0.215 + c.giro * c.hw * 0.16) * k, ey = cy - c.hh * 0.02 * k, R = c.hw * 0.13 * k;
      ctx.save(); ctx.globalAlpha = a; ctx.translate(ex, ey); ctx.rotate(t * 8 * lado);
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, R, 0, 7); ctx.fill();
      ctx.strokeStyle = INK; ctx.lineWidth = Math.max(1.5, R * 0.18); ctx.beginPath();
      for (let i = 0; i < 60; i++) { const an = i * 0.35, rr = (i / 60) * R; i ? ctx.lineTo(Math.cos(an) * rr, Math.sin(an) * rr) : ctx.moveTo(0, 0); }
      ctx.stroke(); ctx.restore();
    }
  }
  function sombreroCopa(ctx, r, x, y, k) {
    const c = r.cabeza, cx = x + c.x * k, cy = y + (c.y - c.hh * 0.45) * k, w = c.hw * k;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(-0.1);
    ctx.fillStyle = '#16171a'; ctx.strokeStyle = INK; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(0, 0, w * 0.85, w * 0.15, 0, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillRect(-w * 0.5, -w * 1.05, w, w * 1.02); ctx.strokeRect(-w * 0.5, -w * 1.05, w, w * 1.02);
    ctx.fillStyle = '#c0392b'; ctx.fillRect(-w * 0.5, -w * 0.28, w, w * 0.18);
    ctx.restore();
  }

  // ======================= 0–4.5 s: el rebaño gris va al trabajo =======================
  function escena1(ctx, t) {
    ctx.save(); camara(ctx, lerp(1.0, 1.05, t / 4.5), 543, 980);
    fondo(ctx, 'metro');
    const kE = escala(6, 1500, 600);
    const filas = [{ y: 1235, n: 6, v: 70 }, { y: 1320, n: 5, v: 82 }, { y: 1430, n: 4, v: 95 }];
    let id = 1;
    for (const f of filas) {
      const k = kE(f.y);
      for (let i = 0; i < f.n; i++, id++) {
        const sep = 1400 / f.n, x = ((i * sep + (f.y % 7) * 40 + 1400 - t * f.v * k / 4) % 1400 + 1400) % 1400 - 160;
        const esProta = f.y === 1430 && i === 1;
        const P = esProta ? prota(0) : GRIS(id);
        persona(ctx, esProta ? 560 - t * 6 : x, f.y, k, P, { modo: 'camina', fase: t * 7.2, lateral: 1, dir: -1, giro: -0.45, manoD: movilD, baja: 0.85, gesto: 'cansado', luzMovil: 0.7, encorvado: 0.4 });
      }
    }
    ctx.restore();
  }

  // ======================= 4.5–11 s: la oficina; el sueldo se evapora =======================
  function escena2(ctx, t) {
    const lt = t - 4.5;
    ctx.save(); camara(ctx, lerp(1.0, 1.06, lt / 6.5));
    fondo(ctx, 'oficina_soul');
    const kE = escala(4, 1280, 480);
    // compañeros que cruzan al fondo cargando papeles
    for (let i = 0; i < 3; i++) {
      const y = 1080 + i * 70, k = kE(y), x = ((i * 420 + lt * (60 + i * 14) * k / 2.5) % 1500) - 200;
      persona(ctx, x, y, k, GRIS(10 + i), { modo: 'camina', fase: t * 7 + i, lateral: 1, dir: 1, giro: 0.45, gesto: 'cansado', manoI: (sx, sy) => ({ x: -10, y: sy + 30, tipo: 'agarra', escorzo: 0.6 }), manoD: (sx, sy) => ({ x: 10, y: sy + 30, tipo: 'agarra', escorzo: 0.6 }) });
      ctx.fillStyle = '#fbfaf5'; ctx.strokeStyle = INK; ctx.lineWidth = 2; for (let j = 0; j < 4; j++) { ctx.fillRect(x - 16 * k, y - 112 * k - j * 5 * k, 32 * k, 5 * k); ctx.strokeRect(x - 16 * k, y - 112 * k - j * 5 * k, 32 * k, 5 * k); }
    }
    // él, sentado frente a su portátil
    const k = 6.2, X = 540, Y = 1500;
    const paga = ease(inv(3.4, 3.8, lt)), vuela = inv(3.9, 5.6, lt);
    const teclea = paga === 0;
    const r = persona(ctx, X, Y, k, prota(0.05), {
      modo: 'sentado', piesY: 46, sombra: false, encorvado: 0.4, gesto: vuela > 0.6 ? 'triste' : paga > 0.5 ? 'feliz' : 'cansado', baja: teclea ? 0.6 : 0.1, mirada: { x: 0, y: teclea ? 0.8 : 0 },
      manoI: (sx, sy) => ({ x: lerp(-14, -16, paga), y: lerp(sy + 40 + (teclea ? Math.sin(t * 22) * 1.5 : 0), sy + 6, paga), tipo: paga > 0.5 ? 'agarra' : 'relajada', escorzo: 0.6 }),
      manoD: (sx, sy) => ({ x: lerp(14, 16, paga), y: lerp(sy + 40 + (teclea ? Math.cos(t * 22) * 1.5 : 0), sy + 6, paga), tipo: paga > 0.5 ? 'agarra' : 'relajada', escorzo: 0.6 }),
    });
    // escritorio y portátil (vemos la parte de atrás de la tapa)
    ctx.fillStyle = '#b8b2a6'; ctx.strokeStyle = INK; ctx.lineWidth = 4;
    ctx.fillRect(140, Y - 8, 800, 26); ctx.strokeRect(140, Y - 8, 800, 26);
    ctx.fillStyle = '#9d978b'; ctx.fillRect(170, Y + 18, 740, 420); ctx.strokeRect(170, Y + 18, 740, 420);
    if (paga < 0.3) { ctx.fillStyle = '#3d4047'; rrect(ctx, 400, Y - 210, 280, 200, 12); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#cfd2d6'; ctx.beginPath(); ctx.arc(540, Y - 110, 16, 0, 7); ctx.fill(); }
    // reloj de pared que vuela (el día se va)
    const rx = 860, ry = 300;
    ctx.fillStyle = '#fbf8f0'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(rx, ry, 80, 0, 7); ctx.fill(); ctx.stroke();
    ctx.lineCap = 'round'; ctx.lineWidth = 5; const ang = Math.pow(lt, 1.8) * 4;
    ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx + Math.sin(ang) * 60, ry - Math.cos(ang) * 60); ctx.stroke();
    ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx + Math.sin(ang / 12) * 38, ry - Math.cos(ang / 12) * 38); ctx.stroke();
    // el sobre de la paga cae, se abre y los billetes salen volando hacia los gastos
    const [ax, ay] = manoEn(r, X, Y, k, -1), [bx, by] = manoEn(r, X, Y, k, 1), mx = (ax + bx) / 2, my = (ay + by) / 2;
    if (lt > 3.0 && lt < 3.6) { const c = easeIn(inv(3.0, 3.5, lt)); ctx.save(); ctx.translate(mx, lerp(-100, my - 40, c)); ctx.rotate((1 - c) * 2); ctx.fillStyle = '#e9dcc0'; ctx.fillRect(-60, -38, 120, 76); ctx.strokeRect(-60, -38, 120, 76); ctx.beginPath(); ctx.moveTo(-60, -38); ctx.lineTo(0, 5); ctx.lineTo(60, -38); ctx.stroke(); ctx.restore(); }
    const DEST = [[150, 520], [930, 620], [170, 880], [910, 980], [260, 220], [740, 160]];
    DEST.forEach(([dx, dy], i) => iconoGasto(ctx, i, dx, dy, 1.0 + Math.sin(t * 9 + i) * 0.04 * (vuela > 0 && vuela < 1), ease(inv(3.8 + i * 0.1, 4.1 + i * 0.1, lt)) * (1 - inv(6.2, 6.5, lt))));
    if (paga > 0) {
      for (let j = 0; j < 18; j++) {
        const d = DEST[j % 6], u = clamp((vuela - (j * 0.035)) / 0.5);
        if (u >= 1) continue;
        const e = easeIn(u), x = lerp(mx + (j % 5 - 2) * 12, d[0], e), y = lerp(my - 30 - (j % 3) * 8, d[1], e) - Math.sin(e * Math.PI) * 160;
        billete(ctx, x, y, lerp(1.25, 0.4, e), (j % 5 - 2) * 0.25 + e * 6 * (j % 2 ? 1 : -1));
      }
      if (vuela > 0.55) moneda(ctx, mx, my - 18, 22, t * 3);
    }
    ctx.restore();
  }

  // ======================= 11–16.5 s: la publicidad hipnotiza; cada compra es un grillete =======================
  function escena3(ctx, t) {
    const lt = t - 11;
    ctx.save(); camara(ctx, lerp(1.12, 1.25, lt / 5.5), lerp(560, 600, lt / 5.5), 1050);
    fondo(ctx, 'ciudad_ilustracion');
    // los anuncios parpadean
    if (Math.floor(t * 6) % 2) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,220,120,0.08)'; ctx.fillRect(0, 0, 1086, 1300); ctx.restore(); }
    const kE = escala(6.1, 1500, 580);
    // gente que arrastra sus bolas por la acera
    for (let i = 0; i < 5; i++) {
      const y = 1180 + i * 40, k = kE(y), x = ((i * 300 + lt * 60 * k / 3 + 2000) % 1400) - 200;
      const r = persona(ctx, x, y, k, GRIS(20 + i), { modo: 'camina', fase: t * 6 + i, lateral: 1, dir: 1, giro: 0.45, gesto: 'cansado', manoD: movilD, baja: 0.8, luzMovil: 0.6, encorvado: 0.5 });
      espirales(ctx, r, x, y, k, t, i % 2 ? 1 : 0);
      const [tx, ty] = tobillo(r, x, y, k, -1); grillete(ctx, tx, ty, k / 2.2, 1, 1 + (i % 3), t);
    }
    // él: mira los anuncios, se le van los ojos, paga con tarjeta y ¡clac! grillete
    const y = 1640, k = kE(y), X = lerp(380, 520, ease(inv(3.4, 5.5, lt)));
    const hipno = ease(inv(0.8, 1.4, lt)), compra = lt > 2.4, clac = lt > 3.1;
    const tarjeta = (sx, sy, M) => ({ x: lerp(sx + 3, 22, ease(inv(1.8, 2.4, lt))), y: lerp(sy + 52, sy + 14, ease(inv(1.8, 2.4, lt))), tipo: 'agarra', codo: -1 });
    const r = persona(ctx, X, y, k, prota(0.12), {
      modo: lt > 3.4 ? 'camina' : 'pie', fase: t * 6, lateral: 1, dir: 1, giro: lt < 3.4 ? 0.3 : 0.45, gesto: hipno > 0.5 ? 'feliz' : 'neutral', encorvado: 0.3,
      manoD: lt < 3.4 ? tarjeta : movilD, manoI: colgando(-1), luzMovil: lt > 3.4 ? 0.8 : 0, baja: lt > 3.4 ? 0.8 : 0,
    });
    espirales(ctx, r, X, y, k, t, hipno);
    if (lt > 1.8 && lt < 3.4) { const [hx, hy] = manoEn(r, X, y, k, 1); ctx.save(); ctx.translate(hx + 8, hy - 10); ctx.rotate(-0.4); ctx.fillStyle = '#d4a72c'; ctx.strokeStyle = INK; ctx.lineWidth = 3; rrect(ctx, -28, -18, 56, 36, 6); ctx.fill(); ctx.stroke(); ctx.fillStyle = INK; ctx.fillRect(-28, -10, 56, 7); ctx.restore(); }
    // la mano gigante del vendedor ofrece un móvil brillante
    if (lt > 1.0 && lt < 3.6) {
      const e = ease(inv(1.0, 1.6, lt)) * (1 - ease(inv(3.0, 3.6, lt)));
      ctx.save(); ctx.translate(lerp(1350, 820, e), 1280);
      ctx.fillStyle = '#2a2c31'; ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.fillRect(40, -40, 400, 90); ctx.strokeRect(40, -40, 400, 90);
      ctx.fillStyle = '#f0c9a5'; ctx.beginPath(); ctx.ellipse(10, 0, 60, 48, 0, 0, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#16171a'; rrect(ctx, -70, -110, 70, 130, 10); ctx.fill(); ctx.stroke();
      const g = ctx.createRadialGradient(-35, -45, 5, -35, -45, 120); g.addColorStop(0, 'rgba(160,220,255,0.9)'); g.addColorStop(1, 'rgba(160,220,255,0)');
      ctx.fillStyle = g; ctx.fillRect(-160, -170, 250, 250); ctx.fillStyle = '#9fd8ff'; ctx.fillRect(-62, -100, 54, 104);
      ctx.restore();
    }
    if (clac) { const [tx, ty] = tobillo(r, X, y, k, -1); grillete(ctx, tx, ty, k / 2.2, 1, 1, t); }
    ctx.restore();
    if (lt > 3.1 && lt < 3.2) velo(ctx, '#fff', 0.5);
  }

  // ======================= 16.5–30 s: la rueda de hámster que mueve la ciudad =======================
  const CAE = 24.0;
  function rueda(ctx, t, cx, cy, R, ang) {
    ctx.save(); ctx.translate(cx, cy);
    ctx.strokeStyle = '#3a3c42'; ctx.lineWidth = 26; ctx.beginPath(); ctx.arc(0, 0, R, 0, 7); ctx.stroke();
    ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, R + 13, 0, 7); ctx.arc(0, 0, R - 13, 0, 7); ctx.stroke();
    // radios
    ctx.strokeStyle = '#55585f'; ctx.lineWidth = 10;
    for (let i = 0; i < 10; i++) { const a = ang + i * Math.PI / 5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * (R - 12), Math.sin(a) * (R - 12)); ctx.stroke(); }
    // travesaños donde corren
    ctx.lineWidth = 7; ctx.strokeStyle = '#6b6e75';
    for (let i = 0; i < 72; i++) { const a = ang + i * Math.PI / 36; const x = Math.cos(a) * (R - 6), y = Math.sin(a) * (R - 6); ctx.beginPath(); ctx.moveTo(x * 0.985, y * 0.985); ctx.lineTo(x * 1.015, y * 1.015); ctx.stroke(); }
    ctx.fillStyle = '#d4a72c'; ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(0, 0, 50, 0, 7); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  function escena4(ctx, t) {
    const lt = t - 16.5;
    const aleja = ease(inv(0, 2.6, lt));
    const cx = 540, cy = 1230, R = 590;
    const vel = lerp(0.6, 1.6, inv(16.5, CAE, t)) * (t > CAE ? 0.9 : 1);
    const ang = -(lt * vel + lt * lt * 0.03);
    ctx.save();
    camara(ctx, lerp(2.4, 1.0, aleja), 540, lerp(1700, 960, aleja));
    // fondo: la ciudad de anuncios, oscurecida
    ctx.save(); fondo(ctx, 'ciudad'); ctx.fillStyle = 'rgba(10,12,20,0.66)'; ctx.fillRect(-500, -500, 2100, 2900); ctx.restore();
    // la torre dorada del millonario arriba, y el tubo de monedas desde el eje
    ctx.fillStyle = '#c99a2e'; ctx.strokeStyle = INK; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(360, 560); ctx.lineTo(720, 560); ctx.lineTo(680, -300); ctx.lineTo(400, -300); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fbe9a8'; for (let i = 0; i < 4; i++) for (let j = 0; j < 7; j++) ctx.fillRect(430 + i * 60, -260 + j * 70, 26, 38);
    ctx.fillStyle = '#e8c45a'; ctx.fillRect(320, 530, 440, 40); ctx.strokeRect(320, 530, 440, 40);
    ctx.fillStyle = '#b8892a'; ctx.fillRect(520, 570, 40, cy - 570); ctx.strokeRect(520, 570, 40, cy - 570);
    for (let i = 0; i < 7; i++) { const u = ((lt * vel * 0.9 + i / 7) % 1); moneda(ctx, 540, lerp(cy - 60, 560, u), 16, lt * 6 + i); }
    rueda(ctx, t, cx, cy, R, ang);
    // los que corren dentro de la rueda (abajo, sobre el arco interior)
    const corredores = [-0.75, -0.53, -0.32, -0.11, 0.1, 0.31, 0.52, 0.73];
    const k = 1.75;
    const edad = clamp(inv(18.5, 23.5, t));
    corredores.forEach((da, i) => {
      const a = Math.PI / 2 + da, px = cx + Math.cos(a) * (R - 20), py = cy + Math.sin(a) * (R - 20);
      const esProta = i === 4;
      if (esProta && t > CAE) return;
      ctx.save(); ctx.translate(px, py); ctx.rotate(a - Math.PI / 2);
      const r = persona(ctx, 0, 0, k, esProta ? prota(edad) : GRIS(40 + i), { modo: 'camina', fase: t * (8 + vel * 3) + i, lateral: 1, dir: -1, giro: -0.45, gesto: 'cansado', encorvado: esProta ? 0.3 + edad * 0.6 : 0.4, sombra: false });
      const [tx, ty] = tobillo(r, 0, 0, k, 1); grillete(ctx, tx, ty, k / 2.2, -1, 1 + (i % 3), t);
      ctx.restore();
    });
    // el relevo: un joven idéntico salta al hueco
    if (t > CAE + 0.4) {
      const a = Math.PI / 2 + 0.1, e = easeOut(inv(CAE + 0.4, CAE + 1.0, t));
      const px = lerp(cx + 120, cx + Math.cos(a) * (R - 20), e), py = lerp(cy + 200, cy + Math.sin(a) * (R - 20), e);
      ctx.save(); ctx.translate(px, py); ctx.rotate((a - Math.PI / 2) * e);
      persona(ctx, 0, 0, k, prota(0), { modo: 'camina', fase: t * 12, lateral: 1, dir: -1, giro: -0.45, gesto: 'neutral', sombra: false });
      ctx.restore();
    }
    // el millonario en su balcón dorado, contando monedas
    const kr = 2.3, rx = 540, ry = 530;
    const rr = persona(ctx, rx, ry, kr, RICO, { gesto: 'feliz', giro: 0.15, sombra: false, manoD: (sx, sy, M) => ({ x: sx + 10, y: sy - 18 + Math.sin(t * 6) * 4, tipo: 'agarra', codo: -1 }), manoI: (sx, sy) => ({ x: sx - 6, y: sy + 40, tipo: 'agarra' }) });
    sombreroCopa(ctx, rr, rx, ry, kr);
    { const [hx, hy] = manoEn(rr, rx, ry, kr, 1); moneda(ctx, hx, hy - 14, 10, t * 5); const [gx, gy] = manoEn(rr, rx, ry, kr, -1); ctx.fillStyle = '#c9a06a'; ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(gx, gy + 34, 34, 38, 0, 0, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = INK; ctx.font = '900 34px system-ui'; ctx.textAlign = 'center'; ctx.fillText('$', gx, gy + 46); }
    // el viejo sale despedido y queda en el suelo con su moneda
    if (t > CAE) {
      const c = inv(CAE, CAE + 0.9, t), a = Math.PI / 2 + 0.1;
      const sx0 = cx + Math.cos(a) * (R - 20), sy0 = cy + Math.sin(a) * (R - 20);
      const xs = lerp(sx0, 250, easeOut(c)), ys = lerp(sy0, 1820, c) - Math.sin(c * Math.PI) * 300;
      const kv = lerp(1.75, 4.2, c);
      if (c < 1) {
        ctx.save(); ctx.translate(xs, ys); ctx.rotate(-c * 5);
        persona(ctx, 0, 0, kv, prota(1), { modo: 'salto', altoSalto: 0, gesto: 'sorpresa', sombra: false, manoI: (sx, sy) => ({ x: sx - 20, y: sy - 30, tipo: 'abierta', codo: -1 }), manoD: (sx, sy) => ({ x: sx + 20, y: sy - 30, tipo: 'abierta', codo: -1 }) });
        ctx.restore();
      } else {
        const mira = ease(inv(CAE + 1.6, CAE + 2.4, t));
        const r = persona(ctx, 250, 1820, kv, prota(1), { modo: 'suelo', flex: [0.1, 0.7], gesto: 'triste', encorvado: 0.9, baja: 0.3 + mira * 0.5, mirada: { x: 0.3, y: mira },
          manoI: (sx, sy) => ({ x: -28, y: 2, tipo: 'abierta' }), manoD: (sx, sy, M) => ({ x: lerp(28, 8, mira), y: lerp(2, sy + 30, mira), tipo: 'abierta', escorzo: lerp(1, 0.6, mira), codo: 1, pulgar: 1 }) });
        const [tx, ty] = tobillo(r, 250, 1820, kv, -1); grillete(ctx, tx, ty, kv / 2.2, 1, 3, 0);
        if (mira > 0) { const [hx, hy] = manoEn(r, 250, 1820, kv, 1); const cae = inv(CAE + 4.0, CAE + 4.6, t); moneda(ctx, hx + cae * 260, hy - 12 * kv / 4 + cae * 180, 9 * kv / 2.4 * 2.4 / 2.4, t * (cae > 0 ? 9 : 0)); }
      }
    }
    ctx.restore();
  }

  const ESCENAS = [[0, 4.5, escena1], [4.5, 11, escena2], [11, 16.5, escena3], [16.5, 30, escena4]];
  function renderFrame(ctx, t) {
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, W, H);
    const e = ESCENAS.find(([a, b]) => t >= a && t < b) || ESCENAS[ESCENAS.length - 1];
    ctx.save(); e[2](ctx, t); ctx.restore();
    ctx.globalAlpha = 1; ctx.filter = 'none';
    const frio = inv(CAE, CAE + 1.5, t);
    post(ctx, W, H, t, { bloom: 0.12, top: mix('#ffe2b0', '#c8d0dc', frio), bottom: mix('#3d4a56', '#1a2030', frio) });
    if (t > CAE + 0.6) { ctx.save(); ctx.globalCompositeOperation = 'saturation'; ctx.fillStyle = `rgba(128,128,128,${0.6 * inv(CAE + 0.6, CAE + 2, t)})`; ctx.fillRect(0, 0, W, H); ctx.restore(); }
    for (const b of [4.5, 11, 16.5]) if (Math.abs(t - b) < 0.1) velo(ctx, '#000', 1 - Math.abs(t - b) / 0.1);
    if (t < 0.4) velo(ctx, '#000', 1 - t / 0.4);
    velo(ctx, '#000', inv(29, 30, t));
    ctx.restore();
  }
  window.FELICIDAD = { W, H, DURACION, renderFrame };
})();
