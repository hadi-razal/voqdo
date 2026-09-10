import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { EntryCard } from '@/components/EntryCard';
import { Body, Display, EmptyState, Kicker, Screen } from '@/components/vq';
import { dayKey, dayLabel, useJournal, type Entry } from '@/context/journal';
import { gutter } from '@/theme';

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
        <Display size={27}>Your Journal</Display>
        <Body>
          {entries.length === 0
            ? 'Nothing here yet.'
            : `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}${
                streak > 0 ? ` · ${streak}-day streak` : ''
              }`}
        </Body>
      </View>

      {groups.map((group) => (
        <View key={group.key} style={styles.group}>
          <Kicker>{group.label.toUpperCase()}</Kicker>
          {group.entries.map((entry) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              onPress={() => router.push(`/entry/${entry.id}`)}
            />
          ))}
        </View>
      ))}

      {entries.length === 0 && (
        <EmptyState
          title="Your first entry is waiting"
          body="Tap the plus below and talk for a minute, or write a few lines."
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: gutter, paddingBottom: 24 },
  head: { gap: 6, marginBottom: 20 },
  group: { gap: 10, marginBottom: 22 },
});
