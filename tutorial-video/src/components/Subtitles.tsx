import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { CUES } from "../subtitles";
import { fontFamily } from "../theme";

/** Subtítulos inferiores: caja negra al 70 %, texto blanco de 42 px, máx. 2 líneas. */
export const Subtitles: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const cue = CUES.find((c) => t >= c.start && t < c.end);
  if (!cue) return null;

  const local = frame - cue.start * fps;
  const remaining = cue.end * fps - frame;
  const opacity = Math.min(
    interpolate(local, [0, 6], [0, 1], { extrapolateRight: "clamp" }),
    interpolate(remaining, [0, 6], [0, 1], { extrapolateRight: "clamp" }),
  );
  const lift = interpolate(local, [0, 8], [10, 0], { extrapolateRight: "clamp" });

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 56,
        display: "flex",
        justifyContent: "center",
        zIndex: 2000,
        opacity,
        transform: `translateY(${lift}px)`,
      }}
    >
      <div
        style={{
          maxWidth: 1500,
          background: "rgba(0,0,0,0.7)",
          color: "#FFFFFF",
          fontFamily,
          fontSize: 42,
          fontWeight: 600,
          lineHeight: 1.3,
          padding: "14px 30px",
          borderRadius: 10,
          textAlign: "center",
          textWrap: "balance",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {cue.text}
      </div>
    </div>
  );
};
