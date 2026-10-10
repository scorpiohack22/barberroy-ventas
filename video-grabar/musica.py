"""Banda sonora de "Grabar en vez de ayudar" (60 s), sintetizada con numpy.

Mañana tranquila, el golpe de la caída, el zumbido frío de los móviles, la caja de música de la niña,
el ritmo del scroll nocturno, el piano solo de la cocina y el silencio final. Uso: python3 musica.py -> musica.wav
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



def pajaro(f):
    t = tt(0.18)
    s = np.sin(2 * np.pi * np.cumsum(f * (1 + 0.25 * np.sin(2 * np.pi * 18 * t))) / SR) * np.exp(-t * 14)
    return env(s, 0.004, 0.03)


def golpe():
    t = tt(0.5)
    return np.sin(2 * np.pi * 55 * t * (1 - t * 0.6)) * np.exp(-t * 9) + 0.5 * filtro(rs.standard_normal(len(t)), 60, 900) * np.exp(-t * 20)


def obturador():
    t = tt(0.07)
    return filtro(rs.standard_normal(len(t)), 1500, 9000) * np.exp(-t * 90) * 0.8


def bombo():
    t = tt(0.3)
    return np.sin(2 * np.pi * np.cumsum(120 * np.exp(-t * 18) + 45) / SR) * np.exp(-t * 10)


def palmada():
    t = tt(0.12)
    return filtro(rs.standard_normal(len(t)), 900, 7000) * np.exp(-t * 40)


def silbido(t0, d, f0, f1):
    t = tt(d)
    s = filtro(rs.standard_normal(len(t)), 300, 6000) * np.sin(np.pi * t / d) ** 2
    poner(t0, s, 0.12)


CAIDA = 15.0
# ---------- 0–12 s: mañana tranquila (pájaros, piano ligero, pizzicato de paseo) ----------
for k in range(14):
    poner(0.4 + k * 0.83 + hash_(k) * 0.3, pajaro(2600 + hash_(k * 3) * 1400), 0.05, hash_(k * 7) * 1.4 - 0.7)
paseo = ['C5', 'E5', 'G5', 'E5', 'F5', 'A5', 'G5', 'E5', 'D5', 'F5', 'E5', 'C5']
for k in range(24):
    poner(0.8 + k * 0.6, caja_musica(hz(paseo[k % 12]) / 2, 0.6), 0.11, 0.1 * (k % 2 * 2 - 1))
for k, ch in enumerate([['C3', 'G3', 'E4'], ['F2', 'C3', 'A3'], ['G2', 'D3', 'B3'], ['C3', 'G3', 'E4']]):
    poner(0.6 + k * 3.6, cuerdas([hz(n) for n in ch], 3.8, 3), 0.08)
for k in range(12, 25):
    t0 = 12.0 + (k - 12) * 0.5
    if t0 < CAIDA: poner(t0, piano(hz(paseo[k % 12]), 0.9), 0.1)
# ---------- 15 s: la caída; la música se corta ----------
poner(CAIDA + 0.32, golpe(), 0.5)
for i in range(5):
    poner(CAIDA + 0.5 + i * 0.28, tic(900 + i * 120), 0.06, 0.4 - i * 0.2)  # naranjas rodando
# ---------- 16–27 s: todos graban (zumbido frío, obturadores, notificaciones) ----------
t = tt(11.0)
dron = (np.sin(2 * np.pi * 55 * t) + 0.5 * np.sin(2 * np.pi * 82.4 * t) + 0.3 * np.sin(2 * np.pi * 116.5 * t * (1 + 0.002 * np.sin(t)))) * np.minimum(1, t / 3)
poner(16.0, env(dron, 0.5, 1.5), 0.12)
for k, t0 in enumerate([16.4, 17.1, 17.6, 18.3, 20.8, 21.3, 21.9, 22.4, 23.1, 23.8, 24.5]):
    poner(t0 + 0.4, obturador(), 0.3, hash_(k) * 1.6 - 0.8)
k = 0
t0 = 16.5
while t0 < 27.0:
    poner(t0, notificacion(1568 if hash_(k) < 0.5 else 2093), 0.04, hash_(k * 3) * 1.6 - 0.8)
    t0 += 0.55 - min(0.35, (t0 - 16) * 0.03) + hash_(k * 5) * 0.1
    k += 1
for k, n in enumerate(['E4', 'D4', 'C4', 'B3', 'A3']):
    poner(20.5 + k * 1.3, piano(hz(n), 2.4), 0.09, -0.2)
# ---------- 27–36 s: la niña (caja de música cálida que crece) ----------
nina = ['G5', 'A5', 'B5', 'D6', 'B5', 'A5', 'G5', 'E5', 'G5', 'A5', 'B5', 'G6', 'D6', 'B5', 'A5', 'G5']
for k, n in enumerate(nina):
    poner(27.2 + k * 0.42, caja_musica(hz(n), 1.6), 0.13 + 0.004 * k, 0.15 * (k % 3 - 1))
poner(27.0, cuerdas([hz('G2'), hz('D3'), hz('B3')], 3.2, 4), 0.1)
poner(30.2, cuerdas([hz('C3'), hz('G3'), hz('E4')], 3.0, 5), 0.13)
poner(33.0, cuerdas([hz('G2'), hz('D3'), hz('B3'), hz('G4')], 3.2, 6), 0.2)
for k, n in enumerate(['B4', 'D5', 'G5', 'B5', 'D6']):
    poner(33.0 + k * 0.12, piano(hz(n), 2.4), 0.12)
for k in range(24):
    poner(33.1 + k * 0.12 + hash_(k) * 0.05, obturador(), 0.22, hash_(k * 9) * 1.6 - 0.8)  # flashes
# ---------- 36–44 s: el scroll nocturno (ritmo lo-fi) ----------
for k in range(16):
    tb = 36.0 + k * 0.5
    poner(tb, bombo(), 0.32 if k % 2 == 0 else 0.0)
    if k % 2 == 1: poner(tb, palmada(), 0.12)
    poner(tb + 0.25, tic(5000), 0.035)
for k, ch in enumerate([['A2', 'E3', 'C4'], ['F2', 'C3', 'A3'], ['C3', 'G3', 'E4'], ['G2', 'D3', 'B3']]):
    poner(36.0 + k * 2, cuerdas([hz(n) for n in ch], 2.1, 3), 0.08)
poner(40.45, notificacion(2637), 0.12)  # doble toque: me gusta
silbido(41.9, 0.6, 400, 4000)            # desliza al siguiente vídeo
for k, n in enumerate(['E5', 'G5', 'A5', 'C6', 'A5', 'G5', 'E5', 'G5']):
    poner(42.5 + k * 0.2, caja_musica(hz(n), 0.4), 0.08)
# ---------- 44–52 s: solo en la cocina (piano triste) ----------
triste = [('A4', 1.0), ('C5', 1.0), ('B4', 1.0), ('E4', 1.6), ('A4', 1.0), ('G4', 1.0), ('F4', 1.8)]
t0 = 44.3
for n, d in triste:
    poner(t0, piano(hz(n), 3.0), 0.17)
    poner(t0, piano(hz(n) / 2, 3.0), 0.06)
    t0 += d
poner(44.0, cuerdas([hz('A2'), hz('E3'), hz('C4')], 8.2, 3), 0.11)
# ---------- 52–60 s: era tu móvil (latido y silencio) ----------
t = tt(5.5)
poner(52.0, env(np.sin(2 * np.pi * 41.2 * t) + 0.4 * np.sin(2 * np.pi * 61.7 * t), 1.5, 0.05), 0.15)
for k in range(5):
    poner(52.4 + k * 1.0, bombo(), 0.22); poner(52.62 + k * 1.0, bombo(), 0.14)
poner(58.2, piano(hz('A4'), 3.0), 0.12)
poner(58.2, piano(hz('E5'), 3.0), 0.07)

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
