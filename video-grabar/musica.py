"""Banda sonora de "Grabar en vez de ayudar" (60 s): balada triste de piano y cuerdas, sintetizada con numpy.

Un mismo tema en La menor (Am–F–C–G) recorre todo el corto: suave al principio, se corta en seco con la caída,
frío y vacío mientras todos graban, crece con cuerdas cuando la niña le da la mano, suena "por el altavoz del
móvil" de noche, vuelve en piano solo en la cocina y termina en silencio cuando se apaga la pantalla.
Reverb por convolución (respuesta de sala sintética). Uso: python3 musica.py -> musica.wav
"""
import wave
from pathlib import Path

import numpy as np

SR = 44100
DUR = 60.0
N = int(SR * DUR)
rs = np.random.default_rng(7)
MUS = np.zeros((N, 2))   # música (pasa por la reverb y los cortes)
FX = np.zeros((N, 2))    # efectos de sonido
FIN = np.zeros((N, 2))   # la nota final, tras el silencio


def hz(n):
    t = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}[n[0]]
    r = n[1:]
    if r[0] in '#b':
        t += 1 if r[0] == '#' else -1
        r = r[1:]
    return 440 * 2 ** ((t + 12 * (int(r) + 1) - 69) / 12)


def tt(d):
    return np.arange(int(SR * d)) / SR


def poner(bus, t0, s, g=1.0, pan=0.0):
    i = int(t0 * SR)
    if i >= N or len(s) == 0:
        return
    s = s[: N - i] * g
    bus[i:i + len(s), 0] += s * np.sqrt(0.5 * (1 - pan))
    bus[i:i + len(s), 1] += s * np.sqrt(0.5 * (1 + pan))


def filtro(s, lo=0, hi=SR / 2, suave=True):
    f = np.fft.rfftfreq(len(s), 1 / SR)
    S = np.fft.rfft(s)
    if suave:
        g = np.ones_like(f)
        if lo > 0:
            g *= 1 / (1 + (lo / np.maximum(f, 1)) ** 4)
        if hi < SR / 2:
            g *= 1 / (1 + (f / hi) ** 4)
        S *= g
    else:
        S[(f < lo) | (f > hi)] = 0
    return np.fft.irfft(S, len(s))


def env(s, a=0.005, r=0.05):
    n = len(s)
    e = np.ones(n)
    na, nr = min(n, int(a * SR)), min(n, int(r * SR))
    if na:
        e[:na] = np.linspace(0, 1, na) ** 1.5
    if nr:
        e[-nr:] *= np.linspace(1, 0, nr) ** 1.5
    return s * e


# ---------- instrumentos ----------
def piano(f, d=3.0, vel=0.8):
    """Piano: parciales inarmónicos, dos cuerdas desafinadas, martillo y apagado."""
    t = tt(d + 0.6)
    B = 0.00035
    s = np.zeros(len(t))
    d1 = 0.5 + f / 700
    for n in range(1, 11):
        fn = n * f * np.sqrt(1 + B * n * n)
        if fn > 12000:
            break
        a = (1 / n ** 1.15) * (vel ** (0.4 * n))
        dec = np.exp(-t * d1 * (1 + 0.55 * n))
        for det in (-0.0005, 0.0005):
            s += a * dec * np.sin(2 * np.pi * fn * (1 + det) * t + n)
    s += 0.04 * vel * filtro(rs.standard_normal(len(t)), 1500, 5000) * np.exp(-t * 300)
    s *= np.where(t < d, 1.0, np.exp(-(t - d) * 14))  # el apagador al soltar
    return env(s, 0.002, 0.05) * vel


def cuerdas(fs, d, brillo=2600, ataque=0.8, vib=0.004):
    """Sección de cuerdas: varias voces de diente de sierra desafinadas, filtradas y con vibrato."""
    t = tt(d)
    s = np.zeros(len(t))
    for f in fs:
        for v in range(5):
            det = (v - 2) * 0.0025
            ph = 2 * np.pi * np.cumsum(f * (1 + det) * (1 + vib * np.sin(2 * np.pi * (5 + v * 0.3) * t + v))) / SR
            s += sum(np.sin(k * ph) / k for k in range(1, 14))
    s = filtro(s / (len(fs) * 5), 60, brillo)
    return env(s, min(ataque, d / 2), min(1.2, d / 2))


def violonchelo(f, d, vel=1.0):
    t = tt(d)
    ph = 2 * np.pi * np.cumsum(f * (1 + 0.005 * np.sin(2 * np.pi * 5.4 * t) * np.minimum(1, t / 0.5))) / SR
    s = sum(np.sin(k * ph) / k ** 1.2 for k in range(1, 12))
    return env(filtro(s, 50, 1600), 0.18, 0.4) * vel


def caja_musica(f, d=2.0):
    t = tt(d)
    s = np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * 4 * f * t) * np.exp(-t * 9) + 0.12 * np.sin(2 * np.pi * 6.3 * f * t) * np.exp(-t * 13)
    return env(s * np.exp(-t * 1.8), 0.001, 0.1)


def golpe():
    t = tt(0.6)
    return np.sin(2 * np.pi * 52 * t * (1 - t * 0.5)) * np.exp(-t * 8) + 0.6 * filtro(rs.standard_normal(len(t)), 60, 700) * np.exp(-t * 18)


def obturador():
    t = tt(0.08)
    return filtro(rs.standard_normal(len(t)), 1800, 9000) * (np.exp(-t * 120) + 0.6 * np.exp(-np.maximum(0, t - 0.035) * 160) * (t > 0.035))


def notificacion(f):
    t = tt(0.25)
    return env(np.sin(2 * np.pi * f * t) * np.exp(-t * 18) + 0.5 * np.sin(2 * np.pi * f * 1.5 * t) * np.exp(-t * 22), 0.002, 0.03)


def latido():
    t = tt(0.35)
    return np.sin(2 * np.pi * np.cumsum(70 * np.exp(-t * 10) + 38) / SR) * np.exp(-t * 11)


def pajaro(f):
    t = tt(0.16)
    return env(np.sin(2 * np.pi * np.cumsum(f * (1 + 0.25 * np.sin(2 * np.pi * 18 * t))) / SR) * np.exp(-t * 14), 0.004, 0.03)


def hash_(n):
    x = np.sin(n * 127.1 + 311.7) * 43758.5453
    return x - np.floor(x)


AC = {'Am': ['A2', 'E3', 'A3', 'C4', 'E4'], 'F': ['F2', 'C3', 'F3', 'A3', 'C4'], 'C': ['C3', 'G3', 'C4', 'E4', 'G4'], 'G': ['G2', 'D3', 'G3', 'B3', 'D4'],
      'Dm': ['D3', 'A3', 'D4', 'F4', 'A4'], 'E': ['E2', 'B2', 'E3', 'G#3', 'B3']}


def arpegio(bus, t0, acorde, compas, g=0.5, vel=0.55):
    """Mano izquierda: acorde quebrado en corcheas a lo largo de un compás."""
    n = AC[acorde]
    orden = [0, 1, 2, 3, 4, 3, 2, 1]
    paso = compas / 8
    for i, j in enumerate(orden):
        poner(bus, t0 + i * paso, piano(hz(n[j]), compas - i * paso + 0.3, vel * (1.0 if i == 0 else 0.8)), g * (1.2 if i == 0 else 0.7), -0.25 + j * 0.1)


def melodia(bus, t0, notas, beat, g=0.9, vel=0.75, inst=piano, pan=0.15):
    t = t0
    for n, d in notas:
        if n:
            poner(bus, t, inst(hz(n), d * beat + 0.4) if inst is not piano else piano(hz(n), d * beat + 0.3, vel), g, pan)
        t += d * beat
    return t


TEMA_A = [('A4', 1), ('C5', 1), ('E5', 2), ('F5', 1), ('E5', 1), ('C5', 2), ('E5', 1), ('D5', 1), ('C5', 1), ('G4', 1), ('B4', 1.5), ('C5', 0.5), ('D5', 2)]
TEMA_B = [('A4', 1), ('C5', 1), ('E5', 2), ('F5', 1), ('E5', 1), ('C5', 1), ('A4', 1), ('D5', 1), ('F5', 1), ('E5', 1), ('D5', 1), ('C5', 1), ('B4', 1), ('A4', 2)]

# ======== 0–15 s: mañana, el tema suave en piano ========
BEAT = 0.86
COMPAS = BEAT * 4
for i, a in enumerate(['Am', 'F', 'C', 'G']):
    arpegio(MUS, 0.3 + i * COMPAS, a, COMPAS, 0.32, 0.5)
melodia(MUS, 0.3, TEMA_A, BEAT, 0.5, 0.6)
poner(MUS, 0.3, cuerdas([hz('A3'), hz('E4')], 14.5, 2000, 3.0), 0.1)
for k in range(10):
    poner(FX, 0.6 + k * 1.3 + hash_(k) * 0.4, pajaro(2700 + hash_(k * 3) * 1300), 0.035, hash_(k * 7) * 1.4 - 0.7)

# ======== 15 s: la caída — todo se corta ========
CAIDA = 15.0
poner(FX, CAIDA + 0.32, golpe(), 0.75)
for i in range(5):
    t = tt(0.05)
    poner(FX, CAIDA + 0.55 + i * 0.3, np.sin(2 * np.pi * (700 + i * 90) * t) * np.exp(-t * 90), 0.08, 0.4 - i * 0.2)  # naranjas que ruedan

# ======== 16–27 s: todos graban — vacío frío ========
t = tt(11.5)
dron = (np.sin(2 * np.pi * 55 * t) + 0.6 * np.sin(2 * np.pi * 82.4 * t * (1 + 0.0015 * np.sin(0.7 * t))) + 0.25 * np.sin(2 * np.pi * 110.3 * t)) * np.minimum(1, t / 2.5)
poner(MUS, 16.0, env(dron, 0.5, 1.0), 0.26)
for k, n in enumerate(['E6', 'C6', 'A5', 'E6', 'B5', 'G5']):
    poner(MUS, 16.6 + k * 1.75, piano(hz(n), 3.0, 0.45), 0.5, 0.3 * (k % 2 * 2 - 1))
poner(MUS, 21.5, cuerdas([hz('A3'), hz('C4'), hz('E4'), hz('F4')], 5.8, 1600, 4.0), 0.16)  # disonancia que sube
for k, t0 in enumerate([16.4, 17.1, 17.6, 18.3, 20.8, 21.3, 21.9, 22.4, 23.1, 23.8, 24.5]):
    poner(FX, t0 + 0.4, obturador(), 0.35, hash_(k) * 1.6 - 0.8)
k, t0 = 0, 16.5
while t0 < 27.0:
    poner(FX, t0, notificacion(1568 if hash_(k) < 0.5 else 2093), 0.035, hash_(k * 3) * 1.6 - 0.8)
    t0 += 0.6 - min(0.35, (t0 - 16) * 0.03) + hash_(k * 5) * 0.1
    k += 1
for i in range(9):
    poner(FX, 18.5 + i * 0.95, latido(), 0.18)

# ======== 27–36 s: la niña — el tema crece con cuerdas ========
B2 = 0.6
melodia(MUS, 27.0, [('A4', 1), ('C5', 1), ('E5', 1.75), ('F5', 1), ('E5', 1), ('C5', 1.75), ('E5', 1), ('D5', 1), ('C5', 0.5)], B2, 0.65, 0.75)
melodia(MUS, 27.0, [('A5', 1), ('C6', 1), ('E6', 1.75), ('F6', 1), ('E6', 1), ('C6', 1.75), ('E6', 1), ('D6', 1), ('C6', 0.5)], B2, 0.16, inst=caja_musica, pan=-0.3)
for t0, a, d in [(27.0, 'Am', 2.25), (29.25, 'F', 2.25), (31.5, 'G', 1.5)]:
    arpegio(MUS, t0, a, d, 0.3, 0.55)
    poner(MUS, t0, violonchelo(hz(AC[a][0]), d + 0.3), 0.22)
poner(MUS, 27.0, cuerdas([hz('A3'), hz('C4'), hz('E4')], 2.4, 2200, 1.2), 0.14)
poner(MUS, 29.25, cuerdas([hz('F3'), hz('A3'), hz('C4')], 2.4, 2400, 0.8), 0.18)
poner(MUS, 31.5, cuerdas([hz('G3'), hz('B3'), hz('D4')], 1.7, 2600, 0.6), 0.22)
# clímax: le da la mano (33 s) — Do mayor, luz
poner(MUS, 33.0, cuerdas([hz('C3'), hz('G3'), hz('C4'), hz('E4'), hz('G4')], 3.6, 3200, 0.25), 0.34)
poner(MUS, 33.0, violonchelo(hz('C2'), 3.4), 0.3)
for i, n in enumerate(['C3', 'G3', 'C4', 'E4', 'G4', 'C5']):
    poner(MUS, 33.0 + i * 0.06, piano(hz(n), 3.0, 0.8), 0.4)
melodia(MUS, 33.0, [('G5', 2.5), ('E5', 1), ('D5', 1), ('C5', 3)], B2, 0.75, 0.8)
for k in range(22):
    poner(FX, 33.1 + k * 0.13 + hash_(k) * 0.06, obturador(), 0.22, hash_(k * 9) * 1.6 - 0.8)

# ======== 36–42 s: de noche, el mismo tema por el altavoz del móvil ========
tel = np.zeros((N, 2))
for i, a in enumerate(['Am', 'F', 'C', 'G']):
    arpegio(tel, 36.0 + i * 1.5, a, 1.5, 0.35, 0.6)
melodia(tel, 36.0, [('A4', 1), ('C5', 1), ('E5', 2), ('F5', 1), ('E5', 1), ('C5', 2), ('E5', 1), ('D5', 1), ('C5', 2)], 0.5, 0.7, 0.75)
for c in range(2):
    tel[:, c] = filtro(tel[:, c], 500, 3200)
MUS += tel * 0.8
poner(FX, 40.45, notificacion(2637), 0.14)
t = tt(0.6)
poner(FX, 41.9, filtro(rs.standard_normal(len(t)), 400, 5000) * np.sin(np.pi * t / 0.6) ** 2, 0.16)  # desliza
# el siguiente vídeo: una cancioncita alegre y vacía (contraste)
alegre = np.zeros((N, 2))
for k, n in enumerate(['C5', 'E5', 'G5', 'C6', 'G5', 'E5', 'C5', 'G4', 'C5', 'E5', 'G5', 'E5']):
    poner(alegre, 42.45 + k * 0.13, caja_musica(hz(n), 0.25), 0.5)
for k in range(4):
    poner(alegre, 42.45 + k * 0.4, latido(), 0.5)
for c in range(2):
    alegre[:, c] = filtro(alegre[:, c], 500, 3500)
MUS += alegre * 0.5

# ======== 44–52 s: solo en la cocina — piano desnudo ========
B3 = 0.52
fin_t = melodia(MUS, 44.2, TEMA_B, B3, 0.75, 0.6, pan=0.1)
for t0, a, d in [(44.2, 'Am', 4 * B3), (44.2 + 4 * B3, 'F', 4 * B3), (44.2 + 8 * B3, 'Dm', 4 * B3), (44.2 + 12 * B3, 'E', 3 * B3)]:
    poner(MUS, t0, piano(hz(AC[a][0]), d + 0.4, 0.5), 0.45)
    poner(MUS, t0 + B3, piano(hz(AC[a][2]), d - B3 + 0.4, 0.4), 0.28)
poner(MUS, fin_t, piano(hz('A2'), 2.5, 0.5), 0.45)
poner(MUS, 44.0, violonchelo(hz('A2'), 8.2, 0.8), 0.14)

# ======== 52–57.5 s: era tu móvil — las cuerdas crecen, el latido... y silencio ========
poner(MUS, 52.0, cuerdas([hz('A3'), hz('C4'), hz('E4')], 2.0, 2000, 1.0), 0.18)
poner(MUS, 53.8, cuerdas([hz('F3'), hz('A3'), hz('C4'), hz('E4')], 2.0, 2400, 0.6), 0.24)
poner(MUS, 55.6, cuerdas([hz('E3'), hz('G#3'), hz('B3'), hz('E4')], 2.2, 2800, 0.4), 0.32)
poner(MUS, 52.0, violonchelo(hz('A1') * 2, 5.8, 0.9), 0.2)
melodia(MUS, 52.2, [('E5', 1), ('C5', 1), ('A4', 1.5), ('F5', 1), ('E5', 1), ('D5', 1.5), ('B4', 2)], 0.6, 0.55, 0.65)
for i in range(6):
    poner(FX, 52.3 + i * 0.85, latido(), 0.24)
    poner(FX, 52.52 + i * 0.85, latido(), 0.14)

# la nota final, tras el silencio
poner(FIN, 58.2, piano(hz('A3'), 3.0, 0.5), 0.45)
poner(FIN, 58.2, piano(hz('E4'), 3.0, 0.45), 0.32)
poner(FIN, 58.2, piano(hz('A4'), 3.0, 0.4), 0.25)


# ---------- reverb por convolución ----------
def reverb(x, rt=2.4, mezcla=0.32, pre=0.022):
    n = int(SR * rt * 1.2)
    t = np.arange(n) / SR
    y = np.zeros_like(x)
    for c in range(2):
        ir = rs.standard_normal(n) * np.exp(-6.9 * t / rt)
        ir = filtro(ir, 120, 6500) * (1 - 0.5 * np.minimum(1, t / rt))
        ir = np.concatenate([np.zeros(int(pre * SR)), ir])
        ir /= np.sqrt(np.sum(ir ** 2))
        m = 1 << int(np.ceil(np.log2(len(x) + len(ir))))
        wet = np.fft.irfft(np.fft.rfft(x[:, c], m) * np.fft.rfft(ir, m), m)[: len(x)]
        y[:, c] = x[:, c] * (1 - mezcla) + wet * mezcla * 1.8
    return y


def curva_ganancia(puntos):
    tg = np.arange(N) / SR
    return np.interp(tg, [p[0] for p in puntos], [p[1] for p in puntos])[:, None]


mus = reverb(MUS)
# cortes en seco: la caída (15.3 s) y la pantalla que se apaga (57.5 s)
mus *= curva_ganancia([(0, 1), (15.28, 1), (15.36, 0), (15.9, 0), (16.0, 1), (57.48, 1), (57.55, 0), (60, 0)])
fx = reverb(FX, 1.4, 0.2) * curva_ganancia([(0, 1), (57.48, 1), (57.55, 0), (60, 0)])
mix = mus + fx * 0.9 + reverb(FIN, 3.0, 0.45)
mix /= np.max(np.abs(mix))
mix = np.tanh(mix * 1.15) / np.tanh(1.15)
mix *= 0.9
fade = np.linspace(1, 0, int(1.0 * SR))
mix[-len(fade):] *= fade[:, None]
with wave.open(str(Path(__file__).with_name('musica.wav')), 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix * 32767).astype('<i2').tobytes())
print('listo')
