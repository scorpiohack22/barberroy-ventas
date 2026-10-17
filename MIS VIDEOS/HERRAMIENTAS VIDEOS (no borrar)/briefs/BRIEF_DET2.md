# Brief: YouTube video #2 "¿Qué pasaría si alguien roba tu cara con IA?" — NOIR DETECTIVE FILE (EXPEDIENTE 002)
This is the same approved format as video #1. Video #1 was approved by the user, so match its look exactly.
- **Engine:** $D/anime/det_base.html. Read its header for helpers and the QA rules. It includes the fixed fedora hair.
- **Approved reference blocks:** $D/yt/det/b1..b7.mp4. Scene code is in $D/anime/det1..det7.html; reuse ideas and helpers from them freely.
- **Format:** 1920x1080, 24 fps, horizontal. 7 BLOCKS; each agent does ONE block (B in its prompt). NO subtitles; only diegetic labels of 3 words or fewer.

D=/tmp/claude-0/-home-user-barberroy-ventas/e018e938-d43e-5f1f-89f6-7c40d86ee153/scratchpad. Y2=$D/yt2.

## Inputs
- **Narration:** the user's cloned voice, final and already checked to be complete. It is in $Y2/vo/bB.wav, with word timings in $Y2/vo/bB.json and the script text in $Y2/vo/blocks.json (index B-1).
  - Verify bB.wav has voice throughout (per-second RMS) before anything.
- **Photos:** Soul 2.0 stills, 2048x1152 (16:9), in $Y2/img/NN_k.png (2+ variants per prompt).
  - $Y2/img/index.json maps the files: {"n":"NN","con":bool,"file":...}. con=true means the man is the user himself.
  - What each NN shows is in $Y2/prompts.txt.
  - Crop to the 21:9 letterbox area (1920x826) with smart framing, as in video #1.
  - Photo numbers per block: B1: 01–07 · B2: 08–12 · B3: 13–22 · B4: 23–41 (case 1 China = 23–28, case 2 France = 29–34, case 3 app = 35–41) · B5: 42–47 · B6: 48–55 · B7: 56–60. Numbers 61–63 are thumbnails; do not use them.
  - **Images are still being generated** by the user's browser assistant. If a needed NN is missing when you start:
    1. Do the detective/board/card shots first.
    2. Re-check $Y2/img/index.json every few minutes (it is refreshed by the coordinator).
    3. Wait up to about 25 minutes for missing photos.
    4. After that, cover the gap with detective, board or drawn shots and report it.
- **Case facts** (for diegetic labels only):
  - China: Baotou, Inner Mongolia, 2023; 4.3 million yuan (about $622,000); friend's face in a video call.
  - France: "Anne", €830,000, fake Brad Pitt with AI images. Do NOT draw or depict Brad Pitt's likeness; refer to him only via a label like "¿BRAD PITT?", or a silhouette with a "?".
  - App: a fake "government" app stealing face scans to enter bank accounts; a victim in Vietnam lost more than $40,000.

## Look
Identical to video #1:
- **Photo shots (A):** letterbox, Ken Burns, grain, vignette, flicker; occasional typewriter label and red marker; garbled AI text covered with clean drawn UI.
- **Evidence board (B):** pins, red strings, stamps.
- **Detective Scorpio (C):** trench coat and fedora, quiff visible, noir office with rain, lip-sync to the narration, about 25–35% of runtime.
- **Case title cards (D):** "CASO #1/#2/#3"; "EXPEDIENTE 002" at the start of B1/B2; "PROTOCOLO" in B6; "CASO CERRADO" at the end of B7.
- **Theme visuals:** face-tracking meshes, a digital mask peeling off, a video-call UI with a glitching face, a face-scan oval.
- **Cutting:** change shot every ~2.5–4 s and cut ~0.1 s before phrases.

## Audio — NEW for video #2: MUSIC IS ON (for retention)
The user wants music that helps retention and is copyright-free. Generate it procedurally yourself; it must be 100% original. Never use or imitate existing songs.
- **Style:** cinematic noir suspense / investigation documentary.
  - Steady pulse (soft sub pulses or ticking hi-hat or low piano ostinato around 90–100 bpm) and low strings or pads.
  - A sparse melodic motif.
  - Tension risers into reveals (case cards, "FALSO" moments).
  - Brief drop-outs to near-silence right before a big line, then the pulse returns. This is a retention device.
  - B6–B7 shift to a warmer, hopeful progression.
- **Level:** 15–18 dB under the voice and ducked under speech; the voice is always clear. Normalize the final to -14 LUFS.
- **Engine:** use $D/yt/detmix.py with style "noir" (B1–B5) or "noirwarm" (B6–B7) with music ON. Improve the bed in your own copy if needed (pulse, risers, drops), but keep it subtle.
- **SFX limits (user rule):** few and soft.
  - At most about 1 per 4–6 s, never 2 within 1 s.
  - Peaks 12 dB or more under the voice.
  - No whoosh on every cut and no typewriter clatter.
  - Rain at -35 dB or quieter.
- **Seams between blocks:** keep the music bed's start and end soft (0.3 s fades) so blocks join smoothly.

## QA (mandatory, the user checks every frame)
- **Visual:** a 2 fps contact sheet of the WHOLE block, plus frames f-1, f, f+1 and f+3 around every cut. Check for:
  - legless or floating characters, covered faces, cropped stamps or labels at the letterbox, garbled AI text, stretched photos, black or white frames;
  - unflattering photos of the user (con=true): pick the best variant or skip.
- **Audio:** per-second RMS of the final mp4 to prove narration is present throughout; measure the music level under the voice and the final LUFS.
- Fix, re-render and re-check.

## Output
- **File:** $Y2/det/bB.mp4 (1920x1080, 24 fps, H.264 + AAC 48k). Its duration must equal bB.wav (+≤0.3 s).
- Delete intermediates. No git, no MCP or Higgsfield calls, no image generation.
- **Shell:** never use pgrep -f or pkill -f with your own command pattern. Each Bash call starts in /home/user/barberroy-ventas, so cd first. Render one node process at a time, in chunks of 900 frames or fewer.

Final answer: output path, shot list with times, photos used, the music description and levels, QA findings and fixes, and anything not fixed.

## UPDATE from the block 1 pilot
- det_base.html loads photos from video #1's folder. In your copy, change the photo folder to ../yt2/img/ (see $D/anime/d2b1.html).
- Music engine: use $D/yt2/detmix2.py. Its options are documented at the top: noir / noirwarm, risers, drops, hits, duck, fade. The B1 mix spec is $Y2/det/b1_mix.json.
- The word-timing json can be off by up to about 0.5 s. Time cuts from actual voice onsets: run an RMS/onset check on bB.wav.

## UPDATE: FULL SCREEN, NO LETTERBOX (user request)
The user does NOT want the black bars at the top and bottom. Re-render your block FULL SCREEN 1920x1080.

1. In your block html, set `const LB = 0` (PIC becomes the full 1920x1080 frame) and remove any letterbox bar drawing.
2. Re-check everything that the bars used to hide:
   - Photos now show their full 16:9 frame. Garbled AI text or UI that was cropped out by the old 21:9 crop may now be visible. Fix it by zooming or reframing the photo, or by covering it with clean drawn UI.
   - Board and office edges, and the detective's legs or desk bottom, now show more. Make sure nothing looks unfinished: no board edge with empty background, no legless or floating character, nothing cut off.
   - Labels and stamps keep a safe margin of 60 px or more from the frame edges.
3. AUDIO: do NOT remix. Reuse the existing audio track of $Y2/det/bB.mp4 exactly:
   - render the silent video;
   - then `ffmpeg -i silent.mp4 -i old_bB.mp4 -map 0:v -map 1:a -c:v libx264 -crf 18 -pix_fmt yuv420p -c:a copy`.
   - Keep a backup of the old file first, as $Y2/det/bB_letterbox.mp4.
4. Full QA again: a 2 fps contact sheet and frames around every cut. Then overwrite $Y2/det/bB.mp4.
