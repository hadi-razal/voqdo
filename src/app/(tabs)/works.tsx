import { SymbolView } from 'expo-symbols';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import WorkItemCard, { type WorkItem } from '../../../components/workItemCard';

const WORKS: WorkItem[] = [
  {
    id: 1,
    title: 'Check office emails',
    description: 'Review important emails and reply to pending messages.',
    date: '2026-09-04',
    time: '09:00 AM',
  },
  {
    id: 2,
    title: 'Daily team meeting',
    description: 'Discuss todays priorities and pending work with the team.',
    date: '2026-09-04',
    time: '09:30 AM',
  },
  {
    id: 3,
    title: 'Update Zoho CRM',
    description: 'Review customer records and update missing information.',
    date: '2026-09-04',
    time: '10:00 AM',
  },
  {
    id: 4,
    title: 'Fix website issue',
    description: 'Investigate and fix the reported website loading issue.',
    date: '2026-09-04',
    time: '10:45 AM',
  },
  {
    id: 5,
    title: 'Review project requirements',
    description: 'Go through the requirements for the upcoming development task.',
    date: '2026-09-04',
    time: '11:30 AM',
  },
  {
    id: 6,
    title: 'Lunch break',
    description: 'Take a break and have lunch.',
    date: '2026-09-04',
    time: '01:00 PM',
  },
  {
    id: 7,
    title: 'Work on mobile app',
    description: 'Continue development of the current mobile application.',
    date: '2026-09-04',
    time: '02:00 PM',
  },
  {
    id: 8,
    title: 'Test API integration',
    description: 'Test API requests and verify returned data.',
    date: '2026-09-04',
    time: '03:00 PM',
  },
  {
    id: 9,
    title: 'Client follow-up',
    description: 'Follow up with the client regarding the pending approval.',
    date: '2026-09-04',
    time: '04:00 PM',
  },
  {
    id: 10,
    title: 'Backup project files',
    description: 'Create a backup of important project files and documents.',
    date: '2026-09-04',
    time: '05:00 PM',
  },
  {
    id: 11,
    title: 'Practice DSA',
    description: 'Solve two DSA problems and review the solutions.',
    date: '2026-09-04',
    time: '06:30 PM',
  },
  {
    id: 12,
    title: 'Study machine learning',
    description: 'Continue the current machine learning topic and take notes.',
    date: '2026-09-04',
    time: '07:30 PM',
  },
  {
    id: 13,
    title: 'Football',
    description: 'Play football and complete the evening workout.',
    date: '2026-09-04',
    time: '09:00 PM',
  },
  {
    id: 14,
    title: 'Review GitHub commits',
    description: 'Check today’s code changes and push pending updates.',
    date: '2026-09-04',
    time: '10:30 PM',
  },
  {
    id: 15,
    title: 'Plan tomorrow',
    description: 'Prepare the priority task list for tomorrow.',
    date: '2026-09-04',
    time: '11:00 PM',
  },
  {
    id: 16,
    title: 'Prepare client quotation',
    description: 'Update pricing and prepare the quotation for the client.',
    date: '2026-09-05',
    time: '10:00 AM',
  },
  {
    id: 17,
    title: 'Server maintenance',
    description: 'Check server status, storage usage, and application logs.',
    date: '2026-09-05',
    time: '02:30 PM',
  },
  {
    id: 18,
    title: 'Weekly progress review',
    description: 'Review completed tasks and progress for the week.',
    date: '2026-09-05',
    time: '05:30 PM',
  },
];

function formatSectionDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export default function Works() {
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
    const filtered = WORKS.filter((work) => {
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
    return Array.from(groups.entries());
  }, [query]);

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
