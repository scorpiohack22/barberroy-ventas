"""Banda sonora universal para las escenas: música por secciones + efectos sincronizados.

Uso: python3 motion/audio.py <escena.events.json> <salida.wav>

El JSON (lo escribe render.js) trae:
  duration, title, events: [{t, type, ...}], music: {
    sections: [{t, dur, style, chords: ['Am','F','C','G'], chordLen: 1.6, vol: 1}],
    stingers: [{t, type, dur?}],      # golpes musicales: impact, boom, riser, whoosh, bells, chime, clock
    duck: [[t0, t1], ...],           # ventanas en que la música se apaga (silencio dramático)
  }
Estilos: tender, sad, build, hope, epic, tension, upbeat, silence.
Efectos (events.type): step, cane, scuff, thud, clatter, whoosh, impact, boom, tick, clock, heartbeat,
  bell, chime, pop, coin, rain, wind, splash, knock, buzz, notify, crowd, crack, snap, rumble, fire,
  door, sparkle, riser, swell, cheer, kiss, bark, slide.
Todo es sintetizado: no hay muestras con derechos de autor.
"""
import json
import sys

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, fftconvolve, sosfilt

SR = 44100
rng = np.random.default_rng(3)

NOTE = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}


def chord(name):
    """'Am' → (raíz grave, [tríada media]); acepta C, Cm, F#, Bb, Bbm, G7, Bdim, Csus."""
    r = NOTE[name[0]]
    i = 1
    if len(name) > 1 and name[1] in '#b':
        r += 1 if name[1] == '#' else -1
        i = 2
    q = name[i:]
    third = 3 if q.startswith('m') and not q.startswith('maj') else 4
    fifth = 6 if 'dim' in q else 7
    if 'sus' in q:
        third = 5
    root = 36 + (r % 12)
    if root < 40:
        root += 12
    mid = 55 + ((r - 7) % 12)  # tríada alrededor de G3–F#4
    tones = [mid, mid + third, mid + fifth]
    if '7' in q:
        tones.append(mid + 10)
    return root, tones


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def lp(x, hz, order=2):
    return sosfilt(butter(order, min(hz, SR / 2 - 100), 'low', fs=SR, output='sos'), x)


def hp(x, hz, order=2):
    return sosfilt(butter(order, hz, 'high', fs=SR, output='sos'), x)


def bp(x, lo, hi):
    return sosfilt(butter(2, [lo, min(hi, SR / 2 - 100)], 'band', fs=SR, output='sos'), x)


def tt(dur):
    return np.arange(int(dur * SR)) / SR


def noise(dur):
    return rng.standard_normal(int(dur * SR))


class Bus:
    def __init__(self, dur):
        self.x = np.zeros((int(dur * SR) + SR * 5, 2))

    def add(self, t, sig, gain=1.0, pan=0.0):
        i = int(t * SR)
        if sig.ndim == 1:
            sig = np.stack([sig * (1 - pan) ** .5, sig * (1 + pan) ** .5], 1) / 2 ** .5
        if i < 0:
            sig, i = sig[-i:], 0
        n = min(len(sig), len(self.x) - i)
        if n > 0:
            self.x[i:i + n] += sig[:n] * gain


# ───────────── instrumentos ─────────────
def piano(note, dur=2.5, vel=1.0):
    f, t = midi(note), tt(dur)
    s = np.zeros_like(t)
    for k in range(1, 8):
        s += np.sin(2 * np.pi * f * k * (1 + 0.0004 * k * k) * t) / k ** 1.3 * np.exp(-t * (1.1 + 0.9 * k) * (f / 440) ** .3)
    s *= np.minimum(1, t / 0.004)
    s += 0.15 * np.sin(2 * np.pi * f * t) * np.exp(-t * 0.6)
    return s * vel * 0.22


def pluck(note, dur=0.6, vel=1.0):
    f, t = midi(note), tt(dur)
    s = sum(np.sin(2 * np.pi * f * k * t) / k ** 1.6 * np.exp(-t * (6 + 4 * k)) for k in range(1, 6))
    return s * np.minimum(1, t / 0.002) * vel * 0.25


def pad(notes, dur, attack=1.0, release=1.5, bright=1.0):
    t = tt(dur)
    s = np.zeros((len(t), 2))
    for n in notes:
        for det, ch in ((-0.004, 0), (0.004, 1), (0.0, 0), (0.0011, 1)):
            f, ph = midi(n) * (1 + det), rng.uniform(0, 6.28)
            s[:, ch] += (np.sin(2 * np.pi * f * t + ph) + 0.35 * bright * np.sin(4 * np.pi * f * t + ph)
                         + 0.12 * bright * np.sin(6 * np.pi * f * t + ph))
    env = np.minimum(1, t / max(attack, .01)) * np.minimum(1, np.maximum(0, (dur - t) / max(release, .01)))
    env *= 1 + 0.06 * np.sin(2 * np.pi * 0.25 * t)
    return s * env[:, None] * 0.03 / max(1, len(notes) ** .5)


def bell(note, dur=3.0, vel=1.0):
    f, t = midi(note), tt(dur)
    s = (np.sin(2 * np.pi * f * t) * np.exp(-t * 1.5) + 0.5 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 3)
         + 0.25 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 6))
    return s * np.minimum(1, t / 0.002) * vel * 0.12


def sub(note, dur, vel=1.0):
    t = tt(dur)
    env = np.minimum(1, t / 0.3) * np.minimum(1, np.maximum(0, (dur - t) / 0.8))
    return np.sin(2 * np.pi * midi(note) * t) * env * vel * 0.12


def kick(vel=1.0):
    t = tt(0.4)
    f = 120 * np.exp(-t * 25) + 48
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.12) * vel * 0.55


def clap(vel=1.0):
    n, t = noise(0.25), tt(0.25)
    env = sum(np.exp(-np.maximum(0, t - d) / 0.012) * (t >= d) for d in (0, .01, .02)) + 0.4 * np.exp(-t / 0.08)
    return bp(n, 900, 5000) * env * vel * 0.18


def hat(vel=1.0):
    t = tt(0.06)
    return hp(noise(0.06), 7000) * np.exp(-t / 0.012) * vel * 0.08


def tom(note=45, vel=1.0):
    t = tt(0.7)
    f = midi(note) * (1 + 0.6 * np.exp(-t * 20))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.25) * vel * 0.4


# ───────────── efectos ─────────────
def env_exp(n, tau):
    return np.exp(-np.arange(n) / SR / tau)


def fx_step(size=1.0):
    n = noise(0.12)
    s = lp(n, 900 + 900 * (1 - size)) * env_exp(len(n), 0.018) * 0.6
    s += np.sin(2 * np.pi * (85 / max(size, .3) ** .4) * tt(0.12)) * env_exp(len(n), 0.03) * 0.5
    return s * (0.5 + 0.5 * size)


def fx_cane():
    t = tt(0.08)
    s = (np.sin(2 * np.pi * 1850 * t) + 0.6 * np.sin(2 * np.pi * 3120 * t)) * np.exp(-t / 0.012)
    return s * 0.35 + bp(noise(0.08), 2000, 6000) * np.exp(-t / 0.006) * 0.3


def fx_clatter():
    out, tt0 = np.zeros(int(0.9 * SR)), 0.0
    for k in range(7):
        t = tt(0.12)
        f = rng.uniform(700, 1500)
        hit = (np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 2.3 * t)) * np.exp(-t / 0.02)
        hit += bp(noise(0.12), 1500, 5000) * np.exp(-t / 0.008) * 0.6
        i = int(tt0 * SR)
        out[i:i + len(hit)] += hit[:len(out) - i] * 0.8 ** k
        tt0 += 0.05 + 0.1 * 0.75 ** k
    return out * 0.5


def fx_thud(vel=1.0):
    t = tt(0.4)
    s = np.sin(2 * np.pi * np.cumsum(70 * np.exp(-t * 4) + 45) / SR) * np.exp(-t / 0.09)
    return (s + lp(noise(0.4), 400) * np.exp(-t / 0.03) * 0.6) * vel * 0.8


def fx_scuff():
    n, t = noise(0.3), tt(0.3)
    return lp(bp(n, 500, 3000), 3500) * np.sin(np.pi * np.minimum(1, t / 0.3)) ** 2 * 0.16


def sweep(n, f0, f1, chunks=24):
    out = np.zeros_like(n)
    for c in range(chunks):
        a, b = c * len(n) // chunks, (c + 1) * len(n) // chunks
        fc = f0 * (f1 / f0) ** (c / chunks)
        out[a:b] = bp(n, fc * .7, fc * 1.3)[a:b]
    return out


def fx_whoosh(dur=0.6, up=True):
    n, t = noise(dur), tt(dur)
    s = sweep(n, 300, 3800) if up else sweep(n, 3800, 300)
    return s * np.sin(np.pi * t / dur) ** 2 * 0.35


def fx_riser(dur=2.0):
    t, n = tt(dur), noise(dur)
    tone = np.sin(2 * np.pi * np.cumsum(220 * 4 ** (t / dur)) / SR) * 0.15
    return (sweep(n, 400, 4800, 40) * 0.25 + tone) * (t / dur) ** 2


def fx_impact():
    t = tt(2.5)
    s = np.sin(2 * np.pi * np.cumsum(60 * np.exp(-t * 2) + 32) / SR) * np.exp(-t / 0.6)
    return s * 0.7 + lp(noise(2.5), 800) * np.exp(-t / 0.15) * 0.25


def fx_boom():
    t = tt(3.5)
    s = np.sin(2 * np.pi * np.cumsum(45 * np.exp(-t * 1.2) + 28) / SR) * np.exp(-t / 1.1)
    return s * 0.9 + lp(noise(3.5), 300) * np.exp(-t / 0.5) * 0.4


def fx_tick():
    t = tt(0.03)
    return np.sin(2 * np.pi * 3200 * t) * np.exp(-t / 0.004) * 0.25


def fx_clock(dur=3.0, accel=True):
    out, t0, gap = np.zeros(int((dur + .1) * SR)), 0.0, 0.5
    k = 0
    while t0 < dur:
        s = fx_tick() * (1 if k % 2 else .7)
        i = int(t0 * SR)
        out[i:i + len(s)] += s[:len(out) - i]
        t0 += gap
        gap = max(0.07, gap * (0.88 if accel else 1))
        k += 1
    return out


def fx_heartbeat():
    out = np.zeros(int(0.6 * SR))
    for dt, v in ((0, 1.0), (0.22, 0.7)):
        t = tt(0.25)
        s = np.sin(2 * np.pi * (55 * np.exp(-t * 6) + 38) * t) * np.exp(-t / 0.06) * v
        i = int(dt * SR)
        out[i:i + len(s)] += s
    return lp(out, 200) * 1.0


def fx_chime():
    out = np.zeros(int(2.5 * SR))
    for i, n in enumerate([88, 91, 95, 100]):
        s = bell(n, 2.0, 0.6)
        j = int(i * 0.07 * SR)
        out[j:j + len(s)] += s
    return out


def fx_sparkle():
    out = np.zeros(int(1.5 * SR))
    for i in range(10):
        s = bell(int(rng.integers(90, 104)), 0.8, rng.uniform(.2, .5))
        j = int(rng.uniform(0, 0.7) * SR)
        out[j:j + len(s)] += s[:len(out) - j]
    return out


def fx_pop():
    t = tt(0.12)
    return np.sin(2 * np.pi * np.cumsum(900 * np.exp(-t * 30) + 300) / SR) * np.exp(-t / 0.025) * 0.4


def fx_coin():
    t = tt(0.6)
    s = np.sin(2 * np.pi * 1975 * t) * (t < 0.08) + np.sin(2 * np.pi * 2637 * t) * (t >= 0.08)
    return s * np.exp(-np.maximum(0, t - 0.08) / 0.15) * np.minimum(1, t / .002) * 0.12


def fx_rain(dur=4.0):
    n, t = noise(dur), tt(dur)
    s = bp(n, 1500, 9000) * 0.12 + lp(n, 500) * 0.08
    drops = np.zeros_like(n)
    for _ in range(int(dur * 40)):
        i = int(rng.uniform(0, dur - .02) * SR)
        drops[i:i + 400] += bp(noise(400 / SR), 2000, 8000)[:len(drops[i:i + 400])] * np.exp(-np.arange(400) / 60) * rng.uniform(.1, .4)
    env = np.minimum(1, t / 0.6) * np.minimum(1, (dur - t) / 0.6)
    return (s + drops * .5) * env


def fx_wind(dur=4.0):
    n, t = noise(dur), tt(dur)
    s = lp(n, 700) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.3 * t + 1)) * 0.4
    return s * np.minimum(1, t / 0.8) * np.minimum(1, (dur - t) / 0.8)


def fx_splash():
    t = tt(0.8)
    th = np.zeros_like(t)
    th[:len(fx_thud(.5))] = fx_thud(.5)[:len(t)]
    return bp(noise(0.8), 400, 6000) * np.exp(-t / 0.18) * 0.5 + th * 0.5


def fx_knock():
    out = np.zeros(int(0.7 * SR))
    for k in range(3):
        t = tt(0.1)
        s = np.sin(2 * np.pi * 180 * t) * np.exp(-t / 0.02) + lp(noise(0.1), 1500) * np.exp(-t / 0.01) * 0.6
        i = int(k * 0.18 * SR)
        out[i:i + len(s)] += s
    return out * 0.6


def fx_buzz(dur=0.8):
    t = tt(dur)
    s = np.sign(np.sin(2 * np.pi * 150 * t)) * 0.3 * lp(np.ones_like(t), 50)
    gate = (np.sin(2 * np.pi * 2.5 * t) > 0).astype(float)
    return lp(s * gate, 900) * 0.25


def fx_notify():
    out = np.zeros(int(0.8 * SR))
    for i, n in enumerate([88, 95]):
        s = bell(n, 0.6, 0.8)
        j = int(i * 0.1 * SR)
        out[j:j + len(s)] += s[:len(out) - j]
    return out


def fx_crowd(dur=3.0):
    n, t = noise(dur), tt(dur)
    s = sum(bp(noise(dur), f, f * 1.6) * (0.5 + 0.5 * np.sin(2 * np.pi * rng.uniform(1.5, 4) * t + rng.uniform(0, 6)))
            for f in (300, 500, 800, 1200))
    return s * np.minimum(1, t / 0.5) * np.minimum(1, (dur - t) / 0.5) * 0.1


def fx_cheer(dur=2.5):
    t = tt(dur)
    s = fx_crowd(dur) * 2.2 + bp(noise(dur), 1500, 6000) * 0.08
    return s * np.minimum(1, t / 0.3)


def fx_crack():
    t = tt(0.5)
    s = hp(noise(0.5), 1500) * np.exp(-t / 0.03) + np.sin(2 * np.pi * 90 * t) * np.exp(-t / 0.08) * 0.6
    return s * 0.5


def fx_snap():
    t = tt(0.3)
    return (hp(noise(0.3), 2500) * np.exp(-t / 0.01) + np.sin(2 * np.pi * 400 * t) * np.exp(-t / 0.03) * 0.3) * 0.6


def fx_rumble(dur=2.0):
    t = tt(dur)
    return lp(noise(dur), 120, 4) * 3 * np.sin(np.pi * t / dur) * 0.5


def fx_fire(dur=3.0):
    n, t = noise(dur), tt(dur)
    s = lp(n, 800) * 0.15
    for _ in range(int(dur * 12)):
        i = int(rng.uniform(0, dur - .01) * SR)
        s[i:i + 200] += hp(noise(200 / SR), 2000)[:len(s[i:i + 200])] * np.exp(-np.arange(200) / 30) * rng.uniform(.2, .6)
    return s * np.minimum(1, t / 0.4) * np.minimum(1, (dur - t) / 0.4)


def fx_door():
    t = tt(1.0)
    f = 300 + 200 * np.sin(2 * np.pi * 0.8 * t)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * bp(noise(1.0), 200, 2000) * 0.25 * np.sin(np.pi * t)


def fx_swell(dur=2.0):
    t = tt(dur)
    s = pad([57, 60, 64, 69, 72], dur, dur * .8, .3, 1.3)
    return s * 2.0


def fx_kiss():
    t = tt(0.15)
    return bp(noise(0.15), 1500, 5000) * np.exp(-t / 0.02) * 0.3


def fx_bark():
    out = np.zeros(int(0.5 * SR))
    for k in range(2):
        t = tt(0.12)
        f = 520 * np.exp(-t * 8) + 250
        s = np.tanh(3 * np.sin(2 * np.pi * np.cumsum(f) / SR)) * np.exp(-t / 0.04)
        s = lp(s + bp(noise(0.12), 600, 2500) * 0.4 * np.exp(-t / 0.03), 3000)
        i = int(k * 0.2 * SR)
        out[i:i + len(s)] += s
    return out * 0.35


def fx_slide(dur=0.5):
    t = tt(dur)
    return np.sin(2 * np.pi * np.cumsum(800 * np.exp(-t * 4) + 200) / SR) * np.exp(-t / (dur / 2)) * 0.15


def fx_bells():
    out = np.zeros(int(3.5 * SR))
    for i, n in enumerate([84, 88, 91, 96]):
        s = bell(n, 3, 0.9)
        j = int(i * 0.09 * SR)
        out[j:j + len(s)] += s[:len(out) - j]
    return out


FX = {
    'step': lambda e: fx_step(e.get('size', 1)), 'cane': lambda e: fx_cane(), 'scuff': lambda e: fx_scuff(),
    'thud': lambda e: fx_thud(e.get('vol', 1)), 'clatter': lambda e: fx_clatter(), 'whoosh': lambda e: fx_whoosh(e.get('dur', .6), e.get('up', True)),
    'impact': lambda e: fx_impact(), 'boom': lambda e: fx_boom(), 'tick': lambda e: fx_tick(),
    'clock': lambda e: fx_clock(e.get('dur', 3), e.get('accel', True)), 'heartbeat': lambda e: fx_heartbeat(),
    'bell': lambda e: bell(e.get('note', 84), 3, 1), 'chime': lambda e: fx_chime(), 'pop': lambda e: fx_pop(),
    'coin': lambda e: fx_coin(), 'rain': lambda e: fx_rain(e.get('dur', 4)), 'wind': lambda e: fx_wind(e.get('dur', 4)),
    'splash': lambda e: fx_splash(), 'knock': lambda e: fx_knock(), 'buzz': lambda e: fx_buzz(e.get('dur', .8)),
    'notify': lambda e: fx_notify(), 'crowd': lambda e: fx_crowd(e.get('dur', 3)), 'crack': lambda e: fx_crack(),
    'snap': lambda e: fx_snap(), 'rumble': lambda e: fx_rumble(e.get('dur', 2)), 'fire': lambda e: fx_fire(e.get('dur', 3)),
    'door': lambda e: fx_door(), 'sparkle': lambda e: fx_sparkle(), 'riser': lambda e: fx_riser(e.get('dur', 2)),
    'swell': lambda e: fx_swell(e.get('dur', 2)), 'cheer': lambda e: fx_cheer(e.get('dur', 2.5)), 'kiss': lambda e: fx_kiss(),
    'bark': lambda e: fx_bark(), 'slide': lambda e: fx_slide(e.get('dur', .5)), 'bells': lambda e: fx_bells(),
}
FX_GAIN = {'step': .16, 'cane': .35, 'thud': .8, 'heartbeat': .8, 'rain': .9, 'wind': .8, 'crowd': 1, 'buzz': .7,
           'riser': .9, 'impact': .9, 'boom': .9, 'tick': 1, 'clock': 1, 'swell': 1}


# ───────────── estilos musicales ─────────────
def arpeggio(bus, t0, ch, length, step_s, vel=1.0, inst=piano, octave=0):
    root, tones = ch
    tones = [n + octave for n in tones]
    pattern = [tones[0], tones[1], tones[2], tones[0] + 12, tones[2], tones[1]]
    i, t = 0, t0
    while t < t0 + length - 0.01:
        bus.add(t, inst(pattern[i % len(pattern)], 2.0, vel * (1 if i % 3 else 1.15)), pan=0.25 * np.sin(i))
        t += step_s
        i += 1


def section(bus, sec):
    style, t0, dur, vol = sec['style'], sec['t'], sec['dur'], sec.get('vol', 1.0)
    names = sec.get('chords', ['Am', 'F', 'C', 'G'])
    L = sec.get('chordLen', 1.6)
    if style == 'silence':
        return
    t, k = t0, 0
    while t < t0 + dur - 0.05:
        p = (t - t0) / dur
        cl = min(L, t0 + dur - t)
        if style == 'build':
            cl = min(max(0.35, L * (1 - 0.6 * p)), t0 + dur - t)
        ch = chord(names[k % len(names)])
        root, tones = ch
        if style == 'tender':
            arpeggio(bus, t, ch, cl, 0.37, 0.8 * vol)
            bus.add(t, piano(root, 3.0, 0.7 * vol))
            bus.add(t, pad([root + 12] + tones, cl + 0.5, 0.5, 0.8), 0.9 * vol)
        elif style == 'sad':
            bus.add(t, piano(root, 3.5, 0.6 * vol))
            for j, n in enumerate([tones[2] + 12, tones[0] + 12, tones[1] + 12][:max(1, int(cl / 0.8))]):
                bus.add(t + 0.15 + j * 0.8, piano(n, 3.0, 0.5 * vol))
            bus.add(t, pad([root + 12] + tones, cl + 0.8, 0.8, 1.0, 0.6), 1.1 * vol)
            bus.add(t, sub(root - 12, cl + 0.3, 0.7 * vol))
        elif style == 'build':
            arpeggio(bus, t, ch, cl, max(0.09, 0.2 - 0.1 * p), (0.6 + 0.5 * p) * vol)
            bus.add(t, pad([root + 12] + tones, cl + 0.4, 0.2, 0.3, 1.2), (0.6 + 1.2 * p) * vol)
            bus.add(t, kick(0.4 + 0.6 * p), vol * p)
        elif style in ('hope', 'epic'):
            arpeggio(bus, t, ch, cl, 0.4 if style == 'hope' else 0.2, 1.1 * vol)
            bus.add(t, pad([root + 12] + tones + [tones[0] + 12], cl + 0.8, 0.6, 1.2, 1.1), 2.4 * vol)
            bus.add(t, sub(root - 12, cl + 0.5, 1.3 * vol))
            bus.add(t + 0.05, piano(tones[(k % 3)] + 24, 3.0, 1.0 * vol), pan=0.1)
            bus.add(t + cl / 2, piano(tones[((k + 1) % 3)] + 24, 3.0, 0.8 * vol), pan=-0.1)
            if style == 'epic':
                for b in np.arange(0, cl - 0.05, 0.4):
                    bus.add(t + b, kick(0.9), vol)
                bus.add(t, tom(40, 1.0), vol)
                bus.add(t + cl * .75, tom(45, 0.7), vol)
        elif style == 'tension':
            bus.add(t, pad([root - 12, root - 11, tones[0] - 12], cl + 0.6, 0.8, 0.8, 0.5), 1.6 * vol)
            bus.add(t, sub(root - 12, cl + 0.3, 1.2 * vol))
            for b in np.arange(0, cl - 0.05, 0.75):
                bus.add(t + b, fx_heartbeat() * 0.5, vol)
            bus.add(t + 0.3, bell(tones[2] + 25, 2.5, 0.25 * vol), pan=0.4)
        elif style == 'upbeat':
            beat = 60 / sec.get('bpm', 112)
            for b in np.arange(0, cl - 0.01, beat):
                i = int(round(b / beat))
                bus.add(t + b, kick(0.9), vol)
                if i % 2 == 1:
                    bus.add(t + b, clap(1.0), vol)
                bus.add(t + b + beat / 2, hat(1.0), vol)
                bus.add(t + b, pluck(root + 12, 0.4, 0.9), vol)
            arpeggio(bus, t, ch, cl, beat / 2, 0.8 * vol, inst=pluck, octave=12)
            bus.add(t, pad([root + 12] + tones, cl + 0.3, 0.1, 0.3, 1.2), 0.9 * vol)
        t += cl
        k += 1


def reverb(x, seconds=2.6, wet=0.32):
    n = int(seconds * SR)
    t = np.arange(n) / SR
    ir = np.stack([lp(rng.standard_normal(n), 5000) * np.exp(-t * 3 / seconds) for _ in range(2)], 1)
    ir[:int(0.012 * SR)] = 0
    ir /= np.abs(ir).sum(0) ** .5 * 6
    y = np.stack([fftconvolve(x[:, c], ir[:, c])[:len(x)] for c in range(2)], 1)
    return x * (1 - wet) + y * wet * 3


def build(events_path, out_path):
    data = json.load(open(events_path))
    dur = data['duration']
    m = data.get('music') or {'sections': [{'t': 0, 'dur': dur, 'style': 'tender'}]}
    music, sfx = Bus(dur), Bus(dur)
    for sec in m.get('sections', []):
        section(music, sec)
    for st in m.get('stingers', []):
        e = dict(st)
        music.add(e['t'], FX[e['type']](e), FX_GAIN.get(e['type'], 1) * e.get('vol', 1))
    for e in data['events']:
        f = FX.get(e['type'])
        if f is None:
            print('aviso: efecto desconocido', e['type'])
            continue
        sfx.add(e['t'], f(e), FX_GAIN.get(e['type'], 1) * e.get('vol', 1), pan=e.get('pan', float(rng.uniform(-.15, .15))))
    tm = np.arange(len(music.x)) / SR
    duck = np.ones_like(tm)
    for a, b in m.get('duck', []):
        d = np.clip((tm - a) / 0.15, 0, 1) * (1 - np.clip((tm - b) / 0.5, 0, 1))
        duck *= 1 - d
    mus = reverb(music.x * duck[:, None], 3.0, 0.36)
    fx = reverb(sfx.x, 1.4, 0.12)
    mix = mus * m.get('musicVol', 1.0) + fx
    n = int(dur * SR)
    mix = mix[:n]
    fade = np.ones(n)
    fo = int(1.2 * SR)
    fade[-fo:] = np.linspace(1, 0, fo) ** 2
    mix *= fade[:, None]
    peak = np.abs(mix).max() or 1
    mix = np.tanh(mix / peak * 1.5) / np.tanh(1.5) * 0.89
    wavfile.write(out_path, SR, (mix * 32767).astype(np.int16))
    print('audio →', out_path)


if __name__ == '__main__':
    build(sys.argv[1], sys.argv[2])
