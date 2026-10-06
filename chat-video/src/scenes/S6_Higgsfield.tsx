import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, FPS, GRAD, font, mono } from "../theme";
import { outExpo, popIn, prog, sp } from "../anim";
import { Kinetic } from "../components/UI";
import { Caret, Window, typed } from "../components/Window";
import { Cursor } from "../components/Cursor";
import { ICheck, IX } from "../components/Icons";

const URL = "https://mcp.higgsfield.ai/mcp";
const CLICK_ADD = 43.0;
const CLICK_SAVE = 45.35;

const Field: React.FC<{ label: string; value: string; t: number; active: boolean; y: number }> = ({ label, value, t, active, y }) => (
  <div style={{ position: "absolute", left: 40, right: 40, top: y }}>
    <div style={{ fontSize: 18, color: C.muted, fontWeight: 600, marginBottom: 8 }}>{label}</div>
    <div style={{ height: 58, borderRadius: 14, border: `2px solid ${active ? C.blue : C.stroke}`, background: "rgba(0,0,0,0.25)", display: "flex", alignItems: "center", padding: "0 18px", fontSize: 22, fontFamily: label === "URL" ? mono : font }}>
      {value}
      {active ? <Caret t={t} h={26} /> : null}
    </div>
  </div>
);

const Check: React.FC<{ t: number; at: number; ok: boolean; title: string; detail: string }> = ({ t, at, ok, title, detail }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 18, padding: "18px 24px", borderRadius: 18, background: "rgba(255,255,255,0.05)", border: `1px solid ${ok ? "rgba(52,211,153,0.35)" : "rgba(255,181,71,0.35)"}`, marginBottom: 14, ...popIn(t, at, 40) }}>
    <div style={{ width: 52, height: 52, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", background: ok ? "rgba(52,211,153,0.16)" : "rgba(255,181,71,0.16)" }}>
      {ok ? <ICheck size={30} color={C.green} /> : <IX size={30} color={C.amber} />}
    </div>
    <div>
      <div style={{ fontSize: 24, fontWeight: 800 }}>{title}</div>
      <div style={{ fontSize: 18, color: C.muted, marginTop: 2 }}>{detail}</div>
    </div>
  </div>
);

/** 42 – 52 s. Conectar Higgsfield, revisar qué se puede hacer y elegir el plan B. */
export const S6_Higgsfield: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const modal = sp(t, CLICK_ADD + 0.05, 16, 170);
  const saved = t > CLICK_SAVE + 0.1;
  const slide = prog(t, 46.2, 46.9, outExpo);

  return (
    <AbsoluteFill style={{ fontFamily: font, color: C.text }}>
      <Kinetic t={t} at={42.05} size={44} words={[{ w: "Video" }, { w: "3", hl: true }, { w: "·" }, { w: "Este" }, { w: "video" }]} align="left" style={{ left: 120, top: 70 }} />

      <Window x={120 + (1 - slide) * 300} y={170} w={900} h={780} title="Ajustes · Conectores" style={popIn(t, 42.1, 80)} bodyStyle={{ padding: 34 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 32, fontWeight: 800 }}>Conectores</div>
          <div style={{ height: 52, padding: "0 22px", borderRadius: 14, background: GRAD, display: "flex", alignItems: "center", fontSize: 20, fontWeight: 800 }}>+ Añadir conector personalizado</div>
        </div>
        {["Shopify", "GitHub", ...(saved ? ["Higgsfield"] : [])].map((n) => {
          const isNew = n === "Higgsfield";
          return (
            <div key={n} style={{ marginTop: 18, height: 76, borderRadius: 16, background: isNew ? "rgba(52,211,153,0.08)" : "rgba(255,255,255,0.04)", border: `1px solid ${isNew ? "rgba(52,211,153,0.4)" : C.stroke}`, display: "flex", alignItems: "center", padding: "0 22px", gap: 16, ...(isNew ? popIn(t, CLICK_SAVE + 0.15, 30) : {}) }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: isNew ? GRAD : "rgba(255,255,255,0.12)" }} />
              <div style={{ flex: 1, fontSize: 24, fontWeight: 700 }}>{n}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: C.green, display: "flex", alignItems: "center", gap: 6 }}>
                <ICheck size={20} color={C.green} /> Conectado
              </div>
            </div>
          );
        })}

        {t > CLICK_ADD && t < CLICK_SAVE + 0.25 ? (
          <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${0.5 * modal})` }}>
            <div style={{ position: "absolute", left: 80, right: 80, top: 120, height: 430, borderRadius: 22, background: "#151926", border: `1px solid ${C.stroke}`, transform: `scale(${0.9 + 0.1 * modal})`, opacity: modal }}>
              <div style={{ padding: "26px 40px", fontSize: 26, fontWeight: 800 }}>Añadir conector personalizado</div>
              <Field label="Nombre" value={typed(t, 43.4, 43.85, "Higgsfield")} t={t} active={t < 43.95} y={90} />
              <Field label="URL" value={typed(t, 44.0, 44.9, URL)} t={t} active={t >= 43.95} y={210} />
              <div style={{ position: "absolute", right: 40, bottom: 30, height: 52, padding: "0 30px", borderRadius: 14, background: GRAD, display: "flex", alignItems: "center", fontSize: 20, fontWeight: 800, transform: `scale(${t > CLICK_SAVE && t < CLICK_SAVE + 0.12 ? 0.93 : 1})` }}>Añadir</div>
            </div>
          </div>
        ) : null}
      </Window>

      {/* Diagnóstico */}
      <div style={{ position: "absolute", left: 1080, top: 190, width: 720, opacity: slide, transform: `translateX(${(1 - slide) * 200}px)` }}>
        <div style={{ fontSize: 22, color: C.muted, fontWeight: 700, letterSpacing: 2, marginBottom: 18 }}>QUÉ SE PUEDE HACER AHORA</div>
        <Check t={t} at={46.9} ok title="Higgsfield conectado" detail="El conector responde en esta sesión" />
        <Check t={t} at={47.7} ok={false} title="Soul 2.0 · 0 créditos" detail="Plan gratis: no hay créditos para generar imágenes" />
        <Check t={t} at={48.5} ok={false} title="After Effects" detail="Requiere Claude Code local con AE instalado" />
        <Check t={t} at={49.5} ok title="Plan B: Remotion" detail="Este video: 60 s · 1920×1080 · hecho en código" />
      </div>

      <Cursor
        size={1.2}
        points={[
          { frame: Math.round(42.2 * FPS), x: 760, y: 560 },
          { frame: Math.round(CLICK_ADD * FPS), x: 1110, y: 276, click: true },
          { frame: Math.round(44.2 * FPS), x: 760, y: 560 },
          { frame: Math.round(CLICK_SAVE * FPS), x: 1130, y: 710, click: true },
          { frame: Math.round(47 * FPS), x: 1000, y: 820 },
        ]}
      />
    </AbsoluteFill>
  );
};
