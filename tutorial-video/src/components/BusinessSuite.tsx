import React from "react";
import { colors, fontFamily, radius } from "../theme";
import { GenericLogo, MyAvatar } from "./Brand";
import {
  BellIcon,
  CardIcon,
  ChatIcon,
  ChevronDown,
  GearIcon,
  GridIcon,
  HelpIcon,
  HomeIcon,
  MegaphoneIcon,
  SearchIcon,
} from "./Icons";

/** Coordenadas del layout (en px de la pantalla 1920x1080), usadas por el cursor. */
export const LAYOUT = {
  topbarH: 64,
  sidebarW: 260,
  contentX: 308,
  contentY: 100,
  navItemY: (i: number) => 64 + 28 + i * 54 + 22,
};

export type NavKey =
  | "inicio"
  | "notificaciones"
  | "anuncios"
  | "contenido"
  | "bandeja"
  | "pagos"
  | "configuracion"
  | "ayuda";

export const NAV: { key: NavKey; label: string; Icon: React.FC<{ size?: number; color?: string }> }[] = [
  { key: "inicio", label: "Inicio", Icon: HomeIcon },
  { key: "notificaciones", label: "Notificaciones", Icon: BellIcon },
  { key: "anuncios", label: "Anuncios", Icon: MegaphoneIcon },
  { key: "contenido", label: "Contenido", Icon: GridIcon },
  { key: "bandeja", label: "Bandeja de entrada", Icon: ChatIcon },
  { key: "pagos", label: "Pagos", Icon: CardIcon },
  { key: "configuracion", label: "Configuración", Icon: GearIcon },
  { key: "ayuda", label: "Ayuda", Icon: HelpIcon },
];

/** Marco general tipo Business Suite: barra superior, menú lateral y fondo degradado. */
export const BusinessSuite: React.FC<{ active: NavKey; children: React.ReactNode }> = ({
  active,
  children,
}) => {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: colors.bgGradient,
        fontFamily,
        color: colors.text,
      }}
    >
      {/* Barra superior */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          right: 0,
          height: LAYOUT.topbarH,
          background: "rgba(255,255,255,0.92)",
          borderBottom: `1px solid ${colors.border}`,
          display: "flex",
          alignItems: "center",
          padding: "0 28px",
          gap: 14,
        }}
      >
        <GenericLogo size={36} />
        <div style={{ fontSize: 21, fontWeight: 700 }}>Business Suite</div>
        <div
          style={{
            marginLeft: 60,
            width: 420,
            height: 40,
            borderRadius: 20,
            background: "#F0F2F5",
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "0 16px",
            color: colors.textMuted,
            fontSize: 16,
          }}
        >
          <SearchIcon size={18} />
          Buscar
        </div>
        <div style={{ flex: 1 }} />
        <BellIcon size={24} color={colors.textMuted} />
        <HelpIcon size={24} color={colors.textMuted} />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "6px 12px 6px 6px",
            borderRadius: 24,
            background: "#F0F2F5",
            marginLeft: 8,
          }}
        >
          <MyAvatar size={34} />
          <span style={{ fontSize: 16, fontWeight: 600 }}>Fabian Andres Rodriguez</span>
          <ChevronDown size={18} color={colors.textMuted} />
        </div>
      </div>

      {/* Menú lateral */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: LAYOUT.topbarH,
          bottom: 0,
          width: LAYOUT.sidebarW,
          background: "rgba(255,255,255,0.75)",
          borderRight: `1px solid ${colors.border}`,
          padding: "28px 14px",
        }}
      >
        {NAV.map(({ key, label, Icon }) => {
          const on = key === active;
          return (
            <div
              key={key}
              style={{
                height: 44,
                marginBottom: 10,
                borderRadius: radius,
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "0 14px",
                fontSize: 17,
                fontWeight: on ? 700 : 500,
                color: on ? colors.blue : colors.text,
                background: on ? colors.blueSoft : "transparent",
              }}
            >
              <Icon size={22} color={on ? colors.blue : colors.textMuted} />
              {label}
            </div>
          );
        })}
      </div>

      {/* Contenido */}
      <div style={{ position: "absolute", inset: 0 }}>{children}</div>
    </div>
  );
};

export const Button: React.FC<{
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  style?: React.CSSProperties;
}> = ({ children, variant = "primary", style }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      height: 40,
      padding: "0 18px",
      borderRadius: 6,
      fontSize: 16,
      fontWeight: 600,
      whiteSpace: "nowrap",
      background: variant === "primary" ? colors.blue : "#E4E6EB",
      color: variant === "primary" ? "#fff" : colors.text,
      ...style,
    }}
  >
    {children}
  </div>
);
