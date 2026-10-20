import {interpolate, spring} from 'remotion';
import {FPS, seg} from './theme';

/** Convierte un segundo global en frame local de una escena que empieza en `origen`. */
export const enEscena = (origen: number) => (s: number) => seg(s) - seg(origen);

export const aparecer = (frame: number, desde: number, dur = 8) =>
  interpolate(frame, [desde, desde + dur], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

export const desaparecer = (frame: number, hasta: number, dur = 6) =>
  interpolate(frame, [hasta - dur, hasta], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

export const pop = (frame: number, desde: number, damping = 12) =>
  frame < desde ? 0 : spring({frame: frame - desde, fps: FPS, config: {damping, stiffness: 220}});
