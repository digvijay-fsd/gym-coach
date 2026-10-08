import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Field, FormError, SubmitButton } from '../../components/AuthForm';
import { Button, Card, Icon, Segmented, t, type IconName } from '../../components/ui';
import { activeProgram } from '../../data/plan';
import { streak, useStore } from '../../state/store';
import { colors, fonts } from '../../theme';

const GOAL_LABEL = { strength: 'Build strength', fat: 'Lose fat', mobility: 'Move better', active: 'Stay active' } as const;
const WHERE_LABEL = { home: 'Home', gym: 'Gym', both: 'Home and gym' } as const;

function Row({ icon, label, detail, onPress, danger }: { icon: IconName; label: string; detail?: string; onPress: () => void; danger?: boolean }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [s.row, pressed && { opacity: 0.8 }]}>
      <Icon name={icon} size={20} color={danger ? colors.warn : colors.textMuted} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[s.rowLabel, danger && { color: colors.warn }]}>{label}</Text>
        {detail ? <Text style={t.small}>{detail}</Text> : null}
      </View>
      <Icon name="arrow" size={18} color={colors.textFaint} />
    </Pressable>
  );
}

export default function Profile() {
  const { user, profile, setProfile, history, workouts, logOut, deleteAccount, bodyLog, reminders } = useStore();
  const [confirming, setConfirming] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const program = activeProgram(profile);
  const since = user ? new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : '';

  const remove = async () => {
    setBusy(true);
    setError(null);
    const res = await deleteAccount(password);
    setBusy(false);
    if (!res.ok) setError(res.error);
  };

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={s.header}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{(user?.name ?? '?')[0].toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={t.h2} numberOfLines={1}>
              {user?.name}
            </Text>
            <Text style={t.small} numberOfLines={1}>
              {user?.email} · since {since}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          {[
            ['Workouts', workouts.length],
            ['Sessions', history.length],
            ['Day streak', streak(history)],
          ].map(([l, v]) => (
            <Card key={l} style={{ flex: 1, padding: 12, gap: 2 }}>
              <Text style={t.small}>{l}</Text>
              <Text style={s.stat}>{v}</Text>
            </Card>
          ))}
        </View>

        <View style={{ gap: 8 }}>
          <Text style={t.label}>Your plan</Text>
          <Card style={{ padding: 0 }}>
            <Row icon="list" label={program.title} detail="Tap to change program" onPress={() => router.navigate('/workouts')} />
            <View style={s.divider} />
            <Row
              icon="edit"
              label="Goals and equipment"
              detail={`${GOAL_LABEL[profile.goal]} · ${WHERE_LABEL[profile.where]} · ${profile.days} days a week`}
              onPress={() => router.push('/setup')}
            />
          </Card>
        </View>

        <View style={{ gap: 8 }}>
          <Text style={t.label}>Weight units</Text>
          <Segmented
            value={profile.units}
            onChange={(units) => setProfile({ ...profile, units })}
            options={[
              { value: 'kg', label: 'kg' },
              { value: 'lb', label: 'lb' },
            ]}
          />
        </View>

        <View style={{ gap: 8 }}>
          <Text style={t.label}>Tools</Text>
          <Card style={{ padding: 0 }}>
            <Row icon="user" label="Body weight and BMI" detail={bodyLog[0] ? `Last logged ${new Date(bodyLog[0].at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}` : 'Track your weight over time'} onPress={() => router.push('/body')} />
            <View style={s.divider} />
            <Row icon="clock" label="Workout reminders" detail={reminders.on ? `On · ${reminders.days.length} days a week` : 'Off'} onPress={() => router.push('/reminders')} />
            <View style={s.divider} />
            <Row icon="trophy" label="Achievements" detail="Badges for streaks, reps and records" onPress={() => router.push('/achievements')} />
            <View style={s.divider} />
            <Row icon="list" label="Backup and restore" detail="Save your data to a file or move it to a new phone" onPress={() => router.push('/backup')} />
          </Card>
        </View>

        <View style={{ gap: 8 }}>
          <Text style={t.label}>Account</Text>
          <Card style={{ padding: 0 }}>
            <Row icon="user" label="Switch account" detail="Someone else training on this phone" onPress={logOut} />
            <View style={s.divider} />
            <Row icon="logout" label="Log out" onPress={logOut} />
            <View style={s.divider} />
            <Row icon="trash" label="Delete account" detail="Removes your profile and history from this phone" onPress={() => setConfirming(true)} danger />
          </Card>
        </View>

        {confirming && (
          <Card style={{ gap: 12, borderWidth: 1.5, borderColor: colors.warn }}>
            <Text style={t.bodyStrong}>Delete your account?</Text>
            <Text style={t.body}>This permanently removes your profile, {history.length} sessions and {workouts.length} workouts from this phone. It cannot be undone.</Text>
            <Field label="Enter your password to confirm" value={password} onChangeText={setPassword} secure autoCapitalize="none" autoComplete="current-password" />
            <FormError message={error} />
            <SubmitButton label="Delete account" busy={busy} onPress={remove} />
            <Button
              variant="outline"
              label="Cancel"
              onPress={() => {
                setConfirming(false);
                setPassword('');
                setError(null);
              }}
            />
          </Card>
        )}

        <View style={s.privacy}>
          <Icon name="lock" size={16} color={colors.textFaint} />
          <Text style={t.small}>Everything stays on this phone. Gym Coach has no servers and works offline.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, gap: 18 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.display, fontSize: 28, color: colors.onAccent },
  stat: { fontFamily: fonts.display, fontSize: 28, color: colors.text },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, minHeight: 56 },
  rowLabel: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text },
  divider: { height: 1, backgroundColor: colors.border, marginLeft: 48 },
  privacy: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
