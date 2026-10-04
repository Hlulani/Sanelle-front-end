import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonContent } from '@ionic/angular/standalone';
import { EvidenceTopicsService } from '../evidence-topics.service';
import { HealthRepository } from '../../my-health/health-repository';
import { TRUSTED_RESOURCES } from '../trusted-resources';
import { OUTCOME_LABELS } from '../evidence.model';

/** Turns a claim someone read into a question for their gynaecologist. */
export function claimToQuestion(claim: string): string {
  const c = claim.trim().replace(/[.!?]+$/, '');
  return `I read that “${c}”. Does this apply to me?`;
}

@Component({
  selector: 'app-learn',
  standalone: true,
  imports: [RouterLink, FormsModule, IonContent],
  templateUrl: './learn.page.html',
  styleUrls: ['./learn.page.scss'],
})
export class LearnPage {
  private topics = inject(EvidenceTopicsService);
  private health = inject(HealthRepository);

  readonly resources = TRUSTED_RESOURCES;
  readonly error = signal('');
  ionViewWillEnter() { void this.health.load(); }
  async saveQuestion(question: string) {
    this.error.set('');
    try { await this.health.addQuestion(question); this.saved.set(question); }
    catch { this.error.set('Could not save your question. Please try again.'); }
  }

  readonly list = this.topics.list();
  readonly outcomes = OUTCOME_LABELS;
  readonly saved = signal<string | null>(null);
  claim = '';

  /** How many of the five outcomes had any studies, e.g. "Studies on 1 of 5". */
  coverage(topicId: string): string {
    const t = this.list.find((x) => x.id === topicId);
    if (!t) return '';
    // A registered trial with no results can be listed without counting as a study.
    const studied = t.findings.filter((f) => f.verdict !== 'none-found').length;
    return `Studies on ${studied} of ${t.findings.length} outcomes`;
  }

  async saveClaim() {
    const text = this.claim.trim();
    if (!text) return;
    const q = claimToQuestion(text);
    await this.saveQuestion(q);
    if (!this.error()) this.claim = '';
  }
}
