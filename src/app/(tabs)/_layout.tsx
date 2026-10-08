import { Redirect, Tabs, router, usePathname } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, type IconName } from '../../components/ui';
import { todaysWorkout } from '../../data/plan';
import { useStore } from '../../state/store';
import { colors, fonts } from '../../theme';

type TabHref = '/home' | '/workouts' | '/progress' | '/profile';
const TABS: { href: TabHref; label: string; icon: IconName }[] = [
  { href: '/home', label: 'Home', icon: 'home' },
  { href: '/workouts', label: 'Workouts', icon: 'dumbbell' },
  { href: '/progress', label: 'Progress', icon: 'chart' },
  { href: '/profile', label: 'Profile', icon: 'user' },
];

function TabBar() {
  const path = usePathname();
  const insets = useSafeAreaInsets();
  const { profile, workouts } = useStore();
  const today = todaysWorkout(profile, workouts);

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
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Start today's workout: ${today.day.title}`}
        onPress={() => router.push({ pathname: '/workout/[program]/[day]', params: { program: today.program.id, day: today.day.id } })}
        style={s.camera}
      >
        <Icon name="play" size={24} color={colors.onAccent} />
      </Pressable>
      {tab(TABS[2])}
      {tab(TABS[3])}
    </View>
  );
}

export default function TabsLayout() {
  const { onboarded } = useStore();
  // New accounts answer the setup questions before seeing their plan.
  if (!onboarded) return <Redirect href="/setup" />;
  return (
    <Tabs tabBar={() => <TabBar />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg } }}>
      <Tabs.Screen name="home" />
      <Tabs.Screen name="workouts" />
      <Tabs.Screen name="progress" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

const s = StyleSheet.create({
  bar: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', backgroundColor: colors.nav, borderTopWidth: 1, borderTopColor: '#23261F', paddingTop: 10 },
  tab: { width: 64, height: 52, alignItems: 'center', justifyContent: 'center', gap: 4 },
  label: { fontFamily: fonts.semibold, fontSize: 12 },
  camera: { width: 56, height: 56, borderRadius: 18, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
});
