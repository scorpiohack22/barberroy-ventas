import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame } from "remotion";
import { cardStyle, colors, FPS, radius } from "../theme";
import { Camera } from "../components/Camera";
import { Cursor } from "../components/Cursor";
import { typedChars } from "../components/Typewriter";
import { Button, LAYOUT } from "../components/BusinessSuite";
import { PAYMENTS, PaymentsFrame } from "../components/PaymentsFrame";
import { CheckCircleIcon, ChevronDown, HelpIcon, MailIcon } from "../components/Icons";
import { appear, LEAD } from "./anim";
import { RestrictionBanner } from "./PaymentAccount";
import { HELP_MESSAGE } from "./message";

/** Momentos clave (frames locales, sin contar el fundido). */
const T = {
  helpTab: 28,
  moreHelp: 76,
  showMore: 112,
  none: 146,
  next: 166,
  productOpen: 192,
  productPick: 222,
  problemOpen: 246,
  problemPick: 274,
  textarea: 296,
  typeStart: 306,
  typeEnd: 476,
  send: 500,
  sent: 538,
};

// Tarjeta de preguntas frecuentes
const FAQ = { x: LAYOUT.contentX, y: PAYMENTS.contentY, w: 1100, rowH: 60, head: 70 };
const FAQ_ITEMS = [
  "¿Cuándo recibiré mi pago?",
  "¿Por qué se restringió la monetización en mi cuenta de pago?",
  "¿Cómo actualizo mi información fiscal?",
  "¿Cómo cambio mi método de cobro?",
  "¿Qué documentos acepta la verificación de identidad?",
];
const FAQ_FOOT_Y = FAQ.y + FAQ.head + FAQ.rowH * FAQ_ITEMS.length;
const MORE_HELP_BTN = { x: FAQ.x + FAQ.w - 125, y: FAQ_FOOT_Y + 45 };

// Modal
const M = { x: 560, y: 140, w: 800, h: 640, head: 70 };
const OPT_Y = (i: number) => M.y + 150 + 60 * i + 30;
const TOPICS = [
  "No recibí un pago",
  "Actualizar información fiscal",
  "Cambiar el método de cobro",
  "Verificación de identidad",
  "Mi cuenta de pago está en revisión",
  "Ninguna de las opciones anteriores",
];
const FOOT_BTN = { x: M.x + M.w - 90, y: M.y + M.h - 44 };

const PRODUCT_SEL = { y: M.y + 145 };
const PROBLEM_SEL = { y: M.y + 245 };
const TEXTAREA = { y: M.y + 320, h: 200 };
const MENU_ROW = 50;
const PRODUCTS = [
  "Estrellas",
  "Suscripciones",
  "Programa de bonificaciones por rendimiento",
  "Anuncios in-stream",
];
const PROBLEMS = ["No recibí mi pago", "Mi cuenta de pago está en revisión", "Tengo otro problema"];
const menuRowY = (selY: number, i: number) => selY + 36 + 6 + MENU_ROW * i + MENU_ROW / 2;

const Radio: React.FC<{ on: boolean }> = ({ on }) => (
  <div
    style={{
      width: 22,
      height: 22,
      borderRadius: "50%",
      border: `2px solid ${on ? colors.blue : "#8A8D91"}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    }}
  >
    {on ? <div style={{ width: 12, height: 12, borderRadius: "50%", background: colors.blue }} /> : null}
  </div>
);

const Select: React.FC<{ label: string; value?: string; y: number; open: boolean; focus: boolean }> = ({
  label,
  value,
  y,
  open,
  focus,
}) => (
  <>
    <div style={{ position: "absolute", left: 40, top: y - M.y - 60, fontSize: 18, fontWeight: 700 }}>{label}</div>
    <div
      style={{
        position: "absolute",
        left: 40,
        right: 40,
        top: y - M.y - 30,
        height: 60,
        border: `${focus || open ? 2 : 1}px solid ${focus || open ? colors.blue : colors.border}`,
        borderRadius: radius,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 18px",
        fontSize: 19,
        color: value ? colors.text : colors.textMuted,
        boxSizing: "border-box",
        background: "#fff",
      }}
    >
      {value ?? "Selecciona una opción"}
      <ChevronDown size={22} color={colors.textMuted} />
    </div>
  </>
);

const Menu: React.FC<{ y: number; items: string[]; hover: number; progress: number }> = ({
  y,
  items,
  hover,
  progress,
}) => (
  <div
    style={{
      position: "absolute",
      left: 40,
      right: 40,
      top: y - M.y + 36,
      background: "#fff",
      borderRadius: radius,
      boxShadow: "0 12px 32px rgba(0,0,0,0.18)",
      border: `1px solid ${colors.border}`,
      padding: "6px 0",
      zIndex: 5,
      opacity: progress,
      transform: `translateY(${(1 - progress) * -10}px)`,
    }}
  >
    {items.map((t, i) => (
      <div
        key={t}
        style={{
          height: MENU_ROW,
          display: "flex",
          alignItems: "center",
          padding: "0 18px",
          fontSize: 18,
          background: i === hover ? colors.blueSoft : "transparent",
          color: i === hover ? colors.blue : colors.text,
          fontWeight: i === hover ? 600 : 400,
        }}
      >
        {t}
      </div>
    ))}
  </div>
);

const Spinner: React.FC<{ frame: number }> = ({ frame }) => (
  <svg width={22} height={22} viewBox="0 0 22 22" style={{ transform: `rotate(${frame * 14}deg)` }}>
    <circle cx={11} cy={11} r={8.5} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={3} />
    <path d="M11 2.5a8.5 8.5 0 0 1 8.5 8.5" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" />
  </svg>
);

export const Solution: React.FC = () => {
  const frame = useCurrentFrame() - LEAD;
  const tab = frame >= T.helpTab + 2 ? "ayuda" : "resumen";
  const modalIn = spring({ frame: frame - (T.moreHelp + 3), fps: FPS, config: { damping: 20, stiffness: 170 } });
  const showModal = frame >= T.moreHelp + 3;
  const expanded = frame >= T.showMore + 2;
  const step2 = frame >= T.next + 3;
  const sent = frame >= T.sent;

  const n = typedChars(frame, T.typeStart, T.typeEnd, HELP_MESSAGE.length);
  const productOpen = frame >= T.productOpen + 1 && frame < T.productPick + 3;
  const problemOpen = frame >= T.problemOpen + 1 && frame < T.problemPick + 3;
  const menuP = (at: number) =>
    interpolate(frame, [at + 1, at + 7], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const sentIn = spring({ frame: frame - T.sent, fps: FPS, config: { damping: 12, stiffness: 160 } });

  return (
    <AbsoluteFill>
      <Camera
        frameOffset={LEAD}
        keys={[
          { frame: 0, scale: 1 },
          { frame: 30, scale: 1 },
          { frame: 55, scale: 1.3, x: 860, y: 560 },
          { frame: 80, scale: 1.3, x: 900, y: 560 },
          { frame: 100, scale: 1.4, x: 960, y: 470 },
          { frame: 160, scale: 1.4, x: 960, y: 490 },
          { frame: 185, scale: 1.45, x: 960, y: 420 },
          { frame: 280, scale: 1.45, x: 960, y: 440 },
          { frame: 305, scale: 1.75, x: 960, y: TEXTAREA.y + 110 },
          { frame: 480, scale: 1.75, x: 960, y: TEXTAREA.y + 130 },
          { frame: 500, scale: 1.45, x: 960, y: 560 },
          { frame: 545, scale: 1.4, x: 960, y: 470 },
          { frame: 670, scale: 1.45, x: 960, y: 470 },
        ]}
      >
        <PaymentsFrame tab={tab}>
          {tab === "resumen" ? (
            <RestrictionBanner underline={1} />
          ) : (
            <div
              style={{
                ...cardStyle,
                position: "absolute",
                left: FAQ.x,
                top: FAQ.y,
                width: FAQ.w,
                overflow: "hidden",
                ...appear(frame, T.helpTab + 2, 16),
              }}
            >
              <div style={{ height: FAQ.head, display: "flex", alignItems: "center", gap: 12, padding: "0 28px", fontSize: 23, fontWeight: 700 }}>
                <HelpIcon size={26} color={colors.blue} /> Preguntas frecuentes
              </div>
              {FAQ_ITEMS.map((q) => (
                <div
                  key={q}
                  style={{
                    height: FAQ.rowH,
                    borderTop: `1px solid ${colors.border}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0 28px",
                    fontSize: 19,
                  }}
                >
                  {q}
                  <ChevronDown size={22} color={colors.textMuted} />
                </div>
              ))}
              <div
                style={{
                  height: 90,
                  borderTop: `1px solid ${colors.border}`,
                  background: "#F7F8FA",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0 28px",
                  fontSize: 19,
                  color: colors.textMuted,
                }}
              >
                ¿Aún necesitas ayuda?
                <Button style={{ height: 46, fontSize: 18, width: 210 }}>Obtener más ayuda</Button>
              </div>
            </div>
          )}

          {showModal ? (
            <AbsoluteFill style={{ background: `rgba(0,0,0,${0.45 * Math.min(1, modalIn * 1.5)})` }}>
              <div
                style={{
                  ...cardStyle,
                  position: "absolute",
                  left: M.x,
                  top: M.y,
                  width: M.w,
                  height: M.h,
                  borderRadius: 12,
                  overflow: "visible",
                  opacity: Math.min(1, modalIn * 1.5),
                  transform: `scale(${0.92 + 0.08 * modalIn})`,
                }}
              >
                <div
                  style={{
                    height: M.head,
                    borderBottom: `1px solid ${colors.border}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 23,
                    fontWeight: 700,
                  }}
                >
                  Ayuda para pagos
                  <div
                    style={{
                      position: "absolute",
                      right: 20,
                      top: 16,
                      width: 38,
                      height: 38,
                      borderRadius: "50%",
                      background: "#E4E6EB",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 22,
                      color: colors.textMuted,
                    }}
                  >
                    ×
                  </div>
                </div>

                {sent ? (
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      top: M.head,
                      bottom: 0,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      textAlign: "center",
                      padding: "0 40px",
                    }}
                  >
                    <div style={{ transform: `scale(${sentIn})` }}>
                      <CheckCircleIcon size={120} />
                    </div>
                    <div style={{ fontSize: 32, fontWeight: 800, marginTop: 30, whiteSpace: "nowrap", ...appear(frame, T.sent + 8) }}>
                      Se envió tu mensaje al equipo de ayuda
                    </div>
                    <div
                      style={{
                        fontSize: 20,
                        color: colors.textMuted,
                        marginTop: 16,
                        lineHeight: 1.5,
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        ...appear(frame, T.sent + 14),
                      }}
                    >
                      <MailIcon size={24} color={colors.textMuted} />
                      Recibirás la respuesta por correo y en tu buzón de ayuda.
                    </div>
                    <Button style={{ marginTop: 40, width: 200, height: 48, fontSize: 18, ...appear(frame, T.sent + 20) }}>
                      Listo
                    </Button>
                  </div>
                ) : !step2 ? (
                  <>
                    <div style={{ position: "absolute", left: 40, top: M.head + 30, fontSize: 21, fontWeight: 700 }}>
                      ¿Con qué necesitas ayuda?
                    </div>
                    {TOPICS.slice(0, expanded ? 6 : 3).map((t, i) => (
                      <div
                        key={t}
                        style={{
                          position: "absolute",
                          left: 30,
                          right: 30,
                          top: OPT_Y(i) - M.y - 26,
                          height: 52,
                          borderRadius: radius,
                          display: "flex",
                          alignItems: "center",
                          gap: 16,
                          padding: "0 12px",
                          fontSize: 19,
                          background: i === 5 && frame >= T.none ? colors.blueSoft : "transparent",
                          ...(i >= 3 ? appear(frame, T.showMore + 2 + (i - 3) * 3, 10) : {}),
                        }}
                      >
                        <Radio on={i === 5 && frame >= T.none} />
                        {t}
                      </div>
                    ))}
                    {!expanded ? (
                      <div
                        style={{
                          position: "absolute",
                          left: 42,
                          top: OPT_Y(3) - M.y - 14,
                          fontSize: 19,
                          fontWeight: 600,
                          color: colors.blue,
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        Mostrar más temas <ChevronDown size={20} color={colors.blue} />
                      </div>
                    ) : null}
                    <Footer label="Siguiente" disabled={frame < T.none} />
                  </>
                ) : (
                  <>
                    <Select
                      label="Producto de pagos"
                      y={PRODUCT_SEL.y}
                      open={productOpen}
                      focus={frame >= T.productOpen && frame < T.problemOpen}
                      value={frame >= T.productPick ? PRODUCTS[2] : undefined}
                    />
                    <Select
                      label="Problema"
                      y={PROBLEM_SEL.y}
                      open={problemOpen}
                      focus={frame >= T.problemOpen && frame < T.textarea}
                      value={frame >= T.problemPick ? PROBLEMS[2] : undefined}
                    />
                    <div style={{ position: "absolute", left: 40, top: TEXTAREA.y - M.y - 34, fontSize: 18, fontWeight: 700 }}>
                      Describe tu problema
                    </div>
                    <div
                      style={{
                        position: "absolute",
                        left: 40,
                        right: 40,
                        top: TEXTAREA.y - M.y,
                        height: TEXTAREA.h,
                        border: `${frame >= T.textarea ? 2 : 1}px solid ${frame >= T.textarea ? colors.blue : colors.border}`,
                        borderRadius: radius,
                        padding: "12px 16px",
                        boxSizing: "border-box",
                        fontSize: 17,
                        lineHeight: 1.45,
                        overflow: "hidden",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: n > 0 ? "flex-end" : "flex-start",
                        color: n > 0 ? colors.text : colors.textMuted,
                      }}
                    >
                      <div style={{ whiteSpace: "pre-wrap" }}>
                        {n > 0 ? HELP_MESSAGE.slice(0, n) : "Explica tu problema con el mayor detalle posible."}
                        {frame >= T.textarea && frame < T.send && (frame < T.typeEnd || Math.floor(frame / 15) % 2 === 0) ? (
                          <span style={{ display: "inline-block", width: 2, height: 20, background: colors.text, verticalAlign: "text-bottom", marginLeft: 1 }} />
                        ) : null}
                      </div>
                    </div>
                    <div
                      style={{
                        position: "absolute",
                        right: 40,
                        top: TEXTAREA.y - M.y + TEXTAREA.h + 8,
                        fontSize: 16,
                        fontWeight: 600,
                        fontVariantNumeric: "tabular-nums",
                        color: n > 0 ? colors.blue : colors.textMuted,
                      }}
                    >
                      {n}/2000
                    </div>
                    <Footer
                      label="Enviar"
                      disabled={n < HELP_MESSAGE.length}
                      spinner={frame >= T.send ? <Spinner frame={frame} /> : null}
                    />
                    {productOpen ? (
                      <Menu
                        y={PRODUCT_SEL.y}
                        items={PRODUCTS}
                        hover={frame >= T.productPick - 12 ? 2 : -1}
                        progress={menuP(T.productOpen)}
                      />
                    ) : null}
                    {problemOpen ? (
                      <Menu
                        y={PROBLEM_SEL.y}
                        items={PROBLEMS}
                        hover={frame >= T.problemPick - 12 ? 2 : -1}
                        progress={menuP(T.problemOpen)}
                      />
                    ) : null}
                  </>
                )}
              </div>
            </AbsoluteFill>
          ) : null}
        </PaymentsFrame>
        <Cursor
          frameOffset={LEAD}
          points={[
            { frame: 0, x: 1100, y: 700 },
            { frame: T.helpTab, ...PAYMENTS.tabCenter("ayuda"), click: true },
            { frame: T.moreHelp, ...MORE_HELP_BTN, click: true },
            { frame: T.showMore, x: M.x + 140, y: OPT_Y(3) + 2, click: true },
            { frame: T.none, x: M.x + 200, y: OPT_Y(5), click: true },
            { frame: T.next, ...FOOT_BTN, click: true },
            { frame: T.productOpen, x: M.x + M.w - 200, y: PRODUCT_SEL.y, click: true },
            { frame: T.productPick, x: M.x + 300, y: menuRowY(PRODUCT_SEL.y, 2), click: true },
            { frame: T.problemOpen, x: M.x + M.w - 200, y: PROBLEM_SEL.y, click: true },
            { frame: T.problemPick, x: M.x + 220, y: menuRowY(PROBLEM_SEL.y, 2), click: true },
            { frame: T.textarea, x: M.x + M.w - 160, y: TEXTAREA.y + 150, click: true },
            { frame: T.typeEnd - 20, x: M.x + M.w - 130, y: TEXTAREA.y + 250 },
            { frame: T.send, ...FOOT_BTN, click: true },
            { frame: T.sent + 40, x: M.x + M.w / 2 + 160, y: M.y + M.h - 60 },
          ]}
        />
      </Camera>
    </AbsoluteFill>
  );
};

const Footer: React.FC<{ label: string; disabled?: boolean; spinner?: React.ReactNode }> = ({
  label,
  disabled,
  spinner,
}) => (
  <div
    style={{
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      height: 88,
      borderTop: `1px solid ${colors.border}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "flex-end",
      gap: 12,
      padding: "0 24px",
    }}
  >
    <Button variant="secondary">Cancelar</Button>
    <Button style={{ width: 130, opacity: disabled ? 0.45 : 1 }}>{spinner ?? label}</Button>
  </div>
);
