import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonContent } from '@ionic/angular/standalone';
import { Share } from '@capacitor/share';
import { HealthRepository } from '../health-repository';
import { buildSummary, summaryAsText } from '../summary';

@Component({
  selector: 'app-summary',
  standalone: true,
  imports: [RouterLink, FormsModule, IonContent],
  templateUrl: './summary.page.html',
  styleUrls: ['./summary.page.scss'],
})
export class SummaryPage {
  private repo = inject(HealthRepository);
  private router = inject(Router);

  readonly summary = computed(() => buildSummary(this.repo.record()));
  readonly status = signal<string | null>(null);
  notes = '';

  async ionViewWillEnter() {
    await this.repo.load();
    this.notes = this.repo.record().summaryNotes;
  }

  back() {
    this.router.navigateByUrl('/tabs/health');
  }

  saveNotes() {
    void this.repo.setSummaryNotes(this.notes);
  }

  /** Sharing is always started by the person; nothing is sent automatically. */
  async share() {
    this.saveNotes();
    const text = summaryAsText(buildSummary({ ...this.repo.record(), summaryNotes: this.notes }));
    try {
      const { value: canShare } = await Share.canShare();
      if (canShare) {
        await Share.share({ title: 'My appointment summary', text });
        return;
      }
    } catch {
      // Fall through to copying.
    }
    try {
      await navigator.clipboard.writeText(text);
      this.status.set('Copied. Paste it wherever you need it.');
    } catch {
      this.status.set('Sharing isn’t available here. Use Print instead.');
    }
  }

  print() {
    this.saveNotes();
    window.print();
  }
}
