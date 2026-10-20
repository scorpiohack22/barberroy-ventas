import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {ESCENAS} from '../data/escenas';
import {inicioDe} from '../data/subtitulos';
import {COLORES, seg} from '../lib/theme';

/** Barra de progreso roja fina arriba: 0 → 100 % en los 60 s. */
export const BarraProgreso: React.FC = () => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const p = interpolate(frame, [0, durationInFrames - 1], [0, 100]);
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div style={{position: 'absolute', top: 0, left: 0, right: 0, height: 10, background: 'rgba(255,255,255,0.12)'}} />
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          height: 10,
          width: `${p}%`,
          background: COLORES.rojo,
          boxShadow: `0 0 14px ${COLORES.rojo}`,
        }}
      />
    </AbsoluteFill>
  );
};

/** Momentos con flash blanco de 2 frames: cada cambio de bloque + "2 COSAS". */
export const momentosFlash = (): number[] => [
  ...Object.values(ESCENAS)
    .map((e) => e.inicio)
    .filter((s) => s > 0),
  inicioDe('2 COSAS', 32.6),
];

export const Flash: React.FC = () => {
  const frame = useCurrentFrame();
  const activo = momentosFlash().find((s) => frame >= seg(s) && frame < seg(s) + 2);
  if (activo === undefined) return null;
  const opacidad = frame === seg(activo) ? 0.95 : 0.55;
  return <AbsoluteFill style={{backgroundColor: '#FFFFFF', opacity: opacidad}} />;
};

/** Temblor de pantalla de 6 frames en "ERROR". Devuelve el desplazamiento en px. */
export const useTemblor = () => {
  const frame = useCurrentFrame();
  const inicio = seg(inicioDe('ERROR', 6.5));
  const local = frame - inicio;
  if (local < 0 || local >= 6) return {x: 0, y: 0, r: 0};
  const fuerza = 26 * (1 - local / 6);
  const pat = [
    [1, -0.6],
    [-0.9, 0.8],
    [0.7, 0.9],
    [-1, -0.5],
    [0.6, -1],
    [-0.4, 0.5],
  ][local];
  return {x: pat[0] * fuerza, y: pat[1] * fuerza, r: pat[0] * 0.6};
};
