"""Banda sonora de "Perdidos" (60 s): jazz/ragtime de los años 30 sintetizado con numpy.

Piano stride, clarinete, trompeta con sordina, contrabajo, escobillas, órgano, celesta,
crujido de vinilo y efectos de cartoon. Sin samples. Uso: python3 musica.py -> musica.wav
"""
import wave
from pathlib import Path

import numpy as np

SR = 44100
DUR = 60.0
N = int(SR * DUR)
L = np.zeros(N)
R = np.zeros(N)
rs = np.random.default_rng(31)
BEAT = 0.5
SW = 2 / 3  # corchea con swing


def hz(nota):
    nombres = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}
    n = nombres[nota[0]]
    resto = nota[1:]
    if resto[0] == '#':
        n += 1
        resto = resto[1:]
    elif resto[0] == 'b':
        n -= 1
        resto = resto[1:]
    return 440.0 * 2 ** ((n + 12 * (int(resto) + 1) - 69) / 12)


def tt(d):
    return np.arange(int(SR * d)) / SR


def poner(t0, sig, gain=1.0, pan=0.0):
    i = int(t0 * SR)
    if i >= N or i < 0 or len(sig) == 0:
        return
    sig = sig[: N - i] * gain
    L[i:i + len(sig)] += sig * np.sqrt(0.5 * (1 - pan))
    R[i:i + len(sig)] += sig * np.sqrt(0.5 * (1 + pan))


def env(sig, a=0.005, r=0.03):
    n = len(sig)
    e = np.ones(n)
    na, nr = min(n, int(a * SR)), min(n, int(r * SR))
    if na:
        e[:na] = np.linspace(0, 1, na)
    if nr:
        e[-nr:] *= np.linspace(1, 0, nr)
    return sig * e


def filtro(sig, lo=0.0, hi=SR / 2):
    spec = np.fft.rfft(sig)
    f = np.fft.rfftfreq(len(sig), 1 / SR)
    spec[(f < lo) | (f > hi)] = 0
    return np.fft.irfft(spec, len(sig))


def fase(freqs):
    return 2 * np.pi * np.cumsum(freqs) / SR


# ---------- instrumentos ----------
def piano(f, d=1.0, brillo=1.0):
    t = tt(d)
    s = sum((1 / k ** (1.2 / brillo)) * np.sin(2 * np.pi * k * f * t * (1 + 0.0004 * k)) * np.exp(-t * (2.2 + 1.6 * k)) for k in range(1, 8))
    return env(s, 0.002, 0.04)


def honky(f, d=1.0):
    """Piano de bar algo desafinado (dos cuerdas)."""
    return 0.6 * piano(f, d) + 0.5 * piano(f * 1.004, d)


def clarinete(f, d=0.4, vib=0.006):
    t = tt(d)
    v = 1 + vib * np.sin(2 * np.pi * 5.2 * t) * np.clip(t * 4, 0, 1)
    ph = fase(f * v)
    s = np.sin(ph) + 0.35 * np.sin(3 * ph) + 0.18 * np.sin(5 * ph) + 0.08 * np.sin(7 * ph)
    return env(s, 0.03, 0.06)


def trompeta(f, d=0.3, wah=0.0):
    t = tt(d)
    ph = fase(f * (1 + 0.004 * np.sin(2 * np.pi * 6 * t)))
    s = sum(((0.9 ** k) / 1) * np.sin(k * ph) for k in range(1, 10))
    if wah:
        s *= 0.55 + 0.45 * np.sin(2 * np.pi * wah * t - np.pi / 2)
    return env(np.tanh(s * 0.8), 0.015, 0.05)


def contrabajo(f, d=0.45):
    t = tt(d)
    s = np.sin(2 * np.pi * f * t) + 0.45 * np.sin(4 * np.pi * f * t) + 0.15 * np.sin(6 * np.pi * f * t)
    return env(s * np.exp(-t * 5), 0.004, 0.03)


def tuba(f, d=0.35):
    t = tt(d)
    ph = fase(f * np.ones(len(t)))
    s = np.sin(ph) + 0.5 * np.sin(2 * ph) + 0.25 * np.sin(3 * ph)
    return env(np.tanh(s) * np.exp(-t * 3), 0.02, 0.05)


def organo(fs, d, trem=True):
    t = tt(d)
    s = np.zeros(len(t))
    for f in fs:
        for k, g in ((1, 1), (2, 0.6), (3, 0.4), (4, 0.3), (6, 0.15), (8, 0.1)):
            s += g * np.sin(2 * np.pi * f * k * t)
    s /= len(fs) * 2.5
    if trem:
        s *= 1 + 0.18 * np.sin(2 * np.pi * 6.2 * t)
    return env(s, 0.15, 0.3)


def celesta(f, d=1.4):
    t = tt(d)
    s = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * 4 * f * t) * np.exp(-t * 8) + 0.12 * np.sin(2 * np.pi * 6.8 * f * t) * np.exp(-t * 14)
    return env(s * np.exp(-t * 2.6), 0.001, 0.08)


def escobilla(d=0.18):
    t = tt(d)
    return env(filtro(rs.standard_normal(len(t)), 2500, 11000) * np.exp(-t * 14) * np.clip(t * 60, 0, 1), 0.01, 0.03)


def ride(d=0.25):
    t = tt(d)
    s = filtro(rs.standard_normal(len(t)), 5000, 15000) * np.exp(-t * 18) + 0.3 * np.sin(2 * np.pi * 3100 * t) * np.exp(-t * 20)
    return env(s, 0.001, 0.03)


def bombo(d=0.3):
    t = tt(d)
    f = 45 + 80 * np.exp(-t * 25)
    return env(np.sin(fase(f)) * np.exp(-t * 10), 0.001, 0.02)


def caja(d=0.15):
    t = tt(d)
    return env(0.7 * filtro(rs.standard_normal(len(t)), 1500, 9000) * np.exp(-t * 22) + 0.4 * np.sin(2 * np.pi * 200 * t) * np.exp(-t * 30), 0.001, 0.02)


def timbal(f=hz('D2'), d=1.2):
    t = tt(d)
    return env(np.sin(2 * np.pi * f * t) * np.exp(-t * 3) + 0.3 * filtro(rs.standard_normal(len(t)), 60, 400) * np.exp(-t * 8), 0.002, 0.1)


def platillo(d=1.8):
    t = tt(d)
    return env(filtro(rs.standard_normal(len(t)), 4000, 14000) * np.exp(-t * 2.5), 0.002, 0.2)


def redoble(d=1.2):
    t = tt(d)
    s = filtro(rs.standard_normal(len(t)), 1500, 8000) * (0.6 + 0.4 * np.sin(2 * np.pi * 28 * t) ** 2)
    return env(s * np.linspace(0.2, 1, len(t)) ** 1.5, 0.01, 0.05)


def taco(f=1200, d=0.08):
    t = tt(d)
    return np.sin(2 * np.pi * f * t) * np.exp(-t * 70) + 0.3 * np.sin(2 * np.pi * f * 2.7 * t) * np.exp(-t * 90)


def boing(f0=180, d=0.6):
    t = tt(d)
    f = f0 * (1 + 0.6 * np.exp(-t * 4) * np.sin(2 * np.pi * 14 * t))
    return env(np.sin(fase(f)) * np.exp(-t * 4), 0.002, 0.05)


def silbato(f0, f1, d):
    t = tt(d)
    f = f0 * (f1 / f0) ** (t / d)
    return env(np.sin(fase(f * (1 + 0.01 * np.sin(2 * np.pi * 7 * t)))), 0.02, 0.06)


def chapoteo(d=0.6):
    t = tt(d)
    return env(filtro(rs.standard_normal(len(t)), 150, 2500) * np.exp(-t * 7) + 0.6 * np.sin(fase(120 * np.exp(-t * 6) + 40)) * np.exp(-t * 9), 0.002, 0.05)


def obturador():
    t = tt(0.09)
    return env(filtro(rs.standard_normal(len(t)), 2000, 9000) * (np.exp(-t * 120) + 0.6 * np.exp(-((t - 0.05) ** 2) / 0.00002)), 0.001, 0.01)


def trombon_triste(t0):
    """"Wah, wah, wah, waaah"."""
    notas = [('Bb3', 0.42), ('A3', 0.42), ('Ab3', 0.42), ('G3', 1.1)]
    t = t0
    for k, (n, d) in enumerate(notas):
        tt_ = tt(d)
        f = hz(n) * (1 + (0.02 * np.sin(2 * np.pi * 5 * tt_) if k == 3 else 0))
        ph = fase(f * np.ones(len(tt_)))
        s = sum((0.85 ** j) * np.sin(j * ph) for j in range(1, 9))
        s *= 0.5 + 0.5 * np.sin(np.pi * np.clip(tt_ / d, 0, 1)) ** 0.5
        poner(t, env(np.tanh(s * 0.7) * (0.4 + 0.6 * np.clip(tt_ * 6, 0, 1)), 0.03, 0.12), 0.18)
        t += d


def pio(t0, f=3200):
    tt_ = tt(0.12)
    poner(t0, env(np.sin(fase(f * (1 + 0.3 * np.sin(2 * np.pi * 30 * tt_)))) * np.exp(-tt_ * 20), 0.005, 0.02), 0.05, 0.4)


# ---------- armonía ----------
ACORDES = {
    'F': ['F3', 'A3', 'C4'], 'F6': ['F3', 'A3', 'D4'], 'D7': ['F#3', 'C4', 'D4'], 'G7': ['F3', 'B3', 'D4'], 'C7': ['E3', 'Bb3', 'C4'],
    'Bb': ['F3', 'Bb3', 'D4'], 'Gm7': ['F3', 'Bb3', 'D4'], 'Fmaj7': ['E3', 'A3', 'C4'], 'Dm7': ['F3', 'A3', 'C4'],
    'Dm': ['D3', 'F3', 'A3'], 'A7': ['C#3', 'G3', 'A3'], 'Gm': ['G3', 'Bb3', 'D4'],
}
BAJOS = {'F': 'F2', 'F6': 'F2', 'D7': 'D2', 'G7': 'G2', 'C7': 'C2', 'Bb': 'Bb1', 'Gm7': 'G2', 'Fmaj7': 'F2', 'Dm7': 'D2', 'Dm': 'D2', 'A7': 'A1', 'Gm': 'G2'}


def stride(t0, acorde, g=1.0):
    """Un compás de piano stride: bajo en 1 y 3, acorde en 2 y 4."""
    b = hz(BAJOS[acorde])
    for k in range(4):
        if k % 2 == 0:
            poner(t0 + k * BEAT, honky(b * (1 if k == 0 else 1.5), 0.45), 0.28 * g, -0.2)
        else:
            for n in ACORDES[acorde]:
                poner(t0 + k * BEAT, honky(hz(n) * 2, 0.3), 0.11 * g, 0.1)


def bateria_swing(t0, compases, g=1.0):
    for c in range(compases):
        for k in range(4):
            tb = t0 + c * 2 + k * BEAT
            poner(tb, ride(), 0.12 * g, 0.4)
            poner(tb + BEAT * SW, ride(0.12), 0.07 * g, 0.4)
            if k % 2:
                poner(tb, escobilla(), 0.28 * g, -0.3)
            if k == 0:
                poner(tb, bombo(), 0.3 * g)


def melodia(t0, notas, inst=clarinete, g=0.2, pan=0.15):
    """notas: lista de (nota|None, duración en tiempos) con swing en las corcheas."""
    t = t0
    for i, (n, d) in enumerate(notas):
        if n:
            ts = t
            pos = round((t - t0) / BEAT * 2) % 2
            if pos == 1:
                ts = t - BEAT / 2 + BEAT * SW
            poner(ts, inst(hz(n), d * BEAT * 1.05), g, pan)
        t += d * BEAT


# ======== 0–4 s: cartela con redoble y fanfarria ========
poner(0.0, redoble(1.2), 0.35)
poner(1.2, platillo(), 0.3)
poner(1.2, timbal(hz('F2')), 0.5)
for k, n in enumerate(['F4', 'A4', 'C5', 'F5']):
    poner(1.2 + k * 0.17, trompeta(hz(n), 0.22), 0.16, -0.1)
for n in ['F4', 'A4', 'C5', 'F5']:
    poner(1.9, trompeta(hz(n), 0.9), 0.08)
stride(2.0, 'F6', 0.8)
poner(3.45, silbato(1400, 300, 0.5), 0.07)

# ======== 4–13 s: la calle (ragtime en Fa) ========
prog = ['F', 'D7', 'G7', 'C7', 'F']
tema = [
    [('A4', 0.5), ('C5', 0.5), ('D5', 0.5), ('C5', 0.5), ('A4', 1), ('F4', 1)],
    [('F#4', 0.5), ('A4', 0.5), ('C5', 0.5), ('D5', 0.5), ('C5', 1.5), (None, 0.5)],
    [('B4', 0.5), ('D5', 0.5), ('F5', 0.5), ('D5', 0.5), ('B4', 1), ('G4', 1)],
    [('C5', 0.5), ('Bb4', 0.5), ('G4', 0.5), ('E4', 0.5), ('C5', 1.5), (None, 0.5)],
    [('A4', 0.5), ('G4', 0.5), ('F4', 1), (None, 2)],
]
for i, a in enumerate(prog):
    t0 = 4 + i * 2
    stride(t0, a)
    melodia(t0, tema[i])
    for k in range(4):
        poner(t0 + k * BEAT, contrabajo(hz(BAJOS[a]) * [1, 1.25, 1.5, 1.25][k], 0.45), 0.25, -0.1)
bateria_swing(4, 5)
# gags
for tb in (7.0, 8.0):
    poner(tb, taco(900), 0.6, 0.3)
    poner(tb + 0.02, boing(160, 0.7), 0.25, 0.3)
poner(9.0, silbato(1800, 220, 0.5), 0.1, -0.3)
poner(9.5, chapoteo(), 0.4, -0.3)
for tb in (10.62, 10.97, 11.32):
    poner(tb, obturador(), 0.35, -0.2)

# ======== 13–21 s: selfis, likes y el trombón triste ========
for i, a in enumerate(['F', 'Bb']):
    t0 = 13 + i * 2
    stride(t0, a, 0.9)
    for k in range(4):
        poner(t0 + k * BEAT, contrabajo(hz(BAJOS[a]) * [1, 1.25, 1.5, 1.25][k], 0.45), 0.22, -0.1)
melodia(13, [('C5', 0.5), ('D5', 0.5), ('F5', 1), ('A5', 1), ('G5', 1), ('F5', 0.5), ('D5', 0.5), ('F5', 1), ('D5', 1), ('Bb4', 1)], trompeta, 0.12)
bateria_swing(13, 2, 0.9)
for i in range(24):
    t0 = 13.3 + i * 0.17
    if t0 > 17.2:
        break
    poner(t0, celesta(hz('C6') * 2 ** ((i % 12) / 12), 0.5), 0.12, (i % 3 - 1) * 0.5)
poner(17.15, taco(600), 0.4)
trombon_triste(17.4)
for k, n in enumerate(['A4', 'G4', 'F4', 'E4', 'D4']):
    poner(19.2 + k * 0.36, clarinete(hz(n), 0.4), 0.14)

# ======== 21–29 s: la cafetería (lounge suave) ========
for i, a in enumerate(['Fmaj7', 'Dm7', 'Gm7', 'C7']):
    t0 = 21 + i * 2
    for k in range(4):
        poner(t0 + k * BEAT, contrabajo(hz(BAJOS[a]) * [1, 1.5, 1.25, 1.5][k], 0.5), 0.2, -0.1)
        if k % 2:
            for n in ACORDES[a]:
                poner(t0 + k * BEAT, piano(hz(n) * 2, 0.6), 0.08)
    for k in range(4):
        poner(t0 + k * BEAT, escobilla(0.3), 0.14, -0.3)
melodia(21, [('E5', 1), ('C5', 1), ('A4', 2), ('F5', 1), ('D5', 1), ('A4', 2), ('D5', 1), ('Bb4', 1), ('G4', 2), ('E5', 1.5), ('D5', 0.5), ('C5', 2)], clarinete, 0.13)
for tb in (22.5, 23.3, 24.1):
    poner(tb, clarinete(hz('C5'), 0.15), 0.12, 0.3)
    poner(tb + 0.16, clarinete(hz('F5'), 0.22), 0.12, 0.3)
glu = filtro(rs.standard_normal(int(SR * 1.1)), 200, 1200) * (0.6 + 0.4 * np.sin(2 * np.pi * 9 * tt(1.1)))
poner(24.8, env(glu, 0.05, 0.1), 0.12, 0.4)
poner(25.2, chapoteo(0.5), 0.35, 0.4)

# ======== 29–37 s: nadie ayuda ========
poner(29.8, bombo(0.5), 0.8)
poner(29.8, silbato(900, 200, 0.4), 0.08)
poner(30.0, organo([hz('D3'), hz('F3'), hz('Ab3')], 4.0), 0.22)
trem = organo([hz('D4'), hz('Ab4')], 4.0)
poner(30.0, trem * (1 + 0.6 * np.sin(2 * np.pi * 12 * tt(4.0))), 0.08)
r2 = np.random.default_rng(5)
for k in range(28):
    poner(31.3 + r2.random() * 3.0, obturador(), 0.25, r2.random() * 1.6 - 0.8)
for k, n in enumerate(['C5', 'C5', 'Bb4', 'C5', 'Bb4', 'A4']):
    poner(31.6 + k * 0.33, trompeta(hz(n), 0.28, wah=4), 0.09, 0.3)
poner(34.0, organo([hz('D3'), hz('F3'), hz('A3'), hz('C4')], 1.6), 0.2)
poner(35.6, organo([hz('F3'), hz('A3'), hz('C4'), hz('F4')], 1.5), 0.25)
for k, n in enumerate(['F5', 'A5', 'C6', 'F6']):
    poner(36.0 + k * 0.12, celesta(hz(n), 1.0), 0.12)

# ======== 37–45 s: el mar de pantallas y el gran móvil ========
for i, ch in enumerate([['D2', 'A2', 'D3', 'F3'], ['Bb1', 'F2', 'Bb2', 'D3'], ['G1', 'D2', 'G2', 'Bb2'], ['A1', 'E2', 'A2', 'C#3']]):
    t0 = 37 + i * 2
    poner(t0, organo([hz(n) for n in ch], 2.1), 0.28 + i * 0.04)
    poner(t0, timbal(hz(ch[0]) * 2, 1.4), 0.4)
coro = organo([hz('D4'), hz('A4'), hz('D5')], 4.0, trem=False)
poner(41.0, coro * np.linspace(0.2, 1, len(coro)), 0.12)
poner(41.3, platillo(2.5), 0.35)
for n in ['D3', 'Eb3', 'A3', 'Bb3']:
    poner(41.3, trompeta(hz(n), 1.4), 0.07)
poner(41.3, timbal(hz('D2'), 2.0), 0.6)
poner(43.5, redoble(1.5), 0.25)

# ======== 45–53 s: marcha de los lemmings (re menor) ========
for c in range(4):
    t0 = 45 + c * 2
    a = ['Dm', 'A7', 'Dm', 'A7'][c]
    for k in range(4):
        tb = t0 + k * BEAT
        if k % 2 == 0:
            poner(tb, tuba(hz(BAJOS[a]) * (1 if k == 0 else 1.5), 0.4), 0.3)
        else:
            for n in ACORDES[a]:
                poner(tb, honky(hz(n) * 2, 0.25), 0.08)
        poner(tb, caja(), 0.15 if k % 2 else 0.09)
melodia(45, [('D5', 1), ('A4', 1), ('F4', 1), ('D4', 1), ('C#5', 1), ('E5', 1), ('A4', 2), ('D5', 1), ('F5', 1), ('E5', 1), ('D5', 1), ('C#5', 1), ('A4', 1), ('D4', 2)], clarinete, 0.15)
for tb in (46.2, 48.6):
    poner(tb, trompeta(hz('A4'), 0.5), 0.13, -0.4)
for i in range(22):
    te = 45 + (-2 + i * 0.42) + 890 / 160
    if 45 < te < 53:
        poner(te + 0.05, silbato(1500 - (i % 4) * 120, 250, 0.9), 0.05, 0.4)

# ======== 53–57 s: el atardecer ========
poner(53.0, organo([hz('F3'), hz('A3'), hz('C4'), hz('E4')], 4.0, trem=False), 0.12)
for k, (n, d) in enumerate([('C6', 0.5), ('A5', 0.5), ('F5', 0.5), ('G5', 0.5), ('A5', 1.0), ('C6', 0.5), ('D6', 0.5), ('C6', 1.0)]):
    poner(53.2 + sum(x[1] for x in [('C6', 0.5), ('A5', 0.5), ('F5', 0.5), ('G5', 0.5), ('A5', 1.0), ('C6', 0.5), ('D6', 0.5)][:k]) * 0.6, celesta(hz(n), 1.6), 0.16, 0.1 * (k % 3 - 1))
for tb in (53.6, 54.3, 55.1, 55.8):
    pio(tb, 3000 + 400 * np.sin(tb))
poner(56.4, celesta(hz('F5'), 1.5), 0.15)

# ======== 57–60 s: FIN ("afeitado y corte, dos pesos") ========
tag = [('C5', 0.0), ('G4', 0.5), ('G4', 0.25), ('A4', 0.25), ('G4', 0.5), (None, 0.5), ('B4', 0.5), ('C5', 0.5)]
t = 57.2
for n, d in tag:
    t += d
    if n:
        poner(t, honky(hz(n), 0.5), 0.3)
        poner(t, trompeta(hz(n), 0.25), 0.07)
poner(t, honky(hz('C3'), 1.2), 0.3)
poner(t, platillo(1.5), 0.12)

# ---------- crujido de vinilo + siseo ----------
crujido = np.zeros(N)
pos = rs.integers(0, N, 900)
crujido[pos] = rs.choice([-1, 1], 900) * rs.uniform(0.2, 1.0, 900)
crujido = filtro(crujido, 800, 9000)
siseo = filtro(rs.standard_normal(N), 3000, 12000)
L += crujido * 0.5 + siseo * 0.006
R += np.roll(crujido, 37) * 0.5 + siseo * 0.006


# ---------- sala pequeña, mezcla y exportación ----------
def eco(x, taps):
    y = x.copy()
    for d, g in taps:
        n = int(d * SR)
        y[n:] += x[:-n] * g
    return y


L2 = eco(L, [(0.023, 0.2), (0.041, 0.15), (0.067, 0.1), (0.13, 0.06)])
R2 = eco(R, [(0.029, 0.2), (0.047, 0.15), (0.073, 0.1), (0.14, 0.06)])
mix = np.stack([L2, R2], axis=1)
# sonido de época: sin graves profundos ni agudos brillantes
for c in range(2):
    mix[:, c] = filtro(mix[:, c], 70, 9500)
mix = np.tanh(mix / np.max(np.abs(mix)) * 1.4)
mix *= 0.89 / np.max(np.abs(mix))
fin = np.linspace(1, 0, int(0.5 * SR))
mix[-len(fin):] *= fin[:, None]
with wave.open(str(Path(__file__).with_name('musica.wav')), 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix * 32767).astype('<i2').tobytes())
print('listo')
