import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { cardStyle, colors } from "../theme";
import { Camera } from "../components/Camera";
import { Cursor } from "../components/Cursor";
import { Blurred } from "../components/Brand";
import { BusinessSuite, Button, LAYOUT } from "../components/BusinessSuite";
import { AlertIcon, MegaphoneIcon, MoneyIcon, UserIcon } from "../components/Icons";
import { appear, LEAD } from "./anim";

const CARD_X = LAYOUT.contentX;
const CARD_Y = 330;
const CARD_W = 1560;
const HEAD = 70 + 56 + 50;
const ROW_H = 88;
const rowCenter = (i: number) => CARD_Y + HEAD + ROW_H * i + ROW_H / 2;
const COLS = { asset: 28, type: 520, status: 820, date: 1040, action: 1250 };

const Pill: React.FC = () => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "6px 12px",
      borderRadius: 999,
      background: colors.redSoft,
      color: colors.red,
      fontSize: 16,
      fontWeight: 700,
    }}
  >
    <AlertIcon size={16} /> Restringida
  </span>
);

export const RecentIssues: React.FC = () => {
  const frame = useCurrentFrame() - LEAD;
  const hover = interpolate(frame, [96, 104], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const rows = [
    {
      name: "Scorpio Network",
      id: <span>ID 2647••••••••8965</span>,
      date: "17 sep 2026",
      action: "Pagar saldo actual",
    },
    {
      name: "I Commerce",
      id: (
        <span>
          ID <Blurred width={150}>0000000000000</Blurred>
        </span>
      ),
      date: "—",
      action: "Tomar medidas",
    },
  ];

  const summary = [
    { Icon: UserIcon, title: "Perfil", value: "Con problemas", color: "#B07A00" },
    { Icon: MegaphoneIcon, title: "Cuentas publicitarias", value: "2 restringidas", color: colors.red },
    { Icon: MoneyIcon, title: "Monetización", value: "Suspendida", color: colors.red },
  ];

  return (
    <AbsoluteFill>
      <Camera
        frameOffset={LEAD}
        keys={[
          { frame: 0, scale: 1 },
          { frame: 60, scale: 1 },
          { frame: 100, scale: 1.45, x: 1150, y: rowCenter(0) + 20 },
          { frame: 170, scale: 1.45, x: 1150, y: rowCenter(0) + 30 },
          { frame: 210, scale: 1.3, x: 1100, y: rowCenter(1) },
        ]}
      >
        <BusinessSuite active="inicio">
          <div style={{ position: "absolute", left: CARD_X, top: LAYOUT.contentY, fontSize: 32, fontWeight: 700 }}>
            Resumen de la cuenta
          </div>

          <div style={{ position: "absolute", left: CARD_X, top: 164, width: CARD_W, display: "flex", gap: 24 }}>
            {summary.map(({ Icon, title, value, color }, i) => (
              <div
                key={title}
                style={{
                  ...cardStyle,
                  flex: 1,
                  height: 128,
                  padding: "22px 26px",
                  display: "flex",
                  alignItems: "center",
                  gap: 18,
                  ...appear(frame, i * 6, 14),
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 12,
                    background: colors.blueSoft,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon size={28} color={colors.blue} />
                </div>
                <div>
                  <div style={{ fontSize: 17, color: colors.textMuted }}>{title}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color, marginTop: 4 }}>{value}</div>
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              ...cardStyle,
              position: "absolute",
              left: CARD_X,
              top: CARD_Y,
              width: CARD_W,
              overflow: "hidden",
              ...appear(frame, 18, 20),
            }}
          >
            <div style={{ height: 70, display: "flex", alignItems: "center", padding: "0 28px", fontSize: 24, fontWeight: 700 }}>
              Problemas recientes con la cuenta
            </div>
            <div style={{ height: 56, display: "flex", gap: 30, padding: "0 28px", borderBottom: `1px solid ${colors.border}` }}>
              <div style={{ display: "flex", alignItems: "center", fontSize: 17, fontWeight: 700, color: colors.blue, borderBottom: `3px solid ${colors.blue}` }}>
                Pendientes (2)
              </div>
              <div style={{ display: "flex", alignItems: "center", fontSize: 17, color: colors.textMuted }}>
                Resueltos
              </div>
            </div>
            <div style={{ position: "relative", height: 50, background: "#F7F8FA", fontSize: 15, fontWeight: 700, color: colors.textMuted, textTransform: "uppercase", letterSpacing: 0.6 }}>
              {(
                [
                  ["Activo", COLS.asset],
                  ["Tipo", COLS.type],
                  ["Estado", COLS.status],
                  ["Fecha", COLS.date],
                  ["Acción", COLS.action],
                ] as const
              ).map(([t, x]) => (
                <div key={t} style={{ position: "absolute", left: x, top: 16 }}>
                  {t}
                </div>
              ))}
            </div>
            {rows.map((r, i) => (
              <div
                key={r.name}
                style={{
                  position: "relative",
                  height: ROW_H,
                  borderTop: `1px solid ${colors.border}`,
                  fontSize: 18,
                  background: i === 0 ? `rgba(8,102,255,${0.05 * hover})` : "transparent",
                }}
              >
                <div style={{ position: "absolute", left: COLS.asset, top: 18, display: "flex", gap: 14, alignItems: "center" }}>
                  <div style={{ width: 48, height: 48, borderRadius: 8, background: "#E4E6EB", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <MegaphoneIcon size={24} color={colors.textMuted} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700 }}>{r.name}</div>
                    <div style={{ fontSize: 15, color: colors.textMuted, marginTop: 2 }}>{r.id}</div>
                  </div>
                </div>
                <div style={{ position: "absolute", left: COLS.type, top: 32 }}>Cuenta publicitaria</div>
                <div style={{ position: "absolute", left: COLS.status, top: 26 }}>
                  <Pill />
                </div>
                <div style={{ position: "absolute", left: COLS.date, top: 32 }}>{r.date}</div>
                <div style={{ position: "absolute", left: COLS.action, top: 24 }}>
                  <Button
                    variant={i === 0 ? "primary" : "secondary"}
                    style={
                      i === 0
                        ? {
                            background: hover > 0.5 ? colors.blueHover : colors.blue,
                            boxShadow: `0 0 0 ${4 * hover}px rgba(8,102,255,0.25)`,
                          }
                        : undefined
                    }
                  >
                    {r.action}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </BusinessSuite>
        <Cursor
          frameOffset={LEAD}
          points={[
            { frame: 0, x: 1200, y: 260 },
            { frame: 50, x: 1150, y: 420 },
            { frame: 98, x: CARD_X + COLS.action + 90, y: rowCenter(0) + 4 },
            { frame: 190, x: CARD_X + COLS.action + 80, y: rowCenter(0) + 8 },
            { frame: 225, x: CARD_X + COLS.action + 70, y: rowCenter(1) + 6 },
          ]}
        />
      </Camera>
    </AbsoluteFill>
  );
};
