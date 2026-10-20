import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {CapaBroll} from '../components/Broll';
import {CadenaNodos, type Nodo} from '../components/Nodos';
import {ESCENAS, tramosEntre} from '../data/escenas';
import {inicioDe} from '../data/subtitulos';
import {aparecer, enEscena, pop} from '../lib/anim';
import {COLORES, fontFamily} from '../lib/theme';

const {inicio, fin} = ESCENAS.prueba;

const PIEZAS = [
  {etiqueta: 'GUION', junto: 'Una IA estudia', def: 14.0},
  {etiqueta: 'FOTOS', junto: 'Otra me hace', def: 18.6},
  {etiqueta: 'VIDEO', junto: 'Otra convierte', def: 21.6},
  {etiqueta: 'VOZ', junto: 'Otra pone', def: 23.8},
  {etiqueta: 'SUBS', junto: 'Otra los', def: 25.2},
];

/** ESCENA 4 — PRUEBA [14–32]. Un clip por frase + contador de "piezas del equipo". */
export const Escena4Prueba: React.FC = () => {
  const f = useCurrentFrame();
  const L = enEscena(inicio);
  const Y = 360;
  const nodos: Nodo[] = PIEZAS.map((p, i) => ({
    x: 150 + i * 195,
    y: Y,
    etiqueta: p.etiqueta,
    aparece: Math.max(3, L(inicioDe(p.junto, p.def))),
  }));
  const cuantas = nodos.filter((n) => f >= n.aparece).length;
  const ultima = nodos[cuantas - 1]?.aparece ?? 0;
  const tick = pop(f, ultima, 8);
  const final = L(inicioDe('Así le hago', 26.6));
  // en la parte final todo el equipo "trabaja": el pulso recorre la cadena en bucle
  const pulso = f >= final ? ((f - final) / 14) % (nodos.length - 1) : null;
  const panel = aparecer(f, 0, 6);

  return (
    <AbsoluteFill>
      <CapaBroll tramos={tramosEntre(inicio, fin)} origen={inicio} />
      <div
        style={{
          position: 'absolute',
          left: 50,
          right: 50,
          top: 170,
          height: 330,
          borderRadius: 32,
          background: 'rgba(8,8,8,0.7)',
          border: '1px solid rgba(255,255,255,0.12)',
          opacity: panel,
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 196,
          left: 90,
          right: 90,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          fontFamily,
          opacity: panel,
        }}
      >
        <span style={{fontWeight: 600, fontSize: 30, letterSpacing: 5, color: 'rgba(255,255,255,0.8)'}}>
          PIEZAS DEL EQUIPO
        </span>
        <span style={{fontWeight: 900, fontSize: 64, color: COLORES.rojo}}>
          <span style={{display: 'inline-block', transform: `scale(${0.6 + 0.4 * tick})`}}>{cuantas}</span>
          <span style={{color: 'rgba(255,255,255,0.45)', fontSize: 40}}> / 5</span>
        </span>
      </div>
      <CadenaNodos frame={f} nodos={nodos} activo={f >= final ? -1 : cuantas - 1} pulso={pulso} />
    </AbsoluteFill>
  );
};
