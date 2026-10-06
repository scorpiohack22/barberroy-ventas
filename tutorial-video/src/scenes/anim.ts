import { interpolate, spring } from "remotion";
import { FADE, FPS } from "../theme";

/**
 * Cada escena (salvo la primera) empieza FADE frames antes de su tiempo
 * nominal para el fundido. Este desfase alinea los tiempos con el guion.
 */
export const LEAD = FADE;

/** Aparición: opacidad + desplazamiento vertical con spring. */
export const appear = (frame: number, at: number, distance = 24) => {
  const p = spring({ frame: frame - at, fps: FPS, config: { damping: 200 } });
  return {
    opacity: interpolate(frame - at, [0, 8], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
    transform: `translateY(${(1 - p) * distance}px)`,
  } as const;
};

export const pop = (frame: number, at: number) => {
  const p = spring({ frame: frame - at, fps: FPS, config: { damping: 14, stiffness: 180 } });
  return {
    opacity: interpolate(frame - at, [0, 5], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
    transform: `scale(${0.6 + 0.4 * p})`,
  } as const;
};

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
