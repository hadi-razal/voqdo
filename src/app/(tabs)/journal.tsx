import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { EntryCard } from '@/components/EntryCard';
import { Body, Display, EmptyState, Kicker, Screen } from '@/components/vq';
import { dayKey, dayLabel, useJournal, type Entry } from '@/context/journal';
import { GridIcon, Icon } from '@/icons';
import { colors, font, gutter, pressedOpacity, radius } from '@/theme';

export default function Journal() {
  const router = useRouter();
  const { entries, streak } = useJournal();

  // Entries are stored newest-first, so day groups inherit that order.
  const groups = useMemo(() => {
    const byDay: { key: string; label: string; entries: Entry[] }[] = [];

    for (const entry of entries) {
      const key = dayKey(entry.createdAt);
      const existing = byDay.find((group) => group.key === key);
      if (existing) existing.entries.push(entry);
      else byDay.push({ key, label: dayLabel(entry.createdAt), entries: [entry] });
    }

    return byDay;
  }, [entries]);

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.head}>
        <View style={{ flex: 1, gap: 4 }}>
          <Display size={30}>Your journal</Display>
          <Body>
            {entries.length === 0
              ? 'Nothing here yet.'
              : `${entries.length} ${entries.length === 1 ? 'page' : 'pages'}${streak > 0 ? ` · ${streak}-day streak` : ''}`}
          </Body>
        </View>
        <Pressable
          onPress={() => router.push('/categories')}
          accessibilityRole="button"
          accessibilityLabel="Browse by category"
          style={({ pressed }) => [styles.iconButton, pressed && { opacity: pressedOpacity }]}
        >
          <GridIcon size={19} color={colors.text} strokeWidth={2} />
        </Pressable>
      </View>

      {entries.length > 0 && (
        <Pressable
          onPress={() => router.push('/search')}
          accessibilityRole="search"
          accessibilityLabel="Search your journal"
          style={({ pressed }) => [styles.search, pressed && { opacity: pressedOpacity }]}
        >
          <Icon name="search" size={17} color={colors.faint} strokeWidth={2} />
          <Text style={styles.searchText}>Search words, moods, tags…</Text>
        </Pressable>
      )}

      {groups.map((group) => (
        <View key={group.key} style={styles.group}>
          <Kicker>{group.label.toUpperCase()}</Kicker>
          {group.entries.map((entry) => (
            <EntryCard key={entry.id} entry={entry} onPress={() => router.push(`/entry/${entry.id}`)} />
          ))}
        </View>
      ))}

      {entries.length === 0 && (
        <EmptyState
          pose="journal"
          title="Your first page is waiting"
          body="Tap the plus below and talk for a minute, or write a few lines."
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: gutter, paddingBottom: 28 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cardStrong,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.cardStrong,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radius.pill,
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginBottom: 22,
  },
  searchText: { fontFamily: font.body, fontSize: 14.5, color: colors.faint },
  group: { gap: 10, marginBottom: 22 },
});
