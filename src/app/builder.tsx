import * as Crypto from 'expo-crypto';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Notice, Stepper, SubScreen } from '../components/SubScreen';
import { Button, Glyph, Icon, Segmented, t } from '../components/ui';
import { EXERCISES, getExercise, getProgram, type Block, type Place, type Program } from '../data/exercises';
import { useStore } from '../state/store';
import { colors, fonts } from '../theme';

const GYM_ONLY = ['barbell', 'machine', 'cable'];

function toProgram(id: string, title: string, where: Place, blocks: Block[]): Program {
  const gear = blocks.map((b) => getExercise(b.exerciseId)?.equipment ?? 'none');
  const names = blocks.map((b) => getExercise(b.exerciseId)?.name ?? '');
  return {
    id,
    title,
    where,
    equipment: gear.some((g) => GYM_ONLY.includes(g)) ? 'gym' : gear.includes('dumbbells') ? 'dumbbells' : 'none',
    level: 'Beginner',
    goals: [],
    summary: `${blocks.length} ${blocks.length === 1 ? 'exercise' : 'exercises'} · built by you`,
    custom: true,
    days: [{ id: 'a', title, focus: names.slice(0, 4).join(', '), blocks }],
  };
}

export default function Builder() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { saveCustomProgram, deleteCustomProgram, profile } = useStore();
  const existing = id ? getProgram(id) : undefined;
  const [title, setTitle] = useState(existing?.title ?? '');
  const [where, setWhere] = useState<Place>(existing?.where ?? (profile.where === 'gym' ? 'gym' : 'home'));
  const [blocks, setBlocks] = useState<Block[]>(existing?.days[0]?.blocks ?? []);
  const [picking, setPicking] = useState(blocks.length === 0);
  const [q, setQ] = useState('');
  const [error, setError] = useState<string | null>(null);

  const query = q.trim().toLowerCase();
  const choices = EXERCISES.filter((e) => e.where.includes(where) && (!query || `${e.name} ${e.muscles}`.toLowerCase().includes(query)));
  const update = (i: number, patch: Partial<Block>) => setBlocks((bs) => bs.map((b, j) => (j === i ? { ...b, ...patch } : b)));
  const move = (i: number, by: -1 | 1) =>
    setBlocks((bs) => {
      const next = [...bs];
      [next[i], next[i + by]] = [next[i + by], next[i]];
      return next;
    });

  const save = () => {
    const name = title.trim();
    if (!name) return setError('Give your workout a name.');
    if (blocks.length === 0) return setError('Add at least one exercise.');
    const pid = existing?.id ?? `custom-${Crypto.randomUUID()}`;
    saveCustomProgram(toProgram(pid, name, where, blocks));
    router.replace({ pathname: '/program/[id]', params: { id: pid } });
  };

  return (
    <SubScreen
      title={existing ? 'Edit workout' : 'Build a workout'}
      subtitle="Pick exercises and set your own sets and reps. Camera exercises are coached; the rest you log."
      fallback="/workouts"
      footer={<Button label={existing ? 'Save changes' : 'Save workout'} onPress={save} />}
    >
      <View style={{ gap: 6 }}>
        <Text style={t.label}>Name</Text>
        <TextInput value={title} onChangeText={setTitle} placeholder="e.g. Quick upper body" placeholderTextColor="#8A8D83" accessibilityLabel="Workout name" style={s.input} maxLength={40} />
      </View>

      <Segmented
        value={where}
        onChange={setWhere}
        options={[
          { value: 'home', label: 'At home' },
          { value: 'gym', label: 'At the gym' },
        ]}
      />

      <View style={{ gap: 8 }}>
        <Text style={t.label}>Exercises · {blocks.length}</Text>
        {blocks.map((b, i) => {
          const ex = getExercise(b.exerciseId);
          if (!ex) return null;
          const hold = ex.mode === 'hold';
          return (
            <View key={`${b.exerciseId}-${i}`} style={s.block}>
              <View style={s.blockHead}>
                <Text style={[t.bodyStrong, { flex: 1 }]} numberOfLines={1}>
                  {i + 1}. {ex.name}
                </Text>
                {i > 0 && (
                  <Pressable accessibilityRole="button" accessibilityLabel={`Move ${ex.name} up`} onPress={() => move(i, -1)} hitSlop={8} style={s.iconBtn}>
                    <View style={{ transform: [{ rotate: '90deg' }] }}>
                      <Icon name="back" size={18} color={colors.textMuted} />
                    </View>
                  </Pressable>
                )}
                <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${ex.name}`} onPress={() => setBlocks((bs) => bs.filter((_, j) => j !== i))} hitSlop={8} style={s.iconBtn}>
                  <Icon name="close" size={18} color={colors.textMuted} />
                </Pressable>
              </View>
              <View style={s.controls}>
                <View style={s.control}>
                  <Text style={t.small}>Sets</Text>
                  <Stepper label="sets" value={b.sets} min={1} max={10} onChange={(sets) => update(i, { sets })} />
                </View>
                <View style={s.control}>
                  <Text style={t.small}>{hold ? 'Seconds' : 'Reps'}</Text>
                  <Stepper label={hold ? 'seconds' : 'reps'} value={b.target} step={hold ? 5 : 1} min={hold ? 5 : 1} max={hold ? 1800 : 100} onChange={(target) => update(i, { target })} />
                </View>
                <View style={s.control}>
                  <Text style={t.small}>Rest</Text>
                  <Stepper label="rest seconds" value={b.rest} step={15} min={0} max={300} format={(v) => `${v}s`} onChange={(rest) => update(i, { rest })} />
                </View>
              </View>
            </View>
          );
        })}
        {!picking && <Button variant="outline" icon="plus" label="Add exercise" onPress={() => setPicking(true)} />}
      </View>

      {picking && (
        <View style={{ gap: 8 }}>
          <View style={s.search}>
            <Icon name="search" size={18} color={colors.textFaint} />
            <TextInput value={q} onChangeText={setQ} placeholder="Search exercises" placeholderTextColor="#8A8D83" accessibilityLabel="Search exercises" style={s.searchInput} />
            {blocks.length > 0 && (
              <Pressable accessibilityRole="button" onPress={() => setPicking(false)} hitSlop={8}>
                <Text style={[t.smallStrong, { color: colors.accent }]}>Done</Text>
              </Pressable>
            )}
          </View>
          {choices.map((e) => (
            <Pressable
              key={e.id}
              accessibilityRole="button"
              accessibilityLabel={`Add ${e.name}`}
              onPress={() => {
                setBlocks((bs) => [...bs, { exerciseId: e.id, sets: e.sets, target: e.target, rest: e.rest }]);
                setError(null);
              }}
              style={({ pressed }) => [s.choice, pressed && { opacity: 0.8 }]}
            >
              <Glyph path={e.glyph} size={26} color={e.tracked ? colors.accent : colors.textMuted} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[t.bodyStrong, { fontSize: 15 }]}>{e.name}</Text>
                <Text style={t.small} numberOfLines={1}>
                  {e.tracked ? 'Camera' : 'Log'} · {e.muscles}
                </Text>
              </View>
              <Icon name="plus" size={20} color={colors.accent} />
            </Pressable>
          ))}
        </View>
      )}

      <Notice message={error} tone="warn" />

      {existing && (
        <Button
          variant="outline"
          icon="trash"
          label="Delete this workout"
          onPress={() => {
            deleteCustomProgram(existing.id);
            router.replace('/workouts');
          }}
        />
      )}
    </SubScreen>
  );
}

const s = StyleSheet.create({
  input: { height: 52, borderRadius: 14, backgroundColor: colors.surface, paddingHorizontal: 14, color: colors.text, fontFamily: fonts.semibold, fontSize: 16 },
  block: { gap: 10, padding: 14, borderRadius: 16, backgroundColor: colors.surface },
  blockHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  iconBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  controls: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },
  control: { gap: 4 },
  search: { height: 48, borderRadius: 14, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14 },
  searchInput: { flex: 1, color: colors.text, fontFamily: fonts.regular, fontSize: 15, height: 48 },
  choice: { minHeight: 60, borderRadius: 14, backgroundColor: colors.surface, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
});
