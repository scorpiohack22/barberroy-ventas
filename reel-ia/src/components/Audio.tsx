import React from 'react';
import {Audio, Sequence, interpolate} from 'remotion';
import {SUBTITULOS} from '../data/subtitulos';
import {TRAMOS_BROLL} from '../data/escenas';
import {archivoOpcional} from '../lib/assets';
import {seg} from '../lib/theme';

const VOL_MUSICA = 0.12;
const VOL_DUCK = 0.06;
const RAMPA = 6; // frames de transición del ducking

// Intervalos (frames) en los que hay voz, fusionando pausas cortas (< 0,35 s).
const intervalosVoz = (() => {
  const r: [number, number][] = [];
  for (const s of SUBTITULOS) {
    const a = seg(s.inicio);
    const b = seg(s.fin);
    const ultimo = r[r.length - 1];
    if (ultimo && a - ultimo[1] < seg(0.35)) ultimo[1] = Math.max(ultimo[1], b);
    else r.push([a, b]);
  }
  return r;
})();

const volumenMusica = (f: number, hayVoz: boolean) => {
  if (!hayVoz) return VOL_MUSICA;
  let dist = Infinity; // distancia en frames al intervalo de voz más cercano
  for (const [a, b] of intervalosVoz) {
    if (f >= a && f <= b) return VOL_DUCK;
    dist = Math.min(dist, f < a ? a - f : f - b);
  }
  return interpolate(dist, [0, RAMPA], [VOL_DUCK, VOL_MUSICA], {extrapolateRight: 'clamp'});
};

/** Voz + música de fondo (12 %, ducking al 6 % cuando hay voz). Si no existen, silencio. */
export const MezclaAudio: React.FC = () => {
  const voz = archivoOpcional('voz.mp3');
  const musica = archivoOpcional('musica.mp3');
  return (
    <>
      {voz ? <Audio src={voz} volume={1} /> : null}
      {musica ? <Audio src={musica} loop volume={(f) => volumenMusica(f, Boolean(voz))} /> : null}
    </>
  );
};

const SfxEn: React.FC<{src: string | null; segundo: number; volumen: number; nombre: string}> = ({
  src,
  segundo,
  volumen,
  nombre,
}) =>
  src ? (
    <Sequence from={seg(segundo)} durationInFrames={seg(2)} name={nombre} layout="none">
      <Audio src={src} volume={volumen} />
    </Sequence>
  ) : null;

/** Efectos opcionales de /public/sfx: pop en palabras clave, cash en dinero, whoosh en cortes. */
export const Sfx: React.FC = () => {
  const pop = archivoOpcional('sfx/pop.mp3');
  const cash = archivoOpcional('sfx/cash.mp3');
  const whoosh = archivoOpcional('sfx/whoosh.mp3');
  const claves = SUBTITULOS.filter((s) => s.clave);
  const dinero = claves.filter((s) => s.color === 'dorado');
  const cortes = TRAMOS_BROLL.map((t) => t.inicio).filter((s) => s > 0);
  return (
    <>
      {claves.map((s) => (
        <SfxEn key={'pop' + s.inicio} src={pop} segundo={s.inicio} volumen={0.55} nombre={`pop ${s.texto}`} />
      ))}
      {dinero.map((s) => (
        <SfxEn key={'cash' + s.inicio} src={cash} segundo={s.inicio} volumen={0.6} nombre={`cash ${s.texto}`} />
      ))}
      {cortes.map((s) => (
        <SfxEn key={'wh' + s} src={whoosh} segundo={Math.max(0, s - 0.15)} volumen={0.45} nombre="whoosh" />
      ))}
    </>
  );
};
