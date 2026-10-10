"""Banda sonora de "La rueda" (30 s): "En la gruta del rey de la montaña" (Grieg, dominio público),
sintetizada con numpy. Empieza en pizzicato, acelera hasta la locura con toda la orquesta mientras la rueda gira,
se corta en seco cuando el viejo cae, y termina con el tema lento en una caja de música. Uso: python3 musica.py -> musica.wav
"""
import wave
from pathlib import Path

import numpy as np

SR = 44100
DUR = 30.0
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



def pizz(f, d=0.5, vel=0.8):
    """Pizzicato con Karplus-Strong."""
    n = int(SR * (d + 0.4)); p = max(2, int(SR / f))
    buf = rs.uniform(-1, 1, p); out = np.zeros(n)
    for i in range(n):
        out[i] = buf[i % p]
        buf[i % p] = 0.5 * (buf[i % p] + buf[(i + 1) % p]) * 0.994
    return env(filtro(out, 40, 4000), 0.001, 0.08) * vel


def fagot(f, d, vel=0.8):
    t = tt(d)
    ph = 2 * np.pi * f * t
    s = sum((0.8 ** k) * np.sin(k * ph) / (1 if k % 2 else 1.6) for k in range(1, 12))
    return env(filtro(s, 60, 1800), 0.02, 0.06) * vel


def metal(f, d, vel=0.8):
    t = tt(d)
    ph = 2 * np.pi * np.cumsum(f * (1 + 0.003 * np.sin(2 * np.pi * 5.5 * t))) / SR
    s = sum(np.sin(k * ph) / k for k in range(1, 16))
    return env(filtro(s, 80, 2500 + 2000 * vel), 0.03, 0.08) * vel


def timbal(f, vel=1.0):
    t = tt(0.9)
    return (np.sin(2 * np.pi * f * t) * np.exp(-t * 4) + 0.4 * filtro(rs.standard_normal(len(t)), 60, 400) * np.exp(-t * 20)) * vel


def platillo(vel=1.0):
    t = tt(1.4)
    return filtro(rs.standard_normal(len(t)), 3000, 14000) * np.exp(-t * 3) * vel


def paso():
    t = tt(0.12)
    return filtro(rs.standard_normal(len(t)), 80, 1200) * np.exp(-t * 45)


def tecla():
    t = tt(0.03)
    return filtro(rs.standard_normal(len(t)), 2000, 8000) * np.exp(-t * 200)


def caja_registradora():
    t = tt(0.9)
    s = 0.6 * filtro(rs.standard_normal(len(t)), 1500, 7000) * np.exp(-t * 30)
    for f in (2093, 2637, 3136):
        s += np.sin(2 * np.pi * f * t) * np.exp(-t * 4) * (t > 0.08)
    return s


def clac():
    t = tt(0.5)
    return 0.8 * filtro(rs.standard_normal(len(t)), 400, 6000) * np.exp(-t * 25) + np.sin(2 * np.pi * 180 * t) * np.exp(-t * 12)


def chirrido(d):
    t = tt(d)
    return filtro(np.sin(2 * np.pi * np.cumsum(900 + 200 * np.sin(2 * np.pi * 1.3 * t)) / SR) * (0.5 + 0.5 * np.sin(2 * np.pi * 2.6 * t)), 600, 3000)


# Tema (negras): Si menor
TEMA = [('B3', 1), ('C#4', 1), ('D4', 1), ('E4', 1), ('F#4', 1), ('D4', 1), ('F#4', 2),
        ('F4', 1), ('C#4', 1), ('F4', 2), ('E4', 1), ('C4', 1), ('E4', 2),
        ('B3', 1), ('C#4', 1), ('D4', 1), ('E4', 1), ('F#4', 1), ('D4', 1), ('F#4', 1), ('B4', 1), ('A4', 1), ('F#4', 1), ('D4', 1), ('F#4', 1), ('A4', 4)]
BAJO = ['B2', 'F#2']


def transp(n, semis):
    return hz(n) * 2 ** (semis / 12)


# tempo que acelera: de 150 a 380 negras por minuto hasta la caída (24 s)
CAE = 24.0
def bpm(t):
    return 150 + 230 * (t / CAE) ** 1.6

t = 0.25
beat = 0
vuelta = 0
while t < CAE:
    for n, d in TEMA:
        if t >= CAE:
            break
        dur = 0
        for _ in range(int(d)):
            dur += 60 / bpm(t + dur)
        fase = t / CAE
        oct_ = 0 if vuelta == 0 else 12 if vuelta >= 2 else 0
        f = transp(n, oct_)
        if vuelta == 0:
            poner(MUS, t, pizz(f / 2, dur, 0.9), 0.55, -0.2)
            poner(MUS, t, fagot(f / 2, dur * 0.9, 0.7), 0.25, 0.2)
        elif vuelta == 1:
            poner(MUS, t, fagot(f, dur * 0.9, 0.8), 0.35, 0.2)
            poner(MUS, t, pizz(f, dur, 0.9), 0.4, -0.25)
            poner(MUS, t, cuerdas([f], dur * 0.95, 2600, 0.01, 0.002), 0.25)
        else:
            poner(MUS, t, metal(f / 2, dur * 0.9, 0.9), 0.3, -0.1)
            poner(MUS, t, cuerdas([f, f * 2], dur * 0.95, 3500, 0.01, 0.002), 0.35)
            poner(MUS, t, pizz(f * 2, dur, 0.8), 0.25, 0.3)
        # bajo en cada negra
        b0 = t
        for _ in range(int(d)):
            poner(MUS, b0, pizz(hz(BAJO[beat % 2]), 60 / bpm(b0), 1.0), 0.6 + 0.3 * fase, 0)
            if vuelta >= 1 and beat % 2 == 0:
                poner(MUS, b0, timbal(hz('B1') if beat % 4 == 0 else hz('F#1'), 0.6 + 0.4 * fase), 0.35)
            if t < 4.5:
                poner(FX, b0, paso(), 0.5, 0.3 * (beat % 2 * 2 - 1))  # el rebaño marcha a compás
            beat += 1
            b0 += 60 / bpm(b0)
        t += dur
    vuelta += 1
poner(MUS, 16.5, platillo(0.9), 0.4)
poner(MUS, 16.5, timbal(hz('B1'), 1.2), 0.6)

# efectos de la oficina y la calle
for i in range(60):
    tk = 4.6 + i * 0.055 + hash_(i) * 0.03
    if tk < 7.9:
        poner(FX, tk, tecla(), 0.18, hash_(i * 3) - 0.5)
poner(FX, 8.0, caja_registradora(), 0.5)
for i in range(18):
    t0 = 8.45 + i * 0.07
    tt_ = tt(0.08)
    poner(FX, t0, filtro(rs.standard_normal(len(tt_)), 1500, 6000) * np.exp(-tt_ * 40), 0.12, hash_(i) * 1.6 - 0.8)  # billetes volando
poner(FX, 10.3, caja_musica(hz('E6'), 0.6), 0.25)  # tilín de la única moneda
poner(FX, 14.1, clac(), 0.75)  # el grillete se cierra
for i in range(10):
    poner(FX, 14.6 + i * 0.32, filtro(rs.standard_normal(int(SR * 0.06)), 1500, 5000) * np.exp(-np.arange(int(SR * 0.06)) / SR * 50), 0.08)  # cadena arrastrada
poner(FX, 16.5, chirrido(7.5) * np.minimum(1, tt(7.5) / 1.5), 0.05)  # la rueda chirría

# la caída: golpe seco y silencio; después, el tema lento en caja de música
t = tt(0.6)
poner(FX, CAE + 0.85, np.sin(2 * np.pi * 50 * t * (1 - t * 0.5)) * np.exp(-t * 8) + 0.5 * filtro(rs.standard_normal(len(t)), 60, 700) * np.exp(-t * 18), 0.8)
lento = [('B4', 1), ('C#5', 1), ('D5', 1), ('E5', 1), ('F#5', 1), ('D5', 1), ('F#5', 2), ('F5', 1), ('C#5', 1), ('F5', 2), ('E5', 1), ('C5', 1), ('E5', 2.5)]
t0 = CAE + 1.6
for n, d in lento:
    poner(FIN, t0, caja_musica(hz(n), 2.2), 0.16, 0.1)
    t0 += d * 0.34
poner(FIN, CAE + 1.6, cuerdas([hz('B2'), hz('F#3'), hz('D4')], 4.4, 1400, 1.2), 0.07)
poner(FX, CAE + 4.1, caja_musica(hz('B5'), 1.0), 0.15)  # la moneda que se va rodando

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
mus *= curva_ganancia([(0, 1), (24.02, 1), (24.08, 0), (30, 0)])
fx = reverb(FX, 1.2, 0.18)
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
