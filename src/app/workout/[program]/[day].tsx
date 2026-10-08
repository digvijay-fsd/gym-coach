import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlockRow } from '../../../components/BlockRow';
import { Button, Card, Icon, IconButton, t } from '../../../components/ui';
import { dayMinutes, getDay, getExercise } from '../../../data/exercises';
import { useStore } from '../../../state/store';
import { colors } from '../../../theme';

export default function WorkoutOverview() {
  const params = useLocalSearchParams<{ program: string; day: string }>();
  const { run, startRun } = useStore();
  const found = getDay(params.program, params.day);
  const back = () => (router.canGoBack() ? router.back() : router.replace('/home'));

  if (!found) {
    return (
      <SafeAreaView style={[s.root, { padding: 24, gap: 16 }]}>
        <Text style={t.h2}>Workout not found</Text>
        <Button label="Go home" onPress={() => router.replace('/home')} />
      </SafeAreaView>
    );
  }
  const { program, day } = found;
  const resuming = run && run.programId === program.id && run.dayId === day.id && run.index < day.blocks.length;
  const camera = day.blocks.filter((b) => getExercise(b.exerciseId)?.tracked).length;

  const start = () => {
    startRun(program.id, day.id, day.title);
    router.push('/workout/next');
  };

  return (
    <SafeAreaView style={s.root}>
      <View style={s.header}>
        <IconButton icon="back" label="Back" onPress={back} />
        <Text style={t.small} numberOfLines={1}>
          {program.title}
        </Text>
        <View style={{ width: 44 }} />
      </View>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={{ gap: 6 }}>
          <Text style={t.h1}>{day.title}</Text>
          <Text style={t.body}>
            About {dayMinutes(day)} min · {day.blocks.length} exercises · {camera} camera-coached
          </Text>
        </View>

        <View style={{ gap: 8 }}>
          {day.blocks.map((blk, i) => (
            <BlockRow
              key={`${blk.exerciseId}-${i}`}
              block={blk}
              index={i}
              done={!!resuming && i < run.index}
              skipped={!!resuming && i < run.index && run.skipped.includes(blk.exerciseId)}
              current={!!resuming && i === run.index}
            />
          ))}
        </View>

        <Card style={s.tip}>
          <Icon name="phone" size={20} color={colors.accent} />
          <Text style={[t.small, { flex: 1, color: colors.textMuted, lineHeight: 18 }]}>
            For camera exercises, prop your phone about 2 m away. For gym machines you will log weight and reps instead.
          </Text>
        </Card>
      </ScrollView>
      <View style={s.footer}>
        {resuming ? (
          <>
            <Button icon="play" label={`Resume · exercise ${run.index + 1} of ${day.blocks.length}`} onPress={() => router.push('/workout/next')} />
            <Button variant="outline" label="Start over" onPress={start} />
          </>
        ) : (
          <Button icon="play" label="Start workout" onPress={start} />
        )}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingHorizontal: 20, paddingTop: 8 },
  content: { padding: 20, gap: 18 },
  tip: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  footer: { paddingHorizontal: 20, paddingBottom: 12, paddingTop: 8, gap: 8 },
});
