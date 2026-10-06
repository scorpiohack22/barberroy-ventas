import React from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";
import { C, FPS, GRAD, font } from "../theme";
import { outExpo, popIn, prog } from "../anim";
import { Kinetic, Pill } from "../components/UI";
import { Bubble, Window } from "../components/Window";
import { ENV } from "../data";

const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const Channel: React.FC<{ t: number; name: string; color: string; fader: number; level: number; db: string; seed: string }> = ({
  t,
  name,
  color,
  fader,
  level,
  db,
  seed,
}) => {
  const n = 16;
  const lit = Math.round(level * n * (0.85 + 0.15 * random(`${seed}${Math.floor(t * 12)}`)));
  return (
    <div style={{ width: 170, display: "flex", flexDirection: "column", alignItems: "center", fontFamily: font, color: C.text }}>
      <div style={{ display: "flex", gap: 22, height: 380, alignItems: "flex-end" }}>
        {/* medidor */}
        <div style={{ display: "flex", flexDirection: "column-reverse", gap: 4, height: "100%" }}>
          {new Array(n).fill(0).map((_, i) => (
            <div key={i} style={{ width: 22, flex: 1, borderRadius: 3, background: i < lit ? (i > 13 ? C.red : i > 10 ? C.amber : color) : "rgba(255,255,255,0.07)" }} />
          ))}
        </div>
        {/* fader */}
        <div style={{ position: "relative", width: 10, height: "100%", borderRadius: 6, background: "rgba(255,255,255,0.1)" }}>
          <div style={{ position: "absolute", left: -22, width: 54, height: 30, borderRadius: 8, top: `${(1 - fader) * 92}%`, background: "#E9ECF2", boxShadow: "0 6px 18px rgba(0,0,0,0.5)" }} />
        </div>
      </div>
      <div style={{ marginTop: 18, fontSize: 24, fontWeight: 800 }}>{name}</div>
      <div style={{ fontSize: 20, color, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{db}</div>
    </div>
  );
};

/** 34 – 42 s. "Los efectos están muy altos": se bajan y se activa el ducking. */
export const S5_Audio: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const down = prog(t, 35.9, 36.7, outExpo);
  const duck = prog(t, 37.0, 37.3);
  const envAt = (x: number) => ENV[Math.min(ENV.length - 1, Math.floor(x * ENV.length))];
  const voice = envAt(((t * 0.9) % 31) / 31);
  const sfxLvl = interpolate(down, [0, 1], [0.9, 0.35]) * (1 - 0.5 * duck * voice);

  const W = 620;
  const Hh = 170;
  // Envolvente suavizada (media móvil) para que la curva se lea limpia.
  const sm = ENV.map((_, i) => {
    const a = ENV.slice(Math.max(0, i - 4), i + 5);
    return a.reduce((x, y) => x + y, 0) / a.length;
  });
  const mx = Math.max(...sm);
  const vPath = sm.map((e0, i) => { const e = e0 / mx; return `${(i / (sm.length - 1)) * W},${Hh - e * Hh * 0.9}`; }).join(" ");
  const sPath = sm.map((e0, i) => { const e = e0 / mx; return `${(i / (sm.length - 1)) * W},${Hh - (0.55 - 0.4 * e) * Hh}`; }).join(" ");
  const draw = prog(t, 37.2, 38.4);

  return (
    <AbsoluteFill>
      <Kinetic t={t} at={34.05} size={44} words={[{ w: "Ajuste" }, { w: "·" }, { w: "Tu" }, { w: "voz,", hl: true }, { w: "siempre" }, { w: "al" }, { w: "frente" }]} align="left" style={{ left: 120, top: 70 }} />

      <Window x={120} y={170} w={720} h={300} title="Conversación" style={popIn(t, 34.1, 60)} bodyStyle={{ padding: 26 }}>
        <div style={popIn(t, 34.3, 30)}>
          <Bubble me>Los efectos de sonido están muy altos. No quiero que opaquen mi voz.</Bubble>
        </div>
        <div style={popIn(t, 36.0, 30)}>
          <Bubble>Bajo los efectos ~8 dB y hago que se atenúen cuando hablas.</Bubble>
        </div>
      </Window>

      <Window x={900} y={170} w={900} h={620} title="Mezcla del reel" style={popIn(t, 34.4, 80)} bodyStyle={{ display: "flex", justifyContent: "space-around", alignItems: "center", padding: "0 30px" }}>
        <Channel t={t} name="Voz" color={C.green} fader={0.82} level={0.35 + 0.6 * voice} db="−20,8 dBFS" seed="v" />
        <Channel t={t} name="Música" color={C.blue} fader={interpolate(down, [0, 1], [0.6, 0.52])} level={0.42 * (1 - 0.4 * voice)} db="−35,6 dBFS" seed="m" />
        <Channel t={t} name="Efectos" color={C.violet} fader={interpolate(down, [0, 1], [0.7, 0.32])} level={sfxLvl} db={down > 0.5 ? "−45,5 dBFS" : "−36 dBFS"} seed="s" />
      </Window>

      {/* Curva de ducking */}
      <Window x={120} y={500} w={720} h={290} title="Ducking: los efectos bajan cuando hablas" style={popIn(t, 37.0, 60)} bodyStyle={{ padding: "18px 50px" }}>
        <svg width={W} height={Hh} style={{ overflow: "visible" }}>
          <polyline points={vPath} fill="none" stroke={C.green} strokeWidth={3} strokeDasharray={2000} strokeDashoffset={2000 * (1 - draw)} />
          <polyline points={sPath} fill="none" stroke={C.violet} strokeWidth={3} strokeDasharray={2000} strokeDashoffset={2000 * (1 - draw)} />
        </svg>
        <div style={{ display: "flex", gap: 30, fontSize: 18, fontWeight: 700, marginTop: 8 }}>
          <span style={{ color: C.green }}>— Voz</span>
          <span style={{ color: C.violet }}>— Efectos</span>
        </div>
      </Window>

      <Pill dot={C.green} style={{ left: 900, top: 830, fontSize: 26, ...popIn(t, 38.8) }}>Efectos 25 dB por debajo de la voz</Pill>
      <div style={{ position: "absolute", left: 900, top: 920, width: 900, height: 6, borderRadius: 6, background: GRAD, opacity: interpolate(t, [39, 39.4], [0, 1], cl) }} />
    </AbsoluteFill>
  );
};
