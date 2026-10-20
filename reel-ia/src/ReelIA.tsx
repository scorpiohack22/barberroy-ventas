import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {MezclaAudio, Sfx} from './components/Audio';
import {BarraProgreso, Flash, useTemblor} from './components/Efectos';
import {Emojis} from './components/Emojis';
import {Subtitulos} from './components/Subtitulos';
import {ESCENAS} from './data/escenas';
import {COLORES, seg} from './lib/theme';
import {Escena1Gancho} from './scenes/Escena1Gancho';
import {Escena2Tendencia} from './scenes/Escena2Tendencia';
import {Escena3Autoridad} from './scenes/Escena3Autoridad';
import {Escena4Prueba} from './scenes/Escena4Prueba';
import {Escena5Sistema} from './scenes/Escena5Sistema';
import {Escena6Objecion} from './scenes/Escena6Objecion';
import {Escena7CTA} from './scenes/Escena7CTA';

const BLOQUES: {id: keyof typeof ESCENAS; nombre: string; C: React.FC}[] = [
  {id: 'gancho', nombre: '1 · Gancho', C: Escena1Gancho},
  {id: 'tendencia', nombre: '2 · Tendencia y contraste', C: Escena2Tendencia},
  {id: 'autoridad', nombre: '3 · Autoridad', C: Escena3Autoridad},
  {id: 'prueba', nombre: '4 · Prueba', C: Escena4Prueba},
  {id: 'nadieTeDice', nombre: '5 · Lo que nadie te dice', C: Escena5Sistema},
  {id: 'objecion', nombre: '6 · Objeción y dinero', C: Escena6Objecion},
  {id: 'cta', nombre: '7 · CTA', C: Escena7CTA},
];

export const ReelIA: React.FC = () => {
  const t = useTemblor();
  return (
    <AbsoluteFill style={{backgroundColor: COLORES.fondo}}>
      <AbsoluteFill style={{transform: `translate(${t.x}px, ${t.y}px) rotate(${t.r}deg) scale(${t.x ? 1.04 : 1})`}}>
        {BLOQUES.map(({id, nombre, C}) => (
          <Sequence
            key={id}
            name={nombre}
            from={seg(ESCENAS[id].inicio)}
            durationInFrames={seg(ESCENAS[id].fin) - seg(ESCENAS[id].inicio)}
          >
            <C />
          </Sequence>
        ))}
        <Subtitulos />
        <Emojis />
      </AbsoluteFill>
      <BarraProgreso />
      <Flash />
      <MezclaAudio />
      <Sfx />
    </AbsoluteFill>
  );
};
