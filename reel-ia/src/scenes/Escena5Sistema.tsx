import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {CapaBroll} from '../components/Broll';
import {CadenaNodos, type Nodo} from '../components/Nodos';
import {ESCENAS, tramosEntre} from '../data/escenas';
import {finDe, inicioDe} from '../data/subtitulos';
import {aparecer, desaparecer, enEscena, pop} from '../lib/anim';
import {COLORES, fontFamily} from '../lib/theme';

const {inicio, fin} = ESCENAS.nadieTeDice;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** "2 COSAS" a pantalla completa. */
const DosCosas: React.FC<{f: number; a: number; b: number}> = ({f, a, b}) => {
  if (f < a || f >= b) return null;
  const p = pop(f, a, 10);
  const empuje = interpolate(f, [a, b], [1, 1.06], clamp);
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at 50% 50%, #2a0508 0%, #0A0A0A 70%)`,
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily,
        fontWeight: 900,
        textAlign: 'center',
      }}
    >
      <div style={{transform: `scale(${(0.6 + 0.4 * p) * empuje})`}}>
        <div style={{fontSize: 560, lineHeight: 0.9, color: COLORES.rojo, textShadow: `0 0 80px ${COLORES.rojo}88`}}>2</div>
        <div style={{fontSize: 150, letterSpacing: 6, color: COLORES.texto}}>COSAS</div>
      </div>
    </AbsoluteFill>
  );
};

/** Prompt "hazme una foto" tachado (lo que NO hay que hacer). */
const PromptTachado: React.FC<{f: number; a: number; tachar: number; b: number}> = ({f, a, tachar, b}) => {
  if (f < a || f >= b) return null;
  const op = aparecer(f, a, 6) * desaparecer(f, b, 6);
  const texto = '"hazme una foto"';
  const letras = Math.floor(interpolate(f, [a + 4, a + 20], [0, texto.length], clamp));
  const raya = interpolate(f, [tachar, tachar + 6], [0, 1], clamp);
  return (
    <div style={{position: 'absolute', top: 640, left: 110, right: 110, opacity: op, fontFamily}}>
      <div
        style={{
          position: 'relative',
          background: 'rgba(20,20,20,0.9)',
          border: '1px solid rgba(255,255,255,0.18)',
          borderRadius: 60,
          padding: '34px 44px',
          fontWeight: 600,
          fontSize: 50,
          color: '#fff',
        }}
      >
        <span style={{color: 'rgba(255,255,255,0.4)', marginRight: 18}}>›</span>
        {texto.slice(0, letras)}
        <div
          style={{
            position: 'absolute',
            left: 40,
            top: '50%',
            height: 10,
            width: `${raya * 88}%`,
            background: COLORES.rojo,
            borderRadius: 5,
            boxShadow: `0 0 14px ${COLORES.rojo}`,
          }}
        />
      </div>
    </div>
  );
};

/** Documento de brief que se transforma en una cuadrícula de 6 fotos de campaña. */
const BriefACampana: React.FC<{f: number; a: number; morph: number; b: number}> = ({f, a, morph, b}) => {
  if (f < a || f >= b) return null;
  const docIn = pop(f, a, 12);
  const docOut = interpolate(f, [morph, morph + 8], [1, 0], clamp);
  const fotos = Array.from({length: 6});
  return (
    <>
      {docOut > 0 ? (
        <div
          style={{
            position: 'absolute',
            left: 290,
            top: 330,
            width: 500,
            height: 640,
            borderRadius: 18,
            background: '#EDEBE6',
            boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
            transform: `scale(${docIn * (0.6 + 0.4 * docOut)}) rotate(${(1 - docIn) * -6}deg)`,
            opacity: docOut,
            padding: 44,
            fontFamily,
            color: '#111',
          }}
        >
          <div style={{fontWeight: 900, fontSize: 46, letterSpacing: 2}}>BRIEF</div>
          <div style={{fontWeight: 600, fontSize: 24, color: COLORES.rojo, letterSpacing: 4, marginTop: 6}}>
            MARCA · CAMPAÑA OTOÑO
          </div>
          {[92, 80, 86, 60, 88, 72, 50].map((w, i) => (
            <div key={i} style={{height: 16, width: `${w}%`, background: '#C9C6BF', borderRadius: 8, marginTop: i === 0 ? 40 : 22}} />
          ))}
          <div style={{display: 'flex', gap: 14, marginTop: 40}}>
            {['#0A0A0A', COLORES.rojo, COLORES.dorado, '#EDEBE6'].map((c) => (
              <div key={c} style={{width: 56, height: 56, borderRadius: 28, background: c, border: '2px solid #111'}} />
            ))}
          </div>
        </div>
      ) : null}
      {fotos.map((_, i) => {
        const col = i % 3;
        const fila = Math.floor(i / 3);
        const p = pop(f, morph + 3 + i * 3, 11);
        if (p <= 0) return null;
        const acento = i % 3 === 1 ? COLORES.dorado : COLORES.rojo;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 100 + col * 300,
              top: 310 + fila * 380,
              width: 280,
              height: 360,
              borderRadius: 16,
              overflow: 'hidden',
              transform: `scale(${p})`,
              border: '2px solid rgba(255,255,255,0.15)',
              background: `linear-gradient(${150 + i * 35}deg, #1b1b1b 0%, #0d0d0d 60%, ${acento}40 100%)`,
              boxShadow: '0 20px 50px rgba(0,0,0,0.55)',
            }}
          >
            {/* silueta abstracta de prenda / modelo */}
            <div
              style={{
                position: 'absolute',
                left: 80,
                top: 60,
                width: 120,
                height: 120,
                borderRadius: 60,
                background: 'rgba(255,255,255,0.08)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: 50,
                top: 190,
                width: 180,
                height: 200,
                borderRadius: '90px 90px 0 0',
                background: `linear-gradient(180deg, ${acento}55, rgba(255,255,255,0.04))`,
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: 18,
                bottom: 14,
                fontFamily,
                fontWeight: 600,
                fontSize: 22,
                letterSpacing: 3,
                color: 'rgba(255,255,255,0.85)',
              }}
            >
              LOOK 0{i + 1}
            </div>
          </div>
        );
      })}
    </>
  );
};

/** ESCENA 5 — LO QUE NADIE TE DICE [32–43]. */
export const Escena5Sistema: React.FC = () => {
  const f = useCurrentFrame();
  const L = enEscena(inicio);

  const dosA = L(inicioDe('2 COSAS', 32.6));
  const dosB = L(finDe('2 COSAS', 33.5));

  const sisA = L(inicioDe('SISTEMA', 35.7));
  const pasa = L(inicioDe('una le pasa', 36.6));
  const sisB = L(finDe('a la otra', 38.4));
  const etiquetas = ['GUION', 'FOTOS', 'VIDEO', 'VOZ', 'SUBS'];
  // cadena en zigzag
  const nodos: Nodo[] = etiquetas.map((e, i) => ({
    x: 160 + i * 190,
    y: i % 2 === 0 ? 470 : 690,
    etiqueta: e,
    aparece: sisA + i * 4,
  }));
  const pulso = f >= pasa ? Math.min(nodos.length - 1.001, (f - pasa) / 9) : null;
  const sisOp = desaparecer(f, sisB, 6);

  const promptA = L(inicioDe('no le pides', 38.9));
  const tachar = L(inicioDe('hazme una foto', 39.5)) + 8;
  const briefA = L(inicioDe('Le das el brief', 40.2));
  const morph = L(inicioDe('y te entrega', 41.5));

  return (
    <AbsoluteFill>
      <CapaBroll tramos={tramosEntre(inicio, fin)} origen={inicio} />
      {f >= sisA && f < sisB ? (
        <AbsoluteFill style={{opacity: sisOp}}>
          <CadenaNodos frame={f} nodos={nodos} radio={70} pulso={pulso} activo={pulso === null ? -1 : Math.round(pulso)} />
        </AbsoluteFill>
      ) : null}
      <PromptTachado f={f} a={promptA} tachar={tachar} b={briefA} />
      <BriefACampana f={f} a={briefA} morph={morph} b={L(fin)} />
      <DosCosas f={f} a={dosA} b={dosB} />
    </AbsoluteFill>
  );
};
