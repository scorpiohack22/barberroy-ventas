import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame } from "remotion";
import { colors, FPS, fontFamily } from "../theme";
import { AlertIcon } from "../components/Icons";

const TITLE = "Cuenta de pago de Facebook desactivada";

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const words = TITLE.split(" ");
  const glow = interpolate(frame, [0, 180], [0.25, 0.5]);
  const badge = spring({ frame: frame - 4, fps: FPS, config: { damping: 12 } });

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at 50% 40%, rgba(8,102,255,${glow}) 0%, rgba(11,15,26,0) 55%), ${colors.dark}`,
        fontFamily,
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "10px 22px",
          borderRadius: 999,
          background: "rgba(200,16,46,0.16)",
          border: `1px solid rgba(200,16,46,0.55)`,
          color: "#FF8A9B",
          fontSize: 26,
          fontWeight: 600,
          marginBottom: 44,
          transform: `scale(${badge})`,
        }}
      >
        <AlertIcon size={28} color={colors.red} />
        Monetización restringida
      </div>
      <div
        style={{
          maxWidth: 1500,
          textAlign: "center",
          fontSize: 108,
          fontWeight: 800,
          lineHeight: 1.08,
          letterSpacing: -2,
          marginTop: -40,
        }}
      >
        {words.map((w, i) => {
          const at = 12 + i * 7;
          const p = spring({ frame: frame - at, fps: FPS, config: { damping: 200 } });
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                marginRight: 26,
                opacity: interpolate(frame - at, [0, 6], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
                transform: `translateY(${(1 - p) * 40}px)`,
                color: w === "desactivada" ? "#FF5A73" : "#fff",
              }}
            >
              {w}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
