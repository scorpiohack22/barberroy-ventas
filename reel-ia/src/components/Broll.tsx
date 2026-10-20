import React from 'react';
import {AbsoluteFill, Freeze, Img, OffthreadVideo, Sequence, interpolate, useCurrentFrame} from 'remotion';
import {resolverBroll} from '../lib/assets';
import {COLORES, FPS, fontFamily, seg} from '../lib/theme';
import type {Tramo} from '../data/escenas';

const PLANO_MAX = Math.round(1.8 * FPS); // cambio visual cada ≤ 1,8 s

// Variantes de encuadre: zoom-in lento 1.0→1.08 con distintos orígenes y paneos.
const encuadre = (variante: number, p: number) => {
  switch (variante % 4) {
    case 0:
      return {scale: interpolate(p, [0, 1], [1, 1.08]), x: 0, y: 0, origin: '50% 50%'};
    case 1:
      return {scale: interpolate(p, [0, 1], [1.06, 1.14]), x: interpolate(p, [0, 1], [-30, 30]), y: 0, origin: '30% 40%'};
    case 2:
      return {scale: interpolate(p, [0, 1], [1.1, 1.18]), x: interpolate(p, [0, 1], [35, -35]), y: 0, origin: '70% 50%'};
    default:
      return {scale: interpolate(p, [0, 1], [1.02, 1.1]), x: 0, y: interpolate(p, [0, 1], [20, -20]), origin: '50% 65%'};
  }
};

const Placeholder: React.FC<{variante: number}> = ({variante}) => {
  const f = useCurrentFrame();
  const acento = variante % 3 === 2 ? COLORES.dorado : COLORES.rojo;
  const ang = 120 + variante * 47;
  const gx = 30 + 40 * Math.sin(f / 45 + variante);
  const gy = 35 + 25 * Math.cos(f / 60 + variante * 2);
  const barrido = ((f * 6 + variante * 300) % 2600) - 700;
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at ${gx}% ${gy}%, ${acento}38 0%, transparent 45%),
          linear-gradient(${ang}deg, #141414 0%, #0A0A0A 55%, #1a0d0e 100%)`,
      }}
    >
      {/* rejilla fina */}
      <AbsoluteFill
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)',
          backgroundSize: '90px 90px',
        }}
      />
      {/* barrido de luz */}
      <div
        style={{
          position: 'absolute',
          top: -400,
          left: barrido,
          width: 260,
          height: 2800,
          transform: 'rotate(18deg)',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)',
        }}
      />
    </AbsoluteFill>
  );
};

const Plano: React.FC<{tramo: Tramo; variante: number; offset: number; duracion: number}> = ({
  tramo,
  variante,
  offset,
  duracion,
}) => {
  const f = useCurrentFrame();
  const media = resolverBroll(tramo.nombre);
  const e = encuadre(variante, f / Math.max(1, duracion - 1));
  const estilo: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    filter: 'saturate(0.85) contrast(1.06)',
  };
  return (
    <AbsoluteFill style={{transform: `translate(${e.x}px, ${e.y}px) scale(${e.scale})`, transformOrigin: e.origin}}>
      {media.tipo === 'video' ? (
        <OffthreadVideo src={media.src} muted startFrom={offset} style={estilo} />
      ) : media.tipo === 'imagen' ? (
        <Img src={media.src} style={estilo} />
      ) : (
        <Placeholder variante={variante} />
      )}
    </AbsoluteFill>
  );
};

/** Un clip de B-roll partido en planos de ≤1,8 s (corte seco + reencuadre en cada plano). */
const EtiquetaPlaceholder: React.FC<{nombre: string; y: number}> = ({nombre, y}) => (
  <div
    style={{
      position: 'absolute',
      top: y,
      width: '100%',
      textAlign: 'center',
      fontFamily,
      fontWeight: 600,
      fontSize: 22,
      letterSpacing: 4,
      color: 'rgba(255,255,255,0.3)',
    }}
  >
    broll/{nombre}.mp4 · .png · .jpg
  </div>
);

const TramoBroll: React.FC<{tramo: Tramo; semilla: number; yEtiqueta: number}> = ({tramo, semilla, yEtiqueta}) => {
  const total = seg(tramo.fin) - seg(tramo.inicio);
  const n = Math.max(1, Math.ceil(total / PLANO_MAX));
  const largo = Math.ceil(total / n);
  return (
    <>
      {Array.from({length: n}).map((_, i) => {
        const desde = i * largo;
        const dur = Math.min(largo, total - desde);
        return (
          <Sequence key={i} from={desde} durationInFrames={dur} layout="none">
            <Plano tramo={tramo} variante={semilla + i} offset={desde} duracion={dur} />
          </Sequence>
        );
      })}
      {resolverBroll(tramo.nombre).tipo === 'placeholder' ? <EtiquetaPlaceholder nombre={tramo.nombre} y={yEtiqueta} /> : null}
    </>
  );
};

/**
 * Pinta los tramos de B-roll. `origen` = segundo global donde empieza la escena contenedora.
 * `congelarDesde` (segundo global) congela la imagen (p. ej. últimos 2 s del CTA).
 */
export const CapaBroll: React.FC<{
  tramos: Tramo[];
  origen: number;
  oscurecer?: number;
  congelarDesde?: number;
  yEtiqueta?: number; // altura del nombre de archivo en los placeholders
}> = ({tramos, origen, oscurecer = 0.38, congelarDesde, yEtiqueta = 1500}) => {
  const f = useCurrentFrame();
  const contenido = (
    <AbsoluteFill style={{backgroundColor: COLORES.fondo, overflow: 'hidden'}}>
      {tramos.map((t, i) => (
        <Sequence
          key={t.nombre + t.inicio}
          from={seg(t.inicio) - seg(origen)}
          durationInFrames={seg(t.fin) - seg(t.inicio)}
          name={`broll ${t.nombre}`}
        >
          <TramoBroll tramo={t} semilla={i * 2 + Math.round(t.inicio)} yEtiqueta={yEtiqueta} />
        </Sequence>
      ))}
      {/* contraste para el texto + viñeta fría */}
      <AbsoluteFill style={{backgroundColor: `rgba(10,10,10,${oscurecer})`}} />
      <AbsoluteFill
        style={{background: 'radial-gradient(ellipse at 50% 45%, transparent 40%, rgba(0,0,0,0.75) 100%)'}}
      />
    </AbsoluteFill>
  );
  if (congelarDesde === undefined) return contenido;
  const fc = seg(congelarDesde) - seg(origen);
  return (
    <Freeze frame={fc} active={f >= fc}>
      {contenido}
    </Freeze>
  );
};
