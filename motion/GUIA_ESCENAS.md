# Guía para crear escenas (videos virales de reflexión)

Cada video es **un archivo** `motion/scenes/<id>.js` que define `window.SCENE`. El motor
(`motion/engine/engine.js`, objeto global `E`) dibuja figuras pictograma blancas con brillo
sobre fondo negro, reflejo en el piso, foco de luz, polvo, viñeta, grano, título animado y
fundidos. El audio (`motion/audio.py`) arma música + efectos a partir de lo que la escena declara.

**Referencia obligatoria:** lee `motion/scenes/01-el-ciclo.js` (escena completa y aprobada) y la
sección de API al inicio de cada función de `motion/engine/engine.js`.

## Estilo visual (no negociable)
- 720×1280 vertical, 30 fps. Fondo negro. Figuras: protagonista blanco (`E.STYLE.hero`), secundarios/
  "los que fallan" en gris (`E.STYLE.gray`), lejanos/fantasmas `E.STYLE.dim`.
- **Un solo color de acento: rojo** (`#ff3b36`): sol, celular, corazones, objetos que importan. Úsalo con significado.
  Excepciones permitidas cuando la historia lo pide: dorado de monedas/trofeo (`E.coin`), luz cálida de vela/puerta/casa.
- Sin texto en pantalla aparte del título (lo pone el motor). Puedes usar íconos/símbolos (corazón, globo de pensamiento con icono).
- Las figuras deben verse **grandes**: zoom de cámara entre ~1.5 y 2.3. El piso (`E.FLOOR` = 900 en el mundo)
  debe quedar en la mitad inferior de la pantalla. **La franja superior de la pantalla (y < 260 px en pantalla) es del
  título**: no pongas acción importante ahí.
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
- El motor ya pone un whoosh+golpe con el título al inicio. Sincroniza pasos con `E.footsteps`.

## Proceso de trabajo
1. Escribe la escena siguiendo la historia del catálogo (`motion/catalogo/catalogo.json`, campo `historia`;
   usa `titulo_video` como `title`). Puedes mejorar la coreografía si la idea se entiende mejor.
2. Revisa cuadros: `node motion/tools/stills.js <id> /tmp/<id>.png` (10 cuadros) o tiempos concretos:
   `node motion/tools/stills.js <id> /tmp/x.png 3.2,5.5,8 ` y a tamaño completo con `--full` al final.
   **Mira las imágenes** (herramienta Read) y corrige: extremidades rotas, figuras encimadas sin querer, cosas fuera
   de cuadro, acción tapada por el título, poses que no se entienden, escenas vacías o aburridas.
   Itera hasta que cada momento clave se entienda solo con la imagen.
3. Construye el final: `bash motion/build.sh <id>` → `motion/out/<id>.mp4` (~35 s por video).
4. **No edites** `engine.js`, `audio.py`, `render.js`, `build.sh`, `player.html` ni escenas de otros. **No hagas commit.**
   Si encuentras un bug del motor que te bloquea, rodéalo en tu escena y repórtalo.
