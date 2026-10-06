import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C, FPS, GRAD, mono } from "../theme";
import { lerp, outExpo, popIn, prog } from "../anim";
import { Kinetic, Pill, Progress, fmt } from "../components/UI";
import { Bubble, Caret, Window, typed } from "../components/Window";

const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** 5 – 13 s. El pedido del tutorial y el render en la terminal. */
export const S2_Build: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const frames = Math.round(interpolate(t, [7.6, 10.5], [0, 2760], { ...cl, easing: outExpo }));
  const camS = lerp(prog(t, 7.2, 8.0), 1, 1.06);
  const camX = lerp(prog(t, 7.2, 8.0), 0, -60);

  const lines: { at: number; node: React.ReactNode }[] = [
    { at: 5.6, node: <><span style={{ color: C.green }}>$</span> {typed(t, 5.6, 6.1, "npx create-video@latest --blank tutorial-video")}</> },
    { at: 6.3, node: <span style={{ color: C.muted }}>Copiado en tutorial-video · npm i</span> },
    { at: 7.1, node: <><span style={{ color: C.green }}>$</span> {typed(t, 7.1, 7.45, "npm run render")}</> },
    { at: 7.6, node: <span style={{ color: C.muted }}>Composición Tutorial · 1920×1080 · 30 fps</span> },
  ];

  return (
    <AbsoluteFill style={{ transform: `translateX(${camX}px) scale(${camS})` }}>
      <Kinetic t={t} at={5.05} size={44} words={[{ w: "Video" }, { w: "1", hl: true }, { w: "·" }, { w: "Tutorial" }, { w: "en" }, { w: "Remotion" }]} align="left" style={{ left: 120, top: 70 }} />

      <Window x={120} y={160} w={800} h={820} title="Conversación" style={popIn(t, 5.05, 80)} bodyStyle={{ padding: 28 }}>
        <div style={popIn(t, 5.3, 30)}>
          <Bubble me>
            Crea un tutorial en Remotion: Meta Business Suite, ~90 s, cursor con clics, zooms, texto que se escribe y subtítulos.{" "}
            <b>Datos sensibles enmascarados.</b>
          </Bubble>
        </div>
        <div style={popIn(t, 6.5, 30)}>
          <Bubble>
            Listo: 9 escenas en un <code style={{ fontFamily: mono, color: C.cyan }}>&lt;Series&gt;</code>, componentes Cursor, Typewriter, cámara y subtítulos.
          </Bubble>
        </div>
        <div style={popIn(t, 11.1, 30)}>
          <Bubble>
            Renderizado: <b>out/video.mp4</b> + <b>subtitulos.srt</b>
          </Bubble>
        </div>
      </Window>

      <Window x={980} y={200} w={820} h={560} title="Terminal" style={popIn(t, 5.4, 80)} bodyStyle={{ padding: "26px 30px", fontFamily: mono, fontSize: 22, lineHeight: 1.75 }}>
        {lines.map((l, i) => (t >= l.at ? <div key={i}>{l.node}</div> : null))}
        {t >= 7.6 ? (
          <div style={{ marginTop: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", color: C.text }}>
              <span>Renderizando frames</span>
              <span style={{ fontVariantNumeric: "tabular-nums" }}>{fmt(frames)}/2.760</span>
            </div>
            <Progress p={frames / 2760} w={760} style={{ marginTop: 10 }} />
          </div>
        ) : null}
        {t >= 10.6 ? <div style={{ marginTop: 18, color: C.green }}>+ out/video.mp4 · 24,3 MB</div> : null}
        {t >= 10.9 ? <div style={{ color: C.green }}>+ subtitulos.srt · 11 subtítulos</div> : null}
        {t < 7.6 ? <Caret t={t} /> : null}
      </Window>

      <Pill dot={C.cyan} style={{ left: 1040, top: 800, fontSize: 24, ...popIn(t, 8.2) }}>React + TypeScript</Pill>
      <Pill dot={C.violet} style={{ left: 1340, top: 800, fontSize: 24, ...popIn(t, 8.5) }}>1920×1080 · 30 fps</Pill>
      <div style={{ position: "absolute", left: 1040, top: 880, width: 740, height: 6, borderRadius: 6, background: GRAD, opacity: prog(t, 10.5, 10.8), boxShadow: `0 0 30px ${C.blue}` }} />
    </AbsoluteFill>
  );
};
