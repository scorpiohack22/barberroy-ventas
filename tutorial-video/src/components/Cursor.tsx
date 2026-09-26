import React from "react";
import {
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type CursorPoint = {
  /** Frame (local a la escena) en el que el cursor llega a este punto. */
  frame: number;
  x: number;
  y: number;
  /** Si es true, hace clic al llegar. */
  click?: boolean;
};

const CLICK_FRAMES = 16;

/**
 * Cursor tipo flecha (blanco con borde negro). Se mueve con spring entre
 * coordenadas y muestra un círculo que se expande y se desvanece al hacer clic.
 */
export const Cursor: React.FC<{ points: CursorPoint[]; frameOffset?: number }> = ({
  points,
  frameOffset = 0,
}) => {
  const frame = useCurrentFrame() - frameOffset;
  const { fps } = useVideoConfig();

  let x = points[0].x;
  let y = points[0].y;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const next = points[i];
    // Se queda quieto un momento tras cada punto y luego viaja al siguiente.
    const gap = next.frame - prev.frame;
    const travel = Math.max(6, Math.min(26, Math.round(gap * 0.6)));
    const start = next.frame - travel;
    if (frame < start) break;
    const p = spring({
      frame: frame - start,
      fps,
      durationInFrames: travel,
      config: { damping: 200, stiffness: 120, mass: 0.8 },
    });
    // Pequeña curva en el recorrido para que parezca una mano real.
    const arc = Math.sin(p * Math.PI) * Math.min(40, Math.abs(next.x - prev.x) * 0.06);
    x = interpolate(p, [0, 1], [prev.x, next.x]);
    y = interpolate(p, [0, 1], [prev.y, next.y]) - arc;
  }

  const clicks = points.filter((p) => p.click);
  let press = 1;
  const ripples: React.ReactNode[] = [];
  for (const c of clicks) {
    const t = frame - c.frame;
    if (t >= -3 && t <= 4) {
      press = Math.min(
        press,
        interpolate(t, [-3, 0, 4], [1, 0.82, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
      );
    }
    if (t >= 0 && t <= CLICK_FRAMES) {
      const e = interpolate(t, [0, CLICK_FRAMES], [0, 1], {
        easing: Easing.out(Easing.cubic),
      });
      ripples.push(
        <div
          key={c.frame}
          style={{
            position: "absolute",
            left: c.x - 34,
            top: c.y - 34,
            width: 68,
            height: 68,
            borderRadius: "50%",
            background: "rgba(8,102,255,0.28)",
            border: "3px solid rgba(8,102,255,0.75)",
            transform: `scale(${0.2 + e * 1.1})`,
            opacity: 1 - e,
          }}
        />,
      );
    }
  }

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1000 }}>
      {ripples}
      <svg
        width={34}
        height={44}
        viewBox="0 0 34 44"
        style={{
          position: "absolute",
          left: x - 3,
          top: y - 2,
          transform: `scale(${press})`,
          transformOrigin: "3px 2px",
          filter: "drop-shadow(0 3px 4px rgba(0,0,0,0.35))",
        }}
      >
        <path
          d="M3 2 L3 34 L11 26.5 L16.5 39.5 L22 37 L16.6 24.4 L27.5 24.4 Z"
          fill="#FFFFFF"
          stroke="#000000"
          strokeWidth={2.2}
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};
