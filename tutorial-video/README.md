# Tutorial: cuenta de pago de Facebook desactivada

Video tutorial para YouTube hecho con [Remotion](https://www.remotion.dev/) (React + TypeScript).
Es un MP4 horizontal de 1920x1080 a 30 fps y dura 92 s. Simula una grabación de pantalla en un
panel estilo Business Suite, con cursor animado, clics, zooms, texto que se escribe solo y subtítulos.

## Comandos

```bash
npm install
npm run dev      # abre Remotion Studio para previsualizar
npm run render   # genera out/video.mp4 y subtitulos.srt
npm run srt      # solo regenera subtitulos.srt
```

## Música (opcional)

Pon un archivo en `public/music.mp3`. Suena al 15 % con fade in y fade out de 2 s.
Si el archivo no existe, el video se renderiza sin música.

## Estructura

- `src/Video.tsx`: el `<Series>` con las 9 escenas. Entre escenas hay un fundido de 10 frames.
- `src/timeline.ts`: duración de cada escena.
- `src/subtitles.ts`: textos y tiempos de los subtítulos (la misma fuente para el video y el `.srt`).
- `src/components/`: `Cursor`, `Typewriter`, `Camera` (zoom), `Subtitles`, `Music` y el marco de la interfaz.
- `src/scenes/`: una escena por archivo.

## Privacidad

Los IDs van enmascarados (2647••••••••8965) y el banco aparece como "Bancolombia ••••".
NIF, dirección, teléfono, fecha de nacimiento y administradores van con `filter: blur(6px)`.
Debajo del desenfoque solo hay texto de relleno ("Xxxxx"), nunca datos reales.
No se usan logos oficiales: el ícono es un círculo azul genérico con un infinito.
