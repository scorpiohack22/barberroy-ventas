# Re-render video 9 block 1. Photos (PICK in v9b1_scenes.js) load from ../yt10/img; missing ones fall back to drawn scenes.
cd "$(dirname "$0")"
python3 v9b1_build.py
python3 ../batch/mkenv.py ../yt10/vo/b1.wav v9b1_tl.json
rm -f v9b1_silent.mp4
HTML=v9b1.html TLF=v9b1_tl.json node v9b1_render.mjs v9b1_silent.mp4 24 2>&1 | grep -v "Failed to load"
python3 ../yt10/detmix3.py v9b1_silent.mp4 ../yt10/vo/b1.wav ../yt10/det/b1_mix.json ../yt10/det/b1.mp4
rm -f v9b1_silent.mp4
