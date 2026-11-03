# Videos estilo "historia en 3D" (9:16)

Videos verticales (720x1280, 30 fps) hechos 100% con código: escenas 3D low-poly (Three.js),
voz en off generada (Piper TTS), subtítulos palabra por palabra con palabras clave en amarillo
y contadores tipo marcador.

## Historias
| Historia | Guion | Escenas | Video |
|----------|-------|---------|-------|
| Apolo 13 (1 min) | `historias/apolo13/guion.json` | `escenas_apolo13.js` | `salida/apolo13.mp4` |
| BarberRoy — colorimetría (45 s) | `historias/barberroy/guion.json` | `escenas.js` | `salida/barberroy.mp4` |

## Archivos
- `historias/<nombre>/guion.json` — EL GUION. `escenas` (archivo JS de escenas) y `lines`: cada línea tiene
  `scene`, `text` (palabras clave con `*asi*`), `counter` opcional y `tts` opcional (pronunciación).
  Tipos de contador: `number` (from/to), `clock` (from/to "MM:SS" o "HH:MM"), `text` (value fijo).
- `escenas.js` — utilidades compartidas (personajes, materiales, textos) + escenas de BarberRoy.
- `escenas_apolo13.js` — escenas del Apolo 13.
- `index.html?h=<nombre>` — compositor y vista previa (clic para reproducir).
- `gen_voz.py <nombre>` — genera `voz.wav` y `timeline.json` de esa historia.
- `render.js <nombre>` — exporta `salida/<nombre>.mp4`.

## Cómo regenerar
```bash
npm install                      # three + fuente Montserrat
pip install piper-tts            # voz
# modelo de voz (una vez) en voz/: es_MX-ald-medium.onnx y .onnx.json de huggingface.co/rhasspy/piper-voices
#   (en el .json cambia "PhonemeType.ESPEAK" por "espeak" si piper da error)
python3 gen_voz.py apolo13                # 1) voz + tiempos
node render.js apolo13 --stills 5,20,40   # 2) (opcional) fotogramas de prueba
node render.js apolo13                    # 3) video final (~6 min)
```

## Nueva película
Copia `historias/apolo13/` con otro nombre, escribe el guion, crea su archivo de escenas
(exporta `SCENES`) y repite los 3 pasos.
