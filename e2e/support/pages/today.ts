import { ScreenObject } from './screen-object';

export class TodayScreen extends ScreenObject {
  async open(): Promise<void> {
    await this.page.getByRole('tab', { name: 'Today' }).tap();
    await this.arrive(this.heading(/^Hi /));
  }

  readonly lead = () => this.page.locator('section.next');

  async startDiagnosis(): Promise<void> {
    await this.button('Enter details myself').tap();
  }

  async exploreFoodQuestions(): Promise<void> {
    await this.link(/Explore food questions/).tap();
  }

  async planMeals(): Promise<void> {
    await this.link(/Plan my meals/).tap();
  }
}
