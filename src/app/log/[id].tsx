import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Icon, IconButton, t } from '../../components/ui';
import { getExercise } from '../../data/exercises';
import { suggestNext } from '../../data/progression';
import { lastSessionOf, useStore, type SessionResult } from '../../state/store';
import { colors, fonts } from '../../theme';

type Row = { amount: string; weight: string; done: boolean };

const fmtClock = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};
const num = (v: string) => {
  const n = Number(v.replace(',', '.'));
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

// Manual set logging for exercises the camera cannot follow (machines, bench,
// cardio): weight and reps per set, a rest timer and a next-weight suggestion.
export default function SetLogger() {
  const params = useLocalSearchParams<{ id: string; sets?: string; target?: string; rest?: string; run?: string }>();
  const ex = getExercise(params.id);
  const { history, profile, addResult, run, advanceRun } = useStore();
  const inRun = params.run === '1' && !!run;
  const target = Number(params.target) || ex?.target || 10;
  const restMs = (Number(params.rest) || ex?.rest || 60) * 1000;
  const hold = ex?.mode === 'hold';
  // Long holds (cardio) are entered in minutes, short ones in seconds.
  const minutes = hold && target >= 120;
  const shownTarget = minutes ? Math.round(target / 60) : target;

  const last = lastSessionOf(history, params.id);
  const tip = ex ? suggestNext(ex, last, target, profile.units) : { weight: null, note: null };
  const [rows, setRows] = useState<Row[]>(() =>
    Array.from({ length: Number(params.sets) || ex?.sets || 3 }, () => ({ amount: String(shownTarget), weight: tip.weight ? String(tip.weight) : '', done: false })),
  );
  const [restUntil, setRestUntil] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [startedAt] = useState(() => Date.now());

  // Ticks while resting and clears itself when the rest is over.
  useEffect(() => {
    if (restUntil === null) return;
    const id = setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (t >= restUntil) setRestUntil(null);
    }, 250);
    return () => clearInterval(id);
  }, [restUntil]);
  const restLeft = restUntil === null ? 0 : restUntil - now;

  if (!ex) {
    return (
      <SafeAreaView style={[s.root, { padding: 24, gap: 16 }]}>
        <Text style={t.h2}>Exercise not found</Text>
        <Button label="Back" onPress={() => router.replace('/home')} />
      </SafeAreaView>
    );
  }

  const update = (i: number, patch: Partial<Row>) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const toggle = (i: number) => {
    const done = !rows[i].done;
    update(i, { done });
    if (done && restMs > 0 && rows.some((r, j) => j !== i && !r.done)) {
      setNow(Date.now());
      setRestUntil(Date.now() + restMs);
    }
  };
  const doneRows = rows.filter((r) => r.done);

  const leave = () => {
    if (inRun) router.replace('/workout/next');
    else if (router.canGoBack()) router.back();
    else router.replace('/home');
  };

  const finish = () => {
    if (doneRows.length === 0) {
      leave();
      return;
    }
    const result: SessionResult = {
      id: `${Date.now()}`,
      exerciseId: ex.id,
      finishedAt: Date.now(),
      durationMs: Date.now() - startedAt,
      mode: ex.mode,
      sets: doneRows.map((r) => Math.round(num(r.amount) * (minutes ? 60 : 1))),
      target,
      weights: ex.weighted ? doneRows.map((r) => num(r.weight)) : undefined,
      manual: true,
      score: 0,
      repScores: [],
      issueCounts: {},
      topIssue: null,
      workoutId: inRun ? run!.id : undefined,
    };
    addResult(result);
    if (inRun) {
      advanceRun(result.id, ex.id);
      router.replace('/workout/next');
    } else {
      router.replace({ pathname: '/summary', params: { id: result.id } });
    }
  };

  const unit = hold ? (minutes ? 'min' : 'sec') : 'reps';

  return (
    <SafeAreaView style={s.root}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.header}>
          <IconButton icon="back" label={inRun ? 'Back to workout' : 'Back'} onPress={leave} />
          <Text style={t.small}>Log sets</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={{ gap: 4 }}>
            <Text style={t.h1}>{ex.name}</Text>
            <Text style={t.body}>
              Target {rows.length} × {shownTarget} {unit}
              {ex.weighted ? ` · weights in ${profile.units}` : ''}
            </Text>
          </View>

          {tip.note && (
            <Card style={s.tip}>
              <Icon name="bulb" size={18} color={colors.accent} />
              <Text style={[t.small, { flex: 1, color: colors.text, lineHeight: 18 }]}>{tip.note}</Text>
            </Card>
          )}

          <View style={{ gap: 8 }}>
            <View style={s.headRow}>
              <Text style={[s.head, { width: 44 }]}>Set</Text>
              {ex.weighted && <Text style={[s.head, { flex: 1 }]}>{profile.units}</Text>}
              <Text style={[s.head, { flex: 1 }]}>{unit}</Text>
              <Text style={[s.head, { width: 48, textAlign: 'center' }]}>Done</Text>
            </View>
            {rows.map((r, i) => (
              <View key={i} style={[s.setRow, r.done && { backgroundColor: 'rgba(198,244,50,0.08)' }]}>
                <Text style={[s.setNum, { width: 44 }]}>{i + 1}</Text>
                {ex.weighted && (
                  <TextInput
                    value={r.weight}
                    onChangeText={(v) => update(i, { weight: v.replace(/[^0-9.,]/g, '') })}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor="#6F7268"
                    accessibilityLabel={`Set ${i + 1} weight in ${profile.units}`}
                    style={s.input}
                  />
                )}
                <TextInput
                  value={r.amount}
                  onChangeText={(v) => update(i, { amount: v.replace(/[^0-9.,]/g, '') })}
                  keyboardType="decimal-pad"
                  accessibilityLabel={`Set ${i + 1} ${unit}`}
                  style={s.input}
                />
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: r.done }}
                  accessibilityLabel={`Set ${i + 1} done`}
                  onPress={() => toggle(i)}
                  style={[s.check, r.done && { backgroundColor: colors.accent, borderColor: colors.accent }]}
                >
                  {r.done && <Icon name="check" size={18} color={colors.onAccent} strokeWidth={2.6} />}
                </Pressable>
              </View>
            ))}
            <Pressable
              accessibilityRole="button"
              onPress={() => setRows((rs) => [...rs, { ...rs[rs.length - 1], done: false }])}
              style={s.addSet}
            >
              <Icon name="plus" size={16} color={colors.accent} />
              <Text style={s.addSetText}>Add set</Text>
            </Pressable>
          </View>

          <Card style={{ gap: 6 }}>
            <Text style={[t.bodyStrong, { fontSize: 14 }]}>Form tips</Text>
            {ex.checks.map((c) => (
              <Text key={c} style={t.small}>
                • {c}
              </Text>
            ))}
          </Card>
        </ScrollView>

        {restUntil !== null && (
          <View style={s.rest} accessibilityLiveRegion="polite">
            <Icon name="clock" size={20} color={colors.onAccent} />
            <Text style={s.restText}>Rest {fmtClock(restLeft)}</Text>
            <Pressable accessibilityRole="button" onPress={() => setRestUntil(null)} style={s.restSkip}>
              <Text style={s.restSkipText}>Skip</Text>
            </Pressable>
          </View>
        )}

        <View style={s.footer}>
          <Button label={doneRows.length ? `Finish · ${doneRows.length} of ${rows.length} sets` : inRun ? 'Back to workout' : 'Close'} onPress={finish} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8 },
  content: { padding: 20, gap: 18 },
  tip: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10 },
  head: { fontFamily: fonts.semibold, fontSize: 12, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: 1 },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 14, backgroundColor: colors.surface },
  setNum: { fontFamily: fonts.display, fontSize: 22, color: colors.text, textAlign: 'center' },
  input: { flex: 1, height: 48, borderRadius: 10, backgroundColor: colors.surface2, color: colors.text, textAlign: 'center', fontFamily: fonts.bold, fontSize: 18 },
  check: { width: 48, height: 48, borderRadius: 12, borderWidth: 2, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
  addSet: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 44, borderRadius: 12, borderWidth: 1.5, borderColor: colors.border, borderStyle: 'dashed' },
  addSetText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.accent },
  rest: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 20, marginBottom: 8, paddingHorizontal: 16, height: 52, borderRadius: 14, backgroundColor: colors.accent },
  restText: { flex: 1, fontFamily: fonts.display, fontSize: 22, color: colors.onAccent, fontVariant: ['tabular-nums'] },
  restSkip: { paddingHorizontal: 14, height: 36, borderRadius: 10, backgroundColor: colors.bg, justifyContent: 'center' },
  restSkipText: { fontFamily: fonts.bold, fontSize: 14, color: colors.text },
  footer: { paddingHorizontal: 20, paddingBottom: 12, paddingTop: 8 },
});
