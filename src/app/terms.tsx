import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Body, Card, Display, Kicker, Screen, TopBar } from '@/components/vq';
import { colors, gutter } from '@/theme';

const SECTIONS = [
  {
    title: 'Personal use',
    body: 'VOQDO is a personal journaling app. You are responsible for the content you create and for keeping your device and email account secure.',
  },
  {
    title: 'Free trial',
    body: 'New accounts get a 3-day free trial with every feature. When it ends, a VOQDO Pro subscription is needed to keep writing, syncing and using AI. You can always read, export and delete what you wrote.',
  },
  {
    title: 'VOQDO Pro',
    body: 'Pro is a monthly subscription billed by Dodo Payments at the price shown in the app. It renews automatically until cancelled. Cancel any time from billing settings; access continues until the end of the period you paid for.',
  },
  {
    title: 'Backup & sync',
    body: 'We back up your journal while your trial or subscription is active and work hard to keep it safe, but please keep exports of anything irreplaceable. Deleting your account permanently removes your backup.',
  },
  {
    title: 'AI features',
    body: 'AI suggestions are imperfect — review titles, tags and moods before saving. Fair-use limits keep the service fast and affordable for everyone.',
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
        <Body>Simple terms for a nightly journal. Version 1.0.0.</Body>
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
