import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Body, Card, Display, IconTile, Screen, TopBar } from '@/components/vq';
import { useJournal } from '@/context/journal';
import { CATEGORY_ICONS, Icon } from '@/icons';
import { CATEGORY_KEYS, catStyle, colors, font, gutter, tabularNums } from '@/theme';

/** Every tag, with how much of the journal sits under it. */
export default function Categories() {
  const router = useRouter();
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const { entries, entriesIn } = useJournal();

  return (
    <Screen contentStyle={styles.content}>
      <TopBar onBack={goBack} />

      <View style={styles.head}>
        <Display size={27}>Categories</Display>
        <Body>
          {entries.length} {entries.length === 1 ? 'entry' : 'entries'}, sorted by what they hold.
        </Body>
      </View>

      <View style={styles.list}>
        {CATEGORY_KEYS.map((cat) => {
          const style = catStyle(cat);
          const inCat = entriesIn(cat);

          return (
            <Card
              key={cat}
              onPress={() => router.push(`/category/${encodeURIComponent(cat)}`)}
              style={styles.row}
            >
              <IconTile
                icon={CATEGORY_ICONS[cat] ?? 'moon'}
                color={style.color}
                bg={style.bg}
                size={40}
              />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.rowLabel}>{cat}</Text>
                <Text style={styles.rowRecent} numberOfLines={1}>
                  {inCat[0]?.title ?? 'Nothing yet'}
                </Text>
              </View>
              <Text style={[styles.rowCount, tabularNums]}>{inCat.length}</Text>
              <Icon name="chevronRight" size={16} color={colors.faint} strokeWidth={1.6} />
            </Card>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 28 },
  head: { paddingHorizontal: gutter, gap: 6, marginTop: 6, marginBottom: 18 },
  list: { paddingHorizontal: gutter, gap: 9 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 13, padding: 14 },
  rowLabel: { fontFamily: font.medium, fontSize: 14.5, color: colors.text },
  rowRecent: { fontFamily: font.body, fontSize: 12, color: colors.faint },
  rowCount: { fontFamily: font.body, fontSize: 13, color: colors.muted },
});
