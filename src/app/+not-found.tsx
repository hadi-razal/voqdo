import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Body, Display, PrimaryButton, Screen } from '@/components/vq';
import { Icon } from '@/icons';
import { colors, gutter } from '@/theme';

/** Shown for any link that does not resolve — keeps the app's voice. */
export default function NotFound() {
  const router = useRouter();

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.icon}>
        <Icon name="moon" size={26} color={colors.faint} strokeWidth={1.5} />
      </View>
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
  icon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  body: { textAlign: 'center' },
  cta: { marginTop: 14, alignSelf: 'stretch' },
});
