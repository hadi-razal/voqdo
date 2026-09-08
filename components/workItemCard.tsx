import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { WorkItem } from '../src/data/tasks';

export type { WorkItem };

export default function WorkItemCard({ data }: { data: WorkItem }) {
  return (
    <Pressable style={({ pressed }) => [styles.container, pressed && styles.pressed]}>
      <Text style={styles.title}>{data.title}</Text>
      {data.description ? <Text style={styles.description}>{data.description}</Text> : null}
      <View style={styles.date_container}>
        <Text style={styles.date}>{data.time}</Text>
        <Text style={styles.date}>{data.date}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  description: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
  },
  date_container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: 10,
  },
  date: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  pressed: {
    opacity: 0.72,
  },
});
