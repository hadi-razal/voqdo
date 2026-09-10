import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Body, Card, Display, IconTile, Kicker, Screen, TopBar } from '@/components/vq';
import { useJournal } from '@/context/journal';
import { useToast } from '@/context/toast';
import { Icon, type IconName } from '@/icons';
import { confirmDestructive } from '@/lib/confirm';
import {
  CATEGORY_KEYS,
  catStyle,
  colors,
  font,
  gutter,
  radius,
  tabularNums,
} from '@/theme';

type Row = {
  label: string;
  value: string;
  icon: IconName;
  cat: string;
  onPress?: () => void;
  destructive?: boolean;
};

export default function Profile() {
  const router = useRouter();
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const { entries, streak, settings, updateSettings, resetAll } = useJournal();
  const { toast } = useToast();

  const words = entries.reduce(
    (sum, entry) => sum + (entry.body.trim() ? entry.body.trim().split(/\s+/).length : 0),
    0
  );

  const confirmReset = () =>
    confirmDestructive({
      title: 'Erase your journal?',
      message: 'Every entry and setting will be deleted for good.',
      confirmLabel: 'Erase',
      onConfirm: () => {
        resetAll();
        toast('Journal erased');
      },
    });

  const groups: { label: string; rows: Row[] }[] = [
    {
      label: 'JOURNALLING',
      rows: [
        {
          label: 'Categories',
          value: `${CATEGORY_KEYS.length} active`,
          icon: 'tag',
          cat: 'Mindset',
          onPress: () => router.push('/categories'),
        },
        {
          label: 'Nightly reminder',
          value: settings.nightlyPrompt ? settings.reminderTime : 'Off',
          icon: 'bell',
          cat: 'Personal Growth',
          onPress: () => updateSettings({ nightlyPrompt: !settings.nightlyPrompt }),
        },
        { label: 'Voice language', value: 'English (US)', icon: 'mic', cat: 'Self-Care' },
      ],
    },
    {
      label: 'PLAN',
      rows: [
        {
          label: 'VOQDO Pro',
          value: settings.pro ? 'Active' : 'Free plan',
          icon: 'star',
          cat: 'Gratitude',
          onPress: () => router.push('/pro'),
        },
      ],
    },
    {
      label: 'ABOUT',
      rows: [
        { label: 'Privacy', value: 'On-device', icon: 'lock', cat: 'Reflection' },
        { label: 'Version', value: '1.0', icon: 'info', cat: 'Reflection' },
        {
          label: 'Erase journal',
          value: `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}`,
          icon: 'trash',
          cat: 'Anxiety',
          onPress: confirmReset,
          destructive: true,
        },
      ],
    },
  ];

  return (
    <Screen contentStyle={styles.content}>
      <TopBar onBack={goBack} />

      <View style={styles.identity}>
        <View style={styles.avatar}>
          <Text style={styles.avatarLetter}>
            {settings.name.trim().charAt(0).toUpperCase() || 'Y'}
          </Text>
        </View>
        <Display size={25}>{settings.name}</Display>
        <Body>Journalling since your first entry.</Body>
      </View>

      <View style={styles.stats}>
        <Stat n={entries.length} label={entries.length === 1 ? 'Entry' : 'Entries'} />
        <Stat n={streak} label="Day streak" />
        <Stat n={words} label="Words" />
      </View>

      {groups.map((group) => (
        <View key={group.label} style={styles.group}>
          <Kicker>{group.label}</Kicker>
          <Card style={{ overflow: 'hidden' }}>
            {group.rows.map((row, i) => {
              const style = catStyle(row.cat);
              return (
                <Pressable
                  key={row.label}
                  onPress={row.onPress}
                  disabled={!row.onPress}
                  style={({ pressed }) => [
                    styles.row,
                    i > 0 && styles.rowDivider,
                    pressed && row.onPress ? { backgroundColor: colors.surfaceRaised } : null,
                  ]}
                >
                  <IconTile
                    icon={row.icon}
                    color={row.destructive ? colors.warn : style.color}
                    bg={style.bg}
                    size={34}
                    iconSize={15}
                  />
                  <Text
                    style={[styles.rowLabel, row.destructive && { color: colors.warn }]}
                  >
                    {row.label}
                  </Text>
                  <Text style={styles.rowValue}>{row.value}</Text>
                  {row.onPress && (
                    <Icon name="chevronRight" size={15} color={colors.faint} strokeWidth={1.6} />
                  )}
                </Pressable>
              );
            })}
          </Card>
        </View>
      ))}
    </Screen>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statN, tabularNums]}>{n}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 30 },
  identity: { alignItems: 'center', gap: 8, marginTop: 8, marginBottom: 20, paddingHorizontal: gutter },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  avatarLetter: { fontFamily: font.display, fontSize: 26, color: colors.accent },
  stats: { flexDirection: 'row', gap: 9, paddingHorizontal: gutter, marginBottom: 22 },
  stat: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radius.lg,
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 3,
  },
  statN: { fontFamily: font.display, fontSize: 24, color: colors.text },
  statLabel: { fontFamily: font.body, fontSize: 11.5, color: colors.faint },
  group: { paddingHorizontal: gutter, gap: 10, marginBottom: 18 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14 },
  rowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  rowLabel: { flex: 1, fontFamily: font.medium, fontSize: 14, color: colors.text },
  rowValue: { fontFamily: font.body, fontSize: 12.5, color: colors.faint },
});
