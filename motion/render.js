// Exporta una animación a MP4 vertical 720x1280.
//   node motion/render.js <escena-id | archivo.html> <salida.mp4>
// Con un id (ej. 01-el-ciclo) usa motion/player.html?scene=<id>.
// Si la animación define eventos/música, también escribe <salida>.events.json para el audio.
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

(async () => {
  const [src = 'motion/escalera.html', out = 'motion/escalera.mp4'] = process.argv.slice(2);
  const url = src.endsWith('.html')
    ? 'file://' + path.resolve(src) + '?export'
    : 'file://' + path.resolve(__dirname, 'player.html') + '?export&scene=' + encodeURIComponent(src);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 720, height: 1280 } });
  page.on('pageerror', e => { console.error('ERROR en la escena:', e.message); process.exit(1); });
  await page.goto(url);
  await page.waitForFunction(() => window.READY || window.render, null, { timeout: 15000 });
  const { duration, fps } = await page.evaluate(() => ({ duration: window.DURATION, fps: window.FPS }));
  const frames = Math.round(duration * fps);

  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '17', '-preset', 'medium', '-movflags', '+faststart', out],
    { stdio: ['pipe', 'inherit', 'inherit'] });

  for (let f = 0; f < frames; f++) {
    const b64 = await page.evaluate(t => { window.render(t); return document.getElementById('c').toDataURL('image/png').slice(22); }, f / fps);
    if (!ff.stdin.write(Buffer.from(b64, 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
    if (f % 90 === 0) process.stdout.write(`frame ${f}/${frames}\n`);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  const audio = await page.evaluate(() => window.audioEvents
    ? { cue: window.CUE, events: window.audioEvents(), duration: window.DURATION, music: window.MUSIC || null, title: window.TITLE || '' }
    : null);
  if (audio) fs.writeFileSync(out.replace(/\.mp4$/, '.events.json'), JSON.stringify(audio));
  await browser.close();
  console.log('listo →', out);
})();
