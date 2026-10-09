"""Banda sonora de "Felicidad" (60 s), sintetizada desde cero con numpy.

Sin samples ni grabaciones: cada instrumento es una fórmula. La música sigue las
escenas del corto (ver escenas.js). Uso: python3 musica.py  ->  musica.wav
"""
import wave
from pathlib import Path

import numpy as np

SR = 44100
DUR = 60.0
N = int(SR * DUR)
L = np.zeros(N)
R = np.zeros(N)
rs = np.random.default_rng(7)


def hz(nota):
    """'A4', 'C#5', 'Bb3' -> frecuencia."""
    nombres = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}
    n = nombres[nota[0]]
    resto = nota[1:]
    if resto[0] == '#':
        n += 1
        resto = resto[1:]
    elif resto[0] == 'b':
        n -= 1
        resto = resto[1:]
    midi = n + 12 * (int(resto) + 1)
    return 440.0 * 2 ** ((midi - 69) / 12)


def tt(dur):
    return np.arange(int(SR * dur)) / SR


def poner(t0, sig, gain=1.0, pan=0.0):
    i = int(t0 * SR)
    if i >= N or len(sig) == 0:
        return
    sig = sig[: N - i] * gain
    L[i:i + len(sig)] += sig * np.sqrt(0.5 * (1 - pan))
    R[i:i + len(sig)] += sig * np.sqrt(0.5 * (1 + pan))


def ataque(sig, a=0.005, r=0.02):
    n = len(sig)
    env = np.ones(n)
    na, nr = min(n, int(a * SR)), min(n, int(r * SR))
    if na:
        env[:na] = np.linspace(0, 1, na)
    if nr:
        env[-nr:] *= np.linspace(1, 0, nr)
    return sig * env


def filtro(sig, lo=0.0, hi=SR / 2):
    """Paso banda ideal por FFT (suficiente para ruido y colchones)."""
    spec = np.fft.rfft(sig)
    f = np.fft.rfftfreq(len(sig), 1 / SR)
    spec[(f < lo) | (f > hi)] = 0
    return np.fft.irfft(spec, len(sig))


# ---------- instrumentos ----------
def piano(f, dur=1.5):
    t = tt(dur)
    s = sum((1 / k) * np.sin(2 * np.pi * k * f * t) * np.exp(-t * (1.8 + 1.4 * k)) for k in range(1, 7))
    return ataque(s, 0.003, 0.05)


def pluck(f, dur=0.35):
    t = tt(dur)
    s = sum((1 / k) * np.sin(2 * np.pi * k * f * t) * np.exp(-t * (6 + 5 * k)) for k in range(1, 9))
    return ataque(s, 0.002, 0.03)


def campana(f, dur=1.2):
    t = tt(dur)
    s = np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 6) + 0.2 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 9)
    return ataque(s * np.exp(-t * 3.2), 0.001, 0.05)


def caja_musica(f, dur=1.6):
    t = tt(dur)
    s = np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * f * 4.0 * t) * np.exp(-t * 10) + 0.15 * np.sin(2 * np.pi * f * 6.3 * t) * np.exp(-t * 14)
    return ataque(s * np.exp(-t * 2.4), 0.001, 0.08)


def colchon(fs, dur, brillo=6):
    t = tt(dur)
    s = np.zeros(len(t))
    for f in fs:
        for det in (-0.004, 0, 0.005):
            ff = f * (1 + det)
            s += sum(((-1) ** k) / k * np.sin(2 * np.pi * k * ff * t + det * 300) for k in range(1, brillo + 1))
    s /= len(fs) * 3
    return ataque(s, min(0.6, dur / 3), min(0.8, dur / 3))


def bajo(f, dur=0.25, sucio=0.0):
    t = tt(dur)
    s = np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * 2 * f * t) + 0.25 * np.sin(2 * np.pi * 3 * f * t)
    if sucio:
        s = np.tanh(s * (1 + sucio * 4))
    return ataque(s * np.exp(-t * 4), 0.004, 0.03)


def silbido(f, dur=0.5):
    t = tt(dur)
    vib = 1 + 0.008 * np.sin(2 * np.pi * 5.5 * t)
    fase = 2 * np.pi * np.cumsum(f * vib) / SR
    s = np.sin(fase) + 0.1 * np.sin(2 * fase)
    return ataque(s, 0.03, 0.08)


def metal(f, dur=0.3):
    """Ataque de metales sintéticos (sierra brillante)."""
    t = tt(dur)
    s = sum(((-1) ** k) / k * np.sin(2 * np.pi * k * f * t) for k in range(1, 14))
    return ataque(np.tanh(s * 1.4) * np.exp(-t * 3), 0.01, 0.05)


def bombo(dur=0.4, f0=130, f1=42):
    t = tt(dur)
    f = f1 + (f0 - f1) * np.exp(-t * 30)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9)
    return ataque(s, 0.001, 0.02)


def caja(dur=0.22):
    t = tt(dur)
    s = 0.7 * filtro(rs.standard_normal(len(t)), 900, 9000) * np.exp(-t * 18) + 0.5 * np.sin(2 * np.pi * 185 * t) * np.exp(-t * 25)
    return ataque(s, 0.001, 0.02)


def charles(dur=0.06):
    t = tt(dur)
    return ataque(filtro(rs.standard_normal(len(t)), 7000, 16000) * np.exp(-t * 60), 0.001, 0.01)


def tic(dur=0.03):
    t = tt(dur)
    return np.sin(2 * np.pi * 2400 * t) * np.exp(-t * 200)


def platillo(dur=2.0):
    t = tt(dur)
    return ataque(filtro(rs.standard_normal(len(t)), 4000, 15000) * np.exp(-t * 2.2), 0.002, 0.2)


def ruido(dur, lo, hi):
    return filtro(rs.standard_normal(int(SR * dur)), lo, hi)


def sube(dur, lo=200, hi=6000):
    """Barrido de ruido ascendente (riser)."""
    n = int(SR * dur)
    out = np.zeros(n)
    seg = n // 16
    for k in range(16):
        f = lo * (hi / lo) ** (k / 15)
        out[k * seg:(k + 1) * seg] = ruido(seg / SR, f * 0.6, f * 1.4)
    return out * np.linspace(0.05, 1, n) ** 2


ACORDES = {
    'Am': ['A3', 'C4', 'E4'], 'F': ['F3', 'A3', 'C4'], 'C': ['C4', 'E4', 'G4'], 'G': ['G3', 'B3', 'D4'],
    'Em': ['E3', 'G3', 'B3'], 'Dm': ['D3', 'F3', 'A3'], 'D': ['D4', 'F#4', 'A4'], 'Bm': ['B3', 'D4', 'F#4'],
}


def acorde(nombre, octava=0):
    return [hz(n) * 2 ** octava for n in ACORDES[nombre]]


BEAT = 0.5

# ======== 0–6 s: el reloj y el motivo ========
for k in range(11):
    poner(0.6 + k * BEAT, tic(), 0.25, 0.3 if k % 2 else -0.3)
poner(0.0, colchon(acorde('Am', -1), 6.2, 4), 0.22)
motivo = ['A4', 'E5', 'C5', 'B4', 'A4', 'E5', 'D5', 'C5', 'B4', 'G4']
for k, n in enumerate(motivo):
    poner(1.0 + k * BEAT, piano(hz(n), 1.4), 0.35, -0.1)
poner(3.0, sube(3.0, 150, 3000), 0.12)

# ======== 6–12 s: la marea y el metro ========
for k, (ch, root) in enumerate([('Am', 'A1'), ('F', 'F1'), ('G', 'G1')]):
    t0 = 6 + k * 2
    poner(t0, colchon(acorde(ch), 2.1, 6), 0.2)
    for b in range(8):
        poner(t0 + b * 0.25, bajo(hz(root), 0.24, 0.3), 0.32)
    for b in range(4):
        poner(t0 + b * BEAT, bombo(), 0.7)
        poner(t0 + b * BEAT + 0.25, charles(), 0.18, 0.4)
for k, n in enumerate(['A5', 'E5', 'A5', 'C6', 'B5', 'G5', 'E5', 'D5', 'C5', 'B4', 'C5', 'D5']):
    poner(6 + k * 0.5, pluck(hz(n)), 0.16, 0.3)
poner(9.6, campana(hz('E5')), 0.25)
poner(9.95, campana(hz('A5')), 0.25)
poner(10.3, campana(hz('C6'), 2.0), 0.3)
poner(10.0, sube(2.0, 300, 9000), 0.22)

# ======== 12–20 s: la ciudad de los anuncios (jingle irónico en Do mayor) ========
poner(12.0, platillo(2.5), 0.25)
prog = [('C', 'C2'), ('G', 'G1'), ('Am', 'A1'), ('F', 'F1')]
lead = [
    ['E5', 'G5', 'E5', 'C5', 'D5', 'E5', 'G5', None],
    ['D5', 'G5', 'D5', 'B4', 'C5', 'D5', 'B4', None],
    ['C5', 'E5', 'A5', 'G5', 'E5', 'C5', 'E5', None],
    ['F5', 'E5', 'D5', 'C5', 'A4', 'C5', 'D5', None],
]
for k, (ch, root) in enumerate(prog):
    t0 = 12 + k * 2
    poner(t0, colchon(acorde(ch), 2.05, 8), 0.16)
    for b in range(4):
        poner(t0 + b * BEAT, bombo(0.3, 150, 50), 0.6)
        poner(t0 + b * BEAT + 0.25, charles(), 0.2, 0.3)
        if b % 2:
            poner(t0 + b * BEAT, caja(), 0.35)
        poner(t0 + b * BEAT, bajo(hz(root), 0.2), 0.3)
        poner(t0 + b * BEAT + 0.25, bajo(hz(root) * 2, 0.15), 0.18)
    for b, n in enumerate(lead[k]):
        if n:
            poner(t0 + b * 0.25, pluck(hz(n), 0.3), 0.3, -0.2)
            poner(t0 + b * 0.25, pluck(hz(n) * 2, 0.2), 0.08, 0.3)
# "AGOTADO": golpe disonante
poner(17.0, metal(hz('Bb3'), 0.6), 0.25)
poner(17.0, metal(hz('E4'), 0.6), 0.2)

# ======== 20–28 s: Black Friday ========
for k in range(3):
    t0 = 20.4 + k * 0.53
    poner(t0, bombo(0.6, 90, 35), 1.0)
    poner(t0, metal(hz('E2') * (1 + k * 0.06), 0.45), 0.35)
poner(20.4, sube(1.6, 200, 8000), 0.3)
poner(22.0, platillo(3.0), 0.45)
poner(22.0, bombo(0.8, 160, 30), 1.0)
riff = ['E2', 'E2', 'G2', 'E2', 'A2', 'E2', 'Bb2', 'A2']
t = 22.0
k = 0
while t < 27.0:
    poner(t, bajo(hz(riff[k % 8]), 0.13, 0.9), 0.32)
    poner(t, charles(0.04), 0.16, 0.5 if k % 2 else -0.5)
    if k % 2 == 0:
        poner(t, bombo(0.25, 140, 45), 0.55)
    if k % 4 == 2:
        poner(t, caja(), 0.35)
    if k % 8 == 0:
        for n in ('E4', 'G4', 'B4'):
            poner(t, metal(hz(n), 0.25), 0.11)
    t += 0.125
    k += 1
poner(24.5, sube(2.4, 400, 10000), 0.25)
# silencio repentino y campanita de caja registradora
poner(27.08, campana(hz('E6'), 1.0), 0.3)
poner(27.18, campana(hz('A6'), 1.0), 0.3)
poner(27.3, piano(hz('C4'), 1.5), 0.2)
poner(27.3, piano(hz('E4'), 1.5), 0.2)

# ======== 28–32.5 s: el coche rojo (soleado) ========
for k, (ch, root) in enumerate([('C', 'C2'), ('F', 'F1')]):
    t0 = 28 + k * 2
    poner(t0, colchon(acorde(ch), 2.1, 6), 0.2)
    for b in range(4):
        poner(t0 + b * BEAT, bombo(0.3, 140, 50), 0.5)
        poner(t0 + b * BEAT + 0.25, charles(), 0.15)
        poner(t0 + b * BEAT, bajo(hz(root), 0.4), 0.28)
t = 28.0
for n, d in [('G5', 0.5), ('E5', 0.5), ('C6', 0.5), ('G5', 0.5), ('A5', 0.5), ('F5', 0.5), ('C6', 0.75), ('A5', 0.25)]:
    poner(t, silbido(hz(n), d), 0.22, 0.1)
    t += d
poner(32.0, silbido(hz('G5'), 0.5), 0.2)
# frenazo: tono que cae
tdes = tt(0.6)
poner(32.5, np.sin(2 * np.pi * np.cumsum(700 * np.exp(-tdes * 4)) / SR) * np.exp(-tdes * 3), 0.2)

# ======== 32.5–36 s: atasco y lluvia ========
poner(32.6, colchon(acorde('Am', -1), 3.5, 4), 0.25)
poner(32.6, colchon([hz('E2')], 3.5, 3), 0.2)
lluvia = ruido(3.4, 2500, 9000) * np.linspace(0, 1, int(SR * 3.4)) ** 0.5
poner(33.0, ataque(lluvia, 0.5, 0.3), 0.05)
for k, t0 in enumerate([32.7, 33.25, 33.6, 34.1, 34.5]):
    tb = tt(0.28)
    f = 330 if k % 2 else 392
    pito = np.tanh(3 * np.sign(np.sin(2 * np.pi * f * tb)) * 0.5 + np.sin(2 * np.pi * f * 1.26 * tb))
    poner(t0, ataque(pito, 0.01, 0.04), 0.06, -0.6 if k % 2 else 0.6)
for k, n in enumerate(['E5', 'D5', 'C5', 'B4', 'A4']):
    poner(33.3 + k * 0.6, piano(hz(n), 1.6), 0.28)

# ======== 36–40.5 s: alcohol y pastillas ========
poner(36.0, colchon([hz('D2'), hz('A2')], 4.6, 5), 0.28)
for k in range(5):
    t0 = 36.2 + k * 0.9
    poner(t0, bombo(0.3, 80, 40), 0.45)
    poner(t0 + 0.18, bombo(0.3, 70, 38), 0.3)
for k, n in enumerate(['F4', 'E4', 'D4', 'A3']):
    poner(36.4 + k * 0.55, piano(hz(n), 1.4), 0.25)
poner(38.5, colchon([hz('A5'), hz('E6')], 2.0, 2), 0.12)
for k in range(10):
    poner(39.6 + k * 0.08, campana(hz('C6') * (1 + 0.12 * (k % 5)), 0.4), 0.09, (k % 3 - 1) * 0.5)
poner(39.8, sube(0.7, 800, 12000), 0.18)

# ======== 40.5–44 s: alucinación (Re mayor, brillante) ========
poner(40.5, platillo(1.5), 0.2)
for k, ch in enumerate(['D', 'Bm', 'G', 'D']):
    t0 = 40.5 + k * 0.875
    poner(t0, colchon(acorde(ch), 0.95, 5), 0.18)
    notas = acorde(ch, 1) + [acorde(ch, 1)[0] * 2]
    for j in range(7):
        poner(t0 + j * 0.125, campana(notas[j % 4] * (1.004 if j % 2 else 1), 0.6), 0.12, 0.6 if j % 2 else -0.6)
    poner(t0, bombo(0.3, 130, 55), 0.4)
for k, n in enumerate(['F#5', 'A5', 'D6', 'A5', 'B5', 'D6', 'G5', 'F#5']):
    poner(40.5 + k * 0.44, silbido(hz(n), 0.4), 0.15)

# ======== 44–50 s: los colores se apagan, la caída y el planeta ========
tc = tt(1.2)
caida = np.sin(2 * np.pi * np.cumsum(hz('D5') * np.exp(-tc * 1.6)) / SR) * np.exp(-tc * 1.2)
poner(44.0, caida, 0.2)
viento = ruido(5.8, 150, 1200)
viento *= 0.6 + 0.4 * np.sin(np.linspace(0, 9, len(viento)))
poner(44.2, ataque(viento, 1.0, 1.0), 0.1)
poner(45.0, colchon([hz('D3'), hz('A3'), hz('E4')], 2.6, 4), 0.18)
poner(47.4, bombo(1.2, 70, 28), 0.9)
poner(47.4, colchon([hz('D2'), hz('A2'), hz('F3'), hz('E4')], 2.8, 7), 0.3)
poner(46.0, sube(1.4, 100, 5000), 0.15)

# ======== 50–55.3 s: la oficina ========
for k in range(10):
    poner(50.3 + k * BEAT, tic(), 0.22, 0.3 if k % 2 else -0.3)
poner(50.0, colchon(acorde('Am', -1), 5.4, 4), 0.2)
for k, n in enumerate(['A4', 'E5', 'C5', 'B4', 'A4', 'E5', 'D5', 'C5']):
    poner(50.5 + k * 0.6, piano(hz(n), 1.4), 0.3)
tension = colchon([hz('E5'), hz('F5')], 2.2, 3)
poner(53.1, tension * np.linspace(0, 1, len(tension)) ** 2, 0.25)
poner(53.5, sube(1.8, 200, 9000), 0.28)

# ======== 55.3 s: ¡CLAC! ========
poner(55.3, bombo(0.6, 200, 30), 1.4)
poner(55.3, ruido(0.12, 200, 12000) * np.exp(-tt(0.12) * 30), 0.9)
tm = tt(1.0)
poner(55.3, sum(np.sin(2 * np.pi * f * tm) for f in (523, 1307, 2213, 3301)) * np.exp(-tm * 7) / 4, 0.4)
corte = int(55.48 * SR)
fin_corte = int(56.1 * SR)
fade = np.linspace(1, 0, int(0.08 * SR))
L[corte:corte + len(fade)] *= fade
R[corte:corte + len(fade)] *= fade
L[corte + len(fade):fin_corte] = 0
R[corte + len(fade):fin_corte] = 0

# ======== 56–60 s: caja de música ========
for k, n in enumerate(['A5', 'E6', 'C6', 'B5', 'A5', 'E6', 'D6', 'C6']):
    poner(56.3 + k * 0.42, caja_musica(hz(n), 1.6), 0.25 * (1 - k * 0.07), 0.2 if k % 2 else -0.2)
poner(56.3, colchon(acorde('Am'), 3.6, 2), 0.08)

# ---------- eco/reverb, mezcla y exportación ----------
def eco(x, taps):
    y = x.copy()
    for d, g in taps:
        n = int(d * SR)
        y[n:] += x[:-n] * g
    return y


taps_l = [(0.031, 0.25), (0.047, 0.2), (0.071, 0.16), (0.113, 0.12), (0.187, 0.08), (0.375, 0.1)]
taps_r = [(0.037, 0.25), (0.053, 0.2), (0.083, 0.16), (0.127, 0.12), (0.211, 0.08), (0.375, 0.1)]
L2, R2 = eco(L, taps_l), eco(R, taps_r)
L2[corte + len(fade):fin_corte] = 0
R2[corte + len(fade):fin_corte] = 0
mix = np.stack([L2, R2], axis=1)
mix = np.tanh(mix / np.max(np.abs(mix)) * 1.3)
mix *= 0.89 / np.max(np.abs(mix))
fin = np.linspace(1, 0, int(0.6 * SR))
mix[-len(fin):] *= fin[:, None]

salida = Path(__file__).with_name('musica.wav')
with wave.open(str(salida), 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix * 32767).astype('<i2').tobytes())
print('listo:', salida)
