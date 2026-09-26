import React from "react";
import { colors } from "../theme";

/** Ícono genérico (círculo azul con un infinito). No es un logo oficial. */
export const GenericLogo: React.FC<{ size?: number }> = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 40 40">
    <circle cx={20} cy={20} r={20} fill={colors.blue} />
    <path
      d="M20 20c-2.6-3.6-4.6-5.2-7-5.2a5.2 5.2 0 0 0 0 10.4c2.4 0 4.4-1.6 7-5.2s4.6-5.2 7-5.2a5.2 5.2 0 0 1 0 10.4c-2.4 0-4.4-1.6-7-5.2z"
      fill="none"
      stroke="#fff"
      strokeWidth={2.6}
      strokeLinecap="round"
    />
  </svg>
);

/** Avatar del usuario (iniciales, sin foto). */
export const MyAvatar: React.FC<{ size?: number }> = ({ size = 36 }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: "50%",
      background: "linear-gradient(135deg, #3A7BFF, #7B5CFF)",
      color: "#fff",
      fontWeight: 700,
      fontSize: size * 0.4,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    }}
  >
    FR
  </div>
);

/** Avatar gris genérico para personas cuyos datos no se muestran. */
export const GrayAvatar: React.FC<{ size?: number }> = ({ size = 44 }) => (
  <svg width={size} height={size} viewBox="0 0 44 44" style={{ flexShrink: 0 }}>
    <circle cx={22} cy={22} r={22} fill="#C9CCD1" />
    <circle cx={22} cy={17} r={7.5} fill="#EEF0F2" />
    <path d="M8 38c2.5-7 8-10 14-10s11.5 3 14 10" fill="#EEF0F2" />
  </svg>
);

/** Texto difuminado. El contenido es siempre un marcador, nunca un dato real. */
export const Blurred: React.FC<{
  width?: number;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ width, children = "Xxxxxxx Xxxxx Xxxxxx", style }) => (
  <span
    style={{
      display: "inline-block",
      filter: "blur(6px)",
      width,
      whiteSpace: "nowrap",
      overflow: "hidden",
      userSelect: "none",
      ...style,
    }}
  >
    {children}
  </span>
);
