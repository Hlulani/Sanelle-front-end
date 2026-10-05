import type { Page } from '@playwright/test';
import { AccountScreen, RegisterScreen, SignInScreen } from './pages/auth';
import { DiagnosisFlow } from './pages/diagnosis';
import { LearnScreen } from './pages/learn';
import { NourishScreen } from './pages/nourish';
import { SummaryScreen } from './pages/summary';
import { TodayScreen } from './pages/today';

/** The app as a whole: one entry point to every screen a test needs. */
export class SanelleApp {
  readonly signIn: SignInScreen;
  readonly register: RegisterScreen;
  readonly account: AccountScreen;
  readonly today: TodayScreen;
  readonly diagnosis: DiagnosisFlow;
  readonly learn: LearnScreen;
  readonly nourish: NourishScreen;
  readonly summary: SummaryScreen;

  constructor(readonly page: Page) {
    this.signIn = new SignInScreen(page);
    this.register = new RegisterScreen(page);
    this.account = new AccountScreen(page);
    this.today = new TodayScreen(page);
    this.diagnosis = new DiagnosisFlow(page);
    this.learn = new LearnScreen(page);
    this.nourish = new NourishScreen(page);
    this.summary = new SummaryScreen(page);
  }
}
