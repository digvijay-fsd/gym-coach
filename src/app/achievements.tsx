import { StyleSheet, Text, View } from 'react-native';
import { SubScreen } from '../components/SubScreen';
import { Icon } from '../components/ui';
import { achievements } from '../data/achievements';
import { useStore } from '../state/store';
import { colors, fonts } from '../theme';

export default function Achievements() {
  const { history, workouts, bodyLog, customPrograms } = useStore();
  const badges = achievements({ history, workouts: workouts.length, bodyEntries: bodyLog.length, customWorkouts: customPrograms.length });
  const earned = badges.filter((b) => b.earned).length;
  // Earned first, then the closest to being earned.
  const sorted = [...badges].sort((a, b) => Number(b.earned) - Number(a.earned) || b.value / b.goal - a.value / a.goal);

  return (
    <SubScreen title="Achievements" subtitle={`${earned} of ${badges.length} earned. Keep training to unlock the rest.`} fallback="/progress">
      <View style={s.grid}>
        {sorted.map((b) => (
          <View key={b.id} style={[s.badge, b.earned && { borderColor: colors.accent }]} accessibilityLabel={`${b.title}. ${b.detail}. ${b.earned ? 'Earned' : `${b.value} of ${b.goal}`}`}>
            <View style={[s.medal, { backgroundColor: b.earned ? colors.accent : colors.surface2 }]}>
              <Icon name={b.earned ? 'trophy' : 'lock'} size={22} color={b.earned ? colors.onAccent : colors.textFaint} />
            </View>
            <Text style={[s.title, !b.earned && { color: colors.textMuted }]} numberOfLines={1}>
              {b.title}
            </Text>
            <Text style={s.detail} numberOfLines={2}>
              {b.detail}
            </Text>
            {!b.earned && (
              <View style={{ gap: 4, alignSelf: 'stretch' }}>
                <View style={s.track}>
                  <View style={[s.fill, { width: `${(b.value / b.goal) * 100}%` }]} />
                </View>
                <Text style={s.count}>
                  {b.value.toLocaleString()} / {b.goal.toLocaleString()}
                </Text>
              </View>
            )}
          </View>
        ))}
      </View>
    </SubScreen>
  );
}

const s = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  badge: { flexGrow: 1, flexBasis: '45%', alignItems: 'center', gap: 6, padding: 14, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: 'transparent' },
  medal: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.bold, fontSize: 15, color: colors.text, textAlign: 'center' },
  detail: { fontFamily: fonts.regular, fontSize: 12, color: colors.textFaint, textAlign: 'center', minHeight: 32 },
  track: { height: 6, borderRadius: 3, backgroundColor: colors.surface2, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3, backgroundColor: colors.accent },
  count: { fontFamily: fonts.semibold, fontSize: 11, color: colors.textMuted, textAlign: 'center' },
});
