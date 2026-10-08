import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Chip, IconButton, Segmented, t } from '../components/ui';
import { useStore, type Goal, type Profile } from '../state/store';
import { colors, fonts } from '../theme';

const GOALS: { id: Goal; label: string; sub: string }[] = [
  { id: 'strength', label: 'Build strength', sub: 'Squats, push-ups, lunges' },
  { id: 'fat', label: 'Lose fat', sub: 'Circuits and cardio' },
  { id: 'mobility', label: 'Move better', sub: 'Control and posture' },
  { id: 'active', label: 'Stay active', sub: 'Short daily sessions' },
];
const GEAR = [
  ['none', 'Bodyweight only'],
  ['db', 'Dumbbells'],
  ['band', 'Resistance band'],
  ['bar', 'Pull-up bar'],
  ['mat', 'Yoga mat'],
] as const;

export default function Setup() {
  const { profile, setProfile } = useStore();
  const [p, setP] = useState<Profile>(profile);
  const update = (patch: Partial<Profile>) => setP((x) => ({ ...x, ...patch }));

  return (
    <SafeAreaView style={s.root}>
      <View style={s.header}>
        <IconButton icon="back" label="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
        <View style={s.progress}>
          <View style={[s.bar, { backgroundColor: colors.accent }]} />
          <View style={[s.bar, { backgroundColor: colors.accent }]} />
          <View style={s.bar} />
        </View>
        <Text style={t.small}>2 of 3</Text>
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={{ gap: 6 }}>
          <Text style={t.h1}>What are you training for?</Text>
          <Text style={t.body}>Your AI coach builds the plan around this.</Text>
        </View>

        <View style={{ gap: 8 }}>
          <Text style={t.label}>Your first name</Text>
          <TextInput
            value={p.name}
            onChangeText={(name) => update({ name })}
            placeholder="So your coach can cheer you on"
            placeholderTextColor="#8A8D83"
            accessibilityLabel="Your first name"
            style={s.input}
            autoCapitalize="words"
            maxLength={24}
          />
        </View>

        <View style={s.grid}>
          {GOALS.map((g) => {
            const on = p.goal === g.id;
            return (
              <Pressable
                key={g.id}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                onPress={() => update({ goal: g.id })}
                style={[s.goal, on && { backgroundColor: colors.accent, borderColor: colors.accent }]}
              >
                <Text style={[s.goalTitle, on && { color: colors.onAccent }]}>{g.label}</Text>
                <Text style={[s.goalSub, on && { color: colors.onAccent }]}>{g.sub}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={{ gap: 10 }}>
          <Text style={t.label}>Fitness level</Text>
          <Segmented
            value={p.level}
            onChange={(level) => update({ level })}
            options={[
              { value: 'beg', label: 'Beginner' },
              { value: 'int', label: 'Intermediate' },
              { value: 'adv', label: 'Advanced' },
            ]}
          />
        </View>

        <View style={{ gap: 10 }}>
          <Text style={t.label}>Days per week</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[2, 3, 4, 5, 6].map((n) => {
              const on = p.days === n;
              return (
                <Pressable
                  key={n}
                  accessibilityRole="button"
                  accessibilityLabel={`${n} days per week`}
                  accessibilityState={{ selected: on }}
                  onPress={() => update({ days: n })}
                  style={[s.day, on && { borderColor: colors.accent, backgroundColor: 'rgba(198,244,50,0.12)' }]}
                >
                  <Text style={[s.dayText, on && { color: colors.accent }]}>{n}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={{ gap: 10 }}>
          <Text style={t.label}>Equipment you have</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {GEAR.map(([id, label]) => {
              const on = p.gear.includes(id);
              return (
                <Chip
                  key={id}
                  label={label}
                  selected={on}
                  onPress={() => update({ gear: on ? p.gear.filter((g) => g !== id) : [...p.gear, id] })}
                />
              );
            })}
          </View>
        </View>
      </ScrollView>

      <View style={s.footer}>
        <Button
          label="Build my plan"
          onPress={() => {
            setProfile({ ...p, name: p.name.trim() });
            router.replace('/home');
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 24, paddingTop: 8 },
  progress: { flex: 1, flexDirection: 'row', gap: 6 },
  bar: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.border },
  content: { paddingHorizontal: 24, paddingVertical: 20, gap: 22 },
  input: { height: 50, borderRadius: 14, backgroundColor: colors.surface, color: colors.text, paddingHorizontal: 14, fontFamily: fonts.medium, fontSize: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  goal: { width: '48%', flexGrow: 1, height: 96, borderRadius: 16, padding: 14, justifyContent: 'flex-end', gap: 4, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.surface },
  goalTitle: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },
  goalSub: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted },
  day: { flex: 1, height: 48, borderRadius: 12, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  dayText: { fontFamily: fonts.bold, fontSize: 17, color: colors.text },
  footer: { paddingHorizontal: 24, paddingBottom: 12, paddingTop: 8 },
});
