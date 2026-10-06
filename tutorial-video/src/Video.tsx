import React from "react";
import { AbsoluteFill, Series } from "remotion";
import { FADE, FPS } from "./theme";
import { SCENES } from "./timeline";
import { SceneFade } from "./components/SceneFade";
import { Subtitles } from "./components/Subtitles";
import { Music } from "./components/Music";
import { Intro } from "./scenes/Intro";
import { AccountStatus } from "./scenes/AccountStatus";
import { RecentIssues } from "./scenes/RecentIssues";
import { PaymentAccount } from "./scenes/PaymentAccount";
import { Settings } from "./scenes/Settings";
import { Diagnosis } from "./scenes/Diagnosis";
import { Solution } from "./scenes/Solution";
import { Checklist } from "./scenes/Checklist";
import { Outro } from "./scenes/Outro";

const COMPONENTS: Record<(typeof SCENES)[number]["id"], React.FC> = {
  intro: Intro,
  estado: AccountStatus,
  problemas: RecentIssues,
  pago: PaymentAccount,
  configuracion: Settings,
  diagnostico: Diagnosis,
  solucion: Solution,
  checklist: Checklist,
  cierre: Outro,
};

/**
 * Cada escena después de la primera empieza FADE frames antes (offset
 * negativo) y dura FADE frames más, así el fundido de 10 frames se superpone
 * con la escena anterior sin cambiar los tiempos del guion ni la duración total.
 */
export const Video: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Series>
        {SCENES.map((s, i) => {
          const Scene = COMPONENTS[s.id];
          return (
            <Series.Sequence
              key={s.id}
              name={s.id}
              durationInFrames={s.seconds * FPS + (i === 0 ? 0 : FADE)}
              offset={i === 0 ? 0 : -FADE}
            >
              <SceneFade>
                <Scene />
              </SceneFade>
            </Series.Sequence>
          );
        })}
      </Series>
      <Subtitles />
      <Music />
    </AbsoluteFill>
  );
};
