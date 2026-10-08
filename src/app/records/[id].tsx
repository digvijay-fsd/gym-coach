import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { LineChart } from '../../components/LineChart';
import { SubScreen } from '../../components/SubScreen';
import { Button, Card, t } from '../../components/ui';
import { getExercise } from '../../data/exercises';
import { isNewRecord, recordsFor } from '../../data/records';
import { useStore } from '../../state/store';
import { colors, fonts } from '../../theme';

const n = (v: number) => String(Math.round(v * 10) / 10);

export default function ExerciseRecords() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { history, profile } = useStore();
  const ex = getExercise(id);
  const r = recordsFor(history, id);
  const u = profile.units;
  const hold = ex?.mode === 'hold';
  const unit = hold ? 's' : ' reps';
  const sessions = history.filter((h) => h.exerciseId === id).slice(0, 10);

  if (!ex || !r) {
    return (
      <SubScreen title={ex?.name ?? 'Records'} subtitle="No sessions of this exercise yet." fallback="/progress">
        {ex && <Button label="Open exercise" onPress={() => router.push(`/exercise/${ex.id}`)} />}
      </SubScreen>
    );
  }

  const tiles: [string, string][] = r.weighted
    ? [
        ['Best est. 1-rep max', `${n(r.bestE1rm)} ${u}`],
        ['Heaviest weight', `${n(r.bestWeight)} ${u}`],
        ['Most reps in a set', String(r.bestSet)],
        ['Sessions', String(r.sessions)],
      ]
    : [
        [hold ? 'Longest hold' : 'Most reps in a set', `${r.bestSet}${hold ? 's' : ''}`],
        [hold ? 'Most time in a session' : 'Most reps in a session', `${r.bestTotal}${hold ? 's' : ''}`],
        ['Sessions', String(r.sessions)],
      ];

  return (
    <SubScreen title={ex.name} subtitle="Your personal records" fallback="/progress">
      <View style={s.grid}>
        {tiles.map(([l, v]) => (
          <Card key={l} style={s.tile}>
            <Text style={t.small}>{l}</Text>
            <Text style={s.stat}>{v}</Text>
          </Card>
        ))}
      </View>

      <Card style={{ gap: 6 }}>
        <Text style={t.bodyStrong}>{r.weighted ? 'Estimated 1-rep max' : hold ? 'Longest hold' : 'Best set'}</Text>
        <Text style={t.small}>{r.weighted ? 'The most you could lift once, worked out from your sets. Tap a dot for details.' : 'Your best set in each session. Tap a dot for details.'}</Text>
        {r.trend.length > 1 ? (
          <LineChart label={ex.name} points={r.trend} format={(v) => (r.weighted ? `${n(v)} ${u}` : `${n(v)}${hold ? 's' : ''}`)} />
        ) : (
          <Text style={[t.body, { paddingVertical: 12 }]}>Do this exercise once more to see your trend.</Text>
        )}
      </Card>

      <View style={{ gap: 8 }}>
        <Text style={t.label}>Recent sessions</Text>
        {sessions.map((h) => (
          <Card key={h.id} style={s.row}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[t.bodyStrong, { fontSize: 15 }]}>
                {h.sets.map((reps, i) => (h.weights?.[i] ? `${reps}×${n(h.weights[i])}` : `${reps}${unit === 's' ? 's' : ''}`)).join('  ·  ')}
              </Text>
              <Text style={t.small}>
                {new Date(h.finishedAt).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}
                {h.weights?.some((w) => w > 0) ? ` · ${u}` : ''}
              </Text>
            </View>
            {isNewRecord(history, h) && <Text style={s.pr}>PR</Text>}
          </Card>
        ))}
      </View>
    </SubScreen>
  );
}

const s = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tile: { flexGrow: 1, flexBasis: '45%', padding: 12, gap: 2 },
  stat: { fontFamily: fonts.display, fontSize: 26, color: colors.text },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  pr: { fontFamily: fonts.bold, fontSize: 12, color: colors.onAccent, backgroundColor: colors.accent, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, overflow: 'hidden' },
});
