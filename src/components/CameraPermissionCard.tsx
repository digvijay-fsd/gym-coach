import { Linking, Platform, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../theme';
import { Button, Icon } from './ui';

type Props = {
  /** Why this screen needs the camera, in one sentence. */
  purpose: string;
  /** The user said no and the system will not ask again: only Settings can grant it. */
  blocked?: boolean;
  /** The camera failed to start for another reason. */
  error?: string | null;
  onAllow: () => void;
  onNotNow: () => void;
};

// Asks for the camera in the open: explains why first, and the system dialog
// appears only after the user taps "Allow camera". Never requested silently.
export function CameraPermissionCard({ purpose, blocked = false, error, onAllow, onNotNow }: Props) {
  const title = error ? 'Camera unavailable' : blocked ? 'Camera is turned off for FormAI' : 'Allow camera access';
  const body = error
    ? error
    : blocked
      ? `${purpose} Turn on Camera for FormAI in your phone's settings, then come back.`
      : purpose;

  return (
    <View style={s.card} accessibilityRole="alert">
      <View style={[s.icon, (error || blocked) && { backgroundColor: 'rgba(255,138,76,0.15)' }]}>
        <Icon name={error || blocked ? 'warn' : 'scan'} size={26} color={error || blocked ? colors.warn : colors.accent} />
      </View>
      <Text style={s.title}>{title}</Text>
      <Text style={s.body}>{body}</Text>
      {!error && (
        <View style={s.privacy}>
          <Icon name="lock" size={16} color={colors.textMuted} />
          <Text style={s.privacyText}>Video is processed on this phone. It is never saved or sent anywhere.</Text>
        </View>
      )}
      <View style={s.actions}>
        {blocked && !error && Platform.OS !== 'web' ? (
          <Button label="Open settings" onPress={() => Linking.openSettings()} />
        ) : (
          <Button label={error ? 'Try again' : 'Allow camera'} icon={error ? undefined : 'scan'} onPress={onAllow} />
        )}
        <Button variant="outline" label="Not now" onPress={onNotNow} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: { position: 'absolute', left: 20, right: 20, top: '18%', borderRadius: 24, backgroundColor: 'rgba(14,15,12,0.96)', borderWidth: 1, borderColor: colors.border, padding: 22, gap: 12, alignItems: 'center' },
  icon: { width: 56, height: 56, borderRadius: 18, backgroundColor: 'rgba(198,244,50,0.12)', alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.display, fontSize: 28, lineHeight: 30, color: colors.text, textTransform: 'uppercase', textAlign: 'center' },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 21, color: colors.textMuted, textAlign: 'center' },
  privacy: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.surface, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  privacyText: { flex: 1, fontFamily: fonts.medium, fontSize: 13, color: colors.textMuted },
  actions: { alignSelf: 'stretch', gap: 8, marginTop: 4 },
});
