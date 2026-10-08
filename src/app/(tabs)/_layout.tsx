import { Tabs, router, usePathname } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, type IconName } from '../../components/ui';
import { PLANS } from '../../data/exercises';
import { useStore } from '../../state/store';
import { colors, fonts } from '../../theme';

const TABS: { href: '/home' | '/workouts' | '/progress'; label: string; icon: IconName }[] = [
  { href: '/home', label: 'Home', icon: 'home' },
  { href: '/workouts', label: 'Workouts', icon: 'dumbbell' },
  { href: '/progress', label: 'Progress', icon: 'chart' },
];

function TabBar() {
  const path = usePathname();
  const insets = useSafeAreaInsets();
  const { profile } = useStore();
  const first = PLANS[profile.goal].exerciseIds[0];

  const tab = (x: (typeof TABS)[number]) => {
    const on = path === x.href;
    const color = on ? colors.accent : colors.textFaint;
    return (
      <Pressable key={x.href} accessibilityRole="tab" accessibilityState={{ selected: on }} onPress={() => router.navigate(x.href)} style={s.tab}>
        <Icon name={x.icon} color={color} />
        <Text style={[s.label, { color }]}>{x.label}</Text>
      </Pressable>
    );
  };

  return (
    <View style={[s.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {tab(TABS[0])}
      {tab(TABS[1])}
      <Pressable accessibilityRole="button" accessibilityLabel="Quick start camera workout" onPress={() => router.push(`/exercise/${first}`)} style={s.camera}>
        <Icon name="scan" size={24} color={colors.onAccent} strokeWidth={2.2} />
      </Pressable>
      {tab(TABS[2])}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs tabBar={() => <TabBar />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg } }}>
      <Tabs.Screen name="home" />
      <Tabs.Screen name="workouts" />
      <Tabs.Screen name="progress" />
    </Tabs>
  );
}

const s = StyleSheet.create({
  bar: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', backgroundColor: colors.nav, borderTopWidth: 1, borderTopColor: '#23261F', paddingTop: 10 },
  tab: { width: 76, height: 52, alignItems: 'center', justifyContent: 'center', gap: 4 },
  label: { fontFamily: fonts.semibold, fontSize: 12 },
  camera: { width: 56, height: 56, borderRadius: 18, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
});
