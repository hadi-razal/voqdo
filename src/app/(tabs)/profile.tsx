import { useState, type ReactNode } from 'react';
import { SymbolView } from 'expo-symbols';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function Chevron() {
  return (
    <SymbolView
      name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
      size={14}
      tintColor="#C4C9D2"
    />
  );
}

function SettingsRow({
  label,
  value,
  onPress,
  trailing,
  last,
}: {
  label: string;
  value?: string;
  onPress?: () => void;
  trailing?: ReactNode;
  last?: boolean;
}) {
  const content = (
    <View style={[styles.row, !last && styles.rowBorder]}>
      <Text style={styles.rowLabel}>{label}</Text>
      {value ? <Text style={styles.rowValue}>{value}</Text> : null}
      {trailing}
      {onPress && !trailing ? <Chevron /> : null}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
        {content}
      </Pressable>
    );
  }

  return content;
}

function PreferenceSwitch({
  value,
  onValueChange,
}: {
  value: boolean;
  onValueChange: (next: boolean) => void;
}) {
  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: '#E5E7EB', true: '#93C5FD' }}
      thumbColor={value ? '#2563EB' : '#F9FAFB'}
    />
  );
}

export default function Profile() {
  const [reminders, setReminders] = useState(true);
  const [showCompleted, setShowCompleted] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.screenTitle}>Profile</Text>

        <View style={styles.identity}>
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              <Text style={styles.avatarInitials}>JD</Text>
            </View>
          </View>
          <Text style={styles.name}>John Doe</Text>
          <Text style={styles.email}>john.doe@example.com</Text>
        </View>

        <Text style={styles.sectionLabel}>Preferences</Text>
        <View style={styles.card}>
          <SettingsRow
            label="Due date reminders"
            trailing={<PreferenceSwitch value={reminders} onValueChange={setReminders} />}
          />
          <SettingsRow
            label="Show completed"
            trailing={<PreferenceSwitch value={showCompleted} onValueChange={setShowCompleted} />}
          />
          <SettingsRow label="Default list" value="Inbox" onPress={() => {}} />
          <SettingsRow
            label="Dark mode"
            trailing={<PreferenceSwitch value={darkMode} onValueChange={setDarkMode} />}
            last
          />
        </View>

        <Text style={styles.sectionLabel}>Support</Text>
        <View style={styles.card}>
          <SettingsRow label="Help & feedback" onPress={() => {}} />
          <SettingsRow label="About Voqdo" value="1.0.0" onPress={() => {}} last />
        </View>

        <Pressable style={({ pressed }) => [styles.signOut, pressed && styles.pressed]}>
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F5F7',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.4,
    marginTop: 4,
  },
  identity: {
    alignItems: 'center',
    paddingTop: 28,
    paddingBottom: 32,
  },
  avatarRing: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1D4ED8',
    letterSpacing: -0.4,
  },
  name: {
    marginTop: 14,
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.3,
  },
  email: {
    marginTop: 4,
    fontSize: 15,
    color: '#6B7280',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 24,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    minHeight: 52,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  rowLabel: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  rowValue: {
    fontSize: 15,
    color: '#9CA3AF',
  },
  signOut: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
  },
  pressed: {
    opacity: 0.72,
  },
});
