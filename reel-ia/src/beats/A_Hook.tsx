import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C, FPS, GRAD, font } from "../theme";
import { N } from "../timing";
import { fadeIn, fadeOut, outExpo, popIn, prog, sp } from "../anim";
import { Ad, Photo } from "../components/Ad";
import { FeedFooter, FeedHeader, Phone } from "../components/Devices";
import { Glass, Kinetic, Pill, Wire, fmt } from "../components/UI";
import { Particles } from "../components/Stage";
import { ICamera, IHeart, IPerson, IPin } from "../components/Icons";

const PW = 560;
const PH = PW * 2.05;
const SW = PW * 0.93; // ancho de pantalla
const SH = PH - PW * 0.07;

const ITEMS = [
  { at: N.modelos, label: "Modelos", value: 48000, Icon: IPerson, img: "img/perfume-modelo.jpg", focus: "50% 30%" },
  { at: N.camaras, label: "Cámaras y equipo", value: 62000, Icon: ICamera, img: "img/set-camaras.jpg", focus: "40% 55%" },
  { at: N.locaciones, label: "Locaciones", value: 75000, Icon: IPin, img: "img/locacion.jpg", focus: "60% 45%" },
];

/** El anuncio cambia de encuadre en cada golpe de la frase (cortes de 1,5–2 s) y nunca se queda quieto. */
const CROPS = [
  { at: 0, z: 1.12, x: 0, y: 0 },
  { at: N.publicidad, z: 1.35, x: 4, y: -3 },
  { at: N.costar, z: 1.18, x: -3, y: 2 },
  { at: N.locaciones + 1.1, z: 1.4, x: 2, y: -6 },
];
const heroCrop = (t: number) => {
  let i = 0;
  while (i + 1 < CROPS.length && t >= CROPS[i + 1].at) i++;
  const c = CROPS[i];
  const k = t - c.at;
  return { z: c.z + 0.035 * k, x: c.x + (i % 2 ? -1 : 1) * 0.9 * k, y: c.y - 0.6 * k };
};

/** Plano corto (0,5–2 s) de cada partida dentro del teléfono, con zoom de entrada. */
const Insert: React.FC<{ t: number; at: number; until: number; img: string; focus: string }> = ({ t, at, until, img, focus }) => {
  if (t < at - 0.05 || t > until + 0.12) return null;
  const p = prog(t, at - 0.05, until + 0.12, (x) => x);
  const op = fadeIn(t, at - 0.05, 0.08) * fadeOut(t, until, 0.12);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: op }}>
      <Photo src={img} focus={focus} frame={{ z: 1.32 - 0.16 * p, x: -2 + 4 * p, y: 1.5 - 3 * p }} />
    </div>
  );
};

/**
 * 0 – 8,1 s. Hook + planteamiento: el anuncio en un teléfono, la pregunta
 * gancho y el presupuesto que "tuvo que costar una fortuna".
 */
export const A_Hook: React.FC = () => {
  const t = useCurrentFrame() / FPS;

  // Cámara sobre el teléfono: macro → plano completo → gira para dejar espacio.
  // Primer frame nítido (macro del producto) y luego se abre con desenfoque de movimiento.
  const pull = prog(t, 0.22, 1.05, outExpo);
  const zoomS = 3.1 - 2.1 * pull + 0.12 * (1 - prog(t, 0, 0.22));
  const pullBlur = Math.sin(prog(t, 0.22, 1.05, (x) => x) * Math.PI) * 9;
  const side = sp(t, N.pense, 18, 110);
  const px = 540 - 215 * side;
  const rotY = 24 * side;
  const fortune = sp(t, N.fortuna, 10, 220);
  const bump = 1 + 0.03 * Math.sin(Math.min(1, fortune) * Math.PI) ;
  const drift = Math.sin(t * 1.3) * 10;
  const push = 1 + prog(t, 6.6, 8.1) * 0.06;

  const likes = interpolate(t, [0.6, 2.2], [0, 24800], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: outExpo });
  const budget = interpolate(t, [N.esto, N.fortuna + 0.35], [0, 185000], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: outExpo });
  const hookOut = N.pense - 0.1;

  // Posición del producto en pantalla (para las líneas de conexión)
  const bottle: [number, number] = [px + 30, 960 + 40];

  return (
    <AbsoluteFill style={{ transform: `scale(${push * bump})` }}>
      <Particles t={t} count={26} seed="hook" spread={700} opacity={0.5} />

      {/* "UNA FORTUNA" detrás del teléfono para dar profundidad */}
      <Kinetic
        t={t}
        at={N.fortuna - 0.12}
        size={128}
        words={[{ w: "UNA" }, { w: "FORTUNA", hl: true }]}
        style={{ left: 0, right: 0, top: 150 }}
      />

      <div
        style={{
          position: "absolute",
          left: px - PW / 2,
          top: 960 - PH / 2 + drift,
          perspective: 1400,
        }}
      >
        <div
          style={{
            transform: `scale(${zoomS}) rotateY(${rotY}deg) rotateZ(${-2 * side}deg)`,
            transformOrigin: "50% 58%",
            filter: pullBlur > 0.3 ? `blur(${pullBlur}px)` : undefined,
          }}
        >
          <Phone w={PW}>
            <Ad w={SW} h={SH} palette={0} textTop={0.12} frame={heroCrop(t)} />
            {ITEMS.map((it, i) => (
              <Insert key={it.label} t={t} at={it.at} until={i < 2 ? ITEMS[i + 1].at - 0.02 : it.at + 1.1} img={it.img} focus={it.focus} />
            ))}
            <FeedHeader w={SW} />
            <FeedFooter w={SW} likes={fmt(likes)} />
          </Phone>
        </div>
      </div>

      {/* --- Hook (0 – 2,4 s) --- */}
      <Kinetic
        t={t}
        at={0}
        stagger={0.06}
        size={96}
        out={hookOut}
        words={[{ w: "¿Cuánto" }, { w: "crees" }, { w: "que" }, { w: "costó", hl: true }, { w: "esto?" }]}
        style={{ left: 60, right: 60, top: 130 }}
      />
      <div style={{ opacity: fadeOut(t, hookOut, 0.2) }}>
        <Pill dot={C.blue} style={{ left: 70, top: 560, ...popIn(t, N.publicidad - 0.05) }}>
          Anuncio patrocinado
        </Pill>
        <Glass style={{ right: 60, top: 1180, padding: "26px 34px", ...popIn(t, 0.55) }}>
          <div style={{ fontSize: 26, color: C.muted, fontWeight: 600 }}>Interacciones</div>
          <div style={{ fontSize: 58, fontWeight: 800, marginTop: 6, display: "flex", alignItems: "center", gap: 12 }}><IHeart size={48} color={C.red} /> {fmt(likes)}</div>
        </Glass>
        <Glass style={{ left: 70, top: 1480, padding: "22px 30px", ...popIn(t, 0.85) }}>
          <div style={{ fontSize: 26, color: C.muted, fontWeight: 600 }}>Reproducciones</div>
          <div style={{ fontSize: 50, fontWeight: 800, marginTop: 6 }}>{fmt(interpolate(t, [0.85, 2.3], [0, 1200000], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: outExpo }))}</div>
        </Glass>
      </div>

      {/* --- Presupuesto (2,7 – 8,1 s) --- */}
      {ITEMS.map((it, i) => {
        const y = 995 + i * 133;
        return <Wire key={it.label} from={[566, y]} to={bottle} p={prog(t, it.at + 0.05, it.at + 0.45, outExpo)} color={C.cyan} />;
      })}
      <Glass
        style={{
          left: 560,
          top: 560,
          width: 470,
          padding: "34px 34px 26px",
          opacity: fadeIn(t, N.pense + 0.2, 0.15),
          transform: `translateX(${(1 - sp(t, N.pense + 0.2, 16, 130)) * 520}px)`,
        }}
      >
        <div style={{ fontSize: 26, color: C.muted, fontWeight: 600 }}>Presupuesto estimado</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 8 }}>
          <div style={{ fontSize: 76, fontWeight: 800, letterSpacing: -2, fontVariantNumeric: "tabular-nums" }}>${fmt(budget)}</div>
          <div style={{ fontSize: 26, color: C.muted, fontWeight: 700 }}>USD</div>
        </div>
        {/* mini gráfica */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 150, marginTop: 22 }}>
          {[0.35, 0.5, 0.42, 0.68, 0.8, 1].map((v, i) => {
            const g = prog(t, N.esto + 0.1 + i * 0.13, N.esto + 0.6 + i * 0.13, outExpo);
            return (
              <div key={i} style={{ flex: 1, height: `${v * g * 100}%`, borderRadius: 8, background: i === 5 ? GRAD : "rgba(255,255,255,0.14)" }} />
            );
          })}
        </div>
        <div style={{ height: 1, background: C.stroke, margin: "24px 0 6px" }} />
        {ITEMS.map((it) => (
          <div key={it.label} style={{ height: 132, display: "flex", alignItems: "center", gap: 18, ...popIn(t, it.at, 40) }}>
            <div style={{ position: "relative", width: 104, height: 104, borderRadius: 22, overflow: "hidden", boxShadow: `0 0 0 2px rgba(61,217,245,${0.6 * fadeOut(t, it.at + 0.3, 0.6)}), 0 10px 30px rgba(0,0,0,0.5)` }}>
              <Photo src={it.img} focus={it.focus} frame={{ z: 1.5 - 0.25 * prog(t, it.at, it.at + 2.2, outExpo), x: 0, y: 6 - 12 * prog(t, it.at, 8.1, (x) => x) }} />
              <div style={{ position: "absolute", right: 6, bottom: 6, width: 30, height: 30, borderRadius: 9, background: "rgba(6,7,10,0.65)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <it.Icon size={18} color={C.cyan} />
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 30, fontWeight: 700 }}>{it.label}</div>
              <div style={{ fontSize: 24, color: C.muted, marginTop: 2 }}>Producción</div>
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>${fmt(it.value)}</div>
          </div>
        ))}
      </Glass>

      {/* Destello del impacto en "fortuna" */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 18%, rgba(61,123,255,0.35), rgba(0,0,0,0) 45%)`,
          opacity: fadeIn(t, N.fortuna, 0.05) * fadeOut(t, N.fortuna + 0.1, 0.5),
          fontFamily: font,
        }}
      />
    </AbsoluteFill>
  );
};
