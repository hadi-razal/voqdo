import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Mascot, MOOD_FACES, useSproutStage } from '@/components/Mascot';
import { SproutArt } from '@/components/Sprout';
import { Body, Caption, Card, Display, Kicker, ProgressBar, Screen, SectionHeader } from '@/components/vq';
import { useAccount } from '@/context/account';
import { dayKey, useJournal, type Entry, type WeekDay } from '@/context/journal';
import { Icon, type IconName } from '@/icons';
import { companionMoment } from '@/lib/mascot';
import { stageInfo } from '@/lib/pet';
import { dailyQuests, starsEarned } from '@/lib/quests';
import { useHabitProgress } from '@/lib/useHabitProgress';
import { colors, font, glowShadow, gutter, journalCard, moodStyle, MOODS, pressedOpacity, radius, type Mood } from '@/theme';

const PROMPTS = [
  'What made you feel grateful today?',
  'What took more out of you than it should have?',
  'Who was on your mind today?',
  'What is one thing you handled well?',
  'What would make tomorrow feel lighter?',
  'What are you ready to let go of?',
  'What surprised you today, even a little?',
  'When did you feel most like yourself today?',
];

const MOOD_PROMPTS: Record<Mood, string> = {
  Bright: 'What’s lighting you up right now?',
  Calm: 'What does this calm feel like, and where did it come from?',
  Tender: 'What feels soft or tender today?',
  Restless: 'What’s buzzing around in your head? Let it all out.',
  Heavy: 'What’s weighing on you? You don’t have to fix it — just name it.',
};

export default function Home() {
  const router = useRouter();
  const { entries, settings, week } = useJournal();
  const progress = useHabitProgress();
  const { cloud, access } = useAccount();
  const [promptIndex, setPromptIndex] = useState(() => new Date().getDate() % PROMPTS.length);
  const [tick, setTick] = useState(0);
  const stage = useSproutStage();

  const wroteToday = progress.todayDone;
  const prompt = PROMPTS[promptIndex];
  const growth = stageInfo(progress.totalDays);
  const moment = useMemo(
    () =>
      companionMoment({
        wroteToday,
        empty: entries.length === 0,
        name: settings.name,
        streak: progress.streak,
        weeklyComplete: progress.weeklyComplete,
        daysAway: progress.daysAway,
      }),
    [wroteToday, entries.length, settings.name, progress.streak, progress.weeklyComplete, progress.daysAway]
  );
  const lines = [moment.line, ...moment.taps];
  const shown = lines[tick % lines.length];

  const quests = useMemo(() => dailyQuests(entries), [entries]);
  const stars = useMemo(() => starsEarned(entries), [entries]);
  const questsDone = quests.filter((quest) => quest.done).length;
  const memory = useMemo(() => pickMemory(entries), [entries]);
  const name = settings.name.trim() && settings.name.trim() !== 'You' ? settings.name.trim() : null;

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.header}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.greeting}>{greeting()}{name ? ',' : ''}</Text>
          <Display size={28}>{name ?? 'Welcome back'}</Display>
        </View>
        <View style={[styles.pill, progress.streak > 0 && styles.pillLive]} accessibilityLabel={`${progress.streak}-day streak`}>
          <Icon name="flame" size={16} color={progress.streak > 0 ? colors.accent : colors.faint} strokeWidth={2.2} />
          <Text style={[styles.pillText, progress.streak > 0 && { color: colors.accent }]}>{progress.streak}</Text>
        </View>
        <Pressable
          onPress={() => router.push('/profile')}
          accessibilityRole="button"
          accessibilityLabel="Open profile"
          style={({ pressed }) => [styles.avatar, pressed && { opacity: pressedOpacity }]}
        >
          <Text style={styles.avatarLetter}>{(name ?? 'Y').charAt(0).toUpperCase()}</Text>
        </Pressable>
      </View>

      {cloud && access.known && access.trialActive && !access.pro && (
        <Pressable
          onPress={() => router.push('/pro')}
          accessibilityRole="button"
          accessibilityLabel={`Free trial, ${access.daysLeft} days left. See VOQDO Pro.`}
          style={({ pressed }) => [styles.trial, pressed && { opacity: pressedOpacity }]}
        >
          <Icon name="sparkle" size={14} color={colors.gold} strokeWidth={2.2} />
          <Text style={styles.trialText}>
            Free trial · <Text style={{ color: colors.gold }}>{access.daysLeft} {access.daysLeft === 1 ? 'day' : 'days'} left</Text>
          </Text>
          <Text style={styles.trialCta}>See Pro</Text>
          <Icon name="chevronRight" size={14} color={colors.muted} strokeWidth={2.2} />
        </Pressable>
      )}

      {/* Sprout's habitat */}
      <Pressable
        onPress={() => setTick((n) => n + 1)}
        accessibilityRole="button"
        accessibilityLabel={`Sprout, ${growth.stage.name} stage, says: ${shown}. Tap for another line.`}
      >
        <LinearGradient colors={[journalCard.from, journalCard.to]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.habitat}>
          <View style={styles.habitatRow}>
            <View style={styles.pedestal}>
              <Mascot pose={tick > 0 && tick % lines.length === 0 ? 'wink' : moment.pose} size={128} bounce={tick} />
            </View>
            <View style={{ flex: 1, gap: 8 }}>
              <Kicker color={colors.glow}>SPROUT · {growth.stage.name.toUpperCase()}</Kicker>
              <View style={styles.bubble}>
                <Text style={styles.bubbleText}>{shown}</Text>
              </View>
              <Caption>Tap Sprout</Caption>
            </View>
          </View>
          <View style={{ gap: 7 }}>
            <ProgressBar value={growth.pct} color={colors.success} track="rgba(255,255,255,0.1)" />
            <Text style={styles.growthText}>
              {growth.next
                ? `${growth.daysToNext} more journaling ${growth.daysToNext === 1 ? 'day' : 'days'} until ${growth.next.name}`
                : 'Fully grown. Every page now waters the grove.'}
            </Text>
          </View>
        </LinearGradient>
      </Pressable>

      {/* Week */}
      <Card style={styles.weekCard} onPress={() => router.navigate('/progress')} accessibilityLabel="Open your garden">
        <View style={styles.weekHead}>
          <Text style={styles.weekTitle}>
            This week · <Text style={{ color: colors.success }}>{Math.min(progress.weeklyDays, progress.weeklyGoal)}/{progress.weeklyGoal}</Text>
          </Text>
          <View style={styles.shields}>
            <Icon name="shield" size={14} color={progress.shields > 0 ? colors.success : colors.faint} strokeWidth={2.2} />
            <Text style={[styles.shieldText, progress.shields > 0 && { color: colors.success }]}>{progress.shields}</Text>
          </View>
        </View>
        <View style={styles.week}>
          {week.map((day) => (
            <DayDot key={day.key} day={day} />
          ))}
        </View>
        {progress.protectedDays > 0 && (
          <Text style={styles.shieldNote}>A leaf shield is protecting your {progress.streak}-day streak. Journal today to keep it going.</Text>
        )}
      </Card>

      {/* Today's page */}
      <Card style={styles.pageCard}>
        <View style={styles.promptHead}>
          <Kicker color={colors.accent}>{wroteToday ? 'ANOTHER PAGE?' : isEvening() ? 'TONIGHT’S PROMPT' : 'TODAY’S PROMPT'}</Kicker>
          <Pressable
            onPress={() => setPromptIndex((i) => (i + 1) % PROMPTS.length)}
            accessibilityRole="button"
            accessibilityLabel="Show another prompt"
            hitSlop={10}
            style={styles.refresh}
          >
            <Icon name="refresh" size={15} color={colors.muted} strokeWidth={2} />
          </Pressable>
        </View>
        <Display size={21}>{prompt}</Display>
        <View style={styles.actions}>
          <Pressable
            onPress={() => router.push('/record')}
            accessibilityRole="button"
            accessibilityLabel="Speak your entry"
            style={({ pressed }) => [styles.actionWrap, glowShadow(colors.accent, 'sm'), pressed && { transform: [{ scale: 0.97 }] }]}
          >
            <LinearGradient colors={[colors.accent, colors.accentDeep]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.action}>
              <Icon name="mic" size={19} color={colors.accentInk} strokeWidth={2.2} />
              <Text style={[styles.actionText, { color: colors.accentInk }]}>Speak</Text>
            </LinearGradient>
          </Pressable>
          <Pressable
            onPress={() => router.push({ pathname: '/write', params: { prompt } })}
            accessibilityRole="button"
            accessibilityLabel="Write about this prompt"
            style={({ pressed }) => [styles.actionWrap, pressed && { transform: [{ scale: 0.97 }] }]}
          >
            <View style={[styles.action, styles.actionGhost]}>
              <Icon name="pencil" size={18} color={colors.success} strokeWidth={2.2} />
              <Text style={[styles.actionText, { color: colors.text }]}>Write</Text>
            </View>
          </Pressable>
        </View>
      </Card>

      {/* Mood quick start */}
      <View style={{ gap: 10 }}>
        <SectionHeader title="How are you, really?" />
        <View style={styles.moods}>
          {MOODS.map((mood) => {
            const tint = moodStyle(mood);
            return (
              <Pressable
                key={mood}
                onPress={() => router.push({ pathname: '/write', params: { prompt: MOOD_PROMPTS[mood], mood } })}
                accessibilityRole="button"
                accessibilityLabel={`I feel ${mood.toLowerCase()}`}
                style={({ pressed }) => [styles.mood, { backgroundColor: tint.bg }, pressed && { transform: [{ scale: 0.94 }] }]}
              >
                <SproutArt look={{ face: MOOD_FACES[mood] }} stage={stage} size={44} />
                <Text style={[styles.moodLabel, { color: tint.color }]}>{mood}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Daily quests */}
      <Card style={styles.quests}>
        <View style={styles.questHead}>
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={styles.questTitle}>Today’s quests</Text>
            <Caption>{questsDone === 3 ? 'All done — Sprout earned a star!' : 'Finish all three to earn Sprout a star'}</Caption>
          </View>
          <View style={styles.stars}>
            <Icon name="star" size={15} color={colors.gold} strokeWidth={2.2} />
            <Text style={styles.starText}>{stars}</Text>
          </View>
        </View>
        <ProgressBar value={questsDone / 3} color={colors.gold} height={6} />
        {quests.map((quest) => (
          <View key={quest.id} style={styles.quest}>
            <View style={[styles.questIcon, quest.done && styles.questIconDone]}>
              <Icon name={quest.done ? 'check' : (quest.icon as IconName)} size={15} color={quest.done ? colors.successInk : colors.muted} strokeWidth={2.4} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.questName, quest.done && styles.questNameDone]}>{quest.title}</Text>
              <Caption>{quest.hint}</Caption>
            </View>
          </View>
        ))}
      </Card>

      {/* A page from the past */}
      {memory && (
        <Card style={styles.memory} onPress={() => router.push(`/entry/${memory.entry.id}`)} accessibilityLabel={`Revisit ${memory.entry.title}`}>
          <View style={styles.memoryHead}>
            <Icon name="history" size={15} color={colors.glow} strokeWidth={2.2} />
            <Kicker color={colors.glow}>{memory.label.toUpperCase()}</Kicker>
          </View>
          <Display size={18}>{memory.entry.title}</Display>
          <Body numberOfLines={2}>{memory.entry.body}</Body>
        </Card>
      )}

      {/* Explore */}
      <View style={styles.explore}>
        <ExploreTile icon="sprout" tint={colors.success} title="Guided journeys" body="3 days, one small shift" onPress={() => router.push('/challenges')} />
        <ExploreTile icon="sparkle" tint={colors.glow} title="Reflection room" body="Revisit your week" onPress={() => router.push('/reflect')} />
      </View>

      <Caption style={styles.countLine}>
        {entries.length > 0
          ? `${entries.length} ${entries.length === 1 ? 'page' : 'pages'} so far · ${progress.xp} XP · Level ${progress.level}`
          : 'Your first page is waiting whenever you are.'}
      </Caption>
    </Screen>
  );
}

function ExploreTile({ icon, tint, title, body, onPress }: { icon: IconName; tint: string; title: string; body: string; onPress: () => void }) {
  return (
    <Card onPress={onPress} style={styles.tile} accessibilityLabel={title}>
      <View style={[styles.tileIcon, { backgroundColor: `${tint}22` }]}>
        <Icon name={icon} size={20} color={tint} strokeWidth={2.2} />
      </View>
      <Text style={styles.tileTitle}>{title}</Text>
      <Caption>{body}</Caption>
    </Card>
  );
}

function DayDot({ day }: { day: WeekDay }) {
  return (
    <View style={styles.dayCol}>
      <Text style={[styles.dayLabel, day.isToday && { color: colors.glow }]}>{day.label.charAt(0)}</Text>
      <View
        style={[
          styles.dot,
          day.isToday && { borderColor: colors.glow, borderWidth: 2 },
          day.done && { backgroundColor: colors.success, borderColor: colors.success },
          day.isFuture && { opacity: 0.4 },
        ]}
      >
        {day.done && <Icon name="leaf" size={14} color={colors.successInk} strokeWidth={2.4} />}
      </View>
    </View>
  );
}

/** An entry from exactly a week, month or year ago — or else an older page, chosen by date. */
function pickMemory(entries: Entry[]): { entry: Entry; label: string } | null {
  const now = new Date();
  const back = (days: number) => {
    const date = new Date(now);
    date.setDate(now.getDate() - days);
    return dayKey(date.getTime());
  };
  for (const [days, label] of [[365, 'One year ago today'], [30, 'One month ago'], [7, 'One week ago today']] as const) {
    const key = back(days);
    const found = entries.find((entry) => dayKey(entry.createdAt) === key);
    if (found) return { entry: found, label };
  }
  const older = entries.filter((entry) => now.getTime() - entry.createdAt > 3 * 86_400_000);
  if (older.length === 0) return null;
  const entry = older[now.getDate() % older.length];
  const days = Math.round((now.getTime() - entry.createdAt) / 86_400_000);
  return { entry, label: `A page from ${days} days ago` };
}

function isEvening(date = new Date()): boolean {
  return date.getHours() >= 17 || date.getHours() < 5;
}

function greeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 5) return 'Up late';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: gutter, paddingBottom: 28, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  greeting: { fontFamily: font.medium, fontSize: 14, color: colors.muted },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.cardStrong,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  pillLive: { borderColor: 'transparent', backgroundColor: colors.accentSoft },
  pillText: { fontFamily: font.semi, fontSize: 15, color: colors.faint },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { fontFamily: font.semi, fontSize: 15, color: colors.text },
  trial: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.goldBg,
    marginTop: -4,
  },
  trialText: { flex: 1, fontFamily: font.medium, fontSize: 13, color: colors.text },
  trialCta: { fontFamily: font.semi, fontSize: 13, color: colors.muted },
  habitat: {
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: journalCard.border,
    padding: 16,
    gap: 14,
    overflow: 'hidden',
  },
  habitatRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pedestal: { width: 132, height: 132, alignItems: 'center', justifyContent: 'center' },
  bubble: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radius.lg,
    borderTopLeftRadius: 6,
    paddingVertical: 11,
    paddingHorizontal: 13,
  },
  bubbleText: { fontFamily: font.medium, fontSize: 15, lineHeight: 21, color: colors.text },
  growthText: { fontFamily: font.medium, fontSize: 12.5, color: colors.muted },
  weekCard: { padding: 16, gap: 12 },
  weekHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  weekTitle: { fontFamily: font.medium, fontSize: 14, color: colors.text },
  shields: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  shieldText: { fontFamily: font.semi, fontSize: 13, color: colors.faint },
  shieldNote: { fontFamily: font.body, fontSize: 12.5, lineHeight: 18, color: colors.success },
  week: { flexDirection: 'row', justifyContent: 'space-between' },
  dayCol: { alignItems: 'center', gap: 7 },
  dayLabel: { fontFamily: font.medium, fontSize: 11.5, color: colors.faint },
  dot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageCard: { padding: 18, gap: 12 },
  promptHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  refresh: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.wash,
  },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  actionWrap: { flex: 1, borderRadius: radius.pill },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: radius.pill,
  },
  actionGhost: { borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface },
  actionText: { fontFamily: font.semi, fontSize: 15.5 },
  moods: { flexDirection: 'row', gap: 8 },
  mood: { flex: 1, alignItems: 'center', gap: 4, paddingTop: 8, paddingBottom: 10, borderRadius: radius.lg },
  moodLabel: { fontFamily: font.medium, fontSize: 11.5 },
  quests: { padding: 16, gap: 12 },
  questHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  questTitle: { fontFamily: font.display, fontSize: 19, color: colors.text },
  stars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.goldBg,
  },
  starText: { fontFamily: font.semi, fontSize: 13.5, color: colors.gold },
  quest: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  questIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.wash,
    borderWidth: 0,
    borderColor: colors.border,
  },
  questIconDone: { backgroundColor: colors.success, borderColor: colors.success },
  questName: { fontFamily: font.medium, fontSize: 14.5, color: colors.text },
  questNameDone: { color: colors.success },
  memory: { padding: 16, gap: 8 },
  memoryHead: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  explore: { flexDirection: 'row', gap: 10 },
  tile: { flex: 1, padding: 16, gap: 6 },
  tileIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  tileTitle: { fontFamily: font.semi, fontSize: 15, color: colors.text },
  countLine: { textAlign: 'center', marginTop: 2 },
});
