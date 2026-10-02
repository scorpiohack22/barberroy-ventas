import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C, FPS, H, W, font } from "../theme";
import { N } from "../timing";
import { fadeIn, fadeOut, lerp, outExpo, prog, sp } from "../anim";
import { AdBackground, AdProduct, AdText, PALETTES } from "../components/Ad";
import { Kinetic, Pill } from "../components/UI";

const P = PALETTES[0];
const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Esquinas de visor de cámara. */
const Corners: React.FC<{ x: number; y: number; w: number; h: number; color: string; len?: number; th?: number }> = ({
  x,
  y,
  w,
  h,
  color,
  len = 70,
  th = 5,
}) => {
  const c = (l: number, t: number, r: number, b: number): React.CSSProperties => ({
    position: "absolute",
    width: len,
    height: len,
    borderColor: color,
    borderStyle: "solid",
    borderWidth: `${t}px ${r}px ${b}px ${l}px`,
  });
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h }}>
      <div style={{ ...c(th, th, 0, 0), left: 0, top: 0 }} />
      <div style={{ ...c(0, th, th, 0), right: 0, top: 0 }} />
      <div style={{ ...c(th, 0, 0, th), left: 0, bottom: 0 }} />
      <div style={{ ...c(0, 0, th, th), right: 0, bottom: 0 }} />
    </div>
  );
};

/**
 * 8,1 – 13,5 s. "Todo se veía demasiado real" (visor de cámara, texto
 * detrás del producto) → "cuando descubrí cómo lo habían hecho": escaneo y
 * despiece 2.5D del anuncio en capas → impacto en "creer".
 */
export const B_Reveal: React.FC = () => {
  const t = useCurrentFrame() / FPS;

  // Cámara: empuje lento + paneo
  const push = lerp(prog(t, 8.0, 9.8), 1.0, 1.1);
  const vf = fadeIn(t, 8.2, 0.15) * fadeOut(t, N.pero, 0.2);

  // Foco que persigue el producto
  const af = prog(t, 8.35, 8.95, outExpo);
  const fx = lerp(af, 150, 285);
  const fy = lerp(af, 260, 325);
  const fw = lerp(af, 780, 520);
  const fh = lerp(af, 1300, 1060);
  const locked = t > 8.95;

  // Escaneo y despiece
  const scan = prog(t, 10.05, 11.35, (x) => x);
  const ex = prog(t, 11.15, 12.5, outExpo);
  const snap = sp(t, N.creer, 9, 260);
  const kick = Math.sin(Math.min(1, snap) * Math.PI) * 0.035;

  const rotX = 24 * ex;
  const rotY = -40 * ex;
  const sc = lerp(ex, push, 0.55) * (1 + kick);
  const gap = 420 * ex;
  const frame = (color: string): React.CSSProperties => ({
    position: "absolute",
    inset: 0,
    borderRadius: 40,
    border: `4px solid ${color}`,
    background: `${color}14`,
    opacity: ex,
  });

  const wire = (z: number): React.CSSProperties => ({
    position: "absolute",
    inset: 0,
    transform: `translateZ(${z}px)`,
    transformStyle: "preserve-3d",
  });

  const scanY = scan * H;
  // Encuadre común de la foto y del recorte (así el producto queda alineado)
  const shot = { z: 1.06 + 0.05 * prog(t, 8.1, 13.5, (x) => x), x: -0.6 + 1.2 * prog(t, 8.1, 13.5, (x) => x), y: 0 };
  const showWire = t > 10.05;

  const label = (txt: string, at: number, style: React.CSSProperties) => (
    <Pill dot={C.cyan} style={{ fontSize: 34, opacity: fadeIn(t, at, 0.2) * fadeOut(t, 13.25, 0.2), transform: `translateX(${(1 - prog(t, at, at + 0.4, outExpo)) * -60}px)`, ...style }}>
      {txt}
    </Pill>
  );

  return (
    <AbsoluteFill style={{ perspective: 2200 }}>
      <AbsoluteFill
        style={{
          transform: `scale(${sc}) rotateX(${rotX}deg) rotateY(${rotY}deg)`,
          transformStyle: "preserve-3d",
        }}
      >
        {/* Capa 1: fondo */}
        <div style={wire(-gap)}>
          <AdBackground
            p={P}
            frame={shot}
            style={{ borderRadius: 40 * ex, boxShadow: ex > 0 ? `0 0 0 ${3 * ex}px rgba(61,217,245,0.6)` : undefined }}
            imgStyle={{ filter: ex > 0 ? `blur(${10 * ex}px) brightness(${1 - 0.25 * ex})` : undefined }}
          />
          {/* "DEMASIADO REAL" entre el fondo y el producto */}
          <Kinetic t={t} at={N.demasiado - 0.05} size={130} out={N.pero - 0.05} words={[{ w: "DEMASIADO" }]} style={{ left: 0, right: 0, top: 420, color: "#2A1B12" }} />
          <Kinetic t={t} at={N.real - 0.08} size={340} out={N.pero - 0.05} words={[{ w: "REAL" }]} style={{ left: 0, right: 0, top: 1170, color: "#2A1B12" }} />
        </div>
        {/* Capa 2: producto */}
        <div style={wire(0)}>
          <div style={frame(C.cyan)} />
          <AdProduct p={P} frame={shot} imgStyle={{ filter: `drop-shadow(0 ${30 * ex}px ${40 * ex}px rgba(0,0,0,${0.5 * ex}))` }} />
        </div>
        {/* Capa 3: texto y luz */}
        <div style={wire(gap)}>
          <div style={frame(C.violet)} />
          <AdText p={P} w={W} h={H} top={0.06} style={{ opacity: ex }} />
        </div>

        {/* Versión "wireframe": por encima de la línea de escaneo */}
        {showWire ? (
          <AbsoluteFill style={{ clipPath: `inset(0 0 ${H - scanY}px 0)`, transform: `translateZ(${gap + 2}px)`, opacity: fadeOut(t, 11.3, 0.3) }}>
            <AbsoluteFill style={{ background: "rgba(6,8,14,0.72)" }} />
            <AbsoluteFill
              style={{
                backgroundImage:
                  "linear-gradient(rgba(61,217,245,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(61,217,245,0.35) 1px, transparent 1px)",
                backgroundSize: "60px 60px",
              }}
            />
            <div style={{ position: "absolute", left: 295, top: 339, width: 506, height: 1034, border: `3px solid ${C.cyan}`, borderRadius: 60 }} />
            <div style={{ position: "absolute", left: 100, top: 100, width: 880, height: 200, border: `3px dashed ${C.violet}`, borderRadius: 14 }} />
          </AbsoluteFill>
        ) : null}
      </AbsoluteFill>

      {/* Línea de escaneo */}
      {t > 10.05 && t < 11.4 ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: scanY - 3,
            height: 6,
            background: C.cyan,
            boxShadow: `0 0 30px 10px rgba(61,217,245,0.55)`,
          }}
        />
      ) : null}

      {/* Visor de cámara */}
      <AbsoluteFill style={{ opacity: vf, fontFamily: font, color: "#fff" }}>
        <Corners x={50} y={250} w={W - 100} h={H - 500} color="rgba(255,255,255,0.85)" />
        <div style={{ position: "absolute", left: 90, top: 290, display: "flex", alignItems: "center", gap: 14, fontSize: 32, fontWeight: 700 }}>
          <span style={{ width: 20, height: 20, borderRadius: "50%", background: "#FF3B4E", opacity: Math.floor(t * 3) % 2 ? 1 : 0.25 }} />
          REC 00:00:{String(Math.floor(t)).padStart(2, "0")}
        </div>
        <div style={{ position: "absolute", right: 90, top: 290, fontSize: 28, fontWeight: 600, opacity: 0.9 }}>4K · 24 FPS</div>
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 300, textAlign: "center", fontSize: 26, letterSpacing: 3, opacity: 0.85 }}>
          ISO 100 · 1/125 · f/2.8
        </div>
        <Corners x={fx} y={fy} w={fw} h={fh} color={locked ? C.green : "#FFD34D"} len={40} th={4} />
        {locked ? (
          <div style={{ position: "absolute", left: fx, top: fy - 52, fontSize: 28, fontWeight: 700, color: C.green }}>AF ●</div>
        ) : null}
      </AbsoluteFill>

      {/* Etiquetas del despiece */}
      {label("Capa 1 · Fondo", 11.55, { left: 50, top: 1560 })}
      {label("Capa 2 · Producto", 11.75, { left: 50, top: 1660 })}
      {label("Capa 3 · Luz y texto", 11.95, { left: 50, top: 1760 })}

      <Kinetic
        t={t}
        at={N.descubri + 0.15}
        size={104}
        out={13.25}
        words={[{ w: "¿Cómo" }, { w: "lo" }, { w: "hicieron?", hl: true }]}
        style={{ left: 40, right: 40, top: 150 }}
      />

      {/* Destello en "creer" */}
      <AbsoluteFill
        style={{
          background: "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.7), rgba(61,123,255,0.25) 40%, rgba(0,0,0,0) 70%)",
          opacity: interpolate(t, [N.creer - 0.02, N.creer + 0.04, N.creer + 0.45], [0, 0.9, 0], cl),
        }}
      />
    </AbsoluteFill>
  );
};
