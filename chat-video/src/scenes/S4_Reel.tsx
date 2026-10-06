import React from "react";
import { AbsoluteFill, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { C, FPS, GRAD, mono } from "../theme";
import { fadeIn, outExpo, popIn, prog } from "../anim";
import { Kinetic, Pill } from "../components/UI";
import { Window } from "../components/Window";
import { Phone } from "../components/Devices";
import { WAVE, WORDS } from "../data";

const BEATS = ["Hook", "Fortuna", "Real", "Despiece", "$0", "IA", "Ya está aquí"];
const TR_A = 23.6; // la transcripción se reproduce acelerada entre TR_A y TR_B
const TR_B = 28.2;

/** 22 – 34 s. Video 2: la narración → transcripción → storyboard → reel. */
export const S4_Reel: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const k = (t - TR_A) / (TR_B - TR_A);
  const audioT = k * 31.9;
  const shown = WORDS.filter((w) => w.s <= audioT);
  const recent = shown.slice(-26);

  return (
    <AbsoluteFill>
      <Kinetic t={t} at={22.05} size={44} words={[{ w: "Video" }, { w: "2", hl: true }, { w: "·" }, { w: "Reel" }, { w: "con" }, { w: "tu" }, { w: "voz" }]} align="left" style={{ left: 120, top: 70 }} />

      {/* Audio subido */}
      <Window x={120} y={170} w={1060} h={250} title="narracion.wav · 31,9 s" style={popIn(t, 22.2, 60)} bodyStyle={{ padding: "26px 30px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, height: 150 }}>
          {WAVE.map((v, i) => {
            const played = i / WAVE.length < k;
            const g = prog(t, 22.4 + i * 0.008, 22.8 + i * 0.008, outExpo);
            return (
              <div key={i} style={{ flex: 1, height: `${Math.max(6, v * 100) * g}%`, borderRadius: 4, background: played ? GRAD : "rgba(255,255,255,0.18)" }} />
            );
          })}
        </div>
      </Window>

      {/* Transcripción palabra por palabra */}
      <Window x={120} y={450} w={1060} h={300} title="Transcripción con tiempos" style={popIn(t, 23.3, 60)} bodyStyle={{ padding: "22px 30px", fontSize: 26, lineHeight: 1.6 }}>
        <div style={{ display: "flex", flexWrap: "wrap", columnGap: 12 }}>
          {recent.map((w, i) => {
            const isLast = i === recent.length - 1;
            return (
              <span key={w.s} style={{ color: isLast ? C.cyan : C.text, opacity: fadeIn(t, TR_A + (w.s / 31.9) * (TR_B - TR_A), 0.08) }}>
                {w.w}
                <span style={{ fontFamily: mono, fontSize: 14, color: C.muted, marginLeft: 4 }}>{w.s.toFixed(1)}</span>
              </span>
            );
          })}
        </div>
      </Window>

      {/* Storyboard */}
      <div style={{ position: "absolute", left: 120, top: 790, width: 1060, display: "flex", gap: 10 }}>
        {BEATS.map((b, i) => (
          <div
            key={b}
            style={{
              flex: 1,
              height: 92,
              borderRadius: 16,
              border: `1px solid ${C.stroke}`,
              background: "rgba(255,255,255,0.05)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              padding: "0 14px",
              fontFamily: "Inter, sans-serif",
              color: C.text,
              ...popIn(t, 28.4 + i * 0.12, 40),
            }}
          >
            <div style={{ fontSize: 14, color: C.muted, fontWeight: 700 }}>ESCENA {i + 1}</div>
            <div style={{ fontSize: 20, fontWeight: 800, marginTop: 4 }}>{b}</div>
          </div>
        ))}
      </div>

      {/* El reel real en un teléfono */}
      <div style={{ position: "absolute", left: 1330, top: 120, ...popIn(t, 25.6, 160) }}>
        <Phone w={400}>
          <Sequence from={Math.round(25.6 * FPS)} layout="none">
            <OffthreadVideo src={staticFile("reel.mp4")} muted playbackRate={1.6} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </Sequence>
        </Phone>
      </div>
      <Pill dot={C.green} style={{ left: 1290, top: 960, fontSize: 22, ...popIn(t, 30.0) }}>1080×1920 · 32,4 s · voz intacta</Pill>
    </AbsoluteFill>
  );
};
