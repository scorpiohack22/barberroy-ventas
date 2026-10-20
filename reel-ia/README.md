# Reel IA — Scorpio Academy

Reel vertical de 60 s (1080×1920, 30 fps, 1800 frames) hecho con Remotion + React + TypeScript.
Composición: **`ReelIA`**. Salida: **`out/reel-ia.mp4`** (H.264 + AAC).

## Empezar

```bash
cd reel-ia
npm install
npx remotion studio          # previsualizar y ajustar en el navegador
```

## Renderizar

```bash
npx remotion render ReelIA out/reel-ia.mp4 --codec=h264 --audio-codec=aac
# o: npm run render
```

Frames de prueba en PNG (segundos 1, 8, 20, 38 y 56 → `out/preview/`):

```bash
npm run preview              # o: node scripts/preview.mjs 3 12.5 44
```

## Dónde poner tus archivos

| Archivo | Uso |
|---|---|
| `public/voz.mp3` | Tu voz leyendo el guion. Si no está, el video sale en silencio con los subtítulos. |
| `public/musica.mp3` | Música de fondo al 12 %, baja al 6 % mientras hablas (solo si hay voz). Se repite en bucle. |
| `public/broll/01-dinero` … `12-academy` | Tus clips. Valen `.mp4`, `.png` o `.jpg` con el mismo nombre (también `.mov`, `.webm`, `.jpeg`, `.webp`). |
| `public/sfx/whoosh.mp3`, `pop.mp3`, `cash.mp3` | Opcionales. `pop` en las palabras clave, `cash` en GANAR DINERO y SERVICIO, `whoosh` en cada cambio de clip. |

Nombres de B-roll: `01-dinero`, `02-chat`, `03-guion`, `04-fotos-cara`, `05-foto-a-video`, `06-voz`,
`07-subtitulos`, `08-moda-sin-modelo`, `09-sistema`, `10-brief`, `11-agencia`, `12-academy`.

Si falta un archivo, se ve un placeholder animado (gradiente oscuro con el nombre del archivo) y el render
no falla. Los clips de video arrancan desde su segundo 0, así que conviene que duren al menos lo que su tramo
(el más largo dura 9 s: `11-agencia`). Cada clip se parte en planos de ≤1,8 s con zoom-in lento o paneo.

Si cambias archivos en `public/` con el Studio abierto, recarga la página.

## Ajustar los tiempos de los subtítulos

Todo está en **`src/data/subtitulos.ts`**: un objeto por grupo, en segundos.

```ts
{ texto: "GANAR DINERO", inicio: 0.4, fin: 1.15, clave: true, color: "dorado" },
```

- `clave: true` → palabra clave sola, en MAYÚSCULA, 140 px, con zoom de impacto y sfx pop.
- `color` → `"rojo"` o `"dorado"`.
- `ocultar: true` → el texto ya lo dibuja la escena como gráfico grande ("TE MUESTRO EL MÍO", "2 COSAS",
  "NO NECESITAS", la "IA" del CTA); el tiempo se sigue usando.

Los efectos (temblor en ERROR, nodos de SISTEMA, contador del equipo, brief → campaña, CTA, emojis, cortes de
las escenas 4 y 5) buscan su grupo por texto, así que si mueves un tiempo, el gráfico se mueve con él.
Los emojis se configuran en `src/data/emojis.ts`; los bloques y los clips de cada escena en `src/data/escenas.ts`.

### Sincronización automática con Whisper

Con `public/voz.mp3` y Whisper instalado (`pip install -U openai-whisper`):

```bash
python3 scripts/sync.py            # opcional: --modelo medium
```

Alinea tu voz palabra por palabra con el guion y reescribe solo `inicio` y `fin` en `subtitulos.ts`.
Sin voz o sin Whisper, se quedan los tiempos estimados. Los bloques de escena (0–4, 4–11, …) son fijos;
si tu locución se desvía mucho, ajústalos en `src/data/escenas.ts`.

## Estructura

```
src/
  Root.tsx            composición ReelIA (1080x1920, 30 fps, 1800 frames)
  ReelIA.tsx          escenas + subtítulos + emojis + barra de progreso + flash + audio
  scenes/             Escena1Gancho … Escena7CTA (una por bloque del guion)
  components/         Broll, Subtitulos, Emojis, Nodos, Efectos, Audio
  data/               subtitulos.ts, emojis.ts, escenas.ts
scripts/              sync.py (Whisper), preview.mjs (frames PNG)
```

Zona segura respetada: 150 px libres arriba y 350 px abajo para la interfaz de Instagram y TikTok.

Nota: si tu Chrome/Chromium ya está instalado y no quieres que Remotion descargue uno, usa
`REMOTION_BROWSER=/ruta/a/chrome-headless-shell npm run render`.
