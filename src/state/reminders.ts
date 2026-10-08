import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/** Weekly workout reminders. `days` are 0 = Sunday … 6 = Saturday. */
export type Reminders = { on: boolean; days: number[]; hour: number; minute: number };
export const DEFAULT_REMINDERS: Reminders = { on: false, days: [1, 3, 5], hour: 18, minute: 0 };

/** Local notifications need the phone app; the browser preview cannot schedule them. */
export const remindersSupported = Platform.OS !== 'web';
const CHANNEL = 'reminders';
const prefix = (accountId: string) => `reminder-${accountId}-`;

if (remindersSupported) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
  });
}

/** Remove this account's scheduled reminders. Other accounts on the phone keep theirs. */
export async function clearReminders(accountId: string) {
  if (!remindersSupported) return;
  const all = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(all.filter((n) => n.identifier.startsWith(prefix(accountId))).map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)));
}

/** Replace this account's reminders with `r`. Asks for notification permission when turning them on. */
export async function applyReminders(accountId: string, name: string, r: Reminders): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!remindersSupported) return { ok: false, error: 'Reminders work in the phone app, not in the browser preview.' };
  await clearReminders(accountId);
  if (!r.on || r.days.length === 0) return { ok: true };

  let { granted } = await Notifications.getPermissionsAsync();
  if (!granted) ({ granted } = await Notifications.requestPermissionsAsync({ ios: { allowAlert: true, allowSound: true, allowBadge: false } }));
  if (!granted) return { ok: false, error: 'Notifications are turned off for Gym Coach. Allow them in your phone settings to get reminders.' };

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL, { name: 'Workout reminders', importance: Notifications.AndroidImportance.HIGH });
  }
  const first = name.trim().split(/\s+/)[0];
  await Promise.all(
    r.days.map((day) =>
      Notifications.scheduleNotificationAsync({
        identifier: `${prefix(accountId)}${day}`,
        content: { title: 'Time to train 💪', body: first ? `${first}, your next workout is ready. Open Gym Coach to start.` : 'Your next workout is ready. Open Gym Coach to start.' },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday: day + 1, hour: r.hour, minute: r.minute, channelId: CHANNEL },
      }),
    ),
  );
  return { ok: true };
}
