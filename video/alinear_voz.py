"""Usa una narración externa (ElevenLabs, grabación, etc.) en lugar de la voz generada.
Uso: python3 alinear_voz.py <historia> <audio.mp3|wav>
Corta el audio en las pausas entre frases y genera historias/<historia>/voz.wav y timeline.json."""
import json, os, re, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
name, src = sys.argv[1], sys.argv[2]
DIR = os.path.join(HERE, "historias", name)
g = json.load(open(os.path.join(DIR, "guion.json"), encoding="utf-8"))
lines = g["lines"]
LEAD = 0.35

wav = os.path.join(DIR, "voz.wav")
subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", src, "-af", f"adelay={int(LEAD*1000)},apad=pad_dur=1.2", "-ac", "1", "-ar", "44100", wav], check=True)
dur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", wav]).decode())
log = subprocess.run(["ffmpeg", "-i", wav, "-af", "silencedetect=noise=-38dB:d=0.18", "-f", "null", "-"], capture_output=True, text=True).stderr
starts = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", log)]
ends = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", log)]
sil = list(zip(starts, ends))
speech0 = sil[0][1] if sil and sil[0][0] <= LEAD + .05 else LEAD
speech1 = next((s for s, e in reversed(sil) if e >= dur - .05), dur)

def weight(w):
    clean = re.sub(r"[^\wáéíóúñü]", "", w, flags=re.I)
    p = 3.5 if re.search(r"[.!?]$", w) else 2.0 if re.search(r"[,:;]$", w) else 0.0
    return max(len(clean), 2) + 1.5 + p, p

lw = [sum(weight(w)[0] for w in l["text"].split()) for l in lines]
tot = sum(lw); exps, acc = [], 0
for k in range(len(lines) - 1): acc += lw[k]; exps.append(speech0 + (speech1 - speech0) * acc / tot)
mid = [((s + e) / 2, s, e) for s, e in sil if s > speech0 and e < speech1]
# programación dinámica: elegir una pausa por corte, en orden, cerca de lo esperado y preferentemente larga
N, M = len(exps), len(mid)
cost = lambda k, j: min((mid[j][0] - exps[k]) ** 2, 9) - 12 * min(mid[j][2] - mid[j][1], .8)
INF = float("inf")
if M >= N:
    D = [[INF] * M for _ in range(N)]; P = [[-1] * M for _ in range(N)]
    for j in range(M): D[0][j] = cost(0, j)
    for k in range(1, N):
        best, bi = INF, -1
        for j in range(M):
            if j > 0 and D[k - 1][j - 1] < best: best, bi = D[k - 1][j - 1], j - 1
            if bi >= 0: D[k][j] = best + cost(k, j); P[k][j] = bi
    j = min(range(M), key=lambda j: D[N - 1][j]); sel = []
    for k in range(N - 1, -1, -1): sel.append(j); j = P[k][j]
    cuts = [mid[j] for j in reversed(sel)]
else:
    cuts = [(e, e, e) for e in exps]

out = []
bounds = [(speech0, None)] + [(c[2], c[1]) for c in cuts]
for i, l in enumerate(lines):
    s_speech = bounds[i][0]
    e_speech = cuts[i][1] if i < len(cuts) else speech1
    start = 0.0 if i == 0 else cuts[i - 1][0]
    end = cuts[i][0] if i < len(cuts) else dur
    words = l["text"].split(); ws = [weight(w) for w in words]; t = sum(a for a, _ in ws)
    cur, wout = s_speech, []
    for w, (a, p) in zip(words, ws):
        d = (e_speech - s_speech) * a / t
        wout.append({"w": w.replace("*", ""), "key": w.startswith("*"), "start": round(cur, 3), "end": round(cur + d * (a - p) / a, 3), "brk": p > 0})
        cur += d
    out.append({**{k: v for k, v in l.items() if k != "tts"}, "start": round(start, 3), "end": round(end, 3), "words": wout})
json.dump({"escenas": g.get("escenas", "escenas.js"), "estilo": g.get("estilo", "clasico"), "duration": round(dur, 3), "lines": out},
          open(os.path.join(DIR, "timeline.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"OK: {len(out)} líneas alineadas, {dur:.1f}s, {sum(1 for c in cuts if c[1] != c[2])}/{len(cuts)} cortes en pausas reales")
