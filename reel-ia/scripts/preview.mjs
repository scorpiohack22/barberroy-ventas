// Renderiza frames de prueba como PNG en out/preview/ (segundos 1, 8, 20, 38 y 56 por defecto).
// Uso: npm run preview            |  node scripts/preview.mjs 3 12.5 44
import path from 'node:path';
import fs from 'node:fs';
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';

const segundos = process.argv.slice(2).map(Number).filter((n) => !Number.isNaN(n));
const lista = segundos.length ? segundos : [1, 8, 20, 38, 56];
const salida = path.resolve('out/preview');
fs.mkdirSync(salida, {recursive: true});

const browserExecutable = process.env.REMOTION_BROWSER || null;
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const composition = await selectComposition({serveUrl, id: 'ReelIA', browserExecutable});

for (const s of lista) {
  const frame = Math.min(composition.durationInFrames - 1, Math.round(s * composition.fps));
  const output = path.join(salida, `seg-${String(s).padStart(2, '0')}.png`);
  await renderStill({composition, serveUrl, frame, output, browserExecutable});
  console.log(`✔ ${output}  (frame ${frame})`);
}
