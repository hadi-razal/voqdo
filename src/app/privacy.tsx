import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Body, Card, Display, Kicker, Screen, TopBar } from '@/components/vq';
import { colors, gutter } from '@/theme';

const SECTIONS = [
  {
    title: 'Your journal, on your device first',
    body: 'Entries, drafts and reflections are saved on this device first, so VOQDO works offline. While you have an active trial or subscription, they are also backed up to our database (hosted by Supabase) so they survive a lost phone and sync to your other devices.',
  },
  {
    title: 'Your account',
    body: 'VOQDO creates a private guest account when you finish onboarding, so your trial, backup and subscription belong to you. Add an email any time to sign in on another device. We only use your email for sign-in codes and billing receipts.',
  },
  {
    title: 'Who can read your entries',
    body: 'Only you. Every row in the database is locked to your account with row-level security, and entries are encrypted in transit and at rest. We never sell your writing, use it for advertising, or train AI models on it.',
  },
  {
    title: 'Optional AI',
    body: 'AI suggestions and reflections send only the text you choose, when you tap, to our server and then to OpenRouter and its model provider, with provider data collection set to deny. Nothing from AI requests is stored except a count used for fair-use limits.',
  },
  {
    title: 'Microphone & speech',
    body: 'Voice journaling uses on-device speech recognition when available. Recordings stay on this device and are never uploaded; only the transcribed text is saved as your entry.',
  },
  {
    title: 'Payments',
    body: 'VOQDO Pro is billed by Dodo Payments on their hosted checkout. We receive your subscription status, never your card details, and your journal is never sent to Dodo.',
  },
  {
    title: 'Export, erase & delete',
    body: 'Export your journal as Markdown at any time, even after a trial ends. Erase journal deletes your entries here and in the backup. Delete account (Profile → Account & backup) permanently removes your account and all of its data.',
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
        <Body>A clear look at how VOQDO handles your journal.</Body>
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
