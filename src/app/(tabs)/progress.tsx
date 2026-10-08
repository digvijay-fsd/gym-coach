import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Glyph, Icon, Segmented, t } from '../../components/ui';
import { achievements } from '../../data/achievements';
import { fromKg } from '../../data/body';
import { getExercise } from '../../data/exercises';
import { exercisesDone, recordsFor } from '../../data/records';
import { useNow } from '../../hooks/useNow';
import { startOfDay, useStore, type SessionResult } from '../../state/store';
import { colors, fonts } from '../../theme';

type Range = 'week' | 'month' | 'year';
const DAY = 86_400_000;
// Muscle groups for the balance chart.
const GROUP: Record<string, string> = {
  squat: 'Legs', goblet: 'Legs', lunge: 'Legs', wallsit: 'Legs', bridge: 'Legs', rdl: 'Legs', legpress: 'Legs', legcurl: 'Legs',
  pushup: 'Push', bench: 'Push', dbbench: 'Push', press: 'Push', raise: 'Push',
  row: 'Pull', pulldown: 'Pull', cablerow: 'Pull', curl: 'Pull',
  plank: 'Core', situp: 'Core',
  jacks: 'Cardio', highknees: 'Cardio', climbers: 'Cardio', treadmill: 'Cardio',
};

function buckets(history: SessionResult[], range: Range, now: number) {
  const today = startOfDay(now);
  if (range === 'week') {
    const monday = today - ((new Date(today).getDay() + 6) % 7) * DAY;
    return ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((l, i) => ({ l, from: monday + i * DAY, to: monday + (i + 1) * DAY, current: monday + i * DAY === today }));
  }
  if (range === 'month') {
    return [3, 2, 1, 0].map((w, i) => ({ l: `W${i + 1}`, from: today - (w * 7 + 6) * DAY, to: today - w * 7 * DAY + DAY, current: w === 0 }));
  }
  const d = new Date(now);
  return [5, 4, 3, 2, 1, 0].map((m) => {
    const from = new Date(d.getFullYear(), d.getMonth() - m, 1).getTime();
    const to = new Date(d.getFullYear(), d.getMonth() - m + 1, 1).getTime();
    return { l: new Date(from).toLocaleDateString(undefined, { month: 'short' }), from, to, current: m === 0 };
  });
}

export default function Progress() {
  const { history, workouts, bodyLog, customPrograms, profile } = useStore();
  const [range, setRange] = useState<Range>('week');
  const badges = achievements({ history, workouts: workouts.length, bodyEntries: bodyLog.length, customWorkouts: customPrograms.length });
  const earned = badges.filter((b) => b.earned).length;
  const done = exercisesDone(history).slice(0, 6);
  const now = useNow();
  const bs = buckets(history, range, now);
  const inRange = history.filter((h) => h.finishedAt >= bs[0].from && h.finishedAt < bs[bs.length - 1].to);
  const minutes = Math.round(inRange.reduce((s, h) => s + h.durationMs, 0) / 60000);
  const reps = inRange.filter((h) => h.mode === 'reps').reduce((s, h) => s + h.sets.reduce((a, b) => a + b, 0), 0);
  const bars = bs.map((b) => {
    const xs = history.filter((h) => !h.manual && h.finishedAt >= b.from && h.finishedAt < b.to);
    return { ...b, v: xs.length ? Math.round(xs.reduce((s, h) => s + h.score, 0) / xs.length) : null };
  });
  const groups = new Map<string, number>();
  inRange.forEach((h) => groups.set(GROUP[h.exerciseId] ?? 'Other', (groups.get(GROUP[h.exerciseId] ?? 'Other') ?? 0) + 1));
  const total = inRange.length || 1;
  const balance = ['Legs', 'Push', 'Pull', 'Core', 'Cardio'].map((g) => ({ g, pct: Math.round(((groups.get(g) ?? 0) / total) * 100) }));
  const weakest = inRange.length ? balance.reduce((a, b) => (b.pct < a.pct ? b : a)) : null;

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <Text style={t.h1}>Progress</Text>
        <Segmented
          value={range}
          onChange={setRange}
          options={[
            { value: 'week', label: 'Week' },
            { value: 'month', label: 'Month' },
            { value: 'year', label: '6 months' },
          ]}
        />

        <View style={{ flexDirection: 'row', gap: 8 }}>
          {[
            ['Workouts', String(inRange.length)],
            ['Active time', minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : `${minutes}m`],
            ['Reps', reps.toLocaleString()],
          ].map(([l, v]) => (
            <Card key={l} style={{ flex: 1, padding: 12, gap: 2 }}>
              <Text style={t.small}>{l}</Text>
              <Text style={s.stat}>{v}</Text>
            </Card>
          ))}
        </View>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable accessibilityRole="button" onPress={() => router.push('/achievements')} style={({ pressed }) => [s.shortcut, pressed && { opacity: 0.85 }]}>
            <Icon name="trophy" size={22} color={colors.accent} />
            <Text style={t.bodyStrong}>Achievements</Text>
            <Text style={t.small}>
              {earned} of {badges.length} earned
            </Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => router.push('/body')} style={({ pressed }) => [s.shortcut, pressed && { opacity: 0.85 }]}>
            <Icon name="user" size={22} color={colors.accent} />
            <Text style={t.bodyStrong}>Body weight</Text>
            <Text style={t.small}>{bodyLog[0] ? `${fromKg(bodyLog[0].kg, profile.units)} ${profile.units}` : 'Not logged yet'}</Text>
          </Pressable>
        </View>

        {history.length === 0 ? (
          <Card style={{ gap: 12, alignItems: 'flex-start' }}>
            <Text style={t.bodyStrong}>No workouts yet</Text>
            <Text style={t.body}>Your form scores, reps and muscle balance show up here after your first camera session.</Text>
            <Button label="Start a workout" onPress={() => router.navigate('/workouts')} style={{ alignSelf: 'stretch' }} />
          </Card>
        ) : (
          <>
            <Card style={{ gap: 12 }}>
              <Text style={t.bodyStrong}>Form score</Text>
              <View style={s.chart}>
                {bars.map((b, i) => (
                  <View key={i} style={s.barCol}>
                    <Text style={s.barVal}>{b.v ?? '–'}</Text>
                    <View style={[s.bar, { height: b.v ? Math.max(6, (b.v - 40) * 1.6) : 4, backgroundColor: b.current ? colors.accent : b.v ? '#3A3E34' : colors.surface2 }]} />
                  </View>
                ))}
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {bars.map((b, i) => (
                  <Text key={i} style={s.barLabel}>
                    {b.l}
                  </Text>
                ))}
              </View>
            </Card>

            <Card style={{ gap: 10 }}>
              <Text style={t.bodyStrong}>Muscle balance</Text>
              {balance.map((b) => (
                <View key={b.g} style={s.balanceRow}>
                  <Text style={[t.small, { width: 60, color: colors.textMuted }]}>{b.g}</Text>
                  <View style={s.track}>
                    <View style={[s.fill, { width: `${b.pct}%`, backgroundColor: b.pct < 15 ? colors.warn : colors.accent }]} />
                  </View>
                  <Text style={s.pct}>{b.pct}%</Text>
                </View>
              ))}
              {weakest && weakest.pct < 15 && <Text style={t.small}>Coach: add some {weakest.g.toLowerCase()} work to balance your training.</Text>}
            </Card>

            <View style={{ gap: 8 }}>
              <Text style={t.label}>Personal records</Text>
              {done.map((id) => {
                const ex = getExercise(id);
                const r = recordsFor(history, id);
                if (!ex || !r) return null;
                const best = r.weighted ? `${Math.round(r.bestE1rm)} ${profile.units}` : ex.mode === 'hold' ? `${r.bestSet}s` : `${r.bestSet} reps`;
                return (
                  <Pressable key={id} accessibilityRole="button" onPress={() => router.push({ pathname: '/records/[id]', params: { id } })} style={({ pressed }) => [s.prRow, pressed && { opacity: 0.85 }]}>
                    <Glyph path={ex.glyph} size={26} color={ex.tracked ? colors.accent : colors.textMuted} />
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={[t.bodyStrong, { fontSize: 15 }]}>{ex.name}</Text>
                      <Text style={t.small}>{r.weighted ? 'Best est. 1-rep max' : ex.mode === 'hold' ? 'Longest hold' : 'Best set'}</Text>
                    </View>
                    <Text style={s.prValue}>{best}</Text>
                    <Icon name="arrow" size={16} color={colors.textFaint} />
                  </Pressable>
                );
              })}
            </View>

            <View style={{ gap: 8 }}>
              <Text style={t.label}>Recent sessions</Text>
              {history.slice(0, 8).map((h) => (
                <Card key={h.id} style={s.historyRow}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={[t.bodyStrong, { fontSize: 15 }]}>{getExercise(h.exerciseId)?.name}</Text>
                    <Text style={t.small}>
                      {new Date(h.finishedAt).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })} ·{' '}
                      {h.mode === 'reps' ? `${h.sets.reduce((a, b) => a + b, 0)} reps` : `${h.sets.reduce((a, b) => a + b, 0)}s held`}
                    </Text>
                  </View>
                  {h.manual ? (
                    <Text style={t.small}>Logged</Text>
                  ) : (
                    <Text style={[s.stat, { color: h.score < 85 ? colors.warn : colors.accent }]}>{h.score}</Text>
                  )}
                </Card>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, gap: 16 },
  stat: { fontFamily: fonts.display, fontSize: 28, color: colors.text },
  chart: { height: 130, flexDirection: 'row', alignItems: 'flex-end', gap: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  barCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 4, height: '100%' },
  barVal: { fontFamily: fonts.medium, fontSize: 11, color: colors.textMuted },
  bar: { width: '100%', maxWidth: 36, borderTopLeftRadius: 6, borderTopRightRadius: 6 },
  barLabel: { flex: 1, textAlign: 'center', fontFamily: fonts.regular, fontSize: 11, color: colors.textFaint },
  balanceRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  track: { flex: 1, height: 8, borderRadius: 4, backgroundColor: colors.surface2, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4 },
  pct: { width: 38, textAlign: 'right', fontFamily: fonts.semibold, fontSize: 13, color: colors.text },
  historyRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  shortcut: { flex: 1, gap: 4, padding: 14, borderRadius: 20, backgroundColor: colors.surface },
  prRow: { minHeight: 60, borderRadius: 16, backgroundColor: colors.surface, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  prValue: { fontFamily: fonts.display, fontSize: 22, color: colors.text },
});
