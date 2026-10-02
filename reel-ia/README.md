# Reel: "La IA ya está aquí"

Reel vertical para Instagram hecho con Remotion: 1080x1920, 30 fps, 32,4 s.
La narración (`public/narracion.wav`) es la línea de tiempo maestra. Cada escena
y cada acción visual están sincronizadas con las palabras transcritas en `scripts/words.json`.

## Comandos

```bash
npm install
npm run dev      # vista previa en Remotion Studio
npm run audio    # regenera public/fondo.wav (música + efectos), requiere numpy
npm run render   # genera out/reel.mp4
```

## Storyboard

| Tiempo | Narración | Escena |
|---|---|---|
| 0–2,5 s | "vi una publicidad" | Macro del anuncio que se abre a un teléfono, pregunta gancho y métricas contando |
| 2,5–8,1 s | "una fortuna… modelos, cámaras, locaciones" | Presupuesto que cuenta hasta $185.000, una partida por palabra con cables al producto |
| 8,1–9,8 s | "demasiado real" | Visor de cámara con foco que sigue el producto y texto detrás del producto |
| 9,8–13,5 s | "cómo lo habían hecho… no lo podía creer" | Escaneo, despiece 2.5D en capas y destello |
| 13,5–18,4 s | "no había modelos, cámaras, locación" | Las partidas se tachan y el costo baja a $0 |
| 18,4–21,4 s | "creado con inteligencia artificial" | Prompt, clic en Generar, progreso; la imagen nace del ruido |
| 21,4–25,5 s | "una sola persona desde su computador" | Laptop con estudio de IA, equipo 48 → 1, nodos y notificación |
| 25,5–29,6 s | "no viene algún día, ya está aquí" | Línea de tiempo que viaja al futuro y vuelve de golpe a HOY |
| 29,6–32,4 s | "apenas estamos viendo de lo que es capaz" | Muro de creativos con parallax y llamado a seguir |

## Estructura

- `src/timing.ts`: tiempos de las palabras clave de la narración.
- `src/beats/`: una escena por archivo. `src/components/Beat.tsx` gestiona las transiciones (whip, zoom, pull).
- `src/components/Ad.tsx`: el anuncio de perfume, construido en capas (fondo, producto, texto).
- `scripts/sound.py`: música (Am–F–C–G, 120 BPM) y efectos sintetizados, con ducking bajo la voz.

## Imágenes fotorrealistas

Las fotos de `public/img/` se generaron con Higgsfield Soul 2.0 (9:16, 1152×2048) siguiendo
`IMAGENES_SOUL.md`. `perfume-hero-cut.png` es el mismo frasco sin fondo (alineado 1:1 con
`perfume-hero.jpg`) y permite el despiece en capas y el texto "REAL" detrás del producto.
`components/Ad.tsx` expone `Photo` (recorte con zoom y paneo, nunca quieta) y el anuncio en capas.
