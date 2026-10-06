import React from "react";

type P = { size?: number; color?: string };
const S: React.FC<P & { children: React.ReactNode }> = ({ size = 32, color = "currentColor", children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    {children}
  </svg>
);

export const IPerson: React.FC<P> = (p) => (
  <S {...p}>
    <circle cx={12} cy={8} r={4} />
    <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
  </S>
);
export const ICamera: React.FC<P> = (p) => (
  <S {...p}>
    <path d="M3 8h4l2-3h6l2 3h4v11H3z" />
    <circle cx={12} cy={13} r={3.5} />
  </S>
);
export const IPin: React.FC<P> = (p) => (
  <S {...p}>
    <path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z" />
    <circle cx={12} cy={9.5} r={2.5} />
  </S>
);
export const ISpark: React.FC<P> = (p) => (
  <S {...p}>
    <path d="M12 3l1.9 5.6L19.5 10.5l-5.6 1.9L12 18l-1.9-5.6L4.5 10.5l5.6-1.9z" />
    <path d="M19 3v4M17 5h4" />
  </S>
);
export const ICheck: React.FC<P> = (p) => (
  <S {...p}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </S>
);
export const IX: React.FC<P> = (p) => (
  <S {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </S>
);
export const IImage: React.FC<P> = (p) => (
  <S {...p}>
    <rect x={3} y={4} width={18} height={16} rx={3} />
    <circle cx={9} cy={10} r={2} />
    <path d="M21 16l-5-5-9 9" />
  </S>
);
export const IVideo: React.FC<P> = (p) => (
  <S {...p}>
    <rect x={3} y={6} width={13} height={12} rx={2.5} />
    <path d="M16 10l5-3v10l-5-3" />
  </S>
);
export const IMegaphone: React.FC<P> = (p) => (
  <S {...p}>
    <path d="M3 10v4h4l9 5V5L7 10z" />
    <path d="M19 9a4 4 0 0 1 0 6" />
  </S>
);
export const IText: React.FC<P> = (p) => (
  <S {...p}>
    <path d="M4 6h16M4 12h10M4 18h13" />
  </S>
);
export const IHeart: React.FC<P> = (p) => (
  <S {...p}>
    <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
  </S>
);
export const IPlay: React.FC<P> = (p) => (
  <S {...p}>
    <path d="M7 5v14l12-7z" />
  </S>
);
