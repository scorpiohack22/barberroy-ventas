"""
Música + diseño sonoro del reel, sintetizados por código y sincronizados con
la narración (mismos tiempos que src/timing.ts y las escenas).

Genera public/fondo.wav (48 kHz, estéreo). La narración va en una pista aparte
(public/narracion.wav); aquí solo se usa para hacer "ducking" de la música.

Uso:  python3 scripts/sound.py      (requiere numpy)
"""
import wave
import numpy as np

SR = 48000
DUR = 32.4
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
    # (tiempo, señal, ganancia, paneo)  — cada uno acompaña una acción visual
    (0.0, impact(1.2, 0.8), 0.55, 0),  # arranque: macro → plano
    (0.0, whoosh(0.9), 0.5, 0),
    (0.55, pop(), 0.35, 0.5),  # tarjeta interacciones
    (0.85, pop(800, 280), 0.35, -0.5),  # tarjeta reproducciones
    (1.81, pop(1000, 400), 0.4, -0.3),  # "Anuncio patrocinado"
    (2.45, whoosh(0.5), 0.45, 0.2),  # el teléfono gira
    (2.75, whoosh(0.4, 1.3), 0.35, 0.6),  # entra el presupuesto
    (3.3, counter_ticks(0, 1.5), 0.6, 0.3),  # contador $185.000
    (4.48, impact(1.0, 0.7), 0.5, 0),  # "fortuna"
    (5.26, pop(), 0.4, 0.4),  # modelos
    (6.0, pop(950, 330), 0.4, 0.4),  # cámaras
    (6.52, pop(1000, 360), 0.4, 0.4),  # locaciones
    (7.95, whoosh(0.5), 0.5, 0),  # zoom hacia el anuncio
    (8.25, click(), 0.5, -0.4),  # REC
    (8.95, tick(2600, 0.05), 0.6, 0.2),  # AF bloqueado
    (8.98, tick(3400, 0.05), 0.5, 0.2),
    (9.85, riser(2.87), 0.55, 0),  # construcción hacia "creer"
    (10.05, processing(1.3), 0.5, 0),  # escaneo
    (11.15, whoosh(0.8, 0.8), 0.4, -0.2),  # despiece 2.5D
    (12.70, impact(1.4, 1.0), 0.75, 0),  # "no lo podía creer"
    (12.72, shimmer(1.0), 1.0, 0),
    (13.42, whoosh(0.45), 0.45, 0),  # whip
    (13.62, pop(700, 250), 0.25, 0),
    (13.98, strike(), 0.6, -0.2),  # no había modelos
    (14.0, counter_ticks(0, 0.4, 0.05, 2400), 0.5, 0),
    (15.26, strike(), 0.6, 0.2),  # no había cámaras
    (15.28, counter_ticks(0, 0.4, 0.05, 2200), 0.5, 0),
    (17.22, dissolve(), 0.8, 0),  # la locación se desintegra
    (17.7, pop(600, 1200, 0.18), 0.35, 0),  # $0
    (18.32, whoosh(0.45), 0.5, 0),
    (18.5, pop(), 0.3, 0),  # prompt
    (18.55, typing(0.85), 0.8, 0.1),
    (19.58, click(), 0.8, 0.3),  # clic en Generar
    (19.62, processing(0.8), 0.6, 0),
    (19.80, whoosh(0.4, 1.2), 0.3, 0),
    (20.38, impact(1.6, 1.0), 0.5, 0),  # "artificial": clímax
    (20.40, shimmer(1.4), 0.9, 0),
    (20.5, pop(1100, 500), 0.25, -0.6),
    (20.6, pop(1200, 520), 0.25, 0.6),
    (21.3, whoosh(0.5), 0.5, 0),
    (21.75, counter_ticks(0, 0.7, 0.12, 2900, 0.5), 0.6, 0),  # miniaturas
    (22.45, pop(800, 300), 0.3, 0),
    (22.55, counter_ticks(0, 0.75, 0.04, 2000, 0.3), 0.6, -0.2),  # 48 → 1
    (23.04, pop(1100, 450), 0.45, 0),  # "una sola persona"
    (23.85, tick(2000, 0.06), 0.6, -0.6),  # nodos
    (24.05, tick(2400, 0.06), 0.6, -0.2),
    (24.25, tick(2800, 0.06), 0.6, 0.2),
    (24.45, tick(3200, 0.06), 0.6, 0.6),
    (24.85, chime(), 0.55, 0.4),  # campaña lista
    (25.42, whoosh(0.45), 0.45, 0),
    (26.55, pop(900, 400), 0.35, 0),  # IA
    (26.0, riser(1.8)[: int(SR * 1.8)], 0.25, 0),
    (27.76, whoosh(0.4, 1.6), 0.7, 0),  # latigazo a HOY
    (28.1, impact(1.2, 0.8), 0.45, 0),
    (28.68, pop(700, 1400, 0.2), 0.3, 0),  # "aquí"
    (29.52, whoosh(0.9, 0.7), 0.5, 0),  # se abre el muro
    (30.3, shimmer(1.5), 0.9, 0),
    (31.14, pop(), 0.35, 0),  # CTA
    (31.75, click(), 0.7, 0.2),
    (31.78, pop(800, 1300, 0.18), 0.35, 0.2),
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
pad_lvl = section_curve([(0, 0.0), (0.6, 0.55), (9.8, 0.6), (12.7, 0.9), (13.4, 0.5), (18.4, 0.75), (20.4, 1.0), (27.8, 0.9), (29.7, 1.0), (32.4, 0.0)])
bright = section_curve([(0, 0.15), (9.8, 0.25), (12.7, 0.6), (13.4, 0.25), (18.4, 0.45), (20.4, 0.9), (29.7, 0.6), (32.4, 0.4)])
arp_lvl = section_curve([(0, 0), (2.4, 0), (3.0, 0.35), (9.8, 0.45), (12.7, 0.8), (13.4, 0.3), (18.4, 0.5), (20.4, 0.9), (29.7, 0.5), (32.0, 0)])
drum_lvl = section_curve([(0, 0), (13.4, 0), (13.6, 0.4), (18.3, 0.5), (18.44, 1.0), (29.6, 1.0), (29.75, 0), (32.4, 0)])

pad = np.zeros(N)
for i in range(int(DUR / 2) + 1):
    ch = CHORDS[i % 4]
    a, b = i * 2.0, min(DUR, i * 2.0 + 2.25)
    ia, ib = int(a * SR), int(b * SR)
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
    full = at >= 18.4
    if (full or b % 2 == 0) and drum_lvl[min(i, N - 1)] > 0.01:
        tt = t_axis(0.35)
        f = 45 + 90 * np.exp(-tt * 30)
        kick = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 9)
        drums[i : i + len(kick)] += kick[: N - i] * 0.16
        # ducking rítmico (pump)
        pl = int(0.3 * SR)
        pump[i : i + pl] = np.minimum(pump[i : i + pl], 1 - 0.35 * np.exp(-np.arange(min(pl, N - i)) / SR * 10))
    if at >= 9.8 and drum_lvl[min(i, N - 1)] > 0.01 or (9.8 <= at < 13.4):
        j = int((at + BEAT / 2) * SR)
        if j < N:
            hat = np.diff(rng.standard_normal(int(0.05 * SR) + 1)) * np.exp(-t_axis(0.05) * 90)
            drums[j : j + len(hat)] += hat[: N - j] * 0.03
    if full and at < 29.7:
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
place_at = int(29.75 * SR)
music = pad + arp + drums + bass
music[place_at : place_at + len(bell)] += bell[: N - place_at]

# ---------------------------------------------------------------- DUCKING por la voz
with wave.open("public/narracion.wav") as w:
    sr_v, ch_v, n_v = w.getframerate(), w.getnchannels(), w.getnframes()
    v = np.frombuffer(w.readframes(n_v), dtype=np.int16).astype(np.float64) / 32768
v = v.reshape(-1, ch_v).mean(axis=1)
win = int(sr_v * 0.03)
rms = np.sqrt(smooth(v ** 2, win))
rms = np.interp(np.arange(N) / SR, np.arange(len(rms)) / sr_v, rms, right=0)
act = np.clip(rms / (np.percentile(rms[rms > 0.005], 60) + 1e-9), 0, 1)
act = smooth(act, int(SR * 0.12))  # suaviza ataque/liberación
duck = 1 - 0.55 * act

music_st = np.stack([music, music], axis=1)
# leve estéreo para el arpegio
music_st[:, 0] += arp * 0.15
music_st[:, 1] -= arp * 0.15
music_st *= duck[:, None]

# Los efectos también bajan cuando hablas, para que nunca tapen la voz.
sfx_duck = 1 - 0.6 * act
mix = music_st * 0.34 + sfx * 0.11 * sfx_duck[:, None]

# Niveles: música ~ -26 dB RMS y voz bastante por encima
fade_out = np.clip((DUR - T) / 0.6, 0, 1)
mix *= fade_out[:, None]
peak = np.max(np.abs(mix))
if peak > 0.9:
    mix *= 0.9 / peak

voice_rms = np.sqrt(np.mean(v[np.abs(v) > 0.01] ** 2))
mus_rms = np.sqrt(np.mean((music_st * 0.34) ** 2))
sfx_rms = np.sqrt(np.mean((sfx * 0.11 * sfx_duck[:, None]) ** 2))
print(f"efectos RMS {20*np.log10(sfx_rms):.1f} dBFS")
print(f"voz RMS {20*np.log10(voice_rms):.1f} dBFS · música RMS {20*np.log10(mus_rms):.1f} dBFS · pico mezcla {20*np.log10(np.max(np.abs(mix))):.1f} dBFS")

out = (np.clip(mix, -1, 1) * 32767).astype(np.int16)
with wave.open("public/fondo.wav", "w") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(out.tobytes())
print("public/fondo.wav listo")
