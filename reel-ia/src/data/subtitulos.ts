/**
 * TIEMPOS DE LOS SUBTÍTULOS (en segundos).
 *
 * - texto:   lo que se ve en pantalla (2–3 palabras por grupo).
 * - inicio / fin: cuándo aparece y desaparece el grupo.
 * - clave:   PALABRA CLAVE → sale sola, en MAYÚSCULA, 140 px, con zoom de impacto y sfx pop.
 * - color:   'rojo' | 'dorado' (para claves o para resaltar un grupo normal).
 * - ocultar: el texto lo dibuja la propia escena (gráfico grande) → no se pinta como subtítulo,
 *            pero se mantiene aquí para conservar el tiempo (y el sfx si es clave).
 *
 * Ajusta los números a mano para que coincidan con tu voz. Los gráficos de las escenas
 * (ERROR, SISTEMA, el contador, el brief, el CTA…) buscan su grupo por texto y se mueven solos.
 * Mantén un objeto por línea: scripts/sync.py reescribe este archivo con los tiempos de Whisper.
 */
export type Subtitulo = {
  texto: string;
  inicio: number;
  fin: number;
  clave?: boolean;
  color?: 'rojo' | 'dorado';
  ocultar?: boolean;
};

export const SUBTITULOS: Subtitulo[] = [
  // ESCENA 1 — GANCHO [0–4]
  { texto: "Si quieres", inicio: 0.0, fin: 0.4 },
  { texto: "GANAR DINERO", inicio: 0.4, fin: 1.15, clave: true, color: "dorado" },
  { texto: "creando contenido…", inicio: 1.15, fin: 1.6 },
  { texto: "sin cámara,", inicio: 1.6, fin: 2.0 },
  { texto: "sin estudio", inicio: 2.0, fin: 2.4 },
  { texto: "y sin saber editar…", inicio: 2.4, fin: 3.0 },
  { texto: "quédate.", inicio: 3.0, fin: 3.4 },
  { texto: "Esto es para ti.", inicio: 3.4, fin: 4.0 },
  // ESCENA 2 — TENDENCIA Y CONTRASTE [4–11]
  { texto: "Hoy todo el mundo", inicio: 4.0, fin: 4.5 },
  { texto: "usa la IA", inicio: 4.5, fin: 5.0 },
  { texto: "para lo mismo:", inicio: 5.0, fin: 5.5 },
  { texto: "hacerle preguntas", inicio: 5.5, fin: 6.0 },
  { texto: "a un chat.", inicio: 6.0, fin: 6.5 },
  { texto: "ERROR", inicio: 6.5, fin: 7.3, clave: true, color: "rojo" },
  { texto: "Los que están", inicio: 7.3, fin: 7.9 },
  { texto: "facturando", inicio: 7.9, fin: 8.5, color: "dorado" },
  { texto: "la usan como", inicio: 8.5, fin: 9.1 },
  { texto: "un equipo", inicio: 9.1, fin: 9.7 },
  { texto: "de producción completo.", inicio: 9.7, fin: 11.0 },
  // ESCENA 3 — AUTORIDAD [11–14]
  { texto: "Yo la uso", inicio: 11.0, fin: 11.6 },
  { texto: "todos los días.", inicio: 11.6, fin: 12.3 },
  { texto: "Te muestro el mío.", inicio: 12.3, fin: 14.0, ocultar: true },
  // ESCENA 4 — PRUEBA [14–32]
  { texto: "Una IA estudia", inicio: 14.0, fin: 14.6 },
  { texto: "qué se está", inicio: 14.6, fin: 15.3 },
  { texto: "volviendo viral", inicio: 15.3, fin: 16.1 },
  { texto: "en mi nicho", inicio: 16.1, fin: 16.8 },
  { texto: "y me escribe", inicio: 16.8, fin: 17.6 },
  { texto: "el guion.", inicio: 17.6, fin: 18.6 },
  { texto: "Otra me hace", inicio: 18.6, fin: 19.3 },
  { texto: "las fotos…", inicio: 19.3, fin: 19.9 },
  { texto: "con mi cara,", inicio: 19.9, fin: 20.7 },
  { texto: "sin sesión.", inicio: 20.7, fin: 21.6 },
  { texto: "Otra convierte", inicio: 21.6, fin: 22.3 },
  { texto: "esas fotos", inicio: 22.3, fin: 23.0 },
  { texto: "en video.", inicio: 23.0, fin: 23.8 },
  { texto: "Otra pone", inicio: 23.8, fin: 24.4 },
  { texto: "la voz.", inicio: 24.4, fin: 25.2 },
  { texto: "Otra los", inicio: 25.2, fin: 25.8 },
  { texto: "subtítulos.", inicio: 25.8, fin: 26.6 },
  { texto: "Así le hago", inicio: 26.6, fin: 27.2 },
  { texto: "campañas a marcas", inicio: 27.2, fin: 27.8 },
  { texto: "de ropa", inicio: 27.8, fin: 28.4 },
  { texto: "SIN MODELO", inicio: 28.4, fin: 29.3, clave: true, color: "rojo" },
  { texto: "reels para clientes", inicio: 29.3, fin: 30.0 },
  { texto: "y documentales", inicio: 30.0, fin: 30.8 },
  { texto: "para YouTube.", inicio: 30.8, fin: 32.0 },
  // ESCENA 5 — LO QUE NADIE TE DICE [32–43]
  { texto: "Pero ojo,", inicio: 32.0, fin: 32.6 },
  { texto: "2 COSAS", inicio: 32.6, fin: 33.5, clave: true, color: "rojo", ocultar: true },
  { texto: "Uno:", inicio: 33.5, fin: 34.0 },
  { texto: "no son herramientas", inicio: 34.0, fin: 34.7 },
  { texto: "sueltas,", inicio: 34.7, fin: 35.3 },
  { texto: "es un", inicio: 35.3, fin: 35.7 },
  { texto: "SISTEMA", inicio: 35.7, fin: 36.6, clave: true, color: "rojo" },
  { texto: "una le pasa", inicio: 36.6, fin: 37.2 },
  { texto: "el trabajo", inicio: 37.2, fin: 37.8 },
  { texto: "a la otra.", inicio: 37.8, fin: 38.4 },
  { texto: "Dos:", inicio: 38.4, fin: 38.9 },
  { texto: "no le pides", inicio: 38.9, fin: 39.5 },
  { texto: "“hazme una foto”.", inicio: 39.5, fin: 40.2 },
  { texto: "Le das el brief", inicio: 40.2, fin: 40.8 },
  { texto: "de la marca…", inicio: 40.8, fin: 41.5 },
  { texto: "y te entrega", inicio: 41.5, fin: 42.2 },
  { texto: "la campaña entera.", inicio: 42.2, fin: 43.0 },
  // ESCENA 6 — OBJECIÓN Y DINERO [43–52]
  { texto: "No necesitas", inicio: 43.0, fin: 43.7, ocultar: true },
  { texto: "saber diseñar", inicio: 43.7, fin: 44.4, ocultar: true },
  { texto: "ni editar.", inicio: 44.4, fin: 45.1, ocultar: true },
  { texto: "Si sabes explicar", inicio: 45.1, fin: 45.8 },
  { texto: "lo que quieres,", inicio: 45.8, fin: 46.5 },
  { texto: "puedes hacerlo.", inicio: 46.5, fin: 47.3 },
  { texto: "Y lo importante:", inicio: 47.3, fin: 47.9 },
  { texto: "convertirlo en un", inicio: 47.9, fin: 48.6 },
  { texto: "SERVICIO", inicio: 48.6, fin: 49.5, clave: true, color: "dorado" },
  { texto: "que le vendes", inicio: 49.5, fin: 50.1 },
  { texto: "a marcas,", inicio: 50.1, fin: 50.7 },
  { texto: "como lo hago yo", inicio: 50.7, fin: 51.3 },
  { texto: "en la agencia.", inicio: 51.3, fin: 52.0 },
  // ESCENA 7 — CTA [52–60]
  { texto: "Eso es lo que", inicio: 52.0, fin: 52.6 },
  { texto: "enseño en", inicio: 52.6, fin: 53.2 },
  { texto: "Scorpio Academy.", inicio: 53.2, fin: 54.2 },
  { texto: "Comenta", inicio: 54.2, fin: 54.8 },
  { texto: "IA", inicio: 54.8, fin: 55.6, clave: true, color: "rojo", ocultar: true },
  { texto: "y te mando", inicio: 55.6, fin: 56.3 },
  { texto: "el acceso", inicio: 56.3, fin: 57.0 },
  { texto: "con descuento", inicio: 57.0, fin: 57.6 },
  { texto: "esta semana.", inicio: 57.6, fin: 58.0 },
];

/** Segundo en que empieza el grupo cuyo texto contiene `buscar` (o `porDefecto`). */
export const inicioDe = (buscar: string, porDefecto: number): number => {
  const b = buscar.toLowerCase();
  const s = SUBTITULOS.find((x) => x.texto.toLowerCase().includes(b));
  return s ? s.inicio : porDefecto;
};

export const finDe = (buscar: string, porDefecto: number): number => {
  const b = buscar.toLowerCase();
  const s = SUBTITULOS.find((x) => x.texto.toLowerCase().includes(b));
  return s ? s.fin : porDefecto;
};
