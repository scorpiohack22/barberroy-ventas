import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { colors, fontFamily } from "../theme";
import { AlertIcon, DocIcon, MoneyIcon, RobotIcon, UsersIcon } from "../components/Icons";
import { appear, LEAD, pop } from "./anim";

const ITEMS: { Icon: React.FC<{ size?: number; color?: string }>; text: React.ReactNode }[] = [
  { Icon: AlertIcon, text: <>El bloqueo es por <b>“actividad inusual”</b>, no por identidad.</> },
  { Icon: DocIcon, text: <>Los datos del titular <b>no coinciden</b> con el documento.</> },
  { Icon: UsersIcon, text: <>Hay <b>administradores de terceros</b> en la cuenta de pago.</> },
  { Icon: MoneyIcon, text: <>Varias páginas cobran en <b>una sola cuenta</b>.</> },
  {
    Icon: RobotIcon,
    text: <>Hay <b>bots o agentes</b> controlando el navegador (se detectan como actividad inusual).</>,
  },
];

export const Diagnosis: React.FC = () => {
  const frame = useCurrentFrame() - LEAD;
  const drift = interpolate(frame, [0, 300], [1.02, 1.07]);

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(160deg, #FBFCFF 0%, #F1F0FF 100%)",
        fontFamily,
        color: colors.text,
      }}
    >
      {/* Cuadrícula tipo pizarra */}
      <AbsoluteFill
        style={{
          backgroundImage:
            "linear-gradient(rgba(8,102,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(8,102,255,0.06) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <AbsoluteFill style={{ transform: `scale(${drift})`, padding: "90px 200px" }}>
        <div style={{ fontSize: 26, fontWeight: 700, color: colors.blue, letterSpacing: 3, textTransform: "uppercase", ...appear(frame, 0) }}>
          Diagnóstico
        </div>
        <div style={{ fontSize: 60, fontWeight: 800, marginTop: 10, letterSpacing: -1, ...appear(frame, 4) }}>
          Lo que de verdad estaba pasando
        </div>
        <div style={{ marginTop: 44 }}>
          {ITEMS.map(({ Icon, text }, i) => {
            const at = 24 + i * 40;
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 26,
                  marginBottom: 24,
                  padding: "18px 26px",
                  background: "#fff",
                  borderRadius: 8,
                  border: `1px solid ${colors.border}`,
                  boxShadow: "0 2px 10px rgba(40,60,120,0.06)",
                  fontSize: 32,
                  ...appear(frame, at, 30),
                }}
              >
                <div
                  style={{
                    width: 58,
                    height: 58,
                    borderRadius: "50%",
                    background: i === 0 || i === 4 ? colors.redSoft : colors.blueSoft,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    ...pop(frame, at + 4),
                  }}
                >
                  <Icon size={30} color={i === 0 || i === 4 ? colors.red : colors.blue} />
                </div>
                <div style={{ fontSize: 26, fontWeight: 800, color: colors.textMuted, width: 30 }}>{i + 1}.</div>
                <div style={{ flex: 1, lineHeight: 1.3 }}>{text}</div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
