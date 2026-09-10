import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { WorkItem } from '@/data/tasks';
import { colors, pressedOpacity, radius, spacing, tabularNums } from '@/theme';

/** Splits "09:00 AM" into its clock and meridiem halves for the time gutter. */
function splitTime(time: string) {
  const match = time.trim().match(/^(\d{1,2}:\d{2})\s*(AM|PM)$/i);
  if (!match) return { clock: time.trim(), meridiem: '' };
  return { clock: match[1], meridiem: match[2].toUpperCase() };
}

export default function TodayTaskCard({
  data,
  onToggle,
  isFirst = false,
  isLast = false,
}: {
  data: WorkItem;
  onToggle: () => void;
  /** Trims the rail so the timeline opens at the first task. */
  isFirst?: boolean;
  /** Trims the rail so the timeline stops at the final task. */
  isLast?: boolean;
}) {
  const done = Boolean(data.completed);
  const { clock, meridiem } = splitTime(data.time);

  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: done }}
      accessibilityLabel={`${data.title}, ${data.time}`}
      style={({ pressed }) => [styles.row, pressed && { opacity: pressedOpacity }]}
    >
      <View style={styles.gutter}>
        <Text style={[styles.clock, done && styles.mutedText]}>{clock}</Text>
        {meridiem ? (
          <Text style={[styles.meridiem, done && styles.mutedText]}>{meridiem}</Text>
        ) : null}
      </View>

      <View style={styles.rail}>
        {!isFirst ? <View style={styles.railAbove} /> : null}
        {!isLast ? <View style={styles.railBelow} /> : null}
        <View style={[styles.dot, done && styles.dotDone]}>
          {done ? (
            <SymbolView
              name={{ ios: 'checkmark', android: 'check', web: 'check' }}
              size={11}
              tintColor={colors.onPrimary}
            />
          ) : null}
        </View>
      </View>

      <View style={[styles.card, done && styles.cardDone]}>
        <Text style={[styles.title, done && styles.titleDone]}>{data.title}</Text>
        {data.description ? (
          <Text style={[styles.description, done && styles.mutedText]} numberOfLines={2}>
            {data.description}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const RAIL_WIDTH = 24;
const DOT_SIZE = 20;
/** Vertical offset that lines the dot up with the card's first line of text. */
const DOT_TOP = 14;
/** Distance from the row's top to the dot's centre, where the rail meets it. */
const DOT_CENTER = DOT_TOP + DOT_SIZE / 2;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    // Padding rather than margin, so the rail runs unbroken through the gap.
    paddingBottom: spacing.md,
  },
  gutter: {
    width: 52,
    paddingTop: DOT_TOP - 4,
    alignItems: 'flex-end',
    paddingRight: spacing.sm,
  },
  clock: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.ink,
    ...tabularNums,
  },
  meridiem: {
    marginTop: 1,
    fontSize: 10,
    fontWeight: '700',
    color: colors.inkFaint,
    letterSpacing: 0.4,
  },
  rail: {
    width: RAIL_WIDTH,
    alignItems: 'center',
    // Stretching to the row's height is what lets the connector reach the
    // next task instead of ending at the dot.
    alignSelf: 'stretch',
  },
  railAbove: {
    position: 'absolute',
    top: 0,
    height: DOT_CENTER,
    width: 2,
    borderRadius: 1,
    backgroundColor: colors.border,
  },
  railBelow: {
    position: 'absolute',
    top: DOT_CENTER,
    bottom: 0,
    width: 2,
    borderRadius: 1,
    backgroundColor: colors.border,
  },
  dot: {
    marginTop: DOT_TOP,
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotDone: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  card: {
    flex: 1,
    marginLeft: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.md,
  },
  cardDone: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  title: {
    fontSize: 15.5,
    fontWeight: '600',
    color: colors.ink,
    letterSpacing: -0.2,
  },
  titleDone: {
    color: colors.inkFaint,
    textDecorationLine: 'line-through',
  },
  description: {
    marginTop: 3,
    fontSize: 13.5,
    lineHeight: 19,
    color: colors.inkMuted,
  },
  mutedText: {
    color: colors.inkFaint,
  },
});
