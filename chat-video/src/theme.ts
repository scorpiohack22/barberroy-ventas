export const FPS = 30;
export const W = 1920;
export const H = 1080;
export const DURATION_S = 60;

export const C = {
  bg: "#06070A",
  bg2: "#0C0E14",
  panel: "rgba(255,255,255,0.055)",
  panelSolid: "#111521",
  stroke: "rgba(255,255,255,0.10)",
  text: "#F4F6FA",
  muted: "#8D96A8",
  blue: "#3D7BFF",
  cyan: "#3DD9F5",
  violet: "#8F6BFF",
  green: "#34D399",
  red: "#FF5C7A",
  amber: "#FFB547",
};

export const GRAD = `linear-gradient(100deg, ${C.cyan} 0%, ${C.blue} 45%, ${C.violet} 100%)`;

export const font = 'Inter, "Segoe UI", system-ui, sans-serif';
export const mono = '"JetBrains Mono", "SFMono-Regular", Menlo, Consolas, monospace';

export const glass: React.CSSProperties = {
  background: "linear-gradient(160deg, rgba(30,34,46,0.9), rgba(14,16,24,0.88))",
  border: `1px solid ${C.stroke}`,
  borderRadius: 22,
  boxShadow: "0 30px 80px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.08)",
  backdropFilter: "blur(18px)",
};
