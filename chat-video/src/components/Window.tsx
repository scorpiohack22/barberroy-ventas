import React from "react";
import { C, font, glass } from "../theme";

/** Ventana genérica de app (sin marca): barra de título con tres puntos. */
export const Window: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  bodyStyle?: React.CSSProperties;
}> = ({ x, y, w, h, title, children, style, bodyStyle }) => (
  <div
    style={{
      ...glass,
      position: "absolute",
      left: x,
      top: y,
      width: w,
      height: h,
      overflow: "hidden",
      fontFamily: font,
      color: C.text,
      ...style,
    }}
  >
    <div
      style={{
        height: 46,
        display: "flex",
        alignItems: "center",
        gap: 9,
        padding: "0 18px",
        borderBottom: `1px solid ${C.stroke}`,
        background: "rgba(255,255,255,0.03)",
      }}
    >
      {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
        <span key={c} style={{ width: 13, height: 13, borderRadius: "50%", background: c, opacity: 0.85 }} />
      ))}
      <div style={{ flex: 1, textAlign: "center", fontSize: 16, color: C.muted, fontWeight: 600, marginRight: 60 }}>{title}</div>
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, top: 46, bottom: 0, ...bodyStyle }}>{children}</div>
  </div>
);

/** Burbuja de chat. */
export const Bubble: React.FC<{ me?: boolean; children: React.ReactNode; style?: React.CSSProperties }> = ({
  me,
  children,
  style,
}) => (
  <div style={{ display: "flex", justifyContent: me ? "flex-end" : "flex-start", marginBottom: 18, ...style }}>
    {!me ? (
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          marginRight: 12,
          flexShrink: 0,
          background: "linear-gradient(135deg, #3DD9F5, #8F6BFF)",
        }}
      />
    ) : null}
    <div
      style={{
        maxWidth: "78%",
        padding: "16px 20px",
        borderRadius: me ? "20px 20px 6px 20px" : "20px 20px 20px 6px",
        background: me ? "rgba(61,123,255,0.22)" : "rgba(255,255,255,0.06)",
        border: `1px solid ${me ? "rgba(61,123,255,0.45)" : C.stroke}`,
        fontSize: 21,
        lineHeight: 1.45,
        color: C.text,
      }}
    >
      {children}
    </div>
  </div>
);

/** Texto que se escribe letra por letra entre a y b (s). */
export const typed = (t: number, a: number, b: number, s: string) => {
  const k = Math.max(0, Math.min(1, (t - a) / (b - a)));
  return s.slice(0, Math.floor(k * s.length));
};

export const Caret: React.FC<{ t: number; color?: string; h?: number }> = ({ t, color = C.cyan, h = 24 }) => (
  <span
    style={{
      display: "inline-block",
      width: 3,
      height: h,
      marginLeft: 3,
      verticalAlign: "middle",
      background: color,
      opacity: Math.floor(t * 3) % 2 ? 1 : 0.2,
    }}
  />
);
