// Genera subtitulos.srt a partir de src/subtitles.ts (npm run srt).
import { writeFileSync } from "node:fs";
import { CUES } from "../src/subtitles.ts";

const ts = (s: number) => {
  const ms = Math.round(s * 1000);
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  const pad = (n: number, l = 2) => String(n).padStart(l, "0");
  return `${pad(h)}:${pad(m)}:${pad(sec)},${pad(ms % 1000, 3)}`;
};

const srt = CUES.map((c, i) => `${i + 1}\n${ts(c.start)} --> ${ts(c.end)}\n${c.text}\n`).join("\n");
writeFileSync("subtitulos.srt", srt);
console.log(`subtitulos.srt: ${CUES.length} subtítulos`);
