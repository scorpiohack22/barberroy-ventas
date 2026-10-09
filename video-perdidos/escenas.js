// "Perdidos" — cortometraje vertical (1080×1920) de 60 s hecho 100% con código.
// Cartoon en blanco y negro estilo años 30. Inspirado en "Are You Lost In The World Like Me?" de Steve Cutts.
(function () {
  const {
    INK, PAPEL, clamp, lerp, inv, ease, easeOut, easeIn, backOut, rng, pick, hash, rrect,
    enColor, nuevoToon, NINO, toon, emoji, fachada, farola, cartel, pelicula, iris,
  } = LIB;
  const W = 1080, H = 1920, DURACION = 60, BEAT = 0.5;
  const golpe = t => 0.5 - 0.5 * Math.cos((2 * Math.PI * t) / BEAT);
  const PANTALLAS = ['#59c7ff', '#ff6fb5', '#7dff8a', '#ffd84d', '#b48cff', '#ff8a4d'];
  let IRIS = null; // {cx, cy, r} aplicado después de la capa de color

  function fondo(ctx, top, bottom) {
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, top); g.addColorStop(1, bottom);
    ctx.fillStyle = g; ctx.fillRect(-100, -100, W + 200, H + 200);
  }
  function globo(ctx, x, y, w, h, txt, tx, ty, fs = 54) {
    ctx.save();
    ctx.fillStyle = '#fbf8f0'; ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.ellipse(x, y, w / 2, h / 2, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - w * 0.12, y + h * 0.4); ctx.quadraticCurveTo(x - w * 0.05, y + h * 0.6, tx, ty); ctx.quadraticCurveTo(x + w * 0.02, y + h * 0.55, x + w * 0.1, y + h * 0.42); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fbf8f0'; ctx.beginPath(); ctx.ellipse(x, y, w / 2 - 3, h / 2 - 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = INK; ctx.font = `900 ${fs}px "Liberation Serif"`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(txt, x, y + 2);
    ctx.restore();
  }
  function onomatopeya(ctx, x, y, txt, s = 1, rot = -0.1) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
    ctx.font = '900 90px "Liberation Serif"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round'; ctx.strokeStyle = INK; ctx.lineWidth = 16; ctx.strokeText(txt, 0, 0);
    ctx.fillStyle = '#fbf8f0'; ctx.fillText(txt, 0, 0);
    ctx.restore();
  }
  function estrellas(ctx, x, y, t, r = 60) {
    for (let k = 0; k < 4; k++) {
      const a = t * 7 + (k * Math.PI * 2) / 4, sx = x + Math.cos(a) * r, sy = y + Math.sin(a) * r * 0.35;
      enColor(ctx, c => {
        c.save(); c.translate(sx, sy); c.rotate(a);
        c.fillStyle = '#ffd84d'; c.strokeStyle = INK; c.lineWidth = 3;
        c.beginPath(); for (let i = 0; i < 10; i++) { const rr = i % 2 ? 7 : 17, aa = (i * Math.PI) / 5; c.lineTo(Math.cos(aa) * rr, Math.sin(aa) * rr); } c.closePath(); c.fill(); c.stroke();
        c.restore();
      });
    }
  }
  function nubes(ctx, t, seed, n, y0, y1) {
    const r = rng(seed);
    for (let i = 0; i < n; i++) {
      const bx = r() * 1300, by = lerp(y0, y1, r()), sc = 0.7 + r() * 0.9;
      const x = ((bx + t * 12 * sc) % 1500) - 200;
      ctx.fillStyle = '#f4f0e6'; ctx.strokeStyle = INK; ctx.lineWidth = 4;
      ctx.beginPath();
      for (let k = 0; k < 5; k++) { const ox = (k - 2) * 46 * sc, oy = -Math.sin((k / 4) * Math.PI) * 34 * sc, rr = (36 + 10 * Math.sin(k * 2)) * sc; ctx.moveTo(x + ox + rr, by + oy); ctx.arc(x + ox, by + oy, rr, 0, 7); }
      ctx.stroke(); ctx.fill();
    }
  }
  function acera(ctx, y0) {
    ctx.fillStyle = '#9b968c'; ctx.fillRect(-100, y0, W + 200, H - y0 + 100);
    ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-100, y0); ctx.lineTo(W + 100, y0); ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 3;
    for (let y = y0 + 120, k = 0; y < H; y += 140 + k * 30, k++) { ctx.beginPath(); ctx.moveTo(-100, y); ctx.lineTo(W + 100, y); ctx.stroke(); }
    for (let x = -60; x < W + 100; x += 220) { ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x - 80, H); ctx.stroke(); }
  }
  function marco(ctx, x, y, w, h) {
    ctx.save();
    ctx.fillStyle = '#e9e2d0'; ctx.strokeStyle = INK; ctx.lineWidth = 10;
    rrect(ctx, x, y, w, h, 40); ctx.fill(); ctx.stroke();
    ctx.lineWidth = 4; rrect(ctx, x + 24, y + 24, w - 48, h - 48, 28); ctx.stroke();
    for (const [cx, cy] of [[x + 24, y + 24], [x + w - 24, y + 24], [x + 24, y + h - 24], [x + w - 24, y + h - 24]]) {
      ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(cx, cy, 22, 0, 7); ctx.fill();
      ctx.fillStyle = '#e9e2d0'; ctx.beginPath(); ctx.arc(cx, cy, 10, 0, 7); ctx.fill();
    }
    // filigrana
    ctx.strokeStyle = INK; ctx.lineWidth = 4;
    for (const sy of [y + 70, y + h - 70]) { ctx.beginPath(); ctx.moveTo(x + w / 2 - 220, sy); ctx.bezierCurveTo(x + w / 2 - 120, sy - 30, x + w / 2 - 60, sy + 30, x + w / 2, sy); ctx.bezierCurveTo(x + w / 2 + 60, sy - 30, x + w / 2 + 120, sy + 30, x + w / 2 + 220, sy); ctx.stroke(); }
    ctx.restore();
  }

  // ======================= 0–4 s: cartela de título =======================
  function escena0(ctx, t) {
    fondo(ctx, '#3a3734', '#151312');
    ctx.save();
    const rays = t * 0.15;
    ctx.translate(540, 900);
    for (let i = 0; i < 18; i++) { ctx.rotate(Math.PI / 9); ctx.fillStyle = i % 2 ? 'rgba(255,250,235,0.05)' : 'rgba(0,0,0,0.05)'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(1600, -140 + rays); ctx.lineTo(1600, 140); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    const sc = lerp(0.94, 1, easeOut(inv(0, 1.2, t)));
    ctx.save(); ctx.translate(540, 900); ctx.scale(sc, sc); ctx.translate(-540, -900);
    marco(ctx, 80, 360, 920, 1100);
    ctx.textAlign = 'center'; ctx.fillStyle = INK;
    ctx.font = 'italic 46px "Liberation Serif"'; ctx.fillText('un cortometraje de bolsillo', 540, 560);
    ctx.font = '900 168px "Liberation Serif"'; ctx.lineJoin = 'round';
    ctx.strokeStyle = '#fbf8f0'; ctx.lineWidth = 16; ctx.strokeText('PERDIDOS', 548, 768);
    ctx.fillStyle = '#4a4743'; ctx.fillText('PERDIDOS', 554, 774); ctx.fillStyle = INK; ctx.fillText('PERDIDOS', 540, 762);
    ctx.font = 'italic 44px "Liberation Serif"'; ctx.fillText('¿Estás perdido en el mundo', 540, 870); ctx.fillText('como yo?', 540, 926);
    toon(ctx, 540, 1290, 2.0, NINO, { mood: 'feliz', arms: 'wave', t, bob: golpe(t), shadow: true });
    ctx.font = '700 34px "Liberation Serif"'; ctx.fillText('UN CORTO HECHO CON CÓDIGO', 540, 1350);
    ctx.restore(); ctx.textAlign = 'left';
    if (t > 3.3) IRIS = { cx: 540, cy: 1180, r: lerp(1300, 0, easeIn(inv(3.3, 4, t))) };
  }

  // ======================= 4–13 s: la calle de los zombis del móvil =======================
  const transeuntes = (() => {
    const r = rng(11), o = [];
    for (let i = 0; i < 10; i++) {
      const banda = [1360, 1480, 1600, 1740][i % 4];
      o.push({ p: nuevoToon(r), y: banda + r() * 30, x0: r() * 1500, v: 90 + r() * 50, dir: r() < 0.5 ? 1 : -1, ph: r() * 6, scr: pick(r, PANTALLAS) });
    }
    return o;
  })();
  const GOLPEADO = nuevoToon(rng(3), 'gordo'), CAIDO = nuevoToon(rng(4), 'alto'), GRABA = nuevoToon(rng(7), 'dama');
  const POSTE = 800, ALCANTARILLA = { x: 330, y: 1640 };
  function escena1(ctx, t) {
    const lt = t - 4;
    fondo(ctx, '#d8d4cc', '#bdb8ae');
    nubes(ctx, t, 2, 4, 120, 420);
    fachada(ctx, -40, 1260, 420, 1000, { color: '#a9a49b', seed: 3, ladrillo: true });
    fachada(ctx, 370, 1260, 360, 1160, { color: '#8e8a82', seed: 4 });
    fachada(ctx, 720, 1260, 420, 950, { color: '#b8b3a9', seed: 5, ladrillo: true });
    cartel(ctx, 70, 1010, 260, 190, '¡LEVANTA', 'la vista!', { rot: -0.04 });
    cartel(ctx, 420, 1070, 260, 120, 'CAFÉ', 'desde 1931');
    cartel(ctx, 780, 960, 240, 240, 'ESTOS', 'sistemas fallan', { rot: 0.03 });
    acera(ctx, 1260);
    // alcantarilla abierta
    ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(ALCANTARILLA.x, ALCANTARILLA.y, 92, 26, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#5a5651'; ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(ALCANTARILLA.x + 150, ALCANTARILLA.y + 6, 90, 24, 0.05, 0, 7); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(ALCANTARILLA.x + 150, ALCANTARILLA.y + 6, 60, 15, 0.05, 0, 7); ctx.stroke();
    const lista = [];
    lista.push({ y: 1500, draw: () => farola(ctx, POSTE, 1500, 520) });
    for (const q of transeuntes) {
      let x = ((q.x0 + q.dir * q.v * lt) % 1500 + 1500) % 1500 - 210;
      lista.push({ y: q.y, draw: () => toon(ctx, x, q.y, 1.45 + (q.y - 1360) / 900, q.p, { run: 0.45, phase: q.ph + t * 6.3, facing: q.dir, arms: 'phone', mood: 'hipno', screen: q.scr, headTilt: 0.3, lookY: 1 }) });
    }
    // gag 1: choca contra la farola dos veces
    {
      let x, rebote = 0, mood = 'hipno', arms = 'phone', dir = 1, run = 0.45;
      if (lt < 3) x = POSTE - 70 - (3 - lt) * 140;
      else if (lt < 4) { const k = lt - 3; rebote = Math.sin(Math.min(k, 0.35) / 0.35 * Math.PI) * 40; x = POSTE - 70 - rebote - (k > 0.5 ? (k - 0.5) * 0 : 0); if (k > 0.5) x = POSTE - 110 + (k - 0.5) * 80; run = k < 0.5 ? 0 : 0.45; mood = k < 0.6 ? 'susto' : 'hipno'; }
      else if (lt < 4.6) { const k = lt - 4; rebote = Math.sin(Math.min(k, 0.35) / 0.35 * Math.PI) * 50; x = POSTE - 70 - rebote; run = 0; mood = 'susto'; }
      else { x = POSTE - 75 - (lt - 4.6) * 150; dir = -1; mood = 'hipno'; }
      const golpeado = (lt > 3 && lt < 3.6) || (lt > 4 && lt < 5.5);
      lista.push({ y: 1499, draw: () => { toon(ctx, x, 1499, 1.75, GOLPEADO, { run, phase: t * 6.3, facing: dir, arms, mood, screen: '#ffd84d', headTilt: mood === 'susto' ? -0.2 : 0.3, lookY: 1 }); if (golpeado) estrellas(ctx, x + 10, 1499 - 250, t); } });
      if (lt > 3 && lt < 3.5) lista.push({ y: 3000, draw: () => onomatopeya(ctx, POSTE - 40, 1080, '¡BONK!', lerp(1.4, 1, inv(3, 3.15, lt))) });
      if (lt > 4 && lt < 4.5) lista.push({ y: 3000, draw: () => onomatopeya(ctx, POSTE + 20, 1060, '¡BONK!', lerp(1.6, 1.1, inv(4, 4.15, lt)), 0.12) });
    }
    // gag 2: cae por la alcantarilla
    {
      const llega = 5.0;
      if (lt < llega + 0.6) {
        let x = ALCANTARILLA.x - (llega - lt) * 130, y = 1640, caida = 0;
        if (lt > llega) { x = ALCANTARILLA.x; caida = easeIn(inv(llega, llega + 0.45, lt)) * 420; }
        lista.push({ y: 1640, draw: () => {
          ctx.save();
          if (caida > 0) { ctx.beginPath(); ctx.rect(-200, -200, W + 400, 1640 + 200); ctx.rect(ALCANTARILLA.x - 92, 1640, 184, 400); ctx.clip(); }
          toon(ctx, x, y + caida, 1.8, CAIDO, { run: caida > 0 ? 0 : 0.45, phase: t * 6.3, arms: caida > 0 ? 'up' : 'phone', mood: caida > 0 ? 'grito' : 'hipno', screen: '#ff6fb5', headTilt: caida > 0 ? -0.15 : 0.3, lookY: 1, t, shadow: caida === 0 });
          ctx.restore();
        } });
      }
      if (lt > llega + 0.1 && lt < llega + 1.4) {
        const k = inv(llega + 0.1, llega + 1.4, lt), py = 1500 - Math.sin(k * Math.PI) * 420 + k * 160;
        lista.push({ y: 3000, draw: () => LIB.telefono(ctx, ALCANTARILLA.x + 20, py, k * 12, '#ff6fb5') });
      }
      if (lt > llega + 0.5 && lt < llega + 1.3) lista.push({ y: 3000, draw: () => onomatopeya(ctx, ALCANTARILLA.x, 1500, '¡PLOF!', lerp(1.5, 1, inv(llega + 0.5, llega + 0.65, lt))) });
      // la señora que lo graba y sigue
      if (lt > 6.0) {
        const parar = 6.6, seguir = 7.6;
        let x = lt < parar ? ALCANTARILLA.x - 260 + (lt - 6.0) * 260 * 0.6 : lt < seguir ? ALCANTARILLA.x - 104 : ALCANTARILLA.x - 104 + (lt - seguir) * 140;
        const graba = lt > parar && lt < seguir;
        lista.push({ y: 1600, draw: () => toon(ctx, x, 1600, 1.7, GRABA, { run: graba ? 0 : 0.45, phase: t * 6.3, arms: graba ? 'film' : 'phone', mood: graba ? 'feliz' : 'hipno', screen: '#7dff8a', flash: graba && (lt - parar) % 0.35 < 0.08 ? 0.9 : 0, headTilt: graba ? 0.15 : 0.3, lookY: 1 }) });
      }
    }
    // el niño (el único sin móvil)
    const susto = (lt > 3 && lt < 3.8) || (lt > 5 && lt < 7.5);
    const señala = lt > 5.3 && lt < 6.8;
    lista.push({ y: 1880, draw: () => toon(ctx, 620, 1880, 2.5, NINO, { mood: susto ? 'susto' : lt > 7.5 ? 'triste' : 'neutral', arms: señala ? 'point' : 'down', facing: señala || (lt > 2.8 && lt < 4.2) ? 1 : -1, lookX: Math.sin(lt * 1.4) * 0.8, bob: golpe(t) * 0.5 }) });
    lista.sort((a, b) => a.y - b.y).forEach(d => d.draw());
    if (lt < 0.8) IRIS = { cx: 620, cy: 1700, r: lerp(0, 1400, easeOut(inv(0, 0.8, lt))) };
  }

  // ======================= 13–21 s: selfis y likes =======================
  const fotografos = (() => { const r = rng(21), o = []; for (let i = 0; i < 5; i++) o.push({ p: nuevoToon(r), x: 80 + i * 230 + r() * 40, y: 1240 + (i % 2) * 70, s: 1.4, scr: pick(r, PANTALLAS), f: r() < 0.5 ? 1 : -1, arms: pick(r, ['selfie', 'film', 'phone']) }); return o; })();
  const SELFI = { ...nuevoToon(rng(23), 'dama'), cuerpo: '#ffffff', pelo: 'rizos', rayas: false };
  function escena2(ctx, t) {
    const lt = t - 13;
    fondo(ctx, '#ddd9d0', '#c2bdb3');
    nubes(ctx, t, 6, 4, 150, 520);
    // estatua al fondo
    ctx.fillStyle = '#8e8a82'; ctx.strokeStyle = INK; ctx.lineWidth = 5;
    ctx.fillRect(400, 760, 280, 420); ctx.strokeRect(400, 760, 280, 420); ctx.fillRect(370, 1150, 340, 60); ctx.strokeRect(370, 1150, 340, 60);
    ctx.save(); ctx.translate(540, 760); ctx.fillStyle = '#a9a49b';
    ctx.beginPath(); ctx.ellipse(0, -260, 70, 80, 0, 0, 7); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-90, -170); ctx.lineTo(90, -170); ctx.lineTo(70, 0); ctx.lineTo(-70, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.lineWidth = 30; ctx.lineCap = 'round'; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(70, -150); ctx.lineTo(160, -330); ctx.stroke(); ctx.strokeStyle = '#a9a49b'; ctx.lineWidth = 22; ctx.stroke();
    ctx.restore();
    ctx.fillStyle = INK; ctx.font = '900 40px "Liberation Serif"'; ctx.textAlign = 'center'; ctx.fillText('AL HÉROE DESCONOCIDO', 540, 1000); ctx.textAlign = 'left';
    acera(ctx, 1210);
    for (const f of fotografos) toon(ctx, f.x, f.y, f.s, f.p, { arms: f.arms, mood: f.arms === 'selfie' ? 'besito' : 'hipno', screen: f.scr, facing: f.f, bob: golpe(t + f.x) * 0.4, flash: f.arms === 'film' && hash(Math.floor(t * 6) + f.x) < 0.15 ? 0.8 : 0, lookY: f.arms === 'phone' ? 1 : 0, headTilt: f.arms === 'phone' ? 0.3 : 0 });
    // la chica del selfi
    const sinLikes = lt > 4.4;
    const llora = lt > 5.6;
    const s = 3.0, x = 470, y = 1720;
    toon(ctx, x, y, s, SELFI, { arms: llora ? 'cry' : sinLikes ? 'phone' : 'selfie', mood: llora ? 'triste' : sinLikes ? 'cansado' : 'besito', screen: '#ff6fb5', bob: llora ? 0 : golpe(t) * 0.6, lagrima: llora ? lt * 1.3 : 0, lookY: sinLikes ? 1 : 0, headTilt: sinLikes ? 0.25 : -0.05 });
    // emojis y corazones que salen del móvil
    const mx = x + 82 * s, my = y - 170 * s;
    for (let i = 0; i < 24; i++) {
      const t0 = 0.3 + i * 0.17; if (lt < t0 || t0 > 4.3) continue;
      const k = (lt - t0) / 2.2; if (k > 1) continue;
      const tipo = ['corazon', 'like', 'risa', 'enamorado', 'feliz'][i % 5];
      emoji(ctx, mx + Math.sin(k * 6 + i) * 60 + (hash(i) - 0.5) * 200, my - k * 700, 34 + hash(i + 3) * 18, tipo, Math.sin(k * 5 + i) * 0.3);
    }
    // contador de likes
    const likes = Math.floor(lerp(0, 1024, easeOut(inv(0.3, 4.2, lt))));
    enColor(ctx, c => {
      c.save(); c.translate(mx - 40, my - 120);
      c.fillStyle = '#fbf8f0'; c.strokeStyle = INK; c.lineWidth = 5; rrect(c, -150, -55, 300, 110, 55); c.fill(); c.stroke();
      c.fillStyle = sinLikes ? '#8c8680' : '#ff3b5c'; c.font = '900 64px "Liberation Serif"'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(`♥ ${likes.toLocaleString('es')}`, 0, 4);
      c.restore();
    });
    if (lt > 4.6 && lt < 5.8) { emoji(ctx, mx - 40, my - 260, 60, 'triste'); }
    if (lt > 6.4) toon(ctx, lerp(-150, 1250, inv(6.4, 8, lt)), 1880, 2.4, NINO, { run: 0.45, phase: t * 6.3, mood: 'triste', lookX: -0.7 });
  }

  // ======================= 21–29 s: la cafetería =======================
  const PAREJA = [nuevoToon(rng(31), 'adulto'), nuevoToon(rng(32), 'dama')];
  const MAMA = { ...nuevoToon(rng(33), 'dama'), pelo: 'moño' }, PAPA = { ...nuevoToon(rng(34), 'adulto'), pelo: 'raya', bigote: true };
  const CAMARERO = { ...nuevoToon(rng(35), 'alto'), cuerpo: '#ffffff', pelo: 'tupe' };
  function silla(ctx, x, y, f) {
    ctx.save(); ctx.translate(x, y); ctx.scale(f, 1);
    ctx.strokeStyle = INK; ctx.lineWidth = 9; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-40, -230); ctx.lineTo(-40, 0); ctx.moveTo(-40, -90); ctx.lineTo(50, -90); ctx.lineTo(50, 0); ctx.stroke();
    ctx.restore();
  }
  function mesa(ctx, x, y, w) {
    ctx.fillStyle = '#fbf8f0'; ctx.strokeStyle = INK; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(x - w / 2, y); ctx.lineTo(x + w / 2, y); ctx.lineTo(x + w / 2 + 20, y + 120); ctx.quadraticCurveTo(x, y + 140, x - w / 2 - 20, y + 120); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 3; for (let k = 1; k < 6; k++) { ctx.beginPath(); ctx.moveTo(x - w / 2 + (k * w) / 6, y + 4); ctx.lineTo(x - w / 2 + (k * w) / 6 + (k - 3) * 6, y + 124); ctx.stroke(); }
    ctx.fillStyle = INK; ctx.fillRect(x - 10, y + 130, 20, 160); ctx.fillRect(x - 70, y + 280, 140, 16);
  }
  function escena3(ctx, t) {
    const lt = t - 21;
    // papel pintado
    ctx.fillStyle = '#c9c4b9'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 3;
    for (let y = 0; y < H; y += 90) for (let x = (y / 90) % 2 ? 45 : 0; x < W; x += 90) { ctx.beginPath(); ctx.moveTo(x, y - 30); ctx.lineTo(x + 25, y); ctx.lineTo(x, y + 30); ctx.lineTo(x - 25, y); ctx.closePath(); ctx.stroke(); }
    // ventana con cortinas y letrero
    ctx.fillStyle = '#e8e2d2'; ctx.strokeStyle = INK; ctx.lineWidth = 8; rrect(ctx, 140, 120, 800, 420, 30); ctx.fill(); ctx.stroke();
    nubes(ctx, t, 9, 3, 200, 420);
    ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(540, 120); ctx.lineTo(540, 540); ctx.moveTo(140, 330); ctx.lineTo(940, 330); ctx.stroke();
    for (const sx of [-1, 1]) { ctx.fillStyle = '#77736c'; ctx.beginPath(); ctx.moveTo(540 + sx * 420, 90); ctx.quadraticCurveTo(540 + sx * 300, 330, 540 + sx * 380, 580); ctx.lineTo(540 + sx * 470, 580); ctx.lineTo(540 + sx * 470, 90); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = INK; ctx.fillRect(110, 70, 860, 26);
    ctx.font = 'italic 900 80px "Liberation Serif"'; ctx.textAlign = 'center'; ctx.fillStyle = '#fbf8f0'; ctx.strokeStyle = INK; ctx.lineWidth = 10; ctx.strokeText('Cafetería Moderna', 540, 660); ctx.fillText('Cafetería Moderna', 540, 660); ctx.textAlign = 'left';
    // suelo de damero
    for (let y = 1500, k = 0; y < H; y += 70, k++) for (let x = -70 + (k % 2) * 70; x < W; x += 140) { ctx.fillStyle = '#3a3734'; ctx.fillRect(x, y, 70, 70); ctx.fillStyle = '#e8e2d2'; ctx.fillRect(x + 70, y, 70, 70); }
    // mesa de arriba: la pareja
    const yA = 1100;
    silla(ctx, 250, yA + 160, 1); silla(ctx, 830, yA + 160, -1);
    toon(ctx, 300, yA + 150, 1.7, PAREJA[0], { sentado: true, alturaAsiento: 60, arms: 'phone', mood: 'hipno', screen: '#59c7ff', headTilt: 0.3, lookY: 1, shadow: false });
    toon(ctx, 780, yA + 150, 1.7, PAREJA[1], { sentado: true, alturaAsiento: 60, arms: 'phone', mood: 'hipno', screen: '#ff6fb5', facing: -1, headTilt: 0.3, lookY: 1, shadow: false });
    mesa(ctx, 540, yA + 30, 420);
    // vela y rosa en color
    ctx.fillStyle = '#fbf8f0'; ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.fillRect(520, yA - 60, 26, 90); ctx.strokeRect(520, yA - 60, 26, 90);
    enColor(ctx, c => { const fl = 1 + Math.sin(t * 20) * 0.1; c.fillStyle = '#ffb02e'; c.shadowColor = '#ffb02e'; c.shadowBlur = 25; c.beginPath(); c.ellipse(533, yA - 80, 9 * fl, 18 * fl, 0, 0, 7); c.fill(); c.shadowBlur = 0; c.fillStyle = '#e8263f'; c.beginPath(); c.arc(460, yA - 5, 18, 0, 7); c.fill(); c.strokeStyle = '#2f8f3a'; c.lineWidth = 5; c.beginPath(); c.moveTo(460, yA + 10); c.lineTo(470, yA + 28); c.stroke(); });
    // mesa de abajo: la familia
    const yB = 1640;
    silla(ctx, 180, yB + 160, 1); silla(ctx, 900, yB + 160, -1);
    toon(ctx, 230, yB + 150, 1.7, MAMA, { sentado: true, alturaAsiento: 60, arms: 'phone', mood: 'hipno', screen: '#ffd84d', headTilt: 0.3, lookY: 1, shadow: false });
    toon(ctx, 860, yB + 150, 1.7, PAPA, { sentado: true, alturaAsiento: 60, arms: 'phone', mood: 'hipno', screen: '#7dff8a', facing: -1, headTilt: 0.3, lookY: 1, shadow: false });
    const llama = lt > 1.4 && lt < 5.2, triste = lt > 5.4;
    silla(ctx, 600, yB + 170, -1);
    toon(ctx, 560, yB + 170, 1.9, NINO, { sentado: true, alturaAsiento: 70, facing: -1, arms: llama ? 'wave' : 'down', t, mood: triste ? 'triste' : 'feliz', lookX: 0.6, headTilt: triste ? 0.3 : 0, shadow: false });
    mesa(ctx, 540, yB + 50, 520);
    if (llama) globo(ctx, 640, yB - 330, 380, 170, '¡Mamá, mira!', 590, yB - 200, 58);
    // camarero con la cafetera
    if (lt > 2.8 && lt < 6.2) {
      const x = lt < 3.8 ? lerp(1250, 700, ease(inv(2.8, 3.8, lt))) : lt < 5 ? 700 : lerp(700, 1300, ease(inv(5, 6.2, lt)));
      toon(ctx, x, yA + 330, 1.9, CAMARERO, { run: lt < 3.8 || lt > 5 ? 0.45 : 0, phase: t * 6.3, facing: -1, arms: 'phone', mood: 'hipno', screen: '#b48cff', headTilt: 0.3, lookY: 1 });
      if (lt > 3.8 && lt < 5) {
        // café derramándose fuera de la taza
        ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(x - 150, yA + 30, 40, 14, 0, 0, 7); ctx.fill();
        ctx.strokeStyle = '#3a2a22'; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x - 110, yA - 130); ctx.quadraticCurveTo(x - 130, yA - 50, x - 140, yA + 30); ctx.stroke();
        ctx.fillStyle = '#fbf8f0'; ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x - 60, yA - 10); ctx.lineTo(x - 20, yA - 10); ctx.lineTo(x - 25, yA + 30); ctx.lineTo(x - 55, yA + 30); ctx.closePath(); ctx.fill(); ctx.stroke();
        if (lt > 4.2 && lt < 4.9) onomatopeya(ctx, x - 160, yA - 300, '¡SPLASH!', 0.8, 0.1);
      }
    }
  }

  // ======================= 29–37 s: nadie ayuda, todos graban =======================
  const VIEJO = { ...nuevoToon(rng(41), 'viejo'), pelo: 'calvo', bigote: true, gafas: true };
  const corro = (() => { const r = rng(43), o = []; for (let i = 0; i < 11; i++) { const a = Math.PI + (i / 10) * Math.PI, frente = i % 3 === 0; o.push({ p: nuevoToon(r), ax: 540 + Math.cos(a) * 420, ay: frente ? 1840 : 1430 + Math.sin(a + Math.PI) * 60, s: frente ? 2.2 : 1.6, scr: pick(r, PANTALLAS), entra: 1.3 + r() * 1.2, desde: r() < 0.5 ? -300 : 1380 }); } return o; })();
  function escena4(ctx, t) {
    const lt = t - 29;
    fondo(ctx, '#d4d0c7', '#b8b3a9');
    nubes(ctx, t, 12, 3, 140, 400);
    fachada(ctx, -60, 1300, 560, 1150, { color: '#9b968c', seed: 8, ladrillo: true });
    fachada(ctx, 500, 1300, 640, 1000, { color: '#b8b3a9', seed: 9 });
    cartel(ctx, 600, 1020, 380, 200, 'BANCO', 'de la confianza');
    acera(ctx, 1300);
    const lista = [];
    // el anciano: camina, tropieza y cae
    const cae = easeOut(inv(0.8, 1.15, lt)), levanta = ease(inv(6.0, 7.2, lt));
    const ang = (cae - levanta) * (-Math.PI / 2);
    const vx = lt < 0.8 ? lerp(300, 470, lt / 0.8) : 470;
    lista.push({ y: 1620, draw: () => {
      ctx.save(); ctx.translate(vx + 70, 1620); ctx.rotate(-ang); ctx.translate(-70, 0);
      toon(ctx, 0, 0, 2.3, VIEJO, { run: lt < 0.8 ? 0.4 : 0, phase: t * 5, arms: lt < 0.8 ? 'cane' : levanta > 0.5 ? 'down' : 'up', mood: levanta > 0.7 ? 'feliz' : lt > 0.8 ? 'susto' : 'cansado', t, shadow: ang === 0 });
      ctx.restore();
    } });
    if (lt > 0.85 && lt < 1.7) lista.push({ y: 3000, draw: () => onomatopeya(ctx, 640, 1260, '¡AY!', lerp(1.5, 1, inv(0.85, 1, lt))) });
    // bastón que sale volando
    if (lt > 0.8) { const k = inv(0.8, 1.6, lt); lista.push({ y: 1625, draw: () => { ctx.save(); ctx.translate(lerp(620, 900, k), 1600 - Math.sin(k * Math.PI) * 300 + k * 20); ctx.rotate(k * 9); ctx.strokeStyle = INK; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, -60); ctx.lineTo(0, 60); ctx.arc(-14, -60, 14, 0, Math.PI, true); ctx.stroke(); ctx.restore(); } }); }
    // el corro de mirones que graba
    for (const c of corro) {
      const k = ease(inv(c.entra, c.entra + 0.9, lt));
      if (k <= 0) continue;
      const x = lerp(c.desde, c.ax, k), f = c.ax > 540 ? -1 : 1;
      const graba = k >= 1;
      lista.push({ y: c.ay, draw: () => toon(ctx, x, c.ay, c.s, c.p, { run: graba ? 0 : 0.5, phase: t * 6.3, facing: f, arms: graba ? 'film' : 'phone', mood: graba ? 'risa' : 'hipno', screen: c.scr, flash: graba && hash(Math.floor(t * 8) + c.ax) < 0.18 ? 0.9 : 0, headTilt: graba ? 0 : 0.3, bob: graba ? golpe(t + c.ax) * 0.4 : 0 }) });
      if (graba && hash(Math.floor(t * 3) + c.ax) < 0.2) lista.push({ y: 3000, draw: () => emoji(ctx, x + f * 120, c.ay - 380 - ((t * 200) % 200), 30, 'risa') });
    }
    // el niño se abre paso y ayuda
    if (lt > 4.2) {
      const x = lerp(1250, 760, ease(inv(4.2, 5.8, lt)));
      lista.push({ y: 1700, draw: () => toon(ctx, x, 1700, 2.3, NINO, { run: lt < 5.8 ? 0.6 : 0, phase: t * 7, facing: -1, arms: lt > 5.8 ? 'help' : 'swing', mood: lt > 6.6 ? 'feliz' : 'enfado' }) });
      if (lt > 7.0) { const k = inv(7.0, 8, lt); emoji(ctx, 700, 1250 - k * 300, 40 + k * 10, 'corazon'); }
    }
    lista.sort((a, b) => a.y - b.y).forEach(d => d.draw());
    // indicador REC
    if (lt > 2.4 && Math.floor(t * 2) % 2) enColor(ctx, c => { c.fillStyle = '#ff2d2d'; c.beginPath(); c.arc(90, 140, 22, 0, 7); c.fill(); c.font = '900 50px "DejaVu Sans Mono"'; c.fillText('REC', 125, 158); });
  }

  // ======================= 37–45 s: el mar de pantallas y el gran móvil =======================
  const nuca = (() => { const r = rng(51), o = []; for (let k = 0; k < 7; k++) { const n = 6 + k * 2; for (let i = 0; i < n; i++) o.push({ x: (i + 0.5 + (r() - 0.5) * 0.5) * (W / n), y: 1200 + k * 120, s: 0.7 + k * 0.28, pelo: pick(r, ['raya', 'calvo', 'moño', 'gorra', 'rizos']), scr: pick(r, PANTALLAS), ph: r() * 6 }); } return o; })();
  function deEspaldas(ctx, x, y, s, q, t, alza) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    // brazos alzados con el móvil
    const lift = alza;
    for (const sx of [-1, 1]) {
      const hx = sx * 36 + Math.sin(t * 3 + q.ph) * 6, hy = lerp(40, -150, lift);
      ctx.strokeStyle = INK; ctx.lineCap = 'round'; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(sx * 30, 20); ctx.quadraticCurveTo(sx * 60, -40, hx, hy); ctx.stroke();
      LIB.guante(ctx, hx, hy, -Math.PI / 2, 'puño', 1);
      if (sx > 0 && lift > 0.3) LIB.telefono(ctx, hx - 4, hy - 22, 0, q.scr, 0);
    }
    ctx.fillStyle = '#4a4743'; ctx.strokeStyle = INK; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(-50, 200); ctx.quadraticCurveTo(-55, 10, 0, 6); ctx.quadraticCurveTo(55, 10, 50, 200); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = PAPEL; ctx.beginPath(); ctx.ellipse(-27, -26, 7, 10, 0, 0, 7); ctx.ellipse(27, -26, 7, 10, 0, 0, 7); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, -28, 28, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = INK;
    if (q.pelo === 'calvo') { ctx.beginPath(); ctx.ellipse(0, -14, 26, 12, 0, 0, Math.PI); ctx.fill(); }
    else if (q.pelo === 'gorra') { ctx.beginPath(); ctx.arc(0, -32, 29, Math.PI, 0); ctx.fill(); }
    else if (q.pelo === 'moño') { ctx.beginPath(); ctx.arc(0, -34, 28, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(0, -66, 13, 0, 7); ctx.fill(); }
    else if (q.pelo === 'rizos') { for (let k = 0; k < 7; k++) { ctx.beginPath(); ctx.arc(Math.cos(Math.PI + (k * Math.PI) / 6) * 24, -30 + Math.sin(Math.PI + (k * Math.PI) / 6) * 24, 11, 0, 7); ctx.fill(); } }
    else { ctx.beginPath(); ctx.arc(0, -32, 28, Math.PI * 0.95, Math.PI * 2.05); ctx.fill(); }
    ctx.restore();
  }
  function escena5(ctx, t) {
    const lt = t - 37;
    const tilt = ease(inv(1.8, 4.2, lt)) * 1050;
    fondo(ctx, '#57534d', '#1e1c1a');
    ctx.save(); ctx.translate(0, tilt - 0);
    // cielo con rayos y el gran móvil
    const my = -380;
    if (tilt > 0) {
      ctx.save(); ctx.translate(540, my);
      enColor(ctx, c => { c.globalAlpha = inv(1.8, 3.4, lt) * 0.55; c.translate(0, 0); c.rotate(lt * 0.15); for (let i = 0; i < 16; i++) { c.rotate(Math.PI / 8); c.fillStyle = i % 2 ? 'rgba(120,210,255,0.35)' : 'rgba(255,255,255,0.12)'; c.beginPath(); c.moveTo(0, 0); c.lineTo(2400, -170); c.lineTo(2400, 170); c.closePath(); c.fill(); } });
      ctx.restore();
    }
    // colina y monolito
    ctx.fillStyle = '#2a2826'; ctx.beginPath(); ctx.moveTo(-100, 400); ctx.quadraticCurveTo(540, 60, 1180, 400); ctx.lineTo(1180, 1300); ctx.lineTo(-100, 1300); ctx.closePath(); ctx.fill();
    ctx.fillStyle = INK; rrect(ctx, 330, my - 520, 420, 820, 50); ctx.fill();
    enColor(ctx, c => {
      const g = c.createLinearGradient(0, my - 480, 0, my + 260); g.addColorStop(0, '#bff0ff'); g.addColorStop(1, '#59c7ff');
      c.shadowColor = '#7fdcff'; c.shadowBlur = 80; c.fillStyle = g; rrect(c, 360, my - 480, 360, 720, 26); c.fill(); c.shadowBlur = 0;
      // ojo gigante en la pantalla
      if (lt > 4.3) {
        const k = easeOut(inv(4.3, 5, lt));
        c.save(); c.translate(540, my - 140);
        c.fillStyle = '#fff'; c.strokeStyle = INK; c.lineWidth = 10; c.beginPath(); c.ellipse(0, 0, 140, 190 * k, 0, 0, 7); c.fill(); c.stroke();
        c.fillStyle = INK; c.beginPath(); c.ellipse(0, 50 * k, 76, 104 * k, 0, 0, 7); c.fill();
        c.fillStyle = '#fff'; c.beginPath(); c.moveTo(10, 30 * k); c.lineTo(50, -40 * k); c.lineTo(76, 10 * k); c.closePath(); c.fill();
        c.restore();
      }
      c.fillStyle = '#ff3b5c'; c.font = '900 70px "Liberation Serif"'; c.textAlign = 'center'; c.fillText(`♥ ${Math.floor(lerp(10000, 9999999, inv(0, 8, lt))).toLocaleString('es')}`, 540, my + 180);
    });
    ctx.restore();
    // multitud de espaldas alzando los móviles (ola de izquierda a derecha)
    ctx.save(); ctx.translate(0, tilt * 0.3);
    for (const q of nuca) {
      const alza = easeOut(clamp((lt - 0.3 - (q.x / W) * 1.2) / 0.6));
      deEspaldas(ctx, q.x, q.y + Math.sin(t * 6 + q.ph) * 4, q.s, q, t, alza);
    }
    ctx.restore();
  }

  // ======================= 45–53 s: los lemmings del precipicio =======================
  const BORDE = 760, MESETA = 1060;
  const lemmings = (() => { const r = rng(61), o = []; for (let i = 0; i < 22; i++) o.push({ p: nuevoToon(r), t0: -2 + i * 0.42, v: 150 + r() * 20, scr: pick(r, PANTALLAS), ph: r() * 6, giro: (r() - 0.5) * 8 }); return o; })();
  function escena6(ctx, t) {
    const lt = t - 45;
    const cam = ease(inv(4.5, 8, lt)) * 500;
    fondo(ctx, '#bdb8ae', '#3a3734');
    ctx.save(); ctx.translate(0, -cam);
    nubes(ctx, t, 14, 4, 150, 600);
    // abismo: pared del acantilado
    ctx.fillStyle = '#6b6761'; ctx.strokeStyle = INK; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(-100, MESETA); ctx.lineTo(BORDE, MESETA); ctx.lineTo(BORDE - 30, MESETA + 300); ctx.lineTo(BORDE + 20, MESETA + 700); ctx.lineTo(BORDE - 40, MESETA + 1200); ctx.lineTo(BORDE - 10, 3000); ctx.lineTo(-100, 3000); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 4;
    for (let k = 0; k < 14; k++) { const y = MESETA + 80 + k * 150; ctx.beginPath(); ctx.moveTo(BORDE - 60 - hash(k) * 300, y); ctx.lineTo(BORDE - 30, y + 40); ctx.stroke(); }
    ctx.fillStyle = '#8e8a82'; ctx.fillRect(-100, MESETA - 20, BORDE + 100, 24);
    // cartel de advertencia ignorado
    ctx.fillStyle = INK; ctx.fillRect(BORDE - 120, MESETA - 260, 12, 250);
    cartel(ctx, BORDE - 230, MESETA - 330, 230, 120, '¡PELIGRO!', 'precipicio', { rot: 0.08 });
    for (const l of lemmings) {
      const dt = lt - l.t0; if (dt < 0) continue;
      const x = -120 + dt * l.v;
      if (x < BORDE + 10) toon(ctx, x, MESETA, 1.5, l.p, { run: 0.45, phase: l.ph + t * 6.3, arms: 'phone', mood: 'hipno', screen: l.scr, headTilt: 0.3, lookY: 1 });
      else {
        const te = (x - BORDE - 10) / l.v;
        const fx = BORDE + 10 + te * 90, fy = MESETA + 0.5 * 1500 * te * te;
        if (fy > 3200) continue;
        ctx.save(); ctx.translate(fx, fy - 100); ctx.rotate(te * l.giro); ctx.translate(0, 100);
        toon(ctx, 0, 0, 1.5, l.p, { arms: 'phone', mood: te > 0.25 ? 'grito' : 'hipno', screen: l.scr, shadow: false, headTilt: 0.2, lookY: 1 });
        ctx.restore();
      }
    }
    ctx.restore();
    // el niño grita desde abajo
    const grita = (lt > 1.2 && lt < 2.6) || (lt > 3.6 && lt < 5);
    toon(ctx, 260, 1880, 2.5, NINO, { arms: grita ? 'up' : 'down', mood: grita ? 'grito' : 'triste', t, lookX: 0.6, lookY: -0.8, headTilt: -0.2, bob: grita ? golpe(t * 2) : 0 });
    if (grita) globo(ctx, 470, 1300, 330, 160, '¡ALTO!', 330, 1450, 74);
  }

  // ======================= 53–57 s: el atardecer (vuelve el color) =======================
  function atardecer(c, t, lt) {
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#3b3a8f'); g.addColorStop(0.35, '#e8638a'); g.addColorStop(0.62, '#ffb35c'); g.addColorStop(1, '#ffe6a1');
    c.fillStyle = g; c.fillRect(-100, -100, W + 200, H + 200);
    const gs = c.createRadialGradient(540, 1060, 20, 540, 1060, 520); gs.addColorStop(0, 'rgba(255,250,210,1)'); gs.addColorStop(0.25, 'rgba(255,214,107,0.9)'); gs.addColorStop(1, 'rgba(255,214,107,0)');
    c.fillStyle = gs; c.fillRect(0, 500, W, 1200);
    c.strokeStyle = INK; c.lineWidth = 5;
    for (let i = 0; i < 6; i++) { const x = ((t * 60 + i * 140) % 1300) - 100, y = 500 + hash(i) * 300 + Math.sin(t * 3 + i) * 15, fl = Math.sin(t * 10 + i) * 12; c.beginPath(); c.moveTo(x - 24, y - fl); c.quadraticCurveTo(x - 8, y - 12, x, y); c.quadraticCurveTo(x + 8, y - 12, x + 24, y - fl); c.stroke(); }
    // campo de flores en el borde
    c.fillStyle = '#4c3b5e'; c.beginPath(); c.moveTo(-100, MESETA); c.lineTo(BORDE, MESETA); c.lineTo(BORDE - 40, H + 100); c.lineTo(-100, H + 100); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#6a8f4a'; c.fillRect(-100, MESETA - 20, BORDE + 100, 28); c.strokeRect(-100, MESETA - 20, BORDE + 100, 28);
    for (let i = 0; i < 18; i++) { const x = 20 + hash(i + 40) * (BORDE - 60), sw = Math.sin(t * 3 + i) * 0.2; c.save(); c.translate(x, MESETA - 10); c.rotate(sw); c.strokeStyle = '#2f6f2a'; c.lineWidth = 4; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -40); c.stroke(); c.fillStyle = ['#ff5c8a', '#ffd84d', '#ffffff', '#b48cff'][i % 4]; c.strokeStyle = INK; c.lineWidth = 2; for (let k = 0; k < 5; k++) { c.beginPath(); c.arc(Math.cos(k * 1.256) * 9, -40 + Math.sin(k * 1.256) * 9, 7, 0, 7); c.fill(); c.stroke(); } c.restore(); }
    toon(c, BORDE - 160, MESETA, 2.6, NINO, { mood: 'feliz', arms: lt > 1.6 ? 'wave' : 'down', t, headTilt: -0.25, lookX: 0.5, lookY: -0.6, bob: golpe(t) * 0.4 });
  }
  function escena7(ctx, t) {
    const lt = t - 53;
    // versión en sepia debajo, se funde con la versión a color
    fondo(ctx, '#bdb8ae', '#3a3734');
    ctx.fillStyle = '#6b6761'; ctx.beginPath(); ctx.moveTo(-100, MESETA); ctx.lineTo(BORDE, MESETA); ctx.lineTo(BORDE - 40, H + 100); ctx.lineTo(-100, H + 100); ctx.closePath(); ctx.fill();
    toon(ctx, BORDE - 160, MESETA, 2.6, NINO, { mood: 'triste', arms: 'down', headTilt: 0.2 });
    const a = ease(inv(0.2, 1.6, lt));
    enColor(ctx, c => { c.globalAlpha = a; atardecer(c, t, lt); });
    if (lt > 3.2) IRIS = { cx: BORDE - 140, cy: MESETA - 220, r: lerp(1500, 0, easeIn(inv(3.2, 4, lt))) };
  }

  // ======================= 57–60 s: FIN =======================
  function escena8(ctx, t) {
    const lt = t - 57;
    fondo(ctx, '#3a3734', '#151312');
    marco(ctx, 80, 420, 920, 1000);
    ctx.textAlign = 'center'; ctx.fillStyle = INK;
    ctx.font = 'italic 900 260px "Liberation Serif"'; ctx.strokeStyle = '#fbf8f0'; ctx.lineWidth = 18; ctx.lineJoin = 'round';
    ctx.strokeText('Fin', 548, 830); ctx.fillStyle = '#4a4743'; ctx.fillText('Fin', 556, 838); ctx.fillStyle = INK; ctx.fillText('Fin', 540, 826);
    ctx.font = '700 40px "Liberation Serif"'; ctx.fillText('UN CORTO HECHO CON CÓDIGO', 540, 990);
    ctx.font = 'italic 34px "Liberation Serif"'; ctx.fillText('Inspirado en «Are You Lost In', 540, 1090); ctx.fillText('The World Like Me?» de Steve Cutts', 540, 1136);
    ctx.fillText('Música generada por código', 540, 1220);
    ctx.textAlign = 'left';
    if (lt < 0.5) IRIS = { cx: 540, cy: 900, r: lerp(0, 1400, easeOut(inv(0, 0.5, lt))) };
    if (lt > 2.4) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = inv(2.4, 3, lt); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  }

  const ESCENAS = [
    [0, 4, escena0], [4, 13, escena1], [13, 21, escena2], [21, 29, escena3], [29, 37, escena4],
    [37, 45, escena5], [45, 53, escena6], [53, 57, escena7], [57, 60, escena8],
  ];

  function renderFrame(ctx, t) {
    LIB.reiniciarColor();
    IRIS = null;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    // vaivén del proyector
    const fr = Math.floor(t * 24);
    ctx.translate((hash(fr * 1.7) - 0.5) * 4, (hash(fr * 2.3) - 0.5) * 5);
    const e = ESCENAS.find(([a, b]) => t >= a && t < b) || ESCENAS[ESCENAS.length - 1];
    ctx.save(); e[2](ctx, t); ctx.restore();
    ctx.restore();
    const iris_ = IRIS;
    pelicula(ctx, W, H, t, { despuesColor: c => { if (iris_) iris(c, W, H, iris_.cx, iris_.cy, iris_.r); } });
    // cortes rápidos a negro entre escenas
    for (const b of [13, 21, 29, 37, 45]) { if (Math.abs(t - b) < 0.12) { ctx.save(); ctx.globalAlpha = 1 - Math.abs(t - b) / 0.12; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); ctx.restore(); } }
  }

  window.FELICIDAD = { W, H, DURACION, renderFrame };
})();
