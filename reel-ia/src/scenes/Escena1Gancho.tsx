import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {CapaBroll} from '../components/Broll';
import {ESCENAS, tramosEntre} from '../data/escenas';
import {finDe, inicioDe} from '../data/subtitulos';
import {enEscena} from '../lib/anim';
import {COLORES} from '../lib/theme';

const {inicio, fin} = ESCENAS.gancho;

/** ESCENA 1 — GANCHO [0–4]. Sin intro: el texto está en pantalla desde el frame 0. */
export const Escena1Gancho: React.FC = () => {
  const f = useCurrentFrame();
  const L = enEscena(inicio);
  const a = L(inicioDe('GANAR DINERO', 0.4));
  const b = L(finDe('GANAR DINERO', 1.15));
  // resplandor dorado detrás de "GANAR DINERO"
  const brillo = interpolate(f, [a, a + 3, b, b + 8], [0, 1, 0.7, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <AbsoluteFill>
      <CapaBroll tramos={tramosEntre(inicio, fin)} origen={inicio} />
      <AbsoluteFill
        style={{
          opacity: brillo,
          background: `radial-gradient(ellipse 70% 30% at 50% 62%, ${COLORES.dorado}55 0%, transparent 70%)`,
        }}
      />
    </AbsoluteFill>
  );
};
