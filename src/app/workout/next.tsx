import { Redirect, router } from 'expo-router';
import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlockRow, blockTarget } from '../../components/BlockRow';
import { Button, Card, Glyph, Icon, IconButton, t } from '../../components/ui';
import { getDay, getExercise } from '../../data/exercises';
import { lastSessionOf, useStore } from '../../state/store';
import { colors, fonts } from '../../theme';

// The workout player's hub: shows what is next, launches the camera coach or the
// set logger for it, and finishes the workout after the last exercise.
export default function NextUp() {
  const { run, advanceRun, finishRun, history, profile } = useStore();
  const found = run ? getDay(run.programId, run.dayId) : undefined;
  const allDone = !!found && run!.index >= found.day.blocks.length;

  useEffect(() => {
    if (!allDone) return;
    const id = finishRun();
    router.replace(id ? { pathname: '/workout/done', params: { id } } : '/home');
  }, [allDone, finishRun]);

  if (!run || !found) return <Redirect href="/home" />;
  if (allDone) return <View style={s.root} />;

  const { day } = found;
  const block = day.blocks[run.index];
  const ex = getExercise(block.exerciseId);
  const last = lastSessionOf(history, block.exerciseId);
  const lastText = last
    ? `${last.sets.length} sets: ${last.sets.map((n, i) => (last.weights?.[i] ? `${n}×${last.weights[i]}` : n)).join(', ')}${last.weights?.length ? ` ${profile.units}` : ''}`
    : null;

  const go = () => {
    if (!ex) return;
    const params = { id: ex.id, sets: String(block.sets), target: String(block.target), rest: String(block.rest), run: '1' };
    // Replace, so finishing the exercise returns here without stacking screens.
    if (ex.tracked) router.replace({ pathname: '/session/[id]', params });
    else router.replace({ pathname: '/log/[id]', params });
  };

  const end = () => {
    const id = finishRun();
    router.replace(id ? { pathname: '/workout/done', params: { id } } : '/home');
  };

  return (
    <SafeAreaView style={s.root}>
      <View style={s.header}>
        <IconButton icon="close" label="End workout" onPress={end} />
        <Text style={t.small}>
          Exercise {run.index + 1} of {day.blocks.length}
        </Text>
        <View style={{ width: 44 }} />
      </View>
      <View style={s.progress}>
        {day.blocks.map((_, i) => (
          <View key={i} style={[s.seg, i < run.index && { backgroundColor: colors.accent }, i === run.index && { backgroundColor: colors.text }]} />
        ))}
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <Text style={s.kicker}>{run.index === 0 ? 'First up' : 'Up next'}</Text>
        {ex && (
          <View style={s.hero}>
            <View style={s.heroIcon}>
              <Glyph path={ex.glyph} size={44} color={ex.tracked ? colors.accent : colors.text} />
            </View>
            <Text style={t.h1}>{ex.name}</Text>
            <Text style={s.target}>{blockTarget(block)}</Text>
            <Text style={t.body}>{ex.muscles}</Text>
          </View>
        )}

        {ex && (
          <Card style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Icon name={ex.tracked ? 'scan' : 'edit'} size={18} color={ex.tracked ? colors.accent : colors.textMuted} />
              <Text style={t.bodyStrong}>{ex.tracked ? 'Camera coached' : 'Log your sets'}</Text>
            </View>
            <Text style={[t.small, { color: colors.textMuted, lineHeight: 18 }]}>
              {ex.tracked
                ? `Prop the phone about 2 m away, ${ex.view === 'front' ? 'facing it' : 'side-on to it'}, with your whole body in view. Reps count automatically.`
                : `Tips: ${ex.checks.join(' · ')}`}
            </Text>
            {lastText && <Text style={t.small}>Last time: {lastText}</Text>}
          </Card>
        )}

        {run.index + 1 < day.blocks.length && (
          <View style={{ gap: 8 }}>
            <Text style={t.label}>After this</Text>
            {day.blocks.slice(run.index + 1, run.index + 3).map((blk, i) => (
              <BlockRow key={`${blk.exerciseId}-${i}`} block={blk} index={run.index + 1 + i} />
            ))}
          </View>
        )}
      </ScrollView>

      <View style={s.footer}>
        <Button icon={ex?.tracked ? 'scan' : 'edit'} label={ex?.tracked ? 'Start with camera' : 'Log sets'} onPress={go} />
        <Button variant="outline" icon="skip" label="Skip this exercise" onPress={() => advanceRun(null, block.exerciseId)} />
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8 },
  progress: { flexDirection: 'row', gap: 4, paddingHorizontal: 20, paddingTop: 12 },
  seg: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.border },
  content: { padding: 20, gap: 18 },
  kicker: { fontFamily: fonts.bold, fontSize: 13, color: colors.accent, textTransform: 'uppercase', letterSpacing: 1.2 },
  hero: { alignItems: 'flex-start', gap: 6 },
  heroIcon: { width: 76, height: 76, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  target: { fontFamily: fonts.display, fontSize: 30, color: colors.accent },
  footer: { paddingHorizontal: 20, paddingBottom: 12, paddingTop: 8, gap: 8 },
});
