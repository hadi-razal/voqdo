import { Pressable, StyleSheet, Text, View } from 'react-native';

export type WorkItem = {
  id: number;
  title: string;
  description: string;
  date: string;
  time: string;
};

export default function WorkItemCard({ data }: { data: WorkItem }) {
  return (
    <Pressable style={({ pressed }) => [styles.container, pressed && styles.pressed]}>
      <Text style={styles.title}>{data.title}</Text>
      <Text style={styles.description}>{data.description}</Text>
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
