import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { EntryCard } from '@/components/EntryCard';
import { Body, Display, EmptyState, Kicker, Screen } from '@/components/vq';
import { useJournal } from '@/context/journal';
import { Icon } from '@/icons';
import { CATEGORY_KEYS, catStyle, colors, font, gutter, pressedOpacity, radius } from '@/theme';

export default function Search() {
  const router = useRouter();
  const { entries, search } = useJournal();
  const params = useLocalSearchParams<{ q?: string }>();
  const [query, setQuery] = useState(params.q ?? '');
  const [lastParam, setLastParam] = useState(params.q ?? '');

  // Arriving from a Mood or Emotion row pre-fills the field. Adjusting during
  // render keeps typing responsive and avoids a second render pass.
  if (params.q !== undefined && params.q !== lastParam) {
    setLastParam(params.q);
    setQuery(params.q);
  }

  const results = useMemo(() => search(query), [query, search]);
  const searching = query.trim().length > 0;

  return (
    <Screen contentStyle={styles.content}>
      <Display size={27}>Search</Display>

      <View style={styles.field}>
        <Icon name="search" size={17} color={colors.faint} strokeWidth={1.7} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search your words, moods, tags…"
          placeholderTextColor={colors.faint}
          style={styles.input}
          selectionColor={colors.accent}
          autoCorrect={false}
          returnKeyType="search"
        />
        {searching && (
          <Pressable onPress={() => setQuery('')} hitSlop={10} accessibilityLabel="Clear search">
            <Icon name="close" size={16} color={colors.faint} strokeWidth={1.8} />
          </Pressable>
        )}
      </View>

      {!searching && (
        <>
          <Kicker>BROWSE BY TAG</Kicker>
          <View style={styles.tags}>
            {CATEGORY_KEYS.map((cat) => {
              const style = catStyle(cat);
              return (
                <Pressable
                  key={cat}
                  onPress={() => setQuery(cat)}
                  style={({ pressed }) => [
                    styles.tag,
                    { backgroundColor: style.bg },
                    pressed && { opacity: pressedOpacity },
                  ]}
                >
                  <Text style={[styles.tagText, { color: style.color }]}>{cat}</Text>
                </Pressable>
              );
            })}
          </View>
        </>
      )}

      {searching && (
        <>
          <Body>
            {results.length} {results.length === 1 ? 'match' : 'matches'}
          </Body>
          <View style={styles.results}>
            {results.map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                onPress={() => router.push(`/entry/${entry.id}`)}
              />
            ))}
          </View>
          {results.length === 0 && (
            <EmptyState
              icon="search"
              title="Nothing matched"
              body="Try a different word, or one of your tags."
            />
          )}
        </>
      )}

      {!searching && entries.length === 0 && (
        <EmptyState title="Nothing to search yet" body="Your entries will show up here." />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: gutter, paddingBottom: 24, gap: 16 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radius.pill,
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  input: { flex: 1, fontFamily: font.body, fontSize: 14, color: colors.text, padding: 0 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: radius.pill },
  tagText: { fontFamily: font.medium, fontSize: 12.5 },
  results: { gap: 10 },
});
