import { TestBed } from '@angular/core/testing';
import { Capacitor } from '@capacitor/core';
import { LocalNotificationSchema } from '@capacitor/local-notifications';
import { CareTask } from './diagnosis.model';
import { CARE_NOTIFICATIONS, CareReminders } from './care-reminders.service';

describe('Care reminders', () => {
  let service: CareReminders;
  let pending: LocalNotificationSchema[];
  let schedule: jasmine.Spy;
  let requestPermissions: jasmine.Spy;
  const task = (id: string): CareTask => ({
    id,
    title: 'Private health step',
    createdAt: new Date().toISOString(),
    reminderAt: new Date(Date.now() + 86_400_000).toISOString(),
  });
  beforeEach(() => {
    spyOn(Capacitor, 'isNativePlatform').and.returnValue(true);
    pending = [{ id: 1001, title: 'Meal reminder', body: 'Meals' }];
    schedule = jasmine
      .createSpy('schedule')
      .and.callFake(async ({ notifications }: { notifications: LocalNotificationSchema[] }) => {
        pending.push(...notifications);
      });
    requestPermissions = jasmine.createSpy('requestPermissions').and.resolveTo({ display: 'granted' });
    TestBed.configureTestingModule({
      providers: [
        {
          provide: CARE_NOTIFICATIONS,
          useValue: {
            getPending: async () => ({ notifications: pending }),
            cancel: async ({ notifications }: { notifications: { id: number }[] }) => {
              pending = pending.filter((n) => !notifications.some((item) => item.id === n.id));
            },
            schedule,
            requestPermissions,
            checkPermissions: async () => ({ display: 'granted' }),
          },
        },
      ],
    });
    service = TestBed.inject(CareReminders);
  });
  it('schedules only future unfinished steps, keeps health text off the lock screen and preserves meal reminders', async () => {
    await service.reconcile([
      task('future'),
      { ...task('completed'), completedAt: new Date().toISOString() },
      { ...task('past'), reminderAt: '2020-01-01T00:00:00Z' },
    ]);
    expect(pending.length).toBe(2);
    expect(pending[1].extra.sanelleCareTask).toBe('future');
    expect(pending[1].body).not.toContain('Private health');
    expect(requestPermissions).not.toHaveBeenCalled();
    await service.clear();
    expect(pending.map((n) => n.id)).toEqual([1001]);
  });
  it('keeps the newest task schedule when an older scheduling request finishes late', async () => {
    let started!: () => void;
    let release!: () => void;
    const inPlugin = new Promise<void>((resolve) => {
      started = resolve;
    });
    const waiting = new Promise<void>((resolve) => {
      release = resolve;
    });
    schedule.and.callFake(async ({ notifications }: { notifications: LocalNotificationSchema[] }) => {
      started();
      await waiting;
      pending.push(...notifications);
    });
    const earlier = service.reconcile([task('earlier')]);
    await inPlugin;
    const latest = service.reconcile([task('latest')]);
    release();
    await Promise.all([earlier, latest]);
    expect(pending.filter((n) => n.extra?.sanelleCareTask).map((n) => n.extra.sanelleCareTask)).toEqual(['latest']);
  });
  it('clears a reminder even when logout happens during scheduling', async () => {
    let started!: () => void;
    let release!: () => void;
    const inPlugin = new Promise<void>((resolve) => {
      started = resolve;
    });
    const waiting = new Promise<void>((resolve) => {
      release = resolve;
    });
    schedule.and.callFake(async ({ notifications }: { notifications: LocalNotificationSchema[] }) => {
      started();
      await waiting;
      pending.push(...notifications);
    });
    const saving = service.reconcile([task('step')]);
    await inPlugin;
    const clearing = service.clear();
    release();
    await Promise.all([saving, clearing]);
    expect(pending.map((n) => n.id)).toEqual([1001]);
  });
});
