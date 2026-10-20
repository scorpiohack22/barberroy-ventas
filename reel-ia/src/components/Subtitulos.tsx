import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {SUBTITULOS, type Subtitulo} from '../data/subtitulos';
import {ALTO, COLORES, fontFamily, seg} from '../lib/theme';

export const CENTRO_SUBS = Math.round(ALTO * 0.62); // ~62 % de la altura
const ANCHO_MAX = 900;

const colorDe = (s: Subtitulo) =>
  s.color === 'dorado' ? COLORES.dorado : s.color === 'rojo' ? COLORES.rojo : COLORES.texto;

/** Palabra clave: una palabra por línea si es larga; tamaño 140 px salvo que no quepa. */
const lineasClave = (texto: string) => {
  const t = texto.toUpperCase();
  const lineas = t.length > 9 && t.includes(' ') ? t.split(' ') : [t];
  const masLarga = Math.max(...lineas.map((l) => l.length));
  const tam = Math.min(140, Math.floor(ANCHO_MAX / (masLarga * 0.8)));
  return {lineas, tam};
};

const Grupo: React.FC<{s: Subtitulo; local: number}> = ({s, local}) => {
  const {fps} = useVideoConfig();
  // Pop: escala 0.85 → 1 con spring en 4 frames
  const pop = spring({frame: local, fps, durationInFrames: 4, config: {damping: 14, stiffness: 260}});
  const escalaPop = interpolate(pop, [0, 1], [0.85, 1]);

  if (s.clave) {
    const {lineas, tam} = lineasClave(s.texto);
    const duracion = seg(s.fin) - seg(s.inicio);
    // zoom de impacto: entra grande y se asienta; luego empuje lento
    const impacto = interpolate(local, [0, 5], [1.22, 1], {extrapolateRight: 'clamp'});
    const empuje = interpolate(local, [5, duracion], [1, 1.05], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    const color = colorDe(s);
    return (
      <div
        style={{
          transform: `scale(${escalaPop * impacto * empuje})`,
          background: 'rgba(8,8,8,0.72)',
          border: `2px solid ${color}55`,
          borderRadius: 34,
          padding: '22px 46px 28px',
          maxWidth: 960,
          textAlign: 'center',
        }}
      >
        {lineas.map((l) => (
          <div
            key={l}
            style={{
              fontFamily,
              fontWeight: 900,
              fontSize: tam,
              lineHeight: 1.02,
              letterSpacing: -2,
              color,
              textShadow: `0 0 38px ${color}66, 0 6px 18px rgba(0,0,0,0.6)`,
            }}
          >
            {l}
          </div>
        ))}
      </div>
    );
  }

  const palabras = s.texto.split(' ');
  return (
    <div
      style={{
        transform: `scale(${escalaPop})`,
        background: 'rgba(10,10,10,0.64)',
        borderRadius: 26,
        padding: '16px 34px 20px',
        maxWidth: ANCHO_MAX,
        textAlign: 'center',
        fontFamily,
        fontWeight: 600,
        fontSize: 74,
        lineHeight: 1.12,
        color: colorDe(s),
        textShadow: '0 4px 14px rgba(0,0,0,0.55)',
      }}
    >
      {palabras.map((p, i) => {
        const esIA = p.replace(/[^A-Za-zÁÉÍÓÚáéíóú]/g, '') === 'IA';
        return (
          <span key={i} style={esIA ? {color: COLORES.rojo, fontWeight: 900} : undefined}>
            {p}
            {i < palabras.length - 1 ? ' ' : ''}
          </span>
        );
      })}
    </div>
  );
};

export const Subtitulos: React.FC = () => {
  const frame = useCurrentFrame();
  const activo = SUBTITULOS.find((s) => frame >= seg(s.inicio) && frame < seg(s.fin));
  if (!activo || activo.ocultar) return null;
  const local = frame - seg(activo.inicio);
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div
        style={{
          position: 'absolute',
          top: CENTRO_SUBS,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          transform: 'translateY(-50%)',
        }}
      >
        <Grupo s={activo} local={local} />
      </div>
    </AbsoluteFill>
  );
};
