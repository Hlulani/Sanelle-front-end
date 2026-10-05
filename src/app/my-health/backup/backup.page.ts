import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { HealthRepository } from '../health-repository';
import { AuthService } from '../../core/auth/auth.service';
import { decryptBackup, encryptBackup } from './health-backup';
import { HealthRecord } from '../diagnosis.model';
import { saveFile } from '../../shared/files/save-file';
import { CareReminders } from '../steps/care-reminders.service';
import { localIsoDate } from '../../shared/calendar-date';

@Component({ selector: 'app-backup', standalone: true, imports: [FormsModule, RouterLink, IonContent], templateUrl: './backup.page.html', styleUrls: ['./backup.page.scss'] })
export class BackupPage {
  private repo = inject(HealthRepository);
  private auth = inject(AuthService);
  private reminders = inject(CareReminders);
  readonly busy = signal(false);
  readonly status = signal('');
  readonly error = signal('');
  readonly preview = signal<{ record: HealthRecord; exportedAt: string } | null>(null);
  readonly email = () => this.auth.getUserEmail();
  password = '';
  repeatPassword = '';
  restorePassword = '';
  restoreConfirmed = false;
  file: File | null = null;
  private previewAccount: string | null = null;

  selectFile(event: Event) {
    const input = event.target as HTMLInputElement;
    this.file = input.files?.[0] ?? null;
    this.preview.set(null); this.restoreConfirmed = false; this.error.set('');
    input.value = '';
  }
  async export() {
    if (this.busy()) return;
    this.error.set(''); this.status.set('');
    if (this.password !== this.repeatPassword) { this.error.set('The two passphrases must match.'); return; }
    this.busy.set(true);
    try {
      await this.repo.load();
      const content = await encryptBackup(this.repo.record(), this.password);
      await saveFile(`sanelle-health-${localIsoDate()}.json`, content, 'application/json');
      this.password = ''; this.repeatPassword = '';
      this.status.set('Encrypted backup ready. Keep the file and your passphrase somewhere you can access on another device.');
    } catch (error) { this.error.set(error instanceof Error ? error.message : 'Could not create your backup.'); }
    finally { this.busy.set(false); }
  }
  async unlock() {
    if (this.busy() || !this.file) return;
    this.busy.set(true); this.error.set(''); this.preview.set(null); this.restoreConfirmed = false;
    try {
      if (this.file.size > 15 * 1024 * 1024) throw new Error('Choose a backup smaller than 15 MB.');
      this.previewAccount = this.email();
      this.preview.set(await decryptBackup(await this.file.text(), this.restorePassword));
      this.restorePassword = '';
    } catch (error) { this.error.set(error instanceof Error ? error.message : 'Could not unlock your backup.'); }
    finally { this.busy.set(false); }
  }
  async restore() {
    const preview = this.preview();
    if (!preview || !this.restoreConfirmed || this.busy()) return;
    this.busy.set(true); this.error.set('');
    try {
      if (!this.previewAccount || this.email() !== this.previewAccount) throw new Error('Your signed-in account changed. Unlock the backup again.');
      // Reminders remain off after importing, until the person enables them on this device.
      const record = { ...preview.record, tasks: preview.record.tasks?.map((task) => ({ ...task, reminderAt: undefined })) };
      await this.repo.restoreRecord(record);
      await this.reminders.clear().catch(() => undefined);
      this.preview.set(null); this.file = null; this.restoreConfirmed = false;
      this.status.set('Health records restored for this account on this device. Check My health to review them. Device reminders need to be enabled again.');
    } catch (error) { this.error.set(error instanceof Error ? error.message : 'Could not restore the backup. Your current records have not been replaced.'); }
    finally { this.busy.set(false); }
  }
  ionViewWillLeave() { this.password = ''; this.repeatPassword = ''; this.restorePassword = ''; this.preview.set(null); this.file = null; this.restoreConfirmed = false; }
}
