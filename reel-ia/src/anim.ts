import { Easing, interpolate, spring } from "remotion";
import { FPS } from "./theme";

const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Progreso 0→1 entre dos tiempos (s), con easing. */
export const prog = (t: number, a: number, b: number, ease = Easing.bezier(0.65, 0, 0.35, 1)) =>
  interpolate(t, [a, b], [0, 1], { ...cl, easing: ease });

export const outExpo = Easing.bezier(0.16, 1, 0.3, 1);

/** Spring que arranca en el tiempo `at` (s). */
export const sp = (t: number, at: number, damping = 16, stiffness = 140, mass = 0.9) =>
  t < at ? 0 : spring({ frame: (t - at) * FPS, fps: FPS, config: { damping, stiffness, mass } });

export const lerp = (p: number, a: number, b: number) => a + (b - a) * p;

export const fadeIn = (t: number, at: number, d = 0.2) => interpolate(t, [at, at + d], [0, 1], cl);
export const fadeOut = (t: number, at: number, d = 0.2) => interpolate(t, [at, at + d], [1, 0], cl);

/** Entrada típica de UI: spring de escala + subida + opacidad. */
export const popIn = (t: number, at: number, dist = 60): React.CSSProperties => {
  const p = sp(t, at, 14, 170);
  return {
    opacity: fadeIn(t, at, 0.12),
    transform: `translateY(${(1 - p) * dist}px) scale(${0.85 + 0.15 * p})`,
  };
};

/** Desenfoque de movimiento aproximado según la velocidad (px/frame). */
export const mblur = (v: number) => `blur(${Math.min(18, Math.abs(v) * 0.12)}px)`;
