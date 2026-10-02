# Tutorial: "Gato en la UFC" con Higgsfield

Reel vertical (1080x1920, 30 fps, 30,6 s) hecho con Remotion.

- **0 – 10,2 s:** el video original (`public/gato.mp4`) sin ninguna edición, con su audio.
- **10,2 – 30,6 s:** el paso a paso en Higgsfield como grabación de pantalla (estilo SaaS claro,
  cursor, tecleo, clics y auto-zoom), con insertos del creador generados con Soul 2.0
  (personaje "scorpio 2.0") y solo efectos de sonido, sin música.

| Tiempo | Escena |
|---|---|
| 10,2 – 11,7 s | Tú en tu escritorio + barra de prompt: "Hazme un video viral de un gato en la UFC" |
| 11,7 – 12,7 s | Tarjeta de título: higgsfield · Soul 2.0 · Kling 3.0 |
| 12,7 – 18,0 s | Paso 1: modelo Soul 2.0, prompt, 9:16, Generar, 4 resultados, elegir |
| 18,0 – 19,0 s | Inserto: tú con el celular ("Imagen lista") |
| 19,0 – 25,6 s | Paso 2: imagen inicial, Kling 3.0, prompt de movimiento, 10 s, Generar, resultado |
| 25,6 – 26,4 s | Inserto: tú celebrando ("Video listo") |
| 26,4 – 28,2 s | Paso 3: descargar |
| 28,2 – 30,6 s | Resultado a pantalla completa y cierre contigo: "Más tutoriales así · Seguir" |

## Comandos

```bash
npm install
npm run dev      # Remotion Studio
npm run audio    # regenera public/sfx.wav (efectos), requiere numpy
npm run render   # genera out/tutorial.mp4
```

Todos los tiempos están en `src/timeline.json` (lo leen la animación y `scripts/sfx.py`).
