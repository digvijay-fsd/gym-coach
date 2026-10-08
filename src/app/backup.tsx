import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Notice, SubScreen } from '../components/SubScreen';
import { Button, Card, Icon, t } from '../components/ui';
import { pickBackupFile, saveBackupFile } from '../state/backupFile';
import { useStore } from '../state/store';
import { colors } from '../theme';

export default function Backup() {
  const { user, history, workouts, bodyLog, customPrograms, exportBackup, importBackup } = useStore();
  const [busy, setBusy] = useState<'export' | 'import' | null>(null);
  const [msg, setMsg] = useState<{ text: string; tone: 'ok' | 'warn' } | null>(null);

  const doExport = async () => {
    setBusy('export');
    setMsg(null);
    try {
      const date = new Date().toISOString().slice(0, 10);
      const who = (user?.name ?? 'me').toLowerCase().replace(/[^a-z0-9]+/g, '-');
      await saveBackupFile(`gym-coach-${who}-${date}.json`, exportBackup());
      setMsg({ text: 'Backup ready. Keep the file somewhere safe, like Google Drive or your email.', tone: 'ok' });
    } catch (e) {
      setMsg({ text: e instanceof Error ? e.message : 'Could not save the backup.', tone: 'warn' });
    }
    setBusy(null);
  };

  const doImport = async () => {
    setBusy('import');
    setMsg(null);
    try {
      const text = await pickBackupFile();
      if (text !== null) {
        const res = importBackup(text);
        if (!res.ok) setMsg({ text: res.error, tone: 'warn' });
        else setMsg({ text: res.added ? `Imported ${res.added} new items. Nothing you already had was changed.` : 'Everything in that backup is already on this phone.', tone: 'ok' });
      }
    } catch {
      setMsg({ text: 'Could not read that file.', tone: 'warn' });
    }
    setBusy(null);
  };

  return (
    <SubScreen title="Backup" subtitle="Gym Coach has no servers, so your data lives only on this phone. Save a backup file to keep it safe or move it to a new phone.">
      <Card style={{ gap: 10 }}>
        <Text style={t.bodyStrong}>In this account</Text>
        {[
          ['Exercise sessions', history.length],
          ['Workouts', workouts.length],
          ['Body weight entries', bodyLog.length],
          ['Your own workouts', customPrograms.length],
        ].map(([l, v]) => (
          <View key={l} style={s.line}>
            <Text style={[t.body, { flex: 1 }]}>{l}</Text>
            <Text style={t.bodyStrong}>{v}</Text>
          </View>
        ))}
      </Card>

      <View style={{ gap: 10 }}>
        <Button icon="arrow" label={busy === 'export' ? 'Preparing…' : 'Export backup'} onPress={busy ? () => {} : doExport} />
        <Button variant="outline" icon="plus" label={busy === 'import' ? 'Opening…' : 'Import a backup'} onPress={busy ? () => {} : doImport} />
      </View>

      <Notice message={msg?.text ?? null} tone={msg?.tone} />

      <View style={s.note}>
        <Icon name="lock" size={16} color={colors.textFaint} />
        <Text style={[t.small, { flex: 1 }]}>Importing only adds what is missing; it never deletes or overwrites. The backup contains your training data, not your password.</Text>
      </View>
    </SubScreen>
  );
}

const s = StyleSheet.create({
  line: { flexDirection: 'row', alignItems: 'center' },
  note: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
});
