import { Platform, type TextStyle, type ViewStyle } from 'react-native';

/**
 * VOQDO design tokens — a warm, dark, night-time palette.
 *
 * The app is dark-first by design: the whole product is meant to be opened in
 * the evening, so there is a single theme rather than a light/dark pair.
 */

export const colors = {
  /** Page ground, and the two surface steps above it. */
  bg: '#0B0D11',
  surface: '#15181D',
  surfaceRaised: '#1C2027',
  border: '#252932',
  borderSoft: '#1E222A',

  text: '#F2EDE6',
  muted: '#959BA5',
  faint: '#6A7078',

  /** Peach — primary calls to action. Dark ink sits on top of it. */
  accent: '#F3C4A2',
  accentInk: '#1A1410',
  /** Amber — the recording glow, waveform and "today" ring. */
  glow: '#E9A063',
  glowSoft: '#7A5330',

  success: '#6FBF9B',
  successBg: '#22412F',
  warn: '#E58B7B',
} as const;

/** The violet card that holds the primary "Tap to Journal" action. */
export const journalCard = {
  from: '#453A5C',
  to: '#372F4B',
  border: '#524470',
} as const;

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

/** Chip ink + fill per category, tuned to read on the dark ground. */
const categoryColors: Record<CategoryKey, Duo> = {
  Gratitude: { color: '#86C9A3', bg: '#25412F' },
  'Self-Care': { color: '#E39BB8', bg: '#432935' },
  Mindset: { color: '#82B4E8', bg: '#20374F' },
  'Personal Growth': { color: '#E0A96A', bg: '#42321F' },
  Anxiety: { color: '#A8AEB6', bg: '#2C3037' },
  Relationships: { color: '#C4A2E8', bg: '#332A47' },
  Reflection: { color: '#7FC7C2', bg: '#1F3C3B' },
};

export function catStyle(key: string): Duo {
  return categoryColors[key as CategoryKey] ?? categoryColors.Reflection;
}

export type Mood = 'Calm' | 'Bright' | 'Heavy' | 'Restless' | 'Tender';

const moodColors: Record<Mood, Duo> = {
  Calm: { color: '#7FC7C2', bg: '#1F3C3B' },
  Bright: { color: '#E9C46A', bg: '#3E351C' },
  Heavy: { color: '#9AA0A8', bg: '#292D34' },
  Restless: { color: '#E0A96A', bg: '#42321F' },
  Tender: { color: '#E39BB8', bg: '#432935' },
};

export function moodStyle(mood: Mood): Duo {
  return moodColors[mood] ?? moodColors.Calm;
}

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  xxl: 28,
  pill: 999,
} as const;

export const gutter = 22;

/** Playfair for anything that speaks; Inter for anything that labels. */
export const font = {
  display: 'PlayfairDisplay_500Medium',
  displayRegular: 'PlayfairDisplay_400Regular',
  displaySemi: 'PlayfairDisplay_600SemiBold',
  displayItalic: 'PlayfairDisplay_400Regular_Italic',
  body: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semi: 'Inter_600SemiBold',
} as const;

export const type = {
  /** Large serif headline, e.g. "You showed up today". */
  display: {
    fontFamily: font.display,
    fontSize: 26,
    lineHeight: 33,
    color: colors.text,
  },
  /** Journal prose — set in the serif so entries read like writing. */
  prose: {
    fontFamily: font.displayRegular,
    fontSize: 15.5,
    lineHeight: 26,
    color: colors.text,
  },
  body: {
    fontFamily: font.body,
    fontSize: 13.5,
    lineHeight: 20,
    color: colors.muted,
  },
  caption: {
    fontFamily: font.body,
    fontSize: 11.5,
    color: colors.faint,
  },
  kicker: {
    fontFamily: font.medium,
    fontSize: 10.5,
    letterSpacing: 0.9,
    color: colors.muted,
  },
} satisfies Record<string, TextStyle>;

export const tabularNums: TextStyle = { fontVariant: ['tabular-nums'] };

/** Warm bloom used behind the mic and under the peach CTA. */
export function glowShadow(color: string, level: 'sm' | 'md' | 'lg' = 'md'): ViewStyle {
  const spec = {
    sm: { radius: 12, height: 4, elevation: 3, opacity: 0.35 },
    md: { radius: 24, height: 8, elevation: 6, opacity: 0.45 },
    lg: { radius: 40, height: 12, elevation: 12, opacity: 0.55 },
  }[level];

  return Platform.select<ViewStyle>({
    ios: {
      shadowColor: color,
      shadowOpacity: spec.opacity,
      shadowRadius: spec.radius,
      shadowOffset: { width: 0, height: spec.height },
    },
    android: { elevation: spec.elevation },
    default: {},
  }) as ViewStyle;
}

export const pressedOpacity = 0.7;
