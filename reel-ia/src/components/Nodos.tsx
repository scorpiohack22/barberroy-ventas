import React from 'react';
import {interpolate} from 'remotion';
import {pop} from '../lib/anim';
import {COLORES, fontFamily} from '../lib/theme';

export type Nodo = {x: number; y: number; etiqueta: string; aparece: number};

/**
 * Cadena de nodos 🤖 conectados por líneas que se dibujan (diagrama de flujo).
 * `pulso` (0..n-1, decimal) dibuja un punto que viaja de un nodo al siguiente.
 */
export const CadenaNodos: React.FC<{
  frame: number;
  nodos: Nodo[];
  radio?: number;
  activo?: number;
  pulso?: number | null;
  colorLinea?: string;
}> = ({frame, nodos, radio = 62, activo = -1, pulso = null, colorLinea = COLORES.rojo}) => {
  const puntoPulso = (() => {
    if (pulso === null) return null;
    const i = Math.min(nodos.length - 2, Math.floor(pulso));
    const t = pulso - i;
    const a = nodos[i];
    const b = nodos[i + 1];
    return {x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t};
  })();
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      {nodos.slice(1).map((n, i) => {
        const a = nodos[i];
        const dib = interpolate(frame, [n.aparece - 2, n.aparece + 7], [1, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        return (
          <line
            key={'l' + i}
            x1={a.x}
            y1={a.y}
            x2={n.x}
            y2={n.y}
            stroke={colorLinea}
            strokeWidth={6}
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={dib}
            opacity={0.9}
          />
        );
      })}
      {puntoPulso ? (
        <circle cx={puntoPulso.x} cy={puntoPulso.y} r={14} fill={COLORES.dorado} style={{filter: `drop-shadow(0 0 12px ${COLORES.dorado})`}} />
      ) : null}
      {nodos.map((n, i) => {
        const p = pop(frame, n.aparece, 9);
        if (p <= 0) return null;
        const esActivo = i === activo;
        return (
          <g key={'n' + i} transform={`translate(${n.x} ${n.y}) scale(${p})`}>
            <circle
              r={radio}
              fill="#111"
              stroke={esActivo ? COLORES.rojo : 'rgba(255,255,255,0.85)'}
              strokeWidth={esActivo ? 7 : 4}
              style={esActivo ? {filter: `drop-shadow(0 0 16px ${COLORES.rojo})`} : undefined}
            />
            <text y={radio * 0.3} textAnchor="middle" fontSize={radio * 0.95}>
              🤖
            </text>
            <text
              y={radio + 40}
              textAnchor="middle"
              fontFamily={fontFamily}
              fontWeight={600}
              fontSize={28}
              letterSpacing={2}
              fill="#fff"
            >
              {n.etiqueta}
            </text>
          </g>
        );
      })}
    </svg>
  );
};
