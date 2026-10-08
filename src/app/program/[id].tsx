import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlockRow } from '../../components/BlockRow';
import { Button, Card, IconButton, t } from '../../components/ui';
import { dayMinutes, getProgram } from '../../data/exercises';
import { activeProgram } from '../../data/plan';
import { useStore } from '../../state/store';
import { colors, fonts } from '../../theme';

const EQUIP_LABEL = { none: 'No equipment', dumbbells: 'Dumbbells', gym: 'Full gym' } as const;

export default function ProgramDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile, setProfile } = useStore();
  const program = getProgram(id);
  const back = () => (router.canGoBack() ? router.back() : router.replace('/workouts'));

  if (!program) {
    return (
      <SafeAreaView style={[s.root, { padding: 24, gap: 16 }]}>
        <Text style={t.h2}>Program not found</Text>
        <Button label="Back to workouts" onPress={() => router.replace('/workouts')} />
      </SafeAreaView>
    );
  }
  const isMine = activeProgram(profile).id === program.id;

  return (
    <SafeAreaView style={s.root}>
      <View style={s.header}>
        <IconButton icon="back" label="Back" onPress={back} />
        {program.custom && <IconButton icon="edit" label="Edit workout" onPress={() => router.push({ pathname: '/builder', params: { id: program.id } })} />}
      </View>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={{ gap: 6 }}>
          <Text style={s.kicker}>
            {program.where === 'gym' ? 'Gym' : 'Home'} · {EQUIP_LABEL[program.equipment]} · {program.custom ? 'Your workout' : program.level}
          </Text>
          <Text style={t.h1}>{program.title}</Text>
          <Text style={t.body}>{program.summary}</Text>
        </View>

        {isMine ? (
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderColor: colors.accent }}>
            <Text style={[t.bodyStrong, { color: colors.accent }]}>This is your plan.</Text>
            <Text style={[t.small, { flex: 1 }]}>Home shows the next day each time.</Text>
          </Card>
        ) : (
          <Button label="Make this my plan" onPress={() => setProfile({ ...profile, programId: program.id })} />
        )}

        {program.days.map((day) => (
          <View key={day.id} style={{ gap: 10 }}>
            <View style={s.dayHead}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={t.bodyStrong}>{day.title}</Text>
                <Text style={t.small}>
                  About {dayMinutes(day)} min · {day.blocks.length} exercises
                </Text>
              </View>
              <Button variant="outline" icon="play" label="Start" onPress={() => router.push({ pathname: '/workout/[program]/[day]', params: { program: program.id, day: day.id } })} style={{ height: 44 }} />
            </View>
            <View style={{ gap: 6 }}>
              {day.blocks.map((blk, i) => (
                <BlockRow key={`${blk.exerciseId}-${i}`} block={blk} index={i} />
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 20, paddingTop: 8, flexDirection: 'row', justifyContent: 'space-between' },
  content: { padding: 20, gap: 20 },
  kicker: { fontFamily: fonts.bold, fontSize: 12, color: colors.accent, textTransform: 'uppercase', letterSpacing: 1 },
  dayHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
