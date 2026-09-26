import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { colors, fontFamily, radius } from "../theme";
import { Camera } from "../components/Camera";
import { Cursor } from "../components/Cursor";
import { GenericLogo, MyAvatar } from "../components/Brand";
import { ChevronRight, InfoIcon, SearchIcon, ShieldIcon } from "../components/Icons";
import { appear, LEAD } from "./anim";

const COL_X = 460;
const COL_W = 1000;
const FEAT_TOP = 470;
const ROW_H = 78;
const MONET_Y = FEAT_TOP + 64 + ROW_H + ROW_H / 2;
const CLICK = 88;

const card: React.CSSProperties = {
  position: "absolute",
  left: COL_X,
  width: COL_W,
  background: colors.fbDarkCard,
  borderRadius: radius,
  border: `1px solid ${colors.fbDarkBorder}`,
  boxShadow: "0 2px 12px rgba(0,0,0,0.35)",
};

const Status: React.FC<{ label: string; tone: "ok" | "bad" }> = ({ label, tone }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      fontSize: 19,
      fontWeight: 600,
      color: tone === "ok" ? "#4CC36B" : "#FF5A73",
    }}
  >
    <span
      style={{
        width: 11,
        height: 11,
        borderRadius: "50%",
        background: tone === "ok" ? "#31A24C" : colors.red,
      }}
    />
    {label}
    <ChevronRight size={20} color={colors.fbDarkMuted} />
  </div>
);

export const AccountStatus: React.FC = () => {
  const frame = useCurrentFrame() - LEAD;
  const pressed = frame >= CLICK;
  const ring = interpolate(frame, [CLICK, CLICK + 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const features = [
    { label: "Recomendaciones", status: "Activo", tone: "ok" as const },
    { label: "Monetización", status: "Suspendido", tone: "bad" as const },
    { label: "Marketplace", status: "Activo", tone: "ok" as const },
  ];

  return (
    <AbsoluteFill style={{ background: colors.fbDarkBg, fontFamily, color: colors.fbDarkText }}>
      <Camera
        frameOffset={LEAD}
        keys={[
          { frame: 0, scale: 1.04, x: 960, y: 480 },
          { frame: 70, scale: 1, x: 960, y: 540 },
          { frame: 100, scale: 1.75, x: 960, y: MONET_Y - 10 },
          { frame: 230, scale: 1.8, x: 960, y: MONET_Y - 10 },
        ]}
      >
        {/* Barra superior */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            height: 60,
            background: colors.fbDarkCard,
            borderBottom: `1px solid ${colors.fbDarkBorder}`,
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "0 20px",
          }}
        >
          <GenericLogo size={40} />
          <div
            style={{
              height: 40,
              width: 280,
              borderRadius: 20,
              background: "#3A3B3C",
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "0 14px",
              color: colors.fbDarkMuted,
              fontSize: 16,
            }}
          >
            <SearchIcon size={18} /> Buscar
          </div>
          <div style={{ flex: 1 }} />
          <MyAvatar size={40} />
        </div>

        {/* Menú lateral */}
        <div style={{ position: "absolute", left: 24, top: 96, width: 360 }}>
          <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 22 }}>Configuración</div>
          {["Centro de cuentas", "Estado de la cuenta", "Privacidad", "Notificaciones"].map((t) => {
            const on = t === "Estado de la cuenta";
            return (
              <div
                key={t}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  height: 52,
                  padding: "0 14px",
                  borderRadius: radius,
                  fontSize: 18,
                  fontWeight: on ? 700 : 500,
                  background: on ? "#3A3B3C" : "transparent",
                }}
              >
                <ShieldIcon size={22} color={on ? "#4B8BFF" : colors.fbDarkMuted} />
                {t}
              </div>
            );
          })}
        </div>

        {/* Tarjeta: Estado de la cuenta */}
        <div style={{ ...card, top: 96, padding: "26px 30px", ...appear(frame, 0, 16) }}>
          <div style={{ fontSize: 30, fontWeight: 700 }}>Estado de la cuenta</div>
          <div style={{ fontSize: 19, color: colors.fbDarkMuted, marginTop: 10, lineHeight: 1.45 }}>
            Tu cuenta tiene restricciones. Consulta los detalles y lo que puedes hacer para
            resolverlos.
          </div>
          <div
            style={{
              marginTop: 22,
              padding: "18px 20px",
              borderRadius: radius,
              background: "#2F3031",
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <InfoIcon size={26} color="#FF5A73" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 19, fontWeight: 600 }}>
                No puedes cambiar los nombres de las páginas
              </div>
              <div style={{ fontSize: 17, color: colors.fbDarkMuted, marginTop: 4 }}>
                Finaliza el 27 oct. 2026
              </div>
            </div>
            <ChevronRight size={22} color={colors.fbDarkMuted} />
          </div>
          <div
            style={{
              marginTop: 14,
              padding: "16px 20px",
              borderRadius: radius,
              background: "#2F3031",
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <MyAvatar size={52} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 20, fontWeight: 700 }}>Fabian Andres Rodriguez</div>
              <div
                style={{
                  fontSize: 17,
                  color: colors.fbDarkMuted,
                  marginTop: 4,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span
                  style={{ width: 11, height: 11, borderRadius: "50%", background: colors.yellow }}
                />
                El perfil tiene algunos problemas
              </div>
            </div>
            <ChevronRight size={22} color={colors.fbDarkMuted} />
          </div>
        </div>

        {/* Tarjeta: Funciones adicionales */}
        <div style={{ ...card, top: FEAT_TOP, ...appear(frame, 10, 16) }}>
          <div style={{ height: 64, display: "flex", alignItems: "center", padding: "0 30px", fontSize: 24, fontWeight: 700 }}>
            Funciones adicionales
          </div>
          {features.map((f) => {
            const isMonet = f.label === "Monetización";
            return (
              <div
                key={f.label}
                style={{
                  height: ROW_H,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0 30px",
                  borderTop: `1px solid ${colors.fbDarkBorder}`,
                  fontSize: 20,
                  fontWeight: 500,
                  background: isMonet && pressed ? "rgba(200,16,46,0.14)" : "transparent",
                  boxShadow: isMonet
                    ? `inset 0 0 0 ${3 * ring}px rgba(255,90,115,${ring})`
                    : undefined,
                  borderRadius: isMonet ? 6 : 0,
                }}
              >
                {f.label}
                <Status label={f.status} tone={f.tone} />
              </div>
            );
          })}
        </div>

        <Cursor
          frameOffset={LEAD}
          points={[
            { frame: 0, x: 1500, y: 360 },
            { frame: 45, x: 1400, y: 520 },
            { frame: CLICK, x: COL_X + COL_W - 45, y: MONET_Y + 6, click: true },
          ]}
        />
      </Camera>
    </AbsoluteFill>
  );
};
