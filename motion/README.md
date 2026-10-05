# Motion — BarberRoy Academy (After Effects)

## `barberroy_promo.jsx`
Promo vertical para Reels / TikTok / Stories: **1080×1920, 15 s, 30 fps**, con los colores y fuentes de la web.

| Tiempo | Escena |
|---|---|
| 0 – 3 s | Rueda de color neón girando + logo **BARBERROY ACADEMY** |
| 3 – 7.5 s | "DOMINA LA / **COLORIMETRÍA** / CAPILAR", letra por letra |
| 7.5 – 11.5 s | Contadores animados: 4M+ seguidores · 5K+ alumnos · 10+ años |
| 11.5 – 15 s | "Y COBRA **LO QUE VALES**" + botón **INSCRÍBETE AHORA** con pulso |

### Cómo usarlo
1. Instala las fuentes (gratis en Google Fonts): **Anton**, **Archivo** (Black) y **Manrope** (Bold).
2. En After Effects: **Archivo → Scripts → Ejecutar archivo de script…** y elige `barberroy_promo.jsx`.
3. Se crea y abre la comp `BarberRoy_Promo_9x16`. Previsualiza con la barra espaciadora.
4. Exporta: **Composición → Añadir a la cola de Adobe Media Encoder** → H.264.

### Personalizar
- Colores: objeto `C` al inicio del script.
- Fuentes: objeto `FONT` (nombres PostScript).
- Textos y tiempos: cada escena está separada con comentarios `ESCENA 1…4`.
- Rebote: valores `amp`, `freq`, `decay` en `OVERSHOOT`.
- Todo queda en un solo paso de deshacer (Ctrl/Cmd+Z).
