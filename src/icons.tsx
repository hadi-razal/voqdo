import Svg, { Circle, Path, Rect } from 'react-native-svg';

/** Lucide-style outline paths. One `d` per glyph, multi-stroke included. */
export const ICON_PATHS = {
  mic: 'M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3ZM19 10v2a7 7 0 0 1-14 0v-2M12 19v3',
  micShort: 'M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3ZM19 10v2a7 7 0 0 1-14 0v-2',
  home: 'M3 10.5 12 3l9 7.5M5.5 9.5V20a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V9.5',
  book: 'M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a2.5 2.5 0 0 1 0-5H20',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3',
  plus: 'M5 12h14M12 5v14',
  pencil: 'M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3ZM15 5l4 4',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6.5V12l3.5 2',
  refresh: 'M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6',
  chevronLeft: 'm15 18-6-6 6-6',
  chevronRight: 'm9 18 6-6-6-6',
  chevronDown: 'm6 9 6 6 6-6',
  arrowRight: 'M4 12h15M13 6l6 6-6 6',
  dots: 'M12 6.5h.01M12 12h.01M12 17.5h.01',
  check: 'M20 6 9 17l-5-5',
  close: 'M18 6 6 18M6 6l12 12',
  heart: 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z',
  leaf: 'M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10ZM2 21c0-3 1.85-5.36 5.08-6',
  sprout: 'M7 20h10M10 20c5.5-2.5.8-6.4 3-10M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8ZM14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2Z',
  smile: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01',
  sparkle: 'M12 3v3M12 18v3M3 12h3M18 12h3',
  moon: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z',
  bell: 'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0',
  lock: 'M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2zM7 11V7a5 5 0 0 1 10 0v4',
  info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16v-4M12 8h.01',
  star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  trash: 'M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6',
  tag: 'M9 5H2v7l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 3M6 9h.01',
  sun: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41',
  user: 'M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2',
  users:
    'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  text: 'M17 6.1H3M21 12.1H3M15.1 18H3',
  cloud: 'M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z',
  export: 'M12 15V3M7 8l5-5 5 5M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4',
  trend: 'M22 7l-8.5 8.5-5-5L2 17M16 7h6v6',
} as const;

export type IconName = keyof typeof ICON_PATHS;

/** Category key → glyph, used by chips and category tiles. */
export const CATEGORY_ICONS: Record<string, IconName> = {
  Gratitude: 'heart',
  'Self-Care': 'leaf',
  Mindset: 'sparkle',
  'Personal Growth': 'sprout',
  Anxiety: 'cloud',
  Relationships: 'users',
  Reflection: 'moon',
};

export function Icon({
  name,
  size = 18,
  color = '#F2EDE6',
  strokeWidth = 1.6,
}: {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d={ICON_PATHS[name]}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Head circle cannot be expressed in the single-path set. */
export function UserIcon({ size = 22, color = '#F2EDE6', strokeWidth = 1.6 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d={ICON_PATHS.user}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Circle cx="12" cy="7" r="4" fill="none" stroke={color} strokeWidth={strokeWidth} />
    </Svg>
  );
}

/** Three ascending bars — the Insights tab and tile glyph. */
export function ChartIcon({ size = 22, color = '#F2EDE6', strokeWidth = 1.6 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {[
        [4, 13, 3.4, 7],
        [10.3, 8, 3.4, 12],
        [16.6, 4, 3.4, 16],
      ].map(([x, y, w, h]) => (
        <Rect
          key={x}
          x={x}
          y={y}
          width={w}
          height={h}
          rx="1.4"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
        />
      ))}
    </Svg>
  );
}

/** Four rounded squares — the Categories tile glyph. */
export function GridIcon({ size = 22, color = '#F2EDE6', strokeWidth = 1.6 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {[
        [3, 3],
        [14, 3],
        [3, 14],
        [14, 14],
      ].map(([x, y]) => (
        <Rect
          key={`${x}-${y}`}
          x={x}
          y={y}
          width="7"
          height="7"
          rx="2"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
        />
      ))}
    </Svg>
  );
}

/** Four-point star with a centre ring — the AI-categorised marker. */
export function SparkIcon({ size = 16, color = '#F3C4A2', strokeWidth = 1.6 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d={ICON_PATHS.sparkle}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Circle cx="12" cy="12" r="3.4" fill="none" stroke={color} strokeWidth={strokeWidth} />
    </Svg>
  );
}
