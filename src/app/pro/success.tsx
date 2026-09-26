import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { MascotTalk } from '@/components/Mascot';
import { Body, Display, PrimaryButton, Screen, TopBar } from '@/components/vq';
import { useJournal } from '@/context/journal';
import { useToast } from '@/context/toast';
import { confirmProCheckout, parseCheckoutReturn } from '@/lib/payments';
import { colors, gutter } from '@/theme';

export default function ProSuccess() {
  const router = useRouter();
  const params = useLocalSearchParams<Record<string, string | string[]>>();
  const { settings, updateSettings } = useJournal();
  const { toast } = useToast();
  const [status, setStatus] = useState<'checking' | 'active' | 'failed'>(
    settings.pro ? 'active' : 'checking'
  );
  const [message, setMessage] = useState(
    settings.pro ? 'Pro is already unlocked on this device.' : 'Confirming your payment…'
  );
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current || settings.pro) return;
    ran.current = true;
    const parsed = parseCheckoutReturn(params);
    if (!parsed.subscriptionId && !parsed.paymentId) {
      setStatus('failed');
      setMessage(
        'No payment details yet. Finish checkout with Dodo, or return here from the success page.'
      );
      return;
    }

    const controller = new AbortController();
    confirmProCheckout({
      subscriptionId: parsed.subscriptionId,
      paymentId: parsed.paymentId,
      status: parsed.status,
      signal: controller.signal,
    })
      .then((result) => {
        if (controller.signal.aborted) return;
        if (result.active) {
          updateSettings({ pro: true });
          setStatus('active');
          setMessage('Welcome to VOQDO Pro. Your subscription is active on this device.');
          toast('VOQDO Pro unlocked');
        } else {
          setStatus('failed');
          setMessage(result.reason || 'Payment could not be confirmed yet.');
        }
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        setStatus('failed');
        setMessage(error instanceof Error ? error.message : 'Could not verify payment.');
      });

    return () => controller.abort();
  }, [params, settings.pro, toast, updateSettings]);

  return (
    <Screen contentStyle={styles.content}>
      <TopBar onBack={() => (router.canGoBack() ? router.back() : router.replace('/pro'))} />
      <View style={styles.hero}>
        <MascotTalk
          pose={status === 'active' ? 'party' : status === 'checking' ? 'think' : 'rest'}
          size={96}
          layout="stack"
          bare
          line={
            status === 'active'
              ? 'You’re in. Quietly celebrating.'
              : status === 'checking'
                ? 'Checking with Dodo…'
                : 'Almost — let’s try again.'
          }
          taps={
            status === 'active'
              ? ['Pro is unlocked on this device.', 'Habit XP stayed free the whole time.']
              : ['Payments are confirmed securely.', 'Your journal never leaves this device for billing.']
          }
        />
        <Display size={28}>
          {status === 'active' ? 'Pro unlocked' : status === 'checking' ? 'Almost there' : 'Payment pending'}
        </Display>
        <Body style={styles.body}>{message}</Body>
        <PrimaryButton
          label={status === 'active' ? 'Back to VOQDO' : 'Back to Pro'}
          onPress={() => router.replace(status === 'active' ? '/' : '/pro')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: gutter, paddingBottom: 32 },
  hero: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingTop: 24 },
  body: { textAlign: 'center', color: colors.muted, maxWidth: 320 },
});
