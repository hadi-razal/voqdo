import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MascotTalk } from '@/components/Mascot';
import { Body, Caption, Card, Display, Kicker, PrimaryButton, Screen, SecondaryButton, TextButton } from '@/components/vq';
import { useAccount } from '@/context/account';
import { useJournal } from '@/context/journal';
import { useToast } from '@/context/toast';
import { Icon } from '@/icons';
import { exportJournal } from '@/lib/exportJournal';
import { MONTHLY_PRICE_LABEL, PRO_BENEFITS } from '@/lib/pricing';
import { useCheckout } from '@/lib/useCheckout';
import { colors, font, gutter, radius } from '@/theme';

/** Shown once the free trial ends without a subscription. */
export default function Paywall() {
  const router = useRouter();
  const { entries } = useJournal();
  const { refreshAccess, user } = useAccount();
  const { toast } = useToast();
  const { checkout, busy } = useCheckout();
  const [checking, setChecking] = useState(false);

  const restore = async () => {
    setChecking(true);
    await refreshAccess();
    setChecking(false);
    toast('Checked your subscription. If you subscribed on another device, sign in there with your email.');
  };

  const share = async () => {
    try {
      if ((await exportJournal(entries)) === 'empty') toast('There are no pages to export yet.');
    } catch {
      toast('Could not open sharing. Please try again.');
    }
  };

  return (
    <Screen contentStyle={styles.content}>
      <MascotTalk
        pose="rest"
        size={130}
        layout="stack"
        bare
        line="I kept every page safe for you."
        taps={['Your words are still here.', 'Pro keeps our ritual going.', 'You can export anytime.']}
      />

      <View style={styles.head}>
        <Kicker color={colors.accent}>YOUR FREE TRIAL HAS ENDED</Kicker>
        <Display size={29} style={styles.center}>Keep your nightly ritual going</Display>
        <Body style={styles.center}>
          {entries.length > 0
            ? `You wrote ${entries.length} ${entries.length === 1 ? 'page' : 'pages'} in your trial. Subscribe to keep journaling with Sprout.`
            : 'Subscribe to keep journaling with Sprout.'}
        </Body>
      </View>

      <Card style={styles.benefits}>
        {PRO_BENEFITS.map((benefit) => (
          <View key={benefit.title} style={styles.benefit}>
            <View style={styles.benefitIcon}>
              <Icon name={benefit.icon} size={16} color={colors.success} strokeWidth={2.2} />
            </View>
            <Text style={styles.benefitText}>{benefit.title}</Text>
          </View>
        ))}
      </Card>

      <View style={styles.price}>
        <Text style={styles.amount}>{MONTHLY_PRICE_LABEL}</Text>
        <Caption>per month · cancel anytime</Caption>
      </View>

      <View style={{ gap: 10 }}>
        <PrimaryButton label={busy ? 'Opening checkout…' : `Continue with Pro`} icon="arrowRight" disabled={busy} onPress={() => checkout()} />
        <SecondaryButton label={checking ? 'Checking…' : 'I already subscribed'} disabled={checking} onPress={restore} />
        {user?.isAnonymous !== false && (
          <TextButton label="Sign in to an existing account" tone="accent" onPress={() => router.push('/account')} />
        )}
        <TextButton label="Export my journal" onPress={share} />
      </View>

      <View style={styles.legal}>
        <Pressable onPress={() => router.push('/terms')} hitSlop={8}>
          <Caption>Terms</Caption>
        </Pressable>
        <Caption>·</Caption>
        <Pressable onPress={() => router.push('/privacy')} hitSlop={8}>
          <Caption>Privacy</Caption>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: gutter, paddingBottom: 36, gap: 18 },
  head: { alignItems: 'center', gap: 8 },
  center: { textAlign: 'center' },
  benefits: { padding: 16, gap: 12 },
  benefit: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  benefitIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: colors.successBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitText: { flex: 1, fontFamily: font.medium, fontSize: 14.5, color: colors.text },
  price: { alignItems: 'center', gap: 2 },
  amount: { fontFamily: font.display, fontSize: 40, color: colors.text },
  legal: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
});
