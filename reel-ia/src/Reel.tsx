import React from "react";
import { AbsoluteFill, Html5Audio, getStaticFiles, staticFile, useCurrentFrame } from "remotion";
import { C, FPS } from "./theme";
import { Beat } from "./components/Beat";
import { Background, Finish } from "./components/Stage";
import { A_Hook } from "./beats/A_Hook";
import { B_Reveal } from "./beats/B_Reveal";
import { C_Nothing } from "./beats/C_Nothing";
import { D_Generate } from "./beats/D_Generate";
import { E_OnePerson } from "./beats/E_OnePerson";
import { F_Now } from "./beats/F_Now";
import { G_Wall } from "./beats/G_Wall";

const has = (name: string) => getStaticFiles().some((f) => f.name === name);

/**
 * Reel 9:16. La narración es la línea de tiempo maestra: cada escena (Beat)
 * se monta en los segundos exactos de la frase que ilustra (ver timing.ts).
 */
export const Reel: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const tint = t < 13.5 ? C.blue : t < 21.4 ? C.violet : C.cyan;
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Background tint={tint} />
      <Beat from={0} to={8.1} enter="cut" exit="zoom">
        <A_Hook />
      </Beat>
      <Beat from={8.1} to={13.5} enter="pull" exit="whip">
        <B_Reveal />
      </Beat>
      <Beat from={13.5} to={18.4} enter="whip" exit="whip">
        <C_Nothing />
      </Beat>
      <Beat from={18.4} to={21.4} enter="whip" exit="whip">
        <D_Generate />
      </Beat>
      <Beat from={21.4} to={25.55} enter="whip" exit="whip">
        <E_OnePerson />
      </Beat>
      <Beat from={25.55} to={29.65} enter="whip" exit="zoom">
        <F_Now />
      </Beat>
      <Beat from={29.65} to={32.4} enter="pull" exit="cut">
        <G_Wall />
      </Beat>
      <Finish />

      <Html5Audio src={staticFile("narracion.wav")} />
      {has("fondo.wav") ? <Html5Audio src={staticFile("fondo.wav")} /> : null}
    </AbsoluteFill>
  );
};
