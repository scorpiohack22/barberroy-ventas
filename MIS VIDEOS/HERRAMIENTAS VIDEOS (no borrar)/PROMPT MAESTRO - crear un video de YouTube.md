# PROMPT MAESTRO — Crear un video de YouTube como los "Expedientes" de Scorpio Net

Copia TODO el bloque de abajo y pégalo en una sesión nueva de Claude Code (en el repositorio scorpiohack22/barberroy-ventas). Cambia solo la línea TEMA.

```
Vas a producir un video completo para mi canal de YouTube, igual que los que ya hicimos.
Lee primero la carpeta "MIS VIDEOS/HERRAMIENTAS VIDEOS (no borrar)" del repositorio: ahí están el motor de animación
(motor/), el mezclador de música (motor/detmix3.py), los briefs de los videos anteriores (briefs/BRIEF_DET2..9.md),
las fuentes (fonts/) y un bloque de ejemplo completo (ejemplo_bloque_v9b1/). Cópialos a tu scratchpad y úsalos.
Mira también los videos terminados en "MIS VIDEOS/YouTube/" para copiar el estilo, la miniatura y el texto de YouTube.

TEMA: [escribe aquí el tema, por ejemplo: "¿Qué pasaría si la IA controlara tu dinero?"]
PLAYLIST: [Expedientes ¿Qué pasaría si…? | Ganar dinero con IA]

REGLAS DEL CONTENIDO
1. Investiga primero en internet y en YouTube (búsquedas reales y sugerencias de autocompletar en español) qué se
   busca y qué funciona. El título debe ser muy buscable y SIN año (para que no se vea viejo).
2. Guion narrado EN PRIMERA PERSONA por mí (Scorpio), ~4–6 min, dividido en 7–10 bloques.
   - Solo datos reales y verificados, con fuente. Nada inventado. No inventes ganancias ni experiencias mías;
     si necesitas un dato personal, pregúntame.
   - Expedientes: tono de detective que investiga ("anoche me puse a leer…"), 3 casos reales, qué hacer, cierre.
   - Ganar dinero con IA: tono de CLASE de profesor elegante, tutorial paso a paso muy fácil de entender
     (qué herramienta, dónde entrar, qué escribir exactamente, cuánto cuesta, cuánto cobrar con fuente, plan de 7 días),
     y motivación para empezar mañana (familia, proyectos).
   - Cierre siempre: pregunta para comentarios + "si quieres que te enseñe a usar la IA para crear contenido,
     escríbeme la palabra IA en Instagram; me encuentras como Escorpio Net" (en el texto escrito: @scorpio_net_).
3. Muéstrame el guion completo y ESPERA mi aprobación antes de gastar créditos.

VOZ (después de mi aprobación)
- Higgsfield generate_audio_batch, model "text2speech_v2", variant "elevenlabs", voice_type "element",
  voice_id "92b4d1a4-607e-44ae-9c38-112fb73de83e", use_unlim false. Máximo 5 partes por lote (si no, da error 429).
- Escribe los números en letras ("dos mil veinticinco") y "Escorpio Net" así, para que se pronuncie bien.
- Normaliza cada parte (adelay 150 ms, apad 0.8 s, loudnorm -14 LUFS) y transcríbela con faster-whisper "small"
  para revisar palabra por palabra y sacar los tiempos de cada palabra (vo/bN.json). Mándame la voz en MP3.
- Dime cuántos créditos gastaste y cuántos me quedan.

IMÁGENES (gratis, con Cowork)
- Escribe 48 prompts en inglés (o 96 si el video lo necesita) numerados: "NN [CON PERSONAJE] ..." (soy yo; empieza con
  "Flattering cinematic film still, eye-level camera, 85mm lens, a young Latino man ...") o "NN [SIN PERSONAJE] ...".
  Siempre "no readable text", sin logos. Los 2 últimos son para la miniatura.
- Dame el prompt COMPLETO para pegarle a Cowork (Higgsfield, modelo Soul 2.0, 16:9, 2k, 2 imágenes, personaje
  "scorpio 2.0", solo generaciones GRATIS, desactivar mejorar prompt, no usar otras herramientas de Higgsfield).
- Cuando te diga "ya", baja las imágenes con show_generations + motor/sync.py y revisa una hoja de contacto:
  descarta caras deformadas, letras inventadas y logos.

ANIMACIÓN (en paralelo, con agentes)
- Lanza un agente por bloque con un brief nuevo basado en los BRIEF_DET anteriores: pantalla completa 1920x1080 24 fps,
  personaje animado Scorpio con lip-sync (detective, o profesor elegante para la playlist de dinero), escenas de la vida
  diaria animadas con código, simuladores de pantalla (escribiendo en ChatGPT/Claude, Google Maps, WhatsApp) cuando sea
  tutorial, etiquetas de máximo 3 palabras, un look visual propio para cada video, fotos con Ken Burns, cortes en el
  inicio real de cada frase, primero versión dibujada y luego cambiar a las fotos cuando lleguen.
- Música épica original con motor/detmix3.py (music_db -13, duck_db 4), efectos suaves separados ≥3 s.
- Control de calidad de cada bloque: voz en todos los segundos, sin cuadros negros, hoja de contacto, cuadros alrededor de
  cada corte, sin texto basura, sin personajes flotando.
- Disco limitado: renderizar directo a ffmpeg y borrar intermedios.

ENTREGA
- Une los bloques, mezcla todo junto, revisa el video completo.
- Miniatura 1280x720 (mi foto + texto grande amarillo/blanco con borde negro, máximo 4–5 palabras).
- Texto de YouTube: título + 2 alternativas, descripción, capítulos con los tiempos reales, fuentes, etiquetas,
  "Contenido alterado o sintético: SÍ", Instagram @scorpio_net_.
- Guarda en "MIS VIDEOS/YouTube/<carpeta del video>/": FINAL (HD, menos de 95 MB), miniatura, texto, guion.
  Haz commit y push, y mándame el video de revisión, la miniatura, el texto y el link de descarga en HD.
```
