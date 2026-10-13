// Cuadros de revisión de una escena: una cuadrícula PNG con los tiempos pedidos.
//   node motion/tools/stills.js <escena-id> <salida.png> [t1,t2,...]   (por defecto 10 tiempos repartidos)
// Tamaño completo de un frame:  node motion/tools/stills.js <id> out.png 5.2 --full
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const [id, out, times, flag] = process.argv.slice(2);
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 720, height: 1280 } });
  const errors = [];
  p.on('pageerror', e => errors.push(e.message));
  await p.goto('file://' + path.resolve(__dirname, '..', 'player.html') + '?export&scene=' + encodeURIComponent(id));
  try { await p.waitForFunction(() => window.READY, null, { timeout: 15000 }); }
  catch (e) { console.error('La escena no cargó:', errors.join('\n') || e.message); process.exit(1); }
  const dur = await p.evaluate(() => window.DURATION);
  const ts = times ? times.split(',').map(Number) : Array.from({ length: 10 }, (_, i) => +(0.6 + i * (dur - 1.2) / 9).toFixed(2));
  const full = flag === '--full';
  const cols = full ? ts.length : 5, cw = full ? 720 : 216, ch = full ? 1280 : 384;
  const rows = Math.ceil(ts.length / cols);
  const html = `<canvas id="g" width="${cols * cw}" height="${rows * ch}"></canvas>`;
  const imgs = [];
  for (const t of ts) imgs.push(await p.evaluate(t => { window.render(t); return document.getElementById('c').toDataURL(); }, t));
  if (errors.length) { console.error('Errores:', errors.join('\n')); process.exit(1); }
  const q = await b.newPage({ viewport: { width: 400, height: 400 } });
  await q.setContent(html);
  const data = await q.evaluate(async ({ imgs, cols, cw, ch, ts }) => {
    const g = document.getElementById('g').getContext('2d');
    g.fillStyle = '#222'; g.fillRect(0, 0, 9999, 9999);
    for (let i = 0; i < imgs.length; i++) {
      const im = new Image(); im.src = imgs[i]; await im.decode();
      const x = (i % cols) * cw, y = Math.floor(i / cols) * ch;
      g.drawImage(im, x + 2, y + 2, cw - 4, ch - 4);
      g.fillStyle = '#0f0'; g.font = 'bold 18px monospace'; g.fillText(ts[i] + 's', x + 8, y + ch - 10);
    }
    return document.getElementById('g').toDataURL().slice(22);
  }, { imgs, cols, cw, ch, ts });
  fs.writeFileSync(out, Buffer.from(data, 'base64'));
  await b.close();
  console.log('ok →', out, ts.join(','));
})();
