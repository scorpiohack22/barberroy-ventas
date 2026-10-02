import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C, FPS, GRAD, font } from "../theme";
import { N } from "../timing";
import { fadeIn, lerp, outExpo, prog, sp } from "../anim";
import { Kinetic } from "../components/UI";
import { Particles } from "../components/Stage";

const TRACK_Y = 1010;
const SPAN = 2600; // largo de la línea de tiempo en px
const MARKS = [
  { x: 0, label: "HOY" },
  { x: 650, label: "2027" },
  { x: 1300, label: "2030" },
  { x: 1950, label: "2035" },
  { x: 2500, label: "Algún día" },
];

const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/**
 * 25,5 – 29,65 s. "La IA no viene algún día, ya está aquí": una línea de
 * tiempo que viaja al futuro ("algún día") y regresa de golpe a HOY.
 */
export const F_Now: React.FC = () => {
  const t = useCurrentFrame() / FPS;

  // Viaje al futuro (lento) y regreso a HOY (latigazo en "ya")
  const fwd = prog(t, 25.55, N.algunDia + 0.2);
  const back = prog(t, N.ya - 0.04, N.ya + 0.32, outExpo);
  const pos = lerp(fwd, 0, 2500) * (1 - back);
  const vel = Math.abs(interpolate(t, [N.ya - 0.04, N.ya + 0.08, N.ya + 0.32], [0, 1, 0], cl));
  const camX = 540 - pos * 0.9; // la cámara sigue al marcador
  const markerX = pos;

  const here = sp(t, N.ya + 0.3, 10, 220);
  const ringP = prog(t, N.ya + 0.3, N.ya + 1.1, outExpo);

  return (
    <AbsoluteFill style={{ fontFamily: font }}>
      {/* Pista */}
      <div style={{ position: "absolute", left: 0, top: 0, transform: `translateX(${camX}px)`, filter: vel > 0.05 ? `blur(${vel * 14}px)` : undefined }}>
        <div style={{ position: "absolute", left: -400, top: TRACK_Y - 3, width: SPAN + 900, height: 6, borderRadius: 6, background: "rgba(255,255,255,0.12)" }} />
        <div style={{ position: "absolute", left: 0, top: TRACK_Y - 3, width: Math.max(0, markerX), height: 6, borderRadius: 6, background: GRAD }} />
        {new Array(53).fill(0).map((_, i) => (
          <div key={i} style={{ position: "absolute", left: i * 50, top: TRACK_Y + (i % 5 ? 18 : 12), width: 2, height: i % 5 ? 14 : 26, background: "rgba(255,255,255,0.18)" }} />
        ))}
        {MARKS.map((m, i) => {
          const isFuture = i === MARKS.length - 1;
          const isNow = i === 0;
          return (
            <div
              key={m.label}
              style={{
                position: "absolute",
                left: m.x - 200,
                width: 400,
                top: TRACK_Y + 70,
                textAlign: "center",
                fontSize: isNow ? 64 : isFuture ? 54 : 44,
                fontWeight: 800,
                color: isNow ? C.text : C.muted,
                opacity: isFuture ? 0.45 + 0.55 * fadeIn(t, N.algunDia - 0.1, 0.2) * (1 - back) : 1,
                filter: isFuture ? `blur(${2 * (1 - fwd)}px)` : undefined,
              }}
            >
              {m.label}
            </div>
          );
        })}
        {/* Marcador "IA" */}
        <div style={{ position: "absolute", left: markerX - 70, top: TRACK_Y - 70 - 120 }}>
          <div
            style={{
              width: 140,
              height: 140,
              borderRadius: "50%",
              background: GRAD,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 58,
              fontWeight: 900,
              color: "#fff",
              boxShadow: `0 0 60px rgba(61,123,255,0.8)`,
              transform: `scale(${0.8 + 0.2 * sp(t, N.ia - 0.05, 10, 200) + 0.15 * here})`,
            }}
          >
            IA
          </div>
          <div style={{ width: 4, height: 70, margin: "0 auto", background: C.cyan }} />
          {/* onda de llegada */}
          <div
            style={{
              position: "absolute",
              left: 70 - 160,
              top: 70 - 160,
              width: 320,
              height: 320,
              borderRadius: "50%",
              border: `4px solid ${C.cyan}`,
              transform: `scale(${0.4 + ringP * 1.4})`,
              opacity: (1 - ringP) * (t > N.ya + 0.3 ? 1 : 0),
            }}
          />
        </div>
      </div>

      <Kinetic
        t={t}
        at={N.ahi + 0.1}
        size={84}
        out={N.ya - 0.1}
        words={[{ w: "La" }, { w: "IA", hl: true }, { w: "no" }, { w: "viene" }, { w: "“algún" , at: N.algunDia - 0.05 }, { w: "día”", at: N.algunDia + 0.05 }]}
        style={{ left: 50, right: 50, top: 330 }}
      />
      <Kinetic
        t={t}
        at={N.ya}
        size={190}
        words={[{ w: "YA", at: N.ya - 0.02 }, { w: "ESTÁ", at: 28.45 }, { w: "AQUÍ", hl: true, at: N.aqui - 0.06 }]}
        style={{ left: 20, right: 20, top: 1260, lineHeight: 0.95 }}
      />
      <Particles t={t} seed="now" count={40} cx={540} cy={TRACK_Y - 120} spread={260} burst={N.ya + 0.3} color={C.cyan} opacity={t > N.ya + 0.3 ? 1 : 0} />
    </AbsoluteFill>
  );
};
