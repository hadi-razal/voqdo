import { Platform, type TextStyle, type ViewStyle } from 'react-native';

/**
 * VOQDO design tokens — "lamplight".
 *
 * A night journal should feel like writing by a warm lamp: near-black ground
 * with a hint of aubergine, quiet cards defined by hairline edges, cream for
 * the primary action, apricot for energy, lavender and mint for colour.
 * Dark-first by design; one theme so every screen feels the same.
 */

export const colors = {
  /** Page ground and the surface steps above it. */
  bg: '#0E0C12',
  surface: '#1C1922',
  surfaceRaised: '#25212D',
  border: '#332E3D',
  borderSoft: '#26222E',

  /** Card fill and hairline edge. */
  card: '#17141C',
  cardStrong: '#1F1B26',
  cardBorder: 'rgba(255, 255, 255, 0.07)',
  /** Quiet fill for tracks, empty dots and icon wells. */
  wash: 'rgba(255, 255, 255, 0.06)',
  scrim: 'rgba(0, 0, 0, 0.62)',

  text: '#F6F0EA',
  muted: '#ABA3B7',
  faint: '#716A7D',

  /** Cream — the primary button: the brightest thing on a dark page. */
  ink: '#F3ECE4',
  inkDeep: '#FFFFFF',
  onInk: '#16131B',

  /** Apricot — energy: streaks, prompts, the speak button. */
  accent: '#FFAA84',
  accentDeep: '#F4875D',
  accentInk: '#2A1409',
  accentSoft: 'rgba(255, 170, 132, 0.13)',
  /** Lavender — rings, the "today" marker, AI. */
  glow: '#B6A4FF',
  glowSoft: 'rgba(182, 164, 255, 0.14)',

  /** Mint — growth, completion, Sprout's leaves. */
  success: '#72DBAA',
  successInk: '#0C2A1D',
  successBg: 'rgba(114, 219, 170, 0.13)',
  /** Gold — XP, stars and rewards. */
  gold: '#F3C567',
  goldBg: 'rgba(243, 197, 103, 0.13)',
  warn: '#FF8C86',
  warnBg: 'rgba(255, 140, 134, 0.13)',
} as const;

/** The page behind every screen: warm aubergine at the top, settling into near-black. */
export const sky = {
  top: '#1D1722',
  mid: '#131017',
  bottom: '#0E0C12',
  /** The lamp: a soft warm glow in the top corner. */
  ember: '#FF9A68',
} as const;

/** Sprout's home on the dashboard — deep lavender easing into rose. */
export const journalCard = {
  from: '#2B2342',
  to: '#3A2433',
  border: 'rgba(255, 255, 255, 0.08)',
} as const;

/** Depth on a dark page comes mostly from edges; shadows stay low and black. */
export const shadow = {
  card: Platform.select<ViewStyle>({
    ios: { shadowColor: '#000', shadowOpacity: 0.28, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } },
    android: { elevation: 2 },
    web: { boxShadow: '0px 6px 18px rgba(0, 0, 0, 0.28)' } as ViewStyle,
    default: {},
  }) as ViewStyle,
  lift: Platform.select<ViewStyle>({
    ios: { shadowColor: '#000', shadowOpacity: 0.45, shadowRadius: 24, shadowOffset: { width: 0, height: 10 } },
    android: { elevation: 10 },
    web: { boxShadow: '0px 10px 30px rgba(0, 0, 0, 0.45)' } as ViewStyle,
    default: {},
  }) as ViewStyle,
};

export type CategoryKey =
  | 'Gratitude'
  | 'Self-Care'
  | 'Mindset'
  | 'Personal Growth'
  | 'Anxiety'
  | 'Relationships'
  | 'Reflection';

export const CATEGORY_KEYS: CategoryKey[] = [
  'Gratitude',
  'Self-Care',
  'Mindset',
  'Personal Growth',
  'Anxiety',
  'Relationships',
  'Reflection',
];

type Duo = { color: string; bg: string };

/** Chip ink + fill per category, tuned to read on the indigo ground. */
const categoryColors: Record<CategoryKey, Duo> = {
  Gratitude: tint('#8EE3B9'),
  'Self-Care': tint('#FFA9C9'),
  Mindset: tint('#9CC6FF'),
  'Personal Growth': tint('#FFC98E'),
  Anxiety: tint('#C6BFD8'),
  Relationships: tint('#CDB5FF'),
  Reflection: tint('#8ADFDD'),
};

/** Light ink plus a translucent wash of the same hue, so chips glow softly on dark cards. */
function tint(color: string): Duo {
  return { color, bg: `${color}1F` };
}

export function catStyle(key: string): Duo {
  return categoryColors[key as CategoryKey] ?? categoryColors.Reflection;
}

export type Mood = 'Calm' | 'Bright' | 'Heavy' | 'Restless' | 'Tender';

export const MOODS: Mood[] = ['Bright', 'Calm', 'Tender', 'Restless', 'Heavy'];

const moodColors: Record<Mood, Duo> = {
  Calm: tint('#8ADFDD'),
  Bright: tint('#F6CF73'),
  Heavy: tint('#AEB6DA'),
  Restless: tint('#FFAA84'),
  Tender: tint('#FFA9C9'),
};

export function moodStyle(mood: Mood): Duo {
  return moodColors[mood] ?? moodColors.Calm;
}

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 30,
  pill: 999,
} as const;

export const gutter = 20;

/** Fraunces for anything that speaks; Nunito for anything that labels. */
export const font = {
  display: 'Fraunces_600SemiBold',
  displayRegular: 'Fraunces_400Regular',
  displaySemi: 'Fraunces_700Bold',
  displayItalic: 'Fraunces_400Regular_Italic',
  body: 'Nunito_500Medium',
  medium: 'Nunito_700Bold',
  semi: 'Nunito_800ExtraBold',
  black: 'Nunito_900Black',
} as const;

export const type = {
  display: {
    fontFamily: font.display,
    fontSize: 26,
    lineHeight: 32,
    color: colors.text,
  },
  /** Journal prose — set in the serif so entries read like writing. */
  prose: {
    fontFamily: font.displayRegular,
    fontSize: 16.5,
    lineHeight: 27,
    color: colors.text,
  },
  body: {
    fontFamily: font.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.muted,
  },
  caption: {
    fontFamily: font.body,
    fontSize: 12,
    color: colors.faint,
  },
  kicker: {
    fontFamily: font.semi,
    fontSize: 11,
    letterSpacing: 1.2,
    color: colors.muted,
  },
} satisfies Record<string, TextStyle>;

export const tabularNums: TextStyle = { fontVariant: ['tabular-nums'] };

/** Soft bloom used behind the primary action and Sprout's habitat. */
export function glowShadow(color: string, level: 'sm' | 'md' | 'lg' = 'md'): ViewStyle {
  const spec = {
    sm: { radius: 12, height: 4, elevation: 3, opacity: 0.35 },
    md: { radius: 22, height: 8, elevation: 6, opacity: 0.45 },
    lg: { radius: 36, height: 12, elevation: 12, opacity: 0.55 },
  }[level];

  return Platform.select<ViewStyle>({
    ios: {
      shadowColor: color,
      shadowOpacity: spec.opacity,
      shadowRadius: spec.radius,
      shadowOffset: { width: 0, height: spec.height },
    },
    android: { elevation: spec.elevation },
    web: { boxShadow: `0px ${spec.height}px ${spec.radius}px ${hexAlpha(color, spec.opacity)}` } as ViewStyle,
    default: {},
  }) as ViewStyle;
}

function hexAlpha(hex: string, alpha: number) {
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

export const pressedOpacity = 0.72;
