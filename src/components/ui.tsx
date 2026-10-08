import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { colors, fonts, radius } from '../theme';

const ICONS = {
  back: 'M15 6l-6 6 6 6',
  close: 'M6 6l12 12M18 6L6 18',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  home: 'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z',
  dumbbell: 'M6 6v12M18 6v12M3 9v6M21 9v6M6 12h12',
  chart: 'M4 20V11M10 20V5M16 20v-6M2 20h20',
  scan: 'M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2',
  lock: 'M8 11V7a4 4 0 0 1 8 0v4',
  check: 'M5 12l5 5L20 7',
  bulb: 'M12 3a6 6 0 0 0-4 10.5V17h8v-3.5A6 6 0 0 0 12 3zM9 21h6',
  sound: 'M4 9v6h4l5 4V5L8 9zM17 8a5 5 0 0 1 0 8M19.5 5.5a8.5 8.5 0 0 1 0 13',
  mute: 'M4 9v6h4l5 4V5L8 9zM17 9l5 6M22 9l-5 6',
  flip: 'M4 8h3l2-3h6l2 3h3v11H4zM9 13a3 3 0 0 1 5-2M15 13a3 3 0 0 1-5 2',
  phone: 'M9 2h6a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM11 18h2',
  warn: 'M12 9v4M12 17h.01M10.3 3.9L2 18a2 2 0 0 0 1.7 3h16.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
  trophy: 'M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4',
  search: 'M20 20l-4-4',
  minus: 'M5 12h14',
  plus: 'M12 5v14M5 12h14',
} as const;
export type IconName = keyof typeof ICONS | 'play' | 'pause' | 'stop';

export function Icon({ name, size = 22, color = colors.text, strokeWidth = 2 }: { name: IconName; size?: number; color?: string; strokeWidth?: number }) {
  if (name === 'play')
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path d="M7 4.5v15l13-7.5z" fill={color} />
      </Svg>
    );
  if (name === 'pause')
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Rect x={6} y={5} width={4} height={14} rx={1} fill={color} />
        <Rect x={14} y={5} width={4} height={14} rx={1} fill={color} />
      </Svg>
    );
  if (name === 'stop')
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Rect x={6} y={6} width={12} height={12} rx={2} fill={color} />
      </Svg>
    );
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d={ICONS[name]} />
      {name === 'scan' && <Circle cx={12} cy={12} r={3} />}
      {name === 'lock' && <Rect x={5} y={11} width={14} height={10} rx={2} />}
      {name === 'search' && <Circle cx={11} cy={11} r={7} />}
    </Svg>
  );
}

/** Small exercise thumbnail: a head plus the exercise's body glyph. */
export function Glyph({ path, size = 30, color = colors.accent }: { path: string; size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={12} cy={4} r={2} />
      <Path d={path} />
    </Svg>
  );
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'dark' | 'outline';
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
}) {
  const bg = variant === 'primary' ? colors.accent : variant === 'dark' ? colors.bg : 'transparent';
  const fg = variant === 'primary' ? colors.onAccent : colors.text;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        { backgroundColor: bg, opacity: pressed ? 0.85 : 1 },
        variant === 'outline' && { borderWidth: 1.5, borderColor: colors.borderStrong },
        style,
      ]}
    >
      {icon && <Icon name={icon} size={18} color={fg} strokeWidth={2.4} />}
      <Text style={[s.buttonText, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

export function IconButton({ icon, label, onPress, size = 44, bg = colors.surface, color = colors.text, round = false }: { icon: IconName; label: string; onPress: () => void; size?: number; bg?: string; color?: string; round?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => ({ width: size, height: size, borderRadius: round ? size / 2 : 12, backgroundColor: bg, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.8 : 1 })}
    >
      <Icon name={icon} size={20} color={color} />
    </Pressable>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[s.card, style]}>{children}</View>;
}

export function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[s.chip, selected ? { backgroundColor: colors.text, borderColor: colors.text } : null]}
    >
      <Text style={[s.chipText, { color: selected ? colors.onAccent : colors.textMuted }]}>{label}</Text>
    </Pressable>
  );
}

export function Segmented<T extends string>({ options, value, onChange }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <View style={s.segment}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable key={o.value} accessibilityRole="button" accessibilityState={{ selected: on }} onPress={() => onChange(o.value)} style={[s.segmentItem, on && { backgroundColor: colors.text }]}>
            <Text style={[s.segmentText, { color: on ? colors.onAccent : colors.textMuted }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export const t = StyleSheet.create({
  h1: { fontFamily: fonts.display, fontSize: 34, color: colors.text, textTransform: 'uppercase', lineHeight: 36 },
  h2: { fontFamily: fonts.display, fontSize: 28, color: colors.text, textTransform: 'uppercase', lineHeight: 30 },
  big: { fontFamily: fonts.display, fontSize: 40, color: colors.text, lineHeight: 42 },
  label: { fontFamily: fonts.semibold, fontSize: 13, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: 1 },
  body: { fontFamily: fonts.regular, fontSize: 15, color: colors.textMuted, lineHeight: 21 },
  bodyStrong: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },
  small: { fontFamily: fonts.regular, fontSize: 13, color: colors.textFaint },
  smallStrong: { fontFamily: fonts.semibold, fontSize: 13, color: colors.textMuted },
});

const s = StyleSheet.create({
  button: { height: 56, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 18 },
  buttonText: { fontFamily: fonts.bold, fontSize: 17 },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16 },
  chip: { height: 40, paddingHorizontal: 16, borderRadius: radius.pill, borderWidth: 1.5, borderColor: colors.border, justifyContent: 'center' },
  chipText: { fontFamily: fonts.semibold, fontSize: 14 },
  segment: { flexDirection: 'row', gap: 4, backgroundColor: colors.surface, padding: 4, borderRadius: radius.md },
  segmentItem: { flex: 1, height: 42, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  segmentText: { fontFamily: fonts.semibold, fontSize: 15 },
});
