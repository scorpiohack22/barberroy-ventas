import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {CapaBroll} from '../components/Broll';
import {CENTRO_SUBS} from '../components/Subtitulos';
import {ESCENAS, tramosEntre} from '../data/escenas';
import {finDe, inicioDe} from '../data/subtitulos';
import {aparecer, desaparecer, enEscena, pop} from '../lib/anim';
import {COLORES, fontFamily} from '../lib/theme';

const {inicio, fin} = ESCENAS.objecion;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const Tachada: React.FC<{texto: string; f: number; aparece: number; tacha: number}> = ({texto, f, aparece, tacha}) => {
  const op = aparecer(f, aparece, 5);
  const raya = interpolate(f, [tacha, tacha + 6], [0, 1], clamp);
  return (
    <span
      style={{
        position: 'relative',
        display: 'inline-block',
        opacity: op,
        color: raya > 0.5 ? 'rgba(255,255,255,0.45)' : '#fff',
        transform: `translateY(${(1 - op) * 20}px)`,
      }}
    >
      {texto}
      <span
        style={{
          position: 'absolute',
          left: -8,
          top: '54%',
          height: 10,
          width: `calc(${raya * 100}% + 16px)`,
          background: COLORES.rojo,
          borderRadius: 5,
          boxShadow: `0 0 14px ${COLORES.rojo}`,
          transform: 'rotate(-4deg)',
        }}
      />
    </span>
  );
};

/** ESCENA 6 — OBJECIÓN Y DINERO [43–52]. "NO NECESITAS" + tachado; "SERVICIO" en dorado. */
export const Escena6Objecion: React.FC = () => {
  const f = useCurrentFrame();
  const L = enEscena(inicio);
  const a = L(inicioDe('No necesitas', 43.0));
  const dis = L(inicioDe('saber diseñar', 43.7));
  const edi = L(inicioDe('ni editar', 44.4));
  const b = L(finDe('ni editar', 45.1));
  const p = pop(f, a, 10);

  const srvA = L(inicioDe('SERVICIO', 48.6));
  const srvB = L(finDe('SERVICIO', 49.5));
  const oro = interpolate(f, [srvA, srvA + 3, srvB, srvB + 10], [0, 1, 0.8, 0], clamp);

  return (
    <AbsoluteFill>
      <CapaBroll tramos={tramosEntre(inicio, fin)} origen={inicio} />
      {f < b ? (
        <div
          style={{
            position: 'absolute',
            top: CENTRO_SUBS - 60,
            left: 0,
            right: 0,
            transform: 'translateY(-50%)',
            display: 'flex',
            justifyContent: 'center',
            opacity: desaparecer(f, b, 5),
          }}
        >
          <div
            style={{
              background: 'rgba(8,8,8,0.72)',
              borderRadius: 34,
              padding: '30px 56px 36px',
              textAlign: 'center',
              fontFamily,
              transform: `scale(${0.8 + 0.2 * p})`,
            }}
          >
            <div style={{fontWeight: 900, fontSize: 116, color: COLORES.texto, letterSpacing: -2, lineHeight: 1.05}}>
              NO NECESITAS
            </div>
            <div style={{fontWeight: 600, fontSize: 84, marginTop: 12, display: 'flex', gap: 30, justifyContent: 'center'}}>
              <Tachada texto="diseñar" f={f} aparece={dis} tacha={dis + 8} />
              <span style={{color: 'rgba(255,255,255,0.35)'}}>/</span>
              <Tachada texto="editar" f={f} aparece={edi} tacha={edi + 8} />
            </div>
          </div>
        </div>
      ) : null}
      <AbsoluteFill
        style={{
          opacity: oro,
          background: `radial-gradient(ellipse 75% 32% at 50% 62%, ${COLORES.dorado}50 0%, transparent 70%)`,
        }}
      />
    </AbsoluteFill>
  );
};
