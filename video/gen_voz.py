"""Genera la voz en off (voz/voz.wav) y timeline.json a partir de guion.json."""
import json, re, subprocess, wave, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
MODEL = os.path.join(HERE, "voz", "es_MX-ald-medium.onnx")
g = json.load(open(os.path.join(HERE, "guion.json"), encoding="utf-8"))
gap, ls = g.get("gap", 0.25), g.get("lengthScale", 1.0)

def weight(w):
    clean = re.sub(r"[^\wáéíóúñü]", "", w, flags=re.I)
    p = 0.0
    if re.search(r"[.!?]$", w): p = 3.5
    elif re.search(r"[,:;]$", w): p = 2.0
    return max(len(clean), 2) + 1.5 + p, p

frames, rate, t, lines_out = [], None, 0.35, []
silence = lambda sec: b"\x00\x00" * int(rate * sec)
for i, ln in enumerate(g["lines"]):
    tts = ln.get("tts") or ln["text"].replace("*", "")
    path = os.path.join(HERE, "voz", f"l{i:02d}.wav")
    subprocess.run([sys.executable, "-m", "piper", "-m", MODEL, "-f", path, "--length-scale", str(ls)],
                   input=tts.encode(), check=True, capture_output=True)
    with wave.open(path) as w:
        rate = rate or w.getframerate()
        data = w.readframes(w.getnframes())
        dur = w.getnframes() / w.getframerate()
    if not frames: frames.append(silence(0.35))
    frames.append(data); frames.append(silence(gap))
    os.remove(path)
    # tiempos por palabra, proporcionales a su longitud (sin contar el silencio inicial/final de piper)
    words = ln["text"].split()
    ws = [weight(w) for w in words]
    total = sum(a for a, _ in ws)
    lead, tail = 0.12, 0.15
    span = dur - lead - tail
    cur = t + lead
    wout = []
    for w, (a, p) in zip(words, ws):
        d = span * a / total
        wout.append({"w": w.replace("*", ""), "key": w.startswith("*"), "start": round(cur, 3),
                     "end": round(cur + d * (a - p) / a, 3), "brk": p > 0})
        cur += d
    lines_out.append({**{k: v for k, v in ln.items() if k not in ("tts",)},
                      "start": round(t, 3), "end": round(t + dur + gap, 3), "words": wout})
    t += dur + gap

with wave.open(os.path.join(HERE, "voz", "voz.wav"), "wb") as out:
    out.setnchannels(1); out.setsampwidth(2); out.setframerate(rate)
    out.writeframes(b"".join(frames) + silence(1.2))
total = t + 1.2
json.dump({"duration": round(total, 3), "lines": lines_out}, open(os.path.join(HERE, "timeline.json"), "w", encoding="utf-8"),
          ensure_ascii=False, indent=1)
print(f"OK: {len(lines_out)} líneas, {total:.1f}s")
