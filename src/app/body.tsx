import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { LineChart } from '../components/LineChart';
import { Notice, SubScreen } from '../components/SubScreen';
import { Button, Card, Icon, t } from '../components/ui';
import { bmi, bmiBand, changeOver, fromKg, toKg } from '../data/body';
import { useNow } from '../hooks/useNow';
import { useStore } from '../state/store';
import { colors, fonts } from '../theme';

const num = (s: string) => Number(s.replace(',', '.'));

export default function Body() {
  const { bodyLog, addBodyWeight, removeBodyWeight, profile, setProfile } = useStore();
  const now = useNow();
  const u = profile.units;
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState(profile.heightCm ? String(profile.heightCm) : '');
  const [msg, setMsg] = useState<{ text: string; tone: 'ok' | 'warn' } | null>(null);

  const latest = bodyLog[0];
  const value = latest ? bmi(latest.kg, profile.heightCm) : null;
  const band = value ? bmiBand(value) : null;
  const change = changeOver(bodyLog, 30, now);
  const trend = [...bodyLog].reverse().slice(-30).map((e) => ({ at: e.at, value: fromKg(e.kg, u) }));

  const add = () => {
    const kg = toKg(num(weight), u);
    if (!Number.isFinite(kg) || kg < 20 || kg > 400) return setMsg({ text: `Enter your weight in ${u}, for example ${u === 'kg' ? '72.5' : '160'}.`, tone: 'warn' });
    addBodyWeight(Math.round(kg * 100) / 100);
    setWeight('');
    setMsg({ text: 'Weight saved.', tone: 'ok' });
  };
  const saveHeight = () => {
    const cm = num(height);
    if (!Number.isFinite(cm) || cm < 100 || cm > 250) return setMsg({ text: 'Enter your height in centimetres, for example 172.', tone: 'warn' });
    setProfile({ ...profile, heightCm: Math.round(cm) });
    setMsg({ text: 'Height saved.', tone: 'ok' });
  };

  return (
    <SubScreen title="Body weight" subtitle="Log your weight about once a week, at the same time of day.">
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Card style={s.tile}>
          <Text style={t.small}>Current</Text>
          <Text style={s.stat}>{latest ? `${fromKg(latest.kg, u)}` : '–'}</Text>
          <Text style={t.small}>{u}</Text>
        </Card>
        <Card style={s.tile}>
          <Text style={t.small}>30-day change</Text>
          <Text style={s.stat}>{change === null ? '–' : `${change > 0 ? '+' : ''}${fromKg(change, u)}`}</Text>
          <Text style={t.small}>{u}</Text>
        </Card>
        <Card style={s.tile}>
          <Text style={t.small}>BMI</Text>
          <Text style={s.stat}>{value ?? '–'}</Text>
          <Text style={[t.small, band && { color: band.healthy ? colors.accent : colors.warn }]} numberOfLines={1}>
            {band ? band.label : profile.heightCm ? 'Add a weight' : 'Add height'}
          </Text>
        </Card>
      </View>

      <Card style={{ gap: 12 }}>
        <Text style={t.bodyStrong}>Log today&apos;s weight</Text>
        <View style={s.inputRow}>
          <TextInput value={weight} onChangeText={setWeight} keyboardType="decimal-pad" placeholder={u === 'kg' ? '72.5' : '160'} placeholderTextColor="#8A8D83" accessibilityLabel={`Weight in ${u}`} style={s.input} onSubmitEditing={add} />
          <Text style={s.unit}>{u}</Text>
          <Button label="Save" onPress={add} style={{ height: 48 }} />
        </View>
      </Card>

      <Notice message={msg?.text ?? null} tone={msg?.tone} />

      {trend.length > 1 && (
        <Card style={{ gap: 6 }}>
          <Text style={t.bodyStrong}>Trend</Text>
          <LineChart label="Body weight" points={trend} format={(v) => `${v} ${u}`} />
        </Card>
      )}

      <Card style={{ gap: 12 }}>
        <Text style={t.bodyStrong}>Height</Text>
        <Text style={t.small}>Used to work out your BMI. BMI is a rough guide: it does not tell muscle from fat.</Text>
        <View style={s.inputRow}>
          <TextInput value={height} onChangeText={setHeight} keyboardType="number-pad" placeholder="172" placeholderTextColor="#8A8D83" accessibilityLabel="Height in centimetres" style={s.input} onSubmitEditing={saveHeight} />
          <Text style={s.unit}>cm</Text>
          <Button variant="outline" label="Save" onPress={saveHeight} style={{ height: 48 }} />
        </View>
      </Card>

      {bodyLog.length > 0 && (
        <View style={{ gap: 8 }}>
          <Text style={t.label}>History</Text>
          {bodyLog.slice(0, 20).map((e) => (
            <Card key={e.id} style={s.row}>
              <Text style={[t.bodyStrong, { flex: 1 }]}>
                {fromKg(e.kg, u)} {u}
              </Text>
              <Text style={t.small}>{new Date(e.at).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Delete entry" onPress={() => removeBodyWeight(e.id)} hitSlop={10} style={{ padding: 4 }}>
                <Icon name="trash" size={18} color={colors.textFaint} />
              </Pressable>
            </Card>
          ))}
        </View>
      )}
    </SubScreen>
  );
}

const s = StyleSheet.create({
  tile: { flex: 1, padding: 12, gap: 2 },
  stat: { fontFamily: fonts.display, fontSize: 28, color: colors.text },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  input: { flex: 1, height: 48, borderRadius: 14, backgroundColor: colors.surface2, paddingHorizontal: 14, color: colors.text, fontFamily: fonts.semibold, fontSize: 18 },
  unit: { fontFamily: fonts.semibold, fontSize: 15, color: colors.textMuted },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
});
