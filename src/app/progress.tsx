import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Body, Card, Display, Kicker, PrimaryButton, Screen, TopBar } from '@/components/vq';
import { useJournal } from '@/context/journal';
import { useHabitProgress } from '@/lib/useHabitProgress';
import { LEVEL_XP } from '@/lib/habits';
import { Icon } from '@/icons';
import { colors, font, gutter } from '@/theme';

export default function Progress() {
  const router = useRouter();
  const { settings, updateSettings } = useJournal();
  const progress = useHabitProgress();
  return (
    <Screen contentStyle={styles.content}>
      <TopBar onBack={() => router.canGoBack() ? router.back() : router.replace('/')} />
      <View style={styles.section}>
        <Kicker color={colors.success}>SMALL STEPS, REAL GROWTH</Kicker>
        <Display size={29}>Your daily ritual</Display>
        
        <Body>A little space for yourself, one day at a time.</Body>
      </View>
      <Card style={styles.card}>
        <View style={styles.row}>
          <Icon name="sprout" size={34} color={colors.success} />
          <View style={{ flex: 1, gap: 4 }}><Display size={23}>{progress.levelName}</Display><Body>Level {progress.level} · {progress.xp} total XP</Body></View>
        </View>
        <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: LEVEL_XP, now: progress.levelXp }} style={styles.track}><View style={[styles.fill, { width: `${progress.levelXp}%` }]} /></View>
        <Body>{progress.nextLevelXp} XP to level {progress.level + 1}. Earn 20 XP for your first saved entry each day.</Body>
      </Card>
      <Card style={styles.card}>
        <Kicker color={colors.accent}>{progress.todayDone ? 'TODAY · COMPLETE' : 'TODAY’S CHECK-IN'}</Kicker>
        <Display size={21}>{progress.todayDone ? 'You made time for you.' : 'One moment worth remembering'}</Display>
        <Body>{progress.todayDone ? 'Your daily reward is earned. More writing is always optional.' : 'What is one small thing you want to remember about today?'}</Body>
        <PrimaryButton label={progress.todayDone ? 'Visit your journal' : 'Start today’s check-in · +20 XP'} onPress={() => progress.todayDone ? router.navigate('/journal') : router.push({ pathname: '/write', params: { prompt: 'What is one small thing you want to remember about today?' } })} />
      </Card>
      <View style={styles.section}>
        <Kicker>YOUR WEEK, YOUR PACE</Kicker>
        <Body>Choose how many days you want to journal this week.</Body>
        <View style={styles.row}>
          {([3, 5, 7] as const).map((goal) => <Pressable key={goal} accessibilityRole="button" accessibilityState={{ selected: settings.weeklyGoal === goal }} onPress={() => updateSettings({ weeklyGoal: goal })} style={[styles.goal, settings.weeklyGoal === goal && { backgroundColor: colors.accent }]}><Text style={[styles.goalText, settings.weeklyGoal === goal && { color: colors.accentInk }]}>{goal} days</Text></Pressable>)}
        </View>
        <View style={styles.row}>{Array.from({ length: settings.weeklyGoal }, (_, i) => <View key={i} style={[styles.dot, i < progress.weeklyDays && { backgroundColor: colors.successBg }]}><Icon name={i < progress.weeklyDays ? 'check' : 'leaf'} color={i < progress.weeklyDays ? colors.success : colors.faint} size={17} /></View>)}</View>
        <Body>{progress.weeklyComplete ? 'Weekly goal reached. You’re building something good.' : `${progress.weeklyDays} of ${settings.weeklyGoal} days this week. Every return counts.`}</Body>
      </View>
      <View style={[styles.row, styles.section]}>
        <Stat value={progress.totalDays} label="Days journaled" />
        <Stat value={progress.streak} label="Current streak" />
        <Stat value={progress.bestStreak} label="Best streak" />
      </View>
      <Card style={styles.card}>
        <Kicker color={colors.success}>YOUR GROWING GARDEN</Kicker>
        <View style={styles.row}>{[{ name: 'Seed', days: 1 }, { name: 'Sprout', days: 3 }, { name: 'Bloom', days: 7 }, { name: 'Grove', days: 14 }].map((plant) => <View key={plant.name} style={{ flex: 1, alignItems: 'center', gap: 8 }}><Icon name={progress.totalDays >= plant.days ? 'sprout' : 'lock'} size={28} color={progress.totalDays >= plant.days ? colors.success : colors.faint} /><Text style={styles.statLabel}>{plant.name}</Text><Text style={styles.statLabel}>{progress.totalDays >= plant.days ? 'Grown' : `${plant.days} days`}</Text></View>)}</View>
        <Body>A new plant for each milestone. Your garden grows with saved journaling days.</Body>
        <PrimaryButton label="Explore guided journeys" onPress={() => router.push('/challenges')} />
      </Card>
      <View style={styles.section}>
        <Kicker>MILESTONES · {progress.badges.filter((badge) => badge.earned).length}/{progress.badges.length}</Kicker>
        {progress.badges.map((badge) => <Card key={badge.id} style={styles.badge}>
          <Icon name={badge.earned ? 'star' : 'lock'} color={badge.earned ? colors.accent : colors.faint} size={22} />
          <View style={{ flex: 1, gap: 4 }}><Text style={styles.badgeTitle}>{badge.name}</Text><Body>{badge.description}</Body></View>
          <Text style={styles.badgeCount}>{badge.earned ? 'Earned' : `${Math.min(badge.value, badge.target)}/${badge.target}`}</Text>
        </Card>)}
        <Body>Missed a day? Start again whenever you’re ready. Your XP stays with your saved journal days. Editing or adding extra entries never earns duplicate points.</Body>
      </View>
    </Screen>
  );
}
function Stat({ value, label }: { value: number; label: string }) {
  return <View style={{ flex: 1, gap: 5 }}><Display size={24}>{value}</Display><Text style={styles.statLabel}>{label}</Text></View>;
}
const styles = StyleSheet.create({
  content: { paddingBottom: 44, gap: 20 },
  section: { marginHorizontal: gutter, gap: 12 },
  card: { marginHorizontal: gutter, padding: 18, gap: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  track: { height: 7, borderRadius: 6, backgroundColor: colors.surfaceRaised, overflow: 'hidden' },
  fill: { height: 7, backgroundColor: colors.success },
  goal: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24, backgroundColor: colors.surfaceRaised },
  goalText: { fontFamily: font.medium, fontSize: 14, color: colors.muted },
  dot: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  badgeTitle: { color: colors.text, fontFamily: font.medium, fontSize: 15 },
  badgeCount: { color: colors.accent, fontFamily: font.medium, fontSize: 12 },
  statLabel: { color: colors.muted, fontFamily: font.body, fontSize: 11 },
});
