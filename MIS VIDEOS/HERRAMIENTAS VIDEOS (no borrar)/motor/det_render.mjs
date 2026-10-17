import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
import { spawn } from 'child_process';
import fs from 'fs';
const [,, out, fpsArg, onlyTimes] = process.argv;
const FPS = +fpsArg || 30;
const tl = JSON.parse(fs.readFileSync(process.env.TLF || 'tl.json'));
const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
p.on('console', m => console.log('PAGE', m.text())); p.on('pageerror', e => console.log('ERR', e.message));
await p.goto('file://' + process.cwd() + '/' + (process.env.HTML || 'anime.html'));
await p.evaluate(tl => window.setTL(tl), tl);
await p.evaluate(() => window.ready());
if (onlyTimes) {
  for (const ts of onlyTimes.split(',')) {
    const d = await p.evaluate(([t]) => window.renderFrame(t, 0, 0.9), [+ts]);
    fs.writeFileSync(`${out}_${ts}.jpg`, Buffer.from(d.split(',')[1], 'base64'));
  }
} else {
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-c:v', 'mjpeg', '-r', String(FPS), '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const N = Math.round(tl.dur * FPS); const N0 = +(process.env.F0 || 0), N1 = Math.min(N, +(process.env.F1 || N));
  for (let n = N0; n < N1; n++) {
    const d = await p.evaluate(([t, n]) => window.renderFrame(t, n, 0.94), [n / FPS, n]);
    if (!ff.stdin.write(Buffer.from(d.split(',')[1], 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
    if (n % 150 === 0) console.log('frame', n, '/', N);
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r));
}
await b.close();
