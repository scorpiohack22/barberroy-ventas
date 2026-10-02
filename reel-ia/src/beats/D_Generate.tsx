import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C, FPS, GRAD, font } from "../theme";
import { N } from "../timing";
import { fadeIn, lerp, outExpo, popIn, prog, sp } from "../anim";
import { Ad } from "../components/Ad";
import { Glass, Kinetic, Pill, Progress } from "../components/UI";
import { Cursor } from "../components/Cursor";
import { Particles } from "../components/Stage";
import { ISpark } from "../components/Icons";

export const PROMPT = "Perfume de lujo en estudio cálido, luz suave, fotorrealista";
const TYPE_A = 18.55;
const TYPE_B = 19.4;
const CLICK = 19.58;
const GEN_A = 19.65;
const GEN_B = 20.45;

const CANVAS = { x: 170, y: 470, w: 740, h: 1000 };
const BTN = { x: 870, y: 335 };

const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/**
 * 18,4 – 21,4 s. Clímax: "todo había sido creado con inteligencia
 * artificial". Se escribe el prompt, clic en Generar, barra de progreso y la
 * imagen nace del ruido. Tipografía protagonista en "inteligencia artificial".
 */
export const D_Generate: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;

  const n = Math.floor(interpolate(t, [TYPE_A, TYPE_B], [0, PROMPT.length], cl));
  const gen = prog(t, GEN_A, GEN_B, (x) => x);
  const g = outExpo(gen);
  const pct = Math.round(prog(t, CLICK + 0.05, GEN_B, (x) => x) * 100);
  const impact = sp(t, N.artificial, 9, 240);
  const camS = lerp(prog(t, 18.4, 21.4, (x) => x), 1.0, 1.07) + Math.sin(Math.min(1, impact) * Math.PI) * 0.025;
  const pressed = t >= CLICK && t < CLICK + 0.12;

  return (
    <AbsoluteFill style={{ transform: `scale(${camS})` }}>
      {/* Halo detrás del lienzo */}
      <div
        style={{
          position: "absolute",
          left: CANVAS.x - 160,
          top: CANVAS.y - 120,
          width: CANVAS.w + 320,
          height: CANVAS.h + 240,
          borderRadius: 120,
          background: `radial-gradient(ellipse at 50% 50%, rgba(61,123,255,${0.18 + 0.3 * g}) 0%, rgba(143,107,255,${0.12 + 0.2 * g}) 40%, rgba(0,0,0,0) 70%)`,
          filter: "blur(30px)",
        }}
      />

      {/* Lienzo */}
      <Glass style={{ left: CANVAS.x, top: CANVAS.y, width: CANVAS.w, height: CANVAS.h, padding: 0, overflow: "hidden", borderRadius: 36, ...popIn(t, 18.5, 140) }}>
        <AbsoluteFill
          style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.14) 2px, transparent 2px)",
            backgroundSize: "34px 34px",
            opacity: 1 - g,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: -200,
            bottom: -200,
            width: 300,
            left: ((t - 18.4) * 900) % (CANVAS.w + 600) - 300,
            background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.07), rgba(255,255,255,0))",
            transform: "rotate(14deg)",
            opacity: 1 - g,
          }}
        />
        {t > GEN_A ? (
          <div style={{ position: "absolute", inset: 0, opacity: fadeIn(t, GEN_A, 0.15) }}>
            <Ad
              w={CANVAS.w}
              h={CANVAS.h}
              palette={0}
              style={{ filter: `blur(${(1 - g) * 46}px) saturate(${0.3 + 0.7 * g}) contrast(${1.4 - 0.4 * g})`, transform: `scale(${1.15 - 0.15 * g})` }}
            />
            <svg width={CANVAS.w} height={CANVAS.h} style={{ position: "absolute", inset: 0, opacity: (1 - g) * 0.9, mixBlendMode: "overlay" }}>
              <filter id="gen-noise">
                <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves={2} seed={frame % 12} />
              </filter>
              <rect width="100%" height="100%" filter="url(#gen-noise)" />
            </svg>
            {/* barrido de luz al terminar */}
            <div
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                width: 260,
                left: lerp(prog(t, GEN_B - 0.1, GEN_B + 0.4), -300, CANVAS.w + 40),
                background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.45), rgba(255,255,255,0))",
                transform: "skewX(-18deg)",
              }}
            />
          </div>
        ) : null}
      </Glass>

      {/* Prompt */}
      <Glass style={{ left: 50, top: 250, width: 980, height: 170, padding: "0 30px", display: "flex", alignItems: "center", gap: 22, borderRadius: 40, ...popIn(t, N.todoCreado, 90) }}>
        <ISpark size={46} color={C.cyan} />
        <div style={{ flex: 1, fontSize: 34, lineHeight: 1.25, fontWeight: 500, color: n ? C.text : C.muted }}>
          {n ? PROMPT.slice(0, n) : "Describe tu imagen…"}
          {t < CLICK ? <span style={{ display: "inline-block", width: 3, height: 36, marginLeft: 2, background: C.cyan, verticalAlign: "middle", opacity: Math.floor(t * 4) % 2 || t < TYPE_B ? 1 : 0 }} /> : null}
        </div>
        <div
          style={{
            height: 92,
            padding: "0 30px",
            borderRadius: 26,
            background: GRAD,
            display: "flex",
            alignItems: "center",
            fontSize: 32,
            fontWeight: 800,
            transform: `scale(${pressed ? 0.92 : 1})`,
            boxShadow: `0 0 ${t > CLICK ? 40 : 0}px rgba(61,123,255,0.7)`,
            fontFamily: font,
          }}
        >
          Generar
        </div>
      </Glass>

      {/* Progreso */}
      <div style={{ position: "absolute", left: 90, top: 430, display: "flex", alignItems: "center", gap: 18, fontFamily: font, opacity: fadeIn(t, CLICK, 0.1) * (1 - prog(t, GEN_B + 0.25, GEN_B + 0.45)) }}>
        <Progress p={pct / 100} w={760} />
        <div style={{ fontSize: 28, fontWeight: 700, color: C.text, fontVariantNumeric: "tabular-nums", width: 80 }}>{pct}%</div>
      </div>

      {/* Datos técnicos que flotan (profundidad: delante del lienzo) */}
      <Pill dot={C.green} style={{ left: 40, top: 1180, ...popIn(t, GEN_B + 0.05) }}>Generado en 4,2 s</Pill>
      <Pill style={{ right: 40, top: 640, ...popIn(t, GEN_B + 0.15) }}>1080 × 1920</Pill>

      <Kinetic
        t={t}
        at={N.inteligencia}
        size={128}
        words={[{ w: "INTELIGENCIA", hl: true, at: N.inteligencia - 0.04 }, { w: "ARTIFICIAL", hl: true, at: N.artificial - 0.06 }]}
        style={{ left: 0, right: 0, top: 1500 }}
      />

      <Particles t={t} seed="gen" count={46} cx={540} cy={CANVAS.y + CANVAS.h / 2} spread={420} burst={N.artificial} color={C.cyan} opacity={t > N.artificial ? 1 : 0} />

      <Cursor
        frameOffset={0}
        points={[
          { frame: Math.round(18.6 * FPS), x: 760, y: 900 },
          { frame: Math.round(19.2 * FPS), x: 820, y: 560 },
          { frame: Math.round(CLICK * FPS), x: BTN.x, y: BTN.y, click: true },
          { frame: Math.round(20.6 * FPS), x: 900, y: 760 },
        ]}
      />
    </AbsoluteFill>
  );
};
