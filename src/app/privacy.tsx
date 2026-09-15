import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Body, Card, Display, Kicker, Screen, TopBar } from '@/components/vq';
import { colors, gutter } from '@/theme';

const SECTIONS = [
  {
    title: 'What stays on your device',
    body: 'Your journal entries, drafts, reflections, name, and preferences are stored locally with AsyncStorage. Nothing is uploaded unless you choose an optional AI action.',
  },
  {
    title: 'Optional AI suggestions',
    body: 'When you tap Generate AI suggestions or use the Reflection room, only the text you selected is sent to the configured analysis service. Provider data-collection routing is set to deny. AI output is saved only if you keep it when you save.',
  },
  {
    title: 'Microphone & speech',
    body: 'Voice journaling uses the microphone and on-device speech recognition when available. Audio may be kept as a local file reference for that entry; it is never uploaded by VOQDO.',
  },
  {
    title: 'Export & erase',
    body: 'Export shares Markdown through your system share sheet only after you pick a destination. Erase journal permanently deletes local entries, reflections, and settings on this device.',
  },
  {
    title: 'No account required',
    body: 'VOQDO does not create an account, track analytics, or sell your writing. Cloud backup and Pro purchases are not available in this version.',
  },
];

export default function Privacy() {
  const router = useRouter();

  return (
    <Screen contentStyle={styles.content}>
      <TopBar onBack={() => (router.canGoBack() ? router.back() : router.replace('/profile'))} />
      <View style={styles.head}>
        <Kicker color={colors.accent}>PRIVACY</Kicker>
        <Display size={28}>Your words stay yours</Display>
        <Body>A clear look at how VOQDO handles your journal on this device.</Body>
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
