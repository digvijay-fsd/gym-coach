import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Chip, Glyph, Icon, Segmented, t } from '../../components/ui';
import { EXERCISES, PROGRAMS, type Category, type Place } from '../../data/exercises';
import { activeProgram } from '../../data/plan';
import { useStore } from '../../state/store';
import { colors, fonts } from '../../theme';

const CATS: ('All' | Category)[] = ['All', 'Strength', 'Cardio', 'Core'];
const EQUIP_LABEL = { none: 'No equipment', dumbbells: 'Dumbbells', gym: 'Full gym' } as const;

export default function Workouts() {
  const { profile, customPrograms } = useStore();
  const [place, setPlace] = useState<Place>(profile.where === 'gym' ? 'gym' : 'home');
  const [cat, setCat] = useState<(typeof CATS)[number]>('All');
  const [q, setQ] = useState('');
  const mine = activeProgram(profile).id;
  const query = q.trim().toLowerCase();
  const programs = PROGRAMS.filter((p) => p.where === place);
  const mineCustom = customPrograms.filter((p) => p.where === place);
  const items = EXERCISES.filter(
    (e) => e.where.includes(place) && (cat === 'All' || e.category === cat) && (!query || `${e.name} ${e.muscles}`.toLowerCase().includes(query)),
  );

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={t.h1}>Workouts</Text>

        <Segmented
          value={place}
          onChange={setPlace}
          options={[
            { value: 'home', label: 'At home' },
            { value: 'gym', label: 'At the gym' },
          ]}
        />

        <View style={{ gap: 10 }}>
          <Text style={t.label}>My workouts</Text>
          {mineCustom.map((p) => (
            <Pressable key={p.id} accessibilityRole="button" onPress={() => router.push({ pathname: '/program/[id]', params: { id: p.id } })} style={({ pressed }) => [s.item, p.id === mine && { borderWidth: 1.5, borderColor: colors.accent }, pressed && { opacity: 0.8 }]}>
              <View style={s.thumb}>
                <Icon name="list" size={22} color={colors.accent} />
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={t.bodyStrong}>{p.title}</Text>
                <Text style={t.small} numberOfLines={1}>
                  {p.summary}
                </Text>
              </View>
              <Icon name="arrow" size={18} color={colors.textMuted} />
            </Pressable>
          ))}
          <Pressable accessibilityRole="button" onPress={() => router.push('/builder')} style={({ pressed }) => [s.build, pressed && { opacity: 0.8 }]}>
            <Icon name="plus" size={20} color={colors.accent} />
            <Text style={[t.bodyStrong, { color: colors.accent }]}>Build your own workout</Text>
          </Pressable>
        </View>

        <View style={{ gap: 10 }}>
          <Text style={t.label}>Programs</Text>
          {programs.map((p) => (
            <Pressable key={p.id} accessibilityRole="button" onPress={() => router.push({ pathname: '/program/[id]', params: { id: p.id } })} style={({ pressed }) => [s.program, p.id === mine && { borderColor: colors.accent }, pressed && { opacity: 0.85 }]}>
              <View style={s.programBadge}>
                <Text style={s.programNum}>{p.days.length}</Text>
                <Text style={s.programDays}>{p.days.length === 1 ? 'DAY' : 'DAYS'}</Text>
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={s.programKicker}>{EQUIP_LABEL[p.equipment]}</Text>
                  {p.id === mine && <Text style={s.mine}>Your plan</Text>}
                </View>
                <Text style={t.bodyStrong}>{p.title}</Text>
                <Text style={t.small} numberOfLines={2}>
                  {p.summary}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>

        <View style={{ gap: 12 }}>
          <Text style={t.label}>Exercise library</Text>
          <View style={s.search}>
            <Icon name="search" size={18} color={colors.textFaint} />
            <TextInput
              value={q}
              onChangeText={setQ}
              placeholder="Search exercises or muscles"
              placeholderTextColor="#8A8D83"
              accessibilityLabel="Search exercises"
              style={s.input}
              returnKeyType="search"
            />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {CATS.map((c) => (
              <Chip key={c} label={c} selected={cat === c} onPress={() => setCat(c)} />
            ))}
          </ScrollView>
        </View>

        <View style={{ gap: 8 }}>
          {items.map((e) => (
            <Pressable key={e.id} accessibilityRole="button" onPress={() => router.push(`/exercise/${e.id}`)} style={({ pressed }) => [s.item, pressed && { opacity: 0.8 }]}>
              <View style={s.thumb}>
                <Glyph path={e.glyph} color={e.tracked ? colors.accent : colors.textMuted} />
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={t.bodyStrong}>{e.name}</Text>
                <Text style={t.small} numberOfLines={1}>
                  {e.muscles}
                </Text>
              </View>
              <View style={[s.mode, e.tracked && { backgroundColor: 'rgba(198,244,50,0.12)' }]}>
                <Icon name={e.tracked ? 'scan' : 'edit'} size={14} color={e.tracked ? colors.accent : colors.textMuted} />
                <Text style={[s.modeText, e.tracked && { color: colors.accent }]}>{e.tracked ? 'Camera' : 'Log'}</Text>
              </View>
            </Pressable>
          ))}
          {items.length === 0 && <Text style={[t.body, { textAlign: 'center', paddingVertical: 24 }]}>No exercises match “{q}”.</Text>}
        </View>

        <Pressable accessibilityRole="button" onPress={() => router.push('/scan')} style={s.scanButton}>
          <Icon name="scan" size={20} color={colors.accent} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={t.bodyStrong}>Scan a QR code</Text>
            <Text style={t.small}>Open an exercise from a code in your gym</Text>
          </View>
          <Icon name="arrow" size={18} color={colors.textMuted} />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, gap: 18 },
  build: { minHeight: 56, borderRadius: 16, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.borderStrong, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  scanButton: { minHeight: 64, borderRadius: 16, backgroundColor: colors.surface, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  search: { height: 48, borderRadius: 14, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14 },
  input: { flex: 1, color: colors.text, fontFamily: fonts.regular, fontSize: 15, height: 48 },
  program: { borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.borderStrong, padding: 16, flexDirection: 'row', gap: 14, alignItems: 'center' },
  programBadge: { width: 60, height: 60, borderRadius: 16, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  programNum: { fontFamily: fonts.display, fontSize: 26, lineHeight: 26, color: colors.onAccent },
  programDays: { fontFamily: fonts.bold, fontSize: 11, color: colors.onAccent },
  programKicker: { fontFamily: fonts.bold, fontSize: 12, color: colors.accent, textTransform: 'uppercase', letterSpacing: 1 },
  mine: { fontFamily: fonts.bold, fontSize: 11, color: colors.onAccent, backgroundColor: colors.accent, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, overflow: 'hidden' },
  item: { minHeight: 72, borderRadius: 16, backgroundColor: colors.surface, paddingLeft: 10, paddingRight: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  thumb: { width: 52, height: 52, borderRadius: 12, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  mode: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: colors.surface2 },
  modeText: { fontFamily: fonts.semibold, fontSize: 12, color: colors.textMuted },
});
