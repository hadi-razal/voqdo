import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { MascotTalk } from '@/components/Mascot';
import { Body, Caption, Card, Display, Kicker, PrimaryButton, Screen, SecondaryButton, TextButton, TopBar } from '@/components/vq';
import { useAccount, type EmailCodeMode } from '@/context/account';
import { useJournal } from '@/context/journal';
import { useSync } from '@/context/sync';
import { useToast } from '@/context/toast';
import { Icon } from '@/icons';
import { confirmDestructive } from '@/lib/confirm';
import { openBillingPortal } from '@/lib/payments';
import { colors, font, gutter, radius } from '@/theme';

export default function Account() {
  const router = useRouter();
  const { cloud, user, access, deleteAccount } = useAccount();
  const { resetAll, updateSettings } = useJournal();
  const sync = useSync();
  const { toast } = useToast();
  const [flow, setFlow] = useState<EmailCodeMode | null>(null);
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/profile'));

  if (!cloud) {
    return (
      <Screen contentStyle={styles.content}>
        <TopBar onBack={goBack} />
        <Display size={28}>Your account</Display>
        <Body>This build runs fully on this device, without an account or cloud backup.</Body>
      </Screen>
    );
  }

  const plan = access.pro
    ? 'VOQDO Pro · active'
    : access.trialActive
      ? `Free trial · ${access.daysLeft} ${access.daysLeft === 1 ? 'day' : 'days'} left`
      : access.known
        ? 'Trial ended'
        : 'Checking…';

  const remove = () =>
    confirmDestructive({
      title: 'Delete your account?',
      message:
        'This permanently deletes your account, cloud backup and journal on this device. A subscription must be cancelled separately in billing settings.',
      confirmLabel: 'Delete account',
      onConfirm: async () => {
        try {
          await deleteAccount();
          resetAll();
          updateSettings({ onboarded: false });
          toast('Account deleted');
        } catch (error) {
          toast(error instanceof Error ? error.message : 'Could not delete the account.');
        }
      },
    });

  const manage = async () => {
    try {
      await openBillingPortal();
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Could not open billing settings.');
    }
  };

  return (
    <Screen contentStyle={styles.content}>
      <TopBar onBack={goBack} />
      <MascotTalk
        pose={user?.isAnonymous === false ? 'heart' : 'shy'}
        size={96}
        line={user?.isAnonymous === false ? 'Your journal is saved to your email.' : 'Add an email so I never lose your pages.'}
        taps={['Everything syncs quietly in the background.', 'Your journal still works offline.']}
      />

      <Card style={styles.card}>
        <Row icon="user" label="Account" value={user ? (user.email ?? 'Guest — not saved to an email') : 'Connecting…'} />
        <Row icon="star" label="Plan" value={plan} />
        <Row
          icon="cloud"
          label="Backup"
          value={
            sync.syncing
              ? 'Syncing…'
              : sync.error
                ? sync.error
                : sync.lastSyncedAt
                  ? `Synced ${new Date(sync.lastSyncedAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`
                  : 'Waiting to sync'
          }
        />
        <TextButton label="Sync now" tone="accent" onPress={sync.syncNow} />
      </Card>

      {user?.isAnonymous !== false && (
        <View style={{ gap: 10 }}>
          {flow ? (
            <EmailCode mode={flow} onDone={() => setFlow(null)} />
          ) : (
            <>
              <PrimaryButton label="Save my journal to an email" icon="arrowRight" onPress={() => setFlow('link')} />
              <SecondaryButton label="Sign in to an existing account" onPress={() => setFlow('signin')} />
            </>
          )}
        </View>
      )}

      {!access.pro && (
        <SecondaryButton label="See VOQDO Pro" onPress={() => router.push('/pro')} />
      )}
      {access.pro && <SecondaryButton label="Manage subscription" onPress={manage} />}

      <View style={{ gap: 6 }}>
        <Kicker>DANGER ZONE</Kicker>
        <TextButton label="Delete account" tone="warn" onPress={remove} />
      </View>
    </Screen>
  );
}

function Row({ icon, label, value }: { icon: 'user' | 'star' | 'cloud'; label: string; value: string }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <Icon name={icon} size={16} color={colors.glow} strokeWidth={2} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Caption>{label}</Caption>
        <Text style={styles.rowValue}>{value}</Text>
      </View>
    </View>
  );
}

/** Email, then a 6-digit code. `link` saves this account; `signin` restores another. */
function EmailCode({ mode, onDone }: { mode: EmailCodeMode; onDone: () => void }) {
  const { sendEmailCode, verifyEmailCode, refreshAccess } = useAccount();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const send = async () => {
    setBusy(true);
    setError('');
    try {
      await sendEmailCode(email, mode);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send a code.');
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    setBusy(true);
    setError('');
    try {
      await verifyEmailCode(email, code, mode);
      await refreshAccess();
      toast(mode === 'link' ? 'Your journal is saved to your email' : 'Signed in — syncing your journal');
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That code didn’t work.');
    } finally {
      setBusy(false);
    }
  };

  const validEmail = /^\S+@\S+\.\S+$/.test(email.trim());

  return (
    <Card style={styles.card}>
      <Display size={20}>{mode === 'link' ? 'Save your journal to an email' : 'Sign in to your account'}</Display>
      <Body>
        {sent
          ? `We sent a 6-digit code to ${email.trim()}.`
          : mode === 'link'
            ? 'Your pages, streak and subscription will follow you to any device.'
            : 'Use the email you saved your journal to. Pages on this device will be added to that account.'}
      </Body>
      {!sent ? (
        <TextInput
          accessibilityLabel="Email address"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          keyboardType="email-address"
          placeholder="you@example.com"
          placeholderTextColor={colors.faint}
          selectionColor={colors.accent}
          style={styles.input}
        />
      ) : (
        <TextInput
          accessibilityLabel="Six-digit code"
          value={code}
          onChangeText={(text) => setCode(text.replace(/\D/g, '').slice(0, 6))}
          keyboardType="number-pad"
          autoComplete={Platform.OS === 'web' ? 'one-time-code' : 'sms-otp'}
          textContentType="oneTimeCode"
          placeholder="123456"
          placeholderTextColor={colors.faint}
          selectionColor={colors.accent}
          style={[styles.input, styles.code]}
        />
      )}
      {!!error && <Body style={{ color: colors.warn }}>{error}</Body>}
      {!sent ? (
        <PrimaryButton label={busy ? 'Sending…' : 'Send code'} disabled={busy || !validEmail} onPress={send} />
      ) : (
        <PrimaryButton label={busy ? 'Checking…' : 'Confirm'} disabled={busy || code.length !== 6} onPress={verify} />
      )}
      <TextButton label={sent ? 'Use a different email' : 'Cancel'} onPress={sent ? () => { setSent(false); setCode(''); } : onDone} />
    </Card>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: gutter, paddingBottom: 40, gap: 16 },
  card: { padding: 16, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    backgroundColor: colors.glowSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowValue: { fontFamily: font.medium, fontSize: 14.5, color: colors.text },
  input: {
    fontFamily: font.medium,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.wash,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  code: { fontSize: 24, letterSpacing: 8, textAlign: 'center' },
});
