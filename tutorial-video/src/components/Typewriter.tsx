import React from "react";
import { interpolate, useCurrentFrame } from "remotion";

/** Cuántos caracteres se han escrito en el frame dado. */
export const typedChars = (
  frame: number,
  start: number,
  end: number,
  length: number,
) =>
  Math.floor(
    interpolate(frame, [start, end], [0, length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );

/**
 * Escribe texto letra por letra entre `start` y `end` (frames locales),
 * con un cursor de texto parpadeante.
 */
export const Typewriter: React.FC<{
  text: string;
  start: number;
  end: number;
  frameOffset?: number;
  caretColor?: string;
  showCaret?: boolean;
  style?: React.CSSProperties;
}> = ({ text, start, end, frameOffset = 0, caretColor = "#1C1E21", showCaret = true, style }) => {
  const frame = useCurrentFrame() - frameOffset;
  const n = typedChars(frame, start, end, text.length);
  const typing = frame >= start && frame <= end;
  const caretOn = showCaret && frame >= start && (typing || Math.floor(frame / 15) % 2 === 0);
  return (
    <span style={{ whiteSpace: "pre-wrap", ...style }}>
      {text.slice(0, n)}
      <span
        style={{
          display: "inline-block",
          width: 2,
          height: "1.1em",
          marginLeft: 1,
          verticalAlign: "text-bottom",
          background: caretColor,
          opacity: caretOn ? 1 : 0,
        }}
      />
    </span>
  );
};
