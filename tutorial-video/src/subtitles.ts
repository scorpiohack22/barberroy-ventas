/**
 * Subtítulos del video, en segundos absolutos. Se usan para dibujar los
 * subtítulos en pantalla y para generar subtitulos.srt (npm run srt).
 */
export type Cue = { start: number; end: number; text: string };

export const CUES: Cue[] = [
  {
    start: 0.5,
    end: 6,
    text: "Rechazaban mis documentos una y otra vez. Este fue el error real.",
  },
  {
    start: 6.2,
    end: 14,
    text: "Primero reviso el estado: la monetización del perfil está suspendida.",
  },
  {
    start: 14.2,
    end: 22,
    text: "Las cuentas publicitarias son otro tema: una solo tiene un pago pendiente.",
  },
  {
    start: 22.2,
    end: 32,
    text: "Aquí está el problema real: no es mi identidad, es “actividad inusual”.",
  },
  { start: 32.2, end: 38.5, text: "Mi identidad fiscal ya estaba verificada." },
  {
    start: 38.7,
    end: 48,
    text: "Meta compara el documento con estos datos. Si no coinciden, lo rechaza automáticamente.",
  },
  {
    start: 48.2,
    end: 58,
    text: "Por eso mandar la licencia una y otra vez nunca iba a funcionar.",
  },
  {
    start: 58.2,
    end: 67,
    text: "Este formulario sí llega a un representante, no al robot.",
  },
  { start: 67.2, end: 74.5, text: "Explica tu caso completo en un solo mensaje." },
  {
    start: 74.7,
    end: 80,
    text: "Enviado. La respuesta llega al correo y al buzón de ayuda.",
  },
  {
    start: 80.2,
    end: 88,
    text: "Y cuando te respondan, manda un solo paquete limpio.",
  },
];
