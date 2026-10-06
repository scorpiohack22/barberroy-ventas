import React from "react";
import { AbsoluteFill, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { C, FPS } from "../theme";
import { lerp, popIn, prog } from "../anim";
import { Kinetic, Pill } from "../components/UI";
import { Window } from "../components/Window";

const START = 13;
const VW = 1120;
const VH = 630;

const CHIPS = [
  { at: 14.0, text: "Cursor con clics", x: 110, y: 330, dot: C.cyan },
  { at: 15.0, text: "Zoom de cámara", x: 1560, y: 330, dot: C.blue },
  { at: 16.2, text: "Typewriter · 1.202/2.000", x: 40, y: 600, dot: C.violet },
  { at: 17.4, text: "IDs: 2647••••••••8965", x: 1530, y: 560, dot: C.green },
  { at: 18.6, text: "Subtítulos + .srt", x: 1560, y: 820, dot: C.amber },
];

/** 13 – 22 s. El tutorial real, en avance rápido dentro de una ventana flotante. */
export const S3_Tutorial: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const tilt = lerp(prog(t, 13, 22, (x) => x), -6, 6);
  const s = lerp(prog(t, 13, 22, (x) => x), 0.98, 1.06);
  return (
    <AbsoluteFill>
      <Kinetic t={t} at={13.05} size={44} words={[{ w: "Video" }, { w: "1", hl: true }, { w: "·" }, { w: "Cuenta" }, { w: "de" }, { w: "pago" }, { w: "desactivada" }]} align="left" style={{ left: 120, top: 70 }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, perspective: 2000 }}>
        <div style={{ transform: `rotateY(${tilt}deg) scale(${s})`, transformOrigin: "50% 55%", width: "100%", height: "100%" }}>
          <Window x={(1920 - VW) / 2} y={200} w={VW} h={VH + 46} title="tutorial-video · out/video.mp4  ·  x3" style={popIn(t, 13.1, 100)} bodyStyle={{ background: "#000" }}>
            <Sequence from={Math.round(START * FPS)} layout="none">
              <OffthreadVideo src={staticFile("tutorial.mp4")} muted startFrom={6 * FPS} playbackRate={3} style={{ width: VW, height: VH }} />
            </Sequence>
          </Window>
        </div>
      </div>
      {CHIPS.map((c) => (
        <Pill key={c.text} dot={c.dot} style={{ left: c.x, top: c.y, fontSize: 24, ...popIn(t, c.at) }}>
          {c.text}
        </Pill>
      ))}
    </AbsoluteFill>
  );
};
