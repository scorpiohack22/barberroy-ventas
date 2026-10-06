import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C, FPS, GRAD, font } from "../theme";
import { outExpo, popIn } from "../anim";
import { Kinetic, Pill } from "../components/UI";
import { Particles } from "../components/Stage";

const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const STATS = [
  { at: 52.3, n: 3, label: "videos" },
  { at: 52.6, n: 23, label: "escenas" },
  { at: 52.9, n: 184, label: "segundos de video" },
  { at: 53.2, n: 1, label: "conversación" },
];

/** 52 – 60 s. Resumen en números y cierre. */
export const S7_Outro: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const out = interpolate(t, [59.3, 60], [1, 0], cl);
  return (
    <AbsoluteFill style={{ opacity: out, fontFamily: font, color: C.text }}>
      <Particles t={t} count={50} spread={1100} seed="out" burst={52.2} opacity={0.8} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 200, display: "flex", justifyContent: "center", gap: 40 }}>
        {STATS.map((s) => (
          <div key={s.label} style={{ width: 300, textAlign: "center", ...popIn(t, s.at, 60) }}>
            <div style={{ fontSize: 130, fontWeight: 900, letterSpacing: -5, backgroundImage: GRAD, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", fontVariantNumeric: "tabular-nums" }}>
              {Math.round(interpolate(t, [s.at, s.at + 1.2], [0, s.n], { ...cl, easing: outExpo }))}
            </div>
            <div style={{ fontSize: 28, color: C.muted, fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>
      <Kinetic
        t={t}
        at={54.6}
        size={84}
        words={[{ w: "Lo" }, { w: "que" }, { w: "hablamos," }, { w: "convertido" }, { w: "en" }, { w: "video.", hl: true }]}
        style={{ left: 120, right: 120, top: 560 }}
      />
      <Pill dot={C.violet} style={{ left: 0, right: 0, margin: "0 auto", width: "fit-content", top: 800, fontSize: 28, ...popIn(t, 56.4) }}>
        Siguiente: más videos con Higgsfield
      </Pill>
      <div style={{ position: "absolute", left: 0, right: 0, top: 920, textAlign: "center", fontSize: 30, fontWeight: 800, letterSpacing: 6, color: C.muted, ...popIn(t, 57.2, 20) }}>
        SCORPIO NETWORK
      </div>
    </AbsoluteFill>
  );
};
