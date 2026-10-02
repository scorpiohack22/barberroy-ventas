"""
Diseño sonoro del tutorial (SIN música): clics, tecleo, whooshes, pops,
risers, impactos y "dings", sincronizados con src/timeline.json.

Los primeros 10,17 s quedan en silencio aquí: suena solo el audio original
del video (va en la pista de public/gato.mp4).

Genera public/sfx.wav (48 kHz, estéreo).  Uso: python3 scripts/sfx.py
Versión horizontal: python3 scripts/sfx.py timelineH.json sfx-h.wav
"""
import json
import sys
import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
TL_FILE = sys.argv[1] if len(sys.argv) > 1 else "timeline.json"
OUT_FILE = sys.argv[2] if len(sys.argv) > 2 else "sfx.wav"
TL = json.loads((ROOT / "src" / TL_FILE).read_text())
SR = 48000
N = int(SR * TL["duration"])
rng = np.random.default_rng(3)
buf = np.zeros((N, 2))


def ax(d):
    return np.arange(int(SR * d)) / SR


def place(sig, at, gain=1.0, pan=0.0):
    i = int(at * SR)
    if i >= N or i < 0:
        return
    sig = sig[: N - i] * gain
    buf[i : i + len(sig), 0] += sig * np.cos((pan + 1) * np.pi / 4) * 1.414
    buf[i : i + len(sig), 1] += sig * np.sin((pan + 1) * np.pi / 4) * 1.414


def smooth(x, n):
    if n <= 1:
        return x
    c = np.cumsum(np.concatenate([[0.0], x]))
    y = (c[n:] - c[:-n]) / n
    return np.concatenate([y, np.zeros(len(x) - len(y))])


def hp(x, n):
    return x - smooth(x, n)


# ------------------------------------------------------------ sonidos
def click():
    t = ax(0.06)
    tick = np.sin(2 * np.pi * 3200 * t) * np.exp(-t * 260)
    body = np.sin(2 * np.pi * 190 * t) * np.exp(-t * 90)
    n = hp(rng.standard_normal(len(t)), 6) * np.exp(-t * 500)
    return tick * 0.5 + body * 0.6 + n * 0.25


def key():
    t = ax(0.035)
    f = rng.uniform(1800, 3200)
    n = hp(rng.standard_normal(len(t)), 4) * np.exp(-t * 320)
    return n * 0.6 + np.sin(2 * np.pi * f * t) * np.exp(-t * 400) * 0.25


def whoosh(d=0.38, up=True):
    t = ax(d)
    n = rng.standard_normal(len(t))
    env = np.sin(np.pi * t / d) ** 2
    lo, hi = smooth(n, 30) * 5, smooth(n, 6) * 1.6
    mix = (t / d) if up else (1 - t / d)
    return (lo * (1 - mix) + hi * mix) * env * 0.55


def pop(f0=900, f1=320):
    t = ax(0.12)
    f = np.geomspace(f0, f1, len(t))
    ph = 2 * np.pi * np.cumsum(f) / SR
    out = np.sin(ph) * np.exp(-t * 34) * 0.8
    c = click()
    out[: len(c)] += c * 0.25
    return out


def riser(d):
    t = ax(d)
    f = np.geomspace(180, 1400, len(t))
    ph = 2 * np.pi * np.cumsum(f) / SR
    saw = 2 * ((ph / (2 * np.pi)) % 1) - 1
    n = hp(rng.standard_normal(len(t)), 3)
    env = (t / d) ** 2
    return (smooth(saw, 6) * 0.35 + n * 0.25 * (t / d)) * env


def impact():
    t = ax(0.7)
    f = np.geomspace(110, 40, len(t))
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 6)
    crack = hp(rng.standard_normal(len(t)), 3) * np.exp(-t * 40)
    return sub * 0.9 + crack * 0.35


def ding(notes=(1318.5, 1975.5)):
    t = ax(0.9)
    out = np.zeros(len(t))
    for k, f in enumerate(notes):
        d = int(k * 0.07 * SR)
        s = (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * f * 2.01 * t)) * np.exp(-t * 6)
        out[d:] += s[: len(t) - d]
    return out * 0.4


def blip(f):
    t = ax(0.05)
    return np.sin(2 * np.pi * f * t) * np.exp(-t * 90) * 0.5


# ------------------------------------------------------------ partitura
H, T, S1, S2, S3, E = TL["hook"], TL["title"], TL["step1"], TL["step2"], TL["step3"], TL["end"]

# Corte del video original al tutorial
place(impact(), H["from"], 0.8)
place(whoosh(0.3), H["from"] - 0.12, 0.7)
place(pop(), H["from"] + 0.12, 0.45)


def typing(a, b, pan=0.0):
    t = a
    while t < b:
        place(key(), t, rng.uniform(0.25, 0.45), pan + rng.uniform(-0.2, 0.2))
        t += rng.uniform(0.045, 0.085)


typing(H["typeA"], H["typeB"])
place(click(), H["send"], 0.8)
place(whoosh(0.35), H["send"] + 0.05, 0.8)

# Título
place(whoosh(0.3, up=False), T["from"] - 0.08, 0.6)
place(pop(1100, 380), T["from"] + 0.05, 0.6)
place(pop(1300, 450), T["from"] + 0.17, 0.5)
place(pop(), T["pill"], 0.5)
place(ding((1568, 2093)), T["from"] + 0.12, 0.35)

clicks = [
    S1["chip"], S1["option"], S1["prompt"], S1["aspect"], S1["generate"], S1["select"],
    S2["chip"], S2["option"], S2["prompt"], S2["duration"], S2["generate"],
    S3["download"], E["follow"],
]
for c in clicks:
    place(click(), c, 0.9, rng.uniform(-0.15, 0.15))

# Pasos y popovers
for at in (S1["pill"], S2["pill"], S3["pill"]):
    place(pop(700, 260), at, 0.55)
    place(whoosh(0.25), at - 0.1, 0.4)
for at in (S1["chip"], S2["chip"]):
    place(pop(1200, 600), at + 0.06, 0.35)

# Tecleo de los prompts
typing(S1["typeA"], S1["typeB"])
typing(S2["typeA"], S2["typeB"])

# Generar imagen: riser -> impacto -> pops de las 4 tarjetas
place(riser(S1["reveal"] - S1["generate"]), S1["generate"], 0.55)
place(impact(), S1["reveal"], 0.7)
for i in range(4):
    place(pop(900 + i * 120, 330 + i * 40), S1["reveal"] + i * 0.08, 0.45, (-0.4, 0.4, -0.4, 0.4)[i])
place(ding((1760, 2349)), S1["select"] + 0.05, 0.3)

# Insertos con tus fotos
for ins in (TL["insertA"], TL["insertB"]):
    place(whoosh(0.3), ins["from"] - 0.1, 0.75)
    place(pop(), ins["from"] + 0.15, 0.45)
    place(whoosh(0.28, up=False), ins["to"] - 0.08, 0.55)

# Generar video: riser largo con ticks de progreso -> impacto + ding
place(riser(S2["reveal"] - S2["generate"]), S2["generate"], 0.6)
k = 0
t = S2["generate"] + 0.1
while t < S2["reveal"] - 0.05:
    place(blip(700 + k * 45), t, 0.25)
    t += 0.12
    k += 1
place(impact(), S2["reveal"], 0.85)
place(ding(), S2["reveal"] + 0.05, 0.45)
place(pop(1200, 500), S2["slot"], 0.4)

# Descarga
place(ding((1975.5, 2637)), S3["toast"], 0.45)
place(pop(), S3["toast"], 0.4)

# Auto-zoom de la cámara: whoosh suave en cada cambio de zoom
cam = TL["camera"]
for a, b in zip(cam, cam[1:]):
    if abs(b[1] - a[1]) > 0.15 and b[0] - a[0] < 0.5:
        place(whoosh(0.3), a[0] - 0.02, 0.3)

# Cierre
place(impact(), E["from"], 0.75)
place(whoosh(0.3), E["from"] - 0.1, 0.6)
place(whoosh(0.3), E.get("photo", E["cta"] - 0.05) - 0.1, 0.6)
place(pop(), E["cta"], 0.55)
place(ding((1568, 2349)), E["follow"] + 0.03, 0.5)

# Nada antes del final del video original
buf[: int(H["from"] * SR) - int(0.15 * SR)] = 0

# Limitador suave: más pegada sin saturar
peak = np.max(np.abs(buf))
drive = 2.2
out = np.tanh(buf / peak * drive) / np.tanh(drive) * 10 ** (-1 / 20)
pcm = (out * 32767).astype("<i2")
with wave.open(str(ROOT / "public" / OUT_FILE), "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print("public/" + OUT_FILE, round(N / SR, 2), "s")
