import { SymbolView } from 'expo-symbols';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import WorkItemCard from '../../../components/workItemCard';
import { EmptyState, SectionLabel } from '../../../components/ui';
import { useTasks } from '@/context/tasks';
import { isoDate, timeToMinutes, type WorkItem } from '@/data/tasks';
import { colors, gutter, pressedOpacity, radius, spacing, type } from '@/theme';

type Filter = 'all' | 'open' | 'done';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'open', label: 'Open' },
  { key: 'done', label: 'Done' },
];

/** Prefers a relative label so the common cases read naturally. */
function formatSectionDate(date: string) {
  if (date === isoDate(0)) return 'Today';
  if (date === isoDate(1)) return 'Tomorrow';
  if (date === isoDate(-1)) return 'Yesterday';
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export default function Works() {
  const { tasks } = useTasks();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const groupedWorks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const filtered = tasks.filter((work) => {
      if (filter === 'open' && work.completed) return false;
      if (filter === 'done' && !work.completed) return false;
      if (!normalizedQuery) return true;
      return (
        work.title.toLowerCase().includes(normalizedQuery) ||
        work.description.toLowerCase().includes(normalizedQuery)
      );
    });

    const groups = new Map<string, WorkItem[]>();
    for (const work of filtered) {
      const existing = groups.get(work.date) ?? [];
      existing.push(work);
      groups.set(work.date, existing);
    }

    for (const items of groups.values()) {
      items.sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
    }

    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filter, query, tasks]);

  const resultCount = groupedWorks.reduce((total, [, items]) => total + items.length, 0);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Works</Text>
        <Text style={styles.count}>
          {resultCount} {resultCount === 1 ? 'task' : 'tasks'}
        </Text>
      </View>

      <View style={styles.searchBar}>
        <SymbolView
          name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
          size={17}
          tintColor={colors.inkFaint}
        />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search tasks"
          placeholderTextColor={colors.inkFaint}
          style={styles.input}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
          clearButtonMode="never"
        />
        {query.length > 0 ? (
          <Pressable
            onPress={() => setQuery('')}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
          >
            <SymbolView
              name={{ ios: 'xmark.circle.fill', android: 'cancel', web: 'cancel' }}
              size={17}
              tintColor={colors.inkFaint}
            />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map(({ key, label }) => {
          const active = filter === key;
          return (
            <Pressable
              key={key}
              onPress={() => setFilter(key)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={({ pressed }) => [
                styles.chip,
                active && styles.chipActive,
                pressed && { opacity: pressedOpacity },
              ]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {groupedWorks.length === 0 ? (
          <EmptyState
            icon={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
            title="No tasks found"
            body={
              query
                ? `Nothing matches “${query.trim()}”. Try a different search.`
                : 'Nothing here yet. Switch filters or add a task from Today.'
            }
          />
        ) : (
          groupedWorks.map(([date, items]) => (
            <View key={date} style={styles.section}>
              <SectionLabel trailing={<Text style={styles.sectionCount}>{items.length}</Text>}>
                {formatSectionDate(date)}
              </SectionLabel>
              {items.map((work) => (
                <WorkItemCard key={work.id} data={work} />
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: gutter,
    paddingTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  screenTitle: type.screenTitle,
  count: {
    fontSize: 14,
    color: colors.inkFaint,
    fontWeight: '600',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
    marginHorizontal: gutter,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md + 2,
    height: 46,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: {
    flex: 1,
    fontSize: 15.5,
    color: colors.ink,
    paddingVertical: 0,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: gutter,
    marginBottom: spacing.lg,
  },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: colors.inkMuted,
  },
  chipTextActive: {
    color: colors.onPrimary,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: gutter,
    paddingBottom: spacing.xxxl,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionCount: {
    ...type.caption,
    color: colors.inkFaint,
  },
});
