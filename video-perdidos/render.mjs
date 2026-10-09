// Renderiza el corto cuadro a cuadro con Chromium (Playwright) y lo codifica con ffmpeg.
// Reparte los cuadros entre varios procesos en paralelo y luego une los tramos con la música.
// Uso: node render.mjs [salida.mp4] [fps] [workers]
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';

const dir = path.dirname(fileURLToPath(import.meta.url));
const salida = path.resolve(process.argv[2] || path.join(dir, 'felicidad.mp4'));
const fps = Number(process.argv[3] || 30);
const workers = Number(process.argv[4] || Math.max(1, os.cpus().length));
const DUR = 60, SUB = 3;
const total = DUR * fps;
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'felicidad-'));

const ffmpeg = args => new Promise((res, rej) => {
  const p = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', ...args], { stdio: ['pipe', 'inherit', 'inherit'] });
  p.on('close', c => (c ? rej(new Error('ffmpeg ' + c)) : res()));
  return p;
});

const browser = await chromium.launch();
let hechos = 0;
async function tramo(k) {
  const desde = Math.floor((k * total) / workers), hasta = Math.floor(((k + 1) * total) / workers);
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  await page.goto(pathToFileURL(path.join(dir, 'index.html')).href);
  await page.evaluate(() => document.fonts.ready);
  const archivo = path.join(tmp, `tramo${k}.mp4`);
  const ff = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '22', '-pix_fmt', 'yuv420p', archivo], { stdio: ['pipe', 'inherit', 'inherit'] });
  const cerrado = new Promise(r => ff.on('close', r));
  for (let i = desde; i < hasta; i++) {
    const b64 = await page.evaluate(([t, fps, sub]) => { cuadro(t, fps, sub); return document.getElementById('c').toDataURL('image/jpeg', 0.95).split(',')[1]; }, [i / fps, fps, SUB]);
    if (!ff.stdin.write(Buffer.from(b64, 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
    if (++hechos % 150 === 0) console.log(`cuadro ${hechos}/${total}`);
  }
  ff.stdin.end();
  await cerrado;
  await page.close();
  return archivo;
}

const tramos = await Promise.all(Array.from({ length: workers }, (_, k) => tramo(k)));
await browser.close();
const lista = path.join(tmp, 'lista.txt');
fs.writeFileSync(lista, tramos.map(f => `file '${f}'`).join('\n'));
const musica = path.join(dir, 'musica.wav');
await ffmpeg(['-y', '-f', 'concat', '-safe', '0', '-i', lista, '-i', musica, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', salida]);
fs.rmSync(tmp, { recursive: true, force: true });
console.log('listo:', salida);
