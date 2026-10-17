# Re-render video 8 block 1. Photos (PICK in v8b1_scenes.js) load from ../yt9/img; missing ones fall back to drawn scenes.
cd "$(dirname "$0")"
SHARED=1 python3 v8b1_build.py
python3 ../batch/mkenv.py ../yt9/vo/b1.wav v8b1_tl.json
rm -f v8b1_c*.mp4 v8b1_cat.txt
for r in "0 210" "210 417"; do set -- $r
  F0=$1 F1=$2 HTML=v8b1.html TLF=v8b1_tl.json node v8b1_render.mjs v8b1_c$1.mp4 24 2>&1 | grep -v "Failed to load"
  echo "file 'v8b1_c$1.mp4'" >> v8b1_cat.txt; done
ffmpeg -v error -y -f concat -safe 0 -i v8b1_cat.txt -c copy v8b1_silent.mp4
python3 ../yt9/detmix3.py v8b1_silent.mp4 ../yt9/vo/b1.wav ../yt9/det/b1_mix.json ../yt9/det/b1.mp4
rm -f v8b1_c*.mp4 v8b1_cat.txt v8b1_silent.mp4
