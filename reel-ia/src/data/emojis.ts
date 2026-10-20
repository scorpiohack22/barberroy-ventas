/**
 * Emojis animados (bounce) junto a las palabras relevantes.
 * - junto: texto del subtítulo al que acompañan (se sincroniza solo si cambias tiempos).
 * - duracion: segundos en pantalla.
 * - x, y: posición del centro en px (lienzo 1080x1920). Si se omiten, va a la derecha del subtítulo.
 */
export type EmojiCue = {emoji: string; junto: string; duracion: number; x?: number; y?: number; tam?: number};

export const EMOJIS: EmojiCue[] = [
  {emoji: '💰', junto: 'GANAR DINERO', duracion: 1.4, x: 860, y: 900},
  {emoji: '🤖', junto: 'usa la IA', duracion: 1.2},
  {emoji: '🏆', junto: 'facturando', duracion: 1.4},
  {emoji: '⚡', junto: 'de producción completo', duracion: 1.2},
  {emoji: '🎬', junto: 'el guion', duracion: 1.0},
  {emoji: '📸', junto: 'las fotos…', duracion: 1.4},
  {emoji: '🎬', junto: 'en video', duracion: 1.0},
  {emoji: '⚡', junto: 'SISTEMA', duracion: 1.0, x: 880, y: 1020},
  {emoji: '💰', junto: 'SERVICIO', duracion: 1.4, x: 880, y: 1010},
  {emoji: '🏆', junto: 'Scorpio Academy', duracion: 1.0},
];
