"""Banda sonora de "El Ciclo": música + efectos, todo sintetizado con código.

Uso: python3 motion/ciclo_audio.py motion/ciclo.events.json motion/ciclo.wav
Los tiempos salen del JSON que exporta render.js (pasos, bastón, guion).
"""
import json
import sys

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, fftconvolve, sosfilt

SR = 44100
rng = np.random.default_rng(3)


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def lp(x, hz, order=2):
    return sosfilt(butter(order, hz, 'low', fs=SR, output='sos'), x)


def bp(x, lo, hi):
    return sosfilt(butter(2, [lo, hi], 'band', fs=SR, output='sos'), x)


class Bus:
    def __init__(self, dur):
        self.x = np.zeros((int(dur * SR) + SR * 4, 2))

    def add(self, t, sig, gain=1.0, pan=0.0):
        i = int(t * SR)
        if sig.ndim == 1:
            sig = np.stack([sig * (1 - pan) ** .5, sig * (1 + pan) ** .5], 1) / 2 ** .5
        n = min(len(sig), len(self.x) - i)
        if n > 0 and i >= 0:
            self.x[i:i + n] += sig[:n] * gain


# ---------------- instrumentos ----------------
def piano(note, dur=2.5, vel=1.0):
    f = midi(note)
    t = np.arange(int(dur * SR)) / SR
    s = np.zeros_like(t)
    for k in range(1, 8):
        fk = f * k * (1 + 0.0004 * k * k)  # leve inarmonicidad
        s += np.sin(2 * np.pi * fk * t) / k ** 1.3 * np.exp(-t * (1.1 + 0.9 * k) * (f / 440) ** .3)
    s *= np.minimum(1, t / 0.004)
    s += 0.15 * np.sin(2 * np.pi * f * t) * np.exp(-t * 0.6)  # cuerpo
    return s * vel * 0.22


def pad(notes, dur, attack=1.0, release=1.5, bright=1.0):
    t = np.arange(int(dur * SR)) / SR
    s = np.zeros((len(t), 2))
    for n in notes:
        for det, ch in ((-0.004, 0), (0.004, 1), (0.0, 0), (0.0011, 1)):
            f = midi(n) * (1 + det)
            ph = rng.uniform(0, 6.28)
            v = (np.sin(2 * np.pi * f * t + ph) + 0.35 * bright * np.sin(4 * np.pi * f * t + ph)
                 + 0.12 * bright * np.sin(6 * np.pi * f * t + ph))
            s[:, ch] += v
    env = np.minimum(1, t / attack) * np.minimum(1, np.maximum(0, (dur - t) / release))
    env *= 1 + 0.06 * np.sin(2 * np.pi * 0.25 * t)
    return s * env[:, None] * 0.03 / max(1, len(notes) ** .5)


def bell(note, dur=3.0, vel=1.0):
    f = midi(note)
    t = np.arange(int(dur * SR)) / SR
    s = (np.sin(2 * np.pi * f * t) * np.exp(-t * 1.5) + 0.5 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 3)
         + 0.25 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 6))
    return s * np.minimum(1, t / 0.002) * vel * 0.12


def sub(note, dur, vel=1.0):
    t = np.arange(int(dur * SR)) / SR
    env = np.minimum(1, t / 0.3) * np.minimum(1, np.maximum(0, (dur - t) / 0.8))
    return np.sin(2 * np.pi * midi(note) * t) * env * vel * 0.12


# ---------------- efectos ----------------
def noise(dur):
    return rng.standard_normal(int(dur * SR))


def env_exp(n, tau):
    return np.exp(-np.arange(n) / SR / tau)


def step(size=1.0):
    n = noise(0.12)
    s = lp(n, 900 + 900 * (1 - size)) * env_exp(len(n), 0.018) * 0.6
    t = np.arange(len(n)) / SR
    s += np.sin(2 * np.pi * (85 / size ** .4) * t) * env_exp(len(n), 0.03) * 0.5
    return s * (0.5 + 0.5 * size)


def cane_tap():
    t = np.arange(int(0.08 * SR)) / SR
    s = (np.sin(2 * np.pi * 1850 * t) + 0.6 * np.sin(2 * np.pi * 3120 * t)) * np.exp(-t / 0.012)
    return s * 0.35 + bp(noise(0.08), 2000, 6000) * np.exp(-t / 0.006) * 0.3


def clatter():
    out = np.zeros(int(0.9 * SR))
    tt = 0.0
    for k in range(7):
        t = np.arange(int(0.12 * SR)) / SR
        f = rng.uniform(700, 1500)
        hit = (np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 2.3 * t)) * np.exp(-t / 0.02)
        hit += bp(noise(0.12), 1500, 5000) * np.exp(-t / 0.008) * 0.6
        i = int(tt * SR)
        out[i:i + len(hit)] += hit[:len(out) - i] * 0.8 ** k
        tt += 0.05 + 0.1 * 0.75 ** k
    return out * 0.5


def thud(vel=1.0):
    t = np.arange(int(0.4 * SR)) / SR
    f = 70 * np.exp(-t * 4) + 45
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.09)
    return (s + lp(noise(0.4), 400) * np.exp(-t / 0.03) * 0.6) * vel * 0.8


def scuff():
    n = noise(0.3)
    t = np.arange(len(n)) / SR
    return lp(bp(n, 500, 3000), 3500) * np.sin(np.pi * np.minimum(1, t / 0.3)) ** 2 * 0.16


def whoosh(dur=0.7, up=True):
    n = noise(dur)
    t = np.arange(len(n)) / SR
    out = np.zeros_like(n)
    chunks = 24
    for c in range(chunks):  # barrido de filtro por bloques
        a, b = c * len(n) // chunks, (c + 1) * len(n) // chunks
        p = c / chunks if up else 1 - c / chunks
        fc = 300 + 3500 * p
        out[a:b] = bp(n, fc * .7, fc * 1.3)[a:b]
    return out * np.sin(np.pi * t / dur) ** 2 * 0.35


def riser(dur):
    t = np.arange(int(dur * SR)) / SR
    n = noise(dur)
    out = np.zeros_like(n)
    chunks = 40
    for c in range(chunks):
        a, b = c * len(n) // chunks, (c + 1) * len(n) // chunks
        fc = 400 * 12 ** (c / chunks)
        out[a:b] = bp(n, fc * .8, fc * 1.25)[a:b]
    tone = np.sin(2 * np.pi * np.cumsum(220 * 4 ** (t / dur)) / SR) * 0.15
    return (out * 0.25 + tone) * (t / dur) ** 2


def tick():
    t = np.arange(int(0.03 * SR)) / SR
    return np.sin(2 * np.pi * 3200 * t) * np.exp(-t / 0.004) * 0.25


def heartbeat():
    out = np.zeros(int(0.6 * SR))
    for dt, v in ((0, 1.0), (0.22, 0.7)):
        t = np.arange(int(0.25 * SR)) / SR
        s = np.sin(2 * np.pi * (55 * np.exp(-t * 6) + 38) * t) * np.exp(-t / 0.06) * v
        i = int(dt * SR)
        out[i:i + len(s)] += s
    return lp(out, 200) * 1.3


def impact():
    t = np.arange(int(2.5 * SR)) / SR
    s = np.sin(2 * np.pi * np.cumsum(60 * np.exp(-t * 2) + 32) / SR) * np.exp(-t / 0.6)
    return s * 0.7 + lp(noise(2.5), 800) * np.exp(-t / 0.15) * 0.25


def reverb(x, seconds=2.6, wet=0.32):
    n = int(seconds * SR)
    t = np.arange(n) / SR
    ir = np.stack([lp(rng.standard_normal(n), 5000) * np.exp(-t * 3 / seconds) for _ in range(2)], 1)
    ir[:int(0.012 * SR)] = 0
    ir /= np.abs(ir).sum(0) ** .5 * 6
    y = np.stack([fftconvolve(x[:, c], ir[:, c])[:len(x)] for c in range(2)], 1)
    return x * (1 - wet) + y * wet * 3


# ---------------- composición ----------------
AM, F, C, G = (45, [57, 60, 64]), (41, [53, 57, 60]), (48, [55, 60, 64]), (43, [55, 59, 62])


def arpeggio(bus, t0, chord, length, step_s, vel=1.0, up=12):
    root, tones = chord
    pattern = [tones[0], tones[1], tones[2], tones[0] + up, tones[2], tones[1]]
    i, t = 0, t0
    while t < t0 + length - 0.01:
        bus.add(t, piano(pattern[i % len(pattern)], 2.0, vel * (1 if i % 3 else 1.15)), pan=0.25 * np.sin(i))
        t += step_s
        i += 1
    bus.add(t0, piano(root, 3.0, vel * 0.9))


def build(events_path, out_path):
    data = json.load(open(events_path))
    cue, dur = data['cue'], data['duration']
    music, sfx = Bus(dur), Bus(dur)

    # A — infancia: arpegio tierno (Am F C G)
    t = 0.3
    for ch in (AM, F, C, G):
        arpeggio(music, t, ch, 1.1, 0.37, 0.8)
        music.add(t, pad([ch[0] + 12] + ch[1], 1.6, 0.5, 0.8))
        t += 1.1
    # B — el tiempo pasa: se acelera
    t = cue['timeStart']
    seq, k = [AM, F, C, G, AM, F, C, G], 0
    while t < cue['timeEnd'] - 0.05:
        p = (t - cue['timeStart']) / (cue['timeEnd'] - cue['timeStart'])
        L = 0.62 - 0.22 * p
        arpeggio(music, t, seq[k % 8], L, max(0.09, 0.18 - 0.08 * p), 0.6 + 0.4 * p)
        music.add(t, pad([seq[k % 8][0] + 12] + seq[k % 8][1], L + 0.4, 0.2, 0.3, 1.2), gain=0.6 + p)
        t += L
        k += 1
    music.add(cue['timeStart'] - 0.6, whoosh(1.0), 1.0)
    sfx.add(cue['timeStart'] + 0.2, riser(cue['timeEnd'] - cue['timeStart'] - 0.2), 0.9)
    tt, gap = cue['timeStart'], 0.5
    while tt < cue['timeEnd'] - 0.05:  # reloj que se acelera
        sfx.add(tt, tick(), 1.0, pan=-0.3)
        tt += gap
        gap = max(0.07, gap * 0.88)
    sfx.add(cue['timeEnd'], impact(), 0.9)
    # C — vejez: lento y melancólico
    t = cue['timeEnd']
    music.add(t, pad([57, 60, 64, 69], cue['oldTrip'] - t + 0.3, 1.2, 0.3, 0.6), 1.3)
    music.add(t, sub(33, cue['oldTrip'] - t + 0.2))
    for i, n in enumerate([76, 72, 69, 71, 72]):
        music.add(t + 0.25 + i * 0.42, piano(n, 2.5, 0.55))
    # silencio + latidos en el tropiezo
    for i, hb in enumerate([cue['caneHit'], cue['caneHit'] + 0.75, cue['caneHit'] + 1.45]):
        sfx.add(hb, heartbeat(), 0.75 - 0.2 * i)
    # D — él lo sostiene: la emoción (F C G C), melodía y campanitas
    t0 = cue['steady'] - 0.2
    prog_ = [(F, 1.6), (C, 1.6), (G, 1.6), (C, 3.5)]
    t = t0
    for ch, L in prog_:
        arpeggio(music, t, ch, min(L, 1.6), 0.4, 1.15)
        music.add(t, pad([ch[0] + 12] + ch[1] + [ch[1][0] + 12], L + 0.8, 0.6, 1.2, 1.1), 2.6)
        music.add(t, sub(ch[0] - 12, L + 0.5, 1.4))
        t += L
    for tm, n, d in [(0.0, 84, 1), (0.8, 81, 1), (1.6, 79, 1), (2.4, 88, 1), (3.2, 86, 1), (3.6, 83, 1), (4.0, 79, 1), (4.8, 84, 4)]:
        music.add(t0 + tm, piano(n, 3.0 * d, 1.3), pan=0.1)
    for i, n in enumerate([96, 100, 103]):
        music.add(cue['grab'] + i * 0.09, bell(n, 3, 0.9), pan=0.3)
    for i, n in enumerate([91, 95, 98, 103]):
        music.add(cue['newKid'] + 0.15 + i * 0.3, bell(n, 2, 0.4), pan=-0.3)
    music.add(dur - 3.6, bell(84, 4, 0.7))

    # efectos sincronizados con la animación
    for e in data['events']:
        ty = e['type']
        if ty == 'step':
            sfx.add(e['t'], step(e['size']), 0.16 * e['vol'], pan=rng.uniform(-.2, .2))
        elif ty == 'cane':
            sfx.add(e['t'], cane_tap(), 0.35 * e['vol'], pan=0.2)
        elif ty == 'scuff':
            sfx.add(e['t'], scuff(), e['vol'])
        elif ty == 'thud':
            sfx.add(e['t'], thud(e['vol']), 0.8)
        elif ty == 'clatter':
            sfx.add(e['t'], clatter(), e['vol'], pan=0.35)
        elif ty == 'whoosh':
            sfx.add(e['t'] - 0.25, whoosh(0.6), e['vol'])

    # ducking: la música se apaga en el tropiezo del padre y vuelve después
    tm = np.arange(len(music.x)) / SR
    duck = 1 - np.clip((tm - cue['oldTrip']) / 0.15, 0, 1) * (1 - np.clip((tm - (cue['steady'] - 0.4)) / 0.5, 0, 1))
    m = reverb(music.x * duck[:, None], 3.0, 0.38)
    s = reverb(sfx.x, 1.4, 0.12)
    mix = m * 1.0 + s * 1.0
    n = int(dur * SR)
    mix = mix[:n]
    fade = np.ones(n)
    fo = int(1.4 * SR)
    fade[-fo:] = np.linspace(1, 0, fo) ** 2
    fade[:int(0.05 * SR)] = np.linspace(0, 1, int(0.05 * SR))
    mix *= fade[:, None]
    mix = np.tanh(mix / np.abs(mix).max() * 1.4) / np.tanh(1.4) * 0.89  # limitador suave
    wavfile.write(out_path, SR, (mix * 32767).astype(np.int16))
    print('audio →', out_path)


if __name__ == '__main__':
    build(*(sys.argv[1:3] if len(sys.argv) > 2 else ('motion/ciclo.events.json', 'motion/ciclo.wav')))
