#!/usr/bin/env bash
# Genera motion/ciclo_final.mp4: video (canvas) + música y efectos (sintetizados).
set -euo pipefail
cd "$(dirname "$0")/.."
node motion/render.js motion/ciclo.html motion/ciclo.mp4
python3 motion/ciclo_audio.py motion/ciclo.events.json motion/ciclo.wav
ffmpeg -y -loglevel error -i motion/ciclo.mp4 -i motion/ciclo.wav \
  -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart motion/ciclo_final.mp4
rm -f motion/ciclo.mp4 motion/ciclo.wav motion/ciclo.events.json
echo "listo → motion/ciclo_final.mp4"
