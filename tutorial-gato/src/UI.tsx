import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { C, FPS, font, shadow } from "./theme";
import { fadeIn, sp } from "./anim";

const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Texto que se va escribiendo entre `a` y `b` (s). */
export const typed = (t: number, a: number, b: number, text: string) =>
  text.slice(0, Math.floor(interpolate(t, [a, b], [0, text.length], cl)));

/** Entrada con resorte (escala + subida + opacidad). */
export const pop = (t: number, at: number, dist = 30): React.CSSProperties => {
  const p = sp(t, at, 13, 190);
  return { opacity: fadeIn(t, at, 0.1), transform: `translateY(${(1 - p) * dist}px) scale(${0.8 + 0.2 * p})` };
};

/** Foto a cuadro completo con zoom y paneo (nunca quieta). */
export const Photo: React.FC<{ src: string; z: number; x?: number; y?: number; focus?: string; style?: React.CSSProperties }> = ({
  src,
  z,
  x = 0,
  y = 0,
  focus = "50% 50%",
  style,
}) => (
  <div style={{ position: "absolute", inset: 0, overflow: "hidden", ...style }}>
    <Img
      src={staticFile(src)}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        objectPosition: focus,
        transformOrigin: focus,
        transform: `scale(${z}) translate(${x}%, ${y}%)`,
      }}
    />
  </div>
);

/** Fondo claro con manchas de color difuminadas (estilo SaaS). */
export const SoftBg: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  return (
    <AbsoluteFill style={{ background: C.bg, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: -200 + 40 * Math.sin(t * 0.5), top: -160, width: 800, height: 800, borderRadius: "50%", background: "rgba(139,92,246,0.16)", filter: "blur(120px)" }} />
      <div style={{ position: "absolute", right: -260, top: 500 + 50 * Math.cos(t * 0.4), width: 800, height: 800, borderRadius: "50%", background: "rgba(59,130,246,0.14)", filter: "blur(130px)" }} />
      <div style={{ position: "absolute", left: 100, bottom: -300, width: 900, height: 700, borderRadius: "50%", background: "rgba(212,255,63,0.22)", filter: "blur(130px)" }} />
    </AbsoluteFill>
  );
};

/** Píldora blanca flotante (etiquetas cortas). */
export const Pill: React.FC<{ children: React.ReactNode; style?: React.CSSProperties; dot?: string; dark?: boolean }> = ({ children, style, dot, dark }) => (
  <div
    style={{
      position: "absolute",
      display: "flex",
      alignItems: "center",
      gap: 14,
      padding: "18px 28px",
      borderRadius: 999,
      background: dark ? "rgba(14,17,22,0.88)" : "rgba(255,255,255,0.94)",
      color: dark ? "#fff" : C.text,
      boxShadow: shadow,
      fontFamily: font,
      fontSize: 32,
      fontWeight: 600,
      whiteSpace: "nowrap",
      ...style,
    }}
  >
    {dot ? <span style={{ width: 16, height: 16, borderRadius: "50%", background: dot, boxShadow: `0 0 0 6px ${dot}33` }} /> : null}
    {children}
  </div>
);

/** Marca: punto lima + "higgsfield". */
export const Wordmark: React.FC<{ size?: number; color?: string }> = ({ size = 40, color = C.text }) => (
  <div style={{ display: "flex", alignItems: "center", gap: size * 0.3, fontFamily: font, fontWeight: 800, fontSize: size, letterSpacing: -size * 0.03, color }}>
    <div style={{ width: size * 1.05, height: size * 1.05, borderRadius: size * 0.32, background: C.lime, display: "flex", alignItems: "center", justifyContent: "center", gap: size * 0.12 }}>
      <span style={{ width: size * 0.16, height: size * 0.3, borderRadius: 99, background: C.text }} />
      <span style={{ width: size * 0.16, height: size * 0.3, borderRadius: 99, background: C.text }} />
    </div>
    higgsfield
  </div>
);

export const Check: React.FC<{ size?: number; color?: string }> = ({ size = 28, color = C.text }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke={color} strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const Spark: React.FC<{ size?: number; color?: string }> = ({ size = 28, color = C.text }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path d="M12 2l2.2 6.3L20.5 10.5l-6.3 2.2L12 19l-2.2-6.3L3.5 10.5l6.3-2.2z" fill={color} />
  </svg>
);

export const Arrow: React.FC<{ size?: number; color?: string; dir?: "up" | "down" }> = ({ size = 28, color = "#fff", dir = "up" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ transform: dir === "down" ? "rotate(180deg)" : undefined }}>
    <path d="M12 19V5M5.5 11.5L12 5l6.5 6.5" fill="none" stroke={color} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Transición de entrada corta: zoom + desenfoque + flash suave. */
export const enter = (t: number, at: number, d = 0.16): React.CSSProperties => {
  const p = interpolate(t, [at, at + d], [0, 1], cl);
  const e = 1 - Math.pow(1 - p, 3);
  return { transform: `scale(${1.12 - 0.12 * e})`, filter: e < 1 ? `blur(${(1 - e) * 16}px)` : undefined };
};
