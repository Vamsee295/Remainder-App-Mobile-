import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { BW, C, F } from '@/constants/theme';

const icon = (name: keyof typeof Ionicons.glyphMap) =>
  function TabIcon({ color }: { color: string }) {
    return <Ionicons name={name} size={22} color={color} />;
  };

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: C.accent,
        tabBarInactiveTintColor: C.mute,
        tabBarStyle: { backgroundColor: C.card, borderTopWidth: BW, borderTopColor: C.ink, height: 66, paddingTop: 6 },
        tabBarLabelStyle: { fontFamily: F.cond, fontSize: 13, letterSpacing: 1, textTransform: 'uppercase' },
        sceneStyle: { backgroundColor: C.paper },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Tasks', tabBarIcon: icon('list-sharp') }} />
      <Tabs.Screen name="calendar" options={{ title: 'Calendar', tabBarIcon: icon('calendar-sharp') }} />
      <Tabs.Screen name="todo" options={{ title: 'To-Do', tabBarIcon: icon('checkbox-sharp') }} />
      <Tabs.Screen name="statistics" options={{ title: 'Stats', tabBarIcon: icon('stats-chart-sharp') }} />
    </Tabs>
  );
}
