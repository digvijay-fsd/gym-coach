import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Icon, IconButton, t } from '../components/ui';
import { EXERCISES } from '../data/exercises';
import { colors, fonts } from '../theme';

function findExercise(payload: string) {
  const parts = payload.trim().split(/[/?#]/).filter(Boolean);
  const slug = parts.at(-1)?.toLowerCase();
  return EXERCISES.find((exercise) => exercise.id === payload.trim().toLowerCase() || exercise.id === slug);
}

export default function Scan() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const permissionRequested = useRef(false);
  const exercise = scanned ? findExercise(scanned) : undefined;

  useEffect(() => {
    if (permission?.status !== 'undetermined' || permissionRequested.current) return;
    permissionRequested.current = true;
    requestPermission().catch((error: unknown) => {
      setCameraError(error instanceof Error ? error.message : 'Could not request camera permission.');
    });
  }, [permission?.status, requestPermission]);

  return (
    <SafeAreaView style={s.root}>
      <View style={s.header}>
        <IconButton icon="back" label="Back to workouts" onPress={() => (router.canGoBack() ? router.back() : router.replace('/workouts'))} />
        <Text style={t.h2}>Scan QR</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={s.camera}>
        {permission?.granted && !cameraError && (
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={scanned ? undefined : ({ data }) => setScanned(data)}
            onMountError={({ message }) => setCameraError(message)}
          />
        )}
        <View pointerEvents="none" style={s.scanFrame}>
          <View style={s.cornerTopLeft} />
          <View style={s.cornerTopRight} />
          <View style={s.cornerBottomLeft} />
          <View style={s.cornerBottomRight} />
        </View>

        {!permission?.granted || cameraError ? (
          <View style={s.prompt}>
            <Icon name={cameraError ? 'warn' : 'scan'} size={32} color={cameraError ? colors.warn : colors.accent} />
            <Text style={t.bodyStrong}>{cameraError ? 'Scanner unavailable' : !permission ? 'Checking camera' : 'Camera access needed'}</Text>
            <Text style={[t.small, { textAlign: 'center' }]}>
              {cameraError ?? (!permission ? 'Please wait…' : permission.canAskAgain ? 'Allow camera access to scan a QR code.' : 'Enable camera access for FormAI in your device settings.')}
            </Text>
            {(permission?.canAskAgain || cameraError) && (
              <Button
                label={cameraError ? 'Try again' : 'Allow camera'}
                onPress={() => {
                  setCameraError(null);
                  requestPermission().catch((error: unknown) => {
                    setCameraError(error instanceof Error ? error.message : 'Could not request camera permission.');
                  });
                }}
                style={{ marginTop: 8 }}
              />
            )}
          </View>
        ) : null}

        {!scanned && permission?.granted && !cameraError && (
          <View pointerEvents="none" style={s.hint}>
            <Text style={s.hintText}>Place a QR code inside the frame</Text>
          </View>
        )}
      </View>

      {scanned ? (
        <View style={s.result}>
          <View style={s.resultHeading}>
            <Icon name={exercise ? 'check' : 'scan'} size={20} color={colors.accent} />
            <Text style={[t.bodyStrong, { flex: 1 }]}>{exercise ? `${exercise.name} detected` : 'QR contents'}</Text>
          </View>
          {!exercise && (
            <Text selectable numberOfLines={6} style={s.payload}>
              {scanned}
            </Text>
          )}
          {exercise ? (
            <Button label="Open exercise" onPress={() => router.replace(`/exercise/${exercise.id}`)} />
          ) : (
            <Text style={[t.small, { lineHeight: 18 }]}>This code does not match a FormAI exercise. Its contents are shown above.</Text>
          )}
          <Button variant="outline" label="Scan another code" onPress={() => setScanned(null)} />
        </View>
      ) : (
        <View style={s.footer}>
          <Text style={[t.small, { textAlign: 'center' }]}>Recognized exercise codes open the exercise. Other codes are displayed without opening links.</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  camera: { flex: 1, backgroundColor: colors.camera, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  scanFrame: { width: 240, height: 240 },
  cornerTopLeft: { position: 'absolute', top: 0, left: 0, width: 36, height: 36, borderTopWidth: 4, borderLeftWidth: 4, borderColor: colors.accent, borderTopLeftRadius: 12 },
  cornerTopRight: { position: 'absolute', top: 0, right: 0, width: 36, height: 36, borderTopWidth: 4, borderRightWidth: 4, borderColor: colors.accent, borderTopRightRadius: 12 },
  cornerBottomLeft: { position: 'absolute', bottom: 0, left: 0, width: 36, height: 36, borderBottomWidth: 4, borderLeftWidth: 4, borderColor: colors.accent, borderBottomLeftRadius: 12 },
  cornerBottomRight: { position: 'absolute', bottom: 0, right: 0, width: 36, height: 36, borderBottomWidth: 4, borderRightWidth: 4, borderColor: colors.accent, borderBottomRightRadius: 12 },
  prompt: { position: 'absolute', left: 24, right: 24, alignItems: 'center', gap: 10, borderRadius: 20, backgroundColor: colors.bg, padding: 20 },
  hint: { position: 'absolute', bottom: 24, backgroundColor: 'rgba(14,15,12,0.85)', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9 },
  hintText: { fontFamily: fonts.medium, fontSize: 14, color: colors.text },
  footer: { paddingHorizontal: 24, paddingVertical: 18 },
  result: { gap: 12, padding: 20 },
  resultHeading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  payload: { maxHeight: 120, color: colors.textMuted, fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, backgroundColor: colors.surface, borderRadius: 12, padding: 12 },
});
