# Siguiente paso: imágenes realistas con Higgsfield Soul 2.0

El reel (`reel-ia/`) está terminado con gráficos vectoriales. Ahora hay que reemplazar
o complementar esas piezas con imágenes fotorrealistas generadas con **Soul 2.0**
(conector Higgsfield: `https://mcp.higgsfield.ai/mcp`).

## Requisitos de la sesión nueva

1. Higgsfield conectado en claude.ai/customize/connectors.
2. Rama `claude/bold-carson-ktrycb`, carpeta `reel-ia/`.
3. **No** tocar la narración (`public/narracion.wav`), los tiempos (`src/timing.ts`) ni el
   nivel de audio (`scripts/sound.py` ya quedó bajo para no tapar la voz).

## Imágenes a generar (vertical 9:16, 1080x1920 o mayor)

Estilo común: fotorealista, publicidad premium de startup tecnológica, luz suave,
contraste limpio, nada saturado, sin texto ni logos dentro de la imagen.

| # | Archivo (`public/img/`) | Escena (`src/beats/`) | Prompt base |
|---|---|---|---|
| 1 | `perfume-hero.jpg` | A_Hook, B_Reveal, D_Generate | Frasco de perfume de lujo de vidrio ámbar con tapa dorada, sobre un pedestal en un estudio cálido beige, luz lateral suave, fondo limpio, fotografía publicitaria de producto |
| 2 | `perfume-modelo.jpg` | A_Hook (tarjeta "Modelos") | Modelo elegante sosteniendo un frasco de perfume, retrato editorial de moda, luz de estudio cálida |
| 3 | `set-camaras.jpg` | A_Hook (tarjeta "Cámaras") | Set de rodaje profesional con cámara de cine, luces y equipo, detrás de cámaras, tonos neutros |
| 4 | `locacion.jpg` | A_Hook / C_Nothing ("Locaciones") | Locación lujosa, terraza mediterránea al atardecer, arquitectura minimalista |
| 5 | `creador-laptop.jpg` | E_OnePerson | Persona joven trabajando sola en su laptop de noche, escritorio minimalista, rostro iluminado por la pantalla, ambiente premium |
| 6 | `manos-teclado.jpg` | D_Generate | Primer plano de manos escribiendo en un teclado de laptop, luz azul fría de pantalla |
| 7–12 | `variacion-1..6.jpg` | G_Wall y la app de E_OnePerson | Variaciones del perfume (azul, violeta, verde menta, rosa, monocromo) en el mismo estilo |

## Cómo integrarlas

- **Fondo de las escenas:** en `components/Ad.tsx`, `AdBackground` y `AdProduct` deben aceptar una imagen
  (`<Img src={staticFile("img/perfume-hero.jpg")} />`) en lugar del frasco SVG. Así siguen
  funcionando el despiece en capas y "REAL" detrás del producto: recortar el frasco con máscara o
  generar una versión del producto sobre fondo neutro.
- **Tarjetas del presupuesto:** en A_Hook y C_Nothing, cada tarjeta lleva una miniatura (2–4)
  con parallax. En C_Nothing la miniatura se desvanece o se desatura al tacharse.
- **Escena de la persona:** en E_OnePerson, la foto 5 queda detrás de la laptop o se hace un match cut
  hacia ella en "desde su computador".
- **Prompt:** en D_Generate, la foto 6 va como plano corto (0,5–1 s) antes del clic en Generar.
- **Uso de cada foto:** fragmentos de 0,5–2 s con zoom y paneo; nunca una foto completa quieta.
- **Cierre:** volver a renderizar con `npm run render`.
