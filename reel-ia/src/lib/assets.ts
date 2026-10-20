import {staticFile} from 'remotion';
import {getStaticFiles} from '@remotion/studio';

// Lista de archivos que existen en /public (Remotion la inyecta en el Studio y al renderizar).
const existentes = (): Set<string> => {
  try {
    return new Set(getStaticFiles().map((f) => f.name.replace(/\\/g, '/')));
  } catch {
    return new Set();
  }
};

export const existe = (ruta: string) => existentes().has(ruta);

export type Broll =
  | {tipo: 'video' | 'imagen'; src: string; nombre: string}
  | {tipo: 'placeholder'; nombre: string};

const EXT_VIDEO = ['mp4', 'mov', 'webm'];
const EXT_IMAGEN = ['png', 'jpg', 'jpeg', 'webp'];

/** Busca public/broll/<nombre>.(mp4|png|jpg…). Si no existe, devuelve un placeholder. */
export const resolverBroll = (nombre: string): Broll => {
  const archivos = existentes();
  for (const ext of EXT_VIDEO) {
    const ruta = `broll/${nombre}.${ext}`;
    if (archivos.has(ruta)) return {tipo: 'video', src: staticFile(ruta), nombre};
  }
  for (const ext of EXT_IMAGEN) {
    const ruta = `broll/${nombre}.${ext}`;
    if (archivos.has(ruta)) return {tipo: 'imagen', src: staticFile(ruta), nombre};
  }
  return {tipo: 'placeholder', nombre};
};

/** Devuelve la URL del archivo si existe en /public, o null. */
export const archivoOpcional = (ruta: string): string | null =>
  existe(ruta) ? staticFile(ruta) : null;
