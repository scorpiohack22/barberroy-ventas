# usage: python3 mkenv.py vN.wav out.json phrase_starts_json_or_-   -> {"dur","env","phr"}
import sys, json, wave, numpy as np
f, out = sys.argv[1], sys.argv[2]; phr = json.loads(sys.argv[3]) if len(sys.argv) > 3 and sys.argv[3] != '-' else [0]
w = wave.open(f); sr = w.getframerate(); x = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(float)
if w.getnchannels() > 1: x = x.reshape(-1, w.getnchannels()).mean(1)
dur = round(len(x) / sr, 2); hop = sr // 30; N = int(dur * 30); env = np.zeros(N)
for i in range(N):
    s = x[i*hop:(i+1)*hop]
    if len(s): env[i] = np.sqrt(np.mean(s**2))
m = np.percentile(env[env > 0], 92); env = np.clip(env / m, 0, 1); env[env < .1] = 0
sm = np.zeros(N); a = 0
for i in range(N):
    a = env[i] if env[i] > a else a * .55 + env[i] * .45; sm[i] = a
json.dump({'dur': dur, 'env': [round(float(v), 3) for v in sm], 'phr': phr}, open(out, 'w'))
print('dur', dur)
