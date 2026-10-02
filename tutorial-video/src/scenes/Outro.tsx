import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { colors, FPS, fontFamily } from "../theme";
import { GenericLogo } from "../components/Brand";
import { appear, LEAD } from "./anim";

export const Outro: React.FC = () => {
  const raw = useCurrentFrame();
  const frame = raw - LEAD;
  const { durationInFrames } = useVideoConfig();
  const logo = spring({ frame, fps: FPS, config: { damping: 12 } });
  // Fundido a negro al final del video.
  const out = interpolate(raw, [durationInFrames - 15, durationInFrames - 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at 50% 45%, rgba(8,102,255,0.35) 0%, rgba(11,15,26,0) 55%), ${colors.dark}`,
        fontFamily,
        color: "#fff",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ transform: `scale(${logo})` }}>
        <GenericLogo size={110} />
      </div>
      <div style={{ fontSize: 110, fontWeight: 800, letterSpacing: -2, marginTop: 30, ...appear(frame, 6, 30) }}>
        Scorpio Network
      </div>
      <div
        style={{
          marginTop: 30,
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "16px 34px",
          borderRadius: 999,
          background: colors.red,
          fontSize: 34,
          fontWeight: 700,
          ...appear(frame, 18, 20),
        }}
      >
        <svg width={30} height={30} viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z" fill="#fff" />
        </svg>
        Suscríbete para más soluciones de monetización
      </div>
      <AbsoluteFill style={{ background: "#000", opacity: out }} />
    </AbsoluteFill>
  );
};
