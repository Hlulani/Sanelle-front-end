import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonModal,
  IonSpinner,
  IonText,
  IonTextarea,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { Share } from '@capacitor/share';
import { ChallengeDefinition, ChallengeProgress, ChallengesService } from '../../core/services/challenges.service';
import { CustomChallengesService } from '../../core/services/custom-challenges.service';
import { ChallengeMemberResponse, CustomChallengeResponse } from '../../core/services/api.service';
import { InitialAvatarComponent } from '../../shared/components/initial-avatar/initial-avatar.component';

type ChallengeMechanic = 'meals-in-period' | 'days-in-period' | 'streak';

/** Optional cooking challenges: built-in ones, ones she made, and ones she joined by invite code. */
@Component({
  selector: 'app-cooking-challenges',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    FormsModule,
    InitialAvatarComponent,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonInput,
    IonItem,
    IonModal,
    IonSpinner,
    IonText,
    IonTextarea,
    IonTitle,
    IonToolbar,
  ],
  templateUrl: './cooking-challenges.component.html',
  styleUrls: ['./cooking-challenges.component.scss'],
})
export class CookingChallengesComponent implements OnInit {
  readonly builtIn = inject(ChallengesService);
  private readonly custom = inject(CustomChallengesService);

  // Create a challenge
  readonly createModalOpen = signal(false);
  readonly creating = signal(false);
  readonly createError = signal<string | null>(null);
  readonly created = signal<CustomChallengeResponse | null>(null);
  readonly newType = signal<ChallengeMechanic>('meals-in-period');
  newName = '';
  newDescription = '';
  newTarget = 10;
  newDuration = 14;

  // Join by invite code
  readonly joinModalOpen = signal(false);
  readonly joining = signal(false);
  readonly joinError = signal<string | null>(null);
  joinCode = '';

  // Members, fetched once per challenge
  private readonly members = signal<Record<string, ChallengeMemberResponse[]>>({});
  private readonly loadingMembers = new Set<string>();

  ngOnInit() {
    void this.builtIn.init();
    this.builtIn.refreshCounts();
    void this.custom.init().then(() => this.custom.refresh(() => this.loadAllMembers()));
  }

  challenges(): ChallengeDefinition[] {
    return this.builtIn.definitions();
  }

  progressOf(def: ChallengeDefinition): ChallengeProgress | null {
    return this.builtIn.progress(def);
  }

  participants(def: ChallengeDefinition): number | null {
    return this.builtIn.count(def.id);
  }

  join(def: ChallengeDefinition) {
    this.builtIn.join(def.id);
  }

  leave(def: ChallengeDefinition) {
    this.builtIn.leave(def.id);
  }

  restart(def: ChallengeDefinition) {
    this.builtIn.leave(def.id);
    this.builtIn.join(def.id);
  }

  customChallenges(): CustomChallengeResponse[] {
    return this.custom.list();
  }

  customProgress(challenge: CustomChallengeResponse): ChallengeProgress | null {
    return this.custom.progress(challenge);
  }

  membersOf(challengeId: string): ChallengeMemberResponse[] {
    return this.members()[challengeId] ?? [];
  }

  extraMembers(challengeId: string): number {
    return Math.max(0, this.membersOf(challengeId).length - 5);
  }

  openCreate() {
    this.createError.set(null);
    this.created.set(null);
    this.newName = '';
    this.newDescription = '';
    this.newType.set('meals-in-period');
    this.newTarget = 10;
    this.newDuration = 14;
    this.createModalOpen.set(true);
  }

  isStreak(): boolean {
    return this.newType() === 'streak';
  }

  submitCreate() {
    const name = this.newName.trim();
    if (!name) {
      this.createError.set('Give your challenge a name.');
      return;
    }
    if (this.newTarget < 1) {
      this.createError.set('Target needs to be at least 1.');
      return;
    }
    // A streak only needs its length; it gets the same small buffer as the built-in "3-Day Cooking Streak".
    const durationDays = this.isStreak() ? this.newTarget + 2 : this.newDuration;
    if (durationDays < this.newTarget) {
      this.createError.set('Duration needs to be at least as long as the target.');
      return;
    }

    this.creating.set(true);
    this.createError.set(null);
    this.custom.create(
      name,
      this.newDescription.trim() || undefined,
      this.newType(),
      this.newTarget,
      durationDays,
      (challenge) => {
        this.creating.set(false);
        this.created.set(challenge);
      },
      (message) => {
        this.creating.set(false);
        this.createError.set(message);
      },
    );
  }

  openJoin() {
    this.joinError.set(null);
    this.joinCode = '';
    this.joinModalOpen.set(true);
  }

  submitJoin() {
    const code = this.joinCode.trim();
    if (!code) {
      this.joinError.set('Enter a code first.');
      return;
    }
    this.joining.set(true);
    this.joinError.set(null);
    this.custom.joinByCode(
      code,
      () => {
        this.joining.set(false);
        this.joinModalOpen.set(false);
      },
      (message) => {
        this.joining.set(false);
        this.joinError.set(message);
      },
    );
  }

  async share(challenge: CustomChallengeResponse) {
    try {
      await Share.share({
        title: challenge.name,
        text: `Join my "${challenge.name}" challenge on Sanelle! Use code ${challenge.inviteCode} in the app to join me.`,
        dialogTitle: 'Invite someone to your challenge',
      });
    } catch {
      // Share sheet dismissed, or unavailable on this platform: nothing to show.
    }
  }

  private loadAllMembers() {
    for (const challenge of this.custom.list()) this.loadMembers(challenge.id);
  }

  private loadMembers(challengeId: string) {
    if (this.members()[challengeId] || this.loadingMembers.has(challengeId)) return;
    this.loadingMembers.add(challengeId);
    this.custom.getMembers(challengeId).subscribe({
      next: (list) => {
        this.members.update((all) => ({ ...all, [challengeId]: list }));
        this.loadingMembers.delete(challengeId);
      },
      error: () => this.loadingMembers.delete(challengeId),
    });
  }
}
