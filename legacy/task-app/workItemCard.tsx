import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { WorkItem } from '@/data/tasks';
import { colors, pressedOpacity, radius, shadow, spacing, tabularNums } from '@/theme';
import { Pill } from './ui';

export type { WorkItem };

export default function WorkItemCard({ data, onPress }: { data: WorkItem; onPress?: () => void }) {
  const done = Boolean(data.completed);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.container, pressed && { opacity: pressedOpacity }]}
    >
      {/* Colored spine doubles as the status indicator. */}
      <View style={[styles.spine, done && styles.spineDone]} />

      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={[styles.title, done && styles.titleDone]} numberOfLines={1}>
            {data.title}
          </Text>
          <Pill label={done ? 'Done' : 'Open'} tone={done ? 'success' : 'primary'} />
        </View>

        {data.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {data.description}
          </Text>
        ) : null}

        <View style={styles.footer}>
          <SymbolView
            name={{ ios: 'clock', android: 'schedule', web: 'schedule' }}
            size={13}
            tintColor={colors.inkFaint}
          />
          <Text style={styles.time}>{data.time}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md - 2,
    overflow: 'hidden',
    ...shadow,
  },
  spine: {
    width: 3,
    backgroundColor: colors.primary,
  },
  spineDone: {
    backgroundColor: colors.success,
  },
  body: {
    flex: 1,
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: 15.5,
    fontWeight: '600',
    color: colors.ink,
    letterSpacing: -0.2,
  },
  titleDone: {
    color: colors.inkMuted,
  },
  description: {
    marginTop: spacing.xs + 1,
    fontSize: 13.5,
    lineHeight: 19,
    color: colors.inkMuted,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: spacing.sm + 2,
  },
  time: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.inkFaint,
    ...tabularNums,
  },
});
