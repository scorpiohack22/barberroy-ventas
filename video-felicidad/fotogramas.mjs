// Exporta fotogramas sueltos para revisión rápida: node fotogramas.mjs carpeta t1 t2 ...
import { chromium } from 'playwright';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
const dir = path.dirname(fileURLToPath(import.meta.url));
const [out, ...ts] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errores = [];
page.on('pageerror', e => errores.push(e.message));
await page.goto(pathToFileURL(path.join(dir, 'index.html')).href);
await page.evaluate(() => document.fonts.ready);
for (const t of ts) {
  const b64 = await page.evaluate(t => { dibujar(t); return document.getElementById('c').toDataURL('image/jpeg', 0.9).split(',')[1]; }, Number(t));
  fs.writeFileSync(path.join(out, `${String(t).padStart(5, '0')}.jpg`), Buffer.from(b64, 'base64'));
}
if (errores.length) console.log('ERRORES:', errores);
await browser.close();
