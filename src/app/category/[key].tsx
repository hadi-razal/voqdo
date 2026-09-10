import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { EntryCard } from '@/components/EntryCard';
import { Body, Display, EmptyState, IconTile, Screen, TopBar } from '@/components/vq';
import { useJournal } from '@/context/journal';
import { CATEGORY_ICONS } from '@/icons';
import { CATEGORY_KEYS, catStyle, gutter, type CategoryKey } from '@/theme';

/** Every entry tagged with one category, newest first. */
export default function CategoryDetail() {
  const router = useRouter();
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const params = useLocalSearchParams<{ key: string }>();
  const { entriesIn } = useJournal();

  const raw = decodeURIComponent(params.key ?? '');
  const cat = (CATEGORY_KEYS.includes(raw as CategoryKey) ? raw : 'Reflection') as CategoryKey;
  const style = catStyle(cat);
  const entries = entriesIn(cat);

  return (
    <Screen contentStyle={styles.content}>
      <TopBar onBack={goBack} />

      <View style={styles.head}>
        <IconTile icon={CATEGORY_ICONS[cat] ?? 'moon'} color={style.color} bg={style.bg} size={44} />
        <View style={{ flex: 1, gap: 4 }}>
          <Display size={25}>{cat}</Display>
          <Body>
            {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
          </Body>
        </View>
      </View>

      <View style={styles.list}>
        {entries.map((entry) => (
          <EntryCard
            key={entry.id}
            entry={entry}
            onPress={() => router.push(`/entry/${entry.id}`)}
          />
        ))}
      </View>

      {entries.length === 0 && (
        <EmptyState title="Nothing here yet" body={`Entries tagged ${cat} will collect here.`} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 28 },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: gutter,
    marginTop: 6,
    marginBottom: 20,
  },
  list: { paddingHorizontal: gutter, gap: 10 },
});
