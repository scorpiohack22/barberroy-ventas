// Rig frontal de personajes con proporciones humanas reales (unidades: centímetros).
// Estilo de ilustración a tinta con color plano y sombra cel, a juego con los fondos.
// Uso: FIG.persona(ctx, x, y, k, P, O) dibuja a la persona P con la pose O; (x, y) es el punto
// del suelo entre los pies (o el asiento si O.modo === 'sentado') y k son los píxeles por centímetro.
(function () {
  const INK = '#1d1915';
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  const largo = hex => (hex.length === 4 ? '#' + [...hex.slice(1)].map(c => c + c).join('') : hex);
  function shade(hex, k) {
    const n = parseInt(largo(hex).slice(1), 16);
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    if (k < 0) { r *= 1 + k; g *= 1 + k; b *= 1 + k; } else { r += (255 - r) * k; g += (255 - g) * k; b += (255 - b) * k; }
    const h = v => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0');
    return `#${h(r)}${h(g)}${h(b)}`;
  }
  function mix(a, b, t) {
    const pa = parseInt(largo(a).slice(1), 16), pb = parseInt(largo(b).slice(1), 16);
    const c = s => Math.round(lerp((pa >> s) & 255, (pb >> s) & 255, t));
    return '#' + [16, 8, 0].map(s => c(s).toString(16).padStart(2, '0')).join('');
  }

  // Cápsula cónica (dos círculos unidos por sus tangentes).
  function capsula(path, x1, y1, r1, x2, y2, r2) {
    const dx = x2 - x1, dy = y2 - y1, d = Math.hypot(dx, dy) || 0.001;
    const a = Math.atan2(dy, dx);
    const b = Math.acos(clamp((r1 - r2) / d, -1, 1));
    path.moveTo(x1 + Math.cos(a + b) * r1, y1 + Math.sin(a + b) * r1);
    path.arc(x1, y1, r1, a + b, a - b + Math.PI * 2);
    path.arc(x2, y2, r2, a - b, a + b);
    path.closePath();
  }
  // Curva suave cerrada que pasa por los puntos (Catmull-Rom).
  function curva(path, pts, cerrada = true) {
    const n = pts.length, P = i => pts[cerrada ? (i + n) % n : clamp(i, 0, n - 1)];
    path.moveTo(pts[0][0], pts[0][1]);
    for (let i = 0; i < (cerrada ? n : n - 1); i++) {
      const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
      path.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]);
    }
    if (cerrada) path.closePath();
  }
  const espejo = pts => pts.map(([x, y]) => [-x, y]);

  // Dibuja piezas como una silueta: contorno de tinta común, relleno plano y sombra cel (luz arriba-izquierda).
  let LW = 0.4, OFF = 1.2;
  function grupo(ctx, piezas) {
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.strokeStyle = INK; ctx.lineWidth = LW * 2;
    for (const p of piezas) if (!p.sin) ctx.stroke(p.path);
    for (const p of piezas) {
      ctx.fillStyle = p.fill; ctx.fill(p.path);
      if (p.sombra !== false) {
        ctx.save(); ctx.clip(p.path);
        ctx.fillStyle = shade(p.fill, p.osc ?? -0.2); ctx.fill(p.path);
        const o = OFF * (p.off ?? 1);
        ctx.translate(-0.6 * o, -0.8 * o);
        ctx.fillStyle = p.fill; ctx.fill(p.path);
        ctx.restore();
      }
    }
  }
  function linea(ctx, pts, w = 0.55, color = INK, alpha = 1) {
    ctx.save(); ctx.globalAlpha *= alpha; ctx.strokeStyle = color; ctx.lineWidth = LW * w * 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    if (pts.length === 3) ctx.quadraticCurveTo(pts[1][0], pts[1][1], pts[2][0], pts[2][1]);
    else for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.stroke(); ctx.restore();
  }
  // Rayado de sombra a tinta, como en los fondos.
  function rayado(ctx, clipPath, x0, y0, x1, y1, n, ang = 0.9, alpha = 0.35) {
    ctx.save(); ctx.clip(clipPath); ctx.strokeStyle = INK; ctx.globalAlpha *= alpha; ctx.lineWidth = LW * 0.7;
    ctx.beginPath();
    const L = Math.hypot(x1 - x0, y1 - y0) / Math.max(1, n);
    for (let i = 0; i < n; i++) {
      const t = i / Math.max(1, n - 1), x = lerp(x0, x1, t), y = lerp(y0, y1, t);
      ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(ang) * L * 2.6, y + Math.sin(ang) * L * 2.6);
    }
    ctx.stroke(); ctx.restore();
  }

  // Cinemática inversa de dos huesos; lado elige hacia dónde dobla el codo/rodilla.
  function ik(sx, sy, tx, ty, L1, L2, lado) {
    let dx = tx - sx, dy = ty - sy, d = Math.hypot(dx, dy);
    const dMax = (L1 + L2) * 0.998;
    if (d > dMax) { tx = sx + (dx / d) * dMax; ty = sy + (dy / d) * dMax; d = dMax; dx = tx - sx; dy = ty - sy; }
    d = Math.max(d, Math.abs(L1 - L2) + 0.5);
    const a = Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
    const ang = Math.atan2(dy, dx) + a * lado;
    return { ex: sx + Math.cos(ang) * L1, ey: sy + Math.sin(ang) * L1, tx, ty };
  }

  // ---------- proporciones ----------
  function medidas(P) {
    const H = P.altura, cab = P.cabezas || 7.5, hh = H / cab;
    const adulto = clamp((cab - 5.6) / 1.9), mujer = P.sexo === 'm', c = P.complexion || 1;
    const M = {
      H, hh, adulto, mujer,
      hw: hh * lerp(0.8, 0.7, adulto) * (mujer ? 0.97 : 1),
      cabezaY: -H + hh / 2,
      hombroY: -H + hh * lerp(1.3, 1.38, adulto),
      hombro: H * (mujer ? 0.108 : 0.122) * c,
      pecho: H * (mujer ? 0.092 : 0.105) * c,
      cintura: H * (mujer ? 0.068 : 0.088) * c,
      cadera: H * (mujer ? 0.1 : 0.09) * c,
      cinturaY: -H * lerp(0.6, 0.61, adulto),
      cinturonY: -H * lerp(0.55, 0.56, adulto),
      entrepiernaY: -H * lerp(0.44, 0.47, adulto),
      caderaJ: H * 0.052 * c,
      rodillaY: -H * lerp(0.27, 0.285, adulto),
      tobilloY: -H * 0.042,
      brazo: H * 0.186, antebrazo: H * 0.148, mano: H * 0.104,
      rMuslo: H * 0.05 * c, rRodilla: H * 0.031 * c, rTobillo: H * 0.023,
      rBrazo: H * 0.0275 * c, rCodo: H * 0.021 * c, rMuneca: H * 0.0165,
    };
    M.caderaJY = M.entrepiernaY + H * 0.025;
    return M;
  }

  // ---------- manos (coordenadas locales: x a lo largo de la mano desde la muñeca, y lateral; s = escala) ----------
  function manoPath(tipo, s, pulgar) {
    const p = new Path2D(), q = pulgar;
    if (tipo === 'abierta') {
      capsula(p, 0, 0, 3.6 * s, 6.5 * s, 0, 4.1 * s);
      for (let k = 0; k < 4; k++) {
        const y = (-2.9 + k * 1.95) * s * -q, a = (-0.2 + k * 0.13) * -q;
        capsula(p, 7.5 * s, y, 1.15 * s, 7.5 * s + Math.cos(a) * (6.6 - Math.abs(k - 1.4) * 0.8) * s, y + Math.sin(a) * 6.6 * s, 0.95 * s);
      }
      capsula(p, 2.5 * s, 3.2 * s * q, 1.4 * s, 6.5 * s, 7.8 * s * q, 1.1 * s);
    } else if (tipo === 'puno') {
      capsula(p, 0.5 * s, 0, 3.7 * s, 6 * s, 0.3 * q * s, 4.4 * s);
      capsula(p, 3 * s, 3.4 * s * q, 1.5 * s, 7 * s, 3.2 * s * q, 1.3 * s);
    } else if (tipo === 'agarra') {
      capsula(p, 0, 0, 3.6 * s, 6 * s, 0, 4 * s);
      capsula(p, 6.5 * s, -0.5 * q * s, 3.3 * s, 9 * s, -1.6 * q * s, 2.6 * s);
      capsula(p, 2.5 * s, 3.1 * s * q, 1.4 * s, 7.5 * s, 4.6 * s * q, 1.15 * s);
    } else {
      capsula(p, 0, 0, 3.5 * s, 6.5 * s, 0.3 * s, 3.9 * s);
      capsula(p, 7.5 * s, 0.4 * s, 3.2 * s, 11 * s, -0.6 * q * s, 2.2 * s);
      capsula(p, 2.5 * s, 3 * s * q, 1.35 * s, 7 * s, 4.8 * s * q, 1.05 * s);
    }
    return p;
  }
  function manoDetalle(ctx, tipo, s, q) {
    if (tipo === 'abierta') return;
    if (tipo === 'puno' || tipo === 'agarra') for (let k = 0; k < 3; k++) linea(ctx, [[7.2 * s, (-2.6 + k * 1.9) * s * q], [9.2 * s, (-2.4 + k * 1.9) * s * q]], 0.35, INK, 0.6);
    else linea(ctx, [[8 * s, -1.6 * s * q], [10.5 * s, -0.8 * s * q], [11.5 * s, 0.9 * s * q]], 0.35, INK, 0.6);
  }

  // ---------- cabeza ----------
  function cabeza(ctx, M, P, O, cx, cy, capa = 'frente') {
    const hh = M.hh, hw = M.hw, g = O.giro || 0, baja = O.baja || 0;
    const gesto = O.gesto || 'neutral';
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(O.inclina || 0);
    const sx = g * hw * 0.16, fy = baja * hh * 0.07; // desplazamiento de rasgos
    const peinado = P.peinado || 'corto';
    const pc = P.pelo;
    if (capa === 'atras') {
    if (peinado === 'largo' || peinado === 'novia') {
      const pb = new Path2D();
      curva(pb, [[-hw * 0.56, -hh * 0.2], [-hw * 0.66, hh * 0.35], [-hw * 0.72, hh * 0.95], [-hw * 0.3, hh * 1.05], [hw * 0.3, hh * 1.05], [hw * 0.72, hh * 0.95], [hw * 0.66, hh * 0.35], [hw * 0.56, -hh * 0.2], [0, -hh * 0.58]]);
      grupo(ctx, [{ path: pb, fill: shade(pc, -0.12) }]);
    }
    if (peinado === 'novia') {
      const velo = new Path2D();
      curva(velo, [[-hw * 0.3, -hh * 0.58], [hw * 0.3, -hh * 0.58], [hw * 1.3, hh * 1.6], [hw * 1.5, hh * 3.6], [-hw * 1.5, hh * 3.6], [-hw * 1.3, hh * 1.6]]);
      ctx.save(); ctx.globalAlpha *= 0.55; ctx.fillStyle = '#fbfaf6'; ctx.fill(velo); ctx.strokeStyle = INK; ctx.lineWidth = LW * 0.8; ctx.stroke(velo); ctx.restore();
    }
    if (peinado === 'coleta') {
      const pb = new Path2D();
      capsula(pb, hw * 0.4, -hh * 0.1, hh * 0.13, hw * 0.75, hh * 0.55, hh * 0.08);
      capsula(pb, -hw * 0.4, -hh * 0.1, hh * 0.13, -hw * 0.75, hh * 0.55, hh * 0.08);
      grupo(ctx, [{ path: pb, fill: shade(pc, -0.05) }]);
    }
    if (peinado === 'mono') {
      const pb = new Path2D(); pb.ellipse(sx * 0.4, -hh * 0.56, hh * 0.19, hh * 0.15, 0, 0, Math.PI * 2);
      grupo(ctx, [{ path: pb, fill: pc }]);
    }
      ctx.restore(); return;
    }
    // orejas
    const orejas = new Path2D();
    const eo = hw * (1 - Math.abs(g) * 0.3);
    orejas.ellipse(-hw * 0.5 - sx * 0.35, hh * 0.04, hh * 0.075 * (g > 0.3 ? 0.6 : 1), hh * 0.13, -0.15, 0, Math.PI * 2);
    orejas.ellipse(hw * 0.5 - sx * 0.35, hh * 0.04, hh * 0.075 * (g < -0.3 ? 0.6 : 1), hh * 0.13, 0.15, 0, Math.PI * 2);
    // cara: cráneo y mandíbula
    const cara = new Path2D();
    const mj = M.mujer ? 0.24 : 0.3, ch = M.adulto < 0.5 ? 0.3 : mj;
    curva(cara, [
      [0, -hh * 0.5], [hw * 0.36, -hh * 0.44], [hw * 0.5, -hh * 0.2], [hw * 0.5, hh * 0.06], [hw * 0.44, hh * 0.27],
      [hw * ch, hh * 0.43], [sx * 0.3, hh * 0.5], [-hw * ch, hh * 0.43], [-hw * 0.44, hh * 0.27], [-hw * 0.5, hh * 0.06], [-hw * 0.5, -hh * 0.2], [-hw * 0.36, -hh * 0.44],
    ]);
    grupo(ctx, [{ path: orejas, fill: shade(P.piel, -0.05), off: 0.5 }, { path: cara, fill: P.piel, off: 1.1, osc: -0.16 }]);
    ctx.save(); ctx.clip(cara);
    // rubor y luz del móvil
    ctx.fillStyle = 'rgba(214,100,90,0.16)';
    ctx.beginPath(); ctx.ellipse(-hw * 0.27 + sx, hh * 0.18 + fy, hw * 0.12, hh * 0.06, 0, 0, Math.PI * 2); ctx.ellipse(hw * 0.27 + sx, hh * 0.18 + fy, hw * 0.12, hh * 0.06, 0, 0, Math.PI * 2); ctx.fill();
    if (O.luzMovil) {
      const gr = ctx.createRadialGradient(0, hh * 0.5, 0, 0, hh * 0.3, hh * 0.8);
      gr.addColorStop(0, `rgba(150,205,255,${0.22 * O.luzMovil})`); gr.addColorStop(1, 'rgba(140,200,255,0)');
      ctx.fillStyle = gr; ctx.fillRect(-hw, -hh, hw * 2, hh * 2);
    }
    ctx.restore();
    // orejas: hélix
    linea(ctx, [[-hw * 0.53 - sx * 0.35, -hh * 0.03], [-hw * 0.58 - sx * 0.35, hh * 0.05], [-hw * 0.52 - sx * 0.35, hh * 0.12]], 0.35, INK, 0.6);
    linea(ctx, [[hw * 0.53 - sx * 0.35, -hh * 0.03], [hw * 0.58 - sx * 0.35, hh * 0.05], [hw * 0.52 - sx * 0.35, hh * 0.12]], 0.35, INK, 0.6);

    // ---- rasgos ----
    const ey = -hh * 0.02 + fy, ex = hw * 0.215, ew = hw * 0.105, eh = hh * 0.042;
    const mx = (O.mirada?.x ?? 0) * ew * 0.45 + g * ew * 0.3, my = (O.mirada?.y ?? 0) * eh * 0.5 + baja * eh * 0.4;
    const cerrado = O.parpadeo || gesto === 'dormido';
    for (const lado of [-1, 1]) {
      const x = lado * ex + sx;
      if (cerrado || gesto === 'feliz') {
        ctx.strokeStyle = INK; ctx.lineWidth = LW * 1.1; ctx.lineCap = 'round'; ctx.beginPath();
        if (gesto === 'feliz' && !cerrado) ctx.arc(x, ey + eh * 0.8, ew * 0.9, Math.PI * 1.15, Math.PI * 1.85);
        else { ctx.moveTo(x - ew, ey); ctx.quadraticCurveTo(x, ey + eh * 1.1, x + ew, ey); }
        ctx.stroke();
      } else {
        const abre = gesto === 'sorpresa' ? 1.35 : 1;
        const ojo = new Path2D(); ojo.ellipse(x, ey, ew, eh * abre, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#f7f3ea'; ctx.fill(ojo);
        ctx.save(); ctx.clip(ojo);
        ctx.fillStyle = P.ojos || '#4a3426'; ctx.beginPath(); ctx.arc(x + mx, ey + my, eh * 0.95, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(x + mx, ey + my, eh * 0.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.beginPath(); ctx.arc(x + mx - eh * 0.3, ey + my - eh * 0.35, eh * 0.22, 0, Math.PI * 2); ctx.fill();
        // párpado superior (cansado / mirando abajo)
        const par = clamp((gesto === 'cansado' ? 0.45 : gesto === 'triste' ? 0.3 : 0) + baja * 0.35 + (O.parpado || 0));
        if (par > 0) { ctx.fillStyle = shade(P.piel, -0.08); ctx.fillRect(x - ew * 1.2, ey - eh * 1.5, ew * 2.4, eh * (0.5 + par * 1.6)); }
        ctx.restore();
        ctx.strokeStyle = INK; ctx.lineWidth = LW * 1.15; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x - ew * 1.1, ey + eh * 0.1);
        const ly = ey - eh * abre + par * eh * 1.6;
        ctx.quadraticCurveTo(x, ly - eh * 0.6, x + ew * 1.05, ey - eh * 0.05); ctx.stroke();
        linea(ctx, [[x - ew * 0.7, ey + eh * 1.05], [x, ey + eh * 1.3], [x + ew * 0.7, ey + eh * 1.0]], 0.3, INK, 0.45);
      }
      // ceja
      const by = ey - hh * 0.1, bi = gesto === 'triste' || gesto === 'cansado' ? -hh * 0.03 : gesto === 'sorpresa' ? -hh * 0.03 : 0;
      const be = gesto === 'sorpresa' ? -hh * 0.03 : 0;
      ctx.strokeStyle = shade(P.cejas || P.pelo, -0.3); ctx.lineWidth = LW * (M.mujer ? 1.0 : 1.5);
      ctx.beginPath(); ctx.moveTo(x - lado * ew * 1.1 * -1 * -1 + (lado < 0 ? ew * 0.9 : -ew * 0.9) * 0, by);
      const xi = x - lado * ew * 0.95, xe = x + lado * ew * 1.15;
      ctx.moveTo(xi, by + bi); ctx.quadraticCurveTo(x, by - hh * 0.025 + be, xe, by + hh * 0.012 + be); ctx.stroke();
      if (P.gafas) {
        ctx.strokeStyle = INK; ctx.lineWidth = LW * 0.9;
        ctx.beginPath(); ctx.roundRect(x - ew * 1.55, ey - eh * 1.9, ew * 3.1, eh * 3.6, eh * 1.1); ctx.stroke();
        ctx.fillStyle = 'rgba(220,235,245,0.18)'; ctx.fill();
      }
    }
    if (P.gafas) linea(ctx, [[-ex + sx + ew * 1.55, ey - eh * 0.6], [sx, ey - eh * 1.1], [ex + sx - ew * 1.55, ey - eh * 0.6]], 0.45);
    // nariz
    const nx = sx * 1.5, ny = hh * 0.17 + fy;
    linea(ctx, [[nx + hw * 0.035 * Math.sign(g || 1), ey + hh * 0.05], [nx + hw * 0.07 * Math.sign(g || 1), ny - hh * 0.02], [nx + hw * 0.02 * Math.sign(g || 1), ny]], 0.45, INK, 0.75);
    linea(ctx, [[nx - hw * 0.07, ny - hh * 0.005], [nx - hw * 0.035, ny + hh * 0.02], [nx, ny + hh * 0.01]], 0.4, INK, 0.65);
    linea(ctx, [[nx + hw * 0.07, ny - hh * 0.005], [nx + hw * 0.035, ny + hh * 0.02], [nx, ny + hh * 0.01]], 0.4, INK, 0.65);
    // arrugas de la edad
    const arr = P.arrugas || 0;
    if (arr > 0) {
      for (const lado of [-1, 1]) {
        linea(ctx, [[lado * hw * 0.13 + nx, ny + hh * 0.02], [lado * hw * 0.2 + nx, ny + hh * 0.1], [lado * hw * 0.2 + nx, ny + hh * 0.18]], 0.4, INK, 0.4 * arr);
        linea(ctx, [[lado * (ex + ew * 1.3) + sx, ey - eh * 0.4], [lado * (ex + ew * 1.8) + sx, ey + eh * 0.2]], 0.3, INK, 0.45 * arr);
        linea(ctx, [[lado * (ex + ew * 1.3) + sx, ey + eh * 0.6], [lado * (ex + ew * 1.75) + sx, ey + eh * 1.5]], 0.3, INK, 0.4 * arr);
      }
      linea(ctx, [[-hw * 0.2 + sx, -hh * 0.27], [sx, -hh * 0.285], [hw * 0.2 + sx, -hh * 0.27]], 0.3, INK, 0.4 * arr);
      linea(ctx, [[-hw * 0.16 + sx, -hh * 0.22], [sx, -hh * 0.235], [hw * 0.16 + sx, -hh * 0.22]], 0.3, INK, 0.3 * arr);
    }
    // barba y bigote
    const barba = P.barba || 0;
    if (barba > 0) {
      const b = new Path2D();
      curva(b, [[-hw * 0.49, hh * 0.1], [-hw * 0.45, hh * 0.3], [-hw * 0.3, hh * 0.47], [sx * 0.3, hh * 0.54], [hw * 0.3, hh * 0.47], [hw * 0.45, hh * 0.3], [hw * 0.49, hh * 0.1],
        [hw * 0.36, hh * 0.18], [hw * 0.16 + sx, hh * 0.26 + fy], [sx, hh * 0.24 + fy], [-hw * 0.16 + sx, hh * 0.26 + fy], [-hw * 0.36, hh * 0.18]]);
      ctx.save(); ctx.globalAlpha *= clamp(barba); grupo(ctx, [{ path: b, fill: P.colorBarba || P.pelo, off: 0.5 }]); ctx.restore();
    }
    // boca
    const my2 = hh * 0.3 + fy, mw = hw * 0.15;
    ctx.strokeStyle = INK; ctx.lineWidth = LW * 1.0; ctx.lineCap = 'round'; ctx.beginPath();
    if (gesto === 'feliz') {
      ctx.moveTo(sx - mw * 1.2, my2 - hh * 0.01); ctx.quadraticCurveTo(sx, my2 + hh * 0.11, sx + mw * 1.2, my2 - hh * 0.01); ctx.closePath();
      ctx.fillStyle = '#7a2e2a'; ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.fillRect(sx - mw * 0.9, my2 - hh * 0.005, mw * 1.8, hh * 0.022);
    } else if (gesto === 'sorpresa') { ctx.ellipse(sx, my2 + hh * 0.01, mw * 0.4, hh * 0.04, 0, 0, Math.PI * 2); ctx.fillStyle = '#5a201e'; ctx.fill(); ctx.stroke(); }
    else if (gesto === 'triste') { ctx.moveTo(sx - mw, my2 + hh * 0.025); ctx.quadraticCurveTo(sx, my2 - hh * 0.02, sx + mw, my2 + hh * 0.025); ctx.stroke(); }
    else if (gesto === 'sonrie') { ctx.moveTo(sx - mw, my2 - hh * 0.005); ctx.quadraticCurveTo(sx, my2 + hh * 0.04, sx + mw, my2 - hh * 0.005); ctx.stroke(); }
    else { ctx.moveTo(sx - mw * 0.85, my2); ctx.quadraticCurveTo(sx, my2 + hh * 0.008, sx + mw * 0.85, my2); ctx.stroke(); }
    if (gesto !== 'feliz' && gesto !== 'sorpresa') linea(ctx, [[sx - mw * 0.5, my2 + hh * 0.05], [sx, my2 + hh * 0.06], [sx + mw * 0.5, my2 + hh * 0.05]], 0.3, INK, 0.35);
    if (P.labios) { ctx.fillStyle = P.labios; ctx.globalAlpha = 0.55; ctx.beginPath(); ctx.ellipse(sx, my2 + hh * 0.012, mw * 0.8, hh * 0.022, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }

    // ---- pelo delantero ----
    const pel = new Path2D();
    const can = P.canas || 0, colorPelo = mix(pc, '#d9d6d0', can);
    if (peinado === 'calvo') {
      curva(pel, [[-hw * 0.52, hh * 0.02], [-hw * 0.54, -hh * 0.2], [-hw * 0.42, -hh * 0.36], [-hw * 0.34, -hh * 0.26], [-hw * 0.42, -hh * 0.05]]);
      curva(pel, espejo([[-hw * 0.52, hh * 0.02], [-hw * 0.54, -hh * 0.2], [-hw * 0.42, -hh * 0.36], [-hw * 0.34, -hh * 0.26], [-hw * 0.42, -hh * 0.05]]));
    } else if (peinado === 'corto' || peinado === 'canoso') {
      const ent = P.entradas || 0; // entradas de la edad
      curva(pel, [
        [-hw * 0.52, hh * 0.0], [-hw * 0.56, -hh * 0.25], [-hw * 0.4, -hh * 0.5], [-hw * 0.05, -hh * 0.6], [hw * 0.35, -hh * 0.56], [hw * 0.55, -hh * 0.36], [hw * 0.53, -hh * 0.02],
        [hw * 0.46, -hh * 0.2], [hw * (0.32 - ent * 0.05), -hh * (0.28 - ent * 0.06)], [hw * 0.05, -hh * (0.33 - ent * 0.08)], [-hw * 0.2 + sx * 0.3, -hh * (0.27 - ent * 0.05)], [-hw * 0.38, -hh * (0.22 - ent * 0.04)], [-hw * 0.46, -hh * 0.1],
      ]);
    } else if (peinado === 'mono' || peinado === 'largo' || peinado === 'coleta' || peinado === 'novia') {
      curva(pel, [
        [-hw * 0.56, hh * 0.25], [-hw * 0.6, -hh * 0.2], [-hw * 0.38, -hh * 0.52], [0, -hh * 0.6], [hw * 0.38, -hh * 0.52], [hw * 0.6, -hh * 0.2], [hw * 0.56, hh * 0.25],
        [hw * 0.46, -hh * 0.05], [hw * 0.3, -hh * 0.26], [hw * 0.02 + sx * 0.5, -hh * 0.33], [-hw * 0.1 + sx * 0.5, -hh * 0.28], [-hw * 0.32, -hh * 0.22], [-hw * 0.46, -hh * 0.05],
      ]);
    }
    grupo(ctx, [{ path: pel, fill: colorPelo, off: 0.7 }]);
    ctx.strokeStyle = shade(colorPelo, 0.3); ctx.lineWidth = LW * 0.7; ctx.lineCap = 'round';
    if (peinado !== 'calvo') {
      ctx.beginPath();
      ctx.moveTo(-hw * 0.3, -hh * 0.45); ctx.quadraticCurveTo(-hw * 0.05, -hh * 0.55, hw * 0.25, -hh * 0.5);
      ctx.moveTo(-hw * 0.42, -hh * 0.3); ctx.quadraticCurveTo(-hw * 0.3, -hh * 0.44, -hw * 0.1, -hh * 0.47);
      ctx.stroke();
      linea(ctx, [[hw * 0.1, -hh * 0.36], [hw * 0.25, -hh * 0.45], [hw * 0.42, -hh * 0.38]], 0.35, INK, 0.45);
    }
    if (peinado === 'novia') {
      ctx.fillStyle = '#f6f1e6'; ctx.strokeStyle = INK; ctx.lineWidth = LW;
      for (let k = -3; k <= 3; k++) { ctx.beginPath(); ctx.arc(k * hw * 0.1, -hh * 0.5 - Math.cos(k * 0.4) * hh * 0.04, hh * 0.035, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
    }
    if (O.gorro) {
      const gp = new Path2D(); gp.moveTo(-hw * 0.32, -hh * 0.42); gp.lineTo(hw * 0.05, -hh * 1.15); gp.lineTo(hw * 0.38, -hh * 0.42); gp.quadraticCurveTo(0, -hh * 0.34, -hw * 0.32, -hh * 0.42); gp.closePath();
      grupo(ctx, [{ path: gp, fill: O.gorro }]);
      ctx.save(); ctx.clip(gp); ctx.strokeStyle = '#fff6d0'; ctx.lineWidth = hh * 0.05; ctx.beginPath();
      for (let k = 0; k < 4; k++) { ctx.moveTo(-hw, -hh * (0.5 + k * 0.18)); ctx.lineTo(hw, -hh * (0.65 + k * 0.18)); } ctx.stroke(); ctx.restore();
      ctx.fillStyle = '#ffd34d'; ctx.strokeStyle = INK; ctx.lineWidth = LW; ctx.beginPath(); ctx.arc(hw * 0.05, -hh * 1.17, hh * 0.06, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
    ctx.restore();
  }

  // ---------- objetos de mano ----------
  function movil(ctx, M, x, y, ang, encendido) {
    const s = M.H / 178;
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
    ctx.fillStyle = '#23252a'; ctx.strokeStyle = INK; ctx.lineWidth = LW * 1.1;
    ctx.beginPath(); ctx.roundRect(-3.6 * s, -8 * s, 7.2 * s, 15 * s, 1.3 * s); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#4a4d55'; ctx.beginPath(); ctx.roundRect(-2.6 * s, -7 * s, 2.4 * s, 3 * s, 0.6 * s); ctx.fill();
    if (encendido) {
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(0, -6 * s, 0, 0, -6 * s, 16 * s);
      g.addColorStop(0, `rgba(120,180,255,${0.22 * encendido})`); g.addColorStop(1, 'rgba(120,180,255,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, -6 * s, 16 * s, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  // ---------- persona ----------
  function persona(ctx, x, y, k, P, O = {}) {
    const M = medidas(P), H = M.H;
    const modo = O.modo || 'pie', fase = O.fase || 0, sentado = modo === 'sentado';
    LW = (O.grosor || 1.7) / k; OFF = 3.2 / k + H * 0.004;
    ctx.save(); ctx.translate(x, y); ctx.scale(k * (O.espejo ? -1 : 1), k);

    // ---- esqueleto ----
    let dy = 0, sway = 0;
    if (modo === 'camina') { dy = -Math.abs(Math.cos(fase)) * H * 0.008; sway = Math.sin(fase) * H * 0.006; }
    if (modo === 'salto') dy = -(O.altoSalto ?? H * 0.12);
    // en sentado, la cadera se coloca sobre el asiento (y = 0)
    const baseY = sentado ? -M.entrepiernaY - H * 0.03 - (O.fondoAsiento ?? H * 0.06) : 0;
    const enc = O.encorvado || 0;
    const tY = v => v + baseY + dy; // y del tronco
    const hY = tY(M.hombroY) + enc * H * 0.02, cabY = tY(M.cabezaY) + enc * H * 0.035;
    const cabX = sway + enc * 0 + (O.cabezaX || 0);

    // piernas
    const piernas = [];
    for (const lado of [-1, 1]) {
      const hx = lado * M.caderaJ + sway, hy = tY(M.caderaJY);
      let kx, ky, ax, ay, pie = 'frente', alza = 0;
      if (sentado) {
        const piesY = O.piesY ?? -M.rodillaY * 0.98 + H * 0.03;
        kx = lado * (M.caderaJ + H * 0.018 + (O.abreRodillas || 0)); ky = H * 0.012 + (O.rodillasY || 0);
        ax = lado * (M.caderaJ + H * 0.008 + (O.abrePies || 0)); ay = piesY - H * 0.035;
      } else if (modo === 'camina') {
        const lat = O.lateral ?? 0;
        const q = fase + (lado < 0 ? 0 : Math.PI);
        if (lat > 0.5) {
          const th = Math.sin(q) * 0.3, kn = Math.max(0, Math.cos(q - 0.4)) * 0.75;
          const L1 = M.rodillaY - M.caderaJY, L2 = M.tobilloY - M.rodillaY;
          kx = hx + Math.sin(th) * L1 * (O.dir || 1); ky = hy + Math.cos(th) * L1;
          ax = kx + Math.sin(th - kn) * L2 * (O.dir || 1); ay = ky + Math.cos(th - kn) * L2;
          pie = 'lado';
        } else {
          alza = Math.max(0, Math.sin(q)) * H * 0.05;
          kx = lado * (M.caderaJ + H * 0.004); ky = tY(M.rodillaY) - alza * 0.35;
          ax = lado * (M.caderaJ + H * 0.002) + sway * 0.4; ay = tY(M.tobilloY) - alza + -dy;
        }
      } else if (modo === 'salto') {
        kx = lado * (M.caderaJ + H * 0.02); ky = tY(M.rodillaY) - H * 0.03;
        ax = lado * (M.caderaJ + H * 0.005); ay = tY(M.tobilloY) - H * 0.02;
      } else {
        const peso = O.peso || 0; // desplaza el peso a una pierna
        kx = lado * (M.caderaJ + H * 0.003) + peso * H * 0.01; ky = M.rodillaY;
        ax = lado * (M.caderaJ - H * 0.004 + (O.abrePies || 0)) + peso * H * 0.004; ay = M.tobilloY;
      }
      piernas.push({ lado, hx, hy, kx, ky, ax, ay, pie, alza });
    }

    // sombra en el suelo
    if (O.sombra !== false && !O.soloBrazo) {
      const sy = sentado ? (O.piesY ?? -M.rodillaY) : 0;
      const g = ctx.createRadialGradient(0, sy, 1, 0, sy, H * 0.22);
      g.addColorStop(0, `rgba(30,20,10,${0.32 + dy / H})`); g.addColorStop(1, 'rgba(30,20,10,0)');
      ctx.save(); ctx.translate(0, sy); ctx.scale(1, 0.2); ctx.translate(0, -sy); ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(0, sy, H * 0.22, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }

    // brazos (objetivos de mano en coordenadas del cuerpo)
    const brazos = [-1, 1].map(lado => {
      const sx = lado * (M.hombro - H * 0.036) + sway * 0.6, sy = hY + H * 0.026;
      const L1 = M.brazo, L2v = M.antebrazo;
      const def = { x: sx + lado * H * 0.012, y: sy + (L1 + L2v) * 0.97, tipo: 'relajada' };
      let m = (lado < 0 ? O.manoI : O.manoD) || def;
      if (typeof m === 'function') m = m(sx, sy, M);
      if (modo === 'camina' && !(lado < 0 ? O.manoI : O.manoD)) {
        const q = fase + (lado < 0 ? Math.PI : 0);
        m = { x: def.x - lado * H * 0.01 + (O.lateral > 0.5 ? Math.sin(q) * H * 0.07 * (O.dir || 1) : 0), y: def.y - Math.max(0, Math.sin(q)) * H * 0.03, tipo: 'relajada' };
      }
      const L2 = L2v * (m.escorzo ?? 1);
      const r = ik(sx, sy, m.x, m.y, L1 * (m.escorzoB ?? 1), L2, lado < 0 ? (m.codo ?? 1) : -(m.codo ?? 1));
      return { lado, sx, sy, ...r, tipo: m.tipo || 'relajada', m };
    });

    // ---- pelo trasero largo ya lo dibuja la cabeza; aquí el cuerpo ----
    const camisa = P.camisa, pantalon = P.pantalon || (P.falda ? P.falda.color : P.piel), zap = P.zapatos || '#2a2420';
    const piel = P.piel;
    const falda = P.falda; // { color, largo: 'rodilla' | 'suelo' }

    const piezasPierna = (pi) => {
      const { lado, hx, hy, kx, ky, ax, ay, pie, alza } = pi;
      const pzas = [];
      const pant = new Path2D();
      const corto = P.pantalonCorto;
      const rM = M.rMuslo * (P.pantalonAncho || 1.05), rR = M.rRodilla * 1.15, rT = M.rTobillo * (P.pantalonAncho ? 1.4 : 1.25);
      if (sentado) {
        // espinilla primero (bajo el muslo)
        const esp = new Path2D(); capsula(esp, kx, ky, rR, ax, ay, rT);
        pzas.push({ path: esp, fill: shade(falda && falda.largo !== 'suelo' ? piel : pantalon, -0.06) });
      } else if (corto || (falda && falda.largo === 'rodilla')) {
        const muslo = new Path2D(); capsula(muslo, hx, hy, M.rMuslo, kx, ky, M.rRodilla);
        const esp = new Path2D(); capsula(esp, kx, ky, M.rRodilla, ax, ay - M.rTobillo * 0.5, M.rTobillo);
        pzas.push({ path: esp, fill: piel }, { path: muslo, fill: piel });
      } else {
        capsula(pant, hx, hy, rM, kx, ky, rR); capsula(pant, kx, ky, rR, ax, ay - rT * 0.6, rT);
        pzas.push({ path: pant, fill: pantalon });
      }
      // zapato
      const s = H / 178;
      const zp = new Path2D();
      if (pie === 'lado') {
        const d = O.dir || 1;
        curva(zp, [[ax - 4 * s * d, ay - 2.5 * s], [ax + 3 * s * d, ay - 3.5 * s], [ax + 10 * s * d, ay - 0.5 * s], [ax + 11 * s * d, ay + 2.6 * s], [ax - 5 * s * d, ay + 2.6 * s]]);
      } else {
        const w = 5.4 * s, hz = 6 * s + alza * 0.08;
        curva(zp, [[ax - w, ay + 1.2 * s], [ax - w * 0.85, ay - hz * 0.5], [ax + lado * w * 0.2, ay - hz * 0.75], [ax + w * 0.9, ay - hz * 0.45], [ax + w * 1.05, ay + 1.3 * s], [ax, ay + hz * 0.7 + 1 * s]]);
      }
      pzas.unshift({ path: zp, fill: zap, off: 0.4 });
      return { pzas, det: () => {
      if (pie !== 'lado') linea(ctx, [[ax - 4.6 * s, ay + 1.6 * s], [ax, ay + 3.2 * s], [ax + 4.8 * s, ay + 1.7 * s]], 0.45, shade(zap, 0.45), 0.9);
      if (!sentado && !corto && !(falda && falda.largo === 'rodilla')) {
        linea(ctx, [[kx - lado * rR * 0.4, ky - rR * 0.6], [kx, ky - rR * 0.1], [kx + lado * rR * 0.5, ky - rR * 0.7]], 0.35, INK, 0.45); // pliegue de rodilla
        linea(ctx, [[ax - rT * 0.9, ay - rT * 1.6], [ax, ay - rT * 1.1], [ax + rT * 0.9, ay - rT * 1.7]], 0.35, INK, 0.4); // caída del pantalón
      }
      } };
    };
    // Las dos piernas y la cadera forman una sola silueta (sin líneas internas).
    const conPelvis = !falda && !sentado;
    const dibujaPiernas = () => {
      const ps = piernas.map(piezasPierna);
      const zapatos = ps.map(q => q.pzas[0]), resto = ps.flatMap(q => q.pzas.slice(1));
      const extra = [];
      if (conPelvis) {
        const ww = M.cintura, hw = M.cadera, bY = tY(M.cinturonY), eY = tY(M.entrepiernaY);
        const pelvis = new Path2D();
        pelvis.moveTo(-ww * 1.03 + sway, bY - H * 0.01); pelvis.lineTo(ww * 1.03 + sway, bY - H * 0.01);
        pelvis.quadraticCurveTo(hw * 0.98 + sway, (bY + eY) / 2, hw * 0.8 + sway, eY + H * 0.01); pelvis.lineTo(-hw * 0.8 + sway, eY + H * 0.01);
        pelvis.quadraticCurveTo(-hw * 0.98 + sway, (bY + eY) / 2, -ww * 1.03 + sway, bY - H * 0.01); pelvis.closePath();
        extra.push({ path: pelvis, fill: pantalon });
      }
      grupo(ctx, [...zapatos, ...extra, ...resto]);
      ps.forEach(q => q.det());
    };

    const dibujaMuslos = () => {
      // muslos vistos de frente (escorzo): regazo
      const pz = [];
      if (O.sombraAsiento !== false) {
        const hy = piernas[0].hy, g = ctx.createRadialGradient(0, hy + H * 0.03, 1, 0, hy + H * 0.03, H * 0.2);
        g.addColorStop(0, 'rgba(20,15,10,0.35)'); g.addColorStop(1, 'rgba(20,15,10,0)');
        ctx.save(); ctx.translate(0, hy + H * 0.03); ctx.scale(1.4, 0.35); ctx.translate(0, -(hy + H * 0.03));
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, hy + H * 0.03, H * 0.2, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      }
      for (const pi of piernas) {
        const mus = new Path2D(); capsula(mus, pi.hx, pi.hy - H * 0.01, M.rMuslo * 1.05, pi.kx, pi.ky, M.rRodilla * 1.3);
        pz.push({ path: mus, fill: falda && falda.largo !== 'suelo' ? falda.color : pantalon });
      }
      grupo(ctx, pz);
      for (let i = 0; i < 2; i++) {
        const pi = piernas[i]; ctx.save(); ctx.clip(pz[i].path);
        const luz = new Path2D(); capsula(luz, pi.hx - pi.lado * H * 0.004, pi.hy - H * 0.022, M.rMuslo * 0.8, pi.kx - pi.lado * H * 0.003, pi.ky - M.rRodilla * 0.55, M.rRodilla * 0.85);
        ctx.fillStyle = 'rgba(255,255,255,0.13)'; ctx.fill(luz); ctx.restore();
      }
      for (const pi of piernas) {
        linea(ctx, [[pi.kx - M.rRodilla * 1.1, pi.ky + M.rRodilla * 0.2], [pi.kx, pi.ky + M.rRodilla * 0.8], [pi.kx + M.rRodilla * 1.1, pi.ky + M.rRodilla * 0.2]], 0.4, INK, 0.5);
        linea(ctx, [[pi.hx - pi.lado * M.rMuslo * 0.2, pi.hy + H * 0.01], [pi.kx - pi.lado * M.rRodilla * 0.5, pi.ky - M.rRodilla * 0.6]], 0.35, INK, 0.3);
      }
    };

    // ---- torso ----
    const dibujaTorso = () => {
      const sw = M.hombro, cw = M.pecho, ww = M.cintura, hw = M.cadera;
      const sY = hY, wY = tY(M.cinturaY), bY = tY(M.cinturonY), eY = tY(M.entrepiernaY);
      const cuelloW = M.hw * 0.29;
      // cadera / pantalón superior
      const pelvis = new Path2D();
      pelvis.moveTo(-ww * 1.03 + sway, bY - H * 0.01); pelvis.lineTo(ww * 1.03 + sway, bY - H * 0.01);
      pelvis.quadraticCurveTo(hw * 0.98 + sway, (bY + eY) / 2 - H * 0.01, hw * 0.95 + sway, eY + H * 0.03); pelvis.lineTo(-hw * 0.95 + sway, eY + H * 0.03);
      pelvis.quadraticCurveTo(-hw * 0.98 + sway, (bY + eY) / 2 - H * 0.01, -ww * 1.03 + sway, bY - H * 0.01); pelvis.closePath();
      const pzas = conPelvis ? [] : [{ path: pelvis, fill: falda ? falda.color : pantalon }];
      // falda
      if (falda && !sentado) {
        const fl = new Path2D();
        const fy = falda.largo === 'suelo' ? -H * 0.005 : tY(M.rodillaY) + H * 0.02;
        const fw = falda.largo === 'suelo' ? hw * 1.9 : hw * 1.35;
        curva(fl, [[-ww + sway, wY], [ww + sway, wY], [hw * 1.05 + sway, (wY + eY) / 2], [fw + sway, fy], [sway, fy + H * 0.012], [-fw + sway, fy], [-hw * 1.05 + sway, (wY + eY) / 2]]);
        pzas.push({ path: fl, fill: falda.color });
      } else if (falda && sentado) {
        const fl = new Path2D();
        curva(fl, [[-ww + sway, wY], [ww + sway, wY], [hw * 1.1 + sway, eY], [hw * 1.15 + sway, H * 0.03], [-hw * 1.15 + sway, H * 0.03], [-hw * 1.1 + sway, eY]]);
        pzas.push({ path: fl, fill: falda.color });
      }
      // camisa / blusa
      const tor = new Path2D();
      const busto = M.mujer && M.adulto > 0.6 ? H * 0.008 : 0;
      const rect = [
        [-cuelloW * 1.25 + cabX * 0.3, sY - H * 0.014], [-sw * 0.62, sY - H * 0.006], [-sw, sY + H * 0.012], [-sw * 1.02, sY + H * 0.045],
        [-cw - busto, sY + H * 0.1], [-ww, wY], [-ww * 1.04, bY + H * 0.004], [ww * 1.04, bY + H * 0.004], [ww, wY], [cw + busto, sY + H * 0.1],
        [sw * 1.02, sY + H * 0.045], [sw, sY + H * 0.012], [sw * 0.62, sY - H * 0.006], [cuelloW * 1.25 + cabX * 0.3, sY - H * 0.014],
      ].map(([px, py]) => [px + sway * (py > sY + H * 0.05 ? 1 : 0.6), py]);
      curva(tor, rect);
      const torColor = P.chaqueta || camisa;
      pzas.push({ path: tor, fill: torColor, off: 1.3 });
      // cuello (piel) va antes que la camisa
      const cuello = new Path2D(); capsula(cuello, cabX * 0.5, cabY + M.hh * 0.3, cuelloW, cabX * 0.3, sY + H * 0.005, cuelloW * 1.12);
      grupo(ctx, [{ path: cuello, fill: shade(piel, -0.08), off: 0.6 }]);
      ctx.save(); ctx.clip(cuello); ctx.fillStyle = 'rgba(40,20,10,0.25)'; ctx.fillRect(-cuelloW * 2, cabY + M.hh * 0.42, cuelloW * 4, M.hh * 0.1); ctx.restore();
      grupo(ctx, pzas);
      // detalles de ropa
      ctx.save(); ctx.clip(tor);
      rayado(ctx, tor, sw * 0.55 + sway, sY + H * 0.06, ww * 0.95 + sway, bY - H * 0.02, 9, 2.2, 0.22);
      ctx.restore();
      if (P.chaqueta) {
        // solapas y camisa bajo la chaqueta
        const v = new Path2D(); v.moveTo(-cuelloW * 1.2 + sway, sY - H * 0.012); v.lineTo(cuelloW * 1.2 + sway, sY - H * 0.012); v.lineTo(sway, sY + H * 0.13); v.closePath();
        grupo(ctx, [{ path: v, fill: camisa, sombra: false }]);
        if (P.corbata) {
          const c = new Path2D(); c.moveTo(-H * 0.008 + sway, sY - H * 0.006); c.lineTo(H * 0.008 + sway, sY - H * 0.006); c.lineTo(H * 0.011 + sway, sY + H * 0.12); c.lineTo(sway, sY + H * 0.135); c.lineTo(-H * 0.011 + sway, sY + H * 0.12); c.closePath();
          grupo(ctx, [{ path: c, fill: P.corbata, off: 0.3 }]);
        }
        linea(ctx, [[-cuelloW * 1.3 + sway, sY - H * 0.012], [-cw * 0.55 + sway, sY + H * 0.06], [sway - H * 0.003, sY + H * 0.16]], 0.6);
        linea(ctx, [[cuelloW * 1.3 + sway, sY - H * 0.012], [cw * 0.55 + sway, sY + H * 0.06], [sway + H * 0.003, sY + H * 0.16]], 0.6);
        linea(ctx, [[sway, sY + H * 0.16], [sway, bY]], 0.5, INK, 0.7);
        for (let i = 0; i < 2; i++) { ctx.fillStyle = shade(P.chaqueta, -0.4); ctx.beginPath(); ctx.arc(sway + H * 0.006, sY + H * (0.18 + i * 0.045), H * 0.0035, 0, Math.PI * 2); ctx.fill(); }
      } else if (P.cuello === 'camisa') {
        // cuello de camisa con botones y corbata opcional
        if (P.corbata) {
          const c = new Path2D(); c.moveTo(-H * 0.009 + sway, sY - H * 0.008); c.lineTo(H * 0.009 + sway, sY - H * 0.008); c.lineTo(H * 0.006 + sway, sY + H * 0.01);
          c.lineTo(H * 0.014 + sway, sY + H * 0.17); c.lineTo(sway, sY + H * 0.19); c.lineTo(-H * 0.014 + sway, sY + H * 0.17); c.lineTo(-H * 0.006 + sway, sY + H * 0.01); c.closePath();
          grupo(ctx, [{ path: c, fill: P.corbata, off: 0.3 }]);
          linea(ctx, [[-H * 0.006 + sway, sY + H * 0.01], [H * 0.006 + sway, sY + H * 0.01]], 0.4, INK, 0.6);
        } else {
          linea(ctx, [[sway, sY + H * 0.005], [sway + H * 0.002, bY]], 0.45, INK, 0.55);
          for (let i = 0; i < 4; i++) { ctx.fillStyle = shade(camisa, -0.35); ctx.beginPath(); ctx.arc(sway + H * 0.006, sY + H * (0.03 + i * 0.05), H * 0.0028, 0, Math.PI * 2); ctx.fill(); }
        }
        const sol = new Path2D();
        sol.moveTo(-cuelloW * 1.25 + sway, sY - H * 0.018); sol.lineTo(sway, sY + H * 0.01); sol.lineTo(-cuelloW * 1.6 + sway, sY + H * 0.024); sol.closePath();
        sol.moveTo(cuelloW * 1.25 + sway, sY - H * 0.018); sol.lineTo(sway, sY + H * 0.01); sol.lineTo(cuelloW * 1.6 + sway, sY + H * 0.024); sol.closePath();
        grupo(ctx, [{ path: sol, fill: shade(camisa, 0.06), off: 0.3 }]);
        if (P.bolsillo !== false) linea(ctx, [[cw * 0.25 + sway, sY + H * 0.06], [cw * 0.25 + sway, sY + H * 0.1], [cw * 0.7 + sway, sY + H * 0.1], [cw * 0.7 + sway, sY + H * 0.06]], 0.4, INK, 0.55);
      } else if (P.cuello === 'pico') {
        linea(ctx, [[-cuelloW * 1.25 + sway, sY - H * 0.012], [sway, sY + H * 0.05], [cuelloW * 1.25 + sway, sY - H * 0.012]], 0.6);
      } else {
        linea(ctx, [[-cuelloW * 1.3 + sway, sY - H * 0.012], [sway, sY + H * 0.016], [cuelloW * 1.3 + sway, sY - H * 0.012]], 0.6);
      }
      if (P.estampado) P.estampado(ctx, sway, sY, bY, H);
      if (!falda && !P.chaqueta) {
        // cinturón
        const cin = new Path2D(); cin.rect(-ww * 1.05 + sway, bY - H * 0.007, ww * 2.1, H * 0.014);
        grupo(ctx, [{ path: cin, fill: P.cinturon || '#3a2a20', sombra: false }]);
        ctx.fillStyle = '#c8b073'; ctx.fillRect(sway - H * 0.007, bY - H * 0.0075, H * 0.014, H * 0.015);
        linea(ctx, [[sway, bY + H * 0.008], [sway, eY - H * 0.005]], 0.35, INK, 0.5); // bragueta
      }
      linea(ctx, [[-ww * 0.6 + sway, bY - H * 0.04], [-ww * 0.1 + sway, bY - H * 0.02], [ww * 0.3 + sway, bY - H * 0.045]], 0.35, INK, 0.35); // arruga de camisa
    };

    const dibujaBrazo = (b) => {
      const { lado, sx, sy, ex, ey, tx, ty, tipo } = b;
      const corto = P.manga === 'corta', color = P.chaqueta || camisa;
      const dir = Math.atan2(ty - ey, tx - ex);
      const s = H / 178;
      const mano = new Path2D();
      const mt = new DOMMatrix().translate(tx, ty).rotate((dir * 180) / Math.PI);
      mano.addPath(manoPath(tipo, s, b.m.pulgar ?? -lado), mt);
      const pz = [{ path: mano, fill: piel, off: 0.4 }];
      if (corto) {
        const brazoP = new Path2D(); capsula(brazoP, sx, sy, M.rBrazo * 0.9, ex, ey, M.rCodo * 0.85); capsula(brazoP, ex, ey, M.rCodo * 0.85, tx, ty, M.rMuneca);
        const manga = new Path2D(); const mx = lerp(sx, ex, 0.5), my = lerp(sy, ey, 0.5); capsula(manga, sx, sy, M.rBrazo * 1.06, mx, my, M.rBrazo * 1.0);
        pz.push({ path: brazoP, fill: piel }, { path: manga, fill: color });
      } else {
        const manga = new Path2D(); capsula(manga, sx, sy, M.rBrazo, ex, ey, M.rCodo); capsula(manga, ex, ey, M.rCodo, tx - Math.cos(dir) * 1.2 * s, ty - Math.sin(dir) * 1.2 * s, M.rMuneca * 1.2);
        pz.push({ path: manga, fill: color });
        const puno = new Path2D(); capsula(puno, tx - Math.cos(dir) * 2.2 * s, ty - Math.sin(dir) * 2.2 * s, M.rMuneca * 1.12, tx - Math.cos(dir) * 0.8 * s, ty - Math.sin(dir) * 0.8 * s, M.rMuneca * 1.1);
        pz.push({ path: puno, fill: P.chaqueta ? shade(camisa, -0.08) : shade(color, 0.05), off: 0.3 });
      }
      grupo(ctx, pz);
      ctx.save(); ctx.setTransform(ctx.getTransform().multiply(mt)); manoDetalle(ctx, tipo, s, b.m.pulgar ?? -lado); ctx.restore();
      linea(ctx, [[ex - M.rCodo * 0.8, ey - M.rCodo * 0.2], [ex, ey + M.rCodo * 0.3], [ex + M.rCodo * 0.6, ey - M.rCodo * 0.5]], 0.35, INK, 0.45);
      if (b.m.objeto === 'movil') movil(ctx, M, tx + Math.cos(dir) * 6 * s, ty + Math.sin(dir) * 6 * s - 2 * s, b.m.angMovil ?? 0, O.movilEncendido ?? 1);
      if (b.m.objeto === 'maleta') {
        const mw = H * 0.24, mh = H * 0.34;
        const mal = new Path2D(); mal.roundRect(tx - mw / 2 + lado * H * 0.05, ty + H * 0.03, mw, mh, H * 0.02);
        const asa = new Path2D(); asa.roundRect(tx - H * 0.03 + lado * H * 0.05, ty - H * 0.005, H * 0.06, H * 0.04, H * 0.01);
        grupo(ctx, [{ path: asa, fill: '#3b3b3b' }, { path: mal, fill: b.m.color || '#3f6b8f', off: 1.2 }]);
        for (let i = 1; i < 4; i++) linea(ctx, [[tx - mw / 2 + lado * H * 0.05 + (mw * i) / 4, ty + H * 0.05], [tx - mw / 2 + lado * H * 0.05 + (mw * i) / 4, ty + H * 0.03 + mh - H * 0.02]], 0.4, INK, 0.45);
      }
      if (b.m.dibuja) b.m.dibuja(ctx, tx, ty, dir, s);
    };

    // solo un brazo (para dibujarlo por delante de un objeto que tapa el resto del cuerpo)
    if (O.soloBrazo) { brazos.filter(b => b.lado === O.soloBrazo).forEach(dibujaBrazo); ctx.restore(); return { M, brazos, piernas }; }
    // ---- orden de dibujo ----
    cabeza(ctx, M, P, O, cabX, cabY, 'atras');
    dibujaPiernas();
    dibujaTorso();
    if (sentado) dibujaMuslos();
    if (O.detrasCabeza) brazos.filter(b => O.detrasCabeza.includes(b.lado)).forEach(dibujaBrazo);
    cabeza(ctx, M, P, { ...O, luzMovil: O.luzMovil ?? 0 }, cabX, cabY);
    brazos.filter(b => !(O.detrasCabeza || []).includes(b.lado)).forEach(dibujaBrazo);
    ctx.restore();
    return { M, brazos, piernas };
  }

  window.FIG = { persona, medidas, capsula, curva, grupo, linea, shade, mix, ik, INK };
})();
