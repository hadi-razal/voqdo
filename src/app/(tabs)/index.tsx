import { HabitCard } from '@/components/HabitCard';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Body, Caption, Card, Display, Screen } from '@/components/vq';
import { useJournal, type WeekDay } from '@/context/journal';
import { ChartIcon, GridIcon, Icon, type IconName } from '@/icons';
import { colors, font, glowShadow, gutter, journalCard, pressedOpacity, radius } from '@/theme';

const PROMPTS = [
  'What made you feel grateful today?',
  'What took more out of you than it should have?',
  'Who was on your mind today?',
  'What is one thing you handled well?',
  'What would make tomorrow feel lighter?',
  'What are you ready to let go of?',
];

const QUOTES = [
  'A few honest lines today\ncan make a lighter tomorrow.',
  'You do not have to solve it.\nYou only have to name it.',
  'Small steps still move you forward.',
];

export default function Home() {
  const router = useRouter();
  const { entries, settings, week } = useJournal();
  const [promptIndex, setPromptIndex] = useState(() => new Date().getDate() % PROMPTS.length);

  const wroteToday = week.some((day) => day.isToday && day.done);
  const quote = QUOTES[new Date().getDate() % QUOTES.length];
  const prompt = PROMPTS[promptIndex];

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.header}>
        <View style={{ flex: 1, gap: 6 }}>
          <Text style={styles.greeting}>{greeting()},</Text>
          <Display size={25}>
            {wroteToday ? 'You showed up today ' : 'Ready when you are '}
            <Text style={{ color: colors.accent }}>♥</Text>
          </Display>
        </View>

        <Pressable
          onPress={() => router.push('/profile')}
          accessibilityLabel="Open profile"
          style={({ pressed }) => [styles.avatar, pressed && { opacity: pressedOpacity }]}
        >
          <Text style={styles.avatarLetter}>
            {settings.name.trim().charAt(0).toUpperCase() || 'Y'}
          </Text>
        </Pressable>
      </View>

      <Text style={styles.quote}>{quote}</Text>

      <View style={styles.week}>
        {week.map((day) => (
          <DayDot key={day.key} day={day} />
        ))}
      </View>

      <Pressable
        onPress={() => router.push('/record')}
        accessibilityRole="button"
        accessibilityLabel="Start journaling"
        style={({ pressed }) => [pressed && { opacity: 0.9 }]}
      >
        <LinearGradient
          colors={[journalCard.from, journalCard.to]}
          style={styles.journalCard}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
        >
          <View style={[styles.micRing, glowShadow(colors.accent, 'sm')]}>
            <Icon name="mic" size={26} color={colors.accent} strokeWidth={1.6} />
          </View>
          <Display size={22}>{wroteToday ? 'Add another page' : 'Tap to Journal'}</Display>
          <Body style={{ textAlign: 'center' }}>
            Speak into the mic, or write below — your thoughts, your way.
          </Body>
        </LinearGradient>
      </Pressable>

      <View style={styles.tiles}>
        <ActionTile
          label={'Write\ninstead'}
          bg={colors.successBg}
          fg={colors.success}
          icon="pencil"
          onPress={() => router.push('/write')}
        />
        <ActionTile
          label="Insights"
          bg="#2A2C52"
          fg="#9BA0E8"
          onPress={() => router.navigate('/insights')}
          render={(color) => <ChartIcon size={21} color={color} />}
        />
        <ActionTile
          label="Browse"
          bg="#33291C"
          fg={colors.glow}
          onPress={() => router.push('/categories')}
          render={(color) => <GridIcon size={21} color={color} />}
        />
      </View>

      <HabitCard />

      <View style={styles.secondary}>
        <Card onPress={() => router.push('/challenges')} style={styles.linkCard}>
          <Icon name="sprout" size={18} color={colors.success} />
          <View style={{ flex: 1, gap: 4 }}>
            <Display size={18}>Guided journeys</Display>
            <Body>Three prompts. Three days. A small shift.</Body>
          </View>
          <Icon name="chevronRight" size={16} color={colors.faint} />
        </Card>
        <Card onPress={() => router.push('/reflect')} style={styles.linkCard}>
          <Icon name="sparkle" size={18} color={colors.accent} />
          <View style={{ flex: 1, gap: 4 }}>
            <Display size={18}>Reflection room</Display>
            <Body>Revisit your week, or find one next step.</Body>
          </View>
          <Icon name="chevronRight" size={16} color={colors.faint} />
        </Card>
      </View>

      <Card style={styles.prompt}>
        <View style={styles.promptHead}>
          <Icon name="clock" size={14} color={colors.muted} strokeWidth={1.7} />
          <Text style={styles.promptTitle}>Today&rsquo;s Prompt</Text>
          <Pressable
            onPress={() => setPromptIndex((i) => (i + 1) % PROMPTS.length)}
            accessibilityLabel="Show another prompt"
            hitSlop={10}
          >
            <Icon name="refresh" size={15} color={colors.muted} strokeWidth={1.7} />
          </Pressable>
        </View>

        <Pressable
          onPress={() => router.push({ pathname: '/write', params: { prompt } })}
          style={({ pressed }) => [styles.promptBody, pressed && { opacity: pressedOpacity }]}
        >
          <Text style={styles.promptText}>{prompt}</Text>
          <Icon name="chevronRight" size={16} color={colors.faint} strokeWidth={1.7} />
        </Pressable>
      </Card>

      {entries.length > 0 ? (
        <Caption style={styles.countLine}>
          {entries.length} {entries.length === 1 ? 'entry' : 'entries'} so far. Keep going.
        </Caption>
      ) : (
        <Caption style={styles.countLine}>Your first page is waiting whenever you are.</Caption>
      )}
    </Screen>
  );
}

function DayDot({ day }: { day: WeekDay }) {
  const border = day.isToday ? colors.glow : colors.border;

  return (
    <View style={styles.dayCol}>
      <Text style={[styles.dayLabel, day.isToday && { color: colors.glow }]}>{day.label}</Text>
      <View
        style={[
          styles.dot,
          { borderColor: border },
          day.done && { backgroundColor: colors.successBg, borderColor: colors.successBg },
          day.isFuture && { opacity: 0.45 },
        ]}
      >
        {day.done && <Icon name="check" size={13} color={colors.success} strokeWidth={2.4} />}
      </View>
    </View>
  );
}

function ActionTile({
  label,
  bg,
  fg,
  icon,
  onPress,
  render,
}: {
  label: string;
  bg: string;
  fg: string;
  icon?: IconName;
  onPress: () => void;
  render?: (color: string) => React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        { backgroundColor: bg },
        pressed && { opacity: pressedOpacity },
      ]}
    >
      {render ? render(fg) : icon ? <Icon name={icon} size={21} color={fg} /> : null}
      <Text style={styles.tileLabel} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.85}>
        {label}
      </Text>
    </Pressable>
  );
}

function greeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: gutter, paddingBottom: 24, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  greeting: { fontFamily: font.body, fontSize: 15, color: colors.muted },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  avatarLetter: { fontFamily: font.medium, fontSize: 14, color: colors.text },
  quote: {
    fontFamily: font.displayItalic,
    fontStyle: 'italic',
    fontSize: 14.5,
    lineHeight: 22,
    color: colors.muted,
    marginTop: -6,
  },
  week: { flexDirection: 'row', justifyContent: 'space-between' },
  dayCol: { alignItems: 'center', gap: 8 },
  dayLabel: { fontFamily: font.medium, fontSize: 11, color: colors.faint },
  dot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  journalCard: {
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: journalCard.border,
    paddingVertical: 26,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 10,
  },
  micRing: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 1.4,
    borderColor: colors.accent,
    backgroundColor: 'rgba(243,196,162,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  tiles: { flexDirection: 'row', gap: 9 },
  tile: {
    flex: 1,
    borderRadius: radius.lg,
    paddingVertical: 14,
    paddingHorizontal: 9,
    gap: 10,
    minHeight: 92,
  },
  tileLabel: { fontFamily: font.medium, fontSize: 11.5, lineHeight: 15, color: colors.text },
  secondary: { gap: 10 },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  prompt: { paddingVertical: 14, paddingHorizontal: 16, gap: 10 },
  promptHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  promptTitle: { flex: 1, fontFamily: font.medium, fontSize: 12.5, color: colors.muted },
  promptBody: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  promptText: { flex: 1, fontFamily: font.body, fontSize: 14, lineHeight: 20, color: colors.text },
  countLine: { textAlign: 'center', marginTop: 2 },
});
