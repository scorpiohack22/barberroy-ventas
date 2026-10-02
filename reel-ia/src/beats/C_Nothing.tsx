import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C, FPS, GRAD } from "../theme";
import { N } from "../timing";
import { fadeIn, outExpo, popIn, prog, sp } from "../anim";
import { Glass, Pill, fmt } from "../components/UI";
import { ICamera, IPerson, IPin } from "../components/Icons";
import { Particles } from "../components/Stage";

const ROWS = [
  { at: N.noModelos, label: "Modelos", value: 48000, Icon: IPerson, y: 520 },
  { at: N.noCamaras, label: "Cámaras y equipo", value: 62000, Icon: ICamera, y: 800 },
  { at: N.locacion, label: "Locaciones", value: 75000, Icon: IPin, y: 1080 },
];

const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/**
 * 13,5 – 18,4 s. "No había modelos, no había cámaras, ni siquiera existía
 * esa locación": las mismas partidas del presupuesto se tachan una a una y
 * el costo total cae a $0.
 */
export const C_Nothing: React.FC = () => {
  const t = useCurrentFrame() / FPS;

  // Total que baja por escalones, sincronizado con cada "no había"
  let total = 185000;
  for (const r of ROWS) {
    total -= r.value * prog(t, r.at, r.at + 0.45, outExpo);
  }
  const zero = t > N.locacion + 0.45;
  const drift = Math.sin(t * 0.9) * 0.8;
  const push = 1 + prog(t, 13.5, 18.4, (x) => x) * 0.05;

  return (
    <AbsoluteFill style={{ transform: `scale(${push}) rotate(${drift}deg)` }}>
      <Pill dot={C.red} style={{ left: 0, right: 0, margin: "0 auto", width: "fit-content", top: 300, ...popIn(t, 13.55) }}>
        Lo que en realidad costó producirlo
      </Pill>

      {ROWS.map((r, i) => {
        const strike = prog(t, r.at, r.at + 0.32, outExpo);
        const gone = r.label === "Locaciones";
        const dissolve = gone ? prog(t, r.at + 0.1, r.at + 0.6) : 0;
        const shake = Math.sin((t - r.at) * 60) * 8 * interpolate(t, [r.at, r.at + 0.25], [1, 0], cl) * (t > r.at ? 1 : 0);
        const v = r.value * (1 - prog(t, r.at, r.at + 0.4, outExpo));
        return (
          <React.Fragment key={r.label}>
            <Glass
              style={{
                left: 110,
                top: r.y,
                width: 860,
                height: 230,
                padding: "0 46px",
                display: "flex",
                alignItems: "center",
                gap: 30,
                ...popIn(t, 13.6 + i * 0.08, 120),
                opacity: fadeIn(t, 13.6 + i * 0.08, 0.15) * (1 - 0.45 * strike) * (1 - dissolve),
                translate: `${shake}px 0`,
                filter: dissolve > 0 ? `blur(${dissolve * 14}px)` : undefined,
              }}
            >
              <div style={{ width: 104, height: 104, borderRadius: 28, background: "rgba(61,123,255,0.16)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <r.Icon size={54} color={strike > 0.5 ? C.muted : C.cyan} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 46, fontWeight: 800 }}>{r.label}</div>
                <div style={{ fontSize: 30, fontWeight: 600, color: strike > 0.5 ? C.red : C.muted, marginTop: 6 }}>
                  {strike > 0.5 ? (gone ? "Nunca existió" : "No había") : "Producción"}
                </div>
              </div>
              <div style={{ fontSize: 54, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>${fmt(v)}</div>
              {/* Tachado */}
              <div
                style={{
                  position: "absolute",
                  left: 30,
                  top: 113,
                  height: 6,
                  width: `${strike * 92}%`,
                  borderRadius: 6,
                  background: C.red,
                  boxShadow: `0 0 18px ${C.red}`,
                }}
              />
            </Glass>
            {gone ? (
              <div
                style={{
                  position: "absolute",
                  left: 110,
                  top: r.y,
                  width: 860,
                  height: 230,
                  borderRadius: 28,
                  border: `3px dashed rgba(255,92,122,0.6)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "Inter, sans-serif",
                  fontSize: 44,
                  fontWeight: 800,
                  color: C.red,
                  opacity: prog(t, r.at + 0.35, r.at + 0.6),
                }}
              >
                La locación nunca existió
              </div>
            ) : null}
            {gone ? (
              <Particles t={t} seed="loc" count={34} cx={540} cy={r.y + 115} spread={300} burst={r.at + 0.08} color={C.cyan} opacity={t > r.at ? 1 : 0} />
            ) : null}
          </React.Fragment>
        );
      })}

      {/* Total */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 1420,
          textAlign: "center",
          fontFamily: "Inter, sans-serif",
          color: C.text,
          ...popIn(t, 13.75, 80),
        }}
      >
        <div style={{ fontSize: 34, fontWeight: 600, color: C.muted, letterSpacing: 4 }}>COSTO TOTAL</div>
        <div
          style={{
            fontSize: zero ? 250 : 180,
            fontWeight: 800,
            letterSpacing: -8,
            fontVariantNumeric: "tabular-nums",
            transform: `scale(${zero ? 0.92 + 0.08 * sp(t, N.locacion + 0.45, 10, 220) : 1})`,
            ...(zero ? { backgroundImage: GRAD, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" } : {}),
          }}
        >
          ${fmt(total)}
        </div>
      </div>
    </AbsoluteFill>
  );
};
