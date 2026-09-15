import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Body, Card, Display, Kicker, Screen, TopBar } from '@/components/vq';
import { colors, gutter } from '@/theme';

const SECTIONS = [
  {
    title: 'Personal use',
    body: 'VOQDO is a personal journaling app. You are responsible for the content you create and for keeping your device secure.',
  },
  {
    title: 'Local storage',
    body: 'Entries live on your device. Uninstalling the app, clearing storage, or using Erase journal can permanently remove your data. Keep exports if you need a backup.',
  },
  {
    title: 'Optional AI',
    body: 'AI features are optional and may be unavailable without a configured backend. Suggestions are imperfect — review titles, tags, and moods before saving.',
  },
  {
    title: 'Pro & purchases',
    body: 'Pro benefits shown in the app are a preview. No subscription or in-app purchase is charged in this version. Restore Purchases has no effect until billing ships.',
  },
  {
    title: 'Health note',
    body: 'VOQDO is not a medical or mental-health service. If you are in crisis, contact local emergency services or a trusted professional.',
  },
];

export default function Terms() {
  const router = useRouter();

  return (
    <Screen contentStyle={styles.content}>
      <TopBar onBack={() => (router.canGoBack() ? router.back() : router.replace('/profile'))} />
      <View style={styles.head}>
        <Kicker color={colors.accent}>TERMS</Kicker>
        <Display size={28}>How VOQDO works</Display>
        <Body>Simple terms for a local-first journal. Version 1.0.0.</Body>
      </View>
      {SECTIONS.map((section) => (
        <Card key={section.title} style={styles.card}>
          <Display size={18}>{section.title}</Display>
          <Body>{section.body}</Body>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: gutter, paddingBottom: 40, gap: 14 },
  head: { gap: 10, marginTop: 4, marginBottom: 6 },
  card: { padding: 16, gap: 8 },
});
