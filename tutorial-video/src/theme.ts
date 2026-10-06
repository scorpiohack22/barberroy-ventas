export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

/** Duración del fundido entre escenas, en frames. */
export const FADE = 10;

export const colors = {
  blue: "#0866FF",
  blueHover: "#0659E0",
  blueSoft: "#E7F0FF",
  red: "#C8102E",
  redSoft: "#FDECEE",
  green: "#1E8E3E",
  greenSoft: "#E6F4EA",
  yellow: "#F5B400",
  text: "#1C1E21",
  textMuted: "#65676B",
  border: "#DADDE1",
  card: "#FFFFFF",
  bgGradient: "linear-gradient(135deg, #EEF3FF 0%, #F3EEFF 55%, #EAF1FF 100%)",
  dark: "#0B0F1A",
  fbDarkBg: "#18191A",
  fbDarkCard: "#242526",
  fbDarkBorder: "#3A3B3C",
  fbDarkText: "#E4E6EB",
  fbDarkMuted: "#B0B3B8",
};

export const fontFamily =
  '"Segoe UI", Inter, "Helvetica Neue", Helvetica, Arial, sans-serif';

export const radius = 8;

export const cardStyle: React.CSSProperties = {
  background: colors.card,
  borderRadius: radius,
  boxShadow: "0 1px 2px rgba(0,0,0,0.08), 0 4px 16px rgba(40,60,120,0.06)",
  border: `1px solid ${colors.border}`,
};
