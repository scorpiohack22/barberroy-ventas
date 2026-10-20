import React from 'react';
import {Composition} from 'remotion';
import {ReelIA} from './ReelIA';
import {ALTO, ANCHO, DURACION_S, FPS} from './lib/theme';

export const RemotionRoot: React.FC = () => (
  <Composition
    id="ReelIA"
    component={ReelIA}
    durationInFrames={DURACION_S * FPS} // 1800 frames = 60 s exactos
    fps={FPS}
    width={ANCHO}
    height={ALTO}
  />
);
