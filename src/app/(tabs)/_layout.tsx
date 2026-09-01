import { Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: 'blue' }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <SymbolView
              name={{ ios: 'house.fill', android: 'home', web: 'home' }}
              tintColor={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          headerShown: false,
          title: 'Schedule',
          tabBarIcon: ({ color, size }) => (
            <SymbolView
              name={{ ios: 'calendar', android: 'calendar_month', web: 'calendar_month' }}
              tintColor={color}
              size={size}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          headerShown: false,
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <SymbolView
              name={{ ios: 'gearshape.fill', android: 'settings', web: 'settings' }}
              tintColor={color}
              size={size}
            />
          ),
        }}
      />
    </Tabs>
  )
}
