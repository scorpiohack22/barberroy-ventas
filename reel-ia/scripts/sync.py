#!/usr/bin/env python3
"""
Sincroniza src/data/subtitulos.ts con public/voz.mp3 usando Whisper (tiempos palabra por palabra).

Uso:   python3 scripts/sync.py [--modelo small]
Requisitos: pip install -U openai-whisper   (y ffmpeg instalado)

Mantiene los textos, claves y colores de subtitulos.ts: sólo reescribe `inicio` y `fin`
de cada grupo, alineando las palabras del guion con las que Whisper reconoce en tu voz.
"""
import argparse
import difflib
import json
import re
import shutil
import subprocess
import sys
import tempfile
import unicodedata
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
VOZ = RAIZ / "public" / "voz.mp3"
SUBS = RAIZ / "src" / "data" / "subtitulos.ts"
DURACION = 60.0

LINEA = re.compile(r'^(\s*\{\s*texto:\s*"(?P<texto>[^"]*)",\s*inicio:\s*)(?P<inicio>[\d.]+)(,\s*fin:\s*)(?P<fin>[\d.]+)(.*)$')
NUMEROS = {"1": "uno", "2": "dos", "3": "tres", "4": "cuatro", "5": "cinco", "6": "seis"}


def normalizar(palabra: str) -> str:
    p = unicodedata.normalize("NFD", palabra.lower())
    p = "".join(c for c in p if unicodedata.category(c) != "Mn")
    p = re.sub(r"[^a-z0-9ñ]", "", p)
    return NUMEROS.get(p, p)


def transcribir(modelo: str):
    """Devuelve [(palabra, inicio, fin)] usando el módulo whisper o, si no, el CLI."""
    try:
        import whisper  # type: ignore

        m = whisper.load_model(modelo)
        r = m.transcribe(str(VOZ), language="es", word_timestamps=True)
        return [(w["word"], w["start"], w["end"]) for s in r["segments"] for w in s.get("words", [])]
    except ImportError:
        pass
    if not shutil.which("whisper"):
        return None
    with tempfile.TemporaryDirectory() as tmp:
        subprocess.run(
            ["whisper", str(VOZ), "--language", "es", "--model", modelo, "--word_timestamps", "True",
             "--output_format", "json", "--output_dir", tmp],
            check=True,
        )
        datos = json.loads((Path(tmp) / "voz.json").read_text(encoding="utf-8"))
    return [(w["word"], w["start"], w["end"]) for s in datos["segments"] for w in s.get("words", [])]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--modelo", default="small", help="tiny | base | small | medium | large")
    args = ap.parse_args()

    if not VOZ.exists():
        print("No existe public/voz.mp3 → se mantienen los tiempos estimados del guion.")
        return 0
    palabras = transcribir(args.modelo)
    if palabras is None:
        print("Whisper no está instalado (pip install -U openai-whisper) → se mantienen los tiempos estimados.")
        return 0

    lineas = SUBS.read_text(encoding="utf-8").splitlines()
    grupos = [(i, m) for i, l in enumerate(lineas) if (m := LINEA.match(l))]

    # tokens del guion → índice de grupo
    guion, grupo_de = [], []
    for g, (_, m) in enumerate(grupos):
        for w in m.group("texto").split():
            n = normalizar(w)
            if n:
                guion.append(n)
                grupo_de.append(g)
    voz = [normalizar(w) for w, _, _ in palabras]

    inicio_grupo = [None] * len(grupos)
    sm = difflib.SequenceMatcher(a=guion, b=voz, autojunk=False)
    for bloque in sm.get_matching_blocks():
        for k in range(bloque.size):
            g = grupo_de[bloque.a + k]
            t = palabras[bloque.b + k][1]
            if inicio_grupo[g] is None or t < inicio_grupo[g]:
                inicio_grupo[g] = t

    # rellena grupos sin coincidencia interpolando entre vecinos
    conocidos = [i for i, t in enumerate(inicio_grupo) if t is not None]
    if not conocidos:
        print("No se pudo alinear la voz con el guion. Revisa que el texto coincida.")
        return 1
    for i in range(len(inicio_grupo)):
        if inicio_grupo[i] is None:
            antes = max((k for k in conocidos if k < i), default=None)
            despues = min((k for k in conocidos if k > i), default=None)
            if antes is None:
                inicio_grupo[i] = inicio_grupo[despues]
            elif despues is None:
                inicio_grupo[i] = inicio_grupo[antes] + 0.5 * (i - antes)
            else:
                f = (i - antes) / (despues - antes)
                inicio_grupo[i] = inicio_grupo[antes] + f * (inicio_grupo[despues] - inicio_grupo[antes])

    # el primer grupo arranca en 0 (impacto inmediato) y cada grupo dura hasta el siguiente
    inicio_grupo[0] = 0.0
    fin_voz = palabras[-1][2] if palabras else DURACION
    for g, (idx, m) in enumerate(grupos):
        ini = round(min(inicio_grupo[g], DURACION - 0.1), 2)
        fin = inicio_grupo[g + 1] if g + 1 < len(grupos) else min(fin_voz + 0.3, DURACION)
        fin = round(max(ini + 0.15, min(fin, DURACION)), 2)
        lineas[idx] = f"{m.group(1)}{ini}{m.group(4)}{fin}{m.group(6)}"

    SUBS.write_text("\n".join(lineas) + "\n", encoding="utf-8")
    print(f"✔ {len(grupos)} grupos sincronizados con Whisper en src/data/{SUBS.name}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
