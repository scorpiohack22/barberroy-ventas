import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, FPS, font, glass } from "../theme";
import { popIn, prog, sp } from "../anim";
import { Kinetic, Pill } from "../components/UI";
import { Caret, typed } from "../components/Window";
import { Particles } from "../components/Stage";
import { ISpark } from "../components/Icons";

const CMD = "/saas-animation  Crea una animación SaaS con mis pantallas…";

/** 0 – 5 s. Así empezó: un comando que no existía en la sesión. */
export const S1_Intro: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const push = 1 + prog(t, 0, 5, (x) => x) * 0.05;
  const err = sp(t, 1.85, 10, 200);
  return (
    <AbsoluteFill style={{ transform: `scale(${push})` }}>
      <Particles t={t} count={40} spread={900} seed="intro" opacity={0.5} />
      <Kinetic
        t={t}
        at={0.15}
        size={92}
        words={[{ w: "Lo" }, { w: "que" }, { w: "hablamos" }, { w: "en" }, { w: "este" }, { w: "chat", hl: true }]}
        style={{ left: 120, right: 120, top: 180 }}
      />
      <div
        style={{
          ...glass,
          position: "absolute",
          left: 360,
          width: 1200,
          top: 470,
          height: 112,
          borderRadius: 30,
          display: "flex",
          alignItems: "center",
          gap: 20,
          padding: "0 32px",
          fontFamily: font,
          fontSize: 32,
          color: C.text,
          ...popIn(t, 0.35, 50),
        }}
      >
        <ISpark size={36} color={C.cyan} />
        <span>
          <span style={{ color: C.cyan, fontWeight: 700 }}>{typed(t, 0.6, 1.0, "/saas-animation")}</span>
          {typed(t, 1.0, 1.7, CMD.slice("/saas-animation".length))}
        </span>
        {t < 1.85 ? <Caret t={t} h={34} /> : null}
      </div>
      <Pill
        dot={C.red}
        style={{
          left: 0,
          right: 0,
          margin: "0 auto",
          width: "fit-content",
          top: 620,
          fontSize: 28,
          opacity: t > 1.85 ? 1 : 0,
          transform: `scale(${0.7 + 0.3 * err})`,
          translate: `${Math.sin((t - 1.85) * 50) * 8 * Math.max(0, 1 - (t - 1.85) * 4) * (t > 1.85 ? 1 : 0)}px 0`,
        }}
      >
        Comando no instalado en esta sesión
      </Pill>
      <Kinetic
        t={t}
        at={2.9}
        size={64}
        words={[{ w: "…y" }, { w: "aun" }, { w: "así" }, { w: "hicimos" }, { w: "3" , hl: true }, { w: "videos.", hl: true }]}
        style={{ left: 120, right: 120, top: 760 }}
      />
    </AbsoluteFill>
  );
};
