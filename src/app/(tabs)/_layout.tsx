import { Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { TasksProvider } from '@/context/tasks';

export default function TabLayout() {
  return (
    <TasksProvider>
      <Tabs screenOptions={{ tabBarActiveTintColor: 'blue' }}>
        <Tabs.Screen
          name="index"
          options={{
            headerShown: false,
            title: 'Today',
            tabBarIcon: ({ color, size }) => (
              <SymbolView
                name={{ ios: 'sun.max.fill', android: 'sunny', web: 'sunny' }}
                tintColor={color}
                size={size}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="works"
          options={{
            headerShown: false,
            title: 'Works',
            tabBarIcon: ({ color, size }) => (
              <SymbolView
                name={{ ios: 'briefcase.fill', android: 'work', web: 'work' }}
                tintColor={color}
                size={size}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="profile"
          options={{
            headerShown: false,
            title: 'Profile',
            tabBarIcon: ({ color, size }) => (
              <SymbolView
                name={{ ios: 'person.fill', android: 'person', web: 'person' }}
                tintColor={color}
                size={size}
              />
            ),
          }}
        />
      </Tabs>
    </TasksProvider>
  );
}
