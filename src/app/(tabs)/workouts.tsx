import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Chip, Glyph, Icon, t } from '../../components/ui';
import { EXERCISES, type Category } from '../../data/exercises';
import { colors, fonts } from '../../theme';

const CATS: ('All' | Category)[] = ['All', 'Strength', 'Cardio', 'Core'];

export default function Workouts() {
  const [cat, setCat] = useState<(typeof CATS)[number]>('All');
  const [q, setQ] = useState('');
  const query = q.trim().toLowerCase();
  const items = EXERCISES.filter(
    (e) => (cat === 'All' || e.category === cat) && (!query || `${e.name} ${e.muscles}`.toLowerCase().includes(query)),
  );

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={t.h1}>Workouts</Text>

        <Pressable accessibilityRole="button" onPress={() => router.push('/scan')} style={s.scanButton}>
          <Icon name="scan" size={20} color={colors.accent} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={t.bodyStrong}>Scan a QR code</Text>
            <Text style={t.small}>Open an exercise or inspect a code</Text>
          </View>
          <Icon name="arrow" size={18} color={colors.textMuted} />
        </Pressable>

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

        <Pressable accessibilityRole="button" onPress={() => router.push('/exercise/squat')} style={s.program}>
          <View style={s.programBadge}>
            <Text style={s.programNum}>30</Text>
            <Text style={s.programDays}>DAYS</Text>
          </View>
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={s.programKicker}>Program</Text>
            <Text style={t.bodyStrong}>Perfect Squat Challenge</Text>
            <Text style={t.small}>Depth and reps go up as your form improves</Text>
          </View>
        </Pressable>

        <View style={s.rowBetween}>
          <Text style={t.bodyStrong}>Camera-tracked exercises</Text>
          <Text style={t.small}>{items.length} shown</Text>
        </View>

        <View style={{ gap: 8 }}>
          {items.map((e) => (
            <Pressable key={e.id} accessibilityRole="button" onPress={() => router.push(`/exercise/${e.id}`)} style={({ pressed }) => [s.item, pressed && { opacity: 0.8 }]}>
              <View style={s.thumb}>
                <Glyph path={e.glyph} />
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={t.bodyStrong}>{e.name}</Text>
                <Text style={t.small} numberOfLines={1}>
                  {e.category} · Tracks {e.checks.slice(0, 2).join(', ').toLowerCase()}
                </Text>
              </View>
              <Text style={s.level}>{e.level}</Text>
            </Pressable>
          ))}
          {items.length === 0 && <Text style={[t.body, { textAlign: 'center', paddingVertical: 24 }]}>No exercises match “{q}”.</Text>}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, gap: 16 },
  scanButton: { minHeight: 64, borderRadius: 16, backgroundColor: colors.surface, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  search: { height: 48, borderRadius: 14, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14 },
  input: { flex: 1, color: colors.text, fontFamily: fonts.regular, fontSize: 15, height: 48 },
  program: { borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.borderStrong, padding: 16, flexDirection: 'row', gap: 14, alignItems: 'center' },
  programBadge: { width: 64, height: 64, borderRadius: 16, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  programNum: { fontFamily: fonts.display, fontSize: 26, lineHeight: 26, color: colors.onAccent },
  programDays: { fontFamily: fonts.bold, fontSize: 11, color: colors.onAccent },
  programKicker: { fontFamily: fonts.bold, fontSize: 12, color: colors.accent, textTransform: 'uppercase', letterSpacing: 1 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  item: { height: 72, borderRadius: 16, backgroundColor: colors.surface, paddingLeft: 10, paddingRight: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  thumb: { width: 52, height: 52, borderRadius: 12, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  level: { fontFamily: fonts.semibold, fontSize: 12, color: colors.textMuted, borderWidth: 1, borderColor: colors.borderStrong, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
});
