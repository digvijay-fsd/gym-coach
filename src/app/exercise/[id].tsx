import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SkeletonOverlay } from '../../components/SkeletonOverlay';
import { Button, Card, Icon, IconButton, t } from '../../components/ui';
import { getExercise } from '../../data/exercises';
import { createDemoPoseSource } from '../../pose/simulator';
import { colors, fonts } from '../../theme';

function Stepper({ label, value, display, onChange, step, min, max }: { label: string; value: number; display: string; onChange: (v: number) => void; step: number; min: number; max: number }) {
  return (
    <Card style={s.stepper}>
      <Text style={t.small}>{label}</Text>
      <View style={s.stepRow}>
        <Pressable accessibilityRole="button" accessibilityLabel={`Decrease ${label}`} onPress={() => onChange(Math.max(min, value - step))} style={s.stepBtn} hitSlop={4}>
          <Icon name="minus" size={16} />
        </Pressable>
        <Text style={s.stepVal}>{display}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={`Increase ${label}`} onPress={() => onChange(Math.min(max, value + step))} style={s.stepBtn} hitSlop={4}>
          <Icon name="plus" size={16} />
        </Pressable>
      </View>
    </Card>
  );
}

export default function ExerciseDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const ex = getExercise(id);
  const [sets, setSets] = useState(ex?.sets ?? 3);
  const [target, setTarget] = useState(ex?.target ?? 10);
  const [rest, setRest] = useState(ex?.rest ?? 60);
  const [time, setTime] = useState(0);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [demo] = useState(() => createDemoPoseSource(id));

  useEffect(() => {
    let raf = 0;
    const start = Date.now();
    const tick = () => {
      setTime(Date.now() - start);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  if (!ex) {
    return (
      <SafeAreaView style={[s.root, { padding: 24, gap: 16 }]}>
        <Text style={t.h2}>Exercise not found</Text>
        <Button label="Back to workouts" onPress={() => router.replace('/workouts')} />
      </SafeAreaView>
    );
  }

  const hold = ex.mode === 'hold';
  return (
    <SafeAreaView style={s.root}>
      <View style={s.header}>
        <IconButton icon="back" label="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/workouts'))} />
        <Text style={t.small}>{ex.category}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.preview} onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
          <SkeletonOverlay pose={demo(time)} width={box.w} height={box.h} />
          <Text style={s.previewTag}>{ex.view === 'front' ? 'Film from the front' : 'Film from the side'}</Text>
        </View>

        <View style={{ gap: 4 }}>
          <Text style={t.h1}>{ex.name}</Text>
          <Text style={t.body}>{ex.muscles}</Text>
        </View>

        <View style={{ gap: 8 }}>
          <Text style={t.label}>What the AI checks</Text>
          <View style={s.checks}>
            {ex.checks.map((c) => (
              <View key={c} style={s.check}>
                <View style={s.dot} />
                <Text style={s.checkText}>{c}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Stepper label="Sets" value={sets} display={String(sets)} onChange={setSets} step={1} min={1} max={6} />
          <Stepper label={hold ? 'Hold' : 'Reps'} value={target} display={hold ? `${target}s` : String(target)} onChange={setTarget} step={hold ? 5 : 1} min={hold ? 10 : 3} max={hold ? 180 : 50} />
          <Stepper label="Rest" value={rest} display={`${rest}s`} onChange={setRest} step={15} min={15} max={180} />
        </View>

        <Card style={s.tip}>
          <Icon name="phone" size={22} color={colors.accent} />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={[t.bodyStrong, { fontSize: 14 }]}>Camera setup</Text>
            <Text style={[t.small, { color: colors.textMuted, lineHeight: 18 }]}>
              Lean your phone against a wall about 2 m away, at hip height. Keep your whole body in frame, {ex.view === 'front' ? 'facing the camera' : 'side-on to the camera'}, in good light.
            </Text>
          </View>
        </Card>
      </ScrollView>

      <View style={s.footer}>
        <Button
          icon="scan"
          label="Start with camera"
          onPress={() => router.push({ pathname: '/session/[id]', params: { id: ex.id, sets: String(sets), target: String(target), rest: String(rest) } })}
        />
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8 },
  content: { padding: 20, gap: 16 },
  preview: { height: 220, borderRadius: 20, backgroundColor: '#171914', overflow: 'hidden' },
  previewTag: { position: 'absolute', left: 14, bottom: 14, fontFamily: fonts.medium, fontSize: 12, color: colors.textMuted, backgroundColor: colors.bg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, overflow: 'hidden' },
  checks: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  check: { width: '48%', flexGrow: 1, backgroundColor: colors.surface, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent },
  checkText: { fontFamily: fonts.medium, fontSize: 14, color: colors.text },
  stepper: { flex: 1, padding: 10, alignItems: 'center', gap: 6 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stepBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  stepVal: { minWidth: 38, textAlign: 'center', fontFamily: fonts.displayBold, fontSize: 24, color: colors.text },
  tip: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  footer: { paddingHorizontal: 20, paddingBottom: 12, paddingTop: 8 },
});
