import { StyleSheet, Text, View } from 'react-native';
import { Card, CategoryChip } from '@/components/vq';
import { MOOD_FACES, useSproutStage } from '@/components/Mascot';
import { SproutArt } from '@/components/Sprout';
import { clockLabel, type Entry } from '@/context/journal';
import { Icon } from '@/icons';
import { formatDuration } from '@/lib/analyze';
import { colors, font, moodStyle, radius, tabularNums } from '@/theme';

/**
 * One entry as it appears in a list: journal, search results, category.
 * Sprout wears the entry's mood, so a scroll through the journal reads as a
 * row of little faces before a single word is read.
 */
export function EntryCard({ entry, onPress }: { entry: Entry; onPress: () => void }) {
  const mood = moodStyle(entry.mood);
  const stage = useSproutStage();
  const voice = entry.source === 'voice';

  return (
    <Card onPress={onPress} style={styles.card} accessibilityLabel={`${entry.title}, feeling ${entry.mood}, ${clockLabel(entry.createdAt)}`}>
      <View style={styles.head}>
        <View style={[styles.face, { backgroundColor: `${mood.color}2E` }]}>
          <SproutArt look={{ face: MOOD_FACES[entry.mood] }} stage={stage} size={42} />
        </View>
        <View style={styles.headText}>
          <Text style={styles.title} numberOfLines={1}>
            {entry.title}
          </Text>
          <View style={styles.meta}>
            <Icon name={voice ? 'micShort' : 'pencil'} size={12} color={colors.faint} strokeWidth={2} />
            <Text style={[styles.metaText, tabularNums]}>
              {clockLabel(entry.createdAt)}
              {voice && entry.durationMs > 0 ? ` · ${formatDuration(entry.durationMs)}` : ''}
            </Text>
            <View style={[styles.dot, { backgroundColor: mood.color }]} />
            <Text style={[styles.metaText, { color: mood.color }]}>{entry.mood}</Text>
          </View>
        </View>
        <Icon name="chevronRight" size={16} color={colors.faint} strokeWidth={2} />
      </View>

      <Text style={styles.excerpt} numberOfLines={2}>
        {entry.body}
      </Text>

      {entry.categories.length > 0 && (
        <View style={styles.chips}>
          {entry.categories.slice(0, 3).map((cat) => (
            <CategoryChip key={cat} cat={cat} />
          ))}
          {entry.categories.length > 3 && <Text style={styles.more}>+{entry.categories.length - 3}</Text>}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: 14, gap: 12 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  face: {
    width: 50,
    height: 50,
    borderRadius: radius.md + 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  headText: { flex: 1, gap: 4 },
  title: { fontFamily: font.display, fontSize: 17.5, lineHeight: 22, color: colors.text, letterSpacing: -0.2 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontFamily: font.medium, fontSize: 12, color: colors.faint },
  dot: { width: 4, height: 4, borderRadius: 2, marginHorizontal: 1 },
  excerpt: { fontFamily: font.displayRegular, fontSize: 15, lineHeight: 23, color: colors.muted },
  chips: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  more: { fontFamily: font.body, fontSize: 12, color: colors.faint },
});
