# Guía para crear escenas (videos virales de reflexión)

Cada video es **un archivo** `motion/scenes/<id>.js` que define `window.SCENE`. El motor
(`motion/engine/engine.js`, objeto global `E`) dibuja figuras pictograma blancas con brillo
sobre fondo negro, reflejo en el piso, foco de luz, polvo, viñeta, grano y
fundidos. El audio (`motion/audio.py`) arma música + efectos a partir de lo que la escena declara.

**Referencia obligatoria:** lee `motion/scenes/01-el-ciclo.js` (escena completa y aprobada) y la
sección de API al inicio de cada función de `motion/engine/engine.js`.

## Calidad del motor (ya incluido, no tienes que hacer nada)
Salida Full HD 1080×1920, desenfoque de movimiento real (4 sub-cuadros por frame), figuras con volumen 3D
(sombreado cilíndrico, cabeza esférica, sombra de contacto), bloom, haz de luz cenital (`beam`), textura de piso,
reflejo, polvo, viñeta y grano. Opciones extra de la escena: `beam: {x, a, w}` | función | `false`.
`E.figure(pose, style, {noShadow:true})` si la figura no toca el piso (en el aire, cayendo a un hoyo).

## Nivel cinematográfico (lo que diferencia un video viral de uno amateur)
- **Actuación**: anticipación antes de cada acción (agacharse antes de saltar, echarse atrás antes de empujar),
  seguimiento y asentamiento al terminar, respiración en reposo (`stand(x,{t})`), cabezas que miran a lo importante
  (`tilt`), pausas dramáticas de 0.5–1 s antes del giro. Nada de figuras quietas como estatuas.
- **Cámara lenta** en el momento clave: remapea el tiempo de tu acción (ej. `const ta = t < 9 ? t : 9 + (t-9)*.35`).
- **Composición**: regla de tercios, el protagonista nunca cortado, profundidad (figuras de fondo en `STYLE.dim`).
- **Ritmo**: un cambio visual cada 1–2 s (corte de cámara con `keyed`, zoom, efecto, nuevo personaje).
- **Significado**: el final debe dejar una enseñanza clara y emotiva que haga pensar en alguien real
  (padres, pareja, amigo, uno mismo). Si la historia del catálogo no se entiende bien, mejórala.

## Estilo visual (no negociable)
- 720×1280 vertical, 30 fps. Fondo negro. Figuras: protagonista blanco (`E.STYLE.hero`), secundarios/
  "los que fallan" en gris (`E.STYLE.gray`), lejanos/fantasmas `E.STYLE.dim`.
- **Un solo color de acento: rojo** (`#ff3b36`): sol, celular, corazones, objetos que importan. Úsalo con significado.
  Excepciones permitidas cuando la historia lo pide: dorado de monedas/trofeo (`E.coin`), luz cálida de vela/puerta/casa.
- **CERO texto en pantalla** (el cliente lo exige). El campo `title` se usa solo para la publicación; el motor ya no lo dibuja.
  Puedes usar íconos/símbolos (corazón, globo de pensamiento con icono), nunca letras ni números.
- Las figuras deben verse **grandes**: zoom de cámara entre ~1.5 y 2.3. El piso (`E.FLOOR` = 900 en el mundo)
  debe quedar en la mitad inferior de la pantalla. Toda la pantalla es tuya (ya no hay título), pero mantén la acción principal en el centro/abajo.
  Conversión: `pantallaY = 640 + (mundoY - cam.y) * cam.zoom`. Con `cam.y = FLOOR-190` y zoom 1.9 → piso en y≈1000. Bien.

## Narrativa (lo que hace que se comparta)
- 15–22 s. **Gancho en los primeros 2 s** (algo ya está pasando, movimiento de cámara). Historia en 3 actos
  claros, un **giro o golpe emocional** y un final que se sostiene ~1.5 s antes del fundido.
- Debe entenderse **sin sonido y sin idioma**. Gestos grandes, poses claras, pausas en los momentos clave.
- Cámara viva: empuje lento (zoom) en el momento emocional, abrir plano al final. Un `blackouts`/`flashes`
  en el golpe dramático, `shake` breve en impactos.
- Efectos "dopamina": `E.burst` (chispas), `E.ring` (onda), `E.rays`, corazones que suben, destellos en el clímax.

## API rápida (`E.`)
- Tiempo: `prog(t,t0,t1)`, `smooth`, `easeInOut`, `easeOut`, `backOut`, `keyed([[t,v],...], t)`, `bump(t,t0,t1)`,
  `pulse(t,t0,dur)`, `distance(speedKeys, D)` → función t→px recorridos (para caminar).
- Poses (devuelven objeto pose; todas aceptan `{s, dir, lean, tilt, y}`; `s`=escala .55 niño, .35 bebé):
  `stand(x,{t})`, `walk(x, d, {stride, stand, swing, freeze})`, `run(x, d)`, `sit(x)` (en silla, usar `E.chair`)
  / `sit(x,{ground:true})`, `kneel(x)`, `crouch(x,{amt})`, `lie(x)`, `sad(x)`, `cheer(x)`.
  Brazos: `pose.arms = [cercano, lejano]`, cada uno `{ang, bend}` (ángulo desde abajo, + hacia donde mira)
  o `{target:{x,y}}` (IK; opcional `elbowBack`, `elbowUp`). Pies: `pose.feet = [p, p]`.
  `mix(poseA, poseB, p)` mezcla poses; `poseAt(t, [[t0,poseA],[t1,poseB],...])` línea de tiempo de poses (¡úsala!).
  `holdPoint(shA, E.ARM*sA, shB, E.ARM*sB)` punto para tomarse de la mano; `shoulderOf(pose)`, `headOf(pose)`.
- Dibujar figura: `const sl = E.figure(pose, E.STYLE.hero, {alpha, blindfold})` → devuelve esqueleto resuelto
  (`sl.head`, `sl.sh`, `E.hand(sl,0|1)` para poner objetos en la mano). `mixStyle(a,b,p)` para envejecer/desvanecer.
- Utilería: `sun, moon, phone, heart, cane, brick, wall, stone, rain, cloud, umbrella, flame, candle, tree, sprout,
  ball, chair, table, door, pit, flag, rope, sagRope, coin, hourglass, box, backpack, dog, bubble, burst, ring, rays,
  chain, house, wheelchair, glowCircle`. Si necesitas otro objeto, **dibújalo en tu propio archivo** con `E.ctx`
  (canvas 2D, coordenadas del mundo).

## Estructura de `window.SCENE`
```js
(() => {
const { FLOOR, prog, smooth, keyed } = E;
const D = 18;
window.SCENE = {
  id: '02-desconectados',
  title: 'Mírala *antes de que* se vaya',   // tal cual del catálogo; *...* = rojo
  duration: D,
  camera: t => ({ x: 360, y: FLOOR - 190, zoom: keyed([[0, 1.7], [D, 2.0]], t), shake: 0 }),
  backdrop(t) { /* detrás del horizonte: sol, luna, nubes lejanas */ },
  world(t, refl) { /* utilería + figuras; refl=true al dibujar el reflejo (puedes omitir glows caros) */ },
  front(t) { /* encima: lluvia, partículas */ },
  scroll: null,            // o función t→distancia si la cámara "viaja" (marcas del piso se mueven)
  sky: t => 0,             // 0..1 tinte rojizo del cielo
  spot: { x: 360, r: 380 },// foco de luz en el piso (puede ser función de t)
  flashes: [], blackouts: [],
  events() { return [ ...E.footsteps(D, t => [{phi, size, moving}, ...]), {t: 5.2, type: 'thud'}, ... ]; },
  music: {
    sections: [ {t: .3, dur: 6, style: 'tender', chords: ['Am','F','C','G'], chordLen: 1.5}, ... ],
    stingers: [ {t: 9, type: 'impact'} ],
    duck: [[11.5, 12.8]],   // silencio dramático antes del clímax
  },
};
})();
```
- Estilos de música: `tender` (arpegio de piano), `sad` (piano escaso), `build` (se acelera, tensión creciente),
  `hope` (clímax emocional, grande), `epic` (hope + percusión), `tension` (drone + latidos), `upbeat` (ritmo alegre
  con kick/clap, `bpm`), `silence`. Progresiones sugeridas: triste `Am F C G` / `Am Em F G`; esperanza `F C G C`, `C G Am F`.
- Efectos (`events[].type`): step, cane, scuff, thud, clatter, whoosh, impact, boom, tick, clock{dur}, heartbeat, bell{note},
  chime, pop, coin, rain{dur}, wind{dur}, splash, knock, buzz{dur}, notify, crowd{dur}, crack, snap, rumble{dur}, fire{dur},
  door, sparkle, riser{dur}, swell{dur}, cheer{dur}, kiss, bark, slide. Campo opcional `vol` (0..1+) y `pan` (-1..1).
- No hay título ni sonido automático al inicio: abre con tu propio gancho visual y sonoro. Sincroniza pasos con `E.footsteps`.

## Proceso de trabajo
1. Escribe la escena siguiendo la historia del catálogo (`motion/catalogo/catalogo.json`, campo `historia`;
   usa `titulo_video` como `title`). Puedes mejorar la coreografía si la idea se entiende mejor.
2. Revisa cuadros (vista rápida sin desenfoque): `node motion/tools/stills.js <id> /tmp/<id>.png` (10 cuadros) o tiempos concretos:
   `node motion/tools/stills.js <id> /tmp/x.png 3.2,5.5,8 ` y a tamaño completo con `--full` al final.
   **Mira las imágenes** (herramienta Read) y corrige: extremidades rotas, figuras encimadas sin querer, cosas fuera
   de cuadro, poses que no se entienden, escenas vacías o aburridas.
   Itera hasta que cada momento clave se entienda solo con la imagen.
3. Construye el final: `bash motion/build.sh <id>` → `motion/out/<id>.mp4` (~2 min por video). Revisa el MP4 final
   con una cuadrícula: `ffmpeg -v error -y -i motion/out/<id>.mp4 -vf "fps=1,scale=180:-1,tile=6x4" -frames:v 1 /tmp/<id>_f.png`.
4. **No edites** `engine.js`, `audio.py`, `render.js`, `build.sh`, `player.html` ni escenas de otros. **No hagas commit.**
   Si encuentras un bug del motor que te bloquea, rodéalo en tu escena y repórtalo.
