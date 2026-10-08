import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Glyph, Icon, t } from '../../components/ui';
import { getExercise } from '../../data/exercises';
import { useStore } from '../../state/store';
import { colors, fonts } from '../../theme';

const fmt = (ms: number) => {
  const m = Math.round(ms / 60000);
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m} min`;
};

export default function WorkoutDone() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { workouts, history, profile } = useStore();
  const w = workouts.find((x) => x.id === id);

  if (!w) {
    return (
      <SafeAreaView style={[s.root, { padding: 24, gap: 16 }]}>
        <Text style={t.h2}>Workout not found</Text>
        <Button label="Go home" onPress={() => router.replace('/home')} />
      </SafeAreaView>
    );
  }

  const sessions = w.sessionIds.map((sid) => history.find((h) => h.id === sid)).filter((x) => !!x);
  const reps = sessions.filter((x) => x.mode === 'reps').reduce((n, x) => n + x.sets.reduce((a, b) => a + b, 0), 0);
  const volume = sessions.reduce((n, x) => n + x.sets.reduce((a, r, i) => a + r * (x.weights?.[i] ?? 0), 0), 0);
  const scored = sessions.filter((x) => !x.manual && x.score > 0);
  const form = scored.length ? Math.round(scored.reduce((n, x) => n + x.score, 0) / scored.length) : null;
  const fixes = scored.map((x) => x.topIssue).filter((i) => !!i);

  return (
    <SafeAreaView style={s.root}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={{ gap: 6, alignItems: 'flex-start' }}>
          <Text style={s.badge}>Workout complete</Text>
          <Text style={t.h1}>{w.title}</Text>
          <Text style={t.small}>
            {sessions.length} {sessions.length === 1 ? 'exercise' : 'exercises'} done{w.skipped.length ? ` · ${w.skipped.length} skipped` : ''}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          {[
            ['Time', fmt(w.finishedAt - w.startedAt)],
            ['Total reps', String(reps)],
            volume > 0 ? ['Volume', `${Math.round(volume).toLocaleString()} ${profile.units}`] : ['Form score', form === null ? '–' : String(form)],
          ].map(([l, v]) => (
            <Card key={l} style={{ flex: 1, padding: 12, gap: 4 }}>
              <Text style={t.small}>{l}</Text>
              <Text style={s.stat} numberOfLines={1} adjustsFontSizeToFit>
                {v}
              </Text>
            </Card>
          ))}
        </View>

        <View style={{ gap: 8 }}>
          <Text style={t.label}>Exercises</Text>
          {sessions.map((x) => {
            const ex = getExercise(x.exerciseId);
            const hold = x.mode === 'hold';
            const detail = x.sets
              .map((n, i) => (x.weights?.[i] ? `${n}×${x.weights[i]}` : hold ? `${n}s` : `${n}`))
              .join(' · ');
            return (
              <Card key={x.id} style={s.row}>
                <View style={s.thumb}>{ex && <Glyph path={ex.glyph} size={24} color={x.manual ? colors.textMuted : colors.accent} />}</View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[t.bodyStrong, { fontSize: 15 }]}>{ex?.name}</Text>
                  <Text style={t.small}>
                    {detail}
                    {x.weights?.length ? ` ${profile.units}` : ''}
                  </Text>
                </View>
                {!x.manual && x.score > 0 && <Text style={[s.score, { color: x.score < 85 ? colors.warn : colors.accent }]}>{x.score}</Text>}
              </Card>
            );
          })}
          {w.skipped.map((sid, i) => (
            <Text key={`${sid}-${i}`} style={[t.small, { paddingLeft: 4 }]}>
              Skipped: {getExercise(sid)?.name}
            </Text>
          ))}
        </View>

        {fixes.length > 0 && (
          <Card style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Icon name="warn" size={18} color={colors.warn} />
              <Text style={t.bodyStrong}>Work on next time</Text>
            </View>
            {fixes.slice(0, 3).map((f, i) => (
              <Text key={i} style={t.body}>
                <Text style={{ color: colors.text, fontFamily: fonts.semibold }}>{f.cue}.</Text> {f.detail}
              </Text>
            ))}
          </Card>
        )}
      </ScrollView>
      <View style={s.footer}>
        <Button label="Done" onPress={() => router.replace('/home')} />
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, gap: 18 },
  badge: { fontFamily: fonts.bold, fontSize: 12, color: colors.onAccent, backgroundColor: colors.accent, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, overflow: 'hidden', textTransform: 'uppercase', letterSpacing: 1 },
  stat: { fontFamily: fonts.display, fontSize: 26, color: colors.text },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  thumb: { width: 40, height: 40, borderRadius: 10, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  score: { fontFamily: fonts.display, fontSize: 24 },
  footer: { paddingHorizontal: 20, paddingBottom: 12, paddingTop: 8 },
});
