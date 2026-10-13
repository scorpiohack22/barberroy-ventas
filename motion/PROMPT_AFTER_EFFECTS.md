Quiero producir una serie de 50 videos cortos animados para Facebook Reels y quiero que tú (Claude Code, en mi computadora) los construyas controlando **Adobe After Effects** por código.

## Contexto
- Tengo After Effects instalado en esta computadora. Antes de empezar, pregúntame mi sistema operativo (Windows/Mac) y la versión de After Effects, y verifica que esté activada la opción *Preferencias → Scripts y expresiones → Permitir que los scripts escriban archivos y accedan a la red*.
- Te adjunto 3 videos de referencia del estilo que busco. Estúdialos cuadro por cuadro (puedes extraer fotogramas con ffmpeg): fondo negro, figuras tipo pictograma blancas y gruesas con brillo suave, un solo color de acento (rojo), reflejo en el piso, foco de luz con viñeta, movimientos fluidos con buena física (anticipación, inercia, rebote), historias de comparación/metáfora de 10–20 s que se entienden sin palabras.
- El catálogo con los 50 videos (título en el video, título y descripción para Facebook, hashtags y guion de cada historia) está en el repositorio de GitHub `scorpiohack22/barberroy-ventas`, rama `claude/modest-keller-ukxtao`, archivo `motion/catalogo/catalogo.json` (y en formato legible en `motion/catalogo/PUBLICACIONES.md`). Clónalo o descárgalo y úsalo como guion.
- Ya hubo un primer intento hecho con código en canvas (carpeta `motion/` del mismo repo). **No me gustó la animación** porque: ________ (escribe aquí qué no te gustó: movimientos rígidos, figuras simples, falta de detalle, etc.). Quiero calidad de motion graphics profesional.

## Cómo trabajar con After Effects
1. Controla After Effects con **ExtendScript (.jsx)**. Escribe los scripts en una carpeta del proyecto y ejecútalos desde la terminal:
   - Windows: `"C:\Program Files\Adobe\Adobe After Effects <versión>\Support Files\AfterFX.exe" -r "C:\ruta\script.jsx"`
   - Mac: `osascript -e 'tell application "Adobe After Effects <versión>" to DoScriptFile "/ruta/script.jsx"'`
   Si existe un servidor MCP para After Effects que puedas instalar y te dé más control, propónmelo antes de instalarlo.
2. Primero crea una **librería reutilizable** (.jsx) que genere:
   - Un personaje pictograma con capas de forma (cabeza, torso, brazo y antebrazo, muslo y pierna) emparentadas como un rig, con trazos redondeados, controles de pose y escala (adulto, niño, bebé) y orientación izquierda/derecha. Si tengo instalado Duik (es gratis), úsalo para la cinemática inversa (IK).
   - Estilos: protagonista blanco con Glow, secundarios en gris, acento rojo.
   - Escenario: fondo negro, piso con reflejo (capa duplicada invertida con máscara de degradado), foco de luz, viñeta, partículas de polvo (CC Particle World) y grano.
   - Utilería frecuente: sol rojo, celular con brillo rojo, corazón, bastón, ladrillos o pared, lluvia, paraguas, vela, árbol que crece, puerta con luz, hoyo, bandera, monedas, reloj de arena.
   - Título animado arriba (tipografía gruesa, una palabra clave en rojo, aparición palabra por palabra).
   - Una cámara con empujes de zoom suaves, sacudida en los impactos, y destellos o parpadeos en los golpes dramáticos.
3. Animación: fotogramas clave con easing (nada lineal), anticipación y seguimiento, poses claras en los momentos emocionales y ciclos de caminata naturales.
4. Formato: composición de 1080×1920, 30 fps, 15–22 s. Renderiza con `aerender` y convierte a MP4 H.264 + AAC con ffmpeg (o Media Encoder), con nombres `NN-id.mp4`.
5. Audio: After Effects no genera música. Usa música y efectos **libres de derechos** que yo te dé o que descargue (por ejemplo, la biblioteca de audio de YouTube, Pixabay o Freesound CC0). Pídeme la carpeta de audio, sincroniza los efectos con las acciones (pasos, golpes, whooshes) y baja la música antes del clímax. Es importante para monetizar en Facebook: nada con derechos de autor.

## Plan
1. Haz **un solo video piloto** (el 01 del catálogo) y muéstrame fotogramas clave y el MP4 antes de seguir.
2. Cuando lo apruebe, produce los demás en lotes de 5, revisando tú mismo los fotogramas de cada video antes de entregarlo (figuras rotas, cosas encimadas o fuera de cuadro, acción tapada por el título).
3. Entrega final: carpeta con los 50 MP4 + un documento con el título y la descripción de Facebook de cada uno.
