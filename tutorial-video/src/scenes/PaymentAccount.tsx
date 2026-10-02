import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame } from "remotion";
import { cardStyle, colors, FPS } from "../theme";
import { Camera } from "../components/Camera";
import { Cursor } from "../components/Cursor";
import { LAYOUT } from "../components/BusinessSuite";
import { PAYMENTS, PaymentsFrame } from "../components/PaymentsFrame";
import { AlertIcon, BankIcon, MoneyIcon } from "../components/Icons";
import { appear, LEAD } from "./anim";

export const BANNER_Y = PAYMENTS.contentY;
const X = LAYOUT.contentX;
const W = 1560;

/** Banner rojo de restricción, reutilizado en otras escenas de Pagos. */
export const RestrictionBanner: React.FC<{ underline?: number; style?: React.CSSProperties }> = ({
  underline = 0,
  style,
}) => (
  <div
    style={{
      ...cardStyle,
      position: "absolute",
      left: X,
      top: BANNER_Y,
      width: W,
      padding: "24px 30px",
      display: "flex",
      gap: 20,
      borderLeft: `6px solid ${colors.red}`,
      background: "#FFF8F9",
      ...style,
    }}
  >
    <AlertIcon size={34} />
    <div>
      <div style={{ fontSize: 23, fontWeight: 700, color: colors.red }}>
        Se restringió la monetización en tu cuenta de pago
      </div>
      <div style={{ fontSize: 20, marginTop: 10, lineHeight: 1.55, color: colors.text }}>
        Tu cuenta de pago FABIAN ANDRES RODRIGUEZ (2647••••••••8965) se desactivó debido a{" "}
        <span
          style={{
            fontWeight: 700,
            backgroundImage: `linear-gradient(${colors.yellow}, ${colors.yellow})`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "0 92%",
            backgroundSize: `${underline * 100}% 7px`,
            padding: "0 2px",
          }}
        >
          actividad inusual
        </span>
        .
      </div>
    </div>
  </div>
);

export const PaymentAccount: React.FC = () => {
  const frame = useCurrentFrame() - LEAD;
  const slide = spring({ frame: frame - 12, fps: FPS, config: { damping: 18, stiffness: 120 } });
  const underline = interpolate(frame, [95, 125], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Posición aproximada de "actividad inusual" dentro del banner.
  const phrase = { x: X + 1000, y: BANNER_Y + 92 };

  return (
    <AbsoluteFill>
      <Camera
        frameOffset={LEAD}
        keys={[
          { frame: 0, scale: 1 },
          { frame: 55, scale: 1 },
          { frame: 90, scale: 1.7, x: phrase.x - 120, y: phrase.y + 10 },
          { frame: 190, scale: 1.75, x: phrase.x - 110, y: phrase.y + 10 },
          { frame: 230, scale: 1.25, x: 960, y: 560 },
          { frame: 300, scale: 1.25, x: 960, y: 580 },
        ]}
      >
        <PaymentsFrame tab="resumen">
          <RestrictionBanner
            underline={underline}
            style={{
              opacity: interpolate(slide, [0, 0.4], [0, 1], { extrapolateRight: "clamp" }),
              transform: `translateY(${(1 - slide) * -120}px)`,
            }}
          />
          <div style={{ position: "absolute", left: X, top: BANNER_Y + 170, width: W, display: "flex", gap: 24 }}>
            <div style={{ ...cardStyle, flex: 1, padding: "26px 30px", ...appear(frame, 30) }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 19, color: colors.textMuted }}>
                <MoneyIcon size={24} color={colors.textMuted} /> Pendiente de pago
              </div>
              <div style={{ fontSize: 48, fontWeight: 800, marginTop: 12 }}>$--.--</div>
              <div style={{ fontSize: 17, color: colors.red, marginTop: 8, fontWeight: 600 }}>
                Pagos en pausa mientras la cuenta esté desactivada
              </div>
            </div>
            <div style={{ ...cardStyle, flex: 1, padding: "26px 30px", ...appear(frame, 38) }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 19, color: colors.textMuted }}>
                <BankIcon size={24} color={colors.textMuted} /> Método de cobro
              </div>
              <div style={{ fontSize: 30, fontWeight: 700, marginTop: 18 }}>Bancolombia ••••</div>
              <div style={{ fontSize: 17, color: colors.textMuted, marginTop: 10 }}>
                Cuenta de ahorros · COP
              </div>
            </div>
          </div>
        </PaymentsFrame>
        <Cursor
          frameOffset={LEAD}
          points={[
            { frame: 0, x: 1300, y: 700 },
            { frame: 60, x: 1250, y: 520 },
            { frame: 100, x: phrase.x - 60, y: phrase.y + 18 },
            { frame: 128, x: phrase.x + 100, y: phrase.y + 18 },
            { frame: 240, x: 1000, y: 640 },
          ]}
        />
      </Camera>
    </AbsoluteFill>
  );
};
