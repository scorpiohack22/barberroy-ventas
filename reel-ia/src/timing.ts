import { FPS } from "./theme";

/**
 * Marcas de tiempo (s) de la narración, sacadas de la transcripción palabra
 * por palabra (scripts/words.json). Toda la edición se sincroniza con esto.
 */
export const N = {
  publicidad: 1.86,
  pense: 2.52,
  esto: 3.28,
  costar: 3.94,
  fortuna: 4.52,
  modelos: 5.28,
  camaras: 6.02,
  locaciones: 6.54,
  todo: 8.22,
  demasiado: 8.8,
  real: 9.24,
  pero: 9.8,
  descubri: 10.5,
  creer: 12.72,
  noModelos: 14.0,
  noCamaras: 15.28,
  niSiquiera: 16.02,
  locacion: 17.22,
  todoCreado: 18.44,
  creado: 19.14,
  inteligencia: 19.84,
  artificial: 20.4,
  masLoco: 21.44,
  eso: 22.52,
  unaSola: 23.06,
  persona: 23.52,
  computador: 24.52,
  ahi: 25.62,
  ia: 26.6,
  algunDia: 27.2,
  ya: 27.82,
  aqui: 28.72,
  apenas: 29.78,
  capaz: 31.24,
};

export const sec = (s: number) => Math.round(s * FPS);
