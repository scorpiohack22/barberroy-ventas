import {inicioDe} from './subtitulos';

/** Bloques del guion (segundos). En cada cambio de bloque hay flash blanco de 2 frames. */
export const ESCENAS = {
  gancho: {inicio: 0, fin: 4},
  tendencia: {inicio: 4, fin: 11},
  autoridad: {inicio: 11, fin: 14},
  prueba: {inicio: 14, fin: 32},
  nadieTeDice: {inicio: 32, fin: 43},
  objecion: {inicio: 43, fin: 52},
  cta: {inicio: 52, fin: 60},
} as const;

export type Tramo = {nombre: string; inicio: number; fin: number};

/**
 * Qué clip de /public/broll se ve en cada momento. Los cortes de la escena 4 y 5 siguen
 * a los subtítulos (si ajustas subtitulos.ts, los cortes se mueven solos).
 */
export const TRAMOS_BROLL: Tramo[] = [
  {nombre: '01-dinero', inicio: 0, fin: 4},
  {nombre: '02-chat', inicio: 4, fin: 11},
  {nombre: '12-academy', inicio: 11, fin: 14},
  {nombre: '03-guion', inicio: 14, fin: inicioDe('Otra me hace', 18.6)},
  {nombre: '04-fotos-cara', inicio: inicioDe('Otra me hace', 18.6), fin: inicioDe('Otra convierte', 21.6)},
  {nombre: '05-foto-a-video', inicio: inicioDe('Otra convierte', 21.6), fin: inicioDe('Otra pone', 23.8)},
  {nombre: '06-voz', inicio: inicioDe('Otra pone', 23.8), fin: inicioDe('Otra los', 25.2)},
  {nombre: '07-subtitulos', inicio: inicioDe('Otra los', 25.2), fin: inicioDe('Así le hago', 26.6)},
  {nombre: '08-moda-sin-modelo', inicio: inicioDe('Así le hago', 26.6), fin: 32},
  {nombre: '09-sistema', inicio: 32, fin: inicioDe('Dos:', 38.4)},
  {nombre: '10-brief', inicio: inicioDe('Dos:', 38.4), fin: 43},
  {nombre: '11-agencia', inicio: 43, fin: 52},
  {nombre: '12-academy', inicio: 52, fin: 60},
];

export const tramosEntre = (inicio: number, fin: number) =>
  TRAMOS_BROLL.filter((t) => t.inicio >= inicio && t.inicio < fin);
