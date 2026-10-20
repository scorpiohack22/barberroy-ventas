import {loadFont} from '@remotion/google-fonts/Montserrat';

export const {fontFamily} = loadFont('normal', {
  weights: ['600', '900'],
  subsets: ['latin', 'latin-ext'],
});

export const FPS = 30;
export const ANCHO = 1080;
export const ALTO = 1920;
export const DURACION_S = 60;

export const COLORES = {
  fondo: '#0A0A0A',
  texto: '#FFFFFF',
  rojo: '#C1121F',
  dorado: '#D4AF37',
  gris: '#8A8A8A',
};

// Zona segura de Instagram / TikTok
export const ZONA_SEGURA = {arriba: 150, abajo: 350, lados: 70};

export const seg = (s: number) => Math.round(s * FPS);
