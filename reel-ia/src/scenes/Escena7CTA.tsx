import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {CapaBroll} from '../components/Broll';
import {ESCENAS, tramosEntre} from '../data/escenas';
import {inicioDe} from '../data/subtitulos';
import {aparecer, enEscena, pop} from '../lib/anim';
import {COLORES, fontFamily} from '../lib/theme';

const {inicio, fin} = ESCENAS.cta;
const CONGELAR = fin - 2; // últimos 2 s fijos para que se pueda leer
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** ESCENA 7 — CTA [52–60]. "IA" gigante + comentario que se escribe + flecha + SCORPIO ACADEMY. */
export const Escena7CTA: React.FC = () => {
  const fReal = useCurrentFrame();
  const L = enEscena(inicio);
  const f = Math.min(fReal, L(CONGELAR)); // congela toda la animación al final

  const logo = L(inicioDe('Scorpio Academy', 53.2));
  const ia = L(inicioDe('IA', 54.8));
  const pIA = pop(f, ia, 9);
  const brillo = f >= ia ? 0.6 + 0.4 * Math.sin((f - ia) / 6) : 0;
  const oscuro = interpolate(f, [ia - 4, ia + 4], [0.38, 0.72], clamp);

  const burbuja = pop(f, ia + 6, 12);
  const letras = f < ia + 14 ? 0 : f < ia + 22 ? 1 : 2;
  const cursor = Math.floor(f / 8) % 2 === 0;
  const flecha = Math.abs(Math.sin((f - ia) / 5)) * 26;
  const logoOp = aparecer(f, logo, 10);

  return (
    <AbsoluteFill>
      <CapaBroll tramos={tramosEntre(inicio, fin)} origen={inicio} oscurecer={oscuro} congelarDesde={CONGELAR} yEtiqueta={1310} />

      {f >= ia ? (
        <>
          {/* IA gigante */}
          <div
            style={{
              position: 'absolute',
              top: 600,
              left: 0,
              right: 0,
              textAlign: 'center',
              transform: `translateY(-50%) scale(${0.5 + 0.5 * pIA})`,
              fontFamily,
              fontWeight: 900,
              fontSize: 470,
              lineHeight: 1,
              letterSpacing: -10,
              color: COLORES.rojo,
              textShadow: `0 0 ${40 + 60 * brillo}px ${COLORES.rojo}${brillo > 0.8 ? 'CC' : '99'}, 0 0 ${
                120 * brillo
              }px ${COLORES.rojo}66`,
            }}
          >
            IA
          </div>

          {/* burbuja de comentario */}
          <div
            style={{
              position: 'absolute',
              top: 860,
              left: 170,
              right: 170,
              transform: `scale(${burbuja})`,
              transformOrigin: '20% 100%',
              display: 'flex',
              alignItems: 'center',
              gap: 22,
              background: 'rgba(245,245,245,0.96)',
              borderRadius: '44px 44px 44px 10px',
              padding: '22px 30px',
              fontFamily,
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                background: `linear-gradient(135deg, ${COLORES.rojo}, #3a0508)`,
                flexShrink: 0,
              }}
            />
            <div style={{fontWeight: 600, fontSize: 28, color: '#666'}}>Comentar:</div>
            <div style={{fontWeight: 900, fontSize: 56, color: '#111', letterSpacing: 2}}>
              {'IA'.slice(0, letras)}
              <span style={{opacity: cursor ? 1 : 0, color: COLORES.rojo, fontWeight: 600}}>|</span>
            </div>
          </div>

          {/* flecha */}
          <div
            style={{
              position: 'absolute',
              top: 1005 + flecha,
              left: 0,
              right: 0,
              textAlign: 'center',
              fontSize: 92,
              opacity: burbuja,
            }}
          >
            👇
          </div>
        </>
      ) : null}

      {/* SCORPIO ACADEMY */}
      <div
        style={{
          position: 'absolute',
          top: 1400,
          left: 0,
          right: 0,
          textAlign: 'center',
          opacity: logoOp,
          transform: `translateY(${(1 - logoOp) * 30}px)`,
          fontFamily,
        }}
      >
        <div style={{width: 120, height: 4, background: COLORES.rojo, margin: '0 auto 22px'}} />
        <div style={{fontWeight: 900, fontSize: 72, letterSpacing: 12, color: COLORES.texto}}>SCORPIO</div>
        <div style={{fontWeight: 600, fontSize: 30, letterSpacing: 22, color: COLORES.dorado, marginTop: 4}}>
          ACADEMY
        </div>
      </div>
    </AbsoluteFill>
  );
};
