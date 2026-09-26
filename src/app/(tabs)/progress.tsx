import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MascotTalk } from '@/components/Mascot';
import { MoodGarden } from '@/components/MoodGarden';
import { SproutArt } from '@/components/Sprout';
import { Body, Card, Caption, Display, Kicker, PrimaryButton, ProgressBar, Screen, SectionHeader, Segmented, StatTile } from '@/components/vq';
import { useJournal } from '@/context/journal';
import { Icon } from '@/icons';
import { LEVEL_XP, MAX_SHIELDS, SHIELD_EVERY } from '@/lib/habits';
import { companionForProgress } from '@/lib/mascot';
import { STAGES, stageInfo } from '@/lib/pet';
import { starsEarned } from '@/lib/quests';
import { useHabitProgress } from '@/lib/useHabitProgress';
import { colors, font, gutter, radius } from '@/theme';

export default function Garden() {
  const router = useRouter();
  const { entries, settings, updateSettings } = useJournal();
  const progress = useHabitProgress();
  const growth = stageInfo(progress.totalDays);
  const stars = useMemo(() => starsEarned(entries), [entries]);
  const companion = companionForProgress({
    todayDone: progress.todayDone,
    weeklyComplete: progress.weeklyComplete,
    streak: progress.streak,
    totalDays: progress.totalDays,
  });

  return (
    <Screen contentStyle={styles.content}>
      <View style={{ gap: 4 }}>
        <Kicker color={colors.success}>SMALL STEPS, REAL GROWTH</Kicker>
        <Display size={30}>Sprout’s garden</Display>
      </View>

      <Card style={styles.hero}>
        <MascotTalk pose={companion.pose} line={companion.line} taps={companion.taps} size={130} layout="stack" bare />
        <View style={{ alignItems: 'center', gap: 4 }}>
          <Display size={24}>{growth.stage.name} stage</Display>
          <Body style={{ textAlign: 'center' }}>{growth.stage.blurb}</Body>
        </View>

        <View style={styles.path}>
          {STAGES.map((stage, i) => {
            const reached = i <= growth.index;
            const current = i === growth.index;
            return (
              <View key={stage.id} style={styles.pathItem}>
                <View style={[styles.pathArt, current && styles.pathCurrent, !reached && { opacity: 0.35 }]}>
                  <SproutArt look={{ face: reached ? 'happy' : 'sleepy' }} stage={stage.id} size={46} />
                </View>
                <Text style={[styles.pathName, current && { color: colors.success }]}>{stage.name}</Text>
                <Text style={styles.pathDays}>{reached ? (current ? 'Now' : '✓') : `${stage.days}d`}</Text>
              </View>
            );
          })}
        </View>
        <View style={{ gap: 7, alignSelf: 'stretch' }}>
          <ProgressBar value={growth.pct} />
          <Caption style={{ textAlign: 'center' }}>
            {growth.next
              ? `${growth.daysToNext} more journaling ${growth.daysToNext === 1 ? 'day' : 'days'} until ${growth.next.name}`
              : 'Fully grown. Thank you for every page.'}
          </Caption>
        </View>
      </Card>

      <View style={styles.stats}>
        <StatTile value={progress.streak} label="Day streak" icon="flame" color={colors.accent} />
        <StatTile value={progress.bestStreak} label="Best" icon="trophy" color={colors.gold} />
        <StatTile value={progress.shields} label="Shields" icon="shield" color={colors.success} />
        <StatTile value={stars} label="Stars" icon="star" color={colors.gold} />
      </View>

      {!progress.todayDone && (
        <Card style={styles.checkin}>
          <Kicker color={colors.accent}>TODAY’S CHECK-IN</Kicker>
          <Display size={21}>One moment worth remembering</Display>
          <Body>Save any page today for +20 XP{growth.next && growth.daysToNext === 1 ? ` — and Sprout grows into a ${growth.next.name}!` : '.'}</Body>
          <PrimaryButton
            label="Start today’s check-in"
            icon="arrowRight"
            onPress={() =>
              router.push({ pathname: '/write', params: { prompt: 'What is one small thing you want to remember about today?' } })
            }
          />
        </Card>
      )}

      <Card style={styles.card}>
        <View style={styles.levelRow}>
          <View style={styles.levelBadge}>
            <Text style={styles.levelNum}>{progress.level}</Text>
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.levelName}>Level {progress.level} · {progress.levelName}</Text>
            <Caption>{progress.xp} total XP</Caption>
          </View>
        </View>
        <ProgressBar value={progress.levelXp / LEVEL_XP} color={colors.gold} />
        <Caption>{progress.nextLevelXp} XP to level {progress.level + 1}. Your first saved page each day earns 20 XP.</Caption>
      </Card>

      <Card style={styles.card}>
        <MoodGarden entries={entries} />
      </Card>

      <Card style={styles.card}>
        <View style={styles.shieldHead}>
          <View style={styles.shieldIcon}>
            <Icon name="shield" size={22} color={colors.success} strokeWidth={2.2} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.levelName}>Leaf shields · {progress.shields}/{MAX_SHIELDS}</Text>
            <Caption>
              {progress.shields >= MAX_SHIELDS
                ? 'Fully stocked. Your streak is well protected.'
                : `Next shield in ${progress.nextShieldIn} journaling ${progress.nextShieldIn === 1 ? 'day' : 'days'}`}
            </Caption>
          </View>
        </View>
        <Body>
          Earn a shield every {SHIELD_EVERY} journaling days. If life gets busy and you miss a day, a shield is used automatically so your streak survives.
        </Body>
      </Card>

      <View style={{ gap: 12 }}>
        <SectionHeader title="Your week, your pace" />
        <Segmented
          options={[3, 5, 7].map((goal) => ({ value: goal as 3 | 5 | 7, label: `${goal} days` }))}
          value={settings.weeklyGoal}
          onChange={(weeklyGoal) => updateSettings({ weeklyGoal })}
        />
        <View style={styles.goalDots}>
          {Array.from({ length: settings.weeklyGoal }, (_, i) => (
            <View key={i} style={[styles.goalDot, i < progress.weeklyDays && styles.goalDotDone]}>
              <Icon name={i < progress.weeklyDays ? 'check' : 'leaf'} color={i < progress.weeklyDays ? colors.successInk : colors.faint} size={15} strokeWidth={2.4} />
            </View>
          ))}
        </View>
        <Body>
          {progress.weeklyComplete
            ? 'Weekly goal reached. You’re building something good.'
            : `${progress.weeklyDays} of ${settings.weeklyGoal} days this week. Every return counts.`}
        </Body>
      </View>

      <View style={{ gap: 12 }}>
        <SectionHeader title={`Milestones · ${progress.badges.filter((badge) => badge.earned).length}/${progress.badges.length}`} />
        <View style={styles.badges}>
          {progress.badges.map((badge) => (
            <Card key={badge.id} style={[styles.badge, badge.earned && styles.badgeEarned]}>
              <View style={[styles.badgeIcon, badge.earned && { backgroundColor: colors.goldBg }]}>
                <Icon name={badge.earned ? 'trophy' : 'lock'} color={badge.earned ? colors.gold : colors.faint} size={20} strokeWidth={2.2} />
              </View>
              <Text style={styles.badgeTitle}>{badge.name}</Text>
              <Caption>{badge.description}</Caption>
              {!badge.earned && <ProgressBar value={badge.value / badge.target} height={5} color={colors.glow} />}
              <Text style={[styles.badgeCount, badge.earned && { color: colors.gold }]}>
                {badge.earned ? 'Earned' : `${Math.min(badge.value, badge.target)}/${badge.target}`}
              </Text>
            </Card>
          ))}
        </View>
        <Caption style={{ textAlign: 'center', lineHeight: 18 }}>
          Missed a day? Start again whenever you’re ready. XP stays with your saved journal days, and Sprout never shrinks.
        </Caption>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: gutter, paddingBottom: 32, gap: 16 },
  hero: { padding: 18, gap: 16, alignItems: 'center' },
  path: { flexDirection: 'row', alignSelf: 'stretch', justifyContent: 'space-between' },
  pathItem: { alignItems: 'center', gap: 3, flex: 1 },
  pathArt: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  pathCurrent: { backgroundColor: colors.successBg, borderWidth: 1.5, borderColor: colors.success },
  pathName: { fontFamily: font.medium, fontSize: 11.5, color: colors.muted },
  pathDays: { fontFamily: font.body, fontSize: 10.5, color: colors.faint },
  stats: { flexDirection: 'row', gap: 8 },
  checkin: { padding: 18, gap: 10, borderColor: 'rgba(255, 170, 132, 0.28)', backgroundColor: '#1E1719' },
  card: { padding: 18, gap: 12 },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  levelBadge: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.goldBg,
    borderWidth: 2,
    borderColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelNum: { fontFamily: font.black, fontSize: 18, color: colors.gold },
  levelName: { fontFamily: font.semi, fontSize: 16, color: colors.text },
  shieldHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  shieldIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: colors.successBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalDots: { flexDirection: 'row', gap: 8 },
  goalDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.wash,
    borderWidth: 1,
    borderColor: colors.border,
  },
  goalDotDone: { backgroundColor: colors.success, borderColor: colors.success },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  badge: { width: '48%', flexGrow: 1, padding: 14, gap: 6 },
  badgeEarned: { borderColor: 'rgba(243, 197, 103, 0.3)' },
  badgeIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.wash,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  badgeTitle: { fontFamily: font.semi, fontSize: 14.5, color: colors.text },
  badgeCount: { fontFamily: font.medium, fontSize: 12, color: colors.muted },
});
