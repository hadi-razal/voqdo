import { useState, type ReactNode } from 'react';
import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function Icon({
  ios,
  android,
  size = 18,
  color = '#2563EB',
}: {
  ios: SFSymbol;
  android: AndroidSymbol;
  size?: number;
  color?: string;
}) {
  return <SymbolView name={{ ios, android, web: android }} size={size} tintColor={color} />;
}

function SettingsRow({
  ios,
  android,
  label,
  value,
  onPress,
  trailing,
  last,
}: {
  ios: SFSymbol;
  android: AndroidSymbol;
  label: string;
  value?: string;
  onPress?: () => void;
  trailing?: ReactNode;
  last?: boolean;
}) {
  const content = (
    <View style={[styles.row, !last && styles.rowBorder]}>
      <View style={styles.rowIcon}>
        <Icon ios={ios} android={android} />
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
      {value ? <Text style={styles.rowValue}>{value}</Text> : null}
      {trailing}
      {onPress && !trailing ? (
        <Icon ios="chevron.right" android="chevron_right" size={14} color="#9CA3AF" />
      ) : null}
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

export default function Profile() {
  const [reminders, setReminders] = useState(true);
  const [showCompleted, setShowCompleted] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.screenTitle}>Settings</Text>

        <Pressable style={({ pressed }) => [styles.accountCard, pressed && styles.pressed]}>
          <View style={styles.avatar}>
            <Text style={styles.avatarInitials}>JD</Text>
          </View>
          <View style={styles.accountCopy}>
            <Text style={styles.name}>John Doe</Text>
            <Text style={styles.email}>john.doe@example.com</Text>
          </View>
          <Icon ios="chevron.right" android="chevron_right" size={14} color="#9CA3AF" />
        </Pressable>

        <Text style={styles.sectionLabel}>Tasks</Text>
        <View style={styles.card}>
          <SettingsRow
            ios="bell.fill"
            android="notifications"
            label="Due date reminders"
            trailing={
              <Switch
                value={reminders}
                onValueChange={setReminders}
                trackColor={{ false: '#E5E7EB', true: '#93C5FD' }}
                thumbColor={reminders ? '#2563EB' : '#F9FAFB'}
              />
            }
          />
          <SettingsRow
            ios="checkmark.circle.fill"
            android="check_circle"
            label="Show completed"
            trailing={
              <Switch
                value={showCompleted}
                onValueChange={setShowCompleted}
                trackColor={{ false: '#E5E7EB', true: '#93C5FD' }}
                thumbColor={showCompleted ? '#2563EB' : '#F9FAFB'}
              />
            }
          />
          <SettingsRow
            ios="list.bullet"
            android="format_list_bulleted"
            label="Default list"
            value="Inbox"
            onPress={() => {}}
            last
          />
        </View>

        <Text style={styles.sectionLabel}>Appearance</Text>
        <View style={styles.card}>
          <SettingsRow
            ios="moon.fill"
            android="dark_mode"
            label="Dark mode"
            trailing={
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: '#E5E7EB', true: '#93C5FD' }}
                thumbColor={darkMode ? '#2563EB' : '#F9FAFB'}
              />
            }
            last
          />
        </View>

        <Text style={styles.sectionLabel}>Support</Text>
        <View style={styles.card}>
          <SettingsRow
            ios="questionmark.circle.fill"
            android="help"
            label="Help & feedback"
            onPress={() => {}}
          />
          <SettingsRow
            ios="info.circle.fill"
            android="info"
            label="About Voqdo"
            value="1.0.0"
            onPress={() => {}}
            last
          />
        </View>

        <Pressable style={({ pressed }) => [styles.signOut, pressed && styles.pressed]}>
          <Icon ios="rectangle.portrait.and.arrow.right" android="logout" size={18} color="#DC2626" />
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
    marginBottom: 20,
    marginTop: 4,
  },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 24,
    gap: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  accountCopy: {
    flex: 1,
  },
  name: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
  },
  email: {
    marginTop: 2,
    fontSize: 13,
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
    marginBottom: 20,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
    minHeight: 52,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  rowValue: {
    fontSize: 15,
    color: '#6B7280',
  },
  signOut: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
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
