// Librería de dibujo para "Felicidad" (formato vertical 1080×1920).
// Personajes con rig articulado y sombreado cel, coches con interior, edificios y efectos.
(function () {
  const INK = '#2a2622';
  const LIGHT = { x: -0.6, y: -0.8 }; // luz desde arriba a la izquierda

  // ---------- utilidades ----------
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const inv = (a, b, v) => clamp((v - a) / (b - a));
  const ease = t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const easeIn = t => t * t * t;
  const easeInOutBack = t => { const c = 1.70158 * 1.525; return t < 0.5 ? (Math.pow(2 * t, 2) * ((c + 1) * 2 * t - c)) / 2 : (Math.pow(2 * t - 2, 2) * ((c + 1) * (t * 2 - 2) + c) + 2) / 2; };
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

  function shade(hex, k) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    if (k < 0) { r *= 1 + k; g *= 1 + k; b *= 1 + k; }
    else { r += (255 - r) * k; g += (255 - g) * k; b += (255 - b) * k; }
    const h = v => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0');
    return `#${h(r)}${h(g)}${h(b)}`;
  }
  function mix(a, b, t) {
    const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    const c = s => Math.round(lerp((pa >> s) & 255, (pb >> s) & 255, t));
    return '#' + [16, 8, 0].map(s => c(s).toString(16).padStart(2, '0')).join('');
  }
  function rrect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // Cápsula cónica (dos círculos unidos por sus tangentes) añadida a un Path2D.
  function capsula(path, x1, y1, r1, x2, y2, r2) {
    const dx = x2 - x1, dy = y2 - y1, d = Math.hypot(dx, dy) || 0.001;
    const a = Math.atan2(dy, dx);
    const b = Math.acos(clamp((r1 - r2) / d, -1, 1));
    path.moveTo(x1 + Math.cos(a + b) * r1, y1 + Math.sin(a + b) * r1);
    path.arc(x1, y1, r1, a + b, a - b + Math.PI * 2);
    path.arc(x2, y2, r2, a - b, a + b);
    path.closePath();
  }

  // Dibuja un grupo de piezas como una sola silueta: contorno común y relleno con sombreado cel.
  function grupo(ctx, piezas, lw, detalle = true) {
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.strokeStyle = INK; ctx.lineWidth = lw * 2;
    for (const p of piezas) if (!p.sinContorno) ctx.stroke(p.path);
    for (const p of piezas) {
      ctx.fillStyle = p.fill; ctx.fill(p.path);
      if (detalle && p.sombra !== false) {
        ctx.save(); ctx.clip(p.path);
        ctx.fillStyle = shade(p.fill, -0.22);
        ctx.fill(p.path);
        ctx.translate(LIGHT.x * (p.off || 3.2), LIGHT.y * (p.off || 3.2));
        ctx.fillStyle = p.fill; ctx.fill(p.path);
        ctx.restore();
      }
    }
  }

  // ---------- personajes ----------
  const SKIN = ['#f1c9a5', '#e0ac83', '#c68b60', '#8d5a3b', '#f5d6bd', '#a96f4a', '#6b4430'];
  const GRIS = ['#7d8a7a', '#6f7b74', '#8e958a', '#5f6b66', '#9aa196', '#77806f', '#a3a89b', '#868c80', '#6d7468'];
  const COLOR = ['#c96b5b', '#5b7fc9', '#d9b44a', '#6aa86b', '#9a6bc9', '#e08a3c', '#4ab0b0', '#d36f9a'];
  const PANTS = ['#3b4048', '#2f3a45', '#4a4238', '#353535', '#55504a', '#46505a', '#5a4e40'];
  const HAIR = ['#2a211c', '#5a3a22', '#1b1b1b', '#8a6a3a', '#b9b2a8', '#3a2a1e', '#7a3b22'];

  function nuevaPersona(r, colorida) {
    return {
      skin: pick(r, SKIN),
      shirt: colorida ? pick(r, COLOR) : pick(r, GRIS),
      pants: pick(r, PANTS),
      hair: pick(r, HAIR),
      hairStyle: pick(r, ['short', 'short', 'long', 'long', 'curly', 'bald', 'bun']),
      shoes: pick(r, ['#2a2522', '#3b2a20', '#1f1f24', '#5a4a3a', '#6b6b6b']),
      glasses: r() < 0.18,
      beard: r() < 0.15,
      jacket: r() < 0.3 ? pick(r, ['#3d4552', '#4b4238', '#2f3a35', '#5b4d5e']) : null,
      tie: r() < 0.25 ? pick(r, ['#7a2f2f', '#2f3f7a', '#2f5a3a']) : null,
    };
  }
  const PROTA = { skin: '#efc39e', shirt: '#f3f1ea', pants: '#3b4048', hair: '#3a2a1e', hairStyle: 'short', shoes: '#2a2522', glasses: false, beard: false, jacket: null, tie: '#2c4fa3' };

  // Medidas (unidades: la persona mide ~176 de suelo a coronilla).
  const MUSLO = 44, ESPINILLA = 42, TOBILLO = 9, TORSO = 50, BRAZO = 31, ANTEBRAZO = 27;
  const SENTADO = [{ th: 1.52, kn: 1.5 }, { th: 1.4, kn: 1.42 }];

  function poseBrazos(arms, legs, run, ph, o) {
    const r = o.reach || 0, w = Math.sin(ph) * 0.22;
    switch (arms) {
      case 'up': return { a: [[2.45 - w, 0.35, 'open'], [2.2 + w, 0.45, 'open']] };
      case 'cheer': return { a: [[2.7 + w, 0.55, 'fist'], [2.45 - w, 0.65, 'fist']] };
      case 'phone': return { a: [[-legs[0].th * 0.6, 0.35, 'relax'], [0.3, 2.3, 'fist']] };
      case 'box': return { a: [[0.95, 0.78, 'fist'], [0.85, 0.85, 'fist']] };
      case 'wheel': return { a: [[1.15, 0.42, 'fist'], [1.05, 0.5, 'fist']] };
      case 'reach': return { a: [[lerp(0.75, 1.3, r), lerp(0.75, 0.2, r), 'relax'], [lerp(0.8, 1.52, r), lerp(0.7, 0.02, r), 'open']] };
      case 'limp': return { a: [[0.12, 0.12, 'relax'], [0.05, 0.2, 'relax']] };
      case 'knees': return { a: [[0.9, 0.9, 'relax'], [1.0, 0.75, 'relax']] };
      case 'fly': return { a: [[2.35, 0.08, 'open'], [2.2, 0.12, 'open']] };
      case 'type': return { a: [[0.95, 0.85 + Math.sin(ph * 3) * 0.08, 'fist'], [0.9, 0.9 + Math.cos(ph * 3) * 0.08, 'fist']] };
      default: {
        const e = 0.28 + run * 1.3;
        return { a: [[-legs[0].th * 1.0, e, run > 0.6 ? 'fist' : 'relax'], [-legs[1].th * 1.0, e, run > 0.6 ? 'fist' : 'relax']] };
      }
    }
  }

  // Mano en coordenadas locales: x a lo largo del antebrazo.
  function manoPath(path, tipo) {
    if (tipo === 'fist') {
      capsula(path, 1, 0, 5.2, 7, 0.5, 5.6);
      capsula(path, 2, -4, 2.2, 6, -6, 2.3); // pulgar
    } else if (tipo === 'open') {
      capsula(path, 0, 0, 4.6, 6, 0, 5.2);
      for (let k = 0; k < 4; k++) { const a = -0.25 + k * 0.17; capsula(path, 7, -2.5 + k * 1.7, 1.8, 7 + Math.cos(a) * 9, -2.5 + k * 1.7 + Math.sin(a) * 9, 1.45); }
      capsula(path, 3, -4, 2.1, 9, -9, 1.7);
    } else {
      capsula(path, 0, 0, 4.6, 7, 0.5, 5.0);
      capsula(path, 8, 0.5, 4.0, 12, 3, 2.6); // dedos curvados
      capsula(path, 2.5, -4, 2.1, 7.5, -6.5, 1.8);
    }
  }
  function manoDetalle(ctx, tipo) {
    ctx.strokeStyle = 'rgba(42,38,34,0.55)'; ctx.lineWidth = 0.9;
    ctx.beginPath();
    if (tipo === 'fist') for (let k = 0; k < 3; k++) { ctx.moveTo(8.5, -3 + k * 2.6); ctx.lineTo(11.5, -2.6 + k * 2.6); }
    else if (tipo === 'relax') { ctx.moveTo(8, -2.5); ctx.quadraticCurveTo(11, -1, 12, 1.5); }
    ctx.stroke();
  }

  function persona(ctx, x, y, s, p, o = {}) {
    const ph = o.phase || 0, run = o.run ?? 0, f = o.facing || 1, mood = o.mood || 'neutral';
    const arms = o.arms || 'swing', seated = !!o.seated, moving = run > 0 && !seated;
    const detalle = s * (o.zoom || 1) > 0.32;
    const lw = 1.25 / Math.max(0.35, Math.min(1.4, s * (o.zoom || 1))) + 0.35;
    let legs;
    if (seated) legs = o.legs || SENTADO;
    else if (moving) {
      const A = lerp(0.3, 0.75, run), K = lerp(0.5, 1.7, run);
      legs = [Math.PI, 0].map(off => {
        const q = ph + off;
        return { th: A * Math.sin(q) + run * 0.12, kn: 0.1 + K * Math.pow(Math.max(0, Math.cos(q - 0.35 * run)), 1.4) };
      });
    } else legs = o.legs || [{ th: -0.07, kn: 0.05 }, { th: 0.09, kn: 0.05 }];
    const pies = legs.map(({ th, kn }) => {
      const kx = Math.sin(th) * MUSLO, ky = Math.cos(th) * MUSLO, a = th - kn;
      return { kx, ky, ax: kx + Math.sin(a) * ESPINILLA, ay: ky + Math.cos(a) * ESPINILLA, a };
    });
    const apoyo = Math.max(pies[0].ay, pies[1].ay) + TOBILLO;
    const vuelo = moving ? Math.max(0, Math.sin(ph * 2)) * run * 9 : 0;
    const hipY = seated ? -(o.seatH ?? 50) : -apoyo - vuelo;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s * f, s);
    if (o.shadow !== false && !seated) {
      const g = ctx.createRadialGradient(4, 0, 2, 4, 0, 40);
      g.addColorStop(0, `rgba(0,0,0,${0.28 - vuelo * 0.012})`); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.save(); ctx.scale(1, 0.18); ctx.beginPath(); ctx.arc(4, 0, 40, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
    if (o.chair) silla(ctx, hipY, lw);
    ctx.translate(0, hipY);
    const lean = o.lean ?? (moving ? run * 0.2 + 0.03 : 0);
    const { a: [brA, brB] } = poseBrazos(arms, legs, moving ? run : 0, ph, o);
    const rot = (px, py) => [px * Math.cos(lean) - py * Math.sin(lean), px * Math.sin(lean) + py * Math.cos(lean)];
    const hombro = rot(3, -TORSO + 6);

    const pierna = (i, lejos) => {
      const q = pies[i];
      const pants = new Path2D();
      capsula(pants, 0, 0, 10.5, q.kx, q.ky, 7.8);
      capsula(pants, q.kx, q.ky, 7.8, q.ax, q.ay - 2, 6.2);
      const contacto = seated ? 1 : clamp(1 - (apoyo - TOBILLO - q.ay) / 10);
      const rr = seated ? 0 : -q.a * 0.75 * (1 - contacto);
      const zap = new Path2D();
      const m = new DOMMatrix().translate(q.ax, q.ay).rotate((rr * 180) / Math.PI);
      const zl = new Path2D();
      zl.moveTo(-7, -4); zl.lineTo(5, -5.5); zl.bezierCurveTo(13, -5, 19, -1, 19.5, 4); zl.lineTo(19.5, 8.5); zl.lineTo(-7.5, 8.5); zl.bezierCurveTo(-9, 4, -8.5, -1, -7, -4); zl.closePath();
      zap.addPath(zl, m);
      const pc = lejos ? shade(p.pants, -0.18) : p.pants, sc = lejos ? shade(p.shoes, -0.2) : p.shoes;
      grupo(ctx, [{ path: zap, fill: sc, off: 2 }, { path: pants, fill: pc }], lw, detalle);
      if (detalle) {
        ctx.save(); ctx.setTransform(ctx.getTransform().multiply(m));
        ctx.fillStyle = shade(sc, 0.35); ctx.fillRect(-7, 6, 26.5, 2.5);
        ctx.strokeStyle = shade(sc, 0.3); ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(3, -4.5); ctx.lineTo(6, -2); ctx.moveTo(6, -4.8); ctx.lineTo(9, -2.2); ctx.stroke();
        ctx.restore();
        // pliegue de rodilla
        ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(q.kx - 3, q.ky - 4); ctx.quadraticCurveTo(q.kx + 2, q.ky - 1, q.kx + 4, q.ky + 3); ctx.stroke();
      }
    };

    const brazo = ([a1, e, tipo], lejos) => {
      const [sx, sy] = hombro;
      const ga = a1 - lean;
      const ex = sx + Math.sin(ga) * BRAZO, ey = sy + Math.cos(ga) * BRAZO;
      const b = ga + e;
      const wx = ex + Math.sin(b) * ANTEBRAZO, wy = ey + Math.cos(b) * ANTEBRAZO;
      const color = p.jacket || p.shirt;
      const manga = new Path2D();
      capsula(manga, sx, sy, 7.4, ex, ey, 5.8);
      capsula(manga, ex, ey, 5.8, wx - Math.sin(b) * 2, wy - Math.cos(b) * 2, 4.9);
      const ang = Math.atan2(Math.cos(b), Math.sin(b));
      const mm = new DOMMatrix().translate(wx, wy).rotate((ang * 180) / Math.PI);
      const mp = new Path2D(); manoPath(mp, tipo);
      const mano = new Path2D(); mano.addPath(mp, mm);
      const puno = new Path2D(); capsula(puno, wx - Math.sin(b) * 5, wy - Math.cos(b) * 5, 5.2, wx - Math.sin(b) * 1, wy - Math.cos(b) * 1, 5.0);
      const mc = lejos ? shade(color, -0.16) : color;
      grupo(ctx, [{ path: mano, fill: lejos ? shade(p.skin, -0.1) : p.skin, off: 1.6 }, { path: manga, fill: mc }, { path: puno, fill: shade(p.jacket ? p.shirt : color, 0.12), off: 1 }], lw, detalle);
      if (detalle) {
        ctx.save(); ctx.setTransform(ctx.getTransform().multiply(mm)); manoDetalle(ctx, tipo); ctx.restore();
        ctx.strokeStyle = 'rgba(0,0,0,0.22)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(ex - 4, ey - 2); ctx.quadraticCurveTo(ex, ey + 2, ex + 3, ey + 5); ctx.stroke();
      }
      return { wx, wy, ang };
    };

    brazo(brA, true);
    pierna(0, true);
    pierna(1, false);

    // ---- torso ----
    ctx.save();
    ctx.rotate(lean);
    const cadera = new Path2D(); rrectPath(cadera, -14, -8, 28, 20, 8);
    const camisa = new Path2D();
    camisa.moveTo(-14, -2); camisa.bezierCurveTo(-16, -18, -16, -34, -14, -44);
    camisa.bezierCurveTo(-12, -51, -4, -53, 2, -53); camisa.bezierCurveTo(10, -53, 15, -51, 17, -45);
    camisa.bezierCurveTo(19, -36, 18, -24, 15, -12); camisa.bezierCurveTo(14, -6, 14, -3, 14, -2); camisa.closePath();
    grupo(ctx, [{ path: cadera, fill: p.pants }, { path: camisa, fill: p.shirt, off: 4 }], lw, detalle);
    if (detalle) {
      // cinturón y hebilla
      ctx.fillStyle = shade(p.pants, -0.45); ctx.fillRect(-14, -4.5, 28.5, 5);
      ctx.fillStyle = '#c9b27a'; ctx.fillRect(9, -5, 4, 6);
      // botonadura, bolsillo y arrugas
      ctx.strokeStyle = 'rgba(0,0,0,0.22)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(13, -47); ctx.bezierCurveTo(16, -35, 15, -20, 12.5, -6); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(1, -36); ctx.lineTo(10, -36); ctx.lineTo(10, -28); ctx.lineTo(1, -28); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-10, -10); ctx.quadraticCurveTo(-4, -7, 2, -10); ctx.moveTo(-6, -15); ctx.quadraticCurveTo(0, -12, 5, -14); ctx.stroke();
    }
    if (p.jacket) {
      const chaqueta = new Path2D();
      chaqueta.moveTo(-15, 2); chaqueta.bezierCurveTo(-17, -18, -17, -36, -15, -45); chaqueta.bezierCurveTo(-12, -52, -4, -54, 2, -54);
      chaqueta.lineTo(8, -54); chaqueta.lineTo(4, -30); chaqueta.lineTo(9, -6); chaqueta.lineTo(8, 4); chaqueta.closePath();
      grupo(ctx, [{ path: chaqueta, fill: p.jacket, off: 4 }], lw, detalle);
    }
    // cuello de camisa y corbata
    ctx.fillStyle = shade(p.shirt, 0.12); ctx.strokeStyle = INK; ctx.lineWidth = lw * 0.8;
    ctx.beginPath(); ctx.moveTo(2, -52); ctx.lineTo(9, -45); ctx.lineTo(14, -52); ctx.closePath(); ctx.fill(); ctx.stroke();
    if (p.tie) {
      const sw = moving ? -0.3 * run + Math.sin(ph * 2) * 0.18 * run : 0;
      ctx.save(); ctx.translate(10.5, -49); ctx.rotate(sw);
      ctx.fillStyle = p.tie; ctx.lineWidth = lw * 0.7;
      ctx.beginPath(); ctx.moveTo(-2.6, 0); ctx.lineTo(2.6, 0); ctx.lineTo(1.8, 4); ctx.lineTo(-1.8, 4); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-1.8, 4); ctx.lineTo(1.8, 4); ctx.lineTo(3.4, 30); ctx.lineTo(0, 35); ctx.lineTo(-3.4, 30); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(-1, 6, 1.2, 24);
      ctx.restore();
    }
    // cuello
    const cuello = new Path2D(); capsula(cuello, 5, -50, 5.6, 6, -62, 5.4);
    grupo(ctx, [{ path: cuello, fill: p.skin, off: 2 }], lw, detalle);
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(1, -60, 10, 3);
    cabeza(ctx, 6, -75 + (o.headDrop || 0), o.headTilt || 0, p, mood, o.blink, lw, detalle, o.look || 0);
    ctx.restore();

    if (arms === 'box') {
      ctx.save(); ctx.translate(hombro[0] + 26, hombro[1] + 22);
      const bc = o.boxColor || '#e9d24a';
      ctx.fillStyle = bc; ctx.strokeStyle = INK; ctx.lineWidth = lw * 2;
      ctx.fillRect(-14, -30, 52, 40); ctx.strokeRect(-14, -30, 52, 40);
      ctx.fillStyle = shade(bc, -0.2); ctx.fillRect(-13, -29, 50, 9);
      ctx.fillStyle = INK; ctx.font = '900 15px "Inter Display"'; ctx.fillText('TV 4K', -4, 2);
      ctx.restore();
    }
    const mano = brazo(brB, false);
    if (arms === 'phone') {
      ctx.save(); ctx.translate(mano.wx + 4, mano.wy - 6); ctx.rotate(-0.35);
      ctx.fillStyle = '#1d1d1d'; rrect(ctx, -4.5, -12, 10, 18, 2); ctx.fill();
      ctx.fillStyle = 'rgba(150,215,255,0.95)'; ctx.fillRect(-3.2, -10.5, 7.4, 14);
      ctx.restore();
    }
    ctx.restore();
  }

  function rrectPath(path, x, y, w, h, r) {
    path.moveTo(x + r, y); path.arcTo(x + w, y, x + w, y + h, r); path.arcTo(x + w, y + h, x, y + h, r);
    path.arcTo(x, y + h, x, y, r); path.arcTo(x, y, x + w, y, r); path.closePath();
  }

  function cabeza(ctx, cx, cy, tilt, p, mood, blink, lw, detalle, look) {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(tilt);
    // pelo trasero (largo / moño)
    const pelo0 = new Path2D();
    if (p.hairStyle === 'long') { pelo0.moveTo(-12, -6); pelo0.bezierCurveTo(-17, 6, -16, 18, -10, 24); pelo0.lineTo(-1, 22); pelo0.bezierCurveTo(-3, 12, -2, 4, 0, -4); pelo0.closePath(); }
    if (p.hairStyle === 'bun') { pelo0.arc(-10, -12, 6.5, 0, Math.PI * 2); }
    if (p.hairStyle === 'long' || p.hairStyle === 'bun') grupo(ctx, [{ path: pelo0, fill: p.hair, off: 2 }], lw, detalle);
    // cara
    const cara = new Path2D();
    cara.moveTo(-11, -2);
    cara.bezierCurveTo(-12, -12, -5, -15.5, 1, -15.5);
    cara.bezierCurveTo(9, -15.5, 13.5, -9.5, 13.5, -3);
    cara.lineTo(14, 0.5);
    cara.bezierCurveTo(19, 3.5, 19, 6, 14, 6.5); // nariz
    cara.bezierCurveTo(14.5, 9, 13.5, 11, 12, 12.5);
    cara.bezierCurveTo(10.5, 14.5, 8, 15.5, 5.5, 15.2);
    cara.bezierCurveTo(1.5, 14.8, -1.5, 12, -3.5, 9);
    cara.bezierCurveTo(-7, 6, -11, 4, -11, -2);
    cara.closePath();
    const oreja = new Path2D(); oreja.ellipse(-2.5, 1, 3.3, 4.6, 0.1, 0, Math.PI * 2);
    grupo(ctx, [{ path: cara, fill: p.skin, off: 2.6 }, { path: oreja, fill: shade(p.skin, -0.04), off: 1 }], lw, detalle);
    if (detalle) {
      ctx.strokeStyle = 'rgba(42,38,34,0.55)'; ctx.lineWidth = 0.9;
      ctx.beginPath(); ctx.arc(-2.3, 1.2, 1.8, -1.2, 1.6); ctx.stroke();
      ctx.fillStyle = 'rgba(214,96,86,0.22)'; ctx.beginPath(); ctx.ellipse(7, 6, 3.4, 2.4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(42,38,34,0.6)'; ctx.beginPath(); ctx.moveTo(15.5, 5); ctx.quadraticCurveTo(14, 5.8, 13.6, 4.5); ctx.stroke(); // ala de la nariz
    }
    if (p.beard) {
      const barba = new Path2D();
      barba.moveTo(-3.5, 6); barba.bezierCurveTo(-1, 13, 3, 16.5, 7, 16); barba.bezierCurveTo(10, 15.5, 13, 13, 13.5, 10); barba.bezierCurveTo(10, 11, 6, 10.5, 4, 8); barba.closePath();
      grupo(ctx, [{ path: barba, fill: p.hair, off: 1.4 }], lw * 0.8, detalle);
    }
    // pelo superior
    const pelo = new Path2D();
    if (p.hairStyle === 'bald') {
      pelo.moveTo(-11, 0); pelo.bezierCurveTo(-12, -6, -10, -10, -6, -11); pelo.lineTo(-4, -6); pelo.bezierCurveTo(-6, -3, -6, 1, -6, 3); pelo.closePath();
    } else if (p.hairStyle === 'curly') {
      for (let k = 0; k < 8; k++) { const a = Math.PI * (0.9 + k * 0.14); pelo.moveTo(Math.cos(a) * 11.5 + 1 + 5, Math.sin(a) * 11.5 - 3); pelo.arc(Math.cos(a) * 11.5 + 1, Math.sin(a) * 11.5 - 3, 5, 0, Math.PI * 2); }
    } else {
      pelo.moveTo(-11.5, 3); pelo.bezierCurveTo(-14.5, -10, -8, -18, 1, -17.5);
      pelo.bezierCurveTo(10, -17.5, 15, -12, 14.2, -6); pelo.bezierCurveTo(11, -9.5, 7, -9, 4, -9.5);
      pelo.bezierCurveTo(1, -10, -2, -8, -4, -4); pelo.bezierCurveTo(-5, -1, -6, 2, -7, 5); pelo.closePath();
    }
    grupo(ctx, [{ path: pelo, fill: p.hair, off: 2 }], lw, detalle);
    if (detalle && p.hairStyle !== 'bald') {
      ctx.strokeStyle = shade(p.hair, 0.35); ctx.lineWidth = 1.1; ctx.beginPath();
      ctx.moveTo(-6, -13); ctx.quadraticCurveTo(0, -16, 6, -14); ctx.moveTo(-9, -8); ctx.quadraticCurveTo(-7, -12, -3, -13); ctx.stroke();
    }
    if (p.hairStyle === 'bald' && detalle) { ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.ellipse(0, -11, 5, 2, -0.2, 0, Math.PI * 2); ctx.fill(); }
    // ojo
    const ex = 8, ey = -2.5;
    ctx.lineCap = 'round';
    if (blink || mood === 'happy') {
      ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.beginPath();
      if (mood === 'happy' && !blink) ctx.arc(ex, ey + 1.5, 2.8, Math.PI * 1.12, Math.PI * 1.88); else { ctx.moveTo(ex - 2.8, ey + 0.5); ctx.quadraticCurveTo(ex, ey + 1.6, ex + 2.8, ey + 0.5); }
      ctx.stroke();
    } else {
      ctx.fillStyle = '#fbfaf4'; ctx.strokeStyle = INK; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(ex, ey, 2.7, mood === 'shout' ? 3.8 : 3.1, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#3b2a20'; ctx.beginPath(); ctx.arc(ex + 0.9 + look, ey + 0.3, 1.75, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(ex + 1.1 + look, ey + 0.3, 0.9, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ex + 0.4 + look, ey - 0.6, 0.55, 0, Math.PI * 2); ctx.fill();
      // párpado superior
      ctx.strokeStyle = INK; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.ellipse(ex, ey, 2.7, mood === 'shout' ? 3.8 : 3.1, 0, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
      if (mood === 'tired' || mood === 'sad') {
        ctx.fillStyle = p.skin; ctx.beginPath(); ctx.ellipse(ex, ey - 1.4, 3.2, 2.1, 0, Math.PI, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = INK; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(ex - 2.9, ey - 0.6); ctx.lineTo(ex + 2.9, ey - 0.3); ctx.stroke();
        ctx.strokeStyle = 'rgba(80,60,60,0.45)'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.arc(ex, ey + 2.2, 2.4, 0.3, Math.PI - 0.3); ctx.stroke();
      }
    }
    if (p.glasses) {
      ctx.strokeStyle = INK; ctx.lineWidth = 1.3;
      ctx.beginPath(); rrect(ctx, ex - 4.2, ey - 3.6, 8.4, 7, 2.4); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ex - 4.2, ey - 1); ctx.lineTo(-1.5, -1.5); ctx.stroke();
    }
    // ceja
    ctx.strokeStyle = shade(p.hair, -0.25); ctx.lineWidth = 2; ctx.beginPath();
    if (mood === 'sad' || mood === 'tired') { ctx.moveTo(4.5, -7); ctx.lineTo(11, -9); }
    else if (mood === 'shout') { ctx.moveTo(4.5, -10.5); ctx.lineTo(11, -7.5); }
    else if (mood === 'happy') { ctx.moveTo(4.5, -9); ctx.quadraticCurveTo(7.5, -11.3, 11, -9.2); }
    else { ctx.moveTo(4.5, -8.6); ctx.quadraticCurveTo(8, -9.4, 11, -8.6); }
    ctx.stroke();
    // boca
    ctx.strokeStyle = INK; ctx.lineWidth = 1.4; ctx.beginPath();
    if (mood === 'happy') { ctx.fillStyle = '#6e2626'; ctx.moveTo(6, 8.5); ctx.bezierCurveTo(8, 13.5, 12, 12.5, 13, 8); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.fillRect(7.5, 8.6, 4.8, 1.4); }
    else if (mood === 'sad') { ctx.moveTo(7, 11); ctx.quadraticCurveTo(10, 8.8, 12.8, 10.6); ctx.stroke(); }
    else if (mood === 'shout') { ctx.fillStyle = '#5a1f1f'; ctx.ellipse(10, 10, 3, 3.6, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
    else if (mood === 'tired') { ctx.moveTo(7.5, 10); ctx.lineTo(12.5, 10.3); ctx.stroke(); }
    else { ctx.moveTo(7.2, 9.6); ctx.quadraticCurveTo(10, 10.6, 12.6, 9.4); ctx.stroke(); }
    ctx.restore();
  }

  function silla(ctx, hipY, lw) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = lw * 1.6;
    ctx.fillStyle = '#34383e';
    rrect(ctx, -34, hipY - 58, 14, 66, 6); ctx.fill(); ctx.stroke();
    rrect(ctx, -28, hipY - 2, 48, 11, 5); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#5b6068'; ctx.fillRect(-6, hipY + 9, 7, 30); ctx.strokeRect(-6, hipY + 9, 7, 30);
    ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-30, hipY + 44); ctx.lineTo(28, hipY + 44); ctx.stroke();
    ctx.fillStyle = INK; for (const wx of [-30, 28]) { ctx.beginPath(); ctx.arc(wx, hipY + 47, 4, 0, 7); ctx.fill(); }
    ctx.restore();
  }

  // Persona vista de espaldas (multitudes en primer plano): cabeza, hombros, brazos y torso hasta fuera de cuadro.
  function espalda(ctx, x, y, s, p, o = {}) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    const lw = 1.4;
    const color = p.jacket || p.shirt;
    const brazos = new Path2D();
    capsula(brazos, -30, 4, 12, -38, 120, 10); capsula(brazos, 30, 4, 12, 38, 120, 10);
    const manos = new Path2D(); manos.ellipse(-39, 132, 8, 11, 0.1, 0, Math.PI * 2); manos.ellipse(39, 132, 8, 11, -0.1, 0, Math.PI * 2);
    grupo(ctx, [{ path: manos, fill: p.skin, off: 2 }, { path: brazos, fill: shade(color, -0.1) }], lw);
    const torso = new Path2D();
    torso.moveTo(-34, 340); torso.lineTo(-36, 30); torso.bezierCurveTo(-38, 2, -26, -8, 0, -9); torso.bezierCurveTo(26, -8, 38, 2, 36, 30); torso.lineTo(34, 340); torso.closePath();
    const cuello = new Path2D(); capsula(cuello, 0, -8, 9, 0, -22, 8.5);
    const cab = new Path2D(); cab.ellipse(0, -38, 17, 20, 0, 0, Math.PI * 2);
    const orejas = new Path2D(); orejas.ellipse(-17, -36, 3.6, 5.5, 0, 0, Math.PI * 2); orejas.ellipse(17, -36, 3.6, 5.5, 0, 0, Math.PI * 2);
    grupo(ctx, [{ path: torso, fill: color, off: 6 }, { path: cuello, fill: p.skin, off: 2 }, { path: orejas, fill: p.skin, off: 1 }, { path: cab, fill: p.skin, off: 2 }], lw);
    ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-12, 8); ctx.quadraticCurveTo(0, 14, 12, 8); ctx.moveTo(0, 14); ctx.lineTo(0, 300); ctx.stroke();
    const pelo = new Path2D();
    if (p.hairStyle === 'bald') pelo.ellipse(0, -28, 16, 8, 0, 0, Math.PI);
    else if (p.hairStyle === 'long') rrectPath(pelo, -18, -58, 36, 62, 15);
    else if (p.hairStyle === 'curly') for (let k = 0; k < 9; k++) { const a = Math.PI * (1 + k / 8); pelo.moveTo(Math.cos(a) * 14 + 6, Math.sin(a) * 15 - 38); pelo.arc(Math.cos(a) * 14, Math.sin(a) * 15 - 38, 6, 0, Math.PI * 2); }
    else { pelo.ellipse(0, -42, 17.5, 17, 0, 0, Math.PI * 2); }
    if (p.hairStyle === 'bun') pelo.ellipse(0, -60, 7, 7, 0, 0, Math.PI * 2);
    grupo(ctx, [{ path: pelo, fill: p.hair, off: 2 }], lw);
    ctx.restore();
  }

  // ---------- coche (vista lateral, mira a +x; origen en el suelo bajo el centro) ----------
  function coche(ctx, x, y, s, color, o = {}) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s * (o.facing || 1), s);
    const lw = 1.6 / Math.max(0.5, s) + 0.4;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    // sombra
    const g0 = ctx.createRadialGradient(0, 0, 10, 0, 0, 230);
    g0.addColorStop(0, 'rgba(0,0,0,0.38)'); g0.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g0; ctx.save(); ctx.scale(1, 0.09); ctx.beginPath(); ctx.arc(0, 0, 230, 0, 7); ctx.fill(); ctx.restore();
    const bounce = o.bounce || 0;
    ctx.translate(0, bounce);
    // hueco de las ruedas
    ctx.fillStyle = '#1b1a19';
    for (const wx of [-125, 130]) { ctx.beginPath(); ctx.arc(wx, -38 - bounce, 47, Math.PI, 0); ctx.fill(); }
    if (o.convertible) {
      // asiento y reposacabezas (detrás del conductor)
      ctx.fillStyle = '#5b4d44'; ctx.strokeStyle = INK; ctx.lineWidth = lw * 1.5;
      rrect(ctx, -104, -136, 24, 46, 9); ctx.fill(); ctx.stroke();
      // volante
      ctx.strokeStyle = '#222'; ctx.lineWidth = 6; ctx.beginPath(); ctx.ellipse(18, -118, 5, 19, -0.45, 0, 7); ctx.stroke();
      ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(22, -112); ctx.lineTo(40, -100); ctx.stroke();
      if (o.driver) persona(ctx, -58, -48, 1, o.driver, { seated: true, seatH: 42, arms: 'wheel', mood: o.mood, headTilt: o.headTilt || 0, shadow: false, lean: -0.08, blink: o.blink, look: o.look });
    }
    // carrocería
    const body = new Path2D();
    body.moveTo(-205, -40); body.lineTo(-209, -70); body.quadraticCurveTo(-206, -93, -180, -97);
    body.lineTo(-60, -99); body.lineTo(48, -98); body.quadraticCurveTo(62, -98, 72, -96);
    body.lineTo(150, -88); body.quadraticCurveTo(202, -82, 213, -62); body.lineTo(215, -42);
    body.quadraticCurveTo(215, -29, 201, -27); body.lineTo(177, -27); body.lineTo(177, -38);
    body.arc(130, -38, 47, 0, Math.PI, true); body.lineTo(83, -27); body.lineTo(-78, -27); body.lineTo(-78, -38);
    body.arc(-125, -38, 47, 0, Math.PI, true); body.lineTo(-172, -29); body.lineTo(-198, -29);
    body.quadraticCurveTo(-205, -31, -205, -40); body.closePath();
    const gb = ctx.createLinearGradient(0, -100, 0, -26);
    gb.addColorStop(0, shade(color, 0.35)); gb.addColorStop(0.18, shade(color, 0.08)); gb.addColorStop(0.6, color); gb.addColorStop(1, shade(color, -0.35));
    ctx.strokeStyle = INK; ctx.lineWidth = lw * 2; ctx.stroke(body);
    ctx.fillStyle = gb; ctx.fill(body);
    ctx.save(); ctx.clip(body);
    // reflejo especular
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.beginPath(); ctx.moveTo(-190, -82); ctx.quadraticCurveTo(0, -90, 200, -72); ctx.lineTo(200, -68); ctx.quadraticCurveTo(0, -84, -190, -77); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(-200, -60, 410, 6);
    // moldura cromada
    ctx.fillStyle = '#d9dee0'; ctx.fillRect(-200, -50, 405, 3);
    ctx.restore();
    // puertas, manilla, espejo
    ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(-40, -98); ctx.lineTo(-40, -30); ctx.moveTo(60, -97); ctx.quadraticCurveTo(66, -60, 62, -30); ctx.stroke();
    ctx.fillStyle = '#cfd4d6'; ctx.strokeStyle = INK; ctx.lineWidth = 1.2; rrect(ctx, -26, -80, 16, 4, 2); ctx.fill(); ctx.stroke();
    // faros
    const gh = ctx.createRadialGradient(205, -66, 1, 205, -66, 14); gh.addColorStop(0, '#fffbe6'); gh.addColorStop(1, '#f2d77a');
    ctx.fillStyle = gh; ctx.beginPath(); ctx.ellipse(204, -66, 8, 6, -0.3, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#c0281e'; rrect(ctx, -211, -78, 7, 16, 2); ctx.fill(); ctx.stroke();
    if (o.lights) { const gl = ctx.createRadialGradient(215, -66, 2, 215, -66, 90); gl.addColorStop(0, 'rgba(255,245,200,0.6)'); gl.addColorStop(1, 'rgba(255,245,200,0)'); ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(215, -66, 90, 0, 7); ctx.fill(); }
    if (o.convertible) {
      // parabrisas
      ctx.fillStyle = '#9aa3a6'; ctx.strokeStyle = INK; ctx.lineWidth = lw * 1.5;
      ctx.beginPath(); ctx.moveTo(56, -98); ctx.lineTo(30, -156); ctx.lineTo(37, -158); ctx.lineTo(66, -98); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(190,220,230,0.35)';
      ctx.beginPath(); ctx.moveTo(62, -98); ctx.lineTo(35, -156); ctx.lineTo(48, -156); ctx.lineTo(80, -98); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#cfd4d6'; rrect(ctx, 64, -112, 14, 9, 3); ctx.fill(); ctx.stroke();
    } else {
      // techo con ventanillas
      const cab = new Path2D();
      cab.moveTo(-150, -97); cab.lineTo(-118, -160); cab.quadraticCurveTo(-110, -168, -95, -168); cab.lineTo(30, -168); cab.quadraticCurveTo(44, -168, 52, -158); cab.lineTo(92, -97); cab.closePath();
      ctx.strokeStyle = INK; ctx.lineWidth = lw * 2; ctx.stroke(cab); ctx.fillStyle = shade(color, -0.05); ctx.fill(cab);
      const vent = new Path2D();
      vent.moveTo(-136, -101); vent.lineTo(-110, -156); vent.lineTo(-38, -156); vent.lineTo(-38, -101); vent.closePath();
      vent.moveTo(-28, -101); vent.lineTo(-28, -156); vent.lineTo(34, -156); vent.lineTo(74, -101); vent.closePath();
      ctx.fillStyle = '#7d8f96'; ctx.fill(vent); ctx.lineWidth = lw * 1.5; ctx.stroke(vent);
      ctx.save(); ctx.clip(vent);
      if (o.passenger) { const pp = typeof o.passenger === 'object' ? o.passenger : { ...PROTA, skin: typeof o.passenger === 'string' ? o.passenger : '#e0ac83', shirt: '#8e958a', hair: '#5a3a22', tie: null }; ctx.save(); ctx.translate(8, -40); persona(ctx, 0, 0, 1, pp, { seated: true, seatH: 40, arms: 'wheel', mood: o.passengerMood || 'neutral', shadow: false }); ctx.restore(); }
      ctx.fillStyle = 'rgba(220,240,245,0.35)'; ctx.beginPath(); ctx.moveTo(-120, -101); ctx.lineTo(-90, -156); ctx.lineTo(-70, -156); ctx.lineTo(-100, -101); ctx.fill();
      ctx.beginPath(); ctx.moveTo(0, -101); ctx.lineTo(20, -156); ctx.lineTo(34, -156); ctx.lineTo(14, -101); ctx.fill();
      ctx.restore();
    }
    // ruedas
    for (const wx of [-125, 130]) rueda(ctx, wx, -38 - bounce, o.wheel || 0, o.spin || 0, lw);
    ctx.restore();
  }
  function rueda(ctx, x, y, rot, spin, lw) {
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = '#1e1e1e'; ctx.strokeStyle = INK; ctx.lineWidth = lw * 2;
    ctx.beginPath(); ctx.arc(0, 0, 38, 0, 7); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#343434'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 31, 0, 7); ctx.stroke();
    const gr = ctx.createRadialGradient(-6, -8, 2, 0, 0, 25); gr.addColorStop(0, '#f4f6f7'); gr.addColorStop(0.7, '#b9bfc3'); gr.addColorStop(1, '#7c8387');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, 24, 0, 7); ctx.fill(); ctx.lineWidth = lw * 1.3; ctx.strokeStyle = INK; ctx.stroke();
    if (spin > 0.5) {
      ctx.strokeStyle = 'rgba(80,85,90,0.5)'; ctx.lineWidth = 9; ctx.beginPath(); ctx.arc(0, 0, 14, 0, 7); ctx.stroke();
    } else {
      ctx.fillStyle = '#5d6468';
      for (let k = 0; k < 5; k++) {
        ctx.save(); ctx.rotate(rot + (k * Math.PI * 2) / 5);
        ctx.beginPath(); ctx.moveTo(-3.5, -5); ctx.lineTo(3.5, -5); ctx.lineTo(5, -21); ctx.lineTo(-5, -21); ctx.closePath(); ctx.fill();
        ctx.restore();
      }
    }
    ctx.fillStyle = '#d5dadd'; ctx.beginPath(); ctx.arc(0, 0, 6, 0, 7); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.restore();
  }

  // ---------- edificios ----------
  function edificio(ctx, x, base, w, h, o = {}) {
    const r = rng(o.seed || 1);
    const color = o.color || '#b7b39b';
    const lw = o.lw || 2.2;
    const lado = o.lado ?? 18; // cara lateral (profundidad)
    ctx.save();
    ctx.lineJoin = 'round';
    // cara lateral
    if (lado > 0) {
      ctx.fillStyle = shade(color, -0.32);
      ctx.beginPath(); ctx.moveTo(x + w, base); ctx.lineTo(x + w, base - h); ctx.lineTo(x + w + lado, base - h - lado * 0.4); ctx.lineTo(x + w + lado, base); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = INK; ctx.lineWidth = lw; ctx.stroke();
    }
    const g = ctx.createLinearGradient(x, 0, x + w, 0);
    g.addColorStop(0, shade(color, 0.08)); g.addColorStop(1, shade(color, -0.1));
    ctx.fillStyle = g; ctx.fillRect(x, base - h, w, h);
    // cornisa
    ctx.fillStyle = shade(color, -0.18); ctx.fillRect(x - 6, base - h - 4, w + 12, 14);
    ctx.strokeStyle = INK; ctx.lineWidth = lw; ctx.strokeRect(x - 6, base - h - 4, w + 12, 14);
    // ventanas
    const cw = o.winW || 26, ch = o.winH || 34, gx = o.gapX || 18, gy = o.gapY || 26;
    const cols = Math.max(1, Math.floor((w - 20) / (cw + gx)));
    const off = (w - cols * (cw + gx) + gx) / 2;
    const top = base - h + 30, bottom = base - (o.bajos ?? 90);
    for (let yy = top; yy + ch < bottom; yy += ch + gy) {
      for (let c = 0; c < cols; c++) {
        const wx = x + off + c * (cw + gx);
        const lit = r() < (o.lit ?? 0.25);
        ctx.fillStyle = lit ? (o.litColor || '#f3d98b') : (o.winColor || '#6f7c80');
        ctx.fillRect(wx, yy, cw, ch);
        if (!lit) { ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.moveTo(wx, yy + ch * 0.7); ctx.lineTo(wx + cw * 0.6, yy); ctx.lineTo(wx + cw, yy); ctx.lineTo(wx, yy + ch); ctx.fill(); }
        else if (r() < 0.3) { ctx.fillStyle = 'rgba(60,40,30,0.55)'; ctx.beginPath(); ctx.arc(wx + cw / 2, yy + ch * 0.55, cw * 0.18, 0, 7); ctx.fill(); ctx.fillRect(wx + cw * 0.3, yy + ch * 0.68, cw * 0.4, ch * 0.32); }
        ctx.strokeStyle = shade(color, -0.45); ctx.lineWidth = 1.6; ctx.strokeRect(wx, yy, cw, ch);
        ctx.beginPath(); ctx.moveTo(wx + cw / 2, yy); ctx.lineTo(wx + cw / 2, yy + ch); ctx.stroke();
        ctx.fillStyle = shade(color, 0.25); ctx.fillRect(wx - 3, yy + ch, cw + 6, 4);
        if (r() < (o.ac ?? 0.06)) { ctx.fillStyle = '#c9ccc8'; ctx.fillRect(wx + 2, yy + ch + 4, cw - 4, 14); ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.strokeRect(wx + 2, yy + ch + 4, cw - 4, 14); ctx.beginPath(); for (let k = 0; k < 3; k++) { ctx.moveTo(wx + 5, yy + ch + 8 + k * 3.5); ctx.lineTo(wx + cw - 5, yy + ch + 8 + k * 3.5); } ctx.stroke(); }
      }
    }
    // escalera de incendios
    if (o.fireEscape) {
      ctx.strokeStyle = '#2f2f2f'; ctx.lineWidth = 2.4;
      const ex = x + w * 0.25, ew = w * 0.5;
      for (let yy = top + ch + 2; yy < bottom; yy += ch + gy) {
        ctx.strokeRect(ex, yy, ew, 4);
        ctx.beginPath(); for (let k = 0; k <= 8; k++) { ctx.moveTo(ex + (k * ew) / 8, yy); ctx.lineTo(ex + (k * ew) / 8, yy - 16); } ctx.moveTo(ex, yy - 16); ctx.lineTo(ex + ew, yy - 16); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ex + ew * 0.15, yy); ctx.lineTo(ex + ew * 0.85, yy + ch + gy); ctx.stroke();
      }
    }
    // azotea
    if (o.techo) {
      const tx = x + w * (0.2 + r() * 0.5);
      if (r() < 0.5) {
        ctx.fillStyle = '#8a6a48'; ctx.strokeStyle = INK; ctx.lineWidth = lw;
        ctx.fillRect(tx, base - h - 60, 40, 44); ctx.strokeRect(tx, base - h - 60, 40, 44);
        ctx.beginPath(); ctx.moveTo(tx - 4, base - h - 60); ctx.lineTo(tx + 20, base - h - 80); ctx.lineTo(tx + 44, base - h - 60); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(tx + 6, base - h - 16); ctx.lineTo(tx + 2, base - h); ctx.moveTo(tx + 34, base - h - 16); ctx.lineTo(tx + 38, base - h); ctx.stroke();
      } else {
        ctx.strokeStyle = '#3a3a3a'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(tx, base - h - 4); ctx.lineTo(tx, base - h - 90); ctx.moveTo(tx - 14, base - h - 70); ctx.lineTo(tx + 14, base - h - 70); ctx.moveTo(tx - 9, base - h - 50); ctx.lineTo(tx + 9, base - h - 50); ctx.stroke();
      }
    }
    ctx.strokeStyle = INK; ctx.lineWidth = lw; ctx.strokeRect(x, base - h, w, h);
    ctx.restore();
  }

  // Cartel publicitario con marco, focos y texto.
  function cartel(ctx, x, y, w, h, bg, fg, txt, sub, o = {}) {
    ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.rotate(o.rot || 0);
    const lw = o.lw || 3;
    if (o.patas) { ctx.strokeStyle = '#3a3a3a'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-w * 0.3, h / 2); ctx.lineTo(-w * 0.3, h / 2 + o.patas); ctx.moveTo(w * 0.3, h / 2); ctx.lineTo(w * 0.3, h / 2 + o.patas); ctx.stroke(); }
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(-w / 2 + 6, -h / 2 + 8, w, h);
    const g = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
    g.addColorStop(0, shade(bg, 0.12)); g.addColorStop(1, shade(bg, -0.12));
    ctx.fillStyle = g; ctx.strokeStyle = INK; ctx.lineWidth = lw;
    ctx.fillRect(-w / 2, -h / 2, w, h); ctx.strokeRect(-w / 2, -h / 2, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 2; ctx.strokeRect(-w / 2 + 6, -h / 2 + 6, w - 12, h - 12);
    ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    let fs = h * (sub ? 0.36 : 0.5);
    const font = o.font || '900 {s}px "Inter Display"';
    ctx.font = font.replace('{s}', fs);
    while (ctx.measureText(txt).width > w * 0.86 && fs > 6) { fs -= 1; ctx.font = font.replace('{s}', fs); }
    ctx.shadowColor = 'rgba(0,0,0,0.25)'; ctx.shadowOffsetY = 3;
    ctx.fillText(txt, 0, sub ? -h * 0.1 : 0);
    if (sub) { let ss = h * 0.13; ctx.font = `600 ${ss}px "Inter"`; while (ctx.measureText(sub).width > w * 0.86 && ss > 5) { ss -= 1; ctx.font = `600 ${ss}px "Inter"`; } ctx.fillText(sub, 0, h * 0.27); }
    ctx.shadowColor = 'transparent';
    if (o.focos) {
      for (let k = 0; k < o.focos; k++) {
        const fx = -w / 2 + ((k + 0.5) * w) / o.focos;
        ctx.strokeStyle = '#333'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(fx, -h / 2); ctx.lineTo(fx, -h / 2 - 16); ctx.lineTo(fx + 10, -h / 2 - 22); ctx.stroke();
        const gl = ctx.createLinearGradient(0, -h / 2 - 20, 0, h / 2); gl.addColorStop(0, 'rgba(255,240,190,0.35)'); gl.addColorStop(1, 'rgba(255,240,190,0)');
        ctx.fillStyle = gl; ctx.beginPath(); ctx.moveTo(fx + 8, -h / 2 - 20); ctx.lineTo(fx - 50, h / 2); ctx.lineTo(fx + 70, h / 2); ctx.closePath(); ctx.fill();
      }
    }
    ctx.restore();
  }

  function nubes(ctx, t, seed, n, y0, y1, color, vel = 8) {
    const r = rng(seed);
    for (let i = 0; i < n; i++) {
      const bx = r() * 1400 - 160, by = lerp(y0, y1, r()), sc = 0.6 + r() * 1.2;
      const xx = ((bx + t * vel * sc) % 1500 + 1500) % 1500 - 200;
      ctx.fillStyle = color;
      ctx.beginPath();
      for (let k = 0; k < 6; k++) { const ox = (k - 2.5) * 34 * sc, oy = -Math.sin((k / 5) * Math.PI) * 30 * sc; ctx.moveTo(xx + ox + 40 * sc, by + oy); ctx.arc(xx + ox, by + oy, (30 + 14 * Math.sin(k * 2.1)) * sc, 0, 7); }
      ctx.fill();
    }
  }

  function farola(ctx, x, base, h, on) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.fillStyle = '#3d4246';
    ctx.fillRect(x - 5, base - h, 10, h); ctx.strokeRect(x - 5, base - h, 10, h);
    ctx.beginPath(); ctx.moveTo(x, base - h); ctx.quadraticCurveTo(x, base - h - 30, x + 40, base - h - 30); ctx.lineWidth = 8; ctx.strokeStyle = '#3d4246'; ctx.stroke();
    ctx.fillStyle = '#2f3336'; ctx.beginPath(); ctx.moveTo(x + 22, base - h - 34); ctx.lineTo(x + 64, base - h - 34); ctx.lineTo(x + 56, base - h - 20); ctx.lineTo(x + 30, base - h - 20); ctx.closePath(); ctx.fill();
    if (on) { const g = ctx.createRadialGradient(x + 43, base - h - 18, 2, x + 43, base - h - 18, 160); g.addColorStop(0, 'rgba(255,236,180,0.55)'); g.addColorStop(1, 'rgba(255,236,180,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x + 43, base - h - 18, 160, 0, 7); ctx.fill(); }
    ctx.restore();
  }

  // ---------- postproducción ----------
  let grano = null, bloomC = null;
  function post(ctx, W, H, t, o = {}) {
    if (!grano) {
      grano = document.createElement('canvas'); grano.width = 512; grano.height = 512;
      const g = grano.getContext('2d'), img = g.createImageData(512, 512), r = rng(99);
      for (let i = 0; i < img.data.length; i += 4) { const v = 128 + (r() - 0.5) * 90; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
      g.putImageData(img, 0, 0);
      bloomC = document.createElement('canvas'); bloomC.width = W / 6; bloomC.height = H / 6;
    }
    // bloom suave
    const b = bloomC.getContext('2d');
    b.filter = 'blur(4px) brightness(1.15)'; b.clearRect(0, 0, bloomC.width, bloomC.height);
    b.drawImage(ctx.canvas, 0, 0, bloomC.width, bloomC.height); b.filter = 'none';
    ctx.save();
    ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = o.bloom ?? 0.16;
    ctx.drawImage(bloomC, 0, 0, W, H);
    // gradación de color
    ctx.globalCompositeOperation = 'soft-light'; ctx.globalAlpha = 0.35;
    const cg = ctx.createLinearGradient(0, 0, 0, H); cg.addColorStop(0, o.top || '#ffe2b0'); cg.addColorStop(1, o.bottom || '#3d5a66');
    ctx.fillStyle = cg; ctx.fillRect(0, 0, W, H);
    // grano animado
    ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.13;
    const ox = Math.floor(hash(Math.floor(t * 24)) * 512), oy = Math.floor(hash(Math.floor(t * 24) + 7) * 512);
    for (let yy = -oy; yy < H; yy += 512) for (let xx = -ox; xx < W; xx += 512) ctx.drawImage(grano, xx, yy);
    // viñeta
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.72);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.42)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  window.LIB = {
    INK, clamp, lerp, inv, ease, easeOut, easeIn, easeInOutBack, rng, pick, hash, shade, mix, rrect,
    nuevaPersona, PROTA, persona, espalda, coche, edificio, cartel, nubes, farola, post, grupo, capsula,
  };
})();
