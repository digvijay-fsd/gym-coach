import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Notice, Stepper, SubScreen } from '../components/SubScreen';
import { Button, Card, Chip, Segmented, t } from '../components/ui';
import { remindersSupported } from '../state/reminders';
import { useStore } from '../state/store';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const ORDER = [1, 2, 3, 4, 5, 6, 0];
const MINUTES = [0, 15, 30, 45];
const clock = (h: number, m: number) => new Date(2000, 0, 1, h, m).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

export default function RemindersScreen() {
  const { reminders, setReminders, profile } = useStore();
  const [draft, setDraft] = useState(reminders);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; tone: 'ok' | 'warn' } | null>(
    remindersSupported ? null : { text: 'Reminders work in the phone app. In this browser preview you can look, but nothing will be scheduled.', tone: 'warn' },
  );

  const toggleDay = (d: number) => setDraft((r) => ({ ...r, days: r.days.includes(d) ? r.days.filter((x) => x !== d) : [...r.days, d].sort() }));
  const save = async () => {
    setBusy(true);
    const res = await setReminders(draft);
    setBusy(false);
    if (!res.ok) return setMsg({ text: res.error, tone: 'warn' });
    if (!draft.on || draft.days.length === 0) return setMsg({ text: 'Reminders are off.', tone: 'ok' });
    setMsg({ text: `Done. You'll get a reminder at ${clock(draft.hour, draft.minute)} on ${ORDER.filter((d) => draft.days.includes(d)).map((d) => DAYS[d]).join(', ')}.`, tone: 'ok' });
  };

  return (
    <SubScreen
      title="Reminders"
      subtitle={`A nudge on your training days. Your plan is ${profile.days} days a week.`}
      footer={<Button label={busy ? 'Saving…' : 'Save reminders'} onPress={busy ? () => {} : save} />}
    >
      <Segmented
        value={draft.on ? 'on' : 'off'}
        onChange={(v) => setDraft((r) => ({ ...r, on: v === 'on' }))}
        options={[
          { value: 'on', label: 'On' },
          { value: 'off', label: 'Off' },
        ]}
      />

      <View style={{ gap: 10, opacity: draft.on ? 1 : 0.45 }} pointerEvents={draft.on ? 'auto' : 'none'}>
        <Text style={t.label}>Days</Text>
        <View style={s.days}>
          {ORDER.map((d) => (
            <Chip key={d} label={DAYS[d]} selected={draft.days.includes(d)} onPress={() => toggleDay(d)} />
          ))}
        </View>

        <Text style={[t.label, { marginTop: 8 }]}>Time</Text>
        <Card style={s.time}>
          <Text style={s.clock}>{clock(draft.hour, draft.minute)}</Text>
          <Stepper label="hour" value={draft.hour} min={0} max={23} onChange={(hour) => setDraft((r) => ({ ...r, hour }))} format={(h) => `${h}h`} />
        </Card>
        <View style={s.days}>
          {MINUTES.map((m) => (
            <Chip key={m} label={`:${String(m).padStart(2, '0')}`} selected={draft.minute === m} onPress={() => setDraft((r) => ({ ...r, minute: m }))} />
          ))}
        </View>
      </View>

      <Notice message={msg?.text ?? null} tone={msg?.tone} />
      <Text style={t.small}>Reminders are scheduled on this phone. They work offline and are only for you, not other accounts on this phone.</Text>
    </SubScreen>
  );
}

const s = StyleSheet.create({
  days: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  time: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  clock: { ...t.h2 },
});
