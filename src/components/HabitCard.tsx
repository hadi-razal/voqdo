import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card, Body, Kicker } from '@/components/vq';
import { useHabitProgress } from '@/lib/useHabitProgress';
import { LEVEL_XP } from '@/lib/habits';
import { Icon } from '@/icons';
import { colors, font } from '@/theme';

export function HabitCard() {
  const router = useRouter();
  const progress = useHabitProgress();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Your progress. Level ${progress.level}, ${progress.xp} XP. ${progress.weeklyDays} of ${progress.weeklyGoal} days this week.`} onPress={() => router.push('/progress')}>
      <Card style={styles.card}>
        <View style={styles.row}>
          <Icon name="sprout" size={22} color={colors.success} />
          <View style={{ flex: 1, gap: 4 }}>
            <Kicker color={colors.success}>YOUR DAILY RITUAL</Kicker>
            <Text style={styles.title}>Level {progress.level} · {progress.levelName}</Text>
          </View>
          <Text style={styles.xp}>{progress.xp} XP</Text>
          <Icon name="chevronRight" size={16} color={colors.muted} />
        </View>
        <View style={styles.track}><View style={[styles.fill, { width: `${progress.levelXp / LEVEL_XP * 100}%` }]} /></View>
        <Body>{progress.todayDone ? 'Today is complete. Take that good feeling with you.' : 'One honest entry today. +20 XP for showing up.'}</Body>
        <Text style={styles.meta}>{Math.min(progress.weeklyDays, progress.weeklyGoal)}/{progress.weeklyGoal} weekly days · {progress.nextLevelXp} XP to your next level</Text>
      </Card>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  card: { padding: 17, gap: 12, borderColor: colors.successBg },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { color: colors.text, fontFamily: font.medium, fontSize: 16 },
  xp: { color: colors.accent, fontFamily: font.medium, fontSize: 13 },
  track: { height: 5, backgroundColor: colors.surfaceRaised, borderRadius: 4, overflow: 'hidden' },
  fill: { height: 5, backgroundColor: colors.success },
  meta: { color: colors.muted, fontFamily: font.body, fontSize: 12 },
});
