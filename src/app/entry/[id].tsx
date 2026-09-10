import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  Card,
  CategoryChip,
  Display,
  Kicker,
  Prose,
  Screen,
  TextButton,
  TopBar,
} from '@/components/vq';
import { fullStamp, useJournal } from '@/context/journal';
import { useToast } from '@/context/toast';
import { Icon, SparkIcon } from '@/icons';
import { formatDuration } from '@/lib/analyze';
import { confirmDestructive } from '@/lib/confirm';
import { colors, font, gutter, moodStyle } from '@/theme';

/** One saved entry, read the way it was written. */
export default function EntryDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { entryById, deleteEntry } = useJournal();
  const { toast } = useToast();

  const entry = entryById(id ?? '');

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/journal');
  };

  if (!entry) {
    return (
      <Screen contentStyle={{ paddingHorizontal: gutter, gap: 12 }}>
        <TopBar onBack={goBack} />
        <Display size={22}>That entry is gone.</Display>
        <TextButton
          label="Back to journal"
          tone="accent"
          onPress={goBack}
        />
      </Screen>
    );
  }

  const mood = moodStyle(entry.mood);

  const confirmDelete = () =>
    confirmDestructive({
      title: 'Delete this entry?',
      message: 'This cannot be undone.',
      confirmLabel: 'Delete',
      onConfirm: () => {
        deleteEntry(entry.id);
        goBack();
        toast('Entry deleted');
      },
    });

  return (
    <Screen contentStyle={styles.content}>
      <TopBar onBack={goBack} onMore={confirmDelete} />

      <View style={styles.head}>
        <Text style={styles.stamp}>
          {fullStamp(entry.createdAt)}
          {entry.source === 'voice' && entry.durationMs > 0
            ? ` · ${formatDuration(entry.durationMs)}`
            : ''}
        </Text>
        <Display size={28}>{entry.title}</Display>
      </View>

      <Prose style={styles.body}>{entry.body}</Prose>

      <View style={styles.divider} />

      {entry.categories.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <SparkIcon size={15} color={colors.accent} />
            <Kicker color={colors.accent}>AI-Categorized</Kicker>
          </View>
          <View style={styles.chips}>
            {entry.categories.map((cat) => (
              <CategoryChip
                key={cat}
                cat={cat}
                onPress={() => router.push(`/category/${encodeURIComponent(cat)}`)}
              />
            ))}
          </View>
        </View>
      )}

      <Card style={styles.rows}>
        <DetailRow
          icon="smile"
          label="Mood"
          value={entry.mood}
          valueColor={mood.color}
          onPress={() => router.push(`/search?q=${encodeURIComponent(entry.mood)}`)}
        />
        <DetailRow
          icon="heart"
          label="Recognized Emotion"
          value={entry.emotions.length ? entry.emotions.join(', ') : 'Not sure yet'}
          divider
          onPress={
            entry.emotions.length
              ? () => router.push(`/search?q=${encodeURIComponent(entry.emotions[0])}`)
              : undefined
          }
        />
      </Card>

      <View style={styles.affirmation}>
        <Icon name="sprout" size={17} color={colors.success} strokeWidth={1.6} />
        <Text style={styles.affirmationText}>{entry.affirmation}</Text>
      </View>
    </Screen>
  );
}

/** Tapping a row searches the journal for other entries like it. */
function DetailRow({
  icon,
  label,
  value,
  valueColor,
  divider,
  onPress,
}: {
  icon: 'smile' | 'heart';
  label: string;
  value: string;
  valueColor?: string;
  divider?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={onPress ? `Find other entries tagged ${value}` : undefined}
      style={({ pressed }) => [
        styles.row,
        divider && styles.rowDivider,
        pressed && onPress ? { opacity: 0.7 } : null,
      ]}
    >
      <Icon name={icon} size={18} color={colors.muted} strokeWidth={1.6} />
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={[styles.rowValue, valueColor ? { color: valueColor } : null]}>{value}</Text>
      </View>
      {onPress && <Icon name="chevronRight" size={16} color={colors.faint} strokeWidth={1.6} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 40 },
  head: { paddingHorizontal: gutter, gap: 8, marginTop: 6 },
  stamp: { fontFamily: font.body, fontSize: 12.5, color: colors.muted },
  body: { paddingHorizontal: gutter, marginTop: 16 },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginHorizontal: gutter,
    marginVertical: 22,
  },
  section: { paddingHorizontal: gutter, gap: 12 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  rows: { marginHorizontal: gutter, marginTop: 18 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 15, paddingHorizontal: 16 },
  rowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  rowLabel: { fontFamily: font.body, fontSize: 11.5, color: colors.faint },
  rowValue: { fontFamily: font.medium, fontSize: 14.5, color: colors.text, marginTop: 2 },
  affirmation: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: gutter,
    marginTop: 14,
    padding: 17,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  affirmationText: {
    flex: 1,
    fontFamily: font.body,
    fontSize: 13.5,
    lineHeight: 21,
    color: colors.muted,
  },
});
