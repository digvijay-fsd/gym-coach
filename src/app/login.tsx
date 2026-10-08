import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AuthScreen, Field, FormError, SubmitButton } from '../components/AuthForm';
import { t } from '../components/ui';
import { useStore } from '../state/store';
import { colors, fonts } from '../theme';

export default function LogIn() {
  const { accounts, logIn } = useStore();
  const [email, setEmail] = useState(accounts.length === 1 ? accounts[0].email : '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError(null);
    const res = await logIn(email, password);
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      setPassword('');
    }
  };

  return (
    <AuthScreen title="Welcome back" subtitle="Log in to continue your plan.">
      {accounts.length > 1 && (
        <View style={{ gap: 8 }}>
          <Text style={t.label}>Who is training?</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {accounts.map((a) => {
              const on = a.email === email.trim().toLowerCase();
              return (
                <Pressable
                  key={a.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  onPress={() => setEmail(a.email)}
                  style={[s.person, on && { borderColor: colors.accent }]}
                >
                  <View style={[s.avatar, on && { backgroundColor: colors.accent }]}>
                    <Text style={[s.avatarText, on && { color: colors.onAccent }]}>{a.name[0]?.toUpperCase()}</Text>
                  </View>
                  <Text style={s.personName} numberOfLines={1}>
                    {a.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}
      <Field label="Email" value={email} onChangeText={setEmail} placeholder="alex@example.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email" autoCorrect={false} />
      <Field label="Password" value={password} onChangeText={setPassword} secure autoCapitalize="none" autoComplete="current-password" onSubmitEditing={submit} />
      <FormError message={error} />
      <SubmitButton label="Log in" busy={busy} onPress={submit} />
      <Text style={[t.small, { textAlign: 'center', lineHeight: 18 }]}>
        Forgot your password? Accounts are stored only on this phone, so there is no reset email. You can create a new account.
      </Text>
      <Pressable accessibilityRole="button" onPress={() => router.replace('/signup')} style={{ alignSelf: 'center', padding: 10 }}>
        <Text style={t.smallStrong}>
          New here? <Text style={{ color: colors.accent }}>Create an account</Text>
        </Text>
      </Pressable>
    </AuthScreen>
  );
}

const s = StyleSheet.create({
  person: { width: 88, alignItems: 'center', gap: 6, padding: 10, borderRadius: 16, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.bold, fontSize: 17, color: colors.text },
  personName: { fontFamily: fonts.semibold, fontSize: 13, color: colors.text, maxWidth: 70 },
});
