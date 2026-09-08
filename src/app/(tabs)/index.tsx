import { useMemo, useState } from 'react';
import { SymbolView } from 'expo-symbols';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TodayTaskCard from '../../../components/todayTaskCard';
import { useTasks } from '@/context/tasks';
import { formatClockTime, formatDayLabel, isoDate, timeToMinutes } from '@/data/tasks';

export default function Today() {
  const { tasks, addTask, toggleTask } = useTasks();
  const [composerOpen, setComposerOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [time, setTime] = useState(formatClockTime());

  const today = isoDate(0);
  const todaysTasks = useMemo(
    () =>
      tasks
        .filter((task) => task.date === today)
        .sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time)),
    [tasks, today]
  );
  const remaining = todaysTasks.filter((task) => !task.completed);
  const completed = todaysTasks.filter((task) => task.completed);

  const openComposer = () => {
    setTitle('');
    setDescription('');
    setTime(formatClockTime());
    setComposerOpen(true);
  };

  const closeComposer = () => {
    setComposerOpen(false);
  };

  const submitTask = () => {
    if (!title.trim()) return;
    addTask({ title, description, time });
    closeComposer();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.screenTitle}>Today</Text>
          <Text style={styles.dateLabel}>{formatDayLabel()}</Text>
        </View>
        <Pressable onPress={openComposer} style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}>
          <SymbolView
            name={{ ios: 'plus', android: 'add', web: 'add' }}
            size={20}
            tintColor="#FFFFFF"
          />
        </Pressable>
      </View>

      <View style={styles.summary}>
        <Text style={styles.summaryText}>
          {remaining.length} remaining
          {completed.length > 0 ? ` · ${completed.length} done` : ''}
        </Text>
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={openComposer} style={({ pressed }) => [styles.quickAdd, pressed && styles.pressed]}>
          <View style={styles.quickAddIcon}>
            <SymbolView
              name={{ ios: 'plus', android: 'add', web: 'add' }}
              size={16}
              tintColor="#2563EB"
            />
          </View>
          <Text style={styles.quickAddText}>Add a task</Text>
        </Pressable>

        {todaysTasks.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Nothing planned yet</Text>
            <Text style={styles.emptyBody}>Add a task to start today’s list.</Text>
          </View>
        ) : (
          <>
            {remaining.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Up next</Text>
                {remaining.map((task) => (
                  <TodayTaskCard key={task.id} data={task} onToggle={() => toggleTask(task.id)} />
                ))}
              </View>
            ) : (
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>All caught up</Text>
                <Text style={styles.emptyBody}>Every task for today is done.</Text>
              </View>
            )}

            {completed.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Done</Text>
                {completed.map((task) => (
                  <TodayTaskCard key={task.id} data={task} onToggle={() => toggleTask(task.id)} />
                ))}
              </View>
            ) : null}
          </>
        )}
      </ScrollView>

      <Modal visible={composerOpen} animationType="slide" transparent onRequestClose={closeComposer}>
        <KeyboardAvoidingView
          style={styles.modalRoot}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable style={styles.backdrop} onPress={closeComposer} />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>New task</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="What do you need to do?"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
              autoFocus
              returnKeyType="next"
            />
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Notes (optional)"
              placeholderTextColor="#9CA3AF"
              style={[styles.input, styles.notesInput]}
              multiline
            />
            <TextInput
              value={time}
              onChangeText={setTime}
              placeholder="Time"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
            />
            <View style={styles.sheetActions}>
              <Pressable onPress={closeComposer} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={submitTask}
                disabled={!title.trim()}
                style={({ pressed }) => [
                  styles.primaryButton,
                  !title.trim() && styles.primaryButtonDisabled,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.primaryButtonText}>Add task</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F5F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 4,
  },
  headerCopy: {
    flex: 1,
    paddingRight: 12,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.4,
  },
  dateLabel: {
    marginTop: 2,
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summary: {
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  quickAdd: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 16,
  },
  quickAddIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickAddText: {
    fontSize: 16,
    color: '#6B7280',
  },
  section: {
    marginBottom: 16,
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
  empty: {
    alignItems: 'center',
    paddingTop: 36,
    paddingBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
  },
  emptyBody: {
    marginTop: 6,
    fontSize: 14,
    color: '#6B7280',
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(17, 24, 39, 0.35)',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 28,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    marginBottom: 14,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.3,
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#F4F5F7',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    marginBottom: 10,
  },
  notesInput: {
    minHeight: 84,
    textAlignVertical: 'top',
  },
  sheetActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  secondaryButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F4F5F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  primaryButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.45,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  pressed: {
    opacity: 0.72,
  },
});
