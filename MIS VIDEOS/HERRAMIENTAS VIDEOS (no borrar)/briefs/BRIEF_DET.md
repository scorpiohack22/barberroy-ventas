# Brief: YouTube video "¿Qué pasaría si la IA clona tu voz y se hace pasar por ti?" — NOIR DETECTIVE FILE edition
1920x1080, 24 fps, horizontal. The video is split into 7 BLOCKS; each agent does ONE block (B in its prompt). The user wants it SPECTACULAR and viral, with NO subtitles, and wants every frame checked for errors before delivery.

D=/tmp/claude-0/-home-user-barberroy-ventas/e018e938-d43e-5f1f-89f6-7c40d86ee153/scratchpad. Y=$D/yt.

## Inputs
- **Narration** (the user's own cloned voice, final): $Y/vo2/bB.wav, with word timings in $Y/vo2/bB.json ({dur, words:[[s,e,w]]}). The script text is in $Y/vo/blocks.json (index B-1).
- **Photos**: cinematic stills generated with Higgsfield Soul Cinema, mostly 2528x1088 (21:9), in $Y/img/NN_k.png. There are 2–4 variants per prompt number NN; choose the best.
  - $Y/img/index.json maps the files: {"n":"NN","con":true/false,"file":...}. con=true means the man is the user himself (his real face).
  - The prompt list, with what each NN shows, is in "/home/user/barberroy-ventas/MIS VIDEOS/YouTube/PROMPTS IMAGENES - Qué pasaría si la IA clona tu voz.txt".
  - Photo numbers per block: B1: 01–07 · B2: 08–12 · B3: 13–22 · B4: 23–42 (case 1 = 23–28, case 2 = 29–34, case 3 = 35–42) · B5: 43–48 · B6: 49–58 · B7: 59–63.
  - If a needed photo does not exist yet, cover that moment with detective-cartoon or evidence-board shots. Do not wait.
- **Cartoon engine**: $D/anime/yt_base.html, the approved landscape Scorpio cartoon engine.
  - Read its header for helpers: MAMA, hooded scammer, sets, props, holograms, dissolve, blurred(), group(), camera fx.
  - Rendering uses $D/anime/yt1_render.mjs (copy it). Mixing uses $Y/ytmix.py (see $Y/b1_mix.json).
  - Lip-sync envelope comes from python3 $D/batch/mkenv.py bB.wav out_tl.json.
  - Earlier cartoon-only blocks are in $Y/out/b*.mp4, and their scene code in $D/anime/yt2..yt7.html. You may reuse ideas and helpers.

## Format: "EXPEDIENTE" (a noir detective case file)
**Look:** a noir investigative documentary.
- Deep blacks, amber desk-lamp light, teal shadows.
- Global film grain, subtle gate weave, vignette and occasional light flicker.
- Every shot moves, After-Effects style:
  - slow push-ins and pans, with parallax where possible;
  - light leaks or flash frames on big moments;
  - camera-flash "photo taken" transitions;
  - smooth whip transitions.

**Shot types (mix them, change shot every ~2.5–4 s, cut ~0.1 s before a phrase):**
- **A. PHOTO (≈50–60% of runtime).** A Soul Cinema still, full width, letterboxed 21:9 (1920x826 with black bars; this cinematic letterbox is part of the "unusual format" the user wants).
  - Animate with a slow Ken Burns (scale 1.0→1.08, gentle pan) plus grain.
  - Optionally add ONE diegetic typewriter label of 1–3 words in a corner, with a typing animation and a tiny tick sound. Examples: "02:00 AM", "EVIDENCIA #04", "ARIZONA, EE. UU.", "HONG KONG", "$25.000.000".
  - Optionally a hand-drawn red marker circle or arrow on a detail.
- **B. EVIDENCE BOARD.** A corkboard (procedurally drawn: cork texture, pins). The photos are pinned as printed photos or polaroids with white borders, slight rotation and shadows.
  - Red string animates between them, and the camera glides across the board.
  - "CONFIDENCIAL" / "CASO #N" / "FALSO" rubber stamps slam in with a shake.
  - Use it for intros of cases, recaps and the protection tips.
- **C. DETECTIVE SCORPIO (≈25–35%).** The cartoon Scorpio from yt_base as the detective narrator, in a noir office: venetian-blind light stripes, desk lamp, case folders, a coffee cup, rain on the window.
  - Add a tan trench coat and fedora with a helper in YOUR copy.
  - He talks to camera with LIP-SYNC to the narration envelope. Use him on block openings, key lines and transitions, holding photos and pointing at the board.
  - In his shots the cartoon style must stay clean and readable.
- **D. CASE TITLE CARD.** A manila folder opening with a stamped "CASO #1 / #2 / #3" (B4), or "PROTOCOLO" (B6).

**Never:**
- Subtitles or narration text on screen. Only diegetic labels ≤3 words.
- An unflattering photo of the user (con=true). Before using one, check his face looks good; if a variant looks bad, use the other variant or skip it.
- A photo whose garbled AI text is prominent; crop it or cover it with your own drawn label. Example: the clock in photo 01 shows garbled digits, so crop or blur them and draw "2:00".
- Black or empty frames, or a stretched or distorted photo (always keep the aspect ratio).

## Quality (the user complained about errors in the previous version, like the cartoon character missing legs)
- Cartoon characters: never cut legs or arms awkwardly, never legless or floating. Either show full figures with feet planted, or frame cleanly at the waist or chest. Faces are never covered. No overlapping glitches.
- **Mandatory QA before finishing:**
  1. Extract a contact sheet at **2 frames per second for the WHOLE block**, plus single frames around every cut.
  2. Read them all and list every issue: limbs, cropping, text, timing, black frames, photo quality.
  3. Fix everything, re-render and re-check.
  4. Report what you checked.

## Audio
- **Voice:** bB.wav, unchanged and always clear.
- **Music:** a procedural noir suspense bed (no copyrighted music): deep sub pulses, brushed noir drums, low strings, and a lonely muted-trumpet-like or Rhodes motif.
  - It gets warmer and more hopeful in B6–B7.
  - It sits 15–18 dB under the voice. Normalize the final to -14 LUFS.
- **SFX:** typewriter ticks, camera shutter/flash, rubber stamp thump, pin pushes, string twang, rain ambience in the office, phone ring/vibration, glitch zaps, whooshes on cuts.
- Base this on $Y/ytmix.py; add a "noir" style in YOUR copy if needed.

## Output
- **File:** $Y/det/bB.mp4 (1920x1080, 24 fps, H.264 + AAC 48k). Its duration must equal bB.wav (+≤0.3 s).
- Delete your intermediates. No git. No MCP / Higgsfield calls. No new image generation.
- **Shell:** never use pgrep -f or pkill -f with a pattern from your own command line. Each Bash call starts in /home/user/barberroy-ventas, so cd first. Render sequentially, one node render at a time.

Final answer: output path, shot list with times, the photos used (NN_k), QA findings and fixes, anything not fixed.

## UPDATE: user feedback on SFX (mandatory)
The user says previous videos had TOO MANY sound effects, too close together and too loud.
- **Use FEW SFX:** at most about 1 every 4–6 seconds, and only on meaningful moments (a key stamp, a phone ring, a camera flash on a big reveal).
- **No SFX on every cut.** Whooshes only on major transitions.
- **No stacking:** never 2+ SFX within 1 s.
- **SFX must be SUBTLE:**
  - peaks at least 12 dB below the voice peaks, and never louder than the voice;
  - soft attack, no harsh clicks;
  - no constant typewriter clatter: at most a couple of soft ticks.
- **Rain ambience,** if used, is barely audible (about -35 dB).
- **Music** stays gentle under the voice.

## UPDATE 2: all photos are available now
- $Y/img/index.json now covers all prompts 01–66, so do not wait for photos.
  - Files named NN_k.png (01–12) are Soul Cinema 21:9 (2528x1088).
  - Files named NN_kv.png are Soul 2.0 16:9 (2048x1152).
  - Prefer whichever variant looks best. For 16:9 files, crop to the 21:9 letterbox area (1920x826) with smart framing that keeps faces and hands fully in frame. Keep the aspect ratio.
- Photos with con=true show the user (his real face). Check every one before use and pick the most flattering; skip any with bad faces or anatomy.
- Prompts 64–66 are thumbnail portraits. Do NOT use them in blocks; they are reserved for the thumbnail.
- **Reference look:** block 1 ($Y/det/b1.mp4, scenes in $D/anime/det1.html) is approved as the pilot. Copy det_base.html, match that look, and use detmix.py ("noir" style for B2–B5, "noirwarm" for B6–B7). The SFX limits are enforced there.
- **Detective Scorpio must stay recognizable:** his spiky dark quiff with grey streaks must visibly stick out from under/around the fedora (sides and front tuft). If det_base's fedora hides it, adjust in your copy.

## UPDATE 3 (user decision): NO MUSIC
The user wants NO music at all.
- The final mix is the voice plus very few subtle SFX, following the SFX limits above. A barely audible rain/room tone in office shots is OK (≤ -35 dB).
- Disable the music bed in detmix.py: music off, or music_db = -inf.
- Loudness: normalize the final to -14 LUFS based on the voice.
