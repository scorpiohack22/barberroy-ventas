import React from "react";
import { C, font } from "../theme";

/** Teléfono genérico (sin marca). El contenido ocupa la pantalla completa. */
export const Phone: React.FC<{ w: number; children: React.ReactNode; style?: React.CSSProperties }> = ({
  w,
  children,
  style,
}) => {
  const h = w * 2.05;
  const b = w * 0.035;
  return (
    <div
      style={{
        position: "relative",
        width: w,
        height: h,
        borderRadius: w * 0.16,
        background: "linear-gradient(145deg, #2A2E38, #0D0F14 40%, #1C2029)",
        padding: b,
        boxSizing: "border-box",
        boxShadow:
          "0 60px 120px rgba(0,0,0,0.65), 0 0 0 1.5px rgba(255,255,255,0.12), inset 0 0 0 1px rgba(255,255,255,0.06)",
        ...style,
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          borderRadius: w * 0.13,
          overflow: "hidden",
          background: "#000",
        }}
      >
        {children}
        <div
          style={{
            position: "absolute",
            top: w * 0.03,
            left: "50%",
            width: w * 0.28,
            height: w * 0.075,
            marginLeft: -w * 0.14,
            borderRadius: 999,
            background: "#000",
          }}
        />
      </div>
    </div>
  );
};

/** Portátil genérico: pantalla + base. */
export const Laptop: React.FC<{ w: number; children: React.ReactNode; style?: React.CSSProperties }> = ({
  w,
  children,
  style,
}) => {
  const sh = w * 0.64;
  return (
    <div style={{ position: "relative", width: w, ...style }}>
      <div
        style={{
          width: w,
          height: sh,
          borderRadius: w * 0.03,
          background: "#0D0F14",
          padding: w * 0.018,
          boxSizing: "border-box",
          boxShadow: "0 0 0 1.5px rgba(255,255,255,0.14), 0 50px 100px rgba(0,0,0,0.6)",
        }}
      >
        <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", borderRadius: w * 0.012, background: "#0A0C12" }}>
          {children}
        </div>
      </div>
      <div
        style={{
          width: w * 1.16,
          marginLeft: -w * 0.08,
          height: w * 0.035,
          background: "linear-gradient(180deg, #3A3F4B, #1A1D24)",
          borderRadius: `0 0 ${w * 0.04}px ${w * 0.04}px`,
          boxShadow: "0 30px 60px rgba(0,0,0,0.6)",
        }}
      >
        <div style={{ width: w * 0.16, height: w * 0.01, margin: "0 auto", background: "#11131A", borderRadius: "0 0 8px 8px" }} />
      </div>
    </div>
  );
};

/** Barra superior de un post patrocinado en un feed genérico. */
export const FeedHeader: React.FC<{ w: number }> = ({ w }) => (
  <div
    style={{
      position: "absolute",
      left: 0,
      right: 0,
      top: 0,
      height: w * 0.36,
      display: "flex",
      alignItems: "flex-end",
      gap: w * 0.03,
      padding: `0 ${w * 0.05}px ${w * 0.04}px`,
      background: "linear-gradient(180deg, rgba(0,0,0,0.55), rgba(0,0,0,0))",
      fontFamily: font,
      color: "#fff",
      zIndex: 3,
    }}
  >
    <div style={{ width: w * 0.1, height: w * 0.1, borderRadius: "50%", background: "linear-gradient(135deg,#E9D3BF,#8C6A52)", border: "2px solid #fff" }} />
    <div>
      <div style={{ fontSize: w * 0.042, fontWeight: 700 }}>lumiere.paris</div>
      <div style={{ fontSize: w * 0.033, opacity: 0.85 }}>Patrocinado</div>
    </div>
  </div>
);

export const FeedFooter: React.FC<{ w: number; likes: string }> = ({ w, likes }) => (
  <div
    style={{
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      padding: `${w * 0.06}px ${w * 0.05}px ${w * 0.07}px`,
      background: "linear-gradient(0deg, rgba(0,0,0,0.65), rgba(0,0,0,0))",
      fontFamily: font,
      color: "#fff",
      zIndex: 3,
    }}
  >
    <div
      style={{
        height: w * 0.11,
        borderRadius: w * 0.025,
        background: "rgba(255,255,255,0.92)",
        color: "#111",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: `0 ${w * 0.04}px`,
        fontSize: w * 0.04,
        fontWeight: 700,
      }}
    >
      Comprar ahora <span style={{ color: C.blue }}>›</span>
    </div>
    <div style={{ display: "flex", gap: w * 0.05, marginTop: w * 0.04, fontSize: w * 0.04, fontWeight: 600 }}>
      <span>{likes} me gusta</span>
      <span style={{ opacity: 0.85 }}>1.204 comentarios</span>
    </div>
  </div>
);
