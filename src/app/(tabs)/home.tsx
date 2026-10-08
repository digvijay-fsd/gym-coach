import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Icon, t } from '../../components/ui';
import { dayMinutes, getExercise } from '../../data/exercises';
import { todaysWorkout } from '../../data/plan';
import { useNow } from '../../hooks/useNow';
import { startOfDay, streak, useStore } from '../../state/store';
import { colors, fonts } from '../../theme';

const DAY = 86_400_000;

export default function Home() {
  const { profile, history, workouts } = useStore();
  const { program, day } = todaysWorkout(profile, workouts);
  const now = useNow();
  const today = startOfDay(now);
  // Monday-based week strip.
  const monday = today - ((new Date(today).getDay() + 6) % 7) * DAY;
  const doneDays = new Set(history.map((h) => startOfDay(h.finishedAt)));
  const week = ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((l, i) => {
    const d = monday + i * DAY;
    return { l, n: new Date(d).getDate(), done: doneDays.has(d), today: d === today };
  });
  const doneThisWeek = week.filter((d) => d.done).length;
  // Form scores only exist for camera-tracked sessions.
  const recent = history.filter((h) => !h.manual).slice(0, 5);
  const avg = recent.length ? Math.round(recent.reduce((s, h) => s + h.score, 0) / recent.length) : null;
  const tip = history.find((h) => h.topIssue)?.topIssue;
  const dateLabel = new Date(now).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
  const initial = profile.name ? profile.name[0].toUpperCase() : 'Me';
  const trainedToday = doneDays.has(today);

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <View style={{ gap: 2, flex: 1 }}>
            <Text style={t.small}>{dateLabel}</Text>
            <Text style={s.greeting} numberOfLines={1}>
              Ready{profile.name ? `, ${profile.name}` : ''}?
            </Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Your profile" onPress={() => router.navigate('/profile')} style={s.avatar}>
            <Text style={s.avatarText}>{initial}</Text>
          </Pressable>
        </View>

        <View style={s.plan}>
          <View style={s.planTop}>
            <Text style={s.planKicker}>{"Today's plan"}</Text>
            <Text style={s.planBadge} numberOfLines={1}>
              {program.title}
            </Text>
          </View>
          <View style={{ gap: 4 }}>
            <Text style={s.planTitle}>{day.title}</Text>
            <Text style={s.planMeta}>
              {dayMinutes(day)} min · {day.blocks.length} exercises
            </Text>
          </View>
          <View style={s.tags}>
            {day.blocks.map((blk, i) => (
              <Text key={`${blk.exerciseId}-${i}`} style={s.tag}>
                {getExercise(blk.exerciseId)?.name}
              </Text>
            ))}
          </View>
          <Button variant="dark" icon="play" label="Start workout" onPress={() => router.push({ pathname: '/workout/[program]/[day]', params: { program: program.id, day: day.id } })} style={{ height: 52 }} />
        </View>

        <Card style={{ gap: 12 }}>
          <View style={s.rowBetween}>
            <Text style={t.bodyStrong}>This week</Text>
            <Text style={t.small}>
              {doneThisWeek} of {profile.days} done
            </Text>
          </View>
          <View style={s.rowBetween}>
            {week.map((d, i) => (
              <View key={i} style={{ alignItems: 'center', gap: 6 }}>
                <Text style={t.small}>{d.l}</Text>
                <View style={[s.dayDot, d.done ? s.dayDone : d.today ? s.dayToday : s.dayEmpty]}>
                  <Text style={[s.dayNum, { color: d.done ? colors.onAccent : d.today ? colors.accent : colors.textFaint }]}>{d.n}</Text>
                </View>
              </View>
            ))}
          </View>
        </Card>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Card style={{ flex: 1, gap: 6 }}>
            <Text style={t.small}>Avg form score</Text>
            <Text style={t.big}>{avg ?? '–'}</Text>
            <Text style={t.small}>{avg === null ? 'Finish a workout to see it' : 'Last 5 sessions'}</Text>
          </Card>
          <Card style={{ flex: 1, gap: 6 }}>
            <Text style={t.small}>Streak</Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
              <Text style={t.big}>{streak(history, now)}</Text>
              <Text style={t.smallStrong}>days</Text>
            </View>
            <Text style={t.small}>{trainedToday ? 'Done for today. Nice work.' : 'Train today to keep it going'}</Text>
          </Card>
        </View>

        <Card style={s.tip}>
          <View style={s.tipIcon}>
            <Icon name="bulb" size={20} color={colors.warn} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[t.bodyStrong, { fontSize: 14 }]}>Coach tip</Text>
            <Text style={[t.small, { color: colors.textMuted, lineHeight: 18 }]}>
              {tip
                ? `Last time: “${tip.cue}”. ${tip.detail} Watch it today.`
                : 'Lean your phone against a wall about 2 m away so your whole body stays in frame.'}
            </Text>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  greeting: { fontFamily: fonts.display, fontSize: 30, color: colors.text, textTransform: 'uppercase' },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.bold, color: colors.text, fontSize: 15 },
  plan: { backgroundColor: colors.accent, borderRadius: 24, padding: 20, gap: 14 },
  planTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planKicker: { fontFamily: fonts.bold, fontSize: 12, color: colors.onAccent, textTransform: 'uppercase', letterSpacing: 1.2 },
  planBadge: { fontFamily: fonts.bold, fontSize: 12, color: colors.accent, backgroundColor: colors.bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, overflow: 'hidden', maxWidth: '62%' },
  planTitle: { fontFamily: fonts.display, fontSize: 34, lineHeight: 34, color: colors.onAccent, textTransform: 'uppercase' },
  planMeta: { fontFamily: fonts.medium, fontSize: 15, color: colors.onAccent },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { fontFamily: fonts.semibold, fontSize: 13, color: colors.onAccent, borderWidth: 1.5, borderColor: colors.onAccent, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  dayDot: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  dayDone: { backgroundColor: colors.accent },
  dayToday: { borderWidth: 2, borderColor: colors.accent },
  dayEmpty: { borderWidth: 1.5, borderColor: colors.borderStrong, borderStyle: 'dashed' },
  dayNum: { fontFamily: fonts.bold, fontSize: 14 },
  tip: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  tipIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,138,76,0.15)', alignItems: 'center', justifyContent: 'center' },
});
