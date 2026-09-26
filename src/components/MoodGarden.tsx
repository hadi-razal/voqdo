import { memo, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';
import { dayKey, type Entry } from '@/context/journal';
import { colors, font, MOODS, type Mood } from '@/theme';

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/** Petal colours are brighter than the mood's text ink so the garden blooms. */
const PETALS: Record<Mood, string> = {
  Bright: '#FFC54A',
  Calm: '#56CBC6',
  Tender: '#FF8DB6',
  Restless: '#FF9467',
  Heavy: '#95A1D6',
};

function Flower({ color, size }: { color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Path d="M20 22 Q19 30 20 38" stroke="#4DB783" strokeWidth="2.6" strokeLinecap="round" fill="none" />
      <Ellipse cx="26" cy="31" rx="5" ry="2.6" fill="#6FD6A0" transform="rotate(-30 26 31)" />
      {[0, 72, 144, 216, 288].map((angle) => (
        <Ellipse key={angle} cx="20" cy="9" rx="5.5" ry="7" fill={color} transform={`rotate(${angle} 20 16)`} />
      ))}
      <Circle cx="20" cy="16" r="4.2" fill="#FFD27A" />
    </Svg>
  );
}

/**
 * This month as a garden: every journaled day grows a flower in the colour of
 * that day's most common mood. Empty days stay as soil, never as a red mark.
 */
export const MoodGarden = memo(function MoodGarden({ entries }: { entries: Entry[] }) {
  const [now] = useState(() => Date.now());
  const { cells, monthLabel, planted } = useMemo(() => {
    const today = new Date(now);
    const first = new Date(today.getFullYear(), today.getMonth(), 1);
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const lead = (first.getDay() + 6) % 7;

    const moods = new Map<string, Map<Mood, number>>();
    for (const entry of entries) {
      const key = dayKey(entry.createdAt);
      const counts = moods.get(key) ?? new Map<Mood, number>();
      counts.set(entry.mood, (counts.get(entry.mood) ?? 0) + 1);
      moods.set(key, counts);
    }

    const list: ({ day: number; mood: Mood | null; today: boolean; future: boolean } | null)[] = Array(lead).fill(null);
    let count = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(today.getFullYear(), today.getMonth(), day);
      const counts = moods.get(dayKey(date.getTime()));
      const mood = counts ? [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0] : null;
      if (mood) count++;
      list.push({ day, mood, today: day === today.getDate(), future: day > today.getDate() });
    }
    while (list.length % 7) list.push(null);

    return {
      cells: list,
      planted: count,
      monthLabel: today.toLocaleDateString(undefined, { month: 'long' }),
    };
  }, [entries, now]);

  return (
    <View style={{ gap: 12 }}>
      <View style={styles.head}>
        <Text style={styles.title}>{monthLabel} garden</Text>
        <Text style={styles.count}>
          {planted} {planted === 1 ? 'flower' : 'flowers'}
        </Text>
      </View>
      <View style={styles.row}>
        {WEEKDAYS.map((label, i) => (
          <Text key={i} style={styles.weekday}>
            {label}
          </Text>
        ))}
      </View>
      <View style={styles.grid}>
        {cells.map((cell, i) => (
          <View key={i} style={styles.cell}>
            {cell && (
              <View
                style={[styles.plot, cell.today && styles.today, cell.future && { opacity: 0.35 }]}
                accessibilityLabel={cell.mood ? `Day ${cell.day}: ${cell.mood}` : `Day ${cell.day}`}
              >
                {cell.mood ? <Flower color={PETALS[cell.mood]} size={30} /> : <Text style={styles.dayNum}>{cell.day}</Text>}
              </View>
            )}
          </View>
        ))}
      </View>
      <View style={styles.legend}>
        {MOODS.map((mood) => (
          <View key={mood} style={styles.legendItem}>
            <View style={[styles.swatch, { backgroundColor: PETALS[mood] }]} />
            <Text style={styles.legendText}>{mood}</Text>
          </View>
        ))}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  title: { fontFamily: font.display, fontSize: 19, color: colors.text },
  count: { fontFamily: font.medium, fontSize: 13, color: colors.success },
  row: { flexDirection: 'row' },
  weekday: { flex: 1, textAlign: 'center', fontFamily: font.medium, fontSize: 11, color: colors.faint },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, padding: 2.5 },
  plot: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: colors.wash,
    alignItems: 'center',
    justifyContent: 'center',
  },
  today: { borderWidth: 1.5, borderColor: colors.glow },
  dayNum: { fontFamily: font.medium, fontSize: 11, color: colors.faint },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  swatch: { width: 9, height: 9, borderRadius: 5 },
  legendText: { fontFamily: font.body, fontSize: 11.5, color: colors.muted },
});
