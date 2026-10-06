import React from "react";
import { Html5Audio, getStaticFiles, interpolate, staticFile, useVideoConfig } from "remotion";

const VOLUME = 0.15;
const FADE_SECONDS = 2;

/**
 * Música de fondo opcional (public/music.mp3) al 15 % con fade in / fade out.
 * Si el archivo no existe, no se agrega ninguna pista y el video renderiza igual.
 */
export const Music: React.FC = () => {
  const { fps, durationInFrames } = useVideoConfig();
  const exists = getStaticFiles().some((f) => f.name === "music.mp3");
  if (!exists) return null;
  const fade = FADE_SECONDS * fps;
  return (
    <Html5Audio
      src={staticFile("music.mp3")}
      loop
      volume={(f) =>
        interpolate(
          f,
          [0, fade, durationInFrames - fade, durationInFrames],
          [0, VOLUME, VOLUME, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
        )
      }
    />
  );
};
