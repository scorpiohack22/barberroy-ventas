import React from "react";
import { C, GRAD, font, glass } from "../theme";
import { fadeIn, outExpo, prog } from "../anim";

export const Glass: React.FC<{ style?: React.CSSProperties; children?: React.ReactNode }> = ({ style, children }) => (
  <div style={{ ...glass, position: "absolute", fontFamily: font, color: C.text, ...style }}>{children}</div>
);

export const fmt = (n: number) => Math.round(n).toLocaleString("es-CO");

/**
 * Texto protagonista: cada palabra entra con máscara (sube desde abajo).
 * `words` con `hl: true` usan el degradado de acento.
 */
export const Kinetic: React.FC<{
  t: number;
  at: number;
  words: { w: string; hl?: boolean; at?: number }[];
  size: number;
  style?: React.CSSProperties;
  out?: number;
  stagger?: number;
  align?: "center" | "left";
}> = ({ t, at, words, size, style, out, stagger = 0.07, align = "center" }) => {
  const o = out !== undefined ? 1 - prog(t, out, out + 0.18) : 1;
  return (
    <div
      style={{
        position: "absolute",
        fontFamily: font,
        fontWeight: 800,
        fontSize: size,
        lineHeight: 1.0,
        letterSpacing: -size * 0.045,
        color: C.text,
        textAlign: align,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: align === "center" ? "center" : "flex-start",
        columnGap: size * 0.24,
        rowGap: size * 0.02,
        opacity: o,
        ...style,
      }}
    >
      {words.map((x, i) => {
        const start = x.at ?? at + i * stagger;
        const p = prog(t, start, start + 0.42, outExpo);
        return (
          <span key={i} style={{ display: "inline-block", overflow: "hidden", padding: `0 ${size * 0.04}px ${size * 0.12}px`, margin: `0 0 -${size * 0.12}px` }}>
            <span
              style={{
                display: "inline-block",
                transform: `translateY(${(1 - p) * 110}%) rotate(${(1 - p) * 6}deg)`,
                opacity: fadeIn(t, start, 0.08),
                ...(x.hl
                  ? { backgroundImage: GRAD, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }
                  : {}),
              }}
            >
              {x.w}
            </span>
          </span>
        );
      })}
    </div>
  );
};

/** Etiqueta pequeña tipo "pill". */
export const Pill: React.FC<{ children: React.ReactNode; style?: React.CSSProperties; dot?: string }> = ({
  children,
  style,
  dot,
}) => (
  <div
    style={{
      position: "absolute",
      display: "flex",
      alignItems: "center",
      gap: 14,
      padding: "14px 26px",
      borderRadius: 999,
      background: "rgba(255,255,255,0.08)",
      border: `1px solid ${C.stroke}`,
      backdropFilter: "blur(14px)",
      fontFamily: font,
      fontSize: 30,
      fontWeight: 600,
      color: C.text,
      whiteSpace: "nowrap",
      ...style,
    }}
  >
    {dot ? <span style={{ width: 14, height: 14, borderRadius: "50%", background: dot, boxShadow: `0 0 16px ${dot}` }} /> : null}
    {children}
  </div>
);

/** Barra de progreso con brillo. */
export const Progress: React.FC<{ p: number; w: number; style?: React.CSSProperties }> = ({ p, w, style }) => (
  <div style={{ width: w, height: 12, borderRadius: 99, background: "rgba(255,255,255,0.08)", overflow: "hidden", ...style }}>
    <div style={{ width: `${p * 100}%`, height: "100%", background: GRAD, borderRadius: 99, boxShadow: `0 0 20px ${C.blue}` }} />
  </div>
);

/** Línea SVG que se dibuja de A a B (curva suave). */
export const Wire: React.FC<{
  from: [number, number];
  to: [number, number];
  p: number;
  color?: string;
  bend?: number;
}> = ({ from, to, p, color = C.cyan, bend = 0.35 }) => {
  const [x1, y1] = from;
  const [x2, y2] = to;
  const mx = (x1 + x2) / 2;
  const d = `M${x1},${y1} C${x1 + (mx - x1) * bend * 2},${y1} ${x2 - (x2 - mx) * bend * 2},${y2} ${x2},${y2}`;
  const len = Math.hypot(x2 - x1, y2 - y1) * 1.25;
  return (
    <svg style={{ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none" }} width={1} height={1}>
      <path d={d} fill="none" stroke={color} strokeOpacity={0.25} strokeWidth={6} strokeDasharray={len} strokeDashoffset={len * (1 - p)} style={{ filter: "blur(4px)" }} />
      <path d={d} fill="none" stroke={color} strokeWidth={2.5} strokeDasharray={len} strokeDashoffset={len * (1 - p)} strokeLinecap="round" />
    </svg>
  );
};
