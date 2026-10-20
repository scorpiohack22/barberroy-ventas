import {Config} from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);
Config.setCodec('h264');
Config.setAudioCodec('aac');
Config.setCrf(18);
Config.setPixelFormat('yuv420p');
Config.setOverwriteOutput(true);
// Siempre incluye una pista AAC, aunque todavía no haya voz/música (vídeo en silencio).
Config.setEnforceAudioTrack(true);

// Opcional: usar un Chrome/Chromium ya instalado en vez de descargar uno.
if (process.env.REMOTION_BROWSER) {
  Config.setBrowserExecutable(process.env.REMOTION_BROWSER);
}
