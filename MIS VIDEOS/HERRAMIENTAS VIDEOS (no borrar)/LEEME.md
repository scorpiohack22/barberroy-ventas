# Herramientas para crear los videos (no borrar)
- motor/det_base.html, motor/v6b7.html: motor de animación (canvas) con el personaje Scorpio y lip-sync.
- motor/*_render.mjs / *.sh / v8b1_build.py: arman el HTML del bloque y lo renderizan a video con Playwright + ffmpeg.
- motor/v7_robots.js, v8_lab.js, v9_cam.js, v7b7_paper.js, v7b7_scenes.js: kits compartidos (robots, laboratorio, cámaras, tarjeta final "Escríbeme IA").
- motor/detmix3.py: música épica original + efectos + mezcla final con la voz.
- motor/mkenv.py: curva de lip-sync desde el audio. motor/sync.py: baja las imágenes de Higgsfield. motor/ytsearch.py: investiga resultados de YouTube.
- briefs/: instrucciones que se les dieron a los agentes en cada video (BRIEF_DET2 es la base).
- ejemplo_bloque_v9b1/: un bloque completo de ejemplo (video 9, bloque 1).
- fonts/: tipografías (licencia OFL).
- "PROMPT MAESTRO - crear un video de YouTube.md": el prompt para pegar en una sesión nueva.
