import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { FADE } from "../theme";

/** Fundido de entrada de 10 frames, superpuesto al final de la escena anterior. */
export const SceneFade: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, FADE], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};
