import React from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";
import { C, FPS, H, W } from "../theme";

/** Fondo vivo: cuadrícula en perspectiva, orbes de luz y viñeta. Nunca queda quieto. */
export const Background: React.FC<{ tint: string }> = ({ tint }) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  return (
    <AbsoluteFill style={{ background: C.bg, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left: -W * 0.5,
          right: -W * 0.5,
          top: H * 0.45,
          height: H,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.05) 1.5px, transparent 1.5px), linear-gradient(90deg, rgba(255,255,255,0.05) 1.5px, transparent 1.5px)",
          backgroundSize: "90px 90px",
          backgroundPosition: `0 ${(t * 40) % 90}px`,
          transform: "perspective(900px) rotateX(62deg)",
          transformOrigin: "50% 0%",
          maskImage: "linear-gradient(180deg, transparent 0%, #000 30%, #000 60%, transparent 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 1100,
          height: 1100,
          left: -300 + Math.sin(t * 0.35) * 120,
          top: 200 + Math.cos(t * 0.3) * 160,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${tint} 0%, rgba(0,0,0,0) 65%)`,
          opacity: 0.32,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 1000,
          height: 1000,
          right: -380 + Math.cos(t * 0.4) * 120,
          top: H * 0.35 + Math.sin(t * 0.33) * 120,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${C.violet} 0%, rgba(0,0,0,0) 65%)`,
          opacity: 0.22,
        }}
      />
    </AbsoluteFill>
  );
};

/** Grano fino + viñeta para dar acabado de cámara. */
export const Finish: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 75% 60% at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)" }} />
      <svg width={W} height={H} style={{ position: "absolute", opacity: 0.06, mixBlendMode: "overlay" }}>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={f % 8} />
        </filter>
        <rect width={W} height={H} filter="url(#grain)" />
      </svg>
    </AbsoluteFill>
  );
};

/** Partículas de brillo que flotan; `burst` (s) las dispara hacia afuera. */
export const Particles: React.FC<{
  t: number;
  count?: number;
  cx?: number;
  cy?: number;
  spread?: number;
  burst?: number;
  color?: string;
  seed?: string;
  opacity?: number;
}> = ({ t, count = 40, cx = W / 2, cy = H / 2, spread = 520, burst, color = C.cyan, seed = "p", opacity = 1 }) => {
  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity }}>
      {new Array(count).fill(0).map((_, i) => {
        const a = random(`${seed}a${i}`) * Math.PI * 2;
        const r0 = random(`${seed}r${i}`) * spread;
        const s = 3 + random(`${seed}s${i}`) * 6;
        const drift = t * (14 + random(`${seed}d${i}`) * 30);
        let r = r0;
        let op = 0.25 + 0.6 * random(`${seed}o${i}`);
        if (burst !== undefined && t >= burst) {
          const k = t - burst;
          r = r0 + k * 900 * (0.4 + random(`${seed}k${i}`));
          op *= interpolate(k, [0, 0.9], [1, 0], { extrapolateRight: "clamp" });
        }
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r - drift;
        const tw = 0.6 + 0.4 * Math.sin(t * 3 + i);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: s,
              height: s,
              borderRadius: "50%",
              background: color,
              boxShadow: `0 0 ${s * 3}px ${color}`,
              opacity: op * tw,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
