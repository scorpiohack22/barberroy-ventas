// Renderiza el video a MP4: node render.js [--fps 30] [--workers 3] [--stills 1.5,8,20]
const http = require('http'), fs = require('fs'), path = require('path'), { spawn, execFileSync } = require('child_process');
const { chromium } = require('playwright');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const FPS = +arg('fps', 30), WORKERS = +arg('workers', 3), STILLS = arg('stills', null);
const ROOT = __dirname, OUT = path.join(ROOT, 'salida'); fs.mkdirSync(OUT, { recursive: true });
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.wav': 'audio/wav', '.woff2': 'font/woff2' };

const server = http.createServer((req, res) => {
  const f = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
});

async function openPage(browser, port) {
  const page = await browser.newPage({ viewport: { width: 800, height: 1400 } });
  page.on('pageerror', e => console.error('ERROR página:', e.message));
  page.on('console', m => m.type() === 'error' && console.error('consola:', m.text()));
  await page.goto(`http://127.0.0.1:${port}/index.html`);
  await page.waitForFunction(() => window.READY === true, null, { timeout: 120000 });
  return page;
}
const jpeg = async (page, t) => Buffer.from((await page.evaluate(t => window.renderFrame(t), t)).split(',')[1], 'base64');

(async () => {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const port = server.address().port;
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  if (STILLS) {
    const page = await openPage(browser, port);
    for (const t of STILLS.split(',').map(Number)) fs.writeFileSync(path.join(OUT, `still_${t.toFixed(1)}.jpg`), await jpeg(page, t));
    console.log('Fotogramas guardados en', OUT); await browser.close(); server.close(); return;
  }
  const first = await openPage(browser, port);
  const dur = await first.evaluate(() => window.DURATION); await first.close();
  const total = Math.ceil(dur * FPS), per = Math.ceil(total / WORKERS), t0 = Date.now();
  let done = 0;
  const parts = await Promise.all([...Array(WORKERS)].map(async (_, w) => {
    const a = w * per, b = Math.min(total, a + per), file = path.join(OUT, `parte${w}.mp4`);
    const page = await openPage(browser, port);
    const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', file], { stdio: ['pipe', 'inherit', 'inherit'] });
    for (let i = a; i < b; i++) {
      const buf = await jpeg(page, i / FPS);
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
      if (++done % 60 === 0) process.stdout.write(`\r${done}/${total} fotogramas (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
    }
    ff.stdin.end(); await new Promise(r => ff.on('close', r)); await page.close(); return file;
  }));
  await browser.close(); server.close();
  console.log('\nUniendo partes y mezclando audio...');
  const list = path.join(OUT, 'partes.txt'); fs.writeFileSync(list, parts.map(p => `file '${p}'`).join('\n'));
  // Música de fondo sintetizada (pad suave) mezclada bajo la voz
  const pad = "0.05*sin(2*PI*110*t)*(0.7+0.3*sin(2*PI*0.25*t))+0.035*sin(2*PI*164.81*t)*(0.7+0.3*sin(2*PI*0.17*t))+0.03*sin(2*PI*220*t)+0.02*sin(2*PI*261.63*t)*(0.5+0.5*sin(2*PI*0.5*t))+0.012*sin(2*PI*329.63*t)";
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-i', path.join(ROOT, 'voz', 'voz.wav'),
    '-f', 'lavfi', '-t', String(dur), '-i', `aevalsrc=${pad}:s=44100`,
    '-filter_complex', `[1:a]aresample=44100,highpass=f=80,acompressor=threshold=-18dB:ratio=3,volume=1.6[v];[2:a]lowpass=f=900,afade=t=in:d=1,afade=t=out:st=${(dur - 1.5).toFixed(2)}:d=1.5,volume=0.55[m];[v][m]amix=inputs=2:duration=first:normalize=0[a]`,
    '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', path.join(OUT, 'video_barberroy.mp4')]);
  parts.forEach(p => fs.unlinkSync(p)); fs.unlinkSync(list);
  console.log('Listo:', path.join(OUT, 'video_barberroy.mp4'), `(${((Date.now() - t0) / 1000).toFixed(0)}s)`);
})().catch(e => { console.error(e); process.exit(1); });
