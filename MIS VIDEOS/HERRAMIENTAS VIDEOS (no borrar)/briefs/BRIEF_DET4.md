# Brief: YouTube video #4 "¿Qué pasaría si la IA supiera cuándo vas a morir?" — EXPEDIENTE 004, FULL SCREEN, "RADIOGRAFÍA" look
Same approved detective-file format as videos #2/#3. FIRST read $D/batch/BRIEF_DET2.md (all UPDATE sections) and $D/batch/BRIEF_DET3.md — everything there applies (full screen LB=0, Ken Burns, board, detective Scorpio with lip-sync + visible quiff, case cards, QA rules, SFX limits, no subtitles: only diegetic labels ≤3 words, flattering photos of the user only), EXCEPT the differences below.

D=/tmp/claude-0/-home-user-barberroy-ventas/e018e938-d43e-5f1f-89f6-7c40d86ee153/scratchpad. Y4=$D/yt4.
Approved full-screen reference blocks: $D/yt3/det/b1..b7.mp4 (scene code: $D/anime/d3b1.html, v3b2.html, v3b3.html, v3b4.html, d3b5.html, y3b6.html, v3b7.html) and $D/yt2/det/*. Copy det_base.html (LB=0) as in those blocks; photo folder ../yt4/img/.

## Inputs
- Narration: $Y4/vo/bB.wav, word timings $Y4/vo/bB.json (can be off ≤0.5 s → cut on real onsets), script $Y4/vo/blocks.json (keys "1","2","3","41","42","43","5","6","7"; block 4 = 41+0.8 s+42+0.8 s+43). Check bB.wav per second first.
- Photos: $Y4/img/NN_k.png (Soul 2.0, 2048x1152), index $Y4/img/index.json, prompts $Y4/prompts.txt.
  Per block: B1 01–05 · B2 06–09 · B3 10–15 · B4 16–33 (case 1 Denmark "calculadora de la muerte" 16–21, case 2 eyes/retina 22–27, case 3 ECG 28–33) · B5 34–38 · B6 39–44 · B7 45–46. 47–48 = thumbnails, do NOT use.
  Images are still being generated (index refreshed by the coordinator about every 10 min; ~01–24 already exist). Do detective/board/drawn shots first, wait up to ~30 min for missing NN, then cover gaps with drawn/board shots and report.

## NEW SIGNATURE LOOK: "RADIOGRAFÍA / ESCANEO" (the user wants an uncommon, high-impact image format)
Include $Y4/xray.js in your html (`<script src="../yt4/xray.js"></script>` after the engine) — read its header. Helpers: XR.bake(img,'xray'|'thermal'|'night'), XR.scan (scan-line wipe normal→xray), XR.hud (medical/surveillance HUD corners + timecode), XR.reticle (targeting circle + readout), XR.counter (big glowing digits), XR.ekg (scrolling heartbeat / flatline). Reference still: $Y4/xr_test.jpg.
- Roughly 40–50% of photo shots get a treatment: an animated XR.scan that sweeps the photo into the blue X-ray version (the "AI is scanning you" beat), thermal or night-vision grades, HUD overlays, reticles locking on a face/eye/heart, EKG lines, a red countdown counter.
- Keep it readable and premium (After-Effects feel): smooth eased scans (~1–1.6 s), subtle glow, no clutter, one idea per shot. Mix with normal noir photo shots, board and detective shots so it doesn't get monotonous.
- User photos (con=true): the scan/thermal treatments are OK (they look good), but the face must stay recognizable and flattering; never invert faces.
- Labels/readouts ≤3 words or a number, e.g. "ANALIZANDO", "RIESGO", "87%", "6.000.000", "4 AÑOS", "FALSO", "1.800.000 ECG", "NORMAL", "¿QUÉ VE?". HUD numbers are dramatization, but never present a fake statistic as a fact from the studies.
- Detective Scorpio's office can have an X-ray lightbox on the wall (glowing panel with a film) for this case.

## Case facts (labels only)
1. Denmark, life2vec (DTU / Nature Computational Science, Dec 2023): data of ~6 million Danes (health, education, work, income); predicted who would die within 4 years better than other models / insurance methods. Fake "death calculator" websites appeared asking for personal data; researchers said the model is not public. Do NOT show "78%". Labels: "DINAMARCA", "6.000.000", "4 AÑOS", "PÁGINA FALSA".
2. Google/Verily 2018: AI looking only at retinal fundus photos estimated age (~3 years error), smoking status and cardiovascular risk. No Google logo. Labels: "SOLO EL OJO", "EDAD", "FUMADOR", "RIESGO".
3. Geisinger (US) 2019: AI analysed ~1.77 million ECGs and predicted 1-year mortality, even among ECGs doctors read as normal; cardiologists couldn't see the pattern; researchers don't know exactly what it detects. Labels: "1.800.000 ECG", "NORMAL", "¿QUÉ VE?".
B5: insurance raises the price / bank denies the loan / company doesn't hire — labels "SEGURO", "BANCO", "RECHAZADO". B6 tips: don't upload medical exams to unknown apps; review health apps/smartwatch permissions; read terms about sharing data; "a prediction is not a destiny — probabilities, habits change the result" → warm hopeful visuals, "PROTOCOLO" card. B7: "CASO CERRADO", question to comments, share with a friend.

## Audio — EPIC DOCUMENTARY music (user request: music a bit louder, epic documentary)
- Mixer: $Y4/detmix3.py (same CLI/spec as detmix2 + new style "epic": taiko, string ostinato, low brass, choir, horn theme; 100% original procedural).
  Spec: {"style":"epic","music_db":-13,"duck_db":4,"fade":0.3, risers, drops, hits, sfx, rain}; for B6 and B7 add "warm_from": 0 (hopeful major).
  Use risers/drops/hits on case cards and reveals as before. SFX limits unchanged (few, soft, ≥1 s apart, ≤1 per 4–6 s, 12 dB under voice). Rain optional.
- Keep your spec at $Y4/det/bB_mix.json — the coordinator will re-mix the whole video as one continuous score from your specs, so put every SFX/riser/drop/hit there.
- Mixer CLI: python3 $Y4/detmix3.py silent.mp4 $Y4/vo/bB.wav $Y4/det/bB_mix.json $Y4/det/bB.mp4

## Output
$Y4/det/bB.mp4 (1920x1080, 24 fps, H.264 + AAC 48k), duration = bB.wav (+≤0.3 s). Full QA (2 fps contact sheet of the whole block + frames around every cut + per-second audio RMS). Delete intermediates. No git, no MCP/Higgsfield, no image generation. One node render at a time, chunks ≤900 frames. Never pgrep/pkill -f with your own pattern; cd first in every Bash call.
Final answer: output path, shot list with times, photos used, which shots use the X-ray/thermal treatments, music spec, QA findings/fixes, anything not fixed.
