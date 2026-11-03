"""Voz neuronal fluida (Microsoft Edge TTS, gratis) con tiempos exactos por palabra.
Uso: python3 gen_voz_edge.py <historia> [--voz es-MX-JorgeNeural] [--rate +15%]"""
import asyncio, json, os, re, subprocess, sys, wave
import ssl
import edge_tts, edge_tts.communicate as _ec

# En entornos con proxy corporativo: usar su CA y su proxy si existen
_CA = os.environ.get("SSL_CERT_FILE") or ("/root/.ccr/ca-bundle.crt" if os.path.exists("/root/.ccr/ca-bundle.crt") else None)
if _CA: _ec._SSL_CTX = ssl.create_default_context(cafile=_CA)
PROXY = os.environ.get("HTTPS_PROXY") or os.environ.get("https_proxy")

HERE = os.path.dirname(os.path.abspath(__file__))
args = sys.argv[1:]
opt = lambda k, d: args[args.index(k) + 1] if k in args else d
NAME = args[0] if args and not args[0].startswith("--") else "apolo13"
VOICE, RATE = opt("--voz", "es-MX-JorgeNeural"), opt("--rate", "+15%")
DIR = os.path.join(HERE, "historias", NAME)
g = json.load(open(os.path.join(DIR, "guion.json"), encoding="utf-8"))
SR, LEAD, GAP = 44100, 0.35, g.get("gap", 0.2)
norm = lambda s: re.sub(r"[^\wáéíóúñü]", "", s.lower())

async def synth(text, path):
    c = edge_tts.Communicate(text, VOICE, rate=RATE, boundary="WordBoundary", proxy=PROXY)
    marks = []
    with open(path, "wb") as f:
        async for ch in c.stream():
            if ch["type"] == "audio": f.write(ch["data"])
            elif ch["type"] == "WordBoundary": marks.append((ch["offset"] / 1e7, (ch["offset"] + ch["duration"]) / 1e7, ch["text"]))
    return marks

async def main():
    pcm, t, out = [b"\x00\x00" * int(SR * LEAD)], LEAD, []
    for i, ln in enumerate(g["lines"]):
        text = ln.get("tts_edge") or ln["text"].replace("*", "")
        mp3, wav_ = os.path.join(DIR, f"_l{i}.mp3"), os.path.join(DIR, f"_l{i}.wav")
        marks = await synth(text, mp3)
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", mp3, "-ac", "1", "-ar", str(SR), wav_], check=True)
        with wave.open(wav_) as w: data = w.readframes(w.getnframes())
        # recortar el silencio que añade la voz al inicio/fin de cada frase
        if marks:
            a0 = max(0, marks[0][0] - .06); a1 = min(len(data) / 2 / SR, marks[-1][1] + .14)
            data = data[int(a0 * SR) * 2:int(a1 * SR) * 2]
            marks = [(m0 - a0, m1 - a0, tx) for m0, m1, tx in marks]
        dur = len(data) / 2 / SR
        os.remove(mp3); os.remove(wav_)
        words = ln["text"].split()
        # emparejar palabras del guion con las marcas de la voz
        wt, j = [], 0
        for w in words:
            k = next((k for k in range(j, min(j + 4, len(marks))) if norm(marks[k][2]) == norm(w)), None)
            if k is None and j < len(marks): k = j
            if k is None: wt.append(None); continue
            wt.append(marks[k]); j = k + 1
        for idx, m in enumerate(wt):  # rellenar huecos
            if m is None:
                prev = next((x for x in reversed(wt[:idx]) if x), (0, 0, ""))
                wt[idx] = (prev[1], prev[1] + .25, "")
        wout = [{"w": w.replace("*", ""), "key": w.startswith("*"), "start": round(t + m[0], 3), "end": round(t + m[1], 3),
                 "brk": bool(re.search(r"[.,:;!?]$", w))} for w, m in zip(words, wt)]
        out.append({**{k: v for k, v in ln.items() if not k.startswith("tts")}, "start": round(t if i else 0, 3), "end": round(t + dur + GAP, 3), "words": wout})
        pcm += [data, b"\x00\x00" * int(SR * GAP)]
        t += dur + GAP
        print(f"  {i + 1}/{len(g['lines'])} {dur:.1f}s  ({len(marks)} marcas / {len(words)} palabras)")
    pcm.append(b"\x00\x00" * int(SR * 1.2)); t += 1.2
    with wave.open(os.path.join(DIR, "voz.wav"), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(b"".join(pcm))
    json.dump({"escenas": g.get("escenas", "escenas.js"), "estilo": g.get("estilo", "clasico"), "duration": round(t, 3), "lines": out},
              open(os.path.join(DIR, "timeline.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"OK {VOICE}: {t:.1f}s")

asyncio.run(main())
