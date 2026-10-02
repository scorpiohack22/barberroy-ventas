import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { cardStyle, colors } from "../theme";
import { Camera } from "../components/Camera";
import { Cursor } from "../components/Cursor";
import { Blurred, GrayAvatar } from "../components/Brand";
import { LAYOUT } from "../components/BusinessSuite";
import { PAYMENTS, PaymentsFrame } from "../components/PaymentsFrame";
import { AlertIcon, BankIcon, CheckCircleIcon, DocIcon, UserIcon, UsersIcon } from "../components/Icons";
import { appear, LEAD, pop } from "./anim";
import { RestrictionBanner } from "./PaymentAccount";

const X = LAYOUT.contentX;
const W = 1000;
const CLICK = 30;

const A = { top: 290, h: 96 };
const B = { top: 398, h: 236 };
const C = { top: 646, h: 116 };
const D = { top: 774, h: 106 };

const T = { a: 42, b: 196, tags: [228, 248, 268], c: 300, cTag: 326, d: 380, dTag: 404 };

const Tag: React.FC<{ children: React.ReactNode; y: number; at: number; frame: number }> = ({
  children,
  y,
  at,
  frame,
}) => (
  <div style={{ position: "absolute", left: X + W, top: y - 18, height: 36, display: "flex", alignItems: "center", ...appear(frame, at, 0) }}>
    <div style={{ width: 50, height: 2, background: colors.red, opacity: 0.6 }} />
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        height: 36,
        padding: "0 16px",
        borderRadius: 8,
        background: colors.red,
        color: "#fff",
        fontSize: 18,
        fontWeight: 700,
        whiteSpace: "nowrap",
        boxShadow: "0 6px 18px rgba(200,16,46,0.3)",
        ...pop(frame, at),
      }}
    >
      <AlertIcon size={20} color="#fff" mark={colors.red} />
      {children}
    </div>
  </div>
);

const Field: React.FC<{ label: string; w: number }> = ({ label, w }) => (
  <div style={{ display: "flex", alignItems: "center", height: 40, fontSize: 18 }}>
    <div style={{ width: 230, color: colors.textMuted }}>{label}</div>
    <Blurred width={w} style={{ fontWeight: 600 }} />
  </div>
);

const CardTitle: React.FC<{ Icon: React.FC<{ size?: number; color?: string }>; children: React.ReactNode }> = ({
  Icon,
  children,
}) => (
  <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 21, fontWeight: 700 }}>
    <Icon size={24} color={colors.blue} />
    {children}
  </div>
);

export const Settings: React.FC = () => {
  const frame = useCurrentFrame() - LEAD;
  const onSettings = frame >= CLICK + 2;

  const card = (pos: { top: number; h: number }, at: number): React.CSSProperties => ({
    ...cardStyle,
    position: "absolute",
    left: X,
    top: pos.top,
    width: W,
    height: pos.h,
    padding: "20px 26px",
    boxSizing: "border-box",
    ...appear(frame, at),
  });

  return (
    <AbsoluteFill>
      <Camera
        frameOffset={LEAD}
        keys={[
          { frame: 0, scale: 1.25, x: 960, y: 580 },
          { frame: 25, scale: 1, x: 960, y: 540 },
          { frame: 50, scale: 1, x: 960, y: 540 },
          { frame: 75, scale: 1.8, x: 820, y: A.top + A.h / 2 + 20 },
          { frame: 180, scale: 1.8, x: 830, y: A.top + A.h / 2 + 20 },
          { frame: 205, scale: 1.28, x: 1060, y: B.top + B.h / 2 },
          { frame: 290, scale: 1.28, x: 1065, y: B.top + B.h / 2 },
          { frame: 312, scale: 1.26, x: 1065, y: C.top + C.h / 2 - 30 },
          { frame: 370, scale: 1.26, x: 1065, y: C.top + C.h / 2 - 30 },
          { frame: 392, scale: 1.26, x: 1065, y: D.top + D.h / 2 - 60 },
          { frame: 440, scale: 1.26, x: 1065, y: D.top + D.h / 2 - 60 },
          { frame: 470, scale: 1.04, x: 1000, y: 560 },
        ]}
      >
        <PaymentsFrame tab={onSettings ? "configuracion" : "resumen"}>
          {!onSettings ? (
            <RestrictionBanner underline={1} />
          ) : (
            <>
              <div style={card(A, T.a)}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <CardTitle Icon={DocIcon}>Información fiscal W8/W9</CardTitle>
                    <div style={{ display: "flex", alignItems: "center", marginTop: 12, fontSize: 18, color: colors.textMuted, gap: 12 }}>
                      NIF <Blurred width={170}>000.000.000-0</Blurred>
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 18px",
                      borderRadius: 999,
                      background: colors.greenSoft,
                      color: colors.green,
                      fontSize: 20,
                      fontWeight: 700,
                      ...pop(frame, T.a + 30),
                    }}
                  >
                    <CheckCircleIcon size={26} /> Verificada
                  </div>
                </div>
              </div>

              <div style={card(B, T.b)}>
                <CardTitle Icon={UserIcon}>Propietario de la cuenta de pago</CardTitle>
                <div style={{ marginTop: 12 }}>
                  <Field label="Nombre" w={260} />
                  <Field label="Teléfono" w={150} />
                  <Field label="Dirección" w={380} />
                  <Field label="Fecha de nacimiento" w={160} />
                </div>
              </div>

              <div style={card(C, T.c)}>
                <CardTitle Icon={UsersIcon}>Administradores de la cuenta de pago</CardTitle>
                <div style={{ display: "flex", gap: 30, marginTop: 16 }}>
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <GrayAvatar size={36} />
                      <Blurred width={120} style={{ fontSize: 17 }}>
                        Xxxxxx Xxxxx
                      </Blurred>
                    </div>
                  ))}
                </div>
              </div>

              <div style={card(D, T.d)}>
                <CardTitle Icon={BankIcon}>Orígenes de ingresos</CardTitle>
                <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 16, fontSize: 19 }}>
                  <span style={{ fontWeight: 800, fontSize: 24, color: colors.red }}>8</span>
                  orígenes de ingresos
                  <span style={{ color: colors.textMuted }}>→</span>
                  <span style={{ fontWeight: 700 }}>1 cuenta: Bancolombia ••••</span>
                </div>
              </div>

              <Tag y={B.top + 78} at={T.tags[2]} frame={frame}>Nombre incompleto</Tag>
              <Tag y={B.top + 118} at={T.tags[0]} frame={frame}>Teléfono incompleto</Tag>
              <Tag y={B.top + 158} at={T.tags[1]} frame={frame}>Dirección mal escrita</Tag>
              <Tag y={C.top + C.h / 2} at={T.cTag} frame={frame}>4 administradores, incluidos terceros</Tag>
              <Tag y={D.top + D.h / 2} at={T.dTag} frame={frame}>Patrón que parece red</Tag>
            </>
          )}
        </PaymentsFrame>
        <Cursor
          frameOffset={LEAD}
          points={[
            { frame: 0, x: 1000, y: 640 },
            { frame: CLICK, ...PAYMENTS.tabCenter("configuracion"), click: true },
            { frame: 100, x: X + W - 150, y: A.top + A.h / 2 + 10 },
            { frame: 215, x: X + 560, y: B.top + 90 },
            { frame: 322, x: X + 600, y: C.top + 90 },
            { frame: 402, x: X + 720, y: D.top + 80 },
          ]}
        />
      </Camera>
    </AbsoluteFill>
  );
};
