import * as DocumentPicker from 'expo-document-picker';

// Browser preview: download the backup instead of sharing it.
export async function saveBackupFile(name: string, text: string): Promise<void> {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function pickBackupFile(): Promise<string | null> {
  const res = await DocumentPicker.getDocumentAsync({ type: ['application/json', '.json'] });
  if (res.canceled) return null;
  const asset = res.assets[0];
  return asset.file ? asset.file.text() : (await fetch(asset.uri)).text();
}
