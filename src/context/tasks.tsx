import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { formatClockTime, INITIAL_TASKS, isoDate, type WorkItem } from '@/data/tasks';

type NewTask = {
  title: string;
  description?: string;
  time?: string;
  date?: string;
};

type TasksContextValue = {
  tasks: WorkItem[];
  addTask: (task: NewTask) => void;
  toggleTask: (id: number) => void;
};

const TasksContext = createContext<TasksContextValue | null>(null);

export function TasksProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<WorkItem[]>(INITIAL_TASKS);

  const value = useMemo<TasksContextValue>(
    () => ({
      tasks,
      addTask: ({ title, description = '', time, date }) => {
        const trimmedTitle = title.trim();
        if (!trimmedTitle) return;

        setTasks((current) => [
          {
            id: Date.now(),
            title: trimmedTitle,
            description: description.trim(),
            date: date ?? isoDate(0),
            time: time?.trim() || formatClockTime(),
          },
          ...current,
        ]);
      },
      toggleTask: (id) => {
        setTasks((current) =>
          current.map((task) =>
            task.id === id ? { ...task, completed: !task.completed } : task
          )
        );
      },
    }),
    [tasks]
  );

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>;
}

export function useTasks() {
  const context = useContext(TasksContext);
  if (!context) {
    throw new Error('useTasks must be used within TasksProvider');
  }
  return context;
}
