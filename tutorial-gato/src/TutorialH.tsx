import React from "react";
import { AbsoluteFill, Html5Audio, Img, OffthreadVideo, Sequence, getStaticFiles, interpolate, random, staticFile, useCurrentFrame } from "remotion";
import tl from "./timelineH.json";
import { C, FPS, font, shadow } from "./theme";
import { fadeIn, lerp, prog, sp } from "./anim";
import { Arrow, Check, Pill, SoftBg, Spark, Wordmark, enter, pop, typed } from "./UI";
import { AppH } from "./AppH";
import { Cursor } from "./Cursor";

const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const f = (s: number) => Math.round(s * FPS);
const has = (name: string) => getStaticFiles().some((x) => x.name === name);

const Seg: React.FC<{ t: number; from: number; to: number; children: React.ReactNode }> = ({ t, from, to, children }) =>
  t >= from && t < to ? <>{children}</> : null;

/** Video vertical centrado sobre una copia desenfocada de sí mismo. */
const VerticalVideo: React.FC<{ startFrom?: number; muted?: boolean; w?: number; radius?: number; style?: React.CSSProperties }> = ({
  startFrom = 0,
  muted,
  w = 608,
  radius = 0,
  style,
}) => (
  <AbsoluteFill style={{ background: "#000", ...style }}>
    <OffthreadVideo src={staticFile("gato.mp4")} startFrom={startFrom} muted style={{ width: "100%", height: "100%", objectFit: "cover", filter: "blur(40px) brightness(0.55)", transform: "scale(1.15)" }} />
    <div style={{ position: "absolute", left: 960 - w / 2, top: 540 - (w * 16) / 18, width: w, height: (w * 16) / 9, borderRadius: radius, overflow: "hidden" }}>
      <OffthreadVideo src={staticFile("gato.mp4")} startFrom={startFrom} muted={muted} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    </div>
  </AbsoluteFill>
);

const HOOK_TEXT = "Hazme un video viral de un gato en la UFC";

/** Barra de prompt sobre el último fotograma: "¿cómo se hizo?". */
const Hook: React.FC<{ t: number }> = ({ t }) => {
  const H = tl.hook;
  const sent = t >= H.send;
  const fly = prog(t, H.send + 0.05, H.send + 0.35);
  return (
    <AbsoluteFill style={{ ...enter(t, H.from, 0.14), fontFamily: font }}>
      <Img src={staticFile("img/frame-final.jpg")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "blur(30px) brightness(0.6)", transform: "scale(1.2)" }} />
      <div style={{ position: "absolute", left: 960 - 170, top: 110, width: 340, height: 604, borderRadius: 30, overflow: "hidden", boxShadow: "0 40px 90px rgba(0,0,0,0.5)", transform: `scale(${1.04 - 0.04 * sp(t, H.from, 14, 120)})` }}>
        <Img src={staticFile("img/frame-final.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
      <div
        style={{
          position: "absolute",
          left: 960 - 560,
          top: 770,
          width: 1120,
          height: 104,
          borderRadius: 999,
          background: "rgba(255,255,255,0.97)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
          display: "flex",
          alignItems: "center",
          padding: "0 14px 0 40px",
          fontSize: 32,
          fontWeight: 500,
          color: C.text,
          ...pop(t, H.from + 0.12, 40),
          ...(sent ? { transform: `translateY(${-fly * 90}px) scale(${1 - 0.1 * fly})`, opacity: 1 - fly } : {}),
        }}
      >
        <Spark size={30} color={C.limeDark} />
        <div style={{ flex: 1, marginLeft: 16, whiteSpace: "nowrap", overflow: "hidden" }}>
          {typed(t, H.typeA, H.typeB, HOOK_TEXT) || <span style={{ color: C.muted }}>¿Cómo se hizo este video?</span>}
          {!sent && Math.floor(t * 3) % 2 === 0 ? <span style={{ display: "inline-block", width: 3, height: 34, marginLeft: 3, background: C.text, verticalAlign: "middle" }} /> : null}
        </div>
        <div style={{ width: 76, height: 76, borderRadius: "50%", background: C.text, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${Math.abs(t - H.send) < 0.06 ? 0.85 : 1})` }}>
          <Arrow size={36} />
        </div>
      </div>
      <Cursor
        size={1.3}
        points={[
          { frame: f(H.from), x: 1300, y: 1000 },
          { frame: f(H.send), x: 1468, y: 822, click: true },
        ]}
      />
      <AbsoluteFill style={{ background: C.bg, opacity: interpolate(t, [H.to - 0.12, H.to], [0, 1], cl) }} />
    </AbsoluteFill>
  );
};

/** Tarjeta de título con abanico de imágenes. */
const Title: React.FC<{ t: number }> = ({ t }) => {
  const T = tl.title;
  const cards = ["img/gato-var-2.jpg", "img/frame-inicio.jpg", "img/fr-3.4.jpg"];
  return (
    <AbsoluteFill style={{ fontFamily: font }}>
      <SoftBg />
      {cards.map((src, i) => {
        const p = sp(t, T.from + i * 0.06, 14, 150);
        const k = i - 1;
        return (
          <div
            key={src}
            style={{
              position: "absolute",
              left: 960 - 150 + k * 250 * p,
              top: 110 + Math.abs(k) * 40,
              width: 300,
              height: 533,
              borderRadius: 30,
              overflow: "hidden",
              boxShadow: "0 30px 70px rgba(16,24,40,0.22)",
              transform: `rotate(${k * 9 * p}deg) scale(${0.8 + 0.2 * p})`,
              opacity: fadeIn(t, T.from + i * 0.06, 0.08),
              zIndex: i === 1 ? 2 : 1,
            }}
          >
            <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        );
      })}
      <div style={{ position: "absolute", left: 0, right: 0, top: 730, display: "flex", justifyContent: "center", ...pop(t, T.from + 0.1, 30) }}>
        <Wordmark size={78} />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 860, display: "flex", justifyContent: "center" }}>
        <Pill style={{ position: "relative", ...pop(t, T.pill, 30) }}>Soul 2.0 · Kling 3.0</Pill>
      </div>
    </AbsoluteFill>
  );
};

/** Inserto A: la imagen elegida crece al centro. */
const InsertImage: React.FC<{ t: number }> = ({ t }) => {
  const I = tl.insertA;
  const p = sp(t, I.from, 13, 140);
  return (
    <AbsoluteFill style={{ fontFamily: font }}>
      <SoftBg />
      <div
        style={{
          position: "absolute",
          left: 960 - 230,
          top: 70,
          width: 460,
          height: 818,
          borderRadius: 36,
          overflow: "hidden",
          boxShadow: `0 0 0 8px ${C.lime}, 0 40px 100px rgba(16,24,40,0.3)`,
          transform: `scale(${0.6 + 0.4 * p}) rotate(${(1 - p) * -6}deg)`,
        }}
      >
        <Img src={staticFile("img/frame-inicio.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${lerp(prog(t, I.from, I.to, (x) => x), 1.05, 1.15)})` }} />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 930, display: "flex", justifyContent: "center" }}>
        <Pill style={{ position: "relative", ...pop(t, I.from + 0.15, 30) }} dot={C.limeDark}>
          Imagen lista
        </Pill>
      </div>
    </AbsoluteFill>
  );
};

/** Inserto B: el video generado al centro con destellos. */
const InsertVideo: React.FC<{ t: number }> = ({ t }) => {
  const I = tl.insertB;
  const p = sp(t, I.from, 13, 140);
  return (
    <AbsoluteFill style={{ fontFamily: font, background: "#0E1116" }}>
      <Sequence from={f(I.from)} layout="none">
        <VerticalVideo startFrom={Math.round(4.2 * 24)} muted w={480} radius={34} style={{ transform: `scale(${0.75 + 0.25 * p})` }} />
      </Sequence>
      {new Array(18).fill(0).map((_, i) => {
        const a = random(`s${i}`) * Math.PI * 2;
        const d = prog(t, I.from + 0.05, I.from + 0.6) * (300 + random(`d${i}`) * 300);
        return (
          <div key={i} style={{ position: "absolute", left: 960 + Math.cos(a) * d, top: 500 + Math.sin(a) * d, opacity: 1 - prog(t, I.from + 0.3, I.from + 0.7) }}>
            <Spark size={20 + random(`z${i}`) * 26} color={i % 2 ? C.lime : "#fff"} />
          </div>
        );
      })}
      <div style={{ position: "absolute", left: 0, right: 0, top: 960, display: "flex", justifyContent: "center" }}>
        <Pill style={{ position: "relative", ...pop(t, I.from + 0.15, 30) }} dot={C.limeDark}>
          Video listo
        </Pill>
      </div>
    </AbsoluteFill>
  );
};

/** Cierre: resultado + llamado a seguir. */
const End: React.FC<{ t: number }> = ({ t }) => {
  const E = tl.end;
  const following = t >= E.follow;
  return (
    <AbsoluteFill style={{ ...enter(t, E.from, 0.18), fontFamily: font }}>
      <Sequence from={f(E.from)} layout="none">
        <VerticalVideo startFrom={Math.round(6.9 * 24)} muted />
      </Sequence>
      <AbsoluteFill style={{ background: "#fff", opacity: interpolate(t, [E.from, E.from + 0.25], [0.9, 0], cl) }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 900, display: "flex", justifyContent: "center" }}>
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            gap: 18,
            padding: 12,
            borderRadius: 999,
            background: "rgba(255,255,255,0.97)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
            ...pop(t, E.cta, 40),
          }}
        >
          <div style={{ width: 76, height: 76, borderRadius: "50%", background: C.lime, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Spark size={36} />
          </div>
          <div style={{ fontSize: 30, fontWeight: 700, color: C.text, paddingRight: 4 }}>Más tutoriales así</div>
          <div
            style={{
              height: 76,
              padding: "0 32px",
              borderRadius: 999,
              background: following ? C.lime : C.text,
              color: following ? C.text : "#fff",
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 28,
              fontWeight: 800,
              transform: `scale(${Math.abs(t - E.follow) < 0.06 ? 0.9 : 1 + 0.08 * Math.max(0, 1 - Math.abs(t - E.follow - 0.12) * 6)})`,
              boxShadow: shadow,
            }}
          >
            {following ? <Check size={28} /> : null}
            {following ? "Siguiendo" : "Seguir"}
          </div>
        </div>
      </div>
      <Cursor
        size={1.3}
        points={[
          { frame: f(E.cta), x: 1400, y: 1060 },
          { frame: f(E.follow), x: 1180, y: 940, click: true },
        ]}
      />
    </AbsoluteFill>
  );
};

const Step: React.FC<{ t: number; n: number; at: number; label: string }> = ({ t, n, at, label }) => (
  <div style={{ position: "absolute", left: 0, right: 0, top: 26, display: "flex", justifyContent: "center" }}>
    <Pill dark style={{ position: "relative", padding: "10px 24px 10px 10px", fontSize: 24, ...pop(t, at, -24) }}>
      <span style={{ width: 42, height: 42, borderRadius: "50%", background: C.lime, color: C.text, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>{n}</span>
      {label}
    </Pill>
  </div>
);

/**
 * Versión horizontal 16:9. 0 – 10,2 s: el video original (vertical) sin
 * edición, centrado sobre su propio fondo desenfocado y con su audio. Después,
 * el paso a paso en la interfaz recreada y solo efectos (public/sfx-h.wav).
 */
export const TutorialH: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Sequence durationInFrames={f(tl.videoEnd)}>
        <VerticalVideo />
      </Sequence>
      <Seg t={t} from={tl.hook.from} to={tl.hook.to}>
        <Hook t={t} />
      </Seg>
      <Seg t={t} from={tl.title.from} to={tl.title.to}>
        <Title t={t} />
      </Seg>
      <Seg t={t} from={tl.step1.from} to={tl.step3.to}>
        <AbsoluteFill style={enter(t, t < tl.step2.from ? tl.step1.from : t < tl.step3.from ? tl.step2.from : tl.step3.from, 0.14)}>
          <AppH />
        </AbsoluteFill>
        {t < tl.step2.from ? <Step t={t} n={1} at={tl.step1.pill} label="Crea la imagen" /> : t < tl.step3.from ? <Step t={t} n={2} at={tl.step2.pill} label="Dale movimiento" /> : <Step t={t} n={3} at={tl.step3.pill} label="Descárgalo" />}
      </Seg>
      <Seg t={t} from={tl.insertA.from} to={tl.insertA.to}>
        <AbsoluteFill style={enter(t, tl.insertA.from, 0.14)}>
          <InsertImage t={t} />
        </AbsoluteFill>
      </Seg>
      <Seg t={t} from={tl.insertB.from} to={tl.insertB.to}>
        <AbsoluteFill style={enter(t, tl.insertB.from, 0.14)}>
          <InsertVideo t={t} />
        </AbsoluteFill>
      </Seg>
      <Seg t={t} from={tl.end.from} to={tl.end.to + 1}>
        <End t={t} />
      </Seg>
      {has("sfx-h.wav") ? <Html5Audio src={staticFile("sfx-h.wav")} /> : null}
    </AbsoluteFill>
  );
};
