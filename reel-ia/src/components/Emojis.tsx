import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {EMOJIS} from '../data/emojis';
import {inicioDe} from '../data/subtitulos';
import {seg} from '../lib/theme';
import {CENTRO_SUBS} from './Subtitulos';

/** Emojis de texto que entran con bounce junto a la palabra que los acompaña. */
export const Emojis: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {EMOJIS.map((e, i) => {
        const inicio = seg(inicioDe(e.junto, -100));
        const fin = inicio + seg(e.duracion);
        if (frame < inicio || frame >= fin) return null;
        const local = frame - inicio;
        const rebote = spring({frame: local, fps, config: {damping: 7, stiffness: 180, mass: 0.6}});
        const salida = interpolate(frame, [fin - 5, fin], [1, 0], {extrapolateLeft: 'clamp'});
        const flota = Math.sin(local / 5) * 8;
        const tam = e.tam ?? 120;
        const x = e.x ?? 880;
        const y = e.y ?? CENTRO_SUBS - 150;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x - tam / 2,
              top: y - tam / 2 + flota + (1 - rebote) * 80,
              fontSize: tam,
              lineHeight: 1,
              opacity: salida,
              transform: `scale(${rebote}) rotate(${(1 - rebote) * -25 + Math.sin(local / 7) * 6}deg)`,
              filter: 'drop-shadow(0 10px 18px rgba(0,0,0,0.6))',
            }}
          >
            {e.emoji}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
