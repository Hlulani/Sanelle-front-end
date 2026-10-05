import { expect } from '@playwright/test';
import { type } from '../screen';
import { ScreenObject } from './screen-object';

export interface Detail {
  question: string;
  field: string;
  value: string;
}

/** The five diagnosis questions, one screen each. */
export class DiagnosisFlow extends ScreenObject {
  /** Answers one question with what the report says. */
  async record(detail: Detail, save = 'Save and continue'): Promise<void> {
    await this.arrive(this.heading(detail.question));
    await this.page.getByRole('radio', { name: 'I have this information' }).tap();
    await type(this.page.getByRole('textbox', { name: detail.field }), detail.value);
    await this.button(save, true).tap();
  }

  /** Leaves a detail unknown; its suggested question is saved unless `addQuestion` is false. */
  async leaveUnknown(question: string, suggested: string, addQuestion = true, save = 'Save and continue'): Promise<void> {
    await this.arrive(this.heading(question));
    await this.page.getByRole('radio', { name: 'I don’t know' }).tap();
    await expect(this.page.getByText(`“${suggested}”`)).toBeVisible();
    const add = this.page.getByRole('checkbox', { name: 'Add to my questions' });
    await expect(add).toBeChecked();
    if (!addQuestion) await add.uncheck();
    await this.button(save, true).tap();
  }

  async summary(): Promise<{ recorded: string; notRecorded: string; questions: string }> {
    await this.arrive(this.heading('Here’s what you have so far'));
    const line = (title: RegExp) => this.page.locator('.line').filter({ has: this.page.getByRole('heading', { name: title }) });
    const read = async (title: RegExp) => ({
      count: (await line(title).locator('.num').innerText()).trim(),
      names: (await line(title).locator('.names').innerText()).trim(),
    });
    const recorded = await read(/^Recorded$/);
    const notRecorded = await read(/^Not recorded$/);
    const questions = await read(/for your appointment$/);
    return { recorded: `${recorded.count}: ${recorded.names}`, notRecorded: `${notRecorded.count}: ${notRecorded.names}`, questions: questions.count };
  }

  /** Leaves the results screen for Today. */
  async done(): Promise<void> {
    await this.button('Done', true).tap();
    await this.arrive(this.heading(/^Hi /));
  }

  async seeQuestions(): Promise<void> {
    await this.link('See my questions').tap();
    await this.arrive(this.heading('Your questions'));
  }
}
