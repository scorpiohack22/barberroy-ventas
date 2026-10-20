import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {CapaBroll} from '../components/Broll';
import {CENTRO_SUBS} from '../components/Subtitulos';
import {ESCENAS, tramosEntre} from '../data/escenas';
import {inicioDe} from '../data/subtitulos';
import {enEscena, pop} from '../lib/anim';
import {COLORES, fontFamily} from '../lib/theme';

const {inicio, fin} = ESCENAS.autoridad;

/** ESCENA 3 — AUTORIDAD [11–14]. Zoom-in rápido + "TE MUESTRO EL MÍO 👇". */
export const Escena3Autoridad: React.FC = () => {
  const f = useCurrentFrame();
  const L = enEscena(inicio);
  const t = L(inicioDe('Te muestro', 12.3));
  const zoom = interpolate(f, [t, t + 8], [1, 1.35], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const p = pop(f, t, 10);
  const flecha = f >= t ? Math.abs(Math.sin((f - t) / 4)) * 22 : 0;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{transform: `scale(${zoom})`}}>
        {/* etiqueta más arriba: el zoom de 1.35 la empujaría fuera de la zona segura */}
        <CapaBroll tramos={tramosEntre(inicio, fin)} origen={inicio} yEtiqueta={1360} />
      </AbsoluteFill>
      {f >= t ? (
        <div
          style={{
            position: 'absolute',
            top: CENTRO_SUBS - 40,
            left: 0,
            right: 0,
            transform: `translateY(-50%) scale(${0.7 + 0.3 * p})`,
            opacity: Math.min(1, p * 1.5),
            textAlign: 'center',
            fontFamily,
            fontWeight: 900,
            color: COLORES.texto,
            letterSpacing: -2,
          }}
        >
          <div style={{display: 'inline-block', background: 'rgba(8,8,8,0.72)', borderRadius: 34, padding: '26px 50px'}}>
            <div style={{fontSize: 112, lineHeight: 1.02}}>TE MUESTRO</div>
            <div style={{fontSize: 112, lineHeight: 1.02, color: COLORES.rojo}}>
              EL MÍO <span style={{display: 'inline-block', transform: `translateY(${flecha}px)`}}>👇</span>
            </div>
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
