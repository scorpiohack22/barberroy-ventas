"""Banda sonora de "Una vida en scroll" (60 s), sintetizada con numpy.

Piano, cuerdas, caja de música, tic-tac de reloj y sonidos de notificación
sincronizados con las escenas de escenas.js. Uso: python3 musica.py -> musica.wav
"""
import wave
from pathlib import Path

import numpy as np

SR = 44100
N = int(SR * 60)
L = np.zeros(N)
R = np.zeros(N)
rs = np.random.default_rng(12)


def hz(n):
    t = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}[n[0]]
    r = n[1:]
    if r[0] in '#b':
        t += 1 if r[0] == '#' else -1
        r = r[1:]
    return 440 * 2 ** ((t + 12 * (int(r) + 1) - 69) / 12)


def tt(d):
    return np.arange(int(SR * d)) / SR


def poner(t0, s, g=1.0, pan=0.0):
    i = int(t0 * SR)
    if i >= N or len(s) == 0:
        return
    s = s[: N - i] * g
    L[i:i + len(s)] += s * np.sqrt(0.5 * (1 - pan))
    R[i:i + len(s)] += s * np.sqrt(0.5 * (1 + pan))


def env(s, a=0.005, r=0.05):
    n = len(s)
    e = np.ones(n)
    na, nr = min(n, int(a * SR)), min(n, int(r * SR))
    if na:
        e[:na] = np.linspace(0, 1, na)
    if nr:
        e[-nr:] *= np.linspace(1, 0, nr)
    return s * e


def filtro(s, lo=0, hi=SR / 2):
    f = np.fft.rfftfreq(len(s), 1 / SR)
    S = np.fft.rfft(s)
    S[(f < lo) | (f > hi)] = 0
    return np.fft.irfft(S, len(s))


def piano(f, d=2.0):
    t = tt(d)
    s = sum((1 / k ** 1.3) * np.sin(2 * np.pi * k * f * t * (1 + 0.0003 * k)) * np.exp(-t * (1.2 + 1.3 * k)) for k in range(1, 8))
    return env(s, 0.003, 0.1)


def cuerdas(fs, d, brillo=5):
    t = tt(d)
    s = np.zeros(len(t))
    for f in fs:
        for det in (-0.003, 0.0, 0.004):
            vib = 1 + 0.003 * np.sin(2 * np.pi * 5 * t + det * 900)
            ph = 2 * np.pi * np.cumsum(f * (1 + det) * vib) / SR
            s += sum(((-1) ** k) / k * np.sin(k * ph) for k in range(1, brillo + 1))
    s /= len(fs) * 3
    return env(s, min(0.8, d / 3), min(1.0, d / 3))


def caja_musica(f, d=1.8):
    t = tt(d)
    s = np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * 4 * f * t) * np.exp(-t * 9) + 0.12 * np.sin(2 * np.pi * 6.3 * f * t) * np.exp(-t * 13)
    return env(s * np.exp(-t * 2.2), 0.001, 0.1)


def tic(f=2500):
    t = tt(0.04)
    return np.sin(2 * np.pi * f * t) * np.exp(-t * 160) + 0.3 * filtro(rs.standard_normal(len(t)), 2000, 8000) * np.exp(-t * 200)


def notificacion(f):
    t = tt(0.25)
    s = np.sin(2 * np.pi * f * t) * np.exp(-t * 18) + 0.5 * np.sin(2 * np.pi * f * 1.5 * t) * np.exp(-t * 22)
    return env(s, 0.002, 0.03)


def pitido(f, d):
    t = tt(d)
    return env(np.sign(np.sin(2 * np.pi * f * t)) * 0.4 + np.sin(2 * np.pi * f * t) * 0.6, 0.005, 0.01)


def hash_(n):
    x = np.sin(n * 127.1 + 311.7) * 43758.5453
    return x - np.floor(x)


# ---------- 0–5 s: amanecer y despertador ----------
poner(0.0, cuerdas([hz('C3'), hz('G3'), hz('E4')], 5.2, 3), 0.12)
for k in range(8):
    poner(0.55 + k * 0.14, pitido(1760 if k % 2 == 0 else 1320, 0.09), 0.05)
for k, n in enumerate(['C5', 'E5', 'G5', 'C6', 'G5', 'E5']):
    poner(1.8 + k * 0.5, piano(hz(n), 1.6), 0.14, 0.1)

# ---------- 5–18 s: la rutina (tic-tac y piano mecánico) ----------
for k in range(int(13 / 0.5)):
    poner(5.0 + k * 0.5, tic(2600 if k % 2 else 2100), 0.12, 0.3 if k % 2 else -0.3)
motivo = ['A4', 'C5', 'E5', 'C5', 'A4', 'C5', 'E5', 'D5', 'G4', 'B4', 'D5', 'B4', 'G4', 'B4', 'D5', 'C5']
for k in range(26):
    poner(5.0 + k * 0.5, piano(hz(motivo[k % 16]), 1.2), 0.1, -0.1)
for k, ch in enumerate([['A2', 'E3', 'C4'], ['F2', 'C3', 'A3'], ['G2', 'D3', 'B3'], ['E2', 'B2', 'G3']]):
    poner(5.0 + k * 3.25, cuerdas([hz(n) for n in ch], 3.4, 4), 0.1)
# el reloj de la oficina acelera (14–18 s)
t = 14.0
paso = 0.5
while t < 18.0:
    poner(t, tic(3000), 0.1, 0.5)
    paso = max(0.06, paso * 0.88)
    t += paso

# ---------- 18–26 s: cumpleaños y parque (caja de música dulce) ----------
alegre = ['G5', 'G5', 'A5', 'G5', 'C6', 'B5', 'G5', 'G5', 'A5', 'G5', 'D6', 'C6']
for k, n in enumerate(alegre):
    poner(18.1 + k * 0.33, caja_musica(hz(n)), 0.16, 0.2 * (k % 3 - 1))
poner(18.0, cuerdas([hz('C3'), hz('E3'), hz('G3')], 4.2, 4), 0.1)
poner(22.0, cuerdas([hz('A2'), hz('E3'), hz('C4')], 4.2, 4), 0.11)
for k, n in enumerate(['E5', 'D5', 'C5', 'A4', 'G4', 'A4']):
    poner(22.2 + k * 0.62, piano(hz(n), 2.0), 0.13)

# ---------- 26–42 s: las estaciones (vals que crece) ----------
acordes = [('A2', ['A3', 'C4', 'E4']), ('F2', ['F3', 'A3', 'C4']), ('C3', ['C4', 'E4', 'G4']), ('G2', ['G3', 'B3', 'D4'])]
beat = 16 / 24  # 24 tiempos de vals
for k in range(24):
    tb = 26 + k * beat
    bajo, ch = acordes[(k // 3) % 4]
    if k % 3 == 0:
        poner(tb, piano(hz(bajo), 1.8), 0.16, -0.2)
    else:
        for n in ch:
            poner(tb, piano(hz(n), 0.8), 0.05, 0.15)
melodia = ['E5', 'A5', 'C6', 'B5', 'A5', 'E5', 'F5', 'A5', 'C6', 'A5', 'G5', 'E5', 'E5', 'G5', 'C6', 'B5', 'G5', 'D5', 'D5', 'G5', 'B5', 'A5', 'G5', 'E5']
for k, n in enumerate(melodia):
    poner(26 + k * beat, caja_musica(hz(n), 1.4), 0.12 + 0.004 * k)
for i in range(4):
    poner(26 + i * 4, cuerdas([hz(n) for n in acordes[i][1]], 4.3, 5), 0.08 + i * 0.03)
for k in range(32):
    poner(26 + k * 0.5, tic(2300), 0.05)

# ---------- 42–46 s: la boda (luminoso pero agridulce) ----------
poner(42.0, cuerdas([hz('F3'), hz('A3'), hz('C4'), hz('E4')], 4.3, 6), 0.2)
for k, n in enumerate(['C5', 'F5', 'A5', 'C6', 'A5', 'F5', 'E5', 'C5']):
    poner(42.1 + k * 0.48, piano(hz(n), 2.0), 0.15)
for k in range(10):
    poner(42.2 + k * 0.36, caja_musica(hz('C6') * 2 ** ((k % 5) * 2 / 12), 0.8), 0.06, 0.3 * (k % 3 - 1))

# ---------- 46–49 s: batería baja y apagado ----------
poner(46.0, cuerdas([hz('A2'), hz('E3')], 2.8, 3), 0.12)
for k in range(5):
    poner(46.3 + k * 0.45, pitido(880, 0.07), 0.05)
ta = tt(0.6)
poner(48.6, env(np.sin(2 * np.pi * np.cumsum(900 * np.exp(-ta * 5) + 60) / SR) * np.exp(-ta * 3), 0.003, 0.05), 0.18)

# ---------- 49–56 s: solo, piano triste ----------
triste = [('E5', 0.9), ('D5', 0.9), ('C5', 0.9), ('B4', 1.4), ('A4', 0.9), ('C5', 0.9), ('E5', 1.6)]
t = 49.6
for n, d in triste:
    poner(t, piano(hz(n), 3.0), 0.17, 0.05)
    poner(t, piano(hz(n) / 2, 3.0), 0.06)
    t += d
poner(49.5, cuerdas([hz('A2'), hz('E3'), hz('C4')], 6.5, 3), 0.13)

# ---------- 56–60 s: el dibujo ----------
for k, n in enumerate(['A5', 'C6', 'E6', 'A6']):
    poner(56.2 + k * 0.45, caja_musica(hz(n), 2.2), 0.15 * (1 - k * 0.12))
poner(56.0, cuerdas([hz('F3'), hz('A3'), hz('C4'), hz('E4')], 4.0, 3), 0.12)

# ---------- notificaciones sincronizadas con los iconos ----------
ventanas = [(2.7, 5, 1), (5, 10, 2), (10, 14, 3), (14, 18, 4), (18, 22, 5), (22, 26, 6), (26, 30, 10), (30, 34, 11), (34, 38, 12), (38, 42, 13), (42, 46, 20), (46, 48, 30)]
for t0, t1, seed in ventanas:
    k = 0
    while True:
        ts = t0 + k * 0.7 + hash_(seed + k) * 0.2
        if ts > t1:
            break
        poner(ts, notificacion(1568 if hash_(seed + k * 3) < 0.5 else 2093), 0.045, 0.4)
        k += 1


# ---------- reverb sencilla, mezcla y exportación ----------
def eco(x, taps):
    y = x.copy()
    for d, g in taps:
        n = int(d * SR)
        y[n:] += x[:-n] * g
    return y


L2 = eco(L, [(0.031, 0.25), (0.053, 0.2), (0.089, 0.15), (0.149, 0.1), (0.27, 0.07), (0.41, 0.05)])
R2 = eco(R, [(0.037, 0.25), (0.061, 0.2), (0.097, 0.15), (0.163, 0.1), (0.29, 0.07), (0.43, 0.05)])
mix = np.stack([L2, R2], axis=1)
mix = np.tanh(mix / np.max(np.abs(mix)) * 1.2)
mix *= 0.89 / np.max(np.abs(mix))
fin = np.linspace(1, 0, int(0.8 * SR))
mix[-len(fin):] *= fin[:, None]
with wave.open(str(Path(__file__).with_name('musica.wav')), 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix * 32767).astype('<i2').tobytes())
print('listo')
