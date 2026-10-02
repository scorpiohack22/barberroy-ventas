import React from "react";
import { font } from "../theme";

/**
 * El "anuncio" del que habla la narración: un perfume de lujo en un estudio
 * cálido. Está construido en capas (fondo, producto, texto) para poder
 * separarlo en 2.5D, meter texto detrás del producto o "generarlo" desde ruido.
 */
export type AdPalette = {
  bgA: string;
  bgB: string;
  bgC: string;
  liquid: string;
  cap: string;
  brand: string;
  tagline: string;
};

export const PALETTES: AdPalette[] = [
  { bgA: "#F6E7D8", bgB: "#D6B191", bgC: "#5E4331", liquid: "#E2A15A", cap: "#C9A15A", brand: "LUMIÈRE", tagline: "Eau de Parfum" },
  { bgA: "#E3ECF7", bgB: "#8EA8C9", bgC: "#1F2B3F", liquid: "#7FB6E8", cap: "#C8D1DC", brand: "NORD", tagline: "Pour Homme" },
  { bgA: "#EFE6FA", bgB: "#B19AD9", bgC: "#2E2147", liquid: "#B88CF0", cap: "#D9CDEB", brand: "AURA", tagline: "Intense" },
  { bgA: "#E5F5EF", bgB: "#94CDB7", bgC: "#1B3A31", liquid: "#6FD3AE", cap: "#C3D9CF", brand: "VERDE", tagline: "Botanique" },
  { bgA: "#FBE7EA", bgB: "#E3A2AE", bgC: "#4A2029", liquid: "#F08AA0", cap: "#E6C0C7", brand: "ROSÉ", tagline: "Eau Fraîche" },
  { bgA: "#F2F2F2", bgB: "#B8B8B8", bgC: "#1A1A1A", liquid: "#D9D9D9", cap: "#2A2A2A", brand: "MONO", tagline: "Édition Noire" },
];

export const AdBackground: React.FC<{ p: AdPalette; style?: React.CSSProperties }> = ({ p, style }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      background: `radial-gradient(ellipse 80% 55% at 50% 38%, ${p.bgA} 0%, ${p.bgB} 55%, ${p.bgC} 100%)`,
      ...style,
    }}
  >
    {/* Piso del estudio (ciclorama) */}
    <div
      style={{
        position: "absolute",
        left: "-10%",
        right: "-10%",
        top: "66%",
        bottom: 0,
        background: `linear-gradient(180deg, ${p.bgB} 0%, ${p.bgC} 100%)`,
        borderRadius: "50% 50% 0 0 / 14% 14% 0 0",
        opacity: 0.85,
      }}
    />
    {/* Haz de luz suave */}
    <div
      style={{
        position: "absolute",
        left: "8%",
        top: "-10%",
        width: "45%",
        height: "90%",
        background: "linear-gradient(180deg, rgba(255,255,255,0.55), rgba(255,255,255,0))",
        transform: "rotate(-18deg)",
        filter: "blur(30px)",
        opacity: 0.7,
      }}
    />
  </div>
);

export const Bottle: React.FC<{ p: AdPalette; size: number }> = ({ p, size }) => {
  const id = p.brand.replace(/[^A-Z]/gi, "");
  return (
    <svg width={size} height={size * 1.6} viewBox="0 0 200 320" style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={`glass-${id}`} x1="0" x2="1">
          <stop offset="0" stopColor="rgba(255,255,255,0.55)" />
          <stop offset="0.25" stopColor="rgba(255,255,255,0.12)" />
          <stop offset="0.75" stopColor="rgba(255,255,255,0.06)" />
          <stop offset="1" stopColor="rgba(255,255,255,0.45)" />
        </linearGradient>
        <linearGradient id={`liq-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.liquid} stopOpacity={0.75} />
          <stop offset="1" stopColor={p.liquid} stopOpacity={1} />
        </linearGradient>
        <linearGradient id={`cap-${id}`} x1="0" x2="1">
          <stop offset="0" stopColor={p.cap} />
          <stop offset="0.45" stopColor="#FFFFFF" stopOpacity={0.85} />
          <stop offset="1" stopColor={p.cap} />
        </linearGradient>
      </defs>
      {/* sombra */}
      <ellipse cx={100} cy={312} rx={92} ry={10} fill="rgba(0,0,0,0.35)" />
      {/* tapa */}
      <rect x={62} y={8} width={76} height={62} rx={10} fill={`url(#cap-${id})`} />
      <rect x={84} y={70} width={32} height={22} fill={p.cap} opacity={0.9} />
      {/* cuerpo */}
      <rect x={18} y={90} width={164} height={222} rx={30} fill={`url(#liq-${id})`} />
      <rect x={18} y={90} width={164} height={222} rx={30} fill={`url(#glass-${id})`} stroke="rgba(255,255,255,0.6)" strokeWidth={2} />
      <rect x={30} y={104} width={14} height={180} rx={7} fill="rgba(255,255,255,0.55)" />
      {/* etiqueta */}
      <rect x={58} y={176} width={84} height={58} rx={6} fill="rgba(255,255,255,0.78)" />
      <text x={100} y={203} textAnchor="middle" fontFamily={font} fontWeight={700} fontSize={13} letterSpacing={2.5} fill="#2A2A2A">
        {p.brand}
      </text>
      <text x={100} y={221} textAnchor="middle" fontFamily={font} fontSize={8} letterSpacing={1.5} fill="#555">
        {p.tagline.toUpperCase()}
      </text>
    </svg>
  );
};

export const AdProduct: React.FC<{ p: AdPalette; w: number; h: number; style?: React.CSSProperties }> = ({
  p,
  w,
  h,
  style,
}) => (
  <div
    style={{
      position: "absolute",
      left: 0,
      right: 0,
      top: h * 0.3,
      display: "flex",
      justifyContent: "center",
      ...style,
    }}
  >
    <Bottle p={p} size={w * 0.36} />
  </div>
);

export const AdText: React.FC<{ p: AdPalette; w: number; h: number; top?: number; style?: React.CSSProperties }> = ({
  p,
  w,
  h,
  top = 0.07,
  style,
}) => (
  <div
    style={{
      position: "absolute",
      left: 0,
      right: 0,
      top: h * top,
      textAlign: "center",
      fontFamily: font,
      color: "#fff",
      textShadow: "0 2px 20px rgba(0,0,0,0.25)",
      ...style,
    }}
  >
    <div style={{ fontSize: w * 0.12, fontWeight: 300, letterSpacing: w * 0.02 }}>{p.brand}</div>
    <div style={{ fontSize: w * 0.032, letterSpacing: w * 0.012, marginTop: w * 0.01, opacity: 0.9 }}>
      {p.tagline.toUpperCase()}
    </div>
  </div>
);

/** Anuncio completo. `between` se dibuja entre el fondo y el producto. */
export const Ad: React.FC<{
  w: number;
  h: number;
  palette?: number;
  between?: React.ReactNode;
  radius?: number;
  hideText?: boolean;
  textTop?: number;
  style?: React.CSSProperties;
}> = ({ w, h, palette = 0, between, radius = 0, hideText, textTop, style }) => {
  const p = PALETTES[palette % PALETTES.length];
  return (
    <div style={{ position: "relative", width: w, height: h, overflow: "hidden", borderRadius: radius, ...style }}>
      <AdBackground p={p} />
      {hideText ? null : <AdText p={p} w={w} h={h} top={textTop} />}
      {between}
      <AdProduct p={p} w={w} h={h} />
    </div>
  );
};
