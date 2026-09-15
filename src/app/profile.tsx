import { MONTHLY_PRICE_LABEL } from '@/lib/pricing';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { Body, Card, IconTile, Kicker, Screen, TopBar } from '@/components/vq';
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
  const [name, setName] = useState(settings.name);

  const saveName = () => {
    const next = name.trim() || 'You';
    setName(next);
    if (next !== settings.name) {
      updateSettings({ name: next });
      toast('Name saved');
    }
  };

  const exportJournal = async () => {
    if (!entries.length) {
      toast('Write your first entry before exporting');
      return;
    }
    try {
      await Share.share({
        title: 'VOQDO journal',
        message: entries
          .map(
            (entry) =>
              `# ${entry.title}\n\n${new Date(entry.createdAt).toLocaleString()} · ${entry.mood}\n\n${entry.body}\n\nTags: ${entry.categories.join(', ')}`
          )
          .join('\n\n---\n\n'),
      });
    } catch {
      toast('Could not open sharing. Please try again.');
    }
  };

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
          label: 'Your daily ritual',
          value: `${settings.weeklyGoal} days / week`,
          icon: 'sprout',
          cat: 'Personal Growth',
          onPress: () => router.push('/progress'),
        },
        {
          label: 'Categories',
          value: `${CATEGORY_KEYS.length} active`,
          icon: 'tag',
          cat: 'Mindset',
          onPress: () => router.push('/categories'),
        },
        {
          label: 'Guided journeys',
          value: '3 journeys',
          icon: 'sprout',
          cat: 'Gratitude',
          onPress: () => router.push('/challenges'),
        },
        {
          label: 'Reflection room',
          value: 'Optional AI',
          icon: 'sparkle',
          cat: 'Reflection',
          onPress: () => router.push('/reflect'),
        },
      ],
    },
    {
      label: 'PLAN',
      rows: [
        {
          label: 'VOQDO Pro',
          value: `${MONTHLY_PRICE_LABEL}/month · preview`,
          icon: 'star',
          cat: 'Gratitude',
          onPress: () => router.push('/pro'),
        },
      ],
    },
    {
      label: 'ABOUT',
      rows: [
        {
          label: 'Export journal',
          value: 'Markdown',
          icon: 'export',
          cat: 'Reflection',
          onPress: exportJournal,
        },
        {
          label: 'Privacy',
          value: 'Local + optional AI',
          icon: 'lock',
          cat: 'Reflection',
          onPress: () => router.push('/privacy'),
        },
        {
          label: 'Terms',
          value: 'How VOQDO works',
          icon: 'info',
          cat: 'Reflection',
          onPress: () => router.push('/terms'),
        },
        { label: 'Version', value: '1.0.0', icon: 'info', cat: 'Reflection' },
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
        <TextInput
          accessibilityLabel="Your name"
          value={name}
          onChangeText={setName}
          maxLength={40}
          returnKeyType="done"
          onEndEditing={saveName}
          onSubmitEditing={saveName}
          placeholder="Your name"
          placeholderTextColor={colors.faint}
          style={styles.nameInput}
        />
        <Body>
          {entries.length
            ? `Journalling since your first entry · ${words.toLocaleString()} words`
            : 'Your journal begins when you write the first page.'}
        </Body>
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
                  <Text style={[styles.rowLabel, row.destructive && { color: colors.warn }]}>
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
  identity: {
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    marginBottom: 20,
    paddingHorizontal: gutter,
  },
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
  nameInput: {
    fontFamily: font.display,
    fontSize: 25,
    color: colors.text,
    textAlign: 'center',
    minWidth: 140,
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  rowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  rowLabel: { flex: 1, fontFamily: font.medium, fontSize: 14, color: colors.text },
  rowValue: { fontFamily: font.body, fontSize: 12.5, color: colors.faint },
});
