# Felicidad: corto de 60 s hecho con código

Corto animado sin voz, solo con música, inspirado en «Happiness» de Steve Cutts, con personas en vez de ratas.
Todo sale de código: la animación (Canvas 2D) y la música (síntesis con numpy). No usa imágenes, samples ni IA.

- `escenas.js`: las 9 escenas y el rig de los personajes (manos, pies, rodillas, codos y expresiones).
- `musica.py`: genera `musica.wav`, sincronizada con las escenas.
- `index.html`: vista previa en el navegador, con reproductor y línea de tiempo.
- `render.mjs`: exporta `felicidad.mp4` cuadro a cuadro (30 fps, con desenfoque de movimiento).

```bash
python3 musica.py     # requiere numpy
npm install           # playwright
node render.mjs       # requiere ffmpeg
```
