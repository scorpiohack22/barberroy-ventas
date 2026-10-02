# BarberRoy Academy — After Effects promo

`barberroy_promo.jsx` builds an editable After Effects project for a 41-second promo, 1920×1080 at 30 fps. It uses the brand images, fonts, colors and copy from the sales page (`index.html`). The pacing follows the reference cut: 120 BPM, with roughly one scene per bar.

## Run it

1. Install the brand fonts from Google Fonts, using the static files and not the variable ones:
   [Anton](https://fonts.google.com/specimen/Anton),
   [Manrope](https://fonts.google.com/specimen/Manrope) (Medium, Bold) and
   [Archivo](https://fonts.google.com/specimen/Archivo) (ExtraBold).
2. Put your music track in `motion/audio/` (mp3, wav, aif or m4a).
3. In After Effects, choose **File → Scripts → Run Script File…** and pick `motion/barberroy_promo.jsx`.
4. If your track isn't 120 BPM, or its first downbeat isn't at 0.21s, edit `CONFIG.bpm` / `CONFIG.offset` at the top of the script and run it again. All timing is computed from those two values.

## What you get

```
BR_Promo/
  BR_MAIN            ← the edit: scene precomps, transitions, music, markers
    CONTROL          ← BPM / Downbeat Offset / Beat Pulse % sliders (live)
    BEAT GRID        ← a marker on every beat, "Bar N" on downbeats
  01_Scenes/S01…S11  ← one precomp per slide
  02_Images/         ← brand photos
  03_Audio/          ← your track
```

| # | Scene | Bars | In | Content |
|---|-------|------|----|---------|
| 1 | Hook | 1 | — | Full-bleed silver-hair close-up, logo, "Diseñado para destacar." |
| 2 | Promise | 2 | push | Ghost "COLOR", headline + sub, underline draw-on |
| 3 | Pain | 2 | zoom | Three pain points, one every two beats |
| 4 | Turn | 1 | cut | "HASTA HOY." blur/tracking reveal on brand red |
| 5 | Program | 3 | push | "6 módulos. Un método." + module list |
| 6 | Portfolio | 2 | wipe | Three result cards rise into place |
| 7 | Instructor | 2 | push | "Conoce a BarberRoy." + 4M+ / 5K+ / 10+ counters |
| 8 | Stage | 1 | blur | Roy on stage, "Mira la técnica en acción." |
| 9 | Statement | 2 | cut | Paper background, "CONVIÉRTETE EN EL COLORISTA QUE COBRA MÁS." + ring draw-on |
| 10 | Offer | 2 | push | $297 struck through → "$70 USD", perks |
| 11 | End card | 2 | zoom | Logo, "Inscríbete hoy", @_barberroy_, fade out |

## How it stays editable

- **Text** is all live text layers. Reveals use Text Animators named `Reveal` / `Blur In`. To retime one, move the two `Start` keys on its Range Selector. To restyle it, edit the animator's properties.
- **Transitions** are ordinary keyframes on the scene layers in `BR_MAIN`: Position for push, Scale/Opacity for zoom, `Transition Blur` / `Transition Wipe` effects. Each lasts one beat and starts on a downbeat.
- **Image motion**: every photo has a slow push-in and drift on its Scale/Position keys. Its Scale expression adds a beat pulse that reads `CONTROL`, so set `Beat Pulse %` to 0 to turn it off. The portfolio cards move through a parent null named `… (move)`.
- **Counters** are driven by a `Value` slider on each stat layer. The prefix and suffix are at the top of its Source Text expression.
- **Lines and the ring** are shape layers drawn on with Trim Paths (`Trim End` keys).
- **Hierarchy**: the display font (Anton) is used for headlines, Manrope for body copy, and Archivo ExtraBold with wide tracking for eyebrows and labels. The brand reds `#e3262f` / `#b8131c` and paper `#f6f3ee` come from the site's CSS.

Copy, image choices, colors and fonts are all in the `SCENES` and `CONFIG` blocks of the script. Change them and run it again to get a fresh project.
