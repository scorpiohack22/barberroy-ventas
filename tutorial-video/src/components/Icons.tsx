import React from "react";

type P = { size?: number; color?: string; style?: React.CSSProperties };

const Svg: React.FC<P & { children: React.ReactNode; fill?: boolean }> = ({
  size = 24,
  color = "currentColor",
  style,
  children,
  fill,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={fill ? color : "none"}
    stroke={fill ? "none" : color}
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0, ...style }}
  >
    {children}
  </svg>
);

export const HomeIcon: React.FC<P> = (p) => (
  <Svg {...p}>
    <path d="M3 11 12 3l9 8" />
    <path d="M5 10v10h5v-6h4v6h5V10" />
  </Svg>
);
export const BellIcon: React.FC<P> = (p) => (
  <Svg {...p}>
    <path d="M6 16V11a6 6 0 1 1 12 0v5l2 2H4z" />
    <path d="M10 20a2 2 0 0 0 4 0" />
  </Svg>
);
export const MegaphoneIcon: React.FC<P> = (p) => (
  <Svg {...p}>
    <path d="M3 10v4h4l8 5V5L7 10z" />
    <path d="M18 9a4 4 0 0 1 0 6" />
  </Svg>
);
export const GridIcon: React.FC<P> = (p) => (
  <Svg {...p}>
    <rect x={3} y={3} width={7} height={7} rx={1.5} />
    <rect x={14} y={3} width={7} height={7} rx={1.5} />
    <rect x={3} y={14} width={7} height={7} rx={1.5} />
    <rect x={14} y={14} width={7} height={7} rx={1.5} />
  </Svg>
);
export const ChatIcon: React.FC<P> = (p) => (
  <Svg {...p}>
    <path d="M4 5h16v11H9l-5 4z" />
  </Svg>
);
export const CardIcon: React.FC<P> = (p) => (
  <Svg {...p}>
    <rect x={2.5} y={5} width={19} height={14} rx={2} />
    <path d="M2.5 10h19" />
    <path d="M6 15h4" />
  </Svg>
);
export const GearIcon: React.FC<P> = (p) => (
  <Svg {...p}>
    <circle cx={12} cy={12} r={3} />
    <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
  </Svg>
);
export const HelpIcon: React.FC<P> = (p) => (
  <Svg {...p}>
    <circle cx={12} cy={12} r={9.5} />
    <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7" />
    <path d="M12 17h.01" />
  </Svg>
);
export const CheckIcon: React.FC<P> = (p) => (
  <Svg {...p}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </Svg>
);
export const CheckCircleIcon: React.FC<P & { bg?: string }> = ({ size = 24, color = "#1E8E3E", bg = "#fff", style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ flexShrink: 0, ...style }}>
    <circle cx={12} cy={12} r={11} fill={color} />
    <path d="M6.5 12.5l3.6 3.6 7.4-7.6" fill="none" stroke={bg} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
export const AlertIcon: React.FC<P & { mark?: string }> = ({ size = 24, color = "#C8102E", mark = "#fff", style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ flexShrink: 0, ...style }}>
    <path d="M12 2.5 1.8 20.5h20.4z" fill={color} />
    <path d="M12 9v5.5" stroke={mark} strokeWidth={2.2} strokeLinecap="round" />
    <circle cx={12} cy={17.3} r={1.3} fill={mark} />
  </svg>
);
export const InfoIcon: React.FC<P> = (p) => (
  <Svg {...p}>
    <circle cx={12} cy={12} r={9.5} />
    <path d="M12 11v6M12 7.5h.01" />
  </Svg>
);
export const ChevronDown: React.FC<P> = (p) => (
  <Svg {...p}>
    <path d="M6 9l6 6 6-6" />
  </Svg>
);
export const ChevronRight: React.FC<P> = (p) => (
  <Svg {...p}>
    <path d="M9 6l6 6-6 6" />
  </Svg>
);
export const BankIcon: React.FC<P> = (p) => (
  <Svg {...p}>
    <path d="M3 9.5 12 4l9 5.5z" />
    <path d="M5 10v7M9.5 10v7M14.5 10v7M19 10v7M3 20h18" />
  </Svg>
);
export const UsersIcon: React.FC<P> = (p) => (
  <Svg {...p}>
    <circle cx={9} cy={8} r={3.5} />
    <path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" />
    <path d="M16 4.8a3.5 3.5 0 0 1 0 6.4M18 14.4c2 .8 3.5 2.8 3.5 5.6" />
  </Svg>
);
export const DocIcon: React.FC<P> = (p) => (
  <Svg {...p}>
    <path d="M6 2.5h8l4.5 4.5v14.5H6z" />
    <path d="M14 2.5V7h4.5M9 12h6M9 16h6" />
  </Svg>
);
export const ShieldIcon: React.FC<P> = (p) => (
  <Svg {...p}>
    <path d="M12 2.5 4 6v6c0 5 3.4 8.6 8 9.5 4.6-.9 8-4.5 8-9.5V6z" />
  </Svg>
);
export const RobotIcon: React.FC<P> = (p) => (
  <Svg {...p}>
    <rect x={4} y={8} width={16} height={12} rx={3} />
    <path d="M12 4v4M9 13h.01M15 13h.01M9.5 17h5" />
    <circle cx={12} cy={3.5} r={1} />
  </Svg>
);
export const MoneyIcon: React.FC<P> = (p) => (
  <Svg {...p}>
    <rect x={2.5} y={6} width={19} height={12} rx={2} />
    <circle cx={12} cy={12} r={2.8} />
    <path d="M6 9.5v5M18 9.5v5" />
  </Svg>
);
export const UserIcon: React.FC<P> = (p) => (
  <Svg {...p}>
    <circle cx={12} cy={8} r={4} />
    <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
  </Svg>
);
export const SearchIcon: React.FC<P> = (p) => (
  <Svg {...p}>
    <circle cx={11} cy={11} r={7} />
    <path d="M20.5 20.5 16 16" />
  </Svg>
);
export const MailIcon: React.FC<P> = (p) => (
  <Svg {...p}>
    <rect x={2.5} y={5} width={19} height={14} rx={2} />
    <path d="M3 6.5l9 6.5 9-6.5" />
  </Svg>
);
