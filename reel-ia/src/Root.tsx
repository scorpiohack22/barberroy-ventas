import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/inter/800.css";
import "@fontsource/inter/900.css";
import "@fontsource/inter/300.css";
import { Composition } from "remotion";
import { Reel } from "./Reel";
import { DURATION_S, FPS, H, W } from "./theme";

export const RemotionRoot: React.FC = () => (
  <Composition id="Reel" component={Reel} durationInFrames={Math.round(DURATION_S * FPS)} fps={FPS} width={W} height={H} />
);
