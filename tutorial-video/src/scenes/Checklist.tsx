import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame } from "remotion";
import { cardStyle, colors, FPS, fontFamily } from "../theme";
import { CheckIcon, DocIcon } from "../components/Icons";
import { appear, LEAD } from "./anim";

const ITEMS = [
  "Cédula por las dos caras, a color y con las 4 esquinas visibles",
  "Selfie sin gorra ni gafas",
  "Extracto bancario de menos de 6 meses con tu nombre completo",
  "Nombre, fecha y dirección idénticos al documento",
  "Un solo envío, sin repetir",
];

export const Checklist: React.FC = () => {
  const frame = useCurrentFrame() - LEAD;
  const zoom = interpolate(frame, [0, 240], [1, 1.05]);

  return (
    <AbsoluteFill style={{ background: colors.bgGradient, fontFamily, color: colors.text, alignItems: "center" }}>
      <div
        style={{
          ...cardStyle,
          marginTop: 110,
          width: 1180,
          padding: "36px 48px 22px",
          ...appear(frame, 0, 30),
          scale: String(zoom),
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: 12, background: colors.blueSoft, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <DocIcon size={30} color={colors.blue} />
          </div>
          <div>
            <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: -0.5 }}>Checklist antes de reenviar documentos</div>
            <div style={{ fontSize: 20, color: colors.textMuted, marginTop: 4 }}>Solo cuando el equipo de ayuda te responda</div>
          </div>
        </div>
        <div style={{ marginTop: 26 }}>
          {ITEMS.map((t, i) => {
            const at = 28 + i * 34;
            const p = spring({ frame: frame - at, fps: FPS, config: { damping: 12, stiffness: 200 } });
            const done = frame >= at;
            return (
              <div
                key={t}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 22,
                  height: 78,
                  borderTop: `1px solid ${colors.border}`,
                  fontSize: 27,
                  fontWeight: done ? 600 : 500,
                  color: done ? colors.text : colors.textMuted,
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 8,
                    border: `2px solid ${done ? colors.blue : "#BCC0C4"}`,
                    background: done ? colors.blue : "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <div style={{ transform: `scale(${done ? p : 0})` }}>
                    <CheckIcon size={26} color="#fff" />
                  </div>
                </div>
                {t}
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
