import { useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';
import { MascotTalk } from '@/components/Mascot';
import { Body, Display, PrimaryButton, Screen } from '@/components/vq';
import { gutter } from '@/theme';

/** Shown for any link that does not resolve — keeps the app's voice. */
export default function NotFound() {
  const router = useRouter();

  return (
    <Screen contentStyle={styles.content}>
      <MascotTalk
        pose="peek"
        size={120}
        layout="stack"
        bare
        line="That path isn’t here."
        taps={['Your journal is still where you left it.', 'Home is one tap away.']}
      />
      <Display size={24}>Nothing here</Display>
      <Body style={styles.body}>
        That page does not exist. Your journal is still where you left it.
      </Body>
      <PrimaryButton label="Back to VOQDO" onPress={() => router.replace('/')} style={styles.cta} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: gutter,
    gap: 10,
  },
  body: { textAlign: 'center' },
  cta: { marginTop: 14, alignSelf: 'stretch' },
});
