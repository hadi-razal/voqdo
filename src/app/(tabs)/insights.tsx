import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Body, Card, Display, EmptyState, Kicker, Screen } from '@/components/vq';
import { useJournal, type Entry } from '@/context/journal';
import { Icon, SparkIcon } from '@/icons';
import {
  CATEGORY_KEYS,
  catStyle,
  colors,
  font,
  gutter,
  moodStyle,
  radius,
  tabularNums,
  type Mood,
} from '@/theme';

/**
 * A read on the last thirty days, computed entirely from stored entries —
 * what you write about, how it tends to feel, and what keeps returning.
 */
export default function Insights() {
  const { entries, streak } = useJournal();

  // The window is anchored once, when the screen opens, so re-renders cannot
  // shift it underneath the numbers being read.
  const [openedAt] = useState(() => Date.now());

  const recent = useMemo(() => {
    const cutoff = openedAt - 30 * 24 * 60 * 60 * 1000;
    return entries.filter((entry) => entry.createdAt >= cutoff);
  }, [entries, openedAt]);

  const bars = useMemo(() => {
    const counts = CATEGORY_KEYS.map((cat) => ({
      cat,
      n: recent.filter((entry) => entry.categories.includes(cat)).length,
    }));
    const max = Math.max(1, ...counts.map((c) => c.n));
    return counts.map((c) => ({ ...c, pct: Math.round((c.n / max) * 100) }));
  }, [recent]);

  const moods = useMemo(() => {
    const counts = new Map<Mood, number>();
    for (const entry of recent) counts.set(entry.mood, (counts.get(entry.mood) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [recent]);

  const emotions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const entry of recent) {
      for (const emotion of entry.emotions) {
        counts.set(emotion, (counts.get(emotion) ?? 0) + 1);
      }
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [recent]);

  const top = bars.reduce((a, b) => (b.n > a.n ? b : a), bars[0]);
  const words = recent.reduce((sum, entry) => sum + wordCount(entry), 0);

  if (entries.length === 0) {
    return (
      <Screen contentStyle={styles.content}>
        <Display size={27}>Insights</Display>
        <EmptyState
          icon="sparkle"
          title="Nothing to read yet"
          body="Write a couple of entries and patterns will start showing up here."
        />
      </Screen>
    );
  }

  return (
    <Screen contentStyle={styles.content}>
      <View style={{ gap: 6 }}>
        <Display size={27}>Insights</Display>
        <Body>The last 30 days, in your own words.</Body>
      </View>

      <View style={styles.stats}>
        <Stat n={recent.length} label={recent.length === 1 ? 'Entry' : 'Entries'} />
        <Stat n={streak} label="Day streak" />
        <Stat n={words} label="Words" />
      </View>

      <Card style={styles.headline}>
        <SparkIcon size={16} color={colors.accent} />
        <Text style={styles.headlineText}>
          {top && top.n > 0
            ? `You write about ${top.cat.toLowerCase()} more than anything else.`
            : 'Your entries are still finding their shape.'}
        </Text>
      </Card>

      <View style={styles.section}>
        <Kicker>WHAT YOU WRITE ABOUT</Kicker>
        <Card style={styles.barsCard}>
          {bars.map((bar) => {
            const style = catStyle(bar.cat);
            return (
              <View key={bar.cat} style={styles.barRow}>
                <Text style={[styles.barLabel, { color: style.color }]} numberOfLines={1}>
                  {bar.cat}
                </Text>
                <View style={styles.track}>
                  <View
                    style={[styles.fill, { width: `${bar.pct}%`, backgroundColor: style.color }]}
                  />
                </View>
                <Text style={[styles.barN, tabularNums]}>{bar.n}</Text>
              </View>
            );
          })}
        </Card>
      </View>

      {moods.length > 0 && (
        <View style={styles.section}>
          <Kicker>HOW IT TENDS TO FEEL</Kicker>
          <View style={styles.pills}>
            {moods.map(([mood, n]) => {
              const style = moodStyle(mood);
              return (
                <View key={mood} style={[styles.pill, { backgroundColor: style.bg }]}>
                  <Text style={[styles.pillText, { color: style.color }]}>{mood}</Text>
                  <Text style={[styles.pillN, tabularNums, { color: style.color }]}>{n}</Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {emotions.length > 0 && (
        <View style={styles.section}>
          <Kicker>EMOTIONS THAT KEEP RETURNING</Kicker>
          <Card style={styles.emotionCard}>
            {emotions.map(([emotion, n], i) => (
              <View
                key={emotion}
                style={[styles.emotionRow, i > 0 && styles.emotionDivider]}
              >
                <Icon name="heart" size={15} color={colors.faint} strokeWidth={1.6} />
                <Text style={styles.emotionLabel}>{emotion}</Text>
                <Text style={[styles.emotionN, tabularNums]}>
                  {n} {n === 1 ? 'entry' : 'entries'}
                </Text>
              </View>
            ))}
          </Card>
        </View>
      )}
    </Screen>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statN, tabularNums]}>{n}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function wordCount(entry: Entry): number {
  return entry.body.trim() ? entry.body.trim().split(/\s+/).length : 0;
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: gutter, paddingBottom: 28, gap: 20 },
  stats: { flexDirection: 'row', gap: 9 },
  stat: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radius.lg,
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 3,
  },
  statN: { fontFamily: font.display, fontSize: 24, color: colors.text },
  statLabel: { fontFamily: font.body, fontSize: 11.5, color: colors.faint },
  headline: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', padding: 16 },
  headlineText: { flex: 1, fontFamily: font.displayRegular, fontSize: 15.5, lineHeight: 24, color: colors.text },
  section: { gap: 10 },
  barsCard: { padding: 16, gap: 13 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  barLabel: { width: 104, fontFamily: font.medium, fontSize: 11.5 },
  track: { flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.surfaceRaised, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3 },
  barN: { width: 18, textAlign: 'right', fontFamily: font.body, fontSize: 11.5, color: colors.faint },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
  },
  pillText: { fontFamily: font.medium, fontSize: 12.5 },
  pillN: { fontFamily: font.body, fontSize: 11.5, opacity: 0.75 },
  emotionCard: { paddingHorizontal: 16 },
  emotionRow: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 13 },
  emotionDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  emotionLabel: { flex: 1, fontFamily: font.medium, fontSize: 14, color: colors.text },
  emotionN: { fontFamily: font.body, fontSize: 12, color: colors.faint },
});
