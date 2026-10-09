# Felicidad: corto de 60 s hecho con código

Corto animado vertical (1080×1920) sin voz, solo con música, inspirado en «Happiness» de Steve Cutts, con personas en vez de ratas.
Todo sale de código: la animación (Canvas 2D) y la música (síntesis con numpy). No usa imágenes, samples ni IA.

- `lib.js`: rig de personajes (dedos, zapatos, articulaciones, sombreado, expresiones), coches con interior, edificios y postproducción.
- `escenas.js`: las 9 escenas en formato vertical.
- `musica.py`: genera `musica.wav`, sincronizada con las escenas.
- `index.html`: vista previa en el navegador, con reproductor y línea de tiempo.
- `render.mjs`: exporta `felicidad.mp4` cuadro a cuadro (30 fps, con desenfoque de movimiento).

```bash
python3 musica.py     # requiere numpy
npm install           # playwright
node render.mjs       # requiere ffmpeg
```
