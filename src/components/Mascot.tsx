import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { Sprout, type SproutFace, type SproutLook } from '@/components/Sprout';
import { dayKey, useJournal } from '@/context/journal';
import { MASCOT_LABELS, type MascotPose } from '@/lib/mascot';
import { stageFor, type SproutStage } from '@/lib/pet';
import { colors, font, pressedOpacity, radius, shadow, type Mood } from '@/theme';

/** Each named pose is a combination of face, arms and prop. */
export const POSE_LOOKS: Record<MascotPose, SproutLook> = {
  journal: { face: 'happy', arms: 'hold', prop: 'book' },
  heart: { face: 'love', arms: 'hug', prop: 'hearts' },
  cheer: { face: 'joy', arms: 'cheer', prop: 'sparkles' },
  nap: { face: 'sleepy', prop: 'zzz' },
  wonder: { face: 'surprised', prop: 'sparkles' },
  think: { face: 'thinking', prop: 'question' },
  listen: { face: 'calm', prop: 'waves' },
  laptop: { face: 'thinking', arms: 'hold', prop: 'book' },
  cocoa: { face: 'calm', arms: 'hold', prop: 'cup' },
  hello: { face: 'happy', arms: 'wave' },
  weep: { face: 'sad', prop: 'tear' },
  sleep: { face: 'sleepy', prop: 'zzz' },
  wink: { face: 'wink', arms: 'wave', prop: 'sparkles' },
  shy: { face: 'shy', arms: 'hug' },
  study: { face: 'thinking', arms: 'hold', prop: 'book' },
  grow: { face: 'joy', arms: 'cheer' },
  storm: { face: 'worried', prop: 'rain' },
  party: { face: 'joy', arms: 'cheer', prop: 'party' },
  rest: { face: 'sleepy' },
  peek: { face: 'shy', arms: 'wave' },
  star: { face: 'joy', arms: 'cheer', prop: 'star' },
  ponder: { face: 'thinking' },
  bloom: { face: 'happy', arms: 'hug', prop: 'sparkles' },
  wave: { face: 'joy', arms: 'wave' },
};

/** Sprout's face for each mood — used by mood pickers and entry cards. */
export const MOOD_FACES: Record<Mood, SproutFace> = {
  Bright: 'joy',
  Calm: 'calm',
  Tender: 'shy',
  Restless: 'worried',
  Heavy: 'sad',
};

/** Sprout's current growth stage, from distinct saved journaling days. */
export function useSproutStage(): SproutStage {
  const { entries } = useJournal();
  return useMemo(() => stageFor(new Set(entries.map((entry) => dayKey(entry.createdAt))).size), [entries]);
}

export function Mascot({
  pose,
  size = 88,
  stage,
  bounce,
  animated,
  style,
}: {
  pose: MascotPose;
  size?: number;
  stage?: SproutStage;
  bounce?: number;
  animated?: boolean;
  style?: ViewStyle;
}) {
  const current = useSproutStage();
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={`Sprout, ${MASCOT_LABELS[pose].toLowerCase()}`} style={style}>
      <Sprout look={POSE_LOOKS[pose]} stage={stage ?? current} size={size} bounce={bounce} animated={animated} />
    </View>
  );
}

/** Tappable buddy: Sprout plus a speech bubble that cycles a few lines. */
export function MascotTalk({
  pose,
  line,
  taps = [],
  size = 86,
  layout = 'row',
  bare = false,
}: {
  pose: MascotPose;
  line: string;
  taps?: string[];
  size?: number;
  layout?: 'row' | 'stack';
  bare?: boolean;
}) {
  const [tick, setTick] = useState(0);
  const lines = [line, ...taps];
  const shown = lines[tick % lines.length];
  const playful = tick > 0 && tick % lines.length === 0;
  const stack = layout === 'stack';

  return (
    <Pressable
      onPress={() => setTick((n) => n + 1)}
      accessibilityRole="button"
      accessibilityLabel={`Sprout says: ${shown}. Double tap to hear another line.`}
      style={({ pressed }) => [
        styles.talk,
        stack && styles.talkStack,
        bare && styles.talkBare,
        pressed && { opacity: pressedOpacity },
      ]}
    >
      <Mascot pose={playful ? 'wink' : pose} size={size} bounce={tick} />
      <View style={[styles.bubble, stack ? styles.bubbleStack : styles.bubbleRow]}>
        {!stack && <View style={styles.tail} />}
        <Text style={[styles.bubbleText, stack && styles.centered]}>{shown}</Text>
        <Text style={[styles.hint, stack && styles.centered]}>Tap Sprout</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  talk: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    alignSelf: 'stretch',
  },
  talkStack: { flexDirection: 'column', alignItems: 'center', gap: 10 },
  talkBare: {},
  bubble: {
    gap: 4,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.lg,
    ...shadow.card,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  bubbleRow: { flex: 1 },
  // No flex here: `flex: 0` collapses to zero height on web.
  bubbleStack: { alignItems: 'center', maxWidth: 300 },
  tail: {
    position: 'absolute',
    left: -6,
    top: '50%',
    marginTop: -6,
    width: 12,
    height: 12,
    backgroundColor: colors.surface,
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.cardBorder,
    transform: [{ rotate: '45deg' }],
  },
  bubbleText: {
    fontFamily: font.medium,
    fontSize: 15,
    lineHeight: 21,
    color: colors.text,
  },
  hint: { fontFamily: font.body, fontSize: 11, color: colors.faint },
  centered: { textAlign: 'center' },
});
