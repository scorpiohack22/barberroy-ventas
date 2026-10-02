import React from "react";
import { AbsoluteFill, Img, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import tl from "./timelineH.json";
import { C, FPS, font, shadow } from "./theme";
import { fadeIn, fadeOut, lerp, prog, sp } from "./anim";
import { Arrow, Check, Pill, Spark, Wordmark, pop, typed } from "./UI";
import { Cursor } from "./Cursor";

/**
 * Interfaz recreada de Higgsfield en horizontal (1920x1080), con cámara de
 * auto-zoom tipo grabación de pantalla. Mismo flujo que la versión vertical.
 */
const S1 = tl.step1;
const S2 = tl.step2;
const S3 = tl.step3;
const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const f = (s: number) => Math.round(s * FPS);

export const PROMPT_IMG =
  "Gato británico gris con sombrero de paja y shorts de flores en un octágono de UFC, frente a un peleador, público grabando con celulares";
export const PROMPT_VID =
  "El peleador patea al gato, sale volando contra la reja, cae, se levanta y saluda a la cámara. Grabado con celular";

// --- Layout (coordenadas internas 1920x1080) ---
const CW = 330;
const CH = 587;
const GRID = [0, 1, 2, 3].map((i) => ({ x: 270 + i * (CW + 20), y: 150 }));
const GRID_IMG = ["img/frame-inicio.jpg", "img/gato-var-1.jpg", "img/gato-var-2.jpg", "img/gato-var-3.jpg"];
const PREVIEW = { x: 960 - 190, y: 130, w: 380, h: 676 };
const STACK = ["img/fr-1.2.jpg", "img/fr-2.4.jpg", "img/fr-3.4.jpg", "img/fr-4.6.jpg", "img/fr-7.6.jpg", "img/fr-9.4.jpg"];
const PANEL = { x: 260, y: 790, w: 1400, h: 250 };
const ROW_Y = 960;
const CHIP_H = 60;

const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const cameraH = (t: number) => {
  const k = tl.camera as number[][];
  let a = k[0];
  let b = k[0];
  for (let i = 0; i < k.length; i++) {
    if (t >= k[i][0]) {
      a = k[i];
      b = k[Math.min(i + 1, k.length - 1)];
    }
  }
  const p = b[0] > a[0] ? ease(Math.min(1, Math.max(0, (t - a[0]) / (b[0] - a[0])))) : 0;
  const s = lerp(p, a[1], b[1]);
  const fx = lerp(p, a[2], b[2]);
  const fy = lerp(p, a[3], b[3]);
  const tx = Math.min(0, Math.max(1920 - 1920 * s, 960 - fx * s));
  const ty = Math.min(0, Math.max(1080 - 1080 * s, 540 - fy * s));
  return { s, tx, ty };
};

const Chip: React.FC<{ x: number; w: number; label: string; active?: boolean; pressed?: boolean; flash?: number }> = ({ x, w, label, active, pressed, flash = 0 }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: ROW_Y,
      width: w,
      height: CHIP_H,
      borderRadius: 18,
      background: active ? "#EEF9C8" : C.soft,
      border: `2px solid ${active ? C.limeDark : "transparent"}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 22,
      fontWeight: 700,
      color: C.text,
      transform: `scale(${pressed ? 0.92 : 1 + 0.06 * flash})`,
    }}
  >
    {label}
  </div>
);

const Popover: React.FC<{ t: number; open: number; pick: number; items: string[]; thumbs: string[] }> = ({ t, open, pick, items, thumbs }) => {
  if (t < open || t > pick + 0.25) return null;
  const p = sp(t, open, 14, 220);
  return (
    <div
      style={{
        position: "absolute",
        left: 290,
        top: 640,
        width: 380,
        padding: 10,
        borderRadius: 24,
        background: "#fff",
        boxShadow: "0 30px 80px rgba(16,24,40,0.18)",
        border: `1px solid ${C.stroke}`,
        opacity: fadeIn(t, open, 0.08) * fadeOut(t, pick + 0.1, 0.15),
        transform: `translateY(${(1 - p) * 30}px) scale(${0.92 + 0.08 * p})`,
        transformOrigin: "15% 100%",
      }}
    >
      {items.map((it, i) => {
        const hover = i === 0 && t > pick - 0.25;
        return (
          <div key={it} style={{ height: 92, borderRadius: 16, display: "flex", alignItems: "center", gap: 16, padding: "0 14px", background: hover ? "#EEF9C8" : "transparent" }}>
            <Img src={staticFile(thumbs[i])} style={{ width: 60, height: 60, borderRadius: 14, objectFit: "cover" }} />
            <div style={{ flex: 1, fontSize: 25, fontWeight: 700 }}>{it}</div>
            {hover && t > pick ? <Check size={28} /> : null}
          </div>
        );
      })}
    </div>
  );
};

const GenerateBtn: React.FC<{ t: number; at: number; busyTo: number }> = ({ t, at, busyTo }) => {
  const pressed = t >= at - 0.03 && t < at + 0.1;
  const busy = t >= at && t < busyTo;
  return (
    <div
      style={{
        position: "absolute",
        left: 1440,
        top: ROW_Y - 8,
        width: 190,
        height: 76,
        borderRadius: 22,
        background: busy ? "#E8F7B0" : C.lime,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        fontSize: 26,
        fontWeight: 800,
        color: C.text,
        transform: `scale(${pressed ? 0.92 : 1})`,
        boxShadow: busy ? "none" : "0 10px 30px rgba(155,196,0,0.35)",
        overflow: "hidden",
      }}
    >
      <Spark size={24} />
      {busy ? "…" : "Generar"}
      {busy ? (
        <div style={{ position: "absolute", top: 0, bottom: 0, width: 100, left: ((t - at) * 500) % 320 - 100, background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.8), rgba(255,255,255,0))" }} />
      ) : null}
    </div>
  );
};

const Panel: React.FC<{ t: number; video: boolean }> = ({ t, video }) => {
  const S = video ? S2 : S1;
  const text = video ? typed(t, S2.typeA, S2.typeB, PROMPT_VID) : typed(t, S1.typeA, S1.typeB, PROMPT_IMG);
  const focused = t > S.prompt && t < S.typeB + 0.4;
  const tx = video ? 420 : 300;
  const slotP = video ? sp(t, S2.slot, 14, 160) : 0;
  return (
    <>
      <div style={{ position: "absolute", left: PANEL.x, top: PANEL.y, width: PANEL.w, height: PANEL.h, borderRadius: 32, background: C.card, boxShadow: shadow, border: `2px solid ${focused ? "#C9EE45" : C.stroke}` }} />
      {video ? (
        <div style={{ position: "absolute", left: 295, top: 815, width: 100, height: 178, borderRadius: 16, overflow: "hidden", background: C.soft, border: `2px dashed ${C.stroke}` }}>
          <Img src={staticFile("img/frame-inicio.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: t > S2.slot ? 1 : 0, transform: `scale(${0.3 + 0.7 * slotP})` }} />
        </div>
      ) : null}
      <div style={{ position: "absolute", left: tx, top: 820, width: 1400 - tx + PANEL.x - 40, height: 120, fontSize: 27, lineHeight: 1.4, fontWeight: 500, color: text ? C.text : C.muted, overflow: "hidden" }}>
        {text || (video ? "Describe el movimiento…" : "Describe tu imagen…")}
        {focused && Math.floor(t * 3) % 2 === 0 ? <span style={{ display: "inline-block", width: 3, height: 30, marginLeft: 3, background: C.text, verticalAlign: "middle" }} /> : null}
      </div>
      {video ? (
        <>
          <Chip x={420} w={200} label={t > S2.option ? "Kling 3.0" : "Modelo"} active={t > S2.option} pressed={Math.abs(t - S2.chip) < 0.06} flash={Math.max(0, 1 - Math.abs(t - S2.option - 0.1) * 6)} />
          <Chip x={635} w={100} label={t > S2.duration ? "10s" : "5s"} active={t > S2.duration} pressed={Math.abs(t - S2.duration) < 0.06} />
          <Chip x={750} w={100} label="9:16" />
          <GenerateBtn t={t} at={S2.generate} busyTo={S2.reveal} />
        </>
      ) : (
        <>
          <Chip x={300} w={200} label={t > S1.option ? "Soul 2.0" : "Modelo"} active={t > S1.option} pressed={Math.abs(t - S1.chip) < 0.06} flash={Math.max(0, 1 - Math.abs(t - S1.option - 0.1) * 6)} />
          <Chip x={515} w={100} label={t > S1.aspect ? "9:16" : "1:1"} active={t > S1.aspect} pressed={Math.abs(t - S1.aspect) < 0.06} />
          <Chip x={630} w={100} label="×4" />
          <GenerateBtn t={t} at={S1.generate} busyTo={S1.reveal} />
        </>
      )}
    </>
  );
};

const TopBar: React.FC<{ video: boolean }> = ({ video }) => (
  <>
    <div style={{ position: "absolute", left: 50, top: 42 }}>
      <Wordmark size={34} />
    </div>
    <div style={{ position: "absolute", right: 50, top: 32, height: 64, padding: 6, borderRadius: 999, background: "#fff", boxShadow: shadow, display: "flex", gap: 4, fontSize: 22, fontWeight: 700 }}>
      {["Imagen", "Video"].map((l, i) => (
        <div key={l} style={{ padding: "0 26px", borderRadius: 999, display: "flex", alignItems: "center", background: (i === 1) === video ? C.text : "transparent", color: (i === 1) === video ? "#fff" : C.muted }}>
          {l}
        </div>
      ))}
    </div>
  </>
);

const ImageGrid: React.FC<{ t: number }> = ({ t }) => (
  <>
    {GRID.map((g, i) => {
      const generating = t >= S1.generate + 0.05 && t < S1.reveal;
      const at = S1.reveal + i * 0.08;
      const p = sp(t, at, 15, 150);
      const shown = t >= at;
      const selected = i === 0 && t > S1.select;
      const selP = sp(t, S1.select, 10, 260);
      const sx = lerp(p, 960 - CW / 2 - g.x, 0);
      const rot = lerp(p, (i - 1.5) * 8, 0);
      return (
        <div key={i} style={{ position: "absolute", left: g.x, top: g.y, width: CW, height: CH, perspective: 1200 }}>
          {!shown ? (
            <div style={{ position: "absolute", inset: 0, borderRadius: 26, background: generating ? "#ECEEF2" : "transparent", border: generating ? "none" : `3px dashed ${C.stroke}`, overflow: "hidden" }}>
              {generating ? (
                <div style={{ position: "absolute", top: -100, bottom: -100, width: 160, left: ((t - S1.generate) * 700 + i * 90) % 600 - 160, transform: "rotate(14deg)", background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.9), rgba(255,255,255,0))" }} />
              ) : null}
            </div>
          ) : (
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 26,
                overflow: "hidden",
                boxShadow: selected ? `0 0 0 ${7 * selP}px ${C.lime}, 0 30px 60px rgba(16,24,40,0.25)` : "0 20px 50px rgba(16,24,40,0.18)",
                transform: `translateX(${sx}px) rotateZ(${rot}deg) rotateY(${(1 - p) * 30}deg) scale(${(0.6 + 0.4 * p) * (selected ? 1 + 0.03 * Math.sin(Math.min(1, selP) * Math.PI) : 1)})`,
                opacity: fadeIn(t, at, 0.06),
              }}
            >
              <Img src={staticFile(GRID_IMG[i])} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 35%", transform: `scale(${1.12 + 0.04 * Math.sin(t + i)})` }} />
              {selected ? (
                <div style={{ position: "absolute", right: 16, top: 16, width: 52, height: 52, borderRadius: "50%", background: C.lime, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${selP})` }}>
                  <Check size={32} />
                </div>
              ) : null}
            </div>
          )}
        </div>
      );
    })}
  </>
);

const VideoPreview: React.FC<{ t: number }> = ({ t }) => {
  const generating = t >= S2.generate + 0.05 && t < S2.reveal;
  const revealed = t >= S2.reveal;
  const pct = Math.round(prog(t, S2.generate + 0.05, S2.reveal, (x) => x) * 100);
  const rp = sp(t, S2.reveal, 12, 170);
  const dlPressed = Math.abs(t - S3.download) < 0.07;
  return (
    <div style={{ position: "absolute", left: PREVIEW.x, top: PREVIEW.y, width: PREVIEW.w, height: PREVIEW.h, perspective: 1400 }}>
      {!revealed ? (
        <div style={{ position: "absolute", inset: 0, borderRadius: 30, background: generating ? "rgba(255,255,255,0.6)" : "transparent", border: generating ? "none" : `3px dashed ${C.stroke}` }}>
          {!generating && t > S2.slot ? (
            <Img src={staticFile("img/frame-inicio.jpg")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", borderRadius: 28, opacity: 0.35 * fadeIn(t, S2.slot + 0.2, 0.3), filter: "blur(5px) grayscale(0.4)" }} />
          ) : null}
          {!generating ? (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 96, height: 96, borderRadius: "50%", background: C.soft, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width={38} height={38} viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill={C.muted} /></svg>
              </div>
            </div>
          ) : (
            <>
              {STACK.map((src, i) => {
                const k = (i - ((t - S2.generate) * 3.2) % STACK.length + STACK.length) % STACK.length;
                return (
                  <div
                    key={src}
                    style={{
                      position: "absolute",
                      left: 40,
                      top: 70,
                      width: PREVIEW.w - 80,
                      height: PREVIEW.h - 150,
                      borderRadius: 22,
                      overflow: "hidden",
                      boxShadow: "0 20px 50px rgba(16,24,40,0.25)",
                      transform: `rotateY(-28deg) rotateX(8deg) translateZ(${-k * 55}px) translateX(${k * 26}px)`,
                      opacity: 1 - k * 0.13,
                      zIndex: 10 - Math.round(k),
                    }}
                  >
                    <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover", filter: `blur(${2 + k}px)` }} />
                  </div>
                );
              })}
              <Pill style={{ left: "50%", bottom: 18, transform: "translateX(-50%)", fontSize: 22, padding: "12px 20px" }} dot={C.limeDark}>
                Generando · {pct}%
              </Pill>
            </>
          )}
        </div>
      ) : (
        <div style={{ position: "absolute", inset: 0, borderRadius: 30, overflow: "hidden", boxShadow: "0 40px 90px rgba(16,24,40,0.28)", transform: `scale(${0.85 + 0.15 * rp})` }}>
          <Sequence from={f(S2.reveal)} layout="none">
            <OffthreadVideo src={staticFile("gato.mp4")} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </Sequence>
          <AbsoluteFill style={{ background: "#fff", opacity: interpolate(t, [S2.reveal, S2.reveal + 0.25], [0.85, 0], cl) }} />
          <div
            style={{
              position: "absolute",
              right: 18,
              top: 18,
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: t > S3.download ? C.lime : "rgba(255,255,255,0.92)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: shadow,
              transform: `scale(${dlPressed ? 0.88 : 1})`,
              opacity: fadeIn(t, S2.reveal + 0.2, 0.15),
            }}
          >
            {t > S3.download ? <Check size={36} /> : <Arrow size={36} color={C.text} dir="down" />}
          </div>
        </div>
      )}
    </div>
  );
};

export const AppH: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const video = t >= S2.from;
  const cam = cameraH(t);
  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily: font, color: C.text, overflow: "hidden" }}>
      <AbsoluteFill style={{ transformOrigin: "0 0", transform: `translate(${cam.tx}px, ${cam.ty}px) scale(${cam.s})` }}>
        <TopBar video={video} />
        {video ? <VideoPreview t={t} /> : <ImageGrid t={t} />}
        <Panel t={t} video={video} />
        {video ? (
          <Popover t={t} open={S2.chip + 0.05} pick={S2.option} items={["Kling 3.0", "Seedance 2.0", "Veo 3.1"]} thumbs={["img/fr-2.4.jpg", "img/fr-7.6.jpg", "img/fr-9.4.jpg"]} />
        ) : (
          <Popover t={t} open={S1.chip + 0.05} pick={S1.option} items={["Soul 2.0", "Nano Banana Pro", "Seedream 4.5"]} thumbs={["img/gato-var-2.jpg", "img/gato-var-1.jpg", "img/gato-var-3.jpg"]} />
        )}
        <Cursor
          size={1.3}
          points={[
            { frame: f(12.7), x: 1300, y: 600 },
            { frame: f(S1.chip), x: 400, y: ROW_Y + 30, click: true },
            { frame: f(S1.option), x: 440, y: 696, click: true },
            { frame: f(S1.prompt), x: 760, y: 860, click: true },
            { frame: f(S1.typeB), x: 1000, y: 930 },
            { frame: f(S1.aspect), x: 565, y: ROW_Y + 30, click: true },
            { frame: f(S1.generate), x: 1535, y: ROW_Y + 30, click: true },
            { frame: f(16.9), x: 1200, y: 700 },
            { frame: f(S1.select), x: 435, y: 440, click: true },
            { frame: f(S2.from - 0.02), x: 450, y: 460 },
            { frame: f(S2.from), x: 1300, y: 600 },
            { frame: f(S2.chip), x: 520, y: ROW_Y + 30, click: true },
            { frame: f(S2.option), x: 440, y: 696, click: true },
            { frame: f(S2.prompt), x: 820, y: 860, click: true },
            { frame: f(S2.typeB), x: 1060, y: 930 },
            { frame: f(S2.duration), x: 685, y: ROW_Y + 30, click: true },
            { frame: f(S2.generate), x: 1535, y: ROW_Y + 30, click: true },
            { frame: f(23.3), x: 1300, y: 600 },
            { frame: f(S3.from), x: 1300, y: 600 },
            { frame: f(S3.download), x: 1096, y: 184, click: true },
            { frame: f(27.8), x: 1200, y: 420 },
          ]}
        />
      </AbsoluteFill>
      {t > S3.toast ? (
        <Pill style={{ left: "50%", top: 900, marginLeft: -200, width: 400, justifyContent: "center", fontSize: 28, ...pop(t, S3.toast) }} dot={C.limeDark}>
          Video descargado
        </Pill>
      ) : null}
    </AbsoluteFill>
  );
};
