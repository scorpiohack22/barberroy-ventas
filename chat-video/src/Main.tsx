import React from "react";
import { AbsoluteFill, Html5Audio, getStaticFiles, staticFile, useCurrentFrame } from "remotion";
import { C, FPS } from "./theme";
import { Beat } from "./components/Beat";
import { Background, Finish } from "./components/Stage";
import { S1_Intro } from "./scenes/S1_Intro";
import { S2_Build } from "./scenes/S2_Build";
import { S3_Tutorial } from "./scenes/S3_Tutorial";
import { S4_Reel } from "./scenes/S4_Reel";
import { S5_Audio } from "./scenes/S5_Audio";
import { S6_Higgsfield } from "./scenes/S6_Higgsfield";
import { S7_Outro } from "./scenes/S7_Outro";

const has = (name: string) => getStaticFiles().some((f) => f.name === name);

/** Video de 1 minuto que cuenta esta conversación, escena por escena. */
export const Main: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const tint = t < 22 ? C.blue : t < 42 ? C.violet : C.cyan;
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Background tint={tint} />
      <Beat from={0} to={5} enter="cut" exit="zoom">
        <S1_Intro />
      </Beat>
      <Beat from={5} to={13} enter="pull" exit="whip">
        <S2_Build />
      </Beat>
      <Beat from={13} to={22} enter="whip" exit="whip">
        <S3_Tutorial />
      </Beat>
      <Beat from={22} to={34} enter="whip" exit="whip">
        <S4_Reel />
      </Beat>
      <Beat from={34} to={42} enter="whip" exit="whip">
        <S5_Audio />
      </Beat>
      <Beat from={42} to={52} enter="whip" exit="zoom">
        <S6_Higgsfield />
      </Beat>
      <Beat from={52} to={60} enter="pull" exit="cut">
        <S7_Outro />
      </Beat>
      <Finish />
      {has("musica.wav") ? <Html5Audio src={staticFile("musica.wav")} /> : null}
    </AbsoluteFill>
  );
};
