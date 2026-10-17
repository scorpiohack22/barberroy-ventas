# Brief: YouTube video #3 "¿Qué pasaría si tu celular te escucha todo el día?" — NOIR DETECTIVE FILE (EXPEDIENTE 003), FULL SCREEN
Use the SAME approved format as video #2. Read $D/batch/BRIEF_DET2.md fully first, including all of its UPDATE sections. Everything there applies, with the differences below.

D=/tmp/claude-0/-home-user-barberroy-ventas/e018e938-d43e-5f1f-89f6-7c40d86ee153/scratchpad. Y3=$D/yt3.

## Differences from video #2
- **Full screen from the start:** `const LB = 0` (no letterbox). The approved full-screen look is in the video #2 blocks: $D/yt2/det/b1..b7.mp4. Their scene code is in $D/anime/d2b1.html, det2b.html, v2d3.html, v2det4.html, v2b5.html, d2b6.html and v2b7.html. Reuse helpers and ideas from them freely.
- **Photo folder:** in your copy, set the photo folder to ../yt3/img/.
- **Narration:**
  - $Y3/vo/bB.wav, with word timings in $Y3/vo/bB.json and the script in $Y3/vo/blocks.json.
  - The json timings can be off by up to 0.5 s. Cut on the real voice onsets.
  - Check bB.wav per second before you start.
- **Photos:** $Y3/img/NN_k.png, Soul 2.0 at 2048x1152. The index is $Y3/img/index.json; the prompts are in $Y3/prompts.txt.
  - Per block: B1 01–06 · B2 07–10 · B3 11–18 · B4 19–37 (case 1 "active listening" = 19–24, case 2 Siri = 25–30, case 3 ultrasonic = 31–37) · B5 38–45 · B6 46–52 · B7 53–56.
  - 57–59 are thumbnails; do not use them.
  - Images are still being generated, and the coordinator refreshes the index about every 10 minutes. Do the drawn, detective and board shots first, and wait up to about 30 minutes for missing photos. After that, cover any gap with drawn shots and report it.
- **Case facts** (labels only, ≤3 words):
  1. **Case 1:** a 2024 leaked pitch deck from a US marketing firm (Cox Media Group) selling "Active Listening" ads from device microphones. Google dropped the firm as a partner, Amazon said it never worked with it, and the firm removed the service from its site. It was never proven to work.
     - Do NOT show company logos. A generic "PRESENTACIÓN FILTRADA" or "ESCUCHA ACTIVA" label is fine.
  2. **Case 2:** Siri was activated by accident; contractors heard recordings (2019 report); Apple agreed to a $95M settlement in January 2025 without admitting wrongdoing.
     - No Apple logo. Use a generic assistant orb and the label "$95.000.000".
  3. **Case 3:** a 2017 study in Germany (TU Braunschweig) found 234 Android apps with code listening for ultrasonic beacons. Such beacons were found in 4 of 35 stores in two European cities.
     - Labels: "234 APPS", "ULTRASONIDO".
  4. **Block 5:** a Northeastern University 2018 study of more than 17,000 Android apps found no secret audio recording, but found apps sending screen recordings or screenshots to third parties.
     - Labels: "17.000 APPS", "GRABAN TU PANTALLA".
  5. **Block 6 tips:**
     - mic permissions in settings;
     - the green/orange dot indicator;
     - turn off ad tracking and location for apps that don't need them;
     - delete the assistant's voice history.
- **Theme visuals:** microphone icons, sound waves flowing into phones, a permission popup, red sneakers in an ad (block 1 hook), data/location pins orbiting a person, an ultrasonic wave visualization, the mic indicator dot.
- **Music:** ON, using $D/yt2/detmix2.py. Use style noir for B1–B5 and noirwarm for B6–B7, with risers, drops and fades as in video #2. Keep the SFX limits.
- **Output:** $Y3/det/bB.mp4 at 1920x1080, 24 fps, H.264 + AAC 48k, with full QA (visual plus per-second audio).
- No git, no MCP calls, no image generation. Render one node process at a time.
