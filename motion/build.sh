#!/usr/bin/env bash
# Construye uno o varios videos finales (video + audio) en motion/out/.
#   bash motion/build.sh 01-el-ciclo 02-desconectados ...
#   bash motion/build.sh all
# Máximo 2 renders a la vez en la máquina (cola con flock) para no agotar memoria/CPU.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p motion/out
ids=("$@")
if [ "${1:-}" = "all" ]; then ids=($(ls motion/scenes/[0-9]*.js | xargs -n1 basename | sed 's/\.js$//')); fi
for id in "${ids[@]}"; do
  tmp="motion/out/.$id"
  # esperar un turno libre (2 ranuras)
  exec 9>/dev/null
  while :; do
    for slot in 1 2; do
      exec 9>"/tmp/motion-render-slot-$slot.lock"
      if flock -n 9; then break 2; fi
    done
    sleep 3
  done
  timeout 1200 node motion/render.js "$id" "$tmp.mp4" > /dev/null
  python3 motion/audio.py "$tmp.events.json" "$tmp.wav" > /dev/null
  ffmpeg -y -loglevel error -i "$tmp.mp4" -i "$tmp.wav" -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart "motion/out/$id.mp4"
  rm -f "$tmp.mp4" "$tmp.wav" "$tmp.events.json"
  exec 9>&-
  echo "✔ motion/out/$id.mp4"
done
