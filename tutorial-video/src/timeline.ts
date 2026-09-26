import { FPS } from "./theme";

/**
 * Duración nominal (en segundos) de cada escena. Son la única fuente de
 * verdad para el <Series> y para los subtítulos / subtitulos.srt.
 */
export const SCENES = [
  { id: "intro", seconds: 6 },
  { id: "estado", seconds: 8 },
  { id: "problemas", seconds: 8 },
  { id: "pago", seconds: 10 },
  { id: "configuracion", seconds: 16 },
  { id: "diagnostico", seconds: 10 },
  { id: "solucion", seconds: 22 },
  { id: "checklist", seconds: 8 },
  { id: "cierre", seconds: 4 },
] as const;

export const TOTAL_SECONDS = SCENES.reduce((a, s) => a + s.seconds, 0);
export const TOTAL_FRAMES = TOTAL_SECONDS * FPS;
