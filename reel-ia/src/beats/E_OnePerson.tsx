import React from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";
import { C, FPS, GRAD, font } from "../theme";
import { N } from "../timing";
import { fadeIn, lerp, outExpo, popIn, prog, sp } from "../anim";
import { Ad } from "../components/Ad";
import { Laptop } from "../components/Devices";
import { Glass, Kinetic, Wire } from "../components/UI";
import { ICheck, IImage, IMegaphone, IPerson, IText, IVideo } from "../components/Icons";

const LW = 900;
const LX = 90;
const LY = 640;
const SW = LW - LW * 0.036;
const SH = LW * 0.64 - LW * 0.036;

const NODES = [
  { label: "Prompt", Icon: IText },
  { label: "Imagen", Icon: IImage },
  { label: "Video", Icon: IVideo },
  { label: "Anuncio", Icon: IMegaphone },
];
const NODE_Y = 1700;
const nodeX = (i: number) => 135 + i * 270;
const NODE_T = [23.85, 24.05, 24.25, 24.45];

const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** App de "estudio creativo con IA" dentro de la laptop. */
const StudioApp: React.FC<{ t: number }> = ({ t }) => {
  const cols = 3;
  const tw = (SW - 150 - 40 - 2 * 18) / cols;
  const th = (SH - 70 - 40 - 18) / 2;
  return (
    <AbsoluteFill style={{ fontFamily: font, color: C.text, background: "#0B0D13" }}>
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 110, background: "#0F121A", borderRight: `1px solid ${C.stroke}` }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} style={{ width: 46, height: 46, margin: "24px auto 0", borderRadius: 12, background: i === 1 ? GRAD : "rgba(255,255,255,0.08)" }} />
        ))}
      </div>
      <div style={{ position: "absolute", left: 130, right: 20, top: 16, height: 46, display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ fontSize: 24, fontWeight: 800 }}>Studio IA</div>
        <div style={{ flex: 1, height: 38, borderRadius: 12, background: "rgba(255,255,255,0.06)", fontSize: 17, color: C.muted, display: "flex", alignItems: "center", padding: "0 14px" }}>
          Campaña · Perfume · 6 variaciones
        </div>
        <div style={{ height: 38, padding: "0 16px", borderRadius: 12, background: GRAD, fontSize: 17, fontWeight: 800, display: "flex", alignItems: "center" }}>Generar</div>
      </div>
      {new Array(6).fill(0).map((_, i) => {
        const at = 21.75 + i * 0.12;
        const g = prog(t, at, at + 0.45, outExpo);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 130 + (i % cols) * (tw + 18),
              top: 76 + Math.floor(i / cols) * (th + 18),
              width: tw,
              height: th,
              borderRadius: 14,
              overflow: "hidden",
              background: "rgba(255,255,255,0.05)",
              opacity: fadeIn(t, at, 0.1),
            }}
          >
            <Ad w={tw} h={th * 1.6} palette={i} style={{ marginTop: -th * 0.18, filter: `blur(${(1 - g) * 18}px)` }} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/**
 * 21,4 – 25,5 s. "Lo hizo una sola persona desde su computador": laptop con
 * el estudio de IA, el equipo de producción baja de 48 a 1, flujo de
 * automatización y notificación de campaña lista.
 */
export const E_OnePerson: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const rise = sp(t, N.masLoco - 0.05, 16, 120);
  const glow = interpolate(t, [N.computador, N.computador + 0.15, N.computador + 0.8], [0, 1, 0.35], cl);
  const team = Math.round(interpolate(t, [22.55, 23.3], [48, 1], { ...cl, easing: outExpo }));
  const push = lerp(prog(t, 21.4, 25.5, (x) => x), 1, 1.06);
  const notif = sp(t, 24.85, 15, 160);

  return (
    <AbsoluteFill style={{ transform: `scale(${push})` }}>
      {/* "Y lo más loco…" */}
      <Kinetic t={t} at={N.masLoco + 0.05} size={86} out={22.45} words={[{ w: "Y" }, { w: "lo" }, { w: "más" }, { w: "loco…", hl: true }]} style={{ left: 40, right: 40, top: 300 }} />

      {/* Equipo de producción: 48 → 1 */}
      <Glass style={{ left: 120, top: 250, width: 840, padding: "26px 34px", ...popIn(t, 22.45, 60) }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 30, color: C.muted, fontWeight: 600 }}>Equipo de producción</div>
          <div style={{ fontSize: 56, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{team}</div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16, height: 116, alignContent: "flex-start" }}>
          {new Array(24).fill(0).map((_, i) => {
            const me = i === 0;
            const vanish = me ? 1 : interpolate(t, [22.55 + random(`v${i}`) * 0.6, 22.75 + random(`v${i}`) * 0.6], [1, 0], cl);
            return (
              <div
                key={i}
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: "50%",
                  background: me ? GRAD : "rgba(255,255,255,0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: vanish,
                  transform: `scale(${me ? 1 + 0.25 * Math.sin(Math.min(1, sp(t, N.unaSola, 8, 200)) * Math.PI) : 0.6 + 0.4 * vanish})`,
                  boxShadow: me && t > N.unaSola ? `0 0 30px ${C.blue}` : undefined,
                }}
              >
                <IPerson size={28} color={me ? "#fff" : C.muted} />
              </div>
            );
          })}
        </div>
      </Glass>

      {/* Laptop */}
      <div
        style={{
          position: "absolute",
          left: LX,
          top: LY,
          perspective: 1600,
          opacity: fadeIn(t, N.masLoco - 0.05, 0.15),
        }}
      >
        <div style={{ transform: `translateY(${(1 - rise) * 500}px) rotateX(${(1 - rise) * 30 + 6}deg)`, transformOrigin: "50% 100%" }}>
          <Laptop w={LW} style={{ filter: glow > 0 ? `drop-shadow(0 0 ${50 * glow}px rgba(61,217,245,${0.7 * glow}))` : undefined }}>
            <StudioApp t={t} />
          </Laptop>
        </div>
      </div>

      {/* Notificación (delante de la laptop) */}
      <Glass
        style={{
          right: 50,
          top: 600,
          width: 560,
          padding: "22px 26px",
          display: "flex",
          alignItems: "center",
          gap: 20,
          background: "rgba(22,26,38,0.92)",
          opacity: fadeIn(t, 24.85, 0.1),
          transform: `translateX(${(1 - notif) * 600}px)`,
        }}
      >
        <div style={{ width: 70, height: 70, borderRadius: 20, background: "rgba(52,211,153,0.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ICheck size={40} color={C.green} />
        </div>
        <div>
          <div style={{ fontSize: 30, fontWeight: 800 }}>Campaña lista</div>
          <div style={{ fontSize: 24, color: C.muted, marginTop: 4 }}>6 anuncios · 1 persona</div>
        </div>
      </Glass>

      {/* "UNA SOLA PERSONA" */}
      <Kinetic
        t={t}
        at={N.unaSola}
        size={118}
        words={[{ w: "UNA", at: N.unaSola - 0.04 }, { w: "SOLA", at: N.unaSola + 0.16 }, { w: "PERSONA", hl: true, at: N.persona - 0.04 }]}
        style={{ left: 30, right: 30, top: 1330 }}
      />

      {/* Flujo de automatización */}
      {NODES.slice(1).map((_, i) => (
        <Wire key={i} from={[nodeX(i) + 95, NODE_Y]} to={[nodeX(i + 1) - 95, NODE_Y]} p={prog(t, NODE_T[i + 1] - 0.15, NODE_T[i + 1] + 0.05)} color={C.cyan} bend={0} />
      ))}
      {NODES.map(({ label, Icon }, i) => (
        <div
          key={label}
          style={{
            position: "absolute",
            left: nodeX(i) - 95,
            top: NODE_Y - 52,
            width: 190,
            height: 104,
            borderRadius: 26,
            background: "rgba(255,255,255,0.07)",
            border: `1.5px solid ${t > NODE_T[i] + 0.1 ? C.cyan : C.stroke}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            fontFamily: font,
            fontSize: 28,
            fontWeight: 700,
            color: C.text,
            boxShadow: t > NODE_T[i] + 0.1 ? `0 0 26px rgba(61,217,245,0.35)` : undefined,
            ...popIn(t, NODE_T[i], 50),
          }}
        >
          <Icon size={30} color={C.cyan} />
          {label}
        </div>
      ))}
    </AbsoluteFill>
  );
};
