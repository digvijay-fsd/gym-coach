import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text } from 'react-native';
import { AuthScreen, Field, FormError, SubmitButton } from '../components/AuthForm';
import { t } from '../components/ui';
import { MIN_PASSWORD_LENGTH } from '../auth/password';
import { useStore } from '../state/store';
import { colors } from '../theme';

export default function SignUp() {
  const { signUp } = useStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (password !== confirm) {
      setError('The two passwords do not match.');
      return;
    }
    setBusy(true);
    setError(null);
    const res = await signUp(name, email, password);
    setBusy(false);
    // On success the login guard swaps this screen out; Home sends new users to setup.
    if (!res.ok) setError(res.error);
  };

  return (
    <AuthScreen title="Create your account" subtitle="One account per person. Each keeps their own plan and history on this phone.">
      <Field label="Your name" value={name} onChangeText={setName} placeholder="Alex" autoCapitalize="words" autoComplete="name" maxLength={30} />
      <Field label="Email" value={email} onChangeText={setEmail} placeholder="alex@example.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email" autoCorrect={false} />
      <Field label={`Password (${MIN_PASSWORD_LENGTH}+ characters)`} value={password} onChangeText={setPassword} secure autoCapitalize="none" autoComplete="new-password" />
      <Field label="Confirm password" value={confirm} onChangeText={setConfirm} secure autoCapitalize="none" autoComplete="new-password" onSubmitEditing={submit} />
      <FormError message={error} />
      <SubmitButton label="Create account" busy={busy} onPress={submit} />
      <Pressable accessibilityRole="button" onPress={() => router.replace('/login')} style={{ alignSelf: 'center', padding: 10 }}>
        <Text style={t.smallStrong}>
          Already have an account? <Text style={{ color: colors.accent }}>Log in</Text>
        </Text>
      </Pressable>
    </AuthScreen>
  );
}
