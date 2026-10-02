import React from "react";
import { colors, radius } from "../theme";
import { BusinessSuite, LAYOUT } from "./BusinessSuite";
import { MyAvatar } from "./Brand";
import { ChevronDown } from "./Icons";

export type PaymentsTab = "resumen" | "actividad" | "configuracion" | "ayuda";

const TABS: { key: PaymentsTab; label: string; x: number; w: number }[] = [
  { key: "resumen", label: "Resumen", x: 0, w: 120 },
  { key: "actividad", label: "Actividad", x: 132, w: 124 },
  { key: "configuracion", label: "Configuración", x: 268, w: 170 },
  { key: "ayuda", label: "Ayuda", x: 450, w: 100 },
];

export const PAYMENTS = {
  tabsY: 226,
  contentY: 300,
  /** Centro de una pestaña, para apuntar con el cursor. */
  tabCenter: (key: PaymentsTab) => {
    const t = TABS.find((x) => x.key === key)!;
    return { x: LAYOUT.contentX + t.x + t.w / 2, y: 226 + 24 };
  },
};

/** Página "Pagos" con selector de cuenta de pago y pestañas. */
export const PaymentsFrame: React.FC<{ tab: PaymentsTab; children: React.ReactNode }> = ({
  tab,
  children,
}) => (
  <BusinessSuite active="pagos">
    <div
      style={{
        position: "absolute",
        left: LAYOUT.contentX,
        top: LAYOUT.contentY,
        fontSize: 32,
        fontWeight: 700,
      }}
    >
      Pagos
    </div>
    <div
      style={{
        position: "absolute",
        left: LAYOUT.contentX,
        top: 152,
        height: 50,
        padding: "0 16px 0 8px",
        background: "#fff",
        border: `1px solid ${colors.border}`,
        borderRadius: radius,
        display: "flex",
        alignItems: "center",
        gap: 12,
        fontSize: 17,
        fontWeight: 600,
      }}
    >
      <MyAvatar size={34} />
      FABIAN ANDRES RODRIGUEZ (2647••••8965)
      <ChevronDown size={20} color={colors.textMuted} />
    </div>
    <div
      style={{
        position: "absolute",
        left: LAYOUT.contentX,
        top: PAYMENTS.tabsY,
        right: 48,
        height: 50,
        borderBottom: `1px solid ${colors.border}`,
      }}
    >
      {TABS.map((t) => {
        const on = t.key === tab;
        return (
          <div
            key={t.key}
            style={{
              position: "absolute",
              left: t.x,
              top: 0,
              width: t.w,
              height: 50,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 17,
              fontWeight: on ? 700 : 500,
              color: on ? colors.blue : colors.textMuted,
              borderBottom: on ? `3px solid ${colors.blue}` : "3px solid transparent",
              boxSizing: "border-box",
            }}
          >
            {t.label}
          </div>
        );
      })}
    </div>
    {children}
  </BusinessSuite>
);
