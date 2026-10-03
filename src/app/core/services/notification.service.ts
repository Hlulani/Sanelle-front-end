import { Injectable, inject } from '@angular/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Preferences } from '@capacitor/preferences';
import { PlanStoreService } from './plan-store.service';

const ENABLED_KEY = 'notifications_enabled';
const PROMPT_SHOWN_KEY = 'notifications_prompt_shown';

const COOK_REMINDER_ID = 1001;
const STREAK_REMINDER_ID = 1002;

const COOK_REMINDER_HOUR = 17;
const STREAK_REMINDER_HOUR = 20;

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private planStore = inject(PlanStoreService);

  async isEnabled(): Promise<boolean> {
    const { value } = await Preferences.get({ key: ENABLED_KEY });
    return value === 'true';
  }

  async hasPromptedBefore(): Promise<boolean> {
    const { value } = await Preferences.get({ key: PROMPT_SHOWN_KEY });
    return value === 'true';
  }

  async markPrompted(): Promise<void> {
    await Preferences.set({ key: PROMPT_SHOWN_KEY, value: 'true' });
  }

  /** Requests OS permission and, if granted, turns reminders on. Returns whether it ended up enabled. */
  async enable(): Promise<boolean> {
    const { display } = await LocalNotifications.requestPermissions();
    if (display !== 'granted') {
      await Preferences.set({ key: ENABLED_KEY, value: 'false' });
      return false;
    }

    await Preferences.set({ key: ENABLED_KEY, value: 'true' });
    await this.reschedule();
    return true;
  }

  async disable(): Promise<void> {
    await Preferences.set({ key: ENABLED_KEY, value: 'false' });
    await LocalNotifications.cancel({
      notifications: [{ id: COOK_REMINDER_ID }, { id: STREAK_REMINDER_ID }],
    });
  }

  /** Re-syncs the scheduled reminders with current state (e.g. whether a plan exists).
   * Safe to call on every app launch — cancels and re-schedules idempotently. */
  async reschedule(): Promise<void> {
    if (!(await this.isEnabled())) return;

    await LocalNotifications.cancel({
      notifications: [{ id: COOK_REMINDER_ID }, { id: STREAK_REMINDER_ID }],
    });

    const notifications = [];

    if (this.planStore.getPlanSnapshot()) {
      notifications.push({
        id: COOK_REMINDER_ID,
        title: 'Time to cook 🍳',
        body: "Your meals for today are planned. Time to cook?",
        schedule: { on: { hour: COOK_REMINDER_HOUR, minute: 0 }, allowWhileIdle: true },
      });
    }

    notifications.push({
      id: STREAK_REMINDER_ID,
      title: 'Keep your streak going 🔥',
      body: "Log today's meals before the day ends.",
      schedule: { on: { hour: STREAK_REMINDER_HOUR, minute: 0 }, allowWhileIdle: true },
    });

    await LocalNotifications.schedule({ notifications });
  }
}
