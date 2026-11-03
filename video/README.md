# Video estilo "historia en 3D" — BarberRoy Academy

Video vertical 9:16 (720x1280, 30 fps) hecho 100% con código: escenas 3D low-poly (Three.js),
voz en off generada (Piper TTS), subtítulos palabra por palabra con palabras clave en amarillo
y contadores tipo marcador.

## Archivos
- `guion.json` — EL GUION. Cada línea: `scene` (escena 3D), `text` (marca palabras clave con `*asi*`),
  `counter` opcional (marcador arriba), `tts` opcional (cómo debe pronunciarse).
- `escenas.js` — las escenas 3D (barberia, cliente, duda, mezcla, naranja, rompe, resena, circulo, cta).
- `index.html` — compositor: 3D + subtítulos + contadores. Ábrelo en el navegador para vista previa.
- `gen_voz.py` — genera `voz/voz.wav` y `timeline.json` (tiempos de cada palabra) desde el guion.
- `render.js` — exporta `salida/video_barberroy.mp4` (video + voz + música de fondo).

## Cómo regenerar
```bash
npm install                      # three + fuente Montserrat
pip install piper-tts            # voz
# voz (una vez): bajar es_MX-ald-medium.onnx y .onnx.json de huggingface.co/rhasspy/piper-voices a voz/
python3 gen_voz.py               # 1) voz + tiempos
node render.js --stills 2,10,20  # 2) (opcional) fotogramas de prueba en salida/
node render.js                   # 3) video final
```
Vista previa en vivo: `npx serve .` y abre `index.html` (clic para reproducir).

## Usar tu propia voz
Graba cada línea y reemplaza `voz/voz.wav` respetando los tiempos de `timeline.json`
(o ajusta `start`/`end` de cada palabra ahí) y vuelve a correr `node render.js`.
