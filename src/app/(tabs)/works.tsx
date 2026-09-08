import { SymbolView } from 'expo-symbols';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import WorkItemCard from '../../../components/workItemCard';
import { useTasks } from '@/context/tasks';
import type { WorkItem } from '@/data/tasks';

function formatSectionDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export default function Works() {
  const { tasks } = useTasks();
  const [draft, setDraft] = useState('');
  const [query, setQuery] = useState('');

  const runSearch = () => {
    setQuery(draft.trim());
  };

  const clearSearch = () => {
    setDraft('');
    setQuery('');
  };

  const groupedWorks = useMemo(() => {
    const normalizedQuery = query.toLowerCase();
    const filtered = tasks.filter((work) => {
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
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [query, tasks]);

  const resultCount = groupedWorks.reduce((total, [, items]) => total + items.length, 0);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Works</Text>
        <Text style={styles.count}>{resultCount} tasks</Text>
      </View>

      <View style={styles.searchBar}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Search tasks"
          placeholderTextColor="#9CA3AF"
          style={styles.input}
          returnKeyType="search"
          autoCorrect={false}
          onSubmitEditing={runSearch}
        />
        {draft.length > 0 || query.length > 0 ? (
          <Pressable onPress={clearSearch} hitSlop={8} style={styles.clearButton}>
            <SymbolView
              name={{ ios: 'xmark.circle.fill', android: 'cancel', web: 'cancel' }}
              size={18}
              tintColor="#9CA3AF"
            />
          </Pressable>
        ) : null}
        <Pressable onPress={runSearch} hitSlop={8} style={styles.searchButton}>
          <SymbolView
            name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
            size={18}
            tintColor="#2563EB"
          />
        </Pressable>
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {groupedWorks.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No tasks found</Text>
            <Text style={styles.emptyBody}>Try a different search.</Text>
          </View>
        ) : (
          groupedWorks.map(([date, items]) => (
            <View key={date} style={styles.section}>
              <Text style={styles.sectionLabel}>{formatSectionDate(date)}</Text>
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
    backgroundColor: '#F4F5F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 4,
    marginBottom: 12,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.4,
  },
  count: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 12,
    height: 46,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    paddingVertical: 0,
  },
  clearButton: {
    padding: 2,
  },
  searchButton: {
    padding: 2,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginLeft: 4,
    marginTop: 8,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 48,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
  },
  emptyBody: {
    marginTop: 6,
    fontSize: 14,
    color: '#6B7280',
  },
});
