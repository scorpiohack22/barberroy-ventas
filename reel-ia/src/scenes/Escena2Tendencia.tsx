import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {CapaBroll} from '../components/Broll';
import {ESCENAS, tramosEntre} from '../data/escenas';
import {finDe, inicioDe} from '../data/subtitulos';
import {enEscena} from '../lib/anim';
import {COLORES, fontFamily} from '../lib/theme';

const {inicio, fin} = ESCENAS.tendencia;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** Burbuja de chat genérica (la "IA como chat de preguntas"). */
const ChatMock: React.FC<{opacidad: number}> = ({opacidad}) => (
  <div
    style={{
      position: 'absolute',
      left: 140,
      top: 430,
      width: 800,
      opacity: opacidad,
      fontFamily,
      fontWeight: 600,
    }}
  >
    <div
      style={{
        marginLeft: 'auto',
        width: 520,
        background: 'rgba(255,255,255,0.12)',
        border: '1px solid rgba(255,255,255,0.18)',
        borderRadius: '30px 30px 6px 30px',
        padding: '24px 30px',
        fontSize: 36,
        color: '#fff',
      }}
    >
      ¿Me das ideas para un post?
    </div>
    <div
      style={{
        marginTop: 24,
        width: 560,
        background: 'rgba(20,20,20,0.85)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '30px 30px 30px 6px',
        padding: '24px 30px',
        fontSize: 32,
        color: 'rgba(255,255,255,0.75)',
      }}
    >
      ¡Claro! Aquí tienes 10 ideas…
    </div>
  </div>
);

/** ESCENA 2 — TENDENCIA Y CONTRASTE [4–11]. En "ERROR": tinte rojo + X que tacha el chat. */
export const Escena2Tendencia: React.FC = () => {
  const f = useCurrentFrame();
  const L = enEscena(inicio);
  const chatIn = L(inicioDe('hacerle preguntas', 5.5)) - 12;
  const err = L(inicioDe('ERROR', 6.5));
  const errFin = L(finDe('ERROR', 7.3));
  const salida = L(inicioDe('facturando', 7.9));

  const chatOp = interpolate(f, [chatIn, chatIn + 8, salida, salida + 6], [0, 1, 1, 0], clamp);
  const tinte = interpolate(f, [err, err + 2, errFin, errFin + 8], [0, 0.5, 0.35, 0], clamp);
  const trazo1 = interpolate(f, [err, err + 4], [1, 0], clamp);
  const trazo2 = interpolate(f, [err + 3, err + 7], [1, 0], clamp);
  const xOp = interpolate(f, [salida, salida + 6], [1, 0], clamp);

  return (
    <AbsoluteFill>
      <CapaBroll tramos={tramosEntre(inicio, fin)} origen={inicio} />
      <ChatMock opacidad={chatOp} />
      <AbsoluteFill style={{backgroundColor: COLORES.rojo, opacity: tinte, mixBlendMode: 'multiply'}} />
      <AbsoluteFill style={{backgroundColor: COLORES.rojo, opacity: tinte * 0.35}} />
      {f >= err ? (
        <svg width={1080} height={1920} style={{position: 'absolute', opacity: xOp}}>
          {[
            {d: 'M 230 380 L 850 860', t: trazo1},
            {d: 'M 850 380 L 230 860', t: trazo2},
          ].map((l) => (
            <path
              key={l.d}
              d={l.d}
              stroke={COLORES.rojo}
              strokeWidth={34}
              strokeLinecap="round"
              fill="none"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={l.t}
              style={{filter: `drop-shadow(0 0 18px ${COLORES.rojo})`}}
            />
          ))}
        </svg>
      ) : null}
    </AbsoluteFill>
  );
};
