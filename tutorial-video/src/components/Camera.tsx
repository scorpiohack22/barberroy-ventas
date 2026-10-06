import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { HEIGHT, WIDTH } from "../theme";

export type CameraKey = {
  frame: number;
  /** Nivel de zoom (1 = pantalla completa). */
  scale: number;
  /** Punto de la pantalla (coordenadas 1920x1080) que queda al centro. */
  x?: number;
  y?: number;
};

const ease = Easing.bezier(0.65, 0, 0.35, 1);

/**
 * "Cámara" de grabación de pantalla: acerca y desplaza suavemente el
 * contenido con transform: translate() scale().
 */
export const Camera: React.FC<{
  keys: CameraKey[];
  frameOffset?: number;
  children: React.ReactNode;
}> = ({ keys, frameOffset = 0, children }) => {
  const frame = useCurrentFrame() - frameOffset;
  const ks = keys.map((k) => ({ x: WIDTH / 2, y: HEIGHT / 2, ...k }));
  const frames = ks.map((k) => k.frame);

  const at = (prop: "scale" | "x" | "y") => {
    if (ks.length === 1) return ks[0][prop];
    return interpolate(
      frame,
      frames,
      ks.map((k) => k[prop]),
      { easing: ease, extrapolateLeft: "clamp", extrapolateRight: "clamp" },
    );
  };

  const s = at("scale");
  const cx = at("x");
  const cy = at("y");
  // Mantiene la pantalla siempre cubriendo el cuadro (sin bordes vacíos).
  const tx = Math.min(0, Math.max(WIDTH - WIDTH * s, WIDTH / 2 - cx * s));
  const ty = Math.min(0, Math.max(HEIGHT - HEIGHT * s, HEIGHT / 2 - cy * s));

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          width: WIDTH,
          height: HEIGHT,
          transformOrigin: "0 0",
          transform: `translate(${tx}px, ${ty}px) scale(${s})`,
        }}
      >
        {children}
      </div>
    </div>
  );
};
