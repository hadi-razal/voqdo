import { StyleSheet, Text, View } from 'react-native';
import { Body, Card, CategoryChip, Display } from '@/components/vq';
import { clockLabel, type Entry } from '@/context/journal';
import { Icon } from '@/icons';
import { formatDuration } from '@/lib/analyze';
import { colors, font, moodStyle, radius, tabularNums } from '@/theme';

/** One entry as it appears in a list: journal, search results, category. */
export function EntryCard({ entry, onPress }: { entry: Entry; onPress: () => void }) {
  const mood = moodStyle(entry.mood);

  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.top}>
        <Icon
          name={entry.source === 'voice' ? 'micShort' : 'pencil'}
          size={13}
          color={colors.faint}
          strokeWidth={1.8}
        />
        <Text style={[styles.time, tabularNums]}>
          {clockLabel(entry.createdAt)}
          {entry.source === 'voice' && entry.durationMs > 0
            ? ` · ${formatDuration(entry.durationMs)}`
            : ''}
        </Text>
        <View style={[styles.mood, { backgroundColor: mood.bg }]}>
          <Text style={[styles.moodText, { color: mood.color }]}>{entry.mood}</Text>
        </View>
      </View>

      <Display size={19}>{entry.title}</Display>
      <Body numberOfLines={2}>{entry.body}</Body>

      {entry.categories.length > 0 && (
        <View style={styles.chips}>
          {entry.categories.slice(0, 3).map((cat) => (
            <CategoryChip key={cat} cat={cat} />
          ))}
          {entry.categories.length > 3 && (
            <Text style={styles.more}>+{entry.categories.length - 3}</Text>
          )}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, gap: 9 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  time: { flex: 1, fontFamily: font.body, fontSize: 11.5, color: colors.faint },
  mood: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: radius.pill },
  moodText: { fontFamily: font.medium, fontSize: 11 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 7, marginTop: 2 },
  more: { fontFamily: font.body, fontSize: 11.5, color: colors.faint },
});
