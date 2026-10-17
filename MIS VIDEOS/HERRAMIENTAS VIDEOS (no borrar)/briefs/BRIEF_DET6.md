# Brief: YouTube video #6 "¿Qué pasaría si la IA te quita el trabajo?" — EXPEDIENTE 006, FULL SCREEN, "MAQUETA EN MINIATURA" look
Same approved detective-file format as videos #3/#4/#5. FIRST read $D/batch/BRIEF_DET2.md (all UPDATE sections), $D/batch/BRIEF_DET3.md and $D/batch/BRIEF_DET4.md — everything there applies (full screen LB=0, Ken Burns, evidence board, detective Scorpio lip-sync + visible quiff, case cards, QA rules, SFX limits, no subtitles: only diegetic labels ≤3 words, flattering photos of the user only, epic music via detmix3), EXCEPT the differences below.

D=/tmp/claude-0/-home-user-barberroy-ventas/e018e938-d43e-5f1f-89f6-7c40d86ee153/scratchpad. Y6=$D/yt7  (NOTE: video #6 lives in folder yt7).
Approved reference: video #4 blocks $D/yt4/det/b*.mp4, scene code $D/anime/v4b1..v4b7.html (+ helper js). Copy their engine (LB=0); set photo folder to ../yt7/img/.

## Inputs
- Narration: $Y6/vo/bB.wav, timings $Y6/vo/bB.json (≤0.5 s off → cut on real onsets), script $Y6/vo/blocks.json (block 4 = 41 + 0.8 s + 42 + 0.8 s + 43). Check per second first.
- Photos: $Y6/img/NN_k.png (Soul 2.0 2048x1152), index $Y6/img/index.json, prompts $Y6/prompts.txt.
  Per block: B1 01–05 · B2 06–09 · B3 10–15 · B4 16–33 (case 1 Klarna 16–21, case 2 IBM 22–27, case 3 WEF 28–33) · B5 34–38 · B6 39–44 · B7 45–46. 47–48 = thumbnails, do NOT use.
  IMPORTANT: images have NOT been generated yet — the user's browser assistant will start soon (index refreshed about every 10 min). Build the drawn/detective/board shots first; wait up to ~60 min for photos (B4–B7 photos arrive last), then cover gaps with drawn shots and report.

## SIGNATURE LOOK: "MAQUETA EN MINIATURA" (tilt-shift toy world)
- Most non-user photos are tilt-shift miniature diorama images. Enhance the illusion in animation: extra tilt-shift blur bands top and bottom (blurred copy clipped outside a sharp horizontal band, feathered), slightly boosted saturation/contrast, and occasional "stop-motion" stepped camera moves (Ken Burns updated every 2–3 frames) for a toy feel; smooth moves elsewhere.
- Drawn overlays in a clean toy/infographic style: counters ("700", "7.800", "92.000.000" vs "170.000.000", "40%"), a balance scale tipping, a "PAUSA" button, job icons, robot icons. Keep labels ≤3 words or a number.
- The user's photos (02, 08, 39, 41, 43, 45, 46) stay normal cinematic (no tilt-shift on his face); always flattering.
- Detective Scorpio's office: a small desk robot figurine or a "SE BUSCA" job-board on the wall fits this case.

## Case facts (labels only)
1. Klarna (Sweden, Feb 2024): its OpenAI-based assistant did the work of ~700 customer-service agents, millions of chats, 35+ languages; after complaints it started hiring humans again in 2025; CEO admitted they went too far/too fast. No Klarna logo. Labels "SUECIA", "700 AGENTES", "35 IDIOMAS", "QUEJAS", "SE BUSCAN HUMANOS".
2. IBM (May 2023): CEO said it would pause hiring for back-office roles; ~7,800 roles could be replaced by AI over ~5 years. No IBM logo. Labels "2023", "PAUSA", "7.800 PUESTOS".
3. World Economic Forum Future of Jobs 2025 (survey of 1,000+ employers): by 2030 ~92 million jobs displaced, ~170 million created (net +78M). Labels "2030", "-92 MILLONES", "+170 MILLONES".
B3: IMF (Jan 2024): AI will affect almost 40% of jobs worldwide (affect ≠ eliminate). Label "40%".
B5: repetitive computer work most exposed; humans still better at people, hard decisions, own style; a person using AI does in an hour what another does in a day. B6: 4 tips (learn AI in what you already do; do what AI can't; create content; start today — "todo lo que ves en este video lo hice con IA"). "PROTOCOLO" card. B7: CASO CERRADO; CTA "escríbeme por Instagram, me encuentras como Scorpio Net" → show a clean drawn end card "SCORPIO NET" (Instagram-style handle card, no Instagram logo).

## Audio
$Y6/detmix3.py style "epic", music_db -13, duck_db 4, fade 0.3; B6–B7 add "warm_from": 0. Spec at $Y6/det/bB_mix.json (coordinator re-mixes the whole video). SFX limits unchanged.

## Output
$Y6/det/bB.mp4 (1920x1080, 24 fps, H.264 + AAC 48k), duration = bB.wav (+≤0.3 s); full QA. Delete intermediates. No git, no MCP/Higgsfield, no image generation. One node render at a time, chunks ≤900 frames. Never pgrep/pkill -f with your own pattern; cd first in every Bash call. Name your html $D/anime/v6bB.html.
Final answer: output path, shot list, photos used, miniature-look shots, music spec, QA findings/fixes, anything not fixed.
