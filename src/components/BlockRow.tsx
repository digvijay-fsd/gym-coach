import { StyleSheet, Text, View } from 'react-native';
import { getExercise, type Block } from '../data/exercises';
import { colors, fonts } from '../theme';
import { Glyph, Icon, t } from './ui';

export const blockTarget = (blk: Block) => {
  const ex = getExercise(blk.exerciseId);
  if (ex?.mode !== 'hold') return `${blk.sets} × ${blk.target} reps`;
  return blk.target >= 120 ? `${blk.sets} × ${Math.round(blk.target / 60)} min` : `${blk.sets} × ${blk.target}s`;
};

/** One exercise in a workout: thumbnail, name, sets × target and how it is tracked. */
export function BlockRow({ block, index, done, skipped, current }: { block: Block; index?: number; done?: boolean; skipped?: boolean; current?: boolean }) {
  const ex = getExercise(block.exerciseId);
  if (!ex) return null;
  return (
    <View style={[s.row, current && { borderColor: colors.accent }]}>
      <View style={s.thumb}>
        {done ? <Icon name="check" size={22} color={colors.accent} strokeWidth={2.6} /> : <Glyph path={ex.glyph} size={26} color={ex.tracked ? colors.accent : colors.textMuted} />}
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[t.bodyStrong, { fontSize: 15 }, skipped && { color: colors.textFaint, textDecorationLine: 'line-through' }]}>
          {index !== undefined ? `${index + 1}. ` : ''}
          {ex.name}
        </Text>
        <Text style={t.small}>
          {blockTarget(block)}
          {block.rest ? ` · ${block.rest}s rest` : ''}
        </Text>
      </View>
      <View style={s.mode}>
        <Icon name={ex.tracked ? 'scan' : 'edit'} size={14} color={ex.tracked ? colors.accent : colors.textMuted} />
        <Text style={[s.modeText, ex.tracked && { color: colors.accent }]}>{ex.tracked ? 'Camera' : 'Log'}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: 'transparent' },
  thumb: { width: 46, height: 46, borderRadius: 12, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  mode: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  modeText: { fontFamily: fonts.semibold, fontSize: 12, color: colors.textMuted },
});
