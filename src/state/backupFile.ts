import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

/** Write the backup to a file and open the share sheet, so it can go to Drive, email, Files… */
export async function saveBackupFile(name: string, text: string): Promise<void> {
  const file = new File(Paths.cache, name);
  file.create({ overwrite: true });
  file.write(text);
  if (!(await Sharing.isAvailableAsync())) throw new Error('Sharing is not available on this phone.');
  await Sharing.shareAsync(file.uri, { mimeType: 'application/json', UTI: 'public.json', dialogTitle: 'Save your Gym Coach backup' });
}

/** Let the user pick a backup file; returns its text, or null if they cancel. */
export async function pickBackupFile(): Promise<string | null> {
  // Any type: some Android file managers do not label .json files as JSON. The contents are checked instead.
  const res = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
  if (res.canceled) return null;
  return new File(res.assets[0].uri).text();
}
