"""
Música + diseño sonoro sintetizados por código, sincronizados con las escenas.

Versión para el video de 1 minuto sobre esta conversación: no hay narración,
así que la música lleva el ritmo y los efectos van muy suaves.
Genera public/musica.wav (48 kHz, estéreo).

Uso:  python3 scripts/sound.py      (requiere numpy)
"""
import wave
import numpy as np

SR = 48000
DUR = 60.0
N = int(SR * DUR)
rng = np.random.default_rng(7)


def t_axis(d):
    return np.arange(int(SR * d)) / SR


def env_exp(d, k):
    return np.exp(-t_axis(d) * k)


def place(buf, sig, at, gain=1.0, pan=0.0):
    i = int(at * SR)
    if i >= len(buf):
        return
    sig = sig[: len(buf) - i] * gain
    l = np.cos((pan + 1) * np.pi / 4)
    r = np.sin((pan + 1) * np.pi / 4)
    buf[i : i + len(sig), 0] += sig * l * 1.414
    buf[i : i + len(sig), 1] += sig * r * 1.414


def smooth(x, n):
    """Pasa-bajos barato (media móvil)."""
    if n <= 1:
        return x
    c = np.cumsum(np.concatenate([[0.0], x]))
    y = (c[n:] - c[:-n]) / n
    return np.concatenate([y, np.zeros(len(x) - len(y))])


def note(m):
    return 440.0 * 2 ** ((m - 69) / 12)


# ---------------------------------------------------------------- SFX
def whoosh(d=0.45, bright=1.0):
    t = t_axis(d)
    n = rng.standard_normal(len(t))
    low = smooth(n, 40) * 6
    mid = smooth(n, 8) * 2.2
    sweep = np.sin(np.pi * t / d) ** 2
    x = (low * (1 - t / d) + mid * (t / d) * bright) * sweep
    return x * 0.5


def click(d=0.03):
    t = t_axis(d)
    return (rng.standard_normal(len(t)) * np.exp(-t * 900) * 0.5 + np.sin(2 * np.pi * 2400 * t) * np.exp(-t * 300) * 0.4)


def pop(f0=900, f1=320, d=0.12):
    t = t_axis(d)
    f = f1 + (f0 - f1) * np.exp(-t * 40)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t * 32) * 0.7


def tick(f=4200, d=0.02):
    t = t_axis(d)
    return np.sin(2 * np.pi * f * t) * np.exp(-t * 400) * 0.35


def impact(d=1.4, sub=0.7):
    t = t_axis(d)
    f = 40 + 70 * np.exp(-t * 18)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t * 3.2) * sub
    n = smooth(rng.standard_normal(len(t)), 12) * np.exp(-t * 22) * 1.5
    return (body + n) * 0.55


def riser(d=2.9):
    t = t_axis(d)
    n = rng.standard_normal(len(t))
    k = t / d
    noise = smooth(n, 30) * 4 * (1 - k) + smooth(n, 3) * k
    f = 180 * 2 ** (k * 2.3)
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.25
    return (noise * 0.35 + tone) * k ** 2.2


def chime():
    out = np.zeros(int(SR * 1.0))
    for i, (fq, at) in enumerate([(1318.5, 0.0), (1760.0, 0.09)]):
        t = t_axis(0.9)
        s = (np.sin(2 * np.pi * fq * t) + 0.3 * np.sin(2 * np.pi * fq * 2.01 * t)) * np.exp(-t * 6)
        j = int(at * SR)
        out[j : j + len(s)] += s[: len(out) - j] * 0.4
    return out


def processing(d=0.7):
    out = np.zeros(int(SR * d))
    k = 0.0
    while k < d - 0.03:
        f = rng.uniform(1800, 4200)
        s = tick(f, 0.025) * rng.uniform(0.5, 1.0)
        j = int(k * SR)
        out[j : j + len(s)] += s[: len(out) - j]
        k += rng.uniform(0.03, 0.06)
    return out


def typing(d):
    out = np.zeros(int(SR * d))
    k = 0.0
    while k < d - 0.02:
        s = click(0.02) * rng.uniform(0.25, 0.45)
        j = int(k * SR)
        out[j : j + len(s)] += s[: len(out) - j]
        k += rng.uniform(0.045, 0.085)
    return out


def shimmer(d=1.2):
    t = t_axis(d)
    x = np.zeros(len(t))
    for _ in range(8):
        f = rng.uniform(2500, 7000)
        x += np.sin(2 * np.pi * f * t + rng.uniform(0, 6)) * np.exp(-t * rng.uniform(3, 7))
    return x * 0.06


def strike():
    a = pop(1300, 160, 0.18) * 0.8
    w = whoosh(0.18, 1.5) * 0.25
    a[: len(w)] += w[: len(a)]
    return a


def dissolve(d=0.6):
    out = np.zeros(int(SR * d))
    for i in range(40):
        k = i / 40 * (d - 0.05)
        s = tick(3800 - 2800 * (k / d), 0.02) * (1 - k / d)
        j = int(k * SR)
        out[j : j + len(s)] += s[: len(out) - j]
    return out + whoosh(d, 1.4)[: len(out)] * 0.3


def counter_ticks(a, b, every=0.07, f=3600, g=0.35):
    sig = np.zeros(int(SR * (b - a + 0.05)))
    k = 0.0
    while k < b - a:
        s = tick(f, 0.015) * g * (1 - 0.5 * k / (b - a))
        j = int(k * SR)
        sig[j : j + len(s)] += s[: len(sig) - j]
        k += every
    return sig



sfx = np.zeros((N, 2))
E = [
    # (tiempo, señal, ganancia, paneo) — cada efecto acompaña una acción visual
    (0.35, pop(), 0.3, 0),
    (0.6, typing(1.1), 0.6, 0),
    (1.85, pop(500, 220, 0.15), 0.35, 0),  # error del comando
    (4.85, whoosh(0.5), 0.35, 0),
    (5.6, typing(0.5), 0.5, 0.3),
    (6.5, pop(), 0.25, -0.3),
    (7.1, typing(0.35), 0.5, 0.3),
    (7.6, processing(2.9), 0.35, 0.3),  # render
    (10.6, chime(), 0.35, 0.3),
    (12.85, whoosh(0.5), 0.35, 0),
    (14.0, pop(), 0.22, -0.5), (15.0, pop(), 0.22, 0.5), (16.2, pop(), 0.22, -0.5), (17.4, pop(), 0.22, 0.5), (18.6, pop(), 0.22, 0.5),
    (21.85, whoosh(0.5), 0.35, 0),
    (23.6, processing(4.6), 0.18, -0.2),  # transcripción
    (25.6, whoosh(0.4, 1.2), 0.25, 0.6),
    (28.4, counter_ticks(0, 0.8, 0.12, 2600, 0.5), 0.5, 0),
    (33.85, whoosh(0.5), 0.35, 0),
    (35.9, whoosh(0.6, 0.6), 0.25, 0.3),  # bajan los efectos
    (37.0, click(), 0.4, -0.3),
    (41.85, whoosh(0.5), 0.35, 0),
    (43.0, click(), 0.45, 0.2),
    (43.4, typing(1.5), 0.5, 0),
    (45.35, click(), 0.45, 0.2),
    (45.5, chime(), 0.35, 0),
    (46.9, pop(), 0.22, 0.4), (47.7, pop(700, 260), 0.22, 0.4), (48.5, pop(700, 260), 0.22, 0.4), (49.5, pop(1100, 450), 0.28, 0.4),
    (51.85, whoosh(0.7), 0.35, 0),
    (52.2, shimmer(1.5), 0.6, 0),
    (52.3, counter_ticks(0, 1.4, 0.06, 3000, 0.35), 0.4, 0),
    (54.6, impact(1.2, 0.6), 0.3, 0),
]
for at, sig, g, pan in E:
    place(sfx, sig, at, g, pan)

# ---------------------------------------------------------------- MÚSICA
BEAT = 0.5  # 120 BPM
CHORDS = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]  # Am F C G
T = np.arange(N) / SR


def section_curve(points):
    xs, ys = zip(*points)
    return np.interp(T, xs, ys)


# Evolución: intrigante → construcción → revelación → clímax → cierre
pad_lvl = section_curve([(0, 0.0), (1.0, 0.6), (5, 0.7), (22, 0.85), (42, 0.9), (52, 1.0), (58, 0.8), (60, 0.0)])
bright = section_curve([(0, 0.15), (5, 0.3), (13, 0.5), (22, 0.6), (34, 0.4), (42, 0.55), (52, 0.9), (60, 0.5)])
arp_lvl = section_curve([(0, 0), (2.0, 0), (5.0, 0.45), (13, 0.6), (34, 0.4), (42, 0.6), (52, 0.9), (59, 0.3), (60, 0)])
drum_lvl = section_curve([(0, 0), (4.8, 0), (5.0, 0.8), (33.8, 0.8), (34.0, 0.4), (41.8, 0.4), (42, 0.9), (57.5, 0.9), (58, 0), (60, 0)])

pad = np.zeros(N)
for i in range(int(DUR / 2) + 1):
    ch = CHORDS[i % 4]
    a, b = i * 2.0, min(DUR, i * 2.0 + 2.25)
    ia, ib = int(a * SR), int(b * SR)
    if ia >= N:
        break
    tt = np.arange(ib - ia) / SR
    seg = np.zeros(len(tt))
    for m in ch + [ch[0] - 12]:
        f = note(m)
        for det in (-0.004, 0.0, 0.004):
            for h in range(1, 6):
                amp = (1 / h) * (bright[ia] ** (h - 1))
                seg += np.sin(2 * np.pi * f * (1 + det) * h * tt) * amp
    fade = np.minimum(1, np.minimum(tt / 0.25, (tt[-1] - tt + 1e-9) / 0.25))
    pad[ia:ib] += seg * fade * 0.035
pad *= pad_lvl

arp = np.zeros(N)
step = BEAT / 4
k = 0
while k * step < DUR:
    at = k * step
    ch = CHORDS[int(at // 2) % 4]
    m = (ch + [ch[0] + 12])[[0, 1, 2, 3, 2, 1, 2, 3][k % 8]] + 12
    tt = t_axis(0.22)
    s = np.sin(2 * np.pi * note(m) * tt) * np.exp(-tt * 18) + 0.3 * np.sin(2 * np.pi * note(m) * 2 * tt) * np.exp(-tt * 30)
    i = int(at * SR)
    arp[i : i + len(s)] += s[: N - i] * 0.05 * (0.6 if k % 2 else 1.0)
    k += 1
arp *= arp_lvl

drums = np.zeros(N)
bass = np.zeros(N)
pump = np.ones(N)
b = 0
while b * BEAT < DUR:
    at = b * BEAT
    i = int(at * SR)
    full = 5.0 <= at < 34 or at >= 42
    if (full or b % 2 == 0) and drum_lvl[min(i, N - 1)] > 0.01:
        tt = t_axis(0.35)
        f = 45 + 90 * np.exp(-tt * 30)
        kick = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 9)
        drums[i : i + len(kick)] += kick[: N - i] * 0.16
        # ducking rítmico (pump)
        pl = int(0.3 * SR)
        pump[i : i + pl] = np.minimum(pump[i : i + pl], 1 - 0.35 * np.exp(-np.arange(min(pl, N - i)) / SR * 10))
    if at >= 5.0 and drum_lvl[min(i, N - 1)] > 0.01:
        j = int((at + BEAT / 2) * SR)
        if j < N:
            hat = np.diff(rng.standard_normal(int(0.05 * SR) + 1)) * np.exp(-t_axis(0.05) * 90)
            drums[j : j + len(hat)] += hat[: N - j] * 0.03
    if full and at < 57.5:
        ch = CHORDS[int(at // 2) % 4]
        tt = t_axis(BEAT)
        s = np.sin(2 * np.pi * note(ch[0] - 24) * tt) * np.minimum(1, tt / 0.01) * np.exp(-tt * 2)
        bass[i : i + len(s)] += s[: N - i] * 0.08
    b += 1
drums *= drum_lvl
pad *= pump
arp *= 0.6 + 0.4 * pump

# Resolución final: campana suave
tt = t_axis(2.5)
bell = sum(np.sin(2 * np.pi * note(m) * tt) for m in (69, 76, 81)) * np.exp(-tt * 1.6) * 0.04
place_at = int(56.0 * SR)
music = pad + arp + drums + bass
music[place_at : place_at + len(bell)] += bell[: N - place_at]


music_st = np.stack([music, music], axis=1)
music_st[:, 0] += arp * 0.15
music_st[:, 1] -= arp * 0.15
mix = music_st * 0.6 + sfx * 0.18
fade_out = np.clip((DUR - T) / 1.5, 0, 1) * np.clip(T / 0.4, 0, 1)
mix *= fade_out[:, None]
peak = np.max(np.abs(mix))
mix *= 0.5 / peak  # sin narración: la música puede ir más presente, con margen
rms = np.sqrt(np.mean(mix ** 2))
print(f"mezcla RMS {20*np.log10(rms):.1f} dBFS · pico {20*np.log10(np.max(np.abs(mix))):.1f} dBFS")
out = (np.clip(mix, -1, 1) * 32767).astype(np.int16)
with wave.open("public/musica.wav", "w") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(out.tobytes())
print("public/musica.wav listo")
