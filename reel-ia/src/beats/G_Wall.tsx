import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C, FPS, GRAD, font } from "../theme";
import { N } from "../timing";
import { fadeIn, lerp, outExpo, popIn, prog, sp } from "../anim";
import { Ad } from "../components/Ad";
import { Glass, Kinetic, fmt } from "../components/UI";
import { Cursor } from "../components/Cursor";
import { ISpark } from "../components/Icons";

const CW = 300;
const CH = 534;
const GAP = 26;
const COLS = 5;
const ROWS = 6;

const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const CTA_CLICK = 31.75;

/**
 * 29,65 – 32,4 s. "Y apenas estamos viendo de lo que es capaz": la cámara se
 * aleja y revela un muro infinito de creativos generados (parallax por
 * columnas), contador y llamado a seguir la cuenta.
 */
export const G_Wall: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const pull = prog(t, 29.6, 31.0, outExpo);
  const s = lerp(pull, 2.3, 1.0);
  const count = interpolate(t, [29.9, 32.2], [6, 2048], { ...cl, easing: outExpo });
  const end = interpolate(t, [32.15, 32.4], [1, 0], cl);

  return (
    <AbsoluteFill style={{ opacity: end }}>
      <AbsoluteFill style={{ perspective: 1800 }}>
        <AbsoluteFill
          style={{
            transform: `scale(${s}) rotateX(${lerp(pull, 0, 22)}deg) rotateZ(${lerp(pull, 0, -10)}deg)`,
            transformOrigin: "50% 45%",
          }}
        >
          {new Array(COLS).fill(0).map((_, c) => {
            const dir = c % 2 ? 1 : -1;
            const off = dir * t * (60 + c * 14);
            const x = 540 - CW / 2 + (c - 2) * (CW + GAP);
            return (
              <div key={c} style={{ position: "absolute", left: x, top: -400 + (off % (CH + GAP)) - (c % 2) * 200 }}>
                {new Array(ROWS).fill(0).map((__, r) => {
                  const center = c === 2 && r === 2;
                  const idx = center ? 0 : (c * 3 + r * 2) % 7;
                  return (
                    <div
                      key={r}
                      style={{
                        position: "relative",
                        width: CW,
                        height: CH,
                        marginBottom: GAP,
                        borderRadius: 26,
                        overflow: "hidden",
                        boxShadow: center ? `0 0 0 3px ${C.cyan}, 0 0 60px rgba(61,217,245,0.5)` : "0 20px 50px rgba(0,0,0,0.5)",
                        opacity: center ? 1 : 0.55 + 0.45 * pull,
                      }}
                    >
                      <Ad w={CW} h={CH} palette={idx} hideText seed={`wall-${c}-${r}`} />
                      <div style={{ position: "absolute", left: 12, top: 12, display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 99, background: "rgba(0,0,0,0.45)", color: "#fff", fontFamily: font, fontSize: 18, fontWeight: 700 }}>
                        <ISpark size={18} color={C.cyan} /> IA
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </AbsoluteFill>
      </AbsoluteFill>

      {/* Oscurecer para legibilidad */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 80% 50% at 50% 50%, rgba(6,7,10,0.88), rgba(6,7,10,0.45))", opacity: pull }} />

      <Kinetic
        t={t}
        at={N.apenas}
        size={150}
        words={[{ w: "Esto" }, { w: "apenas", hl: true }, { w: "empieza" }]}
        stagger={0.12}
        style={{ left: 40, right: 40, top: 640 }}
      />

      <Glass style={{ left: 0, right: 0, margin: "0 auto", width: 640, top: 1080, padding: "24px 30px", display: "flex", alignItems: "center", gap: 20, ...popIn(t, 30.3, 50) }}>
        <div style={{ width: 70, height: 70, borderRadius: 20, background: "rgba(61,123,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ISpark size={40} color={C.cyan} />
        </div>
        <div>
          <div style={{ fontSize: 26, color: C.muted, fontWeight: 600 }}>Creativos generados</div>
          <div style={{ fontSize: 54, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{fmt(count)}</div>
        </div>
      </Glass>

      {/* CTA */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 1440,
          display: "flex",
          justifyContent: "center",
          ...popIn(t, N.capaz - 0.1, 60),
        }}
      >
        <div
          style={{
            padding: "30px 54px",
            borderRadius: 999,
            background: GRAD,
            fontFamily: font,
            fontSize: 46,
            fontWeight: 800,
            color: "#fff",
            boxShadow: `0 0 ${t > CTA_CLICK ? 70 : 30}px rgba(61,123,255,0.7)`,
            transform: `scale(${1 - 0.07 * Math.sin(Math.min(1, sp(t, CTA_CLICK, 10, 260)) * Math.PI)})`,
          }}
        >
          {t > CTA_CLICK + 0.05 ? "Siguiendo" : "Sígueme para ver lo que viene"}
        </div>
      </div>

      <div style={{ opacity: fadeIn(t, 31.1, 0.12) }}>
      <Cursor
        points={[
          { frame: Math.round(31.2 * FPS), x: 920, y: 1760 },
          { frame: Math.round(CTA_CLICK * FPS), x: 640, y: 1500, click: true },
        ]}
      />
      </div>
    </AbsoluteFill>
  );
};
