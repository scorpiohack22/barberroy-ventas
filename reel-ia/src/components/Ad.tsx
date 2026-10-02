import React from "react";
import { Img, random, staticFile, useCurrentFrame } from "remotion";
import { FPS, font } from "../theme";

/**
 * El "anuncio" del que habla la narración: un perfume de lujo fotografiado
 * (imágenes generadas con Higgsfield Soul 2.0 en public/img/). Está construido
 * en capas (foto de fondo, producto recortado, texto) para poder separarlo en
 * 2.5D, meter texto detrás del producto o "generarlo" desde ruido.
 */
export type AdPalette = {
  img: string;
  /** Recorte del producto con fondo transparente, alineado 1:1 con `img`. */
  cut?: string;
  brand: string;
  tagline: string;
};

export const PALETTES: AdPalette[] = [
  { img: "img/perfume-hero.jpg", cut: "img/perfume-hero-cut.png", brand: "LUMIÈRE", tagline: "Eau de Parfum" },
  { img: "img/variacion-2.jpg", brand: "NORD", tagline: "Pour Homme" },
  { img: "img/variacion-3.jpg", brand: "AURA", tagline: "Intense" },
  { img: "img/variacion-4.jpg", brand: "VERDE", tagline: "Botanique" },
  { img: "img/variacion-5.jpg", brand: "ROSÉ", tagline: "Eau Fraîche" },
  { img: "img/variacion-6.jpg", brand: "MONO", tagline: "Édition Noire" },
  { img: "img/variacion-1.jpg", brand: "SOLEIL", tagline: "Ambre Doré" },
];

/** Encuadre de una foto: zoom y desplazamiento (en % del cuadro). */
export type Frame = { z: number; x: number; y: number };

/**
 * Movimiento de cámara por defecto (Ken Burns): la foto nunca está quieta ni
 * completa. Cada `seed` deriva hacia un lado distinto.
 */
export const drift = (t: number, seed: string, amp = 1): Frame => {
  const r = random(seed);
  return {
    z: 1.14 + 0.06 * amp * Math.sin(t * 0.55 + r * 6),
    x: 2.2 * amp * Math.sin(t * 0.42 + r * 9),
    y: 1.8 * amp * Math.cos(t * 0.5 + r * 4),
  };
};

/** Foto a cuadro completo (object-fit: cover) con zoom y paneo. */
export const Photo: React.FC<{
  src: string;
  seed?: string;
  frame?: Frame;
  /** Punto de anclaje del recorte, p. ej. "50% 30%". */
  focus?: string;
  style?: React.CSSProperties;
  imgStyle?: React.CSSProperties;
}> = ({ src, seed, frame, focus = "50% 50%", style, imgStyle }) => {
  const t = useCurrentFrame() / FPS;
  const f = frame ?? drift(t, seed ?? src);
  return (
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
          transform: `scale(${f.z}) translate(${f.x}%, ${f.y}%)`,
          ...imgStyle,
        }}
      />
    </div>
  );
};

export const AdBackground: React.FC<{ p: AdPalette; frame?: Frame; seed?: string; style?: React.CSSProperties; imgStyle?: React.CSSProperties }> = ({
  p,
  frame,
  seed,
  style,
  imgStyle,
}) => <Photo src={p.img} frame={frame} seed={seed} style={style} imgStyle={imgStyle} />;

/** El producto recortado, alineado con la foto de fondo si comparten `frame`. */
export const AdProduct: React.FC<{ p: AdPalette; frame?: Frame; seed?: string; style?: React.CSSProperties; imgStyle?: React.CSSProperties }> = ({
  p,
  frame,
  seed,
  style,
  imgStyle,
}) => (p.cut ? <Photo src={p.cut} frame={frame} seed={seed ?? p.img} style={{ overflow: "visible", ...style }} imgStyle={imgStyle} /> : null);

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
      textShadow: "0 2px 24px rgba(60,40,20,0.45)",
      ...style,
    }}
  >
    <div style={{ fontSize: w * 0.12, fontWeight: 300, letterSpacing: w * 0.02 }}>{p.brand}</div>
    <div style={{ fontSize: w * 0.032, letterSpacing: w * 0.012, marginTop: w * 0.01, opacity: 0.9 }}>
      {p.tagline.toUpperCase()}
    </div>
  </div>
);

/** Anuncio completo. `between` se dibuja entre la foto y el producto recortado. */
export const Ad: React.FC<{
  w: number;
  h: number;
  palette?: number;
  between?: React.ReactNode;
  radius?: number;
  hideText?: boolean;
  textTop?: number;
  frame?: Frame;
  seed?: string;
  style?: React.CSSProperties;
  imgStyle?: React.CSSProperties;
}> = ({ w, h, palette = 0, between, radius = 0, hideText, textTop, frame, seed, style, imgStyle }) => {
  const p = PALETTES[palette % PALETTES.length];
  const s = seed ?? `${p.img}-${w}`;
  return (
    <div style={{ position: "relative", width: w, height: h, overflow: "hidden", borderRadius: radius, ...style }}>
      <AdBackground p={p} frame={frame} seed={s} imgStyle={imgStyle} />
      {hideText ? null : <AdText p={p} w={w} h={h} top={textTop} />}
      {between}
      {between ? <AdProduct p={p} frame={frame} seed={s} imgStyle={imgStyle} /> : null}
    </div>
  );
};
