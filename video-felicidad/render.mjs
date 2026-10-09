// Renderiza el corto cuadro a cuadro con Chromium (Playwright) y lo codifica con ffmpeg.
// Uso: node render.mjs [salida.mp4] [fps] [desde] [hasta]
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const dir = path.dirname(fileURLToPath(import.meta.url));
const salida = process.argv[2] || path.join(dir, 'felicidad.mp4');
const fps = Number(process.argv[3] || 30);
const desde = Number(process.argv[4] || 0), hasta = Number(process.argv[5] || 60);
const musica = path.join(dir, 'musica.wav');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
await page.goto(pathToFileURL(path.join(dir, 'index.html')).href);
await page.evaluate(() => document.fonts.ready);

const args = ['-y', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-'];
const conAudio = fs.existsSync(musica) && desde === 0 && hasta === 60;
if (conAudio) args.push('-i', musica, '-c:a', 'aac', '-b:a', '192k', '-shortest');
args.push('-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', salida);
const ff = spawn('ffmpeg', args, { stdio: ['pipe', 'inherit', 'inherit'] });

const total = Math.round((hasta - desde) * fps);
for (let i = 0; i < total; i++) {
  const t = desde + i / fps;
  const b64 = await page.evaluate(([t, fps]) => { cuadro(t, fps, 3); return document.getElementById('c').toDataURL('image/jpeg', 0.95).split(',')[1]; }, [t, fps]);
  if (!ff.stdin.write(Buffer.from(b64, 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
  if (i % 150 === 0) console.log(`cuadro ${i}/${total}`);
}
ff.stdin.end();
await new Promise(r => ff.on('close', r));
await browser.close();
console.log('listo:', salida);
