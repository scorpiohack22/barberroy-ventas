# Perdidos: corto vertical de 60 s hecho con código

Cartoon en blanco y negro al estilo de los años 30 (rubber hose) sobre la adicción al celular.
Solo hay color en las pantallas, los emojis y el atardecer final. No tiene voz, solo música.
Inspirado en «Are You Lost In The World Like Me?» de Steve Cutts.
Todo sale de código: animación en Canvas 2D y música sintetizada con numpy.

- `lib.js`: personajes rubber hose (ojos de pastel, guantes, zapatones), emojis, escenarios y el efecto de película antigua (sepia, grano, rayas, parpadeo, iris).
- `escenas.js`: la historia, en 9 escenas.
- `musica.py`: jazz y ragtime de los años 30 con efectos de cartoon; genera `musica.wav`.
- `render.mjs`: exporta `perdidos.mp4` en paralelo (1080×1920, 30 fps).

```bash
python3 musica.py
npm install
node render.mjs perdidos.mp4
```
