import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Password hashes live in SecureStore (Android Keystore / iOS Keychain, skipped
// by Android backup). The web build has no SecureStore, so it falls back to
// browser storage, which is fine for local testing but not for real use.
const web = Platform.OS === 'web';

export async function getSecret(key: string): Promise<string | null> {
  if (web) return globalThis.localStorage?.getItem(key) ?? null;
  return SecureStore.getItemAsync(key);
}

export async function setSecret(key: string, value: string): Promise<void> {
  if (web) {
    globalThis.localStorage?.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

export async function deleteSecret(key: string): Promise<void> {
  if (web) {
    globalThis.localStorage?.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}
