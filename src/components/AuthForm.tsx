import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts } from '../theme';
import { Button, Icon, IconButton, t } from './ui';

export function AuthScreen({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <SafeAreaView style={s.root}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.header}>
          <IconButton icon="back" label="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
        </View>
        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
          <View style={{ gap: 6 }}>
            <Text style={t.h1}>{title}</Text>
            <Text style={t.body}>{subtitle}</Text>
          </View>
          {children}
          <View style={s.privacy}>
            <Icon name="lock" size={16} color={colors.textMuted} />
            <Text style={s.privacyText}>Your account lives only on this phone. Nothing is sent to a server.</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function Field({ label, error, secure, ...input }: TextInputProps & { label: string; error?: string | null; secure?: boolean }) {
  const [hidden, setHidden] = useState(true);
  return (
    <View style={{ gap: 6 }}>
      <Text style={t.label}>{label}</Text>
      <View style={[s.inputRow, error ? { borderColor: colors.warn } : null]}>
        <TextInput
          {...input}
          accessibilityLabel={label}
          secureTextEntry={secure && hidden}
          placeholderTextColor="#8A8D83"
          style={s.input}
        />
        {secure && (
          <Pressable accessibilityRole="button" accessibilityLabel={hidden ? 'Show password' : 'Hide password'} onPress={() => setHidden((h) => !h)} hitSlop={8} style={s.eye}>
            <Text style={s.eyeText}>{hidden ? 'Show' : 'Hide'}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

export function SubmitButton({ label, busy, onPress }: { label: string; busy: boolean; onPress: () => void }) {
  return busy ? (
    <View style={s.busy} accessibilityLabel="Working">
      <ActivityIndicator color={colors.onAccent} />
    </View>
  ) : (
    <Button label={label} onPress={onPress} />
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <View style={s.error} accessibilityRole="alert" accessibilityLiveRegion="polite">
      <Icon name="warn" size={16} color={colors.warn} />
      <Text style={s.errorText}>{message}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 24, paddingTop: 8 },
  content: { paddingHorizontal: 24, paddingVertical: 20, gap: 18 },
  inputRow: { flexDirection: 'row', alignItems: 'center', height: 52, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: 'transparent' },
  input: { flex: 1, height: 52, color: colors.text, paddingHorizontal: 14, fontFamily: fonts.medium, fontSize: 16 },
  eye: { paddingHorizontal: 14, height: 52, justifyContent: 'center' },
  eyeText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.accent },
  busy: { height: 56, borderRadius: 16, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  error: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,138,76,0.12)', borderRadius: 12, padding: 12 },
  errorText: { flex: 1, fontFamily: fonts.medium, fontSize: 14, color: colors.warn },
  privacy: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 8 },
  privacyText: { flex: 1, fontFamily: fonts.regular, fontSize: 13, color: colors.textFaint },
});
