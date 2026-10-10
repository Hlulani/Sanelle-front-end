import { Injectable, InjectionToken, inject } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { CareTask } from './diagnosis.model';

type CareNotifications = Pick<
  typeof LocalNotifications,
  'getPending' | 'cancel' | 'schedule' | 'requestPermissions' | 'checkPermissions'
>;
export const CARE_NOTIFICATIONS = new InjectionToken<CareNotifications>('Care notifications', {
  providedIn: 'root',
  factory: () => ({
    getPending: () => LocalNotifications.getPending(),
    cancel: (options) => LocalNotifications.cancel(options),
    schedule: (options) => LocalNotifications.schedule(options),
    requestPermissions: () => LocalNotifications.requestPermissions(),
    checkPermissions: () => LocalNotifications.checkPermissions(),
  }),
});

@Injectable({ providedIn: 'root' })
export class CareReminders {
  private generation = 0;
  private queue: Promise<void> = Promise.resolve();
  private notifications = inject(CARE_NOTIFICATIONS);
  readonly available = Capacitor.isNativePlatform();
  async enable(): Promise<boolean> {
    if (!this.available) return false;
    return (await this.notifications.requestPermissions()).display === 'granted';
  }
  async clear(): Promise<void> {
    this.generation++;
    await this.enqueue(() => this.cancelPending());
  }
  private async cancelPending(): Promise<void> {
    if (!this.available) return;
    const pending = await this.notifications.getPending();
    const ours = pending.notifications.filter((n) => n.extra?.sanelleCareTask);
    if (ours.length) await this.notifications.cancel({ notifications: ours.map(({ id }) => ({ id })) });
  }
  async reconcile(tasks: CareTask[]): Promise<void> {
    if (!this.available) return;
    const generation = ++this.generation;
    return this.enqueue(() => this.schedule(tasks, generation));
  }
  private async schedule(tasks: CareTask[], generation: number): Promise<void> {
    if (generation !== this.generation) return;
    await this.cancelPending();
    if ((await this.notifications.checkPermissions()).display !== 'granted' || generation !== this.generation) return;
    const notifications = tasks
      .filter((task) => !task.completedAt && task.reminderAt && new Date(task.reminderAt).getTime() > Date.now())
      .sort((a, b) => a.reminderAt!.localeCompare(b.reminderAt!))
      .slice(0, 60)
      .map((task, index) => ({
        id: 200_000 + index,
        title: 'A next step you saved',
        body: 'Open Sanelle to review your agreed next step.',
        schedule: { at: new Date(task.reminderAt!), allowWhileIdle: true },
        extra: { sanelleCareTask: task.id },
      }));
    if (notifications.length) await this.notifications.schedule({ notifications });
    if (generation !== this.generation) await this.cancelPending();
  }
  private enqueue(action: () => Promise<void>): Promise<void> {
    const work = this.queue.then(action);
    this.queue = work.catch(() => undefined);
    return work;
  }
}
