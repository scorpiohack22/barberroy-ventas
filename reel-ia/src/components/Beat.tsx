import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { FPS, H } from "../theme";

export type Trans = "whip" | "zoom" | "cut" | "pull";

const D = 0.14; // medio tiempo de transición (s)

const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/**
 * Monta una escena solo dentro de su ventana [from, to] (en segundos
 * absolutos de la narración) y resuelve la transición de entrada y salida.
 * - whip: paneo vertical rápido con desenfoque de movimiento.
 * - zoom: la cámara "atraviesa" hacia dentro.
 * - pull: la cámara se aleja revelando la escena.
 */
export const Beat: React.FC<{
  from: number;
  to: number;
  enter?: Trans;
  exit?: Trans;
  children: React.ReactNode;
}> = ({ from, to, enter = "whip", exit = "whip", children }) => {
  const t = useCurrentFrame() / FPS;
  if (t < from - D || t > to + D) return null;
  if (enter === "cut" && t < from) return null;

  let ty = 0;
  let s = 1;
  let blur = 0;
  let op = 1;

  if (t < from + D && enter !== "cut") {
    const p = interpolate(t, [from - D, from + D], [0, 1], cl);
    const e = 1 - Math.pow(1 - p, 3);
    if (enter === "whip") {
      ty = (1 - e) * H * 0.45;
      blur = (1 - e) * 26;
    } else if (enter === "zoom") {
      s = 0.55 + 0.45 * e;
      blur = (1 - e) * 20;
    } else if (enter === "pull") {
      s = 1.6 - 0.6 * e;
      blur = (1 - e) * 20;
    }
    op = interpolate(p, [0, 0.45], [0, 1], cl);
  }
  if (t > to - D && exit !== "cut") {
    const p = interpolate(t, [to - D, to + D], [0, 1], cl);
    const e = p * p * p;
    if (exit === "whip") {
      ty = -e * H * 0.45;
      blur = e * 26;
    } else if (exit === "zoom") {
      s = 1 + e * 1.8;
      blur = e * 22;
    } else if (exit === "pull") {
      s = 1 - e * 0.4;
      blur = e * 16;
    }
    op = interpolate(p, [0.55, 1], [1, 0], cl);
  } else if (t > to && exit === "cut") {
    return null;
  }

  return (
    <AbsoluteFill
      style={{
        opacity: op,
        transform: `translateY(${ty}px) scale(${s})`,
        filter: blur > 0.3 ? `blur(${blur}px)` : undefined,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
