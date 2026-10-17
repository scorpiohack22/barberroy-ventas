"""DETMIX2 — "EXPEDIENTE 002" noir mixer WITH MUSIC (copy of yt/detmix.py; new procedural music bed v2, 100% original). Shared by B1-B7.
usage: python3 detmix2.py silent.mp4 voice.wav spec.json out.mp4 [--music-only music.wav]
       (--music-only additionally writes the calibrated music bus alone, for checks)

spec.json = {
  "style": "noir" | "noirwarm" | "none",   # noir = B1-B5 (D minor suspense), noirwarm = B6-B7 (F major, hopeful). none = no music
  "music_db": -17,          # music RMS measured UNDER the active voice (allowed -15..-18; default -17). null = no music
  "duck_db": 3,             # extra smooth ducking while the voice speaks (attack ~60 ms, release ~350 ms)
  "bpm": 94,                # pulse tempo (default noir 94, noirwarm 88; keep 90-100 for noir)
  "phase": 0.0,             # seconds into the 4-bar cycle at t=0 (only if you want a different chord to start the block)
  "layers": ["pad","pulse","hat","piano","motif","drone"],   # subset to thin the bed (noirwarm default has no "drone")
  "risers": [t, ...],       # tension risers (1.5 s noise swell + rising tone) ENDING at t (put t on a case card / FALSO / reveal)
  "riser_len": 1.5,
  "drops": [[t0, t1], ...], # retention drop-outs: the bed falls to ~-30 dB at t0 (120 ms fade) and the pulse slams back at t1
                            # (use right before a big line: t1 = cut/phrase start). Risers are NOT muted by drops (drop + riser = swell into the line)
  "hits": [t, ...],         # soft low impacts (sub boom), e.g. at t1 of a drop or on a stamp — counts as music, not SFX
  "calm_from": t,           # after t: no hat/pulse/piano, pad + motif only (outros)
  "silence_from": t,        # after t: everything silent
  "fade": 0.3,              # music fade in/out at block start/end (seams between blocks join smoothly)
  "seed": 7,                # motif/humanize variation
  "sfx": [[name, t, gain_db], ...],    # gain_db <= 0, relative to the SFX ceiling (see RULES)
  "whoosh_at": [t, ...],               # whooshes ONLY on major transitions (cuts get NO automatic whoosh)
  "rain": [[t0, t1], ...]              # rain ambience windows (office shots), -35 dB under the voice
}
MUSIC v2 (noir): 94 bpm, 4-bar cycle Dm(add9) - Bb - Gm - A(b9). Layers: low string pad; heartbeat sub pulse (pitched sub on beats 1 & 3);
  soft ticking hat (8ths, offbeat accents, like a clock); felt low-piano ostinato (8ths arpeggio); sparse celesta motif (3-note
  phrases every 2 bars); faint high bowed drone that fades in. noirwarm: 88 bpm, F - C/E - Dm - Bb(add9), rising piano arpeggio,
  warm piano motif, brushed shaker hat, brighter pad.
Printed report: music level under the voice, SFX peak vs voice peak, final LUFS.
SFX names: shutter (camera flash), stamp (rubber-stamp thump), pin (push-pin), twang (red string), tick (soft typewriter tick),
           vib (phone vibration), ring (soft marimba ringtone), glitch, whoosh, boom, heart, ding, riser, shimmer
RULES (user feedback, enforced here — do not bypass):
  * never 2 SFX within MIN_GAP = 1.0 s (later ones are dropped, with a warning)
  * target <= 1 SFX per 4-6 s (warning printed if denser than 1 per 4 s)
  * every SFX peak is <= voice peak - 12 dB (SFX_CEIL_DB), gain_db can only lower it; 12 ms soft attack on everything
  * rain ambience at -35 dB vs voice RMS; music 15-18 dB under the voice and ducked under speech; final -14 LUFS
"""
import sys, json, subprocess, tempfile, os, wave
import numpy as np
SR = 44100
MIN_GAP, SFX_CEIL_DB, RAIN_DB, MAX_RATE = 1.0, -12.0, -35.0, 1 / 4.0
vid, voice, specf, outp = sys.argv[1:5]
spec = json.load(open(specf))
rng = np.random.default_rng(11)

def readwav(p):
    tmp = tempfile.mktemp(suffix='.wav')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', p, '-ac', '1', '-ar', str(SR), tmp], check=True)
    w = wave.open(tmp); x = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float64) / 32768; os.remove(tmp); return x

V = readwav(voice); N = len(V); DUR = N / SR
L = np.zeros(N); R = np.zeros(N)       # music
SL = np.zeros(N); SRr = np.zeros(N)    # sfx
AL = np.zeros(N); AR = np.zeros(N)     # ambience

def lp(x, k):
    k = max(1, int(k)); c = np.cumsum(np.insert(x, 0, 0)); y = (c[k:] - c[:-k]) / k; return np.concatenate([y, np.zeros(k - 1)])
def hpn(n, k=3): x = rng.normal(0, 1, n); return x - lp(x, k)
def add(bl, br, x, at, g=1.0, pan=0.0):
    i = int(at * SR)
    if i >= N or i + len(x) <= 0: return
    if i < 0: x = x[-i:]; i = 0
    x = x[:N - i]; bl[i:i + len(x)] += x * g * (1 - pan); br[i:i + len(x)] += x * g * (1 + pan)
def hz(m): return 440 * 2 ** ((m - 69) / 12)
def soft(x, a=.012):
    n = min(len(x), int(a * SR)); x = x.copy(); x[:n] *= np.linspace(0, 1, n) ** 2; m = min(len(x), int(.03 * SR)); x[-m:] *= np.linspace(1, 0, m); return x

# ---------------- SFX (all soft, low-passed) ----------------
def s_whoosh(d=.6):
    n = int(d * SR); t = np.arange(n) / SR; x = rng.normal(0, 1, n); y = np.zeros(n)
    for seg in range(10): a, b = seg * n // 10, (seg + 1) * n // 10; y[a:b] = lp(x, 60 - 40 * abs(seg / 9 - .5) * 2)[a:b]
    return y * np.sin(np.pi * t / d) ** 2
def s_shutter():  # mechanical camera: two soft clacks + tiny wind
    out = np.zeros(int(.35 * SR))
    for at, g in [(0, 1), (.09, .7)]:
        n = int(.05 * SR); t = np.arange(n) / SR; x = lp(rng.normal(0, 1, n), 5) * np.exp(-t * 90) + np.sin(2 * np.pi * 1900 * t) * np.exp(-t * 120) * .3
        i = int(at * SR); out[i:i + n] += x * g
    return out
def s_stamp():  # dull rubber thump on wood
    n = int(.45 * SR); t = np.arange(n) / SR; f = 110 * np.exp(-t * 18) + 55
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 14) + lp(rng.normal(0, 1, n), 14) * np.exp(-t * 40) * .6
def s_pin(): n = int(.12 * SR); t = np.arange(n) / SR; return lp(rng.normal(0, 1, n), 6) * np.exp(-t * 70) + np.sin(2 * np.pi * 700 * t) * np.exp(-t * 60) * .2
def s_twang():
    n = int(.7 * SR); t = np.arange(n) / SR; f = 180 * (1 + .03 * np.exp(-t * 8) * np.sin(2 * np.pi * 9 * t))
    return sum(a * np.sin(2 * np.pi * np.cumsum(f * h) / SR) for h, a in [(1, 1), (2, .4), (3, .2)]) * np.exp(-t * 6) * .6
def s_tick(): n = int(.05 * SR); t = np.arange(n) / SR; return lp(rng.normal(0, 1, n), 8) * np.exp(-t * 120) + np.sin(2 * np.pi * 1200 * t) * np.exp(-t * 150) * .2
def s_vib(d=.9):  # phone vibrating on a nightstand: two soft buzz pulses
    out = np.zeros(int(d * SR))
    for at in (0, .45):
        n = int(.32 * SR); t = np.arange(n) / SR; x = lp(np.sign(np.sin(2 * np.pi * 155 * t)), 18) * np.minimum(1, t / .03) * np.minimum(1, (.32 - t) / .05)
        i = int(at * SR); out[i:i + n] += x[:len(out) - i]
    return out
def s_ring(d=.9):
    out = np.zeros(int(d * SR))
    for k, m in enumerate([76, 79, 84, 79]):
        n = int(.35 * SR); t = np.arange(n) / SR; x = np.sin(2 * np.pi * hz(m) * t) * np.exp(-t * 9); i = int(k * .16 * SR); out[i:i + n] += x[:len(out) - i]
    return out
def s_glitch(d=.3):
    n = int(d * SR); out = np.zeros(n); i = 0
    while i < n:
        seg = int(rng.uniform(.012, .05) * SR); f = rng.choice([180, 420, 900]); tt = np.arange(seg) / SR
        out[i:i + seg] = (np.sign(np.sin(2 * np.pi * f * tt)) * .5 + rng.normal(0, .3, seg))[:n - i] * rng.uniform(.3, 1); i += seg + int(rng.uniform(0, .02) * SR)
    return lp(out, 6)
def s_boom(d=1.6): n = int(d * SR); t = np.arange(n) / SR; f = 60 * np.exp(-t * 2.5) + 32; return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.4)
def s_heart():
    out = np.zeros(int(.6 * SR))
    for at, g in [(0, 1), (.22, .7)]:
        n = int(.25 * SR); t = np.arange(n) / SR; f = 55 * np.exp(-t * 6) + 38; i = int(at * SR); out[i:i + n] += np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 14) * g
    return out
def s_ding(): n = int(1.2 * SR); t = np.arange(n) / SR; return sum(a * np.sin(2 * np.pi * 1318 * m * t) for a, m in [(1, 1), (.35, 2.76)]) * np.exp(-t * 4)
def s_riser(d=1.2):
    n = int(d * SR); t = np.arange(n) / SR; x = rng.normal(0, 1, n); y = np.zeros(n)
    for seg in range(12): a, b = seg * n // 12, (seg + 1) * n // 12; y[a:b] = lp(x, 50 - 40 * seg / 11)[a:b]
    return y * (t / d) ** 2
def s_shimmer(d=1.4): n = int(d * SR); t = np.arange(n) / SR; return sum(np.sin(2 * np.pi * hz(m) * t) for m in (81, 84, 88)) * np.sin(np.pi * t / d) ** 2
FX = {k[2:]: v for k, v in globals().items() if k.startswith('s_')}

# ---- enforce the SFX rules ----
vpeak = np.percentile(np.abs(V), 99.9) + 1e-9
ceil = vpeak * 10 ** (SFX_CEIL_DB / 20)
events = sorted([[n_, float(t_), min(0.0, float(g_))] for n_, t_, g_ in spec.get('sfx', [])] + [['whoosh', float(t_) - .3, -4.0] for t_ in spec.get('whoosh_at', [])], key=lambda e: e[1])
kept = []
for e in events:
    if kept and e[1] - kept[-1][1] < MIN_GAP: print('DROP (too close):', e); continue
    kept.append(e)
if DUR > 0 and len(kept) / DUR > MAX_RATE: print(f'WARNING: {len(kept)} SFX in {DUR:.1f}s (> 1 per {1 / MAX_RATE:.0f}s) — trim the list')
for name, t0, gdb in kept:
    x = soft(FX[name]()); x = x / (np.max(np.abs(x)) + 1e-9) * ceil * 10 ** (gdb / 20)
    add(SL, SRr, x, t0, 1, 0)
print('SFX kept:', [(e[0], round(e[1], 2)) for e in kept])

# ---------------- MUSIC v2 ----------------
style = spec.get('style', 'none')
if 'music_db' in spec and spec['music_db'] is None: style = 'none'
NOMUSIC = style == 'none'; calm = spec.get('calm_from', 1e9); MDB = spec.get('music_db', -17)
T = np.arange(N) / SR
mrng = np.random.default_rng(spec.get('seed', 7))
RL = np.zeros(N); RR = np.zeros(N)     # riser bus (not muted by drops)
def fenv(n, a, r):
    e = np.ones(n); na = min(n, max(1, int(a * SR))); nr = min(n, max(1, int(r * SR))); e[:na] *= np.linspace(0, 1, na); e[n - nr:] *= np.linspace(1, 0, nr); return e
def piano(m, ln, vel):  # felt piano: soft hammer, fast-decaying upper partials, lowpassed
    n = int(ln * SR); tt = np.arange(n) / SR; f = hz(m)
    s = sum(a * np.sin(2 * np.pi * f * h * (1 + .0004 * h * h) * tt) * np.exp(-tt * (1.2 + 1.1 * h)) for h, a in [(1, 1), (2, .45), (3, .22), (4, .12), (5, .06)])
    s = lp(s, 3) + lp(rng.normal(0, 1, n), 10) * np.exp(-tt * 200) * .05
    return s * fenv(n, .005, min(.12, ln * .3)) * vel * .22
def celesta(m, ln, vel):
    n = int(ln * SR); tt = np.arange(n) / SR; f = hz(m)
    s = np.sin(2 * np.pi * f * tt) * np.exp(-tt * 2.2) + .3 * np.sin(2 * np.pi * f * 4.02 * tt) * np.exp(-tt * 7) + .12 * np.sin(2 * np.pi * f * 2 * tt) * np.exp(-tt * 4)
    return s * fenv(n, .003, .15) * vel * .16
def strings(ch, ln, vel, bright=0):
    n = int(ln * SR); tt = np.arange(n) / SR; s = np.zeros(n)
    for m in ch:
        for dt in (-.0035, 0, .0035):
            f = hz(m) * (1 + dt); ph = mrng.uniform(0, 6.28)
            for h in range(1, 9): s += np.sin(2 * np.pi * f * h * tt + h * ph) / h
    s = lp(lp(s, 14 - 6 * bright), 10 - 4 * bright) / (len(ch) * 8)
    sw = 1 + .12 * np.sin(2 * np.pi * .23 * tt)   # slow bowing swell
    return s * sw * np.minimum(1, tt / 1.2) * np.minimum(1, (ln - tt) / 1.0) * vel
def subpulse(m, vel):  # heartbeat: pitched sub + soft thump
    n = int(.55 * SR); tt = np.arange(n) / SR; f = hz(m) * (1 + .5 * np.exp(-tt * 40))
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 6) + lp(rng.normal(0, 1, n), 30) * np.exp(-tt * 60) * .25) * fenv(n, .006, .05) * vel
def hat(vel, warm=False):
    n = int((.09 if warm else .05) * SR); tt = np.arange(n) / SR; x = hpn(n, 2 if not warm else 3)
    return x * np.exp(-tt * (45 if warm else 110)) * fenv(n, .002 if not warm else .015, .01) * vel * .07
def riser(d, m0):
    n = int(d * SR); tt = np.arange(n) / SR; x = rng.normal(0, 1, n); y = np.zeros(n)
    for seg in range(16): a, b = seg * n // 16, (seg + 1) * n // 16; k_ = int(60 - 52 * seg / 15); y[a:b] = (lp(lp(x, k_), k_) - lp(x, 160))[a:b]
    f = hz(m0) * 2 ** (tt / d)  # one-octave glissando
    tone = sum(a * np.sin(2 * np.pi * np.cumsum(f * h) / SR) for h, a in [(1, 1), (2, .3), (3, .15)])
    e = (tt / d) ** 2.6; e[-int(.03 * SR):] *= np.linspace(1, 0, int(.03 * SR))
    return (y * 1.6 + tone * .35) * e
def impact():
    n = int(1.6 * SR); tt = np.arange(n) / SR; f = 58 * np.exp(-tt * 3) + 34
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 2.6) + lp(rng.normal(0, 1, n), 25) * np.exp(-tt * 9) * .3) * fenv(n, .008, .2)

if style in ('noir', 'noirwarm'):
    warm = style == 'noirwarm'
    bpm = spec.get('bpm', 88 if warm else 94); beat = 60 / bpm; bar = beat * 4; e8 = beat / 2
    layers = set(spec.get('layers', ['pad', 'pulse', 'hat', 'piano', 'motif'] + ([] if warm else ['drone'])))
    if not warm:
        prog = [[50, 57, 62, 64, 65], [46, 53, 58, 62], [43, 50, 55, 58], [45, 52, 57, 61, 58]]
        arp = [0, 1, 2, 1, 0, 1, 3, 1]
        phrases = [[(74, 1), (72, .5), (69, 2)], [(70, 1), (69, .5), (65, 2)], [(74, 1), (76, .5), (77, 1.5)], [(76, 1), (73, .5), (69, 2)]]
    else:
        prog = [[53, 60, 65, 69], [52, 60, 64, 67], [50, 57, 62, 65], [46, 53, 60, 62]]
        arp = [0, 1, 2, 3, 2, 1, 2, 3]
        phrases = [[(72, 1), (74, .5), (77, 2)], [(76, 1), (74, .5), (72, 2)], [(72, 1), (77, .5), (76, 2)], [(74, 1), (72, .5), (69, 2.5)]]
    t = -spec.get('phase', 0.0); bi = 0
    while t < DUR:
        ch = prog[bi % 4]; root = ch[0]; on = t < calm
        if 'pad' in layers: add(L, R, strings(ch[:4], bar + 1.3, .5 if not warm else .45, bright=1 if warm else 0), t, 1, .12 * ((bi % 2) * 2 - 1))
        if 'pad' in layers: add(L, R, strings([root - 12], bar + 1.3, .35), t, 1, 0)   # low cello root
        for b in range(4):
            tb = t + b * beat
            if 'pulse' in layers and on and b in (0, 2): add(L, R, subpulse(root - 12, 1.0 if b == 0 else .7), tb)
            if 'pulse' in layers and on and not warm and b == 2: add(L, R, subpulse(root - 12, .35), tb + beat * .5)   # heartbeat double
        for k in range(8):
            tk = t + k * e8 + mrng.normal(0, .004)
            if 'hat' in layers and on: add(L, R, hat((.55 if k % 2 else .3) * (.6 if warm else 1), warm), tk, 1, .3)
            if 'piano' in layers and on:
                m = ch[arp[k] % len(ch[:4])] - (12 if not warm else 0)
                add(L, R, piano(m, e8 * 2.2, (.75 if k == 0 else .5) * mrng.uniform(.85, 1.05)), tk, 1, -.15 + .3 * (k % 2))
        if 'motif' in layers and bi % 2 == 1:
            tm = t + beat; ph = phrases[(bi // 2) % len(phrases)]
            for m, ln in ph:
                add(L, R, celesta(m, ln * beat * 2.5, .9) if not warm else piano(m, ln * beat * 2.5, 1.1), tm, 1, -.2); tm += ln * beat
        t += bar; bi += 1
    if 'drone' in layers:
        x = np.sin(2 * np.pi * hz(81) * T + .4 * np.sin(2 * np.pi * 5.5 * T)) * .010 * np.clip((T - 3) / 8, 0, 1) * (T < calm); L += x; R += x
    rl = spec.get('riser_len', 1.5)
    for t1 in spec.get('risers', []):
        x = riser(rl, 50 if not warm else 53); add(RL, RR, x, t1 - rl, 1, -.15); add(RL, RR, x[::-1][::-1] * .9, t1 - rl + .012, 1, .15)
    for th in spec.get('hits', []): add(L, R, impact(), th, 1.0)
elif style == 'epic':
    # EPIC DOCUMENTARY score (100% original, procedural): taiko drums, staccato string ostinato, low brass, choir, horn theme.
    WF = spec.get('warm_from', 1e9)
    def saw(f, tt, nh=10, ph=0): return sum(np.sin(2 * np.pi * f * h * tt + h * ph) / h for h in range(1, nh + 1))
    def stac(m, ln, vel):  # staccato string note
        n = int(ln * SR); tt = np.arange(n) / SR; s = saw(hz(m), tt, 9) + saw(hz(m) * 1.004, tt, 9)
        return lp(lp(s, 7), 5) * fenv(n, .008, ln * .5) * np.exp(-tt * 5) * vel * .09
    def brass(ch, ln, vel):
        n = int(ln * SR); tt = np.arange(n) / SR; s = np.zeros(n)
        for m in ch:
            for dt in (-.003, .003): s += saw(hz(m) * (1 + dt), tt, 12, mrng.uniform(0, 6.28))
        att = np.minimum(1, tt / .35) ** 1.5
        s = lp(lp(s, 16), 9) * .6 + lp(s, 6) * .4 * att   # filter opens with the swell
        return s * att * np.minimum(1, (ln - tt) / .8) * vel / (len(ch) * 3)
    def choir(ch, ln, vel):
        n = int(ln * SR); tt = np.arange(n) / SR; s = np.zeros(n)
        for m in ch:
            for dt in (-.006, 0, .006):
                f = hz(m) * (1 + dt) * (1 + .004 * np.sin(2 * np.pi * 5 * tt + mrng.uniform(0, 6)))
                s += sum(np.sin(2 * np.pi * np.cumsum(f * h) / SR) / h for h in range(1, 9))
        s = (lp(s, 9) - lp(s, 40)) + .5 * (lp(s, 4) - lp(s, 9))   # rough "aah" formants
        return s * np.minimum(1, tt / 1.0) * np.minimum(1, (ln - tt) / 1.0) * vel / (len(ch) * 3)
    def horn(m, ln, vel):
        n = int(ln * SR); tt = np.arange(n) / SR; f = hz(m) * (1 + .003 * np.sin(2 * np.pi * 5.2 * tt) * np.minimum(1, tt / .4))
        s = sum(a * np.sin(2 * np.pi * np.cumsum(f * h) / SR) for h, a in [(1, 1), (2, .55), (3, .3), (4, .15), (5, .08)])
        return lp(s, 4) * fenv(n, .09, min(.3, ln * .4)) * vel * .12
    def taiko(vel, big=1.0):
        n = int(.9 * SR); tt = np.arange(n) / SR; f = (85 * np.exp(-tt * 12) + 46) * big ** -.2
        return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 4.5) + lp(rng.normal(0, 1, n), 9) * np.exp(-tt * 28) * .5) * fenv(n, .003, .1) * vel
    def tom(vel):
        n = int(.4 * SR); tt = np.arange(n) / SR; f = 150 * np.exp(-tt * 10) + 95
        return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 9) + lp(rng.normal(0, 1, n), 6) * np.exp(-tt * 40) * .3) * vel * .5
    def section(warm, t0s, t1s):
        bpm = 90 if warm else 100; beat = 60 / bpm; bar = beat * 4; s16 = beat / 4
        if warm:
            progs = [[53, 60, 65, 69], [48, 55, 64, 67], [50, 57, 62, 65], [46, 53, 62, 65]]
            theme = [[(72, 1.5), (74, .5), (77, 2)], [(76, 1.5), (72, .5), (74, 2)], [(72, 1), (77, 1), (81, 2)], [(79, 1.5), (77, .5), (76, 2)]]
        else:
            progs = [[50, 57, 62, 65], [46, 53, 58, 62], [41, 48, 57, 60], [48, 55, 60, 64], [50, 57, 62, 65], [46, 53, 58, 62], [43, 50, 58, 62], [45, 52, 57, 61]]
            theme = [[(62, 1.5), (65, .5), (69, 2)], [(67, 1.5), (65, .5), (62, 2)], [(62, 1), (69, 1), (74, 2)], [(72, 1.5), (70, .5), (69, 2)]]
        pat = [0, 0, 2, 0, 3, 0, 2, 1, 0, 0, 2, 0, 3, 2, 1, 2]
        t = t0s; bi = 0
        while t < t1s:
            ch = progs[bi % len(progs)]; root = ch[0]; on = t < calm
            if 'pad' in layers:
                add(L, R, brass([root - 12, root, ch[1]], bar + .9, .55 if not warm else .42), t, 1, 0)
                add(L, R, choir(ch[1:4] if not warm else [c + 12 for c in ch[1:3]], bar + 1.0, .35 if not warm else .3), t, 1, .15 * ((bi % 2) * 2 - 1))
            if 'piano' in layers and on:
                for k in range(16):
                    m = ch[pat[k] % len(ch)] + (0 if root >= 48 else 12)
                    add(L, R, stac(m, s16 * 1.6, (1.0 if k % 4 == 0 else .62) * mrng.uniform(.9, 1.05)), t + k * s16 + mrng.normal(0, .003), 1, -.25 + .5 * (k % 2))
            if 'pulse' in layers and on:
                hits_ = [(0, 1.0), (1.5, .55), (2, .85), (3, .45), (3.5, .6)] if not warm else [(0, .8), (2, .55)]
                for bt, v in hits_: add(L, R, taiko(v), t + bt * beat)
                if not warm and bi % 4 == 3:   # tom fill into the next phrase
                    for k in range(8): add(L, R, tom(.35 + .08 * k), t + 3 * beat + k * s16 / 2, 1, -.3 + .08 * k)
            if 'motif' in layers and bi % 2 == 0 and bi >= 2:
                tm = t + beat * .0; ph = theme[(bi // 2) % len(theme)]
                for m, ln in ph: add(L, R, horn(m, ln * beat * 1.15, .95), tm, 1, .1); tm += ln * beat
            t += bar; bi += 1
    layers = set(spec.get('layers', ['pad', 'pulse', 'piano', 'motif']))
    L0, R0 = L.copy(), R.copy()
    if WF < DUR:
        section(False, 0, WF + 2.5)
        LA, RA = L.copy(), R.copy(); L[:] = 0; R[:] = 0
        section(True, WF - 1.5, DUR)
        x = np.clip((T - (WF - 1.0)) / 2.0, 0, 1)   # 2 s crossfade dark -> warm
        L[:] = LA * (1 - x) + L * x; R[:] = RA * (1 - x) + R * x
    else:
        section(False, 0, DUR)
    for t1 in spec.get('risers', []):
        x = riser(spec.get('riser_len', 1.5), 50); add(RL, RR, x, t1 - 1.5, 1, -.15); add(RL, RR, x * .9, t1 - 1.5 + .012, 1, .15)
    for th in spec.get('hits', []): add(L, R, impact() * 1.6, th, 1.0)
elif not NOMUSIC:
    raise SystemExit('style must be none/noir/noirwarm')
# drops (retention drop-outs) on the main bus only; hits after a drop's t1 survive since they start at t1
DG = np.ones(N)
for t0, t1 in spec.get('drops', []):
    a, b = int(t0 * SR), int(t1 * SR); fl = 10 ** (-30 / 20); nf = int(.12 * SR)
    DG[a:b] = fl; DG[a:min(b, a + nf)] = np.linspace(1, fl, min(b, a + nf) - a); r = int(.04 * SR); DG[b:b + r] = np.minimum(DG[b:b + r], np.linspace(fl, 1, len(DG[b:b + r])))
L *= DG; R *= DG
# simple room (early reflections) on music + risers
for BL_, BR_ in ((L, R), (RL, RR)):
    for d_, g in [(.031, .35), (.047, .3), (.071, .25), (.113, .2), (.173, .15), (.241, .1)]:
        k = int(d_ * SR); BL_[k:] += BR_[:-k] * g * .5; BR_[k:] += BL_[:-k] * g * .5
if not NOMUSIC:  # riser loudness: peak ~ 1.3x the bed's typical level
    ref = np.percentile(np.abs(L), 99) + 1e-9; pk = np.percentile(np.abs(RL), 99.9) + 1e-9
    if np.any(RL): RL *= ref * 1.3 / pk; RR *= ref * 1.3 / pk
L += RL; R += RR
FD = spec.get('fade', .3)
fo = int(spec.get('fade_out', 0) * SR)
if fo: L[-fo:] *= np.linspace(1, 0, fo) ** 1.5; R[-fo:] *= np.linspace(1, 0, fo) ** 1.5
fi = int(FD * SR); ramp = np.linspace(0, 1, fi) ** 1.5
L[:fi] *= ramp; R[:fi] *= ramp; L[-fi:] *= ramp[::-1]; R[-fi:] *= ramp[::-1]
# rain ambience
for t0, t1 in spec.get('rain', []):
    n = int((t1 - t0 + .6) * SR); tt = np.arange(n) / SR; x = lp(rng.normal(0, 1, n), 3) - lp(rng.normal(0, 1, n), 40) * .5
    x *= np.minimum(1, tt / .3) * np.minimum(1, (tt[-1] - tt) / .3); add(AL, AR, x, t0 - .3, 1, .2); add(AL, AR, lp(rng.normal(0, 1, n), 3) * np.minimum(1, tt / .3) * np.minimum(1, (tt[-1] - tt) / .3), t0 - .3, 1, -.2)
if 'silence_from' in spec:
    i = int(spec['silence_from'] * SR); L[i:] = 0; R[i:] = 0; SL[i:] = 0; SRr[i:] = 0; AL[i:] = 0; AR[i:] = 0


# ---------------- LEVELS ----------------
fr = int(.05 * SR); nf = N // fr
vr = np.array([np.sqrt(np.mean(V[i * fr:(i + 1) * fr] ** 2)) for i in range(nf)])
act = vr > np.percentile(vr, 60) * .5; vrms = np.sqrt(np.mean(vr[act] ** 2))
# smooth duck envelope (attack ~60 ms, release ~350 ms) per 50 ms frame
de = np.zeros(nf); s_ = 0.0
for i in range(nf):
    tgt = 1.0 if act[i] else 0.0; s_ += (tgt - s_) * (.6 if tgt > s_ else .13); de[i] = s_
venv = np.concatenate([np.repeat(de, fr), np.zeros(N - nf * fr)])
M = np.stack([L, R])
M *= 10 ** (-spec.get('duck_db', 3) * venv / 20)
indrop = np.zeros(nf, bool)
for t0, t1 in spec.get('drops', []): indrop[int(t0 / .05):int(t1 / .05) + 1] = True
cal = act & ~indrop
if 'silence_from' in spec: cal[int(spec['silence_from'] / .05):] = False
def m_vs_v(M_, mask): return 20 * np.log10(np.sqrt(np.mean((M_[:, :nf * fr].reshape(2, -1, fr) ** 2).mean(0)[mask])) + 1e-12) - 20 * np.log10(vrms)
if not NOMUSIC: M *= 10 ** ((MDB - m_vs_v(M, cal)) / 20)   # calibrate: music level measured UNDER the active voice (drops excluded)
A = np.stack([AL, AR]); arms = np.sqrt(np.mean(A[A != 0] ** 2)) if np.any(A) else 1; A *= vrms * 10 ** (RAIN_DB / 20) / (arms + 1e-9)
S = np.stack([SL, SRr])
mix = M + S + A + np.stack([V, V])
print('music vs voice (active, dB):', 'NO MUSIC' if NOMUSIC else round(m_vs_v(M, cal), 1),
      '| music in gaps vs voice (dB):', '-' if NOMUSIC or not np.any(~act) else round(m_vs_v(M, ~act & ~indrop), 1),
      '| SFX peak vs voice peak (dB):', round(20 * np.log10(np.max(np.abs(S)) / vpeak + 1e-12), 1) if np.any(S) else '-')
if '--music-only' in sys.argv:
    mo = sys.argv[sys.argv.index('--music-only') + 1]
    with wave.open(mo, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(M, -1, 1).T * 32767).astype(np.int16).tobytes())
tmp = tempfile.mktemp(suffix='.wav')
mix = mix / max(1, np.max(np.abs(mix)) / .98)
with wave.open(tmp, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix.T * 32767).astype(np.int16).tobytes())
r = subprocess.run(['ffmpeg', '-hide_banner', '-i', tmp, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], capture_output=True, text=True).stderr
js = json.loads(r[r.rindex('{'):r.rindex('}') + 1])
gain = -14 - float(js['input_i']); tmp2 = tempfile.mktemp(suffix='.wav')
for it in range(4):
    ln = f"volume={gain:.2f}dB,alimiter=limit=0.84:attack=3:release=60:level=disabled,aresample=48000"
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', tmp, '-af', ln, tmp2], check=True)
    r = subprocess.run(['ffmpeg', '-hide_banner', '-i', tmp2, '-af', 'ebur128', '-f', 'null', '-'], capture_output=True, text=True).stderr
    I = float(r[r.rindex('I:'):].split()[1]); print(f'loudness pass {it}: {I} LUFS')
    if abs(I + 14) < .3: break
    gain += -14 - I
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', vid, '-i', tmp2, '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'slow', '-crf', '19', '-maxrate', '8000k', '-bufsize', '16000k', '-pix_fmt', 'yuv420p', '-r', '24', '-c:a', 'aac', '-ar', '48000', '-b:a', '192k', '-movflags', '+faststart', outp], check=True)
os.remove(tmp2)
os.remove(tmp); print('OK', outp)
