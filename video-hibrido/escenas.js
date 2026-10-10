// Prueba híbrida: fondos ilustrados generados con IA (Higgsfield) + personajes animados por código.
(function () {
  const { lerp, inv, ease, rng, nuevaPersona, PROTA, persona, post } = LIB;
  const W = 1080, H = 1920, DURACION = 8;

  const fuentes = { ciudad: 'fondos/ciudad_ilustracion.png', oficina: 'fondos/oficina_soul.png' };
  const img = {};
  window.LISTO = Promise.all(Object.entries(fuentes).map(([k, src]) => new Promise(res => { const i = new Image(); i.onload = res; i.onerror = res; i.src = src; img[k] = i; })));

  // Dibuja la imagen cubriendo el lienzo, con zoom y desplazamiento suaves (sensación de cámara).
  function fondoImagen(ctx, im, zoom, dx = 0, dy = 0) {
    const s = Math.max(W / im.width, H / im.height) * zoom;
    const w = im.width * s, h = im.height * s;
    ctx.drawImage(im, (W - w) / 2 + dx, (H - h) / 2 + dy, w, h);
  }
  // Sombra de oclusión bajo los personajes para "asentarlos" en la imagen.
  function suelo(ctx, y0) {
    const g = ctx.createLinearGradient(0, y0, 0, H); g.addColorStop(0, 'rgba(40,35,30,0)'); g.addColorStop(1, 'rgba(40,35,30,0.35)');
    ctx.fillStyle = g; ctx.fillRect(0, y0, W, H - y0);
  }

  const gente = (() => { const r = rng(5), o = []; for (let i = 0; i < 7; i++) { const y = 1560 + r() * 330; o.push({ p: nuevaPersona(r, r() < 0.3), y, s: 1.3 + ((y - 1560) / 330) * 1.0, x0: r() * 1400, v: 70 + r() * 40, dir: r() < 0.5 ? 1 : -1, ph: r() * 6 }); } return o; })();

  function ciudad(ctx, t) {
    fondoImagen(ctx, img.ciudad, lerp(1.0, 1.1, ease(t / 4)), 0, lerp(0, -40, t / 4));
    suelo(ctx, 1450);
    const lista = gente.map(q => ({ y: q.y, draw: () => { const x = ((q.x0 + q.dir * q.v * t) % 1500 + 1500) % 1500 - 200; persona(ctx, x, q.y, q.s, q.p, { run: 0.42, phase: q.ph + t * 6.5, facing: q.dir, arms: 'phone', headTilt: 0.38, mood: 'tired' }); } }));
    lista.push({ y: 1760, draw: () => persona(ctx, lerp(300, 560, ease(t / 4)), 1760, 2.4, PROTA, { run: t < 3 ? 0.42 : 0, phase: t * 6.5, headTilt: lerp(0, -0.45, ease(inv(1.5, 3.5, t))), mood: t > 3.2 ? 'sad' : 'neutral', blink: t > 2.3 && t < 2.42 }) });
    lista.sort((a, b) => a.y - b.y).forEach(d => d.draw());
  }

  function oficina(ctx, t) {
    const lt = t - 4;
    fondoImagen(ctx, img.oficina, lerp(1.12, 1.0, ease(lt / 4)));
    suelo(ctx, 1500);
    const r = rng(9), comp = nuevaPersona(r, false);
    persona(ctx, lerp(1250, -200, lt / 4), 1560, 1.5, comp, { run: 0.42, phase: t * 6.5, facing: -1, arms: 'box', mood: 'tired', boxColor: '#e9e4d6' });
    persona(ctx, 380, 1830, 2.6, PROTA, { arms: 'phone', headTilt: 0.35, mood: 'tired', blink: lt > 1.8 && lt < 1.95 });
  }

  function renderFrame(ctx, t) {
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, W, H);
    if (t < 4) ciudad(ctx, t); else oficina(ctx, t);
    ctx.restore();
    post(ctx, W, H, t, { bloom: 0.12 });
    if (Math.abs(t - 4) < 0.15) { ctx.fillStyle = `rgba(0,0,0,${1 - Math.abs(t - 4) / 0.15})`; ctx.fillRect(0, 0, W, H); }
  }

  window.FELICIDAD = { W, H, DURACION, renderFrame };
})();
