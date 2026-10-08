import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Icon, t } from '../components/ui';
import { getExercise } from '../data/exercises';
import { useStore } from '../state/store';
import { colors, fonts } from '../theme';

const fmt = (ms: number) => {
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

export default function Summary() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { history, profile } = useStore();
  const r = history.find((h) => h.id === id);
  const ex = r && getExercise(r.exerciseId);

  if (!r || !ex) {
    return (
      <SafeAreaView style={[s.root, { padding: 24, gap: 16 }]}>
        <Text style={t.h2}>Session not found</Text>
        <Button label="Go home" onPress={() => router.replace('/home')} />
      </SafeAreaView>
    );
  }

  const hold = r.mode === 'hold';
  const total = r.sets.reduce((a, b) => a + b, 0);
  // Hand-logged sessions have no form score; compare only camera sessions.
  const previous = history.filter((h) => h.exerciseId === r.exerciseId && h.id !== r.id && !h.manual);
  const bestBefore = previous.reduce((m, h) => Math.max(m, h.score), 0);
  const isBest = !r.manual && previous.length > 0 && r.score > bestBefore;
  const topWeight = Math.max(0, ...(r.weights ?? []));
  const issues = Object.entries(r.issueCounts).sort((a, b) => b[1] - a[1]);
  const clean = hold ? null : r.repScores.filter((x) => x === 100).length;

  return (
    <SafeAreaView style={s.root}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={{ gap: 6, alignItems: 'flex-start' }}>
          <Text style={s.kicker}>Workout complete</Text>
          <Text style={t.h1}>{ex.name}</Text>
          <Text style={t.small}>{new Date(r.finishedAt).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          {[
            ['Time', fmt(r.durationMs), colors.text],
            [hold ? 'Total hold' : 'Total reps', hold ? `${total}s` : String(total), colors.text],
            r.manual
              ? ['Top weight', topWeight ? `${topWeight} ${profile.units}` : '–', colors.text]
              : ['Form score', String(r.score), r.score < 85 ? colors.warn : colors.accent],
          ].map(([l, v, c]) => (
            <Card key={l} style={{ flex: 1, padding: 12, gap: 4 }}>
              <Text style={t.small}>{l}</Text>
              <Text style={[s.stat, { color: c }]}>{v}</Text>
            </Card>
          ))}
        </View>

        <View style={{ gap: 10 }}>
          <Text style={t.label}>By set</Text>
          {r.sets.map((n, i) => {
            const pct = Math.min(100, (n / Math.max(...r.sets, 1)) * 100);
            return (
              <View key={i} style={{ gap: 6 }}>
                <View style={s.rowBetween}>
                  <Text style={s.rowTitle}>Set {i + 1}</Text>
                  <Text style={t.smallStrong}>
                    {hold ? `${n}s held` : `${n} reps`}
                    {r.weights?.[i] ? ` × ${r.weights[i]} ${profile.units}` : ''}
                  </Text>
                </View>
                <View style={s.track}>
                  <View style={[s.fill, { width: `${pct}%` }]} />
                </View>
              </View>
            );
          })}
        </View>

        {!hold && r.repScores.length > 0 && (
          <Card style={{ gap: 10 }}>
            <View style={s.rowBetween}>
              <Text style={t.bodyStrong}>Every rep</Text>
              <Text style={t.small}>
                {clean} of {r.repScores.length} clean
              </Text>
            </View>
            <View style={s.reps}>
              {r.repScores.map((sc, i) => (
                <View key={i} accessibilityLabel={`Rep ${i + 1}, score ${sc}`} style={[s.rep, { height: 8 + (sc / 100) * 28, backgroundColor: sc === 100 ? colors.accent : colors.warn }]} />
              ))}
            </View>
          </Card>
        )}

        {issues.length > 0 ? (
          <Card style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              <View style={[s.iconBox, { backgroundColor: 'rgba(255,138,76,0.15)' }]}>
                <Icon name="warn" size={18} color={colors.warn} />
              </View>
              <Text style={t.bodyStrong}>Work on next time</Text>
            </View>
            {issues.map(([cue, n]) => (
              <Text key={cue} style={t.body}>
                <Text style={{ color: colors.text, fontFamily: fonts.semibold }}>{cue}</Text>
                {hold ? `: about ${n}s of your hold.` : `: ${n} of ${r.repScores.length} reps.`}
              </Text>
            ))}
            {r.topIssue && <Text style={t.small}>{r.topIssue.detail}</Text>}
          </Card>
        ) : (
          <Card style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <View style={[s.iconBox, { backgroundColor: colors.accent }]}>
              <Icon name="check" size={18} color={colors.onAccent} strokeWidth={2.4} />
            </View>
            <Text style={[t.body, { flex: 1 }]}>No form faults detected. Next time your coach will raise the target.</Text>
          </Card>
        )}

        {isBest && (
          <Card style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <View style={[s.iconBox, { backgroundColor: colors.accent }]}>
              <Icon name="trophy" size={18} color={colors.onAccent} strokeWidth={2.2} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={t.bodyStrong}>New best form score</Text>
              <Text style={t.small}>Previous best: {bestBefore}</Text>
            </View>
          </Card>
        )}
      </ScrollView>

      <View style={s.footer}>
        <Button
          variant="outline"
          icon="arrow"
          label="Share"
          style={{ flex: 1 }}
          onPress={() =>
            // Some desktop browsers have no share sheet; ignore it there.
            Share.share({ message: `${ex.name}: ${hold ? `${total}s held` : `${total} reps`}, ${r.manual ? '' : `form score ${r.score} `}with Gym Coach.` }).catch(() => {})
          }
        />
        <Button label="Done" style={{ flex: 2 }} onPress={() => router.replace('/home')} />
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, gap: 18 },
  kicker: { fontFamily: fonts.bold, fontSize: 12, color: colors.onAccent, backgroundColor: colors.accent, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, overflow: 'hidden', textTransform: 'uppercase', letterSpacing: 1 },
  stat: { fontFamily: fonts.display, fontSize: 28 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  rowTitle: { fontFamily: fonts.semibold, fontSize: 14, color: colors.text },
  track: { height: 6, borderRadius: 3, backgroundColor: colors.surface2, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3, backgroundColor: colors.accent },
  reps: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 36, flexWrap: 'wrap' },
  rep: { width: 8, borderRadius: 2 },
  iconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  footer: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingBottom: 12, paddingTop: 8 },
});
