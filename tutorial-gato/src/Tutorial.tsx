import React from "react";
import { AbsoluteFill, Html5Audio, Img, OffthreadVideo, Sequence, getStaticFiles, interpolate, staticFile, useCurrentFrame } from "remotion";
import tl from "./timeline.json";
import { C, FPS, font, shadow } from "./theme";
import { fadeIn, lerp, prog, sp } from "./anim";
import { Arrow, Check, Photo, Pill, SoftBg, Wordmark, enter, pop, typed } from "./UI";
import { App } from "./App";
import { Cursor } from "./Cursor";

const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const f = (s: number) => Math.round(s * FPS);
const has = (name: string) => getStaticFiles().some((x) => x.name === name);

/** Muestra a los hijos solo dentro de [from, to). */
const Seg: React.FC<{ t: number; from: number; to: number; children: React.ReactNode }> = ({ t, from, to, children }) =>
  t >= from && t < to ? <>{children}</> : null;

const HOOK_TEXT = "Hazme un video viral de un gato en la UFC";

/** 10,2 – 11,7 s: tú en tu escritorio + barra de prompt (como la referencia). */
const Hook: React.FC<{ t: number }> = ({ t }) => {
  const H = tl.hook;
  const sent = t >= H.send;
  const fly = prog(t, H.send + 0.05, H.send + 0.35);
  return (
    <AbsoluteFill style={enter(t, H.from, 0.14)}>
      <Photo src="img/scorpio-laptop.jpg" focus="50% 22%" z={lerp(prog(t, H.from, H.to, (x) => x), 1.34, 1.48)} x={0} y={0} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(0,0,0,0.35) 100%)" }} />
      <div
        style={{
          position: "absolute",
          left: 60,
          right: 60,
          top: 1560,
          height: 128,
          borderRadius: 999,
          background: "rgba(255,255,255,0.96)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          display: "flex",
          alignItems: "center",
          padding: "0 18px 0 46px",
          fontFamily: font,
          fontSize: 34,
          fontWeight: 500,
          color: C.text,
          ...pop(t, H.from + 0.12, 50),
          ...(sent ? { transform: `translateY(${-fly * 120}px) scale(${1 - 0.1 * fly})`, opacity: 1 - fly } : {}),
        }}
      >
        <div style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden" }}>
          {typed(t, H.typeA, H.typeB, HOOK_TEXT) || <span style={{ color: C.muted }}>Pregunta lo que sea…</span>}
          {!sent && Math.floor(t * 3) % 2 === 0 ? <span style={{ display: "inline-block", width: 3, height: 38, marginLeft: 3, background: C.text, verticalAlign: "middle" }} /> : null}
        </div>
        <div style={{ width: 92, height: 92, borderRadius: "50%", background: C.text, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${Math.abs(t - H.send) < 0.06 ? 0.85 : 1})` }}>
          <Arrow size={42} />
        </div>
      </div>
      <Cursor
        size={1.5}
        points={[
          { frame: f(H.from), x: 760, y: 1840 },
          { frame: f(H.send), x: 935, y: 1625, click: true },
        ]}
      />
      {/* Blanco que abre la parte del tutorial */}
      <AbsoluteFill style={{ background: C.bg, opacity: interpolate(t, [H.to - 0.12, H.to], [0, 1], cl) }} />
    </AbsoluteFill>
  );
};

/** 11,7 – 12,7 s: tarjeta de título (estilo "OpenAI dots × Higgsfield"). */
const Title: React.FC<{ t: number }> = ({ t }) => {
  const T = tl.title;
  const card = sp(t, T.from, 14, 150);
  return (
    <AbsoluteFill style={{ fontFamily: font }}>
      <SoftBg />
      <div
        style={{
          position: "absolute",
          left: 540 - 230,
          top: 470,
          width: 460,
          height: 640,
          borderRadius: 48,
          overflow: "hidden",
          boxShadow: "0 40px 90px rgba(16,24,40,0.22)",
          transform: `translateY(${(1 - card) * 200}px) rotate(${-5 + 2 * card}deg) scale(${0.85 + 0.15 * card})`,
          opacity: fadeIn(t, T.from, 0.1),
        }}
      >
        <Photo src="img/scorpio-muestra.jpg" focus="40% 30%" z={lerp(prog(t, T.from, T.to, (x) => x), 1.25, 1.35)} />
      </div>
      <div
        style={{
          position: "absolute",
          left: 690,
          top: 820,
          width: 240,
          height: 420,
          borderRadius: 36,
          overflow: "hidden",
          boxShadow: "0 30px 70px rgba(16,24,40,0.25)",
          transform: `translateX(${(1 - sp(t, T.from + 0.12, 14, 150)) * 320}px) rotate(8deg)`,
          opacity: fadeIn(t, T.from + 0.12, 0.1),
        }}
      >
        <Img src={staticFile("img/frame-inicio.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1210, display: "flex", justifyContent: "center", ...pop(t, T.from + 0.08, 40) }}>
        <Wordmark size={84} />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1360, display: "flex", justifyContent: "center" }}>
        <Pill style={{ position: "relative", ...pop(t, T.pill, 30) }}>Soul 2.0 · Kling 3.0</Pill>
      </div>
    </AbsoluteFill>
  );
};

/** Inserto corto con tu foto y una píldora. */
const Insert: React.FC<{ t: number; from: number; to: number; src: string; focus: string; label: string }> = ({ t, from, to, src, focus, label }) => (
  <AbsoluteFill style={enter(t, from, 0.14)}>
    <Photo src={src} focus={focus} z={lerp(prog(t, from, to, (x) => x), 1.12, 1.26)} x={lerp(prog(t, from, to, (x) => x), 1.5, -1.5)} />
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0) 60%, rgba(0,0,0,0.3) 100%)" }} />
    <div style={{ position: "absolute", left: 0, right: 0, top: 1600, display: "flex", justifyContent: "center" }}>
      <Pill style={{ position: "relative", ...pop(t, from + 0.15, 40) }} dot={C.limeDark}>
        {label}
      </Pill>
    </div>
  </AbsoluteFill>
);

/** Píldora del paso actual, fija arriba. */
const Step: React.FC<{ t: number; n: number; at: number; label: string }> = ({ t, n, at, label }) => (
  <div style={{ position: "absolute", left: 0, right: 0, top: 34, display: "flex", justifyContent: "center" }}>
    <Pill dark style={{ position: "relative", padding: "14px 30px 14px 14px", fontSize: 30, ...pop(t, at, -30) }}>
      <span style={{ width: 52, height: 52, borderRadius: "50%", background: C.lime, color: C.text, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>{n}</span>
      {label}
    </Pill>
  </div>
);

/** 28,2 – 30,6 s: resultado a pantalla completa y cierre contigo. */
const End: React.FC<{ t: number }> = ({ t }) => {
  const E = tl.end;
  const following = t >= E.follow;
  return (
    <AbsoluteFill>
      {t < E.photo ? (
        <AbsoluteFill style={enter(t, E.from, 0.18)}>
          <Sequence from={f(E.from)} layout="none">
            <OffthreadVideo src={staticFile("gato.mp4")} startFrom={Math.round(6.9 * 24)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </Sequence>
          <AbsoluteFill style={{ background: "#fff", opacity: interpolate(t, [E.from, E.from + 0.25], [0.9, 0], cl) }} />
        </AbsoluteFill>
      ) : (
        <AbsoluteFill style={enter(t, E.photo, 0.14)}>
          <Photo src="img/scorpio-senala.jpg" focus="62% 28%" z={lerp(prog(t, E.photo, E.to, (x) => x), 1.02, 1.1)} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 1580, display: "flex", justifyContent: "center" }}>
            <div
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                gap: 22,
                padding: "16px 16px 16px 16px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.96)",
                boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
                fontFamily: font,
                ...pop(t, E.cta, 50),
              }}
            >
              <Img src={staticFile("img/scorpio-celular.jpg")} style={{ width: 96, height: 96, borderRadius: "50%", objectFit: "cover", objectPosition: "50% 28%" }} />
              <div style={{ fontSize: 34, fontWeight: 700, color: C.text, paddingRight: 6 }}>Más tutoriales así</div>
              <div
                style={{
                  height: 96,
                  padding: "0 38px",
                  borderRadius: 999,
                  background: following ? C.lime : C.text,
                  color: following ? C.text : "#fff",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  fontSize: 32,
                  fontWeight: 800,
                  transform: `scale(${Math.abs(t - E.follow) < 0.06 ? 0.9 : 1 + 0.08 * Math.max(0, 1 - Math.abs(t - E.follow - 0.12) * 6)})`,
                  boxShadow: shadow,
                }}
              >
                {following ? <Check size={34} /> : null}
                {following ? "Siguiendo" : "Seguir"}
              </div>
            </div>
          </div>
          <Cursor
            size={1.5}
            points={[
              { frame: f(E.photo), x: 900, y: 1860 },
              { frame: f(E.follow), x: 840, y: 1650, click: true },
            ]}
          />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

/**
 * Reel 9:16. 0 – 10,2 s: el video original sin ninguna edición (con su audio).
 * Después, el paso a paso en Higgsfield como grabación de pantalla, con
 * insertos tuyos (Soul 2.0) y solo efectos de sonido (public/sfx.wav).
 */
export const Tutorial: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      {/* Video original, intacto */}
      <Sequence durationInFrames={f(tl.videoEnd)}>
        <OffthreadVideo src={staticFile("gato.mp4")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </Sequence>

      <Seg t={t} from={tl.hook.from} to={tl.hook.to}>
        <Hook t={t} />
      </Seg>
      <Seg t={t} from={tl.title.from} to={tl.title.to}>
        <Title t={t} />
      </Seg>
      <Seg t={t} from={tl.step1.from} to={tl.step3.to}>
        <AbsoluteFill style={enter(t, t < tl.step2.from ? tl.step1.from : t < tl.step3.from ? tl.step2.from : tl.step3.from, 0.14)}>
          <App />
        </AbsoluteFill>
        {t < tl.step2.from ? <Step t={t} n={1} at={tl.step1.pill} label="Crea la imagen" /> : t < tl.step3.from ? <Step t={t} n={2} at={tl.step2.pill} label="Dale movimiento" /> : <Step t={t} n={3} at={tl.step3.pill} label="Descárgalo" />}
      </Seg>
      <Seg t={t} from={tl.insertA.from} to={tl.insertA.to}>
        <Insert t={t} from={tl.insertA.from} to={tl.insertA.to} src="img/scorpio-celular.jpg" focus="50% 30%" label="Imagen lista" />
      </Seg>
      <Seg t={t} from={tl.insertB.from} to={tl.insertB.to}>
        <Insert t={t} from={tl.insertB.from} to={tl.insertB.to} src="img/scorpio-celebra.jpg" focus="45% 30%" label="Video listo" />
      </Seg>
      <Seg t={t} from={tl.end.from} to={tl.end.to + 1}>
        <End t={t} />
      </Seg>

      {has("sfx.wav") ? <Html5Audio src={staticFile("sfx.wav")} /> : null}
    </AbsoluteFill>
  );
};
