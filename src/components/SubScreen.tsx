import { router, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts } from '../theme';
import { Icon, IconButton, t } from './ui';

/** A pushed screen: back button, big title, optional subtitle, scrolling content. */
export function SubScreen({ title, subtitle, fallback = '/profile', footer, children }: { title: string; subtitle?: string; fallback?: Href; footer?: ReactNode; children: ReactNode }) {
  return (
    <SafeAreaView style={s.root}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.header}>
          <IconButton icon="back" label="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace(fallback))} />
        </View>
        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={{ gap: 6 }}>
            <Text style={t.h1}>{title}</Text>
            {subtitle ? <Text style={t.body}>{subtitle}</Text> : null}
          </View>
          {children}
        </ScrollView>
        {footer ? <View style={s.footer}>{footer}</View> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/** − value + control for small whole numbers. */
export function Stepper({ value, onChange, step = 1, min = 1, max = 999, format = String, label }: { value: number; onChange: (v: number) => void; step?: number; min?: number; max?: number; format?: (v: number) => string; label: string }) {
  const btn = (icon: 'minus' | 'plus', next: number, disabled: boolean) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${icon === 'minus' ? 'Less' : 'More'} ${label}`}
      disabled={disabled}
      onPress={() => onChange(next)}
      hitSlop={4}
      style={({ pressed }) => [s.stepBtn, { opacity: disabled ? 0.35 : pressed ? 0.7 : 1 }]}
    >
      <Icon name={icon} size={16} color={colors.text} strokeWidth={2.6} />
    </Pressable>
  );
  return (
    <View style={s.stepper} accessibilityLabel={`${label}: ${format(value)}`}>
      {btn('minus', Math.max(min, value - step), value <= min)}
      <Text style={s.stepValue}>{format(value)}</Text>
      {btn('plus', Math.min(max, value + step), value >= max)}
    </View>
  );
}

/** A green or orange note under a form. */
export function Notice({ message, tone = 'ok' }: { message: string | null; tone?: 'ok' | 'warn' }) {
  if (!message) return null;
  const color = tone === 'ok' ? colors.accent : colors.warn;
  return (
    <View style={[s.notice, { borderColor: color }]} accessibilityLiveRegion="polite">
      <Icon name={tone === 'ok' ? 'check' : 'warn'} size={18} color={color} />
      <Text style={[t.body, { flex: 1, color: colors.text }]}>{message}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 20, paddingTop: 8 },
  content: { padding: 20, gap: 18, paddingBottom: 40 },
  footer: { padding: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.bg },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stepBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  stepValue: { minWidth: 44, textAlign: 'center', fontFamily: fonts.bold, fontSize: 15, color: colors.text },
  notice: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 14, borderWidth: 1.5, backgroundColor: colors.surface },
});
