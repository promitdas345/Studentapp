// The three tabs: Today · This week · Settings (PRODUCT.md §7). Everything else opens on top of them.
// JavaScript tabs from Expo Router (docs: router/advanced/tabs; imported from expo-router/js-tabs,
// as the SDK 57 package asks). No icon library is installed, so the tabs are words only.
import { Tabs } from 'expo-router/js-tabs';

import { colors } from '../../components/ui';
import { en } from '../../copy/en';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarIcon: () => null,
        tabBarIconStyle: { display: 'none' },
        tabBarLabelStyle: { fontSize: 16, fontWeight: '600' },
      }}>
      <Tabs.Screen name="index" options={{ title: en.tabs.today }} />
      <Tabs.Screen name="week" options={{ title: en.tabs.week }} />
      <Tabs.Screen name="settings" options={{ title: en.tabs.settings }} />
    </Tabs>
  );
}
