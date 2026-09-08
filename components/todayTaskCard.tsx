import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { WorkItem } from '@/data/tasks';

export default function TodayTaskCard({
  data,
  onToggle,
}: {
  data: WorkItem;
  onToggle: () => void;
}) {
  const done = Boolean(data.completed);

  return (
    <Pressable
      onPress={onToggle}
      style={({ pressed }) => [styles.container, done && styles.containerDone, pressed && styles.pressed]}
    >
      <View style={[styles.check, done && styles.checkDone]}>
        {done ? (
          <SymbolView
            name={{ ios: 'checkmark', android: 'check', web: 'check' }}
            size={12}
            tintColor="#FFFFFF"
          />
        ) : null}
      </View>
      <View style={styles.copy}>
        <Text style={[styles.title, done && styles.titleDone]}>{data.title}</Text>
        {data.description ? (
          <Text style={[styles.description, done && styles.descriptionDone]} numberOfLines={2}>
            {data.description}
          </Text>
        ) : null}
      </View>
      <Text style={[styles.time, done && styles.timeDone]}>{data.time}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 8,
  },
  containerDone: {
    backgroundColor: '#F9FAFB',
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkDone: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  copy: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  titleDone: {
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  description: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
  },
  descriptionDone: {
    color: '#D1D5DB',
  },
  time: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
    marginTop: 2,
  },
  timeDone: {
    color: '#9CA3AF',
  },
  pressed: {
    opacity: 0.72,
  },
});
