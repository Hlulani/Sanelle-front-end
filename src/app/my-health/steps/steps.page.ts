import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { CareTask } from '../diagnosis.model';
import { HealthRepository } from '../health-repository';
import { CareReminders } from './care-reminders.service';
import { addDays, localIsoDate } from '../../shared/calendar-date';
import { saveFile } from '../../shared/files/save-file';

@Component({ selector: 'app-steps', standalone: true, imports: [FormsModule, RouterLink, IonContent], templateUrl: './steps.page.html', styleUrls: ['./steps.page.scss'] })
export class StepsPage implements OnInit {
  private repo = inject(HealthRepository);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);
  readonly reminders = inject(CareReminders);
  readonly tasks = computed(() => [...(this.repo.record().tasks ?? [])].sort((a, b) => Number(!!a.completedAt) - Number(!!b.completedAt) || (a.dueDate || '9999').localeCompare(b.dueDate || '9999')));
  readonly busy = signal(false);
  readonly ready = signal(false);
  readonly status = signal('');
  readonly error = signal('');
  readonly removing = signal<string | null>(null);
  id: string | undefined;
  title = '';
  dueDate = '';
  reminderAt = '';
  visitDate = '';
  reminder = false;
  readonly today = localIsoDate();

  async ngOnInit() {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const title = params.get('title');
      if (title) { this.reset(); this.title = title; this.visitDate = params.get('visit') ?? ''; }
    });
    await this.repo.load();
    this.ready.set(true);
  }
  overdue(task: CareTask) { return !task.completedAt && !!task.dueDate && task.dueDate < this.today; }
  edit(task: CareTask) {
    this.id = task.id; this.title = task.title; this.dueDate = task.dueDate ?? ''; this.visitDate = task.visitDate ?? '';
    this.reminder = !!task.reminderAt;
    this.reminderAt = task.reminderAt ? localDateTime(new Date(task.reminderAt)) : '';
    this.status.set('Editing this step.');
  }
  reset() { this.id = undefined; this.title = ''; this.dueDate = ''; this.reminderAt = ''; this.reminder = false; this.visitDate = ''; }
  async save() {
    if (!this.ready() || this.busy()) return;
    this.error.set('');
    if (!this.title.trim()) { this.error.set('Add the step you want to remember.'); return; }
    if (this.reminder && (!this.reminderAt || new Date(this.reminderAt).getTime() <= Date.now() || isNaN(new Date(this.reminderAt).getTime()))) {
      this.error.set('Choose a reminder time in the future.'); return;
    }
    this.busy.set(true);
    try {
      if (this.reminder && this.reminders.available && !await this.reminders.enable()) throw new Error('Allow notifications in device settings, or save this step without a reminder.');
      const prior = this.tasks().find((task) => task.id === this.id);
      await this.repo.saveTask({ id: this.id, title: this.title, dueDate: this.dueDate || undefined, visitDate: this.visitDate || undefined,
        reminderAt: this.reminder ? new Date(this.reminderAt).toISOString() : undefined, completedAt: prior?.completedAt });
      await this.syncReminders(); this.reset();
      this.status.set('Next step saved. You can find it in My health and Today.');
    } catch (error) { this.error.set(error instanceof Error ? error.message : 'Could not save this step. Please try again.'); }
    finally { this.busy.set(false); }
  }
  async complete(task: CareTask) { await this.change(() => this.repo.completeTask(task.id, !task.completedAt)); }
  async remove(task: CareTask) { await this.change(() => this.repo.removeTask(task.id)); this.removing.set(null); }
  private async change(action: () => Promise<void>) {
    if (this.busy()) return;
    this.busy.set(true); this.error.set('');
    try { await action(); await this.syncReminders(); }
    catch { this.error.set('Could not save your change. Please try again.'); }
    finally { this.busy.set(false); }
  }
  private async syncReminders() {
    try { await this.reminders.reconcile(this.tasks()); }
    catch { this.error.set('Your step is saved, but its device reminder could not be updated. Check your notification settings.'); }
  }
  async calendar(task: CareTask) {
    if (!task.dueDate) return;
    try { await saveFile('sanelle-next-step.ics', calendarEntry(task), 'text/calendar'); this.status.set('Calendar file ready. Open it in your calendar to add this step.'); }
    catch { this.error.set('Could not save the calendar file. Your step is still saved here.'); }
  }
}
function localDateTime(date: Date): string {
  return `${localIsoDate(date)}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}
export function calendarEntry(task: CareTask): string {
  const escape = (value: string) => value.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
  const start = task.dueDate ?? localIsoDate();
  const day = start.replace(/-/g, '');
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Sanelle//Next Steps//EN', 'BEGIN:VEVENT', `UID:${task.id}@sanelle`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`, `DTSTART;VALUE=DATE:${day}`,
    `DTEND;VALUE=DATE:${addDays(start, 1).replace(/-/g, '')}`, `SUMMARY:${escape(task.title)}`, 'END:VEVENT', 'END:VCALENDAR', ''].join('\r\n');
}
